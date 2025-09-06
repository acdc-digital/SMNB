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
import { Settings } from 'lucide-react';

export default function Host() {
  const { 
    isActive, 
    isStreaming,
    streamingText,
    currentNarration,
    nextStoryCountdown,
    isGenerating,
    stats,
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

  // Get current status text and styling
  const getStatusInfo = () => {
    if (!isActive) {
      return { text: 'Offline', color: 'bg-white border border-gray-300', textColor: 'text-muted-foreground' };
    }
    if (isStreaming) {
      return { text: 'Live', color: 'bg-red-500 animate-pulse', textColor: 'text-red-500' };
    }
    // Stay "On Air" for the full countdown period
    return { text: 'On Air', color: 'bg-orange-500', textColor: 'text-orange-500' };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="flex-1 bg-card border border-border rounded-xs shadow-sm flex flex-col min-h-0">
      {/* Enhanced Header with Streaming Status */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          {/* Next story countdown */}
          <span className="text-xs text-muted-foreground">
            Next: {!isActive ? '-' : isStreaming ? 0 : nextStoryCountdown}s
          </span>
        </div>

        {/* Right-side status indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusInfo.color}`}></div>
          <span className={`text-xs font-medium ${statusInfo.textColor}`}>
            {statusInfo.text}
          </span>
          <button
            title="Host Settings"
            className="p-1 hover:bg-[#2d2d2d] rounded transition-colors border text-muted-foreground cursor-pointer"
          >
            <Settings className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Narration Display */}
      <div className="flex-1 flex flex-col min-h-0">
        <WaterfallNarration 
          isActive={isActive}
          className="flex-1 min-h-0"
        />
      </div>

      {/* Status footer - always visible */}
      <div className="flex items-center px-4 py-1 text-xs bg-muted/30 border-t border-muted">
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">
            Queue: {stats.queueLength}
          </span>
          <span className="text-muted-foreground">
            Characters: {streamingText.length}
          </span>
        </div>
      </div>
    </div>
  );
}
