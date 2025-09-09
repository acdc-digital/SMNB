// MAINTENANCE PAGE
// /app/maintenance/page.tsx

'use client';

import React from 'react';
import FeedMaintenanceDashboard from '@/components/livefeed/FeedMaintenanceDashboard';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🔧 Feed Maintenance Center
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and control chronological story updates for the live feed system.
            This dashboard simulates the 15-minute cron job maintenance process.
          </p>
        </div>
        
        <FeedMaintenanceDashboard />
        
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-400">
          <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">ℹ️ How It Works</h3>
          <div className="text-sm text-blue-700 dark:text-blue-400 space-y-2">
            <p><strong>🔄 Automated Maintenance:</strong> Simulates a 15-minute cron job that:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Maintains maximum 50 posts in the live feed</li>
              <li>Enriches posts with sentiment analysis, topics, and engagement scores</li>
              <li>Archives completed stories to the story_history table</li>
              <li>Ensures chronological ordering of content</li>
            </ul>
            <p className="mt-3">
              <strong>🎯 Smart Processing:</strong> The editor agent continuously enriches stories 
              until they&apos;re ready for archival to the database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}