// HOST AGENT SERVICE
// /Users/matthewsimon/Projects/SMNB/smnb/lib/services/host/hostAgentService.ts

/**
 * Host Agent Service
 * 
 * Core service that processes news items and generates intelligent
 * narrations for the waterfall display system
 */

import { EventEmitter } from 'events';
import { ConvexHttpClient } from 'convex/browser';
import { 
  NewsItem, 
  HostNarration, 
  HostAgentConfig, 
  HostState,
  ProducerContextData,
  LLMAnalysis,
  DEFAULT_HOST_CONFIG,
  HOST_PERSONALITIES,
  VERBOSITY_LEVELS
} from '@/lib/types/hostAgent';
import { EnhancedRedditPost } from '@/lib/types/enhancedRedditPost';
import { useStoryThreadStore } from '@/lib/stores/livefeed/storyThreadStore';
import { StoryThread, StoryUpdate } from '@/lib/types/storyThread';
import { MockLLMService } from './mockLLMService';
import { ClaudeLLMService } from './claudeLLMService';
import { api } from '@/convex/_generated/api';

export class HostAgentService extends EventEmitter {
  private state: HostState;
  private config: HostAgentConfig;
  private processingInterval: NodeJS.Timeout | null = null;
  private statsInterval: NodeJS.Timeout | null = null;
  private llmService: MockLLMService | ClaudeLLMService;
  private startTime: number = 0;
  private lastNarrationCompletedAt: number = 0;
  
  // 🎛️ HOST TIMING CONFIGURATION - Easily Adjustable
  private TIMING_CONFIG = {
    // Cooldown between narrations (how long to wait after completing one before starting next)
    NARRATION_COOLDOWN_MS: 4000, // 4 seconds (professional preset)
    
    // Queue processing delays
    QUEUE_RETRY_DELAY_MS: 1500, // 1.5 seconds (professional preset)
    
    // Character-by-character streaming speed for precise 314 WPM
    CHARACTER_STREAMING_DELAY_MS: 38, // 38ms = 314 WPM (professional news delivery speed)
    
    // Live streaming chunk delay (legacy, now using character-by-character)
    LIVE_STREAMING_CHUNK_DELAY_MS: 76, // 76ms = ~314 WPM for chunk-based streaming
    
    // Additional delays for different phases
    PRE_NARRATION_DELAY_MS: 1000, // 1 second pause before starting narration
    POST_NARRATION_DELAY_MS: 1800, // 1.8 seconds pause after completing narration (professional)
  };
  
  private currentSessionId: string | null = null; // Track current session
  private sessionContent: string = ''; // Accumulate session content
  private storyThreadStore: typeof useStoryThreadStore; // Story thread store reference
  
  // Smart Caching System for Zero Duplicates
  private narrationCache: Map<string, { content: string; timestamp: number; hash: string }> = new Map();
  private contentHashes: Set<string> = new Set(); // Track unique content signatures
  private threadUpdateCounts: Map<string, number> = new Map(); // Track update numbers per thread
  private readonly CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache expiry
  
  // Host-Level Duplicate Detection
  private processedContentSignatures: Set<string> = new Set(); // Track processed content signatures
  private titleSimilarityCache: Map<string, string[]> = new Map(); // Cache similar titles

  constructor(config: Partial<HostAgentConfig> = {}, llmService?: MockLLMService | ClaudeLLMService) {
    super();
    
    this.config = { ...DEFAULT_HOST_CONFIG, ...config };
    
    // Initialize story thread store
    this.storyThreadStore = useStoryThreadStore;
    
    // Use provided service or create Claude service (fallback to mock if server not configured)
    if (llmService) {
      this.llmService = llmService;
    } else {
      // Always try Claude first, but we'll check availability async
      const claudeService = new ClaudeLLMService();
      this.llmService = claudeService;
      console.log('🤖 Initialized with Claude LLM service');
      
      // Check availability in background and potentially switch to mock
      this.checkLLMAvailability();
    }
    
    this.state = {
      isActive: false,
      currentNarration: null,
      narrationQueue: [],
      processedItems: new Set(),
      context: [],
      producerContext: [],
      stats: {
        itemsProcessed: 0,
        totalNarrations: 0,
        averageReadTime: 0,
        queueLength: 0,
        uptime: 0
      }
    };

    this.setupEventListeners();
  }

