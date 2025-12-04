# Queue Expert

> **ID:** `queue-expert`
> **Tier:** 2
> **Token Cost:** 6000
> **MCP Connections:** None

## What This Skill Does

Master message queues and background job processing with BullMQ and Redis. Build reliable, scalable systems for handling asynchronous tasks, scheduled jobs, and event-driven architectures.

- BullMQ queue setup and configuration
- Worker implementation and scaling
- Job scheduling and cron patterns
- Retry strategies and error handling
- Rate limiting and concurrency control
- Job priorities and dependencies
- Queue monitoring and dashboards
- Dead letter queues and failure handling
- Event-driven architecture patterns
- Horizontal scaling with Redis

## When to Use

This skill is automatically loaded when:

- **Keywords:** queue, job, bullmq, redis queue, worker, background job, scheduler
- **File Types:** queue.ts, worker.ts, job.ts
- **Directories:** /queues, /workers, /jobs

## Core Capabilities

### 1. BullMQ Queue Setup

Configure production-ready job queues with BullMQ.

**Queue Configuration:**

```typescript
// src/lib/queue/config.ts
import { Queue, Worker, QueueScheduler, QueueEvents } from 'bullmq';
import { Redis } from 'ioredis';

// Shared Redis connection for all queues
const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Queue options
const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 1000,
  },
  removeOnComplete: {
    age: 24 * 3600, // 24 hours
    count: 1000,
  },
  removeOnFail: {
    age: 7 * 24 * 3600, // 7 days
  },
};

// Queue factory
export function createQueue<T = any>(name: string) {
  return new Queue<T>(name, {
    connection,
    defaultJobOptions,
  });
}

// Worker factory
export function createWorker<T = any, R = any>(
  name: string,
  processor: (job: Job<T>) => Promise<R>,
  options?: Partial<WorkerOptions>
) {
  return new Worker<T, R>(name, processor, {
    connection,
    concurrency: 5,
    ...options,
  });
}

// Queue events for monitoring
export function createQueueEvents(name: string) {
  return new QueueEvents(name, { connection });
}
```

**Type-Safe Queue Definition:**

```typescript
// src/lib/queue/queues.ts
import { Job } from 'bullmq';
import { createQueue, createWorker, createQueueEvents } from './config';

// Define job types
interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

interface ImageProcessingJobData {
  imageUrl: string;
  transformations: {
    resize?: { width: number; height: number };
    format?: 'webp' | 'jpeg' | 'png';
    quality?: number;
  };
  outputPath: string;
}

interface WebhookJobData {
  url: string;
  payload: Record<string, any>;
  headers?: Record<string, string>;
  retryCount?: number;
}

// Create typed queues
export const emailQueue = createQueue<EmailJobData>('email');
export const imageQueue = createQueue<ImageProcessingJobData>('image-processing');
export const webhookQueue = createQueue<WebhookJobData>('webhooks');

// Job addition helpers
export async function sendEmail(data: EmailJobData) {
  return emailQueue.add('send', data, {
    priority: data.template === 'password-reset' ? 1 : 2,
  });
}

export async function processImage(data: ImageProcessingJobData) {
  return imageQueue.add('process', data, {
    attempts: 2,
    timeout: 60000, // 1 minute timeout
  });
}

export async function sendWebhook(data: WebhookJobData, delay?: number) {
  return webhookQueue.add('deliver', data, {
    delay,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  });
}
```

**Best Practices:**
- Use separate Redis connections for queues and workers
- Set maxRetriesPerRequest to null for BullMQ compatibility
- Configure removeOnComplete to prevent memory bloat
- Use meaningful queue and job names
- Type your job data interfaces

**Gotchas:**
- BullMQ requires Redis 6.2+ for some features
- Default connection sharing can cause issues under load
- Job data must be JSON serializable
- Stale jobs can accumulate without proper cleanup

### 2. Worker Implementation

Build robust job processors.

**Basic Worker:**

