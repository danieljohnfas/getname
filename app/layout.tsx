import type { Metadata } from 'next'
import './globals.css'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://anonboard.app'

const TITLE = 'Anonboard — Anonymous Discussions'
const DESCRIPTION =
  'Discuss anything anonymously. No email, no username — just a passphrase code that is yours alone. Join spaces, post freely, leave no trace.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: '%s — Anonboard',
  },
  description: DESCRIPTION,
  keywords: [
    'anonymous forum',
    'anonymous discussion',
    'no account chat',
    'private forum',
    'anonymous Q&A',
    'no email forum',
    'anonymous feedback',
    'privacy-first forum',
  ],
  authors: [{ name: 'Anonboard' }],
  creator: 'Anonboard',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Anonboard',
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/opengraph-image.png`,
        width: 1200,
        height: 630,
        alt: 'Anonboard — Your voice, no trace.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [`${SITE_URL}/opengraph-image.png`],
    creator: '@anonboard',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Anonboard',
  url: SITE_URL,
  description: DESCRIPTION,
  potentialAction: {
    '@type': 'Action',
    name: 'Get anonymous access code',
    target: `${SITE_URL}/onboarding`,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
