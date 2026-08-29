import prisma from './src/lib/prisma';
import { syncWordToAlgolia } from './src/lib/algolia';

async function reindex() {
  const words = await prisma.word.findMany({
    include: {
      definitions: {
        orderBy: { netScore: 'desc' },
      },
    },
  });

  console.log(`Syncing ${words.length} words to Algolia...`);

  for (const word of words) {
    const topDef = word.definitions[0];
    if (topDef) {
      await syncWordToAlgolia({
        id: word.id,
        normalizedTerm: word.normalizedTerm,
        displayTerm: word.displayTerm,
        aliases: word.aliases || [],
        meaning: topDef.meaning,
        example: topDef.example,
        languageFamily: topDef.dialect || word.languageFamily,
        netScore: topDef.netScore,
      });
      console.log(`Synced: ${word.displayTerm} (${word.languageFamily})`);
    }
  }

  console.log('Algolia re-indexing complete!');
}

reindex()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
