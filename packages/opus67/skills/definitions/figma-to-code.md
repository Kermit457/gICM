# Figma to Code Expert

> **ID:** `figma-to-code`
> **Tier:** 2
> **Token Cost:** 6000
> **MCP Connections:** None

## What This Skill Does

Translate Figma designs to pixel-perfect code. Master design token extraction, component mapping, responsive implementation, and maintaining design-development handoff workflows.

- Translate Figma designs to pixel-perfect code
- Extract design tokens from Figma
- Implement auto-layout as Flexbox/Grid
- Handle responsive breakpoints
- Optimize assets and images
- Maintain design-dev handoff
- Use Figma REST API for automation
- Generate component code from designs
- Style variable mapping
- Icon and asset export workflows

## When to Use

This skill is automatically loaded when:

- **Keywords:** figma, design, mockup, pixel perfect, handoff, translate, design tokens
- **File Types:** figma.ts, tokens.json
- **Directories:** /design, /tokens

## Core Capabilities

### 1. Design Token Extraction

Extract and transform Figma design tokens.

**Figma API Token Extraction:**

```typescript
// scripts/extract-tokens.ts
import * as Figma from 'figma-api';

const api = new Figma.Api({ personalAccessToken: process.env.FIGMA_TOKEN! });

interface DesignTokens {
  colors: Record<string, string>;
  typography: Record<string, TypographyToken>;
  spacing: Record<string, string>;
  shadows: Record<string, string>;
  radii: Record<string, string>;
}

interface TypographyToken {
  fontFamily: string;
  fontSize: string;
  fontWeight: number;
  lineHeight: string;
  letterSpacing: string;
}

async function extractTokens(fileKey: string): Promise<DesignTokens> {
  const file = await api.getFile(fileKey);
  const tokens: DesignTokens = {
    colors: {},
    typography: {},
    spacing: {},
    shadows: {},
    radii: {},
  };
  
  // Extract from local styles
  if (file.styles) {
    const styleIds = Object.keys(file.styles);
    const styles = await api.getFileStyles(fileKey);
    
    for (const style of styles.meta.styles) {
      if (style.style_type === 'FILL') {
        // Extract color
        const node = findNodeById(file.document, style.node_id);
        if (node && 'fills' in node) {
          const fill = node.fills[0];
          if (fill.type === 'SOLID') {
            const { r, g, b, a } = fill.color;
            tokens.colors[style.name] = rgbaToHex(r, g, b, a);
          }
        }
      }
      
      if (style.style_type === 'TEXT') {
        const node = findNodeById(file.document, style.node_id);
        if (node && node.type === 'TEXT') {
          tokens.typography[style.name] = {
            fontFamily: node.style.fontFamily,
            fontSize: `${node.style.fontSize}px`,
            fontWeight: node.style.fontWeight,
            lineHeight: node.style.lineHeightPx
              ? `${node.style.lineHeightPx}px`
              : `${node.style.lineHeightPercentFontSize}%`,
            letterSpacing: `${node.style.letterSpacing}px`,
          };
        }
      }
      
      if (style.style_type === 'EFFECT') {
        const node = findNodeById(file.document, style.node_id);
        if (node && 'effects' in node) {
          const shadow = node.effects.find((e) => e.type === 'DROP_SHADOW');
          if (shadow) {
            tokens.shadows[style.name] = effectToCSS(shadow);
          }
        }
      }
    }
  }
  
  return tokens;
}

function rgbaToHex(r: number, g: number, b: number, a: number = 1): string {
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  return a < 1 ? `${hex}${toHex(a)}` : hex;
}

function effectToCSS(effect: any): string {
  const { offset, radius, color } = effect;
  const rgba = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a})`;
  return `${offset.x}px ${offset.y}px ${radius}px ${rgba}`;
}

function findNodeById(node: any, id: string): any {
  if (node.id === id) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  return null;
}
```

**Token to Tailwind Config:**

```typescript
// scripts/tokens-to-tailwind.ts
import { DesignTokens } from './extract-tokens';

function tokensToTailwind(tokens: DesignTokens) {
  return {
    theme: {
      extend: {
        colors: transformColors(tokens.colors),
        fontSize: transformTypography(tokens.typography),
        boxShadow: tokens.shadows,
        borderRadius: tokens.radii,
        spacing: tokens.spacing,
      },
    },
  };
}

