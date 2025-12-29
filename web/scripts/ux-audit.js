const puppeteer = require('puppeteer');
const path = require('path');
const os = require('os');

const BASE_URL = 'http://localhost:3000';
const ISSUES = [];

function logIssue(severity, category, issue, suggestion = '') {
  ISSUES.push({ severity, category, issue, suggestion });
  const icon = severity === 'high' ? '🔴' : severity === 'medium' ? '🟡' : '🟢';
  console.log(`${icon} [${severity.toUpperCase()}] ${category}: ${issue}`);
  if (suggestion) {
    console.log(`   💡 Suggestion: ${suggestion}`);
  }
}

async function takeScreenshot(page, name) {
  try {
    await page.screenshot({ 
      path: path.join(__dirname, `../screenshots/${name}.png`),
      fullPage: true 
    });
  } catch (e) {
    // Screenshot directory might not exist, that's okay
  }
}

async function testHomepage(page) {
  console.log('\n📄 Testing Homepage...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 10000 });
  await page.waitForTimeout(2000); // Wait for content to load

  // Check for loading states
  const loadingSpinner = await page.$('.animate-spin');
  if (loadingSpinner) {
    logIssue('medium', 'Performance', 'Loading spinner visible on homepage', 'Consider showing skeleton loaders or cached content');
  }

  // Check dashboard visibility
  const dashboard = await page.$('h1');
  if (!dashboard) {
    logIssue('high', 'Content', 'Dashboard heading not found', 'Ensure Dashboard component renders correctly');
  }

  // Check button visibility and accessibility
  const newUpdateBtn = await page.$('a[href="/updates/daily/new"]');
  const newReflectionBtn = await page.$('a[href="/reflections/new"]');
  
  if (!newUpdateBtn) {
    logIssue('high', 'Navigation', 'New Daily Update button not found', 'Check Dashboard component');
  } else {
    const btnText = await page.evaluate(el => el.textContent, newUpdateBtn);
    if (!btnText.includes('New Daily Update')) {
      logIssue('medium', 'UX', 'Button text unclear', 'Use more descriptive button labels');
    }
  }

  if (!newReflectionBtn) {
    logIssue('high', 'Navigation', 'New Reflection button not found', 'Check Dashboard component');
  }

  // Check for recent updates
  const recentUpdates = await page.$$('[href*="/updates/daily/"]');
  if (recentUpdates.length === 0) {
    logIssue('medium', 'Content', 'No recent updates displayed', 'Check if content is loading or if there are no updates');
  }

  // Check search bar visibility
  const searchInput = await page.$('input[type="text"][placeholder*="Search"]');
  if (!searchInput) {
    logIssue('high', 'Search', 'Search input not found', 'Ensure Search component is rendered');
  }

  await takeScreenshot(page, 'homepage');
}

async function testNavigation(page) {
  console.log('\n🧭 Testing Navigation...');
  
  // Test sidebar
  const sidebar = await page.$('aside');
  if (!sidebar) {
    logIssue('high', 'Navigation', 'Sidebar not found', 'Check Sidebar component rendering');
  } else {
    // Check if sidebar is visible on desktop
    const sidebarVisible = await page.evaluate(() => {
      const aside = document.querySelector('aside');
      return aside && window.getComputedStyle(aside).display !== 'none';
    });
    
    if (!sidebarVisible) {
      logIssue('medium', 'Navigation', 'Sidebar not visible on desktop', 'Check CSS for sidebar visibility');
    }

    // Test mobile menu button
    const menuButton = await page.$('button[aria-label="Toggle menu"]');
    if (!menuButton) {
      logIssue('medium', 'Mobile UX', 'Mobile menu button not found', 'Add hamburger menu for mobile');
    }
  }

  // Test clicking on a daily update
  const firstUpdate = await page.$('a[href*="/updates/daily/"]');
  if (firstUpdate) {
    const href = await page.evaluate(el => el.getAttribute('href'), firstUpdate);
    console.log(`   → Clicking on: ${href}`);
    await firstUpdate.click();
    await page.waitForTimeout(2000);
    
    // Check if we navigated successfully
    const currentUrl = page.url();
    if (!currentUrl.includes('/updates/daily/')) {
      logIssue('high', 'Navigation', 'Failed to navigate to daily update', 'Check routing configuration');
    } else {
      console.log(`   ✓ Successfully navigated to: ${currentUrl}`);
    }
  }
}

async function testDailyUpdatePage(page) {
  console.log('\n📅 Testing Daily Update Page...');
  
  // Navigate to a daily update if we're not already there
  const currentUrl = page.url();
  if (!currentUrl.includes('/updates/daily/')) {
    await page.goto(`${BASE_URL}/updates/daily/2025-12-29`, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(2000);
  }

  // Check for date navigator
  const dateNavigator = await page.$('input[type="date"]');
  if (!dateNavigator) {
    logIssue('medium', 'Navigation', 'Date navigator not found on daily update page', 'Ensure DateNavigator component renders');
  } else {
    console.log('   ✓ Date navigator found');
    
    // Test previous/next buttons
    const prevButton = await page.$('a[href*="/updates/daily/"]:has(svg)');
    if (!prevButton) {
      logIssue('low', 'UX', 'Previous/Next navigation buttons not easily identifiable', 'Add clearer visual indicators');
    }
  }

  // Check for content
  const article = await page.$('article.prose');
  if (!article) {
    logIssue('high', 'Content', 'Article content not found', 'Check content rendering');
  }

  // Check for table of contents
  const toc = await page.evaluate(() => {
    const asides = Array.from(document.querySelectorAll('aside'));
    return asides.find(aside => {
      const h2 = aside.querySelector('h2');
      return h2 && h2.textContent.includes('Table of Contents');
    });
  });
  if (!toc) {
    logIssue('low', 'UX', 'Table of Contents not visible', 'May be hidden on smaller screens - check responsive design');
  }

  // Check for tags
  const tags = await page.$$('[class*="bg-blue-100"]');
  if (tags.length === 0) {
    logIssue('low', 'Content', 'No tags displayed', 'Tags help with content discovery');
  }

  await takeScreenshot(page, 'daily-update-page');
}

async function testSearch(page) {
  console.log('\n🔍 Testing Search...');
  
  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
  await page.waitForTimeout(2000);

  const searchInput = await page.$('input[type="text"][placeholder*="Search"]');
  if (!searchInput) {
    logIssue('high', 'Search', 'Search input not found', 'Check Search component');
    return;
  }

  // Test search functionality
  await searchInput.click();
  await page.type('input[type="text"][placeholder*="Search"]', 'Lenny', { delay: 100 });
  await page.waitForTimeout(1000);

  // Check if search results appear
  const searchResults = await page.$('div:has-text("No results found"), ul:has(li)');
  if (!searchResults) {
    logIssue('medium', 'Search', 'Search results not appearing', 'Check search index loading and filtering logic');
  } else {
    const resultsText = await page.evaluate(el => el.textContent, searchResults);
    if (resultsText.includes('No results found')) {
      logIssue('medium', 'Search', 'Search returned no results for "Lenny"', 'Check search index includes content');
    } else {
      console.log('   ✓ Search results displayed');
    }
  }

  // Clear search
  await searchInput.click({ clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(500);
}

async function testNewContentFlow(page) {
  console.log('\n✏️  Testing New Content Creation...');
  
  // Test New Daily Update flow
  await page.goto(`${BASE_URL}/updates/daily/new`, { waitUntil: 'networkidle0' });
  await page.waitForTimeout(1000);

  const dateInput = await page.$('input[type="date"]');
  const textarea = await page.$('textarea');
  const saveButton = await page.$('button:has-text("Save")');

  if (!dateInput) {
    logIssue('high', 'Forms', 'Date input not found in new update form', 'Check form component');
  }
  if (!textarea) {
    logIssue('high', 'Forms', 'Content textarea not found', 'Check form component');
  }
  if (!saveButton) {
    logIssue('high', 'Forms', 'Save button not found', 'Check form component');
  }

  // Check for helpful placeholder text
  if (textarea) {
    const placeholder = await page.evaluate(el => el.placeholder, textarea);
    if (!placeholder || placeholder.length < 50) {
      logIssue('medium', 'UX', 'Textarea placeholder text too short or missing', 'Add detailed placeholder with format example');
    }
  }

  // Test New Reflection flow
  await page.goto(`${BASE_URL}/reflections/new`, { waitUntil: 'networkidle0' });
  await page.waitForTimeout(1000);

  const reflectionTitle = await page.$('input[type="text"]');
  const reflectionTextarea = await page.$('textarea');
  
  if (!reflectionTitle) {
    logIssue('high', 'Forms', 'Title input not found in reflection form', 'Check ReflectionEditor component');
  }
  if (!reflectionTextarea) {
    logIssue('high', 'Forms', 'Content textarea not found in reflection form', 'Check ReflectionEditor component');
  }

  await takeScreenshot(page, 'new-reflection-form');
}

async function testResponsiveDesign(page) {
  console.log('\n📱 Testing Responsive Design...');
  
  // Test mobile view
  await page.setViewport({ width: 375, height: 667 }); // iPhone SE size
  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
  await page.waitForTimeout(2000);

  // Check if mobile menu button is visible
  const menuButton = await page.$('button[aria-label="Toggle menu"]');
  if (menuButton) {
    const isVisible = await page.evaluate(el => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }, menuButton);
    
    if (!isVisible) {
      logIssue('high', 'Mobile UX', 'Mobile menu button not visible on small screens', 'Check responsive CSS');
    } else {
      console.log('   ✓ Mobile menu button visible');
      
      // Test menu toggle
      await menuButton.click();
      await page.waitForTimeout(500);
      
      const sidebar = await page.$('aside');
      if (sidebar) {
        const sidebarVisible = await page.evaluate(el => {
          const style = window.getComputedStyle(el);
          return style.transform !== 'translateX(-100%)' && style.display !== 'none';
        }, sidebar);
        
        if (!sidebarVisible) {
          logIssue('high', 'Mobile UX', 'Sidebar does not open when menu button clicked', 'Check mobile menu toggle logic');
        } else {
          console.log('   ✓ Sidebar opens on mobile');
        }
      }
    }
  }

  // Test tablet view
  await page.setViewport({ width: 768, height: 1024 }); // iPad size
  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
  await page.waitForTimeout(1000);

  // Test desktop view
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
  await page.waitForTimeout(1000);

  await takeScreenshot(page, 'responsive-desktop');
}

async function testAccessibility(page) {
  console.log('\n♿ Testing Accessibility...');
  
  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
  await page.waitForTimeout(2000);

  // Check for alt text on images (if any)
  const images = await page.$$('img');
  for (const img of images) {
    const alt = await page.evaluate(el => el.getAttribute('alt'), img);
    if (!alt) {
      logIssue('medium', 'Accessibility', 'Image missing alt text', 'Add descriptive alt text to all images');
    }
  }

  // Check for proper heading hierarchy
  const h1 = await page.$('h1');
  if (!h1) {
    logIssue('high', 'Accessibility', 'No h1 heading found', 'Each page should have one h1');
  }

  // Check for skip links (nice to have)
  const skipLink = await page.$('a[href="#main"], a[href="#content"]');
  if (!skipLink) {
    logIssue('low', 'Accessibility', 'No skip link found', 'Consider adding skip to main content link');
  }

  // Check button accessibility
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const ariaLabel = await page.evaluate(el => el.getAttribute('aria-label'), btn);
    const text = await page.evaluate(el => el.textContent, btn);
    if (!ariaLabel && !text) {
      logIssue('high', 'Accessibility', 'Button missing accessible label', 'Add aria-label or visible text');
    }
  }
}

async function testPerformance(page) {
  console.log('\n⚡ Testing Performance...');
  
  const startTime = Date.now();
  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
  const loadTime = Date.now() - startTime;

  if (loadTime > 3000) {
    logIssue('high', 'Performance', `Page load time is ${loadTime}ms (slow)`, 'Optimize bundle size, use code splitting, add loading states');
  } else if (loadTime > 2000) {
    logIssue('medium', 'Performance', `Page load time is ${loadTime}ms (moderate)`, 'Consider optimizing API calls and reducing initial bundle');
  } else {
    console.log(`   ✓ Page loaded in ${loadTime}ms`);
  }

  // Check for console errors
  const logs = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      logs.push(msg.text());
    }
  });

  await page.waitForTimeout(2000);
  
  if (logs.length > 0) {
    logIssue('high', 'Errors', `${logs.length} console error(s) found`, 'Fix JavaScript errors in browser console');
    logs.forEach(log => console.log(`   Error: ${log}`));
  }
}

