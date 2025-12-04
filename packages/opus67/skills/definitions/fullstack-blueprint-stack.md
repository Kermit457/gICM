# Fullstack Blueprint Stack

> **ID:** `fullstack-blueprint-stack`
> **Tier:** 2
> **Token Cost:** 10000
> **MCP Connections:** clerk, stripe, vercel, supabase

## 🎯 What This Skill Does

Complete production-ready fullstack SaaS blueprint using modern TypeScript stack. This skill provides end-to-end guidance for building, deploying, and scaling Next.js 15 applications with authentication, payments, database, and deployment infrastructure.

**Core Technologies:**
- Next.js 15+ App Router with React Server Components
- tRPC v11 for end-to-end type safety
- Prisma ORM with PostgreSQL (Neon, Supabase, or Railway)
- Tailwind CSS v4 with shadcn/ui components
- Clerk authentication with organizations and webhooks
- Stripe payments with subscriptions and webhooks
- Vercel deployment with edge functions
- Zod validation across all boundaries
- TypeScript strict mode
- pnpm workspace structure

**What You'll Build:**
- Multi-tenant SaaS with organizations
- Subscription billing with Stripe
- Role-based access control (RBAC)
- Email/password + OAuth providers
- Transactional emails (Resend)
- File uploads (Uploadthing)
- Real-time updates (Server-Sent Events)
- API rate limiting and caching
- Comprehensive error handling
- Observability with Sentry
- End-to-end type safety

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** fullstack, saas, starter, blueprint, nextjs, clerk, stripe, trpc, prisma, subscription, multi-tenant
- **File Types:** N/A
- **Directories:** app/, src/app/, src/server/, prisma/

**Use this skill when:**
- Starting a new SaaS product
- Building a subscription-based application
- Need multi-tenancy with organizations
- Require end-to-end type safety
- Want production-ready patterns from day one
- Building a marketplace or platform
- Need payment processing with subscriptions
- Require authentication with social providers

**Don't use this skill for:**
- Static websites (use Next.js SSG instead)
- Simple landing pages (use Astro)
- Pure API backends (use Fastify/Express)
- Real-time apps requiring WebSockets (add Socket.io separately)
- Mobile apps (use Expo with tRPC)

## 🚀 Core Capabilities

### 1. Next.js 15+ App Router Architecture

**Project Structure:**
```
my-saas/
├── app/
│   ├── (auth)/                 # Auth group with shared layout
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   ├── sign-up/[[...sign-up]]/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/            # Protected group
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── billing/page.tsx
│   │   │   │   └── team/page.tsx
│   │   │   └── [orgId]/
│   │   │       ├── page.tsx
│   │   │       └── layout.tsx
│   │   └── layout.tsx
│   ├── (marketing)/            # Public pages
│   │   ├── page.tsx
│   │   ├── pricing/page.tsx
│   │   ├── about/page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── trpc/[trpc]/route.ts
│   │   ├── webhooks/
│   │   │   ├── clerk/route.ts
│   │   │   └── stripe/route.ts
│   │   └── uploadthing/route.ts
│   ├── layout.tsx
│   ├── providers.tsx
│   └── globals.css
├── src/
│   ├── server/
│   │   ├── api/
│   │   │   ├── root.ts
│   │   │   ├── trpc.ts
│   │   │   └── routers/
│   │   │       ├── user.ts
│   │   │       ├── org.ts
│   │   │       ├── billing.ts
│   │   │       └── post.ts
│   │   └── db.ts
│   ├── lib/
│   │   ├── trpc.ts
│   │   ├── utils.ts
│   │   ├── validations/
│   │   │   ├── user.ts
│   │   │   ├── org.ts
│   │   │   └── billing.ts
│   │   ├── stripe.ts
│   │   ├── clerk.ts
│   │   └── uploadthing.ts
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   ├── dashboard/
│   │   ├── marketing/
│   │   └── providers/
│   ├── hooks/
│   │   ├── use-user.ts
│   │   ├── use-org.ts
│   │   └── use-subscription.ts
│   └── types/
│       └── index.ts
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── public/
├── .env.local
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

**Root Layout (`app/layout.tsx`):**
```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { TRPCReactProvider } from "@/lib/trpc";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "My SaaS - Your tagline",
    template: "%s | My SaaS",
  },
  description: "Description of your SaaS product",
  keywords: ["saas", "nextjs", "typescript"],
  authors: [{ name: "Your Name" }],
  creator: "Your Name",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://myapp.com",
    siteName: "My SaaS",
    images: [
      {
        url: "https://myapp.com/og.png",
        width: 1200,
        height: 630,
        alt: "My SaaS",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "My SaaS",
    description: "Description of your SaaS product",
    images: ["https://myapp.com/og.png"],
    creator: "@yourhandle",
  },
  metadataBase: new URL("https://myapp.com"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#0f172a",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <TRPCReactProvider>
            {children}
            <Toaster />
          </TRPCReactProvider>
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}
```

**Dashboard Layout with Auth (`app/(dashboard)/layout.tsx`):**
```typescript
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/nav";
import { UserButton } from "@clerk/nextjs";
import { api } from "@/lib/trpc/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Prefetch user data on the server
  const user = await api.user.getCurrent();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <DashboardNav />
          <div className="ml-auto flex items-center gap-4">
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                },
              }}
            />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-6">{children}</div>
      </main>
    </div>
  );
}
```

**Server Component with Data Fetching:**
```typescript
import { api } from "@/lib/trpc/server";
import { auth } from "@clerk/nextjs/server";
import { PostList } from "@/components/dashboard/post-list";
import { CreatePostButton } from "@/components/dashboard/create-post-button";

