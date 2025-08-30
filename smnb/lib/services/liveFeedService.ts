import {
  fetchHotPosts,
  fetchRisingPosts,
  fetchTrendingPosts,
} from '@/lib/reddit-actions';
import { LiveFeedPost } from '@/lib/stores/liveFeedStore';
import { queueAgent } from './queueAgent';

export class LiveFeedService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start the live feed with specified configuration
   */
  start(
    onNewPosts: (payload: { batch: LiveFeedPost[]; candidates: LiveFeedPost[] }) => void,
    onError: (error: string | null) => void,
    onLoadingChange: (loading: boolean) => void,
    config: {
      subreddits: string[];
      intervalSeconds: number;
    }
  ) {
    if (this.isRunning) {
      this.stop();
    }

    this.isRunning = true;

    // Set up queue agent callback
    queueAgent.setOnPostReady((post) => {
      // When queue agent has a post ready, add it to the store
      onNewPosts({ batch: [post], candidates: [post] });
    });

    // Fetch immediately
    this.fetchAndProcess(onNewPosts, onError, onLoadingChange, config);

    // Set up interval
    this.intervalId = setInterval(() => {
      if (this.isRunning) {
        this.fetchAndProcess(onNewPosts, onError, onLoadingChange, config);
      }
    }, config.intervalSeconds * 1000);
  }

  /**
   * Stop the live feed
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  /**
   * Get current running status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      hasInterval: !!this.intervalId,
    };
  }

  /**
   * Fetch from all configured sources and process results
   */
  private async fetchAndProcess(
    onNewPosts: (payload: { batch: LiveFeedPost[]; candidates: LiveFeedPost[] }) => void,
    onError: (error: string | null) => void,
    onLoadingChange: (loading: boolean) => void,
    config: { subreddits: string[] }
  ) {
    try {
      onLoadingChange(true);
      onError(null);

      const allPosts: LiveFeedPost[] = [];

      // Strategy 1: Rising posts from each subreddit (most dynamic content)
      // Increase per-subreddit fetch size but cap later to avoid domination by any single subreddit
    const risingPostsPromises = config.subreddits.map(async (subreddit) => {
        try {
      // increase per-subreddit rising fetch to broaden pool
      const result = await fetchRisingPosts(subreddit, 30);
          return result.posts.map((post): LiveFeedPost => ({
            ...post,
            source: `${subreddit}/rising`,
            addedAt: Date.now(),
            batchId: 0, // Will be set later by the handler
          }));
        } catch (error) {
          console.warn(`Failed to fetch rising posts from r/${subreddit}:`, error);
          return [];
        }
      });

      // Strategy 2: Hot posts from each subreddit (varied but slightly smaller)
    const hotPostsPromises = config.subreddits.map(async (subreddit) => {
        try {
      // increase hot fetch size
      const result = await fetchHotPosts(subreddit, 12);
          return result.posts.map((post): LiveFeedPost => ({
            ...post,
            source: `${subreddit}/hot`,
            addedAt: Date.now(),
            batchId: 0, // Will be set later by the handler
          }));
        } catch (error) {
          console.warn(`Failed to fetch hot posts from r/${subreddit}:`, error);
          return [];
        }
      });

      // Strategy 3: Rising posts from r/all for broad trending content
  const globalRisingPromise = fetchRisingPosts('all', 60).then(
        (result) => result.posts.map((post): LiveFeedPost => ({
          ...post,
          source: 'all/rising',
          addedAt: Date.now(),
          batchId: 0, // Will be set later by the handler
        }))
      ).catch(() => []);

      // Strategy 4: Trending posts (top from last hour)
  const trendingPostsPromise = fetchTrendingPosts('all', 60).then(
        (result) => result.posts.map((post): LiveFeedPost => ({
          ...post,
          source: 'all/trending',
          addedAt: Date.now(),
          batchId: 0, // Will be set later by the handler
        }))
      ).catch(() => []);

      // Strategy 5: Multi-subreddit mix for variety (add more diversified sources)
    // Expand extra subreddits to broaden candidate reach
    // Slightly larger extra subreddit set for diversity
    const extraSubreddits = ['news', 'worldnews', 'popular', 'pics', 'funny', 'sports', 'gaming', 'movies', 'television', 'aww', 'technology', 'science', 'learnprogramming', 'nsfw', 'NSFW411', 'gonewild'];

    const extraPromises = extraSubreddits.map(async (subreddit) => {
        try {
      // mix of rising and hot from popular or topical subs (bigger per-sub fetch)
      const rising = await fetchRisingPosts(subreddit, 12);
      const hot = await fetchHotPosts(subreddit, 8);
          return [
            ...rising.posts.map((post): LiveFeedPost => ({
              ...post,
              source: `${subreddit}/rising`,
              addedAt: Date.now(),
              batchId: 0,
            })),
            ...hot.posts.map((post): LiveFeedPost => ({
              ...post,
              source: `${subreddit}/hot`,
              addedAt: Date.now(),
              batchId: 0,
            })),
          ];
        } catch (e) {
          console.warn(`Failed to fetch extra posts for r/${subreddit}:`, e);
          return [];
        }
      });

      // Execute all strategies in parallel, including extra subs
      const [risingPostsArrays, hotPostsArrays, globalRising, trendingPosts, extraResults] = await Promise.all([
        Promise.allSettled(risingPostsPromises),
        Promise.allSettled(hotPostsPromises),
        globalRisingPromise,
        trendingPostsPromise,
        Promise.allSettled(extraPromises),
      ]);

      // Collect all successful results
      risingPostsArrays.forEach((result) => {
        if (result.status === 'fulfilled') {
          allPosts.push(...result.value);
        }
      });
      
      hotPostsArrays.forEach((result) => {
        if (result.status === 'fulfilled') {
          allPosts.push(...result.value);
        }
      });

      allPosts.push(...globalRising, ...trendingPosts);

      // Add the extra subreddit results
      extraResults.forEach((r) => {
        if (r.status === 'fulfilled') {
          allPosts.push(...r.value.flat());
        }
      });

      // Remove duplicates and compute attributes for each post
      const uniquePosts = this.deduplicateAndScore(allPosts);

  // Expand to a much wider candidate pool (~300) and compute a features object
  // Also cap contributions from any single subreddit to avoid domination
  const perSubredditCap = 20;

      const cappedBySubreddit: LiveFeedPost[] = [];
      const counts = new Map<string, number>();

      for (const p of uniquePosts) {
        const sub = p.source.split('/')[0];
        const c = counts.get(sub) || 0;
        if (c < perSubredditCap) {
          cappedBySubreddit.push(p);
          counts.set(sub, c + 1);
        }
      }

  // allow up to 300 candidates and compute attributes for each
  const candidatePosts = cappedBySubreddit.slice(0, 300).map((p) => {
        const hoursOld = Math.max(1, (Date.now()/1000 - p.created_utc) / 3600);
        // Build ~30 feature vector (simple heuristics)
        const attributes: Record<string, number> = {
          engagement: p.score + p.num_comments,
          upvoteRatio: p.upvote_ratio,
          isVideo: p.is_video ? 1 : 0,
          titleLength: p.title.length,
          selftextLength: p.selftext ? p.selftext.length : 0,
          domainScore: p.domain ? p.domain.length % 10 : 0,
          subredditPopularity: p.score / hoursOld,
          commentsDensity: p.num_comments / Math.max(1, Math.log1p(p.score + 1)),
          recencyHours: hoursOld,
          engagementPerHour: (p.score + p.num_comments) / hoursOld,
          titleWordCount: p.title.split(/\s+/).length,
          hasMedia: p.thumbnail && p.thumbnail.startsWith('http') ? 1 : 0,
          isCrosspost: p.permalink.includes('/r/') ? 1 : 0,
          domainTrust: p.domain && p.domain.includes('reddit') ? 0.5 : 1.0,
          authorNameLength: p.author.length,
          ratioScoreComments: p.num_comments > 0 ? p.score / p.num_comments : p.score,
          over18: p.over_18 ? 1 : 0,
          titleExclamation: (p.title.match(/!/g) || []).length,
          selftextHasLink: (p.selftext || '').includes('http') ? 1 : 0,
          pctUpvotes: p.upvote_ratio,
          trendingBoost: p.source.includes('trending') ? 1 : 0,
          risingBoost: p.source.includes('rising') ? 1 : 0,
          hotBoost: p.source.includes('hot') ? 0.5 : 0,
          domainLength: p.domain ? p.domain.length : 0,
          titleCapsRatio: (p.title.replace(/[^A-Z]/g, '').length) / Math.max(1, p.title.length),
          selftextSentimentProxy: Math.max(0, Math.min(1, ((p.upvote_ratio - 0.5) * 2))),
          mediaTypeScore: p.is_video ? 1.5 : (p.thumbnail && p.thumbnail.startsWith('http') ? 1 : 0.2),
          noveltyScore: 1 / Math.log1p(1 + Math.abs(p.score - p.num_comments)),
        };

        return {
          ...p,
          attributesJson: JSON.stringify(attributes),
        } as LiveFeedPost & { attributesJson: string };
      });

      // Weighted linear model for ranking using the generated attributes
      const featureWeights: Record<string, number> = {
        engagement: 1.2,
        engagementPerHour: 1.5,
        upvoteRatio: 0.8,
        commentsDensity: 0.9,
        hasMedia: 0.6,
        isVideo: 0.6,
        trendingBoost: 1.3,
        risingBoost: 1.1,
        hotBoost: 0.5,
        titleLength: 0.01,
        titleWordCount: 0.05,
        titleCapsRatio: -0.5,
        titleExclamation: -0.2,
        selftextLength: 0.002,
        selftextHasLink: 0.4,
        domainTrust: 0.2,
        domainScore: 0.01,
        authorNameLength: -0.01,
        over18: -0.5,
        mediaTypeScore: 0.7,
        noveltyScore: 0.6,
        pctUpvotes: 0.5,
        subredditPopularity: 0.3,
        recencyHours: -0.2,
        ratioScoreComments: 0.2,
        selftextSentimentProxy: 0.4,
      };

      const scoreFromAttributes = (attrsJson?: string) => {
        if (!attrsJson) return 0;
        try {
          const attrs = JSON.parse(attrsJson) as Record<string, number>;
          return Object.entries(featureWeights).reduce((acc, [k, w]) => acc + (attrs[k] || 0) * w, 0);
        } catch {
          return 0;
        }
      };

      // Rank all candidates by score (descending)
      const ranked = candidatePosts
        .map((p) => ({ p, score: scoreFromAttributes(p.attributesJson) }))
        .sort((a, b) => b.score - a.score)
        .map(x => ({ ...x.p } as LiveFeedPost));

  // Primary batch is top 10 (we still persist a deterministic batch of 10)
  const batchPosts = ranked.slice(0, 10);

      if (batchPosts.length > 0) {
        // Send posts to queue agent for controlled processing
        console.log(`📤 Live feed: Sending ${batchPosts.length} posts to queue agent`);
        queueAgent.enqueue(batchPosts);

        // Still provide candidates for fallback/reference
        onNewPosts({ batch: [], candidates: ranked });
      } else {
        console.log('📭 Live feed: No new posts found');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ Live feed error:', errorMessage);
      onError(`Feed error: ${errorMessage}`);
    } finally {
      onLoadingChange(false);
    }
  }

  /**
   * Remove duplicates and score posts for relevance
   */
  private deduplicateAndScore(posts: LiveFeedPost[]): LiveFeedPost[] {
    // Remove duplicates by Reddit ID
    const uniqueMap = new Map<string, LiveFeedPost>();
    
    posts.forEach(post => {
      const existing = uniqueMap.get(post.id);
      if (!existing || this.calculateRelevanceScore(post) > this.calculateRelevanceScore(existing)) {
        uniqueMap.set(post.id, post);
      }
    });

    // Sort by relevance score
    return Array.from(uniqueMap.values())
      .sort((a, b) => this.calculateRelevanceScore(b) - this.calculateRelevanceScore(a));
  }

  /**
   * Calculate relevance score for sorting
   */
  private calculateRelevanceScore(post: LiveFeedPost): number {
    const now = Date.now() / 1000;
    const age = now - post.created_utc;
    const hoursSinceCreated = age / 3600;

    // Base score from upvotes and comments
    const engagementScore = post.score + (post.num_comments * 2);
    
    // Decay score based on age (newer posts get higher score)
    const ageFactor = Math.max(0.1, 1 / (1 + hoursSinceCreated * 0.1));
    
    // Boost rising and trending content
    const sourceBoost = post.source.includes('rising') ? 1.5 : 
                       post.source.includes('trending') ? 1.3 : 1.0;
    
    // Additional boost for NSFW content (if desired)
    const nsfwBoost = post.over_18 ? 1.2 : 1.0;

    return engagementScore * ageFactor * sourceBoost * nsfwBoost;
  }
}

// Export singleton instance
export const liveFeedService = new LiveFeedService();
