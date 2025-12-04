#!/usr/bin/env python3
"""Script to write expanded skill definitions for OPUS 67."""

import os

SKILLS_DIR = os.path.dirname(os.path.abspath(__file__))

def write_react_expert():
    content = r'''# React Expert

> **ID:** `react-expert`
> **Tier:** 3
> **Token Cost:** 10000
> **MCP Connections:** context7

## What This Skill Does

- Build complex component hierarchies with composition patterns
- Implement custom hooks for reusable stateful logic
- Optimize rendering with useMemo/useCallback/React.memo
- Handle context and state management at scale
- Build with React 18+ features (Suspense, Transitions, useId)
- Server Components vs Client Components architecture

## When to Use

This skill is automatically loaded when:

- **Keywords:** react, hook, useState, useEffect, component, jsx, context, useMemo, useCallback, suspense, server component
- **File Types:** .tsx, .jsx
- **Directories:** components/, hooks/, app/, pages/

## Core Capabilities

### 1. Build Complex Component Hierarchies

Master component composition to create flexible, reusable UI architectures that scale with your application.

**Best Practices:**
- Prefer composition over inheritance - React components should be composed, not extended
- Keep components focused on a single responsibility
- Use compound components for related UI elements that share state
- Implement render props or children as functions for maximum flexibility
- Create slot patterns for predictable content injection points

**Common Patterns:**

```typescript
// Compound Component Pattern - Components that work together
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs provider");
  }
  return context;
}

interface TabsProps {
  defaultTab: string;
  children: React.ReactNode;
  onChange?: (tab: string) => void;
}

function Tabs({ defaultTab, children, onChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleSetActiveTab = useCallback((tab: string) => {
    setActiveTab(tab);
    onChange?.(tab);
  }, [onChange]);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleSetActiveTab }}>
      <div className="tabs-container">{children}</div>
    </TabsContext.Provider>
  );
}

function TabList({ children }: { children: React.ReactNode }) {
  return (
    <div role="tablist" className="flex border-b border-gray-200">
      {children}
    </div>
  );
}

interface TabProps {
  value: string;
  children: React.ReactNode;
}

function Tab({ value, children }: TabProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => setActiveTab(value)}
      className={cn(
        "px-4 py-2 font-medium transition-colors",
        isActive
          ? "border-b-2 border-blue-500 text-blue-600"
          : "text-gray-500 hover:text-gray-700"
      )}
    >
      {children}
    </button>
  );
}

interface TabPanelProps {
  value: string;
  children: React.ReactNode;
}

function TabPanel({ value, children }: TabPanelProps) {
  const { activeTab } = useTabsContext();
  if (activeTab !== value) return null;

  return (
    <div role="tabpanel" className="py-4">
      {children}
    </div>
  );
}

// Attach sub-components for clean API
Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;

// Usage:
function SettingsPage() {
  return (
    <Tabs defaultTab="profile" onChange={(tab) => console.log("Tab changed:", tab)}>
      <Tabs.List>
        <Tabs.Tab value="profile">Profile</Tabs.Tab>
        <Tabs.Tab value="security">Security</Tabs.Tab>
        <Tabs.Tab value="notifications">Notifications</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="profile">
        <ProfileSettings />
      </Tabs.Panel>
      <Tabs.Panel value="security">
        <SecuritySettings />
      </Tabs.Panel>
      <Tabs.Panel value="notifications">
        <NotificationSettings />
      </Tabs.Panel>
    </Tabs>
  );
}
```

```typescript
// Render Props Pattern - Maximum flexibility for rendering
interface DataFetcherProps<T> {
  url: string;
  children: (state: {
    data: T | null;
    loading: boolean;
    error: Error | null;
    refetch: () => void;
  }) => React.ReactNode;
}

function DataFetcher<T>({ url, children }: DataFetcherProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return <>{children({ data, loading, error, refetch: fetchData })}</>;
}

// Usage:
function UserProfile({ userId }: { userId: string }) {
  return (
    <DataFetcher<User> url={`/api/users/${userId}`}>
      {({ data, loading, error, refetch }) => {
        if (loading) return <Skeleton className="h-32 w-full" />;
        if (error) return <ErrorMessage error={error} onRetry={refetch} />;
        if (!data) return <EmptyState message="User not found" />;

        return (
          <div className="space-y-4">
            <Avatar src={data.avatar} alt={data.name} />
            <h1 className="text-2xl font-bold">{data.name}</h1>
            <p className="text-gray-600">{data.bio}</p>
          </div>
        );
      }}
    </DataFetcher>
  );
}
```

```typescript
// Slot Pattern - Named content areas
interface CardSlots {
  header?: React.ReactNode;
  media?: React.ReactNode;
  content: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
}

interface CardProps extends CardSlots {
  variant?: "elevated" | "outlined" | "filled";
  className?: string;
}

function Card({
  header,
  media,
  content,
  actions,
  footer,
  variant = "elevated",
  className,
}: CardProps) {
  const variantStyles = {
    elevated: "bg-white shadow-lg",
    outlined: "bg-white border border-gray-200",
    filled: "bg-gray-50",
  };

  return (
    <article className={cn("rounded-xl overflow-hidden", variantStyles[variant], className)}>
      {header && <header className="px-6 py-4 border-b border-gray-100">{header}</header>}
      {media && <div className="aspect-video overflow-hidden">{media}</div>}
      <div className="px-6 py-4">{content}</div>
      {actions && (
        <div className="px-6 py-3 bg-gray-50 flex gap-2 justify-end">{actions}</div>
      )}
      {footer && <footer className="px-6 py-3 border-t border-gray-100">{footer}</footer>}
    </article>
  );
}

// Usage:
function ProductCard({ product }: { product: Product }) {
  return (
    <Card
      variant="elevated"
      header={<Badge variant="success">In Stock</Badge>}
      media={<img src={product.image} alt={product.name} className="w-full h-full object-cover" />}
      content={
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{product.name}</h3>
          <p className="text-gray-600 text-sm">{product.description}</p>
          <p className="text-xl font-bold text-green-600">${product.price}</p>
        </div>
      }
      actions={
        <>
          <Button variant="outline">Add to Wishlist</Button>
          <Button>Add to Cart</Button>
        </>
      }
    />
  );
}
```

**Gotchas:**
- Avoid prop drilling by using Context for deeply nested data
- Do not create new component definitions inside render - causes remounting
- Be careful with inline object/array props - they create new references each render
- Compound components require all children to be direct descendants unless using Context

### 2. Implement Custom Hooks

Extract and share stateful logic between components with custom hooks that follow React conventions.

**Best Practices:**
- Name hooks with `use` prefix - this enables lint rules and conventions
- Keep hooks focused on a single concern
- Return stable references when possible (memoize callbacks and objects)
- Handle cleanup in useEffect return functions
- Document hook parameters and return values with TypeScript

**Common Patterns:**

```typescript
// useLocalStorage - Persist state to localStorage with SSR safety
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        setStoredValue((prev) => {
          const valueToStore = value instanceof Function ? value(prev) : value;
          if (typeof window !== "undefined") {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
          }
          return valueToStore;
        });
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key]
  );

  const removeValue = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch {
          setStoredValue(initialValue);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

// Usage:
function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage<"light" | "dark">("theme", "light");

  return (
    <button onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}>
      Current: {theme}
    </button>
  );
}
```

```typescript
// useDebounce - Debounce rapidly changing values
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// useDebouncedCallback - Debounce a callback function
function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    ((...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );
}

// Usage:
function SearchInput() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      searchAPI(debouncedQuery);
    }
  }, [debouncedQuery]);

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

```typescript
// useIntersectionObserver - Detect element visibility
interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

function useIntersectionObserver(
  elementRef: RefObject<Element>,
  {
    threshold = 0,
    root = null,
    rootMargin = "0%",
    freezeOnceVisible = false,
  }: UseIntersectionObserverOptions = {}
): IntersectionObserverEntry | undefined {
  const [entry, setEntry] = useState<IntersectionObserverEntry>();
  const frozen = entry?.isIntersecting && freezeOnceVisible;

  useEffect(() => {
    const element = elementRef.current;
    if (!element || frozen) return;

    const observer = new IntersectionObserver(
      ([entry]) => setEntry(entry),
      { threshold, root, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [elementRef, threshold, root, rootMargin, frozen]);

  return entry;
}

// Usage - Lazy load images
function LazyImage({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const entry = useIntersectionObserver(ref, { freezeOnceVisible: true });
  const isVisible = !!entry?.isIntersecting;

  return (
    <div ref={ref} className="aspect-video bg-gray-100">
      {isVisible ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full animate-pulse bg-gray-200" />
      )}
    </div>
  );
}
```

```typescript
// useMediaQuery - Respond to CSS media queries
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);

    setMatches(mediaQuery.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

// Predefined breakpoint hooks
function useIsMobile() {
  return useMediaQuery("(max-width: 639px)");
}

function useIsTablet() {
  return useMediaQuery("(min-width: 640px) and (max-width: 1023px)");
}

function useIsDesktop() {
  return useMediaQuery("(min-width: 1024px)");
}

function usePrefersDarkMode() {
  return useMediaQuery("(prefers-color-scheme: dark)");
}

// Usage:
function ResponsiveNav() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileNav /> : <DesktopNav />;
}
```

```typescript
// useAsync - Handle async operations with loading/error states
interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

type AsyncAction<T> =
  | { type: "loading" }
  | { type: "success"; payload: T }
  | { type: "error"; payload: Error };

function asyncReducer<T>(state: AsyncState<T>, action: AsyncAction<T>): AsyncState<T> {
  switch (action.type) {
    case "loading":
      return { ...state, loading: true, error: null };
    case "success":
      return { data: action.payload, loading: false, error: null };
    case "error":
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

function useAsync<T>(
  asyncFunction: () => Promise<T>,
  dependencies: unknown[] = []
): AsyncState<T> & { execute: () => Promise<void> } {
  const [state, dispatch] = useReducer(asyncReducer<T>, {
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async () => {
    dispatch({ type: "loading" });
    try {
      const data = await asyncFunction();
      dispatch({ type: "success", payload: data });
    } catch (error) {
      dispatch({ type: "error", payload: error instanceof Error ? error : new Error(String(error)) });
    }
  }, dependencies);

  useEffect(() => {
    execute();
  }, [execute]);

  return { ...state, execute };
}

// Usage:
function UserList() {
  const { data: users, loading, error, execute: refetch } = useAsync(
    () => fetch("/api/users").then((r) => r.json()),
    []
  );

  if (loading) return <Spinner />;
  if (error) return <ErrorDisplay error={error} onRetry={refetch} />;
  return <ul>{users?.map((user) => <UserItem key={user.id} user={user} />)}</ul>;
}
```

**Gotchas:**
- Hooks must be called at the top level - never inside conditions, loops, or nested functions
- Custom hooks should handle cleanup to prevent memory leaks
- Be careful with stale closures - use refs for values that change but should not trigger re-renders
- Always include all dependencies in useEffect/useCallback/useMemo dependency arrays

### 3. Optimize with useMemo/useCallback

Prevent unnecessary re-renders and expensive computations with React memoization hooks.

**Best Practices:**
- Profile before optimizing - premature optimization wastes time
- Use React.memo for components that render often with same props
- useMemo for expensive calculations, useCallback for stable function references
- Keep dependency arrays accurate and minimal
- Consider moving expensive operations to web workers

**Common Patterns:**

```typescript
// React.memo - Prevent re-renders when props unchanged
interface UserCardProps {
  user: User;
  onSelect: (id: string) => void;
}

const UserCard = memo(function UserCard({ user, onSelect }: UserCardProps) {
  console.log("UserCard render:", user.id);

  return (
    <div
      className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
      onClick={() => onSelect(user.id)}
    >
      <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full" />
      <h3 className="font-medium">{user.name}</h3>
      <p className="text-sm text-gray-500">{user.email}</p>
    </div>
  );
});

// Custom comparison function for complex props
const ExpensiveChart = memo(
  function ExpensiveChart({ data, config }: ChartProps) {
    return <canvas ref={renderChart} />;
  },
  (prevProps, nextProps) => {
    return (
      prevProps.data.length === nextProps.data.length &&
      prevProps.config.type === nextProps.config.type
    );
  }
);
```

```typescript
// useMemo - Memoize expensive computations
interface DataTableProps {
  data: Transaction[];
  sortColumn: string;
  sortDirection: "asc" | "desc";
  filterText: string;
}

function DataTable({ data, sortColumn, sortDirection, filterText }: DataTableProps) {
  const processedData = useMemo(() => {
    console.log("Processing data...");

    let result = data;
    if (filterText) {
      const lowerFilter = filterText.toLowerCase();
      result = data.filter(
        (item) =>
          item.description.toLowerCase().includes(lowerFilter) ||
          item.category.toLowerCase().includes(lowerFilter)
      );
    }

    result = [...result].sort((a, b) => {
      const aVal = a[sortColumn as keyof Transaction];
      const bVal = b[sortColumn as keyof Transaction];
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [data, sortColumn, sortDirection, filterText]);

  const stats = useMemo(() => {
    return {
      total: processedData.reduce((sum, t) => sum + t.amount, 0),
      average: processedData.length > 0
        ? processedData.reduce((sum, t) => sum + t.amount, 0) / processedData.length
        : 0,
      count: processedData.length,
    };
  }, [processedData]);

  return (
    <div>
      <StatsBar stats={stats} />
      <table>
        <tbody>
          {processedData.map((row) => (
            <TableRow key={row.id} data={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

```typescript
// useCallback - Stable function references for child components
function ParentComponent() {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleUpdate = useCallback((id: string, updates: Partial<Item>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  const handlers = useMemo(
    () => ({
      onSelect: handleSelect,
      onDelete: handleDelete,
      onUpdate: handleUpdate,
    }),
    [handleSelect, handleDelete, handleUpdate]
  );

  return (
    <div>
      <ItemList items={items} handlers={handlers} selectedId={selectedId} />
    </div>
  );
}

const ItemList = memo(function ItemList({
  items,
  handlers,
  selectedId,
}: ItemListProps) {
  return (
    <ul>
      {items.map((item) => (
        <ItemRow
          key={item.id}
          item={item}
          isSelected={item.id === selectedId}
          {...handlers}
        />
      ))}
    </ul>
  );
});
```

**Gotchas:**
- useMemo/useCallback are not free - they have overhead, only use when needed
- Missing dependencies cause stale data bugs, extra dependencies cause unnecessary recalculations
- Primitive values do not need useMemo - only objects, arrays, and functions
- React.memo only does shallow comparison - deep objects need custom comparator

### 4. Handle Context and State Management

Choose the right state management approach for each use case.

**Best Practices:**
- Start with local state (useState), lift up only when necessary
- Use Context for truly global state (theme, auth, locale)
- Consider URL state for shareable/bookmarkable state
- Use external libraries (Zustand, Jotai) for complex global state
- Split contexts by update frequency to prevent re-renders

**Common Patterns:**

```typescript
// useReducer for complex state logic
interface FormState {
  values: Record<string, string>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

type FormAction =
  | { type: "SET_VALUE"; field: string; value: string }
  | { type: "SET_ERROR"; field: string; error: string }
  | { type: "SET_TOUCHED"; field: string }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS" }
  | { type: "SUBMIT_ERROR"; errors: Record<string, string> }
  | { type: "RESET" };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_VALUE":
      return {
        ...state,
        values: { ...state.values, [action.field]: action.value },
        errors: { ...state.errors, [action.field]: "" },
      };
    case "SET_ERROR":
      return {
        ...state,
        errors: { ...state.errors, [action.field]: action.error },
        isValid: false,
      };
    case "SET_TOUCHED":
      return {
        ...state,
        touched: { ...state.touched, [action.field]: true },
      };
    case "SUBMIT_START":
      return { ...state, isSubmitting: true };
    case "SUBMIT_SUCCESS":
      return { ...state, isSubmitting: false };
    case "SUBMIT_ERROR":
      return {
        ...state,
        isSubmitting: false,
        errors: action.errors,
        isValid: false,
      };
    case "RESET":
      return initialFormState;
    default:
      return state;
  }
}
```

```typescript
// Split Context Pattern - Separate frequently changing state
const UserContext = createContext<User | null>(null);

interface UIState {
  sidebarOpen: boolean;
  modalOpen: string | null;
  toasts: Toast[];
}

const UIStateContext = createContext<UIState | null>(null);
const UIActionsContext = createContext<UIActions | null>(null);

function UIProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<UIState>({
    sidebarOpen: true,
    modalOpen: null,
    toasts: [],
  });

  const actions = useMemo(
    () => ({
      toggleSidebar: () => setState((s) => ({ ...s, sidebarOpen: !s.sidebarOpen })),
      openModal: (id: string) => setState((s) => ({ ...s, modalOpen: id })),
      closeModal: () => setState((s) => ({ ...s, modalOpen: null })),
      addToast: (toast: Toast) =>
        setState((s) => ({ ...s, toasts: [...s.toasts, toast] })),
      removeToast: (id: string) =>
        setState((s) => ({
          ...s,
          toasts: s.toasts.filter((t) => t.id !== id),
        })),
    }),
    []
  );

  return (
    <UIStateContext.Provider value={state}>
      <UIActionsContext.Provider value={actions}>{children}</UIActionsContext.Provider>
    </UIStateContext.Provider>
  );
}

function SidebarToggle() {
  const actions = useContext(UIActionsContext);
  return <button onClick={actions?.toggleSidebar}>Toggle</button>;
}

function Sidebar() {
  const state = useContext(UIStateContext);
  if (!state?.sidebarOpen) return null;
  return <aside>Sidebar content</aside>;
}
```

```typescript
// URL State for shareable state
import { useSearchParams } from "next/navigation";

function useURLState<T extends string>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const value = (searchParams.get(key) as T) || defaultValue;

  const setValue = useCallback(
    (newValue: T) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newValue === defaultValue) {
        params.delete(key);
      } else {
        params.set(key, newValue);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname, key, defaultValue]
  );

  return [value, setValue];
}

// Usage:
function ProductFilters() {
  const [category, setCategory] = useURLState("category", "all");
  const [sort, setSort] = useURLState("sort", "newest");

  return (
    <div className="flex gap-4">
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="all">All Categories</option>
        <option value="electronics">Electronics</option>
        <option value="clothing">Clothing</option>
      </select>
      <select value={sort} onChange={(e) => setSort(e.target.value)}>
        <option value="newest">Newest</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
      </select>
    </div>
  );
}
```

**Gotchas:**
- Context re-renders all consumers when value changes - split contexts by update frequency
- useReducer dispatch is stable but state is not - memoize selectors if needed
- URL state has serialization limits - keep it simple (strings, numbers)
- Avoid putting rapidly changing values in Context

### 5. Build with React 18+ Features

Leverage the latest React features for better performance and user experience.

**Best Practices:**
- Use Suspense for data fetching with React Query or Next.js
- Use useTransition for non-urgent updates that can be interrupted
- Use useDeferredValue for expensive renders that can lag behind
- Use useId for accessible, SSR-safe unique IDs
- Leverage automatic batching for fewer re-renders

**Common Patterns:**

```typescript
// Suspense with data fetching (using React Query)
import { Suspense } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";

function UserProfile({ userId }: { userId: string }) {
  const { data: user } = useSuspenseQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUser(userId),
  });

  return (
    <div className="p-6">
      <img src={user.avatar} alt={user.name} className="w-24 h-24 rounded-full" />
      <h1 className="text-2xl font-bold mt-4">{user.name}</h1>
      <p className="text-gray-600">{user.bio}</p>
    </div>
  );
}

function ProfilePage({ userId }: { userId: string }) {
  return (
    <ErrorBoundary fallback={<ErrorMessage />}>
      <Suspense fallback={<ProfileSkeleton />}>
        <UserProfile userId={userId} />
      </Suspense>
    </ErrorBoundary>
  );
}

function Dashboard() {
  return (
    <div className="grid grid-cols-3 gap-6">
      <Suspense fallback={<CardSkeleton />}>
        <RevenueCard />
      </Suspense>
      <Suspense fallback={<CardSkeleton />}>
        <UsersCard />
      </Suspense>
      <Suspense fallback={<CardSkeleton />}>
        <OrdersCard />
      </Suspense>
    </div>
  );
}
```

```typescript
// useTransition for non-urgent updates
function TabContainer() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isPending, startTransition] = useTransition();

  const handleTabChange = (tab: string) => {
    startTransition(() => {
      setActiveTab(tab);
    });
  };

  return (
    <div>
      <div className="flex gap-2 border-b">
        {["overview", "analytics", "reports", "settings"].map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={cn(
              "px-4 py-2 capitalize",
              activeTab === tab && "border-b-2 border-blue-500"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={cn("py-4", isPending && "opacity-50")}>
        {activeTab === "overview" && <OverviewPanel />}
        {activeTab === "analytics" && <AnalyticsPanel />}
        {activeTab === "reports" && <ReportsPanel />}
        {activeTab === "settings" && <SettingsPanel />}
      </div>
    </div>
  );
}
```

```typescript
// useDeferredValue for expensive child renders
function SlowList({ text }: { text: string }) {
  const deferredText = useDeferredValue(text);
  const isStale = text !== deferredText;

  const items = useMemo(() => {
    const result = [];
    for (let i = 0; i < 10000; i++) {
      if (deferredText && !`Item ${i}`.includes(deferredText)) continue;
      result.push(<SlowItem key={i} text={`Item ${i}`} />);
    }
    return result;
  }, [deferredText]);

  return (
    <ul className={cn("space-y-1", isStale && "opacity-50 transition-opacity")}>
      {items}
    </ul>
  );
}

function SearchApp() {
  const [query, setQuery] = useState("");

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filter items..."
        className="mb-4 w-full px-4 py-2 border rounded"
      />
      <SlowList text={query} />
    </div>
  );
}
```

```typescript
// useId for accessible, SSR-safe unique IDs
function FormField({
  label,
  type = "text",
  error,
  ...props
}: {
  label: string;
  type?: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={!!error}
        className={cn(
          "w-full px-3 py-2 border rounded-md",
          error ? "border-red-500" : "border-gray-300"
        )}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
```

**Gotchas:**
- Suspense requires data fetching libraries that support it (React Query, Relay, Next.js)
- useTransition should wrap slow state updates, not fast ones
- useDeferredValue creates a "lag" - do not use for critical UI updates
- useId generates different IDs on server vs client in development (intentional)

### 6. Server Components vs Client Components

Understand the mental model for choosing between Server and Client Components in Next.js App Router.

**Best Practices:**
- Default to Server Components - they have zero JS bundle cost
- Use Client Components only when you need interactivity, hooks, or browser APIs
- Keep Client Components as leaf nodes - push them down the tree
- Pass Server Component data to Client Components as props
- Use composition to mix Server and Client Components

**Common Patterns:**

```typescript
// Server Component - Default in App Router
// app/products/page.tsx
import { ProductGrid } from "@/components/product-grid";
import { Filters } from "@/components/filters";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string; sort?: string };
}) {
  const products = await db.product.findMany({
    where: { category: searchParams.category },
    orderBy: { [searchParams.sort || "createdAt"]: "desc" },
  });

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Products</h1>
      <div className="grid grid-cols-4 gap-8">
        <aside>
          <Filters />
        </aside>
        <main className="col-span-3">
          <ProductGrid products={products} />
        </main>
      </div>
    </div>
  );
}
```

```typescript
// Client Component - Opt-in with 'use client'
// components/filters.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function Filters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Category</label>
        <select
          value={searchParams.get("category") || ""}
          onChange={(e) => updateFilter("category", e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">All</option>
          <option value="electronics">Electronics</option>
          <option value="clothing">Clothing</option>
        </select>
      </div>
    </div>
  );
}
```

```typescript
// Server Actions for mutations
// app/products/[id]/page.tsx
import { revalidatePath } from "next/cache";
import { AddToCartButton } from "./add-to-cart-button";

async function addToCart(productId: string) {
  "use server";

  const session = await getSession();
  if (!session) throw new Error("Not authenticated");

  await db.cartItem.upsert({
    where: { cartId_productId: { cartId: session.cartId, productId } },
    update: { quantity: { increment: 1 } },
    create: { cartId: session.cartId, productId, quantity: 1 },
  });

  revalidatePath("/cart");
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await db.product.findUnique({ where: { id: params.id } });

  if (!product) notFound();

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p className="text-2xl font-bold">${product.price}</p>
      <AddToCartButton productId={product.id} addToCart={addToCart} />
    </div>
  );
}

// add-to-cart-button.tsx (Client Component)
"use client";

import { useTransition } from "react";

interface AddToCartButtonProps {
  productId: string;
  addToCart: (productId: string) => Promise<void>;
}

export function AddToCartButton({ productId, addToCart }: AddToCartButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      await addToCart(productId);
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
    >
      {isPending ? "Adding..." : "Add to Cart"}
    </button>
  );
}
```

**Gotchas:**
- You cannot import a Server Component into a Client Component
- You can pass Server Components as children/props to Client Components
- Server Components cannot use hooks, event handlers, or browser APIs
- Client Component boundaries create a "client subtree" - all children are also client
- Server Actions can be called from Client Components but run on the server

## Real-World Examples

### Example 1: Virtual Data Table with Sorting and Selection

```typescript
"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronUp, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Column<T> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  width?: number;
}

interface DataTableProps<T extends { id: string }> {
  data: T[];
  columns: Column<T>[];
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
  rowHeight?: number;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  selectable = false,
  onSelectionChange,
  rowHeight = 48,
}: DataTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [sortConfig, setSortConfig] = useState<{
    column: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    const column = columns.find((c) => c.id === sortConfig.column);
    if (!column) return data;

    return [...data].sort((a, b) => {
      const accessor = column.accessor;
      const aVal = typeof accessor === "function" ? accessor(a) : a[accessor];
      const bVal = typeof accessor === "function" ? accessor(b) : b[accessor];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : 1;
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [data, sortConfig, columns]);

  const virtualizer = useVirtualizer({
    count: sortedData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  });

  const handleSort = useCallback((columnId: string) => {
    setSortConfig((prev) => {
      if (prev?.column !== columnId) {
        return { column: columnId, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { column: columnId, direction: "desc" };
      }
      return null;
    });
  }, []);

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        onSelectionChange?.(Array.from(next));
        return next;
      });
    },
    [onSelectionChange]
  );

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex bg-gray-50 border-b font-medium text-sm text-gray-700">
        {selectable && (
          <div className="w-12 flex items-center justify-center border-r">
            <input type="checkbox" />
          </div>
        )}
        {columns.map((column) => (
          <div
            key={column.id}
            className={cn(
              "px-4 py-3 flex items-center gap-2",
              column.sortable && "cursor-pointer hover:bg-gray-100"
            )}
            style={{ width: column.width || 150, flexShrink: 0 }}
            onClick={() => column.sortable && handleSort(column.id)}
          >
            {column.header}
            {column.sortable && sortConfig?.column === column.id && (
              sortConfig.direction === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />
            )}
          </div>
        ))}
      </div>

      <div ref={parentRef} className="h-[500px] overflow-auto">
        <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = sortedData[virtualRow.index];
            const isSelected = selectedIds.has(row.id);

            return (
              <div
                key={row.id}
                className={cn(
                  "flex absolute left-0 right-0 border-b text-sm",
                  isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                )}
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {selectable && (
                  <div className="w-12 flex items-center justify-center border-r">
                    <button onClick={() => handleSelect(row.id)}>
                      {isSelected && <Check size={14} />}
                    </button>
                  </div>
                )}
                {columns.map((column) => (
                  <div
                    key={column.id}
                    className="px-4 py-3 truncate"
                    style={{ width: column.width || 150, flexShrink: 0 }}
                  >
                    {typeof column.accessor === "function"
                      ? column.accessor(row)
                      : row[column.accessor]}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-2 bg-gray-50 border-t text-sm text-gray-600">
        {selectable && selectedIds.size > 0 && (
          <span className="mr-4">{selectedIds.size} selected</span>
        )}
        {sortedData.length} total rows
      </div>
    </div>
  );
}
```

### Example 2: Optimistic Updates with useOptimistic

```typescript
"use client";

import { useOptimistic, useTransition, useRef } from "react";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  content: string;
  author: { name: string; avatar: string };
  createdAt: Date;
  pending?: boolean;
}

interface CommentListProps {
  initialComments: Comment[];
  postId: string;
  currentUser: { name: string; avatar: string };
  addComment: (postId: string, content: string) => Promise<Comment>;
}

export function CommentList({
  initialComments,
  postId,
  currentUser,
  addComment,
}: CommentListProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  const [optimisticComments, addOptimisticComment] = useOptimistic(
    initialComments,
    (state, newComment: Comment) => [...state, newComment]
  );

  const handleSubmit = async (formData: FormData) => {
    const content = formData.get("content") as string;
    if (!content.trim()) return;

    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      content,
      author: currentUser,
      createdAt: new Date(),
      pending: true,
    };

    formRef.current?.reset();

    startTransition(async () => {
      addOptimisticComment(optimisticComment);
      try {
        await addComment(postId, content);
      } catch (error) {
        console.error("Failed to add comment:", error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <form ref={formRef} action={handleSubmit} className="flex gap-4">
        <img
          src={currentUser.avatar}
          alt={currentUser.name}
          className="w-10 h-10 rounded-full"
        />
        <div className="flex-1">
          <textarea
            name="content"
            placeholder="Add a comment..."
            className="w-full px-4 py-2 border rounded-lg resize-none"
            rows={3}
          />
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
            >
              {isPending ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </div>
      </form>

      <div className="space-y-4">
        {optimisticComments.map((comment) => (
          <div
            key={comment.id}
            className={cn(
              "flex gap-4 p-4 rounded-lg",
              comment.pending ? "bg-blue-50 opacity-70" : "bg-gray-50"
            )}
          >
            <img
              src={comment.author.avatar}
              alt={comment.author.name}
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{comment.author.name}</span>
                <span className="text-sm text-gray-500">
                  {comment.pending
                    ? "Posting..."
                    : formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                </span>
              </div>
              <p className="mt-1 text-gray-700">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Example 3: Infinite Scroll with React Query

```typescript
"use client";

import { useRef, useCallback, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ProductCard } from "./product-card";
import { Spinner } from "./ui/spinner";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface ProductsResponse {
  products: Product[];
  nextCursor: string | null;
  total: number;
}

async function fetchProducts(cursor?: string): Promise<ProductsResponse> {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  params.set("limit", "12");

  const response = await fetch(`/api/products?${params}`);
  if (!response.ok) throw new Error("Failed to fetch products");
  return response.json();
}

export function InfiniteProductGrid() {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ["products"],
    queryFn: ({ pageParam }) => fetchProducts(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: "100px",
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error.message}</p>
        <button
          onClick={() => fetchNextPage()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  const allProducts = data?.pages.flatMap((page) => page.products) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  return (
    <div>
      <p className="mb-4 text-sm text-gray-600">
        Showing {allProducts.length} of {total} products
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {allProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div ref={loadMoreRef} className="py-8 flex justify-center">
        {isFetchingNextPage ? (
          <Spinner />
        ) : hasNextPage ? (
          <button
            onClick={() => fetchNextPage()}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50"
          >
            Load More
          </button>
        ) : (
          <p className="text-gray-500">No more products</p>
        )}
      </div>
    </div>
  );
}
```

## Related Skills

- `nextjs-app-router-mastery` - Server Components, App Router, Server Actions
- `tailwind-ui-designer` - Styling React components with Tailwind CSS
- `typescript-expert` - Advanced TypeScript patterns for React
- `react-query-expert` - Data fetching and caching with TanStack Query
- `zustand-state-management` - Simple global state with Zustand
- `framer-motion-animations` - Animations and transitions in React

## Further Reading

- [React Documentation](https://react.dev) - Official React docs
- [Next.js Documentation](https://nextjs.org/docs) - App Router and Server Components
- [Patterns.dev](https://patterns.dev) - React design patterns
- [Kent C. Dodds Blog](https://kentcdodds.com/blog) - Advanced React patterns
- [TanStack Query](https://tanstack.com/query) - Data fetching library
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app) - TypeScript patterns

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
*Comprehensive React expertise for production applications*
'''

    filepath = os.path.join(SKILLS_DIR, 'react-expert.md')
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    # Count lines
    line_count = content.count('\n') + 1
    print(f"react-expert.md: {line_count} lines")
    return line_count

if __name__ == "__main__":
    write_react_expert()
