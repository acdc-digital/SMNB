// STATE CLEARING UTILITIES
// /Users/matthewsimon/Projects/SMNB/smnb/lib/utils/stateClearingUtils.ts

/**
 * Utilities for clearing all application state
 * Used when database is cleared to keep frontend state in sync
 */

/**
 * Clear all application state across all stores
 * This should be called when the database is cleared to maintain consistency
 */
export const clearAllApplicationState = async (): Promise<void> => {
  console.log('🗑️ GLOBAL STATE RESET: Starting complete application state clearing...');
  
  try {
    // Clear live feed store state
    console.log('🗑️ Clearing live feed state...');
    const { useSimpleLiveFeedStore } = await import('@/lib/stores/livefeed/simpleLiveFeedStore');
    useSimpleLiveFeedStore.getState().clearAllState();
    
    // Clear story thread store state
    console.log('🗑️ Clearing story thread state...');
    const { useStoryThreadStore } = await import('@/lib/stores/livefeed/storyThreadStore');
    useStoryThreadStore.getState().clearAllState();
    
    // Clear host agent store state
    console.log('🗑️ Clearing host agent state...');
    const { useHostAgentStore } = await import('@/lib/stores/host/hostAgentStore');
    useHostAgentStore.getState().clearAllState();
    
    // Clear any other stores if they exist
    try {
      console.log('🗑️ Checking for additional stores...');
      
      // Try to clear producer store if it exists
      const producerStore = await import('@/lib/stores/producer/producerStore').catch(() => null);
      if (producerStore?.useProducerStore) {
        const state = producerStore.useProducerStore.getState();
        if ('clearAllState' in state && typeof (state as any).clearAllState === 'function') {
          (state as any).clearAllState();
          console.log('🗑️ Cleared producer store state');
        } else {
          console.log('ℹ️ Producer store exists but no clearAllState method');
        }
      }
      
      // Try to clear editor store if it exists  
      const editorStore = await import('@/lib/stores/host/editorAgentStore').catch(() => null);
      if (editorStore?.useEditorAgentStore) {
        const state = editorStore.useEditorAgentStore.getState();
        if ('clearAllState' in state && typeof (state as any).clearAllState === 'function') {
          (state as any).clearAllState();
          console.log('🗑️ Cleared editor agent state');
        } else {
          console.log('ℹ️ Editor store exists but no clearAllState method');
        }
      }
      
    } catch (error) {
      console.log('ℹ️ Some optional stores not available for clearing:', error);
    }
    
    console.log('✅ GLOBAL STATE RESET: Complete application state clearing finished successfully');
    
  } catch (error) {
    console.error('❌ GLOBAL STATE RESET: Failed to clear application state:', error);
    throw error;
  }
};

/**
 * Clear only feed-related state (posts, threads, stories)
 * Lighter version that preserves agent configurations
 */
export const clearFeedState = async (): Promise<void> => {
  console.log('🗑️ FEED STATE RESET: Clearing feed-related state only...');
  
  try {
    // Clear live feed posts and stories
    const { useSimpleLiveFeedStore } = await import('@/lib/stores/livefeed/simpleLiveFeedStore');
    const liveFeedStore = useSimpleLiveFeedStore.getState();
    liveFeedStore.clearPosts();
    liveFeedStore.clearStoryHistory();
    
    // Clear story threads
    const { useStoryThreadStore } = await import('@/lib/stores/livefeed/storyThreadStore');
    const threadStore = useStoryThreadStore.getState();
    threadStore.clearAllState();
    
    // Clear host narration history but keep service running
    const { useHostAgentStore } = await import('@/lib/stores/host/hostAgentStore');
    const hostStore = useHostAgentStore.getState();
    hostStore.clearNarrationHistory();
    
    console.log('✅ FEED STATE RESET: Feed state clearing completed');
    
  } catch (error) {
    console.error('❌ FEED STATE RESET: Failed to clear feed state:', error);
    throw error;
  }
};

/**
 * Check if stores are available and have clearing capabilities
 */
export const checkStateClearingCapabilities = async (): Promise<{
  liveFeed: boolean;
  storyThreads: boolean;
  hostAgent: boolean;
  producer?: boolean;
  editor?: boolean;
}> => {
  const capabilities = {
    liveFeed: false,
    storyThreads: false,
    hostAgent: false,
    producer: undefined as boolean | undefined,
    editor: undefined as boolean | undefined,
  };
  
  try {
    // Check live feed store
    const liveFeedStore = await import('@/lib/stores/livefeed/simpleLiveFeedStore');
    capabilities.liveFeed = typeof liveFeedStore.useSimpleLiveFeedStore.getState().clearAllState === 'function';
    
    // Check story thread store
    const threadStore = await import('@/lib/stores/livefeed/storyThreadStore');
    capabilities.storyThreads = typeof threadStore.useStoryThreadStore.getState().clearAllState === 'function';
    
    // Check host agent store
    const hostStore = await import('@/lib/stores/host/hostAgentStore');
    capabilities.hostAgent = typeof hostStore.useHostAgentStore.getState().clearAllState === 'function';
    
    // Check optional stores
    try {
      const producerStore = await import('@/lib/stores/producer/producerStore');
      const state = producerStore.useProducerStore?.getState();
      capabilities.producer = state && 'clearAllState' in state && typeof (state as any).clearAllState === 'function';
    } catch {
      capabilities.producer = false;
    }
    
    try {
      const editorStore = await import('@/lib/stores/host/editorAgentStore');
      const state = editorStore.useEditorAgentStore?.getState();
      capabilities.editor = state && 'clearAllState' in state && typeof (state as any).clearAllState === 'function';
    } catch {
      capabilities.editor = false;
    }
    
  } catch (error) {
    console.error('❌ Failed to check state clearing capabilities:', error);
  }
  
  return capabilities;
};

/**
 * Manual state clearing function for use in UI components
 * Includes user confirmation
 */
export const manualStateClear = async (options: {
  includeConfirmation?: boolean;
  clearType?: 'all' | 'feed';
} = {}): Promise<boolean> => {
  const { includeConfirmation = true, clearType = 'all' } = options;
  
  // Show confirmation if requested
  if (includeConfirmation && typeof window !== 'undefined') {
    const message = clearType === 'all' 
      ? 'Clear ALL application state? This will reset posts, stories, threads, and agent states.'
      : 'Clear feed state? This will reset posts, stories, and threads but keep agents running.';
    
    const confirmed = window.confirm(message);
    if (!confirmed) {
      console.log('🚫 User cancelled state clearing');
      return false;
    }
  }
  
  try {
    if (clearType === 'all') {
      await clearAllApplicationState();
    } else {
      await clearFeedState();
    }
    
    console.log(`✅ Manual state clear (${clearType}) completed successfully`);
    return true;
    
  } catch (error) {
    console.error(`❌ Manual state clear (${clearType}) failed:`, error);
    return false;
  }
};

// Export for global access
if (typeof window !== 'undefined') {
  // Make available globally for debugging/testing
  (window as any).clearAllState = clearAllApplicationState;
  (window as any).clearFeedState = clearFeedState;
  (window as any).manualStateClear = manualStateClear;
  
  console.log('🔧 State clearing utilities available globally:');
  console.log('  - window.clearAllState()');
  console.log('  - window.clearFeedState()');
  console.log('  - window.manualStateClear()');
}