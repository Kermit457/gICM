# Card Grab

> **ID:** `card-grab`
> **Tier:** 3
> **Token Cost:** 5000
> **MCP Connections:** context7

## What This Skill Does

Card Grab is a specialized GRAB skill that transforms card component screenshots into production-ready React components. It analyzes visual patterns, image handling, content structure, hover effects, and responsive grid layouts to generate pixel-perfect card components with proper accessibility and interaction states.

**Core Transformation:**
- Visual Design (Screenshot/URL/Figma) to Card Component Code
- Automatic card type detection (product, blog, profile, pricing, feature)
- Image optimization and lazy loading integration
- Hover effect extraction and animation
- Responsive grid layout generation
- TypeScript interface generation

**What Makes It Different:**
Card Grab understands the semantics of card content - distinguishing between product cards, blog cards, profile cards, and feature cards. It generates components with proper data typing, accessibility attributes, and performance optimizations.

## When to Use

This skill is automatically loaded when:

- **Keywords:** card, grab card, tile, grid item, product card, blog card, feature card
- **File Types:** .png, .jpg, .jpeg, .webp (screenshots/mockups)
- **Directories:** N/A

**Ideal Use Cases:**
1. Converting product catalog designs to React
2. Building blog post card grids
3. Creating team member profile cards
4. Designing feature showcase cards
5. Pricing tier cards
6. Dashboard stat cards

## Core Capabilities

### 1. Card Component Extraction

The primary transformation converts visual card designs into structured React components.

#### Visual Analysis Pipeline

**Step 1: Card Type Detection**
```typescript
// Card Grab identifies card types automatically
interface CardAnalysis {
  type: 'product' | 'blog' | 'profile' | 'feature' | 'pricing' | 'stat' | 'generic';
  layout: {
    orientation: 'vertical' | 'horizontal';
    imagePosition: 'top' | 'left' | 'right' | 'background' | 'none';
    aspectRatio: string;
  };
  elements: {
    image: ImageElement | null;
    badge: BadgeElement | null;
    title: TextElement;
    subtitle: TextElement | null;
    description: TextElement | null;
    metadata: MetadataElement[];
    actions: ActionElement[];
    price: PriceElement | null;
    rating: RatingElement | null;
  };
  interactions: {
    hover: HoverEffect[];
    click: 'navigate' | 'expand' | 'select' | 'none';
  };
}
```

**Step 2: Component Generation**

```typescript
// Example: Product Card
// INPUT: Screenshot analysis
// OUTPUT: Production-ready component

import React from 'react';
import Image from 'next/image';
import { Heart, Star, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    brand: string;
    price: number;
    salePrice?: number;
    image: string;
    rating: number;
    reviewCount: number;
    badge?: 'new' | 'sale' | 'bestseller';
    inStock: boolean;
  };
  onAddToCart?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  isFavorite?: boolean;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onToggleFavorite,
  isFavorite = false,
  className,
}) => {
  const discountPercent = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  const badgeColors = {
    new: 'bg-blue-500 text-white',
    sale: 'bg-red-500 text-white',
    bestseller: 'bg-yellow-500 text-gray-900',
  };

  return (
    <article
      className={cn(
        'group relative bg-white rounded-xl border border-gray-200 overflow-hidden',
        'hover:shadow-xl hover:border-gray-300 transition-all duration-300',
        className
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {/* Badge */}
        {product.badge && (
          <div
            className={cn(
              'absolute top-3 left-3 z-10 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide',
              badgeColors[product.badge]
            )}
          >
            {product.badge}
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleFavorite?.(product.id);
          }}
          className={cn(
            'absolute top-3 right-3 z-10 p-2 rounded-full transition-all',
            'bg-white/90 backdrop-blur-sm hover:bg-white',
            'opacity-0 group-hover:opacity-100',
            isFavorite && 'opacity-100'
          )}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={cn(
              'w-5 h-5 transition-colors',
              isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600 hover:text-red-500'
            )}
          />
        </button>

        {/* Product Image */}
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Quick Add Button */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={(e) => {
              e.preventDefault();
              onAddToCart?.(product.id);
            }}
            disabled={!product.inStock}
            className={cn(
              'w-full py-3 px-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2',
              'transition-colors',
              product.inStock
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            )}
          >
            <ShoppingCart className="w-4 h-4" />
            {product.inStock ? 'Quick Add' : 'Out of Stock'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Brand */}
        <p className="text-sm text-gray-500 mb-1">{product.brand}</p>

        {/* Product Name */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem] group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  'w-4 h-4',
                  star <= Math.round(product.rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-200 text-gray-200'
                )}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">({product.reviewCount})</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          {product.salePrice ? (
            <>
              <span className="text-xl font-bold text-red-600">
                ${product.salePrice.toFixed(2)}
              </span>
              <span className="text-sm text-gray-400 line-through">
                ${product.price.toFixed(2)}
              </span>
              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                -{discountPercent}%
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

export default ProductCard;
```

