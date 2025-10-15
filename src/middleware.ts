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
      // Redirect to sign-in with return URL for better UX
      // User will be redirected back to their intended destination after signing in
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
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
