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

  try {
    const response = await redditAPI.fetchPosts(
      subreddit,
      sort as 'hot' | 'new' | 'rising' | 'top',
      Math.min(limit, 25)
    );

    return NextResponse.json({
      success: true,
      posts: response.data.children.map(child => child.data),
      pagination: {
        after: response.data.after,
        before: response.data.before,
      }
    });
  } catch (error) {
    console.error('Reddit API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
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
        posts: response.data.children.map(child => child.data),
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
