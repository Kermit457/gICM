# Internationalization Expert

> **ID:** `i18n-expert`
> **Tier:** 3
> **Token Cost:** 5000
> **MCP Connections:** context7

## What This Skill Does

Master internationalization (i18n) implementation for web applications with i18next, react-i18next, next-intl, and modern translation management systems. Build multilingual applications with proper locale handling, RTL support, and culture-aware formatting.

- Complete i18next and react-i18next setup
- Next.js App Router i18n with next-intl
- Translation file management and best practices
- RTL (Right-to-Left) language support
- Date, number, and currency formatting with Intl API
- Dynamic locale switching with persistence
- Translation key extraction and management
- Pluralization and gender handling
- Translation service integration (Crowdin, Lokalise, Phrase)
- Type-safe translations with TypeScript
- SEO for multilingual sites

## When to Use

This skill is automatically loaded when:

- **Keywords:** i18n, internationalization, translation, localization, i18next, locale, multilingual, rtl
- **File Types:** locale/*.json, i18n.ts, i18n.config.ts, messages/*.json
- **Directories:** /locales, /translations, /i18n, /lang, /messages

## Core Capabilities

### 1. i18next Setup (React & Next.js)

**React Application Setup:**

```typescript
// src/i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'ja', 'ar', 'zh'] as const;
type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: SUPPORTED_LANGUAGES,
    fallbackLng: 'en',
    ns: ['common', 'auth', 'dashboard', 'errors', 'validation'],
    defaultNS: 'common',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'],
      lookupQuerystring: 'lang',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
    },
    react: {
      useSuspense: true,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
    },
    interpolation: {
      escapeValue: false,
      formatSeparator: ',',
    },
    returnNull: false,
    returnEmptyString: false,
  });

export default i18n;
export { SUPPORTED_LANGUAGES, type SupportedLanguage };
```

**Next.js App Router with next-intl:**

```typescript
// src/i18n/config.ts
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const locales = ['en', 'es', 'fr', 'de', 'ja', 'ar'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as Locale)) notFound();

  return {
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: 'UTC',
    now: new Date(),
  };
});
```

```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './src/i18n/config';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed', // or 'always' or 'never'
  localeDetection: true,
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

```typescript
// app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { locales, type Locale } from '@/i18n/config';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params: { locale } }: { params: { locale: Locale } }) {
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  const messages = await getMessages();
  const isRtl = ['ar', 'he', 'fa'].includes(locale);

  return (
    <html lang={locale} dir={isRtl ? 'rtl' : 'ltr'}>
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
- Preload critical namespaces for better UX

**Gotchas:**
- Always set `escapeValue: false` in React (JSX handles escaping)
- Use Suspense boundary when `useSuspense: true`
- Backend path must match file structure exactly
- Language detector order matters for UX
- next-intl requires messages in all locales

### 2. Translation Management

**Structured Translation Files:**

```json
// messages/en.json
{
  "metadata": {
    "title": "My App - Build Something Amazing",
    "description": "A powerful application for modern teams"
  },
  "common": {
    "loading": "Loading...",
    "error": "Something went wrong",
    "retry": "Try again",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "close": "Close"
  },
  "nav": {
    "home": "Home",
    "about": "About",
    "contact": "Contact",
    "dashboard": "Dashboard",
    "settings": "Settings"
  },
  "auth": {
    "signIn": "Sign in",
    "signOut": "Sign out",
    "signUp": "Create account",
    "forgotPassword": "Forgot password?",
    "email": "Email address",
    "password": "Password",
    "confirmPassword": "Confirm password",
    "errors": {
      "invalidEmail": "Please enter a valid email address",
      "passwordTooShort": "Password must be at least 8 characters",
      "passwordMismatch": "Passwords do not match"
    }
  },
  "validation": {
    "required": "This field is required",
    "minLength": "Must be at least {min} characters",
    "maxLength": "Must be no more than {max} characters",
    "email": "Must be a valid email",
    "url": "Must be a valid URL"
  }
}
```

**Type-Safe Translations with next-intl:**

```typescript
// src/i18n/types.ts
import en from '../messages/en.json';

type Messages = typeof en;

declare global {
  interface IntlMessages extends Messages {}
}

// Now useTranslations() is fully typed!
```

**Type-Safe Translations with i18next:**

```typescript
// src/i18n/types.ts
import 'i18next';
import common from '../locales/en/common.json';
import auth from '../locales/en/auth.json';
import validation from '../locales/en/validation.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      auth: typeof auth;
      validation: typeof validation;
    };
  }
}
```

**Pluralization:**

```json
// messages/en.json
{
  "items": {
    "count": "{count, plural, =0 {No items} one {# item} other {# items}}",
    "remaining": "You have {count, plural, =0 {no items} one {one item} other {# items}} remaining"
  },
  "notifications": {
    "count": "You have {count, plural, =0 {no new notifications} one {# new notification} other {# new notifications}}"
  }
}

// Usage
const t = useTranslations('items');
t('count', { count: 0 });  // "No items"
t('count', { count: 1 });  // "1 item"
t('count', { count: 5 });  // "5 items"
```

**Best Practices:**
- Organize by feature/namespace, not by language
- Use nested keys for logical grouping
- Keep keys semantic (describe content, not location)
- Version translation files
- Use ICU message format for complex strings
- Extract keys automatically with tooling

**Gotchas:**
- Avoid dynamic key generation (breaks static analysis)
- Don't store HTML in translations (use rich text components)
- JSON files must be valid JSON
- Keep default language file as source of truth

### 3. RTL Support

Implement proper right-to-left language support.

**RTL Detection Hook:**

```typescript
// src/hooks/useDirection.ts
import { useLocale } from 'next-intl';

const RTL_LOCALES = ['ar', 'he', 'fa', 'ur'] as const;

export function useDirection() {
  const locale = useLocale();
  return RTL_LOCALES.includes(locale as any) ? 'rtl' : 'ltr';
}

export function useIsRtl() {
  return useDirection() === 'rtl';
}
```

**RTL-Aware Styles with Tailwind:**

```css
/* globals.css */
@layer utilities {
  /* Use logical properties */
  .ms-4 { margin-inline-start: 1rem; }
  .me-4 { margin-inline-end: 1rem; }
  .ps-4 { padding-inline-start: 1rem; }
  .pe-4 { padding-inline-end: 1rem; }
  
  /* RTL-aware transforms */
  .rtl\:flip {
    [dir="rtl"] & {
      transform: scaleX(-1);
    }
  }
}
```

```typescript
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      // Logical spacing utilities
    },
  },
  plugins: [
    require('tailwindcss-rtl'), // Adds RTL variants
  ],
};
```

**RTL-Aware Components:**

```typescript
// src/components/directional-icon.tsx
import { useIsRtl } from '@/hooks/useDirection';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function ChevronForward({ className }: { className?: string }) {
  const isRtl = useIsRtl();
  const Icon = isRtl ? ChevronLeft : ChevronRight;
  return <Icon className={className} />;
}

