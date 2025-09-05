// TEST DATA GENERATOR
// /Users/matthewsimon/Projects/SMNB/smnb/lib/services/testDataGenerator.ts

/**
 * Test Data Generator
 * 
 * Generates mock Reddit posts for testing the processing pipeline
 * when Reddit API is unavailable or rate-limited.
 */

import { RedditPost } from '@/lib/reddit';

export interface MockRedditPost extends RedditPost {
  mock: true;
}

export const MOCK_POSTS: MockRedditPost[] = [
  {
    id: 'mock_1',
    title: 'Breaking: Scientists Develop Revolutionary Solar Panel Technology',
    author: 'tech_reporter',
    subreddit: 'technology',
    url: 'https://example.com/solar-breakthrough',
    permalink: '/r/technology/comments/mock_1/breaking_scientists_develop/',
    score: 1250,
    num_comments: 89,
    created_utc: Date.now() / 1000 - 3600, // 1 hour ago
    thumbnail: 'https://picsum.photos/200/150?random=1',
    selftext: 'Researchers at MIT have announced a breakthrough in solar panel efficiency, achieving 45% energy conversion rates in laboratory conditions.',
    is_video: false,
    domain: 'example.com',
    upvote_ratio: 0.95,
    over_18: false,
    mock: true
  },
  {
    id: 'mock_2',
    title: 'AI Model Achieves Human-Level Performance in Complex Reasoning Tasks',
    author: 'ai_researcher',
    subreddit: 'artificial',
    url: 'https://example.com/ai-reasoning',
    permalink: '/r/artificial/comments/mock_2/ai_model_achieves_human/',
    score: 2100,
    num_comments: 156,
    created_utc: Date.now() / 1000 - 1800, // 30 minutes ago
    thumbnail: 'https://picsum.photos/200/150?random=2',
    selftext: 'A new AI model developed by DeepMind has demonstrated unprecedented performance in logical reasoning and problem-solving tasks.',
    is_video: false,
    domain: 'example.com',
    upvote_ratio: 0.92,
    over_18: false,
    mock: true
  },
  {
    id: 'mock_3',
    title: 'Major Climate Agreement Reached at International Summit',
    author: 'climate_news',
    subreddit: 'worldnews',
    url: 'https://example.com/climate-agreement',
    permalink: '/r/worldnews/comments/mock_3/major_climate_agreement/',
    score: 5600,
    num_comments: 423,
    created_utc: Date.now() / 1000 - 7200, // 2 hours ago
    thumbnail: 'https://picsum.photos/200/150?random=3',
    selftext: 'World leaders have signed a historic agreement to accelerate renewable energy adoption and reduce carbon emissions by 50% by 2030.',
    is_video: false,
    domain: 'example.com',
    upvote_ratio: 0.89,
    over_18: false,
    mock: true
  },
  {
    id: 'mock_4',
    title: 'Cryptocurrency Market Sees Unprecedented Surge Following Regulatory Clarity',
    author: 'crypto_analyst',
    subreddit: 'cryptocurrency',
    url: 'https://example.com/crypto-surge',
    permalink: '/r/cryptocurrency/comments/mock_4/cryptocurrency_market_sees/',
    score: 892,
    num_comments: 234,
    created_utc: Date.now() / 1000 - 900, // 15 minutes ago
    thumbnail: 'https://picsum.photos/200/150?random=4',
    selftext: 'Bitcoin and Ethereum have reached new all-time highs following the announcement of clear regulatory frameworks in major economies.',
    is_video: false,
    domain: 'example.com',
    upvote_ratio: 0.78,
    over_18: false,
    mock: true
  },
  {
    id: 'mock_5',
    title: 'Medical Breakthrough: Gene Therapy Shows Promise for Treating Alzheimer\'s',
    author: 'med_research',
    subreddit: 'science',
    url: 'https://example.com/gene-therapy',
    permalink: '/r/science/comments/mock_5/medical_breakthrough_gene/',
    score: 3400,
    num_comments: 198,
    created_utc: Date.now() / 1000 - 5400, // 1.5 hours ago
    thumbnail: 'https://picsum.photos/200/150?random=5',
    selftext: 'Clinical trials of a new gene therapy treatment have shown significant improvement in cognitive function for early-stage Alzheimer\'s patients.',
    is_video: false,
    domain: 'example.com',
    upvote_ratio: 0.94,
    over_18: false,
    mock: true
  }
];

export class TestDataGenerator {
  static generateMockPosts(count: number = 5): MockRedditPost[] {
    return MOCK_POSTS.slice(0, count).map(post => ({
      ...post,
      id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_utc: Date.now() / 1000 - Math.random() * 7200, // Random time in last 2 hours
      score: Math.floor(Math.random() * 5000) + 100,
      num_comments: Math.floor(Math.random() * 500) + 10
    }));
  }

  static generateSingleMockPost(): MockRedditPost {
    const templates = MOCK_POSTS;
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    return {
      ...template,
      id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_utc: Date.now() / 1000 - Math.random() * 1800, // Random time in last 30 minutes
      score: Math.floor(Math.random() * 3000) + 50,
      num_comments: Math.floor(Math.random() * 200) + 5
    };
  }

  static injectMockData(liveFeedStore: any): void {
    const mockPosts = this.generateMockPosts(3);
    console.log('🧪 Injecting mock test data:', mockPosts.length, 'posts');
    
    mockPosts.forEach(post => {
      liveFeedStore.addPost(post);
    });
  }
}