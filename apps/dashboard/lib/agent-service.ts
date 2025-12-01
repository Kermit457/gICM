import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Agent, AgentMetric, ModelUpdate } from '../types/content-engine'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase: SupabaseClient | null =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null

export async function getAgents(status: 'active' | 'paused' | 'deprecated' | 'all' = 'active'): Promise<Agent[]> {
  if (!supabase) return []
  let query = supabase.from('agents').select('*')

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getAgentMetrics(agentId: string, timeframe: 'weekly' | 'monthly' = 'weekly', limit = 10): Promise<AgentMetric[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('agent_metrics')
    .select('*')
    .eq('agent_id', agentId)
    .eq('timeframe', timeframe)
    .order('end_date', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export async function getRecentModelUpdates(limit = 5): Promise<ModelUpdate[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('model_updates')
    .select('*, agents(name)')
    .order('deployed_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export async function createAgentMetric(metric: Omit<AgentMetric, 'id'>) {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.from('agent_metrics').insert(metric)
  if (error) throw error
}

export async function createModelUpdate(update: Omit<ModelUpdate, 'id'>) {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.from('model_updates').insert(update)
  if (error) throw error
}
