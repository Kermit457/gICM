# React Grab

> **ID:** `react-grab`
> **Tier:** 2
> **Token Cost:** 7000
> **MCP Connections:** context7

## 🎯 What This Skill Does

React Grab is the flagship GRAB skill that transforms visual designs into production-ready React components. It leverages advanced computer vision, DOM analysis, and pattern recognition to convert screenshots, live URLs, or design files into pixel-perfect React + TypeScript + Tailwind CSS code.

**Core Transformation:**
- Visual Design (Screenshot/URL/Figma) → React Component Code
- Automatic component hierarchy detection
- Style extraction and Tailwind class generation
- Responsive breakpoint inference
- Accessibility attribute generation
- TypeScript interface creation

**What Makes It Different:**
Unlike simple screenshot-to-code tools, React Grab understands component architecture, design patterns, and production best practices. It generates maintainable, scalable code that follows industry standards.

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** grab, screenshot, clone, copy, make this, build this, convert to react, recreate this design
- **File Types:** .png, .jpg, .jpeg, .webp (screenshots/mockups)
- **Directories:** N/A

**Ideal Use Cases:**
1. Converting design mockups to React components
2. Cloning competitor UI elements
3. Prototyping from wireframes
4. Migrating from other frameworks
5. Rapid MVP development
6. Learning component patterns from existing designs

## 🚀 Core Capabilities

### 1. Screenshot to React + Tailwind Code

The primary GRAB transformation converts visual input into structured React components with Tailwind CSS styling.

#### Visual Analysis Pipeline

**Step 1: Computer Vision Analysis**
```typescript
// Internal process (conceptual)
interface VisualAnalysis {
  layout: {
    type: 'flex' | 'grid' | 'absolute';
    direction: 'row' | 'column';
    alignment: string;
    spacing: number[];
  };
  elements: Array<{
    type: 'text' | 'image' | 'button' | 'input' | 'container';
    bounds: { x: number; y: number; w: number; h: number };
    styles: ComputedStyles;
    children: VisualElement[];
  }>;
  colors: {
    primary: string[];
    secondary: string[];
    text: string[];
    background: string[];
  };
  typography: {
    fontFamilies: string[];
    sizes: number[];
    weights: number[];
    lineHeights: number[];
  };
}
```

**Step 2: Component Hierarchy Detection**

React Grab analyzes visual hierarchy to determine optimal component structure:

```typescript
// Detection logic identifies:
// - Repeating patterns → map() iteration
// - Logical groupings → separate components
// - Interactive elements → event handlers
// - Dynamic content → props/state

interface ComponentStructure {
  name: string;
  type: 'container' | 'presentational' | 'interactive';
  props: PropDefinition[];
  state?: StateDefinition[];
  children: ComponentStructure[];
}
```

**Step 3: Code Generation**

```typescript
// Example: Hero section screenshot → React component

// INPUT: Screenshot of hero section with:
// - Background image
// - Large heading
// - Subheading
// - CTA button
// - Badge/pill element

// OUTPUT: Production-ready component

import React from 'react';
import Image from 'next/image';

interface HeroSectionProps {
  badge?: string;
  heading: string;
  subheading: string;
  ctaText: string;
  ctaHref: string;
  backgroundImage: string;
  onCtaClick?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  badge = 'New Release',
  heading,
  subheading,
  ctaText,
  ctaHref,
  backgroundImage,
  onCtaClick,
}) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={backgroundImage}
          alt="Hero background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        {badge && (
          <div className="inline-flex items-center rounded-full bg-white/10 backdrop-blur-sm px-4 py-1.5 mb-6 border border-white/20">
            <span className="text-sm font-medium text-white">{badge}</span>
          </div>
        )}

        {/* Heading */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
          {heading}
        </h1>

        {/* Subheading */}
        <p className="text-xl sm:text-2xl text-gray-200 mb-10 max-w-3xl mx-auto leading-relaxed">
          {subheading}
        </p>

        {/* CTA Button */}
        <a
          href={ctaHref}
          onClick={onCtaClick}
          className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-2xl hover:shadow-blue-500/50 hover:scale-105"
        >
          {ctaText}
          <svg
            className="ml-2 w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </a>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-900 to-transparent" />
    </section>
  );
};

// TypeScript usage
export default HeroSection;
```

**Best Practices:**

1. **Component Naming:** Use descriptive, PascalCase names that reflect purpose
2. **Props Interface:** Always define TypeScript interfaces for type safety
3. **Default Props:** Provide sensible defaults using destructuring
4. **Semantic HTML:** Use appropriate HTML5 semantic elements
5. **Accessibility:** Include ARIA labels, alt text, and keyboard navigation
6. **Image Optimization:** Use Next.js Image or lazy loading for performance
7. **CSS Utility Classes:** Group related Tailwind classes logically
8. **Responsive Design:** Mobile-first approach with sm:, md:, lg: breakpoints
9. **Performance:** Lazy load images, code-split components
10. **Documentation:** JSDoc comments for complex logic

