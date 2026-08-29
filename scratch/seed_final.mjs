import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_chQlL81FAetr@ep-fragrant-glitter-aywzatbu-pooler.c-5.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require'
});

const words = [
  ['wahala','wahala','Pidgin','Trouble, stress, or a complicated situation.','Why you dey cause wahala for this house?'],
  ['omo','omo','Yoruba','Exclamation of surprise or shock. Equivalent to wow.','Omo! You see wetin dem do?'],
  ['nawa','nawa','Pidgin','Expression of disbelief or shock.','Nawa o! See as dem just scatter the whole thing.'],
  ['abi','abi','Yoruba','A rhetorical tag question meaning right or is it not so.','You go come tomorrow, abi?'],
  ['jollof','jollof','Wolof','A popular West African rice dish. Nigeria version is considered the best.','Party jollof hits different.'],
  ['oga','oga','Yoruba','Boss or superior. Used to address someone in authority.','The oga at the top no know anything.'],
  ['sapa','sapa','Pidgin','Severe poverty or being completely broke.','Sapa don hold me since month beginning.'],
  ['ehen','ehen','Edo','Interjection expressing agreement. Like saying ah yes or exactly.','Ehen! Now you understand.'],
  ['pepper dem','pepper dem','Pidgin','To show off or outshine those who doubted you.','After dem fail you, you go pepper dem with your success.'],
  ['agbero','agbero','Yoruba','A tout or ruffian typically found at motor parks.','That area full of agbero wey go collect your money.'],
  ['ginger','ginger','Pidgin','To motivate or hype someone up. Also means to dress up.','The speech ginger everybody for the room.'],
  ['shayo','shayo','Yoruba','To be drunk or intoxicated from alcohol.','He reach the party and shayo himself to stupor.'],
  ['aso-ebi','aso ebi','Yoruba','Coordinated fabric worn at a celebration to show solidarity.','The aso-ebi for her wedding was a beautiful shade of purple.'],
  ['suya','suya','Hausa','Spiced grilled meat skewers. Popular Nigerian street food from the North.','Abeg, make we go buy suya after work.'],
  ['kparachukwu','kparachukwu','Igbo','God forbid. An expression used to reject a curse or negative statement.','Kparachukwu! I will never be poor in this life.'],
  ['abeg','abeg','Pidgin','Please or I beg you. Used to plead, appeal, or dismiss something.','Abeg, leave me alone joor.'],
  ['oya','oya','Yoruba','Come on or hurry up. Used to prompt action or signal a transition.','Oya, we are late, let us move!'],
  ['joor','joor','Yoruba','An emphatic tag to dismiss or strongly assert something.','Leave me alone joor, I no do anything.'],
  ['mugu','mugu','Hausa','A gullible person or fool who is easily deceived.','He fall mugu for that deal, dem collect all him money.'],
  ['gbosa','gbosa','Yoruba','A cheer or celebratory shout of approval.','Make una give am gbosa for what he do!'],
];

async function main() {
  await client.connect();

  const { rows: users } = await client.query('SELECT id, name FROM "user" LIMIT 1');
  if (!users.length) {
    console.log('No user found. Please create an account first then re-run this script.');
    await client.end();
    return;
  }
  const userId = users[0].id;
  console.log('Author:', users[0].name);

  let created = 0;
  let skipped = 0;

  for (const [display, normalized, lang, meaning, example] of words) {
    const { rows: existing } = await client.query(
      'SELECT id FROM "word" WHERE "normalizedTerm" = $1',
      [normalized]
    );

    if (existing.length) {
      console.log('SKIP:', display);
      skipped++;
      continue;
    }

    const { rows: [word] } = await client.query(
      'INSERT INTO "word" (id, "displayTerm", "normalizedTerm", "languageFamily", "commonStates", "createdAt") VALUES (gen_random_uuid(), $1, $2, $3, ARRAY[]::text[], NOW()) RETURNING id',
      [display, normalized, lang]
    );

    await client.query(
      'INSERT INTO "definition" (id, "wordId", "authorId", meaning, example, "netScore", "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, 0, NOW(), NOW())',
      [word.id, userId, meaning, example]
    );

    console.log('OK:', display, '(' + lang + ')');
    created++;
  }

  console.log('\nDone. Created:', created, '| Skipped:', skipped);
  await client.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
