import { EnhancedRedditPost } from '@/lib/types/enhancedRedditPost';
import { enrichmentAgent } from './enrichmentAgent';
import { scoringAgent } from './scoringAgent';
import { schedulerService } from './schedulerService';

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
 * Raw Posts → Enrichment → Scoring → Scheduling → Publishing
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
   * Data ingestion continues to fetch new posts
   */
  private async startDataIngestion(
    onError: (error: string | null) => void,
    onLoading: (loading: boolean) => void,
    config: PipelineConfig
  ) {
    const ingestNewPosts = async () => {
      if (!this.isRunning) return;

      try {
        onLoading(true);
        onError(null);

        // Fetch new posts (keep our existing fetch logic)
        const newRawPosts = await this.fetchNewPosts(config);
        
        if (newRawPosts.length > 0) {
          console.log(`📥 Pipeline: Ingested ${newRawPosts.length} new raw posts`);
          this.addRawPosts(newRawPosts);
        }

      } catch (error) {
        console.error('❌ Data ingestion error:', error);
        onError(error instanceof Error ? error.message : 'Data ingestion failed');
      } finally {
        onLoading(false);
      }
    };

    // Initial fetch
    await ingestNewPosts();

    // Continue fetching new posts every 30 seconds
    const ingestionInterval = setInterval(ingestNewPosts, 30000);

    // Clean up on stop
    const originalStop = this.stop.bind(this);
    this.stop = () => {
      clearInterval(ingestionInterval);
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
   * Fetch new posts using existing logic but with enhanced metadata
   */
  private async fetchNewPosts(config: PipelineConfig): Promise<EnhancedRedditPost[]> {
    // Use one subreddit at a time for variety (keeping existing rotation logic)
    const subreddit = config.subreddits[Math.floor(Math.random() * config.subreddits.length)];
    const sortMethods = ['new', 'rising', 'hot'];
    const sort = sortMethods[Math.floor(Math.random() * sortMethods.length)];

    try {
      const response = await fetch(`/api/reddit?subreddit=${subreddit}&limit=10&sort=${sort}`);
      if (!response.ok) {
        const errorText = `Failed to fetch ${subreddit}: ${response.statusText}`;
        console.warn(`⚠️ ${errorText}`);
        
        // Don't throw error, just return empty array to continue processing other subreddits
        return [];
      }

      const data = await response.json();
      console.log(`📦 API response for r/${subreddit} (${sort}):`, {
        success: data.success,
        postCount: data.posts?.length || 0
      });

      if (!data.success || !Array.isArray(data.posts)) {
        console.warn(`⚠️ API error for r/${subreddit}:`, data.error || 'No posts returned');
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
      return this.filterNewPosts(enhancedPosts, config.contentMode);

    } catch (error) {
      console.warn(`⚠️ Failed to fetch from ${subreddit}:`, error instanceof Error ? error.message : error);
      // Return empty array instead of throwing to prevent stopping the entire feed
      return [];
    }
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
