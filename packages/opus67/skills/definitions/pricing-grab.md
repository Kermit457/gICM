# Pricing Grab

> **ID:** `pricing-grab`
> **Tier:** 2
> **Token Cost:** 5500
> **MCP Connections:** context7

## What This Skill Does

Pricing Grab is a specialized GRAB skill that transforms pricing table screenshots into production-ready React components. It analyzes tier structures, feature lists, CTAs, billing toggles, and comparison layouts to generate pixel-perfect pricing sections with proper accessibility and conversion optimization.

**Core Transformation:**
- Visual Design (Screenshot/URL/Figma) to Pricing Component Code
- Automatic tier detection and feature extraction
- Monthly/Annual billing toggle integration
- Popular/Recommended tier highlighting
- Comparison table generation
- TypeScript interface generation

**What Makes It Different:**
Pricing Grab understands the psychology of pricing pages - social proof positioning, feature hierarchy, and conversion triggers. It generates components that drive conversions while maintaining clarity and trust.

## When to Use

This skill is automatically loaded when:

- **Keywords:** pricing, grab pricing, tiers, plans, subscription, billing
- **File Types:** .png, .jpg, .jpeg, .webp (screenshots/mockups)
- **Directories:** N/A

**Ideal Use Cases:**
1. SaaS pricing page creation
2. Subscription tier comparisons
3. E-commerce plan displays
4. Feature comparison tables
5. Enterprise custom pricing
6. Freemium conversion pages

## Core Capabilities

### 1. Pricing Table Extraction

The primary transformation converts visual pricing designs into structured React components.

#### Visual Analysis Pipeline

**Step 1: Pricing Structure Detection**
```typescript
// Pricing Grab analyzes the pricing structure
interface PricingAnalysis {
  type: 'cards' | 'comparison-table' | 'feature-matrix' | 'slider';
  tiers: {
    count: number;
    layout: 'horizontal' | 'stacked';
    highlighted: number | null;
  };
  billing: {
    toggle: boolean;
    options: ('monthly' | 'annual' | 'quarterly')[];
    discount: number | null;
  };
  elements: {
    badges: BadgeElement[];
    prices: PriceElement[];
    features: FeatureElement[];
    ctas: CTAElement[];
    guarantees: GuaranteeElement[];
  };
}
```

**Step 2: Component Generation**

```typescript
// Example: SaaS Pricing Cards
// INPUT: Screenshot analysis
// OUTPUT: Production-ready component

import React, { useState } from 'react';
import { Check, X, Zap, Building2, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PricingTier {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  monthlyPrice: number;
  annualPrice: number;
  features: {
    name: string;
    included: boolean;
    tooltip?: string;
  }[];
  cta: {
    text: string;
    href: string;
    variant: 'primary' | 'secondary' | 'outline';
  };
  popular?: boolean;
  badge?: string;
}

interface PricingProps {
  tiers: PricingTier[];
  annualDiscount?: number;
}

export const PricingSection: React.FC<PricingProps> = ({
  tiers,
  annualDiscount = 20,
}) => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Choose the plan that's right for you. All plans include a 14-day free trial.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white rounded-full p-1 border border-gray-200 shadow-sm">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={cn(
                'px-6 py-2 rounded-full text-sm font-medium transition-all',
                billingPeriod === 'monthly'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={cn(
                'px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2',
                billingPeriod === 'annual'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Annual
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs font-semibold',
                billingPeriod === 'annual'
                  ? 'bg-green-500 text-white'
                  : 'bg-green-100 text-green-700'
              )}>
                Save {annualDiscount}%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {tiers.map((tier) => (
            <PricingCard
              key={tier.id}
              tier={tier}
              billingPeriod={billingPeriod}
            />
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 mb-6">Trusted by 10,000+ companies worldwide</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-50">
            {['Stripe', 'Vercel', 'Linear', 'Notion', 'Figma'].map((company) => (
              <span key={company} className="text-gray-900 font-semibold text-lg">
                {company}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const PricingCard: React.FC<{
  tier: PricingTier;
  billingPeriod: 'monthly' | 'annual';
}> = ({ tier, billingPeriod }) => {
  const price = billingPeriod === 'monthly' ? tier.monthlyPrice : tier.annualPrice;
  const pricePerMonth = billingPeriod === 'annual' ? Math.round(tier.annualPrice / 12) : tier.monthlyPrice;

  return (
    <article
      className={cn(
        'relative bg-white rounded-2xl p-8 border transition-all',
        tier.popular
          ? 'border-blue-500 shadow-xl scale-105 z-10'
          : 'border-gray-200 hover:shadow-lg hover:border-gray-300'
      )}
    >
      {/* Popular Badge */}
      {tier.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1.5 bg-blue-500 text-white text-sm font-semibold rounded-full">
            Most Popular
          </span>
        </div>
      )}

      {/* Badge */}
      {tier.badge && !tier.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1.5 bg-gray-900 text-white text-sm font-semibold rounded-full">
            {tier.badge}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <div className={cn(
          'w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4',
          tier.popular ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
        )}>
          {tier.icon}
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{tier.name}</h3>
        <p className="text-gray-600 text-sm">{tier.description}</p>
      </div>

      {/* Price */}
      <div className="text-center mb-8">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold text-gray-900">${pricePerMonth}</span>
          <span className="text-gray-500">/month</span>
        </div>
        {billingPeriod === 'annual' && (
          <p className="text-sm text-gray-500 mt-1">
            Billed ${price} annually
          </p>
        )}
      </div>

      {/* CTA */}
      <a
        href={tier.cta.href}
        className={cn(
          'w-full py-3 px-4 rounded-lg font-semibold text-center block mb-8 transition-all',
          tier.cta.variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700',
          tier.cta.variant === 'secondary' && 'bg-gray-900 text-white hover:bg-gray-800',
          tier.cta.variant === 'outline' && 'border-2 border-gray-300 text-gray-900 hover:border-gray-400 hover:bg-gray-50'
        )}
      >
        {tier.cta.text}
      </a>

      {/* Features */}
      <ul className="space-y-4">
        {tier.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            {feature.included ? (
              <Check className={cn(
                'w-5 h-5 flex-shrink-0 mt-0.5',
                tier.popular ? 'text-blue-500' : 'text-green-500'
              )} />
            ) : (
              <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
            )}
            <span className={cn(
              'text-sm',
              feature.included ? 'text-gray-700' : 'text-gray-400'
            )}>
              {feature.name}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
};

export default PricingSection;
```

