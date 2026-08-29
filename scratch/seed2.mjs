import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const words = [
  { display: "wahala", normalized: "wahala", lang: "Pidgin", defs: [{ m: "Trouble, stress, or a complicated situation. Often used to express exasperation.", e: "Why you dey cause wahala for this house?" }] },
  { display: "omo", normalized: "omo", lang: "Yoruba", defs: [{ m: "An exclamation of surprise, admiration, or shock. Equivalent to wow or oh my.", e: "Omo! You see wetin dem do?" }] },
  { display: "nawa", normalized: "nawa", lang: "Pidgin", defs: [{ m: "An expression of disbelief, shock, or disappointment. Used when something is surprising or beyond expectation.", e: "Nawa o! See as dem just scatter the whole thing." }] },
  { display: "abi", normalized: "abi", lang: "Yoruba", defs: [{ m: "A rhetorical tag question meaning right? or isn't it?", e: "You go come tomorrow, abi?" }] },
  { display: "jollof", normalized: "jollof", lang: "Wolof", defs: [{ m: "A popular West African rice dish cooked in a tomato-based sauce. Nigeria version is considered the best.", e: "Party jollof hits different, I swear." }] },
  { display: "oga", normalized: "oga", lang: "Yoruba", defs: [{ m: "Boss, master, or superior. Used to address someone in authority.", e: "The oga at the top no know anything." }] },
  { display: "sapa", normalized: "sapa", lang: "Pidgin", defs: [{ m: "Severe poverty or being broke. The painful state of having absolutely no money.", e: "Sapa don hold me since month beginning." }] },
  { display: "ehen", normalized: "ehen", lang: "Edo", defs: [{ m: "An interjection expressing agreement or realisation. Like saying ah yes or exactly.", e: "Ehen! Now you understand wetin I dey tell you." }] },
  { display: "pepper dem", normalized: "pepper dem", lang: "Pidgin", defs: [{ m: "To show off or outshine others, especially those who doubted you.", e: "After dem fail you, you go pepper dem with your success." }] },
  { display: "agbero", normalized: "agbero", lang: "Yoruba", defs: [{ m: "A tout or ruffian, typically found at motor parks. Used to describe a thuggish person.", e: "That area full of agbero wey go collect your money by force." }] },
  { display: "ginger", normalized: "ginger", lang: "Pidgin", defs: [{ m: "To motivate, hype up, or excite someone. Can also mean to style or dress up.", e: "The speech ginger everybody for the room." }] },
  { display: "shayo", normalized: "shayo", lang: "Yoruba", defs: [{ m: "To be drunk or intoxicated from alcohol.", e: "He reach the party and shayo himself to stupor." }] },
  { display: "aso-ebi", normalized: "aso ebi", lang: "Yoruba", defs: [{ m: "Coordinated fabric worn by family or friends at a celebration to show solidarity.", e: "The aso-ebi for her wedding was a beautiful shade of purple." }] },
  { display: "suya", normalized: "suya", lang: "Hausa", defs: [{ m: "Spiced grilled meat skewers, a popular Nigerian street food originating from the North.", e: "Abeg, make we go buy suya after work." }] },
  { display: "kparachukwu", normalized: "kparachukwu", lang: "Igbo", defs: [{ m: "God forbid. An expression used to reject a curse or negative statement.", e: "Kparachukwu! I will never be poor in this life." }] },
  { display: "abeg", normalized: "abeg", lang: "Pidgin", defs: [{ m: "Please, I beg you. Used to plead, appeal, or dismiss something.", e: "Abeg, leave me alone joor." }] },
  { display: "oya", normalized: "oya", lang: "Yoruba", defs: [{ m: "Come on, let us go, or hurry up. Used to prompt action or signal a transition.", e: "Oya, we are late, let us move!" }] },
  { display: "joor", normalized: "joor", lang: "Yoruba", defs: [{ m: "An emphatic tag added to dismiss or strongly assert something. Like for goodness sake.", e: "Leave me alone joor, I no do anything." }] },
  { display: "mugu", normalized: "mugu", lang: "Hausa", defs: [{ m: "A gullible person or fool who is easily deceived. Often the target of a con.", e: "He fall mugu for that deal, dem collect all him money." }] },
  { display: "gbosa", normalized: "gbosa", lang: "Yoruba", defs: [{ m: "A cheer or celebratory shout of approval. Used to hype someone or a crowd.", e: "Make una give am gbosa for what he do!" }] }
];

async function main() {
  console.log("Seeding database with Nigerian words...");
  const firstUser = await prisma.user.findFirst();
  if (!firstUser) { console.log("No user found. Please create an account first."); return; }
  console.log("Using author:", firstUser.name, firstUser.id);

  let created = 0, skipped = 0;
  for (const w of words) {
    const existing = await prisma.word.findUnique({ where: { normalizedTerm: w.normalized } });
    if (existing) { console.log("  SKIP:", w.display); skipped++; continue; }
    const wordRecord = await prisma.word.create({ data: { displayTerm: w.display, normalizedTerm: w.normalized, languageFamily: w.lang, commonStates: [] } });
    for (const def of w.defs) {
      await prisma.definition.create({ data: { wordId: wordRecord.id, authorId: firstUser.id, meaning: def.m, example: def.e, netScore: 0 } });
    }
    console.log("  OK:", w.display, "(" + w.lang + ")");
    created++;
  }
  console.log("\nDone. Created:", created, "Skipped:", skipped);
}

main().catch(console.error).finally(() => prisma.());