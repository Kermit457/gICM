# STATS-GRAB Skill

## Overview
Generate production-ready statistics and metrics display components with various layouts, animations, and chart types. Supports counters, progress bars, trend indicators, and dashboard widgets.

## Metadata
- **ID**: `stats-grab`
- **Category**: Component Generation
- **Complexity**: Intermediate
- **Prerequisites**: React 18+, TypeScript
- **Estimated Time**: 10-15 minutes

## Capabilities
- Animated counters
- Progress bars and rings
- Trend indicators
- Comparison stats
- Mini charts (sparklines)
- Percentage displays
- Time-series stats
- Grid and list layouts
- Real-time updates

## Stats Component Patterns

### 1. Basic Stat Display
```typescript
import React, { useEffect, useState } from 'react';

interface StatProps {
  label: string;
  value: string | number;
  unit?: string;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    period?: string;
  };
  icon?: React.ReactNode;
  variant?: 'default' | 'card' | 'minimal';
  className?: string;
}

export function Stat({
  label,
  value,
  unit,
  change,
  icon,
  variant = 'default',
  className = '',
}: StatProps) {
  if (variant === 'minimal') {
    return (
      <div className={`${className}`}>
        <div className="text-sm text-gray-600 mb-1">{label}</div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">{value}</span>
          {unit && <span className="text-sm text-gray-600">{unit}</span>}
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="text-sm font-medium text-gray-600">{label}</div>
          {icon && (
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              {icon}
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold text-gray-900">{value}</span>
          {unit && <span className="text-sm text-gray-600">{unit}</span>}
        </div>

        {change && (
          <div className="flex items-center gap-1">
            <svg
              className={`w-4 h-4 ${
                change.type === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  change.type === 'increase'
                    ? 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
                    : 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6'
                }
              />
            </svg>
            <span
              className={`text-sm font-medium ${
                change.type === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {Math.abs(change.value)}%
            </span>
            {change.period && (
              <span className="text-sm text-gray-600">{change.period}</span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="text-sm font-medium text-gray-600 mb-1">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        {unit && <span className="text-sm text-gray-600">{unit}</span>}
      </div>
      {change && (
        <div className="flex items-center gap-1 mt-2">
          <span
            className={`text-sm font-medium ${
              change.type === 'increase' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {change.type === 'increase' ? '↑' : '↓'} {Math.abs(change.value)}%
          </span>
          {change.period && (
            <span className="text-sm text-gray-600">{change.period}</span>
          )}
        </div>
      )}
    </div>
  );
}
```

### 2. Animated Counter
```typescript
interface AnimatedCounterProps {
  from: number;
  to: number;
  duration?: number;
  format?: (value: number) => string;
}

export function AnimatedCounter({
  from,
  to,
  duration = 2000,
  format = (v) => v.toLocaleString(),
}: AnimatedCounterProps) {
  const [count, setCount] = useState(from);

  useEffect(() => {
    const startTime = Date.now();
    const difference = to - from;

    const updateCount = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (easeOutQuart)
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      const current = from + difference * easeProgress;

      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        setCount(to);
      }
    };

    requestAnimationFrame(updateCount);
  }, [from, to, duration]);

  return <span>{format(Math.round(count))}</span>;
}

export function AnimatedStat({ label, from = 0, to, ...props }: StatProps & { from?: number }) {
  return (
    <Stat
      {...props}
      label={label}
      value={<AnimatedCounter from={from} to={Number(to)} />}
    />
  );
}
```

### 3. Progress Stats
```typescript
interface ProgressStatProps {
  label: string;
  value: number;
  max: number;
  showPercentage?: boolean;
  color?: 'blue' | 'green' | 'yellow' | 'red';
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressStat({
  label,
  value,
  max,
  showPercentage = true,
  color = 'blue',
  size = 'md',
}: ProgressStatProps) {
  const percentage = Math.round((value / max) * 100);

  const colors = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600',
  };

