import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check for auth session cookie
  const sessionCookie = request.cookies.get('next-auth.session-token') || 
                        request.cookies.get('__Secure-next-auth.session-token');
  const isLoggedIn = !!sessionCookie?.value;
  
  const isAuthRoute = pathname.startsWith('/login') || 
                      pathname.startsWith('/register');
  const isApiAuthRoute = pathname.startsWith('/api/auth');
  const isPublicApiRoute = pathname.startsWith('/api/health') ||
                           pathname.startsWith('/api/register');

  // Allow API auth routes and public API routes
  if (isApiAuthRoute || isPublicApiRoute) {
    return NextResponse.next();
  }

  // Redirect root based on auth status
  if (pathname === '/') {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
