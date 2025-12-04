#!/usr/bin/env python3
"""Write tailwind-ui-designer.md skill definition."""

import os

SKILLS_DIR = os.path.dirname(os.path.abspath(__file__))

def write_tailwind_ui_designer():
    content = r'''# Tailwind UI Designer

> **ID:** `tailwind-ui-designer`
> **Tier:** 2
> **Token Cost:** 8000
> **MCP Connections:** context7

## What This Skill Does

- Design stunning layouts from scratch with utility-first CSS
- Build responsive designs mobile-first with breakpoint modifiers
- Create custom design systems with tailwind.config.ts
- Implement glassmorphism, neumorphism, and modern effects
- Advanced gradient and backdrop effects
- Container queries and modern CSS features
- Tailwind config customization and plugins
- Animation utilities and custom keyframes

## When to Use

This skill is automatically loaded when:

- **Keywords:** tailwind, design, layout, responsive, gradient, glass, beautiful, stunning, css, utility
- **File Types:** .css, tailwind.config.ts, tailwind.config.js
- **Directories:** styles/, components/ui/

## Core Capabilities

### 1. Design Stunning Layouts from Scratch

Master the art of building beautiful, production-ready layouts using Tailwind utility classes.

**Best Practices:**
- Use semantic HTML elements with Tailwind classes for accessibility
- Build layouts with Flexbox (flex) and Grid (grid) utilities
- Use consistent spacing scale (space-y-4, gap-6, etc.)
- Leverage container and max-width utilities for readable content
- Apply consistent border-radius and shadow scales

**Common Patterns:**

```tsx
// Modern Dashboard Layout
function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <NavLink href="/dashboard" icon={Home}>Overview</NavLink>
            <NavLink href="/analytics" icon={BarChart}>Analytics</NavLink>
            <NavLink href="/users" icon={Users}>Users</NavLink>
            <NavLink href="/settings" icon={Settings}>Settings</NavLink>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <UserProfile />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="pl-64">
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
          <SearchBar />
          <div className="flex items-center gap-4">
            <NotificationBell />
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

// Bento Grid Layout (Modern Card Grid)
function BentoGrid({ items }: { items: BentoItem[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[180px]">
      {items.map((item, index) => (
        <div
          key={item.id}
          className={cn(
            "group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 transition-all hover:shadow-xl hover:scale-[1.02]",
            // Span patterns for visual interest
            index === 0 && "md:col-span-2 md:row-span-2",
            index === 3 && "lg:col-span-2"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-100/50 dark:to-gray-700/50 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <item.icon className="w-8 h-8 text-gray-600 dark:text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.title}</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Hero Section with Gradient Background
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />

      {/* Gradient Orbs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 dark:bg-yellow-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-4000" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white">
            Build beautiful apps with
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"> Tailwind CSS</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
            A utility-first CSS framework packed with classes that can be composed to build any design, directly in your markup.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
              Get Started
            </button>
            <button className="px-8 py-3 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              View Documentation
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
```

**Gotchas:**
- Always use responsive prefixes consistently (sm:, md:, lg:, xl:, 2xl:)
- Avoid mixing custom CSS with Tailwind unless absolutely necessary
- Use the @apply directive sparingly - prefer utility classes
- Test layouts on all breakpoints, not just mobile and desktop

### 2. Build Responsive Designs Mobile-First

Apply the mobile-first approach with Tailwind breakpoint modifiers for truly responsive designs.

**Best Practices:**
- Start with mobile styles, then add breakpoint modifiers for larger screens
- Use min-width breakpoints (sm:, md:, lg:) rather than max-width
- Group related responsive classes for readability
- Consider touch targets (min 44px) for mobile interactions
- Test on real devices, not just browser DevTools

**Common Patterns:**

```tsx
// Responsive Navigation Component
function ResponsiveNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo className="h-8 w-auto" />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <NavLink href="/features">Features</NavLink>
            <NavLink href="/pricing">Pricing</NavLink>
            <NavLink href="/about">About</NavLink>
            <NavLink href="/contact">Contact</NavLink>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              Sign In
            </button>
            <button className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={cn(
        "md:hidden",
        isOpen ? "block" : "hidden"
      )}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          <MobileNavLink href="/features">Features</MobileNavLink>
          <MobileNavLink href="/pricing">Pricing</MobileNavLink>
          <MobileNavLink href="/about">About</MobileNavLink>
          <MobileNavLink href="/contact">Contact</MobileNavLink>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
          <button className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}

// Responsive Card Grid
function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product) => (
        <div
          key={product.id}
          className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
        >
          {/* Image - Responsive aspect ratio */}
          <div className="aspect-square sm:aspect-[4/3] overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Content - Responsive padding */}
          <div className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
              {product.name}
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {product.description}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                ${product.price}
              </span>
              <button className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Responsive Typography Scale
function TypographyExample() {
  return (
    <div className="space-y-6">
      {/* Hero title - Scales dramatically */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
        Responsive Typography
      </h1>

      {/* Section title - Moderate scaling */}
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold">
        Section Heading
      </h2>

      {/* Card title - Subtle scaling */}
      <h3 className="text-lg sm:text-xl font-medium">
        Card Title
      </h3>

      {/* Body text - Consistent with line height adjustments */}
      <p className="text-base sm:text-lg leading-relaxed sm:leading-loose text-gray-600 dark:text-gray-400">
        Body text that maintains readability across all screen sizes with appropriate
        line height adjustments for comfortable reading.
      </p>

      {/* Small text - Stays consistent */}
      <p className="text-sm text-gray-500">
        Caption or helper text that stays small
      </p>
    </div>
  );
}
```

**Gotchas:**
- Do not hide important content on mobile - reorganize instead
- Touch targets should be at least 44x44px on mobile
- Test horizontal scrolling issues on narrow screens
- Remember that hover states do not work on touch devices

### 3. Create Custom Design Systems

Build scalable design systems by customizing tailwind.config.ts with your brand colors, typography, and spacing.

**Best Practices:**
- Extend the default theme rather than replacing it entirely
- Use CSS variables for dynamic theming (dark mode, brand customization)
- Create semantic color names (primary, secondary, accent)
- Define consistent spacing and sizing scales
- Document your design tokens

**Common Patterns:**

```typescript
// tailwind.config.ts - Complete Design System Configuration
import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Custom Color Palette with CSS Variables
      colors: {
        // Brand Colors
        primary: {
          50: "hsl(var(--primary-50))",
          100: "hsl(var(--primary-100))",
          200: "hsl(var(--primary-200))",
          300: "hsl(var(--primary-300))",
          400: "hsl(var(--primary-400))",
          500: "hsl(var(--primary-500))",
          600: "hsl(var(--primary-600))",
          700: "hsl(var(--primary-700))",
          800: "hsl(var(--primary-800))",
          900: "hsl(var(--primary-900))",
          950: "hsl(var(--primary-950))",
          DEFAULT: "hsl(var(--primary-500))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // Semantic Colors
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },

      // Custom Font Family
      fontFamily: {
        sans: ["Inter var", ...defaultTheme.fontFamily.sans],
        display: ["Cal Sans", "Inter var", ...defaultTheme.fontFamily.sans],
        mono: ["JetBrains Mono", ...defaultTheme.fontFamily.mono],
      },

      // Custom Font Sizes with Line Heights
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1.1" }],
        "6xl": ["3.75rem", { lineHeight: "1.1" }],
        "7xl": ["4.5rem", { lineHeight: "1.1" }],
      },

      // Custom Spacing Scale
      spacing: {
        "4.5": "1.125rem",
        "5.5": "1.375rem",
        "18": "4.5rem",
        "22": "5.5rem",
      },

      // Custom Border Radius
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },

      // Custom Box Shadows
      boxShadow: {
        "glow": "0 0 20px rgba(59, 130, 246, 0.5)",
        "glow-lg": "0 0 40px rgba(59, 130, 246, 0.5)",
        "inner-glow": "inset 0 0 20px rgba(59, 130, 246, 0.2)",
      },

      // Custom Animations
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "fade-out": "fade-out 0.3s ease-out",
        "slide-in-up": "slide-in-up 0.3s ease-out",
        "slide-in-down": "slide-in-down 0.3s ease-out",
        "slide-in-left": "slide-in-left 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "spin-slow": "spin 3s linear infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-slow": "bounce 2s infinite",
        "blob": "blob 7s infinite",
        "shimmer": "shimmer 2s linear infinite",
      },

      // Keyframes
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "slide-in-up": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-in-down": {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-in-left": {
          "0%": { transform: "translateX(-10px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(10px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "blob": {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },

      // Background Images
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-mesh": `
          radial-gradient(at 40% 20%, hsla(28,100%,74%,1) 0px, transparent 50%),
          radial-gradient(at 80% 0%, hsla(189,100%,56%,1) 0px, transparent 50%),
          radial-gradient(at 0% 50%, hsla(355,100%,93%,1) 0px, transparent 50%),
          radial-gradient(at 80% 50%, hsla(340,100%,76%,1) 0px, transparent 50%),
          radial-gradient(at 0% 100%, hsla(22,100%,77%,1) 0px, transparent 50%),
          radial-gradient(at 80% 100%, hsla(242,100%,70%,1) 0px, transparent 50%),
          radial-gradient(at 0% 0%, hsla(343,100%,76%,1) 0px, transparent 50%)
        `,
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries"),
    require("tailwindcss-animate"),
  ],
};

export default config;
```

```css
/* globals.css - CSS Variables for Theming */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Primary Colors (Blue) */
    --primary-50: 214 100% 97%;
    --primary-100: 214 95% 93%;
    --primary-200: 213 97% 87%;
    --primary-300: 212 96% 78%;
    --primary-400: 213 94% 68%;
    --primary-500: 217 91% 60%;
    --primary-600: 221 83% 53%;
    --primary-700: 224 76% 48%;
    --primary-800: 226 71% 40%;
    --primary-900: 224 64% 33%;
    --primary-950: 226 57% 21%;
    --primary-foreground: 0 0% 100%;

    /* Semantic Colors - Light Mode */
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    --muted: 210 40% 96%;
    --muted-foreground: 215 16% 47%;
    --accent: 210 40% 96%;
    --accent-foreground: 222 47% 11%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 214 32% 91%;
    --input: 214 32% 91%;
    --ring: 217 91% 60%;
  }

  .dark {
    /* Semantic Colors - Dark Mode */
    --background: 222 47% 11%;
    --foreground: 210 40% 98%;
    --card: 222 47% 11%;
    --card-foreground: 210 40% 98%;
    --muted: 217 33% 17%;
    --muted-foreground: 215 20% 65%;
    --accent: 217 33% 17%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62% 30%;
    --destructive-foreground: 210 40% 98%;
    --border: 217 33% 17%;
    --input: 217 33% 17%;
    --ring: 224 76% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
```

**Gotchas:**
- Always test color contrast for accessibility (WCAG AA minimum)
- CSS variables need HSL values without hsl() wrapper for Tailwind
- Restart dev server after config changes
- Use TypeScript config for better autocomplete

### 4. Implement Glassmorphism, Neumorphism

Create modern UI effects with blurred backgrounds, subtle shadows, and depth.

**Best Practices:**
- Use glassmorphism sparingly - it works best for overlays and cards
- Ensure sufficient contrast for text readability
- Neumorphism requires consistent light source direction
- Test effects on different background colors
- Consider performance impact of backdrop-blur

**Common Patterns:**

```tsx
// Glassmorphism Card
function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        // Glass effect
        "bg-white/10 dark:bg-black/10",
        "backdrop-blur-xl backdrop-saturate-150",
        // Border
        "border border-white/20 dark:border-white/10",
        // Shadow
        "shadow-xl shadow-black/5",
        // Shape
        "rounded-2xl",
        className
      )}
    >
      {children}
    </div>
  );
}

// Glass Navbar
function GlassNavbar() {
  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-4xl">
      <div className="flex items-center justify-between px-6 py-3 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-full shadow-lg">
        <Logo className="h-8" />
        <div className="hidden md:flex items-center gap-6">
          <NavLink href="/features">Features</NavLink>
          <NavLink href="/pricing">Pricing</NavLink>
          <NavLink href="/about">About</NavLink>
        </div>
        <button className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
          Get Started
        </button>
      </div>
    </nav>
  );
}

// Glass Modal
function GlassModal({ open, onClose, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border border-white/30 dark:border-gray-700/50 rounded-3xl shadow-2xl p-6 animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        {children}
      </div>
    </div>
  );
}

// Neumorphism Card
function NeumorphicCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        // Background matches parent for seamless look
        "bg-gray-100 dark:bg-gray-800",
        // Light source from top-left
        "shadow-[8px_8px_16px_#d1d5db,-8px_-8px_16px_#ffffff]",
        "dark:shadow-[8px_8px_16px_#1f2937,-8px_-8px_16px_#374151]",
        // Shape
        "rounded-2xl",
        className
      )}
    >
      {children}
    </div>
  );
}

// Neumorphic Button
function NeumorphicButton({
  children,
  variant = "raised",
  className,
  ...props
}: NeumorphicButtonProps) {
  const variants = {
    raised: cn(
      "bg-gray-100 dark:bg-gray-800",
      "shadow-[6px_6px_12px_#d1d5db,-6px_-6px_12px_#ffffff]",
      "dark:shadow-[6px_6px_12px_#1f2937,-6px_-6px_12px_#374151]",
      "hover:shadow-[4px_4px_8px_#d1d5db,-4px_-4px_8px_#ffffff]",
      "dark:hover:shadow-[4px_4px_8px_#1f2937,-4px_-4px_8px_#374151]",
      "active:shadow-[inset_4px_4px_8px_#d1d5db,inset_-4px_-4px_8px_#ffffff]",
      "dark:active:shadow-[inset_4px_4px_8px_#1f2937,inset_-4px_-4px_8px_#374151]"
    ),
    inset: cn(
      "bg-gray-100 dark:bg-gray-800",
      "shadow-[inset_4px_4px_8px_#d1d5db,inset_-4px_-4px_8px_#ffffff]",
      "dark:shadow-[inset_4px_4px_8px_#1f2937,inset_-4px_-4px_8px_#374151]"
    ),
  };

  return (
    <button
      className={cn(
        variants[variant],
        "px-6 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300 transition-all duration-200",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// Neumorphic Input
function NeumorphicInput({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full px-4 py-3",
        "bg-gray-100 dark:bg-gray-800",
        "shadow-[inset_4px_4px_8px_#d1d5db,inset_-4px_-4px_8px_#ffffff]",
        "dark:shadow-[inset_4px_4px_8px_#1f2937,inset_-4px_-4px_8px_#374151]",
        "rounded-xl",
        "text-gray-700 dark:text-gray-300 placeholder:text-gray-400",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
        "transition-shadow duration-200",
        className
      )}
      {...props}
    />
  );
}
```

**Gotchas:**
- backdrop-blur can be performance intensive on low-end devices
- Neumorphism requires exact color matching with background
- Glass effects need sufficient background contrast to be visible
- Test on both light and dark modes

### 5. Advanced Gradient and Backdrop Effects

Create stunning visual effects with complex gradients, mesh backgrounds, and backdrop filters.

**Best Practices:**
- Use gradients purposefully, not just for decoration
- Ensure text remains readable over gradient backgrounds
- Combine gradients with subtle animations for depth
- Test gradients on different screen sizes and color modes
- Use CSS variables for dynamic gradient colors

**Common Patterns:**

```tsx
// Mesh Gradient Background
function MeshGradientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-100 via-pink-50 to-orange-100 dark:from-violet-950 dark:via-pink-950 dark:to-orange-950" />

      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-violet-400 to-purple-400 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-50 animate-blob" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-50 animate-blob animation-delay-2000" />
      <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-50 animate-blob animation-delay-4000" />

      {/* Noise overlay for texture */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay" />
    </div>
  );
}

// Gradient Text
function GradientText({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "bg-gradient-to-r from-violet-600 via-pink-600 to-orange-600",
        "bg-clip-text text-transparent",
        className
      )}
    >
      {children}
    </span>
  );
}

// Animated Gradient Border
function GradientBorderCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative group", className)}>
      {/* Animated gradient border */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient-xy" />

      {/* Card content */}
      <div className="relative bg-white dark:bg-gray-900 rounded-xl p-6">
        {children}
      </div>
    </div>
  );
}

// Gradient Button
function GradientButton({
  children,
  variant = "primary",
  className,
  ...props
}: GradientButtonProps) {
  const variants = {
    primary: "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700",
    secondary: "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600",
    rainbow: "bg-gradient-to-r from-violet-600 via-pink-600 to-orange-600 hover:from-violet-700 hover:via-pink-700 hover:to-orange-700",
  };

  return (
    <button
      className={cn(
        variants[variant],
        "px-6 py-3 rounded-xl text-white font-medium",
        "shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30",
        "transform hover:-translate-y-0.5 transition-all duration-200",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// Shimmer Effect (Loading State)
function ShimmerCard() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
      {/* Shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />

      {/* Content skeleton */}
      <div className="p-6 space-y-4">
        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
}

// Spotlight Effect
function SpotlightCard({ children }: { children: React.ReactNode }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className="relative group overflow-hidden rounded-2xl bg-gray-900 border border-gray-800 p-8"
    >
      {/* Spotlight effect */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.06), transparent 40%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
```

```css
/* Add to globals.css for animation utilities */
@layer utilities {
  .animation-delay-2000 {
    animation-delay: 2s;
  }

  .animation-delay-4000 {
    animation-delay: 4s;
  }

  .animate-gradient-xy {
    animation: gradient-xy 3s ease infinite;
    background-size: 400% 400%;
  }

  @keyframes gradient-xy {
    0%, 100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }
}
```

**Gotchas:**
- Heavy gradients can impact performance, especially with animations
- Always provide fallback colors for browsers that do not support gradients
- Text over gradients needs careful contrast consideration
- Animated gradients should respect prefers-reduced-motion

### 6. Container Queries and Modern CSS

Leverage cutting-edge CSS features with Tailwind for component-level responsive design.

**Best Practices:**
- Use container queries for component-based responsive design
- Apply logical properties for RTL language support
- Use CSS Grid subgrid for complex nested layouts
- Leverage has() selector for parent-based styling
- Test in multiple browsers for compatibility

**Common Patterns:**

```tsx
// Container Query Card
function ContainerQueryCard({ children }: { children: React.ReactNode }) {
  return (
    // @container class enables container queries on children
    <div className="@container">
      <div className={cn(
        // Default (mobile) styles
        "flex flex-col gap-4 p-4",
        // Container query breakpoints (based on parent width, not viewport)
        "@sm:flex-row @sm:items-center @sm:p-6",
        "@lg:gap-8 @lg:p-8",
        "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
      )}>
        {children}
      </div>
    </div>
  );
}

// Responsive Sidebar Item with Container Queries
function SidebarItem({ icon: Icon, label, collapsed }: SidebarItemProps) {
  return (
    <div className="@container">
      <button className={cn(
        "flex items-center gap-3 w-full px-3 py-2 rounded-lg",
        "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white",
        "hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
        // Hide label when container is narrow
        "@[200px]:justify-start justify-center"
      )}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className={cn(
          "truncate",
          "@[200px]:block hidden"
        )}>
          {label}
        </span>
      </button>
    </div>
  );
}

// CSS Grid with Subgrid
function ProductTable({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-4 gap-y-2">
      {/* Header */}
      <div className="contents font-medium text-sm text-gray-500 dark:text-gray-400">
        <div className="p-3">Image</div>
        <div className="p-3">Name</div>
        <div className="p-3 text-right">Price</div>
        <div className="p-3 text-right">Stock</div>
      </div>

      {/* Rows - inherit grid from parent */}
      {products.map((product) => (
        <div key={product.id} className="contents group">
          <div className="p-3 group-hover:bg-gray-50 dark:group-hover:bg-gray-800/50 transition-colors">
            <img src={product.image} alt="" className="w-10 h-10 rounded object-cover" />
          </div>
          <div className="p-3 group-hover:bg-gray-50 dark:group-hover:bg-gray-800/50 transition-colors">
            <span className="font-medium">{product.name}</span>
          </div>
          <div className="p-3 text-right group-hover:bg-gray-50 dark:group-hover:bg-gray-800/50 transition-colors">
            ${product.price}
          </div>
          <div className="p-3 text-right group-hover:bg-gray-50 dark:group-hover:bg-gray-800/50 transition-colors">
            {product.stock}
          </div>
        </div>
      ))}
    </div>
  );
}

// Has Selector Pattern (Style parent based on child state)
function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div className={cn(
      "space-y-1",
      // Tailwind has: prefix for parent styling based on child
      "has-[:focus]:ring-2 has-[:focus]:ring-blue-500/20 rounded-lg p-1 -m-1",
      "has-[:invalid]:ring-2 has-[:invalid]:ring-red-500/20"
    )}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

// Logical Properties for RTL Support
function DirectionalCard({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(
      // Use logical properties instead of left/right
      "ps-6 pe-4", // padding-inline-start, padding-inline-end
      "ms-auto",   // margin-inline-start
      "border-s-4 border-s-blue-500", // border-inline-start
      "text-start", // text-align: start
      "bg-white dark:bg-gray-800 rounded-lg"
    )}>
      {children}
    </div>
  );
}

// Scroll Snap Gallery
function ScrollSnapGallery({ images }: { images: string[] }) {
  return (
    <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4">
      {images.map((src, index) => (
        <div
          key={index}
          className={cn(
            "flex-none w-80 aspect-[4/3]",
            "snap-center", // Snap to center of viewport
            "rounded-xl overflow-hidden"
          )}
        >
          <img src={src} alt="" className="w-full h-full object-cover" />
        </div>
      ))}
    </div>
  );
}
```

**Gotchas:**
- Container queries require the @tailwindcss/container-queries plugin
- has() selector is not supported in Firefox before version 121
- Subgrid support varies across browsers
- Always provide fallbacks for unsupported features

### 7. Tailwind Config Customization

Master advanced configuration patterns for production-ready design systems.

**Best Practices:**
- Use TypeScript for config with better autocomplete
- Organize plugins and presets for reusability
- Implement design tokens with CSS variables
- Optimize production builds with purge configuration
- Create consistent naming conventions

**Common Patterns:**

```typescript
// plugins/typography.ts - Custom Typography Plugin
import plugin from "tailwindcss/plugin";

export const typographyPlugin = plugin(
  function ({ addBase, addComponents, theme }) {
    // Base typography styles
    addBase({
      "h1": {
        fontSize: theme("fontSize.4xl"),
        fontWeight: theme("fontWeight.bold"),
        lineHeight: theme("lineHeight.tight"),
        letterSpacing: theme("letterSpacing.tight"),
      },
      "h2": {
        fontSize: theme("fontSize.3xl"),
        fontWeight: theme("fontWeight.semibold"),
        lineHeight: theme("lineHeight.tight"),
      },
      "h3": {
        fontSize: theme("fontSize.2xl"),
        fontWeight: theme("fontWeight.semibold"),
        lineHeight: theme("lineHeight.snug"),
      },
      "p": {
        lineHeight: theme("lineHeight.relaxed"),
      },
    });

    // Typography components
    addComponents({
      ".prose-custom": {
        "--tw-prose-body": theme("colors.gray.700"),
        "--tw-prose-headings": theme("colors.gray.900"),
        "--tw-prose-links": theme("colors.blue.600"),
        "& a": {
          textDecoration: "underline",
          textUnderlineOffset: "2px",
          "&:hover": {
            color: theme("colors.blue.700"),
          },
        },
        "& code": {
          backgroundColor: theme("colors.gray.100"),
          padding: "0.125rem 0.25rem",
          borderRadius: theme("borderRadius.md"),
          fontSize: "0.875em",
        },
      },
    });
  }
);

// plugins/components.ts - Custom Component Classes
export const componentsPlugin = plugin(function ({ addComponents, theme }) {
  addComponents({
    // Button variants
    ".btn": {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: `${theme("spacing.2")} ${theme("spacing.4")}`,
      fontSize: theme("fontSize.sm"),
      fontWeight: theme("fontWeight.medium"),
      borderRadius: theme("borderRadius.lg"),
      transition: "all 150ms ease",
      "&:focus": {
        outline: "none",
        ringWidth: "2px",
        ringColor: theme("colors.blue.500"),
        ringOffsetWidth: "2px",
      },
      "&:disabled": {
        opacity: "0.5",
        cursor: "not-allowed",
      },
    },
    ".btn-primary": {
      backgroundColor: theme("colors.blue.600"),
      color: theme("colors.white"),
      "&:hover:not(:disabled)": {
        backgroundColor: theme("colors.blue.700"),
      },
    },
    ".btn-secondary": {
      backgroundColor: theme("colors.gray.100"),
      color: theme("colors.gray.900"),
      "&:hover:not(:disabled)": {
        backgroundColor: theme("colors.gray.200"),
      },
    },
    ".btn-outline": {
      backgroundColor: "transparent",
      borderWidth: "1px",
      borderColor: theme("colors.gray.300"),
      color: theme("colors.gray.700"),
      "&:hover:not(:disabled)": {
        backgroundColor: theme("colors.gray.50"),
      },
    },

    // Card variants
    ".card": {
      backgroundColor: theme("colors.white"),
      borderRadius: theme("borderRadius.xl"),
      boxShadow: theme("boxShadow.sm"),
      overflow: "hidden",
    },
    ".card-bordered": {
      borderWidth: "1px",
      borderColor: theme("colors.gray.200"),
    },
    ".card-elevated": {
      boxShadow: theme("boxShadow.lg"),
    },

    // Input styles
    ".input": {
      display: "block",
      width: "100%",
      padding: `${theme("spacing.2")} ${theme("spacing.3")}`,
      fontSize: theme("fontSize.sm"),
      lineHeight: theme("lineHeight.normal"),
      borderWidth: "1px",
      borderColor: theme("colors.gray.300"),
      borderRadius: theme("borderRadius.md"),
      backgroundColor: theme("colors.white"),
      "&:focus": {
        outline: "none",
        borderColor: theme("colors.blue.500"),
        ringWidth: "1px",
        ringColor: theme("colors.blue.500"),
      },
      "&::placeholder": {
        color: theme("colors.gray.400"),
      },
    },
  });
});

// presets/brand.ts - Brand Preset for Multiple Projects
import type { Config } from "tailwindcss";

export const brandPreset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          900: "#0c4a6e",
        },
      },
      fontFamily: {
        brand: ["Inter var", "system-ui", "sans-serif"],
      },
      borderRadius: {
        brand: "0.75rem",
      },
    },
  },
};

// Usage in tailwind.config.ts
import { brandPreset } from "./presets/brand";
import { typographyPlugin } from "./plugins/typography";
import { componentsPlugin } from "./plugins/components";

export default {
  presets: [brandPreset],
  plugins: [typographyPlugin, componentsPlugin],
  // ... rest of config
} satisfies Config;
```

**Gotchas:**
- Plugin order matters - later plugins can override earlier ones
- Presets are merged, not replaced entirely
- Always restart dev server after config changes
- Use satisfies for type checking without losing inference

### 8. Animation Utilities and Keyframes

Create engaging animations and micro-interactions with Tailwind animation utilities.

**Best Practices:**
- Respect prefers-reduced-motion for accessibility
- Keep animations subtle and purposeful
- Use GPU-accelerated properties (transform, opacity)
- Avoid animating layout properties (width, height, top, left)
- Test animations on low-powered devices

**Common Patterns:**

```tsx
// Accessible Animation Wrapper
function AnimatedElement({
  children,
  animation,
  className,
}: {
  children: React.ReactNode;
  animation: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        animation,
        // Disable animations for users who prefer reduced motion
        "motion-reduce:animate-none motion-reduce:transition-none",
        className
      )}
    >
      {children}
    </div>
  );
}

// Staggered List Animation
function StaggeredList({ items }: { items: ListItem[] }) {
  return (
    <ul className="space-y-4">
      {items.map((item, index) => (
        <li
          key={item.id}
          className="animate-fade-in-up opacity-0"
          style={{
            animationDelay: `${index * 100}ms`,
            animationFillMode: "forwards",
          }}
        >
          <ListItemContent item={item} />
        </li>
      ))}
    </ul>
  );
}

// Hover Animations
function InteractiveCard({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(
      "group relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
      // Transform on hover
      "transition-all duration-300 ease-out",
      "hover:-translate-y-1 hover:shadow-xl",
      // Scale inner content
      "[&>*]:transition-transform [&>*]:duration-300",
      "[&>*]:group-hover:scale-[1.02]"
    )}>
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/0 to-black/0 group-hover:from-black/5 group-hover:to-transparent transition-all duration-300" />

      <div className="relative p-6">
        {children}
      </div>
    </div>
  );
}

// Pulse Animation for Notifications
function NotificationBadge({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <span className="relative">
      {/* Ping animation */}
      <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />

      {/* Badge */}
      <span className="relative inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
        {count > 9 ? "9+" : count}
      </span>
    </span>
  );
}

// Loading Spinner
function Spinner({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-3",
  };

  return (
    <div
      className={cn(
        sizes[size],
        "rounded-full border-gray-200 dark:border-gray-700 border-t-blue-600 animate-spin",
        className
      )}
    />
  );
}

// Skeleton Loading
function SkeletonCard() {
  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 space-y-4">
      {/* Animated skeleton elements */}
      <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      <div className="flex gap-4">
        <div className="h-10 flex-1 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    </div>
  );
}

// Page Transition Wrapper
function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-fade-in-up">
      {children}
    </div>
  );
}

// Typing Animation Effect
function TypingAnimation({ text }: { text: string }) {
  return (
    <span className="relative">
      <span className="animate-typing overflow-hidden whitespace-nowrap border-r-2 border-r-gray-900 dark:border-r-white pr-1">
        {text}
      </span>
    </span>
  );
}
```

```css
/* Additional keyframes for globals.css */
@layer utilities {
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes typing {
    from {
      width: 0;
    }
    to {
      width: 100%;
    }
  }

  .animate-fade-in-up {
    animation: fade-in-up 0.5s ease-out;
  }

  .animate-typing {
    animation: typing 2s steps(30, end), blink-caret 0.75s step-end infinite;
  }

  @keyframes blink-caret {
    from, to {
      border-color: transparent;
    }
    50% {
      border-color: currentColor;
    }
  }
}
```

**Gotchas:**
- Always test with prefers-reduced-motion: reduce
- Animations can cause performance issues on older devices
- Keep animation durations short (150-300ms for UI, up to 500ms for page transitions)
- Use will-change sparingly and remove it after animation

## Real-World Examples

### Example 1: Complete Landing Page Hero

```tsx
function LandingHero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" />

      {/* Animated grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]" />

      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob animation-delay-2000" />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm text-white/80 mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Now in public beta
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight animate-fade-in-up">
            Build faster with
            <span className="block mt-2 bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              modern design tools
            </span>
          </h1>

          {/* Description */}
          <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-white/70 animate-fade-in-up animation-delay-200">
            Create stunning user interfaces with our comprehensive design system. Built for developers who care about aesthetics.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-400">
            <button className="px-8 py-4 rounded-full bg-white text-slate-900 font-semibold hover:bg-white/90 transition-colors shadow-lg shadow-white/25">
              Get Started Free
            </button>
            <button className="px-8 py-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold hover:bg-white/20 transition-colors">
              View Documentation
            </button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 animate-fade-in-up animation-delay-600">
            {[
              { value: "10K+", label: "Developers" },
              { value: "50+", label: "Components" },
              { value: "99.9%", label: "Uptime" },
              { value: "4.9/5", label: "Rating" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-white/60">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-8 h-8 text-white/50" />
      </div>
    </section>
  );
}
```

### Example 2: Dashboard Stats Cards

```tsx
function StatsGrid() {
  const stats = [
    { title: "Total Revenue", value: "$45,231.89", change: "+20.1%", changeType: "positive", icon: DollarSign },
    { title: "Subscriptions", value: "+2,350", change: "+180.1%", changeType: "positive", icon: Users },
    { title: "Sales", value: "+12,234", change: "+19%", changeType: "positive", icon: CreditCard },
    { title: "Active Now", value: "+573", change: "+201", changeType: "neutral", icon: Activity },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.title}
          className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 transition-all hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600"
        >
          {/* Background gradient */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gray-100 dark:from-gray-700 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />

          <div className="relative">
            {/* Header */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
              <stat.icon className="w-4 h-4 text-gray-400" />
            </div>

            {/* Value */}
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <span
                className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full",
                  stat.changeType === "positive" && "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
                  stat.changeType === "negative" && "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
                  stat.changeType === "neutral" && "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                )}
              >
                {stat.change}
              </span>
            </div>

            {/* Footer */}
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">from last month</p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Example 3: Pricing Cards

```tsx
function PricingCards() {
  const plans = [
    {
      name: "Starter",
      price: 0,
      description: "Perfect for trying out our platform",
      features: ["5 projects", "Basic analytics", "24-hour support"],
      cta: "Get Started",
      highlighted: false,
    },
    {
      name: "Pro",
      price: 29,
      description: "Best for growing businesses",
      features: ["Unlimited projects", "Advanced analytics", "Priority support", "Custom integrations", "Team collaboration"],
      cta: "Start Free Trial",
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: 99,
      description: "For large-scale operations",
      features: ["Everything in Pro", "Dedicated account manager", "Custom SLA", "On-premise deployment", "Advanced security"],
      cta: "Contact Sales",
      highlighted: false,
    },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
      {plans.map((plan) => (
        <div
          key={plan.name}
          className={cn(
            "relative rounded-2xl p-8 transition-all",
            plan.highlighted
              ? "bg-gradient-to-b from-purple-600 to-purple-700 text-white shadow-xl shadow-purple-500/25 scale-105 z-10"
              : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg"
          )}
        >
          {/* Popular badge */}
          {plan.highlighted && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-orange-400 to-pink-400 text-white text-sm font-medium rounded-full">
              Most Popular
            </div>
          )}

          {/* Plan name */}
          <h3 className={cn(
            "text-lg font-semibold",
            plan.highlighted ? "text-white" : "text-gray-900 dark:text-white"
          )}>
            {plan.name}
          </h3>

          {/* Price */}
          <div className="mt-4 flex items-baseline gap-1">
            <span className={cn(
              "text-4xl font-bold",
              plan.highlighted ? "text-white" : "text-gray-900 dark:text-white"
            )}>
              ${plan.price}
            </span>
            <span className={cn(
              "text-sm",
              plan.highlighted ? "text-white/70" : "text-gray-500"
            )}>
              /month
            </span>
          </div>

          {/* Description */}
          <p className={cn(
            "mt-2 text-sm",
            plan.highlighted ? "text-white/80" : "text-gray-600 dark:text-gray-400"
          )}>
            {plan.description}
          </p>

          {/* Features */}
          <ul className="mt-6 space-y-3">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <Check className={cn(
                  "w-5 h-5 flex-shrink-0",
                  plan.highlighted ? "text-white" : "text-green-500"
                )} />
                <span className={cn(
                  "text-sm",
                  plan.highlighted ? "text-white/90" : "text-gray-600 dark:text-gray-300"
                )}>
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          {/* CTA Button */}
          <button className={cn(
            "mt-8 w-full py-3 px-4 rounded-xl font-semibold transition-all",
            plan.highlighted
              ? "bg-white text-purple-600 hover:bg-white/90"
              : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90"
          )}>
            {plan.cta}
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Related Skills

- `react-expert` - React component patterns and hooks
- `nextjs-app-router-mastery` - Server Components and App Router
- `framer-motion-animations` - Advanced animations with Framer Motion
- `shadcn-ui-expert` - shadcn/ui component library
- `radix-ui-primitives` - Accessible UI primitives
- `css-architecture` - CSS organization and best practices

## Further Reading

- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - Official docs
- [Tailwind UI](https://tailwindui.com) - Premium component library
- [Heroicons](https://heroicons.com) - Icons by Tailwind team
- [Headless UI](https://headlessui.com) - Accessible components
- [Refactoring UI](https://www.refactoringui.com) - Design tips by Tailwind creators
- [Adam Wathan's Blog](https://adamwathan.me) - Tailwind CSS creator's blog

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
*Master utility-first CSS for production applications*
'''

    filepath = os.path.join(SKILLS_DIR, 'tailwind-ui-designer.md')
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    line_count = content.count('\n') + 1
    print(f"tailwind-ui-designer.md: {line_count} lines")
    return line_count

if __name__ == "__main__":
    write_tailwind_ui_designer()
