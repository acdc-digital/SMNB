'use client';

import { useEffect, useRef } from 'react';
import { useLiveFeedStore } from '@/lib/stores/liveFeedStore';
import { liveFeedService } from '@/lib/services/liveFeedService';
import LiveFeedControls from './LiveFeedControls';
import styles from './LiveFeed.module.css';

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
    <div 
  className={`border rounded-lg p-4 mb-3 bg-white shadow-sm hover:shadow-md transition-all duration-300 border-gray-200`}
    >
      <div className="flex items-start gap-3">
        {/* Upvote section */}
        <div className="flex flex-col items-center text-sm text-gray-500 min-w-[50px]">
          <div className="text-orange-500 text-lg">↑</div>
          <div className="font-semibold">{formatNumber(post.score)}</div>
          <div className="text-xs">{Math.round(post.upvote_ratio * 100)}%</div>
        </div>

        {/* Post content */}
        <div className="flex-1 min-w-0">
          {/* Post title with link */}
          <h3 className={`font-semibold text-sm sm:text-base mb-2 hover:text-blue-600 ${styles.lineClamp2}`}>
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
          <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-gray-500 mb-2">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              r/{post.subreddit}
            </span>
            <span className={`px-2 py-1 rounded-full ${getSourceColor(post.source)}`}>
              {post.source}
            </span>
            <span>u/{post.author}</span>
            <span>{formatTimeAgo(post.created_utc)}</span>
            <span>{formatNumber(post.num_comments)} 💬</span>
            {/* NEW badge removed for a cleaner appearance */}
          </div>

          {/* Post preview text */}
          {post.selftext && post.selftext.length > 0 && (
            <p className={`text-gray-700 text-xs sm:text-sm mb-2 ${styles.lineClamp2}`}>
              {post.selftext.slice(0, 120)}
              {post.selftext.length > 120 && '...'}
            </p>
          )}

          {/* Domain and media info */}
          <div className="flex gap-2 text-xs text-gray-400">
            <span>{post.domain}</span>
            {post.is_video && <span className="bg-gray-100 px-2 py-1 rounded">🎥</span>}
            {post.over_18 && <span className="bg-red-100 text-red-800 px-2 py-1 rounded">18+</span>}
          </div>
        </div>

        {/* Thumbnail */}
        {post.thumbnail && 
         post.thumbnail !== 'self' && 
         post.thumbnail !== 'default' && 
         post.thumbnail.startsWith('http') && (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={post.thumbnail} 
            alt="Post thumbnail"
            className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
      </div>
    </div>
  );
}

interface LiveFeedProps {
  controlsOnly?: boolean;
  postsOnly?: boolean;
}

export default function LiveFeed({ controlsOnly = false, postsOnly = false }: LiveFeedProps) {
  const {
    posts,
    isLive,
    isLoading,
    error,
    selectedSubreddits,
    refreshInterval,
    totalPostsFetched,
    postsPerMinute,
    contentMode,
    addPosts,
    addSinglePost,
    setLoading,
    setError,
    updateStats,
  } = useLiveFeedStore();

  console.log('📊 LiveFeed render - posts count:', posts.length, 'contentMode:', contentMode);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevPostsLengthRef = useRef(posts.length);

  // Handle smooth scrolling when new posts are added
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const currentLength = posts.length;
    const prevLength = prevPostsLengthRef.current;

    // If new posts were added and we're near the top, maintain scroll position
    if (currentLength > prevLength && container.scrollTop < 100) {
      // Add smooth scroll class temporarily
      container.classList.add(styles.liveFeedContainer);
      
      // Reset scroll behavior after a brief moment
      setTimeout(() => {
        if (container && container.classList.contains(styles.liveFeedContainer)) {
          // Keep the smooth scroll class as it's part of the container
        }
      }, 1000);
    }

    prevPostsLengthRef.current = currentLength;
  }, [posts.length]);

  // Handle live feed service
  useEffect(() => {
    if (isLive && selectedSubreddits.length > 0) {
      liveFeedService.start(
        // Handle posts from queue agent (individual posts) or initial batch
        (payload: { batch: import('@/lib/stores/liveFeedStore').LiveFeedPost[]; candidates: import('@/lib/stores/liveFeedStore').LiveFeedPost[] }) => {
          if (payload.batch.length === 1) {
            // Single post from queue agent
            addSinglePost(payload.batch[0]);
          } else if (payload.batch.length > 1) {
            // Initial batch load
            addPosts(payload.batch);
          }
          // Empty batch means queue agent is processing candidates
        },
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
  }, [isLive, selectedSubreddits, refreshInterval, addPosts, addSinglePost, setError, setLoading, updateStats]);

  return (
    <div className="px-4">
      {!postsOnly && (
        <LiveFeedControls />
      )}

      {!controlsOnly && (
        <>
          {/* Stats */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4 grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="font-semibold text-blue-600">{posts.length}</div>
              <div className="text-gray-500">Posts</div>
            </div>
            <div>
              <div className="font-semibold text-green-600">{totalPostsFetched}</div>
              <div className="text-gray-500">Fetched</div>
            </div>
            <div>
              <div className="font-semibold text-purple-600">{postsPerMinute}</div>
              <div className="text-gray-500">Per Min</div>
            </div>
          </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded mb-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            Fetching latest posts...
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          ⚠️ {error}
        </div>
      )}

      {/* Feed */}
      <div 
        ref={scrollContainerRef}
        className={`max-h-screen overflow-y-auto ${styles.liveFeedContainer}`}
      >
        {posts.length === 0 && !isLoading ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">📭</div>
            <div className="text-lg mb-2">No posts yet</div>
            <div className="text-sm">Turn on the live feed to start aggregating content!</div>
          </div>
        ) : (
          posts
            .filter(post => {
              const shouldShow = contentMode === 'nsfw' ? post.over_18 : !post.over_18;
              if (!shouldShow) {
                console.log(`🚫 Filtering out post (${contentMode} mode): ${post.title.substring(0, 30)}... (NSFW: ${post.over_18})`);
              }
              return shouldShow;
            })
            .map((post) => (
              <LiveFeedPost key={`${post.id}-${post.addedAt}`} post={post} />
            ))
        )}
      </div>
        </>
      )}
    </div>
  );
}