**Common Patterns:**

```typescript
// Pattern 1: Container/Presenter Split
// For complex components, separate layout from content

// Container (logic)
export const ProductCardContainer: React.FC<{ productId: string }> = ({ productId }) => {
  const { data, loading } = useProduct(productId);

  if (loading) return <ProductCardSkeleton />;
  return <ProductCard {...data} />;
};

// Presenter (UI)
export const ProductCard: React.FC<ProductData> = ({ image, title, price }) => {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
      {/* Component JSX */}
    </div>
  );
};

// Pattern 2: Compound Components for Flexibility
const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
    {children}
  </div>
);

Card.Header = ({ children }: { children: React.ReactNode }) => (
  <div className="border-b border-gray-200 px-6 py-4">{children}</div>
);

Card.Body = ({ children }: { children: React.ReactNode }) => (
  <div className="px-6 py-4">{children}</div>
);

Card.Footer = ({ children }: { children: React.ReactNode }) => (
  <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">{children}</div>
);

// Usage
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Actions</Card.Footer>
</Card>

// Pattern 3: Render Props for Dynamic Content
interface TabsProps {
  tabs: Array<{ id: string; label: string; content: React.ReactNode }>;
  renderTab?: (tab: Tab, isActive: boolean) => React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, renderTab }) => {
  const [activeTab, setActiveTab] = React.useState(tabs[0].id);

  return (
    <div>
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 border-b-2 transition-colors',
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            {renderTab ? renderTab(tab, activeTab === tab.id) : tab.label}
          </button>
        ))}
      </div>
      <div className="py-4">
        {tabs.find((t) => t.id === activeTab)?.content}
      </div>
    </div>
  );
};
```

**Gotchas:**

1. **Absolute Positioning:** Avoid hardcoded px values; use relative units or flex/grid
2. **Z-Index Hell:** Use Tailwind's z-index scale (z-10, z-20) instead of arbitrary values
3. **Color Extraction:** Exact color matches may not exist in Tailwind palette—use closest or extend config
4. **Font Loading:** Custom fonts need @next/font or Google Fonts integration
5. **Hover States:** Don't forget hover:, focus:, active: states for interactive elements
6. **Overflow Hidden:** Can clip focus outlines—use focus-visible: instead
7. **Fixed Heights:** Avoid fixed heights; use min-h- or let content dictate size
8. **Breakpoint Logic:** Tailwind is mobile-first—sm: applies to small screens and up
9. **Image Aspect Ratios:** Use aspect-video, aspect-square, or custom ratios
10. **Server/Client Components:** Next.js 13+ requires 'use client' for useState/useEffect

### 2. Pixel-Perfect Reproduction

Achieving pixel-perfect accuracy requires precise measurement and style extraction.

#### Measurement Techniques

**Spacing Analysis:**
```typescript
// React Grab analyzes spacing patterns and converts to Tailwind scale
// 4px → space-1 (0.25rem)
// 8px → space-2 (0.5rem)
// 12px → space-3 (0.75rem)
// 16px → space-4 (1rem)
// 24px → space-6 (1.5rem)
// 32px → space-8 (2rem)
// etc.

// Example mapping
const spacingMap = {
  4: 'p-1',
  8: 'p-2',
  12: 'p-3',
  16: 'p-4',
  20: 'p-5',
  24: 'p-6',
  32: 'p-8',
  // Custom values use arbitrary syntax
  18: 'p-[18px]',
  22: 'p-[22px]',
};
```

**Typography Matching:**
```typescript
// Font size extraction with line-height and letter-spacing
interface TypographyStyle {
  fontSize: string;      // text-base, text-lg, text-xl
  lineHeight: string;    // leading-tight, leading-normal, leading-relaxed
  letterSpacing: string; // tracking-tight, tracking-normal, tracking-wide
  fontWeight: string;    // font-normal, font-medium, font-bold
  fontFamily: string;    // font-sans, font-serif, font-mono
}

// Example: 18px font, 1.6 line-height, -0.02em tracking, 600 weight
// → text-lg leading-relaxed tracking-tight font-semibold

// Complex example
const heading = "text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight";
const body = "text-base leading-relaxed text-gray-600 max-w-2xl";
```