```typescript
// src/workers/email.worker.ts
import { Job } from 'bullmq';
import { createWorker } from '../lib/queue/config';
import { sendEmailWithProvider } from '../lib/email';

interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

interface EmailJobResult {
  messageId: string;
  sentAt: Date;
}

const emailWorker = createWorker<EmailJobData, EmailJobResult>(
  'email',
  async (job) => {
    const { to, subject, template, context } = job.data;
    
    // Update progress
    await job.updateProgress(10);
    
    // Render template
    const html = await renderTemplate(template, context);
    await job.updateProgress(30);
    
    // Send email
    const result = await sendEmailWithProvider({
      to,
      subject,
      html,
    });
    await job.updateProgress(100);
    
    // Log for debugging
    job.log(`Email sent to ${to}: ${result.messageId}`);
    
    return {
      messageId: result.messageId,
      sentAt: new Date(),
    };
  },
  {
    concurrency: 10,
    limiter: {
      max: 100,
      duration: 1000, // 100 emails per second
    },
  }
);

// Event handlers
emailWorker.on('completed', (job, result) => {
  console.log(`Email job ${job.id} completed:`, result.messageId);
});

emailWorker.on('failed', (job, error) => {
  console.error(`Email job ${job?.id} failed:`, error.message);
  // Send to error tracking
  captureException(error, { jobId: job?.id, data: job?.data });
});

emailWorker.on('progress', (job, progress) => {
  console.log(`Email job ${job.id} progress: ${progress}%`);
});

export { emailWorker };
```

**Complex Worker with Dependencies:**

```typescript
// src/workers/image.worker.ts
import { Job } from 'bullmq';
import sharp from 'sharp';
import { createWorker } from '../lib/queue/config';
import { uploadToS3, downloadFromUrl } from '../lib/storage';

interface ImageJobData {
  imageUrl: string;
  transformations: {
    resize?: { width: number; height: number };
    format?: 'webp' | 'jpeg' | 'png';
    quality?: number;
  };
  outputPath: string;
}

const imageWorker = createWorker<ImageJobData>(
  'image-processing',
  async (job) => {
    const { imageUrl, transformations, outputPath } = job.data;
    
    try {
      // Download image
      await job.updateProgress(10);
      const imageBuffer = await downloadFromUrl(imageUrl);
      
      // Process with sharp
      await job.updateProgress(30);
      let pipeline = sharp(imageBuffer);
      
      if (transformations.resize) {
        pipeline = pipeline.resize(
          transformations.resize.width,
          transformations.resize.height,
          { fit: 'cover' }
        );
      }
      
      if (transformations.format) {
        pipeline = pipeline.toFormat(transformations.format, {
          quality: transformations.quality || 80,
        });
      }
      
      await job.updateProgress(70);
      const outputBuffer = await pipeline.toBuffer();
      
      // Upload to S3
      await job.updateProgress(90);
      const url = await uploadToS3(outputPath, outputBuffer);
      
      await job.updateProgress(100);
      
      return { url, size: outputBuffer.length };
    } catch (error) {
      // Classify error for retry decision
      if (error.code === 'ETIMEDOUT') {
        throw new Error('Download timeout - will retry');
      }
      if (error.message.includes('unsupported image')) {
        // Don't retry invalid images
        throw new UnrecoverableError('Invalid image format');
      }
      throw error;
    }
  },
  {
    concurrency: 3, // Lower concurrency for CPU-intensive work
    limiter: {
      max: 10,
      duration: 1000,
    },
  }
);

export { imageWorker };
```

**Sandboxed Worker:**

```typescript
// src/workers/sandboxed.worker.ts
import { Worker } from 'bullmq';

// Sandboxed processor runs in separate process
const sandboxedWorker = new Worker(
  'heavy-computation',
  './processors/heavy.js', // Path to processor file
  {
    connection,
    useWorkerThreads: true, // Use worker threads instead of child process
    concurrency: 2,
  }
);

// processors/heavy.js
module.exports = async function (job) {
  // This runs in isolated context
  const result = await heavyComputation(job.data);
  return result;
};
```

**Best Practices:**
- Use progress updates for long-running jobs
- Implement proper error classification
- Use sandboxed processors for untrusted code
- Set appropriate concurrency based on job type
- Implement graceful shutdown

