// Console helper for testing Host duplicate detection
// Copy and paste this into the browser console on the dashboard page

window.testHostDuplicate = function(title, content = "") {
  try {
    // Get the host service from the store
    const hostStore = window.useHostAgentStore?.getState();
    const hostService = hostStore?.service;
    
    if (!hostService) {
      console.error("❌ Host service not found. Make sure you're on the dashboard and the host agent is available.");
      return null;
    }

    // Create a test NewsItem
    const testItem = {
      id: `test-${Date.now()}`,
      title: title,
      content: content || title, // Use title as content if no content provided
      timestamp: Date.now()
    };

    console.log(`\n🧪 TESTING HOST DUPLICATE DETECTION`);
    console.log(`📰 Title: "${title}"`);
    console.log(`📝 Content: "${(content || title).substring(0, 50)}..."`);
    
    // Test the duplicate detection
    const result = hostService.testDuplicateDetection(testItem);
    
    console.log(`\n📊 RESULT:`);
    console.log(`❓ Is Duplicate: ${result.isDuplicate ? '🚫 YES' : '✅ NO'}`);
    console.log(`🔑 Signature: ${result.signature.substring(0, 20)}...`);
    console.log(`💭 Reason: ${result.reason}`);
    
    // Show cache stats
    const stats = hostService.getDuplicateDetectionStats();
    console.log(`\n📈 CACHE STATS:`);
    console.log(`🔍 Signatures: ${stats.processedSignatures}`);
    console.log(`📰 Titles: ${stats.titleCache}`);
    console.log(`🏷️ Hashes: ${stats.contentHashes}`);
    console.log(`🎙️ Narrations: ${stats.narrationCache}`);
    console.log(`🧵 Threads: ${stats.threadUpdateCounts}`);
    
    return result;
    
  } catch (error) {
    console.error("❌ Error testing duplicate detection:", error);
    return null;
  }
};

window.clearHostDuplicateCache = function() {
  try {
    const hostStore = window.useHostAgentStore?.getState();
    const hostService = hostStore?.service;
    
    if (!hostService) {
      console.error("❌ Host service not found");
      return;
    }
    
    hostService.clearDuplicateDetectionCache();
    console.log("🧹 Host duplicate cache cleared");
    
  } catch (error) {
    console.error("❌ Error clearing cache:", error);
  }
};

window.showHostDuplicateStats = function() {
  try {
    const hostStore = window.useHostAgentStore?.getState();
    const hostService = hostStore?.service;
    
    if (!hostService) {
      console.error("❌ Host service not found");
      return;
    }
    
    const stats = hostService.getDuplicateDetectionStats();
    console.log(`📈 HOST DUPLICATE DETECTION STATS:`);
    console.log(`🔍 Processed Signatures: ${stats.processedSignatures}`);
    console.log(`📰 Title Cache: ${stats.titleCache}`);
    console.log(`🏷️ Content Hashes: ${stats.contentHashes}`);
    console.log(`🎙️ Narration Cache: ${stats.narrationCache}`);
    console.log(`🧵 Thread Updates: ${stats.threadUpdateCounts}`);
    
    return stats;
    
  } catch (error) {
    console.error("❌ Error getting stats:", error);
  }
};

console.log(`
🧪 HOST DUPLICATE DETECTION TEST HELPERS LOADED
================================================

Available functions:
📰 testHostDuplicate(title, content?) - Test if title/content would be detected as duplicate
🧹 clearHostDuplicateCache() - Clear the duplicate detection cache  
📊 showHostDuplicateStats() - Show current cache statistics

Example usage:
testHostDuplicate("Nepal bans Facebook, X, YouTube, 23 other social media platforms");
testHostDuplicate("Nepal bans social media platforms", "Nepal has banned multiple social media platforms");
showHostDuplicateStats();

Test with your actual duplicate stories:
testHostDuplicate("Nepal bans Facebook, X, YouTube, 23 other social media platforms");
testHostDuplicate("Nepal bans Facebook, X, YouTube and 23 other social platforms");
testHostDuplicate("Mass stabbing in Canada leaves one dead and six injured");
testHostDuplicate("Canada mass stabbing: One dead, six injured");
`);