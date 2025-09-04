// WATERFALL NARRATION
// /Users/matthewsimon/Projects/SMNB/smnb/components/host/WaterfallNarration.tsx

/**
 * Waterfall Narration Display Component
 * 
 * Simple cascading text display where new content appears at the top
 * and older content flows down with fading opacity
 */

'use client';

import React from 'react';
import { useHostAgentStore } from '@/lib/stores/host/hostAgentStore';
import { HostNarration } from '@/lib/types/hostAgent';
import styles from './WaterfallNarration.module.css';

interface WaterfallNarrationProps {
  isActive?: boolean;
  maxHistory?: number;
  className?: string;
  speed?: number; // Kept for compatibility but not used in streaming mode
}

export const WaterfallNarration: React.FC<WaterfallNarrationProps> = React.memo(({
  isActive = true,
  className = ''
}) => {
  // Get streaming state from the store
  const { 
    isStreaming, 
    streamingText, 
    currentNarration
  } = useHostAgentStore();
  
  const getToneEmoji = (tone: HostNarration['tone']): string => {
    switch (tone) {
      case 'breaking': return '🚨';
      case 'developing': return '📈';
      case 'analysis': return '🧠';
      case 'opinion': return '💭';
      case 'human-interest': return '❤️';
      default: return '📰';
    }
  };

  const getPriorityEmoji = (priority: HostNarration['priority']): string => {
    switch (priority) {
      case 'high': return '🔥';
      case 'medium': return '⭐';
      case 'low': return '📝';
      default: return '📝';
    }
  };

  return (
    <div className={`flex flex-col h-full p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div 
              className={`w-3 h-3 rounded-full transition-all duration-500 ${
                isActive && isStreaming ? 'bg-red-500 shadow-lg shadow-red-500/50' : 
                isActive ? 'bg-orange-500' : 'bg-gray-500'
              }`}
            />
            <span className="text-sm font-semibold">
              {isActive ? (isStreaming ? 'STREAMING' : 'ON AIR') : 'STANDBY'}
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Current streaming text */}
        {isStreaming && isActive && (
          <div className={`${styles.currentNarration} bg-blue-500/10 border-blue-500/50 rounded-lg border-2 p-4 mb-6 shadow-lg`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">LIVE</span>
              </div>
              <span className="text-lg">{getToneEmoji(currentNarration?.tone || 'analysis')}</span>
              <span className="text-lg">{getPriorityEmoji(currentNarration?.priority || 'low')}</span>
              <span className="text-sm text-muted-foreground">
                {currentNarration?.tone} • {currentNarration?.priority} priority
              </span>
            </div>
            <div className="text-foreground leading-relaxed text-base">
              {streamingText || 'Starting narration...'}
              <span className={styles.cursor} />
            </div>
          </div>
        )}

        {/* Empty state */}
        {!streamingText && (
          <div className={styles.emptyState}>
            <div className="text-4xl mb-4">🎙️</div>
            <div className="text-lg font-medium mb-2">
              {isActive ? 'Waiting for news...' : 'Host agent offline'}
            </div>
            <div className="text-sm">
              {isActive ? 'New stories will appear here' : 'Start the host to begin broadcasting'}
            </div>
          </div>
        )}
      </div>

      {/* Progress indicator - fixed at bottom */}
      {currentNarration && isStreaming && (
        <div className={`${styles.progressContainer} flex-shrink-0 mt-6 pt-4 border-t border-border`}>
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>{streamingText.length} characters streamed</span>
            <span>Live streaming...</span>
          </div>
          <div className={styles.progressBar}>
            <div className={`${styles.progressFill} bg-blue-500 h-1 rounded-full animate-pulse`} />
          </div>
        </div>
      )}
    </div>
  );
});

WaterfallNarration.displayName = 'WaterfallNarration';

export default WaterfallNarration;
