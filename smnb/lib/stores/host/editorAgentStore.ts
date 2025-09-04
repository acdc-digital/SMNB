// EDITOR AGENT STORE
// /Users/matthewsimon/Projects/SMNB/smnb/lib/stores/host/editorAgentStore.ts

/**
 * Editor Agent Store
 * 
 * Zustand store for managing the editor agent service state
 * and providing shared access across components
 */

import { create } from 'zustand';
import { EditorAgentService, EditorAgentConfig, EditorState, EditorContent, DEFAULT_EDITOR_CONFIG } from '@/lib/services/host/editorAgentService';
import { EnhancedRedditPost } from '@/lib/types/enhancedRedditPost';

// Helper function to convert LiveFeedPost to EnhancedRedditPost if needed
const convertToEnhancedRedditPost = (post: Record<string, unknown>): EnhancedRedditPost => {
  return {
    ...post,
    fetch_timestamp: (post.fetched_at as number) || (post.addedAt as number) || Date.now(),
    engagement_score: (post.priority_score as number) || 0,
    processing_status: 'raw' as const,
  } as EnhancedRedditPost;
};

interface EditorAgentStoreState {
  // Service instance
  editorAgent: EditorAgentService | null;
  
  // State
  isActive: boolean;
  currentContent: EditorContent | null;
  
  // Streaming state
  isStreaming: boolean;
  streamingText: string;
  streamingContentId: string | null;
  streamingDocumentId: string | null;
  
  // Content queue for processing
  contentQueue: EnhancedRedditPost[];
  
  // Persistent content history (for display)
  contentHistory: EditorContent[];
  maxHistorySize: number;
  
  // Configuration
  config: EditorAgentConfig;
  
  // Stats and metadata
  stats: EditorState['stats'];
  currentDocumentId: string | null;
  
  // Actions
  initializeEditorAgent: () => void;
  start: () => void;
  stop: () => void;
  processPost: (post: Record<string, unknown>) => Promise<void>; // Accept any post format
  updateConfig: (config: Partial<EditorAgentConfig>) => void;
  clearQueue: () => void;
  startNewDocument: () => string;
  cleanup: () => void;
  
  // Internal actions
  setIsStreaming: (streaming: boolean) => void;
  updateStreamingText: (text: string) => void;
  addToHistory: (content: EditorContent) => void;
  updateStats: (stats: EditorState['stats']) => void;
}

