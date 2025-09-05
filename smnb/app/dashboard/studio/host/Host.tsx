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
    isStreaming,
    streamingText,
    currentNarration,
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
      return { text: 'Standby', color: 'bg-gray-300', textColor: 'text-muted-foreground' };
    }
    if (isStreaming) {
      return { text: 'Live', color: 'bg-red-500 animate-pulse', textColor: 'text-red-500' };
    }
    return { text: 'On Air', color: 'bg-orange-500', textColor: 'text-orange-500' };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="flex-1 bg-card border border-border rounded-lg shadow-sm flex flex-col min-h-0">
      {/* Enhanced Header with Streaming Status */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-foreground">News Host</h3>
        </div>

        {/* Right-side status indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusInfo.color}`}></div>
          <span className={`text-xs font-medium ${statusInfo.textColor}`}>
            {statusInfo.text}
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

      {/* Thin footer with quick indicators */}
      {currentNarration && isStreaming && (
        <div className="flex justify-between items-center px-4 py-1 text-xs text-muted-foreground bg-muted/30 border-t border-muted">
          <span>{streamingText.length} characters</span>
          <span>314 WPM</span>
        </div>
      )}
    </div>
  );
}
