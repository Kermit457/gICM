# Unified Color Palette - gICM://SEND

## 🎨 Core Colors (10 Total)

### Primary Accent
- **Lime-300**: `#bef264` / `rgb(190, 242, 100)`
  - Usage: Primary CTAs, highlights, logo text, metric numbers
  - Tailwind: `bg-lime-300`, `text-lime-300`, `border-lime-300`

### Supporting Gradients
- **Emerald-300**: `#6ee7b7` / `rgb(110, 231, 183)`
  - Usage: Background gradient middle
  - Tailwind: `via-emerald-300`

- **Teal-300**: `#5eead4` / `rgb(94, 234, 212)`
  - Usage: Background gradient end
  - Tailwind: `to-teal-300`

### Neutrals
- **Black**: `#000000` / `rgb(0, 0, 0)`
  - Usage: Primary dark, logo backgrounds, active states
  - Tailwind: `bg-black`, `text-black`, `border-black`

- **Zinc-900**: `#18181b` / `rgb(24, 24, 27)`
  - Usage: Secondary dark for gradients
  - Tailwind: `via-zinc-900`

- **Zinc-600**: `#52525b` / `rgb(82, 82, 91)`
  - Usage: Secondary text only
  - Tailwind: `text-zinc-600`

- **White**: `#ffffff` / `rgb(255, 255, 255)`
  - Usage: Light backgrounds, text on dark
  - Tailwind: `bg-white`, `text-white`

## 📏 Standardized Opacity System

### Background Opacities (2 values only)
- **bg-white/90**: Cards, overlays, menus
- **bg-black/90**: Dark sections, ticker

### Border Opacities (3 values only)
- **border-*/20**: Light borders (inactive states)
- **border-*/40**: Medium borders (CTA, important elements)
- **border-*/80**: Strong borders (active states)

### Text Opacities (2 values only)
- **text-*/60**: Tertiary text (labels, captions)
- **text-*/80**: Secondary text (subtitles)
- **text-black**: Primary text (100%)

## 🔧 Component Color Standards

### Hero Banner
- Logo: `bg-black` + `text-lime-300`
- Title: `text-black`
- Subtitle: `text-black/80`

### Live Ticker
- Background: `bg-black/90`
- Border: `border-lime-300/20`
- Accents: `text-lime-300`, `text-yellow-400` (only for stars)

### CTA Section
- Background: `from-black via-zinc-900 to-black`
- Border: `border-lime-300/40`
- Badge BG: `bg-lime-300/20`
- Badge Border: `border-lime-300/40`
- Headline: `text-white` + `text-lime-300` (accent)
- Subtitle: `text-white/80`
- Button Primary: `bg-lime-300 text-black`
- Button Secondary: `border-white/40 text-white`
- Metrics: `text-lime-300` + `text-zinc-600` (labels)

### Menu Builder
- Background: `bg-white/90`
- Border: `border-black/20`
- Active: `bg-black text-white`
- Inactive: `text-black/60`
- Count Active: `bg-lime-300 text-black`
- Count Inactive: `bg-black/20 text-black/60`

### Cards
- Background: `bg-white/90`
- Border Active: `border-black/80`
- Border Inactive: `border-black/20`
- Logo: `bg-black text-lime-300`
- Title: `text-black`
- Kind: `text-zinc-600`
- Description: `text-black/80`
- Button Active: `bg-black text-white border-black`
- Button Inactive: `border-black/40 text-black/80`

### Sidebar
- Background: `bg-white/90`
- Border: `border-black/20`
- Title: `text-black`
- Code Block: `bg-black text-white`
- Text: `text-zinc-600`
- Button Primary: `bg-black text-white`
- Button Secondary: `border-black/40 text-black/80`

### Search & Sort
- Background: `bg-white/90`
- Border: `border-black/40`
- Text: `text-black`
- Placeholder: `text-zinc-600`
- Focus Border: `border-black/80`

## 🚫 Colors to Remove
- `zinc-300` - Replace with `white/80`
- `zinc-400` - Replace with `zinc-600`
- `zinc-700` - Replace with `black/80`
- All `/10` opacities - Replace with `/20`
- All `/30` opacities - Replace with `/20` or `/40`
- All `/50` opacities - Replace with `/40`
- All `/60` opacities (backgrounds) - Replace with `/90`
- All `/70` opacities - Replace with `/60` or `/80`
- All `/95` opacities - Replace with `/90`

## ✅ Final Palette Summary
**10 Colors Total:**
1. Lime-300 (#bef264)
2. Emerald-300 (#6ee7b7)
3. Teal-300 (#5eead4)
4. Yellow-400 (#facc15) - stars only
5. Black (#000000)
6. Zinc-900 (#18181b)
7. Zinc-600 (#52525b)
8. White (#ffffff)

**7 Opacity Values:**
- /20, /40, /60, /80, /90 (5 main)
- /100 (implicit - no opacity)

This reduces from **39 unique colors to 10 base colors** with consistent opacity patterns!
