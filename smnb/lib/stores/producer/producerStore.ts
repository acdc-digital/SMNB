// PRODUCER STORE
// /Users/matthewsimon/Projects/SMNB/smnb/lib/stores/producer/producerStore.ts

/**
 * Producer Agent Store
 * 
 * Zustand store for managing Producer agent state and integration
 * with Host/Editor agents and live feed context updates
 */

import { create } from 'zustand';
import { ProducerAgentService, ProducerState, ContextData, DuplicateAnalysis } from '@/lib/services/producer/producerAgentService';
import { EnhancedRedditPost } from '@/lib/types/enhancedRedditPost';
import { StoryThread, StoryUpdate } from '@/lib/types/storyThread';

interface ProducerStoreState extends ProducerState {
  service: ProducerAgentService | null;
  
  // Actions
  initializeProducer: () => void;
  startProducer: () => Promise<void>;
  stopProducer: () => Promise<void>;
  getContextForPost: (postId: string) => ContextData[];
  getDuplicateAnalysis: (postId: string) => DuplicateAnalysis | null;
  sendContextToAgents: (contextData: ContextData[]) => Promise<void>;
  sendContextToHost: (producerContext: any) => void;
  sendContextToEditor: (producerContext: any) => void;
  // New methods for Producer integration
  getPostMetrics: (postId: string) => DuplicateAnalysis | null;
  requestAnalysis: (post: EnhancedRedditPost) => Promise<void>;
  cleanup: () => void;
  
  // Thread-aware methods
  sendThreadAwareContext: (contextData: ContextData[], threadId?: string, isUpdate?: boolean) => Promise<void>;
  getThreadContext: (threadId: string) => ContextData[];
  analyzeThreadRelevance: (post: EnhancedRedditPost, threadId: string) => Promise<number>;
}

