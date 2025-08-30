import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Store live feed posts with additional metadata
export const storeLiveFeedPosts = mutation({
  args: {
    posts: v.array(v.object({
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
      attributesJson: v.optional(v.string()),
      source: v.string(), // e.g. "technology/hot", "all/rising"
      addedAt: v.number(),
      batchId: v.string(), // unique ID for each batch fetch
    })),
  batchId: v.string(),
  },
  handler: async (ctx, args) => {
    // Debug: log incoming payload details to help diagnose cases where requested === 0
    try {
      const inCount = Array.isArray(args.posts) ? args.posts.length : 0;
      const sampleIds = Array.isArray(args.posts)
        ? args.posts.slice(0, 5).map((p) => (p as Record<string, unknown>)['id'])
        : [];
      console.log(`🛰️ storeLiveFeedPosts handler invoked: posts=${inCount}`, sampleIds);
    } catch {
      // ignore logging errors
    }
    // Append new batch posts (do not delete previous batches). Skip posts that
    // already exist by Reddit ID to avoid duplicate entries when the same posts
    // are fetched multiple times across batches.
    // Collect recent posts and build a set of existing Reddit IDs to avoid duplicates.
    // Take returns an array of documents directly; no .collect() needed here.
    // Efficient pre-check: query for any existing posts with the candidate ids
    const candidateIds = args.posts.map(p => p.id);

    // Query for existing by id using a filter of or(eq(id, x), ...)
    const existingMatchesQuery = ctx.db.query('live_feed_posts');
    // Build a set of existing ids by scanning recent documents where id matches any candidate
    let recentMatches: Array<Record<string, unknown>> = [];
    if (candidateIds.length > 0) {
      recentMatches = await existingMatchesQuery
        .filter((q) => q.or(...candidateIds.map(id => q.eq(q.field('id'), id))))
        .take(1000);
    }

    const existingIds = new Set(recentMatches.map((p) => String(p['id'])));

    // Debug: log how many existing matches we found and sample some ids
    try {
      console.log(`🛰️ storeLiveFeedPosts: candidateIds=${candidateIds.length} recentMatches=${recentMatches.length}`,
        recentMatches.slice(0, 10).map(m => String(m['id'])));
    } catch {
      // ignore logging errors
    }

    const toInsert = args.posts.filter(p => !existingIds.has(p.id));

    const insertPromises = toInsert.map((post) => ctx.db.insert("live_feed_posts", post));
    const results = await Promise.all(insertPromises);

    // Return the exact inserted IDs so the client can deterministically know what persisted
    // ctx.db.insert returns the new document id (string) in the Convex runtime.
    // Map results to strings and filter out any non-string values.
    const insertedIds = (results as unknown[])
      .filter((r): r is string => typeof r === 'string')
      .map(r => r);

    return {
      requested: args.posts.length,
      inserted: results.length,
      skipped: args.posts.length - results.length,
      insertedIds,
      // Helpful for debugging: which candidate ids we considered already existing
      existingIds: Array.from(existingIds),
      existingMatchesCount: recentMatches.length,
    };
  },
});

// Get current live feed posts
export const getLiveFeedPosts = query({
  args: {
    limit: v.optional(v.number()),
    batchId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.batchId) {
      // Get posts from specific batch
      return await ctx.db
        .query("live_feed_posts")
        .filter((q) => q.eq(q.field("batchId"), args.batchId!))
        .order("desc")
        .take(args.limit || 50);
    } else {
      // Get most recent posts ordered by addedAt descending
      return await ctx.db
        .query("live_feed_posts")
        .withIndex("by_addedAt")
        .order("desc")
        .take(args.limit || 50);
    }
  },
});

// Store Reddit posts in Convex
export const storeRedditPosts = mutation({
  args: {
    posts: v.array(v.object({
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
    })),
  },
  handler: async (ctx, args) => {
    const insertPromises = args.posts.map(post => 
      ctx.db.insert("reddit_posts", post)
    );
    
    return await Promise.all(insertPromises);
  },
});

// Get stored Reddit posts by sort type
export const getRedditPostsBySort = query({
  args: {
    sort_type: v.string(),
    subreddit: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("reddit_posts")
      .filter((q) => q.eq(q.field("sort_type"), args.sort_type));

    if (args.subreddit) {
      query = query.filter((q) => q.eq(q.field("subreddit"), args.subreddit));
    }

    return await query
      .order("desc")
      .take(args.limit || 25);
  },
});

