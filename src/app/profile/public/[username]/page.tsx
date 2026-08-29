import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { User, ShieldCheck, Star, Sparkles, MapPin, Languages, Mail, Globe, Share2, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { ProfileActivity } from '@/components/profile/profile-activity';
import { ShareProfileButton } from '@/components/profile/share-profile-button';

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = await params;
  const rawHandle = resolvedParams.username;
  const cleanHandle = decodeURIComponent(rawHandle).toLowerCase().replace(/^@+/, '').trim();

  // Find user by username or ID
  const users: any[] = await prisma.$queryRawUnsafe(
    `SELECT "id", "name", "firstName", "lastName", "username", "email", "image", "stateOfOrigin", "primaryLanguage", "role", "reputationScore", "isVerified", "showEmailPublicly", "showStatePublicly", "showLanguagePublicly", "showStatsPublicly", "createdAt"
     FROM "user"
     WHERE LOWER("username") = $1 OR "id" = $2
     LIMIT 1`,
    cleanHandle,
    cleanHandle
  );

  const user = users[0] || null;

  if (!user) {
    return notFound();
  }

  // Canonicalize UUID to clean username handle if user has a username
  if (user.username && cleanHandle === user.id.toLowerCase()) {
    return redirect(`/profile/public/${user.username}`);
  }

  // Count definitions
  const defCount = await prisma.definition.count({
    where: { authorId: user.id },
  });

  // Calculate total upvotes
  const totalUpvotesData = await prisma.definition.aggregate({
    where: { authorId: user.id },
    _sum: { netScore: true },
  });
  const totalUpvotes = totalUpvotesData._sum.netScore || 0;

  // Fetch recent definitions
  const recentDefinitions = await prisma.definition.findMany({
    where: { authorId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
    include: {
      word: {
        select: { displayTerm: true },
      },
    },
  });

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name;
  const usernameHandle = user.username || user.name.toLowerCase().replace(/[^a-z0-9_]/g, '');

  const isSuperAdmin = user.role === 'superadmin' || user.role === 'admin';
  const isContributor = user.role === 'contributor' || isSuperAdmin;

  // Privacy filters
  const showEmail = user.showEmailPublicly && user.email;
  const showState = user.showStatePublicly && user.stateOfOrigin;
  const showLanguage = user.showLanguagePublicly && user.primaryLanguage;
  const showStats = user.showStatsPublicly ?? true;

  return (
    <div className="min-h-screen text-foreground selection:bg-primary selection:text-primary-foreground relative overflow-hidden pb-20 mt-16">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-primary/10 blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-secondary/10 blur-[140px] rounded-full pointer-events-none -z-10" />

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8 animate-in fade-in duration-500">
        
        {/* PUBLIC PROFILE HEADER CARD */}
        <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-border/60 shadow-2xl flex flex-col sm:flex-row items-center sm:items-start gap-6 relative">
          
          {/* Avatar */}
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-primary/30 shrink-0 bg-primary/10 flex items-center justify-center shadow-xl shadow-primary/10">
            {user.image ? (
              <img src={user.image} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 sm:w-16 sm:h-16 text-primary/60" />
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 text-center sm:text-left space-y-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                  {fullName} <span className="text-primary font-bold">({usernameHandle})</span>
                </h1>

                {/* Role Badges */}
                {isSuperAdmin ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3" /> Superadmin
                  </span>
                ) : isContributor ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-wider">
                    <Star className="w-3 h-3 fill-primary" /> Contributor
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary/30 border border-border/40 text-muted-foreground text-[10px] font-black uppercase tracking-wider">
                    Member
                  </span>
                )}

                {user.isVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-500 text-[10px] font-black uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>

              {/* Public Email (If Permitted) */}
              {showEmail && (
                <p className="text-sm font-semibold text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary/70" />
                  <span>{user.email}</span>
                </p>
              )}

              {/* Badges / Native Language / Origin State */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                {showLanguage && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/80 border border-border/50 text-xs font-bold text-foreground shadow-sm">
                    <Languages className="w-3.5 h-3.5 text-primary" />
                    <span>Native: <strong className="text-primary font-black">{user.primaryLanguage}</strong></span>
                  </span>
                )}

                {showState && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/80 border border-border/50 text-xs font-bold text-foreground shadow-sm">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span>{user.stateOfOrigin} State</span>
                  </span>
                )}

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/80 border border-border/50 text-xs font-medium text-muted-foreground shadow-sm">
                  <Globe className="w-3.5 h-3.5 text-primary/60" />
                  <span>Public Contributor</span>
                </span>
              </div>
            </div>

            {/* Public Stats (If Permitted) */}
            {showStats && (
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start pt-2">
                <div className="glass-panel px-4 py-2 rounded-2xl text-center border border-border/50 shadow-sm min-w-[90px]">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Reputation</div>
                  <div className="text-lg font-black text-primary">{user.reputationScore}</div>
                </div>
                <div className="glass-panel px-4 py-2 rounded-2xl text-center border border-border/50 shadow-sm min-w-[90px]">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Definitions</div>
                  <div className="text-lg font-black text-foreground">{defCount}</div>
                </div>
                <div className="glass-panel px-4 py-2 rounded-2xl text-center border border-border/50 shadow-sm min-w-[90px]">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Net Upvotes</div>
                  <div className="text-lg font-black text-green-500">{totalUpvotes}</div>
                </div>
              </div>
            )}
          </div>

          {/* Share Profile Button */}
          <div className="sm:absolute sm:top-6 sm:right-6">
            <ShareProfileButton username={usernameHandle} />
          </div>
        </div>

        {/* RECENT DEFINITIONS & ACTIVITY */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <span>Contributed Definitions ({recentDefinitions.length})</span>
            </h2>
          </div>

          <ProfileActivity definitions={recentDefinitions} />
        </div>
      </main>
    </div>
  );
}
