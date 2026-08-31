import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSuperAdminSession } from '@/lib/admin-auth';

export async function GET(request: Request) {
  const authCheck = await getSuperAdminSession();
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const role = searchParams.get('role') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    let queryFilter = '';
    const params: any[] = [];

    if (query) {
      params.push(`%${query.trim().toLowerCase()}%`);
      queryFilter += ` AND (LOWER(u."name") LIKE $${params.length} OR LOWER(u."email") LIKE $${params.length} OR LOWER(COALESCE(u."username", '')) LIKE $${params.length})`;
    }

    if (role) {
      params.push(role);
      queryFilter += ` AND u."role" = $${params.length}`;
    }

    const countSql = `SELECT COUNT(*)::int as count FROM "user" u WHERE 1=1 ${queryFilter}`;
    const totalResult: any[] = await prisma.$queryRawUnsafe(countSql, ...params);
    const total = totalResult[0]?.count || 0;

    const usersSql = `
      SELECT 
        u."id",
        u."name",
        u."firstName",
        u."lastName",
        u."username",
        u."email",
        u."emailVerified",
        u."isVerified",
        u."isOnboarded",
        u."primaryLanguage",
        u."stateOfOrigin",
        u."role",
        u."reputationScore",
        u."image",
        u."createdAt",
        u."updatedAt",
        (SELECT COUNT(*)::int FROM "definition" d WHERE d."authorId" = u."id") as "defsCount",
        (SELECT COUNT(*)::int FROM "vote" v WHERE v."userId" = u."id") as "votesCount"
      FROM "user" u
      WHERE 1=1 ${queryFilter}
      ORDER BY u."createdAt" DESC
      LIMIT ${limit} OFFSET ${skip}
    `;

    const rawUsers: any[] = await prisma.$queryRawUnsafe(usersSql, ...params);
    const users = rawUsers.map((u: any) => ({
      ...u,
      _count: {
        definitions: u.defsCount || 0,
        votes: u.votesCount || 0,
      },
    }));

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Admin users GET error:', error);
    return NextResponse.json({ error: 'Failed to retrieve users' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const authCheck = await getSuperAdminSession();
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 403 });
  }

  try {
    const { id, role, isVerified, reputationScore, name, stateOfOrigin, isOnboarded } = await request.json();

    // If role is being changed to 'blacklisted', purge all active sessions and reset onboarding
    if (role === 'blacklisted') {
      await prisma.session.deleteMany({ where: { userId: id } });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        role: role !== undefined ? role : undefined,
        isVerified: typeof isVerified === 'boolean' ? isVerified : undefined,
        reputationScore: typeof reputationScore === 'number' ? reputationScore : undefined,
        name: name?.trim() || undefined,
        stateOfOrigin: stateOfOrigin !== undefined ? stateOfOrigin : undefined,
        isOnboarded: role === 'blacklisted' ? false : typeof isOnboarded === 'boolean' ? isOnboarded : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isOnboarded: true,
        isVerified: true,
        reputationScore: true,
        stateOfOrigin: true,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('Admin user PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authCheck = await getSuperAdminSession();
  if (!authCheck.authorized || !authCheck.user) {
    return NextResponse.json({ error: authCheck.error || 'Unauthorized' }, { status: authCheck.status || 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Prevent admin from deleting/blacklisting their own active session account
    if (authCheck.user.id === id) {
      return NextResponse.json({ error: 'You cannot blacklist your own active admin account.' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Soft-delete and Blacklist:
    // 1. Immediately revoke all active sessions to sign the user out on all devices
    await prisma.session.deleteMany({ where: { userId: id } });

    // 2. Delete any active verification tokens
    if (targetUser.email) {
      await prisma.verification.deleteMany({
        where: { identifier: targetUser.email.toLowerCase().trim() },
      });
    }

    // 3. Mark user role as 'blacklisted' and reset isOnboarded to false (preserving user data & contributions)
    await prisma.user.update({
      where: { id },
      data: {
        role: 'blacklisted',
        isOnboarded: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.name} (${targetUser.email}) has been blacklisted and signed out from all devices. Their information remains preserved.`,
    });
  } catch (error: any) {
    console.error('Admin user DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Failed to blacklist user' }, { status: 500 });
  }
}
