# Accessibility Expert

> **ID:** `a11y-expert`
> **Tier:** 3
> **Token Cost:** 5500
> **MCP Connections:** None

## What This Skill Does

Master web accessibility implementation following WCAG 2.1 guidelines. Build inclusive applications that work for all users regardless of ability, device, or assistive technology.

- WCAG 2.1 AA/AAA compliance implementation
- Screen reader optimization (NVDA, JAWS, VoiceOver)
- Keyboard navigation patterns
- ARIA attributes and live regions
- Focus management and focus traps
- Color contrast and visual accessibility
- Motion and animation preferences
- Form accessibility and error handling
- Testing with axe-core and Lighthouse

## When to Use

This skill is automatically loaded when:

- **Keywords:** accessibility, a11y, wcag, screen reader, aria, keyboard navigation
- **File Types:** N/A
- **Directories:** /components, /ui

## Core Capabilities

### 1. WCAG Compliance

Web Content Accessibility Guidelines (WCAG) 2.1 defines standards for accessible web content. Level AA is the recommended target for most applications.

**WCAG Principles (POUR):**

```typescript
// Perceivable - Information must be presentable to users
// Operable - Interface components must be operable
// Understandable - Information and UI operation must be understandable
// Robust - Content must be robust enough for various user agents

// Example: Perceivable - Text alternatives for images
function AccessibleImage({ src, alt, decorative }: {
  src: string;
  alt: string;
  decorative?: boolean;
}) {
  if (decorative) {
    // Empty alt for decorative images
    return <img src={src} alt="" role="presentation" />;
  }

  return <img src={src} alt={alt} />;
}

// Example: Operable - Keyboard accessible button
function AccessibleButton({ children, onClick }: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {children}
    </button>
  );
}
```

**Color Contrast Utilities:**

```typescript
// src/lib/a11y/contrast.ts
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);

  if (level === 'AAA') {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }
  // AA level
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) throw new Error('Invalid hex color');
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

export { getContrastRatio, meetsContrastRequirement };
```

**Best Practices:**
- Target WCAG 2.1 Level AA as minimum standard
- Use semantic HTML elements before ARIA attributes
- Ensure color contrast ratio of 4.5:1 for normal text, 3:1 for large text
- Provide text alternatives for all non-text content
- Make all functionality available from keyboard

**Gotchas:**
- ARIA can make things worse if used incorrectly - first rule of ARIA: don't use ARIA
- Color alone should never convey information
- Auto-playing media violates WCAG guidelines
- Time limits without user control fail Level A

### 2. Screen Reader Testing

Optimize content for screen readers like NVDA, JAWS, and VoiceOver.

**Screen Reader Announcements:**

```typescript
// src/lib/a11y/announcer.ts
class LiveAnnouncer {
  private container: HTMLElement | null = null;

  constructor() {
    if (typeof document !== 'undefined') {
      this.createContainer();
    }
  }

  private createContainer(): void {
    this.container = document.createElement('div');
    this.container.setAttribute('aria-live', 'polite');
    this.container.setAttribute('aria-atomic', 'true');
    this.container.className = 'sr-only';
    document.body.appendChild(this.container);
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.container) return;

    this.container.setAttribute('aria-live', priority);
    this.container.textContent = '';

    // Force reflow for screen reader to pick up change
    void this.container.offsetHeight;

    this.container.textContent = message;
  }

  announcePolite(message: string): void {
    this.announce(message, 'polite');
  }

  announceAssertive(message: string): void {
    this.announce(message, 'assertive');
  }
}

export const announcer = new LiveAnnouncer();
```

**React Hook for Announcements:**

```typescript
// src/hooks/useAnnounce.ts
import { useCallback } from 'react';
import { announcer } from '@/lib/a11y/announcer';

export function useAnnounce() {
  const announce = useCallback((message: string, priority?: 'polite' | 'assertive') => {
    announcer.announce(message, priority);
  }, []);

  const announcePolite = useCallback((message: string) => {
    announcer.announcePolite(message);
  }, []);

  const announceAssertive = useCallback((message: string) => {
    announcer.announceAssertive(message);
  }, []);

  return { announce, announcePolite, announceAssertive };
}

// Usage
function TodoList() {
  const { announcePolite } = useAnnounce();

  const addTodo = (title: string) => {
    // Add todo logic
    announcePolite(`Task ${title} added to list`);
  };

  const deleteTodo = (title: string) => {
    // Delete todo logic
    announcePolite(`Task ${title} removed from list`);
  };

  return (/* component */);
}
```

