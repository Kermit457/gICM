# TABLE-GRAB Skill

## Overview
Generate production-ready table components with sorting, filtering, pagination, selection, and responsive design. Supports data tables, complex grids, and advanced table features.

## Metadata
- **ID**: `table-grab`
- **Category**: Component Generation
- **Complexity**: Advanced
- **Prerequisites**: React 18+, TypeScript, CSS-in-JS or Tailwind
- **Estimated Time**: 15-25 minutes

## Capabilities
- Basic data tables with sorting and filtering
- Advanced tables with pagination and selection
- Responsive tables with mobile-first design
- Server-side pagination and filtering
- Virtualized tables for large datasets
- Editable cells and inline editing
- Export functionality (CSV, Excel, PDF)
- Column customization and reordering
- Row actions and bulk operations
- Loading states and empty states

## Table Component Patterns

### 1. Basic Data Table
```typescript
import React, { useState, useMemo } from 'react';

interface Column<T> {
  key: keyof T | string;
  header: string;
  accessor?: (row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string | number;
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  compact?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

type SortDirection = 'asc' | 'desc' | null;

interface SortConfig {
  key: string;
  direction: SortDirection;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  className = '',
  striped = false,
  hoverable = true,
  bordered = false,
  compact = false,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    const sorted = [...data].sort((a, b) => {
      const column = columns.find(col => col.key === sortConfig.key);
      if (!column) return 0;

      const aValue = column.accessor ? column.accessor(a) : (a as any)[column.key];
      const bValue = column.accessor ? column.accessor(b) : (b as any)[column.key];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [data, sortConfig, columns]);

  const handleSort = (key: string) => {
    const column = columns.find(col => col.key === key);
    if (!column?.sortable) return;

    setSortConfig(current => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null;
    });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return (
        <svg className="w-4 h-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    if (sortConfig.direction === 'asc') {
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const getCellValue = (row: T, column: Column<T>) => {
    if (column.accessor) {
      return column.accessor(row);
    }
    return (row as any)[column.key];
  };

  if (loading) {
    return (
      <div className={`overflow-x-auto ${className}`}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[...Array(5)].map((_, index) => (
              <tr key={index}>
                {columns.map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (sortedData.length === 0) {
    return (
      <div className={`overflow-x-auto ${className}`}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
        </table>
        <div className="text-center py-12 text-gray-500">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className={`min-w-full divide-y divide-gray-200 ${bordered ? 'border border-gray-200' : ''}`}>
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                onClick={() => handleSort(column.key as string)}
                className={`
                  px-${compact ? '4' : '6'} py-${compact ? '2' : '3'}
                  text-${column.align || 'left'}
                  text-xs font-medium text-gray-500 uppercase tracking-wider
                  ${column.sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''}
                `}
                style={{ width: column.width }}
              >
                <div className="flex items-center gap-2">
                  <span>{column.header}</span>
                  {column.sortable && getSortIcon(column.key as string)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`bg-white divide-y divide-gray-200 ${striped ? 'divide-y-0' : ''}`}>
          {sortedData.map((row, rowIndex) => (
            <tr
              key={keyExtractor(row)}
              onClick={() => onRowClick?.(row)}
              className={`
                ${striped && rowIndex % 2 === 1 ? 'bg-gray-50' : ''}
                ${hoverable ? 'hover:bg-gray-100' : ''}
                ${onRowClick ? 'cursor-pointer' : ''}
              `}
            >
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className={`
                    px-${compact ? '4' : '6'} py-${compact ? '2' : '4'}
                    whitespace-nowrap text-sm text-gray-900
                    text-${column.align || 'left'}
                  `}
                >
                  {getCellValue(row, column)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 2. Paginated Table with Filtering
```typescript
import React, { useState, useMemo } from 'react';

interface PaginatedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string | number;
  pageSize?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  className?: string;
}

