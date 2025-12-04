# Authentication & Security Expert

> **ID:** `auth-security`
> **Tier:** 3
> **Token Cost:** 6000
> **MCP Connections:** supabase

## 🎯 What This Skill Does

You are an expert in authentication, authorization, and web security. You understand OAuth 2.0, OpenID Connect, JWT handling, session management, CSRF/XSS protection, security headers, and modern authentication patterns.

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** auth, oauth, jwt, security, session, csrf, xss, login, authentication, authorization
- **File Types:** `.env`, `middleware.ts`, `auth.ts`
- **Directories:** `auth/`, `middleware/`, `security/`

## 🚀 Core Capabilities

### 1. Implement OAuth 2.0 / OIDC

**OAuth 2.0 Flow Types:**

```typescript
// Authorization Code Flow (most secure for web apps)
// 1. Redirect user to provider
// 2. Provider redirects back with authorization code
// 3. Exchange code for access token
// 4. Use access token to access resources

// PKCE (Proof Key for Code Exchange) - Required for SPAs
import crypto from 'crypto'

function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url')
}

function generateCodeChallenge(verifier: string): string {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url')
}

// OAuth client configuration
interface OAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  authorizationEndpoint: string
  tokenEndpoint: string
  scope: string[]
}

// Build authorization URL
function buildAuthUrl(config: OAuthConfig): { url: string; verifier: string } {
  const verifier = generateCodeVerifier()
  const challenge = generateCodeChallenge(verifier)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope.join(' '),
    state: crypto.randomBytes(16).toString('hex'), // CSRF protection
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })

  return {
    url: `${config.authorizationEndpoint}?${params}`,
    verifier,
  }
}

// Exchange code for token
async function exchangeCodeForToken(
  config: OAuthConfig,
  code: string,
  verifier: string
): Promise<{ access_token: string; refresh_token?: string; id_token?: string }> {
  const response = await fetch(config.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code_verifier: verifier,
    }),
  })

  if (!response.ok) {
    throw new Error('Token exchange failed')
  }

  return response.json()
}
```

**OpenID Connect (OIDC):**

```typescript
import { jwtVerify, importJWK } from 'jose'

interface OIDCConfig extends OAuthConfig {
  issuer: string
  jwksUri: string
}

// Verify ID token
async function verifyIdToken(
  token: string,
  config: OIDCConfig
): Promise<{
  sub: string
  email?: string
  email_verified?: boolean
  name?: string
  picture?: string
}> {
  // Fetch JWKS
  const jwksResponse = await fetch(config.jwksUri)
  const jwks = await jwksResponse.json()

  // Get signing key
  const key = jwks.keys[0]
  const publicKey = await importJWK(key, key.alg)

  // Verify token
  const { payload } = await jwtVerify(token, publicKey, {
    issuer: config.issuer,
    audience: config.clientId,
  })

  return payload as any
}

// Get user info from userinfo endpoint
async function getUserInfo(accessToken: string, userinfoEndpoint: string) {
  const response = await fetch(userinfoEndpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch user info')
  }

  return response.json()
}
```

**Next.js OAuth Implementation:**

```typescript
// app/api/auth/[provider]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const GOOGLE_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  scope: ['openid', 'email', 'profile'],
}

// Login endpoint
export async function GET(request: NextRequest) {
  const { url, verifier } = buildAuthUrl(GOOGLE_CONFIG)

  // Store verifier in secure HTTP-only cookie
  cookies().set('oauth_verifier', verifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
  })

  return NextResponse.redirect(url)
}

// Callback endpoint
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect('/login?error=oauth_failed')
  }

  if (!code) {
    return NextResponse.redirect('/login?error=missing_code')
  }

  // Get verifier from cookie
  const verifier = cookies().get('oauth_verifier')?.value

  if (!verifier) {
    return NextResponse.redirect('/login?error=missing_verifier')
  }

  try {
    // Exchange code for token
    const tokens = await exchangeCodeForToken(GOOGLE_CONFIG, code, verifier)

    // Verify ID token
    const user = await verifyIdToken(tokens.id_token!, {
      ...GOOGLE_CONFIG,
      issuer: 'https://accounts.google.com',
      jwksUri: 'https://www.googleapis.com/oauth2/v3/certs',
    })

    // Create session
    // ... session creation logic

    // Clean up verifier cookie
    cookies().delete('oauth_verifier')

    return NextResponse.redirect('/dashboard')
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect('/login?error=callback_failed')
  }
}
```

