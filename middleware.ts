import { type NextRequest, NextResponse } from 'next/server'

// Routes that require an authenticated session
const PROTECTED_PREFIXES = ['/general', '/spaces']

// Routes that are always public
const PUBLIC_PATHS = new Set(['/', '/onboarding', '/login', '/terms'])
const PUBLIC_API_PREFIXES = ['/api/generate-code', '/api/login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always allow public pages
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next()

  // Always allow public API routes
  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  // Allow Next.js internals and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check if this route needs auth
  const needsAuth = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  )

  if (!needsAuth) return NextResponse.next()

  // Check for session cookie presence (lightweight check — actual validation
  // happens in the route handler via iron-session)
  const sessionCookie = request.cookies.get('anonboard_session')

  if (!sessionCookie?.value) {
    const loginUrl = new URL('/', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
