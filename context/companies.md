# Tracked Companies

Companies whose product changes, launches, and updates we monitor.

This file defines which companies and products matter for product management–focused AI research. It is a long-lived context file and must be opinionated, scoped, and low-noise.

---

## OpenAI
**Category:** Foundation models / AI platforms
**Why we track them:** Market leader in consumer AI adoption. Their pricing, feature rollouts, and API changes set industry expectations and influence user behavior patterns.
**What to watch for:**
- API pricing and rate limit changes
- New model releases (GPT-4 variants, etc.)
- ChatGPT feature launches (multimodal, custom instructions, memory)
- Enterprise product changes (Team, Enterprise tiers)
- Developer product launches (Assistants API, fine-tuning tools)
**Ignore unless:**
- Research papers without product implications
- Pure research announcements
- Partnership announcements without product changes
**Primary sources:**
- https://openai.com/blog (feed_url: https://openai.com/news/rss.xml)
- https://platform.openai.com/docs/changelog

---

## Anthropic
**Category:** Foundation models / AI platforms
**Why we track them:** Strong product discipline and clear positioning. Their approach to safety, pricing, and enterprise features provides contrast to OpenAI's moves.
**What to watch for:**
- Claude model releases and capabilities
- API pricing and access changes
- Console and enterprise feature launches
- Context window increases and their impact on use cases
- Tool use and function calling features
**Ignore unless:**
- Safety research without product implications
- Academic publications
**Primary sources:**
- https://www.anthropic.com/news (feed_url: scrape)
- https://docs.anthropic.com/en/release-notes/api

---

## Google
**Category:** Foundation models / AI platforms
**Why we track them:** Massive distribution and integration into existing products. Their approach to embedding AI into search, workspace, and developer tools shows how incumbents adapt.
**What to watch for:**
- Gemini model releases and capabilities
- Google Workspace AI features (Docs, Sheets, Gmail)
- Search Generative Experience (SGE) changes
- Vertex AI platform updates
- Android and Chrome AI integrations
**Ignore unless:**
- Research-only announcements
- Hardware launches (unless they enable new product capabilities)
- Internal org changes
**Primary sources:**
- https://blog.google/technology/ai/
- https://cloud.google.com/vertex-ai/docs/release-notes
- https://workspace.google.com/blog (feed_url: https://workspace.google.com/blog/rss)

---

## Microsoft
**Category:** Foundation models / AI platforms
**Why we track them:** Deep integration into productivity software. Copilot's rollout across Office, Windows, and developer tools shows enterprise AI adoption patterns.
**What to watch for:**
- Copilot feature launches across products (Office, Windows, GitHub)
- Pricing changes for Copilot subscriptions
- Azure OpenAI Service updates
- Developer tool integrations (VS Code, GitHub Copilot)
- Enterprise security and compliance features
**Ignore unless:**
- Pure infrastructure announcements
- Partnership announcements without product changes
**Primary sources:**
- https://blogs.microsoft.com/ai/
- https://github.blog/category/product/copilot/
- https://azure.microsoft.com/en-us/updates (feed_url: https://azure.microsoft.com/en-us/updates/?feed=rss)

---

## Meta
**Category:** Foundation models / AI platforms
**Why we track them:** Open-source model strategy (Llama) and massive consumer reach. Their approach to open models influences developer tooling and startup strategies.
**What to watch for:**
- Llama model releases and licensing changes
- AI features in consumer products (Instagram, WhatsApp, Facebook)
- Ray-Ban Meta AI integration patterns
- Developer tooling around Llama
**Ignore unless:**
- VR/AR hardware launches (unless AI-focused)
- Internal research without product implications
**Primary sources:**
- https://ai.meta.com/blog/ (feed_url: scrape)

---

## GitHub
**Category:** Developer & AI tooling
**Why we track them:** Copilot adoption patterns and pricing inform developer tool economics. Their integration of AI into core workflows shows how developer tools evolve.
**What to watch for:**
- GitHub Copilot pricing and feature changes
- Copilot Chat and CLI updates
- Actions and CI/CD AI integrations
- Enterprise Copilot features and policies
**Ignore unless:**
- Infrastructure updates without AI implications
- General platform features unrelated to AI
**Primary sources:**
- https://github.blog/category/product/copilot/
- https://github.blog/changelog/

---

## Cursor
**Category:** Developer & AI tooling
**Why we track them:** Product-led approach to AI coding assistants. Their rapid iteration and feature launches show what developers actually want from AI coding tools.
**What to watch for:**
- New editor features and workflows
- Model switching and provider integrations
- Pricing changes
- Enterprise features
- Developer workflow innovations
**Ignore unless:**
- Marketing-only announcements
**Primary sources:**
- https://cursor.com/changelog (feed_url: https://cursor.com/changelog/rss.xml)

