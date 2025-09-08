// QUEUE MANAGER SERVICE
// /Users/matthewsimon/Projects/SMNB/smnb/lib/services/queueManagerService.ts

/**
 * Queue Manager Service
 * 
 * Centralized service for managing queues across the application.
 * Coordinates queue operations between Host Agent and Scheduler Service.
 */

import { EventEmitter } from 'events';
import { HostAgentService } from './host/hostAgentService';
import { SchedulerService } from './livefeed/schedulerService';

export interface QueueManagerStats {
  totalHostQueue: number;
  totalScheduledPosts: number;
  queueBySubreddit: { [subreddit: string]: number };
  scheduledBySubreddit: { [subreddit: string]: number };
}

export interface QueueClearResult {
  subreddit: string;
  hostQueueCleared: number;
  scheduledPostsCleared: number;
  totalCleared: number;
}

export class QueueManagerService extends EventEmitter {
  private hostAgentService: HostAgentService | null = null;
  private schedulerService: SchedulerService | null = null;
  public isInitialized: boolean = false;

  constructor() {
    super();
    console.log('🎯 QueueManagerService initialized');
  }

  /**
   * Initialize the queue manager with required services
   */
  initialize(hostAgent: HostAgentService, scheduler: SchedulerService): void {
    this.hostAgentService = hostAgent;
    this.schedulerService = scheduler;
    this.isInitialized = true;
    
    console.log('🔗 QueueManagerService connected to Host Agent and Scheduler');
    
    // Listen to queue events from host agent
    this.hostAgentService.on('queue:updated', (length: number) => {
      this.emit('queue:host-updated', length);
    });
    
    this.hostAgentService.on('queue:subreddit-cleared', (data: { subreddit: string; removedCount: number }) => {
      this.emit('queue:subreddit-cleared', { source: 'host', ...data });
    });
  }

  /**
   * Clear all queue items for a specific subreddit across all services
   */
  clearQueueBySubreddit(subreddit: string): QueueClearResult {
    if (!this.hostAgentService || !this.schedulerService) {
      throw new Error('QueueManagerService not properly initialized');
    }

    console.log(`🎯 QueueManager: Clearing all queues for subreddit: r/${subreddit}`);

    // Clear from host agent narration queue
    const hostQueueBefore = this.hostAgentService.getQueueStatus().length;
    this.hostAgentService.clearQueueBySubreddit(subreddit);
    const hostQueueAfter = this.hostAgentService.getQueueStatus().length;
    const hostCleared = hostQueueBefore - hostQueueAfter;

    // Clear from scheduler service
    const scheduledCleared = this.schedulerService.clearScheduledPostsBySubreddit(subreddit);

    const result: QueueClearResult = {
      subreddit,
      hostQueueCleared: hostCleared,
      scheduledPostsCleared: scheduledCleared,
      totalCleared: hostCleared + scheduledCleared
    };

    console.log(`✅ QueueManager: Cleared ${result.totalCleared} items total for r/${subreddit} (Host: ${hostCleared}, Scheduled: ${scheduledCleared})`);
    
    this.emit('queue:subreddit-cleared-complete', result);
    
    return result;
  }

  /**
   * Clear all queues completely
   */
  clearAllQueues(): { hostCleared: number; scheduledCleared: number; totalCleared: number } {
    if (!this.hostAgentService || !this.schedulerService) {
      throw new Error('QueueManagerService not properly initialized');
    }

    console.log('🎯 QueueManager: Clearing ALL queues');

    const hostQueueBefore = this.hostAgentService.getQueueStatus().length;
    this.hostAgentService.clearQueue();
    const hostCleared = hostQueueBefore;

    const scheduledCleared = this.schedulerService.clearAllScheduledPosts();

    const result = {
      hostCleared,
      scheduledCleared,
      totalCleared: hostCleared + scheduledCleared
    };

    console.log(`✅ QueueManager: Cleared ${result.totalCleared} items total (Host: ${hostCleared}, Scheduled: ${scheduledCleared})`);
    
    this.emit('queue:all-cleared', result);
    
    return result;
  }

  /**
   * Get comprehensive queue statistics
   */
  getQueueStats(): QueueManagerStats {
    if (!this.hostAgentService || !this.schedulerService) {
      throw new Error('QueueManagerService not properly initialized');
    }

    const hostStatus = this.hostAgentService.getQueueStatus();
    const hostBySubreddit = this.hostAgentService.getQueueBySubreddit();
    const schedulingStats = this.schedulerService.getSchedulingStats();
    const scheduledBySubreddit = this.schedulerService.getScheduledPostsBySubreddit();

    return {
      totalHostQueue: hostStatus.length,
      totalScheduledPosts: schedulingStats.scheduledCount,
      queueBySubreddit: hostBySubreddit,
      scheduledBySubreddit: scheduledBySubreddit
    };
  }

  /**
   * Get detailed status information
   */
  getDetailedStatus(): {
    isInitialized: boolean;
    hostAgent: { isActive: boolean; queueLength: number; isProcessing: boolean };
    scheduler: { scheduledCount: number; nextPublishTime: number | null };
    subredditBreakdown: { [subreddit: string]: { host: number; scheduled: number; total: number } };
  } {
    if (!this.hostAgentService || !this.schedulerService) {
      return {
        isInitialized: false,
        hostAgent: { isActive: false, queueLength: 0, isProcessing: false },
        scheduler: { scheduledCount: 0, nextPublishTime: null },
        subredditBreakdown: {}
      };
    }

    const hostStatus = this.hostAgentService.getQueueStatus();
    const schedulingStats = this.schedulerService.getSchedulingStats();
    const hostBySubreddit = this.hostAgentService.getQueueBySubreddit();
    const scheduledBySubreddit = this.schedulerService.getScheduledPostsBySubreddit();

    // Combine subreddit data
    const allSubreddits = new Set([...Object.keys(hostBySubreddit), ...Object.keys(scheduledBySubreddit)]);
    const subredditBreakdown: { [subreddit: string]: { host: number; scheduled: number; total: number } } = {};
    
    allSubreddits.forEach(subreddit => {
      const hostCount = hostBySubreddit[subreddit] || 0;
      const scheduledCount = scheduledBySubreddit[subreddit] || 0;
      subredditBreakdown[subreddit] = {
        host: hostCount,
        scheduled: scheduledCount,
        total: hostCount + scheduledCount
      };
    });

    return {
      isInitialized: true,
      hostAgent: {
        isActive: hostStatus.isActive,
        queueLength: hostStatus.length,
        isProcessing: hostStatus.isProcessing
      },
      scheduler: {
        scheduledCount: schedulingStats.scheduledCount,
        nextPublishTime: schedulingStats.nextPublishTime
      },
      subredditBreakdown
    };
  }
}

// Export singleton instance
export const queueManagerService = new QueueManagerService();