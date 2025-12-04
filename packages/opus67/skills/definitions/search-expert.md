# Search Expert

> **ID:** `search-expert`
> **Tier:** 2
> **Token Cost:** 6500
> **MCP Connections:** None

## What This Skill Does

Implement powerful search functionality using Elasticsearch, Meilisearch, or Typesense. Build fast, relevant search experiences with full-text search, faceted filtering, autocomplete, and typo tolerance.

- Full-text search setup and configuration
- Elasticsearch and Meilisearch integration
- Faceted search and filtering
- Autocomplete and suggestions
- Relevance tuning and boosting
- Fuzzy search and typo tolerance
- Search analytics and insights
- Index management and optimization
- Geospatial search
- Multilingual search support

## When to Use

This skill is automatically loaded when:

- **Keywords:** search, elasticsearch, meilisearch, typesense, full-text, autocomplete, faceted
- **File Types:** search.ts, index.ts
- **Directories:** /search, /services

## Core Capabilities

### 1. Full-Text Search Setup

Configure search engines for production use.

**Meilisearch Setup (Recommended for most use cases):**

```typescript
// src/lib/search/meilisearch.ts
import { MeiliSearch, Index, SearchResponse, SearchParams } from 'meilisearch';

const client = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_API_KEY,
});

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  price: number;
  rating: number;
  inStock: boolean;
  tags: string[];
}

class ProductSearchService {
  private index: Index<Product>;

  constructor() {
    this.index = client.index('products');
  }

  async initialize(): Promise<void> {
    // Configure searchable attributes (order matters for relevance)
    await this.index.updateSearchableAttributes([
      'name',
      'description',
      'brand',
      'category',
      'tags',
    ]);

    // Configure filterable attributes
    await this.index.updateFilterableAttributes([
      'category',
      'brand',
      'price',
      'rating',
      'inStock',
      'tags',
    ]);

    // Configure sortable attributes
    await this.index.updateSortableAttributes([
      'price',
      'rating',
      'name',
    ]);

    // Configure ranking rules
    await this.index.updateRankingRules([
      'words',
      'typo',
      'proximity',
      'attribute',
      'sort',
      'exactness',
      'rating:desc', // Custom ranking by rating
    ]);

    // Configure typo tolerance
    await this.index.updateTypoTolerance({
      enabled: true,
      minWordSizeForTypos: {
        oneTypo: 4,
        twoTypos: 8,
      },
    });
  }

  async indexProducts(products: Product[]): Promise<void> {
    await this.index.addDocuments(products, { primaryKey: 'id' });
  }

  async updateProduct(product: Product): Promise<void> {
    await this.index.updateDocuments([product]);
  }

  async deleteProduct(id: string): Promise<void> {
    await this.index.deleteDocument(id);
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult<Product>> {
    const params: SearchParams = {
      limit: options.limit || 20,
      offset: options.offset || 0,
      attributesToHighlight: ['name', 'description'],
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>',
    };

    // Add filters
    if (options.filters) {
      params.filter = this.buildFilters(options.filters);
    }

    // Add sorting
    if (options.sort) {
      params.sort = [options.sort];
    }

    // Add facets
    if (options.facets) {
      params.facets = options.facets;
    }

    const response = await this.index.search(query, params);

    return {
      hits: response.hits,
      total: response.estimatedTotalHits || 0,
      facets: response.facetDistribution,
      processingTimeMs: response.processingTimeMs,
    };
  }

  private buildFilters(filters: Record<string, any>): string {
    const conditions: string[] = [];

    for (const [key, value] of Object.entries(filters)) {
      if (Array.isArray(value)) {
        conditions.push(`${key} IN [${value.map(v => `"${v}"`).join(', ')}]`);
      } else if (typeof value === 'object') {
        if (value.min !== undefined) conditions.push(`${key} >= ${value.min}`);
        if (value.max !== undefined) conditions.push(`${key} <= ${value.max}`);
      } else if (typeof value === 'boolean') {
        conditions.push(`${key} = ${value}`);
      } else {
        conditions.push(`${key} = "${value}"`);
      }
    }

    return conditions.join(' AND ');
  }
}

export const productSearch = new ProductSearchService();
```

**Best Practices:**
- Order searchable attributes by importance
- Use appropriate analyzers for different languages
- Index only necessary fields to save memory
- Implement index versioning for zero-downtime reindexing
- Set up synonyms for common terms

**Gotchas:**
- Full reindexing can be slow - use partial updates
- Search relevance requires tuning for your domain
- Memory usage scales with index size
- Real-time indexing adds latency to writes

### 2. Elasticsearch/Meilisearch Integration

Advanced search engine integration patterns.

**Elasticsearch Client Setup:**

