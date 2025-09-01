'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSimpleLiveFeedStore } from '@/lib/stores/livefeed/simpleLiveFeedStore';

export default function Controls() {
  const [newSubreddit, setNewSubreddit] = useState('');
  const [customSubreddits, setCustomSubreddits] = useState<string[]>([]);
  const [enabledDefaults, setEnabledDefaults] = useState<string[]>(['all', 'news', 'worldnews', 'technology', 'gaming', 'funny', 'todayilearned', 'askreddit']);
  const [enabledNsfwDefaults, setEnabledNsfwDefaults] = useState<string[]>(['nsfw', 'gonewild', 'realgirls', 'boobs', 'ass']);
  
  const { 
    posts,
    isLive,
    setSelectedSubreddits,
    setIsLive,
    contentMode,
    setContentMode 
  } = useSimpleLiveFeedStore();

  // Default subreddits for different content modes
  const allDefaultSubreddits = ['all', 'news', 'worldnews', 'technology', 'gaming', 'funny', 'todayilearned', 'askreddit'];
  const allNsfwDefaultSubreddits = ['nsfw', 'gonewild', 'realgirls', 'boobs', 'ass', 'nsfw411', 'tipofmypenis', 'dirtyr4r'];
  
  // Get current default subreddits and enabled defaults based on content mode
  const currentDefaultSubreddits = contentMode === 'nsfw' ? allNsfwDefaultSubreddits : allDefaultSubreddits;
  const currentEnabledDefaults = contentMode === 'nsfw' ? enabledNsfwDefaults : enabledDefaults;

  const updateSelectedSubreddits = useCallback((enabledDefaults: string[], customSubreddits: string[]) => {
    const allSubreddits = [...enabledDefaults, ...customSubreddits];
    setSelectedSubreddits(allSubreddits);
  }, [setSelectedSubreddits]);

  const handleToggleDefaultSubreddit = (subreddit: string) => {
    if (contentMode === 'nsfw') {
      const updatedEnabledDefaults = enabledNsfwDefaults.includes(subreddit)
        ? enabledNsfwDefaults.filter(sub => sub !== subreddit)
        : [...enabledNsfwDefaults, subreddit];
      
      setEnabledNsfwDefaults(updatedEnabledDefaults);
      updateSelectedSubreddits(updatedEnabledDefaults, customSubreddits);
      
      const action = enabledNsfwDefaults.includes(subreddit) ? '❌ Disabled' : '✅ Enabled';
      console.log(`${action} NSFW subreddit: r/${subreddit}`);
    } else {
      const updatedEnabledDefaults = enabledDefaults.includes(subreddit)
        ? enabledDefaults.filter(sub => sub !== subreddit)
        : [...enabledDefaults, subreddit];
      
      setEnabledDefaults(updatedEnabledDefaults);
      updateSelectedSubreddits(updatedEnabledDefaults, customSubreddits);
      
      const action = enabledDefaults.includes(subreddit) ? '❌ Disabled' : '✅ Enabled';
      console.log(`${action} default subreddit: r/${subreddit}`);
    }
  };

  const handleAddSubreddit = () => {
    if (newSubreddit.trim() && !customSubreddits.includes(newSubreddit.trim().toLowerCase())) {
      const subredditToAdd = newSubreddit.trim().toLowerCase();
      const updatedCustom = [...customSubreddits, subredditToAdd];
      setCustomSubreddits(updatedCustom);
      
      updateSelectedSubreddits(currentEnabledDefaults, updatedCustom);
      
      setNewSubreddit('');
      console.log(`✅ Added subreddit: r/${subredditToAdd}`);
    }
  };

  const handleRemoveSubreddit = (subredditToRemove: string) => {
    const updatedCustom = customSubreddits.filter(sub => sub !== subredditToRemove);
    setCustomSubreddits(updatedCustom);
    
    updateSelectedSubreddits(currentEnabledDefaults, updatedCustom);
    
    console.log(`❌ Removed subreddit: r/${subredditToRemove}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddSubreddit();
    }
  };

  // Update selected subreddits when content mode changes
  useEffect(() => {
    updateSelectedSubreddits(currentEnabledDefaults, customSubreddits);
  }, [contentMode, currentEnabledDefaults, customSubreddits, updateSelectedSubreddits]);

  return (
    <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
      
      {/* Status & Primary Actions */}
      <div className="flex items-center justify-between mb-4 p-3 bg-muted/30 rounded-lg border border-muted/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div 
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                isLive
                  ? 'bg-green-500 animate-pulse shadow-green-500/30 shadow-sm' 
                  : 'bg-gray-400'
              }`}
            />
            <span className="font-mono text-xs font-medium tracking-wider">{isLive ? 'LIVE' : 'STOPPED'}</span>
          </div>
          
          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-3 py-1.5 rounded-md font-medium text-xs transition-all duration-200 cursor-pointer hover:scale-[1.02] ${
              isLive
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isLive ? 'Stop' : 'Start'}
          </button>
        </div>
        
        <div className="flex gap-1.5">
          <button
            onClick={() => setContentMode('sfw')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              contentMode === 'sfw'
                ? 'bg-blue-500 text-white'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
          >
            SFW
          </button>
          <button
            onClick={() => setContentMode('nsfw')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              contentMode === 'nsfw'
                ? 'bg-red-500 text-white'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
          >
            NSFW
          </button>
        </div>
        
        <div className="text-xs font-mono text-muted-foreground">
          <span>Posts: <span className="text-foreground">{posts.length}</span></span>
        </div>
      </div>

      {/* Unified Channel Controls */}
      <div className="space-y-3">
        {/* Default Channels */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2 tracking-wide">
            {contentMode === 'nsfw' ? 'NSFW CHANNELS' : 'DEFAULT CHANNELS'}
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {currentDefaultSubreddits.map((subreddit) => {
              const isEnabled = currentEnabledDefaults.includes(subreddit);
              return (
                <button
                  key={subreddit}
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-all hover:scale-[1.02] ${
                    isEnabled 
                      ? (contentMode === 'nsfw' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white')
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                  onClick={() => handleToggleDefaultSubreddit(subreddit)}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    isEnabled 
                      ? 'bg-white' 
                      : 'border border-current'
                  }`} />
                  <span>r/{subreddit}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Channels */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2 tracking-wide">CUSTOM CHANNELS</h4>
          
          {/* Add New Channel */}
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newSubreddit}
              onChange={(e) => setNewSubreddit(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., javascript"
              className="flex-1 px-2 py-1 text-xs border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <button 
              onClick={handleAddSubreddit}
              className="px-2.5 py-1 text-xs bg-purple-500 hover:bg-purple-600 text-white rounded-md cursor-pointer transition-all hover:scale-[1.02] font-medium"
            >
              Add
            </button>
          </div>

          {/* Custom Channels List */}
          <div className="flex flex-wrap gap-1.5">
            {customSubreddits.length > 0 ? (
              customSubreddits.map((subreddit) => (
                <div
                  key={subreddit}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-500 text-white"
                >
                  <span>r/{subreddit}</span>
                  <button
                    onClick={() => handleRemoveSubreddit(subreddit)}
                    className="w-3 h-3 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-xs cursor-pointer transition-all leading-none"
                    title="Remove channel"
                  >
                    ×
                  </button>
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground italic">
                No custom channels
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
