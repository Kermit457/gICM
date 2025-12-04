# Trigger.dev Expert - OPUS 67 v5.1.0
## Long-Running Background Jobs & Scheduled Tasks

**Skill ID:** `trigger-dev-expert`
**Tier:** 2 (Domain Expertise)
**Token Cost:** 5500
**Version:** 1.0.0

---

## Overview

You are a Trigger.dev expert specializing in building long-running background jobs, scheduled tasks, and complex workflows that can run for hours without timeout limitations. Trigger.dev is perfect for heavy processing, API integrations, and tasks that exceed serverless function limits.

### What You Can Do
- Create long-running tasks (2+ hours execution time)
- Build reliable background jobs with automatic retries
- Schedule tasks with cron expressions
- Handle webhooks and event-driven workflows
- Integrate with external APIs without timeout concerns
- Use real-time dashboard for monitoring
- Deploy to any infrastructure (serverless or long-running servers)

### What You Cannot Do
- Provide instant synchronous responses (use API routes instead)
- Replace WebSocket connections for real-time communication
- Handle sub-100ms latency requirements

---

## Core Concepts

### 1. Tasks
Tasks are the fundamental building blocks:
- **Type-safe** task definitions with input/output schemas
- **Long-running** execution (2+ hours supported)
- **Automatic retries** with configurable strategies
- **Idempotent** by default

### 2. Triggers
Multiple ways to start tasks:
- **Scheduled** - Cron-based scheduling
- **Event-driven** - Triggered by events
- **Webhook** - External service callbacks
- **Manual** - API invocation

### 3. Runs
Every task execution is tracked:
- Real-time status updates
- Detailed logs and traces
- Retry management
- Error handling

### 4. Integrations
Pre-built integrations with popular services:
- OpenAI, Anthropic
- Stripe, Resend
- GitHub, Linear
- Slack, Discord
- And 50+ more

---

## Installation & Setup

### Install Trigger.dev

```bash
npm install @trigger.dev/sdk @trigger.dev/react
# or
pnpm add @trigger.dev/sdk @trigger.dev/react
# or
yarn add @trigger.dev/sdk @trigger.dev/react
```

### Initialize Trigger.dev

```bash
npx @trigger.dev/cli init

# This creates:
# - trigger.config.ts
# - app/api/trigger/route.ts (Next.js)
# - jobs/ directory
```

### Environment Variables

```env
# .env.local
TRIGGER_API_KEY=tr_dev_xxxxxxxxxxxx
TRIGGER_API_URL=https://api.trigger.dev  # Cloud version

# Or self-hosted
# TRIGGER_API_URL=http://localhost:3030
```

### Project Structure

```
project/
├── trigger.config.ts         # Trigger.dev configuration
├── jobs/
│   ├── orders/
│   │   ├── process.ts        # Order processing jobs
│   │   └── notifications.ts  # Order notifications
│   ├── reports/
│   │   └── daily.ts          # Report generation
│   ├── integrations/
│   │   └── sync.ts           # Third-party sync
│   └── index.ts              # Export all jobs
├── app/
│   └── api/
│       └── trigger/
│           └── route.ts      # API endpoint
└── lib/
    └── trigger.ts            # Helper functions
```

---

## Complete Implementation Guide

### Step 1: Configure Trigger.dev

```typescript
// trigger.config.ts
import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  project: "proj_xxxxxxxxxxxxxxxx",
  runtime: "node",
  logLevel: "log",

  // Optional: Configure retries globally
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },

  // Optional: Configure directories
  dirs: ["./jobs"],
});
```

### Step 2: Create API Route (Next.js)

```typescript
// app/api/trigger/route.ts
import { createAppRoute } from "@trigger.dev/nextjs";
import { client } from "@/trigger";

// Import all jobs
import "@/jobs";

// Create API route handler
export const { POST, dynamic } = createAppRoute(client);

// This endpoint handles:
// - Task registration
// - Task execution
// - Webhook delivery
```

### Step 3: Create Trigger Client

```typescript
// lib/trigger.ts
import { TriggerClient } from "@trigger.dev/sdk";

export const client = new TriggerClient({
  id: "my-app",
  apiKey: process.env.TRIGGER_API_KEY!,
  apiUrl: process.env.TRIGGER_API_URL,
  verbose: process.env.NODE_ENV === "development",
  logLevel: "debug",
});
```

