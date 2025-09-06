// PRODUCER AGENT SERVICE
// /Users/matthewsimon/Projects/SMNB/smnb/lib/services/producer/producerAgentService.ts

/**
 * Producer Agent Service
 * 
 * Handles Reddit search and duplication analysis for news story context
 * and source validation. Provides enriched data to Host/Editor agents
 * and updates live feed with source information.
 */

import { EventEmitter } from 'events';
import { RedditPost } from '@/lib/reddit';
import { EnhancedRedditPost } from '@/lib/types/enhancedRedditPost';
import { tokenCountingService } from '../tokenCountingService';

export interface ProducerConfig {
  searchInterval: number; // ms between search operations
  duplicateAnalysisThreshold: number; // minimum score to analyze duplicates
  contextUpdateInterval: number; // ms between context updates to agents
  maxSearchQueries: number; // max concurrent search queries
  trendsToTrack: string[]; // trending keywords to monitor
  subredditsToMonitor: string[]; // primary subreddits for analysis
}

export const DEFAULT_PRODUCER_CONFIG: ProducerConfig = {
  searchInterval: 120000, // 2 minutes - much more respectful to Reddit API
  duplicateAnalysisThreshold: 100, // analyze posts with 100+ score
  contextUpdateInterval: 30000, // 30 seconds
  maxSearchQueries: 2, // Reduced to 2 to minimize API load
  trendsToTrack: ['breaking', 'urgent'], // Further reduced list to minimize requests
  subredditsToMonitor: ['news', 'worldnews', 'politics', 'technology', 'business']
};

export interface SearchResult {
  query: string;
  posts: RedditPost[];
  timestamp: Date;
  totalResults: number;
}

export interface DuplicateAnalysis {
  originalPost: RedditPost;
  duplicates: RedditPost[];
  metrics: {
    totalDuplicates: number;
    subredditDiversity: number;
    totalEngagement: number;
    averageScore: number;
    subreddits: string[];
    engagementBySubreddit: { [key: string]: { score: number; comments: number; count: number } };
  };
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
}

export interface ContextData {
  id: string;
  type: 'search' | 'duplicate';
  sourcePost: RedditPost;
  relatedPosts: RedditPost[];
  analysis: DuplicateAnalysis | null;
  keywords: string[];
  relevanceScore: number;
  timestamp: Date;
}

export interface ProducerState {
  isActive: boolean;
  currentSearches: Map<string, SearchResult>;
  contextData: ContextData[];
  duplicateAnalyses: Map<string, DuplicateAnalysis>;
  trends: { keyword: string; frequency: number; lastSeen: Date }[];
  stats: {
    searchesPerformed: number;
    duplicatesAnalyzed: number;
    contextUpdatesProvided: number;
    trendsIdentified: number;
    uptime: number;
  };
}

export class ProducerAgentService extends EventEmitter {
  private state: ProducerState;
  private config: ProducerConfig;
  private searchInterval: NodeJS.Timeout | null = null;
  private contextUpdateInterval: NodeJS.Timeout | null = null;
  private startTime: number = 0;
  
  // Rate limiting controls
  private lastRequestTime = 0;
  private requestCount = 0;
  private requestWindow = 60000; // 1 minute window
  private maxRequestsPerWindow = 8; // Conservative limit for Reddit API
  private minRequestDelay = 5000; // Minimum 5 seconds between requests
  
  // Circuit breaker state
  private circuitBreakerOpen = false;
  private circuitBreakerResetTime = 0;
  
  constructor(config: Partial<ProducerConfig> = {}) {
    super();
    
    this.config = { ...DEFAULT_PRODUCER_CONFIG, ...config };
    
    this.state = {
      isActive: false,
      currentSearches: new Map(),
      contextData: [],
      duplicateAnalyses: new Map(),
      trends: [],
      stats: {
        searchesPerformed: 0,
        duplicatesAnalyzed: 0,
        contextUpdatesProvided: 0,
        trendsIdentified: 0,
        uptime: 0
      }
    };
    
    console.log('🏭 Producer Agent: Initialized with config', this.config);
  }

  /**
   * Start the producer agent
   */
  async start(): Promise<void> {
    if (this.state.isActive) {
      console.log('🏭 Producer Agent: Already running');
      return;
    }

    this.state.isActive = true;
    this.startTime = Date.now();
    
    console.log('🏭 Producer Agent: Starting...');
    this.emit('producer:started');

    // Start search monitoring
    this.startSearchMonitoring();
    
    // Start context updates
    this.startContextUpdates();
    
    // Start stats tracking
    this.startStatsTracking();

    console.log('🏭 Producer Agent: Active and monitoring');
  }

