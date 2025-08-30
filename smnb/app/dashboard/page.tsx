import React from "react";
import Link from "next/link";
import LiveFeedWaterfall from "@/components/LiveFeedWaterfall";
import LiveFeedControls from "@/components/LiveFeedControls";

// Simple placeholder icons (no extra deps). Replace with real SVGs later.
const icons = [
  { id: "home", label: "Home", char: "🏠" },
  { id: "feed", label: "Feed", char: "📰" },
  { id: "search", label: "Search", char: "🔍" },
  { id: "settings", label: "Settings", char: "⚙️" },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-screen font-sans overflow-hidden">
      {/* Top thin border / bar */}
      <div className="w-full h-6 flex items-center gap-3 px-4 text-xs tracking-wide uppercase text-foreground/60 border-b border-black/10 dark:border-white/10 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
        <span className="font-medium">SMNB Dashboard</span>
        <span className="hidden sm:inline text-foreground/40">Inspired by VS Code layout</span>
        <div className="ml-auto flex items-center gap-4">
          <Link href="/" className="hover:underline">Home</Link>
        </div>
      </div>

  {/* Main content area with three panels (independent column scroll) */}
  <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar */}
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

        {/* Feed Sidebar (33%) - Compact Feed List */}
        {/* Feed Sidebar (33%) - Live Reddit Posts Only */}
        <aside className="relative basis-1/3 min-w-[280px] max-w-[520px] border-r border-black/10 dark:border-white/10 flex flex-col min-h-0 bg-background overflow-hidden">
          <header className="absolute top-0 inset-x-0 h-11 px-4 border-b border-black/10 dark:border-white/10 text-sm font-medium tracking-wide flex items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70 z-10">
            <span>Live Reddit Feed 📡</span>
          </header>
          <div className="flex-1 overflow-auto pt-14 pb-4">
            <LiveFeedWaterfall />
          </div>
        </aside>        {/* Main Panel - Live Reddit Feed Dashboard */}
        <main className="relative flex-1 flex flex-col min-h-0 bg-white/70 dark:bg-black/20 backdrop-blur supports-[backdrop-filter]:bg-white/40 dark:supports-[backdrop-filter]:bg-black/30 overflow-hidden">
          <header className="absolute top-0 inset-x-0 h-12 px-6 border-b border-black/10 dark:border-white/10 flex items-center justify-between bg-white/85 dark:bg-black/40 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-black/55 z-10">
            <h1 className="text-base font-semibold tracking-tight">Live Reddit Feed 📡</h1>
            <div className="flex gap-2">
              <Link href="/reddit-test" className="text-xs px-3 py-1.5 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 transition-colors">Test API</Link>
              <Link href="/" className="text-xs px-3 py-1.5 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 transition-colors">Home</Link>
            </div>
          </header>
          <div className="flex-1 overflow-auto pt-16 pb-4">
            <div className="px-6 pb-4">
              <LiveFeedControls />
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="h-10 shrink-0 flex items-center justify-between px-4 text-xs border-t border-black/10 dark:border-white/10 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/40">
        <div className="flex items-center gap-4 text-foreground/60">
          <span>Status: Ready</span>
          <span className="hidden sm:inline">v0.1.0</span>
        </div>
        <div className="flex items-center gap-3 text-foreground/50">
          <a href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</a>
          <a href="https://nextjs.org" target="_blank" rel="noreferrer noopener" className="hover:text-foreground transition-colors">Next.js</a>
        </div>
      </footer>
    </div>
  );
}
