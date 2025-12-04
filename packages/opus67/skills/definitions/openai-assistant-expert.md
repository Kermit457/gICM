# OpenAI Assistants API Expert

> **ID:** `openai-assistant-expert`
> **Tier:** 2
> **Token Cost:** 8500
> **MCP Connections:** openai

## 🎯 What This Skill Does

You are an expert in OpenAI's Assistants API v2 (GPT-4, GPT-4 Turbo, GPT-3.5). You understand assistant creation, thread management, function calling, file uploads, code interpreter, retrieval, streaming, and production-grade assistant implementation patterns.

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** openai assistant, chatbot, gpt-4, threads, runs, function calling, code interpreter, retrieval
- **File Types:** N/A
- **Directories:** `assistants/`, `openai/`, `chatbot/`

## 🚀 Core Capabilities

### 1. Assistants API Overview

**Architecture:**

```typescript
// The Assistants API has 4 main components:

// 1. Assistants - AI personas with instructions and tools
// 2. Threads - Conversation sessions
// 3. Messages - Individual messages in a thread
// 4. Runs - Execute assistant on a thread

interface Assistant {
  id: string
  name: string
  description: string
  model: string
  instructions: string
  tools: Array<{ type: string }>
  file_ids?: string[]
  metadata?: Record<string, any>
}

interface Thread {
  id: string
  metadata?: Record<string, any>
}

interface Message {
  id: string
  thread_id: string
  role: 'user' | 'assistant'
  content: Array<{ type: string; text?: { value: string } }>
  file_ids?: string[]
}

interface Run {
  id: string
  thread_id: string
  assistant_id: string
  status:
    | 'queued'
    | 'in_progress'
    | 'requires_action'
    | 'cancelling'
    | 'cancelled'
    | 'failed'
    | 'completed'
    | 'expired'
  required_action?: {
    type: 'submit_tool_outputs'
    submit_tool_outputs: {
      tool_calls: Array<{
        id: string
        type: 'function'
        function: { name: string; arguments: string }
      }>
    }
  }
}
```

### 2. Basic Setup & Configuration

**Initialize OpenAI Client:**

```typescript
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Model selection (December 2024)
const MODELS = {
  'gpt-4-turbo': 'gpt-4-turbo-preview', // Latest GPT-4 Turbo
  'gpt-4': 'gpt-4', // Standard GPT-4
  'gpt-3.5-turbo': 'gpt-3.5-turbo', // Fast and cheap
  'gpt-4o': 'gpt-4o', // GPT-4 optimized
  'gpt-4o-mini': 'gpt-4o-mini', // Smallest, cheapest
} as const

// Pricing (per 1M tokens)
const PRICING = {
  'gpt-4-turbo': { input: 10, output: 30 },
  'gpt-4': { input: 30, output: 60 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  'gpt-4o': { input: 5, output: 15 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
}
```

### 3. Creating Assistants

**Basic Assistant:**

```typescript
// Create a simple assistant
async function createBasicAssistant() {
  const assistant = await openai.beta.assistants.create({
    name: 'Customer Support Assistant',
    description: 'Handles customer inquiries and support tickets',
    model: 'gpt-4-turbo',
    instructions: `You are a helpful customer support assistant.

Your responsibilities:
- Answer customer questions professionally
- Escalate complex issues to human agents
- Provide accurate product information
- Maintain a friendly, helpful tone

Always prioritize customer satisfaction.`,
  })

  console.log('Created assistant:', assistant.id)
  return assistant
}

// Create assistant with tools
async function createAssistantWithTools() {
  const assistant = await openai.beta.assistants.create({
    name: 'Code Helper',
    model: 'gpt-4-turbo',
    instructions: 'You help users write and debug code.',
    tools: [
      { type: 'code_interpreter' }, // Execute Python code
      { type: 'retrieval' }, // Search uploaded files
      {
        type: 'function',
        function: {
          name: 'search_docs',
          description: 'Search documentation database',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
              section: { type: 'string', description: 'Documentation section' },
            },
            required: ['query'],
          },
        },
      },
    ],
  })

  return assistant
}

// Update assistant
async function updateAssistant(assistantId: string) {
  const assistant = await openai.beta.assistants.update(assistantId, {
    instructions: 'Updated instructions...',
    model: 'gpt-4-turbo',
    tools: [{ type: 'code_interpreter' }],
  })

  return assistant
}

// List all assistants
async function listAssistants() {
  const assistants = await openai.beta.assistants.list({
    order: 'desc',
    limit: 20,
  })

  return assistants.data
}

// Delete assistant
async function deleteAssistant(assistantId: string) {
  await openai.beta.assistants.del(assistantId)
}
```

### 4. Thread Management

**Create & Manage Threads:**

```typescript
// Create thread
async function createThread() {
  const thread = await openai.beta.threads.create()
  console.log('Thread created:', thread.id)
  return thread
}

// Create thread with initial messages
async function createThreadWithMessages() {
  const thread = await openai.beta.threads.create({
    messages: [
      {
        role: 'user',
        content: 'Hello! I need help with my order.',
      },
    ],
  })

  return thread
}

// Add message to thread
async function addMessage(threadId: string, content: string, fileIds?: string[]) {
  const message = await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content,
    file_ids: fileIds,
  })

  return message
}

// List messages in thread
async function listMessages(threadId: string) {
  const messages = await openai.beta.threads.messages.list(threadId, {
    order: 'asc', // Chronological order
  })

  return messages.data
}

// Retrieve specific message
async function getMessage(threadId: string, messageId: string) {
  const message = await openai.beta.threads.messages.retrieve(threadId, messageId)
  return message
}

// Delete thread
async function deleteThread(threadId: string) {
  await openai.beta.threads.del(threadId)
}

// Thread with metadata (for user tracking)
async function createThreadWithMetadata(userId: string, sessionId: string) {
  const thread = await openai.beta.threads.create({
    metadata: {
      userId,
      sessionId,
      createdAt: new Date().toISOString(),
    },
  })

  return thread
}
```

### 5. Running Assistants

**Execute Runs:**

```typescript
// Basic run
async function runAssistant(threadId: string, assistantId: string): Promise<string> {
  // Create run
  let run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
  })

  // Poll until complete
  while (run.status === 'queued' || run.status === 'in_progress') {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    run = await openai.beta.threads.runs.retrieve(threadId, run.id)
  }

  if (run.status === 'completed') {
    // Get messages
    const messages = await openai.beta.threads.messages.list(threadId)
    const lastMessage = messages.data[0]

    // Extract text
    const textContent = lastMessage.content.find((c) => c.type === 'text')
    return textContent?.text?.value || ''
  } else {
    throw new Error(`Run failed with status: ${run.status}`)
  }
}

// Run with additional instructions
async function runWithInstructions(
  threadId: string,
  assistantId: string,
  instructions: string
) {
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
    additional_instructions: instructions,
  })

  return run
}

// Run with tool override
async function runWithTools(threadId: string, assistantId: string) {
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
    tools: [
      { type: 'code_interpreter' },
      {
        type: 'function',
        function: {
          name: 'get_weather',
          description: 'Get weather for location',
          parameters: {
            type: 'object',
            properties: {
              location: { type: 'string' },
            },
            required: ['location'],
          },
        },
      },
    ],
  })

  return run
}

// Cancel run
async function cancelRun(threadId: string, runId: string) {
  const run = await openai.beta.threads.runs.cancel(threadId, runId)
  return run
}

// List all runs for a thread
async function listRuns(threadId: string) {
  const runs = await openai.beta.threads.runs.list(threadId, {
    order: 'desc',
    limit: 20,
  })

  return runs.data
}
```

### 6. Streaming Responses

**Real-Time Streaming:**

```typescript
// Stream assistant responses
async function streamAssistantResponse(
  threadId: string,
  assistantId: string,
  onChunk: (text: string) => void
): Promise<string> {
  let fullText = ''

  const stream = await openai.beta.threads.runs.stream(threadId, {
    assistant_id: assistantId,
  })

  stream.on('textCreated', () => {
    process.stdout.write('\nassistant > ')
  })

  stream.on('textDelta', (textDelta) => {
    const chunk = textDelta.value || ''
    fullText += chunk
    process.stdout.write(chunk)
    onChunk(chunk)
  })

  stream.on('textDone', () => {
    console.log('\n')
  })

  await stream.finalRun()

  return fullText
}

// Stream with event handling
async function streamWithEvents(threadId: string, assistantId: string) {
  const stream = await openai.beta.threads.runs.stream(threadId, {
    assistant_id: assistantId,
  })

  stream
    .on('event', (event) => {
      console.log('Event:', event.event)
    })
    .on('textCreated', () => {
      console.log('Text started')
    })
    .on('textDelta', (delta) => {
      process.stdout.write(delta.value || '')
    })
    .on('toolCallCreated', (toolCall) => {
      console.log(`\nTool call: ${toolCall.type}`)
    })
    .on('toolCallDelta', (delta) => {
      if (delta.type === 'code_interpreter' && delta.code_interpreter?.input) {
        process.stdout.write(delta.code_interpreter.input)
      }
    })
    .on('imageFileDone', (image) => {
      console.log('\nImage generated:', image.file_id)
    })
    .on('error', (error) => {
      console.error('Stream error:', error)
    })

  const result = await stream.finalRun()
  return result
}

// Production streaming implementation
class AssistantStreamer {
  private fullText: string = ''
  private toolCalls: Array<{ name: string; args: string }> = []

  async stream(
    threadId: string,
    assistantId: string,
    callbacks: {
      onText?: (text: string) => void
      onToolCall?: (name: string, args: any) => void
      onComplete?: (text: string) => void
      onError?: (error: Error) => void
    }
  ): Promise<string> {
    try {
      const stream = await openai.beta.threads.runs.stream(threadId, {
        assistant_id: assistantId,
      })

      stream
        .on('textDelta', (delta) => {
          const chunk = delta.value || ''
          this.fullText += chunk
          callbacks.onText?.(chunk)
        })
        .on('toolCallCreated', (toolCall) => {
          if (toolCall.type === 'function') {
            this.toolCalls.push({
              name: toolCall.function?.name || '',
              args: '',
            })
          }
        })
        .on('toolCallDelta', (delta) => {
          if (delta.type === 'function' && delta.function?.arguments) {
            const lastCall = this.toolCalls[this.toolCalls.length - 1]
            if (lastCall) {
              lastCall.args += delta.function.arguments
            }
          }
        })
        .on('error', (error) => {
          callbacks.onError?.(error)
        })

      await stream.finalRun()

      callbacks.onComplete?.(this.fullText)

      return this.fullText
    } catch (error) {
      callbacks.onError?.(error as Error)
      throw error
    }
  }

  getToolCalls() {
    return this.toolCalls.map((call) => ({
      name: call.name,
      args: JSON.parse(call.args || '{}'),
    }))
  }
}

// Usage
const streamer = new AssistantStreamer()
const response = await streamer.stream(threadId, assistantId, {
  onText: (text) => process.stdout.write(text),
  onComplete: (fullText) => console.log('\n\nComplete:', fullText.length, 'chars'),
  onError: (error) => console.error('Error:', error),
})
```

### 7. Function Calling

**Implement Functions:**

