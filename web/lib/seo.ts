export const SITE_URL = 'https://madisoncford.com';
export const SITE_NAME = "Madison's Morning Memo";
export const SITE_DESCRIPTION =
  'A daily PM research digest on applied AI — signals over noise, with a special eye on underrepresented voices in tech. By Madison Ford.';

export function absoluteUrl(path: string): string {
  if (!path || path === '/') return SITE_URL;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function formatSeoTitle(title: string): string {
  return title
    .replace(/^#+\s+/, '')
    .trim()
    .replace(/\bAi\b/gi, 'AI')
    .replace(/\bai\b/gi, 'AI')
    .replace(/\bPms\b/g, 'PMs');
}

export function clipDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const sliced = clean.slice(0, max - 1);
  const lastSpace = sliced.lastIndexOf(' ');
  return `${(lastSpace > 80 ? sliced.slice(0, lastSpace) : sliced).trimEnd()}…`;
}

export function descriptionFromMarkdown(markdown: string, fallback?: string): string {
  const shortVersion = markdown.match(
    /##\s+(?:The Short Version|(?:One-Line )?Summary)\s*\n+([^\n]+)/
  );
  if (shortVersion?.[1]) return clipDescription(shortVersion[1]);
  if (fallback) return clipDescription(fallback);

  const paragraph = markdown
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 40 && !line.startsWith('#') && !line.startsWith('---'));

  return clipDescription(paragraph || SITE_DESCRIPTION);
}
