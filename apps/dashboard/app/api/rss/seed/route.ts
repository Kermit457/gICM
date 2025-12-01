import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { DEFAULT_RSS_SOURCES } from '@/lib/rss-sources'

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) return null
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function POST() {
  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const { data: existing } = await supabase.from('rss_sources').select('feed_url')
  
  const existingUrls = new Set(existing?.map(s => s.feed_url) || [])
  
  const toInsert = DEFAULT_RSS_SOURCES.filter(s => !existingUrls.has(s.feed_url)).map(s => ({
    ...s,
    enabled: true
  }))
  
  if (toInsert.length === 0) {
    return NextResponse.json({ message: 'No new sources to seed' })
  }
  
  const { data, error } = await supabase.from('rss_sources').insert(toInsert).select()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ success: true, seeded: data.length })
}
