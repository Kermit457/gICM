# Notion Navigator

> **ID:** `notion-navigator`
> **Tier:** 3
> **Token Cost:** 4000
> **MCP Connections:** notion

## 🎯 What This Skill Does

Master Notion API integration for automated documentation, knowledge base management, content synchronization, and database operations using the official Notion SDK.

**Core Capabilities:**
- Notion page creation and management
- Database query and manipulation
- Block content operations
- Documentation automation
- Knowledge base search
- Content synchronization
- Rich text formatting
- File and media handling

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** notion, docs, wiki, notes, knowledge base, documentation
- **File Types:** N/A
- **Directories:** `docs/`, `wiki/`

## 🚀 Core Capabilities

### 1. Notion Page Management

**Installation & Setup:**

```typescript
// Install Notion SDK
npm install @notionhq/client

// Environment configuration
// .env
NOTION_API_KEY=secret_xxxxxxxxxxxxx
NOTION_DATABASE_ID=abc123...
```

**Basic Page Operations:**

```typescript
// lib/notion.ts
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

export async function createPage(
  parentId: string,
  title: string,
  content: any[]
) {
  try {
    const response = await notion.pages.create({
      parent: {
        type: 'page_id',
        page_id: parentId,
      },
      properties: {
        title: {
          title: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
      },
      children: content,
    });

    return { success: true, page: response };
  } catch (error) {
    console.error('Page creation failed:', error);
    return { success: false, error };
  }
}

export async function getPage(pageId: string) {
  try {
    const page = await notion.pages.retrieve({
      page_id: pageId,
    });

    return page;
  } catch (error) {
    console.error('Page retrieval failed:', error);
    return null;
  }
}

export async function updatePage(
  pageId: string,
  properties: Record<string, any>
) {
  try {
    const response = await notion.pages.update({
      page_id: pageId,
      properties,
    });

    return { success: true, page: response };
  } catch (error) {
    console.error('Page update failed:', error);
    return { success: false, error };
  }
}

export async function archivePage(pageId: string) {
  try {
    await notion.pages.update({
      page_id: pageId,
      archived: true,
    });

    return { success: true };
  } catch (error) {
    console.error('Page archival failed:', error);
    return { success: false, error };
  }
}
```

**Page Content Blocks:**

```typescript
// lib/notion-blocks.ts
export async function appendBlocks(pageId: string, blocks: any[]) {
  try {
    const response = await notion.blocks.children.append({
      block_id: pageId,
      children: blocks,
    });

    return { success: true, blocks: response.results };
  } catch (error) {
    console.error('Block append failed:', error);
    return { success: false, error };
  }
}

export async function getBlockChildren(blockId: string) {
  try {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      page_size: 100,
    });

    return response.results;
  } catch (error) {
    console.error('Block retrieval failed:', error);
    return [];
  }
}

// Block Builders
export const blockBuilders = {
  heading1: (text: string) => ({
    object: 'block',
    type: 'heading_1',
    heading_1: {
      rich_text: [{ type: 'text', text: { content: text } }],
    },
  }),

  heading2: (text: string) => ({
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [{ type: 'text', text: { content: text } }],
    },
  }),

  paragraph: (text: string, bold = false, italic = false) => ({
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [
        {
          type: 'text',
          text: { content: text },
          annotations: { bold, italic },
        },
      ],
    },
  }),

  bulletedList: (items: string[]) =>
    items.map((item) => ({
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [{ type: 'text', text: { content: item } }],
      },
    })),

  numberedList: (items: string[]) =>
    items.map((item) => ({
      object: 'block',
      type: 'numbered_list_item',
      numbered_list_item: {
        rich_text: [{ type: 'text', text: { content: item } }],
      },
    })),

  code: (code: string, language: string = 'typescript') => ({
    object: 'block',
    type: 'code',
    code: {
      rich_text: [{ type: 'text', text: { content: code } }],
      language,
    },
  }),

  callout: (text: string, emoji: string = '💡') => ({
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: [{ type: 'text', text: { content: text } }],
      icon: { type: 'emoji', emoji },
    },
  }),

  divider: () => ({
    object: 'block',
    type: 'divider',
    divider: {},
  }),

  table: (headers: string[], rows: string[][]) => ({
    object: 'block',
    type: 'table',
    table: {
      table_width: headers.length,
      has_column_header: true,
      has_row_header: false,
      children: [
        {
          type: 'table_row',
          table_row: {
            cells: headers.map((h) => [{ type: 'text', text: { content: h } }]),
          },
        },
        ...rows.map((row) => ({
          type: 'table_row',
          table_row: {
            cells: row.map((cell) => [{ type: 'text', text: { content: cell } }]),
          },
        })),
      ],
    },
  }),

  embed: (url: string) => ({
    object: 'block',
    type: 'embed',
    embed: { url },
  }),

  image: (url: string, caption?: string) => ({
    object: 'block',
    type: 'image',
    image: {
      type: 'external',
      external: { url },
      caption: caption ? [{ type: 'text', text: { content: caption } }] : [],
    },
  }),
};
```

