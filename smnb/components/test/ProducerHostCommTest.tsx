/**
 * Producer → Host Communication Test Component
 * 
 * Tests and visualizes the communication flow between Producer and Host Agent
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProducerStore } from '@/lib/stores/producer/producerStore';
import { useHostAgentStore } from '@/lib/stores/host/hostAgentStore';

interface CommunicationLog {
  id: string;
  timestamp: number;
  type: 'producer_send' | 'host_receive' | 'host_process' | 'error';
  message: string;
  data?: any;
}

export function ProducerHostCommTest() {
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [hostContext, setHostContext] = useState<any[]>([]);
  
  const producer = useProducerStore();
  const host = useHostAgentStore();

  // Monitor Host Agent state
  useEffect(() => {
    const interval = setInterval(() => {
      const state = host.hostAgent?.getState?.();
      if (state?.producerContext) {
        setHostContext([...state.producerContext]);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [host.hostAgent]);

  const addLog = (type: CommunicationLog['type'], message: string, data?: any) => {
    const log: CommunicationLog = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      type,
      message,
      data
    };
    setLogs(prev => [log, ...prev].slice(0, 20)); // Keep last 20 logs
  };

  const testProducerToHostCommunication = async () => {
    setIsTestRunning(true);
    addLog('producer_send', 'Starting Producer → Host communication test...');

    try {
      // Create test context data
      const testContext = {
        postId: `test-${Date.now()}`,
        contextType: 'duplicate_analysis',
        timestamp: Date.now(),
        analysisResults: {
          isDuplicate: false,
          similarityScore: 0.3,
          relatedPosts: [],
          confidence: 'medium'
        },
        metadata: {
          subreddit: 'technology',
          author: 'test_user',
          score: 150,
          numComments: 25
        },
        duplicateDetection: {
          checked: true,
          duplicateFound: false,
          checkedAt: Date.now()
        }
      };

      addLog('producer_send', `Sending context for post ${testContext.postId}`, testContext);

      // Test the Producer sending context to Host
      if (producer.isActive) {
        producer.sendContextToHost(testContext);
        addLog('producer_send', '✅ Producer context sent successfully');
        
        // Wait a moment for Host to receive
        setTimeout(() => {
          const state = host.hostAgent?.getState?.();
          if (state?.producerContext && state.producerContext.length > 0) {
            addLog('host_receive', '✅ Host received Producer context');
            addLog('host_process', `Host has ${state.producerContext.length} context items`);
          } else {
            addLog('error', '❌ Host did not receive Producer context');
          }
        }, 1000);
      } else {
        addLog('error', '❌ Producer is not active');
      }

      // Test thread-aware context sending
      setTimeout(async () => {
        try {
          const threadAwareContext = {
            ...testContext,
            threadInfo: {
              threadId: 'thread-123',
              isUpdate: true,
              updateType: 'new_development',
              relevanceScore: 0.85
            }
          };

          addLog('producer_send', 'Sending thread-aware context...', threadAwareContext);
          
          if (producer.sendThreadAwareContext) {
            await producer.sendThreadAwareContext(
              [{ 
                id: testContext.postId, 
                type: 'duplicate',
                sourcePost: { 
                  id: testContext.postId,
                  title: 'Test Post',
                  selftext: 'Test content',
                  author: 'test_user',
                  subreddit: 'technology',
                  score: 150,
                  num_comments: 25,
                  created_utc: Date.now() / 1000,
                  url: 'https://reddit.com/test',
                  permalink: '/r/technology/comments/test',
                  thumbnail: '',
                  is_video: false,
                  domain: 'reddit.com',
                  upvote_ratio: 0.95,
                  over_18: false
                },
                relatedPosts: [],
                analysis: null,
                keywords: ['test', 'technology'],
                relevanceScore: 0.85,
                timestamp: new Date()
              }],
              'thread-123',
              true
            );
            addLog('producer_send', '✅ Thread-aware context sent');
          }
        } catch (error: any) {
          addLog('error', `❌ Thread-aware context failed: ${error?.message || 'Unknown error'}`);
        }
      }, 2000);

    } catch (error: any) {
      addLog('error', `❌ Communication test failed: ${error?.message || 'Unknown error'}`, error);
    } finally {
      setTimeout(() => setIsTestRunning(false), 3000);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const getLogIcon = (type: CommunicationLog['type']) => {
    switch (type) {
      case 'producer_send': return '🏭';
      case 'host_receive': return '🎙️';
      case 'host_process': return '⚡';
      case 'error': return '❌';
      default: return '📝';
    }
  };

  const getLogColor = (type: CommunicationLog['type']) => {
    switch (type) {
      case 'producer_send': return 'text-blue-600 dark:text-blue-400';
      case 'host_receive': return 'text-green-600 dark:text-green-400';
      case 'host_process': return 'text-purple-600 dark:text-purple-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl mb-2">🏭</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Producer Status
            </div>
            <div className={`text-lg font-bold ${producer.isActive ? 'text-green-600' : 'text-red-600'}`}>
              {producer.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl mb-2">🎙️</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Host Agent Status
            </div>
            <div className={`text-lg font-bold ${host.isActive ? 'text-green-600' : 'text-red-600'}`}>
              {host.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
        </Card>
      </div>

      {/* Host Context Display */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          📥 Host Agent Context ({hostContext.length} items)
        </h3>
        {hostContext.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {hostContext.map((context, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm">
                <div className="font-medium text-gray-900 dark:text-white">
                  Post: {context.postId || 'Unknown'}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Type: {context.contextType} | 
                  Received: {new Date(context.receivedAt || 0).toLocaleTimeString()}
                </div>
                {context.threadInfo && (
                  <div className="text-purple-600 dark:text-purple-400 text-xs mt-1">
                    Thread: {context.threadInfo.threadId} | 
                    Update: {context.threadInfo.isUpdate ? 'Yes' : 'No'}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 dark:text-gray-400 text-center py-4">
            No context received yet
          </div>
        )}
      </Card>

      {/* Test Controls */}
      <div className="flex gap-3">
        <Button 
          onClick={testProducerToHostCommunication}
          disabled={isTestRunning}
          className="flex-1"
        >
          {isTestRunning ? '🔄 Testing...' : '🧪 Test Communication'}
        </Button>
        <Button 
          onClick={clearLogs}
          variant="outline"
        >
          🗑️ Clear Logs
        </Button>
      </div>

      {/* Communication Logs */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          📊 Communication Logs
        </h3>
        {logs.length > 0 ? (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="border-l-4 border-gray-200 dark:border-gray-700 pl-4 py-2">
                <div className="flex items-start gap-2">
                  <span className="text-lg">{getLogIcon(log.type)}</span>
                  <div className="flex-1">
                    <div className={`font-medium ${getLogColor(log.type)}`}>
                      {log.message}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                    {log.data && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-800 dark:hover:text-gray-200">
                          View Data
                        </summary>
                        <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 dark:text-gray-400 text-center py-8">
            No communication logs yet. Run a test to see the flow!
          </div>
        )}
      </Card>
    </div>
  );
}