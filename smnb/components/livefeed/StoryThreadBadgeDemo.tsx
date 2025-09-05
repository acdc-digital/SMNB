/**
 * Story Thread Badge Demo Component
 * 
 * Demonstrates the different types of story thread update badges
 */

'use client';

import React, { useState } from 'react';
import { LiveFeedPost } from '@/lib/stores/livefeed/simpleLiveFeedStore';
import { PostCardAnimated } from './PostCardAnimated';

export default function StoryThreadBadgeDemo() {
  const [showBadges, setShowBadges] = useState(true);

  // Demo posts with different badge types
  const demoPosts: LiveFeedPost[] = [
    {
      id: 'demo-1',
      title: 'Major AI Breakthrough: New Neural Network Architecture Unveiled',
      author: 'tech_researcher',
      subreddit: 'MachineLearning',
      url: 'https://reddit.com/demo-1',
      permalink: '/r/MachineLearning/demo-1',
      score: 1250,
      num_comments: 89,
      created_utc: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      thumbnail: '',
      selftext: 'Researchers at Tech University have announced a breakthrough in neural network architecture that could revolutionize machine learning.',
      is_video: false,
      domain: 'arxiv.org',
      upvote_ratio: 0.95,
      over_18: false,
      source: 'reddit',
      addedAt: Date.now() - 3600000,
      batchId: 1,
      threadId: 'thread-ai-breakthrough',
      isThreadUpdate: true,
      updateType: 'new_development',
      threadTopic: 'AI • Neural Networks • Machine Learning',
      updateBadge: showBadges ? {
        isVisible: true,
        text: 'UPDATED',
        type: 'breaking',
        timestamp: Date.now()
      } : undefined
    },
    {
      id: 'demo-2', 
      title: 'Follow-up: Implementation Details of AI Breakthrough Released',
      author: 'tech_analyst',
      subreddit: 'MachineLearning',
      url: 'https://reddit.com/demo-2',
      permalink: '/r/MachineLearning/demo-2',
      score: 845,
      num_comments: 64,
      created_utc: Math.floor(Date.now() / 1000) - 1800, // 30 minutes ago
      thumbnail: '',
      selftext: 'Following the initial announcement, the research team has now released detailed implementation specifications.',
      is_video: false,
      domain: 'github.com',
      upvote_ratio: 0.92,
      over_18: false,
      source: 'reddit',
      addedAt: Date.now() - 1800000,
      batchId: 2,
      threadId: 'thread-ai-breakthrough',
      isThreadUpdate: true,
      updateType: 'follow_up',
      threadTopic: 'AI • Neural Networks • Machine Learning',
      updateBadge: showBadges ? {
        isVisible: true,
        text: 'FOLLOW-UP',
        type: 'follow_up',
        timestamp: Date.now()
      } : undefined
    },
    {
      id: 'demo-3',
      title: 'Clarification: Performance Metrics for New AI Architecture',
      author: 'research_lead',
      subreddit: 'MachineLearning',
      url: 'https://reddit.com/demo-3',
      permalink: '/r/MachineLearning/demo-3',
      score: 567,
      num_comments: 43,
      created_utc: Math.floor(Date.now() / 1000) - 900, // 15 minutes ago
      thumbnail: '',
      selftext: 'To address questions about performance, here are the detailed benchmark results for the new architecture.',
      is_video: false,
      domain: 'medium.com',
      upvote_ratio: 0.88,
      over_18: false,
      source: 'reddit',
      addedAt: Date.now() - 900000,
      batchId: 3,
      threadId: 'thread-ai-breakthrough',
      isThreadUpdate: true,
      updateType: 'clarification',
      threadTopic: 'AI • Neural Networks • Machine Learning',
      updateBadge: showBadges ? {
        isVisible: true,
        text: 'CLARIFIED',
        type: 'update',
        timestamp: Date.now()
      } : undefined
    },
    {
      id: 'demo-4',
      title: 'Correction: Updated Timeline for AI Architecture Release',
      author: 'tech_researcher',
      subreddit: 'MachineLearning',
      url: 'https://reddit.com/demo-4',
      permalink: '/r/MachineLearning/demo-4',
      score: 324,
      num_comments: 28,
      created_utc: Math.floor(Date.now() / 1000) - 300, // 5 minutes ago
      thumbnail: '',
      selftext: 'We need to correct the previously announced timeline for the public release of the code.',
      is_video: false,
      domain: 'reddit.com',
      upvote_ratio: 0.85,
      over_18: false,
      source: 'reddit',
      addedAt: Date.now() - 300000,
      batchId: 4,
      threadId: 'thread-ai-breakthrough',
      isThreadUpdate: true,
      updateType: 'correction',
      threadTopic: 'AI • Neural Networks • Machine Learning',
      updateBadge: showBadges ? {
        isVisible: true,
        text: 'CORRECTED',
        type: 'correction',
        timestamp: Date.now()
      } : undefined
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold mb-4">🏷️ Story Thread Badge Demo</h2>
        <p className="text-muted-foreground mb-6">
          This demo shows how different types of story thread updates are displayed with color-coded badges.
        </p>
        
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setShowBadges(!showBadges)}
            className={`px-4 py-2 rounded transition-colors cursor-pointer ${
              showBadges 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'bg-gray-500 hover:bg-gray-600 text-white'
            }`}
          >
            {showBadges ? 'Hide Badges' : 'Show Badges'}
          </button>
          
          <div className="text-sm text-muted-foreground">
            Toggle to see posts with and without update badges
          </div>
        </div>

        {/* Badge Type Legend */}
        <div className="bg-secondary/50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-3">Badge Types:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white">
                UPDATED
              </span>
              <span>Breaking news</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white">
                FOLLOW-UP
              </span>
              <span>Continuing story</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500 text-white">
                CLARIFIED
              </span>
              <span>Additional info</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500 text-white">
                CORRECTED
              </span>
              <span>Error correction</span>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Posts */}
      <div className="space-y-4">
        {demoPosts.map((post) => (
          <PostCardAnimated 
            key={post.id} 
            post={post} 
            isNew={false}
            reducedMotion={false}
          />
        ))}
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">📝 How It Works</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>Story threading system detects related posts using keyword and entity similarity</li>
          <li>When an update is detected, it gets classified by type (breaking, follow-up, clarification, correction)</li>
          <li>Update badges appear immediately and auto-hide after 30 seconds</li>
          <li>Thread topic is displayed showing the main themes of the story</li>
          <li>Posts maintain connection through a shared threadId</li>
        </ul>
      </div>
    </div>
  );
}