**Best Practices:**

1. **Clear Hierarchy:** Visually distinguish tier levels
2. **Price Clarity:** Show monthly equivalent for annual billing
3. **Feature Comparison:** Make differences between tiers obvious
4. **Trust Signals:** Include guarantees and social proof
5. **Mobile Stacking:** Stack cards on mobile, side-by-side on desktop
6. **Highlight Popular:** Draw attention to recommended tier
7. **Clear CTAs:** Use action-oriented button text
8. **Accessibility:** Use semantic headings and ARIA labels
9. **Loading States:** Handle price calculation loading
10. **Currency Handling:** Support localized pricing

**Common Patterns:**

```typescript
// Pattern 1: Feature Comparison Table
const FeatureComparisonTable: React.FC<{
  features: {
    category: string;
    items: {
      name: string;
      tiers: (boolean | string)[];
    }[];
  }[];
  tiers: { name: string; price: string }[];
}> = ({ features, tiers }) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="py-4 px-6 text-left text-gray-600 font-medium w-1/4">
            Features
          </th>
          {tiers.map((tier, i) => (
            <th key={i} className="py-4 px-6 text-center">
              <div className="font-bold text-gray-900">{tier.name}</div>
              <div className="text-sm text-gray-500">{tier.price}</div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {features.map((category) => (
          <React.Fragment key={category.category}>
            <tr className="bg-gray-50">
              <td colSpan={tiers.length + 1} className="py-3 px-6 font-semibold text-gray-900">
                {category.category}
              </td>
            </tr>
            {category.items.map((item, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-4 px-6 text-gray-700">{item.name}</td>
                {item.tiers.map((value, j) => (
                  <td key={j} className="py-4 px-6 text-center">
                    {typeof value === 'boolean' ? (
                      value ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      )
                    ) : (
                      <span className="text-gray-900">{value}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  </div>
);

// Pattern 2: Enterprise Contact Card
const EnterpriseCard: React.FC = () => (
  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-white">
    <div className="flex items-center gap-4 mb-6">
      <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
        <Building2 className="w-7 h-7" />
      </div>
      <div>
        <h3 className="text-xl font-bold">Enterprise</h3>
        <p className="text-gray-400">For large organizations</p>
      </div>
    </div>

    <div className="mb-6">
      <span className="text-3xl font-bold">Custom</span>
      <span className="text-gray-400 ml-2">pricing</span>
    </div>

    <ul className="space-y-3 mb-8">
      {[
        'Unlimited users',
        'Dedicated support',
        'Custom integrations',
        'SLA guarantee',
        'Security review',
        'Training & onboarding',
      ].map((feature) => (
        <li key={feature} className="flex items-center gap-3 text-sm">
          <Check className="w-5 h-5 text-blue-400" />
          {feature}
        </li>
      ))}
    </ul>

    <button className="w-full py-3 px-4 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
      Contact Sales
    </button>
  </div>
);

// Pattern 3: Pricing Slider (Usage-Based)
const UsageBasedPricing: React.FC = () => {
  const [users, setUsers] = useState(50);

  const calculatePrice = (count: number) => {
    if (count <= 10) return 0;
    if (count <= 50) return 29;
    if (count <= 100) return 79;
    if (count <= 500) return 199;
    return 499;
  };

  const price = calculatePrice(users);

  return (
    <div className="bg-white rounded-2xl p-8 border border-gray-200 max-w-md mx-auto">
      <h3 className="text-xl font-bold text-gray-900 mb-2">Pay as you grow</h3>
      <p className="text-gray-600 mb-8">Only pay for what you use</p>

      {/* Slider */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Team size</span>
          <span className="font-semibold text-gray-900">{users} users</span>
        </div>
        <input
          type="range"
          min="1"
          max="1000"
          value={users}
          onChange={(e) => setUsers(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:rounded-full"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>1</span>
          <span>1000+</span>
        </div>
      </div>

      {/* Price Display */}
      <div className="text-center py-6 bg-gray-50 rounded-xl mb-8">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-5xl font-bold text-gray-900">${price}</span>
          <span className="text-gray-500">/month</span>
        </div>
        {users <= 10 && (
          <p className="text-sm text-green-600 mt-2">Free for teams up to 10</p>
        )}
      </div>

      <button className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
        Start Free Trial
      </button>
    </div>
  );
};

// Pattern 4: Minimal Pricing (Two Tiers)
const MinimalPricing: React.FC = () => (
  <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
    {/* Free Tier */}
    <div className="bg-white rounded-2xl p-8 border border-gray-200">
      <h3 className="text-xl font-bold text-gray-900 mb-2">Free</h3>
      <p className="text-gray-600 mb-6">Perfect for getting started</p>

      <div className="mb-6">
        <span className="text-4xl font-bold text-gray-900">$0</span>
        <span className="text-gray-500">/month</span>
      </div>

      <button className="w-full py-3 px-4 border border-gray-300 text-gray-900 rounded-lg font-semibold hover:bg-gray-50 transition-colors mb-8">
        Get Started
      </button>

      <ul className="space-y-3">
        {['Up to 3 projects', '1 team member', 'Basic analytics', 'Community support'].map((feature) => (
          <li key={feature} className="flex items-center gap-3 text-sm text-gray-600">
            <Check className="w-5 h-5 text-gray-400" />
            {feature}
          </li>
        ))}
      </ul>
    </div>

    {/* Pro Tier */}
    <div className="bg-gray-900 rounded-2xl p-8 text-white">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-bold">Pro</h3>
        <span className="px-3 py-1 bg-blue-500 text-xs font-semibold rounded-full">
          Popular
        </span>
      </div>
      <p className="text-gray-400 mb-6">For growing teams</p>

      <div className="mb-6">
        <span className="text-4xl font-bold">$29</span>
        <span className="text-gray-400">/month</span>
      </div>

      <button className="w-full py-3 px-4 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors mb-8">
        Upgrade to Pro
      </button>

      <ul className="space-y-3">
        {['Unlimited projects', 'Unlimited team members', 'Advanced analytics', 'Priority support', 'Custom integrations', 'API access'].map((feature) => (
          <li key={feature} className="flex items-center gap-3 text-sm">
            <Check className="w-5 h-5 text-blue-400" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  </div>
);
```

