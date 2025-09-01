# GitHub Copilot Instructions for SMNB

## Project Overview
SMNB is a Next.js application with a sophisticated live feed system for curating and displaying Reddit news content. The project uses TypeScript, Tailwind CSS, and implements an advanced multi-agent processing pipeline for intelligent content curation.

## Convex Database Guidelines

### Core Convex Principles
- **Reactive Database**: Use TypeScript queries with automatic reactivity
- **Document Storage**: JSON-like documents with relational data model
- **Real-time Updates**: Leverage Convex's real-time sync engine
- **Type Safety**: End-to-end TypeScript type safety with schema validation

### Convex Function Types
- **Queries**: Read data with caching and reactivity (`ctx.db.query()`)
- **Mutations**: Insert, update, delete data (`ctx.db.insert()`, `ctx.db.patch()`, `ctx.db.delete()`)
- **Actions**: Call external APIs and services (Reddit API integration)
- **HTTP Actions**: Build HTTP endpoints for webhooks

### Convex Best Practices
```typescript
// Good - Properly typed Convex query
export const getPosts = query({
  args: { 
    subreddit: v.string(),
    limit: v.optional(v.number()) 
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("posts")
      .withIndex("by_subreddit", (q) => q.eq("subreddit", args.subreddit))
      .order("desc")
      .take(args.limit ?? 10);
  },
});

// Good - Properly typed Convex mutation
export const createPost = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    subreddit: v.string(),
    processing_status: v.union(v.literal("raw"), v.literal("enriched"), v.literal("scored"))
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("posts", {
      ...args,
      created_at: Date.now(),
    });
  },
});
```

### Schema Definition
```typescript
// convex/schema.ts - Define your data model
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  posts: defineTable({
    title: v.string(),
    content: v.string(),
    subreddit: v.string(),
    processing_status: v.union(
      v.literal("raw"),
      v.literal("enriched"),
      v.literal("scored"),
      v.literal("scheduled"),
      v.literal("published")
    ),
    priority_score: v.optional(v.number()),
    sentiment: v.optional(v.string()),
    categories: v.optional(v.array(v.string())),
    created_at: v.number(),
  })
    .index("by_subreddit", ["subreddit"])
    .index("by_status", ["processing_status"])
    .index("by_priority", ["priority_score"])
});
```

### React Integration
```typescript
// Good - Using Convex with React
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

export function LiveFeedComponent() {
  const posts = useQuery(api.posts.getPosts, { subreddit: "news" });
  const createPost = useMutation(api.posts.createPost);
  
  const handleNewPost = async (postData: PostData) => {
    await createPost(postData);
  };
  
  return (
    <div>
      {posts?.map(post => (
        <div key={post._id}>
          <h3>{post.title}</h3>
          <span className={getStatusColor(post.processing_status)}>
            {post.processing_status}
          </span>
        </div>
      ))}
    </div>
  );
}
```

### Error Handling with Convex
```typescript
// Good - Proper error handling in Convex functions
export const enrichPost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    try {
      const post = await ctx.db.get(args.postId);
      if (!post) {
        throw new ConvexError("Post not found");
      }
      
      // Enrichment logic here
      const enrichedData = await enrichmentAgent.analyze(post);
      
      await ctx.db.patch(args.postId, {
        ...enrichedData,
        processing_status: "enriched"
      });
      
      console.log(`✅ Enriched post: ${post.title}`);
    } catch (error) {
      console.error(`❌ Failed to enrich post ${args.postId}:`, error);
      throw error;
    }
  },
});
```

