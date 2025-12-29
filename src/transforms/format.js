/**
 * Pure transform functions for formatting output
 * 
 * These functions are pure (no side effects) and easily testable.
 */

/**
 * Format person activity as markdown
 * @param {import('../domain/types').PersonActivity[]} activities - Array of person activities
 * @returns {string}
 */
function formatPersonActivityMarkdown(activities) {
  let output = '\n' + '='.repeat(80) + '\n';
  output += '# People Activity Report\n\n';
  
  const active = activities.filter(a => a.posts.length > 0);
  const inactive = activities.filter(a => a.posts.length === 0);
  
  output += `## Active People (${active.length})\n\n`;
  for (const activity of active) {
    output += `### ${activity.name}\n`;
    output += `**Posts:** ${activity.posts.length}\n`;
    
    // Group by source
    const bySource = {};
    for (const post of activity.posts) {
      if (!bySource[post.source]) bySource[post.source] = [];
      bySource[post.source].push(post);
    }
    
    for (const [source, posts] of Object.entries(bySource)) {
      output += `\n**From ${source}:**\n`;
      for (const post of posts.slice(0, 5)) {
        const date = post.published ? new Date(post.published).toISOString().split('T')[0] : 'No date';
        output += `- [${post.title.substring(0, 60)}...](${post.link}) (${date})\n`;
      }
    }
    output += '\n';
  }
  
  output += `\n## Inactive People (${inactive.length})\n\n`;
  for (const activity of inactive) {
    output += `- ${activity.name}\n`;
    if (activity.errors.length > 0) {
      output += `  - Errors: ${activity.errors.join('; ')}\n`;
    }
  }
  
  return output;
}

/**
 * Format company updates as markdown
 * @param {import('../domain/types').UpdateItem[]} updates - Array of updates
 * @returns {string}
 */
function formatCompanyUpdatesMarkdown(updates) {
  let output = '# Recent Company Updates\n\n';
  
  // Group by company
  const byCompany = {};
  for (const update of updates) {
    if (!byCompany[update.company]) {
      byCompany[update.company] = [];
    }
    byCompany[update.company].push(update);
  }
  
  for (const [companyName, companyUpdates] of Object.entries(byCompany)) {
    output += `## ${companyName}\n`;
    if (companyUpdates[0].category) {
      output += `*Category: ${companyUpdates[0].category}*\n\n`;
    }
    
    for (const update of companyUpdates) {
      output += `### ${update.title}\n`;
      output += `**Link:** ${update.link}\n`;
      if (update.published) {
        output += `**Published:** ${update.published}\n`;
      }
      output += `**Source:** ${update.source} (${update.sourceUrl})\n`;
      if (update.description) {
        output += `**Summary:** ${update.description}\n`;
      }
      output += '\n';
    }
  }
  
  return output;
}

module.exports = {
  formatPersonActivityMarkdown,
  formatCompanyUpdatesMarkdown,
};