**Best Practices:**
- Always use PKCE for public clients (SPAs, mobile apps)
- Validate state parameter to prevent CSRF
- Use HTTP-only cookies for storing sensitive tokens
- Implement token refresh flow
- Validate ID tokens before trusting claims
- Use short-lived access tokens (15-60 minutes)
- Store refresh tokens securely
- Implement proper error handling

**Gotchas:**
- Never expose client secret in client-side code
- PKCE required for SPAs since 2023
- State parameter must be validated
- Token endpoint requires client authentication
- ID tokens are JWTs and must be validated
- Refresh tokens can be long-lived (30+ days)

### 2. JWT Handling Best Practices

**JWT Structure & Security:**

```typescript
import { SignJWT, jwtVerify } from 'jose'
import crypto from 'crypto'

// Generate secure secret
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex')
)

interface TokenPayload {
  sub: string // Subject (user ID)
  email: string
  role: string
  iat?: number // Issued at
  exp?: number // Expiration
  jti?: string // JWT ID (for revocation)
}

// Sign JWT
async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m') // Short-lived access tokens
    .setJti(crypto.randomUUID()) // Unique ID for revocation
    .sign(JWT_SECRET)
}

// Verify JWT
async function verifyToken(token: string): Promise<TokenPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as TokenPayload
  } catch (error) {
    if (error.code === 'ERR_JWT_EXPIRED') {
      throw new Error('Token expired')
    }
    throw new Error('Invalid token')
  }
}

// Refresh token (longer-lived, stored securely)
async function createRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .setJti(crypto.randomUUID())
    .sign(JWT_SECRET)
}

// Verify and rotate refresh token
async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string
  refreshToken: string
}> {
  const { payload } = await jwtVerify(refreshToken, JWT_SECRET)

  if (payload.type !== 'refresh') {
    throw new Error('Invalid token type')
  }

  // Check if token is revoked (check database)
  const isRevoked = await checkTokenRevocation(payload.jti!)
  if (isRevoked) {
    throw new Error('Token revoked')
  }

  // Get user from database
  const user = await getUserById(payload.sub!)

  // Create new tokens
  const newAccessToken = await signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  })

  // Optionally rotate refresh token
  const newRefreshToken = await createRefreshToken(user.id)

  // Revoke old refresh token
  await revokeToken(payload.jti!)

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  }
}
```

**Token Storage & Transport:**

```typescript
// Client-side token management
class TokenManager {
  private accessToken: string | null = null
  private refreshToken: string | null = null

  // Store tokens (access in memory, refresh in HTTP-only cookie)
  setTokens(access: string, refresh: string) {
    this.accessToken = access
    // Refresh token set via HTTP-only cookie from server
  }

  getAccessToken(): string | null {
    return this.accessToken
  }

  async refreshTokens(): Promise<void> {
    // Call refresh endpoint (sends refresh token cookie automatically)
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include', // Send cookies
    })

    if (!response.ok) {
      throw new Error('Token refresh failed')
    }

    const { accessToken } = await response.json()
    this.accessToken = accessToken
  }

  // Intercept requests to add auth header
  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getAccessToken()

    if (!token) {
      throw new Error('No access token')
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    })

    // Auto-refresh on 401
    if (response.status === 401) {
      await this.refreshTokens()
      // Retry request
      return this.fetch(url, options)
    }

    return response
  }

  clearTokens() {
    this.accessToken = null
    // Refresh token cleared via server endpoint
  }
}

export const tokenManager = new TokenManager()
```

**Next.js Middleware for JWT Verification:**

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function middleware(request: NextRequest) {
  // Get token from cookie or header
  const token =
    request.cookies.get('access_token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    // Verify token
    const { payload } = await jwtVerify(token, JWT_SECRET)

    // Add user info to headers for downstream handlers
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.sub as string)
    requestHeaders.set('x-user-role', payload.role as string)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/protected/:path*'],
}
```

**Best Practices:**
- Store access tokens in memory (not localStorage)
- Use HTTP-only cookies for refresh tokens
- Implement automatic token refresh
- Use short expiration times (15-60 minutes)
- Include minimal claims in JWT payload
- Sign with strong secrets (HS256) or RSA keys
- Validate all JWT claims (exp, iat, iss, aud)
- Implement token revocation for logout

**Gotchas:**
- localStorage vulnerable to XSS attacks
- JWT size increases with more claims
- Can't revoke JWTs before expiration (unless using blacklist)
- Clock skew can cause exp validation issues
- Base64 != encryption (JWT payload is readable)
- Never store sensitive data in JWT

### 3. Session Management

**Secure Session Implementation:**

```typescript
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import crypto from 'crypto'