  const heights = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {showPercentage && (
          <span className="text-sm font-semibold text-gray-900">{percentage}%</span>
        )}
      </div>

      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`${colors[color]} ${heights[size]} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-gray-600">{value.toLocaleString()}</span>
        <span className="text-xs text-gray-600">{max.toLocaleString()}</span>
      </div>
    </div>
  );
}
```

### 4. Circular Progress
```typescript
interface CircularProgressProps {
  label: string;
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export function CircularProgress({
  label,
  value,
  max,
  size = 120,
  strokeWidth = 8,
  color = '#3b82f6',
}: CircularProgressProps) {
  const percentage = (value / max) * 100;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(percentage)}%
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm font-medium text-gray-700">{label}</div>
    </div>
  );
}
```

### 5. Comparison Stats
```typescript
interface ComparisonStatProps {
  label: string;
  current: {
    value: number;
    label: string;
  };
  previous: {
    value: number;
    label: string;
  };
  format?: (value: number) => string;
}

export function ComparisonStat({
  label,
  current,
  previous,
  format = (v) => v.toLocaleString(),
}: ComparisonStatProps) {
  const difference = current.value - previous.value;
  const percentageChange = (difference / previous.value) * 100;
  const isIncrease = difference > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-sm font-medium text-gray-600 mb-4">{label}</h3>

      <div className="grid grid-cols-2 gap-6 mb-4">
        <div>
          <div className="text-xs text-gray-600 mb-1">{current.label}</div>
          <div className="text-2xl font-bold text-gray-900">
            {format(current.value)}
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-600 mb-1">{previous.label}</div>
          <div className="text-2xl font-bold text-gray-400">
            {format(previous.value)}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
            isIncrease
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isIncrease ? 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' : 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6'}
            />
          </svg>
          {Math.abs(percentageChange).toFixed(1)}%
        </div>
        <span className="text-sm text-gray-600">
          {isIncrease ? 'increase' : 'decrease'}
        </span>
      </div>
    </div>
  );
}
```

### 6. Stats Grid
```typescript
interface StatsGridProps {
  title?: string;
  stats: Array<{
    label: string;
    value: string | number;
    change?: {
      value: number;
      type: 'increase' | 'decrease';
    };
    icon?: React.ReactNode;
  }>;
  columns?: 2 | 3 | 4;
}

export function StatsGrid({ title, stats, columns = 4 }: StatsGridProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <section className="py-8">
      {title && (
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
      )}

      <div className={`grid ${gridCols[columns]} gap-6`}>
        {stats.map((stat, index) => (
          <Stat key={index} {...stat} variant="card" />
        ))}
      </div>
    </section>
  );
}
```

### 7. Mini Chart Stat
```typescript
interface MiniChartStatProps {
  label: string;
  value: string | number;
  data: number[];
  color?: string;
}

export function MiniChartStat({
  label,
  value,
  data,
  color = '#3b82f6',
}: MiniChartStatProps) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="text-sm font-medium text-gray-600 mb-2">{label}</div>
      <div className="text-3xl font-bold text-gray-900 mb-4">{value}</div>

      <svg className="w-full h-16" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
```

## Usage Examples

### Dashboard Stats Grid
```typescript
<StatsGrid
  title="Overview"
  columns={4}
  stats={[
    {
      label: 'Total Revenue',
      value: '$45,231',
      change: { value: 12, type: 'increase' },
      icon: <DollarIcon />,
    },
    {
      label: 'Active Users',
      value: '2,345',
      change: { value: 8, type: 'increase' },
      icon: <UsersIcon />,
    },
    {
      label: 'Conversion Rate',
      value: '3.24%',
      change: { value: 2.5, type: 'decrease' },
      icon: <ChartIcon />,
    },
    {
      label: 'Avg. Order Value',
      value: '$67.12',
      change: { value: 5, type: 'increase' },
      icon: <ShoppingIcon />,
    },
  ]}
/>
```

### Progress Dashboard
```typescript
<div className="space-y-6">
  <ProgressStat
    label="Monthly Goal"
    value={7500}
    max={10000}
    color="blue"
  />
  <ProgressStat
    label="Storage Used"
    value={45}
    max={100}
    color="green"
  />
  <CircularProgress
    label="Completion"
    value={75}
    max={100}
  />
</div>
```

## Best Practices

1. **Data Presentation**
   - Use appropriate formats
   - Show trends clearly
   - Provide context
   - Include comparisons

2. **Visual Design**
   - Consistent styling
   - Clear hierarchy
   - Appropriate colors
   - Readable numbers

3. **Performance**
   - Animate efficiently
   - Use requestAnimationFrame
   - Optimize re-renders
   - Lazy load data

4. **Accessibility**
   - Provide text alternatives
   - Use ARIA labels
   - Ensure contrast
   - Support screen readers

## Generated: 2025-01-04
Version: 1.0.0
