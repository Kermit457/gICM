# ECOMMERCE-GRAB Skill

## Overview
Generate production-ready e-commerce components including product displays, shopping carts, checkout flows, and order management. Supports various layouts, filters, and payment integrations.

## Metadata
- **ID**: `ecommerce-grab`
- **Category**: Component Generation
- **Complexity**: Advanced
- **Prerequisites**: React 18+, TypeScript, State Management (Zustand/Redux)
- **Estimated Time**: 20-30 minutes

## Capabilities
- Product listings and grids
- Product detail pages
- Shopping cart components
- Checkout flows
- Order summaries
- Filter and sort systems
- Quick view modals
- Wishlist functionality
- Product reviews
- Inventory status

## E-commerce Component Patterns

### 1. Product Grid
```typescript
import React, { useState } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  badge?: string;
  rating?: number;
  reviews?: number;
  inStock: boolean;
  colors?: string[];
  sizes?: string[];
}

interface ProductGridProps {
  products: Product[];
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  columns?: 2 | 3 | 4;
}

export function ProductGrid({
  products,
  onProductClick,
  onAddToCart,
  onQuickView,
  columns = 4,
}: ProductGridProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-6`}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onClick={() => onProductClick?.(product)}
          onAddToCart={() => onAddToCart?.(product)}
          onQuickView={() => onQuickView?.(product)}
        />
      ))}
    </div>
  );
}

