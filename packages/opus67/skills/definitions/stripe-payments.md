# Stripe Payments Expert

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