const SESSION_SECRET = new TextEncoder().encode(process.env.SESSION_SECRET!)
const SESSION_DURATION = 7 * 24 * 60 * 60 // 7 days in seconds

interface Session {
  userId: string
  email: string
  role: string
  createdAt: number
  expiresAt: number
}

// Create session
async function createSession(userId: string, email: string, role: string): Promise<string> {
  const session: Session = {
    userId,
    email,
    role,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION * 1000,
  }

  // Sign session as JWT
  const sessionToken = await new SignJWT(session)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(SESSION_DURATION)
    .sign(SESSION_SECRET)

  // Store in HTTP-only cookie
  cookies().set('session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  })

  // Also store in database for server-side validation
  await storeSessionInDB({
    id: crypto.randomUUID(),
    userId,
    token: sessionToken,
    expiresAt: new Date(session.expiresAt),
  })

  return sessionToken
}

// Verify session
async function verifySession(token: string): Promise<Session | null> {
  try {
    // Verify JWT
    const { payload } = await jwtVerify(token, SESSION_SECRET)

    // Check if session exists in DB (not revoked)
    const dbSession = await getSessionFromDB(token)
    if (!dbSession || dbSession.revoked) {
      return null
    }

    return payload as Session
  } catch {
    return null
  }
}

// Get current session
async function getSession(): Promise<Session | null> {
  const sessionToken = cookies().get('session')?.value
  if (!sessionToken) return null

  return verifySession(sessionToken)
}

// Refresh session (extend expiration)
async function refreshSession(token: string): Promise<void> {
  const session = await verifySession(token)
  if (!session) throw new Error('Invalid session')

  // Create new session with extended expiration
  await createSession(session.userId, session.email, session.role)
}

// Destroy session (logout)
async function destroySession(): Promise<void> {
  const sessionToken = cookies().get('session')?.value
  if (sessionToken) {
    // Revoke in database
    await revokeSessionInDB(sessionToken)
  }

  // Clear cookie
  cookies().delete('session')
}

// Clean up expired sessions (run periodically)
async function cleanupExpiredSessions(): Promise<void> {
  await deleteExpiredSessionsFromDB()
}
```

**Database Session Schema:**

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_accessed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_token ON sessions(token);
```

**Session Middleware:**

```typescript
// app/api/middleware/session.ts
import { NextRequest, NextResponse } from 'next/server'

export async function requireSession(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Update last accessed time
  await updateSessionAccess(session.userId)

  return NextResponse.next({
    request: {
      headers: new Headers({
        ...request.headers,
        'x-user-id': session.userId,
        'x-user-role': session.role,
      }),
    },
  })
}
```

**Best Practices:**
- Use HTTP-only, secure, SameSite cookies
- Store sessions in database for revocation
- Implement session rotation on privilege escalation
- Set reasonable expiration times (7-30 days)
- Track last access time for inactivity timeout
- Clean up expired sessions regularly
- Use CSRF tokens for state-changing operations
- Implement device tracking for security

**Gotchas:**
- Cookie size limited to 4KB
- SameSite=Strict breaks OAuth flows
- Secure flag required in production
- Session fixation attacks (rotate on login)
- Concurrent requests can cause race conditions
- Time zones matter for expiration

### 4. CSRF/XSS Protection

**CSRF (Cross-Site Request Forgery) Protection:**

```typescript
import crypto from 'crypto'

// Generate CSRF token
function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Store CSRF token in session
async function setCsrfToken(userId: string): Promise<string> {
  const token = generateCsrfToken()

  // Store in database
  await storeCsrfToken(userId, token)

  // Also store in cookie (double-submit pattern)
  cookies().set('csrf_token', token, {
    httpOnly: false, // Needs to be readable by JS
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600,
  })

  return token
}

// Verify CSRF token
async function verifyCsrfToken(
  userId: string,
  tokenFromHeader: string
): Promise<boolean> {
  const tokenFromCookie = cookies().get('csrf_token')?.value

  if (!tokenFromHeader || !tokenFromCookie) {
    return false
  }

  // Double-submit cookie pattern
  if (tokenFromHeader !== tokenFromCookie) {
    return false
  }

  // Also verify against database token
  const dbToken = await getCsrfToken(userId)
  return tokenFromHeader === dbToken
}

// CSRF middleware
export async function csrfProtection(request: NextRequest) {
  // Only check on state-changing methods
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const csrfToken = request.headers.get('x-csrf-token')
    const valid = await verifyCsrfToken(session.userId, csrfToken || '')

    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      )
    }
  }

  return NextResponse.next()
}

// Client-side CSRF token handling
class CsrfTokenManager {
  private token: string | null = null

  setToken(token: string) {
    this.token = token
  }

  getToken(): string | null {
    // Get from cookie
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('csrf_token='))
      ?.split('=')[1] || null
  }

  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getToken()

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'X-CSRF-Token': token || '',
      },
    })
  }
}
```

**XSS (Cross-Site Scripting) Protection:**

```typescript
// Content Security Policy
const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cdn.example.com'],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'img-src': ["'self'", 'data:', 'https:'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'connect-src': ["'self'", 'https://api.example.com'],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
}

function generateCSP(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ')
}

// Security headers middleware
export function securityHeaders() {
  return {
    'Content-Security-Policy': generateCSP(),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  }
}

// Input sanitization
import DOMPurify from 'isomorphic-dompurify'

function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target'],
  })
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }
  return text.replace(/[&<>"'/]/g, (char) => map[char])
}

// Output encoding for different contexts
function encodeForHTML(text: string): string {
  return escapeHtml(text)
}

function encodeForAttribute(text: string): string {
  return escapeHtml(text)
}

function encodeForJavaScript(text: string): string {
  return JSON.stringify(text).slice(1, -1) // Remove quotes
}

function encodeForURL(text: string): string {
  return encodeURIComponent(text)
}

// React component with XSS protection
import { useMemo } from 'react'

function SafeHtml({ html }: { html: string }) {
  const sanitized = useMemo(() => sanitizeHtml(html), [html])

  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />
}
```

**Best Practices:**
- Implement CSRF tokens for all state-changing requests
- Use SameSite cookies as additional CSRF protection
- Set strict Content Security Policy
- Sanitize all user input before rendering
- Use context-appropriate encoding
- Never use dangerouslySetInnerHTML with unsanitized data
- Validate input on both client and server
- Use HTTP-only cookies to prevent XSS token theft

**Gotchas:**
- SameSite=Lax allows GET with CSRF
- CSP can break inline scripts
- DOMPurify must run on server for SSR
- URL encoding != HTML encoding
- React escapes by default (usually safe)
- CSRF tokens needed even with CORS

### 5. Security Headers

**Comprehensive Security Headers:**

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.vercel-insights.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: https: blob:;
      font-src 'self' https://fonts.gstatic.com;
      connect-src 'self' https://api.example.com wss://ws.example.com;
      frame-ancestors 'none';
      base-uri 'self';
      form-action 'self';
      upgrade-insecure-requests;
    `.replace(/\s+/g, ' ').trim()
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
]

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}
```

**Dynamic CSP with Nonces:**

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export function middleware(request: NextRequest) {
  // Generate nonce for this request
  const nonce = crypto.randomBytes(16).toString('base64')

  // Build CSP with nonce
  const csp = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'nonce-${nonce}';
    img-src 'self' data: https:;
    font-src 'self';
    connect-src 'self' https://api.example.com;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\s+/g, ' ').trim()

  const response = NextResponse.next()

  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('X-Nonce', nonce)

  return response
}

// Use nonce in scripts
export default function Page() {
  const nonce = headers().get('X-Nonce')

  return (
    <html>
      <head>
        <script nonce={nonce}>
          {`console.log('This script is allowed by CSP nonce')`}
        </script>
      </head>
      <body>...</body>
    </html>
  )
}
```

**CORS Configuration:**

```typescript
// app/api/route.ts
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_ORIGINS = [
  'https://example.com',
  'https://app.example.com',
  process.env.NODE_ENV === 'development' && 'http://localhost:3000',
].filter(Boolean)

export function corsMiddleware(request: NextRequest) {
  const origin = request.headers.get('origin')

  // Preflight request
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.includes(origin) ? origin : '',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  const response = NextResponse.next()

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  return response
}
```

**Rate Limiting:**

```typescript
import { LRUCache } from 'lru-cache'

interface RateLimitOptions {
  interval: number // Time window in ms
  uniqueTokenPerInterval: number // Max unique users
}

function rateLimit(options: RateLimitOptions) {
  const tokenCache = new LRUCache<string, number[]>({
    max: options.uniqueTokenPerInterval,
    ttl: options.interval,
  })

  return {
    check: (token: string, limit: number): { success: boolean; remaining: number } => {
      const now = Date.now()
      const tokenCount = tokenCache.get(token) || [0]
      const windowStart = now - options.interval

      // Remove old entries
      const validRequests = tokenCount.filter((time) => time > windowStart)

      if (validRequests.length >= limit) {
        return { success: false, remaining: 0 }
      }

      validRequests.push(now)
      tokenCache.set(token, validRequests)

      return {
        success: true,
        remaining: limit - validRequests.length,
      }
    },
  }
}

// Usage in API route
const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500,
})

