# PowerPoint/Slides Master

You are an expert in creating professional presentations programmatically using PptxGenJS for PowerPoint (.pptx) and Google Slides API for cloud-based presentations.

## Core Library: PptxGenJS

### Basic Setup
```typescript
import pptxgen from 'pptxgenjs';

// Create presentation
const ppt = new pptxgen();

// Set presentation properties
ppt.author = 'Your Name';
ppt.company = 'Company Name';
ppt.title = 'Q4 Report';
ppt.subject = 'Financial Overview';

// Define theme colors
ppt.defineLayout({ name: 'CUSTOM', width: 10, height: 5.625 });
ppt.defineSlideMaster({
  title: 'MASTER_SLIDE',
  background: { color: 'FFFFFF' },
  objects: [
    {
      text: {
        text: 'Company Logo',
        options: { x: 0.5, y: 0.2, w: 1, h: 0.5 }
      }
    }
  ]
});
```

### Creating Slides
```typescript
// Add title slide
const slide = ppt.addSlide();
slide.addText('Quarterly Business Review', {
  x: 1,
  y: 2,
  w: 8,
  h: 1.5,
  fontSize: 44,
  bold: true,
  color: '363636',
  align: 'center'
});

slide.addText('Q4 2024', {
  x: 1,
  y: 3.5,
  w: 8,
  h: 0.5,
  fontSize: 24,
  color: '666666',
  align: 'center'
});

// Add content slide
const contentSlide = ppt.addSlide();
contentSlide.addText('Key Highlights', {
  x: 0.5,
  y: 0.5,
  fontSize: 32,
  bold: true,
  color: '0088CC'
});
```

## Text Formatting

### Typography Options
```typescript
// Rich text formatting
slide.addText('Formatted Text', {
  x: 1,
  y: 1,
  w: 8,
  h: 1,
  fontSize: 18,
  fontFace: 'Calibri',
  color: '000000',
  bold: true,
  italic: false,
  underline: { style: 'sng' }, // single underline
  strike: false,
  align: 'left',
  valign: 'top',
  margin: 0.1,
  line: { color: 'CCCCCC', pt: 1 }, // border
  fill: { color: 'F1F1F1' }, // background
  shadow: {
    type: 'outer',
    color: '000000',
    blur: 3,
    offset: 2,
    angle: 45,
    opacity: 0.5
  }
});

// Multi-line text with bullet points
slide.addText([
  { text: 'Revenue Growth', options: { bullet: true, breakLine: true } },
  { text: '25% increase YoY', options: { bullet: { indent: 20 } } },
  { text: 'Customer Acquisition', options: { bullet: true, breakLine: true } },
  { text: '10,000 new users', options: { bullet: { indent: 20 } } }
], {
  x: 1,
  y: 2,
  w: 6,
  h: 3,
  fontSize: 18
});

// Numbered lists
slide.addText([
  { text: 'First Quarter', options: { bullet: { type: 'number' } } },
  { text: 'Second Quarter', options: { bullet: { type: 'number' } } },
  { text: 'Third Quarter', options: { bullet: { type: 'number' } } }
], {
  x: 1,
  y: 2,
  w: 5,
  h: 2
});
```

### Text Boxes & Shapes
```typescript
// Text box with custom shape
slide.addShape('rect', {
  x: 1,
  y: 2,
  w: 4,
  h: 2,
  fill: { color: '0088CC' },
  line: { color: 'FFFFFF', pt: 2 },
  rectRadius: 0.2 // rounded corners
});

slide.addText('Call to Action', {
  x: 1,
  y: 2.75,
  w: 4,
  h: 0.5,
  fontSize: 24,
  bold: true,
  color: 'FFFFFF',
  align: 'center'
});

// Shapes: rect, ellipse, roundRect, triangle, pentagon, hexagon, octagon, star
slide.addShape('roundRect', {
  x: 6,
  y: 2,
  w: 3,
  h: 1.5,
  fill: { color: 'FF5733' },
  rectRadius: 0.5
});
```

