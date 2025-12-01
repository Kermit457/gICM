import { THREAD_GENERATOR_PROMPT } from '../prompts-thread'
import Anthropic from '@anthropic-ai/sdk'

// Reuse the client from content-generator (simulated reuse for this snippet)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function generateThreadFromPost(postContent: string): Promise<string[]> {
  try {
    const prompt = THREAD_GENERATOR_PROMPT.replace('{{CONTENT}}', postContent)
    
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1500,
      system: "You are a specialized social media engine.",
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    })

    if (message.content[0].type === 'text') {
      const text = message.content[0].text
      // Extract JSON array from text if it's wrapped in markdown code blocks
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      return JSON.parse(text)
    }
    return []
  } catch (error) {
    console.error('Thread generation failed:', error)
    return ["Error generating thread."]
  }
}
