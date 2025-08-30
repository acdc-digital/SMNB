'use client';

import { useState } from 'react';
import { useLiveFeedStore } from '@/lib/stores/liveFeedStore';

export default function LiveFeedControls() {
  const {
    isLive,
    isLoading,
    selectedSubreddits,
    customSubreddits,
    refreshInterval,
    contentMode,
    totalPostsFetched,
    postsPerMinute,
    posts,
    setLive,
    setSubreddits,
    setRefreshInterval,
    setContentMode,
    addCustomSubreddit,
    removeCustomSubreddit,
  } = useLiveFeedStore();

  const popularSubreddits = [
    'all', 'worldnews', 'technology', 'science', 'programming', 
    'news', 'politics', 'gaming', 'funny', 'todayilearned'
  ];

  const [customSubredditInput, setCustomSubredditInput] = useState('');

  const handleAddCustomSubreddit = () => {
    const subreddit = customSubredditInput.trim().toLowerCase();
    if (subreddit && !popularSubreddits.includes(subreddit) && !customSubreddits.includes(subreddit)) {
      addCustomSubreddit(subreddit);
      setCustomSubredditInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCustomSubreddit();
    }
  };

  const toggleSubreddit = (subreddit: string) => {
    const newSubreddits = selectedSubreddits.includes(subreddit)
      ? selectedSubreddits.filter(s => s !== subreddit)
      : [...selectedSubreddits, subreddit];
    setSubreddits(newSubreddits);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Live Feed
          {isLive && <span className="animate-pulse">📡</span>}
        </h1>
        <p className="text-gray-600 text-sm">
          Real-time trending content from Reddit&apos;s most popular communities
        </p>
      </div>

      {/* Live Toggle and Refresh Interval */}
      <div className="bg-white rounded-lg shadow-sm p-4 border">
        <div className="flex flex-col gap-4">
          {/* Live toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Live Feed</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  console.log('🔄 Live toggle clicked, current state:', isLive);
                  setLive(!isLive);
                  console.log('🔄 Live toggle set to:', !isLive);
                }}
                title={isLive ? 'Pause live feed' : 'Start live feed'}
                aria-label={isLive ? 'Pause live feed' : 'Start live feed'}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${isLive ? 'bg-green-500' : 'bg-gray-300'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${isLive ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
              <span className={`text-sm font-medium ${isLive ? 'text-green-600' : 'text-gray-500'}`}>
                {isLive ? '🟢 LIVE' : '⚪ PAUSED'}
              </span>
            </div>
          </div>

          {/* NSFW Content Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Content Mode</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  console.log('🔄 Content mode toggle clicked, current mode:', contentMode);
                  const newMode = contentMode === 'sfw' ? 'nsfw' : 'sfw';
                  setContentMode(newMode);
                  console.log('🔄 Content mode set to:', newMode);
                }}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${contentMode === 'nsfw' ? 'bg-red-500' : 'bg-green-500'}
                `}
                title={contentMode === 'nsfw' ? 'Switch to SFW content' : 'Switch to NSFW content'}
                aria-label={contentMode === 'nsfw' ? 'Switch to SFW content' : 'Switch to NSFW content'}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${contentMode === 'nsfw' ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
              <span className={`text-sm ${contentMode === 'nsfw' ? 'text-red-600' : 'text-green-600'}`}>
                {contentMode === 'nsfw' ? '🔞 NSFW' : '🙈 SFW'}
              </span>
            </div>
          </div>

          {/* Refresh interval */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Refresh:</label>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              title="Select refresh interval"
              aria-label="Select refresh interval"
              className="text-sm border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={30}>30s</option>
              <option value={60}>1m</option>
              <option value={120}>2m</option>
              <option value={300}>5m</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subreddit Selection */}
      <div className="bg-white rounded-lg shadow-sm p-4 border">
        <label className="text-sm font-medium text-gray-700 block mb-3">Sources:</label>
        <div className="grid grid-cols-2 gap-2">
          {popularSubreddits.map(subreddit => (
            <button
              key={subreddit}
              onClick={() => toggleSubreddit(subreddit)}
              className={`
                text-xs px-2 py-1.5 rounded border transition-colors text-left
                ${selectedSubreddits.includes(subreddit)
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                }
              `}
            >
              r/{subreddit}
            </button>
          ))}
        </div>

        {/* Custom subreddit input */}
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={customSubredditInput}
            onChange={(e) => setCustomSubredditInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add custom subreddit..."
            className="flex-1 text-sm px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleAddCustomSubreddit}
            disabled={!customSubredditInput.trim()}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
        </div>

        {/* Custom subreddits */}
        {customSubreddits.length > 0 && (
          <div className="mt-2">
            <label className="text-xs font-medium text-gray-600 block mb-1">Custom:</label>
            <div className="flex flex-wrap gap-1">
              {customSubreddits.map(subreddit => (
                <button
                  key={subreddit}
                  onClick={() => toggleSubreddit(subreddit)}
                  className={`
                    text-xs px-2 py-1 rounded-full border transition-colors flex items-center gap-1
                    ${selectedSubreddits.includes(subreddit)
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-green-300'
                    }
                  `}
                >
                  r/{subreddit}
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCustomSubreddit(subreddit);
                    }}
                    className="ml-1 text-xs hover:text-red-500"
                  >
                    ×
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="bg-white rounded-lg shadow-sm p-4 border">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Statistics</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-blue-600">{posts.length}</div>
            <div className="text-xs text-gray-500">Posts</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">{totalPostsFetched}</div>
            <div className="text-xs text-gray-500">Fetched</div>
          </div>
          <div>
            <div className="text-lg font-bold text-purple-600">{postsPerMinute}</div>
            <div className="text-xs text-gray-500">Per Min</div>
          </div>
        </div>
      </div>

      {/* Status */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded text-center text-sm">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            Fetching latest posts...
          </div>
        </div>
      )}
    </div>
  );
}