---

## Vercel
**Category:** Developer & AI tooling
**Why we track them:** AI SDK and v0 show how platforms integrate AI into developer workflows. Their approach to AI tooling influences frontend development patterns.
**What to watch for:**
- AI SDK updates and new providers
- v0 feature launches and capabilities
- Integration patterns with Next.js and React
- Developer experience improvements
**Ignore unless:**
- Infrastructure-only updates
- General platform features without AI implications
**Primary sources:**
- https://vercel.com/blog (feed_url: https://vercel.com/atom)
- https://vercel.com/changelog

---

## Replicate
**Category:** Developer & AI tooling
**Why we track them:** Model hosting and API patterns. Their approach to making models accessible shows infrastructure trends for AI applications.
**What to watch for:**
- New model additions and capabilities
- API changes and pricing
- Developer tooling improvements
- Enterprise features
**Ignore unless:**
- Infrastructure-only announcements
**Primary sources:**
- https://replicate.com/blog (feed_url: https://replicate.com/blog/rss)

---

## LangChain / LangSmith
**Category:** Developer & AI tooling
**Why we track them:** De facto standard for building LLM applications. Their product decisions shape how developers build agentic workflows and production AI systems.
**What to watch for:**
- LangChain framework updates and new features
- LangSmith observability and debugging features
- LangGraph and agent workflow tools
- Integration patterns and ecosystem changes
**Ignore unless:**
- Pure documentation updates
- Community events without product implications
**Primary sources:**
- https://blog.langchain.dev/

---

## Mastra
**Category:** Developer & AI tooling
**Why we track them:** TypeScript-first framework for building AI agents. Founded by Gatsby team (2024), rapid growth with millions of monthly downloads. Their approach to agent frameworks provides contrast to Python-heavy alternatives.
**What to watch for:**
- Framework updates and new features
- Agent workflow and orchestration capabilities
- Integration patterns with TypeScript/JavaScript ecosystems
- Developer experience improvements
- Enterprise or production-ready features
**Ignore unless:**
- Pure documentation updates
- Marketing-only announcements
- Community events without product implications
**Primary sources:**
- https://mastra.ai/blog (feed_url: scrape)

---

## Notion
**Category:** Consumer & productivity software
**Why we track them:** AI integration into productivity workflows. Their approach to embedding AI into existing products shows how incumbents adapt without disrupting core UX.
**What to watch for:**
- AI feature launches (Q&A, writing assistance, summarization)
- Pricing changes for AI features
- Enterprise AI capabilities
- Integration patterns with other tools
**Ignore unless:**
- General product features without AI implications
- Marketing campaigns
**Primary sources:**
- https://www.notion.com/blog (feed_url: scrape)
- https://www.notion.com/releases (feed_url: https://www.notion.com/releases/rss.xml)

---

## Perplexity
**Category:** Consumer & productivity software
**Why we track them:** Product-led approach to AI search. Their rapid iteration and feature launches show what users want from AI-powered information retrieval.
**What to watch for:**
- New search capabilities and features
- Pricing and subscription changes
- Mobile app updates
- Enterprise features
- Integration patterns
**Ignore unless:**
- Marketing-only announcements
**Primary sources:**
- https://www.perplexity.ai/hub/blog (feed_url: scrape)

---

## Character.AI
**Category:** Consumer & productivity software
**Why we track them:** Consumer engagement patterns and monetization. Their approach to conversational AI shows what drives user retention and willingness to pay.
**What to watch for:**
- Feature launches (voice, image generation, etc.)
- Monetization changes (subscription tiers, features)
- User engagement patterns and metrics (if shared)
- Mobile app updates
**Ignore unless:**
- Marketing campaigns
- Partnership announcements without product changes
**Primary sources:**
- https://blog.character.ai (feed_url: scrape)

---

## Midjourney
**Category:** Consumer & productivity software
**Why we track them:** Image generation market leader. Their pricing, feature launches, and quality improvements set expectations for creative AI tools.
**What to watch for:**
- Model updates and quality improvements
- New features (inpainting, upscaling, etc.)
- Pricing changes
- API or integration launches
**Ignore unless:**
- Community events
- Art showcases without product implications
**Primary sources:**
- https://www.midjourney.com/updates (feed_url: scrape)

---

