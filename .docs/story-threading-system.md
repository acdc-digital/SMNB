# Story Threading System Documentation

## Overview

The Story Threading System is a sophisticated content curation and continuation system for SMNB that automatically detects related news stories, creates story threads, and provides intelligent updates with visual indicators for users.

## System Architecture

```
Live Feed Posts → Thread Detection → Host Processing → Producer Enhancement → UI Updates
      ↓               ↓                    ↓                    ↓              ↓
  Raw Reddit      Thread Store       Host Agent          Producer Agent   "UPDATED" Badges
     Posts        (Similarity)     (Narrations)        (Context Data)     (Visual Cues)
```

## Core Components

### 1. Story Thread Types (`/lib/types/storyThread.ts`)

**Key Interfaces:**
- `StoryThread`: Represents a continuous story with topic, keywords, entities, and updates
- `StoryUpdate`: Individual updates to existing threads with type classification
- `ThreadDetectionCriteria`: Configuration for similarity matching
- `ThreadMatchResult`: Results from thread detection algorithm

**Thread Detection Algorithm:**
- **Topic Similarity**: 70% threshold for keyword overlap
- **Entity Overlap**: 30% threshold for named entity matching
- **Time Window**: 24 hours for updates to remain active
- **Significance Score**: Weighted scoring (engagement 40%, recency 35%, quality 25%)

### 2. Story Thread Store (`/lib/stores/livefeed/storyThreadStore.ts`)

**Core Functionality:**
- **Thread Detection**: `detectExistingThread()` uses similarity algorithms
- **Thread Creation**: `createNewThread()` for new story threads
- **Update Management**: `addUpdateToThread()` for thread updates
- **Maintenance**: Automatic cleanup and significance recalculation

**Key Methods:**
```typescript
processPostForThreads(post: EnhancedRedditPost): Promise<{
  threadId: string;
  isNewThread: boolean;
  isUpdate: boolean;
  updateType?: StoryUpdate['updateType'];
}>
```

### 3. Enhanced Host Agent (`/lib/services/host/hostAgentService.ts`)

**Thread-Aware Processing:**
- `processRedditPostWithThreads()`: Main entry point for Reddit posts
- `generateThreadUpdateNarration()`: Special narrations for updates
- Thread context integration in narration generation

**Update Types Mapping:**
- `new_development` → 'developing' tone
- `follow_up` → 'analysis' tone  
- `clarification` → 'analysis' tone
- `correction` → 'breaking' tone

### 4. Enhanced Live Feed Store (`/lib/stores/livefeed/simpleLiveFeedStore.ts`)

**Thread-Aware Features:**
- `processPostWithThreads()`: Processes posts through thread system
- `markThreadUpdate()`: Adds update badges to posts
- Update badge management with auto-hide after 30 seconds

**Update Badge Types:**
- `new_development`: "UPDATED" (breaking style)
- `follow_up`: "FOLLOW-UP" 
- `clarification`: "CLARIFIED"
- `correction`: "CORRECTED"

### 5. Enhanced Producer Store (`/lib/stores/producer/producerStore.ts`)

**Thread Context Enhancement:**
- `sendThreadAwareContext()`: Sends context with thread information
- `analyzeThreadRelevance()`: Calculates relevance scores
- Thread metadata in context data for agents

## Workflow Process

### Step 1: Post Ingestion
1. Reddit post arrives in Live Feed
2. Post converted to `EnhancedRedditPost` format
3. Initial processing status set to 'raw'

### Step 2: Thread Detection
1. Extract keywords and entities from post content
2. Compare against active threads using similarity algorithms
3. Determine if post matches existing thread or creates new one
4. Calculate confidence scores and match reasons

### Step 3: Thread Processing
**New Thread:**
- Create `StoryThread` with extracted metadata
- Generate thread topic from keywords/entities
- Set initial significance score

**Existing Thread Update:**
- Create `StoryUpdate` with update type classification
- Increment thread update count
- Recalculate thread significance

### Step 4: Host Agent Processing
1. Convert Reddit post to `NewsItem` format
2. Generate appropriate narration based on thread context
3. Use thread-aware prompts for updates vs. new stories
4. Save narration with thread metadata

### Step 5: Producer Enhancement
1. Analyze post for duplicate detection
2. Generate contextual information
3. Send thread-aware context to Host/Editor agents
4. Include thread metadata in context data

### Step 6: UI Updates
1. Add post to Live Feed with thread information
2. Display update badges for thread updates
3. Emit custom events for UI notifications
4. Auto-hide badges after cooldown period

## Configuration

### Default Thread Detection Settings
```typescript
{
  topicSimilarityThreshold: 0.7,     // 70% keyword overlap
  keywordOverlapThreshold: 0.4,      // 40% keyword match
  entityOverlapThreshold: 0.3,       // 30% entity match
  maxUpdateWindowHours: 24,          // 24 hour update window
  minSignificanceForUpdate: 0.5      // 50% significance required
}
```

### Thread Management Settings
```typescript
{
  maxActiveThreads: 50,              // Maximum concurrent threads
  maxUpdatesPerThread: 10,           // Updates per thread limit
  cooldownMinutes: 15,               // Minimum time between updates
  archival: {
    maxAgeHours: 72,                 // Auto-archive after 72 hours
    minSignificanceToKeep: 0.6       // Keep significant threads longer
  }
}
```