function ProductCard({
  product,
  onClick,
  onAddToCart,
  onQuickView,
}: {
  product: Product;
  onClick?: () => void;
  onAddToCart?: () => void;
  onQuickView?: () => void;
}) {
  const [imageIndex, setImageIndex] = useState(0);
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <div
        className="relative aspect-square cursor-pointer"
        onClick={onClick}
        onMouseEnter={() => setImageIndex(1)}
        onMouseLeave={() => setImageIndex(0)}
      >
        <img
          src={product.images?.[imageIndex] || product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-opacity duration-300"
        />

        {/* Badges */}
        {product.badge && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-full">
            {product.badge}
          </div>
        )}
        {discount > 0 && (
          <div className="absolute top-3 right-3 px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
            -{discount}%
          </div>
        )}

        {/* Stock Status */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="px-4 py-2 bg-white text-gray-900 font-semibold rounded-lg">
              Out of Stock
            </span>
          </div>
        )}

        {/* Quick Actions */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView?.();
            }}
            className="w-full py-2 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            Quick View
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3
          className="font-semibold text-gray-900 mb-1 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
          onClick={onClick}
        >
          {product.name}
        </h3>

        {/* Rating */}
        {product.rating !== undefined && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${
                    i < product.rating! ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            {product.reviews !== undefined && (
              <span className="text-xs text-gray-500">({product.reviews})</span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl font-bold text-gray-900">
            ${product.price.toFixed(2)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-gray-500 line-through">
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Variants */}
        {product.colors && product.colors.length > 0 && (
          <div className="flex gap-1 mb-3">
            {product.colors.slice(0, 5).map((color, index) => (
              <button
                key={index}
                className="w-6 h-6 rounded-full border-2 border-gray-300"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        )}

        {/* Add to Cart */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart?.();
          }}
          disabled={!product.inStock}
          className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {product.inStock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
}
```

### 2. Shopping Cart
```typescript
interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

interface ShoppingCartProps {
  items: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onCheckout: () => void;
}

export function ShoppingCart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: ShoppingCartProps) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const shipping = subtotal > 50 ? 0 : 9.99;
  const tax = subtotal * 0.1;
  const total = subtotal + shipping + tax;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="w-24 h-24 mx-auto text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <p className="text-gray-600 mb-4">Your cart is empty</p>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 bg-white rounded-lg border border-gray-200 p-4"
              >
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-24 h-24 object-cover rounded"
                />

                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {item.product.name}
                  </h3>

                  {item.selectedColor && (
                    <p className="text-sm text-gray-600">Color: {item.selectedColor}</p>
                  )}
                  {item.selectedSize && (
                    <p className="text-sm text-gray-600">Size: {item.selectedSize}</p>
                  )}

                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center border border-gray-300 rounded">
                      <button
                        onClick={() =>
                          onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))
                        }
                        className="px-3 py-1 hover:bg-gray-100"
                      >
                        -
                      </button>
                      <span className="px-4 py-1 border-x border-gray-300">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="px-3 py-1 hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">
                    ${item.product.price.toFixed(2)} each
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Order Summary
              </h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onCheckout}
                className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 mb-3"
              >
                Proceed to Checkout
              </button>

              <button className="w-full px-6 py-3 bg-white text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50">
                Continue Shopping
              </button>

              {subtotal < 50 && (
                <p className="text-sm text-gray-600 mt-4">
                  Add ${(50 - subtotal).toFixed(2)} more for free shipping!
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 3. Product Filters
```typescript
interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

interface FilterSection {
  id: string;
  label: string;
  type: 'checkbox' | 'range' | 'color';
  options?: FilterOption[];
  min?: number;
  max?: number;
}

interface ProductFiltersProps {
  filters: FilterSection[];
  selectedFilters: Record<string, string[]>;
  onFilterChange: (filterId: string, values: string[]) => void;
  onClearAll: () => void;
}

export function ProductFilters({
  filters,
  selectedFilters,
  onFilterChange,
  onClearAll,
}: ProductFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(filters.map((f) => f.id))
  );

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCheckboxChange = (filterId: string, value: string) => {
    const current = selectedFilters[filterId] || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFilterChange(filterId, updated);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <button
          onClick={onClearAll}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Clear all
        </button>
      </div>

      <div className="space-y-6">
        {filters.map((filter) => (
          <div key={filter.id} className="border-b border-gray-200 pb-4 last:border-0">
            <button
              onClick={() => toggleSection(filter.id)}
              className="flex items-center justify-between w-full mb-3"
            >
              <span className="font-medium text-gray-900">{filter.label}</span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  expandedSections.has(filter.id) ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {expandedSections.has(filter.id) && (
              <div className="space-y-2">
                {filter.type === 'checkbox' &&
                  filter.options?.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={
                          selectedFilters[filter.id]?.includes(option.value) || false
                        }
                        onChange={() => handleCheckboxChange(filter.id, option.value)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 flex-1">
                        {option.label}
                      </span>
                      {option.count !== undefined && (
                        <span className="text-sm text-gray-500">({option.count})</span>
                      )}
                    </label>
                  ))}

                {filter.type === 'color' && (
                  <div className="flex flex-wrap gap-2">
                    {filter.options?.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleCheckboxChange(filter.id, option.value)}
                        className={`w-8 h-8 rounded-full border-2 ${
                          selectedFilters[filter.id]?.includes(option.value)
                            ? 'border-blue-600'
                            : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: option.value }}
                        title={option.label}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4. Checkout Form
```typescript
interface CheckoutFormProps {
  onSubmit: (data: CheckoutData) => void;
  loading?: boolean;
}

interface CheckoutData {
  email: string;
  shipping: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  payment: {
    cardNumber: string;
    expiry: string;
    cvv: string;
  };
}

export function CheckoutForm({ onSubmit, loading = false }: CheckoutFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<CheckoutData>>({});

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {['Shipping', 'Payment', 'Review'].map((label, index) => (
          <div key={label} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                index + 1 <= step
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {index + 1}
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700">{label}</span>
            {index < 2 && (
              <div
                className={`w-16 h-1 mx-4 ${
                  index + 1 < step ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form Steps */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {step === 1 && <ShippingForm onNext={(data) => {
          setFormData({ ...formData, ...data });
          setStep(2);
        }} />}
        {step === 2 && <PaymentForm onNext={(data) => {
          setFormData({ ...formData, ...data });
          setStep(3);
        }} onBack={() => setStep(1)} />}
        {step === 3 && <OrderReview data={formData as CheckoutData} onSubmit={onSubmit} onBack={() => setStep(2)} loading={loading} />}
      </div>
    </div>
  );
}
```

## Usage Examples

### Complete Product Listing Page
```typescript
<div className="flex gap-8">
  <aside className="w-64">
    <ProductFilters
      filters={filters}
      selectedFilters={selectedFilters}
      onFilterChange={handleFilterChange}
      onClearAll={handleClearAll}
    />
  </aside>

  <main className="flex-1">
    <ProductGrid
      products={filteredProducts}
      onProductClick={(p) => router.push(`/products/${p.id}`)}
      onAddToCart={handleAddToCart}
      onQuickView={setQuickViewProduct}
      columns={3}
    />
  </main>
</div>
```

## Best Practices

1. **User Experience**
   - Clear product information
   - Easy navigation
   - Quick add to cart
   - Persistent cart state
   - Guest checkout option

2. **Performance**
   - Lazy load images
   - Virtualize long lists
   - Optimize filters
   - Cache API responses

3. **Security**
   - Secure payment processing
   - Input validation
   - HTTPS only
   - PCI compliance

4. **Mobile**
   - Touch-friendly buttons
   - Responsive grids
   - Mobile checkout
   - Thumb-zone optimization

## Generated: 2025-01-04
Version: 1.0.0
