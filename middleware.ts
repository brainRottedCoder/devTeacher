import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth',
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/confirm',
  '/verify',
  '/leaderboard',
  '/pricing',
  '/community',
]

// API routes that don't require authentication
const publicApiRoutes = [
  '/api/auth',
  '/api/community',
  '/api/leaderboard',
  '/api/certifications',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow public routes
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    return NextResponse.next()
  }
  
  // Allow public API routes
  if (publicApiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  // For all other routes, check authentication
  try {
    const supabase = createMiddlewareClient({ req: request, res: NextResponse.next() })
    
    const { data: { session }, error } = await supabase.auth.getSession()
    
    // If no session or error, redirect to login
    if (!session || error) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    return NextResponse.next()
  } catch (error) {
    // On error, redirect to login
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     * - api/auth routes (auth endpoints)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
