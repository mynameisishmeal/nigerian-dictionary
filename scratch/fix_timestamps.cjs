const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Truncate ALL timestamps in word and definition tables to millisecond precision
  // so Prisma's DateTime parser can handle them correctly
  const w = await prisma.$executeRaw`
    UPDATE public.word
    SET "createdAt" = date_trunc('milliseconds', "createdAt")
  `;
  console.log('Updated word rows:', w);

  const d = await prisma.$executeRaw`
    UPDATE public.definition
    SET "createdAt" = date_trunc('milliseconds', "createdAt"::timestamptz),
        "updatedAt" = date_trunc('milliseconds', "updatedAt"::timestamptz)
  `;
  console.log('Updated definition rows:', d);

  console.log('Done - all timestamps truncated to millisecond precision.');
}

main()
  .then(() => process.exit(0))
  .catch(e => { console.error(e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
