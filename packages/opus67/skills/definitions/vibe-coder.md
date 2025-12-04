# Vibe Coder

> **ID:** `vibe-coder`
> **Tier:** 1
> **Token Cost:** 10000
> **MCP Connections:** context7, supabase

## What This Skill Does

Rapid prototype from idea to working app. Ship fast with smart defaults, minimal boilerplate, and copy-paste friendly patterns. Embrace the "just make it work" mentality with modern stack best practices.

- Rapid prototype from idea to working app
- Ship fast with minimal boilerplate
- Smart defaults over configuration
- Copy-paste friendly code patterns
- Quick wins and instant gratification
- Just-make-it-work mentality
- Iterate fast, refactor later
- Modern stack best practices baked in

## When to Use

This skill is automatically loaded when:

- **Keywords:** vibe, quick, fast, prototype, ship, build, create, make, start, new, mvp
- **File Types:** Any
- **Directories:** Any new project

## Core Philosophy

**The Vibe Coder Way:**
1. Working > Perfect
2. Ship > Plan
3. Iterate > Architect
4. Copy-paste > Abstract
5. Smart defaults > Configuration
6. Momentum > Perfection

## Core Capabilities

### 1. Instant Project Bootstrap

Get from zero to running app in minutes.

**The Ultimate Starter:**

```bash
# Create Next.js app with everything you need
pnpm create next-app@latest my-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

cd my-app

# Add the essentials
pnpm add @tanstack/react-query zod react-hook-form @hookform/resolvers lucide-react class-variance-authority clsx tailwind-merge

# Dev tools
pnpm add -D prettier prettier-plugin-tailwindcss
```

**Instant Utils Setup:**

```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + '...' : str;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
```

**Copy-Paste Tailwind Config:**

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

**Best Practices:**
- Use the create-next-app defaults
- Add utilities you always need upfront
- Set up consistent styling immediately
- Configure prettier to format on save
- Use path aliases from the start

**Gotchas:**
- Don't over-engineer at the start
- Don't add dependencies you might need
- Don't configure what you won't customize
- Don't worry about folder structure yet

### 2. Quick Component Patterns

Copy-paste ready components.

**The Button You Always Need:**

```typescript
// src/components/ui/button.tsx
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
```

**The Input That Just Works:**

```typescript
// src/components/ui/input.tsx
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
```

**The Card for Everything:**

```typescript
// src/components/ui/card.tsx
import { cn } from '@/lib/utils';

function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />;
}

function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-2xl font-semibold leading-none tracking-tight', className)} {...props} />;
}

function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}

function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center p-6 pt-0', className)} {...props} />;
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
```

**Best Practices:**
- Copy the whole component, not pieces
- Use consistent patterns across components
- Keep variants simple and practical
- Add loading states by default
- Forward refs always

**Gotchas:**
- Don't abstract too early
- Don't add variants you won't use
- Don't forget accessibility basics
- Don't overthink naming

### 3. Instant API Routes

Fast API development patterns.

**The API Route Template:**

```typescript
// src/app/api/items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema
const ItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
});

// GET all items
export async function GET() {
  try {
    // Replace with your data source
    const items = await db.items.findMany();
    return NextResponse.json(items);
  } catch (error) {
    console.error('GET /api/items error:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

// POST create item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = ItemSchema.parse(body);
    
    const item = await db.items.create({ data: validated });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('POST /api/items error:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
```

**Single Item Routes:**

```typescript
// src/app/api/items/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
});

interface Params {
  params: { id: string };
}

// GET single item
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const item = await db.items.findUnique({ where: { id: params.id } });
    
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    
    return NextResponse.json(item);
  } catch (error) {
    console.error(`GET /api/items/${params.id} error:`, error);
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
  }
}

// PATCH update item
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json();
    const validated = UpdateSchema.parse(body);
    
    const item = await db.items.update({
      where: { id: params.id },
      data: validated,
    });
    
    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error(`PATCH /api/items/${params.id} error:`, error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

// DELETE item
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await db.items.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`DELETE /api/items/${params.id} error:`, error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
```

**Best Practices:**
- Always validate with Zod
- Consistent error response format
- Log errors with context
- Return proper status codes
- Keep routes focused

**Gotchas:**
- request.json() can throw
- params is a Promise in newer Next.js
- Error responses need proper typing
- Don't forget try-catch

### 4. Quick Data Fetching

Fast data patterns with React Query.

**React Query Setup:**

```typescript
// src/lib/query-client.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

**Generic Fetch Hooks:**

```typescript
// src/hooks/use-api.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Generic fetch function
async function fetchAPI<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'API error');
  }
  return res.json();
}

// Generic mutation function
async function mutateAPI<T, D = unknown>(
  url: string,
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  data?: D
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: data ? { 'Content-Type': 'application/json' } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'API error');
  }
  if (res.status === 204) return null as T;
  return res.json();
}

// Example: Items hooks
interface Item {
  id: string;
  name: string;
  description?: string;
  price: number;
}

export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: () => fetchAPI<Item[]>('/api/items'),
  });
}

