import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRaw`
    SELECT schemaname, tablename 
    FROM pg_tables 
    WHERE tablename IN ('user', 'users', 'User');
  `;
  console.log('User tables:', result);
  
  for (const row of result) {
    try {
      const users = await prisma.$queryRawUnsafe(`SELECT id, name FROM "${row.schemaname}"."${row.tablename}"`);
      console.log(`Users in ${row.schemaname}.${row.tablename}:`, users);
    } catch (e) {
      console.error(`Error reading ${row.schemaname}.${row.tablename}:`, e.message);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