**Best Practices:**
- Use page icons and covers for better organization
- Implement pagination for large result sets
- Cache page IDs to reduce API calls
- Use batch operations when possible
- Handle rate limits gracefully
- Validate block types before creation

**Gotchas:**
- Rate limit is 3 requests per second
- Maximum 100 blocks per append operation
- Block children must be fetched separately
- Some block types have nested structures

### 2. Database Operations

**Database Queries:**

```typescript
// lib/notion-database.ts
export async function queryDatabase(
  databaseId: string,
  filter?: any,
  sorts?: any[]
) {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter,
      sorts,
      page_size: 100,
    });

    return { success: true, results: response.results };
  } catch (error) {
    console.error('Database query failed:', error);
    return { success: false, results: [] };
  }
}

// Example: Query with filters
export async function getTasksByStatus(
  databaseId: string,
  status: string
) {
  return queryDatabase(databaseId, {
    property: 'Status',
    select: {
      equals: status,
    },
  });
}

export async function getRecentPages(databaseId: string, days: number = 7) {
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return queryDatabase(
    databaseId,
    {
      property: 'Created',
      date: {
        after: date.toISOString(),
      },
    },
    [
      {
        property: 'Created',
        direction: 'descending',
      },
    ]
  );
}
```

**Database Item Creation:**

```typescript
// lib/notion-items.ts
export async function createDatabaseItem(
  databaseId: string,
  properties: Record<string, any>
) {
  try {
    const response = await notion.pages.create({
      parent: {
        type: 'database_id',
        database_id: databaseId,
      },
      properties,
    });

    return { success: true, item: response };
  } catch (error) {
    console.error('Database item creation failed:', error);
    return { success: false, error };
  }
}

// Property Builders
export const propertyBuilders = {
  title: (text: string) => ({
    title: [{ text: { content: text } }],
  }),

  richText: (text: string) => ({
    rich_text: [{ text: { content: text } }],
  }),

  number: (value: number) => ({
    number: value,
  }),

  select: (option: string) => ({
    select: { name: option },
  }),

  multiSelect: (options: string[]) => ({
    multi_select: options.map((name) => ({ name })),
  }),

  date: (start: Date, end?: Date) => ({
    date: {
      start: start.toISOString(),
      end: end?.toISOString(),
    },
  }),

  checkbox: (checked: boolean) => ({
    checkbox: checked,
  }),

  url: (url: string) => ({
    url,
  }),

  email: (email: string) => ({
    email,
  }),

  phone: (phone: string) => ({
    phone_number: phone,
  }),

  relation: (pageIds: string[]) => ({
    relation: pageIds.map((id) => ({ id })),
  }),
};
```

**Best Practices:**
- Use database templates for consistency
- Implement property validation before creation
- Use relations to link related data
- Create views for different use cases
- Export data regularly for backup
- Use rollups for aggregations

**Gotchas:**
- Property names are case-sensitive
- Some properties are read-only (Created time, Last edited)
- Select options must exist before use
- Relations require valid page IDs

### 3. Knowledge Base Search

**Search Implementation:**

