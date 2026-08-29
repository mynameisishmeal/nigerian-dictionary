import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Word of the day: deterministic seed from the current day so it stays same all day
function getDayIndex(total: number): number {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return dayOfYear % total;
}

type WordRow = {
  id: string;
  displayTerm: string;
  normalizedTerm: string;
  languageFamily: string | null;
  createdAt: Date;
};

type DefinitionRow = {
  id: string;
  wordId: string;
  meaning: string;
  example: string | null;
  netScore: number;
};

type ContributorRow = {
  id: string;
  name: string;
  firstName: string | null;
  image: string | null;
  reputationScore: number;
  definitionCount: bigint;
};

export async function GET() {
  try {
    // Use $queryRaw for word queries to bypass Prisma's prepared statement cache.
    // This avoids Neon PgBouncer "cached plan must not change result type" (0A000) errors
    // that occur after ALTER TABLE operations on timestamp columns.
    const [totalWords, totalDefinitions, totalContributors] = await Promise.all([
      prisma.word.count(),
      prisma.definition.count(),
      prisma.user.count(),
    ]);

    // Recently added words with their top definition — single LATERAL JOIN avoids
    // the text=uuid type mismatch when passing UUID arrays as $queryRaw params
    type RecentWordResult = WordRow & {
      def_id: string | null;
      meaning: string | null;
      example: string | null;
      netScore: number | null;
    };

    const recentRaw = await prisma.$queryRaw<RecentWordResult[]>`
      SELECT
        w.id, w."displayTerm", w."normalizedTerm", w."languageFamily", w."createdAt",
        d.id AS def_id, d.meaning, d.example, d."netScore"
      FROM public.word w
      LEFT JOIN LATERAL (
        SELECT id, meaning, example, "netScore"
        FROM public.definition
        WHERE "wordId" = w.id
        ORDER BY "netScore" DESC
        LIMIT 1
      ) d ON true
      WHERE w."languageFamily" IS NULL OR LOWER(w."languageFamily") != 'wolof'
      ORDER BY w."createdAt" DESC
      LIMIT 8
    `;

    const recentWords = recentRaw.map((row) => ({
      id: row.id,
      displayTerm: row.displayTerm,
      normalizedTerm: row.normalizedTerm,
      languageFamily: row.languageFamily,
      createdAt: row.createdAt,
      definitions: row.def_id
        ? [{ id: row.def_id, wordId: row.id, meaning: row.meaning!, example: row.example, netScore: row.netScore! }]
        : [],
    }));



    // Word of the Day — single query using OFFSET for deterministic day selection.
    // No UUID params passed — avoids the text=uuid type mismatch entirely.
    const totalWordCount = await prisma.word.count();
    let wordOfTheDay = null;
    if (totalWordCount > 0) {
      const dayOffset = getDayIndex(totalWordCount);
      type WotdResult = WordRow & {
        def_id: string | null;
        meaning: string | null;
        example: string | null;
        netScore: number | null;
      };
      const wotdRows = await prisma.$queryRaw<WotdResult[]>`
        SELECT
          w.id, w."displayTerm", w."normalizedTerm", w."languageFamily", w."createdAt",
          d.id AS def_id, d.meaning, d.example, d."netScore"
        FROM public.word w
        LEFT JOIN LATERAL (
          SELECT id, meaning, example, "netScore"
          FROM public.definition
          WHERE "wordId" = w.id
          ORDER BY "netScore" DESC
          LIMIT 1
        ) d ON true
        ORDER BY w."createdAt" ASC
        LIMIT 1 OFFSET ${dayOffset}
      `;
      if (wotdRows.length > 0) {
        const row = wotdRows[0];
        wordOfTheDay = {
          id: row.id,
          displayTerm: row.displayTerm,
          normalizedTerm: row.normalizedTerm,
          languageFamily: row.languageFamily,
          createdAt: row.createdAt,
          definitions: row.def_id
            ? [{ id: row.def_id, wordId: row.id, meaning: row.meaning!, example: row.example, netScore: row.netScore! }]
            : [],
        };
      }
    }


    // Top 5 contributors by reputation score
    const topContributorsRaw = await prisma.$queryRaw<ContributorRow[]>`
      SELECT u.id, u.name, u."firstName", u.image, u."reputationScore",
             COUNT(d.id) AS "definitionCount"
      FROM public.user u
      LEFT JOIN public.definition d ON d."authorId" = u.id
      GROUP BY u.id, u.name, u."firstName", u.image, u."reputationScore"
      ORDER BY u."reputationScore" DESC
      LIMIT 5
    `;
    const topContributors = topContributorsRaw.map((c) => ({
      ...c,
      definitionCount: Number(c.definitionCount),
      _count: { definitions: Number(c.definitionCount) },
    }));

    // Language families for tag explorer
    const langRows = await prisma.$queryRaw<{ languageFamily: string }[]>`
      SELECT DISTINCT "languageFamily"
      FROM public.word
      WHERE "languageFamily" IS NOT NULL
      ORDER BY "languageFamily"
    `;
    
    // Sort logic to prioritize specific languages in the exact order requested
    const preferredOrder = ["Pidgin", "Yoruba", "Hausa", "Igbo", "Edo", "Efik"];
    const languageFamilies = langRows
      .map((r) => r.languageFamily)
      .filter((lang) => lang.toLowerCase() !== 'wolof') // Explicitly exclude Wolof
      .sort((a, b) => {
        const idxA = preferredOrder.indexOf(a);
        const idxB = preferredOrder.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB; // Both in preferred list, sort by array order
        if (idxA !== -1) return -1; // Only A is in preferred list
        if (idxB !== -1) return 1;  // Only B is in preferred list
        return a.localeCompare(b); // Neither in preferred list, fallback to alphabetical
      });


    return NextResponse.json({
      stats: { totalWords, totalDefinitions, totalContributors },
      wordOfTheDay,
      recentWords,
      topContributors,
      languageFamilies,
    });
  } catch (error) {
    console.error('home-stats error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
