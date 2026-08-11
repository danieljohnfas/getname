import { type NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { eq } from 'drizzle-orm'
import { getDb } from '@/db/index'
import { posts, reports } from '@/db/schema'
import { getIronSession, getSessionOptions } from '@/lib/auth/session'
import type { SessionData } from '@/lib/auth/session'
import { checkRateLimit } from '@/lib/ratelimit'

// 10 reports per hour per IP
const REPORT_LIMIT = { limit: 10, windowSeconds: 3600 }

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { env } = await getCloudflareContext()
  const { id: postId } = await params
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'

  // Auth
  const session = await getIronSession<SessionData>(
    request,
    new NextResponse(),
    getSessionOptions(env.SESSION_SECRET),
  )
  if (!session.identityId) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  // Rate limit
  const rate = await checkRateLimit(
    env.RATE_LIMIT_KV,
    `report:${ip}`,
    REPORT_LIMIT.limit,
    REPORT_LIMIT.windowSeconds,
  )
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many reports submitted. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rate.resetInSeconds) } },
    )
  }

  const db = getDb(env.DB)

  // Confirm post exists
  const [post] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1)

  if (!post) {
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 })
  }

  let body: { reason?: string } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { reason } = body
  if (!reason || reason.trim().length < 5) {
    return NextResponse.json(
      { error: 'Please provide a reason (at least 5 characters).' },
      { status: 400 },
    )
  }
  if (reason.trim().length > 500) {
    return NextResponse.json(
      { error: 'Reason must be 500 characters or fewer.' },
      { status: 400 },
    )
  }

  // Insert — if same user already reported this post, ignore duplicate
  await db
    .insert(reports)
    .values({
      post_id: postId,
      reporter_id: session.identityId,
      reason: reason.trim(),
    })
    .onConflictDoNothing()

  return NextResponse.json({ ok: true }, { status: 201 })
}
