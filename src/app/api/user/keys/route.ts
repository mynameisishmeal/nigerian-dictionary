import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/encryption';

export async function GET(request: Request) {
  try {
    const { data: sessionData } = await auth.getSession();
    if (!sessionData?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionData.user.id },
      select: { encryptedOpenRouterKey: true },
    });

    // We never return the actual key, just whether it exists
    const hasKey = !!user?.encryptedOpenRouterKey;

    return NextResponse.json({ hasKey });
  } catch (error) {
    console.error('Error fetching key status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { data: sessionData } = await auth.getSession();
    if (!sessionData?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { key } = await request.json();

    if (typeof key !== 'string') {
      return NextResponse.json({ error: 'Invalid key format' }, { status: 400 });
    }

    let encryptedKey: string | null = null;
    if (key.trim() !== '') {
      encryptedKey = encrypt(key.trim());
    }

    await prisma.user.update({
      where: { id: sessionData.user.id },
      data: { encryptedOpenRouterKey: encryptedKey },
    });

    return NextResponse.json({ success: true, hasKey: !!encryptedKey });
  } catch (error) {
    console.error('Error saving API key:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
