# gICM Security Backlog

> **Last Updated:** 2025-11-30
> **Status:** Active vulnerabilities requiring fixes

---

## CRITICAL - Immediate Action Required

### 1. SQL Injection Vulnerability
- **File:** `packages/activity-logger/src/db/sqlite.ts`
- **Lines:** 273, 307, 401
- **Issue:** Dynamic SQL query construction with string interpolation
- **Fix:** Use parameterized queries exclusively
- **Status:** [ ] Pending

### 2. API Authentication Bypass
- **File:** `services/ai-hedge-fund/src/api/routes.py`
- **Lines:** 49-60
- **Issue:** No API key = dev mode allows open access
- **Fix:** Remove dev-mode fallback, require API key always
- **Status:** [ ] Pending

### 3. Clean Git History
- **Issue:** `.env` may have been committed previously
- **Fix:** Run `git filter-repo --path .env --invert-paths`
- **Status:** [ ] Pending

### 4. Update Vulnerable Dependencies
- **Issue:** `glob` (command injection), `js-yaml` (prototype pollution)
- **Fix:** Run `pnpm audit fix`
- **Status:** [ ] Pending

---

## HIGH - Fix This Week

### 5. Weak Analytics Authentication
- **File:** `src/app/api/analytics/auth/route.ts`
- **Issue:** Plaintext password comparison, no rate limiting
- **Fix:** Add bcrypt hashing + rate limiting (5 attempts/hour)
- **Status:** [ ] Pending

### 6. XSS Vulnerability
- **File:** `src/components/molecules/model-showcase.tsx`
- **Line:** 152
- **Issue:** `dangerouslySetInnerHTML` without sanitization
- **Fix:** Use DOMPurify to sanitize HTML
- **Status:** [ ] Pending

### 7. XSS in react-grab
- **File:** `packages/react-grab/src/ui/suggestion-panel.ts`
- **Line:** 46
- **Issue:** Direct `innerHTML` assignment
- **Fix:** Use `createElement` and `textContent`
- **Status:** [ ] Pending

### 8. Missing Rate Limiting
- **Files:** All API endpoints
- **Issue:** No rate limiting on expensive operations
- **Fix:** Implement rate limiting middleware
- **Status:** [ ] Pending

### 9. Unsafe Environment Variable Defaults
- **Files:** Multiple
- **Issue:** Empty string defaults allow silent failures
- **Fix:** Fail fast if required env vars missing
- **Status:** [ ] Pending

---

## MEDIUM - Fix This Month

### 10. CORS Configuration
- **File:** `services/ai-hedge-fund/src/api/app.py`
- **Issue:** Could be misconfigured to allow `*` with credentials
- **Fix:** Validate ALLOWED_ORIGINS format
- **Status:** [ ] Pending

### 11. Missing Input Validation
- **File:** `services/ai-hedge-fund/src/api/routes.py`
- **Line:** 254
- **Issue:** Path parameter `token` not validated
- **Fix:** Add Pydantic validation with regex pattern
- **Status:** [ ] Pending

### 12. No Request Size Limits
- **Files:** API route handlers
- **Issue:** No limits on request body size
- **Fix:** Add FastAPI middleware for request size limits
- **Status:** [ ] Pending

### 13. Logging Sensitive Data
- **File:** `packages/money-engine/src/cli.ts`
- **Issue:** Logs reveal wallet key format information
- **Fix:** Use generic messages, never log key material
- **Status:** [ ] Pending

---

## LOW - Best Practice

### 14. Weak Test API Keys
- **Files:** Test files
- **Fix:** Generate random keys for tests
- **Status:** [ ] Pending

### 15. No HTTPS Enforcement
- **Files:** API configurations
- **Fix:** Add HTTPS redirect middleware for production
- **Status:** [ ] Pending

### 16. Missing Security Headers
- **Files:** API servers
- **Fix:** Add X-Content-Type-Options, X-Frame-Options, CSP
- **Status:** [ ] Pending

---

## Completed

_None yet_

---

## Long-term Recommendations

1. **Secret Management:** Use AWS Secrets Manager / HashiCorp Vault
2. **Security Automation:** Enable Dependabot, add pre-commit hooks for secret scanning
3. **Regular Audits:** Quarterly security reviews
4. **Monitoring:** Set up alerts for suspicious activity
