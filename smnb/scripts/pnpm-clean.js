#!/usr/bin/env node

// Direct Convex database clearing script for pnpm clean
// This runs the clearing operation directly via Convex CLI

const { execSync } = require('child_process');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

function runConvexCommand(command) {
  try {
    console.log(`🔄 Running: npx convex run ${command}`);
    const result = execSync(`npx convex run ${command}`, { 
      encoding: 'utf8',
      cwd: path.join(__dirname, '..'), // Run from smnb root directory
      stdio: 'inherit' // Show output in real-time
    });
    return true;
  } catch (error) {
    console.error(`❌ Error running command: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log(`\n🗑️ CONVEX DATABASE CLEANING`);
  console.log(`============================`);
  
  console.log(`\n📊 Step 1: Getting current database statistics...`);
  const statsSuccess = runConvexCommand('clearDatabase:getDatabaseStats');
  
  if (!statsSuccess) {
    console.error(`❌ Failed to get database stats. Make sure Convex is running and clearDatabase.ts is deployed.`);
    rl.close();
    process.exit(1);
  }
  
  console.log(`\n⚠️  WARNING: This will ERASE YOUR ENTIRE DATABASE!`);
  console.log(`🗑️ All data in your Convex database will be permanently deleted.`);
  console.log(`📊 Review the statistics above to see what will be lost.`);
  
  const userConfirmation = await askQuestion(`\n🤔 Do you wish to continue? (y/N): `);
  
  if (userConfirmation.toLowerCase() !== 'y' && userConfirmation.toLowerCase() !== 'yes') {
    console.log(`\n✅ Operation cancelled. Your database is safe.`);
    rl.close();
    return;
  }
  
  console.log(`\n🗑️ Step 2: Clearing entire database...`);
  console.log(`⚠️  Proceeding with database deletion...`);
  
  const clearSuccess = runConvexCommand('clearDatabase:clearEntireDatabase');
  
  if (clearSuccess) {
    console.log(`\n✅ Database cleaning completed successfully!`);
    console.log(`💾 Your Convex database is now completely empty.`);
    
    console.log(`\n🧹 Step 3: Clearing frontend application state...`);
    console.log(`📱 To keep frontend state in sync with empty database, you can manually clear state by:`);
    console.log(`   • Opening browser console (F12)`);
    console.log(`   • Running: window.clearAllState()`);
    console.log(`   • Or refresh the page and use the clear button in the UI`);
    console.log(`💡 This prevents old posts/stories from showing when database is empty.`);
    
  } else {
    console.error(`❌ Database cleaning failed.`);
    rl.close();
    process.exit(1);
  }
  
  rl.close();
}

if (require.main === module) {
  main().catch(error => {
    console.error(`❌ Script error:`, error);
    rl.close();
    process.exit(1);
  });
}