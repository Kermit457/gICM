# Documentation Expert

> **ID:** `docs-expert`
> **Tier:** 2
> **Token Cost:** 5000
> **MCP Connections:** context7

## 🎯 What This Skill Does

This skill transforms you into a documentation research expert with real-time access to library documentation, API references, and code examples through Context7 MCP integration. It enables intelligent documentation lookup, version-aware guidance, and automated example extraction.

**Core Functions:**
- Live documentation fetching from Context7
- Multi-library documentation synthesis
- Version-specific API guidance
- Example code extraction and adaptation
- Documentation quality assessment
- Quick reference generation

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** docs, documentation, how to use, reference, api docs, guide, tutorial, context7
- **File Types:** README.md, API.md, CONTRIBUTING.md, .mdx
- **Directories:** /docs, /documentation, /guides, /api-reference

**Manual Activation:**
```bash
opus67 load docs-expert
```

## 🚀 Core Capabilities

### 1. Context7 Live Documentation Lookup

Context7 MCP provides real-time access to documentation for popular libraries and frameworks. This capability enables instant, accurate information retrieval without relying on outdated training data.

**Implementation Pattern:**

```typescript
// MCP Tool: context7_search_docs
interface DocsLookupRequest {
  library: string;
  query: string;
  version?: string;
  includeExamples?: boolean;
}

async function lookupDocumentation(request: DocsLookupRequest) {
  // Step 1: Search Context7 for relevant documentation
  const results = await mcp.call('context7_search_docs', {
    library: request.library,
    query: request.query,
    version: request.version || 'latest',
    limit: 5
  });

  // Step 2: Extract relevant sections
  const relevantSections = results.documents.map(doc => ({
    title: doc.title,
    content: doc.content,
    url: doc.source_url,
    version: doc.version,
    relevance: doc.score
  }));

  // Step 3: Synthesize information
  return {
    summary: synthesizeDocumentation(relevantSections),
    examples: extractCodeExamples(relevantSections),
    references: relevantSections.map(s => s.url),
    version: request.version || 'latest'
  };
}
```

**Best Practices:**
- Always specify library version if known to ensure accuracy
- Request examples to provide actionable guidance
- Verify documentation is for the correct major version
- Cross-reference multiple documentation sources for completeness
- Cache frequently accessed documentation for faster lookups

**Common Patterns:**

```typescript
// Pattern 1: Quick API Reference Lookup
const apiInfo = await lookupDocumentation({
  library: 'next',
  query: 'App Router data fetching',
  version: '14.0',
  includeExamples: true
});

console.log(apiInfo.summary);
// Returns: App Router uses server components by default.
// Use async/await in components to fetch data...

// Pattern 2: Multi-Library Comparison
async function compareApproaches(libraries: string[], feature: string) {
  const comparisons = await Promise.all(
    libraries.map(lib =>
      lookupDocumentation({
        library: lib,
        query: feature,
        includeExamples: true
      })
    )
  );

  return {
    libraries,
    feature,
    approaches: comparisons.map((c, i) => ({
      library: libraries[i],
      approach: c.summary,
      example: c.examples[0]
    }))
  };
}

// Pattern 3: Version Migration Guidance
async function getMigrationGuide(library: string, fromVersion: string, toVersion: string) {
  const [oldDocs, newDocs] = await Promise.all([
    lookupDocumentation({ library, query: 'breaking changes', version: fromVersion }),
    lookupDocumentation({ library, query: 'migration guide', version: toVersion })
  ]);

  return {
    breaking_changes: newDocs.summary,
    old_approach: oldDocs.examples[0],
    new_approach: newDocs.examples[0],
    references: [...oldDocs.references, ...newDocs.references]
  };
}
```

**Gotchas:**
- Context7 may not have docs for very new or niche libraries
- Version numbers must match exactly (14.0 vs 14.0.0)
- Some libraries have multiple documentation sources (official vs community)
- Documentation search is semantic, so use precise technical terms
- Rate limiting may apply to Context7 MCP calls

### 2. API Reference Search and Synthesis

Automated API documentation search with intelligent filtering and synthesis across multiple documentation sources.

**Implementation Pattern:**

