#!/usr/bin/env python3
"""Write remaining skill definitions."""

import os

SKILLS_DIR = os.path.dirname(os.path.abspath(__file__))

def write_stripe_payments():
    content = r'''# Stripe Payments Expert

> **ID:** `stripe-payments`
> **Tier:** 2
> **Token Cost:** 8000
> **MCP Connections:** stripe

## What This Skill Does

- Integrate Stripe Checkout for one-time and subscription payments
- Build subscription management with billing portals
- Handle webhooks securely for payment events
- Implement Strong Customer Authentication (SCA/3D Secure)
- Create custom payment forms with Stripe Elements
- Manage products, prices, and coupons
- Handle refunds and disputes
- Implement metered billing

## When to Use

This skill is automatically loaded when:

- **Keywords:** stripe, payment, checkout, subscription, billing, invoice, webhook, sca
- **File Types:** N/A
- **Directories:** payments/, billing/, stripe/

## Core Capabilities

### 1. Stripe Checkout Integration

Implement Stripe hosted checkout for quick, secure payment flows.

**Best Practices:**
- Use Stripe Checkout for fastest integration
- Always verify webhook signatures
- Store Stripe customer IDs in your database
- Use idempotency keys for API calls
- Test with Stripe CLI in development

**Common Patterns:**

```typescript
// lib/stripe.ts - Stripe Client Setup
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
  typescript: true,
});

// One-Time Payment Checkout Session
// app/api/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { priceId, quantity = 1 } = await req.json();

    // Get or create Stripe customer
    let customerId = session.user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email!,
        metadata: {
          userId: session.user.id,
        },
      });
      customerId = customer.id;
      // Save customer ID to database
      await db.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancelled`,
      metadata: {
        userId: session.user.id,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

// Client Component for Checkout
"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function CheckoutButton({
  priceId,
  children,
}: {
  priceId: string;
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const { url, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error("Checkout error:", error);
      // Show error toast
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={isLoading}
      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
    >
      {isLoading ? "Processing..." : children}
    </button>
  );
}
```

**Gotchas:**
- Checkout sessions expire after 24 hours
- Always use HTTPS in production for webhooks
- Test with Stripe test mode keys before going live
- Handle webhook failures gracefully with retry logic

### 2. Subscription Management

Build complete subscription flows with upgrades, downgrades, and cancellations.

**Best Practices:**
- Use Stripe Customer Portal for self-service
- Implement proper proration for plan changes
- Handle subscription lifecycle events via webhooks
- Store subscription status locally for faster access
- Implement grace periods for failed payments

**Common Patterns:**

```typescript
// Subscription Checkout
export async function POST(req: NextRequest) {
  const session = await auth();
  const { priceId } = await req.json();

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: session.user.stripeCustomerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    subscription_data: {
      trial_period_days: 14, // Optional trial
      metadata: {
        userId: session.user.id,
      },
    },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: checkoutSession.url });
}

// Customer Portal for Self-Service
// app/api/billing/portal/route.ts
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.stripeCustomerId) {
    return NextResponse.json({ error: "No subscription found" }, { status: 400 });
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: session.user.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });

  return NextResponse.json({ url: portalSession.url });
}

// Subscription Status Check
// lib/subscription.ts
export async function getUserSubscription(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });

  if (!user?.subscription) {
    return { status: "none", plan: null };
  }

  // Check if subscription is active
  const isActive =
    user.subscription.status === "active" ||
    user.subscription.status === "trialing";

  return {
    status: user.subscription.status,
    plan: user.subscription.planId,
    currentPeriodEnd: user.subscription.currentPeriodEnd,
    cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
    isActive,
  };
}

// Usage in Server Component
async function DashboardPage() {
  const session = await auth();
  const subscription = await getUserSubscription(session.user.id);

  if (!subscription.isActive) {
    redirect("/pricing");
  }

  return <Dashboard />;
}

// Change Subscription Plan
export async function changeSubscription(
  subscriptionId: string,
  newPriceId: string
) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    proration_behavior: "create_prorations",
  });
}

// Cancel Subscription
export async function cancelSubscription(subscriptionId: string) {
  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

// Resume Cancelled Subscription
export async function resumeSubscription(subscriptionId: string) {
  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}
```

**Gotchas:**
- Subscriptions can have multiple items (be careful when updating)
- Proration can be confusing - test thoroughly
- Trials do not require payment method upfront by default
- Webhook events may arrive out of order

### 3. Webhook Handling

Securely process Stripe webhook events for payment lifecycle.

**Best Practices:**
- Always verify webhook signatures
- Use raw body for signature verification
- Implement idempotency for webhook processing
- Return 200 quickly, process async if needed
- Log all webhook events for debugging

**Common Patterns:**

```typescript
// app/api/webhooks/stripe/route.ts
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancelled(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoiceFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

// Webhook Handlers
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) return;

  if (session.mode === "subscription") {
    // Subscription created via checkout
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );
    await handleSubscriptionChange(subscription);
  } else {
    // One-time payment
    await db.purchase.create({
      data: {
        userId,
        stripeSessionId: session.id,
        amount: session.amount_total!,
        currency: session.currency!,
        status: "completed",
      },
    });
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const user = await db.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) return;

  await db.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    create: {
      userId: user.id,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      stripePriceId: subscription.items.data[0].price.id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    update: {
      stripePriceId: subscription.items.data[0].price.id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  await db.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: { status: "canceled" },
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Send receipt email, update usage records, etc.
  console.log("Invoice paid:", invoice.id);
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  // Send dunning email, notify user
  const customerId = invoice.customer as string;
  const user = await db.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (user) {
    await sendEmail({
      to: user.email,
      subject: "Payment Failed",
      template: "payment-failed",
      data: { invoiceUrl: invoice.hosted_invoice_url },
    });
  }
}
```

**Gotchas:**
- Webhook secret is different for each endpoint
- Use `req.text()` not `req.json()` for raw body
- Events may be duplicated - implement idempotency
- Test with `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### 4. Stripe Elements (Custom Payment Form)

Build custom, PCI-compliant payment forms with Stripe Elements.

**Best Practices:**
- Use Elements for custom UI requirements
- Handle all error states gracefully
- Show loading states during payment processing
- Support wallet payments (Apple Pay, Google Pay)
- Test with Stripe test cards

**Common Patterns:**

```tsx
// components/payment-form.tsx
"use client";

import { useState } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentFormProps {
  clientSecret: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function PaymentFormInner({ clientSecret, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/complete`,
      },
      redirect: "if_required",
    });

    if (error) {
      setErrorMessage(error.message ?? "Payment failed");
      onError(error.message ?? "Payment failed");
      setIsProcessing(false);
    } else if (paymentIntent?.status === "succeeded") {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: "tabs",
          paymentMethodOrder: ["card", "apple_pay", "google_pay"],
        }}
      />

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? "Processing..." : "Pay Now"}
      </button>
    </form>
  );
}

export function PaymentForm(props: PaymentFormProps) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: props.clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#2563eb",
            colorBackground: "#ffffff",
            colorText: "#1f2937",
            colorDanger: "#dc2626",
            fontFamily: "Inter, system-ui, sans-serif",
            borderRadius: "8px",
          },
        },
      }}
    >
      <PaymentFormInner {...props} />
    </Elements>
  );
}

// Create Payment Intent API
// app/api/payment-intent/route.ts
export async function POST(req: NextRequest) {
  const { amount, currency = "usd" } = await req.json();

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // Convert to cents
    currency,
    automatic_payment_methods: { enabled: true },
  });

  return NextResponse.json({ clientSecret: paymentIntent.client_secret });
}

// Usage
function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 99 }),
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret));
  }, []);

  if (!clientSecret) return <Loading />;

  return (
    <PaymentForm
      clientSecret={clientSecret}
      onSuccess={() => router.push("/success")}
      onError={(error) => toast.error(error)}
    />
  );
}
```

**Gotchas:**
- PaymentElement requires client secret from PaymentIntent
- Elements must be inside Elements provider
- Handle `requires_action` for 3D Secure
- Test with various test cards for edge cases

## Real-World Examples

### Example: Complete Pricing Page with Subscriptions

```tsx
// app/pricing/page.tsx
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { PricingCard } from "@/components/pricing-card";

export default async function PricingPage() {
  const session = await auth();
  const subscription = session?.user
    ? await getUserSubscription(session.user.id)
    : null;

  // Fetch prices from Stripe
  const prices = await stripe.prices.list({
    active: true,
    type: "recurring",
    expand: ["data.product"],
  });

  const plans = prices.data.map((price) => ({
    id: price.id,
    name: (price.product as Stripe.Product).name,
    description: (price.product as Stripe.Product).description,
    price: price.unit_amount! / 100,
    interval: price.recurring?.interval,
    features: (price.product as Stripe.Product).metadata.features?.split(",") || [],
  }));

  return (
    <div className="py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold">Simple Pricing</h1>
        <p className="mt-4 text-gray-600">Choose the plan that works for you</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto px-4">
        {plans.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            currentPlan={subscription?.plan}
            isLoggedIn={!!session}
          />
        ))}
      </div>
    </div>
  );
}
```

## Related Skills

- `nextjs-app-router-mastery` - Server Actions for payment flows
- `webhook-handling` - Processing payment events
- `email-resend` - Sending payment receipts
- `database-prisma` - Storing payment data
- `security-expert` - PCI compliance considerations

## Further Reading

- [Stripe Documentation](https://stripe.com/docs) - Official docs
- [Stripe CLI](https://stripe.com/docs/stripe-cli) - Local development
- [Stripe Testing](https://stripe.com/docs/testing) - Test cards and scenarios
- [SCA Guide](https://stripe.com/docs/strong-customer-authentication) - 3D Secure

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
*Master payment integration for SaaS applications*
'''

    filepath = os.path.join(SKILLS_DIR, 'stripe-payments.md')
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    line_count = content.count('\n') + 1
    print(f"stripe-payments.md: {line_count} lines")
    return line_count


