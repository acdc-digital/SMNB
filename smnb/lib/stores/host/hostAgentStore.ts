// HOST AGENT STORE
// /Users/matthewsimon/Projects/SMNB/smnb/lib/stores/host/hostAgentStore.ts

/**
 * Host Agent Store
 * 
 * Zustand store for managing the host agent service state
 * and providing shared access across components
 */

import { create } from 'zustand';
import { HostAgentService } from '@/lib/services/host/hostAgentService';
import { HostNarration, HostAgentConfig, DEFAULT_HOST_CONFIG, NewsItem } from '@/lib/types/hostAgent';
import { EnhancedRedditPost } from '@/lib/types/enhancedRedditPost';

// Helper function to convert EnhancedRedditPost to NewsItem
const convertRedditPostToNewsItem = (post: EnhancedRedditPost): NewsItem => {
  return {
    id: post.id,
    content: post.selftext || post.title,
    title: post.title,
    author: post.author,
    timestamp: new Date(post.created_utc * 1000),
    platform: 'reddit' as const,
    engagement: {
      likes: post.score,
      comments: post.num_comments,
      shares: 0 // Reddit doesn't have shares
    },
    subreddit: post.subreddit,
    url: post.url
  };
};

interface HostAgentState {
  // Service instance
  hostAgent: HostAgentService | null;
  
  // State
  isActive: boolean;
  currentNarration: HostNarration | null;
  
  // Streaming state
  isStreaming: boolean;
  streamingText: string;
  streamingNarrationId: string | null;
  
  // Narration queue for streaming
  narrationQueue: HostNarration[];
  
  // Persistent narration history
  narrationHistory: HostNarration[];
  maxHistorySize: number;
  
  // Statistics
  stats: {
    itemsProcessed: number;
    totalNarrations: number;
    queueLength: number;
    uptime: number;
  };
  
  // Configuration
  config: HostAgentConfig;
  
    // Actions
  initializeHostAgent: () => void;
  start: () => void;
  stop: () => void;
  processRedditPost: (post: EnhancedRedditPost) => Promise<void>;
  processLiveFeedPost: (post: EnhancedRedditPost) => void;
  
  // Streaming actions
  addToQueue: () => void;
  processNextInQueue: () => void;
  updateStreamingText: (text: string) => void;
  completeStreaming: () => void;
  
  // History actions
  addNarrationToHistory: (narration: HostNarration) => void;
  clearNarrationHistory: () => void;
  cleanup: () => void;
}

