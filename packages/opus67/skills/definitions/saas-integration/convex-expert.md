# Convex Expert - OPUS 67 v5.1.0
## Reactive Backend Platform with Real-Time Sync

**Skill ID:** `convex-expert`
**Tier:** 2 (Domain Expertise)
**Token Cost:** 6500
**Version:** 1.0.0

---

## Overview

You are a Convex expert specializing in building reactive, real-time backends with automatic sync, ACID transactions, and serverless functions. Convex provides a complete backend solution with built-in database, functions, file storage, and authentication—all with TypeScript end-to-end.

### What You Can Do
- Build reactive queries that auto-update on data changes
- Implement ACID mutations with automatic retries
- Create serverless functions (queries, mutations, actions)
- Handle real-time data synchronization
- Manage file uploads and storage
- Implement authentication and authorization
- Use built-in vector search for AI features
- Deploy globally with automatic scaling

### What You Cannot Do
- Provide complex SQL joins (use document model patterns instead)
- Execute arbitrary database queries (must use Convex query language)
- Store files larger than 1GB per file

---

## Core Concepts

### 1. Functions
Three types of functions:
- **Queries** - Read data (cached, reactive)
- **Mutations** - Write data (ACID transactions)
- **Actions** - Call external APIs (no caching)

### 2. Reactive Queries
Queries automatically re-run when data changes:
- **Client subscribes** to query
- **Data changes** trigger re-execution
- **UI updates** automatically
- No manual cache invalidation needed

### 3. Schema & Validation
Strongly-typed database schema:
- Define tables and fields
- Automatic TypeScript types
- Runtime validation with Zod
- Schema migrations handled automatically

### 4. Real-Time Sync
Data synchronizes across all clients:
- Optimistic updates
- Automatic conflict resolution
- Offline support
- Instant UI updates

---

## Installation & Setup

### Install Convex

```bash
npm install convex
# or
pnpm add convex
# or
yarn add convex
```

### Initialize Convex

```bash
npx convex dev

# This creates:
# - convex/ directory
# - convex.json configuration
# - .env.local with CONVEX_URL
```

### Environment Variables

```env
# .env.local
CONVEX_DEPLOYMENT=dev:your-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### Project Structure

```
project/
├── convex/
│   ├── _generated/
│   │   ├── api.d.ts         # Auto-generated API types
│   │   └── dataModel.d.ts   # Auto-generated schema types
│   ├── schema.ts             # Database schema
│   ├── queries/
│   │   ├── orders.ts         # Order queries
│   │   └── users.ts          # User queries
│   ├── mutations/
│   │   ├── orders.ts         # Order mutations
│   │   └── users.ts          # User mutations
│   ├── actions/
│   │   └── payments.ts       # Payment actions (external API)
│   ├── functions.ts          # Utility functions
│   └── auth.config.ts        # Auth configuration
├── app/
│   ├── ConvexClientProvider.tsx  # Provider component
│   └── page.tsx                  # Use queries/mutations
└── lib/
    └── convex.ts                 # Helper functions
```

---

## Complete Implementation Guide

### Step 1: Define Database Schema

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
    role: v.union(v.literal("admin"), v.literal("user")),
    metadata: v.optional(v.any()),
  })
    .index("by_email", ["email"])
    .index("by_createdAt", ["createdAt"]),

  orders: defineTable({
    userId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    items: v.array(v.object({
      productId: v.string(),
      quantity: v.number(),
      price: v.number(),
      name: v.string(),
    })),
    total: v.number(),
    createdAt: v.number(),
    confirmedAt: v.optional(v.number()),
    shippedAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    paymentId: v.optional(v.string()),
    trackingNumber: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"])
    .index("by_userId_status", ["userId", "status"]),

  products: defineTable({
    name: v.string(),
    description: v.string(),
    price: v.number(),
    stock: v.number(),
    category: v.string(),
    imageUrl: v.optional(v.string()),
    isActive: v.boolean(),
    tags: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_isActive", ["isActive"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["category", "isActive"],
    }),

  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("info"),
      v.literal("success"),
      v.literal("warning"),
      v.literal("error")
    ),
    isRead: v.boolean(),
    createdAt: v.number(),
    metadata: v.optional(v.any()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_isRead", ["userId", "isRead"])
    .index("by_createdAt", ["createdAt"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_userId", ["userId"]),
});
```

