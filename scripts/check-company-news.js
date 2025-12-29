#!/usr/bin/env node
/**
 * Thin wrapper script for checking company news mentions
 * 
 * This script:
 * - Parses command line arguments
 * - Calls the pipeline function
 * - Prints output
 */

const { checkCompanyNewsPipeline } = require('../src/pipelines/company-news');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  const daysBack = args.includes('--days') 
    ? parseInt(args[args.indexOf('--days') + 1]) 
    : 7;
  const format = args.includes('--format') 
    ? args[args.indexOf('--format') + 1] 
    : 'markdown';
  const companiesFile = args.includes('--companies-file')
    ? args[args.indexOf('--companies-file') + 1]
    : path.join(__dirname, '..', 'context', 'companies.md');
  
  try {
    const result = await checkCompanyNewsPipeline({
      daysBack,
      format,
      companiesFile,
    });
    
    console.log(result.output);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);

