import prisma from '@/lib/prisma';

async function main() {
  const users: any[] = await prisma.$queryRawUnsafe(`
    SELECT "id", "name", "email", "username" FROM "user" WHERE "username" IS NULL OR "username" = ''
  `);

  console.log(`Found ${users.length} users with null or empty username.`);

  for (const user of users) {
    let base = '';
    if (user.email) {
      base = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
    } else if (user.name) {
      base = user.name.toLowerCase().replace(/[^a-z0-9_]/g, '');
    }
    if (!base || base.length < 3) {
      base = `user_${user.id.slice(0, 6)}`;
    }

    let candidate = base;
    let counter = 1;
    while (true) {
      const existing: any[] = await prisma.$queryRawUnsafe(
        `SELECT "id" FROM "user" WHERE "username" = $1 AND "id" != $2 LIMIT 1`,
        candidate,
        user.id
      );
      if (existing.length === 0) {
        break;
      }
      candidate = `${base}${counter}`;
      counter++;
    }

    await prisma.$executeRawUnsafe(
      `UPDATE "user" SET "username" = $1, "updatedAt" = NOW() WHERE "id" = $2`,
      candidate,
      user.id
    );
    console.log(`Updated user ${user.id} (${user.email || user.name}) -> username: "${candidate}"`);
  }

  await prisma.$disconnect();
}

main();
