// SIMPLE LIVE FEED STORE
// /Users/matthewsimon/Projects/SMNB/smnb/lib/stores/livefeed/simpleLiveFeedStore.ts

import { create } from 'zustand';
import { EnhancedRedditPost } from '@/lib/types/enhancedRedditPost';
import { StoryThread, StoryUpdate } from '@/lib/types/storyThread';

// Helper function to get host agent store without circular dependency
const getHostAgentStore = () => {
  // Lazy import to avoid circular dependency
  return import('@/lib/stores/host/hostAgentStore').then(
    module => module.useHostAgentStore.getState()
  );
};

// Helper function to get story thread store
const getStoryThreadStore = () => {
  return import('@/lib/stores/livefeed/storyThreadStore').then(
    module => module.useStoryThreadStore.getState()
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
  
  // Story thread fields
  threadId?: string; // ID of the story thread this post belongs to
  isThreadUpdate?: boolean; // Whether this post is an update to existing thread
  updateType?: StoryUpdate['updateType']; // Type of update if it's an update
  threadTopic?: string; // Topic of the thread for display
  updateBadge?: {
    isVisible: boolean;
    text: string; // e.g., "UPDATED", "BREAKING UPDATE", "FOLLOW-UP"
    type: 'update' | 'breaking' | 'follow_up' | 'correction';
    timestamp: number;
  };
}

// Story from Host/Editor for history view
export interface CompletedStory {
  id: string;
  narrative: string;
  title?: string; // LLM-generated title for the narrated storyline
  tone: 'breaking' | 'developing' | 'analysis' | 'opinion' | 'human-interest';
  priority: 'high' | 'medium' | 'low';
  timestamp: Date;
  duration: number; // reading time in seconds
  originalItem?: {
    title: string;
    author: string;
    subreddit?: string;
    url?: string;
    thumbnail?: string;
    is_video?: boolean;
  };
  sentiment?: 'positive' | 'negative' | 'neutral';
  topics?: string[];
  summary?: string;
  
  // Story thread fields
  threadId?: string; // ID of the story thread this story belongs to
  isThreadUpdate?: boolean; // Whether this story is an update to existing thread
  updateType?: StoryUpdate['updateType']; // Type of update if it's an update
  threadTopic?: string; // Topic of the thread for display
  updateCount?: number; // Number of updates in the thread
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
  
  // Thread-aware state
  activeThreads: string[]; // List of active thread IDs being displayed
  threadUpdateCooldown: Map<string, number>; // Cooldown periods for thread updates
  
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
  clearAllState: () => void; // New action for complete state reset
  
  // Thread-aware actions
  processPostWithThreads: (post: EnhancedRedditPost) => Promise<LiveFeedPost>;
  addThreadUpdate: (post: LiveFeedPost, threadId: string, updateType: StoryUpdate['updateType']) => void;
  markThreadUpdate: (postId: string, threadInfo: { threadId: string; updateType: StoryUpdate['updateType']; threadTopic: string }) => void;
  hideUpdateBadge: (postId: string) => void;
  getThreadPosts: (threadId: string) => LiveFeedPost[];
  
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

// Helper functions for badge formatting
const formatUpdateBadgeText = (updateType: StoryUpdate['updateType']): string => {
  switch (updateType) {
    case 'new_development': return 'UPDATED';
    case 'follow_up': return 'FOLLOW-UP';
    case 'clarification': return 'CLARIFIED';
    case 'correction': return 'CORRECTED';
    default: return 'UPDATED';
  }
};

const mapUpdateTypeToBadgeType = (updateType: StoryUpdate['updateType']): 'update' | 'breaking' | 'follow_up' | 'correction' => {
  switch (updateType) {
    case 'new_development': return 'breaking';
    case 'follow_up': return 'follow_up';
    case 'clarification': return 'update';
    case 'correction': return 'correction';
    default: return 'update';
  }
};

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
  
  // Thread-aware state
  activeThreads: [],
  threadUpdateCooldown: new Map(),
  
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

  // Thread-aware processing method
  processPostWithThreads: async (post: EnhancedRedditPost): Promise<LiveFeedPost> => {
    try {
      // Process through story thread system
      const threadStore = await getStoryThreadStore();
      const threadResult = await threadStore.processPostForThreads(post);
      
      // Convert to LiveFeedPost
      const liveFeedPost: LiveFeedPost = {
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
        addedAt: Date.now(),
        batchId: 0,
        priority_score: post.priority_score,
        quality_score: post.quality_score,
        categories: post.categories,
        sentiment: post.sentiment,
        // Thread information
        threadId: threadResult.threadId,
        isThreadUpdate: threadResult.isUpdate,
        updateType: threadResult.updateType
      };

      // Add thread topic from thread store
      if (threadResult.threadId) {
        const thread = threadStore.getThreadById(threadResult.threadId);
        if (thread) {
          liveFeedPost.threadTopic = thread.topic;
        }
      }

      // Add update badge if this is an update
      if (threadResult.isUpdate && threadResult.updateType) {
        liveFeedPost.updateBadge = {
          isVisible: true,
          text: formatUpdateBadgeText(threadResult.updateType),
          type: mapUpdateTypeToBadgeType(threadResult.updateType),
          timestamp: Date.now()
        };

        // Hide badge after 30 seconds
        setTimeout(() => {
          get().hideUpdateBadge(post.id);
        }, 30000);
      }

      console.log(`🧵 Processed post with threads: ${post.title.substring(0, 30)}... (Thread: ${threadResult.threadId}, Update: ${threadResult.isUpdate})`);
      return liveFeedPost;
      
    } catch (error) {
      console.error('❌ Failed to process post with threads:', error);
      // Fallback to regular processing
      return {
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
        addedAt: Date.now(),
        batchId: 0,
        priority_score: post.priority_score,
        quality_score: post.quality_score,
        categories: post.categories,
        sentiment: post.sentiment
      };
    }
  },

  addThreadUpdate: (post: LiveFeedPost, threadId: string, updateType: StoryUpdate['updateType']) => {
    set((state) => {
      // Check cooldown for this thread
      const cooldownKey = threadId;
      const lastUpdate = state.threadUpdateCooldown.get(cooldownKey) || 0;
      const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
      
      if (Date.now() - lastUpdate < COOLDOWN_MS) {
        console.log(`⏳ Thread update cooldown active for ${threadId}, skipping`);
        return state;
      }

      // Update the post with thread information
      const updatedPost: LiveFeedPost = {
        ...post,
        threadId,
        isThreadUpdate: true,
        updateType,
        updateBadge: {
          isVisible: true,
          text: formatUpdateBadgeText(updateType),
          type: mapUpdateTypeToBadgeType(updateType),
          timestamp: Date.now()
        }
      };

      // Add to front of list (newest first)
      const newPosts = [updatedPost, ...state.posts].slice(0, state.maxPosts);
      
      // Update cooldown
      const newCooldownMap = new Map(state.threadUpdateCooldown);
      newCooldownMap.set(cooldownKey, Date.now());

      // Track active thread
      const newActiveThreads = state.activeThreads.includes(threadId)
        ? state.activeThreads
        : [...state.activeThreads, threadId];

      console.log(`🔄 Added thread update: ${post.title.substring(0, 30)}... (Thread: ${threadId})`);
      
      return {
        posts: newPosts,
        activeThreads: newActiveThreads,
        threadUpdateCooldown: newCooldownMap,
        totalPostsFetched: state.totalPostsFetched + 1
      };
    });

    // Hide update badge after 30 seconds
    setTimeout(() => {
      get().hideUpdateBadge(post.id);
    }, 30000);
  },

  markThreadUpdate: (postId: string, threadInfo: { threadId: string; updateType: StoryUpdate['updateType']; threadTopic: string }) => {
    set((state) => ({
      posts: state.posts.map(post =>
        post.id === postId
          ? {
              ...post,
              threadId: threadInfo.threadId,
              isThreadUpdate: true,
              updateType: threadInfo.updateType,
              threadTopic: threadInfo.threadTopic,
              updateBadge: {
                isVisible: true,
                text: formatUpdateBadgeText(threadInfo.updateType),
                type: mapUpdateTypeToBadgeType(threadInfo.updateType),
                timestamp: Date.now()
              }
            }
          : post
      )
    }));
    
    console.log(`🏷️ Marked post as thread update: ${postId} (Thread: ${threadInfo.threadId})`);
    
    // Hide badge after 30 seconds
    setTimeout(() => {
      get().hideUpdateBadge(postId);
    }, 30000);
  },

  hideUpdateBadge: (postId: string) => {
    set((state) => ({
      posts: state.posts.map(post =>
        post.id === postId && post.updateBadge
          ? { ...post, updateBadge: { ...post.updateBadge, isVisible: false } }
          : post
      )
    }));
  },

  getThreadPosts: (threadId: string) => {
    const { posts } = get();
    return posts.filter(post => post.threadId === threadId);
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

  clearAllState: () => {
    set(() => {
      console.log('🗑️ COMPLETE STATE RESET: Clearing all live feed state');
      return {
        // Reset posts
        posts: [],
        totalPostsFetched: 0,
        lastFetch: null,
        
        // Reset story history 
        storyHistory: [],
        
        // Reset thread state
        activeThreads: [],
        threadUpdateCooldown: new Map(),
        
        // Reset session and generate new ID
        currentSessionId: `session-${Date.now()}`,
        
        // Reset status
        isLoading: false,
        error: null,
        
        // Keep user preferences (don't reset these)
        // isLive, contentMode, selectedSubreddits, refreshInterval, maxPosts, viewMode, maxStoryHistory
      };
    });
    console.log('✅ Complete live feed state reset completed');
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
        url: "https://reddit.com/r/technology/sample",
        thumbnail: "https://via.placeholder.com/320x240/1e40af/ffffff?text=AI+Breakthrough",
        is_video: false
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
        title: story.title, // Include the LLM-generated title
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
        title: story.title, // Use the LLM-generated story title
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

  // Maintenance integration methods
  triggerAutomatedMaintenance: async () => {
    try {
      const { feedMaintenanceService } = await import('@/lib/services/livefeed/feedMaintenanceService');
      console.log('⏰ Triggering automated maintenance from live feed...');
      const result = await feedMaintenanceService.automatedMaintenance();
      console.log('✅ Automated maintenance completed:', result);
      return result;
    } catch (error) {
      console.error('❌ Automated maintenance failed:', error);
      throw error;
    }
  },

  getFeedMaintenanceStats: async () => {
    try {
      const { feedMaintenanceService } = await import('@/lib/services/livefeed/feedMaintenanceService');
      const stats = await feedMaintenanceService.getFeedStats();
      console.log('📊 Retrieved feed maintenance stats:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Failed to get feed stats:', error);
      throw error;
    }
  },

  // Periodic maintenance check (called every time posts are added)
  checkMaintenanceRequirements: async () => {
    try {
      const { feedMaintenanceService } = await import('@/lib/services/livefeed/feedMaintenanceService');
      const requirements = await feedMaintenanceService.checkMaintenanceRequirements();
      
      // If we have too many posts, suggest maintenance
      if (requirements.needsMaintenance && requirements.totalPosts > 60) {
        console.log('⚠️ Feed has grown too large, automated maintenance recommended');
        // Could trigger automatic maintenance here if desired
        // await get().triggerAutomatedMaintenance();
      }
      
      return requirements;
    } catch (error) {
      console.error('❌ Failed to check maintenance requirements:', error);
      return null;
    }
  },
}));