```typescript
interface APISearchOptions {
  library: string;
  apiType: 'function' | 'class' | 'hook' | 'component' | 'interface';
  name: string;
  includeSignature?: boolean;
  includeExamples?: boolean;
  includeTypeInfo?: boolean;
}

async function searchAPIReference(options: APISearchOptions) {
  // Step 1: Construct precise search query
  const query = buildAPIQuery(options);

  // Step 2: Search Context7
  const docs = await mcp.call('context7_search_docs', {
    library: options.library,
    query,
    type: 'api-reference'
  });

  // Step 3: Extract structured API information
  return {
    name: options.name,
    type: options.apiType,
    signature: options.includeSignature ? extractSignature(docs) : null,
    parameters: extractParameters(docs),
    returnType: extractReturnType(docs),
    description: extractDescription(docs),
    examples: options.includeExamples ? extractCodeExamples(docs) : [],
    typeDefinitions: options.includeTypeInfo ? extractTypes(docs) : null,
    relatedAPIs: extractRelatedAPIs(docs),
    sourceUrl: docs.documents[0]?.source_url
  };
}

function buildAPIQuery(options: APISearchOptions): string {
  const typeKeywords = {
    function: 'function API',
    class: 'class reference',
    hook: 'hook usage',
    component: 'component props',
    interface: 'type definition'
  };

  return `${options.name} ${typeKeywords[options.apiType]}`;
}
```

**Best Practices:**
- Specify API type (function, class, hook) for more precise results
- Include type information for TypeScript projects
- Request examples for complex APIs
- Verify parameter types and defaults
- Check for deprecated APIs in documentation

**Common Patterns:**

```typescript
// Pattern 1: React Hook Documentation
const hookDocs = await searchAPIReference({
  library: 'react',
  apiType: 'hook',
  name: 'useEffect',
  includeSignature: true,
  includeExamples: true,
  includeTypeInfo: true
});

// Returns:
// {
//   name: 'useEffect',
//   signature: 'useEffect(effect: EffectCallback, deps?: DependencyList): void',
//   parameters: [...],
//   examples: ['useEffect(() => { ... }, [])']
// }

// Pattern 2: API Comparison Across Versions
async function compareAPIVersions(
  library: string,
  apiName: string,
  versions: string[]
) {
  const apiDocs = await Promise.all(
    versions.map(version =>
      lookupDocumentation({
        library,
        query: `${apiName} API`,
        version
      })
    )
  );

  return {
    api: apiName,
    versions: versions.map((v, i) => ({
      version: v,
      signature: apiDocs[i].examples[0],
      changes: detectAPIChanges(apiDocs[i], apiDocs[0])
    }))
  };
}

// Pattern 3: Type-Safe API Discovery
async function discoverAPIs(
  library: string,
  category: string
): Promise<APIReference[]> {
  const categoryDocs = await lookupDocumentation({
    library,
    query: `${category} APIs list`,
    includeExamples: false
  });

  const apiNames = extractAPINames(categoryDocs.summary);

  return Promise.all(
    apiNames.map(name =>
      searchAPIReference({
        library,
        apiType: inferAPIType(name),
        name,
        includeSignature: true,
        includeTypeInfo: true
      })
    )
  );
}
```

**Gotchas:**
- API names may differ across documentation versions
- Overloaded functions require multiple searches
- Some APIs are internal and not documented
- Experimental APIs may have limited documentation
- Type definitions may be in separate @types packages

### 3. Example Code Extraction and Adaptation

Intelligent extraction of code examples from documentation with context-aware adaptation to specific use cases.

**Implementation Pattern:**

```typescript
interface ExampleExtractionOptions {
  library: string;
  feature: string;
  language?: 'typescript' | 'javascript';
  framework?: string;
  adaptTo?: {
    projectContext: string;
    specificUseCase: string;
  };
}

async function extractAndAdaptExamples(options: ExampleExtractionOptions) {
  // Step 1: Get documentation with examples
  const docs = await lookupDocumentation({
    library: options.library,
    query: options.feature,
    includeExamples: true
  });

  // Step 2: Parse and extract code blocks
  const rawExamples = extractCodeExamples(docs);

  // Step 3: Filter by language
  const filteredExamples = rawExamples.filter(ex =>
    ex.language === (options.language || 'typescript')
  );

  // Step 4: Adapt to context if requested
  if (options.adaptTo) {
    return adaptExamplesToContext(filteredExamples, options.adaptTo);
  }

  return {
    library: options.library,
    feature: options.feature,
    examples: filteredExamples.map(ex => ({
      code: ex.code,
      language: ex.language,
      description: ex.description,
      sourceUrl: ex.url,
      dependencies: extractDependencies(ex.code)
    }))
  };
}

function adaptExamplesToContext(
  examples: CodeExample[],
  context: { projectContext: string; specificUseCase: string }
): AdaptedExample[] {
  return examples.map(example => ({
    original: example.code,
    adapted: transformCodeForContext(example.code, context),
    explanation: explainAdaptations(example.code, context),
    requiredChanges: detectRequiredChanges(example.code, context)
  }));
}
```

