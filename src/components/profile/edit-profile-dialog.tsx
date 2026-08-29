'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Settings, Loader2, Eye, UserCheck, Shield, ExternalLink, Globe } from 'lucide-react';
import { CloseButton } from '@/components/ui/close-button';
import { Button } from '@/components/ui/button';
import { NIGERIAN_STATES } from '@/lib/states';
import { NIGERIAN_LANGUAGES } from '@/lib/languages';
import Link from 'next/link';

type UserData = {
  id: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  email?: string | null;
  stateOfOrigin?: string | null;
  primaryLanguage?: string | null;
  showEmailPublicly?: boolean;
  showStatePublicly?: boolean;
  showLanguagePublicly?: boolean;
  showStatsPublicly?: boolean;
};

type Props = {
  user: UserData;
  onUpdate: (updates: Partial<UserData>) => void;
};

export function EditProfileDialog({ user, onUpdate }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'privacy'>('profile');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    username: user.username || user.name.toLowerCase().replace(/[^a-z0-9_]/g, ''),
    stateOfOrigin: user.stateOfOrigin || '',
    primaryLanguage: user.primaryLanguage || '',
    showEmailPublicly: user.showEmailPublicly ?? false,
    showStatePublicly: user.showStatePublicly ?? true,
    showLanguagePublicly: user.showLanguagePublicly ?? true,
    showStatsPublicly: user.showStatsPublicly ?? true,
  });

  // Sync state if user prop updates
  useEffect(() => {
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || user.name.toLowerCase().replace(/[^a-z0-9_]/g, ''),
      stateOfOrigin: user.stateOfOrigin || '',
      primaryLanguage: user.primaryLanguage || '',
      showEmailPublicly: user.showEmailPublicly ?? false,
      showStatePublicly: user.showStatePublicly ?? true,
      showLanguagePublicly: user.showLanguagePublicly ?? true,
      showStatsPublicly: user.showStatsPublicly ?? true,
    });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const cleanUsername = formData.username.trim().toLowerCase().replace(/^@+/, '').replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 3) {
      setErrorMessage('Username must be at least 3 alphanumeric characters.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          username: cleanUsername,
          stateOfOrigin: formData.stateOfOrigin.trim(),
          primaryLanguage: formData.primaryLanguage.trim(),
          showEmailPublicly: formData.showEmailPublicly,
          showStatePublicly: formData.showStatePublicly,
          showLanguagePublicly: formData.showLanguagePublicly,
          showStatsPublicly: formData.showStatsPublicly,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      
      onUpdate({
        name: `${formData.firstName} ${formData.lastName}`.trim() || formData.username,
        firstName: formData.firstName || null,
        lastName: formData.lastName || null,
        username: cleanUsername,
        stateOfOrigin: formData.stateOfOrigin || null,
        primaryLanguage: formData.primaryLanguage || null,
        showEmailPublicly: formData.showEmailPublicly,
        showStatePublicly: formData.showStatePublicly,
        showLanguagePublicly: formData.showLanguagePublicly,
        showStatsPublicly: formData.showStatsPublicly,
      });
      setIsOpen(false);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || 'Error updating profile');
    } finally {
      setIsLoading(false);
    }
  };

  const publicHandle = formData.username || user.username || 'user';

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-all border border-primary/30 text-xs font-black uppercase tracking-wider hover:scale-105"
      >
        <Settings className="w-4 h-4" />
        <span>Settings</span>
      </button>

      {isOpen && mounted && document.body && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setIsOpen(false)} />
          
          <div className="glass-panel w-full max-w-lg p-6 sm:p-8 rounded-3xl relative z-10 animate-in fade-in zoom-in-95 duration-200 border border-border/60 shadow-2xl max-h-[90vh] overflow-y-auto">
            <CloseButton onClick={() => setIsOpen(false)} />
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-foreground">Profile & Privacy Settings</h2>
                <p className="text-xs text-muted-foreground font-medium">Control your community identity and public visibility.</p>
              </div>
            </div>

            {/* Public Profile Shortcut Banner */}
            <div className="p-3.5 mb-6 rounded-2xl bg-card/70 border border-border/50 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-foreground font-bold">
                <Globe className="w-4 h-4 text-primary shrink-0" />
                <span className="truncate">Public URL: <strong className="text-primary">/profile/public/{publicHandle}</strong></span>
              </div>
              <Link 
                href={`/profile/public/${publicHandle}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-primary hover:underline shrink-0"
              >
                <span>View</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 rounded-2xl bg-secondary/20 border border-border/40 mb-6">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  activeTab === 'profile'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Profile Info
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('privacy')}
                className={`flex-1 py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  activeTab === 'privacy'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Privacy & Visibility
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 mb-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold">
                {errorMessage}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'profile' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-primary mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full bg-background/50 border border-border/50 rounded-xl p-3 text-sm font-bold text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                        placeholder="e.g. Rose"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-primary mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full bg-background/50 border border-border/50 rounded-xl p-3 text-sm font-bold text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                        placeholder="e.g. welltin"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-primary mb-1">
                      Unique Username (@handle) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-sm">@</span>
                      <input
                        type="text"
                        required
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                        className="w-full pl-8 bg-background/50 border border-border/50 rounded-xl p-3 text-sm font-bold text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                        placeholder="rosewelltin"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-primary mb-1">
                      State in Nigeria
                    </label>
                    <select
                      value={formData.stateOfOrigin}
                      onChange={(e) => setFormData({ ...formData, stateOfOrigin: e.target.value })}
                      className="w-full bg-background/50 border border-border/50 rounded-xl p-3 text-sm font-bold text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                    >
                      <option value="">Select State</option>
                      {NIGERIAN_STATES.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-primary mb-1">
                      Native Heritage Language
                    </label>
                    <input
                      type="text"
                      value={formData.primaryLanguage}
                      onChange={(e) => setFormData({ ...formData, primaryLanguage: e.target.value })}
                      className="w-full bg-background/50 border border-border/50 rounded-xl p-3 text-sm font-bold text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                      placeholder="e.g. Yoruba, Igbo, Hausa"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-xs text-muted-foreground">
                    Choose what information is visible to other users on your public profile (<strong className="text-foreground">/profile/public/{publicHandle}</strong>).
                  </div>

                  <div className="space-y-3">
                    {/* Toggle: Show Email */}
                    <label className="p-3.5 rounded-2xl bg-card/60 border border-border/40 flex items-center justify-between gap-4 cursor-pointer hover:border-primary/40 transition-colors">
                      <div>
                        <div className="text-xs font-black uppercase tracking-wide text-foreground">Show Email Address</div>
                        <div className="text-[11px] text-muted-foreground">Allow public visitors to see your email address.</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.showEmailPublicly}
                        onChange={(e) => setFormData({ ...formData, showEmailPublicly: e.target.checked })}
                        className="w-5 h-5 accent-primary cursor-pointer rounded"
                      />
                    </label>

                    {/* Toggle: Show State */}
                    <label className="p-3.5 rounded-2xl bg-card/60 border border-border/40 flex items-center justify-between gap-4 cursor-pointer hover:border-primary/40 transition-colors">
                      <div>
                        <div className="text-xs font-black uppercase tracking-wide text-foreground">Show State of Origin</div>
                        <div className="text-[11px] text-muted-foreground">Display your Nigerian home state badge.</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.showStatePublicly}
                        onChange={(e) => setFormData({ ...formData, showStatePublicly: e.target.checked })}
                        className="w-5 h-5 accent-primary cursor-pointer rounded"
                      />
                    </label>

                    {/* Toggle: Show Language */}
                    <label className="p-3.5 rounded-2xl bg-card/60 border border-border/40 flex items-center justify-between gap-4 cursor-pointer hover:border-primary/40 transition-colors">
                      <div>
                        <div className="text-xs font-black uppercase tracking-wide text-foreground">Show Native Language</div>
                        <div className="text-[11px] text-muted-foreground">Display your native dialect expertise badge.</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.showLanguagePublicly}
                        onChange={(e) => setFormData({ ...formData, showLanguagePublicly: e.target.checked })}
                        className="w-5 h-5 accent-primary cursor-pointer rounded"
                      />
                    </label>

                    {/* Toggle: Show Stats */}
                    <label className="p-3.5 rounded-2xl bg-card/60 border border-border/40 flex items-center justify-between gap-4 cursor-pointer hover:border-primary/40 transition-colors">
                      <div>
                        <div className="text-xs font-black uppercase tracking-wide text-foreground">Show Reputation & Upvotes</div>
                        <div className="text-[11px] text-muted-foreground">Showcase your community reputation counters publicly.</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.showStatsPublicly}
                        onChange={(e) => setFormData({ ...formData, showStatsPublicly: e.target.checked })}
                        className="w-5 h-5 accent-primary cursor-pointer rounded"
                      />
                    </label>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="rounded-xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider flex items-center gap-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
