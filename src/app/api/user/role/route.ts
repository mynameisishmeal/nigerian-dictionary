import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import prisma from '@/lib/prisma';
import { isSuperAdminUser } from '@/lib/admin-auth';

export async function GET() {
  try {
    const { data: sessionData } = await auth.getSession();
    if (!sessionData?.user) {
      return NextResponse.json({ isSuperAdmin: false, role: 'user' });
    }

    const email = sessionData.user.email?.toLowerCase().trim();
    
    let dbUser = await prisma.user.findUnique({
      where: { id: sessionData.user.id },
      select: { role: true, email: true },
    });

    if (!dbUser && email) {
      dbUser = await prisma.user.findUnique({
        where: { email },
        select: { role: true, email: true },
      });
    }

    const isSuperAdmin = isSuperAdminUser({
      email: email || dbUser?.email,
      role: dbUser?.role,
    });

    return NextResponse.json({
      isSuperAdmin,
      role: dbUser?.role || 'user',
    });
  } catch (err) {
    return NextResponse.json({ isSuperAdmin: false, role: 'user' });
  }
}
