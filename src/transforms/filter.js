/**
 * Pure transform functions for filtering data
 * 
 * These functions are pure (no side effects) and easily testable.
 */

/**
 * Filter posts by date range
 * @param {import('../domain/types').Post[]} posts - Array of posts
 * @param {Object} options - Options object
 * @param {number} options.daysBack - Number of days to look back
 * @returns {import('../domain/types').Post[]}
 */
function filterByDate(posts, options = {}) {
  const { daysBack = 30 } = options;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  
  return posts.filter(post => {
    if (!post.published) return true; // Include posts without dates
    return new Date(post.published) >= cutoffDate;
  });
}

/**
 * Filter updates by date range
 * @param {import('../domain/types').UpdateItem[]} updates - Array of updates
 * @param {Object} options - Options object
 * @param {number} options.daysBack - Number of days to look back
 * @returns {import('../domain/types').UpdateItem[]}
 */
function filterUpdatesByDate(updates, options = {}) {
  const { daysBack = 14 } = options;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  
  return updates.filter(update => {
    if (!update.published) return true; // Include updates without dates
    return new Date(update.published) >= cutoffDate;
  });
}

/**
 * Remove duplicate posts based on link
 * @param {import('../domain/types').Post[]} posts - Array of posts
 * @returns {import('../domain/types').Post[]}
 */
function dedupePosts(posts) {
  const seen = new Set();
  return posts.filter(post => {
    if (seen.has(post.link)) {
      return false;
    }
    seen.add(post.link);
    return true;
  });
}

/**
 * Remove duplicate updates based on link
 * @param {import('../domain/types').UpdateItem[]} updates - Array of updates
 * @returns {import('../domain/types').UpdateItem[]}
 */
function dedupeUpdates(updates) {
  const seen = new Set();
  return updates.filter(update => {
    if (seen.has(update.link)) {
      return false;
    }
    seen.add(update.link);
    return true;
  });
}

module.exports = {
  filterByDate,
  filterUpdatesByDate,
  dedupePosts,
  dedupeUpdates,
};

