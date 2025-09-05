/**
 * Story Thread Workflow Test Component
 * 
 * React component for testing and demonstrating the complete story threading workflow
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { runTestWorkflow, runCompleteWorkflow, getWorkflowStats, WorkflowResult } from '@/lib/services/livefeed/storyThreadWorkflow';
import { EnhancedRedditPost } from '@/lib/types/enhancedRedditPost';

export default function StoryThreadWorkflowTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<WorkflowResult | null>(null);
  const [stats, setStats] = useState<any>(null);

  const runTest = async () => {
    setIsRunning(true);
    try {
      console.log('🧪 Starting Story Thread Workflow Test...');
      const result = await runTestWorkflow();
      setLastResult(result);
      
      // Update stats
      const currentStats = getWorkflowStats();
      setStats(currentStats);
      
      console.log('✅ Test completed:', result);
    } catch (error) {
      console.error('❌ Test failed:', error);
      setLastResult({
        success: false,
        threadId: '',
        isNewThread: false,
        isUpdate: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timeline: []
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runCustomPost = async () => {
    setIsRunning(true);
    try {
      // Create a custom post that should trigger an update to existing thread
      const customPost: EnhancedRedditPost = {
        id: `custom-post-${Date.now()}`,
        title: "AI Breakthrough Follow-up: Implementation Details Released",
        author: "tech_analyst",
        subreddit: "MachineLearning",
        url: "https://reddit.com/custom",
        permalink: "/r/MachineLearning/custom",
        score: 850,
        num_comments: 64,
        created_utc: Math.floor(Date.now() / 1000),
        thumbnail: "",
        selftext: "Following up on the major AI breakthrough announced earlier, the research team has now released implementation details and technical specifications. This provides more insight into the practical applications mentioned in the original announcement.",
        is_video: false,
        domain: "arxiv.org",
        upvote_ratio: 0.92,
        over_18: false,
        source: 'reddit',
        fetch_timestamp: Date.now(),
        engagement_score: 914,
        processing_status: 'raw'
      };

      console.log('🔄 Running custom post workflow (should trigger update)...');
      const result = await runCompleteWorkflow(customPost);
      setLastResult(result);
      
      // Update stats
      const currentStats = getWorkflowStats();
      setStats(currentStats);
      
      console.log('✅ Custom post workflow completed:', result);
    } catch (error) {
      console.error('❌ Custom post workflow failed:', error);
      setLastResult({
        success: false,
        threadId: '',
        isNewThread: false,
        isUpdate: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timeline: []
      });
    } finally {
      setIsRunning(false);
    }
  };

  const refreshStats = () => {
    const currentStats = getWorkflowStats();
    setStats(currentStats);
    console.log('📊 Updated workflow stats:', currentStats);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStatusIcon = (success: boolean) => {
    return success ? '✅' : '❌';
  };

  const getUpdateBadge = (isUpdate: boolean, updateType?: string) => {
    if (!isUpdate) return null;
    
    const badges = {
      'new_development': '🔥 BREAKING UPDATE',
      'follow_up': '📄 FOLLOW-UP',
      'clarification': '💡 CLARIFIED',
      'correction': '⚠️ CORRECTED'
    };
    
    return (
      <span className="ml-2 px-2 py-1 bg-orange-500 text-white text-xs rounded-full">
        {badges[updateType as keyof typeof badges] || '🔄 UPDATED'}
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">🧵 Story Thread Workflow Test</h2>
        <p className="text-gray-600 mb-6">
          Test the complete story threading workflow: Live Feed → Host Agent → Producer → Thread Updates
        </p>
        
        <div className="flex space-x-4 mb-6">
          <Button 
            onClick={runTest} 
            disabled={isRunning}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {isRunning ? '🔄 Running...' : '🧪 Run Test Workflow'}
          </Button>
          
          <Button 
            onClick={runCustomPost} 
            disabled={isRunning}
            className="bg-green-500 hover:bg-green-600"
          >
            {isRunning ? '🔄 Running...' : '🔄 Test Update Post'}
          </Button>
          
          <Button 
            onClick={refreshStats} 
            variant="outline"
            className="border-gray-300"
          >
            📊 Refresh Stats
          </Button>
        </div>
        
        {stats && (
          <Card className="p-4 mb-6 bg-gray-50">
            <h3 className="font-semibold mb-3">📊 Workflow Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Active Threads:</span>
                <div className="text-lg font-bold text-blue-600">{stats.activeThreads}</div>
              </div>
              <div>
                <span className="font-medium">Archived Threads:</span>
                <div className="text-lg font-bold text-gray-600">{stats.archivedThreads}</div>
              </div>
              <div>
                <span className="font-medium">Live Feed Posts:</span>
                <div className="text-lg font-bold text-green-600">{stats.liveFeedPosts}</div>
              </div>
              <div>
                <span className="font-medium">Thread Posts:</span>
                <div className="text-lg font-bold text-orange-600">{stats.threadPosts}</div>
              </div>
              <div>
                <span className="font-medium">Update Posts:</span>
                <div className="text-lg font-bold text-red-600">{stats.updatePosts}</div>
              </div>
              <div>
                <span className="font-medium">Producer Active:</span>
                <div className="text-lg font-bold">{stats.producerActive ? '✅' : '❌'}</div>
              </div>
              <div>
                <span className="font-medium">Context Updates:</span>
                <div className="text-lg font-bold text-purple-600">{stats.producerStats?.contextUpdatesProvided || 0}</div>
              </div>
              <div>
                <span className="font-medium">Duplicates Found:</span>
                <div className="text-lg font-bold text-yellow-600">{stats.producerStats?.duplicatesAnalyzed || 0}</div>
              </div>
            </div>
          </Card>
        )}
      </Card>

      {lastResult && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">
            {getStatusIcon(lastResult.success)} Last Workflow Result
            {lastResult.isUpdate && getUpdateBadge(lastResult.isUpdate, lastResult.updateType)}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">📋 Summary</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Status:</span>{' '}
                  <span className={lastResult.success ? 'text-green-600' : 'text-red-600'}>
                    {lastResult.success ? 'SUCCESS' : 'FAILED'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Thread ID:</span>{' '}
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                    {lastResult.threadId || 'N/A'}
                  </code>
                </div>
                <div>
                  <span className="font-medium">New Thread:</span>{' '}
                  <span className={lastResult.isNewThread ? 'text-blue-600' : 'text-gray-600'}>
                    {lastResult.isNewThread ? 'YES' : 'NO'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Update:</span>{' '}
                  <span className={lastResult.isUpdate ? 'text-orange-600' : 'text-gray-600'}>
                    {lastResult.isUpdate ? 'YES' : 'NO'}
                  </span>
                </div>
                {lastResult.updateType && (
                  <div>
                    <span className="font-medium">Update Type:</span>{' '}
                    <span className="text-orange-600">{lastResult.updateType}</span>
                  </div>
                )}
                {lastResult.narrationId && (
                  <div>
                    <span className="font-medium">Narration ID:</span>{' '}
                    <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                      {lastResult.narrationId}
                    </code>
                  </div>
                )}
                {lastResult.error && (
                  <div>
                    <span className="font-medium text-red-600">Error:</span>{' '}
                    <span className="text-red-600">{lastResult.error}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">⏱️ Timeline</h4>
              <div className="space-y-1 text-xs max-h-64 overflow-y-auto">
                {lastResult.timeline.map((entry, index) => (
                  <div key={index} className="flex justify-between items-start border-l-2 border-gray-200 pl-2">
                    <div>
                      <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">
                        {entry.stage}
                      </span>
                      <div className="text-gray-600 mt-1">{entry.details}</div>
                    </div>
                    <span className="text-gray-400 text-xs">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6 bg-blue-50">
        <h3 className="text-lg font-semibold mb-3">💡 How to Test</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li><strong>Run Test Workflow:</strong> Creates a sample "AI Breakthrough" post and processes it through the complete system.</li>
          <li><strong>Test Update Post:</strong> Creates a follow-up post that should be detected as an update to the existing thread.</li>
          <li><strong>Check Live Feed:</strong> Go to the Live Feed page to see posts with "UPDATED" badges.</li>
          <li><strong>Monitor Console:</strong> Open DevTools console to see detailed workflow logging.</li>
          <li><strong>Refresh Stats:</strong> Click to see current system statistics and thread status.</li>
        </ol>
        
        <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> For full testing, ensure Host Agent and Producer are active in the Studio page.
            The workflow will gracefully handle inactive agents but full functionality requires all components running.
          </p>
        </div>
      </Card>
    </div>
  );
}