function transformColors(colors: Record<string, string>) {
  const result: Record<string, any> = {};
  
  for (const [name, value] of Object.entries(colors)) {
    // Convert "Primary/500" to nested structure
    const parts = name.split('/');
    let current = result;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i].toLowerCase().replace(/\s+/g, '-');
      current[key] = current[key] || {};
      current = current[key];
    }
    
    const finalKey = parts[parts.length - 1].toLowerCase().replace(/\s+/g, '-');
    current[finalKey] = value;
  }
  
  return result;
}

function transformTypography(typography: Record<string, any>) {
  const result: Record<string, [string, { lineHeight: string; letterSpacing: string }]> = {};
  
  for (const [name, token] of Object.entries(typography)) {
    const key = name.toLowerCase().replace(/\s+/g, '-');
    result[key] = [
      token.fontSize,
      {
        lineHeight: token.lineHeight,
        letterSpacing: token.letterSpacing,
      },
    ];
  }
  
  return result;
}

// Generate CSS custom properties
function tokensToCSSVariables(tokens: DesignTokens): string {
  let css = ':root {\n';
  
  for (const [name, value] of Object.entries(tokens.colors)) {
    const varName = `--color-${name.toLowerCase().replace(/[/\s]+/g, '-')}`;
    css += `  ${varName}: ${value};\n`;
  }
  
  for (const [name, value] of Object.entries(tokens.spacing)) {
    const varName = `--spacing-${name.toLowerCase().replace(/[/\s]+/g, '-')}`;
    css += `  ${varName}: ${value};\n`;
  }
  
  for (const [name, value] of Object.entries(tokens.shadows)) {
    const varName = `--shadow-${name.toLowerCase().replace(/[/\s]+/g, '-')}`;
    css += `  ${varName}: ${value};\n`;
  }
  
  css += '}';
  return css;
}
```

**Best Practices:**
- Use consistent naming in Figma (kebab-case preferred)
- Organize colors by category (Primary/500, Gray/100)
- Export tokens on design changes via CI/CD
- Version token files alongside code
- Include semantic color mappings

**Gotchas:**
- Figma API rate limits (30 req/min)
- Color mode (RGB vs HSL) conversions
- Font weight mapping varies by font
- Line height units differ between tools

### 2. Auto-Layout to Flexbox/Grid

Convert Figma auto-layout to CSS.

**Auto-Layout Mapping:**

```typescript
// src/lib/figma/auto-layout.ts
interface FigmaAutoLayout {
  layoutMode: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
  primaryAxisSizingMode: 'FIXED' | 'AUTO';
  counterAxisSizingMode: 'FIXED' | 'AUTO';
  primaryAxisAlignItems: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
  counterAxisAlignItems: 'MIN' | 'CENTER' | 'MAX' | 'BASELINE';
  paddingLeft: number;
  paddingRight: number;
  paddingTop: number;
  paddingBottom: number;
  itemSpacing: number;
  layoutWrap: 'NO_WRAP' | 'WRAP';
}

function autoLayoutToCSS(layout: FigmaAutoLayout): Record<string, string> {
  const css: Record<string, string> = {};
  
  if (layout.layoutMode === 'NONE') {
    return css;
  }
  
  css.display = 'flex';
  css.flexDirection = layout.layoutMode === 'HORIZONTAL' ? 'row' : 'column';
  
  // Main axis alignment
  const justifyMap: Record<string, string> = {
    MIN: 'flex-start',
    CENTER: 'center',
    MAX: 'flex-end',
    SPACE_BETWEEN: 'space-between',
  };
  css.justifyContent = justifyMap[layout.primaryAxisAlignItems];
  
  // Cross axis alignment
  const alignMap: Record<string, string> = {
    MIN: 'flex-start',
    CENTER: 'center',
    MAX: 'flex-end',
    BASELINE: 'baseline',
  };
  css.alignItems = alignMap[layout.counterAxisAlignItems];
  
  // Gap
  if (layout.itemSpacing > 0) {
    css.gap = `${layout.itemSpacing}px`;
  }
  
  // Padding
  const { paddingTop, paddingRight, paddingBottom, paddingLeft } = layout;
  if (paddingTop === paddingBottom && paddingLeft === paddingRight) {
    if (paddingTop === paddingLeft) {
      css.padding = `${paddingTop}px`;
    } else {
      css.padding = `${paddingTop}px ${paddingLeft}px`;
    }
  } else {
    css.padding = `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`;
  }
  
  // Wrap
  if (layout.layoutWrap === 'WRAP') {
    css.flexWrap = 'wrap';
  }
  
  return css;
}

