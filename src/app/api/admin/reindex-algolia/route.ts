import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSuperAdminSession } from '@/lib/admin-auth';
import { algoliaBackendClient, algoliaIndexName } from '@/lib/algolia';

export async function POST() {
  const authCheck = await getSuperAdminSession();
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 403 });
  }

  if (!algoliaBackendClient) {
    return NextResponse.json({
      error: 'Algolia is not configured. Please set NEXT_PUBLIC_ALGOLIA_APP_ID and ALGOLIA_ADMIN_KEY in environment variables.',
    }, { status: 400 });
  }

  try {
    // Fetch all words with top definition
    const words = await prisma.word.findMany({
      include: {
        definitions: {
          orderBy: { netScore: 'desc' },
          take: 1,
        },
      },
    });

    const records = words.map((w) => ({
      objectID: w.id,
      normalizedTerm: w.normalizedTerm,
      displayTerm: w.displayTerm,
      meaning: w.definitions[0]?.meaning || '',
      example: w.definitions[0]?.example || null,
      languageFamily: w.languageFamily || null,
      netScore: w.definitions[0]?.netScore || 0,
    }));

    const index = algoliaBackendClient.initIndex(algoliaIndexName);

    // Batch save in chunks of 100
    const chunkSize = 100;
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      await index.saveObjects(chunk);
    }

    return NextResponse.json({
      success: true,
      count: records.length,
      message: `Successfully re-indexed ${records.length} words to Algolia index "${algoliaIndexName}"`,
    });
  } catch (error: any) {
    console.error('Algolia reindex error:', error);
    return NextResponse.json({ error: error.message || 'Failed to re-index Algolia' }, { status: 500 });
  }
}