  // Public API Methods
  public start(): void {
    if (this.state.isActive) {
      console.log('🎙️ Host agent is already active');
      return;
    }
    
    console.log('🎙️ Host agent starting...');
    
    // DON'T clear duplicate detection cache on start - preserve across sessions
    console.log(`🔍 HOST START: Preserving duplicate cache with ${this.processedContentSignatures.size} signatures, ${this.titleSimilarityCache.size} titles`);
    
    // Create a new session when starting
    this.currentSessionId = `host-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.sessionContent = ''; // Reset session content
    
    // Create the session in the database
    this.createSession().catch((error: unknown) => {
      console.error('❌ Failed to create host session:', error);
    });
    
    this.state.isActive = true;
    this.startTime = Date.now();
    
    // Start processing queue
    this.processingInterval = setInterval(
      () => this.processQueue(),
      this.config.updateFrequency
    );
    
    // Start stats updates
    this.statsInterval = setInterval(
      () => this.updateStats(),
      1000 // Update stats every second
    );
    
    this.emit('host:started');
    console.log(`✅ Host agent started successfully with session: ${this.currentSessionId}`);
  }

  public stop(): void {
    if (!this.state.isActive) {
      console.log('🎙️ Host agent is already stopped');
      return;
    }
    
    console.log('🎙️ Host agent stopping...');
    
    // End the current session
    if (this.currentSessionId) {
      this.endSession().catch((error: unknown) => {
        console.error('❌ Failed to end host session:', error);
      });
    }
    
    this.state.isActive = false;
    
    // Clear intervals
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
    
    // Clear current narration and queue to prevent continued processing
    this.state.currentNarration = null;
    
    // Clear the queue to stop processing any remaining items
    if (this.state.narrationQueue.length > 0) {
      console.log(`🗑️ Host agent: Clearing ${this.state.narrationQueue.length} remaining items in queue`);
      this.state.narrationQueue = [];
      this.emit('queue:updated', 0);
    }
    
    this.emit('host:stopped');
    console.log('✅ Host agent stopped successfully');
  }

  public async processNewsItem(item: NewsItem): Promise<void> {
    try {
      // Skip if already processed
      if (this.state.processedItems.has(item.id)) {
        console.log(`⏭️ Skipping already processed item: ${item.id}`);
        return;
      }

      // 🎯 DUPLICATE DETECTION: Check for content duplicates using NewsItem data
      const itemTitle = item.title || item.content.substring(0, 100);
      console.log(`🔍 HOST DUPLICATE CHECK: Processing "${itemTitle.substring(0, 50)}..." (Cache size: ${this.processedContentSignatures.size})`);
      
      const contentSignature = this.generateNewsItemSignature(item);
      console.log(`🔑 HOST CONTENT SIGNATURE: ${contentSignature.substring(0, 16)}... for "${itemTitle.substring(0, 30)}..."`);
      
      const isDuplicate = this.checkForDuplicateContent(contentSignature, itemTitle);
      
      if (isDuplicate) {
        console.log(`🚫 HOST DUPLICATE DETECTED: Skipping duplicate NewsItem - "${itemTitle.substring(0, 50)}..."`);
        // Mark as processed to avoid reprocessing, but don't generate narration
        this.state.processedItems.add(item.id);
        return;
      }
      
      console.log(`✅ HOST NEW CONTENT: Processing "${itemTitle.substring(0, 50)}..." (not a duplicate)`);

      console.log(`🔄 Processing news item: ${item.title || item.content.substring(0, 50)}... [Current narration: ${this.state.currentNarration?.id || 'none'}]`);

      // Add to context window
      this.updateContext(item);

      // Create placeholder narration and start streaming
      await this.generateStreamingNarration(item);
      
      this.state.processedItems.add(item.id);
      this.state.stats.itemsProcessed++;
      
      this.emit('narration:queued', item.id);
      this.emit('queue:updated', this.state.narrationQueue.length);
      
      console.log(`✅ Started streaming narration for: ${item.id}`);
      
    } catch (error) {
      console.error(`❌ Failed to process news item ${item.id}:`, error);
      this.emit('error', error as Error);
    }
  }

  /**
   * Thread-aware processing for Reddit posts
   * Checks for existing story threads and either updates existing or creates new narrations
   */
  public async processRedditPostWithThreads(post: EnhancedRedditPost): Promise<{
    threadId: string;
    isNewThread: boolean;
    isUpdate: boolean;
    narrationId?: string;
  }> {
    try {
      // Skip if already processed
      if (this.state.processedItems.has(post.id)) {
        console.log(`⏭️ Skipping already processed Reddit post: ${post.id}`);
        throw new Error('Post already processed');
      }

      // 🎯 HOST-LEVEL DUPLICATE DETECTION: Check for content duplicates BEFORE thread processing
      const contentSignature = this.generateContentSignature(post);
      const isDuplicate = this.checkForDuplicateContent(contentSignature, post.title);
      
      // Only skip duplicates if this is NOT a Producer-initiated update
      if (isDuplicate && !this.isProducerInitiatedUpdate(post)) {
        console.log(`🚫 DUPLICATE DETECTED: Skipping duplicate content - "${post.title.substring(0, 50)}..." from r/${post.subreddit}`);
        // Mark as processed to avoid reprocessing, but don't generate narration
        this.state.processedItems.add(post.id);
        throw new Error('Duplicate content detected');
      } else if (isDuplicate) {
        console.log(`🔄 PRODUCER UPDATE: Allowing duplicate for Producer-initiated update - "${post.title.substring(0, 50)}..."`);
      }

      console.log(`🧵 Processing Reddit post with thread awareness: ${post.title.substring(0, 50)}...`);

      // Process the post through the story thread system
      const threadResult = await this.storyThreadStore.getState().processPostForThreads(post);
      
      // Convert Reddit post to NewsItem for narration generation
      const newsItem = this.convertRedditPostToNewsItem(post);
      
      // Add to context window
      this.updateContext(newsItem);

      let narrationId: string | undefined;

      if (threadResult.isUpdate && !threadResult.isNewThread) {
        // This is an update to existing thread - generate update narration
        narrationId = await this.generateThreadUpdateNarration(post, threadResult.threadId, threadResult.updateType!);
        console.log(`🔄 Generated update narration for thread ${threadResult.threadId}: ${narrationId}`);
      } else {
        // This is a new thread - generate regular narration
        await this.generateStreamingNarration(newsItem);
        narrationId = this.state.currentNarration?.id || this.state.narrationQueue[this.state.narrationQueue.length - 1]?.id;
        console.log(`🆕 Generated new narration for thread ${threadResult.threadId}: ${narrationId}`);
      }
      
      this.state.processedItems.add(post.id);
      this.state.stats.itemsProcessed++;
      
      this.emit('narration:queued', post.id);
      this.emit('queue:updated', this.state.narrationQueue.length);
      
      // Emit thread update event for UI
      this.emit('thread:processed', {
        threadId: threadResult.threadId,
        postId: post.id,
        isNewThread: threadResult.isNewThread,
        isUpdate: threadResult.isUpdate,
        updateType: threadResult.updateType,
        narrationId
      });
      
      return {
        threadId: threadResult.threadId,
        isNewThread: threadResult.isNewThread,
        isUpdate: threadResult.isUpdate,
        narrationId
      };
      
    } catch (error) {
      console.error(`❌ Failed to process Reddit post with threads ${post.id}:`, error);
      this.emit('error', error as Error);
      throw error;
    }
  }

  public updateConfig(newConfig: Partial<HostAgentConfig>): void {
    console.log('⚙️ Updating host agent configuration');
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };
    
    // Restart intervals if frequency changed
    if (oldConfig.updateFrequency !== this.config.updateFrequency && this.state.isActive) {
      if (this.processingInterval) {
        clearInterval(this.processingInterval);
        this.processingInterval = setInterval(
          () => this.processQueue(),
          this.config.updateFrequency
        );
      }
    }
    
    console.log('✅ Configuration updated');
  }

  public getState(): Readonly<HostState> {
    return { ...this.state };
  }

  public getConfig(): Readonly<HostAgentConfig> {
    return { ...this.config };
  }

  public clearQueue(): void {
    console.log('🗑️ Clearing narration queue');
    this.state.narrationQueue = [];
    this.emit('queue:updated', 0);
  }

  // 🎯 DUPLICATE DETECTION UTILITIES

  /**
   * Clear duplicate detection cache (useful for testing/debugging)
   */
  public clearDuplicateDetectionCache(): void {
    this.clearDuplicateCache();
    console.log('🧹 Manual duplicate detection cache clear requested');
  }

  /**
   * Get duplicate detection statistics
   */
  public getDuplicateDetectionStats(): {
    processedSignatures: number;
    titleCache: number;
    contentHashes: number;
    narrationCache: number;
    threadUpdateCounts: number;
  } {
    return {
      processedSignatures: this.processedContentSignatures.size,
      titleCache: this.titleSimilarityCache.size,
      contentHashes: this.contentHashes.size,
      narrationCache: this.narrationCache.size,
      threadUpdateCounts: this.threadUpdateCounts.size
    };
  }

  /**
   * Test duplicate detection with a sample NewsItem (for debugging)
   */
  public testDuplicateDetection(item: NewsItem): {
    isDuplicate: boolean;
    signature: string;
    reason?: string;
  } {
    const itemTitle = item.title || item.content.substring(0, 100);
    const contentSignature = this.generateNewsItemSignature(item);
    
    console.log(`🧪 TESTING DUPLICATE DETECTION for "${itemTitle.substring(0, 50)}..."`);
    console.log(`🔑 Generated signature: ${contentSignature.substring(0, 16)}...`);
    console.log(`📊 Current cache size: ${this.processedContentSignatures.size} signatures`);
    
    const isDuplicate = this.checkForDuplicateContent(contentSignature, itemTitle);
    
    return {
      isDuplicate,
      signature: contentSignature,
      reason: isDuplicate ? 'Found matching content in cache' : 'No duplicate found'
    };
  }

  /**
   * Adjust Host timing settings
   */
  public updateTimingConfig(newConfig: Partial<typeof this.TIMING_CONFIG>): void {
    Object.assign(this.TIMING_CONFIG, newConfig);
    console.log(`⚙️ Updated Host timing configuration:`, this.TIMING_CONFIG);
  }

  /**
   * Get current timing configuration
   */
  public getTimingConfig(): typeof this.TIMING_CONFIG {
    return { ...this.TIMING_CONFIG };
  }

  /**
   * Apply preset timing configurations
   */
  public applyTimingPreset(preset: 'fast' | 'normal' | 'professional' | 'slow' | 'deliberate'): void {
    const presets = {
      fast: {
        NARRATION_COOLDOWN_MS: 1000,      // 1 second
        QUEUE_RETRY_DELAY_MS: 500,        // 0.5 seconds
        CHARACTER_STREAMING_DELAY_MS: 25, // ~400 WPM (very fast)
        LIVE_STREAMING_CHUNK_DELAY_MS: 50, // Fast chunk delivery
        PRE_NARRATION_DELAY_MS: 500,      // 0.5 seconds
        POST_NARRATION_DELAY_MS: 1000,    // 1 second
      },
      normal: {
        NARRATION_COOLDOWN_MS: 3000,      // 3 seconds
        QUEUE_RETRY_DELAY_MS: 1000,       // 1 second
        CHARACTER_STREAMING_DELAY_MS: 42, // ~250 WPM (conversational)
        LIVE_STREAMING_CHUNK_DELAY_MS: 84, // Moderate chunk delivery
        PRE_NARRATION_DELAY_MS: 750,      // 0.75 seconds
        POST_NARRATION_DELAY_MS: 1500,    // 1.5 seconds
      },
      professional: {
        NARRATION_COOLDOWN_MS: 4000,      // 4 seconds
        QUEUE_RETRY_DELAY_MS: 1500,       // 1.5 seconds
        CHARACTER_STREAMING_DELAY_MS: 38, // 314 WPM (PERFECT professional news delivery)
        LIVE_STREAMING_CHUNK_DELAY_MS: 76, // 314 WPM for chunks
        PRE_NARRATION_DELAY_MS: 1000,     // 1 second
        POST_NARRATION_DELAY_MS: 1800,    // 1.8 seconds
      },
      slow: {
        NARRATION_COOLDOWN_MS: 5000,      // 5 seconds
        QUEUE_RETRY_DELAY_MS: 2000,       // 2 seconds
        CHARACTER_STREAMING_DELAY_MS: 50, // ~200 WPM (deliberate)
        LIVE_STREAMING_CHUNK_DELAY_MS: 100, // Slower chunk delivery
        PRE_NARRATION_DELAY_MS: 1000,     // 1 second
        POST_NARRATION_DELAY_MS: 2000,    // 2 seconds
      },
      deliberate: {
        NARRATION_COOLDOWN_MS: 8000,      // 8 seconds
        QUEUE_RETRY_DELAY_MS: 3000,       // 3 seconds
        CHARACTER_STREAMING_DELAY_MS: 75, // ~133 WPM (very deliberate)
        LIVE_STREAMING_CHUNK_DELAY_MS: 150, // Very slow chunk delivery
        PRE_NARRATION_DELAY_MS: 2000,     // 2 seconds
        POST_NARRATION_DELAY_MS: 3000,    // 3 seconds
      }
    };

    this.updateTimingConfig(presets[preset]);
    console.log(`🎛️ Applied "${preset}" timing preset to Host agent`);
  }

  // Check LLM availability and switch to mock if needed
  private async checkLLMAvailability(): Promise<void> {
    if (this.llmService instanceof ClaudeLLMService) {
      try {
        const available = await this.llmService.checkServerAvailability();
        if (!available) {
          console.log('⚠️ Claude not available, switching to Mock LLM service');
          this.llmService = new MockLLMService(true, 300);
        } else {
          console.log('✅ Claude LLM service is available');
        }
      } catch (error) {
        console.error('❌ Error checking Claude availability:', error);
        console.log('🎭 Switching to Mock LLM service');
        this.llmService = new MockLLMService(true, 300);
      }
    }
  }

  // Private Methods
  private setupEventListeners(): void {
    this.on('narration:started', (narration: HostNarration) => {
      console.log(`🎬 Starting narration: ${narration.id}`);
    });
    
    this.on('narration:completed', (narration: HostNarration) => {
      console.log(`🎬 Completed narration: ${narration.id}`);
    });
    
    this.on('error', (error: Error) => {
      console.error('🚨 Host agent error:', error);
    });

    // Listen for Producer context events
    this.on('context:host', (context: ProducerContextData) => {
      console.log('🏭➡️🎙️ Received Producer context:', context);
      this.integrateProducerContext(context);
    });
  }

  /**
   * Convert Reddit post to NewsItem format for existing narration pipeline
   */
  private convertRedditPostToNewsItem(post: EnhancedRedditPost): NewsItem {
    return {
      id: post.id,
      title: post.title,
      content: post.selftext || post.title, // Use selftext or fallback to title
      author: post.author,
      platform: 'reddit',
      timestamp: new Date(post.created_utc * 1000),
      engagement: {
        likes: post.score,
        comments: post.num_comments,
        shares: 0, // Reddit doesn't have shares
      },
      subreddit: post.subreddit,
      hashtags: [], // Reddit doesn't use hashtags
      url: post.url
    };
  }

  /**
   * Generate narration for thread updates (different tone and structure)
   */
  private async generateThreadUpdateNarration(
    post: EnhancedRedditPost,
    threadId: string,
    updateType: StoryUpdate['updateType']
  ): Promise<string> {
    try {
      // Get the thread for context
      const thread = this.storyThreadStore.getState().getThreadById(threadId);
      if (!thread) {
        throw new Error(`Thread ${threadId} not found`);
      }

      // 🎯 OPTIMIZATION 1: Zero Duplicates with Smart Caching
      const cacheKey = this.generateCacheKey(post, threadId, updateType);
      const cached = this.narrationCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
        console.log(`♻️ Using cached narration for thread update: ${cacheKey}`);
        return cached.content;
      }

      // Clean expired cache entries
      this.cleanExpiredCache();

      // 🎯 OPTIMIZATION 2: Clear Thread Update Indicators
      const updateNumber = this.getNextUpdateNumber(threadId);
      const updateIndicator = this.generateUpdateIndicator(updateType, updateNumber);

      // Create update narration with thread context
      const narrationId = `update-narration-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Get analysis for the new post
      const newsItem = this.convertRedditPostToNewsItem(post);
      const analysis = await this.llmService.analyzeContent(newsItem.content);

      // 🎯 OPTIMIZATION 3: Priority-Based Urgency
      const priority = this.determinePriority(newsItem, analysis);
      const urgencyTone = this.getUrgencyGreeting(priority, updateType);

      // Use enhanced thread-aware prompt
      let prompt: string;
      if (this.llmService instanceof ClaudeLLMService) {
        prompt = this.buildEnhancedThreadUpdatePrompt(newsItem, thread, updateType, updateNumber, urgencyTone);
      } else {
        prompt = this.buildPrompt(newsItem);
      }
      
      const updateNarration: HostNarration = {
        id: narrationId,
        newsItemId: post.id,
        narrative: '', // Will be filled by streaming
        tone: this.mapUpdateTypeToTone(updateType),
        priority,
        timestamp: new Date(),
        duration: 0,
        segments: [],
        metadata: {
          ...analysis,
          originalItem: newsItem,
          // 🎯 OPTIMIZATION 5: Visual Thread Tracking Metadata
          summary: JSON.stringify({
            threadId,
            updateType,
            updateNumber,
            updateIndicator,
            isThreadUpdate: true,
            threadTopic: thread.topic,
            timelinePosition: this.calculateTimelinePosition(thread),
            storyProgression: this.analyzeStoryProgression(thread, updateType)
          })
        }
      };

      // Add to queue with special handling for updates
      this.addUpdateNarrationToQueue(updateNarration, thread);
      
      // Generate the actual narration content using our enhanced prompt
      if (this.llmService instanceof ClaudeLLMService) {
        try {
          const narrative = await this.llmService.generate(prompt, {
            temperature: 0.7,
            maxTokens: 300,
            systemPrompt: `You are an expert news narrator creating engaging story updates. Use the provided update indicator and build upon previous coverage. Create narrative continuity while avoiding repetition.`
          });
          
          // 🎯 OPTIMIZATION 1: Content uniqueness check
          const contentHash = this.generateContentHash(narrative);
          
          if (this.contentHashes.has(contentHash)) {
            console.log(`🔄 Detected duplicate content, regenerating with variation...`);
            // Regenerate with higher temperature for variation
            const variedNarrative = await this.llmService.generate(prompt, {
              temperature: 0.9,
              maxTokens: 300,
              systemPrompt: `You are an expert news narrator. Create a UNIQUE perspective on this story update that differs from previous coverage. Use fresh language and new angles.`
            });
            
            const variedHash = this.generateContentHash(variedNarrative);
            if (!this.contentHashes.has(variedHash)) {
              this.contentHashes.add(variedHash);
              this.updateNarrationInQueue(narrationId, `${updateIndicator} ${variedNarrative}`);
              this.cacheNarration(cacheKey, narrationId, variedHash);
            } else {
              // Last resort: use template with unique elements
              const fallbackNarrative = this.generateFallbackNarrative(newsItem, updateIndicator, updateNumber);
              this.updateNarrationInQueue(narrationId, fallbackNarrative);
            }
          } else {
            this.contentHashes.add(contentHash);
            this.updateNarrationInQueue(narrationId, `${updateIndicator} ${narrative}`);
            this.cacheNarration(cacheKey, narrationId, contentHash);
          }
          
        } catch (error) {
          console.error(`❌ Failed to generate narrative content:`, error);
          // Enhanced fallback with update indicator
          const fallbackNarrative = this.generateFallbackNarrative(newsItem, updateIndicator, updateNumber);
          this.updateNarrationInQueue(narrationId, fallbackNarrative);
        }
      } else {
        // For MockLLMService, use existing streaming approach
        await this.generateStreamingNarration(newsItem);
      }
      
      console.log(`🔄 Created enhanced thread update narration: ${narrationId} (${updateIndicator}) for thread "${thread.topic}"`);
      return narrationId;
      
    } catch (error) {
      console.error(`❌ Failed to generate thread update narration:`, error);
      throw error;
    }
  }

  /**
   * Map update types to appropriate narration tones
   */
  private mapUpdateTypeToTone(updateType: StoryUpdate['updateType']): HostNarration['tone'] {
    switch (updateType) {
      case 'new_development':
        return 'developing';
      case 'follow_up':
        return 'analysis';
      case 'clarification':
        return 'analysis';
      case 'correction':
        return 'breaking';
      default:
        return 'developing';
    }
  }

  /**
   * Add update narration to queue with higher priority
   */
  private addUpdateNarrationToQueue(narration: HostNarration, thread: StoryThread): void {
    // Update narrations get higher priority to maintain story continuity
    if (narration.priority === 'low') narration.priority = 'medium';
    if (narration.priority === 'medium') narration.priority = 'high';
    
    this.state.narrationQueue.unshift(narration); // Add to front of queue
    
    console.log(`🚀 Added thread update narration to front of queue: ${narration.id} for "${thread.topic}"`);
  }

  // Existing private methods continue below...

  // New method to integrate Producer context into Host narrations
  private integrateProducerContext(context: ProducerContextData): void {
    try {
      // Store context for use in next narration
      if (!this.state.producerContext) {
        this.state.producerContext = [];
      }
      this.state.producerContext.push({
        ...context,
        receivedAt: Date.now()
      });

      // Keep only recent context (last 10 items)
      if (this.state.producerContext.length > 10) {
        this.state.producerContext.shift();
      }

      console.log(`🏭➡️🎙️ ✅ Successfully integrated Producer context for post ${context.postId || 'unknown'}`);
      console.log(`🏭➡️🎙️ 📊 Host now has ${this.state.producerContext.length} context items`);
      
      // Emit custom event for debugging
      this.emit('context:integrated', {
        contextCount: this.state.producerContext.length,
        latestContext: context
      });
    } catch (error) {
      console.error('🏭➡️🎙️ Failed to integrate Producer context:', error);
    }
  }

  private updateContext(item: NewsItem): void {
    this.state.context.push(item);
    
    // Maintain context window size
    if (this.state.context.length > this.config.contextWindow) {
      this.state.context.shift();
    }
  }

  private async generateStreamingNarration(item: NewsItem): Promise<void> {
    try {
      // Create initial narration placeholder
      const narrationId = `narration-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Get analysis first (non-streaming)
      const analysis = await this.llmService.analyzeContent(item.content);
      
      const placeholderNarration: HostNarration = {
        id: narrationId,
        newsItemId: item.id,
        narrative: '', // Will be filled by streaming
        tone: this.determineTone(item, analysis),
        priority: this.determinePriority(item, analysis),
        timestamp: new Date(),
        duration: 0, // Will be calculated as we stream
        segments: [], // Will be populated by streaming
        metadata: {
          ...analysis,
          originalItem: item // Store the original item for queue processing
        }
      };

    // Only add to queue if we're not already processing something
    if (!this.state.currentNarration) {
      // Check cooldown period
      const timeSinceLastNarration = Date.now() - this.lastNarrationCompletedAt;
      if (this.lastNarrationCompletedAt > 0 && timeSinceLastNarration < this.TIMING_CONFIG.NARRATION_COOLDOWN_MS) {
        console.log(`⏳ In cooldown period (${this.TIMING_CONFIG.NARRATION_COOLDOWN_MS - timeSinceLastNarration}ms remaining), adding to queue: ${narrationId}`);
        this.addToQueue(placeholderNarration);
        return;
      }
      
      this.state.currentNarration = placeholderNarration;
      console.log(`🎬 Starting narration: ${narrationId} [Queue length: ${this.state.narrationQueue.length}]`);
      this.emit('narration:started', placeholderNarration);
      this.emit('narration:streaming', { narrationId, currentText: '' });
      
      // Add pre-narration delay for more natural pacing
      console.log(`⏳ Pre-narration pause (${this.TIMING_CONFIG.PRE_NARRATION_DELAY_MS}ms)...`);
      await new Promise(resolve => setTimeout(resolve, this.TIMING_CONFIG.PRE_NARRATION_DELAY_MS));
      
      // Start live streaming from Claude API
      await this.startLiveStreaming(placeholderNarration, item);
    } else {
      // Add to queue if we're busy
      this.addToQueue(placeholderNarration);
      console.log(`📝 Added narration to queue: ${placeholderNarration.id} [Queue length: ${this.state.narrationQueue.length}] [Current: ${this.state.currentNarration.id}]`);
    }    } catch (error) {
      console.error('❌ Error in generateStreamingNarration:', error);
      this.emit('narration:error', item.id, error as Error);
    }
  }

  private async startLiveStreaming(narration: HostNarration, item: NewsItem): Promise<void> {
    // Don't start streaming if service is inactive
    if (!this.state.isActive) {
      console.log('⏸️ Host agent: Skipping live streaming - service is inactive');
      return;
    }
    
    const prompt = this.buildPrompt(item);
    let finalText = '';
    let streamingBuffer = '';
    let isStreaming = false;
    
    // Character-by-character streaming function for precise WPM control
    const streamCharacterByCharacter = async (text: string) => {
      if (isStreaming) return; // Prevent overlapping streams
      
      isStreaming = true;
      console.log(`📡 Starting character-by-character streaming at ${Math.round(1000/(this.TIMING_CONFIG.CHARACTER_STREAMING_DELAY_MS/5))} WPM...`);
      
      for (let i = 0; i < text.length; i++) {
        // Stop streaming if service becomes inactive
        if (!this.state.isActive) {
          console.log('⏸️ Host agent: Stopping character streaming - service is inactive');
          isStreaming = false;
          return;
        }
        
        streamingBuffer += text[i];
        
        // Emit each character addition
        this.emit('narration:streaming', {
          narrationId: narration.id,
          currentText: streamingBuffer
        });
        
        // Wait between characters for precise WPM timing
        if (i < text.length - 1) { // Don't delay after the last character
          await new Promise(resolve => setTimeout(resolve, this.TIMING_CONFIG.CHARACTER_STREAMING_DELAY_MS));
        }
      }
      
      isStreaming = false;
      console.log(`✅ Character streaming completed (${text.length} characters)`);
    };
    
    try {
      await this.llmService.generateStream(
        prompt,
        {
          temperature: HOST_PERSONALITIES[this.config.personality].temperature,
          maxTokens: VERBOSITY_LEVELS[this.config.verbosity].maxTokens,
          systemPrompt: HOST_PERSONALITIES[this.config.personality].systemPrompt
        },
        // onChunk callback - collect chunks but don't stream them immediately
        (chunk: string) => {
          finalText += chunk;
          // Don't emit chunks immediately - we'll stream character-by-character at the end
        },
        // onComplete callback  
        async (fullText: string) => {
          console.log(`🤖 LLM generation completed, starting controlled streaming of ${fullText.length} characters...`);
          
          // Start character-by-character streaming for precise WPM control
          await streamCharacterByCharacter(fullText);
          
          // Update the current narration with final content
          if (this.state.currentNarration && this.state.currentNarration.id === narration.id) {
            this.state.currentNarration.narrative = fullText;
            this.state.currentNarration.duration = this.estimateReadingTime(fullText);
            this.state.currentNarration.segments = this.splitIntoSegments(fullText);
          }

          console.log(`✅ Live streaming completed for: ${narration.id}`);
          
          // Save to host document database (async, don't block)
          this.saveNarrationToDatabase(narration, fullText).catch(error => {
            console.error('❌ Failed to save host narration to database:', error);
          });
          
          this.emit('narration:completed', narration.id, fullText);
          
          // Set cooldown timestamp and clear current narration
          this.lastNarrationCompletedAt = Date.now();
          this.state.currentNarration = null;
          
          // Add post-narration delay for more natural pacing
          setTimeout(() => {
            // Only continue processing if service is still active
            if (this.state.isActive) {
              this.processQueue();
            } else {
              console.log('⏸️ Host agent: Skipping queue processing - service is inactive');
            }
          }, this.TIMING_CONFIG.POST_NARRATION_DELAY_MS);
        },
        // onError callback
        (error: Error) => {
          console.error(`❌ Live streaming failed for ${narration.id}:`, error);
          this.emit('narration:error', narration.id, error);
          
          // Set cooldown timestamp and clear current narration
          this.lastNarrationCompletedAt = Date.now();
          this.state.currentNarration = null;
          
          setTimeout(() => {
            // Only continue processing if service is still active
            if (this.state.isActive) {
              this.processQueue();
            } else {
              console.log('⏸️ Host agent: Skipping queue processing - service is inactive');
            }
          }, 1000);
        }
      );
      
    } catch (error) {
      console.error(`❌ Error starting live streaming for ${narration.id}:`, error);
      this.emit('narration:error', narration.id, error as Error);
      this.state.currentNarration = null;
    }
  }

  private buildPrompt(item: NewsItem): string {
    const contextSummary = this.summarizeContext();
    const personality = HOST_PERSONALITIES[this.config.personality];
    const verbosity = VERBOSITY_LEVELS[this.config.verbosity];
    
    return `
Context: ${contextSummary}

New item to report:
Platform: ${item.platform}
Author: ${item.author}
${item.title ? `Title: ${item.title}` : ''}
Content: ${item.content}
Engagement: ${item.engagement.likes} likes, ${item.engagement.comments} comments, ${item.engagement.shares} shares
${item.hashtags ? `Hashtags: ${item.hashtags.join(', ')}` : ''}
${item.subreddit ? `Subreddit: r/${item.subreddit}` : ''}

Generate a ${this.config.verbosity} news narration (${verbosity.targetLength}).
Style: ${personality.style}
Focus on: key information, context, and significance.
${contextSummary !== "No previous context" ? "Maintain continuity with previous stories if relevant." : ""}
    `.trim();
  }

  /**
   * Build thread-aware prompt for Claude when generating story updates
   */
  private buildThreadUpdatePrompt(
    item: NewsItem,
    thread: StoryThread,
    updateType: StoryUpdate['updateType']
  ): string {
    const personality = HOST_PERSONALITIES[this.config.personality];
    const verbosity = VERBOSITY_LEVELS[this.config.verbosity];

    // Get Producer context if available
    const producerContext = this.state.producerContext || [];
    const relevantContext = producerContext
      .filter(ctx => ctx.postId === item.id)
      .slice(-1)[0]; // Get most recent context for this post

    const updateTypeDescriptions = {
      'new_development': 'significant new development',
      'follow_up': 'follow-up information',
      'clarification': 'clarification or additional details',
      'correction': 'correction to previous information'
    };

    return `
STORY THREAD UPDATE CONTEXT:
Thread Topic: ${thread.topic}
Thread Started: ${new Date(thread.createdAt).toLocaleDateString()}
Previous Updates: ${thread.updates.length}
Update Type: ${updateTypeDescriptions[updateType]}
${relevantContext ? `\nProducer Analysis: Engagement score ${relevantContext.engagementMetrics?.totalScore || 'N/A'} - ${relevantContext.trendData?.isBreaking ? 'Breaking story' : 'Standard update'}` : ''}

CONTINUING STORY:
This is an UPDATE to our ongoing coverage of "${thread.topic}".
Previous coverage included: ${thread.keywords.slice(0, 5).join(', ')}

NEW DEVELOPMENT TO REPORT:
Platform: ${item.platform}
Author: ${item.author}
${item.title ? `Title: ${item.title}` : ''}
Content: ${item.content}
Engagement: ${item.engagement.likes} likes, ${item.engagement.comments} comments, ${item.engagement.shares} shares
${item.hashtags ? `Hashtags: ${item.hashtags.join(', ')}` : ''}
${item.subreddit ? `Subreddit: r/${item.subreddit}` : ''}

NARRATION INSTRUCTIONS:
Generate a ${this.config.verbosity} news update narration (${verbosity.targetLength}).
Style: ${personality.style}

IMPORTANT:
- Start with a clear update indicator like "📰 News update:", "🔄 Story continues:", or "📈 Latest development:"
- Reference this as a continuation of the ongoing ${thread.topic} story
- Highlight what's NEW in this update compared to previous coverage
- Maintain continuity with the thread topic while emphasizing fresh information
- Use engaging language that shows this is part of a developing story

Focus on: What's new, why it matters, and how it advances the story.
    `.trim();
  }

  private summarizeContext(): string {
    if (this.state.context.length === 0) return "No previous context";
    
    const recentItems = this.state.context.slice(-3);
    const topics = recentItems
      .map(item => {
        if (item.hashtags && item.hashtags.length > 0) {
          return item.hashtags.slice(0, 2).join(', ');
        }
        if (item.subreddit) {
          return `r/${item.subreddit}`;
        }
        return item.platform;
      })
      .filter((topic, index, self) => self.indexOf(topic) === index)
      .join('; ');
    
    return `Recent topics: ${topics}`;
  }

  private determineTone(item: NewsItem, analysis?: LLMAnalysis): HostNarration['tone'] {
    // Check for breaking news indicators
    if (item.content.toLowerCase().includes('breaking') || 
        item.title?.toLowerCase().includes('breaking')) {
      return 'breaking';
    }
    
    // High engagement suggests developing story
    const engagementScore = item.engagement.likes + (item.engagement.comments * 2) + (item.engagement.shares * 3);
    if (engagementScore > 50000) {
      return 'developing';
    }
    
    // Use analysis urgency if available
    if (analysis?.urgency === 'high') {
      return 'breaking';
    }
    
    // Check for opinion indicators
    if (item.content.toLowerCase().includes('opinion') || 
        item.content.toLowerCase().includes('think')) {
      return 'opinion';
    }
    
    // Check for human interest indicators
    if (analysis?.sentiment === 'positive' && 
        (item.content.toLowerCase().includes('help') || 
         item.content.toLowerCase().includes('community'))) {
      return 'human-interest';
    }
    
    return 'analysis';
  }

  private determinePriority(item: NewsItem, analysis?: LLMAnalysis): HostNarration['priority'] {
    let score = 0;
    
    // Engagement factor (0-30 points)
    const engagementScore = item.engagement.likes + (item.engagement.comments * 2) + (item.engagement.shares * 3);
    if (engagementScore > 100000) score += 30;
    else if (engagementScore > 10000) score += 20;
    else if (engagementScore > 1000) score += 10;
    
    // Urgency factor (0-25 points)
    if (analysis?.urgency === 'high') score += 25;
    else if (analysis?.urgency === 'medium') score += 15;
    
    // Relevance factor (0-20 points)
    if (analysis?.relevance) {
      score += Math.round(analysis.relevance * 20);
    }
    
    // Breaking news factor (0-25 points)
    if (item.content.toLowerCase().includes('breaking')) score += 25;
    
    // Determine priority based on total score
    if (score >= 60) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  private estimateReadingTime(text: string): number {
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    return Math.ceil((wordCount / wordsPerMinute) * 60);
  }

  private splitIntoSegments(narrative: string): string[] {
    // Split by sentences, keeping punctuation
    const sentences = narrative.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    
    // Group short sentences together
    const segments: string[] = [];
    let currentSegment = '';
    
    for (const sentence of sentences) {
      if (currentSegment.length + sentence.length < 120) {
        currentSegment += (currentSegment ? ' ' : '') + sentence;
      } else {
        if (currentSegment) segments.push(currentSegment);
        currentSegment = sentence;
      }
    }
    
    if (currentSegment) segments.push(currentSegment);
    
    return segments;
  }

  private addToQueue(narration: HostNarration): void {
    this.state.narrationQueue.push(narration);
    
    // Sort by priority (high -> medium -> low)
    this.state.narrationQueue.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private async processQueue(): Promise<void> {
    console.log(`🎯 processQueue called: ${this.state.narrationQueue.length} items in queue, current narration: ${this.state.currentNarration?.id || 'none'}, isActive: ${this.state.isActive}`);
    
    // Don't process if service is inactive, queue is empty, or we're already processing a narration
    if (!this.state.isActive || this.state.narrationQueue.length === 0 || this.state.currentNarration) {
      console.log(`⏸️ processQueue skipping - inactive: ${!this.state.isActive}, queue empty: ${this.state.narrationQueue.length === 0}, already processing: ${!!this.state.currentNarration}`);
      return;
    }
    
    try {
      const queuedNarration = this.state.narrationQueue.shift();
      if (!queuedNarration) return;
      
      this.state.currentNarration = queuedNarration;
      this.state.stats.totalNarrations++;
      
      console.log(`🎬 Starting queued narration: ${queuedNarration.id} for item: ${queuedNarration.metadata?.originalItem?.title?.substring(0, 50) || 'unknown'}...`);
      
      this.emit('narration:started', queuedNarration);
      this.emit('queue:updated', this.state.narrationQueue.length);
      this.emit('narration:streaming', { narrationId: queuedNarration.id, currentText: '' });
      
      // For queued items, we need to generate the narration live via Claude API
      // Get the original item from metadata
      const originalItem = queuedNarration.metadata?.originalItem;
      if (originalItem) {
        await this.startLiveStreaming(queuedNarration, originalItem);
      } else {
        console.error('❌ No original item found in queued narration metadata');
        this.state.currentNarration = null;
        setTimeout(() => {
          // Only retry processing if service is still active
          if (this.state.isActive) {
            this.processQueue();
          } else {
            console.log('⏸️ Host agent: Skipping queue retry - service is inactive');
          }
        }, this.TIMING_CONFIG.QUEUE_RETRY_DELAY_MS);
      }
      
    } catch (error) {
      console.error('❌ Error processing queue:', error);
      this.emit('error', error as Error);
      this.state.currentNarration = null;
      setTimeout(() => {
        // Only retry processing if service is still active
        if (this.state.isActive) {
          this.processQueue();
        } else {
          console.log('⏸️ Host agent: Skipping queue retry - service is inactive');
        }
      }, this.TIMING_CONFIG.QUEUE_RETRY_DELAY_MS);
    }
  }

  private async streamExistingNarration(narration: HostNarration): Promise<void> {
    // Don't stream if service is inactive
    if (!this.state.isActive) {
      console.log('⏸️ Host agent: Skipping narration streaming - service is inactive');
      return;
    }
    
    const text = narration.narrative;
    let currentText = '';
    
    this.emit('narration:streaming', {
      narrationId: narration.id,
      currentText: ''
    });
    
    // Stream the existing text character by character at a readable speed
    for (let i = 0; i < text.length; i++) {
      // Stop streaming if service becomes inactive
      if (!this.state.isActive) {
        console.log('⏸️ Host agent: Stopping narration streaming - service is inactive');
        return;
      }
      
      currentText += text[i];
      
      this.emit('narration:streaming', {
        narrationId: narration.id,
        currentText
      });
      
      // Wait between characters for readable speed (adjustable)
      await new Promise(resolve => setTimeout(resolve, this.TIMING_CONFIG.CHARACTER_STREAMING_DELAY_MS));
    }
    
    // Complete the narration
    
    // Save to host document database (async, don't block)
    this.saveNarrationToDatabase(narration, text).catch((error: unknown) => {
      console.error('❌ Failed to save host narration to database:', error);
    });
    
    this.emit('narration:completed', narration.id, text);
    this.state.currentNarration = null;
    
    // Process next item in queue after a brief pause
    setTimeout(() => {
      // Only continue processing if service is still active
      if (this.state.isActive) {
        this.processQueue();
      } else {
        console.log('⏸️ Host agent: Skipping queue processing - service is inactive');
      }
    }, 1000); // 1 second pause between narrations
  }

  private updateStats(): void {
    if (!this.state.isActive) return;
    
    this.state.stats.queueLength = this.state.narrationQueue.length;
    this.state.stats.uptime = Math.floor((Date.now() - this.startTime) / 1000);
    
    // Calculate average read time
    if (this.state.stats.totalNarrations > 0) {
      this.state.stats.averageReadTime = Math.round(
        this.state.stats.totalNarrations * 15 // Rough estimate
      );
    }
    
    this.emit('stats:updated', this.state.stats);
  }

  /**
   * Save completed narration to session content (session-based storage)
   * Appends narration to the current session's accumulated content
   */
  private async saveNarrationToDatabase(narration: HostNarration, content: string): Promise<void> {
    try {
      if (!this.currentSessionId) {
        console.warn('⚠️ No active session, cannot save narration');
        return;
      }

      const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
      
      // Append narration to session content with timestamp and metadata
      const timestamp = new Date().toLocaleString();
      const narrationBlock = `\n\n[${timestamp}] ${narration.tone.toUpperCase()} - ${narration.priority.toUpperCase()}\n${content}`;
      
      this.sessionContent += narrationBlock;
      
      // Update the session content in the database
      await convex.mutation(api.redditFeed.updateHostSessionContent, {
        session_id: this.currentSessionId,
        content_text: this.sessionContent,
        current_narration_id: narration.id,
        narration_type: this.mapToneToNarrationType(narration.tone),
        tone: this.mapToneToValidTone(narration.tone),
        priority: narration.priority,
        source_posts: narration.newsItemId ? [narration.newsItemId] : [],
        generation_metadata: JSON.stringify({
          latest_narration: {
            id: narration.id,
            narrative: content,
            topics: narration.metadata?.topics || [],
            sentiment: narration.metadata?.sentiment,
            duration: narration.duration,
            news_item_id: narration.newsItemId,
            generated_at: new Date().toISOString(),
          },
          agent_type: 'host',
          session_type: 'broadcast',
          total_narrations: this.state.stats.totalNarrations,
        })
      });

      // Update session stats
      const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
      await convex.mutation(api.redditFeed.incrementHostSessionStats, {
        session_id: this.currentSessionId,
        narrations_increment: 1,
        words_increment: wordCount,
        items_increment: 1,
      });

      console.log(`💾 Appended narration to session ${this.currentSessionId}: ${content.substring(0, 50)}...`);
      
    } catch (error) {
      console.error('❌ Failed to save host narration to session:', error);
      throw error;
    }
  }

  /**
   * Create a new host session in the database
   */
  private async createSession(): Promise<void> {
    try {
      if (!this.currentSessionId) {
        throw new Error('No session ID available');
      }

      const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
      
      await convex.mutation(api.redditFeed.createHostSession, {
        session_id: this.currentSessionId,
        title: `Host Session - ${new Date().toLocaleString()}`,
        personality: this.config.personality,
        verbosity: this.config.verbosity,
        context_window: this.config.contextWindow,
        update_frequency: this.config.updateFrequency,
        session_metadata: JSON.stringify({
          started_at: new Date().toISOString(),
          agent_version: '1.0.0',
          browser_session: true,
        })
      });

      console.log(`📋 Created host session: ${this.currentSessionId}`);
      
    } catch (error) {
      console.error('❌ Failed to create host session:', error);
      throw error;
    }
  }

  /**
   * End the current host session
   */
  private async endSession(): Promise<void> {
    try {
      if (!this.currentSessionId) {
        return;
      }

      const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
      
      await convex.mutation(api.redditFeed.endHostSession, {
        session_id: this.currentSessionId,
      });

      console.log(`📋 Ended host session: ${this.currentSessionId}`);
      this.currentSessionId = null;
      this.sessionContent = '';
      
    } catch (error) {
      console.error('❌ Failed to end host session:', error);
      throw error;
    }
  }

  /**
   * Map HostNarration tone to valid narration_type for database
   */
  private mapToneToNarrationType(tone: string): "breaking" | "developing" | "analysis" | "summary" | "commentary" {
    switch (tone) {
      case 'breaking': return 'breaking';
      case 'developing': return 'developing';
      case 'analysis': return 'analysis';
      case 'opinion': return 'commentary';
      case 'human-interest': return 'summary';
      default: return 'analysis';
    }
  }

  /**
   * Map HostNarration tone to valid tone for database
   */
  private mapToneToValidTone(tone: string): "urgent" | "informative" | "conversational" | "dramatic" {
    switch (tone) {
      case 'breaking': return 'urgent';
      case 'developing': return 'urgent';
      case 'analysis': return 'informative';
      case 'opinion': return 'conversational';
      case 'human-interest': return 'conversational';
      default: return 'informative';
    }
  }

  // 🎯 OPTIMIZATION HELPER METHODS

  /**
   * Generate a unique cache key for narration caching
   */
  private generateCacheKey(post: EnhancedRedditPost, threadId: string, updateType: StoryUpdate['updateType']): string {
    const postSignature = `${post.title.substring(0, 30)}-${post.id}`;
    return `${threadId}-${updateType}-${postSignature}`.replace(/[^a-zA-Z0-9-]/g, '');
  }

  /**
   * Clean expired cache entries
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.narrationCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL_MS) {
        this.narrationCache.delete(key);
        this.contentHashes.delete(value.hash);
      }
    }
  }

  /**
   * Get the next update number for a thread
   */
  private getNextUpdateNumber(threadId: string): number {
    const current = this.threadUpdateCounts.get(threadId) || 0;
    const next = current + 1;
    this.threadUpdateCounts.set(threadId, next);
    return next;
  }

  /**
   * Generate clear update indicators
   */
  private generateUpdateIndicator(updateType: StoryUpdate['updateType'], updateNumber: number): string {
    const indicators = {
      'new_development': `🚨 NEW DEVELOPMENT #${updateNumber}:`,
      'clarification': `📰 CLARIFICATION #${updateNumber}:`,
      'correction': `✏️ CORRECTION #${updateNumber}:`,
      'follow_up': `🔄 FOLLOW-UP #${updateNumber}:`
    };
    
    return indicators[updateType] || `📢 DEVELOPING STORY #${updateNumber}:`;
  }

  /**
   * Get urgency-based greeting patterns
   */
  private getUrgencyGreeting(priority: HostNarration['priority'], updateType: StoryUpdate['updateType']): string {
    if (priority === 'high') {
      return updateType === 'new_development' ? 'Breaking developments in' : 'Urgent update on';
    } else if (priority === 'medium') {
      return updateType === 'follow_up' ? 'Important follow-up to' : 'Significant development in';
    } else {
      return updateType === 'clarification' ? 'Related developments in' : 'New information about';
    }
  }

  /**
   * Build enhanced thread-aware prompt with all optimizations
   */
  private buildEnhancedThreadUpdatePrompt(
    newsItem: NewsItem,
    thread: StoryThread,
    updateType: StoryUpdate['updateType'],
    updateNumber: number,
    urgencyTone: string
  ): string {
    const threadHistory = thread.updates.slice(-2).map(update =>
      `• ${new Date(update.timestamp).toLocaleTimeString()}: ${update.summary}`
    ).join('\n');

    return `
STORY THREAD UPDATE NARRATION

Context: You are providing update #${updateNumber} for the ongoing story: "${thread.topic}"

Previous Coverage:
${threadHistory}

New Development:
Title: ${newsItem.title}
Content: ${newsItem.content}
Update Type: ${updateType}

Instructions:
1. Start with "${urgencyTone}" (no additional greeting needed)
2. Build directly on previous coverage - reference what was covered before
3. Highlight what's new/different in this development
4. Use ${this.getVariedLanguagePrompt(updateNumber)} to avoid repetition
5. Keep it under 150 words and engaging
6. DO NOT repeat information from previous updates
7. Focus on progression: how this advances the story

Tone: ${this.config.personality} with appropriate urgency for ${updateType}
    `.trim();
  }

  /**
   * Get varied language prompts to avoid repetition
   */
  private getVariedLanguagePrompt(updateNumber: number): string {
    const prompts = [
      "fresh vocabulary and new angles",
      "different phrasing and unique perspective",
      "alternative expressions and novel insights",
      "varied terminology and distinct viewpoint",
      "original language and fresh approach"
    ];
    return prompts[(updateNumber - 1) % prompts.length];
  }

  /**
   * Calculate timeline position for thread context
   */
  private calculateTimelinePosition(thread: StoryThread): string {
    const hoursSinceStart = (Date.now() - thread.createdAt) / (1000 * 60 * 60);
    
    if (hoursSinceStart < 1) return 'breaking';
    if (hoursSinceStart < 6) return 'developing';
    if (hoursSinceStart < 24) return 'ongoing';
    if (hoursSinceStart < 168) return 'week-long';
    return 'extended';
  }

  /**
   * Analyze story progression for narrative context
   */
  private analyzeStoryProgression(thread: StoryThread, updateType: StoryUpdate['updateType']): string {
    const updateCount = thread.updates.length;
    const progressions = {
      'new_development': updateCount < 3 ? 'escalating' : 'complex',
      'clarification': updateCount < 5 ? 'evolving' : 'detailed',
      'follow_up': 'investigating',
      'correction': 'clarifying'
    };
    
    return progressions[updateType] || 'developing';
  }

  /**
   * Generate content hash for duplicate detection
   */
  private generateContentHash(content: string): string {
    // Simple hash function for content uniqueness
    const normalized = content.toLowerCase().replace(/[^a-z0-9]/g, '');
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Update narration in queue
   */
  private updateNarrationInQueue(narrationId: string, narrative: string): void {
    const narrationInQueue = this.state.narrationQueue.find(n => n.id === narrationId);
    if (narrationInQueue) {
      narrationInQueue.narrative = narrative;
      narrationInQueue.duration = Math.ceil(narrative.length / 20);
      console.log(`📝 Updated narration: "${narrative.substring(0, 50)}..."`);
    }
  }

  /**
   * Cache narration for duplicate prevention
   */
  private cacheNarration(cacheKey: string, content: string, hash: string): void {
    this.narrationCache.set(cacheKey, {
      content,
      timestamp: Date.now(),
      hash
    });
  }

  /**
   * Generate fallback narration when all else fails
   */
  private generateFallbackNarrative(
    newsItem: NewsItem,
    updateIndicator: string,
    updateNumber: number
  ): string {
    const templates = [
      `${updateIndicator} Fresh developments in this ongoing story. ${newsItem.content.substring(0, 80)}...`,
      `${updateIndicator} The situation continues to evolve. Latest details: ${newsItem.content.substring(0, 80)}...`,
      `${updateIndicator} New information has emerged. Here's what we know: ${newsItem.content.substring(0, 80)}...`,
      `${updateIndicator} This story is developing. Current update: ${newsItem.content.substring(0, 80)}...`
    ];
    
    return templates[(updateNumber - 1) % templates.length];
  }

  // 🎯 HOST-LEVEL DUPLICATE DETECTION METHODS

  /**
   * Generate a content signature for duplicate detection
   */
  private generateContentSignature(post: EnhancedRedditPost): string {
    // Normalize title and content for comparison
    const normalizedTitle = post.title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
    
    const normalizedContent = post.selftext.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
      .substring(0, 200); // First 200 chars for content comparison
    
    // Create signature combining key elements
    const signature = `${normalizedTitle}|${normalizedContent}`.substring(0, 300);
    return this.generateContentHash(signature);
  }

  /**
   * Generate a content signature for NewsItem duplicate detection
   */
  private generateNewsItemSignature(item: NewsItem): string {
    // Normalize title and content for comparison
    const normalizedTitle = (item.title || '').toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
    
    const normalizedContent = item.content.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
      .substring(0, 200); // First 200 chars for content comparison
    
    // Create signature combining key elements
    const signature = `${normalizedTitle}|${normalizedContent}`.substring(0, 300);
    return this.generateContentHash(signature);
  }

  /**
   * Check if content is a duplicate of already processed posts
   */
  private checkForDuplicateContent(contentSignature: string, title: string): boolean {
    // Check exact signature match
    if (this.processedContentSignatures.has(contentSignature)) {
      console.log(`🔍 EXACT DUPLICATE: Content signature already exists - "${title.substring(0, 50)}..."`);
      return true;
    }

    // Enhanced title similarity with more aggressive matching
    const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const titleWords = normalizedTitle.split(/\s+/).filter(word => word.length > 2); // Lowered threshold
    const titleKeywords = this.extractKeywords(normalizedTitle);
    
    // Check against cached similar titles
    for (const [cachedSignature, cachedTitleWords] of this.titleSimilarityCache.entries()) {
      if (cachedSignature !== contentSignature) {
        const wordSimilarity = this.calculateWordSimilarity(titleWords, cachedTitleWords);
        const keywordSimilarity = this.calculateKeywordSimilarity(titleKeywords, this.extractKeywords(cachedTitleWords.join(' ')));
        
        // More aggressive duplicate detection:
        // - 70% word similarity OR 60% keyword similarity = duplicate
        if (wordSimilarity > 0.7 || keywordSimilarity > 0.6) {
          console.log(`📊 DUPLICATE DETECTED: Word similarity: ${wordSimilarity.toFixed(2)}, Keyword similarity: ${keywordSimilarity.toFixed(2)} - "${title.substring(0, 50)}..."`);
          return true;
        }

        // Special case: Major news events (Nepal, Northwestern, etc.)
        if (this.isMajorNewsEvent(titleKeywords, this.extractKeywords(cachedTitleWords.join(' ')))) {
          console.log(`📰 MAJOR NEWS DUPLICATE: Same major news event detected - "${title.substring(0, 50)}..."`);
          return true;
        }
      }
    }

    // Not a duplicate - cache this content signature and title words
    this.processedContentSignatures.add(contentSignature);
    this.titleSimilarityCache.set(contentSignature, titleWords);
    
    // More aggressive cache management (keep last 50 instead of 100)
    if (this.processedContentSignatures.size > 50) {
      const oldestSignatures = Array.from(this.processedContentSignatures).slice(0, 10);
      oldestSignatures.forEach(sig => {
        this.processedContentSignatures.delete(sig);
        this.titleSimilarityCache.delete(sig);
      });
    }

    console.log(`✅ NEW CONTENT: Added to cache - "${title.substring(0, 50)}..." (Cache size: ${this.processedContentSignatures.size})`);
    return false;
  }

  /**
   * Calculate word-based similarity between two title word arrays
   */
  private calculateWordSimilarity(words1: string[], words2: string[]): number {
    if (words1.length === 0 && words2.length === 0) return 1;
    if (words1.length === 0 || words2.length === 0) return 0;

    const set1 = new Set(words1);
    const set2 = new Set(words2);
    const intersection = new Set([...set1].filter(word => set2.has(word)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * Extract meaningful keywords from text
   */
  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    const stopWords = new Set(['that', 'this', 'with', 'from', 'they', 'have', 'been', 'said', 'says', 'will', 'would', 'could', 'should', 'when', 'where', 'what', 'there', 'their', 'these', 'those']);
    return words.filter(word => !stopWords.has(word)).slice(0, 10);
  }

  /**
   * Calculate keyword-based similarity (more semantic)
   */
  private calculateKeywordSimilarity(keywords1: string[], keywords2: string[]): number {
    if (keywords1.length === 0 && keywords2.length === 0) return 1;
    if (keywords1.length === 0 || keywords2.length === 0) return 0;

    const set1 = new Set(keywords1);
    const set2 = new Set(keywords2);
    const intersection = new Set([...set1].filter(keyword => set2.has(keyword)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * Check if this appears to be the same major news event
   */
  private isMajorNewsEvent(keywords1: string[], keywords2: string[]): boolean {
    // Define major news event indicators
    const majorNewsIndicators = [
      ['nepal', 'social', 'media', 'ban', 'facebook', 'twitter', 'youtube'],
      ['northwestern', 'university', 'president', 'resign', 'funding'],
      ['canada', 'mass', 'stabbing', 'dead', 'injured'],
      ['venezuela', 'fighter', 'jets', 'navy', 'ship', 'flyover'],
      ['france', 'macron', 'ukraine', 'ceasefire', 'troops'],
      ['iran', 'costco', 'shopping', 'restrictions'],
      ['epstein', 'client', 'list', 'justice', 'department'],
      ['kennedy', 'vaccine', 'senate', 'hearing'],
      ['anderson', 'actor', 'payment', 'murray', 'schwartzman']
    ];

    for (const eventKeywords of majorNewsIndicators) {
      const matches1 = keywords1.filter(k => eventKeywords.includes(k)).length;
      const matches2 = keywords2.filter(k => eventKeywords.includes(k)).length;
      
      // If both have 2+ matches with the same event keywords, it's likely the same story
      if (matches1 >= 2 && matches2 >= 2) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if this post is from a Producer-initiated update
   * Producer updates should bypass duplicate detection
   */
  private isProducerInitiatedUpdate(post: EnhancedRedditPost): boolean {
    // Check if we have recent Producer context for this post
    if (this.state.producerContext && this.state.producerContext.length > 0) {
      const recentContext = this.state.producerContext.find(ctx =>
        ctx.postId === post.id ||
        // Check if received within last 30 seconds (Producer-initiated)
        (Date.now() - ctx.receivedAt) < 30000
      );
      
      if (recentContext) {
        console.log(`🎯 Producer context found for post ${post.id} - bypassing duplicate check`);
        return true;
      }
    }

    // For now, assume most updates are Host-initiated unless Producer context exists
    return false;
  }

  /**
   * Clear duplicate detection cache for fresh start
   */
  private clearDuplicateCache(): void {
    const oldSizes = {
      signatures: this.processedContentSignatures.size,
      titles: this.titleSimilarityCache.size,
      hashes: this.contentHashes.size,
      narrations: this.narrationCache.size,
      threads: this.threadUpdateCounts.size
    };
    
    this.processedContentSignatures.clear();
    this.titleSimilarityCache.clear();
    this.contentHashes.clear();
    this.narrationCache.clear();
    this.threadUpdateCounts.clear();
    
    console.log(`🧹 Cleared duplicate detection cache for fresh session - Previous sizes: signatures=${oldSizes.signatures}, titles=${oldSizes.titles}, hashes=${oldSizes.hashes}, narrations=${oldSizes.narrations}, threads=${oldSizes.threads}`);
  }
}

export default HostAgentService;
