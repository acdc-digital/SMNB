import { api } from '@/convex/_generated/api';

export interface TokenCountRequest {
  model: string;
  system?: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string | Array<any>;
  }>;
  tools?: Array<any>;
  thinking?: {
    type: 'enabled';
    budget_tokens: number;
  };
}

export interface TokenCountResponse {
  input_tokens: number;
}

export interface TokenUsageMetrics {
  requestId: string;
  timestamp: Date;
  model: string;
  action: 'generate' | 'stream' | 'analyze' | 'test';
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  requestType: 'host' | 'producer' | 'editor';
  duration?: number; // milliseconds
  success: boolean;
  error?: string;
}

export interface TokenUsageStats {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
  averageTokensPerRequest: number;
  requestsByType: Record<string, number>;
  tokensByModel: Record<string, number>;
  hourlyUsage: Array<{ hour: string; tokens: number; cost: number }>;
}

export interface ModelPricing {
  [modelName: string]: {
    inputTokensPerDollar: number;
    outputTokensPerDollar: number;
    description: string;
  };
}

// Current Anthropic model pricing (as of 2024)
export const ANTHROPIC_PRICING: ModelPricing = {
  'claude-3-5-sonnet-20241022': {
    inputTokensPerDollar: 333333, // $3 per million input tokens
    outputTokensPerDollar: 66667, // $15 per million output tokens
    description: 'Claude 3.5 Sonnet (Latest)'
  },
  'claude-3-5-haiku-20241022': {
    inputTokensPerDollar: 1000000, // $1 per million input tokens
    outputTokensPerDollar: 200000, // $5 per million output tokens
    description: 'Claude 3.5 Haiku (Latest)'
  },
  'claude-3-opus-20240229': {
    inputTokensPerDollar: 66667, // $15 per million input tokens
    outputTokensPerDollar: 13333, // $75 per million output tokens
    description: 'Claude 3 Opus'
  }
};

export class TokenCountingService {
  private usageHistory: TokenUsageMetrics[] = [];
  private apiEndpoint: string;
  private convexClient: any;

  constructor(apiEndpoint: string = '/api/claude', convexClient?: any) {
    this.apiEndpoint = apiEndpoint;
    this.convexClient = convexClient;
    console.log('🔢 Token Counting Service initialized');
  }