export default async function DashboardPage() {
  const { userId, orgId } = await auth();

  if (!userId) {
    return null;
  }

  // Parallel data fetching
  const [posts, subscription] = await Promise.all([
    api.post.list({ orgId: orgId ?? undefined }),
    api.billing.getSubscription(),
  ]);

  const canCreatePost = subscription?.plan !== "free" || posts.length < 3;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <CreatePostButton disabled={!canCreatePost} />
      </div>

      {!canCreatePost && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            You've reached the limit for the free plan.{" "}
            <a href="/dashboard/settings/billing" className="underline">
              Upgrade to create more posts
            </a>
            .
          </p>
        </div>
      )}

      <PostList posts={posts} />
    </div>
  );
}
```

**Client Component with Mutations:**
```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const createPostSchema = z.object({
  title: z.string().min(3).max(100),
  content: z.string().min(10).max(10000),
});

type CreatePostInput = z.infer<typeof createPostSchema>;

export function CreatePostForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
  });

  const createPost = api.post.create.useMutation({
    onSuccess: () => {
      toast.success("Post created successfully!");
      router.push("/dashboard");
      router.refresh(); // Revalidate server components
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = async (data: CreatePostInput) => {
    setIsSubmitting(true);
    try {
      await createPost.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          {...register("title")}
          placeholder="Enter post title"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          {...register("content")}
          placeholder="Enter post content"
          rows={10}
        />
        {errors.content && (
          <p className="mt-1 text-sm text-red-500">{errors.content.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Post"}
      </Button>
    </form>
  );
}
```

**Best Practices:**
- Use route groups `(group)` for shared layouts without affecting URLs
- Colocate components near their usage
- Prefer server components by default, use `"use client"` only when needed
- Use parallel data fetching with `Promise.all()` for better performance
- Implement loading.tsx and error.tsx for better UX
- Use metadata API for SEO optimization
- Leverage Next.js Image component for optimized images
- Use dynamic imports for code splitting heavy components
- Implement proper error boundaries
- Cache API responses with `unstable_cache` where appropriate

**Common Patterns:**

*Streaming with Suspense:*
```typescript
import { Suspense } from "react";
import { PostList } from "@/components/dashboard/post-list";
import { PostListSkeleton } from "@/components/dashboard/post-list-skeleton";

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<PostListSkeleton />}>
        <PostList />
      </Suspense>
    </div>
  );
}
```

*Parallel Routes for Modals:*
```typescript
// app/(dashboard)/dashboard/@modal/post/[id]/page.tsx
import { Modal } from "@/components/ui/modal";
import { PostDetail } from "@/components/dashboard/post-detail";

export default function PostModal({ params }: { params: { id: string } }) {
  return (
    <Modal>
      <PostDetail id={params.id} />
    </Modal>
  );
}
```

*Server Actions for Mutations:*
```typescript
"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createPostSchema = z.object({
  title: z.string().min(3).max(100),
  content: z.string().min(10).max(10000),
});

export async function createPost(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const data = createPostSchema.parse({
    title: formData.get("title"),
    content: formData.get("content"),
  });

  const post = await db.post.create({
    data: {
      ...data,
      userId,
    },
  });

  revalidatePath("/dashboard");

  return post;
}
```

**Gotchas:**
- Don't use `"use client"` on layouts unless necessary - it disables RSC for all children
- Always handle authentication in layouts, not individual pages
- Use `redirect()` instead of router.push() in server components
- Don't fetch data in client components - prefer server components or server actions
- Avoid cascading data fetches - use parallel fetching
- Remember `revalidatePath()` after mutations to update server component data
- Use dynamic route segments `[id]` not `[...id]` unless you need catch-all
- Don't mix server and client imports incorrectly
- Always validate form data with Zod in server actions
- Handle edge runtime limitations (no Node.js APIs)

### 2. tRPC v11 End-to-End Type Safety

**tRPC Setup (`src/server/api/trpc.ts`):**
```typescript
import { initTRPC, TRPCError } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import { auth, clerkClient } from "@clerk/nextjs/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { db } from "@/server/db";

interface CreateContextOptions {
  userId: string | null;
  orgId: string | null;
}

export const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    userId: opts.userId,
    orgId: opts.orgId,
    db,
    clerk: clerkClient,
  };
};

export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { userId, orgId } = await auth();

  return createInnerTRPCContext({
    userId,
    orgId,
  });
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// Middleware for authentication
const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  // Fetch user from database
  const user = await ctx.db.user.findUnique({
    where: { id: ctx.userId },
  });

  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      userId: ctx.userId,
      user,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

// Middleware for organization access
const enforceOrgAccess = t.middleware(async ({ ctx, next, input }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const orgId = (input as { orgId?: string }).orgId;

  if (!orgId) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "orgId is required" });
  }

  // Check if user is member of the organization
  const membership = await ctx.db.organizationMembership.findFirst({
    where: {
      userId: ctx.userId,
      organizationId: orgId,
    },
  });

  if (!membership) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }

  return next({
    ctx: {
      userId: ctx.userId,
      orgId,
      membership,
    },
  });
});

export const orgProcedure = protectedProcedure.use(enforceOrgAccess);

// Middleware for rate limiting
const ratelimit = t.middleware(async ({ ctx, next, path }) => {
  if (!ctx.userId) {
    return next();
  }

  // Implement rate limiting logic here
  // Example with Upstash Redis:
  // const { success } = await ratelimit.limit(ctx.userId);
  // if (!success) {
  //   throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
  // }

  return next();
});