**Color Precision:**
```typescript
// RGB to closest Tailwind color
function rgbToTailwind(r: number, g: number, b: number): string {
  const colors = {
    slate: [[248, 250, 252], [241, 245, 249], /* ... */],
    gray: [[249, 250, 251], [243, 244, 246], /* ... */],
    // ... all Tailwind colors
  };

  // Find closest match using color distance algorithm
  let closest = { color: 'gray', shade: 500, distance: Infinity };

  for (const [name, shades] of Object.entries(colors)) {
    shades.forEach((shade, idx) => {
      const distance = Math.sqrt(
        Math.pow(r - shade[0], 2) +
        Math.pow(g - shade[1], 2) +
        Math.pow(b - shade[2], 2)
      );
      if (distance < closest.distance) {
        closest = { color: name, shade: idx * 100, distance };
      }
    });
  }

  return `${closest.color}-${closest.shade}`;
}

// Custom colors extend tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          900: '#0c4a6e',
        },
      },
    },
  },
};
```

**Border and Shadow Extraction:**
```typescript
// Border styles
const borderClasses = [
  'border',           // 1px solid
  'border-2',         // 2px solid
  'border-4',         // 4px solid
  'border-gray-200',  // color
  'rounded',          // 4px radius
  'rounded-lg',       // 8px radius
  'rounded-full',     // fully rounded
];

// Shadow extraction
const shadowClasses = [
  'shadow-sm',    // subtle
  'shadow',       // default
  'shadow-md',    // medium
  'shadow-lg',    // large
  'shadow-xl',    // extra large
  'shadow-2xl',   // huge
  // Custom shadows
  'shadow-[0_4px_20px_rgba(0,0,0,0.1)]',
];

// Example component with precise styling
const PreciseCard = () => (
  <div className="
    p-6                      // 24px padding
    bg-white                 // white background
    border border-gray-200  // 1px gray border
    rounded-xl               // 12px radius
    shadow-lg                // large shadow
    hover:shadow-xl          // grow shadow on hover
    transition-shadow        // smooth transition
    duration-200             // 200ms timing
  ">
    {/* Content */}
  </div>
);
```

**Layout Precision:**
```typescript
// Grid layouts with exact spacing
const GridLayout = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {/* Responsive grid: 1 col mobile, 2 tablet, 3 desktop, 24px gap */}
  </div>
);

// Flexbox with precise alignment
const FlexLayout = () => (
  <div className="flex items-center justify-between gap-4 p-4">
    {/* Flex container: centered items, space-between, 16px gap, 16px padding */}
  </div>
);

// Absolute positioning (use sparingly)
const PositionedElement = () => (
  <div className="relative h-64">
    <div className="absolute top-4 right-4 z-10">
      {/* Badge in top-right corner */}
    </div>
  </div>
);
```

**Best Practices:**

1. **Use Tailwind's Scale:** Stick to Tailwind's spacing scale (4, 8, 12, 16, 20, 24, 28, 32, etc.)
2. **Arbitrary Values Sparingly:** Use `p-[18px]` only when necessary
3. **Consistent Units:** Don't mix px, rem, em—Tailwind handles it
4. **Visual Regression Testing:** Use tools like Percy or Chromatic to catch pixel shifts
5. **Design System Tokens:** Extract common values to tailwind.config.js
6. **Measure Twice, Code Once:** Use browser DevTools to measure accurately
7. **Compare Side-by-Side:** Open original and recreation in split view
8. **Zoom In:** Check alignment at 200% zoom
9. **Test Multiple Screens:** Verify on actual devices, not just responsive mode
10. **Use Grid Overlays:** Browser grid overlays help check alignment

**Common Patterns:**

```typescript
// Pattern 1: Card with precise spacing
const MetricsCard = ({ title, value, change }: MetricsCardProps) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={cn(
        "px-2.5 py-0.5 rounded-full text-xs font-medium",
        change >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      )}>
        {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
      </div>
    </div>
  </div>
);

// Pattern 2: Navbar with exact heights
const Navbar = () => (
  <nav className="h-16 border-b border-gray-200 bg-white">
    <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="h-full flex items-center justify-between">
        {/* Logo */}
        <div className="h-8 w-32">
          <Logo />
        </div>
        {/* Navigation */}
        <div className="flex items-center gap-8">
          {/* Nav items with exact spacing */}
        </div>
      </div>
    </div>
  </nav>
);

// Pattern 3: Button with pixel-perfect states
const Button = ({ children, variant = 'primary' }: ButtonProps) => {
  const variants = {
    primary: `
      px-4 py-2
      bg-blue-600 hover:bg-blue-700 active:bg-blue-800
      text-white font-medium text-sm
      rounded-lg
      shadow-sm hover:shadow-md
      transition-all duration-150
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    `,
    secondary: `
      px-4 py-2
      bg-white hover:bg-gray-50 active:bg-gray-100
      text-gray-700 font-medium text-sm
      border border-gray-300 hover:border-gray-400
      rounded-lg
      shadow-sm hover:shadow-md
      transition-all duration-150
      focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
    `,
  };

  return (
    <button className={cn(variants[variant])}>
      {children}
    </button>
  );
};
```

