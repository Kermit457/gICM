# Clerk Authentication Expert

> **ID:** `clerk-auth-expert`
> **Tier:** 2
> **Token Cost:** 6000
> **MCP Connections:** clerk

## 🎯 What This Skill Does

Master production-grade authentication and user management with Clerk. This skill covers everything from basic auth flows to advanced multi-tenant architectures, RBAC, webhook synchronization, and edge-compatible middleware patterns.

**Core Capabilities:**
- Pre-built auth components and customization
- Route protection middleware (App Router & Pages Router)
- Organizations and multi-tenancy patterns
- Webhook event handling and user sync
- Role-based access control (RBAC)
- Edge-compatible authentication
- Session management and token handling
- SSO and OAuth integrations

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** clerk, @clerk/nextjs, clerkMiddleware, currentUser, auth(), SignIn, SignUp, UserButton
- **File Types:** middleware.ts, layout.tsx, route.ts
- **Directories:** app/, api/webhooks/clerk

## 🚀 Core Capabilities

### 1. Installation & Setup

**Next.js 13+ App Router (Recommended):**

```bash
npm install @clerk/nextjs
```

**Environment Variables:**

```bash
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Redirect URLs (optional)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Webhook secret
CLERK_WEBHOOK_SECRET=whsec_...
```

**Root Layout Provider:**

```typescript
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark, // or light, or your custom theme
        variables: {
          colorPrimary: '#6366f1',
          borderRadius: '0.5rem',
        },
        elements: {
          formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-700',
          card: 'shadow-xl',
        },
      }}
    >
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

**Best Practices:**
- Always use environment variables for API keys
- Set explicit redirect URLs to control user flow
- Use appearance customization to match brand identity
- Enable development instance for testing

**Gotchas:**
- ClerkProvider must wrap your entire app at root layout
- Publishable key is safe for client-side, secret key must stay server-side only
- Redirect URLs must be absolute in production, relative in development

### 2. Pre-built Authentication Components

**Sign In & Sign Up Pages:**

```typescript
// app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-2xl',
          },
        }}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
      />
    </div>
  );
}

// app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-2xl',
          },
        }}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
      />
    </div>
  );
}
```

**User Button (Profile Menu):**

```typescript
// components/user-nav.tsx
import { UserButton } from '@clerk/nextjs';

export function UserNav() {
  return (
    <UserButton
      afterSignOutUrl="/"
      appearance={{
        elements: {
          avatarBox: 'w-10 h-10',
          userButtonPopoverCard: 'shadow-xl',
        },
      }}
      userProfileMode="navigation"
      userProfileUrl="/user-profile"
    />
  );
}
```

**Organization Switcher:**

```typescript
// components/org-switcher.tsx
import { OrganizationSwitcher } from '@clerk/nextjs';

export function OrgSwitcher() {
  return (
    <OrganizationSwitcher
      hidePersonal={false}
      afterCreateOrganizationUrl="/org/:slug"
      afterSelectOrganizationUrl="/org/:slug"
      appearance={{
        elements: {
          rootBox: 'flex items-center justify-center',
          organizationSwitcherTrigger: 'px-4 py-2 border rounded-lg',
        },
      }}
    />
  );
}
```

**User Profile Component:**

```typescript
// app/user-profile/[[...user-profile]]/page.tsx
import { UserProfile } from '@clerk/nextjs';

export default function UserProfilePage() {
  return (
    <div className="flex justify-center py-8">
      <UserProfile
        routing="path"
        path="/user-profile"
        appearance={{
          elements: {
            rootBox: 'w-full max-w-4xl',
            card: 'shadow-none',
          },
        }}
      />
    </div>
  );
}
```

**Best Practices:**
- Use `routing="path"` for App Router consistency
- Always provide fallback URLs (signInUrl, signUpUrl, afterSignOutUrl)
- Customize appearance to match your design system
- Use UserButton in navigation for consistent UX

**Common Patterns:**

```typescript
// Custom auth modal with dialog
'use client';

import { SignIn } from '@clerk/nextjs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useRouter, useSearchParams } from 'next/navigation';

