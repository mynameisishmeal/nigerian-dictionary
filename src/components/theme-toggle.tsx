'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Laptop } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Toggle theme"
        className={`w-9 h-9 rounded-full border border-border/40 text-muted-foreground opacity-50 ${className}`}
      >
        <Sun className="w-4 h-4" />
      </Button>
    );
  }

  const cycleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('system');
    } else {
      setTheme('dark');
    }
  };

  const getIcon = () => {
    if (theme === 'dark') return <Moon className="w-4 h-4 text-emerald-400 animate-in fade-in zoom-in duration-300" />;
    if (theme === 'light') return <Sun className="w-4 h-4 text-amber-500 animate-in fade-in zoom-in duration-300" />;
    return <Laptop className="w-4 h-4 text-primary animate-in fade-in zoom-in duration-300" />;
  };

  const getLabel = () => {
    if (theme === 'dark') return 'Dark Mode';
    if (theme === 'light') return 'Light Mode';
    return 'System Theme';
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      title={`Current: ${getLabel()} (Click to toggle)`}
      aria-label={`Current: ${getLabel()} (Click to toggle)`}
      className={`relative w-9 h-9 rounded-full border border-border/50 bg-background/50 hover:bg-muted/40 text-foreground transition-all hover:scale-105 active:scale-95 shadow-sm ${className}`}
    >
      {getIcon()}
    </Button>
  );
}

export function ThemeSegmentedControl() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="inline-flex items-center p-1 rounded-full bg-muted/40 border border-border/50 shadow-inner gap-1">
      <button
        type="button"
        onClick={() => setTheme('light')}
        title="Light Mode"
        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
          theme === 'light'
            ? 'bg-background text-foreground shadow-sm font-black'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Sun className="w-3.5 h-3.5 text-amber-500" />
        <span>Light</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        title="Dark Mode"
        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
          theme === 'dark'
            ? 'bg-background text-primary shadow-sm font-black'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Moon className="w-3.5 h-3.5 text-emerald-400" />
        <span>Dark</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('system')}
        title="System Theme"
        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
          theme === 'system'
            ? 'bg-background text-foreground shadow-sm font-black'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Laptop className="w-3.5 h-3.5 text-primary" />
        <span>Auto</span>
      </button>
    </div>
  );
}
