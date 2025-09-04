// REDDIT API CLIENT
// /Users/matthewsimon/Projects/SMNB/smnb/lib/reddit.ts

// Reddit API client for fetching hot, rising, and trending posts
export interface RedditPost {
  id: string;
  title: string;
  author: string;
  subreddit: string;
  url: string;
  permalink: string;
  score: number;
  num_comments: number;
  created_utc: number;
  thumbnail: string;
  selftext: string;
  is_video: boolean;
  domain: string;
  upvote_ratio: number;
  over_18: boolean;
}

export interface RedditResponse {
  kind: string;
  data: {
    after: string | null;
    before: string | null;
    children: Array<{
      kind: string;
      data: RedditPost;
    }>;
  };
}

export type SortType = 'hot' | 'new' | 'rising' | 'top';
export type TimeFilter = 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';

// Global rate limiting state shared across all instances
class GlobalRateLimiter {
  private static instance: GlobalRateLimiter;
  private lastRequestTime = 0;
  private rateLimitBackoff = 0;
  private minRequestInterval = 5000; // Increased to 5 seconds
  private maxBackoff = 60000; // Max 1 minute backoff
  private backoffIncrement = 10000; // 10 second increments
  private circuitBreakerThreshold = 30000; // 30 seconds - circuit breaker threshold
  private circuitBreakerResetTime = 120000; // 2 minutes to reset circuit breaker
  private isCircuitBreakerOpen = false;
  private circuitBreakerOpenedAt = 0;

  static getInstance(): GlobalRateLimiter {
    if (!GlobalRateLimiter.instance) {
      GlobalRateLimiter.instance = new GlobalRateLimiter();
    }
    return GlobalRateLimiter.instance;
  }

  async waitForNextRequest(): Promise<void> {
    // Check if circuit breaker should be reset
    if (this.isCircuitBreakerOpen) {
      const timeSinceOpened = Date.now() - this.circuitBreakerOpenedAt;
      if (timeSinceOpened > this.circuitBreakerResetTime) {
        console.log('🔄 Circuit breaker reset - attempting to resume Reddit API calls');
        this.isCircuitBreakerOpen = false;
        this.rateLimitBackoff = Math.floor(this.rateLimitBackoff / 2); // Reduce backoff on reset
      } else {
        const remainingTime = this.circuitBreakerResetTime - timeSinceOpened;
        throw new Error(`Circuit breaker is open - Reddit API calls suspended for ${Math.round(remainingTime / 1000)} more seconds`);
      }
    }

    const now = Date.now();
    const totalDelay = this.minRequestInterval + this.rateLimitBackoff;
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < totalDelay) {
      const delay = totalDelay - timeSinceLastRequest;
      console.log(`⏳ Global rate limiter: waiting ${delay}ms (backoff: ${this.rateLimitBackoff}ms)`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }

  increaseBackoff(): void {
    this.rateLimitBackoff = Math.min(this.rateLimitBackoff + this.backoffIncrement, this.maxBackoff);
    console.warn(`⚠️ Rate limit hit - backoff increased to ${this.rateLimitBackoff}ms`);
    
    // Open circuit breaker if backoff is too high
    if (this.rateLimitBackoff >= this.circuitBreakerThreshold && !this.isCircuitBreakerOpen) {
      this.isCircuitBreakerOpen = true;
      this.circuitBreakerOpenedAt = Date.now();
      console.error(`🚫 Circuit breaker opened - suspending Reddit API calls for ${this.circuitBreakerResetTime / 1000} seconds`);
    }
  }

  decreaseBackoff(): void {
    if (this.rateLimitBackoff > 0) {
      this.rateLimitBackoff = Math.max(0, this.rateLimitBackoff - (this.backoffIncrement / 2));
      console.log(`✅ Request succeeded - backoff reduced to ${this.rateLimitBackoff}ms`);
    }
  }

  getCurrentBackoff(): number {
    return this.rateLimitBackoff;
  }

  isCircuitOpen(): boolean {
    return this.isCircuitBreakerOpen;
  }
}

class RedditAPI {
  private baseUrl = 'https://www.reddit.com';
  private userAgent = 'Mozilla/5.0 (compatible; SMNB-Reddit-Client/1.0; +https://github.com/acdc-digital/smnb)';
  private rateLimiter = GlobalRateLimiter.getInstance();

