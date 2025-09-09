// FEED MAINTENANCE STATS
// /convex/feedStats.ts

/**
 * Query functions for monitoring feed maintenance and chronological story updates
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Get current live feed statistics
 */
export const getLiveFeedStats = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query("live_feed_posts").collect();
    
    // Get posts with enrichment data
    const enrichedPosts = posts.filter(post => {
      const attributes = JSON.parse(post.attributesJson || '{}');
      return attributes.enrichment_level && attributes.enrichment_level > 0;
    });

    // Calculate age distribution
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);
    const dayAgo = now - (24 * 60 * 60 * 1000);
    
    const recentPosts = posts.filter(p => p.addedAt > hourAgo);
    const todayPosts = posts.filter(p => p.addedAt > dayAgo);

    // Get story archive count
    const archivedStories = await ctx.db.query("story_history").collect();
    const recentlyArchived = archivedStories.filter(s => s.completed_at > dayAgo);

    return {
      totalLivePosts: posts.length,
      enrichedPosts: enrichedPosts.length,
      unenrichedPosts: posts.length - enrichedPosts.length,
      recentPosts: recentPosts.length, // Last hour
      todayPosts: todayPosts.length, // Last 24 hours
      totalArchivedStories: archivedStories.length,
      recentlyArchivedStories: recentlyArchived.length,
      oldestPostAge: posts.length > 0 ? now - Math.min(...posts.map(p => p.addedAt)) : 0,
      newestPostAge: posts.length > 0 ? now - Math.max(...posts.map(p => p.addedAt)) : 0,
      maintenanceStatus: {
        needsMaintenance: posts.length > 50,
        needsEnrichment: posts.length - enrichedPosts.length > 0,
        recommendsArchival: enrichedPosts.filter(p => {
          const attributes = JSON.parse(p.attributesJson || '{}');
          return attributes.enrichment_level > 2 && (now - p.addedAt) > (24 * 60 * 60 * 1000);
        }).length > 0,
      }
    };
  },
});

/**
 * Get detailed post information with enrichment status
 */
export const getPostsWithEnrichmentStatus = query({
  args: {
    limit: v.optional(v.number()),
    orderBy: v.optional(v.union(v.literal("newest"), v.literal("oldest"), v.literal("score"))),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const orderBy = args.orderBy || "newest";
    
    let posts;
    
    // Apply ordering
    if (orderBy === "newest") {
      posts = await ctx.db
        .query("live_feed_posts")
        .withIndex("by_addedAt")
        .order("desc")
        .take(limit);
    } else if (orderBy === "oldest") {
      posts = await ctx.db
        .query("live_feed_posts")
        .withIndex("by_addedAt")
        .order("asc")
        .take(limit);
    } else if (orderBy === "score") {
      posts = await ctx.db
        .query("live_feed_posts")
        .withIndex("by_score")
        .order("desc")
        .take(limit);
    } else {
      posts = await ctx.db
        .query("live_feed_posts")
        .take(limit);
    }
    
    return posts.map(post => {
      const attributes = JSON.parse(post.attributesJson || '{}');
      return {
        id: post.id,
        title: post.title,
        subreddit: post.subreddit,
        score: post.score,
        num_comments: post.num_comments,
        addedAt: post.addedAt,
        ageInHours: (Date.now() - post.addedAt) / (60 * 60 * 1000),
        enrichmentLevel: attributes.enrichment_level || 0,
        lastEnrichedAt: attributes.last_enriched_at,
        sentiment: attributes.sentiment,
        topics: attributes.topics || [],
        engagementScore: attributes.engagement_score || 0,
        processingStatus: attributes.processing_status || 'raw',
      };
    });
  },
});

/**
 * Get recent story archive activity
 */
export const getRecentArchiveActivity = query({
  args: {
    hours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const hoursBack = args.hours || 24;
    const cutoffTime = Date.now() - (hoursBack * 60 * 60 * 1000);
    
    const recentStories = await ctx.db
      .query("story_history")
      .withIndex("by_completed_at")
      .filter(q => q.gte(q.field("completed_at"), cutoffTime))
      .order("desc")
      .collect();

    return recentStories.map(story => ({
      story_id: story.story_id,
      title: story.title,
      agent_type: story.agent_type,
      tone: story.tone,
      priority: story.priority,
      word_count: story.word_count,
      completed_at: story.completed_at,
      topics: story.topics,
      sentiment: story.sentiment,
      original_subreddit: story.original_item?.subreddit,
    }));
  },
});

/**
 * Trigger manual feed maintenance (for testing)
 */
export const triggerManualMaintenance = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("🔧 Triggering manual feed maintenance");
    
    // For now, return info about what would be scheduled
    // In a real deployment, this would schedule the maintenance job
    const posts = await ctx.db.query("live_feed_posts").collect();
    
    return { 
      scheduled: true, 
      timestamp: Date.now(),
      currentPostCount: posts.length,
      needsMaintenance: posts.length > 50,
      message: posts.length > 50 ? "Maintenance needed - too many posts" : "Feed is healthy"
    };
  },
});

/**
 * Get maintenance schedule status
 */
export const getMaintenanceScheduleStatus = query({
  args: {},
  handler: async (ctx) => {
    // This would typically show scheduled job status
    // For now, return basic configuration info
    return {
      feedMaintenanceInterval: "15 minutes",
      enrichmentInterval: "5 minutes", 
      archivalInterval: "30 minutes",
      maxLivePosts: 50,
      lastMaintenanceCheck: Date.now(), // This would be tracked in practice
      nextScheduledMaintenance: Date.now() + (15 * 60 * 1000), // Next 15 minutes
      status: "active",
    };
  },
});