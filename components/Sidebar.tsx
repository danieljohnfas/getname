'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface Space {
  id: string
  slug: string
  title: string
  is_general: boolean
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [spaces, setSpaces] = useState<Space[]>([])

  useEffect(() => {
    fetch('/api/spaces', { credentials: 'include' })
      .then((r) => r.json())
      .then((d: { spaces?: Space[] }) => setSpaces(d.spaces ?? []))
      .catch(() => {})
  }, [])

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' })
    router.push('/')
  }

  const generalSpace = spaces.find((s) => s.is_general)
  const userSpaces = spaces.filter((s) => !s.is_general)

  return (
    <aside className="app-sidebar">
      <div className="sidebar-wordmark">Anonboard</div>

      {generalSpace && (
        <Link
          href="/general"
          className={`sidebar-link${pathname === '/general' ? ' active' : ''}`}
        >
          # General
        </Link>
      )}

      <div className="sidebar-label">Spaces</div>

      {userSpaces.map((space) => (
        <Link
          key={space.id}
          href={`/spaces/${space.slug}`}
          className={`sidebar-link${pathname === `/spaces/${space.slug}` ? ' active' : ''}`}
        >
          # {space.title}
        </Link>
      ))}

      <Link
        href="/spaces"
        className={`sidebar-link${pathname === '/spaces' ? ' active' : ''}`}
      >
        Browse spaces…
      </Link>

      <div style={{ flex: 1 }} />

      <Link
        href="/spaces/new"
        className="btn btn-ghost btn-sm"
        style={{ justifyContent: 'flex-start', marginBottom: '0.25rem' }}
      >
        + New space
      </Link>

      <button
        className="sidebar-link"
        onClick={handleLogout}
        style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--dim)' }}
      >
        Sign out
      </button>


    </aside>
  )
}