```typescript
// lib/notion-search.ts
export async function searchPages(query: string, filter?: any) {
  try {
    const response = await notion.search({
      query,
      filter,
      page_size: 100,
    });

    return { success: true, results: response.results };
  } catch (error) {
    console.error('Search failed:', error);
    return { success: false, results: [] };
  }
}

export async function searchByTitle(title: string) {
  return searchPages(title, {
    property: 'object',
    value: 'page',
  });
}

export async function searchDatabases(query: string) {
  return searchPages(query, {
    property: 'object',
    value: 'database',
  });
}

// Fuzzy search helper
export async function fuzzySearch(
  query: string,
  threshold: number = 0.6
): Promise<any[]> {
  const { results } = await searchPages(query);

  // Filter and sort by relevance
  return results
    .filter((page: any) => {
      const title = getPageTitle(page);
      return calculateSimilarity(query, title) >= threshold;
    })
    .sort((a: any, b: any) => {
      const titleA = getPageTitle(a);
      const titleB = getPageTitle(b);
      return (
        calculateSimilarity(query, titleB) - calculateSimilarity(query, titleA)
      );
    });
}

function getPageTitle(page: any): string {
  const titleProperty = page.properties?.title || page.properties?.Name;
  if (!titleProperty) return '';

  return titleProperty.title?.[0]?.text?.content || '';
}

function calculateSimilarity(a: string, b: string): number {
  // Simple similarity calculation
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();

  if (bLower.includes(aLower)) return 1;

  const words = aLower.split(' ');
  const matches = words.filter((word) => bLower.includes(word));

  return matches.length / words.length;
}
```

**Best Practices:**
- Implement client-side caching for search results
- Use filters to narrow search scope
- Sort results by relevance
- Implement pagination for large result sets
- Cache frequently accessed pages
- Use webhooks for real-time updates

**Gotchas:**
- Search is limited to pages shared with the integration
- Results are limited to 100 per query
- Search is case-insensitive but exact matches are prioritized
- Archived pages are excluded from search

### 4. Documentation Automation

**Auto-Generate API Documentation:**

```typescript
// scripts/sync-api-docs.ts
import { createPage, blockBuilders } from './lib/notion';

interface APIEndpoint {
  method: string;
  path: string;
  description: string;
  parameters: { name: string; type: string; required: boolean }[];
  responses: { status: number; description: string }[];
}

export async function syncAPIDocumentation(
  parentPageId: string,
  endpoints: APIEndpoint[]
) {
  for (const endpoint of endpoints) {
    const title = `${endpoint.method} ${endpoint.path}`;

    const content = [
      blockBuilders.heading1(title),
      blockBuilders.paragraph(endpoint.description),
      blockBuilders.heading2('Parameters'),
      ...blockBuilders.bulletedList(
        endpoint.parameters.map(
          (p) => `${p.name} (${p.type}) ${p.required ? '- Required' : '- Optional'}`
        )
      ),
      blockBuilders.heading2('Responses'),
      blockBuilders.table(
        ['Status', 'Description'],
        endpoint.responses.map((r) => [r.status.toString(), r.description])
      ),
      blockBuilders.divider(),
    ];

    await createPage(parentPageId, title, content);
  }

  console.log(`Synced ${endpoints.length} API endpoints to Notion`);
}
```

**Generate Release Notes:**

```typescript
// scripts/create-release-notes.ts
export async function createReleaseNotes(
  parentPageId: string,
  version: string,
  changes: {
    features: string[];
    fixes: string[];
    breaking: string[];
  }
) {
  const content = [
    blockBuilders.heading1(`Release ${version}`),
    blockBuilders.callout(`Released on ${new Date().toLocaleDateString()}`, '🚀'),
    blockBuilders.heading2('New Features'),
    ...blockBuilders.bulletedList(changes.features),
    blockBuilders.heading2('Bug Fixes'),
    ...blockBuilders.bulletedList(changes.fixes),
  ];

  if (changes.breaking.length > 0) {
    content.push(
      blockBuilders.callout('Breaking Changes', '⚠️'),
      ...blockBuilders.bulletedList(changes.breaking)
    );
  }

  await createPage(parentPageId, `Release ${version}`, content);
}
```

