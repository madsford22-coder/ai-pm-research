/**
 * Pure transform functions for formatting news output
 * 
 * These functions are pure (no side effects) and easily testable.
 */

/**
 * Format news items as markdown
 * @param {Array<{company: string, category?: string, title: string, link: string, source?: string, date?: string}>} newsItems - Array of news items
 * @returns {string}
 */
function formatNewsMarkdown(newsItems) {
  let output = '# Recent News Mentions\n\n';
  
  // Group by company
  const byCompany = {};
  for (const item of newsItems) {
    if (!byCompany[item.company]) {
      byCompany[item.company] = [];
    }
    byCompany[item.company].push(item);
  }
  
  for (const [companyName, items] of Object.entries(byCompany)) {
    output += `## ${companyName}\n`;
    if (items[0].category) {
      output += `*Category: ${items[0].category}*\n\n`;
    }
    
    for (const item of items) {
      output += `### ${item.title}\n`;
      output += `**Link:** ${item.link}\n`;
      if (item.source) {
        output += `**Source:** ${item.source}\n`;
      }
      if (item.date) {
        output += `**Date:** ${item.date}\n`;
      }
      output += '\n';
    }
  }
  
  return output;
}

module.exports = {
  formatNewsMarkdown,
};

