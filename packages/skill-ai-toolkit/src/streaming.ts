/**
 * Streaming utilities
 * Handle SSE and streaming responses from LLMs
 */

import { z } from 'zod';

// Types
export interface StreamConfig {
  onChunk?: ChunkHandler;
  onComplete?: (result: StreamResult) => void;
  onError?: (error: Error) => void;
  signal?: AbortSignal;
}

export type ChunkHandler = (chunk: string, accumulated: string) => void;

export interface StreamResult {
  content: string;
  finishReason?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export const StreamEventSchema = z.object({
  type: z.enum(['content_block_delta', 'message_delta', 'message_stop', 'error']),
  delta: z
    .object({
      type: z.string().optional(),
      text: z.string().optional(),
    })
    .optional(),
  message: z.object({
    stop_reason: z.string().optional(),
    usage: z.object({
      input_tokens: z.number(),
      output_tokens: z.number(),
    }).optional(),
  }).optional(),
  error: z.object({
    message: z.string(),
  }).optional(),
});

export type StreamEvent = z.infer<typeof StreamEventSchema>;

/**
 * Parse SSE data line
 */
export function parseSSELine(line: string): { event?: string; data?: string } | null {
  if (!line || line.startsWith(':')) {
    return null; // Comment or empty line
  }

  if (line.startsWith('event:')) {
    return { event: line.slice(6).trim() };
  }

  if (line.startsWith('data:')) {
    const data = line.slice(5).trim();
    if (data === '[DONE]') {
      return { data: '[DONE]' };
    }
    return { data };
  }

  return null;
}

/**
 * Process a streaming response from Anthropic
 */
export async function processAnthropicStream(
  response: Response,
  config: StreamConfig = {}
): Promise<StreamResult> {
  const { onChunk, onComplete, onError, signal } = config;

  if (!response.body) {
    throw new Error('Response body is null');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let accumulated = '';
  let finishReason: string | undefined;
  let usage: { inputTokens: number; outputTokens: number } | undefined;
  let buffer = '';

  try {
    while (true) {
      if (signal?.aborted) {
        reader.cancel();
        break;
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        const parsed = parseSSELine(line);
        if (!parsed?.data || parsed.data === '[DONE]') continue;

        try {
          const event = JSON.parse(parsed.data);

          if (event.type === 'content_block_delta' && event.delta?.text) {
            accumulated += event.delta.text;
            onChunk?.(event.delta.text, accumulated);
          }

          if (event.type === 'message_delta') {
            finishReason = event.delta?.stop_reason;
            if (event.usage) {
              usage = {
                inputTokens: event.usage.input_tokens,
                outputTokens: event.usage.output_tokens,
              };
            }
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  } catch (error) {
    onError?.(error instanceof Error ? error : new Error(String(error)));
    throw error;
  }

  const result: StreamResult = {
    content: accumulated,
    finishReason,
    usage,
  };

  onComplete?.(result);
  return result;
}

/**
 * Process a streaming response from OpenAI-compatible APIs
 */
export async function processOpenAIStream(
  response: Response,
  config: StreamConfig = {}
): Promise<StreamResult> {
  const { onChunk, onComplete, onError, signal } = config;

  if (!response.body) {
    throw new Error('Response body is null');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let accumulated = '';
  let finishReason: string | undefined;
  let buffer = '';

  try {
    while (true) {
      if (signal?.aborted) {
        reader.cancel();
        break;
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const parsed = parseSSELine(line);
        if (!parsed?.data || parsed.data === '[DONE]') continue;

        try {
          const event = JSON.parse(parsed.data);
          const delta = event.choices?.[0]?.delta?.content;

          if (delta) {
            accumulated += delta;
            onChunk?.(delta, accumulated);
          }

          if (event.choices?.[0]?.finish_reason) {
            finishReason = event.choices[0].finish_reason;
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  } catch (error) {
    onError?.(error instanceof Error ? error : new Error(String(error)));
    throw error;
  }

  const result: StreamResult = {
    content: accumulated,
    finishReason,
  };

  onComplete?.(result);
  return result;
}

/**
 * Create a streaming text decoder for any SSE stream
 */
export function createStreamDecoder(onText: (text: string) => void) {
  let buffer = '';

  return {
    /**
     * Feed raw bytes to the decoder
     */
    feed(chunk: Uint8Array) {
      const decoder = new TextDecoder();
      buffer += decoder.decode(chunk, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const parsed = parseSSELine(line);
        if (parsed?.data && parsed.data !== '[DONE]') {
          try {
            const event = JSON.parse(parsed.data);
            // Try common delta locations
            const text =
              event.delta?.text ||
              event.choices?.[0]?.delta?.content ||
              event.content;

            if (text) {
              onText(text);
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    },

    /**
     * Flush remaining buffer
     */
    flush() {
      if (buffer) {
        const parsed = parseSSELine(buffer);
        if (parsed?.data && parsed.data !== '[DONE]') {
          try {
            const event = JSON.parse(parsed.data);
            const text = event.delta?.text || event.choices?.[0]?.delta?.content;
            if (text) {
              onText(text);
            }
          } catch {
            // Skip
          }
        }
        buffer = '';
      }
    },
  };
}

/**
 * Convert async iterable to readable stream
 */
export function iterableToStream(
  iterable: AsyncIterable<string>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of iterable) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}
