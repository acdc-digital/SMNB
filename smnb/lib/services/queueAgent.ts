import { LiveFeedPost } from '@/lib/stores/liveFeedStore';

export interface QueueAgentConfig {
  intervalMs: number;
  maxQueueSize: number;
  sortBy: 'score' | 'created_utc' | 'random';
  sortOrder: 'asc' | 'desc';
}

export class QueueAgent {
  private queue: LiveFeedPost[] = [];
  private isProcessing = false;
  private config: QueueAgentConfig;
  private onPostReady?: (post: LiveFeedPost) => void;
  private processedPostIds = new Set<string>();

  constructor(config: QueueAgentConfig) {
    this.config = config;
  }

  // Set callback for when a post is ready to be displayed
  setOnPostReady(callback: (post: LiveFeedPost) => void) {
    this.onPostReady = callback;
  }

  // Add posts to the queue
  enqueue(posts: LiveFeedPost[]) {
    console.log(`📥 Queue Agent: Received ${posts.length} posts`);
    console.log(`📋 Current queue size: ${this.queue.length}`);
    console.log(`📋 Processed posts count: ${this.processedPostIds.size}`);

    // Filter out duplicates based on post ID (check both queue and processed posts)
    const uniquePosts = posts.filter(post => {
      const isDuplicate = this.queue.some(queued => queued.id === post.id) || this.processedPostIds.has(post.id);
      if (isDuplicate) {
        console.log(`🔄 Duplicate post filtered: ${post.title.substring(0, 30)}... (ID: ${post.id})`);
      }
      return !isDuplicate;
    });

    console.log(`✨ Unique posts to add: ${uniquePosts.length}`);

    if (uniquePosts.length === 0) {
      console.log('📭 Queue Agent: No new posts to enqueue');
      return;
    }

    // Add to queue
    this.queue.push(...uniquePosts);

    // Sort the queue
    this.sortQueue();

    // Trim queue if it exceeds max size
    if (this.queue.length > this.config.maxQueueSize) {
      const removed = this.queue.length - this.config.maxQueueSize;
      this.queue = this.queue.slice(0, this.config.maxQueueSize);
      console.log(`✂️ Queue Agent: Trimmed ${removed} posts from queue`);
    }

    console.log(`📋 Queue Agent: Queue now has ${this.queue.length} posts`);
    console.log(`🎯 Next post to process: ${this.queue[0]?.title.substring(0, 50)}...`);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing();
    }
  }

  // Sort the queue based on configuration
  private sortQueue() {
    this.queue.sort((a, b) => {
      let comparison = 0;

      switch (this.config.sortBy) {
        case 'score':
          comparison = b.score - a.score;
          break;
        case 'created_utc':
          comparison = b.created_utc - a.created_utc;
          break;
        case 'random':
          comparison = Math.random() - 0.5;
          break;
      }

      return this.config.sortOrder === 'desc' ? comparison : -comparison;
    });
  }

  // Start processing the queue
  private async startProcessing() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log('🚀 Queue Agent: Starting queue processing');

    while (this.queue.length > 0 && this.isProcessing) {
      console.log(`🔄 Processing loop - Queue length: ${this.queue.length}`);
      const post = this.queue.shift()!;
      console.log(`📤 Queue Agent: Processing post "${post.title.substring(0, 50)}..." (ID: ${post.id})`);
      console.log(`📋 Queue after shift: ${this.queue.length} posts remaining`);

      // Mark this post as processed
      this.processedPostIds.add(post.id);

      // Call the callback to add post to UI
      if (this.onPostReady) {
        console.log(`📞 Calling onPostReady callback for post: ${post.title.substring(0, 30)}...`);
        this.onPostReady(post);
      } else {
        console.log(`⚠️ No onPostReady callback set!`);
      }

      // Wait for the configured interval before processing next post
      if (this.queue.length > 0) {
        console.log(`⏱️ Queue Agent: Waiting ${this.config.intervalMs}ms before next post`);
        console.log(`🎯 Next post in queue: ${this.queue[0]?.title.substring(0, 50)}...`);
        await this.sleep(this.config.intervalMs);
      } else {
        console.log(`🏁 Queue is now empty, finishing processing`);
      }
    }

    this.isProcessing = false;
    console.log('🏁 Queue Agent: Finished processing queue');
  }

  // Stop processing
  stop() {
    this.isProcessing = false;
    console.log('🛑 Queue Agent: Stopped');
  }

  // Clear the queue
  clear() {
    this.queue = [];
    this.processedPostIds.clear();
    console.log('🧹 Queue Agent: Queue and processed posts cleared');
  }

  // Get current queue status
  getStatus() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      config: this.config
    };
  }

  // Update configuration
  updateConfig(newConfig: Partial<QueueAgentConfig>) {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Queue Agent: Configuration updated', this.config);

    // Re-sort if sort configuration changed
    if (newConfig.sortBy || newConfig.sortOrder) {
      this.sortQueue();
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create a singleton instance
export const queueAgent = new QueueAgent({
  intervalMs: 2000, // 2 seconds between posts
  maxQueueSize: 50,
  sortBy: 'score',
  sortOrder: 'desc'
});
