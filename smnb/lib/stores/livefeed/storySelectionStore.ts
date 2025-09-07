// STORY SELECTION STORE
// /Users/matthewsimon/Projects/SMNB/smnb/lib/stores/livefeed/storySelectionStore.ts

/**
 * Story Selection Store
 * 
 * Manages the currently selected story for display in Producer preview
 */

import { create } from 'zustand';
import { CompletedStory } from './simpleLiveFeedStore';

interface StorySelectionState {
  selectedStory: CompletedStory | null;
  isPreviewOpen: boolean;
  
  // Actions
  selectStory: (story: CompletedStory) => void;
  clearSelection: () => void;
  setPreviewOpen: (open: boolean) => void;
}

export const useStorySelectionStore = create<StorySelectionState>((set) => ({
  selectedStory: null,
  isPreviewOpen: false,
  
  selectStory: (story: CompletedStory) => {
    set({ 
      selectedStory: story,
      isPreviewOpen: true // Automatically open preview when story is selected
    });
  },
  
  clearSelection: () => {
    set({ 
      selectedStory: null,
      isPreviewOpen: false 
    });
  },
  
  setPreviewOpen: (open: boolean) => {
    set({ isPreviewOpen: open });
    // If closing preview, clear selection
    if (!open) {
      set({ selectedStory: null });
    }
  }
}));