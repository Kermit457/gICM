# Analytics & Tracking Expert

> **ID:** `analytics-tracking`
> **Tier:** 3
> **Token Cost:** 4000
> **MCP Connections:** None

## What This Skill Does

Implement comprehensive analytics and user tracking for web applications. Master event tracking, funnel analysis, A/B testing, and session recording with privacy-first approaches.

- PostHog integration and event tracking
- Mixpanel analytics setup
- Vercel Analytics and Web Vitals
- Custom event tracking architecture
- Funnel analysis and conversion tracking
- A/B testing implementation
- Session recording and heatmaps
- GDPR-compliant tracking
- Server-side analytics
- Attribution and UTM tracking

## When to Use

This skill is automatically loaded when:

- **Keywords:** analytics, tracking, posthog, mixpanel, events, funnel, a/b test
- **File Types:** analytics.ts, tracking.ts
- **Directories:** /analytics, /tracking

## Core Capabilities

### 1. PostHog Integration

Set up PostHog for product analytics.

**PostHog Client Setup:**

```typescript
// src/lib/analytics/posthog.ts
import posthog from 'posthog-js';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY!;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

// Initialize PostHog
export function initPostHog() {
  if (typeof window === 'undefined') return;
  if (posthog.__loaded) return;
  
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    
    // Capture settings
    autocapture: true,
    capture_pageview: false, // Manual for Next.js
    capture_pageleave: true,
    
    // Privacy settings
    disable_session_recording: false,
    mask_all_text: false,
    mask_all_element_attributes: false,
    
    // Performance
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') {
        posthog.debug();
      }
    },
    
    // Persistence
    persistence: 'localStorage+cookie',
    
    // Feature flags
    bootstrap: {
      featureFlags: {},
    },
  });
}

// Identify user
export function identifyUser(userId: string, properties?: Record<string, any>) {
  posthog.identify(userId, properties);
}

// Track event
export function trackEvent(event: string, properties?: Record<string, any>) {
  posthog.capture(event, properties);
}

// Track page view
export function trackPageView(url?: string) {
  posthog.capture('$pageview', {
    $current_url: url || window.location.href,
  });
}

// Reset on logout
export function resetUser() {
  posthog.reset();
}

// Feature flags
export function isFeatureEnabled(flag: string): boolean {
  return posthog.isFeatureEnabled(flag) || false;
}

export function getFeatureFlag(flag: string): string | boolean | undefined {
  return posthog.getFeatureFlag(flag);
}

// Group analytics
export function setGroup(groupType: string, groupKey: string, properties?: Record<string, any>) {
  posthog.group(groupType, groupKey, properties);
}

export { posthog };
```

**Next.js PostHog Provider:**

```typescript
// src/components/providers/posthog-provider.tsx
'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { initPostHog, trackPageView, identifyUser } from '@/lib/analytics/posthog';
import { useUser } from '@/hooks/useUser';

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url += '?' + searchParams.toString();
      }
      trackPageView(url);
    }
  }, [pathname, searchParams]);
  
  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  
  useEffect(() => {
    initPostHog();
  }, []);
  
  useEffect(() => {
    if (user?.id) {
      identifyUser(user.id, {
        email: user.email,
        name: user.name,
        plan: user.plan,
        createdAt: user.createdAt,
      });
    }
  }, [user]);
  
  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </>
  );
}
```

**PostHog Event Types:**