**Gotchas:**
- Workers don't automatically recover stalled jobs
- Progress updates are not persisted
- Sandboxed workers have startup overhead
- Memory leaks in workers accumulate over time

### 3. Job Scheduling

Schedule recurring and delayed jobs.

**Cron-Based Scheduling:**

```typescript
// src/lib/queue/scheduler.ts
import { Queue } from 'bullmq';

const schedulerQueue = new Queue('scheduled-tasks', { connection });

// Add repeatable jobs
async function setupScheduledJobs() {
  // Daily report at 9 AM
  await schedulerQueue.add(
    'daily-report',
    { type: 'daily' },
    {
      repeat: {
        pattern: '0 9 * * *', // Cron pattern
        tz: 'America/New_York',
      },
    }
  );
  
  // Weekly cleanup on Sundays at 2 AM
  await schedulerQueue.add(
    'weekly-cleanup',
    { type: 'cleanup' },
    {
      repeat: {
        pattern: '0 2 * * 0',
        tz: 'UTC',
      },
    }
  );
  
  // Every 5 minutes health check
  await schedulerQueue.add(
    'health-check',
    { type: 'health' },
    {
      repeat: {
        every: 5 * 60 * 1000, // 5 minutes in ms
      },
    }
  );
  
  // Monthly billing on 1st at midnight
  await schedulerQueue.add(
    'monthly-billing',
    { type: 'billing' },
    {
      repeat: {
        pattern: '0 0 1 * *',
        tz: 'UTC',
      },
    }
  );
}

// List repeatable jobs
async function listScheduledJobs() {
  const repeatableJobs = await schedulerQueue.getRepeatableJobs();
  return repeatableJobs.map((job) => ({
    name: job.name,
    pattern: job.pattern,
    next: new Date(job.next),
  }));
}

// Remove repeatable job
async function removeScheduledJob(name: string, pattern: string) {
  await schedulerQueue.removeRepeatable(name, { pattern });
}
```

**Delayed Jobs:**

```typescript
// src/lib/queue/delayed.ts
import { Queue } from 'bullmq';

const notificationQueue = new Queue('notifications', { connection });

// Send reminder in 24 hours
async function scheduleReminder(userId: string, message: string) {
  return notificationQueue.add(
    'reminder',
    { userId, message },
    {
      delay: 24 * 60 * 60 * 1000, // 24 hours
      jobId: `reminder-${userId}-${Date.now()}`, // Unique ID
    }
  );
}

// Schedule for specific time
async function scheduleForTime(data: any, scheduledTime: Date) {
  const delay = scheduledTime.getTime() - Date.now();
  
  if (delay <= 0) {
    throw new Error('Scheduled time must be in the future');
  }
  
  return notificationQueue.add('scheduled', data, { delay });
}

// Cancel scheduled job
async function cancelScheduledJob(jobId: string) {
  const job = await notificationQueue.getJob(jobId);
  if (job) {
    await job.remove();
    return true;
  }
  return false;
}

// Reschedule job
async function rescheduleJob(jobId: string, newDelay: number) {
  const job = await notificationQueue.getJob(jobId);
  if (!job) throw new Error('Job not found');
  
  // Remove and re-add with new delay
  const data = job.data;
  await job.remove();
  
  return notificationQueue.add(job.name, data, {
    delay: newDelay,
    jobId, // Keep same ID
  });
}
```

**Best Practices:**
- Use timezone-aware cron patterns
- Generate unique job IDs for delayed jobs
- Implement job cancellation logic
- Store scheduled job metadata for UI display
- Handle clock skew in distributed systems

**Gotchas:**
- Repeatable jobs are not exactly cron (they run after delay from last)
- Delayed jobs require Redis persistence
- Job IDs must be unique per queue
- Time drift can affect scheduling accuracy

### 4. Retry Strategies

Handle failures gracefully.

**Configuring Retries:**

