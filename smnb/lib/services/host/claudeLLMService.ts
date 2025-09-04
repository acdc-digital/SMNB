// CLAUDE LLM SERVICE
// /Users/matthewsimon/Projects/SMNB/smnb/lib/services/host/claudeLLMService.ts

/**
 * Claude LLM Service (Browser-Safe)
 * 
 * Client-side service that communicates with our Claude API route
 * This keeps API keys secure on the server while providing Claude functionality
 */

import { LLMAnalysis } from '@/lib/types/hostAgent';

export class ClaudeLLMService {
  private isEnabled: boolean;
  private apiEndpoint: string;

  constructor(apiEndpoint: string = '/api/claude') {
    this.apiEndpoint = apiEndpoint;
    this.isEnabled = true; // We'll check server availability when needed
    console.log('✅ Claude LLM service initialized (client-side)');
  }

  async generate(
    prompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    }
  ): Promise<string> {
    try {
      console.log('🤖 Generating narration with Claude...');
      
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate',
          prompt,
          options
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.text) {
        console.log('✅ Generated narration successfully');
        return data.text;
      } else {
        throw new Error('Invalid response format');
      }

    } catch (error) {
      console.error('❌ Claude API error:', error);
      return this.getFallbackNarration(prompt);
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
      
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'stream',
          prompt,
          options
        })
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
      const err = error instanceof Error ? error : new Error('Unknown error');
      onError?.(err);
      // Fall back to regular generation
      return await this.generate(prompt, options);
    }
  }

  async analyzeContent(content: string): Promise<LLMAnalysis> {
    try {
      console.log('🧠 Analyzing content with Claude...');

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'analyze',
          prompt: content
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Claude analyze error:', errorData.error);
        return this.getSimpleAnalysis(content);
      }

      const data = await response.json();
      
      if (data.success && data.analysis) {
        console.log('✅ Content analysis completed');
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
        body: JSON.stringify({
          action: 'test'
        })
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
        body: JSON.stringify({
          action: 'test'
        })
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
