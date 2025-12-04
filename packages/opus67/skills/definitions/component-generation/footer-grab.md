# FOOTER-GRAB Skill

## Overview
Generate production-ready footer components with links, social media, newsletter signup, and various layouts. Supports multi-column, minimal, and mega footer designs.

## Metadata
- **ID**: `footer-grab`
- **Category**: Component Generation
- **Complexity**: Intermediate
- **Prerequisites**: React 18+, TypeScript
- **Estimated Time**: 10-15 minutes

## Capabilities
- Multi-column footer layouts
- Social media links with icons
- Newsletter signup forms
- Copyright and legal links
- Logo and branding
- Mobile-responsive design
- Dark mode support
- SEO-friendly markup

## Footer Component Patterns

### 1. Multi-Column Footer
```typescript
import React from 'react';
import Link from 'next/link';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

interface SocialLink {
  platform: string;
  href: string;
  icon: React.ReactNode;
}

interface FooterProps {
  logo?: React.ReactNode;
  columns: FooterColumn[];
  socialLinks?: SocialLink[];
  copyright?: string;
  legalLinks?: FooterLink[];
  newsletterSignup?: boolean;
  className?: string;
}

export function Footer({
  logo,
  columns,
  socialLinks,
  copyright,
  legalLinks,
  newsletterSignup = false,
  className = '',
}: FooterProps) {
  const [email, setEmail] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Handle newsletter signup
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setEmail('');
  };

  return (
    <footer className={`bg-gray-900 text-gray-300 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
          {/* Logo and Description */}
          <div className="lg:col-span-4">
            {logo && <div className="mb-4">{logo}</div>}
            <p className="text-sm text-gray-400 mb-4">
              Building the future of web applications with modern technology.
            </p>
            {socialLinks && (
              <div className="flex gap-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.platform}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label={social.platform}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Columns */}
          {columns.map((column, index) => (
            <div key={index} className="lg:col-span-2">
              <h3 className="text-white font-semibold mb-4">{column.title}</h3>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter Signup */}
          {newsletterSignup && (
            <div className="lg:col-span-4">
              <h3 className="text-white font-semibold mb-4">Stay Updated</h3>
              <p className="text-sm text-gray-400 mb-4">
                Subscribe to our newsletter for the latest updates.
              </p>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Sending...' : 'Subscribe'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">{copyright || `© ${new Date().getFullYear()} All rights reserved.`}</p>
          {legalLinks && (
            <div className="flex gap-6">
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
```

### 2. Minimal Footer
```typescript
interface MinimalFooterProps {
  logo?: React.ReactNode;
  links?: FooterLink[];
  socialLinks?: SocialLink[];
  copyright?: string;
}

export function MinimalFooter({
  logo,
  links,
  socialLinks,
  copyright,
}: MinimalFooterProps) {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {logo && <div>{logo}</div>}

          {links && (
            <nav className="flex gap-6">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          {socialLinks && (
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.platform}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 text-center text-sm text-gray-500">
          {copyright || `© ${new Date().getFullYear()} All rights reserved.`}
        </div>
      </div>
    </footer>
  );
}
```

### 3. Mega Footer
```typescript
interface MegaFooterProps {
  logo?: React.ReactNode;
  description?: string;
  sections: Array<{
    title: string;
    content: React.ReactNode;
  }>;
  bottomBar?: React.ReactNode;
}

export function MegaFooter({
  logo,
  description,
  sections,
  bottomBar,
}: MegaFooterProps) {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Section */}
        <div className="py-12 border-b border-gray-800">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5">
              {logo && <div className="mb-4">{logo}</div>}
              {description && (
                <p className="text-gray-400">{description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {sections.map((section, index) => (
            <div key={index}>
              <h3 className="text-white font-semibold mb-4">{section.title}</h3>
              {section.content}
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        {bottomBar && (
          <div className="py-8 border-t border-gray-800">
            {bottomBar}
          </div>
        )}
      </div>
    </footer>
  );
}
```

## Usage Examples

### Basic Multi-Column Footer
```typescript
<Footer
  logo={<Logo />}
  columns={[
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '/features' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'FAQ', href: '/faq' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '/about' },
        { label: 'Blog', href: '/blog' },
        { label: 'Careers', href: '/careers' },
      ],
    },
  ]}
  socialLinks={[
    { platform: 'Twitter', href: 'https://twitter.com', icon: <TwitterIcon /> },
    { platform: 'GitHub', href: 'https://github.com', icon: <GitHubIcon /> },
  ]}
  newsletterSignup
  copyright="© 2025 Company Name. All rights reserved."
  legalLinks={[
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ]}
/>
```

## Best Practices

1. **Content Organization**
   - Group related links
   - Keep link text concise
   - Include important legal pages
   - Provide contact information

2. **Accessibility**
   - Use semantic HTML
   - Include proper ARIA labels
   - Ensure keyboard navigation
   - Maintain color contrast

3. **SEO**
   - Use proper heading hierarchy
   - Include relevant internal links
   - Add schema markup
   - Optimize for mobile

4. **Performance**
   - Lazy load social icons
   - Optimize images
   - Minimize CSS
   - Cache static content

## Generated: 2025-01-04
Version: 1.0.0
