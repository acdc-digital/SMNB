'use client';

import { useEffect } from 'react';
import { useSimpleLiveFeedStore } from '@/lib/stores/livefeed/simpleLiveFeedStore';
import { enhancedProcessingPipeline } from '@/lib/services/livefeed/enhancedProcessingPipeline';
import { EnhancedRedditPost } from '@/lib/types/enhancedRedditPost';

interface SimpleLiveFeedProps {
  className?: string;
}

export default function SimpleLiveFeedAnimated({ className }: SimpleLiveFeedProps) {
  const shouldReduceMotion = useReducedMotion();
  
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

  // Animation variants for posts
  const postVariants = shouldReduceMotion ? {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  } : {
    hidden: {
      opacity: 0,
      y: -100,
      scale: 0.8,
      rotateX: -15
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30,
        mass: 1,
        duration: 0.6
      }
    },
    exit: {
      opacity: 0,
      x: -100,
      scale: 0.8,
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };

  // Container animation for staggered effect
  const containerVariants = {
    visible: {
      transition: {
        staggerChildren: 0.1
      }
    }
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
            source: 'reddit' as const,
            addedAt: Date.now(),
            batchId: post.batch_id || Date.now(),
            // Enhanced properties
            processing_status: post.processing_status,
            priority_score: post.priority_score,
            sentiment: post.sentiment,
            categories: post.categories,
            quality_score: post.quality_score,
          });
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
          <h2 className="text-lg font-semibold text-foreground">Enhanced Live Feed</h2>
          <div className="flex items-center gap-2">
            <motion.div 
              className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-500' : 'bg-secondary'}`}
              animate={isLive ? { 
                scale: [1, 1.2, 1],
                opacity: [1, 0.8, 1] 
              } : { scale: 1, opacity: 1 }}
              transition={{ repeat: isLive ? Infinity : 0, duration: 2 }}
            />
            <span className="text-sm text-muted-foreground">{isLive ? 'Live' : 'Stopped'}</span>
          </div>
        </div>
        
        <div className="flex gap-4 items-center">
          <motion.button
            onClick={() => setIsLive(!isLive)}
            className={`px-4 py-2 rounded transition-colors cursor-pointer ${
              isLive 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
            whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLive ? 'Stop' : 'Start'}
          </motion.button>
          
          <div className="flex gap-2">
            <button
              onClick={() => setContentMode('sfw')}
              className={`px-3 py-1 rounded text-sm transition-colors cursor-pointer ${
                contentMode === 'sfw' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
              }`}
            >
              SFW Only
            </button>
            <button
              onClick={() => setContentMode('nsfw')}
              className={`px-3 py-1 rounded text-sm transition-colors cursor-pointer ${
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
          {isLoading && <span className="text-blue-500 ml-2">Loading...</span>}
          {error && <span className="text-red-500 ml-2">Error: {error}</span>}
        </div>
      </div>

      {/* Posts with Animation */}
      <div className="space-y-3">
        {posts.length === 0 ? (
          <motion.div 
            className="text-center py-8 text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {isLive ? 'Waiting for posts...' : 'Start the live feed to see posts'}
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {posts.map((post) => (
              <motion.div
                key={`${post.id}-${post.addedAt}`}
                variants={postVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                className={`
                  bg-card border border-border p-4 rounded-lg shadow-sm
                  ${post.isNew ? 'ring-2 ring-green-400 dark:ring-green-500 bg-green-50 dark:bg-green-950/20' : ''}
                  will-change-transform
                `}
                style={{ willChange: 'transform' }}
                whileHover={shouldReduceMotion ? {} : {
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground truncate">
                        {post.title}
                      </h3>
                      {/* Enhanced indicators with animations */}
                      {post.priority_score && post.priority_score > 0.7 && (
                        <motion.span 
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3, type: "spring" }}
                        >
                          ⭐ High Priority
                        </motion.span>
                      )}
                      {post.sentiment === 'positive' && (
                        <motion.span 
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.4, type: "spring" }}
                        >
                          😊 Positive
                        </motion.span>
                      )}
                      {post.sentiment === 'negative' && (
                        <motion.span 
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.4, type: "spring" }}
                        >
                          😔 Critical
                        </motion.span>
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
                      className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm cursor-pointer"
                    >
                      View →
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
