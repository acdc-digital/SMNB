// MOCK DATA INJECTION BUTTON
// /Users/matthewsimon/Projects/SMNB/smnb/components/test/MockDataInjectionButton.tsx

/**
 * Mock Data Injection Button
 * 
 * Component to inject mock Reddit posts for testing when Reddit API is unavailable.
 * This will trigger the processing pipeline and generate token usage.
 */

'use client';

import React, { useState } from 'react';
import { TestDataGenerator } from '@/lib/services/testDataGenerator';

export default function MockDataInjectionButton() {
  const [isInjecting, setIsInjecting] = useState(false);
  const [injectionCount, setInjectionCount] = useState(0);

  const injectMockData = async () => {
    setIsInjecting(true);
    
    try {
      // Generate mock posts
      const mockPosts = TestDataGenerator.generateMockPosts(3);
      console.log('🧪 Generated mock posts:', mockPosts);
      
      // Dispatch event to add posts to the live feed
      mockPosts.forEach(post => {
        window.dispatchEvent(new CustomEvent('mock-post-injection', {
          detail: { post }
        }));
      });
      
      setInjectionCount(prev => prev + mockPosts.length);
      
      console.log(`✅ Injected ${mockPosts.length} mock posts for processing`);
      
    } catch (error) {
      console.error('❌ Error injecting mock data:', error);
    } finally {
      setTimeout(() => setIsInjecting(false), 1000);
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            🧪 Mock Data Injection
          </h3>
          <p className="text-xs text-muted-foreground">
            Inject mock posts to test processing pipeline when Reddit API is down
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Injected</div>
          <div className="text-lg font-bold text-foreground">{injectionCount}</div>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={injectMockData}
          disabled={isInjecting}
          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isInjecting
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'
          }`}
        >
          {isInjecting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              Injecting...
            </span>
          ) : (
            'Inject 3 Mock Posts'
          )}
        </button>
        
        <button
          onClick={() => setInjectionCount(0)}
          className="px-3 py-2 rounded-md text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer"
        >
          Reset
        </button>
      </div>
      
      <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md">
        <div className="text-xs text-yellow-800 dark:text-yellow-200">
          <strong>Note:</strong> This bypasses Reddit API rate limits and injects mock posts 
          directly into the processing pipeline to test Host agent narration and token counting.
        </div>
      </div>
    </div>
  );
}