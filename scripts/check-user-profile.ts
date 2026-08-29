import prisma from '@/lib/prisma';

async function main() {
  const users: any[] = await prisma.$queryRawUnsafe(`
    SELECT "id", "name", "email", "username", "firstName", "lastName" 
    FROM "user" 
    WHERE "email" ILIKE '%rosewelltin%' OR "id" = 'abc3f343-1b4d-4dc4-a5f1-db009914d190'
  `);
  console.log('User records:', JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}

main();
