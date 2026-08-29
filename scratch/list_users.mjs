import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Users in Prisma:', users.map(u => ({ id: u.id, name: u.name, email: u.email })));
  
  const rawUsers = await prisma.$queryRaw`SELECT id, name, email FROM "user"`;
  console.log('Users in SQL:', rawUsers);
}

main().catch(console.error).finally(() => prisma.$disconnect());