export const useProducerStore = create<ProducerStoreState>((set, get) => {
  let service: ProducerAgentService | null = null;

  return {
    // Initial state
    isActive: false,
    currentSearches: new Map(),
    contextData: [],
    duplicateAnalyses: new Map(),
    trends: [],
    stats: {
      searchesPerformed: 0,
      duplicatesAnalyzed: 0,
      contextUpdatesProvided: 0,
      trendsIdentified: 0,
      uptime: 0
    },
    service: null,

    // Actions
    initializeProducer: () => {
      if (service) {
        console.log('🏭 Producer Store: Service already initialized');
        return;
      }

      console.log('🏭 Producer Store: Creating new ProducerAgentService...');
      service = new ProducerAgentService();
      
      // Set up event listeners
      service.on('producer:started', () => {
        const state = service!.getState();
        set({ ...state, service });
        console.log('🏭 Producer Store: Producer started');
      });

      service.on('producer:stopped', () => {
        const state = service!.getState();
        set({ ...state, service });
        console.log('🏭 Producer Store: Producer stopped');
      });

      service.on('producer:search_completed', (keyword: string, resultCount: number) => {
        const state = service!.getState();
        set({ ...state, service });
        console.log(`🏭 Producer Store: Search completed for "${keyword}" - ${resultCount} results`);
      });

      service.on('producer:duplicate_analyzed', (postId: string) => {
        const state = service!.getState();
        set({ ...state, service });
        console.log(`🏭 Producer Store: Duplicate analysis completed for post ${postId}`);
      });

      service.on('producer:context_update', (contextData: ContextData[]) => {
        const state = service!.getState();
        set({ ...state, service });
        console.log(`🏭 Producer Store: Context update provided - ${contextData.length} items`);
        
        // Send context to Host and Editor agents
        get().sendContextToAgents(contextData);
      });

      service.on('producer:stats_updated', (stats: ProducerState['stats']) => {
        set({ stats, service });
      });

      service.on('producer:post_analyzed', (postId: string) => {
        const state = service!.getState();
        set({ ...state, service });
        console.log(`🏭 Producer Store: Post analysis completed for ${postId}`);
      });

      // Important: Set the service in the store state
      set({ service });
      console.log('🏭 Producer Store: Initialized with service:', !!service);
    },

    startProducer: async () => {
      let currentService = get().service;
      if (!currentService) {
        console.log('🏭 Producer Store: Service not initialized, initializing now...');
        get().initializeProducer();
        currentService = get().service;
        
        if (!currentService) {
          console.error('🏭 Producer Store: Failed to initialize service');
          return;
        }
      }

      try {
        console.log('🏭 Producer Store: Starting producer service...');
        await currentService.start();
        const state = currentService.getState();
        set({ ...state, service: currentService });
      } catch (error) {
        console.error('🏭 Producer Store: Failed to start:', error);
      }
    },

    stopProducer: async () => {
      const currentService = get().service;
      if (!currentService) {
        console.log('🏭 Producer Store: No service to stop');
        return;
      }

      try {
        console.log('🏭 Producer Store: Stopping producer service...');
        await currentService.stop();
        const state = currentService.getState();
        set({ ...state, service: currentService });
      } catch (error) {
        console.error('🏭 Producer Store: Failed to stop:', error);
      }
    },

    getContextForPost: (postId: string): ContextData[] => {
      const { contextData } = get();
      return contextData.filter(context => 
        context.sourcePost.id === postId || 
        context.relatedPosts.some(post => post.id === postId)
      );
    },

    getDuplicateAnalysis: (postId: string): DuplicateAnalysis | null => {
      const { duplicateAnalyses } = get();
      return duplicateAnalyses.get(postId) || null;
    },

    // New method: Get metrics for a specific post (alias for getDuplicateAnalysis)
    getPostMetrics: (postId: string): DuplicateAnalysis | null => {
      const { duplicateAnalyses } = get();
      return duplicateAnalyses.get(postId) || null;
    },

    // New method: Request Producer analysis for a post
    requestAnalysis: async (post: EnhancedRedditPost) => {
      const currentService = get().service;
      if (!currentService || !get().isActive) {
        console.log('🏭 Producer Store: Service not active, cannot request analysis');
        return;
      }

      try {
        console.log(`🏭 Producer Store: Requesting analysis for post ${post.id}`);
        await currentService.analyzeLiveFeedPost(post);
        
        // Update state with latest service state
        const state = currentService.getState();
        set({ ...state, service: currentService });
        
        console.log(`🏭 Producer Store: Analysis completed for post ${post.id}`);
      } catch (error) {
        console.error(`🏭 Producer Store: Failed to analyze post ${post.id}:`, error);
      }
    },

    // Integration method to send context to other agents
    sendContextToAgents: async (contextData: ContextData[]) => {
      try {
        // Convert ContextData to ProducerContextData format for Host/Editor
        contextData.forEach(context => {
          const producerContext = {
            postId: context.sourcePost.id,
            engagementMetrics: {
              totalScore: context.sourcePost.score,
              comments: context.sourcePost.num_comments,
              subredditDiversity: context.relatedPosts?.length || 0,
            },
            relatedDiscussions: context.relatedPosts?.map(post => ({
              subreddit: post.subreddit,
              title: post.title,
              score: post.score,
            })),
            trendData: {
              isBreaking: context.relevanceScore > 0.8, // Use relevanceScore as proxy for breaking news
              isDeveloping: context.relatedPosts && context.relatedPosts.length > 3,
              keywords: context.keywords || [],
            },
            receivedAt: Date.now(),
          };

          // ✅ FIXED: Actually send data to Host Agent via event emission
          get().sendContextToHost(producerContext);

          // ✅ FIXED: Actually send data to Editor Agent via event emission
          get().sendContextToEditor(producerContext);
        });

        console.log(`🏭 Producer Store: Successfully sent context for ${contextData.length} items to agents`);

      } catch (error) {
        console.error('🏭 Producer Store: Failed to send context to agents:', error);
      }
    },

    // ✅ NEW: Helper method to send context to Host Agent
    sendContextToHost: (producerContext: any) => {
      try {
        // Import and get Host Agent service directly
        import('@/lib/stores/host/hostAgentStore').then(module => {
          const { useHostAgentStore } = module;
          const hostStore = useHostAgentStore.getState();

          if (hostStore.isActive && hostStore.hostAgent) {
            // Emit context:host event that the Host Agent Service listens for
            hostStore.hostAgent.emit('context:host', producerContext);
            console.log(`🏭➡️🎙️ Sent Producer context to Host Agent for post ${producerContext.postId}`);
          } else {
            console.log('🏭➡️🎙️ Host Agent not active, skipping context send');
          }
        }).catch(error => {
          console.error('🏭➡️🎙️ Failed to send context to Host Agent:', error);
        });
      } catch (error) {
        console.error('🏭➡️🎙️ Error sending context to Host Agent:', error);
      }
    },

    // ✅ NEW: Helper method to send context to Editor Agent
    sendContextToEditor: (producerContext: any) => {
      try {
        // Import and get Editor Agent service directly
        import('@/lib/stores/host/editorAgentStore').then(module => {
          const { useEditorAgentStore } = module;
          const editorStore = useEditorAgentStore.getState();

          if (editorStore.isActive && editorStore.editorAgent) {
            // Emit context:editor event that the Editor Agent Service listens for
            editorStore.editorAgent.emit('context:editor', producerContext);
            console.log(`🏭➡️✍️ Sent Producer context to Editor Agent for post ${producerContext.postId}`);
          } else {
            console.log('🏭➡️✍️ Editor Agent not active, skipping context send');
          }
        }).catch(error => {
          console.error('🏭➡️✍️ Failed to send context to Editor Agent:', error);
        });
      } catch (error) {
        console.error('🏭➡️✍️ Error sending context to Editor Agent:', error);
      }
    },

    cleanup: () => {
      const currentService = get().service;
      if (currentService) {
        currentService.stop();
        currentService.removeAllListeners();
      }
      service = null;
      set({
        service: null,
        isActive: false,
        currentSearches: new Map(),
        contextData: [],
        duplicateAnalyses: new Map(),
        trends: [],
        stats: {
          searchesPerformed: 0,
          duplicatesAnalyzed: 0,
          contextUpdatesProvided: 0,
          trendsIdentified: 0,
          uptime: 0
        }
      });
      console.log('🏭 Producer Store: Cleaned up');
    },

    // Thread-aware context method
    sendThreadAwareContext: async (contextData: ContextData[], threadId?: string, isUpdate?: boolean) => {
      try {
        // Get story thread store for thread information
        const storyThreadStore = await import('@/lib/stores/livefeed/storyThreadStore').then(
          module => module.useStoryThreadStore.getState()
        );

        // Convert ContextData to thread-aware ProducerContextData format
        contextData.forEach(context => {
          let threadInfo = null;
          
          // Get thread information if threadId is provided
          if (threadId) {
            const thread = storyThreadStore.getThreadById(threadId);
            if (thread) {
              threadInfo = {
                threadId: thread.id,
                threadTopic: thread.topic,
                threadSignificance: thread.significanceScore,
                updateCount: thread.updateCount,
                isUpdate: isUpdate || false,
                relatedThreads: thread.relatedThreads || []
              };
            }
          }

          const producerContext = {
            postId: context.sourcePost.id,
            engagementMetrics: {
              totalScore: context.sourcePost.score,
              comments: context.sourcePost.num_comments,
              subredditDiversity: context.relatedPosts?.length || 0,
            },
            relatedDiscussions: context.relatedPosts?.map(post => ({
              subreddit: post.subreddit,
              title: post.title,
              score: post.score,
            })),
            trendData: {
              isBreaking: context.relevanceScore > 0.8,
              isDeveloping: context.relatedPosts && context.relatedPosts.length > 3,
              keywords: context.keywords || [],
            },
            // Thread-aware context
            threadContext: threadInfo,
            receivedAt: Date.now(),
          };

          // Send enhanced context to Host and Editor agents
          get().sendContextToHost(producerContext);
          get().sendContextToEditor(producerContext);
        });

        console.log(`🧵 Producer Store: Successfully sent thread-aware context for ${contextData.length} items (Thread: ${threadId}, Update: ${isUpdate})`);

      } catch (error) {
        console.error('🧵 Producer Store: Failed to send thread-aware context:', error);
      }
    },

    getThreadContext: (threadId: string): ContextData[] => {
      const { contextData } = get();
      // Filter context data for posts that might be related to the thread
      return contextData.filter(context => {
        // This could be enhanced with more sophisticated thread relevance checking
        return context.keywords?.some(keyword =>
          threadId.toLowerCase().includes(keyword.toLowerCase())
        ) || false;
      });
    },

    analyzeThreadRelevance: async (post: EnhancedRedditPost, threadId: string): Promise<number> => {
      try {
        // Get story thread store for thread information
        const storyThreadStore = await import('@/lib/stores/livefeed/storyThreadStore').then(
          module => module.useStoryThreadStore.getState()
        );

        const thread = storyThreadStore.getThreadById(threadId);
        if (!thread) {
          return 0;
        }

        // Simple relevance calculation based on keyword and entity overlap
        const postText = `${post.title} ${post.selftext || ''}`.toLowerCase();
        
        // Check keyword overlap
        const keywordMatches = thread.keywords.filter(keyword =>
          postText.includes(keyword.toLowerCase())
        ).length;
        const keywordRelevance = keywordMatches / Math.max(thread.keywords.length, 1);

        // Check entity overlap
        const entityMatches = thread.entities.filter(entity =>
          postText.includes(entity.toLowerCase())
        ).length;
        const entityRelevance = entityMatches / Math.max(thread.entities.length, 1);

        // Combined relevance score
        const relevanceScore = (keywordRelevance * 0.6) + (entityRelevance * 0.4);
        
        console.log(`🧵 Producer Store: Analyzed thread relevance for post ${post.id} to thread ${threadId}: ${relevanceScore.toFixed(2)}`);
        return relevanceScore;

      } catch (error) {
        console.error('🧵 Producer Store: Failed to analyze thread relevance:', error);
        return 0;
      }
    }
  };
});

// Integration helper to analyze live feed posts
export const analyzePostWithProducer = async (post: EnhancedRedditPost) => {
  const store = useProducerStore.getState();
  if (store.service && store.isActive) {
    await store.service.analyzeLiveFeedPost(post);
  }
};