**Gotchas:**

1. **Price Formatting:** Handle different currencies and locales
2. **Billing Calculation:** Ensure annual pricing math is correct
3. **Feature Alignment:** Align feature lists across tiers
4. **Card Heights:** Equalize card heights with flexbox
5. **Mobile Overflow:** Horizontal scroll on comparison tables
6. **Loading States:** Show skeletons during price fetch
7. **Currency Symbols:** Position correctly ($29 vs 29$)
8. **Decimal Handling:** Consistent decimal places
9. **Tax Disclaimers:** Include where legally required
10. **Enterprise Contact:** Provide clear enterprise path

### 2. Billing Toggle

Pricing Grab generates billing period toggles with discount displays.

#### Billing Analysis

```typescript
interface BillingConfig {
  periods: ('monthly' | 'annual' | 'quarterly' | 'lifetime')[];
  default: string;
  discounts: {
    period: string;
    percentage: number;
    label?: string;
  }[];
  display: 'toggle' | 'tabs' | 'dropdown';
}
```

**Billing Toggle Patterns:**

```typescript
// Pattern 1: Pill Toggle
const PillToggle: React.FC<{
  value: 'monthly' | 'annual';
  onChange: (value: 'monthly' | 'annual') => void;
  discount?: number;
}> = ({ value, onChange, discount }) => (
  <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
    <button
      onClick={() => onChange('monthly')}
      className={cn(
        'px-6 py-2 rounded-full text-sm font-medium transition-all',
        value === 'monthly'
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-600 hover:text-gray-900'
      )}
    >
      Monthly
    </button>
    <button
      onClick={() => onChange('annual')}
      className={cn(
        'px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2',
        value === 'annual'
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-600 hover:text-gray-900'
      )}
    >
      Annual
      {discount && (
        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
          -{discount}%
        </span>
      )}
    </button>
  </div>
);

// Pattern 2: Switch Toggle
const SwitchToggle: React.FC<{
  value: 'monthly' | 'annual';
  onChange: (value: 'monthly' | 'annual') => void;
  discount?: number;
}> = ({ value, onChange, discount }) => (
  <div className="flex items-center justify-center gap-4">
    <span className={cn(
      'text-sm font-medium',
      value === 'monthly' ? 'text-gray-900' : 'text-gray-500'
    )}>
      Monthly
    </span>

    <button
      onClick={() => onChange(value === 'monthly' ? 'annual' : 'monthly')}
      className={cn(
        'relative w-14 h-8 rounded-full transition-colors',
        value === 'annual' ? 'bg-blue-600' : 'bg-gray-200'
      )}
    >
      <span
        className={cn(
          'absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform',
          value === 'annual' ? 'translate-x-7' : 'translate-x-1'
        )}
      />
    </button>

    <span className="flex items-center gap-2">
      <span className={cn(
        'text-sm font-medium',
        value === 'annual' ? 'text-gray-900' : 'text-gray-500'
      )}>
        Annual
      </span>
      {discount && (
        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
          Save {discount}%
        </span>
      )}
    </span>
  </div>
);

// Pattern 3: Tabs Toggle
const TabsToggle: React.FC<{
  value: 'monthly' | 'annual' | 'lifetime';
  onChange: (value: 'monthly' | 'annual' | 'lifetime') => void;
  options: { value: string; label: string; badge?: string }[];
}> = ({ value, onChange, options }) => (
  <div className="flex border border-gray-200 rounded-lg overflow-hidden">
    {options.map((option) => (
      <button
        key={option.value}
        onClick={() => onChange(option.value as any)}
        className={cn(
          'flex-1 px-6 py-3 text-sm font-medium transition-colors',
          value === option.value
            ? 'bg-gray-900 text-white'
            : 'bg-white text-gray-600 hover:bg-gray-50'
        )}
      >
        <span>{option.label}</span>
        {option.badge && (
          <span className={cn(
            'ml-2 px-2 py-0.5 text-xs font-semibold rounded-full',
            value === option.value
              ? 'bg-white/20 text-white'
              : 'bg-green-100 text-green-700'
          )}>
            {option.badge}
          </span>
        )}
      </button>
    ))}
  </div>
);

// Pattern 4: Animated Price Display
const AnimatedPrice: React.FC<{
  price: number;
  period: string;
  original?: number;
}> = ({ price, period, original }) => {
  const [displayPrice, setDisplayPrice] = React.useState(price);

  React.useEffect(() => {
    // Animate price change
    const start = displayPrice;
    const end = price;
    const duration = 300;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayPrice(Math.round(start + (end - start) * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [price]);

  return (
    <div className="text-center">
      <div className="flex items-baseline justify-center gap-2">
        {original && original > price && (
          <span className="text-xl text-gray-400 line-through">${original}</span>
        )}
        <span className="text-5xl font-bold text-gray-900">${displayPrice}</span>
        <span className="text-gray-500">/{period}</span>
      </div>
    </div>
  );
};
```

