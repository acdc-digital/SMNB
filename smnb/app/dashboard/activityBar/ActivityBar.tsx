// ACTIVITY BAR
// /Users/matthewsimon/Projects/SMNB/smnb/app/dashboard/activityBar/ActivityBar.tsx

'use client';

import React from "react";

// Simple placeholder icons (no extra deps). Replace with real SVGs later.
const icons = [
  { id: "home", label: "Home", char: "🏠" },
  { id: "feed", label: "Feed", char: "📰" },
  { id: "search", label: "Search", char: "🔍" },
  { id: "settings", label: "Settings", char: "⚙️" },
];

export default function ActivityBar() {
  return (
    <nav className="flex flex-col items-center gap-2 py-4 w-14 shrink-0 border-r border-black/10 dark:border-white/10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/50">
      {icons.map((ic) => (
        <button
          key={ic.id}
          title={ic.label}
          className="w-10 h-10 text-lg rounded-md flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <span aria-hidden>{ic.char}</span>
          <span className="sr-only">{ic.label}</span>
        </button>
      ))}
      <div className="mt-auto" />
    </nav>
  );
}
