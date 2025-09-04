// HOST CONTROLS
// /Users/matthewsimon/Projects/SMNB/smnb/components/host/HostControls.tsx

/**
 * Host Control Components
 * 
 * UI controls for managing the host agent settings and state
 */

'use client';

import React from 'react';
import { HostAgentConfig, HostState } from '@/lib/types/hostAgent';

interface HostControlsProps {
  isActive: boolean;
  onToggle: () => void;
  config: HostAgentConfig;
  onConfigChange: (config: Partial<HostAgentConfig>) => void;
  className?: string;
}

export const HostControls: React.FC<HostControlsProps> = ({
  isActive,
  onToggle,
  config,
  onConfigChange,
  className = ''
}) => {
  return (
    <div className={`host-controls space-y-4 ${className}`}>
      {/* Main toggle button */}
      <div className="flex items-center gap-4">
        <button 
          className={`px-4 py-2 rounded-lg border font-medium transition-all duration-300 ${
            isActive 
              ? 'bg-red-500 hover:bg-red-600 text-white border-red-500' 
              : 'bg-green-500 hover:bg-green-600 text-white border-green-500'
          }`}
          onClick={onToggle}
        >
          {isActive ? '⏹️ Stop Broadcasting' : '▶️ Start Broadcasting'}
        </button>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-red-500' : 'bg-gray-400'}`} />
          {isActive ? 'Broadcasting' : 'Offline'}
        </div>
      </div>

      {/* Settings grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Personality selection */}
        <div className="space-y-2">
          <label htmlFor="personality" className="text-sm font-medium text-foreground">
            Host Personality
          </label>
          <select 
            id="personality"
            value={config.personality}
            onChange={(e) => onConfigChange({
              personality: e.target.value as HostAgentConfig['personality']
            })}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isActive}
          >
            <option value="formal">🎩 Formal - Professional & Objective</option>
            <option value="conversational">💬 Conversational - Friendly & Accessible</option>
            <option value="analytical">🧠 Analytical - Data-driven & Insightful</option>
            <option value="energetic">⚡ Energetic - Dynamic & Engaging</option>
          </select>
        </div>
        
        {/* Verbosity level */}
        <div className="space-y-2">
          <label htmlFor="verbosity" className="text-sm font-medium text-foreground">
            Detail Level
          </label>
          <select 
            id="verbosity"
            value={config.verbosity}
            onChange={(e) => onConfigChange({
              verbosity: e.target.value as HostAgentConfig['verbosity']
            })}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isActive}
          >
            <option value="concise">📝 Concise - Brief & To the Point</option>
            <option value="detailed">📄 Detailed - Comprehensive Coverage</option>
            <option value="comprehensive">📚 Comprehensive - Full Analysis</option>
          </select>
        </div>

        {/* Update frequency */}
        <div className="space-y-2">
          <label htmlFor="update-frequency" className="text-sm font-medium text-foreground">
            Update Frequency
          </label>
          <select
            id="update-frequency"
            value={config.updateFrequency}
            onChange={(e) => onConfigChange({
              updateFrequency: parseInt(e.target.value)
            })}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isActive}
          >
            <option value="1000">⚡ Very Fast - 1s</option>
            <option value="3000">🔥 Fast - 3s</option>
            <option value="5000">⏱️ Normal - 5s</option>
            <option value="10000">🐌 Slow - 10s</option>
          </select>
        </div>

        {/* Typing speed */}
        <div className="space-y-2">
          <label htmlFor="typing-speed" className="text-sm font-medium text-foreground">
            Typing Speed
          </label>
          <select
            id="typing-speed"
            value={config.waterfallSpeed}
            onChange={(e) => onConfigChange({
              waterfallSpeed: parseInt(e.target.value)
            })}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="5">🐌 Slow - 5 chars/sec</option>
            <option value="10">📝 Medium - 10 chars/sec</option>
            <option value="15">⚡ Fast - 15 chars/sec</option>
            <option value="25">🚀 Very Fast - 25 chars/sec</option>
          </select>
        </div>
      </div>

      {/* Mock mode toggle */}
      <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-card/50">
        <input
          type="checkbox"
          id="mock-mode"
          checked={config.enableMockMode || false}
          onChange={(e) => onConfigChange({
            enableMockMode: e.target.checked
          })}
          className="w-4 h-4"
          disabled={isActive}
        />
        <label htmlFor="mock-mode" className="text-sm">
          <span className="font-medium">Development Mode</span>
          <span className="text-muted-foreground block text-xs">
            Use mock responses instead of real LLM (saves API costs)
          </span>
        </label>
      </div>
    </div>
  );
};

interface HostStatsProps {
  stats: HostState['stats'];
  className?: string;
}

export const HostStats: React.FC<HostStatsProps> = ({ 
  stats, 
  className = '' 
}) => {
  const formatUptime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className={`host-stats ${className}`}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card p-3 bg-card border border-border rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-500">
            {stats.itemsProcessed}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            Items Processed
          </div>
        </div>
        
        <div className="stat-card p-3 bg-card border border-border rounded-lg text-center">
          <div className="text-2xl font-bold text-green-500">
            {stats.totalNarrations}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            Total Narrations
          </div>
        </div>
        
        <div className="stat-card p-3 bg-card border border-border rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-500">
            {stats.queueLength}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            Queue Length
          </div>
        </div>
        
        <div className="stat-card p-3 bg-card border border-border rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-500">
            {formatUptime(stats.uptime)}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            Uptime
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Average Read Time:</span>
          <span className="font-medium">{stats.averageReadTime}s</span>
        </div>
      </div>
    </div>
  );
};

const hostComponents = { HostControls, HostStats };
export default hostComponents;
