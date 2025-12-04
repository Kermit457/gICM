# Gemini Expert

> **ID:** `gemini-expert`
> **Tier:** 2
> **Token Cost:** 8000
> **MCP Connections:** google-ai-studio

## 🎯 What This Skill Does

You are an expert in Google's Gemini API (Gemini 1.5 Pro, Gemini 1.5 Flash, Gemini 2.0 Flash). You understand multimodal capabilities (text, images, video, audio), long context windows (2M tokens), function calling, structured outputs, streaming, caching, and production-grade Gemini integration patterns.

## 📚 When to Use

This skill is automatically loaded when:

- **Keywords:** gemini, google ai, palm, bard, multimodal, vision, video analysis, audio transcription
- **File Types:** N/A
- **Directories:** `gemini/`, `google-ai/`

## 🚀 Core Capabilities

### 1. Gemini Model Selection & Configuration

**Model Comparison (December 2024):**

```typescript
interface GeminiModel {
  id: string
  contextWindow: number
  maxOutputTokens: number
  inputPricing: { perMillion: number }
  outputPricing: { perMillion: number }
  capabilities: string[]
  bestFor: string[]
}

const GEMINI_MODELS: Record<string, GeminiModel> = {
  'gemini-2.0-flash-exp': {
    id: 'gemini-2.0-flash-exp',
    contextWindow: 1000000, // 1M tokens
    maxOutputTokens: 8192,
    inputPricing: { perMillion: 0 }, // Free during preview
    outputPricing: { perMillion: 0 },
    capabilities: [
      'multimodal-live',
      'native-audio',
      'native-image',
      'spatial-understanding',
      'multilingual',
    ],
    bestFor: ['real-time', 'multimodal-chat', 'fast-inference'],
  },
  'gemini-1.5-pro': {
    id: 'gemini-1.5-pro-002',
    contextWindow: 2000000, // 2M tokens
    maxOutputTokens: 8192,
    inputPricing: { perMillion: 1.25 }, // $1.25/M tokens (≤128K)
    outputPricing: { perMillion: 5.0 },
    capabilities: [
      'long-context',
      'multimodal',
      'function-calling',
      'code-execution',
      'json-mode',
    ],
    bestFor: [
      'large-documents',
      'code-analysis',
      'complex-reasoning',
      'production',
    ],
  },
  'gemini-1.5-flash': {
    id: 'gemini-1.5-flash-002',
    contextWindow: 1000000, // 1M tokens
    maxOutputTokens: 8192,
    inputPricing: { perMillion: 0.075 }, // $0.075/M tokens (≤128K)
    outputPricing: { perMillion: 0.3 },
    capabilities: [
      'fast-inference',
      'multimodal',
      'function-calling',
      'json-mode',
    ],
    bestFor: ['cost-optimized', 'high-volume', 'fast-responses'],
  },
  'gemini-1.5-flash-8b': {
    id: 'gemini-1.5-flash-8b',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    inputPricing: { perMillion: 0.0375 }, // 50% cheaper than flash
    outputPricing: { perMillion: 0.15 },
    capabilities: ['ultra-fast', 'multimodal', 'cost-optimized'],
    bestFor: ['high-volume', 'simple-tasks', 'minimum-cost'],
  },
}

// Model selection helper
function selectGeminiModel(requirements: {
  contextSize?: number
  speed?: 'fast' | 'balanced' | 'quality'
  cost?: 'minimum' | 'balanced' | 'quality'
  capabilities?: string[]
}): string {
  if (requirements.contextSize && requirements.contextSize > 1000000) {
    return 'gemini-1.5-pro'
  }

  if (requirements.speed === 'fast' && requirements.cost === 'minimum') {
    return 'gemini-1.5-flash-8b'
  }

  if (requirements.cost === 'minimum') {
    return 'gemini-1.5-flash-8b'
  }

  if (requirements.speed === 'fast') {
    return 'gemini-1.5-flash'
  }

  if (requirements.capabilities?.includes('code-execution')) {
    return 'gemini-1.5-pro'
  }

  return 'gemini-1.5-flash' // Default: best balance
}
```

