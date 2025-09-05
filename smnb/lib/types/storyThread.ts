export interface StoryThread {
  /** Unique identifier for the thread */
  id: string;
  
  /** Main topic/subject of the thread */
  topic: string;
  
  /** Keywords and entities for matching related content */
  keywords: string[];
  entities: string[];
  
  /** Thread metadata */
  createdAt: number;
  lastUpdated: number;
  
  /** Significance and priority scoring */
  significanceScore: number; // 0-1 scale
  updateCount: number;
  
  /** Original post that started the thread */
  originalPost: {
    id: string;
    title: string;
    content: string;
    timestamp: number;
  };
  
  /** Updates to this thread */
  updates: StoryUpdate[];
  
  /** Thread status */
  status: 'active' | 'archived' | 'merged';
  
  /** Related thread IDs (for thread merging/splitting) */
  relatedThreads?: string[];
}

export interface StoryUpdate {
  /** Unique update identifier */
  id: string;
  
  /** Thread this update belongs to */
  threadId: string;
  
  /** Update metadata */
  timestamp: number;
  updateType: 'new_development' | 'clarification' | 'correction' | 'follow_up';
  
  /** Source post information */
  sourcePost: {
    id: string;
    title: string;
    content: string;
    subreddit: string;
  };
  
  /** Update content */
  summary: string;
  significance: number; // 0-1 scale
  
  /** Changes from previous version */
  changes: {
    added?: string[];
    modified?: string[];
    corrected?: string[];
  };
  
  /** Context provided by Producer */
  producerContext?: {
    relevanceScore: number;
    contextualInfo: string[];
    relatedEvents: string[];
  };
}

export interface ThreadDetectionCriteria {
  /** Minimum similarity threshold for topic matching */
  topicSimilarityThreshold: number;
  
  /** Keywords overlap threshold */
  keywordOverlapThreshold: number;
  
  /** Entity overlap threshold */
  entityOverlapThreshold: number;
  
  /** Maximum time window for updates (hours) */
  maxUpdateWindowHours: number;
  
  /** Minimum significance score to trigger updates */
  minSignificanceForUpdate: number;
}

export interface ThreadMatchResult {
  /** Whether a match was found */
  isMatch: boolean;
  
  /** Matched thread ID */
  threadId?: string;
  
  /** Confidence score of the match */
  confidence: number;
  
  /** Reasons for the match */
  matchReasons: string[];
  
  /** Suggested update type */
  suggestedUpdateType?: StoryUpdate['updateType'];
}

export interface ThreadManagementConfig {
  /** Detection criteria */
  detection: ThreadDetectionCriteria;
  
  /** Maximum number of active threads */
  maxActiveThreads: number;
  
  /** Thread archival settings */
  archival: {
    maxAgeHours: number;
    minSignificanceToKeep: number;
  };
  
  /** Update processing settings */
  updates: {
    maxUpdatesPerThread: number;
    cooldownMinutes: number; // Minimum time between updates
  };
}

// Default configuration
export const DEFAULT_THREAD_CONFIG: ThreadManagementConfig = {
  detection: {
    topicSimilarityThreshold: 0.7,
    keywordOverlapThreshold: 0.4,
    entityOverlapThreshold: 0.3,
    maxUpdateWindowHours: 24,
    minSignificanceForUpdate: 0.5
  },
  maxActiveThreads: 50,
  archival: {
    maxAgeHours: 72,
    minSignificanceToKeep: 0.6
  },
  updates: {
    maxUpdatesPerThread: 10,
    cooldownMinutes: 15
  }
};

// Story thread utilities
export class StoryThreadUtils {
  /**
   * Extract keywords and entities from text content
   */
  static extractKeywordsAndEntities(text: string): { keywords: string[], entities: string[] } {
    // Simple implementation - can be enhanced with NLP
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    // Filter common words and extract meaningful keywords
    const stopWords = new Set(['that', 'this', 'with', 'from', 'they', 'have', 'been', 'said', 'says', 'will', 'would', 'could', 'should']);
    const keywords = words.filter(word => !stopWords.has(word));
    
    // Simple entity detection (capitalized words, organizations, etc.)
    const entities = text.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
    
    return {
      keywords: [...new Set(keywords)].slice(0, 10), // Top 10 unique keywords
      entities: [...new Set(entities)].slice(0, 5)   // Top 5 unique entities
    };
  }
  
  /**
   * Calculate similarity between two sets of keywords/entities
   */
  static calculateSimilarity(set1: string[], set2: string[]): number {
    if (set1.length === 0 && set2.length === 0) return 1;
    if (set1.length === 0 || set2.length === 0) return 0;
    
    const intersection = set1.filter(item => set2.includes(item));
    const union = [...new Set([...set1, ...set2])];
    
    return intersection.length / union.length;
  }
  
  /**
   * Generate a thread topic from keywords and entities
   */
  static generateThreadTopic(keywords: string[], entities: string[]): string {
    const topKeywords = keywords.slice(0, 3);
    const topEntities = entities.slice(0, 2);
    
    const combined = [...topEntities, ...topKeywords];
    return combined.join(' • ');
  }
  
  /**
   * Calculate thread significance based on various factors
   */
  static calculateSignificance(
    engagement: number,
    recency: number,
    entityImportance: number,
    updateCount: number
  ): number {
    const engagementWeight = 0.4;
    const recencyWeight = 0.3;
    const entityWeight = 0.2;
    const updateWeight = 0.1;
    
    const baseScore = 
      (engagement * engagementWeight) +
      (recency * recencyWeight) +
      (entityImportance * entityWeight);
    
    // Boost significance for threads with multiple updates
    const updateBoost = Math.min(updateCount * 0.1, 0.3);
    
    return Math.min(baseScore + updateBoost, 1.0);
  }
}