```typescript
// Define functions
const functions = [
  {
    name: 'get_user_orders',
    description: 'Retrieve user order history',
    parameters: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'User ID' },
        limit: { type: 'number', description: 'Max number of orders' },
      },
      required: ['user_id'],
    },
  },
  {
    name: 'cancel_order',
    description: 'Cancel an existing order',
    parameters: {
      type: 'object',
      properties: {
        order_id: { type: 'string', description: 'Order ID to cancel' },
        reason: { type: 'string', description: 'Cancellation reason' },
      },
      required: ['order_id'],
    },
  },
  {
    name: 'search_products',
    description: 'Search product catalog',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        category: { type: 'string', description: 'Product category' },
        price_max: { type: 'number', description: 'Maximum price' },
      },
      required: ['query'],
    },
  },
]

// Function implementations
const availableFunctions: Record<string, (args: any) => Promise<any>> = {
  get_user_orders: async (args) => {
    // Call your database/API
    return {
      orders: [
        { id: '123', status: 'shipped', total: 99.99 },
        { id: '124', status: 'pending', total: 49.99 },
      ],
    }
  },
  cancel_order: async (args) => {
    // Call cancellation API
    return {
      success: true,
      order_id: args.order_id,
      message: 'Order cancelled successfully',
    }
  },
  search_products: async (args) => {
    // Search product database
    return {
      products: [
        { id: '1', name: 'Widget A', price: 29.99 },
        { id: '2', name: 'Widget B', price: 39.99 },
      ],
    }
  },
}

// Handle function calling
async function runWithFunctionCalling(
  threadId: string,
  assistantId: string
): Promise<string> {
  let run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
  })

  while (true) {
    // Poll for status
    await new Promise((resolve) => setTimeout(resolve, 1000))
    run = await openai.beta.threads.runs.retrieve(threadId, run.id)

    // Handle function calls
    if (run.status === 'requires_action') {
      const toolCalls = run.required_action?.submit_tool_outputs.tool_calls || []

      const toolOutputs = await Promise.all(
        toolCalls.map(async (toolCall) => {
          const functionName = toolCall.function.name
          const functionArgs = JSON.parse(toolCall.function.arguments)

          console.log(`Calling function: ${functionName}`, functionArgs)

          const func = availableFunctions[functionName]
          if (!func) {
            throw new Error(`Unknown function: ${functionName}`)
          }

          const output = await func(functionArgs)

          return {
            tool_call_id: toolCall.id,
            output: JSON.stringify(output),
          }
        })
      )

      // Submit tool outputs
      run = await openai.beta.threads.runs.submitToolOutputs(threadId, run.id, {
        tool_outputs: toolOutputs,
      })
    } else if (run.status === 'completed') {
      // Get final response
      const messages = await openai.beta.threads.messages.list(threadId)
      const lastMessage = messages.data[0]
      const textContent = lastMessage.content.find((c) => c.type === 'text')
      return textContent?.text?.value || ''
    } else if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
      throw new Error(`Run ${run.status}: ${run.last_error?.message}`)
    }
  }
}
```

### 8. File Uploads & Retrieval

**Upload Files for Assistants:**

```typescript
import fs from 'fs'

// Upload file
async function uploadFile(filePath: string, purpose: 'assistants' | 'fine-tune' = 'assistants') {
  const file = await openai.files.create({
    file: fs.createReadStream(filePath),
    purpose,
  })

  console.log('Uploaded file:', file.id)
  return file
}

// Create assistant with files
async function createAssistantWithFiles(fileIds: string[]) {
  const assistant = await openai.beta.assistants.create({
    name: 'Document Assistant',
    model: 'gpt-4-turbo',
    instructions: 'You help users understand their documents.',
    tools: [{ type: 'retrieval' }],
    file_ids: fileIds,
  })

  return assistant
}

// Add file to existing assistant
async function addFileToAssistant(assistantId: string, fileId: string) {
  const assistantFile = await openai.beta.assistants.files.create(assistantId, {
    file_id: fileId,
  })

  return assistantFile
}

// List files for assistant
async function listAssistantFiles(assistantId: string) {
  const files = await openai.beta.assistants.files.list(assistantId)
  return files.data
}

// Delete file from assistant
async function removeFileFromAssistant(assistantId: string, fileId: string) {
  await openai.beta.assistants.files.del(assistantId, fileId)
}

// Upload and attach file to message
async function sendMessageWithFile(threadId: string, filePath: string, prompt: string) {
  // Upload file
  const file = await uploadFile(filePath)

  // Add message with file
  const message = await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: prompt,
    file_ids: [file.id],
  })

  return message
}

// Retrieve file content
async function downloadFile(fileId: string, outputPath: string) {
  const response = await openai.files.content(fileId)
  const buffer = Buffer.from(await response.arrayBuffer())
  fs.writeFileSync(outputPath, buffer)
}

// Delete file
async function deleteFile(fileId: string) {
  await openai.files.del(fileId)
}
```

### 9. Code Interpreter

**Execute Code:**

```typescript
// Create assistant with code interpreter
async function createCodeAssistant() {
  const assistant = await openai.beta.assistants.create({
    name: 'Data Analyst',
    model: 'gpt-4-turbo',
    instructions: `You are a data analyst. Analyze data and create visualizations.