export const rateLimitedProcedure = protectedProcedure.use(ratelimit);
```

**Root Router (`src/server/api/root.ts`):**
```typescript
import { createTRPCRouter } from "@/server/api/trpc";
import { userRouter } from "@/server/api/routers/user";
import { orgRouter } from "@/server/api/routers/org";
import { postRouter } from "@/server/api/routers/post";
import { billingRouter } from "@/server/api/routers/billing";

export const appRouter = createTRPCRouter({
  user: userRouter,
  org: orgRouter,
  post: postRouter,
  billing: billingRouter,
});

export type AppRouter = typeof appRouter;
```

**Example Router (`src/server/api/routers/post.ts`):**
```typescript
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  orgProcedure,
} from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

export const postRouter = createTRPCRouter({
  // List posts with pagination and filtering
  list: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(10),
        orgId: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit, orgId, search } = input;

      const where: Prisma.PostWhereInput = {
        userId: ctx.userId,
        ...(orgId && { organizationId: orgId }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { content: { contains: search, mode: "insensitive" } },
          ],
        }),
      };

      const posts = await ctx.db.post.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              imageUrl: true,
            },
          },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (posts.length > limit) {
        const nextItem = posts.pop();
        nextCursor = nextItem!.id;
      }

      return {
        posts,
        nextCursor,
      };
    }),

  // Get single post by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.db.post.findUnique({
        where: { id: input.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              imageUrl: true,
            },
          },
        },
      });

      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Check if user has access
      if (post.userId !== ctx.userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return post;
    }),

  // Create post
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(3).max(100),
        content: z.string().min(10).max(10000),
        orgId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check subscription limits
      const subscription = await ctx.db.subscription.findUnique({
        where: { userId: ctx.userId },
      });

      if (subscription?.plan === "free") {
        const postCount = await ctx.db.post.count({
          where: { userId: ctx.userId },
        });

        if (postCount >= 3) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Free plan limit reached. Please upgrade.",
          });
        }
      }

      const post = await ctx.db.post.create({
        data: {
          ...input,
          userId: ctx.userId,
          organizationId: input.orgId,
        },
      });

      return post;
    }),

  // Update post
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(3).max(100).optional(),
        content: z.string().min(10).max(10000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Check ownership
      const existing = await ctx.db.post.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (existing.userId !== ctx.userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const post = await ctx.db.post.update({
        where: { id },
        data,
      });

      return post;
    }),

  // Delete post
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check ownership
      const existing = await ctx.db.post.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (existing.userId !== ctx.userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db.post.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
```

**Client Setup (`src/lib/trpc/client.ts`):**
```typescript
"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";
import { type AppRouter } from "@/server/api/root";

export const api = createTRPCReact<AppRouter>();

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {props.children}
      </QueryClientProvider>
    </api.Provider>
  );
}

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}
```

**Server Setup (`src/lib/trpc/server.ts`):**
```typescript
import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { createCaller } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

const createContext = cache(() => {
  const heads = new Headers(headers());
  heads.set("x-trpc-source", "rsc");

  return createTRPCContext({
    headers: heads,
  });
});

export const api = createCaller(createContext);
```

**Best Practices:**
- Use `protectedProcedure` for authenticated routes
- Validate all inputs with Zod schemas
- Return meaningful error codes (UNAUTHORIZED, FORBIDDEN, NOT_FOUND, etc.)
- Implement pagination for list endpoints
- Use transactions for multi-step operations
- Cache query results appropriately
- Use `superjson` for Date, Map, Set serialization
- Implement optimistic updates on the client
- Use React Query devtools in development
- Batch requests automatically with httpBatchLink

**Common Patterns:**

*Infinite Query:*
```typescript
"use client";

import { api } from "@/lib/trpc/client";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";

export function InfinitePostList() {
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = api.post.list.useInfiniteQuery(
    { limit: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  return (
    <div>
      {data?.pages.map((page) =>
        page.posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
      {hasNextPage && <div ref={ref}>Loading more...</div>}
    </div>
  );
}
```

*Optimistic Updates:*
```typescript
const utils = api.useContext();

const deletePost = api.post.delete.useMutation({
  onMutate: async (deletedPost) => {
    await utils.post.list.cancel();
    const previousPosts = utils.post.list.getData();

    utils.post.list.setData(
      { limit: 10 },
      (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: page.posts.filter((p) => p.id !== deletedPost.id),
          })),
        };
      }
    );

    return { previousPosts };
  },
  onError: (err, deletedPost, context) => {
    utils.post.list.setData({ limit: 10 }, context?.previousPosts);
  },
  onSettled: () => {
    utils.post.list.invalidate();
  },
});
```

**Gotchas:**
- Don't forget to export `type AppRouter` from root.ts
- Server components can't use tRPC hooks - use server caller instead
- Middleware context is immutable - return new context from `next()`
- Input validation errors are automatically handled with Zod
- Use `createCaller` for server-side calls, not the client
- Remember to invalidate queries after mutations
- Batching only works with httpBatchLink
- Don't use tRPC for file uploads - use uploadthing or similar
- Error codes must be valid TRPC error codes
- Transformers must be the same on client and server

### 3. Prisma ORM + Database Design

**Schema (`prisma/schema.prisma`):**
```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "fullTextIndex"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DATABASE_DIRECT_URL") // For migrations on connection poolers
}

