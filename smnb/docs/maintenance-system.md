# Feed Maintenance System Documentation

## Overview

The Feed Maintenance System implements chronological story updates for the SMNB live feed, maintaining a maximum of 50 posts through automated archival and continuous enrichment.

## Core Features

### 🔄 Automated Maintenance (Simulated 15-minute Cron Job)
- **Post Limit Management**: Maintains maximum 50 posts in live feed
- **Intelligent Archival**: Moves excess posts to story_history table
- **Continuous Enrichment**: Adds sentiment, topics, engagement scores
- **Chronological Ordering**: Ensures proper time-based organization

### 📊 Real-time Monitoring
- **Feed Health Dashboard**: Live statistics and status indicators
- **Enrichment Progress**: Track sentiment analysis and topic extraction
- **Archive Activity**: Monitor completed story archival
- **Maintenance Recommendations**: Smart suggestions for optimization

### 🔧 Manual Controls
- **Individual Actions**: Test each maintenance function separately  
- **Complete Maintenance**: Run full cycle with all tasks
- **Automated Mode**: Simulate periodic cron job execution
- **Statistics Refresh**: Real-time data updates every 30 seconds

## Architecture

### Core Components

1. **`feedMaintenanceCore.ts`** - Convex functions for maintenance logic
   - `maintainLiveFeed()` - Enforces 50 post limit
   - `enrichOldestPosts()` - Adds metadata to posts
   - `archiveCompletedStories()` - Moves enriched posts to story archive

2. **`feedStats.ts`** - Convex monitoring functions
   - `getLiveFeedStats()` - Current feed health metrics
   - `getPostsWithEnrichmentStatus()` - Detailed post information
   - `triggerManualMaintenance()` - Testing interface

3. **`feedMaintenanceService.ts`** - Service layer
   - Bridges React components and Convex backend
   - Provides TypeScript interfaces and error handling
   - Implements automation logic

4. **`FeedMaintenanceDashboard.tsx`** - React UI component
   - Interactive dashboard with real-time updates
   - Manual trigger buttons for testing
   - Visual indicators for system health

5. **`/maintenance` Page** - Testing interface
   - Standalone page for system monitoring
   - Educational information about maintenance process
   - Live dashboard integration

### Data Flow

```
Live Feed Posts (50+ items)
          ↓
    Maintenance Check
          ↓
   ┌─────────────────┐
   │   Enrichment    │ → Add sentiment, topics, engagement
   │                 │
   │   Archival      │ → Move old enriched posts to story_history  
   │                 │
   │   Limit Check   │ → Keep only 50 most recent/relevant
   └─────────────────┘
          ↓
    Healthy Feed (≤50 posts)
```

## Usage

### Accessing the Dashboard

Navigate to `/maintenance` to access the Feed Maintenance Dashboard.

### Manual Operations

1. **Check Feed Health**
   - Click "Refresh" to get current statistics
   - Review summary metrics and recommendations

2. **Run Individual Maintenance**
   - **Maintain Feed Size**: Archive excess posts
   - **Enrich Posts**: Add metadata to oldest posts  
   - **Archive Stories**: Move completed stories to database

3. **Automated Maintenance**
   - Click "Automated Maintenance" to simulate 15-minute cron job
   - System intelligently runs only needed operations

### Integration with Live Feed

The maintenance system integrates with the existing live feed store:

```typescript
// Example integration in live feed components
import { feedMaintenanceService } from '@/lib/services/livefeed/feedMaintenanceService';

// Check if maintenance is needed
const stats = await feedMaintenanceService.getFeedStats();
if (stats.maintenanceStatus.needsMaintenance) {
  await feedMaintenanceService.automatedMaintenance();
}
```

## Configuration

### Maintenance Constants

```typescript
const MAX_LIVE_POSTS = 50;           // Maximum posts in live feed
const ENRICHMENT_BATCH_SIZE = 5;     // Posts enriched per cycle
const ARCHIVE_AGE_HOURS = 24;        // Age threshold for archival
```

### Automation Settings

- **Refresh Interval**: 30 seconds for dashboard updates
- **Simulated Cron**: 15-minute maintenance cycle simulation
- **Batch Processing**: 3-5 posts per enrichment cycle
- **Smart Triggers**: Only runs maintenance when needed

## Monitoring

### Health Indicators

- 🟢 **Healthy**: ≤50 posts, enrichment up to date
- 🟡 **Attention**: 51-60 posts, some enrichment needed
- 🔴 **Action Required**: >60 posts, maintenance overdue

### Statistics Tracked

- Total posts in live feed
- Enrichment progress (sentiment, topics, engagement)
- Recent activity (last hour, last 24 hours)
- Archive statistics
- System recommendations

## Technical Implementation

### Convex Integration

Uses existing Convex infrastructure:
- `redditFeed.getLiveFeedPosts` - Query current feed
- `storyHistory.addStory` - Archive completed stories
- Real-time reactivity for dashboard updates

### Error Handling

- Graceful degradation when Convex is unavailable
- Retry logic for transient failures
- User-friendly error messages
- Logging for debugging

### Performance Considerations

- Batch processing for large operations
- Intelligent filtering to avoid unnecessary work
- Efficient Convex queries with proper indexing
- Rate limiting for API calls

## Future Enhancements

### Planned Features

1. **True Cron Jobs**: Replace simulation with actual Convex cron jobs
2. **ML Enhancement**: Better sentiment analysis and topic extraction  
3. **User Preferences**: Customizable maintenance settings
4. **Advanced Analytics**: Trend analysis and predictive maintenance
5. **Notification System**: Alerts for maintenance issues

### Scalability

- Horizontal scaling through Convex infrastructure
- Configurable batch sizes for different load levels
- Monitoring integration for production environments
- Performance metrics and optimization

## Testing

### Manual Testing

1. Navigate to `/maintenance` page
2. Generate test posts using live feed
3. Trigger maintenance functions individually
4. Verify statistics update correctly
5. Check story_history table for archived content

### Automated Testing

```typescript
// Example test scenario
const stats = await feedMaintenanceService.getFeedStats();
expect(stats.totalPosts).toBeLessThanOrEqual(50);

await feedMaintenanceService.automatedMaintenance();
const newStats = await feedMaintenanceService.getFeedStats();
expect(newStats.totalPosts).toBeLessThanOrEqual(50);
```

## Troubleshooting

### Common Issues

1. **High Post Count**: Run manual maintenance or automated cycle
2. **Enrichment Backlog**: Use "Enrich Posts" button repeatedly
3. **Dashboard Not Updating**: Check network connection and refresh
4. **Convex Errors**: Verify environment configuration

### Debug Information

- Browser console shows detailed logging
- Maintenance actions include result summaries
- Error messages provide actionable guidance
- Statistics help identify bottlenecks

## Summary

The Feed Maintenance System provides intelligent, automated management of the live feed through:

- **Chronological Organization**: Maintains proper time-based ordering
- **Capacity Management**: Enforces 50 post maximum efficiently  
- **Content Enrichment**: Continuous improvement through metadata addition
- **Story Archival**: Preserves valuable content in permanent storage
- **Real-time Monitoring**: Live dashboard for system health
- **Manual Override**: Complete control for testing and debugging

This system ensures the live feed remains performant, relevant, and well-organized while preserving valuable content for future reference.