export async function POST(request: NextRequest) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'

  const { success, remaining } = limiter.check(ip, 10) // 10 requests per minute

  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '0',
          'Retry-After': '60',
        },
      }
    )
  }

  // ... handle request

  return NextResponse.json(
    { success: true },
    {
      headers: {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': remaining.toString(),
      },
    }
  )
}
```

**Best Practices:**
- Enable HSTS with preload list submission
- Use CSP nonces instead of 'unsafe-inline'
- Implement rate limiting on all public APIs
- Restrict CORS to specific origins
- Set appropriate Permissions-Policy
- Use Subresource Integrity (SRI) for CDN resources
- Monitor CSP violations
- Regularly update security headers

**Gotchas:**
- CSP can break third-party integrations
- HSTS can't be easily reverted
- Rate limiting needs distributed storage for multi-server
- CORS credentials require specific origin (not *)
- Some headers ignored by some browsers
- CSP report-uri deprecated (use report-to)

## 💡 Real-World Examples

### Example 1: Complete Next.js Auth System

```typescript
// lib/auth.ts
import { jwtVerify, SignJWT } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function signup(email: string, password: string) {
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Create user in database
  const user = await db.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  })

  // Create session
  await createSession(user.id, user.email, 'user')

  return { success: true }
}

export async function login(email: string, password: string) {
  // Find user
  const user = await db.user.findUnique({ where: { email } })

  if (!user) {
    throw new Error('Invalid credentials')
  }

  // Verify password
  const valid = await bcrypt.compare(password, user.password)

  if (!valid) {
    throw new Error('Invalid credentials')
  }

  // Create session
  await createSession(user.id, user.email, user.role)

  return { success: true }
}

