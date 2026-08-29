import prisma from './src/lib/prisma';

async function main() {
  const words = await prisma.word.findMany({
    where: {
      OR: [
        { normalizedTerm: { contains: 'sakara', mode: 'insensitive' } },
        { normalizedTerm: { contains: 'shakara', mode: 'insensitive' } },
        { displayTerm: { contains: 'sakara', mode: 'insensitive' } },
        { displayTerm: { contains: 'shakara', mode: 'insensitive' } },
      ],
    },
    include: {
      definitions: true,
    },
  });

  console.log('=== DB QUERY RESULT FOR SHAKARA / SAKARA ===');
  console.log(JSON.stringify(words, null, 2));
  console.log('============================================');
}

main()
  .catch((e) => {
    console.error('Error querying DB:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
