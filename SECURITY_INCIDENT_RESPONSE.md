# Security Incident Response - Exposed OAuth2 Client Secret

**Date:** 2026-01-19  
**Issue:** Google OAuth2 Client Secret exposed in git history  
**Severity:** HIGH - Requires immediate action

## What Happened

GitGuardian detected that a Google OAuth2 client secret was committed to the repository and is present in git history, even though the file is now properly ignored.

**Exposed Secret:**
- File: `client_secret_967580641159-farn9cc7vo592ecum1i48dodhbfraf7b.apps.googleusercontent.com.json`
- Client ID: `967580641159-farn9cc7vo592ecum1i48dodhbfraf7b.apps.googleusercontent.com`
- Client Secret: `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`

## Immediate Actions Required

### 1. REVOKE THE OAUTH2 CREDENTIALS (CRITICAL - DO THIS FIRST!)

The secret is exposed and must be revoked immediately:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Find the OAuth 2.0 Client ID: `967580641159-farn9cc7vo592ecum1i48dodhbfraf7b`
4. **DELETE** or **REGENERATE** the credentials
5. Create new credentials if needed

**⚠️ Do this immediately - the secret is compromised!**

### 2. Remove from Git History

Even though the file is now ignored, it still exists in git history. We need to remove it:

```bash
# Option 1: Use git filter-branch (removes from all history)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch client_secret_*.json" \
  --prune-empty --tag-name-filter cat -- --all

# Option 2: Use BFG Repo-Cleaner (faster, easier)
# First download BFG: https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --delete-files client_secret_*.json
git reflog expire --expire=now --all && git gc --prune=now --aggressive

# After either method:
git push origin --force --all
```

### 3. Verify Removal

```bash
# Check if file still exists in history
git log --all --full-history -- "client_secret*.json"

# Should return nothing if successful
```

### 4. Update Local Files

After revoking credentials:
1. Delete the local file: `rm client_secret_*.json`
2. Generate new credentials in Google Cloud Console
3. Download new credentials to `.gmail-credentials.json` (not client_secret)
4. Re-authenticate: `node scripts/complete-gmail-auth.js`

## Why This Happened

The file was committed before being added to `.gitignore`. Even though it's now ignored, the commit history still contains it.

## Prevention

✅ **Already in place:**
- `.gitignore` properly configured: `client_secret_*.json`
- File is now ignored

✅ **Best practices going forward:**
- Never commit credential files directly
- Use `.env` files for secrets (already configured)
- Use environment variables in code (already done)
- Consider using secrets management tools

## Status

- ⚠️ **Secret exposed** - Needs immediate revocation
- ✅ **File currently ignored** - Not being tracked
- ⚠️ **Still in git history** - Needs removal from history
- ⚠️ **Force push required** - To remove from remote

## Next Steps

1. **REVOKE credentials** in Google Cloud Console (CRITICAL)
2. Remove file from git history
3. Force push to GitHub
4. Regenerate OAuth2 credentials
5. Re-authenticate email system
