import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { parseMarkdown, processMarkdownSync } from './parser';
import { ContentMetadata, SearchIndexItem } from './types';

// Resolve content directory
// In production (Netlify), updates are copied to web/updates during build
// In development, they're at ../updates
const UPDATES_DIR_LOCAL = path.resolve(process.cwd(), '..', 'updates', 'daily');
const UPDATES_DIR_PROD = path.resolve(process.cwd(), 'updates', 'daily');
const MONTHLY_DIR_LOCAL = path.resolve(process.cwd(), '..', 'updates', 'monthly');
const MONTHLY_DIR_PROD = path.resolve(process.cwd(), 'updates', 'monthly');
const CONTENT_DIR = path.resolve(process.cwd(), '..', 'content');

// Check production location first, then local, then fallback
// For content loading, we need to merge daily updates and monthly summaries
let UPDATES_ROOT = UPDATES_DIR_LOCAL;
let MONTHLY_ROOT = MONTHLY_DIR_LOCAL;
if (fs.existsSync(UPDATES_DIR_PROD)) {
  UPDATES_ROOT = UPDATES_DIR_PROD;
}
if (fs.existsSync(MONTHLY_DIR_PROD)) {
  MONTHLY_ROOT = MONTHLY_DIR_PROD;
}

// Primary content root (for backward compatibility)
let CONTENT_ROOT = CONTENT_DIR;
if (fs.existsSync(UPDATES_DIR_PROD)) {
  CONTENT_ROOT = UPDATES_DIR_PROD;
} else if (fs.existsSync(UPDATES_DIR_LOCAL)) {
  CONTENT_ROOT = UPDATES_DIR_LOCAL;
}

export function getAllContentPaths(): string[] {
  const paths: string[] = [];

  function walkDir(dir: string, basePath: string = '') {
    if (!fs.existsSync(dir)) return;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(basePath, entry.name);

      if (entry.isDirectory()) {
        walkDir(fullPath, relativePath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        paths.push(relativePath);
      }
    }
  }

  // Walk content directory
  walkDir(CONTENT_DIR, '');
  
  // Walk daily updates
  walkDir(UPDATES_ROOT, 'updates/daily');
  
  // Walk monthly summaries
  walkDir(MONTHLY_ROOT, 'updates/monthly');
  
  return paths;
}