function autoLayoutToTailwind(layout: FigmaAutoLayout): string {
  const classes: string[] = [];
  
  if (layout.layoutMode === 'NONE') {
    return '';
  }
  
  classes.push('flex');
  classes.push(layout.layoutMode === 'HORIZONTAL' ? 'flex-row' : 'flex-col');
  
  // Main axis
  const justifyMap: Record<string, string> = {
    MIN: 'justify-start',
    CENTER: 'justify-center',
    MAX: 'justify-end',
    SPACE_BETWEEN: 'justify-between',
  };
  classes.push(justifyMap[layout.primaryAxisAlignItems]);
  
  // Cross axis
  const alignMap: Record<string, string> = {
    MIN: 'items-start',
    CENTER: 'items-center',
    MAX: 'items-end',
    BASELINE: 'items-baseline',
  };
  classes.push(alignMap[layout.counterAxisAlignItems]);
  
  // Gap (map to Tailwind scale)
  const gapValue = layout.itemSpacing;
  if (gapValue > 0) {
    const gapClass = mapToTailwindSpacing(gapValue);
    classes.push(`gap-${gapClass}`);
  }
  
  // Padding
  const pt = mapToTailwindSpacing(layout.paddingTop);
  const pr = mapToTailwindSpacing(layout.paddingRight);
  const pb = mapToTailwindSpacing(layout.paddingBottom);
  const pl = mapToTailwindSpacing(layout.paddingLeft);
  
  if (pt === pb && pl === pr && pt === pl) {
    classes.push(`p-${pt}`);
  } else if (pt === pb && pl === pr) {
    classes.push(`py-${pt}`, `px-${pl}`);
  } else {
    classes.push(`pt-${pt}`, `pr-${pr}`, `pb-${pb}`, `pl-${pl}`);
  }
  
  if (layout.layoutWrap === 'WRAP') {
    classes.push('flex-wrap');
  }
  
  return classes.join(' ');
}

function mapToTailwindSpacing(px: number): string {
  const scale: Record<number, string> = {
    0: '0', 1: 'px', 2: '0.5', 4: '1', 6: '1.5', 8: '2',
    10: '2.5', 12: '3', 14: '3.5', 16: '4', 20: '5',
    24: '6', 28: '7', 32: '8', 36: '9', 40: '10',
    44: '11', 48: '12', 56: '14', 64: '16', 80: '20',
    96: '24', 112: '28', 128: '32', 144: '36', 160: '40',
  };
  
  // Find closest match
  const closest = Object.keys(scale)
    .map(Number)
    .reduce((prev, curr) =>
      Math.abs(curr - px) < Math.abs(prev - px) ? curr : prev
    );
  
  return scale[closest];
}
```

**Best Practices:**
- Use auto-layout consistently in Figma designs
- Match Figma spacing to Tailwind scale (4px base)
- Use fill container for flexible children
- Set constraints for responsive behavior
- Document layout patterns in design system

**Gotchas:**
- Absolute positioning children break flow
- Nested auto-layout can get complex
- Fixed vs auto sizing affects responsiveness
- Gap doesn't support different row/column gaps

### 3. Responsive Implementation

Handle breakpoints and responsive design.

**Figma Breakpoint Detection:**

```typescript
// src/lib/figma/responsive.ts
interface FigmaFrame {
  name: string;
  width: number;
  children: any[];
}

interface ResponsiveVariant {
  breakpoint: string;
  minWidth: number;
  frame: FigmaFrame;
}

const breakpoints = {
  mobile: { minWidth: 0, maxWidth: 639 },
  tablet: { minWidth: 640, maxWidth: 1023 },
  desktop: { minWidth: 1024, maxWidth: 1279 },
  wide: { minWidth: 1280, maxWidth: Infinity },
};

function detectBreakpoint(width: number): string {
  for (const [name, range] of Object.entries(breakpoints)) {
    if (width >= range.minWidth && width <= range.maxWidth) {
      return name;
    }
  }
  return 'desktop';
}

