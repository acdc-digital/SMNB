// COST ANALYSIS
// /Users/matthewsimon/Projects/SMNB/smnb/components/analytics/CostAnalysis.tsx

/**
 * Cost Analysis Component
 * 
 * Displays detailed cost breakdown, projections, and pricing information
 * for Anthropic API usage across all endpoints and models.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { tokenCountingService, ANTHROPIC_PRICING } from '@/lib/services/tokenCountingService';

interface CostProjection {
  daily: number;
  weekly: number;
  monthly: number;
}

export const CostAnalysis: React.FC = () => {
  const [currentCost, setCurrentCost] = useState(0);
  const [projections, setProjections] = useState<CostProjection>({
    daily: 0,
    weekly: 0,
    monthly: 0
  });

  useEffect(() => {
    const updateCostAnalysis = () => {
      const stats = tokenCountingService.getUsageStats();
      const sessionStats = tokenCountingService.getCurrentSessionStats();
      
      setCurrentCost(stats.totalCost);
      
      // Calculate projections based on current session rate
      if (sessionStats.duration > 0) {
        const costPerHour = (sessionStats.cost / (sessionStats.duration / (1000 * 60 * 60)));
        setProjections({
          daily: costPerHour * 24,
          weekly: costPerHour * 24 * 7,
          monthly: costPerHour * 24 * 30
        });
      }
    };

    updateCostAnalysis();
    const interval = setInterval(updateCostAnalysis, 10000);

    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(amount);
  };

  const formatTokenPrice = (tokensPerDollar: number): string => {
    return `$${(1000000 / tokensPerDollar).toFixed(2)}/1M tokens`;
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">
        💰 Cost Analysis & Projections
      </h3>

      {/* Current Session Cost */}
      <div className="mb-6">
        <div className="text-2xl font-bold text-foreground mb-2">
          {formatCurrency(currentCost)}
        </div>
        <div className="text-sm text-muted-foreground">
          Current session total cost
        </div>
      </div>

      {/* Cost Projections */}
      <div className="space-y-4 mb-6">
        <h4 className="font-medium text-foreground">📈 Usage Projections</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-foreground">
              {formatCurrency(projections.daily)}
            </div>
            <div className="text-xs text-muted-foreground">Daily</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-foreground">
              {formatCurrency(projections.weekly)}
            </div>
            <div className="text-xs text-muted-foreground">Weekly</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-foreground">
              {formatCurrency(projections.monthly)}
            </div>
            <div className="text-xs text-muted-foreground">Monthly</div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          * Projections based on current session usage rate
        </div>
      </div>

      {/* Model Pricing */}
      <div className="space-y-4">
        <h4 className="font-medium text-foreground">🏷️ Model Pricing</h4>
        <div className="space-y-3">
          {Object.entries(ANTHROPIC_PRICING).map(([model, pricing]) => {
            const displayName = model.includes('haiku') ? 'Claude 3.5 Haiku' : 
                               model.includes('sonnet') ? 'Claude 3.5 Sonnet' : 
                               model.includes('opus') ? 'Claude 3 Opus' : model;
            
            return (
              <div key={model} className="border border-border rounded-lg p-3">
                <div className="font-medium text-sm text-foreground mb-2">
                  {displayName}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-muted-foreground">Input</div>
                    <div className="font-mono text-foreground">
                      {formatTokenPrice(pricing.inputTokensPerDollar)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Output</div>
                    <div className="font-mono text-foreground">
                      {formatTokenPrice(pricing.outputTokensPerDollar)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cost Optimization Tips */}
      <div className="mt-6 p-3 bg-muted/50 rounded-lg">
        <h4 className="font-medium text-foreground mb-2">💡 Cost Optimization Tips</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Use Claude 3.5 Haiku for simple tasks (5x cheaper than Sonnet)</li>
          <li>• Optimize prompts to reduce input token count</li>
          <li>• Cache frequently used responses</li>
          <li>• Set appropriate max_tokens limits</li>
          <li>• Monitor usage patterns to identify optimization opportunities</li>
        </ul>
      </div>
    </Card>
  );
};