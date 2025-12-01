'use client'

import { useEffect, useState } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { FileText, Bot, Rss, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase: SupabaseClient | null =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

export default function ContentEngineDashboard() {
  const [stats, setStats] = useState({
    posts: 0,
    agents: 0,
    rss: 0,
    pendingDrafts: 0
  })

  useEffect(() => {
    async function loadStats() {
      if (!supabase) return
      const { count: posts } = await supabase.from('posts').select('*', { count: 'exact', head: true })
      const { count: pending } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'draft')
      const { count: agents } = await supabase.from('agents').select('*', { count: 'exact', head: true })
      const { count: rss } = await supabase.from('rss_sources').select('*', { count: 'exact', head: true })

      setStats({
        posts: posts || 0,
        pendingDrafts: pending || 0,
        agents: agents || 0,
        rss: rss || 0
      })
    }
    loadStats()
  }, [])

  return (
    <div className="space-y-8 p-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Content Engine</h2>
        <p className="text-gray-500 mt-2">Autonomous content generation and agent tracking.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Content Pipeline" 
          value={stats.posts} 
          subValue={`${stats.pendingDrafts} drafts pending`}
          icon={<FileText className="text-blue-500" />}
          href="/content-engine/posts"
        />
        <StatCard 
          title="Active Agents" 
          value={stats.agents} 
          subValue="Tracking live performance"
          icon={<Bot className="text-purple-500" />}
          href="/content-engine/agents"
        />
        <StatCard 
          title="Knowledge Sources" 
          value={stats.rss} 
          subValue="RSS feeds monitored"
          icon={<Rss className="text-orange-500" />}
          href="/content-engine/rss"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <ActionButton 
              label="Generate Weekly Report" 
              desc="Manually trigger the agent performance summary"
              onClick={() => fetch('/api/content/generate-weekly', { method: 'POST' })}
            />
            <ActionButton 
              label="Run RSS Ingest" 
              desc="Fetch latest news from configured sources"
              onClick={() => fetch('/api/rss/ingest', { method: 'POST' })}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-4 text-sm">
            <StatusRow label="Database" status="Connected" color="bg-green-500" />
            <StatusRow label="LLM Engine (Anthropic)" status="Ready" color="bg-green-500" />
            <StatusRow label="Syndication (Dev.to)" status="Checking..." color="bg-yellow-500" />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, subValue, icon, href }: any) {
  return (
    <Link href={href} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-2">{value}</h3>
          <p className="text-sm text-gray-500 mt-1">{subValue}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">{icon}</div>
      </div>
    </Link>
  )
}

function ActionButton({ label, desc, onClick }: any) {
  const [loading, setLoading] = useState(false)
  
  const handleClick = async () => {
    setLoading(true)
    try {
      await onClick()
      alert('Action triggered successfully')
    } catch (e) {
      alert('Action failed')
    }
    setLoading(false)
  }

  return (
    <button 
      onClick={handleClick}
      disabled={loading}
      className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
    >
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
      {loading ? (
        <span className="text-sm text-gray-400">Running...</span>
      ) : (
        <ArrowUpRight size={18} className="text-gray-400" />
      )}
    </button>
  )
}

function StatusRow({ label, status, color }: any) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${color}`} />
        <span className="font-medium text-gray-900">{status}</span>
      </div>
    </div>
  )
}
