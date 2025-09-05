/**
 * Story Thread Workflow Integration
 * 
 * Complete workflow implementation that demonstrates the story threading system
 * connecting Live Feed → Host Agent → Producer → Thread Updates
 */

import { EnhancedRedditPost } from '@/lib/types/enhancedRedditPost';
import { useStoryThreadStore } from '@/lib/stores/livefeed/storyThreadStore';
import { useSimpleLiveFeedStore } from '@/lib/stores/livefeed/simpleLiveFeedStore';
import { useProducerStore } from '@/lib/stores/producer/producerStore';
import { StoryThread, StoryUpdate } from '@/lib/types/storyThread';

export interface WorkflowResult {
  success: boolean;
  threadId: string;
  isNewThread: boolean;
  isUpdate: boolean;
  updateType?: StoryUpdate['updateType'];
  narrationId?: string;
  error?: string;
  timeline: {
    timestamp: number;
    stage: string;
    details: string;
  }[];
}

export class StoryThreadWorkflow {
  private timeline: { timestamp: number; stage: string; details: string; }[] = [];

  /**
   * Main workflow method that processes a Reddit post through the complete story threading system
   */
  async processPostThroughWorkflow(post: EnhancedRedditPost): Promise<WorkflowResult> {
    this.timeline = [];
    this.logStage('START', `Beginning workflow for post: ${post.title.substring(0, 50)}...`);

    try {
      // Stage 1: Story Thread Detection
      const threadResult = await this.detectOrCreateThread(post);
      this.logStage('THREAD_DETECTION', `Thread result: ${threadResult.isNewThread ? 'NEW' : 'UPDATE'} (${threadResult.threadId})`);

      // Stage 2: Live Feed Processing
      const liveFeedPost = await this.processInLiveFeed(post, threadResult);
      this.logStage('LIVE_FEED', `Added to live feed with thread info: ${liveFeedPost.threadId}`);

      // Stage 3: Host Agent Processing
      const hostResult = await this.processWithHostAgent(post, threadResult);
      this.logStage('HOST_AGENT', `Host processing: ${hostResult.success ? 'SUCCESS' : 'FAILED'}`);

      // Stage 4: Producer Context Enhancement
      const producerResult = await this.enhanceWithProducer(post, threadResult);
      this.logStage('PRODUCER', `Producer enhancement: ${producerResult.success ? 'SUCCESS' : 'FAILED'}`);

      // Stage 5: Update Notifications
      await this.notifyUpdateIfNeeded(threadResult, liveFeedPost);
      this.logStage('NOTIFICATIONS', `Update notifications sent: ${threadResult.isUpdate}`);

      // Stage 6: Cleanup and Maintenance
      await this.performMaintenance();
      this.logStage('MAINTENANCE', 'Thread maintenance completed');

      const result: WorkflowResult = {
        success: true,
        threadId: threadResult.threadId,
        isNewThread: threadResult.isNewThread,
        isUpdate: threadResult.isUpdate,
        updateType: threadResult.updateType,
        narrationId: hostResult.narrationId,
        timeline: [...this.timeline]
      };

      this.logStage('COMPLETE', `Workflow completed successfully for thread ${threadResult.threadId}`);
      console.log('🏁 Story Thread Workflow completed:', result);
      
      return result;

    } catch (error) {
      this.logStage('ERROR', `Workflow failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        success: false,
        threadId: '',
        isNewThread: false,
        isUpdate: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timeline: [...this.timeline]
      };
    }
  }

  /**
   * Stage 1: Detect existing thread or create new one
   */
  private async detectOrCreateThread(post: EnhancedRedditPost): Promise<{
    threadId: string;
    isNewThread: boolean;
    isUpdate: boolean;
    updateType?: StoryUpdate['updateType'];
  }> {
    try {
      const storyThreadStore = useStoryThreadStore.getState();
      return await storyThreadStore.processPostForThreads(post);
    } catch (error) {
      console.error('❌ Thread detection failed:', error);
      throw new Error(`Thread detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stage 2: Process post in Live Feed with thread awareness
   */
  private async processInLiveFeed(
    post: EnhancedRedditPost, 
    threadResult: { threadId: string; isNewThread: boolean; isUpdate: boolean; updateType?: StoryUpdate['updateType'] }
  ) {
    try {
      const liveFeedStore = useSimpleLiveFeedStore.getState();
      const liveFeedPost = await liveFeedStore.processPostWithThreads(post);
      
      // Add to live feed
      liveFeedStore.addPost(liveFeedPost);
      
      // Mark as thread update if needed
      if (threadResult.isUpdate && threadResult.updateType) {
        const thread = useStoryThreadStore.getState().getThreadById(threadResult.threadId);
        liveFeedStore.markThreadUpdate(post.id, {
          threadId: threadResult.threadId,
          updateType: threadResult.updateType,
          threadTopic: thread?.topic || 'Unknown Topic'
        });
      }
      
      return liveFeedPost;
    } catch (error) {
      console.error('❌ Live Feed processing failed:', error);
      throw new Error(`Live Feed processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stage 3: Process with Host Agent using thread-aware processing
   */
  private async processWithHostAgent(
    post: EnhancedRedditPost,
    threadResult: { threadId: string; isNewThread: boolean; isUpdate: boolean; updateType?: StoryUpdate['updateType'] }
  ): Promise<{ success: boolean; narrationId?: string }> {
    try {
      // Get Host Agent service
      const hostAgentStore = await import('@/lib/stores/host/hostAgentStore').then(
        module => module.useHostAgentStore.getState()
      );

      if (!hostAgentStore.isActive || !hostAgentStore.hostAgent) {
        console.warn('⚠️ Host Agent not active, skipping host processing');
        return { success: false };
      }

      // Use thread-aware processing
      const hostResult = await hostAgentStore.hostAgent.processRedditPostWithThreads(post);
      
      return {
        success: true,
        narrationId: hostResult.narrationId
      };
    } catch (error) {
      console.error('❌ Host Agent processing failed:', error);
      return { success: false };
    }
  }

  /**
   * Stage 4: Enhance with Producer context (thread-aware)
   */
  private async enhanceWithProducer(
    post: EnhancedRedditPost,
    threadResult: { threadId: string; isNewThread: boolean; isUpdate: boolean; updateType?: StoryUpdate['updateType'] }
  ): Promise<{ success: boolean }> {
    try {
      const producerStore = useProducerStore.getState();
      
      if (!producerStore.isActive || !producerStore.service) {
        console.warn('⚠️ Producer not active, skipping producer enhancement');
        return { success: false };
      }

      // Request analysis for the post
      await producerStore.requestAnalysis(post);

      // Get context data for the post
      const contextData = producerStore.getContextForPost(post.id);
      
      if (contextData.length > 0) {
        // Send thread-aware context
        await producerStore.sendThreadAwareContext(
          contextData, 
          threadResult.threadId, 
          threadResult.isUpdate
        );
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Producer enhancement failed:', error);
      return { success: false };
    }
  }

  /**
   * Stage 5: Notify about updates if this is a thread update
   */
  private async notifyUpdateIfNeeded(
    threadResult: { threadId: string; isNewThread: boolean; isUpdate: boolean; updateType?: StoryUpdate['updateType'] },
    liveFeedPost: any
  ): Promise<void> {
    if (!threadResult.isUpdate) {
      return;
    }

    try {
      // Emit update event for UI components to listen to
      const event = new CustomEvent('story-thread-update', {
        detail: {
          threadId: threadResult.threadId,
          postId: liveFeedPost.id,
          updateType: threadResult.updateType,
          timestamp: Date.now()
        }
      });

      // Dispatch to any listening components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(event);
        console.log(`📢 Dispatched story thread update event for thread ${threadResult.threadId}`);
      }

      // Also emit via console for development
      console.log(`🔄 STORY UPDATE: Thread "${threadResult.threadId}" received ${threadResult.updateType} update`);
      
    } catch (error) {
      console.error('❌ Failed to notify about thread update:', error);
    }
  }

  /**
   * Stage 6: Perform maintenance on thread system
   */
  private async performMaintenance(): Promise<void> {
    try {
      const storyThreadStore = useStoryThreadStore.getState();
      
      // Clean up old threads
      storyThreadStore.cleanupOldThreads();
      
      // Update thread significance scores
      const activeThreads = storyThreadStore.getActiveThreads();
      activeThreads.forEach(thread => {
        storyThreadStore.updateThreadSignificance(thread.id);
      });

      console.log(`🧹 Performed thread maintenance on ${activeThreads.length} active threads`);
    } catch (error) {
      console.error('❌ Thread maintenance failed:', error);
    }
  }

  /**
   * Helper method to log workflow stages
   */
  private logStage(stage: string, details: string): void {
    const entry = {
      timestamp: Date.now(),
      stage,
      details
    };
    this.timeline.push(entry);
    console.log(`🧵 [${stage}] ${details}`);
  }

  /**
   * Test method that demonstrates the complete workflow with sample data
   */
  static async runTestWorkflow(): Promise<WorkflowResult> {
    console.log('🧪 Starting Story Thread Workflow Test');
    
    // Create sample Reddit post
    const samplePost: EnhancedRedditPost = {
      id: `test-post-${Date.now()}`,
      title: "Breaking: Major AI Breakthrough Announced by Tech Giant",
      author: "tech_reporter",
      subreddit: "technology",
      url: "https://reddit.com/test",
      permalink: "/r/technology/test",
      score: 1250,
      num_comments: 89,
      created_utc: Math.floor(Date.now() / 1000),
      thumbnail: "",
      selftext: "A major breakthrough in artificial intelligence has been announced today, with potential applications in healthcare, education, and autonomous systems. The research team claims this could revolutionize how AI processes natural language.",
      is_video: false,
      domain: "techcrunch.com",
      upvote_ratio: 0.95,
      over_18: false,
      source: 'reddit',
      fetch_timestamp: Date.now(),
      engagement_score: 1339,
      processing_status: 'raw'
    };

    const workflow = new StoryThreadWorkflow();
    const result = await workflow.processPostThroughWorkflow(samplePost);
    
    console.log('🧪 Test Workflow Result:', result);
    return result;
  }

  /**
   * Get workflow statistics
   */
  static getWorkflowStats() {
    const storyThreadStore = useStoryThreadStore.getState();
    const liveFeedStore = useSimpleLiveFeedStore.getState();
    const producerStore = useProducerStore.getState();

    return {
      activeThreads: storyThreadStore.getActiveThreads().length,
      archivedThreads: storyThreadStore.archivedThreads.length,
      liveFeedPosts: liveFeedStore.posts.length,
      threadPosts: liveFeedStore.posts.filter(p => p.threadId).length,
      updatePosts: liveFeedStore.posts.filter(p => p.isThreadUpdate).length,
      producerActive: producerStore.isActive,
      producerStats: producerStore.stats
    };
  }
}

// Export singleton instance for easy access
export const storyThreadWorkflow = new StoryThreadWorkflow();

// Integration helpers
export const runCompleteWorkflow = (post: EnhancedRedditPost) => 
  storyThreadWorkflow.processPostThroughWorkflow(post);

export const runTestWorkflow = () => 
  StoryThreadWorkflow.runTestWorkflow();

export const getWorkflowStats = () => 
  StoryThreadWorkflow.getWorkflowStats();