export async function logout() {
  await destroySession()
  return { success: true }
}

export async function getUser() {
  const session = await getSession()
  if (!session) return null

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, role: true, name: true },
  })

  return user
}

// Protected API handler
export function withAuth(
  handler: (request: NextRequest, session: Session) => Promise<Response>
) {
  return async (request: NextRequest) => {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return handler(request, session)
  }
}
```

### Example 2: Multi-Factor Authentication (MFA)

```typescript
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'

// Generate MFA secret
export async function setupMFA(userId: string) {
  const secret = speakeasy.generateSecret({
    name: `MyApp (${userId})`,
    length: 32,
  })

  // Store secret in database (encrypted)
  await db.user.update({
    where: { id: userId },
    data: {
      mfaSecret: encrypt(secret.base32),
    },
  })

  // Generate QR code
  const qrCode = await QRCode.toDataURL(secret.otpauth_url!)

  return {
    secret: secret.base32,
    qrCode,
  }
}

// Verify MFA token
export async function verifyMFA(userId: string, token: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { mfaSecret: true },
  })

  if (!user?.mfaSecret) {
    return false
  }

  const secret = decrypt(user.mfaSecret)

  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps before/after
  })
}

// Enable MFA
export async function enableMFA(userId: string, token: string) {
  const valid = await verifyMFA(userId, token)

  if (!valid) {
    throw new Error('Invalid MFA token')
  }

  await db.user.update({
    where: { id: userId },
    data: { mfaEnabled: true },
  })

  return { success: true }
}

// Login with MFA
export async function loginWithMFA(email: string, password: string, mfaToken?: string) {
  const user = await db.user.findUnique({ where: { email } })

  if (!user) {
    throw new Error('Invalid credentials')
  }

  // Verify password
  const validPassword = await bcrypt.compare(password, user.password)

  if (!validPassword) {
    throw new Error('Invalid credentials')
  }

  // Check if MFA is enabled
  if (user.mfaEnabled) {
    if (!mfaToken) {
      return { requiresMFA: true }
    }

    const validMFA = await verifyMFA(user.id, mfaToken)

    if (!validMFA) {
      throw new Error('Invalid MFA token')
    }
  }

  // Create session
  await createSession(user.id, user.email, user.role)

  return { success: true }
}
```

## 🔗 Related Skills

- `supabase-expert` - Supabase Auth integration
- `nextjs-14-expert` - Next.js authentication patterns
- `clerk-auth-expert` - Clerk authentication
- `node-backend` - Backend authentication
- `devops-engineer` - Security infrastructure

## 📖 Further Reading

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OAuth 2.0 RFC](https://datatracker.ietf.org/doc/html/rfc6749)
- [OpenID Connect Spec](https://openid.net/specs/openid-connect-core-1_0.html)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