### 2. Basic Gemini Integration

**Setup & Configuration:**

```typescript
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'

// Initialize client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

// Safety settings
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
]

// Generation config
const generationConfig = {
  temperature: 0.9,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 8192,
  responseMimeType: 'text/plain',
}

// Get model instance
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  safetySettings,
  generationConfig,
})

// Simple text generation
async function generateText(prompt: string): Promise<string> {
  const result = await model.generateContent(prompt)
  const response = result.response
  return response.text()
}

// Example usage
const response = await generateText('Explain quantum computing in simple terms')
console.log(response)
```

### 3. Streaming Responses

**Token-by-Token Streaming:**

```typescript
// Streaming for real-time responses
async function streamResponse(prompt: string): Promise<void> {
  const result = await model.generateContentStream(prompt)

  for await (const chunk of result.stream) {
    const chunkText = chunk.text()
    process.stdout.write(chunkText)
  }
}

// Streaming with full response access
async function streamWithAccumulation(prompt: string): Promise<string> {
  let fullText = ''
  const result = await model.generateContentStream(prompt)

  for await (const chunk of result.stream) {
    const chunkText = chunk.text()
    fullText += chunkText
    process.stdout.write(chunkText)
  }

  // Access final aggregated response
  const response = await result.response
  console.log('\n\nFinish reason:', response.candidates?.[0].finishReason)
  console.log('Token count:', response.usageMetadata)

  return fullText
}

// Streaming with error handling
async function robustStream(prompt: string): Promise<string> {
  let accumulated = ''

  try {
    const result = await model.generateContentStream(prompt)

    for await (const chunk of result.stream) {
      try {
        const text = chunk.text()
        accumulated += text
        // Send to client (SSE, WebSocket, etc.)
        process.stdout.write(text)
      } catch (e) {
        console.error('Chunk error:', e)
        // Continue with next chunk
      }
    }

    const response = await result.response
    const finishReason = response.candidates?.[0].finishReason

    if (finishReason === 'SAFETY') {
      throw new Error('Content blocked by safety filters')
    }

    return accumulated
  } catch (error) {
    console.error('Stream error:', error)
    throw error
  }
}
```

### 4. Multimodal Capabilities

**Image Analysis:**

```typescript
import fs from 'fs'

// Analyze image from file
async function analyzeImage(imagePath: string, prompt: string): Promise<string> {
  const imageData = fs.readFileSync(imagePath)
  const base64Image = imageData.toString('base64')

  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: 'image/jpeg', // or image/png, image/webp
    },
  }

  const result = await model.generateContent([prompt, imagePart])
  return result.response.text()
}

// Analyze image from URL
async function analyzeImageFromUrl(imageUrl: string, prompt: string): Promise<string> {
  const response = await fetch(imageUrl)
  const buffer = await response.arrayBuffer()
  const base64Image = Buffer.from(buffer).toString('base64')

  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: response.headers.get('content-type') || 'image/jpeg',
    },
  }

  const result = await model.generateContent([prompt, imagePart])
  return result.response.text()
}

// Multiple images
async function compareImages(
  image1Path: string,
  image2Path: string,
  prompt: string
): Promise<string> {
  const image1 = {
    inlineData: {
      data: fs.readFileSync(image1Path).toString('base64'),
      mimeType: 'image/jpeg',
    },
  }

  const image2 = {
    inlineData: {
      data: fs.readFileSync(image2Path).toString('base64'),
      mimeType: 'image/jpeg',
    },
  }

  const result = await model.generateContent([
    'Image 1:',
    image1,
    'Image 2:',
    image2,
    prompt,
  ])

  return result.response.text()
}

// Real-world example: UI screenshot analysis
async function analyzeUIScreenshot(screenshotPath: string): Promise<{
  description: string
  components: string[]
  accessibility: string[]
  improvements: string[]
}> {
  const prompt = `Analyze this UI screenshot and provide:
1. Overall description of the interface
2. List of UI components visible
3. Accessibility concerns
4. Suggestions for improvement

Format your response as JSON with keys: description, components, accessibility, improvements`

  const response = await analyzeImage(screenshotPath, prompt)

  // Parse JSON response
  const jsonMatch = response.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Failed to parse JSON response')

  return JSON.parse(jsonMatch[0])
}
```

**Video Analysis:**

```typescript
// Upload video file for analysis
async function uploadVideo(videoPath: string): Promise<string> {
  const { GoogleAIFileManager } = await import('@google/generative-ai/server')

  const fileManager = new GoogleAIFileManager(process.env.GOOGLE_AI_API_KEY!)

  const uploadResult = await fileManager.uploadFile(videoPath, {
    mimeType: 'video/mp4',
    displayName: 'Uploaded Video',
  })

  console.log(`Uploaded file: ${uploadResult.file.uri}`)
  return uploadResult.file.uri
}

// Analyze video content
async function analyzeVideo(videoUri: string, prompt: string): Promise<string> {
  const result = await model.generateContent([
    {
      fileData: {
        mimeType: 'video/mp4',
        fileUri: videoUri,
      },
    },
    prompt,
  ])

  return result.response.text()
}

// Real-world example: Video summarization
async function summarizeVideo(videoPath: string): Promise<{
  summary: string
  keyMoments: Array<{ timestamp: string; description: string }>
  topics: string[]
  sentiment: string
}> {
  // Upload video
  const videoUri = await uploadVideo(videoPath)

  // Wait for processing (videos need processing time)
  await new Promise((resolve) => setTimeout(resolve, 10000))

  const prompt = `Analyze this video and provide:
1. A comprehensive summary (2-3 paragraphs)
2. Key moments with timestamps
3. Main topics discussed
4. Overall sentiment/tone

Format as JSON with keys: summary, keyMoments (array of {timestamp, description}), topics (array), sentiment`

  const response = await analyzeVideo(videoUri, prompt)

  const jsonMatch = response.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Failed to parse JSON response')

  return JSON.parse(jsonMatch[0])
}
```

**Audio Analysis:**

```typescript
// Analyze audio file
async function analyzeAudio(audioPath: string, prompt: string): Promise<string> {
  const { GoogleAIFileManager } = await import('@google/generative-ai/server')

  const fileManager = new GoogleAIFileManager(process.env.GOOGLE_AI_API_KEY!)

  const uploadResult = await fileManager.uploadFile(audioPath, {
    mimeType: 'audio/mp3', // or audio/wav, audio/m4a
    displayName: 'Audio File',
  })

  const result = await model.generateContent([
    {
      fileData: {
        mimeType: 'audio/mp3',
        fileUri: uploadResult.file.uri,
      },
    },
    prompt,
  ])

  return result.response.text()
}

// Transcribe and analyze
async function transcribeAndAnalyze(audioPath: string): Promise<{
  transcript: string
  summary: string
  speakers: number
  sentiment: string
  actionItems: string[]
}> {
  const prompt = `Transcribe this audio and provide:
1. Full transcript
2. Summary of key points
3. Number of distinct speakers
4. Overall sentiment
5. Action items mentioned

Format as JSON`

  const response = await analyzeAudio(audioPath, prompt)

  const jsonMatch = response.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Failed to parse JSON response')

  return JSON.parse(jsonMatch[0])
}
```

### 5. Function Calling (Tool Use)

**Define and Use Functions:**

