import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth-server';
import { ProfileHeader } from '@/components/profile/profile-header';
import { ProfileActivity } from '@/components/profile/profile-activity';

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const profileId = resolvedParams.id;
  
  // Get current logged-in user
  const sessionResult = await auth.getSession();
  const { data: sessionData } = sessionResult || {};
  
  let loggedInUserId = null;
  if (sessionData?.user) {
    loggedInUserId = sessionData.user.id;
  }

  // Handle /profile/me special route
  const targetId = profileId === 'me' ? loggedInUserId : profileId;

  if (!targetId) {
    return redirect('/');
  }

  // Fetch target user data and stats using direct query
  const users: any[] = await prisma.$queryRawUnsafe(
    `SELECT "id", "name", "firstName", "lastName", "username", "email", "image", "stateOfOrigin", "primaryLanguage", "role", "reputationScore", "isVerified", "showEmailPublicly", "showStatePublicly", "showLanguagePublicly", "showStatsPublicly"
     FROM "user"
     WHERE "id" = $1
     LIMIT 1`,
    targetId
  );

  let user = users[0] || null;
  const isOwnProfile = loggedInUserId === targetId;

  // Auto-sync user to public schema on first profile access if missing
  if (!user && isOwnProfile && sessionData?.user) {
    try {
      const defaultUsername = (sessionData.user.email || '').split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
      await prisma.$executeRawUnsafe(
        `INSERT INTO "user" ("id", "name", "username", "email", "emailVerified", "image", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         ON CONFLICT ("id") DO NOTHING`,
        sessionData.user.id,
        sessionData.user.name || 'Anonymous',
        defaultUsername,
        sessionData.user.email || '',
        !!sessionData.user.emailVerified,
        sessionData.user.image || null
      );

      const refreshed: any[] = await prisma.$queryRawUnsafe(
        `SELECT "id", "name", "firstName", "lastName", "username", "email", "image", "stateOfOrigin", "primaryLanguage", "role", "reputationScore", "isVerified", "showEmailPublicly", "showStatePublicly", "showLanguagePublicly", "showStatsPublicly"
         FROM "user"
         WHERE "id" = $1
         LIMIT 1`,
        targetId
      );
      user = refreshed[0] || null;
    } catch (e) {
      console.error('[DEBUG /profile/me] Error syncing user:', e);
    }
  }

  if (!user) {
    return notFound();
  }

  // If another user or guest tries to access this private ID profile, redirect to public profile
  if (!isOwnProfile) {
    const publicHandle = user.username || user.id;
    return redirect(`/profile/public/${publicHandle}`);
  }

  // Fetch definition count
  const defCount = await prisma.definition.count({
    where: { authorId: targetId },
  });

  // Fetch recent definitions
  const recentDefinitions = await prisma.definition.findMany({
    where: { authorId: targetId },
    orderBy: { createdAt: 'desc' },
    take: 25,
    include: {
      word: {
        select: { displayTerm: true },
      },
    },
  });

  // Calculate total upvotes (sum of netScore for all definitions)
  const totalUpvotesData = await prisma.definition.aggregate({
    where: { authorId: targetId },
    _sum: { netScore: true },
  });
  
  const totalUpvotes = totalUpvotesData._sum.netScore || 0;

  const profileData = {
    id: user.id,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    stateOfOrigin: user.stateOfOrigin,
    primaryLanguage: user.primaryLanguage,
    showEmailPublicly: user.showEmailPublicly ?? false,
    showStatePublicly: user.showStatePublicly ?? true,
    showLanguagePublicly: user.showLanguagePublicly ?? true,
    showStatsPublicly: user.showStatsPublicly ?? true,
    role: user.role || 'user',
    isVerified: !!user.isVerified,
    image: user.image,
    reputationScore: user.reputationScore || 0,
    _count: { definitions: defCount },
    totalUpvotes,
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8 animate-in fade-in duration-500 mt-20">
      <ProfileHeader user={profileData} isOwnProfile={isOwnProfile} />
      <ProfileActivity definitions={recentDefinitions} />
    </div>
  );
}