**Best Practices:**
- Prefer TypeScript examples when available
- Verify example code compiles before using
- Adapt import paths to project structure
- Update examples to match installed versions
- Add error handling not present in simple examples
- Consider framework-specific patterns (Next.js vs Vite)

**Common Patterns:**

```typescript
// Pattern 1: Framework-Specific Example Adaptation
const nextjsExample = await extractAndAdaptExamples({
  library: 'react-query',
  feature: 'useQuery hook',
  language: 'typescript',
  framework: 'nextjs',
  adaptTo: {
    projectContext: 'Next.js 14 App Router',
    specificUseCase: 'Server-side data fetching with streaming'
  }
});

// Returns adapted code:
// 'use client';
// import { useQuery } from '@tanstack/react-query';
// export default function Page() { ... }

// Pattern 2: Multi-Example Synthesis
async function synthesizeCompleteExample(
  library: string,
  features: string[]
): Promise<string> {
  const examples = await Promise.all(
    features.map(feature =>
      extractAndAdaptExamples({ library, feature })
    )
  );

  // Combine examples into a single, working code sample
  return combineExamples(examples, {
    removeRedundantImports: true,
    mergeTypes: true,
    addComments: true
  });
}

// Pattern 3: Dependency Detection
async function getExampleWithDependencies(
  library: string,
  feature: string
) {
  const examples = await extractAndAdaptExamples({
    library,
    feature,
    language: 'typescript'
  });

  const allDependencies = new Set<string>();
  examples.examples.forEach(ex => {
    ex.dependencies.forEach(dep => allDependencies.add(dep));
  });

  return {
    examples: examples.examples,
    installCommand: generateInstallCommand([...allDependencies]),
    peerDependencies: await checkPeerDependencies([...allDependencies])
  };
}

function generateInstallCommand(deps: string[]): string {
  return `npm install ${deps.join(' ')}`;
}
```

**Gotchas:**
- Examples may use different versions than your project
- Some examples omit imports for brevity
- Examples may not include error handling
- TypeScript examples may need additional type definitions
- Framework-specific examples may not work in other contexts
- Examples may use experimental features

### 4. Documentation Quality Assessment

Automated analysis of documentation completeness and quality to guide users toward the best resources.

**Implementation Pattern:**

```typescript
interface DocQualityMetrics {
  completeness: number; // 0-100
  recency: number; // days since last update
  exampleCount: number;
  hasTypeInfo: boolean;
  hasMigrationGuides: boolean;
  communityRating?: number;
}

async function assessDocumentationQuality(
  library: string
): Promise<DocQualityMetrics> {
  const docs = await lookupDocumentation({
    library,
    query: 'overview getting started',
    includeExamples: true
  });

  return {
    completeness: calculateCompleteness(docs),
    recency: calculateRecency(docs),
    exampleCount: docs.examples.length,
    hasTypeInfo: checkForTypeDefinitions(docs),
    hasMigrationGuides: checkForMigrationGuides(docs),
    communityRating: await getCommunityRating(library)
  };
}

function calculateCompleteness(docs: any): number {
  const requiredSections = [
    'installation',
    'getting-started',
    'api-reference',
    'examples',
    'troubleshooting'
  ];

  const presentSections = requiredSections.filter(section =>
    docs.summary.toLowerCase().includes(section.replace('-', ' '))
  );

  return (presentSections.length / requiredSections.length) * 100;
}
```

**Best Practices:**
- Prioritize official documentation over community resources
- Check documentation date to ensure relevance
- Verify examples are tested and maintained
- Look for TypeScript support in documentation
- Consider community feedback on documentation quality

**Common Patterns:**

```typescript
// Pattern 1: Documentation Source Comparison
async function compareDocs Sources(library: string) {
  const sources = ['official', 'mdn', 'devdocs', 'community'];

  const qualityScores = await Promise.all(
    sources.map(async source => ({
      source,
      metrics: await assessDocumentationQuality(`${library}@${source}`)
    }))
  );

  return qualityScores.sort((a, b) =>
    b.metrics.completeness - a.metrics.completeness
  );
}

// Pattern 2: Recommended Learning Path
async function generateLearningPath(library: string) {
  const quality = await assessDocumentationQuality(library);

  const path = [];

  // Start with high-quality overview
  if (quality.completeness > 70) {
    path.push({
      step: 1,
      title: 'Official Documentation',
      url: await lookupDocumentation({ library, query: 'getting started' })
    });
  }

  // Add examples if available
  if (quality.exampleCount > 3) {
    path.push({
      step: 2,
      title: 'Example Projects',
      examples: await extractAndAdaptExamples({ library, feature: 'common use cases' })
    });
  }

  // Add migration guide if available
  if (quality.hasMigrationGuides) {
    path.push({
      step: 3,
      title: 'Migration & Best Practices',
      url: await lookupDocumentation({ library, query: 'migration guide' })
    });
  }

  return path;
}
```

