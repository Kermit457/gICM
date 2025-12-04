# Excel/Sheets Master

You are an expert in creating, manipulating, and analyzing spreadsheets using modern JavaScript/TypeScript libraries for Excel (.xlsx), Google Sheets, and CSV formats. Master Excel automation, complex formulas, pivot tables, charts, and enterprise-grade reporting.

## Core Libraries Comparison

### ExcelJS vs SheetJS vs Google Sheets API

**ExcelJS** - Best for Node.js server-side generation with full Excel feature support
- ✅ Rich formatting, styles, and conditional formatting
- ✅ Charts, images, and data validation
- ✅ Streaming for large files
- ✅ Formula support with calculation
- ❌ Larger bundle size
- ❌ Node.js focused (limited browser support)

**SheetJS (xlsx)** - Best for browser compatibility and reading Excel files
- ✅ Works in browser and Node.js
- ✅ Fast parsing and reading
- ✅ Multiple format support (XLS, XLSX, CSV, etc.)
- ✅ Small bundle size
- ❌ Limited formatting capabilities
- ❌ No chart generation

**Google Sheets API** - Best for cloud-based collaboration
- ✅ Real-time collaboration
- ✅ Built-in formulas and functions
- ✅ No file storage needed
- ✅ Version history
- ❌ Requires authentication
- ❌ API rate limits

### Installation & Setup

```bash
# ExcelJS
npm install exceljs

# SheetJS
npm install xlsx

# Google Sheets API
npm install googleapis
```

## ExcelJS - Complete Guide

### Basic Workbook Creation

```typescript
import ExcelJS from 'exceljs';
import fs from 'fs';

// Create workbook with metadata
const workbook = new ExcelJS.Workbook();
workbook.creator = 'John Doe';
workbook.lastModifiedBy = 'Jane Smith';
workbook.created = new Date();
workbook.modified = new Date();
workbook.lastPrinted = new Date();
workbook.properties.date1904 = true; // Mac compatibility

// Workbook views
workbook.views = [
  {
    x: 0,
    y: 0,
    width: 10000,
    height: 20000,
    firstSheet: 0,
    activeTab: 1,
    visibility: 'visible'
  }
];

// Add worksheet
const worksheet = workbook.addWorksheet('Sales Report', {
  properties: {
    tabColor: { argb: 'FF0000FF' },
    defaultRowHeight: 15,
    defaultColWidth: 12,
  },
  views: [
    { state: 'frozen', xSplit: 1, ySplit: 1 } // Freeze first row and column
  ]
});

// Column definitions
worksheet.columns = [
  { header: 'ID', key: 'id', width: 10 },
  { header: 'Product Name', key: 'name', width: 30 },
  { header: 'Category', key: 'category', width: 20 },
  { header: 'Price', key: 'price', width: 15 },
  { header: 'Quantity', key: 'quantity', width: 12 },
  { header: 'Total', key: 'total', width: 15 },
  { header: 'Date', key: 'date', width: 12 },
  { header: 'Status', key: 'status', width: 15 }
];

// Add rows
worksheet.addRows([
  { id: 1, name: 'Laptop Pro', category: 'Electronics', price: 1299.99, quantity: 5, date: new Date('2024-01-15'), status: 'Completed' },
  { id: 2, name: 'Wireless Mouse', category: 'Accessories', price: 29.99, quantity: 50, date: new Date('2024-01-16'), status: 'Pending' },
  { id: 3, name: 'USB-C Cable', category: 'Accessories', price: 15.99, quantity: 100, date: new Date('2024-01-17'), status: 'Completed' },
  { id: 4, name: 'Monitor 27"', category: 'Electronics', price: 399.99, quantity: 10, date: new Date('2024-01-18'), status: 'Shipped' }
]);

// Save to file
await workbook.xlsx.writeFile('sales-report.xlsx');

// Save to buffer
const buffer = await workbook.xlsx.writeBuffer();
fs.writeFileSync('report.xlsx', buffer);

// Save to stream
const stream = fs.createWriteStream('output.xlsx');
await workbook.xlsx.write(stream);
```

### Advanced Cell Formatting

```typescript
// Header row styling
const headerRow = worksheet.getRow(1);
headerRow.font = {
  name: 'Calibri',
  size: 12,
  bold: true,
  color: { argb: 'FFFFFFFF' }
};

headerRow.fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF0066CC' }
};

headerRow.alignment = {
  vertical: 'middle',
  horizontal: 'center',
  wrapText: true
};

headerRow.border = {
  top: { style: 'thin', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thick', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF000000' } }
};

headerRow.height = 25;
headerRow.commit(); // Important: commit changes

// Individual cell formatting
const cell = worksheet.getCell('B2');
cell.value = 'Important Data';
cell.font = {
  name: 'Arial',
  family: 2,
  size: 14,
  bold: true,
  italic: false,
  underline: false,
  strike: false,
  color: { argb: 'FFFF0000' }
};

cell.fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFFFF00' },
  bgColor: { argb: 'FF000000' }
};

cell.border = {
  top: { style: 'double', color: { argb: 'FFFF0000' } },
  left: { style: 'double', color: { argb: 'FFFF0000' } },
  bottom: { style: 'double', color: { argb: 'FFFF0000' } },
  right: { style: 'double', color: { argb: 'FFFF0000' } }
};

cell.alignment = {
  vertical: 'top',
  horizontal: 'left',
  wrapText: true,
  indent: 2,
  readingOrder: 'ltr',
  textRotation: 0,
  shrinkToFit: false
};

cell.protection = {
  locked: true,
  hidden: false
};

// Rich text formatting
cell.value = {
  richText: [
    { text: 'This is ', font: { size: 12 } },
    { text: 'bold', font: { bold: true, size: 12 } },
    { text: ' and this is ', font: { size: 12 } },
    { text: 'italic', font: { italic: true, size: 12, color: { argb: 'FFFF0000' } } },
    { text: '.', font: { size: 12 } }
  ]
};

// Hyperlinks
cell.value = {
  text: 'Click here',
  hyperlink: 'https://example.com',
  tooltip: 'Visit our website'
};

// Internal hyperlink
cell.value = {
  text: 'Go to Summary',
  hyperlink: '#Summary!A1',
  tooltip: 'Jump to summary sheet'
};
```

### Advanced Formulas & Calculations