def write_email_resend():
    content = r'''# Email Expert (Resend & React Email)

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
'''

    filepath = os.path.join(SKILLS_DIR, 'email-resend.md')
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    line_count = content.count('\n') + 1
    print(f"email-resend.md: {line_count} lines")
    return line_count


def write_file_upload():
    content = r'''# File Upload Expert

> **ID:** `file-upload-expert`
> **Tier:** 3
> **Token Cost:** 5000
> **MCP Connections:** supabase

## What This Skill Does

- Integrate UploadThing for managed file uploads
- Implement S3/R2 direct uploads with presigned URLs
- Optimize images on upload
- Handle video uploads with processing
- Track upload progress
- Build drag-and-drop interfaces
- Validate file types and sizes

## When to Use

This skill is automatically loaded when:

- **Keywords:** upload, file, image, video, s3, uploadthing, dropzone, storage
- **File Types:** N/A
- **Directories:** uploads/, storage/

## Core Capabilities

### 1. UploadThing Integration

Use UploadThing for the simplest file upload experience in Next.js.

**Best Practices:**
- Define file routes with type safety
- Set appropriate file size limits
- Handle upload errors gracefully
- Clean up orphaned files
- Use callbacks for post-upload processing

**Common Patterns:**

```typescript
// lib/uploadthing.ts
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/lib/auth";

const f = createUploadthing();

export const uploadRouter = {
  // Profile image upload
  profileImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Update user profile
      await db.user.update({
        where: { id: metadata.userId },
        data: { avatar: file.url },
      });
      return { url: file.url };
    }),

  // Document upload
  documents: f({
    pdf: { maxFileSize: "16MB", maxFileCount: 10 },
    "application/msword": { maxFileSize: "16MB" },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await db.document.create({
        data: {
          userId: metadata.userId,
          name: file.name,
          url: file.url,
          size: file.size,
        },
      });
    }),

  // Video upload
  video: f({ video: { maxFileSize: "256MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Trigger video processing job
      await processVideoJob.trigger({ fileUrl: file.url, userId: metadata.userId });
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
```

```tsx
// components/upload-button.tsx
"use client";

import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/uploadthing";

export function ProfileImageUpload({
  onUploadComplete,
}: {
  onUploadComplete: (url: string) => void;
}) {
  return (
    <UploadButton<OurFileRouter, "profileImage">
      endpoint="profileImage"
      onClientUploadComplete={(res) => {
        if (res?.[0]) {
          onUploadComplete(res[0].url);
        }
      }}
      onUploadError={(error) => {
        console.error("Upload error:", error);
        toast.error("Upload failed");
      }}
      appearance={{
        button:
          "bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2",
        allowedContent: "text-gray-500 text-sm",
      }}
    />
  );
}

// Dropzone variant
import { UploadDropzone } from "@uploadthing/react";

export function DocumentUploader({
  onUploadComplete,
}: {
  onUploadComplete: (files: { url: string; name: string }[]) => void;
}) {
  return (
    <UploadDropzone<OurFileRouter, "documents">
      endpoint="documents"
      onClientUploadComplete={(res) => {
        onUploadComplete(res.map((r) => ({ url: r.url, name: r.name })));
      }}
      onUploadError={(error) => {
        toast.error(error.message);
      }}
      config={{ mode: "auto" }}
      appearance={{
        container:
          "border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-blue-500 transition-colors",
        uploadIcon: "text-gray-400",
        label: "text-gray-600",
        allowedContent: "text-gray-400 text-sm",
      }}
      content={{
        label: "Drop files here or click to upload",
        allowedContent: "PDF, DOC up to 16MB each",
      }}
    />
  );
}
```

**Gotchas:**
- UploadThing requires server-side route setup
- File URLs are permanent unless explicitly deleted
- Large file uploads need increased timeout
- Use webhook for reliable post-processing

### 2. S3/R2 Direct Uploads

Implement direct uploads to S3 or Cloudflare R2 for maximum control.

**Best Practices:**
- Use presigned URLs for direct uploads
- Set appropriate CORS configuration
- Implement multipart upload for large files
- Clean up incomplete uploads
- Use CDN for serving files

**Common Patterns:**

```typescript
// lib/s3.ts
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// For Cloudflare R2
export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// Generate presigned upload URL
export async function getUploadUrl(
  filename: string,
  contentType: string,
  maxSize: number = 10 * 1024 * 1024 // 10MB default
) {
  const key = `uploads/${Date.now()}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

  return {
    uploadUrl,
    key,
    publicUrl: `${process.env.CDN_URL}/${key}`,
  };
}

// API Route
// app/api/upload/presigned/route.ts
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { filename, contentType, size } = await req.json();

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowedTypes.includes(contentType)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  // Validate size
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (size > maxSize) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  const { uploadUrl, key, publicUrl } = await getUploadUrl(filename, contentType);

  return NextResponse.json({ uploadUrl, key, publicUrl });
}

// Client-side upload
async function uploadToS3(file: File) {
  // Get presigned URL
  const response = await fetch("/api/upload/presigned", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      size: file.size,
    }),
  });

  const { uploadUrl, publicUrl, error } = await response.json();
  if (error) throw new Error(error);

  // Upload directly to S3
  await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  return publicUrl;
}
```

```tsx
// components/s3-uploader.tsx
"use client";

export function S3Uploader({
  onUploadComplete,
  onUploadError,
  accept,
}: {
  onUploadComplete: (url: string) => void;
  onUploadError: (error: Error) => void;
  accept?: string;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setProgress(0);

    try {
      // Get presigned URL
      const response = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
        }),
      });

      const { uploadUrl, publicUrl, error } = await response.json();
      if (error) throw new Error(error);

      // Upload with progress tracking
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.response);
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Upload failed")));

        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      onUploadComplete(publicUrl);
    } catch (error) {
      onUploadError(error as Error);
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        onChange={handleFileChange}
        accept={accept}
        disabled={isUploading}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />

      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

**Gotchas:**
- CORS must be configured on S3/R2 bucket
- Presigned URLs expire - handle errors gracefully
- Large files need multipart upload
- Clean up failed uploads with lifecycle rules

### 3. Image Optimization

Process and optimize images during upload.

**Best Practices:**
- Resize images to appropriate dimensions
- Generate multiple sizes for responsive images
- Convert to modern formats (WebP, AVIF)
- Strip EXIF data for privacy
- Implement lazy loading

**Common Patterns:**

```typescript
// lib/image-processing.ts
import sharp from "sharp";

interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
}

export async function processImage(
  input: Buffer,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: "webp" | "jpeg" | "png" | "avif";
  } = {}
): Promise<ProcessedImage> {
  const { maxWidth = 1920, maxHeight = 1080, quality = 80, format = "webp" } = options;

  const pipeline = sharp(input)
    .rotate() // Auto-rotate based on EXIF
    .resize(maxWidth, maxHeight, {
      fit: "inside",
      withoutEnlargement: true,
    });

  let result: sharp.Sharp;
  switch (format) {
    case "webp":
      result = pipeline.webp({ quality });
      break;
    case "avif":
      result = pipeline.avif({ quality });
      break;
    case "jpeg":
      result = pipeline.jpeg({ quality, progressive: true });
      break;
    default:
      result = pipeline.png({ quality });
  }

  const buffer = await result.toBuffer();
  const metadata = await sharp(buffer).metadata();

  return {
    buffer,
    width: metadata.width!,
    height: metadata.height!,
    format,
  };
}

// Generate responsive image sizes
export async function generateResponsiveImages(
  input: Buffer
): Promise<Map<string, Buffer>> {
  const sizes = [
    { name: "thumbnail", width: 150, height: 150 },
    { name: "small", width: 400, height: 300 },
    { name: "medium", width: 800, height: 600 },
    { name: "large", width: 1200, height: 900 },
  ];

  const results = new Map<string, Buffer>();

  for (const size of sizes) {
    const processed = await sharp(input)
      .resize(size.width, size.height, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: 80 })
      .toBuffer();

    results.set(size.name, processed);
  }

  return results;
}

// API Route for image upload with processing
// app/api/upload/image/route.ts
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Process and generate sizes
  const sizes = await generateResponsiveImages(buffer);

  // Upload all sizes to S3
  const urls: Record<string, string> = {};
  for (const [sizeName, sizeBuffer] of sizes) {
    const key = `images/${Date.now()}-${sizeName}.webp`;
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
        Body: sizeBuffer,
        ContentType: "image/webp",
      })
    );
    urls[sizeName] = `${process.env.CDN_URL}/${key}`;
  }

  return NextResponse.json({ urls });
}
```

**Gotchas:**
- Sharp requires native bindings - may need platform-specific setup
- Process images in background jobs for large uploads
- Memory limits can be hit with many concurrent uploads
- Consider using Cloudflare Images or similar services

### 4. Drag and Drop Interfaces

Build intuitive drag-and-drop upload experiences.

**Best Practices:**
- Show clear drop zones with visual feedback
- Support both drag-and-drop and click-to-upload
- Preview files before upload
- Handle multiple files
- Show upload progress for each file

**Common Patterns:**

```tsx
// components/dropzone.tsx
"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, File, Image, Check } from "lucide-react";

interface FileWithPreview extends File {
  preview?: string;
  uploadProgress?: number;
  uploadStatus?: "pending" | "uploading" | "complete" | "error";
  uploadedUrl?: string;
}

interface DropzoneProps {
  onUploadComplete: (files: { name: string; url: string }[]) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  maxFiles?: number;
}

export function Dropzone({
  onUploadComplete,
  accept = { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
  maxSize = 5 * 1024 * 1024,
  maxFiles = 5,
}: DropzoneProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Add files with preview
      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
          uploadProgress: 0,
          uploadStatus: "pending" as const,
        })
      );

      setFiles((prev) => [...prev, ...newFiles]);

      // Upload each file
      const uploadedFiles: { name: string; url: string }[] = [];

      for (const file of newFiles) {
        try {
          // Update status to uploading
          setFiles((prev) =>
            prev.map((f) =>
              f === file ? { ...f, uploadStatus: "uploading" as const } : f
            )
          );

          // Get presigned URL and upload
          const response = await fetch("/api/upload/presigned", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: file.name,
              contentType: file.type,
              size: file.size,
            }),
          });

          const { uploadUrl, publicUrl } = await response.json();

          // Upload with XMLHttpRequest for progress
          await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                const progress = Math.round((e.loaded / e.total) * 100);
                setFiles((prev) =>
                  prev.map((f) =>
                    f === file ? { ...f, uploadProgress: progress } : f
                  )
                );
              }
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve(null);
              } else {
                reject(new Error("Upload failed"));
              }
            };

            xhr.onerror = () => reject(new Error("Upload failed"));

            xhr.open("PUT", uploadUrl);
            xhr.setRequestHeader("Content-Type", file.type);
            xhr.send(file);
          });

          // Update status to complete
          setFiles((prev) =>
            prev.map((f) =>
              f === file
                ? { ...f, uploadStatus: "complete" as const, uploadedUrl: publicUrl }
                : f
            )
          );

          uploadedFiles.push({ name: file.name, url: publicUrl });
        } catch (error) {
          setFiles((prev) =>
            prev.map((f) =>
              f === file ? { ...f, uploadStatus: "error" as const } : f
            )
          );
        }
      }

      if (uploadedFiles.length > 0) {
        onUploadComplete(uploadedFiles);
      }
    },
    [onUploadComplete]
  );

  const removeFile = (fileToRemove: FileWithPreview) => {
    setFiles((prev) => prev.filter((f) => f !== fileToRemove));
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles,
  });

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
          isDragActive && "border-blue-500 bg-blue-50",
          isDragReject && "border-red-500 bg-red-50",
          !isDragActive && !isDragReject && "border-gray-300 hover:border-gray-400"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="w-10 h-10 mx-auto text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-blue-600">Drop files here...</p>
        ) : (
          <>
            <p className="text-gray-600">Drag & drop files here, or click to select</p>
            <p className="text-sm text-gray-400 mt-2">
              Max {maxFiles} files, up to {Math.round(maxSize / 1024 / 1024)}MB each
            </p>
          </>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
            >
              {/* Preview */}
              {file.preview && file.type.startsWith("image/") ? (
                <img
                  src={file.preview}
                  alt={file.name}
                  className="w-12 h-12 rounded object-cover"
                />
              ) : (
                <File className="w-12 h-12 text-gray-400" />
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>

                {/* Progress bar */}
                {file.uploadStatus === "uploading" && (
                  <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{ width: `${file.uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Status/Actions */}
              {file.uploadStatus === "complete" && (
                <Check className="w-5 h-5 text-green-500" />
              )}
              {file.uploadStatus === "error" && (
                <span className="text-xs text-red-500">Failed</span>
              )}
              <button
                onClick={() => removeFile(file)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Gotchas:**
- Clean up object URLs to prevent memory leaks
- Handle browser compatibility for drag-and-drop
- Mobile devices may not support drag-and-drop
- Large file lists can impact performance

## Related Skills

- `nextjs-app-router-mastery` - Server Actions for uploads
- `react-expert` - React patterns for upload UIs
- `supabase-expert` - Supabase Storage integration
- `image-optimization` - Advanced image processing

## Further Reading

- [UploadThing Documentation](https://uploadthing.com/docs)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
*Master file handling for modern web applications*
'''

    filepath = os.path.join(SKILLS_DIR, 'file-upload-expert.md')
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    line_count = content.count('\n') + 1
    print(f"file-upload-expert.md: {line_count} lines")
    return line_count


def write_resend_email():
    content = r'''# Resend Email Expert

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
'''

    filepath = os.path.join(SKILLS_DIR, 'resend-email.md')
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    line_count = content.count('\n') + 1
    print(f"resend-email.md: {line_count} lines")
    return line_count


if __name__ == "__main__":
    write_stripe_payments()
    write_email_resend()
    write_file_upload()
    write_resend_email()
    print("\nAll remaining skills written!")
