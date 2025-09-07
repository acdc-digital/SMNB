// LIVE FEED - STORY DISPLAY
// /Users/matthewsimon/Projects/SMNB/smnb/components/livefeed/liveFeed.tsx

'use client';

import { useEffect, useState } from 'react';
import React from 'react';
import { useSimpleLiveFeedStore, CompletedStory } from '@/lib/stores/livefeed/simpleLiveFeedStore';
import { Trash2 } from 'lucide-react';
import StoryCard from './StoryCard';

interface LiveFeedProps {
  className?: string;
}

export default function LiveFeed({ className }: LiveFeedProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  const {
    storyHistory,
    clearStoryHistory,
    loadStoriesFromConvex,
    pinStory,
    unpinStory,
    removeStory,
  } = useSimpleLiveFeedStore();

  // Sort stories with pinned ones first
  const sortedStories = React.useMemo(() => {
    return [...storyHistory].sort((a, b) => {
      // Pinned stories first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // If both pinned, sort by pinnedOrder
      if (a.isPinned && b.isPinned) {
        return (a.pinnedOrder || 0) - (b.pinnedOrder || 0);
      }
      
      // For unpinned stories, maintain original order (newest first)
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, [storyHistory]);

  // Handle story actions
  const handleStoryAction = (action: 'read' | 'share' | 'bookmark' | 'pin' | 'unpin' | 'remove', story: CompletedStory) => {
    switch (action) {
      case 'pin':
        pinStory(story.id);
        break;
      case 'unpin':
        unpinStory(story.id);
        break;
      case 'remove':
        removeStory(story.id);
        break;
      case 'read':
      case 'share':
      case 'bookmark':
        // These actions can be handled later if needed
        console.log(`${action} action for story:`, story.id);
        break;
    }
  };

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Load stories from Convex on mount
  useEffect(() => {
    console.log('📚 Loading stories from Convex for live feed display');
    loadStoriesFromConvex();
  }, [loadStoriesFromConvex]);

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-[#191919] backdrop-blur-sm border-b border-border/20 flex items-center justify-between px-4 py-2">
        <div className="text-sm font-light text-muted-foreground font-sans">
          Live Stories {sortedStories.length > 0 ? `(${sortedStories.length})` : ''}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearStoryHistory}
            title="Clear Stories"
            className="p-1 hover:bg-[#2d2d2d] rounded transition-colors border border-muted-foreground/70 text-muted-foreground/70 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      
      {/* Scrollable Stories Container */}
      <div className="flex-1 overflow-y-auto relative">
        {/* Absolute positioned background text */}
        <div className="absolute top-2 left-3 pointer-events-none z-0">
          <p className="text-gray-500 dark:text-slate-500/20 font-work-sans font-semibold text-7xl break-words leading-tight">
            Demo-
            cratizing AI.
          </p>
        </div>
        
        <div className="space-y-4 px-2 pt-2 relative z-10">
          <div className="space-y-3">
            {sortedStories.map((story, index) => (
              <StoryCard
                key={story.id}
                story={story}
                isFirst={false}
                showActions={true}
                onAction={handleStoryAction}
                className={reducedMotion ? '' : 'animate-slide-in-top'}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}