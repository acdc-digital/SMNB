import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { 
  StoryThread, 
  StoryUpdate, 
  ThreadDetectionCriteria, 
  ThreadMatchResult, 
  ThreadManagementConfig,
  DEFAULT_THREAD_CONFIG,
  StoryThreadUtils
} from '../../types/storyThread';
import { EnhancedRedditPost } from '../../types/enhancedRedditPost';

interface StoryThreadState {
  // State
  activeThreads: StoryThread[];
  archivedThreads: StoryThread[];
  config: ThreadManagementConfig;
  isProcessing: boolean;
  
  // Thread Detection & Matching
  detectExistingThread: (post: EnhancedRedditPost) => ThreadMatchResult;
  findSimilarThreads: (keywords: string[], entities: string[]) => StoryThread[];
  
  // Thread Management
  createNewThread: (post: EnhancedRedditPost) => StoryThread;
  addUpdateToThread: (threadId: string, update: StoryUpdate) => void;
  archiveThread: (threadId: string) => void;
  mergeThreads: (primaryThreadId: string, secondaryThreadId: string) => void;
  
  // Thread Processing
  processPostForThreads: (post: EnhancedRedditPost) => Promise<{
    threadId: string;
    isNewThread: boolean;
    isUpdate: boolean;
    updateType?: StoryUpdate['updateType'];
  }>;
  
  // Thread Queries
  getActiveThreads: () => StoryThread[];
  getThreadById: (threadId: string) => StoryThread | null;
  getRecentUpdates: (hours?: number) => StoryUpdate[];
  getThreadsByTopic: (topic: string) => StoryThread[];
  
  // Maintenance
  cleanupOldThreads: () => void;
  updateThreadSignificance: (threadId: string) => void;
  
  // Configuration
  updateConfig: (newConfig: Partial<ThreadManagementConfig>) => void;
  
  // State Management
  clearAllState: () => void;
}

