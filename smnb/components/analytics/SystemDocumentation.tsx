// SYSTEM DOCUMENTATION
// /Users/matthewsimon/Projects/SMNB/smnb/components/analytics/SystemDocumentation.tsx

/**
 * System Documentation Component
 * 
 * Displays comprehensive documentation about the token counting system,
 * API structure, implementation status, and technical details.
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';

export const SystemDocumentation: React.FC = () => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">
        📚 System Documentation
      </h3>

      {/* Implementation Status */}
      <div className="space-y-6">
        <div>
          <h4 className="font-medium text-foreground mb-3">🚀 Implementation Status</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Token Counting Service</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">✅ Complete</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Claude LLM Integration</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">✅ Complete</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Real-time Monitoring</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">✅ Complete</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Analytics Dashboard</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">🔄 In Progress</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Database Persistence</span>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">📋 Planned</span>
            </div>
          </div>
        </div>

        {/* API Endpoints */}
        <div>
          <h4 className="font-medium text-foreground mb-3">🔌 API Endpoints</h4>
          <div className="space-y-2">
            <div className="font-mono text-xs bg-muted p-2 rounded">
              <div className="text-green-600">POST /api/claude</div>
              <div className="text-muted-foreground ml-4">
                • action: "generate" | "stream" | "analyze" | "test" | "count-tokens"
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Main API gateway for all Claude requests with secure server-side processing
            </div>
          </div>
        </div>

        {/* Agent Integration */}
        <div>
          <h4 className="font-medium text-foreground mb-3">🤖 Agent Integration</h4>
          <div className="space-y-3">
            <div className="border-l-4 border-blue-500 pl-3">
              <div className="font-medium text-sm text-foreground">🎙️ Host Agent</div>
              <div className="text-xs text-muted-foreground">
                Narration generation with 314 WPM streaming
              </div>
            </div>
            <div className="border-l-4 border-purple-500 pl-3">
              <div className="font-medium text-sm text-foreground">🏭 Producer Agent</div>
              <div className="text-xs text-muted-foreground">
                Content analysis and duplicate detection
              </div>
            </div>
            <div className="border-l-4 border-orange-500 pl-3">
              <div className="font-medium text-sm text-foreground">✍️ Editor Agent</div>
              <div className="text-xs text-muted-foreground">
                Article generation and editorial review
              </div>
            </div>
          </div>
        </div>

        {/* Token Counting Features */}
        <div>
          <h4 className="font-medium text-foreground mb-3">🔢 Token Counting Features</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Pre-request token estimation using Anthropic's count API</li>
            <li>• Real-time output token calculation</li>
            <li>• Comprehensive cost analysis with current pricing</li>
            <li>• Performance metrics (duration, success rates)</li>
            <li>• Usage patterns and trend analysis</li>
            <li>• Error tracking with detailed context</li>
          </ul>
        </div>

        {/* Technical Architecture */}
        <div>
          <h4 className="font-medium text-foreground mb-3">🏗️ Technical Architecture</h4>
          <div className="text-xs space-y-2">
            <div className="font-mono bg-muted p-2 rounded">
              <div>TokenCountingService</div>
              <div className="text-muted-foreground ml-4">↓</div>
              <div>ClaudeLLMService</div>
              <div className="text-muted-foreground ml-4">↓</div>
              <div>/api/claude endpoint</div>
              <div className="text-muted-foreground ml-4">↓</div>
              <div>Anthropic API</div>
            </div>
          </div>
        </div>

        {/* Model Information */}
        <div>
          <h4 className="font-medium text-foreground mb-3">🧠 Current Models</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Claude 3.5 Haiku</span>
              <span className="text-xs text-muted-foreground">Primary model</span>
            </div>
            <div className="text-xs text-muted-foreground">
              • Fast and cost-effective for most tasks
              • $1/1M input tokens, $5/1M output tokens
              • Ideal for narration, analysis, and content processing
            </div>
          </div>
        </div>

        {/* Data Flow */}
        <div>
          <h4 className="font-medium text-foreground mb-3">🔄 Data Flow</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>1. Request initiated by agent service</div>
            <div>2. Pre-request token counting via API</div>
            <div>3. Claude API call with monitoring</div>
            <div>4. Response processing and token estimation</div>
            <div>5. Usage metrics recorded and analyzed</div>
            <div>6. Real-time dashboard updates</div>
          </div>
        </div>
      </div>
    </Card>
  );
};