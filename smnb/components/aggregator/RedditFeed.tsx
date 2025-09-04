// REDDIT FEED AGGREGATOR
// /Users/matthewsimon/Projects/SMNB/smnb/components/aggregator/RedditFeed.tsx

'use client';

import { useState, useEffect } from 'react';
import { 
  fetchHotPosts, 
  fetchRisingPosts, 
  fetchTrendingPosts,
  fetchMultipleSubreddits,
  searchRedditPosts,
  type RedditPostWithMeta 
} from '@/lib/reddit-actions';

interface RedditPostProps {
  post: RedditPostWithMeta;
}

function RedditPost({ post }: RedditPostProps) {
  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  return (
    <div className="border rounded-lg p-4 mb-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {/* Upvote section */}
        <div className="flex flex-col items-center text-sm text-gray-500 min-w-[60px]">
          <div className="font-semibold text-orange-500">↑</div>
          <div className="font-medium">{formatNumber(post.score)}</div>
          <div className="text-xs">{Math.round(post.upvote_ratio * 100)}%</div>
        </div>

        {/* Post content */}
        <div className="flex-1">
          {/* Post title */}
          <h3 className="font-semibold text-lg mb-2 hover:text-blue-600">
            <a 
              href={`https://reddit.com${post.permalink}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {post.title}
            </a>
          </h3>

          {/* Post metadata */}
          <div className="flex flex-wrap gap-2 text-sm text-gray-500 mb-2">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
              r/{post.subreddit}
            </span>
            <span>by u/{post.author}</span>
            <span>{formatTimeAgo(post.created_utc)}</span>
            <span>{formatNumber(post.num_comments)} comments</span>
            {post.over_18 && (
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                NSFW
              </span>
            )}
          </div>

          {/* Post preview text */}
          {post.selftext && post.selftext.length > 0 && (
            <p className="text-gray-700 text-sm mb-2 line-clamp-3">
              {post.selftext.slice(0, 200)}
              {post.selftext.length > 200 && '...'}
            </p>
          )}

          {/* Media info */}
          <div className="flex gap-2 text-xs text-gray-400">
            <span>{post.domain}</span>
            {post.is_video && <span className="bg-gray-100 px-2 py-1 rounded">VIDEO</span>}
          </div>
        </div>

        {/* Thumbnail */}
        {post.thumbnail && 
         post.thumbnail !== 'self' && 
         post.thumbnail !== 'default' && 
         post.thumbnail.startsWith('http') && (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={post.thumbnail} 
            alt="Post thumbnail"
            className="w-16 h-16 object-cover rounded"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
      </div>
    </div>
  );
}

interface RedditFeedProps {
  initialPosts?: RedditPostWithMeta[];
}

export default function RedditFeed({ initialPosts = [] }: RedditFeedProps) {
  const [posts, setPosts] = useState<RedditPostWithMeta[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSort, setSelectedSort] = useState<'hot' | 'rising' | 'trending'>('hot');
  const [selectedSubreddit, setSelectedSubreddit] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const popularSubreddits = [
    'all', 'popular', 'AskReddit', 'worldnews', 'funny', 'todayilearned',
    'pics', 'science', 'technology', 'gaming', 'movies', 'music'
  ];

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);

    try {
      let result;
      
      if (searchTerm.trim()) {
        result = await searchRedditPosts(searchTerm, selectedSubreddit, 'relevance', 25);
      } else {
        switch (selectedSort) {
          case 'hot':
            result = await fetchHotPosts(selectedSubreddit, 25);
            break;
          case 'rising':
            result = await fetchRisingPosts(selectedSubreddit, 25);
            break;
          case 'trending':
            result = await fetchTrendingPosts(selectedSubreddit, 25);
            break;
        }
      }

      if (result.error) {
        setError(result.error);
      } else {
        setPosts(result.posts);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchMultipleSubs = async () => {
    setLoading(true);
    setError(null);

    try {
      const interestingSubreddits = ['technology', 'science', 'worldnews', 'programming', 'futurology'];
      // Map trending to top for the API call
      const apiSortType = selectedSort === 'trending' ? 'top' : selectedSort;
      const result = await fetchMultipleSubreddits(interestingSubreddits, apiSortType, 5);

      if (result.error) {
        setError(result.error);
      } else {
        const allPosts = result.successful.flatMap(sub => sub.posts);
        // Sort by score to get the best posts across all subreddits
        const sortedPosts = allPosts.sort((a, b) => b.score - a.score);
        setPosts(sortedPosts);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchTerm.trim()) {
      fetchPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSort, selectedSubreddit]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts();
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Reddit Feed</h1>
        
        {/* Search */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Reddit posts..."
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Search
            </button>
          </div>
        </form>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Sort selection */}
          <div className="flex gap-2">
            {(['hot', 'rising', 'trending'] as const).map((sort) => (
              <button
                key={sort}
                onClick={() => {
                  setSelectedSort(sort);
                  setSearchTerm('');
                }}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  selectedSort === sort
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {sort.charAt(0).toUpperCase() + sort.slice(1)}
              </button>
            ))}
          </div>

          {/* Subreddit selection */}
          <select
            value={selectedSubreddit}
            onChange={(e) => {
              setSelectedSubreddit(e.target.value);
              setSearchTerm('');
            }}
            aria-label="Select subreddit"
            className="px-3 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {popularSubreddits.map((sub) => (
              <option key={sub} value={sub}>
                r/{sub}
              </option>
            ))}
          </select>

          {/* Multi-sub fetch */}
          <button
            onClick={fetchMultipleSubs}
            className="px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Mix Popular
          </button>

          {/* Refresh */}
          <button
            onClick={fetchPosts}
            disabled={loading}
            className="px-3 py-1 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {/* Posts */}
      {loading && posts.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-lg">Loading Reddit posts...</div>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No posts found. Try a different search or subreddit.
        </div>
      ) : (
        <div>
          <div className="text-sm text-gray-500 mb-4">
            Showing {posts.length} posts
            {searchTerm && ` for "${searchTerm}"`}
            {selectedSubreddit !== 'all' && ` from r/${selectedSubreddit}`}
          </div>
          
          {posts.map((post) => (
            <RedditPost key={`${post.subreddit}-${post.id}`} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
