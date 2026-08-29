import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const words = [
  {
    displayTerm: "wahala",
    normalizedTerm: "wahala",
    languageFamily: "Pidgin",
    definitions: [
      { meaning: "Trouble, stress, or a complicated situation. Often used to express exasperation.", example: "Why you dey cause wahala for this house?" },
      { meaning: "A serious problem or issue that is hard to resolve.", example: "That wahala no go ever finish." }
    ]
  },
  {
    displayTerm: "omo",
    normalizedTerm: "omo",
    languageFamily: "Yoruba",
    definitions: [
      { meaning: "An exclamation of surprise, admiration, or shock. Equivalent to 'wow' or 'oh my'.", example: "Omo! You see wetin dem do?" },
      { meaning: "Child or offspring in Yoruba. Used informally to address anyone.", example: "Omo, you too try." }
    ]
  },
  {
    displayTerm: "nawa",
    normalizedTerm: "nawa",
    languageFamily: "Pidgin",
    definitions: [
      { meaning: "An expression of disbelief, shock, or disappointment. Used when something is surprising or beyond expectation.", example: "Nawa o! See as dem just scatter the whole thing." }
    ]
  },
  {
    displayTerm: "abi",
    normalizedTerm: "abi",
    languageFamily: "Yoruba",
    definitions: [
      { meaning: "A rhetorical tag question meaning 'right?', 'isn't it?', or 'or not?'.", example: "You go come tomorrow, abi?" }
    ]
  },
  {
    displayTerm: "jollof",
    normalizedTerm: "jollof",
    languageFamily: "Wolof",
    definitions: [
      { meaning: "A popular West African rice dish cooked in a tomato-based sauce. Nigeria's version is considered the best.", example: "Party jollof hits different, I swear." }
    ]
  },
  {
    displayTerm: "oga",
    normalizedTerm: "oga",
    languageFamily: "Yoruba",
    definitions: [
      { meaning: "Boss, master, or superior. Used to address or refer to someone in authority.", example: "The oga at the top no know anything." }
    ]
  },
  {
    displayTerm: "sapa",
    normalizedTerm: "sapa",
    languageFamily: "Pidgin",
    definitions: [
      { meaning: "Severe poverty or being broke. The painful state of having absolutely no money.", example: "Sapa don hold me since month beginning." }
    ]
  },
  {
    displayTerm: "ehen",
    normalizedTerm: "ehen",
    languageFamily: "Edo",
    definitions: [
      { meaning: "An interjection expressing agreement, acknowledgement, or realisation. Like saying 'ah yes!' or 'exactly!'.", example: "Ehen! Now you understand wetin I dey tell you." }
    ]
  },
  {
    displayTerm: "pepper dem",
    normalizedTerm: "pepper dem",
    languageFamily: "Pidgin",
    definitions: [
      { meaning: "To show off or outshine others, especially those who doubted you. A motivational rallying cry.", example: "After dem fail you, you go pepper dem with your success." }
    ]
  },
  {
    displayTerm: "agbero",
    normalizedTerm: "agbero",
    languageFamily: "Yoruba",
    definitions: [
      { meaning: "A tout or ruffian, typically found at motor parks collecting fees aggressively. Used to describe a thuggish person.", example: "That area full of agbero wey go collect your money by force." }
    ]
  },
  {
    displayTerm: "ginger",
    normalizedTerm: "ginger",
    languageFamily: "Pidgin",
    definitions: [
      { meaning: "To motivate, hype up, or excite someone. Can also mean to style or dress up.", example: "The speech ginger everybody for the room." }
    ]
  },
  {
    displayTerm: "shayo",
    normalizedTerm: "shayo",
    languageFamily: "Yoruba",
    definitions: [
      { meaning: "To be drunk or intoxicated from alcohol. Derived from the Yoruba word for palmwine drinking.", example: "He reach the party and just shayo himself to stupor." }
    ]
  },
  {
    displayTerm: "aso-ebi",
    normalizedTerm: "aso ebi",
    languageFamily: "Yoruba",
    definitions: [
      { meaning: "Coordinated fabric worn by family or friends at a celebration to show solidarity and belonging.", example: "The aso-ebi for her wedding was a beautiful shade of purple." }
    ]
  },
  {
    displayTerm: "kparachukwu",
    normalizedTerm: "kparachukwu",
    languageFamily: "Igbo",
    definitions: [
      { meaning: "An expression meaning 'God forbid' used to reject a curse or negative statement.", example: "Kparachukwu! I will never be poor in this life." }
    ]
  },
  {
    displayTerm: "suya",
    normalizedTerm: "suya",
    languageFamily: "Hausa",
    definitions: [
      { meaning: "Spiced grilled meat skewers, a popular Nigerian street food originating from the North.", example: "Abeg, make we go buy suya after work." }
    ]
  }
];

async function main() {
  console.log("Seeding database with Nigerian words...");
  let created = 0;
  let skipped = 0;

  for (const w of words) {
    const existing = await prisma.word.findUnique({ where: { normalizedTerm: w.normalizedTerm } });
    if (existing) {
      console.log(`  SKIP: "${w.displayTerm}" already exists`);
      skipped++;
      continue;
    }

    const wordRecord = await prisma.word.create({
      data: {
        displayTerm: w.displayTerm,
        normalizedTerm: w.normalizedTerm,
        languageFamily: w.languageFamily,
        commonStates: [],
      }
    });

    // We need a system/seed user - use first user or create a placeholder
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) {
      console.log("  WARN: No user found in DB. Definitions will be skipped. Create an account first.");
      created++;
      continue;
    }

    for (const def of w.definitions) {
      await prisma.definition.upsert({
        where: { wordId_meaning: { wordId: wordRecord.id, meaning: def.meaning } },
        update: {},
        create: {
          wordId: wordRecord.id,
          authorId: firstUser.id,
          meaning: def.meaning,
          example: def.example ?? null,
          netScore: 0,
        }
      });
    }

    console.log(`  OK: "${w.displayTerm}" (${w.languageFamily})`);
    created++;
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
