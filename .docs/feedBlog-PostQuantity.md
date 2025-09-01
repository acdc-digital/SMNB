# Feed Post Quantity Analysis

## Current Display Limits

### Hard Limit: 50 Posts Maximum
- **Configuration**: `maxPosts: 50` in `simpleLiveFeedStore.ts`
- **Implementation**: Array slice enforcement in `addPost()` function
- **Behavior**: FIFO queue - oldest posts automatically removed when limit reached

```typescript
const newPosts = [newPost, ...existingPosts].slice(0, state.maxPosts);
```

## Multi-Layer Cleanup System

### 1. **Capacity Management**
- **Trigger**: Every new post addition
- **Action**: Truncate to 50 posts maximum
- **Purpose**: Memory management and UI performance

### 2. **Time-Based Rotation** 
- **Interval**: 10-minute sliding window
- **Function**: `clearOldPosts()` removes stale content
- **Logic**: `addedAt > (Date.now() - 10 minutes)`

### 3. **Periodic Refresh**
- **Frequency**: Every 5 minutes during live operation  
- **Purpose**: Force content freshness regardless of activity
- **Effect**: Clears accumulated posts for new batch intake

### 4. **Deduplication**
- **Check**: Reddit post ID comparison before addition
- **Filter**: `posts.some(p => p.id === newPost.id)`
- **Result**: Prevents duplicate entries in feed

## Performance Metrics

| Metric | Value | Implementation |
|--------|-------|----------------|
| **Display Capacity** | 50 posts | Hard array limit |
| **Fetch Rate** | 10 posts/call | API batch size |
| **Retention Window** | 10 minutes | Time-based cleanup |
| **Refresh Cycle** | 5 minutes | Periodic clearing |
| **Sort Method** | `created_utc` DESC | Newest first |

## Documentation Discrepancy

**Issue**: `feedStats.md` references 25-post limit while codebase implements 50-post capacity.

**Status**: Code configuration takes precedence - **50 posts is the actual limit**.

## System Rationale

- **50-post limit**: Balances content variety with performance
- **10-minute retention**: Ensures fresh content without excessive churn  
- **5-minute cycles**: Prevents stagnation during low-activity periods
- **FIFO queue**: Natural content flow prioritizing recent posts

## Resource Impact

**Memory**: ~50 post objects with metadata
**UI**: Manageable scroll height and render performance
**API**: Efficient batch processing with controlled growth