```typescript
// src/lib/analytics/events.ts
import { trackEvent, setGroup } from './posthog';

// Type-safe event tracking
type AnalyticsEvent =
  | { name: 'signup_started'; properties: { source: string } }
  | { name: 'signup_completed'; properties: { method: 'email' | 'google' | 'github' } }
  | { name: 'feature_used'; properties: { feature: string; context?: string } }
  | { name: 'plan_selected'; properties: { plan: string; billing: 'monthly' | 'yearly' } }
  | { name: 'checkout_started'; properties: { plan: string; value: number } }
  | { name: 'checkout_completed'; properties: { plan: string; value: number; currency: string } }
  | { name: 'error_occurred'; properties: { error: string; context: string } };

export function track<T extends AnalyticsEvent>(event: T['name'], properties: T['properties']) {
  trackEvent(event, properties);
}

// Convenience methods
export const analytics = {
  signupStarted: (source: string) => track('signup_started', { source }),
  
  signupCompleted: (method: 'email' | 'google' | 'github') =>
    track('signup_completed', { method }),
  
  featureUsed: (feature: string, context?: string) =>
    track('feature_used', { feature, context }),
  
  planSelected: (plan: string, billing: 'monthly' | 'yearly') =>
    track('plan_selected', { plan, billing }),
  
  checkoutStarted: (plan: string, value: number) =>
    track('checkout_started', { plan, value }),
  
  checkoutCompleted: (plan: string, value: number, currency: string = 'USD') =>
    track('checkout_completed', { plan, value, currency }),
  
  error: (error: string, context: string) =>
    track('error_occurred', { error, context }),
};

// Organization tracking
export function setOrganization(orgId: string, properties?: {
  name?: string;
  plan?: string;
  memberCount?: number;
}) {
  setGroup('organization', orgId, properties);
}
```

**Best Practices:**
- Initialize analytics early in app lifecycle
- Use type-safe event definitions
- Identify users after authentication
- Track both success and failure paths
- Use groups for B2B analytics

**Gotchas:**
- Autocapture can be noisy, tune selectors
- Session recording increases bundle size
- Feature flags need proper caching
- Reset analytics state on logout

### 2. Mixpanel Analytics

Set up Mixpanel for advanced analytics.

**Mixpanel Client:**

```typescript
// src/lib/analytics/mixpanel.ts
import mixpanel, { Dict } from 'mixpanel-browser';

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN!;

export function initMixpanel() {
  if (typeof window === 'undefined') return;
  
  mixpanel.init(MIXPANEL_TOKEN, {
    debug: process.env.NODE_ENV === 'development',
    track_pageview: false,
    persistence: 'localStorage',
    ignore_dnt: false,
    batch_requests: true,
    batch_size: 10,
    batch_flush_interval_ms: 5000,
  });
}

// Identify user
export function identify(userId: string) {
  mixpanel.identify(userId);
}

// Set user properties
export function setUserProperties(properties: Dict) {
  mixpanel.people.set(properties);
}

// Set user properties once (won't overwrite)
export function setUserPropertiesOnce(properties: Dict) {
  mixpanel.people.set_once(properties);
}

// Increment numeric properties
export function incrementProperty(property: string, value: number = 1) {
  mixpanel.people.increment(property, value);
}

// Track event
export function track(event: string, properties?: Dict) {
  mixpanel.track(event, properties);
}

// Track page view
export function trackPageView(pageName: string, properties?: Dict) {
  mixpanel.track('Page Viewed', {
    page_name: pageName,
    ...properties,
  });
}

// Time event (track duration)
export function timeEvent(eventName: string) {
  mixpanel.time_event(eventName);
}

// Register super properties (sent with every event)
export function registerSuperProperties(properties: Dict) {
  mixpanel.register(properties);
}

// Reset on logout
export function reset() {
  mixpanel.reset();
}

// Alias for linking anonymous to identified user
export function alias(newId: string) {
  mixpanel.alias(newId);
}
```

**Mixpanel React Hook:**

