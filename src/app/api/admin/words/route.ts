import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSuperAdminSession } from '@/lib/admin-auth';
import { algoliaBackendClient, algoliaIndexName } from '@/lib/algolia';

export async function GET(request: Request) {
  const authCheck = await getSuperAdminSession();
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const lang = searchParams.get('lang') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query) {
      where.OR = [
        { normalizedTerm: { contains: query.toLowerCase().trim(), mode: 'insensitive' } },
        { displayTerm: { contains: query.trim(), mode: 'insensitive' } },
      ];
    }
    if (lang) {
      where.languageFamily = { equals: lang, mode: 'insensitive' };
    }

    const [total, words] = await Promise.all([
      prisma.word.count({ where }),
      prisma.word.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          definitions: {
            include: {
              author: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
            orderBy: { netScore: 'desc' },
          },
        },
      }),
    ]);

    return NextResponse.json({
      words,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Admin words GET error:', error);
    return NextResponse.json({ error: 'Failed to retrieve words' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const authCheck = await getSuperAdminSession();
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 403 });
  }

  try {
    const { id, displayTerm, languageFamily, commonStates } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Word ID is required' }, { status: 400 });
    }

    const normalizedTerm = displayTerm
      ? displayTerm.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
      : undefined;

    const updatedWord = await prisma.word.update({
      where: { id },
      data: {
        displayTerm: displayTerm?.trim() || undefined,
        normalizedTerm,
        languageFamily: languageFamily !== undefined ? languageFamily : undefined,
        commonStates: Array.isArray(commonStates) ? commonStates : undefined,
      },
      include: {
        definitions: {
          orderBy: { netScore: 'desc' },
          take: 1,
        },
      },
    });

    // Update Algolia index if configured
    if (algoliaBackendClient && updatedWord.definitions[0]) {
      try {
        const index = algoliaBackendClient.initIndex(algoliaIndexName);
        await index.saveObject({
          objectID: updatedWord.id,
          normalizedTerm: updatedWord.normalizedTerm,
          displayTerm: updatedWord.displayTerm,
          meaning: updatedWord.definitions[0].meaning,
          example: updatedWord.definitions[0].example,
          languageFamily: updatedWord.languageFamily,
          netScore: updatedWord.definitions[0].netScore,
        });
      } catch (algErr) {
        console.error('Algolia update error:', algErr);
      }
    }

    return NextResponse.json({ success: true, word: updatedWord });
  } catch (error: any) {
    console.error('Admin word PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update word' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authCheck = await getSuperAdminSession();
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Word ID is required' }, { status: 400 });
    }

    // Cascade delete definitions, votes, and word
    await prisma.$transaction(async (tx: any) => {
      const defs = await tx.definition.findMany({
        where: { wordId: id },
        select: { id: true },
      });

      const defIds = defs.map((d: any) => d.id);

      if (defIds.length > 0) {
        await tx.vote.deleteMany({
          where: { definitionId: { in: defIds } },
        });
        await tx.definition.deleteMany({
          where: { wordId: id },
        });
      }

      await tx.word.delete({
        where: { id },
      });
    });

    // Delete from Algolia if configured
    if (algoliaBackendClient) {
      try {
        const index = algoliaBackendClient.initIndex(algoliaIndexName);
        await index.deleteObject(id);
      } catch (algErr) {
        console.error('Algolia delete error:', algErr);
      }
    }

    return NextResponse.json({ success: true, message: 'Word and all associated definitions removed' });
  } catch (error: any) {
    console.error('Admin word DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete word' }, { status: 500 });
  }
}
