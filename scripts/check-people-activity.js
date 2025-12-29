#!/usr/bin/env node
/**
 * Thin wrapper script for checking people activity
 * 
 * This script:
 * - Parses command line arguments
 * - Calls the pipeline function
 * - Prints output
 */

const { checkPeopleActivityPipeline } = require('../src/pipelines/people-activity');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  const daysBack = args.includes('--days') 
    ? parseInt(args[args.indexOf('--days') + 1]) 
    : 30;
  const format = args.includes('--format') 
    ? args[args.indexOf('--format') + 1] 
    : 'markdown';
  const peopleFile = args.includes('--people-file')
    ? args[args.indexOf('--people-file') + 1]
    : path.join(__dirname, '..', 'context', 'people.md');
  
  try {
    const result = await checkPeopleActivityPipeline({
      daysBack,
      format,
      peopleFile,
    });
    
    console.log(result.output);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);

