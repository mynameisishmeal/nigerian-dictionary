import prisma from './src/lib/prisma';

async function splitShakara() {
  console.log('--- Splitting Shakara and Sákárà in Database ---');

  // Find existing shakara record
  const shakaraWord = await prisma.word.findUnique({
    where: { normalizedTerm: 'shakara' },
    include: { definitions: true },
  });

  if (!shakaraWord) {
    console.log('No shakara word found.');
    return;
  }

  // Find Yoruba definition
  const yorubaDef = shakaraWord.definitions.find((d) => d.dialect === 'Yoruba');
  const pidginDefs = shakaraWord.definitions.filter((d) => d.dialect !== 'Yoruba');

  // 1. Update shakara to be Nigerian Pidgin and link alias "sákárà"
  await prisma.word.update({
    where: { id: shakaraWord.id },
    data: {
      languageFamily: 'Nigerian Pidgin',
      aliases: ['sákárà', 'sakara'],
    },
  });

  // 2. Create or update sákárà as Yoruba
  let sakaraWord = await prisma.word.findUnique({
    where: { normalizedTerm: 'sakara' },
    include: { definitions: true },
  });

  if (!sakaraWord) {
    sakaraWord = await prisma.word.create({
      data: {
        normalizedTerm: 'sakara',
        displayTerm: 'sákárà',
        languageFamily: 'Yoruba',
        aliases: ['shakara'],
        commonStates: [],
      },
      include: { definitions: true },
    });
  }

  // 3. Move Yoruba definition to sákárà
  if (yorubaDef) {
    await prisma.definition.update({
      where: { id: yorubaDef.id },
      data: {
        wordId: sakaraWord.id,
      },
    });
    console.log('Moved Yoruba definition to sákárà.');
  }

  console.log('Successfully split shakara and sákárà into distinct words!');
}

splitShakara()
  .catch((e) => console.error('Error splitting shakara:', e))
  .finally(async () => {
    await prisma.$disconnect();
  });
