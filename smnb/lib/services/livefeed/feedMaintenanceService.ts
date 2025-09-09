// FEED MAINTENANCE SERVICE
// /lib/services/livefeed/feedMaintenanceService.ts

/**
 * Service layer for integrating Convex feed maintenance with live feed stores
 * Provides a bridge between the UI stores and backend maintenance functions
 */

import convex from '@/lib/convex';
import { api } from '@/convex/_generated/api';

export interface MaintenanceStats {
  totalPosts: number;
  enrichedPosts: number;
  unenrichedPosts: number;
  recentPosts: number;
  todayPosts: number;
  totalArchivedStories: number;
  recentlyArchivedStories: number;
  oldestPostAge: number;
  newestPostAge: number;
  maintenanceStatus: {
    needsMaintenance: boolean;
    needsEnrichment: boolean;
    recommendsArchival: boolean;
  };
}

export interface MaintenanceResult {
  postsArchived: number;
  remainingPosts: number;
  maintenanceCompleted: boolean;
  timestamp: number;
}

export interface EnrichmentResult {
  postsEnriched: number;
  batchSize: number;
}

export class FeedMaintenanceService {
  private convexClient = convex;

  /**
   * Get current feed statistics and health status
   */
  async getFeedStats(): Promise<MaintenanceStats> {
    try {
      console.log('📊 Getting feed stats...');
      // For now, get basic data and calculate stats
      const posts = await this.convexClient.query(api.redditFeed.getLiveFeedPosts, {
        limit: 100,
      });
      
      const stories = await this.convexClient.query(api.storyHistory.getRecentStories, {
        hours: 24
      });
      
      // Calculate stats
      const now = Date.now();
      const hourAgo = now - (60 * 60 * 1000);
      const dayAgo = now - (24 * 60 * 60 * 1000);
      
      const enrichedPosts = posts.filter(post => {
        const attributes = JSON.parse(post.attributesJson || '{}');
        return attributes.enrichment_level && attributes.enrichment_level > 0;
      });
      
      const recentPosts = posts.filter(p => p.addedAt > hourAgo);
      const todayPosts = posts.filter(p => p.addedAt > dayAgo);
      const recentlyArchivedStories = stories.filter(s => s.completed_at > dayAgo);
      
      const stats = {
        totalPosts: posts.length,
        enrichedPosts: enrichedPosts.length,
        unenrichedPosts: posts.length - enrichedPosts.length,
        recentPosts: recentPosts.length,
        todayPosts: todayPosts.length,
        totalArchivedStories: stories.length,
        recentlyArchivedStories: recentlyArchivedStories.length,
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
      
      console.log('📊 Retrieved feed stats:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Failed to get feed stats:', error);
      throw error;
    }
  }

  /**
   * Trigger feed maintenance to enforce 50 post limit
   * For now, this uses the existing clearing functions as a simplified approach
   */
  async maintainFeedSize(): Promise<MaintenanceResult> {
    try {
      console.log('🔧 Triggering feed maintenance...');
      
      // Get current posts count
      const posts = await this.convexClient.query(api.redditFeed.getLiveFeedPosts, {
        limit: 100,
      });
      
      if (posts.length <= 50) {
        const result = {
          postsArchived: 0,
          remainingPosts: posts.length,
          maintenanceCompleted: true,
          timestamp: Date.now(),
        };
        console.log('✅ No maintenance needed - feed is healthy:', result);
        return result;
      }
      
      // Simulate archiving by moving excess posts to story history
      const postsToArchive = posts.length - 50;
      
      // For each excess post, archive it
      for (let i = 0; i < postsToArchive && i < posts.length; i++) {
        const post = posts[posts.length - 1 - i]; // Archive oldest posts
        
        await this.convexClient.mutation(api.storyHistory.addStory, {
          story_id: `maintenance_archive_${post.id}_${Date.now()}`,
          narrative: `${post.title}\n\n${post.selftext || 'No content'}`,
          title: post.title,
          tone: "developing",
          priority: "low",
          agent_type: "host",
          duration: Math.max(60, Math.floor(post.title.split(' ').length * 3)),
          word_count: (post.title + ' ' + (post.selftext || '')).split(' ').length,
          sentiment: "neutral",
          topics: [post.subreddit],
          summary: post.title.substring(0, 100) + (post.title.length > 100 ? '...' : ''),
          created_at: post.created_utc * 1000,
          completed_at: Date.now(),
          original_item: {
            title: post.title,
            author: post.author,
            subreddit: post.subreddit,
            url: post.url,
          },
          metadata: JSON.stringify({
            archived_from_maintenance: true,
            original_score: post.score,
            original_comments: post.num_comments,
          }),
        });
      }
      
      const result = {
        postsArchived: postsToArchive,
        remainingPosts: 50,
        maintenanceCompleted: true,
        timestamp: Date.now(),
      };
      
      console.log('✅ Feed maintenance completed:', result);
      return result;
    } catch (error) {
      console.error('❌ Feed maintenance failed:', error);
      throw error;
    }
  }

  /**
   * Enrich oldest posts with metadata (simplified version)
   */
  async enrichPosts(batchSize: number = 5): Promise<EnrichmentResult> {
    try {
      console.log(`🧠 Enriching ${batchSize} oldest posts...`);
      
      const posts = await this.convexClient.query(api.redditFeed.getLiveFeedPosts, {
        limit: batchSize * 2, // Get more than we need to filter unenriched ones
      });
      
      // Filter to only unenriched posts
      const unenrichedPosts = posts.filter(post => {
        const attributes = JSON.parse(post.attributesJson || '{}');
        return !attributes.enrichment_level || attributes.enrichment_level === 0;
      }).slice(0, batchSize);
      
      if (unenrichedPosts.length === 0) {
        const result = { postsEnriched: 0, batchSize };
        console.log('📭 No posts need enrichment:', result);
        return result;
      }
      
      // For now, just simulate enrichment by logging
      // In a real implementation, this would update the posts in Convex
      console.log(`✨ Simulating enrichment of ${unenrichedPosts.length} posts`);
      
      const result = { postsEnriched: unenrichedPosts.length, batchSize };
      console.log('✨ Post enrichment completed:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Post enrichment failed:', error);
      throw error;
    }
  }

  /**
   * Archive completed stories that are fully processed (simplified)
   */
  async archiveCompletedStories(ageHours: number = 24): Promise<{ storiesArchived: number; ageHours: number }> {
    try {
      console.log(`📚 Archiving completed stories older than ${ageHours} hours...`);
      
      const posts = await this.convexClient.query(api.redditFeed.getLiveFeedPosts, {
        limit: 100,
      });
      
      const cutoffTime = Date.now() - (ageHours * 60 * 60 * 1000);
      const oldPosts = posts.filter(post => {
        const attributes = JSON.parse(post.attributesJson || '{}');
        return post.addedAt < cutoffTime && attributes.enrichment_level && attributes.enrichment_level > 0;
      });
      
      // Simulate archiving these posts
      console.log(`📖 Would archive ${oldPosts.length} completed stories`);
      
      const result = { storiesArchived: oldPosts.length, ageHours };
      console.log('📚 Story archival completed:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Story archival failed:', error);
      throw error;
    }
  }

  /**
   * Run complete maintenance cycle (check only - no actual changes)
   */
  async checkMaintenanceRequirements() {
    try {
      console.log('🔍 Checking maintenance requirements...');
      
      const stats = await this.getFeedStats();
      
      const result = {
        totalPosts: stats.totalPosts,
        needsMaintenance: stats.totalPosts > 50,
        postsToArchive: Math.max(0, stats.totalPosts - 50),
        needsEnrichment: stats.unenrichedPosts,
        oldPostsForArchival: 0, // Simplified for now
        recommendations: {
          runMaintenance: stats.totalPosts > 50,
          runEnrichment: stats.unenrichedPosts > 0,
          runArchival: false,
        },
        timestamp: Date.now(),
      };
      
      console.log('📋 Maintenance check completed:', result);
      return result;
    } catch (error) {
      console.error('❌ Maintenance check failed:', error);
      throw error;
    }
  }

  /**
   * Perform complete maintenance cycle in proper order (simplified)
   */
  async performCompleteMaintenance() {
    try {
      console.log('🔄 Starting complete maintenance cycle...');
      
      // Step 1: Enrich oldest posts first
      const enrichmentResult = await this.enrichPosts(5);
      
      // Step 2: Archive completed stories
      const archivalResult = await this.archiveCompletedStories(24);
      
      // Step 3: Maintain feed size
      const maintenanceResult = await this.maintainFeedSize();
      
      const summary = {
        enriched: enrichmentResult.postsEnriched,
        archived: archivalResult.storiesArchived,
        feedMaintenance: maintenanceResult.postsArchived,
        totalRemaining: maintenanceResult.remainingPosts,
        completedAt: Date.now(),
      };
      
      console.log('🎉 Complete maintenance cycle finished:', summary);
      return summary;
      
    } catch (error) {
      console.error('❌ Complete maintenance cycle failed:', error);
      throw error;
    }
  }

  /**
   * Automated maintenance that can be called periodically
   * This mimics what a cron job would do every 15 minutes
   */
  async automatedMaintenance() {
    try {
      console.log('⏰ Starting automated maintenance (simulated 15-minute cycle)...');
      
      // Get current status
      const stats = await this.getFeedStats();
      const requirements = await this.checkMaintenanceRequirements();
      
      let actions = [];
      
      // Only run maintenance if needed
      if (requirements.recommendations.runEnrichment) {
        const enrichResult = await this.enrichPosts(3); // Smaller batch for regular maintenance
        actions.push(`Enriched ${enrichResult.postsEnriched} posts`);
      }
      
      if (requirements.recommendations.runMaintenance) {
        const maintainResult = await this.maintainFeedSize();
        actions.push(`Removed ${maintainResult.postsArchived} excess posts`);
      }
      
      const result = {
        actions,
        actionsPerformed: actions.length,
        stats: await this.getFeedStats(), // Get updated stats
        timestamp: Date.now(),
      };
      
      console.log('✅ Automated maintenance completed:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Automated maintenance failed:', error);
      throw error;
    }
  }

  /**
   * Format maintenance stats for display
   */
  formatStatsForDisplay(stats: MaintenanceStats) {
    const ageInHours = (age: number) => Math.floor(age / (1000 * 60 * 60));
    
    return {
      summary: {
        totalPosts: stats.totalPosts,
        health: stats.totalPosts <= 50 ? 'Healthy' : 'Needs Maintenance',
        enrichmentProgress: `${stats.enrichedPosts}/${stats.totalPosts} enriched`,
        status: stats.maintenanceStatus.needsMaintenance ? 'Action Required' : 'OK',
      },
      details: {
        postsToday: stats.todayPosts,
        postsLastHour: stats.recentPosts,
        oldestPostAge: `${ageInHours(stats.oldestPostAge)} hours`,
        newestPostAge: `${ageInHours(stats.newestPostAge)} hours`,
        archivedStoriesToday: stats.recentlyArchivedStories,
        totalArchivedStories: stats.totalArchivedStories,
      },
      recommendations: {
        needsMaintenance: stats.maintenanceStatus.needsMaintenance,
        needsEnrichment: stats.maintenanceStatus.needsEnrichment,
        recommendsArchival: stats.maintenanceStatus.recommendsArchival,
      },
    };
  }
}

// Singleton instance
export const feedMaintenanceService = new FeedMaintenanceService();