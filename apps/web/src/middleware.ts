import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * [PHASE 11] Bulletproof Security Middleware
 * Purpose: Prevent ANY unauthenticated access to protected dashboard/admin routes.
 * Scope: All routes except public assets, login, and registration.
 */
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Define Public Routes
    const isPublicRoute =
        pathname === '/' ||
        pathname.startsWith('/auth') ||
        pathname.startsWith('/api') || // Backend handles its own auth
        pathname.startsWith('/_next') ||
        pathname.includes('.') || // Static assets
        pathname === '/favicon.ico';

    if (isPublicRoute) {
        return NextResponse.next();
    }

    // 2. Check for Session Cookie
    // Cookie name matches server.ts session config: 'wop_sid'
    const session = request.cookies.get('wop_sid');

    if (!session) {
        // [HARD REDIRECT] No session = Login Required
        const loginUrl = new URL('/auth/login', request.url);
        // Preserve the attempted destination if needed (optional)
        // loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
