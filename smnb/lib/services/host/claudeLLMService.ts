// CLAUDE LLM SERVICE
// /Users/matthewsimon/Projects/SMNB/smnb/lib/services/host/claudeLLMService.ts

/**
 * Claude LLM Service (Browser-Safe)
 * 
 * Client-side service that communicates with our Claude API route
 * This keeps API keys secure on the server while providing Claude functionality
 * Now supports user-provided API keys from the API key store
 */

import { HostNarration } from '@/lib/types/hostAgent';
import { tokenCountingService, TokenUsageMetrics } from '../tokenCountingService';
import { useApiKeyStore } from '@/lib/stores/apiKeyStore';

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface LLMAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  topics: string[];
  summary: string;
  urgency: 'low' | 'medium' | 'high';
  relevance: number;
}

export class ClaudeLLMService {
  private isEnabled: boolean;
  private apiEndpoint: string;

  constructor(apiEndpoint: string = '/api/claude') {
    this.apiEndpoint = apiEndpoint;
    this.isEnabled = true; // We'll check server availability when needed
    console.log('✅ Claude LLM service initialized (client-side)');
  }

  // Helper method to get API key from store
  private getApiKey(): string | null {
    const store = useApiKeyStore.getState();
    // Only return user API key if the toggle is enabled AND we have a valid key
    const userKey = store.isUserApiKeyEnabled() && store.hasValidKey() ? store.getValidApiKey() : null;
    
    if (userKey) {
      console.log('🔑 Using USER-PROVIDED API key:', userKey.slice(0, 12) + '...');
    } else {
      console.log('🔑 Using ENVIRONMENT API key (user toggle:', store.isUserApiKeyEnabled() ? 'ON but invalid' : 'OFF)');
    }
    
    return userKey;
  }

  // Helper method to prepare request body with API key
  private prepareRequestBody(baseBody: any): any {
    const apiKey = this.getApiKey();
    return apiKey ? { ...baseBody, apiKey } : baseBody;
  }

