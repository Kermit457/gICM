import { NextResponse } from 'next/server'
import Parser from 'rss-parser'
import { getRSSSources, createRSSItem, getRSSItemByUrl } from '@/lib/db'

const parser = new Parser()

export async function POST() {
  const sources = await getRSSSources({ enabled: true })
  const results: Record<string, number> = {}
  
  for (const source of sources) {
    try {
      const feed = await parser.parseURL(source.feed_url)
      let newItems = 0
      
      // Check if items exist
      if (feed.items && Array.isArray(feed.items)) {
        for (const item of feed.items.slice(0, 20)) { // Last 20 items
          // Skip if already ingested
          const link = item.link || item.guid
          if (!link) continue

          const existing = await getRSSItemByUrl(link)
          if (existing) continue
          
          await createRSSItem({
            source_id: source.id,
            title: item.title || '',
            url: link,
            summary: item.contentSnippet?.slice(0, 500),
            published_at: item.pubDate || new Date().toISOString(),
            processed: false
          })
          newItems++
        }
      }
      
      results[source.name] = newItems
    } catch (error) {
      console.error(`Failed to fetch ${source.name}:`, error)
      results[source.name] = -1 // Error indicator
    }
  }
  
  return NextResponse.json({ success: true, results })
}
