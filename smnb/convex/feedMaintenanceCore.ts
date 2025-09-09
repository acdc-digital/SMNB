// FEED MAINTENANCE CORE
// /convex/feedMaintenanceCore.ts

/**
 * Core feed maintenance functions for chronological story updates
 * These can be called manually or integrated with cron jobs later
 */

import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";

// Configuration constants
const MAX_LIVE_POSTS = 50;
const ENRICHMENT_BATCH_SIZE = 5;
const ARCHIVE_AGE_HOURS = 24;

/**
 * Main feed maintenance function - maintains 50 post limit and chronological order
 * This can be called manually or triggered by external cron systems
 */
export const maintainLiveFeed = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("🔄 Starting feed maintenance - checking post count and chronological order");

    try {
      // Get all live feed posts ordered by addedAt (newest first)
      const allPosts = await ctx.db
        .query("live_feed_posts")
        .withIndex("by_addedAt")
        .order("desc")
        .collect();

      console.log(`📊 Current post count: ${allPosts.length}, max allowed: ${MAX_LIVE_POSTS}`);

      let archivedCount = 0;

      // If we have more than MAX_LIVE_POSTS, archive the oldest ones
      if (allPosts.length > MAX_LIVE_POSTS) {
        const postsToArchive = allPosts.slice(MAX_LIVE_POSTS);
        
        console.log(`🗃️ Archiving ${postsToArchive.length} oldest posts to story_history`);
        
        for (const post of postsToArchive) {
          // Archive to story_history table
          await ctx.db.insert("story_history", {
            story_id: `archived_${post.id}_${Date.now()}`,
            narrative: `${post.title}\n\n${post.selftext || 'No content'}`,
            title: post.title,
            tone: "developing", // Default tone for archived posts
            priority: "low", // Archived posts are low priority
            agent_type: "host", // Assume host agent for archived posts
            duration: Math.max(60, Math.floor(post.title.split(' ').length * 3)), // Estimate reading time
            word_count: (post.title + ' ' + (post.selftext || '')).split(' ').length,
            sentiment: "neutral", // Default sentiment
            topics: [post.subreddit], // Use subreddit as topic
            summary: post.title.substring(0, 100) + (post.title.length > 100 ? '...' : ''),
            created_at: post.created_utc * 1000, // Convert Reddit timestamp
            completed_at: Date.now(),
            original_item: {
              title: post.title,
              author: post.author,
              subreddit: post.subreddit,
              url: post.url,
            },
            metadata: JSON.stringify({
              archived_from_live_feed: true,
              original_score: post.score,
              original_comments: post.num_comments,
              domain: post.domain,
              batch_id: post.batchId,
            }),
          });

          // Remove from live feed
          await ctx.db.delete(post._id);
          archivedCount++;
        }

        console.log(`✅ Successfully archived ${archivedCount} posts`);
      }

      // Get current remaining posts for stats
      const remainingPosts = await ctx.db
        .query("live_feed_posts")
        .withIndex("by_addedAt")
        .order("desc")
        .take(MAX_LIVE_POSTS);

      console.log(`📋 Maintaining ${remainingPosts.length} posts in chronological order`);

      return {
        postsArchived: archivedCount,
        remainingPosts: remainingPosts.length,
        maintenanceCompleted: true,
        timestamp: Date.now(),
      };

    } catch (error) {
      console.error("❌ Feed maintenance failed:", error);
      throw error;
    }
  },
});

/**
 * Continuous enrichment function - processes oldest posts for enhancement
 */
export const enrichOldestPosts = mutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || ENRICHMENT_BATCH_SIZE;
    console.log(`🧠 Starting continuous enrichment of ${batchSize} oldest posts`);

    try {
      // Get the oldest posts that could benefit from enrichment
      const oldestPosts = await ctx.db
        .query("live_feed_posts")
        .withIndex("by_addedAt")
        .order("asc") // Oldest first
        .take(batchSize);

      if (oldestPosts.length === 0) {
        console.log("📭 No posts available for enrichment");
        return { postsEnriched: 0 };
      }

      console.log(`🎯 Found ${oldestPosts.length} posts for enrichment`);

      let enrichedCount = 0;
      for (const post of oldestPosts) {
        // Parse existing attributes
        const existingAttributes = JSON.parse(post.attributesJson || '{}');
        
        // Add enrichment metadata
        const enrichmentData = {
          enrichment_level: (existingAttributes.enrichment_level || 0) + 1,
          last_enriched_at: Date.now(),
          processing_status: 'enriched',
          // Add simple sentiment analysis
          sentiment: analyzeBasicSentiment(post.title + ' ' + post.selftext),
          // Extract topics from subreddit and title
          topics: extractTopics(post.title, post.subreddit),
          // Calculate engagement score
          engagement_score: calculateEngagementScore(post),
        };

        // Update post with enrichment data
        await ctx.db.patch(post._id, {
          attributesJson: JSON.stringify({
            ...existingAttributes,
            ...enrichmentData,
          }),
        });

        enrichedCount++;
        console.log(`✨ Enriched post: ${post.title.substring(0, 50)}...`);
      }

      console.log(`🎉 Successfully enriched ${enrichedCount} posts`);
      
      return { postsEnriched: enrichedCount, batchSize };

    } catch (error) {
      console.error("❌ Enrichment failed:", error);
      throw error;
    }
  },
});

