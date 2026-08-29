import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRaw`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'neon_auth' AND table_name = 'user';
  `;
  console.log('Columns in neon_auth.user:', result);
}

main().catch(console.error).finally(() => prisma.$disconnect());
