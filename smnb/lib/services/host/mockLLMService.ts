/**
 * Mock LLM Service for Development
 * 
 * Provides realistic mock responses for testing the host agent
 * without requiring actual LLM API calls during development
 */

import { LLMAnalysis } from '@/lib/types/hostAgent';

interface EngagementData {
  likes: number;
  comments: number;
}

export class MockLLMService {
  private isEnabled: boolean;
  private delay: number;

  constructor(isEnabled = true, responseDelay = 500) {
    this.isEnabled = isEnabled;
    this.delay = responseDelay;
  }

  async generate(
    prompt: string, 
    options?: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    }
  ): Promise<string> {
    if (!this.isEnabled) {
      throw new Error('Mock LLM service is disabled');
    }

    // Simulate API delay
    await this.simulateDelay();

    // Extract key information from prompt to generate relevant response
    const isBreaking = prompt.toLowerCase().includes('breaking');
    const platform = this.extractPlatform(prompt);
    const engagement = this.extractEngagement(prompt);
    
    return this.generateMockNarration(prompt, {
      isBreaking,
      platform,
      engagement,
      temperature: options?.temperature || 0.7
    });
  }

  async analyzeContent(content: string): Promise<LLMAnalysis> {
    await this.simulateDelay();

    // Simple sentiment analysis based on keywords
    const sentiment = this.analyzeSentiment(content);
    const topics = this.extractTopics(content);
    const summary = this.generateSummary(content);
    const urgency = this.determineUrgency(content);
    const relevance = this.calculateRelevance(content);

    return {
      sentiment,
      topics,
      summary,
      urgency,
      relevance
    };
  }

  private async simulateDelay(): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, this.delay + Math.random() * 200);
    });
  }

  private generateMockNarration(
    prompt: string, 
    context: {
      isBreaking: boolean;
      platform: string;
      engagement: EngagementData;
      temperature: number;
    }
  ): string {
    const templates = {
      breaking: [
        "🚨 Breaking news alert: {content}. This developing story is gaining significant traction across social media platforms with over {engagement} interactions in the past hour.",
        "⚡ Major development: {content}. Early reports suggest this could have far-reaching implications as the story continues to unfold.",
        "🔥 Urgent update: {content}. Social media users are actively discussing this breaking story, with engagement numbers climbing rapidly."
      ],
      developing: [
        "📈 Developing story: {content}. The situation continues to evolve with new details emerging from multiple sources.",
        "🔍 Latest update on: {content}. Our monitoring systems show sustained interest and ongoing discussion across platforms.",
        "📊 Continuing coverage: {content}. Analysis indicates this story is resonating with audiences and gaining momentum."
      ],
      analysis: [
        "🧠 In-depth look: {content}. Let's break down what this means and examine the broader implications for our audience.",
        "📋 Analysis: {content}. The data suggests several key trends worth examining in greater detail.",
        "🎯 Deep dive: {content}. This story highlights important patterns we've been tracking in recent weeks."
      ],
      standard: [
        "📰 News update: {content}. This story is generating discussion with {engagement} interactions across social platforms.",
        "🗞️ Latest report: {content}. Early audience response indicates moderate interest in this developing situation.",
        "📢 Current story: {content}. Social media metrics show steady engagement as users share their perspectives."
      ]
    } as const;

    let category: keyof typeof templates = 'standard';
    if (context.isBreaking) {
      category = 'breaking';
    } else if (prompt.toLowerCase().includes('develop')) {
      category = 'developing';
    } else if (prompt.toLowerCase().includes('analysis')) {
      category = 'analysis';
    }

    const templateSet = templates[category];
    const template = templateSet[Math.floor(Math.random() * templateSet.length)];
    
    // Extract content snippet from prompt
    const contentMatch = prompt.match(/Content: (.+?)(?:\n|Engagement|$)/i);
    const content = contentMatch ? contentMatch[1].substring(0, 100) : "latest social media activity";
    
    const engagement = this.formatEngagement(context.engagement);
    
    return template
      .replace('{content}', content)
      .replace('{engagement}', engagement);
  }

  private extractPlatform(prompt: string): string {
    const platforms = ['reddit', 'twitter', 'facebook', 'instagram', 'linkedin'];
    for (const platform of platforms) {
      if (prompt.toLowerCase().includes(platform)) {
        return platform;
      }
    }
    return 'social media';
  }

  private extractEngagement(prompt: string): EngagementData {
    const likesMatch = prompt.match(/(\d+)\s+likes/i);
    const commentsMatch = prompt.match(/(\d+)\s+comments/i);
    
    return {
      likes: likesMatch ? parseInt(likesMatch[1]) : Math.floor(Math.random() * 1000),
      comments: commentsMatch ? parseInt(commentsMatch[1]) : Math.floor(Math.random() * 100)
    };
  }

  private formatEngagement(engagement: EngagementData): string {
    if (!engagement) return "moderate";
    
    const total = engagement.likes + engagement.comments;
    if (total > 10000) return "high";
    if (total > 1000) return "significant";
    return "moderate";
  }

  private analyzeSentiment(content: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['great', 'amazing', 'excellent', 'good', 'positive', 'success', 'win', 'breakthrough'];
    const negativeWords = ['bad', 'terrible', 'awful', 'negative', 'crisis', 'problem', 'fail', 'disaster'];
    
    const lowerContent = content.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerContent.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private extractTopics(content: string): string[] {
    // Simple topic extraction based on common patterns
    const topics: string[] = [];
    const topicPatterns = [
      /\b(technology|tech|AI|artificial intelligence)\b/i,
      /\b(politics|political|election|government)\b/i,
      /\b(economy|economic|finance|business)\b/i,
      /\b(health|medical|covid|pandemic)\b/i,
      /\b(climate|environment|green|sustainability)\b/i,
      /\b(sports|game|team|player)\b/i,
      /\b(entertainment|movie|music|celebrity)\b/i
    ];

    const topicNames = ['Technology', 'Politics', 'Economy', 'Health', 'Environment', 'Sports', 'Entertainment'];
    
    topicPatterns.forEach((pattern, index) => {
      if (pattern.test(content)) {
        topics.push(topicNames[index]);
      }
    });

    return topics.length > 0 ? topics.slice(0, 3) : ['General News'];
  }

  private generateSummary(content: string): string {
    // Generate a brief summary
    const sentences = content.split(/[.!?]+/);
    const firstSentence = sentences[0]?.trim();
    
    if (firstSentence && firstSentence.length > 20) {
      return firstSentence.length > 80 
        ? `${firstSentence.substring(0, 80)}...`
        : firstSentence;
    }
    
    return content.length > 80 
      ? `${content.substring(0, 80)}...`
      : content;
  }

  private determineUrgency(content: string): 'low' | 'medium' | 'high' {
    const urgentWords = ['breaking', 'urgent', 'critical', 'emergency', 'alert'];
    const lowerContent = content.toLowerCase();
    
    const urgentCount = urgentWords.filter(word => lowerContent.includes(word)).length;
    
    if (urgentCount >= 2) return 'high';
    if (urgentCount === 1) return 'medium';
    return 'low';
  }

  private calculateRelevance(content: string): number {
    // Simple relevance score based on content length and keywords
    const baseScore = Math.min(content.length / 200, 1); // Length factor
    const keywordBoost = this.extractTopics(content).length * 0.1;
    
    return Math.min(baseScore + keywordBoost, 1);
  }

  // Utility methods for testing different scenarios
  setDelay(milliseconds: number): void {
    this.delay = milliseconds;
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }

  // Generate specific types of responses for testing
  generateBreakingNews(): string {
    return "🚨 This is a breaking news alert with high priority coverage of developing events that require immediate attention from our audience.";
  }

  generateAnalysis(): string {
    return "📊 Our analysis reveals several key trends in this data, suggesting broader implications for the industry and stakeholders involved in this developing situation.";
  }

  generateHumanInterest(): string {
    return "❤️ This heartwarming story showcases the best of human nature, reminding us of the positive impact individuals can have in their communities during challenging times.";
  }
}

export default MockLLMService;
