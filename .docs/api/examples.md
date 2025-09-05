# Examples & Tutorials

> **Practical Implementation** - Step-by-step guides, code samples, and real-world examples

This guide provides comprehensive examples for implementing SMNB's API features, from basic setup to advanced use cases.

## 🚀 Getting Started

### **Quick Setup Tutorial**

#### 1. **Environment Setup**

```bash
# Clone and install dependencies
git clone <repository-url>
cd smnb
npm install

# Setup environment variables
cp .env.example .env.local
```

Edit `.env.local`:

```bash
# Reddit API Credentials
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=YourApp/1.0.0 (by /u/yourusername)

# Claude AI
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxx

# Convex (automatically configured)
CONVEX_DEPLOYMENT=your_convex_deployment_name
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

#### 2. **Initialize Convex Backend**

```bash
# Start Convex development
npm run dev:convex

# In another terminal, start Next.js
npm run dev
```

#### 3. **First API Call**

```bash
# Test Reddit API
curl "http://localhost:8888/api/reddit?subreddit=worldnews&limit=3"

# Test Claude AI
curl -X POST "http://localhost:8888/api/claude" \
  -H "Content-Type: application/json" \
  -d '{"action": "test", "prompt": "Hello"}'
```

***

## 📱 Frontend Integration Examples

### **Live Feed Component**

```typescript
// components/LiveFeedDisplay.tsx
'use client';

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";

interface LiveFeedDisplayProps {
  subreddit: string;
  limit?: number;
}

