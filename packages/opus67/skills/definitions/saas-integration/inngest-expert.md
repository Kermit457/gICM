# Inngest Expert - OPUS 67 v5.1.0
## Event-Driven Background Jobs & Durable Workflows

**Skill ID:** `inngest-expert`
**Tier:** 2 (Domain Expertise)
**Token Cost:** 5500
**Version:** 1.0.0

---

## Overview

You are an Inngest expert specializing in building reliable, event-driven background jobs and durable workflows. Inngest provides automatic retries, multi-step functions, scheduling, and observability out of the box.

### What You Can Do
- Create event-driven functions with automatic retries
- Implement multi-step workflows with the steps API
- Schedule cron jobs and delayed functions
- Handle fan-out and parallel execution patterns
- Build reliable async workflows with durability guarantees
- Use Inngest Dev Server for local testing
- Deploy to Vercel, Netlify, or any serverless platform

### What You Cannot Do
- Replace real-time systems (use WebSockets or SSE instead)
- Handle sub-second latency requirements
- Provide synchronous responses to users (use for background work)

---

## Core Concepts

### 1. Event-Driven Architecture
Inngest uses events as the primary trigger mechanism:
- **Events** trigger functions
- **Functions** can send new events
- Multiple functions can subscribe to the same event
- Events are durable and retryable

### 2. Steps API
Break work into atomic, retryable steps:
- `step.run()` - Execute a step with automatic retries
- `step.sleep()` - Delay execution
- `step.waitForEvent()` - Pause until an event arrives
- `step.sendEvent()` - Send events from within steps

### 3. Durability Guarantees
- Functions automatically retry on failure
- Steps that succeed never re-execute
- State persists between retries
- No manual state management required

---

## Installation & Setup

### Install Inngest

```bash
npm install inngest
# or
pnpm add inngest
# or
yarn add inngest
```

### Environment Variables

```env
# .env.local
INNGEST_EVENT_KEY=your_event_key_here
INNGEST_SIGNING_KEY=your_signing_key_here

# Production only - leave empty in development
INNGEST_BASE_URL=https://api.inngest.com
```

### Project Structure

```
project/
├── inngest/
│   ├── client.ts          # Inngest client singleton
│   ├── functions/
│   │   ├── order.ts       # Order-related functions
│   │   ├── email.ts       # Email functions
│   │   └── index.ts       # Export all functions
│   └── events.ts          # Event type definitions
├── app/
│   └── api/
│       └── inngest/
│           └── route.ts   # Inngest API endpoint
└── lib/
    └── inngest.ts         # Helper functions
```

---

## Complete Implementation Guide

### Step 1: Create Inngest Client

```typescript
// inngest/client.ts
import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "my-app",
  // Optional: Add schemas for type safety
  schemas: new EventSchemas().fromRecord({
    "order/created": {
      data: z.object({
        orderId: z.string(),
        userId: z.string(),
        items: z.array(z.object({
          productId: z.string(),
          quantity: z.number(),
          price: z.number(),
        })),
        total: z.number(),
        email: z.string().email(),
      }),
    },
    "payment/completed": {
      data: z.object({
        orderId: z.string(),
        paymentId: z.string(),
        amount: z.number(),
      }),
    },
  }),
});

// Type-safe event types
export type OrderCreatedEvent = {
  name: "order/created";
  data: {
    orderId: string;
    userId: string;
    items: Array<{
      productId: string;
      quantity: number;
      price: number;
    }>;
    total: number;
    email: string;
  };
};
```

### Step 2: Define Events (Type Safety)

```typescript
// inngest/events.ts
import { z } from "zod";

// Event schemas
export const orderCreatedSchema = z.object({
  orderId: z.string(),
  userId: z.string(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number(),
    price: z.number(),
  })),
  total: z.number(),
  email: z.string().email(),
  metadata: z.record(z.unknown()).optional(),
});

export const paymentCompletedSchema = z.object({
  orderId: z.string(),
  paymentId: z.string(),
  amount: z.number(),
  provider: z.enum(["stripe", "paypal"]),
});

// Type inference
export type OrderCreated = z.infer<typeof orderCreatedSchema>;
export type PaymentCompleted = z.infer<typeof paymentCompletedSchema>;

// Event name constants
export const EVENTS = {
  ORDER_CREATED: "order/created",
  ORDER_CANCELLED: "order/cancelled",
  PAYMENT_COMPLETED: "payment/completed",
  PAYMENT_FAILED: "payment/failed",
  EMAIL_SENT: "email/sent",
  USER_REGISTERED: "user/registered",
} as const;
```

