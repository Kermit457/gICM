# Resend Email Expert

> **ID:** `resend-email`
> **Tier:** 2
> **Token Cost:** 4000
> **MCP Connections:** resend

## What This Skill Does

- Resend API integration for reliable email delivery
- React Email template development
- Delivery webhook handling
- Domain configuration and DNS setup

## When to Use

This skill is automatically loaded when:

- **Keywords:** resend, react-email, @react-email, email api
- **File Types:** N/A
- **Directories:** emails/

## Core Capabilities

### 1. Resend API Integration

Set up and use Resend for transactional email delivery.

**Best Practices:**
- Use environment variables for API keys
- Implement error handling and retries
- Monitor delivery rates
- Use batching for bulk sends
- Set up webhooks for delivery tracking

**Common Patterns:**

```typescript
// lib/resend.ts
import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

// Send single email
export async function sendEmail({
  to,
  subject,
  react,
  from = "noreply@yourdomain.com",
}: {
  to: string;
  subject: string;
  react: React.ReactElement;
  from?: string;
}) {
  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    react,
  });

  if (error) {
    console.error("Email send failed:", error);
    throw new Error(error.message);
  }

  return data;
}

// Batch send
export async function sendBatchEmails(
  emails: Array<{ to: string; subject: string; react: React.ReactElement }>
) {
  const batch = emails.map((email) => ({
    from: "noreply@yourdomain.com",
    ...email,
  }));

  return resend.batch.send(batch);
}

// Schedule email
export async function scheduleEmail({
  to,
  subject,
  react,
  sendAt,
}: {
  to: string;
  subject: string;
  react: React.ReactElement;
  sendAt: Date;
}) {
  return resend.emails.send({
    from: "noreply@yourdomain.com",
    to,
    subject,
    react,
    scheduledAt: sendAt.toISOString(),
  });
}
```

**Gotchas:**
- Verify your domain for better deliverability
- Monitor bounce and complaint rates
- Implement proper unsubscribe handling
- Test with Resend test mode first

### 2. React Email Templates

Build beautiful, responsive email templates with React components.

**Best Practices:**
- Use React Email components for consistency
- Test across email clients
- Keep emails under 102KB
- Use inline styles via React Email
- Include plain text fallback

**Common Patterns:**

```tsx
// emails/welcome.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface WelcomeEmailProps {
  name: string;
  actionUrl: string;
}

export function WelcomeEmail({ name, actionUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to our platform!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Welcome, {name}!</Heading>
          <Text style={text}>
            We are excited to have you on board. Get started by clicking
            the button below.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={actionUrl}>
              Get Started
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: "system-ui, sans-serif",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
  borderRadius: "8px",
};

const heading = {
  color: "#1f2937",
  fontSize: "24px",
  fontWeight: "600",
  textAlign: "center" as const,
};

const text = {
  color: "#4b5563",
  fontSize: "16px",
  lineHeight: "24px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  padding: "12px 24px",
  textDecoration: "none",
};

export default WelcomeEmail;
```

**Gotchas:**
- Email clients have limited CSS support
- Test with tools like Litmus or Email on Acid
- Avoid using modern CSS features
- Images need absolute URLs

### 3. Delivery Webhooks

Track email delivery status with Resend webhooks.

**Best Practices:**
- Verify webhook signatures
- Handle all event types
- Log events for debugging
- Process webhooks async if needed
- Implement idempotency

**Common Patterns:**

```typescript
// app/api/webhooks/resend/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";

const webhookSecret = process.env.RESEND_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing headers" }, { status: 400 });
  }

  const wh = new Webhook(webhookSecret);
  let event: any;

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "email.sent":
      console.log("Email sent:", event.data.email_id);
      break;
    case "email.delivered":
      await handleDelivered(event.data);
      break;
    case "email.bounced":
      await handleBounce(event.data);
      break;
    case "email.complained":
      await handleComplaint(event.data);
      break;
  }

  return NextResponse.json({ received: true });
}

async function handleDelivered(data: any) {
  await db.emailLog.update({
    where: { emailId: data.email_id },
    data: { status: "delivered", deliveredAt: new Date() },
  });
}

async function handleBounce(data: any) {
  await db.emailLog.update({
    where: { emailId: data.email_id },
    data: { status: "bounced", bounceType: data.bounce.type },
  });
  // Optionally mark email as invalid
}

async function handleComplaint(data: any) {
  // Unsubscribe user who complained
  await db.user.update({
    where: { email: data.to },
    data: { emailOptOut: true },
  });
}
```

