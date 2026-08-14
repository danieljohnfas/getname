'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Turnstile } from '@marsidev/react-turnstile'
import type { TurnstileInstance } from '@marsidev/react-turnstile'

type Step = 'verify' | 'reveal'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('verify')
  const [code, setCode] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [displayCode, setDisplayCode] = useState('')
  const [typingDone, setTypingDone] = useState(false)
  const codeBoxRef = useRef<HTMLDivElement>(null)
  const turnstileRef = useRef<TurnstileInstance>(null)

  // Guard: track whether a generation request is already in-flight
  const generatingRef = useRef(false)

  // Turnstile verified — store token but DON'T auto-generate yet.
  // The user clicks the button to actually generate.
  function handleTurnstileSuccess(token: string) {
    setTurnstileToken(token)
    setError(null)
  }

  function handleTurnstileError() {
    setTurnstileToken(null)
    setError('Verification failed. Please refresh and try again.')
  }

  async function handleGenerate() {
    if (!turnstileToken || generatingRef.current) return
    generatingRef.current = true
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turnstileToken }),
        credentials: 'include',
      })

      const data = await res.json() as { code?: string; error?: string }

      if (!res.ok || !data.code) {
        setError(data.error ?? 'Something went wrong. Please refresh and try again.')
        setLoading(false)
        generatingRef.current = false
        setTurnstileToken(null)
        turnstileRef.current?.reset()
        return
      }

      // Start the type-in animation
      setCode(data.code)
      setStep('reveal')
      setDisplayCode('')
      setTypingDone(false)
      setLoading(false)

      let i = 0
      const id = setInterval(() => {
        i++
        setDisplayCode(data.code!.slice(0, i))
        if (i >= data.code!.length) {
          clearInterval(id)
          setTypingDone(true)
          codeBoxRef.current?.classList.add('pulse-once')
        }
      }, 40)
    } catch {
      setError('Network error. Please check your connection and try again.')
      setLoading(false)
      generatingRef.current = false
    }
  }

  async function handleConfirm() {
    if (!confirmed || !code) return
    setLoading(true)

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
        credentials: 'include',
      })

      if (res.ok) {
        router.push('/general')
      } else {
        setError('Failed to create your session. Please copy your code and log in manually.')
        setLoading(false)
      }
    } catch {
      setError('Network error. Please try logging in manually with your code.')
      setLoading(false)
    }
  }

  return (
    <main className="code-reveal-screen">
      {step === 'verify' && (
        <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>
            Get your code
          </h1>
          <p className="text-dim mb-8">
            We&apos;ll generate a unique code that is your identity on Anonboard.
            You&apos;ll need to save it — there&apos;s no recovery.
          </p>

          {/* Turnstile always visible — just verifies humanity */}
          {!loading && (
            <Turnstile
              ref={turnstileRef}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
              onSuccess={handleTurnstileSuccess}
              onError={handleTurnstileError}
              onExpire={() => { setTurnstileToken(null); turnstileRef.current?.reset() }}
              options={{ theme: 'dark' }}
            />
          )}

          {/* Generate button — only enabled once Turnstile token exists */}
          {!loading && (
            <button
              className="btn btn-primary"
              style={{ marginTop: '1.5rem' }}
              onClick={handleGenerate}
              disabled={!turnstileToken}
            >
              {turnstileToken ? 'Generate my code' : 'Complete the check above…'}
            </button>
          )}

          {loading && (
            <p className="text-dim" style={{ marginTop: '1.5rem' }}>Generating your code…</p>
          )}

          {error && <p className="error-msg mt-4">{error}</p>}
        </div>
      )}

      {step === 'reveal' && code && (
        <div style={{ maxWidth: 600, width: '100%' }}>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
            Your code
          </h1>
          <p className="text-dim mb-8">
            This is shown <strong>once</strong> and will never appear again.
            Write it down or save it in a password manager before continuing.
          </p>

          <div className="code-box" ref={codeBoxRef}>
            <p className="code-value">
              {displayCode}
              {!typingDone && <span className="code-cursor" />}
            </p>
          </div>

          {typingDone && (
            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', textAlign: 'left' }}>
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  style={{ marginTop: '0.2rem', accentColor: 'var(--signal)', width: 18, height: 18, flexShrink: 0 }}
                />
                <span className="text-sm">
                  I have saved my code somewhere safe. I understand it cannot be recovered if lost.
                </span>
              </label>

              <button
                className="btn btn-primary"
                onClick={handleConfirm}
                disabled={!confirmed || loading}
                style={{ alignSelf: 'flex-start' }}
              >
                {loading ? 'Setting up…' : 'Enter Anonboard'}
              </button>

              {error && <p className="error-msg">{error}</p>}
            </div>
          )}
        </div>
      )}
    </main>
  )
}