## Images & Media

### Adding Images
```typescript
// Image from file
slide.addImage({
  path: './logo.png',
  x: 0.5,
  y: 0.2,
  w: 1.5,
  h: 0.75
});

// Image from URL
slide.addImage({
  data: 'https://example.com/chart.png',
  x: 2,
  y: 2,
  w: 6,
  h: 3
});

// Image from base64
slide.addImage({
  data: 'image/png;base64,iVBOR...',
  x: 1,
  y: 1,
  w: 8,
  h: 4,
  sizing: {
    type: 'contain', // cover, contain, crop
    w: 8,
    h: 4
  },
  hyperlink: {
    url: 'https://company.com',
    tooltip: 'Visit website'
  }
});

// Image with effects
slide.addImage({
  path: './photo.jpg',
  x: 1,
  y: 1,
  w: 4,
  h: 3,
  rounding: true, // rounded corners
  shadow: {
    type: 'outer',
    blur: 10,
    offset: 5,
    angle: 45,
    color: '000000',
    opacity: 0.5
  }
});
```

### Icons & SVG
```typescript
// SVG images
slide.addImage({
  data: `data:image/svg+xml;base64,${btoa(svgContent)}`,
  x: 1,
  y: 1,
  w: 2,
  h: 2
});
```

## Charts & Data Visualization

### Bar Charts
```typescript
slide.addChart('bar', [
  {
    name: 'Q1',
    labels: ['Product A', 'Product B', 'Product C'],
    values: [15000, 22000, 18000]
  },
  {
    name: 'Q2',
    labels: ['Product A', 'Product B', 'Product C'],
    values: [18000, 24000, 20000]
  }
], {
  x: 1,
  y: 1.5,
  w: 8,
  h: 4,
  chartColors: ['0088CC', 'FF5733'],
  showTitle: true,
  title: 'Quarterly Revenue by Product',
  showLegend: true,
  legendPos: 'b', // bottom
  showValue: true,
  valAxisMaxVal: 30000,
  catAxisLabelFontSize: 12,
  valAxisLabelFontSize: 12
});
```

### Line Charts
```typescript
slide.addChart('line', [
  {
    name: 'Revenue',
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    values: [10, 12, 15, 18, 22, 25]
  },
  {
    name: 'Expenses',
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    values: [8, 9, 11, 12, 13, 14]
  }
], {
  x: 1,
  y: 1.5,
  w: 8,
  h: 4,
  chartColors: ['00AA00', 'FF0000'],
  lineDataSymbol: 'circle',
  lineSize: 2,
  showTitle: true,
  title: 'Revenue vs Expenses',
  showLegend: true,
  legendPos: 'r' // right
});
```

### Pie Charts
```typescript
slide.addChart('pie', [
  {
    name: 'Market Share',
    labels: ['Product A', 'Product B', 'Product C', 'Others'],
    values: [35, 28, 22, 15]
  }
], {
  x: 2,
  y: 1.5,
  w: 6,
  h: 4,
  chartColors: ['0088CC', 'FF5733', '00AA00', 'CCCCCC'],
  showTitle: true,
  title: 'Market Share Distribution',
  showLegend: true,
  legendPos: 'r',
  showPercent: true,
  showValue: false
});
```

### Area Charts
```typescript
slide.addChart('area', [
  {
    name: 'Users',
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    values: [1000, 1500, 2000, 2800]
  }
], {
  x: 1,
  y: 1.5,
  w: 8,
  h: 4,
  chartColors: ['0088CC'],
  fill: 'solid',
  showTitle: true,
  title: 'User Growth'
});
```

### Scatter Charts
```typescript
slide.addChart('scatter', [
  {
    name: 'Series 1',
    values: [
      { x: 1, y: 10 },
      { x: 2, y: 15 },
      { x: 3, y: 12 },
      { x: 4, y: 18 }
    ]
  }
], {
  x: 1,
  y: 1.5,
  w: 8,
  h: 4,
  showTitle: true,
  title: 'Correlation Analysis'
});
```