**Gotchas:**
- Always verify webhook signatures
- Handle retries gracefully
- Log all events for debugging
- Process async for better reliability

### 4. Domain Configuration

Set up custom domains for professional email delivery.

**Best Practices:**
- Use a subdomain for transactional emails
- Configure all DNS records correctly
- Monitor domain reputation
- Set up SPF, DKIM, and DMARC
- Use dedicated IPs for high volume

**Common Setup:**

```
# DNS Records for Resend Domain Verification

# DKIM (required)
resend._domainkey.yourdomain.com  CNAME  [provided-by-resend]

# SPF (recommended)
yourdomain.com  TXT  "v=spf1 include:_spf.resend.com ~all"

# DMARC (recommended)
_dmarc.yourdomain.com  TXT  "v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com"

# Return-Path (optional)
bounce.yourdomain.com  CNAME  [provided-by-resend]
```

**Gotchas:**
- DNS propagation can take 24-48 hours
- Test with email verification tools
- Monitor domain health regularly
- Keep separate domains for marketing vs transactional

### 5. Advanced Email Templates

Build sophisticated email templates for various use cases.

**Best Practices:**
- Create reusable email components
- Use consistent branding across all emails
- Test dark mode compatibility
- Include unsubscribe links where required
- Personalize content when possible

**Common Patterns:**

```tsx
// emails/components/email-layout.tsx
import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function EmailLayout({ preview, children, footer }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with Logo */}
          <Section style={header}>
            <Img
              src="https://yourdomain.com/logo.png"
              width={120}
              height={40}
              alt="Company Logo"
            />
          </Section>

          {/* Main Content */}
          <Section style={content}>{children}</Section>

          {/* Footer */}
          <Section style={footerSection}>
            {footer || <DefaultFooter />}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function DefaultFooter() {
  return (
    <>
      <Text style={footerText}>
        © {new Date().getFullYear()} Your Company. All rights reserved.
      </Text>
      <Text style={footerLinks}>
        <Link href="https://yourdomain.com/privacy" style={footerLink}>
          Privacy Policy
        </Link>
        {" | "}
        <Link href="https://yourdomain.com/terms" style={footerLink}>
          Terms of Service
        </Link>
        {" | "}
        <Link href="{{unsubscribe_url}}" style={footerLink}>
          Unsubscribe
        </Link>
      </Text>
    </>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "20px 0",
};

const header = {
  padding: "20px",
  textAlign: "center" as const,
};

const content = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  padding: "40px 30px",
};

const footerSection = {
  padding: "20px",
  textAlign: "center" as const,
};

const footerText = {
  color: "#9ca3af",
  fontSize: "12px",
  margin: "0",
};

const footerLinks = {
  color: "#9ca3af",
  fontSize: "12px",
  margin: "8px 0 0",
};

const footerLink = {
  color: "#6b7280",
  textDecoration: "underline",
};
```

```tsx
// emails/password-reset.tsx
import { Button, Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

interface PasswordResetEmailProps {
  username: string;
  resetUrl: string;
  expiresIn: string;
}

export function PasswordResetEmail({
  username,
  resetUrl,
  expiresIn,
}: PasswordResetEmailProps) {
  return (
    <EmailLayout preview="Reset your password">
      <Heading style={heading}>Reset Your Password</Heading>

      <Text style={paragraph}>Hi {username},</Text>

      <Text style={paragraph}>
        We received a request to reset your password. Click the button below to
        create a new password. This link will expire in {expiresIn}.
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href={resetUrl}>
          Reset Password
        </Button>
      </Section>

      <Text style={paragraph}>
        If you did not request a password reset, you can safely ignore this
        email. Your password will not be changed.
      </Text>

      <Text style={securityNote}>
        For security, this request was received from a web browser. If this
        was not you, please contact our support team immediately.
      </Text>
    </EmailLayout>
  );
}

const heading = {
  color: "#1f2937",
  fontSize: "24px",
  fontWeight: "600",
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const paragraph = {
  color: "#4b5563",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  padding: "12px 32px",
  textDecoration: "none",
};

const securityNote = {
  backgroundColor: "#fef3c7",
  borderRadius: "8px",
  color: "#92400e",
  fontSize: "14px",
  padding: "12px 16px",
  margin: "24px 0 0",
};
```