```typescript
// src/hooks/useMixpanel.ts
import { useCallback } from 'react';
import * as mp from '@/lib/analytics/mixpanel';

export function useMixpanel() {
  const trackButtonClick = useCallback((buttonName: string, context?: Record<string, any>) => {
    mp.track('Button Clicked', {
      button_name: buttonName,
      ...context,
    });
  }, []);
  
  const trackFormSubmit = useCallback((formName: string, success: boolean, context?: Record<string, any>) => {
    mp.track('Form Submitted', {
      form_name: formName,
      success,
      ...context,
    });
  }, []);
  
  const trackFeatureUsage = useCallback((feature: string, action: string, context?: Record<string, any>) => {
    mp.track('Feature Used', {
      feature,
      action,
      ...context,
    });
  }, []);
  
  return {
    track: mp.track,
    trackButtonClick,
    trackFormSubmit,
    trackFeatureUsage,
    timeEvent: mp.timeEvent,
    identify: mp.identify,
    setUserProperties: mp.setUserProperties,
  };
}
```

**Best Practices:**
- Use super properties for common context
- Time long-running user flows
- Set user properties progressively
- Use distinct_id consistently
- Batch requests for performance

**Gotchas:**
- Alias should only be called once per user
- Super properties persist in storage
- Event names should be consistent
- Property names have character limits

### 3. Vercel Analytics

Integrate Vercel Analytics and Web Vitals.

**Vercel Analytics Setup:**

```typescript
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

**Custom Web Vitals Tracking:**

```typescript
// src/lib/analytics/web-vitals.ts
import { onCLS, onFID, onLCP, onFCP, onTTFB, onINP, Metric } from 'web-vitals';

type VitalsMetric = {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
};

function sendToAnalytics(metric: VitalsMetric) {
  // Send to your analytics provider
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    page: window.location.pathname,
  });
  
  // Use sendBeacon for reliability
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/vitals', body);
  } else {
    fetch('/api/analytics/vitals', {
      body,
      method: 'POST',
      keepalive: true,
    });
  }
}

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds: Record<string, [number, number]> = {
    CLS: [0.1, 0.25],
    FID: [100, 300],
    LCP: [2500, 4000],
    FCP: [1800, 3000],
    TTFB: [800, 1800],
    INP: [200, 500],
  };
  
  const [good, poor] = thresholds[name] || [0, 0];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

function handleMetric(metric: Metric) {
  sendToAnalytics({
    name: metric.name,
    value: metric.value,
    rating: getRating(metric.name, metric.value),
    delta: metric.delta,
    id: metric.id,
  });
}

export function initWebVitals() {
  onCLS(handleMetric);
  onFID(handleMetric);
  onLCP(handleMetric);
  onFCP(handleMetric);
  onTTFB(handleMetric);
  onINP(handleMetric);
}
```

**API Route for Vitals:**

```typescript
// src/app/api/analytics/vitals/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const data = await request.json();
  
  // Log to your monitoring service
  console.log('Web Vital:', data);
  
  // Send to your analytics backend
  await fetch(process.env.ANALYTICS_ENDPOINT!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'web-vital',
      ...data,
      timestamp: Date.now(),
    }),
  });
  
  return NextResponse.json({ received: true });
}
```

**Best Practices:**
- Track all Core Web Vitals
- Use sendBeacon for reliability
- Include page context with metrics
- Set up alerts for performance regressions
- Compare metrics across pages

**Gotchas:**
- Web Vitals fire asynchronously
- FID only fires on user interaction
- CLS can change throughout page lifecycle
- Some metrics not available in all browsers

### 4. Custom Event Architecture

Build a flexible event tracking system.

**Event Schema:**

```typescript
// src/lib/analytics/schema.ts
import { z } from 'zod';

// Base event schema
const BaseEventSchema = z.object({
  timestamp: z.number(),
  sessionId: z.string(),
  userId: z.string().optional(),
  pageUrl: z.string(),
  userAgent: z.string(),
});

// Event types
const PageViewEventSchema = BaseEventSchema.extend({
  type: z.literal('page_view'),
  properties: z.object({
    title: z.string(),
    referrer: z.string().optional(),
    duration: z.number().optional(),
  }),
});

const ClickEventSchema = BaseEventSchema.extend({
  type: z.literal('click'),
  properties: z.object({
    element: z.string(),
    elementId: z.string().optional(),
    elementText: z.string().optional(),
    href: z.string().optional(),
  }),
});

