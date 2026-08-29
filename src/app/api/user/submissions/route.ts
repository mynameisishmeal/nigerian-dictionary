import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth-server';

export async function GET() {
  try {
    const { data: sessionData } = await auth.getSession();

    if (!sessionData?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = sessionData.user.id;

    // Fetch all definitions authored by this user, ordered by newest first
    const submissions = await prisma.definition.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        word: {
          select: {
            id: true,
            displayTerm: true,
            normalizedTerm: true,
            languageFamily: true,
          },
        },
      },
    });

    return NextResponse.json({ submissions });
  } catch (error: any) {
    console.error('Error fetching user submissions:', error);
    return NextResponse.json({ error: 'Failed to retrieve submissions' }, { status: 500 });
  }
}