export function SignInModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOpen = searchParams.get('sign-in') === 'true';

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) router.back();
      }}
    >
      <DialogContent className="p-0">
        <SignIn routing="virtual" />
      </DialogContent>
    </Dialog>
  );
}
```

**Gotchas:**
- Catch-all routes [[...sign-in]] must be used for Clerk's routing to work
- User profile pages need proper routing setup to avoid conflicts
- Organization features require enablement in Clerk Dashboard

### 3. Route Protection Middleware

**App Router Middleware (Edge-Compatible):**

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/public(.*)',
]);

const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
]);

const isOrgRoute = createRouteMatcher([
  '/org/:orgId(.*)',
]);

export default clerkMiddleware((auth, request) => {
  const { userId, orgId, orgRole } = auth();

  // Allow public routes
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // Require authentication for protected routes
  if (!userId) {
    return auth().redirectToSignIn({ returnBackUrl: request.url });
  }

  // Admin routes - check for admin role
  if (isAdminRoute(request)) {
    if (auth().sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // Organization routes - require org membership
  if (isOrgRoute(request)) {
    if (!orgId) {
      return NextResponse.redirect(new URL('/select-org', request.url));
    }

    // Check org permissions
    if (request.nextUrl.pathname.includes('/settings') && orgRole !== 'org:admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

**Advanced Middleware with Rate Limiting:**

```typescript
// middleware.ts
import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export default clerkMiddleware(async (auth, request) => {
  const { userId } = auth();

  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const identifier = userId || request.ip || 'anonymous';
    const { success } = await ratelimit.limit(identifier);

    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
});
```

**Server Component Auth Checks:**

```typescript
// app/dashboard/page.tsx
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const user = await currentUser();

  return (
    <div>
      <h1>Welcome, {user?.firstName}!</h1>
    </div>
  );
}
```

**Client Component Auth Checks:**

```typescript
// components/protected-content.tsx
'use client';

import { useUser, useAuth } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';

export function ProtectedContent() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();

  if (!isLoaded) {
    return <Loader2 className="animate-spin" />;
  }

  if (!isSignedIn) {
    return <div>Please sign in to view this content</div>;
  }

  return (
    <div>
      <p>Protected content for {user.firstName}</p>
      <button
        onClick={async () => {
          const token = await getToken();
          // Use token for API calls
        }}
      >
        Make Authenticated Request
      </button>
    </div>
  );
}
```

**Best Practices:**
- Use middleware for edge-compatible auth checks
- Leverage createRouteMatcher for readable route patterns
- Always provide returnBackUrl for better UX
- Check both authentication and authorization
- Use auth() in Server Components, useUser() in Client Components

**Gotchas:**
- Middleware runs on edge runtime - no Node.js APIs
- sessionClaims must be added via Clerk Dashboard metadata
- redirectToSignIn must include returnBackUrl for post-login redirect
- Matcher regex must exclude _next and static files

### 4. Organizations & Multi-Tenancy

**Organization Schema:**

```typescript
// lib/types/organization.ts
import { z } from 'zod';

export const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  imageUrl: z.string().optional(),
  createdAt: z.date(),
  membersCount: z.number(),
  role: z.enum(['org:admin', 'org:member']),
});

export type Organization = z.infer<typeof organizationSchema>;
```

**Organization Context Provider:**

```typescript
// providers/organization-provider.tsx
'use client';

import { useOrganization, useOrganizationList } from '@clerk/nextjs';
import { createContext, useContext, ReactNode } from 'react';

interface OrganizationContextValue {
  organization: any;
  isLoaded: boolean;
  isAdmin: boolean;
  memberships: any[];
  setActive: (orgId: string) => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { organization, isLoaded, membership } = useOrganization();
  const { setActive, userMemberships } = useOrganizationList({
    userMemberships: { infinite: true },
  });

  const isAdmin = membership?.role === 'org:admin';

  const handleSetActive = async (orgId: string) => {
    if (!setActive) return;
    await setActive({ organization: orgId });
  };

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        isLoaded,
        isAdmin,
        memberships: userMemberships.data || [],
        setActive: handleSetActive,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export const useOrgContext = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrgContext must be used within OrganizationProvider');
  }
  return context;
};
```

**Organization Invitation Flow:**

```typescript
// app/org/[orgId]/members/invite/page.tsx
'use client';

import { useOrganization } from '@clerk/nextjs';
import { useState } from 'react';
import { toast } from 'sonner';

