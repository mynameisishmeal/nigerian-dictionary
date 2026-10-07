import prisma from '@/lib/prisma';

async function main() {
  const search = (process.argv[2] || '').trim();
  if (!search) {
    console.log('Usage: npx tsx scripts/check-user-profile.ts <email-or-id>');
    await prisma.$disconnect();
    return;
  }

  const users: any[] = await prisma.$queryRawUnsafe(`
    SELECT "id", "name", "email", "username", "firstName", "lastName" 
    FROM "user" 
    WHERE "email" ILIKE $1 OR "id" = $2
  `, `%${search}%`, search);
  console.log('User records:', JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}

main();
