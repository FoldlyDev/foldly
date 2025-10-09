import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/onboarding(.*)',
  '/api/protected(.*)',
]);

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/unauthorized',
  '/(.*)', // This makes ALL routes public by default, including [...slug]
]);

export default clerkMiddleware(async (auth, req) => {
  // Only check auth for explicitly protected routes
  if (isProtectedRoute(req)) {
    const { userId } = await auth();

    if (!userId) {
      // Redirect to unauthorized page instead of sign-in
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
  }
  // All other routes are public by default
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    // Explicitly include important routes
    '/',
    '/_not-found',
    '/not-found',
    '/unauthorized',
    '/dashboard/:path*',
    '/sign-in/:path*',
    '/sign-up/:path*',
  ],
};
