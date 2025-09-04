// REDDIT POSTS (LEGACY)
// /Users/matthewsimon/Projects/SMNB/smnb/convex/redditPosts.ts

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

// Editor document functions
export const createEditorDocument = mutation({
  args: {
    document_id: v.string(),
    title: v.optional(v.string()),
    content_text: v.optional(v.string()),
    content_json: v.optional(v.string()),
    generated_by_agent: v.optional(v.boolean()),
    source_posts: v.optional(v.array(v.string())),
    generation_metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const contentText = args.content_text || "";
    const contentJson = args.content_json || "{}";
    
    const id = await ctx.db.insert("editor_documents", {
      document_id: args.document_id,
      title: args.title || "Untitled Document",
      content_text: contentText,
      content_json: contentJson,
      version: 1,
      word_count: contentText.split(/\s+/).filter(word => word.length > 0).length,
      character_count: contentText.length,
      status: "draft" as const,
      created_at: Date.now(),
      updated_at: Date.now(),
      generated_by_agent: args.generated_by_agent || false,
      source_posts: args.source_posts,
      generation_metadata: args.generation_metadata,
    });

    console.log(`📄 Created editor document: ${args.document_id}`);
    return id;
  },
});

export const updateEditorDocument = mutation({
  args: {
    document_id: v.string(),
    title: v.optional(v.string()),
    content_text: v.optional(v.string()),
    content_json: v.optional(v.string()),
    generated_by_agent: v.optional(v.boolean()),
    source_posts: v.optional(v.array(v.string())),
    generation_metadata: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<string> => {
    const existing = await ctx.db
      .query("editor_documents")
      .withIndex("by_document_id", (q) => q.eq("document_id", args.document_id))
      .first();

    if (!existing) {
      // Create new document if it doesn't exist - call the handler directly
      const contentText = args.content_text || "";
      const contentJson = args.content_json || "{}";
      
      const id = await ctx.db.insert("editor_documents", {
        document_id: args.document_id,
        title: args.title || "Untitled Document",
        content_text: contentText,
        content_json: contentJson,
        version: 1,
        word_count: contentText.split(/\s+/).filter(word => word.length > 0).length,
        character_count: contentText.length,
        status: "draft" as const,
        created_at: Date.now(),
        updated_at: Date.now(),
        generated_by_agent: args.generated_by_agent || false,
        source_posts: args.source_posts,
        generation_metadata: args.generation_metadata,
      });

      console.log(`📄 Created editor document: ${args.document_id}`);
      return id;
    }

    const updates: Record<string, unknown> = {
      version: existing.version + 1,
      updated_at: Date.now(),
    };

    if (args.title) updates.title = args.title;
    if (args.content_text) {
      updates.content_text = args.content_text;
      updates.word_count = args.content_text.split(/\s+/).filter(word => word.length > 0).length;
      updates.character_count = args.content_text.length;
    }
    if (args.content_json) updates.content_json = args.content_json;
    if (args.generated_by_agent !== undefined) updates.generated_by_agent = args.generated_by_agent;
    if (args.source_posts) updates.source_posts = args.source_posts;
    if (args.generation_metadata) updates.generation_metadata = args.generation_metadata;

    await ctx.db.patch(existing._id, updates);

    console.log(`📝 Updated editor document: ${args.document_id} (v${existing.version + 1})`);
    return existing._id;
  },
});

export const getEditorDocument = query({
  args: {
    document_id: v.string(),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db
      .query("editor_documents")
      .withIndex("by_document_id", (q) => q.eq("document_id", args.document_id))
      .first();

    return document;
  },
});

export const listEditorDocuments = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const documents = await ctx.db
      .query("editor_documents")
      .order("desc")
      .take(args.limit || 10);

    return documents;
  },
});

