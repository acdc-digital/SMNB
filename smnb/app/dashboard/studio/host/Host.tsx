// HOST
// /Users/matthewsimon/Projects/SMNB/smnb/app/dashboard/studio/host/Host.tsx

/**
 * Host Column Component
 * 
 * Simplified display component that shows only the narration text output.
 * All controls have been moved to the Controls panel.
 * Uses shared host agent store for state management.
 */

'use client';

import React, { useEffect } from "react";
import { WaterfallNarration } from "@/components/host/WaterfallNarration";
import { useHostAgentStore } from "@/lib/stores/host/hostAgentStore";

export default function Host() {
  const { 
    isActive, 
    initializeHostAgent, 
    cleanup 
  } = useHostAgentStore();

  // Initialize host agent on mount
  useEffect(() => {
    initializeHostAgent();
    
    return () => {
      cleanup();
    };
  }, [initializeHostAgent, cleanup]);

  return (
    <div className="flex-1 bg-card border border-border rounded-lg shadow-sm flex flex-col min-h-0">
      {/* Simple Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎙️</span>
          <h3 className="font-semibold text-foreground">News Host</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className="text-xs text-muted-foreground">
            {isActive ? 'Broadcasting' : 'Standby'}
          </span>
        </div>
      </div>

      {/* Narration Display */}
      <div className="flex-1 flex flex-col min-h-0">
        <WaterfallNarration 
          isActive={isActive}
          className="flex-1 min-h-0"
        />
      </div>
    </div>
  );
}
