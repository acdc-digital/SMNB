// FEED MAINTENANCE DASHBOARD
// /components/livefeed/FeedMaintenanceDashboard.tsx

/**
 * Dashboard component for monitoring and controlling chronological story updates
 * Provides real-time stats and manual triggers for feed maintenance
 */

'use client';

import React, { useState, useEffect } from 'react';
import { feedMaintenanceService, MaintenanceStats } from '@/lib/services/livefeed/feedMaintenanceService';

interface MaintenanceAction {
  id: string;
  name: string;
  description: string;
  action: () => Promise<void>;
  loading: boolean;
}

export default function FeedMaintenanceDashboard() {
  const [stats, setStats] = useState<MaintenanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionResults, setActionResults] = useState<Record<string, string>>({});

  // Action definitions
  const [actions, setActions] = useState<MaintenanceAction[]>([
    {
      id: 'maintain',
      name: 'Maintain Feed Size',
      description: 'Enforce 50 post limit and archive excess posts',
      action: async () => {
        const result = await feedMaintenanceService.maintainFeedSize();
        setActionResults(prev => ({
          ...prev,
          maintain: `Archived ${result.postsArchived} posts, ${result.remainingPosts} remaining`
        }));
      },
      loading: false,
    },
    {
      id: 'enrich',
      name: 'Enrich Posts',
      description: 'Add sentiment, topics, and engagement scores to oldest posts',
      action: async () => {
        const result = await feedMaintenanceService.enrichPosts(5);
        setActionResults(prev => ({
          ...prev,
          enrich: `Enriched ${result.postsEnriched} posts`
        }));
      },
      loading: false,
    },
    {
      id: 'archive',
      name: 'Archive Stories',
      description: 'Archive completed stories older than 24 hours',
      action: async () => {
        const result = await feedMaintenanceService.archiveCompletedStories(24);
        setActionResults(prev => ({
          ...prev,
          archive: `Archived ${result.storiesArchived} completed stories`
        }));
      },
      loading: false,
    },
    {
      id: 'full',
      name: 'Complete Maintenance',
      description: 'Run all maintenance tasks in sequence',
      action: async () => {
        const result = await feedMaintenanceService.performCompleteMaintenance();
        setActionResults(prev => ({
          ...prev,
          full: `Complete: ${result.enriched} enriched, ${result.archived} archived, ${result.feedMaintenance} removed`
        }));
      },
      loading: false,
    },
    {
      id: 'auto',
      name: 'Automated Maintenance',
      description: 'Run smart maintenance (simulates 15-minute cron job)',
      action: async () => {
        const result = await feedMaintenanceService.automatedMaintenance();
        setActionResults(prev => ({
          ...prev,
          auto: `Auto maintenance: ${result.actionsPerformed} actions performed - ${result.actions.join(', ')}`
        }));
      },
      loading: false,
    },
  ]);

  // Load initial stats
  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const freshStats = await feedMaintenanceService.getFeedStats();
      setStats(freshStats);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
      console.error('Failed to load feed stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // Execute action with loading state
  const executeAction = async (actionId: string) => {
    const actionIndex = actions.findIndex(a => a.id === actionId);
    if (actionIndex === -1) return;

    // Set loading state
    setActions(prev => prev.map((action, index) => 
      index === actionIndex ? { ...action, loading: true } : action
    ));

    try {
      await actions[actionIndex].action();
      // Reload stats after action
      await loadStats();
    } catch (err) {
      setActionResults(prev => ({
        ...prev,
        [actionId]: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
      }));
    } finally {
      // Clear loading state
      setActions(prev => prev.map((action, index) => 
        index === actionIndex ? { ...action, loading: false } : action
      ));
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatStats = stats ? feedMaintenanceService.formatStatsForDisplay(stats) : null;

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          📊 Feed Maintenance Dashboard
        </h2>
        <button
          onClick={loadStats}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 cursor-pointer"
        >
          {loading ? '🔄 Loading...' : '🔃 Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg">
          ❌ Error: {error}
        </div>
      )}

      {formatStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Summary Stats */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📈 Summary</h3>
            <div className="space-y-2 text-sm">
              <div>Total Posts: <span className="font-mono">{formatStats.summary.totalPosts}</span></div>
              <div>Health: <span className={`font-semibold ${formatStats.summary.health === 'Healthy' ? 'text-green-600' : 'text-red-600'}`}>
                {formatStats.summary.health}
              </span></div>
              <div>Enrichment: <span className="font-mono">{formatStats.summary.enrichmentProgress}</span></div>
              <div>Status: <span className={`font-semibold ${formatStats.summary.status === 'OK' ? 'text-green-600' : 'text-orange-600'}`}>
                {formatStats.summary.status}
              </span></div>
            </div>
          </div>

          {/* Activity Stats */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📊 Activity</h3>
            <div className="space-y-2 text-sm">
              <div>Posts Today: <span className="font-mono">{formatStats.details.postsToday}</span></div>
              <div>Last Hour: <span className="font-mono">{formatStats.details.postsLastHour}</span></div>
              <div>Oldest Post: <span className="font-mono">{formatStats.details.oldestPostAge}</span></div>
              <div>Newest Post: <span className="font-mono">{formatStats.details.newestPostAge}</span></div>
            </div>
          </div>

          {/* Archive Stats */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📚 Archive</h3>
            <div className="space-y-2 text-sm">
              <div>Archived Today: <span className="font-mono">{formatStats.details.archivedStoriesToday}</span></div>
              <div>Total Archived: <span className="font-mono">{formatStats.details.totalArchivedStories}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {formatStats?.recommendations && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-400">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">💡 Recommendations</h3>
          <div className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
            {formatStats.recommendations.needsMaintenance && (
              <div>⚠️ Feed maintenance required (over 50 posts)</div>
            )}
            {formatStats.recommendations.needsEnrichment && (
              <div>🧠 Posts need enrichment</div>
            )}
            {formatStats.recommendations.recommendsArchival && (
              <div>📚 Stories ready for archival</div>
            )}
            {!formatStats.recommendations.needsMaintenance && 
             !formatStats.recommendations.needsEnrichment && 
             !formatStats.recommendations.recommendsArchival && (
              <div>✅ All systems healthy</div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🔧 Maintenance Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action) => (
            <div key={action.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{action.name}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{action.description}</p>
              <button
                onClick={() => executeAction(action.id)}
                disabled={action.loading}
                className="w-full px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded disabled:opacity-50 cursor-pointer"
              >
                {action.loading ? '⏳ Running...' : '▶️ Execute'}
              </button>
              {actionResults[action.id] && (
                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 text-xs rounded">
                  {actionResults[action.id]}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        {lastUpdate && `Last updated: ${lastUpdate.toLocaleTimeString()}`}
        {' • '}
        Auto-refresh every 30 seconds
        {' • '}
        Simulates 15-minute cron job maintenance
      </div>
    </div>
  );
}