### Convex with External APIs (Actions)
```typescript
// Good - Using actions for external API calls
export const fetchRedditPosts = action({
  args: { subreddit: v.string() },
  handler: async (ctx, args) => {
    try {
      const response = await fetch(
        `https://www.reddit.com/r/${args.subreddit}/new.json`
      );
      const data = await response.json();
      
      // Process and store posts using mutations
      for (const post of data.data.children) {
        await ctx.runMutation(api.posts.createPost, {
          title: post.data.title,
          content: post.data.selftext,
          subreddit: args.subreddit,
          processing_status: "raw"
        });
      }
      
      console.log(`📥 Fetched ${data.data.children.length} posts from r/${args.subreddit}`);
    } catch (error) {
      console.error(`❌ Failed to fetch from Reddit:`, error);
      throw error;
    }
  },
});
```

### Convex Scheduling Integration
```typescript
// Good - Using Convex scheduler for pipeline processing
export const schedulePostProcessing = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    // Schedule enrichment
    await ctx.scheduler.runAfter(0, api.posts.enrichPost, { postId: args.postId });
    
    // Schedule scoring after enrichment
    await ctx.scheduler.runAfter(2000, api.posts.scorePost, { postId: args.postId });
    
    // Schedule publishing based on priority
    const post = await ctx.db.get(args.postId);
    if (post?.priority_score && post.priority_score > 0.8) {
      await ctx.scheduler.runAfter(5000, api.posts.publishPost, { postId: args.postId });
    }
  },
});
```

## Architecture & Patterns

### Tech Stack
- **Frontend**: Next.js 14+ with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Build Tool**: pnpm
- **Database**: Convex - reactive database with TypeScript queries

### Project Structure
```
smnb/
├── app/                    # Next.js app router pages
├── components/             # Reusable React components
│   └── livefeed/          # Live feed specific components
├── lib/
│   ├── services/          # Business logic services
│   │   └── livefeed/      # Live feed processing pipeline
│   ├── stores/            # Zustand state stores
│   └── types/             # TypeScript type definitions
└── convex/                # Convex backend functions
```

## Live Feed Processing Pipeline

### Core Components
The live feed system uses a multi-agent architecture:

1. **EnhancedProcessingPipeline**: Master orchestrator
2. **EnrichmentAgent**: Sentiment analysis, categorization, quality scoring
3. **ScoringAgent**: Priority scoring (engagement 40%, recency 35%, quality 25%)
4. **SchedulerService**: Smart timing and diversity management
5. **PublisherService**: Queue management and UI updates

### Data Flow
```
Raw Reddit Posts → Enrichment → Scoring → Scheduling → Publishing → UI
```

### Processing States
Posts flow through these states:
- `raw` → `enriched` → `scored` → `scheduled` → `published`

## Coding Standards & Preferences

### TypeScript
- **Use strict TypeScript**: Always provide explicit types
- **Interface over type**: Prefer `interface` for object types
- **Enums for constants**: Use string enums for status values
- **Generic constraints**: Use proper generic constraints

```typescript
// Good
interface EnhancedRedditPost {
  id: string;
  processing_status: ProcessingStatus;
  priority_score?: number;
}

// Bad
const post: any = { ... }
```

### React Components
- **Functional components**: Always use function components
- **TypeScript props**: Always type component props
- **Custom hooks**: Extract reusable logic into custom hooks
- **Error boundaries**: Implement proper error handling

```typescript
// Good
interface ComponentProps {
  className?: string;
  onAction: (data: ActionData) => void;
}

export default function Component({ className, onAction }: ComponentProps) {
  // component logic
}
```

### State Management (Zustand)
- **Typed stores**: Always provide TypeScript interfaces for stores
- **Action separation**: Separate state and actions clearly
- **Immutable updates**: Use immer pattern for complex state updates

```typescript
// Good
interface LiveFeedState {
  posts: LiveFeedPost[];
  isLive: boolean;
  addPost: (post: LiveFeedPost) => void;
  setIsLive: (live: boolean) => void;
}
```

### Service Layer
- **Single responsibility**: Each service handles one domain
- **Async/await**: Use async/await over Promise chains
- **Error handling**: Implement comprehensive error handling
- **Logging**: Use console methods with emojis for clarity

```typescript
// Good
export class EnrichmentAgent {
  async enrichPosts(posts: EnhancedRedditPost[]): Promise<EnhancedRedditPost[]> {
    try {
      console.log(`🧠 EnrichmentAgent: Processing ${posts.length} posts...`);
      // processing logic
    } catch (error) {
      console.error('❌ Enrichment failed:', error);
      throw error;
    }
  }
}
```

## File Naming Conventions
- **Components**: PascalCase (e.g., `SimpleLiveFeed.tsx`)
- **Services**: camelCase (e.g., `enrichmentAgent.ts`)
- **Types**: camelCase with descriptive names (e.g., `enhancedRedditPost.ts`)
- **Stores**: camelCase ending in `Store` (e.g., `simpleLiveFeedStore.ts`)

## Styling Guidelines
- **Tailwind CSS**: Use Tailwind utilities for styling
- **Responsive design**: Mobile-first approach
- **Dark mode**: Consider dark mode compatibility
- **Accessibility**: Include proper ARIA attributes

### UI Design Preferences
- **No Tooltips**: Never implement tooltips - avoid hover-based information displays
- **Cursor Changes**: Only use `cursor-pointer` when cursor changes are required
- **Interactive Elements**: Use clear visual feedback without hover overlays

```tsx
// Good - Clear interactive styling without tooltips
<button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded cursor-pointer">
  Action Button
