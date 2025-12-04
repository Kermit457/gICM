# Chart Visualization Expert

> **ID:** `chart-visualization-expert`
> **Tier:** 2
> **Token Cost:** 8000
> **MCP Connections:** None

## What This Skill Does

- Create data visualizations with Chart.js, D3.js, and Recharts
- Build all chart types: bar, line, pie, scatter, radar, treemap, and more
- Implement interactive features and smooth animations
- Handle real-time data updates efficiently
- Apply custom styling and themes
- Export charts to PNG/SVG

## When to Use

This skill is automatically loaded when:

- **Keywords:** chart, graph, visualization, d3, chartjs, recharts, data viz, dashboard, analytics
- **File Types:** N/A
- **Directories:** charts/, visualizations/, dashboard/

## Core Capabilities

### 1. Data Visualization with Recharts (React)

Build beautiful, responsive charts with the React-native Recharts library.

**Best Practices:**
- Use Recharts for React projects (declarative API, easy integration)
- Make charts responsive by default with ResponsiveContainer
- Use consistent color palettes across dashboards
- Implement proper tooltips and legends for accessibility
- Consider dark mode support from the start

**Common Patterns:**

```tsx
// Basic Line Chart with Recharts
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  name: string;
  revenue: number;
  profit: number;
  expenses: number;
}

const data: DataPoint[] = [
  { name: "Jan", revenue: 4000, profit: 2400, expenses: 1600 },
  { name: "Feb", revenue: 3000, profit: 1398, expenses: 1602 },
  { name: "Mar", revenue: 2000, profit: 9800, expenses: -7800 },
  { name: "Apr", revenue: 2780, profit: 3908, expenses: -1128 },
  { name: "May", revenue: 1890, profit: 4800, expenses: -2910 },
  { name: "Jun", revenue: 2390, profit: 3800, expenses: -1410 },
];

function RevenueChart() {
  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: "#3b82f6", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "#3b82f6" }}
          />
          <Line
            type="monotone"
            dataKey="profit"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: "#10b981", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Area Chart with Gradient
import { AreaChart, Area, defs, linearGradient, stop } from "recharts";

function GradientAreaChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="name" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#3b82f6"
          fillOpacity={1}
          fill="url(#colorRevenue)"
        />
        <Area
          type="monotone"
          dataKey="profit"
          stroke="#10b981"
          fillOpacity={1}
          fill="url(#colorProfit)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Bar Chart with Custom Bars
import { BarChart, Bar, Cell } from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

function ColorfulBarChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" width={80} />
        <Tooltip />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Pie/Donut Chart
import { PieChart, Pie, Sector } from "recharts";

function DonutChart({ data }: { data: { name: string; value: number }[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

    return (
      <g>
        <text x={cx} y={cy - 10} textAnchor="middle" fill="#374151" className="text-lg font-semibold">
          {payload.name}
        </text>
        <text x={cx} y={cy + 15} textAnchor="middle" fill="#6b7280" className="text-sm">
          {`$${value.toLocaleString()} (${(percent * 100).toFixed(0)}%)`}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 4}
          outerRadius={innerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          activeIndex={activeIndex}
          activeShape={renderActiveShape}
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          dataKey="value"
          onMouseEnter={(_, index) => setActiveIndex(index)}
        >
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

// Composed Chart (Multiple Chart Types)
import { ComposedChart, Bar, Line, Area } from "recharts";

function ComposedAnalyticsChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip />
        <Legend />
        <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Line yAxisId="right" type="monotone" dataKey="growth" stroke="#10b981" strokeWidth={2} />
        <Area yAxisId="left" type="monotone" dataKey="baseline" fill="#f3f4f6" stroke="#9ca3af" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
```

**Gotchas:**
- ResponsiveContainer requires parent with explicit height
- Recharts re-renders entire chart on data change - use useMemo for data
- Custom shapes can impact performance with large datasets
- Legend and Tooltip components need to be direct children of chart

### 2. Advanced Visualizations with D3.js

Build custom, interactive visualizations with the powerful D3.js library.

