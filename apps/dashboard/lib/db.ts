import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Post, RSSSource, RSSItem } from '../types/content-engine'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Create a single supabase client for interacting with your database
const supabase: SupabaseClient | null =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null

export async function getPost(id: string): Promise<Post | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching post:', error)
    return null
  }
  return data
}

export async function updatePost(id: string, updates: Partial<Post>): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', id)

  if (error) {
    throw new Error(`Error updating post: ${error.message}`)
  }
}

export async function getRSSSources(filters: { enabled?: boolean } = {}): Promise<RSSSource[]> {
  if (!supabase) return []
  let query = supabase.from('rss_sources').select('*')

  if (filters.enabled !== undefined) {
    query = query.eq('enabled', filters.enabled)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching RSS sources:', error)
    return []
  }
  return data
}

export async function createRSSItem(item: Omit<RSSItem, 'id'>): Promise<RSSItem | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('rss_items')
    .insert(item)
    .select()
    .single()

  if (error) {
    console.error('Error creating RSS item:', error)
    return null
  }
  return data
}

export async function getRSSItemByUrl(url: string): Promise<RSSItem | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('rss_items')
    .select('*')
    .eq('url', url)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 is "The result contains 0 rows"
    console.error('Error fetching RSS item by URL:', error)
  }
  return data || null
}
