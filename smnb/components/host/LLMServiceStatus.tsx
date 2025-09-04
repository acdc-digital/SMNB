// LLM SERVICE STATUS
// /Users/matthewsimon/Projects/SMNB/smnb/components/host/LLMServiceStatus.tsx

/**
 * LLM Service Status Component
 * 
 * Shows the current LLM service status and allows testing connections
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ClaudeLLMService } from '@/lib/services/host/claudeLLMService';

interface LLMServiceStatusProps {
  className?: string;
}

export const LLMServiceStatus: React.FC<LLMServiceStatusProps> = ({ 
  className = '' 
}) => {
  const [isClaudeAvailable, setIsClaudeAvailable] = useState<boolean | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<string>('');

  useEffect(() => {
    checkClaudeAvailability();
  }, []);

  const checkClaudeAvailability = async () => {
    const claudeService = new ClaudeLLMService();
    const available = await claudeService.checkServerAvailability();
    setIsClaudeAvailable(available);
  };

  const testClaudeConnection = async () => {
    if (isTestingConnection) return;

    setIsTestingConnection(true);
    setConnectionTestResult('');

    try {
      const claudeService = new ClaudeLLMService();
      
      if (!claudeService.isReady()) {
        setConnectionTestResult('❌ No API key configured');
        return;
      }

      const success = await claudeService.testConnection();
      
      if (success) {
        setConnectionTestResult('✅ Connection successful');
      } else {
        setConnectionTestResult('⚠️ Connection test unclear');
      }

    } catch (error) {
      console.error('Connection test error:', error);
      setConnectionTestResult('❌ Connection failed');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const getStatusInfo = () => {
    if (isClaudeAvailable === null) {
      return {
        status: 'Checking...',
        description: 'Checking LLM service availability',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        icon: '⏳'
      };
    }

    if (isClaudeAvailable) {
      return {
        status: 'Claude Ready',
        description: 'Using Claude Haiku 3.5 for intelligent narrations',
        color: 'text-green-500',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        icon: '🤖'
      };
    }

    return {
      status: 'Mock Service',
      description: 'Using mock service - add ANTHROPIC_API_KEY for Claude',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      icon: '🎭'
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`llm-status ${className}`}>
      <div className={`p-3 rounded-lg border ${statusInfo.bgColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{statusInfo.icon}</span>
            <div>
              <div className={`font-medium text-sm ${statusInfo.color}`}>
                {statusInfo.status}
              </div>
              <div className="text-xs text-muted-foreground">
                {statusInfo.description}
              </div>
            </div>
          </div>

          {isClaudeAvailable && (
            <button
              onClick={testClaudeConnection}
              disabled={isTestingConnection}
              className="px-2 py-1 text-xs bg-white dark:bg-gray-800 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              {isTestingConnection ? '🔍 Testing...' : '🔍 Test'}
            </button>
          )}
        </div>

        {connectionTestResult && (
          <div className="mt-2 text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
            {connectionTestResult}
          </div>
        )}

        {!isClaudeAvailable && (
          <div className="mt-2 text-xs text-muted-foreground">
            <div>To use Claude:</div>
            <div className="font-mono bg-gray-100 dark:bg-gray-800 p-1 rounded mt-1">
              ANTHROPIC_API_KEY=your_key_here
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LLMServiceStatus;
