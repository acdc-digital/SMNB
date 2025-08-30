'use client';

import { useEffect, useRef, useState } from 'react';
import { useLiveFeedStore } from '@/lib/stores/liveFeedStore';
import { liveFeedService } from '@/lib/services/liveFeedService';
import styles from './LiveFeed.module.css';
// Using plain elements here for a clean, professional look and to avoid
// framer-motion type complexities in this module.
import type { LiveFeedPost } from '@/lib/stores/liveFeedStore';

interface LiveFeedPostProps {
  post: import('@/lib/stores/liveFeedStore').LiveFeedPost;
}

function LiveFeedPost({ post }: LiveFeedPostProps) {
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
    if (source.includes('rising')) return 'bg-orange-100 text-orange-800';
    if (source.includes('trending')) return 'bg-red-100 text-red-800';
    if (source.includes('hot')) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`border rounded-lg p-3 mb-2 bg-white shadow-sm hover:shadow-md transition-all duration-300 text-xs border-gray-200`}>
      <div className="flex items-start gap-2">
        {/* Upvote section */}
        <div className="flex flex-col items-center text-xs text-gray-500 min-w-[35px]">
          <div className="text-orange-500">↑</div>
          <div className="font-semibold text-xs">{formatNumber(post.score)}</div>
        </div>

        {/* Post content */}
        <div className="flex-1 min-w-0">
          {/* Post title with link */}
          <h3 className={`font-semibold text-xs mb-1 hover:text-blue-600 ${styles.lineClamp2}`}>
            <a 
              href={`https://reddit.com${post.permalink}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {post.title}
            </a>
          </h3>

          {/* Post metadata */}
          <div className="flex flex-wrap gap-1 text-xs text-gray-500 mb-1">
            <span className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs">
              r/{post.subreddit}
            </span>
            <span className={`px-1 py-0.5 rounded text-xs ${getSourceColor(post.source)}`}>
              {post.source.split('/')[1] || post.source}
            </span>
            <span>{formatTimeAgo(post.created_utc)}</span>
            {/* intentionally no flashing/new badge for a cleaner, professional look */}
          </div>

          {/* Post preview text */}
          {post.selftext && post.selftext.length > 0 && (
            <p className={`text-gray-700 text-xs mb-1 ${styles.lineClamp2}`}>
              {post.selftext.slice(0, 80)}
              {post.selftext.length > 80 && '...'}
            </p>
          )}
        </div>

        {/* Small thumbnail */}
        {post.thumbnail && 
         post.thumbnail !== 'self' && 
         post.thumbnail !== 'default' && 
         post.thumbnail.startsWith('http') && (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={post.thumbnail} 
            alt="Post thumbnail"
            className="w-8 h-8 object-cover rounded flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
      </div>
  </div>
  );
}

export default function LiveFeedPosts() {
  const { posts, isLive, isLoading, error, addPosts, setError, setLoading, selectedSubreddits, refreshInterval, updateStats } = useLiveFeedStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevPostsLengthRef = useRef(posts.length);
  // local queue to insert items one-by-one for smooth animation
  const [displayPosts, setDisplayPosts] = useState<typeof posts>([]);
  const pendingQueueRef = useRef<typeof posts>([]);
  const inserterIntervalRef = useRef<number | null>(null);

  // Handle smooth scrolling when new posts are added
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const currentLength = posts.length;
    const prevLength = prevPostsLengthRef.current;

    // If new posts were added and we're near the top, maintain scroll position
    if (currentLength > prevLength && container.scrollTop < 100) {
      container.classList.add(styles.liveFeedContainer);
    }

    prevPostsLengthRef.current = currentLength;
  }, [posts.length]);

  // When global posts change, enqueue diffs into pendingQueueRef and start an inserter
  useEffect(() => {
    // Determine new items by id not in displayPosts
    const existingIds = new Set(displayPosts.map(p => p.id + '_' + p.addedAt));
    const newItems = posts.filter(p => !existingIds.has(p.id + '_' + p.addedAt));

    if (newItems.length === 0) return;

    // Prepend new items to queue (we'll insert them one by one at top)
    pendingQueueRef.current = [...newItems, ...pendingQueueRef.current];

    // If inserter already running, leave it
    if (inserterIntervalRef.current) return;

    // Insert items one by one every 180ms (smooth steady pace)
    const id = window.setInterval(() => {
      const next = pendingQueueRef.current.shift();
      if (!next) {
        if (inserterIntervalRef.current) {
          window.clearInterval(inserterIntervalRef.current);
          inserterIntervalRef.current = null;
        }
        return;
      }

      setDisplayPosts(prev => {
        // Prepend and limit to maxPosts from store
        const combined = [next, ...prev];
        const max = 50; // keep a reasonable display cap (UI still shows state.posts slice)
        return combined.slice(0, max);
      });
    }, 180);

    inserterIntervalRef.current = id;

    return () => {
      if (inserterIntervalRef.current) {
        window.clearInterval(inserterIntervalRef.current);
        inserterIntervalRef.current = null;
      }
    };
  }, [posts, displayPosts]);

  // Keep displayPosts seeded with initial posts on mount / when posts emptied
  useEffect(() => {
    if (posts.length === 0) setDisplayPosts([]);
    // If displayPosts is empty but store has posts (initial load), seed them instantly
    if (displayPosts.length === 0 && posts.length > 0) {
      setDisplayPosts(posts.slice(0, 50));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts]);

  // Handle live feed service
  useEffect(() => {
    if (isLive && selectedSubreddits.length > 0) {
      // liveFeedService expects a payload with { batch, candidates }
      // wrap store.addPosts to accept payload.batch for type safety
      const onNewPosts = (payload: { batch: LiveFeedPost[]; candidates: LiveFeedPost[] }) => {
        addPosts(payload.batch);
      };

      liveFeedService.start(
        onNewPosts,
        setError,
        setLoading,
        {
          subreddits: selectedSubreddits,
          intervalSeconds: refreshInterval,
        }
      );

      // Update stats periodically
      const statsInterval = setInterval(updateStats, 10000); // Every 10 seconds

      return () => {
        liveFeedService.stop();
        clearInterval(statsInterval);
      };
    } else {
      liveFeedService.stop();
    }
  }, [isLive, selectedSubreddits, refreshInterval, addPosts, setError, setLoading, updateStats]);

  return (
    <div className="p-2">
      {/* Loading indicator */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-2 py-1 rounded mb-2 text-center text-xs">
          <div className="flex items-center justify-center gap-1">
            <div className="animate-spin h-3 w-3 border border-blue-600 border-t-transparent rounded-full"></div>
            Fetching...
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-2 py-1 rounded mb-2 text-xs">
          ⚠️ {error}
        </div>
      )}

      {/* Feed */}
      <div 
        ref={scrollContainerRef}
        className={`max-h-screen overflow-y-auto ${styles.liveFeedContainer}`}
      >
        {displayPosts.length === 0 && !isLoading ? (
          <div className="text-center py-8 text-gray-500 text-xs">
            <div className="text-2xl mb-2">📭</div>
            <div className="mb-1">No posts yet</div>
            <div className="text-xs">Enable live feed to start!</div>
          </div>
        ) : (
          <>
            {displayPosts.map((post) => (
              <LiveFeedPost key={`${post.id}-${post.addedAt}`} post={post} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
