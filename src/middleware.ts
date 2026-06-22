import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Redirect admin routes — must have admin role
    if (pathname.startsWith('/admin') && !['ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(token?.role as string)) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        // Admin login page is always accessible
        if (pathname === '/admin/login') return true
        // Admin routes require token
        if (pathname.startsWith('/admin')) return !!token
        // Protected customer routes require token
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/scan/:path*',
    '/upload/:path*',
    '/rewards/:path*',
    '/history/:path*',
    '/profile/:path*',
    '/referral/:path*',
    '/settings/:path*',
    '/order/:path*',
    '/leaderboard/:path*',
  ],
}
