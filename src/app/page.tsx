'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AddWordDialog } from '@/components/add-word-dialog';
import { MiniKeyboard } from '@/components/mini-keyboard';
import {
  ArrowBigUp,
  ArrowBigDown,
  Star,
  Clock,
  Users,
  BookOpen,
  Flame,
  Layers,
  ArrowRight,
  X,
  Search,
  CheckCircle,
  Sparkles,
  Globe,
} from 'lucide-react';
import Link from 'next/link';
import { HeroWordCardSkeleton, VariationCardSkeleton, StatsGridSkeleton, HomeOverviewSkeleton, DesktopSidebarSkeleton } from '@/components/skeletons';

interface Definition {
  id: string;
  meaning: string;
  dialect?: string | null;
  example: string | null;
  examples?: string[];
  netScore: number;
}

interface Word {
  id: string;
  displayTerm: string;
  aliases?: string[];
  languageFamily?: string;
  definitions: Definition[];
  createdAt?: string;
}

interface Contributor {
  id: string;
  name: string;
  firstName: string | null;
  image: string | null;
  reputationScore: number;
  _count: { definitions: number };
}

interface HomeStats {
  stats: { totalWords: number; totalDefinitions: number; totalContributors: number };
  wordOfTheDay: Word | null;
  recentWords: Word[];
  topContributors: Contributor[];
  languageFamilies: string[];
}

function AnimatedCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let start = 0;
    const step = Math.ceil(target / 60);
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      setCount(start);
      if (start >= target) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{count.toLocaleString()}</span>;
}

function HomeContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [words, setWords] = useState<Word[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [homeData, setHomeData] = useState<HomeStats | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<Word[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const [votingLoading, setVotingLoading] = useState<Record<string, boolean>>({});

  const handleVote = async (definitionId: string, voteType: 1 | -1) => {
    if (votingLoading[definitionId]) return;

    const previousVote = userVotes[definitionId] || 0;
    let scoreDiff = 0;
    let nextVote: 1 | -1 | 0 = voteType;

    if (previousVote === voteType) {
      nextVote = 0;
      scoreDiff = -voteType;
    } else if (previousVote === 0) {
      scoreDiff = voteType;
    } else {
      scoreDiff = voteType === 1 ? 2 : -2;
    }

    setWords((prevWords) =>
      prevWords.map((w) => ({
        ...w,
        definitions: w.definitions.map((d) =>
          d.id === definitionId ? { ...d, netScore: d.netScore + scoreDiff } : d
        ),
      }))
    );
    setUserVotes((prev) => ({ ...prev, [definitionId]: nextVote }));
    setVotingLoading((prev) => ({ ...prev, [definitionId]: true }));

    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ definitionId, voteType }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setWords((prevWords) =>
          prevWords.map((w) => ({
            ...w,
            definitions: w.definitions.map((d) =>
              d.id === definitionId ? { ...d, netScore: d.netScore - scoreDiff } : d
            ),
          }))
        );
        setUserVotes((prev) => ({ ...prev, [definitionId]: previousVote }));
        alert(errData.error || 'Please log in to vote on definitions.');
      } else {
        const data = await res.json();
        if (data.definition) {
          setWords((prevWords) =>
            prevWords.map((w) => ({
              ...w,
              definitions: w.definitions.map((d) =>
                d.id === definitionId ? { ...d, netScore: data.definition.netScore } : d
              ),
            }))
          );
          if (typeof data.userVote === 'number') {
            setUserVotes((prev) => ({ ...prev, [definitionId]: data.userVote }));
          }
        }
      }
    } catch (err) {
      setWords((prevWords) =>
        prevWords.map((w) => ({
          ...w,
          definitions: w.definitions.map((d) =>
            d.id === definitionId ? { ...d, netScore: d.netScore - scoreDiff } : d
          ),
        }))
      );
      setUserVotes((prev) => ({ ...prev, [definitionId]: previousVote }));
    } finally {
      setVotingLoading((prev) => ({ ...prev, [definitionId]: false }));
    }
  };

  const handleInsertChar = (char: string) => {
    setSearchQuery((prev) => prev + char);
    setShowSuggestions(true);
  };

  useEffect(() => {
    fetch('/api/home-stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setHomeData(data))
      .catch(console.error);
  }, []);

  // Execute word search
  const fetchWords = async (query = '') => {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      setWords([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      // Query authoritative PostgreSQL database API directly
      const res = await fetch(`/api/words?q=${encodeURIComponent(cleanQuery)}`);
      if (res.ok) {
        const dbWords = await res.json();
        if (Array.isArray(dbWords) && dbWords.length > 0) {
          setWords(dbWords);
          return;
        }
      }

      // If database returned 0 results, check Algolia index as fallback
      const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
      const searchKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;

      if (appId && searchKey) {
        try {
          const algRes = await fetch(
            `https://${appId}-dsn.algolia.net/1/indexes/nigerian_dictionary_words/query`,
            {
              method: 'POST',
              headers: {
                'X-Algolia-Application-Id': appId,
                'X-Algolia-API-Key': searchKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ params: `query=${encodeURIComponent(cleanQuery)}` }),
            }
          );

          if (algRes.ok) {
            const data = await algRes.json();
            if (data.hits && data.hits.length > 0) {
              const formattedWords = data.hits.map((hit: any) => ({
                id: hit.objectID,
                displayTerm: hit.displayTerm || hit.term,
                languageFamily: hit.languageFamily || hit.origin,
                aliases: hit.aliases || [],
                definitions: [
                  {
                    id: hit.objectID + '-def',
                    meaning: hit.meaning,
                    dialect: hit.languageFamily || hit.origin,
                    example: hit.example,
                    examples: hit.examples || (hit.example ? [hit.example] : []),
                    netScore: typeof hit.netScore === 'number' ? hit.netScore : (hit.likes || 0),
                  },
                ],
              }));
              setWords(formattedWords);
              return;
            }
          }
        } catch (algErr) {
          console.warn('Algolia fallback failed:', algErr);
        }
      }

      setWords([]);
    } catch (e) {
      console.error('Failed to fetch words', e);
      setWords([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Synchronize on URL query param changes
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && q.trim()) {
      setSearchQuery(q);
      fetchWords(q);
    } else if (q === '') {
      setSearchQuery('');
      setWords([]);
      setHasSearched(false);
    }
  }, [searchParams]);

  // Autocomplete suggestions
  const fetchSuggestions = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setIsFetchingSuggestions(true);
    try {
      const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
      const searchKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;
      let foundSuggestions = false;

      if (appId && searchKey) {
        try {
          const res = await fetch(
            `https://${appId}-dsn.algolia.net/1/indexes/nigerian_dictionary_words/query`,
            {
              method: 'POST',
              headers: {
                'X-Algolia-Application-Id': appId,
                'X-Algolia-API-Key': searchKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ params: `query=${encodeURIComponent(query)}&hitsPerPage=5` }),
            }
          );

          if (res.ok) {
            const data = await res.json();
            if (data.hits && data.hits.length > 0) {
              const formattedWords = data.hits.map((hit: any) => ({
                id: hit.objectID,
                displayTerm: hit.displayTerm,
                languageFamily: hit.languageFamily,
                definitions: [
                  {
                    id: '1',
                    meaning: hit.meaning,
                    example: hit.example,
                    netScore: typeof hit.netScore === 'number' ? hit.netScore : (hit.likes || 0),
                  },
                ],
              }));
              setSuggestions(formattedWords);
              foundSuggestions = true;
            }
          }
        } catch (e) {
          // fallback to DB
        }
      }

      if (!foundSuggestions) {
        const res = await fetch(`/api/words?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions((data || []).slice(0, 5));
        }
      }
    } catch (e) {
      console.error('Failed to fetch suggestions', e);
    } finally {
      setIsFetchingSuggestions(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectWord = (term: string) => {
    setSearchQuery(term);
    setShowSuggestions(false);
    window.history.pushState(null, '', `/?q=${encodeURIComponent(term)}`);
    fetchWords(term);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.history.pushState(null, '', `/?q=${encodeURIComponent(searchQuery.trim())}`);
      fetchWords(searchQuery.trim());
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setWords([]);
    setHasSearched(false);
    window.history.pushState(null, '', '/');
  };

  const filteredRecent = activeLanguage
    ? homeData?.recentWords.filter((w) => w.languageFamily === activeLanguage) ?? []
    : homeData?.recentWords ?? [];

  return (
    <div className="w-full text-foreground flex flex-col selection:bg-primary selection:text-primary-foreground relative overflow-hidden">
      {/* LIVE STATS (Desktop Aside) */}
      {homeData ? (
        <aside className="hidden xl:block absolute top-4 right-4 2xl:right-8 z-50 w-64 animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
          <div className="flex items-center gap-3 mb-2 justify-end">
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Live Pulse</h2>
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          <div className="grid grid-cols-1 gap-3 mb-8">
            {[
              { icon: BookOpen, label: 'Words', value: homeData.stats.totalWords, color: 'text-primary' },
              { icon: Layers, label: 'Definitions', value: homeData.stats.totalDefinitions, color: 'text-primary' },
              { icon: Users, label: 'Contributors', value: homeData.stats.totalContributors, color: 'text-primary' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div
                key={label}
                className="glass-panel rounded-2xl p-3 flex flex-row items-center justify-between text-left hover:scale-[1.02] transition-transform shadow-lg"
              >
                <div className="flex flex-row items-center gap-2">
                  <Icon className={`w-5 h-5 ${color}`} />
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{label}</div>
                </div>
                <div className={`text-2xl font-black ${color}`}>
                  <AnimatedCounter target={value} />
                </div>
              </div>
            ))}
          </div>

          {/* CONTRIBUTOR LEADERBOARD (Desktop) */}
          {homeData.topContributors.length > 0 && (
            <section className="glass-panel rounded-3xl p-5 shadow-xl border border-border/50">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Top Elders</h3>
                </div>
                <span className="text-[10px] uppercase font-black text-primary tracking-widest">Rep</span>
              </div>
              <div className="space-y-3">
                {homeData.topContributors.slice(0, 5).map((user, idx) => (
                  <Link
                    key={user.id}
                    href={`/profile/${user.id}`}
                    className="flex items-center gap-3 group hover:bg-primary/10 p-1.5 rounded-xl transition-colors"
                  >
                    <span className="text-xs font-black text-primary w-3.5 shrink-0">{idx + 1}</span>
                    <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                      {user.image ? (
                        <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-black text-primary uppercase">{user.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                        {user.firstName || user.name}
                      </div>
                      <div className="text-[10px] font-bold text-muted-foreground">
                        <span className="text-primary font-black">{user._count.definitions}</span> defs
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-primary">{user.reputationScore}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </aside>
      ) : (
        <DesktopSidebarSkeleton />
      )}

      <main className="flex-1 w-full flex flex-col relative pb-8 md:pb-12">
        <div className="w-full max-w-6xl mx-auto px-4 md:px-6 pt-8 md:pt-12 flex flex-col gap-8 md:gap-12 relative">
          
          {/* HERO / SEARCH */}
          <div className="relative w-full z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
            <section className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter mb-3 text-transparent bg-clip-text bg-gradient-to-br from-foreground to-foreground/60 drop-shadow-sm pb-2">
                The Nigerian Dictionary
              </h1>
              <p className="text-sm md:text-base font-semibold tracking-widest text-muted-foreground mb-8">
                BY THE PEOPLE. FOR THE CULTURE.
              </p>

              <div className="relative w-full mx-auto" ref={searchContainerRef}>
                <form onSubmit={handleSearch} className="flex flex-col gap-3 w-full mx-auto relative z-20">
                  <div className="flex w-full bg-card/60 backdrop-blur-xl shadow-2xl rounded-full overflow-hidden p-1.5 border border-white/10">
                    <Input
                      type="text"
                      placeholder="Search (e.g. Wahala, Omo, Commot)..."
                      className="rounded-l-full border-0 bg-transparent focus-visible:ring-0 uppercase font-bold tracking-wider text-base h-12 md:h-14 w-full pl-6 shadow-none"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => {
                        if (searchQuery.length >= 2) setShowSuggestions(true);
                      }}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={handleClearSearch}
                        className="px-3 text-muted-foreground hover:text-foreground transition-colors"
                        title="Clear search"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                    <Button
                      type="submit"
                      className="rounded-full h-12 md:h-14 px-6 md:px-8 font-black tracking-widest text-sm bg-primary hover:bg-primary/80 transition-all hover:scale-105 shadow-lg active:scale-95 shrink-0"
                      variant="default"
                    >
                      SEARCH
                    </Button>
                  </div>
                  <div className="flex justify-center mt-2">
                    <MiniKeyboard onInsert={handleInsertChar} className="justify-center" />
                  </div>
                </form>

                {/* Dropdown Suggestions */}
                {showSuggestions && searchQuery.length >= 2 && (
                  <div className="absolute top-[calc(100%-3rem)] left-0 w-full pt-14 pb-2 px-2 bg-card/95 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-b-3xl z-10 flex flex-col gap-1 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    {isFetchingSuggestions ? (
                      <div className="px-4 py-6 text-sm font-bold text-muted-foreground uppercase tracking-widest text-center animate-pulse">
                        Loading...
                      </div>
                    ) : suggestions.length > 0 ? (
                      suggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          type="button"
                          className="text-left px-5 py-3 rounded-2xl hover:bg-white/10 transition-colors flex items-center justify-between group"
                          onClick={() => handleSelectWord(suggestion.displayTerm)}
                        >
                          <span className="font-black text-lg lowercase tracking-tight group-hover:text-primary transition-colors">
                            {suggestion.displayTerm}
                          </span>
                          {suggestion.languageFamily && (
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              {suggestion.languageFamily}
                            </span>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-sm font-bold text-muted-foreground uppercase tracking-widest text-center">
                        No matches found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* LIVE STATS (Mobile) */}
            {homeData ? (
              <section className="w-full mt-8 xl:hidden animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: BookOpen, label: 'Words', value: homeData.stats.totalWords, color: 'text-primary' },
                    { icon: Layers, label: 'Definitions', value: homeData.stats.totalDefinitions, color: 'text-primary' },
                    { icon: Users, label: 'Contributors', value: homeData.stats.totalContributors, color: 'text-primary' },
                  ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="glass-panel rounded-2xl p-3 flex flex-col items-center text-center shadow-lg">
                      <div className="flex flex-col items-center gap-2 mb-1">
                        <Icon className={`w-5 h-5 ${color}`} />
                        <div className="text-[9px] md:text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{label}</div>
                      </div>
                      <div className={`text-xl font-black ${color}`}>
                        <AnimatedCounter target={value} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <section className="w-full mt-8 xl:hidden">
                <StatsGridSkeleton />
              </section>
            )}
          </div>

          {/* SEARCH RESULTS VIEW */}
          {isLoading ? (
            <section className="relative z-10 w-full max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between px-2">
                <div className="h-4 w-40 shimmer-container rounded-md bg-muted/60" />
                <div className="h-4 w-28 shimmer-container rounded-md bg-muted/40" />
              </div>
              <HeroWordCardSkeleton />
              <div className="space-y-4 pt-4">
                <div className="h-4 w-52 shimmer-container rounded-md bg-muted/40 mx-auto" />
                <VariationCardSkeleton />
              </div>
            </section>
          ) : words.length > 0 ? (
            <section className="relative z-10 animate-in fade-in slide-in-from-bottom-12 duration-700 w-full max-w-3xl mx-auto space-y-8">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Showing {words.length} {words.length === 1 ? 'match' : 'matches'} for &quot;{searchQuery}&quot;
                </span>
                <button
                  onClick={handleClearSearch}
                  className="text-xs font-black uppercase tracking-widest text-primary hover:underline"
                >
                  View All & Overview
                </button>
              </div>

              {/* Exact Match Card (Top Hero) */}
              {(() => {
                const exactWord = words[0];
                const variationWords = words.slice(1);

                return (
                  <div className="space-y-10">
                    {/* Top Exact Match Card */}
                    <article
                      key={exactWord.id}
                      className="w-full glass-panel rounded-[2.5rem] p-6 md:p-10 border border-emerald-500/30 bg-card/70 shadow-2xl hover:shadow-[0_20px_50px_-15px_rgba(16,185,129,0.15)] transition-all relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-primary to-secondary" />

                      <header className="flex flex-col md:flex-row md:items-baseline md:justify-between pb-6 mb-6 border-b border-border/20">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                              Exact Match
                            </span>
                            {exactWord.languageFamily && (
                              <span className="px-3 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-black uppercase text-[10px] tracking-widest">
                                {exactWord.languageFamily}
                              </span>
                            )}
                          </div>

                          <h2 className="text-4xl lg:text-5xl font-black tracking-tighter lowercase text-foreground bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-primary to-secondary">
                            {exactWord.displayTerm}
                          </h2>

                          {/* Cross-Dialect Aliases / Alternative Spellings */}
                          {exactWord.aliases && exactWord.aliases.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 mt-3">
                              <span className="text-[11px] text-muted-foreground font-semibold">Also:</span>
                              {exactWord.aliases.map((alias) => (
                                <button
                                  key={alias}
                                  type="button"
                                  onClick={() => handleSelectWord(alias)}
                                  className="text-xs font-bold text-primary/80 hover:text-primary hover:underline bg-white/5 hover:bg-white/10 px-2.5 py-0.5 rounded-md transition-colors border border-white/5"
                                >
                                  {alias}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </header>

                      {/* Definitions for Exact Word */}
                      <div className="space-y-6">
                        {exactWord.definitions.map((def, idx) => (
                          <div key={def.id} className="pt-4 first:pt-0 space-y-4">
                            <div className="flex items-start justify-between gap-6">
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-primary text-sm font-black">0{idx + 1}</span>
                                  {def.dialect && def.dialect !== exactWord.languageFamily && (
                                    <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground font-bold uppercase text-[9px] tracking-widest">
                                      {def.dialect}
                                    </span>
                                  )}
                                </div>

                                <p className="text-xl md:text-2xl font-bold leading-relaxed text-foreground tracking-tight">
                                  {def.meaning}
                                </p>

                                {/* Multiple examples */}
                                {((def.examples && def.examples.length > 0) ? def.examples : (def.example ? [def.example] : [])).map((ex, exIdx) => (
                                  <div
                                    key={exIdx}
                                    className="bg-emerald-500/5 backdrop-blur-md rounded-2xl p-4 border border-emerald-500/20 relative overflow-hidden group-hover:bg-emerald-500/10 transition-colors"
                                  >
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500" />
                                    <p className="text-foreground/80 font-medium text-sm md:text-base italic">
                                      &quot;{ex}&quot;
                                    </p>
                                  </div>
                                ))}

                                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-muted-foreground pt-1">
                                  <button
                                    type="button"
                                    disabled={votingLoading[def.id]}
                                    onClick={() => handleVote(def.id, 1)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all border ${
                                      userVotes[def.id] === 1
                                        ? 'bg-primary/20 text-primary border-primary/40 font-black shadow-sm'
                                        : 'hover:text-primary hover:bg-white/5 border-transparent'
                                    } disabled:opacity-50`}
                                  >
                                    <ArrowBigUp className={`w-5 h-5 ${userVotes[def.id] === 1 ? 'fill-primary' : ''}`} />
                                    <span>{def.netScore >= 0 ? def.netScore : 0}</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={votingLoading[def.id]}
                                    onClick={() => handleVote(def.id, -1)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all border ${
                                      userVotes[def.id] === -1
                                        ? 'bg-destructive/20 text-destructive border-destructive/40 font-black shadow-sm'
                                        : 'hover:text-destructive hover:bg-white/5 border-transparent'
                                    } disabled:opacity-50`}
                                  >
                                    <ArrowBigDown className={`w-5 h-5 ${userVotes[def.id] === -1 ? 'fill-destructive' : ''}`} />
                                    <span>{def.netScore < 0 ? Math.abs(def.netScore) : 0}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>

                    {/* Dialect Variations & Cognates Section */}
                    {variationWords.length > 0 && (
                      <div className="space-y-6 pt-4">
                        <div className="flex items-center gap-3">
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                          <span className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 shadow-md">
                            <Globe className="w-4 h-4" /> Cognates & Dialect Variations ({variationWords.length})
                          </span>
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                        </div>

                        <div className="space-y-6">
                          {variationWords.map((varWord) => (
                            <article
                              key={varWord.id}
                              className="w-full glass-panel rounded-[2rem] p-5 md:p-8 hover:shadow-2xl border border-white/10 transition-all bg-card/40"
                            >
                              <header className="flex flex-col md:flex-row md:items-baseline md:justify-between pb-5 mb-5 border-b border-border/20">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground font-black uppercase text-[10px] tracking-widest">
                                      Dialect Variant
                                    </span>
                                    {varWord.languageFamily && (
                                      <span className="px-3 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-black uppercase text-[10px] tracking-widest">
                                        {varWord.languageFamily}
                                      </span>
                                    )}
                                  </div>

                                  <h3 className="text-3xl lg:text-4xl font-black tracking-tighter lowercase text-foreground">
                                    {varWord.displayTerm}
                                  </h3>

                                  {varWord.aliases && varWord.aliases.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                      <span className="text-[11px] text-muted-foreground font-semibold">Also:</span>
                                      {varWord.aliases.map((alias) => (
                                        <button
                                          key={alias}
                                          type="button"
                                          onClick={() => handleSelectWord(alias)}
                                          className="text-xs font-bold text-primary/80 hover:text-primary hover:underline bg-white/5 hover:bg-white/10 px-2.5 py-0.5 rounded-md transition-colors border border-white/5"
                                        >
                                          {alias}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </header>

                              <div className="space-y-6">
                                {varWord.definitions.map((def, idx) => (
                                  <div key={def.id} className="pt-4 first:pt-0 space-y-3">
                                    <div className="flex items-start justify-between gap-6">
                                      <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-2">
                                          <span className="text-primary text-xs font-black">0{idx + 1}</span>
                                          {def.dialect && (
                                            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-black uppercase text-[10px] tracking-widest">
                                              {def.dialect}
                                            </span>
                                          )}
                                        </div>

                                        <p className="text-base md:text-lg font-medium leading-relaxed text-foreground/90 tracking-tight">
                                          {def.meaning}
                                        </p>

                                        {/* Examples */}
                                        {((def.examples && def.examples.length > 0) ? def.examples : (def.example ? [def.example] : [])).map((ex, exIdx) => (
                                          <div
                                            key={exIdx}
                                            className="bg-muted/30 rounded-xl p-3.5 border border-border/20 relative overflow-hidden group-hover:bg-muted/50 transition-colors"
                                          >
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/40" />
                                            <p className="text-muted-foreground font-medium text-xs md:text-sm italic">
                                              &quot;{ex}&quot;
                                            </p>
                                          </div>
                                        ))}

                                        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-muted-foreground pt-1">
                                          <button
                                            type="button"
                                            disabled={votingLoading[def.id]}
                                            onClick={() => handleVote(def.id, 1)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all border ${
                                              userVotes[def.id] === 1
                                                ? 'bg-primary/20 text-primary border-primary/40 font-black shadow-sm'
                                                : 'hover:text-primary hover:bg-white/5 border-transparent'
                                            } disabled:opacity-50`}
                                          >
                                            <ArrowBigUp className={`w-5 h-5 ${userVotes[def.id] === 1 ? 'fill-primary' : ''}`} />
                                            <span>{def.netScore >= 0 ? def.netScore : 0}</span>
                                          </button>
                                          <button
                                            type="button"
                                            disabled={votingLoading[def.id]}
                                            onClick={() => handleVote(def.id, -1)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all border ${
                                              userVotes[def.id] === -1
                                                ? 'bg-destructive/20 text-destructive border-destructive/40 font-black shadow-sm'
                                                : 'hover:text-destructive hover:bg-white/5 border-transparent'
                                            } disabled:opacity-50`}
                                          >
                                            <ArrowBigDown className={`w-5 h-5 ${userVotes[def.id] === -1 ? 'fill-destructive' : ''}`} />
                                            <span>{def.netScore < 0 ? Math.abs(def.netScore) : 0}</span>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </section>
          ) : hasSearched ? (
            <div className="relative z-10 w-full max-w-2xl mx-auto glass-panel p-8 md:p-12 rounded-[2rem] text-center border border-white/10 shadow-2xl">
              <h3 className="text-2xl font-black text-foreground mb-2">
                No definitions found for &quot;{searchQuery}&quot;
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Be the pioneer who adds this Nigerian term and its unique dialect meanings to the community dictionary.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/contribute"
                  className="px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs shadow-lg hover:scale-105 transition-all inline-flex items-center justify-center"
                >
                  + Define in Contribute Studio
                </Link>
                <Button
                  variant="outline"
                  onClick={handleClearSearch}
                  className="rounded-full text-xs font-bold uppercase tracking-wider h-11 px-6 border-white/10"
                >
                  Return to Home Overview
                </Button>
              </div>
            </div>
          ) : null}

          {/* DYNAMIC HOME CONTENT (When not searching) */}
          {words.length === 0 && !hasSearched && (
            homeData ? (
              <div className="flex flex-col w-full mt-4 md:mt-8">
              <div className="w-full max-w-6xl mx-auto">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 w-full">
                  
                  {/* WORD OF THE DAY */}
                  <div className="xl:col-span-12 flex flex-col gap-8 max-w-5xl mx-auto w-full">
                    {homeData.wordOfTheDay && (
                      <section>
                        <div className="flex items-center gap-3 mb-4">
                          <Flame className="w-5 h-5 text-primary" />
                          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                            Word of the Day
                          </h2>
                        </div>
                        <button
                          onClick={() => handleSelectWord(homeData.wordOfTheDay!.displayTerm)}
                          className="w-full text-left glass-panel rounded-3xl p-6 md:p-8 hover:scale-[1.02] hover:shadow-2xl hover:border-primary/40 transition-all duration-300 relative overflow-hidden group"
                        >
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-primary to-secondary" />
                          <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />

                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/80 lowercase tracking-tight">
                                {homeData.wordOfTheDay.displayTerm}
                              </h3>
                              {homeData.wordOfTheDay.languageFamily && (
                                <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                                  {homeData.wordOfTheDay.languageFamily}
                                </span>
                              )}
                            </div>

                            {homeData.wordOfTheDay.definitions[0] && (
                              <p className="text-base md:text-lg text-foreground/90 font-medium leading-relaxed mb-4">
                                {homeData.wordOfTheDay.definitions[0].meaning}
                              </p>
                            )}

                            {homeData.wordOfTheDay.definitions[0]?.example && (
                              <div className="bg-muted/30 rounded-2xl p-4 border border-white/5 mb-4">
                                <p className="text-muted-foreground italic text-sm md:text-base">
                                  &quot;{homeData.wordOfTheDay.definitions[0].example}&quot;
                                </p>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                              <span className="flex items-center gap-1.5 text-primary">
                                ★ {homeData.wordOfTheDay.definitions[0]?.netScore ?? 0} Votes
                              </span>
                              <span className="group-hover:translate-x-1 transition-transform flex items-center gap-1 text-foreground">
                                View Full <ArrowRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>
                        </button>
                      </section>
                    )}

                    {/* RECENTLY ADDED */}
                    <section className="w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-primary" />
                          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                            Recently Added
                          </h2>
                        </div>

                        {homeData.languageFamilies.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => setActiveLanguage(null)}
                              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all hover:scale-105 ${
                                !activeLanguage
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-white/5 border-white/10 text-muted-foreground hover:border-primary/50 hover:text-foreground'
                              }`}
                            >
                              All
                            </button>
                            {homeData.languageFamilies.map((lang) => (
                              <button
                                key={lang}
                                onClick={() => setActiveLanguage(lang === activeLanguage ? null : lang)}
                                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all hover:scale-105 ${
                                  activeLanguage === lang
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-white/5 border-white/10 text-muted-foreground hover:border-primary/50 hover:text-foreground'
                                }`}
                              >
                                {lang}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {filteredRecent.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 lg:gap-6">
                          {filteredRecent.slice(0, 5).map((word, i) => (
                            <button
                              key={word.id}
                              onClick={() => handleSelectWord(word.displayTerm)}
                              className="glass-panel rounded-2xl p-4 text-left hover:scale-[1.03] hover:border-primary/30 border border-transparent transition-all duration-200 animate-in fade-in flex flex-col justify-between h-full min-h-[140px]"
                              style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
                            >
                              <div>
                                <div className="text-lg font-black text-primary lowercase tracking-tight mb-1 truncate">
                                  {word.displayTerm}
                                </div>
                                {word.definitions[0] && (
                                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                                    {word.definitions[0].meaning}
                                  </p>
                                )}
                              </div>
                              {word.languageFamily && (
                                <span className="mt-4 inline-block text-[10px] font-bold uppercase tracking-widest text-primary/60">
                                  {word.languageFamily}
                                </span>
                              )}
                            </button>
                          ))}

                          {filteredRecent.length > 5 && (
                            <Link
                              href="/archive"
                              className="glass-panel rounded-2xl p-4 text-center hover:scale-[1.03] hover:border-primary/30 border border-transparent transition-all duration-200 animate-in fade-in flex flex-col items-center justify-center h-full min-h-[140px] group"
                              style={{ animationDelay: `${5 * 60}ms`, animationFillMode: 'both' }}
                            >
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                                <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
                              </div>
                              <div className="text-sm font-black text-foreground uppercase tracking-widest group-hover:text-primary transition-colors">
                                See More
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-1">View all in Archive</div>
                            </Link>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-10 glass-panel rounded-2xl text-xs uppercase font-bold text-muted-foreground tracking-widest">
                          No recent words in this dialect.
                        </div>
                      )}
                    </section>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <HomeOverviewSkeleton />
          ))}
        </div>
      </main>

      {/* Floating Add Word Button */}
      <AddWordDialog onSuccess={() => fetchWords(searchQuery)} />
    </div>
  );
}

function partitionDefinitions(
  definitions: Definition[],
  query: string,
  wordDisplay: string,
  aliases: string[] = []
) {
  if (!definitions || definitions.length === 0) {
    return { exactMatchDef: null, otherDefs: [] };
  }
  if (!query || !query.trim() || definitions.length === 1) {
    return { exactMatchDef: definitions[0], otherDefs: definitions.slice(1) };
  }

  const cleanQ = query.trim().toLowerCase();
  const normalizedQ = cleanQ.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Detect Yoruba vs Pidgin vs Hausa vs Igbo orthography
  const hasYorubaChars = /[\u0300-\u036fṣẹọ]/.test(query) || (cleanQ.startsWith('sak') && !cleanQ.startsWith('shak'));
  const isPidgin = cleanQ.startsWith('shak') || cleanQ.includes('pidgin');
  const isIgbo = /[\u1ee5\u1ecb\u1ecddñ]/.test(query) || cleanQ.includes('igbo');
  const isHausa = /[\u0181\u018a\u0198\u01a5\u02bc]/.test(query) || cleanQ.includes('hausa');

  let matchIndex = -1;

  if (hasYorubaChars) {
    matchIndex = definitions.findIndex((d) => d.dialect?.toLowerCase().includes('yoruba'));
  } else if (isPidgin) {
    matchIndex = definitions.findIndex((d) => d.dialect?.toLowerCase().includes('pidgin'));
  } else if (isIgbo) {
    matchIndex = definitions.findIndex((d) => d.dialect?.toLowerCase().includes('igbo'));
  } else if (isHausa) {
    matchIndex = definitions.findIndex((d) => d.dialect?.toLowerCase().includes('hausa'));
  }

  if (matchIndex === -1) {
    matchIndex = definitions.findIndex(
      (d) =>
        d.dialect?.toLowerCase().includes(normalizedQ) ||
        d.meaning.toLowerCase().includes(cleanQ) ||
        d.meaning.toLowerCase().includes(normalizedQ)
    );
  }

  if (matchIndex === -1) matchIndex = 0;

  return {
    exactMatchDef: definitions[matchIndex],
    otherDefs: definitions.filter((_, i) => i !== matchIndex),
  };
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
          <div className="w-full max-w-xl mx-auto space-y-4 text-center">
            <div className="h-12 w-3/4 mx-auto shimmer-container rounded-2xl bg-muted/60" />
            <div className="h-4 w-1/2 mx-auto shimmer-container rounded-lg bg-muted/40" />
          </div>
          <div className="w-full max-w-2xl">
            <StatsGridSkeleton />
          </div>
          <div className="w-full max-w-4xl">
            <HomeOverviewSkeleton />
          </div>
        </main>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