**Best Practices:**
- Use D3 for custom/complex visualizations, Recharts for standard charts
- Integrate D3 with React using useRef and useEffect
- Separate D3 rendering logic from React state management
- Use D3 scales and axes but render with React when possible
- Implement proper cleanup in useEffect

**Common Patterns:**

```tsx
// D3 with React Integration
import * as d3 from "d3";
import { useRef, useEffect, useMemo } from "react";

interface DataPoint {
  date: Date;
  value: number;
}

function D3LineChart({
  data,
  width = 600,
  height = 400,
  margin = { top: 20, right: 30, bottom: 30, left: 40 },
}: {
  data: DataPoint[];
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Scales
  const xScale = useMemo(
    () =>
      d3
        .scaleTime()
        .domain(d3.extent(data, (d) => d.date) as [Date, Date])
        .range([0, innerWidth]),
    [data, innerWidth]
  );

  const yScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.value) || 0])
        .nice()
        .range([innerHeight, 0]),
    [data, innerHeight]
  );

  // Line generator
  const line = useMemo(
    () =>
      d3
        .line<DataPoint>()
        .x((d) => xScale(d.date))
        .y((d) => yScale(d.value))
        .curve(d3.curveMonotoneX),
    [xScale, yScale]
  );

  // Area generator (for gradient fill)
  const area = useMemo(
    () =>
      d3
        .area<DataPoint>()
        .x((d) => xScale(d.date))
        .y0(innerHeight)
        .y1((d) => yScale(d.value))
        .curve(d3.curveMonotoneX),
    [xScale, yScale, innerHeight]
  );

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    // Clear previous render
    svg.selectAll("*").remove();

    // Create gradient
    const gradient = svg
      .append("defs")
      .append("linearGradient")
      .attr("id", "area-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#3b82f6").attr("stop-opacity", 0.3);
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#3b82f6").attr("stop-opacity", 0);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // X Axis
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(6))
      .call((g) => g.select(".domain").attr("stroke", "#e5e7eb"))
      .call((g) => g.selectAll(".tick line").attr("stroke", "#e5e7eb"))
      .call((g) => g.selectAll(".tick text").attr("fill", "#6b7280"));

    // Y Axis
    g.append("g")
      .call(d3.axisLeft(yScale).ticks(5))
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke", "#e5e7eb").attr("x2", innerWidth))
      .call((g) => g.selectAll(".tick text").attr("fill", "#6b7280"));

    // Area
    g.append("path")
      .datum(data)
      .attr("fill", "url(#area-gradient)")
      .attr("d", area);

    // Line
    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Dots
    g.selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", (d) => xScale(d.date))
      .attr("cy", (d) => yScale(d.value))
      .attr("r", 4)
      .attr("fill", "#3b82f6")
      .attr("stroke", "white")
      .attr("stroke-width", 2);
  }, [data, xScale, yScale, line, area, innerWidth, innerHeight, margin]);

  return <svg ref={svgRef} width={width} height={height} />;
}

// D3 Force-Directed Graph
interface Node {
  id: string;
  group: number;
}

interface Link {
  source: string;
  target: string;
  value: number;
}

function ForceGraph({
  nodes,
  links,
  width = 600,
  height = 400,
}: {
  nodes: Node[];
  links: Link[];
  width?: number;
  height?: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Create simulation
    const simulation = d3
      .forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance(50)
      )
      .force("charge", d3.forceManyBody().strength(-100))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(20));

    // Draw links
    const link = svg
      .append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d) => Math.sqrt(d.value));

    // Draw nodes
    const node = svg
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", 8)
      .attr("fill", (d) => color(String(d.group)))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .call(drag(simulation) as any);

    // Labels
    const label = svg
      .append("g")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .text((d) => d.id)
      .attr("font-size", 10)
      .attr("fill", "#374151")
      .attr("dx", 12)
      .attr("dy", 4);

    // Update positions on tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);

      label.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y);
    });

    // Drag behavior
    function drag(simulation: d3.Simulation<d3.SimulationNodeDatum, undefined>) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
    }

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [nodes, links, width, height]);

  return <svg ref={svgRef} width={width} height={height} />;
}

// D3 Treemap
function Treemap({
  data,
  width = 600,
  height = 400,
}: {
  data: d3.HierarchyNode<any>;
  width?: number;
  height?: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const color = d3.scaleOrdinal(d3.schemeTableau10);

    const root = d3
      .treemap<any>()
      .size([width, height])
      .padding(2)
      .round(true)(data.sum((d) => d.value).sort((a, b) => (b.value || 0) - (a.value || 0)));

    const cell = svg
      .selectAll("g")
      .data(root.leaves())
      .enter()
      .append("g")
      .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

    cell
      .append("rect")
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("fill", (d) => color(d.parent?.data.name || ""))
      .attr("rx", 4)
      .style("cursor", "pointer")
      .on("mouseover", function () {
        d3.select(this).attr("opacity", 0.8);
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 1);
      });

    cell
      .append("text")
      .attr("x", 4)
      .attr("y", 14)
      .attr("fill", "white")
      .attr("font-size", 12)
      .text((d) => d.data.name)
      .each(function (d) {
        const textWidth = (this as SVGTextElement).getComputedTextLength();
        if (textWidth > d.x1 - d.x0 - 8) {
          d3.select(this).text("");
        }
      });

    cell
      .append("text")
      .attr("x", 4)
      .attr("y", 28)
      .attr("fill", "rgba(255,255,255,0.8)")
      .attr("font-size", 10)
      .text((d) => `$${d.value?.toLocaleString()}`);
  }, [data, width, height]);

  return <svg ref={svgRef} width={width} height={height} />;
}
```

