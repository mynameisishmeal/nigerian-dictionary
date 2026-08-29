import prisma from './src/lib/prisma';
import { syncWordToAlgolia } from './src/lib/algolia';

async function splitJapa() {
  console.log('--- Inspecting and Splitting Japa / Jápá in Database ---');

  // Find all words with japa or jápá
  const words = await prisma.word.findMany({
    where: {
      OR: [
        { normalizedTerm: { contains: 'japa', mode: 'insensitive' } },
        { normalizedTerm: { contains: 'jápá', mode: 'insensitive' } },
        { displayTerm: { contains: 'japa', mode: 'insensitive' } },
        { displayTerm: { contains: 'jápá', mode: 'insensitive' } },
      ],
    },
    include: { definitions: true },
  });

  console.log(`Found ${words.length} matching words:`, JSON.stringify(words, null, 2));

  // Find existing Japa entry
  const mainJapa = words.find((w) => w.displayTerm.toLowerCase() === 'japa' || w.normalizedTerm === 'japa');

  if (mainJapa) {
    const yorubaDef = mainJapa.definitions.find((d) => d.dialect === 'Yoruba' || d.meaning.toLowerCase().includes('escape'));
    const nonYorubaDefs = mainJapa.definitions.filter((d) => d.id !== yorubaDef?.id);

    // 1. Ensure Japa exists as Urban Slang
    await prisma.word.update({
      where: { id: mainJapa.id },
      data: {
        displayTerm: 'Japa',
        normalizedTerm: 'japa',
        languageFamily: 'Urban Slang',
        aliases: ['Jápá'],
      },
    });

    // 2. Create or update Jápá as Yoruba
    let japaYoruba = await prisma.word.findFirst({
      where: {
        OR: [
          { normalizedTerm: 'jápá' },
          { displayTerm: 'Jápá' },
        ],
      },
      include: { definitions: true },
    });

    if (!japaYoruba) {
      japaYoruba = await prisma.word.create({
        data: {
          normalizedTerm: 'jápá',
          displayTerm: 'Jápá',
          languageFamily: 'Yoruba',
          aliases: ['Japa'],
          commonStates: [],
        },
        include: { definitions: true },
      });
      console.log('Created distinct Jápá (Yoruba) word record.');
    } else {
      await prisma.word.update({
        where: { id: japaYoruba.id },
        data: {
          displayTerm: 'Jápá',
          normalizedTerm: 'jápá',
          languageFamily: 'Yoruba',
          aliases: ['Japa'],
        },
      });
    }

    // 3. Move Yoruba definition to Jápá
    if (yorubaDef) {
      await prisma.definition.update({
        where: { id: yorubaDef.id },
        data: {
          wordId: japaYoruba.id,
        },
      });
      console.log('Moved Yoruba definition to Jápá.');
    }

    // 4. Sync both to Algolia
    const updatedJapa = await prisma.word.findUnique({
      where: { id: mainJapa.id },
      include: { definitions: { orderBy: { netScore: 'desc' } } },
    });
    if (updatedJapa && updatedJapa.definitions[0]) {
      await syncWordToAlgolia({
        id: updatedJapa.id,
        normalizedTerm: updatedJapa.normalizedTerm,
        displayTerm: updatedJapa.displayTerm,
        aliases: updatedJapa.aliases,
        meaning: updatedJapa.definitions[0].meaning,
        example: updatedJapa.definitions[0].example,
        languageFamily: updatedJapa.definitions[0].dialect || updatedJapa.languageFamily,
        netScore: updatedJapa.definitions[0].netScore,
      });
    }

    const updatedJapaYoruba = await prisma.word.findUnique({
      where: { id: japaYoruba.id },
      include: { definitions: { orderBy: { netScore: 'desc' } } },
    });
    if (updatedJapaYoruba && updatedJapaYoruba.definitions[0]) {
      await syncWordToAlgolia({
        id: updatedJapaYoruba.id,
        normalizedTerm: updatedJapaYoruba.normalizedTerm,
        displayTerm: updatedJapaYoruba.displayTerm,
        aliases: updatedJapaYoruba.aliases,
        meaning: updatedJapaYoruba.definitions[0].meaning,
        example: updatedJapaYoruba.definitions[0].example,
        languageFamily: updatedJapaYoruba.definitions[0].dialect || updatedJapaYoruba.languageFamily,
        netScore: updatedJapaYoruba.definitions[0].netScore,
      });
    }

    console.log('Successfully split Japa and Jápá and synced to Algolia!');
  }
}

splitJapa()
  .catch((e) => console.error('Error splitting Japa:', e))
  .finally(async () => {
    await prisma.$disconnect();
  });
