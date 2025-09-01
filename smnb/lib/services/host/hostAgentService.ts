/**
 * Host Agent Service
 * 
 * Core service that processes news items and generates intelligent
 * narrations for the waterfall display system
 */

import { EventEmitter } from 'events';
import { 
  NewsItem, 
  HostNarration, 
  HostAgentConfig, 
  HostState,
  LLMAnalysis,
  DEFAULT_HOST_CONFIG,
  HOST_PERSONALITIES,
  VERBOSITY_LEVELS
} from '@/lib/types/hostAgent';
import { MockLLMService } from './mockLLMService';
import { ClaudeLLMService } from './claudeLLMService';

export class HostAgentService extends EventEmitter {
  private state: HostState;
  private config: HostAgentConfig;
  private processingInterval: NodeJS.Timeout | null = null;
  private statsInterval: NodeJS.Timeout | null = null;
  private llmService: MockLLMService | ClaudeLLMService;
  private startTime: number = 0;

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

      console.log(`🔄 Processing news item: ${item.title || item.content.substring(0, 50)}...`);

      // Add to context window
      this.updateContext(item);

      // Generate narration
      const narration = await this.generateNarration(item);
      
      // Add to queue with priority sorting
      this.addToQueue(narration);
      this.state.processedItems.add(item.id);
      this.state.stats.itemsProcessed++;
      
      this.emit('narration:generated', narration);
      this.emit('queue:updated', this.state.narrationQueue.length);
      
      console.log(`✅ Generated narration for: ${item.id}`);
      
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
  }

  private updateContext(item: NewsItem): void {
    this.state.context.push(item);
    
    // Maintain context window size
    if (this.state.context.length > this.config.contextWindow) {
      this.state.context.shift();
    }
  }

  private async generateNarration(item: NewsItem): Promise<HostNarration> {
    try {
      const prompt = this.buildPrompt(item);
      const narrative = await this.llmService.generate(prompt, {
        temperature: HOST_PERSONALITIES[this.config.personality].temperature,
        maxTokens: VERBOSITY_LEVELS[this.config.verbosity].maxTokens,
        systemPrompt: HOST_PERSONALITIES[this.config.personality].systemPrompt
      });
      
      // Analyze content for metadata
      const analysis = await this.llmService.analyzeContent(item.content);
      
      // Split narrative into segments for waterfall effect
      const segments = this.splitIntoSegments(narrative);
      
      const narration: HostNarration = {
        id: `narration-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        newsItemId: item.id,
        narrative,
        tone: this.determineTone(item, analysis),
        priority: this.determinePriority(item, analysis),
        timestamp: new Date(),
        duration: this.estimateReadingTime(narrative),
        segments,
        metadata: analysis
      };
      
      return narration;
      
    } catch (error) {
      console.error(`❌ Failed to generate narration for ${item.id}:`, error);
      
      // Return fallback narration
      return {
        id: `fallback-${Date.now()}`,
        newsItemId: item.id,
        narrative: `📰 Latest update: ${item.content.substring(0, 100)}...`,
        tone: 'analysis',
        priority: 'low',
        timestamp: new Date(),
        duration: 10,
        segments: [`📰 Latest update: ${item.content.substring(0, 100)}...`]
      };
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
    if (this.state.narrationQueue.length === 0 || this.state.currentNarration) {
      return;
    }
    
    try {
      const narration = this.state.narrationQueue.shift();
      if (!narration) return;
      
      this.state.currentNarration = narration;
      this.state.stats.totalNarrations++;
      
      this.emit('narration:started', narration);
      this.emit('queue:updated', this.state.narrationQueue.length);
      
      // Simulate narration duration
      setTimeout(() => {
        this.emit('narration:completed', narration);
        this.state.currentNarration = null;
      }, narration.duration * 1000);
      
    } catch (error) {
      console.error('❌ Error processing queue:', error);
      this.emit('error', error as Error);
    }
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
}

export default HostAgentService;
