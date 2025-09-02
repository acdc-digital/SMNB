/**
 * Simple Event Bus for decoupling stores
 * 
 * Allows live feed to notify host agent without direct coupling
 */

import { EnhancedRedditPost } from '@/lib/types/enhancedRedditPost';

export type EventBusEvents = {
  'newPostForHost': EnhancedRedditPost;
  'bulkPostsForHost': EnhancedRedditPost[];
};

class EventBus {
  private listeners = new Map<keyof EventBusEvents, Array<(data: any) => void>>();

  emit<T extends keyof EventBusEvents>(event: T, data: EventBusEvents[T]) {
    const eventListeners = this.listeners.get(event) || [];
    eventListeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`❌ Event bus error for ${event}:`, error);
      }
    });
  }

  on<T extends keyof EventBusEvents>(event: T, listener: (data: EventBusEvents[T]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  off<T extends keyof EventBusEvents>(event: T, listener: (data: EventBusEvents[T]) => void) {
    const eventListeners = this.listeners.get(event) || [];
    const index = eventListeners.indexOf(listener);
    if (index > -1) {
      eventListeners.splice(index, 1);
    }
  }
}

export const eventBus = new EventBus();
