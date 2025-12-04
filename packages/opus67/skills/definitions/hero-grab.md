# Hero Grab

> **ID:** `hero-grab`
> **Tier:** 2
> **Token Cost:** 6500
> **MCP Connections:** context7

## What This Skill Does

Hero Grab is a specialized GRAB skill that transforms hero section screenshots into production-ready React components. It analyzes visual hierarchy, background treatments, typography, CTAs, and animations to generate pixel-perfect hero sections with proper responsive behavior.

**Core Transformation:**
- Visual Design (Screenshot/URL/Figma) to Hero Component Code
- Automatic background treatment detection (images, videos, gradients, patterns)
- CTA button extraction and styling
- Animation integration (Framer Motion, CSS)
- Responsive typography scaling
- Overlay and gradient generation

**What Makes It Different:**
Hero Grab understands the psychology of hero sections - visual hierarchy, attention flow, and conversion optimization. It generates hero components that are not just visually accurate but also performant and conversion-focused.

## When to Use

This skill is automatically loaded when:

- **Keywords:** hero, grab hero, banner, landing, above the fold, headline, splash
- **File Types:** .png, .jpg, .jpeg, .webp (screenshots/mockups)
- **Directories:** N/A

**Ideal Use Cases:**
1. Converting landing page hero sections to React
2. Recreating competitor hero designs
3. Prototyping marketing pages
4. Building startup landing pages
5. Creating product launch pages
6. SaaS homepage hero sections

## Core Capabilities

### 1. Hero Section Conversion

The primary transformation converts visual hero designs into structured React components.

#### Visual Analysis Pipeline

**Step 1: Layout Detection**
```typescript
// Hero Grab analyzes the visual structure
interface HeroAnalysis {
  layout: {
    type: 'centered' | 'split' | 'asymmetric' | 'fullscreen';
    alignment: 'left' | 'center' | 'right';
    contentPosition: 'top' | 'center' | 'bottom';
    hasOverlay: boolean;
    overlayType: 'gradient' | 'solid' | 'blur' | 'none';
  };
  background: {
    type: 'image' | 'video' | 'gradient' | 'pattern' | 'solid';
    treatment: 'parallax' | 'fixed' | 'scroll';
    darkMode: boolean;
  };
  elements: {
    badge: boolean;
    heading: TextElement;
    subheading: TextElement;
    ctas: CTAElement[];
    media: MediaElement | null;
    socialProof: SocialProofElement | null;
  };
}
```

**Step 2: Component Generation**

```typescript
// Example: Centered hero with image background
// INPUT: Screenshot analysis
// OUTPUT: Production-ready component

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface HeroProps {
  badge?: string;
  heading: string;
  subheading: string;
  primaryCTA: {
    text: string;
    href: string;
  };
  secondaryCTA?: {
    text: string;
    href: string;
  };
  backgroundImage: string;
  stats?: Array<{ value: string; label: string }>;
}

export const HeroSection: React.FC<HeroProps> = ({
  badge,
  heading,
  subheading,
  primaryCTA,
  secondaryCTA,
  backgroundImage,
  stats,
}) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src={backgroundImage}
          alt="Hero background"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        {/* Badge */}
        {badge && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20"
          >
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-white">{badge}</span>
          </motion.div>
        )}

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-tight"
        >
          {heading}
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg sm:text-xl md:text-2xl text-gray-200 mb-10 max-w-3xl mx-auto leading-relaxed"
        >
          {subheading}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href={primaryCTA.href}
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-2xl hover:shadow-blue-500/25 hover:scale-105"
          >
            {primaryCTA.text}
            <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>

          {secondaryCTA && (
            <a
              href={secondaryCTA.href}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white border-2 border-white/30 rounded-full hover:bg-white/10 transition-all duration-200"
            >
              {secondaryCTA.text}
            </a>
          )}
        </motion.div>

        {/* Stats */}
        {stats && stats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 bg-white rounded-full"
          />
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
```

**Best Practices:**

