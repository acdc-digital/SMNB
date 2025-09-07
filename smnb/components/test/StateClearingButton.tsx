// STATE CLEARING BUTTON COMPONENT
// /Users/matthewsimon/Projects/SMNB/smnb/components/test/StateClearingButton.tsx

/**
 * Testing component for manually clearing application state
 * Should only be used during development/testing
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { clearAllApplicationState, clearFeedState, checkStateClearingCapabilities } from '@/lib/utils/stateClearingUtils';

interface StateClearingButtonProps {
  variant?: 'all' | 'feed';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function StateClearingButton({
  variant = 'feed',
  size = 'sm',
  className = ''
}: StateClearingButtonProps) {
  const [isClearing, setIsClearing] = useState(false);
  const [lastClear, setLastClear] = useState<Date | null>(null);

  const handleClearState = async () => {
    if (isClearing) return;

    // Confirmation
    const message = variant === 'all' 
      ? 'Clear ALL application state? This will reset posts, stories, threads, and agent states.'
      : 'Clear feed state? This will reset posts, stories, and threads but keep agents running.';
    
    const confirmed = window.confirm(message);
    if (!confirmed) return;

    setIsClearing(true);
    
    try {
      if (variant === 'all') {
        await clearAllApplicationState();
      } else {
        await clearFeedState();
      }
      
      setLastClear(new Date());
      console.log(`✅ Manual state clear (${variant}) completed successfully`);
      
    } catch (error) {
      console.error(`❌ Manual state clear (${variant}) failed:`, error);
      alert(`Failed to clear state: ${error}`);
    } finally {
      setIsClearing(false);
    }
  };

  const handleCheckCapabilities = async () => {
    try {
      const capabilities = await checkStateClearingCapabilities();
      console.log('🔧 State clearing capabilities:', capabilities);
      
      const message = `State Clearing Capabilities:
• Live Feed: ${capabilities.liveFeed ? '✅' : '❌'}
• Story Threads: ${capabilities.storyThreads ? '✅' : '❌'}  
• Host Agent: ${capabilities.hostAgent ? '✅' : '❌'}
• Producer: ${capabilities.producer ? '✅' : capabilities.producer === false ? '❌' : '❓'}
• Editor: ${capabilities.editor ? '✅' : capabilities.editor === false ? '❌' : '❓'}`;
      
      alert(message);
    } catch (error) {
      console.error('❌ Failed to check capabilities:', error);
    }
  };

  const getButtonText = () => {
    if (isClearing) {
      return variant === 'all' ? 'Clearing All...' : 'Clearing Feed...';
    }
    return variant === 'all' ? 'Clear All State' : 'Clear Feed State';
  };

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 'h-8 px-3 text-xs';
      case 'lg': return 'h-12 px-6 text-base';
      default: return 'h-10 px-4 text-sm';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        onClick={handleClearState}
        disabled={isClearing}
        variant={variant === 'all' ? 'destructive' : 'outline'}
        className={`${getButtonSize()} ${variant === 'all' ? 'bg-red-600 hover:bg-red-700' : 'border-orange-200 hover:bg-orange-50'}`}
      >
        {isClearing && <span className="mr-1">🔄</span>}
        {getButtonText()}
      </Button>
      
      {size !== 'sm' && (
        <Button
          onClick={handleCheckCapabilities}
          variant="ghost"
          className="h-8 px-2 text-xs text-muted-foreground"
          title="Check state clearing capabilities"
        >
          🔧
        </Button>
      )}
      
      {lastClear && (
        <span className="text-xs text-muted-foreground">
          Cleared: {lastClear.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}

// Export individual clearing functions for direct use
export { clearAllApplicationState, clearFeedState, checkStateClearingCapabilities };