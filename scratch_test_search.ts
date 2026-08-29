import prisma from './src/lib/prisma';

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

  if (normalized.includes('sh')) {
    const s = normalized.replace(/sh/g, 's');
    variants.add(s);
    variants.add(s.charAt(0).toUpperCase() + s.slice(1));
  } else if (normalized.includes('s')) {
    const sh = normalized.replace(/s/g, 'sh');
    variants.add(sh);
    variants.add(sh.charAt(0).toUpperCase() + sh.slice(1));
  }

  return Array.from(variants).filter(Boolean);
}

async function testSearch(q: string) {
  console.log(`\n================== TESTING SEARCH QUERY: "${q}" ==================`);
  const cleanQuery = q.trim();
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
  });

  function getMatchScore(w: any): number {
    const display = w.displayTerm.toLowerCase();
    const norm = w.normalizedTerm.toLowerCase();
    const cleanQ = cleanQuery.toLowerCase();
    const cleanQNorm = normalizedQuery.toLowerCase();

    if (display === cleanQ) return 1000;
    if (w.aliases && w.aliases.some((al: string) => al.toLowerCase() === cleanQ)) return 950;
    if (display === cleanQNorm || norm === cleanQNorm) return 900;
    if (w.aliases && w.aliases.some((al: string) => al.toLowerCase() === cleanQNorm)) return 850;
    if (display.startsWith(cleanQ) || norm.startsWith(cleanQNorm)) return 500;
    if (display.includes(cleanQ) || norm.includes(cleanQNorm)) return 300;
    return 100;
  }

  words.sort((a, b) => {
    const scoreDiff = getMatchScore(b) - getMatchScore(a);
    if (scoreDiff !== 0) return scoreDiff;
    return a.displayTerm.localeCompare(b.displayTerm);
  });

  console.log(`Returned ${words.length} results:`);
  words.forEach((w, idx) => {
    console.log(`  #${idx + 1} [Score: ${getMatchScore(w)}] Term: "${w.displayTerm}" (Origin: ${w.languageFamily})`);
    w.definitions.forEach((d) => {
      console.log(`      Sense [${d.dialect}]: ${d.meaning}`);
    });
  });
}

async function main() {
  await testSearch('Japa');
  await testSearch('Jápá');
  await testSearch('shakara');
  await testSearch('sákárà');
}

main().finally(() => prisma.$disconnect());
