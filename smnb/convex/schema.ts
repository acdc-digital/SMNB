import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  live_feed_posts: defineTable({
    id: v.string(),
    title: v.string(),
    author: v.string(),
    subreddit: v.string(),
    url: v.string(),
    permalink: v.string(),
    score: v.number(),
    num_comments: v.number(),
    created_utc: v.number(),
    thumbnail: v.string(),
    selftext: v.string(),
    is_video: v.boolean(),
    domain: v.string(),
    upvote_ratio: v.number(),
    over_18: v.boolean(),
    source: v.string(), // e.g. "technology/hot", "all/rising"
    addedAt: v.number(),
  batchId: v.string(), // unique ID for each batch fetch
  // Free-form JSON blob holding many computed attributes/features used by the ranking model
  attributesJson: v.optional(v.string()),
  })
    .index("by_batchId", ["batchId"])
    .index("by_source", ["source"])
    .index("by_addedAt", ["addedAt"])
    .index("by_created_utc", ["created_utc"])
    .index("by_score", ["score"])
    // Search indexes for live feed posts
    .searchIndex("live_search_title", {
      searchField: "title",
      filterFields: ["subreddit", "source", "over_18", "batchId"]
    }),

  editor_documents: defineTable({
    document_id: v.string(), // Unique identifier for the document
    title: v.string(),
    content_json: v.string(), // ProseMirror JSON document
    content_text: v.string(), // Plain text version for search
    version: v.number(), // Document version number
    word_count: v.number(),
    character_count: v.number(),
    status: v.union(v.literal("draft"), v.literal("active"), v.literal("archived")),
    created_at: v.number(),
    updated_at: v.number(),
    // Metadata about the generation process
    generated_by_agent: v.boolean(),
    source_posts: v.optional(v.array(v.string())), // IDs of posts that influenced this content
    generation_metadata: v.optional(v.string()), // JSON blob with generation details
  })
    .index("by_document_id", ["document_id"])
    .index("by_status", ["status"])
    .index("by_created_at", ["created_at"])
    .index("by_updated_at", ["updated_at"])
    .index("by_version", ["version"])
    // Search index for editor documents
    .searchIndex("search_editor_content", {
      searchField: "content_text",
      filterFields: ["status", "generated_by_agent"]
    }),

  host_sessions: defineTable({
    session_id: v.string(), // Unique identifier for the session
    title: v.string(), // Session name/title
    status: v.union(v.literal("active"), v.literal("ended"), v.literal("archived")),
    created_at: v.number(),
    ended_at: v.optional(v.number()),
    
    // Host configuration for this session
    personality: v.string(), // Host personality type
    verbosity: v.string(), // Verbosity level
    context_window: v.number(), // Number of items to consider
    update_frequency: v.number(), // Processing frequency in ms
    
    // Session statistics
    total_narrations: v.number(),
    total_words: v.number(),
    total_duration: v.number(), // Total session duration in seconds
    items_processed: v.number(),
    
    // Session metadata
    session_metadata: v.optional(v.string()), // JSON blob for additional session data
  })
    .index("by_session_id", ["session_id"])
    .index("by_status", ["status"])
    .index("by_created_at", ["created_at"])
    .index("by_ended_at", ["ended_at"]),

  host_documents: defineTable({
    session_id: v.optional(v.string()), // Make optional for migration from old schema
    content_text: v.string(), // Current accumulated content for this session
    content_json: v.optional(v.string()), // Optional JSON metadata for future use
    word_count: v.number(),
    character_count: v.number(),
    created_at: v.number(),
    updated_at: v.number(),
    
    // Current narration metadata (for live updates)
    current_narration_id: v.optional(v.string()), // ID of currently streaming narration
    last_narration_type: v.optional(v.union(
      v.literal("breaking"),
      v.literal("developing"),
      v.literal("analysis"),
      v.literal("summary"),
      v.literal("commentary")
    )),
    last_tone: v.optional(v.union(
      v.literal("urgent"),
      v.literal("informative"),
      v.literal("conversational"),
      v.literal("dramatic")
    )),
    last_priority: v.optional(v.union(
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    )),
    
    // Track source posts for this session
    source_posts: v.optional(v.array(v.string())), // IDs of posts that influenced narrations in this session
    generation_metadata: v.optional(v.string()), // JSON blob with latest generation details
    
    // Legacy fields (for backward compatibility during migration)
    document_id: v.optional(v.string()),
    title: v.optional(v.string()),
    version: v.optional(v.number()),
    status: v.optional(v.union(v.literal("draft"), v.literal("active"), v.literal("archived"))),
    generated_by_agent: v.optional(v.boolean()),
    narration_type: v.optional(v.union(
      v.literal("breaking"),
      v.literal("developing"),
      v.literal("analysis"),
      v.literal("summary"),
      v.literal("commentary")
    )),
    tone: v.optional(v.union(
      v.literal("urgent"),
      v.literal("informative"),
      v.literal("conversational"),
      v.literal("dramatic")
    )),
    priority: v.optional(v.union(
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    )),
  })
    .index("by_session_id", ["session_id"])
    .index("by_created_at", ["created_at"])
    .index("by_updated_at", ["updated_at"])
    .index("by_current_narration_id", ["current_narration_id"])
    // Legacy indexes (for migration period)
    .index("by_document_id", ["document_id"])
    .index("by_status", ["status"])
    // Search index for host documents
    .searchIndex("search_host_content", {
      searchField: "content_text",
      filterFields: ["session_id", "last_narration_type", "last_tone", "last_priority"]
    }),

  story_history: defineTable({
    story_id: v.string(), // Unique identifier for the story
    narrative: v.string(), // The completed story content
    title: v.optional(v.string()), // Optional story title
    tone: v.union(
      v.literal("breaking"),
      v.literal("developing"),
      v.literal("analysis"),
      v.literal("opinion"),
      v.literal("human-interest")
    ),
    priority: v.union(
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    agent_type: v.union(
      v.literal("host"),
      v.literal("editor")
    ), // Which agent created this story
    duration: v.number(), // Estimated reading time in seconds
    word_count: v.number(), // Word count of the narrative
    sentiment: v.optional(v.union(
      v.literal("positive"),
      v.literal("negative"), 
      v.literal("neutral")
    )),
    topics: v.optional(v.array(v.string())), // Topic tags
    summary: v.optional(v.string()), // Brief summary
    created_at: v.number(), // Timestamp when story was created
    completed_at: v.number(), // Timestamp when story was completed
    // Original source information
    original_item: v.optional(v.object({
      title: v.string(),
      author: v.string(),
      subreddit: v.optional(v.string()),
      url: v.optional(v.string()),
    })),
    // Metadata for future use
    metadata: v.optional(v.string()), // JSON blob for additional data
  })
    .index("by_agent_type", ["agent_type"])
    .index("by_priority", ["priority"])
    .index("by_tone", ["tone"])
    .index("by_created_at", ["created_at"])
    .index("by_completed_at", ["completed_at"])
    .index("by_sentiment", ["sentiment"])
    // Search index for stories
    .searchIndex("search_stories", {
      searchField: "narrative",
      filterFields: ["agent_type", "priority", "tone", "sentiment"]
    }),
});