### Step 4: Basic Task Example

```typescript
// jobs/hello-world.ts
import { task } from "@trigger.dev/sdk/v3";

export const helloWorldTask = task({
  id: "hello-world",
  run: async (payload: { name: string }) => {
    console.log("Hello,", payload.name);
    return {
      message: `Hello, ${payload.name}!`,
      timestamp: new Date().toISOString(),
    };
  },
});
```

### Step 5: Order Processing Task

```typescript
// jobs/orders/process.ts
import { task } from "@trigger.dev/sdk/v3";
import { z } from "zod";

// Define input schema
const processOrderSchema = z.object({
  orderId: z.string(),
  userId: z.string(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number(),
    price: z.number(),
  })),
  total: z.number(),
  email: z.string().email(),
});

type ProcessOrderInput = z.infer<typeof processOrderSchema>;

/**
 * Process Order Task
 *
 * Handles complete order processing workflow with retries
 */
export const processOrderTask = task({
  id: "process-order",

  // Retry configuration
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 5000,
    maxTimeoutInMs: 60000,
    factor: 2,
  },

  // Execution configuration
  queue: {
    concurrencyLimit: 10, // Max 10 concurrent executions
  },

  run: async (payload: ProcessOrderInput, { ctx }) => {
    const { orderId, userId, items, total, email } = payload;

    ctx.logger.info("Starting order processing", { orderId });

    // Step 1: Validate inventory
    ctx.logger.info("Validating inventory...");

    const inventory = await db.inventory.findMany({
      where: {
        productId: { in: items.map(item => item.productId) },
      },
    });

    for (const item of items) {
      const stock = inventory.find(i => i.productId === item.productId);
      if (!stock || stock.quantity < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.productId}`);
      }
    }

    ctx.logger.info("Inventory validated", { items: items.length });

    // Step 2: Reserve inventory
    ctx.logger.info("Reserving inventory...");

    for (const item of items) {
      await db.inventory.update({
        where: { productId: item.productId },
        data: {
          quantity: { decrement: item.quantity },
          reserved: { increment: item.quantity },
        },
      });
    }

    ctx.logger.info("Inventory reserved");

    // Step 3: Charge payment
    ctx.logger.info("Charging payment...", { amount: total });

    let paymentId: string;

    try {
      const charge = await stripe.charges.create({
        amount: total,
        currency: "usd",
        customer: userId,
        description: `Order ${orderId}`,
        metadata: { orderId, userId },
      });

      paymentId = charge.id;
      ctx.logger.info("Payment charged successfully", { paymentId });

    } catch (error) {
      ctx.logger.error("Payment failed", { error });

      // Rollback inventory reservation
      for (const item of items) {
        await db.inventory.update({
          where: { productId: item.productId },
          data: {
            quantity: { increment: item.quantity },
            reserved: { decrement: item.quantity },
          },
        });
      }

      throw error;
    }

    // Step 4: Update order status
    ctx.logger.info("Updating order status...");

    await db.order.update({
      where: { id: orderId },
      data: {
        status: "confirmed",
        paymentId,
        confirmedAt: new Date(),
      },
    });

    ctx.logger.info("Order status updated");

    // Step 5: Send confirmation email
    ctx.logger.info("Sending confirmation email...");

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

    ctx.logger.info("Confirmation email sent");

    // Step 6: Trigger fulfillment workflow
    await fulfillOrderTask.trigger({
      orderId,
      items,
    });

    return {
      success: true,
      orderId,
      paymentId,
      processedAt: new Date().toISOString(),
    };
  },
});
```

### Step 6: Scheduled Task (Cron)

```typescript
// jobs/reports/daily.ts
import { schedules } from "@trigger.dev/sdk/v3";

/**
 * Daily Sales Report
 *
 * Generates and emails daily sales report at 9am UTC
 */
