// ENHANCED REDDIT POST TYPES
// /Users/matthewsimon/Projects/SMNB/smnb/lib/types/enhancedRedditPost.ts

export interface EnhancedRedditPost {
  // Core Reddit data (existing)
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
  source: 'reddit';

  // New metadata fields
  fetch_timestamp: number;
  engagement_score: number;

  // Processing pipeline status
  processing_status: 'raw' | 'enriched' | 'scored' | 'scheduled' | 'published';

  // Enrichment data (optional - added by EnrichmentAgent)
  sentiment?: 'positive' | 'neutral' | 'negative';
  categories?: string[];
  quality_score?: number;

  // Scheduling data (optional - added by ScoringAgent & Scheduler)
  priority_score?: number;
  scheduled_at?: number;
  published_at?: number;

  // Display data (for UI)
  addedAt?: number;
  batchId?: number;
  isNew?: boolean;
}

export interface QueueConfig {
  // Posting frequency
  MIN_POST_INTERVAL_MINUTES: number;
  MAX_POST_INTERVAL_MINUTES: number;
  MAX_POSTS_PER_HOUR: number;

  // Content diversity
  MAX_POSTS_PER_SUBREDDIT_PER_HOUR: number;

  // Scoring weights
  ENGAGEMENT_WEIGHT: number;
  RECENCY_WEIGHT: number;
  QUALITY_WEIGHT: number;

  // Time decay (posts lose relevance over time)
  HALF_LIFE_HOURS: number;

  // Peak hours (when to post more frequently)
  PEAK_HOURS_UTC: number[];
}

export const DEFAULT_QUEUE_CONFIG: QueueConfig = {
  MIN_POST_INTERVAL_MINUTES: 5,
  MAX_POST_INTERVAL_MINUTES: 15,
  MAX_POSTS_PER_HOUR: 8,
  MAX_POSTS_PER_SUBREDDIT_PER_HOUR: 6, // Increased from 2 to 6 to allow more diverse content
  ENGAGEMENT_WEIGHT: 0.4,
  RECENCY_WEIGHT: 0.3,
  QUALITY_WEIGHT: 0.3,
  HALF_LIFE_HOURS: 6,
  PEAK_HOURS_UTC: [13, 14, 15, 16, 17, 18, 19, 20, 21], // 1PM-9PM UTC
};
