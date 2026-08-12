import { type NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { eq } from 'drizzle-orm'
import { getDb } from '@/db/index'
import { identities } from '@/db/schema'
import { hashCode } from '@/lib/identity/generate'
import { getIronSession, getSessionOptions } from '@/lib/auth/session'
import type { SessionData } from '@/lib/auth/session'
import { checkRateLimit, LOGIN_LIMIT } from '@/lib/ratelimit'



export async function POST(request: NextRequest) {
  const { env } = await getCloudflareContext()
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'

  // ── Rate limiting ─────────────────────────────────────────────────────────
  const rate = await checkRateLimit(
    env.RATE_LIMIT_KV,
    `login:${ip}`,
    LOGIN_LIMIT.limit,
    LOGIN_LIMIT.windowSeconds,
  )

  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rate.resetInSeconds) } },
    )
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: { code?: string } = {}
  try {
    body = await request.json()
  } catch {
    // Return generic error — no info about what failed
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
  }

  const { code } = body
  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
  }

  // ── Hash + lookup ─────────────────────────────────────────────────────────
  const serverPepper = (env.SERVER_PEPPER || process.env.SERVER_PEPPER) as string;
  const codeHash = await hashCode(code, serverPepper)
  const db = getDb(env.DB)

  const [identity] = await db
    .select({ id: identities.id })
    .from(identities)
    .where(eq(identities.code_hash, codeHash))
    .limit(1)

  // Generic error — don't reveal whether the code format was wrong vs.
  // simply not found.
  if (!identity) {
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
  }

  // ── Update last_seen_at ───────────────────────────────────────────────────
  await db
    .update(identities)
    .set({ last_seen_at: Date.now() })
    .where(eq(identities.id, identity.id))

  // ── Set session cookie ────────────────────────────────────────────────────
  const response = NextResponse.json({ ok: true }, { status: 200 })
  const sessionSecret = (env.SESSION_SECRET || process.env.SESSION_SECRET) as string;
  const session = await getIronSession<SessionData>(request, response, getSessionOptions(sessionSecret))
  session.identityId = identity.id
  await session.save()

  return response
}

