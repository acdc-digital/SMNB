// REDDIT ACTIONS
// /Users/matthewsimon/Projects/SMNB/smnb/lib/reddit-actions.ts

'use server'

import { redditAPI, RedditPost } from '@/lib/reddit-oauth';

export interface RedditPostWithMeta extends RedditPost {
  sort_type: string;
  time_filter?: string;
  fetched_at: number;
}

// Server action to fetch hot posts from Reddit
export async function fetchHotPosts(subreddit: string = 'all', limit: number = 25) {
  try {
    const response = await redditAPI.fetchPosts(subreddit, 'hot', limit);
    
    const posts: RedditPostWithMeta[] = response.data.children.map((child) => ({
      ...child.data,
      sort_type: 'hot',
      fetched_at: Date.now(),
    }));

    return { posts, after: response.data.after, error: null };
  } catch (error) {
    console.error('Error fetching hot posts:', error);
    return { 
      posts: [], 
      after: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Server action to fetch rising posts
export async function fetchRisingPosts(subreddit: string = 'all', limit: number = 25) {
  try {
    const response = await redditAPI.fetchPosts(subreddit, 'rising', limit);
    
    const posts: RedditPostWithMeta[] = response.data.children.map((child) => ({
      ...child.data,
      sort_type: 'rising',
      fetched_at: Date.now(),
    }));

    return { posts, after: response.data.after, error: null };
  } catch (error) {
    console.error('Error fetching rising posts:', error);
    return { 
      posts: [], 
      after: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Server action to fetch trending posts (top posts from the last hour)
export async function fetchTrendingPosts(subreddit: string = 'all', limit: number = 25) {
  try {
    const response = await redditAPI.fetchPosts(subreddit, 'top', limit, 'hour');
    
    const posts: RedditPostWithMeta[] = response.data.children.map((child) => ({
      ...child.data,
      sort_type: 'top',
      time_filter: 'hour',
      fetched_at: Date.now(),
    }));

    return { posts, after: response.data.after, error: null };
  } catch (error) {
    console.error('Error fetching trending posts:', error);
    return { 
      posts: [], 
      after: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Server action to fetch posts from multiple subreddits
export async function fetchMultipleSubreddits(
  subreddits: string[],
  sortType: 'hot' | 'rising' | 'top' = 'hot',
  limit: number = 10
) {
  try {
    const promises = subreddits.map(async (subreddit) => {
      const response = await redditAPI.fetchPosts(subreddit, sortType, limit);
      return {
        subreddit,
        posts: response.data.children.map((child): RedditPostWithMeta => ({
          ...child.data,
          sort_type: sortType,
          fetched_at: Date.now(),
        })),
      };
    });

    const results = await Promise.allSettled(promises);
    
    const successful = results
      .filter((result): result is PromiseFulfilledResult<{ subreddit: string; posts: RedditPostWithMeta[] }> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);

    const failed = results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map(result => result.reason);

    return { successful, failed, error: null };
  } catch (error) {
    console.error('Error fetching multiple subreddits:', error);
    return { 
      successful: [], 
      failed: [],
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Server action to search Reddit posts
export async function searchRedditPosts(
  query: string,
  subreddit: string = 'all',
  sort: 'relevance' | 'hot' | 'top' | 'new' | 'comments' = 'relevance',
  limit: number = 25
) {
  try {
    const response = await redditAPI.searchPosts(query, subreddit, sort, 'all', limit);
    
    const posts: RedditPostWithMeta[] = response.data.children.map((child: { data: RedditPost }) => ({
      ...child.data,
      sort_type: 'search',
      fetched_at: Date.now(),
    }));

    return { posts, after: response.data.after, error: null };
  } catch (error) {
    console.error('Error searching Reddit posts:', error);
    return { 
      posts: [], 
      after: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