### Step 3: Create Functions

```typescript
// inngest/functions/order.ts
import { inngest } from "../client";
import { EVENTS } from "../events";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

/**
 * Process Order Function
 *
 * Handles the complete order processing workflow:
 * 1. Validate inventory
 * 2. Charge payment
 * 3. Update order status
 * 4. Send confirmation email
 */
export const processOrder = inngest.createFunction(
  {
    id: "process-order",
    name: "Process Order",
    retries: 3,
    // Optional: Configure retry behavior
    retry: {
      attempts: 3,
      delay: 5000, // 5 seconds
      exponential: true,
      maxDelay: 60000, // 1 minute max
    },
    // Optional: Rate limiting
    rateLimit: {
      limit: 10,
      period: "1m",
      key: "event.data.userId", // Rate limit per user
    },
  },
  { event: EVENTS.ORDER_CREATED },
  async ({ event, step }) => {
    const { orderId, userId, items, total, email } = event.data;

    // Step 1: Validate inventory
    const inventoryResult = await step.run("validate-inventory", async () => {
      console.log(`[${orderId}] Validating inventory...`);

      const inventory = await db.inventory.findMany({
        where: {
          productId: {
            in: items.map(item => item.productId),
          },
        },
      });

      // Check stock levels
      for (const item of items) {
        const stock = inventory.find(i => i.productId === item.productId);
        if (!stock || stock.quantity < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.productId}`);
        }
      }

      return { valid: true, inventory };
    });

    // Step 2: Reserve inventory
    await step.run("reserve-inventory", async () => {
      console.log(`[${orderId}] Reserving inventory...`);

      for (const item of items) {
        await db.inventory.update({
          where: { productId: item.productId },
          data: {
            quantity: { decrement: item.quantity },
            reserved: { increment: item.quantity },
          },
        });
      }

      return { reserved: true };
    });

    // Step 3: Charge payment
    const paymentResult = await step.run("charge-payment", async () => {
      console.log(`[${orderId}] Charging payment...`);

      try {
        const charge = await stripe.charges.create({
          amount: total,
          currency: "usd",
          customer: userId,
          description: `Order ${orderId}`,
          metadata: {
            orderId,
            userId,
          },
        });

        return {
          success: true,
          paymentId: charge.id,
          amount: charge.amount,
        };
      } catch (error) {
        // Payment failed - unreserve inventory
        await step.sendEvent("payment-failed", {
          name: EVENTS.PAYMENT_FAILED,
          data: {
            orderId,
            userId,
            reason: error.message,
          },
        });

        throw error;
      }
    });

    // Step 4: Update order status
    await step.run("update-order-status", async () => {
      console.log(`[${orderId}] Updating order status...`);

      await db.order.update({
        where: { id: orderId },
        data: {
          status: "confirmed",
          paymentId: paymentResult.paymentId,
          confirmedAt: new Date(),
        },
      });

      return { updated: true };
    });

    // Step 5: Send confirmation email (with delay)
    await step.sleep("wait-before-email", "10s");

    await step.run("send-confirmation-email", async () => {
      console.log(`[${orderId}] Sending confirmation email...`);

      await sendEmail({
        to: email,
        subject: "Order Confirmation",
        template: "order-confirmation",
        data: {
          orderId,
          items,
          total,
          estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return { sent: true };
    });

    // Step 6: Trigger follow-up workflows
    await step.sendEvent("order-confirmed", {
      name: "order/confirmed",
      data: {
        orderId,
        userId,
        paymentId: paymentResult.paymentId,
      },
    });

    return {
      success: true,
      orderId,
      paymentId: paymentResult.paymentId,
      processedAt: new Date().toISOString(),
    };
  }
);
```

### Step 4: Multi-Step Workflow with Wait

```typescript
// inngest/functions/email.ts
import { inngest } from "../client";
import { EVENTS } from "../events";

/**
 * Email Drip Campaign
 *
 * Sends a series of emails over time with waits between
 */
export const emailDripCampaign = inngest.createFunction(
  {
    id: "email-drip-campaign",
    name: "Email Drip Campaign",
  },
  { event: EVENTS.USER_REGISTERED },
  async ({ event, step }) => {
    const { email, name, userId } = event.data;

    // Day 0: Welcome email
    await step.run("send-welcome-email", async () => {
      await sendEmail({
        to: email,
        subject: "Welcome to Our Platform!",
        template: "welcome",
        data: { name },
      });
    });

    // Day 1: Getting started guide
    await step.sleep("wait-1-day", "1d");

    await step.run("send-getting-started", async () => {
      await sendEmail({
        to: email,
        subject: "Getting Started Guide",
        template: "getting-started",
        data: { name },
      });
    });

    // Day 3: Feature highlights
    await step.sleep("wait-2-days", "2d");

    await step.run("send-feature-highlights", async () => {
      await sendEmail({
        to: email,
        subject: "Feature Highlights",
        template: "features",
        data: { name },
      });
    });

    // Day 7: Check-in email
    await step.sleep("wait-4-days", "4d");

    await step.run("send-checkin", async () => {
      const activity = await db.userActivity.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      await sendEmail({
        to: email,
        subject: "How's it going?",
        template: "checkin",
        data: {
          name,
          hasActivity: !!activity,
        },
      });
    });

    return { campaignCompleted: true };
  }
);
```

### Step 5: Wait for Event (Human-in-the-Loop)

```typescript
// inngest/functions/approval.ts
import { inngest } from "../client";
import { EVENTS } from "../events";

/**
 * Approval Workflow
 *
 * Waits for manager approval before proceeding
 */
export const approvalWorkflow = inngest.createFunction(
  {
    id: "approval-workflow",
    name: "Approval Workflow",
  },
  { event: "expense/submitted" },
  async ({ event, step }) => {
    const { expenseId, amount, userId } = event.data;

    // Send approval request
    await step.run("send-approval-request", async () => {
      await sendEmail({
        to: "manager@company.com",
        subject: "Expense Approval Required",
        template: "approval-request",
        data: { expenseId, amount, userId },
      });
    });

    // Wait for approval event (with timeout)
    const approval = await step.waitForEvent("wait-for-approval", {
      event: "expense/approved",
      timeout: "7d",
      match: "data.expenseId",
      if: `async.data.expenseId == event.data.expenseId`,
    });

    if (!approval) {
      // Timeout - auto-reject
      await step.run("auto-reject", async () => {
        await db.expense.update({
          where: { id: expenseId },
          data: { status: "rejected", rejectedAt: new Date() },
        });
      });

      return { approved: false, reason: "timeout" };
    }

    // Approval received - process expense
    await step.run("process-expense", async () => {
      await db.expense.update({
        where: { id: expenseId },
        data: {
          status: "approved",
          approvedBy: approval.data.managerId,
          approvedAt: new Date(),
        },
      });

      // Trigger payment
      await inngest.send({
        name: "payment/process",
        data: { expenseId, amount, userId },
      });
    });

    return { approved: true, approvedBy: approval.data.managerId };
  }
);
```

### Step 6: Fan-Out Pattern

```typescript
// inngest/functions/notification.ts
import { inngest } from "../client";
import { EVENTS } from "../events";

/**
 * Broadcast Notification
 *
 * Fan-out: Send notification to all users
 */
export const broadcastNotification = inngest.createFunction(
  {
    id: "broadcast-notification",
    name: "Broadcast Notification",
  },
  { event: "notification/broadcast" },
  async ({ event, step }) => {
    const { title, message, segment } = event.data;

    // Step 1: Fetch users
    const users = await step.run("fetch-users", async () => {
      return await db.user.findMany({
        where: segment ? { segment } : {},
        select: { id: true, email: true, name: true },
      });
    });

    // Step 2: Fan-out - send individual events
    await step.run("fan-out-notifications", async () => {
      const events = users.map(user => ({
        name: "notification/send-individual" as const,
        data: {
          userId: user.id,
          email: user.email,
          name: user.name,
          title,
          message,
        },
      }));

      // Send all events in parallel
      await inngest.send(events);

      return { sent: events.length };
    });

    return {
      totalUsers: users.length,
      broadcastId: event.id,
    };
  }
);

/**
 * Send Individual Notification
 *
 * Handles single user notification (called by fan-out)
 */
export const sendIndividualNotification = inngest.createFunction(
  {
    id: "send-individual-notification",
    name: "Send Individual Notification",
    concurrency: [
      {
        limit: 100, // Max 100 concurrent executions
        key: "event.data.userId",
      },
    ],
  },
  { event: "notification/send-individual" },
  async ({ event, step }) => {
    const { userId, email, name, title, message } = event.data;

    await step.run("send-notification", async () => {
      await sendEmail({
        to: email,
        subject: title,
        template: "notification",
        data: { name, message },
      });

      await db.notification.create({
        data: {
          userId,
          title,
          message,
          sentAt: new Date(),
        },
      });
    });

    return { sent: true, userId };
  }
);
```

### Step 7: Cron Jobs

```typescript
// inngest/functions/scheduled.ts
import { inngest } from "../client";

/**
 * Daily Digest Email
 *
 * Runs every day at 9am UTC
 */
export const dailyDigest = inngest.createFunction(
  {
    id: "daily-digest",
    name: "Daily Digest Email",
  },
  { cron: "0 9 * * *" }, // Every day at 9am UTC
  async ({ step }) => {
    // Get active users
    const users = await step.run("fetch-active-users", async () => {
      return await db.user.findMany({
        where: {
          lastActiveAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      });
    });

    // Send digest to each user
    await step.run("send-digests", async () => {
      const events = users.map(user => ({
        name: "email/send-digest" as const,
        data: { userId: user.id },
      }));

      await inngest.send(events);
      return { sent: users.length };
    });

    return { processedUsers: users.length };
  }
);

/**
 * Cleanup Old Data
 *
 * Runs every Sunday at midnight
 */
export const cleanupOldData = inngest.createFunction(
  {
    id: "cleanup-old-data",
    name: "Cleanup Old Data",
  },
  { cron: "0 0 * * 0" }, // Every Sunday at midnight
  async ({ step }) => {
    const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const deleted = await step.run("delete-old-logs", async () => {
      const result = await db.log.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
        },
      });

      return result.count;
    });

    return { deletedRecords: deleted };
  }
);