```tsx
// emails/order-confirmation.tsx
import {
  Button,
  Column,
  Heading,
  Hr,
  Img,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface OrderConfirmationEmailProps {
  customerName: string;
  orderNumber: string;
  orderDate: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  trackingUrl?: string;
}

export function OrderConfirmationEmail({
  customerName,
  orderNumber,
  orderDate,
  items,
  subtotal,
  shipping,
  tax,
  total,
  shippingAddress,
  trackingUrl,
}: OrderConfirmationEmailProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  return (
    <EmailLayout preview={`Order #${orderNumber} confirmed`}>
      <div style={successIcon}>✓</div>
      <Heading style={heading}>Order Confirmed!</Heading>

      <Text style={paragraph}>Hi {customerName},</Text>
      <Text style={paragraph}>
        Thank you for your order. We will send you a shipping confirmation once
        your package is on its way.
      </Text>

      {/* Order Details */}
      <Section style={orderDetails}>
        <Row>
          <Column>
            <Text style={label}>Order Number</Text>
            <Text style={value}>#{orderNumber}</Text>
          </Column>
          <Column>
            <Text style={label}>Order Date</Text>
            <Text style={value}>{orderDate}</Text>
          </Column>
        </Row>
      </Section>

      <Hr style={divider} />

      {/* Items */}
      <Heading as="h2" style={sectionHeading}>
        Items
      </Heading>
      {items.map((item, index) => (
        <Row key={index} style={itemRow}>
          <Column style={{ width: "60px" }}>
            {item.image && (
              <Img
                src={item.image}
                width={50}
                height={50}
                alt={item.name}
                style={itemImage}
              />
            )}
          </Column>
          <Column>
            <Text style={itemName}>{item.name}</Text>
            <Text style={itemQuantity}>Qty: {item.quantity}</Text>
          </Column>
          <Column style={{ textAlign: "right" }}>
            <Text style={itemPrice}>{formatCurrency(item.price)}</Text>
          </Column>
        </Row>
      ))}

      <Hr style={divider} />

      {/* Totals */}
      <Section style={totals}>
        <Row>
          <Column>
            <Text style={totalLabel}>Subtotal</Text>
          </Column>
          <Column style={{ textAlign: "right" }}>
            <Text style={totalValue}>{formatCurrency(subtotal)}</Text>
          </Column>
        </Row>
        <Row>
          <Column>
            <Text style={totalLabel}>Shipping</Text>
          </Column>
          <Column style={{ textAlign: "right" }}>
            <Text style={totalValue}>{formatCurrency(shipping)}</Text>
          </Column>
        </Row>
        <Row>
          <Column>
            <Text style={totalLabel}>Tax</Text>
          </Column>
          <Column style={{ textAlign: "right" }}>
            <Text style={totalValue}>{formatCurrency(tax)}</Text>
          </Column>
        </Row>
        <Hr style={divider} />
        <Row>
          <Column>
            <Text style={grandTotalLabel}>Total</Text>
          </Column>
          <Column style={{ textAlign: "right" }}>
            <Text style={grandTotalValue}>{formatCurrency(total)}</Text>
          </Column>
        </Row>
      </Section>

      <Hr style={divider} />

      {/* Shipping Address */}
      <Heading as="h2" style={sectionHeading}>
        Shipping Address
      </Heading>
      <Text style={address}>
        {shippingAddress.line1}
        <br />
        {shippingAddress.line2 && (
          <>
            {shippingAddress.line2}
            <br />
          </>
        )}
        {shippingAddress.city}, {shippingAddress.state}{" "}
        {shippingAddress.postalCode}
        <br />
        {shippingAddress.country}
      </Text>

      {trackingUrl && (
        <Section style={buttonContainer}>
          <Button style={button} href={trackingUrl}>
            Track Your Order
          </Button>
        </Section>
      )}
    </EmailLayout>
  );
}

const successIcon = {
  backgroundColor: "#dcfce7",
  borderRadius: "50%",
  color: "#16a34a",
  fontSize: "32px",
  fontWeight: "bold",
  height: "64px",
  lineHeight: "64px",
  margin: "0 auto 16px",
  textAlign: "center" as const,
  width: "64px",
};