**Best Practices:**
- Use templates for consistent documentation
- Automate updates from code comments
- Version control documentation
- Link related pages with relations
- Use callouts for important information
- Generate table of contents for long pages

**Gotchas:**
- Block nesting is limited to 2 levels
- Large pages may hit size limits
- Images must be hosted externally
- Some formatting is lost when copying content

## 💡 Real-World Examples

### Example 1: Project Task Tracker

```typescript
// lib/project-tracker.ts
export async function createProjectTask(
  databaseId: string,
  task: {
    title: string;
    description: string;
    assignee: string;
    priority: 'High' | 'Medium' | 'Low';
    dueDate: Date;
  }
) {
  return createDatabaseItem(databaseId, {
    Name: propertyBuilders.title(task.title),
    Description: propertyBuilders.richText(task.description),
    Assignee: propertyBuilders.richText(task.assignee),
    Priority: propertyBuilders.select(task.priority),
    'Due Date': propertyBuilders.date(task.dueDate),
    Status: propertyBuilders.select('To Do'),
  });
}

export async function getOverdueTasks(databaseId: string) {
  return queryDatabase(databaseId, {
    and: [
      {
        property: 'Status',
        select: {
          does_not_equal: 'Done',
        },
      },
      {
        property: 'Due Date',
        date: {
          before: new Date().toISOString(),
        },
      },
    ],
  });
}
```

### Example 2: Meeting Notes Automation

```typescript
// lib/meeting-notes.ts
export async function createMeetingNotes(
  parentPageId: string,
  meeting: {
    title: string;
    date: Date;
    attendees: string[];
    agenda: string[];
    notes: string[];
    actionItems: { task: string; owner: string }[];
  }
) {
  const content = [
    blockBuilders.heading1(meeting.title),
    blockBuilders.paragraph(`Date: ${meeting.date.toLocaleDateString()}`),
    blockBuilders.heading2('Attendees'),
    ...blockBuilders.bulletedList(meeting.attendees),
    blockBuilders.heading2('Agenda'),
    ...blockBuilders.numberedList(meeting.agenda),
    blockBuilders.heading2('Notes'),
    ...meeting.notes.map((note) => blockBuilders.paragraph(note)),
    blockBuilders.heading2('Action Items'),
    blockBuilders.table(
      ['Task', 'Owner'],
      meeting.actionItems.map((item) => [item.task, item.owner])
    ),
  ];

  return createPage(parentPageId, meeting.title, content);
}
```

### Example 3: Customer Feedback Database

```typescript
// lib/customer-feedback.ts
export async function recordFeedback(
  databaseId: string,
  feedback: {
    customerName: string;
    email: string;
    rating: number;
    category: string;
    comment: string;
  }
) {
  return createDatabaseItem(databaseId, {
    Customer: propertyBuilders.title(feedback.customerName),
    Email: propertyBuilders.email(feedback.email),
    Rating: propertyBuilders.number(feedback.rating),
    Category: propertyBuilders.select(feedback.category),
    Comment: propertyBuilders.richText(feedback.comment),
    'Submitted At': propertyBuilders.date(new Date()),
  });
}

export async function getHighPriorityFeedback(databaseId: string) {
  return queryDatabase(databaseId, {
    and: [
      {
        property: 'Rating',
        number: {
          less_than_or_equal_to: 2,
        },
      },
      {
        property: 'Status',
        select: {
          equals: 'New',
        },
      },
    ],
  });
}
```

## 🔗 Related Skills

- **content-writer** - Generate content for Notion pages
- **github-manager** - Sync GitHub issues to Notion
- **supabase-expert** - Store Notion data in database
- **analytics-tracking** - Track Notion page views

## 📖 Further Reading

- [Notion API Documentation](https://developers.notion.com/)
- [Notion SDK for JavaScript](https://github.com/makenotion/notion-sdk-js)
- [Notion API Limits](https://developers.notion.com/reference/request-limits)
- [Notion Block Types](https://developers.notion.com/reference/block)

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
*Complete Notion automation with real-world examples*