```typescript
// src/lib/queue/retry.ts
import { Queue, BackoffOptions } from 'bullmq';

// Exponential backoff (1s, 2s, 4s, 8s...)
const exponentialBackoff: BackoffOptions = {
  type: 'exponential',
  delay: 1000,
};

// Fixed delay
const fixedBackoff: BackoffOptions = {
  type: 'fixed',
  delay: 5000,
};

// Custom backoff strategy
const customBackoff: BackoffOptions = {
  type: 'custom',
};

// Register custom backoff in worker
const worker = new Worker('my-queue', processor, {
  connection,
  settings: {
    backoffStrategy: (attemptsMade, type, err, job) => {
      // Custom logic based on error type
      if (err.message.includes('rate limit')) {
        return 60000; // Wait 1 minute for rate limits
      }
      if (err.message.includes('timeout')) {
        return 5000 * attemptsMade; // Linear backoff for timeouts
      }
      // Default exponential
      return Math.pow(2, attemptsMade) * 1000;
    },
  },
});
```

**Error Classification:**

```typescript
// src/lib/queue/errors.ts
import { UnrecoverableError } from 'bullmq';

// Error types that should not retry
class ValidationError extends UnrecoverableError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends UnrecoverableError {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

// Worker with error handling
const webhookWorker = createWorker('webhooks', async (job) => {
  const { url, payload } = job.data;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (response.status === 401) {
      throw new AuthenticationError('Invalid webhook credentials');
    }
    
    if (response.status === 400) {
      throw new ValidationError('Invalid payload format');
    }
    
    if (response.status === 429) {
      // Rate limited - will retry with backoff
      throw new Error('Rate limited');
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return { status: response.status };
  } catch (error) {
    if (error instanceof UnrecoverableError) {
      throw error; // Don't retry
    }
    throw error; // Will retry
  }
});
```

**Dead Letter Queue:**

```typescript
// src/lib/queue/dlq.ts
import { Queue, Worker, Job } from 'bullmq';

const mainQueue = new Queue('main', { connection });
const deadLetterQueue = new Queue('dead-letter', { connection });

// Move failed jobs to DLQ after max attempts
const mainWorker = new Worker('main', processor, {
  connection,
});

mainWorker.on('failed', async (job, error) => {
  if (!job) return;
  
  // Check if max attempts reached
  if (job.attemptsMade >= (job.opts.attempts || 3)) {
    // Move to dead letter queue
    await deadLetterQueue.add('failed', {
      originalQueue: 'main',
      originalJobId: job.id,
      data: job.data,
      error: {
        message: error.message,
        stack: error.stack,
      },
      failedAt: new Date().toISOString(),
      attemptsMade: job.attemptsMade,
    });
    
    console.log(`Job ${job.id} moved to DLQ`);
  }
});

// Retry from DLQ
async function retryFromDLQ(dlqJobId: string) {
  const dlqJob = await deadLetterQueue.getJob(dlqJobId);
  if (!dlqJob) throw new Error('DLQ job not found');
  
  const { originalQueue, data } = dlqJob.data;
  const targetQueue = new Queue(originalQueue, { connection });
  
  // Re-add to original queue
  await targetQueue.add('retry', data);
  
  // Remove from DLQ
  await dlqJob.remove();
  
  return true;
}

// Get DLQ stats
async function getDLQStats() {
  const waiting = await deadLetterQueue.getWaitingCount();
  const jobs = await deadLetterQueue.getJobs(['waiting'], 0, 100);
  
  return {
    total: waiting,
    byQueue: jobs.reduce((acc, job) => {
      const queue = job.data.originalQueue;
      acc[queue] = (acc[queue] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
}
```

**Best Practices:**
- Use UnrecoverableError for permanent failures
- Implement circuit breakers for external services
- Log all retry attempts with context
- Set reasonable max attempts
- Monitor retry rates for anomalies

**Gotchas:**
- Backoff delays are from job completion, not failure
- DLQ jobs need manual intervention
- Some errors appear retryable but are permanent
- Stack traces may not serialize properly

### 5. Rate Limiting and Concurrency

Control job processing speed.

**Rate Limiting:**

