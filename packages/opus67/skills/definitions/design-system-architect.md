# Design System Architect

> **ID:** `design-system-architect`
> **Tier:** 2
> **Token Cost:** 8000
> **MCP Connections:** context7

## What This Skill Does

Architect and build scalable design systems. Master design tokens, component primitives, documentation, and versioning strategies for enterprise-grade UI libraries.

- Build scalable design token systems
- Create component documentation
- Implement design primitives
- Build with Storybook
- Version and publish component libraries
- Accessibility-first component design
- Cross-platform design consistency
- Theme switching and customization
- Component API design
- Migration strategies

## When to Use

This skill is automatically loaded when:

- **Keywords:** design system, tokens, storybook, primitives, component library
- **File Types:** tokens.json, .stories.tsx
- **Directories:** /design-system, /packages/ui

## Core Capabilities

### 1. Design Token Architecture

Build a scalable token system.

**Token Structure:**

```typescript
// packages/tokens/src/tokens.ts
export interface DesignTokens {
  color: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  radius: RadiusTokens;
  shadow: ShadowTokens;
  animation: AnimationTokens;
}

interface ColorTokens {
  // Primitive colors
  primitive: {
    gray: Record<string, string>;
    blue: Record<string, string>;
    green: Record<string, string>;
    red: Record<string, string>;
    yellow: Record<string, string>;
  };
  // Semantic colors
  semantic: {
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
      inverse: string;
    };
    foreground: {
      primary: string;
      secondary: string;
      muted: string;
      inverse: string;
    };
    border: {
      default: string;
      muted: string;
      focus: string;
    };
    status: {
      success: string;
      warning: string;
      error: string;
      info: string;
    };
  };
}

interface TypographyTokens {
  fontFamily: {
    sans: string;
    mono: string;
  };
  fontSize: Record<string, string>;
  fontWeight: Record<string, number>;
  lineHeight: Record<string, string>;
  letterSpacing: Record<string, string>;
}

interface SpacingTokens {
  [key: string]: string;
}

// Token definitions
export const tokens: DesignTokens = {
  color: {
    primitive: {
      gray: {
        50: '#fafafa',
        100: '#f4f4f5',
        200: '#e4e4e7',
        300: '#d4d4d8',
        400: '#a1a1aa',
        500: '#71717a',
        600: '#52525b',
        700: '#3f3f46',
        800: '#27272a',
        900: '#18181b',
        950: '#09090b',
      },
      blue: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
      },
      // ... other colors
    },
    semantic: {
      background: {
        primary: 'var(--color-gray-50)',
        secondary: 'var(--color-gray-100)',
        tertiary: 'var(--color-gray-200)',
        inverse: 'var(--color-gray-900)',
      },
      foreground: {
        primary: 'var(--color-gray-900)',
        secondary: 'var(--color-gray-700)',
        muted: 'var(--color-gray-500)',
        inverse: 'var(--color-gray-50)',
      },
      border: {
        default: 'var(--color-gray-200)',
        muted: 'var(--color-gray-100)',
        focus: 'var(--color-blue-500)',
      },
      status: {
        success: 'var(--color-green-500)',
        warning: 'var(--color-yellow-500)',
        error: 'var(--color-red-500)',
        info: 'var(--color-blue-500)',
      },
    },
  },
  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, sans-serif',
      mono: 'JetBrains Mono, monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
    letterSpacing: {
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
    },
  },
  spacing: {
    0: '0',
    px: '1px',
    0.5: '0.125rem',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
  },
  radius: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
  },
  shadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  },
  animation: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
};
```

**Token to CSS Generator:**

