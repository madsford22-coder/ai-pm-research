#!/usr/bin/env python3
"""
Check recent product updates from tracked companies in context/companies.md

This script:
1. Parses context/companies.md to find companies and their primary sources
2. Checks RSS feeds from company blogs (using feedparser, like check-recent-posts.py)
3. Outputs recent updates in markdown format

Note: Changelog scraping would require Puppeteer and is more complex.
For now, this focuses on RSS feeds which are more reliable.
"""

import re
import sys
import json
import argparse
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import urlparse

try:
    import feedparser
except ImportError:
    print("Error: feedparser not installed. Install with: pip install feedparser", file=sys.stderr)
    sys.exit(1)

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Error: requests or beautifulsoup4 not installed. Install with: pip install requests beautifulsoup4", file=sys.stderr)
    sys.exit(1)

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

def parse_companies_file(companies_file_path):
    """Parse companies.md to extract company info including blogs and changelogs."""
    companies = []
    
    # Known RSS feeds (can be expanded)
    known_feeds = {
        'LangChain / LangSmith': ['https://blog.langchain.dev/feed'],
        'GitHub': ['https://github.blog/feed/'],
    }
    
    with open(companies_file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split by company sections (## Name)
    sections = re.split(r'\n## ', content)
    
    for section in sections[1:]:  # Skip header
        lines = section.split('\n')
        name = lines[0].strip()
        
        company = {
            'name': name,
            'blogs': [],
            'rss_feeds': [],
            'changelogs': [],
            'category': None,
        }
        
        # Check for known RSS feeds
        if name in known_feeds:
            company['rss_feeds'] = known_feeds[name]
        
        # Extract category
        category_match = re.search(r'\*\*Category:\*\* (.+)', section)
        if category_match:
            company['category'] = category_match.group(1)
        
        # Extract primary sources
        in_primary_sources = False
        for line in lines:
            if '**Primary sources:**' in line:
                in_primary_sources = True
                continue
            if in_primary_sources:
                # Stop at next section or empty line after sources
                if line.strip() == '' and company['blogs']:
                    break
                if line.startswith('---'):
                    break
                
                # Extract URLs
                url_matches = re.findall(r'https?://[^\s\)]+', line)
                for url in url_matches:
                    clean_url = url.rstrip(')').rstrip(',')
                    
                    # Check if it's an RSS feed
                    if any(x in clean_url.lower() for x in ['/feed', '/rss', '/atom']):
                        company['rss_feeds'].append(clean_url)
                    # Categorize URLs
                    elif 'changelog' in clean_url.lower() or 'release-notes' in clean_url.lower() or 'docs/changelog' in clean_url.lower():
                        company['changelogs'].append(clean_url)
                    elif 'blog' in clean_url.lower() or 'news' in clean_url.lower() or 'updates' in clean_url.lower():
                        company['blogs'].append(clean_url)
                    elif 'twitter.com' in clean_url or 'x.com' in clean_url:
                        pass  # Skip Twitter for now
                    elif 'docs' not in clean_url.lower() or 'changelog' in clean_url.lower():
                        # Default to blog if not clearly a changelog
                        company['blogs'].append(clean_url)
        
        if company['blogs'] or company['changelogs'] or company['rss_feeds']:
            companies.append(company)
    
    return companies

def try_find_rss_feed(blog_url):
    """Try to find RSS feed URL from blog homepage."""
    common_rss_paths = [
        '/feed', '/feed.xml', '/rss', '/rss.xml', '/atom.xml', '/index.xml',
        '/blog/feed', '/blog/rss', '/blog/atom.xml',
        '/feeds/posts/default',  # Blogger
        '/feed/rss', '/feed/atom',
    ]
    
    try:
        response = requests.get(blog_url, timeout=10, headers={'User-Agent': 'Mozilla/5.0'})
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Look for RSS link in HTML - try multiple selectors
        rss_link = (soup.find('link', {'type': 'application/rss+xml'}) or 
                   soup.find('link', {'type': 'application/atom+xml'}) or
                   soup.find('link', {'type': 'text/xml'}) or
                   soup.find('a', href=re.compile(r'feed|rss|atom', re.I)))
        
        if rss_link:
            href = rss_link.get('href') or rss_link.get('href')
            if href:
                if href.startswith('http'):
                    return href
                else:
                    # Relative URL
                    parsed = urlparse(blog_url)
                    return f"{parsed.scheme}://{parsed.netloc}{href}"
        
        # Try common paths - check both HEAD and GET
        parsed = urlparse(blog_url)
        base_url = f"{parsed.scheme}://{parsed.netloc}"
        
        # Also try with blog path if blog_url has a path
        if parsed.path and parsed.path != '/':
            base_paths = [parsed.path, '/']
        else:
            base_paths = ['/']
        
        for base_path in base_paths:
            for path in common_rss_paths:
                test_url = base_url + base_path.rstrip('/') + path
                try:
                    # Try HEAD first
                    test_response = requests.head(test_url, timeout=5, allow_redirects=True)
                    if test_response.status_code == 200:
                        content_type = test_response.headers.get('content-type', '').lower()
                        if any(x in content_type for x in ['xml', 'rss', 'atom']):
                            return test_url
                    
                    # If HEAD doesn't work, try GET and check content
                    test_response = requests.get(test_url, timeout=5, allow_redirects=True)
                    if test_response.status_code == 200:
                        content = test_response.text[:500].lower()
                        if any(x in content for x in ['<rss', '<feed', '<?xml', 'atom']):
                            return test_url
                except:
                    continue
        
    except Exception as e:
        pass
    
    return None

def check_rss_feed(feed_url, days_back=7):
    """Check RSS feed for recent posts."""
    try:
        # Use requests to fetch the feed
        try:
            response = requests.get(feed_url, timeout=10, headers={'User-Agent': 'Mozilla/5.0'}, verify=True)
        except requests.exceptions.SSLError:
            import urllib3
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
            response = requests.get(feed_url, timeout=10, headers={'User-Agent': 'Mozilla/5.0'}, verify=False)
        
        response.raise_for_status()
        
        # Parse the feed content with feedparser
        feed = feedparser.parse(response.content)
        
        if feed.bozo and feed.bozo_exception:
            if 'not well-formed' not in str(feed.bozo_exception).lower():
                return None, f"RSS feed error: {feed.bozo_exception}"
        
        cutoff_date = datetime.now() - timedelta(days=days_back)
        recent_posts = []
        
        for entry in feed.entries[:15]:  # Check last 15 entries
            # Try to parse date
            pub_date = None
            if hasattr(entry, 'published_parsed') and entry.published_parsed:
                pub_date = datetime(*entry.published_parsed[:6])
            elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                pub_date = datetime(*entry.updated_parsed[:6])
            
            if pub_date and pub_date >= cutoff_date:
                post = {
                    'title': entry.get('title', 'Untitled'),
                    'link': entry.get('link', ''),
                    'published': pub_date.isoformat() if pub_date else None,
                    'summary': entry.get('summary', '')[:500],  # First 500 chars
                }
                recent_posts.append(post)
            elif not pub_date:
                # If no date, include it anyway (might be recent)
                post = {
                    'title': entry.get('title', 'Untitled'),
                    'link': entry.get('link', ''),
                    'published': None,
                    'summary': entry.get('summary', '')[:500],
                }
                recent_posts.append(post)
        
        return recent_posts, None
        
    except requests.exceptions.RequestException as e:
        return None, f"Error fetching RSS feed: {str(e)}"
    except Exception as e:
        return None, f"Error checking RSS feed: {str(e)}"

def check_company_updates(company, days_back=7):
    """Check recent updates for a company."""
    updates = []
    errors = []
    
    # Check known RSS feeds first
    for rss_feed in company.get('rss_feeds', []):
        posts, error = check_rss_feed(rss_feed, days_back)
        if error:
            errors.append(f"{rss_feed}: {error}")
        elif posts:
            for post in posts:
                updates.append({
                    **post,
                    'source': 'rss',
                    'source_url': rss_feed,
                })
    
    # Check blogs via RSS discovery
    for blog_url in company['blogs']:
        # Try to find RSS feed
        rss_feed = try_find_rss_feed(blog_url)
        if rss_feed:
            posts, error = check_rss_feed(rss_feed, days_back)
            if error:
                errors.append(f"{blog_url}: {error}")
            elif posts:
                for post in posts:
                    updates.append({
                        **post,
                        'source': 'blog',
                        'source_url': blog_url,
                    })
        else:
            # Only report as error if we don't have a known feed
            if not company.get('rss_feeds'):
                errors.append(f"{blog_url}: No RSS feed found")
    
    # Note: Changelog scraping would require Puppeteer
    # For now, we skip changelogs and focus on RSS feeds
    
    return updates, errors

def format_output(results, output_format='json'):
    """Format results for output."""
    if output_format == 'json':
        return json.dumps(results, indent=2, ensure_ascii=False)
    elif output_format == 'markdown':
        output = "# Recent Company Updates\n\n"
        for result in results:
            if result['updates']:
                output += f"## {result['name']}\n"
                if result['category']:
                    output += f"*Category: {result['category']}*\n\n"
                
                for update in result['updates']:
                    output += f"### {update['title']}\n"
                    output += f"**Link:** {update['link']}\n"
                    if update['published']:
                        output += f"**Published:** {update['published']}\n"
                    output += f"**Source:** {update['source']} ({update['source_url']})\n"
                    if update['summary']:
                        output += f"**Summary:** {update['summary']}\n"
                    output += "\n"
        return output
    else:
        return str(results)

def main():
    parser = argparse.ArgumentParser(description='Check recent updates from tracked companies')
    parser.add_argument('--days', type=int, default=7, help='Number of days back to check (default: 7)')
    parser.add_argument('--format', choices=['json', 'markdown'], default='markdown', help='Output format')
    parser.add_argument('--companies-file', type=str, 
                       default=str(PROJECT_ROOT / 'context' / 'companies.md'),
                       help='Path to companies.md file')
    
    args = parser.parse_args()
    
    # Parse companies file
    companies = parse_companies_file(args.companies_file)
    
    if not companies:
        print("No companies with blogs or changelogs found.", file=sys.stderr)
        return 1
    
    print(f"Checking company updates from last {args.days} days...\n")
    print(f"Found {len(companies)} companies with sources\n")
    
    # Check recent updates
    results = []
    for company in companies:
        print(f"Checking {company['name']}...")
        updates, errors = check_company_updates(company, days_back=args.days)
        
        results.append({
            'name': company['name'],
            'category': company['category'],
            'updates': updates,
            'errors': errors,
        })
        
        if updates:
            print(f"  ✓ Found {len(updates)} updates")
        if errors:
            print(f"  ⚠ {len(errors)} errors:")
            for error in errors[:2]:  # Show first 2 errors
                print(f"    - {error}")
    
    # Output results
    print("\n" + "="*60 + "\n")
    print(format_output(results, args.format))
    
    return 0

if __name__ == '__main__':
    sys.exit(main())

