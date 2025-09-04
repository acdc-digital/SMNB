/**
 * Producer Column Component
 * 
 * Displays Producer agent status and activity indicators.
 * Handles Reddit search and duplication analysis for news story context.
 */

'use client';

import React, { useEffect, useState } from "react";
import { useProducerStore } from "@/lib/stores/producer/producerStore";

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
    <div className="flex-1 bg-card border border-border rounded-lg shadow-sm flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏭</span>
          <h3 className="font-semibold text-foreground">Producer</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className="text-xs text-muted-foreground">
            {isActive ? 'Analyzing' : 'Standby'}
          </span>
          <button
            onClick={handleToggleProducer}
            className={`px-3 py-1 text-xs rounded transition-colors cursor-pointer ${
              isActive 
                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' 
                : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
            }`}
          >
            {isActive ? 'Stop' : 'Start'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {isActive ? (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">Searches</div>
                <div className="text-lg font-semibold text-foreground">
                  {stats.searchesPerformed}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">Duplicates</div>
                <div className="text-lg font-semibold text-foreground">
                  {stats.duplicatesAnalyzed}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">Context</div>
                <div className="text-lg font-semibold text-foreground">
                  {stats.contextUpdatesProvided}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">Uptime</div>
                <div className="text-lg font-semibold text-foreground">
                  {formatUptime(stats.uptime)}
                </div>
              </div>
            </div>

            {/* Active Searches */}
            {currentSearches.size > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Active Searches</h4>
                <div className="space-y-2">
                  {Array.from(currentSearches.entries()).map(([query, result]) => (
                    <div key={query} className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">🔍</span>
                        <span className="text-sm text-foreground">&ldquo;{query}&rdquo;</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{result.totalResults} results</span>
                        <span>•</span>
                        <span>{result.timestamp.toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Keywords */}
            {trends.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Trending Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {trends.slice(0, 10).map((trend) => (
                    <span
                      key={trend.keyword}
                      className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full"
                    >
                      {trend.keyword} ({trend.frequency})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Activity Indicator */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
              <span>Monitoring Reddit for trending content and duplicates...</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="text-4xl mb-4">🏭</div>
              <div className="text-lg font-medium text-foreground">
                Producer Agent Offline
              </div>
              <div className="text-sm text-muted-foreground">
                Start the producer to begin Reddit analysis and context generation
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
