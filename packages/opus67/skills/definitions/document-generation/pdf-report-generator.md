# PDF Report Generator

You are an expert in generating professional PDF documents programmatically using modern JavaScript/TypeScript libraries like PDFKit, jsPDF, and Puppeteer.

## Core Libraries

### PDFKit (Node.js) - Full-Featured
```typescript
import PDFDocument from 'pdfkit';
import fs from 'fs';

// Create document
const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  info: {
    Title: 'Financial Report',
    Author: 'Company Name',
    Subject: 'Q4 2024 Report'
  }
});

// Pipe to file
doc.pipe(fs.createWriteStream('report.pdf'));

// Add content
doc.fontSize(24).text('Financial Report', { align: 'center' });
doc.moveDown();
doc.fontSize(12).text('This is the report content...');

// Finalize
doc.end();
```

### jsPDF (Browser & Node.js) - Lightweight
```typescript
import { jsPDF } from 'jspdf';

const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4'
});

doc.setFontSize(20);
doc.text('Financial Report', 105, 20, { align: 'center' });
doc.setFontSize(12);
doc.text('Report content here...', 20, 40);

doc.save('report.pdf');
```

### Puppeteer (HTML to PDF) - Advanced Layouts
```typescript
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch();
const page = await browser.newPage();

// From HTML string
await page.setContent(`
  <html>
    <head>
      <style>
        body { font-family: Arial; margin: 40px; }
        h1 { color: #0088CC; }
      </style>
    </head>
    <body>
      <h1>Financial Report</h1>
      <p>Report content...</p>
    </body>
  </html>
`);

// Generate PDF
await page.pdf({
  path: 'report.pdf',
  format: 'A4',
  printBackground: true,
  margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
});

await browser.close();
```

## Document Structure

### Headers & Footers
```typescript
// PDFKit: Custom header/footer function
function addHeader(doc: PDFDocument, title: string) {
  doc.save();
  doc.fontSize(10)
    .text(title, 50, 30, { align: 'left' })
    .text(new Date().toLocaleDateString(), 550, 30, { align: 'right', width: 100 });
  doc.moveTo(50, 50).lineTo(550, 50).stroke();
  doc.restore();
}

function addFooter(doc: PDFDocument, pageNum: number, totalPages: number) {
  doc.save();
  doc.fontSize(9)
    .text(`Page ${pageNum} of ${totalPages}`, 50, 770, { align: 'center', width: 500 });
  doc.restore();
}

// Puppeteer: CSS-based header/footer
await page.pdf({
  path: 'report.pdf',
  format: 'A4',
  displayHeaderFooter: true,
  headerTemplate: `
    <div style="font-size: 10px; width: 100%; text-align: center;">
      <span>Financial Report - Q4 2024</span>
    </div>
  `,
  footerTemplate: `
    <div style="font-size: 9px; width: 100%; text-align: center;">
      <span class="pageNumber"></span> of <span class="totalPages"></span>
    </div>
  `,
  margin: { top: '80px', bottom: '80px' }
});
```

### Multi-Page Documents
```typescript
// PDFKit: Automatic page breaks
const doc = new PDFDocument();

// Add multiple pages of content
for (let i = 1; i <= 10; i++) {
  doc.fontSize(16).text(`Section ${i}`, { align: 'left' });
  doc.fontSize(12).text('Lorem ipsum...'.repeat(50));

  if (i < 10) {
    doc.addPage(); // Manual page break
  }
}

// Or let it flow naturally
doc.text('Long content...'.repeat(1000)); // Automatic page breaks

doc.end();
```

## Text Formatting

### Typography
```typescript
// PDFKit
doc.font('Helvetica-Bold')
  .fontSize(24)
  .fillColor('#0088CC')
  .text('Report Title', { align: 'center' });

doc.moveDown(2);

doc.font('Helvetica')
  .fontSize(12)
  .fillColor('#000000')
  .text('Body text with ', { continued: true })
  .font('Helvetica-Bold')
  .text('bold inline', { continued: true })
  .font('Helvetica')
  .text(' and normal text.');

// Line spacing
doc.text('Paragraph with custom line height', {
  lineGap: 10,
  paragraphGap: 20
});

// Text box with wrapping
doc.text('Long text that will wrap within the defined width...', {
  width: 400,
  align: 'justify',
  columns: 2,
  columnGap: 15,
  height: 200,
  ellipsis: true
});
```

### Lists & Bullets
```typescript
// PDFKit: Manual bullet points
doc.fontSize(14).text('Key Points:', { underline: true });
doc.moveDown(0.5);

const bulletPoints = [
  'Revenue increased 25% YoY',
  'User base grew to 100K',
  'Launched 5 new features'
];

bulletPoints.forEach(point => {
  doc.fontSize(12)
    .text('•  ', { continued: true })
    .text(point, { indent: 20 });
});

// Numbered lists
doc.moveDown();
doc.fontSize(14).text('Action Items:', { underline: true });
doc.moveDown(0.5);

const items = ['Complete Q1 planning', 'Hire 2 engineers', 'Launch beta'];
items.forEach((item, i) => {
  doc.fontSize(12)
    .text(`${i + 1}. `, { continued: true })
    .text(item, { indent: 20 });
});
```

## Tables & Data Grids

### Simple Tables
```typescript
// PDFKit with manual table drawing
function drawTable(doc: PDFDocument, data: string[][], x: number, y: number) {
  const colWidth = 150;
  const rowHeight = 25;

  data.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const cellX = x + (colIndex * colWidth);
      const cellY = y + (rowIndex * rowHeight);

      // Draw cell border
      doc.rect(cellX, cellY, colWidth, rowHeight).stroke();

      // Draw cell text
      doc.fontSize(10).text(cell, cellX + 5, cellY + 8, {
        width: colWidth - 10,
        height: rowHeight,
        ellipsis: true
      });
    });
  });
}

// Usage
const tableData = [
  ['Product', 'Q1', 'Q2', 'Q3'],
  ['Widget', '$10K', '$12K', '$15K'],
  ['Gadget', '$8K', '$9K', '$11K']
];

drawTable(doc, tableData, 50, 200);
```

### Advanced Tables with Styling
```typescript
interface TableStyle {
  headerBg: string;
  headerColor: string;
  rowBg: string;
  altRowBg: string;
  borderColor: string;
}

function drawStyledTable(
  doc: PDFDocument,
  headers: string[],
  rows: string[][],
  x: number,
  y: number,
  style: TableStyle
) {
  const colWidth = (doc.page.width - 100) / headers.length;
  const rowHeight = 30;

  // Draw header row
  headers.forEach((header, i) => {
    doc.rect(x + (i * colWidth), y, colWidth, rowHeight)
      .fillAndStroke(style.headerBg, style.borderColor);

    doc.fillColor(style.headerColor)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(header, x + (i * colWidth) + 5, y + 10, { width: colWidth - 10 });
  });

  // Draw data rows
  rows.forEach((row, rowIndex) => {
    const rowY = y + ((rowIndex + 1) * rowHeight);
    const bg = rowIndex % 2 === 0 ? style.rowBg : style.altRowBg;

    row.forEach((cell, colIndex) => {
      doc.rect(x + (colIndex * colWidth), rowY, colWidth, rowHeight)
        .fillAndStroke(bg, style.borderColor);

      doc.fillColor('#000000')
        .font('Helvetica')
        .fontSize(10)
        .text(cell, x + (colIndex * colWidth) + 5, rowY + 10, { width: colWidth - 10 });
    });
  });
}

// Usage
drawStyledTable(
  doc,
  ['Product', 'Revenue', 'Growth'],
  [['Widget', '$100K', '+25%'], ['Gadget', '$75K', '+15%']],
  50, 200,
  {
    headerBg: '#0088CC',
    headerColor: '#FFFFFF',
    rowBg: '#FFFFFF',
    altRowBg: '#F5F5F5',
    borderColor: '#CCCCCC'
  }
);
```

## Images & Graphics

### Adding Images
```typescript
// PDFKit
doc.image('logo.png', 50, 50, { width: 100 });
doc.image('chart.jpg', 50, 200, {
  fit: [500, 300],
  align: 'center'
});

// jsPDF
const imgData = 'data:image/png;base64,...';
doc.addImage(imgData, 'PNG', 15, 40, 180, 160);

// Puppeteer (embeds via HTML)
await page.setContent(`
  <img src="file:///path/to/image.png" style="width: 100%; max-width: 600px;" />
`);
```

### Vector Graphics
```typescript
// PDFKit: Drawing shapes
doc.save()
  .moveTo(100, 100)
  .lineTo(200, 100)
  .lineTo(150, 150)
  .closePath()
  .fillAndStroke('#FF5733', '#000000');

// Circle
doc.circle(300, 200, 50)
  .fill('#00AA00');

// Rectangle with rounded corners
doc.roundedRect(400, 100, 150, 100, 10)
  .stroke('#0088CC');

// Paths and curves
doc.moveTo(100, 300)
  .bezierCurveTo(150, 250, 200, 350, 250, 300)
  .stroke();
```

## Charts & Visualizations

### Embedded Chart Images
```typescript
// Generate chart with Chart.js and convert to image
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

const chartJSNodeCanvas = new ChartJSNodeCanvas({
  width: 800,
  height: 600,
  backgroundColour: 'white'
});

const configuration = {
  type: 'bar',
  data: {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [{
      label: 'Revenue',
      data: [10, 15, 20, 25],
      backgroundColor: '#0088CC'
    }]
  }
};

const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);

// Add to PDF
doc.image(imageBuffer, 50, 200, { width: 500 });
```

### SVG Support
```typescript
// PDFKit with SVG-to-PDFKit
import SVGtoPDF from 'svg-to-pdfkit';

const svgString = `<svg>...</svg>`;
SVGtoPDF(doc, svgString, 100, 200, { width: 400 });
```

## Advanced Features

### Watermarks
```typescript
function addWatermark(doc: PDFDocument, text: string) {
  doc.save();

  doc.rotate(45, { origin: [doc.page.width / 2, doc.page.height / 2] })
    .fontSize(80)
    .fillColor('#FF0000', 0.1)
    .text(text, 0, doc.page.height / 2, {
      align: 'center',
      width: doc.page.width
    });

  doc.restore();
}

// Add to each page
doc.on('pageAdded', () => {
  addWatermark(doc, 'CONFIDENTIAL');
});
```

### Hyperlinks & Bookmarks
```typescript
// PDFKit: Add hyperlink
doc.text('Visit our website', 100, 100, {
  link: 'https://example.com',
  underline: true
});

// Internal link (table of contents)
doc.text('Go to Section 2', 100, 120, {
  goTo: [0, 200], // page, y-position
  underline: true
});

// Named destinations
doc.addNamedDestination('section2');
```

### Annotations
```typescript
// PDFKit: Add note annotation
doc.note(200, 200, 100, 50, 'This is a sticky note');

// Text annotation
doc.text('Important content', 100, 300);
doc.addAnnotation(100, 300, 200, 20, {
  Type: 'Highlight',
  Subtype: 'Highlight',
  Contents: 'This is highlighted'
});
```

## Templates & Reusable Components

### Report Template
```typescript
class ReportGenerator {
  private doc: PDFDocument;

  constructor(title: string, author: string) {
    this.doc = new PDFDocument({ size: 'A4', margin: 50 });
    this.addCoverPage(title, author);
  }

  private addCoverPage(title: string, author: string) {
    this.doc.fontSize(36)
      .fillColor('#0088CC')
      .text(title, { align: 'center' });

    this.doc.moveDown(2);

    this.doc.fontSize(18)
      .fillColor('#666666')
      .text(author, { align: 'center' });

    this.doc.moveDown();
    this.doc.fontSize(14).text(new Date().toLocaleDateString(), { align: 'center' });

    this.doc.addPage();
  }

  addSection(title: string, content: string) {
    this.doc.fontSize(20)
      .fillColor('#0088CC')
      .text(title);

    this.doc.moveDown(0.5);
    this.doc.moveTo(50, this.doc.y).lineTo(550, this.doc.y).stroke('#CCCCCC');
    this.doc.moveDown();

    this.doc.fontSize(12)
      .fillColor('#000000')
      .text(content, { align: 'justify' });

    this.doc.moveDown(2);
  }

  addTable(headers: string[], rows: string[][]) {
    const colWidth = (this.doc.page.width - 100) / headers.length;
    const startY = this.doc.y;

    // Draw table...

    this.doc.y = startY + ((rows.length + 1) * 30) + 20;
  }

  save(filename: string) {
    this.doc.pipe(fs.createWriteStream(filename));
    this.doc.end();
  }
}

// Usage
const report = new ReportGenerator('Financial Report', 'CFO Name');
report.addSection('Executive Summary', 'This quarter...');
report.addTable(['Metric', 'Value'], [['Revenue', '$100K'], ['Users', '10K']]);
report.save('report.pdf');
```

## Common Use Cases

### Invoice Generator
```typescript
interface Invoice {
  invoiceNumber: string;
  date: Date;
  dueDate: Date;
  client: { name: string; address: string };
  items: Array<{ description: string; quantity: number; price: number }>;
}

function generateInvoice(invoice: Invoice) {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(fs.createWriteStream(`invoice-${invoice.invoiceNumber}.pdf`));

  // Header
  doc.fontSize(28).text('INVOICE', { align: 'right' });
  doc.fontSize(10).text(`#${invoice.invoiceNumber}`, { align: 'right' });

  // Company info
  doc.fontSize(12).text('Company Name', 50, 50);
  doc.fontSize(10).text('123 Business St', 50, 70);

  // Client info
  doc.fontSize(10).text(`Bill To:`, 50, 120);
  doc.fontSize(12).text(invoice.client.name, 50, 140);
  doc.fontSize(10).text(invoice.client.address, 50, 160);

  // Invoice details
  doc.text(`Date: ${invoice.date.toLocaleDateString()}`, 400, 120);
  doc.text(`Due: ${invoice.dueDate.toLocaleDateString()}`, 400, 140);

  // Line items table
  const tableTop = 220;
  doc.fontSize(10);

  // Headers
  doc.text('Description', 50, tableTop, { width: 250 });
  doc.text('Qty', 320, tableTop, { width: 50 });
  doc.text('Price', 380, tableTop, { width: 80, align: 'right' });
  doc.text('Total', 480, tableTop, { width: 80, align: 'right' });

  doc.moveTo(50, tableTop + 15).lineTo(560, tableTop + 15).stroke();

  // Items
  let y = tableTop + 25;
  let subtotal = 0;

  invoice.items.forEach(item => {
    const total = item.quantity * item.price;
    subtotal += total;

    doc.text(item.description, 50, y, { width: 250 });
    doc.text(item.quantity.toString(), 320, y, { width: 50 });
    doc.text(`$${item.price.toFixed(2)}`, 380, y, { width: 80, align: 'right' });
    doc.text(`$${total.toFixed(2)}`, 480, y, { width: 80, align: 'right' });

    y += 20;
  });

  // Totals
  doc.moveTo(50, y).lineTo(560, y).stroke();
  y += 10;

  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  doc.fontSize(12);
  doc.text('Subtotal:', 380, y, { width: 100, align: 'right' });
  doc.text(`$${subtotal.toFixed(2)}`, 480, y, { width: 80, align: 'right' });

  y += 20;
  doc.text('Tax (10%):', 380, y, { width: 100, align: 'right' });
  doc.text(`$${tax.toFixed(2)}`, 480, y, { width: 80, align: 'right' });

  y += 20;
  doc.fontSize(14).text('Total:', 380, y, { width: 100, align: 'right' });
  doc.text(`$${total.toFixed(2)}`, 480, y, { width: 80, align: 'right' });

  doc.end();
}
```

### Certificate Generator
```typescript
function generateCertificate(name: string, course: string, date: Date) {
  const doc = new PDFDocument({
    size: [792, 612], // Landscape Letter
    margin: 50
  });

  doc.pipe(fs.createWriteStream(`certificate-${name.replace(/\s/g, '-')}.pdf`));

  // Border
  doc.rect(30, 30, 732, 552).stroke('#0088CC');
  doc.rect(40, 40, 712, 532).stroke('#0088CC');

  // Title
  doc.fontSize(48)
    .fillColor('#0088CC')
    .text('Certificate of Completion', { align: 'center' });

  doc.moveDown(2);

  // Content
  doc.fontSize(20)
    .fillColor('#000000')
    .text('This is to certify that', { align: 'center' });

  doc.moveDown();

  doc.fontSize(36)
    .fillColor('#0088CC')
    .text(name, { align: 'center' });

  doc.moveDown();

  doc.fontSize(20)
    .fillColor('#000000')
    .text('has successfully completed', { align: 'center' });

  doc.moveDown();

  doc.fontSize(28)
    .fillColor('#0088CC')
    .text(course, { align: 'center' });

  doc.moveDown(2);

  doc.fontSize(16)
    .fillColor('#666666')
    .text(date.toLocaleDateString(), { align: 'center' });

  doc.end();
}
```

## Performance Optimization

### Streaming Large PDFs
```typescript
// Stream generation for large documents
const doc = new PDFDocument();
const stream = fs.createWriteStream('large-report.pdf');

