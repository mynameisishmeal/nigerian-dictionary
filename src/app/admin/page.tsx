'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import {
  ShieldCheck,
  BookOpen,
  Layers,
  Users,
  Award,
  Search,
  RefreshCw,
  Trash2,
  Edit3,
  CheckCircle,
  XCircle,
  Activity,
  Key,
  Database,
  Sliders,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatsGridSkeleton, ArchiveTableSkeleton } from '@/components/skeletons';
import { Skeleton } from '@/components/ui/skeleton';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();

  const [activeTab, setActiveTab] = useState<'overview' | 'words' | 'users' | 'search' | 'system'>('overview');
  const [statsData, setStatsData] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Words state
  const [wordsList, setWordsList] = useState<any[]>([]);
  const [wordsTotal, setWordsTotal] = useState(0);
  const [wordsPage, setWordsPage] = useState(1);
  const [wordsQuery, setWordsQuery] = useState('');
  const [wordsLoading, setWordsLoading] = useState(false);

  // Users state
  const [usersList, setUsersList] = useState<any[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersQuery, setUsersQuery] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);

  // Edit Word modal state
  const [editingWord, setEditingWord] = useState<any | null>(null);
  const [editDisplayTerm, setEditDisplayTerm] = useState('');
  const [editLang, setEditLang] = useState('');
  const [isSavingWord, setIsSavingWord] = useState(false);

  // Re-index Algolia state
  const [isReindexing, setIsReindexing] = useState(false);
  const [reindexMessage, setReindexMessage] = useState<string | null>(null);

  // Fetch initial stats & verify admin permission
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) {
        const data = await res.json();
        setAuthError(data.error || 'Access denied');
        return;
      }
      const data = await res.json();
      setStatsData(data);
      setAuthError(null);
    } catch (err: any) {
      setAuthError('Failed to connect to admin services');
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (!sessionPending) {
      if (!session) {
        router.push('/');
      } else {
        fetchStats();
      }
    }
  }, [session, sessionPending, router]);

  // Fetch words with pagination/query
  const fetchWords = async (page = 1, q = '') => {
    setWordsLoading(true);
    try {
      const res = await fetch(`/api/admin/words?page=${page}&limit=15&q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setWordsList(data.words);
        setWordsTotal(data.pagination.total);
        setWordsPage(data.pagination.page);
      }
    } catch (e) {
      console.error('Fetch words error:', e);
    } finally {
      setWordsLoading(false);
    }
  };

  // Fetch users with pagination/query
  const fetchUsers = async (page = 1, q = '') => {
    setUsersLoading(true);
    try {
      const res = await fetch(`/api/admin/users?page=${page}&limit=15&q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users);
        setUsersTotal(data.pagination.total);
        setUsersPage(data.pagination.page);
      }
    } catch (e) {
      console.error('Fetch users error:', e);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'words') fetchWords(wordsPage, wordsQuery);
    if (activeTab === 'users') fetchUsers(usersPage, usersQuery);
  }, [activeTab]);

  // Delete word action
  const handleDeleteWord = async (id: string, term: string) => {
    if (!confirm(`Are you sure you want to delete "${term}" and all its definitions?`)) return;
    try {
      const res = await fetch(`/api/admin/words?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setWordsList((prev) => prev.filter((w) => w.id !== id));
        setWordsTotal((prev) => Math.max(0, prev - 1));
        fetchStats();
      } else {
        alert('Failed to delete word');
      }
    } catch (e) {
      alert('Error deleting word');
    }
  };

  // Delete definition action
  const handleDeleteDefinition = async (defId: string) => {
    if (!confirm('Are you sure you want to delete this definition?')) return;
    try {
      const res = await fetch(`/api/admin/definitions?id=${defId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchWords(wordsPage, wordsQuery);
        fetchStats();
      } else {
        alert('Failed to delete definition');
      }
    } catch (e) {
      alert('Error deleting definition');
    }
  };

  // Save word edit
  const handleSaveWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWord) return;
    setIsSavingWord(true);
    try {
      const res = await fetch('/api/admin/words', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingWord.id,
          displayTerm: editDisplayTerm,
          languageFamily: editLang || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setWordsList((prev) => prev.map((w) => (w.id === editingWord.id ? { ...w, ...data.word } : w)));
        setEditingWord(null);
      } else {
        alert('Failed to update word');
      }
    } catch (e) {
      alert('Error saving word');
    } finally {
      setIsSavingWord(false);
    }
  };

  // Update user role, verified status, or reputation
  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, ...updates }),
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList((prev) => prev.map((u) => (u.id === userId ? { ...u, ...data.user } : u)));
        fetchStats();
      } else {
        alert('Failed to update user');
      }
    } catch (e) {
      alert('Error updating user');
    }
  };

  // Trigger Algolia re-index
  const handleReindexAlgolia = async () => {
    setIsReindexing(true);
    setReindexMessage(null);
    try {
      const res = await fetch('/api/admin/reindex-algolia', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setReindexMessage(`Success: ${data.message}`);
      } else {
        setReindexMessage(`Error: ${data.error || 'Failed to re-index'}`);
      }
    } catch (e: any) {
      setReindexMessage(`Error: ${e.message}`);
    } finally {
      setIsReindexing(false);
    }
  };

  if (sessionPending || statsLoading) {
    return (
      <div className="min-h-screen w-full max-w-7xl mx-auto px-4 py-10 space-y-8 animate-in fade-in duration-300">
        <div className="flex items-center justify-between pb-6 border-b border-border/40">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64 rounded-2xl" />
            <Skeleton className="h-4 w-80 rounded-md" />
          </div>
          <Skeleton className="h-10 w-36 rounded-full" />
        </div>
        <StatsGridSkeleton />
        <ArchiveTableSkeleton />
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="glass-panel p-8 rounded-3xl max-w-md border border-destructive/30 text-destructive space-y-4">
          <AlertTriangle className="w-12 h-12 mx-auto" />
          <h1 className="text-2xl font-black uppercase tracking-tight">Access Restricted</h1>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {authError}. Superadmin privileges are required to access this dashboard.
          </p>
          <div className="pt-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground flex flex-col selection:bg-primary selection:text-primary-foreground pb-16">
      {/* Top Banner Header */}
      <header className="border-b border-white/10 bg-card/40 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black uppercase tracking-tight text-foreground">
                  Superadmin Suite
                </h1>
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                  Root Mode
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Connected as {session?.user.email}
              </p>
            </div>
          </div>

          {/* Quick Actions & Navigation */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleReindexAlgolia}
              disabled={isReindexing}
              variant="outline"
              size="sm"
              className="rounded-full border-primary/30 text-primary hover:bg-primary/10 text-xs font-bold uppercase tracking-wider h-9 px-4 gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReindexing ? 'animate-spin' : ''}`} />
              {isReindexing ? 'Re-indexing...' : 'Sync Search'}
            </Button>

            <Link
              href="/"
              className="rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-foreground px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              Public App
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto gap-2 pt-2 border-t border-white/5 no-scrollbar">
          {[
            { id: 'overview', label: 'Overview & Metrics', icon: Activity },
            { id: 'words', label: `Words & Content (${statsData?.metrics.totalWords || 0})`, icon: BookOpen },
            { id: 'users', label: `Users & Roles (${statsData?.metrics.totalUsers || 0})`, icon: Users },
            { id: 'search', label: 'Search & Maintenance', icon: Database },
            { id: 'system', label: 'System & Integrations', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-8 flex-1 animate-in fade-in duration-300">
        
        {/* ===================== TAB 1: OVERVIEW ===================== */}
        {activeTab === 'overview' && statsData && (
          <div className="space-y-8">
            {/* Live Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Words', value: statsData.metrics.totalWords, icon: BookOpen, color: 'text-primary' },
                { label: 'Definitions', value: statsData.metrics.totalDefinitions, icon: Layers, color: 'text-primary' },
                { label: 'Total Users', value: statsData.metrics.totalUsers, icon: Users, color: 'text-primary' },
                { label: 'Total Votes', value: statsData.metrics.totalVotes, icon: Award, color: 'text-green-500' },
                { label: 'Verified NINs', value: statsData.metrics.verifiedUsers, icon: ShieldCheck, color: 'text-primary' },
                { label: 'BYOK Keys', value: statsData.metrics.usersWithKeys, icon: Key, color: 'text-purple-400' },
              ].map((metric) => {
                const Icon = metric.icon;
                return (
                  <div key={metric.label} className="glass-panel p-5 rounded-2xl flex flex-col justify-between border border-white/5 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{metric.label}</span>
                      <Icon className={`w-4 h-4 ${metric.color}`} />
                    </div>
                    <div className={`text-2xl lg:text-3xl font-black ${metric.color}`}>
                      {metric.value.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recent Definitions */}
              <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" /> Recent Definitions
                  </h3>
                  <button onClick={() => setActiveTab('words')} className="text-xs font-bold text-primary hover:underline uppercase">
                    View All
                  </button>
                </div>
                <div className="divide-y divide-white/5 space-y-2">
                  {statsData.recentDefinitions.slice(0, 5).map((def: any) => (
                    <div key={def.id} className="pt-2 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-primary">{def.word.displayTerm}</span>
                          {def.word.languageFamily && (
                            <span className="text-[9px] uppercase tracking-wider font-bold bg-white/5 px-2 py-0.5 rounded text-muted-foreground">
                              {def.word.languageFamily}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{def.meaning}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-primary">★ {def.netScore}</span>
                        <div className="text-[9px] text-muted-foreground">{def.author.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Registrations */}
              <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" /> Recent Users
                  </h3>
                  <button onClick={() => setActiveTab('users')} className="text-xs font-bold text-primary hover:underline uppercase">
                    Manage Users
                  </button>
                </div>
                <div className="divide-y divide-white/5 space-y-2">
                  {statsData.recentUsers.slice(0, 5).map((u: any) => (
                    <div key={u.id} className="pt-2 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">{u.name}</span>
                          {u.isVerified && (
                            <span className="text-[9px] font-black uppercase tracking-wider bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded">
                              Verified
                            </span>
                          )}
                          <span className="text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            {u.role || 'user'}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{u.email}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-black text-primary">{u.reputationScore} Rep</div>
                        <div className="text-[10px] font-bold text-muted-foreground"><span className="text-primary font-black">{u._count.definitions}</span> defs</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: WORDS & CONTENT ===================== */}
        {activeTab === 'words' && (
          <div className="space-y-6">
            {/* Search Header */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row gap-3 justify-between items-center">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search word or dialect..."
                  value={wordsQuery}
                  onChange={(e) => setWordsQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') fetchWords(1, wordsQuery);
                  }}
                  className="pl-10 rounded-xl bg-muted/20 border-white/10 text-sm h-10"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  onClick={() => fetchWords(1, wordsQuery)}
                  size="sm"
                  className="rounded-xl font-bold uppercase tracking-wider text-xs h-10 px-5"
                >
                  Search
                </Button>
              </div>
            </div>

            {/* Words Table */}
            <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 border-b border-white/10 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                    <tr>
                      <th className="p-4">Word / Term</th>
                      <th className="p-4">Origin / Dialect</th>
                      <th className="p-4">Definitions</th>
                      <th className="p-4">Top Score</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {wordsLoading ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground uppercase tracking-widest font-bold animate-pulse">
                          Loading Words...
                        </td>
                      </tr>
                    ) : wordsList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground uppercase tracking-widest font-bold">
                          No matching words found.
                        </td>
                      </tr>
                    ) : (
                      wordsList.map((word) => (
                        <tr key={word.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-sm text-foreground">{word.displayTerm}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">{word.normalizedTerm}</div>
                          </td>
                          <td className="p-4">
                            {word.languageFamily ? (
                              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold uppercase text-[10px]">
                                {word.languageFamily}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/40 italic">None</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              {word.definitions.map((d: any) => (
                                <div key={d.id} className="flex items-start justify-between gap-2 group/def">
                                  <span className="line-clamp-1 text-foreground/80">{d.meaning}</span>
                                  <button
                                    onClick={() => handleDeleteDefinition(d.id)}
                                    className="opacity-0 group-hover/def:opacity-100 text-destructive hover:scale-110 transition-all"
                                    title="Delete definition"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 font-black text-primary">
                            ★ {word.definitions[0]?.netScore ?? 0}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingWord(word);
                                  setEditDisplayTerm(word.displayTerm);
                                  setEditLang(word.languageFamily || '');
                                }}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-foreground transition-all"
                                title="Edit Word"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteWord(word.id, word.displayTerm)}
                                className="p-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-all"
                                title="Delete Word"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-muted-foreground">
                <span>Total Words: {wordsTotal.toLocaleString()}</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={wordsPage <= 1 || wordsLoading}
                    onClick={() => fetchWords(wordsPage - 1, wordsQuery)}
                    className="h-8 w-8 p-0 rounded-lg"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="font-bold text-foreground">Page {wordsPage}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={wordsList.length < 15 || wordsLoading}
                    onClick={() => fetchWords(wordsPage + 1, wordsQuery)}
                    className="h-8 w-8 p-0 rounded-lg"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: USERS & ROLES ===================== */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Search Header */}
            <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row gap-3 justify-between items-center">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search user name or email..."
                  value={usersQuery}
                  onChange={(e) => setUsersQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') fetchUsers(1, usersQuery);
                  }}
                  className="pl-10 rounded-xl bg-muted/20 border-white/10 text-sm h-10"
                />
              </div>

              <Button
                onClick={() => fetchUsers(1, usersQuery)}
                size="sm"
                className="rounded-xl font-bold uppercase tracking-wider text-xs h-10 px-5"
              >
                Search Users
              </Button>
            </div>

            {/* Users Table */}
            <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 border-b border-white/10 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                    <tr>
                      <th className="p-4">User</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">NIN Verified</th>
                      <th className="p-4">Reputation</th>
                      <th className="p-4">Contributions</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {usersLoading ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground uppercase tracking-widest font-bold animate-pulse">
                          Loading Users...
                        </td>
                      </tr>
                    ) : usersList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground uppercase tracking-widest font-bold">
                          No matching users found.
                        </td>
                      </tr>
                    ) : (
                      usersList.map((u) => (
                        <tr key={u.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary shrink-0 overflow-hidden">
                                {u.image ? <img src={u.image} alt={u.name} className="w-full h-full object-cover" /> : u.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-sm text-foreground">{u.name}</div>
                                <div className="text-[10px] text-muted-foreground">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <select
                              value={u.role || 'user'}
                              onChange={(e) => handleUpdateUser(u.id, { role: e.target.value })}
                              className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-foreground focus:ring-1 focus:ring-primary"
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                              <option value="superadmin">Superadmin</option>
                            </select>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleUpdateUser(u.id, { isVerified: !u.isVerified })}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all ${
                                u.isVerified
                                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                  : 'bg-white/5 text-muted-foreground border-white/10 hover:border-primary/50'
                              }`}
                            >
                              {u.isVerified ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {u.isVerified ? 'Verified' : 'Unverified'}
                            </button>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-primary text-sm">{u.reputationScore}</span>
                              <button
                                onClick={() => handleUpdateUser(u.id, { reputationScore: u.reputationScore + 10 })}
                                className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-primary/20 text-primary text-[10px] font-bold"
                                title="+10 Reputation"
                              >
                                +10
                              </button>
                              <button
                                onClick={() => handleUpdateUser(u.id, { reputationScore: Math.max(0, u.reputationScore - 10) })}
                                className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-destructive/20 text-destructive text-[10px] font-bold"
                                title="-10 Reputation"
                              >
                                -10
                              </button>
                            </div>
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {u._count.definitions} defs, {u._count.votes} votes
                          </td>
                          <td className="p-4 text-right">
                            <Link
                              href={`/profile/${u.id}`}
                              className="text-xs font-bold text-primary hover:underline uppercase tracking-wider"
                            >
                              Profile
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-muted-foreground">
                <span>Total Users: {usersTotal.toLocaleString()}</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={usersPage <= 1 || usersLoading}
                    onClick={() => fetchUsers(usersPage - 1, usersQuery)}
                    className="h-8 w-8 p-0 rounded-lg"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="font-bold text-foreground">Page {usersPage}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={usersList.length < 15 || usersLoading}
                    onClick={() => fetchUsers(usersPage + 1, usersQuery)}
                    className="h-8 w-8 p-0 rounded-lg"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 4: SEARCH & MAINTENANCE ===================== */}
        {activeTab === 'search' && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="glass-panel p-8 rounded-3xl border border-white/10 space-y-6 shadow-xl">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <Database className="w-6 h-6 text-primary" />
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-foreground">
                    Search Index Maintenance
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Synchronize PostgreSQL records into the Algolia search index for instant sub-millisecond lookups.
                  </p>
                </div>
              </div>

              <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                  <span className="text-muted-foreground">Algolia Target Index:</span>
                  <span className="text-primary font-mono font-bold">nigerian_dictionary_words</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                  <span className="text-muted-foreground">Total Records in Database:</span>
                  <span className="text-foreground font-black">{statsData?.metrics.totalWords || 0}</span>
                </div>
              </div>

              {reindexMessage && (
                <div
                  className={`p-4 rounded-xl text-xs font-bold uppercase tracking-wider border ${
                    reindexMessage.startsWith('Success')
                      ? 'bg-green-500/10 text-green-400 border-green-500/30'
                      : 'bg-destructive/10 text-destructive border-destructive/30'
                  }`}
                >
                  {reindexMessage}
                </div>
              )}

              <Button
                onClick={handleReindexAlgolia}
                disabled={isReindexing}
                className="w-full h-14 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-black uppercase tracking-widest text-sm shadow-lg gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isReindexing ? 'animate-spin' : ''}`} />
                {isReindexing ? 'Synchronizing with Algolia...' : 'Re-Index All Words to Algolia'}
              </Button>
            </div>
          </div>
        )}

        {/* ===================== TAB 5: SYSTEM & INTEGRATIONS ===================== */}
        {activeTab === 'system' && statsData && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="glass-panel p-8 rounded-3xl border border-white/10 space-y-6 shadow-xl">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <Sliders className="w-6 h-6 text-primary" />
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-foreground">
                    Integration Diagnostics
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Live system and external API connectivity status.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-white/5 space-y-4">
                {[
                  { name: 'Neon PostgreSQL Database', desc: 'Primary transactional storage & pooled connection', active: true },
                  { name: 'Neon Auth Authentication', desc: 'Secure session management & token verification', active: true },
                  { name: 'Algolia Search Engine', desc: 'Full-text indexing & autocomplete', active: statsData.systemStatus.algolia },
                  { name: 'OpenRouter AI Suggestion', desc: 'GPT-4o Mini linguistic assistance', active: statsData.systemStatus.openRouter },
                  { name: 'Serper Web Search', desc: 'Live context web enrichment fallback', active: statsData.systemStatus.serper },
                  { name: 'Tavily Search API', desc: 'Autonomous web research fallback layer', active: statsData.systemStatus.tavily },
                ].map((service) => (
                  <div key={service.name} className="pt-4 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-foreground">{service.name}</div>
                      <div className="text-xs text-muted-foreground">{service.desc}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${service.active ? 'bg-green-500 animate-pulse' : 'bg-destructive'}`} />
                      <span className={`text-xs font-black uppercase tracking-widest ${service.active ? 'text-green-400' : 'text-destructive'}`}>
                        {service.active ? 'Operational' : 'Unset / Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Edit Word Dialog Modal */}
      {editingWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-white/10 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black uppercase tracking-tight text-foreground">
              Edit Word: {editingWord.displayTerm}
            </h3>

            <form onSubmit={handleSaveWord} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Display Term
                </label>
                <Input
                  type="text"
                  required
                  value={editDisplayTerm}
                  onChange={(e) => setEditDisplayTerm(e.target.value)}
                  className="rounded-xl bg-muted/20 border-white/10 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Origin / Language Family
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Pidgin, Yoruba, Hausa, Igbo"
                  value={editLang}
                  onChange={(e) => setEditLang(e.target.value)}
                  className="rounded-xl bg-muted/20 border-white/10"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={isSavingWord}
                  className="flex-1 rounded-xl bg-primary font-bold uppercase tracking-wider text-xs h-11"
                >
                  {isSavingWord ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingWord(null)}
                  className="rounded-xl border-white/10 text-xs font-bold uppercase tracking-wider h-11"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
