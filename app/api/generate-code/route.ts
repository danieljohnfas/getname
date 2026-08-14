export const dynamic = 'force-dynamic';
import { type NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getDb } from '@/db/index'
import { identities } from '@/db/schema'
import { generateCode, hashCode } from '@/lib/identity/generate'
import { checkRateLimit, GENERATION_LIMIT } from '@/lib/ratelimit'

export async function POST(request: NextRequest) {
  const { env } = await getCloudflareContext()
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'

  // ── Rate limiting ─────────────────────────────────────────────────────────
  const rateKey = `gen4:${ip}`
  const rate = await checkRateLimit(
    env.RATE_LIMIT_KV,
    rateKey,
    GENERATION_LIMIT.limit,
    GENERATION_LIMIT.windowSeconds,
  )

  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rate.resetInSeconds) },
      },
    )
  }

  // ── Cloudflare Turnstile verification ─────────────────────────────────────
  let body: { turnstileToken?: string } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { turnstileToken } = body

  if (!turnstileToken) {
    return NextResponse.json({ error: 'Missing verification token.' }, { status: 400 })
  }

  // IMPORTANT: Cloudflare siteverify requires application/x-www-form-urlencoded,
  // NOT application/json. Sending JSON causes silent failure (success: false).
  
  const turnstileSecret = env.TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET_KEY;
  console.log('TURNSTILE SECRET IS:', turnstileSecret ? `SET (length ${turnstileSecret.length})` : 'UNDEFINED');

  const verifyResp = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: turnstileSecret || '',
        response: turnstileToken,
      }).toString(),
    },
  )

  const verifyData = (await verifyResp.json()) as { success: boolean; 'error-codes'?: string[] }
  console.log('Turnstile response:', verifyData)
  if (!verifyData.success) {
    const codes = verifyData['error-codes'] ?? []
    const friendlyError = codes.includes('timeout-or-duplicate')
      ? 'Verification expired or was already used. Please complete the check again.'
      : codes.includes('invalid-input-response')
        ? 'Verification token was invalid. Please complete the check again.'
        : codes.includes('missing-input-response')
          ? 'Verification token was missing. Please complete the check again.'
          : codes.includes('invalid-input-secret')
            ? 'Server configuration error: Invalid Turnstile secret key.'
            : 'Verification failed. Please try again.'
    return NextResponse.json(
      { error: friendlyError },
      { status: 400 },
    )
  }

  // ── Generate code + hash + store ──────────────────────────────────────────
  // SECURITY: the plaintext code is returned ONCE to the client and never stored.
  const plainCode = generateCode()
  const serverPepper = (env.SERVER_PEPPER || process.env.SERVER_PEPPER) as string;
  const codeHash = await hashCode(plainCode, serverPepper)

  const db = getDb(env.DB)
  await db.insert(identities).values({ code_hash: codeHash })

  // Return the plaintext code — this is the only time it will ever be shown.
  return NextResponse.json({ code: plainCode }, { status: 201 })
}