```typescript
// Define functions
const functions = [
  {
    name: 'get_weather',
    description: 'Get current weather for a location',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'City and state, e.g. San Francisco, CA',
        },
        unit: {
          type: 'string',
          enum: ['celsius', 'fahrenheit'],
          description: 'Temperature unit',
        },
      },
      required: ['location'],
    },
  },
  {
    name: 'search_database',
    description: 'Search product database',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
        },
        category: {
          type: 'string',
          description: 'Product category filter',
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of results',
        },
      },
      required: ['query'],
    },
  },
]

// Create model with functions
const modelWithFunctions = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  tools: [{ functionDeclarations: functions }],
})

// Function implementations
const availableFunctions = {
  get_weather: async (args: { location: string; unit?: string }) => {
    // Call weather API
    return {
      location: args.location,
      temperature: 72,
      unit: args.unit || 'fahrenheit',
      conditions: 'sunny',
    }
  },
  search_database: async (args: { query: string; category?: string; max_results?: number }) => {
    // Search database
    return [
      { id: 1, name: 'Product A', price: 29.99 },
      { id: 2, name: 'Product B', price: 39.99 },
    ]
  },
}

// Execute function calls
async function chatWithFunctions(userMessage: string): Promise<string> {
  const chat = modelWithFunctions.startChat()
  let response = await chat.sendMessage(userMessage)

  // Handle function calls
  while (response.response.candidates?.[0].content.parts.some((part) => part.functionCall)) {
    const functionCalls =
      response.response.candidates[0].content.parts.filter((part) => part.functionCall) || []

    const functionResponses = await Promise.all(
      functionCalls.map(async (part) => {
        const call = part.functionCall!
        const func = availableFunctions[call.name as keyof typeof availableFunctions]

        if (!func) {
          throw new Error(`Unknown function: ${call.name}`)
        }

        const result = await func(call.args as any)

        return {
          functionResponse: {
            name: call.name,
            response: result,
          },
        }
      })
    )

    // Send function results back
    response = await chat.sendMessage(functionResponses)
  }

  return response.response.text()
}

// Example usage
const answer = await chatWithFunctions("What's the weather in San Francisco?")
console.log(answer)
```

### 6. Multi-Turn Chat

**Conversation Management:**

```typescript
// Start a chat session
const chat = model.startChat({
  history: [
    {
      role: 'user',
      parts: [{ text: 'Hello! I need help with my project.' }],
    },
    {
      role: 'model',
      parts: [{ text: 'Hello! I'd be happy to help with your project. What are you working on?' }],
    },
  ],
})

// Continue conversation
const response1 = await chat.sendMessage("I'm building a React application")
console.log(response1.response.text())

const response2 = await chat.sendMessage('How do I handle state management?')
console.log(response2.response.text())

// Get chat history
const history = await chat.getHistory()
console.log('Conversation history:', history)
```

**Production Chat Implementation:**

```typescript
interface Message {
  role: 'user' | 'model'
  content: string
  timestamp: Date
}

class GeminiChatSession {
  private model: any
  private chat: any
  private messages: Message[] = []

  constructor(modelName: string = 'gemini-1.5-flash') {
    this.model = genAI.getGenerativeModel({ model: modelName })
  }

  async start(systemPrompt?: string): Promise<void> {
    const history = systemPrompt
      ? [
          {
            role: 'user' as const,
            parts: [{ text: systemPrompt }],
          },
          {
            role: 'model' as const,
            parts: [{ text: 'Understood. I'm ready to assist.' }],
          },
        ]
      : []

    this.chat = this.model.startChat({ history })
  }

  async sendMessage(content: string): Promise<string> {
    // Add user message
    this.messages.push({
      role: 'user',
      content,
      timestamp: new Date(),
    })

    // Get response
    const result = await this.chat.sendMessage(content)
    const responseText = result.response.text()

    // Add model response
    this.messages.push({
      role: 'model',
      content: responseText,
      timestamp: new Date(),
    })

    return responseText
  }

  async streamMessage(
    content: string,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    this.messages.push({
      role: 'user',
      content,
      timestamp: new Date(),
    })

    let fullResponse = ''
    const result = await this.chat.sendMessageStream(content)

    for await (const chunk of result.stream) {
      const text = chunk.text()
      fullResponse += text
      onChunk(text)
    }

    this.messages.push({
      role: 'model',
      content: fullResponse,
      timestamp: new Date(),
    })

    return fullResponse
  }

  getMessages(): Message[] {
    return this.messages
  }

  exportHistory(): string {
    return JSON.stringify(this.messages, null, 2)
  }

  async loadHistory(messages: Message[]): Promise<void> {
    this.messages = messages

    const history = messages.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }))

    this.chat = this.model.startChat({ history })
  }
}

// Usage
const chatSession = new GeminiChatSession('gemini-1.5-flash')
await chatSession.start('You are a helpful coding assistant.')

const response = await chatSession.sendMessage('Explain async/await')
console.log(response)

// Streaming
await chatSession.streamMessage('Write a quick sort implementation', (chunk) => {
  process.stdout.write(chunk)
})
```

