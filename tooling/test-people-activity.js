#!/usr/bin/env node
/**
 * Test script to check activity for a few specific people
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test on a few people with different configurations
const testPeople = [
  'Lenny Rachitsky',      // Has RSS feed, very active
  'Marty Cagan',          // Has RSS feed, active
  'Shreyas Doshi',        // Has RSS feed, Twitter
  'Ravi Mehta',           // Blog only, no RSS
  'Amjad Masad',          // Twitter only
];

// Read the main script and modify to only check these people
const mainScript = fs.readFileSync(path.join(__dirname, 'check-people-activity.js'), 'utf-8');

// Create a test version that filters people
const testScript = mainScript.replace(
  /const people = parsePeopleFile\(\);/,
  `const allPeople = parsePeopleFile();
  const testPeople = ${JSON.stringify(testPeople)};
  const people = allPeople.filter(p => testPeople.includes(p.name));`
);

const testScriptPath = path.join(__dirname, 'test-people-activity-temp.js');
fs.writeFileSync(testScriptPath, testScript);

console.log(`Testing activity check on ${testPeople.length} people:\n${testPeople.join(', ')}\n`);

try {
  execSync(`node ${testScriptPath} --days 30 --format markdown`, {
    stdio: 'inherit',
    cwd: __dirname
  });
} finally {
  // Clean up
  if (fs.existsSync(testScriptPath)) {
    fs.unlinkSync(testScriptPath);
  }
}

