import { NextRequest, NextResponse } from 'next/server';
import { redditAPI, RedditPost } from '@/lib/reddit';

interface SubredditResult {
  subreddit: string;
  posts: RedditPost[];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subreddit = searchParams.get('subreddit') || 'all';
  const sort = searchParams.get('sort') || 'hot';
  const limit = parseInt(searchParams.get('limit') || '10');
  const query = searchParams.get('q'); // Search query parameter

  try {
    let response;
    
    console.log(`Reddit API: Processing request - query: "${query}", subreddit: "${subreddit}", sort: "${sort}", limit: ${limit}`);
    
    // For search requests, map sort values appropriately
    if (query) {
      const time = searchParams.get('t') || 'day';
      console.log(`Reddit API: Attempting search with query: "${query}"`);
      
      // Map sort values for search API (search has different sort options)
      let searchSort: 'relevance' | 'hot' | 'top' | 'new' | 'comments' = 'relevance';
      switch (sort) {
        case 'hot':
          searchSort = 'hot';
          break;
        case 'new':
          searchSort = 'new';
          break;
        case 'top':
          searchSort = 'top';
          break;
        case 'rising': // rising is not available in search, use relevance
          searchSort = 'relevance';
          break;
        default:
          searchSort = 'relevance';
      }
      
      try {
        response = await redditAPI.searchPosts(
          query,
          subreddit,
          searchSort,
          time as 'hour' | 'day' | 'week' | 'month' | 'year' | 'all',
          Math.min(limit, 25)
        );
        console.log(`Reddit API: Search successful with sort: ${searchSort}`);
      } catch (searchError) {
        console.error(`Reddit API: Search failed, falling back to regular fetch:`, searchError);
        // Fall back to regular fetch
        response = await redditAPI.fetchPosts(
          subreddit,
          sort as 'hot' | 'new' | 'rising' | 'top',
          Math.min(limit, 25)
        );
        console.log(`Reddit API: Fallback fetch successful`);
      }
    } else {
      // Otherwise use regular fetch
      console.log(`Reddit API: Performing regular fetch`);
      response = await redditAPI.fetchPosts(
        subreddit,
        sort as 'hot' | 'new' | 'rising' | 'top',
        Math.min(limit, 25)
      );
    }

    console.log(`Reddit API: Response received, children count: ${response.data?.children?.length || 0}`);
    
    return NextResponse.json({
      success: true,
      posts: response.data.children.map((child: { data: RedditPost }) => child.data),
      pagination: {
        after: response.data.after,
        before: response.data.before,
      }
    });
  } catch (error) {
    console.error('Reddit API error details:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Handle circuit breaker specifically
    if (errorMessage.includes('Circuit breaker')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Reddit API is temporarily unavailable due to rate limits. Please try again later.',
          circuitBreakerOpen: true,
          posts: []
        },
        { status: 503 } // Service Unavailable
      );
    }
    
    // Handle rate limiting specifically
    if (errorMessage.includes('Rate limited') || errorMessage.includes('429')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Reddit API rate limit reached. Please wait before making more requests.',
          rateLimited: true,
          posts: []
        },
        { status: 429 }
      );
    }
    
    // Handle access blocked
    if (errorMessage.includes('blocked') || errorMessage.includes('403')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Reddit API access blocked. Try again later.',
          blocked: true,
          posts: []
        },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        posts: []
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subreddits, sort = 'hot', limit = 5 } = body;

    if (!Array.isArray(subreddits)) {
      return NextResponse.json(
        { success: false, error: 'subreddits must be an array' },
        { status: 400 }
      );
    }

    const promises = subreddits.map(async (subreddit: string) => {
      const response = await redditAPI.fetchPosts(
        subreddit,
        sort as 'hot' | 'new' | 'rising' | 'top',
        Math.min(limit, 10)
      );
      return {
        subreddit,
        posts: response.data.children.map((child: { data: RedditPost }) => child.data),
      };
    });

    const results = await Promise.allSettled(promises);
    
    const successful = results
      .filter((result): result is PromiseFulfilledResult<SubredditResult> => result.status === 'fulfilled')
      .map(result => result.value);

    const failed = results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map(result => result.reason);

    return NextResponse.json({
      success: true,
      successful,
      failed: failed.length > 0 ? failed : undefined,
    });
  } catch (error) {
    console.error('Multiple subreddit fetch error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
