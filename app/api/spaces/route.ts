import { type NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { desc, eq, sql } from 'drizzle-orm'
import { getDb } from '@/db/index'
import { spaces, memberships, posts } from '@/db/schema'
import { getIronSession, getSessionOptions } from '@/lib/auth/session'
import type { SessionData } from '@/lib/auth/session'



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

  // Auth check
  const session = await getIronSession<SessionData>(
    request,
    new NextResponse(),
    getSessionOptions(env.SESSION_SECRET),
  )
  if (!session.identityId) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
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