```typescript
// Financial formulas
worksheet.getCell('D2').value = { formula: 'B2*C2', result: 0 }; // Price * Quantity
worksheet.getCell('E10').value = { formula: 'SUM(D2:D9)' }; // Sum total

// Date calculations
worksheet.getCell('F2').value = { formula: 'TODAY()' }; // Current date
worksheet.getCell('G2').value = { formula: 'NOW()' }; // Current date and time
worksheet.getCell('H2').value = { formula: 'DATEDIF(A2,TODAY(),"d")' }; // Days since
worksheet.getCell('I2').value = { formula: 'EDATE(A2,6)' }; // Add 6 months
worksheet.getCell('J2').value = { formula: 'EOMONTH(A2,0)' }; // End of month
worksheet.getCell('K2').value = { formula: 'WORKDAY(A2,10)' }; // 10 business days after

// Statistical formulas
worksheet.getCell('L2').value = { formula: 'AVERAGE(D2:D100)' };
worksheet.getCell('M2').value = { formula: 'MEDIAN(D2:D100)' };
worksheet.getCell('N2').value = { formula: 'MODE.SNGL(D2:D100)' };
worksheet.getCell('O2').value = { formula: 'STDEV.S(D2:D100)' };
worksheet.getCell('P2').value = { formula: 'VAR.S(D2:D100)' };

// Conditional formulas
worksheet.getCell('Q2').value = {
  formula: 'IF(D2>1000,"High","Low")'
};

worksheet.getCell('R2').value = {
  formula: 'IFS(D2>1000,"High",D2>500,"Medium",D2>0,"Low",TRUE,"Invalid")'
};

worksheet.getCell('S2').value = {
  formula: 'SWITCH(C2,"Electronics",0.15,"Accessories",0.20,"Furniture",0.10,0.05)'
};

// Lookup formulas
worksheet.getCell('T2').value = {
  formula: 'VLOOKUP(A2,Products!A:D,4,FALSE)'
};

worksheet.getCell('U2').value = {
  formula: 'XLOOKUP(A2,Products!A:A,Products!D:D,"Not Found")'
};

worksheet.getCell('V2').value = {
  formula: 'INDEX(Products!D:D,MATCH(A2,Products!A:A,0))'
};

// Text formulas
worksheet.getCell('W2').value = {
  formula: 'CONCATENATE(B2," - ",C2)'
};

worksheet.getCell('X2').value = {
  formula: 'TEXTJOIN(", ",TRUE,B2:D2)'
};

worksheet.getCell('Y2').value = {
  formula: 'LEFT(B2,5)'
};

worksheet.getCell('Z2').value = {
  formula: 'UPPER(B2)'
};

// Array formulas
worksheet.getCell('AA2').value = {
  formula: 'SUMIF(C:C,"Electronics",D:D)',
  result: 0
};

worksheet.getCell('AB2').value = {
  formula: 'SUMIFS(D:D,C:C,"Electronics",E:E,">5")',
  result: 0
};

worksheet.getCell('AC2').value = {
  formula: 'COUNTIF(C:C,"Electronics")'
};

worksheet.getCell('AD2').value = {
  formula: 'COUNTIFS(C:C,"Electronics",E:E,">5")'
};

// Advanced array formulas
worksheet.getCell('AE2').value = {
  formula: 'FILTER(A2:D100,C2:C100="Electronics")',
  result: []
};

worksheet.getCell('AF2').value = {
  formula: 'SORT(A2:D100,4,-1)', // Sort by 4th column descending
  result: []
};

worksheet.getCell('AG2').value = {
  formula: 'UNIQUE(C2:C100)',
  result: []
};

// Named formulas
workbook.definedNames.addName({
  name: 'TotalRevenue',
  formula: 'Sheet1!$D$2:$D$100',
  comment: 'Sum of all revenue'
});

worksheet.getCell('AH2').value = {
  formula: 'SUM(TotalRevenue)'
};

// Shared formulas (performance optimization)
worksheet.getCell('AI2').value = {
  formula: 'B2*C2*1.1', // 10% markup
  sharedFormula: 'AI2'
};

// Copy formula to multiple cells
for (let i = 3; i <= 100; i++) {
  worksheet.getCell(`AI${i}`).value = {
    sharedFormula: 'AI2',
    formula: `B${i}*C${i}*1.1`
  };
}
```

### Number Formatting Patterns

```typescript
// Currency formats
worksheet.getColumn('D').numFmt = '$#,##0.00'; // US Dollar
worksheet.getColumn('E').numFmt = '€#,##0.00'; // Euro
worksheet.getColumn('F').numFmt = '£#,##0.00'; // British Pound
worksheet.getColumn('G').numFmt = '¥#,##0'; // Japanese Yen

// Percentage formats
worksheet.getColumn('H').numFmt = '0%'; // 75%
worksheet.getColumn('I').numFmt = '0.00%'; // 75.50%
worksheet.getColumn('J').numFmt = '0.000%'; // 75.500%

// Number formats
worksheet.getColumn('K').numFmt = '#,##0'; // 1,000
worksheet.getColumn('L').numFmt = '#,##0.00'; // 1,000.00
worksheet.getColumn('M').numFmt = '0.00E+00'; // Scientific notation
worksheet.getColumn('N').numFmt = '#,##0.00_);(#,##0.00)'; // Negative in parentheses
worksheet.getColumn('O').numFmt = '#,##0.00_);[Red](#,##0.00)'; // Negative in red

// Date formats
worksheet.getColumn('P').numFmt = 'mm/dd/yyyy'; // 01/15/2024
worksheet.getColumn('Q').numFmt = 'dd/mm/yyyy'; // 15/01/2024
worksheet.getColumn('R').numFmt = 'yyyy-mm-dd'; // 2024-01-15
worksheet.getColumn('S').numFmt = 'mmmm d, yyyy'; // January 15, 2024
worksheet.getColumn('T').numFmt = 'dddd, mmmm dd, yyyy'; // Monday, January 15, 2024

// Time formats
worksheet.getColumn('U').numFmt = 'h:mm AM/PM'; // 3:45 PM
worksheet.getColumn('V').numFmt = 'h:mm:ss AM/PM'; // 3:45:30 PM
worksheet.getColumn('W').numFmt = 'hh:mm:ss'; // 15:45:30
worksheet.getColumn('X').numFmt = '[h]:mm:ss'; // Elapsed time

// Custom formats
worksheet.getColumn('Y').numFmt = '[Green]#,##0.00;[Red]-#,##0.00'; // Green positive, red negative
worksheet.getColumn('Z').numFmt = '"$"#,##0.00_);[Red]("$"#,##0.00)'; // Currency with color
worksheet.getColumn('AA').numFmt = '0.0,"K"'; // Display in thousands: 1.5K
worksheet.getColumn('AB').numFmt = '0.00,,"M"'; // Display in millions: 1.25M

// Conditional number formats
worksheet.getColumn('AC').numFmt = '[>1000]$#,##0.00;[>0]$#,##0.00;"Zero";@'; // Different formats based on value
```

### Conditional Formatting - Complete Guide