const heading = {
  color: "#1f2937",
  fontSize: "24px",
  fontWeight: "600",
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const paragraph = {
  color: "#4b5563",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const orderDetails = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 0",
};

const label = {
  color: "#9ca3af",
  fontSize: "12px",
  fontWeight: "500",
  textTransform: "uppercase" as const,
  margin: "0",
};

const value = {
  color: "#1f2937",
  fontSize: "16px",
  fontWeight: "600",
  margin: "4px 0 0",
};

const divider = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const sectionHeading = {
  color: "#1f2937",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 16px",
};

const itemRow = {
  marginBottom: "16px",
};

const itemImage = {
  borderRadius: "4px",
  objectFit: "cover" as const,
};

const itemName = {
  color: "#1f2937",
  fontSize: "14px",
  fontWeight: "500",
  margin: "0",
};

const itemQuantity = {
  color: "#6b7280",
  fontSize: "12px",
  margin: "4px 0 0",
};

const itemPrice = {
  color: "#1f2937",
  fontSize: "14px",
  fontWeight: "500",
  margin: "0",
};

const totals = {
  marginTop: "16px",
};

const totalLabel = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "8px 0",
};

const totalValue = {
  color: "#1f2937",
  fontSize: "14px",
  margin: "8px 0",
};

const grandTotalLabel = {
  color: "#1f2937",
  fontSize: "16px",
  fontWeight: "600",
  margin: "8px 0",
};

const grandTotalValue = {
  color: "#1f2937",
  fontSize: "18px",
  fontWeight: "700",
  margin: "8px 0",
};

const address = {
  color: "#4b5563",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  padding: "12px 24px",
  textDecoration: "none",
};
```

### 6. Email Analytics and Monitoring

Track email performance and delivery metrics.

**Best Practices:**
- Monitor delivery, open, and click rates
- Set up alerts for delivery issues
- Track bounces and handle them properly
- A/B test subject lines
- Maintain sender reputation

**Common Patterns:**

```typescript
// lib/email/analytics.ts
import { db } from "@/lib/db";

interface EmailEvent {
  emailId: string;
  type: "sent" | "delivered" | "opened" | "clicked" | "bounced" | "complained";
  timestamp: Date;
  metadata?: Record<string, any>;
}

export async function trackEmailEvent(event: EmailEvent) {
  await db.emailEvent.create({
    data: {
      emailId: event.emailId,
      eventType: event.type,
      occurredAt: event.timestamp,
      metadata: event.metadata,
    },
  });

  // Update email record
  await db.emailLog.update({
    where: { id: event.emailId },
    data: {
      lastEventType: event.type,
      lastEventAt: event.timestamp,
      ...(event.type === "delivered" && { deliveredAt: event.timestamp }),
      ...(event.type === "opened" && { openedAt: event.timestamp }),
      ...(event.type === "clicked" && { clickedAt: event.timestamp }),
      ...(event.type === "bounced" && { bouncedAt: event.timestamp }),
    },
  });
}

// Get email analytics for dashboard
export async function getEmailAnalytics(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await db.emailLog.groupBy({
    by: ["lastEventType"],
    where: {
      createdAt: { gte: startDate },
    },
    _count: { id: true },
  });

  const total = stats.reduce((sum, s) => sum + s._count.id, 0);
  const delivered = stats.find((s) => s.lastEventType === "delivered")?._count.id || 0;
  const opened = stats.find((s) => s.lastEventType === "opened")?._count.id || 0;
  const clicked = stats.find((s) => s.lastEventType === "clicked")?._count.id || 0;
  const bounced = stats.find((s) => s.lastEventType === "bounced")?._count.id || 0;

  return {
    total,
    delivered,
    opened,
    clicked,
    bounced,
    deliveryRate: total ? ((delivered / total) * 100).toFixed(1) : "0",
    openRate: delivered ? ((opened / delivered) * 100).toFixed(1) : "0",
    clickRate: opened ? ((clicked / opened) * 100).toFixed(1) : "0",
    bounceRate: total ? ((bounced / total) * 100).toFixed(1) : "0",
  };
}

