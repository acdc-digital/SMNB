/**
 * Editor Agent Service
 * 
 * Core service that processes live feed content and generates intelligent
 * streaming editor content using Tiptap/ProseMirror integration
 */

import { EventEmitter } from 'events';
import { EnhancedRedditPost } from '@/lib/types/enhancedRedditPost';
import { MockLLMService } from '../host/mockLLMService';
import convex from '@/lib/convex';
import { api } from '@/convex/_generated/api';
import { ClaudeLLMService } from '../host/claudeLLMService';

export interface EditorAgentConfig {
  updateFrequency: number; // ms between processing checks
  contentStyle: 'article' | 'blog' | 'news' | 'editorial';
  maxWordsPerSession: number;
  streamingSpeed: number; // characters per second
  pauseBetweenSections: number; // ms
  enableAutoSave: boolean;
  contextWindow: number; // number of posts to consider
}

export const DEFAULT_EDITOR_CONFIG: EditorAgentConfig = {
  updateFrequency: 2000,
  contentStyle: 'article',
  maxWordsPerSession: 1500,
  streamingSpeed: 50,
  pauseBetweenSections: 1000,
  enableAutoSave: true,
  contextWindow: 5,
};

export interface EditorContent {
  id: string;
  documentId: string;
  title: string;
  content: string; // Current streaming content
  isComplete: boolean;
  wordCount: number;
  timestamp: Date;
  sourcePosts: string[]; // IDs of posts that influenced this content
  metadata: {
    style: string;
    topics: string[];
    sentiment: string;
    quality: number;
  };
}

export interface EditorState {
  isActive: boolean;
  currentContent: EditorContent | null;
  contentQueue: EnhancedRedditPost[];
  processedPosts: Set<string>;
  context: EnhancedRedditPost[];
  stats: {
    postsProcessed: number;
    totalWords: number;
    sessionsCompleted: number;
    averageWordsPerSession: number;
    uptime: number;
  };
}

export class EditorAgentService extends EventEmitter {
  private state: EditorState;
  private config: EditorAgentConfig;
  private processingInterval: NodeJS.Timeout | null = null;
  private streamingInterval: NodeJS.Timeout | null = null;
  private statsInterval: NodeJS.Timeout | null = null;
  private llmService: MockLLMService | ClaudeLLMService;
  private startTime: number = 0;
  private currentDocumentId: string;
  
  constructor(config: Partial<EditorAgentConfig> = {}) {
    super();
    
    this.config = { ...DEFAULT_EDITOR_CONFIG, ...config };
    this.currentDocumentId = `editor-${Date.now()}`;
    
    // Initialize LLM service (prioritize Claude)
    const claudeService = new ClaudeLLMService();
    this.llmService = claudeService;
    console.log('📝 Editor Agent: Initialized with Claude LLM service');
    
    // Check availability and fallback to mock if needed
    this.checkLLMAvailability();
    
    this.state = {
      isActive: false,
      currentContent: null,
      contentQueue: [],
      processedPosts: new Set(),
      context: [],
      stats: {
        postsProcessed: 0,
        totalWords: 0,
        sessionsCompleted: 0,
        averageWordsPerSession: 0,
        uptime: 0,
      },
    };

    this.setupEventListeners();
  }

  // Public API Methods
  public start(): void {
    if (this.state.isActive) {
      console.log('📝 Editor agent is already active');
      return;
    }
    
    console.log('📝 Editor agent starting...');
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
      1000
    );
    