export function LiveFeedDisplay({ subreddit, limit = 10 }: LiveFeedDisplayProps) {
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get live feed posts from Convex
  const posts = useQuery(api.redditFeed.getLiveFeedPosts, { limit });
  const storePosts = useMutation(api.redditFeed.storeLiveFeedPosts);
  
  // Fetch new posts from Reddit API
  const fetchNewPosts = async () => {
    try {
      setError(null);
      const response = await fetch(
        `/api/reddit?subreddit=${subreddit}&limit=${limit}&sort=hot`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch posts');
      }
      
      const data = await response.json();
      
      if (data.success && data.posts?.length > 0) {
        // Transform and store posts
        const liveFeedPosts = data.posts.map((post: any) => ({
          ...post,
          source: `${subreddit}/hot`,
          addedAt: Date.now(),
          batchId: `batch_${Date.now()}`
        }));
        
        const result = await storePosts({ 
          posts: liveFeedPosts, 
          batchId: `batch_${Date.now()}` 
        });
        
        console.log(`✅ Stored ${result.inserted} posts, skipped ${result.skipped} duplicates`);
      }
    } catch (error) {
      console.error('❌ Failed to fetch posts:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    }
  };
  
  // Auto-refresh when live mode is enabled
  useEffect(() => {
    if (!isLive) return;
    
    const interval = setInterval(fetchNewPosts, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [isLive, subreddit]);
  
  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-4 py-2 rounded font-medium ${
              isLive 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {isLive ? '⏹️ Stop Live Feed' : '▶️ Start Live Feed'}
          </button>
          
          <button
            onClick={fetchNewPosts}
            disabled={isLive}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            🔄 Refresh Now
          </button>
        </div>
        
        <div className="text-sm text-gray-600">
          {posts ? `${posts.length} posts loaded` : 'Loading...'}
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800 font-medium">Error:</div>
          <div className="text-red-700">{error}</div>
        </div>
      )}
      
      {/* Live Status Indicator */}
      {isLive && (
        <div className="flex items-center space-x-2 text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Live feed active</span>
        </div>
      )}
      
      {/* Posts Display */}
      <div className="space-y-3">
        {posts?.map((post) => (
          <PostCard key={post._id} post={post} />
        ))}
        
        {posts?.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No posts yet. Click "Start Live Feed" to begin.
          </div>
        )}
      </div>
    </div>
  );
}

// Individual post component
function PostCard({ post }: { post: any }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  
  const analyzePost = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          prompt: `${post.title}. ${post.selftext || 'No content'}`
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setAnalysis(data.analysis);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  return (
    <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-lg mb-1">
            <a 
              href={`https://reddit.com${post.permalink}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              {post.title}
            </a>
          </h3>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
            <span>r/{post.subreddit}</span>
            <span>👤 {post.author}</span>
            <span>⬆️ {post.score} points</span>
            <span>💬 {post.num_comments} comments</span>
            <span>⏰ {new Date(post.created_utc * 1000).toLocaleTimeString()}</span>
          </div>
          
          {post.selftext && (
            <p className="text-gray-700 text-sm mb-3 line-clamp-3">
              {post.selftext}
            </p>
          )}
          
          {/* Analysis Results */}
          {analysis && (
            <div className="mt-3 p-3 bg-blue-50 rounded border">
              <div className="text-sm">
                <div className="font-medium mb-1">🧠 AI Analysis:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Sentiment: <span className={`font-medium ${
                    analysis.sentiment === 'positive' ? 'text-green-600' :
                    analysis.sentiment === 'negative' ? 'text-red-600' : 'text-gray-600'
                  }`}>{analysis.sentiment}</span></div>
                  <div>Urgency: <span className="font-medium">{analysis.urgency}</span></div>
                  <div>Topics: <span className="font-medium">{analysis.topics?.join(', ')}</span></div>
                  <div>Relevance: <span className="font-medium">{(analysis.relevance * 100).toFixed(0)}%</span></div>
                </div>
                {analysis.summary && (
                  <div className="mt-2 text-sm font-medium">{analysis.summary}</div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="ml-4 flex flex-col space-y-2">
          {post.thumbnail && post.thumbnail !== 'self' && (
            <img 
              src={post.thumbnail} 
              alt="Post thumbnail"
              className="w-16 h-16 object-cover rounded"
            />
          )}
          
          <button
            onClick={analyzePost}
            disabled={isAnalyzing}
            className="px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400"
          >
            {isAnalyzing ? '🔄' : '🧠'} Analyze
          </button>
        </div>
      </div>
    </div>
  );
}
```

### **Usage Example**

```typescript
// app/page.tsx
import { LiveFeedDisplay } from '@/components/LiveFeedDisplay';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">SMNB Live Feed</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <LiveFeedDisplay subreddit="worldnews" limit={10} />
        <LiveFeedDisplay subreddit="technology" limit={10} />
      </div>
    </div>
  );
}
```

***

## 🤖 AI Integration Examples

### **Content Analysis Service**

```typescript
// lib/services/contentAnalysisService.ts
export class ContentAnalysisService {
  private batchQueue: Array<{
    content: string;
    resolve: (result: any) => void;
    reject: (error: any) => void;
  }> = [];
  
  private batchTimeout: NodeJS.Timeout | null = null;
  
  async analyzeContent(content: string): Promise<ContentAnalysis> {
    // Use batching for efficiency
    return new Promise((resolve, reject) => {
      this.batchQueue.push({ content, resolve, reject });
      
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }
      
      // Process batch after 100ms or when batch size reaches 5
      this.batchTimeout = setTimeout(() => this.processBatch(), 100);
      
      if (this.batchQueue.length >= 5) {
        this.processBatch();
      }
    });
  }
  
  private async processBatch() {
    if (this.batchQueue.length === 0) return;
    
    const batch = this.batchQueue.splice(0);
    this.batchTimeout = null;
    
    try {
      // Process multiple content items in parallel
      const analyses = await Promise.all(
        batch.map(async ({ content }) => {
          const response = await fetch('/api/claude', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'analyze',
              prompt: content.substring(0, 1000) // Limit content length
            })
          });
          
          if (!response.ok) {
            throw new Error(`Analysis failed: ${response.statusText}`);
          }
          
          const data = await response.json();
          return data.analysis;
        })
      );
      
      // Resolve each promise with its corresponding result
      batch.forEach((item, index) => {
        item.resolve(analyses[index]);
      });
      
    } catch (error) {
      // Reject all promises with the error
      batch.forEach(item => {
        item.reject(error);
      });
    }
  }
  
  async generateSummary(posts: RedditPost[]): Promise<string> {
    const combinedContent = posts
      .map(post => `${post.title}: ${post.selftext || 'No content'}`)
      .join('\n\n')
      .substring(0, 3000); // Limit total content
    
    const response = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generate',
        prompt: `Create a concise news summary from these Reddit posts:\n\n${combinedContent}`,
        max_tokens: 200,
        temperature: 0.7
      })
    });
    
    const data = await response.json();
    return data.content || 'Summary generation failed';
  }
  
  async streamAnalysis(content: string): Promise<ReadableStream> {
    const response = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'stream',
        prompt: `Provide detailed analysis of this content: ${content}`,
        max_tokens: 300
      })
    });
    
    if (!response.body) {
      throw new Error('No response body for streaming');
    }
    
    return response.body;
  }
}

interface ContentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  topics: string[];
  summary: string;
  urgency: 'low' | 'medium' | 'high';
  relevance: number;
}
```

### **Streaming Analysis Component**

```typescript
// components/StreamingAnalysis.tsx
'use client';

import { useState } from 'react';
import { ContentAnalysisService } from '@/lib/services/contentAnalysisService';

interface StreamingAnalysisProps {
  content: string;
  onAnalysisComplete?: (analysis: string) => void;
}

export function StreamingAnalysis({ content, onAnalysisComplete }: StreamingAnalysisProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const startStreaming = async () => {
    setIsStreaming(true);
    setStreamedContent('');
    setError(null);
    
    try {
      const analysisService = new ContentAnalysisService();
      const stream = await analysisService.streamAnalysis(content);
      
      const reader = stream.getReader();
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
              
              if (data.type === 'content') {
                setStreamedContent(prev => prev + data.text);
              } else if (data.type === 'complete') {
                onAnalysisComplete?.(streamedContent);
              } else if (data.type === 'error') {
                setError(data.error);
                break;
              }
            } catch (parseError) {
              console.warn('Failed to parse streaming data:', line);
            }
          }
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Streaming failed');
    } finally {
      setIsStreaming(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <button
        onClick={startStreaming}
        disabled={isStreaming}
        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400"
      >
        {isStreaming ? '🔄 Analyzing...' : '🧠 Start Analysis'}
      </button>
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700">
          Error: {error}
        </div>
      )}
      
      {streamedContent && (
        <div className="p-4 bg-gray-50 rounded border">
          <div className="text-sm font-medium text-gray-700 mb-2">
            🎯 Real-time Analysis:
          </div>
          <div className="text-sm leading-relaxed">
            {streamedContent}
            {isStreaming && <span className="animate-pulse">|</span>}
          </div>
        </div>
      )}
    </div>
  );
}
```

***

## 📊 Analytics Dashboard Example

### **Usage Analytics Component**

```typescript
// components/AnalyticsDashboard.tsx
'use client';

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useMemo } from "react";

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  
  // Calculate time range in milliseconds
  const startTime = useMemo(() => {
    const now = Date.now();
    switch (timeRange) {
      case '1h': return now - (60 * 60 * 1000);
      case '24h': return now - (24 * 60 * 60 * 1000);
      case '7d': return now - (7 * 24 * 60 * 60 * 1000);
      case '30d': return now - (30 * 24 * 60 * 60 * 1000);
    }
  }, [timeRange]);
  
  // Fetch token usage stats
  const tokenStats = useQuery(api.tokenUsage.getTokenUsageStats, {
    startTime,
    endTime: Date.now(),
    limit: 1000
  });
  
  // Fetch recent stories
  const recentStories = useQuery(api.storyHistory.getRecentStories, {
    hours: timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : 168 // 7 days
  });
  
  // Calculate analytics
  const analytics = useMemo(() => {
    if (!tokenStats || !recentStories) return null;
    
    const totalCost = tokenStats.reduce((sum, record) => sum + record.estimated_cost, 0);
    const totalTokens = tokenStats.reduce((sum, record) => sum + record.total_tokens, 0);
    const successfulRequests = tokenStats.filter(record => record.success).length;
    const successRate = tokenStats.length > 0 ? (successfulRequests / tokenStats.length) * 100 : 0;
    
    const costByModel = tokenStats.reduce((acc, record) => {
      acc[record.model] = (acc[record.model] || 0) + record.estimated_cost;
      return acc;
    }, {} as Record<string, number>);
    
    const storiesByAgent = recentStories.reduce((acc, story) => {
      acc[story.agent_type] = (acc[story.agent_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalCost,
      totalTokens,
      successRate,
      requestCount: tokenStats.length,
      costByModel,
      storiesByAgent,
      avgCostPerRequest: tokenStats.length > 0 ? totalCost / tokenStats.length : 0
    };
  }, [tokenStats, recentStories]);
  
  if (!analytics) {
    return <div className="p-8 text-center">Loading analytics...</div>;
  }
  
  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex space-x-2">
        {(['1h', '24h', '7d', '30d'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-3 py-1 rounded text-sm ${
              timeRange === range
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {range}
          </button>
        ))}
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Cost"
          value={`$${analytics.totalCost.toFixed(4)}`}
          icon="💰"
          trend={analytics.avgCostPerRequest < 0.01 ? 'good' : 'warning'}
        />
        <MetricCard
          title="Total Tokens"
          value={analytics.totalTokens.toLocaleString()}
          icon="🎯"
        />
        <MetricCard
          title="Success Rate"
          value={`${analytics.successRate.toFixed(1)}%`}
          icon="✅"
          trend={analytics.successRate > 95 ? 'good' : 'warning'}
        />
        <MetricCard
          title="Requests"
          value={analytics.requestCount.toString()}
          icon="📊"
        />
      </div>
      
      {/* Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-3">💸 Cost by Model</h3>
          <div className="space-y-2">
            {Object.entries(analytics.costByModel).map(([model, cost]) => (
              <div key={model} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {model.replace('claude-3-5-', '').replace('-20241022', '')}
                </span>
                <span className="font-medium">${cost.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-3">📖 Stories by Agent</h3>
          <div className="space-y-2">
            {Object.entries(analytics.storiesByAgent).map(([agent, count]) => (
              <div key={agent} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 capitalize">
                  {agent === 'host' ? '📺 Host' : '✍️ Editor'}
                </span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="p-4 border rounded-lg">
        <h3 className="font-medium mb-3">⚡ Recent Activity</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {tokenStats?.slice(-10).reverse().map((record) => (
            <div key={record._id} className="flex justify-between items-center text-sm py-1">
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${
                  record.success ? 'bg-green-500' : 'bg-red-500'
                }`}></span>
                <span className="text-gray-600">
                  {record.action} • {record.model.replace('claude-3-5-', '').replace('-20241022', '')}
                </span>
              </div>
              <div className="flex space-x-4">
                <span className="text-gray-500">{record.total_tokens} tokens</span>
                <span className="font-medium">${record.estimated_cost.toFixed(4)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: string;
  trend?: 'good' | 'warning' | 'danger';
}

function MetricCard({ title, value, icon, trend }: MetricCardProps) {
  const trendColor = {
    good: 'border-green-200 bg-green-50',
    warning: 'border-yellow-200 bg-yellow-50',
    danger: 'border-red-200 bg-red-50'
  }[trend || 'good'];
  
  return (
    <div className={`p-4 border rounded-lg ${trend ? trendColor : 'bg-white'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{title}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
```

***

## 🔧 Advanced Implementation Examples

### **Custom Hook for Reddit Data**

```typescript
// hooks/useRedditFeed.ts
import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface UseRedditFeedOptions {
  subreddit: string;
  sort?: 'hot' | 'new' | 'rising' | 'top';
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useRedditFeed({
  subreddit,
  sort = 'hot',
  limit = 10,
  autoRefresh = false,
  refreshInterval = 30000
}: UseRedditFeedOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number | null>(null);
  
  // Convex queries and mutations
  const posts = useQuery(api.redditFeed.getLiveFeedPosts, { limit });
  const storePosts = useMutation(api.redditFeed.storeLiveFeedPosts);
  
  // Fetch posts from Reddit API
  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/reddit?subreddit=${subreddit}&sort=${sort}&limit=${limit}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch posts');
      }
      
      const data = await response.json();
      
      if (data.success && data.posts?.length > 0) {
        const batchId = `batch_${Date.now()}`;
        const liveFeedPosts = data.posts.map((post: any) => ({
          ...post,
          source: `${subreddit}/${sort}`,
          addedAt: Date.now(),
          batchId
        }));
        
        const result = await storePosts({ posts: liveFeedPosts, batchId });
        setLastFetch(Date.now());
        
        return {
          posts: liveFeedPosts,
          inserted: result.inserted,
          skipped: result.skipped
        };
      }
      
      return { posts: [], inserted: 0, skipped: 0 };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [subreddit, sort, limit, storePosts]);
  
  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(fetchPosts, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchPosts]);
  
  // Initial fetch
  useEffect(() => {
    if (!posts || posts.length === 0) {
      fetchPosts();
    }
  }, [subreddit]);
  
  return {
    posts: posts || [],
    isLoading,
    error,
    lastFetch,
    fetchPosts,
    refresh: fetchPosts
  };
}
```

### **Rate-Limited API Client**

```typescript
// lib/clients/rateLimitedClient.ts
export class RateLimitedAPIClient {
  private requestQueue: Array<{
    fn: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
    priority: number;
  }> = [];
  
  private processing = false;
  private lastRequest = 0;
  private requestCount = 0;
  private windowStart = Date.now();
  
  constructor(
    private maxRequestsPerMinute: number = 60,
    private minDelayBetweenRequests: number = 1000
  ) {}
  
  async request<T>(
    fn: () => Promise<T>,
    priority: number = 0
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ fn, resolve, reject, priority });
      this.requestQueue.sort((a, b) => b.priority - a.priority);
      this.processQueue();
    });
  }
  
  private async processQueue() {
    if (this.processing || this.requestQueue.length === 0) return;
    
    this.processing = true;
    
    while (this.requestQueue.length > 0) {
      // Check rate limit
      if (!this.canMakeRequest()) {
        const waitTime = this.getWaitTime();
        console.log(`⏳ Rate limit reached, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      const item = this.requestQueue.shift()!;
      
      try {
        // Enforce minimum delay between requests
        const timeSinceLastRequest = Date.now() - this.lastRequest;
        if (timeSinceLastRequest < this.minDelayBetweenRequests) {
          await new Promise(resolve => 
            setTimeout(resolve, this.minDelayBetweenRequests - timeSinceLastRequest)
          );
        }
        
        const result = await item.fn();
        this.updateRequestTracking();
        item.resolve(result);
        
      } catch (error) {
        item.reject(error);
      }
    }
    
    this.processing = false;
  }
  
  private canMakeRequest(): boolean {
    const now = Date.now();
    
    // Reset window if more than a minute has passed
    if (now - this.windowStart > 60000) {
      this.requestCount = 0;
      this.windowStart = now;
    }
    
    return this.requestCount < this.maxRequestsPerMinute;
  }
  
  private getWaitTime(): number {
    const now = Date.now();
    const windowEnd = this.windowStart + 60000;
    return Math.max(0, windowEnd - now);
  }
  
  private updateRequestTracking() {
    this.lastRequest = Date.now();
    this.requestCount++;
  }
  
  getStatus() {
    const now = Date.now();
    return {
      queueLength: this.requestQueue.length,
      requestsInWindow: this.requestCount,
      remainingRequests: this.maxRequestsPerMinute - this.requestCount,
      windowResetIn: Math.max(0, (this.windowStart + 60000) - now),
      processing: this.processing
    };
  }
}

// Usage example
const redditClient = new RateLimitedAPIClient(55, 1100); // Conservative limits

export async function fetchRedditPostsSafely(subreddit: string) {
  return redditClient.request(async () => {
    const response = await fetch(`/api/reddit?subreddit=${subreddit}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }, 5); // Medium priority
}

export async function fetchUrgentRedditPosts(subreddit: string) {
  return redditClient.request(async () => {
    const response = await fetch(`/api/reddit?subreddit=${subreddit}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }, 10); // High priority
}
```

***

## 🧪 Testing Examples

### **API Route Testing**

```typescript
// __tests__/api/reddit.test.ts
import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/reddit/route';

describe('/api/reddit', () => {
  describe('GET', () => {
    it('should fetch posts from a subreddit', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/reddit?subreddit=worldnews&limit=5'
      });
      
      const response = await GET(req as any);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.posts)).toBe(true);
      expect(data.posts.length).toBeLessThanOrEqual(5);
    });
    
    it('should handle invalid subreddit', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/reddit?subreddit=nonexistentsubreddit12345'
      });
      
      const response = await GET(req as any);
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });
    
    it('should respect rate limits', async () => {
      // Make multiple rapid requests
      const requests = Array.from({ length: 10 }, () => {
        const { req } = createMocks({
          method: 'GET',
          url: '/api/reddit?subreddit=test&limit=1'
        });
        return GET(req as any);
      });
      
      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);
      
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });
  
  describe('POST', () => {
    it('should batch fetch from multiple subreddits', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          subreddits: ['worldnews', 'technology'],
          limit: 3
        }
      });
      
      const response = await POST(req as any);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.results)).toBe(true);
      expect(data.results.length).toBe(2);
    });
  });
});
```

### **Component Testing**

```typescript
// __tests__/components/LiveFeedDisplay.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { LiveFeedDisplay } from '@/components/LiveFeedDisplay';