const FormEventSchema = BaseEventSchema.extend({
  type: z.literal('form'),
  properties: z.object({
    formName: z.string(),
    action: z.enum(['start', 'field_focus', 'field_blur', 'submit', 'error']),
    fieldName: z.string().optional(),
    success: z.boolean().optional(),
    errorMessage: z.string().optional(),
  }),
});

const CustomEventSchema = BaseEventSchema.extend({
  type: z.literal('custom'),
  name: z.string(),
  properties: z.record(z.unknown()),
});

export const AnalyticsEventSchema = z.discriminatedUnion('type', [
  PageViewEventSchema,
  ClickEventSchema,
  FormEventSchema,
  CustomEventSchema,
]);

export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;
```

**Event Collector:**

```typescript
// src/lib/analytics/collector.ts
import { AnalyticsEvent, AnalyticsEventSchema } from './schema';

class EventCollector {
  private queue: AnalyticsEvent[] = [];
  private sessionId: string;
  private flushInterval: number = 5000;
  private maxQueueSize: number = 100;
  private endpoint: string;
  
  constructor(endpoint: string) {
    this.endpoint = endpoint;
    this.sessionId = this.getOrCreateSessionId();
    this.startFlushInterval();
    this.setupBeforeUnload();
  }
  
  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }
  
  private getBaseProperties() {
    return {
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.getUserId(),
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
    };
  }
  
  private getUserId(): string | undefined {
    return localStorage.getItem('user_id') || undefined;
  }
  
  track(event: Omit<AnalyticsEvent, keyof ReturnType<typeof this.getBaseProperties>>) {
    const fullEvent = {
      ...this.getBaseProperties(),
      ...event,
    } as AnalyticsEvent;
    
    // Validate event
    const result = AnalyticsEventSchema.safeParse(fullEvent);
    if (!result.success) {
      console.warn('Invalid analytics event:', result.error);
      return;
    }
    
    this.queue.push(result.data);
    
    if (this.queue.length >= this.maxQueueSize) {
      this.flush();
    }
  }
  
  private startFlushInterval() {
    setInterval(() => this.flush(), this.flushInterval);
  }
  
  private setupBeforeUnload() {
    window.addEventListener('beforeunload', () => {
      this.flush(true);
    });
  }
  
  async flush(sync: boolean = false) {
    if (this.queue.length === 0) return;
    
    const events = [...this.queue];
    this.queue = [];
    
    const body = JSON.stringify({ events });
    
    if (sync && navigator.sendBeacon) {
      navigator.sendBeacon(this.endpoint, body);
    } else {
      try {
        await fetch(this.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        });
      } catch (error) {
        // Re-queue on failure
        this.queue.unshift(...events);
        console.error('Failed to send analytics:', error);
      }
    }
  }
  
  setUserId(userId: string) {
    localStorage.setItem('user_id', userId);
  }
  
  clearUserId() {
    localStorage.removeItem('user_id');
  }
}

export const collector = new EventCollector('/api/analytics/collect');
```

**Best Practices:**
- Validate events with schema before sending
- Batch events for efficiency
- Use sendBeacon on page unload
- Include session context with every event
- Handle network failures gracefully

**Gotchas:**
- sendBeacon has size limits (64KB)
- sessionStorage clears on tab close
- Event queue can grow large offline
- Timestamps should be consistent

### 5. Funnel Analysis

Track conversion funnels.

**Funnel Definition:**

```typescript
// src/lib/analytics/funnels.ts
import { trackEvent } from './posthog';

interface FunnelStep {
  name: string;
  event: string;
  properties?: Record<string, any>;
}

interface Funnel {
  name: string;
  steps: FunnelStep[];
}

