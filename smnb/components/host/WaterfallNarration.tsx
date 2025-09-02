/**
 * Waterfall Narration Display Component
 * 
 * Simple cascading text display where new content appears at the top
 * and older content flows down with fading opacity
 */

'use client';

import React, { useMemo } from 'react';
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
    streamingNarrationId, 
    narrationHistory, 
    clearNarrationHistory,
    currentNarration
  } = useHostAgentStore();

  // Memoize filtered history to prevent re-filtering on every character
  const filteredHistory = useMemo(() => {
    return narrationHistory.filter((historyNarration: HostNarration) => 
      !streamingNarrationId || historyNarration.id !== streamingNarrationId
    );
  }, [narrationHistory, streamingNarrationId]);
  
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
        
        <div className="text-xs text-muted-foreground">
          {narrationHistory.length} narrations
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

        {/* Historical narrations */}
        {filteredHistory.length > 0 && (
          <div className="mt-8 pt-4 border-t border-border/30">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">History</span>
              <div className="flex-1 h-px bg-border/20"></div>
            </div>
            <div className="space-y-3">
              {filteredHistory.map((narration: HostNarration, index: number) => (
                  <div
                    key={`${narration.id}-${index}`}
                    className={`${styles.historyItem} p-3 rounded-lg border transition-all duration-500 ${
                      index === 0 ? 'opacity-90 border-gray-500/20 bg-gray-500/5' :
                      index === 1 ? 'opacity-75 border-gray-500/15 bg-gray-500/3' :
                      index === 2 ? 'opacity-60 border-gray-500/10 bg-gray-500/2' :
                      'opacity-45 border-gray-500/5 bg-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2 text-xs">
                      <span>{getToneEmoji(narration.tone)}</span>
                      <span>{getPriorityEmoji(narration.priority)}</span>
                      <span className="text-muted-foreground">
                        {narration.tone} • {narration.priority}
                      </span>
                      <span className="text-muted-foreground ml-auto">
                        {narration.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm leading-relaxed text-muted-foreground">
                      {narration.narrative}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {filteredHistory.length === 0 && !streamingText && (
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

        {/* Clear history button */}
        {filteredHistory.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border/30">
            <button
              onClick={clearNarrationHistory}
              className="px-3 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors cursor-pointer"
            >
              🗑️ Clear History ({narrationHistory.length})
            </button>
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