  /**
   * Stop the producer agent
   */
  async stop(): Promise<void> {
    if (!this.state.isActive) {
      return;
    }

    this.state.isActive = false;
    
    if (this.searchInterval) {
      clearInterval(this.searchInterval);
      this.searchInterval = null;
    }
    
    if (this.contextUpdateInterval) {
      clearInterval(this.contextUpdateInterval);
      this.contextUpdateInterval = null;
    }

    console.log('🏭 Producer Agent: Stopped');
    this.emit('producer:stopped');
  }

  /**
   * Get current state
   */
  getState(): ProducerState {
    return { ...this.state };
  }

  /**
   * Get rate limiting and circuit breaker status
   */
  getRateLimitStatus() {
    return {
      circuitBreakerOpen: this.circuitBreakerOpen,
      circuitBreakerResetTime: this.circuitBreakerResetTime,
      requestCount: this.requestCount,
      maxRequestsPerWindow: this.maxRequestsPerWindow,
      timeSinceLastRequest: Date.now() - this.lastRequestTime,
      minRequestDelay: this.minRequestDelay
    };
  }

  /**
   * Add live feed post for analysis
   */
  async analyzeLiveFeedPost(post: EnhancedRedditPost): Promise<void> {
    if (!this.state.isActive) return;

    try {
      // Search for related content
      const searchResults = await this.performContextualSearch(post);
      
      // Analyze duplicates if post has high engagement
      if (post.score >= this.config.duplicateAnalysisThreshold) {
        await this.performDuplicateAnalysis(post);
      }
      
      // Update trends
      this.updateTrends(post);
      
      this.emit('producer:post_analyzed', post.id, searchResults);
    } catch (error) {
      console.error('🏭 Producer Agent: Error analyzing post:', error);
    }
  }

  private startSearchMonitoring(): void {
    this.searchInterval = setInterval(async () => {
      try {
        await this.performTrendSearches();
      } catch (error) {
        console.error('🏭 Producer Agent: Error in search monitoring:', error);
      }
    }, this.config.searchInterval);
  }

  private startContextUpdates(): void {
    this.contextUpdateInterval = setInterval(() => {
      this.sendContextUpdates();
    }, this.config.contextUpdateInterval);
  }

  private startStatsTracking(): void {
    setInterval(() => {
      if (this.state.isActive) {
        this.state.stats.uptime = Date.now() - this.startTime;
        this.emit('producer:stats_updated', this.state.stats);
      }
    }, 5000);
  }