1. **Image Priority:** Use `priority` on hero images for LCP optimization
2. **Responsive Typography:** Scale font sizes across breakpoints
3. **Accessible CTAs:** Use semantic elements and proper contrast ratios
4. **Progressive Enhancement:** Hero works without JavaScript
5. **Overlay Contrast:** Ensure text readable over any background
6. **Loading Strategy:** Preload hero images in `<head>`
7. **Animation Performance:** Use transform and opacity for animations
8. **Mobile First:** Design for mobile, enhance for desktop
9. **Viewport Height:** Use min-h-screen with dvh fallback
10. **Font Loading:** Preload hero fonts for FOUT prevention

**Common Patterns:**

```typescript
// Pattern 1: Split Hero (Text + Image)
const SplitHero = () => (
  <section className="min-h-screen flex items-center">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Content Side */}
        <div className="order-2 lg:order-1">
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Build faster with modern tools
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Everything you need to ship products quickly.
          </p>
          <div className="flex gap-4">
            <Button size="lg">Get Started</Button>
            <Button size="lg" variant="outline">Learn More</Button>
          </div>
        </div>

        {/* Image Side */}
        <div className="order-1 lg:order-2">
          <div className="relative aspect-square">
            <Image src="/hero-image.png" alt="Product" fill className="object-contain" />
          </div>
        </div>
      </div>
    </div>
  </section>
);

// Pattern 2: Video Background Hero
const VideoHero = () => (
  <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
    {/* Video Background */}
    <video
      autoPlay
      loop
      muted
      playsInline
      className="absolute inset-0 w-full h-full object-cover"
    >
      <source src="/hero-video.mp4" type="video/mp4" />
    </video>
    <div className="absolute inset-0 bg-black/60" />

    {/* Content */}
    <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
      <h1 className="text-5xl md:text-7xl font-bold mb-6">
        Experience the Future
      </h1>
      <p className="text-xl md:text-2xl mb-8 text-gray-200">
        Immersive experiences that captivate and convert.
      </p>
      <Button size="lg" className="bg-white text-black hover:bg-gray-100">
        Watch Demo
      </Button>
    </div>
  </section>
);

// Pattern 3: Gradient Background Hero
const GradientHero = () => (
  <section className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center">
    {/* Decorative Elements */}
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
    </div>

    {/* Content */}
    <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
      <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur mb-8">
        <span className="text-sm font-medium">Announcing v2.0</span>
      </div>
      <h1 className="text-5xl md:text-7xl font-bold mb-6">
        The all-in-one platform
      </h1>
      <p className="text-xl md:text-2xl mb-10 text-white/80">
        Build, deploy, and scale with confidence.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
          Start Free Trial
        </Button>
        <Button size="lg" variant="outline" className="border-white/30 hover:bg-white/10">
          Schedule Demo
        </Button>
      </div>
    </div>
  </section>
);

// Pattern 4: Hero with App Preview
const AppPreviewHero = () => (
  <section className="min-h-screen bg-gray-900 flex items-center overflow-hidden">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
          Your workspace, reimagined
        </h1>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          A beautiful interface that makes work feel effortless.
        </p>
        <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
          Try It Free
        </Button>
      </div>

      {/* App Preview */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent z-10" />
        <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-800">
          <Image
            src="/app-screenshot.png"
            alt="App preview"
            width={1200}
            height={800}
            className="w-full"
          />
        </div>
      </div>
    </div>
  </section>
);
```

**Gotchas:**

1. **Viewport Height Issues:** iOS Safari has dynamic vh; use dvh or JS fallback
2. **Video Autoplay:** Requires muted for autoplay; add fallback image
3. **Font Loading Flash:** Preload fonts or use font-display: swap
4. **CLS on Images:** Set explicit width/height or use aspect-ratio
5. **Overlay Consistency:** Test overlay on all image regions
6. **Z-Index Stacking:** Create clear z-index hierarchy
7. **Touch vs Click:** CTAs need both hover and active states
8. **Scroll Indicators:** Hide on mobile or make touch-friendly
9. **Background Position:** Use object-position for focal point
10. **Performance Budget:** Hero images should be < 200KB optimized