/**
 * Hourly Health Check
 *
 * Runs every hour
 */
export const healthCheck = inngest.createFunction(
  {
    id: "health-check",
    name: "Hourly Health Check",
  },
  { cron: "0 * * * *" }, // Every hour
  async ({ step }) => {
    const checks = await step.run("run-health-checks", async () => {
      const [dbHealth, apiHealth, queueHealth] = await Promise.all([
        checkDatabaseHealth(),
        checkApiHealth(),
        checkQueueHealth(),
      ]);

      return { dbHealth, apiHealth, queueHealth };
    });

    // Alert if any check fails
    if (!checks.dbHealth || !checks.apiHealth || !checks.queueHealth) {
      await step.run("send-alert", async () => {
        await sendAlert({
          level: "critical",
          message: "Health check failed",
          details: checks,
        });
      });
    }

    return checks;
  }
);
```

### Step 8: API Route Setup (Next.js)

```typescript
// app/api/inngest/route.ts
import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";

// Import all functions
import { processOrder } from "@/inngest/functions/order";
import { emailDripCampaign } from "@/inngest/functions/email";
import { approvalWorkflow } from "@/inngest/functions/approval";
import {
  broadcastNotification,
  sendIndividualNotification
} from "@/inngest/functions/notification";
import {
  dailyDigest,
  cleanupOldData,
  healthCheck,
} from "@/inngest/functions/scheduled";