**Gotchas:**

1. **Browser Rendering Differences:** Chrome vs Safari vs Firefox may render slightly differently
2. **Subpixel Rendering:** Browsers use subpixel rendering; may cause 0.5px differences
3. **Font Rendering:** macOS vs Windows render fonts differently
4. **Zoom Levels:** Browser zoom can cause rounding errors
5. **Retina Displays:** High-DPI displays may show subtle differences
6. **Dynamic Content:** Text length affects layout; test with various content
7. **Viewport Units:** vh/vw can behave unexpectedly with mobile browsers
8. **Transform Origins:** CSS transforms need correct origin points
9. **Line Height Calculation:** Different fonts calculate line-height differently
10. **Box Model:** Remember box-border vs content-box behavior

### 3. Component Structure Inference

React Grab doesn't just convert visuals—it understands component architecture and generates maintainable, reusable code.

#### Hierarchy Detection

**Visual Pattern Recognition:**
```typescript
// React Grab identifies these patterns automatically:

// 1. Repetition → Array.map()
// Screenshot shows 3+ similar items → generate array-based rendering

// Before (static)
<div className="grid grid-cols-3 gap-4">
  <Card title="Item 1" />
  <Card title="Item 2" />
  <Card title="Item 3" />
</div>

// After (dynamic)
const items = [
  { id: 1, title: 'Item 1', description: '...' },
  { id: 2, title: 'Item 2', description: '...' },
  { id: 3, title: 'Item 3', description: '...' },
];

<div className="grid grid-cols-3 gap-4">
  {items.map((item) => (
    <Card key={item.id} {...item} />
  ))}
</div>

// 2. Nesting → Component Composition
// Complex layouts become nested components

<DashboardLayout>
  <Sidebar>
    <Logo />
    <Navigation items={navItems} />
  </Sidebar>
  <MainContent>
    <Header title="Dashboard" />
    <StatsGrid stats={stats} />
    <DataTable data={data} />
  </MainContent>
</DashboardLayout>

// 3. State Management → Interactive Components
// Form inputs, toggles, modals need state

const [isOpen, setIsOpen] = useState(false);
const [formData, setFormData] = useState(initialData);
const [selectedTab, setSelectedTab] = useState('overview');

// 4. Conditional Rendering → Logic
// Badges, tooltips, modals are conditionally shown

{isLoading && <Spinner />}
{error && <ErrorMessage message={error.message} />}
{data && <DataDisplay data={data} />}
```

**Component Extraction Strategy:**

```typescript
// Step 1: Identify reusable patterns
// If visual element appears 2+ times → extract to component

// Step 2: Determine component boundaries
// Group related elements into logical units

// Step 3: Define props interface
// What data does this component need?

// Step 4: Consider composition
// Can this be built from smaller components?

// Example: E-commerce product card
// Visual analysis identifies:
// - Image (reusable)
// - Badge (reusable)
// - Rating stars (reusable)
// - Price display (reusable)
// - Button (reusable)

// Generated structure:
interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    salePrice?: number;
    image: string;
    rating: number;
    reviews: number;
    badge?: string;
    inStock: boolean;
  };
  onAddToCart: (productId: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  return (
    <article className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Badge - conditional */}
      {product.badge && (
        <Badge variant="sale" className="absolute top-2 left-2 z-10">
          {product.badge}
        </Badge>
      )}

      {/* Image - extracted component */}
      <ProductImage
        src={product.image}
        alt={product.name}
        className="w-full h-64 object-cover"
      />

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>

        {/* Rating - extracted component */}
        <Rating value={product.rating} reviews={product.reviews} />

        {/* Price - extracted component */}
        <PriceDisplay
          price={product.price}
          salePrice={product.salePrice}
          className="mt-3"
        />

        {/* Action - extracted component */}
        <Button
          onClick={() => onAddToCart(product.id)}
          disabled={!product.inStock}
          className="w-full mt-4"
        >
          {product.inStock ? 'Add to Cart' : 'Out of Stock'}
        </Button>
      </div>
    </article>
  );
};

// Each sub-component is also generated:

const ProductImage: React.FC<ImageProps> = ({ src, alt, className }) => (
  <div className={cn("relative overflow-hidden", className)}>
    <Image
      src={src}
      alt={alt}
      width={400}
      height={400}
      className="group-hover:scale-105 transition-transform duration-300"
    />
  </div>
);

const Rating: React.FC<RatingProps> = ({ value, reviews }) => (
  <div className="flex items-center gap-2">
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "w-4 h-4",
            star <= value ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"
          )}
        />
      ))}
    </div>
    <span className="text-sm text-gray-600">({reviews})</span>
  </div>
);

const PriceDisplay: React.FC<PriceProps> = ({ price, salePrice, className }) => (
  <div className={cn("flex items-baseline gap-2", className)}>
    <span className={cn(
      "text-lg font-bold",
      salePrice ? "text-gray-400 line-through" : "text-gray-900"
    )}>
      ${price.toFixed(2)}
    </span>
    {salePrice && (
      <span className="text-xl font-bold text-red-600">
        ${salePrice.toFixed(2)}
      </span>
    )}
  </div>
);
```

