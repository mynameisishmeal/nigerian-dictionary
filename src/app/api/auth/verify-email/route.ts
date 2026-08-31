import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { token, email } = await req.json();

    if (!token || !email) {
      return NextResponse.json({ error: 'Token and email are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check verification token record
    const record = await prisma.verification.findFirst({
      where: {
        identifier: cleanEmail,
        value: token,
      },
    });

    if (!record) {
      return NextResponse.json({ 
        error: 'This verification link is invalid or has already been used. Please request a new verification link.' 
      }, { status: 400 });
    }

    if (new Date() > record.expiresAt) {
      // Remove expired token
      await prisma.verification.delete({ where: { id: record.id } });
      return NextResponse.json({ 
        error: 'This verification link has expired. Please request a new verification link.' 
      }, { status: 400 });
    }

    // Check if account is blacklisted
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { role: true },
    });

    if (existingUser?.role === 'blacklisted') {
      return NextResponse.json({
        error: 'This account has been deactivated and blacklisted by administration. Please contact moderation.'
      }, { status: 403 });
    }

    // 1. Mark user as verified in database (upsert if record was missing)
    await prisma.user.upsert({
       where: { email: cleanEmail },
       update: { emailVerified: true },
       create: {
         email: cleanEmail,
         name: cleanEmail.split('@')[0],
         emailVerified: true,
         isOnboarded: false,
         role: 'user',
       },
    });

    // 2. STRICT SINGLE-USE CONSUMPTION: Delete token from verification table
    await prisma.verification.delete({
      where: { id: record.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Email successfully verified! Proceeding to onboarding...',
    });
  } catch (error: any) {
    console.error('[VERIFY-EMAIL API ERROR]:', error);
    return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 500 });
  }
}