    this.emit('editor:started');
    console.log('✅ Editor agent started successfully');
  }

  public stop(): void {
    if (!this.state.isActive) {
      console.log('📝 Editor agent is already stopped');
      return;
    }
    
    console.log('📝 Editor agent stopping...');
    this.state.isActive = false;
    
    // Clear intervals
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    
    if (this.streamingInterval) {
      clearInterval(this.streamingInterval);
      this.streamingInterval = null;
    }
    
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
    
    // Complete current content if active
    if (this.state.currentContent && !this.state.currentContent.isComplete) {
      this.completeCurrentContent();
    }
    
    this.emit('editor:stopped');
    console.log('✅ Editor agent stopped successfully');
  }

  public async processPost(post: EnhancedRedditPost): Promise<void> {
    try {
      // Skip if already processed
      if (this.state.processedPosts.has(post.id)) {
        console.log(`⏭️ Skipping already processed post: ${post.id}`);
        return;
      }

      console.log(`📥 Processing post: ${post.title.substring(0, 50)}...`);

      // Add to context and queue
      this.updateContext(post);
      this.state.contentQueue.push(post);
      this.state.processedPosts.add(post.id);
      this.state.stats.postsProcessed++;
      
      this.emit('post:queued', post.id);
      this.emit('queue:updated', this.state.contentQueue.length);
      
      console.log(`✅ Post queued: ${post.id} [Queue: ${this.state.contentQueue.length}]`);
      
    } catch (error) {
      console.error(`❌ Failed to process post ${post.id}:`, error);
      this.emit('error', error as Error);
    }
  }

  public updateConfig(newConfig: Partial<EditorAgentConfig>): void {
    console.log('⚙️ Updating editor agent configuration');
    this.config = { ...this.config, ...newConfig };
    console.log('✅ Configuration updated');
  }

  public getState(): Readonly<EditorState> {
    return { ...this.state };
  }

  public getConfig(): Readonly<EditorAgentConfig> {
    return { ...this.config };
  }

  public getCurrentDocumentId(): string {
    return this.currentDocumentId;
  }

  public startNewDocument(): string {
    // Complete current content if active
    if (this.state.currentContent && !this.state.currentContent.isComplete) {
      this.completeCurrentContent();
    }
    
    // Generate new document ID
    this.currentDocumentId = `editor-${Date.now()}`;
    console.log(`📄 Started new document: ${this.currentDocumentId}`);
    this.emit('document:new', this.currentDocumentId);
    
    return this.currentDocumentId;
  }

  public clearQueue(): void {
    console.log('🗑️ Clearing content queue');
    this.state.contentQueue = [];
    this.emit('queue:updated', 0);
  }

  // Private Methods
  private async checkLLMAvailability(): Promise<void> {
    if (this.llmService instanceof ClaudeLLMService) {
      try {
        const available = await this.llmService.checkServerAvailability();
        if (!available) {
          console.log('⚠️ Claude not available for editor, switching to Mock LLM service');
          this.llmService = new MockLLMService(true, 200);
        } else {
          console.log('✅ Claude LLM service available for editor');
        }
      } catch (error) {
        console.error('❌ Error checking Claude availability for editor:', error);
        console.log('🎭 Switching to Mock LLM service for editor');
        this.llmService = new MockLLMService(true, 200);
      }
    }
  }

  private setupEventListeners(): void {
    this.on('content:started', (content: EditorContent) => {
      console.log(`✍️ Starting content generation: ${content.id}`);
    });
    
    this.on('content:completed', (content: EditorContent) => {
      console.log(`✍️ Completed content generation: ${content.id}`);
    });
    
    this.on('error', (error: Error) => {
      console.error('🚨 Editor agent error:', error);
    });
  }

  private updateContext(post: EnhancedRedditPost): void {
    this.state.context.push(post);
    
    // Maintain context window size
    if (this.state.context.length > this.config.contextWindow) {
      this.state.context.shift();
    }
  }

  private async processQueue(): Promise<void> {
    if (!this.state.isActive || this.state.contentQueue.length === 0) {
      return;
    }

    // If we're currently generating content, wait
    if (this.state.currentContent && !this.state.currentContent.isComplete) {
      return;
    }

    // Start new content generation from queue
    const posts = this.state.contentQueue.splice(0, 3); // Take up to 3 posts for context
    await this.generateContentFromPosts(posts);
  }

  private async generateContentFromPosts(posts: EnhancedRedditPost[]): Promise<void> {
    try {
      const contentId = `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const topics = this.extractTopics(posts);
      
      const editorContent: EditorContent = {
        id: contentId,
        documentId: this.currentDocumentId,
        title: this.generateTitle(posts),
        content: '',
        isComplete: false,
        wordCount: 0,
        timestamp: new Date(),
        sourcePosts: posts.map(p => p.id),
        metadata: {
          style: this.config.contentStyle,
          topics,
          sentiment: this.analyzeSentiment(posts),
          quality: this.calculateQuality(posts),
        },
      };

      this.state.currentContent = editorContent;
      this.emit('content:started', editorContent);
      console.log(`✍️ Starting content generation: ${contentId}`);

      // Generate content using LLM streaming
      await this.startContentStreaming(editorContent, posts);

    } catch (error) {
      console.error('❌ Error generating content from posts:', error);
      this.emit('error', error as Error);
    }
  }

  private async startContentStreaming(content: EditorContent, posts: EnhancedRedditPost[]): Promise<void> {
    const prompt = this.buildContentPrompt(posts);
    let currentText = '';
    let wordCount = 0;
    
    try {
      await this.llmService.generateStream(
        prompt,
        {
          temperature: 0.7,
          maxTokens: this.config.maxWordsPerSession * 1.5, // Rough token estimate
        },
        // onChunk callback
        (chunk: string) => {
          currentText += chunk;
          wordCount = currentText.trim().split(/\s+/).length;
          
          // Update current content
          if (this.state.currentContent && this.state.currentContent.id === content.id) {
            this.state.currentContent.content = currentText;
            this.state.currentContent.wordCount = wordCount;
          }
          
          // Emit streaming update
          this.emit('content:streaming', {
            contentId: content.id,
            documentId: this.currentDocumentId,
            currentText,
            wordCount,
          });
        },
        // onComplete callback
        (fullText: string) => {
          this.completeContent(content, fullText);
        },
        // onError callback
        (error: Error) => {
          console.error(`❌ Content streaming failed for ${content.id}:`, error);
          this.emit('content:error', content.id, error);
          this.state.currentContent = null;
        }
      );
      
    } catch (error) {
      console.error(`❌ Error starting content streaming for ${content.id}:`, error);
      this.emit('content:error', content.id, error as Error);
      this.state.currentContent = null;
    }
  }

  private async completeContent(content: EditorContent, fullText: string): Promise<void> {
    const finalWordCount = fullText.trim().split(/\s+/).length;
    
    if (this.state.currentContent && this.state.currentContent.id === content.id) {
      this.state.currentContent.content = fullText;
      this.state.currentContent.wordCount = finalWordCount;
      this.state.currentContent.isComplete = true;
    }

    // Update stats
    this.state.stats.totalWords += finalWordCount;
    this.state.stats.sessionsCompleted++;
    this.state.stats.averageWordsPerSession = 
      Math.round(this.state.stats.totalWords / this.state.stats.sessionsCompleted);

    console.log(`✅ Content generation completed: ${content.id} (${finalWordCount} words)`);

    // Save to database
    try {
      await convex.mutation(api.redditFeed.updateEditorDocument, {
        document_id: content.documentId,
        title: content.title,
        content_text: fullText,
        generated_by_agent: true,
        source_posts: content.sourcePosts,
        generation_metadata: JSON.stringify({
          contentId: content.id,
          style: content.metadata.style,
          topics: content.metadata.topics,
          sentiment: content.metadata.sentiment,
          quality: content.metadata.quality,
          wordCount: finalWordCount,
          timestamp: content.timestamp.toISOString(),
        }),
      });
      console.log(`💾 Saved editor document: ${content.documentId}`);
    } catch (error) {
      console.error(`❌ Failed to save editor document: ${content.documentId}`, error);
    }

    console.log(`📝🚨 EDITOR SERVICE: Emitting content:completed event for ${content.id}, text length: ${fullText.length}`);
    console.log(`📝🚨 EDITOR SERVICE: Content preview:`, fullText.substring(0, 100) + '...');
    this.emit('content:completed', content.id, fullText);
    
    // Clear current content after a brief pause
    setTimeout(() => {
      this.state.currentContent = null;
      this.processQueue(); // Process next items in queue
    }, this.config.pauseBetweenSections);
  }

  private completeCurrentContent(): void {
    if (this.state.currentContent && !this.state.currentContent.isComplete) {
      this.state.currentContent.isComplete = true;
      console.log(`📝🚨 EDITOR SERVICE (completeCurrentContent): Emitting content:completed for ${this.state.currentContent.id}, content length: ${this.state.currentContent.content.length}`);
      this.emit('content:completed', this.state.currentContent.id, this.state.currentContent.content);
    }
  }

  private buildContentPrompt(posts: EnhancedRedditPost[]): string {
    const contextSummary = this.summarizeContext();
    const topics = this.extractTopics(posts);
    
    const postsContent = posts.map((post, index) => `
Post ${index + 1}:
Title: ${post.title}
Subreddit: r/${post.subreddit}
Content: ${post.selftext && post.selftext.trim() ? post.selftext.trim() : '[Title-only post - expand on the title topic]'}
Engagement: ${post.score} upvotes, ${post.num_comments} comments
URL: ${post.url || 'N/A'}
---`).join('\n');

    return `You are a professional content writer creating a comprehensive ${this.config.contentStyle} piece. 

TASK: Write a detailed, engaging ${this.config.contentStyle} of approximately ${this.config.maxWordsPerSession} words based on the Reddit posts below.

STYLE GUIDELINES:
- Professional ${this.config.contentStyle} writing that's engaging and informative
- Well-structured with clear paragraphs and flow
- Include relevant context and background information
- Focus on the most newsworthy and interesting aspects
- Synthesize information from multiple sources into a cohesive narrative
- Add expert analysis and broader implications where relevant

TOPICS TO COVER: ${topics.join(', ')}

${contextSummary !== "No previous context" ? `CONTEXT FROM RECENT COVERAGE: ${contextSummary}` : ""}

SOURCE MATERIAL:
${postsContent}

IMPORTANT INSTRUCTIONS:
- Write a FULL ${this.config.contentStyle} piece, not just a summary
- If a post only has a title, expand on that topic with relevant background and analysis
- Connect the dots between different posts when relevant
- Add context that would help readers understand the significance
- Write in a flowing, continuous style suitable for display in an editor
- Do NOT mention Reddit, usernames, or that this is from social media
- Aim for exactly ${this.config.maxWordsPerSession} words

Begin writing the ${this.config.contentStyle} now:`.trim();
  }

  private summarizeContext(): string {
    if (this.state.context.length === 0) return "No previous context";
    
    const recentPosts = this.state.context.slice(-3);
    const topics = recentPosts
      .map(post => post.subreddit)
      .filter((topic, index, self) => self.indexOf(topic) === index)
      .map(subreddit => `r/${subreddit}`)
      .join(', ');
    
    return `Recent topics from: ${topics}`;
  }

  private extractTopics(posts: EnhancedRedditPost[]): string[] {
    const topics = new Set<string>();
    
    posts.forEach(post => {
      topics.add(post.subreddit);
      
      // Extract keywords from title
      const titleWords = post.title.toLowerCase().split(/\s+/)
        .filter(word => word.length > 4 && !['the', 'and', 'for', 'with', 'this', 'that'].includes(word));
      
      titleWords.slice(0, 2).forEach(word => topics.add(word));
    });
    
    return Array.from(topics).slice(0, 5);
  }

  private generateTitle(posts: EnhancedRedditPost[]): string {
    const mainTopic = posts[0]?.subreddit || 'News';
    return `Editor Content - ${mainTopic} - ${new Date().toLocaleString()}`;
  }

  private analyzeSentiment(posts: EnhancedRedditPost[]): string {
    // Simple sentiment analysis based on score
    const avgScore = posts.reduce((sum, post) => sum + post.score, 0) / posts.length;
    
    if (avgScore > 1000) return 'positive';
    if (avgScore < 100) return 'neutral';
    return 'mixed';
  }

  private calculateQuality(posts: EnhancedRedditPost[]): number {
    const avgScore = posts.reduce((sum, post) => sum + post.score, 0) / posts.length;
    const avgComments = posts.reduce((sum, post) => sum + post.num_comments, 0) / posts.length;
    
    // Quality score based on engagement
    return Math.min(1.0, (avgScore + avgComments * 2) / 1000);
  }

  private updateStats(): void {
    if (this.startTime > 0) {
      this.state.stats.uptime = Math.floor((Date.now() - this.startTime) / 1000);
    }
  }
}
