import { chromium } from '@playwright/test';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function analyzeColors() {
  console.log('🎨 Starting color analysis...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Navigate to the page
    console.log('📄 Loading http://localhost:3001...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Wait for animations

    // Take full page screenshot
    console.log('📸 Taking full page screenshot...');
    await page.screenshot({
      path: 'color-analysis/screenshots/full-page.png',
      fullPage: true
    });

    // Take component screenshots
    console.log('📸 Taking component screenshots...');

    // Hero banner
    const hero = page.locator('div').filter({ hasText: /gICM:\/\/SEND/ }).first();
    if (await hero.count() > 0) {
      await hero.screenshot({ path: 'color-analysis/screenshots/hero-banner.png' });
    }

    // Live ticker
    const ticker = page.locator('div').filter({ has: page.locator('text=remixed') }).first();
    if (await ticker.count() > 0) {
      await ticker.screenshot({ path: 'color-analysis/screenshots/live-ticker.png' });
    }

    // CTA
    const cta = page.locator('text=SOMETHING BIG IS COMING').locator('..').locator('..').locator('..');
    if (await cta.count() > 0) {
      await cta.screenshot({ path: 'color-analysis/screenshots/cta-section.png' });
    }

    // Menu
    const menu = page.locator('button').filter({ hasText: 'All' }).locator('..').locator('..');
    if (await menu.count() > 0) {
      await menu.screenshot({ path: 'color-analysis/screenshots/menu-navigation.png' });
    }

    // First card
    const firstCard = page.locator('div').filter({ hasText: /Add to Stack/ }).first().locator('..');
    if (await firstCard.count() > 0) {
      await firstCard.screenshot({ path: 'color-analysis/screenshots/card-sample.png' });
    }

    // Sidebar
    const sidebar = page.locator('text=Installation Command').locator('..').locator('..');
    if (await sidebar.count() > 0) {
      await sidebar.screenshot({ path: 'color-analysis/screenshots/sidebar.png' });
    }

    console.log('🔍 Extracting color information...');

    // Extract all unique colors from computed styles
    const colorData = await page.evaluate(() => {
      const colors = new Set();
      const elements = document.querySelectorAll('*');

      elements.forEach(el => {
        const styles = window.getComputedStyle(el);

        // Get colors
        const bgColor = styles.backgroundColor;
        const textColor = styles.color;
        const borderColor = styles.borderColor;

        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') colors.add(`bg: ${bgColor}`);
        if (textColor) colors.add(`text: ${textColor}`);
        if (borderColor && borderColor !== 'rgba(0, 0, 0, 0)') colors.add(`border: ${borderColor}`);
      });

      return Array.from(colors);
    });

    // Generate report
    console.log('📝 Generating report...');

    const report = `# Color Analysis Report - gICM://SEND

## Screenshots Captured
- Full page: \`color-analysis/screenshots/full-page.png\`
- Hero banner: \`color-analysis/screenshots/hero-banner.png\`
- Live ticker: \`color-analysis/screenshots/live-ticker.png\`
- CTA section: \`color-analysis/screenshots/cta-section.png\`
- Menu navigation: \`color-analysis/screenshots/menu-navigation.png\`
- Card sample: \`color-analysis/screenshots/card-sample.png\`
- Sidebar: \`color-analysis/screenshots/sidebar.png\`

## Colors Found (${colorData.length} unique)

${colorData.map(c => `- ${c}`).join('\n')}

## Analysis

### Current Color Usage by Component

#### Background Gradient
- \`from-lime-300\` (#bef264)
- \`via-emerald-300\` (#6ee7b7)
- \`to-teal-300/60\` (#5eead4 at 60% opacity)

#### Hero Banner
- Logo BG: \`bg-black\` (#000000)
- Logo Text: \`text-lime-300\` (#bef264)
- Title: \`text-black\` (#000000)
- Subtitle: \`text-black/80\` (#000000 at 80%)

#### Live Ticker
- BG: \`bg-black/90\` (#000000 at 90%)
- Border: \`border-lime-300/20\` (#bef264 at 20%)
- Accent colors: lime-300, yellow-400, emerald-400, white at various opacities

#### CTA Section
- BG: \`from-black via-zinc-900 to-black\`
- Border: \`border-lime-300/40\`
- Text: white, lime-300, zinc-300, zinc-400
- Buttons: lime-300 bg, white border

#### Menu
- BG: \`bg-white/80\`
- Border: \`border-black/10\`
- Active: \`bg-black text-white\`
- Inactive: \`text-black/70\`

#### Cards
- BG: \`bg-white/95\`
- Border active: \`border-black/80\`
- Border inactive: \`border-black/20\`
- Text: zinc-600, zinc-700

#### Sidebar
- BG: \`bg-white/95\`
- Border: \`border-black/20\`
- Text: zinc-600

## Issues Identified

1. **Inconsistent Opacity Values**: Using /10, /20, /30, /40, /50, /60, /70, /80, /90, /95
2. **Multiple Similar Colors**: zinc-300, zinc-400, zinc-600, zinc-700 - can be reduced
3. **Border Opacity Variations**: /10, /20, /30, /40 all used for borders
4. **Background Opacity Variations**: /60, /80, /90, /95 for similar purposes

## Recommended Unified Palette

### Primary Colors
- **Lime Primary**: #bef264 (lime-300) - Main accent, CTAs, highlights
- **Emerald Secondary**: #6ee7b7 (emerald-300) - Gradient support
- **Teal Tertiary**: #5eead4 (teal-300) - Gradient support

### Neutral Colors
- **Black**: #000000 - Primary dark
- **Zinc-900**: #18181b - Secondary dark
- **Zinc-600**: #52525b - Tertiary text
- **White**: #ffffff - Light backgrounds

### Opacity System (Standardized)
- **Background Opacities**: /90 (cards, modals), /80 (overlays)
- **Border Opacities**: /20 (light), /60 (medium), /90 (strong)
- **Text Opacities**: /60 (tertiary), /80 (secondary), /100 (primary)

### Recommended Changes
1. Standardize all white backgrounds to \`bg-white/90\`
2. Standardize all light borders to \`border-black/20\`
3. Standardize all medium borders to \`border-black/60\`
4. Reduce text colors to: black, black/80, zinc-600
5. Remove zinc-300, zinc-400, zinc-700 - use zinc-600 only
6. Standardize all inactive text to \`text-black/60\`

## Next Steps
1. Update all components with standardized opacity values
2. Reduce color palette to 10 core colors
3. Create design tokens file for consistency
4. Run contrast analysis to ensure WCAG AA compliance
`;

    writeFileSync('color-analysis/report.md', report);
    console.log('✅ Report saved to color-analysis/report.md');

    // Save color data as JSON
    writeFileSync('color-analysis/colors.json', JSON.stringify(colorData, null, 2));
    console.log('✅ Color data saved to color-analysis/colors.json');

  } catch (error) {
    console.error('❌ Error during analysis:', error);
    throw error;
  } finally {
    await browser.close();
  }

  console.log('🎉 Color analysis complete!');
}

analyzeColors().catch(console.error);
