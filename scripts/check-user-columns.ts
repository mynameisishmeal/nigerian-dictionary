import prisma from '@/lib/prisma';

async function main() {
  const result: any = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'user';
  `);
  console.log('Columns in user table:', result);
}

main().finally(() => prisma.$disconnect());