// Mock Convex client
const mockConvex = new ConvexReactClient('https://test.convex.cloud');

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ConvexProvider client={mockConvex}>
    {children}
  </ConvexProvider>
);

// Mock fetch
global.fetch = jest.fn();

describe('LiveFeedDisplay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should render feed controls', () => {
    render(
      <TestWrapper>
        <LiveFeedDisplay subreddit="worldnews" />
      </TestWrapper>
    );
    
    expect(screen.getByText('▶️ Start Live Feed')).toBeInTheDocument();
    expect(screen.getByText('🔄 Refresh Now')).toBeInTheDocument();
  });
  
  it('should fetch posts when refresh button is clicked', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        posts: [
          {
            id: 'test1',
            title: 'Test Post',
            author: 'testuser',
            subreddit: 'worldnews',
            score: 100,
            num_comments: 10,
            created_utc: Date.now() / 1000
          }
        ]
      })
    });
    
    render(
      <TestWrapper>
        <LiveFeedDisplay subreddit="worldnews" />
      </TestWrapper>
    );
    
    const refreshButton = screen.getByText('🔄 Refresh Now');
    fireEvent.click(refreshButton);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/reddit?subreddit=worldnews')
      );
    });
  });
  
  it('should handle fetch errors gracefully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Rate limit exceeded'
      })
    });
    
    render(
      <TestWrapper>
        <LiveFeedDisplay subreddit="worldnews" />
      </TestWrapper>
    );
    
    const refreshButton = screen.getByText('🔄 Refresh Now');
    fireEvent.click(refreshButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
      expect(screen.getByText(/Rate limit exceeded/)).toBeInTheDocument();
    });
  });
});
```

***

## 🚀 Deployment Examples

### **Vercel Deployment**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel

# Set environment variables
vercel env add REDDIT_CLIENT_ID
vercel env add REDDIT_CLIENT_SECRET
vercel env add REDDIT_USER_AGENT
vercel env add ANTHROPIC_API_KEY
vercel env add CONVEX_DEPLOYMENT
vercel env add NEXT_PUBLIC_CONVEX_URL

# Deploy with environment variables
vercel --prod
```