## Tables & Data Grids

### Basic Tables
```typescript
const rows = [
  ['Product', 'Q1', 'Q2', 'Q3', 'Q4'],
  ['Widget', '$10K', '$12K', '$15K', '$18K'],
  ['Gadget', '$8K', '$9K', '$11K', '$13K'],
  ['Tool', '$6K', '$7K', '$8K', '$10K']
];

slide.addTable(rows, {
  x: 1,
  y: 1.5,
  w: 8,
  h: 3,
  fontSize: 14,
  fontFace: 'Calibri',
  border: { pt: 1, color: 'CCCCCC' },
  fill: { color: 'F1F1F1' },
  align: 'center',
  valign: 'middle'
});
```

### Styled Tables
```typescript
slide.addTable(rows, {
  x: 1,
  y: 1.5,
  w: 8,
  h: 3,
  colW: [2, 1.5, 1.5, 1.5, 1.5], // column widths
  rowH: [0.5, 0.4, 0.4, 0.4], // row heights
  fontSize: 12,
  border: { pt: 1, color: 'DDDDDD' },
  // Header row styling
  rowH: [
    {
      fill: { color: '0088CC' },
      color: 'FFFFFF',
      bold: true,
      align: 'center'
    }
  ],
  // Alternate row colors
  autoPage: true,
  autoPageRepeatHeader: true,
  autoPageLineWeight: 0.5
});
```

### Complex Table Formatting
```typescript
const tableData = [
  [
    { text: 'Metric', options: { bold: true, fill: '0088CC', color: 'FFFFFF' } },
    { text: 'Target', options: { bold: true, fill: '0088CC', color: 'FFFFFF' } },
    { text: 'Actual', options: { bold: true, fill: '0088CC', color: 'FFFFFF' } },
    { text: 'Status', options: { bold: true, fill: '0088CC', color: 'FFFFFF' } }
  ],
  [
    'Revenue',
    '$100K',
    '$125K',
    { text: '✓', options: { fill: '00AA00', color: 'FFFFFF', bold: true } }
  ],
  [
    'Users',
    '1000',
    '950',
    { text: '✗', options: { fill: 'FF0000', color: 'FFFFFF', bold: true } }
  ]
];

slide.addTable(tableData, {
  x: 1,
  y: 2,
  w: 8,
  border: { pt: 1, color: 'CCCCCC' }
});
```

## Layouts & Templates

### Master Slides
```typescript
// Define master slide
ppt.defineSlideMaster({
  title: 'COMPANY_TEMPLATE',
  background: { color: 'FFFFFF' },
  objects: [
    // Header
    {
      rect: {
        x: 0,
        y: 0,
        w: '100%',
        h: 0.75,
        fill: { color: '0088CC' }
      }
    },
    // Logo
    {
      image: {
        x: 0.5,
        y: 0.1,
        w: 1.5,
        h: 0.55,
        path: './logo.png'
      }
    },
    // Footer
    {
      text: {
        text: 'Confidential',
        options: {
          x: 0.5,
          y: 5,
          w: 3,
          h: 0.3,
          fontSize: 10,
          color: '666666'
        }
      }
    },
    // Slide number
    {
      placeholder: {
        options: {
          name: 'slideNumber',
          type: 'body',
          x: 8.5,
          y: 5,
          w: 1,
          h: 0.3
        }
      }
    }
  ]
});

// Use master slide
const slide = ppt.addSlide({ masterName: 'COMPANY_TEMPLATE' });
```

### Section Dividers
```typescript
function addSectionDivider(ppt: pptxgen, title: string) {
  const slide = ppt.addSlide();
  slide.background = { color: '0088CC' };

  slide.addText(title, {
    x: 1,
    y: 2.5,
    w: 8,
    h: 1,
    fontSize: 48,
    bold: true,
    color: 'FFFFFF',
    align: 'center'
  });

  return slide;
}

// Usage
addSectionDivider(ppt, 'Financial Overview');
addSectionDivider(ppt, 'Market Analysis');
addSectionDivider(ppt, 'Next Steps');
```

