// PRODUCER
// /Users/matthewsimon/Projects/SMNB/smnb/app/dashboard/studio/producer/Producer.tsx

/**
 * Producer Column Component
 * 
 * Displays Producer agent status and activity indicators.
 * Handles Reddit search and duplication analysis for news story context.
 */

'use client';

import React, { useEffect, useState } from "react";
import { useProducerStore } from "@/lib/stores/producer/producerStore";
import { useStorySelectionStore } from "@/lib/stores/livefeed/storySelectionStore";
import { Eye, BarChart3, X } from "lucide-react";

export default function Producer() {
  const {
    isActive,
    stats,
    trends,
    currentSearches,
    initializeProducer,
    startProducer,
    stopProducer,
    cleanup
  } = useProducerStore();

  const [isInitialized, setIsInitialized] = useState(false);
  const [currentView, setCurrentView] = useState<'stats' | 'preview'>('stats'); // Default to stats view
  const [userSelectedView, setUserSelectedView] = useState<'stats' | 'preview' | null>(null); // Track user's manual selection
  
  // Story selection state
  const { selectedStory, isPreviewOpen, clearSelection } = useStorySelectionStore();

  // Auto-switch to preview when story is selected and preview is open
  useEffect(() => {
    if (selectedStory && isPreviewOpen) {
      // Always switch to preview when an article is clicked
      setCurrentView('preview');
      // Reset user selection so they can manually go back to stats if needed
      setUserSelectedView(null);
    }
  }, [selectedStory, isPreviewOpen]);

  // Handle manual view switching
  const handleViewChange = (view: 'stats' | 'preview') => {
    setCurrentView(view);
    setUserSelectedView(view); // Remember user's choice permanently
  };

  // Initialize producer agent on mount
  useEffect(() => {
    if (!isInitialized) {
      initializeProducer();
      setIsInitialized(true);
    }
    
    return () => {
      cleanup();
    };
  }, [initializeProducer, cleanup, isInitialized]);

  const handleToggleProducer = async () => {
    try {
      console.log('🏭 Producer: Toggle button clicked, current state:', isActive);
      if (isActive) {
        await stopProducer();
      } else {
        await startProducer();
      }
    } catch (error) {
      console.error('🏭 Producer: Error toggling producer:', error);
    }
  };

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className="h-full bg-card border border-border rounded-t-none rounded-b-lg shadow-sm flex flex-col">{/* Thin Header with Status Indicators */}
      <div className="flex bg-muted/30 items-center justify-between px-4 py-2 border-b border-border">
        {/* Left side buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleViewChange('preview')}
            title="Preview"
            className={`p-1 hover:bg-[#2d2d2d] rounded transition-colors border cursor-pointer ${
              currentView === 'preview' 
                ? 'border-muted-foreground text-muted-foreground' 
                : 'border-muted-foreground/70 text-muted-foreground/70'
            }`}
          >
            <Eye className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleViewChange('stats')}
            title="Stats"
            className={`p-1 hover:bg-[#2d2d2d] rounded transition-colors border cursor-pointer ${
              currentView === 'stats' 
                ? 'border-muted-foreground text-muted-foreground' 
                : 'border-muted-foreground/70 text-muted-foreground/70'
            }`}
          >
            <BarChart3 className="w-3 h-3" />
          </button>
        </div>

        {/* Right-side status indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-white border border-gray-300'}`}></div>
          <span className={`text-xs font-medium ${isActive ? 'text-green-400' : 'text-muted-foreground'}`}>
            {isActive ? 'Analyzing' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0">{currentView === 'stats' ? (
          // Stats View - Show existing content when active
          isActive ? (
            <div className="flex-1 overflow-hidden p-3">
              {/* Compact Stats Grid */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="bg-[#1a1a1a] rounded-sm px-2 py-1.5 border border-border/20">
                  <div className="text-xs text-muted-foreground/70">Searches</div>
                  <div className="text-sm font-mono">{stats.searchesPerformed}</div>
                </div>
                <div className="bg-[#1a1a1a] rounded-sm px-2 py-1.5 border border-border/20">
                  <div className="text-xs text-muted-foreground/70">Duplicates</div>
                  <div className="text-sm font-mono">{stats.duplicatesAnalyzed}</div>
                </div>
                <div className="bg-[#1a1a1a] rounded-sm px-2 py-1.5 border border-border/20">
                  <div className="text-xs text-muted-foreground/70">Context</div>
                  <div className="text-sm font-mono">{stats.contextUpdatesProvided}</div>
                </div>
                <div className="bg-[#1a1a1a] rounded-sm px-2 py-1.5 border border-border/20">
                  <div className="text-xs text-muted-foreground/70">Uptime</div>
                  <div className="text-sm font-mono">{formatUptime(stats.uptime)}</div>
                </div>
              </div>

              {/* Active Searches - Compact List */}
              <div className="mb-3">
                <div className="text-xs text-muted-foreground/70 mb-1.5 uppercase tracking-wider">Active Searches</div>
                <div className="space-y-1">
                  {currentSearches.size > 0 ? (
                    Array.from(currentSearches.entries()).slice(0, 3).map(([query, result]) => (
                      <div 
                        key={query} 
                        className="bg-[#1a1a1a] rounded-sm px-2 py-1 flex items-center justify-between text-xs border border-border/20"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground/50">•</span>
                          <span className="font-mono text-muted-foreground">{query}</span>
                          <span className="text-muted-foreground/50">({result.totalResults})</span>
                        </div>
                        <span className="text-muted-foreground/50 font-mono">
                          {result.timestamp.toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: false 
                          })}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground/50 italic">No active searches</div>
                  )}
                </div>
              </div>

              {/* Trending Keywords - Inline Compact */}
              <div className="mb-3">
                <div className="text-xs text-muted-foreground/70 mb-1.5 uppercase tracking-wider">Trending</div>
                <div className="flex flex-wrap gap-1">
                  {trends.length > 0 ? (
                    trends.slice(0, 8).map((trend) => (
                      <span 
                        key={trend.keyword}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#1a1a1a] rounded-sm text-xs border border-border/20"
                      >
                        <span className="font-mono text-muted-foreground">{trend.keyword}</span>
                        <span className="text-muted-foreground/50">·{trend.frequency}</span>
                      </span>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground/50 italic">No trending keywords</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Empty when offline
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground/50">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Start broadcast to view producer stats</p>
                <p className="text-xs mt-1 opacity-70">Analytics will appear when the system is active</p>
              </div>
            </div>
          )
        ) : (
          // Preview View - Show selected story or empty state
          <div className="h-full flex flex-col">
            {selectedStory ? (
              <>
                {/* Absolute Header */}
                <div className="flex-shrink-0 bg-card border-b border-border/20 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground/70 uppercase tracking-wider">
                        Full Story
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        selectedStory.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                        selectedStory.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {selectedStory.priority}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400`}>
                        {selectedStory.tone}
                      </span>
                    </div>
                    <button
                      onClick={clearSelection}
                      className="p-1 hover:bg-[#2d2d2d] rounded transition-colors text-muted-foreground/70 hover:text-muted-foreground"
                      title="Close story"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Scrollable Middle Content */}
                <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0">
                  {/* Story Title */}
                  {selectedStory.title && (
                    <h2 className="text-lg font-semibold text-foreground leading-tight mb-4">
                      {selectedStory.title}
                    </h2>
                  )}

                  {/* Story Image */}
                  {selectedStory.originalItem?.thumbnail && 
                   selectedStory.originalItem.thumbnail !== 'self' && 
                   selectedStory.originalItem.thumbnail !== 'default' && 
                   selectedStory.originalItem.thumbnail !== 'nsfw' && (
                    <div className="overflow-hidden bg-muted/20 border border-border/30 rounded mb-4">
                      <img 
                        src={selectedStory.originalItem.thumbnail}
                        alt={selectedStory.originalItem.title || selectedStory.title || 'Story image'}
                        className="w-full max-h-48 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          const container = target.parentElement;
                          if (container) {
                            container.style.display = 'none';
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Full Story Content */}
                  <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap mb-4">
                    {selectedStory.narrative}
                  </div>

                  {/* Topics */}
                  {selectedStory.topics && selectedStory.topics.length > 0 && (
                    <div className="space-y-1 mb-4">
                      <div className="text-xs text-muted-foreground/70 uppercase tracking-wider">Topics</div>
                      <div className="flex flex-wrap gap-1">
                        {selectedStory.topics.map((topic, index) => (
                          <span 
                            key={index}
                            className="px-1.5 py-0.5 bg-[#1a1a1a] rounded-sm text-xs border border-border/20 text-muted-foreground"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sentiment */}
                  {selectedStory.sentiment && (
                    <div className="space-y-1 mb-4">
                      <div className="text-xs text-muted-foreground/70 uppercase tracking-wider">Sentiment</div>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-xs ${
                        selectedStory.sentiment === 'positive' ? 'bg-green-500/20 text-green-400' :
                        selectedStory.sentiment === 'negative' ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {selectedStory.sentiment}
                      </span>
                    </div>
                  )}

                  {/* Sources - Moved to middle content area */}
                  {(selectedStory.originalItem?.url || selectedStory.originalItem?.subreddit) && (
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground/70 uppercase tracking-wider">Sources</div>
                      <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                        {selectedStory.originalItem?.url && (
                          <a 
                            href={selectedStory.originalItem.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-foreground transition-colors underline underline-offset-2"
                          >
                            {(() => {
                              try {
                                return new URL(selectedStory.originalItem.url).hostname;
                              } catch {
                                return 'Original Article';
                              }
                            })()}
                          </a>
                        )}
                        
                        {selectedStory.originalItem?.subreddit && (
                          <>
                            {selectedStory.originalItem?.url && <span>•</span>}
                            <a 
                              href={`https://www.reddit.com/r/${selectedStory.originalItem.subreddit}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-foreground transition-colors underline underline-offset-2"
                            >
                              r/{selectedStory.originalItem.subreddit}
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Fixed Footer */}
                <div className="flex-shrink-0 bg-card px-3 py-1 rounded-b-lg">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div>Published: {new Date(selectedStory.timestamp).toLocaleString()}</div>
                    <div>Duration: {Math.ceil(selectedStory.duration / 1000)}s</div>
                  </div>
                </div>
              </>
            ) : (
              // Empty preview state
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground/50">
                  <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Click a story in the live feed to preview</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