Use Python for:
- Data analysis with pandas
- Visualizations with matplotlib
- Statistical calculations
- Data transformations`,
    tools: [{ type: 'code_interpreter' }],
  })

  return assistant
}

// Upload data file for analysis
async function analyzeDataFile(threadId: string, assistantId: string, csvPath: string) {
  // Upload CSV
  const file = await uploadFile(csvPath)

  // Add message requesting analysis
  await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: 'Analyze this dataset and create a visualization of the trends.',
    file_ids: [file.id],
  })

  // Run assistant
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
  })

  // Wait for completion
  let completedRun = run
  while (completedRun.status === 'queued' || completedRun.status === 'in_progress') {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    completedRun = await openai.beta.threads.runs.retrieve(threadId, run.id)
  }

  // Get messages
  const messages = await openai.beta.threads.messages.list(threadId)
  const lastMessage = messages.data[0]

  // Extract text and image outputs
  const outputs = {
    text: '',
    images: [] as string[],
  }

  for (const content of lastMessage.content) {
    if (content.type === 'text') {
      outputs.text = content.text.value
    } else if (content.type === 'image_file') {
      outputs.images.push(content.image_file.file_id)
    }
  }

  return outputs
}

// Download generated images
async function downloadGeneratedImages(fileIds: string[], outputDir: string) {
  for (let i = 0; i < fileIds.length; i++) {
    const outputPath = `${outputDir}/image_${i}.png`
    await downloadFile(fileIds[i], outputPath)
    console.log(`Downloaded: ${outputPath}`)
  }
}
```

### 10. Production Patterns

**Complete Assistant Manager:**

```typescript
class AssistantManager {
  private assistantId: string | null = null
  private threads: Map<string, string> = new Map() // userId -> threadId

  constructor(private openai: OpenAI) {}

  async initialize(config: {
    name: string
    instructions: string
    model?: string
    tools?: Array<{ type: string }>
  }) {
    const assistant = await this.openai.beta.assistants.create({
      name: config.name,
      instructions: config.instructions,
      model: config.model || 'gpt-4-turbo',
      tools: config.tools || [],
    })

    this.assistantId = assistant.id
    console.log('Assistant initialized:', this.assistantId)
  }

  async getOrCreateThread(userId: string): Promise<string> {
    let threadId = this.threads.get(userId)

    if (!threadId) {
      const thread = await this.openai.beta.threads.create({
        metadata: { userId },
      })
      threadId = thread.id
      this.threads.set(userId, threadId)
    }

    return threadId
  }

  async sendMessage(
    userId: string,
    content: string,
    fileIds?: string[]
  ): Promise<string> {
    if (!this.assistantId) {
      throw new Error('Assistant not initialized')
    }

    const threadId = await this.getOrCreateThread(userId)

    // Add user message
    await this.openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content,
      file_ids: fileIds,
    })

    // Run assistant
    return this.runAssistant(threadId)
  }

  async streamMessage(
    userId: string,
    content: string,
    onChunk: (text: string) => void
  ): Promise<string> {
    if (!this.assistantId) {
      throw new Error('Assistant not initialized')
    }

    const threadId = await this.getOrCreateThread(userId)

    // Add user message
    await this.openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content,
    })

    // Stream response
    let fullText = ''
    const stream = await this.openai.beta.threads.runs.stream(threadId, {
      assistant_id: this.assistantId,
    })

    stream.on('textDelta', (delta) => {
      const chunk = delta.value || ''
      fullText += chunk
      onChunk(chunk)
    })

    await stream.finalRun()

    return fullText
  }

  private async runAssistant(threadId: string): Promise<string> {
    let run = await this.openai.beta.threads.runs.create(threadId, {
      assistant_id: this.assistantId!,
    })

    while (true) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      run = await this.openai.beta.threads.runs.retrieve(threadId, run.id)

      if (run.status === 'completed') {
        const messages = await this.openai.beta.threads.messages.list(threadId)
        const lastMessage = messages.data[0]
        const textContent = lastMessage.content.find((c) => c.type === 'text')
        return textContent?.text?.value || ''
      } else if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
        throw new Error(`Run ${run.status}`)
      }
    }
  }

  async getThreadHistory(userId: string): Promise<Message[]> {
    const threadId = this.threads.get(userId)
    if (!threadId) return []

    const messages = await this.openai.beta.threads.messages.list(threadId)
    return messages.data
  }

  async clearThread(userId: string): Promise<void> {
    const threadId = this.threads.get(userId)
    if (threadId) {
      await this.openai.beta.threads.del(threadId)
      this.threads.delete(userId)
    }
  }

  async shutdown(): Promise<void> {
    // Clean up threads
    for (const threadId of this.threads.values()) {
      try {
        await this.openai.beta.threads.del(threadId)
      } catch (error) {
        console.error('Error deleting thread:', error)
      }
    }

    this.threads.clear()
  }
}

// Usage
const manager = new AssistantManager(openai)

await manager.initialize({
  name: 'Customer Support',
  instructions: 'You are a helpful customer support agent.',
  tools: [{ type: 'retrieval' }],
})

const response = await manager.sendMessage('user-123', 'I need help with my order')
console.log(response)

// Streaming
await manager.streamMessage('user-123', 'Tell me about your return policy', (chunk) => {
  process.stdout.write(chunk)
})
```

