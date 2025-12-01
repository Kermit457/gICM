import { NextRequest, NextResponse } from 'next/server'
import { createModelUpdate } from '@/lib/agent-service'
import { ContentGenerator } from '@/lib/content-generator'
import { createClient } from '@supabase/supabase-js'

const generator = new ContentGenerator()

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) return null
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const { agent_slug, version, changes, impact } = await req.json()

    // 1. Get Agent
    const { data: agent } = await supabase
      .from('agents')
      .select('*')
      .eq('slug', agent_slug)
      .single()
      
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // 2. Create Model Update Record
    const modelUpdate = {
      agent_id: agent.id,
      version: version,
      previous_version: agent.current_version,
      deployed_at: new Date().toISOString(),
      changes_summary: changes,
      tech_details: '', // Optional in this simple API
      impact_metrics: impact // Array of { metric, before, after }
    }

    await createModelUpdate(modelUpdate)
    
    // 3. Update Agent Version
    await supabase.from('agents').update({ current_version: version }).eq('id', agent.id)

    // 4. Generate Content Draft
    const postDraft = await generator.generateModelUpdateLog(modelUpdate as any, agent.name)

    // 5. Save Draft
    const { data: post, error } = await supabase
      .from('posts')
      .insert(postDraft)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, update: modelUpdate, post: post })

  } catch (error: any) {
    console.error('Failed to log update:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
