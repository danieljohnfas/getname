export const dynamic = 'force-dynamic';
export const dynamic = 'force-dynamic';
import { type NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { desc, eq, sql } from 'drizzle-orm'
import { getDb } from '@/db/index'
import { spaces, memberships } from '@/db/schema'
import { getIronSession, getSessionOptions } from '@/lib/auth/session'
import type { SessionData } from '@/lib/auth/session'
import { checkRateLimit } from '@/lib/ratelimit'

// ── Rate limit config ─────────────────────────────────────────────────────────
const SPACES_CREATE_LIMIT = { limit: 5, windowSeconds: 3600 } // 5 spaces/hour per IP

// ── GET /api/spaces — list all spaces ────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { env } = await getCloudflareContext()
  const db = getDb(env.DB)

  const allSpaces = await db
    .select({
      id: spaces.id,
      slug: spaces.slug,
      title: spaces.title,
      description: spaces.description,
      is_general: spaces.is_general,
      created_at: spaces.created_at,
      member_count: sql<number>`count(distinct ${memberships.identity_id})`,
    })
    .from(spaces)
    .leftJoin(memberships, eq(memberships.space_id, spaces.id))
    .groupBy(spaces.id)
    .orderBy(desc(spaces.created_at))

  return NextResponse.json({ spaces: allSpaces })
}

// ── POST /api/spaces — create a new space ────────────────────────────────────

export async function POST(request: NextRequest) {
  const { env } = await getCloudflareContext()
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'

  // Auth check
  const session = await getIronSession<SessionData>(
    request,
    new NextResponse(),
    getSessionOptions(env.SESSION_SECRET),
  )
  if (!session.identityId) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  // Rate limit space creation
  const rate = await checkRateLimit(
    env.RATE_LIMIT_KV,
    `spaces:${ip}`,
    SPACES_CREATE_LIMIT.limit,
    SPACES_CREATE_LIMIT.windowSeconds,
  )
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many spaces created. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rate.resetInSeconds) } },
    )
  }

  let body: { title?: string; slug?: string; description?: string } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { title, description = '' } = body
  if (!title || title.trim().length < 2) {
    return NextResponse.json({ error: 'Title must be at least 2 characters.' }, { status: 400 })
  }
  if (title.trim().length > 80) {
    return NextResponse.json({ error: 'Title must be 80 characters or fewer.' }, { status: 400 })
  }
  if (description.trim().length > 300) {
    return NextResponse.json({ error: 'Description must be 300 characters or fewer.' }, { status: 400 })
  }

  // Generate slug from title if not provided
  const slug =
    (body.slug?.trim() ||
      title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''))
      .slice(0, 60)

  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug) && slug.length > 1) {
    return NextResponse.json({ error: 'Invalid slug format.' }, { status: 400 })
  }

  const db = getDb(env.DB)

  // Check slug uniqueness
  const existing = await db
    .select({ id: spaces.id })
    .from(spaces)
    .where(eq(spaces.slug, slug))
    .limit(1)

  if (existing.length > 0) {
    return NextResponse.json({ error: 'A space with that slug already exists.' }, { status: 409 })
  }

  const [space] = await db
    .insert(spaces)
    .values({
      slug,
      title: title.trim(),
      description: description.trim(),
      is_general: false,
      creator_id: session.identityId,
    })
    .returning()

  // Auto-join as creator
  await db.insert(memberships).values({
    identity_id: session.identityId,
    space_id: space.id,
    role: 'creator',
  })

  return NextResponse.json({ space }, { status: 201 })
}