// Get hot posts
export const getHotPosts = query({
  args: {
    subreddit: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("reddit_posts")
      .filter((q) => q.eq(q.field("sort_type"), "hot"));

    if (args.subreddit) {
      query = query.filter((q) => q.eq(q.field("subreddit"), args.subreddit));
    }

    return await query
      .order("desc")
      .take(args.limit || 25);
  },
});

// Get rising posts
export const getRisingPosts = query({
  args: {
    subreddit: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("reddit_posts")
      .filter((q) => q.eq(q.field("sort_type"), "rising"));

    if (args.subreddit) {
      query = query.filter((q) => q.eq(q.field("subreddit"), args.subreddit));
    }

    return await query
      .order("desc")
      .take(args.limit || 25);
  },
});

// Get trending posts (top posts from recent time periods)
export const getTrendingPosts = query({
  args: {
    time_filter: v.optional(v.string()),
    subreddit: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("reddit_posts")
      .filter((q) => q.eq(q.field("sort_type"), "top"));

    if (args.time_filter) {
      query = query.filter((q) => q.eq(q.field("time_filter"), args.time_filter));
    }

    if (args.subreddit) {
      query = query.filter((q) => q.eq(q.field("subreddit"), args.subreddit));
    }

    return await query
      .order("desc")
      .take(args.limit || 25);
  },
});

// Search stored Reddit posts by title
export const searchRedditPostsByTitle = query({
  args: {
    searchTerm: v.string(),
    subreddit: v.optional(v.string()),
    sort_type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const searchQuery = ctx.db
      .query("reddit_posts")
      .withSearchIndex("search_title", (q) => {
        let search = q.search("title", args.searchTerm);
        
        if (args.subreddit) {
          search = search.eq("subreddit", args.subreddit);
        }
        if (args.sort_type) {
          search = search.eq("sort_type", args.sort_type);
        }
        
        return search;
      });

    return await searchQuery.take(50);
  },
});

// Search stored Reddit posts by content
export const searchRedditPostsByContent = query({
  args: {
    searchTerm: v.string(),
    subreddit: v.optional(v.string()),
    sort_type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const searchQuery = ctx.db
      .query("reddit_posts")
      .withSearchIndex("search_content", (q) => {
        let search = q.search("selftext", args.searchTerm);
        
        if (args.subreddit) {
          search = search.eq("subreddit", args.subreddit);
        }
        if (args.sort_type) {
          search = search.eq("sort_type", args.sort_type);
        }
        
        return search;
      });

    return await searchQuery.take(50);
  },
});

// Simple text-based search (fallback without search index)
export const searchRedditPosts = query({
  args: {
    searchTerm: v.string(),
    subreddit: v.optional(v.string()),
    sort_type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("reddit_posts");

    if (args.subreddit) {
      query = query.filter((q) => q.eq(q.field("subreddit"), args.subreddit));
    }

    if (args.sort_type) {
      query = query.filter((q) => q.eq(q.field("sort_type"), args.sort_type));
    }

    // Simple text matching (case insensitive)
    const searchLower = args.searchTerm.toLowerCase();
    
    const posts = await query.collect();
    
    return posts
      .filter(post => 
        post.title.toLowerCase().includes(searchLower) ||
        post.selftext.toLowerCase().includes(searchLower)
      )
      .slice(0, 50);
  },
});

// Get posts from specific subreddits
export const getPostsBySubreddits = query({
  args: {
    subreddits: v.array(v.string()),
    sort_type: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("reddit_posts")
      .filter((q) => 
        q.or(
          ...args.subreddits.map(sub => q.eq(q.field("subreddit"), sub))
        )
      );

    if (args.sort_type) {
      query = query.filter((q) => q.eq(q.field("sort_type"), args.sort_type));
    }

    return await query
      .order("desc")
      .take(args.limit || 50);
  },
});

// Clean up old posts (optional - run periodically)
export const cleanupOldPosts = mutation({
  args: {
    olderThanHours: v.number(),
  },
  handler: async (ctx, args) => {
    const cutoffTime = Date.now() - (args.olderThanHours * 60 * 60 * 1000);
    
    const oldPosts = await ctx.db
      .query("reddit_posts")
      .filter((q) => q.lt(q.field("fetched_at"), cutoffTime))
      .collect();

    const deletePromises = oldPosts.map(post => ctx.db.delete(post._id));
    await Promise.all(deletePromises);

    return { deleted: oldPosts.length };
  },
});
