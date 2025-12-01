export const DEFAULT_RSS_SOURCES = [
  // Solana ecosystem
  { name: 'Solana Blog', feed_url: 'https://solana.com/news/rss.xml', category: 'solana' },
  { name: 'Helius Blog', feed_url: 'https://www.helius.dev/blog/rss.xml', category: 'solana' },
  { name: 'Jupiter Aggregator', feed_url: 'https://station.jup.ag/blog/rss.xml', category: 'defi' },
  
  // Web3 infra
  { name: 'Alchemy Blog', feed_url: 'https://www.alchemy.com/blog/rss.xml', category: 'infra' },
  { name: 'QuickNode Blog', feed_url: 'https://www.quicknode.com/blog/rss.xml', category: 'infra' },
  
  // AI/Dev
  { name: 'Vercel Blog', feed_url: 'https://vercel.com/atom', category: 'infra' },
  { name: 'OpenAI Blog', feed_url: 'https://openai.com/blog/rss.xml', category: 'ai' },
  
  // Dev aggregators (filtered by tag)
  { name: 'dev.to #web3', feed_url: 'https://dev.to/feed/tag/web3', category: 'web3' },
  { name: 'dev.to #solana', feed_url: 'https://dev.to/feed/tag/solana', category: 'solana' },
]
