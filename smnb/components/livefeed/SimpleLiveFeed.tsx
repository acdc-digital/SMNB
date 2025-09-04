// SIMPLE LIVE FEED
// /Users/matthewsimon/Projects/SMNB/smnb/components/livefeed/SimpleLiveFeed.tsx

'use client';

import { useEffect } from 'react';
import { useSimpleLiveFeedStore } from '@/lib/stores/livefeed/simpleLiveFeedStore';
import { useProducerStore } from '@/lib/stores/producer/producerStore';
import { enhancedProcessingPipeline } from '@/lib/services/livefeed/enhancedProcessingPipeline';
import { EnhancedRedditPost } from '@/lib/types/enhancedRedditPost';

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

  const { getPostMetrics } = useProducerStore();

  // Component to render Producer validation badges
  const ProducerMetrics = ({ postId }: { postId: string }) => {
    const metrics = getPostMetrics(postId);
    
    if (!metrics) return null;

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {/* Duplicate Analysis Badge */}
        {metrics.metrics.totalDuplicates > 1 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 animate-in zoom-in-50">
            🔍 {metrics.metrics.totalDuplicates} duplicates
          </span>
        )}
        
        {/* Subreddit Diversity Badge */}
        {metrics.metrics.subredditDiversity > 3 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 animate-in zoom-in-50">
            🌐 {metrics.metrics.subredditDiversity} communities
          </span>
        )}
        
        {/* High Engagement Badge */}
        {metrics.metrics.totalEngagement > 10000 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 animate-in zoom-in-50">
            🔥 {(metrics.metrics.totalEngagement / 1000).toFixed(1)}k engagement
          </span>
        )}
        
        {/* Verification Badge */}
        {metrics.priority === 'high' && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 animate-in zoom-in-50">
            ✅ Verified trending
          </span>
        )}
      </div>
    );
  };

  // Start/stop service when isLive changes
  useEffect(() => {
    if (isLive && selectedSubreddits.length > 0) {
      console.log('🚀 Starting enhanced processing pipeline');
      
      enhancedProcessingPipeline.start(
        (post: EnhancedRedditPost) => {
          console.log(`📥 New post: ${post.title.substring(0, 30)}...`);
          // Convert EnhancedRedditPost to LiveFeedPost for the store
          addPost({
            id: post.id,
            title: post.title,
            author: post.author,
            subreddit: post.subreddit,
            url: post.url,
            permalink: post.permalink,
            score: post.score,
            num_comments: post.num_comments,
            created_utc: post.created_utc,
            thumbnail: post.thumbnail,
            selftext: post.selftext,
            is_video: post.is_video,
            domain: post.domain,
            upvote_ratio: post.upvote_ratio,
            over_18: post.over_18,
            source: 'reddit',
            addedAt: post.addedAt || Date.now(),
            batchId: post.batchId || Date.now(),
            isNew: post.isNew,
          });
        },
        (error: string | null) => setError(error),
        (loading: boolean) => setLoading(loading),
        {
          subreddits: selectedSubreddits,
          contentMode,
          maxPostsInPipeline: 200,
          publishingInterval: 10000, // 10 seconds
        }
      );
    } else {
      console.log('🛑 Stopping enhanced processing pipeline');
      enhancedProcessingPipeline.stop();
    }

    return () => {
      enhancedProcessingPipeline.stop();
    };
  }, [isLive, selectedSubreddits, refreshInterval, contentMode, addPost, setLoading, setError, clearOldPosts]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Controls */}
      <div className="bg-card border border-border p-4 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Simple Live Feed</h2>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-500' : 'bg-muted'}`} />
            <span className="text-sm text-muted-foreground">{isLive ? 'Live' : 'Stopped'}</span>
          </div>
        </div>
        
        <div className="flex gap-4 items-center">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-4 py-2 rounded transition-colors ${
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
              className={`px-3 py-1 rounded text-sm transition-colors ${
                contentMode === 'sfw' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
              }`}
            >
              SFW Only
            </button>
            <button
              onClick={() => setContentMode('nsfw')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                contentMode === 'nsfw' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
              }`}
            >
              NSFW Only
            </button>
          </div>
        </div>
        
        <div className="mt-3 text-sm text-muted-foreground">
          <span>Posts: {posts.length} | </span>
          <span>Subreddits: {selectedSubreddits.join(', ')} | </span>
          <span>Interval: {refreshInterval}s</span>
          {isLoading && <span className="text-blue-500 dark:text-blue-400 ml-2">Loading...</span>}
          {error && <span className="text-red-500 dark:text-red-400 ml-2">Error: {error}</span>}
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-3 animate-in fade-in duration-500">
        {posts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground animate-in fade-in duration-500">
            {isLive ? 'Waiting for posts...' : 'Start the live feed to see posts'}
          </div>
        ) : (
          <div>
            {posts.map((post) => (
              <div
                key={`${post.id}-${post.addedAt}`}
                className={`
                  bg-card border border-border p-4 rounded-lg shadow-sm mb-3
                  transition-all ease-in-out
                  hover:scale-[1.02] hover:shadow-md
                  animate-in slide-in-from-top-2 fade-in
                  ${post.isNew ? 'ring-2 ring-green-400 dark:ring-green-500 bg-green-50 dark:bg-green-950/20' : ''}
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground truncate">
                        {post.title}
                      </h3>
                      {/* Enhanced indicators */}
                      {post.priority_score && post.priority_score > 0.7 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 animate-in zoom-in-50 delay-300">
                          ⭐ High Priority
                        </span>
                      )}
                      {post.sentiment === 'positive' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 animate-in zoom-in-50 delay-500">
                          😊 Positive
                        </span>
                      )}
                      {post.sentiment === 'negative' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 animate-in zoom-in-50 delay-500">
                          😔 Critical
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      r/{post.subreddit} • by u/{post.author} • {post.score} points • {post.num_comments} comments
                      {post.categories && post.categories.length > 0 && (
                        <span className="ml-2 text-blue-600 dark:text-blue-400">
                          • {post.categories.join(', ')}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground/70">
                      {new Date(post.created_utc * 1000).toLocaleTimeString()}
                      {post.quality_score && (
                        <span className="ml-2">
                          • Quality: {(post.quality_score * 100).toFixed(0)}%
                        </span>
                      )}
                      {post.priority_score && (
                        <span className="ml-2">
                          • Priority: {(post.priority_score * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                    
                    {/* Producer Intelligence Badges */}
                    <ProducerMetrics postId={post.id} />
                  </div>
                  
                  <div className="ml-4 flex-shrink-0">
                    <a
                      href={post.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm cursor-pointer transition-all hover:scale-110 active:scale-95"
                    >
                      View →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
