# Studio Live-Feed Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Data Flow Pipeline](#data-flow-pipeline)
4. [API Layer](#api-layer)
5. [Processing Agents](#processing-agents)
6. [Scheduling & Publishing](#scheduling--publishing)
7. [State Management](#state-management)
8. [UI Components](#ui-components)
9. [Configuration](#configuration)
10. [Error Handling](#error-handling)
11. [Performance Considerations](#performance-considerations)
12. [Maintenance Guide](#maintenance-guide)

---

## Overview

The SMNB (Social Media News Bot) Live Feed system is a sophisticated, multi-agent content curation pipeline that intelligently fetches, processes, scores, and displays Reddit content in real-time. The system employs advanced algorithms for sentiment analysis, quality scoring, priority assessment, and optimal scheduling to deliver the most relevant and engaging content to users.

### Key Features
- **Multi-Agent Processing**: Separate agents for enrichment, scoring, and scheduling
- **Intelligent Content Curation**: AI-powered sentiment analysis and quality assessment
- **Dynamic Priority Scoring**: Weighted algorithms considering engagement, recency, and quality
- **Optimal Publishing**: Smart timing and diversity management
- **Real-Time Updates**: Instant UI updates with smooth animations
- **Dark Mode Support**: Complete theming system
- **Responsive Design**: VS Code-inspired layout with mobile support

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          SMNB ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│  UI Layer (React Components)                                   │
│  ├── SimpleLiveFeed.tsx                                       │
│  ├── ThemeToggle.tsx                                          │
│  └── Dashboard Layout                                          │
├─────────────────────────────────────────────────────────────────┤
│  State Management (Zustand)                                    │
│  └── simpleLiveFeedStore.ts                                   │
├─────────────────────────────────────────────────────────────────┤
│  Processing Pipeline                                            │
│  ├── EnhancedProcessingPipeline (Orchestrator)                │
│  ├── EnrichmentAgent (Sentiment, Categories, Quality)         │
│  ├── ScoringAgent (Priority Calculation)                      │
│  ├── SchedulerService (Optimal Timing)                        │
│  └── PublisherService (Queue Management)                      │
├─────────────────────────────────────────────────────────────────┤
│  API Layer                                                      │
│  ├── /api/reddit (Next.js Route Handler)                      │
│  ├── reddit.ts (Reddit API Client)                            │
│  └── reddit-oauth.ts (Enhanced Reddit Client)                 │
├─────────────────────────────────────────────────────────────────┤
│  External Services                                              │
│  └── Reddit API (r/subreddit/sort.json)                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Pipeline

### Complete Data Journey
```
Raw Reddit Posts → Enrichment → Scoring → Scheduling → Publishing → UI Display
```

### Processing States
Each post transitions through these states:
1. **`raw`** - Just fetched from Reddit API
2. **`enriched`** - Sentiment, categories, quality scores added
3. **`scored`** - Priority score calculated
4. **`scheduled`** - Added to publishing queue with optimal timing
5. **`published`** - Displayed in UI

### Detailed Flow Diagram
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Reddit    │───▶│     API     │───▶│ Enhanced    │
│     API     │    │ /api/reddit │    │ Processing  │
│             │    │             │    │ Pipeline    │
└─────────────┘    └─────────────┘    └─────────────┘
                                             │
                                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PROCESSING AGENTS                            │
├─────────────────────────────────────────────────────────────────┤
│  1. EnrichmentAgent                                             │
│     ├── Sentiment Analysis (positive/neutral/negative)         │
│     ├── Category Assignment (tech, politics, gaming, etc.)     │
│     ├── Quality Scoring (content analysis)                     │
│     └── Content Enhancement                                     │
│                                                                 │
│  2. ScoringAgent                                               │
│     ├── Engagement Score (40% weight)                          │
│     ├── Recency Score (35% weight)                            │
│     ├── Quality Score (25% weight)                            │
│     └── Final Priority Calculation                             │
│                                                                 │
│  3. SchedulerService                                           │
│     ├── Optimal Timing Algorithm                               │
│     ├── Content Diversity Management                           │
│     ├── Peak Hours Optimization (14-18 UTC)                   │
│     └── Queue Management                                        │
└─────────────────────────────────────────────────────────────────┘
                                             │
                                             ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Publishing  │───▶│    State    │───▶│     UI      │
│   Queue     │    │ Management  │    │  Display    │
│             │    │  (Zustand)  │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
```

---

## API Layer

### Reddit API Integration

#### Primary Endpoint: `/app/api/reddit/route.ts`
```typescript
// GET Parameters
interface RedditAPIParams {
  subreddit: string;  // Default: 'all'
  sort: 'hot' | 'new' | 'rising' | 'top';  // Default: 'hot'
  limit: number;      // Default: 10, Max: 100
  after?: string;     // Pagination token
}

// Example URL
// /api/reddit?subreddit=technology&sort=hot&limit=10
```

#### Reddit Client: `lib/reddit.ts`
```typescript
class RedditAPI {
  private baseUrl = 'https://www.reddit.com';
  private userAgent = 'SMNB-Reddit-Client/1.0';

  async fetchPosts(
    subreddit: string = 'all',
    sort: SortType = 'hot',
    limit: number = 25,
    timeFilter: TimeFilter = 'day',
    after?: string
  ): Promise<RedditResponse>
}
```

#### URL Construction
```typescript
const params = new URLSearchParams({
  limit: Math.min(limit, 100).toString(),
  raw_json: '1', // Prevents HTML encoding
});

// Final URL: https://www.reddit.com/r/{subreddit}/{sort}.json?{params}
```

### Default Configuration

#### Subreddits (configurable in `simpleLiveFeedStore.ts`)
```typescript
selectedSubreddits: [
  'all',
  'news',
  'worldnews', 
  'technology',
  'gaming',
  'funny',
  'todayilearned',
  'askreddit'
]
```

#### API Call Strategy
- **Random Subreddit Selection**: Ensures content diversity
- **Random Sort Method**: Rotates between 'new', 'rising', 'hot'
- **Rate Limiting**: Respects Reddit API limits
- **Error Handling**: Graceful degradation on API failures

---

## Processing Agents

### 1. EnrichmentAgent (`lib/services/livefeed/enrichmentAgent.ts`)

#### Purpose
Adds intelligence and context to raw Reddit posts through analysis and categorization.

#### Functionality
```typescript
class EnrichmentAgent {
  async enrichPosts(posts: EnhancedRedditPost[]): Promise<EnhancedRedditPost[]> {
    // 1. Sentiment Analysis
    const sentiment = this.analyzeSentiment(post.title, post.selftext);
    
    // 2. Category Assignment  
    const categories = this.assignCategories(post);
    
    // 3. Quality Scoring
    const qualityScore = this.calculateQualityScore(post);
    
    return enhancedPost;
  }
}
```

#### Sentiment Analysis Algorithm
```typescript
private analyzeSentiment(title: string, content: string): string {
  const positiveWords = ['great', 'amazing', 'awesome', 'excellent', 'fantastic'];
  const negativeWords = ['terrible', 'awful', 'horrible', 'disaster', 'crisis'];
  
  // Word frequency analysis
  const positiveCount = this.countWords(text, positiveWords);
  const negativeCount = this.countWords(text, negativeWords);
  
  if (positiveCount > negativeCount + 1) return 'positive';
  if (negativeCount > positiveCount + 1) return 'negative';
  return 'neutral';
}
```

#### Category Assignment
Based on subreddit, title keywords, and content analysis:
- **Technology**: tech, programming, science subreddits
- **Gaming**: gaming, games, specific game subreddits
- **Politics**: politics, worldnews, news subreddits
- **Entertainment**: funny, movies, music subreddits
- **Education**: todayilearned, explainlikeimfive
- **Discussion**: askreddit, discussion-based content

#### Quality Metrics
- Title clarity and length
- Content substantiveness
- Engagement indicators
- Source credibility

### 2. ScoringAgent (`lib/services/livefeed/scoringAgent.ts`)

#### Purpose
Calculates priority scores to determine which posts should be published first.

#### Scoring Algorithm
```typescript
const SCORING_WEIGHTS = {
  engagement: 0.4,  // 40% - upvotes, comments, upvote ratio
  recency: 0.35,    // 35% - how recent the post is
  quality: 0.25     // 25% - content quality from enrichment
};

calculatePriorityScore(post: EnhancedRedditPost): number {
  const engagementScore = this.calculateEngagementScore(post);
  const recencyScore = this.calculateRecencyScore(post);
  const qualityScore = post.quality_score || 0.5;
  
  return (
    engagementScore * SCORING_WEIGHTS.engagement +
    recencyScore * SCORING_WEIGHTS.recency +
    qualityScore * SCORING_WEIGHTS.quality
  );
}
```

#### Engagement Score Calculation
```typescript
private calculateEngagementScore(post: EnhancedRedditPost): number {
  const upvoteRatio = Math.max(0, Math.min(1, post.upvote_ratio || 0.5));
  const scoreNormalized = Math.min(1, Math.log10(Math.max(1, post.score)) / 4);
  const commentsNormalized = Math.min(1, Math.log10(Math.max(1, post.num_comments)) / 3);
  
  return (upvoteRatio * 0.4) + (scoreNormalized * 0.4) + (commentsNormalized * 0.2);
}
```

#### Recency Score Calculation
```typescript
private calculateRecencyScore(post: EnhancedRedditPost): number {
  const ageHours = (Date.now() / 1000 - post.created_utc) / 3600;
  
  if (ageHours < 1) return 1.0;        // Very fresh
  if (ageHours < 3) return 0.8;        // Recent
  if (ageHours < 6) return 0.6;        // Moderate
  if (ageHours < 12) return 0.4;       // Getting old
  if (ageHours < 24) return 0.2;       // Old
  return 0.1;                           // Very old
}
```

### 3. SchedulerService (`lib/services/livefeed/schedulerService.ts`)

#### Purpose
Determines optimal timing for publishing posts to maximize user engagement.

#### Core Configuration
```typescript
const QUEUE_CONFIG = {
  MIN_POST_INTERVAL_MINUTES: 5,     // Minimum time between posts
  MAX_POSTS_PER_HOUR: 8,           // Rate limiting
  PEAK_HOURS_UTC: [14, 15, 16, 17, 18],  // Optimal publishing hours
  DIVERSITY_WINDOW_MINUTES: 30,     // Avoid similar content clustering
};
```

#### Scheduling Algorithm
```typescript
createOptimalSchedule(posts: EnhancedRedditPost[]): EnhancedRedditPost[] {
  // 1. Sort by priority score (highest first)
  const sortedPosts = posts.sort((a, b) => b.priority_score - a.priority_score);
  
  // 2. Immediate publishing for top posts
  const firstThree = sortedPosts.slice(0, 3);
  this.scheduleImmediately(firstThree);
  
  // 3. Optimal timing for remaining posts
  const remaining = sortedPosts.slice(3);
  this.scheduleWithOptimalTiming(remaining);
  
  return scheduledPosts;
}
```

#### Diversity Management
```typescript
private ensureDiversity(posts: EnhancedRedditPost[]): EnhancedRedditPost[] {
  const recentSubreddits = new Set();
  const recentCategories = new Set();
  
  return posts.filter(post => {
    // Avoid clustering same subreddit/category
    const subredditRecent = recentSubreddits.has(post.subreddit);
    const categoryRecent = post.categories?.some(cat => recentCategories.has(cat));
    
    if (subredditRecent || categoryRecent) {
      return false; // Skip this post for now
    }
    
    // Add to recent tracking
    recentSubreddits.add(post.subreddit);
    post.categories?.forEach(cat => recentCategories.add(cat));
    
    return true;
  });
}
```

---

## Scheduling & Publishing

### Publishing Pipeline

#### 1. Enhanced Processing Pipeline (`enhancedProcessingPipeline.ts`)
- **Orchestrates** the entire flow
- **Manages** publishing queue
- **Coordinates** all agents
- **Handles** real-time updates

#### 2. Publishing Loop
```typescript
private startPublishingLoop(onNewPost: (post: EnhancedRedditPost) => void) {
  // Check immediately for any ready posts
  this.checkAndPublishReadyPosts(onNewPost);
  
  // Then check every 3 seconds for responsiveness
  this.publishInterval = window.setInterval(() => {
    this.checkAndPublishReadyPosts(onNewPost);
  }, 3000);
}
```

#### 3. Immediate Publishing Strategy
For better user experience, the first 3 highest-priority posts are published immediately:
```typescript
// First 3 posts: instant publishing
scheduleTime: now
scheduleTime: now + 2 seconds  
scheduleTime: now + 4 seconds

// Remaining posts: optimal scheduling
scheduleTime: calculated based on priority and timing algorithm
```

### Queue Management

#### Post States in Queue
```typescript
interface QueuedPost extends EnhancedRedditPost {
  processing_status: 'raw' | 'enriched' | 'scored' | 'scheduled' | 'published';
  scheduleTime?: number;        // When to publish (timestamp)
  publishedAt?: number;         // When actually published
  priority_score: number;       // 0-1 priority score
}
```

#### Publishing Decision Logic
```typescript
private checkAndPublishReadyPosts(onNewPost: (post: EnhancedRedditPost) => void) {
  const now = Date.now();
  const readyPosts = this.posts.filter(post => 
    post.processing_status === 'scheduled' && 
    post.scheduleTime <= now
  );
  
  readyPosts.forEach(post => {
    post.processing_status = 'published';
    post.publishedAt = now;
    onNewPost(post);
  });
}
```

---

## State Management

### Zustand Store (`simpleLiveFeedStore.ts`)

#### Store Structure
```typescript
interface SimpleLiveFeedStore {
  // Core Data
  posts: LiveFeedPost[];
  isLive: boolean;
  contentMode: 'sfw' | 'nsfw';
  selectedSubreddits: string[];
  
  // Configuration
  refreshInterval: number;
  maxPosts: number;
  
  // Status
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
  totalPostsFetched: number;
  
  // Actions
  setPosts: (posts: LiveFeedPost[]) => void;
  addPost: (post: LiveFeedPost) => void;
  clearPosts: () => void;
  setIsLive: (isLive: boolean) => void;
  // ... more actions
}
```

#### Post Interface
```typescript
interface LiveFeedPost {
  // Reddit Data
  id: string;
  title: string;
  author: string;
  subreddit: string;
  url: string;
  permalink: string;
  score: number;
  num_comments: number;
  created_utc: number;
  thumbnail: string;
  selftext: string;
  is_video: boolean;
  domain: string;
  upvote_ratio: number;
  over_18: boolean;
  
  // SMNB Metadata
  source: 'reddit';
  addedAt: number;
  batchId: number;
  isNew?: boolean;
  sort_type?: 'live' | 'hot' | 'top' | 'rising';
  fetched_at?: number;
  
  // Enhanced Data (from processing pipeline)
  priority_score?: number;
  quality_score?: number;
  categories?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
}
```

#### Key Store Actions

##### Adding New Posts
```typescript
addPost: (post) => {
  set((state) => {
    // 1. Check for duplicates
    const exists = state.posts.some(p => p.id === post.id);
    if (exists) return state;
    
    // 2. Add with "new" indicator
    const newPost = { ...post, isNew: true, addedAt: Date.now() };
    
    // 3. Add to beginning (newest first) and limit
    const updatedPosts = [newPost, ...state.posts].slice(0, state.maxPosts);
    
    // 4. Remove "new" indicator after animation
    setTimeout(() => {
      set((state) => ({
        posts: state.posts.map(p => p.id === post.id ? { ...p, isNew: false } : p)
      }));
    }, 3000);
    
    return {
      posts: updatedPosts,
      totalPostsFetched: state.totalPostsFetched + 1,
    };
  });
}
```

---

## UI Components

### SimpleLiveFeed Component (`SimpleLiveFeed.tsx`)

#### Component Structure
```tsx
export default function SimpleLiveFeed() {
  return (
    <div className="space-y-4">
      {/* Controls Section */}
      <div className="bg-card border border-border p-4 rounded-lg">
        <h2>Simple Live Feed</h2>
        <div className="flex items-center gap-2">
          <StatusIndicator isLive={isLive} />
          <StartStopButton />
          <ContentModeButtons />
        </div>
        <StatusBar />
      </div>
      
      {/* Posts Section */}
      <div className="space-y-3">
        {posts.map(post => <PostCard key={post.id} post={post} />)}
      </div>
    </div>
  );
}
```

#### Post Card Design
```tsx
<div className={`
  bg-card border border-border p-4 rounded-lg shadow-sm transition-all duration-500
  ${post.isNew ? 'ring-2 ring-green-400 dark:ring-green-500 bg-green-50 dark:bg-green-950/20' : ''}
`}>
  <div className="flex items-start justify-between">
    <div className="flex-1">
      {/* Title with Enhanced Indicators */}
      <div className="flex items-center gap-2">
        <h3 className="font-medium text-foreground truncate">{post.title}</h3>
        {/* Priority Badge */}
        {post.priority_score > 0.7 && (
          <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
            ⭐ High Priority
          </span>
        )}
        {/* Sentiment Badges */}
        {post.sentiment === 'positive' && (
          <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
            😊 Positive
          </span>
        )}
      </div>
      
      {/* Metadata */}
      <div className="mt-1 text-sm text-muted-foreground">
        r/{post.subreddit} • by u/{post.author} • {post.score} points • {post.num_comments} comments
        {post.categories && (
          <span className="text-blue-600 dark:text-blue-400">
            • {post.categories.join(', ')}
          </span>
        )}
      </div>
      
      {/* Quality/Priority Scores */}
      <div className="mt-1 text-xs text-muted-foreground/70">
        {new Date(post.created_utc * 1000).toLocaleTimeString()}
        {post.quality_score && (
          <span>• Quality: {(post.quality_score * 100).toFixed(0)}%</span>
        )}
        {post.priority_score && (
          <span>• Priority: {(post.priority_score * 100).toFixed(0)}%</span>
        )}
      </div>
    </div>
    
    <div className="ml-4 flex-shrink-0">
      <a href={post.permalink} target="_blank" className="text-blue-500 hover:text-blue-600">
        View →
      </a>
    </div>
  </div>
</div>
```

#### Visual Indicators
- **🔥 High Priority**: Posts with priority_score > 0.7
- **😊 Positive**: Positive sentiment posts
- **😐 Neutral**: Neutral sentiment posts
- **😞 Critical**: Negative sentiment posts
- **⭐ Quality Scores**: Percentage display of quality assessment
- **🏷️ Categories**: Topic categorization labels

#### Dark Mode Support
All components use semantic Tailwind classes:
- `bg-card` / `bg-background`
- `text-foreground` / `text-muted-foreground`
- `border-border`
- Dark mode variants: `dark:bg-green-950/20`, `dark:text-green-300`

---

## Configuration

### Environment Variables
```bash
# .env.local
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=SMNB-Reddit-Client/1.0
```

### Queue Configuration
```typescript
// lib/services/livefeed/schedulerService.ts
const QUEUE_CONFIG = {
  MIN_POST_INTERVAL_MINUTES: 5,
  MAX_POSTS_PER_HOUR: 8,
  PEAK_HOURS_UTC: [14, 15, 16, 17, 18], // 2 PM - 6 PM UTC
  DIVERSITY_WINDOW_MINUTES: 30,
  
  SCORING_WEIGHTS: {
    engagement: 0.4,   // Reddit scores, comments, upvote ratio
    recency: 0.35,     // How recent the post is
    quality: 0.25      // Content quality assessment
  }
};
```

### Default Subreddits
```typescript
// lib/stores/livefeed/simpleLiveFeedStore.ts
selectedSubreddits: [
  'all',           // Reddit front page
  'news',          // Breaking news
  'worldnews',     // International news
  'technology',    // Tech news and discussions
  'gaming',        // Gaming content
  'funny',         // Entertainment
  'todayilearned', // Educational content
  'askreddit'      // Community discussions
]
```

### Customizable Parameters
- **Refresh Interval**: How often to fetch new posts (default: 30 seconds)
- **Max Posts**: Maximum posts in feed (default: 50)
- **Content Mode**: SFW/NSFW filtering
- **Publishing Rate**: Posts per hour limit
- **Quality Thresholds**: Minimum quality scores for publishing

---

## Error Handling

### API Error Handling
```typescript
try {
  const response = await fetch(`/api/reddit?subreddit=${subreddit}&limit=10&sort=${sort}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${subreddit}: ${response.statusText}`);
  }
  
  const data = await response.json();
  if (!data.success || !Array.isArray(data.posts)) {
    console.error(`❌ API error for r/${subreddit}:`, data.error);
    return [];
  }
  
  return data.posts;
} catch (error) {
  console.error('❌ Network error:', error);
  return [];
}
```

### Processing Pipeline Error Handling
```typescript
async enrichPosts(posts: EnhancedRedditPost[]): Promise<EnhancedRedditPost[]> {
  try {
    console.log(`🧠 EnrichmentAgent: Processing ${posts.length} posts...`);
    
    const enriched = posts.map(post => {
      try {
        return this.enrichSinglePost(post);
      } catch (error) {
        console.error(`❌ Failed to enrich post ${post.id}:`, error);
        return { ...post, processing_status: 'enriched' }; // Fallback
      }
    });
    
    console.log(`✅ EnrichmentAgent: Successfully enriched ${enriched.length} posts`);
    return enriched;
  } catch (error) {
    console.error('❌ EnrichmentAgent: Critical error:', error);
    throw error;
  }
}
```

### UI Error States
```typescript
// Store error handling
setError: (error: string | null) => {
  set({ error, isLoading: false });
}

// UI error display
{error && (
  <div className="text-red-500 dark:text-red-400 text-sm">
    Error: {error}
  </div>
)}
```

### Graceful Degradation
- **API Failures**: Continue with cached/existing content
- **Processing Errors**: Skip problematic posts, continue with others
- **Network Issues**: Show offline indicators, retry logic
- **Rate Limiting**: Implement backoff strategies

---

## Performance Considerations

### Memory Management
```typescript
// Automatic cleanup of old posts
clearOldPosts: () => {
  set((state) => {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    const filteredPosts = state.posts.filter(post => post.addedAt > cutoffTime);
    console.log(`🧹 Cleared ${state.posts.length - filteredPosts.length} old posts`);
    return { posts: filteredPosts };
  });
}
```

### Batch Processing
```typescript
// Process posts in batches to avoid blocking UI
private async processBatch(posts: EnhancedRedditPost[]): Promise<void> {
  const BATCH_SIZE = 5;
  
  for (let i = 0; i < posts.length; i += BATCH_SIZE) {
    const batch = posts.slice(i, i + BATCH_SIZE);
    await this.processPostBatch(batch);
    
    // Allow UI to update between batches
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}
```

### API Rate Limiting
```typescript
// Respect Reddit API rate limits
const RATE_LIMIT = {
  requestsPerMinute: 60,
  burstLimit: 100,
  backoffMultiplier: 2,
  maxBackoffTime: 300000 // 5 minutes
};
```

### Caching Strategy
- **API Responses**: Cache for 5 minutes to reduce API calls
- **Processed Data**: Cache enriched posts to avoid reprocessing
- **UI State**: Persist user preferences in localStorage

### Bundle Size Optimization
- **Code Splitting**: Dynamic imports for heavy components
- **Tree Shaking**: Remove unused code
- **Lazy Loading**: Load components on demand

---

## Maintenance Guide

### Regular Maintenance Tasks

#### 1. Monitor API Usage
```bash
# Check Reddit API rate limits
curl -I https://www.reddit.com/r/all/hot.json

# Monitor application logs
tail -f logs/application.log | grep "Reddit API"
```

#### 2. Database Cleanup (if using Convex)
```typescript
// Remove posts older than 7 days
const cleanupOldPosts = async () => {
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
  // Convex cleanup logic here
};
```

#### 3. Performance Monitoring
```typescript
// Monitor processing times
const PERFORMANCE_METRICS = {
  averageEnrichmentTime: 0,
  averageScoringTime: 0,
  averageSchedulingTime: 0,
  totalProcessedPosts: 0
};
```

### Troubleshooting Common Issues

#### 1. No Posts Appearing
- Check Reddit API connectivity
- Verify subreddit names are correct
- Ensure content mode filters aren't too restrictive
- Check browser console for JavaScript errors

#### 2. Slow Performance
- Monitor processing pipeline bottlenecks
- Check for memory leaks in post accumulation
- Verify API response times
- Consider reducing batch sizes

#### 3. Duplicate Posts
- Check post deduplication logic in store
- Verify unique ID generation
- Monitor Reddit API pagination

#### 4. Incorrect Scoring/Categorization
- Review sentiment analysis word lists
- Update category keywords
- Adjust scoring weight configuration
- Test with sample posts

### Code Quality Maintenance

#### 1. Type Safety
```bash
# Run TypeScript checks
pnpm tsc --noEmit

# ESLint checks
pnpm lint
```

#### 2. Testing
```bash
# Unit tests
pnpm test

# Integration tests
pnpm test:integration
```

#### 3. Dependencies
```bash
# Check for outdated dependencies
pnpm outdated

# Security audit
pnpm audit
```

### Scaling Considerations

#### 1. Horizontal Scaling
- Move processing to background workers
- Implement Redis for shared state
- Consider microservices architecture

#### 2. Database Scaling
- Implement proper indexing
- Consider read replicas
- Monitor query performance

#### 3. CDN Integration
- Cache static assets
- Optimize image loading
- Implement service workers

---

## Advanced Features

### Future Enhancements

#### 1. Machine Learning Integration
- **Sentiment Analysis**: Use NLP models like BERT
- **Content Classification**: Advanced topic modeling
- **User Behavior**: Personalized content scoring

#### 2. Real-time Analytics
- **Engagement Tracking**: Click-through rates
- **Performance Metrics**: Processing times, success rates
- **User Analytics**: Reading patterns, preferences

#### 3. Enhanced UI Features
- **Infinite Scroll**: Pagination for large datasets
- **Filters**: Advanced filtering options
- **Bookmarking**: Save favorite posts
- **Sharing**: Social media integration

#### 4. Content Moderation
- **Spam Detection**: Automated spam filtering
- **Content Safety**: NSFW detection
- **Quality Gates**: Minimum quality thresholds

### API Extensions

#### 1. Additional Sources
- **Twitter Integration**: Expand beyond Reddit
- **RSS Feeds**: Support multiple content sources
- **Custom APIs**: Internal content sources

#### 2. Advanced Reddit Features
- **User Authentication**: Access private subreddits
- **Comment Analysis**: Process comment threads
- **Live Threads**: Real-time event coverage

---

## Conclusion

The SMNB Live Feed Architecture represents a sophisticated, production-ready system for intelligent content curation and real-time delivery. The multi-agent processing pipeline ensures high-quality, relevant content reaches users at optimal times, while the modular architecture allows for easy maintenance and future enhancements.

Key strengths of the system:
- **Intelligent Processing**: Multi-stage enhancement pipeline
- **Optimal Timing**: Smart scheduling algorithms
- **User Experience**: Smooth, real-time updates with visual feedback
- **Scalability**: Modular design supports growth
- **Maintainability**: Well-documented, typed codebase

The system successfully balances algorithmic sophistication with user experience, providing a robust foundation for social media content curation at scale.

---

*This document should be updated whenever significant changes are made to the feed architecture. Last updated: August 31, 2025*