  /**
   * Fetch posts from a specific subreddit or r/all
   * @param subreddit - The subreddit name (without 'r/') or 'all' for front page
   * @param sort - Sort type: 'hot', 'new', 'rising', 'top'
   * @param limit - Number of posts to fetch (1-100)
   * @param timeFilter - Time filter for 'top' sort
   * @param after - Pagination token for next page
   */
  async fetchPosts(
    subreddit: string = 'all',
    sort: SortType = 'hot',
    limit: number = 25,
    timeFilter: TimeFilter = 'day',
    after?: string
  ): Promise<RedditResponse> {
    const params = new URLSearchParams({
      limit: Math.min(limit, 100).toString(),
      raw_json: '1', // Prevents HTML encoding
    });

    if (after) {
      params.append('after', after);
    }

    if (sort === 'top') {
      params.append('t', timeFilter);
    }

    const url = `${this.baseUrl}/r/${subreddit}/${sort}.json?${params}`;

    try {
      // Use global rate limiter
      await this.rateLimiter.waitForNextRequest();
      
      console.log(`🌐 Fetching Reddit: ${url} (backoff: ${this.rateLimiter.getCurrentBackoff()}ms)`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        method: 'GET',
      });

      console.log(`📊 Reddit response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const responseText = await response.text();
        console.error('❌ Reddit API error response:', responseText);
        
        if (response.status === 403) {
          console.warn(`⚠️ Reddit blocked access to r/${subreddit}. This may be due to rate limiting or bot detection.`);
          throw new Error(`Reddit access blocked for r/${subreddit}. Try again later.`);
        }
        
        if (response.status === 429) {
          // Increase global backoff
          this.rateLimiter.increaseBackoff();
          throw new Error(`Rate limited by Reddit for r/${subreddit}. Please slow down requests.`);
        }
        
        throw new Error(`Reddit API error: ${response.status} ${response.statusText}`);
      }

      // Success - reduce backoff gradually
      this.rateLimiter.decreaseBackoff();

      return await response.json();
    } catch (error) {
      console.error('Error fetching Reddit posts:', error);
      throw error;
    }
  }

  /**
   * Fetch hot posts from multiple subreddits
   */
  async fetchHotPosts(subreddits: string[] = ['all'], limit: number = 10) {
    const results = await Promise.allSettled(
      subreddits.map(sub => this.fetchPosts(sub, 'hot', limit))
    );

    return results
      .filter((result): result is PromiseFulfilledResult<RedditResponse> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);
  }

  /**
   * Fetch rising posts (trending up)
   */
  async fetchRisingPosts(subreddit: string = 'all', limit: number = 25) {
    return this.fetchPosts(subreddit, 'rising', limit);
  }

  /**
   * Fetch top posts with time filter
   */
  async fetchTopPosts(
    subreddit: string = 'all', 
    timeFilter: TimeFilter = 'day', 
    limit: number = 25
  ) {
    return this.fetchPosts(subreddit, 'top', limit, timeFilter);
  }

  /**
   * Search for posts in a subreddit
   */
  async searchPosts(
    query: string,
    subreddit: string = 'all',
    sort: 'relevance' | 'hot' | 'top' | 'new' | 'comments' = 'relevance',
    timeFilter: TimeFilter = 'all',
    limit: number = 25
  ) {
    const params = new URLSearchParams({
      q: query,
      sort,
      t: timeFilter,
      limit: Math.min(limit, 100).toString(),
      restrict_sr: subreddit !== 'all' ? 'on' : 'off',
      raw_json: '1',
    });

    const url = `${this.baseUrl}/r/${subreddit}/search.json?${params}`;

    try {
      // Use global rate limiter for search requests too
      await this.rateLimiter.waitForNextRequest();
      
      console.log(`🔍 Searching Reddit: ${url} (backoff: ${this.rateLimiter.getCurrentBackoff()}ms)`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
      });

      console.log(`🔍 Search response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        if (response.status === 429) {
          this.rateLimiter.increaseBackoff();
        }
        throw new Error(`Reddit search error: ${response.status} ${response.statusText}`);
      }

      // Success - reduce backoff
      this.rateLimiter.decreaseBackoff();
      
      return await response.json();
    } catch (error) {
      console.error('Error searching Reddit posts:', error);
      throw error;
    }
  }

