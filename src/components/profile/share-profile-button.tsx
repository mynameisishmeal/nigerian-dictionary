'use client';

import { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ShareProfileButton({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/profile/public/${username}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (e) {
      console.warn('Failed to copy to clipboard', e);
    }
  };

  return (
    <Button
      onClick={handleShare}
      variant="outline"
      size="sm"
      className="rounded-full bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary text-xs font-black uppercase tracking-wider flex items-center gap-1.5 h-9 px-4 hover:scale-105 transition-all shadow-sm"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-green-500" />
          <span className="text-green-500">Link Copied!</span>
        </>
      ) : (
        <>
          <Share2 className="w-3.5 h-3.5" />
          <span>Share Profile</span>
        </>
      )}
    </Button>
  );
}