// Serve Inngest functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    // Order functions
    processOrder,

    // Email functions
    emailDripCampaign,

    // Approval workflows
    approvalWorkflow,

    // Notifications
    broadcastNotification,
    sendIndividualNotification,

    // Scheduled jobs
    dailyDigest,
    cleanupOldData,
    healthCheck,
  ],

  // Optional: Configure serving options
  servePath: "/api/inngest",
  streamTimeout: 30000, // 30 seconds
});
```

### Step 9: Triggering Events

```typescript
// lib/inngest-helpers.ts
import { inngest } from "@/inngest/client";
import { EVENTS } from "@/inngest/events";

/**
 * Trigger order processing
 */
export async function triggerOrderProcessing(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: true },
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  await inngest.send({
    name: EVENTS.ORDER_CREATED,
    data: {
      orderId: order.id,
      userId: order.userId,
      items: order.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
      total: order.total,
      email: order.user.email,
    },
  });
}

/**
 * Trigger user registration workflow
 */
export async function triggerUserRegistration(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  await inngest.send({
    name: EVENTS.USER_REGISTERED,
    data: {
      userId: user.id,
      email: user.email,
      name: user.name,
      registeredAt: user.createdAt.toISOString(),
    },
  });
}

/**
 * Batch send events
 */
