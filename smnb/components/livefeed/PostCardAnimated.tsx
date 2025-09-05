// POST CARD ANIMATED
// /Users/matthewsimon/Projects/SMNB/smnb/components/livefeed/PostCardAnimated.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { LiveFeedPost } from '@/lib/stores/livefeed/simpleLiveFeedStore';

interface PostCardAnimatedProps {
  post: LiveFeedPost;
  isNew?: boolean;
  reducedMotion?: boolean;
}

export function PostCardAnimated({ post, isNew, reducedMotion }: PostCardAnimatedProps) {
  const [shouldAnimate, setShouldAnimate] = useState(isNew && !reducedMotion);
  
  useEffect(() => {
    if (isNew && !reducedMotion) {
      setShouldAnimate(true);
      
      // Remove animation class after animation completes
      const timer = setTimeout(() => {
        setShouldAnimate(false);
      }, 600);
      
      return () => clearTimeout(timer);
    }
  }, [isNew, reducedMotion]);

  const animationStyles = shouldAnimate ? {
    animation: 'slideInFromTop 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'
  } : {};

  return (
    <div>
      <style jsx>{`
        @keyframes slideInFromTop {
          0% {
            opacity: 0;
            transform: translateY(-30px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
      
      <div
        className="bg-card border border-border p-4 rounded-lg shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-lg will-change-transform"
        style={animationStyles}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground truncate">
                {post.title}
              </h3>
              
              {/* Story Thread Update Badge */}
              {post.updateBadge && post.updateBadge.isVisible && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  post.updateBadge.type === 'breaking' ? 'bg-red-500 text-white' :
                  post.updateBadge.type === 'follow_up' ? 'bg-blue-500 text-white' :
                  post.updateBadge.type === 'correction' ? 'bg-yellow-500 text-white' :
                  'bg-orange-500 text-white'
                }`}>
                  {post.updateBadge.text}
                </span>
              )}
              
              {/* Enhanced indicators */}
              {post.priority_score && post.priority_score > 0.7 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                  ⭐ High Priority
                </span>
              )}
              {post.sentiment === 'positive' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                  😊 Positive
                </span>
              )}
              {post.sentiment === 'negative' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                  😞 Critical
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>r/{post.subreddit}</span>
              <span>👤 {post.author}</span>
              <span>📊 {post.score} pts</span>
              <span>💬 {post.num_comments}</span>
              {post.categories && post.categories.length > 0 && (
                <span>🏷️ {post.categories.slice(0, 2).join(', ')}</span>
              )}
              {post.threadTopic && (
                <span className="text-purple-600 dark:text-purple-400">
                  🧵 {post.threadTopic}
                </span>
              )}
            </div>
            {post.selftext && post.selftext.length > 0 && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {post.selftext.substring(0, 200)}
                {post.selftext.length > 200 ? '...' : ''}
              </p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0">
            <a
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95"
            >
              View →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
