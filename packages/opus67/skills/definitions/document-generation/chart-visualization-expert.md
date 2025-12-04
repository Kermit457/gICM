# Chart Visualization Expert

You are an expert in creating data visualizations and charts using modern JavaScript libraries like Chart.js, D3.js, Recharts, and Victory for beautiful, interactive, and exportable charts.

## Core Libraries

### Chart.js - Simple & Beautiful
```typescript
import { Chart } from 'chart.js/auto';

const ctx = document.getElementById('myChart') as HTMLCanvasElement;
const chart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [{
      label: 'Revenue',
      data: [12000, 15000, 18000, 22000],
      backgroundColor: '#0088CC'
    }]
  },
  options: {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Quarterly Revenue'
      }
    }
  }
});
```

### Chart.js Node Canvas - Server-Side Rendering
```typescript
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

const width = 800;
const height = 600;
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

const configuration = {
  type: 'line',
  data: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr'],
    datasets: [{
      label: 'Sales',
      data: [10, 15, 12, 18],
      borderColor: '#FF5733',
      tension: 0.4
    }]
  }
};

const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
// Save or embed in PDF/document
```

### Recharts - React-Based
```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const data = [
  { month: 'Jan', revenue: 4000, expenses: 2400 },
  { month: 'Feb', revenue: 3000, expenses: 1398 },
  { month: 'Mar', revenue: 2000, expenses: 9800 }
];

<LineChart width={600} height={300} data={data}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="month" />
  <YAxis />
  <Tooltip />
  <Legend />
  <Line type="monotone" dataKey="revenue" stroke="#0088CC" />
  <Line type="monotone" dataKey="expenses" stroke="#FF5733" />
</LineChart>
```

## Chart Types

### Bar Charts
```typescript
// Vertical bar chart
{
  type: 'bar',
  data: {
    labels: ['Product A', 'Product B', 'Product C'],
    datasets: [{
      label: 'Sales',
      data: [12, 19, 3],
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
    }]
  },
  options: {
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Revenue ($K)'
        }
      }
    }
  }
}

// Horizontal bar chart
{
  type: 'bar',
  data: {
    labels: ['Task 1', 'Task 2', 'Task 3'],
    datasets: [{
      label: 'Hours',
      data: [8, 12, 6],
      backgroundColor: '#0088CC'
    }]
  },
  options: {
    indexAxis: 'y' // Horizontal
  }
}

// Stacked bar chart
{
  type: 'bar',
  data: {
    labels: ['Q1', 'Q2', 'Q3'],
    datasets: [
      {
        label: 'Product A',
        data: [10, 12, 15],
        backgroundColor: '#FF6384'
      },
      {
        label: 'Product B',
        data: [8, 10, 12],
        backgroundColor: '#36A2EB'
      }
    ]
  },
  options: {
    scales: {
      x: { stacked: true },
      y: { stacked: true }
    }
  }
}
```

### Line Charts
```typescript
// Basic line chart
{
  type: 'line',
  data: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [{
      label: 'Temperature',
      data: [18, 20, 22, 19, 21],
      borderColor: '#0088CC',
      fill: false,
      tension: 0.4 // Curve smoothing
    }]
  }
}

// Multi-line with area fill
{
  type: 'line',
  data: {
    labels: months,
    datasets: [
      {
        label: 'Revenue',
        data: revenueData,
        borderColor: '#00AA00',
        backgroundColor: 'rgba(0, 170, 0, 0.1)',
        fill: true
      },
      {
        label: 'Expenses',
        data: expensesData,
        borderColor: '#FF0000',
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        fill: true
      }
    ]
  },
  options: {
    interaction: {
      mode: 'index',
      intersect: false
    }
  }
}

// Step line chart
{
  type: 'line',
  data: {
    labels: ['Stage 1', 'Stage 2', 'Stage 3'],
    datasets: [{
      label: 'Progress',
      data: [0, 50, 100],
      stepped: true,
      borderColor: '#0088CC'
    }]
  }
}
```

