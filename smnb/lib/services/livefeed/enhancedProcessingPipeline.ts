// ENHANCED PROCESSING PIPELINE
// /Users/matthewsimon/Projects/SMNB/smnb/lib/services/livefeed/enhancedProcessingPipeline.ts

import { EnhancedRedditPost } from '@/lib/types/enhancedRedditPost';
import { enrichmentAgent } from './enrichmentAgent';
import { scoringAgent } from './scoringAgent';
import { schedulerService } from './schedulerService';
import { analyzePostWithProducer } from '@/lib/stores/producer/producerStore';
import convex from '@/lib/convex';
import { api } from '@/convex/_generated/api';

export interface PipelineConfig {
  subreddits: string[];
  contentMode: 'sfw' | 'nsfw';
  maxPostsInPipeline: number;
  publishingInterval: number; // milliseconds
}

export interface PipelineStats {
  totalPosts: number;
  rawPosts: number;
  enrichedPosts: number;
  scoredPosts: number;
  scheduledPosts: number;
  publishedPosts: number;
  averageProcessingTime: number;
  lastUpdate: number;
}

/**
 * Enhanced Processing Pipeline that orchestrates the entire flow:
 * Raw Posts → Enrichment → Producer Analysis → Scoring → Scheduling → Publishing
 */
export class EnhancedProcessingPipeline {
  private posts: EnhancedRedditPost[] = [];
  private publishedPosts: EnhancedRedditPost[] = [];
  private isRunning = false;
  private publishInterval: number | null = null;
  private stats: PipelineStats = this.createEmptyStats();

  constructor() {
    console.log('🏗️ Enhanced Processing Pipeline initialized');
  }

  /**
   * Start the enhanced pipeline with smart publishing
   */
  async start(
    onNewPost: (post: EnhancedRedditPost) => void,
    onError: (error: string | null) => void,
    onLoading: (loading: boolean) => void,
    config: PipelineConfig
  ) {
    if (this.isRunning) {
      this.stop();
    }

    this.isRunning = true;
    console.log('🚀 Enhanced Processing Pipeline: Starting...');

    // Start the publishing loop
    this.startPublishingLoop(onNewPost, onError);

    // Start the data ingestion
    this.startDataIngestion(onError, onLoading, config);
  }

  /**
   * Stop the pipeline
   */
  stop() {
    console.log('🛑 Enhanced Processing Pipeline: Stopping...');
    this.isRunning = false;
    
    if (this.publishInterval) {
      clearInterval(this.publishInterval);
      this.publishInterval = null;
    }
  }

  /**
   * Smart publishing loop that respects scheduling
   */
  private startPublishingLoop(
    onNewPost: (post: EnhancedRedditPost) => void,
    onError: (error: string | null) => void
  ) {
    // Initial immediate check for any ready posts
    this.processAndPublishNext(onNewPost).catch(error => {
      console.error('❌ Initial publishing check error:', error);
      onError(error instanceof Error ? error.message : 'Initial publishing failed');
    });
    
    this.publishInterval = window.setInterval(async () => {
      try {
        await this.processAndPublishNext(onNewPost);
      } catch (error) {
        console.error('❌ Publishing error:', error);
        onError(error instanceof Error ? error.message : 'Publishing failed');
      }
    }, 3000); // Check every 3 seconds for more responsive publishing
  }

