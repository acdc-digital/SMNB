# SMNB Console Scripts

This folder contains browser console helper scripts for testing and debugging the SMNB system.

## 📁 Available Scripts

### 🗑️ `clear-convex-database.js`
**Purpose**: Complete Convex database clearing script with safety instructions

**⚠️ DESTRUCTIVE OPERATION**: This script will DELETE ALL DATA from your Convex database!

**Setup Steps**:
1. The clearDatabase.ts file is already created in `/convex/clearDatabase.ts`
2. Deploy it to Convex: `pnpm dev:convex` (or `npx convex dev`)
3. Wait for the functions to deploy
4. Run the cleaning commands

**Quick Usage**:
```bash
# Check what data exists first
pnpm clean:stats

# Clear everything (after confirming you want to delete all data)
pnpm clean
```

**Usage**:
1. The script provides TypeScript code to create `/convex/clearDatabase.ts`
2. Deploy the Convex functions to your database
3. Run via Convex dashboard or CLI
4. **REMOVE the clearDatabase.ts file after use**

**Available Functions**:
- `getDatabaseStats()` - Check current data (run this FIRST)
- `clearEntireDatabase()` - Delete everything (nuclear option)
- `clearSpecificTables(tables)` - Delete only specific tables
- `clearLargestTables()` - Clear just the biggest tables (posts & tokens)

**CLI Usage**:
```bash
# Via pnpm (recommended)
pnpm clean               # Clear entire database
pnpm clean:stats         # Show database statistics  
pnpm clean:largest       # Clear largest tables only
pnpm clean:tables        # Interactive table selection

# Via Convex CLI directly
npx convex run clearDatabase:getDatabaseStats
npx convex run clearDatabase:clearEntireDatabase
npx convex run clearDatabase:clearSpecificTables '{"tables": ["live_feed_posts"]}'

# Via Node scripts
node scripts/run-clear-database.js stats
node scripts/run-clear-database.js clear
```

**Tables Available for Clearing**:
- `token_usage` - All token tracking data
- `live_feed_posts` - All Reddit posts  
- `editor_documents` - All editor content
- `host_sessions` - All host sessions
- `host_documents` - All host-generated content
- `story_history` - All completed stories

**⚠️ SAFETY NOTES**:
- Always run `getDatabaseStats()` first to see what will be deleted
- Backup important data before clearing
- Operation is irreversible
- Remove clearDatabase.ts after use

### 🧪 `console-duplicate-test.js`
**Purpose**: Test the Host agent's duplicate detection system

**Usage**:
1. Open the SMNB dashboard in your browser
2. Open browser developer tools (F12)
3. Copy and paste the content of this file into the console
4. Use the available functions:

```javascript
// Test if a title would be detected as duplicate
testHostDuplicate("Nepal bans Facebook, X, YouTube, 23 other social media platforms");

// Test with custom content
testHostDuplicate("Nepal bans social media", "Nepal has banned multiple platforms");

// Show current cache statistics
showHostDuplicateStats();

// Clear the duplicate detection cache
clearHostDuplicateCache();
```

**Functions Available**:
- `testHostDuplicate(title, content?)` - Test duplicate detection
- `showHostDuplicateStats()` - Display cache statistics  
- `clearHostDuplicateCache()` - Reset the duplicate cache

### 🧪 `test-host-duplicate-detection.js`
**Purpose**: Comprehensive test suite for Host duplicate detection with predefined test cases

**Usage**:
1. Open the SMNB dashboard in your browser
2. Open browser developer tools (F12)
3. Copy and paste the content of this file into the console
4. The test will automatically run with predefined test cases

**Test Cases Included**:
- Nepal social media ban variations (should detect as duplicates)
- Canada mass stabbing variations (should detect as duplicates)  
- Northwestern University news (unique story)

**Features**:
- Automatic execution of multiple test scenarios
- Expected vs actual result logging
- Signature generation and comparison testing
- Async processing with delays between tests

### ⏱️ `console-host-timing.js`
**Purpose**: Adjust Host agent narration timing and speed

**Usage**:
1. Open the SMNB dashboard in your browser
2. Open browser developer tools (F12)
3. Copy and paste the content of this file into the console
4. Use the timing presets:

```javascript
// Apply different timing presets
hostTiming.fast();          // ~400 WPM, fast pacing
hostTiming.normal();        // ~250 WPM, standard pacing
hostTiming.professional();  // 314 WPM, professional news delivery ⭐
hostTiming.slow();          // ~200 WPM, slower pacing
hostTiming.deliberate();    // ~133 WPM, very slow pacing

// Show current timing configuration
hostTiming.showCurrentTiming();

// Apply custom timing
hostTiming.custom({
  CHARACTER_STREAMING_DELAY_MS: 38,    // 314 WPM professional speed
  NARRATION_COOLDOWN_MS: 4000,         // 4 seconds between narrations
  PRE_NARRATION_DELAY_MS: 1000         // 1 second pause before starting
});
```

**Recommended**: Use `hostTiming.professional()` for optimal 314 WPM delivery speed.

## 🎯 Usage Instructions

### General Steps:
1. **Navigate** to the SMNB dashboard in your browser
2. **Ensure** the Host agent is active and running
3. **Open** Developer Tools (`F12` or `Cmd+Option+I`)
4. **Switch** to the Console tab
5. **Copy** the entire contents of the desired script file
6. **Paste** into the console and press Enter
7. **Use** the available functions as documented above

### Notes:
- These scripts access global window objects (`window.useHostAgentStore`)
- They must be run on the dashboard page where the Host agent is active
- Scripts will show error messages if the Host service is not available
- Functions are attached to the global window object for easy access

## 🔧 Development Notes

These console scripts are designed for:
- **Testing**: Validate Host agent behavior during development
- **Debugging**: Inspect internal state and cache statistics
- **Tuning**: Adjust timing parameters for optimal performance
- **Monitoring**: Track duplicate detection effectiveness

The scripts are self-contained and don't require any imports or build steps - they're meant to be copy-pasted directly into browser console for immediate use.

## 📊 Example Workflow

### Quick Testing Workflow:
```javascript
// 1. Load interactive duplicate testing tools
// (paste console-duplicate-test.js)
showHostDuplicateStats();
testHostDuplicate("Test headline for duplicate detection");

// 2. Run comprehensive test suite
// (paste test-host-duplicate-detection.js) 
// Automatically runs with predefined test cases

// 3. Adjust timing for optimal performance
// (paste console-host-timing.js)
hostTiming.professional(); // Set to 314 WPM
```

### Full Development Testing:
```javascript
// 1. Load timing controls and set professional speed
// (paste console-host-timing.js)
hostTiming.professional();

// 2. Run comprehensive duplicate detection test suite
// (paste test-host-duplicate-detection.js)
// Watch console for automatic test results

// 3. Use interactive tools for custom testing  
// (paste console-duplicate-test.js)
showHostDuplicateStats();

// Test specific scenarios
testHostDuplicate("Breaking: Major earthquake hits region");
testHostDuplicate("Major earthquake strikes region"); // Should detect as duplicate

// 4. Monitor and adjust as needed
hostTiming.showCurrentTiming();
clearHostDuplicateCache(); // Reset for clean testing
```

---

*Last Updated: September 5, 2025*  
*Part of the SMNB Dashboard Development Tools*