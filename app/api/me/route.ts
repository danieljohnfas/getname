import { type NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getIronSession, getSessionOptions } from '@/lib/auth/session'
import type { SessionData } from '@/lib/auth/session'



export async function GET(request: NextRequest) {
  const { env } = await getCloudflareContext()
  const session = await getIronSession<SessionData>(
    request,
    new NextResponse(),
    getSessionOptions(env.SESSION_SECRET),
  )

  if (!session.identityId) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({ authenticated: true, identityId: session.identityId })
}

