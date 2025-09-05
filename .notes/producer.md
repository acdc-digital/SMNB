# News Complete Dataflow Interaction

**Overview:**
Currently, the Host is narrating a monologue using context directly from the live-feed. The Producer agent adds context to the ongoing Story developments by providing a variety of analysis and results. The producer may choose to 'update' an existing story if duplicate overlap is present.

### Data-Chain
```
Reddit API → Live Feed Store → Enhanced Processing Pipeline
     ↓
   Live Feed Posts (with priority_score, sentiment, categories)
     ↓
   Host Agent Store.processLiveFeedPost()
     ↓
   Host Agent Service.processNewsItem()
     ↓
   Host Narrations (with context from Live Feed data)
```

### A. Live Feed → Host/Editor Communication

```
// Enhanced Processing Pipeline orchestrates everything
enhancedProcessingPipeline.start(
  handleNewPost,    // → Live Feed Store
  handleError,      // → Error handling
  handleLoading,    // → Loading states
  pipelineConfig    // → Subreddits, intervals, etc.
)
```
**Pipeline Stages:**
1. Fetch → Gets raw posts from Reddit API
2. Enrich → Adds sentiment, categories, quality scores
3. Score → Calculates priority scores (0-1)
4. Schedule → Selects which posts to publish when
5. Publish → Sends to Live Feed for display
   
**Publishing Schedule**
```// Scheduler selects posts based on:
// - Priority score (highest first)
// - Diversity (different subreddits)  
// - Timing (avoid flooding)
// - Recent publishing history
```

**Priority Scoring (0-1 scale)**
```
// Scoring weights from scoringAgent.ts
const SCORING_WEIGHTS = {
  engagement: 0.4,    // Score + comments
  recency: 0.35,      // How recent the post is
  quality: 0.25       // Content quality score
};
```

**The Live Feed communicates with Host and Editor agents through:**
1. in the simpleLiveFeedStore, when new posts are added, it directly imports and call Host agents processLiveFeedPost. 
2. Uses lazy imports to avoid circular dependencies
3. Converts LiveFeedPost to EnhancedRedditPost format

**Controls.tsx:**
1. Auto-feeds posts to active agents (Host or Editor) with 3-second delays
2. Tracks processed post IDs to avoid duplicates
3. Manages the flow based on which agent is active

### B. Producer → Host/Editor Communication:

