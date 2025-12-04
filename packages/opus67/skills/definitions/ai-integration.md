# AI Integration Expert (Vercel AI SDK)

> **ID:** `ai-integration`
> **Tier:** 2
> **Token Cost:** 8500
> **MCP Connections:** vercel

## 🎯 What This Skill Does

You are an expert in Vercel AI SDK, the industry-standard toolkit for building AI-powered applications. You understand streaming, tool calling, multi-modal inputs, structured outputs, RAG patterns, and production-grade AI integrations with React, Next.js, and Node.js.

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** vercel ai, ai sdk, streaming, useChat, useCompletion, chatbot, ai integration
- **File Types:** N/A
- **Directories:** `ai/`, `chat/`, `assistant/`

## 🚀 Core Capabilities

### 1. Vercel AI SDK Overview

**What is Vercel AI SDK?**

```typescript
/**
 * Vercel AI SDK is a TypeScript toolkit for building AI apps with:
 *
 * 1. AI SDK Core - Server-side AI functions
 *    - generateText() - Simple text generation
 *    - streamText() - Streaming responses
 *    - generateObject() - Structured outputs
 *    - streamObject() - Streaming structured data
 *
 * 2. AI SDK UI - React hooks for frontend
 *    - useChat() - Complete chat interface
 *    - useCompletion() - Text completion
 *    - useObject() - Structured data streaming
 *
 * 3. AI SDK RSC - React Server Components
 *    - createStreamableUI() - Streaming UI components
 *    - createStreamableValue() - Streaming values
 *
 * 4. Provider Support
 *    - OpenAI, Anthropic, Google, Mistral, Cohere, etc.
 *    - Unified interface across providers
 */

// Key benefits:
// - Provider-agnostic API
// - Built-in streaming
// - Type-safe structured outputs
// - React integration
// - Edge runtime compatible
```

### 2. Installation & Setup

**Install Packages:**

```bash
# Core package
npm install ai

# Provider packages (choose what you need)
npm install @ai-sdk/openai
npm install @ai-sdk/anthropic
npm install @ai-sdk/google
npm install @ai-sdk/mistral
npm install @ai-sdk/cohere

# For React hooks
npm install ai react

# For Svelte
npm install ai @ai-sdk/svelte

# For Vue
npm install ai @ai-sdk/vue
```

**Basic Configuration:**

```typescript
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'

// Configure providers
const gpt4 = openai('gpt-4-turbo')
const claude = anthropic('claude-3-opus-20240229')
const gemini = google('gemini-1.5-pro')

// With custom settings
const customModel = openai('gpt-4-turbo', {
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://custom-endpoint.com',
  headers: {
    'Custom-Header': 'value',
  },
})
```

### 3. Text Generation (Core)

**Simple Text Generation:**

```typescript
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

// Basic generation
async function simpleGeneration() {
  const { text } = await generateText({
    model: openai('gpt-4-turbo'),
    prompt: 'Explain quantum computing in simple terms.',
  })

  console.log(text)
}

// With system prompt
async function withSystem() {
  const { text } = await generateText({
    model: openai('gpt-4-turbo'),
    system: 'You are a helpful assistant that explains complex topics simply.',
    prompt: 'What is machine learning?',
  })

  return text
}

// With messages
async function withMessages() {
  const { text } = await generateText({
    model: openai('gpt-4-turbo'),
    messages: [
      { role: 'system', content: 'You are a coding assistant.' },
      { role: 'user', content: 'How do I reverse a string in Python?' },
    ],
  })

  return text
}

// With configuration
async function withConfig() {
  const { text, usage, finishReason } = await generateText({
    model: openai('gpt-4-turbo'),
    prompt: 'Write a haiku about programming.',
    temperature: 0.8,
    maxTokens: 100,
    topP: 0.9,
    frequencyPenalty: 0.5,
    presencePenalty: 0.5,
  })

  console.log('Text:', text)
  console.log('Tokens used:', usage.totalTokens)
  console.log('Finish reason:', finishReason)
}
```

**Streaming Text Generation:**

```typescript
import { streamText } from 'ai'

// Stream to console
async function streamToConsole() {
  const result = await streamText({
    model: openai('gpt-4-turbo'),
    prompt: 'Write a short story about a robot.',
  })

  for await (const chunk of result.textStream) {
    process.stdout.write(chunk)
  }
}

// Stream with full response
async function streamWithResponse() {
  const result = await streamText({
    model: openai('gpt-4-turbo'),
    prompt: 'Explain async/await in JavaScript.',
  })

  let fullText = ''

  for await (const chunk of result.textStream) {
    fullText += chunk
    process.stdout.write(chunk)
  }

  // Access metadata after streaming
  const { usage, finishReason } = await result.response
  console.log('\n\nTokens:', usage.totalTokens)
  console.log('Finish reason:', finishReason)

  return fullText
}

// Stream to response (API route)
export async function POST(req: Request) {
  const { prompt } = await req.json()

  const result = await streamText({
    model: openai('gpt-4-turbo'),
    prompt,
  })

  // Return streaming response
  return result.toAIStreamResponse()
}
```

### 4. Structured Outputs

**Generate Objects:**

```typescript
import { generateObject } from 'ai'
import { z } from 'zod'

// Define schema with Zod
const recipeSchema = z.object({
  name: z.string(),
  ingredients: z.array(z.string()),
  instructions: z.array(z.string()),
  prepTime: z.number().describe('Preparation time in minutes'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
})

// Generate structured data
async function generateRecipe(dishName: string) {
  const { object } = await generateObject({
    model: openai('gpt-4-turbo'),
    schema: recipeSchema,
    prompt: `Generate a recipe for ${dishName}.`,
  })

  console.log(object.name)
  console.log(object.ingredients)
  console.log(object.instructions)

  return object
}

// Complex schema
const analysisSchema = z.object({
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  confidence: z.number().min(0).max(1),
  entities: z.array(
    z.object({
      name: z.string(),
      type: z.enum(['person', 'organization', 'location']),
      relevance: z.number(),
    })
  ),
  summary: z.string(),
  keywords: z.array(z.string()),
  topics: z.array(z.string()),
})

async function analyzeText(text: string) {
  const { object } = await generateObject({
    model: openai('gpt-4-turbo'),
    schema: analysisSchema,
    prompt: `Analyze this text: ${text}`,
  })

  return object
}

// With mode selection
async function generateWithMode() {
  const { object } = await generateObject({
    model: openai('gpt-4-turbo'),
    schema: recipeSchema,
    mode: 'json', // or 'tool' (default)
    prompt: 'Generate a recipe for pasta carbonara',
  })

  return object
}
```

**Stream Objects:**

```typescript
import { streamObject } from 'ai'

// Stream structured data
async function streamRecipe(dishName: string) {
  const result = await streamObject({
    model: openai('gpt-4-turbo'),
    schema: recipeSchema,
    prompt: `Generate a recipe for ${dishName}.`,
  })

  // Stream partial objects
  for await (const partialObject of result.partialObjectStream) {
    console.log('Partial:', partialObject)
    // Access fields as they arrive
    if (partialObject.name) {
      console.log('Recipe name:', partialObject.name)
    }
  }

  // Get final object
  const finalObject = await result.object
  return finalObject
}

// Stream to API response
export async function POST(req: Request) {
  const { dishName } = await req.json()

  const result = await streamObject({
    model: openai('gpt-4-turbo'),
    schema: recipeSchema,
    prompt: `Generate a recipe for ${dishName}.`,
  })

  return result.toTextStreamResponse()
}
```

### 5. Tool Calling (Function Calling)

**Define and Use Tools:**

```typescript
import { generateText, tool } from 'ai'
import { z } from 'zod'

// Define tools
const weatherTool = tool({
  description: 'Get weather for a location',
  parameters: z.object({
    location: z.string().describe('City name'),
    unit: z.enum(['celsius', 'fahrenheit']).optional(),
  }),
  execute: async ({ location, unit = 'celsius' }) => {
    // Call weather API
    const weather = await fetch(`https://api.weather.com/${location}`)
    const data = await weather.json()

    return {
      location,
      temperature: data.temp,
      unit,
      conditions: data.conditions,
    }
  },
})

const searchTool = tool({
  description: 'Search the web',
  parameters: z.object({
    query: z.string(),
  }),
  execute: async ({ query }) => {
    // Call search API
    const results = await fetch(`https://api.search.com?q=${query}`)
    return await results.json()
  },
})

// Use tools
async function chatWithTools(userMessage: string) {
  const { text, toolCalls, toolResults } = await generateText({
    model: openai('gpt-4-turbo'),
    prompt: userMessage,
    tools: {
      weather: weatherTool,
      search: searchTool,
    },
    maxToolRoundtrips: 5, // Allow multiple tool calls
  })

  console.log('Response:', text)
  console.log('Tools used:', toolCalls)
  console.log('Results:', toolResults)

  return text
}

// Multi-step tool usage
async function multiStepTools() {
  const result = await generateText({
    model: openai('gpt-4-turbo'),
    prompt: "What's the weather in San Francisco and search for SF attractions",
    tools: {
      weather: weatherTool,
      search: searchTool,
    },
    maxToolRoundtrips: 5,
  })

  // AI will:
  // 1. Call weather tool for SF
  // 2. Call search tool for attractions
  // 3. Synthesize final answer

  return result.text
}
```

**Streaming with Tools:**

```typescript
import { streamText } from 'ai'

async function streamWithTools(prompt: string) {
  const result = await streamText({
    model: openai('gpt-4-turbo'),
    prompt,
    tools: {
      weather: weatherTool,
      calculate: tool({
        description: 'Perform calculations',
        parameters: z.object({
          expression: z.string(),
        }),
        execute: async ({ expression }) => {
          return { result: eval(expression) }
        },
      }),
    },
  })

  // Stream text
  for await (const chunk of result.textStream) {
    process.stdout.write(chunk)
  }

  // Access tool calls after streaming
  const { toolCalls, toolResults } = await result.response
  console.log('\nTools used:', toolCalls)
}
```

### 6. React Integration (useChat)

**Complete Chat Interface:**

```typescript
'use client'

import { useChat } from 'ai/react'

export default function ChatComponent() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: '1',
        role: 'system',
        content: 'You are a helpful assistant.',
      },
    ],
  })

  return (
    <div className="flex flex-col h-screen">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
          >
            <div
              className={`inline-block p-3 rounded-lg ${
                message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="text-gray-500">
            <span className="animate-pulse">AI is thinking...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
```

**API Route for Chat:**

```typescript
// app/api/chat/route.ts
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = await streamText({
    model: openai('gpt-4-turbo'),
    messages,
    system: 'You are a helpful assistant.',
  })

  return result.toAIStreamResponse()
}
```

**Advanced useChat Features:**

```typescript
'use client'

import { useChat } from 'ai/react'

export default function AdvancedChat() {
  const {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    error,
    reload,
    stop,
    append,
    setMessages,
  } = useChat({
    api: '/api/chat',
    onResponse: (response) => {
      console.log('Response received:', response)
    },
    onFinish: (message) => {
      console.log('Message complete:', message)
    },
    onError: (error) => {
      console.error('Chat error:', error)
    },
  })

  // Send custom message
  const sendCustomMessage = () => {
    append({
      role: 'user',
      content: 'Custom message',
    })
  }

  // Regenerate last response
  const regenerate = () => {
    reload()
  }

  // Stop generation
  const stopGeneration = () => {
    stop()
  }

  // Clear chat
  const clearChat = () => {
    setMessages([])
  }

  return (
    <div>
      {/* Chat UI */}
      {error && <div className="text-red-500">Error: {error.message}</div>}

      <button onClick={regenerate}>Regenerate</button>
      <button onClick={stopGeneration}>Stop</button>
      <button onClick={clearChat}>Clear</button>
    </div>
  )
}
```

### 7. React Integration (useCompletion)

**Text Completion:**

```typescript
'use client'

import { useCompletion } from 'ai/react'

export default function CompletionComponent() {
  const { completion, input, handleInputChange, handleSubmit, isLoading } =
    useCompletion({
      api: '/api/completion',
    })

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <textarea
          value={input}
          onChange={handleInputChange}
          placeholder="Start typing..."
          rows={4}
          className="w-full p-2 border rounded"
        />
        <button type="submit" disabled={isLoading}>
          Complete
        </button>
      </form>

      {completion && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3>Completion:</h3>
          <p>{completion}</p>
        </div>
      )}
    </div>
  )
}
```

**API Route for Completion:**

```typescript
// app/api/completion/route.ts
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

export async function POST(req: Request) {
  const { prompt } = await req.json()

  const result = await streamText({
    model: openai('gpt-4-turbo'),
    prompt,
  })

  return result.toAIStreamResponse()
}
```

### 8. React Integration (useObject)

**Streaming Structured Data:**

```typescript
'use client'

import { experimental_useObject as useObject } from 'ai/react'
import { z } from 'zod'

const notificationSchema = z.object({
  notifications: z.array(
    z.object({
      name: z.string(),
      message: z.string(),
      minutesAgo: z.number(),
    })
  ),
})

export default function NotificationsComponent() {
  const { object, submit, isLoading } = useObject({
    api: '/api/notifications',
    schema: notificationSchema,
  })

  return (
    <div>
      <button onClick={() => submit('Generate 3 sample notifications')}>
        Generate Notifications
      </button>

      {isLoading && <p>Loading...</p>}

      {object?.notifications && (
        <ul>
          {object.notifications.map((notification, i) => (
            <li key={i}>
              <strong>{notification.name}</strong>: {notification.message}
              <span className="text-gray-500">({notification.minutesAgo}m ago)</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

### 9. React Server Components

**Streaming UI:**

```typescript
// app/actions.ts
'use server'

import { createStreamableUI, createStreamableValue } from 'ai/rsc'
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

export async function generateUI(prompt: string) {
  const ui = createStreamableUI()

  // Start with loading state
  ui.update(<div>Loading...</div>)

  const result = await streamText({
    model: openai('gpt-4-turbo'),
    prompt,
  })

  // Stream content
  let fullText = ''
  for await (const chunk of result.textStream) {
    fullText += chunk
    ui.update(<div>{fullText}</div>)
  }

  // Final state
  ui.done(<div className="final">{fullText}</div>)

  return ui.value
}

// Streaming value
export async function generateValue(prompt: string) {
  const value = createStreamableValue()

  const result = await streamText({
    model: openai('gpt-4-turbo'),
    prompt,
  })

  for await (const chunk of result.textStream) {
    value.update(chunk)
  }

  value.done()

  return value.value
}
```

**Client Component:**

```typescript
'use client'

import { useState } from 'react'
import { generateUI } from './actions'

export default function RSCComponent() {
  const [ui, setUI] = useState(null)

  const handleGenerate = async () => {
    const result = await generateUI('Write a poem about AI')
    setUI(result)
  }

  return (
    <div>
      <button onClick={handleGenerate}>Generate</button>
      {ui}
    </div>
  )
}
```

### 10. Multi-Modal Inputs

**Images:**

```typescript
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import fs from 'fs'

// Image from file
async function analyzeImage(imagePath: string) {
  const imageBuffer = fs.readFileSync(imagePath)
  const base64Image = imageBuffer.toString('base64')

  const { text } = await generateText({
    model: openai('gpt-4-vision-preview'),
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'What do you see in this image?' },
          {
            type: 'image',
            image: base64Image,
          },
        ],
      },
    ],
  })

  return text
}

// Image from URL
async function analyzeImageUrl(imageUrl: string) {
  const { text } = await generateText({
    model: openai('gpt-4-vision-preview'),
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Describe this image in detail.' },
          {
            type: 'image',
            image: new URL(imageUrl),
          },
        ],
      },
    ],
  })

  return text
}

// Multiple images
async function compareImages(image1: string, image2: string) {
  const { text } = await generateText({
    model: openai('gpt-4-vision-preview'),
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Compare these two images:' },
          { type: 'image', image: new URL(image1) },
          { type: 'image', image: new URL(image2) },
          { type: 'text', text: 'What are the key differences?' },
        ],
      },
    ],
  })

  return text
}
```

**File Attachments:**

```typescript
// In API route
export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  const prompt = formData.get('prompt') as string

  const buffer = Buffer.from(await file.arrayBuffer())
  const base64 = buffer.toString('base64')

  const { text } = await generateText({
    model: openai('gpt-4-vision-preview'),
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image', image: base64 },
        ],
      },
    ],
  })

  return Response.json({ text })
}
```

### 11. RAG (Retrieval-Augmented Generation)

**Complete RAG System:**

```typescript
import { embed, embedMany } from 'ai'
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

// Embedding model
const embeddingModel = openai.embedding('text-embedding-3-small')

// Create embeddings
async function createEmbeddings(texts: string[]) {
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: texts,
  })

  return embeddings
}

// Similarity search
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}

// RAG pipeline
async function ragQuery(
  query: string,
  documents: Array<{ text: string; embedding: number[] }>
) {
  // 1. Embed query
  const { embedding: queryEmbedding } = await embed({
    model: embeddingModel,
    value: query,
  })

  // 2. Find similar documents
  const similarities = documents.map((doc) => ({
    text: doc.text,
    similarity: cosineSimilarity(queryEmbedding, doc.embedding),
  }))

  // 3. Get top results
  const topDocs = similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3)
    .map((doc) => doc.text)

  // 4. Generate answer with context
  const result = await streamText({
    model: openai('gpt-4-turbo'),
    messages: [
      {
        role: 'system',
        content: 'Answer questions based on the provided context.',
      },
      {
        role: 'user',
        content: `Context:\n${topDocs.join('\n\n')}\n\nQuestion: ${query}`,
      },
    ],
  })

  return result
}
```

**Production RAG API:**

```typescript
// app/api/rag/route.ts
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { retrieveDocuments } from '@/lib/vectordb'

export async function POST(req: Request) {
  const { query } = await req.json()

  // Retrieve relevant documents
  const documents = await retrieveDocuments(query, { limit: 5 })

  // Generate answer
  const result = await streamText({
    model: openai('gpt-4-turbo'),
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful assistant. Answer questions based on the provided context. If the answer is not in the context, say so.',
      },
      {
        role: 'user',
        content: `Context:\n${documents.map((d) => d.content).join('\n\n')}\n\nQuestion: ${query}`,
      },
    ],
  })

  return result.toAIStreamResponse()
}
```

### 12. Production Patterns

**Error Handling:**

```typescript
import { generateText } from 'ai'

async function robustGeneration(prompt: string) {
  try {
    const { text, finishReason, usage } = await generateText({
      model: openai('gpt-4-turbo'),
      prompt,
      maxRetries: 3, // Built-in retry
    })

    // Check finish reason
    if (finishReason === 'length') {
      console.warn('Response truncated due to length')
    }

    // Log usage
    console.log('Tokens used:', usage.totalTokens)

    return text
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('rate_limit')) {
        throw new Error('Rate limit exceeded. Please try again later.')
      }
      if (error.message.includes('context_length')) {
        throw new Error('Input too long. Please shorten your message.')
      }
    }

    throw new Error('AI generation failed. Please try again.')
  }
}
```

**Rate Limiting:**

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
})

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'

  const { success, limit, remaining } = await ratelimit.limit(ip)

  if (!success) {
    return Response.json(
      { error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
        },
      }
    )
  }

  // Process request
  const { messages } = await req.json()
  const result = await streamText({
    model: openai('gpt-4-turbo'),
    messages,
  })

  return result.toAIStreamResponse()
}
```

**Caching:**

```typescript
import { generateText } from 'ai'
import { createHash } from 'crypto'

const cache = new Map<string, { text: string; timestamp: number }>()
const CACHE_TTL = 1000 * 60 * 60 // 1 hour

async function cachedGeneration(prompt: string) {
  // Generate cache key
  const cacheKey = createHash('md5').update(prompt).digest('hex')

  // Check cache
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('Cache hit!')
    return cached.text
  }

  // Generate
  const { text } = await generateText({
    model: openai('gpt-4-turbo'),
    prompt,
  })

  // Store in cache
  cache.set(cacheKey, { text, timestamp: Date.now() })

  return text
}
```

**Monitoring:**

```typescript
class AIMonitor {
  private metrics = {
    totalRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    errors: 0,
  }

  async trackRequest<T>(fn: () => Promise<{ usage?: any; result: T }>): Promise<T> {
    this.metrics.totalRequests++

    try {
      const { usage, result } = await fn()

      if (usage) {
        this.metrics.totalTokens += usage.totalTokens || 0

        // Calculate cost (example for GPT-4 Turbo)
        const inputCost = (usage.promptTokens / 1000) * 0.01
        const outputCost = (usage.completionTokens / 1000) * 0.03
        this.metrics.totalCost += inputCost + outputCost
      }

      return result
    } catch (error) {
      this.metrics.errors++
      throw error
    }
  }

  getMetrics() {
    return { ...this.metrics }
  }
}

// Usage
const monitor = new AIMonitor()

const text = await monitor.trackRequest(async () => {
  const result = await generateText({
    model: openai('gpt-4-turbo'),
    prompt: 'Hello',
  })
  return { usage: result.usage, result: result.text }
})
```

### 13. Real-World Examples

**Chatbot with Tools:**

```typescript
// app/api/chat/route.ts
import { streamText, tool } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = await streamText({
    model: openai('gpt-4-turbo'),
    messages,
    tools: {
      getWeather: tool({
        description: 'Get weather for a location',
        parameters: z.object({
          location: z.string(),
        }),
        execute: async ({ location }) => {
          const weather = await fetch(`https://api.weather.com/${location}`)
          return await weather.json()
        },
      }),
      searchProducts: tool({
        description: 'Search product database',
        parameters: z.object({
          query: z.string(),
        }),
        execute: async ({ query }) => {
          const products = await db.products.search(query)
          return products
        },
      }),
    },
  })

  return result.toAIStreamResponse()
}
```

**Document Q&A:**

```typescript
export async function POST(req: Request) {
  const { question, documentId } = await req.json()

  // Retrieve document chunks
  const chunks = await vectorDB.search(documentId, question, { limit: 5 })

  const result = await streamText({
    model: openai('gpt-4-turbo'),
    messages: [
      {
        role: 'system',
        content:
          'Answer questions based only on the provided document context. Include citations.',
      },
      {
        role: 'user',
        content: `Document:\n${chunks.map((c) => c.text).join('\n\n')}\n\nQuestion: ${question}`,
      },
    ],
  })

  return result.toAIStreamResponse()
}
```

**Code Generation:**

```typescript
const codeSchema = z.object({
  code: z.string(),
  explanation: z.string(),
  language: z.string(),
  dependencies: z.array(z.string()),
})

export async function POST(req: Request) {
  const { description, language } = await req.json()

  const { object } = await generateObject({
    model: openai('gpt-4-turbo'),
    schema: codeSchema,
    prompt: `Generate ${language} code for: ${description}`,
  })

  return Response.json(object)
}
```

## 🎓 Best Practices

### Model Selection
- Use **gpt-4-turbo** for complex reasoning
- Use **gpt-3.5-turbo** for simple tasks (10x cheaper)
- Use **gpt-4-vision** for image analysis
- Consider **claude-3-opus** for long context

### Streaming
- Always stream for better UX
- Use `toAIStreamResponse()` for easy integration
- Handle errors in streams gracefully

### Structured Outputs
- Define schemas with Zod for type safety
- Use `generateObject` for JSON responses
- Stream objects for progressive rendering

### Tools/Functions
- Keep tool descriptions clear and specific
- Validate tool outputs
- Set `maxToolRoundtrips` appropriately
- Log tool usage for debugging

### React Integration
- Use `useChat` for conversational interfaces
- Use `useCompletion` for single completions
- Use `useObject` for structured data
- Implement loading and error states

### Production
- Add rate limiting
- Implement caching for repeated queries
- Monitor token usage and costs
- Add comprehensive error handling
- Use environment variables for API keys

## 📊 Performance

- **Latency:** Streaming starts in <1s typically
- **Token Efficiency:** Use shorter prompts when possible
- **Caching:** Cache identical prompts
- **Edge Runtime:** Vercel AI SDK works on edge

## 🔗 Resources

- [Vercel AI SDK Docs](https://sdk.vercel.ai)
- [Examples](https://github.com/vercel/ai/tree/main/examples)
- [API Reference](https://sdk.vercel.ai/docs/reference)
- [Discord](https://discord.gg/vercel)

---

**Remember:** Vercel AI SDK abstracts complexity while providing full control. Use it to build production-ready AI features with minimal boilerplate.
