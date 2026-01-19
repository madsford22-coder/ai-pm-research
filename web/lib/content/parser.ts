import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeStringify from 'rehype-stringify';
import { ContentFrontmatter, ContentPage } from './types';

export async function parseMarkdown(
  fileContent: string,
  slug: string,
  filePath: string,
  url: string
): Promise<ContentPage> {
  const { data, content } = matter(fileContent);
  
  // Ensure title exists (use filename as fallback)
  let title = data.title || slugToTitle(slug);
  
  // Ensure "AI" is always capitalized correctly
  title = title.replace(/\bAi\b/gi, 'AI');
  title = title.replace(/\bai\b/gi, 'AI');
  // Ensure "PMs" is always capitalized correctly
  title = title.replace(/\bPms\b/g, 'PMs');
  
  const frontmatter: ContentFrontmatter = {
    title,
    date: data.date,
    tags: Array.isArray(data.tags) ? data.tags : undefined,
    summary: data.summary,
    source_url: data.source_url,
  };

  // Process markdown to HTML
  const html = await processMarkdown(content);

  return {
    ...frontmatter,
    slug,
    path: filePath,
    url,
    content,
    html,
  };
}

function slugToTitle(slug: string): string {
  const title = slug
    .split('/')
    .pop()!
    .replace(/\.md$/, '')
    .replace(/[-_]/g, ' ');
  
  // Convert to proper title case (not all caps)
  let formatted = title
    .split(' ')
    .map(word => {
      // Keep acronyms uppercase, otherwise capitalize first letter
      if (word.match(/^[A-Z]{2,}$/)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
  
  // Ensure "AI" is always capitalized correctly
  formatted = formatted.replace(/\bAi\b/gi, 'AI');
  formatted = formatted.replace(/\bai\b/gi, 'AI');
  // Ensure "PMs" is always capitalized correctly
  formatted = formatted.replace(/\bPms\b/g, 'PMs');
  
  return formatted;
}

async function processMarkdown(markdown: string): Promise<string> {
  // Remove the first h1 if it exists (we use frontmatter title instead)
  const lines = markdown.split('\n');
  let skipFirstH1 = false;
  const processedLines = lines.filter((line, index) => {
    if (index === 0 && line.match(/^#+\s+/)) {
      skipFirstH1 = true;
      return false;
    }
    return true;
  });
  
  const processedMarkdown = processedLines.join('\n');
  
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: 'append',
      content: {
        type: 'element',
        tagName: 'span',
        properties: { className: ['anchor-link'] },
        children: [{ type: 'text', value: '#' }],
      },
    })
    .use(rehypeStringify)
    .process(processedMarkdown);

  return result.toString();
}

// Synchronous version for build-time processing
export function processMarkdownSync(markdown: string): string {
  // Remove the first h1 if it exists (we use frontmatter title instead)
  const lines = markdown.split('\n');
  let skipFirstH1 = false;
  const processedLines = lines.filter((line, index) => {
    if (index === 0 && line.match(/^#+\s+/)) {
      skipFirstH1 = true;
      return false;
    }
    return true;
  });
  
  const processedMarkdown = processedLines.join('\n');
  
  const result = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: 'append',
      content: {
        type: 'element',
        tagName: 'span',
        properties: { className: ['anchor-link'] },
        children: [{ type: 'text', value: '#' }],
      },
    })
    .use(rehypeStringify)
    .processSync(processedMarkdown);

  return result.toString();
}