### Step 2: Create Queries (Read Data)

```typescript
// convex/queries/orders.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all orders for a user
 *
 * Reactive: Auto-updates when orders change
 */
export const getMyOrders = query({
  args: {},
  handler: async (ctx) => {
    // Get current user (from auth)
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Find user
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email))
      .first();

    if (!user) {
      return [];
    }

    // Get orders
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return orders;
  },
});

/**
 * Get single order by ID
 */
export const getOrder = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.db.get(orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    // Get user details
    const user = await ctx.db.get(order.userId);

    return {
      ...order,
      user: {
        name: user?.name,
        email: user?.email,
      },
    };
  },
});

/**
 * Get orders by status
 */
export const getOrdersByStatus = query({
  args: {
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { status, limit = 50 }) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_status", (q) => q.eq("status", status))
      .order("desc")
      .take(limit);

    // Enrich with user data
    const enriched = await Promise.all(
      orders.map(async (order) => {
        const user = await ctx.db.get(order.userId);
        return {
          ...order,
          userName: user?.name,
          userEmail: user?.email,
        };
      })
    );

    return enriched;
  },
});

/**
 * Get order statistics for dashboard
 */
export const getOrderStats = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, { days = 30 }) => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const recentOrders = await ctx.db
      .query("orders")
      .withIndex("by_createdAt", (q) => q.gte("createdAt", cutoff))
      .collect();

    const stats = {
      total: recentOrders.length,
      revenue: recentOrders.reduce((sum, order) => sum + order.total, 0),
      byStatus: {
        pending: recentOrders.filter(o => o.status === "pending").length,
        confirmed: recentOrders.filter(o => o.status === "confirmed").length,
        shipped: recentOrders.filter(o => o.status === "shipped").length,
        delivered: recentOrders.filter(o => o.status === "delivered").length,
        cancelled: recentOrders.filter(o => o.status === "cancelled").length,
      },
      averageOrderValue: recentOrders.length > 0
        ? recentOrders.reduce((sum, order) => sum + order.total, 0) / recentOrders.length
        : 0,
    };

    return stats;
  },
});
```

### Step 3: Create Mutations (Write Data)

```typescript
// convex/mutations/orders.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create a new order
 *
 * ACID transaction: All-or-nothing execution
 */
export const createOrder = mutation({
  args: {
    items: v.array(v.object({
      productId: v.string(),
      quantity: v.number(),
    })),
  },
  handler: async (ctx, { items }) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Validate stock and get product details
    const orderItems = await Promise.all(
      items.map(async (item) => {
        const product = await ctx.db
          .query("products")
          .filter((q) => q.eq(q.field("_id"), item.productId))
          .first();

        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }

        if (!product.isActive) {
          throw new Error(`Product ${product.name} is not available`);
        }

        return {
          productId: item.productId,
          quantity: item.quantity,
          price: product.price,
          name: product.name,
        };
      })
    );

    // Calculate total
    const total = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Create order
    const orderId = await ctx.db.insert("orders", {
      userId: user._id,
      status: "pending",
      items: orderItems,
      total,
      createdAt: Date.now(),
    });

    // Decrement stock for each product
    // This is atomic - if any update fails, entire transaction rolls back
    for (const item of items) {
      const product = await ctx.db
        .query("products")
        .filter((q) => q.eq(q.field("_id"), item.productId))
        .first();

      if (product) {
        await ctx.db.patch(product._id, {
          stock: product.stock - item.quantity,
          updatedAt: Date.now(),
        });
      }
    }

    // Create notification
    await ctx.db.insert("notifications", {
      userId: user._id,
      title: "Order Created",
      message: `Your order #${orderId} has been created successfully.`,
      type: "success",
      isRead: false,
      createdAt: Date.now(),
    });

    return { orderId, total };
  },
});