### 2. CTA Button Styling

CTAs are the most critical element of hero sections. Hero Grab extracts and generates optimized call-to-action buttons.

#### CTA Analysis

```typescript
interface CTAAnalysis {
  type: 'primary' | 'secondary' | 'tertiary';
  style: 'solid' | 'outline' | 'ghost' | 'gradient';
  size: 'sm' | 'md' | 'lg' | 'xl';
  shape: 'rounded' | 'pill' | 'square';
  icon: {
    position: 'left' | 'right' | 'none';
    type: string;
  };
  animation: 'none' | 'hover-scale' | 'hover-glow' | 'pulse';
}
```

**CTA Generation:**

```typescript
// Comprehensive CTA button system extracted from hero designs

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  href?: string;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'right',
  loading = false,
  disabled = false,
  fullWidth = false,
  className,
  href,
  onClick,
}) => {
  const baseStyles = `
    inline-flex items-center justify-center
    font-semibold
    rounded-full
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variants = {
    primary: `
      bg-gradient-to-r from-blue-600 to-purple-600
      hover:from-blue-700 hover:to-purple-700
      text-white
      shadow-lg hover:shadow-xl hover:shadow-blue-500/25
      hover:scale-105 active:scale-100
      focus:ring-blue-500
    `,
    secondary: `
      bg-gray-900 hover:bg-gray-800
      text-white
      shadow-lg hover:shadow-xl
      hover:scale-105 active:scale-100
      focus:ring-gray-500
    `,
    outline: `
      border-2 border-gray-300 hover:border-gray-400
      bg-transparent hover:bg-gray-50
      text-gray-900
      focus:ring-gray-500
    `,
    ghost: `
      bg-transparent hover:bg-gray-100
      text-gray-600 hover:text-gray-900
      focus:ring-gray-500
    `,
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm gap-1.5',
    md: 'px-6 py-2.5 text-base gap-2',
    lg: 'px-8 py-3.5 text-lg gap-2.5',
    xl: 'px-10 py-4 text-xl gap-3',
  };

  const combinedClassName = cn(
    baseStyles,
    variants[variant],
    sizes[size],
    fullWidth && 'w-full',
    className
  );

  const content = (
    <>
      {loading && (
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {!loading && icon && iconPosition === 'left' && icon}
      <span>{children}</span>
      {!loading && icon && iconPosition === 'right' && icon}
    </>
  );

  if (href) {
    return (
      <a href={href} className={combinedClassName}>
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={combinedClassName}
    >
      {content}
    </button>
  );
};

// Arrow Icon Component
const ArrowIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

// Play Icon Component
const PlayIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

// Usage Examples
const CTAExamples = () => (
  <div className="space-y-4">
    {/* Primary with arrow */}
    <Button variant="primary" size="lg" icon={<ArrowIcon />}>
      Get Started Free
    </Button>

    {/* Secondary outline */}
    <Button variant="outline" size="lg" icon={<PlayIcon />} iconPosition="left">
      Watch Demo
    </Button>

    {/* Ghost text link */}
    <Button variant="ghost" size="md">
      Learn More
    </Button>
  </div>
);
```

**Best Practices:**

1. **Contrast Ratio:** WCAG AA minimum 4.5:1 for text
2. **Touch Target:** Minimum 44x44px on mobile
3. **Focus States:** Visible focus ring for accessibility
4. **Loading States:** Show spinner during async actions
5. **Disabled States:** Clear visual indication
6. **Hover Animation:** Subtle scale or color shift
7. **Primary Hierarchy:** One primary CTA per section
8. **Action Words:** Use verbs that indicate outcome
9. **Urgency Signals:** "Free", "Now", "Today" increase clicks
10. **Icon Enhancement:** Icons improve comprehension

**Common Patterns:**

```typescript
// Pattern 1: Gradient Button with Glow
const GlowButton = ({ children }: { children: React.ReactNode }) => (
  <button className="
    relative px-8 py-4 text-lg font-semibold text-white
    bg-gradient-to-r from-blue-600 to-purple-600
    rounded-full overflow-hidden
    group
  ">
    <span className="
      absolute inset-0
      bg-gradient-to-r from-blue-600 to-purple-600
      blur-xl opacity-50 group-hover:opacity-75
      transition-opacity
    " />
    <span className="relative">{children}</span>
  </button>
);

// Pattern 2: Animated Border Button
const AnimatedBorderButton = ({ children }: { children: React.ReactNode }) => (
  <button className="
    relative px-8 py-4 text-lg font-semibold
    bg-gray-900 text-white
    rounded-full overflow-hidden
    group
  ">
    <span className="
      absolute inset-0
      bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500
      animate-spin-slow
      blur-sm
    " />
    <span className="
      absolute inset-[2px]
      bg-gray-900
      rounded-full
    " />
    <span className="relative">{children}</span>
  </button>
);

// Pattern 3: Icon Reveal Button
const IconRevealButton = ({ children }: { children: React.ReactNode }) => (
  <button className="
    group px-8 py-4 text-lg font-semibold
    bg-blue-600 text-white
    rounded-full
    hover:bg-blue-700
    transition-all duration-200
  ">
    <span className="flex items-center gap-2">
      {children}
      <svg
        className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>
    </span>
  </button>
);

// Pattern 4: Dual CTA Layout
const DualCTALayout = () => (
  <div className="flex flex-col sm:flex-row gap-4 justify-center">
    <Button variant="primary" size="lg" icon={<ArrowIcon />}>
      Start Free Trial
    </Button>
    <Button variant="outline" size="lg" icon={<PlayIcon />} iconPosition="left">
      Watch Demo
    </Button>
  </div>
);
```

**Gotchas:**

1. **Text Cutoff:** Long text may overflow; add text truncation
2. **Gradient Text:** Requires background-clip and text-fill-color
3. **Focus Visibility:** focus-visible prevents focus on click
4. **Button vs Link:** Use button for actions, link for navigation
5. **Form Submit:** Button type defaults to "submit" in forms
6. **Disabled Links:** Links can't be disabled; use button
7. **Icon Alignment:** Flex items may misalign; check baseline
8. **Touch Delay:** Remove 300ms delay with touch-action
9. **Double Click:** Prevent double submissions
10. **Screen Readers:** Add aria-label for icon-only buttons

### 3. Background Effects

Hero Grab analyzes and generates sophisticated background treatments.

#### Background Types

```typescript
interface BackgroundConfig {
  type: 'image' | 'video' | 'gradient' | 'pattern' | 'mesh' | 'particles';
  overlay?: {
    type: 'gradient' | 'solid' | 'blur';
    opacity: number;
    direction?: string;
  };
  effects?: {
    parallax: boolean;
    blur: number;
    brightness: number;
    contrast: number;
  };
}
```

**Background Generation:**

```typescript
// Pattern 1: Image with Gradient Overlay
const ImageBackgroundHero = ({ imageSrc }: { imageSrc: string }) => (
  <section className="relative min-h-screen overflow-hidden">
    {/* Background Image */}
    <div className="absolute inset-0">
      <Image
        src={imageSrc}
        alt="Background"
        fill
        className="object-cover"
        priority
      />

      {/* Multi-layer Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 to-purple-900/30" />
    </div>

    {/* Content */}
    <div className="relative z-10">{/* Hero content */}</div>
  </section>
);

// Pattern 2: Animated Gradient Mesh
const GradientMeshHero = () => (
  <section className="relative min-h-screen overflow-hidden bg-gray-900">
    {/* Animated Gradient Blobs */}
    <div className="absolute inset-0">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
    </div>

    {/* Noise Texture Overlay */}
    <div className="absolute inset-0 bg-noise opacity-20" />

    {/* Content */}
    <div className="relative z-10">{/* Hero content */}</div>
  </section>
);

// Pattern 3: Video Background with Fallback
const VideoBackgroundHero = ({
  videoSrc,
  posterSrc
}: {
  videoSrc: string;
  posterSrc: string;
}) => (
  <section className="relative min-h-screen overflow-hidden">
    {/* Video Background */}
    <div className="absolute inset-0">
      <video
        autoPlay
        loop
        muted
        playsInline
        poster={posterSrc}
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />
    </div>

    {/* Content */}
    <div className="relative z-10">{/* Hero content */}</div>
  </section>
);

// Pattern 4: Parallax Background
const ParallaxHero = ({ imageSrc }: { imageSrc: string }) => {
  const [scrollY, setScrollY] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Parallax Background */}
      <div
        className="absolute inset-0 scale-110"
        style={{ transform: `translateY(${scrollY * 0.5}px)` }}
      >
        <Image
          src={imageSrc}
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Content (moves at normal speed) */}
      <div className="relative z-10">{/* Hero content */}</div>
    </section>
  );
};