function groupFramesByBreakpoint(frames: FigmaFrame[]): Map<string, FigmaFrame> {
  const grouped = new Map<string, FigmaFrame>();
  
  for (const frame of frames) {
    // Check if frame name indicates breakpoint
    const breakpointMatch = frame.name.match(/\[(mobile|tablet|desktop|wide)\]/i);
    
    if (breakpointMatch) {
      grouped.set(breakpointMatch[1].toLowerCase(), frame);
    } else {
      // Auto-detect from width
      const bp = detectBreakpoint(frame.width);
      if (!grouped.has(bp)) {
        grouped.set(bp, frame);
      }
    }
  }
  
  return grouped;
}

function generateResponsiveClasses(
  variants: Map<string, Record<string, string>>
): string {
  const classes: string[] = [];
  
  // Mobile-first approach
  const mobileClasses = variants.get('mobile');
  if (mobileClasses) {
    classes.push(...Object.values(mobileClasses));
  }
  
  // Tablet overrides
  const tabletClasses = variants.get('tablet');
  if (tabletClasses) {
    for (const cls of Object.values(tabletClasses)) {
      classes.push(`sm:${cls}`);
    }
  }
  
  // Desktop overrides
  const desktopClasses = variants.get('desktop');
  if (desktopClasses) {
    for (const cls of Object.values(desktopClasses)) {
      classes.push(`lg:${cls}`);
    }
  }
  
  // Wide overrides
  const wideClasses = variants.get('wide');
  if (wideClasses) {
    for (const cls of Object.values(wideClasses)) {
      classes.push(`xl:${cls}`);
    }
  }
  
  return classes.join(' ');
}
```

**Responsive Component Template:**

```typescript
// Generated component with responsive variants
interface HeroSectionProps {
  title: string;
  subtitle: string;
  ctaText: string;
}

export function HeroSection({ title, subtitle, ctaText }: HeroSectionProps) {
  return (
    <section className="
      flex flex-col items-center text-center
      px-4 py-12
      sm:px-6 sm:py-16
      lg:px-8 lg:py-24
      xl:py-32
    ">
      <h1 className="
        text-3xl font-bold
        sm:text-4xl
        lg:text-5xl
        xl:text-6xl
      ">
        {title}
      </h1>
      <p className="
        mt-4 text-lg text-gray-600 max-w-xl
        sm:mt-6 sm:text-xl
        lg:max-w-2xl
      ">
        {subtitle}
      </p>
      <button className="
        mt-8 px-6 py-3 bg-blue-500 text-white rounded-lg
        sm:px-8 sm:py-4 sm:text-lg
      ">
        {ctaText}
      </button>
    </section>
  );
}
```

**Best Practices:**
- Design mobile-first in Figma
- Use consistent breakpoint naming convention
- Create component variants for each breakpoint
- Test with real content at all sizes
- Document breakpoint behavior

**Gotchas:**
- Figma frames don't inherently have breakpoint metadata
- Component variants may need manual mapping
- Font sizes need responsive scaling
- Images may need different crops per breakpoint

### 4. Asset Export Workflow

Export and optimize assets from Figma.

**Asset Export Script:**

```typescript
// scripts/export-assets.ts
import * as Figma from 'figma-api';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const api = new Figma.Api({ personalAccessToken: process.env.FIGMA_TOKEN! });

interface ExportConfig {
  fileKey: string;
  pageNames?: string[];
  outputDir: string;
  formats: ('svg' | 'png' | 'webp')[];
  scales?: number[];
}

