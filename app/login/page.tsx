'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
        credentials: 'include',
      })

      const data = await res.json() as { error?: string }

      if (res.ok) {
        router.push('/general')
      } else {
        // Generic error — never reveal whether code exists or format was wrong
        setError(data.error ?? 'Invalid credentials.')
        setLoading(false)
      }
    } catch {
      setError('Network error. Please check your connection.')
      setLoading(false)
    }
  }

  return (
    <main className="code-reveal-screen">
      <div style={{ maxWidth: 480, width: '100%' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome back</h1>
        <p className="text-dim mb-8">Enter your access code to continue.</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="field">
            <label htmlFor="code-input">Your access code</label>
            <input
              id="code-input"
              className="input input-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="word-word-word-word-word-00"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              disabled={loading}
            />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!code.trim() || loading}
            >
              {loading ? 'Checking…' : 'Enter Anonboard'}
            </button>
            <a href="/onboarding" className="btn btn-ghost">
              I need a new code
            </a>
          </div>
        </form>

        <p className="text-xs text-dim mt-8">
          Lost your code? There&apos;s no recovery — it&apos;s how the anonymity works.
          You can always{' '}
          <a href="/onboarding">generate a fresh code</a> to start a new identity.
        </p>
      </div>
    </main>
  )
}