  /**
   * Data ingestion continues to fetch new posts with graceful error handling
   */
  private async startDataIngestion(
    onError: (error: string | null) => void,
    onLoading: (loading: boolean) => void,
    config: PipelineConfig
  ) {
    let consecutiveErrors = 0;
    let backoffMultiplier = 1;
    
    const ingestNewPosts = async () => {
      if (!this.isRunning) return;

      try {
        onLoading(true);
        
        // Clear any previous error messages when starting a new attempt
        if (consecutiveErrors === 0) {
          onError(null);
        }

        // Fetch new posts with enhanced error handling
        const newRawPosts = await this.fetchNewPosts(config);
        
        if (newRawPosts.length > 0) {
          console.log(`📥 Pipeline: Ingested ${newRawPosts.length} new raw posts`);
          this.addRawPosts(newRawPosts);
          
          // Reset error tracking on success
          consecutiveErrors = 0;
          backoffMultiplier = 1;
          onError(null);
        } else {
          // No posts returned - this is normal and shouldn't be treated as an error
          console.log(`📭 Pipeline: No new posts available from Reddit`);
        }

      } catch (error) {
        consecutiveErrors++;
        console.error(`❌ Data ingestion error (attempt ${consecutiveErrors}):`, error);
        
        // Handle different types of errors gracefully
        const errorMessage = error instanceof Error ? error.message : 'Data ingestion failed';
        
        if (errorMessage.includes('Circuit breaker') || errorMessage.includes('503')) {
          // Circuit breaker is open - show user-friendly message
          onError('Reddit is temporarily slowing down requests. Feed will resume automatically.');
          backoffMultiplier = Math.min(backoffMultiplier * 2, 8); // Cap at 8x backoff
        } else if (errorMessage.includes('Rate limited') || errorMessage.includes('429')) {
          // Rate limited - show helpful message
          onError('Respecting Reddit rate limits. Feed continues automatically with smart timing.');
          backoffMultiplier = Math.min(backoffMultiplier * 1.5, 4); // Cap at 4x backoff
        } else if (errorMessage.includes('respect Reddit') || errorMessage.includes('slowing down')) {
          // User-friendly messages from API responses
          onError(errorMessage);
          backoffMultiplier = Math.min(backoffMultiplier * 1.2, 3);
        } else if (consecutiveErrors >= 3) {
          // Multiple consecutive errors - show generic message
          onError('Temporary connection issues. Feed will resume automatically.');
          backoffMultiplier = Math.min(backoffMultiplier * 2, 6); // Cap at 6x backoff
        } else {
          // First few errors - don't show error to user, just log
          console.log('📡 Temporary connection issue, retrying automatically...');
        }
      } finally {
        onLoading(false);
      }
    };

    // Initial fetch
    await ingestNewPosts();

    // Continue fetching new posts with adaptive interval based on errors
    const scheduleNextIngestion = () => {
      if (!this.isRunning) return;
      
      // Base interval is 30 seconds, but increase with backoff on errors
      const interval = 30000 * backoffMultiplier;
      console.log(`⏱️ Next data ingestion scheduled in ${interval / 1000} seconds`);
      
      setTimeout(async () => {
        await ingestNewPosts();
        scheduleNextIngestion();
      }, interval);
    };

    scheduleNextIngestion();

    // Clean up on stop
    const originalStop = this.stop.bind(this);
    this.stop = () => {
      originalStop();
    };
  }

  /**
   * Process pipeline and publish next ready post
   */
  private async processAndPublishNext(onNewPost: (post: EnhancedRedditPost) => void) {
    // Run the processing pipeline
    await this.runProcessingSteps();

    // Find posts ready for publishing
    const scheduledPosts = this.posts.filter(post => post.processing_status === 'scheduled');
    const readyToPublish = schedulerService.getPostsReadyForPublishing(scheduledPosts);

    console.log(`🔍 Checking for posts to publish: ${scheduledPosts.length} scheduled, ${readyToPublish.length} ready now`);

    if (readyToPublish.length > 0) {
      const postToPublish = readyToPublish[0]; // Publish one at a time
      
      console.log(`📢 Publishing: "${postToPublish.title.substring(0, 50)}..." (score: ${postToPublish.priority_score?.toFixed(3)})`);
      
      // Mark as published
      const publishedPost = schedulerService.markAsPublished([postToPublish])[0];
      this.markPostAsPublished(publishedPost);
      
      // Save to database
      try {
        await convex.mutation(api.redditFeed.storeLiveFeedPosts, {
          posts: [{
            id: publishedPost.id,
            title: publishedPost.title,
            author: publishedPost.author,
            subreddit: publishedPost.subreddit,
            url: publishedPost.url,
            permalink: publishedPost.permalink,
            score: publishedPost.score,
            num_comments: publishedPost.num_comments,
            created_utc: publishedPost.created_utc,
            thumbnail: publishedPost.thumbnail || '',
            selftext: publishedPost.selftext || '',
            is_video: publishedPost.is_video || false,
            domain: publishedPost.domain || '',
            upvote_ratio: publishedPost.upvote_ratio || 0.5,
            over_18: publishedPost.over_18 || false,
            attributesJson: JSON.stringify({
              priority_score: publishedPost.priority_score,
              sentiment: publishedPost.sentiment,
              categories: publishedPost.categories,
              quality_score: publishedPost.quality_score,
              processing_status: publishedPost.processing_status,
            }),
            source: `${publishedPost.subreddit}/enhanced`,
            addedAt: Date.now(),
            batchId: `enhanced-${Date.now()}`,
          }],
          batchId: `enhanced-${Date.now()}`,
        });
        console.log(`💾 Saved live feed post: ${publishedPost.id}`);
      } catch (error) {
        console.error(`❌ Failed to save live feed post: ${publishedPost.id}`, error);
      }
      
      // Send to UI
      onNewPost({
        ...publishedPost,
        addedAt: Date.now(),
        isNew: true,
        batchId: Date.now(),
      });

      this.updateStats();
    }
  }