export function ChevronBack({ className }: { className?: string }) {
  const isRtl = useIsRtl();
  const Icon = isRtl ? ChevronRight : ChevronLeft;
  return <Icon className={className} />;
}
```

**Best Practices:**
- Use CSS logical properties (inline-start/end, block-start/end)
- Test with real RTL content, not just reversed English
- Flip directional icons (arrows, chevrons)
- Keep numbers LTR even in RTL context
- Test bi-directional text (mixed LTR/RTL)

**Gotchas:**
- Numbers remain LTR in RTL text
- Some CSS properties don't auto-flip (transforms, backgrounds)
- Phone numbers and URLs should stay LTR
- Form inputs may need special handling
- Scrollbars may need RTL consideration

### 4. Date/Number/Currency Formatting

Use the Intl API for locale-aware formatting.

**Comprehensive Formatting Hook:**

```typescript
// src/hooks/useFormatters.ts
import { useLocale } from 'next-intl';
import { useMemo } from 'react';

export function useFormatters() {
  const locale = useLocale();

  return useMemo(() => ({
    // Date formatting
    formatDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions) {
      const d = new Date(date);
      return new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        ...options,
      }).format(d);
    },

    formatTime(date: Date | string | number, options?: Intl.DateTimeFormatOptions) {
      const d = new Date(date);
      return new Intl.DateTimeFormat(locale, {
        timeStyle: 'short',
        ...options,
      }).format(d);
    },

    formatDateTime(date: Date | string | number, options?: Intl.DateTimeFormatOptions) {
      const d = new Date(date);
      return new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
        ...options,
      }).format(d);
    },

    formatRelativeTime(date: Date | string | number) {
      const d = new Date(date);
      const now = new Date();
      const diffMs = d.getTime() - now.getTime();
      const diffSec = Math.round(diffMs / 1000);
      const diffMin = Math.round(diffSec / 60);
      const diffHour = Math.round(diffMin / 60);
      const diffDay = Math.round(diffHour / 24);

      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

      if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'second');
      if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
      if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour');
      return rtf.format(diffDay, 'day');
    },

    // Number formatting
    formatNumber(num: number, options?: Intl.NumberFormatOptions) {
      return new Intl.NumberFormat(locale, options).format(num);
    },

    formatPercent(num: number, decimals: number = 0) {
      return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(num);
    },

    formatCompact(num: number) {
      return new Intl.NumberFormat(locale, {
        notation: 'compact',
        compactDisplay: 'short',
      }).format(num);
    },

    // Currency formatting
    formatCurrency(amount: number, currency: string = 'USD') {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        currencyDisplay: 'narrowSymbol',
      }).format(amount);
    },

    // List formatting
    formatList(items: string[], type: 'conjunction' | 'disjunction' = 'conjunction') {
      return new Intl.ListFormat(locale, { type }).format(items);
    },
  }), [locale]);
}

