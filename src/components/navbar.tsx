'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AuthButtons } from '@/components/auth-buttons';
import { useSession, signOut } from '@/lib/auth-client';
import { UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CloseButton } from '@/components/ui/close-button';
import { ThemeToggle, ThemeSegmentedControl } from '@/components/theme-toggle';

export function Navbar() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetch('/api/user/role')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.isSuperAdmin) {
            setIsSuperAdmin(true);
          } else {
            setIsSuperAdmin(false);
          }
        })
        .catch(() => setIsSuperAdmin(false));
    } else {
      setIsSuperAdmin(false);
    }
  }, [session?.user?.id]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <div className="w-full flex justify-center sticky top-4 z-50 px-4">
        <nav className="glass-panel w-full max-w-4xl rounded-full py-2 px-5 md:px-6 flex justify-between items-center transition-all duration-500 hover:shadow-lg relative z-50">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity" onClick={() => setIsMenuOpen(false)}>
              <Image src="/logo.png" alt="The Nigerian Dictionary Logo" width={32} height={32} className="object-contain" />
              <h1 className="text-lg md:text-xl font-bold tracking-tighter text-primary uppercase hidden md:block">
                The Nigerian Dictionary
              </h1>
            </Link>
          </div>
          
          {/* Actions & Unified Toggle Button */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/contribute"
              className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-black uppercase tracking-wider transition-all hover:scale-105 shadow-md flex items-center gap-1.5"
            >
              <span>+ Contribute</span>
            </Link>

            <ThemeToggle />

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMenu}
              onMouseEnter={() => setIsMenuOpen(true)}
              className="text-foreground rounded-full w-10 h-10 hover:bg-muted/30 p-0 overflow-hidden border border-border/50 transition-transform hover:scale-105 active:scale-95 shadow-sm"
            >
              {session?.user.image ? (
                <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
              ) : session?.user.name ? (
                <div className="w-full h-full bg-primary/20 text-primary flex items-center justify-center font-black uppercase text-sm">
                  {session.user.name.charAt(0).toUpperCase()}
                </div>
              ) : (
                <UserCircle className="w-6 h-6 text-foreground/80" />
              )}
            </Button>
          </div>
        </nav>
      </div>

      {/* Universal Menu Dropdown */}
      {isMenuOpen && (
        <>
          {/* Invisible Overlay for click-away to close */}
          <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
          
          <div className="fixed top-1/2 left-4 right-4 md:left-1/2 md:w-[400px] md:-translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-6 text-center p-8 glass-panel rounded-3xl border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <CloseButton onClick={() => setIsMenuOpen(false)} label="Close menu" />
            
            <Link 
              href="/contribute" 
              className="text-xl font-black uppercase tracking-widest text-primary hover:opacity-80 transition-opacity w-full pb-4 border-b border-white/10"
              onClick={() => setIsMenuOpen(false)}
            >
              + Contribute Word
            </Link>

            <Link 
              href="/archive" 
              className="text-xl font-black uppercase tracking-widest text-foreground hover:text-primary transition-colors w-full pb-4 border-b border-white/10"
              onClick={() => setIsMenuOpen(false)}
            >
              Archive
            </Link>
            
            <Link 
              href="/languages" 
              className="text-xl font-black uppercase tracking-widest text-foreground hover:text-primary transition-colors w-full pb-4 border-b border-white/10"
              onClick={() => setIsMenuOpen(false)}
            >
              Languages
            </Link>

            <Link 
              href="#" 
              className="text-xl font-black uppercase tracking-widest text-foreground hover:text-primary transition-colors w-full pb-4 border-b border-white/10"
              onClick={() => setIsMenuOpen(false)}
            >
              Donate
            </Link>

            <Link 
              href="/privacy" 
              className="text-xl font-black uppercase tracking-widest text-foreground hover:text-primary transition-colors w-full pb-4 border-b border-white/10"
              onClick={() => setIsMenuOpen(false)}
            >
              Privacy Policy
            </Link>

            <Link 
              href="/terms" 
              className="text-xl font-black uppercase tracking-widest text-foreground hover:text-primary transition-colors w-full pb-4 border-b border-white/10"
              onClick={() => setIsMenuOpen(false)}
            >
              Terms of Service
            </Link>
            
            <div className="w-full py-2 flex items-center justify-center border-b border-border/40">
              <ThemeSegmentedControl />
            </div>

            {session && (
              <>
                <Link 
                  href="/profile/me" 
                  className="text-xl font-black uppercase tracking-widest text-foreground hover:text-primary transition-colors w-full pb-4 border-b border-white/10"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
                <Link 
                  href="/dashboard" 
                  className="text-xl font-black uppercase tracking-widest text-foreground hover:text-primary transition-colors w-full pb-4 border-b border-white/10"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                {isSuperAdmin && (
                  <Link 
                    href="/admin" 
                    className="text-xl font-black uppercase tracking-widest text-primary hover:opacity-80 transition-opacity w-full pb-4 border-b border-white/10 flex items-center justify-center gap-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Superadmin Suite
                  </Link>
                )}
                <div className="w-full pt-4 flex justify-center">
                  <Button 
                    variant="outline" 
                    className="w-full rounded-full border-border/50 text-foreground hover:bg-muted/30 font-bold uppercase tracking-widest h-12 transition-all hover:scale-[1.02] active:scale-95"
                    onClick={() => { setIsMenuOpen(false); signOut(); }}
                  >
                    Sign Out
                  </Button>
                </div>
              </>
            )}
            
            {!session && (
              <div className="w-full pt-4 flex justify-center">
                <AuthButtons />
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