export function PaginatedTable<T>({
  data,
  columns,
  keyExtractor,
  pageSize = 10,
  searchable = true,
  searchPlaceholder = 'Search...',
  className = '',
}: PaginatedTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;

    return data.filter(row => {
      return columns.some(column => {
        const value = column.accessor
          ? column.accessor(row)
          : (row as any)[column.key];

        return String(value)
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      });
    });
  }, [data, searchQuery, columns]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
      const column = columns.find(col => col.key === sortConfig.key);
      if (!column) return 0;

      const aValue = column.accessor ? column.accessor(a) : (a as any)[column.key];
      const bValue = column.accessor ? column.accessor(b) : (b as any)[column.key];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filteredData, sortConfig, columns]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = sortedData.slice(startIndex, endIndex);

  const handleSort = (key: string) => {
    const column = columns.find(col => col.key === key);
    if (!column?.sortable) return;

    setSortConfig(current => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null;
    });
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {searchable && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(endIndex, sortedData.length)} of {sortedData.length}
          </div>
        </div>
      )}

      <DataTable
        data={currentData}
        columns={columns}
        keyExtractor={keyExtractor}
        striped
        hoverable
        onRowClick={undefined}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex items-center gap-2">
            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === 'number' && goToPage(page)}
                disabled={page === '...'}
                className={`
                  px-4 py-2 text-sm font-medium rounded-lg
                  ${
                    page === currentPage
                      ? 'bg-blue-600 text-white'
                      : page === '...'
                      ? 'bg-white text-gray-400 cursor-default'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
```

### 3. Selectable Table with Bulk Actions
```typescript
interface SelectableTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string | number;
  onSelectionChange?: (selected: T[]) => void;
  actions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: (selected: T[]) => void;
    variant?: 'default' | 'danger';
  }>;
  className?: string;
}

export function SelectableTable<T>({
  data,
  columns,
  keyExtractor,
  onSelectionChange,
  actions = [],
  className = '',
}: SelectableTableProps<T>) {
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set());

  const allSelected = data.length > 0 && selectedRows.size === data.length;
  const someSelected = selectedRows.size > 0 && selectedRows.size < data.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data.map(keyExtractor)));
    }
  };

  const toggleRow = (key: string | number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedRows(newSelected);

    const selectedData = data.filter(row => newSelected.has(keyExtractor(row)));
    onSelectionChange?.(selectedData);
  };

  const selectedData = data.filter(row => selectedRows.has(keyExtractor(row)));

  const selectColumns: Column<T>[] = [
    {
      key: '__select',
      header: '',
      width: 48,
      accessor: (row) => (
        <input
          type="checkbox"
          checked={selectedRows.has(keyExtractor(row))}
          onChange={() => toggleRow(keyExtractor(row))}
          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    ...columns,
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {selectedRows.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-blue-900">
            {selectedRows.size} row{selectedRows.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => action.onClick(selectedData)}
                className={`
                  px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2
                  ${
                    action.variant === 'danger'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
            <button
              onClick={() => setSelectedRows(new Set())}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = someSelected;
                    }
                  }}
                  onChange={toggleAll}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </th>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row) => {
              const key = keyExtractor(row);
              const isSelected = selectedRows.has(key);

              return (
                <tr
                  key={key}
                  className={`
                    hover:bg-gray-50 cursor-pointer
                    ${isSelected ? 'bg-blue-50' : ''}
                  `}
                  onClick={() => toggleRow(key)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRow(key)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  {columns.map((column, colIndex) => (
                    <td
                      key={colIndex}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {column.accessor ? column.accessor(row) : (row as any)[column.key]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### 4. Responsive Mobile Table
```typescript
interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string | number;
  mobileLayout?: 'cards' | 'stacked';
  className?: string;
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  mobileLayout = 'cards',
  className = '',
}: ResponsiveTableProps<T>) {
  return (
    <>
      {/* Desktop Table */}
      <div className={`hidden md:block ${className}`}>
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={keyExtractor}
          striped
          hoverable
        />
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
        {mobileLayout === 'cards' ? (
          // Card Layout
          data.map((row) => (
            <div
              key={keyExtractor(row)}
              className="bg-white border border-gray-200 rounded-lg p-4 space-y-3"
            >
              {columns.map((column, index) => (
                <div key={index} className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-500">
                    {column.header}
                  </span>
                  <span className="text-sm text-gray-900 text-right ml-4">
                    {column.accessor ? column.accessor(row) : (row as any)[column.key]}
                  </span>
                </div>
              ))}
            </div>
          ))
        ) : (
          // Stacked Layout
          data.map((row) => (
            <div
              key={keyExtractor(row)}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden"
            >
              {columns.map((column, index) => (
                <div
                  key={index}
                  className={`
                    flex justify-between items-center px-4 py-3
                    ${index !== columns.length - 1 ? 'border-b border-gray-200' : ''}
                  `}
                >
                  <span className="text-sm font-medium text-gray-500">
                    {column.header}
                  </span>
                  <span className="text-sm text-gray-900">
                    {column.accessor ? column.accessor(row) : (row as any)[column.key]}
                  </span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </>
  );
}
```

## Usage Examples

### Basic Table
```typescript
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
}

const users: User[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'active' },
];

const columns: Column<User>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'email', header: 'Email', sortable: true },
  { key: 'role', header: 'Role', sortable: true },
  {
    key: 'status',
    header: 'Status',
    accessor: (user) => (
      <span
        className={`
          px-2 py-1 text-xs font-medium rounded-full
          ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
        `}
      >
        {user.status}
      </span>
    ),
  },
];

<DataTable data={users} columns={columns} keyExtractor={(user) => user.id} />
```

### Paginated Table
```typescript
<PaginatedTable
  data={users}
  columns={columns}
  keyExtractor={(user) => user.id}
  pageSize={10}
  searchable
  searchPlaceholder="Search users..."
/>
```

### Selectable Table with Actions
```typescript
<SelectableTable
  data={users}
  columns={columns}
  keyExtractor={(user) => user.id}
  onSelectionChange={(selected) => console.log('Selected:', selected)}
  actions={[
    {
      label: 'Export',
      icon: <DownloadIcon />,
      onClick: (selected) => exportUsers(selected),
    },
    {
      label: 'Delete',
      icon: <TrashIcon />,
      onClick: (selected) => deleteUsers(selected),
      variant: 'danger',
    },
  ]}
/>
```

## Best Practices

1. **Performance**
   - Use virtualization for tables with 1000+ rows
   - Implement server-side pagination for large datasets
   - Memoize expensive computations
   - Optimize re-renders with React.memo

2. **Accessibility**
   - Include proper ARIA labels
   - Support keyboard navigation
   - Announce sort changes to screen readers
   - Provide clear focus indicators

3. **Responsive Design**
   - Always provide mobile-friendly layouts
   - Consider horizontal scrolling for wide tables
   - Use card layouts for complex data on mobile
   - Hide non-essential columns on small screens

4. **User Experience**
   - Show loading states during data fetches
   - Provide empty states with helpful messages
   - Include search and filter capabilities
   - Allow column customization for power users

## Styling Variants

### Minimal Table
```css
.table-minimal {
  border-collapse: collapse;
}

.table-minimal th,
.table-minimal td {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.table-minimal th {
  font-weight: 600;
  text-align: left;
  color: #6b7280;
}
```

### Bordered Table
```css
.table-bordered {
  border: 1px solid #e5e7eb;
  border-collapse: separate;
  border-spacing: 0;
}

.table-bordered th,
.table-bordered td {
  border-right: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  padding: 12px;
}

.table-bordered th:last-child,
.table-bordered td:last-child {
  border-right: none;
}
```

## Generated: 2025-01-04
Version: 1.0.0