// User model synced with Clerk
model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  email     String   @unique
  name      String?
  imageUrl  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  posts              Post[]
  subscriptions      Subscription[]
  organizationMemberships OrganizationMembership[]
  ownedOrganizations Organization[] @relation("OrganizationOwner")

  @@index([clerkId])
  @@index([email])
}

// Organization for multi-tenancy
model Organization {
  id          String   @id @default(cuid())
  clerkOrgId  String   @unique
  name        String
  slug        String   @unique
  imageUrl    String?
  ownerId     String
  plan        Plan     @default(FREE)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  owner       User     @relation("OrganizationOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  members     OrganizationMembership[]
  posts       Post[]
  subscription Subscription?

  @@index([ownerId])
  @@index([slug])
}

// Organization membership with roles
model OrganizationMembership {
  id             String   @id @default(cuid())
  userId         String
  organizationId String
  role           OrgRole  @default(MEMBER)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([userId, organizationId])
  @@index([userId])
  @@index([organizationId])
}

enum OrgRole {
  OWNER
  ADMIN
  MEMBER
}

// Content model
model Post {
  id             String   @id @default(cuid())
  title          String
  content        String   @db.Text
  published      Boolean  @default(false)
  userId         String
  organizationId String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([organizationId])
  @@index([createdAt])
  @@fulltext([title, content])
}

// Subscription management
model Subscription {
  id                   String   @id @default(cuid())
  userId               String?  @unique
  organizationId       String?  @unique
  stripeCustomerId     String   @unique
  stripeSubscriptionId String?  @unique
  stripePriceId        String?
  stripeCurrentPeriodEnd DateTime?
  plan                 Plan     @default(FREE)
  status               SubscriptionStatus @default(ACTIVE)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  // Relations
  user         User?         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([organizationId])
  @@index([stripeCustomerId])
  @@index([stripeSubscriptionId])
}

enum Plan {
  FREE
  PRO
  ENTERPRISE
}

enum SubscriptionStatus {
  ACTIVE
  CANCELED
  INCOMPLETE
  INCOMPLETE_EXPIRED
  PAST_DUE
  TRIALING
  UNPAID
}

// Usage tracking
model Usage {
  id        String   @id @default(cuid())
  userId    String
  feature   String
  count     Int      @default(0)
  month     String   // Format: YYYY-MM
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, feature, month])
  @@index([userId])
  @@index([month])
}

// Webhook events for idempotency
model WebhookEvent {
  id        String   @id @default(cuid())
  type      String
  payload   Json
  processed Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([type])
  @@index([processed])
  @@index([createdAt])
}
```

**Database Client (`src/server/db.ts`):**
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

**Seed Script (`prisma/seed.ts`):**
```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create test user
  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      clerkId: "user_test123",
      email: "test@example.com",
      name: "Test User",
    },
  });

  // Create test organization
  const org = await prisma.organization.upsert({
    where: { slug: "test-org" },
    update: {},
    create: {
      clerkOrgId: "org_test123",
      name: "Test Organization",
      slug: "test-org",
      ownerId: user.id,
      plan: "PRO",
    },
  });

  // Create organization membership
  await prisma.organizationMembership.upsert({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: org.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      organizationId: org.id,
      role: "OWNER",
    },
  });

  // Create test posts
  await prisma.post.createMany({
    data: [
      {
        title: "First Post",
        content: "This is the first test post",
        userId: user.id,
        organizationId: org.id,
        published: true,
      },
      {
        title: "Second Post",
        content: "This is the second test post",
        userId: user.id,
        organizationId: org.id,
        published: false,
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Best Practices:**
- Use `cuid()` for IDs (better than UUID for database performance)
- Add indexes on foreign keys and frequently queried fields
- Use `@db.Text` for large text fields
- Implement soft deletes for important data
- Use enums for fixed sets of values
- Add `@@unique` constraints for natural keys
- Use cascading deletes appropriately
- Implement `createdAt` and `updatedAt` on all models
- Use connection pooling for serverless (PgBouncer)
- Separate `DATABASE_URL` and `DATABASE_DIRECT_URL` for migrations

**Common Patterns:**

*Transactions:*
```typescript
const result = await db.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: { email: "test@example.com", clerkId: "123" },
  });

  const org = await tx.organization.create({
    data: {
      name: "My Org",
      slug: "my-org",
      ownerId: user.id,
      clerkOrgId: "456",
    },
  });

  await tx.organizationMembership.create({
    data: {
      userId: user.id,
      organizationId: org.id,
      role: "OWNER",
    },
  });

  return { user, org };
});
```

*Full-text Search:*
```typescript
const posts = await db.post.findMany({
  where: {
    OR: [
      { title: { search: "nextjs" } },
      { content: { search: "nextjs" } },
    ],
  },
});
```

*Aggregations:*
```typescript
const stats = await db.post.aggregate({
  where: { userId: "123" },
  _count: true,
  _avg: { views: true },
  _sum: { views: true },
});
```

**Gotchas:**
- Prisma Client must be regenerated after schema changes (`prisma generate`)
- Use `directUrl` for migrations when using connection poolers
- Don't use `db` in edge runtime - use Prisma Data Proxy or different DB
- Cascading deletes can cause unexpected data loss
- Indexes slow down writes but speed up reads
- Full-text search requires PostgreSQL or MySQL
- Can't use enums across different schemas
- Migration failures can leave database in inconsistent state
- Connection pooling needed for serverless deployments
- Raw queries bypass type safety

### 4. Clerk Authentication

**Clerk Setup:**
```typescript
// middleware.ts
import { authMiddleware } from "@clerk/nextjs/server";

export default authMiddleware({
  publicRoutes: ["/", "/pricing", "/about", "/api/webhooks/(.*)"],
  ignoredRoutes: ["/api/uploadthing"],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

**User Synchronization (`app/api/webhooks/clerk/route.ts`):**
```typescript
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";
import { db } from "@/server/db";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Missing CLERK_WEBHOOK_SECRET");
  }

  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error: Verification failed", { status: 400 });
  }

  const eventType = evt.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, image_url, first_name, last_name } = evt.data;

    await db.user.upsert({
      where: { clerkId: id },
      create: {
        clerkId: id,
        email: email_addresses[0].email_address,
        name: `${first_name} ${last_name}`,
        imageUrl: image_url,
      },
      update: {
        email: email_addresses[0].email_address,
        name: `${first_name} ${last_name}`,
        imageUrl: image_url,
      },
    });
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;

    await db.user.delete({
      where: { clerkId: id },
    });
  }

  if (eventType === "organization.created" || eventType === "organization.updated") {
    const { id, name, slug, image_url, created_by } = evt.data;

    const user = await db.user.findUnique({
      where: { clerkId: created_by },
    });

    if (!user) {
      return new Response("Error: User not found", { status: 404 });
    }

    await db.organization.upsert({
      where: { clerkOrgId: id },
      create: {
        clerkOrgId: id,
        name,
        slug: slug!,
        imageUrl: image_url,
        ownerId: user.id,
      },
      update: {
        name,
        slug: slug!,
        imageUrl: image_url,
      },
    });
  }

  if (eventType === "organizationMembership.created") {
    const { organization, public_user_data } = evt.data;

    const [user, org] = await Promise.all([
      db.user.findUnique({ where: { clerkId: public_user_data.user_id } }),
      db.organization.findUnique({ where: { clerkOrgId: organization.id } }),
    ]);

    if (!user || !org) {
      return new Response("Error: User or org not found", { status: 404 });
    }

    await db.organizationMembership.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        role: "MEMBER",
      },
    });
  }

  return new Response("Webhook processed", { status: 200 });
}
```

**Auth Utilities (`src/lib/auth.ts`):**
```typescript
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/server/db";