export const useStoryThreadStore = create<StoryThreadState>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    activeThreads: [],
    archivedThreads: [],
    config: DEFAULT_THREAD_CONFIG,
    isProcessing: false,
    
    // Thread Detection Implementation
    detectExistingThread: (post: EnhancedRedditPost): ThreadMatchResult => {
      const { activeThreads, config } = get();
      const { keywords, entities } = StoryThreadUtils.extractKeywordsAndEntities(
        `${post.title} ${post.selftext || ''}`
      );
      
      let bestMatch: ThreadMatchResult = {
        isMatch: false,
        confidence: 0,
        matchReasons: []
      };
      
      for (const thread of activeThreads) {
        const topicSimilarity = StoryThreadUtils.calculateSimilarity(
          keywords, 
          thread.keywords
        );
        const entitySimilarity = StoryThreadUtils.calculateSimilarity(
          entities, 
          thread.entities
        );
        
        // Check time window
        const hoursSinceLastUpdate = (Date.now() - thread.lastUpdated) / (1000 * 60 * 60);
        const withinTimeWindow = hoursSinceLastUpdate <= config.detection.maxUpdateWindowHours;
        
        // Calculate overall confidence
        const confidence = (topicSimilarity + entitySimilarity) / 2;
        
        // Determine if this is a match
        const isTopicMatch = topicSimilarity >= config.detection.topicSimilarityThreshold;
        const isEntityMatch = entitySimilarity >= config.detection.entityOverlapThreshold;
        
        if ((isTopicMatch || isEntityMatch) && withinTimeWindow && confidence > bestMatch.confidence) {
          const matchReasons = [];
          if (isTopicMatch) matchReasons.push(`Topic similarity: ${(topicSimilarity * 100).toFixed(1)}%`);
          if (isEntityMatch) matchReasons.push(`Entity overlap: ${(entitySimilarity * 100).toFixed(1)}%`);
          
          // Suggest update type based on similarity
          let suggestedUpdateType: StoryUpdate['updateType'] = 'new_development';
          if (topicSimilarity > 0.8) suggestedUpdateType = 'follow_up';
          if (entitySimilarity > 0.9) suggestedUpdateType = 'clarification';
          
          bestMatch = {
            isMatch: true,
            threadId: thread.id,
            confidence,
            matchReasons,
            suggestedUpdateType
          };
        }
      }
      
      return bestMatch;
    },
    
    findSimilarThreads: (keywords: string[], entities: string[]): StoryThread[] => {
      const { activeThreads } = get();
      
      return activeThreads
        .map(thread => ({
          thread,
          similarity: (
            StoryThreadUtils.calculateSimilarity(keywords, thread.keywords) +
            StoryThreadUtils.calculateSimilarity(entities, thread.entities)
          ) / 2
        }))
        .filter(({ similarity }) => similarity > 0.3)
        .sort((a, b) => b.similarity - a.similarity)
        .map(({ thread }) => thread);
    },
    
    // Thread Management Implementation
    createNewThread: (post: EnhancedRedditPost): StoryThread => {
      const { keywords, entities } = StoryThreadUtils.extractKeywordsAndEntities(
        `${post.title} ${post.selftext || ''}`
      );
      
      const thread: StoryThread = {
        id: `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        topic: StoryThreadUtils.generateThreadTopic(keywords, entities),
        keywords,
        entities,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        significanceScore: post.priority_score || 0.5,
        updateCount: 0,
        originalPost: {
          id: post.id,
          title: post.title,
          content: post.selftext || '',
          timestamp: post.created_utc * 1000
        },
        updates: [],
        status: 'active'
      };
      
      set(state => ({
        activeThreads: [...state.activeThreads, thread]
      }));
      
      console.log(`🧵 Created new story thread: ${thread.topic}`);
      return thread;
    },
    
    addUpdateToThread: (threadId: string, update: StoryUpdate): void => {
      set(state => ({
        activeThreads: state.activeThreads.map(thread => {
          if (thread.id === threadId) {
            const updatedThread = {
              ...thread,
              lastUpdated: Date.now(),
              updateCount: thread.updateCount + 1,
              updates: [...thread.updates, update]
            };
            
            // Recalculate significance
            updatedThread.significanceScore = StoryThreadUtils.calculateSignificance(
              update.significance,
              1.0, // Recency boost for new update
              0.7, // Entity importance (could be enhanced)
              updatedThread.updateCount
            );
            
            console.log(`🔄 Added update to thread "${thread.topic}": ${update.summary}`);
            return updatedThread;
          }
          return thread;
        })
      }));
    },
    
    archiveThread: (threadId: string): void => {
      set(state => {
        const threadToArchive = state.activeThreads.find(t => t.id === threadId);
        if (!threadToArchive) return state;
        
        const archivedThread = { ...threadToArchive, status: 'archived' as const };
        
        console.log(`📦 Archived thread: ${threadToArchive.topic}`);
        
        return {
          activeThreads: state.activeThreads.filter(t => t.id !== threadId),
          archivedThreads: [...state.archivedThreads, archivedThread]
        };
      });
    },
    
    mergeThreads: (primaryThreadId: string, secondaryThreadId: string): void => {
      set(state => {
        const primaryThread = state.activeThreads.find(t => t.id === primaryThreadId);
        const secondaryThread = state.activeThreads.find(t => t.id === secondaryThreadId);
        
        if (!primaryThread || !secondaryThread) return state;
        
        const mergedThread: StoryThread = {
          ...primaryThread,
          keywords: [...new Set([...primaryThread.keywords, ...secondaryThread.keywords])],
          entities: [...new Set([...primaryThread.entities, ...secondaryThread.entities])],
          updates: [...primaryThread.updates, ...secondaryThread.updates],
          updateCount: primaryThread.updateCount + secondaryThread.updateCount + 1,
          lastUpdated: Date.now(),
          relatedThreads: [
            ...(primaryThread.relatedThreads || []),
            secondaryThreadId
          ]
        };
        
        console.log(`🔗 Merged threads: "${primaryThread.topic}" + "${secondaryThread.topic}"`);
        
        return {
          activeThreads: state.activeThreads
            .filter(t => t.id !== secondaryThreadId)
            .map(t => t.id === primaryThreadId ? mergedThread : t)
        };
      });
    },
    
    // Main Processing Function
    processPostForThreads: async (post: EnhancedRedditPost) => {
      const { detectExistingThread, createNewThread, addUpdateToThread, config } = get();
      
      set({ isProcessing: true });
      
      try {
        // Check for existing thread
        const matchResult = detectExistingThread(post);
        
        if (matchResult.isMatch && matchResult.threadId) {
          // Create update for existing thread
          const update: StoryUpdate = {
            id: `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            threadId: matchResult.threadId,
            timestamp: Date.now(),
            updateType: matchResult.suggestedUpdateType || 'new_development',
            sourcePost: {
              id: post.id,
              title: post.title,
              content: post.selftext || '',
              subreddit: post.subreddit
            },
            summary: `New development: ${post.title}`,
            significance: post.priority_score || 0.5,
            changes: {
              added: [`Update from r/${post.subreddit}`]
            }
          };
          
          addUpdateToThread(matchResult.threadId, update);
          
          return {
            threadId: matchResult.threadId,
            isNewThread: false,
            isUpdate: true,
            updateType: update.updateType
          };
        } else {
          // Create new thread
          const newThread = createNewThread(post);
          
          return {
            threadId: newThread.id,
            isNewThread: true,
            isUpdate: false
          };
        }
      } finally {
        set({ isProcessing: false });
      }
    },
    
    // Query Functions
    getActiveThreads: () => get().activeThreads,
    
    getThreadById: (threadId: string) => {
      const { activeThreads, archivedThreads } = get();
      return [...activeThreads, ...archivedThreads].find(t => t.id === threadId) || null;
    },
    
    getRecentUpdates: (hours: number = 24) => {
      const { activeThreads } = get();
      const cutoff = Date.now() - (hours * 60 * 60 * 1000);
      
      return activeThreads
        .flatMap(thread => thread.updates)
        .filter(update => update.timestamp >= cutoff)
        .sort((a, b) => b.timestamp - a.timestamp);
    },
    
    getThreadsByTopic: (topic: string) => {
      const { activeThreads } = get();
      return activeThreads.filter(thread => 
        thread.topic.toLowerCase().includes(topic.toLowerCase())
      );
    },
    
    // Maintenance Functions
    cleanupOldThreads: () => {
      const { config } = get();
      const cutoffTime = Date.now() - (config.archival.maxAgeHours * 60 * 60 * 1000);
      
      set(state => {
        const { toKeep, toArchive } = state.activeThreads.reduce(
          (acc, thread) => {
            const shouldArchive = 
              thread.lastUpdated < cutoffTime && 
              thread.significanceScore < config.archival.minSignificanceToKeep;
            
            if (shouldArchive) {
              acc.toArchive.push({ ...thread, status: 'archived' as const });
            } else {
              acc.toKeep.push(thread);
            }
            
            return acc;
          },
          { toKeep: [] as StoryThread[], toArchive: [] as StoryThread[] }
        );
        
        if (toArchive.length > 0) {
          console.log(`🧹 Auto-archived ${toArchive.length} old threads`);
        }
        
        return {
          activeThreads: toKeep,
          archivedThreads: [...state.archivedThreads, ...toArchive]
        };
      });
    },
    
    updateThreadSignificance: (threadId: string) => {
      set(state => ({
        activeThreads: state.activeThreads.map(thread => {
          if (thread.id === threadId) {
            const recency = Math.max(0, 1 - (Date.now() - thread.lastUpdated) / (24 * 60 * 60 * 1000));
            const newSignificance = StoryThreadUtils.calculateSignificance(
              thread.significanceScore,
              recency,
              0.7, // Entity importance
              thread.updateCount
            );
            
            return { ...thread, significanceScore: newSignificance };
          }
          return thread;
        })
      }));
    },
    
    updateConfig: (newConfig: Partial<ThreadManagementConfig>) => {
      set(state => ({
        config: { ...state.config, ...newConfig }
      }));
      console.log('⚙️ Updated story thread configuration');
    },
    
    clearAllState: () => {
      set(() => {
        console.log('🗑️ COMPLETE THREAD STATE RESET: Clearing all story threads');
        return {
          activeThreads: [],
          archivedThreads: [],
          config: DEFAULT_THREAD_CONFIG, // Reset to default config
          isProcessing: false
        };
      });
      console.log('✅ Complete story thread state reset completed');
    }
  }))
);

// Auto-cleanup old threads every hour
if (typeof window !== 'undefined') {
  setInterval(() => {
    useStoryThreadStore.getState().cleanupOldThreads();
  }, 60 * 60 * 1000); // 1 hour
}

export default useStoryThreadStore;