```typescript
// src/lib/queue/rate-limit.ts
import { Worker, RateLimiterOptions } from 'bullmq';

// Global rate limit across all workers
const rateLimitedWorker = new Worker('api-calls', processor, {
  connection,
  concurrency: 10,
  limiter: {
    max: 100,       // Max jobs
    duration: 1000, // Per 1 second
  },
});

// Rate limit by group (e.g., per customer)
const perCustomerWorker = new Worker('customer-tasks', processor, {
  connection,
  limiter: {
    max: 10,
    duration: 1000,
    groupKey: 'customerId', // Group by job data field
  },
});

// Adding jobs with group key
await queue.add('task', 
  { customerId: 'cust-123', action: 'sync' },
  { limiter: { groupKey: 'customerId' } }
);
```

**Concurrency Control:**

```typescript
// src/lib/queue/concurrency.ts
import { Worker, Job } from 'bullmq';

// Static concurrency
const staticWorker = new Worker('static', processor, {
  connection,
  concurrency: 5,
});

// Dynamic concurrency based on job type
const dynamicWorker = new Worker('dynamic', async (job) => {
  // Heavy jobs get lower concurrency
  if (job.data.heavy) {
    await dynamicWorker.rateLimit(2000); // Slow down
  }
  return processor(job);
}, {
  connection,
  concurrency: 10,
});

// Pause/resume for maintenance
async function pauseProcessing(queueName: string) {
  const queue = new Queue(queueName, { connection });
  await queue.pause();
}

async function resumeProcessing(queueName: string) {
  const queue = new Queue(queueName, { connection });
  await queue.resume();
}

// Drain queue (let current jobs finish, stop accepting new)
async function drainQueue(queueName: string) {
  const queue = new Queue(queueName, { connection });
  await queue.drain();
}
```

**Priority Queues:**

```typescript
// src/lib/queue/priority.ts
import { Queue } from 'bullmq';

const priorityQueue = new Queue('priority-tasks', { connection });

// Priority: 1 (highest) to 2^21 (lowest)
// Default is 0 if not specified

async function addHighPriorityJob(data: any) {
  return priorityQueue.add('urgent', data, {
    priority: 1,
  });
}

async function addNormalJob(data: any) {
  return priorityQueue.add('normal', data, {
    priority: 10,
  });
}

async function addLowPriorityJob(data: any) {
  return priorityQueue.add('background', data, {
    priority: 100,
  });
}

// Jobs are processed in priority order within each worker
```

**Best Practices:**
- Set rate limits based on downstream capacity
- Use group keys for per-tenant limits
- Implement backpressure detection
- Monitor queue depth and latency
- Use priorities sparingly (adds sorting overhead)

**Gotchas:**
- Rate limits are per worker instance
- Pausing doesn't stop active jobs
- Priority affects waiting jobs, not active
- Group rate limiting requires job data field

### 6. Queue Monitoring

Build observability into your queues.

**Queue Metrics:**

```typescript
// src/lib/queue/metrics.ts
import { Queue, QueueEvents } from 'bullmq';

interface QueueMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

async function getQueueMetrics(queueName: string): Promise<QueueMetrics> {
  const queue = new Queue(queueName, { connection });
  
  const [waiting, active, completed, failed, delayed, isPaused] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
    queue.isPaused(),
  ]);
  
  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    paused: isPaused,
  };
}

// Real-time event streaming
function streamQueueEvents(queueName: string, handlers: {
  onCompleted?: (jobId: string, result: any) => void;
  onFailed?: (jobId: string, error: Error) => void;
  onProgress?: (jobId: string, progress: number) => void;
  onActive?: (jobId: string) => void;
}) {
  const events = new QueueEvents(queueName, { connection });
  
  if (handlers.onCompleted) {
    events.on('completed', ({ jobId, returnvalue }) => {
      handlers.onCompleted!(jobId, returnvalue);
    });
  }
  
  if (handlers.onFailed) {
    events.on('failed', ({ jobId, failedReason }) => {
      handlers.onFailed!(jobId, new Error(failedReason));
    });
  }
  
  if (handlers.onProgress) {
    events.on('progress', ({ jobId, data }) => {
      handlers.onProgress!(jobId, data as number);
    });
  }
  
  if (handlers.onActive) {
    events.on('active', ({ jobId }) => {
      handlers.onActive!(jobId);
    });
  }
  
  return () => events.close();
}
```

