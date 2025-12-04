# HERO-GRAB Skill

## Overview
Generate production-ready hero section components with various layouts, animations, and content patterns. Supports centered heroes, split layouts, with images, videos, and CTAs.

## Metadata
- **ID**: `hero-grab`
- **Category**: Component Generation
- **Complexity**: Intermediate
- **Prerequisites**: React 18+, TypeScript
- **Estimated Time**: 10-15 minutes

## Capabilities
- Centered hero sections
- Split hero with image/content
- Hero with background video
- Hero with image slider
- Animated hero elements
- CTA buttons and forms
- Social proof elements
- Mobile-responsive layouts
- Gradient and overlay effects

## Hero Component Patterns

### 1. Centered Hero
```typescript
import React from 'react';

interface CenteredHeroProps {
  badge?: string;
  title: string;
  subtitle: string;
  primaryCTA?: {
    label: string;
    onClick: () => void;
  };
  secondaryCTA?: {
    label: string;
    onClick: () => void;
  };
  features?: string[];
  trustIndicators?: React.ReactNode;
  className?: string;
}

export function CenteredHero({
  badge,
  title,
  subtitle,
  primaryCTA,
  secondaryCTA,
  features,
  trustIndicators,
  className = '',
}: CenteredHeroProps) {
  return (
    <section className={`relative overflow-hidden bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32">
        <div className="text-center max-w-4xl mx-auto">
          {badge && (
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-6">
              {badge}
            </div>
          )}

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            {title}
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {subtitle}
          </p>

          {(primaryCTA || secondaryCTA) && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              {primaryCTA && (
                <button
                  onClick={primaryCTA.onClick}
                  className="px-8 py-4 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
                >
                  {primaryCTA.label}
                </button>
              )}
              {secondaryCTA && (
                <button
                  onClick={secondaryCTA.onClick}
                  className="px-8 py-4 bg-white text-gray-700 text-lg font-medium border-2 border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                >
                  {secondaryCTA.label}
                </button>
              )}
            </div>
          )}

          {features && (
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-green-600"
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
                  {feature}
                </div>
              ))}
            </div>
          )}

          {trustIndicators && (
            <div className="mt-12">{trustIndicators}</div>
          )}
        </div>
      </div>

      {/* Background Decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      </div>
    </section>
  );
}
```

### 2. Split Hero with Image
```typescript
interface SplitHeroProps {
  badge?: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  imageAlt: string;
  imagePosition?: 'left' | 'right';
  primaryCTA?: {
    label: string;
    onClick: () => void;
  };
  secondaryCTA?: {
    label: string;
    onClick: () => void;
  };
  features?: Array<{
    icon: React.ReactNode;
    title: string;
    description: string;
  }>;
}

export function SplitHero({
  badge,
  title,
  subtitle,
  description,
  image,
  imageAlt,
  imagePosition = 'right',
  primaryCTA,
  secondaryCTA,
  features,
}: SplitHeroProps) {
  const content = (
    <div className="flex flex-col justify-center">
      {badge && (
        <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-6 w-fit">
          {badge}
        </div>
      )}

      <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
        {title}
      </h1>

      <p className="text-xl text-blue-600 font-semibold mb-4">{subtitle}</p>

      <p className="text-lg text-gray-600 mb-8">{description}</p>

      {(primaryCTA || secondaryCTA) && (
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {primaryCTA && (
            <button
              onClick={primaryCTA.onClick}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              {primaryCTA.label}
            </button>
          )}
          {secondaryCTA && (
            <button
              onClick={secondaryCTA.onClick}
              className="px-6 py-3 bg-white text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {secondaryCTA.label}
            </button>
          )}
        </div>
      )}

      {features && (
        <div className="space-y-4">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 text-blue-600">
                {feature.icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const imageContent = (
    <div className="relative">
      <img
        src={image}
        alt={imageAlt}
        className="rounded-lg shadow-2xl w-full h-auto"
      />
      {/* Decorative elements */}
      <div className="absolute -bottom-6 -right-6 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -z-10" />
    </div>
  );

  return (
    <section className="relative overflow-hidden bg-white py-20 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {imagePosition === 'left' ? (
            <>
              {imageContent}
              {content}
            </>
          ) : (
            <>
              {content}
              {imageContent}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
```

### 3. Hero with Video Background
```typescript
interface VideoHeroProps {
  videoUrl: string;
  posterImage?: string;
  title: string;
  subtitle: string;
  primaryCTA?: {
    label: string;
    onClick: () => void;
  };
  secondaryCTA?: {
    label: string;
    onClick: () => void;
  };
  overlayOpacity?: number;
}

export function VideoHero({
  videoUrl,
  posterImage,
  title,
  subtitle,
  primaryCTA,
  secondaryCTA,
  overlayOpacity = 0.5,
}: VideoHeroProps) {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        poster={posterImage}
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={videoUrl} type="video/mp4" />
      </video>

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black"
        style={{ opacity: overlayOpacity }}
      />

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
          {title}
        </h1>

        <p className="text-xl sm:text-2xl text-gray-200 mb-8 max-w-2xl mx-auto">
          {subtitle}
        </p>

        {(primaryCTA || secondaryCTA) && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {primaryCTA && (
              <button
                onClick={primaryCTA.onClick}
                className="px-8 py-4 bg-white text-gray-900 text-lg font-medium rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                {primaryCTA.label}
              </button>
            )}
            {secondaryCTA && (
              <button
                onClick={secondaryCTA.onClick}
                className="px-8 py-4 bg-transparent text-white text-lg font-medium border-2 border-white rounded-lg hover:bg-white hover:text-gray-900 transition-colors"
              >
                {secondaryCTA.label}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>
    </section>
  );
}
```

### 4. Hero with Email Signup
```typescript
interface EmailHeroProps {
  title: string;
  subtitle: string;
  placeholder?: string;
  buttonText?: string;
  onSubmit: (email: string) => void | Promise<void>;
  features?: string[];
  trustBadge?: React.ReactNode;
}

export function EmailHero({
  title,
  subtitle,
  placeholder = 'Enter your email',
  buttonText = 'Get Started',
  onSubmit,
  features,
  trustBadge,
}: EmailHeroProps) {
  const [email, setEmail] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit(email);
    setIsSubmitting(false);
    setEmail('');
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-purple-700 text-white py-20 sm:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
          {title}
        </h1>

        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          {subtitle}
        </p>

        <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={placeholder}
              required
              className="flex-1 px-6 py-4 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-4 bg-white text-blue-600 font-medium rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {isSubmitting ? 'Submitting...' : buttonText}
            </button>
          </div>
        </form>

        {features && (
          <div className="flex flex-wrap justify-center gap-6 text-sm text-blue-100 mb-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                {feature}
              </div>
            ))}
          </div>
        )}

        {trustBadge && <div className="mt-8">{trustBadge}</div>}
      </div>
    </section>
  );
}
```

## Usage Examples

### Centered Hero
```typescript
<CenteredHero
  badge="🎉 New Feature Launch"
  title="Build Amazing Products Faster"
  subtitle="The all-in-one platform for modern teams to ship better software."
  primaryCTA={{
    label: 'Get Started Free',
    onClick: () => router.push('/signup'),
  }}
  secondaryCTA={{
    label: 'View Demo',
    onClick: () => setShowDemo(true),
  }}
  features={[
    'No credit card required',
    '14-day free trial',
    'Cancel anytime',
  ]}
  trustIndicators={
    <div className="flex items-center justify-center gap-8">
      <Logo1 />
      <Logo2 />
      <Logo3 />
    </div>
  }
