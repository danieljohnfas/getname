import type { SessionOptions } from 'iron-session'

export interface SessionData {
  identityId: string
}

export function getSessionOptions(secret: string): SessionOptions {
  return {
    password: secret,
    cookieName: 'anonboard_session',
    cookieOptions: {
      // Always secure — process.env.NODE_ENV is unreliable in Cloudflare Workers runtime
      secure: true,
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    },
  }
}

// Re-export for convenience in route handlers
export { getIronSession } from 'iron-session'
