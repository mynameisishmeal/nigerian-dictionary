import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Find or create pending user record in PostgreSQL
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true, name: true, email: true, emailVerified: true, isOnboarded: true, role: true },
    });

    // Check if email has been blacklisted / deactivated by admin
    if (user?.role === 'blacklisted') {
      return NextResponse.json({
        error: 'This email address has been deactivated and blacklisted by administration. Please contact moderation.'
      }, { status: 403 });
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          name: cleanEmail.split('@')[0],
          emailVerified: false,
          isOnboarded: false,
          role: 'user',
        },
        select: { id: true, name: true, email: true, emailVerified: true, isOnboarded: true },
      });
    }

    if (user && user.emailVerified && user.isOnboarded) {
      return NextResponse.json({ 
        success: true, 
        alreadyVerified: true, 
        message: 'This email is already verified and onboarded. You can log in directly.' 
      });
    }

    // Generate single-use cryptographically secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Clean up any existing tokens for this email identifier
    await prisma.verification.deleteMany({
      where: { identifier: cleanEmail },
    });

    // Save token to Verification table
    await prisma.verification.create({
      data: {
        identifier: cleanEmail,
        value: token,
        expiresAt,
      },
    });

    // Send email
    const emailResult = await sendVerificationEmail({
      email: cleanEmail,
      token,
      name: user?.name || cleanEmail.split('@')[0],
    });

    return NextResponse.json({
      success: true,
      message: 'Verification email dispatched successfully.',
      devLink: emailResult.method === 'console' ? emailResult.link : undefined,
    });
  } catch (error: any) {
    console.error('[SEND-VERIFICATION API ERROR]:', error);
    return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 });
  }
}