export async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: {
      subscriptions: true,
      organizationMemberships: {
        include: {
          organization: true,
        },
      },
    },
  });

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

export async function requireOrg(orgId: string) {
  const user = await requireAuth();

  const membership = user.organizationMemberships.find(
    (m) => m.organizationId === orgId
  );

  if (!membership) {
    throw new Error("Forbidden");
  }

  return { user, membership };
}

export async function requireRole(orgId: string, requiredRole: "OWNER" | "ADMIN") {
  const { membership } = await requireOrg(orgId);

  const roles = ["MEMBER", "ADMIN", "OWNER"];
  const userRoleIndex = roles.indexOf(membership.role);
  const requiredRoleIndex = roles.indexOf(requiredRole);

  if (userRoleIndex < requiredRoleIndex) {
    throw new Error("Forbidden");
  }

  return membership;
}
```

**Best Practices:**
- Always verify webhook signatures
- Sync user data to your database via webhooks
- Use Clerk's middleware for route protection
- Implement proper RBAC with organization roles
- Use `UserButton` for consistent UI
- Configure social providers in Clerk dashboard
- Handle webhook idempotency
- Test webhooks with Clerk's webhook tester
- Use `afterSignInUrl` and `afterSignUpUrl` for redirects
- Implement proper error handling for webhook failures

**Common Patterns:**

*Protect API Routes:*
```typescript
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Your logic here
}
```

*Organization Switcher:*
```typescript
import { OrganizationSwitcher } from "@clerk/nextjs";

export function Header() {
  return (
    <header>
      <OrganizationSwitcher
        afterCreateOrganizationUrl="/dashboard/:slug"
        afterSelectOrganizationUrl="/dashboard/:slug"
      />
    </header>
  );
}
```

**Gotchas:**
- Webhook signatures must be verified with svix
- User creation is async - may not be immediate in webhooks
- Organization slugs must be unique
- Clerk IDs are different from your database IDs
- Middleware runs on all routes unless excluded
- `currentUser()` is only for server components
- `useUser()` is only for client components
- Can't use Clerk on edge runtime without clerk-edge package
- Webhook events can arrive out of order
- Organization memberships need manual RBAC implementation

### 5. Stripe Integration

**Stripe Setup (`src/lib/stripe.ts`):**
```typescript
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
  typescript: true,
});

export const PLANS = {
  FREE: {
    name: "Free",
    price: 0,
    stripePriceId: null,
    features: [
      "3 posts per month",
      "Basic support",
      "Community access",
    ],
    limits: {
      posts: 3,
    },
  },
  PRO: {
    name: "Pro",
    price: 29,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID!,
    features: [
      "Unlimited posts",
      "Priority support",
      "Advanced analytics",
      "Custom domain",
    ],
    limits: {
      posts: Infinity,
    },
  },
  ENTERPRISE: {
    name: "Enterprise",
    price: 99,
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
    features: [
      "Everything in Pro",
      "Dedicated support",
      "SLA guarantee",
      "Custom integrations",
    ],
    limits: {
      posts: Infinity,
    },
  },
} as const;
```

**Billing Router (`src/server/api/routers/billing.ts`):**
```typescript
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { stripe, PLANS } from "@/lib/stripe";
import { TRPCError } from "@trpc/server";

