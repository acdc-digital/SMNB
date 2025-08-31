import { LiveFeedPost } from '@/lib/stores/livefeed/simpleLiveFeedStore';

export interface SimpleLiveFeedServiceConfig {
  subreddits: string[];
  intervalSeconds: number;
  contentMode: 'sfw' | 'nsfw';
}

class SimpleLiveFeedService {
  private intervalId: number | null = null;
  private isRunning = false;
  private lastFetchTime = 0;
  private currentPage = 0;
  private usedSubreddits = new Set<string>();
  
  async start(
    onNewPost: (post: LiveFeedPost) => void,
    onError: (error: string | null) => void,
    onLoading: (loading: boolean) => void,
    config: SimpleLiveFeedServiceConfig,
    clearOldPosts?: () => void
  ) {
    if (this.isRunning) {
      this.stop();
    }
    
    this.isRunning = true;
    console.log('🚀 Simple LiveFeed Service: Starting...');
    
    // Fetch immediately
    this.fetchAndProcess(onNewPost, onError, onLoading, config);
    
    // Clear old posts every 5 minutes to allow fresh content
    const clearOldPostsInterval = 5 * 60 * 1000; // 5 minutes
    if (clearOldPosts) {
      setInterval(() => {
        console.log('🧹 Periodic cleanup of old posts...');
        clearOldPosts();
      }, clearOldPostsInterval);
    }
    
    // Then fetch at intervals
    this.intervalId = window.setInterval(() => {
      if (this.isRunning) {
        this.fetchAndProcess(onNewPost, onError, onLoading, config);
      }
    }, config.intervalSeconds * 1000);
  }
  
  stop() {
    console.log('🛑 Simple LiveFeed Service: Stopping...');
    this.isRunning = false;
    
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  private async fetchAndProcess(
    onNewPost: (post: LiveFeedPost) => void,
    onError: (error: string | null) => void,
    onLoading: (loading: boolean) => void,
    config: SimpleLiveFeedServiceConfig
  ) {
    try {
      onLoading(true);
      onError(null);
      
      console.log(`🔄 Fetching from: ${config.subreddits.join(', ')}`);
      
      const posts = await this.fetchPosts(config.subreddits, config.contentMode);
      console.log(`📦 Fetched ${posts.length} posts`);
      
      // Process posts one by one (but much faster than the old queue)
      for (const post of posts) {
        onNewPost(post);
        // Small delay to create a smooth flow effect
        await this.sleep(100);
      }
      
    } catch (error) {
      console.error('❌ SimpleLiveFeedService error:', error);
      onError(error instanceof Error ? error.message : 'Failed to fetch posts');
    } finally {
      onLoading(false);
    }
  }
  
  private async fetchPosts(subreddits: string[], contentMode: 'sfw' | 'nsfw'): Promise<LiveFeedPost[]> {
    const allPosts: LiveFeedPost[] = [];
    
    // Rotate through subreddits to get variety
    const availableSubreddits = subreddits.filter(sub => !this.usedSubreddits.has(sub));
    if (availableSubreddits.length === 0) {
      // Reset if we've used all subreddits
      this.usedSubreddits.clear();
      availableSubreddits.push(...subreddits);
    }
    
    // Pick one subreddit for this fetch to maximize variety
    const selectedSubreddit = availableSubreddits[Math.floor(Math.random() * availableSubreddits.length)];
    this.usedSubreddits.add(selectedSubreddit);
    
    try {
      // Use different sorting methods for variety
      const sortMethods = ['new', 'rising', 'hot'];
      const currentSort = sortMethods[this.currentPage % sortMethods.length];
      
      const response = await fetch(`/api/reddit?subreddit=${selectedSubreddit}&limit=10&sort=${currentSort}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${selectedSubreddit}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`📦 API response for r/${selectedSubreddit} (${currentSort}):`, data);
      
      // Check if our API returned success and posts
      if (!data.success || !Array.isArray(data.posts)) {
        console.error(`❌ API error for r/${selectedSubreddit}:`, data.error || 'No posts returned');
        return allPosts;
      }
      
      const posts = data.posts.map((postData: Record<string, unknown>) => {
        return {
          id: postData.id as string,
          title: postData.title as string,
          author: postData.author as string,
          subreddit: postData.subreddit as string,
          url: postData.url as string,
          permalink: `https://reddit.com${postData.permalink}`,
          score: postData.score as number,
          num_comments: postData.num_comments as number,
          created_utc: postData.created_utc as number,
          thumbnail: postData.thumbnail as string,
          selftext: (postData.selftext as string) || '',
          is_video: (postData.is_video as boolean) || false,
          domain: postData.domain as string,
          upvote_ratio: postData.upvote_ratio as number,
          over_18: postData.over_18 as boolean,
          source: 'reddit' as const,
          addedAt: Date.now(),
          batchId: Date.now(),
        };
      });
      
      // Filter by content mode
      const filteredPosts = posts.filter((post: LiveFeedPost) => {
        if (contentMode === 'sfw') {
          return !post.over_18;
        } else {
          return post.over_18;
        }
      });
      
      allPosts.push(...filteredPosts);
      
      // Increment page counter for next fetch
      this.currentPage++;
      
    } catch (error) {
      console.error(`❌ Failed to fetch from ${selectedSubreddit}:`, error);
    }
    
    // Sort by creation time (newest first)
    return allPosts.sort((a, b) => b.created_utc - a.created_utc);
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const simpleLiveFeedService = new SimpleLiveFeedService();
