'use client'

import { useState, useEffect, useRef } from 'react'
import { Sidebar } from '@/components/Sidebar'
import type { Post } from '@/lib/types'
import { timeAgo } from '@/lib/utils'

export default function GeneralPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [body, setBody] = useState('')
  const [replyTo, setReplyTo] = useState<Post | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [reportingId, setReportingId] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [reportError, setReportError] = useState<string | null>(null)
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const composerRef = useRef<HTMLTextAreaElement>(null)

  async function loadPosts() {
    try {
      const res = await fetch('/api/spaces/general/posts', { credentials: 'include' })
      const data = await res.json() as { posts?: Post[] }
      setPosts(data.posts ?? [])
    } catch { /* silently fail */ }
  }

  useEffect(() => { loadPosts() }, [])

  async function handlePost(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim() || submitting) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/spaces/general/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          body: body.trim(),
          parent_post_id: replyTo?.id ?? null,
        }),
      })

      const data = await res.json() as { post?: Post; error?: string }

      if (res.ok && data.post) {
        setPosts((prev) => [...prev, data.post!])
        setBody('')
        setReplyTo(null)
      } else {
        setError(data.error ?? 'Failed to post.')
      }
    } catch {
      setError('Network error.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReport(postId: string) {
    if (!reportReason.trim() || reportSubmitting) return
    setReportSubmitting(true)
    setReportError(null)

    try {
      const res = await fetch(`/api/posts/${postId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: reportReason }),
      })

      if (res.ok) {
        setReportingId(null)
        setReportReason('')
      } else {
        const data = await res.json() as { error?: string }
        setReportError(data.error ?? 'Failed to submit report.')
      }
    } catch {
      setReportError('Network error. Please try again.')
    } finally {
      setReportSubmitting(false)
    }
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <h2 style={{ marginBottom: '1.5rem' }}>General</h2>

        {/* Composer */}
        <form className="composer" onSubmit={handlePost}>
          {replyTo && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--dim)' }}>
              <span>Replying to <strong style={{ color: 'var(--signal)' }}>{replyTo.author_name}</strong></span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setReplyTo(null)}>Cancel</button>
            </div>
          )}
          <textarea
            ref={composerRef}
            className="input"
            rows={3}
            placeholder="Say something…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={submitting}
          />
          {error && <p className="error-msg">{error}</p>}
          <div>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={!body.trim() || submitting}
            >
              {submitting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </form>

        {/* Post list */}
        <div className="post-list">
          {posts.length === 0 && (
            <p className="text-dim text-sm" style={{ padding: '1rem 0' }}>
              No posts yet. Be the first to say something.
            </p>
          )}
          {posts.map((post) => (
            <article key={post.id} className="post">
              <div className="post-meta">
                <span className="post-author">{post.author_name}</span>
                <span className="post-time">{timeAgo(post.created_at)}</span>
                {post.parent_post_id && (
                  <span className="text-xs text-dim">↩ reply</span>
                )}
              </div>
              <p className="post-body">{post.body}</p>
              <div className="post-actions">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setReplyTo(post)
                    composerRef.current?.focus()
                  }}
                >
                  Reply
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setReportingId(post.id); setReportReason(''); setReportError(null) }}
                >
                  Report
                </button>
              </div>

              {reportingId === post.id && (
                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <input
                      className="input"
                      style={{ flex: 1, minWidth: 200 }}
                      placeholder="Reason for reporting…"
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      disabled={reportSubmitting}
                    />
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleReport(post.id)}
                      disabled={reportSubmitting || !reportReason.trim()}
                    >
                      {reportSubmitting ? 'Submitting…' : 'Submit report'}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setReportingId(null)}>
                      Cancel
                    </button>
                  </div>
                  {reportError && <p className="error-msg">{reportError}</p>}
                </div>
              )}
            </article>
          ))}
        </div>
      </main>
    </div>
  )
}