**Best Practices:**

1. **Single Responsibility:** Each component should do one thing well
2. **Composition Over Inheritance:** Build complex UIs from simple components
3. **Props vs Children:** Use children for flexible content, props for data
4. **Controlled Components:** Forms should be controlled (value + onChange)
5. **Ref Forwarding:** Use forwardRef for components that need refs
6. **Memoization:** Use React.memo() for expensive render components
7. **Custom Hooks:** Extract stateful logic to custom hooks
8. **Context Sparingly:** Don't use Context for everything—props are fine
9. **Component Libraries:** Build a library of reusable components
10. **Documentation:** Document props with JSDoc comments

**Common Patterns:**

```typescript
// Pattern 1: Layout Components
const PageLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-gray-50">
    <Navbar />
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {children}
    </main>
    <Footer />
  </div>
);

// Pattern 2: Polymorphic Components
interface PolymorphicProps<T extends React.ElementType> {
  as?: T;
  children: React.ReactNode;
}

const Text = <T extends React.ElementType = 'span'>({
  as,
  children,
  ...props
}: PolymorphicProps<T> & React.ComponentPropsWithoutRef<T>) => {
  const Component = as || 'span';
  return <Component {...props}>{children}</Component>;
};

// Usage: <Text as="h1">Heading</Text> or <Text>Span</Text>

// Pattern 3: Render Props
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
}

const List = <T,>({ items, renderItem, renderEmpty }: ListProps<T>) => {
  if (items.length === 0) {
    return <>{renderEmpty?.() || <p>No items</p>}</>;
  }

  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{renderItem(item, index)}</li>
      ))}
    </ul>
  );
};

// Pattern 4: Compound Components with Context
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

const Tabs = ({ children, defaultTab }: TabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="space-y-4">{children}</div>
    </TabsContext.Provider>
  );
};

Tabs.List = ({ children }: { children: React.ReactNode }) => (
  <div className="flex border-b border-gray-200">{children}</div>
);

Tabs.Tab = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const context = React.useContext(TabsContext);
  const isActive = context?.activeTab === id;

  return (
    <button
      onClick={() => context?.setActiveTab(id)}
      className={cn(
        "px-4 py-2 border-b-2 transition-colors",
        isActive ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500"
      )}
    >
      {children}
    </button>
  );
};

Tabs.Panel = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const context = React.useContext(TabsContext);
  if (context?.activeTab !== id) return null;

  return <div className="py-4">{children}</div>;
};

// Usage:
<Tabs defaultTab="overview">
  <Tabs.List>
    <Tabs.Tab id="overview">Overview</Tabs.Tab>
    <Tabs.Tab id="details">Details</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel id="overview">Overview content</Tabs.Panel>
  <Tabs.Panel id="details">Details content</Tabs.Panel>
</Tabs>
```

**Gotchas:**

1. **Over-Extraction:** Don't create components for every div—balance reusability vs complexity
2. **Props Drilling:** Passing props through many layers is a code smell
3. **Circular Dependencies:** Components importing each other can cause issues
4. **Generic Naming:** Avoid names like Container, Wrapper—be specific
5. **Stateful Extraction:** Extract logic to custom hooks, not just JSX
6. **File Organization:** Group related components in folders with index.ts
7. **Export Strategy:** Use named exports for clarity, default for primary component
8. **Dependencies Array:** useEffect dependencies must be complete
9. **Closure Gotchas:** Stale closures in callbacks—use useCallback
10. **Re-render Optimization:** Understand when React re-renders components

### 4. Responsive Design Generation

React Grab automatically generates responsive designs using Tailwind's mobile-first breakpoint system.

#### Breakpoint Strategy

**Tailwind Breakpoints:**
```typescript
// Default Tailwind breakpoints (mobile-first)
const breakpoints = {
  sm: '640px',   // Small devices (landscape phones, 640px and up)
  md: '768px',   // Medium devices (tablets, 768px and up)
  lg: '1024px',  // Large devices (desktops, 1024px and up)
  xl: '1280px',  // Extra large devices (large desktops, 1280px and up)
  '2xl': '1536px', // 2X Extra large devices (larger desktops, 1536px and up)
};

// How React Grab applies them:
// 1. Analyze screenshot at different viewports (if available)
// 2. Infer responsive behavior from layout type
// 3. Generate mobile-first classes
// 4. Add breakpoint-specific overrides

// Example: 3-column grid on desktop, 1-column on mobile
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Mobile: 1 col, Tablet: 2 cols, Desktop: 3 cols */}
</div>
```