```typescript
// Cell value rules
worksheet.addConditionalFormatting({
  ref: 'D2:D100',
  rules: [
    {
      type: 'cellIs',
      operator: 'greaterThan',
      formulae: [1000],
      style: {
        fill: {
          type: 'pattern',
          pattern: 'solid',
          bgColor: { argb: 'FF00FF00' } // Green
        },
        font: {
          bold: true,
          color: { argb: 'FF006600' }
        }
      }
    }
  ]
});

// Between rule
worksheet.addConditionalFormatting({
  ref: 'E2:E100',
  rules: [
    {
      type: 'cellIs',
      operator: 'between',
      formulae: [500, 1000],
      style: {
        fill: {
          type: 'pattern',
          pattern: 'solid',
          bgColor: { argb: 'FFFFFF00' } // Yellow
        }
      }
    }
  ]
});

// Color scales (2-color)
worksheet.addConditionalFormatting({
  ref: 'F2:F100',
  rules: [
    {
      type: 'colorScale',
      cfvo: [
        { type: 'min', color: { argb: 'FFF8696B' } }, // Red
        { type: 'max', color: { argb: 'FF63BE7B' } }  // Green
      ]
    }
  ]
});

// Color scales (3-color)
worksheet.addConditionalFormatting({
  ref: 'G2:G100',
  rules: [
    {
      type: 'colorScale',
      cfvo: [
        { type: 'min', color: { argb: 'FFF8696B' } },      // Red
        { type: 'percentile', value: 50, color: { argb: 'FFFFEB84' } }, // Yellow
        { type: 'max', color: { argb: 'FF63BE7B' } }       // Green
      ]
    }
  ]
});

// Data bars
worksheet.addConditionalFormatting({
  ref: 'H2:H100',
  rules: [
    {
      type: 'dataBar',
      minLength: 0,
      maxLength: 100,
      color: { argb: 'FF0070C0' },
      gradient: true,
      border: true,
      negativeBarColorSameAsPositive: false,
      negativeBorderColorSameAsPositive: false
    }
  ]
});

// Icon sets
worksheet.addConditionalFormatting({
  ref: 'I2:I100',
  rules: [
    {
      type: 'iconSet',
      iconSet: '3TrafficLights', // 3Arrows, 3Flags, 3Symbols, 3Stars, 4Arrows, 4Rating, 5Arrows, 5Rating
      showValue: true,
      reverse: false,
      custom: false
    }
  ]
});

// Formula-based rules
worksheet.addConditionalFormatting({
  ref: 'J2:J100',
  rules: [
    {
      type: 'expression',
      formulae: ['MOD(ROW(),2)=0'], // Highlight even rows
      style: {
        fill: {
          type: 'pattern',
          pattern: 'solid',
          bgColor: { argb: 'FFF0F0F0' }
        }
      }
    }
  ]
});

// Text contains rule
worksheet.addConditionalFormatting({
  ref: 'K2:K100',
  rules: [
    {
      type: 'containsText',
      operator: 'containsText',
      text: 'Error',
      style: {
        fill: {
          type: 'pattern',
          pattern: 'solid',
          bgColor: { argb: 'FFFF0000' }
        },
        font: {
          color: { argb: 'FFFFFFFF' },
          bold: true
        }
      }
    }
  ]
});

// Date rules
worksheet.addConditionalFormatting({
  ref: 'L2:L100',
  rules: [
    {
      type: 'timePeriod',
      timePeriod: 'lastWeek', // today, yesterday, tomorrow, last7Days, lastWeek, thisWeek, nextWeek, lastMonth, thisMonth, nextMonth
      style: {
        fill: {
          type: 'pattern',
          pattern: 'solid',
          bgColor: { argb: 'FFCCFFCC' }
        }
      }
    }
  ]
});

// Duplicate values
worksheet.addConditionalFormatting({
  ref: 'M2:M100',
  rules: [
    {
      type: 'duplicateValues',
      style: {
        fill: {
          type: 'pattern',
          pattern: 'solid',
          bgColor: { argb: 'FFFFCCCC' }
        }
      }
    }
  ]
});

// Unique values
worksheet.addConditionalFormatting({
  ref: 'N2:N100',
  rules: [
    {
      type: 'uniqueValues',
      style: {
        fill: {
          type: 'pattern',
          pattern: 'solid',
          bgColor: { argb: 'FFCCFFFF' }
        }
      }
    }
  ]
});

// Top/Bottom rules
worksheet.addConditionalFormatting({
  ref: 'O2:O100',
  rules: [
    {
      type: 'top10',
      rank: 10,
      percent: false,
      bottom: false, // Set to true for bottom 10
      style: {
        fill: {
          type: 'pattern',
          pattern: 'solid',
          bgColor: { argb: 'FFFFD700' }
        }
      }
    }
  ]
});

// Above/Below average
worksheet.addConditionalFormatting({
  ref: 'P2:P100',
  rules: [
    {
      type: 'aboveAverage',
      aboveAverage: true, // Set to false for below average
      style: {
        fill: {
          type: 'pattern',
          pattern: 'solid',
          bgColor: { argb: 'FF90EE90' }
        }
      }
    }
  ]
});
```

### Charts & Visualizations