**Bull Board Dashboard:**

```typescript
// src/api/queues/dashboard.ts
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import express from 'express';

import { emailQueue, imageQueue, webhookQueue } from '../../lib/queue/queues';

export function setupBullBoard(app: express.Application) {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');
  
  createBullBoard({
    queues: [
      new BullMQAdapter(emailQueue),
      new BullMQAdapter(imageQueue),
      new BullMQAdapter(webhookQueue),
    ],
    serverAdapter,
  });
  
  // Protect with auth middleware
  app.use(
    '/admin/queues',
    authMiddleware,
    serverAdapter.getRouter()
  );
}
```

**Prometheus Metrics:**

```typescript
// src/lib/queue/prometheus.ts
import { Registry, Gauge, Counter, Histogram } from 'prom-client';

const register = new Registry();

const queueSize = new Gauge({
  name: 'bullmq_queue_size',
  help: 'Number of jobs in queue by status',
  labelNames: ['queue', 'status'],
  registers: [register],
});

const jobDuration = new Histogram({
  name: 'bullmq_job_duration_seconds',
  help: 'Job processing duration',
  labelNames: ['queue', 'job_name'],
  buckets: [0.1, 0.5, 1, 5, 10, 30, 60],
  registers: [register],
});

const jobsProcessed = new Counter({
  name: 'bullmq_jobs_processed_total',
  help: 'Total jobs processed',
  labelNames: ['queue', 'status'],
  registers: [register],
});

// Update metrics periodically
setInterval(async () => {
  for (const [name, queue] of Object.entries(queues)) {
    const metrics = await getQueueMetrics(name);
    queueSize.labels(name, 'waiting').set(metrics.waiting);
    queueSize.labels(name, 'active').set(metrics.active);
    queueSize.labels(name, 'delayed').set(metrics.delayed);
  }
}, 5000);

// Track job completion in worker
worker.on('completed', (job) => {
  jobsProcessed.labels(job.queueName, 'completed').inc();
  if (job.finishedOn && job.processedOn) {
    const duration = (job.finishedOn - job.processedOn) / 1000;
    jobDuration.labels(job.queueName, job.name).observe(duration);
  }
});

worker.on('failed', (job) => {
  jobsProcessed.labels(job?.queueName || 'unknown', 'failed').inc();
});

export { register };
```

**Best Practices:**
- Monitor queue depth and processing latency
- Set up alerts for queue buildup
- Track job success/failure rates
- Log job IDs for debugging
- Implement health checks

**Gotchas:**
- QueueEvents requires separate connection
- Metrics polling adds Redis load
- Bull Board exposes job data (secure it)
- Historical metrics need external storage

## Real-World Examples

### Example 1: E-commerce Order Processing

```typescript
// src/queues/orders/queue.ts
import { Queue, Worker, Job } from 'bullmq';

interface OrderJobData {
  orderId: string;
  userId: string;
  items: Array<{ productId: string; quantity: number }>;
  total: number;
  paymentMethod: string;
}

const orderQueue = new Queue<OrderJobData>('orders', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  },
});

// Order processing workflow
const orderWorker = new Worker<OrderJobData>('orders', async (job) => {
  const { orderId, userId, items, total, paymentMethod } = job.data;
  
  try {
    // Step 1: Validate inventory
    await job.updateProgress(10);
    const inventoryValid = await validateInventory(items);
    if (!inventoryValid) {
      throw new UnrecoverableError('Insufficient inventory');
    }
    
    // Step 2: Process payment
    await job.updateProgress(30);
    const paymentResult = await processPayment({
      userId,
      amount: total,
      method: paymentMethod,
    });
    
    if (!paymentResult.success) {
      throw new Error('Payment failed: ' + paymentResult.error);
    }
    
    // Step 3: Reserve inventory
    await job.updateProgress(50);
    await reserveInventory(orderId, items);
    
    // Step 4: Update order status
    await job.updateProgress(70);
    await updateOrderStatus(orderId, 'confirmed');
    
    // Step 5: Queue fulfillment
    await fulfillmentQueue.add('fulfill', { orderId });
    
    // Step 6: Send confirmation email
    await emailQueue.add('order-confirmation', {
      to: await getUserEmail(userId),
      subject: `Order #${orderId} Confirmed`,
      template: 'order-confirmation',
      context: { orderId, items, total },
    });
    
    await job.updateProgress(100);
    
    return { 
      orderId, 
      status: 'confirmed',
      paymentId: paymentResult.paymentId,
    };
  } catch (error) {
    // Rollback on failure
    await updateOrderStatus(orderId, 'failed');
    throw error;
  }
}, { connection, concurrency: 5 });

