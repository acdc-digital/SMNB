/**
 * Producer Agent Store
 * 
 * Zustand store for managing Producer agent state and integration
 * with Host/Editor agents and live feed context updates
 */

import { create } from 'zustand';
import { ProducerAgentService, ProducerState, ContextData, DuplicateAnalysis } from '@/lib/services/producer/producerAgentService';

interface ProducerStoreState extends ProducerState {
  service: ProducerAgentService | null;
  
  // Actions
  initializeProducer: () => void;
  startProducer: () => Promise<void>;
  stopProducer: () => Promise<void>;
  getContextForPost: (postId: string) => ContextData[];
  getDuplicateAnalysis: (postId: string) => DuplicateAnalysis | null;
  sendContextToAgents: (contextData: ContextData[]) => Promise<void>;
  // New methods for Producer integration
  getPostMetrics: (postId: string) => DuplicateAnalysis | null;
  requestAnalysis: (post: EnhancedRedditPost) => Promise<void>;
  cleanup: () => void;
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
        // Send to Host Agent
        const { useHostAgentStore } = await import('@/lib/stores/host/hostAgentStore');
        const hostStore = useHostAgentStore.getState();
        if (hostStore.isActive) {
          // Integrate context into host narration (method would need to be added)
          console.log('🏭 Producer Store: Sending context to Host Agent');
        }

        // Send to Editor Agent
        const { useEditorAgentStore } = await import('@/lib/stores/host/editorAgentStore');
        const editorStore = useEditorAgentStore.getState();
        if (editorStore.isActive) {
          // Integrate context into editor content (method would need to be added)
          console.log('🏭 Producer Store: Sending context to Editor Agent');
        }

        // Update live feed with source information
        contextData.forEach(context => {
          // Add source context to live feed posts
          console.log(`🏭 Producer Store: Adding source context to live feed for post ${context.sourcePost.id}`);
        });

      } catch (error) {
        console.error('🏭 Producer Store: Failed to send context to agents:', error);
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
    }
  };
});

import { EnhancedRedditPost } from '@/lib/types/enhancedRedditPost';

// Integration helper to analyze live feed posts
export const analyzePostWithProducer = async (post: EnhancedRedditPost) => {
  const store = useProducerStore.getState();
  if (store.service && store.isActive) {
    await store.service.analyzeLiveFeedPost(post);
  }
};
