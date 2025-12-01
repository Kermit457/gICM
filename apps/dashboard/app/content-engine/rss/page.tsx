'use client'

import { useEffect, useState } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase: SupabaseClient | null =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

export default function RSSManager() {
  const [sources, setSources] = useState<any[]>([])

  useEffect(() => {
    loadSources()
  }, [])

  async function loadSources() {
    if (!supabase) return
    const { data } = await supabase.from('rss_sources').select('*').order('name')
    setSources(data || [])
  }

  async function toggleSource(id: string, current: boolean) {
    if (!supabase) return
    await supabase.from('rss_sources').update({ enabled: !current }).eq('id', id)
    loadSources()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Knowledge Sources (RSS)</h2>
        <button 
          onClick={() => fetch('/api/rss/seed', { method: 'POST' }).then(loadSources)}
          className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800"
        >
          Reset Defaults
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Feed URL</th>
              <th className="px-6 py-4">Last Fetched</th>
              <th className="px-6 py-4 text-right">Enabled</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sources.map((source) => (
              <tr key={source.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {source.name}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                    {source.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 truncate max-w-xs font-mono text-xs">
                  {source.feed_url}
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {source.last_fetched ? new Date(source.last_fetched).toLocaleString() : 'Never'}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => toggleSource(source.id, source.enabled)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${source.enabled ? 'bg-green-600' : 'bg-gray-200'}`}
                  >
                    <span 
                      aria-hidden="true" 
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${source.enabled ? 'translate-x-5' : 'translate-x-0'}`} 
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