**Gotchas:**
- Documentation quality varies widely across libraries
- Official docs may be less comprehensive than community resources
- Recent library versions may have incomplete documentation
- Example quality doesn't always correlate with doc completeness
- Community ratings may be biased or outdated

## 💡 Real-World Examples

### Example 1: Next.js App Router Migration Research

```typescript
// Scenario: Migrating from Pages Router to App Router
// Goal: Get comprehensive, version-specific documentation

async function researchAppRouterMigration() {
  // Step 1: Get migration guide
  const migrationGuide = await lookupDocumentation({
    library: 'next',
    query: 'App Router migration from Pages Router',
    version: '14.0',
    includeExamples: true
  });

  // Step 2: Get API differences
  const apiChanges = await compareAPIVersions(
    'next',
    'data fetching',
    ['13.5', '14.0']
  );

  // Step 3: Extract practical examples
  const examples = await extractAndAdaptExamples({
    library: 'next',
    feature: 'App Router layouts and data fetching',
    language: 'typescript',
    framework: 'nextjs',
    adaptTo: {
      projectContext: 'Existing Next.js 13 app with TypeScript',
      specificUseCase: 'E-commerce site with auth'
    }
  });

  // Step 4: Generate migration checklist
  return {
    guide: migrationGuide.summary,
    breakingChanges: apiChanges.versions[1].changes,
    examples: examples.examples,
    checklist: [
      'Update next.config.js for App Router',
      'Move pages/ to app/ directory',
      'Convert getServerSideProps to Server Components',
      'Update data fetching to use async/await',
      'Migrate layouts to layout.tsx pattern',
      'Update navigation to use next/navigation',
      'Test streaming and loading states'
    ],
    estimatedEffort: '3-5 days for medium-sized app',
    resources: [
      ...migrationGuide.references,
      ...examples.examples.map(ex => ex.sourceUrl)
    ]
  };
}

// Output:
// {
//   guide: "App Router introduces a new paradigm...",
//   breakingChanges: ["getServerSideProps removed", ...],
//   examples: [{ code: "export default async function Page() {...}", ... }],
//   checklist: [...],
//   estimatedEffort: "3-5 days...",
//   resources: ["https://nextjs.org/docs/app/..."]
// }
```

### Example 2: Library Comparison for Feature Implementation

```typescript
// Scenario: Choose between React Query, SWR, and Apollo for data fetching
// Goal: Compare documentation quality and implementation patterns

async function compareDataFetchingLibraries() {
  const libraries = ['react-query', 'swr', 'apollo-client'];
  const feature = 'data fetching with caching and optimistic updates';

  // Step 1: Assess documentation quality
  const qualityAssessments = await Promise.all(
    libraries.map(async lib => ({
      library: lib,
      quality: await assessDocumentationQuality(lib),
      apiDocs: await searchAPIReference({
        library: lib,
        apiType: 'hook',
        name: lib === 'react-query' ? 'useQuery' : lib === 'swr' ? 'useSWR' : 'useQuery',
        includeExamples: true,
        includeTypeInfo: true
      })
    }))
  );

  // Step 2: Extract and adapt examples for comparison
  const examples = await Promise.all(
    libraries.map(lib =>
      extractAndAdaptExamples({
        library: lib,
        feature,
        language: 'typescript',
        adaptTo: {
          projectContext: 'React 18 with TypeScript',
          specificUseCase: 'User profile data with optimistic updates'
        }
      })
    )
  );

  // Step 3: Generate comparison report
  return {
    comparison: libraries.map((lib, i) => ({
      library: lib,
      documentationScore: qualityAssessments[i].quality.completeness,
      typeScriptSupport: qualityAssessments[i].quality.hasTypeInfo,
      exampleQuality: examples[i].examples.length,
      implementationComplexity: analyzeComplexity(examples[i].examples[0].code),
      pros: extractPros(qualityAssessments[i], examples[i]),
      cons: extractCons(qualityAssessments[i], examples[i])
    })),
    recommendation: determineRecommendation(qualityAssessments, examples),
    nextSteps: [
      'Review full documentation for recommended library',
      'Try example implementation in sandbox',
      'Check bundle size and performance',
      'Verify community support and maintenance'
    ]
  };
}

function analyzeComplexity(code: string): 'low' | 'medium' | 'high' {
  const lines = code.split('\n').length;
  const hasComplexPatterns = /async|await|Promise|callback/.test(code);

  if (lines < 20 && !hasComplexPatterns) return 'low';
  if (lines < 50 && hasComplexPatterns) return 'medium';
  return 'high';
}

// Output:
// {
//   comparison: [
//     {
//       library: 'react-query',
//       documentationScore: 95,
//       typeScriptSupport: true,
//       implementationComplexity: 'medium',
//       pros: ['Excellent docs', 'Built-in devtools', 'TypeScript first'],
//       cons: ['Larger bundle size', 'Steeper learning curve']
//     },
//     // ... swr and apollo-client
//   ],
//   recommendation: 'react-query',
//   nextSteps: [...]
// }
```

