// WATERFALL NARRATION
// /Users/matthewsimon/Projects/SMNB/smnb/components/host/WaterfallNarration.tsx

/**
 * Waterfall Narration Display Component
 * 
 * Simple cascading text display where new content appears at the top
 * and older content flows down with fading opacity
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { useHostAgentStore } from '@/lib/stores/host/hostAgentStore';
import { HostNarration } from '@/lib/types/hostAgent';
import { Response } from '@/components/ai/response';
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
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Get streaming state from the store
  const { 
    isStreaming, 
    streamingText, 
    currentNarration
  } = useHostAgentStore();
  
  // Auto-scroll to bottom when new content appears
  useEffect(() => {
    if (scrollRef.current && streamingText) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [streamingText]);
  
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
    <div className={`flex flex-col h-full p-0 ${className}`}>
      {/* Scrollable content area - hidden scrollbar, content pushes down */}
      <div 
        ref={scrollRef} 
        className={`flex-1 min-h-0 overflow-y-auto ${styles.hiddenScrollbar}`}
      >
        {/* Current streaming text */}
        {isStreaming && isActive && streamingText && (
          <div className={`${styles.currentNarration} bg-blue-500/10 rounded-lg mb-6`}>
            <div className="text-foreground leading-relaxed text-base">
              <Response parseIncompleteMarkdown={true}>
                {streamingText}
              </Response>
              <span className={styles.cursor} />
            </div>
          </div>
        )}

        {/* Empty state - removed */}
      </div>
    </div>
  );
});

WaterfallNarration.displayName = 'WaterfallNarration';

export default WaterfallNarration;
