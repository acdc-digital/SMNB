// DASHBOARD LAYOUT
// /Users/matthewsimon/Projects/SMNB/smnb/app/dashboard/layout.tsx

'use client';

import React from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { NavigationButtons } from "@/components/ui/NavigationButtons";
import { TokenCounter } from "@/components/ui/TokenCounter";
import ActivityBar from "./activityBar/ActivityBar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex flex-col h-screen font-sans overflow-hidden">
      {/* Top thin border / bar */}
      <div className="w-full h-6 flex items-center gap-3 px-4 text-xs tracking-wide uppercase text-foreground/60 border-b border-black/10 dark:border-white/10 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
        <span className="font-medium">SMNB Dashboard</span>
        <span className="hidden sm:inline text-foreground/40">Inspired by VS Code layout</span>
        <div className="ml-auto flex items-center gap-2">
          <NavigationButtons />
          <ThemeToggle />
          <Link href="/" className="hover:underline">Home</Link>
        </div>
      </div>

      {/* Main content area with three panels (independent column scroll) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar */}
        <ActivityBar />
        
        {/* Main content area */}
        <div className="flex flex-1 overflow-hidden">
          {children}
        </div>
      </div>

      {/* Footer */}
      <footer className="h-10 shrink-0 flex items-center justify-between px-4 text-xs border-t border-black/10 dark:border-white/10 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/40">
        <div className="flex items-center gap-4 text-foreground/60">
          <span>Status: Ready</span>
          <span className="hidden sm:inline">v0.1.0</span>
          <TokenCounter className="hidden md:flex" />
        </div>
        <div className="flex items-center gap-3 text-foreground/50">
          <a href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</a>
          <a href="https://nextjs.org" target="_blank" rel="noreferrer noopener" className="hover:text-foreground transition-colors">Next.js</a>
        </div>
      </footer>
    </div>
  );
}