export const billingRouter = createTRPCRouter({
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await ctx.db.subscription.findUnique({
      where: { userId: ctx.userId },
    });

    return subscription;
  }),

  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        priceId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.userId },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Get or create Stripe customer
      let subscription = await ctx.db.subscription.findUnique({
        where: { userId: ctx.userId },
      });

      let customerId = subscription?.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            userId: ctx.userId,
          },
        });

        customerId = customer.id;

        subscription = await ctx.db.subscription.create({
          data: {
            userId: ctx.userId,
            stripeCustomerId: customerId,
            plan: "FREE",
            status: "ACTIVE",
          },
        });
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: input.priceId,
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?canceled=true`,
        metadata: {
          userId: ctx.userId,
        },
      });

      return { sessionId: session.id };
    }),

  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    const subscription = await ctx.db.subscription.findUnique({
      where: { userId: ctx.userId },
    });

    if (!subscription?.stripeCustomerId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No subscription found",
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`,
    });

    return { url: session.url };
  }),
});
```

**Stripe Webhook (`app/api/webhooks/stripe/route.ts`):**
```typescript
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { db } from "@/server/db";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("stripe-signature");

  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Webhook error", { status: 400 });
  }

  // Check idempotency
  const existing = await db.webhookEvent.findFirst({
    where: {
      type: event.type,
      payload: {
        equals: event.data.object,
      },
    },
  });

  if (existing?.processed) {
    return new Response("Already processed", { status: 200 });
  }

  // Store webhook event
  const webhookEvent = await db.webhookEvent.create({
    data: {
      type: event.type,
      payload: event.data.object as any,
      processed: false,
    },
  });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (!userId) break;

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        await db.subscription.update({
          where: { userId },
          data: {
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date(
              subscription.current_period_end * 1000
            ),
            plan: getPlanFromPriceId(subscription.items.data[0].price.id),
            status: subscription.status.toUpperCase() as any,
          },
        });

        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        const dbSubscription = await db.subscription.findUnique({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (!dbSubscription) break;

        await db.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date(
              subscription.current_period_end * 1000
            ),
            plan:
              subscription.status === "canceled"
                ? "FREE"
                : getPlanFromPriceId(subscription.items.data[0].price.id),
            status: subscription.status.toUpperCase() as any,
          },
        });

        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;

        if (!invoice.subscription) break;

        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string
        );

        await db.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            stripeCurrentPeriodEnd: new Date(
              subscription.current_period_end * 1000
            ),
            status: subscription.status.toUpperCase() as any,
          },
        });

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;

        if (!invoice.subscription) break;

        await db.subscription.update({
          where: { stripeSubscriptionId: invoice.subscription as string },
          data: {
            status: "PAST_DUE",
          },
        });

        break;
      }
    }

    // Mark as processed
    await db.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: { processed: true },
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response("Processing error", { status: 500 });
  }

  return new Response("Webhook processed", { status: 200 });
}

function getPlanFromPriceId(priceId: string): "FREE" | "PRO" | "ENTERPRISE" {
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return "PRO";
  if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) return "ENTERPRISE";
  return "FREE";
}
```

**Pricing Page Component:**
```typescript
"use client";

import { loadStripe } from "@stripe/stripe-js";
import { api } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/stripe";
import { toast } from "sonner";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function PricingCards() {
  const createCheckoutSession = api.billing.createCheckoutSession.useMutation({
    onSuccess: async (data) => {
      const stripe = await stripePromise;
      await stripe?.redirectToCheckout({ sessionId: data.sessionId });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubscribe = (priceId: string) => {
    createCheckoutSession.mutate({ priceId });
  };

  return (
    <div className="grid gap-8 md:grid-cols-3">
      {Object.entries(PLANS).map(([key, plan]) => (
        <div key={key} className="rounded-lg border p-6">
          <h3 className="text-2xl font-bold">{plan.name}</h3>
          <p className="mt-2 text-4xl font-bold">
            ${plan.price}
            <span className="text-lg font-normal text-muted-foreground">/mo</span>
          </p>
          <ul className="mt-6 space-y-4">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-center">
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-3">{feature}</span>
              </li>
            ))}
          </ul>
          <Button
            className="mt-6 w-full"
            onClick={() => plan.stripePriceId && handleSubscribe(plan.stripePriceId)}
            disabled={!plan.stripePriceId || createCheckoutSession.isPending}
          >
            {plan.stripePriceId ? "Subscribe" : "Current Plan"}
          </Button>
        </div>
      ))}
    </div>
  );
}
```

**Best Practices:**
- Always verify webhook signatures
- Implement idempotency for webhooks
- Use metadata to link Stripe objects to your users
- Handle all subscription lifecycle events
- Use Stripe Customer Portal for self-service
- Test with Stripe CLI webhooks locally
- Store subscription end dates for grace periods
- Handle failed payments gracefully
- Use Stripe's test mode for development
- Log all webhook events for debugging

**Common Patterns:**

*Usage-Based Billing:*
```typescript
async function trackUsage(userId: string, feature: string) {
  const month = new Date().toISOString().slice(0, 7); // YYYY-MM

  await db.usage.upsert({
    where: {
      userId_feature_month: {
        userId,
        feature,
        month,
      },
    },
    create: {
      userId,
      feature,
      month,
      count: 1,
    },
    update: {
      count: {
        increment: 1,
      },
    },
  });

  // Report to Stripe for usage-based billing
  const subscription = await db.subscription.findUnique({
    where: { userId },
  });

  if (subscription?.stripeSubscriptionId) {
    await stripe.subscriptionItems.createUsageRecord(
      subscription.stripeSubscriptionId,
      {
        quantity: 1,
        timestamp: Math.floor(Date.now() / 1000),
      }
    );
  }
}
```

*Trial Periods:*
```typescript
const session = await stripe.checkout.sessions.create({
  customer: customerId,
  mode: "subscription",
  subscription_data: {
    trial_period_days: 14,
  },
  // ... other options
});
```

**Gotchas:**
- Webhook events can arrive out of order
- Test clock in Stripe doesn't trigger real webhooks
- Subscription updates may not be immediate
- Customer Portal requires return_url
- Price IDs are different in test vs production
- Webhooks must respond within 30 seconds
- Subscription status can be complex (trialing, past_due, etc.)
- Invoice payment_failed doesn't mean subscription is canceled
- Can't delete customers with active subscriptions
- Metadata has size limits (500 chars per key)

### 6. Deployment & Environment Configuration

**Environment Variables (`.env.example`):**
```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname?pgbouncer=true"
DATABASE_DIRECT_URL="postgresql://user:password@host:5432/dbname"

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_xxx"
CLERK_SECRET_KEY="sk_test_xxx"
CLERK_WEBHOOK_SECRET="whsec_xxx"

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_xxx"
STRIPE_SECRET_KEY="sk_test_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"
STRIPE_PRO_PRICE_ID="price_xxx"
STRIPE_ENTERPRISE_PRICE_ID="price_xxx"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Optional: Uploadthing
UPLOADTHING_SECRET="sk_xxx"
UPLOADTHING_APP_ID="xxx"

