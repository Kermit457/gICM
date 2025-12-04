#!/usr/bin/env python3
"""Enhance skills that are below 800 lines."""

import os

def enhance_stripe_payments():
    """Add more content to stripe-payments.md."""

    additional_content = r'''

### 5. Strong Customer Authentication (SCA) & 3D Secure

Handle European payment regulations and additional authentication requirements.

**Best Practices:**
- Enable automatic_payment_methods for SCA support
- Handle `requires_action` status properly
- Implement fallback for 3D Secure failures
- Test with SCA test cards
- Provide clear user messaging during authentication

**Common Patterns:**

```typescript
// Handle SCA with Payment Intents
// app/api/create-payment-intent/route.ts
export async function POST(req: NextRequest) {
  const session = await auth();
  const { amount, currency, paymentMethodId } = await req.json();

  try {
    // Create PaymentIntent with explicit confirmation
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      customer: session.user.stripeCustomerId,
      payment_method: paymentMethodId,
      confirmation_method: "manual",
      confirm: true,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/complete`,
      // Enable automatic payment methods for SCA
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "always",
      },
      metadata: {
        userId: session.user.id,
        orderId: generateOrderId(),
      },
    });

    return handlePaymentIntentResponse(paymentIntent);
  } catch (error) {
    console.error("Payment intent creation failed:", error);
    return NextResponse.json(
      { error: "Payment failed" },
      { status: 500 }
    );
  }
}

function handlePaymentIntentResponse(paymentIntent: Stripe.PaymentIntent) {
  switch (paymentIntent.status) {
    case "succeeded":
      return NextResponse.json({
        success: true,
        paymentIntent: paymentIntent.id,
      });

    case "requires_action":
    case "requires_source_action":
      // 3D Secure required
      return NextResponse.json({
        requiresAction: true,
        clientSecret: paymentIntent.client_secret,
      });

    case "requires_payment_method":
      return NextResponse.json({
        error: "Payment method failed. Please try another card.",
      });

    default:
      return NextResponse.json({
        error: "Unexpected payment status",
      });
  }
}

// Client-side 3D Secure handling
"use client";

export function usePayment() {
  const stripe = useStripe();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async (paymentMethodId: string, amount: number) => {
    if (!stripe) return { error: "Stripe not loaded" };

    setIsProcessing(true);

    try {
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethodId, amount, currency: "eur" }),
      });

      const data = await response.json();

      if (data.success) {
        return { success: true };
      }

      if (data.requiresAction) {
        // Handle 3D Secure authentication
        const { error, paymentIntent } = await stripe.confirmCardPayment(
          data.clientSecret
        );

        if (error) {
          return { error: error.message };
        }

        if (paymentIntent?.status === "succeeded") {
          return { success: true };
        }
      }

      return { error: data.error || "Payment failed" };
    } finally {
      setIsProcessing(false);
    }
  };

  return { handlePayment, isProcessing };
}

// Setup Intent for saving cards (SCA compliant)
export async function createSetupIntent(customerId: string) {
  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ["card"],
    usage: "off_session", // For future charges without customer present
  });

  return setupIntent.client_secret;
}

// Charge saved card off-session (handles SCA)
export async function chargeOffSession(
  customerId: string,
  paymentMethodId: string,
  amount: number
) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "eur",
      customer: customerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
    });

    return { success: true, paymentIntent };
  } catch (error: any) {
    if (error.code === "authentication_required") {
      // SCA required - notify user to authenticate
      return {
        requiresAuthentication: true,
        paymentIntentId: error.payment_intent.id,
      };
    }
    throw error;
  }
}
```

**Gotchas:**
- SCA applies to most European card payments
- Not all cards support 3D Secure
- Off-session payments may require re-authentication
- Test with both SCA-required and SCA-optional test cards

### 6. Products, Prices, and Coupons

Manage your product catalog and pricing in Stripe.

**Best Practices:**
- Use products and prices instead of deprecated plans
- Store product metadata for feature flags
- Use lookup_keys for easier price management
- Create test prices for development
- Implement coupon validation on server

**Common Patterns:**

```typescript
// lib/stripe/products.ts

// Fetch all active products with prices
export async function getProducts() {
  const products = await stripe.products.list({
    active: true,
    expand: ["data.default_price"],
  });

  return products.data.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    features: product.metadata.features?.split(",") || [],
    price: product.default_price as Stripe.Price,
    popular: product.metadata.popular === "true",
  }));
}

// Get price by lookup key (recommended)
export async function getPriceByLookupKey(lookupKey: string) {
  const prices = await stripe.prices.list({
    lookup_keys: [lookupKey],
    expand: ["data.product"],
  });

  return prices.data[0];
}

// Create product with multiple prices
export async function createProductWithPrices(data: {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
}) {
  const product = await stripe.products.create({
    name: data.name,
    description: data.description,
    metadata: {
      features: data.features.join(","),
    },
  });

  // Monthly price
  const monthlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: Math.round(data.monthlyPrice * 100),
    currency: "usd",
    recurring: { interval: "month" },
    lookup_key: `${product.id}_monthly`,
  });

  // Yearly price (with discount)
  const yearlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: Math.round(data.yearlyPrice * 100),
    currency: "usd",
    recurring: { interval: "year" },
    lookup_key: `${product.id}_yearly`,
  });

  return { product, monthlyPrice, yearlyPrice };
}

// Coupon and Promotion Code Management
export async function createCoupon(data: {
  percentOff?: number;
  amountOff?: number;
  duration: "once" | "repeating" | "forever";
  durationInMonths?: number;
  maxRedemptions?: number;
}) {
  const coupon = await stripe.coupons.create({
    percent_off: data.percentOff,
    amount_off: data.amountOff ? data.amountOff * 100 : undefined,
    currency: data.amountOff ? "usd" : undefined,
    duration: data.duration,
    duration_in_months: data.durationInMonths,
    max_redemptions: data.maxRedemptions,
  });

  return coupon;
}

// Create promotion code for coupon
export async function createPromotionCode(couponId: string, code: string) {
  return stripe.promotionCodes.create({
    coupon: couponId,
    code,
    max_redemptions: 100,
    restrictions: {
      first_time_transaction: true,
    },
  });
}

// Validate promotion code
export async function validatePromotionCode(code: string) {
  const promotionCodes = await stripe.promotionCodes.list({
    code,
    active: true,
    expand: ["data.coupon"],
  });

  if (promotionCodes.data.length === 0) {
    return { valid: false, error: "Invalid promotion code" };
  }

  const promo = promotionCodes.data[0];
  const coupon = promo.coupon as Stripe.Coupon;

  return {
    valid: true,
    promoId: promo.id,
    discount: coupon.percent_off
      ? `${coupon.percent_off}% off`
      : `$${(coupon.amount_off || 0) / 100} off`,
  };
}
```

```tsx
// components/pricing-toggle.tsx
"use client";

import { useState } from "react";

interface PricingToggleProps {
  prices: {
    monthly: { id: string; amount: number };
    yearly: { id: string; amount: number };
  };
}

export function PricingToggle({ prices }: PricingToggleProps) {
  const [isYearly, setIsYearly] = useState(false);
  const savings = Math.round(
    ((prices.monthly.amount * 12 - prices.yearly.amount) /
      (prices.monthly.amount * 12)) *
      100
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4 bg-gray-100 dark:bg-gray-800 rounded-full p-1">
        <button
          onClick={() => setIsYearly(false)}
          className={`px-4 py-2 rounded-full transition ${
            !isYearly ? "bg-white dark:bg-gray-700 shadow" : ""
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setIsYearly(true)}
          className={`px-4 py-2 rounded-full transition ${
            isYearly ? "bg-white dark:bg-gray-700 shadow" : ""
          }`}
        >
          Yearly
          <span className="ml-2 text-xs text-green-600 font-semibold">
            Save {savings}%
          </span>
        </button>
      </div>

      <div className="text-center">
        <span className="text-4xl font-bold">
          ${isYearly ? prices.yearly.amount / 100 : prices.monthly.amount / 100}
        </span>
        <span className="text-gray-500">
          /{isYearly ? "year" : "month"}
        </span>
      </div>
    </div>
  );
}
```

**Gotchas:**
- Prices are immutable - create new price to change amount
- Use lookup_keys to reference prices without hardcoding IDs
- Coupons can have restrictions (first-time, specific products, etc.)
- Test coupons thoroughly before sharing publicly

### 7. Metered and Usage-Based Billing

Implement pay-per-use pricing models.

**Best Practices:**
- Use metered billing for API calls, storage, etc.
- Report usage regularly (hourly or daily)
- Implement usage tracking in your application
- Set usage alerts for customers
- Handle usage reporting failures gracefully

**Common Patterns:**

```typescript
// lib/stripe/usage.ts

// Create metered subscription
export async function createMeteredSubscription(customerId: string) {
  // Get metered price
  const price = await stripe.prices.retrieve("price_metered_api_calls");

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: price.id }],
    // Important for metered billing
    billing_cycle_anchor: getStartOfNextMonth(),
  });

  return subscription;
}

// Report usage to Stripe
export async function reportUsage(
  subscriptionItemId: string,
  quantity: number,
  action: "increment" | "set" = "increment"
) {
  const usageRecord = await stripe.subscriptionItems.createUsageRecord(
    subscriptionItemId,
    {
      quantity,
      action,
      timestamp: Math.floor(Date.now() / 1000),
    }
  );

  return usageRecord;
}

// Track and report API usage
interface UsageTracker {
  incrementUsage(userId: string, amount?: number): Promise<void>;
  getUsage(userId: string): Promise<number>;
  syncToStripe(): Promise<void>;
}

class ApiUsageTracker implements UsageTracker {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async incrementUsage(userId: string, amount = 1) {
    const key = `usage:${userId}:${getCurrentPeriod()}`;
    await this.redis.incrby(key, amount);
  }

  async getUsage(userId: string) {
    const key = `usage:${userId}:${getCurrentPeriod()}`;
    return parseInt(await this.redis.get(key) || "0");
  }

  async syncToStripe() {
    // Run hourly via cron job
    const users = await db.user.findMany({
      where: { subscriptionStatus: "active" },
      include: { subscription: true },
    });

    for (const user of users) {
      const usage = await this.getUsage(user.id);
      const lastReported = await this.getLastReported(user.id);

      if (usage > lastReported) {
        await reportUsage(
          user.subscription!.stripeSubscriptionItemId,
          usage - lastReported,
          "increment"
        );
        await this.setLastReported(user.id, usage);
      }
    }
  }
}

// Usage middleware for API routes
export function withUsageTracking(handler: NextHandler) {
  return async (req: NextRequest) => {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check usage limits
    const usage = await usageTracker.getUsage(session.user.id);
    const limit = await getUserLimit(session.user.id);

    if (usage >= limit) {
      return NextResponse.json(
        { error: "Usage limit exceeded. Please upgrade your plan." },
        { status: 429 }
      );
    }

    // Track this request
    await usageTracker.incrementUsage(session.user.id);

    return handler(req);
  };
}

// Usage dashboard component
export async function UsageDashboard({ userId }: { userId: string }) {
  const usage = await usageTracker.getUsage(userId);
  const limit = await getUserLimit(userId);
  const percentage = Math.round((usage / limit) * 100);

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">API Usage This Month</h3>

      <div className="mb-2 flex justify-between text-sm">
        <span>{usage.toLocaleString()} calls</span>
        <span>{limit.toLocaleString()} limit</span>
      </div>

      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${
            percentage > 90
              ? "bg-red-500"
              : percentage > 75
              ? "bg-yellow-500"
              : "bg-green-500"
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {percentage > 75 && (
        <p className="mt-4 text-sm text-yellow-600">
          You are approaching your usage limit.
          <a href="/pricing" className="underline ml-1">
            Upgrade now
          </a>
        </p>
      )}
    </div>
  );
}
```

**Gotchas:**
- Usage records cannot be deleted once created
- Report usage before the billing period ends
- Handle failed usage reports with retry logic
- Customer sees usage on next invoice, not immediately

### 8. Refunds and Disputes

Handle payment reversals and chargebacks professionally.

**Best Practices:**
- Process refunds promptly
- Provide clear refund policies
- Respond to disputes within deadline
- Track refund reasons for analytics
- Implement fraud detection

**Common Patterns:**

```typescript
// lib/stripe/refunds.ts

// Process full refund
export async function processFullRefund(
  paymentIntentId: string,
  reason: "requested_by_customer" | "duplicate" | "fraudulent"
) {
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    reason,
  });

  // Log refund
  await db.refund.create({
    data: {
      stripeRefundId: refund.id,
      paymentIntentId,
      amount: refund.amount,
      reason,
      status: refund.status,
    },
  });

  return refund;
}

// Process partial refund
export async function processPartialRefund(
  paymentIntentId: string,
  amount: number,
  reason: string
) {
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: Math.round(amount * 100),
    metadata: { reason },
  });

  return refund;
}

// Handle dispute (chargeback)
// In webhook handler
async function handleDispute(dispute: Stripe.Dispute) {
  const paymentIntent = dispute.payment_intent as string;

  // Log dispute
  await db.dispute.create({
    data: {
      stripeDisputeId: dispute.id,
      paymentIntentId: paymentIntent,
      amount: dispute.amount,
      reason: dispute.reason,
      status: dispute.status,
      evidenceDueBy: new Date(dispute.evidence_details.due_by * 1000),
    },
  });

  // Notify team
  await sendSlackAlert({
    channel: "#payments",
    text: `New dispute: ${dispute.id} for $${dispute.amount / 100}. Reason: ${dispute.reason}`,
  });

  // Gather evidence automatically
  const evidence = await gatherDisputeEvidence(paymentIntent);

  // Submit if we have enough evidence
  if (evidence.complete) {
    await stripe.disputes.update(dispute.id, {
      evidence: {
        customer_name: evidence.customerName,
        customer_email_address: evidence.customerEmail,
        product_description: evidence.productDescription,
        service_documentation: evidence.serviceDocumentation,
        // ... other evidence fields
      },
      submit: true,
    });
  }
}

// Fraud detection
export async function checkForFraud(paymentIntent: Stripe.PaymentIntent) {
  const charge = paymentIntent.latest_charge as Stripe.Charge;

  const riskScore = charge.outcome?.risk_score || 0;
  const riskLevel = charge.outcome?.risk_level;

  if (riskLevel === "highest" || riskScore > 80) {
    // Flag for manual review
    await db.paymentReview.create({
      data: {
        paymentIntentId: paymentIntent.id,
        riskScore,
        riskLevel,
        status: "pending_review",
      },
    });

    // Optionally refund immediately
    if (riskScore > 95) {
      await processFullRefund(paymentIntent.id, "fraudulent");
      return { blocked: true, reason: "high_fraud_risk" };
    }
  }

  return { blocked: false };
}
```

**Gotchas:**
- Disputes have strict evidence deadlines
- Too many disputes can get your account suspended
- Refunds take 5-10 days to appear on customer statement
- Stripe fees are not returned on refunds

## Advanced Patterns

### Complete Order Flow with Stripe

```typescript
// Complete e-commerce checkout flow

// 1. Cart API
// app/api/cart/route.ts
export async function POST(req: NextRequest) {
  const session = await auth();
  const { items } = await req.json();

  // Calculate total with tax
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = await calculateTax(subtotal, session?.user?.address);
  const total = subtotal + tax;

  // Create or update checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: session?.user?.stripeCustomerId,
    mode: "payment",
    line_items: items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          images: [item.image],
          metadata: { productId: item.id },
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    })),
    automatic_tax: { enabled: true },
    shipping_address_collection: {
      allowed_countries: ["US", "CA", "GB", "DE", "FR"],
    },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: 500, currency: "usd" },
          display_name: "Standard Shipping",
          delivery_estimate: {
            minimum: { unit: "business_day", value: 5 },
            maximum: { unit: "business_day", value: 7 },
          },
        },
      },
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: 1500, currency: "usd" },
          display_name: "Express Shipping",
          delivery_estimate: {
            minimum: { unit: "business_day", value: 1 },
            maximum: { unit: "business_day", value: 2 },
          },
        },
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders/{CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
    metadata: {
      userId: session?.user?.id || "guest",
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}

// 2. Webhook handler creates order
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

  const order = await db.order.create({
    data: {
      stripeSessionId: session.id,
      userId: session.metadata?.userId,
      email: session.customer_details?.email!,
      total: session.amount_total! / 100,
      currency: session.currency!,
      shippingAddress: session.shipping_details?.address,
      status: "confirmed",
      items: {
        create: lineItems.data.map((item) => ({
          productId: item.price?.product_data?.metadata?.productId,
          name: item.description,
          quantity: item.quantity!,
          price: item.amount_total! / 100,
        })),
      },
    },
  });

  // Send confirmation email
  await sendOrderConfirmation(order);

  // Update inventory
  await updateInventory(order.items);

  return order;
}

// 3. Order success page
// app/orders/[sessionId]/page.tsx
export default async function OrderSuccessPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const order = await db.order.findUnique({
    where: { stripeSessionId: params.sessionId },
    include: { items: true },
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckIcon className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold">Order Confirmed!</h1>
        <p className="text-gray-600 mt-2">
          Thank you for your order. We have sent a confirmation to {order.email}.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="font-semibold mb-4">Order Details</h2>
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between py-2 border-b">
            <span>
              {item.name} x {item.quantity}
            </span>
            <span>${item.price.toFixed(2)}</span>
          </div>
        ))}
        <div className="flex justify-between py-2 font-bold">
          <span>Total</span>
          <span>${order.total.toFixed(2)}</span>
        </div>
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
- [Stripe Billing](https://stripe.com/docs/billing) - Subscription management
- [Stripe Connect](https://stripe.com/docs/connect) - Marketplace payments

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
*Master payment integration for SaaS applications*
'''

    # Read existing content (first 705 lines without the footer)
    skill_path = "C:/Users/mirko/OneDrive/Desktop/gICM/packages/opus67/skills/definitions/stripe-payments.md"
    with open(skill_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find where to insert (before "Related Skills")
    insert_point = content.find("## Real-World Examples")
    if insert_point != -1:
        # Insert after Real-World Examples section
        examples_end = content.find("## Related Skills")
        if examples_end != -1:
            new_content = content[:examples_end] + additional_content.strip() + "\n\n"
        else:
            new_content = content.rstrip() + "\n\n" + additional_content.strip()
    else:
        new_content = content.rstrip() + "\n\n" + additional_content.strip()

    with open(skill_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

    line_count = len(new_content.split('\n'))
    print(f"stripe-payments.md: {line_count} lines")
    return line_count


def enhance_resend_email():
    """Add more content to resend-email.md."""

    additional_content = r'''

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
'''

    skill_path = "C:/Users/mirko/OneDrive/Desktop/gICM/packages/opus67/skills/definitions/resend-email.md"
    with open(skill_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the "Real-World Examples" section and insert before it
    insert_point = content.find("## Real-World Examples")
    if insert_point != -1:
        new_content = content[:insert_point] + additional_content.strip() + "\n\n" + content[insert_point:]
    else:
        # If no Real-World Examples, find Related Skills
        insert_point = content.find("## Related Skills")
        if insert_point != -1:
            new_content = content[:insert_point] + additional_content.strip() + "\n\n" + content[insert_point:]
        else:
            new_content = content.rstrip() + "\n\n" + additional_content.strip()

    with open(skill_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

    line_count = len(new_content.split('\n'))
    print(f"resend-email.md: {line_count} lines")
    return line_count


def enhance_email_resend():
    """Add more content to email-resend.md."""

    additional_content = r'''

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
'''

    skill_path = "C:/Users/mirko/OneDrive/Desktop/gICM/packages/opus67/skills/definitions/email-resend.md"
    with open(skill_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the "Real-World Examples" section and insert before it
    insert_point = content.find("## Real-World Examples")
    if insert_point != -1:
        new_content = content[:insert_point] + additional_content.strip() + "\n\n" + content[insert_point:]
    else:
        # If no Real-World Examples, find Related Skills
        insert_point = content.find("## Related Skills")
        if insert_point != -1:
            new_content = content[:insert_point] + additional_content.strip() + "\n\n" + content[insert_point:]
        else:
            new_content = content.rstrip() + "\n\n" + additional_content.strip()

    with open(skill_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

    line_count = len(new_content.split('\n'))
    print(f"email-resend.md: {line_count} lines")
    return line_count


if __name__ == "__main__":
    print("Enhancing skills below 800 lines...")
    print()

    enhance_stripe_payments()
    enhance_resend_email()
    enhance_email_resend()

    print()
    print("All enhancements complete!")
