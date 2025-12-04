# PRICING-GRAB Skill

## Overview
Generate production-ready pricing table components with feature comparison, toggle periods, highlighted tiers, and CTAs. Supports monthly/yearly toggle, feature lists, and badges.

## Metadata
- **ID**: `pricing-grab`
- **Category**: Component Generation
- **Complexity**: Intermediate
- **Prerequisites**: React 18+, TypeScript
- **Estimated Time**: 10-15 minutes

## Capabilities
- Multiple pricing tiers
- Monthly/yearly billing toggle
- Feature comparison
- Highlighted/popular plans
- Custom CTAs per tier
- Add-ons and extras
- Enterprise custom pricing
- Responsive layouts
- Badge indicators

## Pricing Component Patterns

### 1. Basic Pricing Table
```typescript
import React, { useState } from 'react';

interface PricingFeature {
  text: string;
  included: boolean;
  tooltip?: string;
}

interface PricingTier {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: PricingFeature[];
  cta: {
    label: string;
    onClick: () => void;
  };
  popular?: boolean;
  badge?: string;
}

interface PricingTableProps {
  tiers: PricingTier[];
  billingPeriod?: 'monthly' | 'yearly';
  showToggle?: boolean;
  className?: string;
}

export function PricingTable({
  tiers,
  billingPeriod: initialPeriod = 'monthly',
  showToggle = true,
  className = '',
}: PricingTableProps) {
  const [period, setPeriod] = useState<'monthly' | 'yearly'>(initialPeriod);

  const discount = 20; // 20% off for yearly

  return (
    <section className={`py-20 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {showToggle && (
          <div className="flex justify-center items-center gap-4 mb-12">
            <span
              className={`text-lg ${
                period === 'monthly' ? 'font-semibold text-gray-900' : 'text-gray-600'
              }`}
            >
              Monthly
            </span>
            <button
              onClick={() => setPeriod(period === 'monthly' ? 'yearly' : 'monthly')}
              className={`
                relative inline-flex h-8 w-16 items-center rounded-full transition-colors
                ${period === 'yearly' ? 'bg-blue-600' : 'bg-gray-300'}
              `}
            >
              <span
                className={`
                  inline-block h-6 w-6 transform rounded-full bg-white transition-transform
                  ${period === 'yearly' ? 'translate-x-9' : 'translate-x-1'}
                `}
              />
            </button>
            <span
              className={`text-lg ${
                period === 'yearly' ? 'font-semibold text-gray-900' : 'text-gray-600'
              }`}
            >
              Yearly
              <span className="ml-2 text-sm text-green-600 font-medium">
                Save {discount}%
              </span>
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {tiers.map((tier, index) => {
            const price = period === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice;

            return (
              <div
                key={index}
                className={`
                  relative rounded-2xl border-2 bg-white p-8 shadow-sm
                  ${
                    tier.popular
                      ? 'border-blue-600 shadow-lg scale-105'
                      : 'border-gray-200'
                  }
                `}
              >
                {tier.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full">
                    {tier.badge}
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {tier.name}
                  </h3>
                  <p className="text-gray-600">{tier.description}</p>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-gray-900">${price}</span>
                    <span className="ml-2 text-gray-600">
                      /{period === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  </div>
                  {period === 'yearly' && (
                    <p className="mt-2 text-sm text-gray-600">
                      Billed ${tier.yearlyPrice} annually
                    </p>
                  )}
                </div>

                <button
                  onClick={tier.cta.onClick}
                  className={`
                    w-full px-6 py-3 rounded-lg font-medium transition-colors mb-8
                    ${
                      tier.popular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-white text-gray-900 border-2 border-gray-300 hover:border-gray-400'
                    }
                  `}
                >
                  {tier.cta.label}
                </button>

                <ul className="space-y-4">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      {feature.included ? (
                        <svg
                          className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
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
                      ) : (
                        <svg
                          className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                      <span
                        className={
                          feature.included ? 'text-gray-900' : 'text-gray-400'
                        }
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

### 2. Feature Comparison Table
```typescript
interface ComparisonFeature {
  category: string;
  features: Array<{
    name: string;
    description?: string;
    tiers: Record<string, boolean | string | number>;
  }>;
}

interface ComparisonTableProps {
  tierNames: string[];
  features: ComparisonFeature[];
}

export function ComparisonTable({ tierNames, features }: ComparisonTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900">
              Features
            </th>
            {tierNames.map((tier) => (
              <th
                key={tier}
                className="py-4 px-6 text-center text-sm font-semibold text-gray-900"
              >
                {tier}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((category, categoryIndex) => (
            <React.Fragment key={categoryIndex}>
              <tr className="bg-gray-50">
                <td
                  colSpan={tierNames.length + 1}
                  className="py-3 px-6 text-sm font-semibold text-gray-900"
                >
                  {category.category}
                </td>
              </tr>
              {category.features.map((feature, featureIndex) => (
                <tr
                  key={featureIndex}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="py-4 px-6">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {feature.name}
                      </div>
                      {feature.description && (
                        <div className="text-xs text-gray-600 mt-1">
                          {feature.description}
                        </div>
                      )}
                    </div>
                  </td>
                  {tierNames.map((tier) => {
                    const value = feature.tiers[tier];
                    return (
                      <td key={tier} className="py-4 px-6 text-center">
                        {typeof value === 'boolean' ? (
                          value ? (
                            <svg
                              className="w-5 h-5 text-green-600 mx-auto"
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
                          ) : (
                            <svg
                              className="w-5 h-5 text-gray-300 mx-auto"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          )
                        ) : (
                          <span className="text-sm text-gray-900">{value}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 3. Enterprise Pricing Card
```typescript
interface EnterprisePricingProps {
  title?: string;
  description?: string;
  features: string[];
  ctaLabel?: string;
  onContact: () => void;
}

export function EnterprisePricing({
  title = 'Enterprise',
  description = 'Custom solutions for large organizations',
  features,
  ctaLabel = 'Contact Sales',
  onContact,
}: EnterprisePricingProps) {
  return (
    <div className="rounded-2xl border-2 border-gray-900 bg-gray-900 p-8 shadow-xl text-white">
      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-gray-300">{description}</p>
      </div>

      <div className="mb-8">
        <div className="text-4xl font-bold">Custom</div>
        <p className="mt-2 text-gray-300">Let's talk about your needs</p>
      </div>

      <button
        onClick={onContact}
        className="w-full px-6 py-3 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors mb-8"
      >
        {ctaLabel}
      </button>

      <ul className="space-y-4">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5"
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
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 4. Add-ons Section
```typescript
interface Addon {
  name: string;
  description: string;
  price: number;
  period: 'month' | 'year';
  icon: React.ReactNode;
}

interface AddonsProps {
  addons: Addon[];
  onSelect: (addon: Addon) => void;
}

export function Addons({ addons, onSelect }: AddonsProps) {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Powerful Add-ons
          </h2>
          <p className="text-lg text-gray-600">
            Enhance your plan with additional features
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {addons.map((addon, index) => (
            <div
              key={index}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                {addon.icon}
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {addon.name}
              </h3>

              <p className="text-sm text-gray-600 mb-4">{addon.description}</p>

              <div className="flex items-baseline mb-4">
                <span className="text-2xl font-bold text-gray-900">
                  ${addon.price}
                </span>
                <span className="ml-1 text-gray-600">/{addon.period}</span>
              </div>

              <button
                onClick={() => onSelect(addon)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add to Plan
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

## Usage Examples

### Complete Pricing Page
```typescript
const pricingTiers: PricingTier[] = [
  {
    name: 'Starter',
    description: 'Perfect for individuals',
    monthlyPrice: 9,
    yearlyPrice: 90,
    features: [
      { text: '10 projects', included: true },
      { text: '5 GB storage', included: true },
      { text: 'Basic support', included: true },
      { text: 'Advanced analytics', included: false },
    ],
    cta: {
      label: 'Start Free Trial',
      onClick: () => router.push('/signup?plan=starter'),
    },
  },
  {
    name: 'Pro',
    description: 'Best for small teams',
    monthlyPrice: 29,
    yearlyPrice: 290,
    popular: true,
    badge: 'Most Popular',
    features: [
      { text: 'Unlimited projects', included: true },
      { text: '50 GB storage', included: true },
      { text: 'Priority support', included: true },
      { text: 'Advanced analytics', included: true },
    ],
    cta: {
      label: 'Start Free Trial',
      onClick: () => router.push('/signup?plan=pro'),
    },
  },
];

<PricingTable tiers={pricingTiers} showToggle />
```

## Best Practices

1. **Clarity**
   - Clear pricing structure
   - Transparent features
   - No hidden costs
   - Easy comparison

2. **Psychology**
   - Highlight popular plan
   - Show savings for yearly
   - Use social proof
   - Clear value proposition

3. **Conversion**
   - Strong CTAs
   - Free trial option
   - Easy upgrade path
   - Trust indicators

4. **Mobile**
   - Stacked layout
   - Touch-friendly
   - Readable pricing
   - Easy comparison

## Generated: 2025-01-04
Version: 1.0.0
