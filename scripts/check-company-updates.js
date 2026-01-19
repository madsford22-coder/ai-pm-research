#!/usr/bin/env node
/**
 * Thin wrapper script for checking company updates
 * 
 * This script:
 * - Parses command line arguments
 * - Calls the pipeline function
 * - Prints output
 */

const path = require('path');
const fs = require('fs');
const { validatePositiveInteger, validateOneOf, validateFilePath } = require('../src/utils/validation');

// Add tooling/node_modules to module path so Puppeteer can be found
// This allows the modular scripts to use Puppeteer installed in tooling/
const toolingNodeModules = path.join(__dirname, '..', 'tooling', 'node_modules');
if (fs.existsSync(toolingNodeModules)) {
  // Add to NODE_PATH so require() can find modules in tooling/node_modules
  if (!process.env.NODE_PATH) {
    process.env.NODE_PATH = toolingNodeModules;
  } else if (!process.env.NODE_PATH.includes(toolingNodeModules)) {
    process.env.NODE_PATH = toolingNodeModules + path.delimiter + process.env.NODE_PATH;
  }
  require('module')._initPaths();
}

const { checkCompanyUpdatesPipeline } = require('../src/pipelines/company-updates');

async function main() {
  const args = process.argv.slice(2);
  let daysBack = args.includes('--days') 
    ? parseInt(args[args.indexOf('--days') + 1]) 
    : 14;
  let format = args.includes('--format') 
    ? args[args.indexOf('--format') + 1] 
    : 'markdown';
  const companiesFile = args.includes('--companies-file')
    ? args[args.indexOf('--companies-file') + 1]
    : path.join(__dirname, '..', 'context', 'companies.md');
  
  // Validate inputs
  try {
    validatePositiveInteger(daysBack, 'daysBack', 1);
    validateOneOf(format, ['json', 'markdown'], 'format');
    validateFilePath(companiesFile, '.md', false); // File may not exist yet
  } catch (error) {
    console.error(`\n✗ Invalid argument: ${error.message}`);
    console.error('\nUsage:');
    console.error('  node check-company-updates.js [--days N] [--format json|markdown] [--companies-file PATH]');
    process.exit(1);
  }
  
  try {
    const result = await checkCompanyUpdatesPipeline({
      daysBack,
      format,
      companiesFile,
    });
    
    console.log(result.output);
  } catch (error) {
    console.error('\n✗ Error running company updates check:', error.message);
    if (error.message.includes('browser') || error.message.includes('launch')) {
      console.error('\nTip: If running in a sandboxed environment, ensure the script has:');
      console.error('  - Network access permissions');
      console.error('  - File system write access to temp directory');
      console.error('  - Ability to launch browser processes');
      console.error('\nSee tooling/PUPPETEER_SETUP.md for troubleshooting help.\n');
    }
    process.exit(1);
  }
}

main().catch(console.error);

