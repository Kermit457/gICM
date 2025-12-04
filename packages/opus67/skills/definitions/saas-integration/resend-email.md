# Resend Email Expert

> **ID:** `resend-email`
> **Tier:** 2
> **Token Cost:** 4000
> **MCP Connections:** resend

## 🎯 What This Skill Does

Master Resend API integration for production-grade transactional emails with React Email templates, webhook handling, and comprehensive delivery tracking.

**Core Capabilities:**
- Resend API integration with full error handling
- React Email template creation and testing
- Delivery webhooks and event tracking
- Domain configuration and SPF/DKIM setup
- Email scheduling and batching
- Attachment handling
- Template variables and personalization
- Multi-recipient management

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** resend, react-email, @react-email, transactional, email api, send email
- **File Types:** `.tsx` (for React Email templates)
- **Directories:** `emails/`, `templates/`

## 🚀 Core Capabilities

### 1. Resend API Integration

**Installation & Setup:**

```typescript
// Install dependencies
npm install resend
npm install @react-email/components -D

// Environment configuration
// .env
RESEND_API_KEY=re_123456789
RESEND_FROM_EMAIL=onboarding@yourdomain.com
```

**Basic Email Sending:**

```typescript
// lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  tags?: { name: string; value: string }[];
  attachments?: {
    filename: string;
    content: Buffer | string;
  }[];
}

export async function sendEmail({
  to,
  subject,
  react,
  from = process.env.RESEND_FROM_EMAIL!,
  replyTo,
  cc,
  bcc,
  tags,
  attachments,
}: SendEmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      react,
      replyTo,
      cc,
      bcc,
      tags,
      attachments,
    });

    if (error) {
      throw new Error(`Email send failed: ${error.message}`);
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}
```

**Advanced: Batch Email Sending:**

```typescript
// lib/email-batch.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface BatchEmailOptions {
  emails: {
    to: string;
    subject: string;
    react: React.ReactElement;
  }[];
  from?: string;
}

export async function sendBatchEmails({
  emails,
  from = process.env.RESEND_FROM_EMAIL!,
}: BatchEmailOptions) {
  try {
    const { data, error } = await resend.batch.send(
      emails.map((email) => ({
        from,
        to: email.to,
        subject: email.subject,
        react: email.react,
      }))
    );

    if (error) {
      throw new Error(`Batch send failed: ${error.message}`);
    }

    return { success: true, ids: data?.map((d) => d.id) };
  } catch (error) {
    console.error('Batch send error:', error);
    return { success: false, error };
  }
}
```

**Email Scheduling:**

```typescript
// lib/email-schedule.ts
export async function scheduleEmail({
  to,
  subject,
  react,
  scheduledAt,
}: SendEmailOptions & { scheduledAt: Date }) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to,
      subject,
      react,
      scheduledAt: scheduledAt.toISOString(),
    });

    if (error) {
      throw new Error(`Email schedule failed: ${error.message}`);
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Email schedule error:', error);
    return { success: false, error };
  }
}
```

**Best Practices:**
- Always validate email addresses before sending
- Use environment variables for API keys and sender emails
- Implement retry logic with exponential backoff
- Log all email sends with metadata for debugging
- Use tags to categorize emails (e.g., "signup", "password-reset")
- Set appropriate rate limits to avoid API throttling

**Gotchas:**
- Resend has a rate limit of 10 emails/second on free tier
- Maximum email size is 40MB including attachments
- Scheduled emails must be at least 1 minute in the future
- Batch sends are limited to 100 emails per request

### 2. React Email Templates

**Basic Template Structure:**

```tsx
// emails/welcome.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface WelcomeEmailProps {
  username: string;
  loginUrl: string;
}

export const WelcomeEmail = ({
  username = 'there',
  loginUrl = 'https://example.com/login',
}: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to our platform!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://example.com/logo.png"
          width="170"
          height="50"
          alt="Logo"
          style={logo}
        />
        <Heading style={h1}>Welcome, {username}!</Heading>
        <Text style={text}>
          Thanks for signing up. We're excited to have you on board.
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href={loginUrl}>
            Get Started
          </Button>
        </Section>
        <Text style={footer}>
          If you didn't create this account, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default WelcomeEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const logo = {
  margin: '0 auto',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  textAlign: 'center' as const,
};

const buttonContainer = {
  padding: '27px 0 27px',
};

const button = {
  backgroundColor: '#5469d4',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
};
```

**Advanced: Password Reset Template:**

