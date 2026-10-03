export type VisitKind = 'human' | 'bot' | 'preview' | 'script';

const BOT_UA =
  /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|gptbot|chatgpt-user|oai-searchbot|claudebot|claude-user|claude-searchbot|claude-web|anthropic-ai|ccbot|perplexitybot|perplexity-user|bytespider|amazonbot|google-extended|applebot-extended|meta-externalagent|facebookbot|ahrefsbot|semrushbot|mj12bot|dotbot|petalbot|ia_archiver|archive\.org_bot|dataforseobot|screaming frog|rogerbot/i;

const PREVIEW_UA =
  /slackbot|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot|facebookexternalhit|iframely|embedly|pinterest|skypeuripreview|vkshare|applebot|google-inspectiontool/i;

const SCRIPT_UA =
  /curl|wget|python-requests|python-urllib|go-http-client|axios|node-fetch|httpie|libwww-perl|java\/|okhttp|scrapy|httpclient|aiohttp|undici|postman|insomnia|headlesschrome|phantomjs|puppeteer|playwright/i;

export function classifyUserAgent(ua: string | null | undefined): { kind: VisitKind; name: string } {
  const value = (ua || '').trim();
  if (!value) return { kind: 'script', name: 'empty-ua' };

  const bot = value.match(BOT_UA);
  if (bot) return { kind: 'bot', name: bot[0].toLowerCase() };

  const preview = value.match(PREVIEW_UA);
  if (preview) return { kind: 'preview', name: preview[0].toLowerCase() };

  const script = value.match(SCRIPT_UA);
  if (script) return { kind: 'script', name: script[0].toLowerCase() };

  return { kind: 'human', name: 'browser' };
}
