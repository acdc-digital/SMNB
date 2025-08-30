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

class RedditAPI {
  private baseUrl = 'https://www.reddit.com';
  private userAgent = 'SMNB-Reddit-Client/1.0';

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
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
        },
      });

      if (!response.ok) {
        throw new Error(`Reddit search error: ${response.status} ${response.statusText}`);
      }

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
