# Elasticsearch MCP Server

Real-time search and analytics engine with natural language query interface.

## Overview

Enables AI assistants to interact with Elasticsearch/OpenSearch for full-text search, log analysis, and real-time analytics. Perfect for blockchain data indexing and APM monitoring.

## Installation

```bash
npx gicm-stack add mcp/elasticsearch
```

## Environment Variables

```bash
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=changeme
```

## Features

- Full-text search across indices
- Aggregations and analytics
- Natural language to DSL conversion
- Index exploration and management
- APM and log analysis

## Web3 Use Cases

```json
// Search transaction logs
POST /blockchain-logs/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "contract": "0x..." }},
        { "range": { "timestamp": { "gte": "now-7d" }}}
      ]
    }
  }
}

// Aggregate NFT sales by collection
POST /nft-sales/_search
{
  "aggs": {
    "by_collection": {
      "terms": { "field": "collection_name" },
      "aggs": { "total_volume": { "sum": { "field": "price" }}}
    }
  }
}
```

## Tools

- `elasticsearch_search` - Execute search queries
- `elasticsearch_index` - List and explore indices
- `elasticsearch_aggregate` - Run aggregations

## GitHub

https://github.com/elastic/mcp-server-elasticsearch

---

**Version:** 1.0.0
