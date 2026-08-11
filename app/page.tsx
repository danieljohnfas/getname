'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Animated code fragment for the hero — cycles through fake codes
const SAMPLE_CODES = [
  'amber-falcon-brook-marsh-quill-92',
  'cedar-viper-stone-haven-torch-14',
  'ember-crane-drift-prism-flint-07',
  'lunar-stoat-glade-north-spark-55',
]

function AnimatedCode() {
  const [displayText, setDisplayText] = useState('')
  const [codeIdx, setCodeIdx] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const target = SAMPLE_CODES[codeIdx]
    let charIdx = 0
    setDisplayText('')

    function typeNext() {
      if (charIdx <= target.length) {
        setDisplayText(target.slice(0, charIdx))
        charIdx++
        timerRef.current = setTimeout(typeNext, 45)
      } else {
        // Pause then switch to next code
        timerRef.current = setTimeout(() => {
          setCodeIdx((i) => (i + 1) % SAMPLE_CODES.length)
        }, 2200)
      }
    }

    timerRef.current = setTimeout(typeNext, 400)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [codeIdx])

  return (
    <p className="landing-code-preview" aria-hidden="true">
      {displayText}
      <span className="code-cursor" />
    </p>
  )
}

export default function LandingPage() {
  const router = useRouter()

  // If they already have a session, redirect to /general
  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then((r) => { if (r.ok) router.replace('/general') })
      .catch(() => {})
  }, [router])

  return (
    <main className="landing">
      <AnimatedCode />

      <h1>
        Your voice,<br />
        <em>no trace.</em>
      </h1>

      <p className="text-dim mt-4" style={{ maxWidth: '42ch', margin: '1rem auto 0' }}>
        Anonboard gives you a unique code instead of an account. Keep it safe — it&apos;s
        the only way back in. No email. No password. No profile.
      </p>

      <div className="landing-actions">
        <Link href="/onboarding" className="btn btn-primary">
          Get my code
        </Link>
        <Link href="/login" className="btn btn-ghost">
          I have a code
        </Link>
      </div>

      <p className="text-xs text-dim mt-8">
        By continuing you agree to the{' '}
        <Link href="/terms">Acceptable Use Policy</Link>.
      </p>
    </main>
  )
}
