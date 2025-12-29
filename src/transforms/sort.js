/**
 * Pure transform functions for sorting data
 * 
 * These functions are pure (no side effects) and easily testable.
 */

/**
 * Sort posts by date (most recent first)
 * @param {import('../domain/types').Post[]} posts - Array of posts
 * @returns {import('../domain/types').Post[]}
 */
function sortPostsByDate(posts) {
  return [...posts].sort((a, b) => {
    if (!a.published && !b.published) return 0;
    if (!a.published) return 1;
    if (!b.published) return -1;
    return new Date(b.published) - new Date(a.published);
  });
}

/**
 * Sort updates by date (most recent first)
 * @param {import('../domain/types').UpdateItem[]} updates - Array of updates
 * @returns {import('../domain/types').UpdateItem[]}
 */
function sortUpdatesByDate(updates) {
  return [...updates].sort((a, b) => {
    if (!a.published && !b.published) return 0;
    if (!a.published) return 1;
    if (!b.published) return -1;
    return new Date(b.published) - new Date(a.published);
  });
}

module.exports = {
  sortPostsByDate,
  sortUpdatesByDate,
};

