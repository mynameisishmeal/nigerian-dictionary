const { PrismaClient } = require('@prisma/client');

// Use the UNPOOLED direct connection to ensure we hit the actual Postgres server
// and can run DEALLOCATE ALL to clear stale prepared statement plans.
const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL_UNPOOLED }
  }
});

async function main() {
  console.log('Clearing all prepared statements...');
  await prisma.$executeRaw`DEALLOCATE ALL`;
  console.log('Done. All stale query plans cleared.');

  // Verify the word table is readable now
  const words = await prisma.$queryRaw`
    SELECT id, "displayTerm", "languageFamily", "createdAt"
    FROM public.word
    ORDER BY "createdAt" DESC
    LIMIT 3
  `;
  console.log('Verification query succeeded:', JSON.stringify(words, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch(e => { console.error(e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