### Pie & Doughnut Charts
```typescript
// Pie chart
{
  type: 'pie',
  data: {
    labels: ['Red', 'Blue', 'Yellow'],
    datasets: [{
      data: [300, 50, 100],
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
    }]
  },
  options: {
    plugins: {
      legend: {
        position: 'right'
      },
      datalabels: {
        formatter: (value, context) => {
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return `${percentage}%`;
        }
      }
    }
  }
}

// Doughnut chart
{
  type: 'doughnut',
  data: {
    labels: ['Direct', 'Referral', 'Social'],
    datasets: [{
      data: [55, 30, 15],
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      borderWidth: 2,
      borderColor: '#FFFFFF'
    }]
  },
  options: {
    cutout: '70%', // Inner radius
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.label}: ${context.parsed}%`;
          }
        }
      }
    }
  }
}
```

### Area Charts
```typescript
{
  type: 'line',
  data: {
    labels: months,
    datasets: [{
      label: 'Users',
      data: [1000, 1500, 2000, 2800, 3500, 4200],
      fill: 'origin', // Fill to zero
      backgroundColor: 'rgba(0, 136, 204, 0.2)',
      borderColor: '#0088CC',
      tension: 0.4
    }]
  }
}

// Stacked area
{
  type: 'line',
  data: {
    labels: months,
    datasets: [
      {
        label: 'Organic',
        data: [30, 35, 40, 45, 50, 55],
        fill: 'origin',
        backgroundColor: 'rgba(0, 136, 204, 0.5)'
      },
      {
        label: 'Paid',
        data: [20, 25, 30, 35, 40, 45],
        fill: '-1', // Fill to previous dataset
        backgroundColor: 'rgba(255, 87, 51, 0.5)'
      }
    ]
  },
  options: {
    scales: {
      y: { stacked: true }
    }
  }
}
```

### Scatter & Bubble Charts
```typescript
// Scatter plot
{
  type: 'scatter',
  data: {
    datasets: [{
      label: 'Dataset 1',
      data: [
        { x: 10, y: 20 },
        { x: 15, y: 25 },
        { x: 20, y: 30 }
      ],
      backgroundColor: '#0088CC'
    }]
  },
  options: {
    scales: {
      x: { type: 'linear', position: 'bottom' }
    }
  }
}

// Bubble chart (3D data)
{
  type: 'bubble',
  data: {
    datasets: [{
      label: 'Products',
      data: [
        { x: 20, y: 30, r: 15 }, // r = bubble size
        { x: 40, y: 10, r: 10 }
      ],
      backgroundColor: '#FF6384'
    }]
  }
}
```

### Radar & Polar Charts
```typescript
// Radar chart
{
  type: 'radar',
  data: {
    labels: ['Speed', 'Quality', 'Cost', 'Support', 'Innovation'],
    datasets: [{
      label: 'Product A',
      data: [80, 90, 70, 85, 75],
      backgroundColor: 'rgba(0, 136, 204, 0.2)',
      borderColor: '#0088CC'
    }]
  },
  options: {
    scales: {
      r: {
        beginAtZero: true,
        max: 100
      }
    }
  }
}

// Polar area chart
{
  type: 'polarArea',
  data: {
    labels: ['Red', 'Green', 'Yellow', 'Grey', 'Blue'],
    datasets: [{
      data: [11, 16, 7, 3, 14],
      backgroundColor: ['#FF6384', '#4BC0C0', '#FFCE56', '#E7E9ED', '#36A2EB']
    }]
  }
}
```

## Advanced Customization

### Styling & Themes
```typescript
// Custom theme colors
const brandColors = {
  primary: '#0088CC',
  secondary: '#FF5733',
  success: '#00AA00',
  warning: '#FFA500',
  danger: '#FF0000'
};

// Gradient fills
const ctx = canvas.getContext('2d');
const gradient = ctx.createLinearGradient(0, 0, 0, 400);
gradient.addColorStop(0, 'rgba(0, 136, 204, 0.8)');
gradient.addColorStop(1, 'rgba(0, 136, 204, 0.1)');

{
  type: 'line',
  data: {
    datasets: [{
      backgroundColor: gradient,
      borderColor: '#0088CC'
    }]
  }
}

// Custom fonts
{
  options: {
    font: {
      family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
      size: 14
    },
    plugins: {
      title: {
        font: {
          size: 18,
          weight: 'bold'
        }
      }
    }
  }
}
```

### Annotations & Plugins
```typescript
import annotationPlugin from 'chartjs-plugin-annotation';

Chart.register(annotationPlugin);