## Runway
**Category:** Video & creative AI
**Why we track them:** Video generation market leader and the most product-mature company in the space. Their model releases, pricing, and API decisions set the baseline for the category.
**What to watch for:**
- Video generation model updates (Gen-3 and beyond)
- New creative tools and features
- Pricing changes
- API launches and developer platform moves
- Workflow integrations with creative tools
**Ignore unless:**
- Marketing campaigns without product changes
- Partnership announcements without product changes
**Primary sources:**
- https://runway.com/blog (feed_url: scrape)

---

## Pika
**Category:** Video & creative AI
**Why we track them:** Fast-growing consumer video generation product. Their rapid iteration on UX and pricing shows what's working for non-professional users trying to create video with AI.
**What to watch for:**
- Model quality updates and new capabilities
- Feature launches (editing, styles, motion controls)
- Pricing and plan changes
- Mobile app updates
- Adoption signals
**Ignore unless:**
- Marketing campaigns without product changes
**Primary sources:**
- https://pika.art/blog (feed_url: scrape)

---

## Luma AI
**Category:** Video & creative AI
**Why we track them:** Dream Machine is one of the most-used video generation products among creative professionals. Their product decisions — especially around quality, speed, and pricing — are closely watched signals for where the category is heading.
**What to watch for:**
- Dream Machine model updates and quality improvements
- New generation features (camera control, character consistency)
- Pricing and access changes
- API or integration launches
- Product comparisons that reveal competitive positioning
**Ignore unless:**
- Research-only announcements without product implications
**Primary sources:**
- https://lumalabs.ai/blog (feed_url: scrape)

---

## HeyGen
**Category:** Video & creative AI
**Why we track them:** Leading AI video platform for business use — avatars, translation, marketing content. Represents the enterprise/B2B angle of video AI that Runway and Pika don't cover. Their product decisions show how video AI gets applied in professional and commercial contexts.
**What to watch for:**
- Avatar and presenter feature updates
- Video translation and localization capabilities
- Enterprise features and integrations
- Pricing changes
- API and workflow integration launches
**Ignore unless:**
- Marketing campaigns without product changes
**Primary sources:**
- https://www.heygen.com/blog (feed_url: scrape)

---

## Synthesia
**Category:** Video & creative AI
**Why we track them:** Enterprise AI video platform — corporate training, L&D, internal comms. One of the clearest signals for how large organizations are actually adopting AI video. Their product decisions show what enterprise buyers need before they'll trust AI-generated video at scale.
**What to watch for:**
- Feature launches for enterprise use cases (custom avatars, branding, compliance)
- Pricing and plan changes
- Enterprise integrations (LMS, CMS, HR platforms)
- Adoption and usage signals
- Security and compliance features
**Ignore unless:**
- Marketing campaigns without product changes
**Primary sources:**
- https://www.synthesia.io/blog (feed_url: scrape)

---

## Stripe
**Category:** Fintech or fintech-adjacent platforms
**Why we track them:** AI features in payment infrastructure. Their approach to embedding AI into financial workflows shows how fintech platforms adapt.
**What to watch for:**
- AI-powered fraud detection improvements
- AI features in Stripe products (if any)
- Developer tooling with AI capabilities
**Ignore unless:**
- General payment infrastructure updates
- Non-AI product launches
**Primary sources:**
- https://stripe.com/blog (feed_url: scrape)

---

## Plaid
**Category:** Fintech or fintech-adjacent platforms
**Why we track them:** Financial data infrastructure. Their approach to AI in financial data processing and insights shows fintech AI patterns.
**What to watch for:**
- AI features in data processing
- Insights and analytics powered by AI
- Developer tooling with AI capabilities
**Ignore unless:**
- General infrastructure updates
- Non-AI product launches
**Primary sources:**
- https://plaid.com/blog/ (feed_url: scrape)

---

## Mistral AI
**Category:** Foundation models / AI platforms
**Why we track them:** European alternative with open-source focus. Their model releases and API approach provide contrast to US-based providers.
**What to watch for:**
- Model releases and capabilities
- API pricing and access
- Open-source model releases
- Enterprise features
**Ignore unless:**
- Research-only announcements
- Partnership announcements without product changes
**Primary sources:**
- https://mistral.ai/news (feed_url: scrape)

---

## Cohere
**Category:** Foundation models / AI platforms
**Why we track them:** Enterprise-focused approach to language models. Their positioning and features show how to serve enterprise use cases differently.
**What to watch for:**
- Model releases and capabilities
- Enterprise features (security, compliance, etc.)
- API pricing and access
- Industry-specific solutions
**Ignore unless:**
- Research-only announcements
- Partnership announcements without product changes
**Primary sources:**
- https://cohere.com/blog (feed_url: scrape)

