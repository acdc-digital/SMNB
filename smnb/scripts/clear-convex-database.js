// ⚠️  DESTRUCTIVE OPERATION: Complete Convex Database Clearing Script
// This script will DELETE ALL DATA from your Convex database
// 
// Usage:
// 1. Save this as a Convex mutation in your /convex folder temporarily
// 2. Run it via Convex dashboard or CLI
// 3. Remove the file after use
//
// BACKUP YOUR DATA BEFORE RUNNING THIS SCRIPT!

/**
 * 🗑️ CONVEX DATABASE NUCLEAR RESET
 * 
 * This mutation will completely clear ALL tables in your Convex database.
 * Use with extreme caution - this operation is irreversible!
 * 
 * Tables that will be cleared:
 * - token_usage (all token tracking data)
 * - live_feed_posts (all Reddit posts)
 * - editor_documents (all editor content)
 * - host_sessions (all host sessions)
 * - host_documents (all host-generated content)
 * - story_history (all completed stories)
 */

// Save this content to: /Users/matthewsimon/Projects/SMNB/smnb/convex/clearDatabase.ts

/*
import { mutation } from "./_generated/server";

export const clearEntireDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    const startTime = Date.now();
    let totalDeleted = 0;
    const deletionReport = [];

    console.log("🚨 STARTING COMPLETE DATABASE DELETION");
    console.log("⚠️  This operation will delete ALL data from ALL tables");

    // List all tables in your schema
    const tables = [
      "token_usage",
      "live_feed_posts", 
      "editor_documents",
      "host_sessions",
      "host_documents",
      "story_history"
    ];

    // Clear each table completely
    for (const tableName of tables) {
      console.log(`🗑️ Clearing table: ${tableName}`);
      
      let deleted = 0;
      let hasMore = true;
      
      while (hasMore) {
        // Get batch of documents (Convex limits batch operations)
        const docs = await ctx.db
          .query(tableName)
          .take(100); // Process in batches of 100
        
        if (docs.length === 0) {
          hasMore = false;
          break;
        }
        
        // Delete each document in the batch
        for (const doc of docs) {
          await ctx.db.delete(doc._id);
          deleted++;
        }
        
        console.log(`  📊 Deleted ${deleted} documents from ${tableName}...`);
      }
      
      deletionReport.push({ table: tableName, deleted });
      totalDeleted += deleted;
      
      console.log(`✅ Completed clearing ${tableName}: ${deleted} documents deleted`);
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log("\n🎯 DATABASE CLEARING COMPLETE");
    console.log("=" .repeat(50));
    
    deletionReport.forEach(({ table, deleted }) => {
      console.log(`📊 ${table}: ${deleted} documents deleted`);
    });
    
    console.log("=" .repeat(50));
    console.log(`🔢 Total documents deleted: ${totalDeleted}`);
    console.log(`⏱️ Total time: ${duration} seconds`);
    console.log(`💾 Database is now completely empty`);

    return {
      success: true,
      totalDeleted,
      deletionReport,
      duration,
      timestamp: Date.now(),
      message: "🗑️ Complete database clearing successful"
    };
  },
});

// Optional: Selective table clearing function
export const clearSpecificTables = mutation({
  args: {
    tables: v.array(v.string()), // Array of table names to clear
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    let totalDeleted = 0;
    const deletionReport = [];

    console.log(`🎯 CLEARING SPECIFIC TABLES: ${args.tables.join(", ")}`);

    for (const tableName of args.tables) {
      console.log(`🗑️ Clearing table: ${tableName}`);
      
      let deleted = 0;
      let hasMore = true;
      
      while (hasMore) {
        const docs = await ctx.db
          .query(tableName)
          .take(100);
        
        if (docs.length === 0) {
          hasMore = false;
          break;
        }
        
        for (const doc of docs) {
          await ctx.db.delete(doc._id);
          deleted++;
        }
        
        console.log(`  📊 Deleted ${deleted} documents from ${tableName}...`);
      }
      
      deletionReport.push({ table: tableName, deleted });
      totalDeleted += deleted;
      
      console.log(`✅ Completed clearing ${tableName}: ${deleted} documents deleted`);
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log(`\n✅ SELECTIVE CLEARING COMPLETE: ${totalDeleted} documents deleted in ${duration}s`);

    return {
      success: true,
      totalDeleted,
      deletionReport,
      duration,
      clearedTables: args.tables,
      timestamp: Date.now()
    };
  },
});

// Quick stats before clearing (recommended to run first)
export const getDatabaseStats = query({
  args: {},
  handler: async (ctx) => {
    const tables = [
      "token_usage",
      "live_feed_posts", 
      "editor_documents",
      "host_sessions",
      "host_documents",
      "story_history"
    ];
    
    const stats = [];
    let totalDocuments = 0;
    
    for (const tableName of tables) {
      const count = await ctx.db
        .query(tableName)
        .collect()
        .then(docs => docs.length);
      
      stats.push({ table: tableName, count });
      totalDocuments += count;
    }
    
    return {
      totalDocuments,
      tableStats: stats,
      timestamp: Date.now()
    };
  },
});
*/

console.log(`
⚠️  CONVEX DATABASE CLEARING SCRIPT
===================================

🚨 WARNING: This script will DELETE ALL DATA from your Convex database!

📋 INSTRUCTIONS:
1. Copy the TypeScript code from the comments above
2. Save it as /Users/matthewsimon/Projects/SMNB/smnb/convex/clearDatabase.ts
3. Deploy to Convex: npx convex dev (or convex deploy)
4. Run from Convex dashboard or use Convex CLI

📊 AVAILABLE FUNCTIONS:
• getDatabaseStats() - Check current data before clearing
• clearEntireDatabase() - DELETE EVERYTHING (nuclear option)
• clearSpecificTables(tables: string[]) - Delete only specific tables

🔧 USAGE EXAMPLES:

Via Convex CLI:
npx convex run clearDatabase:getDatabaseStats
npx convex run clearDatabase:clearEntireDatabase
npx convex run clearDatabase:clearSpecificTables '{"tables": ["live_feed_posts", "token_usage"]}'

Via JavaScript (in your app):
const stats = await convex.query(api.clearDatabase.getDatabaseStats, {});
const result = await convex.mutation(api.clearDatabase.clearEntireDatabase, {});

📋 TABLES THAT WILL BE CLEARED:
✅ token_usage          - All token tracking data  
✅ live_feed_posts      - All Reddit posts
✅ editor_documents     - All editor content
✅ host_sessions        - All host sessions
✅ host_documents       - All host-generated content
✅ story_history        - All completed stories

⚠️  REMEMBER:
• Backup your data first if needed
• This operation is irreversible
• Remove the clearDatabase.ts file after use
• Test with getDatabaseStats() first

🚨 USE WITH EXTREME CAUTION! 🚨
`);