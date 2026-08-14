import type { Metadata } from 'next'
import './globals.css'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://getnyash.com'

const TITLE = 'GetNyash — Private Discussions'
const DESCRIPTION =
  'Discuss anything privately. No email, no username — just a unique code that is yours alone. Join spaces, post freely, and leave no trace on GetNyash.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: '%s — GetNyash',
  },
  description: DESCRIPTION,
  keywords: [
    'getnyash',
    'nyash',
    'private discussions',
    'private forum',
    'anonymous chat',
    'secure forum',
    'no account chat',
    'private community',
    'anonymous feedback',
    'safe space',
  ],
  authors: [{ name: 'GetNyash' }],
  creator: 'GetNyash',
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
    siteName: 'GetNyash',
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary',
    title: TITLE,
    description: DESCRIPTION,
    creator: '@getnyash',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'GetNyash',
  url: SITE_URL,
  description: DESCRIPTION,
  potentialAction: {
    '@type': 'Action',
    name: 'Get private access code',
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