</button>

// Bad - Never use tooltips or other cursor types
<button 
  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded cursor-help"
  title="This is a tooltip" // ❌ Never do this
>
  Action Button
</button>
```

```tsx
// Good
<div className="flex flex-col gap-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
    Live Feed
  </h2>
</div>
```

## Live Feed Specific Guidelines

### Processing Pipeline
- **Agent pattern**: Each processing step is an independent agent
- **Immutable data**: Never mutate original post objects
- **Pipeline orchestration**: Use the main pipeline to coordinate agents
- **Configuration driven**: Use config objects for timing and rules

### UI Components
- **Visual indicators**: Use emojis and colors for status indication
  - 🔥 High priority posts
  - 😊😐😞 Sentiment indicators
  - ⭐ Quality scores
  - 🏷️ Category labels
- **Real-time updates**: Implement smooth animations for new posts
- **Loading states**: Provide clear loading feedback

### Data Handling
- **Type safety**: Use the `EnhancedRedditPost` interface consistently
- **Status tracking**: Always update `processing_status` appropriately
- **Metadata**: Include rich metadata (sentiment, categories, scores)

## Performance Considerations
- **Batching**: Process posts in batches to avoid overwhelming the system
- **Caching**: Cache API responses when appropriate
- **Debouncing**: Use debouncing for user interactions
- **Memory management**: Clear old posts to prevent memory leaks

## Error Handling Patterns
- **User-friendly messages**: Show meaningful error messages to users
- **Graceful degradation**: System should work even if some features fail
- **Logging**: Use structured logging with emojis for visual clarity
- **Recovery**: Implement retry mechanisms for transient failures

## Testing Preferences
- **Unit tests**: Test individual components and services
- **Integration tests**: Test the processing pipeline end-to-end
- **Mock external APIs**: Use mocks for Reddit API calls
- **Type checking**: Rely on TypeScript for compile-time checks

## API Integration
- **Reddit API**: Use appropriate rate limiting and error handling
- **Response validation**: Validate API responses against expected types
- **Fallback data**: Provide fallback data when APIs are unavailable

## Comments & Documentation
- **JSDoc**: Use JSDoc for complex functions and classes
- **Inline comments**: Explain business logic and complex algorithms
- **README updates**: Keep documentation current with code changes
- **Architecture decisions**: Document major architectural choices

## Git Workflow
- **Branch naming**: Use descriptive branch names (e.g., `complexLiveFeed`)
- **Commit messages**: Use conventional commit format
- **Pull requests**: Include description of changes and testing notes

## Common Patterns to Follow

### Configuration Objects
```typescript
const QUEUE_CONFIG = {
  MIN_POST_INTERVAL_MINUTES: 5,
  MAX_POSTS_PER_HOUR: 8,
  PEAK_HOURS_UTC: [14, 15, 16, 17, 18],
  SCORING_WEIGHTS: {
    engagement: 0.4,
    recency: 0.35,
    quality: 0.25
  }
};
```

### Service Initialization
```typescript
// Services should be singletons with clear initialization
export const enrichmentAgent = new EnrichmentAgent();
export const scoringAgent = new ScoringAgent();
export const schedulerService = new SchedulerService(QUEUE_CONFIG);
```

### Event Handling
```typescript
// Use proper event handling with TypeScript
const handleNewPost = (post: EnhancedRedditPost) => {
  console.log(`📥 New post: ${post.title.substring(0, 30)}...`);
  addPost(convertToLiveFeedPost(post));
};
```

## What NOT to Do
- ❌ Don't mutate props directly
- ❌ Don't use `any` type unless absolutely necessary
- ❌ Don't skip error handling in async functions
- ❌ Don't hardcode values that should be configurable
- ❌ Don't create components without proper TypeScript interfaces
- ❌ Don't ignore accessibility requirements
- ❌ Don't commit console.log statements to production

## Helpful Context
When suggesting code improvements or new features:
1. Consider the multi-agent processing pipeline architecture
2. Maintain consistency with existing patterns
3. Ensure TypeScript type safety
4. Include proper error handling
5. Add appropriate logging with emojis
6. Consider performance implications
7. Follow the established file structure
8. Maintain the user experience focus
9. **Use Convex best practices** for database operations
10. **Leverage Convex reactivity** for real-time updates
11. **Implement proper schema validation** with Convex validators
12. **Use Convex scheduling** for pipeline processing

This project emphasizes intelligent content curation, real-time updates, and excellent user experience. All suggestions should align with these core principles.

## Agentic Coding Best Practices

### Context and Setup Optimization
- **Be Specific**: Provide clear, detailed instructions rather than vague requests. Include expected behavior, edge cases, and implementation constraints.
- **Use Visual References**: When working on UI components, provide screenshots, design mocks, or visual targets for better alignment.
- **Mention Relevant Files**: Use tab-completion syntax to reference specific files that need attention or context.
- **Provide Context Early**: Give comprehensive background before requesting implementation to avoid assumptions.

### Workflow Patterns
1. **Explore, Plan, Code, Commit**:
   - Research relevant files and understand current implementation
   - Create a detailed plan using "think" for extended reasoning
   - Implement the solution systematically
   - Commit with descriptive messages

2. **Test-Driven Development**:
   - Write comprehensive tests first based on expected behavior
   - Confirm tests fail appropriately
   - Implement code to pass tests iteratively
   - Verify implementation doesn't overfit to tests

3. **Visual Development**:
   - Use screenshots and visual mocks as targets
   - Implement, capture results, iterate until alignment
   - Focus on aesthetic appeal for user-facing components

### Context Management
- **Stay Focused**: Use context resets between major tasks to maintain performance
- **Course Correct Early**: Interrupt and redirect when implementation diverges from intent
- **Use Checklists**: For complex tasks, maintain Markdown checklists as working scratchpads
- **Provide Multiple Perspectives**: Consider having different AI instances review each other's work

### File and Data Handling
- **Read Strategically**: Prefer reading large, meaningful chunks over multiple small reads
- **Use Multiple Input Methods**: 
  - Copy/paste for immediate data
  - File paths for structured content
  - URLs for external references
  - Images for visual context

### SMNB-Specific Patterns
- **Enhanced Processing Pipeline**: Always consider the multi-agent architecture when suggesting changes
- **Real-time Updates**: Leverage Convex reactivity for immediate user feedback
- **Type Safety**: Maintain strict TypeScript patterns throughout the codebase
- **Configuration-Driven**: Use config objects for timing, scoring, and behavioral parameters
- **Visual Status Indicators**: Include emojis and color-coded status representations
- **Error Handling**: Implement comprehensive error handling with descriptive logging

### Code Quality Standards
- **Iterative Improvement**: Expect 2-3 iterations for optimal results rather than perfect first attempts
- **Independent Verification**: Use subagents to verify complex implementations
- **Documentation**: Update README files and inline documentation with changes
- **Testing**: Include unit tests for new functionality and integration tests for pipeline changes

### Git and GitHub Integration
- **Commit Messages**: Generate descriptive commit messages based on actual changes and context
- **Pull Requests**: Create comprehensive PR descriptions with implementation notes
- **Issue Management**: Use GitHub issues for complex feature planning and tracking
- **Branch Management**: Follow established naming conventions and workflow patterns

## Convex Documentation Reference

> For comprehensive Convex information, refer to [https://www.convex.dev/llms.txt](https://www.convex.dev/llms.txt)

### Key Convex Resources:
- **Understanding**: Reactive database concepts and TypeScript queries
- **Functions**: Queries, mutations, actions, and HTTP actions
- **Database**: Document storage, schemas, indexes, and data modeling
- **Real-time**: Building reactive applications with live updates
- **Authentication**: User auth integration patterns
- **File Storage**: Handling file uploads and storage
- **Scheduling**: Cron jobs and scheduled function execution
- **Client Libraries**: React, Next.js, and JavaScript client usage

## MCP Integration

### shadcn MCP Server
The project includes the shadcn MCP server for component management:

**Configuration**: Located in `.vscode/mcp.json`
```json
{
  "servers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

**Natural Language Commands**:
- "Show me all available components in the shadcn registry"
- "Add the button, dialog and card components to my project"
- "Create a contact form using components from the shadcn registry"
- "Install the data table component"

**Benefits**:
- Browse and search shadcn/ui components
- Install components using natural language
- Access multiple registries if configured
- Seamless integration with VS Code and GitHub Copilot

### Convex + SMNB Integration Points:
- **Live Feed Pipeline**: Use Convex mutations for each processing stage
- **Real-time UI Updates**: Leverage Convex reactivity for live post updates
- **Reddit Data Ingestion**: Use Convex actions for external API calls
- **Post Scheduling**: Use Convex scheduler for intelligent timing
- **User Sessions**: Implement Convex auth for user preferences
- **Performance Monitoring**: Use Convex dashboard for pipeline analytics