# Optional: Resend
RESEND_API_KEY="re_xxx"

# Optional: Sentry
NEXT_PUBLIC_SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
SENTRY_AUTH_TOKEN="xxx"
```

**Next.js Config (`next.config.ts`):**
```typescript
import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,

  // TypeScript and ESLint
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Images
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "uploadthing.com",
      },
    ],
  },

  // Bundle analyzer (optional)
  ...(process.env.ANALYZE === "true" && {
    webpack: (config, { isServer }) => {
      if (!isServer) {
        const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: "static",
            openAnalyzer: false,
          })
        );
      }
      return config;
    },
  }),

  // Headers for security
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default config;
```

**Package.json Scripts:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "stripe:listen": "stripe listen --forward-to localhost:3000/api/webhooks/stripe",
    "clerk:listen": "clerk listen --forward-to localhost:3000/api/webhooks/clerk"
  }
}
```

**Vercel Deployment:**
1. Connect GitHub repository
2. Set environment variables in Vercel dashboard
3. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
4. Add webhook URLs to Clerk and Stripe:
   - Clerk: `https://yourdomain.com/api/webhooks/clerk`
   - Stripe: `https://yourdomain.com/api/webhooks/stripe`

**Database Providers:**

*Neon (Recommended):*
```bash
# Connection pooling for serverless
DATABASE_URL="postgresql://user:pass@host.neon.tech/dbname?sslmode=require&pgbouncer=true"
DATABASE_DIRECT_URL="postgresql://user:pass@host.neon.tech/dbname?sslmode=require"
```

*Supabase:*
```bash
# Transaction mode for pooler
DATABASE_URL="postgresql://postgres:pass@host.supabase.co:6543/postgres?pgbouncer=true"
DATABASE_DIRECT_URL="postgresql://postgres:pass@host.supabase.co:5432/postgres"
```

*Railway:*
```bash
# No pooler needed (dedicated instance)
DATABASE_URL="postgresql://postgres:pass@host.railway.app:5432/railway"
DATABASE_DIRECT_URL="postgresql://postgres:pass@host.railway.app:5432/railway"
```

**Best Practices:**
- Never commit .env.local to git
- Use different Stripe/Clerk keys for production
- Enable Vercel's automatic HTTPS
- Use Vercel Environment Variables for secrets
- Set up preview deployments for PRs
- Configure custom domains in Vercel
- Use Vercel's Edge Config for feature flags
- Enable Vercel Analytics and Speed Insights
- Set up Sentry for error tracking
- Use Vercel's Image Optimization
- Configure CORS properly for API routes
- Use Vercel's cron jobs for scheduled tasks

**Common Patterns:**

*Feature Flags:*
```typescript
import { get } from "@vercel/edge-config";

export async function isFeatureEnabled(feature: string): Promise<boolean> {
  return (await get(feature)) === true;
}
```

*Rate Limiting:*
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

export async function checkRateLimit(identifier: string) {
  const { success } = await ratelimit.limit(identifier);
  return success;
}
```

**Gotchas:**
- Edge runtime doesn't support all Node.js APIs
- Database connection pooling required for serverless
- Vercel has 10-second timeout for serverless functions
- Webhooks need to be re-configured for production URLs
- Environment variables must be set in Vercel dashboard
- Preview deployments use production environment variables
- Custom domains require DNS configuration
- Vercel's free tier has bandwidth limits
- Database migrations must run before deployment
- API routes are serverless by default

## 💡 Real-World Examples

### Example 1: Complete SaaS Starter Project

```bash
# Initialize project
npx create-next-app@latest my-saas --typescript --tailwind --app --src-dir
cd my-saas

# Install dependencies
pnpm add @clerk/nextjs @prisma/client stripe @stripe/stripe-js
pnpm add @trpc/server @trpc/client @trpc/react-query @trpc/next
pnpm add @tanstack/react-query zod superjson
pnpm add lucide-react class-variance-authority clsx tailwind-merge
pnpm add react-hook-form @hookform/resolvers
pnpm add sonner