### **Railway Deployment**

```yaml
# railway.yml
version: 2

build:
  commands:
    - npm install
    - npm run build

deploy:
  startCommand: npm start
  
environments:
  production:
    variables:
      NODE_ENV: production
      PORT: 8888
```

### **Docker Deployment**

```dockerfile
# Dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./

USER nextjs
EXPOSE 8888
ENV PORT 8888

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  smnb:
    build: .
    ports:
      - "8888:8888"
    environment:
      - NODE_ENV=production
      - REDDIT_CLIENT_ID=${REDDIT_CLIENT_ID}
      - REDDIT_CLIENT_SECRET=${REDDIT_CLIENT_SECRET}
      - REDDIT_USER_AGENT=${REDDIT_USER_AGENT}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - CONVEX_DEPLOYMENT=${CONVEX_DEPLOYMENT}
      - NEXT_PUBLIC_CONVEX_URL=${NEXT_PUBLIC_CONVEX_URL}
    restart: unless-stopped
```

***

## 📚 Additional Resources

### **Useful Scripts**

```bash
# scripts/setup.sh - Development setup
#!/bin/bash
echo "🚀 Setting up SMNB development environment..."

# Install dependencies
npm install

# Copy environment template
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "✅ Created .env.local - please add your API keys"
fi

# Start Convex
echo "🔄 Starting Convex development server..."
npm run dev:convex &
CONVEX_PID=$!

# Wait for Convex to start
sleep 5

# Start Next.js
echo "🌐 Starting Next.js development server..."
npm run dev

# Cleanup on exit
trap "kill $CONVEX_PID" EXIT
```

```bash
# scripts/test.sh - Run all tests
#!/bin/bash
echo "🧪 Running SMNB test suite..."

# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint

echo "✅ All tests completed"
```

### **VSCode Settings**

```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "editor.formatOnSave": true,
  "files.associations": {
    "*.ts": "typescript"
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/dist": true
  }
}
```

```json
// .vscode/extensions.json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-playwright.playwright"
  ]
}
```

***

## 🎯 Best Practices Summary

### **Development**

* Always use TypeScript for type safety
* Implement proper error handling at every layer
* Use the custom hooks for common patterns
* Test both happy path and error scenarios
* Monitor API usage and costs

### **Performance**

* Implement caching strategies
* Use batching for API calls
* Optimize Convex queries with proper indexes
* Monitor performance metrics

### **Security**

* Never expose API keys to the client
* Validate all inputs server-side
* Implement rate limiting
* Use HTTPS in production

### **Deployment**

* Use environment variables for configuration
* Implement health checks
* Set up monitoring and alerting
* Use CI/CD for automated deployments

***

_For more architectural details, see_ [_System Architecture_](architecture.md)\
&#xNAN;_&#x46;or troubleshooting, see_ [_Error Handling Guide_](error-handling.md)