**Responsive Patterns:**

```typescript
// Pattern 1: Responsive Typography
const ResponsiveHeading = () => (
  <h1 className="
    text-3xl sm:text-4xl md:text-5xl lg:text-6xl
    font-bold
    leading-tight
  ">
    Heading scales with screen size
  </h1>
);

// Pattern 2: Responsive Spacing
const ResponsivePadding = () => (
  <div className="
    px-4 sm:px-6 md:px-8 lg:px-12
    py-8 sm:py-12 md:py-16 lg:py-20
  ">
    {/* Padding increases on larger screens */}
  </div>
);

// Pattern 3: Show/Hide Elements
const ResponsiveNavigation = () => (
  <>
    {/* Mobile menu button */}
    <button className="md:hidden">
      <MenuIcon />
    </button>

    {/* Desktop navigation */}
    <nav className="hidden md:flex gap-6">
      <NavLink href="/">Home</NavLink>
      <NavLink href="/about">About</NavLink>
      <NavLink href="/contact">Contact</NavLink>
    </nav>
  </>
);

// Pattern 4: Responsive Layout Switch
const ResponsiveLayout = () => (
  <div className="flex flex-col lg:flex-row gap-6">
    {/* Stacked on mobile, side-by-side on desktop */}
    <aside className="lg:w-1/4">Sidebar</aside>
    <main className="lg:w-3/4">Content</main>
  </div>
);

// Pattern 5: Responsive Images
const ResponsiveImage = () => (
  <div className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[500px]">
    <Image
      src="/hero.jpg"
      alt="Hero"
      fill
      className="object-cover"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  </div>
);

// Pattern 6: Responsive Grid
const ResponsiveGrid = () => (
  <div className="
    grid
    grid-cols-1
    sm:grid-cols-2
    md:grid-cols-3
    lg:grid-cols-4
    xl:grid-cols-5
    gap-4 md:gap-6 lg:gap-8
  ">
    {/* Responsive grid with adaptive gaps */}
  </div>
);

// Pattern 7: Container Queries (Tailwind 3.2+)
const ContainerQuery = () => (
  <div className="@container">
    <div className="@lg:flex @lg:gap-4">
      {/* Responds to container size, not viewport */}
    </div>
  </div>
);
```

**Complete Responsive Component Example:**

```typescript
interface FeatureSectionProps {
  features: Array<{
    id: string;
    icon: React.ReactNode;
    title: string;
    description: string;
  }>;
}

const FeatureSection: React.FC<FeatureSectionProps> = ({ features }) => {
  return (
    <section className="
      py-12 sm:py-16 md:py-20 lg:py-24
      px-4 sm:px-6 lg:px-8
      bg-white
    ">
      {/* Container */}
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="
            text-3xl sm:text-4xl md:text-5xl
            font-bold
            text-gray-900
            mb-4
          ">
            Our Features
          </h2>
          <p className="
            text-lg sm:text-xl
            text-gray-600
            max-w-2xl mx-auto
          ">
            Everything you need to build amazing products
          </p>
        </div>

        {/* Features Grid */}
        <div className="
          grid
          grid-cols-1
          sm:grid-cols-2
          lg:grid-cols-3
          gap-6 md:gap-8 lg:gap-10
        ">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="
                group
                p-6 md:p-8
                bg-gray-50
                rounded-lg md:rounded-xl
                hover:bg-white
                hover:shadow-lg
                transition-all duration-200
              "
            >
              {/* Icon */}
              <div className="
                w-12 h-12 md:w-14 md:h-14
                flex items-center justify-center
                bg-blue-100
                rounded-lg
                text-blue-600
                mb-4 md:mb-6
                group-hover:bg-blue-600
                group-hover:text-white
                transition-colors
              ">
                {feature.icon}
              </div>

              {/* Content */}
              <h3 className="
                text-xl md:text-2xl
                font-semibold
                text-gray-900
                mb-2 md:mb-3
              ">
                {feature.title}
              </h3>
              <p className="
                text-base md:text-lg
                text-gray-600
                leading-relaxed
              ">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
```

**Best Practices:**

