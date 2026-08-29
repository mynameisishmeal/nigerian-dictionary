import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth-server';
import { isSuperAdminUser } from '@/lib/admin-auth';

function getPhoneticSearchVariants(query: string): string[] {
  const clean = query.trim();
  const lower = clean.toLowerCase();
  const normalized = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const cap = clean.charAt(0).toUpperCase() + clean.slice(1);
  const capNorm = normalized.charAt(0).toUpperCase() + normalized.slice(1);

  const variants = new Set<string>([
    clean,
    lower,
    cap,
    normalized,
    capNorm,
  ]);

  // Handle s <-> sh / ṣ (e.g. shakara <-> sakara / ṣákárà)
  if (normalized.includes('sh')) {
    const s = normalized.replace(/sh/g, 's');
    variants.add(s);
    variants.add(s.charAt(0).toUpperCase() + s.slice(1));
  } else if (normalized.includes('s')) {
    const sh = normalized.replace(/s/g, 'sh');
    variants.add(sh);
    variants.add(sh.charAt(0).toUpperCase() + sh.slice(1));
  }

  // Handle c <-> k (e.g. colo <-> kolo)
  if (normalized.includes('c')) {
    const k = normalized.replace(/c/g, 'k');
    variants.add(k);
    variants.add(k.charAt(0).toUpperCase() + k.slice(1));
  } else if (normalized.includes('k')) {
    const c = normalized.replace(/k/g, 'c');
    variants.add(c);
    variants.add(c.charAt(0).toUpperCase() + c.slice(1));
  }

  // Handle kp <-> p
  if (normalized.includes('kp')) {
    const p = normalized.replace(/kp/g, 'p');
    variants.add(p);
    variants.add(p.charAt(0).toUpperCase() + p.slice(1));
  }

  return Array.from(variants).filter(Boolean);
}

