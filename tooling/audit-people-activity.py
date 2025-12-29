#!/usr/bin/env python3
"""
Audit people in context/people.md to check activity in last 30 days
Checks blog RSS feeds and attempts to check LinkedIn activity
"""

import re
import sys
import json
import argparse
from datetime import datetime, timedelta
from pathlib import Path

try:
    import feedparser
    import requests
except ImportError:
    print("Error: feedparser and requests required. Install with: pip install feedparser requests", file=sys.stderr)
    sys.exit(1)

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

def parse_people_file(people_file_path):
    """Parse people.md to extract person info."""
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
            'linkedin': None,
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
            elif 'LinkedIn:' in line or 'linkedin:' in line:
                match = re.search(r'https?://[^\s\)]+', line)
                if match:
                    person['linkedin'] = match.group(0)
            elif 'Twitter/X:' in line or 'Twitter:' in line or '@' in line:
                match = re.search(r'@[\w]+', line)
                if match:
                    person['twitter'] = match.group(0)
        
        people.append(person)
    
    return people

def check_rss_feed(feed_url, days_back=30):
    """Check RSS feed for recent posts."""
    try:
        response = requests.get(feed_url, timeout=10, headers={'User-Agent': 'Mozilla/5.0'}, verify=True)
        response.raise_for_status()
        
        feed = feedparser.parse(response.content)
        
        cutoff_date = datetime.now() - timedelta(days=days_back)
        recent_posts = []
        
        for entry in feed.entries[:10]:  # Check last 10 entries
            pub_date = None
            if hasattr(entry, 'published_parsed') and entry.published_parsed:
                pub_date = datetime(*entry.published_parsed[:6])
            elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                pub_date = datetime(*entry.updated_parsed[:6])
            
            if pub_date and pub_date >= cutoff_date:
                recent_posts.append({
                    'title': entry.get('title', 'Untitled'),
                    'link': entry.get('link', ''),
                    'published': pub_date.isoformat() if pub_date else None,
                })
        
        return recent_posts, None
    except Exception as e:
        return None, str(e)

def audit_person_activity(person, days_back=30):
    """Check activity for a single person."""
    result = {
        'name': person['name'],
        'blog_active': False,
        'blog_posts': [],
        'blog_error': None,
        'linkedin': person.get('linkedin'),
        'has_rss': bool(person.get('rss_feed')),
        'has_blog': bool(person.get('blog')),
    }
    
    # Check RSS feed
    if person.get('rss_feed'):
        posts, error = check_rss_feed(person['rss_feed'], days_back)
        if error:
            result['blog_error'] = error
        elif posts:
            result['blog_active'] = True
            result['blog_posts'] = posts
    
    # If no RSS feed but has blog, note that
    elif person.get('blog'):
        result['blog_error'] = "No RSS feed configured"
    
    return result

def main():
    parser = argparse.ArgumentParser(description='Audit people activity')
    parser.add_argument('--days', type=int, default=30, help='Number of days back to check (default: 30)')
    parser.add_argument('--people-file', type=str, 
                       default=str(PROJECT_ROOT / 'context' / 'people.md'),
                       help='Path to people.md file')
    
    args = parser.parse_args()
    
    people = parse_people_file(args.people_file)
    print(f"Auditing {len(people)} people for activity in last {args.days} days...\n")
    
    results = []
    for person in people:
        result = audit_person_activity(person, args.days)
        results.append(result)
    
    # Sort by activity status
    active = [r for r in results if r['blog_active']]
    inactive = [r for r in results if not r['blog_active']]
    
    print("=" * 80)
    print(f"ACTIVE PEOPLE ({len(active)}):\n")
    for result in active:
        print(f"✓ {result['name']}")
        print(f"  Blog posts: {len(result['blog_posts'])}")
        for post in result['blog_posts'][:3]:  # Show up to 3 recent posts
            print(f"    - {post['title'][:60]}... ({post['published'][:10]})")
            print(f"      {post['link']}")
        print()
    
    print("=" * 80)
    print(f"INACTIVE PEOPLE ({len(inactive)}):\n")
    
    # Group inactive by reason
    no_rss_no_blog = [r for r in inactive if not r['has_rss'] and not r['has_blog']]
    has_blog_no_rss = [r for r in inactive if r['has_blog'] and not r['has_rss']]
    has_rss_no_posts = [r for r in inactive if r['has_rss'] and not r['blog_active']]
    
    if has_rss_no_posts:
        print(f"No recent posts (have RSS feed):")
        for result in has_rss_no_posts:
            error_msg = f" ({result['blog_error']})" if result['blog_error'] else ""
            print(f"  - {result['name']}{error_msg}")
        print()
    
    if has_blog_no_rss:
        print(f"Has blog but no RSS feed configured:")
        for result in has_blog_no_rss:
            print(f"  - {result['name']} - {result.get('blog', 'N/A')}")
        print()
    
    if no_rss_no_blog:
        print(f"No blog or RSS feed configured:")
        linkedin = [r for r in no_rss_no_blog if r['linkedin']]
        no_linkedin = [r for r in no_rss_no_blog if not r['linkedin']]
        
        if linkedin:
            print(f"  Has LinkedIn ({len(linkedin)}):")
            for result in linkedin:
                print(f"    - {result['name']} - {result['linkedin']}")
            print()
        
        if no_linkedin:
            print(f"  No LinkedIn either ({len(no_linkedin)}):")
            for result in no_linkedin:
                print(f"    - {result['name']}")
        print()
    
    print("=" * 80)
    print(f"\nSummary:")
    print(f"  Total people: {len(results)}")
    print(f"  Active (blog posts in last {args.days} days): {len(active)}")
    print(f"  Inactive: {len(inactive)}")
    print(f"    - Has RSS, no recent posts: {len(has_rss_no_posts)}")
    print(f"    - Has blog, no RSS feed: {len(has_blog_no_rss)}")
    print(f"    - No blog/RSS configured: {len(no_rss_no_blog)}")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())