1. **Mobile-First:** Start with mobile styles, add larger screen modifications
2. **Content Priority:** Most important content should be visible on mobile
3. **Touch Targets:** Minimum 44x44px touch targets on mobile
4. **Readable Text:** Minimum 16px font size on mobile
5. **Flexible Images:** Use responsive images with srcset or Next.js Image
6. **Test Real Devices:** Emulators don't catch everything
7. **Performance:** Mobile users may have slower connections
8. **Gestures:** Support swipe gestures on mobile
9. **Viewport Meta:** Include `<meta name="viewport" content="width=device-width, initial-scale=1">`
10. **Accessibility:** Responsive design should maintain accessibility

**Common Patterns:**

```typescript
// Pattern 1: Responsive Hero Section
const ResponsiveHero = () => (
  <section className="relative min-h-[60vh] sm:min-h-[70vh] md:min-h-[80vh] lg:min-h-screen">
    <div className="absolute inset-0">
      <Image src="/hero.jpg" alt="Hero" fill className="object-cover" />
    </div>
    <div className="relative z-10 flex items-center justify-center min-h-[inherit] px-4">
      <div className="text-center max-w-4xl">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6">
          Welcome
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-6 sm:mb-8">
          Your journey starts here
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg">Get Started</Button>
          <Button size="lg" variant="secondary">Learn More</Button>
        </div>
      </div>
    </div>
  </section>
);

// Pattern 2: Responsive Navigation
const ResponsiveNav = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/features">Features</NavLink>
            <NavLink href="/pricing">Pricing</NavLink>
            <Button>Sign In</Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-3">
            <MobileNavLink href="/">Home</MobileNavLink>
            <MobileNavLink href="/features">Features</MobileNavLink>
            <MobileNavLink href="/pricing">Pricing</MobileNavLink>
            <Button className="w-full">Sign In</Button>
          </div>
        </div>
      )}
    </nav>
  );
};

// Pattern 3: Responsive Dashboard
const ResponsiveDashboard = () => (
  <div className="flex flex-col lg:flex-row h-screen">
    {/* Sidebar - bottom nav on mobile, side nav on desktop */}
    <aside className="
      order-last lg:order-first
      lg:w-64
      border-t lg:border-t-0 lg:border-r
      border-gray-200
      bg-white
    ">
      <nav className="
        flex lg:flex-col
        overflow-x-auto lg:overflow-x-visible
        lg:p-4
      ">
        {/* Navigation items */}
      </nav>
    </aside>

    {/* Main Content */}
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      {/* Dashboard content */}
    </main>
  </div>
);
```

**Gotchas:**

1. **Viewport Height on Mobile:** `vh` units don't account for browser chrome—use `dvh` or min-h-screen
2. **Horizontal Overflow:** Easy to accidentally cause horizontal scroll on mobile
3. **Fixed Positioning:** Behaves differently on mobile browsers
4. **Hover States on Touch:** Hover states persist after tap—use `@media (hover: hover)`
5. **Font Scaling:** Users may have increased font size—test with 200% zoom
6. **Landscape Mode:** Don't forget to test landscape orientation on mobile
7. **Tablet Breakpoints:** Tablets can be in either "mobile" or "desktop" mode
8. **Safe Areas:** Account for notches/home indicators with `safe-area-inset`
9. **Orientation Changes:** Handle orientation change events gracefully
10. **Performance:** Too many breakpoint classes can increase CSS bundle size

## 💡 Real-World Examples

### Example 1: E-Commerce Product Listing

**Input:** Screenshot of product grid from popular e-commerce site

**Generated Code:**
```typescript
import React from 'react';
import Image from 'next/image';
import { Star, Heart, ShoppingCart } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  salePrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  badge?: 'New' | 'Sale' | 'Best Seller';
  inStock: boolean;
}

interface ProductGridProps {
  products: Product[];
  onAddToCart: (productId: string) => void;
  onToggleFavorite: (productId: string) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onAddToCart,
  onToggleFavorite,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
};

const ProductCard: React.FC<{
  product: Product;
  onAddToCart: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}> = ({ product, onAddToCart, onToggleFavorite }) => {
  const discountPercent = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  return (
    <article className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
      {/* Badge */}
      {product.badge && (
        <div className={cn(
          "absolute top-3 left-3 z-10 px-3 py-1 rounded-full text-xs font-semibold",
          product.badge === 'Sale' && "bg-red-500 text-white",
          product.badge === 'New' && "bg-blue-500 text-white",
          product.badge === 'Best Seller' && "bg-yellow-500 text-gray-900"
        )}>
          {product.badge}
        </div>
      )}

      {/* Favorite Button */}
      <button
        onClick={() => onToggleFavorite(product.id)}
        className="absolute top-3 right-3 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
        aria-label="Add to favorites"
      >
        <Heart className="w-5 h-5 text-gray-600 hover:text-red-500 transition-colors" />
      </button>

      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
        />

        {/* Quick Add Button - shows on hover */}
        <button
          onClick={() => onAddToCart(product.id)}
          disabled={!product.inStock}
          className="absolute inset-x-4 bottom-4 flex items-center justify-center gap-2 py-3 bg-white text-gray-900 font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="w-5 h-5" />
          {product.inStock ? 'Quick Add' : 'Out of Stock'}
        </button>
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Brand */}
        <p className="text-sm text-gray-600 mb-1">{product.brand}</p>

        {/* Product Name */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "w-4 h-4",
                  star <= Math.round(product.rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-gray-200 text-gray-200"
                )}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">({product.reviewCount})</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          {product.salePrice ? (
            <>
              <span className="text-xl font-bold text-red-600">
                ${product.salePrice.toFixed(2)}
              </span>
              <span className="text-sm text-gray-500 line-through">
                ${product.price.toFixed(2)}
              </span>
              <span className="text-sm font-semibold text-red-600">
                {discountPercent}% off
              </span>
            </>
          ) : (
            <span className="text-xl font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
};
```