**Best Practices:**

1. **Semantic HTML:** Use article, figure, figcaption for cards
2. **Image Optimization:** Always use Next.js Image with sizes prop
3. **Accessible Interactions:** ARIA labels on all interactive elements
4. **Hover States:** Implement on container and individual elements
5. **Loading States:** Use skeleton loaders for async content
6. **Click Areas:** Make entire card clickable where appropriate
7. **Text Truncation:** Use line-clamp for consistent heights
8. **Responsive Images:** Provide appropriate srcset
9. **Focus States:** Visible focus ring for keyboard navigation
10. **Performance:** Lazy load images below the fold

**Common Patterns:**

```typescript
// Pattern 1: Blog Post Card
interface BlogCardProps {
  post: {
    id: string;
    title: string;
    excerpt: string;
    coverImage: string;
    author: {
      name: string;
      avatar: string;
    };
    publishedAt: string;
    readTime: number;
    category: string;
  };
}

const BlogCard: React.FC<BlogCardProps> = ({ post }) => (
  <article className="group bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
    {/* Cover Image */}
    <div className="relative aspect-video overflow-hidden">
      <Image
        src={post.coverImage}
        alt={post.title}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div className="absolute top-4 left-4">
        <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
          {post.category}
        </span>
      </div>
    </div>

    {/* Content */}
    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
        {post.title}
      </h3>
      <p className="text-gray-600 mb-4 line-clamp-3">
        {post.excerpt}
      </p>

      {/* Meta */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src={post.author.avatar}
            alt={post.author.name}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <p className="font-medium text-gray-900 text-sm">{post.author.name}</p>
            <p className="text-gray-500 text-xs">{post.publishedAt}</p>
          </div>
        </div>
        <span className="text-sm text-gray-500">{post.readTime} min read</span>
      </div>
    </div>
  </article>
);

// Pattern 2: Profile Card
interface ProfileCardProps {
  person: {
    id: string;
    name: string;
    role: string;
    avatar: string;
    bio: string;
    social: {
      twitter?: string;
      linkedin?: string;
      github?: string;
    };
  };
}

const ProfileCard: React.FC<ProfileCardProps> = ({ person }) => (
  <article className="bg-white rounded-xl p-6 text-center border border-gray-200 hover:shadow-lg transition-shadow">
    {/* Avatar */}
    <div className="relative w-24 h-24 mx-auto mb-4">
      <Image
        src={person.avatar}
        alt={person.name}
        fill
        className="rounded-full object-cover"
      />
    </div>

    {/* Info */}
    <h3 className="text-xl font-bold text-gray-900 mb-1">{person.name}</h3>
    <p className="text-blue-600 font-medium mb-3">{person.role}</p>
    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{person.bio}</p>

    {/* Social Links */}
    <div className="flex justify-center gap-4">
      {person.social.twitter && (
        <a href={person.social.twitter} className="text-gray-400 hover:text-blue-400 transition-colors">
          <Twitter className="w-5 h-5" />
        </a>
      )}
      {person.social.linkedin && (
        <a href={person.social.linkedin} className="text-gray-400 hover:text-blue-600 transition-colors">
          <Linkedin className="w-5 h-5" />
        </a>
      )}
      {person.social.github && (
        <a href={person.social.github} className="text-gray-400 hover:text-gray-900 transition-colors">
          <Github className="w-5 h-5" />
        </a>
      )}
    </div>
  </article>
);

// Pattern 3: Feature Card
interface FeatureCardProps {
  feature: {
    icon: React.ReactNode;
    title: string;
    description: string;
    link?: string;
  };
}

const FeatureCard: React.FC<FeatureCardProps> = ({ feature }) => (
  <article className="group p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
    {/* Icon */}
    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
      {feature.icon}
    </div>

    {/* Content */}
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
    <p className="text-gray-600 text-sm mb-4">{feature.description}</p>

    {/* Link */}
    {feature.link && (
      <a
        href={feature.link}
        className="inline-flex items-center text-blue-600 font-medium text-sm hover:text-blue-700 group/link"
      >
        Learn more
        <ArrowRight className="w-4 h-4 ml-1 group-hover/link:translate-x-1 transition-transform" />
      </a>
    )}
  </article>
);

// Pattern 4: Stat Card
interface StatCardProps {
  stat: {
    label: string;
    value: string | number;
    change?: number;
    icon?: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
  };
}

const StatCard: React.FC<StatCardProps> = ({ stat }) => (
  <article className="bg-white rounded-xl p-6 border border-gray-200">
    <div className="flex items-start justify-between mb-4">
      {stat.icon && (
        <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
          {stat.icon}
        </div>
      )}
      {stat.change !== undefined && (
        <span
          className={cn(
            'px-2.5 py-1 rounded-full text-xs font-semibold',
            stat.trend === 'up' && 'bg-green-100 text-green-700',
            stat.trend === 'down' && 'bg-red-100 text-red-700',
            stat.trend === 'neutral' && 'bg-gray-100 text-gray-700'
          )}
        >
          {stat.trend === 'up' && '+'}
          {stat.change}%
        </span>
      )}
    </div>

    <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
  </article>
);
```

