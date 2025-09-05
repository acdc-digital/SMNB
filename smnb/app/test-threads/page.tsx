/**
 * Story Thread Test Page
 * 
 * Page for testing and demonstrating the story threading workflow
 */

'use client';

import React from 'react';
import StoryThreadWorkflowTest from '@/components/livefeed/StoryThreadWorkflowTest';
import { ProducerHostCommTest } from '@/components/test/ProducerHostCommTest';

export default function TestThreadsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            🧵 Story Threading System Test
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Test the complete story threading workflow with duplicate detection and update badges.
          </p>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              📡 Producer → Host Communication
            </h2>
            <ProducerHostCommTest />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              🧵 Story Threading Workflow
            </h2>
            <StoryThreadWorkflowTest />
          </div>
        </div>
      </div>
    </div>
  );
}