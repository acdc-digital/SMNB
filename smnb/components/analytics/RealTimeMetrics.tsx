// REAL TIME METRICS
// /Users/matthewsimon/Projects/SMNB/smnb/components/analytics/RealTimeMetrics.tsx

/**
 * Real Time Metrics Component
 * 
 * Displays live token usage metrics, session statistics,
 * and current API performance indicators.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { tokenCountingService } from '@/lib/services/tokenCountingService';
import { useSessionStats, useTokenUsageStats } from '@/lib/hooks/useTokenUsage';

interface SessionStats {
  duration: number;
  requests: number;
  tokens: number;
  cost: number;
  tokensPerMinute: number;
}

export const RealTimeMetrics: React.FC = () => {
  // Get session stats from both in-memory and Convex data
  const convexSessionStats = useSessionStats();
  const convexStats = useTokenUsageStats();
  
  const [memorySessionStats, setMemorySessionStats] = useState<SessionStats>({
    duration: 0,
    requests: 0,
    tokens: 0,
    cost: 0,
    tokensPerMinute: 0
  });

  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    const updateMemoryStats = () => {
      const stats = tokenCountingService.getCurrentSessionStats();
      setMemorySessionStats(stats);
    };

    // Update immediately
    updateMemoryStats();

    // Update every 5 seconds
    const interval = setInterval(updateMemoryStats, 5000);

    return () => clearInterval(interval);
  }, []);

  // Use Convex data if available, fallback to memory data
  const sessionStats = convexSessionStats || memorySessionStats;
  const hasData = (convexStats?.total_requests || 0) > 0 || memorySessionStats.requests > 0;

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${remainingMinutes}m`;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Session Duration */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Session Duration</p>
            <p className="text-2xl font-bold text-foreground">
              {formatDuration(sessionStats.duration)}
            </p>
          </div>
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-lg">⏱️</span>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-xs text-muted-foreground">
            {isLive ? 'Live tracking' : 'Offline'}
          </span>
        </div>
      </Card>

      {/* Total Requests */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Requests</p>
            <p className="text-2xl font-bold text-foreground">
              {formatNumber(sessionStats.requests)}
            </p>
          </div>
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
            <span className="text-purple-600 text-lg">📡</span>
          </div>
        </div>
        <div className="mt-2">
          <span className="text-xs text-muted-foreground">
            {sessionStats.duration > 0 
              ? `${(sessionStats.requests / (sessionStats.duration / (1000 * 60))).toFixed(1)} req/min`
              : '0 req/min'
            }
          </span>
        </div>
      </Card>

      {/* Total Tokens */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Tokens</p>
            <p className="text-2xl font-bold text-foreground">
              {formatNumber(sessionStats.tokens)}
            </p>
          </div>
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <span className="text-green-600 text-lg">🔢</span>
          </div>
        </div>
        <div className="mt-2">
          <span className="text-xs text-muted-foreground">
            {sessionStats.tokensPerMinute.toFixed(0)} tokens/min
          </span>
        </div>
      </Card>

      {/* Session Cost */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Session Cost</p>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(sessionStats.cost)}
            </p>
          </div>
          <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
            <span className="text-yellow-600 text-lg">💰</span>
          </div>
        </div>
        <div className="mt-2">
          <span className="text-xs text-muted-foreground">
            {sessionStats.requests > 0 
              ? `${formatCurrency(sessionStats.cost / sessionStats.requests)} avg/req`
              : '$0.0000 avg/req'
            }
          </span>
        </div>
      </Card>

      {/* Efficiency Rate */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Efficiency</p>
            <p className="text-2xl font-bold text-foreground">
              {sessionStats.requests > 0 
                ? Math.round(sessionStats.tokens / sessionStats.requests)
                : 0
              }
            </p>
            <p className="text-xs text-muted-foreground">tokens/req</p>
          </div>
          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
            <span className="text-orange-600 text-lg">⚡</span>
          </div>
        </div>
        <div className="mt-2">
          <span className="text-xs text-muted-foreground">
            Current session avg
          </span>
        </div>
      </Card>
    </div>
  );
};