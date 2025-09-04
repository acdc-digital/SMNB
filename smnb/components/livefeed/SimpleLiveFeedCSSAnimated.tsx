'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSimpleLiveFeedStore } from '@/lib/stores/livefeed/simpleLiveFeedStore';
import { enhancedProcessingPipeline } from '@/lib/services/livefeed/enhancedProcessingPipeline';
import { EnhancedRedditPost } from '@/lib/types/enhancedRedditPost';

interface SimpleLiveFeedProps {
  className?: string;
}

export default function SimpleLiveFeedCSSAnimated({ className }: SimpleLiveFeedProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [animatingPosts, setAnimatingPosts] = useState<Set<string>>(new Set());

  const {
    posts,
    isLive,
    contentMode,
    selectedSubreddits,
    refreshInterval,
    currentSessionId,
    viewMode,
    storyHistory,
    addPost,
    setLoading,
    setError,
    manualClearPosts,
    clearStoryHistory,
    loadStoriesFromConvex,
  } = useSimpleLiveFeedStore();

  // Track which posts should show animation
  useEffect(() => {
    const newPosts = posts.filter(post => post.isNew);
    if (newPosts.length > 0) {
      const newIds = new Set(newPosts.map(post => post.id));
      setAnimatingPosts(newIds);
      
      // Clear animation after duration
      setTimeout(() => {
        setAnimatingPosts(new Set());
      }, 1200); // Slightly longer than animation duration
    }
  }, [posts]);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Load stories from Convex when switching to history view or on mount
  useEffect(() => {
    if (viewMode === 'history') {
      console.log('📚 Loading stories from Convex for history view');
      loadStoriesFromConvex();
    }
  }, [viewMode, loadStoriesFromConvex]);

  // Memoize callbacks to prevent unnecessary re-renders
  const handleNewPost = useCallback((post: EnhancedRedditPost) => {
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
      source: 'reddit' as const,
      addedAt: Date.now(),
      batchId: post.batchId || Date.now(),
      // Enhanced properties
      priority_score: post.priority_score,
      sentiment: post.sentiment,
      categories: post.categories,
      quality_score: post.quality_score,
    });
  }, [addPost]);

  const handleError = useCallback((error: string | null) => {
    if (error) {
      console.error('❌ Pipeline error:', error);
    }
    setError(error);
  }, [setError]);

  const handleLoading = useCallback((loading: boolean) => {
    setLoading(loading);
  }, [setLoading]);

  // Memoize pipeline config to prevent unnecessary restarts
  const pipelineConfig = useMemo(() => ({
    subreddits: selectedSubreddits,
    contentMode,
    maxPostsInPipeline: 20,
    publishingInterval: refreshInterval * 1000, // Convert seconds to milliseconds
  }), [selectedSubreddits, contentMode, refreshInterval]);

  // Start/stop service when isLive changes
  useEffect(() => {
    if (isLive && selectedSubreddits.length > 0) {
      console.log('🚀 Starting enhanced processing pipeline');
      
      enhancedProcessingPipeline.start(
        handleNewPost,
        handleError,
        handleLoading,
        pipelineConfig
      );
    } else {
      console.log('🛑 Stopping enhanced processing pipeline');
      enhancedProcessingPipeline.stop();
    }

    return () => {
      enhancedProcessingPipeline.stop();
    };
  }, [isLive, selectedSubreddits.length, handleNewPost, handleError, handleLoading, pipelineConfig]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Controls */}
      <div className="flex items-center justify-between px-2 py-2 border-b border-border/50">
        <div className="text-sm font-medium text-muted-foreground">
          {viewMode === 'live' 
            ? `Live Feed ${posts.length > 0 ? `(${posts.length} posts)` : ''}` 
            : `Story History ${storyHistory.length > 0 ? `(${storyHistory.length} stories)` : ''}`
          }
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              // Import and use the live feed store to toggle view mode
              import('@/lib/stores/livefeed/simpleLiveFeedStore').then(module => {
                const { toggleViewMode } = module.useSimpleLiveFeedStore.getState();
                toggleViewMode();
              });
            }}
            className={`px-3 py-1 text-xs rounded transition-colors cursor-pointer ${
              viewMode === 'history' 
                ? 'bg-blue-500 text-white' 
                : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
            }`}
          >
            📜 History
          </button>
          <button
            onClick={() => {
              if (viewMode === 'live') {
                manualClearPosts();
              } else {
                clearStoryHistory();
              }
            }}
            className="px-3 py-1 text-xs bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded transition-colors cursor-pointer"
          >
            🗑️ Clear {viewMode === 'live' ? 'Posts' : 'Stories'}
          </button>
        </div>
      </div>
      
      {/* Content Area - Live Posts or Story History */}
      <div className="space-y-4 px-2">
        {viewMode === 'live' ? (
          // Live Posts View
          posts.length === 0 ? (
            <div 
              className={`text-center py-8 text-muted-foreground ${
                reducedMotion ? '' : 'animate-fade-in'
              }`}
            >
              {isLive ? 'Waiting for posts...' : 'Start the live feed to see posts'}
            </div>
          ) : (
            <div className="space-y-2">
              {posts.map((post) => {
                const shouldAnimate = (post.isNew || animatingPosts.has(post.id)) && !reducedMotion;
                const isFromPreviousSession = post.sessionId !== currentSessionId;
                
                // Debug log for animation
                if (shouldAnimate) {
                  console.log(`🎬 Post ${post.id} should animate. isNew: ${post.isNew}, inAnimatingSet: ${animatingPosts.has(post.id)}, reducedMotion: ${reducedMotion}`);
                }
                
                return (
                  <div
                    key={`${post.id}-${post.addedAt}`}
                    className={`
                      bg-card border border-border rounded shadow-sm
                      ${shouldAnimate ? 'animate-simple-slide' : ''}
                      ${isFromPreviousSession ? 'opacity-75 border-l-4 border-l-muted-foreground/30' : ''}
                      will-change-transform
                    `}
                  >
                  <div className="flex items-start justify-between p-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground truncate">
                          {post.title}
                        </h3>
                        {/* Enhanced indicators with CSS animations */}
                        {post.priority_score && post.priority_score > 0.7 && (
                          <span 
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 ${
                              reducedMotion ? '' : 'animate-scale-in-delayed'
                            }`}
                          >
                            ⭐ High Priority
                          </span>
                        )}
                        {post.sentiment === 'positive' && (
                          <span 
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 ${
                              reducedMotion ? '' : 'animate-scale-in-delayed-2'
                            }`}
                          >
                            😊 Positive
                          </span>
                        )}
                        {post.sentiment === 'negative' && (
                          <span 
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 ${
                              reducedMotion ? '' : 'animate-scale-in-delayed-2'
                            }`}
                          >
                            😔 Critical
                          </span>
                        )}
                        {/* Session indicator for previous session posts */}
                        {isFromPreviousSession && (
                          <span 
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 ${
                              reducedMotion ? '' : 'animate-scale-in-delayed-3'
                            }`}
                          >
                            📚 Previous Session
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
                    </div>
                    
                    <div className="ml-4 flex-shrink-0">
                      <a
                        href={post.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm cursor-pointer transition-all duration-200 ${
                          reducedMotion ? '' : 'hover:scale-110 active:scale-95'
                        }`}
                      >
                        View →
                      </a>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )
        ) : (
          // Story History View
          storyHistory.length === 0 ? (
            <div 
              className={`text-center py-8 text-muted-foreground ${
                reducedMotion ? '' : 'animate-fade-in'
              }`}
            >
              <div className="text-4xl mb-4">📚</div>
              <div className="text-lg font-medium mb-2">No stories yet</div>
              <div className="text-sm">Completed stories from the Host/Editor will appear here</div>
            </div>
          ) : (
            <div className="space-y-3">
              {storyHistory.map((story, index) => {
                const getToneEmoji = (tone: typeof story.tone): string => {
                  switch (tone) {
                    case 'breaking': return '🚨';
                    case 'developing': return '📈';
                    case 'analysis': return '🧠';
                    case 'opinion': return '💭';
                    case 'human-interest': return '❤️';
                    default: return '📰';
                  }
                };

                const getPriorityEmoji = (priority: typeof story.priority): string => {
                  switch (priority) {
                    case 'high': return '🔥';
                    case 'medium': return '⭐';
                    case 'low': return '📝';
                    default: return '📝';
                  }
                };

                return (
                  <div
                    key={story.id}
                    className={`
                      bg-card border border-border rounded-lg p-4 shadow-sm
                      transition-all duration-500
                      ${index === 0 ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30' : ''}
                    `}
                  >
                    {/* Story Header */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{getToneEmoji(story.tone)}</span>
                      <span className="text-lg">{getPriorityEmoji(story.priority)}</span>
                      <span className="text-sm font-medium text-muted-foreground capitalize">
                        {story.tone} • {story.priority} priority
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {story.timestamp.toLocaleTimeString()}
                      </span>
                    </div>

                    {/* Story Content */}
                    <div className="text-sm leading-relaxed text-foreground mb-3">
                      {story.narrative}
                    </div>

                    {/* Story Metadata */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/30">
                      <span>⏱️ {story.duration}s read time</span>
                      {story.sentiment && (
                        <span>
                          {story.sentiment === 'positive' ? '😊' : story.sentiment === 'negative' ? '😔' : '😐'} {story.sentiment}
                        </span>
                      )}
                      {story.topics && story.topics.length > 0 && (
                        <span className="text-blue-600 dark:text-blue-400">
                          🏷️ {story.topics.join(', ')}
                        </span>
                      )}
                      {story.originalItem && (
                        <span>
                          📰 {story.originalItem.subreddit ? `r/${story.originalItem.subreddit}` : 'Source'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
