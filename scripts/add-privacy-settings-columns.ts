import prisma from '@/lib/prisma';

async function main() {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      console.log(`Attempt ${attempt} to connect and alter table...`);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "user" 
        ADD COLUMN IF NOT EXISTS "showEmailPublicly" BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS "showStatePublicly" BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS "showLanguagePublicly" BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS "showStatsPublicly" BOOLEAN DEFAULT true;
      `);
      console.log('Successfully added privacy columns to user table.');
      break;
    } catch (err: any) {
      console.error(`Attempt ${attempt} failed:`, err.message);
      if (attempt < 5) {
        await new Promise((res) => setTimeout(res, 2500));
      }
    }
  }
  await prisma.$disconnect();
}

main();
