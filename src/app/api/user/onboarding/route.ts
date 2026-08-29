import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  try {
    const { data: sessionData } = await auth.getSession();
    if (!sessionData?.user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { firstName, lastName, username, stateOfOrigin, primaryLanguage } = await req.json();

    if (!firstName || typeof firstName !== 'string' || !firstName.trim()) {
      return NextResponse.json({ error: 'First name is required.' }, { status: 400 });
    }

    if (!lastName || typeof lastName !== 'string' || !lastName.trim()) {
      return NextResponse.json({ error: 'Last name is required.' }, { status: 400 });
    }

    if (!username || typeof username !== 'string' || !username.trim()) {
      return NextResponse.json({ error: 'Unique username is required.' }, { status: 400 });
    }

    if (!stateOfOrigin || typeof stateOfOrigin !== 'string' || !stateOfOrigin.trim()) {
      return NextResponse.json({ error: 'State in Nigeria is required.' }, { status: 400 });
    }

    if (!primaryLanguage || typeof primaryLanguage !== 'string' || !primaryLanguage.trim()) {
      return NextResponse.json({ error: 'Primary heritage language is required.' }, { status: 400 });
    }

    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    const cleanUsername = username.trim().toLowerCase().replace(/^@+/, '').replace(/[^a-z0-9_]/g, '');
    const cleanState = stateOfOrigin.trim();
    const cleanLang = primaryLanguage.trim();
    const fullName = `${cleanFirst} ${cleanLast}`;
    const userId = sessionData.user.id;
    const email = sessionData.user.email || '';
    const emailVerified = !!sessionData.user.emailVerified;
    const image = sessionData.user.image || null;

    if (cleanUsername.length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters (letters, numbers, underscores).' }, { status: 400 });
    }

    // Check if username is taken by another user
    const takenUsers: any[] = await prisma.$queryRawUnsafe(
      `SELECT "id" FROM "user" WHERE "username" = $1 AND "id" != $2 LIMIT 1`,
      cleanUsername,
      userId
    );

    if (takenUsers.length > 0) {
      return NextResponse.json({ error: `@${cleanUsername} is already taken. Please choose another username.` }, { status: 400 });
    }

    // Check if user exists in public.user
    const existingUsers: any[] = await prisma.$queryRawUnsafe(
      `SELECT "id" FROM "user" WHERE "id" = $1 LIMIT 1`,
      userId
    );

    if (existingUsers.length === 0) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "user" ("id", "name", "firstName", "lastName", "username", "email", "emailVerified", "image", "stateOfOrigin", "primaryLanguage", "isOnboarded", "isVerified", "role", "reputationScore", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, false, 'user', 0, NOW(), NOW())
         ON CONFLICT ("id") DO UPDATE 
         SET "name" = EXCLUDED."name",
             "firstName" = EXCLUDED."firstName",
             "lastName" = EXCLUDED."lastName",
             "username" = EXCLUDED."username",
             "stateOfOrigin" = EXCLUDED."stateOfOrigin",
             "primaryLanguage" = EXCLUDED."primaryLanguage",
             "isOnboarded" = true,
             "updatedAt" = NOW()`,
        userId,
        fullName,
        cleanFirst,
        cleanLast,
        cleanUsername,
        email,
        emailVerified,
        image,
        cleanState,
        cleanLang
      );
    } else {
      await prisma.$executeRawUnsafe(
        `UPDATE "user" 
         SET "name" = $1, 
             "firstName" = $2, 
             "lastName" = $3, 
             "username" = $4,
             "stateOfOrigin" = $5, 
             "primaryLanguage" = $6, 
             "isOnboarded" = true, 
             "updatedAt" = NOW() 
         WHERE "id" = $7`,
        fullName,
        cleanFirst,
        cleanLast,
        cleanUsername,
        cleanState,
        cleanLang,
        userId
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding profile saved successfully.',
      user: {
        id: userId,
        name: fullName,
        firstName: cleanFirst,
        lastName: cleanLast,
        username: cleanUsername,
        stateOfOrigin: cleanState,
        primaryLanguage: cleanLang,
        isOnboarded: true,
      },
    });
  } catch (error: any) {
    console.error('[ONBOARDING API ERROR]:', error);
    return NextResponse.json({ error: 'Failed to complete onboarding: ' + (error.message || 'Database error') }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { data: sessionData } = await auth.getSession();
    if (!sessionData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users: any[] = await prisma.$queryRawUnsafe(
      `SELECT "id", "name", "firstName", "lastName", "username", "stateOfOrigin", "primaryLanguage", "isOnboarded", "emailVerified", "role" 
       FROM "user" 
       WHERE "id" = $1 
       LIMIT 1`,
      sessionData.user.id
    );

    const user = users[0] || null;
    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('[GET ONBOARDING ERROR]:', error);
    return NextResponse.json({ error: 'Failed to fetch onboarding status' }, { status: 500 });
  }
}