  /**
   * Run the processing pipeline steps
   */
  private async runProcessingSteps() {
    // Step 1: Enrich raw posts
    const rawPosts = this.posts.filter(post => post.processing_status === 'raw');
    if (rawPosts.length > 0) {
      const enrichedPosts = await enrichmentAgent.processRawPosts(rawPosts);
      this.updatePostStatuses(enrichedPosts);
      
      // Producer Analysis: Analyze enriched posts for context and duplicates
      try {
        console.log(`🏭 Requesting Producer analysis for ${enrichedPosts.length} enriched posts`);
        for (const post of enrichedPosts) {
          await analyzePostWithProducer(post);
        }
        console.log(`🏭 Producer analysis completed for ${enrichedPosts.length} posts`);
      } catch (error) {
        console.error('🏭 Producer: Error analyzing posts:', error);
      }
    }

    // Step 2: Score enriched posts
    const enrichedPosts = this.posts.filter(post => post.processing_status === 'enriched');
    if (enrichedPosts.length > 0) {
      const scoredPosts = await scoringAgent.processEnrichedPosts(enrichedPosts);
      this.updatePostStatuses(scoredPosts);
    }

    // Step 3: Schedule scored posts
    const scoredPosts = this.posts.filter(post => post.processing_status === 'scored');
    if (scoredPosts.length > 0) {
      const scheduledPosts = await schedulerService.scheduleNextBatch(
        scoredPosts, 
        this.publishedPosts
      );
      this.updatePostStatuses(scheduledPosts);
    }
  }

  /**
   * Fetch new posts using existing logic but with enhanced metadata and retry logic
   */
  private async fetchNewPosts(config: PipelineConfig): Promise<EnhancedRedditPost[]> {
    // Use one subreddit at a time for variety (keeping existing rotation logic)
    const subreddit = config.subreddits[Math.floor(Math.random() * config.subreddits.length)];
    const sortMethods = ['new', 'rising', 'hot'];
    const sort = sortMethods[Math.floor(Math.random() * sortMethods.length)];

    return await this.fetchWithRetry(subreddit, sort, config, 2); // Allow 2 retries
  }

