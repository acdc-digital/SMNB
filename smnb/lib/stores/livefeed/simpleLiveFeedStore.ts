import { create } from 'zustand';
import { EnhancedRedditPost } from '@/lib/types/enhancedRedditPost';

// Helper function to get host agent store without circular dependency
const getHostAgentStore = () => {
  // Lazy import to avoid circular dependency
  return import('@/lib/stores/host/hostAgentStore').then(
    module => module.useHostAgentStore.getState()
  );
};

// Helper function to get Convex client
const getConvexClient = () => {
  return import('@/lib/convex').then(module => module.default);
};

export interface LiveFeedPost {
  id: string;
  title: string;
  author: string;
  subreddit: string;
  url: string;
  permalink: string;
  score: number;
  num_comments: number;
  created_utc: number;
  thumbnail: string;
  selftext: string;
  is_video: boolean;
  domain: string;
  upvote_ratio: number;
  over_18: boolean;
  source: 'reddit';
  addedAt: number;
  batchId: number;
  isNew?: boolean;
  sort_type?: 'live' | 'hot' | 'top' | 'rising';
  fetched_at?: number;
  sessionId?: string; // Track which session this post came from
  
  // Enhanced fields (optional - from processing pipeline)
  priority_score?: number;
  quality_score?: number;
  categories?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
}

// Story from Host/Editor for history view
export interface CompletedStory {
  id: string;
  narrative: string;
  tone: 'breaking' | 'developing' | 'analysis' | 'opinion' | 'human-interest';
  priority: 'high' | 'medium' | 'low';
  timestamp: Date;
  duration: number; // reading time in seconds
  originalItem?: {
    title: string;
    author: string;
    subreddit?: string;
    url?: string;
  };
  sentiment?: 'positive' | 'negative' | 'neutral';
  topics?: string[];
  summary?: string;
}

interface SimpleLiveFeedStore {
  // State
  posts: LiveFeedPost[];
  isLive: boolean;
  contentMode: 'sfw' | 'nsfw';
  selectedSubreddits: string[];
  refreshInterval: number;
  maxPosts: number;
  
  // View mode for switching between live posts and story history
  viewMode: 'live' | 'history';
  
  // Story history from Host/Editor
  storyHistory: CompletedStory[];
  maxStoryHistory: number;
  
  // Status
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
  totalPostsFetched: number;
  currentSessionId: string; // Track current session for posts
  
  // Actions
  setPosts: (posts: LiveFeedPost[]) => void;
  addPost: (post: LiveFeedPost) => void;
  clearPosts: () => void;
  clearOldPosts: () => void;
  manualClearPosts: () => void; // New action for manual clearing
  
  // View mode actions
  setViewMode: (mode: 'live' | 'history') => void;
  toggleViewMode: () => void;
  
  // Story history actions
  addCompletedStory: (story: CompletedStory) => void;
  clearStoryHistory: () => void;
  addTestStory: () => void; // For testing
  
  // Convex integration
  loadStoriesFromConvex: () => Promise<void>;
  saveStoryToConvex: (story: CompletedStory) => Promise<void>;
  
  // Controls
  setIsLive: (isLive: boolean) => void;
  setContentMode: (mode: 'sfw' | 'nsfw') => void;
  setSelectedSubreddits: (subreddits: string[]) => void;
  setRefreshInterval: (interval: number) => void;
  
  // Status actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateStats: () => void;
}