{
  options: {
    plugins: {
      annotation: {
        annotations: {
          // Horizontal line (threshold)
          line1: {
            type: 'line',
            yMin: 50,
            yMax: 50,
            borderColor: '#FF0000',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              content: 'Target',
              enabled: true
            }
          },
          // Box (range highlight)
          box1: {
            type: 'box',
            xMin: 'Q2',
            xMax: 'Q3',
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            borderColor: 'rgba(255, 99, 132, 0.5)',
            label: {
              content: 'Growth Period',
              enabled: true
            }
          }
        }
      }
    }
  }
}
```

### Interactive Features
```typescript
{
  options: {
    // Hover effects
    hover: {
      mode: 'nearest',
      intersect: true,
      animationDuration: 400
    },
    // Click events
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const datasetIndex = elements[0].datasetIndex;
        console.log('Clicked:', chart.data.datasets[datasetIndex].data[index]);
      }
    },
    // Tooltips
    plugins: {
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    }
  }
}
```

### Zoom & Pan
```typescript
import zoomPlugin from 'chartjs-plugin-zoom';

Chart.register(zoomPlugin);

{
  options: {
    plugins: {
      zoom: {
        zoom: {
          wheel: {
            enabled: true
          },
          pinch: {
            enabled: true
          },
          mode: 'xy'
        },
        pan: {
          enabled: true,
          mode: 'xy'
        }
      }
    }
  }
}
```

## Data Processing

### Aggregation & Transformation
```typescript
// Group by date
function groupByMonth(data: Array<{ date: Date; value: number }>) {
  const grouped = data.reduce((acc, item) => {
    const month = item.date.toISOString().slice(0, 7); // YYYY-MM
    if (!acc[month]) {
      acc[month] = { sum: 0, count: 0 };
    }
    acc[month].sum += item.value;
    acc[month].count += 1;
    return acc;
  }, {} as Record<string, { sum: number; count: number }>);

  return {
    labels: Object.keys(grouped),
    data: Object.values(grouped).map(g => g.sum / g.count)
  };
}

// Moving average
function movingAverage(data: number[], windowSize: number): number[] {
  return data.map((_, i, arr) => {
    const start = Math.max(0, i - windowSize + 1);
    const window = arr.slice(start, i + 1);
    return window.reduce((sum, val) => sum + val, 0) / window.length;
  });
}

// Percentage change
function percentageChange(data: number[]): number[] {
  return data.map((value, i) => {
    if (i === 0) return 0;
    return ((value - data[i - 1]) / data[i - 1]) * 100;
  });
}
```

### Real-Time Updates
```typescript
// Update chart data dynamically
function updateChart(chart: Chart, newData: number[]) {
  chart.data.datasets[0].data = newData;
  chart.update();
}

// Add data points progressively
function addDataPoint(chart: Chart, label: string, value: number) {
  chart.data.labels.push(label);
  chart.data.datasets[0].data.push(value);

  // Keep last 20 points
  if (chart.data.labels.length > 20) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }

  chart.update('none'); // No animation for real-time
}

// WebSocket integration
ws.on('message', (data) => {
  const parsed = JSON.parse(data);
  addDataPoint(chart, parsed.timestamp, parsed.value);
});
```

## Export & Sharing

### Export as Image
```typescript
// Canvas to image (browser)
const canvas = document.getElementById('myChart') as HTMLCanvasElement;
const imageDataURL = canvas.toDataURL('image/png');

// Download
const link = document.createElement('a');
link.download = 'chart.png';
link.href = imageDataURL;
link.click();

// Node.js export
const buffer = await chartJSNodeCanvas.renderToBuffer(configuration);
fs.writeFileSync('chart.png', buffer);
```

### Export as SVG
```typescript
// Using D3.js for SVG export
import * as d3 from 'd3';

const svg = d3.select('body').append('svg')
  .attr('width', 800)
  .attr('height', 600);

// Draw chart...

const svgString = new XMLSerializer().serializeToString(svg.node());
const blob = new Blob([svgString], { type: 'image/svg+xml' });
const url = URL.createObjectURL(blob);

// Download
const link = document.createElement('a');
link.download = 'chart.svg';
link.href = url;
link.click();
```

### Embed in Documents
```typescript
// Get chart as base64 for embedding
const imageBase64 = canvas.toDataURL('image/png');

// Use in HTML
const html = `<img src="${imageBase64}" alt="Chart" />`;

// Embed in PDF (with PDFKit)
doc.image(imageBase64, 50, 50, { width: 500 });

// Embed in Excel (with ExcelJS)
const imageId = workbook.addImage({
  base64: imageBase64,
  extension: 'png'
});