### 7. JSON Mode & Structured Outputs

**Force JSON Responses:**

```typescript
// Configure for JSON output
const jsonModel = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    temperature: 0.2, // Lower temp for consistent structure
  },
})

// Define schema
interface ProductReview {
  product_name: string
  rating: number
  pros: string[]
  cons: string[]
  summary: string
  recommended: boolean
}

async function analyzeProductReview(reviewText: string): Promise<ProductReview> {
  const prompt = `Analyze this product review and extract structured information.

Review: ${reviewText}

Return JSON with this exact schema:
{
  "product_name": "string",
  "rating": number (1-5),
  "pros": ["string"],
  "cons": ["string"],
  "summary": "string",
  "recommended": boolean
}`

  const result = await jsonModel.generateContent(prompt)
  const jsonText = result.response.text()

  return JSON.parse(jsonText)
}

// Complex schema example
interface AnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral'
  confidence: number
  entities: Array<{
    name: string
    type: string
    relevance: number
  }>
  keywords: string[]
  summary: string
  categories: string[]
}

async function analyzeText(text: string): Promise<AnalysisResult> {
  const prompt = `Analyze this text and return detailed analysis as JSON:

Text: ${text}

Schema:
{
  "sentiment": "positive" | "negative" | "neutral",
  "confidence": number (0-1),
  "entities": [{"name": "string", "type": "string", "relevance": number}],
  "keywords": ["string"],
  "summary": "string",
  "categories": ["string"]
}`

  const result = await jsonModel.generateContent(prompt)
  return JSON.parse(result.response.text())
}
```

### 8. Context Caching (Cost Optimization)

**Cache Large Context:**

```typescript
import { GoogleAIFileManager, GoogleGenerativeAI } from '@google/generative-ai'

// For large documents or repeated context
async function setupCachedContext(
  largeDocument: string
): Promise<{ cacheId: string; model: any }> {
  // Upload document for caching
  const fileManager = new GoogleAIFileManager(process.env.GOOGLE_AI_API_KEY!)

  // Create cached content
  const cacheResult = await genAI.cachedContent.create({
    model: 'gemini-1.5-flash',
    contents: [
      {
        role: 'user',
        parts: [{ text: largeDocument }],
      },
    ],
    ttlSeconds: 3600, // Cache for 1 hour
  })

  // Use cached model
  const cachedModel = genAI.getGenerativeModelFromCachedContent(cacheResult)

  return {
    cacheId: cacheResult.name,
    model: cachedModel,
  }
}

// Use cached context
async function queryWithCache(cacheId: string, query: string): Promise<string> {
  const cachedModel = genAI.getGenerativeModelFromCachedContent({ name: cacheId })

  const result = await cachedModel.generateContent(query)
  return result.response.text()
}

// Example: Analyze large codebase with caching
async function analyzeCodebase(files: Record<string, string>): Promise<void> {
  // Combine all files into context
  const context = Object.entries(files)
    .map(([path, content]) => `File: ${path}\n\`\`\`\n${content}\n\`\`\``)
    .join('\n\n')

  // Setup cache
  const { cacheId, model } = await setupCachedContext(context)

  console.log('Cache created:', cacheId)

  // Multiple queries against same context (cost-effective)
  const queries = [
    'List all functions in this codebase',
    'Find potential security vulnerabilities',
    'Suggest refactoring opportunities',
    'Generate API documentation',
  ]

  for (const query of queries) {
    const response = await model.generateContent(query)
    console.log(`\n${query}:\n${response.response.text()}\n`)
  }
}
```

### 9. Error Handling & Safety

**Robust Error Handling:**

```typescript
import { GoogleGenerativeAIError } from '@google/generative-ai'

