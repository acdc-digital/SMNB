// TOKEN USAGE HOOK
// /Users/matthewsimon/Projects/SMNB/smnb/lib/hooks/useTokenUsage.ts

/**
 * React hook for accessing token usage data from Convex
 * Provides real-time token usage statistics and historical data
 */

'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export interface TokenUsageStats {
  total_requests: number;
  successful_requests: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  total_cost: number;
  average_tokens_per_request: number;
  average_cost_per_request: number;
  requests_by_type: Record<string, number>;
  requests_by_model: Record<string, number>;
  requests_by_action: Record<string, number>;
  tokens_by_type: Record<string, number>;
  cost_by_type: Record<string, number>;
  hourly_usage: Array<{ hour: string; requests: number; tokens: number; cost: number }>;
  // Enhanced tool tracking fields
  total_tool_requests: number;
  total_tool_definitions_tokens: number;
  total_tool_results_tokens: number;
  tool_usage_by_type: Record<string, number>;
}

export interface DailyUsageData {
  day: string;
  requests: number;
  tokens: number;
  cost: number;
}

/**
 * Get aggregated token usage statistics
 */
export function useTokenUsageStats(startTime?: number, endTime?: number): TokenUsageStats | undefined {
  return useQuery(api.tokenUsage.getAggregatedStats, { startTime, endTime });
}

/**
 * Get recent token usage records
 */
export function useRecentTokenUsage(limit?: number) {
  return useQuery(api.tokenUsage.getRecentUsage, { limit });
}

/**
 * Get token usage by request type
 */
export function useTokenUsageByType(
  requestType: 'host' | 'producer' | 'editor',
  startTime?: number,
  endTime?: number,
  limit?: number
) {
  return useQuery(api.tokenUsage.getUsageByType, {
    request_type: requestType,
    startTime,
    endTime,
    limit,
  });
}

/**
 * Get daily usage summary
 */
export function useDailyTokenUsage(days?: number): DailyUsageData[] | undefined {
  return useQuery(api.tokenUsage.getDailyUsage, { days });
}

/**
 * Get session statistics (current session only)
 */
export function useSessionStats() {
  const recentUsage = useRecentTokenUsage(50);
  
  if (!recentUsage) return null;
  
  // Calculate session stats from recent usage
  const now = new Date();
  const sessionStart = recentUsage.length > 0 ? new Date(recentUsage[recentUsage.length - 1].timestamp) : now;
  const duration = now.getTime() - sessionStart.getTime();
  const durationMinutes = duration / (1000 * 60);
  
  const totalTokens = recentUsage.reduce((sum, record) => sum + record.total_tokens, 0);
  const totalCost = recentUsage.reduce((sum, record) => sum + record.estimated_cost, 0);
  
  return {
    duration,
    requests: recentUsage.length,
    tokens: totalTokens,
    cost: totalCost,
    tokensPerMinute: durationMinutes > 0 ? totalTokens / durationMinutes : 0,
  };
}

/**
 * Check if there's any token usage data available
 */
export function useHasTokenUsageData(): boolean {
  const stats = useTokenUsageStats();
  return stats ? stats.total_requests > 0 : false;
}