// Email analytics dashboard component
export async function EmailAnalyticsDashboard() {
  const analytics = await getEmailAnalytics();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        title="Emails Sent"
        value={analytics.total.toLocaleString()}
        subtitle="Last 30 days"
      />
      <StatCard
        title="Delivery Rate"
        value={`${analytics.deliveryRate}%`}
        subtitle={`${analytics.delivered.toLocaleString()} delivered`}
        status={parseFloat(analytics.deliveryRate) > 95 ? "good" : "warning"}
      />
      <StatCard
        title="Open Rate"
        value={`${analytics.openRate}%`}
        subtitle={`${analytics.opened.toLocaleString()} opened`}
        status={parseFloat(analytics.openRate) > 20 ? "good" : "warning"}
      />
      <StatCard
        title="Click Rate"
        value={`${analytics.clickRate}%`}
        subtitle={`${analytics.clicked.toLocaleString()} clicked`}
      />
    </div>
  );
}
```

### 7. Email Queue and Rate Limiting

Handle high-volume email sending with proper queuing.

**Best Practices:**
- Queue emails for background processing
- Implement rate limiting to avoid Resend limits
- Retry failed sends with exponential backoff
- Prioritize transactional over marketing emails
- Monitor queue health

**Common Patterns:**

```typescript
// lib/email/queue.ts
import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { resend } from "./resend";

const connection = new Redis(process.env.REDIS_URL!);

// Email queue
export const emailQueue = new Queue("emails", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
});

// Queue email for sending
export async function queueEmail({
  to,
  subject,
  react,
  priority = "normal",
}: {
  to: string;
  subject: string;
  react: React.ReactElement;
  priority?: "high" | "normal" | "low";
}) {
  const priorityMap = { high: 1, normal: 5, low: 10 };

  return emailQueue.add(
    "send",
    { to, subject, react },
    { priority: priorityMap[priority] }
  );
}

// Queue batch of emails
export async function queueBatchEmails(
  emails: Array<{ to: string; subject: string; react: React.ReactElement }>
) {
  const jobs = emails.map((email) => ({
    name: "send",
    data: email,
    opts: { priority: 5 },
  }));

  return emailQueue.addBulk(jobs);
}

// Worker to process email queue
export const emailWorker = new Worker(
  "emails",
  async (job) => {
    const { to, subject, react } = job.data;

    const { data, error } = await resend.emails.send({
      from: "Your App <noreply@yourdomain.com>",
      to,
      subject,
      react,
    });

    if (error) {
      throw new Error(error.message);
    }

    // Log successful send
    await db.emailLog.create({
      data: {
        resendId: data!.id,
        to,
        subject,
        status: "sent",
      },
    });

    return data;
  },
  {
    connection,
    concurrency: 10, // Process 10 emails at a time
    limiter: {
      max: 100, // Max 100 emails
      duration: 1000, // Per second (Resend limit)
    },
  }
);

// Monitor queue health
emailWorker.on("completed", (job) => {
  console.log(`Email sent: ${job.id}`);
});

emailWorker.on("failed", (job, error) => {
  console.error(`Email failed: ${job?.id}`, error);
});

// Get queue stats
export async function getQueueStats() {
  const [waiting, active, completed, failed] = await Promise.all([
    emailQueue.getWaitingCount(),
    emailQueue.getActiveCount(),
    emailQueue.getCompletedCount(),
    emailQueue.getFailedCount(),
  ]);

  return { waiting, active, completed, failed };
}
```

## Real-World Examples

### Complete Email Service with All Features

```typescript
// services/email-service.ts
import { Resend } from "resend";
import { WelcomeEmail } from "@/emails/welcome";
import { PasswordResetEmail } from "@/emails/password-reset";
import { OrderConfirmationEmail } from "@/emails/order-confirmation";
import { NewsletterEmail } from "@/emails/newsletter";
import { queueEmail, queueBatchEmails } from "@/lib/email/queue";

const resend = new Resend(process.env.RESEND_API_KEY);

