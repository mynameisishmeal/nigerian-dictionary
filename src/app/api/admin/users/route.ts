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

    const where: any = {};
    if (query) {
      where.OR = [
        { name: { contains: query.trim(), mode: 'insensitive' } },
        { email: { contains: query.trim(), mode: 'insensitive' } },
        { firstName: { contains: query.trim(), mode: 'insensitive' } },
      ];
    }
    if (role) {
      where.role = role;
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          firstName: true,
          email: true,
          emailVerified: true,
          isVerified: true,
          role: true,
          reputationScore: true,
          stateOfOrigin: true,
          image: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              definitions: true,
              votes: true,
            },
          },
        },
      }),
    ]);

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
    const { id, role, isVerified, reputationScore, name, stateOfOrigin } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        role: role !== undefined ? role : undefined,
        isVerified: typeof isVerified === 'boolean' ? isVerified : undefined,
        reputationScore: typeof reputationScore === 'number' ? reputationScore : undefined,
        name: name?.trim() || undefined,
        stateOfOrigin: stateOfOrigin !== undefined ? stateOfOrigin : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
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