export function useItem(id: string) {
  return useQuery({
    queryKey: ['items', id],
    queryFn: () => fetchAPI<Item>(`/api/items/${id}`),
    enabled: !!id,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Item, 'id'>) =>
      mutateAPI<Item>('/api/items', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Item> & { id: string }) =>
      mutateAPI<Item>(`/api/items/${id}`, 'PATCH', data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['items', id] });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      mutateAPI<void>(`/api/items/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}
```

**Using the Hooks:**

```typescript
// src/app/items/page.tsx
'use client';

import { useItems, useCreateItem, useDeleteItem } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function ItemsPage() {
  const { data: items, isLoading, error } = useItems();
  const createItem = useCreateItem();
  const deleteItem = useDeleteItem();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Items</h1>
        <Button
          onClick={() => createItem.mutate({ name: 'New Item', price: 9.99 })}
          loading={createItem.isPending}
        >
          Add Item
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items?.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle>{item.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{item.description}</p>
              <p className="text-lg font-bold mt-2">${item.price}</p>
              <Button
                variant="destructive"
                size="sm"
                className="mt-4"
                onClick={() => deleteItem.mutate(item.id)}
                loading={deleteItem.isPending}
              >
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

**Best Practices:**
- Create reusable fetch utilities
- Invalidate queries after mutations
- Handle loading and error states
- Use optimistic updates for UX
- Keep query keys consistent

**Gotchas:**
- Don't forget QueryProvider in layout
- enabled: false prevents initial fetch
- staleTime vs cacheTime confusion
- Mutations don't retry by default

### 5. Quick Forms

Fast form patterns with React Hook Form.

**The Form Pattern:**

```typescript
// src/components/item-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.coerce.number().positive('Price must be positive'),
});

type FormData = z.infer<typeof formSchema>;

interface ItemFormProps {
  defaultValues?: Partial<FormData>;
  onSubmit: (data: FormData) => Promise<void>;
  submitText?: string;
}

export function ItemForm({ defaultValues, onSubmit, submitText = 'Submit' }: ItemFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      ...defaultValues,
    },
  });

  const onSubmitHandler = async (data: FormData) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Name</label>
        <Input {...register('name')} error={errors.name?.message} />
      </div>

      <div>
        <label className="text-sm font-medium">Description</label>
        <Input {...register('description')} error={errors.description?.message} />
      </div>

      <div>
        <label className="text-sm font-medium">Price</label>
        <Input type="number" step="0.01" {...register('price')} error={errors.price?.message} />
      </div>

      <Button type="submit" loading={isSubmitting}>
        {submitText}
      </Button>
    </form>
  );
}
```

**Best Practices:**
- Use Zod for validation
- Reset form on successful submit
- Show inline errors
- Disable submit while loading
- Make forms reusable with props

**Gotchas:**
- z.coerce for number inputs
- Don't forget to handle errors
- Form state resets on unmount
- Default values need proper typing

### 6. Quick Auth

Fast authentication setup.

**Simple Auth Context:**

```typescript
// src/lib/auth.tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Login failed');
    }

    const user = await res.json();
    setUser(user);
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

**Protected Route:**

```typescript
// src/components/protected-route.tsx
'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
```

**Best Practices:**
- Check session on mount
- Handle loading states
- Redirect unauthorized users
- Clear user state on logout
- Use HTTP-only cookies

**Gotchas:**
- Don't store tokens in localStorage
- Handle token refresh
- Server-side auth is different
- Session expiry needs handling

## Real-World Examples

### Example 1: Todo App in 5 Minutes

```typescript
// src/app/todos/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Check } from 'lucide-react';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');

  const addTodo = () => {
    if (!input.trim()) return;
    setTodos([...todos, { id: Date.now().toString(), text: input, completed: false }]);
    setInput('');
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((t) => t.id !== id));
  };

  return (
    <div className="container max-w-md py-8">
      <h1 className="text-3xl font-bold mb-6">Todos</h1>
      
      <div className="flex gap-2 mb-6">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTodo()}
          placeholder="What needs to be done?"
        />
        <Button onClick={addTodo}>Add</Button>
      </div>

      <div className="space-y-2">
        {todos.map((todo) => (
          <Card key={todo.id}>
            <CardContent className="flex items-center justify-between p-4">
              <span className={todo.completed ? 'line-through text-muted-foreground' : ''}>
                {todo.text}
              </span>
              <div className="flex gap-2">
                <Button size="icon" variant="ghost" onClick={() => toggleTodo(todo.id)}>
                  <Check className={todo.completed ? 'text-green-500' : ''} size={18} />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => deleteTodo(todo.id)}>
                  <Trash2 size={18} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {todos.length === 0 && (
        <p className="text-center text-muted-foreground">No todos yet. Add one above!</p>
      )}
    </div>
  );
}
```

### Example 2: Dashboard Layout in 5 Minutes

```typescript
// src/app/dashboard/layout.tsx
import Link from 'next/link';
import { Home, Settings, Users, BarChart } from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/dashboard/analytics', icon: BarChart, label: 'Analytics' },
  { href: '/dashboard/users', icon: Users, label: 'Users' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r bg-muted/40">
        <div className="p-6">
          <h2 className="text-lg font-semibold">Dashboard</h2>
        </div>
        <nav className="px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
```

## Related Skills

- **v0-style-generator** - Generate complete UI components
- **nextjs-expert** - Deep Next.js knowledge
- **tailwind-expert** - Advanced Tailwind patterns
- **react-query** - Data fetching mastery

## Further Reading

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [TanStack Query](https://tanstack.com/query)
- [React Hook Form](https://react-hook-form.com)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
