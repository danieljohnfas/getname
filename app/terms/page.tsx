import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Acceptable Use Policy',
  description:
    'Read the Anonboard Acceptable Use Policy — what content is prohibited, how to report violations, and how enforcement works on our anonymous discussion platform.',
  alternates: { canonical: '/terms' },
  robots: { index: true, follow: false },
}

export default function TermsPage() {
  return (
    <main style={{ maxWidth: 680, margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Acceptable Use Policy</h1>
      <p className="text-dim text-sm" style={{ marginBottom: '2rem' }}>
        Last updated: August 2026
      </p>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
          1. What Anonboard is
        </h2>
        <p>
          Anonboard is an anonymous discussion platform. Users are identified only by a
          randomly generated access code — no email, name, or other personal information
          is collected or stored. Your identity exists only through that code.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
          2. Prohibited content
        </h2>
        <p style={{ marginBottom: '0.75rem' }}>You may not post content that:</p>
        <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <li>Is illegal in your jurisdiction or the jurisdiction where this service operates</li>
          <li>Constitutes harassment, threats, or targeted abuse of any individual or group</li>
          <li>Contains child sexual abuse material (CSAM) — this is an absolute prohibition</li>
          <li>Facilitates or promotes violence, self-harm, or harm to others</li>
          <li>Infringes third-party intellectual property rights</li>
          <li>Is spam, unsolicited commercial promotion, or coordinated inauthentic behaviour</li>
          <li>Deliberately deceives users in ways that cause harm (phishing, scams)</li>
          <li>Deanonymises other users or discloses private information without consent</li>
        </ul>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
          3. How to report
        </h2>
        <p>
          Every post has a <strong>Report</strong> button. Use it with a brief description
          of the issue. Reports are reviewed manually. For urgent matters — especially
          anything involving illegal content — contact us directly:
        </p>
        <p style={{ marginTop: '0.75rem' }}>
          <strong>Abuse contact:</strong>{' '}
          <a href="mailto:abuse@getnyash.com">abuse@getnyash.com</a>
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
          4. Enforcement
        </h2>
        <p>
          Violations may result in your access code being banned from specific spaces or
          from the platform entirely. Because anonymity is core to the product, bans are
          scope-limited and proportional to the violation. We do not collect information
          that would identify you outside this platform.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
          5. No warranty
        </h2>
        <p>
          Anonboard is provided as-is. We make no guarantees about uptime, data
          retention, or fitness for any particular purpose. User-generated content
          reflects the views of its authors, not the platform.
        </p>
      </section>

      <hr className="divider" />
      <p className="text-sm text-dim">
        Questions?{' '}
        <a href="mailto:hello@getnyash.com">hello@getnyash.com</a>
      </p>
    </main>
  )
}