export const emailService = {
  // Transactional emails (high priority, send immediately)
  async sendWelcome(user: { email: string; name: string }) {
    const verificationUrl = await generateVerificationUrl(user.email);

    return queueEmail({
      to: user.email,
      subject: `Welcome to Our Platform, ${user.name}!`,
      react: WelcomeEmail({
        username: user.name,
        verificationUrl,
      }),
      priority: "high",
    });
  },

  async sendPasswordReset(email: string) {
    const resetUrl = await generateResetUrl(email);

    return queueEmail({
      to: email,
      subject: "Reset Your Password",
      react: PasswordResetEmail({
        username: await getUserNameByEmail(email),
        resetUrl,
        expiresIn: "1 hour",
      }),
      priority: "high",
    });
  },

  async sendOrderConfirmation(order: Order) {
    return queueEmail({
      to: order.email,
      subject: `Order #${order.number} Confirmed`,
      react: OrderConfirmationEmail({
        customerName: order.customerName,
        orderNumber: order.number,
        orderDate: formatDate(order.createdAt),
        items: order.items,
        subtotal: order.subtotal,
        shipping: order.shipping,
        tax: order.tax,
        total: order.total,
        shippingAddress: order.shippingAddress,
      }),
      priority: "high",
    });
  },

  // Marketing emails (low priority, batched)
  async sendNewsletter(newsletter: {
    subject: string;
    content: string;
  }) {
    const subscribers = await db.subscriber.findMany({
      where: { confirmed: true, unsubscribed: false },
    });

    const emails = subscribers.map((subscriber) => ({
      to: subscriber.email,
      subject: newsletter.subject,
      react: NewsletterEmail({
        content: newsletter.content,
        unsubscribeUrl: generateUnsubscribeUrl(subscriber.email),
      }),
    }));

    // Queue in batches
    return queueBatchEmails(emails);
  },

  // Analytics
  async getStats() {
    return getEmailAnalytics();
  },
};
```

## Related Skills

- `email-resend` - Extended email handling (same domain)
- `authentication-expert` - Email verification flows
- `stripe-payments` - Invoice and receipt emails
- `react-expert` - React Email component patterns
- `nextjs-app-router-mastery` - Server Actions for email forms

## Further Reading

- [Resend Documentation](https://resend.com/docs) - Official API docs
- [React Email](https://react.email) - Component library
- [Email Deliverability Guide](https://resend.com/blog/email-deliverability) - Best practices
- [DMARC Configuration](https://dmarcian.com) - Domain authentication
- [Can I Email](https://www.caniemail.com) - CSS support checker
- [Litmus](https://litmus.com) - Email testing tool

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
*Master email delivery for modern applications*

## Real-World Examples

### Complete Email Service

```typescript
// services/email.ts
import { Resend } from "resend";
import { WelcomeEmail } from "@/emails/welcome";
import { PasswordResetEmail } from "@/emails/password-reset";
import { InvoiceEmail } from "@/emails/invoice";

const resend = new Resend(process.env.RESEND_API_KEY);

export const emailService = {
  async sendWelcome(user: { email: string; name: string }) {
    const verificationUrl = await generateVerificationUrl(user.email);

    return resend.emails.send({
      from: "Welcome <hello@yourdomain.com>",
      to: user.email,
      subject: `Welcome to our platform, ${user.name}!`,
      react: WelcomeEmail({ name: user.name, actionUrl: verificationUrl }),
    });
  },

  async sendPasswordReset(email: string) {
    const resetUrl = await generateResetUrl(email);

    return resend.emails.send({
      from: "Security <security@yourdomain.com>",
      to: email,
      subject: "Reset your password",
      react: PasswordResetEmail({ resetUrl }),
    });
  },

  async sendInvoice(data: InvoiceData) {
    return resend.emails.send({
      from: "Billing <billing@yourdomain.com>",
      to: data.customerEmail,
      subject: `Invoice #${data.invoiceNumber}`,
      react: InvoiceEmail(data),
      attachments: [
        {
          filename: `invoice-${data.invoiceNumber}.pdf`,
          content: data.pdfBuffer,
        },
      ],
    });
  },
};
```

## Related Skills

- `email-resend` - Extended email handling (same domain)
- `authentication-expert` - Email verification flows
- `stripe-payments` - Invoice and receipt emails
- `react-expert` - React Email component patterns

## Further Reading

- [Resend Documentation](https://resend.com/docs)
- [React Email](https://react.email)
- [Email Deliverability Guide](https://resend.com/blog/email-deliverability)
- [DMARC Configuration](https://dmarcian.com)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
*Master email delivery for modern applications*
