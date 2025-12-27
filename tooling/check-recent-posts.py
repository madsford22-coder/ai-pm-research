#!/usr/bin/env python3
"""
Check recent blog posts from tracked people in context/people.md

This script:
1. Parses context/people.md to find people with RSS feeds or blogs
2. Checks RSS feeds for recent posts (last 7 days by default)
3. Outputs recent posts in a format suitable for daily research
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

def parse_people_file(people_file_path):
    """Parse people.md to extract person info including RSS feeds and blogs."""
    people = []
    
    with open(people_file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split by person sections (## Name)
    sections = re.split(r'\n## ', content)
    
    for section in sections[1:]:  # Skip header
        lines = section.split('\n')
        name = lines[0].strip()
        
        person = {
            'name': name,
            'blog': None,
            'rss_feed': None,
            'newsletter': None,
            'twitter': None,
        }
        
        # Extract fields
        for line in lines:
            if 'Blog:' in line or 'blog:' in line:
                match = re.search(r'https?://[^\s\)]+', line)
                if match:
                    person['blog'] = match.group(0)
            elif 'RSS Feed:' in line or 'rss feed:' in line or 'RSS:' in line:
                match = re.search(r'https?://[^\s\)]+', line)
                if match:
                    person['rss_feed'] = match.group(0).rstrip(')')
            elif 'Newsletter:' in line or 'newsletter:' in line:
                match = re.search(r'https?://[^\s\)]+', line)
                if match:
                    person['newsletter'] = match.group(0)
            elif 'Twitter/X:' in line or 'Twitter:' in line:
                match = re.search(r'@[\w]+', line)
                if match:
                    person['twitter'] = match.group(0)
        
        if person['blog'] or person['rss_feed'] or person['newsletter']:
            people.append(person)
    
    return people

def check_rss_feed(feed_url, days_back=7):
    """Check RSS feed for recent posts."""
    try:
        feed = feedparser.parse(feed_url)
        
        if feed.bozo:
            return None, f"RSS feed error: {feed.bozo_exception}"
        
        cutoff_date = datetime.now() - timedelta(days=days_back)
        recent_posts = []
        
        for entry in feed.entries[:10]:  # Check last 10 entries
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
        
        return recent_posts, None
        
    except Exception as e:
        return None, f"Error checking RSS feed: {str(e)}"

def try_find_rss_feed(blog_url):
    """Try to find RSS feed URL from blog homepage."""
    common_rss_paths = ['/feed', '/feed.xml', '/rss', '/rss.xml', '/atom.xml', '/index.xml']
    
    try:
        response = requests.get(blog_url, timeout=10, headers={'User-Agent': 'Mozilla/5.0'})
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Look for RSS link in HTML
        rss_link = soup.find('link', {'type': 'application/rss+xml'}) or \
                   soup.find('link', {'type': 'application/atom+xml'})
        
        if rss_link and rss_link.get('href'):
            href = rss_link.get('href')
            if href.startswith('http'):
                return href
            else:
                # Relative URL
                parsed = urlparse(blog_url)
                return f"{parsed.scheme}://{parsed.netloc}{href}"
        
        # Try common paths
        parsed = urlparse(blog_url)
        base_url = f"{parsed.scheme}://{parsed.netloc}"
        
        for path in common_rss_paths:
            test_url = base_url + path
            try:
                test_response = requests.head(test_url, timeout=5)
                if test_response.status_code == 200:
                    content_type = test_response.headers.get('content-type', '')
                    if 'xml' in content_type or 'rss' in content_type or 'atom' in content_type:
                        return test_url
            except:
                continue
        
    except Exception as e:
        pass
    
    return None

def check_recent_posts(people, days_back=7, output_format='json'):
    """Check recent posts from all people."""
    results = []
    
    for person in people:
        name = person['name']
        recent_posts = []
        errors = []
        
        # Try RSS feed first
        if person['rss_feed']:
            posts, error = check_rss_feed(person['rss_feed'], days_back)
            if error:
                errors.append(error)
            elif posts:
                recent_posts.extend(posts)
        
        # If no RSS feed but has blog, try to find RSS feed
        elif person['blog']:
            found_rss = try_find_rss_feed(person['blog'])
            if found_rss:
                posts, error = check_rss_feed(found_rss, days_back)
                if error:
                    errors.append(error)
                elif posts:
                    recent_posts.extend(posts)
        
        if recent_posts or errors:
            results.append({
                'name': name,
                'posts': recent_posts,
                'errors': errors,
                'sources_checked': {
                    'rss_feed': person.get('rss_feed'),
                    'blog': person.get('blog'),
                    'newsletter': person.get('newsletter'),
                }
            })
    
    return results

def format_output(results, output_format='json'):
    """Format results for output."""
    if output_format == 'json':
        return json.dumps(results, indent=2, ensure_ascii=False)
    elif output_format == 'markdown':
        output = "# Recent Posts from Tracked People\n\n"
        for result in results:
            if result['posts']:
                output += f"## {result['name']}\n\n"
                for post in result['posts']:
                    output += f"### {post['title']}\n"
                    output += f"**Link:** {post['link']}\n"
                    if post['published']:
                        output += f"**Published:** {post['published']}\n"
                    if post['summary']:
                        output += f"**Summary:** {post['summary']}\n"
                    output += "\n"
        return output
    else:
        return str(results)

def main():
    parser = argparse.ArgumentParser(description='Check recent posts from tracked people')
    parser.add_argument('--days', type=int, default=7, help='Number of days back to check (default: 7)')
    parser.add_argument('--format', choices=['json', 'markdown'], default='json', help='Output format')
    parser.add_argument('--people-file', type=str, 
                       default=str(PROJECT_ROOT / 'context' / 'people.md'),
                       help='Path to people.md file')
    
    args = parser.parse_args()
    
    # Parse people file
    people = parse_people_file(args.people_file)
    
    if not people:
        print("No people with blogs or RSS feeds found.", file=sys.stderr)
        return 1
    
    # Check recent posts
    results = check_recent_posts(people, days_back=args.days, output_format=args.format)
    
    # Output results
    print(format_output(results, args.format))
    
    return 0

if __name__ == '__main__':
    sys.exit(main())

