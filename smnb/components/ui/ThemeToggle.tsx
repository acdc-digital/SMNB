// THEME TOGGLE
// /Users/matthewsimon/Projects/SMNB/smnb/components/ui/ThemeToggle.tsx

'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder button to prevent hydration issues
    return (
      <button 
        className="flex items-center justify-center w-8 h-8 rounded-md border border-black/10 dark:border-white/10 bg-background/60 hover:bg-background/80 transition-colors"
        aria-label="Toggle theme"
      >
        <div className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="flex items-center justify-center w-8 h-8 rounded-md border border-black/10 dark:border-white/10 bg-background/60 hover:bg-background/80 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-foreground/80" />
      ) : (
        <Moon className="w-4 h-4 text-foreground/80" />
      )}
    </button>
  );
}