export async function batchSendEvents(events: Array<{ name: string; data: any }>) {
  await inngest.send(events);
}
```

---

## Advanced Patterns

### 1. Conditional Execution

```typescript
export const conditionalWorkflow = inngest.createFunction(
  { id: "conditional-workflow" },
  { event: "order/created" },
  async ({ event, step }) => {
    const order = event.data;

    // Only process high-value orders
    if (order.total > 10000) {
      await step.run("manual-review", async () => {
        await sendManagerAlert(order);
      });
    }

    // Only send gift for first-time customers
    const isFirstOrder = await step.run("check-order-history", async () => {
      const count = await db.order.count({
        where: { userId: order.userId },
      });
      return count === 1;
    });

    if (isFirstOrder) {
      await step.run("send-welcome-gift", async () => {
        await createGiftCoupon(order.userId);
      });
    }

    return { processed: true };
  }
);
```

### 2. Error Handling & Compensation

```typescript
export const errorHandlingWorkflow = inngest.createFunction(
  {
    id: "error-handling-workflow",
    retries: 3,
    onFailure: async ({ error, event, runId }) => {
      // Log failure to monitoring service
      await logError({
        runId,
        event,
        error: error.message,
        stack: error.stack,
      });

      // Send alert
      await sendAlert({
        level: "error",
        message: `Workflow failed: ${error.message}`,
        runId,
      });
    },
  },
  { event: "payment/process" },
  async ({ event, step }) => {
    let charged = false;

    try {
      // Attempt charge
      await step.run("charge-payment", async () => {
        const result = await stripe.charges.create({
          amount: event.data.amount,
          customer: event.data.customerId,
        });
        charged = true;
        return result;
      });

      // Fulfill order
      await step.run("fulfill-order", async () => {
        await fulfillOrder(event.data.orderId);
      });

    } catch (error) {
      // Compensation logic
      if (charged) {
        await step.run("refund-payment", async () => {
          await stripe.refunds.create({
            charge: event.data.chargeId,
          });
        });
      }

      throw error;
    }

    return { success: true };
  }
);
```

### 3. Parallel Execution

```typescript
export const parallelWorkflow = inngest.createFunction(
  { id: "parallel-workflow" },
  { event: "order/shipped" },
  async ({ event, step }) => {
    // Run multiple steps in parallel using Promise.all
    const results = await step.run("parallel-notifications", async () => {
      return await Promise.all([
        sendEmail({ to: event.data.email, template: "shipped" }),
        sendSMS({ to: event.data.phone, message: "Order shipped!" }),
        sendPushNotification({ userId: event.data.userId, message: "Shipped!" }),
        updateCRM({ orderId: event.data.orderId, status: "shipped" }),
      ]);
    });

    return { notificationsSent: results.length };
  }
);
```

### 4. Debouncing

```typescript
export const debouncedFunction = inngest.createFunction(
  {
    id: "debounced-search-index",
    debounce: {
      key: "event.data.userId",
      period: "5m", // Wait 5 minutes of inactivity
    },
  },
  { event: "user/profile-updated" },
  async ({ event, step }) => {
    // Only runs after 5 minutes of no profile updates
    await step.run("reindex-user", async () => {
      await searchIndex.update({
        userId: event.data.userId,
        profile: event.data.profile,
      });
    });

    return { reindexed: true };
  }
);
```

---

## Testing

### Local Development

```bash
# Start Inngest Dev Server
npx inngest-cli@latest dev