```typescript
// src/lib/search/elasticsearch.ts
import { Client } from '@elastic/elasticsearch';

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  auth: {
    username: process.env.ELASTICSEARCH_USER || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || '',
  },
});

interface ESSearchParams {
  query: string;
  filters?: Record<string, any>;
  page?: number;
  pageSize?: number;
  sort?: { field: string; order: 'asc' | 'desc' };
}

class ElasticsearchService {
  private indexName: string;

  constructor(indexName: string) {
    this.indexName = indexName;
  }

  async createIndex(): Promise<void> {
    const exists = await client.indices.exists({ index: this.indexName });
    if (exists) return;

    await client.indices.create({
      index: this.indexName,
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 1,
          analysis: {
            analyzer: {
              custom_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'asciifolding', 'edge_ngram_filter'],
              },
            },
            filter: {
              edge_ngram_filter: {
                type: 'edge_ngram',
                min_gram: 2,
                max_gram: 20,
              },
            },
          },
        },
        mappings: {
          properties: {
            name: {
              type: 'text',
              analyzer: 'custom_analyzer',
              fields: {
                keyword: { type: 'keyword' },
                suggest: { type: 'completion' },
              },
            },
            description: { type: 'text' },
            category: { type: 'keyword' },
            brand: { type: 'keyword' },
            price: { type: 'float' },
            rating: { type: 'float' },
            inStock: { type: 'boolean' },
            tags: { type: 'keyword' },
            createdAt: { type: 'date' },
          },
        },
      },
    });
  }

  async search(params: ESSearchParams): Promise<SearchResult> {
    const { query, filters, page = 1, pageSize = 20, sort } = params;

    const must: any[] = [];
    const filter: any[] = [];

    // Full-text search
    if (query) {
      must.push({
        multi_match: {
          query,
          fields: ['name^3', 'description', 'brand^2', 'tags'],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      });
    }

    // Filters
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (Array.isArray(value)) {
          filter.push({ terms: { [key]: value } });
        } else if (typeof value === 'object') {
          const range: any = {};
          if (value.min !== undefined) range.gte = value.min;
          if (value.max !== undefined) range.lte = value.max;
          filter.push({ range: { [key]: range } });
        } else {
          filter.push({ term: { [key]: value } });
        }
      }
    }

    const response = await client.search({
      index: this.indexName,
      body: {
        from: (page - 1) * pageSize,
        size: pageSize,
        query: {
          bool: {
            must: must.length > 0 ? must : { match_all: {} },
            filter,
          },
        },
        sort: sort ? [{ [sort.field]: sort.order }] : ['_score'],
        highlight: {
          fields: {
            name: {},
            description: {},
          },
          pre_tags: ['<mark>'],
          post_tags: ['</mark>'],
        },
        aggs: {
          categories: { terms: { field: 'category', size: 20 } },
          brands: { terms: { field: 'brand', size: 20 } },
          price_ranges: {
            range: {
              field: 'price',
              ranges: [
                { to: 50, key: 'Under $50' },
                { from: 50, to: 100, key: '$50-$100' },
                { from: 100, to: 200, key: '$100-$200' },
                { from: 200, key: 'Over $200' },
              ],
            },
          },
        },
      },
    });

    return {
      hits: response.hits.hits.map((hit) => ({
        ...hit._source,
        _score: hit._score,
        _highlight: hit.highlight,
      })),
      total: typeof response.hits.total === 'number' 
        ? response.hits.total 
        : response.hits.total?.value || 0,
      aggregations: response.aggregations,
    };
  }

  async bulk(operations: { index?: any; update?: any; delete?: any }[]): Promise<void> {
    const body = operations.flatMap((op) => {
      if (op.index) {
        return [
          { index: { _index: this.indexName, _id: op.index.id } },
          op.index.document,
        ];
      }
      if (op.update) {
        return [
          { update: { _index: this.indexName, _id: op.update.id } },
          { doc: op.update.document },
        ];
      }
      if (op.delete) {
        return [{ delete: { _index: this.indexName, _id: op.delete.id } }];
      }
      return [];
    });

    await client.bulk({ body, refresh: true });
  }
}

export const esService = new ElasticsearchService('products');
```

**Best Practices:**
- Use bulk operations for indexing large datasets
- Implement proper error handling and retries
- Monitor cluster health and shard allocation
- Use index aliases for zero-downtime reindexing
- Configure appropriate refresh intervals

**Gotchas:**
- Elasticsearch queries can be complex - use query builders
- Deep pagination is expensive - use search_after
- Field types cannot be changed after indexing
- Aggregations on high-cardinality fields are slow

### 3. Faceted Search

Implement filtering with aggregated counts.

**Faceted Search Component:**

