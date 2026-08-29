const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check what the actual column type is in the DB
  const result = await prisma.$queryRaw`
    SELECT column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'word'
      AND column_name = 'createdAt'
  `;
  console.log('Column type result:', JSON.stringify(result, null, 2));

  // Also try a raw select to see what value comes back
  const raw = await prisma.$queryRaw`SELECT id, "createdAt" FROM public.word LIMIT 1`;
  console.log('Raw row:', JSON.stringify(raw, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch(e => { console.error(e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
