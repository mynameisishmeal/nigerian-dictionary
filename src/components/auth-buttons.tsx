'use client';

import { useState } from "react";
import { signIn, signUp, signOut, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FaGoogle, FaPen } from "react-icons/fa";
import { useRouter } from "next/navigation";

export function AuthButtons() {
  const { data: session, isPending } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [devVerificationLink, setDevVerificationLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  if (isPending) {
    return <div className="text-xs md:text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Loading...</div>;
  }

  if (session) {
    return null;
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    setError("");

    // Try signing up first
    const { error: signUpError } = await signUp.email({ 
      email, 
      password, 
      name: email.split("@")[0] 
    });

    if (signUpError) {
      // If user already exists, sign them in
      const { error: signInError } = await signIn.email({ email, password });
      if (signInError) {
        setError(signInError.message || "Invalid credentials. Please try again.");
      } else {
        // Check if user has onboarded
        setIsOpen(false);
        router.push("/dashboard");
      }
    } else {
      // Brand new signup: Dispatch single-use verification email
      try {
        const verifyRes = await fetch('/api/auth/send-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const verifyData = await verifyRes.json();
        if (verifyData?.devLink) {
          setDevVerificationLink(verifyData.devLink);
        }
      } catch (err) {
        console.error('Failed to dispatch verification email:', err);
      }
      setVerificationSent(true);
    }
    
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger 
        className="rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 font-bold uppercase tracking-wider text-sm flex items-center gap-2 shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)] shadow-primary/50 transition-all hover:scale-105 active:scale-95 px-6 h-10 cursor-pointer"
      >
        <FaPen className="w-3.5 h-3.5" />
        Contribute
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] rounded-[2rem] border border-border/60 glass-panel shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] p-8">
        {verificationSent ? (
          <div className="flex flex-col items-center text-center gap-6 py-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-primary shadow-lg shadow-primary/20">
              <span className="text-3xl">📧</span>
            </div>
            <div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight text-foreground">
                Check Your Email
              </DialogTitle>
              <p className="text-xs font-semibold text-muted-foreground mt-2 leading-relaxed">
                We sent a single-use verification link to <strong className="text-foreground">{email}</strong>. Click the link in your email to verify your account and start your heritage onboarding.
              </p>
            </div>

            {devVerificationLink && (
              <div className="w-full p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-left text-xs font-semibold space-y-1">
                <span className="font-bold uppercase tracking-wider block text-[10px]">🛠️ Development Quick Link:</span>
                <a href={devVerificationLink} className="underline break-all block font-mono text-[11px] hover:text-primary">
                  {devVerificationLink}
                </a>
              </div>
            )}

            <Button
              type="button"
              onClick={() => { setIsOpen(false); setVerificationSent(false); }}
              className="w-full rounded-2xl h-12 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs"
            >
              Got It
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader className="mb-2">
              <DialogTitle className="text-3xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary text-center">
                Join to Contribute
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex flex-col gap-6 py-4">
              <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Input 
                    type="email" 
                    placeholder="Email Address" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-2xl border border-border/50 focus-visible:ring-2 focus-visible:ring-primary/50 font-bold text-lg h-14 bg-muted/20 backdrop-blur-sm px-6 shadow-inner transition-all hover:bg-muted/30"
                    required
                  />
                  <Input 
                    type="password" 
                    placeholder="Password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-2xl border border-border/50 focus-visible:ring-2 focus-visible:ring-primary/50 font-bold text-lg h-14 bg-muted/20 backdrop-blur-sm px-6 shadow-inner transition-all hover:bg-muted/30"
                    required
                  />
                </div>
                
                {error && <div className="text-red-500 text-xs font-bold uppercase">{error}</div>}
                
                <Button 
                  type="submit"
                  disabled={loading}
                  className="rounded-2xl h-14 mt-2 font-black uppercase tracking-widest bg-gradient-to-r from-primary to-secondary text-primary-foreground transition-all hover:opacity-90 hover:scale-[1.02] active:scale-95 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] shadow-primary/40"
                >
                  {loading ? "Please wait..." : "Continue with Email"}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/60" />
                </div>
                <div className="relative flex justify-center text-xs uppercase font-semibold tracking-wider">
                  <span className="bg-card px-3 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button 
                type="button"
                variant="outline"
                className="rounded-2xl h-14 font-bold uppercase tracking-wider border border-border/50 bg-muted/10 text-foreground hover:bg-muted/30 flex items-center gap-3 transition-colors shadow-inner"
                onClick={() => signIn.social({ provider: "google", callbackURL: "/dashboard" })}
              >
                <FaGoogle className="w-5 h-5 text-primary" />
                Continue with Google
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
