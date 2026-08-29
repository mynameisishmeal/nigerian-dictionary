import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth-server';

export async function PATCH(req: Request) {
  try {
    const { data: sessionData } = await auth.getSession();

    if (!sessionData?.user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired session' }, { status: 401 });
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      username,
      stateOfOrigin,
      primaryLanguage,
      showEmailPublicly,
      showStatePublicly,
      showLanguagePublicly,
      showStatsPublicly,
    } = body;

    const userId = sessionData.user.id;

    // Validate username if provided
    let cleanUsername = undefined;
    if (username !== undefined) {
      cleanUsername = username.trim().toLowerCase().replace(/^@+/, '').replace(/[^a-z0-9_]/g, '');
      if (cleanUsername.length < 3) {
        return NextResponse.json({ error: 'Username must be at least 3 characters (letters, numbers, underscores).' }, { status: 400 });
      }

      const existingUsers: any[] = await prisma.$queryRawUnsafe(
        `SELECT "id" FROM "user" WHERE "username" = $1 AND "id" != $2 LIMIT 1`,
        cleanUsername,
        userId
      );

      if (existingUsers.length > 0) {
        return NextResponse.json({ error: `@${cleanUsername} is already taken by another user.` }, { status: 400 });
      }
    }

    // Fetch current user
    const currentUsers: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "user" WHERE "id" = $1 LIMIT 1`,
      userId
    );
    const currentUser = currentUsers[0] || {};

    const finalFirst = firstName !== undefined ? firstName.trim() : (currentUser.firstName || null);
    const finalLast = lastName !== undefined ? lastName.trim() : (currentUser.lastName || null);
    const finalUsername = cleanUsername !== undefined ? cleanUsername : (currentUser.username || null);
    const finalState = stateOfOrigin !== undefined ? stateOfOrigin.trim() : (currentUser.stateOfOrigin || null);
    const finalLang = primaryLanguage !== undefined ? primaryLanguage.trim() : (currentUser.primaryLanguage || null);
    const finalFullName = [finalFirst, finalLast].filter(Boolean).join(' ') || currentUser.name || 'Anonymous';

    const finalShowEmail = showEmailPublicly !== undefined ? Boolean(showEmailPublicly) : (currentUser.showEmailPublicly ?? false);
    const finalShowState = showStatePublicly !== undefined ? Boolean(showStatePublicly) : (currentUser.showStatePublicly ?? true);
    const finalShowLang = showLanguagePublicly !== undefined ? Boolean(showLanguagePublicly) : (currentUser.showLanguagePublicly ?? true);
    const finalShowStats = showStatsPublicly !== undefined ? Boolean(showStatsPublicly) : (currentUser.showStatsPublicly ?? true);

    await prisma.$executeRawUnsafe(
      `UPDATE "user"
       SET "name" = $1,
           "firstName" = $2,
           "lastName" = $3,
           "username" = $4,
           "stateOfOrigin" = $5,
           "primaryLanguage" = $6,
           "showEmailPublicly" = $7,
           "showStatePublicly" = $8,
           "showLanguagePublicly" = $9,
           "showStatsPublicly" = $10,
           "updatedAt" = NOW()
       WHERE "id" = $11`,
      finalFullName,
      finalFirst,
      finalLast,
      finalUsername,
      finalState,
      finalLang,
      finalShowEmail,
      finalShowState,
      finalShowLang,
      finalShowStats,
      userId
    );

    const refreshed: any[] = await prisma.$queryRawUnsafe(
      `SELECT "id", "name", "firstName", "lastName", "username", "email", "stateOfOrigin", "primaryLanguage", "showEmailPublicly", "showStatePublicly", "showLanguagePublicly", "showStatsPublicly", "role", "reputationScore"
       FROM "user"
       WHERE "id" = $1
       LIMIT 1`,
      userId
    );

    return NextResponse.json(refreshed[0] || {});
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
