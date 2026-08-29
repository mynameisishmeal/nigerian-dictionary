import prisma from '@/lib/prisma';

async function main() {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "username" TEXT;
    `);
    console.log('Added username column if not exists.');
    
    // Create unique index on username if not exists
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "user_username_key" ON "user"("username") WHERE "username" IS NOT NULL;
    `);
    console.log('Created unique index on username.');
  } catch (err) {
    console.error('Error adding username column:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