/>
```

### Split Hero
```typescript
<SplitHero
  badge="🚀 Version 2.0"
  title="Scale Your Business"
  subtitle="With Enterprise-Grade Tools"
  description="Built for teams of all sizes. Get the power of enterprise software with the simplicity of a modern product."
  image="/hero-dashboard.png"
  imageAlt="Dashboard Preview"
  imagePosition="right"
  primaryCTA={{
    label: 'Start Free Trial',
    onClick: () => router.push('/signup'),
  }}
  features={[
    {
      icon: <CheckIcon />,
      title: 'Fast Setup',
      description: 'Get started in minutes',
    },
    {
      icon: <ShieldIcon />,
      title: 'Secure',
      description: 'Enterprise-grade security',
    },
  ]}
/>
```

## Best Practices

1. **Content**
   - Clear value proposition
   - Strong call-to-action
   - Social proof elements
   - Benefit-focused copy

2. **Design**
   - Visual hierarchy
   - Whitespace usage
   - Color contrast
   - Responsive images

3. **Performance**
   - Optimize images
   - Lazy load videos
   - Minimize animations
   - Fast initial load

4. **Conversion**
   - Single clear CTA
   - Trust indicators
   - Minimal friction
   - Mobile optimization

## Generated: 2025-01-04
Version: 1.0.0
