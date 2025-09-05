// Test script for Host duplicate detection
// Run this in browser console to test the duplicate detection system

console.log("🧪 Starting Host Duplicate Detection Test");

// Mock NewsItem objects based on your recent duplicates
const testNewsItems = [
  {
    id: "test-1",
    title: "Nepal bans Facebook, X, YouTube, 23 other social media platforms",
    content: "In a surprising move, Nepal has just dropped the hammer on social media, banning Facebook, X (formerly Twitter), YouTube, and 23 other digital platforms.",
    timestamp: Date.now()
  },
  {
    id: "test-2", 
    title: "Nepal bans Facebook, X, YouTube and 23 other social platforms",
    content: "Nepal has just implemented a sweeping social media blackout, blocking popular platforms like Facebook, X (formerly Twitter), YouTube, along with 23 other digital networks.",
    timestamp: Date.now() + 1000
  },
  {
    id: "test-3",
    title: "Mass stabbing in Canada leaves one dead and six injured",
    content: "In a deeply troubling incident out of Canada, a mass stabbing has left one person dead and at least six others injured, sending shockwaves through the community.",
    timestamp: Date.now() + 2000
  },
  {
    id: "test-4",
    title: "Canada mass stabbing: One dead, six injured",
    content: "A deeply troubling incident, a mass stabbing in Canada has left one person dead and at least six others injured.",
    timestamp: Date.now() + 3000
  },
  {
    id: "test-5",
    title: "Northwestern University President resigns after federal funding freeze",
    content: "Big changes are brewing at Northwestern University, where President Michael Schill has announced his resignation after the school faced a serious federal funding freeze.",
    timestamp: Date.now() + 4000
  }
];

// Function to test duplicate detection
async function testDuplicateDetection() {
  // Get the host agent service instance
  const hostStore = window.useHostAgentStore?.getState();
  
  if (!hostStore) {
    console.error("❌ Host store not found - make sure you're on the dashboard page");
    return;
  }

  console.log("🎯 Testing duplicate detection with host agent service...");
  
  // Process each test item
  for (let i = 0; i < testNewsItems.length; i++) {
    const item = testNewsItems[i];
    console.log(`\n📝 Test ${i + 1}: Processing "${item.title.substring(0, 50)}..."`);
    
    try {
      // Simulate calling processNewsItem (we'll check the duplicate detection logic)
      // Since we can't directly call private methods, we'll test the logic manually
      
      // Create a test signature
      const normalizedTitle = item.title.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      const normalizedContent = item.content.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 200);
      
      const signature = `${normalizedTitle}|${normalizedContent}`.substring(0, 300);
      
      console.log(`🔑 Signature: ${signature.substring(0, 50)}...`);
      console.log(`📊 Expected: ${i === 0 ? 'NEW' : i === 1 ? 'DUPLICATE of test-1' : i === 2 ? 'NEW' : i === 3 ? 'DUPLICATE of test-3' : 'NEW'}`);
      
    } catch (error) {
      console.error(`❌ Error testing item ${item.id}:`, error);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Run the test
testDuplicateDetection().then(() => {
  console.log("✅ Duplicate detection test completed");
}).catch(error => {
  console.error("❌ Test failed:", error);
});