  async generate(prompt: string, options: LLMOptions = {}): Promise<string> {
    try {
      console.log('🤖 Generating narration with Claude...');
      const startTime = Date.now();
      const requestId = `generate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const model = 'claude-3-5-haiku-20241022';
      
      const systemPrompt = options.systemPrompt || this.getDefaultSystemPrompt();
      
      // Count input tokens
      const inputTokens = await tokenCountingService.countInputTokens({
        model,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }]
      });

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.prepareRequestBody({
          action: 'generate',
          prompt,
          options: {
            systemPrompt,
            temperature: options.temperature || 0.7,
            maxTokens: options.maxTokens || 200,
          }
        }))
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const duration = Date.now() - startTime;
      
      if (data.success) {
        // Count output tokens and record usage
        const outputTokens = tokenCountingService.estimateOutputTokens(data.text);
        
        tokenCountingService.recordUsage({
          requestId,
          model,
          action: 'generate',
          inputTokens,
          outputTokens,
          requestType: 'host',
          duration,
          success: true
        });
        
        console.log(`✅ Generated narration: ${data.text.substring(0, 50)}... (${inputTokens}→${outputTokens} tokens, ${duration}ms)`);
        return data.text;
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (error) {
      console.error('❌ Claude API error:', error);
      
      // Record failed request
      tokenCountingService.recordUsage({
        requestId: `failed-${Date.now()}`,
        model: 'claude-3-5-haiku-20241022',
        action: 'generate',
        inputTokens: 0,
        outputTokens: 0,
        requestType: 'host',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }

  async generateStream(
    prompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    },
    onChunk?: (chunk: string) => void,
    onComplete?: (fullText: string) => void,
    onError?: (error: Error) => void
  ): Promise<string> {
    try {
      console.log('🤖 Starting streaming narration with Claude...');
      const startTime = Date.now();
      const requestId = `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const model = 'claude-3-5-haiku-20241022';
      
      const systemPrompt = options?.systemPrompt || this.getDefaultSystemPrompt();
      
      // Count input tokens
      const inputTokens = await tokenCountingService.countInputTokens({
        model,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }]
      });
      
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.prepareRequestBody({
          action: 'stream',
          prompt,
          options: {
            ...options,
            systemPrompt
          }
        }))
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader');
      }

      let fullText = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'chunk' && data.text) {
                fullText += data.text;
                onChunk?.(data.text);
              } else if (data.type === 'complete') {
                console.log('✅ Streaming narration completed');
                
                // Record token usage for completed stream
                const outputTokens = tokenCountingService.estimateOutputTokens(fullText);
                const duration = Date.now() - startTime;
                
                tokenCountingService.recordUsage({
                  requestId,
                  model,
                  action: 'stream',
                  inputTokens,
                  outputTokens,
                  requestType: 'host',
                  duration,
                  success: true
                });
                
                console.log(`🎯 Stream completed: ${fullText.length} chars (${inputTokens}→${outputTokens} tokens, ${duration}ms)`);
                onComplete?.(fullText);
                return fullText;
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      }

      return fullText;
      
    } catch (error) {
      console.error('❌ Claude streaming failed:', error);
      
      // Record failed streaming request
      tokenCountingService.recordUsage({
        requestId: `stream-failed-${Date.now()}`,
        model: 'claude-3-5-haiku-20241022',
        action: 'stream',
        inputTokens: 0, // Will count if available
        outputTokens: 0,
        requestType: 'host',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      const err = error instanceof Error ? error : new Error('Unknown error');
      onError?.(err);
      // Fall back to regular generation
      return await this.generate(prompt, options);
    }
  }

  async analyzeContent(content: string): Promise<LLMAnalysis> {
    try {
      console.log('🧠 Analyzing content with Claude...');
      const startTime = Date.now();
      const requestId = `analyze-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const model = 'claude-3-5-haiku-20241022';
      
      // Count input tokens (rough estimate for analysis prompt)
      const inputTokens = tokenCountingService.estimateTokens(content + ' Analysis request');

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.prepareRequestBody({
          action: 'analyze',
          prompt: content
        }))
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Claude analyze error:', errorData.error);
        
        // Record failed request
        tokenCountingService.recordUsage({
          requestId,
          model,
          action: 'analyze',
          inputTokens,
          outputTokens: 0,
          requestType: 'host',
          success: false,
          error: `HTTP ${response.status}`
        });
        
        return this.getSimpleAnalysis(content);
      }

      const data = await response.json();
      const duration = Date.now() - startTime;
      
      if (data.success && data.analysis) {
        // Record successful analysis
        const outputTokens = tokenCountingService.estimateOutputTokens(JSON.stringify(data.analysis));
        
        tokenCountingService.recordUsage({
          requestId,
          model,
          action: 'analyze',
          inputTokens,
          outputTokens,
          requestType: 'host',
          duration,
          success: true
        });
        
        console.log(`✅ Content analysis completed (${inputTokens}→${outputTokens} tokens, ${duration}ms)`);
        return data.analysis;
      } else {
        throw new Error('Invalid analysis response');
      }

    } catch (error) {
      console.error('❌ Claude analysis error:', error);
      return this.getSimpleAnalysis(content);
    }
  }

  // Utility methods
  public isReady(): boolean {
    return this.isEnabled;
  }

  public getModel(): string {
    return 'claude-3-5-haiku-20241022';
  }

  // Test the connection to our API endpoint
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing Claude API connection...');
      
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.prepareRequestBody({
          action: 'test'
        }))
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Connection test failed:', errorData.error);
        return false;
      }

      const data = await response.json();
      const success = data.success === true;
      
      if (success) {
        console.log('✅ Claude API connection test passed');
      } else {
        console.log('⚠️ Claude API connection test unclear');
      }
      
      return success;

    } catch (error) {
      console.error('❌ Claude API connection test failed:', error);
      return false;
    }
  }

  // Check if the server has Claude configured
  async checkServerAvailability(): Promise<boolean> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.prepareRequestBody({
          action: 'test'
        }))
      });

      if (response.status === 500) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error?.includes('not configured')) {
          this.isEnabled = false;
          return false;
        }
      }

      return response.ok;
    } catch (error) {
      console.error('Server availability check failed:', error);
      this.isEnabled = false;
      return false;
    }
  }

  // Private helper methods
  private getDefaultSystemPrompt(): string {
    return 'You are a professional news broadcaster generating engaging narrations.';
  }

  private getFallbackNarration(prompt: string): string {
    // Extract some content from the prompt for a basic narration
    const contentMatch = prompt.match(/Content: (.+?)(?:\n|Engagement|$)/i);
    const content = contentMatch ? contentMatch[1].substring(0, 100) : "latest news";
    
    const fallbacks = [
      `📰 News update: ${content}. This story is generating discussion across social media platforms.`,
      `🔍 Latest report: ${content}. We're monitoring this developing situation.`,
      `📢 Breaking coverage: ${content}. Stay tuned for further updates as this story unfolds.`
    ];
    
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  private getSimpleAnalysis(content: string): LLMAnalysis {
    // Simple keyword-based analysis as fallback
    const sentiment = this.getSimpleSentiment(content);
    const topics = this.getSimpleTopics(content);
    const summary = content.length > 80 
      ? `${content.substring(0, 77)}...`
      : content;
    
    return {
      sentiment,
      topics: topics.slice(0, 3),
      summary,
      urgency: content.toLowerCase().includes('breaking') ? 'high' : 'low',
      relevance: Math.min(content.length / 200, 1)
    };
  }

  private getSimpleSentiment(content: string): 'positive' | 'negative' | 'neutral' {
    const lowerContent = content.toLowerCase();
    const positiveWords = ['great', 'amazing', 'excellent', 'good', 'positive', 'success', 'breakthrough', 'achievement'];
    const negativeWords = ['bad', 'terrible', 'awful', 'negative', 'crisis', 'problem', 'fail', 'disaster', 'concern'];
    
    const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerContent.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private getSimpleTopics(content: string): string[] {
    const topics: string[] = [];
    const lowerContent = content.toLowerCase();
    
    const topicMappings = [
      { keywords: ['tech', 'ai', 'software', 'computer', 'digital', 'internet'], topic: 'Technology' },
      { keywords: ['politic', 'election', 'government', 'vote', 'law', 'policy'], topic: 'Politics' },
      { keywords: ['economy', 'business', 'market', 'finance', 'money', 'trade'], topic: 'Economy' },
      { keywords: ['health', 'medical', 'hospital', 'doctor', 'medicine', 'virus'], topic: 'Health' },
      { keywords: ['climate', 'environment', 'green', 'energy', 'renewable'], topic: 'Environment' },
      { keywords: ['sport', 'game', 'team', 'player', 'championship', 'league'], topic: 'Sports' },
      { keywords: ['movie', 'music', 'celebrity', 'entertainment', 'film', 'show'], topic: 'Entertainment' },
      { keywords: ['science', 'research', 'study', 'discovery', 'experiment'], topic: 'Science' }
    ];

    for (const mapping of topicMappings) {
      if (mapping.keywords.some(keyword => lowerContent.includes(keyword))) {
        topics.push(mapping.topic);
      }
    }

    return topics.length > 0 ? topics : ['General News'];
  }
}

export default ClaudeLLMService;