/**
 * Archive completed stories that are fully processed
 */
export const archiveCompletedStories = mutation({
  args: {
    ageHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const ageHours = args.ageHours || ARCHIVE_AGE_HOURS;
    console.log(`📚 Starting archive of completed stories older than ${ageHours} hours`);

    try {
      const cutoffTime = Date.now() - (ageHours * 60 * 60 * 1000);
      
      // Find posts old enough and enriched enough to be considered "completed"
      const completedPosts = await ctx.db
        .query("live_feed_posts")
        .withIndex("by_addedAt")
        .filter(q => q.lt(q.field("addedAt"), cutoffTime))
        .collect();

      let archivedStories = 0;
      
      for (const post of completedPosts) {
        const attributes = JSON.parse(post.attributesJson || '{}');
        
        // Only archive posts that have been enriched at least once
        if (attributes.enrichment_level && attributes.enrichment_level > 0) {
          // Create a comprehensive story entry
          await ctx.db.insert("story_history", {
            story_id: `completed_${post.id}_${Date.now()}`,
            narrative: generateStoryNarrative(post, attributes),
            title: post.title,
            tone: determineTone(post, attributes),
            priority: determinePriority(post, attributes),
            agent_type: "editor",
            duration: estimateReadingTime(post.title + ' ' + (post.selftext || '')),
            word_count: (post.title + ' ' + (post.selftext || '')).split(' ').length,
            sentiment: attributes.sentiment || "neutral",
            topics: attributes.topics || [post.subreddit],
            summary: generateSummary(post),
            created_at: post.created_utc * 1000,
            completed_at: Date.now(),
            original_item: {
              title: post.title,
              author: post.author,
              subreddit: post.subreddit,
              url: post.url,
            },
            metadata: JSON.stringify({
              completed_story: true,
              enrichment_level: attributes.enrichment_level,
              engagement_score: attributes.engagement_score,
              original_score: post.score,
              processing_history: attributes,
            }),
          });

          // Remove from live feed
          await ctx.db.delete(post._id);
          archivedStories++;
          
          console.log(`📖 Archived completed story: ${post.title.substring(0, 50)}...`);
        }
      }

      console.log(`📚 Archived ${archivedStories} completed stories`);
      
      return { storiesArchived: archivedStories, ageHours };

    } catch (error) {
      console.error("❌ Story archival failed:", error);
      throw error;
    }
  },
});

/**
 * Run all maintenance tasks in sequence
 * This is a simple version that just returns guidance for now
 */