export const dailySalesReportTask = schedules.task({
  id: "daily-sales-report",

  // Run every day at 9am UTC
  cron: "0 9 * * *",

  run: async (payload, { ctx }) => {
    ctx.logger.info("Generating daily sales report...");

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    // Fetch orders from yesterday
    const orders = await db.order.findMany({
      where: {
        createdAt: {
          gte: yesterday,
          lte: endOfYesterday,
        },
      },
      include: {
        items: true,
      },
    });

    ctx.logger.info("Orders fetched", { count: orders.length });

    // Calculate metrics
    const metrics = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
      averageOrderValue: orders.length > 0
        ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length
        : 0,
      topProducts: calculateTopProducts(orders),
    };

    ctx.logger.info("Metrics calculated", metrics);

    // Generate PDF report
    ctx.logger.info("Generating PDF report...");

    const pdfBuffer = await generatePDFReport({
      title: "Daily Sales Report",
      date: yesterday,
      metrics,
      orders: orders.slice(0, 50), // Top 50 orders
    });

    ctx.logger.info("PDF generated", { size: pdfBuffer.length });

    // Upload to S3
    const reportUrl = await uploadToS3({
      key: `reports/daily-${yesterday.toISOString().split('T')[0]}.pdf`,
      buffer: pdfBuffer,
      contentType: "application/pdf",
    });

    ctx.logger.info("Report uploaded to S3", { url: reportUrl });

    // Send email to stakeholders
    await sendEmail({
      to: ["ceo@company.com", "cfo@company.com", "sales@company.com"],
      subject: `Daily Sales Report - ${yesterday.toLocaleDateString()}`,
      template: "daily-report",
      data: {
        date: yesterday,
        metrics,
        reportUrl,
      },
      attachments: [
        {
          filename: "daily-sales-report.pdf",
          content: pdfBuffer,
        },
      ],
    });

    ctx.logger.info("Report email sent");

    return {
      success: true,
      date: yesterday.toISOString(),
      metrics,
      reportUrl,
    };
  },
});

function calculateTopProducts(orders: any[]) {
  const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();

  for (const order of orders) {
    for (const item of order.items) {
      const existing = productMap.get(item.productId) || {
        name: item.productName,
        quantity: 0,
        revenue: 0,
      };

      productMap.set(item.productId, {
        name: item.productName,
        quantity: existing.quantity + item.quantity,
        revenue: existing.revenue + (item.price * item.quantity),
      });
    }
  }

  return Array.from(productMap.entries())
    .map(([id, data]) => ({ productId: id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
}
```

### Step 7: Long-Running Data Import Task

```typescript
// jobs/integrations/sync.ts
import { task } from "@trigger.dev/sdk/v3";

/**
 * Import Large Dataset
 *
 * Can run for hours without timing out
 */
export const importLargeDatasetTask = task({
  id: "import-large-dataset",

  // Allow up to 2 hours execution time
  maxDuration: 7200, // 2 hours in seconds

  run: async (payload: { url: string; type: string }, { ctx }) => {
    ctx.logger.info("Starting large dataset import", { url: payload.url });

    // Fetch data source
    const response = await fetch(payload.url);
    const data = await response.json();

    ctx.logger.info("Data fetched", { records: data.length });

    let imported = 0;
    let failed = 0;
    const batchSize = 100;

    // Process in batches to avoid memory issues
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      ctx.logger.info("Processing batch", {
        batch: Math.floor(i / batchSize) + 1,
        total: Math.ceil(data.length / batchSize),
        progress: `${((i / data.length) * 100).toFixed(1)}%`,
      });

      try {
        // Process batch with retries
        await db.$transaction(async (tx) => {
          for (const record of batch) {
            await tx.record.upsert({
              where: { externalId: record.id },
              create: {
                externalId: record.id,
                data: record,
                importedAt: new Date(),
              },
              update: {
                data: record,
                updatedAt: new Date(),
              },
            });
          }
        });

        imported += batch.length;

      } catch (error) {
        ctx.logger.error("Batch failed", { error, batch: i / batchSize });
        failed += batch.length;
      }

      // Small delay to avoid overwhelming database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    ctx.logger.info("Import complete", { imported, failed, total: data.length });

    // Send notification
    await sendEmail({
      to: "admin@company.com",
      subject: "Data Import Complete",
      template: "import-complete",
      data: {
        type: payload.type,
        imported,
        failed,
        total: data.length,
      },
    });

    return {
      success: true,
      imported,
      failed,
      total: data.length,
      duration: ctx.run.durationMs,
    };
  },
});
```

### Step 8: Webhook Handler Task

```typescript
// jobs/webhooks/stripe.ts
import { task } from "@trigger.dev/sdk/v3";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

/**
 * Handle Stripe Webhook
 *
 * Process Stripe webhook events reliably
 */
export const handleStripeWebhookTask = task({
  id: "handle-stripe-webhook",

  run: async (payload: { event: Stripe.Event }, { ctx }) => {
    const { event } = payload;

    ctx.logger.info("Processing Stripe webhook", {
      type: event.type,
      id: event.id,
    });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        ctx.logger.info("Checkout session completed", {
          sessionId: session.id,
          customerId: session.customer,
        });

        // Fulfill order
        await fulfillOrderTask.trigger({
          sessionId: session.id,
          customerId: session.customer as string,
        });

        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;

        ctx.logger.info("Invoice payment succeeded", {
          invoiceId: invoice.id,
          customerId: invoice.customer,
        });

        // Update subscription status
        await db.subscription.update({
          where: { stripeInvoiceId: invoice.id },
          data: {
            status: "active",
            paidAt: new Date(),
          },
        });

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;

        ctx.logger.error("Invoice payment failed", {
          invoiceId: invoice.id,
          customerId: invoice.customer,
        });

        // Send payment failure notification
        await sendPaymentFailureNotification({
          invoiceId: invoice.id,
          customerId: invoice.customer as string,
        });

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        ctx.logger.info("Subscription cancelled", {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
        });

        // Cancel subscription in database
        await db.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: "cancelled",
            cancelledAt: new Date(),
          },
        });

        break;
      }

      default:
        ctx.logger.warn("Unhandled event type", { type: event.type });
    }

    return { processed: true, type: event.type };
  },
});
```

### Step 9: Triggering Tasks

```typescript
// lib/trigger-helpers.ts
import { processOrderTask } from "@/jobs/orders/process";
import { importLargeDatasetTask } from "@/jobs/integrations/sync";

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

  const handle = await processOrderTask.trigger({
    orderId: order.id,
    userId: order.userId,
    items: order.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    })),
    total: order.total,
    email: order.user.email,
  });

  console.log("Order processing triggered:", handle.id);

  return handle;
}