```tsx
// emails/password-reset.tsx
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
} from '@react-email/components';

interface PasswordResetEmailProps {
  username: string;
  resetLink: string;
  expiresInMinutes: number;
}

export const PasswordResetEmail = ({
  username,
  resetLink,
  expiresInMinutes = 30,
}: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Password Reset Request</Heading>
        <Text style={text}>Hi {username},</Text>
        <Text style={text}>
          We received a request to reset your password. Click the button below to create a new
          password:
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href={resetLink}>
            Reset Password
          </Button>
        </Section>
        <Text style={text}>
          This link will expire in {expiresInMinutes} minutes for security reasons.
        </Text>
        <Text style={footer}>
          If you didn't request this, you can safely ignore this email. Your password will remain
          unchanged.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default PasswordResetEmail;
```

**Order Confirmation Template:**

```tsx
// emails/order-confirmation.tsx
import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image: string;
}

interface OrderConfirmationEmailProps {
  customerName: string;
  orderNumber: string;
  orderDate: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  trackingUrl?: string;
}

export const OrderConfirmationEmail = ({
  customerName,
  orderNumber,
  orderDate,
  items,
  subtotal,
  tax,
  shipping,
  total,
  trackingUrl,
}: OrderConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Order confirmation #{orderNumber}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Order Confirmed!</Heading>
        <Text style={text}>Hi {customerName},</Text>
        <Text style={text}>
          Thanks for your order! We're processing it now and will send you tracking information
          soon.
        </Text>

        <Section style={orderInfo}>
          <Text style={orderLabel}>Order Number: {orderNumber}</Text>
          <Text style={orderLabel}>Order Date: {orderDate}</Text>
        </Section>

        {items.map((item, index) => (
          <Section key={index} style={itemSection}>
            <Row>
              <Column style={itemImageColumn}>
                <Img src={item.image} width="80" height="80" style={itemImage} />
              </Column>
              <Column style={itemDetailsColumn}>
                <Text style={itemName}>{item.name}</Text>
                <Text style={itemMeta}>Quantity: {item.quantity}</Text>
                <Text style={itemPrice}>${item.price.toFixed(2)}</Text>
              </Column>
            </Row>
          </Section>
        ))}

        <Section style={totalsSection}>
          <Row>
            <Column style={totalLabel}>Subtotal:</Column>
            <Column style={totalValue}>${subtotal.toFixed(2)}</Column>
          </Row>
          <Row>
            <Column style={totalLabel}>Tax:</Column>
            <Column style={totalValue}>${tax.toFixed(2)}</Column>
          </Row>
          <Row>
            <Column style={totalLabel}>Shipping:</Column>
            <Column style={totalValue}>${shipping.toFixed(2)}</Column>
          </Row>
          <Row>
            <Column style={totalLabelBold}>Total:</Column>
            <Column style={totalValueBold}>${total.toFixed(2)}</Column>
          </Row>
        </Section>

        {trackingUrl && (
          <Section style={buttonContainer}>
            <Button style={button} href={trackingUrl}>
              Track Your Order
            </Button>
          </Section>
        )}
      </Container>
    </Body>
  </Html>
);
```

**Testing Templates Locally:**

```bash
# Install React Email CLI
npm install -D react-email

# Add scripts to package.json
{
  "scripts": {
    "email:dev": "email dev",
    "email:export": "email export"
  }
}

# Run development server
npm run email:dev
# Visit http://localhost:3000
```

**Best Practices:**
- Use inline styles for maximum compatibility
- Test in multiple email clients (Gmail, Outlook, Apple Mail)
- Keep emails under 102KB to avoid Gmail clipping
- Use web-safe fonts or fallbacks
- Optimize images and host them on CDN
- Include plain text version for accessibility
- Use semantic HTML for screen readers

**Gotchas:**
- Flexbox and Grid CSS don't work in many email clients
- Use tables for complex layouts
- Background images have limited support
- Video embeds don't work in most clients
- External CSS files are not supported

### 3. Delivery Webhooks

**Webhook Setup:**