async function exportAssets(config: ExportConfig) {
  const { fileKey, pageNames, outputDir, formats, scales = [1, 2] } = config;
  
  const file = await api.getFile(fileKey);
  const exportableNodes: string[] = [];
  
  // Find exportable components
  function findExportables(node: any) {
    // Check if node is marked for export
    if (node.exportSettings?.length > 0 || node.type === 'COMPONENT') {
      exportableNodes.push(node.id);
    }
    
    if (node.children) {
      for (const child of node.children) {
        findExportables(child);
      }
    }
  }
  
  for (const page of file.document.children) {
    if (!pageNames || pageNames.includes(page.name)) {
      findExportables(page);
    }
  }
  
  console.log(`Found ${exportableNodes.length} exportable nodes`);
  
  // Export in batches (API limit)
  const batchSize = 50;
  for (let i = 0; i < exportableNodes.length; i += batchSize) {
    const batch = exportableNodes.slice(i, i + batchSize);
    
    for (const format of formats) {
      for (const scale of format === 'svg' ? [1] : scales) {
        const images = await api.getImage(fileKey, {
          ids: batch.join(','),
          format,
          scale,
        });
        
        // Download and save images
        for (const [nodeId, url] of Object.entries(images.images)) {
          if (!url) continue;
          
          const node = findNodeById(file.document, nodeId);
          const fileName = sanitizeFileName(node?.name || nodeId);
          const suffix = scale > 1 ? `@${scale}x` : '';
          const filePath = path.join(outputDir, `${fileName}${suffix}.${format}`);
          
          await downloadFile(url, filePath);
          
          // Optimize if PNG
          if (format === 'png') {
            await optimizePng(filePath);
          }
        }
      }
    }
  }
}

async function downloadFile(url: string, filePath: string) {
  const response = await fetch(url);
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);
}

async function optimizePng(filePath: string) {
  const buffer = await fs.readFile(filePath);
  const optimized = await sharp(buffer)
    .png({ quality: 80, compressionLevel: 9 })
    .toBuffer();
  await fs.writeFile(filePath, optimized);
}

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
```

**Icon Component Generator:**

```typescript
// scripts/generate-icons.ts
import fs from 'fs/promises';
import path from 'path';
import { transform } from '@svgr/core';

async function generateIconComponents(svgDir: string, outputDir: string) {
  const files = await fs.readdir(svgDir);
  const svgFiles = files.filter((f) => f.endsWith('.svg'));
  
  const exports: string[] = [];
  
  for (const file of svgFiles) {
    const svgContent = await fs.readFile(path.join(svgDir, file), 'utf-8');
    const componentName = toPascalCase(path.basename(file, '.svg')) + 'Icon';
    
    const jsxCode = await transform(
      svgContent,
      {
        plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
        typescript: true,
        icon: true,
        svgProps: {
          width: '{size}',
          height: '{size}',
          className: '{className}',
        },
        template: iconTemplate,
      },
      { componentName }
    );
    
    await fs.writeFile(
      path.join(outputDir, `${componentName}.tsx`),
      jsxCode
    );
    
    exports.push(`export { ${componentName} } from './${componentName}';`);
  }
  
  // Generate index file
  await fs.writeFile(
    path.join(outputDir, 'index.ts'),
    exports.join('\n')
  );
}

function iconTemplate({ componentName, jsx }, { tpl }) {
  return tpl`
import { SVGProps } from 'react';

interface ${componentName}Props extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

export function ${componentName}({ size = 24, className, ...props }: ${componentName}Props) {
  return ${jsx};
}
`;
}

function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}
```

**Best Practices:**
- Use consistent naming for exportable components
- Export SVG for icons, WebP for images
- Generate 2x assets for retina displays
- Automate exports in CI pipeline
- Optimize all exported images

**Gotchas:**
- Large files hit API rate limits
- SVG export may include hidden layers
- Color profiles can affect output
- Batch export has memory limits

### 5. Component Generation

Generate React components from Figma.

**Component Analyzer:**

```typescript
// src/lib/figma/component-analyzer.ts
interface FigmaComponent {
  id: string;
  name: string;
  type: 'COMPONENT' | 'COMPONENT_SET';
  children: any[];
  componentPropertyDefinitions?: Record<string, any>;
}

interface ComponentAnalysis {
  name: string;
  props: PropDefinition[];
  variants: VariantDefinition[];
  structure: ElementStructure;
}

interface PropDefinition {
  name: string;
  type: 'string' | 'boolean' | 'enum';
  options?: string[];
  defaultValue?: any;
}

interface VariantDefinition {
  name: string;
  values: string[];
}

interface ElementStructure {
  type: string;
  name: string;
  styles: Record<string, string>;
  children: ElementStructure[];
}

