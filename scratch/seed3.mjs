import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const words = [
  { display: "wahala", normalized: "wahala", lang: "Pidgin", m: "Trouble, stress, or a complicated situation.", e: "Why you dey cause wahala for this house?" },
  { display: "omo", normalized: "omo", lang: "Yoruba", m: "An exclamation of surprise or shock. Equivalent to wow or oh my.", e: "Omo! You see wetin dem do?" },
  { display: "nawa", normalized: "nawa", lang: "Pidgin", m: "Expression of disbelief or shock. Used when something is surprising.", e: "Nawa o! See as dem just scatter the whole thing." },
  { display: "abi", normalized: "abi", lang: "Yoruba", m: "A rhetorical tag question meaning right or is it not so.", e: "You go come tomorrow, abi?" },
  { display: "jollof", normalized: "jollof", lang: "Wolof", m: "A popular West African rice dish cooked in tomato sauce. Nigerias version is considered the best.", e: "Party jollof hits different, I swear." },
  { display: "oga", normalized: "oga", lang: "Yoruba", m: "Boss, master, or superior. Used to address someone in authority.", e: "The oga at the top no know anything." },
  { display: "sapa", normalized: "sapa", lang: "Pidgin", m: "Severe poverty or being completely broke.", e: "Sapa don hold me since month beginning." },
  { display: "ehen", normalized: "ehen", lang: "Edo", m: "Interjection expressing agreement or realisation. Like saying ah yes or exactly.", e: "Ehen! Now you understand wetin I dey tell you." },
  { display: "pepper dem", normalized: "pepper dem", lang: "Pidgin", m: "To show off or outshine those who doubted you.", e: "After dem fail you, you go pepper dem with your success." },
  { display: "agbero", normalized: "agbero", lang: "Yoruba", m: "A tout or ruffian typically found at motor parks. A thuggish person.", e: "That area full of agbero wey go collect your money by force." },
  { display: "ginger", normalized: "ginger", lang: "Pidgin", m: "To motivate or hype someone up. Also means to dress up stylishly.", e: "The speech ginger everybody for the room." },
  { display: "shayo", normalized: "shayo", lang: "Yoruba", m: "To be drunk or intoxicated from alcohol.", e: "He reach the party and shayo himself to stupor." },
  { display: "aso-ebi", normalized: "aso ebi", lang: "Yoruba", m: "Coordinated fabric worn by family or friends at a celebration.", e: "The aso-ebi for her wedding was a beautiful shade of purple." },
  { display: "suya", normalized: "suya", lang: "Hausa", m: "Spiced grilled meat skewers. A popular Nigerian street food from the North.", e: "Abeg, make we go buy suya after work." },
  { display: "kparachukwu", normalized: "kparachukwu", lang: "Igbo", m: "God forbid. An expression used to reject a curse or negative statement.", e: "Kparachukwu! I will never be poor in this life." },
  { display: "abeg", normalized: "abeg", lang: "Pidgin", m: "Please, I beg you. Used to plead, appeal, or dismiss something.", e: "Abeg, leave me alone joor." },
  { display: "oya", normalized: "oya", lang: "Yoruba", m: "Come on, let us go, or hurry up. Used to prompt action.", e: "Oya, we are late, let us move!" },
  { display: "joor", normalized: "joor", lang: "Yoruba", m: "An emphatic tag used to dismiss or strongly assert something.", e: "Leave me alone joor, I no do anything." },
  { display: "mugu", normalized: "mugu", lang: "Hausa", m: "A gullible person or fool who is easily deceived.", e: "He fall mugu for that deal, dem collect all him money." },
  { display: "gbosa", normalized: "gbosa", lang: "Yoruba", m: "A cheer or celebratory shout of approval.", e: "Make una give am gbosa for what he do!" }
];
async function main() {
  const firstUser = await prisma.user.findFirst();
  if (!firstUser) { console.log("No user found. Create an account first."); return; }
  console.log("Author:", firstUser.name);
  let created = 0, skipped = 0;
  for (const w of words) {
    const ex = await prisma.word.findUnique({ where: { normalizedTerm: w.normalized } });
    if (ex) { skipped++; console.log("SKIP:", w.display); continue; }
    const wr = await prisma.word.create({ data: { displayTerm: w.display, normalizedTerm: w.normalized, languageFamily: w.lang, commonStates: [] } });
    await prisma.definition.create({ data: { wordId: wr.id, authorId: firstUser.id, meaning: w.m, example: w.e, netScore: 0 } });
    console.log("OK:", w.display);
    created++;
  }
  console.log("Done. Created:", created, "Skipped:", skipped);
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