// Host Sessions Functions
export const createHostSession = mutation({
  args: {
    session_id: v.string(),
    title: v.optional(v.string()),
    personality: v.string(),
    verbosity: v.string(),
    context_window: v.number(),
    update_frequency: v.number(),
    session_metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if session already exists
    const existing = await ctx.db
      .query("host_sessions")
      .withIndex("by_session_id", (q) => q.eq("session_id", args.session_id))
      .first();

    if (existing) {
      throw new Error(`Host session ${args.session_id} already exists`);
    }

    // Create new session
    const sessionId = await ctx.db.insert("host_sessions", {
      session_id: args.session_id,
      title: args.title || `Host Session - ${new Date().toLocaleString()}`,
      status: "active" as const,
      created_at: Date.now(),
      personality: args.personality,
      verbosity: args.verbosity,
      context_window: args.context_window,
      update_frequency: args.update_frequency,
      total_narrations: 0,
      total_words: 0,
      total_duration: 0,
      items_processed: 0,
      session_metadata: args.session_metadata,
    });

    // Create corresponding host document for this session
    await ctx.db.insert("host_documents", {
      session_id: args.session_id,
      content_text: "",
      word_count: 0,
      character_count: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
      source_posts: [],
    });

    console.log(`🎙️ Created host session: ${args.session_id}`);
    return sessionId;
  },
});

export const endHostSession = mutation({
  args: {
    session_id: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("host_sessions")
      .withIndex("by_session_id", (q) => q.eq("session_id", args.session_id))
      .first();

    if (!session) {
      throw new Error(`Host session ${args.session_id} not found`);
    }

    if (session.status === "ended") {
      console.log(`⚠️ Host session ${args.session_id} already ended`);
      return session._id;
    }

    // Calculate total session duration
    const duration = Math.floor((Date.now() - session.created_at) / 1000);

    await ctx.db.patch(session._id, {
      status: "ended" as const,
      ended_at: Date.now(),
      total_duration: duration,
    });

    console.log(`🎙️ Ended host session: ${args.session_id} (duration: ${duration}s)`);
    return session._id;
  },
});

export const updateHostSessionContent = mutation({
  args: {
    session_id: v.string(),
    content_text: v.string(),
    current_narration_id: v.optional(v.string()),
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
    source_posts: v.optional(v.array(v.string())),
    generation_metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get the host document for this session
    const hostDoc = await ctx.db
      .query("host_documents")
      .withIndex("by_session_id", (q) => q.eq("session_id", args.session_id))
      .first();

    if (!hostDoc) {
      throw new Error(`Host document not found for session ${args.session_id}`);
    }

    // Calculate word and character counts
    const wordCount = args.content_text.split(/\s+/).filter(word => word.length > 0).length;
    const characterCount = args.content_text.length;

    // Update the host document
    const updates: Record<string, unknown> = {
      content_text: args.content_text,
      word_count: wordCount,
      character_count: characterCount,
      updated_at: Date.now(),
    };

    if (args.current_narration_id) updates.current_narration_id = args.current_narration_id;
    if (args.narration_type) updates.last_narration_type = args.narration_type;
    if (args.tone) updates.last_tone = args.tone;
    if (args.priority) updates.last_priority = args.priority;
    if (args.source_posts) updates.source_posts = args.source_posts;
    if (args.generation_metadata) updates.generation_metadata = args.generation_metadata;

    await ctx.db.patch(hostDoc._id, updates);

    console.log(`📝 Updated host session content: ${args.session_id} (${wordCount} words)`);
    return hostDoc._id;
  },
});

export const incrementHostSessionStats = mutation({
  args: {
    session_id: v.string(),
    narrations_increment: v.optional(v.number()),
    words_increment: v.optional(v.number()),
    items_increment: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("host_sessions")
      .withIndex("by_session_id", (q) => q.eq("session_id", args.session_id))
      .first();

    if (!session) {
      throw new Error(`Host session ${args.session_id} not found`);
    }

    const updates: Record<string, unknown> = {};

    if (args.narrations_increment) {
      updates.total_narrations = session.total_narrations + args.narrations_increment;
    }
    if (args.words_increment) {
      updates.total_words = session.total_words + args.words_increment;
    }
    if (args.items_increment) {
      updates.items_processed = session.items_processed + args.items_increment;
    }

    await ctx.db.patch(session._id, updates);

    return session._id;
  },
});

export const getHostSession = query({
  args: {
    session_id: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("host_sessions")
      .withIndex("by_session_id", (q) => q.eq("session_id", args.session_id))
      .first();

    return session;
  },
});

