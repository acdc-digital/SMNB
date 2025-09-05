// TOKEN USAGE OVERVIEW
// /Users/matthewsimon/Projects/SMNB/smnb/components/analytics/TokenUsageOverview.tsx

/**
 * Token Usage Overview Component
 * 
 * Displays comprehensive statistics and breakdowns of token usage
 * across different request types and time periods.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { tokenCountingService, TokenUsageStats } from '@/lib/services/tokenCountingService';

export const TokenUsageOverview: React.FC = () => {
  const [usageStats, setUsageStats] = useState<TokenUsageStats | null>(null);

  useEffect(() => {
    const updateStats = () => {
      const stats = tokenCountingService.getUsageStats();
      setUsageStats(stats);
    };

    updateStats();
    const interval = setInterval(updateStats, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    }).format(amount);
  };

  if (!usageStats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-24 mb-2"></div>
            <div className="h-8 bg-muted rounded w-16 mb-2"></div>
            <div className="h-3 bg-muted rounded w-32"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Total Requests</h3>
            <span className="text-2xl">📊</span>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-foreground">
              {formatNumber(usageStats.totalRequests)}
            </div>
            <div className="text-sm text-muted-foreground">
              {usageStats.averageTokensPerRequest.toFixed(0)} avg tokens/req
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Input Tokens</h3>
            <span className="text-2xl">📥</span>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-foreground">
              {formatNumber(usageStats.totalInputTokens)}
            </div>
            <div className="text-sm text-muted-foreground">
              {((usageStats.totalInputTokens / usageStats.totalTokens) * 100).toFixed(1)}% of total
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Output Tokens</h3>
            <span className="text-2xl">📤</span>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-foreground">
              {formatNumber(usageStats.totalOutputTokens)}
            </div>
            <div className="text-sm text-muted-foreground">
              {((usageStats.totalOutputTokens / usageStats.totalTokens) * 100).toFixed(1)}% of total
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Total Cost</h3>
            <span className="text-2xl">💰</span>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(usageStats.totalCost)}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatCurrency(usageStats.totalCost / usageStats.totalRequests)} per request
            </div>
          </div>
        </Card>
      </div>

      {/* Request Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            🎯 Requests by Agent Type
          </h3>
          <div className="space-y-4">
            {Object.entries(usageStats.requestsByType).map(([type, count]) => {
              const percentage = (count / usageStats.totalRequests) * 100;
              const emoji = type === 'host' ? '🎙️' : type === 'producer' ? '🏭' : '✍️';
              
              return (
                <div key={type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{emoji}</span>
                      <span className="font-medium capitalize text-foreground">{type}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {count} ({percentage.toFixed(1)}%)
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            🤖 Tokens by Model
          </h3>
          <div className="space-y-4">
            {Object.entries(usageStats.tokensByModel).map(([model, tokens]) => {
              const percentage = (tokens / usageStats.totalTokens) * 100;
              const displayName = model.includes('haiku') ? 'Claude 3.5 Haiku' : 
                                 model.includes('sonnet') ? 'Claude 3.5 Sonnet' : 
                                 model;
              
              return (
                <div key={model} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>🧠</span>
                      <span className="font-medium text-foreground">{displayName}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatNumber(tokens)} ({percentage.toFixed(1)}%)
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-secondary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};