  private async performTrendSearches(): Promise<void> {
    // Check circuit breaker first
    if (this.circuitBreakerOpen && Date.now() < this.circuitBreakerResetTime) {
      console.log(`⏳ Circuit breaker open, waiting until ${new Date(this.circuitBreakerResetTime).toLocaleTimeString()}`);
      return;
    }
    
    // Reset circuit breaker if time has passed
    if (this.circuitBreakerOpen && Date.now() >= this.circuitBreakerResetTime) {
      this.circuitBreakerOpen = false;
      console.log('✅ Circuit breaker reset, resuming operations');
    }

    const searches = this.config.trendsToTrack.slice(0, this.config.maxSearchQueries);
    console.log('🔍 Producer Agent: Performing trend searches...');
    
    for (const keyword of searches) {
      // Implement rate limiting
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      // Enforce minimum delay between requests
      if (timeSinceLastRequest < this.minRequestDelay) {
        const waitTime = this.minRequestDelay - timeSinceLastRequest;
        console.log(`⏱️ Rate limiting: waiting ${waitTime}ms before next request`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      // Check if we've exceeded the request window limit
      if (now - this.requestWindow > 60000) {
        // Reset window
        this.requestCount = 0;
      }
      
      if (this.requestCount >= this.maxRequestsPerWindow) {
        console.log(`⚠️ Rate limit reached (${this.requestCount}/${this.maxRequestsPerWindow}), waiting for next window`);
        break;
      }

      try {
        this.lastRequestTime = Date.now();
        this.requestCount++;
        
        // Use API route instead of direct Reddit API call
        const response = await fetch(`/api/reddit?q=${encodeURIComponent(keyword)}&subreddit=all&sort=hot&t=hour&limit=10`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`🏭 Producer Agent: API request failed for "${keyword}": ${response.status} - ${errorText}`);
          
          // Handle rate limiting and circuit breaker
          if (response.status === 429 || response.status === 503) {
            try {
              const errorData = JSON.parse(errorText);
              if (errorData.circuitBreakerOpen || errorData.retryAfter) {
                const retryAfter = errorData.retryAfter || 60;
                this.circuitBreakerOpen = true;
                this.circuitBreakerResetTime = Date.now() + (retryAfter * 1000);
                console.log(`🛑 Circuit breaker activated, will retry after ${retryAfter} seconds`);
                break; // Stop all searches
              }
            } catch (e) {
              // If can't parse error, just wait a default time
              this.circuitBreakerOpen = true;
              this.circuitBreakerResetTime = Date.now() + 60000;
              console.log('🛑 Rate limited, waiting 60 seconds');
              break;
            }
          }
          continue;
        }
        
        const data = await response.json();
        const posts = data.posts || [];
        
        const searchResult: SearchResult = {
          query: keyword,
          posts,
          timestamp: new Date(),
          totalResults: posts.length
        };
        
        this.state.currentSearches.set(keyword, searchResult);
        this.state.stats.searchesPerformed++;
        
        console.log(`🏭 Producer Agent: Search completed for "${keyword}" - ${posts.length} results`);
        this.emit('producer:search_completed', keyword, posts.length);
        
        // Add a small delay between successful requests too
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`🏭 Producer Agent: Error searching for "${keyword}":`, error);
        
        // If circuit breaker error, stop all searches
        if (error instanceof Error && error.message.includes('Circuit breaker')) {
          console.warn('🏭 Producer Agent: Circuit breaker is open, stopping trend searches');
          break;
        }
        
        // If network error or other issue, wait before continuing
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  private async performContextualSearch(post: EnhancedRedditPost): Promise<RedditPost[]> {
    try {
      // Check circuit breaker before making request
      if (this.circuitBreakerOpen && Date.now() < this.circuitBreakerResetTime) {
        console.log('⏳ Circuit breaker open, skipping contextual search');
        return [];
      }

      // Apply rate limiting for contextual searches too
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.minRequestDelay) {
        const waitTime = this.minRequestDelay - timeSinceLastRequest;
        console.log(`⏱️ Rate limiting contextual search: waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      // Check request count
      if (this.requestCount >= this.maxRequestsPerWindow) {
        console.log('⚠️ Rate limit reached, skipping contextual search');
        return [];
      }

      this.lastRequestTime = Date.now();
      this.requestCount++;
      
      // Extract keywords from title and content
      const keywords = this.extractKeywords(post.title + ' ' + (post.selftext || ''));
      const searchQuery = keywords.slice(0, 3).join(' ');
      
      // Use API route instead of direct Reddit API call
      const response = await fetch(`/api/reddit?q=${encodeURIComponent(searchQuery)}&subreddit=all&sort=relevance&t=week&limit=5`);
      
      if (!response.ok) {
        // Handle circuit breaker responses
        if (response.status === 429 || response.status === 503) {
          const errorText = await response.text();
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.circuitBreakerOpen || errorData.retryAfter) {
              const retryAfter = errorData.retryAfter || 60;
              this.circuitBreakerOpen = true;
              this.circuitBreakerResetTime = Date.now() + (retryAfter * 1000);
              console.log(`🛑 Circuit breaker activated during contextual search, retry after ${retryAfter}s`);
            }
          } catch (e) {
            this.circuitBreakerOpen = true;
            this.circuitBreakerResetTime = Date.now() + 60000;
          }
        }
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      const relatedPosts = data.posts || [];
      
      // Create context data
      const contextData: ContextData = {
        id: `context-${post.id}-${Date.now()}`,
        type: 'search',
        sourcePost: post as RedditPost,
        relatedPosts,
        analysis: null,
        keywords,
        relevanceScore: this.calculateRelevanceScore(post, relatedPosts),
        timestamp: new Date()
      };
      
      this.state.contextData.push(contextData);
      
      // Keep only recent context data (last 50 items)
      if (this.state.contextData.length > 50) {
        this.state.contextData = this.state.contextData.slice(-50);
      }
      
      return relatedPosts;
    } catch (error) {
      console.error('🏭 Producer Agent: Error performing contextual search:', error);
      return [];
    }
  }

  private async performDuplicateAnalysis(post: EnhancedRedditPost): Promise<void> {
    try {
      // Use API route instead of direct Reddit API call
      const response = await fetch(`/api/reddit/duplicates?url=${encodeURIComponent(post.url)}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      const metrics = data.metrics;
      
      const analysis: DuplicateAnalysis = {
        originalPost: post as RedditPost,
        duplicates: [], // Would extract from data.duplicates if needed
        metrics,
        priority: this.calculatePriority(metrics),
        timestamp: new Date()
      };
      
      this.state.duplicateAnalyses.set(post.id, analysis);
      this.state.stats.duplicatesAnalyzed++;
      
      console.log(`🏭 Producer Agent: Duplicate analysis completed for "${post.title.substring(0, 50)}..." - ${metrics.totalDuplicates} duplicates found`);
      this.emit('producer:duplicate_analyzed', post.id, metrics);
    } catch (error) {
      console.error('🏭 Producer Agent: Error performing duplicate analysis:', error);
    }
  }

  private updateTrends(post: EnhancedRedditPost): void {
    const keywords = this.extractKeywords(post.title);
    const now = new Date();
    
    keywords.forEach(keyword => {
      const existingTrend = this.state.trends.find(t => t.keyword === keyword);
      if (existingTrend) {
        existingTrend.frequency++;
        existingTrend.lastSeen = now;
      } else {
        this.state.trends.push({ keyword, frequency: 1, lastSeen: now });
      }
    });
    
    // Sort by frequency and keep top 20
    this.state.trends = this.state.trends
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20);
      
    this.state.stats.trendsIdentified = this.state.trends.length;
  }

  private sendContextUpdates(): void {
    const recentContext = this.state.contextData.slice(-10);
    if (recentContext.length > 0) {
      this.emit('producer:context_update', recentContext);
      this.state.stats.contextUpdatesProvided++;
    }
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - could be enhanced with NLP
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'said', 'each', 'which', 'their'].includes(word));
    
    // Return unique keywords
    return [...new Set(words)];
  }

  private calculateRelevanceScore(sourcePost: EnhancedRedditPost, relatedPosts: RedditPost[]): number {
    if (relatedPosts.length === 0) return 0;
    
    const averageScore = relatedPosts.reduce((sum, post) => sum + post.score, 0) / relatedPosts.length;
    const subredditDiversity = new Set(relatedPosts.map(post => post.subreddit)).size;
    
    // Score based on engagement and diversity
    return Math.min(100, (averageScore / 100) * 50 + subredditDiversity * 10);
  }

  private calculatePriority(metrics: DuplicateAnalysis['metrics']): 'low' | 'medium' | 'high' {
    if (metrics.totalDuplicates >= 10 && metrics.subredditDiversity >= 5) {
      return 'high';
    } else if (metrics.totalDuplicates >= 5 && metrics.subredditDiversity >= 3) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Future: LLM-based content analysis with proper token tracking
   * This method shows how to instrument LLM calls when added to Producer
   */
  private async analyzeFutureContentWithLLM(post: EnhancedRedditPost): Promise<any> {
    const startTime = Date.now();
    
    // This is a placeholder for future LLM-based analysis
    // When implemented, it would:
    // 1. Count input tokens
    // 2. Make LLM call with tools if needed
    // 3. Track tool usage
    // 4. Record complete token usage
    
    try {
      // Example of how token tracking would work:
      /*
      const inputTokens = await tokenCountingService.countTokensWithTools({
        model: 'claude-3-5-haiku-20241022',
        system: 'You are a content analysis assistant.',
        messages: [{ role: 'user', content: post.title + ' ' + post.selftext }],
        tools: [{ name: 'sentiment_analyzer', description: '...' }]
      });
      
      // Make LLM call...
      const result = await llmService.generateWithTools(...);
      
      // Record usage
      tokenCountingService.createAgentUsageRecord(
        'producer',
        'analyze',
        'claude-3-5-haiku-20241022',
        inputTokens.inputTokens,
        estimatedOutputTokens,
        {
          duration: Date.now() - startTime,
          success: true,
          toolsUsed: ['sentiment_analyzer'],
          toolDefinitionsTokens: inputTokens.toolDefinitionsTokens,
          toolResultsTokens: actualToolResultsTokens
        }
      );
      */
      
      // For now, just return a placeholder
      console.log(`🏭 Producer Agent: Future LLM analysis placeholder for "${post.title.substring(0, 50)}..."`);
      return { analyzed: false, placeholder: true };
      
    } catch (error) {
      // Record failed usage
      tokenCountingService.createAgentUsageRecord(
        'producer',
        'analyze',
        'claude-3-5-haiku-20241022',
        0,
        0,
        {
          duration: Date.now() - startTime,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      );
      
      throw error;
    }
  }
}
