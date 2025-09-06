// AGGREGATOR
// /Users/matthewsimon/Projects/SMNB/smnb/components/aggregator/aggregator.tsx

'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useSimpleLiveFeedStore } from '@/lib/stores/livefeed/simpleLiveFeedStore';
import { enhancedProcessingPipeline } from '@/lib/services/livefeed/enhancedProcessingPipeline';
import { EnhancedRedditPost } from '@/lib/types/enhancedRedditPost';

interface AggregatorProps {
  // Optional callback for external monitoring/debugging
  onNewPost?: (post: EnhancedRedditPost) => void;
  onError?: (error: string | null) => void;
  onLoadingChange?: (loading: boolean) => void;
}

export default function Aggregator({ 
  onNewPost, 
  onError, 
  onLoadingChange 
}: AggregatorProps) {
  const {
    isLive,
    contentMode,
    selectedSubreddits,
    refreshInterval,
    addPost,
    setLoading,
    setError,
  } = useSimpleLiveFeedStore();

  // Memoize callbacks to prevent unnecessary re-renders
  const handleNewPost = useCallback((post: EnhancedRedditPost) => {
    console.log(`📥 Aggregator: New post - ${post.title.substring(0, 30)}...`);
    
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

    // Call external callback if provided
    onNewPost?.(post);
  }, [addPost, onNewPost]);

  const handleError = useCallback((error: string | null) => {
    if (error) {
      console.error('❌ Aggregator Pipeline error:', error);
    }
    setError(error);
    
    // Call external callback if provided
    onError?.(error);
  }, [setError, onError]);

  const handleLoading = useCallback((loading: boolean) => {
    console.log(`🔄 Aggregator: Loading state - ${loading ? 'Starting' : 'Stopping'}`);
    setLoading(loading);
    
    // Call external callback if provided
    onLoadingChange?.(loading);
  }, [setLoading, onLoadingChange]);

  // Memoize pipeline config to prevent unnecessary restarts
  const pipelineConfig = useMemo(() => ({
    subreddits: selectedSubreddits,
    contentMode,
    maxPostsInPipeline: 20,
    publishingInterval: refreshInterval * 1000, // Convert seconds to milliseconds
  }), [selectedSubreddits, contentMode, refreshInterval]);

  // Start/stop aggregation service when isLive changes
  useEffect(() => {
    if (isLive && selectedSubreddits.length > 0) {
      console.log('🚀 Starting Reddit aggregation pipeline');
      
      enhancedProcessingPipeline.start(
        handleNewPost,
        handleError,
        handleLoading,
        pipelineConfig
      );
    } else {
      console.log('🛑 Stopping Reddit aggregation pipeline');
      enhancedProcessingPipeline.stop();
    }

    return () => {
      enhancedProcessingPipeline.stop();
    };
  }, [isLive, selectedSubreddits.length, handleNewPost, handleError, handleLoading, pipelineConfig]);

  // This component runs in the background and doesn't render anything visible
  return null;
}