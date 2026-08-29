'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { AddWordDialog } from '@/components/add-word-dialog';
import { ThumbsUp, BookOpen, Clock, Key, ArrowUpRight } from 'lucide-react';
import { SubmissionsListSkeleton } from '@/components/skeletons';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface UserSubmission {
  id: string;
  meaning: string;
  dialect?: string | null;
  example: string | null;
  examples?: string[];
  netScore: number;
  createdAt: string;
  word: {
    id: string;
    displayTerm: string;
    normalizedTerm: string;
    languageFamily: string | null;
  };
}

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [apiKey, setApiKey] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [hasSavedKey, setHasSavedKey] = useState(false);

  const [submissions, setSubmissions] = useState<UserSubmission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/');
    }
  }, [session, isPending, router]);

  const fetchSubmissions = async () => {
    setSubmissionsLoading(true);
    try {
      const res = await fetch('/api/user/submissions');
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
      }
    } catch (e) {
      console.error('Failed to fetch submissions', e);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      // Fetch user's saved key status
      fetch('/api/user/keys')
        .then(res => res.json())
        .then(data => {
          if (data.hasKey) setHasSavedKey(true);
        })
        .catch(err => console.error("Failed to fetch key status", err));

      // Fetch user's submissions
      fetchSubmissions();
    }
  }, [session]);

  const handleSaveApiKey = async () => {
    setIsSavingKey(true);
    try {
      const res = await fetch('/api/user/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: apiKey }),
      });
      const data = await res.json();
      if (data.success) {
        setHasSavedKey(data.hasKey);
        setApiKey(''); // Clear it from input for security
      }
    } catch (e) {
      console.error("Failed to save key");
    } finally {
      setIsSavingKey(false);
    }
  };

  if (isPending || !session) {
    return (
      <div className="min-h-screen w-full max-w-5xl mx-auto px-6 py-12 space-y-8 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64 rounded-2xl" />
            <Skeleton className="h-4 w-48 rounded-md" />
          </div>
          <Skeleton className="h-10 w-36 rounded-full" />
        </div>
        <SubmissionsListSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground flex flex-col selection:bg-primary selection:text-primary-foreground relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 blur-[120px] rounded-full pointer-events-none -z-10" />

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <header className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Welcome, {session.user.name}
            </h1>
            <p className="text-sm font-bold tracking-widest uppercase text-muted-foreground">
              {session.user.email}
            </p>
          </div>

          <Link
            href="/profile/me"
            className="self-start sm:self-auto px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-widest text-primary transition-all flex items-center gap-1.5"
          >
            Public Profile <ArrowUpRight className="w-4 h-4" />
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column: User Submissions */}
          <div className="lg:col-span-2 space-y-8">
            <section className="glass-panel rounded-[2rem] p-6 md:p-10 border border-white/10 shadow-2xl">
              <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-5">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-foreground">
                    Your Submissions
                  </h2>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-1">
                    {submissions.length} {submissions.length === 1 ? 'definition' : 'definitions'} contributed
                  </p>
                </div>
                <Link
                  href="/contribute"
                  className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-wider text-xs h-10 px-5 inline-flex items-center shadow-md transition-all hover:scale-105"
                >
                  + Contribute Word
                </Link>
              </div>

              {submissionsLoading ? (
                <SubmissionsListSkeleton />
              ) : submissions.length > 0 ? (
                <div className="divide-y divide-white/5 space-y-4">
                  {submissions.map((sub) => (
                    <div key={sub.id} className="pt-4 first:pt-0 group">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/?q=${encodeURIComponent(sub.word.displayTerm)}`}
                              className="text-xl font-black text-primary hover:underline lowercase tracking-tight flex items-center gap-1.5"
                            >
                              {sub.word.displayTerm}
                              <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                            {sub.dialect && (
                              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                {sub.dialect}
                              </span>
                            )}
                          </div>
                          {sub.word.languageFamily && sub.word.languageFamily !== sub.dialect && (
                            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
                              Origin: {sub.word.languageFamily}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-black text-primary shrink-0">
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>{sub.netScore}</span>
                        </div>
                      </div>

                      <p className="text-sm text-foreground/90 font-medium leading-relaxed">
                        {sub.meaning}
                      </p>

                      {/* Render multiple examples */}
                      {((sub.examples && sub.examples.length > 0) ? sub.examples : (sub.example ? [sub.example] : [])).map((ex, exIdx) => (
                        <p key={exIdx} className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-3 py-0.5 mt-2">
                          &quot;{ex}&quot;
                        </p>
                      ))}

                      <div className="mt-3 text-[10px] text-muted-foreground flex items-center gap-1.5 uppercase font-semibold tracking-wider">
                        <Clock className="w-3 h-3" />
                        <span>Added {new Date(sub.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/30 border border-white/10 mb-6">
                    <BookOpen className="w-10 h-10 text-primary/50" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">No submissions yet</h3>
                  <p className="text-muted-foreground font-medium max-w-md mx-auto text-sm leading-relaxed mb-6">
                    You haven&apos;t contributed any words or definitions to The Nigerian Dictionary yet. Click the button below to get started.
                  </p>
                  <Link
                    href="/contribute"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
                  >
                    + Open Contribute Studio
                  </Link>
                </div>
              )}
            </section>
          </div>

          {/* Right Column: API Integrations */}
          <div className="space-y-8">
            <section className="glass-panel rounded-[2rem] p-6 md:p-8 border border-white/10 shadow-2xl">
              <div className="mb-6 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Key className="w-4 h-4 text-primary" />
                  <h2 className="text-xl font-black uppercase tracking-tight text-foreground">
                    API Integrations
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Connect your personal OpenRouter API key to power AI suggestion features with your custom models and quota.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between">
                    <span>OpenRouter Key</span>
                    {hasSavedKey && <span className="text-primary font-black">● Active</span>}
                  </label>
                  <input
                    type="password"
                    placeholder={hasSavedKey ? "••••••••••••••••••••••••" : "sk-or-v1-..."}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                    Keys are stored with AES-256 encryption. We never expose them in plain text. Leave blank and click save to remove your key.
                  </p>
                </div>
                <Button 
                  onClick={handleSaveApiKey}
                  disabled={isSavingKey}
                  className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-wider text-xs h-11 transition-all"
                >
                  {isSavingKey ? 'Saving...' : (hasSavedKey && !apiKey ? 'Remove Key' : 'Save Key')}
                </Button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