## Testing

### Test Page: `/test-threads`

The test page provides comprehensive testing of the story threading system:

1. **Run Test Workflow**: Creates sample "AI Breakthrough" post
2. **Test Update Post**: Creates follow-up post to trigger thread update
3. **View Statistics**: Shows active threads, updates, and system status
4. **Timeline View**: Detailed workflow execution timeline

### Test Scenarios

**Scenario 1: New Thread Creation**
- Post about new topic creates new thread
- Thread gets unique ID and topic classification
- Host generates initial narration

**Scenario 2: Thread Update Detection**
- Related post triggers thread update
- Update type classified (new_development, follow_up, etc.)
- UI shows "UPDATED" badge with appropriate styling

**Scenario 3: Producer Enhancement**
- Producer analyzes post for duplicates
- Context data enhanced with thread information
- Thread relevance scores calculated

## Integration Points

### Live Feed Integration
```typescript
// Process post through complete workflow
const result = await storyThreadWorkflow.processPostThroughWorkflow(post);

// Check if update
if (result.isUpdate) {
  // Display update badge
  liveFeedStore.markThreadUpdate(post.id, {
    threadId: result.threadId,
    updateType: result.updateType!,
    threadTopic: thread.topic
  });
}
```

### Host Agent Integration
```typescript
// Thread-aware processing
const hostResult = await hostAgent.processRedditPostWithThreads(post);

// Custom narration for updates
if (threadResult.isUpdate) {
  const updateNarration = await hostAgent.generateThreadUpdateNarration(
    post, 
    threadResult.threadId, 
    threadResult.updateType
  );
}
```

### Producer Integration
```typescript
// Thread-aware context
await producer.sendThreadAwareContext(
  contextData,
  threadId,
  isUpdate
);

// Thread relevance analysis
const relevance = await producer.analyzeThreadRelevance(post, threadId);
```

## Visual Indicators

### Update Badges
- **UPDATED**: Breaking news development (red - `bg-red-500`)
- **FOLLOW-UP**: Continuing story (blue - `bg-blue-500`)  
- **CLARIFIED**: Additional information (orange - `bg-orange-500`)
- **CORRECTED**: Error correction (yellow - `bg-yellow-500`)

### Badge Implementation
The badges are now fully implemented in all live feed UI components:

#### Badge Display Logic
```tsx
{post.updateBadge && post.updateBadge.isVisible && (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium animate-in zoom-in-50 ${
    post.updateBadge.type === 'breaking' ? 'bg-red-500 text-white' :
    post.updateBadge.type === 'follow_up' ? 'bg-blue-500 text-white' :
    post.updateBadge.type === 'correction' ? 'bg-yellow-500 text-white' :
    'bg-orange-500 text-white'
  }`}>
    {post.updateBadge.text}
  </span>
)}
```

#### Thread Topic Display  
```tsx
{post.threadTopic && (
  <span className="ml-2 text-purple-600 dark:text-purple-400">
    • 🧵 {post.threadTopic}
  </span>
)}
```

### Badge Behavior
- Appear immediately when update detected with smooth animation (`animate-in zoom-in-50`)
- Auto-hide after 30 seconds (managed by store)
- Clickable to show thread history (future enhancement)
- Color-coded by update importance
- Rounded pill design for modern look

### Badge Testing
A comprehensive demo is available at `/test-badges` showing:
- All four badge types with proper color coding
- Toggle functionality to show/hide badges
- Thread topic indicators
- Live post formatting with badges

## Performance Considerations

### Optimization Strategies
1. **Similarity Caching**: Cache keyword/entity extractions
2. **Thread Limits**: Maximum 50 active threads
3. **Update Cooldowns**: 15-minute minimum between thread updates
4. **Batch Processing**: Process multiple posts efficiently
5. **Memory Management**: Auto-archive old threads

### Monitoring
- Thread creation/update rates
- Similarity algorithm performance
- Memory usage of active threads
- Update badge engagement metrics

## Error Handling

### Graceful Degradation
- If thread detection fails, create new thread
- If Host agent unavailable, skip narration
- If Producer unavailable, skip context enhancement
- UI always shows posts even if threading fails

### Recovery Mechanisms
- Automatic retry for transient failures
- Fallback to non-threaded processing
- Error logging with context preservation
- User notifications for system issues

## Future Enhancements

### Planned Features
1. **Thread Merging**: Combine related threads automatically
2. **Thread Splitting**: Split divergent conversations
3. **User Thread Management**: Manual thread curation
4. **Cross-Platform Threading**: Twitter/other sources
5. **ML-Enhanced Detection**: Better similarity algorithms
6. **Thread Analytics**: Engagement and lifecycle metrics

### API Extensions
1. **Thread Search**: Find threads by topic/keyword
2. **Thread Export**: Export thread timeline
3. **Thread Sharing**: Share thread summaries
4. **Thread Notifications**: Subscribe to thread updates

## Conclusion

The Story Threading System provides intelligent content curation that:
- Automatically detects related stories
- Creates continuous narrative threads
- Provides visual update indicators
- Enhances user experience with context
- Maintains system performance and reliability

This documentation serves as a comprehensive guide for understanding, using, and extending the story threading functionality within SMNB.