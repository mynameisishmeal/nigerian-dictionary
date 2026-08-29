const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Prisma's DateTime without @db.Timestamptz maps to TIMESTAMP(3) WITHOUT TIME ZONE.
// Our raw SQL seed used NOW() which inserted TIMESTAMPTZ values.
// Fix: ALTER columns to TIMESTAMP(3) WITHOUT TIME ZONE, converting via AT TIME ZONE 'UTC'.
// This is a permanent, clean fix — no data is lost (all timestamps are UTC anyway).

async function main() {
  console.log('Altering word.createdAt...');
  await prisma.$executeRaw`
    ALTER TABLE public.word
    ALTER COLUMN "createdAt" TYPE TIMESTAMP(3) WITHOUT TIME ZONE
    USING ("createdAt"::timestamptz AT TIME ZONE 'UTC')
  `;

  console.log('Altering definition.createdAt...');
  await prisma.$executeRaw`
    ALTER TABLE public.definition
    ALTER COLUMN "createdAt" TYPE TIMESTAMP(3) WITHOUT TIME ZONE
    USING ("createdAt"::timestamptz AT TIME ZONE 'UTC')
  `;

  console.log('Altering definition.updatedAt...');
  await prisma.$executeRaw`
    ALTER TABLE public.definition
    ALTER COLUMN "updatedAt" TYPE TIMESTAMP(3) WITHOUT TIME ZONE
    USING ("updatedAt"::timestamptz AT TIME ZONE 'UTC')
  `;

  // Verify
  const result = await prisma.$queryRaw`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('word', 'definition')
      AND column_name IN ('createdAt', 'updatedAt')
    ORDER BY table_name, column_name
  `;
  console.log('\nVerification:', JSON.stringify(result, null, 2));
  console.log('\nDone. All timestamp columns are now TIMESTAMP(3) WITHOUT TIME ZONE.');
}

main()
  .then(() => process.exit(0))
  .catch(e => { console.error(e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
