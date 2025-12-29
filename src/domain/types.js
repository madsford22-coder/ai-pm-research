/**
 * Domain types for the AI PM Research system
 * 
 * These are the core data structures that represent the business domain.
 * They should be pure data structures with no side effects.
 */

/**
 * @typedef {Object} Person
 * @property {string} name
 * @property {string|null} blog
 * @property {string|null} rss_feed
 * @property {string|null} linkedin
 * @property {string|null} twitter
 */

/**
 * @typedef {Object} Company
 * @property {string} name
 * @property {string[]} blogs
 * @property {string[]} changelogs
 * @property {string|null} twitter
 * @property {string|null} category
 */

/**
 * @typedef {Object} Post
 * @property {string} title
 * @property {string} link
 * @property {string|null} published - ISO 8601 date string
 * @property {string} source - 'blog_rss' | 'blog_scrape' | 'linkedin' | 'twitter' | 'rss' | 'changelog'
 * @property {string|null} description
 * @property {string|null} sourceUrl - URL of the source (blog, changelog, etc.)
 */

/**
 * @typedef {Object} UpdateItem
 * @property {string} title
 * @property {string} link
 * @property {string|null} published - ISO 8601 date string
 * @property {string} source - 'blog' | 'changelog' | 'rss'
 * @property {string} sourceUrl
 * @property {string|null} description
 * @property {string|null} company - Company name if applicable
 * @property {string|null} category - Company category if applicable
 */

/**
 * @typedef {Object} PersonActivity
 * @property {string} name
 * @property {Post[]} posts
 * @property {string[]} errors
 */

/**
 * @typedef {Object} CompanyUpdates
 * @property {string} name
 * @property {string|null} category
 * @property {UpdateItem[]} updates
 * @property {string[]} errors
 */

module.exports = {
  // Types are exported via JSDoc for IDE support
  // No runtime exports needed - these are just documentation
};