export const useHostAgentStore = create<HostAgentState>((set, get) => ({
  // Initial state
  hostAgent: null,
  isActive: false,
  currentNarration: null,
  
  // Streaming state
  isStreaming: false,
  streamingText: '',
  streamingNarrationId: null,
  
  // Narration queue
  narrationQueue: [],
  
  // History
  narrationHistory: [],
  maxHistorySize: 20, // Keep last 20 narrations
  stats: {
    itemsProcessed: 0,
    totalNarrations: 0,
    queueLength: 0,
    uptime: 0
  },
  config: DEFAULT_HOST_CONFIG,
  
  // Initialize the host agent service
  initializeHostAgent: () => {
    const { hostAgent } = get();
    
    // Don't re-initialize if already exists
    if (hostAgent) return;
    
    console.log('🤖 Initializing host agent service...');
    
    const agent = new HostAgentService(get().config);
    
    // Set up event listeners for streaming
    agent.on('narration:started', (narration: HostNarration) => {
      set({ 
        currentNarration: narration,
        isStreaming: true,
        streamingText: '',
        streamingNarrationId: narration.id
      });
      console.log('🎙️ HOST: Narration started:', narration.narrative.substring(0, 50) + '...');
    });
    
    agent.on('narration:streaming', (data: { narrationId: string; currentText: string }) => {
      const { streamingNarrationId } = get();
      console.log(`📡 HOST STORE: Received streaming data for ${data.narrationId}, current: ${streamingNarrationId}, chars: ${data.currentText.length}`);
      if (streamingNarrationId === data.narrationId) {
        set({ streamingText: data.currentText });
      }
    });
    
    agent.on('narration:completed', (narrationId: string, fullText: string) => {
      const { currentNarration } = get();
      if (currentNarration?.id === narrationId) {
        // Create completed narration with full text
        const completedNarration: HostNarration = {
          ...currentNarration,
          narrative: fullText
        };
        
        // Add completed narration to history
        get().addNarrationToHistory(completedNarration);
        console.log('✅ HOST: Narration completed and added to history');
        
        // Reset streaming state
        set({
          isStreaming: false,
          streamingText: '',
          streamingNarrationId: null,
          currentNarration: null
        });
        
        console.log(`✅ HOST: Narration completed, ${get().narrationQueue.length} items remaining in queue`);
      }
    });
    
    agent.on('narration:error', (narrationId: string, error: Error) => {
      console.error(`❌ HOST: Narration error for ${narrationId}:`, error);
      const { streamingNarrationId } = get();
      if (streamingNarrationId === narrationId) {
        set({
          isStreaming: false,
          streamingText: '',
          streamingNarrationId: null
        });
      }
    });
    
    agent.on('host:started', () => {
      console.log('📡 Host broadcasting started');
      set({ isActive: true });
    });
    
    agent.on('host:stopped', () => {
      console.log('📴 Host broadcasting stopped');
      set({ 
        isActive: false, 
        currentNarration: null 
      });
    });
    
    agent.on('queue:updated', (queueLength: number) => {
      set(state => ({
        stats: {
          ...state.stats,
          queueLength
        }
      }));
    });
    
    agent.on('narration:generated', () => {
      set(state => ({
        stats: {
          ...state.stats,
          totalNarrations: state.stats.totalNarrations + 1
        }
      }));
    });
    
    set({ hostAgent: agent });
    console.log('✅ Host agent service initialized');
  },
  
  // Start broadcasting
  startBroadcasting: () => {
    const { hostAgent } = get();
    if (!hostAgent) {
      console.error('❌ Host agent not initialized');
      return;
    }
    
    console.log('📡 Starting host broadcast...');
    hostAgent.start();
  },
  
  // Stop broadcasting
  stopBroadcasting: () => {
    const { hostAgent } = get();
    if (!hostAgent) {
      console.error('❌ Host agent not initialized');
      return;
    }
    
    console.log('📴 Stopping host broadcast...');
    hostAgent.stop();
  },
  
  // Update configuration
  updateConfig: (newConfig: Partial<HostAgentConfig>) => {
    const { hostAgent, config } = get();
    const updatedConfig = { ...config, ...newConfig };
    
    set({ config: updatedConfig });
    
    if (hostAgent) {
      // Update the agent's configuration
      hostAgent.updateConfig(updatedConfig);
    }
    
    console.log('⚙️ Host configuration updated:', newConfig);
  },
  
  // Process a live feed post through the host agent
  processLiveFeedPost: (post: EnhancedRedditPost) => {
    const { hostAgent, isActive } = get();
    
    if (!hostAgent) {
      console.warn('⚠️ Host agent not initialized, cannot process post');
      return;
    }
    
    if (!isActive) {
      console.log('📴 Host not broadcasting, skipping post:', post.title.substring(0, 30) + '...');
      return;
    }
    
    try {
      const newsItem = convertRedditPostToNewsItem(post);
      console.log(`📰 HOST STORE: Processing post for narration: ${post.title.substring(0, 50)}...`);
      hostAgent.processNewsItem(newsItem);
    } catch (error) {
      console.error('❌ HOST STORE: Failed to process live feed post:', error);
    }
  },
  
  // Start the host agent
  start: () => {
    const { hostAgent } = get();
    if (hostAgent) {
      hostAgent.start();
    }
  },
  
  // Stop the host agent  
  stop: () => {
    const { hostAgent } = get();
    if (hostAgent) {
      hostAgent.stop();
    }
  },
  
  // Process a Reddit post
  processRedditPost: async (post: EnhancedRedditPost) => {
    get().processLiveFeedPost(post);
  },
  
  // Legacy streaming actions (kept for interface compatibility)
  addToQueue: () => {
    // This is now handled by the streaming events from the service
    console.log('📝 HOST: Add to queue called (handled by streaming events)');
  },
  
  processNextInQueue: () => {
    // This is now handled by the service internally
    console.log('📝 HOST: Process next in queue called (handled by service)');
  },
  
  updateStreamingText: (text: string) => {
    set({ streamingText: text });
  },
  
  completeStreaming: () => {
    // This is now handled by streaming events
    console.log('📝 HOST: Complete streaming called (handled by streaming events)');
  },
  
  // Add narration to persistent history
  addNarrationToHistory: (narration: HostNarration) => {
    set((state) => {
      const newHistory = [
        { ...narration, timestamp: new Date() }, // Ensure fresh timestamp
        ...state.narrationHistory
      ].slice(0, state.maxHistorySize); // Keep only the most recent
      
      console.log(`📚 HOST: Added narration to history. Total: ${newHistory.length}`);
      
      // Also add completed story to live feed history
      import('@/lib/stores/livefeed/simpleLiveFeedStore').then(module => {
        const completedStory = {
          id: `host-${narration.id}`, // Prefix with 'host' for agent type identification
          narrative: narration.writtenStory || narration.narrative, // Use written story if available, fallback to narration
          tone: narration.tone,
          priority: narration.priority,
          timestamp: new Date(),
          duration: narration.duration,
          originalItem: narration.metadata?.originalItem ? {
            title: narration.metadata.originalItem.title || '',
            author: narration.metadata.originalItem.author,
            subreddit: narration.metadata.originalItem.subreddit,
            url: narration.metadata.originalItem.url,
          } : undefined,
          sentiment: narration.metadata?.sentiment,
          topics: narration.metadata?.topics,
          summary: narration.metadata?.summary,
        };
        
        const { addCompletedStory } = module.useSimpleLiveFeedStore.getState();
        addCompletedStory(completedStory);
        const storyType = narration.writtenStory ? "written story" : "narration";
        console.log(`📋 HOST: Added completed ${storyType} to live feed history: "${completedStory.narrative.substring(0, 50)}..."`);
      });
      
      return { narrationHistory: newHistory };
    });
  },
  
  // Clear narration history
  clearNarrationHistory: () => {
    set({ narrationHistory: [] });
    console.log('🗑️ HOST: Narration history cleared');
  },
  
  // Cleanup when component unmounts
  cleanup: () => {
    const { hostAgent } = get();
    if (hostAgent) {
      console.log('🧹 Cleaning up host agent service...');
      hostAgent.stop();
      hostAgent.removeAllListeners();
      set({ 
        hostAgent: null, 
        isActive: false, 
        currentNarration: null 
      });
    }
  }
}));