```typescript
// src/components/faceted-search.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface FacetValue {
  value: string;
  count: number;
}

interface Facet {
  name: string;
  field: string;
  values: FacetValue[];
}

interface FacetedSearchProps {
  facets: Facet[];
  onFilterChange: (filters: Record<string, string[]>) => void;
}

export function FacetedSearch({ facets, onFilterChange }: FacetedSearchProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});

  // Initialize from URL params
  useEffect(() => {
    const filters: Record<string, string[]> = {};
    facets.forEach((facet) => {
      const values = searchParams.getAll(facet.field);
      if (values.length > 0) {
        filters[facet.field] = values;
      }
    });
    setSelectedFilters(filters);
  }, [searchParams, facets]);

  const toggleFilter = (field: string, value: string) => {
    const current = selectedFilters[field] || [];
    const newValues = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];

    const newFilters = {
      ...selectedFilters,
      [field]: newValues,
    };

    // Remove empty filters
    if (newValues.length === 0) {
      delete newFilters[field];
    }

    setSelectedFilters(newFilters);
    onFilterChange(newFilters);

    // Update URL
    const params = new URLSearchParams(searchParams);
    params.delete(field);
    newValues.forEach((v) => params.append(field, v));
    router.push(`?${params.toString()}`);
  };

  const clearAllFilters = () => {
    setSelectedFilters({});
    onFilterChange({});
    const params = new URLSearchParams(searchParams);
    facets.forEach((facet) => params.delete(facet.field));
    router.push(`?${params.toString()}`);
  };

  const hasActiveFilters = Object.keys(selectedFilters).length > 0;

  return (
    <div className="space-y-6">
      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="text-sm text-primary hover:underline"
        >
          Clear all filters
        </button>
      )}

      {facets.map((facet) => (
        <div key={facet.field} className="space-y-2">
          <h3 className="font-semibold text-sm">{facet.name}</h3>
          <ul className="space-y-1">
            {facet.values.map((fv) => {
              const isSelected = selectedFilters[facet.field]?.includes(fv.value);
              return (
                <li key={fv.value}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleFilter(facet.field, fv.value)}
                      className="rounded"
                    />
                    <span className="text-sm">{fv.value}</span>
                    <span className="text-xs text-muted-foreground ml-auto">({fv.count})</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

**Best Practices:**
- Show facet counts to guide user filtering
- Update counts dynamically as filters change
- Preserve facet values that become zero-count
- Implement facet collapsing for long lists
- Support both OR (within facet) and AND (across facets)

**Gotchas:**
- Too many facets slow down search
- High-cardinality facets need pagination
- Dynamic facets require careful UX design
- Facet counts can be estimates in distributed systems

### 4. Autocomplete

Implement fast, typo-tolerant suggestions.

**Autocomplete Hook:**

```typescript
// src/hooks/useAutocomplete.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { debounce } from 'lodash';

interface Suggestion {
  id: string;
  text: string;
  category?: string;
  metadata?: Record<string, any>;
}

interface UseAutocompleteOptions {
  minChars?: number;
  debounceMs?: number;
  maxSuggestions?: number;
}

export function useAutocomplete(
  fetchSuggestions: (query: string) => Promise<Suggestion[]>,
  options: UseAutocompleteOptions = {}
) {
  const { minChars = 2, debounceMs = 200, maxSuggestions = 10 } = options;

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const debouncedFetch = useCallback(
    debounce(async (q: string) => {
      if (q.length < minChars) {
        setSuggestions([]);
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      try {
        const results = await fetchSuggestions(q);
        setSuggestions(results.slice(0, maxSuggestions));
        setIsOpen(true);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Autocomplete error:', error);
        }
      } finally {
        setIsLoading(false);
      }
    }, debounceMs),
    [fetchSuggestions, minChars, maxSuggestions, debounceMs]
  );

  useEffect(() => {
    debouncedFetch(query);
    return () => debouncedFetch.cancel();
  }, [query, debouncedFetch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, -1));
          break;
        case 'Enter':
          if (selectedIndex >= 0 && suggestions[selectedIndex]) {
            e.preventDefault();
            return suggestions[selectedIndex];
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSelectedIndex(-1);
          break;
      }
      return null;
    },
    [suggestions, selectedIndex]
  );

  const selectSuggestion = useCallback((suggestion: Suggestion) => {
    setQuery(suggestion.text);
    setIsOpen(false);
    setSelectedIndex(-1);
    return suggestion;
  }, []);

  return {
    query,
    setQuery,
    suggestions,
    isLoading,
    isOpen,
    setIsOpen,
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
    selectSuggestion,
  };
}
```

**Autocomplete Component:**

```typescript
// src/components/search-autocomplete.tsx
'use client';

import { useRef, useId } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useAutocomplete } from '@/hooks/useAutocomplete';