function analyzeComponent(component: FigmaComponent): ComponentAnalysis {
  const analysis: ComponentAnalysis = {
    name: toPascalCase(component.name),
    props: [],
    variants: [],
    structure: analyzeStructure(component),
  };
  
  // Extract props from component properties
  if (component.componentPropertyDefinitions) {
    for (const [key, def] of Object.entries(component.componentPropertyDefinitions)) {
      if (def.type === 'TEXT') {
        analysis.props.push({
          name: toCamelCase(key),
          type: 'string',
          defaultValue: def.defaultValue,
        });
      } else if (def.type === 'BOOLEAN') {
        analysis.props.push({
          name: toCamelCase(key),
          type: 'boolean',
          defaultValue: def.defaultValue,
        });
      } else if (def.type === 'VARIANT') {
        analysis.variants.push({
          name: toCamelCase(key),
          values: def.variantOptions || [],
        });
      }
    }
  }
  
  return analysis;
}

function analyzeStructure(node: any): ElementStructure {
  const element: ElementStructure = {
    type: mapNodeTypeToElement(node.type),
    name: node.name,
    styles: extractStyles(node),
    children: [],
  };
  
  if (node.children) {
    element.children = node.children
      .filter((child) => child.visible !== false)
      .map(analyzeStructure);
  }
  
  return element;
}

function mapNodeTypeToElement(type: string): string {
  const mapping: Record<string, string> = {
    FRAME: 'div',
    GROUP: 'div',
    TEXT: 'span',
    RECTANGLE: 'div',
    ELLIPSE: 'div',
    VECTOR: 'svg',
    INSTANCE: 'Component',
  };
  return mapping[type] || 'div';
}

function extractStyles(node: any): Record<string, string> {
  const styles: Record<string, string> = {};
  
  // Background
  if (node.fills?.length > 0) {
    const fill = node.fills[0];
    if (fill.type === 'SOLID' && fill.visible !== false) {
      styles.backgroundColor = rgbaToHex(
        fill.color.r,
        fill.color.g,
        fill.color.b,
        fill.color.a * (fill.opacity || 1)
      );
    }
  }
  
  // Border
  if (node.strokes?.length > 0) {
    const stroke = node.strokes[0];
    if (stroke.visible !== false) {
      styles.borderColor = rgbaToHex(
        stroke.color.r,
        stroke.color.g,
        stroke.color.b
      );
      styles.borderWidth = `${node.strokeWeight || 1}px`;
      styles.borderStyle = 'solid';
    }
  }
  
  // Border radius
  if (node.cornerRadius) {
    styles.borderRadius = `${node.cornerRadius}px`;
  }
  
  // Dimensions
  if (node.absoluteBoundingBox) {
    styles.width = `${node.absoluteBoundingBox.width}px`;
    styles.height = `${node.absoluteBoundingBox.height}px`;
  }
  
  return styles;
}
```

**Component Code Generator:**

```typescript
// src/lib/figma/code-generator.ts
import { ComponentAnalysis, ElementStructure } from './component-analyzer';

function generateComponent(analysis: ComponentAnalysis): string {
  const { name, props, variants, structure } = analysis;
  
  // Generate interface
  const interfaceCode = generateInterface(name, props, variants);
  
  // Generate component body
  const componentCode = generateComponentBody(name, props, variants, structure);
  
  return `
import { cn } from '@/lib/utils';

${interfaceCode}

${componentCode}
`;
}

function generateInterface(
  name: string,
  props: PropDefinition[],
  variants: VariantDefinition[]
): string {
  const lines = [`interface ${name}Props {`];
  
  for (const prop of props) {
    const optional = prop.defaultValue !== undefined ? '?' : '';
    lines.push(`  ${prop.name}${optional}: ${prop.type};`);
  }
  
  for (const variant of variants) {
    const union = variant.values.map((v) => `'${v}'`).join(' | ');
    lines.push(`  ${variant.name}?: ${union};`);
  }
  
  lines.push('  className?: string;');
  lines.push('}');
  
  return lines.join('\n');
}

function generateComponentBody(
  name: string,
  props: PropDefinition[],
  variants: VariantDefinition[],
  structure: ElementStructure
): string {
  const propsList = [...props.map((p) => p.name), ...variants.map((v) => v.name), 'className'];
  const defaultProps = props
    .filter((p) => p.defaultValue !== undefined)
    .map((p) => `${p.name} = ${JSON.stringify(p.defaultValue)}`)
    .concat(variants.map((v) => `${v.name} = '${v.values[0]}'`))
    .join(', ');
  
  return `
export function ${name}({ ${propsList.join(', ')}${defaultProps ? ` = { ${defaultProps} }` : ''} }: ${name}Props) {
  return (
    ${generateJSX(structure, 2)}
  );
}
`;
}