  /**
   * Get post details with comments
   */
  async getPostDetails(subreddit: string, postId: string) {
    const url = `${this.baseUrl}/r/${subreddit}/comments/${postId}.json`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
        },
      });

      if (!response.ok) {
        throw new Error(`Reddit API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching post details:', error);
      throw error;
    }
  }

  /**
   * Find duplicate posts for a given article URL
   * @param articleUrl - The URL of the article to find duplicates for
   * @param limit - Number of duplicate posts to return (1-100)
   */
  async getDuplicates(articleUrl: string, limit: number = 25) {
    // Extract the post ID from the URL if it's a Reddit permalink
    let url: string;
    
    if (articleUrl.includes('reddit.com/r/')) {
      // If it's a Reddit permalink, use the duplicates endpoint
      const match = articleUrl.match(/\/r\/([^\/]+)\/comments\/([^\/]+)/);
      if (match) {
        const [, subreddit, postId] = match;
        url = `${this.baseUrl}/r/${subreddit}/duplicates/${postId}.json`;
      } else {
        throw new Error('Invalid Reddit URL format');
      }
    } else {
      // For external URLs, search for posts linking to that URL
      return await this.searchPosts(`url:"${articleUrl}"`, 'all', 'top', 'all', limit);
    }

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
        },
      });

      if (!response.ok) {
        throw new Error(`Reddit duplicates API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Reddit duplicates:', error);
      throw error;
    }
  }

  /**
   * Analyze duplicate metrics for a story
   * @param duplicates - Response from getDuplicates
   */
  analyzeDuplicateMetrics(duplicates: RedditResponse[]) {
    if (!Array.isArray(duplicates) || duplicates.length < 2) {
      return {
        totalDuplicates: 0,
        subredditDiversity: 0,
        totalEngagement: 0,
        averageScore: 0,
        subreddits: [],
        engagementBySubreddit: {}
      };
    }

    const posts = duplicates[1]?.data?.children || [];
    const subreddits = new Set<string>();
    let totalScore = 0;
    let totalComments = 0;
    const engagementBySubreddit: { [key: string]: { score: number; comments: number; count: number } } = {};

    posts.forEach(post => {
      const postData = post.data;
      subreddits.add(postData.subreddit);
      totalScore += postData.score;
      totalComments += postData.num_comments;

      if (!engagementBySubreddit[postData.subreddit]) {
        engagementBySubreddit[postData.subreddit] = { score: 0, comments: 0, count: 0 };
      }
      engagementBySubreddit[postData.subreddit].score += postData.score;
      engagementBySubreddit[postData.subreddit].comments += postData.num_comments;
      engagementBySubreddit[postData.subreddit].count += 1;
    });

    return {
      totalDuplicates: posts.length,
      subredditDiversity: subreddits.size,
      totalEngagement: totalScore + totalComments,
      averageScore: posts.length > 0 ? totalScore / posts.length : 0,
      subreddits: Array.from(subreddits),
      engagementBySubreddit
    };
  }
}

// Export singleton instance
export const redditAPI = new RedditAPI();

// Helper functions for common use cases
export const getHotPosts = (subreddit = 'all', limit = 25) => 
  redditAPI.fetchPosts(subreddit, 'hot', limit);

export const getRisingPosts = (subreddit = 'all', limit = 25) => 
  redditAPI.fetchPosts(subreddit, 'rising', limit);

export const getTrendingPosts = (timeFilter: TimeFilter = 'hour', limit = 25) => 
  redditAPI.fetchPosts('all', 'top', limit, timeFilter);

export const getTopPostsToday = (subreddit = 'all', limit = 25) => 
  redditAPI.fetchPosts(subreddit, 'top', limit, 'day');