export const getHostSessionWithContent = query({
  args: {
    session_id: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("host_sessions")
      .withIndex("by_session_id", (q) => q.eq("session_id", args.session_id))
      .first();

    if (!session) {
      return null;
    }

    const hostDoc = await ctx.db
      .query("host_documents")
      .withIndex("by_session_id", (q) => q.eq("session_id", args.session_id))
      .first();

    return {
      session,
      content: hostDoc,
    };
  },
});

export const listHostSessions = query({
  args: {
    status: v.optional(v.union(v.literal("active"), v.literal("ended"), v.literal("archived"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("host_sessions")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(args.limit || 10);
    } else {
      return await ctx.db
        .query("host_sessions")
        .order("desc")
        .take(args.limit || 10);
    }
  },
});

export const getActiveHostSession = query({
  args: {},
  handler: async (ctx) => {
    const activeSessions = await ctx.db
      .query("host_sessions")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .take(1);

    return activeSessions[0] || null;
  },
});

// Host Documents Functions (Legacy - deprecated in favor of session-based approach)
// These functions are kept for backward compatibility only

// Migration function to convert legacy host documents to session-based structure
export const migrateHostDocumentsToSessions = mutation({
  args: {},
  handler: async (ctx) => {
    console.log('🔄 Starting migration of host documents to session-based structure...');
    
    // Get all host documents that don't have a session_id
    const legacyDocs = await ctx.db
      .query("host_documents")
      .filter((q) => q.eq(q.field("session_id"), undefined))
      .collect();
    
    console.log(`📄 Found ${legacyDocs.length} legacy host documents to migrate`);
    
    let migratedCount = 0;
    let sessionCount = 0;
    
    for (const doc of legacyDocs) {
      try {
        // Create a session for this document if it has meaningful content
        if (doc.content_text && doc.content_text.trim().length > 0) {
          const sessionId = `legacy-session-${doc.document_id || Date.now()}`;
          
          // Create the session
          await ctx.db.insert("host_sessions", {
            session_id: sessionId,
            title: doc.title || `Legacy Session - ${new Date(doc.created_at).toLocaleString()}`,
            status: "ended" as const, // Mark legacy sessions as ended
            created_at: doc.created_at,
            ended_at: doc.updated_at,
            personality: "professional", // Default personality
            verbosity: "medium", // Default verbosity
            context_window: 5, // Default context window
            update_frequency: 2000, // Default update frequency
            total_narrations: 1, // Assume 1 narration per legacy document
            total_words: doc.word_count || 0,
            total_duration: Math.floor((doc.updated_at - doc.created_at) / 1000),
            items_processed: 1,
            session_metadata: JSON.stringify({
              migrated_from: doc.document_id,
              legacy_document: true,
              original_status: doc.status
            })
          });
          
          sessionCount++;
          
          // Update the document to reference the session
          await ctx.db.patch(doc._id, {
            session_id: sessionId,
            last_narration_type: doc.narration_type,
            last_tone: doc.tone,
            last_priority: doc.priority
          });
          
          migratedCount++;
          console.log(`✅ Migrated document ${doc.document_id} to session ${sessionId}`);
        } else {
          // Delete empty documents
          await ctx.db.delete(doc._id);
          console.log(`🗑️ Deleted empty document ${doc.document_id}`);
        }
      } catch (error) {
        console.error(`❌ Failed to migrate document ${doc.document_id}:`, error);
      }
    }
    
    console.log(`✅ Migration completed: ${migratedCount} documents migrated, ${sessionCount} sessions created`);
    
    return {
      totalLegacyDocs: legacyDocs.length,
      migratedDocs: migratedCount,
      sessionsCreated: sessionCount
    };
  },
});

export const getHostDocumentBySession = query({
  args: {
    session_id: v.string(),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db
      .query("host_documents")
      .withIndex("by_session_id", (q) => q.eq("session_id", args.session_id))
      .first();

    return document;
  },
});

export const listHostDocuments = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const documents = await ctx.db
      .query("host_documents")
      .order("desc")
      .take(args.limit || 10);

    return documents;
  },
});
