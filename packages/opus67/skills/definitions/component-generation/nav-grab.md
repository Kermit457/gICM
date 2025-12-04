# NAV-GRAB Skill

## Overview
Generate production-ready navigation bar components with dropdowns, mobile menus, search, and user actions. Supports sticky headers, transparent overlays, and mega menus.

## Metadata
- **ID**: `nav-grab`
- **Category**: Component Generation
- **Complexity**: Advanced
- **Prerequisites**: React 18+, TypeScript, Headless UI (optional)
- **Estimated Time**: 15-20 minutes

## Capabilities
- Responsive navigation with mobile menu
- Dropdown menus and mega menus
- Search integration
- User profile dropdown
- Sticky and transparent navigation
- Scroll-based styling
- CTA buttons
- Notifications badge
- Dark mode support

## Navigation Component Patterns

### 1. Base Navigation Bar
```typescript
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href?: string;
  items?: NavItem[];
  badge?: string | number;
}

interface NavBarProps {
  logo: React.ReactNode;
  items: NavItem[];
  actions?: React.ReactNode;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  onUserMenuClick?: (action: string) => void;
  sticky?: boolean;
  transparent?: boolean;
  className?: string;
}

export function NavBar({
  logo,
  items,
  actions,
  user,
  onUserMenuClick,
  sticky = true,
  transparent = false,
  className = '',
}: NavBarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href;
  };

  const bgClass = transparent && !scrolled
    ? 'bg-transparent'
    : 'bg-white border-b border-gray-200 shadow-sm';

  const textClass = transparent && !scrolled
    ? 'text-white'
    : 'text-gray-900';

  return (
    <nav
      className={`
        ${sticky ? 'sticky top-0' : ''}
        ${bgClass}
        ${textClass}
        z-50 transition-all duration-300
        ${className}
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/">{logo}</Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {items.map((item, index) => (
              <div key={index} className="relative">
                {item.items ? (
                  <>
                    <button
                      onClick={() =>
                        setActiveDropdown(activeDropdown === item.label ? null : item.label)
                      }
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium hover:text-blue-600 transition-colors"
                    >
                      {item.label}
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          activeDropdown === item.label ? 'rotate-180' : ''
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
                    {activeDropdown === item.label && (
                      <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2">
                        {item.items.map((subItem, subIndex) => (
                          <Link
                            key={subIndex}
                            href={subItem.href || '#'}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setActiveDropdown(null)}
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href || '#'}
                    className={`
                      px-3 py-2 text-sm font-medium transition-colors
                      ${
                        isActive(item.href)
                          ? 'text-blue-600'
                          : 'hover:text-blue-600'
                      }
                    `}
                  >
                    {item.label}
                    {item.badge && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            {actions}
            {user && (
              <div className="relative">
                <button
                  onClick={() =>
                    setActiveDropdown(activeDropdown === 'user' ? null : 'user')
                  }
                  className="flex items-center gap-2"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>
                {activeDropdown === 'user' && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        onUserMenuClick?.('profile');
                        setActiveDropdown(null);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        onUserMenuClick?.('settings');
                        setActiveDropdown(null);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Settings
                    </button>
                    <button
                      onClick={() => {
                        onUserMenuClick?.('logout');
                        setActiveDropdown(null);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-4 space-y-1">
            {items.map((item, index) => (
              <div key={index}>
                <Link
                  href={item.href || '#'}
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
                {item.items && (
                  <div className="pl-4 space-y-1">
                    {item.items.map((subItem, subIndex) => (
                      <Link
                        key={subIndex}
                        href={subItem.href || '#'}
                        className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {user && (
              <div className="pt-4 border-t border-gray-200">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    onUserMenuClick?.('profile');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  Profile
                </button>
                <button
                  onClick={() => {
                    onUserMenuClick?.('logout');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50 rounded-lg"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
```

### 2. Navigation with Search
```typescript
interface SearchableNavProps extends NavBarProps {
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
}

export function SearchableNav({
  onSearch,
  searchPlaceholder = 'Search...',
  ...props
}: SearchableNavProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
    setSearchOpen(false);
  };

  return (
    <NavBar
      {...props}
      actions={
        <>
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
          {props.actions}

          {/* Search Modal */}
          {searchOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20"
              onClick={() => setSearchOpen(false)}
            >
              <div
                className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <form onSubmit={handleSearch} className="p-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    autoFocus
                    className="w-full px-4 py-3 text-lg border-0 focus:ring-0 focus:outline-none"
                  />
                </form>
              </div>
            </div>
          )}
        </>
      }
    />
  );
}
```

### 3. Mega Menu Navigation
```typescript
interface MegaMenuItem {
  label: string;
  href: string;
  description?: string;
  icon?: React.ReactNode;
}

interface MegaMenuSection {
  title: string;
  items: MegaMenuItem[];
}

interface MegaMenuNavProps extends Omit<NavBarProps, 'items'> {
  items: Array<
    | NavItem
    | {
        label: string;
        megaMenu: MegaMenuSection[];
      }
  >;
}

export function MegaMenuNav({ items, ...props }: MegaMenuNavProps) {
  const [activeMega, setActiveMega] = useState<string | null>(null);

  return (
    <NavBar
      {...props}
      items={items.map((item) => {
        if ('megaMenu' in item) {
          return {
            label: item.label,
            items: item.megaMenu.flatMap((section) => section.items),
          };
        }
        return item;
      })}
    />
  );
}
```

## Usage Examples

### Basic Navigation
```typescript
<NavBar
  logo={<Logo />}
  items={[
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    {
      label: 'Products',
      items: [
        { label: 'All Products', href: '/products' },
        { label: 'Categories', href: '/categories' },
      ],
    },
    { label: 'Contact', href: '/contact' },
  ]}
  actions={
    <>
      <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">
        Sign In
      </button>
      <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
        Get Started
      </button>
    </>
  }
  sticky
/>
```

## Best Practices

1. **Responsiveness**
   - Mobile-first design
   - Touch-friendly targets
   - Collapsible mobile menu
   - Test on various devices

2. **Performance**
   - Lazy load dropdowns
   - Optimize images
   - Minimize repaints
   - Use CSS transforms

3. **Accessibility**
   - Keyboard navigation
   - ARIA labels
   - Focus management
   - Screen reader support

4. **UX**
   - Clear active states
   - Fast interactions
   - Prevent layout shift
   - Smooth animations

## Generated: 2025-01-04
Version: 1.0.0