```typescript
// app/api/webhooks/resend/route.ts
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Webhook event types
type ResendWebhookEvent =
  | 'email.sent'
  | 'email.delivered'
  | 'email.delivery_delayed'
  | 'email.complained'
  | 'email.bounced'
  | 'email.opened'
  | 'email.clicked';

interface WebhookPayload {
  type: ResendWebhookEvent;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    // Event-specific data
    link?: string; // For clicked events
    bounce_type?: 'hard' | 'soft'; // For bounced events
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const headersList = headers();
    const signature = headersList.get('svix-signature');

    // Verify webhook signature (recommended in production)
    if (!verifyWebhookSignature(body, signature)) {
      return new NextResponse('Invalid signature', { status: 401 });
    }

    const payload = body as WebhookPayload;

    // Handle different event types
    switch (payload.type) {
      case 'email.sent':
        await handleEmailSent(payload);
        break;
      case 'email.delivered':
        await handleEmailDelivered(payload);
        break;
      case 'email.bounced':
        await handleEmailBounced(payload);
        break;
      case 'email.opened':
        await handleEmailOpened(payload);
        break;
      case 'email.clicked':
        await handleEmailClicked(payload);
        break;
      case 'email.complained':
        await handleEmailComplained(payload);
        break;
      default:
        console.log('Unhandled event type:', payload.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return new NextResponse('Webhook handler failed', { status: 500 });
  }
}

async function handleEmailSent(payload: WebhookPayload) {
  await db.emailLog.create({
    data: {
      emailId: payload.data.email_id,
      to: payload.data.to[0],
      subject: payload.data.subject,
      status: 'sent',
      sentAt: new Date(payload.data.created_at),
    },
  });
}

async function handleEmailDelivered(payload: WebhookPayload) {
  await db.emailLog.update({
    where: { emailId: payload.data.email_id },
    data: {
      status: 'delivered',
      deliveredAt: new Date(payload.created_at),
    },
  });
}

async function handleEmailBounced(payload: WebhookPayload) {
  await db.emailLog.update({
    where: { emailId: payload.data.email_id },
    data: {
      status: 'bounced',
      bounceType: payload.data.bounce_type,
      bouncedAt: new Date(payload.created_at),
    },
  });

  // If hard bounce, add email to suppression list
  if (payload.data.bounce_type === 'hard') {
    await db.emailSuppression.create({
      data: {
        email: payload.data.to[0],
        reason: 'hard_bounce',
      },
    });
  }
}

async function handleEmailOpened(payload: WebhookPayload) {
  await db.emailLog.update({
    where: { emailId: payload.data.email_id },
    data: {
      opened: true,
      openedAt: new Date(payload.created_at),
    },
  });
}

async function handleEmailClicked(payload: WebhookPayload) {
  await db.emailClick.create({
    data: {
      emailId: payload.data.email_id,
      link: payload.data.link!,
      clickedAt: new Date(payload.created_at),
    },
  });
}

async function handleEmailComplained(payload: WebhookPayload) {
  await db.emailLog.update({
    where: { emailId: payload.data.email_id },
    data: {
      status: 'complained',
      complainedAt: new Date(payload.created_at),
    },
  });

  // Add to suppression list
  await db.emailSuppression.create({
    data: {
      email: payload.data.to[0],
      reason: 'spam_complaint',
    },
  });
}

function verifyWebhookSignature(body: any, signature: string | null): boolean {
  // Implement Svix signature verification
  // See: https://docs.svix.com/receiving/verifying-payloads/how
  return true; // Placeholder
}
```

**Email Suppression List:**

```typescript
// lib/email-suppression.ts
export async function isEmailSuppressed(email: string): Promise<boolean> {
  const suppression = await db.emailSuppression.findUnique({
    where: { email },
  });
  return !!suppression;
}

export async function sendEmailWithSuppressionCheck(options: SendEmailOptions) {
  const recipients = Array.isArray(options.to) ? options.to : [options.to];

  // Filter out suppressed emails
  const validRecipients = [];
  for (const email of recipients) {
    if (await isEmailSuppressed(email)) {
      console.warn(`Email suppressed: ${email}`);
      continue;
    }
    validRecipients.push(email);
  }

  if (validRecipients.length === 0) {
    return { success: false, error: 'All recipients are suppressed' };
  }

  return sendEmail({ ...options, to: validRecipients });
}
```

**Best Practices:**
- Always verify webhook signatures in production
- Use idempotency to handle duplicate webhooks
- Process webhooks asynchronously with a queue
- Store webhook events for audit trail
- Implement retry logic for failed processing
- Monitor webhook delivery latency

**Gotchas:**
- Webhooks may be delivered out of order
- You may receive duplicate webhooks
- Webhook endpoint must respond within 15 seconds
- Failed webhooks are retried with exponential backoff

### 4. Domain Configuration

**SPF/DKIM Setup Guide:**

```bash
# 1. Add your domain in Resend dashboard
# Go to https://resend.com/domains

# 2. Add DNS records (provided by Resend)

# SPF Record (TXT)
# Name: @
# Value: v=spf1 include:resend.net ~all

# DKIM Record (TXT)
# Name: resend._domainkey
# Value: [provided by Resend]

# 3. Verify domain in dashboard
# Wait for DNS propagation (can take up to 48 hours)
```

**Domain Verification Check:**

```typescript
// lib/email-domain.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function checkDomainStatus(domain: string) {
  try {
    const { data } = await resend.domains.get(domain);

    return {
      status: data?.status,
      records: data?.records,
      dkimVerified: data?.records?.dkim?.verified,
      spfVerified: data?.records?.spf?.verified,
    };
  } catch (error) {
    console.error('Domain check error:', error);
    return null;
  }
}

export async function listDomains() {
  try {
    const { data } = await resend.domains.list();
    return data;
  } catch (error) {
    console.error('Domain list error:', error);
    return [];
  }
}
```

**Best Practices:**
- Use a subdomain for transactional emails (e.g., mail.example.com)
- Verify domain before sending production emails
- Monitor domain reputation regularly
- Set up DMARC for additional security
- Use separate domains for marketing vs transactional emails

**Gotchas:**
- DNS changes can take up to 48 hours to propagate
- Missing DKIM/SPF records result in poor deliverability
- Some registrars have specific DNS record formats
- Cloudflare proxy can interfere with email verification

## 💡 Real-World Examples

### Example 1: Complete User Onboarding Flow

```typescript
// app/api/auth/signup/route.ts
import { NextResponse } from 'next/server';
import { WelcomeEmail } from '@/emails/welcome';
import { sendEmail } from '@/lib/email';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  const { email, name } = await req.json();

  try {
    // Create user
    const user = await db.user.create({
      data: { email, name },
    });

    // Send welcome email
    const result = await sendEmail({
      to: email,
      subject: `Welcome to ${process.env.NEXT_PUBLIC_APP_NAME}!`,
      react: WelcomeEmail({
        username: name,
        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
      }),
      tags: [
        { name: 'category', value: 'onboarding' },
        { name: 'user_id', value: user.id },
      ],
    });

    if (!result.success) {
      console.error('Welcome email failed:', result.error);
      // Don't fail signup if email fails
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 });
  }
}
```

### Example 2: Scheduled Digest Email

```typescript
// lib/cron/daily-digest.ts
import { DigestEmail } from '@/emails/digest';
import { sendBatchEmails } from '@/lib/email-batch';
import { db } from '@/lib/db';

export async function sendDailyDigests() {
  // Get users who opted in for daily digests
  const users = await db.user.findMany({
    where: {
      emailPreferences: { dailyDigest: true },
      // Respect timezone for 8am local time
    },
    include: {
      activities: {
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      },
    },
  });

  const emails = users.map((user) => ({
    to: user.email,
    subject: 'Your Daily Digest',
    react: DigestEmail({
      username: user.name,
      activities: user.activities,
      unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe/${user.id}`,
    }),
  }));

  const result = await sendBatchEmails({ emails });

  console.log(`Sent ${emails.length} digest emails:`, result);
}
```

### Example 3: Transactional Email with Attachment

```typescript
// lib/invoices/send-invoice.ts
import { InvoiceEmail } from '@/emails/invoice';
import { sendEmail } from '@/lib/email';
import { generateInvoicePDF } from '@/lib/pdf';

export async function sendInvoice(invoiceId: string) {
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: { customer: true, items: true },
  });

  if (!invoice) throw new Error('Invoice not found');

  // Generate PDF
  const pdfBuffer = await generateInvoicePDF(invoice);

  // Send email with PDF attachment
  const result = await sendEmail({
    to: invoice.customer.email,
    subject: `Invoice #${invoice.number}`,
    react: InvoiceEmail({
      customerName: invoice.customer.name,
      invoiceNumber: invoice.number,
      amount: invoice.total,
      dueDate: invoice.dueDate,
    }),
    attachments: [
      {
        filename: `invoice-${invoice.number}.pdf`,
        content: pdfBuffer,
      },
    ],
    tags: [
      { name: 'category', value: 'invoice' },
      { name: 'invoice_id', value: invoiceId },
    ],
  });

  if (result.success) {
    await db.invoice.update({
      where: { id: invoiceId },
      data: { sentAt: new Date(), emailId: result.id },
    });
  }

  return result;
}
```

## 🔗 Related Skills

- **stripe-payments** - Send receipts and invoices for payments
- **auth-clerk-nextauth** - Send verification and password reset emails
- **supabase-expert** - Trigger emails on database events
- **inngest-expert** - Schedule and queue email sending
- **analytics-tracking** - Track email engagement metrics

## 📖 Further Reading

- [Resend Documentation](https://resend.com/docs)
- [React Email Documentation](https://react.email/docs)
- [Email Client Support](https://www.caniemail.com/)
- [MJML Email Framework](https://mjml.io/)
- [Email Deliverability Guide](https://www.sparkpost.com/resources/email-explained/)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
*Complete production-ready email integration with real examples*