**Rate Limiting & Cost Management:**

```typescript
import pLimit from 'p-limit'

class AssistantRateLimiter {
  private limit: ReturnType<typeof pLimit>
  private requestCount = 0
  private tokenUsage = 0
  private cost = 0

  constructor(
    private maxConcurrent: number = 5,
    private model: keyof typeof PRICING = 'gpt-4-turbo'
  ) {
    this.limit = pLimit(maxConcurrent)
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return this.limit(async () => {
      this.requestCount++
      const result = await fn()

      // Track usage (if available)
      // Note: Assistants API doesn't always return token counts
      // You may need to estimate based on content length

      return result
    })
  }

  getStats() {
    return {
      requests: this.requestCount,
      tokens: this.tokenUsage,
      cost: this.cost,
    }
  }

  reset() {
    this.requestCount = 0
    this.tokenUsage = 0
    this.cost = 0
  }
}

// Usage
const limiter = new AssistantRateLimiter(5, 'gpt-4-turbo')

const results = await Promise.all(
  userMessages.map((msg) =>
    limiter.execute(async () => {
      return manager.sendMessage(msg.userId, msg.content)
    })
  )
)

console.log('Stats:', limiter.getStats())
```

### 11. Real-World Examples

**Customer Support Bot:**

```typescript
async function createSupportBot() {
  // Create assistant
  const assistant = await openai.beta.assistants.create({
    name: 'Support Bot',
    model: 'gpt-4-turbo',
    instructions: `You are a customer support assistant for TechCorp.

Knowledge base:
- Shipping: 3-5 business days, free over $50
- Returns: 30-day return policy, no questions asked
- Support hours: 9am-5pm EST, Mon-Fri
- Contact: support@techcorp.com

Responsibilities:
1. Answer common questions
2. Look up order status
3. Process returns
4. Escalate complex issues

Always be polite and professional.`,
    tools: [
      {
        type: 'function',
        function: {
          name: 'get_order_status',
          description: 'Get status of an order',
          parameters: {
            type: 'object',
            properties: {
              order_id: { type: 'string' },
            },
            required: ['order_id'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'initiate_return',
          description: 'Start return process',
          parameters: {
            type: 'object',
            properties: {
              order_id: { type: 'string' },
              reason: { type: 'string' },
            },
            required: ['order_id', 'reason'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'escalate_to_human',
          description: 'Escalate to human agent',
          parameters: {
            type: 'object',
            properties: {
              reason: { type: 'string' },
              priority: { type: 'string', enum: ['low', 'medium', 'high'] },
            },
            required: ['reason'],
          },
        },
      },
    ],
  })

  return assistant.id
}

// Handle support conversation
async function handleSupportTicket(userId: string, message: string) {
  const manager = new AssistantManager(openai)
  await manager.initialize({
    name: 'Support Bot',
    instructions: '...',
  })

  const response = await manager.sendMessage(userId, message)
  return response
}
```

