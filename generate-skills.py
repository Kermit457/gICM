#!/usr/bin/env python3
"""Generate comprehensive skill files for OPUS 67"""

import os

SKILLS_DIR = "C:/Users/mirko/OneDrive/Desktop/gICM/packages/opus67/skills/definitions"

# Define comprehensive skill content
SKILLS = {
    "i18n-expert.md": """# Internationalization Expert

> **ID:** `i18n-expert`
> **Tier:** 3
> **Token Cost:** 5000
> **MCP Connections:** context7

## 🎯 What This Skill Does

Master internationalization (i18n) implementation for web applications with i18next, react-i18next, next-i18next, and modern translation management systems. Build multilingual applications with proper locale handling, RTL support, and culture-aware formatting.

- Complete i18next and react-i18next setup
- Translation file management and best practices
- RTL (Right-to-Left) language support
- Date, number, and currency formatting
- Dynamic locale switching
- Translation key extraction and management
- Pluralization and gender handling
- Translation service integration (Crowdin, Lokalise, Phrase)

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** i18n, internationalization, translation, localization, i18next, locale, multilingual, rtl
- **File Types:** `.json` (locale files), `i18n.ts`, `i18n.config.ts`
- **Directories:** `/locales`, `/translations`, `/i18n`, `/lang`

## 🚀 Core Capabilities

### 1. i18next Setup (React & Next.js)

**React Application Setup:**

```typescript
// src/i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: ['en', 'es', 'fr', 'de', 'ja', 'ar'],
    fallbackLng: 'en',
    ns: ['common', 'auth', 'dashboard', 'errors'],
    defaultNS: 'common',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator'],
      caches: ['localStorage', 'cookie'],
    },
    react: {
      useSuspense: true,
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

**Next.js Setup:**

```typescript
// app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

**Best Practices:**
- Use namespaces to organize translations by feature
- Enable lazy loading for large translation files
- Implement proper fallback chains
- Cache translations for performance
- Use TypeScript for type-safe translations

**Gotchas:**
- Always set `escapeValue: false` in React
- Use Suspense boundary when `useSuspense: true`
- Backend path must match file structure exactly
- Language detector order matters for UX

### 2. Translation Management

**Structured Translation Files:**

```json
// public/locales/en/common.json
{
  "nav": {
    "home": "Home",
    "about": "About",
    "contact": "Contact"
  },
  "actions": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete"
  }
}
```

**Type-Safe Translations:**

```typescript
import { useTranslation as useTranslationBase } from 'react-i18next';
import type en from '../../public/locales/en/common.json';

export type TranslationKeys = typeof en;

export function useTranslation(ns?: string | string[]) {
  return useTranslationBase<TranslationKeys>(ns);
}
```

**Best Practices:**
- Organize by feature/namespace, not by language
- Use nested keys for logical grouping
- Keep keys semantic
- Version translation files

**Gotchas:**
- Avoid dynamic key generation
- Don't store HTML in translations
- JSON files must be valid

### 3. RTL Support

```typescript
export function useDirection() {
  const { i18n } = useTranslation();
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  return rtlLanguages.includes(i18n.language) ? 'rtl' : 'ltr';
}
```

**Best Practices:**
- Use CSS logical properties (inline-start/end)
- Test with real RTL content
- Flip directional icons in RTL

**Gotchas:**
- Numbers remain LTR in RTL text
- Some CSS properties don't auto-flip

### 4. Date/number formatting

```typescript
export function useFormatters() {
  const { i18n } = useTranslation();
  const locale = i18n.language;

  return {
    formatDate(date: Date) {
      return new Intl.DateTimeFormat(locale).format(date);
    },
    formatCurrency(amount: number, currency = 'USD') {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
      }).format(amount);
    },
  };
}
```

**Best Practices:**
- Use Intl API for all locale-sensitive formatting
- Use currency codes not symbols

**Gotchas:**
- Currency formatting varies widely
- Number separators differ by locale

## 💡 Real-World Examples

### Example 1: E-commerce Product Page

```typescript
export function ProductPage({ product }) {
  const { t } = useTranslation('products');
  const { formatCurrency } = useFormatters();

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{formatCurrency(product.price, product.currency)}</p>
      <p>{t('stockAvailable', { count: product.stock })}</p>
    </div>
  );
}
```

### Example 2: Multi-Language Dashboard

```typescript
export default function DashboardLayout({ children }) {
  const { t } = useTranslation('dashboard');
  const direction = useDirection();

  return (
    <div className="flex h-screen" dir={direction}>
      <aside className="w-64">
        <h1>{t('title')}</h1>
        <LanguageSwitcher />
      </aside>
      <main>{children}</main>
    </div>
  );
}
```

## 🔗 Related Skills

- **react-advanced** - Component patterns for i18n
- **nextjs-expert** - Next.js i18n routing
- **a11y-expert** - Accessibility for multilingual apps

## 📖 Further Reading

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Guide](https://react.i18next.com/)
- [RTL Styling Guide](https://rtlstyling.com/)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
""",

    "a11y-expert.md": """# Accessibility Expert

> **ID:** `a11y-expert`
> **Tier:** 3
> **Token Cost:** 5500
> **MCP Connections:** None

## 🎯 What This Skill Does

Master web accessibility (a11y) implementation with WCAG 2.1/2.2 compliance, screen reader testing, keyboard navigation, and ARIA attributes. Build inclusive applications that work for everyone.

- WCAG 2.1/2.2 AA/AAA compliance
- Screen reader testing (NVDA, JAWS, VoiceOver)
- Keyboard navigation patterns
- ARIA attributes and live regions
- Color contrast and visual accessibility
- Focus management
- Accessible forms and error handling
- Automated and manual testing

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** accessibility, a11y, wcag, screen reader, aria, keyboard navigation, focus
- **File Types:** `.tsx`, `.jsx`, `.html`
- **Directories:** `/components`, `/pages`

## 🚀 Core Capabilities

### 1. WCAG Compliance

**WCAG Compliance Checklist:**

```typescript
// Essential WCAG 2.1 Level AA Requirements

// 1. Perceivable
// - All images have alt text
// - Color is not the only visual means of conveying information
// - Text has 4.5:1 contrast ratio (3:1 for large text)
// - Content can be presented in different ways

// 2. Operable
// - All functionality available from keyboard
// - Users can navigate via keyboard
// - No keyboard traps
// - Enough time to read and use content

// 3. Understandable
// - Text is readable and understandable
// - Content appears and operates in predictable ways
// - Users are helped to avoid and correct mistakes

// 4. Robust
// - Content can be interpreted by assistive technologies
// - Valid HTML markup
```

**Semantic HTML:**

```typescript
// Bad - div soup
<div className="header">
  <div className="nav">
    <div className="link">Home</div>
  </div>
</div>

// Good - semantic HTML
<header>
  <nav>
    <a href="/">Home</a>
  </nav>
</header>

// Proper heading hierarchy
<h1>Main Page Title</h1>
<section>
  <h2>Section Title</h2>
  <h3>Subsection</h3>
</section>

// Proper list structure
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
  </ul>
</nav>
```

**Color Contrast:**

```typescript
// Install and use contrast checker
import { contrast } from 'wcag-contrast';

function validateContrast(fg: string, bg: string) {
  const ratio = contrast.ratio(fg, bg);

  return {
    AA: ratio >= 4.5,      // Normal text
    AALarge: ratio >= 3,   // Large text (18pt+ or 14pt+ bold)
    AAA: ratio >= 7,       // Enhanced contrast
  };
}

// Tailwind with proper contrast
<button className="bg-blue-600 text-white"> // 4.5:1 contrast
  Click Me
</button>

// CSS custom properties for theme
:root {
  --text-primary: #1a1a1a;
  --text-secondary: #4a4a4a;
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
}

// Ensure minimum 4.5:1 contrast
```

**Best Practices:**
- Use semantic HTML elements (header, nav, main, article, section, aside, footer)
- Maintain proper heading hierarchy (don't skip levels)
- Ensure 4.5:1 contrast for normal text, 3:1 for large text
- Don't rely on color alone to convey information
- Test with real screen readers

**Gotchas:**
- Divs and spans have no semantic meaning
- Skipping heading levels confuses screen readers
- Low contrast affects users with low vision
- Color-only indicators fail for colorblind users

### 2. Screen Reader Testing

**Screen Reader Patterns:**

```typescript
// Accessible button
<button
  type="button"
  aria-label="Close dialog"
  onClick={handleClose}
>
  <XIcon aria-hidden="true" />
</button>

// Accessible icon
<svg aria-hidden="true" focusable="false">
  <use xlinkHref="#icon-search" />
</svg>

// Descriptive link text
// Bad
<a href="/learn-more">Click here</a>

// Good
<a href="/accessibility-guide">
  Learn more about web accessibility
</a>

// Visually hidden but screen-reader accessible
<span className="sr-only">
  Opens in new window
</span>

// CSS for sr-only
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

**Testing Workflow:**

```bash
# Install screen readers
# Windows: NVDA (free)
# macOS: VoiceOver (built-in)
# Screen reader keyboard shortcuts

# NVDA
# Insert + Down Arrow: Read current line
# Insert + Up Arrow: Read from beginning

# VoiceOver (Mac)
# Cmd + F5: Enable VoiceOver
# Ctrl + Option + Right Arrow: Move to next item

# Test checklist
- [ ] Can navigate entire page with screen reader
- [ ] All interactive elements are announced
- [ ] Form labels are read correctly
- [ ] Error messages are announced
- [ ] Dynamic content updates are announced
```

**Best Practices:**
- Hide decorative images with `aria-hidden="true"`
- Provide text alternatives for icons
- Use descriptive link text
- Test with actual screen readers
- Use sr-only class for visually hidden text

**Gotchas:**
- Don't use `display: none` or `visibility: hidden` for screen-reader text
- Icons need labels unless they're purely decorative
- "Click here" links provide no context
- Screen readers read content in DOM order, not visual order

### 3. Keyboard Navigation

**Keyboard Navigation Patterns:**

```typescript
// Keyboard-accessible custom dropdown
export function Dropdown({ items }: { items: Item[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        setIsOpen(!isOpen);
        break;
      case 'Escape':
        setIsOpen(false);
        buttonRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex(prev =>
            prev < items.length - 1 ? prev + 1 : prev
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(items.length - 1);
        break;
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        Select option
      </button>

      {isOpen && (
        <ul
          ref={listRef}
          role="listbox"
          onKeyDown={handleKeyDown}
        >
          {items.map((item, index) => (
            <li
              key={item.id}
              role="option"
              aria-selected={focusedIndex === index}
              tabIndex={focusedIndex === index ? 0 : -1}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Roving tabindex for toolbar
export function Toolbar({ tools }: { tools: Tool[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <div role="toolbar" aria-label="Text formatting">
      {tools.map((tool, index) => (
        <button
          key={tool.id}
          tabIndex={index === currentIndex ? 0 : -1}
          onFocus={() => setCurrentIndex(index)}
          onClick={tool.action}
          aria-label={tool.label}
        >
          {tool.icon}
        </button>
      ))}
    </div>
  );
}
```

**Focus Management:**

```typescript
// Trap focus in modal
export function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements?.[0] as HTMLElement;
    const lastElement = focusableElements?.[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    firstElement?.focus();

    return () => document.removeEventListener('keydown', handleTab);
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

**Best Practices:**
- All interactive elements must be keyboard accessible
- Visible focus indicators required
- Logical tab order (follows visual flow)
- No keyboard traps
- Support standard keyboard shortcuts (Esc, Enter, Space, Arrow keys)

**Gotchas:**
- Don't remove outline without providing alternative focus indicator
- Custom widgets need keyboard event handlers
- Modal dialogs must trap focus
- Skip links should be first focusable element

### 4. ARIA Attributes

**ARIA Landmark Roles:**

```typescript
// Define page landmarks
<header role="banner">
  <nav role="navigation" aria-label="Main navigation">
    {/* Navigation content */}
  </nav>
</header>

<main role="main">
  <article role="article">
    {/* Main content */}
  </article>
  <aside role="complementary">
    {/* Sidebar content */}
  </aside>
</main>

<footer role="contentinfo">
  {/* Footer content */}
</footer>
```

**ARIA Live Regions:**

```typescript
// Announce dynamic updates
export function StatusMessage({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={type === 'error' ? 'text-red-600' : 'text-green-600'}
    >
      {message}
    </div>
  );
}

// Polite announcements
<div aria-live="polite" aria-atomic="true">
  {searchResults.length} results found
</div>

// Off-screen announcements
<div className="sr-only" aria-live="polite">
  Loading new content...
</div>
```

**ARIA States and Properties:**

```typescript
// Button states
<button
  aria-pressed={isPressed}
  aria-expanded={isExpanded}
  aria-disabled={isDisabled}
>
  Toggle
</button>

// Form fields
<label htmlFor="email">Email</label>
<input
  id="email"
  type="email"
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby={hasError ? "email-error" : undefined}
/>
{hasError && (
  <span id="email-error" role="alert">
    Please enter a valid email
  </span>
)}

// Tabs
<div role="tablist" aria-label="Account settings">
  <button
    role="tab"
    aria-selected={activeTab === 'profile'}
    aria-controls="profile-panel"
    id="profile-tab"
  >
    Profile
  </button>
</div>
<div
  role="tabpanel"
  id="profile-panel"
  aria-labelledby="profile-tab"
  hidden={activeTab !== 'profile'}
>
  {/* Profile content */}
</div>
```

**Best Practices:**
- Use semantic HTML before ARIA
- ARIA should enhance, not replace, semantic HTML
- Ensure ARIA labels are descriptive
- Test ARIA with screen readers
- Keep ARIA states in sync with visual states

**Gotchas:**
- ARIA only changes how assistive tech interprets elements
- ARIA doesn't add keyboard behavior
- Invalid ARIA can make page less accessible
- "No ARIA is better than bad ARIA"

## 💡 Real-World Examples

### Example 1: Accessible Form

```typescript
export function SignupForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  return (
    <form aria-labelledby="signup-heading">
      <h2 id="signup-heading">Create Account</h2>

      <div>
        <label htmlFor="name">Full Name</label>
        <input
          id="name"
          type="text"
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
          onBlur={() => setTouched({ ...touched, name: true })}
        />
        {errors.name && (
          <span id="name-error" role="alert" className="text-red-600">
            {errors.name}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          aria-required="true"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : "email-hint"}
        />
        <span id="email-hint" className="text-sm text-gray-600">
          We'll never share your email
        </span>
        {errors.email && (
          <span id="email-error" role="alert">
            {errors.email}
          </span>
        )}
      </div>

      <button type="submit">
        Sign Up
      </button>
    </form>
  );
}
```

### Example 2: Accessible Data Table

```typescript
export function DataTable({ data }: { data: User[] }) {
  const [sortBy, setSortBy] = useState<keyof User>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  return (
    <table>
      <caption className="sr-only">
        List of {data.length} users
      </caption>
      <thead>
        <tr>
          <th scope="col">
            <button
              onClick={() => handleSort('name')}
              aria-sort={sortBy === 'name' ? sortDir : undefined}
            >
              Name
              <span aria-hidden="true">
                {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
              </span>
            </button>
          </th>
          <th scope="col">Email</th>
          <th scope="col">Role</th>
        </tr>
      </thead>
      <tbody>
        {data.map(user => (
          <tr key={user.id}>
            <th scope="row">{user.name}</th>
            <td>{user.email}</td>
            <td>{user.role}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## 🔗 Related Skills

- **react-advanced** - Accessible React patterns
- **form-validation-expert** - Accessible form validation
- **testing-library-expert** - Accessibility testing
- **i18n-expert** - Accessibility for multilingual apps

## 📖 Further Reading

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WebAIM Resources](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
"""
}

# Write the files
for filename, content in SKILLS.items():
    filepath = os.path.join(SKILLS_DIR, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')
    print(f"✓ Created {filename} ({len(content.splitlines())} lines)")

print(f"\nGenerated {len(SKILLS)} comprehensive skill files!")
