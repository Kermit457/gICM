'use client'

import { useEffect, useState } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase: SupabaseClient | null =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

export default function AgentsManager() {
  const [agents, setAgents] = useState<any[]>([])

  useEffect(() => {
    loadAgents()
  }, [])

  async function loadAgents() {
    if (!supabase) return
    const { data } = await supabase.from('agents').select('*').order('name')
    setAgents(data || [])
  }

  async function addMockMetric(agentId: string) {
    if (!supabase) return
    // Random mock data for demo purposes
    const metric = {
      agent_id: agentId,
      timeframe: 'weekly',
      start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date().toISOString(),
      pnl_abs: (Math.random() * 1000).toFixed(2),
      pnl_percent: (Math.random() * 20).toFixed(2),
      win_rate: (40 + Math.random() * 40).toFixed(2),
      sharpe: (1 + Math.random() * 2).toFixed(2),
      max_drawdown: (Math.random() * 10).toFixed(2),
      trade_count: Math.floor(Math.random() * 50) + 10,
      fees_paid: (Math.random() * 50).toFixed(2)
    }

    const { error } = await supabase.from('agent_metrics').insert(metric)
    if (error) alert('Failed to add metric: ' + error.message)
    else alert('Mock metric added! You can now generate a weekly report.')
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Agents & Performance</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <div key={agent.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-gray-900">{agent.name}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${agent.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {agent.status}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-4 h-10 line-clamp-2">
              {agent.thesis}
            </p>

            <div className="space-y-2 text-sm text-gray-500 mb-6">
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="font-medium text-gray-900 capitalize">{agent.strategy_type}</span>
              </div>
              <div className="flex justify-between">
                <span>Version:</span>
                <span className="font-medium text-gray-900">v{agent.current_version}</span>
              </div>
              <div className="flex justify-between">
                <span>Markets:</span>
                <span className="font-medium text-gray-900">{agent.markets?.join(', ')}</span>
              </div>
            </div>

            <button 
              onClick={() => addMockMetric(agent.id)}
              className="w-full py-2 bg-slate-50 text-slate-600 font-medium rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              + Add Mock Metric
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