worksheet.addImage(imageId, {
  tl: { col: 1, row: 5 },
  ext: { width: 500, height: 300 }
});
```

## Performance Optimization

### Large Datasets
```typescript
// Decimation (reduce data points)
{
  options: {
    parsing: false, // Disable parsing for pre-formatted data
    decimation: {
      enabled: true,
      algorithm: 'lttb', // Largest-Triangle-Three-Buckets
      samples: 500
    }
  }
}

// Lazy loading
const lazyPlugin = {
  id: 'lazyLoad',
  beforeUpdate: (chart) => {
    if (!chart.isDataVisible(0, 100)) {
      return; // Don't update if not visible
    }
  }
};

// Virtual scrolling for time-series
{
  options: {
    scales: {
      x: {
        type: 'time',
        min: startDate,
        max: endDate
      }
    },
    plugins: {
      zoom: {
        zoom: {
          onZoom: ({ chart }) => {
            // Load data for visible range
            const { min, max } = chart.scales.x;
            loadDataForRange(min, max);
          }
        }
      }
    }
  }
}
```

### Animation Control
```typescript
// Disable animations for performance
{
  options: {
    animation: false
  }
}

// Selective animations
{
  options: {
    animation: {
      onProgress: (animation) => {
        console.log(`Progress: ${animation.currentStep / animation.numSteps * 100}%`);
      },
      onComplete: () => {
        console.log('Animation complete');
      }
    },
    animations: {
      y: {
        duration: 1000,
        easing: 'easeInOutQuart'
      },
      colors: {
        duration: 500
      }
    }
  }
}
```

## Common Use Cases

### Financial Dashboard
```typescript
function createFinancialDashboard(data: FinancialData) {
  // Revenue trend
  const revenueTrend = new Chart(ctx1, {
    type: 'line',
    data: {
      labels: data.months,
      datasets: [{
        label: 'Revenue',
        data: data.revenue,
        borderColor: '#00AA00',
        fill: true,
        backgroundColor: 'rgba(0, 170, 0, 0.1)'
      }]
    },
    options: {
      plugins: {
        title: { display: true, text: 'Revenue Trend' }
      }
    }
  });

  // Expense breakdown
  const expenseBreakdown = new Chart(ctx2, {
    type: 'doughnut',
    data: {
      labels: ['Salaries', 'Marketing', 'Infrastructure', 'Other'],
      datasets: [{
        data: [45, 25, 20, 10],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
      }]
    }
  });

  // Profit margin
  const profitMargin = new Chart(ctx3, {
    type: 'bar',
    data: {
      labels: data.months,
      datasets: [
        {
          label: 'Revenue',
          data: data.revenue,
          backgroundColor: '#00AA00'
        },
        {
          label: 'Expenses',
          data: data.expenses,
          backgroundColor: '#FF0000'
        }
      ]
    }
  });
}
```

### Analytics Dashboard
```typescript
function createAnalyticsDashboard(metrics: AnalyticsData) {
  // User growth
  const userGrowth = new Chart(ctx, {
    type: 'line',
    data: {
      labels: metrics.dates,
      datasets: [
        {
          label: 'Total Users',
          data: metrics.totalUsers,
          borderColor: '#0088CC',
          yAxisID: 'y'
        },
        {
          label: 'New Users',
          data: metrics.newUsers,
          borderColor: '#FF5733',
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      scales: {
        y: { type: 'linear', position: 'left' },
        y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false } }
      }
    }
  });

  // Traffic sources
  const trafficSources = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Direct', 'Search', 'Social', 'Referral'],
      datasets: [{
        data: metrics.trafficBySource,
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
      }]
    }
  });
}
```

## Best Practices

1. **Choose the Right Chart Type** - Match chart to data type and message
2. **Keep It Simple** - Don't overcomplicate with too many data series
3. **Use Color Meaningfully** - Consistent colors for categories, gradients for scales
4. **Label Everything** - Clear titles, axis labels, and legends
5. **Consider Accessibility** - Color-blind friendly palettes, alt text
6. **Responsive Design** - Charts that adapt to screen size
7. **Performance** - Optimize for large datasets with decimation
8. **Interactive Elements** - Tooltips, zoom, pan for exploration
9. **Export Options** - Provide PNG, SVG, CSV downloads
10. **Testing** - Test across browsers and devices