// Define funnels
export const funnels: Record<string, Funnel> = {
  signup: {
    name: 'Signup Flow',
    steps: [
      { name: 'Landing Page', event: 'landing_page_viewed' },
      { name: 'Signup Started', event: 'signup_started' },
      { name: 'Email Entered', event: 'signup_email_entered' },
      { name: 'Email Verified', event: 'signup_email_verified' },
      { name: 'Profile Created', event: 'signup_profile_created' },
      { name: 'Onboarding Complete', event: 'signup_onboarding_complete' },
    ],
  },
  checkout: {
    name: 'Checkout Flow',
    steps: [
      { name: 'Pricing Page', event: 'pricing_page_viewed' },
      { name: 'Plan Selected', event: 'checkout_plan_selected' },
      { name: 'Checkout Started', event: 'checkout_started' },
      { name: 'Payment Info Entered', event: 'checkout_payment_entered' },
      { name: 'Purchase Complete', event: 'checkout_completed' },
    ],
  },
};

// Funnel tracking
class FunnelTracker {
  private activeFunnels: Map<string, { startedAt: number; currentStep: number }> = new Map();
  
  startFunnel(funnelId: string) {
    this.activeFunnels.set(funnelId, {
      startedAt: Date.now(),
      currentStep: 0,
    });
    
    const funnel = funnels[funnelId];
    if (funnel) {
      trackEvent(`funnel_${funnelId}_started`, {
        funnel_name: funnel.name,
        total_steps: funnel.steps.length,
      });
    }
  }
  
  trackStep(funnelId: string, stepIndex: number, properties?: Record<string, any>) {
    const funnel = funnels[funnelId];
    const active = this.activeFunnels.get(funnelId);
    
    if (!funnel || !active) return;
    
    const step = funnel.steps[stepIndex];
    if (!step) return;
    
    // Track the step event
    trackEvent(step.event, {
      funnel_id: funnelId,
      funnel_name: funnel.name,
      step_index: stepIndex,
      step_name: step.name,
      time_since_start: Date.now() - active.startedAt,
      ...properties,
    });
    
    active.currentStep = stepIndex;
    
    // Check if funnel complete
    if (stepIndex === funnel.steps.length - 1) {
      this.completeFunnel(funnelId);
    }
  }
  
  completeFunnel(funnelId: string) {
    const active = this.activeFunnels.get(funnelId);
    const funnel = funnels[funnelId];
    
    if (!active || !funnel) return;
    
    trackEvent(`funnel_${funnelId}_completed`, {
      funnel_name: funnel.name,
      total_duration: Date.now() - active.startedAt,
      steps_completed: active.currentStep + 1,
    });
    
    this.activeFunnels.delete(funnelId);
  }
  
  abandonFunnel(funnelId: string, reason?: string) {
    const active = this.activeFunnels.get(funnelId);
    const funnel = funnels[funnelId];
    
    if (!active || !funnel) return;
    
    const lastStep = funnel.steps[active.currentStep];
    
    trackEvent(`funnel_${funnelId}_abandoned`, {
      funnel_name: funnel.name,
      abandoned_at_step: active.currentStep,
      abandoned_at_name: lastStep?.name,
      time_in_funnel: Date.now() - active.startedAt,
      reason,
    });
    
    this.activeFunnels.delete(funnelId);
  }
}

export const funnelTracker = new FunnelTracker();
```

**Best Practices:**
- Define clear funnel boundaries
- Track both completion and abandonment
- Include timing information
- Segment funnels by user cohort
- Compare funnel performance over time

**Gotchas:**
- Users may enter funnels at different steps
- Multi-device journeys are hard to track
- Session timeouts affect funnel accuracy
- Funnel definitions should be versioned

### 6. A/B Testing

Implement feature flags and experiments.

**A/B Testing with PostHog:**

```typescript
// src/lib/analytics/experiments.ts
import { posthog } from './posthog';

interface Experiment {
  key: string;
  variants: string[];
  defaultVariant: string;
}

