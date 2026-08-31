'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';
import { MiniKeyboard } from '@/components/mini-keyboard';
import {
  Sparkles,
  Plus,
  Trash2,
  BookOpen,
  ArrowRight,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Globe,
  Quote,
  Flame,
  Tag,
  X,
  RotateCcw,
  Save,
  ShieldCheck,
  ShieldAlert,
  LogIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NIGERIAN_LANGUAGES } from '@/lib/languages';
import { AuthButtons } from '@/components/auth-buttons';

interface DefinitionDraft {
  id: string;
  dialect: string;
  customDialect?: string;
  meaning: string;
  examples: string[];
}

const POPULAR_LANGUAGES = [
  'Nigerian Pidgin',
  'Yoruba',
  'Igbo',
  'Hausa',
  'Edo',
  'Efik',
  'Ijaw',
  'Tiv',
  'Urhobo',
  'Urban Slang',
  'Other',
];

const LOCAL_STORAGE_KEY = 'nigerian_dict_contribute_draft_v1';

export default function ContributePage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [word, setWord] = useState('');
  const [aliases, setAliases] = useState<string[]>([]);
  const [aliasInput, setAliasInput] = useState('');

  const [definitions, setDefinitions] = useState<DefinitionDraft[]>([
    {
      id: 'def-1',
      dialect: 'Nigerian Pidgin',
      meaning: '',
      examples: [''],
    },
  ]);

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successWord, setSuccessWord] = useState<string | null>(null);
  const [isDraftRestored, setIsDraftRestored] = useState(false);
  const [langSearchMap, setLangSearchMap] = useState<Record<string, string>>({});
  const [isLangDropdownOpenMap, setIsLangDropdownOpenMap] = useState<Record<string, boolean>>({});

  const [userProfile, setUserProfile] = useState<{
    primaryLanguage?: string | null;
    isOnboarded?: boolean;
    role?: string | null;
  } | null>(null);

  // Fetch onboarding profile & primary language
  useEffect(() => {
    if (session?.user) {
      fetch('/api/user/onboarding')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.user) {
            setUserProfile(data.user);
            if (data.user.primaryLanguage) {
              setDefinitions((prev) =>
                prev.map((d, i) =>
                  i === 0 && (d.dialect === 'Nigerian Pidgin' || !d.dialect)
                    ? { ...d, dialect: data.user.primaryLanguage }
                    : d
                )
              );
            }
          }
        })
        .catch(() => {});
    }
  }, [session?.user?.id]);

  const isSuperAdmin = userProfile?.role === 'superadmin';

  const isPrivileged =
    userProfile?.role === 'contributor' ||
    userProfile?.role === 'elder' ||
    userProfile?.role === 'admin' ||
    isSuperAdmin;

  const isEmailVerified = !!(session?.user?.emailVerified || userProfile?.emailVerified);
  const isOnboarded = !!userProfile?.isOnboarded;
  const isBanned = userProfile?.role === 'banned' || userProfile?.role === 'blacklisted';
  const canSubmit = isEmailVerified && isOnboarded && !isBanned;

  const permittedLanguages = useMemo(() => {
    if (isPrivileged || !userProfile?.primaryLanguage) {
      return POPULAR_LANGUAGES;
    }
    const set = new Set<string>([
      userProfile.primaryLanguage,
      'Nigerian Pidgin',
      'Urban Slang',
    ]);
    return Array.from(set);
  }, [userProfile?.primaryLanguage, isPrivileged]);

  // Focus tracking for mini-keyboard insertion
  const activeInputRef = useRef<{
    type: 'word' | 'meaning' | 'example' | 'alias';
    defId?: string;
    exampleIdx?: number;
  }>({ type: 'word' });

  // 1. Restore draft from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.word || (Array.isArray(parsed.definitions) && parsed.definitions.length > 0))) {
          if (parsed.word) setWord(parsed.word);
          if (Array.isArray(parsed.aliases)) setAliases(parsed.aliases);
          if (Array.isArray(parsed.definitions) && parsed.definitions.length > 0) {
            setDefinitions(parsed.definitions);
          }
          setIsDraftRestored(true);
        }
      }
    } catch (e) {
      console.warn('Could not restore draft from localStorage', e);
    }
  }, []);

  // 2. Auto-save draft to LocalStorage on state change
  useEffect(() => {
    try {
      const hasContent = word.trim() || aliases.length > 0 || definitions.some((d) => d.meaning.trim() || d.examples.some((ex) => ex.trim()));
      if (hasContent) {
        localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify({
            word,
            aliases,
            definitions,
            updatedAt: Date.now(),
          })
        );
      }
    } catch (e) {
      console.warn('Could not save draft to localStorage', e);
    }
  }, [word, aliases, definitions]);

  // 3. Clear all fields & purge cache
  const handleClearAll = () => {
    if (word.trim() || definitions.some((d) => d.meaning.trim())) {
      if (!confirm('Are you sure you want to clear all fields and reset the draft?')) {
        return;
      }
    }
    setWord('');
    setAliases([]);
    setAliasInput('');
    setDefinitions([
      {
        id: `def-${Date.now()}`,
        dialect: 'Nigerian Pidgin',
        meaning: '',
        examples: [''],
      },
    ]);
    setError(null);
    setIsDraftRestored(false);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {}
  };

  const handleInsertChar = (char: string) => {
    const { type, defId, exampleIdx } = activeInputRef.current;
    if (type === 'word') {
      setWord((prev) => prev + char);
    } else if (type === 'alias') {
      setAliasInput((prev) => prev + char);
    } else if (type === 'meaning' && defId) {
      setDefinitions((prev) =>
        prev.map((d) => (d.id === defId ? { ...d, meaning: d.meaning + char } : d))
      );
    } else if (type === 'example' && defId && typeof exampleIdx === 'number') {
      setDefinitions((prev) =>
        prev.map((d) => {
          if (d.id !== defId) return d;
          const nextExamples = [...d.examples];
          nextExamples[exampleIdx] = (nextExamples[exampleIdx] || '') + char;
          return { ...d, examples: nextExamples };
        })
      );
    }
  };

  // Alias chip addition
  const handleAddAlias = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = aliasInput.trim();
    if (clean && !aliases.includes(clean) && clean.toLowerCase() !== word.trim().toLowerCase()) {
      setAliases((prev) => [...prev, clean]);
      setAliasInput('');
    }
  };

  const handleRemoveAlias = (aliasToRemove: string) => {
    setAliases((prev) => prev.filter((a) => a !== aliasToRemove));
  };

  // Add new definition block (for another dialect or polysemous meaning)
  const handleAddDefinitionBlock = () => {
    const newId = `def-${Date.now()}`;
    setDefinitions((prev) => [
      ...prev,
      {
        id: newId,
        dialect: 'Yoruba',
        meaning: '',
        examples: [''],
      },
    ]);
  };

  // Remove definition block
  const handleRemoveDefinitionBlock = (id: string) => {
    if (definitions.length <= 1) return;
    setDefinitions((prev) => prev.filter((d) => d.id !== id));
  };

  // Update a definition's fields
  const handleUpdateDefinition = (id: string, field: keyof DefinitionDraft, value: any) => {
    setDefinitions((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  // Add example use case to a definition
  const handleAddExample = (defId: string) => {
    setDefinitions((prev) =>
      prev.map((d) => (d.id === defId ? { ...d, examples: [...d.examples, ''] } : d))
    );
  };

  // Update specific example
  const handleUpdateExample = (defId: string, idx: number, val: string) => {
    setDefinitions((prev) =>
      prev.map((d) => {
        if (d.id !== defId) return d;
        const nextExamples = [...d.examples];
        nextExamples[idx] = val;
        return { ...d, examples: nextExamples };
      })
    );
  };

  // Remove specific example
  const handleRemoveExample = (defId: string, idx: number) => {
    setDefinitions((prev) =>
      prev.map((d) => {
        if (d.id !== defId) return d;
        const nextExamples = d.examples.filter((_, i) => i !== idx);
        return { ...d, examples: nextExamples.length > 0 ? nextExamples : [''] };
      })
    );
  };

  // AI Generation with Dynamic Full-Replacement
  const handleGenerateAI = async () => {
    if (!word.trim()) {
      setError('Please enter a word term first before requesting AI generation.');
      return;
    }

    setIsGeneratingAI(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: word.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate suggestions');
      }

      const data = await res.json();

      // Dynamically replace definitions with new senses for this specific word
      if (Array.isArray(data.senses) && data.senses.length > 0) {
        const generatedDefs: DefinitionDraft[] = data.senses.map((sense: any, i: number) => {
          let assignedDialect = sense.dialect || 'Nigerian Pidgin';
          let customDialect: string | undefined = undefined;

          if (!isPrivileged) {
            const isAllowed = permittedLanguages.some(
              (p) => p.toLowerCase() === assignedDialect.toLowerCase()
            );
            if (!isAllowed) {
              assignedDialect = userProfile?.primaryLanguage || 'Nigerian Pidgin';
            }
          } else {
            if (!permittedLanguages.includes(assignedDialect)) {
              customDialect = assignedDialect;
              assignedDialect = 'Other';
            }
          }

          return {
            id: `ai-def-${i}-${Date.now()}`,
            dialect: assignedDialect,
            customDialect,
            meaning: sense.meaning || '',
            examples: Array.isArray(sense.examples) && sense.examples.length > 0 ? sense.examples : [''],
          };
        });
        setDefinitions(generatedDefs);

        // Auto-populate all dialectal orthographic variants into aliases
        const collected = new Set<string>();
        if (Array.isArray(data.aliases)) {
          data.aliases.forEach((a: string) => {
            if (a && a.trim() && a.trim().toLowerCase() !== word.trim().toLowerCase()) {
              collected.add(a.trim());
            }
          });
        }

        data.senses.forEach((s: any) => {
          if (s.spelling && s.spelling.trim() && s.spelling.trim().toLowerCase() !== word.trim().toLowerCase()) {
            collected.add(s.spelling.trim());
          }
        });

        // Also add automatic phonetic variations (sh <-> s / ṣ)
        const normalized = word.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        if (normalized.includes('sh')) collected.add(normalized.replace(/sh/g, 's'));
        if (normalized.includes('s')) collected.add(normalized.replace(/s/g, 'sh'));

        setAliases(Array.from(collected).filter((a) => a.toLowerCase() !== word.trim().toLowerCase()));
      } else if (Array.isArray(data.meanings) && data.meanings.length > 0) {
        const generatedDefs: DefinitionDraft[] = data.meanings.map((meaning: string, i: number) => ({
          id: `ai-def-${i}-${Date.now()}`,
          dialect: 'Nigerian Pidgin',
          meaning,
          examples: data.examples && data.examples[i] ? [data.examples[i]] : [''],
        }));
        setDefinitions(generatedDefs);
      }
    } catch (e: any) {
      setError(e.message || 'AI generation failed');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isBanned) {
      setError('Your account has been banned from submitting contributions.');
      return;
    }

    if (!session?.user) {
      setError('Please log in to submit dictionary contributions.');
      return;
    }

    if (!isEmailVerified) {
      setError('Email verification is required before submitting contributions. Please verify your email.');
      return;
    }

    if (!isOnboarded) {
      setError('Heritage onboarding is required before submitting contributions. Please complete onboarding.');
      return;
    }

    if (!word.trim()) {
      setError('Please enter a word term.');
      return;
    }

    // Validate definitions
    const cleanDefinitions = definitions
      .filter((d) => d.meaning.trim().length > 0)
      .map((d) => {
        const finalDialect = d.dialect === 'Other' ? d.customDialect || 'Other' : d.dialect;
        const cleanExamples = d.examples.map((ex) => ex.trim()).filter((ex) => ex.length > 0);
        return {
          meaning: d.meaning.trim(),
          dialect: finalDialect,
          examples: cleanExamples,
        };
      });

    if (cleanDefinitions.length === 0) {
      setError('Please provide at least one meaning / definition.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: word.trim(),
          origin: cleanDefinitions[0].dialect,
          aliases,
          definitions: cleanDefinitions,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit contribution.');
      }

      // Purge local storage draft upon success
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch (e) {}

      setSuccessWord(word.trim());
      setTimeout(() => {
        router.push(`/?q=${encodeURIComponent(word.trim())}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Submission failed');
      setIsSubmitting(false);
    }
  };

  // 1. Loading State
  if (isPending) {
    return (
      <div className="min-h-[80vh] w-full text-foreground flex flex-col items-center justify-center p-6 selection:bg-primary selection:text-primary-foreground relative overflow-hidden pt-24 pb-20">
        <div className="w-full max-w-md glass-panel rounded-3xl p-8 border border-border/60 shadow-2xl text-center space-y-4 animate-pulse">
          <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto text-primary animate-spin">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-black uppercase tracking-widest text-primary">Loading Contribution Studio...</h2>
        </div>
      </div>
    );
  }

  // 2. Auth Required Barrier
  if (!session) {
    return (
      <div className="min-h-[80vh] w-full text-foreground flex flex-col items-center justify-center p-6 selection:bg-primary selection:text-primary-foreground relative overflow-hidden pt-24 pb-20">
        {/* Decorative Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-primary/15 blur-[140px] rounded-full pointer-events-none -z-10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-secondary/15 blur-[140px] rounded-full pointer-events-none -z-10" />

        <div className="w-full max-w-lg glass-panel rounded-3xl p-8 sm:p-10 border border-border/60 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center mx-auto text-primary shadow-lg shadow-primary/20">
            <ShieldCheck className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
              <Globe className="w-3.5 h-3.5" /> Authentication Required
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
              Sign In to Contribute
            </h1>
            <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
              You must be signed in with an account to contribute words, pronunciations, and definitions to The Nigerian Dictionary.
            </p>
          </div>

          <div className="pt-2 flex flex-col items-center justify-center">
            <AuthButtons />
          </div>

          <div className="pt-4 border-t border-border/40 text-[11px] text-muted-foreground font-medium">
            New here? Create an account in seconds to complete your heritage language onboarding and start contributing.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground flex flex-col selection:bg-primary selection:text-primary-foreground relative overflow-hidden pb-20">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-primary/15 blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-secondary/15 blur-[140px] rounded-full pointer-events-none -z-10" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-10 animate-in fade-in duration-500">
        
        {/* Top Header */}
        <header className="mb-8 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest mb-4">
            <Globe className="w-3.5 h-3.5" />
            Pan-Nigerian Linguistic Contribution Studio
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary via-foreground to-secondary">
            Contribute a Word
          </h1>
          <p className="text-sm sm:text-base font-medium text-muted-foreground mt-3">
            One word can carry multiple meanings and spellings across Yoruba (e.g. <em>ṣákárà</em>), Pidgin (e.g. <em>shakara</em>), Igbo, Hausa, and 500+ dialects.
          </p>

          {/* Draft Persistence Status & AI Disclaimer Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground bg-white/5 border border-white/10 px-3 py-1 rounded-full">
              <Save className="w-3.5 h-3.5 text-primary" />
              <span>Draft auto-saved in browser</span>
            </div>

            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-black dark:text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Please double-check everything — AI can make mistakes</span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="rounded-full border-white/10 text-xs font-bold uppercase tracking-wider h-8 text-muted-foreground hover:text-destructive hover:border-destructive/40 gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear All Fields
            </Button>
          </div>
        </header>

        {/* Studio Grid: Left Form Builder | Right Live Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ================= LEFT COLUMN: FORM BUILDER ================= */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Word Input Card */}
              <section className="glass-panel p-6 sm:p-8 rounded-[2rem] border border-white/10 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> 1. Word / Primary Term
                  </label>
                  <Button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={isGeneratingAI || !word.trim()}
                    variant="outline"
                    size="sm"
                    className="rounded-full border-primary/30 text-primary hover:bg-primary/10 text-xs font-bold uppercase tracking-wider h-8 gap-1.5"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                    {isGeneratingAI ? 'Analyzing...' : 'AI Context Assist'}
                  </Button>
                </div>

                <div className="relative">
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Shakara, Ṣákárà, Wahala, Kolo, Omo..."
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    onFocus={() => {
                      activeInputRef.current = { type: 'word' };
                    }}
                    className="h-14 rounded-2xl bg-black/40 border-white/10 text-xl font-black uppercase tracking-wider pl-5 focus-visible:ring-primary shadow-inner"
                  />
                </div>

                {/* Special Characters Virtual Mini-Keyboard */}
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1.5">
                    Insert Nigerian Special Characters & Diacritics
                  </span>
                  <MiniKeyboard onInsert={handleInsertChar} />
                </div>
              </section>

              {/* Cross-Dialect Alternative Spellings & Aliases Card */}
              <section className="glass-panel p-6 sm:p-8 rounded-[2rem] border border-white/10 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                    <Tag className="w-4 h-4 text-primary" /> 2. Dialectal Spellings & Cognates
                  </label>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Optional</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Add alternative spellings in other Nigerian languages so users searching either form (e.g., <strong>ṣákárà</strong> in Yoruba or <strong>shakara</strong> in Pidgin) will find this entry.
                </p>

                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Add variant (e.g. 'ṣákárà', 'shackara')..."
                    value={aliasInput}
                    onChange={(e) => setAliasInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAlias();
                      }
                    }}
                    onFocus={() => {
                      activeInputRef.current = { type: 'alias' };
                    }}
                    className="rounded-xl bg-black/40 border-white/10 text-xs font-bold"
                  />
                  <Button
                    type="button"
                    onClick={() => handleAddAlias()}
                    className="rounded-xl text-xs font-black uppercase tracking-wider h-10 px-4"
                  >
                    + Add
                  </Button>
                </div>

                {aliases.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {aliases.map((alias) => (
                      <span
                        key={alias}
                        className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold flex items-center gap-1.5 animate-in fade-in"
                      >
                        {alias}
                        <button
                          type="button"
                          onClick={() => handleRemoveAlias(alias)}
                          className="hover:text-destructive transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </section>

              {/* Dynamic Definition Blocks */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                    <Quote className="w-4 h-4 text-primary" /> 3. Meanings & Dialects ({definitions.length})
                  </h2>
                  <Button
                    type="button"
                    onClick={handleAddDefinitionBlock}
                    variant="outline"
                    size="sm"
                    className="rounded-full border-primary/40 text-primary hover:bg-primary/10 text-xs font-bold uppercase tracking-wider h-8 gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Dialect / Meaning
                  </Button>
                </div>

                {/* Banned User Restriction Banner */}
                {isBanned && (
                  <div className="p-5 rounded-2xl bg-destructive/15 border border-destructive/30 flex items-start gap-3.5 shadow-lg animate-in fade-in">
                    <ShieldAlert className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-wider text-destructive">
                        Account Restricted: Banned From Contributing
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed font-medium">
                        Your account has been restricted by an administrator from submitting new words and definitions. Please contact moderation if you believe this is an error.
                      </p>
                    </div>
                  </div>
                )}

                {/* Email Unverified Warning Banner */}
                {!isEmailVerified && session?.user && (
                  <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-4 shadow-inner">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                      <div>
                        <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wide block">
                          Email Verification Required
                        </span>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          You must verify your email address before publishing words and definitions to the dictionary.
                        </p>
                      </div>
                    </div>
                    <Link href={`/verify-email?email=${encodeURIComponent(session.user.email || '')}`}>
                      <Button size="sm" className="rounded-full bg-amber-500 text-black font-black text-xs shrink-0 hover:scale-105 transition-transform">
                        Verify Email
                      </Button>
                    </Link>
                  </div>
                )}

                {/* Prompt Un-onboarded Users */}
                {session?.user && !isOnboarded && isEmailVerified && (
                  <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between gap-4 shadow-inner">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                      <div>
                        <span className="text-xs font-black text-primary uppercase tracking-wide block">
                          Complete Heritage Onboarding
                        </span>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Designate your native language to unlock verified dialect contributions.
                        </p>
                      </div>
                    </div>
                    <Link href="/onboarding">
                      <Button size="sm" className="rounded-full bg-primary text-primary-foreground text-xs font-black shrink-0 hover:scale-105 transition-transform">
                        Onboard Now
                      </Button>
                    </Link>
                  </div>
                )}

                {userProfile?.primaryLanguage && !isPrivileged && !isBanned && (
                  <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-start gap-3 shadow-inner">
                    <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-primary">
                        Heritage Dialect Lock: {userProfile.primaryLanguage}
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed font-medium">
                        As a community member, your contributions are focused on your registered language (<strong>{userProfile.primaryLanguage}</strong>), <strong>Nigerian Pidgin</strong>, and <strong>Urban Slang</strong> to guarantee authenticity. Contributors and Elders with 100+ Rep unlock all 500+ Nigerian languages.
                      </p>
                    </div>
                  </div>
                )}

                {definitions.map((def, defIdx) => (
                  <section
                    key={def.id}
                    className="glass-panel p-6 sm:p-8 rounded-[2rem] border border-border/60 shadow-2xl space-y-5 relative animate-in fade-in slide-in-from-bottom-4 duration-300"
                  >
                    {/* Header of Definition Block */}
                    <div className="flex items-center justify-between border-b border-border/40 pb-4">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-black text-xs">
                          0{defIdx + 1}
                        </span>
                        <span className="text-xs font-black uppercase tracking-widest text-foreground">
                          Definition Sense
                        </span>
                      </div>

                      {definitions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDefinitionBlock(def.id)}
                          className="text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                          title="Remove this definition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Dialect / Language Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-primary" /> Language / Dialect for this meaning
                      </label>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {permittedLanguages.map((lang) => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => {
                              handleUpdateDefinition(def.id, 'dialect', lang);
                              if (lang !== 'Other') {
                                handleUpdateDefinition(def.id, 'customDialect', undefined);
                              }
                            }}
                            className={`px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                              def.dialect === lang
                                ? 'bg-primary text-primary-foreground border-primary shadow-md font-black scale-[1.02]'
                                : 'bg-card/70 border-border/40 text-foreground hover:border-primary/40 hover:bg-primary/5'
                            }`}
                          >
                            {lang === 'Other' ? 'Other (500+)' : lang}
                          </button>
                        ))}
                      </div>

                      {/* INLINE SMART PILLS FOR OTHER (500+ LANGUAGES) */}
                      {def.dialect === 'Other' && (
                        <div className="pt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                          {def.customDialect ? (
                            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-primary/10 border border-primary/30 shadow-inner">
                              <div className="flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs">🌐</span>
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">
                                    Selected Dialect
                                  </span>
                                  <span className="text-sm font-black uppercase text-primary">
                                    {def.customDialect}
                                  </span>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateDefinition(def.id, 'customDialect', '')}
                                className="rounded-full border-primary/30 text-primary hover:bg-primary/20 text-xs font-bold uppercase h-8 px-3 gap-1"
                              >
                                <X className="w-3.5 h-3.5" /> Change
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {/* Search Input for Inline Smart Pills */}
                              <div className="relative">
                                <Input
                                  type="text"
                                  placeholder="Type to filter 500+ languages (e.g. Ebira, Idoma, Nupe, Igala, Kanuri)..."
                                  value={langSearchMap[def.id] || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setLangSearchMap((prev) => ({ ...prev, [def.id]: val }));
                                  }}
                                  className="h-12 rounded-2xl bg-black/50 border-white/20 text-xs font-bold pl-4 pr-10 focus-visible:ring-primary shadow-inner"
                                />
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                                  🔍
                                </div>
                              </div>

                              {/* Smart Pills Cluster */}
                              <div>
                                <div className="flex items-center justify-between pb-2 px-1">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                                    <Tag className="w-3 h-3" /> Tap to Select Dialect
                                  </span>
                                  <span className="text-[10px] text-muted-foreground font-bold">
                                    {
                                      NIGERIAN_LANGUAGES.filter((l) =>
                                        l.toLowerCase().includes((langSearchMap[def.id] || '').toLowerCase())
                                      ).length
                                    }{' '}
                                    Matches
                                  </span>
                                </div>

                                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 rounded-2xl bg-black/30 border border-white/10">
                                  {/* Custom query pill if user typed a specific name */}
                                  {langSearchMap[def.id] && langSearchMap[def.id]?.trim().length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleUpdateDefinition(def.id, 'customDialect', langSearchMap[def.id]?.trim());
                                        setLangSearchMap((prev) => ({ ...prev, [def.id]: '' }));
                                      }}
                                      className="px-3 py-1.5 rounded-full bg-primary/20 hover:bg-primary/30 border border-primary text-primary text-xs font-black uppercase flex items-center gap-1.5 transition-all shadow-sm"
                                    >
                                      <Plus className="w-3 h-3" /> Use "{langSearchMap[def.id]?.trim()}"
                                    </button>
                                  )}

                                  {/* Filtered 500+ language smart pills */}
                                  {NIGERIAN_LANGUAGES.filter((lang) =>
                                    lang.toLowerCase().includes((langSearchMap[def.id] || '').toLowerCase())
                                  ).slice(0, 30).map((lang) => (
                                    <button
                                      key={lang}
                                      type="button"
                                      onClick={() => {
                                        handleUpdateDefinition(def.id, 'customDialect', lang);
                                        setLangSearchMap((prev) => ({ ...prev, [def.id]: '' }));
                                      }}
                                      className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/50 text-foreground hover:text-primary text-xs font-bold transition-all flex items-center gap-1"
                                    >
                                      <Plus className="w-3 h-3 text-muted-foreground" /> {lang}
                                    </button>
                                  ))}

                                  {NIGERIAN_LANGUAGES.filter((lang) =>
                                    lang.toLowerCase().includes((langSearchMap[def.id] || '').toLowerCase())
                                  ).length === 0 && (
                                    <div className="w-full p-4 text-center text-xs text-muted-foreground">
                                      No exact language in directory. Click the custom pill above or type your dialect name.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Meaning Text */}
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                        Meaning / Definition in {def.dialect === 'Other' ? def.customDialect || 'this dialect' : def.dialect}
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Explain the precise meaning, cultural context, or translation..."
                        value={def.meaning}
                        onChange={(e) => handleUpdateDefinition(def.id, 'meaning', e.target.value)}
                        onFocus={() => {
                          activeInputRef.current = { type: 'meaning', defId: def.id };
                        }}
                        className="w-full rounded-2xl bg-black/40 border border-white/10 p-4 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all leading-relaxed shadow-inner"
                      />
                    </div>

                    {/* Contextual Examples / Use Cases */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                          Contextual Examples & Use Cases ({def.examples.length})
                        </label>
                        <button
                          type="button"
                          onClick={() => handleAddExample(def.id)}
                          className="text-[11px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add Example
                        </button>
                      </div>

                      <div className="space-y-2">
                        {def.examples.map((ex, exIdx) => (
                          <div key={exIdx} className="flex items-center gap-2">
                            <Input
                              type="text"
                              placeholder={`Use case ${exIdx + 1} (e.g. "He dey do shakara for me...")`}
                              value={ex}
                              onChange={(e) => handleUpdateExample(def.id, exIdx, e.target.value)}
                              onFocus={() => {
                                activeInputRef.current = { type: 'example', defId: def.id, exampleIdx: exIdx };
                              }}
                              className="rounded-xl bg-black/30 border-white/10 text-xs font-medium italic"
                            />
                            {def.examples.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveExample(def.id, exIdx)}
                                className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                ))}

                <Button
                  type="button"
                  onClick={handleAddDefinitionBlock}
                  variant="outline"
                  className="w-full h-14 rounded-2xl border-dashed border-white/20 text-muted-foreground hover:text-primary hover:border-primary/50 text-xs font-black uppercase tracking-widest gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Another Dialect or Polysemous Meaning
                </Button>
              </div>

              {/* Error and Success Alerts */}
              {error && (
                <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successWord && (
                <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 animate-pulse">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>Successfully contributed &quot;{successWord}&quot;! Redirecting to entry...</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting || successWord !== null || !canSubmit}
                  className="flex-1 h-16 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-black uppercase tracking-widest text-sm shadow-2xl transition-all hover:scale-[1.01] active:scale-95 gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  {isSubmitting
                    ? 'Publishing Entry...'
                    : !isEmailVerified
                    ? 'Email Verification Required'
                    : !isOnboarded
                    ? 'Heritage Onboarding Required'
                    : isBanned
                    ? 'Contribution Restricted'
                    : 'Publish to Nigerian Dictionary'}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearAll}
                  className="h-16 px-6 rounded-2xl border-white/10 text-xs font-bold uppercase tracking-wider hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                >
                  Clear Form
                </Button>
              </div>
            </form>
          </div>

          {/* ================= RIGHT COLUMN: REAL-TIME LIVE CARD PREVIEW ================= */}
          <div className="lg:col-span-5 sticky top-24 space-y-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-primary" /> Live Dictionary Card Preview
              </span>
              <span className="text-[10px] uppercase font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                Real-Time
              </span>
            </div>

            <article className="glass-panel rounded-[2.5rem] p-6 sm:p-8 border border-white/15 shadow-2xl space-y-6 relative overflow-hidden bg-card/60 backdrop-blur-2xl">
              <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-primary to-secondary" />

              {/* Header Term */}
              <div>
                <h2 className="text-4xl font-black lowercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/80">
                  {word.trim() || 'word_preview'}
                </h2>

                {/* Aliases / Dialect variants */}
                {aliases.length > 0 && (
                  <div className="text-xs font-bold text-muted-foreground mt-1">
                    Also: {aliases.join(', ')}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-3">
                  {definitions.map((d, i) => {
                    const label = d.dialect === 'Other' ? d.customDialect || 'Other' : d.dialect;
                    return (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest"
                      >
                        {label || 'Dialect'}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Senses Preview */}
              <div className="divide-y divide-white/10 space-y-5">
                {definitions.map((d, i) => {
                  const label = d.dialect === 'Other' ? d.customDialect || 'Other' : d.dialect;
                  return (
                    <div key={d.id} className="pt-5 first:pt-0 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-primary text-sm font-black opacity-60">0{i + 1}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/80 px-2 py-0.5 rounded bg-white/5">
                          {label}
                        </span>
                      </div>

                      <p className="text-base font-medium text-foreground/90 leading-relaxed">
                        {d.meaning.trim() || 'Your definition meaning will appear here...'}
                      </p>

                      {/* Examples Quote List */}
                      {d.examples.filter((ex) => ex.trim()).length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          {d.examples
                            .filter((ex) => ex.trim())
                            .map((ex, exIdx) => (
                              <div
                                key={exIdx}
                                className="bg-muted/30 rounded-xl p-3 border border-white/5 text-xs text-muted-foreground italic"
                              >
                                &quot;{ex.trim()}&quot;
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer preview */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <span className="text-primary">★ 0 Community Votes</span>
                <span>By {session?.user?.name || 'You'}</span>
              </div>
            </article>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-[11px] text-muted-foreground leading-relaxed">
              💡 <strong>Linguistic Cognates:</strong> Connecting Yoruba origins with Pidgin street evolution (e.g. <em>ṣákárà</em> ↔ <em>shakara</em>) preserves cultural heritage and accelerates community discovery.
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