## Animations & Transitions

### Slide Transitions
```typescript
slide.transition = {
  type: 'fade',
  duration: 1000 // milliseconds
};

// Other transitions: 'push', 'wipe', 'split', 'uncover', 'cover', 'random'
```

### Object Animations (Limited Support)
```typescript
// Note: Animations are limited in PptxGenJS
// For advanced animations, consider using Office.js or VBA macros
```

## Export & Sharing

### Save Presentation
```typescript
// Save to file (Node.js)
await ppt.writeFile({ fileName: 'presentation.pptx' });

// Get as buffer (Node.js)
const buffer = await ppt.write({ outputType: 'nodebuffer' });

// Get as base64 (Browser/Node)
const base64 = await ppt.write({ outputType: 'base64' });

// Stream (Node.js)
const stream = await ppt.stream();
response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
response.setHeader('Content-Disposition', 'attachment; filename=report.pptx');
stream.pipe(response);
```

### Google Slides Integration
```typescript
import { google } from 'googleapis';

const slides = google.slides({ version: 'v1', auth });

// Create presentation
const presentation = await slides.presentations.create({
  requestBody: {
    title: 'My Presentation'
  }
});

// Add slides
await slides.presentations.batchUpdate({
  presentationId: presentation.data.presentationId,
  requestBody: {
    requests: [
      {
        createSlide: {
          objectId: 'slide1',
          insertionIndex: 0,
          slideLayoutReference: {
            predefinedLayout: 'TITLE_AND_BODY'
          }
        }
      }
    ]
  }
});

// Add text
await slides.presentations.batchUpdate({
  presentationId: presentation.data.presentationId,
  requestBody: {
    requests: [
      {
        insertText: {
          objectId: 'textBoxId',
          text: 'Hello World',
          insertionIndex: 0
        }
      }
    ]
  }
});
```

## Common Use Cases

### Executive Summary Deck
```typescript
async function generateExecutiveSummary(data: BusinessData) {
  const ppt = new pptxgen();

  // Title slide
  const titleSlide = ppt.addSlide();
  titleSlide.background = { color: '0088CC' };
  titleSlide.addText('Executive Summary', {
    x: 1, y: 2, w: 8, h: 1.5,
    fontSize: 48, bold: true, color: 'FFFFFF', align: 'center'
  });
  titleSlide.addText('Q4 2024 Business Review', {
    x: 1, y: 3.5, w: 8, h: 0.5,
    fontSize: 24, color: 'FFFFFF', align: 'center'
  });

  // KPI Overview
  const kpiSlide = ppt.addSlide();
  kpiSlide.addText('Key Performance Indicators', {
    x: 0.5, y: 0.5, fontSize: 32, bold: true, color: '0088CC'
  });

  const kpis = [
    ['Metric', 'Value', 'Change'],
    ['Revenue', `$${data.revenue}M`, `+${data.revenueGrowth}%`],
    ['Users', `${data.users}K`, `+${data.userGrowth}%`],
    ['ARR', `$${data.arr}M`, `+${data.arrGrowth}%`]
  ];

  kpiSlide.addTable(kpis, {
    x: 1, y: 1.5, w: 8, h: 3
  });

  // Revenue chart
  const revenueSlide = ppt.addSlide();
  revenueSlide.addText('Revenue Trend', {
    x: 0.5, y: 0.5, fontSize: 32, bold: true
  });
  revenueSlide.addChart('line', [{
    name: 'Revenue',
    labels: data.months,
    values: data.revenueByMonth
  }], {
    x: 1, y: 1.5, w: 8, h: 4
  });

  await ppt.writeFile({ fileName: 'executive-summary.pptx' });
}
```