const experiments: Record<string, Experiment> = {
  'pricing-page-v2': {
    key: 'pricing-page-v2',
    variants: ['control', 'variant-a', 'variant-b'],
    defaultVariant: 'control',
  },
  'new-checkout-flow': {
    key: 'new-checkout-flow',
    variants: ['control', 'new-flow'],
    defaultVariant: 'control',
  },
};

export function getVariant(experimentKey: string): string {
  const experiment = experiments[experimentKey];
  if (!experiment) return 'control';
  
  const variant = posthog.getFeatureFlag(experiment.key);
  
  if (typeof variant === 'string' && experiment.variants.includes(variant)) {
    return variant;
  }
  
  return experiment.defaultVariant;
}

export function trackExperimentExposure(experimentKey: string, variant: string) {
  posthog.capture('$experiment_started', {
    $experiment_key: experimentKey,
    $experiment_variant: variant,
  });
}

export function trackExperimentConversion(experimentKey: string, variant: string, conversionEvent: string) {
  posthog.capture('$experiment_conversion', {
    $experiment_key: experimentKey,
    $experiment_variant: variant,
    conversion_event: conversionEvent,
  });
}
```

**React A/B Test Component:**

```typescript
// src/components/ab-test.tsx
'use client';

import { useEffect, useState } from 'react';
import { getVariant, trackExperimentExposure } from '@/lib/analytics/experiments';

interface ABTestProps {
  experimentKey: string;
  variants: Record<string, React.ReactNode>;
  fallback?: React.ReactNode;
}

export function ABTest({ experimentKey, variants, fallback }: ABTestProps) {
  const [variant, setVariant] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const v = getVariant(experimentKey);
    setVariant(v);
    setIsLoading(false);
    
    // Track exposure
    trackExperimentExposure(experimentKey, v);
  }, [experimentKey]);
  
  if (isLoading) {
    return fallback || null;
  }
  
  if (!variant || !variants[variant]) {
    return variants['control'] || fallback || null;
  }
  
  return variants[variant];
}

// Usage example
export function PricingPage() {
  return (
    <ABTest
      experimentKey="pricing-page-v2"
      variants={{
        control: <OriginalPricingPage />,
        'variant-a': <NewPricingPageA />,
        'variant-b': <NewPricingPageB />,
      }}
      fallback={<OriginalPricingPage />}
    />
  );
}
```

**Server-Side A/B Testing:**

```typescript
// src/app/pricing/page.tsx
import { cookies } from 'next/headers';
import { PostHog } from 'posthog-node';

const posthog = new PostHog(process.env.POSTHOG_API_KEY!);

export default async function PricingPage() {
  const cookieStore = cookies();
  const distinctId = cookieStore.get('ph_distinct_id')?.value || 'anonymous';
  
  // Get feature flag server-side
  const variant = await posthog.getFeatureFlag('pricing-page-v2', distinctId);
  
  // Track exposure
  posthog.capture({
    distinctId,
    event: '$experiment_started',
    properties: {
      $experiment_key: 'pricing-page-v2',
      $experiment_variant: variant,
    },
  });
  
  switch (variant) {
    case 'variant-a':
      return <NewPricingPageA />;
    case 'variant-b':
      return <NewPricingPageB />;
    default:
      return <OriginalPricingPage />;
  }
}
```

**Best Practices:**
- Always track experiment exposure
- Use server-side flags to prevent flicker
- Define clear success metrics
- Run experiments for statistical significance
- Document experiment hypotheses

**Gotchas:**
- Client-side flags can cause layout shift
- Cached pages may show wrong variant
- Bot traffic can skew results
- Multiple experiments can interact

### 7. Privacy and Consent

Implement GDPR-compliant tracking.

**Consent Manager:**

```typescript
// src/lib/analytics/consent.ts
type ConsentCategory = 'necessary' | 'analytics' | 'marketing' | 'preferences';

interface ConsentState {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  timestamp: number;
}

