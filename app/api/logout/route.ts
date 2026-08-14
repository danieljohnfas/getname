export const dynamic = 'force-dynamic';
export const dynamic = 'force-dynamic';
import { type NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getIronSession, getSessionOptions } from '@/lib/auth/session'
import type { SessionData } from '@/lib/auth/session'



export async function POST(request: NextRequest) {
  const { env } = await getCloudflareContext()
  const response = NextResponse.json({ ok: true })
  const session = await getIronSession<SessionData>(request, response, getSessionOptions(env.SESSION_SECRET))
  session.destroy()
  await session.save()
  return response
}

