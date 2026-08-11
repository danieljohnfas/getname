import { type NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { and, asc, eq, isNull, lt } from 'drizzle-orm'
import { getDb } from '@/db/index'
import { spaces, posts, memberships } from '@/db/schema'
import { deriveSpacePseudonym } from '@/lib/identity/generate'
import { getIronSession, getSessionOptions } from '@/lib/auth/session'
import type { SessionData } from '@/lib/auth/session'
import { checkRateLimit } from '@/lib/ratelimit'

// 60 posts per hour per IP
const POST_LIMIT = { limit: 60, windowSeconds: 3600 }

// ── GET /api/spaces/[slug]/posts ──────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { env } = await getCloudflareContext()
  const { slug } = await params

  const db = getDb(env.DB)

  // Resolve slug → space
  const [space] = await db
    .select()
    .from(spaces)
    .where(eq(spaces.slug, slug))
    .limit(1)

  if (!space) {
    return NextResponse.json({ error: 'Space not found.' }, { status: 404 })
  }

  const url = new URL(request.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50'), 100)
  const before = url.searchParams.get('before')
    ? parseInt(url.searchParams.get('before')!)
    : Date.now()

  const rawPosts = await db
    .select({
      id: posts.id,
      body: posts.body,
      created_at: posts.created_at,
      parent_post_id: posts.parent_post_id,
      space_id: posts.space_id,
      identity_id: posts.identity_id, // needed for pseudonym derivation only
    })
    .from(posts)
    .where(
      and(
        eq(posts.space_id, space.id),
        isNull(posts.deleted_at),
        lt(posts.created_at, before), // ← cursor-based pagination now actually applied
      ),
    )
    .orderBy(asc(posts.created_at))
    .limit(limit)

  // Derive per-space pseudonym and strip identity_id from response
  const postsWithNames = await Promise.all(
    rawPosts.map(async ({ identity_id, ...post }) => ({
      ...post,
      author_name: await deriveSpacePseudonym(
        identity_id,
        space.id,
        env.SERVER_PEPPER,
      ),
    })),
  )

  return NextResponse.json({ posts: postsWithNames, space })
}

// ── POST /api/spaces/[slug]/posts ─────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { env } = await getCloudflareContext()
  const { slug } = await params
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'

  // Auth
  const response = new NextResponse()
  const session = await getIronSession<SessionData>(
    request,
    response,
    getSessionOptions(env.SESSION_SECRET),
  )
  if (!session.identityId) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  // Rate limit post creation
  const rate = await checkRateLimit(
    env.RATE_LIMIT_KV,
    `post:${ip}`,
    POST_LIMIT.limit,
    POST_LIMIT.windowSeconds,
  )
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many posts. Please slow down.' },
      { status: 429, headers: { 'Retry-After': String(rate.resetInSeconds) } },
    )
  }

  const db = getDb(env.DB)

  const [space] = await db
    .select()
    .from(spaces)
    .where(eq(spaces.slug, slug))
    .limit(1)

  if (!space) {
    return NextResponse.json({ error: 'Space not found.' }, { status: 404 })
  }

  let body: { body?: string; parent_post_id?: string } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { body: postBody, parent_post_id } = body

  if (!postBody || postBody.trim().length === 0) {
    return NextResponse.json({ error: 'Post body cannot be empty.' }, { status: 400 })
  }

  if (postBody.trim().length > 10000) {
    return NextResponse.json({ error: 'Post is too long (max 10,000 characters).' }, { status: 400 })
  }

  // Validate parent post exists in same space (if replying)
  if (parent_post_id) {
    const [parent] = await db
      .select({ id: posts.id })
      .from(posts)
      .where(
        and(eq(posts.id, parent_post_id), eq(posts.space_id, space.id), isNull(posts.deleted_at)),
      )
      .limit(1)

    if (!parent) {
      return NextResponse.json({ error: 'Parent post not found.' }, { status: 404 })
    }
  }

  const [newPost] = await db
    .insert(posts)
    .values({
      space_id: space.id,
      identity_id: session.identityId,
      parent_post_id: parent_post_id ?? null,
      body: postBody.trim(),
    })
    .returning()

  // Auto-join space if not already a member
  await db
    .insert(memberships)
    .values({
      identity_id: session.identityId,
      space_id: space.id,
      role: 'member',
    })
    .onConflictDoNothing()

  const author_name = await deriveSpacePseudonym(
    session.identityId,
    space.id,
    env.SERVER_PEPPER,
  )

  // Strip identity_id from response — clients should never see raw identity IDs
  const { identity_id: _omit, ...postForClient } = newPost

  return NextResponse.json({ post: { ...postForClient, author_name } }, { status: 201 })
}
