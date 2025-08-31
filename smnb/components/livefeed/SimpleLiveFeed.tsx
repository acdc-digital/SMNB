'use client';

import { useEffect } from 'react';
import { useSimpleLiveFeedStore, LiveFeedPost } from '@/lib/stores/livefeed/simpleLiveFeedStore';
import { simpleLiveFeedService } from '@/lib/services/livefeed/simpleLiveFeedService';

interface SimpleLiveFeedProps {
  className?: string;
}

export default function SimpleLiveFeed({ className }: SimpleLiveFeedProps) {
  const {
    posts,
    isLive,
    contentMode,
    selectedSubreddits,
    refreshInterval,
    isLoading,
    error,
    addPost,
    setIsLive,
    setContentMode,
    setLoading,
    setError,
    clearOldPosts,
  } = useSimpleLiveFeedStore();

  // Start/stop service when isLive changes
  useEffect(() => {
    if (isLive && selectedSubreddits.length > 0) {
      console.log('🚀 Starting simple live feed service');
      
      simpleLiveFeedService.start(
        (post: LiveFeedPost) => {
          console.log(`📥 New post: ${post.title.substring(0, 30)}...`);
          addPost(post);
        },
        (error: string | null) => setError(error),
        (loading: boolean) => setLoading(loading),
        {
          subreddits: selectedSubreddits,
          intervalSeconds: refreshInterval,
          contentMode,
        },
        clearOldPosts
      );
    } else {
      console.log('🛑 Stopping simple live feed service');
      simpleLiveFeedService.stop();
    }

    return () => {
      simpleLiveFeedService.stop();
    };
  }, [isLive, selectedSubreddits, refreshInterval, contentMode, addPost, setLoading, setError, clearOldPosts]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Simple Live Feed</h2>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className="text-sm">{isLive ? 'Live' : 'Stopped'}</span>
          </div>
        </div>
        
        <div className="flex gap-4 items-center">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-4 py-2 rounded ${
              isLive 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isLive ? 'Stop' : 'Start'}
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={() => setContentMode('sfw')}
              className={`px-3 py-1 rounded text-sm ${
                contentMode === 'sfw' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              SFW Only
            </button>
            <button
              onClick={() => setContentMode('nsfw')}
              className={`px-3 py-1 rounded text-sm ${
                contentMode === 'nsfw' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              NSFW Only
            </button>
          </div>
        </div>
        
        <div className="mt-3 text-sm text-gray-600">
          <span>Posts: {posts.length} | </span>
          <span>Subreddits: {selectedSubreddits.join(', ')} | </span>
          <span>Interval: {refreshInterval}s</span>
          {isLoading && <span className="text-blue-500 ml-2">Loading...</span>}
          {error && <span className="text-red-500 ml-2">Error: {error}</span>}
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-3">
        {posts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {isLive ? 'Waiting for posts...' : 'Start the live feed to see posts'}
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={`${post.id}-${post.addedAt}`}
              className={`
                bg-white p-4 rounded-lg shadow-sm border transition-all duration-500
                ${post.isNew ? 'ring-2 ring-green-400 bg-green-50' : ''}
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {post.title}
                  </h3>
                  <div className="mt-1 text-sm text-gray-500">
                    r/{post.subreddit} • by u/{post.author} • {post.score} points • {post.num_comments} comments
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    {new Date(post.created_utc * 1000).toLocaleTimeString()}
                  </div>
                </div>
                
                <div className="ml-4 flex-shrink-0">
                  <a
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 text-sm"
                  >
                    View →
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
