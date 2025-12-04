# V0-Style UI Generator

> **ID:** `v0-style-generator`
> **Tier:** 2
> **Token Cost:** 8000
> **MCP Connections:** context7

## What This Skill Does

Generate complete, production-ready UI components from natural language descriptions. Create landing pages, dashboards, forms, and marketing components in minutes with copy-ready Tailwind + React code.

- Generate complete UI from description
- Build landing pages in minutes
- Create dashboard layouts
- Design form interfaces
- Build marketing components
- Hero sections, pricing tables, testimonials
- Copy-ready Tailwind + React code
- Responsive by default
- Accessible patterns included
- Dark mode support

## When to Use

This skill is automatically loaded when:

- **Keywords:** v0, generate, landing, dashboard, hero, pricing, marketing, ui, component
- **File Types:** Any
- **Directories:** Any

## Generation Principles

1. **Complete and Working**: Every component should work immediately
2. **Modern Design**: Clean, contemporary aesthetics
3. **Responsive First**: Mobile-friendly by default
4. **Accessible**: Semantic HTML, ARIA where needed
5. **Customizable**: Easy to modify colors, text, layout
6. **Production Ready**: No placeholder TODOs

## Core Capabilities

### 1. Hero Sections

Generate impactful hero sections.

**Classic Hero with CTA:**