### Example 2: SaaS Dashboard

**Input:** Screenshot of modern SaaS dashboard

**Generated Code:**
```typescript
import React, { useState } from 'react';
import {
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  Filter,
  Download,
} from 'lucide-react';

interface DashboardStats {
  revenue: { value: number; change: number };
  users: { value: number; change: number };
  conversion: { value: number; change: number };
  avgOrder: { value: number; change: number };
}

interface DashboardProps {
  stats: DashboardStats;
  chartData: any[];
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, chartData }) => {
  const [dateRange, setDateRange] = useState('7d');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Welcome back! Here's what's happening today.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>

              <button className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filter</span>
              </button>

              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<DollarSign className="w-6 h-6" />}
            label="Total Revenue"
            value={`$${stats.revenue.value.toLocaleString()}`}
            change={stats.revenue.change}
            iconBg="bg-green-100"
            iconColor="text-green-600"
          />
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="Total Users"
            value={stats.users.value.toLocaleString()}
            change={stats.users.change}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="Conversion Rate"
            value={`${stats.conversion.value}%`}
            change={stats.conversion.change}
            iconBg="bg-purple-100"
            iconColor="text-purple-600"
          />
          <StatCard
            icon={<BarChart3 className="w-6 h-6" />}
            label="Avg. Order Value"
            value={`$${stats.avgOrder.value}`}
            change={stats.avgOrder.change}
            iconBg="bg-orange-100"
            iconColor="text-orange-600"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ChartCard title="Revenue Overview" data={chartData} />
          <ChartCard title="User Growth" data={chartData} />
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          {/* Activity list would go here */}
        </div>
      </main>
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: number;
  iconBg: string;
  iconColor: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  change,
  iconBg,
  iconColor,
}) => {
  const isPositive = change >= 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-3 rounded-lg", iconBg)}>
          <div className={iconColor}>{icon}</div>
        </div>
        <div
          className={cn(
            "px-2.5 py-1 rounded-full text-xs font-medium",
            isPositive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          )}
        >
          {isPositive ? '↑' : '↓'} {Math.abs(change)}%
        </div>
      </div>

      <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
};

const ChartCard: React.FC<{ title: string; data: any[] }> = ({ title, data }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
    <div className="h-64 flex items-center justify-center text-gray-400">
      {/* Chart component would go here */}
      Chart Visualization
    </div>
  </div>
);
```

## 🔗 Related Skills

- **theme-grab** - Extract design tokens for consistent styling
- **form-grab** - Specialized form component generation
- **dashboard-grab** - Complex dashboard layouts
- **landing-grab** - Marketing page generation
- **animation-grab** - Add animations to components
- **figma-grab** - Direct Figma to React conversion
- **wireframe-grab** - Low-fidelity to high-fidelity conversion

## 📖 Further Reading

### Official Documentation
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

### Design Systems
- [Tailwind UI Components](https://tailwindui.com)
- [Shadcn UI](https://ui.shadcn.com)
- [Headless UI](https://headlessui.com)
- [Radix UI](https://www.radix-ui.com)

### Tools & Libraries
- [Lucide Icons](https://lucide.dev) - Icon library
- [clsx](https://github.com/lukeed/clsx) - Conditional classes
- [tailwind-merge](https://github.com/dcastil/tailwind-merge) - Merge Tailwind classes
- [React Hook Form](https://react-hook-form.com) - Form handling
- [Zod](https://zod.dev) - Schema validation

### Learning Resources
- [Patterns.dev](https://www.patterns.dev) - React patterns
- [React TypeScript Cheatsheets](https://react-typescript-cheatsheet.netlify.app)
- [Tailwind CSS Best Practices](https://tailwindcss.com/docs/reusing-styles)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
*Last updated: 2025-12-04*
