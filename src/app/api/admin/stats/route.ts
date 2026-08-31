import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSuperAdminSession } from '@/lib/admin-auth';

export async function GET() {
  const authCheck = await getSuperAdminSession();
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 403 });
  }

  try {
    const [
      countsResult,
      recentDefinitions,
      recentUsers,
      languagesCount,
    ] = await Promise.all([
      prisma.$queryRaw<any[]>`
        SELECT
          (SELECT COUNT(*) FROM "word")::int as "totalWords",
          (SELECT COUNT(*) FROM "definition")::int as "totalDefinitions",
          (SELECT COUNT(*) FROM "user")::int as "totalUsers",
          (SELECT COUNT(*) FROM "vote")::int as "totalVotes",
          (SELECT COUNT(*) FROM "user" WHERE "isVerified" = true)::int as "verifiedUsers",
          (SELECT COUNT(*) FROM "user" WHERE "encryptedOpenRouterKey" IS NOT NULL)::int as "usersWithKeys"
      `,
      prisma.definition.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          word: { select: { displayTerm: true, languageFamily: true } },
          author: { select: { name: true, email: true, image: true } },
        },
      }),
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          isVerified: true,
          role: true,
          reputationScore: true,
          createdAt: true,
          _count: { select: { definitions: true } },
        },
      }),
      prisma.word.groupBy({
        by: ['languageFamily'],
        _count: { id: true },
      }),
    ]);

    const counts = countsResult[0] || {};
    const totalWords = Number(counts.totalWords || 0);
    const totalDefinitions = Number(counts.totalDefinitions || 0);
    const totalUsers = Number(counts.totalUsers || 0);
    const totalVotes = Number(counts.totalVotes || 0);
    const verifiedUsers = Number(counts.verifiedUsers || 0);
    const usersWithKeys = Number(counts.usersWithKeys || 0);

    const systemStatus = {
      database: 'Connected',
      algolia: !!(process.env.NEXT_PUBLIC_ALGOLIA_APP_ID && process.env.ALGOLIA_ADMIN_KEY),
      openRouter: !!process.env.OPENROUTER_API_KEY,
      serper: !!process.env.SERPER_API_KEY,
      tavily: !!process.env.TAVILY_API_KEY,
    };

    return NextResponse.json({
      metrics: {
        totalWords,
        totalDefinitions,
        totalUsers,
        totalVotes,
        verifiedUsers,
        usersWithKeys,
        totalLanguages: languagesCount.filter((l) => l.languageFamily).length,
      },
      recentDefinitions,
      recentUsers,
      systemStatus,
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}
