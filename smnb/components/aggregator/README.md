# Aggregator Components

This directory contains components for the Reddit content aggregation system that runs in the background.

## Core Components

### `aggregator.tsx`
- **Status**: ✅ Active (used in `/app/dashboard/feed/FeedSidebar.tsx`)
- **Purpose**: Background Reddit post processing and aggregation
- **Features**: 
  - Enhanced Reddit post processing pipeline integration
  - Real-time Reddit API monitoring
  - Post enrichment (sentiment, categories, quality scoring)
  - Background operation (no UI rendering)
  - Convex database integration for post storage

## Architecture

The aggregator runs invisibly in the background and:

1. **Monitors Reddit**: Fetches posts from configured subreddits
2. **Processes Content**: Applies AI enrichment for sentiment, categories, quality scores
3. **Stores Data**: Saves processed posts to Convex database
4. **Feeds Pipeline**: Provides content for Host/Editor to create stories

## Data Flow

```
Reddit API → Aggregator → Enhanced Posts → Convex DB → Host/Editor → Published Stories → Live Feed Display
```

## Configuration

The aggregator uses the same configuration from the live feed store:
- `selectedSubreddits`: Which subreddits to monitor
- `contentMode`: Content filtering preferences
- `refreshInterval`: How often to check for new posts
- `isLive`: Whether aggregation is active

## Integration

- **Used by**: `/app/dashboard/feed/FeedSidebar.tsx`
- **Stores data in**: Convex database via live feed store
- **Feeds**: Host/Editor workflow for story creation
- **UI Display**: Stories appear in `/components/livefeed/liveFeed.tsx`