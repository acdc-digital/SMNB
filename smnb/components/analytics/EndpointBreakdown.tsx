// ENDPOINT BREAKDOWN
// /Users/matthewsimon/Projects/SMNB/smnb/components/analytics/EndpointBreakdown.tsx

/**
 * Endpoint Breakdown Component
 * 
 * Detailed table showing token usage breakdown by endpoint,
 * including performance metrics, costs, and success rates.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { tokenCountingService, TokenUsageMetrics } from '@/lib/services/tokenCountingService';

interface EndpointStats {
  endpoint: string;
  agent: string;
  model: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  avgDuration: number;
  avgTokensPerRequest: number;
  successRate: number;
  lastUsed: Date | null;
}

export const EndpointBreakdown: React.FC = () => {
  const [endpointStats, setEndpointStats] = useState<EndpointStats[]>([]);

  useEffect(() => {
    const updateStats = () => {
      const allUsage = tokenCountingService.getUsageStats();
      const usageHistory = tokenCountingService['usageHistory'] || []; // Access private property for demo
      
      // Group by action/requestType combination
      const grouped = new Map<string, TokenUsageMetrics[]>();
      
      // Mock some data if no real usage exists
      if (usageHistory.length === 0) {
        const mockData: EndpointStats[] = [
          {
            endpoint: '/api/claude (generate)',
            agent: 'Host Agent',
            model: 'claude-3-5-haiku-20241022',
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalTokens: 0,
            inputTokens: 0,
            outputTokens: 0,
            totalCost: 0,
            avgDuration: 0,
            avgTokensPerRequest: 0,
            successRate: 0,
            lastUsed: null
          },
          {
            endpoint: '/api/claude (stream)',
            agent: 'Host Agent',
            model: 'claude-3-5-haiku-20241022',
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalTokens: 0,
            inputTokens: 0,
            outputTokens: 0,
            totalCost: 0,
            avgDuration: 0,
            avgTokensPerRequest: 0,
            successRate: 0,
            lastUsed: null
          },
          {
            endpoint: '/api/claude (analyze)',
            agent: 'Producer Agent',
            model: 'claude-3-5-haiku-20241022',
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalTokens: 0,
            inputTokens: 0,
            outputTokens: 0,
            totalCost: 0,
            avgDuration: 0,
            avgTokensPerRequest: 0,
            successRate: 0,
            lastUsed: null
          },
          {
            endpoint: '/api/claude/count-tokens',
            agent: 'Token Service',
            model: 'claude-3-5-haiku-20241022',
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalTokens: 0,
            inputTokens: 0,
            outputTokens: 0,
            totalCost: 0,
            avgDuration: 0,
            avgTokensPerRequest: 0,
            successRate: 0,
            lastUsed: null
          }
        ];
        setEndpointStats(mockData);
        return;
      }

      // Process real usage data if available
      usageHistory.forEach((usage: TokenUsageMetrics) => {
        const key = `${usage.action}-${usage.requestType}`;
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(usage);
      });

      const stats: EndpointStats[] = Array.from(grouped.entries()).map(([key, metrics]) => {
        const [action, requestType] = key.split('-');
        const successful = metrics.filter(m => m.success);
        const failed = metrics.filter(m => !m.success);
        
        const totalTokens = metrics.reduce((sum, m) => sum + m.totalTokens, 0);
        const inputTokens = metrics.reduce((sum, m) => sum + m.inputTokens, 0);
        const outputTokens = metrics.reduce((sum, m) => sum + m.outputTokens, 0);
        const totalCost = metrics.reduce((sum, m) => sum + m.estimatedCost, 0);
        const avgDuration = successful.length > 0 
          ? successful.reduce((sum, m) => sum + (m.duration || 0), 0) / successful.length
          : 0;
        
        return {
          endpoint: `/api/claude (${action})`,
          agent: requestType === 'host' ? 'Host Agent' : 
                 requestType === 'producer' ? 'Producer Agent' : 
                 requestType === 'editor' ? 'Editor Agent' : 'Unknown',
          model: metrics[0]?.model || 'claude-3-5-haiku-20241022',
          totalRequests: metrics.length,
          successfulRequests: successful.length,
          failedRequests: failed.length,
          totalTokens,
          inputTokens,
          outputTokens,
          totalCost,
          avgDuration,
          avgTokensPerRequest: metrics.length > 0 ? totalTokens / metrics.length : 0,
          successRate: metrics.length > 0 ? (successful.length / metrics.length) * 100 : 0,
          lastUsed: metrics.length > 0 ? new Date(Math.max(...metrics.map(m => m.timestamp.getTime()))) : null
        };
      });

      setEndpointStats(stats);
    };

    updateStats();
    const interval = setInterval(updateStats, 15000); // Update every 15 seconds

    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(Math.round(num));
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 6
    }).format(amount);
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getAgentEmoji = (agent: string): string => {
    switch (agent) {
      case 'Host Agent': return '🎙️';
      case 'Producer Agent': return '🏭';
      case 'Editor Agent': return '✍️';
      case 'Token Service': return '🔢';
      default: return '🤖';
    }
  };

  const getStatusColor = (successRate: number): string => {
    if (successRate >= 95) return 'text-green-600';
    if (successRate >= 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Endpoint</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Agent</th>
            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Requests</th>
            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Success Rate</th>
            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Tokens</th>
            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Avg/Request</th>
            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Cost</th>
            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Avg Duration</th>
            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Last Used</th>
          </tr>
        </thead>
        <tbody>
          {endpointStats.map((stat, index) => (
            <tr key={index} className="border-b border-border hover:bg-muted/50 transition-colors">
              <td className="py-4 px-4">
                <div className="font-mono text-sm text-foreground">{stat.endpoint}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.model}</div>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getAgentEmoji(stat.agent)}</span>
                  <span className="font-medium text-foreground">{stat.agent}</span>
                </div>
              </td>
              <td className="py-4 px-4 text-right">
                <div className="font-medium text-foreground">{formatNumber(stat.totalRequests)}</div>
                <div className="text-xs text-muted-foreground">
                  {stat.successfulRequests}✓ {stat.failedRequests}✗
                </div>
              </td>
              <td className="py-4 px-4 text-right">
                <div className={`font-medium ${getStatusColor(stat.successRate)}`}>
                  {stat.successRate.toFixed(1)}%
                </div>
              </td>
              <td className="py-4 px-4 text-right">
                <div className="font-medium text-foreground">{formatNumber(stat.totalTokens)}</div>
                <div className="text-xs text-muted-foreground">
                  {formatNumber(stat.inputTokens)}→{formatNumber(stat.outputTokens)}
                </div>
              </td>
              <td className="py-4 px-4 text-right">
                <div className="font-medium text-foreground">
                  {formatNumber(stat.avgTokensPerRequest)}
                </div>
              </td>
              <td className="py-4 px-4 text-right">
                <div className="font-medium text-foreground">{formatCurrency(stat.totalCost)}</div>
                <div className="text-xs text-muted-foreground">
                  {stat.totalRequests > 0 ? formatCurrency(stat.totalCost / stat.totalRequests) : '$0.0000'}/req
                </div>
              </td>
              <td className="py-4 px-4 text-right">
                <div className="font-medium text-foreground">
                  {formatDuration(stat.avgDuration)}
                </div>
              </td>
              <td className="py-4 px-4 text-right">
                <div className="text-sm text-muted-foreground">
                  {stat.lastUsed 
                    ? stat.lastUsed.toLocaleTimeString() 
                    : 'Never'
                  }
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {endpointStats.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <div className="text-4xl mb-2">📊</div>
          <div>No usage data available yet</div>
          <div className="text-sm">Start using the API to see endpoint breakdowns</div>
        </div>
      )}
    </div>
  );
};