pnpm add -D prisma tsx @types/node

# Initialize Prisma
npx prisma init

# Setup shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button input label textarea

# Create directory structure
mkdir -p src/server/api/routers
mkdir -p src/lib/validations
mkdir -p app/\(auth\) app/\(dashboard\) app/\(marketing\)
mkdir -p app/api/webhooks/clerk app/api/webhooks/stripe

# Initialize Git
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
gh repo create my-saas --public --source=. --remote=origin --push

# Deploy to Vercel
vercel --prod
```

### Example 2: Multi-Tenant Blog Platform

**Schema additions:**
```prisma
model Blog {
  id             String   @id @default(cuid())
  title          String
  description    String?
  domain         String?  @unique
  subdomain      String   @unique
  organizationId String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  posts        BlogPost[]

  @@index([organizationId])
  @@index([subdomain])
  @@index([domain])
}

model BlogPost {
  id          String   @id @default(cuid())
  title       String
  content     String   @db.Text
  slug        String
  published   Boolean  @default(false)
  blogId      String
  authorId    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  blog   Blog @relation(fields: [blogId], references: [id], onDelete: Cascade)
  author User @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@unique([blogId, slug])
  @@index([blogId])
  @@index([authorId])
}
```

**Dynamic subdomain routing:**
```typescript
// middleware.ts
import { authMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default authMiddleware({
  beforeAuth: async (req) => {
    const url = req.nextUrl;
    const hostname = req.headers.get("host") || "";
    const subdomain = hostname.split(".")[0];

    // Check if it's a custom subdomain
    if (subdomain && !["www", "app"].includes(subdomain)) {
      // Rewrite to blog route
      return NextResponse.rewrite(
        new URL(`/blog/${subdomain}${url.pathname}`, req.url)
      );
    }

    return NextResponse.next();
  },
  publicRoutes: ["/", "/blog/:path*"],
});
```

### Example 3: Team Collaboration Tool

**Real-time updates with Server-Sent Events:**
```typescript
// app/api/events/route.ts
import { auth } from "@clerk/nextjs/server";
import { db } from "@/server/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let intervalId: NodeJS.Timeout;

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode("data: Connected\n\n"));

      intervalId = setInterval(async () => {
        const updates = await db.update.findMany({
          where: {
            userId,
            createdAt: {
              gte: new Date(Date.now() - 5000), // Last 5 seconds
            },
          },
        });

        if (updates.length > 0) {
          const data = `data: ${JSON.stringify(updates)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
      }, 5000);
    },
    cancel() {
      clearInterval(intervalId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
```

**Client-side SSE consumer:**
```typescript
"use client";

import { useEffect, useState } from "react";

export function RealtimeUpdates() {
  const [updates, setUpdates] = useState<any[]>([]);

  useEffect(() => {
    const eventSource = new EventSource("/api/events");

    eventSource.onmessage = (event) => {
      if (event.data === "Connected") return;

      const newUpdates = JSON.parse(event.data);
      setUpdates((prev) => [...newUpdates, ...prev]);
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div>
      {updates.map((update) => (
        <div key={update.id}>{update.message}</div>
      ))}
    </div>
  );
}
```

### Example 4: Advanced File Upload with Uploadthing

**Uploadthing Setup:**
```typescript
// src/lib/uploadthing.ts
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const { userId } = await auth();

      if (!userId) throw new Error("Unauthorized");

      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);

      // Save to database
      await db.upload.create({
        data: {
          userId: metadata.userId,
          url: file.url,
          name: file.name,
          size: file.size,
        },
      });

      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
```

**Route handler:**
```typescript
// app/api/uploadthing/route.ts
import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "@/lib/uploadthing";

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
```

**Client component:**
```typescript
"use client";

import { UploadButton } from "@/lib/uploadthing";

export function Upload() {
  return (
    <UploadButton
      endpoint="imageUploader"
      onClientUploadComplete={(res) => {
        console.log("Files: ", res);
        alert("Upload Completed");
      }}
      onUploadError={(error: Error) => {
        alert(`ERROR! ${error.message}`);
      }}
    />
  );
}
```

## 🔗 Related Skills

- **next-grab** - Grab and clone existing Next.js projects
- **db-wizard** - Advanced database schema design
- **api-fortress** - API security and rate limiting
- **test-commander** - E2E testing with Playwright
- **deploy-master** - Advanced deployment strategies
- **monitoring-sentinel** - Production monitoring setup

## 📖 Further Reading

### Official Documentation
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)

### Best Practices
- [Next.js App Router Patterns](https://nextjs.org/docs/app/building-your-application/routing)
- [tRPC Best Practices](https://trpc.io/docs/best-practices)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Clerk Multi-Tenancy Guide](https://clerk.com/docs/organizations/overview)

### Video Tutorials
- [Theo - T3 Stack Tutorial](https://www.youtube.com/c/TheoBrowne1017)
- [Web Dev Cody - Next.js SaaS](https://www.youtube.com/c/WebDevCody)
- [Josh tried coding - Full Stack Apps](https://www.youtube.com/c/joshtriedcoding)

### GitHub Templates
- [create-t3-app](https://github.com/t3-oss/create-t3-app) - T3 Stack CLI
- [taxonomy](https://github.com/shadcn/taxonomy) - shadcn's Next.js template
- [nextjs-subscription-payments](https://github.com/vercel/nextjs-subscription-payments) - Vercel's Stripe template

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
*Last updated: 2025-12-04*