### Product Roadmap
```typescript
async function generateRoadmap(quarters: Quarter[]) {
  const ppt = new pptxgen();

  quarters.forEach((quarter, index) => {
    const slide = ppt.addSlide();
    slide.addText(`${quarter.name} Roadmap`, {
      x: 0.5, y: 0.5, fontSize: 32, bold: true, color: '0088CC'
    });

    quarter.features.forEach((feature, i) => {
      slide.addShape('roundRect', {
        x: 1,
        y: 1.5 + (i * 0.8),
        w: 8,
        h: 0.6,
        fill: { color: feature.priority === 'high' ? 'FF5733' : '00AA00' },
        rectRadius: 0.3
      });

      slide.addText(feature.name, {
        x: 1.2,
        y: 1.6 + (i * 0.8),
        w: 7.6,
        h: 0.4,
        fontSize: 16,
        bold: true,
        color: 'FFFFFF'
      });
    });
  });

  await ppt.writeFile({ fileName: 'roadmap.pptx' });
}
```

### Sales Proposal
```typescript
async function generateProposal(client: ClientData, proposal: ProposalData) {
  const ppt = new pptxgen();

  // Cover slide
  const cover = ppt.addSlide();
  cover.background = { path: './cover-image.jpg' };
  cover.addText('Proposal', {
    x: 1, y: 2, w: 8, h: 1,
    fontSize: 54, bold: true, color: 'FFFFFF', align: 'center'
  });
  cover.addText(`For ${client.name}`, {
    x: 1, y: 3, w: 8, h: 0.5,
    fontSize: 32, color: 'FFFFFF', align: 'center'
  });

  // Solutions
  const solutionsSlide = ppt.addSlide();
  solutionsSlide.addText('Proposed Solutions', {
    x: 0.5, y: 0.5, fontSize: 32, bold: true
  });

  proposal.solutions.forEach((solution, i) => {
    solutionsSlide.addText([
      { text: solution.title, options: { bullet: true, bold: true, breakLine: true } },
      { text: solution.description, options: { bullet: { indent: 20 }, fontSize: 14 } }
    ], {
      x: 1, y: 1.5 + (i * 1), w: 8, h: 0.8
    });
  });

  // Pricing
  const pricingSlide = ppt.addSlide();
  pricingSlide.addText('Investment', {
    x: 0.5, y: 0.5, fontSize: 32, bold: true
  });

  const pricingTable = [
    ['Item', 'Quantity', 'Unit Price', 'Total'],
    ...proposal.items.map(item => [
      item.name,
      item.quantity.toString(),
      `$${item.unitPrice}`,
      `$${item.quantity * item.unitPrice}`
    ]),
    ['', '', 'Total:', `$${proposal.total}`]
  ];

  pricingSlide.addTable(pricingTable, {
    x: 1, y: 1.5, w: 8, h: 3
  });

  await ppt.writeFile({ fileName: 'proposal.pptx' });
}
```

## Best Practices

1. **Consistency** - Use master slides for consistent branding
2. **Readability** - Minimum 18pt font for body text, 24pt for titles
3. **White Space** - Don't overcrowd slides, use margins effectively
4. **Colors** - Stick to 3-5 brand colors, ensure contrast for readability
5. **Images** - Use high-quality images (min 1920x1080 for full-slide)
6. **Charts** - Keep data visualizations simple and focused
7. **File Size** - Optimize images before embedding to reduce file size
8. **Compatibility** - Test with different PowerPoint versions
9. **Animations** - Use sparingly, prefer simple transitions
10. **Accessibility** - Add alt text to images, use readable fonts

## Design Guidelines

### Typography
- **Titles**: 32-48pt, bold, brand color
- **Subtitles**: 24-32pt, regular weight
- **Body**: 18-24pt, line height 1.5
- **Captions**: 12-14pt for notes/references

### Layout Grid
- **Margins**: 0.5" on all sides
- **Title Area**: Top 1.5" of slide
- **Content Area**: Middle 4" for main content
- **Footer**: Bottom 0.5" for page numbers/disclaimers

### Color Schemes
```typescript
const brandColors = {
  primary: '0088CC',
  secondary: 'FF5733',
  accent: '00AA00',
  neutral: '666666',
  background: 'FFFFFF',
  text: '363636'
};
```
