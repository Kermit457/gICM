'use client'

import { useEffect, useState } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { format } from 'date-fns'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase: SupabaseClient | null =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

export default function PostsManager() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [threadPreview, setThreadPreview] = useState<string[] | null>(null)

  useEffect(() => {
    loadPosts()
  }, [])

  async function loadPosts() {
    if (!supabase) {
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })

    setPosts(data || [])
    setLoading(false)
  }

  async function publishPost(id: string) {
    if (!supabase) return
    // 1. Update DB status
    const { error } = await supabase
      .from('posts')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      alert('Failed to update status')
      return
    }

    // 2. Trigger Syndication API
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        body: JSON.stringify({ post_id: id, platforms: ['devto', 'hashnode'] }) // Default to both
      })
      const result = await res.json()
      console.log('Syndication result:', result)
      alert('Published & Syndicated!')
    } catch (e) {
      alert('Published locally, but syndication API failed.')
    }

    loadPosts()
  }

  async function generateThread(id: string) {
    const res = await fetch('/api/content/repurpose-thread', {
      method: 'POST',
      body: JSON.stringify({ post_id: id })
    })
    const data = await res.json()
    if (data.thread) {
      setThreadPreview(data.thread)
    } else {
      alert('Failed to generate thread')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Content Management</h2>
        <button 
          onClick={() => loadPosts()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {threadPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Generated Thread</h3>
            <div className="space-y-4">
              {threadPreview.map((tweet, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm">
                  <span className="text-xs text-slate-400 font-mono mb-1 block">Tweet {i+1}</span>
                  {tweet}
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setThreadPreview(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(threadPreview.join('\n\n---\n\n'))
                  alert('Copied to clipboard!')
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Copy All
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Created</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900 max-w-md truncate">
                  {post.title}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {post.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={post.status} />
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {format(new Date(post.created_at), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button 
                    onClick={() => generateThread(post.id)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Thread
                  </button>
                  {post.status !== 'published' && (
                    <button 
                      onClick={() => publishPost(post.id)}
                      className="text-green-600 hover:text-green-800 font-medium"
                    >
                      Publish
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    draft: 'bg-yellow-100 text-yellow-800',
    review: 'bg-purple-100 text-purple-800',
    published: 'bg-green-100 text-green-800',
    archived: 'bg-gray-100 text-gray-800'
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] || styles.draft}`}>
      {status}
    </span>
  )
}
