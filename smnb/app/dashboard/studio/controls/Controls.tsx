// STUDIO CONTROLS
// /Users/matthewsimon/Projects/SMNB/smnb/app/dashboard/studio/controls/Controls.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSimpleLiveFeedStore } from '@/lib/stores/livefeed/simpleLiveFeedStore';
import { useHostAgentStore } from '@/lib/stores/host/hostAgentStore';
import { useProducerStore } from '@/lib/stores/producer/producerStore';
import { useApiKeyStore } from '@/lib/stores/apiKeyStore';
import { useQueueManagerStore } from '@/lib/stores/queueManagerStore';
// import { useEditorAgentStore } from '@/lib/stores/host/editorAgentStore'; // Commented out - editor functionality disabled
import { StudioMode } from '../Studio';
import { 
  ChevronDown, 
  ChevronRight,
  CheckCircle,
  XCircle,
  Settings,
  Activity,
  Zap,
  Users,
  Mic,
  Edit3,
  Play,
  Pause
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
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

interface ControlsProps {
  mode: StudioMode;
  onModeChange: (mode: StudioMode) => void;
}

export default function Controls({ mode, onModeChange }: ControlsProps) {
  const [newSubreddit, setNewSubreddit] = useState('');
  const [customSubreddits, setCustomSubreddits] = useState<string[]>([]);
  const [enabledDefaults, setEnabledDefaults] = useState<string[]>(['all', 'news', 'worldnews', 'technology']);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['feed-controls', 'mode-controls']));
  const [processedPostIds, setProcessedPostIds] = useState<Set<string>>(new Set());
  
  // Filter states for Primary and Secondary columns (acting as one list)
  const [activeFilter, setActiveFilter] = useState<string | null>('news');

  // Subreddit mappings for each filter category
  const filterSubreddits = {
    news: ['news', 'worldnews', 'politics', 'economics', 'breakingnews'],
    worldnews: ['worldnews', 'geopolitics', 'europe', 'asia', 'internationalnews'],
    tech: ['technology', 'programming', 'startups', 'gadgets', 'artificial'],
    sports: ['sports', 'nfl', 'nba', 'soccer', 'olympics'],
    gaming: ['gaming', 'pcgaming', 'nintendo', 'playstation', 'xbox'],
    funny: ['funny', 'memes', 'dankmemes', 'wholesomememes', 'jokes'],
    learning: ['todayilearned', 'explainlikeimfive', 'askscience', 'history', 'documentaries'],
    social: ['askreddit', 'relationships', 'advice', 'socialskills', 'confession']
  };

  // Get current subreddits based on active filter
  const getCurrentSubreddits = () => {
    return activeFilter ? filterSubreddits[activeFilter as keyof typeof filterSubreddits] || [] : [];
  };

  // Auto-select all subreddits when filter changes
  useEffect(() => {
    const currentSubreddits = getCurrentSubreddits();
    setEnabledDefaults(currentSubreddits);
  }, [activeFilter]);

  // Split subreddits between Primary (first 3, since first row is search) and Secondary (remaining)
  const getPrimarySubreddits = () => {
    const allSubreddits = [...enabledDefaults, ...customSubreddits];
    return allSubreddits.slice(0, 3);
  };

  const getSecondarySubreddits = () => {
    const allSubreddits = [...enabledDefaults, ...customSubreddits];
    return allSubreddits.slice(3, 7);
  };
  
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
    start: startHostBroadcasting,
    stop: stopHostBroadcasting,
    stats: hostStats,
    processLiveFeedPost
  } = useHostAgentStore();

  const {
    isActive: isProducerActive,
    startProducer,
    stopProducer
  } = useProducerStore();

  const {
    useUserApiKey,
    setUseUserApiKey,
    hasValidKey: hasValidApiKey
  } = useApiKeyStore();

  const {
    initializeQueueManager,
    clearQueueBySubreddit,
    refreshStats,
    getDetailedStatus
  } = useQueueManagerStore();

  // Editor agent store - commented out
  /*
  const {
    isActive: isEditorActive,
    start: startEditorAgent,
    stop: stopEditorAgent,
    processPost: processEditorPost,
    stats: editorStats
  } = useEditorAgentStore();
  */

  // Mock editor values for compatibility
  const isEditorActive = false;
  const startEditorAgent = () => {};
  const stopEditorAgent = () => {};
  const processEditorPost = (_post: unknown) => {}; // Accept parameter but do nothing
  const editorStats = { totalWords: 0, sessionsCompleted: 0 };

  const allDefaultSubreddits = ['all', 'news', 'worldnews', 'technology', 'gaming', 'funny', 'todayilearned', 'askreddit'];

  // Combined broadcast function that starts/stops both host and producer
  const handleBroadcastToggle = async () => {
    try {
      if (isHostActive) {
        // Stop both host and producer
        console.log('🎙️ CONTROLS: Stopping broadcast - stopping both host and producer');
        await stopHostBroadcasting();
        if (isProducerActive) {
          await stopProducer();
        }
      } else {
        // Start both host and producer
        console.log('🎙️ CONTROLS: Starting broadcast - starting both host and producer');
        await startHostBroadcasting();
        if (!isProducerActive) {
          await startProducer();
        }
      }
    } catch (error) {
      console.error('🎙️ CONTROLS: Error toggling broadcast:', error);
    }
  };

  const controlSections: ControlSection[] = [
    {
      id: 'mode-controls',
      title: 'Studio Mode',
      icon: Settings,
      status: 'info'
    },
    {
      id: 'feed-controls',
      title: 'Live Feed Controls',
      icon: Activity,
      status: isLive ? 'active' : 'inactive'
    },
    {
      id: 'agent-controls',
      title: mode === 'host' ? 'Host Configuration' : 'Editor Configuration',
      icon: mode === 'host' ? Mic : Edit3,
      status: (mode === 'host' ? isHostActive : isEditorActive) ? 'active' : 'inactive'
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

  // Toggle filter - deactivate if already active, otherwise activate
  const handleToggleFilter = (filter: string) => {
    if (activeFilter === filter) {
      // Deactivate current filter - clear all selections
      setActiveFilter(null);
      setEnabledDefaults([]);
    } else {
      // Activate new filter
      setActiveFilter(filter);
    }
  };

  const handleRemoveSubreddit = async (subreddit: string) => {
    try {
      // Remove from enabledDefaults
      const updatedEnabledDefaults = enabledDefaults.filter(s => s !== subreddit);
      setEnabledDefaults(updatedEnabledDefaults);
      
      // Also remove from customSubreddits if it exists there
      const updatedCustom = customSubreddits.filter(s => s !== subreddit);
      setCustomSubreddits(updatedCustom);
      
      // Update the selected subreddits
      updateSelectedSubreddits(updatedEnabledDefaults, updatedCustom);
      
      console.log(`🗑️ Removed subreddit: ${subreddit}`);
      
      // Clear queue items for this subreddit
      try {
        const result = await clearQueueBySubreddit(subreddit);
        if (result.totalCleared > 0) {
          console.log(`✅ Queue cleared for r/${subreddit}: ${result.totalCleared} items (Host: ${result.hostQueueCleared}, Scheduled: ${result.scheduledPostsCleared})`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to clear queue for r/${subreddit}:`, error);
        // Don't block the UI operation if queue clearing fails
      }
    } catch (error) {
      console.error(`❌ Error removing subreddit ${subreddit}:`, error);
    }
  };

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

  // Auto-feed live feed posts to current agent (host or editor) when both are active
  useEffect(() => {
    const isAgentActive = mode === 'host' ? isHostActive : isEditorActive;
    
    if (!isLive || !isAgentActive || posts.length === 0) {
      return;
    }

    // Find new posts that haven't been processed yet
    const newPosts = posts.filter(post => !processedPostIds.has(post.id));
    
    if (newPosts.length === 0) {
      return; // No new posts to process
    }

    const agentLabel = mode.toUpperCase();
    console.log(`🔄 ${agentLabel} FEED: Found ${newPosts.length} new posts to process`);
    
    // Process new posts one by one with delays - limit to prevent overflow
    const postsToProcess = newPosts.slice(0, 3); // Process up to 3 new posts at a time
    postsToProcess.forEach((post, index) => {
      setTimeout(() => {
        // Double-check the post wasn't processed by another effect
        if (processedPostIds.has(post.id)) {
          console.log(`⏭️ ${agentLabel} FEED: Post ${post.id} already processed, skipping`);
          return;
        }
        
        console.log(`📤 ${agentLabel} FEED: Sending post ${index + 1}/${postsToProcess.length} to ${mode}: ${post.title.substring(0, 50)}...`);
        
        if (mode === 'host') {
          const enhancedPost = convertLiveFeedPostToEnhanced(post);
          processLiveFeedPost(enhancedPost);
        } else if (mode === 'editor') {
          processEditorPost(post as unknown as Record<string, unknown>);
        }
        
        // Mark this post as processed immediately
        setProcessedPostIds(prev => {
          const newSet = new Set(prev);
          newSet.add(post.id);
          return newSet;
        });
        console.log(`✅ ${agentLabel} FEED: Marked post as processed: ${post.id}`);
      }, index * 3000); // 3-second delay between posts for better pacing
    });

  }, [posts, isLive, mode, isHostActive, isEditorActive, processLiveFeedPost, processEditorPost, processedPostIds]);

  // Reset processed posts when agent state changes
  useEffect(() => {
    const isAgentActive = mode === 'host' ? isHostActive : isEditorActive;
    
    if (!isAgentActive) {
      setProcessedPostIds(new Set()); // Clear processed posts when agent stops
      console.log(`🗑️ ${mode.toUpperCase()} FEED: Cleared processed posts cache`);
    }
  }, [mode, isHostActive, isEditorActive, setProcessedPostIds]);

  useEffect(() => {
    updateSelectedSubreddits(enabledDefaults, customSubreddits);
  }, [enabledDefaults, customSubreddits, updateSelectedSubreddits]);

  // Initialize queue manager
  useEffect(() => {
    initializeQueueManager();
  }, [initializeQueueManager]);

  return (
    <div className="bg-card border border-border rounded-t-xs rounded-b-lg shadow-sm flex flex-col min-h-0">
      {/* Compact Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-light text-muted-foreground font-sans">Control Panel</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-400' : 'bg-gray-400'}`} />
          <span className="text-xs text-muted-foreground/70">{isLive ? 'LIVE' : 'OFF'}</span>
        </div>
      </div>

      {/* Horizontal Table Layout - Custom Column Widths */}
      <div className="p-3">
        <div className="grid grid-cols-[minmax(0,0.5fr)_0.7fr_0.6fr_1fr_0.75fr] gap-3 h-full">
          
          {/* Column 1: Master Live Control */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground/70 uppercase tracking-wider">System</div>
            <div 
              className={`bg-[#1a1a1a] rounded-sm px-1 py-3 border border-border/20 text-center space-y-2 ${
                !(isLive && isHostActive) ? 'cursor-pointer hover:bg-[#1f1f1f] transition-colors' : ''
              }`}
              onClick={() => {
                // Only handle click if not active (big button to start)
                if (!(isLive && isHostActive)) {
                  if (!isLive) setIsLive(true);
                  if (!isHostActive) handleBroadcastToggle();
                }
              }}
            >
              <div className={`w-4 h-4 rounded-full mx-auto ${(isLive && isHostActive) ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground/50">Feed: {posts.length}</div>
                <div className="text-xs text-muted-foreground/50">Queue: {hostStats.queueLength}</div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent container click
                  if (isLive && isHostActive) {
                    // Stop when active
                    setIsLive(false);
                    handleBroadcastToggle();
                  } else {
                    // Start when inactive
                    if (!isLive) setIsLive(true);
                    if (!isHostActive) handleBroadcastToggle();
                  }
                }}
                className={`px-2 py-1 text-xs rounded-sm transition-colors cursor-pointer relative ${
                  (isLive && isHostActive)
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-card text-muted-foreground border border-border hover:bg-card/80'
                }`}
              >
                {(isLive && isHostActive) ? (
                  <>
                    <Pause className="w-3 h-3 absolute left-1 top-1/2 transform -translate-y-1/2" />
                    <span className="text-center w-full pl-4">Stop</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 absolute left-1 top-1/2 transform -translate-y-1/2" />
                    <span className="text-center w-full pl-4">Live</span>
                  </>
                )}
              </button>
            </div>
            {/* Content Mode Toggle */}
            <div className="flex gap-1">
              {(['sfw', 'nsfw'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setContentMode(mode)}
                  className={`flex-1 px-1 py-1 text-xs rounded-sm transition-colors cursor-pointer ${
                    contentMode === mode
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-[#1a1a1a] text-muted-foreground/50 hover:text-muted-foreground/70'
                  }`}
                >
                  {mode.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Column 2: Add Subreddits */}
          <div className="space-y-2 min-w-0">
            <div className="text-xs text-muted-foreground/70 uppercase tracking-wider">Add Subreddits</div>
            <div className="rounded-sm px-0 space-y-1">
              {[0, 1, 2, 3].map((index) => {
                // First row (index 0) is search input
                if (index === 0) {
                  return (
                    <div key="add-input" className="flex gap-1">
                      <input
                        type="text"
                        placeholder="add"
                        className="flex-1 px-1 py-1 text-xs bg-[#1a1a1a] border border-border/20 rounded-sm text-muted-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-0"
                      />
                      <button
                        className="px-1 py-1 text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  );
                }
                
                // Remaining rows (index 1, 2, 3) show subreddits (offset by -1)
                const subreddit = getPrimarySubreddits()[index - 1];
                return subreddit ? (
                  enabledDefaults.includes(subreddit) ? (
                    <div
                      key={subreddit}
                      className="w-full px-2 py-1.25 text-xs rounded-sm bg-green-500/20 text-green-400 flex items-center gap-2 group relative"
                    >
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="truncate">{subreddit}</span>
                      <button
                        onClick={() => handleRemoveSubreddit(subreddit)}
                        className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 flex items-center justify-center text-red-400 hover:text-red-300 text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div
                      key={subreddit}
                      className="w-full px-2 py-1.25 text-xs rounded-sm transition-colors cursor-pointer flex items-center gap-2 bg-[#0d0d0d] text-muted-foreground/50 hover:text-muted-foreground/70 group relative"
                      onClick={() => handleToggleDefaultSubreddit(subreddit)}
                    >
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      <span className="truncate">{subreddit}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSubreddit(subreddit);
                        }}
                        className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 flex items-center justify-center text-red-400 hover:text-red-300 text-xs"
                      >
                        ×
                      </button>
                    </div>
                  )
                ) : (
                  <div
                    key={`empty-${index}`}
                    className="w-full px-2 py-1.25 text-xs rounded-sm border border-border/20 text-muted-foreground/30 italic flex items-center"
                  >
                    subreddit...
                  </div>
                );
              })}
            </div>
            
            {/* 4 Filter Badges at bottom of Primary column */}
            <div className="flex gap-1">
              {['news', 'worldnews', 'tech', 'sports'].map((filter, i) => (
                <button
                  key={i}
                  onClick={() => handleToggleFilter(filter)}
                  className={`flex-1 px-1 py-1 text-xs rounded-sm transition-colors cursor-pointer ${
                    activeFilter === filter
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-[#1a1a1a] text-muted-foreground/50 hover:text-muted-foreground/70'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Column 3: Secondary Sources (no header) */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground/70 uppercase tracking-wider">&nbsp;</div>
            <div className="rounded-sm px-0 space-y-1">
              {[0, 1, 2, 3].map((index) => {
                const subreddit = getSecondarySubreddits()[index];
                return subreddit ? (
                  enabledDefaults.includes(subreddit) ? (
                    <div
                      key={subreddit}
                      className="w-full px-2 py-1 text-xs rounded-sm bg-green-500/20 text-green-400 flex items-center gap-2 group relative"
                    >
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="truncate">{subreddit}</span>
                      <button
                        onClick={() => handleRemoveSubreddit(subreddit)}
                        className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 flex items-center justify-center text-red-400 hover:text-red-300 text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div
                      key={subreddit}
                      className="w-full px-2 py-1 text-xs rounded-sm transition-colors cursor-pointer flex items-center gap-2 bg-[#0d0d0d] text-muted-foreground/50 hover:text-muted-foreground/70 group relative"
                      onClick={() => handleToggleDefaultSubreddit(subreddit)}
                    >
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      <span className="truncate">{subreddit}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSubreddit(subreddit);
                        }}
                        className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 flex items-center justify-center text-red-400 hover:text-red-300 text-xs"
                      >
                        ×
                      </button>
                    </div>
                  )
                ) : (
                  <div
                    key={`empty-${index}`}
                    className="w-full px-2 py-1.25 text-xs rounded-sm border border-border/20 text-muted-foreground/30 italic flex items-center"
                  >
                    subreddit...
                  </div>
                );
              })}
            </div>
            
            {/* 4 Filter Badges at bottom of Secondary column */}
            <div className="flex gap-1">
              {['gaming', 'funny', 'learning', 'social'].map((filter, i) => (
                <button
                  key={i}
                  onClick={() => handleToggleFilter(filter)}
                  className={`flex-1 px-1 py-1 text-xs rounded-sm transition-colors cursor-pointer ${
                    activeFilter === filter
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-[#1a1a1a] text-muted-foreground/50 hover:text-muted-foreground/70'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Column 4: Search */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground/70 uppercase tracking-wider">Search</div>
            <div className="space-y-1">
              {/* Search Input - matching Custom input */}
              <div className="flex gap-1">
                <input
                  type="text"
                  placeholder="search"
                  className="flex-1 px-1 py-1 text-xs bg-[#1a1a1a] border border-border/20 rounded-sm text-muted-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-0"
                />
                <button
                  className="px-1 py-1 text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>
              
              {/* Search Terms Container - Empty badges for custom searches */}
              <div className="space-y-1">
                {/* Empty placeholder badges - will be populated with custom searches */}
                <div className="px-2 py-1 mr-4.5 text-xs rounded-sm bg-[#1a1a1a] text-muted-foreground/30 italic border border-border/20">
                  Custom...
                </div>
                <div className="px-2 py-1 mr-4.5 text-xs rounded-sm bg-[#1a1a1a] text-muted-foreground/30 italic border border-border/20">
                  Custom...
                </div>
                <div className="px-2 py-1 mr-4.5 text-xs rounded-sm bg-[#1a1a1a] text-muted-foreground/30 italic border border-border/20">
                  Custom...
                </div>
              </div>
            </div>
          </div>

          {/* Column 5: Config */}
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground/70 uppercase tracking-wider">Config</div>
            <div className="space-y-2">
              {/* Custom subreddits list */}
              <div className="space-y-1 max-h-16 overflow-y-auto">
                {customSubreddits.map((subreddit) => (
                  <button
                    key={subreddit}
                    onClick={() => setCustomSubreddits(customSubreddits.filter(s => s !== subreddit))}
                    className="w-full px-2 py-1 text-xs rounded-sm transition-colors cursor-pointer flex items-center gap-2 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                  >
                    <div className="w-2 h-2 rounded-full bg-yellow-400" />
                    <span className="truncate flex-1">{subreddit}</span>
                    <span className="text-yellow-300">×</span>
                  </button>
                ))}
              </div>

              {/* Stats Panel */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground/70">Sources</span>
                  <span className="text-xs font-mono text-muted-foreground">{enabledDefaults.length + customSubreddits.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground/70">Stories</span>
                  <span className="text-xs font-mono text-muted-foreground">{hostStats.totalNarrations}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground/70">Mode</span>
                  <span className="text-xs font-mono text-muted-foreground">HOST</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground/70">Content</span>
                  <span className="text-xs font-mono text-muted-foreground">{contentMode.toUpperCase()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground/70">API</span>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={useUserApiKey}
                      onCheckedChange={setUseUserApiKey}
                      className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-gray-600"
                      style={{ transform: 'scale(0.7)' }}
                    />
                    <span className={`text-xs font-mono ${
                      useUserApiKey 
                        ? (hasValidApiKey() ? 'text-green-400' : 'text-red-400')
                        : 'text-muted-foreground'
                    }`}>
                      {useUserApiKey 
                        ? (hasValidApiKey() ? 'USER' : 'ERR')
                        : 'ENV'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
