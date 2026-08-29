import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth-server';

export async function POST(request: Request) {
  try {
    const { data: sessionData } = await auth.getSession();
    if (!sessionData?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized: Please log in to verify your identity' }, { status: 401 });
    }

    const userId = sessionData.user.id;
    const body = await request.json();
    const rawNin = (body.nin || body.vNin || '').toString().trim();

    // Standard NIN is 11 digits, vNIN is 16 characters
    if (!rawNin || (rawNin.length !== 11 && rawNin.length !== 16) || !/^\w+$/.test(rawNin)) {
      return NextResponse.json({ error: 'Invalid NIN format. Please provide a valid 11-digit NIN or 16-character vNIN.' }, { status: 400 });
    }

    // Check if user is already verified
    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (currentUser?.isVerified) {
      return NextResponse.json({ success: true, message: 'Your identity is already verified' });
    }

    // Optional KYC integration if DOJAH credentials are configured
    if (process.env.DOJAH_API_KEY && process.env.DOJAH_APP_ID) {
      try {
        const dojahRes = await fetch(`https://api.dojah.io/v1/kyc/nin?nin=${encodeURIComponent(rawNin)}`, {
          headers: {
            'Authorization': process.env.DOJAH_API_KEY,
            'AppId': process.env.DOJAH_APP_ID,
          },
        });
        if (!dojahRes.ok) {
          return NextResponse.json({ error: 'NIN verification failed with the identity provider' }, { status: 400 });
        }
      } catch (dojahErr) {
        console.error('Dojah API error:', dojahErr);
      }
    }

    // Cryptographically hash the NIN to preserve privacy (zero plain-text storage)
    const ninHash = crypto.createHash('sha256').update(rawNin).digest('hex');

    // Ensure this NIN is not linked to another account
    const existingNinUser = await prisma.user.findUnique({
      where: { ninHash },
    });

    if (existingNinUser && existingNinUser.id !== userId) {
      return NextResponse.json({ error: 'This NIN has already been registered to another account.' }, { status: 409 });
    }

    // Upsert/update the user record in Prisma
    const updatedUser = await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        name: sessionData.user.name || 'Anonymous',
        email: sessionData.user.email,
        emailVerified: sessionData.user.emailVerified,
        image: sessionData.user.image,
        ninHash,
        isVerified: true,
        reputationScore: 50,
      },
      update: {
        ninHash,
        isVerified: true,
        reputationScore: { increment: 50 },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Identity successfully verified! +50 Reputation awarded.',
      user: {
        id: updatedUser.id,
        isVerified: updatedUser.isVerified,
        reputationScore: updatedUser.reputationScore,
      },
    });
  } catch (error: any) {
    console.error('NIN Verification error:', error);
    return NextResponse.json({ error: 'Verification Service Error' }, { status: 500 });
  }
}

