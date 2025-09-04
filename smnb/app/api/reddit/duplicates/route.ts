// REDDIT DUPLICATES API ROUTE
// /Users/matthewsimon/Projects/SMNB/smnb/app/api/reddit/duplicates/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { redditAPI, RedditResponse } from '@/lib/reddit';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { success: false, error: 'URL parameter is required' },
      { status: 400 }
    );
  }

  try {
    const duplicatesResponse = await redditAPI.getDuplicates(url);
    const metrics = redditAPI.analyzeDuplicateMetrics(duplicatesResponse as RedditResponse[]);

    return NextResponse.json({
      success: true,
      duplicates: duplicatesResponse,
      metrics
    });
  } catch (error) {
    console.error('Duplicates API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Handle circuit breaker
    if (errorMessage.includes('Circuit breaker')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Reddit API is temporarily unavailable due to rate limits. Please try again later.',
          circuitBreakerOpen: true
        },
        { status: 503 }
      );
    }
    
    // Handle rate limiting
    if (errorMessage.includes('Rate limited') || errorMessage.includes('429')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Reddit API rate limit reached. Please wait before making more requests.',
          rateLimited: true
        },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  }
}
