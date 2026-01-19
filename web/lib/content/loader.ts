import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { parseMarkdown, processMarkdownSync } from './parser';
import { ContentMetadata, SearchIndexItem } from './types';

// Resolve content directory relative to repo root
// When running from /web, go up one level to repo root, then into /updates/daily
// Also support /content for backwards compatibility
const UPDATES_DIR = path.resolve(process.cwd(), '..', 'updates', 'daily');
const CONTENT_DIR = path.resolve(process.cwd(), '..', 'content');

// Use updates directory if it exists, otherwise fall back to content
const CONTENT_ROOT = fs.existsSync(UPDATES_DIR) ? UPDATES_DIR : CONTENT_DIR;

export function getAllContentPaths(): string[] {
  if (!fs.existsSync(CONTENT_ROOT)) {
    return [];
  }

  const paths: string[] = [];

  function walkDir(dir: string, basePath: string = '') {
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

  walkDir(CONTENT_ROOT);
  return paths;
}

export async function getContentByPath(filePath: string) {
  const fullPath = path.join(CONTENT_ROOT, filePath);
  
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const slug = filePath.replace(/\.md$/, '');
  const url = slug === 'index' ? '/' : `/${slug}`;
  
  return await parseMarkdown(content, slug, filePath, url);
}

export function getAllContentMetadata(): ContentMetadata[] {
  const paths = getAllContentPaths();
  
  return paths.map((filePath) => {
    const fullPath = path.join(CONTENT_ROOT, filePath);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const { data } = matter(content);
    
    const slug = filePath.replace(/\.md$/, '');
    const url = slug === 'index' ? '/' : `/${slug}`;
    const title = data.title || slugToTitle(slug);

    return {
      title,
      date: data.date,
      tags: Array.isArray(data.tags) ? data.tags : undefined,
      summary: data.summary,
      source_url: data.source_url,
      slug,
      path: filePath,
      url,
    };
  });
}

export function buildSearchIndex(): SearchIndexItem[] {
  const paths = getAllContentPaths();
  
  return paths.map((filePath) => {
    const fullPath = path.join(CONTENT_ROOT, filePath);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const { data, content: markdown } = matter(content);
    
    const slug = filePath.replace(/\.md$/, '');
    const url = slug === 'index' ? '/' : `/${slug}`;
    const title = data.title || slugToTitle(slug);
    
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
    };
  });
}

function slugToTitle(slug: string): string {
  return slug
    .split('/')
    .pop()!
    .replace(/\.md$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

