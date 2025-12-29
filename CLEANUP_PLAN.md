# Modular Cleanup Plan

## Files to Remove or Deprecate

### 1. Old Duplicate Scripts (Replaced by Modular Versions)
These scripts have been replaced by modular versions in `scripts/`:
- ❌ `tooling/check-people-activity.js` → Use `scripts/check-people-activity.js`
- ❌ `tooling/check-company-updates.js` → Use `scripts/check-company-updates.js`
- ❌ `tooling/find-rss-feeds.js` → Use `scripts/find-rss-feeds.js`

**Action:** Add deprecation notices or remove after confirming new scripts work.

### 2. Old Test Files (Replaced by Jest Tests)
- ❌ `tooling/test-people-activity.js` - Old test file
- ❌ `tooling/test-quick.js` - Old test file

**Action:** Remove - we now have proper Jest tests in `src/**/__tests__/`

### 3. Temporary/Audit Files (Can Archive)
- 📦 `tooling/people-activity-audit-2025-12-28.md` - Historical audit report
- 📦 `tooling/people-md-cleanup-2025-12-28.md` - Historical cleanup report

**Action:** Move to `tooling/archive/` or remove if no longer needed.

## Files to Migrate to Modular Structure

### 4. Scripts That Should Be Modularized
- 🔄 `tooling/check-company-news.js` - News checking (not yet modularized)
  - Should create: `src/pipelines/company-news.js` + `scripts/check-company-news.js`
  
- 🔄 `tooling/verify-people-urls.js` - URL verification utility
  - Could create: `src/pipelines/verify-urls.js` + `scripts/verify-urls.js`
  
- 🔄 `tooling/fix-people-urls.js` - URL fixing utility
  - Could create: `src/pipelines/fix-urls.js` + `scripts/fix-urls.js`

### 5. Python Scripts (Decision Needed)
- ❓ `tooling/check-recent-posts.py` - Python version of people activity checking
  - **Option A:** Keep as alternative Python implementation
  - **Option B:** Migrate to use same modular JS code
  - **Option C:** Remove if JS version is sufficient

- ❓ `tooling/check-company-updates.py` - Python version of company updates
  - **Option A:** Keep as alternative Python implementation
  - **Option B:** Migrate to use same modular JS code
  - **Option C:** Remove if JS version is sufficient

- ❓ `tooling/audit-people-activity.py` - Audit script
  - Could be migrated or kept as Python utility

## Documentation Updates Needed

### 6. Documentation Files
- 📝 `tooling/README.md` - Update to reference new modular structure
- 📝 `tooling/COMPANY_UPDATES_GUIDE.md` - Update script references
- 📝 `tooling/PEOPLE_ACTIVITY_TRACKING.md` - Update if needed

## Recommended Cleanup Order

### Phase 1: Safe Removals (No Dependencies)
1. Remove old test files (`test-people-activity.js`, `test-quick.js`)
2. Archive or remove audit/cleanup reports
3. Add deprecation notices to old duplicate scripts

### Phase 2: Documentation Updates
4. Update `tooling/README.md` to reference new structure
5. Update `COMPANY_UPDATES_GUIDE.md` with new script paths
6. Add migration notes to guide users

### Phase 3: Optional Migrations (If Needed)
7. Migrate `check-company-news.js` to modular structure (if still used)
8. Migrate utility scripts (`verify-people-urls.js`, `fix-people-urls.js`) if needed
9. Decide on Python scripts (keep, migrate, or remove)

## Quick Wins

Immediate actions that are safe:
- ✅ Remove old test files
- ✅ Archive audit reports
- ✅ Add deprecation comments to old scripts
- ✅ Update documentation

