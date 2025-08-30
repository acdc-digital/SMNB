import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  reddit_posts: defineTable({
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
    sort_type: v.string(), // 'hot', 'rising', 'top', etc.
    time_filter: v.optional(v.string()), // for top posts
    fetched_at: v.number(),
  })
    .index("by_sort_type", ["sort_type"])
    .index("by_subreddit", ["subreddit"])
    .index("by_sort_and_subreddit", ["sort_type", "subreddit"])
    .index("by_created_utc", ["created_utc"])
    .index("by_score", ["score"])
    .index("by_fetched_at", ["fetched_at"])
    // Search indexes for full-text search
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["subreddit", "sort_type", "over_18"]
    })
    .searchIndex("search_content", {
      searchField: "selftext", 
      filterFields: ["subreddit", "sort_type", "over_18"]
    }),

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
});