  /**
   * Count tokens for a request before sending to Claude
   */
  async countInputTokens(request: TokenCountRequest): Promise<number> {
    try {
      console.log(`🔢 Counting input tokens for ${request.model}...`);
      
      const response = await fetch(`${this.apiEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'count-tokens',
          model: request.model,
          system: request.system,
          messages: request.messages,
          tools: request.tools,
          thinking: request.thinking
        })
      });

      if (!response.ok) {
        throw new Error(`Token counting failed: ${response.status}`);
      }

      const data: TokenCountResponse = await response.json();
      console.log(`🔢 Input tokens counted: ${data.input_tokens}`);
      
      return data.input_tokens;
    } catch (error) {
      console.error('❌ Error counting input tokens:', error);
      return this.estimateTokens(this.extractTextFromRequest(request));
    }
  }

  /**
   * Estimate output tokens from response text
   */
  estimateOutputTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate cost for token usage
   */
  calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing = ANTHROPIC_PRICING[model];
    if (!pricing) {
      console.warn(`⚠️ No pricing data for model: ${model}`);
      return 0;
    }

    const inputCost = inputTokens / pricing.inputTokensPerDollar;
    const outputCost = outputTokens / pricing.outputTokensPerDollar;
    
    return inputCost + outputCost;
  }

  /**
   * Record token usage for a completed request
   */
  recordUsage(metrics: Omit<TokenUsageMetrics, 'timestamp' | 'totalTokens' | 'estimatedCost'>): TokenUsageMetrics {
    const completeMetrics: TokenUsageMetrics = {
      ...metrics,
      timestamp: new Date(),
      totalTokens: metrics.inputTokens + metrics.outputTokens,
      estimatedCost: this.calculateCost(metrics.model, metrics.inputTokens, metrics.outputTokens)
    };

    this.usageHistory.push(completeMetrics);
    
    // Keep only last 1000 records in memory
    if (this.usageHistory.length > 1000) {
      this.usageHistory = this.usageHistory.slice(-1000);
    }

    // Store in Convex if client is available
    if (this.convexClient) {
      this.storeInConvex(completeMetrics).catch(error => {
        console.warn('⚠️ Failed to store token usage in Convex:', error);
      });
    }

    console.log(`💰 Token usage recorded: ${completeMetrics.totalTokens} tokens, $${completeMetrics.estimatedCost.toFixed(4)}`);
    
    return completeMetrics;
  }

  /**
   * Store token usage in Convex database
   */
  private async storeInConvex(metrics: TokenUsageMetrics): Promise<void> {
    if (!this.convexClient) return;

    try {
      await this.convexClient.mutation(api.tokenUsage.recordTokenUsage, {
        request_id: metrics.requestId,
        timestamp: metrics.timestamp.getTime(),
        model: metrics.model,
        action: metrics.action,
        input_tokens: metrics.inputTokens,
        output_tokens: metrics.outputTokens,
        total_tokens: metrics.totalTokens,
        estimated_cost: metrics.estimatedCost,
        request_type: metrics.requestType,
        duration: metrics.duration,
        success: metrics.success,
        error_message: metrics.error,
      });
      
      console.log('📊 Token usage stored in Convex database');
    } catch (error) {
      console.error('❌ Failed to store token usage in Convex:', error);
    }
  }

  /**
   * Set Convex client for database persistence
   */
  setConvexClient(client: any): void {
    this.convexClient = client;
    console.log('📊 Convex client connected to token counting service');
  }

  /**
   * Get comprehensive usage statistics
   */
  getUsageStats(): TokenUsageStats {
    if (this.usageHistory.length === 0) {
      return {
        totalRequests: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalTokens: 0,
        totalCost: 0,
        averageTokensPerRequest: 0,
        requestsByType: {},
        tokensByModel: {},
        hourlyUsage: []
      };
    }

    const stats: TokenUsageStats = {
      totalRequests: this.usageHistory.length,
      totalInputTokens: this.usageHistory.reduce((sum, m) => sum + m.inputTokens, 0),
      totalOutputTokens: this.usageHistory.reduce((sum, m) => sum + m.outputTokens, 0),
      totalTokens: this.usageHistory.reduce((sum, m) => sum + m.totalTokens, 0),
      totalCost: this.usageHistory.reduce((sum, m) => sum + m.estimatedCost, 0),
      averageTokensPerRequest: 0,
      requestsByType: {},
      tokensByModel: {},
      hourlyUsage: []
    };

    stats.averageTokensPerRequest = stats.totalTokens / stats.totalRequests;

    // Count by request type
    this.usageHistory.forEach(m => {
      stats.requestsByType[m.requestType] = (stats.requestsByType[m.requestType] || 0) + 1;
    });

    // Count by model
    this.usageHistory.forEach(m => {
      stats.tokensByModel[m.model] = (stats.tokensByModel[m.model] || 0) + m.totalTokens;
    });

    // Generate hourly usage for last 24 hours
    stats.hourlyUsage = this.generateHourlyUsage();

    return stats;
  }

  /**
   * Get usage for a specific time period
   */
  getUsageByTimeRange(startDate: Date, endDate: Date): TokenUsageMetrics[] {
    return this.usageHistory.filter(m => 
      m.timestamp >= startDate && m.timestamp <= endDate
    );
  }

  /**
   * Get usage by request type
   */
  getUsageByType(requestType: string): TokenUsageMetrics[] {
    return this.usageHistory.filter(m => m.requestType === requestType);
  }

  /**
   * Get current session statistics
   */
  getCurrentSessionStats(): {
    duration: number;
    requests: number;
    tokens: number;
    cost: number;
    tokensPerMinute: number;
  } {
    if (this.usageHistory.length === 0) {
      return { duration: 0, requests: 0, tokens: 0, cost: 0, tokensPerMinute: 0 };
    }

    const now = new Date();
    const sessionStart = this.usageHistory[0].timestamp;
    const duration = now.getTime() - sessionStart.getTime();
    const durationMinutes = duration / (1000 * 60);

    const stats = this.getUsageStats();

    return {
      duration,
      requests: stats.totalRequests,
      tokens: stats.totalTokens,
      cost: stats.totalCost,
      tokensPerMinute: durationMinutes > 0 ? stats.totalTokens / durationMinutes : 0
    };
  }

  /**
   * Export usage data for analysis
   */
  exportUsageData(): string {
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      totalRecords: this.usageHistory.length,
      summary: this.getUsageStats(),
      detailedUsage: this.usageHistory
    }, null, 2);
  }

  /**
   * Clear usage history
   */
  clearHistory(): void {
    this.usageHistory = [];
    console.log('🗑️ Token usage history cleared');
  }

  /**
   * Estimate tokens from text (public method)
   */
  estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  // Private helper methods
  private extractTextFromRequest(request: TokenCountRequest): string {
    let text = request.system || '';
    
    request.messages.forEach(message => {
      if (typeof message.content === 'string') {
        text += ' ' + message.content;
      } else if (Array.isArray(message.content)) {
        message.content.forEach(block => {
          if (block.type === 'text') {
            text += ' ' + block.text;
          }
        });
      }
    });

    return text;
  }

  private generateHourlyUsage(): Array<{ hour: string; tokens: number; cost: number }> {
    const hourlyData: Record<string, { tokens: number; cost: number }> = {};
    const now = new Date();
    
    // Initialize last 24 hours
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourKey = hour.getHours().toString().padStart(2, '0') + ':00';
      hourlyData[hourKey] = { tokens: 0, cost: 0 };
    }

    // Aggregate usage by hour
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    this.usageHistory
      .filter(m => m.timestamp >= last24Hours)
      .forEach(m => {
        const hourKey = m.timestamp.getHours().toString().padStart(2, '0') + ':00';
        if (hourlyData[hourKey]) {
          hourlyData[hourKey].tokens += m.totalTokens;
          hourlyData[hourKey].cost += m.estimatedCost;
        }
      });

    return Object.entries(hourlyData).map(([hour, data]) => ({
      hour,
      tokens: data.tokens,
      cost: data.cost
    }));
  }
}

// Singleton instance
export const tokenCountingService = new TokenCountingService();