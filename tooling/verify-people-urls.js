#!/usr/bin/env node
/**
 * Verify and clean up people.md file
 * - Check for duplicate people
 * - Verify URLs (blogs, RSS feeds, LinkedIn, Twitter)
 * - Report broken or invalid URLs
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { URL } = require('url');

const PROJECT_ROOT = path.join(__dirname, '..');
const PEOPLE_FILE = path.join(PROJECT_ROOT, 'context', 'people.md');

function parsePeopleFile() {
  const content = fs.readFileSync(PEOPLE_FILE, 'utf-8');
  const people = [];
  
  const sections = content.split(/\n## /);
  
  for (const section of sections.slice(1)) {
    const lines = section.split('\n');
    const name = lines[0].trim();
    
    const person = {
      name,
      blog: null,
      rss_feed: null,
      linkedin: null,
      twitter: null,
      section: section,
      lineNumber: content.indexOf(`## ${name}`) + 1,
    };
    
    for (const line of lines) {
      if (line.includes('Blog:') || line.includes('blog:')) {
        const match = line.match(/https?:\/\/[^\s\)]+/);
        if (match) {
          person.blog = match[0];
        }
      }
      if (line.includes('RSS Feed:') || line.includes('rss feed:') || line.includes('RSS:')) {
        const match = line.match(/https?:\/\/[^\s\)]+/);
        if (match) {
          person.rss_feed = match[0].replace(/\)$/, '').replace(/,$/, '');
        }
      }
      if (line.includes('LinkedIn:')) {
        const match = line.match(/https?:\/\/[^\s\)]+/);
        if (match) {
          person.linkedin = match[0].replace(/\)$/, '').replace(/,$/, '');
        }
      }
      if (line.includes('Twitter/X:') || line.includes('Twitter:')) {
        const match = line.match(/@[\w]+/);
        if (match) {
          person.twitter = match[0].replace('@', '');
        }
      }
    }
    
    people.push(person);
  }
  
  return people;
}

async function checkURL(page, url, type) {
  try {
    const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
    const status = response.status();
    
    if (status >= 200 && status < 400) {
      return { valid: true, status, error: null };
    } else {
      return { valid: false, status, error: `HTTP ${status}` };
    }
  } catch (error) {
    // Check if it's a navigation error or timeout
    if (error.message.includes('net::ERR') || error.message.includes('Navigation timeout')) {
      return { valid: false, status: null, error: error.message };
    }
    return { valid: false, status: null, error: error.message };
  }
}

async function verifyPersonURLs(browser, person) {
  const results = {
    name: person.name,
    blog: null,
    rss_feed: null,
    linkedin: null,
    twitter: null,
    errors: [],
  };
  
  const page = await browser.newPage();
  
  try {
    if (person.blog) {
      const result = await checkURL(page, person.blog, 'blog');
      results.blog = result;
      if (!result.valid) {
        results.errors.push(`Blog URL invalid: ${person.blog} - ${result.error}`);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (person.rss_feed) {
      const result = await checkURL(page, person.rss_feed, 'RSS');
      results.rss_feed = result;
      if (!result.valid) {
        results.errors.push(`RSS feed invalid: ${person.rss_feed} - ${result.error}`);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (person.linkedin) {
      const result = await checkURL(page, person.linkedin, 'LinkedIn');
      results.linkedin = result;
      if (!result.valid) {
        results.errors.push(`LinkedIn URL invalid: ${person.linkedin} - ${result.error}`);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Twitter URLs don't need checking - we just need the handle
    if (person.twitter) {
      results.twitter = { valid: true, note: 'Handle only, no URL check needed' };
    }
    
  } catch (error) {
    results.errors.push(`Error checking ${person.name}: ${error.message}`);
  } finally {
    await page.close();
  }
  
  return results;
}

function findDuplicates(people) {
  const nameMap = new Map();
  const duplicates = [];
  
  for (const person of people) {
    const normalizedName = person.name.toLowerCase().trim();
    if (nameMap.has(normalizedName)) {
      duplicates.push({
        name: person.name,
        original: nameMap.get(normalizedName),
        duplicate: person,
      });
    } else {
      nameMap.set(normalizedName, person);
    }
  }
  
  return duplicates;
}

async function main() {
  console.log('Analyzing people.md file...\n');
  
  const people = parsePeopleFile();
  console.log(`Found ${people.length} people\n`);
  
  // Check for duplicates
  console.log('Checking for duplicates...');
  const duplicates = findDuplicates(people);
  if (duplicates.length > 0) {
    console.log(`\n⚠️  Found ${duplicates.length} duplicate(s):\n`);
    for (const dup of duplicates) {
      console.log(`  - "${dup.name}" appears multiple times`);
      console.log(`    First occurrence: Line ${dup.original.lineNumber}`);
      console.log(`    Duplicate: Line ${dup.duplicate.lineNumber}`);
    }
  } else {
    console.log('✓ No duplicates found\n');
  }
  
  // Verify URLs
  console.log('\nVerifying URLs (this may take a while)...\n');
  
  const userDataDir = path.join(os.tmpdir(), 'puppeteer-verify-urls-' + Date.now());
  const browser = await puppeteer.launch({
    headless: true,
    userDataDir: userDataDir,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-software-rasterizer',
      '--disable-gpu',
      '--disable-crash-reporter',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-component-extensions-with-background-pages',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection',
      '--no-first-run',
      '--no-default-browser-check',
      '--no-pings',
      '--no-zygote',
    ]
  });
  
  const verificationResults = [];
  let checked = 0;
  
  for (const person of people) {
    checked++;
    console.log(`[${checked}/${people.length}] Checking ${person.name}...`);
    const result = await verifyPersonURLs(browser, person);
    verificationResults.push(result);
    
    if (result.errors.length > 0) {
      console.log(`  ⚠️  Issues found:`);
      for (const error of result.errors) {
        console.log(`    - ${error}`);
      }
    }
  }
  
  await browser.close();
  
  // Clean up
  try {
    if (fs.existsSync(userDataDir)) {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  } catch (e) {}
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('\nSUMMARY\n');
  
  const peopleWithErrors = verificationResults.filter(r => r.errors.length > 0);
  const invalidBlogs = verificationResults.filter(r => r.blog && !r.blog.valid);
  const invalidRSS = verificationResults.filter(r => r.rss_feed && !r.rss_feed.valid);
  const invalidLinkedIn = verificationResults.filter(r => r.linkedin && !r.linkedin.valid);
  
  console.log(`Total people: ${people.length}`);
  console.log(`Duplicates: ${duplicates.length}`);
  console.log(`People with URL errors: ${peopleWithErrors.length}`);
  console.log(`Invalid blog URLs: ${invalidBlogs.length}`);
  console.log(`Invalid RSS feed URLs: ${invalidRSS.length}`);
  console.log(`Invalid LinkedIn URLs: ${invalidLinkedIn.length}`);
  
  if (peopleWithErrors.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('\nPEOPLE WITH INVALID URLS:\n');
    for (const result of peopleWithErrors) {
      console.log(`\n${result.name}:`);
      for (const error of result.errors) {
        console.log(`  - ${error}`);
      }
    }
  }
  
  if (duplicates.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('\nDUPLICATE ENTRIES TO REMOVE:\n');
    for (const dup of duplicates) {
      console.log(`\n"${dup.name}" - Remove entry at line ${dup.duplicate.lineNumber}`);
    }
  }
  
  // Output JSON for programmatic use
  console.log('\n' + '='.repeat(80));
  console.log('\nJSON Report:\n');
  console.log(JSON.stringify({
    duplicates,
    invalid_urls: peopleWithErrors.map(r => ({
      name: r.name,
      errors: r.errors,
    })),
  }, null, 2));
}

main().catch(console.error);

