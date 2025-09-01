/**
 * Waterfall Narration Display Component
 * 
 * Simple cascading text display where new content appears at the top
 * and older content flows down with fading opacity
 */

'use client';

import React, { useState, useEffect } from 'react';
import { HostNarration } from '@/lib/types/hostAgent';
import styles from './WaterfallNarration.module.css';

interface DisplaySegment {
  id: string;
  text: string;
  timestamp: Date;
  narrationId: string;
  tone: HostNarration['tone'];
  priority: HostNarration['priority'];
  age: number; // How many segments ago this was added
}

interface WaterfallNarrationProps {
  narration: HostNarration | null;
  isActive: boolean;
  speed?: number; // characters per second
  className?: string;
  maxSegments?: number; // Maximum number of segments to display
}

export const WaterfallNarration: React.FC<WaterfallNarrationProps> = ({
  narration,
  isActive,
  speed = 15,
  className = '',
  maxSegments = 8
}) => {
  const [segments, setSegments] = useState<DisplaySegment[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [charIndex, setCharIndex] = useState(0);

  const addSegment = React.useCallback((text: string, nar: HostNarration) => {
    const newSegment: DisplaySegment = {
      id: `${nar.id}-${Date.now()}`,
      text,
      timestamp: new Date(),
      narrationId: nar.id,
      tone: nar.tone,
      priority: nar.priority,
      age: 0
    };

    setSegments(prev => {
      // Age existing segments
      const agedSegments = prev.map(seg => ({
        ...seg,
        age: seg.age + 1
      }));

      // Add new segment at the top and limit total
      const newSegments = [newSegment, ...agedSegments];
      return newSegments.slice(0, maxSegments);
    });

    // Clear current text after adding to segments
    setCurrentText('');
    setCharIndex(0);
  }, [maxSegments]);

  // Handle new narration
  useEffect(() => {
    if (!narration || !isActive) {
      setCurrentText('');
      setCharIndex(0);
      return;
    }

    // Reset for new narration
    setCurrentText('');
    setCharIndex(0);

    // Start typing animation
    const interval = setInterval(() => {
      setCharIndex(prev => {
        if (prev >= narration.narrative.length) {
          clearInterval(interval);
          // When typing is complete, add the full text as a segment
          addSegment(narration.narrative, narration);
          return prev;
        }
        const newIndex = prev + 1;
        setCurrentText(narration.narrative.substring(0, newIndex));
        return newIndex;
      });
    }, 1000 / speed);

    return () => clearInterval(interval);
  }, [narration, isActive, speed, addSegment]);

  const getToneColor = (tone: HostNarration['tone']): string => {
    switch (tone) {
      case 'breaking': return 'text-red-400 border-red-500/30';
      case 'developing': return 'text-yellow-400 border-yellow-500/30';
      case 'analysis': return 'text-blue-400 border-blue-500/30';
      case 'opinion': return 'text-purple-400 border-purple-500/30';
      case 'human-interest': return 'text-green-400 border-green-500/30';
      default: return 'text-gray-400 border-gray-500/30';
    }
  };

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
    <div className={`waterfall-narration p-6 h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div 
              className={`w-3 h-3 rounded-full transition-all duration-500 ${
                isActive ? 'bg-red-500 shadow-lg shadow-red-500/50' : 'bg-gray-500'
              }`}
            />
            <span className="text-sm font-semibold">
              {isActive ? 'ON AIR' : 'STANDBY'}
            </span>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground">
          {segments.length} segments
        </div>
      </div>

      {/* Current typing text */}
      {currentText && isActive && (
        <div className={`${styles.currentNarration} bg-card/50 rounded-lg border border-border`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{getToneEmoji(narration?.tone || 'analysis')}</span>
            <span className="text-lg">{getPriorityEmoji(narration?.priority || 'low')}</span>
            <span className="text-sm text-muted-foreground">
              {narration?.tone} • {narration?.priority} priority
            </span>
          </div>
          <div className="text-foreground leading-relaxed">
            {currentText}
            <span className={styles.cursor} />
          </div>
        </div>
      )}

      {/* Cascaded segments */}
      <div className={styles.segmentsContainer}>
        {segments.map((segment) => (
          <div
            key={segment.id}
            className={`${styles.segment} ${styles[`age${segment.age}`]} ${getToneColor(segment.tone)}`}
          >
            <div className="flex items-center gap-2 mb-2 text-xs">
              <span>{getToneEmoji(segment.tone)}</span>
              <span>{getPriorityEmoji(segment.priority)}</span>
              <span className="text-muted-foreground">
                {segment.tone} • {segment.priority}
              </span>
              <span className="text-muted-foreground ml-auto">
                {segment.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <div className="text-sm leading-relaxed">
              {segment.text}
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {segments.length === 0 && !currentText && (
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

      {/* Progress indicator */}
      {narration && currentText && (
        <div className={styles.progressContainer}>
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>{charIndex} / {narration.narrative.length} characters</span>
            <span>{Math.ceil(narration.duration)}s estimated</span>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={`${styles.progressFill} transition-all duration-200`}
              style={{ width: `${(charIndex / narration.narrative.length) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WaterfallNarration;