function generateJSX(element: ElementStructure, indent: number): string {
  const spaces = ' '.repeat(indent);
  const { type, styles, children } = element;
  
  const className = stylesToTailwind(styles);
  const classAttr = className ? ` className="${className}"` : '';
  
  if (children.length === 0) {
    return `${spaces}<${type}${classAttr} />`;
  }
  
  const childrenJSX = children
    .map((child) => generateJSX(child, indent + 2))
    .join('\n');
  
  return `${spaces}<${type}${classAttr}>\n${childrenJSX}\n${spaces}</${type}>`;
}

function stylesToTailwind(styles: Record<string, string>): string {
  const classes: string[] = [];
  
  // Map common styles to Tailwind classes
  // This is a simplified example
  if (styles.backgroundColor) {
    classes.push(`bg-[${styles.backgroundColor}]`);
  }
  
  if (styles.borderRadius) {
    const px = parseInt(styles.borderRadius);
    classes.push(mapToTailwindRadius(px));
  }
  
  return classes.join(' ');
}
```

**Best Practices:**
- Use component properties in Figma for props
- Create component sets for variants
- Name layers semantically
- Use auto-layout for all components
- Document component usage in Figma

**Gotchas:**
- Complex gradients need manual handling
- Blend modes don't map directly to CSS
- Instance overrides need special handling
- Generated code needs review and cleanup

## Real-World Examples

### Example 1: Design System Sync

```typescript
// scripts/sync-design-system.ts
import { extractTokens } from './extract-tokens';
import { exportAssets } from './export-assets';
import fs from 'fs/promises';

const FILE_KEY = process.env.FIGMA_FILE_KEY!;

async function syncDesignSystem() {
  console.log('Syncing design system from Figma...');
  
  // 1. Extract tokens
  console.log('Extracting tokens...');
  const tokens = await extractTokens(FILE_KEY);
  
  // 2. Generate Tailwind config
  const tailwindConfig = tokensToTailwind(tokens);
  await fs.writeFile(
    'tailwind.tokens.js',
    `module.exports = ${JSON.stringify(tailwindConfig, null, 2)}`
  );
  
  // 3. Generate CSS variables
  const cssVars = tokensToCSSVariables(tokens);
  await fs.writeFile('src/styles/tokens.css', cssVars);
  
  // 4. Export icons
  console.log('Exporting icons...');
  await exportAssets({
    fileKey: FILE_KEY,
    pageNames: ['Icons'],
    outputDir: 'public/icons',
    formats: ['svg'],
  });
  
  // 5. Generate icon components
  console.log('Generating icon components...');
  await generateIconComponents(
    'public/icons',
    'src/components/icons'
  );
  
  console.log('Design system sync complete!');
}

syncDesignSystem().catch(console.error);
```

### Example 2: Component Preview

```typescript
// src/app/api/figma/preview/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as Figma from 'figma-api';

const api = new Figma.Api({ personalAccessToken: process.env.FIGMA_TOKEN! });

export async function GET(request: NextRequest) {
  const nodeId = request.nextUrl.searchParams.get('nodeId');
  const fileKey = request.nextUrl.searchParams.get('fileKey');
  
  if (!nodeId || !fileKey) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }
  
  try {
    // Get preview image
    const images = await api.getImage(fileKey, {
      ids: nodeId,
      format: 'png',
      scale: 2,
    });
    
    const imageUrl = images.images[nodeId];
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }
    
    // Fetch and return image
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch preview' }, { status: 500 });
  }
}
```

## Related Skills

- **design-system-architect** - Building design systems
- **tailwind-expert** - Tailwind CSS mastery
- **react-components** - Component patterns
- **svg-optimization** - Icon optimization

## Further Reading

- [Figma REST API](https://www.figma.com/developers/api)
- [Figma Plugin API](https://www.figma.com/plugin-docs/)
- [Design Tokens W3C](https://design-tokens.github.io/community-group/format/)
- [SVGR](https://react-svgr.com/)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
