import { EnhancedRedditPost, QueueConfig, DEFAULT_QUEUE_CONFIG } from '@/lib/types/enhancedRedditPost';

export class ScoringAgent {
  private config: QueueConfig;

  constructor(config: QueueConfig = DEFAULT_QUEUE_CONFIG) {
    this.config = config;
  }

  /**
   * Processes enriched posts and calculates priority scores
   * Runs every minute to score newly enriched posts
   */
  async processEnrichedPosts(enrichedPosts: EnhancedRedditPost[]): Promise<EnhancedRedditPost[]> {
    console.log(`📊 ScoringAgent: Scoring ${enrichedPosts.length} enriched posts...`);
    
    const scoredPosts = enrichedPosts.map(post => this.scorePost(post));
    
    // Sort by priority score (highest first)
    scoredPosts.sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));
    
    console.log(`✅ ScoringAgent: Scored ${scoredPosts.length} posts (top score: ${scoredPosts[0]?.priority_score?.toFixed(3)})`);
    return scoredPosts;
  }

  private scorePost(post: EnhancedRedditPost): EnhancedRedditPost {
    const priority_score = this.calculatePriorityScore(post);
    
    return {
      ...post,
      processing_status: 'scored',
      priority_score,
    };
  }

  calculatePriorityScore(post: EnhancedRedditPost): number {
    const now = Date.now();
    const ageInHours = (now - post.created_utc * 1000) / (1000 * 60 * 60);
    
    // Time decay factor using exponential decay
    const recencyScore = Math.exp(-0.693 * ageInHours / this.config.HALF_LIFE_HOURS);
    
    // Engagement score (normalized 0-1)
    const engagementScore = Math.min(post.engagement_score / 1000, 1);
    
    // Quality score from enrichment (default 0.5 if not available)
    const qualityScore = post.quality_score || 0.5;
    
    // Bonus factors
    let bonusMultiplier = 1.0;
    
    // Category bonuses
    if (post.categories?.includes('technology')) bonusMultiplier += 0.1;
    if (post.categories?.includes('news')) bonusMultiplier += 0.15;
    if (post.categories?.includes('education')) bonusMultiplier += 0.05;
    
    // Sentiment bonus (positive content slightly preferred)
    if (post.sentiment === 'positive') bonusMultiplier += 0.05;
    
    // Subreddit weighting (some subreddits are more valuable)
    const subredditWeight = this.getSubredditWeight(post.subreddit);
    
    // Calculate weighted final score
    const baseScore = (
      engagementScore * this.config.ENGAGEMENT_WEIGHT +
      recencyScore * this.config.RECENCY_WEIGHT +
      qualityScore * this.config.QUALITY_WEIGHT
    );
    
    const finalScore = baseScore * bonusMultiplier * subredditWeight;
    
    return Math.max(0, Math.min(1, finalScore)); // Clamp between 0-1
  }

  private getSubredditWeight(subreddit: string): number {
    const weights: Record<string, number> = {
      // High-value subreddits
      'technology': 1.2,
      'programming': 1.15,
      'worldnews': 1.1,
      'todayilearned': 1.1,
      'askreddit': 1.05,
      
      // Standard subreddits
      'all': 1.0,
      'news': 1.0,
      'funny': 0.95,
      'gaming': 0.9,
      
      // Lower priority
      'memes': 0.8,
      'pics': 0.75,
    };
    
    return weights[subreddit.toLowerCase()] || 1.0;
  }

  /**
   * Get the top N posts ready for scheduling
   */
  getTopScoredPosts(scoredPosts: EnhancedRedditPost[], limit: number = 20): EnhancedRedditPost[] {
    return scoredPosts
      .filter(post => post.processing_status === 'scored')
      .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0))
      .slice(0, limit);
  }

  /**
   * Calculate optimal posting times based on current queue and config
   */
  calculatePostingSchedule(posts: EnhancedRedditPost[]): { post: EnhancedRedditPost; scheduledTime: number }[] {
    const now = Date.now();
    const isInPeakHours = this.config.PEAK_HOURS_UTC.includes(new Date().getUTCHours());
    
    // Determine posting frequency based on time of day
    const intervalMinutes = isInPeakHours 
      ? this.config.MIN_POST_INTERVAL_MINUTES 
      : this.config.MAX_POST_INTERVAL_MINUTES;
    
    const schedule: { post: EnhancedRedditPost; scheduledTime: number }[] = [];
    let nextSlot = now + (intervalMinutes * 60 * 1000);
    
    for (const post of posts) {
      schedule.push({
        post,
        scheduledTime: nextSlot,
      });
      
      nextSlot += (intervalMinutes * 60 * 1000);
      
      // Don't schedule too far in advance
      if (schedule.length >= 10) break;
    }
    
    return schedule;
  }
}

export const scoringAgent = new ScoringAgent();