**Gotchas:**

1. **Image Aspect Ratios:** Use aspect-ratio or padding-bottom trick for consistent sizing
2. **Text Overflow:** Always account for long content with truncation
3. **Click Propagation:** Stop propagation on nested interactive elements
4. **Focus Management:** Ensure keyboard navigation works properly
5. **Card Heights:** Use min-height or flex to equalize heights in grids
6. **Link Wrapping:** Wrap entire card in link or use CSS to expand click area
7. **Hover Performance:** Avoid animating layout properties (width, height)
8. **Image Loading:** Use placeholder blur for better perceived performance
9. **RTL Support:** Test cards in right-to-left layouts
10. **Print Styles:** Cards may need different print styling

### 2. Image Handling

Card Grab generates optimized image handling for card components.

#### Image Analysis

```typescript
interface CardImageConfig {
  aspectRatio: '1:1' | '4:3' | '16:9' | '3:4' | 'auto';
  fit: 'cover' | 'contain' | 'fill';
  position: 'center' | 'top' | 'bottom';
  loading: 'eager' | 'lazy';
  placeholder: 'blur' | 'empty' | 'skeleton';
  overlay: OverlayConfig | null;
  zoom: boolean;
}
```

**Image Generation Patterns:**

```typescript
// Pattern 1: Product Image with Gallery Preview
const ProductImageGallery: React.FC<{
  images: string[];
  productName: string;
}> = ({ images, productName }) => {
  const [activeIndex, setActiveIndex] = React.useState(0);

  return (
    <div className="relative">
      {/* Main Image */}
      <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
        <Image
          src={images[activeIndex]}
          alt={`${productName} - Image ${activeIndex + 1}`}
          fill
          className="object-cover"
          priority={activeIndex === 0}
        />
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-2">
          {images.slice(0, 4).map((image, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                'relative w-16 h-16 rounded-md overflow-hidden border-2 transition-colors',
                activeIndex === index ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
              )}
            >
              <Image
                src={image}
                alt={`${productName} thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Pattern 2: Image with Hover Zoom
const ZoomableImage: React.FC<{
  src: string;
  alt: string;
}> = ({ src, alt }) => {
  const [isZoomed, setIsZoomed] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPosition({ x, y });
  };

  return (
    <div
      className="relative aspect-square overflow-hidden bg-gray-100 cursor-zoom-in"
      onMouseEnter={() => setIsZoomed(true)}
      onMouseLeave={() => setIsZoomed(false)}
      onMouseMove={handleMouseMove}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className={cn(
          'object-cover transition-transform duration-200',
          isZoomed && 'scale-150'
        )}
        style={isZoomed ? {
          transformOrigin: `${position.x}% ${position.y}%`
        } : undefined}
      />
    </div>
  );
};