```typescript
// Bar chart
worksheet.addChart({
  chart: {
    type: 'bar',
    title: { name: 'Quarterly Sales' },
    plotArea: {
      layout: {
        x: 0.1,
        y: 0.1,
        w: 0.8,
        h: 0.7
      }
    },
    legend: {
      position: 'bottom'
    }
  },
  from: { row: 1, col: 8 },
  to: { row: 20, col: 15 }
});

// Line chart with multiple series
worksheet.addChart({
  chart: {
    type: 'line',
    title: { name: 'Revenue Trend' },
    series: [
      {
        name: 'Q1',
        categories: { formula: 'Sheet1!$A$2:$A$10' },
        values: { formula: 'Sheet1!$B$2:$B$10' },
        marker: {
          symbol: 'circle',
          size: 5
        }
      },
      {
        name: 'Q2',
        categories: { formula: 'Sheet1!$A$2:$A$10' },
        values: { formula: 'Sheet1!$C$2:$C$10' },
        marker: {
          symbol: 'square',
          size: 5
        }
      }
    ],
    axes: {
      category: {
        title: { name: 'Month' }
      },
      value: {
        title: { name: 'Revenue ($)' },
        majorGridlines: true
      }
    }
  },
  from: { row: 22, col: 1 },
  to: { row: 40, col: 8 }
});

// Pie chart
worksheet.addChart({
  chart: {
    type: 'pie',
    title: { name: 'Market Share' },
    series: [
      {
        name: 'Share',
        categories: { formula: 'Sheet1!$A$2:$A$6' },
        values: { formula: 'Sheet1!$B$2:$B$6' },
        dataLabels: {
          position: 'bestFit',
          showPercent: true,
          showValue: false
        }
      }
    ],
    legend: {
      position: 'right'
    }
  },
  from: { row: 1, col: 10 },
  to: { row: 20, col: 16 }
});

// Area chart
worksheet.addChart({
  chart: {
    type: 'area',
    title: { name: 'User Growth' },
    series: [
      {
        name: 'Users',
        categories: { formula: 'Sheet1!$A$2:$A$20' },
        values: { formula: 'Sheet1!$B$2:$B$20' }
      }
    ],
    fill: {
      type: 'solid',
      color: { argb: 'FF0088CC' }
    },
    transparency: 50
  },
  from: { row: 22, col: 10 },
  to: { row: 40, col: 16 }
});

// Scatter plot
worksheet.addChart({
  chart: {
    type: 'scatter',
    title: { name: 'Correlation Analysis' },
    series: [
      {
        name: 'Data Points',
        xValues: { formula: 'Sheet1!$A$2:$A$100' },
        yValues: { formula: 'Sheet1!$B$2:$B$100' },
        marker: {
          symbol: 'diamond',
          size: 7,
          fill: { type: 'solid', color: { argb: 'FFFF5733' } }
        }
      }
    ],
    axes: {
      category: {
        title: { name: 'X-Axis' },
        min: 0,
        max: 100
      },
      value: {
        title: { name: 'Y-Axis' },
        min: 0,
        max: 100
      }
    }
  },
  from: { row: 42, col: 1 },
  to: { row: 60, col: 8 }
});

// Combo chart (bar + line)
worksheet.addChart({
  chart: {
    type: 'combo',
    title: { name: 'Revenue & Growth Rate' },
    series: [
      {
        type: 'bar',
        name: 'Revenue',
        categories: { formula: 'Sheet1!$A$2:$A$10' },
        values: { formula: 'Sheet1!$B$2:$B$10' },
        yAxis: 'primary'
      },
      {
        type: 'line',
        name: 'Growth %',
        categories: { formula: 'Sheet1!$A$2:$A$10' },
        values: { formula: 'Sheet1!$C$2:$C$10' },
        yAxis: 'secondary',
        marker: { symbol: 'circle' }
      }
    ],
    axes: {
      primary: {
        title: { name: 'Revenue ($)' }
      },
      secondary: {
        title: { name: 'Growth (%)' }
      }
    }
  },
  from: { row: 42, col: 10 },
  to: { row: 60, col: 16 }
});
```

### Data Validation Rules

```typescript
// List validation (dropdown)
worksheet.getCell('A2').dataValidation = {
  type: 'list',
  allowBlank: true,
  formulae: ['"Electronics,Accessories,Furniture,Software"'],
  showErrorMessage: true,
  errorStyle: 'error',
  errorTitle: 'Invalid Category',
  error: 'Please select a category from the dropdown',
  showInputMessage: true,
  promptTitle: 'Select Category',
  prompt: 'Choose one of the available categories'
};

// Reference another range for dropdown
worksheet.getCell('B2').dataValidation = {
  type: 'list',
  allowBlank: false,
  formulae: ['Categories!$A$2:$A$10'],
  showErrorMessage: true,
  errorStyle: 'stop',
  errorTitle: 'Invalid Selection',
  error: 'Please select from the list'
};

// Whole number validation
worksheet.getCell('C2').dataValidation = {
  type: 'whole',
  operator: 'between',
  allowBlank: false,
  showInputMessage: true,
  formulae: [1, 100],
  promptTitle: 'Enter Quantity',
  prompt: 'Enter a whole number between 1 and 100',
  showErrorMessage: true,
  errorStyle: 'error',
  errorTitle: 'Invalid Number',
  error: 'Must be a whole number between 1 and 100'
};

// Decimal validation
worksheet.getCell('D2').dataValidation = {
  type: 'decimal',
  operator: 'greaterThan',
  formulae: [0],
  allowBlank: false,
  showErrorMessage: true,
  errorStyle: 'error',
  errorTitle: 'Invalid Price',
  error: 'Price must be greater than 0'
};

// Date validation
worksheet.getCell('E2').dataValidation = {
  type: 'date',
  operator: 'between',
  formulae: [new Date('2024-01-01'), new Date('2024-12-31')],
  allowBlank: false,
  showErrorMessage: true,
  errorStyle: 'warning',
  errorTitle: 'Date Out of Range',
  error: 'Date must be within 2024',
  showInputMessage: true,
  promptTitle: 'Enter Date',
  prompt: 'Enter a date in 2024'
};

// Time validation
worksheet.getCell('F2').dataValidation = {
  type: 'time',
  operator: 'between',
  formulae: [new Date(0, 0, 0, 9, 0, 0), new Date(0, 0, 0, 17, 0, 0)],
  allowBlank: false,
  showErrorMessage: true,
  errorTitle: 'Invalid Time',
  error: 'Time must be between 9:00 AM and 5:00 PM'
};

// Text length validation
worksheet.getCell('G2').dataValidation = {
  type: 'textLength',
  operator: 'lessThanOrEqual',
  formulae: [50],
  allowBlank: true,
  showErrorMessage: true,
  errorStyle: 'information',
  errorTitle: 'Text Too Long',
  error: 'Description cannot exceed 50 characters'
};

// Custom formula validation
worksheet.getCell('H2').dataValidation = {
  type: 'custom',
  formulae: ['=AND(ISNUMBER(H2),H2>=0,H2<=100)'],
  allowBlank: false,
  showErrorMessage: true,
  errorTitle: 'Invalid Percentage',
  error: 'Must be a number between 0 and 100'
};

// Email validation
worksheet.getCell('I2').dataValidation = {
  type: 'custom',
  formulae: ['=AND(ISNUMBER(SEARCH("@",I2)),ISNUMBER(SEARCH(".",I2)))'],
  showErrorMessage: true,
  errorTitle: 'Invalid Email',
  error: 'Please enter a valid email address'
};

// URL validation
worksheet.getCell('J2').dataValidation = {
  type: 'custom',
  formulae: ['=OR(LEFT(J2,7)="http://",LEFT(J2,8)="https://")'],
  showErrorMessage: true,
  errorTitle: 'Invalid URL',
  error: 'URL must start with http:// or https://'
};
```

### Tables & Pivot Tables