**Code Review Assistant:**

```typescript
async function createCodeReviewer() {
  const assistant = await openai.beta.assistants.create({
    name: 'Code Reviewer',
    model: 'gpt-4-turbo',
    instructions: `You are an expert code reviewer.

Review code for:
1. Bugs and logic errors
2. Security vulnerabilities
3. Performance issues
4. Code style and best practices
5. Test coverage

Provide:
- Clear explanations
- Specific line references
- Suggested fixes
- Severity ratings (low/medium/high)`,
    tools: [{ type: 'code_interpreter' }],
  })

  return assistant
}

// Review code
async function reviewCode(code: string, language: string): Promise<{
  summary: string
  issues: Array<{ severity: string; description: string; fix: string }>
  score: number
}> {
  const thread = await openai.beta.threads.create()

  await openai.beta.threads.messages.create(thread.id, {
    role: 'user',
    content: `Review this ${language} code and provide detailed feedback.

Code:
\`\`\`${language}
${code}
\`\`\`

Format your response as JSON with: summary, issues (array of {severity, description, fix}), score (0-100)`,
  })

  const assistantId = await createCodeReviewer()
  const response = await runAssistant(thread.id, assistantId.id)

  // Parse JSON response
  const jsonMatch = response.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Failed to parse response')

  return JSON.parse(jsonMatch[0])
}
```

**Document Q&A System:**

```typescript
async function createDocumentQA(documents: string[]) {
  // Upload documents
  const fileIds = await Promise.all(documents.map((path) => uploadFile(path)))

  // Create assistant with retrieval
  const assistant = await openai.beta.assistants.create({
    name: 'Document Q&A',
    model: 'gpt-4-turbo',
    instructions: `You answer questions based on the uploaded documents.

Rules:
- Only use information from the documents
- Cite specific sources when possible
- If information isn't in documents, say so
- Provide detailed, accurate answers`,
    tools: [{ type: 'retrieval' }],
    file_ids: fileIds.map((f) => f.id),
  })

  return {
    assistantId: assistant.id,
    fileIds: fileIds.map((f) => f.id),
  }
}

// Ask questions
async function askQuestion(assistantId: string, question: string): Promise<string> {
  const thread = await openai.beta.threads.create()

  await openai.beta.threads.messages.create(thread.id, {
    role: 'user',
    content: question,
  })

  return runAssistant(thread.id, assistantId)
}
```

## 🎓 Best Practices

### Assistant Design
- Write clear, specific instructions
- Define tools and functions precisely
- Use metadata for tracking and organization
- Test with diverse inputs

### Thread Management
- Create one thread per user/conversation
- Store thread IDs in your database
- Clean up old threads regularly
- Use metadata for filtering/querying

### Function Calling
- Define clear function schemas
- Implement robust error handling
- Return structured JSON data
- Log all function executions

### File Handling
- Validate file types and sizes
- Clean up uploaded files after use
- Monitor file storage limits
- Use retrieval for large document sets

### Performance
- Use streaming for better UX
- Implement rate limiting
- Cache thread IDs
- Poll efficiently (1-2 second intervals)

### Cost Optimization
- Use gpt-3.5-turbo for simple tasks
- Use gpt-4-turbo for complex reasoning
- Monitor token usage
- Delete unused assistants and threads

### Error Handling
- Always check run status
- Handle timeout scenarios
- Implement retry logic
- Log errors comprehensively

## 📊 Performance & Costs

- **Latency:** 2-10 seconds depending on complexity
- **Concurrency:** 5-10 parallel runs recommended
- **File Limits:** 20 files per assistant, 10,000 files per organization
- **Thread Limits:** No hard limit, but clean up regularly

## 🔗 Resources

- [Assistants API Docs](https://platform.openai.com/docs/assistants)
- [Function Calling Guide](https://platform.openai.com/docs/guides/function-calling)
- [Code Interpreter](https://platform.openai.com/docs/assistants/tools/code-interpreter)
- [Pricing](https://openai.com/pricing)

---

**Remember:** Assistants API is best for stateful conversations, multi-turn interactions, and scenarios where you need built-in file handling, code execution, or retrieval capabilities.