// Pattern 3: Image with Overlay Content
const OverlayImage: React.FC<{
  src: string;
  alt: string;
  title: string;
  subtitle: string;
}> = ({ src, alt, title, subtitle }) => (
  <div className="relative aspect-video overflow-hidden rounded-lg group">
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover group-hover:scale-110 transition-transform duration-500"
    />

    {/* Gradient Overlay */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

    {/* Content */}
    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
      <h3 className="text-xl font-bold mb-1">{title}</h3>
      <p className="text-white/80">{subtitle}</p>
    </div>
  </div>
);

// Pattern 4: Skeleton Loading
const ImageSkeleton: React.FC<{
  aspectRatio?: string;
}> = ({ aspectRatio = 'aspect-square' }) => (
  <div className={cn('bg-gray-200 animate-pulse rounded-lg', aspectRatio)} />
);

// Pattern 5: Image with Fallback
const ImageWithFallback: React.FC<{
  src: string;
  fallbackSrc: string;
  alt: string;
}> = ({ src, fallbackSrc, alt }) => {
  const [imageSrc, setImageSrc] = React.useState(src);

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill
      className="object-cover"
      onError={() => setImageSrc(fallbackSrc)}
    />
  );
};
```

**Best Practices:**

1. **Aspect Ratio Consistency:** Use CSS aspect-ratio for consistent sizing
2. **Blur Placeholder:** Use blurDataURL for instant loading feedback
3. **Responsive Sizes:** Always provide sizes prop for responsive images
4. **Lazy Loading:** Load images below fold lazily
5. **Priority Loading:** Mark above-fold images as priority
6. **Alt Text:** Provide descriptive alt text for accessibility
7. **Fallback Images:** Handle broken images gracefully
8. **Image Formats:** Use WebP/AVIF with fallbacks
9. **CDN Optimization:** Use image CDN for dynamic resizing
10. **Preloading:** Preload critical images in head

**Gotchas:**

1. **CLS Issues:** Always reserve space for images
2. **Oversized Images:** Avoid loading images larger than displayed
3. **Safari Object-fit:** May need vendor prefixes
4. **Next.js Fill:** Parent needs position: relative
5. **CORS Issues:** External images may need configuration
6. **Cache Headers:** Ensure proper cache headers for images
7. **Retina Images:** Serve 2x images for high-DPI displays
8. **Animation Performance:** Animate transform, not width/height
9. **Memory Usage:** Many large images can cause memory issues
10. **SEO:** Provide meaningful image file names

### 3. Hover Effects

Card Grab extracts and generates sophisticated hover interactions.

#### Hover Effect Analysis

```typescript
interface HoverEffectConfig {
  container: {
    shadow: boolean;
    scale: number;
    border: string;
    background: string;
  };
  image: {
    scale: number;
    filter: string;
    translate: string;
  };
  content: {
    reveal: string[];
    translate: string;
    opacity: number;
  };
  duration: number;
  easing: string;
}
```

**Hover Effect Patterns:**

```typescript
// Pattern 1: Lift and Shadow
const LiftCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="
    bg-white rounded-xl p-6 border border-gray-200
    transform transition-all duration-300
    hover:-translate-y-2 hover:shadow-xl hover:border-gray-300
  ">
    {children}
  </div>
);

// Pattern 2: Border Color Transition
const BorderCard: React.FC<{ children: React.ReactNode; color?: string }> = ({
  children,
  color = 'blue'
}) => (
  <div className={cn(
    'bg-white rounded-xl p-6 border-2 transition-colors duration-300',
    `border-gray-200 hover:border-${color}-500`
  )}>
    {children}
  </div>
);

// Pattern 3: Background Gradient Reveal
const GradientRevealCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="
    relative overflow-hidden rounded-xl p-6 bg-white border border-gray-200
    before:absolute before:inset-0
    before:bg-gradient-to-r before:from-blue-500 before:to-purple-500
    before:translate-y-full before:transition-transform before:duration-300
    hover:before:translate-y-0
    group
  ">
    <div className="relative z-10 group-hover:text-white transition-colors">
      {children}
    </div>
  </div>
);

// Pattern 4: Image Zoom with Overlay
const ZoomOverlayCard: React.FC<{
  image: string;
  children: React.ReactNode;
}> = ({ image, children }) => (
  <div className="group relative rounded-xl overflow-hidden">
    {/* Image with Zoom */}
    <div className="aspect-video overflow-hidden">
      <Image
        src={image}
        alt=""
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-110"
      />
    </div>

    {/* Overlay that appears on hover */}
    <div className="
      absolute inset-0 bg-black/60
      opacity-0 group-hover:opacity-100
      transition-opacity duration-300
      flex items-center justify-center
    ">
      <div className="text-white text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
        {children}
      </div>
    </div>
  </div>
);