export const useSimpleLiveFeedStore = create<SimpleLiveFeedStore>((set, get) => ({
  // Initial state
  posts: [],
  isLive: false,
  contentMode: 'sfw',
  selectedSubreddits: ['all', 'news', 'worldnews', 'technology', 'gaming', 'funny', 'todayilearned', 'askreddit'],
  refreshInterval: 30,
  maxPosts: 50,
  
  // View mode
  viewMode: 'live',
  
  // Story history
  storyHistory: [],
  maxStoryHistory: 100,
  
  // Status
  isLoading: false,
  error: null,
  lastFetch: null,
  totalPostsFetched: 0,
  currentSessionId: `session-${Date.now()}`,
  
  // Actions
  setPosts: (posts) => {
    set((state) => {
      console.log(`📋 Setting ${posts.length} posts`);
      
      // Notify host agent of all new posts (async)
      getHostAgentStore().then(hostStore => {
        if (hostStore && hostStore.processLiveFeedPost) {
          posts.forEach(post => {
            // Convert LiveFeedPost to EnhancedRedditPost format
            const enhancedPost: EnhancedRedditPost = {
              ...post,
              fetch_timestamp: Date.now(),
              engagement_score: post.score + post.num_comments,
              processing_status: 'raw' as const
            };
            hostStore.processLiveFeedPost(enhancedPost);
          });
        }
      }).catch(error => {
        console.error('❌ Failed to notify host agent of bulk posts:', error);
      });
      
      return {
        posts: posts.slice(0, state.maxPosts), // Ensure we don't exceed max
        lastFetch: Date.now(),
      };
    });
  },
  
  addPost: (post) => {
    set((state) => {
      // Check for duplicates
      const exists = state.posts.some(p => p.id === post.id);
      if (exists) {
        console.log(`🚫 Duplicate post: ${post.title.substring(0, 30)}...`);
        return state;
      }
      
      // Add to beginning (newest first) and limit
      const newPosts = [
        { 
          ...post, 
          addedAt: Date.now(), 
          isNew: true,
          sessionId: state.currentSessionId // Tag with current session
        },
        ...state.posts
      ].slice(0, state.maxPosts);
      
      console.log(`✅ Added post: ${post.title.substring(0, 30)}...`);
      console.log(`📊 Total posts: ${newPosts.length}`);
      
      // Notify host agent of new post (async)
      getHostAgentStore().then(hostStore => {
        if (hostStore && hostStore.processLiveFeedPost) {
          // Convert LiveFeedPost to EnhancedRedditPost format
          const enhancedPost: EnhancedRedditPost = {
            ...post,
            fetch_timestamp: Date.now(),
            engagement_score: post.score + post.num_comments,
            processing_status: 'raw' as const
          };
          console.log(`🎙️ FEED: Notifying host agent of new post: ${post.title.substring(0, 30)}...`);
          hostStore.processLiveFeedPost(enhancedPost);
        } else {
          console.log('📴 FEED: Host agent not available or not active');
        }
      }).catch(error => {
        console.error('❌ FEED: Failed to notify host agent:', error);
      });
      
      return {
        posts: newPosts,
        totalPostsFetched: state.totalPostsFetched + 1,
      };
    });
    
    // Remove new flag after animation (extended duration for better visibility)
    setTimeout(() => {
      set((state) => ({
        posts: state.posts.map(p => p.isNew ? { ...p, isNew: false } : p)
      }));
      console.log('🎬 Animation flag removed for new posts');
    }, 2000); // Increased from 1000ms to 2000ms
  },
  
  clearOldPosts: () => {
    set((state) => {
      // Keep only posts from the last 10 minutes to allow for fresh content
      const cutoffTime = Date.now() - (10 * 60 * 1000);
      const filteredPosts = state.posts.filter(post => post.addedAt > cutoffTime);
      
      console.log(`🧹 Cleared ${state.posts.length - filteredPosts.length} old posts (older than 10 min)`);
      
      return {
        posts: filteredPosts,
      };
    });
  },
  
  clearPosts: () => {
    set({ posts: [], totalPostsFetched: 0, lastFetch: null });
  },

  manualClearPosts: () => {
    set(() => ({ 
      posts: [], 
      totalPostsFetched: 0, 
      lastFetch: null,
      currentSessionId: `session-${Date.now()}` // Generate new session ID
    }));
    console.log('🗑️ Posts manually cleared by user');
  },
  
  // Controls
  setIsLive: (isLive) => {
    set((state) => ({
      isLive,
      // Generate new session ID when starting live feed
      currentSessionId: isLive ? `session-${Date.now()}` : state.currentSessionId
    }));
    // Don't clear posts when toggling live feed - keep existing posts
    if (!isLive) {
      console.log('⏸️ Live feed paused - keeping existing posts');
    } else {
      console.log('▶️ Live feed resumed - will add new posts to existing ones');
    }
  },
  
  setContentMode: (contentMode) => {
    set({ contentMode });
    // Don't clear posts when changing content mode - keep existing posts
    console.log(`🔄 Content mode changed to ${contentMode} - keeping existing posts`);
  },
  
  setSelectedSubreddits: (selectedSubreddits) => {
    set({ selectedSubreddits });
    // Don't clear posts when changing subreddits - keep existing posts
    console.log(`🔄 Subreddits changed - keeping existing posts`);
  },
  
  setRefreshInterval: (refreshInterval) => {
    set({ refreshInterval });
  },
  
  // Status actions
  setLoading: (isLoading) => {
    set({ isLoading });
  },
  
  setError: (error) => {
    set({ error });
  },

  updateStats: () => {
    // This can be extended later if needed to calculate stats
    const { totalPostsFetched, lastFetch } = get();
    if (lastFetch && totalPostsFetched > 0) {
      console.log(`📊 Stats: ${totalPostsFetched} posts fetched since ${new Date(lastFetch).toLocaleTimeString()}`);
    }
  },

  // View mode actions
  setViewMode: (viewMode) => {
    set({ viewMode });
    console.log(`🔄 View mode changed to: ${viewMode}`);
  },

  toggleViewMode: () => {
    const { viewMode } = get();
    const newMode = viewMode === 'live' ? 'history' : 'live';
    set({ viewMode: newMode });
    console.log(`🔄 Toggled view mode from ${viewMode} to ${newMode}`);
  },

  // Story history actions
  addCompletedStory: (story) => {
    set((state) => {
      const newHistory = [story, ...state.storyHistory];
      // Keep only the most recent stories within the limit
      const trimmedHistory = newHistory.slice(0, state.maxStoryHistory);
      console.log(`📚 Added completed story: "${story.narrative.substring(0, 50)}..." (${trimmedHistory.length} total)`);
      return { storyHistory: trimmedHistory };
    });
    
    // Also save to Convex asynchronously
    get().saveStoryToConvex(story);
  },

  clearStoryHistory: () => {
    set({ storyHistory: [] });
    console.log('🗑️ Cleared story history');
  },

  // For testing - add a sample story
  addTestStory: () => {
    const testStory = {
      id: `test-story-${Date.now()}`,
      narrative: "Breaking news from the technology sector: A major breakthrough in artificial intelligence has been announced by researchers, potentially revolutionizing how we approach machine learning and natural language processing. The implications for the future of computing are significant.",
      tone: 'breaking' as const,
      priority: 'high' as const,
      timestamp: new Date(),
      duration: 45,
      originalItem: {
        title: "AI Breakthrough Changes Everything",
        author: "tech_reporter",
        subreddit: "technology",
        url: "https://reddit.com/r/technology/sample"
      },
      sentiment: 'positive' as const,
      topics: ['AI', 'Technology', 'Research'],
      summary: 'Major AI breakthrough announced with significant implications for computing'
    };
    
    set((state) => {
      const newHistory = [testStory, ...state.storyHistory];
      const trimmedHistory = newHistory.slice(0, state.maxStoryHistory);
      console.log(`🧪 Added test story for demonstration purposes`);
      return { storyHistory: trimmedHistory };
    });
  },

  // Convex integration methods
  loadStoriesFromConvex: async () => {
    try {
      const convexClient = await getConvexClient();
      const { api } = await import('@/convex/_generated/api');
      
      // Load recent stories from Convex
      const convexStories = await convexClient.query(api.storyHistory.getRecentStories, { 
        hours: 24 
      });
      
      // Convert Convex stories to CompletedStory format
      const stories: CompletedStory[] = convexStories.map(story => ({
        id: story.story_id,
        narrative: story.narrative,
        tone: story.tone,
        priority: story.priority,
        timestamp: new Date(story.completed_at),
        duration: story.duration,
        originalItem: story.original_item,
        sentiment: story.sentiment,
        topics: story.topics,
        summary: story.summary,
      }));
      
      set({ storyHistory: stories });
      console.log(`📚 Loaded ${stories.length} stories from Convex`);
    } catch (error) {
      console.error('❌ Failed to load stories from Convex:', error);
    }
  },

  saveStoryToConvex: async (story: CompletedStory) => {
    try {
      const convexClient = await getConvexClient();
      const { api } = await import('@/convex/_generated/api');
      
      // Determine agent type from story ID prefix or context
      let agentType: 'host' | 'editor' = 'host'; // Default to host
      if (story.id.includes('editor') || story.id.startsWith('editor-')) {
        agentType = 'editor';
      } else if (story.id.includes('host') || story.id.startsWith('host-')) {
        agentType = 'host';
      }
      
      await convexClient.mutation(api.storyHistory.addStory, {
        story_id: story.id,
        narrative: story.narrative,
        title: story.originalItem?.title,
        tone: story.tone,
        priority: story.priority,
        agent_type: agentType,
        duration: story.duration,
        word_count: story.narrative.trim().split(/\s+/).length,
        sentiment: story.sentiment,
        topics: story.topics,
        summary: story.summary,
        created_at: Date.now(),
        completed_at: story.timestamp.getTime(),
        original_item: story.originalItem,
      });
      
      console.log(`💾 Saved story to Convex: ${story.id} (${agentType})`);
    } catch (error) {
      console.error('❌ Failed to save story to Convex:', error);
      // Don't throw - this shouldn't break the normal flow
    }
  },
}));
