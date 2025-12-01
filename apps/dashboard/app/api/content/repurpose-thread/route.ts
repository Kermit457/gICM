import { NextRequest, NextResponse } from 'next/server'
import { generateThreadFromPost } from '@/lib/thread-generator'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const { post_id } = await req.json()

    // 1. Fetch original post
    const { data: post } = await supabase
      .from('posts')
      .select('content')
      .eq('id', post_id)
      .single()
      
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // 2. Generate Thread
    const tweets = await generateThreadFromPost(post.content)

    return NextResponse.json({ success: true, thread: tweets })

  } catch (error: any) {
    console.error('Failed to repurpose thread:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
