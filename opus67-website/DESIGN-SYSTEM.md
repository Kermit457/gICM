# OPUS 67 Design System Architecture

> **Version:** 1.0.0
> **Last Updated:** 2025-12-04
> **Purpose:** Complete design system specification for OPUS 67 website rebuild

---

## Table of Contents

1. [Spacing Scale](#spacing-scale)
2. [Typography Scale](#typography-scale)
3. [Container System](#container-system)
4. [Color Palette](#color-palette)
5. [Component Structure](#component-structure)
6. [Layout Grid System](#layout-grid-system)
7. [Tailwind Configuration](#tailwind-configuration)
8. [Usage Patterns](#usage-patterns)

---

## Spacing Scale

### Base Scale (8px Grid System)

```typescript
// Spacing tokens
const spacing = {
  '0': '0px',
  '1': '4px',    // 0.25rem - Micro spacing
  '2': '8px',    // 0.5rem  - Tight spacing
  '3': '12px',   // 0.75rem - Compact spacing
  '4': '16px',   // 1rem    - Base spacing
  '6': '24px',   // 1.5rem  - Medium spacing
  '8': '32px',   // 2rem    - Large spacing
  '12': '48px',  // 3rem    - XL spacing
  '16': '64px',  // 4rem    - 2XL spacing
  '24': '96px',  // 6rem    - 3XL spacing
  '32': '128px', // 8rem    - 4XL spacing
}
```

### Semantic Usage

| Token | Value | Usage |
|-------|-------|-------|
| `1` | 4px | Icon padding, micro adjustments |
| `2` | 8px | Badge padding, tight button padding |
| `3` | 12px | Small component padding |
| `4` | 16px | Base component padding, text spacing |
| `6` | 24px | Card padding, section gaps |
| `8` | 32px | Large component padding, header spacing |
| `12` | 48px | Section padding (mobile) |
| `16` | 64px | Section padding (tablet) |
| `24` | 96px | Section padding (desktop) |
| `32` | 128px | Hero section padding, major sections |

### Responsive Spacing Pattern

```tsx
// Mobile-first responsive spacing
<div className="py-12 md:py-16 lg:py-24">
  {/* Content */}
</div>

// Section spacing hierarchy
<section className="py-16 md:py-24 lg:py-32"> {/* Major sections */}
  <div className="space-y-8 md:space-y-12">    {/* Section content */}
    <div className="space-y-4 md:space-y-6">   {/* Content blocks */}
      <div className="space-y-2">              {/* Tight groups */}
```

---

## Typography Scale

### Font Family

```typescript
const fontFamily = {
  sans: [
    'Inter',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'system-ui',
    'sans-serif'
  ],
  mono: [
    'Fira Code',
    'JetBrains Mono',
    'Menlo',
    'Monaco',
    'Consolas',
    'monospace'
  ]
}
```

### Type Scale

```typescript
const fontSize = {
  'xs':   ['0.75rem',  { lineHeight: '1rem',    letterSpacing: '0.02em' }],  // 12px
  'sm':   ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.01em' }],  // 14px
  'base': ['1rem',     { lineHeight: '1.5rem',  letterSpacing: '0' }],       // 16px
  'lg':   ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }], // 18px
  'xl':   ['1.25rem',  { lineHeight: '1.75rem', letterSpacing: '-0.01em' }], // 20px
  '2xl':  ['1.5rem',   { lineHeight: '2rem',    letterSpacing: '-0.02em' }], // 24px
  '3xl':  ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }], // 30px
  '4xl':  ['2.25rem',  { lineHeight: '2.5rem',  letterSpacing: '-0.03em' }], // 36px
  '5xl':  ['3rem',     { lineHeight: '1',       letterSpacing: '-0.03em' }], // 48px
  '6xl':  ['3.75rem',  { lineHeight: '1',       letterSpacing: '-0.04em' }], // 60px
  '7xl':  ['4.5rem',   { lineHeight: '1',       letterSpacing: '-0.04em' }], // 72px
  '8xl':  ['6rem',     { lineHeight: '1',       letterSpacing: '-0.05em' }], // 96px
}
```

### Semantic Typography

| Scale | Size | Usage |
|-------|------|-------|
| `xs` | 12px | Fine print, captions, metadata |
| `sm` | 14px | Secondary text, labels |
| `base` | 16px | Body text, paragraphs |
| `lg` | 18px | Large body text, introductions |
| `xl` | 20px | Subheadings, card titles |
| `2xl` | 24px | Section subheadings |
| `3xl` | 30px | Section headings |
| `4xl` | 36px | Page headings |
| `5xl` | 48px | Hero subheadings (mobile) |
| `6xl` | 60px | Hero headings (mobile) |
| `7xl` | 72px | Hero headings (tablet) |
| `8xl` | 96px | Hero headings (desktop) |

### Font Weight

```typescript
const fontWeight = {
  normal: '400',    // Body text
  medium: '500',    // Emphasis
  semibold: '600',  // Subheadings
  bold: '700',      // Headings
  extrabold: '800'  // Hero text
}
```

### Responsive Typography Pattern

```tsx
// Hero heading
<h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold">
  OPUS 67
</h1>

// Section heading
<h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
  Features
</h2>

// Body text
<p className="text-base md:text-lg leading-relaxed">
  Description text
</p>
```

---

## Container System

### Container Max-Widths

```typescript
const maxWidth = {
  'xs':   '20rem',    // 320px  - Narrow forms, alerts
  'sm':   '24rem',    // 384px  - Small cards
  'md':   '28rem',    // 448px  - Medium cards
  'lg':   '32rem',    // 512px  - Large cards
  'xl':   '36rem',    // 576px  - Content cards
  '2xl':  '42rem',    // 672px  - Reading width
  '3xl':  '48rem',    // 768px  - Article width
  '4xl':  '56rem',    // 896px  - Section content
  '5xl':  '64rem',    // 1024px - Wide sections
  '6xl':  '72rem',    // 1152px - Main container
  '7xl':  '80rem',    // 1280px - Max container
  'full': '100%',     // Full width
  'screen': '100vw'   // Viewport width
}
```

### Semantic Container Usage

| Width | Size | Usage |
|-------|------|-------|
| `xs` | 320px | Modals, dialogs, narrow forms |
| `sm` | 384px | Small feature cards |
| `md` | 448px | Medium feature cards |
| `lg` | 512px | Large feature cards |
| `xl` | 576px | Content cards, testimonials |
| `2xl` | 672px | Optimal reading width (45-75 chars) |
| `3xl` | 768px | Article content, blog posts |
| `4xl` | 896px | Section content blocks |
| `5xl` | 1024px | Wide feature sections |
| `6xl` | 1152px | Main page container |
| `7xl` | 1280px | Maximum page width |

### Container Pattern

```tsx
// Page wrapper (all pages)
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

  {/* Hero section - full width */}
  <section className="max-w-full">
    {/* Content */}
  </section>

  {/* Content section - wide */}
  <section className="max-w-6xl mx-auto">
    {/* Content */}
  </section>

  {/* Reading section - optimal */}
  <section className="max-w-2xl mx-auto">
    {/* Content */}
  </section>

</div>
```

---

## Color Palette

### Blue-Only Color System

```typescript
const colors = {
  // Neutral grays (for backgrounds, borders, text)
  gray: {
    50:  '#f9fafb',  // Lightest background
    100: '#f3f4f6',  // Light background
    200: '#e5e7eb',  // Subtle borders
    300: '#d1d5db',  // Borders
    400: '#9ca3af',  // Disabled text
    500: '#6b7280',  // Secondary text
    600: '#4b5563',  // Body text
    700: '#374151',  // Dark text
    800: '#1f2937',  // Headings
    900: '#111827',  // Darkest text
    950: '#030712',  // Pure black alternative
  },

  // Primary blue palette
  blue: {
    50:  '#eff6ff',  // Lightest tint (backgrounds)
    100: '#dbeafe',  // Very light (hover states)
    200: '#bfdbfe',  // Light (borders, accents)
    300: '#93c5fd',  // Medium light
    400: '#60a5fa',  // Medium (secondary buttons)
    500: '#3b82f6',  // Base blue (primary)
    600: '#2563eb',  // Dark (primary hover)
    700: '#1d4ed8',  // Darker (active states)
    800: '#1e40af',  // Very dark
    900: '#1e3a8a',  // Darkest blue
    950: '#172554',  // Pure navy alternative
  },

  // Utility colors (minimal use)
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
}
```

### Semantic Color Mapping

```typescript
// Brand colors
const brand = {
  primary:       'blue-500',  // Main brand color
  primaryHover:  'blue-600',  // Hover state
  primaryActive: 'blue-700',  // Active/pressed state
  primaryLight:  'blue-50',   // Light backgrounds
  primaryDark:   'blue-900',  // Dark elements
}

// UI colors
const ui = {
  background:       'white',     // Page background
  backgroundAlt:    'gray-50',   // Alternate sections
  backgroundDark:   'gray-900',  // Dark mode background

  surface:          'white',     // Card background
  surfaceAlt:       'gray-50',   // Alternate cards
  surfaceHover:     'gray-100',  // Hover state

  border:           'gray-200',  // Default borders
  borderHover:      'gray-300',  // Hover borders
  borderFocus:      'blue-500',  // Focus borders

  text:             'gray-900',  // Body text
  textSecondary:    'gray-600',  // Secondary text
  textTertiary:     'gray-500',  // Tertiary text
  textInverse:      'white',     // Text on dark bg

  disabled:         'gray-400',  // Disabled state
  disabledBg:       'gray-100',  // Disabled background
}

// Interactive colors
const interactive = {
  link:             'blue-600',  // Links
  linkHover:        'blue-700',  // Link hover
  linkVisited:      'blue-800',  // Visited links

  success:          'blue-600',  // Success states (use blue)
  info:             'blue-500',  // Info states
  warning:          'gray-600',  // Warnings (use gray)
  error:            'gray-900',  // Errors (use dark gray)
}
```

### Color Usage Guidelines

**Backgrounds:**
```tsx
// Page sections
<section className="bg-white">         {/* Primary */}
<section className="bg-gray-50">       {/* Alternate */}
<section className="bg-blue-50">       {/* Accent */}
<section className="bg-gray-900">      {/* Dark */}
```

**Text:**
```tsx
// Typography
<h1 className="text-gray-900">         {/* Headings */}
<p className="text-gray-600">          {/* Body */}
<span className="text-gray-500">      {/* Secondary */}
<a className="text-blue-600">         {/* Links */}
```

**Buttons:**
```tsx
// Primary button
<button className="bg-blue-500 text-white hover:bg-blue-600">

// Secondary button
<button className="bg-white text-blue-600 border border-blue-500 hover:bg-blue-50">

// Ghost button
<button className="text-blue-600 hover:bg-blue-50">
```

---

## Component Structure

### Component Categories

```
components/
├── layout/           # Layout components
│   ├── Container.tsx
│   ├── Section.tsx
│   ├── Grid.tsx
│   └── Stack.tsx
├── typography/       # Text components
│   ├── Heading.tsx
│   ├── Text.tsx
│   ├── Label.tsx
│   └── Code.tsx
├── interactive/      # Interactive elements
│   ├── Button.tsx
│   ├── Link.tsx
│   ├── Input.tsx
│   └── Card.tsx
├── navigation/       # Navigation components
│   ├── Nav.tsx
│   ├── Menu.tsx
│   └── Breadcrumb.tsx
└── display/          # Display components
    ├── Badge.tsx
    ├── Avatar.tsx
    ├── Icon.tsx
    └── Logo.tsx
```

### Base Component Pattern

```tsx
// Base component with design system tokens
import { cn } from '@/lib/utils'

export interface ComponentProps {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children: React.ReactNode
}

export function Component({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ComponentProps) {
  return (
    <div
      className={cn(
        // Base styles
        'transition-all duration-200',

        // Variant styles
        variant === 'primary' && 'bg-blue-500 text-white',
        variant === 'secondary' && 'bg-white text-blue-600 border border-blue-500',
        variant === 'ghost' && 'bg-transparent text-blue-600',

        // Size styles
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2 text-base',
        size === 'lg' && 'px-6 py-3 text-lg',

        // Custom styles
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
```

### Container Component

```tsx
// layout/Container.tsx
import { cn } from '@/lib/utils'

export interface ContainerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full'
  padding?: boolean
  className?: string
  children: React.ReactNode
}

export function Container({
  size = '6xl',
  padding = true,
  className,
  children
}: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full',

        // Max width
        size === 'sm' && 'max-w-sm',
        size === 'md' && 'max-w-md',
        size === 'lg' && 'max-w-lg',
        size === 'xl' && 'max-w-xl',
        size === '2xl' && 'max-w-2xl',
        size === '3xl' && 'max-w-3xl',
        size === '4xl' && 'max-w-4xl',
        size === '5xl' && 'max-w-5xl',
        size === '6xl' && 'max-w-6xl',
        size === '7xl' && 'max-w-7xl',
        size === 'full' && 'max-w-full',

        // Responsive padding
        padding && 'px-4 sm:px-6 lg:px-8',

        className
      )}
    >
      {children}
    </div>
  )
}
```

### Section Component

```tsx
// layout/Section.tsx
import { cn } from '@/lib/utils'
import { Container } from './Container'

export interface SectionProps {
  variant?: 'default' | 'alt' | 'accent' | 'dark'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  containerSize?: ContainerProps['size']
  className?: string
  children: React.ReactNode
}

export function Section({
  variant = 'default',
  padding = 'lg',
  containerSize = '6xl',
  className,
  children
}: SectionProps) {
  return (
    <section
      className={cn(
        // Background variants
        variant === 'default' && 'bg-white',
        variant === 'alt' && 'bg-gray-50',
        variant === 'accent' && 'bg-blue-50',
        variant === 'dark' && 'bg-gray-900 text-white',

        // Responsive padding
        padding === 'none' && '',
        padding === 'sm' && 'py-8 md:py-12',
        padding === 'md' && 'py-12 md:py-16',
        padding === 'lg' && 'py-16 md:py-24',
        padding === 'xl' && 'py-24 md:py-32',

        className
      )}
    >
      <Container size={containerSize}>
        {children}
      </Container>
    </section>
  )
}
```

### Button Component

```tsx
// interactive/Button.tsx
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        // Base styles
        'inline-flex items-center justify-center',
        'font-medium rounded-lg',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',

        // Variant styles
        variant === 'primary' && [
          'bg-blue-500 text-white',
          'hover:bg-blue-600',
          'focus:ring-blue-500'
        ],
        variant === 'secondary' && [
          'bg-white text-blue-600',
          'border border-blue-500',
          'hover:bg-blue-50',
          'focus:ring-blue-500'
        ],
        variant === 'ghost' && [
          'bg-transparent text-blue-600',
          'hover:bg-blue-50',
          'focus:ring-blue-500'
        ],
        variant === 'outline' && [
          'bg-transparent text-gray-700',
          'border border-gray-300',
          'hover:bg-gray-50',
          'focus:ring-gray-500'
        ],

        // Size styles
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2 text-base',
        size === 'lg' && 'px-6 py-3 text-lg',

        // Width
        fullWidth && 'w-full',

        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
```

---

## Layout Grid System

### Grid Breakpoints

```typescript
const screens = {
  'sm': '640px',   // Mobile landscape, small tablets
  'md': '768px',   // Tablets
  'lg': '1024px',  // Laptops, small desktops
  'xl': '1280px',  // Desktops
  '2xl': '1536px', // Large desktops
}
```

### Grid Patterns

**12-Column Grid:**
```tsx
// Feature grid (3 columns)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
  <FeatureCard />
  <FeatureCard />
  <FeatureCard />
</div>

// Content grid (2 columns)
<div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
  <div>Left content</div>
  <div>Right content</div>
</div>

// Sidebar layout
<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
  <main className="lg:col-span-8">Main content</main>
  <aside className="lg:col-span-4">Sidebar</aside>
</div>
```

**Flexbox Patterns:**
```tsx
// Center content
<div className="flex items-center justify-center min-h-screen">
  <div>Centered content</div>
</div>

// Horizontal stack with spacing
<div className="flex items-center gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>

// Vertical stack
<div className="flex flex-col gap-6">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

**Space-Y Pattern:**
```tsx
// Vertical spacing without flex
<div className="space-y-6">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>

// Responsive vertical spacing
<div className="space-y-4 md:space-y-6 lg:space-y-8">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

---

## Tailwind Configuration

### Complete tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Spacing scale
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '6': '24px',
        '8': '32px',
        '12': '48px',
        '16': '64px',
        '24': '96px',
        '32': '128px',
      },

      // Typography
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'system-ui',
          'sans-serif'
        ],
        mono: [
          'Fira Code',
          'JetBrains Mono',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace'
        ]
      },
      fontSize: {
        'xs':   ['0.75rem',  { lineHeight: '1rem',    letterSpacing: '0.02em' }],
        'sm':   ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.01em' }],
        'base': ['1rem',     { lineHeight: '1.5rem',  letterSpacing: '0' }],
        'lg':   ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        'xl':   ['1.25rem',  { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        '2xl':  ['1.5rem',   { lineHeight: '2rem',    letterSpacing: '-0.02em' }],
        '3xl':  ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        '4xl':  ['2.25rem',  { lineHeight: '2.5rem',  letterSpacing: '-0.03em' }],
        '5xl':  ['3rem',     { lineHeight: '1',       letterSpacing: '-0.03em' }],
        '6xl':  ['3.75rem',  { lineHeight: '1',       letterSpacing: '-0.04em' }],
        '7xl':  ['4.5rem',   { lineHeight: '1',       letterSpacing: '-0.04em' }],
        '8xl':  ['6rem',     { lineHeight: '1',       letterSpacing: '-0.05em' }],
      },

      // Containers
      maxWidth: {
        'xs':   '20rem',
        'sm':   '24rem',
        'md':   '28rem',
        'lg':   '32rem',
        'xl':   '36rem',
        '2xl':  '42rem',
        '3xl':  '48rem',
        '4xl':  '56rem',
        '5xl':  '64rem',
        '6xl':  '72rem',
        '7xl':  '80rem',
      },

      // Colors (blue-only palette)
      colors: {
        blue: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
      },

      // Border radius
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',  // 2px
        'DEFAULT': '0.25rem',  // 4px
        'md': '0.375rem',  // 6px
        'lg': '0.5rem',    // 8px
        'xl': '0.75rem',   // 12px
        '2xl': '1rem',     // 16px
        '3xl': '1.5rem',   // 24px
        'full': '9999px',
      },

      // Shadows
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        'none': 'none',
      },

      // Animation
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
```

---

## Usage Patterns

### Page Structure Template

```tsx
import { Container, Section } from '@/components/layout'
import { Button } from '@/components/interactive'
import { Heading, Text } from '@/components/typography'

export default function Page() {
  return (
    <>
      {/* Hero Section - Full width, large padding */}
      <Section variant="default" padding="xl" containerSize="7xl">
        <div className="text-center space-y-6">
          <Heading level={1} className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
            OPUS 67
          </Heading>
          <Text size="lg" className="max-w-2xl mx-auto">
            Claude AI with superpowers
          </Text>
          <div className="flex items-center justify-center gap-4">
            <Button variant="primary" size="lg">Get Started</Button>
            <Button variant="secondary" size="lg">Learn More</Button>
          </div>
        </div>
      </Section>

      {/* Feature Section - Alternate background */}
      <Section variant="alt" padding="lg" containerSize="6xl">
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <Heading level={2} className="text-3xl md:text-4xl lg:text-5xl">
              Features
            </Heading>
            <Text size="lg" className="max-w-3xl mx-auto">
              Everything you need to enhance Claude AI
            </Text>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature cards */}
          </div>
        </div>
      </Section>

      {/* Content Section - Reading width */}
      <Section variant="default" padding="lg" containerSize="3xl">
        <div className="space-y-6">
          <Heading level={2} className="text-3xl md:text-4xl">
            Documentation
          </Heading>
          <div className="prose prose-lg">
            {/* Content */}
          </div>
        </div>
      </Section>

      {/* CTA Section - Accent background */}
      <Section variant="accent" padding="lg" containerSize="5xl">
        <div className="text-center space-y-6">
          <Heading level={2} className="text-3xl md:text-4xl lg:text-5xl">
            Ready to get started?
          </Heading>
          <Button variant="primary" size="lg">Start Now</Button>
        </div>
      </Section>
    </>
  )
}
```

### Component Composition Pattern

```tsx
// Build complex layouts from simple components

import { Container, Section, Grid } from '@/components/layout'
import { Card } from '@/components/interactive'
import { Heading, Text } from '@/components/typography'

export function FeatureGrid() {
  return (
    <Section variant="alt" padding="lg">
      <div className="space-y-12">
        <div className="text-center space-y-4">
          <Heading level={2}>Features</Heading>
          <Text size="lg">Everything you need</Text>
        </div>

        <Grid cols={{ default: 1, md: 2, lg: 3 }} gap={8}>
          <Card>
            <div className="space-y-4">
              <Heading level={3}>Feature 1</Heading>
              <Text>Description</Text>
            </div>
          </Card>
          <Card>
            <div className="space-y-4">
              <Heading level={3}>Feature 2</Heading>
              <Text>Description</Text>
            </div>
          </Card>
          <Card>
            <div className="space-y-4">
              <Heading level={3}>Feature 3</Heading>
              <Text>Description</Text>
            </div>
          </Card>
        </Grid>
      </div>
    </Section>
  )
}
```

### Responsive Pattern Best Practices

```tsx
// Mobile-first responsive design

// Spacing
<div className="py-12 md:py-16 lg:py-24">

// Typography
<h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl">

// Layout
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">

// Visibility
<div className="block md:hidden"> {/* Mobile only */}
<div className="hidden md:block"> {/* Desktop only */}

// Width
<div className="w-full md:w-auto">

// Flex direction
<div className="flex flex-col md:flex-row gap-4">
```

---

## Implementation Checklist

### Phase 1: Setup
- [ ] Install Tailwind CSS
- [ ] Configure tailwind.config.ts
- [ ] Install Inter font (Google Fonts)
- [ ] Install Fira Code font (optional)
- [ ] Set up CSS variables

### Phase 2: Base Components
- [ ] Create Container component
- [ ] Create Section component
- [ ] Create Grid component
- [ ] Create Button component
- [ ] Create Heading component
- [ ] Create Text component

### Phase 3: Design Tokens
- [ ] Implement spacing scale
- [ ] Implement typography scale
- [ ] Implement color palette
- [ ] Test responsive breakpoints

### Phase 4: Testing
- [ ] Test on mobile (375px)
- [ ] Test on tablet (768px)
- [ ] Test on desktop (1280px)
- [ ] Test on large desktop (1920px)
- [ ] Verify accessibility (contrast, focus states)

### Phase 5: Documentation
- [ ] Document component usage
- [ ] Create Storybook stories
- [ ] Write usage examples
- [ ] Create design system guide

---

## Design Principles

1. **Mobile-First**: Design for small screens first, enhance for larger screens
2. **Consistency**: Use design tokens consistently across all components
3. **Accessibility**: Meet WCAG 2.1 AA standards (4.5:1 contrast minimum)
4. **Performance**: Optimize for Core Web Vitals (LCP, FID, CLS)
5. **Scalability**: Components should be composable and reusable
6. **Simplicity**: Keep the design clean and focused (blue-only palette)

---

## Resources

### Tools
- Tailwind CSS: https://tailwindcss.com
- Tailwind CSS IntelliSense (VSCode extension)
- Headless UI: https://headlessui.com (for complex components)

### Typography
- Inter font: https://fonts.google.com/specimen/Inter
- Type Scale Calculator: https://typescale.com

### Color
- Tailwind Blue Palette: https://tailwindcss.com/docs/customizing-colors
- Contrast Checker: https://webaim.org/resources/contrastchecker

### Testing
- Responsively App: https://responsively.app
- Chrome DevTools Device Mode
- BrowserStack for cross-browser testing

---

**End of Design System Specification**
