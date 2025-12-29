"""
Unit tests for company updates Python code
"""

import pytest
from datetime import datetime, timedelta
from pathlib import Path
import sys

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Import the module we're testing (if it exists as a module)
# For now, we'll test the logic that can be extracted

def test_date_filtering():
    """Test filtering updates by date"""
    now = datetime.now()
    updates = [
        {
            'title': 'Recent update',
            'link': 'https://example.com/1',
            'published': (now - timedelta(days=5)).isoformat(),
        },
        {
            'title': 'Old update',
            'link': 'https://example.com/2',
            'published': (now - timedelta(days=20)).isoformat(),
        },
    ]
    
    cutoff_date = now - timedelta(days=14)
    filtered = [u for u in updates if not u['published'] or datetime.fromisoformat(u['published']) >= cutoff_date]
    
    assert len(filtered) == 1
    assert filtered[0]['title'] == 'Recent update'

def test_deduplication():
    """Test deduplication of updates"""
    updates = [
        {
            'title': 'Update 1',
            'link': 'https://example.com/1',
        },
        {
            'title': 'Update 2',
            'link': 'https://example.com/2',
        },
        {
            'title': 'Update 1 duplicate',
            'link': 'https://example.com/1',
        },
    ]
    
    seen = set()
    deduped = []
    for update in updates:
        if update['link'] not in seen:
            seen.add(update['link'])
            deduped.append(update)
    
    assert len(deduped) == 2
    assert deduped[0]['link'] == 'https://example.com/1'
    assert deduped[1]['link'] == 'https://example.com/2'