// Usage
function PriceDisplay({ price, currency }: { price: number; currency: string }) {
  const { formatCurrency, formatRelativeTime } = useFormatters();

  return (
    <div>
      <span className="text-2xl font-bold">{formatCurrency(price, currency)}</span>
      <span className="text-sm text-muted-foreground">Updated {formatRelativeTime(new Date())}</span>
    </div>
  );
}
```

**Best Practices:**
- Always use Intl API for locale-sensitive formatting
- Use currency codes (USD, EUR) not symbols ($)
- Consider timezone when formatting dates
- Use relative time for recent dates
- Memoize formatters to avoid recreation

**Gotchas:**
- Currency formatting varies widely (position, spacing)
- Number separators differ by locale (1,000 vs 1.000)
- Date formats vary (MM/DD vs DD/MM)
- Not all locales support all Intl features
- Server/client mismatch can cause hydration errors

## Real-World Examples

### Example 1: Language Switcher Component

```typescript
// src/components/language-switcher.tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { locales, type Locale } from '@/i18n/config';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, Check } from 'lucide-react';

const LANGUAGE_NAMES: Record<Locale, string> = {
  en: 'English',
  es: 'Espanol',
  fr: 'Francais',
  de: 'Deutsch',
  ja: 'Japanese',
  ar: 'Arabic',
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (newLocale: Locale) => {
    startTransition(() => {
      // Remove current locale from path and add new one
      const segments = pathname.split('/');
      segments[1] = newLocale;
      router.replace(segments.join('/'));
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isPending}>
          <Globe className="h-4 w-4" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            className="flex items-center justify-between"
          >
            {LANGUAGE_NAMES[loc]}
            {loc === locale && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Example 2: Multilingual Form with Validation

```typescript
// src/components/contact-form.tsx
'use client';

import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function ContactForm() {
  const t = useTranslations('contact');
  const tValidation = useTranslations('validation');

  // Create schema with translated messages
  const schema = z.object({
    name: z.string().min(1, tValidation('required')).max(100, tValidation('maxLength', { max: 100 })),
    email: z.string().min(1, tValidation('required')).email(tValidation('email')),
    message: z.string().min(10, tValidation('minLength', { min: 10 })).max(1000, tValidation('maxLength', { max: 1000 })),
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    await fetch('/api/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          {t('nameLabel')}
        </label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          {t('emailLabel')}
        </label>
        <Input id="email" type="email" {...register('email')} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium">
          {t('messageLabel')}
        </label>
        <Textarea id="message" rows={5} {...register('message')} />
        {errors.message && <p className="text-sm text-destructive">{errors.message.message}</p>}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? t('sending') : t('submit')}
      </Button>
    </form>
  );
}
```

### Example 3: SEO for Multilingual Sites

```typescript
// app/[locale]/layout.tsx
import { locales, type Locale } from '@/i18n/config';

export async function generateMetadata({ params: { locale } }: { params: { locale: Locale } }) {
  const t = await getTranslations({ locale, namespace: 'metadata' });

  // Generate alternate links for all locales
  const languages: Record<string, string> = {};
  locales.forEach((loc) => {
    languages[loc] = `https://example.com/${loc}`;
  });

  return {
    title: {
      template: '%s | My App',
      default: t('title'),
    },
    description: t('description'),
    alternates: {
      canonical: `https://example.com/${locale}`,
      languages,
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      locale,
      alternateLocales: locales.filter((l) => l !== locale),
    },
  };
}
```

## Related Skills

- **react-advanced** - Component patterns for i18n
- **nextjs-expert** - Next.js i18n routing and middleware
- **a11y-expert** - Accessibility for multilingual apps
- **seo-expert** - International SEO best practices

## Further Reading

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Guide](https://react.i18next.com/)
- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [RTL Styling Guide](https://rtlstyling.com/)
- [ICU Message Format](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
- [MDN Intl API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
