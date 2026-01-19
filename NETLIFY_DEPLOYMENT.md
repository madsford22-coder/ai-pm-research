# Netlify Deployment Guide

This guide will help you deploy your AI PM Research web app to Netlify with automatic deployments on every commit.

## Overview

The web app is built with Next.js 14 and automatically reads your daily updates from `/updates/daily/`. Every time you push a new commit with updated markdown files, Netlify will automatically rebuild and redeploy your site.

## Prerequisites

1. A [Netlify account](https://app.netlify.com/signup) (free tier works great)
2. Your GitHub repository (this repo)
3. Node.js 18+ installed locally (for testing)

## Step 1: Connect to Netlify

### Option A: Deploy via Netlify UI (Recommended for first-time setup)

1. Log into [Netlify](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Choose "GitHub" as your Git provider
4. Authorize Netlify to access your repositories
5. Select the `ai-pm-research` repository
6. Configure build settings:
   - **Base directory**: `web`
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Node version**: 18 or higher

7. Click "Deploy site"

### Option B: Deploy via Netlify CLI

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login to Netlify
netlify login

# Navigate to your project
cd /Users/madisonford/Documents/ai-pm-research

# Initialize Netlify site
netlify init

# Follow the prompts:
# - Create & configure a new site
# - Choose your team
# - Site name: (e.g., ai-pm-research)
# - Build command: npm run build
# - Directory to deploy: web/.next
# - Base directory: web
```

## Step 2: Configure Environment Variables (Optional)

If you want to customize the RSS feed URL or other settings:

1. In Netlify dashboard, go to "Site settings" → "Environment variables"
2. Add the following variables:
   - `SITE_URL`: Your production URL (e.g., `https://ai-pm-research.netlify.app`)
   - `NODE_VERSION`: `18.0.0` (or higher)

## Step 3: Verify Deployment

After deployment completes:

1. **Visit your site**: Netlify will provide a URL like `https://your-site-name.netlify.app`
2. **Check the RSS feed**: Visit `https://your-site-name.netlify.app/rss.xml`
3. **Test navigation**: Browse through your daily updates
4. **Test search**: Use the search bar to find specific content

## Step 4: Custom Domain (Optional)

To use a custom domain:

1. In Netlify dashboard, go to "Domain management"
2. Click "Add a domain"
3. Follow instructions to configure DNS settings
4. Update the `SITE_URL` environment variable with your custom domain

## How Automatic Deployments Work

Once connected to Netlify:

1. **You commit new daily updates** to your repository:
   ```bash
   git add updates/daily/2026/2026-01-19.md
   git commit -m "Add daily update for Jan 19"
   git push
   ```

2. **Netlify automatically detects** the new commit via GitHub webhook

3. **Netlify runs the build**:
   - Installs dependencies: `npm install`
   - Builds the Next.js app: `npm run build`
   - Reads all markdown files from `/updates/daily/`
   - Generates static pages for each update

4. **Your site is live** with the new content (usually within 2-3 minutes)

## RSS Feed

Your RSS feed is automatically generated at `/rss.xml` and includes:
- Last 20 daily updates
- Title, description, and publication date
- Tags as categories
- Full permalinks to each update

Subscribe to your RSS feed: `https://your-site-name.netlify.app/rss.xml`

## File Structure

The web app configuration includes:

```
ai-pm-research/
├── netlify.toml              # Netlify configuration
├── updates/daily/            # Your daily markdown updates
│   └── 2026/
│       └── 2026-01-19.md
└── web/                      # Next.js web app
    ├── app/
    │   ├── [[...slug]]/      # Dynamic routing for markdown pages
    │   ├── rss.xml/          # RSS feed generator
    │   └── layout.tsx        # Main layout with sidebar and search
    ├── components/           # React components
    ├── lib/content/          # Content loading and parsing
    └── package.json
```

## Troubleshooting

### Build fails with "Module not found"
- Check that all imports use the correct path alias (`@/lib/...` not `@/web/lib/...`)
- Verify `tsconfig.json` has the correct path mappings

### No content showing on deployed site
- Ensure `/updates/daily/` directory exists and contains markdown files
- Check the build logs to verify files are being read
- Verify frontmatter format in your markdown files

### RSS feed is empty
- Check that your markdown files follow the naming pattern: `YYYY/YYYY-MM-DD.md`
- Verify each file has a `date` field in the frontmatter

### Changes not appearing after deploy
- Check Netlify deploy logs for errors
- Clear your browser cache
- Verify the commit was pushed to the correct branch (main)

## Build Status Badge (Optional)

Add a build status badge to your README:

```markdown
[![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR-SITE-ID/deploy-status)](https://app.netlify.com/sites/YOUR-SITE-NAME/deploys)
```

Replace `YOUR-SITE-ID` and `YOUR-SITE-NAME` with your actual values from Netlify.

## Next Steps

Once deployed:

1. **Test your automation** - Let your daily cron job run and verify updates appear on the site
2. **Set up email notifications** - Configure to receive deploy notifications
3. **Monitor analytics** - Enable Netlify Analytics to track visitors
4. **Share your RSS feed** - Add it to your email signature or share with colleagues

## Support

- **Netlify Docs**: https://docs.netlify.com/
- **Next.js Docs**: https://nextjs.org/docs
- **Your site logs**: Available in Netlify dashboard under "Deploys"

---

**Ready to deploy?** Follow Step 1 above to get started!
