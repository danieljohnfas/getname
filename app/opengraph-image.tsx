import { ImageResponse } from 'next/og'

// Next.js auto-serves this as /opengraph-image.png
export const runtime = 'edge'
export const alt = 'Anonboard — Your voice, no trace.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0E0F11',
          fontFamily: 'Georgia, serif',
          padding: '80px',
        }}
      >
        {/* Subtle grid overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle at 60% 40%, rgba(91,106,208,0.12) 0%, transparent 60%)',
          }}
        />

        {/* Wordmark */}
        <div
          style={{
            fontSize: 28,
            color: '#6B7280',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 40,
            display: 'flex',
          }}
        >
          Anonboard
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 400,
            color: '#F0EDE8',
            textAlign: 'center',
            lineHeight: 1.15,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <span>Your voice,</span>
          <span style={{ color: '#5B6AD0', fontStyle: 'italic' }}>no trace.</span>
        </div>

        {/* Sample code */}
        <div
          style={{
            marginTop: 48,
            padding: '16px 32px',
            background: '#1a1c20',
            border: '1px solid rgba(91,106,208,0.4)',
            borderRadius: 8,
            fontFamily: 'monospace',
            fontSize: 22,
            color: '#5B6AD0',
            letterSpacing: '0.04em',
            display: 'flex',
          }}
        >
          amber-falcon-brook-marsh-quill-92
        </div>

        {/* Tagline */}
        <div
          style={{
            marginTop: 40,
            fontSize: 22,
            color: '#6B7280',
            textAlign: 'center',
            maxWidth: 600,
            display: 'flex',
          }}
        >
          No email. No username. Just a code that is yours alone.
        </div>
      </div>
    ),
    { ...size },
  )
}
