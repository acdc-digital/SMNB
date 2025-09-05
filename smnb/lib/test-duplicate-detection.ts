// TEST SCRIPT FOR DUPLICATE DETECTION
// Run this in browser console to test duplicate detection

// Test function to manually check duplicate detection
function testDuplicateDetection() {
  // Get the host agent instance from the store
  const hostStore = (window as any).useHostAgentStore?.getState?.();
  if (!hostStore?.hostAgent) {
    console.error('❌ Host agent not found - make sure it\'s running');
    return;
  }

  const hostAgent = hostStore.hostAgent;

  // Test 1: Clear cache and check stats
  console.log('🧪 TEST 1: Clear cache and check initial stats');
  hostAgent.clearDuplicateDetectionCache();
  console.log('Initial stats:', hostAgent.getDuplicateDetectionStats());

  // Test 2: Create similar news items
  const testNewsItem1 = {
    id: 'test-1',
    title: 'Nepal bans Facebook Twitter and YouTube',
    content: 'Nepal has banned major social media platforms including Facebook, Twitter, and YouTube',
    source: 'reddit' as const,
    timestamp: Date.now(),
    engagement: { likes: 100, comments: 50, shares: 25 }
  };

  const testNewsItem2 = {
    id: 'test-2', 
    title: 'Nepal blocks Facebook X and YouTube platforms',
    content: 'The government of Nepal has blocked access to Facebook, X (formerly Twitter), and YouTube',
    source: 'reddit' as const,
    timestamp: Date.now(),
    engagement: { likes: 120, comments: 60, shares: 30 }
  };

  const testNewsItem3 = {
    id: 'test-3',
    title: 'Completely different story about weather',
    content: 'Today was sunny with clear skies across the region',
    source: 'reddit' as const,
    timestamp: Date.now(),
    engagement: { likes: 50, comments: 20, shares: 10 }
  };

  // Test processing
  console.log('🧪 TEST 2: Processing first item (should be unique)');
  hostAgent.processNewsItem(testNewsItem1).catch(console.error);

  setTimeout(() => {
    console.log('🧪 TEST 3: Processing duplicate item (should be detected)');
    hostAgent.processNewsItem(testNewsItem2).catch(console.error);

    setTimeout(() => {
      console.log('🧪 TEST 4: Processing unique item (should be allowed)');
      hostAgent.processNewsItem(testNewsItem3).catch(console.error);

      setTimeout(() => {
        console.log('Final stats:', hostAgent.getDuplicateDetectionStats());
      }, 1000);
    }, 1000);
  }, 1000);
}

// Export for browser console use
if (typeof window !== 'undefined') {
  (window as any).testDuplicateDetection = testDuplicateDetection;
  console.log('🧪 Duplicate detection test loaded! Run: testDuplicateDetection()');
}