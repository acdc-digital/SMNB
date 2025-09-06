// NAVIGATION BUTTONS
// /components/ui/NavigationButtons.tsx

'use client';

import { Home } from 'lucide-react';
import Link from 'next/link';

export function NavigationButtons() {
  return (
    <div className="flex items-center gap-2">
      {/* Home Button */}
      <Link href="/" aria-label="Home">
        <button className="flex items-center justify-center w-8 h-8 rounded-md border border-black/10 dark:border-white/10 bg-background/60 hover:bg-background/80 transition-colors">
          <Home className="w-4 h-4 text-foreground/80" />
        </button>
      </Link>
    </div>
  );
}