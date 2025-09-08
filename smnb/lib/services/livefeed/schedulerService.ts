// SCHEDULER SERVICE
// /Users/matthewsimon/Projects/SMNB/smnb/lib/services/livefeed/schedulerService.ts

import { EnhancedRedditPost, QueueConfig, DEFAULT_QUEUE_CONFIG } from '@/lib/types/enhancedRedditPost';

export class SchedulerService {
  private config: QueueConfig;
  private publishedPosts: EnhancedRedditPost[] = [];
  private scheduledPosts: EnhancedRedditPost[] = [];

  constructor(config: QueueConfig = DEFAULT_QUEUE_CONFIG) {
    this.config = config;
  }

  /**
   * Main scheduling logic - takes scored posts and creates a publishing schedule
   * Runs every 5 minutes to optimize the posting schedule
   */
  async scheduleNextBatch(
    scoredPosts: EnhancedRedditPost[],
    recentlyPublished: EnhancedRedditPost[] = []
  ): Promise<EnhancedRedditPost[]> {
    console.log(`📅 SchedulerService: Scheduling from ${scoredPosts.length} scored posts...`);
    
    // Update our internal state
    this.publishedPosts = recentlyPublished;
    
    // Get candidates that pass diversity rules
    const candidates = this.filterByDiversityRules(scoredPosts);
    
    // Create scheduling timeline
    const schedule = this.createOptimalSchedule(candidates);
    
    console.log(`✅ SchedulerService: Scheduled ${schedule.length} posts`);
    return schedule;
  }

  private filterByDiversityRules(posts: EnhancedRedditPost[]): EnhancedRedditPost[] {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    // Count recent posts by subreddit
    const recentBySubreddit = new Map<string, number>();
    this.publishedPosts
      .filter(post => (post.published_at || 0) > oneHourAgo)
      .forEach(post => {
        const count = recentBySubreddit.get(post.subreddit) || 0;
        recentBySubreddit.set(post.subreddit, count + 1);
      });
    
    // Filter candidates based on diversity rules
    const candidates = posts.filter(post => {
      const recentCount = recentBySubreddit.get(post.subreddit) || 0;
      return recentCount < this.config.MAX_POSTS_PER_SUBREDDIT_PER_HOUR;
    });
    
    console.log(`🎯 Diversity filter: ${posts.length} → ${candidates.length} posts`);
    return candidates;
  }

  private createOptimalSchedule(candidates: EnhancedRedditPost[]): EnhancedRedditPost[] {
    const isInPeakHours = this.config.PEAK_HOURS_UTC.includes(new Date().getUTCHours());
    
    // Calculate base interval
    const baseIntervalMinutes = isInPeakHours 
      ? this.config.MIN_POST_INTERVAL_MINUTES 
      : this.config.MAX_POST_INTERVAL_MINUTES;
    
    // Start scheduling from the next available slot
    let nextSlot = this.getNextAvailableSlot();
    const scheduled: EnhancedRedditPost[] = [];
    
    // Group posts by category for better distribution
    const postsByCategory = this.groupByCategory(candidates);
    
    // Interleave different categories for variety
    const interleavedPosts = this.interleaveCategories(postsByCategory);
    
    for (let i = 0; i < Math.min(interleavedPosts.length, 10); i++) {
      const post = interleavedPosts[i];
      
      // For the first 3 posts, schedule them immediately to show activity
      const scheduledTime = i < 3 ? Date.now() + (i * 2000) : nextSlot; // First 3 posts: now, +2s, +4s
      
      const scheduledPost: EnhancedRedditPost = {
        ...post,
        processing_status: 'scheduled',
        scheduled_at: scheduledTime,
      };
      
      scheduled.push(scheduledPost);
      
      // Calculate next slot with some variability (only for posts after the first 3)
      if (i >= 3) {
        const variability = this.calculateIntervalVariability(post);
        nextSlot += (baseIntervalMinutes + variability) * 60 * 1000;
      } else {
        // For immediate posts, next slot starts from now + base interval
        nextSlot = Date.now() + (baseIntervalMinutes * 60 * 1000);
      }
    }
    
    this.scheduledPosts = scheduled;
    console.log(`📅 Scheduled posts: ${scheduled.filter(p => p.scheduled_at! <= Date.now() + 10000).length} immediate, ${scheduled.length - scheduled.filter(p => p.scheduled_at! <= Date.now() + 10000).length} future`);
    return scheduled;
  }

  private getNextAvailableSlot(): number {
    const now = Date.now();
    const minNext = now + (this.config.MIN_POST_INTERVAL_MINUTES * 60 * 1000);
    
    // Find the last scheduled time
    const lastScheduled = this.scheduledPosts
      .reduce((latest, post) => Math.max(latest, post.scheduled_at || 0), 0);
    
    return Math.max(minNext, lastScheduled + (this.config.MIN_POST_INTERVAL_MINUTES * 60 * 1000));
  }