export const useEditorAgentStore = create<EditorAgentStoreState>((set, get) => ({
  // Initial state
  editorAgent: null,
  isActive: false,
  currentContent: null,
  isStreaming: false,
  streamingText: '',
  streamingContentId: null,
  streamingDocumentId: null,
  contentQueue: [],
  contentHistory: [],
  maxHistorySize: 10, // Keep last 10 content pieces in history
  config: DEFAULT_EDITOR_CONFIG,
  stats: {
    postsProcessed: 0,
    totalWords: 0,
    sessionsCompleted: 0,
    averageWordsPerSession: 0,
    uptime: 0,
  },
  currentDocumentId: null,

  // Actions
  initializeEditorAgent: () => {
    const state = get();
    
    if (state.editorAgent) {
      console.log('📝 Editor agent already initialized');
      return;
    }

    console.log('🚀 Initializing editor agent service...');
    
    const service = new EditorAgentService(state.config);
    
    // Set up event listeners
    service.on('editor:started', () => {
      console.log('📝 Editor agent started event received');
      set({ isActive: true });
    });
    
    service.on('editor:stopped', () => {
      console.log('📝 Editor agent stopped event received');
      set({ 
        isActive: false, 
        currentContent: null,
        isStreaming: false,
        streamingText: '',
        streamingContentId: null,
        streamingDocumentId: null,
      });
    });
    
    service.on('content:started', (content: EditorContent) => {
      console.log(`📝 Content generation started: ${content.id}`);
      set({ 
        currentContent: content,
        isStreaming: true,
        streamingText: '',
        streamingContentId: content.id,
        streamingDocumentId: content.documentId,
      });
    });
    
    service.on('content:streaming', (data: { 
      contentId: string; 
      documentId: string;
      currentText: string; 
      wordCount: number;
    }) => {
      // Only update if this is the current content
      const currentState = get();
      if (currentState.streamingContentId === data.contentId) {
        set({ 
          streamingText: data.currentText,
          streamingDocumentId: data.documentId,
        });
        
        // Update current content if it exists
        if (currentState.currentContent && currentState.currentContent.id === data.contentId) {
          set({
            currentContent: {
              ...currentState.currentContent,
              content: data.currentText,
              wordCount: data.wordCount,
            }
          });
        }
      }
    });
    
    service.on('content:completed', (contentId: string, fullText: string) => {
      console.log(`📝✅ EDITOR EVENT RECEIVED: Content generation completed: ${contentId}, length: ${fullText.length}`);
      console.log(`📝✅ EDITOR EVENT CONTENT PREVIEW:`, fullText.substring(0, 100) + '...');
      const state = get();
      
      if (state.currentContent && state.currentContent.id === contentId) {
        const completedContent: EditorContent = {
          ...state.currentContent,
          content: fullText,
          wordCount: fullText.trim().split(/\s+/).length,
          isComplete: true,
        };
        
        console.log(`📝 Creating completed content object:`, {
          id: completedContent.id,
          title: completedContent.title,
          wordCount: completedContent.wordCount,
          isComplete: completedContent.isComplete
        });
        
        // Add to history first
        get().addToHistory(completedContent);
        
        // Also add to live feed history
        import('@/lib/stores/livefeed/simpleLiveFeedStore').then(module => {
          const completedStory = {
            id: `editor-${completedContent.id}`, // Prefix with 'editor' for agent type identification
            narrative: completedContent.content,
            tone: 'analysis' as const, // Default tone for editor content
            priority: 'medium' as const, // Default priority for editor content
            timestamp: new Date(),
            duration: Math.ceil(completedContent.wordCount / 200 * 60), // Estimate reading time
            originalItem: undefined, // Editor content may not have a direct original item
            sentiment: undefined, // Could be analyzed in the future
            topics: undefined, // Could be extracted in the future
            summary: completedContent.title || `Editor content (${completedContent.wordCount} words)`,
          };
          
          const { addCompletedStory } = module.useSimpleLiveFeedStore.getState();
          addCompletedStory(completedStory);
          console.log(`📋 EDITOR: Added completed story to live feed history: "${completedContent.content.substring(0, 50)}..."`);
        });
        
        set({ 
          currentContent: completedContent,
          isStreaming: false,
          streamingText: fullText,
        });
        
        // Clear streaming state after a brief moment
        setTimeout(() => {
          console.log(`📝 Clearing current content for: ${contentId}`);
          set({ 
            currentContent: null,
            streamingText: '',
            streamingContentId: null,
          });
        }, 2000);
      } else {
        console.warn(`📝 Content completion mismatch: expected ${state.currentContent?.id}, got ${contentId}`);
      }
    });
    
    service.on('content:error', (contentId: string, error: Error) => {
      console.error(`📝 Content generation error for ${contentId}:`, error);
      set({ 
        isStreaming: false,
        streamingText: '',
        streamingContentId: null,
        currentContent: null,
      });
    });
    
    service.on('post:queued', (postId: string) => {
      console.log(`📥 Post queued for editor: ${postId}`);
    });
    
    service.on('queue:updated', () => {
      const serviceState = service.getState();
      set({ 
        contentQueue: [...serviceState.contentQueue],
        stats: serviceState.stats,
      });
    });
    
    service.on('document:new', (documentId: string) => {
      console.log(`📄 New document started: ${documentId}`);
      set({ 
        currentDocumentId: documentId,
        contentHistory: [], // Clear history for new document
      });
    });
    
    service.on('error', (error: Error) => {
      console.error('📝 Editor agent service error:', error);
      // Could emit to a global error handler or show notification
    });
    
    set({ 
      editorAgent: service,
      currentDocumentId: service.getCurrentDocumentId(),
    });
    
    console.log('✅ Editor agent service initialized');
  },

  start: () => {
    const { editorAgent } = get();
    if (editorAgent) {
      editorAgent.start();
    }
  },

  stop: () => {
    const { editorAgent } = get();
    if (editorAgent) {
      editorAgent.stop();
    }
  },

  processPost: async (post: Record<string, unknown>) => {
    const { editorAgent } = get();
    if (editorAgent) {
      // Convert to EnhancedRedditPost format if needed
      const enhancedPost = convertToEnhancedRedditPost(post);
      await editorAgent.processPost(enhancedPost);
    }
  },

  updateConfig: (newConfig: Partial<EditorAgentConfig>) => {
    const { editorAgent } = get();
    const updatedConfig = { ...get().config, ...newConfig };
    
    set({ config: updatedConfig });
    
    if (editorAgent) {
      editorAgent.updateConfig(newConfig);
    }
  },

  clearQueue: () => {
    const { editorAgent } = get();
    if (editorAgent) {
      editorAgent.clearQueue();
    }
  },

  startNewDocument: (): string => {
    const { editorAgent } = get();
    if (editorAgent) {
      return editorAgent.startNewDocument();
    }
    const newDocId = `editor-${Date.now()}`;
    set({ currentDocumentId: newDocId });
    return newDocId;
  },

  cleanup: () => {
    const { editorAgent } = get();
    if (editorAgent) {
      editorAgent.stop();
      editorAgent.removeAllListeners();
    }
    
    set({
      editorAgent: null,
      isActive: false,
      currentContent: null,
      isStreaming: false,
      streamingText: '',
      streamingContentId: null,
      streamingDocumentId: null,
      contentQueue: [],
      currentDocumentId: null,
    });
  },

  // Internal actions
  setIsStreaming: (streaming: boolean) => {
    set({ isStreaming: streaming });
  },

  updateStreamingText: (text: string) => {
    set({ streamingText: text });
  },

  addToHistory: (content: EditorContent) => {
    console.log(`📚 Adding content to history: ${content.id} (${content.wordCount} words)`);
    const { contentHistory, maxHistorySize } = get();
    
    // Check if this content is already in history
    const existingIndex = contentHistory.findIndex(item => item.id === content.id);
    let newHistory;
    
    if (existingIndex >= 0) {
      // Update existing content in history
      newHistory = [...contentHistory];
      newHistory[existingIndex] = content;
      console.log(`📚 Updated existing content in history: ${content.id}`);
    } else {
      // Add new content to the beginning
      newHistory = [content, ...contentHistory];
      console.log(`📚 Added new content to history: ${content.id}`);
    }
    
    // Maintain max history size
    if (newHistory.length > maxHistorySize) {
      newHistory.splice(maxHistorySize);
      console.log(`📚 Trimmed history to ${maxHistorySize} items`);
    }
    
    console.log(`📚 Content history now has ${newHistory.length} items`);
    set({ contentHistory: newHistory });
  },

  updateStats: (stats: EditorState['stats']) => {
    set({ stats });
  },
}));
