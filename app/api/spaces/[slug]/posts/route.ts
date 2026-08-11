import { type NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { and, asc, eq, isNull } from 'drizzle-orm'
import { getDb } from '@/db/index'
import { spaces, posts, memberships } from '@/db/schema'
import { deriveSpacePseudonym } from '@/lib/identity/generate'
import { getIronSession, getSessionOptions } from '@/lib/auth/session'
import type { SessionData } from '@/lib/auth/session'



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
    .select()
    .from(posts)
    .where(
      and(
        eq(posts.space_id, space.id),
        isNull(posts.deleted_at),
      ),
    )
    .orderBy(asc(posts.created_at))
    .limit(limit)

  // Derive per-space pseudonym for each author
  const postsWithNames = await Promise.all(
    rawPosts.map(async (post) => ({
      ...post,
      author_name: await deriveSpacePseudonym(
        post.identity_id,
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

  return NextResponse.json({ post: { ...newPost, author_name } }, { status: 201 })
}
