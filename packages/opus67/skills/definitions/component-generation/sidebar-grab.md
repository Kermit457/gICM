# SIDEBAR-GRAB Skill

## Overview
Generate production-ready sidebar navigation components with collapsible menus, nested navigation, mobile responsiveness, and various layout patterns. Supports multi-level navigation, icons, badges, and user profiles.

## Metadata
- **ID**: `sidebar-grab`
- **Category**: Component Generation
- **Complexity**: Advanced
- **Prerequisites**: React 18+, TypeScript, React Router or Next.js
- **Estimated Time**: 15-25 minutes

## Capabilities
- Fixed and collapsible sidebars
- Multi-level nested navigation
- Icon integration and badges
- User profile sections
- Mobile-responsive with drawer behavior
- Active state management
- Search functionality
- Keyboard navigation
- Dark mode support
- Customizable themes

## Sidebar Component Patterns

### 1. Base Sidebar Component
```typescript
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  children?: NavItem[];
}

interface SidebarProps {
  items: NavItem[];
  logo?: React.ReactNode;
  footer?: React.ReactNode;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  className?: string;
}

export function Sidebar({
  items,
  logo,
  footer,
  user,
  collapsed = false,
  onCollapsedChange,
  className = '',
}: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const renderNavItem = (item: NavItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const active = isActive(item.href);

    return (
      <div key={item.id}>
        {item.href ? (
          <Link
            href={item.href}
            className={`
              flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg
              transition-colors duration-150
              ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }
              ${collapsed ? 'justify-center' : ''}
              ${level > 0 ? 'ml-' + level * 4 : ''}
            `}
            style={{ paddingLeft: collapsed ? undefined : `${1 + level * 0.75}rem` }}
          >
            {item.icon && (
              <span className={`flex-shrink-0 ${active ? 'text-blue-700' : 'text-gray-500'}`}>
                {item.icon}
              </span>
            )}
            {!collapsed && (
              <>
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                    {item.badge}
                  </span>
                )}
                {hasChildren && (
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      isExpanded ? 'rotate-90' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
              </>
            )}
          </Link>
        ) : (
          <button
            onClick={() => toggleExpanded(item.id)}
            className={`
              w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg
              text-gray-700 hover:bg-gray-50 transition-colors duration-150
              ${collapsed ? 'justify-center' : ''}
              ${level > 0 ? 'ml-' + level * 4 : ''}
            `}
            style={{ paddingLeft: collapsed ? undefined : `${1 + level * 0.75}rem` }}
          >
            {item.icon && <span className="flex-shrink-0 text-gray-500">{item.icon}</span>}
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                    {item.badge}
                  </span>
                )}
                {hasChildren && (
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      isExpanded ? 'rotate-90' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
              </>
            )}
          </button>
        )}

        {hasChildren && isExpanded && !collapsed && (
          <div className="mt-1 space-y-1">
            {item.children!.map((child) => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={`
        flex flex-col bg-white border-r border-gray-200 h-screen transition-all duration-300
        ${collapsed ? 'w-20' : 'w-64'}
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!collapsed && logo && <div className="flex-1">{logo}</div>}
        {onCollapsedChange && (
          <button
            onClick={() => onCollapsedChange(!collapsed)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {items.map((item) => renderNavItem(item))}
      </nav>

      {/* User Profile */}
      {user && (
        <div className="p-4 border-t border-gray-200">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      {footer && !collapsed && (
        <div className="p-4 border-t border-gray-200">{footer}</div>
      )}
    </aside>
  );
}
```

### 2. Mobile Sidebar with Overlay
```typescript
interface MobileSidebarProps extends SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({
  isOpen,
  onClose,
  ...sidebarProps
}: MobileSidebarProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full z-50 md:hidden
          transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar {...sidebarProps} collapsed={false} />
      </div>
    </>
  );
}
```

### 3. Sidebar with Search
```typescript
interface SearchableSidebarProps extends SidebarProps {
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
}

export function SearchableSidebar({
  items,
  searchPlaceholder = 'Search...',
  onSearch,
  ...props
}: SearchableSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;

    const filterItems = (items: NavItem[]): NavItem[] => {
      return items
        .map((item) => {
          const matchesSearch = item.label
            .toLowerCase()
            .includes(searchQuery.toLowerCase());

          const filteredChildren = item.children
            ? filterItems(item.children)
            : undefined;

          if (matchesSearch || (filteredChildren && filteredChildren.length > 0)) {
            return {
              ...item,
              children: filteredChildren,
            };
          }

          return null;
        })
        .filter((item): item is NavItem => item !== null);
    };

    return filterItems(items);
  }, [items, searchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  };

  return (
    <Sidebar
      {...props}
      items={filteredItems}
      logo={
        <div className="space-y-4">
          {props.logo}
          {!props.collapsed && (
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder={searchPlaceholder}
                className="w-full px-3 py-2 pl-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          )}
        </div>
      }
    />
  );
}
```

### 4. Sidebar Layout Component
```typescript
interface SidebarLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  header?: React.ReactNode;
  mobileBreakpoint?: 'sm' | 'md' | 'lg';
}

export function SidebarLayout({
  children,
  sidebar,
  header,
  mobileBreakpoint = 'md',
}: SidebarLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const breakpointClass = {
    sm: 'sm:hidden',
    md: 'md:hidden',
    lg: 'lg:hidden',
  }[mobileBreakpoint];

  const showClass = {
    sm: 'sm:flex',
    md: 'md:flex',
    lg: 'lg:flex',
  }[mobileBreakpoint];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <div className={`hidden ${showClass}`}>{sidebar}</div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        {...(sidebar as any).props}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        {header && (
          <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
            <button
              onClick={() => setIsMobileOpen(true)}
              className={`p-2 text-gray-500 hover:bg-gray-100 rounded-lg ${breakpointClass}`}
              aria-label="Open sidebar"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            {header}
          </header>
        )}

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
```

### 5. Dark Mode Sidebar
```typescript
interface DarkSidebarProps extends SidebarProps {
  theme?: 'light' | 'dark';
}

export function DarkSidebar({ theme = 'light', ...props }: DarkSidebarProps) {
  const isDark = theme === 'dark';

  const baseClasses = isDark
    ? 'bg-gray-900 border-gray-800 text-gray-100'
    : 'bg-white border-gray-200 text-gray-900';

  const itemClasses = (active: boolean) => {
    if (isDark) {
      return active
        ? 'bg-blue-900 text-blue-100'
        : 'text-gray-300 hover:bg-gray-800 hover:text-gray-100';
    }
    return active
      ? 'bg-blue-50 text-blue-700'
      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900';
  };

  return (
    <Sidebar
      {...props}
      className={`${baseClasses} ${props.className}`}
    />
  );
}
```

## Usage Examples

### Basic Sidebar
```typescript
const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: <HomeIcon />,
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: <FolderIcon />,
    badge: 12,
    children: [
      { id: 'all-projects', label: 'All Projects', href: '/projects' },
      { id: 'archived', label: 'Archived', href: '/projects/archived' },
    ],
  },
  {
    id: 'team',
    label: 'Team',
    href: '/team',
    icon: <UsersIcon />,
    badge: 'New',
  },
];

<Sidebar
  items={navItems}
  logo={<Logo />}
  user={{
    name: 'John Doe',
    email: 'john@example.com',
    avatar: '/avatar.jpg',
  }}
/>
```

### Collapsible Sidebar with Layout
```typescript
const [collapsed, setCollapsed] = useState(false);

<SidebarLayout
  sidebar={
    <Sidebar
      items={navItems}
      logo={<Logo />}
      collapsed={collapsed}
      onCollapsedChange={setCollapsed}
      user={{
        name: 'John Doe',
        email: 'john@example.com',
      }}
    />
  }
  header={
    <div className="flex-1">
      <h1 className="text-xl font-semibold">Dashboard</h1>
    </div>
  }
>
  <div className="p-6">
    {/* Page content */}
  </div>
</SidebarLayout>
```

### Searchable Sidebar
```typescript
<SearchableSidebar
  items={navItems}
  logo={<Logo />}
  searchPlaceholder="Search navigation..."
  onSearch={(query) => console.log('Searching:', query)}
/>
```

## Best Practices

1. **Navigation Structure**
   - Keep hierarchy shallow (max 3 levels)
   - Group related items
   - Use clear, concise labels
   - Provide visual feedback for active states

2. **Performance**
   - Memoize navigation items
   - Lazy load icon components
   - Optimize re-renders with React.memo
   - Use virtual scrolling for very long lists

3. **Accessibility**
   - Support keyboard navigation
   - Include proper ARIA labels
   - Announce navigation changes
   - Ensure sufficient color contrast

4. **Mobile Experience**
   - Use drawer pattern on mobile
   - Provide touch-friendly targets
   - Close on navigation
   - Show hamburger menu icon

## Styling Variants

### Minimal Sidebar
```css
.sidebar-minimal {
  border-right: 1px solid #e5e7eb;
}

.sidebar-minimal .nav-item {
  padding: 0.5rem 1rem;
  border-radius: 0;
  font-size: 0.875rem;
}

.sidebar-minimal .nav-item:hover {
  background-color: #f9fafb;
}
```

### Rounded Sidebar
```css
.sidebar-rounded {
  border-radius: 1rem;
  margin: 1rem;
  height: calc(100vh - 2rem);
}

.sidebar-rounded .nav-item {
  border-radius: 0.5rem;
  margin: 0.25rem 0;
}
```

## Generated: 2025-01-04
Version: 1.0.0