```typescript
// Create formatted table
worksheet.addTable({
  name: 'SalesTable',
  ref: 'A1:H100',
  headerRow: true,
  totalsRow: true,
  style: {
    theme: 'TableStyleMedium2',
    showRowStripes: true,
    showColumnStripes: false,
    showFirstColumn: true,
    showLastColumn: false
  },
  columns: [
    { name: 'Date', totalsRowLabel: 'Total:', filterButton: true },
    { name: 'Product', totalsRowFunction: 'none', filterButton: true },
    { name: 'Category', totalsRowFunction: 'none', filterButton: true },
    { name: 'Quantity', totalsRowFunction: 'sum', filterButton: false },
    { name: 'Price', totalsRowFunction: 'average', filterButton: false },
    { name: 'Revenue', totalsRowFunction: 'sum', filterButton: false },
    { name: 'Cost', totalsRowFunction: 'sum', filterButton: false },
    { name: 'Profit', totalsRowFunction: 'sum', filterButton: false }
  ],
  rows: [
    [new Date('2024-01-01'), 'Laptop', 'Electronics', 5, 1200, 6000, 4500, 1500],
    [new Date('2024-01-02'), 'Mouse', 'Accessories', 50, 25, 1250, 750, 500],
    // ... more rows
  ]
});

// Get table reference
const table = worksheet.getTable('SalesTable');
table.addRow([new Date(), 'Keyboard', 'Accessories', 30, 75, 2250, 1500, 750]);
table.commit();

// Pivot table simulation (manual aggregation)
interface SalesRecord {
  category: string;
  product: string;
  revenue: number;
  quantity: number;
}

function createPivotTable(data: SalesRecord[]) {
  // Group by category
  const pivot = data.reduce((acc, row) => {
    const key = row.category;
    if (!acc[key]) {
      acc[key] = {
        category: key,
        totalRevenue: 0,
        totalQuantity: 0,
        productCount: new Set()
      };
    }
    acc[key].totalRevenue += row.revenue;
    acc[key].totalQuantity += row.quantity;
    acc[key].productCount.add(row.product);
    return acc;
  }, {} as Record<string, any>);

  // Convert to array
  const pivotArray = Object.values(pivot).map(item => ({
    category: item.category,
    totalRevenue: item.totalRevenue,
    totalQuantity: item.totalQuantity,
    uniqueProducts: item.productCount.size
  }));

  // Add to worksheet
  const pivotSheet = workbook.addWorksheet('Pivot Summary');
  pivotSheet.columns = [
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Total Revenue', key: 'totalRevenue', width: 15 },
    { header: 'Total Quantity', key: 'totalQuantity', width: 15 },
    { header: 'Unique Products', key: 'uniqueProducts', width: 15 }
  ];
  pivotSheet.addRows(pivotArray);

  // Format
  pivotSheet.getRow(1).font = { bold: true };
  pivotSheet.getColumn('B').numFmt = '$#,##0.00';
}
```

### Advanced Data Operations

```typescript
// Merge cells
worksheet.mergeCells('A1:D1');
worksheet.getCell('A1').value = 'Sales Report Q4 2024';
worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

// Unmerge cells
worksheet.unMergeCells('A1:D1');

// Insert rows/columns
worksheet.spliceRows(2, 0, ['New', 'Row', 'Data']); // Insert at row 2
worksheet.spliceColumns(2, 0, ['A', 'B', 'C']); // Insert at column 2

// Delete rows/columns
worksheet.spliceRows(5, 2); // Delete 2 rows starting at row 5
worksheet.spliceColumns(3, 1); // Delete 1 column at column 3

// Duplicate rows
const sourceRow = worksheet.getRow(2);
const targetRow = worksheet.getRow(3);
targetRow.values = sourceRow.values;
targetRow.font = sourceRow.font;
targetRow.fill = sourceRow.fill;
targetRow.border = sourceRow.border;
targetRow.alignment = sourceRow.alignment;

// Copy range
function copyRange(worksheet: ExcelJS.Worksheet, source: string, target: string) {
  const srcRange = worksheet.getCell(source);
  const tgtRange = worksheet.getCell(target);

  tgtRange.value = srcRange.value;
  tgtRange.style = srcRange.style;
  tgtRange.numFmt = srcRange.numFmt;
}

// Find and replace
worksheet.eachRow((row, rowNumber) => {
  row.eachCell((cell, colNumber) => {
    if (typeof cell.value === 'string' && cell.value.includes('OLD')) {
      cell.value = cell.value.replace(/OLD/g, 'NEW');
    }
  });
});

// Filter data
worksheet.autoFilter = 'A1:H100';

// Sort (manual implementation)
const rows = worksheet.getRows(2, 99) || [];
const sortedRows = rows
  .map(row => row.values)
  .sort((a: any, b: any) => {
    // Sort by column D (index 4) descending
    return (b[4] || 0) - (a[4] || 0);
  });

// Clear range
worksheet.getCell('A1:Z100').value = null;

// Protect worksheet
await worksheet.protect('password123', {
  selectLockedCells: true,
  selectUnlockedCells: true,
  formatCells: false,
  formatColumns: false,
  formatRows: false,
  insertRows: false,
  insertColumns: false,
  deleteRows: false,
  deleteColumns: false,
  sort: false,
  autoFilter: false,
  pivotTables: false
});

// Unprotect
worksheet.unprotect();
```

### Streaming for Large Files

```typescript
// Stream writing for large datasets
import ExcelJS from 'exceljs';

async function generateLargeReport(data: any[]) {
  const options = {
    filename: 'large-report.xlsx',
    useStyles: true,
    useSharedStrings: true
  };

  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter(options);
  const worksheet = workbook.addWorksheet('Data');

  // Define columns
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Value', key: 'value', width: 15 }
  ];

  // Stream data in chunks
  for (let i = 0; i < data.length; i++) {
    worksheet.addRow(data[i]).commit();

    // Commit every 1000 rows to manage memory
    if (i % 1000 === 0) {
      await worksheet.commit();
      console.log(`Processed ${i} rows`);
    }
  }

  await workbook.commit();
  console.log('File generation complete');
}

// Stream reading for large files
async function readLargeFile(filename: string) {
  const workbook = new ExcelJS.Workbook();
  const stream = fs.createReadStream(filename);

  const reader = workbook.xlsx.read(stream);

  reader.on('worksheet', (worksheet) => {
    worksheet.on('row', (row, rowNumber) => {
      console.log(`Row ${rowNumber}: ${row.values}`);
      // Process row data
    });
  });

  reader.on('end', () => {
    console.log('Reading complete');
  });

  reader.on('error', (err) => {
    console.error('Error reading file:', err);
  });
}
```

### Images & Rich Media

```typescript
// Add image from file
const imageId = workbook.addImage({
  filename: './logo.png',
  extension: 'png',
});

worksheet.addImage(imageId, {
  tl: { col: 0, row: 0 },
  ext: { width: 200, height: 100 },
  editAs: 'oneCell' // oneCell, twoCell, absolute
});

// Add image from buffer
const imageBuffer = fs.readFileSync('./chart.png');
const imageId2 = workbook.addImage({
  buffer: imageBuffer,
  extension: 'png',
});

worksheet.addImage(imageId2, {
  tl: { col: 5, row: 5 },
  br: { col: 10, row: 15 }
});

// Add image from base64
const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANS...';
const imageId3 = workbook.addImage({
  base64: base64Image,
  extension: 'png',
});

worksheet.addImage(imageId3, 'A1:C5');

// Add background image
worksheet.addBackgroundImage(imageId);

// Add hyperlinked image
const imgCell = worksheet.getCell('A1');
imgCell.value = {
  text: '',
  hyperlink: 'https://example.com'
};
```

