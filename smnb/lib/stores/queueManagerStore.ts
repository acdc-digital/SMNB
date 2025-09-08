// QUEUE MANAGER STORE
// /Users/matthewsimon/Projects/SMNB/smnb/lib/stores/queueManagerStore.ts

/**
 * Queue Manager Store
 * 
 * Zustand store for managing queue operations across the application.
 * Provides centralized queue management for Host Agent and Scheduler Service.
 */

import { create } from 'zustand';
import { QueueManagerService, QueueManagerStats, QueueClearResult, queueManagerService } from '@/lib/services/queueManagerService';
import { schedulerService } from '@/lib/services/livefeed/schedulerService';

export interface QueueManagerState {
  // Service instance
  queueManager: QueueManagerService | null;
  
  // State
  isInitialized: boolean;
  
  // Statistics
  stats: QueueManagerStats;
  
  // Actions
  initializeQueueManager: () => void;
  attemptServiceConnection: () => void;
  clearQueueBySubreddit: (subreddit: string) => Promise<QueueClearResult>;
  clearAllQueues: () => Promise<{ hostCleared: number; scheduledCleared: number; totalCleared: number }>;
  refreshStats: () => void;
  getDetailedStatus: () => ReturnType<QueueManagerService['getDetailedStatus']>;
}

export const useQueueManagerStore = create<QueueManagerState>((set, get) => ({
  // Initial state
  queueManager: null,
  isInitialized: false,
  stats: {
    totalHostQueue: 0,
    totalScheduledPosts: 0,
    queueBySubreddit: {},
    scheduledBySubreddit: {}
  },

  // Initialize queue manager
  initializeQueueManager: () => {
    const { queueManager } = get();
    
    if (queueManager) {
      console.log('🎯 QUEUE MANAGER STORE: Already initialized');
      
      // Try to connect to services even if already initialized
      if (!queueManagerService.isInitialized) {
        // Get host agent from host store - we need to import it dynamically to avoid circular deps
        try {
          // We'll handle the connection in a different way to avoid circular imports
          console.log('🔗 QUEUE MANAGER STORE: Attempting to connect to services');
          setTimeout(() => {
            // Delay connection attempt to allow other stores to initialize
            get().attemptServiceConnection();
          }, 1000);
        } catch (error) {
          console.warn('⚠️ QUEUE MANAGER STORE: Could not connect to services yet:', error);
        }
      }
      
      return;
    }

    try {
      // Set up event listeners
      queueManagerService.on('queue:subreddit-cleared-complete', (result: QueueClearResult) => {
        console.log(`✅ QUEUE STORE: Subreddit queue cleared - ${result.subreddit}: ${result.totalCleared} items`);
        get().refreshStats();
      });

      queueManagerService.on('queue:all-cleared', (result: { totalCleared: number }) => {
        console.log(`✅ QUEUE STORE: All queues cleared - ${result.totalCleared} items`);
        get().refreshStats();
      });

      set(() => ({
        queueManager: queueManagerService,
        isInitialized: false // Will be set to true when host/scheduler are connected
      }));

      console.log('🎯 QUEUE MANAGER STORE: Queue manager service attached');
      
      // Try to connect to services immediately
      setTimeout(() => {
        get().attemptServiceConnection();
      }, 500);
      
    } catch (error) {
      console.error('❌ QUEUE MANAGER STORE: Failed to initialize queue manager:', error);
    }
  },

  // Helper to attempt service connection
  attemptServiceConnection: () => {
    if (queueManagerService.isInitialized) {
      set(() => ({ isInitialized: true }));
      return;
    }

    try {
      // Dynamic import to avoid circular dependencies
      import('@/lib/stores/host/hostAgentStore').then(({ useHostAgentStore }) => {
        const hostState = useHostAgentStore.getState();
        
        if (hostState.hostAgent) {
          console.log('🔗 QUEUE MANAGER STORE: Connecting to host agent and scheduler');
          queueManagerService.initialize(hostState.hostAgent, schedulerService);
          set(() => ({ isInitialized: true }));
        } else {
          console.log('⏳ QUEUE MANAGER STORE: Host agent not ready yet, will retry');
          // Retry after a delay
          setTimeout(() => {
            get().attemptServiceConnection();
          }, 2000);
        }
      }).catch(error => {
        console.warn('⚠️ QUEUE MANAGER STORE: Could not import host store:', error);
      });
    } catch (error) {
      console.warn('⚠️ QUEUE MANAGER STORE: Could not connect to services:', error);
    }
  },

  // Clear queue by subreddit
  clearQueueBySubreddit: async (subreddit: string): Promise<QueueClearResult> => {
    const { queueManager } = get();
    
    if (!queueManager) {
      throw new Error('Queue manager not initialized');
    }

    try {
      console.log(`🗑️ QUEUE STORE: Clearing queues for subreddit: r/${subreddit}`);
      const result = queueManager.clearQueueBySubreddit(subreddit);
      
      // Refresh stats after clearing
      get().refreshStats();
      
      return result;
    } catch (error) {
      console.error(`❌ QUEUE STORE: Failed to clear queue for r/${subreddit}:`, error);
      throw error;
    }
  },

  // Clear all queues
  clearAllQueues: async (): Promise<{ hostCleared: number; scheduledCleared: number; totalCleared: number }> => {
    const { queueManager } = get();
    
    if (!queueManager) {
      throw new Error('Queue manager not initialized');
    }

    try {
      console.log('🗑️ QUEUE STORE: Clearing all queues');
      const result = queueManager.clearAllQueues();
      
      // Refresh stats after clearing
      get().refreshStats();
      
      return result;
    } catch (error) {
      console.error('❌ QUEUE STORE: Failed to clear all queues:', error);
      throw error;
    }
  },

  // Refresh statistics
  refreshStats: () => {
    const { queueManager } = get();
    
    if (!queueManager) {
      console.warn('⚠️ QUEUE STORE: Cannot refresh stats - queue manager not initialized');
      return;
    }

    try {
      const stats = queueManager.getQueueStats();
      set(() => ({ stats }));
    } catch (error) {
      console.warn('⚠️ QUEUE STORE: Failed to refresh stats:', error);
      // Don't throw, just log the error
    }
  },

  // Get detailed status
  getDetailedStatus: () => {
    const { queueManager } = get();
    
    if (!queueManager) {
      return {
        isInitialized: false,
        hostAgent: { isActive: false, queueLength: 0, isProcessing: false },
        scheduler: { scheduledCount: 0, nextPublishTime: null },
        subredditBreakdown: {}
      };
    }

    return queueManager.getDetailedStatus();
  }
}));