```typescript
// Hero section with gradient background and centered content
export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      
      <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 lg:py-40">
        <div className="mx-auto max-w-2xl text-center">
          {/* Badge */}
          <div className="mb-8 flex justify-center">
            <div className="rounded-full bg-purple-500/10 px-4 py-1.5 text-sm font-medium text-purple-400 ring-1 ring-inset ring-purple-500/20">
              Announcing our Series A
            </div>
          </div>
          
          {/* Headline */}
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Build faster with
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {' '}modern tools
            </span>
          </h1>
          
          {/* Subheadline */}
          <p className="mt-6 text-lg leading-8 text-gray-300 sm:text-xl">
            The all-in-one platform for building, deploying, and scaling your applications.
            Start free and scale as you grow.
          </p>
          
          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/signup"
              className="rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100 transition-colors"
            >
              Get started free
            </a>
            <a
              href="/demo"
              className="group flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold text-white hover:text-purple-300 transition-colors"
            >
              Watch demo
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
          
          {/* Social proof */}
          <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8 text-gray-400">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <img
                  key={i}
                  src={`/avatars/${i}.jpg`}
                  alt=""
                  className="h-10 w-10 rounded-full border-2 border-slate-900"
                />
              ))}
            </div>
            <div className="text-sm">
              <span className="font-semibold text-white">10,000+</span> developers trust us
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

**Split Hero with Image:**

```typescript
// Hero with content on left, image on right
export function SplitHero() {
  return (
    <section className="relative bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="max-w-xl">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
              Ship your product
              <br />
              <span className="text-purple-600 dark:text-purple-400">10x faster</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-300">
              Stop wrestling with infrastructure. Our platform handles the complexity so you can focus on what matters - building great products.
            </p>
            
            {/* Features list */}
            <ul className="mt-8 space-y-3">
              {['Automatic scaling', 'Zero-config deployments', '99.9% uptime SLA'].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            
            {/* CTAs */}
            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="/signup"
                className="rounded-lg bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 transition-colors"
              >
                Start building
              </a>
              <a
                href="/contact"
                className="rounded-lg border border-gray-300 dark:border-gray-700 px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                Talk to sales
              </a>
            </div>
          </div>
          
          {/* Image */}
          <div className="relative lg:order-last">
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 p-2">
              <div className="h-full w-full rounded-xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
                <img
                  src="/dashboard-preview.png"
                  alt="Dashboard preview"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-4 -left-4 rounded-lg bg-white dark:bg-gray-900 p-4 shadow-lg border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Deploys in</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">30 sec</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

### 2. Pricing Tables

Generate pricing components.

**Three-Tier Pricing:**

```typescript
interface PricingTier {
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

const tiers: PricingTier[] = [
  {
    name: 'Starter',
    price: '$9',
    description: 'Perfect for side projects and small teams.',
    features: [
      '5 projects',
      '10GB storage',
      'Basic analytics',
      'Email support',
    ],
    cta: 'Get started',
  },
  {
    name: 'Pro',
    price: '$29',
    description: 'Everything you need to scale your business.',
    features: [
      'Unlimited projects',
      '100GB storage',
      'Advanced analytics',
      'Priority support',
      'Custom domains',
      'Team collaboration',
    ],
    cta: 'Start free trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$99',
    description: 'For large teams with advanced needs.',
    features: [
      'Everything in Pro',
      'Unlimited storage',
      'SSO & SAML',
      'Dedicated support',
      'Custom contracts',
      'SLA guarantee',
    ],
    cta: 'Contact sales',
  },
];

export function PricingSection() {
  return (
    <section className="bg-white dark:bg-gray-950 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold text-purple-600 dark:text-purple-400">
            Pricing
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Simple, transparent pricing
          </p>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Choose the plan that fits your needs. All plans include a 14-day free trial.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="mx-auto mt-16 grid max-w-lg gap-8 lg:max-w-none lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border p-8 shadow-sm ${
                tier.popular
                  ? 'border-purple-500 ring-2 ring-purple-500'
                  : 'border-gray-200 dark:border-gray-800'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-purple-600 px-4 py-1 text-sm font-semibold text-white">
                    Most popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {tier.name}
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {tier.description}
                </p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  {tier.price}
                </span>
                <span className="text-gray-600 dark:text-gray-400">/month</span>
              </div>

              <ul className="mb-8 space-y-3 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <svg
                      className="h-5 w-5 flex-shrink-0 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
                  tier.popular
                    ? 'bg-purple-600 text-white hover:bg-purple-500'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

### 3. Feature Sections

Showcase product features.

**Feature Grid:**

```typescript
import { Zap, Shield, Globe, Smartphone, Cloud, BarChart } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Built for speed with edge computing and global CDN distribution.',
  },
  {
    icon: Shield,
    title: 'Secure by Default',
    description: 'Enterprise-grade security with SOC 2 compliance and encryption.',
  },
  {
    icon: Globe,
    title: 'Global Scale',
    description: 'Deploy to 50+ regions worldwide with automatic load balancing.',
  },
  {
    icon: Smartphone,
    title: 'Mobile Ready',
    description: 'Responsive design and native mobile SDKs included.',
  },
  {
    icon: Cloud,
    title: 'Cloud Native',
    description: 'Kubernetes-native architecture with auto-scaling built in.',
  },
  {
    icon: BarChart,
    title: 'Analytics',
    description: 'Real-time analytics and insights to drive your business.',
  },
];

export function FeaturesGrid() {
  return (
    <section className="bg-gray-50 dark:bg-gray-900 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold text-purple-600 dark:text-purple-400">
            Features
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Everything you need to succeed
          </p>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Powerful features designed to help you build, deploy, and scale with confidence.
          </p>
        </div>

        {/* Grid */}
        <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Feature with Screenshot:**

```typescript
export function FeatureShowcase() {
  return (
    <section className="bg-white dark:bg-gray-950 py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            <span className="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900/30 px-3 py-1 text-sm font-medium text-purple-700 dark:text-purple-300">
              New feature
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Collaborate in real-time
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Work together with your team in real-time. See changes instantly, leave comments, and ship faster together.
            </p>
            
            <div className="mt-8 space-y-4">
              {[
                { title: 'Live cursors', desc: 'See where your teammates are working in real-time' },
                { title: 'Comments & threads', desc: 'Leave feedback directly on any element' },
                { title: 'Version history', desc: 'Track changes and restore previous versions anytime' },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{item.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <a
              href="/features/collaboration"
              className="mt-8 inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium hover:text-purple-500"
            >
              Learn more
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
          
          {/* Screenshot */}
          <div className="relative">
            <div className="rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 p-1">
              <div className="rounded-xl bg-gray-900 p-2">
                <img
                  src="/feature-collab.png"
                  alt="Collaboration feature"
                  className="rounded-lg shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

### 4. Testimonials

Build social proof sections.

**Testimonial Cards:**

```typescript
const testimonials = [
  {
    quote: "This platform has completely transformed how we build and deploy our applications. We've reduced our deployment time by 80%.",
    author: 'Sarah Chen',
    role: 'CTO at TechCorp',
    avatar: '/avatars/sarah.jpg',
    logo: '/logos/techcorp.svg',
  },
  {
    quote: "The best developer experience I've ever had. Everything just works out of the box, and the team support is incredible.",
    author: 'Marcus Johnson',
    role: 'Lead Developer at StartupXYZ',
    avatar: '/avatars/marcus.jpg',
    logo: '/logos/startupxyz.svg',
  },
  {
    quote: "We migrated from three different tools to this single platform. The consolidation alone saved us $50k per year.",
    author: 'Emily Rodriguez',
    role: 'VP Engineering at ScaleUp',
    avatar: '/avatars/emily.jpg',
    logo: '/logos/scaleup.svg',
  },
];

export function TestimonialsSection() {
  return (
    <section className="bg-white dark:bg-gray-950 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Loved by developers worldwide
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            See what our customers have to say about their experience.
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="mx-auto mt-16 grid gap-8 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.author}
              className="flex flex-col rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8"
            >
              {/* Stars */}
              <div className="flex gap-1 text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <blockquote className="mt-6 flex-1">
                <p className="text-gray-600 dark:text-gray-300">
                  "{testimonial.quote}"
                </p>
              </blockquote>

              {/* Author */}
              <div className="mt-6 flex items-center gap-4">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.author}
                  className="h-12 w-12 rounded-full"
                />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {testimonial.author}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {testimonial.role}
                  </p>
                </div>
              </div>

              {/* Company logo */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                <img
                  src={testimonial.logo}
                  alt=""
                  className="h-8 opacity-50"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

### 5. Dashboard Components

Generate dashboard UI elements.

**Stats Cards:**

```typescript
import { ArrowUp, ArrowDown, Users, DollarSign, ShoppingCart, Activity } from 'lucide-react';

const stats = [
  {
    name: 'Total Revenue',
    value: '$45,231.89',
    change: '+20.1%',
    trend: 'up',
    icon: DollarSign,
  },
  {
    name: 'Subscriptions',
    value: '+2350',
    change: '+180.1%',
    trend: 'up',
    icon: Users,
  },
  {
    name: 'Sales',
    value: '+12,234',
    change: '+19%',
    trend: 'up',
    icon: ShoppingCart,
  },
  {
    name: 'Active Now',
    value: '+573',
    change: '-2%',
    trend: 'down',
    icon: Activity,
  },
];

export function StatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.name}
          className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {stat.name}
            </span>
            <stat.icon className="h-4 w-4 text-gray-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {stat.value}
            </span>
            <span
              className={`flex items-center text-sm font-medium ${
                stat.trend === 'up'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {stat.trend === 'up' ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
              {stat.change}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            from last month
          </p>
        </div>
      ))}
    </div>
  );
}
```

**Data Table:**

```typescript
interface Transaction {
  id: string;
  customer: string;
  email: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  date: string;
}

const transactions: Transaction[] = [
  { id: '1', customer: 'John Doe', email: 'john@example.com', amount: 250.00, status: 'completed', date: '2024-01-15' },
  { id: '2', customer: 'Jane Smith', email: 'jane@example.com', amount: 150.00, status: 'pending', date: '2024-01-14' },
  { id: '3', customer: 'Bob Johnson', email: 'bob@example.com', amount: 350.00, status: 'completed', date: '2024-01-13' },
  { id: '4', customer: 'Alice Brown', email: 'alice@example.com', amount: 450.00, status: 'failed', date: '2024-01-12' },
];

export function TransactionsTable() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Transactions
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          A list of recent transactions from your store.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {tx.customer}
                    </p>
                    <p className="text-sm text-gray-500">{tx.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      tx.status === 'completed'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : tx.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {tx.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {tx.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-white">
                  ${tx.amount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### 6. Forms

Generate form components.

**Contact Form:**

```typescript
'use client';

import { useState } from 'react';

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="rounded-2xl bg-green-50 dark:bg-green-900/20 p-8 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Thank you!</h3>
        <p className="mt-2 text-gray-600 dark:text-gray-300">We'll get back to you within 24 hours.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            First name
          </label>
          <input
            type="text"
            required
            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Last name
          </label>
          <input
            type="text"
            required
            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email
        </label>
        <input
          type="email"
          required
          className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Subject
        </label>
        <select
          required
          className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-purple-500"
        >
          <option value="">Select a topic</option>
          <option value="sales">Sales inquiry</option>
          <option value="support">Technical support</option>
          <option value="billing">Billing question</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Message
        </label>
        <textarea
          rows={4}
          required
          className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Sending...' : 'Send message'}
      </button>
    </form>
  );
}
```

## Related Skills

- **vibe-coder** - Fast prototyping patterns
- **tailwind-expert** - Advanced Tailwind CSS
- **design-system-architect** - Component systems
- **figma-to-code** - Design implementation

## Further Reading

- [v0.dev](https://v0.dev)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Radix UI](https://radix-ui.com)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