  /**
   * Fetch posts with intelligent retry logic and graceful error handling
   */
  private async fetchWithRetry(
    subreddit: string, 
    sort: string, 
    config: PipelineConfig, 
    maxRetries: number = 2
  ): Promise<EnhancedRedditPost[]> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`/api/reddit?subreddit=${subreddit}&limit=10&sort=${sort}`, {
          // Add timeout to prevent hanging requests
          signal: AbortSignal.timeout(15000) // 15 second timeout
        });

        if (!response.ok) {
          // Check if circuit breaker is open (503 status)
          if (response.status === 503) {
            const data = await response.json().catch(() => ({}));
            if (data.circuitBreakerOpen) {
              console.log(`🚫 Circuit breaker is open - Reddit API recovery in progress`);
              // Show user-friendly message if available
              if (data.userMessage && attempt === maxRetries) {
                throw new Error(data.userMessage);
              }
              // Don't retry when circuit breaker is open, just wait for next cycle
              return [];
            }
          }
          
          // Handle rate limiting gracefully
          if (response.status === 429) {
            const data = await response.json().catch(() => ({}));
            if (data.rateLimited) {
              console.log(`⏳ Rate limited for r/${subreddit} - backing off gracefully`);
              
              // If this is the final attempt, use user-friendly message
              if (attempt === maxRetries && data.userMessage) {
                throw new Error(data.userMessage);
              }
              
              // If this is not the last attempt, wait before retrying
              if (attempt < maxRetries) {
                // Use retryAfter from response if available, otherwise fallback
                const retryAfter = data.retryAfter || (5 * (attempt + 1));
                const delay = Math.min(retryAfter * 1000, 15000); // Cap at 15s
                console.log(`⌛ Waiting ${delay / 1000}s before retry attempt ${attempt + 1}/${maxRetries}`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
              }
              
              // Last attempt - return empty but don't throw error
              return [];
            }
          }
          
          // Handle blocked access
          if (response.status === 403) {
            console.log(`🚫 Access blocked for r/${subreddit} - may be private or restricted`);
            return [];
          }
          
          // For other errors, log and return empty on final attempt
          if (attempt === maxRetries) {
            console.log(`⚠️ Final attempt failed for r/${subreddit}: ${response.status} ${response.statusText}`);
            return [];
          }
          
          // For non-final attempts, wait and retry
          const delay = 2000 * (attempt + 1); // Progressive delay: 2s, 4s
          console.log(`🔄 Retrying r/${subreddit} in ${delay / 1000}s (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        const data = await response.json();
        console.log(`📦 API response for r/${subreddit} (${sort}):`, {
          success: data.success,
          postCount: data.posts?.length || 0,
          attempt: attempt + 1
        });

        if (!data.success) {
          // Handle API-level errors
          if (data.error) {
            console.log(`📭 API message for r/${subreddit}: ${data.error}`);
            
            // If it's a rate limit or circuit breaker error, don't retry
            if (data.error.includes('rate limit') || data.error.includes('circuit breaker')) {
              return [];
            }
          }
          
          // For other API errors, retry if not final attempt
          if (attempt < maxRetries) {
            const delay = 3000 * (attempt + 1);
            console.log(`🔄 API error for r/${subreddit}, retrying in ${delay / 1000}s`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          return [];
        }

        if (!Array.isArray(data.posts)) {
          console.log(`📭 No posts array returned for r/${subreddit}`);
          return [];
        }

        // Transform to enhanced posts with initial metadata
        const enhancedPosts: EnhancedRedditPost[] = data.posts.map((postData: Record<string, unknown>) => ({
          id: postData.id as string,
          title: postData.title as string,
          author: postData.author as string,
          subreddit: postData.subreddit as string,
          url: postData.url as string,
          permalink: `https://reddit.com${postData.permalink}`,
          score: postData.score as number,
          num_comments: postData.num_comments as number,
          created_utc: postData.created_utc as number,
          thumbnail: postData.thumbnail as string,
          selftext: (postData.selftext as string) || '',
          is_video: (postData.is_video as boolean) || false,
          domain: postData.domain as string,
          upvote_ratio: postData.upvote_ratio as number,
          over_18: postData.over_18 as boolean,
          source: 'reddit' as const,

          // Enhanced metadata
          fetch_timestamp: Date.now(),
          engagement_score: 0, // Will be calculated by enrichment
          processing_status: 'raw',
        }));

        // Filter by content mode and duplicates
        const filteredPosts = this.filterNewPosts(enhancedPosts, config.contentMode);
        
        if (attempt > 0) {
          console.log(`✅ Successfully fetched r/${subreddit} on attempt ${attempt + 1}`);
        }
        
        return filteredPosts;

      } catch (error) {
        // Handle network errors, timeouts, etc.
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        if (errorMessage.includes('timeout') || errorMessage.includes('TimeoutError')) {
          console.log(`⏰ Timeout fetching r/${subreddit} (attempt ${attempt + 1})`);
        } else if (errorMessage.includes('AbortError')) {
          console.log(`🛑 Request aborted for r/${subreddit} (attempt ${attempt + 1})`);
        } else {
          console.log(`🌐 Network error for r/${subreddit} (attempt ${attempt + 1}): ${errorMessage}`);
        }
        
        // If this is the final attempt, return empty array
        if (attempt === maxRetries) {
          console.log(`❌ All attempts failed for r/${subreddit}, continuing with empty result`);
          return [];
        }
        
        // Wait before retrying
        const delay = 3000 * (attempt + 1); // 3s, 6s
        console.log(`🔄 Retrying r/${subreddit} in ${delay / 1000}s due to network error`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return [];
  }

  /**
   * Filter posts by content mode and remove duplicates
   */
  private filterNewPosts(posts: EnhancedRedditPost[], contentMode: 'sfw' | 'nsfw'): EnhancedRedditPost[] {
    const existingIds = new Set(this.posts.map(p => p.id));
    const publishedIds = new Set(this.publishedPosts.map(p => p.id));

    return posts.filter(post => {
      // Remove duplicates
      if (existingIds.has(post.id) || publishedIds.has(post.id)) {
        console.log(`🚫 Duplicate post: ${post.title.substring(0, 30)}...`);
        return false;
      }

      // Filter by content mode
      if (contentMode === 'sfw' && post.over_18) return false;
      if (contentMode === 'nsfw' && !post.over_18) return false;

      return true;
    });
  }

  /**
   * Add new raw posts to the pipeline
   */
  private addRawPosts(posts: EnhancedRedditPost[]) {
    this.posts.push(...posts);
    
    // Clean up old posts to prevent memory issues
    const maxPosts = 200;
    if (this.posts.length > maxPosts) {
      this.posts = this.posts.slice(-maxPosts);
    }
  }

  /**
   * Update post statuses in the pipeline
   */
  private updatePostStatuses(updatedPosts: EnhancedRedditPost[]) {
    const updatedIds = new Set(updatedPosts.map(p => p.id));
    
    this.posts = this.posts.map(post => 
      updatedIds.has(post.id) 
        ? updatedPosts.find(p => p.id === post.id) || post
        : post
    );
  }

  /**
   * Mark post as published and move to published collection
   */
  private markPostAsPublished(post: EnhancedRedditPost) {
    // Remove from pipeline
    this.posts = this.posts.filter(p => p.id !== post.id);
    
    // Add to published (keep recent ones for diversity checking)
    this.publishedPosts.push(post);
    
    // Clean up old published posts
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.publishedPosts = this.publishedPosts.filter(p => (p.published_at || 0) > oneHourAgo);
  }

  /**
   * Update pipeline statistics
   */
  private updateStats() {
    this.stats = {
      totalPosts: this.posts.length + this.publishedPosts.length,
      rawPosts: this.posts.filter(p => p.processing_status === 'raw').length,
      enrichedPosts: this.posts.filter(p => p.processing_status === 'enriched').length,
      scoredPosts: this.posts.filter(p => p.processing_status === 'scored').length,
      scheduledPosts: this.posts.filter(p => p.processing_status === 'scheduled').length,
      publishedPosts: this.publishedPosts.length,
      averageProcessingTime: 0, // TODO: Implement timing
      lastUpdate: Date.now(),
    };
  }

  private createEmptyStats(): PipelineStats {
    return {
      totalPosts: 0,
      rawPosts: 0,
      enrichedPosts: 0,
      scoredPosts: 0,
      scheduledPosts: 0,
      publishedPosts: 0,
      averageProcessingTime: 0,
      lastUpdate: Date.now(),
    };
  }

  /**
   * Get current pipeline statistics
   */
  getStats(): PipelineStats {
    return this.stats;
  }

  /**
   * Get current pipeline health and error state
   */
  getHealthStatus(): {
    isRunning: boolean;
    totalPosts: number;
    lastIngestionTime: number;
    errorState: 'healthy' | 'rate_limited' | 'circuit_breaker' | 'connection_issues';
    nextIngestionIn?: number;
  } {
    return {
      isRunning: this.isRunning,
      totalPosts: this.posts.length,
      lastIngestionTime: this.stats.lastUpdate,
      errorState: 'healthy', // This could be enhanced to track actual state
    };
  }

  /**
   * Get current posts in each stage for debugging
   */
  getDebugInfo() {
    return {
      pipeline: {
        raw: this.posts.filter(p => p.processing_status === 'raw').length,
        enriched: this.posts.filter(p => p.processing_status === 'enriched').length,
        scored: this.posts.filter(p => p.processing_status === 'scored').length,
        scheduled: this.posts.filter(p => p.processing_status === 'scheduled').length,
      },
      published: this.publishedPosts.length,
      schedulerStats: schedulerService.getSchedulingStats(),
    };
  }
}

export const enhancedProcessingPipeline = new EnhancedProcessingPipeline();