**Best Practices:**

1. **Default Selection:** Default to annual (higher LTV)
2. **Savings Display:** Show percentage or dollar savings
3. **Visual Feedback:** Animate toggle state change
4. **Price Animation:** Smooth price transitions
5. **Tooltip Info:** Explain billing details on hover
6. **Mobile Friendly:** Touch-friendly toggle size
7. **Keyboard Access:** Support keyboard navigation
8. **Persistence:** Remember user preference
9. **Clear Labels:** Unambiguous billing period labels
10. **Discount Visibility:** Make savings prominent

**Gotchas:**

1. **Rounding Errors:** Round monthly from annual correctly
2. **Tax Handling:** Indicate if prices exclude tax
3. **Currency Changes:** Handle currency selector interaction
4. **Animation Jank:** Use GPU-accelerated properties
5. **Focus States:** Clear focus indicators for accessibility
6. **Touch vs Click:** Handle both interaction types
7. **State Sync:** Keep toggle and prices synchronized
8. **URL State:** Optionally sync with URL params
9. **Analytics:** Track toggle interactions
10. **AB Testing:** Support testing different defaults

### 3. Feature Comparison

Pricing Grab generates feature comparison components with proper formatting.

#### Feature Analysis

```typescript
interface FeatureComparisonConfig {
  style: 'checkmark' | 'bullet' | 'icon' | 'numbered';
  grouping: 'flat' | 'categorized';
  tooltips: boolean;
  comparison: boolean;
  limits: boolean;
}
```