// Pattern 5: Geometric Pattern Background
const PatternBackgroundHero = () => (
  <section className="relative min-h-screen overflow-hidden bg-gray-900">
    {/* Grid Pattern */}
    <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

    {/* Glow Effect */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/30 rounded-full blur-3xl" />

    {/* Content */}
    <div className="relative z-10">{/* Hero content */}</div>
  </section>
);

// CSS for animations (add to globals.css)
/*
@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}

.bg-grid-white\/5 {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(255 255 255 / 0.05)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e");
}

.bg-noise {
  background-image: url("data:image/svg+xml,..."); // noise pattern
}
*/
```

**Best Practices:**

1. **Image Optimization:** Use WebP/AVIF with fallback
2. **Lazy Loading:** Eager load hero, lazy load below fold
3. **Responsive Images:** Use srcset for different viewports
4. **Video Compression:** Target < 2MB for hero videos
5. **Fallback Strategy:** Image fallback for video
6. **Performance:** Avoid heavy filters on mobile
7. **Accessibility:** Provide pause controls for video
8. **Parallax Smoothness:** Use transform, not background-position
9. **Memory Management:** Clean up scroll listeners
10. **Reduced Motion:** Respect prefers-reduced-motion

**Gotchas:**

1. **Video Autoplay:** Safari requires muted and playsInline
2. **Parallax Performance:** Can cause jank on low-end devices
3. **Image Priority:** Next.js priority only loads one image
4. **Gradient Banding:** Add noise texture to reduce banding
5. **Fixed Backgrounds:** Poor performance on mobile
6. **Video on iOS:** Inline video behavior differs
7. **Blur Filter:** GPU-intensive; use sparingly
8. **Z-Index Layers:** Background < overlay < content
9. **Object-fit:** Not supported in IE11
10. **Video Aspect Ratio:** May not match container

### 4. Animation Integration

Hero Grab extracts and generates entrance animations and interactive effects.

#### Animation Analysis

```typescript
interface AnimationConfig {
  entrance: {
    type: 'fade' | 'slide' | 'scale' | 'reveal';
    direction: 'up' | 'down' | 'left' | 'right';
    stagger: number; // ms between elements
    duration: number; // ms
    delay: number; // ms
    easing: string;
  };
  interactive: {
    hover: string[];
    scroll: string[];
    click: string[];
  };
  continuous: {
    type: 'pulse' | 'float' | 'rotate' | 'none';
    target: string;
  };
}
```

**Animation Generation with Framer Motion:**

```typescript
import { motion, useScroll, useTransform } from 'framer-motion';

// Staggered entrance animation
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

const AnimatedHero = () => {
  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen flex items-center justify-center"
    >
      <div className="text-center max-w-4xl mx-auto px-4">
        {/* Badge */}
        <motion.div variants={itemVariants}>
          <span className="inline-flex px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
            New Feature
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          variants={itemVariants}
          className="text-5xl md:text-7xl font-bold text-gray-900 mb-6"
        >
          Build something amazing
        </motion.h1>

        {/* Subheading */}
        <motion.p
          variants={itemVariants}
          className="text-xl text-gray-600 mb-10"
        >
          The platform for modern development teams.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 bg-gray-900 text-white rounded-full font-semibold"
          >
            Get Started
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 border border-gray-300 rounded-full font-semibold"
          >
            Learn More
          </motion.button>
        </motion.div>
      </div>
    </motion.section>
  );
};

