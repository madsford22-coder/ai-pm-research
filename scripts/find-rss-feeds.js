#!/usr/bin/env node
/**
 * Thin wrapper script for finding RSS feeds
 * 
 * This script:
 * - Parses command line arguments
 * - Calls the pipeline function
 * - Prints output
 */

const { findRSSFeedsPipeline } = require('../src/pipelines/find-rss-feeds');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  const peopleFile = args.includes('--people-file')
    ? args[args.indexOf('--people-file') + 1]
    : path.join(__dirname, '..', 'context', 'people.md');
  
  try {
    const results = await findRSSFeedsPipeline({
      peopleFile,
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('\nFound RSS Feeds:\n');
    
    // Output in markdown format for easy copy-paste
    for (const result of results) {
      console.log(`## ${result.name}`);
      console.log(`- RSS Feed: ${result.rss_feed}`);
      console.log('');
    }
    
    // Also output JSON
    console.log('\nJSON format:');
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);