---

## Lovable
**Category:** Developer & AI tooling
**Why we track them:** Fastest-growing AI app builder ($200M ARR, $6.6B valuation). Their rapid feature iteration and pricing decisions show what's working in the no-code/vibe-coding space. Direct signal for how non-developers build products with AI.
**What to watch for:**
- New capabilities (collaboration, AI features, integrations)
- Pricing and plan changes
- Workflow patterns (what kinds of apps users actually build)
- Enterprise features and adoption signals
- Developer experience improvements
**Ignore unless:**
- Marketing campaigns without product changes
- Generic AI hype content
**Primary sources:**
- https://lovable.dev/blog (feed_url: scrape)
- https://docs.lovable.dev/changelog

---

## Wispr Flow
**Category:** Consumer & productivity software
**Why we track them:** Leading voice-to-text AI tool for professionals ($81M raised, users at OpenAI, Vercel, Nvidia). Their product decisions show how AI changes input modalities and professional workflows.
**What to watch for:**
- Feature launches (new editing, language, or workflow capabilities)
- Platform expansions (new OS, mobile, integrations)
- Pricing changes
- Workflow patterns that reveal how users adopt voice-first AI
**Ignore unless:**
- Infrastructure or backend changes without user-facing implications
**Primary sources:**
- https://wisprflow.ai/blog (feed_url: scrape)
- https://roadmap.wisprflow.ai/ (feed_url: scrape)

---

## Windsurf (Codeium)
**Category:** Developer & AI tooling
**Why we track them:** Direct Cursor competitor with different architectural choices (Cascade agent, flow state model). Their product decisions provide contrast to Cursor and GitHub Copilot, showing what developers actually want from AI editors.
**What to watch for:**
- Editor feature launches and agent capabilities
- Model and provider integrations
- Pricing changes
- Enterprise features
- Developer workflow innovations
**Ignore unless:**
- Marketing-only announcements
**Primary sources:**
- https://windsurf.com/blog (feed_url: https://windsurf.com/feed.xml)

---

## Replit
**Category:** Developer & AI tooling
**Why we track them:** AI-first development environment with strong consumer and education reach. Their product decisions show how AI changes who can build software and what "development" means.
**What to watch for:**
- AI Agent and Ghostwriter feature launches
- Pricing and access changes (especially free tier)
- Deployment and hosting capabilities
- Mobile development patterns
- Enterprise or education features
**Ignore unless:**
- Infrastructure-only updates
- Community events without product implications
**Primary sources:**
- https://blog.replit.com (feed_url: https://blog.replit.com/feed.xml)

---

## Apple
**Category:** Consumer & AI platforms
**Why we track them:** Privacy-first, on-device AI strategy that's fundamentally different from every other company on this list. Apple Intelligence, Writing Tools, and their approach to running models on-device set the terms for how a billion-user consumer platform handles AI — and creates real constraints and opportunities for anyone building iOS or macOS products.
**What to watch for:**
- Apple Intelligence feature launches and expansions
- On-device model capabilities and what they unlock for third-party apps
- Siri improvements and agentic capabilities
- AI features in iOS, macOS, and core apps (Mail, Messages, Photos)
- Developer APIs for on-device AI (Core ML, Create ML)
- Privacy and data handling decisions that affect what AI features are possible
**Ignore unless:**
- Hardware launches without AI capability implications
- Marketing without product changes
**Primary sources:**
- https://www.apple.com/newsroom/ (feed_url: https://www.apple.com/newsroom/rss-feed.rss)
- https://developer.apple.com/news/releases/

---

## Amazon / AWS
**Category:** Foundation models / AI platforms
**Why we track them:** The enterprise AI infrastructure story. AWS Bedrock, Amazon Q, and Nova models are how a large chunk of enterprise AI gets built and deployed quietly — without the hype of OpenAI or Anthropic. Their pricing, model availability, and tooling decisions affect what enterprise PMs can actually ship.
**What to watch for:**
- AWS Bedrock model additions and pricing
- Amazon Q (dev assistant and business assistant) feature launches
- Nova model releases and capabilities
- SageMaker and ML infrastructure updates with product implications
- Enterprise AI feature launches in core AWS services
**Ignore unless:**
- Infrastructure-only announcements without product or developer implications
- Pure cloud pricing changes unrelated to AI
**Primary sources:**
- https://aws.amazon.com/blogs/machine-learning/ (feed_url: https://aws.amazon.com/blogs/machine-learning/feed/)
- https://aws.amazon.com/new/ (feed_url: https://aws.amazon.com/new/feed/)

---

