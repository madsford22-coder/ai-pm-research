/**
 * Adapters for fetching news mentions
 * 
 * These functions handle web search and news scraping.
 * They should be testable by injecting page objects.
 */

/**
 * Search Google News for a company
 * @param {Object} page - Puppeteer page object
 * @param {string} companyName - Name of the company to search for
 * @param {Object} options - Options object
 * @param {number} options.daysBack - Number of days to look back
 * @returns {Promise<Array<{title: string, link: string, source: string, date: string}>>}
 */
async function searchNewsForCompany(page, companyName, options = {}) {
  const { daysBack = 7 } = options;
  
  try {
    // Use Google News search
    const searchQuery = `${companyName} AI product update OR launch OR feature`;
    const newsUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&tbm=nws&tbs=qdr:w`; // Last week
    
    await page.goto(newsUrl, { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const results = await page.evaluate(() => {
      const items = [];
      
      // Google News structure
      const articles = document.querySelectorAll('div[data-ved] a[href^="http"]');
      
      for (const article of articles) {
        const title = article.textContent.trim();
        const link = article.href;
        
        if (title && link && title.length > 10) {
          // Find the parent container for date/source
          let source = '';
          let date = '';
          
          const parent = article.closest('div[data-ved]');
          if (parent) {
            const sourceEl = parent.querySelector('span, cite');
            if (sourceEl) {
              source = sourceEl.textContent.trim();
            }
            
            // Look for date
            const text = parent.textContent;
            const dateMatch = text.match(/(\d+\s+(hour|hours|day|days|week|weeks)\s+ago)|(\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})/i);
            if (dateMatch) {
              date = dateMatch[0];
            }
          }
          
          items.push({
            title,
            link,
            source,
            date,
          });
        }
        
        if (items.length >= 10) break;
      }
      
      return items;
    });
    
    return results;
  } catch (error) {
    console.error(`  ✗ Error searching news for ${companyName}: ${error.message}`);
    return [];
  }
}

module.exports = {
  searchNewsForCompany,
};

