# Reddit Integration Guide

This project includes a comprehensive Reddit API integration that allows you to fetch hot, rising, and trending posts from Reddit.

## Features

### 🔥 Reddit API Client
- Fetch hot, rising, new, and top posts
- Support for specific subreddits or r/all
- Search functionality across Reddit
- Rate limiting and error handling
- Pagination support

### 📊 Convex Database Integration
- Store Reddit posts in Convex database
- Full-text search with search indexes
- Query posts by subreddit, sort type, and time filters
- Automatic cleanup of old posts

### 🎨 React Components
- Beautiful Reddit feed display
- Real-time filtering and sorting
- Search functionality
- Multi-subreddit mixing
- Responsive design

## How to Use

### 1. Basic Usage

Navigate to `/reddit` to see the Reddit feed aggregator in action.

### 2. API Endpoints

#### Get Posts from Single Subreddit
```
GET /api/reddit?subreddit=programming&sort=hot&limit=10
```

#### Get Posts from Multiple Subreddits
```
POST /api/reddit
{
  "subreddits": ["technology", "programming", "science"],
  "sort": "hot",
  "limit": 5
}
```

### 3. Server Actions

```typescript
import { fetchHotPosts, fetchRisingPosts, fetchTrendingPosts } from '@/lib/reddit-actions';

// Fetch hot posts
const hotPosts = await fetchHotPosts('programming', 25);

// Fetch rising posts
const risingPosts = await fetchRisingPosts('all', 25);

// Fetch trending posts (top from last hour)
const trendingPosts = await fetchTrendingPosts('technology', 25);
```

### 4. Convex Database Functions

```typescript
// Store posts in database
await storeRedditPosts({ posts: [...] });

// Query hot posts
const hotPosts = await getHotPosts({ subreddit: 'programming', limit: 10 });

// Search posts
const searchResults = await searchRedditPosts({ 
  searchTerm: 'AI', 
  subreddit: 'technology' 
});
```

## Available Sort Types

- **Hot**: Currently popular posts with lots of engagement
- **Rising**: Posts that are gaining momentum quickly
- **New**: Most recently posted content
- **Top**: Best posts from a specific time period (hour, day, week, month, year, all)

## Popular Subreddits

The system includes pre-configured popular subreddits:
- all, popular, AskReddit, worldnews, funny
- todayilearned, pics, science, technology
- gaming, movies, music, programming

## Rate Limiting

Reddit's API has rate limits. The client includes:
- Proper User-Agent headers
- Error handling for rate limit responses
- Graceful degradation when API is unavailable

## Data Structure

Reddit posts include:
- Basic info: title, author, subreddit, score, comments
- Media: thumbnail, video status, domain
- Metadata: creation time, upvote ratio, NSFW status
- Links: permalink, external URL

## Search Functionality

Two types of search available:
1. **Reddit API Search**: Real-time search using Reddit's search API
2. **Database Search**: Full-text search of stored posts using Convex search indexes

## Error Handling

The system includes comprehensive error handling:
- Network timeouts and failures
- Invalid subreddit names
- Rate limiting responses
- Malformed data responses

## Customization

You can easily customize:
- Default subreddits list
- Post display layout
- Sorting options
- Search filters
- Pagination settings

## Performance

- Server-side rendering for initial posts
- Client-side caching of API responses
- Efficient database queries with proper indexes
- Image lazy loading and error handling

## Privacy & Security

- No user authentication required
- All Reddit API calls are server-side
- No personal data collection
- Safe image loading with error boundaries