## Salesforce
**Category:** Enterprise software
**Why we track them:** Agentforce is the most aggressive enterprise AI agent push from a major incumbent. Their approach to embedding AI agents into CRM workflows — and how enterprise buyers respond — is a live case study in what it takes to sell AI autonomy to large organizations.
**What to watch for:**
- Agentforce feature launches and capability expansions
- Einstein AI feature updates across Sales, Service, and Marketing clouds
- Pricing changes for AI features
- Enterprise adoption signals and customer case studies
- Integration patterns with other enterprise tools
**Ignore unless:**
- Generic CRM updates without AI implications
- Marketing campaigns without product changes
**Primary sources:**
- https://www.salesforce.com/blog/ (feed_url: scrape)
- https://help.salesforce.com/s/articleView?id=release-notes.salesforce_release_notes.htm

---

## Adobe
**Category:** Consumer & productivity software
**Why we track them:** Firefly and AI in Creative Cloud show how a legacy creative platform embeds AI without destroying its core UX. Their approach — generative credits, Content Credentials, copyright handling — is the template for any PM adding AI to a creative workflow.
**What to watch for:**
- Firefly model updates and new generation capabilities
- AI feature launches in Photoshop, Premiere, Acrobat, Express
- Pricing changes for AI features (generative credits model)
- Content Credentials and provenance tooling
- API and third-party integration launches
**Ignore unless:**
- Marketing campaigns without product changes
- Pure creative showcase without product implications
**Primary sources:**
- https://blog.adobe.com/ (feed_url: https://blog.adobe.com/en/feed)
- https://helpx.adobe.com/creative-cloud/release-notes.html

---

## Figma
**Category:** Developer & design tooling
**Why we track them:** AI features in the tool most product teams use daily. Their decisions about what AI to embed in design workflows — and what not to — directly affect how PMs and designers work together. Also a live case study in how a design tool navigates the tension between AI assistance and creative ownership.
**What to watch for:**
- AI feature launches (design suggestions, auto-layout, content generation)
- Figma Make and AI-assisted prototyping updates
- Pricing changes for AI features
- Dev Mode AI features and developer handoff improvements
- FigJam AI updates
**Ignore unless:**
- Infrastructure or performance updates without feature implications
- Marketing campaigns without product changes
**Primary sources:**
- https://www.figma.com/blog/ (feed_url: https://www.figma.com/blog/rss.xml)
- https://www.figma.com/release-notes/

---

## ElevenLabs
**Category:** Voice & audio AI
**Why we track them:** The Midjourney of voice — the tool people actually use when they want AI audio that sounds real. Their product decisions on voice cloning, multilingual support, and API access define the state of the art for anyone building voice-first features.
**What to watch for:**
- New voice model releases and quality improvements
- Voice cloning and custom voice features
- Multilingual and localization capabilities
- API pricing and access changes
- Product launches beyond TTS (dubbing, sound effects, audio generation)
- Enterprise features and integrations
**Ignore unless:**
- Marketing campaigns without product changes
**Primary sources:**
- https://elevenlabs.io/blog (feed_url: scrape)
- https://elevenlabs.io/changelog

---

## Slack
**Category:** Consumer & productivity software
**Why we track them:** AI features inside the tool where most product teams already live. Slack's AI decisions — summaries, search, huddle transcripts, workflow automation — show how a communication platform embeds AI without disrupting the core experience. Also a signal for how Salesforce AI strategy (Agentforce) gets distributed into daily workflows.
**What to watch for:**
- Slack AI feature launches (summaries, search, channel recaps)
- Workflow builder AI automation features
- Integration with Salesforce AI (Agentforce in Slack)
- Pricing changes for AI features
- Enterprise policy and admin controls for AI
**Ignore unless:**
- General Slack platform updates without AI implications
- Marketing campaigns
**Primary sources:**
- https://slack.com/blog (feed_url: scrape)
- https://slack.com/release-notes/

---

## The AI Daily Brief
**Category:** Media / Signal aggregation
**Why we track them:** Top-ranked daily AI podcast (#4 in US Technology). Nathaniel Whittemore surfaces product-relevant signals across the AI landscape daily — useful for catching launches and patterns that RSS feeds from tracked companies may miss.
**What to watch for:**
- Episodes covering shipped product changes from tracked companies
- Patterns or trends across multiple companies in a single week
- Product strategy analysis and market dynamics
**Ignore unless:**
- Pure news recap without analysis
- Speculative or hype-driven episodes
- Episodes covering only topics already covered in depth that week
**Primary sources:**
- https://aidailybrief.beehiiv.com/ (feed_url: scrape)

---
