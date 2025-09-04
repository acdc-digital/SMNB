// HOST AGENT TYPES
// /Users/matthewsimon/Projects/SMNB/smnb/lib/types/hostAgent.ts

/**
 * Host Agent Type Definitions
 * 
 * Core types for the news host agent system that provides
 * intelligent narration of live feed content with waterfall display
 */

export interface NewsItem {
  id: string;
  content: string;
  author: string;
  timestamp: Date;
  platform: 'twitter' | 'facebook' | 'instagram' | 'linkedin' | 'reddit';
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  mediaUrls?: string[];
  hashtags?: string[];
  mentions?: string[];
  url?: string;
  subreddit?: string; // For Reddit posts
  title?: string; // For Reddit posts
}

export interface HostNarration {
  id: string;
  newsItemId: string;
  narrative: string;
  tone: 'breaking' | 'developing' | 'analysis' | 'opinion' | 'human-interest';
  priority: 'high' | 'medium' | 'low';
  timestamp: Date;
  duration: number; // estimated reading time in seconds
  segments: string[]; // Split narrative into segments for waterfall effect
  metadata?: {
    sentiment?: 'positive' | 'negative' | 'neutral';
    topics?: string[];
    summary?: string;
    originalItem?: NewsItem; // Store original item for queue processing
  };
}

export interface HostAgentConfig {
  personality: 'formal' | 'conversational' | 'analytical' | 'energetic';
  verbosity: 'concise' | 'detailed' | 'comprehensive';
  updateFrequency: number; // milliseconds between updates
  contextWindow: number; // number of previous items to consider for context
  waterfallSpeed: number; // characters per second for display
  enableMockMode?: boolean; // For development without LLM
}

export interface HostState {
  isActive: boolean;
  currentNarration: HostNarration | null;
  narrationQueue: HostNarration[];
  processedItems: Set<string>;
  context: NewsItem[];
  producerContext?: ProducerContextData[];
  stats: {
    itemsProcessed: number;
    totalNarrations: number;
    averageReadTime: number;
    queueLength: number;
    uptime: number; // seconds since started
  };
}

export interface ProducerContextData {
  postId: string;
  engagementMetrics?: {
    totalScore: number;
    comments: number;
    subredditDiversity: number;
  };
  relatedDiscussions?: Array<{
    subreddit: string;
    title: string;
    score: number;
  }>;
  trendData?: {
    isBreaking: boolean;
    isDeveloping: boolean;
    keywords: string[];
  };
  receivedAt: number;
}

export interface LLMAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  topics: string[];
  summary: string;
  urgency?: 'low' | 'medium' | 'high';
  relevance?: number; // 0-1 score
}

export interface HostAgentEvents {
  'host:started': () => void;
  'host:stopped': () => void;
  'narration:generated': (narration: HostNarration) => void;
  'narration:started': (narration: HostNarration) => void;
  'narration:completed': (narration: HostNarration) => void;
  'narration:segment': (segment: string, index: number) => void;
  'queue:updated': (queueLength: number) => void;
  'stats:updated': (stats: HostState['stats']) => void;
  'error': (error: Error) => void;
}

// Utility types for waterfall animation
export interface WaterfallSegment {
  id: string;
  text: string;
  opacity: number;
  index: number;
  isComplete: boolean;
}

export interface WaterfallAnimation {
  segments: WaterfallSegment[];
  currentSegment: number;
  totalSegments: number;
  isAnimating: boolean;
  progress: number; // 0-100
}

// Configuration presets
export const HOST_PERSONALITIES = {
  formal: {
    systemPrompt: "You are a professional news anchor. Use formal language and maintain objectivity. Focus on facts and maintain a serious, authoritative tone.",
    style: "Professional and objective",
    temperature: 0.6
  },
  conversational: {
    systemPrompt: "You are a friendly news host. Use approachable language while remaining informative. Make complex topics accessible to general audiences.",
    style: "Friendly and accessible",
    temperature: 0.7
  },
  analytical: {
    systemPrompt: "You are an analytical news correspondent. Focus on data, trends, and deeper insights. Provide context and background for better understanding.",
    style: "Data-driven and insightful",
    temperature: 0.5
  },
  energetic: {
    systemPrompt: "You are an energetic news broadcaster. Use dynamic language and emphasize breaking developments. Create excitement around important stories.",
    style: "Dynamic and engaging",
    temperature: 0.8
  }
} as const;

export const VERBOSITY_LEVELS = {
  concise: {
    maxTokens: 100,
    targetLength: "1-2 sentences",
    description: "Brief and to the point"
  },
  detailed: {
    maxTokens: 200,
    targetLength: "2-4 sentences", 
    description: "Comprehensive coverage"
  },
  comprehensive: {
    maxTokens: 300,
    targetLength: "4-6 sentences",
    description: "Full analysis with context"
  }
} as const;

// Default configuration
export const DEFAULT_HOST_CONFIG: HostAgentConfig = {
  personality: 'conversational',
  verbosity: 'detailed',
  updateFrequency: 3000, // 3 seconds
  contextWindow: 5,
  waterfallSpeed: 15, // characters per second
  enableMockMode: true // Default to mock mode for development
};