export const runFullMaintenance = query({
  args: {},
  handler: async (ctx) => {
    console.log("🔧 Checking maintenance requirements");
    
    try {
      // Get current post count
      const posts = await ctx.db.query("live_feed_posts").collect();
      
      // Check how many need enrichment
      const unenrichedPosts = posts.filter(post => {
        const attributes = JSON.parse(post.attributesJson || '{}');
        return !attributes.enrichment_level || attributes.enrichment_level === 0;
      });
      
      // Check how many are old enough for archival
      const cutoffTime = Date.now() - (ARCHIVE_AGE_HOURS * 60 * 60 * 1000);
      const oldPosts = posts.filter(post => post.addedAt < cutoffTime);
      
      return {
        totalPosts: posts.length,
        needsMaintenance: posts.length > MAX_LIVE_POSTS,
        postsToArchive: Math.max(0, posts.length - MAX_LIVE_POSTS),
        needsEnrichment: unenrichedPosts.length,
        oldPostsForArchival: oldPosts.length,
        recommendations: {
          runMaintenance: posts.length > MAX_LIVE_POSTS,
          runEnrichment: unenrichedPosts.length > 0,
          runArchival: oldPosts.length > 0,
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("❌ Maintenance check failed:", error);
      throw error;
    }
  },
});

// Helper functions for enrichment and story processing

function analyzeBasicSentiment(text: string): "positive" | "negative" | "neutral" {
  const positiveWords = ['great', 'amazing', 'awesome', 'excellent', 'fantastic', 'good', 'best', 'wonderful', 'brilliant', 'outstanding'];
  const negativeWords = ['terrible', 'awful', 'horrible', 'disaster', 'crisis', 'bad', 'worst', 'fail', 'problem', 'issue'];
  
  const lowercaseText = text.toLowerCase();
  const positiveCount = positiveWords.filter(word => lowercaseText.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowercaseText.includes(word)).length;
  
  if (positiveCount > negativeCount + 1) return 'positive';
  if (negativeCount > positiveCount + 1) return 'negative';
  return 'neutral';
}

function extractTopics(title: string, subreddit: string): string[] {
  const topics = [subreddit];
  
  // Technology keywords
  if (['tech', 'programming', 'software', 'computer', 'ai', 'robot'].some(word => 
    title.toLowerCase().includes(word) || subreddit.toLowerCase().includes(word))) {
    topics.push('technology');
  }
  
  // Politics keywords  
  if (['politic', 'election', 'government', 'policy', 'vote'].some(word => 
    title.toLowerCase().includes(word) || subreddit.toLowerCase().includes(word))) {
    topics.push('politics');
  }
  
  // Science keywords
  if (['science', 'research', 'study', 'discovery', 'experiment'].some(word => 
    title.toLowerCase().includes(word) || subreddit.toLowerCase().includes(word))) {
    topics.push('science');
  }
  
  // Remove duplicates using a simple filter
  return topics.filter((topic, index, array) => array.indexOf(topic) === index);
}

function calculateEngagementScore(post: any): number {
  // Weighted engagement score based on multiple factors
  const scoreWeight = 0.4;
  const commentsWeight = 0.4;
  const ratioWeight = 0.2;
  
  const normalizedScore = Math.min(post.score / 1000, 1); // Normalize to 0-1
  const normalizedComments = Math.min(post.num_comments / 500, 1); // Normalize to 0-1
  const ratio = post.upvote_ratio || 0.5;
  
  return (normalizedScore * scoreWeight) + (normalizedComments * commentsWeight) + (ratio * ratioWeight);
}

function generateStoryNarrative(post: any, attributes: any): string {
  const narrative = `# ${post.title}

**Author:** ${post.author} | **Subreddit:** r/${post.subreddit} | **Score:** ${post.score}

${post.selftext || 'No additional content provided.'}

---

**Story Analysis:**
- **Sentiment:** ${attributes.sentiment || 'neutral'}
- **Topics:** ${(attributes.topics || [post.subreddit]).join(', ')}
- **Engagement Score:** ${(attributes.engagement_score || 0).toFixed(2)}
- **Enrichment Level:** ${attributes.enrichment_level || 0}

**Original Discussion:** [View on Reddit](https://reddit.com${post.permalink})
`;

  return narrative;
}

function determineTone(post: any, attributes: any): "breaking" | "developing" | "analysis" | "opinion" | "human-interest" {
  // Determine tone based on content and attributes
  if (post.score > 5000 || (post.num_comments > 1000)) return 'breaking';
  if (attributes.sentiment === 'negative' && post.num_comments > 100) return 'breaking';
  if (post.subreddit.includes('news') || post.subreddit.includes('worldnews')) return 'developing';
  if (post.subreddit.includes('askreddit') || post.subreddit.includes('discussion')) return 'opinion';
  if (post.subreddit.includes('todayilearned') || post.subreddit.includes('til')) return 'human-interest';
  return 'analysis';
}

function determinePriority(post: any, attributes: any): "high" | "medium" | "low" {
  const engagementScore = attributes.engagement_score || 0;
  if (engagementScore > 0.7 || post.score > 10000) return 'high';
  if (engagementScore > 0.4 || post.score > 1000) return 'medium';
  return 'low';
}

function estimateReadingTime(text: string): number {
  // Estimate reading time at 200 words per minute
  const wordCount = text.split(' ').length;
  return Math.max(30, Math.floor((wordCount / 200) * 60)); // At least 30 seconds
}

function generateSummary(post: any): string {
  const maxLength = 150;
  let summary = post.title;
  
  if (post.selftext && post.selftext.length > 0) {
    const firstSentence = post.selftext.split('.')[0];
    summary = `${post.title} - ${firstSentence}`;
  }
  
  return summary.length > maxLength ? summary.substring(0, maxLength - 3) + '...' : summary;
}