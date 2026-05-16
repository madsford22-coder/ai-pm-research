import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const COOKIE_NAME = 'aipm_session';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildSystemPrompt(today: string, archiveThrough: string | null): string {
  const archiveLine = archiveThrough
    ? `The archive covers through ${archiveThrough}. When someone asks about "this week" or "recently," interpret it relative to ${archiveThrough} — that's the most current data you have. If they're asking about something after that date, say so directly.`
    : 'No archive data is currently available.';

  return `You are the research assistant for Madison's Morning Memo — a daily digest on applied AI written for product managers. You answer subscriber questions about the archive.

Your voice: warm, direct, a little older-sibling energy. You're the smart friend who actually read the thing. You tell people what to pay attention to and you don't waste their time. You have opinions — use them. "This is mostly marketing" is a valid take. "This is the real deal" is too. Don't hedge when you don't need to.

What this never sounds like: "It could be argued that..." or "This represents a significant development in..." or anything that could've been written by a press release. Speak like a person.

Today's date is ${today}. ${archiveLine}

Be specific. Reference dates and companies. If something isn't in the archive, say so plainly rather than guessing. Keep answers tight and useful.

Every time you cite a specific date from the archive, turn it into a link so readers can read the full post. Format: [Month D, YYYY](/updates/daily/YYYY/YYYY-MM-DD). Example: [May 4, 2026](/updates/daily/2026/2026-05-04). Always do this — never mention a date without linking it.`;
}

function getUpdatesRoot(): string {
  const prod = path.resolve(process.cwd(), 'updates', 'daily');
  const local = path.resolve(process.cwd(), '..', 'updates', 'daily');
  return fs.existsSync(prod) ? prod : local;
}

function loadUpdatesUpTo(targetDate: string, days = 14): string {
  const root = getUpdatesRoot();
  if (!fs.existsSync(root)) return 'No research updates available.';

  const files: { date: string; filePath: string }[] = [];

  for (const year of fs.readdirSync(root)) {
    const yearDir = path.join(root, year);
    try {
      if (!fs.statSync(yearDir).isDirectory()) continue;
    } catch { continue; }
    for (const file of fs.readdirSync(yearDir)) {
      if (!file.endsWith('.md')) continue;
      const fileDate = file.replace('.md', '');
      if (fileDate <= targetDate) {
        files.push({ date: fileDate, filePath: path.join(yearDir, file) });
      }
    }
  }

  files.sort((a, b) => b.date.localeCompare(a.date));

  return files
    .slice(0, days)
    .map(({ date, filePath }) => {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { content } = matter(raw);
      return `=== ${date} ===\n${content.trim()}`;
    })
    .join('\n\n');
}

function getMostRecentUpdateDate(): string | null {
  const root = getUpdatesRoot();
  if (!fs.existsSync(root)) return null;
  const dates: string[] = [];
  for (const year of fs.readdirSync(root)) {
    const yearDir = path.join(root, year);
    try {
      if (!fs.statSync(yearDir).isDirectory()) continue;
    } catch { continue; }
    for (const file of fs.readdirSync(yearDir)) {
      if (file.endsWith('.md')) dates.push(file.replace('.md', ''));
    }
  }
  dates.sort((a, b) => b.localeCompare(a));
  return dates[0] ?? null;
}

function loadRecentUpdates(days = 30): string {
  const root = getUpdatesRoot();
  if (!fs.existsSync(root)) return 'No research updates available.';

  const files: { date: string; filePath: string }[] = [];

  for (const year of fs.readdirSync(root)) {
    const yearDir = path.join(root, year);
    try {
      if (!fs.statSync(yearDir).isDirectory()) continue;
    } catch {
      continue;
    }
    for (const file of fs.readdirSync(yearDir)) {
      if (!file.endsWith('.md')) continue;
      files.push({ date: file.replace('.md', ''), filePath: path.join(yearDir, file) });
    }
  }

  files.sort((a, b) => b.date.localeCompare(a.date));

  return files
    .slice(0, days)
    .map(({ date, filePath }) => {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { content } = matter(raw);
      return `=== ${date} ===\n${content.trim()}`;
    })
    .join('\n\n');
}

export async function POST(request: NextRequest) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });
  }

  // Verify session
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const secret = new TextEncoder().encode(jwtSecret);
    await jwtVerify(token, secret);
  } catch {
    return NextResponse.json({ error: 'invalid_session' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const question = typeof body.question === 'string' ? body.question.trim() : '';
  const date = typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : null;

  if (!question) {
    return NextResponse.json({ error: 'invalid_question' }, { status: 400 });
  }
  if (question.length > 500) {
    return NextResponse.json({ error: 'question_too_long' }, { status: 400 });
  }

  const today = new Date().toISOString().split('T')[0];
  const archiveThrough = date ?? getMostRecentUpdateDate();
  const systemPrompt = buildSystemPrompt(today, archiveThrough);

  const context = date ? loadUpdatesUpTo(date, 14) : loadRecentUpdates(30);
  const contextLabel = date
    ? `Research archive (${date} and the 13 preceding days):\n\n${context}`
    : `Research archive (last 30 days):\n\n${context}`;
  const encoder = new TextEncoder();

  // claude-haiku-4-5 for speed/cost; upgrade to claude-sonnet-4-6 for deeper answers
  const stream = anthropic.messages.stream({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: contextLabel,
            cache_control: { type: 'ephemeral' },
          },
          {
            type: 'text',
            text: question,
          },
        ],
      },
    ],
  });

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Query failed';
        controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`));
      } finally {
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
