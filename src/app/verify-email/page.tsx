'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, RefreshCw, ArrowRight, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'resending' | 'resent'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [resendEmail, setResendEmail] = useState<string>(emailParam || '');

  useEffect(() => {
    if (!token || !emailParam) {
      setStatus('error');
      setErrorMessage('Missing token or email parameter in verification link.');
      return;
    }

    let isMounted = true;

    async function verify() {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, email: emailParam }),
        });

        const data = await res.json();

        if (!isMounted) return;

        if (res.ok && data.success) {
          setStatus('success');
          setTimeout(() => {
            router.push('/onboarding');
          }, 1800);
        } else {
          setStatus('error');
          setErrorMessage(data.error || 'This link has expired or has already been used.');
        }
      } catch (err: any) {
        if (!isMounted) return;
        setStatus('error');
        setErrorMessage('Failed to connect to verification server. Please try again.');
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [token, emailParam, router]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;

    setStatus('resending');
    try {
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus('resent');
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to resend verification email.');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage('Network error while resending link.');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 selection:bg-primary selection:text-primary-foreground relative">
      <div className="w-full max-w-md glass-panel rounded-3xl p-8 border border-border/60 shadow-2xl animate-in fade-in zoom-in-95 duration-300 text-center">
        
        {/* VERIFYING STATE */}
        {status === 'verifying' && (
          <div className="space-y-6 py-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto text-primary animate-spin">
              <RefreshCw className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">
                Verifying Email
              </h1>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2">
                Validating your secure single-use token...
              </p>
            </div>
          </div>
        )}

        {/* SUCCESS STATE */}
        {status === 'success' && (
          <div className="space-y-6 py-4 animate-in fade-in duration-300">
            <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mx-auto text-primary shadow-lg shadow-primary/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">
                Email Verified!
              </h1>
              <p className="text-xs font-bold uppercase tracking-widest text-primary mt-2">
                Token consumed · Redirecting to onboarding...
              </p>
            </div>
            <div className="pt-2">
              <Link href="/onboarding">
                <Button className="w-full rounded-2xl h-12 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all">
                  <span>Continue to Onboarding</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* ERROR / EXPIRED / CONSUMED STATE */}
        {(status === 'error' || status === 'resending') && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center mx-auto text-destructive">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">
                Verification Expired
              </h1>
              <p className="text-xs font-medium text-destructive mt-2 leading-relaxed bg-destructive/10 p-3 rounded-xl border border-destructive/20">
                {errorMessage}
              </p>
            </div>

            <form onSubmit={handleResend} className="space-y-4 pt-2">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">
                  Request Fresh Verification Link
                </label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-border/50 h-12 bg-background/50 text-sm font-semibold"
                />
              </div>
              <Button
                type="submit"
                disabled={status === 'resending'}
                className="w-full rounded-2xl h-12 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs transition-all hover:scale-[1.02] active:scale-95"
              >
                {status === 'resending' ? 'Sending Fresh Link...' : 'Send New Verification Link'}
              </Button>
            </form>
          </div>
        )}

        {/* RESENT STATE */}
        {status === 'resent' && (
          <div className="space-y-6 py-4 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto text-primary">
              <Mail className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">
                Fresh Link Dispatched!
              </h1>
              <p className="text-xs font-semibold text-muted-foreground mt-2 leading-relaxed">
                We have sent a new single-use verification email to <strong className="text-foreground">{resendEmail}</strong>. Please check your inbox or spam folder.
              </p>
            </div>
            <div className="pt-2">
              <Link href="/">
                <Button variant="outline" className="w-full rounded-2xl h-12 border-border/50 font-bold uppercase tracking-widest text-xs">
                  Return to Home
                </Button>
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center font-bold uppercase tracking-widest text-primary animate-pulse">
        Loading verification...
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