```typescript
// packages/tokens/src/generators/css.ts
import { DesignTokens } from '../tokens';

export function generateCSSVariables(tokens: DesignTokens): string {
  const lines: string[] = [':root {'];
  
  // Primitive colors
  for (const [colorName, shades] of Object.entries(tokens.color.primitive)) {
    for (const [shade, value] of Object.entries(shades)) {
      lines.push(`  --color-${colorName}-${shade}: ${value};`);
    }
  }
  
  // Typography
  for (const [key, value] of Object.entries(tokens.typography.fontFamily)) {
    lines.push(`  --font-${key}: ${value};`);
  }
  
  for (const [key, value] of Object.entries(tokens.typography.fontSize)) {
    lines.push(`  --text-${key}: ${value};`);
  }
  
  // Spacing
  for (const [key, value] of Object.entries(tokens.spacing)) {
    lines.push(`  --spacing-${key}: ${value};`);
  }
  
  // Radius
  for (const [key, value] of Object.entries(tokens.radius)) {
    lines.push(`  --radius-${key}: ${value};`);
  }
  
  // Shadow
  for (const [key, value] of Object.entries(tokens.shadow)) {
    lines.push(`  --shadow-${key}: ${value};`);
  }
  
  lines.push('}');
  
  // Semantic tokens (can be overridden per theme)
  lines.push('');
  lines.push(':root {');
  
  const semantic = tokens.color.semantic;
  for (const [category, values] of Object.entries(semantic)) {
    for (const [key, value] of Object.entries(values as Record<string, string>)) {
      lines.push(`  --${category}-${key}: ${value};`);
    }
  }
  
  lines.push('}');
  
  return lines.join('\n');
}

// Dark theme overrides
export function generateDarkTheme(tokens: DesignTokens): string {
  return `
[data-theme="dark"] {
  --background-primary: var(--color-gray-900);
  --background-secondary: var(--color-gray-800);
  --background-tertiary: var(--color-gray-700);
  --background-inverse: var(--color-gray-50);
  
  --foreground-primary: var(--color-gray-50);
  --foreground-secondary: var(--color-gray-300);
  --foreground-muted: var(--color-gray-500);
  --foreground-inverse: var(--color-gray-900);
  
  --border-default: var(--color-gray-700);
  --border-muted: var(--color-gray-800);
}
`;
}
```

**Best Practices:**
- Separate primitive and semantic tokens
- Use CSS custom properties for runtime theming
- Version tokens alongside components
- Document token naming conventions
- Generate tokens for multiple platforms

**Gotchas:**
- CSS variables don't work in media queries
- Token naming conflicts across themes
- Opacity variants need separate handling
- Build tool config for CSS generation

### 2. Component Primitives

Build foundational components.

**Primitive Component Pattern:**

```typescript
// packages/ui/src/primitives/box.tsx
import { forwardRef, ElementType, ComponentPropsWithoutRef } from 'react';
import { cn } from '../utils/cn';

type BoxProps<T extends ElementType = 'div'> = {
  as?: T;
  className?: string;
} & ComponentPropsWithoutRef<T>;

export const Box = forwardRef(function Box<T extends ElementType = 'div'>(
  { as, className, ...props }: BoxProps<T>,
  ref: React.Ref<Element>
) {
  const Component = as || 'div';
  return <Component ref={ref} className={cn(className)} {...props} />;
}) as <T extends ElementType = 'div'>(
  props: BoxProps<T> & { ref?: React.Ref<Element> }
) => React.ReactElement | null;
```

**Text Primitive:**

```typescript
// packages/ui/src/primitives/text.tsx
import { forwardRef, ElementType, ComponentPropsWithoutRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const textVariants = cva('', {
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
      '4xl': 'text-4xl',
    },
    weight: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
    color: {
      primary: 'text-foreground-primary',
      secondary: 'text-foreground-secondary',
      muted: 'text-foreground-muted',
      inverse: 'text-foreground-inverse',
      success: 'text-status-success',
      warning: 'text-status-warning',
      error: 'text-status-error',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
    truncate: {
      true: 'truncate',
      false: '',
    },
  },
  defaultVariants: {
    size: 'base',
    weight: 'normal',
    color: 'primary',
    align: 'left',
    truncate: false,
  },
});

type TextVariants = VariantProps<typeof textVariants>;

type TextProps<T extends ElementType = 'span'> = {
  as?: T;
  className?: string;
} & TextVariants &
  ComponentPropsWithoutRef<T>;

export const Text = forwardRef(function Text<T extends ElementType = 'span'>(
  { as, size, weight, color, align, truncate, className, ...props }: TextProps<T>,
  ref: React.Ref<Element>
) {
  const Component = as || 'span';
  return (
    <Component
      ref={ref}
      className={cn(textVariants({ size, weight, color, align, truncate }), className)}
      {...props}
    />
  );
}) as <T extends ElementType = 'span'>(
  props: TextProps<T> & { ref?: React.Ref<Element> }
) => React.ReactElement | null;
```

