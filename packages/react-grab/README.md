# @gicm/react-grab

Click any element in your React app, copy context for AI coding agents.

**Works with:** Claude Code, Cursor, Copilot, Windsurf, Zed, and more.

## Why?

Without context, AI coding agents waste time searching your codebase. React Grab gives them the exact file:line location instantly.

- **55% faster** Claude Code task completion
- **One click** to copy element context
- **Exact location** - file, line, column
- **Zero config** - just add script tag

## Quick Start

### Next.js (App Router)

```tsx
// app/layout.tsx
import Script from "next/script";

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/@gicm/react-grab"
            data-auto-init
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### Vite

```html
<!-- index.html -->
<head>
  <script type="module">
    if (import.meta.env.DEV) {
      import("@gicm/react-grab").then(({ init }) => init());
    }
  </script>
</head>
```

### CDN

```html
<script src="//unpkg.com/@gicm/react-grab" data-auto-init></script>
```

## Usage

1. **Hold ⌘/Ctrl + C**
2. **Click any element**
3. **Paste into Claude Code / Cursor**

That's it! The element's context (HTML, classes, React component stack with file:line) is copied to your clipboard.

## What Gets Copied

```xml
<selected_element>
  <button class="px-4 py-2 bg-blue-500 text-white rounded">
    Sign In
  </button>
  at Button in components/ui/button.tsx:23:5
  at div in components/auth/login-form.tsx:45:9
  at LoginForm in components/auth/login-form.tsx:12:3
  at AuthPage in app/auth/page.tsx:8:5
</selected_element>
```

## Configuration

```typescript
import { init } from "@gicm/react-grab";

const grab = init({
  // Keyboard shortcut (default: 'c')
  shortcutKey: "c",

  // Theme
  theme: {
    enabled: true,
    hue: 280, // Purple (try 200 for blue, 150 for green)
  },

  // gICM API for component suggestions (optional)
  gicmApiUrl: "http://localhost:8000",
  showSuggestions: true,

  // Callbacks
  onSelect: (context) => console.log("Selected:", context),
  onCopy: (context, text) => console.log("Copied:", text),
});

// Later: cleanup
grab.destroy();
```

## API

```typescript
const grab = init(config);

grab.activate(); // Manually activate grab mode
grab.deactivate(); // Deactivate
grab.grab(element); // Get context for element
grab.copy(element); // Copy element to clipboard
grab.getState(); // Get current state
grab.configure({}); // Update config
grab.destroy(); // Cleanup
```

## With gICM Suggestions

If you have the gICM Context Engine running, React Grab can show matching component suggestions:

```html
<script
  src="//unpkg.com/@gicm/react-grab"
  data-auto-init
  data-gicm-api="http://localhost:8000"
></script>
```

## Requirements

- React 16.8+ (with development mode for file:line info)
- Modern browser with ES2020 support

## License

MIT