// Scroll-triggered animations
const ScrollAnimatedHero = () => {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.9]);
  const y = useTransform(scrollY, [0, 300], [0, 100]);

  return (
    <motion.section
      style={{ opacity, scale, y }}
      className="min-h-screen flex items-center justify-center sticky top-0"
    >
      {/* Hero content fades as user scrolls */}
    </motion.section>
  );
};

// Text reveal animation
const TextReveal = ({ children }: { children: string }) => {
  const words = children.split(' ');

  return (
    <motion.h1 className="text-5xl font-bold">
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
          className="inline-block mr-3"
        >
          {word}
        </motion.span>
      ))}
    </motion.h1>
  );
};

// Floating animation for decorative elements
const FloatingElement = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    animate={{
      y: [0, -10, 0],
    }}
    transition={{
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  >
    {children}
  </motion.div>
);

// CSS-only animations (no JS required)
const CSSAnimatedHero = () => (
  <section className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-5xl font-bold animate-fade-in-up animation-delay-100">
        Welcome
      </h1>
      <p className="text-xl text-gray-600 animate-fade-in-up animation-delay-200">
        Glad you're here
      </p>
      <button className="mt-8 px-8 py-4 bg-gray-900 text-white rounded-full animate-fade-in-up animation-delay-300 hover:animate-pulse">
        Get Started
      </button>
    </div>
  </section>
);

// CSS animations (add to globals.css)
/*
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.5s ease-out forwards;
  opacity: 0;
}

.animation-delay-100 { animation-delay: 0.1s; }
.animation-delay-200 { animation-delay: 0.2s; }
.animation-delay-300 { animation-delay: 0.3s; }
*/
```

**Best Practices:**

1. **Performance:** Use transform and opacity only
2. **Timing:** Keep entrance animations under 1s
3. **Stagger:** 50-150ms between elements feels natural
4. **Easing:** Use custom easing for polish
5. **Reduced Motion:** Respect prefers-reduced-motion
6. **Loading Priority:** Don't animate before content loads
7. **Purpose:** Animation should guide, not distract
8. **Consistency:** Use consistent animation language
9. **Mobile:** Simpler animations on mobile
10. **Testing:** Test animations at 60fps

**Gotchas:**

1. **Layout Shift:** Animate from final position to avoid CLS
2. **Safari Bugs:** Some animations render differently
3. **Bundle Size:** Framer Motion adds ~25KB
4. **SSR Issues:** Use dynamic import for client-only
5. **Re-renders:** Animations can trigger re-renders
6. **Z-Index:** Animated elements may need z-index
7. **Scroll Jank:** Debounce scroll-linked animations
8. **Memory Leaks:** Clean up animation listeners
9. **Initial State:** Set initial state to prevent flash
10. **Exit Animations:** AnimatePresence needed for exit

## Real-World Examples

### Example 1: SaaS Landing Page Hero

**Input:** Screenshot of modern SaaS hero with gradient background

**Generated Code:**
```typescript
import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

export const SaaSHero: React.FC = () => {
  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-3xl animate-pulse animation-delay-2000" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm text-white mb-8">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Now in Beta - Join 10,000+ users
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6 tracking-tight"
          >
            Ship products
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              10x faster
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto"
          >
            The all-in-one platform for modern development teams.
            Build, deploy, and scale without the complexity.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              href="/signup"
              className="px-8 py-4 bg-white text-gray-900 rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transition-shadow"
            >
              Start Free Trial
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              href="/demo"
              className="px-8 py-4 border border-white/30 text-white rounded-full font-semibold text-lg hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Watch Demo
            </motion.a>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 text-gray-400"
          >
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Image
                  key={i}
                  src={`/avatars/user-${i}.jpg`}
                  alt={`User ${i}`}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full border-2 border-slate-900"
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <span>4.9/5 from 2,000+ reviews</span>
            </div>
          </motion.div>
        </div>

        {/* Product Screenshot */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10 pointer-events-none" />
          <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl">
            <Image
              src="/product-screenshot.png"
              alt="Product interface"
              width={1400}
              height={900}
              className="w-full"
              priority
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};
```

### Example 2: E-commerce Hero with Split Layout

**Input:** Screenshot of fashion e-commerce hero

**Generated Code:**
```typescript
import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

export const EcommerceHero: React.FC = () => {
  return (
    <section className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 min-h-screen">
          {/* Content Side */}
          <div className="flex items-center px-6 sm:px-12 lg:px-16 py-20 lg:py-0">
            <div className="max-w-lg">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-sm font-medium tracking-widest text-stone-500 uppercase mb-4 block"
              >
                New Collection 2025
              </motion.span>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-5xl sm:text-6xl lg:text-7xl font-light text-stone-900 mb-6 leading-tight"
              >
                Timeless
                <br />
                <span className="font-semibold">Elegance</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg text-stone-600 mb-8 leading-relaxed"
              >
                Discover our curated collection of premium essentials.
                Designed for those who appreciate quality and understated luxury.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href="/shop"
                  className="px-8 py-4 bg-stone-900 text-white text-center font-medium hover:bg-stone-800 transition-colors"
                >
                  Shop Collection
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href="/lookbook"
                  className="px-8 py-4 border border-stone-300 text-stone-900 text-center font-medium hover:border-stone-900 transition-colors"
                >
                  View Lookbook
                </motion.a>
              </motion.div>

              {/* Features */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex gap-8 mt-12 pt-8 border-t border-stone-200"
              >
                <div>
                  <div className="text-2xl font-semibold text-stone-900">Free</div>
                  <div className="text-sm text-stone-500">Shipping</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-stone-900">30-Day</div>
                  <div className="text-sm text-stone-500">Returns</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-stone-900">2-Year</div>
                  <div className="text-sm text-stone-500">Warranty</div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Image Side */}
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative h-[50vh] lg:h-auto"
          >
            <Image
              src="/hero-fashion.jpg"
              alt="Fashion model"
              fill
              className="object-cover"
              priority
            />

            {/* Floating Product Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="absolute bottom-8 left-8 right-8 lg:left-auto lg:right-8 lg:w-72 bg-white p-4 shadow-xl"
            >
              <div className="flex gap-4">
                <Image
                  src="/product-thumb.jpg"
                  alt="Featured product"
                  width={80}
                  height={80}
                  className="w-20 h-20 object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-stone-900">Cashmere Coat</h3>
                  <p className="text-sm text-stone-500 mb-2">Midnight Black</p>
                  <p className="font-semibold text-stone-900">$890</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
```

### Example 3: App Launch Hero

**Input:** Screenshot of mobile app launch page

**Generated Code:**
```typescript
import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

export const AppLaunchHero: React.FC = () => {
  return (
    <section className="min-h-screen bg-black overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-600/20 via-transparent to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Featured on Product Hunt
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6"
            >
              Your finances,
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                simplified
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-gray-400 mb-8 max-w-lg mx-auto lg:mx-0"
            >
              Track spending, set budgets, and reach your financial goals
              with AI-powered insights. Available on iOS and Android.
            </motion.p>

            {/* App Store Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12"
            >
              <a href="#" className="inline-block">
                <Image
                  src="/app-store-badge.svg"
                  alt="Download on App Store"
                  width={160}
                  height={53}
                  className="h-14 w-auto"
                />
              </a>
              <a href="#" className="inline-block">
                <Image
                  src="/play-store-badge.svg"
                  alt="Get it on Google Play"
                  width={180}
                  height={53}
                  className="h-14 w-auto"
                />
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="grid grid-cols-3 gap-8"
            >
              <div>
                <div className="text-3xl font-bold text-white">2M+</div>
                <div className="text-sm text-gray-500">Downloads</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">4.9</div>
                <div className="text-sm text-gray-500">App Rating</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">$5B+</div>
                <div className="text-sm text-gray-500">Tracked</div>
              </div>
            </motion.div>
          </div>

          {/* Phone Mockups */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative h-[600px] lg:h-[700px]"
          >
            {/* Background Phone */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-20 left-0 lg:left-10 w-[280px]"
            >
              <Image
                src="/phone-mockup-2.png"
                alt="App screen"
                width={280}
                height={570}
                className="drop-shadow-2xl"
              />
            </motion.div>

            {/* Foreground Phone */}
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute top-0 right-0 lg:right-10 w-[300px]"
            >
              <Image
                src="/phone-mockup-1.png"
                alt="App screen"
                width={300}
                height={610}
                className="drop-shadow-2xl"
              />
            </motion.div>

            {/* Decorative Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
```

### Example 4: Startup Hero with Video

**Input:** Screenshot of startup landing with background video

**Generated Code:**
```typescript
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const StartupHero: React.FC = () => {
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  return (
    <>
      <section className="relative min-h-screen overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/hero-video.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/60" />
        </div>

        {/* Content */}
        <div className="relative z-10 min-h-screen flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="max-w-3xl">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
              >
                We're building the future of
                <span className="block text-blue-400">remote collaboration</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-xl sm:text-2xl text-gray-300 mb-10"
              >
                Join 50,000+ teams who use our platform to work together
                seamlessly, no matter where they are.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  href="/signup"
                  className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white font-semibold text-lg rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Get Started Free
                  <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </motion.a>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setVideoModalOpen(true)}
                  className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold text-lg rounded-lg border border-white/20 hover:bg-white/20 transition-colors"
                >
                  <svg className="mr-2 w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Watch Video
                </motion.button>
              </motion.div>

              {/* Trust Badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-12 flex flex-wrap items-center gap-6"
              >
                <span className="text-sm text-gray-400">Trusted by teams at</span>
                <div className="flex flex-wrap items-center gap-8 opacity-60">
                  {['Stripe', 'Vercel', 'Linear', 'Notion'].map((company) => (
                    <span key={company} className="text-white font-semibold text-lg">
                      {company}
                    </span>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-white/60"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.div>
        </motion.div>
      </section>

      {/* Video Modal */}
      <AnimatePresence>
        {videoModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setVideoModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <iframe
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                className="w-full h-full"
                allow="autoplay; fullscreen"
              />
              <button
                onClick={() => setVideoModalOpen(false)}
                className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
```

## Related Skills

- **react-grab** - General React component extraction
- **nav-grab** - Navigation component generation
- **cta-grab** - Call-to-action optimization
- **animation-grab** - Motion design extraction
- **theme-grab** - Design token extraction
- **landing-grab** - Full landing page generation

## Further Reading

### Official Documentation
- [Framer Motion](https://www.framer.com/motion/)
- [Next.js Image Optimization](https://nextjs.org/docs/basic-features/image-optimization)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Design Resources
- [Hero Section Best Practices](https://www.nngroup.com/articles/hero-sections/)
- [Landing Page Conversion](https://unbounce.com/landing-pages/)
- [Motion Design Principles](https://material.io/design/motion/)

### Performance
- [Core Web Vitals](https://web.dev/vitals/)
- [LCP Optimization](https://web.dev/lcp/)
- [Image Loading Best Practices](https://web.dev/image-component/)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
*Last updated: 2025-12-04*