export default function InviteMembersPage() {
  const { organization, invitations } = useOrganization({
    invitations: { infinite: true, keepPreviousData: true },
  });
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'org:admin' | 'org:member'>('org:member');

  const handleInvite = async () => {
    if (!organization) return;

    try {
      await organization.inviteMember({
        emailAddress: email,
        role,
      });
      toast.success('Invitation sent!');
      setEmail('');
    } catch (error) {
      toast.error('Failed to send invitation');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2>Invite Members</h2>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
          />
          <select value={role} onChange={(e) => setRole(e.target.value as any)}>
            <option value="org:member">Member</option>
            <option value="org:admin">Admin</option>
          </select>
          <button onClick={handleInvite}>Send Invite</button>
        </div>
      </div>

      <div>
        <h3>Pending Invitations</h3>
        {invitations.data?.map((invite) => (
          <div key={invite.id} className="flex justify-between">
            <span>{invite.emailAddress}</span>
            <span>{invite.role}</span>
            <button onClick={() => invite.revoke()}>Revoke</button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Multi-Tenant Data Isolation:**

```typescript
// lib/db/organization-queries.ts
import { auth } from '@clerk/nextjs/server';
import { db } from './drizzle';
import { projects } from './schema';
import { eq, and } from 'drizzle-orm';

export async function getOrganizationProjects() {
  const { orgId } = auth();

  if (!orgId) {
    throw new Error('No organization selected');
  }

  // All queries automatically scoped to organization
  return db.query.projects.findMany({
    where: eq(projects.organizationId, orgId),
  });
}

export async function createProject(data: { name: string; description: string }) {
  const { orgId, userId } = auth();

  if (!orgId) {
    throw new Error('No organization selected');
  }

  return db.insert(projects).values({
    ...data,
    organizationId: orgId,
    createdBy: userId,
  });
}
```

**Best Practices:**
- Always validate orgId on server before database operations
- Use organization slug in URLs for better UX
- Implement proper role-based permissions
- Handle edge cases (no org selected, pending invites)
- Provide clear organization switching UI

**Common Patterns:**

```typescript
// Organization permission guard
export function requireOrgAdmin() {
  const { orgRole } = auth();

  if (orgRole !== 'org:admin') {
    throw new Error('Unauthorized: Admin access required');
  }
}

// Usage in API route
export async function DELETE(req: Request) {
  requireOrgAdmin();

  // Delete operation
}
```

**Gotchas:**
- Organization features must be enabled in Clerk Dashboard
- Default roles are org:admin and org:member (custom roles require enterprise)
- Organization changes may require page refresh
- Invitations have expiry (configurable in dashboard)

### 5. Webhook Event Handling

**Webhook Route Setup:**

```typescript
// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Missing CLERK_WEBHOOK_SECRET');
  }

  // Get headers
  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  // Get body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify webhook
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  // Handle events
  const eventType = evt.type;

  switch (eventType) {
    case 'user.created':
      await handleUserCreated(evt.data);
      break;
    case 'user.updated':
      await handleUserUpdated(evt.data);
      break;
    case 'user.deleted':
      await handleUserDeleted(evt.data);
      break;
    case 'organization.created':
      await handleOrganizationCreated(evt.data);
      break;
    case 'organizationMembership.created':
      await handleMembershipCreated(evt.data);
      break;
    case 'session.created':
      await handleSessionCreated(evt.data);
      break;
    default:
      console.log(`Unhandled event type: ${eventType}`);
  }

  return new Response('Webhook processed', { status: 200 });
}

async function handleUserCreated(data: any) {
  await db.insert(users).values({
    id: data.id,
    email: data.email_addresses[0]?.email_address,
    firstName: data.first_name,
    lastName: data.last_name,
    imageUrl: data.image_url,
    createdAt: new Date(data.created_at),
  });
}

async function handleUserUpdated(data: any) {
  await db
    .update(users)
    .set({
      email: data.email_addresses[0]?.email_address,
      firstName: data.first_name,
      lastName: data.last_name,
      imageUrl: data.image_url,
      updatedAt: new Date(),
    })
    .where(eq(users.id, data.id));
}

async function handleUserDeleted(data: any) {
  await db.delete(users).where(eq(users.id, data.id));
}
```

**Webhook Event Types:**

```typescript
// lib/types/webhook-events.ts
export type ClerkWebhookEvent =
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'email.created'
  | 'sms.created'
  | 'session.created'
  | 'session.ended'
  | 'session.removed'
  | 'session.revoked'
  | 'organization.created'
  | 'organization.updated'
  | 'organization.deleted'
  | 'organizationMembership.created'
  | 'organizationMembership.updated'
  | 'organizationMembership.deleted'
  | 'organizationInvitation.accepted'
  | 'organizationInvitation.created'
  | 'organizationInvitation.revoked';

export interface WebhookEventHandler {
  (data: any): Promise<void>;
}
```

**Webhook Testing with ngrok:**

```bash
# Install ngrok
npm install -g ngrok

# Start your Next.js app
npm run dev

# In another terminal, expose localhost
ngrok http 3000

# Copy the https URL and add to Clerk Dashboard:
# https://dashboard.clerk.com > Webhooks > Add Endpoint
# URL: https://your-ngrok-url.ngrok.io/api/webhooks/clerk
```

**Best Practices:**
- Always verify webhook signatures (Svix handles this)
- Use webhook secret from environment variables
- Handle all event types gracefully (log unknown events)
- Implement idempotency for duplicate events
- Use database transactions for complex operations
- Return 200 quickly, process async if needed

**Common Patterns:**

```typescript
// Idempotent webhook processing
const processedEvents = new Set<string>();

export async function POST(req: Request) {
  const evt = await verifyWebhook(req);

  // Check if already processed
  const eventId = req.headers.get('svix-id');
  if (processedEvents.has(eventId)) {
    return new Response('Already processed', { status: 200 });
  }

  await handleEvent(evt);
  processedEvents.add(eventId);

  return new Response('OK', { status: 200 });
}
```

**Gotchas:**
- Webhooks must be publicly accessible (use ngrok for local dev)
- Webhook secret is different from API keys
- Events may arrive out of order
- Failed webhooks will retry (implement idempotency)

### 6. Role-Based Access Control (RBAC)

**Custom Roles with Metadata:**

```typescript
// lib/auth/roles.ts
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  MEMBER: 'member',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSIONS = {
  users: {
    create: ['admin'],
    read: ['admin', 'manager', 'member'],
    update: ['admin', 'manager'],
    delete: ['admin'],
  },
  projects: {
    create: ['admin', 'manager'],
    read: ['admin', 'manager', 'member'],
    update: ['admin', 'manager'],
    delete: ['admin'],
  },
} as const;

export function hasPermission(
  role: Role,
  resource: keyof typeof PERMISSIONS,
  action: 'create' | 'read' | 'update' | 'delete'
): boolean {
  return PERMISSIONS[resource][action].includes(role);
}
```

**Server-Side Permission Check:**

```typescript
// lib/auth/permissions.ts
import { auth } from '@clerk/nextjs/server';
import { hasPermission, Role } from './roles';

export async function requirePermission(
  resource: string,
  action: string
): Promise<void> {
  const { userId, sessionClaims } = auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  const role = sessionClaims?.metadata?.role as Role;

  if (!role || !hasPermission(role, resource as any, action as any)) {
    throw new Error('Forbidden: Insufficient permissions');
  }
}

// Usage in API route
export async function DELETE(req: Request) {
  await requirePermission('projects', 'delete');

  // Delete project
}
```

**Client-Side Permission Hook:**

```typescript
// hooks/use-permissions.ts
'use client';

import { useUser } from '@clerk/nextjs';
import { hasPermission, Role } from '@/lib/auth/roles';

export function usePermissions() {
  const { user } = useUser();
  const role = user?.publicMetadata?.role as Role;

  return {
    can: (resource: string, action: string) => {
      if (!role) return false;
      return hasPermission(role, resource as any, action as any);
    },
    isAdmin: role === 'admin',
    isManager: role === 'manager',
    role,
  };
}

// Usage in component
export function DeleteButton({ projectId }: { projectId: string }) {
  const { can } = usePermissions();

  if (!can('projects', 'delete')) {
    return null;
  }

  return <button onClick={() => deleteProject(projectId)}>Delete</button>;
}
```

**Setting User Roles via API:**

```typescript
// app/api/admin/users/[userId]/role/route.ts
import { clerkClient } from '@clerk/nextjs/server';
import { requirePermission } from '@/lib/auth/permissions';

export async function PATCH(
  req: Request,
  { params }: { params: { userId: string } }
) {
  await requirePermission('users', 'update');

  const { role } = await req.json();

  await clerkClient.users.updateUser(params.userId, {
    publicMetadata: { role },
  });

  return Response.json({ success: true });
}
```

**Best Practices:**
- Store roles in publicMetadata for client access
- Use privateMetadata for sensitive permissions
- Implement both client and server-side checks
- Design granular permissions (resource + action)
- Audit role changes via webhooks

**Gotchas:**
- Metadata updates require page refresh on client
- Public metadata is visible to all users
- Custom roles require enterprise plan
- Session claims update on next token refresh

### 7. Advanced Patterns

**Custom Session Claims:**

```typescript
// lib/auth/session-claims.ts
import { clerkClient } from '@clerk/nextjs/server';

export async function setCustomClaims(userId: string, claims: Record<string, any>) {
  await clerkClient.users.updateUser(userId, {
    privateMetadata: claims,
  });
}

// Access in middleware or API routes
const { sessionClaims } = auth();
const customData = sessionClaims?.metadata;
```

**Token Management:**

```typescript
// Get JWT token for external API calls
'use client';

import { useAuth } from '@clerk/nextjs';

export function useAuthToken() {
  const { getToken } = useAuth();

  async function fetchWithAuth(url: string, options?: RequestInit) {
    const token = await getToken();

    return fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return { fetchWithAuth };
}
```

**SSO Integration:**

```typescript
// Enable SSO in Clerk Dashboard first
// No code changes needed - Clerk handles SAML/OAuth automatically

// Optional: Redirect enterprise users to SSO
export default clerkMiddleware((auth, req) => {
  const { userId, sessionClaims } = auth();

  if (sessionClaims?.email?.endsWith('@enterprise.com')) {
    // Redirect to SSO if not already authenticated
  }
});
```

**Multi-Factor Authentication:**

```typescript
// Enable MFA in Clerk Dashboard
// Users can enable it in their profile

// Require MFA for sensitive operations
export async function POST(req: Request) {
  const { userId, sessionClaims } = auth();

  if (!sessionClaims?.twoFactorEnabled) {
    return Response.json(
      { error: 'MFA required for this operation' },
      { status: 403 }
    );
  }

  // Proceed with sensitive operation
}
```

## 💡 Real-World Examples

### Example 1: Multi-Tenant SaaS Application

```typescript
// Complete setup for a multi-tenant SaaS app

// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublic = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);
const isOrgRequired = createRouteMatcher(['/app/:orgSlug(.*)']);

export default clerkMiddleware((auth, req) => {
  if (!isPublic(req) && !auth().userId) {
    return auth().redirectToSignIn({ returnBackUrl: req.url });
  }

  if (isOrgRequired(req) && !auth().orgId) {
    return Response.redirect(new URL('/select-org', req.url));
  }
});

// app/app/[orgSlug]/layout.tsx
export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { orgSlug: string };
}) {
  const { orgSlug } = params;
  const { orgId } = auth();

  // Verify org slug matches active org
  const org = await clerkClient.organizations.getOrganization({
    organizationId: orgId!,
  });

  if (org.slug !== orgSlug) {
    redirect('/select-org');
  }

  return (
    <div>
      <header>
        <OrganizationSwitcher />
      </header>
      {children}
    </div>
  );
}

// lib/db/tenant-isolation.ts
export async function getTenantDb() {
  const { orgId } = auth();

  if (!orgId) {
    throw new Error('No organization context');
  }

  return db.$with('tenant_filter', (qb) =>
    qb.where(eq(schema.organizationId, orgId))
  );
}
```

### Example 2: Admin Dashboard with RBAC

```typescript
// app/admin/layout.tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId, sessionClaims } = auth();

  if (!userId || sessionClaims?.metadata?.role !== 'admin') {
    redirect('/unauthorized');
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main>{children}</main>
    </div>
  );
}

// components/admin/user-management.tsx
'use client';

import { useState } from 'react';
import { clerkClient } from '@clerk/nextjs/server';

export function UserManagement() {
  const [users, setUsers] = useState([]);

  async function updateUserRole(userId: string, role: string) {
    await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  return (
    <div>
      {users.map((user) => (
        <UserRow key={user.id} user={user} onRoleChange={updateUserRole} />
      ))}
    </div>
  );
}
```

## 🔗 Related Skills

- **tanstack-query-expert** - Cache Clerk user data and organization lists
- **zustand-jotai-state** - Store active organization state globally
- **react-hook-form-zod** - Build user profile update forms with validation
- **neon-postgres** - Sync Clerk users to PostgreSQL via webhooks
- **uploadthing-expert** - Integrate with Clerk for authenticated file uploads
- **inngest-expert** - Process Clerk webhooks asynchronously
- **convex-expert** - Use Clerk auth with Convex backend

## 📖 Further Reading

- [Clerk Documentation](https://clerk.com/docs)
- [Next.js Integration Guide](https://clerk.com/docs/quickstarts/nextjs)
- [Middleware Reference](https://clerk.com/docs/references/nextjs/clerk-middleware)
- [Organizations & RBAC](https://clerk.com/docs/organizations/overview)
- [Webhook Events](https://clerk.com/docs/integrations/webhooks/overview)
- [Custom Session Claims](https://clerk.com/docs/backend-requests/making/custom-session-token)
- [Multi-Tenancy Guide](https://clerk.com/blog/multi-tenancy-in-nextjs)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
