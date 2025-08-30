import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { RedditPostWithMeta } from '@/lib/reddit-actions';

export interface LiveFeedPost extends RedditPostWithMeta {
  id: string;
  addedAt: number;
  batchId: number; // Which fetch batch this post belongs to
  isNew?: boolean; // For animation purposes
  source: string; // Which endpoint/subreddit this came from
}

interface LiveFeedState {
  // Core state
  posts: LiveFeedPost[];
  isLive: boolean;
  lastFetch: number;
  
  // Configuration
  selectedSubreddits: string[];
  customSubreddits: string[];
  refreshInterval: number; // in seconds
  maxPosts: number;
  contentMode: 'sfw' | 'nsfw'; // Toggle between SFW-only and NSFW-only feeds
  
  // TV-style rotation
  currentIndex: number;
  autoRotate: boolean;
  rotationInterval: number; // seconds between auto-rotation
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Stats
  totalPostsFetched: number;
  postsPerMinute: number;
}

interface LiveFeedActions {
  // Core actions
  addPosts: (posts: LiveFeedPost[]) => void;
  addSinglePost: (post: LiveFeedPost) => void;
  removeDuplicates: () => void;
  clearFeed: () => void;
  
  // Configuration
  setLive: (isLive: boolean) => void;
  setSubreddits: (subreddits: string[]) => void;
  setRefreshInterval: (interval: number) => void;
  setContentMode: (contentMode: 'sfw' | 'nsfw') => void;
  addCustomSubreddit: (subreddit: string) => void;
  removeCustomSubreddit: (subreddit: string) => void;
  
  // TV-style navigation
  nextPost: () => void;
  prevPost: () => void;
  goToPost: (index: number) => void;
  setAutoRotate: (autoRotate: boolean) => void;
  setRotationInterval: (interval: number) => void;
  
  // UI actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  markPostsAsViewed: () => void;
  
  // Stats
  updateStats: () => void;
}

type LiveFeedStore = LiveFeedState & LiveFeedActions;

export const useLiveFeedStore = create<LiveFeedStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      posts: [],
      isLive: false,
      lastFetch: 0,
      
        selectedSubreddits: ['all', 'worldnews', 'technology', 'science', 'programming'],
      customSubreddits: [],
      // Slower refresh to reduce duplicate saturation and give more time for sources to change
      refreshInterval: 60, // 60 seconds
  maxPosts: 50, // Increased to show more posts in the feed
  contentMode: 'sfw', // Default to SFW-only content
      
      currentIndex: 0,
      autoRotate: true,
      rotationInterval: 10, // 10 seconds per post
      
      isLoading: false,
      error: null,
      
      totalPostsFetched: 0,
      postsPerMinute: 0,
      
      // Actions
      addPosts: (newPosts) => {
        set((state) => {
          // Mark new posts for animation with batch timestamp
          const batchTimestamp = Date.now();
          const postsWithNewFlag = newPosts.map(post => ({
            ...post,
            isNew: true,
            addedAt: batchTimestamp, // Same timestamp for entire batch
            batchId: batchTimestamp, // Track which batch this belongs to
          }));
          
          // Sort THIS BATCH by Reddit creation time (newest first within batch)
          const sortedBatch = postsWithNewFlag.sort((a, b) => b.created_utc - a.created_utc);
          
          // Take top 25 from this batch (best of this fetch)
          const limitedBatch = sortedBatch.slice(0, state.maxPosts);
          
          // REPLACE entire feed with this new batch
          // (No mixing with previous posts - complete replacement)
          
          return {
            posts: limitedBatch,
            lastFetch: batchTimestamp,
            totalPostsFetched: state.totalPostsFetched + newPosts.length,
          };
        });
        
        // Remove "new" flag after animation duration
        setTimeout(() => {
          set((state) => ({
            posts: state.posts.map(post => ({ ...post, isNew: false }))
          }));
        }, 1000);
      },

      addSinglePost: (newPost) => {
        set((state) => {
          // Check if post already exists
          const existingIndex = state.posts.findIndex(post => post.id === newPost.id);
          if (existingIndex !== -1) {
            console.log(`🚫 Duplicate post detected: ${newPost.title.substring(0, 50)}...`);
            return state; // Don't add duplicate
          }

          // Mark new post for animation
          const postWithNewFlag = {
            ...newPost,
            isNew: true,
            addedAt: Date.now(),
            batchId: Date.now(), // Individual posts get their own batch ID
          };

          // Add to the beginning of the posts array (newest first)
          const updatedPosts = [postWithNewFlag, ...state.posts];

          // Keep only the most recent posts (maintain maxPosts limit)
          const limitedPosts = updatedPosts.slice(0, state.maxPosts);

          console.log(`✨ Added single post: ${newPost.title.substring(0, 50)}...`);

          return {
            posts: limitedPosts,
            totalPostsFetched: state.totalPostsFetched + 1,
          };
        });

        // Remove "new" flag after animation duration
        setTimeout(() => {
          set((state) => ({
            posts: state.posts.map(post => ({ ...post, isNew: false }))
          }));
        }, 1000);
      },

      removeDuplicates: () => {
        set((state) => ({
          posts: state.posts.filter((post, index, self) => 
            self.findIndex(p => p.id === post.id) === index
          ),
        }));
      },
      
      clearFeed: () => {
        set({
          posts: [],
          totalPostsFetched: 0,
          postsPerMinute: 0,
          error: null,
        });
      },
      
      setLive: (isLive) => {
        set({ isLive });
        if (!isLive) {
          set({ isLoading: false });
        }
      },
      
      setSubreddits: (subreddits) => {
        set({ selectedSubreddits: subreddits });
      },
      
      setRefreshInterval: (interval) => {
        set({ refreshInterval: interval });
      },
      
      setContentMode: (contentMode) => {
        set({ contentMode });
      },
      
      addCustomSubreddit: (subreddit) => {
        set((state) => ({
          customSubreddits: [...state.customSubreddits, subreddit],
          selectedSubreddits: [...state.selectedSubreddits, subreddit]
        }));
      },
      
      removeCustomSubreddit: (subreddit) => {
        set((state) => ({
          customSubreddits: state.customSubreddits.filter(s => s !== subreddit),
          selectedSubreddits: state.selectedSubreddits.filter(s => s !== subreddit)
        }));
      },
      
      setLoading: (loading) => {
        set({ isLoading: loading });
      },
      
      setError: (error) => {
        set({ error });
      },
      
      // TV-style navigation
      nextPost: () => {
        set((state) => ({
          currentIndex: (state.currentIndex + 1) % Math.max(1, state.posts.length)
        }));
      },
      
      prevPost: () => {
        set((state) => ({
          currentIndex: state.currentIndex === 0 
            ? Math.max(0, state.posts.length - 1) 
            : state.currentIndex - 1
        }));
      },
      
      goToPost: (index) => {
        set((state) => ({
          currentIndex: Math.max(0, Math.min(index, state.posts.length - 1))
        }));
      },
      
      setAutoRotate: (autoRotate) => {
        set({ autoRotate });
      },
      
      setRotationInterval: (interval) => {
        set({ rotationInterval: interval });
      },
      
      markPostsAsViewed: () => {
        set((state) => ({
          posts: state.posts.map(post => ({ ...post, isNew: false }))
        }));
      },
      
      updateStats: () => {
        const state = get();
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        
        const recentPosts = state.posts.filter(post => post.addedAt > oneMinuteAgo);
        
        set({
          postsPerMinute: recentPosts.length,
        });
      },
    }),
    {
      name: 'live-feed-store',
    }
  )
);