**Stack Primitive:**

```typescript
// packages/ui/src/primitives/stack.tsx
import { forwardRef, ElementType, ComponentPropsWithoutRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const stackVariants = cva('flex', {
  variants: {
    direction: {
      row: 'flex-row',
      column: 'flex-col',
      'row-reverse': 'flex-row-reverse',
      'column-reverse': 'flex-col-reverse',
    },
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
      baseline: 'items-baseline',
    },
    justify: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    },
    wrap: {
      true: 'flex-wrap',
      false: 'flex-nowrap',
    },
    gap: {
      0: 'gap-0',
      1: 'gap-1',
      2: 'gap-2',
      3: 'gap-3',
      4: 'gap-4',
      5: 'gap-5',
      6: 'gap-6',
      8: 'gap-8',
      10: 'gap-10',
      12: 'gap-12',
    },
  },
  defaultVariants: {
    direction: 'column',
    align: 'stretch',
    justify: 'start',
    wrap: false,
    gap: 0,
  },
});

type StackVariants = VariantProps<typeof stackVariants>;

type StackProps<T extends ElementType = 'div'> = {
  as?: T;
  className?: string;
} & StackVariants &
  ComponentPropsWithoutRef<T>;

export const Stack = forwardRef(function Stack<T extends ElementType = 'div'>(
  { as, direction, align, justify, wrap, gap, className, ...props }: StackProps<T>,
  ref: React.Ref<Element>
) {
  const Component = as || 'div';
  return (
    <Component
      ref={ref}
      className={cn(stackVariants({ direction, align, justify, wrap, gap }), className)}
      {...props}
    />
  );
}) as <T extends ElementType = 'div'>(
  props: StackProps<T> & { ref?: React.Ref<Element> }
) => React.ReactElement | null;

// Convenience components
export const HStack = forwardRef<HTMLDivElement, Omit<StackProps, 'direction'>>(
  (props, ref) => <Stack ref={ref} direction="row" {...props} />
);

export const VStack = forwardRef<HTMLDivElement, Omit<StackProps, 'direction'>>(
  (props, ref) => <Stack ref={ref} direction="column" {...props} />
);
```

**Best Practices:**
- Use polymorphic components for flexibility
- Implement with class-variance-authority
- Forward refs properly
- Type components correctly
- Provide convenience wrappers

**Gotchas:**
- TypeScript generics can be complex
- forwardRef typing needs special handling
- Polymorphic as prop conflicts with native props
- Default variant values matter

### 3. Storybook Documentation

Document components with Storybook.

**Storybook Configuration:**

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../packages/ui/src/**/*.stories.@(ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-designs',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
};

export default config;
```

**Component Story:**

```typescript
// packages/ui/src/components/button/button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
import { HStack } from '../../primitives/stack';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/xxx/Design-System?node-id=123',
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'destructive'],
      description: 'The visual style of the button',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'The size of the button',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
    loading: {
      control: 'boolean',
      description: 'Whether to show loading state',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'primary',
    size: 'md',
  },
};

export const Variants: Story = {
  render: () => (
    <HStack gap={4}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
    </HStack>
  ),
};

export const Sizes: Story = {
  render: () => (
    <HStack gap={4} align="center">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </HStack>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <HStack gap={4}>
      <Button leftIcon={<PlusIcon />}>Add Item</Button>
      <Button rightIcon={<ArrowRightIcon />}>Continue</Button>
      <Button leftIcon={<DownloadIcon />} rightIcon={<ExternalLinkIcon />}>
        Download
      </Button>
    </HStack>
  ),
};

export const Loading: Story = {
  args: {
    children: 'Loading',
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
  },
};

