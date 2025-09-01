/**
 * Host Column Component
 * 
 * Main integration component that combines the host agent service,
 * waterfall narration display, and control components into a 
 * complete news host system
 */

'use client';

import React, { useEffect, useState, useCallback } from "react";
import { WaterfallNarration } from "@/components/host/WaterfallNarration";
import { HostControls } from "@/components/host/HostControls";
import { LLMServiceStatus } from "@/components/host/LLMServiceStatus";
import { HostAgentService } from "@/lib/services/host/hostAgentService";
import { 
  HostNarration, 
  HostAgentConfig, 
  HostState,
  DEFAULT_HOST_CONFIG,
  NewsItem
} from "@/lib/types/hostAgent";
import { useSimpleLiveFeedStore } from "@/lib/stores/livefeed/simpleLiveFeedStore";

interface RedditPost {
  id?: string;
  title?: string;
  selftext?: string;
  author?: string;
  created_utc?: number;
  ups?: number;
  num_comments?: number;
  url?: string;
  subreddit?: string;
  link_flair_text?: string;
}

export default function Host() {
  // Host agent state
  const [hostAgent, setHostAgent] = useState<HostAgentService | null>(null);
  const [currentNarration, setCurrentNarration] = useState<HostNarration | null>(null);
  const [isHostActive, setIsHostActive] = useState(false);
  const [hostConfig, setHostConfig] = useState<HostAgentConfig>(DEFAULT_HOST_CONFIG);
  const [hostStats, setHostStats] = useState<HostState['stats']>({
    itemsProcessed: 0,
    totalNarrations: 0,
    averageReadTime: 0,
    queueLength: 0,
    uptime: 0
  });

  // Get live feed data
  const { posts, isLive, selectedSubreddits } = useSimpleLiveFeedStore();

  // Initialize host agent
  useEffect(() => {
    console.log('🎙️ Initializing Host Agent...');
    
    // Create host agent (will automatically choose Claude or Mock based on API key)
    const agent = new HostAgentService(hostConfig);
    
    // Set up event listeners
    agent.on('narration:started', (narration: HostNarration) => {
      console.log(`🎬 Narration started: ${narration.id}`);
      setCurrentNarration(narration);
    });
    
    agent.on('narration:completed', (narration: HostNarration) => {
      console.log(`✅ Narration completed: ${narration.id}`);
      // Keep narration visible for a moment before clearing
      setTimeout(() => setCurrentNarration(null), 2000);
    });
    
    agent.on('host:started', () => {
      console.log('✅ Host agent started');
      setIsHostActive(true);
    });
    
    agent.on('host:stopped', () => {
      console.log('⏹️ Host agent stopped');
      setIsHostActive(false);
      setCurrentNarration(null);
    });

    agent.on('stats:updated', (stats: HostState['stats']) => {
      setHostStats(stats);
    });
    
    agent.on('error', (error: Error) => {
      console.error('🚨 Host agent error:', error);
    });
    
    setHostAgent(agent);
    console.log('✅ Host Agent initialized');
    
    return () => {
      console.log('🧹 Cleaning up Host Agent...');
      agent.stop();
      agent.removeAllListeners();
    };
  }, [hostConfig]); // Re-initialize when config changes

  // Convert live feed posts to news items and process them
  const convertPostToNewsItem = useCallback((post: RedditPost): NewsItem => {
    return {
      id: post.id || `post-${Date.now()}`,
      content: post.title || post.selftext || '',
      author: post.author || 'unknown',
      timestamp: new Date((post.created_utc || 0) * 1000 || Date.now()),
      platform: 'reddit' as const,
      engagement: {
        likes: post.ups || 0,
        comments: post.num_comments || 0,
        shares: 0
      },
      url: post.url,
      subreddit: post.subreddit,
      title: post.title,
      hashtags: post.link_flair_text ? [post.link_flair_text] : undefined
    };
  }, []);

  // Process new posts from live feed
  useEffect(() => {
    if (!hostAgent || !isHostActive || posts.length === 0) {
      return;
    }

    console.log(`📥 Processing ${posts.length} new posts for host agent`);
    
    // Process each post
    posts.forEach(post => {
      try {
        const newsItem = convertPostToNewsItem(post);
        hostAgent.processNewsItem(newsItem);
      } catch (error) {
        console.error('❌ Failed to process post:', error);
      }
    });
  }, [posts, hostAgent, isHostActive, convertPostToNewsItem]);

  // Host control handlers
  const handleToggleHost = useCallback(() => {
    if (!hostAgent) {
      console.error('❌ Host agent not initialized');
      return;
    }
    
    if (isHostActive) {
      console.log('⏹️ Stopping host agent...');
      hostAgent.stop();
    } else {
      console.log('▶️ Starting host agent...');
      hostAgent.start();
    }
  }, [hostAgent, isHostActive]);

  const handleConfigChange = useCallback((newConfig: Partial<HostAgentConfig>) => {
    console.log('⚙️ Updating host configuration:', newConfig);
    setHostConfig(prev => ({ ...prev, ...newConfig }));
    
    if (hostAgent) {
      hostAgent.updateConfig(newConfig);
    }
  }, [hostAgent]);

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
            {/* Header */}
      <div className="border-b border-border bg-muted/50">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <span className="text-lg">🎙️</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">News Host</h3>
              <p className="text-xs text-muted-foreground">
                AI-powered news narration system
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            {/* Live Feed Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`} />
              <span className="text-muted-foreground">
                Feed: {isLive ? 'Live' : 'Stopped'}
              </span>
            </div>
            
            {/* Host Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                isHostActive ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'
              }`} />
              <span className="text-muted-foreground">
                Host: {isHostActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            {/* Posts Count */}
            <div className="text-muted-foreground">
              {posts.length} posts • {selectedSubreddits.length} subreddits
            </div>
          </div>
        </div>
        
        {/* Status Messages */}
        {!isLive && (
          <div className="px-4 pb-3">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
                <span className="text-yellow-800 dark:text-yellow-200">
                  Live feed is not running. Go to <strong>Controls</strong> and click <strong>Start</strong> to begin receiving posts.
                </span>
              </div>
            </div>
          </div>
        )}
        
        {isLive && !isHostActive && (
          <div className="px-4 pb-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-blue-600 dark:text-blue-400">💡</span>
                <span className="text-blue-800 dark:text-blue-200">
                  Feed is running with {posts.length} posts. Click <strong>Start Broadcasting</strong> below to begin host narration.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Waterfall narration display */}
        <div className="flex-1 min-h-0">
          <WaterfallNarration 
            narration={currentNarration}
            isActive={isHostActive}
            speed={hostConfig.waterfallSpeed}
            maxSegments={6}
          />
        </div>

        {/* Controls section */}
        <div className="border-t border-border bg-muted/20">
          <div className="p-4">
            {/* LLM Service Status */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-foreground mb-3">AI Service</h4>
              <LLMServiceStatus />
            </div>
            
            <div className="mb-4">
              <h4 className="text-sm font-medium text-foreground mb-3">Host Controls</h4>
              <HostControls
                isActive={isHostActive}
                onToggle={handleToggleHost}
                config={hostConfig}
                onConfigChange={handleConfigChange}
              />
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Statistics</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-background border border-border rounded p-2 text-center">
                  <div className="text-lg font-semibold text-foreground">{hostStats.itemsProcessed}</div>
                  <div className="text-xs text-muted-foreground">Items Processed</div>
                </div>
                <div className="bg-background border border-border rounded p-2 text-center">
                  <div className="text-lg font-semibold text-foreground">{hostStats.queueLength}</div>
                  <div className="text-xs text-muted-foreground">Queue Length</div>
                </div>
                <div className="bg-background border border-border rounded p-2 text-center">
                  <div className="text-lg font-semibold text-foreground">{hostStats.totalNarrations}</div>
                  <div className="text-xs text-muted-foreground">Total Narrations</div>
                </div>
                <div className="bg-background border border-border rounded p-2 text-center">
                  <div className="text-lg font-semibold text-foreground">{Math.floor(hostStats.uptime / 60)}m</div>
                  <div className="text-xs text-muted-foreground">Uptime</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status footer */}
      <div className="p-3 border-t border-border bg-muted/40 text-xs text-muted-foreground">
        <div className="flex justify-between items-center">
          <span>
            Mode: {hostConfig.enableMockMode ? 'Development' : 'Production'} • 
            Personality: {hostConfig.personality} • 
            Detail: {hostConfig.verbosity}
          </span>
          <span>
            {posts.length} posts in feed
          </span>
        </div>
      </div>
    </div>
  );
}