  private groupByCategory(posts: EnhancedRedditPost[]): Map<string, EnhancedRedditPost[]> {
    const groups = new Map<string, EnhancedRedditPost[]>();
    
    posts.forEach(post => {
      const category = post.categories?.[0] || 'general';
      const existing = groups.get(category) || [];
      groups.set(category, [...existing, post]);
    });
    
    // Sort each category by priority score
    groups.forEach((posts, category) => {
      posts.sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));
      groups.set(category, posts);
    });
    
    return groups;
  }

  private interleaveCategories(postsByCategory: Map<string, EnhancedRedditPost[]>): EnhancedRedditPost[] {
    const categories = Array.from(postsByCategory.keys());
    const interleaved: EnhancedRedditPost[] = [];
    const maxLength = Math.max(...Array.from(postsByCategory.values()).map(arr => arr.length));
    
    for (let i = 0; i < maxLength; i++) {
      for (const category of categories) {
        const posts = postsByCategory.get(category) || [];
        if (posts[i]) {
          interleaved.push(posts[i]);
        }
      }
    }
    
    return interleaved;
  }

  private calculateIntervalVariability(post: EnhancedRedditPost): number {
    // Add variability based on post characteristics
    let variability = 0;
    
    // Higher quality posts can be posted slightly more frequently
    if ((post.priority_score || 0) > 0.8) variability -= 1;
    if ((post.priority_score || 0) < 0.3) variability += 2;
    
    // News posts can be more frequent
    if (post.categories?.includes('news')) variability -= 1;
    
    // Entertainment posts can have more spacing
    if (post.categories?.includes('entertainment')) variability += 1;
    
    return Math.max(-3, Math.min(5, variability)); // Clamp variability
  }

  /**
   * Get posts that are ready to be published now
   */
  getPostsReadyForPublishing(scheduledPosts: EnhancedRedditPost[]): EnhancedRedditPost[] {
    const now = Date.now();
    return scheduledPosts.filter(post => 
      post.processing_status === 'scheduled' && 
      (post.scheduled_at || 0) <= now
    );
  }

  /**
   * Mark posts as published
   */
  markAsPublished(posts: EnhancedRedditPost[]): EnhancedRedditPost[] {
    const now = Date.now();
    return posts.map(post => ({
      ...post,
      processing_status: 'published' as const,
      published_at: now,
    }));
  }

  /**
   * Get scheduling statistics for monitoring
   */
  getSchedulingStats(): {
    scheduledCount: number;
    nextPublishTime: number | null;
    averageInterval: number;
    categoryDistribution: Record<string, number>;
  } {
    const now = Date.now();
    const upcoming = this.scheduledPosts.filter(post => (post.scheduled_at || 0) > now);
    
    const intervals = upcoming
      .map((post, i, arr) => i > 0 ? (post.scheduled_at || 0) - (arr[i-1].scheduled_at || 0) : 0)
      .filter(interval => interval > 0);
    
    const averageInterval = intervals.length > 0 
      ? intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length / (60 * 1000)
      : 0;
    
    const categoryDistribution: Record<string, number> = {};
    upcoming.forEach(post => {
      const category = post.categories?.[0] || 'general';
      categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
    });
    
    return {
      scheduledCount: upcoming.length,
      nextPublishTime: upcoming[0]?.scheduled_at || null,
      averageInterval,
      categoryDistribution,
    };
  }

  /**
   * Clear all scheduled posts for a specific subreddit
   */
  clearScheduledPostsBySubreddit(subreddit: string): number {
    const beforeLength = this.scheduledPosts.length;
    this.scheduledPosts = this.scheduledPosts.filter(post => post.subreddit !== subreddit);
    const removedCount = beforeLength - this.scheduledPosts.length;
    
    console.log(`🗑️ SchedulerService: Cleared ${removedCount} scheduled post(s) for subreddit: r/${subreddit}`);
    return removedCount;
  }

  /**
   * Get count of scheduled posts by subreddit
   */
  getScheduledPostsBySubreddit(): { [subreddit: string]: number } {
    const subredditCounts: { [subreddit: string]: number } = {};
    
    this.scheduledPosts.forEach(post => {
      subredditCounts[post.subreddit] = (subredditCounts[post.subreddit] || 0) + 1;
    });
    
    return subredditCounts;
  }

  /**
   * Clear all scheduled posts (for debugging/management)
   */
  clearAllScheduledPosts(): number {
    const count = this.scheduledPosts.length;
    this.scheduledPosts = [];
    console.log(`🗑️ SchedulerService: Cleared all ${count} scheduled posts`);
    return count;
  }
}

export const schedulerService = new SchedulerService();
