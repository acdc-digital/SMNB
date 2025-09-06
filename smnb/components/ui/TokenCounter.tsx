// TOKEN COUNTER COMPONENT
// /Users/matthewsimon/Projects/SMNB/smnb/components/ui/TokenCounter.tsx

/**
 * Compact token counter for dashboard footer
 * Displays current total input/output tokens and estimated cost
 */

'use client';

import React from 'react';
import { useTokenUsageStats } from '@/lib/hooks/useTokenUsage';

interface TokenCounterProps {
  className?: string;
}

export function TokenCounter({ className = '' }: TokenCounterProps) {
  const stats = useTokenUsageStats();

  // Format large numbers with K/M suffixes
  const formatNumber = (num: number): string => {
    if (num === 0) return '0';
    if (num < 1000) return num.toString();
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    return `${(num / 1000000).toFixed(1)}M`;
  };

  // Format cost with appropriate precision
  const formatCost = (cost: number): string => {
    if (cost === 0) return '$0.00';
    if (cost < 0.01) return `$${cost.toFixed(4)}`;
    if (cost < 1) return `$${cost.toFixed(3)}`;
    return `$${cost.toFixed(2)}`;
  };

  // Get cost color based on amount
  const getCostColor = (cost: number): string => {
    if (cost === 0) return 'text-foreground/50';
    if (cost < 0.10) return 'text-green-500';
    if (cost < 1.00) return 'text-yellow-500';
    return 'text-orange-500';
  };

  if (!stats || stats.total_requests === 0) {
    return (
      <div className={`flex items-center gap-2 text-xs text-foreground/40 ${className}`}>
        <span>Tokens: —</span>
        <span>Cost: —</span>
        <span>Tools: —</span>
      </div>
    );
  }

  const {
    total_input_tokens,
    total_output_tokens,
    total_cost,
    total_tool_requests,
    total_tool_definitions_tokens,
    total_tool_results_tokens
  } = stats;
  const totalTokens = total_input_tokens + total_output_tokens;
  const totalToolTokens = total_tool_definitions_tokens + total_tool_results_tokens;
  const hasToolUsage = total_tool_requests > 0;

  return (
    <div className={`flex items-center gap-3 text-xs ${className}`}>
      <div className="flex items-center gap-1">
        <span className="text-foreground/60">Tokens:</span>
        <span className="text-foreground/80 font-medium">
          {formatNumber(total_input_tokens)}
        </span>
        <span className="text-foreground/40">/</span>
        <span className="text-foreground/80 font-medium">
          {formatNumber(total_output_tokens)}
        </span>
        <span className="text-foreground/50">
          ({formatNumber(totalTokens)})
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-foreground/60">Cost:</span>
        <span className={`font-medium ${getCostColor(total_cost)}`}>
          {formatCost(total_cost)}
        </span>
      </div>
      {hasToolUsage && (
        <div className="flex items-center gap-1">
          <span className="text-foreground/60">🛠️ Tools:</span>
          <span className="text-foreground/80 font-medium">
            {formatNumber(total_tool_requests)}
          </span>
          {totalToolTokens > 0 && (
            <>
              <span className="text-foreground/40">•</span>
              <span className="text-foreground/70 text-xs">
                {formatNumber(totalToolTokens)}t
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default TokenCounter;