/**
 * Trigger data import with idempotency key
 */
export async function triggerDataImport(url: string, type: string) {
  const handle = await importLargeDatasetTask.trigger(
    { url, type },
    {
      // Idempotency key prevents duplicate runs
      idempotencyKey: `import-${type}-${url}`,
    }
  );

  console.log("Data import triggered:", handle.id);

  return handle;
}

/**
 * Batch trigger multiple tasks
 */
export async function batchTriggerTasks(orders: string[]) {
  const handles = await processOrderTask.batchTrigger(
    orders.map(orderId => ({
      payload: { orderId },
    }))
  );

  console.log(`Triggered ${handles.length} tasks`);

  return handles;
}
```

### Step 10: Monitoring Tasks in React

```typescript
// components/TaskMonitor.tsx
"use client";

import { useRealtimeRun } from "@trigger.dev/react";

export function TaskMonitor({ runId }: { runId: string }) {
  const { run, error } = useRealtimeRun(runId);

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!run) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="font-semibold">Status:</span>
        <StatusBadge status={run.status} />
      </div>

      {run.status === "EXECUTING" && (
        <div>
          <span className="font-semibold">Progress:</span>
          <ProgressBar
            current={run.output?.imported || 0}
            total={run.output?.total || 100}
          />
        </div>
      )}

      {run.status === "COMPLETED" && (
        <div className="text-green-600">
          ✓ Task completed successfully
        </div>
      )}

      {run.status === "FAILED" && (
        <div className="text-red-600">
          ✗ Task failed: {run.error?.message}
        </div>
      )}

      <div>
        <span className="font-semibold">Duration:</span>
        <span className="ml-2">{run.durationMs}ms</span>
      </div>

      {run.output && (
        <div>
          <span className="font-semibold">Output:</span>
          <pre className="mt-2 p-2 bg-gray-100 rounded">
            {JSON.stringify(run.output, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
```

---

## Advanced Patterns

### 1. Child Tasks (Subtasks)

```typescript
export const parentTask = task({
  id: "parent-task",
  run: async (payload, { ctx }) => {
    // Trigger child tasks and wait for completion
    const childHandles = await Promise.all([
      childTask1.triggerAndWait({ data: "child1" }),
      childTask2.triggerAndWait({ data: "child2" }),
      childTask3.triggerAndWait({ data: "child3" }),
    ]);

    // All children completed
    const results = childHandles.map(h => h.output);

    return { childResults: results };
  },
});
```

### 2. Conditional Retries

```typescript
export const smartRetryTask = task({
  id: "smart-retry",

  run: async (payload, { ctx }) => {
    try {
      return await externalAPICall();
    } catch (error) {
      // Only retry on specific errors
      if (error.code === "RATE_LIMIT") {
        // Retry with longer delay
        throw error;
      } else if (error.code === "TIMEOUT") {
        // Retry immediately
        throw error;
      } else {
        // Don't retry, log and return
        ctx.logger.error("Unrecoverable error", { error });
        return { success: false, error: error.message };
      }
    }
  },
});
```

### 3. Task Orchestration

```typescript
export const orchestratorTask = task({
  id: "orchestrator",
  run: async (payload: { workflowId: string }, { ctx }) => {
    // Step 1: Validate
    const validation = await validateTask.triggerAndWait({
      workflowId: payload.workflowId,
    });

    if (!validation.output.valid) {
      return { success: false, reason: "validation_failed" };
    }

    // Step 2: Process in parallel
    const [resultA, resultB, resultC] = await Promise.all([
      processATask.triggerAndWait({ id: payload.workflowId }),
      processBTask.triggerAndWait({ id: payload.workflowId }),
      processCTask.triggerAndWait({ id: payload.workflowId }),
    ]);

    // Step 3: Aggregate results
    const aggregation = await aggregateTask.triggerAndWait({
      results: [resultA.output, resultB.output, resultC.output],
    });

    // Step 4: Finalize
    await finalizeTask.trigger({
      workflowId: payload.workflowId,
      result: aggregation.output,
    });

    return {
      success: true,
      workflowId: payload.workflowId,
    };
  },
});
```

---

## Testing

### Local Development

```bash
# Start Trigger.dev dev server
npx @trigger.dev/cli@latest dev

# Open dashboard
# http://localhost:3030
```

### Testing Tasks

```typescript
// lib/test-tasks.ts
import { processOrderTask } from "@/jobs/orders/process";

export async function testOrderProcessing() {
  const handle = await processOrderTask.trigger({
    orderId: "test_order_123",
    userId: "test_user",
    items: [
      { productId: "widget", quantity: 1, price: 1000 },
    ],
    total: 1000,
    email: "test@example.com",
  });

  console.log("Test task triggered:", handle.id);
  console.log("View in dashboard: http://localhost:3030/runs/" + handle.id);

  return handle;
}
```

---

## Deployment

### Deploy to Trigger.dev Cloud

```bash
# Login
npx @trigger.dev/cli@latest login

# Deploy
npx @trigger.dev/cli@latest deploy

# View deployment
# https://cloud.trigger.dev
```

### Environment Variables (Production)

```env
TRIGGER_API_KEY=tr_prod_xxxxxxxxxxxx
TRIGGER_API_URL=https://api.trigger.dev
```

---

## Best Practices

### 1. Use Idempotency Keys

```typescript
await task.trigger(payload, {
  idempotencyKey: `order-${orderId}`,
});
```

### 2. Log Extensively

```typescript
ctx.logger.info("Step starting", { data });
ctx.logger.error("Step failed", { error });
ctx.logger.warn("Warning condition", { details });
```

### 3. Break Long Tasks into Chunks

```typescript
for (let i = 0; i < largeArray.length; i += 100) {
  const chunk = largeArray.slice(i, i + 100);
  ctx.logger.info("Processing chunk", { progress: `${i}/${largeArray.length}` });
  await processChunk(chunk);
}
```

### 4. Handle Rollbacks

```typescript
try {
  await criticalOperation();
} catch (error) {
  await rollbackOperation();
  throw error;
}
```

---

## Resources

- Official Docs: https://trigger.dev/docs
- Examples: https://github.com/triggerdotdev/trigger.dev-examples
- Discord: https://trigger.dev/discord
- Dashboard: https://cloud.trigger.dev

---

**Remember:** Trigger.dev excels at long-running, reliable background jobs. Use it when you need execution beyond serverless limits and require detailed observability.