# Open dashboard
# http://localhost:8288
```

### Testing Functions Locally

```typescript
// test/inngest.test.ts
import { inngest } from "@/inngest/client";
import { processOrder } from "@/inngest/functions/order";

describe("processOrder", () => {
  it("should process order successfully", async () => {
    // Send test event
    await inngest.send({
      name: "order/created",
      data: {
        orderId: "test_order_123",
        userId: "test_user",
        items: [{ productId: "widget", quantity: 1, price: 1000 }],
        total: 1000,
        email: "test@example.com",
      },
    });

    // Check function execution in Dev Server UI
    // Or wait and verify database state
    await sleep(5000);

    const order = await db.order.findUnique({
      where: { id: "test_order_123" },
    });

    expect(order?.status).toBe("confirmed");
  });
});
```

---

## Deployment

### Vercel

```bash
# Deploy to Vercel
vercel deploy --prod

# Inngest will automatically discover your functions at:
# https://your-app.vercel.app/api/inngest
```

### Environment Variables (Production)

```env
INNGEST_EVENT_KEY=your_production_event_key
INNGEST_SIGNING_KEY=your_production_signing_key
```

### Register App with Inngest Cloud

1. Go to https://app.inngest.com
2. Create new app
3. Add sync URL: `https://your-app.vercel.app/api/inngest`
4. Copy Event Key and Signing Key to environment variables

---

## Monitoring & Observability

### Inngest Dashboard Features
- Function execution history
- Step-by-step execution trace
- Retry tracking
- Failure analysis
- Event inspection
- Performance metrics

### Custom Logging

```typescript
export const loggedFunction = inngest.createFunction(
  { id: "logged-function" },
  { event: "data/process" },
  async ({ event, step, logger }) => {
    logger.info("Starting data processing", { eventId: event.id });

    const result = await step.run("process-data", async () => {
      logger.info("Processing chunk 1");
      // ... processing
      logger.info("Processing chunk 2");
      // ... more processing
      return { processed: true };
    });

    logger.info("Data processing complete", { result });

    return result;
  }
);
```

---

## Best Practices

### 1. Idempotency
Make functions safe to retry:

```typescript
await step.run("create-record", async () => {
  // Use upsert instead of create
  await db.record.upsert({
    where: { id: event.data.id },
    update: { status: "processed" },
    create: {
      id: event.data.id,
      status: "processed",
      data: event.data,
    },
  });
});
```

### 2. Break Work into Steps
Keep steps focused and atomic:

```typescript
// Bad: One big step
await step.run("process-everything", async () => {
  await validateData();
  await saveToDatabase();
  await sendNotification();
  await updateCache();
});

// Good: Multiple atomic steps
await step.run("validate-data", async () => {
  return await validateData();
});

await step.run("save-to-database", async () => {
  return await saveToDatabase();
});

await step.run("send-notification", async () => {
  return await sendNotification();
});

await step.run("update-cache", async () => {
  return await updateCache();
});
```

### 3. Use Type-Safe Events

```typescript
// Define event schemas
import { EventSchemas } from "inngest";

const schemas = new EventSchemas().fromRecord({
  "order/created": {
    data: orderCreatedSchema,
  },
});

export const inngest = new Inngest({
  id: "my-app",
  schemas,
});
```

### 4. Handle Timeouts Gracefully