**Visually Hidden Utility (sr-only):**

```css
/* styles/a11y.css */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.sr-only-focusable:focus,
.sr-only-focusable:active {
  position: static;
  width: auto;
  height: auto;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

**Best Practices:**
- Use `aria-live` regions for dynamic content updates
- Provide skip links for repetitive navigation
- Ensure proper heading hierarchy (h1 -> h2 -> h3)
- Use descriptive link text, avoid 'click here'
- Test with actual screen readers, not just automated tools

**Gotchas:**
- Different screen readers behave differently
- `aria-hidden="true"` hides content from all assistive tech
- Changing `role` can break expected behavior
- Live regions may not announce if hidden when changed

### 3. Keyboard Navigation

Ensure all interactive elements are keyboard accessible.

**Focus Management:**

```typescript
// src/hooks/useFocusManagement.ts
import { useRef, useCallback, useEffect } from 'react';

export function useFocusTrap<T extends HTMLElement>() {
  const containerRef = useRef<T>(null);

  const trapFocus = useCallback((e: KeyboardEvent) => {
    if (!containerRef.current || e.key !== 'Tab') return;

    const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement?.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement?.focus();
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', trapFocus);
    return () => container.removeEventListener('keydown', trapFocus);
  }, [trapFocus]);

  return containerRef;
}

// Usage in Modal
function Modal({ isOpen, onClose, children }: ModalProps) {
  const modalRef = useFocusTrap<HTMLDivElement>();
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus first focusable element in modal
      const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    } else {
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {children}
    </div>
  );
}
```

**Roving Tab Index:**

```typescript
// src/hooks/useRovingTabIndex.ts
import { useState, useCallback, KeyboardEvent } from 'react';

export function useRovingTabIndex<T>(items: T[]) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      let newIndex = activeIndex;

      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          newIndex = (activeIndex + 1) % items.length;
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          newIndex = (activeIndex - 1 + items.length) % items.length;
          break;
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          newIndex = items.length - 1;
          break;
        default:
          return;
      }

      setActiveIndex(newIndex);
    },
    [activeIndex, items.length]
  );

  const getTabIndex = useCallback(
    (index: number) => (index === activeIndex ? 0 : -1),
    [activeIndex]
  );

  return { activeIndex, setActiveIndex, handleKeyDown, getTabIndex };
}

