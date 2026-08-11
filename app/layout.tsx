import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Anonboard — Anonymous Discussions',
  description:
    'Discuss anything anonymously. No email, no username — just a code that is yours alone.',
  keywords: ['anonymous', 'forum', 'discussion', 'private', 'no account'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  )
}
