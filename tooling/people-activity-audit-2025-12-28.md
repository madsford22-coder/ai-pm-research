# People Activity Audit - December 28, 2025

**Audit Date:** 2025-12-28  
**Period:** Last 30 days  
**Total People Tracked:** 35

---

## Summary

- **Active (blog posts in last 30 days):** 3 (9%)
- **Inactive:** 32 (91%)
  - Has RSS feed, no recent posts: 9
  - Has blog, no RSS feed: 4
  - No blog/RSS configured: 19

---

## Active People (3)

### ✅ Lenny Rachitsky
- **Posts in last 30 days:** 10
- **Most recent:** Dec 28, 2025
- **RSS Feed:** ✅ Working
- **Primary platform:** Newsletter (Lenny's Newsletter)
- **Status:** Highly active, consistent posting

### ✅ Marty Cagan
- **Posts in last 30 days:** 2
- **Most recent:** Dec 19, 2025
- **RSS Feed:** ✅ Working
- **Primary platform:** Blog (SVPG)
- **Status:** Active, regular posting

### ✅ Teresa Torres
- **Posts in last 30 days:** 9
- **Most recent:** Dec 18, 2025
- **RSS Feed:** ✅ Working
- **Primary platform:** Blog (ProductTalk)
- **Status:** Highly active, consistent posting

---

## Inactive People by Category

### Has RSS Feed, No Recent Posts (9)

These people have working RSS feeds but haven't posted in the last 30 days:

1. **Shreyas Doshi**
   - RSS: https://shreyas.io/feed
   - Last checked: No posts in last 30 days
   - **Note:** Primary platform is Twitter/X (@shreyas)

2. **Gibson Biddle**
   - RSS: https://gibsonbiddle.com/feed ❌ (404 error)
   - **Issue:** RSS feed URL returns 404
   - **Action needed:** Verify RSS feed URL or find correct feed

3. **Andrew Chen**
   - RSS: https://andrewchen.com/feed/
   - Last checked: No posts in last 30 days
   - **Note:** Primary platform is Twitter/X (@andrewchen)

4. **Brian Balfour**
   - RSS: https://www.reforge.com/podcast/unsolicited-feedback
   - Last checked: No posts in last 30 days
   - **Note:** May be podcast feed, not blog feed

5. **Ken Norton**
   - RSS: https://www.bringthedonuts.com/feed.xml
   - Last checked: No posts in last 30 days
   - **Note:** Posts infrequently

6. **Lara Hogan**
   - RSS: https://larahogan.me/feed.xml
   - Last checked: No posts in last 30 days

7. **Sam Altman**
   - RSS: https://blog.samaltman.com/posts.atom
   - Last checked: No posts in last 30 days
   - **Note:** Primary platform is Twitter/X (@sama), posts infrequently on blog

8. **Geoffrey Litt**
   - RSS: https://www.geoffreylitt.com/feed.xml
   - Last checked: No posts in last 30 days

9. **Paul Graham**
   - RSS: http://www.aaronsw.com/2002/feeds/pgessays.rss
   - Last checked: No posts in last 30 days
   - **Note:** Posts very infrequently (essays)

---

### Has Blog, No RSS Feed Configured (4)

These people have blogs but no RSS feed is configured in people.md:

1. **Ravi Mehta**
   - Blog: https://ravi-mehta.com
   - **Action needed:** Try to find RSS feed using find-rss-feeds.js

2. **Julie Zhuo**
   - Blog: https://medium.com/@joulee
   - **Note:** Medium blogs typically have RSS feeds
   - **Action needed:** Find RSS feed URL

3. **Julie Zhou**
   - Blog: https://juliezhuo.com
   - **Action needed:** Try to find RSS feed using find-rss-feeds.js

4. **Melissa Perri**
   - Blog: https://melissaperri.com
   - **Action needed:** Try to find RSS feed using find-rss-feeds.js

---

### No Blog or RSS Feed Configured (19)

These people are tracked primarily through Twitter/X or other platforms:

#### Has LinkedIn Profile (2)

1. **Dan Shipper**
   - LinkedIn: https://www.linkedin.com/in/danshipper/
   - **Primary platform:** Twitter/X (@danshipper), Newsletter (Every.to)
   - **Note:** Newsletter may have RSS feed not configured

2. **Ben Tossell**
   - LinkedIn: https://www.linkedin.com/in/bentossell/
   - **Primary platform:** Twitter/X (@bentossell), Newsletter (Ben's Bites)
   - **Note:** Newsletter may have RSS feed not configured

#### No LinkedIn Listed (17)

All primarily Twitter/X-based thought leaders:

1. **Dario Amodei** (@darioamodei)
2. **Amjad Masad** (@amasad)
3. **Ammaar Reshi** (@ammaar)
4. **Patrick Collison** (@patrickc)
5. **Raza Habib** (@raza_habib)
6. **Jason Boehmig** (@jasonboehmig)
7. **Harrison Chase** (@hwchase17)
8. **Aravind Srinivas** (@AravSrinivas)
9. **Noam Shazeer** (@noam_shazeer)
10. **Zachary Lipton** (@zacharylipton)
11. **Sarah Guo** (@saranormous)
12. **Roon** (@tszzl)
13. **Alex Graveley** (@alexgraveley)
14. **Clement Delangue** (@ClementDelangue)
15. **Emad Mostaque** (@EMostaque)
16. **Nat Friedman** (@natfriedman)
17. **Marc Andreessen** (@pmarca)

**Note:** These are all active on Twitter/X but we don't currently track Twitter activity.

---

## Recommendations

### High Priority

1. **Fix broken RSS feeds:**
   - Gibson Biddle: RSS feed URL returns 404, needs verification/fix

2. **Find RSS feeds for blogs without feeds:**
   - Run `find-rss-feeds.js` to discover RSS feeds for:
     - Ravi Mehta
     - Julie Zhou
     - Melissa Perri
   - Check if Medium RSS feed exists for Julie Zhuo

3. **Consider Twitter/X tracking:**
   - 19 people (54%) are primarily Twitter/X-based
   - Consider if we should add Twitter/X API integration or remove inactive Twitter-only people

### Medium Priority

4. **Verify newsletter RSS feeds:**
   - Dan Shipper (Every.to newsletter)
   - Ben Tossell (Ben's Bites newsletter)
   - Most newsletters have RSS feeds that could be configured

5. **Review inactive blog authors:**
   - Some people (Paul Graham, Sam Altman) post very infrequently but when they do, posts are high-signal
   - Consider if we should keep them despite low frequency

### Low Priority

6. **Review list composition:**
   - Currently 9% active (3/35)
   - Consider if we should focus more on active blog/newsletter authors vs. Twitter-only people
   - Consider removing people who haven't posted in 6+ months if they don't have RSS feeds

---

## Next Steps

1. Run `tooling/find-rss-feeds.js` to find RSS feeds for people with blogs but no feeds
2. Verify and fix Gibson Biddle's RSS feed URL
3. Consider adding newsletter RSS feeds (Every.to, Ben's Bites)
4. Decide on Twitter/X tracking strategy
5. Review whether to keep or remove inactive Twitter-only people

