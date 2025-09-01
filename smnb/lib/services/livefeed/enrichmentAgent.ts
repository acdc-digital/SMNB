import { EnhancedRedditPost } from '@/lib/types/enhancedRedditPost';

export class EnrichmentAgent {
  /**
   * Enriches raw posts with metadata like sentiment, categories, and quality scores
   * Runs every 30 seconds to process new raw posts
   */
  async processRawPosts(rawPosts: EnhancedRedditPost[]): Promise<EnhancedRedditPost[]> {
    console.log(`🧠 EnrichmentAgent: Processing ${rawPosts.length} raw posts...`);
    
    const enrichedPosts = rawPosts.map(post => this.enrichPost(post));
    
    console.log(`✅ EnrichmentAgent: Enriched ${enrichedPosts.length} posts`);
    return enrichedPosts;
  }

  private enrichPost(post: EnhancedRedditPost): EnhancedRedditPost {
    // Sentiment Analysis (simple keyword-based for now)
    const sentiment = this.analyzeSentiment(post.title + ' ' + post.selftext);
    
    // Category detection based on subreddit and content
    const categories = this.detectCategories(post);
    
    // Quality score based on multiple factors
    const quality_score = this.calculateQualityScore(post);

    return {
      ...post,
      processing_status: 'enriched',
      sentiment,
      categories,
      quality_score,
      engagement_score: this.calculateEngagementScore(post),
    };
  }

  private analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['amazing', 'great', 'awesome', 'excellent', 'wonderful', 'fantastic', 'love', 'best', 'perfect', 'incredible'];
    const negativeWords = ['terrible', 'awful', 'horrible', 'worst', 'hate', 'disgusting', 'pathetic', 'useless', 'annoying', 'stupid'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private detectCategories(post: EnhancedRedditPost): string[] {
    const categories: string[] = [];
    
    const subreddit = post.subreddit.toLowerCase();
    const title = post.title.toLowerCase();
    
    // Technology
    if (['technology', 'programming', 'coding', 'tech', 'javascript', 'python'].some(term => 
      subreddit.includes(term) || title.includes(term))) {
      categories.push('technology');
    }
    
    // News
    if (['news', 'worldnews', 'politics', 'breaking'].some(term => 
      subreddit.includes(term) || title.includes(term))) {
      categories.push('news');
    }
    
    // Entertainment
    if (['funny', 'memes', 'entertainment', 'movies', 'gaming'].some(term => 
      subreddit.includes(term) || title.includes(term))) {
      categories.push('entertainment');
    }
    
    // Education
    if (['todayilearned', 'til', 'explainlikeimfive', 'askreddit', 'educational'].some(term => 
      subreddit.includes(term) || title.includes(term))) {
      categories.push('education');
    }
    
    return categories.length > 0 ? categories : ['general'];
  }

  private calculateQualityScore(post: EnhancedRedditPost): number {
    let score = 0.5; // Base score
    
    // Title quality (length, capitalization)
    if (post.title.length > 10 && post.title.length < 100) score += 0.1;
    if (post.title.match(/^[A-Z]/)) score += 0.05; // Proper capitalization
    if (!post.title.includes('URGENT') && !post.title.includes('BREAKING')) score += 0.05; // Not clickbait
    
    // Content quality
    if (post.selftext && post.selftext.length > 100) score += 0.1; // Has substantial text
    if (post.num_comments > 5) score += 0.1; // Has discussion
    if (post.upvote_ratio > 0.8) score += 0.1; // Well received
    
    // Domain quality (prefer known good sources)
    const goodDomains = ['github.com', 'stackoverflow.com', 'arxiv.org', 'medium.com', 'youtube.com'];
    if (goodDomains.some(domain => post.domain.includes(domain))) score += 0.1;
    
    // Avoid low-quality indicators
    if (post.title.includes('🚀') || post.title.includes('💎')) score -= 0.1; // Emoji spam
    if (post.title.toUpperCase() === post.title) score -= 0.2; // ALL CAPS
    
    return Math.max(0, Math.min(1, score)); // Clamp between 0-1
  }

  private calculateEngagementScore(post: EnhancedRedditPost): number {
    // Normalize engagement based on post age and metrics
    const ageInHours = (Date.now() - post.created_utc * 1000) / (1000 * 60 * 60);
    const ageDecay = Math.exp(-0.1 * ageInHours); // Decay factor
    
    // Raw engagement
    const rawScore = post.score + (post.num_comments * 2); // Comments worth 2x upvotes
    
    // Apply age decay and normalize
    return Math.min(rawScore * ageDecay, 1000); // Cap at 1000
  }
}

export const enrichmentAgent = new EnrichmentAgent();
