'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Sidebar } from '@/components/Sidebar'

interface Space {
  id: string
  slug: string
  title: string
  description: string
  is_general: boolean
  member_count: number
  created_at: number
}

export default function SpacesPage() {
  const [spaces, setSpaces] = useState<Space[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/spaces', { credentials: 'include' })
      .then((r) => r.json())
      .then((d: { spaces?: Space[] }) => {
        setSpaces((d.spaces ?? []).filter((s) => !s.is_general))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = spaces.filter(
    (s) =>
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      s.description.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <div className="flex justify-between items-center mb-4" style={{ marginBottom: '1.5rem' }}>
          <h2>Spaces</h2>
          <Link href="/spaces/new" className="btn btn-primary btn-sm">+ New space</Link>
        </div>

        <input
          className="input"
          placeholder="Search spaces…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ marginBottom: '1.5rem' }}
        />

        {loading && <p className="text-dim text-sm">Loading…</p>}

        {!loading && filtered.length === 0 && (
          <p className="text-dim text-sm">
            {query ? 'No spaces match your search.' : 'No spaces yet. '}
            {!query && <Link href="/spaces/new">Create the first one.</Link>}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map((space) => (
            <Link
              key={space.id}
              href={`/spaces/${space.slug}`}
              className="card"
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div className="flex justify-between items-center" style={{ marginBottom: '0.25rem' }}>
                <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.95rem' }}>
                  # {space.title}
                </h3>
                <span className="text-xs text-dim">{space.member_count} members</span>
              </div>
              {space.description && (
                <p className="text-sm text-dim" style={{ maxWidth: '60ch' }}>{space.description}</p>
              )}
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
