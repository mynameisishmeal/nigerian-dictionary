'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NIGERIAN_LANGUAGES } from '@/lib/languages';
import { NIGERIAN_STATES } from '@/lib/states';
import { 
  UserCheck, 
  MapPin, 
  Languages, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Search, 
  Plus, 
  ShieldCheck,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  KeyRound
} from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';

const POPULAR_LANGUAGES = [
  "Yoruba", "Igbo", "Hausa", "Edo", "Ibibio", "Tiv", "Kanuri", "Fulfulde", 
  "Urhobo", "Itsekiri", "Ebira", "Igala", "Nupe", "Efik", "Ijaw", "Berom"
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [hasPassword, setHasPassword] = useState<boolean>(true);
  const [isGoogleUser, setIsGoogleUser] = useState<boolean>(false);

  const [step, setStep] = useState<number>(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  
  // Password step states
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [selectedState, setSelectedState] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [customLanguage, setCustomLanguage] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  
  const [stateSearch, setStateSearch] = useState('');
  const [langSearch, setLangSearch] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  // Total steps: 4 if user authenticated via Google OAuth and lacks a credential password, otherwise 3
  const needsPasswordStep = isGoogleUser && hasPassword === false;
  const totalSteps = needsPasswordStep ? 4 : 3;

  // Prefill existing user data if available
  useEffect(() => {
    if (session?.user) {
      if (session.user.name && !firstName) {
        const parts = session.user.name.split(' ');
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || '');
      }

      if (session.user.email && !username) {
        setUsername(session.user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, ''));
      }

      fetch('/api/user/onboarding')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setHasPassword(data.hasPassword === true);
            setIsGoogleUser(data.isGoogleUser === true);
            if (data.user) {
              if (data.user.firstName) setFirstName(data.user.firstName);
              if (data.user.lastName) setLastName(data.user.lastName);
              if (data.user.username) setUsername(data.user.username);
              if (data.user.stateOfOrigin) setSelectedState(data.user.stateOfOrigin);
              if (data.user.primaryLanguage) {
                setSelectedLanguage(data.user.primaryLanguage);
              }
            }
          }
        })
        .catch(() => {});
    }
  }, [session]);

  const filteredStates = useMemo(() => {
    if (!stateSearch.trim()) return NIGERIAN_STATES;
    return NIGERIAN_STATES.filter((s) => s.toLowerCase().includes(stateSearch.toLowerCase().trim()));
  }, [stateSearch]);

  const filteredLanguages = useMemo(() => {
    const list = NIGERIAN_LANGUAGES.filter((l) => l !== 'Nigerian Pidgin');
    if (!langSearch.trim()) return list.slice(0, 40);
    return list.filter((l) => l.toLowerCase().includes(langSearch.toLowerCase().trim())).slice(0, 50);
  }, [langSearch]);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: 'bg-muted', percent: 0 };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-destructive', percent: 25 };
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500', percent: 50 };
    if (score === 3) return { score: 3, label: 'Good', color: 'bg-blue-500', percent: 75 };
    return { score: 4, label: 'Strong', color: 'bg-emerald-500', percent: 100 };
  }, [password]);

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please provide both your first name and last name.');
      return;
    }
    const cleanUser = username.trim().toLowerCase().replace(/^@+/, '').replace(/[^a-z0-9_]/g, '');
    if (cleanUser.length < 3) {
      setError('Please choose a valid unique username (at least 3 characters).');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleNextPasswordStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your confirmation password.');
      return;
    }
    setError(null);
    setStep(3);
  };

  const handleNextStateStep = (stateName: string) => {
    setSelectedState(stateName);
    setError(null);
    setStep(needsPasswordStep ? 4 : 3);
  };

  const handleLanguageSelect = (lang: string) => {
    setIsCustomMode(false);
    setSelectedLanguage(lang);
    setCustomLanguage('');
  };

  const handleFinalSubmit = async () => {
    const finalLanguage = isCustomMode ? customLanguage.trim() : selectedLanguage.trim();
    if (!finalLanguage) {
      setError('Please choose or enter your primary heritage language.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim().toLowerCase().replace(/^@+/, '').replace(/[^a-z0-9_]/g, ''),
        stateOfOrigin: selectedState,
        primaryLanguage: finalLanguage,
      };

      if (hasPassword === false && password.trim().length >= 8) {
        payload.password = password.trim();
      }

      const res = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save onboarding details.');
      }

      setIsDone(true);
      setTimeout(() => {
        router.push('/contribute');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold uppercase tracking-widest text-primary animate-pulse">
        Loading Onboarding...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-6 md:p-10 selection:bg-primary selection:text-primary-foreground relative pt-24 pb-20">
      <div className="w-full max-w-2xl glass-panel rounded-3xl p-6 sm:p-10 border border-border/60 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        
        {/* STEPPER PROGRESS */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">
            <span className={step >= 1 ? 'text-primary font-black' : ''}>1. Identity</span>
            {needsPasswordStep && (
              <span className={step >= 2 ? 'text-primary font-black' : ''}>2. Password</span>
            )}
            <span className={(needsPasswordStep ? step >= 3 : step >= 2) ? 'text-primary font-black' : ''}>
              {needsPasswordStep ? '3. State' : '2. Origin State'}
            </span>
            <span className={(needsPasswordStep ? step >= 4 : step >= 3) ? 'text-primary font-black' : ''}>
              {needsPasswordStep ? '4. Language' : '3. Language'}
            </span>
          </div>
          <div className="w-full bg-muted/40 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-primary to-secondary h-full transition-all duration-500 rounded-full"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold uppercase tracking-wider animate-shake">
            {error}
          </div>
        )}

        {/* STEP 1: NAME & USERNAME */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-3">
                <UserCheck className="w-3.5 h-3.5" />
                Step 1 of {totalSteps}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
                What is your name?
              </h1>
              <p className="text-xs font-semibold text-muted-foreground mt-1">
                Enter your real first and last name. This will appear alongside your verified definitions.
              </p>
            </div>

            <form onSubmit={handleNextStep1} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-primary block">
                    First Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Rose"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-border/50 h-14 bg-background/50 text-base font-bold px-4"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-primary block">
                    Last Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Welltin"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-border/50 h-14 bg-background/50 text-base font-bold px-4"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-primary block">
                  Unique Username (@handle) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-base">@</span>
                  <Input
                    type="text"
                    placeholder="rosewelltin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    required
                    className="w-full pl-9 rounded-2xl border border-border/50 h-14 bg-background/50 text-base font-bold pr-4"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground font-semibold">Only lowercase letters, numbers, and underscores (min 3 chars).</span>
              </div>

              {firstName && lastName && (
                <div className="p-4 rounded-2xl bg-card/60 border border-border/40 text-xs font-medium text-muted-foreground flex items-center justify-between">
                  <span>Community Profile Preview:</span>
                  <strong className="text-foreground text-sm font-bold">
                    {firstName} {lastName} {username ? `(@${username.toLowerCase().replace(/^@+/, '')})` : ''}
                  </strong>
                </div>
              )}

              <Button
                type="submit"
                disabled={!firstName.trim() || !lastName.trim() || !username.trim()}
                className="w-full rounded-2xl h-14 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all mt-4"
              >
                <span>{hasPassword === false ? 'Continue to Create Password' : 'Continue to State of Origin'}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </div>
        )}

        {/* STEP 2 (ONLY FOR GOOGLE USERS WITHOUT PASSWORD): CREATE PASSWORD */}
        {needsPasswordStep && step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-3">
                <KeyRound className="w-3.5 h-3.5" />
                Step 2 of {totalSteps}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
                Create Account Password
              </h1>
              <p className="text-xs font-semibold text-muted-foreground mt-1">
                Set a secure password so you can sign in directly using your email in addition to Google.
              </p>
            </div>

            {/* Google Account Banner */}
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-background border border-border/60 flex items-center justify-center shrink-0 shadow-sm">
                <FaGoogle className="w-5 h-5 text-primary" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-foreground block">Google Account Connected</span>
                <span className="text-muted-foreground text-[11px]">
                  {session?.user?.email || 'Your Google email'}
                </span>
              </div>
            </div>

            <form onSubmit={handleNextPasswordStep} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-primary block">
                  New Password *
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter at least 8 characters..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pr-12 rounded-2xl border border-border/50 h-14 bg-background/50 text-base font-bold px-4"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {password && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                      <span className="text-muted-foreground">Strength:</span>
                      <span className={
                        passwordStrength.score >= 3 ? 'text-emerald-500' :
                        passwordStrength.score === 2 ? 'text-amber-500' : 'text-destructive'
                      }>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full bg-muted/40 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 rounded-full ${passwordStrength.color}`}
                        style={{ width: `${passwordStrength.percent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-primary block">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password..."
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full pr-12 rounded-2xl border border-border/50 h-14 bg-background/50 text-base font-bold px-4"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <span className="text-[11px] text-destructive font-bold uppercase tracking-wider block">
                    Passwords do not match
                  </span>
                )}
                {confirmPassword && password === confirmPassword && (
                  <span className="text-[11px] text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Check className="w-3 h-3" /> Passwords match
                  </span>
                )}
              </div>

              <div className="flex gap-3 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="rounded-2xl h-12 border-border/50 font-bold uppercase tracking-widest text-xs px-6 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </Button>
                <Button
                  type="submit"
                  className="flex-1 rounded-2xl h-12 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-md shadow-primary/20"
                >
                  <span>Continue to State of Origin</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* STEP: STATE OF ORIGIN (Step 3 if Google user without password, Step 2 if email user) */}
        {((needsPasswordStep && step === 3) || (!needsPasswordStep && step === 2)) && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-3">
                <MapPin className="w-3.5 h-3.5" />
                Step {needsPasswordStep ? 3 : 2} of {totalSteps}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
                Select your State in Nigeria
              </h1>
              <p className="text-xs font-semibold text-muted-foreground mt-1">
                Choose the Nigerian state you hail from or associate your heritage with.
              </p>
            </div>

            {/* State Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search states (e.g. Lagos, Oyo, Anambra, Kano)..."
                value={stateSearch}
                onChange={(e) => setStateSearch(e.target.value)}
                className="w-full pl-11 rounded-2xl border border-border/50 h-12 bg-background/50 font-semibold text-sm"
              />
            </div>

            {/* States Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
              {filteredStates.map((stateName) => {
                const isSelected = selectedState === stateName;
                return (
                  <button
                    key={stateName}
                    type="button"
                    onClick={() => handleNextStateStep(stateName)}
                    className={`p-3 rounded-2xl text-xs font-bold uppercase tracking-wider text-left transition-all border flex items-center justify-between ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]'
                        : 'bg-card/70 border-border/40 text-foreground hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    <span>{stateName}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(needsPasswordStep ? 2 : 1)}
                className="rounded-2xl h-12 border-border/50 font-bold uppercase tracking-widest text-xs px-6 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>
              {selectedState && (
                <Button
                  type="button"
                  onClick={() => setStep(needsPasswordStep ? 4 : 3)}
                  className="flex-1 rounded-2xl h-12 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <span>Continue with {selectedState}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* STEP: HERITAGE LANGUAGE (Step 4 if Google user, Step 3 if email user) */}
        {((needsPasswordStep && step === 4) || (!needsPasswordStep && step === 3)) && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-3">
                <Languages className="w-3.5 h-3.5" />
                Step {totalSteps} of {totalSteps}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">
                Choose your Primary Language
              </h1>
              <p className="text-xs font-semibold text-muted-foreground mt-1">
                Select your native language or dialect from Nigeria's 500+ languages.
              </p>
            </div>

            {/* HERITAGE & ANTI-SPAM NOTICE */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs font-medium space-y-1.5 text-foreground">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black uppercase tracking-wider text-[11px]">
                <ShieldCheck className="w-4 h-4" />
                Linguistic Heritage & Anti-Spam Policy
              </div>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                To ensure dialect integrity and prevent spam across linguistic regions, contributors can only submit definitions in their registered language, <strong>Nigerian Pidgin</strong>, or <strong>Urban Slang</strong>.
              </p>
            </div>

            {/* Popular Language Quick Pills */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">
                Popular Languages:
              </label>
              <div className="flex flex-wrap gap-2">
                {POPULAR_LANGUAGES.map((lang) => {
                  const isSelected = !isCustomMode && selectedLanguage.toLowerCase() === lang.toLowerCase();
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => handleLanguageSelect(lang)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary shadow-md scale-105'
                          : 'bg-card/70 border-border/40 text-foreground hover:border-primary/50'
                      }`}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search All Languages */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">
                Or Search All 500+ Nigerian Languages:
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Search (e.g. Tiv, Idoma, Urhobo, Nupe, Ebira, Itsekiri)..."
                  value={langSearch}
                  onChange={(e) => setLangSearch(e.target.value)}
                  className="w-full pl-11 rounded-2xl border border-border/50 h-12 bg-background/50 font-semibold text-sm"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                {filteredLanguages.map((lang) => {
                  const isSelected = !isCustomMode && selectedLanguage.toLowerCase() === lang.toLowerCase();
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => handleLanguageSelect(lang)}
                      className={`p-2.5 rounded-xl text-xs font-bold text-left transition-all border flex items-center justify-between ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card/40 border-border/30 text-foreground hover:bg-primary/5'
                      }`}
                    >
                      <span className="truncate">{lang}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Language Option */}
            <div className="pt-2 border-t border-border/40">
              {!isCustomMode ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomMode(true);
                    setSelectedLanguage('');
                  }}
                  className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Don't see your language? Add custom dialect</span>
                </button>
              ) : (
                <div className="space-y-2 p-4 rounded-2xl bg-card/60 border border-primary/40 animate-in fade-in">
                  <label className="text-xs font-black uppercase tracking-widest text-primary block">
                    Custom Language / Dialect Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter your language (e.g. Okun, Ika, Ikwerre, Owo)..."
                    value={customLanguage}
                    onChange={(e) => setCustomLanguage(e.target.value)}
                    className="w-full rounded-2xl border border-border/50 h-12 bg-background/50 text-sm font-bold px-4"
                  />
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[11px] text-muted-foreground">
                      Will be registered as your contributing dialect
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomMode(false);
                        setCustomLanguage('');
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-border/30">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(needsPasswordStep ? 3 : 2)}
                className="rounded-2xl h-14 border-border/50 font-bold uppercase tracking-widest text-xs px-6 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>
              
              <Button
                type="button"
                disabled={(!selectedLanguage && !customLanguage.trim()) || isSubmitting || isDone}
                onClick={handleFinalSubmit}
                className="flex-1 rounded-2xl h-14 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/30"
              >
                {isDone ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Welcome to the Community!</span>
                  </>
                ) : isSubmitting ? (
                  <span>Saving Profile...</span>
                ) : (
                  <>
                    <span>Complete Onboarding</span>
                    <Check className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