doc.pipe(stream);

// Generate content in chunks
for (let i = 0; i < 1000; i++) {
  doc.text(`Section ${i}`);
  doc.text('Content...'.repeat(100));

  if (i % 100 === 0) {
    // Allow stream to flush
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

doc.end();

stream.on('finish', () => {
  console.log('PDF generated');
});
```

### Memory Management
```typescript
// For very large PDFs, use bufferPages
const doc = new PDFDocument({
  bufferPages: true,
  autoFirstPage: false
});

// Generate pages
for (let i = 0; i < 100; i++) {
  doc.addPage();
  doc.text(`Page ${i + 1}`);
}

// Get page range for table of contents
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  // Add page numbers
  doc.text(`Page ${i + 1}`, 520, 770);
}

doc.end();
```

## Best Practices

1. **Font Embedding** - Embed custom fonts for consistency
2. **Compression** - Use built-in compression for images
3. **Page Size** - Standard sizes (A4, Letter) for printing
4. **Color Space** - Use CMYK for print, RGB for screen
5. **Resolution** - 300 DPI for print-quality images
6. **File Size** - Optimize images before embedding
7. **Accessibility** - Add alt text and structure tags
8. **Testing** - Test across different PDF viewers
9. **Security** - Add password protection if needed
10. **Metadata** - Include proper document metadata

## Security Features

### Password Protection
```typescript
// PDFKit with encryption
const doc = new PDFDocument({
  userPassword: 'user123',
  ownerPassword: 'owner456',
  permissions: {
    printing: 'highResolution',
    modifying: false,
    copying: false,
    annotating: true
  }
});
```

### Digital Signatures
```typescript
// Requires external signing service or library
// Example placeholder
const signedPDF = await signPDF(pdfBuffer, privateKey, certificate);
```
