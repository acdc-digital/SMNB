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

// Helper function to generate a title from narrative content
const generateStoryTitle = (narrative: string, tone: string): string => {
  // Extract the first sentence or key phrase
  const sentences = narrative.split(/[.!?]+/);
  const firstSentence = sentences[0]?.trim();
  
  if (!firstSentence) return 'Breaking News Update';
  
  // Remove common conversation starters and make it more title-like
  let title = firstSentence
    .replace(/^(Hey there,?\s*|Well,?\s*|So,?\s*|Breaking:?\s*|Update:?\s*)/i, '')
    .replace(/^(news watchers!?\s*|folks!?\s*)/i, '')
    .replace(/🇨🇦|🇺🇸|🌍|📈|📉|🔥|⚡|💰|🏢|🏛️|🎯/g, '') // Remove emojis
    .trim();
  
  // Truncate to approximately 3 lines (around 120-140 characters for typical fonts)
  const maxLength = 120;
  if (title.length > maxLength) {
    // Find a good breaking point (word boundary) near the limit
    const truncated = title.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    title = lastSpace > maxLength * 0.8 ? truncated.substring(0, lastSpace) : truncated;
    title += '...';
  }
  
  // Ensure it starts with a capital letter
  title = title.charAt(0).toUpperCase() + title.slice(1);
  
  // Add some context based on tone if title is very short
  if (title.length < 20) {
    switch (tone) {
      case 'breaking':
        return `Breaking: ${title}`;
      case 'developing':
        return `Developing: ${title}`;
      case 'analysis':
        return title.includes('Analysis') ? title : `${title}`;
      default:
        return title;
    }
  }
  
  return title;
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
  
  // Countdown state
  nextStoryCountdown: number; // seconds until next story (0 when narrating)
  countdownInterval: NodeJS.Timeout | null; // timer reference
  isGenerating: boolean; // true when generating narration (before streaming starts)
  
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
  
  // Countdown actions
  startCountdown: (seconds: number) => void;
  stopCountdown: () => void;
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
  
  // Countdown state
  nextStoryCountdown: 0,
  countdownInterval: null,
  isGenerating: false,
  
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
      // Don't stop countdown yet - let it continue until streaming actually starts
      
      set({ 
        currentNarration: narration,
        isStreaming: false, // Don't set to true until text actually appears
        streamingText: '',
        streamingNarrationId: narration.id,
        isGenerating: false
      });
      console.log('🎙️ HOST: Narration started:', narration.narrative.substring(0, 50) + '...');
    });
    
    agent.on('narration:streaming', (data: { narrationId: string; currentText: string }) => {
      const { streamingNarrationId, isStreaming } = get();
      console.log(`📡 HOST STORE: Received streaming data for ${data.narrationId}, current: ${streamingNarrationId}, chars: ${data.currentText.length}`);
      if (streamingNarrationId === data.narrationId) {
        // Set isStreaming to true and stop countdown only when text actually starts appearing
        if (!isStreaming && data.currentText.length > 0) {
          get().stopCountdown(); // Stop countdown when streaming actually begins
          set({ isStreaming: true, streamingText: data.currentText });
        } else {
          set({ streamingText: data.currentText });
        }
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
        
        // Start countdown for next story (get actual cooldown from service + 2s warm-up)
        const hostAgent = get().hostAgent;
        const cooldownSeconds = hostAgent 
          ? Math.ceil(hostAgent.getTimingConfig().NARRATION_COOLDOWN_MS / 1000) + 2
          : 6; // fallback to 6 seconds (4 + 2 warm-up)
        get().startCountdown(cooldownSeconds);
        
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
        const generatedTitle = generateStoryTitle(narration.narrative, narration.tone);
        const completedStory = {
          id: `host-${narration.id}`, // Prefix with 'host' for agent type identification
          narrative: narration.narrative,
          title: generatedTitle, // Use generated title instead of original Reddit title
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
        console.log(`📋 HOST: Added completed story to live feed history: "${narration.narrative.substring(0, 50)}..."`);
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
    const { hostAgent, countdownInterval } = get();
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
    // Clear countdown timer
    if (countdownInterval) {
      clearInterval(countdownInterval);
      set({ countdownInterval: null, nextStoryCountdown: 0 });
    }
  },
  
  // Start countdown timer
  startCountdown: (seconds: number) => {
    const { countdownInterval } = get();
    
    // Clear existing timer
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
    
    set({ nextStoryCountdown: seconds, isGenerating: false });
    
    const timer = setInterval(() => {
      const { nextStoryCountdown } = get();
      if (nextStoryCountdown > 0) {
        const newCount = nextStoryCountdown - 1;
        set({ nextStoryCountdown: newCount });
        
        // Start generating when countdown reaches 2 (warm-up period)
        if (newCount === 2) {
          set({ isGenerating: true });
        }
      } else {
        // Countdown finished
        clearInterval(timer);
        set({ countdownInterval: null, nextStoryCountdown: 0 });
      }
    }, 1000);
    
    set({ countdownInterval: timer });
  },
  
  // Stop countdown timer
  stopCountdown: () => {
    const { countdownInterval } = get();
    if (countdownInterval) {
      clearInterval(countdownInterval);
      set({ countdownInterval: null, nextStoryCountdown: 0, isGenerating: false });
    }
  }
}));
