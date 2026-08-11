'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'

function toSlug(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

export default function NewSpacePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function handleTitleChange(val: string) {
    setTitle(val)
    if (!slugEdited) setSlug(toSlug(val))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || submitting) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, slug, description }),
      })

      const data = await res.json() as { space?: { slug: string }; error?: string }

      if (res.ok && data.space) {
        router.push(`/spaces/${data.space.slug}`)
      } else {
        setError(data.error ?? 'Failed to create space.')
        setSubmitting(false)
      }
    } catch {
      setError('Network error.')
      setSubmitting(false)
    }
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <h2 style={{ marginBottom: '1.5rem' }}>New space</h2>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 480 }}
        >
          <div className="field">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              className="input"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Photography, Tech, Random…"
              maxLength={80}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="slug">Slug (URL)</label>
            <input
              id="slug"
              className="input input-code"
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setSlugEdited(true) }}
              placeholder="photography"
              maxLength={60}
              pattern="[a-z0-9][a-z0-9-]*[a-z0-9]"
            />
            <span className="text-xs text-dim">
              board.getnyash.com/spaces/{slug || '…'}
            </span>
          </div>

          <div className="field">
            <label htmlFor="description">Description (optional)</label>
            <textarea
              id="description"
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this space about?"
              rows={3}
              maxLength={300}
            />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!title.trim() || !slug.trim() || submitting}
            >
              {submitting ? 'Creating…' : 'Create space'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => router.back()}
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