// Pattern 5: Icon Rotation
const IconRotateCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <div className="group p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-500 transition-colors">
    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:rotate-12 transition-transform">
      {icon}
    </div>
    <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 text-sm">{description}</p>
  </div>
);

// Pattern 6: Reveal Hidden Content
const RevealCard: React.FC<{
  image: string;
  title: string;
  actions: React.ReactNode;
}> = ({ image, title, actions }) => (
  <div className="group relative rounded-xl overflow-hidden bg-white border border-gray-200">
    <div className="aspect-square overflow-hidden">
      <Image src={image} alt={title} fill className="object-cover" />
    </div>

    {/* Hidden action bar */}
    <div className="
      absolute bottom-0 left-0 right-0 p-4
      bg-white border-t border-gray-200
      transform translate-y-full group-hover:translate-y-0
      transition-transform duration-300
    ">
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="flex gap-2">{actions}</div>
    </div>
  </div>
);

// Pattern 7: Tilt Effect (with react-tilt or custom)
const TiltCard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const cardRef = React.useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;

    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="bg-white rounded-xl p-6 border border-gray-200 transition-transform duration-200"
      style={{ transformStyle: 'preserve-3d' }}
    >
      {children}
    </div>
  );
};

// Pattern 8: Shine Effect
const ShineCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="
    group relative overflow-hidden bg-white rounded-xl p-6 border border-gray-200
    before:absolute before:inset-0
    before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent
    before:-translate-x-full before:skew-x-12
    hover:before:translate-x-full before:transition-transform before:duration-700
  ">
    {children}
  </div>
);
```

**Best Practices:**

1. **Performance:** Only animate transform and opacity
2. **Subtlety:** Keep hover effects subtle and purposeful
3. **Duration:** 200-300ms feels responsive
4. **Easing:** Use ease-out for entering, ease-in for leaving
5. **Touch Devices:** Consider touch device experience
6. **Accessibility:** Don't hide critical info behind hover
7. **Consistency:** Use consistent hover effects across cards
8. **State Feedback:** Show clear state changes
9. **Reduced Motion:** Respect prefers-reduced-motion
10. **Group Selector:** Use group for complex hover states

**Gotchas:**

1. **Hover on Touch:** Sticky hover states on mobile
2. **Z-Index:** Hover effects may need z-index adjustment
3. **Overflow Hidden:** May clip shadows or transforms
4. **Transform Origin:** Set correct origin for scale/rotate
5. **Layout Shift:** Scale can affect surrounding elements
6. **Nested Hovers:** Child hovers may conflict with parent
7. **Performance:** Too many animated properties cause jank
8. **Safari Bugs:** Some transitions render differently
9. **Focus States:** Ensure focus mimics hover
10. **Print Styles:** Hover states don't apply to print

### 4. Grid Layout

Card Grab generates responsive grid layouts for card collections.

#### Grid Analysis

```typescript
interface CardGridConfig {
  columns: {
    mobile: number;
    tablet: number;
    desktop: number;
    wide: number;
  };
  gap: {
    horizontal: string;
    vertical: string;
  };
  alignment: 'start' | 'center' | 'stretch';
  masonry: boolean;
}
```

**Grid Layout Patterns:**

```typescript
// Pattern 1: Responsive Grid
const ResponsiveCardGrid: React.FC<{
  children: React.ReactNode;
  columns?: { sm?: number; md?: number; lg?: number; xl?: number };
}> = ({ children, columns = { sm: 1, md: 2, lg: 3, xl: 4 } }) => (
  <div className={cn(
    'grid gap-6',
    `grid-cols-${columns.sm}`,
    `md:grid-cols-${columns.md}`,
    `lg:grid-cols-${columns.lg}`,
    `xl:grid-cols-${columns.xl}`
  )}>
    {children}
  </div>
);