const CONSENT_KEY = 'cookie_consent';
const DEFAULT_CONSENT: ConsentState = {
  necessary: true, // Always required
  analytics: false,
  marketing: false,
  preferences: false,
  timestamp: 0,
};

class ConsentManager {
  private consent: ConsentState = DEFAULT_CONSENT;
  private listeners: Set<(consent: ConsentState) => void> = new Set();
  
  constructor() {
    this.loadConsent();
  }
  
  private loadConsent() {
    if (typeof window === 'undefined') return;
    
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      try {
        this.consent = JSON.parse(stored);
      } catch {
        this.consent = DEFAULT_CONSENT;
      }
    }
  }
  
  private saveConsent() {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(this.consent));
    this.notifyListeners();
  }
  
  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.consent));
  }
  
  hasConsent(category: ConsentCategory): boolean {
    return this.consent[category];
  }
  
  getConsent(): ConsentState {
    return { ...this.consent };
  }
  
  setConsent(categories: Partial<Omit<ConsentState, 'necessary' | 'timestamp'>>) {
    this.consent = {
      ...this.consent,
      ...categories,
      necessary: true, // Always true
      timestamp: Date.now(),
    };
    this.saveConsent();
    this.applyConsent();
  }
  
  acceptAll() {
    this.setConsent({
      analytics: true,
      marketing: true,
      preferences: true,
    });
  }
  
  rejectAll() {
    this.setConsent({
      analytics: false,
      marketing: false,
      preferences: false,
    });
  }
  
  hasResponded(): boolean {
    return this.consent.timestamp > 0;
  }
  
  private applyConsent() {
    // Initialize or disable analytics based on consent
    if (this.consent.analytics) {
      initPostHog();
      initMixpanel();
    } else {
      // Disable tracking
      posthog.opt_out_capturing();
    }
    
    // Handle marketing cookies
    if (!this.consent.marketing) {
      // Remove marketing cookies
      this.clearMarketingCookies();
    }
  }
  
  private clearMarketingCookies() {
    // Clear specific cookies
    const marketingCookies = ['_fbp', '_gcl_au', 'ads_*'];
    // Implementation depends on cookie library
  }
  
  subscribe(listener: (consent: ConsentState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const consentManager = new ConsentManager();
```

**Consent Banner Component:**

```typescript
// src/components/consent-banner.tsx
'use client';

import { useState, useEffect } from 'react';
import { consentManager } from '@/lib/analytics/consent';

export function ConsentBanner() {
  const [show, setShow] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  useEffect(() => {
    setShow(!consentManager.hasResponded());
  }, []);
  
  if (!show) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
      <div className="max-w-4xl mx-auto">
        <h3 className="font-semibold mb-2">Cookie Preferences</h3>
        <p className="text-sm text-gray-600 mb-4">
          We use cookies to enhance your experience. By continuing, you agree to our use of cookies.
        </p>
        
        {showDetails && (
          <div className="mb-4 space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked disabled />
              <span>Necessary (Required)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                id="analytics"
                defaultChecked={consentManager.hasConsent('analytics')}
              />
              <span>Analytics</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                id="marketing"
                defaultChecked={consentManager.hasConsent('marketing')}
              />
              <span>Marketing</span>
            </label>
          </div>
        )}
        
        <div className="flex gap-2">
          <button
            onClick={() => {
              consentManager.acceptAll();
              setShow(false);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Accept All
          </button>
          <button
            onClick={() => {
              consentManager.rejectAll();
              setShow(false);
            }}
            className="px-4 py-2 border rounded"
          >
            Reject All
          </button>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-4 py-2 text-blue-500"
          >
            {showDetails ? 'Hide' : 'Customize'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Best Practices:**
- Always allow rejecting non-essential cookies
- Store consent with timestamp
- Respect Do Not Track header
- Provide easy consent withdrawal
- Document data processing activities

**Gotchas:**
- Consent must be obtained before tracking
- Different rules for different regions
- Cookie banners affect user experience
- Consent state must sync across domains

## Real-World Examples

### Example 1: E-commerce Analytics Dashboard

```typescript
// src/lib/analytics/ecommerce.ts
import { trackEvent } from './posthog';
import { collector } from './collector';

// Product view
export function trackProductView(product: {
  id: string;
  name: string;
  category: string;
  price: number;
  currency: string;
}) {
  trackEvent('product_viewed', {
    product_id: product.id,
    product_name: product.name,
    product_category: product.category,
    product_price: product.price,
    currency: product.currency,
  });
}

// Add to cart
export function trackAddToCart(product: {
  id: string;
  name: string;
  price: number;
  quantity: number;
}) {
  trackEvent('product_added_to_cart', {
    product_id: product.id,
    product_name: product.name,
    product_price: product.price,
    quantity: product.quantity,
    cart_value: product.price * product.quantity,
  });
}

// Checkout
export function trackCheckoutStarted(cart: {
  items: Array<{ id: string; price: number; quantity: number }>;
  total: number;
  coupon?: string;
}) {
  trackEvent('checkout_started', {
    cart_items: cart.items.length,
    cart_total: cart.total,
    has_coupon: !!cart.coupon,
    coupon_code: cart.coupon,
  });
}

// Purchase
export function trackPurchase(order: {
  orderId: string;
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
  total: number;
  tax: number;
  shipping: number;
  currency: string;
  coupon?: string;
}) {
  trackEvent('purchase_completed', {
    order_id: order.orderId,
    items: order.items,
    item_count: order.items.length,
    total: order.total,
    tax: order.tax,
    shipping: order.shipping,
    currency: order.currency,
    coupon: order.coupon,
    revenue: order.total - order.tax - order.shipping,
  });
}
```

### Example 2: SaaS Feature Analytics

```typescript
// src/lib/analytics/saas.ts
import { analytics } from './events';
import { setUserProperties, incrementProperty } from './mixpanel';

// Track feature adoption
export function trackFeatureAdoption(feature: string, firstUse: boolean) {
  analytics.featureUsed(feature, firstUse ? 'first_use' : 'repeat_use');
  
  if (firstUse) {
    setUserProperties({
      [`${feature}_first_used_at`]: new Date().toISOString(),
    });
  }
  
  incrementProperty(`${feature}_usage_count`);
}

// Track workspace activity
export function trackWorkspaceActivity(workspaceId: string, action: string) {
  analytics.featureUsed('workspace', action);
  
  setUserProperties({
    last_workspace_id: workspaceId,
    last_active_at: new Date().toISOString(),
  });
  
  incrementProperty('total_workspace_actions');
}

// Track collaboration
export function trackCollaboration(type: 'invite' | 'share' | 'comment', targetUserId?: string) {
  analytics.featureUsed('collaboration', type);
  
  if (type === 'invite') {
    incrementProperty('invites_sent');
  }
}

// Health score calculation
export function calculateEngagementScore(userData: {
  loginCount: number;
  featuresUsed: number;
  collaborators: number;
  lastActiveAt: Date;
}): number {
  const daysSinceActive = (Date.now() - userData.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24);
  
  let score = 0;
  score += Math.min(userData.loginCount * 2, 30);
  score += Math.min(userData.featuresUsed * 5, 30);
  score += Math.min(userData.collaborators * 10, 20);
  score += daysSinceActive < 7 ? 20 : daysSinceActive < 30 ? 10 : 0;
  
  return Math.min(score, 100);
}
```

## Related Skills

- **posthog-expert** - Advanced PostHog features
- **privacy-compliance** - GDPR/CCPA implementation
- **data-visualization** - Analytics dashboards
- **ab-testing** - Experiment design

## Further Reading

- [PostHog Documentation](https://posthog.com/docs)
- [Mixpanel Developer Docs](https://developer.mixpanel.com/)
- [Web Vitals](https://web.dev/vitals/)
- [GDPR for Developers](https://gdpr.eu/)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