## SheetJS - Complete Guide

### Reading Excel Files

```typescript
import * as XLSX from 'xlsx';

// Read from file
const workbook = XLSX.readFile('data.xlsx', {
  cellDates: true,
  cellFormula: true,
  cellStyles: true
});

// Read from buffer
const buffer = fs.readFileSync('data.xlsx');
const workbook2 = XLSX.read(buffer, { type: 'buffer' });

// Read from URL
const response = await fetch('https://example.com/data.xlsx');
const arrayBuffer = await response.arrayBuffer();
const workbook3 = XLSX.read(arrayBuffer);

// Get sheet names
const sheetNames = workbook.SheetNames;
console.log('Sheets:', sheetNames);

// Get worksheet
const worksheet = workbook.Sheets[sheetNames[0]];

// Convert to JSON
const jsonData = XLSX.utils.sheet_to_json(worksheet, {
  header: 1, // Use row arrays instead of objects
  defval: '', // Default value for empty cells
  blankrows: false, // Skip blank rows
  raw: false, // Parse formatted values
  dateNF: 'yyyy-mm-dd' // Date format
});

// Convert to objects with headers
const objectData = XLSX.utils.sheet_to_json(worksheet, {
  header: 'A', // Use first row as headers
  raw: false
});

// Convert to CSV
const csv = XLSX.utils.sheet_to_csv(worksheet, {
  FS: ',', // Field separator
  RS: '\n', // Record separator
  blankrows: false
});

// Convert to HTML
const html = XLSX.utils.sheet_to_html(worksheet);

// Get cell value
const cellAddress = { c: 0, r: 0 }; // Column A, Row 1
const cellRef = XLSX.utils.encode_cell(cellAddress);
const cell = worksheet[cellRef];
const cellValue = cell ? cell.v : undefined;

// Get range
const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
console.log('Rows:', range.e.r + 1);
console.log('Columns:', range.e.c + 1);
```

### Writing Excel Files

```typescript
// Create workbook
const wb = XLSX.utils.book_new();

// Create worksheet from array of arrays
const data = [
  ['Name', 'Age', 'City'],
  ['Alice', 30, 'NYC'],
  ['Bob', 25, 'LA'],
  ['Charlie', 35, 'Chicago']
];

const ws = XLSX.utils.aoa_to_sheet(data);

// Create worksheet from JSON
const jsonData = [
  { name: 'Alice', age: 30, city: 'NYC' },
  { name: 'Bob', age: 25, city: 'LA' }
];

const ws2 = XLSX.utils.json_to_sheet(jsonData);

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
XLSX.utils.book_append_sheet(wb, ws2, 'Sheet2');

// Set column widths
ws['!cols'] = [
  { wch: 20 }, // Column A width
  { wch: 10 }, // Column B width
  { wch: 15 }  // Column C width
];

// Set row heights
ws['!rows'] = [
  { hpt: 25 }, // Row 1 height
  { hpt: 20 }  // Row 2 height
];

// Merge cells
ws['!merges'] = [
  { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } } // Merge A1:C1
];

// Write to file
XLSX.writeFile(wb, 'output.xlsx', {
  compression: true,
  bookType: 'xlsx'
});

// Write to buffer
const buffer = XLSX.write(wb, {
  type: 'buffer',
  bookType: 'xlsx'
});

// Write to base64
const base64 = XLSX.write(wb, {
  type: 'base64',
  bookType: 'xlsx'
});
```

## Google Sheets API

```typescript
import { google } from 'googleapis';

// Authentication
const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// Create spreadsheet
const createResponse = await sheets.spreadsheets.create({
  requestBody: {
    properties: {
      title: 'Sales Report 2024'
    },
    sheets: [
      {
        properties: {
          title: 'Q1 Data',
          gridProperties: {
            rowCount: 1000,
            columnCount: 26
          }
        }
      }
    ]
  }
});

const spreadsheetId = createResponse.data.spreadsheetId;

// Read data
const readResponse = await sheets.spreadsheets.values.get({
  spreadsheetId,
  range: 'Sheet1!A1:D10',
  valueRenderOption: 'FORMATTED_VALUE',
  dateTimeRenderOption: 'FORMATTED_STRING'
});

const rows = readResponse.data.values;

// Write data
await sheets.spreadsheets.values.update({
  spreadsheetId,
  range: 'Sheet1!A1',
  valueInputOption: 'USER_ENTERED',
  requestBody: {
    values: [
      ['Name', 'Age', 'City', 'Salary'],
      ['Alice', 30, 'NYC', 75000],
      ['Bob', 25, 'LA', 65000]
    ]
  }
});

// Append data
await sheets.spreadsheets.values.append({
  spreadsheetId,
  range: 'Sheet1!A1',
  valueInputOption: 'USER_ENTERED',
  requestBody: {
    values: [
      ['Charlie', 35, 'Chicago', 80000]
    ]
  }
});

// Batch update (formatting)
await sheets.spreadsheets.batchUpdate({
  spreadsheetId,
  requestBody: {
    requests: [
      {
        repeatCell: {
          range: {
            sheetId: 0,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: 4
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0, green: 0.4, blue: 0.8 },
              textFormat: {
                foregroundColor: { red: 1, green: 1, blue: 1 },
                bold: true
              }
            }
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)'
        }
      }
    ]
  }
});

// Add chart
await sheets.spreadsheets.batchUpdate({
  spreadsheetId,
  requestBody: {
    requests: [
      {
        addChart: {
          chart: {
            spec: {
              title: 'Sales by Region',
              basicChart: {
                chartType: 'COLUMN',
                legendPosition: 'BOTTOM_LEGEND',
                axis: [
                  {
                    position: 'BOTTOM_AXIS',
                    title: 'Region'
                  },
                  {
                    position: 'LEFT_AXIS',
                    title: 'Sales'
                  }
                ],
                series: [
                  {
                    series: {
                      sourceRange: {
                        sources: [
                          {
                            sheetId: 0,
                            startRowIndex: 1,
                            endRowIndex: 10,
                            startColumnIndex: 1,
                            endColumnIndex: 2
                          }
                        ]
                      }
                    },
                    targetAxis: 'LEFT_AXIS'
                  }
                ]
              }
            },
            position: {
              overlayPosition: {
                anchorCell: {
                  sheetId: 0,
                  rowIndex: 2,
                  columnIndex: 5
                }
              }
            }
          }
        }
      }
    ]
  }
});
```

