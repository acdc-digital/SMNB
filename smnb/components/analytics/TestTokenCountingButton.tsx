// TEST TOKEN COUNTING BUTTON
// /Users/matthewsimon/Projects/SMNB/smnb/components/analytics/TestTokenCountingButton.tsx

/**
 * Test Token Counting Button
 * 
 * Component to test the token counting system by making actual Claude API calls.
 * This helps verify that the analytics dashboard is working correctly.
 */

'use client';

import React, { useState } from 'react';
import { ClaudeLLMService } from '@/lib/services/host/claudeLLMService';

interface TestResult {
  type: 'generate' | 'stream' | 'analyze' | 'test';
  success: boolean;
  text?: string;
  error?: string;
  tokens?: number;
  duration?: number;
}

export default function TestTokenCountingButton() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const claudeService = new ClaudeLLMService();

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    const testResults: TestResult[] = [];

    try {
      // Test 1: Connection test
      console.log('🔍 Running connection test...');
      const connectionTest = await claudeService.testConnection();
      testResults.push({
        type: 'test',
        success: connectionTest,
        text: connectionTest ? 'Connection successful' : 'Connection failed'
      });

      if (connectionTest) {
        // Test 2: Simple generation
        console.log('🤖 Testing text generation...');
        try {
          const startTime = Date.now();
          const generatedText = await claudeService.generate(
            'Write a brief news headline about artificial intelligence breakthroughs.',
            { maxTokens: 50, temperature: 0.7 }
          );
          const duration = Date.now() - startTime;
          
          testResults.push({
            type: 'generate',
            success: true,
            text: generatedText,
            duration
          });
        } catch (error) {
          testResults.push({
            type: 'generate',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }

        // Test 3: Content analysis
        console.log('🧠 Testing content analysis...');
        try {
          const analysisResult = await claudeService.analyzeContent(
            'Breaking: Scientists discover new renewable energy source that could revolutionize clean power generation'
          );
          
          testResults.push({
            type: 'analyze',
            success: true,
            text: `Sentiment: ${analysisResult.sentiment}, Topics: ${analysisResult.topics.join(', ')}`
          });
        } catch (error) {
          testResults.push({
            type: 'analyze',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }

        // Test 4: Streaming generation
        console.log('📡 Testing streaming generation...');
        try {
          let streamedText = '';
          const startTime = Date.now();
          
          await claudeService.generateStream(
            'Describe the latest trends in sustainable technology in one paragraph.',
            { maxTokens: 100, temperature: 0.6 },
            (chunk) => {
              streamedText += chunk;
            },
            (fullText) => {
              const duration = Date.now() - startTime;
              testResults.push({
                type: 'stream',
                success: true,
                text: fullText,
                duration
              });
              setResults([...testResults]);
            },
            (error) => {
              testResults.push({
                type: 'stream',
                success: false,
                error: error.message
              });
              setResults([...testResults]);
            }
          );
        } catch (error) {
          testResults.push({
            type: 'stream',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

    } catch (error) {
      console.error('Test suite error:', error);
    } finally {
      setResults(testResults);
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'test': return '🔍';
      case 'generate': return '🤖';
      case 'analyze': return '🧠';
      case 'stream': return '📡';
      default: return '❓';
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? '✅' : '❌';
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            🧪 Test Token Counting System
          </h3>
          <p className="text-sm text-muted-foreground">
            Run API tests to populate analytics data and verify token counting accuracy
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={runTests}
            disabled={isRunning}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              isRunning
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
            }`}
          >
            {isRunning ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                Running Tests...
              </span>
            ) : (
              'Run Token Tests'
            )}
          </button>
          {results.length > 0 && (
            <button
              onClick={clearResults}
              className="px-4 py-2 rounded-md font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer"
            >
              Clear Results
            </button>
          )}
        </div>
      </div>

      {/* Test Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-foreground border-b border-border pb-2">
            Test Results ({results.length}/4 completed)
          </div>
          
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-3 rounded-md border ${
                result.success
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                  : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 mb-2">
                  <span>{getTypeIcon(result.type)}</span>
                  <span className="font-medium text-sm">
                    {result.type.toUpperCase()} Test
                  </span>
                  <span>{getStatusIcon(result.success)}</span>
                  {result.duration && (
                    <span className="text-xs text-muted-foreground">
                      ({result.duration}ms)
                    </span>
                  )}
                </div>
              </div>
              
              {result.text && (
                <div className="text-sm text-foreground bg-background p-2 rounded border">
                  {result.text.length > 150 
                    ? `${result.text.substring(0, 150)}...`
                    : result.text
                  }
                </div>
              )}
              
              {result.error && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-background p-2 rounded border">
                  Error: {result.error}
                </div>
              )}
            </div>
          ))}
          
          {results.length === 4 && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                ✅ Test suite completed! Check the analytics components above to see updated token usage data.
                The token counting service should now show real usage statistics.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Usage Instructions */}
      {!isRunning && results.length === 0 && (
        <div className="mt-4 p-3 bg-muted rounded-md">
          <div className="text-sm text-muted-foreground">
            <strong>Usage:</strong> Click "Run Token Tests" to execute a series of Claude API calls 
            that will populate the analytics dashboard with real token usage data. This helps verify 
            that the token counting system is working correctly.
          </div>
        </div>
      )}
    </div>
  );
}