// Pattern 2: Auto-fit Grid (flexible columns)
const AutoFitGrid: React.FC<{
  children: React.ReactNode;
  minWidth?: string;
}> = ({ children, minWidth = '280px' }) => (
  <div
    className="grid gap-6"
    style={{
      gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}, 1fr))`
    }}
  >
    {children}
  </div>
);

// Pattern 3: Featured + Grid Layout
const FeaturedGrid: React.FC<{
  featured: React.ReactNode;
  items: React.ReactNode;
}> = ({ featured, items }) => (
  <div className="grid lg:grid-cols-3 gap-6">
    {/* Featured item spans 2 columns */}
    <div className="lg:col-span-2 lg:row-span-2">
      {featured}
    </div>
    {/* Regular items */}
    {items}
  </div>
);

// Pattern 4: Masonry Grid
const MasonryGrid: React.FC<{
  children: React.ReactNode;
  columns?: number;
}> = ({ children, columns = 3 }) => (
  <div
    className="gap-6"
    style={{
      columnCount: columns,
      columnGap: '1.5rem'
    }}
  >
    {React.Children.map(children, (child) => (
      <div className="mb-6 break-inside-avoid">
        {child}
      </div>
    ))}
  </div>
);

// Pattern 5: Horizontal Scroll (Mobile)
const HorizontalScrollGrid: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <div className="
    flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory
    scrollbar-hide
    md:grid md:grid-cols-3 md:overflow-visible md:pb-0
  ">
    {React.Children.map(children, (child) => (
      <div className="flex-shrink-0 w-[280px] snap-start md:w-auto">
        {child}
      </div>
    ))}
  </div>
);

// Pattern 6: Card Grid with Filters
interface FilterableGridProps<T> {
  items: T[];
  filters: string[];
  getCategory: (item: T) => string;
  renderCard: (item: T) => React.ReactNode;
}

function FilterableGrid<T>({
  items,
  filters,
  getCategory,
  renderCard
}: FilterableGridProps<T>) {
  const [activeFilter, setActiveFilter] = React.useState('all');

  const filteredItems = activeFilter === 'all'
    ? items
    : items.filter(item => getCategory(item) === activeFilter);

  return (
    <div>
      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveFilter('all')}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium transition-colors',
            activeFilter === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          All
        </button>
        {filters.map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors',
              activeFilter === filter
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item, index) => (
          <div key={index}>{renderCard(item)}</div>
        ))}
      </div>
    </div>
  );
}

// Pattern 7: Infinite Scroll Grid
const InfiniteScrollGrid: React.FC<{
  items: any[];
  renderCard: (item: any) => React.ReactNode;
  loadMore: () => void;
  hasMore: boolean;
  loading: boolean;
}> = ({ items, renderCard, loadMore, hasMore, loading }) => {
  const observerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, index) => (
          <div key={index}>{renderCard(item)}</div>
        ))}
      </div>

      {/* Load More Trigger */}
      <div ref={observerRef} className="h-10 mt-6">
        {loading && (
          <div className="flex justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}
      </div>
    </>
  );
};

// Pattern 8: Skeleton Grid
const SkeletonGrid: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="aspect-video bg-gray-200 animate-pulse" />
        <div className="p-4 space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
        </div>
      </div>
    ))}
  </div>
);
```

**Best Practices:**

1. **Mobile First:** Design grid for mobile, expand for desktop
2. **Gap Consistency:** Use consistent gap values
3. **Equal Heights:** Ensure cards align in rows
4. **Min Width:** Set minimum card width for readability
5. **Max Columns:** Limit columns to maintain readability
6. **Loading States:** Show skeleton grid while loading
7. **Empty States:** Handle empty grid gracefully
8. **Animation:** Stagger card entrance animations
9. **Virtualization:** Virtualize large grids
10. **Responsive Testing:** Test all breakpoints

**Gotchas:**

1. **Safari Grid Bug:** May need explicit height on grid items
2. **Masonry Reflow:** CSS columns can reorder items
3. **Flex vs Grid:** Flex wrapping is less predictable
4. **Auto-fit vs Auto-fill:** Different behavior for fewer items
5. **Gap Support:** Older browsers may not support gap
6. **Subgrid:** Limited browser support
7. **Aspect Ratio:** May need padding hack for old browsers
8. **Print Layout:** Grid may need print-specific styles
9. **RTL Layout:** Grid auto-placement is RTL-aware
10. **Container Queries:** Limited support, use media queries

## Real-World Examples

### Example 1: E-Commerce Product Grid

**Input:** Screenshot of product listing page