export async function getContentByPath(filePath: string) {
  let fullPath: string | null = null;
  
  // Try different possible locations
  if (filePath.startsWith('updates/daily/')) {
    const relPath = filePath.replace('updates/daily/', '');
    fullPath = path.join(UPDATES_ROOT, relPath);
  } else if (filePath.startsWith('updates/monthly/')) {
    const relPath = filePath.replace('updates/monthly/', '');
    fullPath = path.join(MONTHLY_ROOT, relPath);
  } else {
    fullPath = path.join(CONTENT_DIR, filePath);
  }
  
  if (!fullPath || !fs.existsSync(fullPath)) {
    return null;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const slug = filePath.replace(/\.md$/, '');
  const url = slug === 'index' ? '/' : `/${slug}`;
  
  return await parseMarkdown(content, slug, filePath, url);
}

export function getAllContentMetadata(): ContentMetadata[] {
  const paths = getAllContentPaths();
  
  const items = paths.map((filePath) => {
    let fullPath: string | null = null;
    
    // Determine full path based on file location
    if (filePath.startsWith('updates/daily/')) {
      const relPath = filePath.replace('updates/daily/', '');
      fullPath = path.join(UPDATES_ROOT, relPath);
    } else if (filePath.startsWith('updates/monthly/')) {
      const relPath = filePath.replace('updates/monthly/', '');
      fullPath = path.join(MONTHLY_ROOT, relPath);
    } else {
      fullPath = path.join(CONTENT_DIR, filePath);
    }
    
    if (!fullPath || !fs.existsSync(fullPath)) {
      return null;
    }
    
    let content = fs.readFileSync(fullPath, 'utf-8');

    // Handle edge case where H1 comes before frontmatter (same as parser.ts)
    if (content.startsWith('#') && content.includes('\n---\n')) {
      const lines = content.split('\n');
      const firstH1Index = lines.findIndex(line => line.startsWith('# '));
      const firstFrontmatterIndex = lines.findIndex((line, i) => i > firstH1Index && line === '---');

      if (firstH1Index === 0 && firstFrontmatterIndex > 0) {
        const afterH1 = lines.slice(1);
        const frontmatterStart = afterH1.findIndex(line => line === '---');
        if (frontmatterStart >= 0) {
          content = afterH1.slice(frontmatterStart).join('\n');
        }
      }
    }

    const { data } = matter(content);
    
    const slug = filePath.replace(/\.md$/, '');
    const url = slug === 'index' ? '/' : `/${slug}`;
    let title = data.title || slugToTitle(slug);
    
    // Ensure "AI" is always capitalized correctly
    title = title.replace(/\bAi\b/gi, 'AI');
    title = title.replace(/\bai\b/gi, 'AI');
    // Ensure "PMs" is always capitalized correctly
    title = title.replace(/\bPms\b/g, 'PMs');

    return {
      title,
      date: data.date,
      tags: Array.isArray(data.tags) ? data.tags : undefined,
      summary: data.summary,
      source_url: data.source_url,
      slug,
      path: filePath,
      url,
    } as ContentMetadata;
  });

  // Filter out nulls and narrow the type for TypeScript
  return items.filter((item): item is ContentMetadata => item !== null);
}

export function buildSearchIndex(): SearchIndexItem[] {
  const paths = getAllContentPaths();
  
  const items = paths.map((filePath) => {
    let fullPath: string | null = null;
    
    // Determine full path based on file location
    if (filePath.startsWith('updates/daily/')) {
      const relPath = filePath.replace('updates/daily/', '');
      fullPath = path.join(UPDATES_ROOT, relPath);
    } else if (filePath.startsWith('updates/monthly/')) {
      const relPath = filePath.replace('updates/monthly/', '');
      fullPath = path.join(MONTHLY_ROOT, relPath);
    } else {
      fullPath = path.join(CONTENT_DIR, filePath);
    }
    
    if (!fullPath || !fs.existsSync(fullPath)) {
      return null;
    }
    
    let content = fs.readFileSync(fullPath, 'utf-8');

    // Handle edge case where H1 comes before frontmatter (same as parser.ts)
    if (content.startsWith('#') && content.includes('\n---\n')) {
      const lines = content.split('\n');
      const firstH1Index = lines.findIndex(line => line.startsWith('# '));
      const firstFrontmatterIndex = lines.findIndex((line, i) => i > firstH1Index && line === '---');

      if (firstH1Index === 0 && firstFrontmatterIndex > 0) {
        const afterH1 = lines.slice(1);
        const frontmatterStart = afterH1.findIndex(line => line === '---');
        if (frontmatterStart >= 0) {
          content = afterH1.slice(frontmatterStart).join('\n');
        }
      }
    }

    const { data, content: markdown } = matter(content);
    
    const slug = filePath.replace(/\.md$/, '');
    const url = slug === 'index' ? '/' : `/${slug}`;
    let title = data.title || slugToTitle(slug);
    
    // Ensure "AI" is always capitalized correctly
    title = title.replace(/\bAi\b/gi, 'AI');
    title = title.replace(/\bai\b/gi, 'AI');
    // Ensure "PMs" is always capitalized correctly
    title = title.replace(/\bPms\b/g, 'PMs');
    
    // Extract plain text from markdown (remove markdown syntax)
    const body = markdown
      .replace(/^#+\s+/gm, '') // Remove headers
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links, keep text
      .replace(/`([^`]+)`/g, '$1') // Remove code backticks
      .replace(/\*\*([^\*]+)\*\*/g, '$1') // Remove bold
      .replace(/\*([^\*]+)\*/g, '$1') // Remove italic
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();

    return {
      slug,
      url,
      title,
      date: data.date,
      summary: data.summary,
      tags: Array.isArray(data.tags) ? data.tags : undefined,
      body,
    } as SearchIndexItem;
  });

  // Filter out nulls and narrow the type for TypeScript
  return items.filter((item): item is SearchIndexItem => item !== null);
}

function slugToTitle(slug: string): string {
  let title = slug
    .split('/')
    .pop()!
    .replace(/\.md$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
  
  // Ensure "AI" is always capitalized correctly
  title = title.replace(/\bAi\b/gi, 'AI');
  title = title.replace(/\bai\b/gi, 'AI');
  // Ensure "PMs" is always capitalized correctly
  title = title.replace(/\bPms\b/g, 'PMs');
  
  return title;
}