async function robustGeneration(prompt: string): Promise<string> {
  try {
    const result = await model.generateContent(prompt)
    const response = result.response

    // Check for safety blocks
    const candidate = response.candidates?.[0]
    if (candidate?.finishReason === 'SAFETY') {
      const safetyRatings = candidate.safetyRatings
      throw new Error(
        `Content blocked by safety filters: ${JSON.stringify(safetyRatings)}`
      )
    }

    // Check for other finish reasons
    if (candidate?.finishReason === 'RECITATION') {
      throw new Error('Content flagged as potential recitation')
    }

    if (candidate?.finishReason === 'MAX_TOKENS') {
      console.warn('Response truncated due to max tokens')
    }

    return response.text()
  } catch (error) {
    if (error instanceof GoogleGenerativeAIError) {
      // Handle API errors
      if (error.message.includes('quota')) {
        throw new Error('API quota exceeded')
      }
      if (error.message.includes('API key')) {
        throw new Error('Invalid API key')
      }
    }

    throw error
  }
}

// Retry logic
async function generateWithRetry(
  prompt: string,
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error | null = null

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await robustGeneration(prompt)
    } catch (error) {
      lastError = error as Error
      console.log(`Attempt ${i + 1} failed:`, error)

      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000))
    }
  }

  throw new Error(`Failed after ${maxRetries} retries: ${lastError?.message}`)
}
```

### 10. Production Patterns

**Rate Limiting & Quota Management:**

```typescript
import pLimit from 'p-limit'

class GeminiRateLimiter {
  private limit: ReturnType<typeof pLimit>
  private requestCount: number = 0
  private resetTime: Date = new Date()

  constructor(
    private maxRequestsPerMinute: number = 60,
    private maxConcurrent: number = 10
  ) {
    this.limit = pLimit(maxConcurrent)
    this.setupReset()
  }

  private setupReset(): void {
    setInterval(() => {
      this.requestCount = 0
      this.resetTime = new Date(Date.now() + 60000)
    }, 60000)
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check rate limit
    if (this.requestCount >= this.maxRequestsPerMinute) {
      const waitTime = this.resetTime.getTime() - Date.now()
      await new Promise((resolve) => setTimeout(resolve, waitTime))
    }

    this.requestCount++

    return this.limit(() => fn())
  }

  getStatus(): { requestCount: number; resetTime: Date } {
    return {
      requestCount: this.requestCount,
      resetTime: this.resetTime,
    }
  }
}

// Usage
const rateLimiter = new GeminiRateLimiter(60, 10)

async function batchProcess(prompts: string[]): Promise<string[]> {
  const results = await Promise.all(
    prompts.map((prompt) =>
      rateLimiter.execute(async () => {
        const result = await model.generateContent(prompt)
        return result.response.text()
      })
    )
  )

  return results
}
```

**Monitoring & Logging:**

```typescript
interface UsageMetrics {
  totalRequests: number
  totalTokens: number
  totalCost: number
  errors: number
  averageLatency: number
}

class GeminiMonitor {
  private metrics: UsageMetrics = {
    totalRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    errors: 0,
    averageLatency: 0,
  }

  private latencies: number[] = []