**Generated Code:**
```typescript
import React, { useState } from 'react';
import Image from 'next/image';
import { Heart, Star, ShoppingCart, Filter, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  salePrice?: number;
  image: string;
  images: string[];
  rating: number;
  reviewCount: number;
  badge?: 'new' | 'sale' | 'bestseller';
  inStock: boolean;
  colors?: string[];
}

interface ProductGridProps {
  products: Product[];
  onAddToCart: (productId: string) => void;
  onToggleFavorite: (productId: string) => void;
  favorites: Set<string>;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onAddToCart,
  onToggleFavorite,
  favorites,
}) => {
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'rating'>('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const sortedProducts = React.useMemo(() => {
    const sorted = [...products];
    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
      case 'price-high':
        return sorted.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
      case 'rating':
        return sorted.sort((a, b) => b.rating - a.rating);
      default:
        return sorted;
    }
  }, [products, sortBy]);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <p className="text-sm text-gray-600">
          Showing <span className="font-medium">{products.length}</span> products
        </p>

        <div className="flex items-center gap-4">
          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none bg-white border border-gray-300 rounded-lg pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* View Toggle */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'
              )}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'
              )}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className={cn(
        viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          : 'space-y-4'
      )}>
        {sortedProducts.map((product) => (
          viewMode === 'grid' ? (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onToggleFavorite={onToggleFavorite}
              isFavorite={favorites.has(product.id)}
            />
          ) : (
            <ProductListItem
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onToggleFavorite={onToggleFavorite}
              isFavorite={favorites.has(product.id)}
            />
          )
        ))}
      </div>
    </div>
  );
};

// Grid Card Component
const ProductCard: React.FC<{
  product: Product;
  onAddToCart: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  isFavorite: boolean;
}> = ({ product, onAddToCart, onToggleFavorite, isFavorite }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const discount = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  return (
    <article className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
      {/* Image */}
      <div
        className="relative aspect-square overflow-hidden bg-gray-100"
        onMouseEnter={() => product.images.length > 1 && setCurrentImage(1)}
        onMouseLeave={() => setCurrentImage(0)}
      >
        {/* Badge */}
        {product.badge && (
          <span className={cn(
            'absolute top-3 left-3 z-10 px-3 py-1 rounded-full text-xs font-semibold',
            product.badge === 'sale' && 'bg-red-500 text-white',
            product.badge === 'new' && 'bg-blue-500 text-white',
            product.badge === 'bestseller' && 'bg-yellow-500 text-gray-900'
          )}>
            {product.badge === 'sale' ? `-${discount}%` : product.badge}
          </span>
        )}

        {/* Favorite */}
        <button
          onClick={() => onToggleFavorite(product.id)}
          className={cn(
            'absolute top-3 right-3 z-10 p-2 rounded-full transition-all',
            'bg-white/90 backdrop-blur-sm hover:bg-white',
            'opacity-0 group-hover:opacity-100',
            isFavorite && 'opacity-100'
          )}
        >
          <Heart className={cn(
            'w-5 h-5',
            isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
          )} />
        </button>

        {/* Image */}
        <Image
          src={product.images[currentImage] || product.image}
          alt={product.name}
          fill
          className="object-cover transition-opacity duration-300"
        />

        {/* Quick Add */}
        <div className="absolute inset-x-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onAddToCart(product.id)}
            disabled={!product.inStock}
            className="w-full py-3 bg-gray-900 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-4 h-4" />
            {product.inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-sm text-gray-500 mb-1">{product.brand}</p>
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  'w-4 h-4',
                  star <= product.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'
                )}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">({product.reviewCount})</span>
        </div>

        {/* Colors */}
        {product.colors && (
          <div className="flex gap-1 mb-3">
            {product.colors.map((color) => (
              <div
                key={color}
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2">
          {product.salePrice ? (
            <>
              <span className="text-xl font-bold text-red-600">${product.salePrice}</span>
              <span className="text-sm text-gray-400 line-through">${product.price}</span>
            </>
          ) : (
            <span className="text-xl font-bold text-gray-900">${product.price}</span>
          )}
        </div>
      </div>
    </article>
  );
};

// List Item Component
const ProductListItem: React.FC<{
  product: Product;
  onAddToCart: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  isFavorite: boolean;
}> = ({ product, onAddToCart, onToggleFavorite, isFavorite }) => (
  <article className="flex gap-6 bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow">
    {/* Image */}
    <div className="relative w-40 h-40 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
      <Image src={product.image} alt={product.name} fill className="object-cover" />
    </div>

    {/* Content */}
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">{product.brand}</p>
          <h3 className="font-semibold text-gray-900 text-lg">{product.name}</h3>
        </div>
        <button onClick={() => onToggleFavorite(product.id)}>
          <Heart className={cn('w-6 h-6', isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400')} />
        </button>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2 mt-2">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} className={cn('w-4 h-4', star <= product.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200')} />
          ))}
        </div>
        <span className="text-sm text-gray-500">{product.reviewCount} reviews</span>
      </div>

      {/* Price & Actions */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-baseline gap-2">
          {product.salePrice ? (
            <>
              <span className="text-2xl font-bold text-red-600">${product.salePrice}</span>
              <span className="text-gray-400 line-through">${product.price}</span>
            </>
          ) : (
            <span className="text-2xl font-bold text-gray-900">${product.price}</span>
          )}
        </div>
        <button
          onClick={() => onAddToCart(product.id)}
          disabled={!product.inStock}
          className="px-6 py-2 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-300"
        >
          {product.inStock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  </article>
);
```

