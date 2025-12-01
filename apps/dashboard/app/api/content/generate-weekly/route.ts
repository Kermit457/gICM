import { NextResponse } from 'next/server'
import { getAgents, getAgentMetrics } from '@/lib/agent-service'
import { ContentGenerator } from '@/lib/content-generator'
import { createClient } from '@supabase/supabase-js'

const generator = new ContentGenerator()

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) return null
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function POST() {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    // 1. Fetch Data
    const agents = await getAgents('active')
    const allMetrics = []
    
    for (const agent of agents) {
      const metrics = await getAgentMetrics(agent.id, 'weekly', 1)
      if (metrics.length > 0) {
        allMetrics.push(metrics[0])
      }
    }

    if (allMetrics.length === 0) {
      return NextResponse.json({ error: 'No metrics found for active agents' }, { status: 404 })
    }

    // 2. Generate Content
    // In a real app, you might fetch market context from an external news API or store it manually
    const marketContext = "High volatility in SOL majors, memes cooling off. Funding rates neutral."
    
    const postDraft = await generator.generateWeeklyReport(agents, allMetrics, marketContext)

    // 3. Save Draft
    const { data, error } = await supabase
      .from('posts')
      .insert(postDraft)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, post: data })

  } catch (error: any) {
    console.error('Failed to generate weekly report:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
