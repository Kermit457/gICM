import { Post } from '@/types/content-engine'

const DEVTO_API = 'https://dev.to/api/articles'

export async function publishToDevTo(post: Post) {
  const article = {
    article: {
      title: post.title,
      body_markdown: post.content,
      published: true,
      tags: post.tags.slice(0, 4), // dev.to max 4 tags
      canonical_url: post.canonical_url,
      description: post.summary,
      main_image: post.cover_image
    }
  }
  
  // Check if already syndicated (update vs create)
  const existingId = post.syndication?.devto?.id
  
  const response = await fetch(
    existingId ? `${DEVTO_API}/${existingId}` : DEVTO_API,
    {
      method: existingId ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.DEVTO_API_KEY!
      },
      body: JSON.stringify(article)
    }
  )
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`dev.to publish failed: ${error}`)
  }
  
  const data = await response.json()
  
  return {
    id: String(data.id),
    url: data.url,
    published_at: new Date().toISOString()
  }
}
