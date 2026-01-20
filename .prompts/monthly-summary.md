# Monthly Summary Generation Prompt

Use this prompt when generating monthly summaries for the AI PM Research Hub.

## Instructions

Generate a monthly summary based on all daily updates from the month. The summary should:

### Tone & Style
- Write like a human explaining to another human
- Be conversational and friendly, not corporate or jargony
- Avoid AI slop phrases like "in the evolving landscape" or "cutting-edge"
- Use specific examples and numbers when available
- Keep it concise - respect the reader's time

### Structure

**Opening paragraph (2-3 sentences):**
- Identify the main theme or shift happening this month
- Make it compelling - why should someone care?
- Don't repeat what you'll say in the bullets

**Second paragraph (1-2 sentences):**
- Add a secondary theme or observation if relevant
- Connect it back to practical implications for PMs

**What Matters section (3 bullets):**
- Each bullet should have a **bold header** followed by specific details
- Include concrete examples (company names, product names, numbers)
- Show don't tell - use specifics not generalities
- Each bullet should stand alone - don't assume they read the others

**Essential Resources (3 items):**
- Pick the 3 most valuable/impactful sources from the month
- NO DUPLICATES - verify each source is unique
- Format: `**Source** — [Descriptive title](URL) — One-line summary of what you'll learn.`
- One-line summaries should be specific and actionable
- Prioritize diversity: different companies, different perspectives, different types of content

### Quality Checks

Before finalizing, verify:
- [ ] No duplicate sources in Essential Resources
- [ ] Opening paragraphs don't repeat the bullet points
- [ ] Each bullet has specific examples (names, numbers, products)
- [ ] No jargon or corporate speak
- [ ] Sounds like a human wrote it
- [ ] Links are all unique and valid
- [ ] Resource descriptions are specific and helpful

### Bad Example
❌ "Companies sharing production agent system implementations as the space matures from experimentation to real-world deployment at scale."

### Good Example
✅ "LangChain's Remote case study reveals practical patterns for multi-agent customer onboarding that handles 1000+ users."

## Template

```markdown
---
title: "[Month] [Year] Research Summary"
date: [YYYY-MM-01]
tags:
  - monthly-summary
  - ai-pm-research
---

# [Month] [Year] Research Summary

[2-3 sentence opening paragraph identifying the main theme/shift. Be specific and compelling.]

[1-2 sentence secondary observation connecting to PM implications.]

## What Matters

- **[Bold header for theme 1].** [Specific details with examples, company names, numbers.]
- **[Bold header for theme 2].** [Specific details with examples, company names, numbers.]
- **[Bold header for theme 3].** [Specific details with examples, company names, numbers.]


## Essential Resources (3)

1. **[Source]** — [Descriptive title](URL) — [One-line specific summary.]
2. **[Source]** — [Descriptive title](URL) — [One-line specific summary.]
3. **[Source]** — [Descriptive title](URL) — [One-line specific summary.]


---

*[X] daily updates tracked [Y] items this month. [View all [Month] updates](/?from=[YYYY-MM-01]&to=[YYYY-MM-last-day])*
```

**Note:** The "View all updates" link now points to the dashboard with pre-populated date filters for the entire month. Replace `[YYYY-MM-last-day]` with the actual last day of the month (28/29/30/31).

## How to Use

1. Read through all daily updates for the month
2. Identify 2-3 main themes or shifts
3. Pick the 3 most valuable distinct sources
4. Write opening paragraphs that set up the themes without repeating bullets
5. Write specific, example-rich bullet points
6. Run through quality checks
7. Generate the summary

## Notes

- Monthly summaries should feel like a curator's perspective, not a dry recap
- Focus on signals and patterns, not just events
- Help readers understand what matters and why
- Make it easy to scan but rewarding to read carefully
