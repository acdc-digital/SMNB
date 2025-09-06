// STORY UTILITIES
// /Users/matthewsimon/Projects/SMNB/smnb/lib/utils/storyUtils.ts

import { CompletedStory } from '@/lib/stores/livefeed/simpleLiveFeedStore';
import { 
  AlertTriangle, 
  TrendingUp, 
  Search, 
  MessageCircle, 
  Heart, 
  Newspaper,
  Flame,
  Zap,
  Pin,
  GitBranch,
  Bookmark
} from 'lucide-react';

/**
 * Story display utilities for consistent formatting across components
 */
export const StoryDisplayUtils = {
  /**
   * Get Lucide icon component for story tone
   */
  getToneIcon: (tone: CompletedStory['tone']) => {
    const iconMap = {
      'breaking': AlertTriangle,
      'developing': TrendingUp, 
      'analysis': Search,
      'opinion': MessageCircle,
      'human-interest': Heart
    } as const;
    return iconMap[tone] || Newspaper;
  },

  /**
   * Get Lucide icon component for story priority
   */
  getPriorityIcon: (priority: CompletedStory['priority']) => {
    const iconMap = {
      'high': Flame,
      'medium': Zap,
      'low': Pin
    } as const;
    return iconMap[priority] || Pin;
  },

  /**
   * Get Lucide icon component for thread indicator
   */
  getThreadIcon: () => GitBranch,

  /**
   * Get Lucide icon component for source indicator
   */
  getSourceIcon: () => Bookmark,

  /**
   * Format timestamp to relative time
   */
  formatTime: (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  },

  /**
   * Format reading duration
   */
  getReadingTime: (duration: number): string => {
    if (duration < 60) return `${duration}s read`;
    const minutes = Math.floor(duration / 60);
    return `${minutes}m read`;
  },

  /**
   * Get Tailwind classes for sentiment colors
   */
  getSentimentColor: (sentiment: CompletedStory['sentiment']): string => {
    const sentimentMap = {
      'positive': 'bg-green-400/20 text-green-300 border border-green-400/40',
      'negative': 'bg-red-400/20 text-red-300 border border-red-400/40',
      'neutral': 'bg-blue-400/20 text-blue-300 border border-blue-400/40'
    } as const;
    return sentimentMap[sentiment || 'neutral'];
  },

  /**
   * Get readable tone label
   */
  getToneLabel: (tone: CompletedStory['tone']): string => {
    const labelMap = {
      'breaking': 'Breaking News',
      'developing': 'Developing Story',
      'analysis': 'Analysis',
      'opinion': 'Opinion',
      'human-interest': 'Human Interest'
    } as const;
    return labelMap[tone] || tone;
  },

  /**
   * Get Tailwind classes for tone colors
   */
  getToneColor: (tone: CompletedStory['tone']): string => {
    const toneColorMap = {
      'breaking': 'text-red-400',
      'developing': 'text-orange-400', 
      'analysis': 'text-blue-400',
      'opinion': 'text-purple-400',
      'human-interest': 'text-green-400'
    } as const;
    return toneColorMap[tone] || 'text-muted-foreground';
  },

  /**
   * Get priority level description
   */
  getPriorityLabel: (priority: CompletedStory['priority']): string => {
    const labelMap = {
      'high': 'High Priority',
      'medium': 'Medium Priority', 
      'low': 'Low Priority'
    } as const;
    return labelMap[priority] || priority;
  }
};

/**
 * Design system tokens for consistent story card styling
 */
export const StoryCardTokens = {
  // Base card styles
  base: "border rounded-sm p-3 space-y-2 bg-card text-card-foreground transition-all duration-200 hover:shadow-md",
  
  // Card states
  highlighted: "border-blue-500 bg-blue-500/5 shadow-sm ring-1 ring-blue-500/20",
  normal: "border-border/50 hover:border-border hover:bg-card/50",
  
  // Animation classes
  animation: "animate-slide-in-top",
  
  // Layout sections
  header: "flex items-center gap-2 flex-wrap",
  content: "text-sm text-card-foreground line-clamp-3 leading-relaxed",
  metadata: "flex justify-between items-center text-xs text-muted-foreground gap-2",
  actions: "flex gap-1 pt-2 border-t border-border/30",
  
  // Content styling
  toneLabel: "text-xs text-muted-foreground font-medium uppercase tracking-wide",
  topicTag: "px-1.5 py-0.5 rounded-full text-xs bg-cyan-400/20 text-cyan-300 border border-cyan-400/40",
  
  // Thread indicators
  threadUpdate: "px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-400/20 text-yellow-300 border border-yellow-400/40",
  threadNew: "px-1.5 py-0.5 rounded-full text-xs font-medium bg-violet-400/20 text-violet-300 border border-violet-400/40",
  threadIcon: "text-xs text-muted-foreground",
  
  // Action buttons
  actionButton: "text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted/30 focus:outline-none focus:ring-1 focus:ring-ring",
  
  // Source attribution
  sourceTag: "ml-auto text-xs text-muted-foreground/70 font-mono"
} as const;

/**
 * Story card color themes for different contexts
 */
export const StoryThemes = {
  default: {
    card: StoryCardTokens.normal,
    content: "text-card-foreground"
  },
  highlighted: {
    card: StoryCardTokens.highlighted, 
    content: "text-blue-900 dark:text-blue-100"
  },
  archived: {
    card: "border-border/30 bg-muted/30 opacity-75",
    content: "text-muted-foreground"
  }
} as const;

/**
 * Accessibility helpers for story cards
 */
export const StoryA11y = {
  /**
   * Generate ARIA label for story card
   */
  getCardLabel: (story: CompletedStory): string => {
    const tone = StoryDisplayUtils.getToneLabel(story.tone);
    const priority = StoryDisplayUtils.getPriorityLabel(story.priority);
    const time = StoryDisplayUtils.formatTime(story.timestamp);
    return `${tone} story with ${priority}, published ${time}`;
  },

  /**
   * Generate screen reader text for metadata
   */
  getMetadataLabel: (story: CompletedStory): string => {
    const parts = [
      `Tone: ${story.tone}`,
      `Priority: ${story.priority}`,
      story.sentiment && `Sentiment: ${story.sentiment}`,
      story.topics?.length && `Topics: ${story.topics.join(', ')}`
    ].filter(Boolean);
    return parts.join(', ');
  }
} as const;