export const AsLink: Story = {
  render: () => (
    <Button as="a" href="https://example.com">
      Link Button
    </Button>
  ),
};
```

**Documentation MDX:**

```mdx
{/* packages/ui/src/components/button/button.mdx */}
import { Meta, Canvas, Controls, Story } from '@storybook/blocks';
import * as ButtonStories from './button.stories';

<Meta of={ButtonStories} />

# Button

Buttons allow users to take actions and make choices with a single tap.

## Usage

```tsx
import { Button } from '@company/ui';

function Example() {
  return <Button onClick={() => console.log('clicked')}>Click me</Button>;
}
```

## Variants

Buttons come in several visual variants:

<Canvas of={ButtonStories.Variants} />

## Sizes

Three sizes are available:

<Canvas of={ButtonStories.Sizes} />

## Props

<Controls />

## Accessibility

- Use clear, action-oriented labels
- Provide aria-label for icon-only buttons
- Ensure sufficient color contrast
- Support keyboard navigation

## Design Guidelines

- Use primary buttons for the main action
- Limit to one primary button per section
- Use outline/ghost for secondary actions
- Use destructive for dangerous actions
```

**Best Practices:**
- Enable autodocs for all components
- Link to Figma designs
- Show all variants in stories
- Include accessibility notes
- Document props thoroughly

**Gotchas:**
- MDX imports can be tricky
- Storybook builds can be slow
- Addon compatibility issues
- CSS loading order matters

### 4. Component Library Publishing

Version and publish your library.

**Package Configuration:**

```json
// packages/ui/package.json
{
  "name": "@company/ui",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./styles.css": "./dist/styles.css"
  },
  "sideEffects": [
    "**/*.css"
  ],
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "lint": "eslint src",
    "type-check": "tsc --noEmit",
    "test": "vitest"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "react": "^18.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.0.0"
  },
  "dependencies": {
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  }
}
```

**Build Configuration:**

```typescript
// packages/ui/tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  esbuildOptions(options) {
    options.banner = {
      js: '"use client"',
    };
  },
});
```

**Changesets Configuration:**

```json
// .changeset/config.json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "restricted",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

**Release Workflow:**

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches:
      - main

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm build

      - name: Create Release PR or Publish
        uses: changesets/action@v1
        with:
          publish: pnpm release
          version: pnpm version-packages
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Best Practices:**
- Use changesets for versioning
- Publish to npm with provenance
- Generate TypeScript declarations
- Include source maps for debugging
- Document breaking changes

**Gotchas:**
- Peer dependency conflicts
- CSS bundling strategies vary
- Tree-shaking needs proper exports
- "use client" directive placement

### 5. Theme System

Implement theme switching.

**Theme Provider:**

```typescript
// packages/ui/src/theme/theme-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = localStorage.getItem(storageKey) as Theme | null;
    if (stored) {
      setThemeState(stored);
    }
  }, [storageKey]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    let resolved: 'light' | 'dark';

    if (theme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    } else {
      resolved = theme;
    }

    root.classList.add(resolved);
    root.setAttribute('data-theme', resolved);
    setResolvedTheme(resolved);
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const resolved = mediaQuery.matches ? 'dark' : 'light';
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(resolved);
      document.documentElement.setAttribute('data-theme', resolved);
      setResolvedTheme(resolved);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme);
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

**Theme Toggle Component:**

```typescript
// packages/ui/src/components/theme-toggle.tsx
'use client';

