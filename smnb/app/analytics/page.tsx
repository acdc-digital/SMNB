// ANALYTICS PAGE
// /Users/matthewsimon/Projects/SMNB/smnb/app/analytics/page.tsx

/**
 * Analytics Page
 * 
 * Comprehensive dashboard for monitoring Anthropic API token usage,
 * costs, performance metrics, and system status across all agents.
 */

'use client';

import React from 'react';
import { TokenUsageOverview } from '@/components/analytics/TokenUsageOverview';
import { EndpointBreakdown } from '@/components/analytics/EndpointBreakdown';
import { CostAnalysis } from '@/components/analytics/CostAnalysis';
import { SystemDocumentation } from '@/components/analytics/SystemDocumentation';
import { RealTimeMetrics } from '@/components/analytics/RealTimeMetrics';
import TestTokenCountingButton from '@/components/analytics/TestTokenCountingButton';

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                🔢 Token Analytics Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Comprehensive monitoring of Anthropic API usage, costs, and performance metrics
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">API Status</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-600">Operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Test Token Counting System */}
        <TestTokenCountingButton />

        {/* Real-time Metrics Overview */}
        <RealTimeMetrics />

        {/* Token Usage Overview Cards */}
        <TokenUsageOverview />

        {/* Endpoint Breakdown Table */}
        <div className="bg-card rounded-lg border border-border">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">
              📊 Endpoint Token Breakdown
            </h2>
            <p className="text-muted-foreground mt-1">
              Detailed analysis of token usage across all API endpoints and agent types
            </p>
          </div>
          <EndpointBreakdown />
        </div>

        {/* Cost Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <CostAnalysis />
          
          {/* System Documentation */}
          <SystemDocumentation />
        </div>
      </div>
    </div>
  );
}