export async function POST(req: NextRequest) {
  try {
    const { data: sessionData } = await auth.getSession();

    if (!sessionData?.user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired session' }, { status: 401 });
    }

    const body = await req.json();
    const { word, origin, aliases: inputAliases } = body;

    if (!word || !word.trim()) {
      return NextResponse.json({ error: 'Word is required' }, { status: 400 });
    }

    // Normalize incoming definition list (supports both new multi-definition format and legacy single format)
    let rawDefinitions: Array<{
      meaning: string;
      dialect?: string | null;
      example?: string | null;
      examples?: string[];
    }> = [];

    if (Array.isArray(body.definitions) && body.definitions.length > 0) {
      rawDefinitions = body.definitions.filter((d: any) => d && d.meaning && d.meaning.trim());
    } else if (body.meaning && body.meaning.trim()) {
      rawDefinitions = [
        {
          meaning: body.meaning.trim(),
          dialect: body.origin?.trim() || null,
          example: body.example?.trim() || null,
          examples: Array.isArray(body.examples) ? body.examples : body.example ? [body.example.trim()] : [],
        },
      ];
    }

    if (rawDefinitions.length === 0) {
      return NextResponse.json({ error: 'At least one meaning / definition is required' }, { status: 400 });
    }

    // Preserve exact diacritics in normalizedTerm (lowercased) so that 'jápá' and 'japa', 'ṣákárà' and 'shakara' are distinct records
    const normalizedTerm = word.toLowerCase().trim();
    const strippedTerm = word.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const displayTerm = word.trim();
    const primaryDialect = rawDefinitions[0]?.dialect?.trim() || origin?.trim() || null;

    // Collect and sanitize aliases
    const collectedAliases = new Set<string>();
    if (Array.isArray(inputAliases)) {
      inputAliases.forEach((a: string) => {
        if (a && typeof a === 'string' && a.trim() && a.trim().toLowerCase() !== displayTerm.toLowerCase()) {
          collectedAliases.add(a.trim());
        }
      });
    }

    // Mutually register stripped or diacritic versions into aliases if different
    if (strippedTerm !== normalizedTerm) {
      collectedAliases.add(strippedTerm);
    }

    // Ensure user exists in public schema (sync from neon_auth)
    const existingAuthors: any[] = await prisma.$queryRawUnsafe(
      `SELECT "id", "name", "email", "role", "primaryLanguage" FROM "user" WHERE "id" = $1 LIMIT 1`,
      sessionData.user.id
    );

    let authorUser = existingAuthors[0] || null;

    if (!authorUser) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "user" ("id", "name", "email", "emailVerified", "image", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT ("id") DO NOTHING`,
        sessionData.user.id,
        sessionData.user.name || 'Anonymous',
        sessionData.user.email || '',
        !!sessionData.user.emailVerified,
        sessionData.user.image || null
      );
      authorUser = {
        id: sessionData.user.id,
        name: sessionData.user.name || 'Anonymous',
        email: sessionData.user.email || '',
        role: 'user',
        primaryLanguage: null,
      };
    }

    // Heritage Language Protection & Anti-Spam Check
    const isSuperAdmin = isSuperAdminUser({
      email: sessionData.user.email || authorUser?.email,
      role: authorUser?.role,
    });

    const isPrivileged = authorUser?.role === 'contributor' || authorUser?.role === 'elder' || authorUser?.role === 'admin' || isSuperAdmin;
    const userPrimaryLang = authorUser?.primaryLanguage?.toLowerCase().trim();

    if (!isPrivileged && userPrimaryLang) {
      const allowedDialects = new Set<string>([
        userPrimaryLang,
        'nigerian pidgin',
        'pidgin',
        'urban slang',
        'slang',
      ]);

      for (const item of rawDefinitions) {
        const itemDialect = (item.dialect || '').toLowerCase().trim();
        if (itemDialect) {
          const isAllowed = Array.from(allowedDialects).some(
            (allowed) => itemDialect.includes(allowed) || allowed.includes(itemDialect)
          );

          if (!isAllowed) {
            return NextResponse.json(
              {
                error: `Linguistic Heritage Policy: Regular members can contribute in their registered language (${authorUser.primaryLanguage}), Nigerian Pidgin, or Urban Slang. Reach Contributor status to contribute across all 500+ languages.`,
              },
              { status: 403 }
            );
          }
        }
      }
    }

    // Process creation / merge with expanded timeout
    const result = await prisma.$transaction(
      async (tx: any) => {
        // 1. Find or create primary word
        let wordRecord = await tx.word.findUnique({
          where: { normalizedTerm },
          include: { definitions: true },
        });

        if (!wordRecord) {
          wordRecord = await tx.word.create({
            data: {
              normalizedTerm,
              displayTerm,
              aliases: Array.from(collectedAliases),
              languageFamily: primaryDialect,
              commonStates: [],
            },
            include: { definitions: true },
          });
        } else if (collectedAliases.size > 0) {
          const mergedAliases = Array.from(new Set([...(wordRecord.aliases || []), ...Array.from(collectedAliases)]));
          wordRecord = await tx.word.update({
            where: { id: wordRecord.id },
            data: { aliases: mergedAliases, displayTerm },
            include: { definitions: true },
          });
        }

        const createdDefinitions: any[] = [];

        // Determine if definitions should be split across dialects
        for (const item of rawDefinitions) {
          const cleanMeaning = item.meaning.trim();
          const itemDialect = item.dialect?.trim() || primaryDialect;
          const isItemYoruba = itemDialect?.toLowerCase().includes('yoruba') || /[ṣẹọ\u0300-\u036f]/.test(displayTerm);
          
          let cleanExamples: string[] = [];
          if (Array.isArray(item.examples)) {
            cleanExamples = item.examples.map((ex: string) => ex.trim()).filter((ex: string) => ex.length > 0);
          } else if (item.example && item.example.trim()) {
            cleanExamples = [item.example.trim()];
          }

          const primaryExample = cleanExamples[0] || item.example?.trim() || null;

          // Check if definition already exists
          const existingDef = await tx.definition.findUnique({
            where: {
              wordId_meaning: {
                wordId: wordRecord.id,
                meaning: cleanMeaning,
              },
            },
          });

          if (!existingDef) {
            const defRecord = await tx.definition.create({
              data: {
                wordId: wordRecord.id,
                meaning: cleanMeaning,
                dialect: itemDialect,
                example: primaryExample,
                examples: cleanExamples,
                authorId: sessionData.user.id,
                netScore: 0,
              },
            });
            createdDefinitions.push(defRecord);
          }
        }

        // 3. AUTOMATIC COGNATE EXPANSION: Create/Link distinct Word entities for each orthographic alias
        for (const alias of Array.from(collectedAliases)) {
          const aliasNormalized = alias.toLowerCase().trim();
          if (aliasNormalized && aliasNormalized !== normalizedTerm) {
            const isYoruba = /[ṣẹọ\u0300-\u036f]/.test(alias) || alias.toLowerCase().startsWith('sak');
            const aliasDialect = isYoruba ? 'Yoruba' : (primaryDialect?.toLowerCase().includes('yoruba') ? 'Nigerian Pidgin' : primaryDialect);
            const reciprocalAliases = Array.from(new Set([displayTerm, ...Array.from(collectedAliases)])).filter(
              (a) => a.toLowerCase() !== alias.toLowerCase()
            );

            let aliasWord = await tx.word.findUnique({
              where: { normalizedTerm: aliasNormalized },
              include: { definitions: true },
            });

            if (!aliasWord) {
              aliasWord = await tx.word.create({
                data: {
                  normalizedTerm: aliasNormalized,
                  displayTerm: alias,
                  aliases: reciprocalAliases,
                  languageFamily: aliasDialect,
                  commonStates: [],
                },
                include: { definitions: true },
              });
            } else {
              const updatedRecip = Array.from(new Set([...(aliasWord.aliases || []), ...reciprocalAliases]));
              aliasWord = await tx.word.update({
                where: { id: aliasWord.id },
                data: { aliases: updatedRecip, displayTerm: alias },
                include: { definitions: true },
              });
            }

            // Find matching dialect definition or attach corresponding sense
            const matchingDef = rawDefinitions.find((d) => {
              const dDialect = d.dialect?.toLowerCase() || '';
              if (isYoruba) return dDialect.includes('yoruba');
              return !dDialect.includes('yoruba');
            }) || rawDefinitions[0];

            if (matchingDef) {
              const cleanMeaning = matchingDef.meaning.trim();
              const existingAliasDef = await tx.definition.findUnique({
                where: {
                  wordId_meaning: {
                    wordId: aliasWord.id,
                    meaning: cleanMeaning,
                  },
                },
              });

              if (!existingAliasDef) {
                let cleanExamples: string[] = [];
                if (Array.isArray(matchingDef.examples)) {
                  cleanExamples = matchingDef.examples.map((ex: string) => ex.trim()).filter((ex: string) => ex.length > 0);
                } else if (matchingDef.example && matchingDef.example.trim()) {
                  cleanExamples = [matchingDef.example.trim()];
                }

                await tx.definition.create({
                  data: {
                    wordId: aliasWord.id,
                    meaning: cleanMeaning,
                    dialect: matchingDef.dialect?.trim() || aliasDialect,
                    example: cleanExamples[0] || matchingDef.example?.trim() || null,
                    examples: cleanExamples,
                    authorId: sessionData.user.id,
                    netScore: 0,
                  },
                });
              }
            }
          }
        }

        if (createdDefinitions.length === 0 && rawDefinitions.length > 0 && wordRecord.definitions.length > 0) {
          throw new Error('All submitted definitions already exist for this word.');
        }

        return { wordId: wordRecord.id, createdDefinitions };
      },
      {
        maxWait: 10000,
        timeout: 20000,
      }
    );

    // Fetch the updated word with all definitions outside transaction for optimal latency
    const updatedWord = await prisma.word.findUnique({
      where: { id: result.wordId },
      include: {
        definitions: {
          orderBy: { netScore: 'desc' },
        },
      },
    });

    // Fire-and-forget Algolia sync with top definition
    if (updatedWord && updatedWord.definitions.length > 0) {
      const topDef = updatedWord.definitions[0];
      import('@/lib/algolia')
        .then(({ syncWordToAlgolia }) => {
          syncWordToAlgolia({
            id: updatedWord.id,
            normalizedTerm: updatedWord.normalizedTerm,
            displayTerm: updatedWord.displayTerm,
            aliases: updatedWord.aliases || [],
            meaning: topDef.meaning,
            example: topDef.example,
            languageFamily: topDef.dialect || updatedWord.languageFamily,
            netScore: topDef.netScore,
          });
        })
        .catch((e) => console.error('Algolia sync failed', e));
    }

    return NextResponse.json({ word: updatedWord, createdDefinitions: result.createdDefinitions }, { status: 201 });
  } catch (error: any) {
    console.error('API Error:', error);
    if (error.message?.includes('already exist for this word')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    
    if (!query || !query.trim()) {
      const recentWords = await prisma.word.findMany({
        include: {
          definitions: {
            orderBy: { netScore: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      return NextResponse.json(recentWords);
    }

    const cleanQuery = query.trim();
    const normalizedQuery = cleanQuery.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const searchVariants = getPhoneticSearchVariants(cleanQuery);

    const words = await prisma.word.findMany({
      where: {
        OR: [
          { normalizedTerm: { in: searchVariants } },
          { normalizedTerm: { contains: normalizedQuery, mode: 'insensitive' } },
          { displayTerm: { contains: cleanQuery, mode: 'insensitive' } },
          { aliases: { hasSome: searchVariants } },
        ],
      },
      include: {
        definitions: {
          orderBy: { netScore: 'desc' },
        },
      },
      take: 25,
    });

    function getMatchScore(w: any): number {
      const display = w.displayTerm.toLowerCase();
      const norm = w.normalizedTerm.toLowerCase();
      const q = cleanQuery.toLowerCase();
      const qNorm = normalizedQuery.toLowerCase();

      // 1. Literal exact character & diacritic match (e.g. "jápá" === "jápá" or "japa" === "japa")
      if (display === q) return 1000;

      // 2. Literal exact match in aliases
      if (w.aliases && w.aliases.some((al: string) => al.toLowerCase() === q)) {
        return 950;
      }

      // 3. Normalized stripped diacritic match (e.g. "japa" matching "jápá")
      if (display === qNorm || norm === qNorm) return 900;

      // 4. Normalized match in aliases
      if (w.aliases && w.aliases.some((al: string) => al.toLowerCase() === qNorm)) {
        return 850;
      }

      // 5. Starts with query
      if (display.startsWith(q) || norm.startsWith(qNorm)) return 500;

      // 6. Contains query
      if (display.includes(q) || norm.includes(qNorm)) return 300;

      return 100;
    }

    words.sort((a, b) => {
      const scoreDiff = getMatchScore(b) - getMatchScore(a);
      if (scoreDiff !== 0) return scoreDiff;
      return a.displayTerm.localeCompare(b.displayTerm);
    });

    return NextResponse.json(words);
  } catch (error) {
    console.error('GET API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
