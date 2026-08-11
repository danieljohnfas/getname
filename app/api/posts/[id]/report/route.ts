import { type NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { eq } from 'drizzle-orm'
import { getDb } from '@/db/index'
import { posts, reports } from '@/db/schema'
import { getIronSession, getSessionOptions } from '@/lib/auth/session'
import type { SessionData } from '@/lib/auth/session'



export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { env } = await getCloudflareContext()
  const { id: postId } = await params

  // Auth
  const session = await getIronSession<SessionData>(
    request,
    new NextResponse(),
    getSessionOptions(env.SESSION_SECRET),
  )
  if (!session.identityId) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
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

  await db.insert(reports).values({
    post_id: postId,
    reporter_id: session.identityId,
    reason: reason.trim(),
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
