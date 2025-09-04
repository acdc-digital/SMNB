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
  private readonly NARRATION_COOLDOWN_MS = 2000; // 2 seconds between narrations

  constructor(config: Partial<HostAgentConfig> = {}, llmService?: MockLLMService | ClaudeLLMService) {
    super();
    
    this.config = { ...DEFAULT_HOST_CONFIG, ...config };
    
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
    console.log('✅ Host agent started successfully');
  }

  public stop(): void {
    if (!this.state.isActive) {
      console.log('🎙️ Host agent is already stopped');
      return;
    }
    
    console.log('🎙️ Host agent stopping...');
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
    
    // Clear current narration
    this.state.currentNarration = null;
    
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

      console.log(`🏭➡️🎙️ Integrated Producer context for post ${context.postId || 'unknown'}`);
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
      if (this.lastNarrationCompletedAt > 0 && timeSinceLastNarration < this.NARRATION_COOLDOWN_MS) {
        console.log(`⏳ In cooldown period (${this.NARRATION_COOLDOWN_MS - timeSinceLastNarration}ms remaining), adding to queue: ${narrationId}`);
        this.addToQueue(placeholderNarration);
        return;
      }
      
      this.state.currentNarration = placeholderNarration;
      console.log(`🎬 Starting narration immediately: ${narrationId} [Queue length: ${this.state.narrationQueue.length}]`);
      this.emit('narration:started', placeholderNarration);
      this.emit('narration:streaming', { narrationId, currentText: '' });
      
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
    const prompt = this.buildPrompt(item);
    let currentText = '';
    
    try {
      await this.llmService.generateStream(
        prompt,
        {
          temperature: HOST_PERSONALITIES[this.config.personality].temperature,
          maxTokens: VERBOSITY_LEVELS[this.config.verbosity].maxTokens,
          systemPrompt: HOST_PERSONALITIES[this.config.personality].systemPrompt
        },
        // onChunk callback
        (chunk: string) => {
          currentText += chunk;
          
          // Emit streaming chunk
          this.emit('narration:streaming', {
            narrationId: narration.id,
            currentText
          });
        },
        // onComplete callback  
        (fullText: string) => {
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
          
          setTimeout(() => {
            this.processQueue();
          }, 1500); // Brief pause between narrations
        },
        // onError callback
        (error: Error) => {
          console.error(`❌ Live streaming failed for ${narration.id}:`, error);
          this.emit('narration:error', narration.id, error);
          
          // Set cooldown timestamp and clear current narration
          this.lastNarrationCompletedAt = Date.now();
          this.state.currentNarration = null;
          
          setTimeout(() => {
            this.processQueue();
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
    console.log(`🎯 processQueue called: ${this.state.narrationQueue.length} items in queue, current narration: ${this.state.currentNarration?.id || 'none'}`);
    
    // Don't process if queue is empty or we're already processing a narration
    if (this.state.narrationQueue.length === 0 || this.state.currentNarration) {
      console.log(`⏸️ processQueue skipping - queue empty: ${this.state.narrationQueue.length === 0}, already processing: ${!!this.state.currentNarration}`);
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
        setTimeout(() => this.processQueue(), 1000);
      }
      
    } catch (error) {
      console.error('❌ Error processing queue:', error);
      this.emit('error', error as Error);
      this.state.currentNarration = null;
      setTimeout(() => this.processQueue(), 1000);
    }
  }

  private async streamExistingNarration(narration: HostNarration): Promise<void> {
    const text = narration.narrative;
    let currentText = '';
    
    this.emit('narration:streaming', {
      narrationId: narration.id,
      currentText: ''
    });
    
    // Stream the existing text character by character at a readable speed
    for (let i = 0; i < text.length; i++) {
      currentText += text[i];
      
      this.emit('narration:streaming', {
        narrationId: narration.id,
        currentText
      });
      
      // Wait between characters for readable speed (adjustable)
      await new Promise(resolve => setTimeout(resolve, 30)); // 30ms between characters
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
      this.processQueue();
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
   * Save completed narration to host_documents database
   * Follows the same pattern as editor documents with session-based storage
   */
  private async saveNarrationToDatabase(narration: HostNarration, content: string): Promise<void> {
    try {
      const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
      
      const document = {
        document_id: narration.id,
        title: narration.metadata?.summary || 'Host Narration',
        content_text: content,
        generated_by_agent: true,
        narration_type: this.mapToneToNarrationType(narration.tone),
        tone: this.mapToneToValidTone(narration.tone),
        priority: narration.priority,
        source_posts: narration.newsItemId ? [narration.newsItemId] : [],
        generation_metadata: JSON.stringify({
          narrative: narration.narrative,
          topics: narration.metadata?.topics || [],
          sentiment: narration.metadata?.sentiment,
          duration: narration.duration,
          news_item_id: narration.newsItemId,
          generated_at: new Date().toISOString(),
          agent_type: 'host',
          session_type: 'broadcast'
        })
      };

      await convex.mutation(api.redditFeed.updateHostDocument, document);
      console.log(`💾 Saved host narration to database: ${narration.id}`);
      
    } catch (error) {
      console.error('❌ Failed to save host narration:', error);
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
}

export default HostAgentService;
