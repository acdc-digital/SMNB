// DASHBOARD LAYOUT
// /Users/matthewsimon/Projects/SMNB/smnb/app/dashboard/layout.tsx

'use client';

import React from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { TokenCounter } from "@/components/ui/TokenCounter";
import { ApiKeyInput } from "@/components/ui/ApiKeyInput";
import ActivityBar from "./activityBar/ActivityBar";
import { Fingerprint } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex flex-col h-screen font-sf text-xs overflow-hidden">
      {/* Top thin border / bar */}
      <div className="w-full h-10 flex items-center gap-3 px-3 text-foreground/60 border-b border-black/10 dark:border-white/10 bg-[#181818]">
        <Fingerprint className="h-5.25 w-5.25 text-[#858585] border-1 border-[#858585] rounded-xs p-0.5" />
        <span className="text-[#858585] font-light text-base font-sans">SMNB Terminal</span>
        <div className="w-2 h-2 rounded-full bg-green-600"></div>
        
        <div className="ml-auto flex items-center gap-4">
          <ApiKeyInput compact />
          <ThemeToggle />
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
      <footer className="h-[32px] shrink-0 flex items-center justify-between px-4 text-xs border-t border-black/10 dark:border-white/10 bg-[#181818]">
        <div className="flex items-center gap-2 text-foreground/90">
          <span>© built by ACDC.digital</span>
        </div>
        <div className="flex items-center gap-4 text-foreground/50">
          <span>Status: <span className="text-green-500">Ready</span></span>
          <span className="hidden sm:inline">v0.1.0</span>
          <TokenCounter className="hidden md:flex" />
        </div>
      </footer>
    </div>
  );
}
