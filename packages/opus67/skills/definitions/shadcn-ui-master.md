# Shadcn/UI Master

> **ID:** `shadcn-ui-master`
> **Tier:** 2
> **Token Cost:** 6000
> **MCP Connections:** context7

## 🎯 What This Skill Does

- Configure and customize shadcn/ui
- Build accessible component variants
- Extend with custom components
- Theme customization with CSS variables
- Combine with Radix primitives
- Dark mode implementation
- Form components with react-hook-form

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** shadcn, radix, ui components, component library, cn, cva
- **File Types:** N/A
- **Directories:** N/A

## 🚀 Core Capabilities


### 1. Configure and customize shadcn/ui

Shadcn/ui is a collection of re-usable components built with Radix UI and Tailwind CSS. Unlike traditional component libraries, you copy components directly into your project.

**Best Practices:**
- Always initialize with `npx shadcn-ui@latest init` for proper setup
- Use the CLI to add components: `npx shadcn-ui@latest add button`
- Customize components in `components/ui/` - they're yours to modify
- Keep the `lib/utils.ts` cn() helper for merging Tailwind classes
- Use TypeScript for full type safety

**Common Patterns:**
```typescript
// lib/utils.ts - Essential cn() utility
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// components.json - Configuration
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}

// Basic component usage
import { Button } from "@/components/ui/button"

export function Demo() {
  return (
    <Button variant="outline" size="lg">
      Click me
    </Button>
  )
}

// Customizing a component after adding it
// components/ui/button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

**Gotchas:**
- Components are copied, not installed - update manually or re-add
- Always use `cn()` utility to merge className props properly
- Don't forget to install peer dependencies when adding components
- CSS variables must be defined in globals.css for theming to work


### 2. Build accessible component variants

Shadcn/ui uses class-variance-authority (CVA) for creating type-safe component variants.

**Best Practices:**
- Use CVA for variant management - it provides type safety
- Always include ARIA attributes from Radix primitives
- Test keyboard navigation for all interactive components
- Add loading and disabled states to all actions
- Use semantic HTML elements where possible

**Common Patterns:**
```typescript
// Advanced button variants with CVA
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  // Base styles (always applied)
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Custom variants
        success: "bg-green-600 text-white hover:bg-green-700",
        warning: "bg-yellow-600 text-white hover:bg-yellow-700",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-14 rounded-md px-10 text-base",
        icon: "h-10 w-10",
      },
      // Compound variants for specific combinations
    },
    compoundVariants: [
      {
        variant: "outline",
        size: "sm",
        className: "border-2",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Loading button with accessible loading state
interface LoadingButtonProps extends ButtonProps {
  loading?: boolean
}

export function LoadingButton({
  loading,
  children,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={loading || disabled} {...props}>
      {loading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      <span className={loading ? "sr-only" : undefined}>
        {children}
      </span>
      {loading && <span aria-live="polite">Loading...</span>}
    </Button>
  )
}

// Icon button with accessible label
export function IconButton({
  icon: Icon,
  label,
  ...props
}: ButtonProps & { icon: React.ComponentType<any>; label: string }) {
  return (
    <Button size="icon" aria-label={label} {...props}>
      <Icon className="h-4 w-4" />
      <span className="sr-only">{label}</span>
    </Button>
  )
}
```

**Gotchas:**
- CVA types must be extracted with `VariantProps<typeof variants>`
- Compound variants override base variant styles
- Always include screen reader text for icon-only buttons
- Don't remove Radix's ARIA attributes when customizing


### 3. Extend with custom components

Build on shadcn/ui foundations to create domain-specific components.

**Best Practices:**
- Compose shadcn components rather than modifying them
- Create wrapper components for common patterns
- Use the same styling approach (Tailwind + CVA)
- Maintain accessibility standards
- Export from a central `components/` directory

**Common Patterns:**
```typescript
// components/marketing/feature-card.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  badge?: string
  className?: string
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  badge,
  className
}: FeatureCardProps) {
  return (
    <Card className={cn("hover:shadow-lg transition-shadow", className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          {badge && <Badge variant="secondary">{badge}</Badge>}
        </div>
        <CardTitle className="mt-4">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  )
}

// components/data/stats-card.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  loading?: boolean
  formatter?: (value: number) => string
}

export function StatsCard({
  title,
  value,
  change,
  loading,
  formatter = (v) => v.toString()
}: StatsCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32" />
        </CardContent>
      </Card>
    )
  }

  const isPositive = change && change > 0
  const isNegative = change && change < 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div className="text-3xl font-bold">{value}</div>
          {change !== undefined && (
            <div className={cn(
              "flex items-center text-sm font-medium",
              isPositive && "text-green-600",
              isNegative && "text-red-600"
            )}>
              {isPositive && <TrendingUp className="h-4 w-4 mr-1" />}
              {isNegative && <TrendingDown className="h-4 w-4 mr-1" />}
              {Math.abs(change)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// components/form/combobox-field.tsx
// Combining multiple shadcn components
import { useForm } from "react-hook-form"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxFieldProps {
  form: ReturnType<typeof useForm>
  name: string
  label: string
  description?: string
  options: Array<{ label: string; value: string }>
  placeholder?: string
}

export function ComboboxField({
  form,
  name,
  label,
  description,
  options,
  placeholder = "Select an option...",
}: ComboboxFieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{label}</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "justify-between",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  {field.value
                    ? options.find((option) => option.value === field.value)?.label
                    : placeholder}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search..." />
                <CommandEmpty>No option found.</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      value={option.label}
                      key={option.value}
                      onSelect={() => {
                        form.setValue(name, option.value)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          option.value === field.value
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
```

**Gotchas:**
- Don't break the component's accessibility when extending
- Keep the cn() utility for className merging
- Maintain consistent variant naming across custom components
- Document props with TypeScript interfaces


### 4. Theme customization with CSS variables

Shadcn/ui uses CSS variables for theming, making it easy to switch between themes.

**Best Practices:**
- Define all color variables in :root and [data-theme] selectors
- Use HSL color space for better color manipulation
- Keep semantic naming (primary, destructive, accent, etc.)
- Create theme presets for quick switching
- Use Tailwind's CSS variable support

**Common Patterns:**
```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

/* Custom theme: Ocean */
[data-theme="ocean"] {
  --background: 210 100% 98%;
  --foreground: 210 40% 10%;
  --primary: 200 98% 39%;
  --primary-foreground: 0 0% 100%;
  --secondary: 190 60% 50%;
  --secondary-foreground: 0 0% 100%;
  --accent: 180 100% 90%;
  --accent-foreground: 200 98% 39%;
  --destructive: 0 93% 44%;
  --destructive-foreground: 0 0% 100%;
  --muted: 210 40% 96%;
  --muted-foreground: 210 25% 40%;
  --border: 210 40% 90%;
  --input: 210 40% 90%;
  --ring: 200 98% 39%;
}

/* Custom theme: Forest */
[data-theme="forest"] {
  --background: 120 25% 97%;
  --foreground: 120 10% 15%;
  --primary: 142 76% 36%;
  --primary-foreground: 0 0% 100%;
  --secondary: 120 20% 50%;
  --secondary-foreground: 0 0% 100%;
  --accent: 120 40% 90%;
  --accent-foreground: 142 76% 36%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;
  --muted: 120 20% 95%;
  --muted-foreground: 120 10% 40%;
  --border: 120 20% 85%;
  --input: 120 20% 85%;
  --ring: 142 76% 36%;
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

```typescript
// lib/theme-config.ts
export const themes = {
  light: "light",
  dark: "dark",
  ocean: "ocean",
  forest: "forest",
} as const

export type Theme = keyof typeof themes

// components/theme-provider.tsx
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

// app/layout.tsx
import { ThemeProvider } from "@/components/theme-provider"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

// components/theme-switcher.tsx
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeSwitcher() {
  const { setTheme, theme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("ocean")}>
          Ocean
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("forest")}>
          Forest
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

**Gotchas:**
- CSS variables must use HSL format: `hue saturation% lightness%`
- Don't include `hsl()` wrapper in variable values
- Use `suppressHydrationWarning` on html tag to prevent Next.js warnings
- Theme switching requires client-side JavaScript


### 5. Combine with Radix primitives

Shadcn/ui is built on Radix UI primitives. Understanding Radix helps you customize deeply.

**Best Practices:**
- Read Radix docs for the primitive you're customizing
- Respect Radix's data attributes for styling
- Use Radix's composition pattern (asChild prop)
- Leverage Radix's accessibility features
- Don't fight against Radix's DOM structure

**Common Patterns:**
```typescript
// Custom tooltip with Radix primitive
import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }

// Advanced dialog with custom animations
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    hideClose?: boolean
  }
>(({ className, children, hideClose, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      {!hideClose && (
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

// Using asChild for composition
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function LinkButton() {
  return (
    <Button asChild>
      <Link href="/dashboard">Go to Dashboard</Link>
    </Button>
  )
}

// Custom select with search
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, Search } from "lucide-react"

export function SearchableSelect({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: string; label: string }>
  value: string
  onChange: (value: string) => void
}) {
  const [search, setSearch] = React.useState("")

  const filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <SelectPrimitive.Root value={value} onValueChange={onChange}>
      <SelectPrimitive.Trigger className="inline-flex items-center justify-between rounded px-4 py-2 text-sm border">
        <SelectPrimitive.Value />
        <SelectPrimitive.Icon>
          <ChevronDown className="h-4 w-4" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className="overflow-hidden rounded-md border bg-popover shadow-lg">
          <div className="flex items-center border-b px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-8 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <SelectPrimitive.Viewport className="p-1">
            {filtered.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className="relative flex cursor-default select-none items-center rounded-sm px-8 py-1.5 text-sm outline-none hover:bg-accent focus:bg-accent"
              >
                <span className="absolute left-2">
                  <SelectPrimitive.ItemIndicator>
                    <Check className="h-4 w-4" />
                  </SelectPrimitive.ItemIndicator>
                </span>
                <SelectPrimitive.ItemText>
                  {option.label}
                </SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
            {filtered.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No results found
              </div>
            )}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}
```

**Gotchas:**
- Radix uses data attributes for state - target these for styling
- Portal components render outside your component tree
- asChild replaces the component's default element with your child
- Some Radix components require a Provider wrapper


### 6. Dark mode implementation

Shadcn/ui supports dark mode out of the box with next-themes.

**Best Practices:**
- Use next-themes for theme management
- Add `suppressHydrationWarning` to html element
- Provide system theme option
- Test all components in both modes
- Use semantic color variables, not hardcoded colors

**Common Patterns:**
```typescript
// app/providers.tsx
"use client"

import { ThemeProvider } from "next-themes"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  )
}

// app/layout.tsx
import { Providers } from "./providers"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

// components/mode-toggle.tsx
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // useEffect only runs on the client
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Sun className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

// Advanced: Theme-aware images
export function ThemedImage({
  lightSrc,
  darkSrc,
  alt,
}: {
  lightSrc: string
  darkSrc: string
  alt: string
}) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return (
    <img
      src={resolvedTheme === "dark" ? darkSrc : lightSrc}
      alt={alt}
      className="w-full h-auto"
    />
  )
}

// Advanced: Per-component theme override
export function ComponentWithForceTheme({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="dark" className="dark">
      {children}
    </div>
  )
}
```

**Gotchas:**
- Always check mounted state to avoid hydration errors
- Don't use theme value during SSR
- CSS transitions can flash during theme switch - use `disableTransitionOnChange`
- Some components need explicit dark: variants if not using CSS variables


### 7. Form components with react-hook-form

Shadcn/ui form components integrate seamlessly with react-hook-form and Zod.

**Best Practices:**
- Use Zod for schema validation
- Leverage react-hook-form's Controller for complex inputs
- Show field-level errors immediately
- Disable submit during validation
- Use FormField for consistent error display

**Common Patterns:**
```typescript
// lib/validations/user.ts
import { z } from "zod"

export const userFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  age: z.coerce.number().min(18, "Must be 18 or older"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  newsletter: z.boolean().default(false),
})

export type UserFormValues = z.infer<typeof userFormSchema>

// components/user-form.tsx
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { userFormSchema, type UserFormValues } from "@/lib/validations/user"

export function UserForm() {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      email: "",
      age: 18,
      bio: "",
      newsletter: false,
    },
  })

  async function onSubmit(data: UserFormValues) {
    // Submit to API
    console.log(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="johndoe" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="age"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Age</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us about yourself"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {field.value?.length || 0}/500 characters
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newsletter"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Subscribe to newsletter
                </FormLabel>
                <FormDescription>
                  Receive updates about new features and content.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </Form>
  )
}

// Advanced: Multi-step form
export function MultiStepForm() {
  const [step, setStep] = React.useState(0)

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    mode: "onChange", // Validate on change
  })

  const steps = [
    { title: "Account", fields: ["username", "email"] as const },
    { title: "Profile", fields: ["age", "bio"] as const },
    { title: "Preferences", fields: ["newsletter"] as const },
  ]

  const currentFields = steps[step].fields

  async function onSubmit(data: UserFormValues) {
    console.log("Final submission:", data)
  }

  async function nextStep() {
    // Validate current step fields
    const isValid = await form.trigger(currentFields)
    if (isValid) setStep(step + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between mb-8">
        {steps.map((s, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 text-center pb-2 border-b-2",
              i <= step ? "border-primary" : "border-muted"
            )}
          >
            {s.title}
          </div>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Render fields for current step */}
          {step === 0 && (
            <>
              <FormField control={form.control} name="username" {...} />
              <FormField control={form.control} name="email" {...} />
            </>
          )}

          {step === 1 && (
            <>
              <FormField control={form.control} name="age" {...} />
              <FormField control={form.control} name="bio" {...} />
            </>
          )}

          {step === 2 && (
            <FormField control={form.control} name="newsletter" {...} />
          )}

          <div className="flex justify-between">
            {step > 0 && (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                Previous
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button type="button" onClick={nextStep} className="ml-auto">
                Next
              </Button>
            ) : (
              <Button type="submit" className="ml-auto">
                Submit
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
```

**Gotchas:**
- FormField's render prop must return FormItem structure
- Use z.coerce for number inputs to handle string conversion
- form.trigger() is async - await it for multi-step validation
- FormMessage automatically shows the first error for a field


## 💡 Real-World Examples

### Example 1: Complete Dashboard with Shadcn/UI
```typescript
// app/dashboard/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, TrendingUp, TrendingDown, DollarSign, Users } from "lucide-react"

export default function Dashboard() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your overview.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Report
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231.89</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-500">+20.1%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2,350</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-500">+180.1%</span> from last month
            </p>
          </CardContent>
        </Card>

        {/* More stats cards... */}
      </div>

      {/* Main Content Area */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  You had 265 activities this month.
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                {/* Chart or content here */}
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Frequently used operations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Add Team Member
                </Button>
                {/* More actions... */}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

### Example 2: Data Table with Sorting and Filtering
```typescript
"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type User = {
  id: string
  name: string
  email: string
  status: "active" | "inactive"
  role: string
}

const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <div className={cn(
          "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold",
          status === "active"
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-700"
        )}>
          {status}
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
              Copy user ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>Edit user</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export function UsersTable({ data }: { data: User[] }) {
  const [sorting, setSorting] = React.useState([])
  const [filtering, setFiltering] = React.useState("")

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setFiltering,
    state: {
      sorting,
      globalFilter: filtering,
    },
  })

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search users..."
        value={filtering}
        onChange={(e) => setFiltering(e.target.value)}
        className="max-w-sm"
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
```

## 🔗 Related Skills

- `tailwind-ui-designer` - Advanced Tailwind patterns
- `react-hook-form-zod` - Form validation patterns
- `design-system-architect` - Building component libraries
- `figma-to-code` - Translating designs to Shadcn components

## 📖 Further Reading

- [Shadcn/UI Documentation](https://ui.shadcn.com)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Class Variance Authority](https://cva.style/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Next Themes](https://github.com/pacocoursey/next-themes)
- [React Hook Form](https://react-hook-form.com/)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
