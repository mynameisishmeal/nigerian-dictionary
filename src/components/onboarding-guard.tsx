'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';

const EXEMPT_PATHS = ['/onboarding', '/verify-email', '/privacy', '/terms'];

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const hasCheckedRef = useRef<string | null>(null);

  useEffect(() => {
    // Only run if user is authenticated and not loading
    if (isPending || !session?.user) {
      hasCheckedRef.current = null;
      return;
    }

    // Do not redirect if already on an exempt path
    if (EXEMPT_PATHS.some((p) => pathname.startsWith(p))) {
      return;
    }

    // Prevent redundant requests if already checked for this session
    const sessionKey = `${session.user.id}-${pathname}`;
    if (hasCheckedRef.current === sessionKey) return;
    hasCheckedRef.current = sessionKey;

    let isMounted = true;
    fetch('/api/user/onboarding')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;

        // If user has not completed onboarding, automatically redirect them to /onboarding
        if (!data?.user || !data.user.isOnboarded) {
          router.replace('/onboarding');
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [session?.user?.id, pathname, isPending, router]);

  return <>{children}</>;
}