  async trackRequest<T>(
    modelId: string,
    fn: () => Promise<{ response: any; result: T }>
  ): Promise<T> {
    const startTime = Date.now()
    this.metrics.totalRequests++

    try {
      const { response, result } = await fn()

      // Track usage
      const usage = response.usageMetadata
      if (usage) {
        const tokens = usage.totalTokenCount || 0
        this.metrics.totalTokens += tokens

        // Calculate cost (example for flash)
        const inputCost = (usage.promptTokenCount / 1_000_000) * 0.075
        const outputCost = (usage.candidatesTokenCount / 1_000_000) * 0.3
        this.metrics.totalCost += inputCost + outputCost
      }

      // Track latency
      const latency = Date.now() - startTime
      this.latencies.push(latency)
      this.metrics.averageLatency =
        this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length

      return result
    } catch (error) {
      this.metrics.errors++
      throw error
    }
  }

  getMetrics(): UsageMetrics {
    return { ...this.metrics }
  }

  reset(): void {
    this.metrics = {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      errors: 0,
      averageLatency: 0,
    }
    this.latencies = []
  }
}

// Usage
const monitor = new GeminiMonitor()

async function monitoredGeneration(prompt: string): Promise<string> {
  return monitor.trackRequest('gemini-1.5-flash', async () => {
    const result = await model.generateContent(prompt)
    return {
      response: result.response,
      result: result.response.text(),
    }
  })
}

// Log metrics periodically
setInterval(() => {
  const metrics = monitor.getMetrics()
  console.log('Gemini Metrics:', {
    requests: metrics.totalRequests,
    tokens: metrics.totalTokens,
    cost: `$${metrics.totalCost.toFixed(4)}`,
    errors: metrics.errors,
    avgLatency: `${metrics.averageLatency.toFixed(0)}ms`,
  })
}, 60000)
```

### 11. Real-World Examples

**Document Analysis & QA:**

```typescript
async function analyzeDocument(documentPath: string): Promise<{
  summary: string
  keyPoints: string[]
  entities: string[]
  qa: (question: string) => Promise<string>
}> {
  // Upload document
  const fileManager = new GoogleAIFileManager(process.env.GOOGLE_AI_API_KEY!)
  const uploadResult = await fileManager.uploadFile(documentPath, {
    mimeType: 'application/pdf',
  })

  // Create cached context for efficient Q&A
  const cacheResult = await genAI.cachedContent.create({
    model: 'gemini-1.5-pro',
    contents: [
      {
        role: 'user',
        parts: [
          {
            fileData: {
              mimeType: 'application/pdf',
              fileUri: uploadResult.file.uri,
            },
          },
        ],
      },
    ],
    ttlSeconds: 3600,
  })

  const cachedModel = genAI.getGenerativeModelFromCachedContent(cacheResult)

  // Initial analysis
  const analysisPrompt = `Analyze this document and provide:
1. A comprehensive summary
2. Key points (bullet list)
3. Important entities mentioned (people, organizations, dates)

Format as JSON`

  const analysisResult = await cachedModel.generateContent(analysisPrompt)
  const analysis = JSON.parse(analysisResult.response.text())

  // Return analysis with Q&A function
  return {
    summary: analysis.summary,
    keyPoints: analysis.keyPoints,
    entities: analysis.entities,
    qa: async (question: string) => {
      const result = await cachedModel.generateContent(question)
      return result.response.text()
    },
  }
}

// Usage
const doc = await analyzeDocument('./contract.pdf')
console.log('Summary:', doc.summary)
console.log('Key Points:', doc.keyPoints)

const answer = await doc.qa('What is the termination clause?')
console.log('Answer:', answer)
```

**Code Review & Analysis:**

```typescript
async function reviewCode(code: string, language: string): Promise<{
  issues: Array<{ severity: string; line: number; message: string }>
  suggestions: string[]
  securityConcerns: string[]
  score: number
}> {
  const prompt = `Review this ${language} code for:
1. Bugs and potential issues
2. Performance improvements
3. Security vulnerabilities
4. Best practice violations

Code:
\`\`\`${language}
${code}
\`\`\`

Return detailed analysis as JSON with:
- issues: [{severity: "high"|"medium"|"low", line: number, message: string}]
- suggestions: [string]
- securityConcerns: [string]
- score: number (0-100)`

  const jsonModel = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: { responseMimeType: 'application/json' },
  })

  const result = await jsonModel.generateContent(prompt)
  return JSON.parse(result.response.text())
}