// Handle order events
orderWorker.on('completed', async (job, result) => {
  console.log(`Order ${result.orderId} processed successfully`);
  await notifyWebhook('order.completed', result);
});

orderWorker.on('failed', async (job, error) => {
  console.error(`Order ${job?.data.orderId} failed:`, error.message);
  await notifyWebhook('order.failed', {
    orderId: job?.data.orderId,
    error: error.message,
  });
});
```

### Example 2: Video Processing Pipeline

```typescript
// src/queues/video/pipeline.ts
import { Queue, Worker, FlowProducer } from 'bullmq';

interface VideoJobData {
  videoId: string;
  inputUrl: string;
  outputs: Array<{
    resolution: '1080p' | '720p' | '480p';
    format: 'mp4' | 'webm';
  }>;
}

// Flow producer for job dependencies
const flowProducer = new FlowProducer({ connection });

async function processVideo(data: VideoJobData) {
  const { videoId, inputUrl, outputs } = data;
  
  // Create processing flow with dependencies
  await flowProducer.add({
    name: 'finalize',
    queueName: 'video-finalize',
    data: { videoId },
    children: outputs.map((output) => ({
      name: 'transcode',
      queueName: 'video-transcode',
      data: {
        videoId,
        inputUrl,
        resolution: output.resolution,
        format: output.format,
      },
      children: [
        {
          name: 'download',
          queueName: 'video-download',
          data: { videoId, url: inputUrl },
        },
      ],
    })),
  });
}

// Download worker
const downloadWorker = new Worker('video-download', async (job) => {
  const { videoId, url } = job.data;
  const localPath = await downloadVideo(url, videoId);
  return { localPath };
}, { connection, concurrency: 3 });

// Transcode worker
const transcodeWorker = new Worker('video-transcode', async (job) => {
  const { videoId, resolution, format } = job.data;
  const parent = await job.getChildrenValues();
  const localPath = parent['video-download']?.localPath;
  
  if (!localPath) throw new Error('Download not complete');
  
  const outputPath = await transcodeVideo(localPath, resolution, format);
  const uploadUrl = await uploadToStorage(outputPath);
  
  return { resolution, format, url: uploadUrl };
}, { connection, concurrency: 2 });

// Finalize worker
const finalizeWorker = new Worker('video-finalize', async (job) => {
  const { videoId } = job.data;
  const children = await job.getChildrenValues();
  
  const outputs = Object.entries(children)
    .filter(([key]) => key.startsWith('video-transcode'))
    .map(([, value]) => value);
  
  await updateVideoRecord(videoId, {
    status: 'ready',
    outputs,
  });
  
  // Cleanup temp files
  await cleanupTempFiles(videoId);
  
  return { videoId, outputs };
}, { connection });
```

## Related Skills

- **redis-expert** - Redis configuration for queues
- **docker-compose** - Running Redis for development
- **monitoring** - Queue observability setup
- **error-handling** - Error classification patterns

## Further Reading

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Redis Persistence](https://redis.io/docs/management/persistence/)
- [Bull Board](https://github.com/felixmosh/bull-board)
- [Job Queue Patterns](https://www.enterpriseintegrationpatterns.com/patterns/messaging/)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
