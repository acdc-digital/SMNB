'use client';

import { useEffect, useRef } from 'react';
import { useLiveFeedStore } from '@/lib/stores/liveFeedStore';
import { liveFeedService } from '@/lib/services/liveFeedService';

function TVPost({ post }: { post: import('@/lib/stores/liveFeedStore').LiveFeedPost }) {
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
    if (source.includes('rising')) return 'bg-orange-500';
    if (source.includes('trending')) return 'bg-red-500';
    if (source.includes('hot')) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-lg overflow-hidden border">
      {/* Post Header */}
      <div className="flex-none bg-gray-50 px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-blue-600">r/{post.subreddit}</span>
            <span className={`text-xs text-white px-2 py-1 rounded ${getSourceColor(post.source)}`}>
              {post.source.split('/')[1] || 'hot'}
            </span>
            {post.isNew && (
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded animate-pulse">
                NEW
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <span className="text-orange-500">↑</span>
              <span className="font-semibold">{formatNumber(post.score)}</span>
            </div>
            <span>{formatTimeAgo(post.created_utc)}</span>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="flex-1 p-4 flex flex-col min-h-0">
        <h2 className="text-lg font-bold text-gray-900 mb-3 leading-tight">
          <a 
            href={`https://reddit.com${post.permalink}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-blue-600 hover:underline"
          >
            {post.title}
          </a>
        </h2>

        {/* Post Text */}
        {post.selftext && post.selftext.length > 0 && (
          <div className="flex-1 overflow-auto mb-4">
            <p className="text-gray-700 text-sm leading-relaxed">
              {post.selftext.length > 300 
                ? `${post.selftext.slice(0, 300)}...` 
                : post.selftext
              }
            </p>
          </div>
        )}

        {/* Media or Thumbnail */}
        {post.thumbnail && 
         post.thumbnail !== 'self' && 
         post.thumbnail !== 'default' && 
         post.thumbnail.startsWith('http') && (
          <div className="flex-none mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={post.thumbnail} 
              alt="Post thumbnail"
              className="max-w-full h-32 object-cover rounded mx-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex-none flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
          <span>u/{post.author}</span>
          <div className="flex items-center gap-3">
            <span>{formatNumber(post.num_comments)} 💬</span>
            <span>{Math.round(post.upvote_ratio * 100)}% upvoted</span>
            {post.over_18 && <span className="bg-red-100 text-red-800 px-2 py-1 rounded">18+</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LiveFeedTV() {
  const {
    posts,
    isLive,
    isLoading,
    error,
    currentIndex,
    autoRotate,
    rotationInterval,
    contentMode,
    addPosts,
    setError,
    setLoading,
    selectedSubreddits,
    refreshInterval,
    updateStats,
    nextPost,
    prevPost,
    goToPost,
  } = useLiveFeedStore();

  const autoRotateRef = useRef<NodeJS.Timeout | null>(null);

  // Handle live feed service
  useEffect(() => {
    if (isLive && selectedSubreddits.length > 0) {
      liveFeedService.start(
        // liveFeedService provides { batch, candidates } payloads; convert to simple addPosts(batch)
        (payload: { batch: import('@/lib/stores/liveFeedStore').LiveFeedPost[]; candidates: import('@/lib/stores/liveFeedStore').LiveFeedPost[] }) => {
          addPosts(payload.batch);
        },
        setError,
        setLoading,
        {
          subreddits: selectedSubreddits,
          intervalSeconds: refreshInterval,
        }
      );

      // Update stats periodically
      const statsInterval = setInterval(updateStats, 10000);

      return () => {
        liveFeedService.stop();
        clearInterval(statsInterval);
      };
    } else {
      liveFeedService.stop();
    }
  }, [isLive, selectedSubreddits, refreshInterval, addPosts, setError, setLoading, updateStats]);

  // Handle auto-rotation
  useEffect(() => {
    if (autoRotate && posts.length > 0) {
      autoRotateRef.current = setInterval(() => {
        nextPost();
      }, rotationInterval * 1000);

      return () => {
        if (autoRotateRef.current) {
          clearInterval(autoRotateRef.current);
        }
      };
    } else if (autoRotateRef.current) {
      clearInterval(autoRotateRef.current);
    }
  }, [autoRotate, rotationInterval, posts.length, nextPost]);

  const filteredPosts = posts.filter(post => contentMode === 'nsfw' ? post.over_18 : !post.over_18);
  const currentPost = filteredPosts[currentIndex];

  return (
    <div className="h-full flex flex-col bg-gray-100 p-4">
      {/* TV Screen Container */}
      <div className="flex-1 relative bg-black rounded-lg p-2 shadow-2xl min-h-0">
        {/* TV Screen */}
        <div className="h-full bg-gray-900 rounded overflow-hidden relative">
          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
              <div className="text-white text-center">
                <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                <div className="text-sm">Fetching latest posts...</div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="absolute inset-0 bg-red-900 bg-opacity-90 flex items-center justify-center z-10">
              <div className="text-white text-center p-4">
                <div className="text-2xl mb-2">⚠️</div>
                <div className="text-sm">{error}</div>
              </div>
            </div>
          )}

          {/* Current Post */}
          {currentPost ? (
            <div className="h-full">
              <TVPost post={currentPost} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-white">
              <div className="text-center">
                <div className="text-4xl mb-4">📺</div>
                <div className="text-lg mb-2">No posts yet</div>
                <div className="text-sm opacity-75">Enable live feed to start watching!</div>
              </div>
            </div>
          )}

          {/* TV Controls Overlay */}
          {posts.length > 0 && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4">
              <div className="flex items-center justify-between text-white">
                {/* Navigation */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevPost}
                    className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
                    title="Previous post"
                  >
                    <span className="text-sm">⬅️</span>
                  </button>
                  <button
                    onClick={nextPost}
                    className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
                    title="Next post"
                  >
                    <span className="text-sm">➡️</span>
                  </button>
                </div>

                {/* Post Counter */}
                <div className="text-xs bg-white/20 px-3 py-1 rounded-full">
                  {currentIndex + 1} / {filteredPosts.length}
                </div>

                {/* Auto-rotate indicator */}
                {autoRotate && (
                  <div className="text-xs bg-green-500/80 px-2 py-1 rounded-full flex items-center gap-1">
                    <span className="animate-pulse">🔄</span>
                    AUTO
                  </div>
                )}
              </div>

              {/* Progress indicators */}
              <div className="flex gap-1 mt-3">
                {filteredPosts.slice(0, 10).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToPost(index)}
                    title={`Go to post ${index + 1}`}
                    className={`h-1 flex-1 rounded transition-all ${
                      index === currentIndex 
                        ? 'bg-white' 
                        : 'bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
                {filteredPosts.length > 10 && (
                  <div className="text-white/70 text-xs px-2">
                    +{filteredPosts.length - 10}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