async function main() {
  console.log('🚀 Starting UX Audit...\n');
  console.log(`Testing site at: ${BASE_URL}\n`);

  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, '../screenshots');
  try {
    require('fs').mkdirSync(screenshotsDir, { recursive: true });
  } catch (e) {
    // Directory might already exist
  }

  const userDataDir = path.join(os.tmpdir(), 'puppeteer-ux-audit-' + Date.now());
  
  const browser = await puppeteer.launch({
    headless: true, // Set to false to see browser
    userDataDir: userDataDir,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
    ],
    ignoreHTTPSErrors: true,
  });

  const page = await browser.newPage();
  
  // Set a reasonable viewport
  await page.setViewport({ width: 1920, height: 1080 });

  // Check if server is running first
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 5000 });
    console.log('✓ Server is running\n');
  } catch (error) {
    console.error('\n❌ Cannot connect to server at', BASE_URL);
    console.error('   Make sure the dev server is running: npm run dev\n');
    await browser.close();
    return;
  }

  try {
    await testHomepage(page);
    await testNavigation(page);
    await testDailyUpdatePage(page);
    await testSearch(page);
    await testNewContentFlow(page);
    await testResponsiveDesign(page);
    await testAccessibility(page);
    await testPerformance(page);

  } catch (error) {
    console.error('\n❌ Error during testing:', error.message);
    console.error(error.stack);
    logIssue('high', 'Testing', `Test failed: ${error.message}`, 'Check that dev server is running on localhost:3000');
  } finally {
    await browser.close();
    
    // Clean up
    try {
      if (require('fs').existsSync(userDataDir)) {
        require('fs').rmSync(userDataDir, { recursive: true, force: true });
      }
    } catch (e) {}
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 UX Audit Summary\n');
  
  const highIssues = ISSUES.filter(i => i.severity === 'high');
  const mediumIssues = ISSUES.filter(i => i.severity === 'medium');
  const lowIssues = ISSUES.filter(i => i.severity === 'low');

  console.log(`🔴 High Priority: ${highIssues.length}`);
  console.log(`🟡 Medium Priority: ${mediumIssues.length}`);
  console.log(`🟢 Low Priority: ${lowIssues.length}`);
  console.log(`\nTotal Issues: ${ISSUES.length}\n`);

  if (highIssues.length > 0) {
    console.log('\n🔴 High Priority Issues:');
    highIssues.forEach(({ category, issue, suggestion }) => {
      console.log(`   • ${category}: ${issue}`);
      if (suggestion) console.log(`     ${suggestion}`);
    });
  }

  if (mediumIssues.length > 0) {
    console.log('\n🟡 Medium Priority Issues:');
    mediumIssues.forEach(({ category, issue, suggestion }) => {
      console.log(`   • ${category}: ${issue}`);
      if (suggestion) console.log(`     ${suggestion}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n💡 Key Recommendations:\n');
  
  // Generate recommendations based on issues
  const categories = [...new Set(ISSUES.map(i => i.category))];
  categories.forEach(category => {
    const categoryIssues = ISSUES.filter(i => i.category === category);
    if (categoryIssues.length > 0) {
      console.log(`   ${category}: ${categoryIssues.length} issue(s) found`);
    }
  });

  console.log('\n✅ Audit complete! Check screenshots/ directory for visual references.\n');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };

