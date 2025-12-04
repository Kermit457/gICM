# Email Expert (Resend & React Email)

> **ID:** `email-resend`
> **Tier:** 3
> **Token Cost:** 5000
> **MCP Connections:** resend

## What This Skill Does

- Build beautiful emails with React Email components
- Integrate Resend API for reliable email delivery
- Create transactional email templates
- Implement email verification flows
- Build newsletter subscription systems
- Handle email scheduling and batching

## When to Use

This skill is automatically loaded when:

- **Keywords:** email, resend, react-email, transactional, newsletter, mail, smtp
- **File Types:** N/A
- **Directories:** emails/, email-templates/

## Core Capabilities

### 1. Build Emails with React Email

Create responsive, cross-client compatible emails using React components.

**Best Practices:**
- Use React Email components for consistent rendering
- Test emails across multiple clients (Gmail, Outlook, Apple Mail)
- Keep emails under 102KB for Gmail clipping
- Use inline styles (React Email handles this)
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
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface WelcomeEmailProps {
  username: string;
  verificationUrl: string;
}

export function WelcomeEmail({ username, verificationUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to our platform - verify your email</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo */}
          <Img
            src="https://example.com/logo.png"
            width={48}
            height={48}
            alt="Logo"
            style={logo}
          />

          {/* Heading */}
          <Heading style={heading}>Welcome, {username}!</Heading>

          {/* Body */}
          <Text style={paragraph}>
            Thanks for signing up. Please verify your email address to get
            started with all our features.
          </Text>

          {/* CTA Button */}
          <Section style={buttonContainer}>
            <Button style={button} href={verificationUrl}>
              Verify Email Address
            </Button>
          </Section>

          <Text style={paragraph}>
            Or copy and paste this URL into your browser:
          </Text>
          <Text style={link}>{verificationUrl}</Text>

          <Hr style={hr} />

          {/* Footer */}
          <Text style={footer}>
            This email was sent to you because you signed up for our service.
            If you did not sign up, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
  borderRadius: "8px",
};

const logo = {
  margin: "0 auto 24px",
  display: "block",
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
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const link = {
  color: "#2563eb",
  fontSize: "14px",
  wordBreak: "break-all" as const,
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "32px 0",
};

const footer = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "20px",
};

// Default props for preview
WelcomeEmail.PreviewProps = {
  username: "John",
  verificationUrl: "https://example.com/verify?token=abc123",
} as WelcomeEmailProps;

export default WelcomeEmail;
```

```tsx
// emails/invoice.tsx - Transaction Receipt Email
import {
  Body,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

interface InvoiceEmailProps {
  customerName: string;
  invoiceNumber: string;
  invoiceDate: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  currency: string;
}

export function InvoiceEmail({
  customerName,
  invoiceNumber,
  invoiceDate,
  items,
  total,
  currency,
}: InvoiceEmailProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);

  return (
    <Html>
      <Head />
      <Preview>Invoice #{invoiceNumber} - Thank you for your purchase</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Invoice</Heading>

          <Section style={infoSection}>
            <Row>
              <Column>
                <Text style={label}>Invoice Number</Text>
                <Text style={value}>#{invoiceNumber}</Text>
              </Column>
              <Column>
                <Text style={label}>Date</Text>
                <Text style={value}>{invoiceDate}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={hr} />

          <Text style={sectionTitle}>Bill To</Text>
          <Text style={customerText}>{customerName}</Text>

          <Hr style={hr} />

          {/* Line Items */}
          <Section>
            <Row style={tableHeader}>
              <Column style={{ width: "60%" }}>
                <Text style={headerCell}>Item</Text>
              </Column>
              <Column style={{ width: "20%" }}>
                <Text style={headerCell}>Qty</Text>
              </Column>
              <Column style={{ width: "20%" }}>
                <Text style={headerCell}>Price</Text>
              </Column>
            </Row>

            {items.map((item, index) => (
              <Row key={index} style={tableRow}>
                <Column style={{ width: "60%" }}>
                  <Text style={cell}>{item.name}</Text>
                </Column>
                <Column style={{ width: "20%" }}>
                  <Text style={cell}>{item.quantity}</Text>
                </Column>
                <Column style={{ width: "20%" }}>
                  <Text style={cell}>{formatCurrency(item.price)}</Text>
                </Column>
              </Row>
            ))}
          </Section>

          <Hr style={hr} />

          {/* Total */}
          <Section style={totalSection}>
            <Row>
              <Column style={{ width: "60%" }} />
              <Column style={{ width: "20%" }}>
                <Text style={totalLabel}>Total</Text>
              </Column>
              <Column style={{ width: "20%" }}>
                <Text style={totalValue}>{formatCurrency(total)}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Thank you for your business. If you have any questions about this
            invoice, please contact support@example.com.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
```

**Gotchas:**
- Email clients have varying CSS support
- Avoid using flexbox/grid in emails
- Images should have explicit width/height
- Test with email preview tools before sending

### 2. Resend API Integration

Send emails reliably with the Resend API.

**Best Practices:**
- Use environment variables for API keys
- Implement retry logic for failed sends
- Track email delivery with webhooks
- Use batch sending for bulk emails
- Monitor delivery rates and bounces

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
  text,
}: {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  text?: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: "Your App <noreply@yourdomain.com>",
      to: Array.isArray(to) ? to : [to],
      subject,
      react,
      text,
    });

    if (error) {
      console.error("Failed to send email:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Email sending error:", error);
    throw error;
  }
}

// Send welcome email
import { WelcomeEmail } from "@/emails/welcome";

export async function sendWelcomeEmail(user: { email: string; name: string }) {
  const verificationToken = await generateVerificationToken(user.email);
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${verificationToken}`;

  return sendEmail({
    to: user.email,
    subject: "Welcome to Our Platform",
    react: WelcomeEmail({
      username: user.name,
      verificationUrl,
    }),
  });
}

// Batch sending
export async function sendBatchEmails(
  emails: Array<{
    to: string;
    subject: string;
    react: React.ReactElement;
  }>
) {
  // Resend supports batch sending (up to 100 emails)
  const batch = emails.map((email) => ({
    from: "Your App <noreply@yourdomain.com>",
    ...email,
  }));

  const { data, error } = await resend.batch.send(batch);

  if (error) {
    console.error("Batch send failed:", error);
    throw error;
  }

  return data;
}

// Send with attachments
export async function sendEmailWithAttachment({
  to,
  subject,
  react,
  attachments,
}: {
  to: string;
  subject: string;
  react: React.ReactElement;
  attachments: Array<{
    filename: string;
    content: Buffer;
  }>;
}) {
  return resend.emails.send({
    from: "Your App <noreply@yourdomain.com>",
    to,
    subject,
    react,
    attachments,
  });
}

// Scheduled email (using Resend's scheduling)
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
    from: "Your App <noreply@yourdomain.com>",
    to,
    subject,
    react,
    scheduledAt: sendAt.toISOString(),
  });
}
```

```typescript
// Server Action for sending emails
// app/actions/email.ts
"use server";

import { sendEmail } from "@/lib/resend";
import { ContactEmail } from "@/emails/contact";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(10),
});

export async function submitContactForm(formData: FormData) {
  const data = contactSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });

  await sendEmail({
    to: "support@example.com",
    subject: `Contact Form: ${data.name}`,
    react: ContactEmail(data),
  });

  // Send confirmation to user
  await sendEmail({
    to: data.email,
    subject: "We received your message",
    react: ContactConfirmationEmail({ name: data.name }),
  });

  return { success: true };
}
```

**Gotchas:**
- Resend has rate limits - implement backoff for bulk sends
- Verify your domain for better deliverability
- Monitor bounce rates to maintain sender reputation
- Use dedicated IPs for high-volume sending

### 3. Email Verification Flows

Implement secure email verification for user registration.

**Best Practices:**
- Use cryptographically secure tokens
- Set token expiration (24 hours typical)
- Hash tokens before storing
- Rate limit verification attempts
- Implement re-send with cooldown

**Common Patterns:**

```typescript
// lib/auth/verification.ts
import { db } from "@/lib/db";
import { nanoid } from "nanoid";
import { sha256 } from "@/lib/crypto";

export async function generateVerificationToken(email: string) {
  // Delete any existing tokens for this email
  await db.verificationToken.deleteMany({
    where: { email },
  });

  // Generate new token
  const token = nanoid(32);
  const hashedToken = sha256(token);

  // Store hashed token with expiration
  await db.verificationToken.create({
    data: {
      email,
      token: hashedToken,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });

  return token;
}

export async function verifyEmail(token: string) {
  const hashedToken = sha256(token);

  const verificationToken = await db.verificationToken.findFirst({
    where: {
      token: hashedToken,
      expires: { gt: new Date() },
    },
  });

  if (!verificationToken) {
    return { error: "Invalid or expired token" };
  }

  // Mark user as verified
  await db.user.update({
    where: { email: verificationToken.email },
    data: { emailVerified: new Date() },
  });

  // Delete used token
  await db.verificationToken.delete({
    where: { id: verificationToken.id },
  });

  return { success: true };
}

// API Route for verification
// app/api/verify/route.ts
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/auth/error?error=missing_token", req.url));
  }

  const result = await verifyEmail(token);

  if (result.error) {
    return NextResponse.redirect(new URL("/auth/error?error=invalid_token", req.url));
  }

  return NextResponse.redirect(new URL("/auth/verified", req.url));
}

// Resend verification email
export async function resendVerificationEmail(email: string) {
  const user = await db.user.findUnique({ where: { email } });

  if (!user) {
    // Do not reveal if user exists
    return { success: true };
  }

  if (user.emailVerified) {
    return { error: "Email already verified" };
  }

  // Check rate limit (one email per 60 seconds)
  const recentToken = await db.verificationToken.findFirst({
    where: {
      email,
      createdAt: { gt: new Date(Date.now() - 60 * 1000) },
    },
  });

  if (recentToken) {
    return { error: "Please wait before requesting another email" };
  }

  const token = await generateVerificationToken(email);
  await sendVerificationEmail(user, token);

  return { success: true };
}
```

**Gotchas:**
- Always hash tokens before storing
- Return consistent responses to prevent email enumeration
- Implement proper cleanup of expired tokens
- Consider magic link authentication as alternative

### 4. Webhook Event Processing

Handle Resend webhook events for delivery tracking and analytics.

**Best Practices:**
- Always verify webhook signatures using Svix
- Handle all event types gracefully
- Log events for debugging
- Process webhooks asynchronously
- Implement idempotency

**Common Patterns:**

```typescript
// app/api/webhooks/resend/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { headers } from "next/headers";

const webhookSecret = process.env.RESEND_WEBHOOK_SECRET!;

type EmailEvent = {
  type: "email.sent" | "email.delivered" | "email.opened" |
        "email.clicked" | "email.bounced" | "email.complained";
  data: {
    email_id: string;
    to: string[];
    subject: string;
    created_at: string;
    // Additional fields based on event type
  };
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headerPayload = headers();

  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing required headers" },
      { status: 400 }
    );
  }

  const wh = new Webhook(webhookSecret);
  let event: EmailEvent;

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as EmailEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Process event based on type
  try {
    switch (event.type) {
      case "email.sent":
        await handleEmailSent(event.data);
        break;

      case "email.delivered":
        await handleEmailDelivered(event.data);
        break;

      case "email.opened":
        await handleEmailOpened(event.data);
        break;

      case "email.clicked":
        await handleEmailClicked(event.data);
        break;

      case "email.bounced":
        await handleEmailBounced(event.data);
        break;

      case "email.complained":
        await handleEmailComplained(event.data);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 }
    );
  }
}

// Event handlers
async function handleEmailSent(data: EmailEvent["data"]) {
  await db.emailLog.upsert({
    where: { resendId: data.email_id },
    create: {
      resendId: data.email_id,
      to: data.to[0],
      subject: data.subject,
      status: "sent",
      sentAt: new Date(data.created_at),
    },
    update: {
      status: "sent",
      sentAt: new Date(data.created_at),
    },
  });
}

async function handleEmailDelivered(data: EmailEvent["data"]) {
  await db.emailLog.update({
    where: { resendId: data.email_id },
    data: {
      status: "delivered",
      deliveredAt: new Date(data.created_at),
    },
  });
}

async function handleEmailOpened(data: EmailEvent["data"]) {
  await db.emailLog.update({
    where: { resendId: data.email_id },
    data: {
      status: "opened",
      openedAt: new Date(data.created_at),
      openCount: { increment: 1 },
    },
  });
}

async function handleEmailClicked(data: EmailEvent["data"]) {
  await db.emailLog.update({
    where: { resendId: data.email_id },
    data: {
      clickedAt: new Date(data.created_at),
      clickCount: { increment: 1 },
    },
  });
}

async function handleEmailBounced(data: EmailEvent["data"]) {
  await db.emailLog.update({
    where: { resendId: data.email_id },
    data: {
      status: "bounced",
      bouncedAt: new Date(data.created_at),
    },
  });

  // Mark email as invalid
  await db.user.updateMany({
    where: { email: data.to[0] },
    data: { emailValid: false },
  });
}

async function handleEmailComplained(data: EmailEvent["data"]) {
  await db.emailLog.update({
    where: { resendId: data.email_id },
    data: {
      status: "complained",
      complainedAt: new Date(data.created_at),
    },
  });

  // Unsubscribe user
  await db.user.updateMany({
    where: { email: data.to[0] },
    data: { emailOptOut: true },
  });
}
```

**Gotchas:**
- Webhook secrets are environment-specific
- Events may arrive out of order
- Handle duplicate events (idempotency)
- Resend uses Svix for webhook delivery

### 5. Magic Link Authentication

Implement passwordless authentication with email magic links.

**Best Practices:**
- Use short-lived tokens (15-30 minutes)
- Hash tokens before storing
- Single-use tokens only
- Rate limit requests
- Clear error messages

**Common Patterns:**

```typescript
// lib/auth/magic-link.ts
import { nanoid } from "nanoid";
import { sha256 } from "@/lib/crypto";
import { sendEmail } from "@/lib/resend";
import { MagicLinkEmail } from "@/emails/magic-link";

const TOKEN_EXPIRY = 15 * 60 * 1000; // 15 minutes

export async function sendMagicLink(email: string) {
  // Check rate limit
  const recentRequest = await db.magicLinkToken.findFirst({
    where: {
      email,
      createdAt: { gt: new Date(Date.now() - 60 * 1000) },
    },
  });

  if (recentRequest) {
    return { error: "Please wait before requesting another link" };
  }

  // Generate token
  const token = nanoid(32);
  const hashedToken = sha256(token);

  // Store hashed token
  await db.magicLinkToken.create({
    data: {
      email,
      token: hashedToken,
      expires: new Date(Date.now() + TOKEN_EXPIRY),
    },
  });

  // Send email
  const magicLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Sign in to Your Account",
    react: MagicLinkEmail({ magicLink, expiresIn: "15 minutes" }),
  });

  return { success: true };
}

export async function verifyMagicLink(token: string) {
  const hashedToken = sha256(token);

  const magicLinkToken = await db.magicLinkToken.findFirst({
    where: {
      token: hashedToken,
      expires: { gt: new Date() },
      used: false,
    },
  });

  if (!magicLinkToken) {
    return { error: "Invalid or expired link" };
  }

  // Mark token as used
  await db.magicLinkToken.update({
    where: { id: magicLinkToken.id },
    data: { used: true },
  });

  // Find or create user
  let user = await db.user.findUnique({
    where: { email: magicLinkToken.email },
  });

  if (!user) {
    user = await db.user.create({
      data: {
        email: magicLinkToken.email,
        emailVerified: new Date(),
      },
    });
  }

  // Create session
  const session = await createSession(user.id);

  return { success: true, session };
}

// Magic Link Email Template
// emails/magic-link.tsx
import { Button, Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";

export function MagicLinkEmail({
  magicLink,
  expiresIn,
}: {
  magicLink: string;
  expiresIn: string;
}) {
  return (
    <EmailLayout preview="Sign in to your account">
      <Heading style={heading}>Sign In</Heading>

      <Text style={paragraph}>
        Click the button below to sign in to your account. This link will
        expire in {expiresIn}.
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href={magicLink}>
          Sign In
        </Button>
      </Section>

      <Text style={paragraph}>
        If you did not request this link, you can safely ignore this email.
      </Text>

      <Text style={note}>
        For security, this link can only be used once.
      </Text>
    </EmailLayout>
  );
}
```

### 6. Email Preferences and Unsubscribe

Manage user email preferences and unsubscribe flows.

**Best Practices:**
- One-click unsubscribe support
- Granular preference options
- Confirmation of changes
- List-Unsubscribe header
- Track preference changes

**Common Patterns:**

```typescript
// lib/email/preferences.ts
import { sendEmail } from "@/lib/resend";
import { PreferencesUpdatedEmail } from "@/emails/preferences-updated";

export type EmailPreferences = {
  marketing: boolean;
  product: boolean;
  transactional: boolean; // Usually cannot be disabled
};

export async function getEmailPreferences(userId: string): Promise<EmailPreferences> {
  const prefs = await db.emailPreferences.findUnique({
    where: { userId },
  });

  return {
    marketing: prefs?.marketing ?? true,
    product: prefs?.product ?? true,
    transactional: true, // Always enabled
  };
}

export async function updateEmailPreferences(
  userId: string,
  preferences: Partial<EmailPreferences>
) {
  const updated = await db.emailPreferences.upsert({
    where: { userId },
    create: { userId, ...preferences },
    update: preferences,
  });

  // Log preference change
  await db.emailPreferenceLog.create({
    data: {
      userId,
      changes: preferences,
    },
  });

  return updated;
}

// One-click unsubscribe (RFC 8058)
export async function handleUnsubscribe(email: string, list?: string) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return;

  if (list === "marketing") {
    await updateEmailPreferences(user.id, { marketing: false });
  } else if (list === "product") {
    await updateEmailPreferences(user.id, { product: false });
  } else {
    // Unsubscribe from all non-transactional
    await updateEmailPreferences(user.id, {
      marketing: false,
      product: false,
    });
  }

  // Send confirmation
  await sendEmail({
    to: email,
    subject: "You have been unsubscribed",
    react: PreferencesUpdatedEmail({ preferences: await getEmailPreferences(user.id) }),
  });
}

// Email preferences page
// app/settings/email/page.tsx
"use client";

import { useState } from "react";
import { updatePreferences } from "./actions";

export default function EmailPreferencesPage({
  initialPreferences,
}: {
  initialPreferences: EmailPreferences;
}) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async (key: keyof EmailPreferences) => {
    if (key === "transactional") return; // Cannot disable

    const newValue = !preferences[key];
    setPreferences({ ...preferences, [key]: newValue });

    setIsSaving(true);
    await updatePreferences({ [key]: newValue });
    setIsSaving(false);
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Email Preferences</h1>

      <div className="space-y-4">
        <PreferenceToggle
          label="Marketing Emails"
          description="Product updates, promotions, and newsletters"
          enabled={preferences.marketing}
          onChange={() => handleToggle("marketing")}
        />

        <PreferenceToggle
          label="Product Emails"
          description="Tips, tutorials, and feature announcements"
          enabled={preferences.product}
          onChange={() => handleToggle("product")}
        />

        <PreferenceToggle
          label="Transactional Emails"
          description="Order confirmations, password resets, etc."
          enabled={preferences.transactional}
          disabled
        />
      </div>

      {isSaving && (
        <p className="text-sm text-gray-500 mt-4">Saving...</p>
      )}
    </div>
  );
}
```

## Real-World Examples

### Complete Newsletter System

```typescript
// Newsletter subscription with double opt-in

// 1. Subscribe endpoint
export async function subscribeToNewsletter(email: string) {
  // Check if already subscribed
  const existing = await db.subscriber.findUnique({ where: { email } });
  if (existing?.confirmed) {
    return { error: "Already subscribed" };
  }

  // Create or update subscriber
  const subscriber = await db.subscriber.upsert({
    where: { email },
    create: { email },
    update: { confirmed: false },
  });

  // Generate confirmation token
  const token = await generateNewsletterToken(subscriber.id);

  // Send confirmation email
  await sendEmail({
    to: email,
    subject: "Confirm your newsletter subscription",
    react: NewsletterConfirmEmail({
      confirmUrl: `${process.env.NEXT_PUBLIC_APP_URL}/newsletter/confirm?token=${token}`,
    }),
  });

  return { success: true };
}

// 2. Confirm subscription
export async function confirmSubscription(token: string) {
  const subscriber = await verifyNewsletterToken(token);
  if (!subscriber) {
    return { error: "Invalid token" };
  }

  await db.subscriber.update({
    where: { id: subscriber.id },
    data: { confirmed: true, confirmedAt: new Date() },
  });

  return { success: true };
}

// 3. Send newsletter to all subscribers
export async function sendNewsletter(newsletterId: string) {
  const newsletter = await db.newsletter.findUnique({
    where: { id: newsletterId },
  });

  const subscribers = await db.subscriber.findMany({
    where: { confirmed: true, unsubscribed: false },
  });

  // Batch send
  const batches = chunk(subscribers, 100);

  for (const batch of batches) {
    await sendBatchEmails(
      batch.map((subscriber) => ({
        to: subscriber.email,
        subject: newsletter.subject,
        react: NewsletterEmail({
          content: newsletter.content,
          unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/newsletter/unsubscribe?email=${subscriber.email}`,
        }),
      }))
    );
  }
}
```

## Related Skills

- `nextjs-app-router-mastery` - Server Actions for email sending
- `authentication-expert` - Email-based authentication
- `stripe-payments` - Payment receipt emails
- `database-prisma` - Storing email logs

## Further Reading

- [React Email Documentation](https://react.email) - Component library
- [Resend Documentation](https://resend.com/docs) - Email API
- [Email Design Guide](https://www.caniemail.com) - CSS support checker
- [MJML](https://mjml.io) - Alternative email framework

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
*Master email communication for modern applications*

## Real-World Examples

### Example: Complete Newsletter System

```typescript
// Newsletter subscription with double opt-in

// 1. Subscribe endpoint
export async function subscribeToNewsletter(email: string) {
  // Check if already subscribed
  const existing = await db.subscriber.findUnique({ where: { email } });
  if (existing?.confirmed) {
    return { error: "Already subscribed" };
  }

  // Create or update subscriber
  const subscriber = await db.subscriber.upsert({
    where: { email },
    create: { email },
    update: { confirmed: false },
  });

  // Generate confirmation token
  const token = await generateNewsletterToken(subscriber.id);

  // Send confirmation email
  await sendEmail({
    to: email,
    subject: "Confirm your newsletter subscription",
    react: NewsletterConfirmEmail({
      confirmUrl: `${process.env.NEXT_PUBLIC_APP_URL}/newsletter/confirm?token=${token}`,
    }),
  });

  return { success: true };
}

// 2. Confirm subscription
export async function confirmSubscription(token: string) {
  const subscriber = await verifyNewsletterToken(token);
  if (!subscriber) {
    return { error: "Invalid token" };
  }

  await db.subscriber.update({
    where: { id: subscriber.id },
    data: { confirmed: true, confirmedAt: new Date() },
  });

  return { success: true };
}

// 3. Send newsletter to all subscribers
export async function sendNewsletter(newsletterId: string) {
  const newsletter = await db.newsletter.findUnique({
    where: { id: newsletterId },
  });

  const subscribers = await db.subscriber.findMany({
    where: { confirmed: true, unsubscribed: false },
  });

  // Batch send
  const batches = chunk(subscribers, 100);

  for (const batch of batches) {
    await sendBatchEmails(
      batch.map((subscriber) => ({
        to: subscriber.email,
        subject: newsletter.subject,
        react: NewsletterEmail({
          content: newsletter.content,
          unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/newsletter/unsubscribe?email=${subscriber.email}`,
        }),
      }))
    );
  }
}
```

## Related Skills

- `nextjs-app-router-mastery` - Server Actions for email sending
- `authentication-expert` - Email-based authentication
- `stripe-payments` - Payment receipt emails
- `database-prisma` - Storing email logs

## Further Reading

- [React Email Documentation](https://react.email) - Component library
- [Resend Documentation](https://resend.com/docs) - Email API
- [Email Design Guide](https://www.caniemail.com) - CSS support checker
- [MJML](https://mjml.io) - Alternative email framework

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
*Master email communication for modern applications*
