'use client';

import { DoorOpen } from 'lucide-react';

type CloseButtonProps = {
  onClick: () => void;
  className?: string;
  label?: string;
};

export function CloseButton({ onClick, className = '', label = 'Close' }: CloseButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`absolute right-4 top-4 w-11 h-11 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/25 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110 active:scale-95 ${className}`}
    >
      <DoorOpen className="w-6 h-6" />
    </button>
  );
}
