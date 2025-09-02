'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSimpleLiveFeedStore } from '@/lib/stores/livefeed/simpleLiveFeedStore';
import { useHostAgentStore } from '@/lib/stores/host/hostAgentStore';
import { 
  ChevronDown, 
  ChevronRight,
  CheckCircle,
  XCircle,
  Settings,
  Activity,
  Zap,
  Monitor,
  Users
} from "lucide-react";
import { EnhancedRedditPost } from '@/lib/types/enhancedRedditPost';
import { LiveFeedPost } from '@/lib/stores/livefeed/simpleLiveFeedStore';

// Helper function to convert LiveFeedPost to EnhancedRedditPost
const convertLiveFeedPostToEnhanced = (post: LiveFeedPost): EnhancedRedditPost => {
  return {
    ...post,
    fetch_timestamp: post.fetched_at || post.addedAt,
    engagement_score: post.priority_score || 0,
    processing_status: 'raw' as const
  };
};

interface ControlSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string; }>;
  status: 'active' | 'inactive' | 'info';
}

export default function Controls() {
  const [newSubreddit, setNewSubreddit] = useState('');
  const [customSubreddits, setCustomSubreddits] = useState<string[]>([]);
  const [enabledDefaults, setEnabledDefaults] = useState<string[]>(['all', 'news', 'worldnews', 'technology']);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['feed-controls']));
  const [processedPostIds, setProcessedPostIds] = useState<Set<string>>(new Set());
  
  const { 
    posts,
    isLive,
    setSelectedSubreddits,
    setIsLive,
    contentMode,
    setContentMode 
  } = useSimpleLiveFeedStore();

  const {
    isActive: isHostActive,
    start: startBroadcasting,
    stop: stopBroadcasting,
    stats: hostStats,
    processLiveFeedPost
  } = useHostAgentStore();

  const allDefaultSubreddits = ['all', 'news', 'worldnews', 'technology', 'gaming', 'funny', 'todayilearned', 'askreddit'];

  const controlSections: ControlSection[] = [
    {
      id: 'feed-controls',
      title: 'Live Feed Controls',
      icon: Activity,
      status: isLive ? 'active' : 'inactive'
    },
    {
      id: 'host-controls',
      title: 'Host Configuration',
      icon: Monitor,
      status: isHostActive ? 'active' : 'inactive'
    },
    {
      id: 'subreddit-manager',
      title: 'Subreddit Manager',
      icon: Users,
      status: 'info'
    },
    {
      id: 'system-stats',
      title: 'System Statistics',
      icon: Zap,
      status: 'info'
    }
  ];

  const updateSelectedSubreddits = useCallback((enabledDefaults: string[], customSubreddits: string[]) => {
    const allSubreddits = [...enabledDefaults, ...customSubreddits];
    setSelectedSubreddits(allSubreddits);
  }, [setSelectedSubreddits]);

  const toggleSection = useCallback((sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  }, [expandedSections]);

  const handleToggleDefaultSubreddit = (subreddit: string) => {
    const updatedEnabledDefaults = enabledDefaults.includes(subreddit)
      ? enabledDefaults.filter(sub => sub !== subreddit)
      : [...enabledDefaults, subreddit];
    
    setEnabledDefaults(updatedEnabledDefaults);
    updateSelectedSubreddits(updatedEnabledDefaults, customSubreddits);
  };

  const handleAddSubreddit = () => {
    if (newSubreddit.trim() && !customSubreddits.includes(newSubreddit.trim().toLowerCase())) {
      const subredditToAdd = newSubreddit.trim().toLowerCase();
      const updatedCustom = [...customSubreddits, subredditToAdd];
      setCustomSubreddits(updatedCustom);
      updateSelectedSubreddits(enabledDefaults, updatedCustom);
      setNewSubreddit('');
    }
  };

  const getStatusIcon = (status: ControlSection['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-3 h-3 text-green-400" />;
      case 'inactive':
        return <XCircle className="w-3 h-3 text-gray-400" />;
      default:
        return <Settings className="w-3 h-3 text-blue-400" />;
    }
  };

  // Auto-feed live feed posts to host when both are active
  useEffect(() => {
    if (!isLive || !isHostActive || posts.length === 0) {
      return;
    }

    // Find new posts that haven't been processed yet
    const newPosts = posts.filter(post => !processedPostIds.has(post.id));
    
    if (newPosts.length === 0) {
      return; // No new posts to process
    }

    console.log(`🔄 HOST FEED: Found ${newPosts.length} new posts to process`);
    
    // Process new posts one by one with delays
    newPosts.slice(0, 5).forEach((post, index) => { // Process up to 5 new posts
      setTimeout(() => {
        console.log(`📤 HOST FEED: Sending post ${index + 1}/${Math.min(newPosts.length, 5)} to host: ${post.title.substring(0, 50)}...`);
        const enhancedPost = convertLiveFeedPostToEnhanced(post);
        processLiveFeedPost(enhancedPost);
        
        // Mark this post as processed
        setProcessedPostIds(prev => new Set(prev).add(post.id));
        console.log(`✅ HOST FEED: Marked post as processed: ${post.id}`);
      }, index * 3000); // 3-second delay between posts for better pacing
    });

  }, [posts, isLive, isHostActive, processLiveFeedPost, processedPostIds, setProcessedPostIds]);

  // Reset processed posts when host broadcasting state changes
  useEffect(() => {
    if (!isHostActive) {
      setProcessedPostIds(new Set()); // Clear processed posts when host stops
      console.log('🗑️ HOST FEED: Cleared processed posts cache');
    }
  }, [isHostActive, setProcessedPostIds]);

  useEffect(() => {
    updateSelectedSubreddits(enabledDefaults, customSubreddits);
  }, [enabledDefaults, customSubreddits, updateSelectedSubreddits]);

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between text-xs uppercase text-muted-foreground px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          <span>Control Panel</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-400' : 'bg-gray-400'}`} />
          <span className="text-xs">{isLive ? 'LIVE' : 'OFF'}</span>
        </div>
      </div>

      {/* Control Sections */}
      <div className="flex-1 overflow-auto">
        <div className="p-1 space-y-1">
          {controlSections.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSections.has(section.id);
            
            return (
              <div key={section.id} className="space-y-1">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 rounded text-foreground text-sm transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-3 h-3 flex-shrink-0" />
                  )}
                  
                  <Icon className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                  <span className="flex-1 text-left truncate">{section.title}</span>
                  
                  <div className="flex items-center gap-2">
                    {getStatusIcon(section.status)}
                  </div>
                </button>

                {/* Section Content */}
                {isExpanded && (
                  <div className="ml-6 px-2 py-1 text-xs text-foreground bg-muted/20 rounded border border-muted/20">
                    
                    {section.id === 'feed-controls' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => setIsLive(!isLive)}
                            className={`px-3 py-1 text-xs rounded transition-colors cursor-pointer ${
                              isLive 
                                ? 'bg-red-500 hover:bg-red-600 text-white' 
                                : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}
                          >
                            {isLive ? '⏹️ Stop Feed' : '▶️ Start Feed'}
                          </button>
                          <div className="text-xs text-muted-foreground">
                            {posts.length} posts loaded
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground uppercase">Content Mode</div>
                          <div className="flex gap-1">
                            {(['sfw', 'nsfw'] as const).map((mode) => (
                              <button
                                key={mode}
                                onClick={() => setContentMode(mode)}
                                className={`px-2 py-1 text-xs rounded transition-colors cursor-pointer ${
                                  contentMode === mode
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                }`}
                              >
                                {mode.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {section.id === 'host-controls' && (
                      <div className="space-y-3">
                        <div className="text-muted-foreground text-xs uppercase">Host Status</div>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Status:</span>
                            <span className={isHostActive ? 'text-green-400' : 'text-gray-400'}>
                              {isHostActive ? 'Broadcasting' : 'Standby'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Narrations:</span>
                            <span className="text-blue-400">{hostStats.totalNarrations}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Queue:</span>
                            <span className="text-blue-400">{hostStats.queueLength}</span>
                          </div>
                        </div>
                        <button 
                          onClick={isHostActive ? stopBroadcasting : startBroadcasting}
                          className={`w-full px-3 py-1 text-xs rounded transition-colors cursor-pointer ${
                            isHostActive 
                              ? 'bg-red-500 hover:bg-red-600 text-white'
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                        >
                          {isHostActive ? '📴 Stop Broadcasting' : '📡 Start Broadcasting'}
                        </button>
                      </div>
                    )}

                    {section.id === 'subreddit-manager' && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <div className="text-muted-foreground text-xs uppercase">Default Subreddits</div>
                          <div className="grid grid-cols-2 gap-1">
                            {allDefaultSubreddits.map((subreddit) => (
                              <button
                                key={subreddit}
                                onClick={() => handleToggleDefaultSubreddit(subreddit)}
                                className={`px-2 py-1 text-xs rounded transition-colors cursor-pointer ${
                                  enabledDefaults.includes(subreddit)
                                    ? 'bg-green-500 text-white'
                                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                }`}
                              >
                                r/{subreddit}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-muted-foreground text-xs uppercase">Add Custom</div>
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={newSubreddit}
                              onChange={(e) => setNewSubreddit(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleAddSubreddit()}
                              placeholder="subreddit name"
                              className="flex-1 px-2 py-1 text-xs bg-background border border-border rounded"
                            />
                            <button
                              onClick={handleAddSubreddit}
                              className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors cursor-pointer"
                            >
                              Add
                            </button>
                          </div>
                          {customSubreddits.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {customSubreddits.map((subreddit) => (
                                <button
                                  key={subreddit}
                                  onClick={() => setCustomSubreddits(customSubreddits.filter(s => s !== subreddit))}
                                  className="px-2 py-1 text-xs bg-yellow-500 hover:bg-yellow-600 text-white rounded transition-colors cursor-pointer"
                                >
                                  r/{subreddit} ×
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {section.id === 'system-stats' && (
                      <div className="space-y-2">
                        <div className="text-muted-foreground text-xs uppercase">Statistics</div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex justify-between">
                            <span>Posts:</span>
                            <span className="text-blue-400">{posts.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Sources:</span>
                            <span className="text-blue-400">{enabledDefaults.length + customSubreddits.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Status:</span>
                            <span className={isLive ? 'text-green-400' : 'text-gray-400'}>
                              {isLive ? 'Running' : 'Stopped'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Mode:</span>
                            <span className="text-blue-400">{contentMode.toUpperCase()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