## Real-World Use Cases

### 1. Financial Report Generator

```typescript
async function generateFinancialReport(transactions: Transaction[], outputPath: string) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Financial System';
  workbook.created = new Date();

  // Summary Sheet
  const summary = workbook.addWorksheet('Executive Summary');

  // Title
  summary.mergeCells('A1:F1');
  summary.getCell('A1').value = 'Financial Report - Q4 2024';
  summary.getCell('A1').font = { size: 18, bold: true, color: { argb: 'FF0066CC' } };
  summary.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  summary.getRow(1).height = 30;

  // KPIs
  const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
  const avgTransaction = totalRevenue / transactions.length;
  const categories = [...new Set(transactions.map(t => t.category))];

  summary.getCell('A3').value = 'Key Metrics';
  summary.getCell('A3').font = { bold: true, size: 14 };

  summary.addRows([
    ['Total Revenue', totalRevenue],
    ['Total Transactions', transactions.length],
    ['Average Transaction', avgTransaction],
    ['Categories', categories.length]
  ]);

  summary.getColumn('B').numFmt = '$#,##0.00';

  // Transactions Sheet
  const transSheet = workbook.addWorksheet('Transactions');
  transSheet.columns = [
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Description', key: 'description', width: 30 },
    { header: 'Category', key: 'category', width: 15 },
    { header: 'Amount', key: 'amount', width: 15 },
    { header: 'Balance', key: 'balance', width: 15 }
  ];

  let balance = 0;
  transactions.forEach(t => {
    balance += t.amount;
    transSheet.addRow({
      date: t.date,
      description: t.description,
      category: t.category,
      amount: t.amount,
      balance: balance
    });
  });

  transSheet.getColumn('A').numFmt = 'mm/dd/yyyy';
  transSheet.getColumn('D').numFmt = '$#,##0.00';
  transSheet.getColumn('E').numFmt = '$#,##0.00';

  // Add chart
  const chartSheet = workbook.addWorksheet('Charts');
  // ... add revenue trend chart

  await workbook.xlsx.writeFile(outputPath);
}
```

### 2. Inventory Management System

```typescript
async function generateInventoryReport(products: Product[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Inventory');

  sheet.columns = [
    { header: 'SKU', key: 'sku', width: 15 },
    { header: 'Product', key: 'name', width: 30 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Current Stock', key: 'quantity', width: 15 },
    { header: 'Min Stock', key: 'minStock', width: 12 },
    { header: 'Max Stock', key: 'maxStock', width: 12 },
    { header: 'Unit Cost', key: 'cost', width: 12 },
    { header: 'Unit Price', key: 'price', width: 12 },
    { header: 'Total Value', key: 'totalValue', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Reorder', key: 'reorder', width: 10 }
  ];

  products.forEach(product => {
    const row = sheet.addRow({
      sku: product.sku,
      name: product.name,
      category: product.category,
      quantity: product.quantity,
      minStock: product.minStock,
      maxStock: product.maxStock,
      cost: product.cost,
      price: product.price
    });

    // Total value formula
    row.getCell('totalValue').value = {
      formula: `D${row.number}*H${row.number}`
    };

    // Status formula
    row.getCell('status').value = {
      formula: `IF(D${row.number}<E${row.number},"Low Stock",IF(D${row.number}>F${row.number},"Overstock","Normal"))`
    };

    // Reorder formula
    row.getCell('reorder').value = {
      formula: `IF(D${row.number}<E${row.number},"Yes","No")`
    };

    // Conditional formatting
    if (product.quantity < product.minStock) {
      row.getCell('quantity').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF0000' }
      };
      row.getCell('quantity').font = { color: { argb: 'FFFFFFFF' }, bold: true };
    }
  });

  // Add data validation
  sheet.getColumn('category').eachCell({ includeEmpty: true }, (cell, rowNumber) => {
    if (rowNumber > 1) {
      cell.dataValidation = {
        type: 'list',
        formulae: ['"Electronics,Furniture,Office Supplies,Software"']
      };
    }
  });

  await workbook.xlsx.writeFile('inventory-report.xlsx');
}
```

### 3. Sales Dashboard

```typescript
async function generateSalesDashboard(salesData: SalesRecord[]) {
  const workbook = new ExcelJS.Workbook();

  // Raw Data
  const dataSheet = workbook.addWorksheet('Raw Data');
  dataSheet.columns = [
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Salesperson', key: 'salesperson', width: 20 },
    { header: 'Product', key: 'product', width: 25 },
    { header: 'Quantity', key: 'quantity', width: 10 },
    { header: 'Unit Price', key: 'unitPrice', width: 12 },
    { header: 'Total', key: 'total', width: 15 },
    { header: 'Commission', key: 'commission', width: 12 }
  ];

  salesData.forEach(sale => {
    const row = dataSheet.addRow(sale);
    row.getCell('total').value = { formula: `D${row.number}*E${row.number}` };
    row.getCell('commission').value = { formula: `F${row.number}*0.1` };
  });

  // Dashboard
  const dashboard = workbook.addWorksheet('Dashboard');

  // Title
  dashboard.mergeCells('A1:H1');
  dashboard.getCell('A1').value = 'Sales Dashboard';
  dashboard.getCell('A1').font = { size: 24, bold: true };
  dashboard.getCell('A1').alignment = { horizontal: 'center' };

  // KPIs
  dashboard.getCell('B3').value = 'Total Revenue';
  dashboard.getCell('B4').value = { formula: `SUM('Raw Data'!F:F)` };
  dashboard.getCell('B4').numFmt = '$#,##0.00';
  dashboard.getCell('B4').font = { size: 20, bold: true };

  dashboard.getCell('D3').value = 'Total Orders';
  dashboard.getCell('D4').value = { formula: `COUNTA('Raw Data'!A:A)-1` };
  dashboard.getCell('D4').font = { size: 20, bold: true };

  dashboard.getCell('F3').value = 'Avg Order Value';
  dashboard.getCell('F4').value = { formula: 'B4/D4' };
  dashboard.getCell('F4').numFmt = '$#,##0.00';
  dashboard.getCell('F4').font = { size: 20, bold: true };

  // Top performers table
  dashboard.getCell('B7').value = 'Top 5 Salespeople';
  dashboard.getCell('B7').font = { bold: true, size: 14 };

  await workbook.xlsx.writeFile('sales-dashboard.xlsx');
}
```

### 4. Employee Timesheet