**Gotchas:**
- D3 manipulates DOM directly - can conflict with React's virtual DOM
- Always clean up D3 selections and simulations in useEffect return
- Use useMemo for scales and generators to avoid recreating them
- D3 v7 uses ES modules - ensure proper imports

### 3. Interactive Features and Animations

Add engaging interactions and smooth transitions to visualizations.

**Best Practices:**
- Use CSS transitions for simple hover effects
- Leverage D3 transitions for complex animations
- Implement proper tooltip positioning
- Add zoom and pan for large datasets
- Consider mobile interactions (touch, pinch)

**Common Patterns:**

```tsx
// Interactive Tooltip Component
function ChartTooltip({
  active,
  payload,
  label,
  coordinate,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  coordinate?: { x: number; y: number };
}) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="absolute pointer-events-none z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[150px]"
      style={{
        left: coordinate?.x ?? 0,
        top: (coordinate?.y ?? 0) - 10,
        transform: "translate(-50%, -100%)",
      }}
    >
      <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600">{entry.name}</span>
          </div>
          <span className="text-sm font-medium">${entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// Animated Number Counter
function AnimatedNumber({
  value,
  duration = 1000,
  prefix = "",
  suffix = "",
}: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);

  useEffect(() => {
    const startValue = previousValue.current;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out-cubic)
      const eased = 1 - Math.pow(1 - progress, 3);

      const current = startValue + (value - startValue) * eased;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        previousValue.current = value;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <span className="tabular-nums">
      {prefix}
      {Math.round(displayValue).toLocaleString()}
      {suffix}
    </span>
  );
}

// Zoom and Pan Chart
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

function ZoomableChart({ children }: { children: React.ReactNode }) {
  return (
    <TransformWrapper
      initialScale={1}
      minScale={0.5}
      maxScale={4}
      wheel={{ step: 0.1 }}
    >
      {({ zoomIn, zoomOut, resetTransform }) => (
        <>
          <div className="absolute top-2 right-2 flex gap-2 z-10">
            <button
              onClick={() => zoomIn()}
              className="p-2 bg-white rounded-lg shadow hover:bg-gray-50"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => zoomOut()}
              className="p-2 bg-white rounded-lg shadow hover:bg-gray-50"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => resetTransform()}
              className="p-2 bg-white rounded-lg shadow hover:bg-gray-50"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
          <TransformComponent>{children}</TransformComponent>
        </>
      )}
    </TransformWrapper>
  );
}

// Brush Selection for Time Range
import { Brush, ReferenceArea } from "recharts";

function BrushableChart({ data }: { data: DataPoint[] }) {
  const [brushRange, setBrushRange] = useState<{ start: number; end: number } | null>(null);

  const filteredData = useMemo(() => {
    if (!brushRange) return data;
    return data.slice(brushRange.start, brushRange.end + 1);
  }, [data, brushRange]);

  return (
    <div className="space-y-4">
      {/* Main chart with filtered data */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={filteredData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#3b82f6" />
        </LineChart>
      </ResponsiveContainer>

      {/* Brush selector with full data */}
      <ResponsiveContainer width="100%" height={80}>
        <LineChart data={data}>
          <XAxis dataKey="name" height={0} />
          <Line type="monotone" dataKey="value" stroke="#9ca3af" dot={false} />
          <Brush
            dataKey="name"
            height={30}
            stroke="#3b82f6"
            onChange={(range) => {
              setBrushRange({
                start: range.startIndex ?? 0,
                end: range.endIndex ?? data.length - 1,
              });
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**Gotchas:**
- Heavy animations can impact performance with large datasets
- Test tooltip positioning at chart edges
- Zoom/pan can interfere with page scroll on mobile
- Consider debouncing brush change handlers

### 4. Real-Time Data Updates

Handle streaming data and live updates efficiently.

**Best Practices:**
- Use WebSocket or Server-Sent Events for real-time data
- Implement data windowing to limit displayed points
- Batch updates for performance
- Show loading and error states
- Consider using a data buffer for smooth animations

**Common Patterns:**

```tsx
// Real-Time Line Chart
function RealTimeChart() {
  const [data, setData] = useState<{ time: number; value: number }[]>([]);
  const maxPoints = 50;

  useEffect(() => {
    // Simulate real-time data
    const interval = setInterval(() => {
      setData((prev) => {
        const newPoint = {
          time: Date.now(),
          value: Math.random() * 100 + 50 + Math.sin(Date.now() / 1000) * 20,
        };

        const updated = [...prev, newPoint];
        // Keep only last N points
        return updated.slice(-maxPoints);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="time"
          type="number"
          domain={["dataMin", "dataMax"]}
          tickFormatter={(time) => new Date(time).toLocaleTimeString()}
        />
        <YAxis domain={[0, 200]} />
        <Tooltip
          labelFormatter={(time) => new Date(time).toLocaleTimeString()}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false} // Disable animation for performance
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// WebSocket Real-Time Data
function useWebSocketData(url: string) {
  const [data, setData] = useState<any[]>([]);
  const [status, setStatus] = useState<"connecting" | "connected" | "error">("connecting");
  const bufferRef = useRef<any[]>([]);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setStatus("connected");
    };

    ws.onmessage = (event) => {
      const newData = JSON.parse(event.data);
      bufferRef.current.push(newData);
    };

    ws.onerror = () => {
      setStatus("error");
    };

    // Batch updates every 100ms for performance
    const flushInterval = setInterval(() => {
      if (bufferRef.current.length > 0) {
        setData((prev) => {
          const updated = [...prev, ...bufferRef.current];
          bufferRef.current = [];
          return updated.slice(-100); // Keep last 100 points
        });
      }
    }, 100);

    return () => {
      ws.close();
      clearInterval(flushInterval);
    };
  }, [url]);

  return { data, status };
}

// Live Gauge Chart
function LiveGauge({ value, min = 0, max = 100 }: { value: number; min?: number; max?: number }) {
  const percentage = ((value - min) / (max - min)) * 100;
  const rotation = -90 + (percentage / 100) * 180;

  const getColor = (pct: number) => {
    if (pct < 33) return "#10b981";
    if (pct < 66) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className="relative w-48 h-24 overflow-hidden">
      {/* Background arc */}
      <div className="absolute inset-0 border-8 border-gray-200 rounded-t-full" />

      {/* Value arc */}
      <div
        className="absolute inset-0 border-8 rounded-t-full transition-all duration-500"
        style={{
          borderColor: getColor(percentage),
          clipPath: `polygon(0 100%, 0 0, ${percentage}% 0, ${percentage}% 100%)`,
        }}
      />

      {/* Needle */}
      <div
        className="absolute bottom-0 left-1/2 w-1 h-20 bg-gray-800 origin-bottom transition-transform duration-500"
        style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
      />

      {/* Center dot */}
      <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-gray-800 rounded-full -translate-x-1/2 translate-y-1/2" />

      {/* Value display */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center">
        <span className="text-2xl font-bold">{value.toFixed(1)}</span>
        <span className="text-sm text-gray-500 ml-1">/ {max}</span>
      </div>
    </div>
  );
}
```

**Gotchas:**
- Disable chart animations for real-time data
- WebSocket reconnection logic is essential
- Buffer updates to avoid too frequent re-renders
- Consider virtual scrolling for historical data

### 5. Custom Styling and Themes

Create consistent, branded chart designs with theme support.

**Best Practices:**
- Define a chart theme with colors, fonts, and spacing
- Support dark mode from the start
- Use CSS variables for dynamic theming
- Create reusable chart wrapper components
- Document theme tokens for consistency

**Common Patterns:**

```tsx
// Chart Theme Configuration
const chartTheme = {
  light: {
    background: "#ffffff",
    text: "#374151",
    textMuted: "#6b7280",
    grid: "#e5e7eb",
    colors: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"],
    tooltip: {
      background: "#ffffff",
      border: "#e5e7eb",
      shadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    },
  },
  dark: {
    background: "#1f2937",
    text: "#f3f4f6",
    textMuted: "#9ca3af",
    grid: "#374151",
    colors: ["#60a5fa", "#34d399", "#fbbf24", "#f87171", "#a78bfa", "#f472b6"],
    tooltip: {
      background: "#1f2937",
      border: "#374151",
      shadow: "0 4px 6px -1px rgb(0 0 0 / 0.3)",
    },
  },
};

// Theme Context
const ChartThemeContext = createContext(chartTheme.light);

function ChartThemeProvider({
  children,
  mode = "light",
}: {
  children: React.ReactNode;
  mode?: "light" | "dark";
}) {
  return (
    <ChartThemeContext.Provider value={chartTheme[mode]}>
      {children}
    </ChartThemeContext.Provider>
  );
}

function useChartTheme() {
  return useContext(ChartThemeContext);
}

// Themed Chart Component
function ThemedLineChart({ data }: { data: DataPoint[] }) {
  const theme = useChartTheme();

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
        <XAxis dataKey="name" stroke={theme.textMuted} fontSize={12} />
        <YAxis stroke={theme.textMuted} fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: theme.tooltip.background,
            border: `1px solid ${theme.tooltip.border}`,
            boxShadow: theme.tooltip.shadow,
            borderRadius: "8px",
          }}
          labelStyle={{ color: theme.text }}
        />
        <Legend wrapperStyle={{ color: theme.text }} />
        {["revenue", "profit", "expenses"].map((key, index) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={theme.colors[index]}
            strokeWidth={2}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// CSS Variables for D3 Charts
const chartStyles = `
  :root {
    --chart-bg: #ffffff;
    --chart-text: #374151;
    --chart-grid: #e5e7eb;
    --chart-primary: #3b82f6;
    --chart-secondary: #10b981;
    --chart-accent: #f59e0b;
  }

  .dark {
    --chart-bg: #1f2937;
    --chart-text: #f3f4f6;
    --chart-grid: #374151;
    --chart-primary: #60a5fa;
    --chart-secondary: #34d399;
    --chart-accent: #fbbf24;
  }

  .chart-axis text {
    fill: var(--chart-text);
  }

  .chart-grid line {
    stroke: var(--chart-grid);
  }
`;

// Dashboard Card Wrapper
function ChartCard({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
```

**Gotchas:**
- Test theme switching with animation enabled
- Some chart libraries cache styles - may need force update
- SVG elements use fill/stroke, not CSS color
- Consider high contrast mode for accessibility

### 6. Export Charts to PNG/SVG

Enable users to download charts as images for sharing and reports.

**Best Practices:**
- Support multiple export formats (PNG, SVG, PDF)
- Include chart title and timestamp in exports
- Handle high-DPI displays for crisp exports
- Show loading state during export
- Consider server-side rendering for large exports

**Common Patterns:**

```tsx
// Export Utilities
async function exportToPNG(
  element: HTMLElement,
  filename: string,
  scale: number = 2
): Promise<void> {
  const html2canvas = (await import("html2canvas")).default;

  const canvas = await html2canvas(element, {
    scale,
    backgroundColor: "#ffffff",
    logging: false,
  });

  const link = document.createElement("a");
  link.download = `${filename}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function exportToSVG(svgElement: SVGSVGElement, filename: string): void {
  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(svgElement);
  const blob = new Blob([svgStr], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.download = `${filename}.svg`;
  link.href = url;
  link.click();

  URL.revokeObjectURL(url);
}

// Exportable Chart Wrapper
function ExportableChart({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: "png" | "svg") => {
    if (!chartRef.current) return;

    setIsExporting(true);
    try {
      const filename = `${title.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

      if (format === "png") {
        await exportToPNG(chartRef.current, filename);
      } else {
        const svg = chartRef.current.querySelector("svg");
        if (svg) {
          exportToSVG(svg as SVGSVGElement, filename);
        }
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      {/* Export Menu */}
      <div className="absolute top-2 right-2 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-2 bg-white rounded-lg shadow hover:bg-gray-50 disabled:opacity-50"
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleExport("png")}>
              <Image className="w-4 h-4 mr-2" />
              Export as PNG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("svg")}>
              <FileCode className="w-4 h-4 mr-2" />
              Export as SVG
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Chart Container */}
      <div ref={chartRef} className="bg-white p-4">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        {children}
        <p className="text-xs text-gray-400 mt-4">
          Generated on {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

// Server-Side Chart Export (for large/complex charts)
// pages/api/export-chart.ts
import { createCanvas } from "canvas";
import { JSDOM } from "jsdom";
import * as d3 from "d3";

export async function POST(req: Request) {
  const { data, width, height, type } = await req.json();

  // Create virtual DOM
  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
  const document = dom.window.document;

  // Create SVG using D3
  const svg = d3
    .select(document.body)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("xmlns", "http://www.w3.org/2000/svg");

  // ... render chart with D3

  // Get SVG string
  const svgString = document.body.innerHTML;

  if (type === "svg") {
    return new Response(svgString, {
      headers: { "Content-Type": "image/svg+xml" },
    });
  }

  // Convert to PNG using canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  // ... render SVG to canvas

  return new Response(canvas.toBuffer("image/png"), {
    headers: { "Content-Type": "image/png" },
  });
}
```

**Gotchas:**
- html2canvas may not capture all CSS styles
- SVG exports may lose external fonts
- Large charts can cause memory issues during export
- Consider rate limiting server-side exports

## Real-World Examples

### Example 1: Complete Analytics Dashboard

```tsx
function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState("7d");
  const { data, isLoading } = useAnalyticsData(dateRange);

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.kpis.map((kpi) => (
          <KPICard
            key={kpi.id}
            title={kpi.title}
            value={kpi.value}
            change={kpi.change}
            trend={kpi.trend}
          />
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Revenue Over Time">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.revenue}>
              <defs>
                <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="url(#revenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Sales by Category">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.categories}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
              >
                {data.categories.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Data Table with Sparklines */}
      <ChartCard title="Product Performance">
        <ProductPerformanceTable data={data.products} />
      </ChartCard>
    </div>
  );
}
```

## Related Skills

- `react-expert` - React patterns for chart components
- `tailwind-ui-designer` - Styling chart containers
- `typescript-expert` - Type-safe chart data
- `data-processing` - Data transformation for visualization
- `accessibility-expert` - Making charts accessible

## Further Reading

- [Recharts Documentation](https://recharts.org) - React charting library
- [D3.js Documentation](https://d3js.org) - Data-driven documents
- [Observable](https://observablehq.com) - D3 examples and notebooks
- [Data Visualization Catalogue](https://datavizcatalogue.com) - Chart type reference
- [Storytelling with Data](https://www.storytellingwithdata.com) - Visualization best practices

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
*Master data visualization for compelling insights*