### Example 3: Automated Documentation Generation

```typescript
// Scenario: Generate comprehensive README for new package
// Goal: Research best practices and generate template

async function generatePackageDocumentation(packageName: string, packageInfo: any) {
  // Step 1: Research documentation best practices
  const bestPractices = await lookupDocumentation({
    library: 'documentation',
    query: 'README best practices npm package',
    includeExamples: true
  });

  // Step 2: Get examples from similar packages
  const similarPackages = await findSimilarPackages(packageInfo.keywords);
  const exampleDocs = await Promise.all(
    similarPackages.slice(0, 3).map(pkg =>
      lookupDocumentation({
        library: pkg,
        query: 'README usage examples',
        includeExamples: true
      })
    )
  );

  // Step 3: Generate sections
  const readme = generateReadme({
    name: packageName,
    description: packageInfo.description,
    installation: generateInstallationSection(packageName),
    quickStart: await generateQuickStart(packageName, exampleDocs),
    api: await generateAPISection(packageName, packageInfo.exports),
    examples: synthesizeExamples(exampleDocs),
    contributing: await lookupDocumentation({
      library: 'github',
      query: 'CONTRIBUTING.md template'
    }),
    license: packageInfo.license
  });

  return readme;
}

function generateReadme(sections: any): string {
  return `
# ${sections.name}

${sections.description}

## Installation

${sections.installation}

## Quick Start

${sections.quickStart}

## API Reference

${sections.api}

## Examples

${sections.examples}

## Contributing

${sections.contributing.summary}

## License

${sections.license}
  `.trim();
}

// Output: Complete README.md content ready to use
```

## 🔗 Related Skills

- **web-search-expert** - For finding tutorials and articles beyond official docs
- **code-analyzer** - For understanding implementation details in documentation examples
- **typescript-expert** - For TypeScript-specific documentation needs
- **react-expert** - For React library documentation deep dives
- **nextjs-expert** - For Next.js-specific documentation research

## 📖 Further Reading

- [Context7 MCP Documentation](https://github.com/modelcontextprotocol/servers/tree/main/src/context7)
- [Documentation Best Practices](https://documentation.divio.com/)
- [Technical Writing Guidelines](https://developers.google.com/tech-writing)
- [API Documentation Standards](https://swagger.io/docs/specification/about/)
- [README Best Practices](https://github.com/jehna/readme-best-practices)

## 🎓 Advanced Techniques

### Automated Documentation Validation

```typescript
async function validateDocumentation(library: string, version: string) {
  const docs = await lookupDocumentation({ library, query: 'API reference', version });

  // Extract all API names from documentation
  const documentedAPIs = extractAPINames(docs.summary);

  // Compare with actual exports
  const actualAPIs = await getLibraryExports(library, version);

  const missing = actualAPIs.filter(api => !documentedAPIs.includes(api));
  const extra = documentedAPIs.filter(api => !actualAPIs.includes(api));

  return {
    coverage: (documentedAPIs.length / actualAPIs.length) * 100,
    missingDocs: missing,
    outdatedDocs: extra,
    recommendation: missing.length > 0
      ? 'Contribute missing documentation'
      : 'Documentation is complete'
  };
}
```

### Cross-Library Documentation Search

```typescript
async function searchAcrossLibraries(
  concept: string,
  libraries: string[]
): Promise<Map<string, any>> {
  const results = new Map();

  for (const library of libraries) {
    const docs = await lookupDocumentation({
      library,
      query: concept,
      includeExamples: true
    });

    results.set(library, {
      hasFeature: docs.summary.length > 100,
      implementation: docs.examples[0],
      quality: await assessDocumentationQuality(library)
    });
  }

  return results;
}
```

---

*This skill is part of OPUS 67 v5.1 - "The Precision Update"*
*Documentation research transforms AI from guessing to knowing.*