```typescript
async function generateTimesheet(employee: Employee, period: DateRange) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Timesheet');

  // Header
  sheet.mergeCells('A1:H1');
  sheet.getCell('A1').value = `Timesheet - ${employee.name}`;
  sheet.getCell('A1').font = { size: 16, bold: true };
  sheet.getCell('A1').alignment = { horizontal: 'center' };

  // Employee info
  sheet.addRow(['Employee ID:', employee.id]);
  sheet.addRow(['Department:', employee.department]);
  sheet.addRow(['Period:', `${period.start.toLocaleDateString()} - ${period.end.toLocaleDateString()}`]);

  // Timesheet table
  sheet.addRow([]);
  const headers = sheet.addRow(['Date', 'Day', 'Start Time', 'End Time', 'Break (hrs)', 'Total Hours', 'Overtime', 'Notes']);
  headers.font = { bold: true };
  headers.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066CC' } };

  // Generate days
  const currentDate = new Date(period.start);
  while (currentDate <= period.end) {
    const row = sheet.addRow([
      currentDate,
      currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
      '', // Start time
      '', // End time
      0.5, // Default break
      { formula: `IF(C${sheet.lastRow.number}="","",D${sheet.lastRow.number}-C${sheet.lastRow.number}-E${sheet.lastRow.number})` },
      { formula: `IF(F${sheet.lastRow.number}>8,F${sheet.lastRow.number}-8,0)` },
      ''
    ]);

    row.getCell('A').numFmt = 'mm/dd/yyyy';
    row.getCell('C').numFmt = 'h:mm AM/PM';
    row.getCell('D').numFmt = 'h:mm AM/PM';
    row.getCell('F').numFmt = '0.00';
    row.getCell('G').numFmt = '0.00';

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Summary
  sheet.addRow([]);
  const summaryRow = sheet.addRow(['TOTAL', '', '', '', '', { formula: `SUM(F7:F${sheet.lastRow.number - 1})` }, { formula: `SUM(G7:G${sheet.lastRow.number - 1})` }, '']);
  summaryRow.font = { bold: true };
  summaryRow.getCell('F').numFmt = '0.00';
  summaryRow.getCell('G').numFmt = '0.00';

  await workbook.xlsx.writeFile(`timesheet-${employee.id}-${period.start.toISOString().split('T')[0]}.xlsx`);
}
```

### 5. Budget Tracker

```typescript
async function generateBudgetTracker(categories: BudgetCategory[], year: number) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`Budget ${year}`);

  // Header
  sheet.mergeCells('A1:N1');
  sheet.getCell('A1').value = `Annual Budget - ${year}`;
  sheet.getCell('A1').font = { size: 18, bold: true };
  sheet.getCell('A1').alignment = { horizontal: 'center' };

  // Column headers
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const headers = ['Category', ...months, 'Total'];
  sheet.addRow(headers);
  sheet.getRow(2).font = { bold: true };
  sheet.getRow(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066CC' } };

  // Data rows
  categories.forEach(category => {
    const rowData = [category.name, ...Array(12).fill(0), 0];
    const row = sheet.addRow(rowData);

    // Total formula
    row.getCell('N').value = { formula: `SUM(B${row.number}:M${row.number})` };

    // Format as currency
    for (let col = 2; col <= 14; col++) {
      row.getCell(col).numFmt = '$#,##0.00';
    }
  });

  // Totals row
  sheet.addRow([]);
  const totalRow = sheet.addRow(['TOTAL']);
  totalRow.font = { bold: true };
  for (let col = 2; col <= 14; col++) {
    const colLetter = String.fromCharCode(64 + col);
    totalRow.getCell(col).value = { formula: `SUM(${colLetter}3:${colLetter}${sheet.lastRow.number - 2})` };
    totalRow.getCell(col).numFmt = '$#,##0.00';
  }

  // Chart
  sheet.addChart({
    chart: {
      type: 'bar',
      title: { name: 'Budget by Category' },
      series: [
        {
          name: 'Annual Budget',
          categories: { formula: `'Budget ${year}'!$A$3:$A$${sheet.lastRow.number - 2}` },
          values: { formula: `'Budget ${year}'!$N$3:$N$${sheet.lastRow.number - 2}` }
        }
      ]
    },
    from: { row: 1, col: 15 },
    to: { row: 20, col: 22 }
  });

  await workbook.xlsx.writeFile(`budget-${year}.xlsx`);
}
```

## Best Practices

### Performance Optimization

```typescript
// 1. Use streaming for large files (>100MB)
const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ filename: 'large.xlsx' });

// 2. Disable styles for data-only exports
const workbook2 = new ExcelJS.Workbook();
const worksheet = workbook2.addWorksheet('Data', { properties: { defaultRowHeight: 15 } });

// 3. Use shared formulas for repeated calculations
worksheet.getCell('A2').value = { formula: 'B2*C2', sharedFormula: 'A2' };

// 4. Batch operations instead of cell-by-cell
const rows = Array(1000).fill(null).map((_, i) => [i, `Item ${i}`, Math.random() * 100]);
worksheet.addRows(rows);

// 5. Minimize conditional formatting rules
// Group similar conditions into single rules

// 6. Use appropriate data types
// Don't store numbers as strings

// 7. Compress output files
XLSX.writeFile(workbook, 'output.xlsx', { compression: true });
```

### Error Handling

```typescript
async function safeExcelOperation() {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('input.xlsx');

    // Process...

    await workbook.xlsx.writeFile('output.xlsx');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('File not found');
    } else if (error.message.includes('corrupted')) {
      console.error('File is corrupted');
    } else {
      console.error('Unexpected error:', error);
    }
  }
}
```

### Security

```typescript
// Protect workbook
workbook.security = {
  lockStructure: true,
  lockWindows: true,
  workbookPassword: 'secret123'
};

// Protect worksheet
await worksheet.protect('password', {
  selectLockedCells: true,
  selectUnlockedCells: true,
  formatCells: false,
  insertRows: false,
  deleteRows: false
});

// Sanitize user input
function sanitizeInput(value: any): any {
  if (typeof value === 'string') {
    // Remove formula injection attempts
    if (value.startsWith('=') || value.startsWith('+') || value.startsWith('@')) {
      return `'${value}`;
    }
  }
  return value;
}
```

### Testing

```typescript
import { describe, it, expect } from 'vitest';

describe('Excel Generation', () => {
  it('should create valid workbook', async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Test');
    sheet.addRow(['A', 'B', 'C']);

    const buffer = await workbook.xlsx.writeBuffer();
    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should calculate formulas correctly', () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Test');
    sheet.getCell('A1').value = 10;
    sheet.getCell('A2').value = 20;
    sheet.getCell('A3').value = { formula: 'A1+A2' };

    expect(sheet.getCell('A3').value).toEqual({ formula: 'A1+A2' });
  });
});
```

## Conclusion

Master Excel automation by:
1. Choosing the right library for your use case
2. Understanding formula syntax and best practices
3. Implementing proper error handling and validation
4. Optimizing for performance with large datasets
5. Testing thoroughly across different Excel versions
6. Following security best practices for user-generated content
