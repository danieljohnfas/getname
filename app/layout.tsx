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
  },
  twitter: {
    card: 'summary',
    title: TITLE,
    description: DESCRIPTION,
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

import { DM_Serif_Display, Inter, JetBrains_Mono } from 'next/font/google'

const dmSerifDisplay = DM_Serif_Display({
  weight: ['400'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSerifDisplay.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
