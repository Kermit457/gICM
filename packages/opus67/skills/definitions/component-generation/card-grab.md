# CARD-GRAB Skill

## Overview
Generate production-ready card components with various layouts, hover effects, and content types. Supports product cards, profile cards, blog cards, and dashboard widgets.

## Metadata
- **ID**: `card-grab`
- **Category**: Component Generation
- **Complexity**: Intermediate
- **Prerequisites**: React 18+, TypeScript
- **Estimated Time**: 10-15 minutes

## Capabilities
- Basic content cards
- Product cards with pricing
- Profile/team member cards
- Blog/article cards
- Dashboard stat cards
- Image cards with overlays
- Interactive hover effects
- Responsive grid layouts
- Dark mode variants

## Card Component Patterns

### 1. Basic Card
```typescript
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  onClick,
  className = '',
}: CardProps) {
  const variantClasses = {
    default: 'bg-white border border-gray-200',
    outlined: 'bg-transparent border-2 border-gray-300',
    elevated: 'bg-white shadow-lg',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      onClick={onClick}
      className={`
        rounded-lg ${variantClasses[variant]} ${paddingClasses[padding]}
        ${hoverable ? 'hover:shadow-xl transition-shadow duration-300 cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="text-gray-600">{children}</div>;
}

export function CardFooter({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 pt-4 border-t border-gray-200">{children}</div>;
}
```

### 2. Product Card
```typescript
interface ProductCardProps {
  image: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  rating?: number;
  reviews?: number;
  onAddToCart?: () => void;
  onQuickView?: () => void;
}

export function ProductCard({
  image,
  title,
  description,
  price,
  originalPrice,
  badge,
  rating,
  reviews,
  onAddToCart,
  onQuickView,
}: ProductCardProps) {
  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <Card hoverable padding="none" className="overflow-hidden group">
      <div className="relative">
        <img
          src={image}
          alt={title}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {badge && (
          <div className="absolute top-4 left-4 px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-full">
            {badge}
          </div>
        )}
        {discount > 0 && (
          <div className="absolute top-4 right-4 px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
            -{discount}%
          </div>
        )}
        <button
          onClick={onQuickView}
          className="absolute inset-x-4 bottom-4 py-2 bg-white text-gray-900 font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          Quick View
        </button>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{title}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{description}</p>

        {rating !== undefined && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            {reviews !== undefined && (
              <span className="text-xs text-gray-500">({reviews})</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xl font-bold text-gray-900">${price}</span>
            {originalPrice && (
              <span className="ml-2 text-sm text-gray-500 line-through">
                ${originalPrice}
              </span>
            )}
          </div>
          <button
            onClick={onAddToCart}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </Card>
  );
}
```

### 3. Profile Card
```typescript
interface ProfileCardProps {
  avatar: string;
  name: string;
  role: string;
  bio?: string;
  stats?: Array<{ label: string; value: string | number }>;
  socialLinks?: Array<{ platform: string; url: string; icon: React.ReactNode }>;
  onConnect?: () => void;
  onMessage?: () => void;
}

export function ProfileCard({
  avatar,
  name,
  role,
  bio,
  stats,
  socialLinks,
  onConnect,
  onMessage,
}: ProfileCardProps) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-600" />

      <div className="px-6 pb-6">
        <div className="flex justify-center -mt-12 mb-4">
          <img
            src={avatar}
            alt={name}
            className="w-24 h-24 rounded-full border-4 border-white object-cover"
          />
        </div>

        <div className="text-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">{name}</h3>
          <p className="text-sm text-gray-600 mt-1">{role}</p>
          {bio && <p className="text-sm text-gray-600 mt-2">{bio}</p>}
        </div>

        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-4 py-4 border-y border-gray-200">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-lg font-semibold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {socialLinks && (
          <div className="flex justify-center gap-3 mb-4">
            {socialLinks.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                {link.icon}
              </a>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          {onConnect && (
            <button
              onClick={onConnect}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Connect
            </button>
          )}
          {onMessage && (
            <button
              onClick={onMessage}
              className="flex-1 px-4 py-2 bg-white text-gray-700 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Message
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
```

### 4. Blog Card
```typescript
interface BlogCardProps {
  image: string;
  title: string;
  excerpt: string;
  author: {
    name: string;
    avatar: string;
  };
  date: string;
  readTime: string;
  tags?: string[];
  href: string;
}

export function BlogCard({
  image,
  title,
  excerpt,
  author,
  date,
  readTime,
  tags,
  href,
}: BlogCardProps) {
  return (
    <Card hoverable padding="none" className="overflow-hidden">
      <Link href={href}>
        <img src={image} alt={title} className="w-full h-48 object-cover" />
      </Link>

      <div className="p-6">
        {tags && tags.length > 0 && (
          <div className="flex gap-2 mb-3">
            {tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <Link href={href}>
          <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors line-clamp-2">
            {title}
          </h3>
        </Link>

        <p className="text-gray-600 mb-4 line-clamp-3">{excerpt}</p>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <img
              src={author.avatar}
              alt={author.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">{author.name}</p>
              <p className="text-xs text-gray-600">{date}</p>
            </div>
          </div>
          <span className="text-sm text-gray-600">{readTime}</span>
        </div>
      </div>
    </Card>
  );
}
```

### 5. Stat Card
```typescript
interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon?: React.ReactNode;
  trend?: Array<number>;
}

export function StatCard({ title, value, change, icon, trend }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {change && (
            <div className="flex items-center gap-1 mt-2">
              <svg
                className={`w-4 h-4 ${
                  change.type === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    change.type === 'increase'
                      ? 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
                      : 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6'
                  }
                />
              </svg>
              <span
                className={`text-sm font-medium ${
                  change.type === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {change.value}%
              </span>
              <span className="text-sm text-gray-600">vs last month</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">{icon}</div>
        )}
      </div>

      {trend && (
        <div className="mt-4">
          <svg className="w-full h-12" viewBox="0 0 100 24">
            <polyline
              points={trend
                .map((value, index) => `${(index / (trend.length - 1)) * 100},${24 - value}`)
                .join(' ')}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-blue-600"
            />
          </svg>
        </div>
      )}
    </Card>
  );
}
```

## Usage Examples

### Product Grid
```typescript
<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
  {products.map((product) => (
    <ProductCard
      key={product.id}
      {...product}
      onAddToCart={() => handleAddToCart(product.id)}
      onQuickView={() => handleQuickView(product.id)}
    />
  ))}
</div>
```

### Dashboard Stats
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <StatCard
    title="Total Revenue"
    value="$45,231"
    change={{ value: 12, type: 'increase' }}
    icon={<DollarIcon />}
  />
  <StatCard
    title="Active Users"
    value="2,345"
    change={{ value: 8, type: 'increase' }}
    icon={<UsersIcon />}
  />
</div>
```

## Best Practices

1. **Layout**
   - Consistent padding
   - Proper spacing
   - Responsive grids
   - Image aspect ratios

2. **Performance**
   - Lazy load images
   - Optimize thumbnails
   - Use skeleton loaders
   - Implement virtualization

3. **Accessibility**
   - Semantic HTML
   - Alt text for images
   - Keyboard navigation
   - Focus states

4. **Design**
   - Consistent elevation
   - Clear hierarchy
   - Action affordances
   - Loading states

## Generated: 2025-01-04
Version: 1.0.0