// Usage in Tab List
function TabList({ tabs }: { tabs: { id: string; label: string }[] }) {
  const { activeIndex, setActiveIndex, handleKeyDown, getTabIndex } = useRovingTabIndex(tabs);

  return (
    <div role="tablist" onKeyDown={handleKeyDown}>
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          role="tab"
          id={`tab-${tab.id}`}
          aria-selected={index === activeIndex}
          aria-controls={`panel-${tab.id}`}
          tabIndex={getTabIndex(index)}
          onClick={() => setActiveIndex(index)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

**Skip Link Component:**

```typescript
// src/components/skip-link.tsx
export function SkipLink({ href = '#main-content', children = 'Skip to main content' }) {
  return (
    <a
      href={href}
      className="sr-only-focusable absolute top-4 left-4 z-50 bg-background px-4 py-2 border rounded-md focus:not-sr-only"
    >
      {children}
    </a>
  );
}

// Usage in layout
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SkipLink />
      <Header />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </>
  );
}
```

**Best Practices:**
- Visible focus indicator with 2:1 contrast ratio
- Tab order follows visual reading order
- Interactive elements reachable via Tab key
- Custom widgets follow WAI-ARIA patterns
- Escape key closes modals and dropdowns

**Gotchas:**
- `tabindex > 0` disrupts natural tab order - avoid it
- Removing focus outline breaks keyboard navigation
- Focus traps must allow escape for modals
- Browser defaults are often better than custom implementations

### 4. ARIA Attributes

Use ARIA attributes correctly to enhance accessibility.

**Common ARIA Patterns:**

```typescript
// Accordion
function Accordion({ items }: { items: { id: string; title: string; content: string }[] }) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      {items.map((item) => {
        const isExpanded = expandedIds.has(item.id);
        return (
          <div key={item.id}>
            <h3>
              <button
                aria-expanded={isExpanded}
                aria-controls={`panel-${item.id}`}
                id={`header-${item.id}`}
                onClick={() => toggleItem(item.id)}
              >
                {item.title}
              </button>
            </h3>
            <div
              id={`panel-${item.id}`}
              role="region"
              aria-labelledby={`header-${item.id}`}
              hidden={!isExpanded}
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Combobox (Autocomplete)
function Combobox({ options, onSelect }: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const listboxId = useId();

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div>
      <input
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={activeIndex >= 0 ? `option-${activeIndex}` : undefined}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onFocus={() => setIsOpen(true)}
      />
      {isOpen && (
        <ul id={listboxId} role="listbox">
          {filteredOptions.map((option, index) => (
            <li
              key={option.value}
              id={`option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              onClick={() => onSelect(option)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Progress indicator
function ProgressBar({ value, max = 100, label }: ProgressProps) {
  const percentage = Math.round((value / max) * 100);

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
    >
      <div style={{ width: `${percentage}%` }} />
      <span className="sr-only">{percentage}% complete</span>
    </div>
  );
}
```

**Form Accessibility:**

```typescript
// src/components/accessible-form.tsx
function AccessibleInput({ label, error, hint, required, ...props }: InputProps) {
  const inputId = useId();
  const errorId = useId();
  const hintId = useId();

  const ariaDescribedBy = [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div>
      <label htmlFor={inputId}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
        {required && <span className="sr-only"> (required)</span>}
      </label>

      {hint && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}

      <input
        id={inputId}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={ariaDescribedBy}
        {...props}
      />

      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

// Form with live validation feedback
function AccessibleForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { announceAssertive } = useAnnounce();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const errorCount = Object.keys(newErrors).length;
      announceAssertive(`Form has ${errorCount} error${errorCount > 1 ? 's' : ''}. Please correct and try again.`);

      // Focus first error field
      const firstErrorField = document.querySelector('[aria-invalid="true"]') as HTMLElement;
      firstErrorField?.focus();
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-describedby="form-instructions">
      <p id="form-instructions" className="sr-only">
        Required fields are marked with an asterisk.
      </p>
      {/* Form fields */}
    </form>
  );
}
```

**Best Practices:**
- Use semantic HTML first, ARIA as enhancement
- Ensure ARIA attributes have valid values
- Test ARIA implementations with screen readers
- Keep ARIA labels concise and descriptive
- Use aria-describedby for additional context

**Gotchas:**
- Wrong ARIA is worse than no ARIA
- aria-label overrides visible text for screen readers
- Some ARIA roles change keyboard interaction expectations
- ARIA doesn't add functionality, only semantics

## Real-World Examples

### Example 1: Accessible Modal Dialog

```typescript
// src/components/modal.tsx
'use client';

import { useEffect, useRef, useId, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';

      // Focus close button
      const closeButton = modalRef.current?.querySelector('button');
      closeButton?.focus();
    } else {
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  // Focus trap
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !modalRef.current) return;

    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onKeyDown={handleKeyDown}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background p-6 rounded-lg shadow-lg z-50 max-w-md w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 hover:bg-muted rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div id={descId}>{children}</div>
      </div>
    </>,
    document.body
  );
}
```

### Example 2: Accessible Data Table

```typescript
// src/components/data-table.tsx
interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  caption: string;
}

export function DataTable<T extends { id: string }>({ data, columns, caption }: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(null);
  const { announcePolite } = useAnnounce();

  const handleSort = (key: keyof T) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    announcePolite(`Table sorted by ${String(key)}, ${direction}ending`);
  };

  const sortedData = sortConfig
    ? [...data].sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        const modifier = sortConfig.direction === 'asc' ? 1 : -1;
        return aVal < bVal ? -modifier : aVal > bVal ? modifier : 0;
      })
    : data;

  return (
    <table role="grid" aria-describedby="table-caption">
      <caption id="table-caption" className="sr-only">
        {caption}
      </caption>
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={String(col.key)}
              scope="col"
              aria-sort={
                sortConfig?.key === col.key
                  ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
                  : undefined
              }
            >
              {col.sortable ? (
                <button onClick={() => handleSort(col.key)}>
                  {col.header}
                  <span className="sr-only">
                    {sortConfig?.key === col.key
                      ? `, sorted ${sortConfig.direction}ending`
                      : ', click to sort'}
                  </span>
                </button>
              ) : (
                col.header
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sortedData.map((row) => (
          <tr key={row.id}>
            {columns.map((col) => (
              <td key={String(col.key)}>{String(row[col.key])}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Related Skills

- **react-advanced** - Accessible React patterns
- **nextjs-expert** - Next.js accessibility features
- **design-system-architect** - Building accessible design systems
- **testing-expert** - Accessibility testing automation

## Further Reading

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [Inclusive Components](https://inclusive-components.design/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [axe-core Testing Library](https://github.com/dequelabs/axe-core)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