interface SearchAutocompleteProps {
  onSearch: (query: string) => void;
  onSelect: (item: any) => void;
}

export function SearchAutocomplete({ onSearch, onSelect }: SearchAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const {
    query,
    setQuery,
    suggestions,
    isLoading,
    isOpen,
    setIsOpen,
    selectedIndex,
    handleKeyDown,
    selectSuggestion,
  } = useAutocomplete(
    async (q) => {
      const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`);
      return res.json();
    },
    { minChars: 2, debounceMs: 150 }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      onSelect(selectSuggestion(suggestions[selectedIndex]));
    } else {
      onSearch(query);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setIsOpen(true)}
            onKeyDown={(e) => {
              const selected = handleKeyDown(e);
              if (selected) onSelect(selected);
            }}
            placeholder="Search products..."
            className="w-full pl-10 pr-10 py-2 border rounded-lg"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined}
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" />
          )}
        </div>
      </form>

      {isOpen && suggestions.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-80 overflow-auto"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              id={`suggestion-${index}`}
              role="option"
              aria-selected={index === selectedIndex}
              className={`px-4 py-2 cursor-pointer ${index === selectedIndex ? 'bg-muted' : 'hover:bg-muted/50'}`}
              onClick={() => onSelect(selectSuggestion(suggestion))}
            >
              <div className="font-medium">{suggestion.text}</div>
              {suggestion.category && (
                <div className="text-xs text-muted-foreground">in {suggestion.category}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

**Best Practices:**
- Debounce requests to reduce server load
- Show loading state for slow responses
- Highlight matching text in suggestions
- Support keyboard navigation
- Cancel pending requests on new input

**Gotchas:**
- Too short debounce feels laggy
- Too long debounce misses keystrokes
- Mobile keyboards may trigger extra events
- Consider prefix-based vs. full-text suggestions

## Real-World Examples

### Example 1: E-commerce Search Page

```typescript
// app/search/page.tsx
import { Suspense } from 'react';
import { productSearch } from '@/lib/search/meilisearch';
import { FacetedSearch } from '@/components/faceted-search';
import { ProductGrid } from '@/components/product-grid';
import { Pagination } from '@/components/pagination';

interface SearchPageProps {
  searchParams: {
    q?: string;
    page?: string;
    category?: string[];
    brand?: string[];
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || '';
  const page = parseInt(searchParams.page || '1');

  const filters: Record<string, any> = {};
  if (searchParams.category) filters.category = searchParams.category;
  if (searchParams.brand) filters.brand = searchParams.brand;
  if (searchParams.minPrice || searchParams.maxPrice) {
    filters.price = {
      min: searchParams.minPrice ? parseFloat(searchParams.minPrice) : undefined,
      max: searchParams.maxPrice ? parseFloat(searchParams.maxPrice) : undefined,
    };
  }

  const results = await productSearch.search(query, {
    filters,
    limit: 24,
    offset: (page - 1) * 24,
    sort: searchParams.sort,
    facets: ['category', 'brand', 'tags'],
  });

  const facets = [
    { name: 'Category', field: 'category', values: results.facets?.category || [] },
    { name: 'Brand', field: 'brand', values: results.facets?.brand || [] },
  ];

  return (
    <div className="grid grid-cols-4 gap-8">
      <aside>
        <FacetedSearch facets={facets} onFilterChange={() => {}} />
      </aside>
      <main className="col-span-3">
        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {results.total} results {query && `for "${query}"`}
          </p>
          <SortSelect value={searchParams.sort} />
        </div>
        <ProductGrid products={results.hits} />
        <Pagination total={results.total} pageSize={24} currentPage={page} />
      </main>
    </div>
  );
}
```

### Example 2: Suggestion API Route

```typescript
// app/api/search/suggest/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { productSearch } from '@/lib/search/meilisearch';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  const results = await productSearch.search(query, {
    limit: 8,
    attributesToRetrieve: ['id', 'name', 'category'],
  });

  const suggestions = results.hits.map((hit) => ({
    id: hit.id,
    text: hit.name,
    category: hit.category,
  }));

  return NextResponse.json(suggestions, {
    headers: { 'Cache-Control': 'public, s-maxage=60' },
  });
}
```

## Related Skills

- **elasticsearch-expert** - Advanced Elasticsearch patterns
- **database-optimization** - Query optimization
- **caching-expert** - Search result caching
- **react-advanced** - Search UI patterns

## Further Reading

- [Meilisearch Documentation](https://docs.meilisearch.com/)
- [Elasticsearch Guide](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Typesense Documentation](https://typesense.org/docs/)
- [Search Relevance Tuning](https://www.algolia.com/doc/guides/managing-results/relevance-overview/)
- [Autocomplete Best Practices](https://baymard.com/blog/autocomplete-design)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
