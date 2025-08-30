'use client';

import { useEffect, useRef, useState } from 'react';
import { useLiveFeedStore } from '@/lib/stores/liveFeedStore';
import { useLiveFeedWithConvex } from '@/hooks/useLiveFeedWithConvex';
// styles intentionally unused after recent UI polish

function WaterfallPost({ post }: { post: import('@/lib/stores/liveFeedStore').LiveFeedPost }) {
  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const getSourceColor = (source: string) => {
    if (source.includes('rising')) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (source.includes('trending')) return 'bg-red-100 text-red-800 border-red-200';
    if (source.includes('hot')) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div 
      className={`
        relative mb-4 bg-white rounded-lg shadow-sm border transition-all duration-500 ease-out
        border-gray-200 hover:shadow-md
      `}
    >
      {/* No flashing/green NEW badge per design preference */}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded font-medium">
              r/{post.subreddit}
            </span>
            <span className={`text-xs px-2 py-1 rounded border ${getSourceColor(post.source)}`}>
              {post.source.split('/')[1] || 'hot'}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <span className="text-orange-500 text-lg">↑</span>
              <span className="font-semibold">{formatNumber(post.score)}</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 mb-3 leading-snug hover:text-blue-600">
          <a 
            href={`https://reddit.com${post.permalink}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {post.title}
          </a>
        </h3>

        {/* Content Preview */}
        {post.selftext && post.selftext.length > 0 && (
          <p className="text-gray-700 text-sm mb-3 leading-relaxed">
            {post.selftext.length > 150 
              ? `${post.selftext.slice(0, 150)}...` 
              : post.selftext
            }
          </p>
        )}

        {/* Thumbnail */}
        {post.thumbnail && 
         post.thumbnail !== 'self' && 
         post.thumbnail !== 'default' && 
         post.thumbnail.startsWith('http') && (
          <div className="mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={post.thumbnail} 
              alt="Post thumbnail"
              className="w-full max-w-sm h-32 object-cover rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <span>u/{post.author}</span>
            <span>{formatTimeAgo(post.created_utc)}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <span>{formatNumber(post.num_comments)} 💬</span>
            <span>{Math.round(post.upvote_ratio * 100)}% upvoted</span>
            {post.over_18 && (
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded">18+</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LiveFeedWaterfall() {
  const {
    isLive,
    isLoading: storeLoading,
    error,
    refreshInterval,
    lastFetch,
  } = useLiveFeedStore();

  // Use the new hook that integrates Convex
  const { posts, isLoading: convexLoading, loadMore } = useLiveFeedWithConvex();
  
  // Combine loading states
  const isLoading = storeLoading || convexLoading;

  const containerRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [nextCountdownSec, setNextCountdownSec] = useState<number>(0);

  // Track user scrolling
  const latestBatchId = posts[0]?.batchId || lastFetch || Date.now();

  useEffect(() => {
  const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      isUserScrollingRef.current = true;
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Set timeout to detect when user stops scrolling
      scrollTimeoutRef.current = setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 1000);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Auto-scroll to top when new posts are prepended
  const prevLengthRef = useRef(posts.length);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (posts.length > prevLengthRef.current) {
      // Smoothly scroll to top so user sees latest batch
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }

    prevLengthRef.current = posts.length;
  }, [posts.length]);

  // Countdown for next batch — updates every second
  useEffect(() => {
    let mounted = true;
    let timer: NodeJS.Timeout | null = null;

    const computeAndSet = () => {
      const latestBatchMs = Number(posts[0]?.batchId || lastFetch || Date.now());
      const nextBatchMs = latestBatchMs + (refreshInterval || 30) * 1000;
      const secs = Math.max(0, Math.ceil((nextBatchMs - Date.now()) / 1000));
      if (mounted) setNextCountdownSec(secs);
    };

    // Initial compute
    computeAndSet();

    timer = setInterval(() => {
      computeAndSet();
    }, 1000);

    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
    // Depend on posts length and latestBatchId so effect resets when a new batch arrives
  }, [posts, posts.length, latestBatchId, refreshInterval, lastFetch]);

  // Infinite load when near bottom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      const threshold = 300; // pixels from bottom
      if (container.scrollHeight - container.scrollTop - container.clientHeight < threshold) {
        loadMore(50);
      }
    };

    container.addEventListener('scroll', onScroll);
    return () => container.removeEventListener('scroll', onScroll);
  }, [loadMore]);

  // Auto-scroll to top when new posts arrive (only if user isn't scrolling)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isUserScrollingRef.current) return;

    // Only auto-scroll if user is near the top (within 200px)
    if (container.scrollTop <= 200) {
      container.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [posts.length]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Status Bar */}
      <div className="flex-none p-3 bg-white border-b border-gray-200">
        {isLoading && (
          <div className="flex items-center gap-2 text-blue-600 text-sm">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            Fetching new batch of posts...
          </div>
        )}
        
        {error && (
          <div className="text-red-600 text-sm flex items-center gap-2">
            <span>⚠️</span>
            {error}
          </div>
        )}

        {!isLoading && !error && isLive && (
          <div className="text-green-600 text-sm flex items-center gap-2">
            <span className="animate-pulse">🟢</span>
            Live feed active - Latest batch: {posts.length} posts
          </div>
        )}

        {!isLoading && !error && !isLive && (
          <div className="text-gray-500 text-sm flex items-center gap-2">
            <span>⚪</span>
            Feed paused - Current batch: {posts.length} posts
          </div>
        )}
      </div>

      {/* Waterfall Feed */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4"
      >
        {posts.length === 0 && !isLoading ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-6xl mb-4">🌊</div>
            <div className="text-xl mb-2">Ready for the waterfall</div>
            <div className="text-sm opacity-75">Enable the live feed to start the flow of content!</div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            {/* Batch Header */}
            {posts.length > 0 && (() => {
              const latestBatchMs = Number(posts[0]?.batchId || lastFetch || Date.now());
              const nextBatchMs = latestBatchMs + (refreshInterval || 30) * 1000;
              return (
                <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-700 font-medium">
                    Latest Batch: {new Date(latestBatchMs).toLocaleTimeString()}
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="text-sm text-blue-600">
                      Next Batch: {new Date(nextBatchMs).toLocaleTimeString()}
                    </div>
                    <div className="text-sm text-blue-500 font-mono">
                      {nextCountdownSec > 0 ? `${nextCountdownSec}s` : 'Now'}
                    </div>
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {posts.length} posts • Sorted by Reddit recency within batch
                  </div>
                </div>
              );
            })()}
            
            {posts.map((post) => (
              <WaterfallPost key={`${post.id}-${post.addedAt}`} post={post} />
            ))}
            
            {/* Batch Footer */}
            {posts.length >= 25 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                <div className="border-t border-gray-200 pt-4">
                  � End of current batch • Next update in {30 - Math.floor((Date.now() - (posts[0]?.addedAt || 0)) / 1000)}s
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
