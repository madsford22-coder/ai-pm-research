# AI Product Management Research Assistant

System of record and long-term memory for tracking AI product signals and translating them into actionable PM insights.

## Structure

- `context/` - Configuration files that define scope, priorities, and filters
  - `companies.md` - Tracked companies and their product areas
  - `people.md` - Tracked individuals and their roles
  - `prefs.md` - Research preferences and filters
  - `open-questions.md` - Open questions to investigate
- `updates/daily/YYYY/` - Daily research updates organized by year
  - Format: `YYYY-MM-DD.md`

## Operating Principles

- Prefer shipped product changes over announcements
- Separate facts from interpretation
- Ignore anything that does not meaningfully inform product decisions
- Optimize for PM usefulness, not novelty

## Required Synthesis Format

Every item must answer:
- **PM Takeaway**: Brief summary
- **User problem impacted**: What user need does this address/change
- **Product surface area**: What part of the product ecosystem is affected
- **Decision this informs**: What product decision does this signal inform
- **Pattern to note**: Any broader pattern or trend this represents

## Daily Output

- Maximum 3–5 items per day
- It is acceptable (and correct) to output "No meaningful PM-relevant updates today"
- Never dump raw research—only curated, synthesized markdown