import { useTheme } from '../theme/theme-provider';
import { Button } from './button';
import { SunIcon, MoonIcon, MonitorIcon } from '../icons';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const nextTheme = (): void => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const icon =
    theme === 'system' ? (
      <MonitorIcon />
    ) : resolvedTheme === 'dark' ? (
      <MoonIcon />
    ) : (
      <SunIcon />
    );

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={nextTheme}
      aria-label={`Current theme: ${theme}. Click to change.`}
    >
      {icon}
    </Button>
  );
}
```

**Best Practices:**
- Support system preference
- Persist theme choice
- Prevent flash of unstyled content
- Use CSS custom properties
- Provide hook for programmatic access

**Gotchas:**
- SSR hydration mismatch
- Flash of wrong theme on load
- System preference changes need listeners
- localStorage not available in SSR

## Real-World Examples

### Example 1: Complete Button Component

```typescript
// packages/ui/src/components/button/button.tsx
import { forwardRef, ElementType, ComponentPropsWithoutRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { Spinner } from '../spinner';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500',
        outline: 'border border-gray-300 bg-transparent hover:bg-gray-100 focus-visible:ring-gray-500',
        ghost: 'bg-transparent hover:bg-gray-100 focus-visible:ring-gray-500',
        destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

type ButtonVariants = VariantProps<typeof buttonVariants>;

type ButtonProps<T extends ElementType = 'button'> = {
  as?: T;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
} & ButtonVariants &
  ComponentPropsWithoutRef<T>;

export const Button = forwardRef(function Button<T extends ElementType = 'button'>(
  {
    as,
    variant,
    size,
    fullWidth,
    loading,
    leftIcon,
    rightIcon,
    disabled,
    className,
    children,
    ...props
  }: ButtonProps<T>,
  ref: React.Ref<Element>
) {
  const Component = as || 'button';
  const isDisabled = disabled || loading;

  return (
    <Component
      ref={ref}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      {...props}
    >
      {loading && <Spinner className="mr-2 h-4 w-4" />}
      {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </Component>
  );
}) as <T extends ElementType = 'button'>(
  props: ButtonProps<T> & { ref?: React.Ref<Element> }
) => React.ReactElement | null;

Button.displayName = 'Button';
```

### Example 2: Form Input with Validation

```typescript
// packages/ui/src/components/input/input.tsx
import { forwardRef, useId } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { Text } from '../../primitives/text';
import { Stack } from '../../primitives/stack';

const inputVariants = cva(
  'flex w-full rounded-md border bg-transparent px-3 py-2 text-sm placeholder:text-muted transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-gray-300 focus-visible:ring-blue-500',
        error: 'border-red-500 focus-visible:ring-red-500',
      },
      inputSize: {
        sm: 'h-8 text-sm',
        md: 'h-10 text-sm',
        lg: 'h-12 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'md',
    },
  }
);

type InputVariants = VariantProps<typeof inputVariants>;

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>, InputVariants {
  label?: string;
  description?: string;
  error?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      description,
      error,
      leftAddon,
      rightAddon,
      variant,
      inputSize,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const descriptionId = `${inputId}-description`;
    const errorId = `${inputId}-error`;

    const computedVariant = error ? 'error' : variant;

    return (
      <Stack gap={1}>
        {label && (
          <Text as="label" htmlFor={inputId} size="sm" weight="medium">
            {label}
          </Text>
        )}
        {description && (
          <Text id={descriptionId} size="sm" color="muted">
            {description}
          </Text>
        )}
        <div className="relative flex items-center">
          {leftAddon && (
            <div className="absolute left-3 text-gray-500">{leftAddon}</div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              inputVariants({ variant: computedVariant, inputSize }),
              leftAddon && 'pl-10',
              rightAddon && 'pr-10',
              className
            )}
            aria-describedby={
              [description && descriptionId, error && errorId].filter(Boolean).join(' ') || undefined
            }
            aria-invalid={!!error}
            {...props}
          />
          {rightAddon && (
            <div className="absolute right-3 text-gray-500">{rightAddon}</div>
          )}
        </div>
        {error && (
          <Text id={errorId} size="sm" color="error">
            {error}
          </Text>
        )}
      </Stack>
    );
  }
);

Input.displayName = 'Input';
```

## Related Skills

- **figma-to-code** - Design handoff
- **storybook-advanced** - Advanced documentation
- **accessibility** - WCAG compliance
- **tailwind-expert** - Utility-first CSS

## Further Reading

- [Design Tokens W3C](https://design-tokens.github.io/community-group/format/)
- [Storybook Documentation](https://storybook.js.org/docs)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Changesets](https://github.com/changesets/changesets)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
