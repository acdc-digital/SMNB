'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useLiveFeedStore, LiveFeedPost } from '@/lib/stores/liveFeedStore';
import { liveFeedService } from '@/lib/services/liveFeedService';
import { queueAgent } from '@/lib/services/queueAgent';

export function useLiveFeedWithConvex() {
  const {
    isLive,
    selectedSubreddits,
    refreshInterval,
    setError,
    setLoading,
    updateStats,
  } = useLiveFeedStore();

  // Query live feed posts from Convex (reactive page size)
  const pageSize = 50;
  const pageLimitRef = useRef<number>(pageSize);
  const convexPosts = useQuery(api.redditPosts.getLiveFeedPosts, { limit: pageLimitRef.current });
  
  // Debug: Log convex posts
  useEffect(() => {
    console.log('🔍 Convex posts query result:', convexPosts?.length || 0, 'posts');
    if (convexPosts && convexPosts.length > 0) {
      console.log('📝 First post:', convexPosts[0].title);
    }
  }, [convexPosts]);
  
  // Mutation to store posts in Convex
  const storePosts = useMutation(api.redditPosts.storeLiveFeedPosts);

  // Handler for individual posts from queue agent
  const handleSinglePost = useCallback(async (post: LiveFeedPost) => {
    console.log(`🎯 handleSinglePost called for: ${post.title.substring(0, 50)}... (ID: ${post.id})`);

    try {
      // Generate batch ID for this individual post
      const batchId = Date.now().toString();
      currentBatchId.current = batchId;

      // Check if post already exists in local state
      const existingPost = feedRef.current.find(p => p.id === post.id);
      if (existingPost) {
        console.log(`⏭️ Post ${post.id} already exists in local state, skipping`);
        return;
      }

      console.log(`📤 Storing individual post to Convex: ${post.title.substring(0, 50)}...`);

      // Store single post to Convex
      const convexFormattedPost = {
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
        source: post.source,
        addedAt: post.addedAt || Date.now(),
        batchId: batchId,
      };

      console.log(`📤 Storing individual post: ${post.title.substring(0, 50)}...`);
      const result = await storePosts({ posts: [convexFormattedPost], batchId });

      if (result && result.inserted > 0) {
        // Add to local state
        const liveFeedPost: LiveFeedPost = {
          ...post,
          batchId: parseInt(batchId, 10),
          isNew: true,
          sort_type: 'live',
          fetched_at: Date.now(),
        };

        // Prepend to feed (newest first)
        feedRef.current = [liveFeedPost, ...feedRef.current];
        setPostsState([...feedRef.current]);

        console.log(`✅ Added individual post to feed: ${post.title.substring(0, 50)}...`);
      } else {
        console.log(`⏭️ Post ${post.id} was duplicate or failed to store`);
      }
    } catch (error) {
      console.error('❌ Failed to store individual post:', error);
    }
  }, [storePosts]);

  // Set up queue agent callback
  useEffect(() => {
    queueAgent.setOnPostReady(handleSinglePost);
    console.log('🔗 Queue agent callback set up');

    return () => {
      // Clean up queue agent when component unmounts
      queueAgent.stop();
      queueAgent.clear();
      console.log('🧹 Queue agent cleaned up');
    };
  }, [handleSinglePost]);

  // Ref to track the current batch ID
  const currentBatchId = useRef<string>(Date.now().toString());

  // Local state for client-side appended feed (increasing length)
  const feedRef = useRef<LiveFeedPost[]>([]);
  const [postsState, setPostsState] = useState<LiveFeedPost[]>([]);

  // Custom handler to add posts to both Zustand store and Convex
  // postsPayload contains primary batch and ranked candidates
  const handleNewPosts = useCallback(async (postsPayload: { batch: LiveFeedPost[]; candidates: LiveFeedPost[] }) => {
    try {
      // Send posts to queue agent for individual processing
      const allPosts = [...postsPayload.batch, ...postsPayload.candidates];
      queueAgent.enqueue(allPosts);
    } catch (error) {
      console.error('❌ Failed to enqueue posts:', error);
      setError('Failed to process posts');
    }
  }, [setError]);

  // Start/stop live feed service
  useEffect(() => {
    if (isLive && selectedSubreddits.length > 0) {
      liveFeedService.start(
        handleNewPosts,
        setError,
        setLoading,
        {
          subreddits: selectedSubreddits,
          intervalSeconds: refreshInterval,
        }
      );

      const statsInterval = setInterval(updateStats, 10000);

      return () => {
        liveFeedService.stop();
        queueAgent.stop();
        clearInterval(statsInterval);
      };
    } else {
      liveFeedService.stop();
      queueAgent.stop();
    }
  }, [isLive, selectedSubreddits, refreshInterval, handleNewPosts, setError, setLoading, updateStats]);

  // Convert Convex posts back to LiveFeedPost format (initial seed)
  const seedPosts: LiveFeedPost[] = (convexPosts || []).map((post) => {
    const p = post as Record<string, unknown>;
    return ({
      ...(post as unknown as LiveFeedPost),
      batchId: parseInt(String(p['batchId'] || currentBatchId.current), 10),
      isNew: false,
      sort_type: 'live',
      fetched_at: Number(p['addedAt'] || Date.now()),
    } as LiveFeedPost);
  });

  // Initialize feedRef on first render
  if (feedRef.current.length === 0 && seedPosts.length > 0) {
    feedRef.current = seedPosts;
    setPostsState(seedPosts);
  }

  // Expose a loadMore function that increases the page limit and lets useQuery re-run
  const loadMore = (more = pageSize) => {
    pageLimitRef.current = pageLimitRef.current + more;
    // Rerender will cause useQuery to refetch because the args object changed (we'll force update by returning a new object)
    // Note: useQuery may cache based on stable object identity; in most Convex clients passing a new object triggers refetch.
    return pageLimitRef.current;
  };

  // Rebuild feedRef whenever convexPosts changes (seed or page growth)
  useEffect(() => {
    if (convexPosts && convexPosts.length > 0) {
      const mapped = convexPosts.map((post) => {
        const p = post as Record<string, unknown>;
        return ({
          ...(post as unknown as LiveFeedPost),
          batchId: parseInt(String(p['batchId'] || currentBatchId.current), 10),
          isNew: false,
          sort_type: 'live',
          fetched_at: Number(p['addedAt'] || Date.now()),
        } as LiveFeedPost);
      }) as LiveFeedPost[];

      feedRef.current = mapped;
  setPostsState(mapped);
    }
  }, [convexPosts]);

  return {
    posts: postsState,
    isLoading: !convexPosts,
    currentBatchId: currentBatchId.current,
    loadMore,
  };
}
