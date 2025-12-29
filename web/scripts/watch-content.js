#!/usr/bin/env node

/**
 * File watcher script to automatically trigger revalidation when content changes
 * Run this alongside the dev server: npm run dev & node scripts/watch-content.js
 */

const chokidar = require('chokidar');
const path = require('path');
const http = require('http');

const CONTENT_DIR = path.resolve(__dirname, '../../content');
const REVALIDATE_URL = 'http://localhost:3000/api/revalidate';

// Watch for changes in content directory
const watcher = chokidar.watch(CONTENT_DIR, {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
  ignoreInitial: true,
});

console.log(`👀 Watching ${CONTENT_DIR} for changes...`);
console.log(`📡 Revalidation endpoint: ${REVALIDATE_URL}\n`);

function triggerRevalidation(filePath) {
  const relativePath = path.relative(CONTENT_DIR, filePath);
  console.log(`📝 Content changed: ${relativePath}`);
  
  // Determine the URL path from file path
  let urlPath = '/';
  if (relativePath.endsWith('.md')) {
    const slug = relativePath.replace(/\.md$/, '');
    if (slug === 'index') {
      urlPath = '/';
    } else {
      urlPath = `/${slug}`;
    }
  }

  const postData = JSON.stringify({ path: urlPath });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/revalidate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log(`✅ Revalidated: ${urlPath}\n`);
      } else {
        console.error(`❌ Revalidation failed: ${res.statusCode} - ${data}\n`);
      }
    });
  });

  req.on('error', (error) => {
    console.error(`❌ Error triggering revalidation: ${error.message}\n`);
    console.log('   (Is the dev server running?)\n');
  });

  req.write(postData);
  req.end();
}

watcher
  .on('add', (filePath) => {
    console.log(`➕ New file: ${path.relative(CONTENT_DIR, filePath)}`);
    triggerRevalidation(filePath);
  })
  .on('change', (filePath) => {
    console.log(`🔄 File changed: ${path.relative(CONTENT_DIR, filePath)}`);
    triggerRevalidation(filePath);
  })
  .on('unlink', (filePath) => {
    console.log(`🗑️  File deleted: ${path.relative(CONTENT_DIR, filePath)}`);
    triggerRevalidation(filePath);
  })
  .on('error', (error) => {
    console.error(`❌ Watcher error: ${error}`);
  });

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Stopping file watcher...');
  watcher.close();
  process.exit(0);
});

