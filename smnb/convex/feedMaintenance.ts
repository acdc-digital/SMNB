// FEED MAINTENANCE CRON JOBS
// /convex/feedMaintenance.ts

/**
 * Convex cron jobs for chronological story updates and feed maintenance
 * Runs every 15 minutes to maintain 50 post maximum and enrich content
 */

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Main feed maintenance cron - runs every 15 minutes
crons.interval(
  "feed-maintenance",
  { minutes: 15 },
  internal.feedMaintenanceJobs.maintainLiveFeed
);

// Continuous enrichment cron - runs every 5 minutes for content enhancement
crons.interval(
  "continuous-enrichment", 
  { minutes: 5 },
  internal.feedMaintenanceJobs.enrichOldestPosts
);

// Archive completed stories - runs every 30 minutes
crons.interval(
  "archive-stories",
  { minutes: 30 },
  internal.feedMaintenanceJobs.archiveCompletedStories
);

export default crons;