/**
 * Update order status
 */
export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("confirmed"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    trackingNumber: v.optional(v.string()),
  },
  handler: async (ctx, { orderId, status, trackingNumber }) => {
    const order = await ctx.db.get(orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    // Prepare update object
    const updates: any = { status };

    if (status === "confirmed") {
      updates.confirmedAt = Date.now();
    } else if (status === "shipped") {
      updates.shippedAt = Date.now();
      if (trackingNumber) {
        updates.trackingNumber = trackingNumber;
      }
    } else if (status === "delivered") {
      updates.deliveredAt = Date.now();
    }

    // Update order
    await ctx.db.patch(orderId, updates);

    // Create notification
    await ctx.db.insert("notifications", {
      userId: order.userId,
      title: `Order ${status}`,
      message: `Your order has been ${status}.`,
      type: "info",
      isRead: false,
      createdAt: Date.now(),
      metadata: { orderId, status },
    });

    return { success: true };
  },
});

/**
 * Cancel order and restore stock
 */
export const cancelOrder = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.db.get(orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status !== "pending" && order.status !== "confirmed") {
      throw new Error("Cannot cancel order in current status");
    }

    // Update order status
    await ctx.db.patch(orderId, {
      status: "cancelled",
    });

    // Restore stock for each item
    for (const item of order.items) {
      const product = await ctx.db
        .query("products")
        .filter((q) => q.eq(q.field("_id"), item.productId))
        .first();

      if (product) {
        await ctx.db.patch(product._id, {
          stock: product.stock + item.quantity,
          updatedAt: Date.now(),
        });
      }
    }

    // Create notification
    await ctx.db.insert("notifications", {
      userId: order.userId,
      title: "Order Cancelled",
      message: "Your order has been cancelled. Stock has been restored.",
      type: "info",
      isRead: false,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});
```

### Step 4: Create Actions (External APIs)

```typescript
// convex/actions/payments.ts
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

/**
 * Process payment with Stripe
 *
 * Actions can call external APIs and then use mutations to update database
 */
export const processPayment = action({
  args: {
    orderId: v.id("orders"),
    paymentMethodId: v.string(),
  },
  handler: async (ctx, { orderId, paymentMethodId }) => {
    // Get order details (using query)
    const order = await ctx.runQuery(api.queries.orders.getOrder, { orderId });

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status !== "pending") {
      throw new Error("Order is not in pending status");
    }

    try {
      // Create payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(order.total * 100), // Cents
        currency: "usd",
        payment_method: paymentMethodId,
        confirm: true,
        metadata: {
          orderId,
          userId: order.userId,
        },
      });

      // Update order with payment info (using mutation)
      await ctx.runMutation(api.mutations.orders.updateOrderStatus, {
        orderId,
        status: "confirmed",
      });

      // Store payment ID
      await ctx.runMutation(api.mutations.orders.updatePaymentId, {
        orderId,
        paymentId: paymentIntent.id,
      });

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
      };

    } catch (error: any) {
      // Log error and update order
      console.error("Payment failed:", error);

      await ctx.runMutation(api.mutations.orders.addOrderNote, {
        orderId,
        note: `Payment failed: ${error.message}`,
      });

      throw new Error(`Payment failed: ${error.message}`);
    }
  },
});

/**
 * Send order confirmation email
 */
