import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  try {
    const users: any[] = await prisma.$queryRawUnsafe(`
      SELECT 
        "id", 
        "name", 
        "email", 
        "username", 
        "role", 
        "isOnboarded", 
        "emailVerified", 
        "isVerified", 
        "stateOfOrigin", 
        "primaryLanguage", 
        "reputationScore", 
        "createdAt"
      FROM "user" 
      ORDER BY "createdAt" DESC
    `);

    const accounts: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "account"`);
    const sessions: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM "session"`);

    console.log(`TOTAL USERS IN DATABASE: ${users.length}`);
    console.log(JSON.stringify(users, null, 2));

    console.log(`\nTOTAL ACCOUNTS IN DATABASE: ${accounts.length}`);
    console.log(JSON.stringify(accounts, null, 2));

    console.log(`\nTOTAL ACTIVE SESSIONS IN DATABASE: ${sessions.length}`);
    console.log(JSON.stringify(sessions, null, 2));
  } catch (err: any) {
    console.error('Error fetching users:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