// Usage
const review = await reviewCode(
  `
function authenticate(username, password) {
  const query = "SELECT * FROM users WHERE username='" + username + "' AND password='" + password + "'";
  const result = db.query(query);
  return result.length > 0;
}
`,
  'javascript'
)

console.log('Security Concerns:', review.securityConcerns)
console.log('Issues:', review.issues)
```

**Image-Based UI Generation:**

```typescript
async function generateUIFromScreenshot(screenshotPath: string): Promise<{
  htmlCode: string
  cssCode: string
  componentStructure: string
}> {
  const prompt = `Analyze this UI screenshot and generate:
1. Semantic HTML structure
2. CSS styling (Tailwind classes preferred)
3. Component breakdown

Return as JSON with keys: htmlCode, cssCode, componentStructure`

  const jsonModel = genAI.getGenerativeModel({
    model: 'gemini-1.5-pro',
    generationConfig: { responseMimeType: 'application/json' },
  })

  const imageData = fs.readFileSync(screenshotPath)
  const result = await jsonModel.generateContent([
    prompt,
    {
      inlineData: {
        data: imageData.toString('base64'),
        mimeType: 'image/png',
      },
    },
  ])

  return JSON.parse(result.response.text())
}

// Usage
const uiCode = await generateUIFromScreenshot('./design-mockup.png')
fs.writeFileSync('./generated.html', uiCode.htmlCode)
fs.writeFileSync('./generated.css', uiCode.cssCode)
```

## 🎓 Best Practices

### Model Selection
- Use **gemini-1.5-flash-8b** for high-volume, simple tasks (50% cheaper)
- Use **gemini-1.5-flash** for general production use (best balance)
- Use **gemini-1.5-pro** for complex reasoning, large documents (2M context)
- Use **gemini-2.0-flash-exp** for real-time multimodal experiences

### Cost Optimization
- Enable context caching for repeated large context
- Use flash models for most tasks (5-10x cheaper than GPT-4)
- Batch requests when possible
- Set appropriate maxOutputTokens limits

### Multimodal
- Compress images to reduce token usage
- Use appropriate MIME types
- For videos, wait for processing before analysis
- Combine modalities in single request for better context

### Function Calling
- Define clear, specific function descriptions
- Use JSON Schema for parameter validation
- Implement proper error handling for function execution
- Return structured data from functions

### Safety & Quality
- Configure safety settings appropriately for your use case
- Always check finishReason in responses
- Implement retry logic with exponential backoff
- Monitor token usage and costs

### Production Deployment
- Implement rate limiting (60 RPM typical)
- Use environment variables for API keys
- Add comprehensive error handling
- Monitor usage metrics and costs
- Cache responses when appropriate
- Set up proper logging and alerting

## 📊 Performance Benchmarks

- **Latency:** Flash: ~1-2s, Pro: ~2-4s (varies with content)
- **Context:** Up to 2M tokens (gemini-1.5-pro)
- **Throughput:** 60 requests/minute standard
- **Cost:** Flash: $0.075/M input, Pro: $1.25/M input

## 🔗 Resources

- [Gemini API Docs](https://ai.google.dev/docs)
- [Google AI Studio](https://aistudio.google.com/)
- [Pricing](https://ai.google.dev/pricing)
- [Safety Settings](https://ai.google.dev/docs/safety_setting_gemini)

---

**Remember:** Gemini excels at multimodal tasks, long context, and cost-effective inference. Use it for vision, document analysis, video understanding, and high-volume text generation.
