// LIVE FEED - STORY DISPLAY
// /Users/matthewsimon/Projects/SMNB/smnb/components/livefeed/liveFeed.tsx

'use client';

import { useEffect, useState } from 'react';
import React from 'react';
import { useSimpleLiveFeedStore } from '@/lib/stores/livefeed/simpleLiveFeedStore';
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
  } = useSimpleLiveFeedStore();

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
        <div className="text-sm font-light text-muted-foreground">
          Live Stories {storyHistory.length > 0 ? `(${storyHistory.length})` : ''}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearStoryHistory}
            title="Clear Stories"
            className="p-1 hover:bg-[#2d2d2d] rounded transition-colors border border-[#454545] text-[#454545] cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      
      {/* Scrollable Stories Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 px-2 pt-2">
          {storyHistory.length === 0 ? (
            <div 
              className={`text-center py-8 text-muted-foreground ${
                reducedMotion ? '' : 'animate-fade-in'
              }`}
            >
              <div className="text-4xl mb-4">📚</div>
              <div className="text-lg font-medium mb-2">No stories yet</div>
              <div className="text-sm">Published stories from the Host/Editor will appear here</div>
            </div>
          ) : (
            <div className="space-y-3">
              {storyHistory.map((story, index) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  isFirst={false}
                  showActions={false}
                  className={reducedMotion ? '' : 'animate-slide-in-top'}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}