```typescript
export const timeoutHandling = inngest.createFunction(
  {
    id: "timeout-handling",
    // Set function timeout
    timeout: "5m",
  },
  { event: "data/import" },
  async ({ event, step }) => {
    try {
      await step.run("import-data", async () => {
        return await importLargeDataset(event.data.url);
      });
    } catch (error) {
      if (error.name === "TimeoutError") {
        // Queue for manual processing
        await step.run("queue-manual-processing", async () => {
          await db.manualQueue.create({
            data: {
              type: "import",
              url: event.data.url,
              reason: "timeout",
            },
          });
        });
      } else {
        throw error;
      }
    }

    return { completed: true };
  }
);
```

### 5. Rate Limiting

```typescript
export const rateLimitedFunction = inngest.createFunction(
  {
    id: "rate-limited-function",
    rateLimit: {
      limit: 100,
      period: "1m",
      key: "event.data.userId", // Rate limit per user
    },
  },
  { event: "api/call" },
  async ({ event, step }) => {
    // This function will only execute 100 times per minute per user
    await step.run("call-external-api", async () => {
      return await callExternalAPI(event.data);
    });
  }
);
```

---

## Common Use Cases

### 1. Order Processing
✓ Multi-step payment and fulfillment
✓ Inventory management
✓ Email notifications
✓ Error handling and rollback

### 2. Email Campaigns
✓ Drip campaigns with delays
✓ Personalized content
✓ A/B testing
✓ Unsubscribe handling

### 3. Data Processing
✓ ETL pipelines
✓ Report generation
✓ Data imports/exports
✓ Batch processing

### 4. User Onboarding
✓ Welcome sequences
✓ Feature tours
✓ Engagement tracking
✓ Conversion optimization

### 5. Scheduled Tasks
✓ Daily reports
✓ Data cleanup
✓ Health checks
✓ Billing cycles

---

## Anti-Patterns to Avoid

### ❌ Don't use Inngest for real-time responses
```typescript
// Bad: User waiting for response
app.post("/api/checkout", async (req, res) => {
  await inngest.send({ name: "order/created", data: req.body });
  // User has to wait for entire workflow
  res.json({ success: true });
});

// Good: Return immediately, process async
app.post("/api/checkout", async (req, res) => {
  const order = await db.order.create({ data: req.body });
  await inngest.send({ name: "order/created", data: order });
  res.json({ orderId: order.id }); // Return immediately
});
```

### ❌ Don't put everything in one step
```typescript
// Bad: No retry granularity
await step.run("do-everything", async () => {
  await longRunningTask1();
  await longRunningTask2();
  await longRunningTask3();
});

// Good: Each task can retry independently
await step.run("task-1", () => longRunningTask1());
await step.run("task-2", () => longRunningTask2());
await step.run("task-3", () => longRunningTask3());
```

### ❌ Don't ignore idempotency
```typescript
// Bad: Creates duplicate records on retry
await step.run("create-record", async () => {
  await db.record.create({ data: event.data });
});

// Good: Safe to retry
await step.run("create-record", async () => {
  await db.record.upsert({
    where: { id: event.data.id },
    create: event.data,
    update: {},
  });
});
```

---

## Troubleshooting

### Function not appearing in dashboard
- Check API route is correctly configured
- Verify Inngest Dev Server is running
- Check console for registration errors
- Ensure function is exported and included in `serve()`

### Steps not retrying
- Verify retry configuration in function config
- Check if error is thrown (not caught silently)
- Review retry limits and delays

### Events not triggering functions
- Verify event name matches exactly
- Check event schema validation
- Review function filters and conditions
- Check Inngest dashboard for event logs

### Slow execution
- Break large steps into smaller ones
- Use parallel execution where possible
- Check for unnecessary waits/sleeps
- Review database query performance

---

## Resources

- Official Docs: https://www.inngest.com/docs
- Examples: https://github.com/inngest/inngest-js/tree/main/examples
- Discord: https://www.inngest.com/discord
- Dashboard: https://app.inngest.com

---

**Remember:** Inngest is for durable, reliable background work. Use it for workflows that need retries, observability, and multi-step coordination—not for real-time user interactions.
