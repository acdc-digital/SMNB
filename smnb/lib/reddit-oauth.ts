// Enhanced Reddit API client with OAuth support for 600/min rate limit
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

export interface RedditOAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export type SortType = 'hot' | 'new' | 'rising' | 'top';
export type TimeFilter = 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';

class RedditAPIWithOAuth {
  private baseUrl = 'https://www.reddit.com';
  private oauthUrl = 'https://oauth.reddit.com';
  private tokenUrl = 'https://www.reddit.com/api/v1/access_token';
  
  private clientId: string;
  private clientSecret: string;
  private userAgent: string;
  
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private isAuthenticated = false;

  constructor() {
    this.clientId = process.env.REDDIT_CLIENT_ID || '';
    this.clientSecret = process.env.REDDIT_CLIENT_SECRET || '';
    this.userAgent = process.env.REDDIT_USER_AGENT || 'SMNB-Reddit-Client/1.0';
    
    // Check if OAuth credentials are available
    this.isAuthenticated = !!(this.clientId && this.clientSecret);
  }

  /**
   * Get access token using client credentials flow
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (!this.isAuthenticated) {
      throw new Error('Reddit OAuth credentials not configured');
    }

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    try {
      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'User-Agent': this.userAgent,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        throw new Error(`OAuth token request failed: ${response.status} ${response.statusText}`);
      }

      const tokenData: RedditOAuthResponse = await response.json();
      
      this.accessToken = tokenData.access_token;
      // Set expiry with 5-minute buffer
      this.tokenExpiry = Date.now() + ((tokenData.expires_in - 300) * 1000);

      return this.accessToken;
    } catch (error) {
      console.error('Error getting Reddit OAuth token:', error);
      throw error;
    }
  }

  /**
   * Make authenticated request to Reddit API
   */
  private async makeRequest(endpoint: string, params?: URLSearchParams): Promise<RedditResponse | Record<string, unknown>> {
    let url: string;
    const headers: Record<string, string> = {
      'User-Agent': this.userAgent,
    };

    if (this.isAuthenticated) {
      try {
        const token = await this.getAccessToken();
        headers['Authorization'] = `Bearer ${token}`;
        url = `${this.oauthUrl}${endpoint}`;
        if (params) {
          url += `?${params.toString()}`;
        }
      } catch (error) {
        console.warn('OAuth failed, falling back to anonymous API:', error);
        // Fall back to anonymous API
        url = `${this.baseUrl}${endpoint}`;
        if (params) {
          url += `?${params.toString()}`;
        }
        delete headers['Authorization'];
      }
    } else {
      // Use anonymous API
      url = `${this.baseUrl}${endpoint}`;
      if (params) {
        url += `?${params.toString()}`;
      }
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get current rate limit info
   */
  getRateLimitInfo(): { authenticated: boolean; rateLimit: string } {
    return {
      authenticated: this.isAuthenticated,
      rateLimit: this.isAuthenticated ? '600 requests/minute' : '60 requests/minute'
    };
  }

  /**
   * Fetch posts from a specific subreddit or r/all
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
      raw_json: '1',
    });

    if (after) {
      params.append('after', after);
    }

    if (sort === 'top') {
      params.append('t', timeFilter);
    }

    const endpoint = `/r/${subreddit}/${sort}.json`;
    return await this.makeRequest(endpoint, params) as RedditResponse;
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

    const endpoint = `/r/${subreddit}/search.json`;
    return await this.makeRequest(endpoint, params) as RedditResponse;
  }

  /**
   * Get post details with comments
   */
  async getPostDetails(subreddit: string, postId: string) {
    const endpoint = `/r/${subreddit}/comments/${postId}.json`;
    return await this.makeRequest(endpoint) as unknown as Record<string, unknown>[];
  }
}

// Export singleton instance
export const redditAPI = new RedditAPIWithOAuth();

// Helper functions for common use cases
export const getHotPosts = (subreddit = 'all', limit = 25) => 
  redditAPI.fetchPosts(subreddit, 'hot', limit);

export const getRisingPosts = (subreddit = 'all', limit = 25) => 
  redditAPI.fetchPosts(subreddit, 'rising', limit);

export const getTrendingPosts = (timeFilter: TimeFilter = 'hour', limit = 25) => 
  redditAPI.fetchPosts('all', 'top', limit, timeFilter);

export const getTopPostsToday = (subreddit = 'all', limit = 25) => 
  redditAPI.fetchPosts(subreddit, 'top', limit, 'day');