**Feature Comparison Patterns:**

```typescript
// Pattern 1: Checkmark List with Limits
const FeatureListWithLimits: React.FC<{
  features: {
    name: string;
    included: boolean;
    limit?: string;
    tooltip?: string;
  }[];
  accentColor?: string;
}> = ({ features, accentColor = 'green' }) => (
  <ul className="space-y-4">
    {features.map((feature, index) => (
      <li
        key={index}
        className={cn(
          'flex items-start gap-3',
          !feature.included && 'opacity-50'
        )}
      >
        {feature.included ? (
          <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 text-${accentColor}-500`} />
        ) : (
          <X className="w-5 h-5 flex-shrink-0 mt-0.5 text-gray-300" />
        )}
        <div className="flex-1">
          <span className={cn(
            'text-sm',
            feature.included ? 'text-gray-700' : 'text-gray-400 line-through'
          )}>
            {feature.name}
          </span>
          {feature.limit && (
            <span className="ml-2 text-xs text-gray-500 font-medium">
              ({feature.limit})
            </span>
          )}
        </div>
      </li>
    ))}
  </ul>
);

// Pattern 2: Categorized Features
const CategorizedFeatures: React.FC<{
  categories: {
    name: string;
    features: { name: string; value: string | boolean }[];
  }[];
}> = ({ categories }) => (
  <div className="space-y-6">
    {categories.map((category) => (
      <div key={category.name}>
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {category.name}
        </h4>
        <ul className="space-y-3">
          {category.features.map((feature, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{feature.name}</span>
              <span className="font-medium text-gray-900">
                {typeof feature.value === 'boolean' ? (
                  feature.value ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300" />
                  )
                ) : (
                  feature.value
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    ))}
  </div>
);

// Pattern 3: Expandable Feature Groups
const ExpandableFeatures: React.FC<{
  groups: {
    title: string;
    features: string[];
    defaultOpen?: boolean;
  }[];
}> = ({ groups }) => {
  const [openGroups, setOpenGroups] = React.useState<Set<string>>(
    new Set(groups.filter(g => g.defaultOpen).map(g => g.title))
  );

  const toggleGroup = (title: string) => {
    const newOpen = new Set(openGroups);
    if (newOpen.has(title)) {
      newOpen.delete(title);
    } else {
      newOpen.add(title);
    }
    setOpenGroups(newOpen);
  };

  return (
    <div className="divide-y divide-gray-100">
      {groups.map((group) => (
        <div key={group.title} className="py-4">
          <button
            onClick={() => toggleGroup(group.title)}
            className="w-full flex items-center justify-between text-left"
          >
            <span className="font-medium text-gray-900">{group.title}</span>
            <ChevronDown
              className={cn(
                'w-5 h-5 text-gray-400 transition-transform',
                openGroups.has(group.title) && 'rotate-180'
              )}
            />
          </button>
          {openGroups.has(group.title) && (
            <ul className="mt-3 space-y-2 pl-4">
              {group.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
};

// Pattern 4: "Everything in X plus" Format
const InheritedFeatures: React.FC<{
  baseTier: string;
  additionalFeatures: string[];
}> = ({ baseTier, additionalFeatures }) => (
  <div>
    <p className="text-sm text-gray-500 mb-4">
      Everything in <span className="font-medium text-gray-700">{baseTier}</span>, plus:
    </p>
    <ul className="space-y-3">
      {additionalFeatures.map((feature, i) => (
        <li key={i} className="flex items-center gap-3 text-sm">
          <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
            <Check className="w-3 h-3 text-blue-600" />
          </div>
          <span className="text-gray-700">{feature}</span>
        </li>
      ))}
    </ul>
  </div>
);
```

**Best Practices:**

1. **Scan-ability:** Make features easy to scan
2. **Hierarchy:** Lead with most valuable features
3. **Tooltips:** Explain technical features
4. **Grouping:** Group related features
5. **Differentiation:** Highlight tier differences
6. **Limits:** Show usage limits clearly
7. **Icons:** Use icons for quick recognition
8. **Comparison:** Enable easy cross-tier comparison
9. **Brevity:** Keep feature names concise
10. **Jargon:** Avoid technical jargon

**Gotchas:**

1. **Long Lists:** Use expandable groups for long lists
2. **Alignment:** Align checkmarks across cards
3. **Wrapping:** Handle long feature names
4. **Mobile:** Ensure touch-friendly tooltips
5. **Consistency:** Match feature names across tiers
6. **Updates:** Keep feature lists current
7. **Overflow:** Handle very long feature names
8. **Icons:** Ensure icons are visible on all backgrounds
9. **Screen Readers:** Provide alt text for icons
10. **Localization:** Support translated feature names

### 4. Highlight Popular Plan

Pricing Grab generates highlighted/recommended tier styling.

#### Highlight Analysis

```typescript
interface HighlightConfig {
  type: 'badge' | 'border' | 'scale' | 'background' | 'combined';
  position: 'top' | 'corner' | 'inline';
  label: string;
  animation?: 'pulse' | 'glow' | 'none';
}
```

**Highlight Patterns:**

```typescript
// Pattern 1: Badge + Border + Scale
const PopularCardWrapper: React.FC<{
  children: React.ReactNode;
  popular?: boolean;
}> = ({ children, popular }) => (
  <div
    className={cn(
      'relative rounded-2xl p-8 bg-white transition-all',
      popular
        ? 'border-2 border-blue-500 shadow-xl scale-105 z-10'
        : 'border border-gray-200 hover:shadow-lg'
    )}
  >
    {popular && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
        <span className="px-4 py-1.5 bg-blue-500 text-white text-sm font-semibold rounded-full animate-pulse">
          Most Popular
        </span>
      </div>
    )}
    {children}
  </div>
);

// Pattern 2: Gradient Background
const GradientHighlight: React.FC<{
  children: React.ReactNode;
  highlighted?: boolean;
}> = ({ children, highlighted }) => (
  <div
    className={cn(
      'rounded-2xl p-8 transition-all',
      highlighted
        ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
        : 'bg-white border border-gray-200'
    )}
  >
    {children}
  </div>
);

// Pattern 3: Corner Ribbon
const RibbonHighlight: React.FC<{
  children: React.ReactNode;
  label?: string;
}> = ({ children, label }) => (
  <div className="relative rounded-2xl overflow-hidden bg-white border border-gray-200">
    {label && (
      <div className="absolute top-0 right-0">
        <div className="bg-blue-500 text-white text-xs font-semibold px-8 py-1 transform rotate-45 translate-x-6 translate-y-3">
          {label}
        </div>
      </div>
    )}
    <div className="p-8">{children}</div>
  </div>
);

// Pattern 4: Glow Effect
const GlowHighlight: React.FC<{
  children: React.ReactNode;
  active?: boolean;
}> = ({ children, active }) => (
  <div
    className={cn(
      'relative rounded-2xl p-8 bg-white border transition-all',
      active
        ? 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)]'
        : 'border-gray-200 hover:shadow-lg'
    )}
  >
    {children}
  </div>
);
```

**Best Practices:**

1. **Single Highlight:** Only highlight one tier
2. **Visual Contrast:** Make highlight clearly visible
3. **Label Clarity:** Use clear label like "Most Popular"
4. **Subtle Animation:** Use pulse sparingly
5. **Accessibility:** Don't rely solely on color
6. **Mobile Spacing:** Account for scale on mobile
7. **Z-Index:** Ensure highlighted tier appears on top
8. **Consistency:** Match highlight with brand colors
9. **Position:** Place recommended tier in center
10. **A/B Testing:** Test different highlight styles

**Gotchas:**

1. **Scale Overflow:** Scaled cards may overflow container
2. **Z-Index Stacking:** Handle z-index for hover states
3. **Mobile Layout:** Scale may cause issues on mobile
4. **Touch Targets:** Ensure CTA remains accessible
5. **Animation Performance:** Keep animations lightweight
6. **Print Styles:** Highlight should work in print
7. **High Contrast Mode:** Test in high contrast
8. **Focus States:** Maintain focus visibility
9. **Badge Positioning:** Handle different card heights
10. **Responsive Behavior:** Adjust highlight for breakpoints

## Real-World Examples

### Example 1: SaaS Three-Tier Pricing

**Input:** Screenshot of SaaS pricing page

**Generated Code:**
```typescript
import React, { useState } from 'react';
import { Check, Sparkles, Zap, Building2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const pricingTiers = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'For individuals and small projects',
    icon: <Sparkles className="w-6 h-6" />,
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      { name: 'Up to 3 projects', included: true },
      { name: '1 team member', included: true },
      { name: 'Basic analytics', included: true },
      { name: 'Community support', included: true },
      { name: 'API access', included: false },
      { name: 'Custom integrations', included: false },
      { name: 'Advanced security', included: false },
      { name: 'Dedicated support', included: false },
    ],
    cta: { text: 'Get Started Free', href: '/signup', variant: 'outline' as const },
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For growing teams and businesses',
    icon: <Zap className="w-6 h-6" />,
    monthlyPrice: 49,
    annualPrice: 470,
    features: [
      { name: 'Unlimited projects', included: true },
      { name: 'Up to 10 team members', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Priority support', included: true },
      { name: 'API access', included: true },
      { name: 'Custom integrations', included: true },
      { name: 'Advanced security', included: false },
      { name: 'Dedicated support', included: false },
    ],
    cta: { text: 'Start Free Trial', href: '/signup?plan=pro', variant: 'primary' as const },
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    icon: <Building2 className="w-6 h-6" />,
    monthlyPrice: 199,
    annualPrice: 1990,
    features: [
      { name: 'Unlimited projects', included: true },
      { name: 'Unlimited team members', included: true },
      { name: 'Custom analytics', included: true },
      { name: '24/7 dedicated support', included: true },
      { name: 'API access', included: true },
      { name: 'Custom integrations', included: true },
      { name: 'Advanced security', included: true },
      { name: 'SLA guarantee', included: true },
    ],
    cta: { text: 'Contact Sales', href: '/contact', variant: 'secondary' as const },
    badge: 'Best Value',
  },
];

export const SaaSPricing: React.FC = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');

  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-4">
            Pricing
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Plans that scale with you
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Start free, upgrade when you need. All plans include a 14-day free trial.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-gray-100 rounded-full p-1.5">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={cn(
                'px-6 py-2.5 rounded-full text-sm font-medium transition-all',
                billingPeriod === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={cn(
                'px-6 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2',
                billingPeriod === 'annual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Annual
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs font-semibold',
                billingPeriod === 'annual'
                  ? 'bg-green-500 text-white'
                  : 'bg-green-100 text-green-700'
              )}>
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-6 items-start">
          {pricingTiers.map((tier) => {
            const price = billingPeriod === 'monthly' ? tier.monthlyPrice : tier.annualPrice;
            const monthlyEquivalent = billingPeriod === 'annual'
              ? Math.round(tier.annualPrice / 12)
              : tier.monthlyPrice;

            return (
              <article
                key={tier.id}
                className={cn(
                  'relative bg-white rounded-2xl p-8 transition-all',
                  tier.popular
                    ? 'border-2 border-blue-500 shadow-xl lg:scale-105 z-10'
                    : 'border border-gray-200 hover:shadow-lg hover:border-gray-300'
                )}
              >
                {/* Badge */}
                {(tier.popular || tier.badge) && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className={cn(
                      'px-4 py-1.5 text-sm font-semibold rounded-full',
                      tier.popular
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-900 text-white'
                    )}>
                      {tier.popular ? 'Most Popular' : tier.badge}
                    </span>
                  </div>
                )}

                {/* Header */}
                <div className="text-center mb-8 pt-4">
                  <div className={cn(
                    'w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4',
                    tier.popular ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  )}>
                    {tier.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                  <p className="text-gray-600">{tier.description}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-8">
                  {tier.monthlyPrice === 0 ? (
                    <div className="text-5xl font-bold text-gray-900">Free</div>
                  ) : (
                    <>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-5xl font-bold text-gray-900">
                          ${monthlyEquivalent}
                        </span>
                        <span className="text-gray-500 text-lg">/mo</span>
                      </div>
                      {billingPeriod === 'annual' && (
                        <p className="text-sm text-gray-500 mt-1">
                          Billed ${price} annually
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* CTA */}
                <a
                  href={tier.cta.href}
                  className={cn(
                    'w-full py-4 px-6 rounded-xl font-semibold text-center block mb-8 transition-all',
                    tier.cta.variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/25',
                    tier.cta.variant === 'secondary' && 'bg-gray-900 text-white hover:bg-gray-800',
                    tier.cta.variant === 'outline' && 'border-2 border-gray-300 text-gray-900 hover:border-gray-400 hover:bg-gray-50'
                  )}
                >
                  {tier.cta.text}
                </a>

                {/* Features */}
                <ul className="space-y-4">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className={cn(
                          'w-5 h-5 flex-shrink-0 mt-0.5',
                          tier.popular ? 'text-blue-500' : 'text-green-500'
                        )} />
                      ) : (
                        <div className="w-5 h-5 flex-shrink-0" />
                      )}
                      <span className={cn(
                        'text-sm',
                        feature.included ? 'text-gray-700' : 'text-gray-400'
                      )}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>

        {/* Guarantees */}
        <div className="mt-16 flex flex-wrap justify-center gap-8">
          <div className="flex items-center gap-3 text-gray-600">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <span>14-day free trial</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-green-600" />
            </div>
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>
    </section>
  );
};
```

### Example 2: Feature Comparison Table

**Input:** Screenshot of pricing comparison table

**Generated Code:**
```typescript
import React, { useState } from 'react';
import { Check, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureCategory {
  category: string;
  features: {
    name: string;
    starter: boolean | string;
    pro: boolean | string;
    enterprise: boolean | string;
  }[];
}

const comparisonData: FeatureCategory[] = [
  {
    category: 'Core Features',
    features: [
      { name: 'Projects', starter: '3', pro: 'Unlimited', enterprise: 'Unlimited' },
      { name: 'Team members', starter: '1', pro: '10', enterprise: 'Unlimited' },
      { name: 'Storage', starter: '1 GB', pro: '50 GB', enterprise: 'Unlimited' },
    ],
  },
  {
    category: 'Security',
    features: [
      { name: 'SSL encryption', starter: true, pro: true, enterprise: true },
      { name: 'Two-factor auth', starter: true, pro: true, enterprise: true },
      { name: 'SSO / SAML', starter: false, pro: false, enterprise: true },
      { name: 'Audit logs', starter: false, pro: true, enterprise: true },
    ],
  },
];

export const ComparisonTable: React.FC = () => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="py-6 px-4 text-left w-2/5">Features</th>
            <th className="py-6 px-4 text-center">Starter<br/><span className="text-gray-500 font-normal">$0/mo</span></th>
            <th className="py-6 px-4 text-center bg-blue-50">Pro<br/><span className="text-gray-500 font-normal">$49/mo</span></th>
            <th className="py-6 px-4 text-center">Enterprise<br/><span className="text-gray-500 font-normal">Custom</span></th>
          </tr>
        </thead>
        <tbody>
          {comparisonData.map((cat) => (
            <React.Fragment key={cat.category}>
              <tr className="bg-gray-50">
                <td colSpan={4} className="py-3 px-4 font-semibold">{cat.category}</td>
              </tr>
              {cat.features.map((f, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-4 px-4 text-gray-700">{f.name}</td>
                  <td className="py-4 px-4 text-center">
                    {typeof f.starter === 'boolean' ? (f.starter ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-gray-300 mx-auto" />) : f.starter}
                  </td>
                  <td className="py-4 px-4 text-center bg-blue-50/50">
                    {typeof f.pro === 'boolean' ? (f.pro ? <Check className="w-5 h-5 text-blue-500 mx-auto" /> : <X className="w-5 h-5 text-gray-300 mx-auto" />) : <span className="font-medium">{f.pro}</span>}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {typeof f.enterprise === 'boolean' ? (f.enterprise ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-gray-300 mx-auto" />) : f.enterprise}
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-200">
            <td className="py-6 px-4"></td>
            <td className="py-6 px-4 text-center">
              <a href="/signup" className="inline-block px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50">
                Get Started
              </a>
            </td>
            <td className="py-6 px-4 text-center">
              <a href="/signup?plan=pro" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
                Start Trial
              </a>
            </td>
            <td className="py-6 px-4 text-center">
              <a href="/contact" className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800">
                Contact Sales
              </a>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
```

## Related Skills

- **react-grab** - General React component extraction
- **hero-grab** - Hero section generation
- **card-grab** - Card component generation
- **modal-grab** - Modal dialog generation
- **table-grab** - Data table generation
- **form-grab** - Form component generation

## Further Reading

### Official Documentation
- [SaaS Pricing Best Practices](https://www.priceintelligently.com/)
- [Stripe Checkout](https://stripe.com/docs/checkout)
- [Paddle Billing](https://developer.paddle.com/)

### Design Resources
- [Pricing Page Examples](https://saaspages.xyz/pricing)
- [Pricing Psychology](https://www.nickkolenda.com/pricing-psychology/)
- [Conversion Optimization](https://cxl.com/blog/pricing-page/)

### Accessibility
- [WCAG Tables](https://www.w3.org/WAI/tutorials/tables/)
- [Accessible Pricing](https://www.a11yproject.com/)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
*Last updated: 2025-12-04*
