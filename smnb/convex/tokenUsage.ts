// TOKEN USAGE FUNCTIONS
// /Users/matthewsimon/Projects/SMNB/smnb/convex/tokenUsage.ts

/**
 * Convex functions for storing and retrieving token usage analytics data.
 * Provides persistence for the token counting service.
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Store token usage data
export const recordTokenUsage = mutation({
  args: {
    request_id: v.string(),
    timestamp: v.number(),
    model: v.string(),
    action: v.union(v.literal("generate"), v.literal("stream"), v.literal("analyze"), v.literal("test")),
    input_tokens: v.number(),
    output_tokens: v.number(),
    total_tokens: v.number(),
    estimated_cost: v.number(),
    request_type: v.union(v.literal("host"), v.literal("producer"), v.literal("editor")),
    duration: v.optional(v.number()),
    success: v.boolean(),
    error_message: v.optional(v.string()),
    session_id: v.optional(v.string()),
    source_post_id: v.optional(v.string()),
    metadata: v.optional(v.string()),
    // Enhanced tool tracking fields
    tools_used: v.optional(v.string()), // Comma-separated tool names
    tool_definitions_tokens: v.optional(v.number()),
    tool_results_tokens: v.optional(v.number()),
    has_tools: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("token_usage", args);
    return id;
  },
});

// Get token usage statistics for a time range
export const getTokenUsageStats = query({
  args: {
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { startTime, endTime, limit = 1000 } = args;
    
    let query = ctx.db.query("token_usage");
    
    if (startTime) {
      query = query.filter((q) => q.gte(q.field("timestamp"), startTime));
    }
    
    if (endTime) {
      query = query.filter((q) => q.lte(q.field("timestamp"), endTime));
    }
    
    const results = await query
      .order("desc")
      .take(limit);
    
    return results;
  },
});

// Get aggregated statistics
export const getAggregatedStats = query({
  args: {
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { startTime, endTime } = args;
    
    let query = ctx.db.query("token_usage");
    
    if (startTime) {
      query = query.filter((q) => q.gte(q.field("timestamp"), startTime));
    }
    
    if (endTime) {
      query = query.filter((q) => q.lte(q.field("timestamp"), endTime));
    }
    
    const results = await query.collect();
    
    // Calculate aggregated statistics
    const stats = {
      total_requests: results.length,
      successful_requests: results.filter(r => r.success).length,
      total_input_tokens: results.reduce((sum, r) => sum + r.input_tokens, 0),
      total_output_tokens: results.reduce((sum, r) => sum + r.output_tokens, 0),
      total_tokens: results.reduce((sum, r) => sum + r.total_tokens, 0),
      total_cost: results.reduce((sum, r) => sum + r.estimated_cost, 0),
      average_tokens_per_request: 0,
      average_cost_per_request: 0,
      requests_by_type: {} as Record<string, number>,
      requests_by_model: {} as Record<string, number>,
      requests_by_action: {} as Record<string, number>,
      tokens_by_type: {} as Record<string, number>,
      cost_by_type: {} as Record<string, number>,
      hourly_usage: [] as Array<{ hour: string; requests: number; tokens: number; cost: number }>,
      // Enhanced tool analytics
      total_tool_requests: results.filter(r => r.has_tools).length,
      total_tool_definitions_tokens: results.reduce((sum, r) => sum + (r.tool_definitions_tokens || 0), 0),
      total_tool_results_tokens: results.reduce((sum, r) => sum + (r.tool_results_tokens || 0), 0),
      tool_usage_by_type: {} as Record<string, number>,
    };
    
    if (stats.total_requests > 0) {
      stats.average_tokens_per_request = stats.total_tokens / stats.total_requests;
      stats.average_cost_per_request = stats.total_cost / stats.total_requests;
    }
    
    // Group by request type
    results.forEach(record => {
      stats.requests_by_type[record.request_type] = (stats.requests_by_type[record.request_type] || 0) + 1;
      stats.tokens_by_type[record.request_type] = (stats.tokens_by_type[record.request_type] || 0) + record.total_tokens;
      stats.cost_by_type[record.request_type] = (stats.cost_by_type[record.request_type] || 0) + record.estimated_cost;
    });
    
    // Group by model
    results.forEach(record => {
      stats.requests_by_model[record.model] = (stats.requests_by_model[record.model] || 0) + 1;
    });
    
    // Group by action
    results.forEach(record => {
      stats.requests_by_action[record.action] = (stats.requests_by_action[record.action] || 0) + 1;
    });
    
    // Group by tool usage
    results.forEach(record => {
      if (record.tools_used) {
        const tools = record.tools_used.split(',').filter(tool => tool.trim());
        tools.forEach(tool => {
          stats.tool_usage_by_type[tool.trim()] = (stats.tool_usage_by_type[tool.trim()] || 0) + 1;
        });
      }
    });
    
    // Generate hourly usage (last 24 hours)
    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
    const hourlyData: Record<string, { requests: number; tokens: number; cost: number }> = {};
    
    // Initialize all hours
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now - i * 60 * 60 * 1000);
      const hourKey = hour.getHours().toString().padStart(2, '0') + ':00';
      hourlyData[hourKey] = { requests: 0, tokens: 0, cost: 0 };
    }
    
    // Aggregate data by hour
    results
      .filter(record => record.timestamp >= twentyFourHoursAgo)
      .forEach(record => {
        const recordDate = new Date(record.timestamp);
        const hourKey = recordDate.getHours().toString().padStart(2, '0') + ':00';
        if (hourlyData[hourKey]) {
          hourlyData[hourKey].requests += 1;
          hourlyData[hourKey].tokens += record.total_tokens;
          hourlyData[hourKey].cost += record.estimated_cost;
        }
      });
    
    stats.hourly_usage = Object.entries(hourlyData).map(([hour, data]) => ({
      hour,
      requests: data.requests,
      tokens: data.tokens,
      cost: data.cost
    }));
    
    return stats;
  },
});

// Get token usage by request type
export const getUsageByType = query({
  args: {
    request_type: v.union(v.literal("host"), v.literal("producer"), v.literal("editor")),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { request_type, startTime, endTime, limit = 100 } = args;
    
    let query = ctx.db.query("token_usage")
      .filter((q) => q.eq(q.field("request_type"), request_type));
    
    if (startTime) {
      query = query.filter((q) => q.gte(q.field("timestamp"), startTime));
    }
    
    if (endTime) {
      query = query.filter((q) => q.lte(q.field("timestamp"), endTime));
    }
    
    const results = await query
      .order("desc")
      .take(limit);
    
    return results;
  },
});

// Get recent token usage (for real-time dashboard)
export const getRecentUsage = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { limit = 50 } = args;
    
    const results = await ctx.db.query("token_usage")
      .order("desc")
      .take(limit);
    
    return results;
  },
});

// Get daily usage summary
export const getDailyUsage = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { days = 7 } = args;
    const now = Date.now();
    const startTime = now - (days * 24 * 60 * 60 * 1000);
    
    const results = await ctx.db.query("token_usage")
      .filter((q) => q.gte(q.field("timestamp"), startTime))
      .collect();
    
    // Group by day
    const dailyData: Record<string, { requests: number; tokens: number; cost: number }> = {};
    
    results.forEach(record => {
      const date = new Date(record.timestamp);
      const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!dailyData[dayKey]) {
        dailyData[dayKey] = { requests: 0, tokens: 0, cost: 0 };
      }
      
      dailyData[dayKey].requests += 1;
      dailyData[dayKey].tokens += record.total_tokens;
      dailyData[dayKey].cost += record.estimated_cost;
    });
    
    return Object.entries(dailyData)
      .map(([day, data]) => ({
        day,
        requests: data.requests,
        tokens: data.tokens,
        cost: data.cost
      }))
      .sort((a, b) => a.day.localeCompare(b.day));
  },
});

// Delete old token usage records (cleanup function)
export const cleanupOldRecords = mutation({
  args: {
    daysToKeep: v.number(),
  },
  handler: async (ctx, args) => {
    const { daysToKeep } = args;
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    const oldRecords = await ctx.db.query("token_usage")
      .filter((q) => q.lt(q.field("timestamp"), cutoffTime))
      .collect();
    
    for (const record of oldRecords) {
      await ctx.db.delete(record._id);
    }
    
    return { deleted: oldRecords.length };
  },
});