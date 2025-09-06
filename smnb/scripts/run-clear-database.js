#!/usr/bin/env node

// CLI script to clear Convex database
// Usage: node scripts/run-clear-database.js [command]
//
// Commands:
//   stats    - Show database statistics
//   clear    - Clear entire database (with confirmation)
//   tables   - Clear specific tables
//   largest  - Clear largest tables only

const { execSync } = require('child_process');
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
      cwd: process.cwd()
    });
    console.log(result);
    return true;
  } catch (error) {
    console.error(`❌ Error running command: ${error.message}`);
    return false;
  }
}

async function showStats() {
  console.log(`📊 Getting database statistics...`);
  return runConvexCommand('clearDatabase:getDatabaseStats');
}

async function clearEntireDatabase() {
  console.log(`\n🚨 DANGER: You are about to DELETE ALL DATA from your Convex database!`);
  console.log(`⚠️  This operation is IRREVERSIBLE!`);
  
  const confirm1 = await askQuestion(`\nType "DELETE ALL DATA" to confirm: `);
  if (confirm1 !== "DELETE ALL DATA") {
    console.log(`❌ Confirmation failed. Operation cancelled.`);
    return false;
  }
  
  const confirm2 = await askQuestion(`\nAre you absolutely sure? Type "YES" to proceed: `);
  if (confirm2 !== "YES") {
    console.log(`❌ Final confirmation failed. Operation cancelled.`);
    return false;
  }
  
  console.log(`\n🗑️ Proceeding with complete database deletion...`);
  return runConvexCommand('clearDatabase:clearEntireDatabase');
}

async function clearSpecificTables() {
  console.log(`\n📋 Available tables:`);
  console.log(`- token_usage`);
  console.log(`- live_feed_posts`);
  console.log(`- editor_documents`);
  console.log(`- host_sessions`);
  console.log(`- host_documents`);
  console.log(`- story_history`);
  
  const tables = await askQuestion(`\nEnter table names (comma-separated): `);
  const tableArray = tables.split(',').map(t => t.trim()).filter(t => t);
  
  if (tableArray.length === 0) {
    console.log(`❌ No tables specified. Operation cancelled.`);
    return false;
  }
  
  console.log(`\n⚠️  You are about to delete ALL DATA from: ${tableArray.join(', ')}`);
  const confirm = await askQuestion(`Type "CONFIRM" to proceed: `);
  
  if (confirm !== "CONFIRM") {
    console.log(`❌ Confirmation failed. Operation cancelled.`);
    return false;
  }
  
  const tablesJson = JSON.stringify({ tables: tableArray });
  return runConvexCommand(`clearDatabase:clearSpecificTables '${tablesJson}'`);
}

async function clearLargestTables() {
  console.log(`\n🎯 This will clear the largest tables: live_feed_posts and token_usage`);
  const confirm = await askQuestion(`Type "CONFIRM" to proceed: `);
  
  if (confirm !== "CONFIRM") {
    console.log(`❌ Confirmation failed. Operation cancelled.`);
    return false;
  }
  
  return runConvexCommand('clearDatabase:clearLargestTables');
}

async function main() {
  const command = process.argv[2] || 'help';
  
  console.log(`\n🗑️ CONVEX DATABASE CLEARING TOOL`);
  console.log(`================================`);
  
  switch (command) {
    case 'stats':
      await showStats();
      break;
      
    case 'clear':
      await clearEntireDatabase();
      break;
      
    case 'tables':
      await clearSpecificTables();
      break;
      
    case 'largest':
      await clearLargestTables();
      break;
      
    case 'help':
    default:
      console.log(`\n📋 Available commands:`);
      console.log(`  stats    - Show database statistics`);
      console.log(`  clear    - Clear entire database (with confirmation)`);
      console.log(`  tables   - Clear specific tables`);
      console.log(`  largest  - Clear largest tables only`);
      console.log(`\n🔧 Usage:`);
      console.log(`  node scripts/run-clear-database.js stats`);
      console.log(`  node scripts/run-clear-database.js clear`);
      console.log(`  node scripts/run-clear-database.js tables`);
      console.log(`  node scripts/run-clear-database.js largest`);
      console.log(`\n⚠️  Make sure you have the clearDatabase.ts file deployed to Convex first!`);
      break;
  }
  
  rl.close();
}

main().catch(error => {
  console.error(`❌ Script error:`, error);
  rl.close();
  process.exit(1);
});