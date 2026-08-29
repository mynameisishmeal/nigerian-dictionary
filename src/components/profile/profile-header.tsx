'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, ShieldCheck, Star, Sparkles, MapPin, Languages, Mail, Globe } from 'lucide-react';
import { EditProfileDialog } from './edit-profile-dialog';

type ProfileHeaderProps = {
  user: {
    id: string;
    name: string;
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
    email?: string | null;
    stateOfOrigin?: string | null;
    primaryLanguage?: string | null;
    role?: string | null;
    isVerified?: boolean;
    image?: string | null;
    reputationScore: number;
    _count: {
      definitions: number;
    };
    totalUpvotes: number;
  };
  isOwnProfile: boolean;
};

export function ProfileHeader({ user: initialUser, isOwnProfile }: ProfileHeaderProps) {
  const [user, setUser] = useState(initialUser);

  // Compute display title
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name;
  const usernameHandle = user.username || user.name.toLowerCase().replace(/[^a-z0-9_]/g, '');

  const isSuperAdmin = user.role === 'superadmin' || user.role === 'admin';
  const isContributor = user.role === 'contributor' || isSuperAdmin;

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-border/60 shadow-2xl flex flex-col sm:flex-row items-center sm:items-start gap-6 relative animate-in fade-in duration-300">
      {/* Avatar */}
      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-primary/30 shrink-0 bg-primary/10 flex items-center justify-center shadow-lg shadow-primary/10">
        {user.image ? (
          <img src={user.image} alt={fullName} className="w-full h-full object-cover" />
        ) : (
          <User className="w-12 h-12 sm:w-16 sm:h-16 text-primary/60" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 text-center sm:text-left space-y-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {fullName} <span className="text-primary font-bold">({usernameHandle})</span>
            </h1>

            {/* Role / Verification Badges */}
            {isSuperAdmin ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3" /> Superadmin
              </span>
            ) : isContributor ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-wider">
                <Star className="w-3 h-3 fill-primary" /> Contributor
              </span>
            ) : null}

            {user.isVerified && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-500 text-[10px] font-black uppercase tracking-wider">
                <Sparkles className="w-3 h-3" /> Verified
              </span>
            )}
          </div>

          {/* Email */}
          {user.email && (
            <p className="text-sm font-semibold text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-3.5 h-3.5 text-primary/70" />
              <span>{user.email}</span>
            </p>
          )}

          {/* Location & Native Language Pills */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
            {user.primaryLanguage && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/80 border border-border/50 text-xs font-bold text-foreground shadow-sm">
                <Languages className="w-3.5 h-3.5 text-primary" />
                <span>Native: <strong className="text-primary font-black">{user.primaryLanguage}</strong></span>
              </span>
            )}

            {user.stateOfOrigin && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/80 border border-border/50 text-xs font-bold text-foreground shadow-sm">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>{user.stateOfOrigin} State</span>
              </span>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="flex flex-wrap gap-3 justify-center sm:justify-start pt-2">
          <div className="glass-panel px-4 py-2 rounded-2xl text-center border border-border/50 shadow-sm min-w-[90px]">
            <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Reputation</div>
            <div className="text-lg font-black text-primary">{user.reputationScore}</div>
          </div>
          <div className="glass-panel px-4 py-2 rounded-2xl text-center border border-border/50 shadow-sm min-w-[90px]">
            <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Definitions</div>
            <div className="text-lg font-black text-foreground">{user._count.definitions}</div>
          </div>
          <div className="glass-panel px-4 py-2 rounded-2xl text-center border border-border/50 shadow-sm min-w-[90px]">
            <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Net Upvotes</div>
            <div className="text-lg font-black text-green-500">{user.totalUpvotes}</div>
          </div>
        </div>
      </div>

      {/* Action Buttons for Profile Owner */}
      {isOwnProfile && (
        <div className="sm:absolute sm:top-6 sm:right-6 flex items-center gap-2">
          <Link
            href={`/profile/public/${usernameHandle}`}
            target="_blank"
            className="flex items-center gap-1.5 px-4 py-2 bg-secondary/20 hover:bg-secondary/40 text-foreground rounded-full transition-all border border-border/40 text-xs font-black uppercase tracking-wider hover:scale-105"
          >
            <Globe className="w-3.5 h-3.5 text-primary" />
            <span>Public View</span>
          </Link>
          <EditProfileDialog 
            user={user as any} 
            onUpdate={(updates) => setUser({ ...user, ...updates })} 
          />
        </div>
      )}
    </div>
  );
}
