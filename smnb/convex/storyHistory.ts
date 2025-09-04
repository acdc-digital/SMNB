// STORY HISTORY
// /Users/matthewsimon/Projects/SMNB/smnb/convex/storyHistory.ts

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Story History Convex Functions
 * 
 * Manage completed stories from Host and Editor agents with persistent storage.
 */

// Add a completed story to history
export const addStory = mutation({
  args: {
    story_id: v.string(),
    narrative: v.string(),
    title: v.optional(v.string()),
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
    ),
    duration: v.number(),
    word_count: v.number(),
    sentiment: v.optional(v.union(
      v.literal("positive"),
      v.literal("negative"),
      v.literal("neutral")
    )),
    topics: v.optional(v.array(v.string())),
    summary: v.optional(v.string()),
    created_at: v.number(),
    completed_at: v.number(),
    original_item: v.optional(v.object({
      title: v.string(),
      author: v.string(),
      subreddit: v.optional(v.string()),
      url: v.optional(v.string()),
    })),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if story already exists
    const existing = await ctx.db
      .query("story_history")
      .withIndex("by_created_at")
      .filter(q => q.eq(q.field("story_id"), args.story_id))
      .first();

    if (existing) {
      console.log(`📚 Story ${args.story_id} already exists in history`);
      return existing._id;
    }

    // Insert new story
    const storyId = await ctx.db.insert("story_history", args);
    console.log(`📚 Added story to history: ${args.story_id} (${args.agent_type})`);
    
    return storyId;
  },
});

// Get all stories ordered by completion time (newest first)
export const getStories = query({
  args: {
    limit: v.optional(v.number()),
    agent_type: v.optional(v.union(v.literal("host"), v.literal("editor"))),
  },
  handler: async (ctx, args) => {
    let stories;
    
    if (args.agent_type) {
      stories = await ctx.db
        .query("story_history")
        .withIndex("by_agent_type", q => q.eq("agent_type", args.agent_type!))
        .order("desc")
        .take(args.limit || 100);
    } else {
      stories = await ctx.db
        .query("story_history")
        .withIndex("by_completed_at")
        .order("desc")
        .take(args.limit || 100);
    }

    console.log(`📚 Retrieved ${stories.length} stories from history`);
    return stories;
  },
});

// Get recent stories (last 24 hours)
export const getRecentStories = query({
  args: {
    hours: v.optional(v.number()),
    agent_type: v.optional(v.union(v.literal("host"), v.literal("editor"))),
  },
  handler: async (ctx, args) => {
    const hoursBack = args.hours || 24;
    const cutoffTime = Date.now() - (hoursBack * 60 * 60 * 1000);
    
    let stories;
    
    if (args.agent_type) {
      stories = await ctx.db
        .query("story_history")
        .withIndex("by_agent_type", q => q.eq("agent_type", args.agent_type!))
        .filter(q => q.gte(q.field("completed_at"), cutoffTime))
        .order("desc")
        .collect();
    } else {
      stories = await ctx.db
        .query("story_history")
        .withIndex("by_completed_at")
        .filter(q => q.gte(q.field("completed_at"), cutoffTime))
        .order("desc")
        .collect();
    }

    console.log(`📚 Retrieved ${stories.length} stories from last ${hoursBack} hours`);
    return stories;
  },
});

// Get stories by priority
export const getStoriesByPriority = query({
  args: {
    priority: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const stories = await ctx.db
      .query("story_history")
      .withIndex("by_priority", q => q.eq("priority", args.priority))
      .order("desc")
      .take(args.limit || 50);

    console.log(`📚 Retrieved ${stories.length} ${args.priority} priority stories`);
    return stories;
  },
});

// Search stories by content
export const searchStories = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const stories = await ctx.db
      .query("story_history")
      .withSearchIndex("search_stories", q => 
        q.search("narrative", args.searchTerm)
      )
      .take(args.limit || 20);

    console.log(`📚 Search found ${stories.length} stories for: "${args.searchTerm}"`);
    return stories;
  },
});

// Clear all stories (for testing/maintenance)
export const clearAllStories = mutation({
  args: {
    confirm: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (!args.confirm) {
      throw new Error("Must confirm clearing all stories");
    }

    const stories = await ctx.db.query("story_history").collect();
    
    for (const story of stories) {
      await ctx.db.delete(story._id);
    }

    console.log(`🗑️ Cleared ${stories.length} stories from history`);
    return stories.length;
  },
});

// Get story statistics
export const getStoryStats = query({
  args: {},
  handler: async (ctx) => {
    const allStories = await ctx.db.query("story_history").collect();
    
    const stats = {
      total: allStories.length,
      byAgentType: {
        host: allStories.filter(s => s.agent_type === "host").length,
        editor: allStories.filter(s => s.agent_type === "editor").length,
      },
      byPriority: {
        high: allStories.filter(s => s.priority === "high").length,
        medium: allStories.filter(s => s.priority === "medium").length,
        low: allStories.filter(s => s.priority === "low").length,
      },
      byTone: {
        breaking: allStories.filter(s => s.tone === "breaking").length,
        developing: allStories.filter(s => s.tone === "developing").length,
        analysis: allStories.filter(s => s.tone === "analysis").length,
        opinion: allStories.filter(s => s.tone === "opinion").length,
        "human-interest": allStories.filter(s => s.tone === "human-interest").length,
      },
      totalWordCount: allStories.reduce((sum, s) => sum + s.word_count, 0),
      averageWordCount: allStories.length > 0 
        ? Math.round(allStories.reduce((sum, s) => sum + s.word_count, 0) / allStories.length)
        : 0,
    };

    console.log(`📊 Story stats: ${stats.total} total stories`);
    return stats;
  },
});