export const sendOrderConfirmation = action({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.runQuery(api.queries.orders.getOrder, { orderId });

    if (!order) {
      throw new Error("Order not found");
    }

    // Send email using external service
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "orders@mystore.com",
        to: order.user.email,
        subject: "Order Confirmation",
        html: `
          <h1>Order Confirmed!</h1>
          <p>Your order #${orderId} has been confirmed.</p>
          <p>Total: $${(order.total / 100).toFixed(2)}</p>
        `,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send email");
    }

    return { success: true };
  },
});
```

### Step 5: Use in React Components

```typescript
// app/ConvexClientProvider.tsx
"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
```

```typescript
// app/layout.tsx
import { ConvexClientProvider } from "./ConvexClientProvider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
```

```typescript
// app/orders/page.tsx
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function OrdersPage() {
  // Reactive query - auto-updates when orders change
  const orders = useQuery(api.queries.orders.getMyOrders);

  // Mutation
  const cancelOrder = useMutation(api.mutations.orders.cancelOrder);

  const handleCancel = async (orderId: string) => {
    try {
      await cancelOrder({ orderId });
      alert("Order cancelled successfully");
    } catch (error) {
      alert("Failed to cancel order");
    }
  };

  if (!orders) {
    return <div>Loading orders...</div>;
  }

  return (
    <div>
      <h1>My Orders</h1>

      {orders.length === 0 ? (
        <p>No orders yet</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="border p-4 rounded">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-semibold">Order #{order._id}</h3>
                  <p>Status: {order.status}</p>
                  <p>Total: ${(order.total / 100).toFixed(2)}</p>
                  <p>Items: {order.items.length}</p>
                </div>

                {(order.status === "pending" || order.status === "confirmed") && (
                  <button
                    onClick={() => handleCancel(order._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Cancel Order
                  </button>
                )}
              </div>

              <div className="mt-4">
                <h4 className="font-medium">Items:</h4>
                <ul className="list-disc list-inside">
                  {order.items.map((item, i) => (
                    <li key={i}>
                      {item.name} x {item.quantity} = ${(item.price * item.quantity / 100).toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Step 6: Optimistic Updates

```typescript
// app/cart/page.tsx
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

export default function CartPage() {
  const cart = useQuery(api.queries.cart.getCart);
  const addToCart = useMutation(api.mutations.cart.addItem);

  const [optimisticItems, setOptimisticItems] = useState([]);

  const handleAddToCart = async (productId: string, quantity: number) => {
    // Optimistic update - update UI immediately
    setOptimisticItems(prev => [
      ...prev,
      { productId, quantity, addedAt: Date.now() },
    ]);

    try {
      // Actual mutation
      await addToCart({ productId, quantity });

      // Clear optimistic update on success
      setOptimisticItems(prev =>
        prev.filter(item => item.productId !== productId)
      );
    } catch (error) {
      // Revert on error
      setOptimisticItems(prev =>
        prev.filter(item => item.productId !== productId)
      );
      alert("Failed to add to cart");
    }
  };

  // Merge real data with optimistic updates
  const displayItems = cart
    ? [...cart.items, ...optimisticItems]
    : optimisticItems;

  return (
    <div>
      <h1>Shopping Cart</h1>
      {/* ... render cart items ... */}
    </div>
  );
}
```

### Step 7: File Storage

```typescript
// convex/mutations/files.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Generate upload URL for file
 */
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

/**
 * Save file metadata after upload
 */
export const saveFile = mutation({
  args: {
    storageId: v.string(),
    filename: v.string(),
    contentType: v.string(),
    size: v.number(),
  },
  handler: async (ctx, { storageId, filename, contentType, size }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const fileId = await ctx.db.insert("files", {
      storageId,
      filename,
      contentType,
      size,
      uploadedBy: identity.subject,
      uploadedAt: Date.now(),
    });

    return fileId;
  },
});

/**
 * Get file URL
 */
export const getFileUrl = mutation({
  args: { storageId: v.string() },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});
```

```typescript
// app/upload/page.tsx
"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

export default function UploadPage() {
  const generateUploadUrl = useMutation(api.mutations.files.generateUploadUrl);
  const saveFile = useMutation(api.mutations.files.saveFile);

  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);

    try {
      // 1. Get upload URL
      const uploadUrl = await generateUploadUrl();

      // 2. Upload file
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const { storageId } = await response.json();

      // 3. Save metadata
      await saveFile({
        storageId,
        filename: file.name,
        contentType: file.type,
        size: file.size,
      });

      alert("File uploaded successfully!");

    } catch (error) {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
    </div>
  );
}
```

### Step 8: Vector Search (AI Features)

```typescript
// convex/schema.ts (add to schema)
documents: defineTable({
  title: v.string(),
  content: v.string(),
  embedding: v.array(v.number()), // Vector embedding
  userId: v.id("users"),
  createdAt: v.number(),
})
  .vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 1536, // OpenAI ada-002 dimensions
  }),
```

```typescript
// convex/actions/embeddings.ts
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Create document with embedding
 */
export const createDocumentWithEmbedding = action({
  args: {
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, { title, content }) => {
    // Generate embedding
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: content,
    });

    const embedding = response.data[0].embedding;

    // Store document with embedding
    const docId = await ctx.runMutation(api.mutations.documents.create, {
      title,
      content,
      embedding,
    });

    return docId;
  },
});

/**
 * Semantic search
 */
export const semanticSearch = action({
  args: { query: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { query, limit = 10 }) => {
    // Generate embedding for query
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: query,
    });

    const queryEmbedding = response.data[0].embedding;

    // Search for similar documents
    const results = await ctx.runQuery(api.queries.documents.searchByEmbedding, {
      embedding: queryEmbedding,
      limit,
    });

    return results;
  },
});
```

```typescript
// convex/queries/documents.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const searchByEmbedding = query({
  args: {
    embedding: v.array(v.number()),
    limit: v.number(),
  },
  handler: async (ctx, { embedding, limit }) => {
    const results = await ctx.db
      .query("documents")
      .withSearchIndex("by_embedding", (q) =>
        q.similar("embedding", embedding, limit)
      )
      .collect();

    return results;
  },
});
```

---

## Advanced Patterns

### 1. Pagination

```typescript
export const getPaginatedOrders = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { paginationOpts }) => {
    return await ctx.db
      .query("orders")
      .order("desc")
      .paginate(paginationOpts);
  },
});
```

### 2. Scheduled Functions

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "delete-old-sessions",
  { hours: 24 }, // Run every 24 hours
  internal.mutations.sessions.deleteExpired
);

crons.cron(
  "daily-report",
  "0 9 * * *", // 9am daily
  internal.actions.reports.generateDaily
);

export default crons;
```

### 3. Background Jobs

```typescript
import { internalMutation } from "./_generated/server";

export const processLargeDataset = internalMutation({
  handler: async (ctx) => {
    const items = await ctx.db.query("items").collect();

    for (const item of items) {
      // Process each item
      await ctx.db.patch(item._id, {
        processed: true,
        processedAt: Date.now(),
      });
    }

    return { processed: items.length };
  },
});
```

---

## Best Practices

### 1. Use Indexes
Always add indexes for common queries.

### 2. Keep Functions Small
Split complex logic into multiple functions.

### 3. Handle Errors Gracefully

```typescript
try {
  await riskyOperation();
} catch (error) {
  console.error("Operation failed:", error);
  throw new Error("User-friendly message");
}
```

### 4. Use TypeScript Strictly

```typescript
// Always define arg types
export const myFunction = mutation({
  args: {
    id: v.id("users"),
    name: v.string(),
  },
  handler: async (ctx, { id, name }) => {
    // TypeScript knows exact types
  },
});
```

---

## Resources

- Official Docs: https://docs.convex.dev
- Examples: https://github.com/get-convex/convex-demos
- Discord: https://convex.dev/community
- Dashboard: https://dashboard.convex.dev

---

**Remember:** Convex provides a complete reactive backend. Use it for real-time apps where data synchronization and automatic UI updates are essential.
