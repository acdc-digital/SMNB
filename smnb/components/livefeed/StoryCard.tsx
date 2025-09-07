// STORY CARD COMPONENT
// /Users/matthewsimon/Projects/SMNB/smnb/components/livefeed/StoryCard.tsx

import React, { useState } from 'react';
import { CompletedStory } from '@/lib/stores/livefeed/simpleLiveFeedStore';
import { useStorySelectionStore } from '@/lib/stores/livefeed/storySelectionStore';
import { cn } from '@/lib/utils';
import { StoryDisplayUtils, StoryCardTokens, StoryThemes, StoryA11y } from '@/lib/utils/storyUtils';

interface StoryCardProps {
  story: CompletedStory;
  isFirst?: boolean;
  className?: string;
  theme?: keyof typeof StoryThemes;
  showActions?: boolean;
  onAction?: (action: 'read' | 'share' | 'bookmark', story: CompletedStory) => void;
}

export default function StoryCard({ 
  story, 
  isFirst = false, 
  className,
  theme = isFirst ? 'highlighted' : 'default',
  showActions = false,
  onAction 
}: StoryCardProps) {
  const selectedTheme = StoryThemes[theme];
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { selectStory } = useStorySelectionStore();
  
  const cardClassName = cn(
    StoryCardTokens.base,
    selectedTheme.card,
    StoryCardTokens.animation,
    'group', // Add group class for hover effects
    className
  );

  const handleStoryClick = () => {
    selectStory(story);
  };

  return (
    <div 
      className={cardClassName}
      role="article"
      aria-label={StoryA11y.getCardLabel(story)}
    >
      {/* Story Header: Tone + Priority + Type */}
      <div className={StoryCardTokens.header}>
        <span 
          title={StoryDisplayUtils.getToneLabel(story.tone)}
          aria-label={`Story tone: ${story.tone}`}
          className="flex items-center"
        >
          {React.createElement(StoryDisplayUtils.getToneIcon(story.tone), { 
            size: 14, 
            className: "text-muted-foreground" 
          })}
        </span>
        <span 
          title={StoryDisplayUtils.getPriorityLabel(story.priority)}
          aria-label={`Priority: ${story.priority}`}
          className="flex items-center"
        >
          {React.createElement(StoryDisplayUtils.getPriorityIcon(story.priority), { 
            size: 14, 
            className: "text-muted-foreground" 
          })}
        </span>
        <span className={cn(StoryCardTokens.toneLabel, StoryDisplayUtils.getToneColor(story.tone))}>
          {story.tone}
        </span>
        
        {/* Thread indicators */}
        {story.isThreadUpdate && (
          <span className={StoryCardTokens.threadUpdate}>
            UPDATE
          </span>
        )}
        
        {/* Source attribution */}
        {story.originalItem?.subreddit && (
          <span 
            className="ml-auto flex items-center cursor-pointer p-1 rounded transition-colors"
            title={`Source: r/${story.originalItem.subreddit}`}
            aria-label={`Source: r/${story.originalItem.subreddit}`}
            onClick={() => setIsBookmarked(!isBookmarked)}
          >
            {React.createElement(StoryDisplayUtils.getSourceIcon(), { 
              size: 16, 
              className: "text-muted-foreground",
              fill: isBookmarked ? "currentColor" : "none"
            })}
          </span>
        )}
      </div>

      {/* Story Title (from database) */}
      {story.title && (
        <div 
          className="text-lg font-semibold text-white mb-3 leading-tight line-clamp-3 cursor-pointer transition-colors group-hover:text-foreground/90"
          onClick={handleStoryClick}
          title="Click to view full story"
        >
          {story.title}
        </div>
      )}

      {/* Story Image/Thumbnail (if available) */}
      {story.originalItem?.thumbnail && 
       story.originalItem.thumbnail !== 'self' && 
       story.originalItem.thumbnail !== 'default' && 
       story.originalItem.thumbnail !== 'nsfw' && (
        <div className="mb-3 overflow-hidden bg-muted/20 border border-border/30">
          <img 
            src={story.originalItem.thumbnail}
            alt={story.originalItem.title || story.title || 'Story image'}
            className="w-full h-32 object-cover"
            onError={(e) => {
              // Hide the image container if it fails to load
              const target = e.target as HTMLImageElement;
              const container = target.parentElement;
              if (container) {
                container.style.display = 'none';
              }
            }}
          />
        </div>
      )}

      {/* Story Content */}
      <div 
        className="text-sm text-foreground line-clamp-3 leading-relaxed cursor-pointer transition-colors group-hover:text-foreground/85"
        onClick={handleStoryClick}
        title="Click to view full story"
      >
        {story.narrative}
      </div>

      {/* Keywords/Topics Row */}
      {(story.topics && story.topics.length > 0) || story.threadId ? (
        <div className="flex gap-1.5 items-center flex-wrap mb-2">
          {/* Topic tags */}
          {story.topics && story.topics.slice(0, 2).map((topic, index) => (
            <span 
              key={index} 
              className={StoryCardTokens.topicTag}
              title={`Topic: ${topic}`}
            >
              {topic}
            </span>
          ))}
          
          {/* Thread info */}
          {story.threadId && (
            <span 
              className="flex items-center gap-1 text-xs text-muted-foreground" 
              title={`Thread: ${story.threadTopic}, ${story.updateCount || 1} updates`}
            >
              {React.createElement(StoryDisplayUtils.getThreadIcon(), { 
                size: 12, 
                className: "text-muted-foreground" 
              })}
              {story.updateCount || 1}
            </span>
          )}
        </div>
      ) : null}

      {/* Sentiment Analysis Row */}
      {story.sentiment && (
        <div className="flex items-center mb-2">
          <span 
            className={cn("px-1.5 py-0.5 rounded-full text-xs", StoryDisplayUtils.getSentimentColor(story.sentiment))}
            title={`Sentiment: ${story.sentiment}`}
          >
            {story.sentiment}
          </span>
        </div>
      )}

      {/* Time Information Row */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{StoryDisplayUtils.formatTime(story.timestamp)}</span>
        <span>•</span>
        <span>{StoryDisplayUtils.getReadingTime(story.duration)}</span>
      </div>

      {/* Source Link (if available) */}
      {(story.originalItem?.url || story.originalItem?.subreddit) && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 flex-wrap">
          <span>Sources:</span>
          
          {/* Original article link */}
          {story.originalItem?.url && (
            <>
              <a 
                href={story.originalItem.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors underline underline-offset-2"
              >
                {(() => {
                  try {
                    return new URL(story.originalItem.url).hostname;
                  } catch (error) {
                    // Fallback for invalid URLs
                    console.warn('Invalid URL:', story.originalItem.url, error);
                    return story.originalItem.url.length > 30 ? story.originalItem.url.substring(0, 30) + '...' : story.originalItem.url;
                  }
                })()}
              </a>
              {story.originalItem?.subreddit && <span>•</span>}
            </>
          )}
          
          {/* Reddit thread link */}
          {story.originalItem?.subreddit && (
            <a 
              href={`https://www.reddit.com/r/${story.originalItem.subreddit}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors underline underline-offset-2"
            >
              r/{story.originalItem.subreddit}
            </a>
          )}
        </div>
      )}

      {/* Optional action buttons */}
      {showActions && onAction && (
        <div className={StoryCardTokens.actions}>
          <button 
            onClick={() => onAction('read', story)}
            className={StoryCardTokens.actionButton}
            aria-label={`Read full story: ${story.narrative.substring(0, 50)}...`}
          >
            Read
          </button>
          <button 
            onClick={() => onAction('share', story)}
            className={StoryCardTokens.actionButton}
            aria-label={`Share story: ${story.narrative.substring(0, 50)}...`}
          >
            Share
          </button>
          <button 
            onClick={() => onAction('bookmark', story)}
            className={StoryCardTokens.actionButton}
            aria-label={`Bookmark story: ${story.narrative.substring(0, 50)}...`}
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}