### Example 2: Blog Post Cards

**Input:** Screenshot of blog listing

**Generated Code:**
```typescript
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  category: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  publishedAt: string;
  readTime: number;
  featured?: boolean;
}

export const BlogGrid: React.FC<{ posts: BlogPost[] }> = ({ posts }) => {
  const [featuredPost, ...regularPosts] = posts;

  return (
    <div className="space-y-12">
      {/* Featured Post */}
      {featuredPost?.featured && (
        <FeaturedBlogCard post={featuredPost} />
      )}

      {/* Regular Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {regularPosts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
};

const FeaturedBlogCard: React.FC<{ post: BlogPost }> = ({ post }) => (
  <Link href={`/blog/${post.slug}`} className="group block">
    <article className="grid lg:grid-cols-2 gap-8 bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-2xl transition-shadow">
      {/* Image */}
      <div className="relative aspect-video lg:aspect-auto overflow-hidden">
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-4 left-4">
          <span className="px-4 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-full">
            Featured
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 flex flex-col justify-center">
        <span className="text-blue-600 font-semibold text-sm mb-4">{post.category}</span>
        <h2 className="text-3xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
          {post.title}
        </h2>
        <p className="text-gray-600 text-lg mb-6 line-clamp-3">{post.excerpt}</p>

        {/* Meta */}
        <div className="flex items-center gap-4">
          <Image
            src={post.author.avatar}
            alt={post.author.name}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full"
          />
          <div>
            <p className="font-semibold text-gray-900">{post.author.name}</p>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {post.publishedAt}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {post.readTime} min read
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  </Link>
);

const BlogCard: React.FC<{ post: BlogPost }> = ({ post }) => (
  <Link href={`/blog/${post.slug}`} className="group block">
    <article className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
      {/* Image */}
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-900 text-xs font-semibold rounded-full">
            {post.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
          {post.title}
        </h3>
        <p className="text-gray-600 mb-4 line-clamp-3 flex-1">{post.excerpt}</p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <Image
              src={post.author.avatar}
              alt={post.author.name}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full"
            />
            <span className="text-sm font-medium text-gray-900">{post.author.name}</span>
          </div>
          <span className="text-sm text-gray-500">{post.readTime} min</span>
        </div>
      </div>
    </article>
  </Link>
);
```

## Related Skills

- **react-grab** - General React component extraction
- **hero-grab** - Hero section generation
- **pricing-grab** - Pricing card generation
- **testimonial-grab** - Testimonial card generation
- **stats-grab** - Statistics card generation
- **ecommerce-grab** - E-commerce components

## Further Reading

### Official Documentation
- [CSS Grid Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout)
- [Next.js Image Optimization](https://nextjs.org/docs/basic-features/image-optimization)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Design Resources
- [Card Design Best Practices](https://www.nngroup.com/articles/cards-component/)
- [Product Card UX](https://baymard.com/blog/ecommerce-product-card)
- [Image Loading Patterns](https://web.dev/image-component/)

### Performance
- [Image Optimization Guide](https://web.dev/fast/#optimize-your-images)
- [CSS Containment](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Containment)
- [Virtual Scrolling](https://tanstack.com/virtual/latest)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
*Last updated: 2025-12-04*
