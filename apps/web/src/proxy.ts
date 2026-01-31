import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Debug: Log all cookies
  const allCookies = request.cookies.getAll();
  console.log('Proxy: Path:', pathname, 'Cookies:', allCookies.map(c => c.name));
  
  // Check for auth session cookie (NextAuth v5 uses 'authjs.session-token')
  const sessionCookie = request.cookies.get('authjs.session-token') || 
                        request.cookies.get('__Secure-authjs.session-token');
  const isLoggedIn = !!sessionCookie?.value;
  
  console.log('Proxy: isLoggedIn:', isLoggedIn, 'Session cookie:', sessionCookie?.name);
  
  const isAuthRoute = pathname.startsWith('/login') || 
                      pathname.startsWith('/register');
  const isApiAuthRoute = pathname.startsWith('/api/auth');
  const isPublicApiRoute = pathname.startsWith('/api/health') ||
                           pathname.startsWith('/api/register') ||
                           pathname.startsWith('/api/v1/');

  // Allow API auth routes and public API routes
  if (isApiAuthRoute || isPublicApiRoute) {
    console.log('Proxy: Allowing API route');
    return NextResponse.next();
  }

  // Redirect root based on auth status
  if (pathname === '/') {
    if (isLoggedIn) {
      console.log('Proxy: Redirecting / to /dashboard');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      console.log('Proxy: Redirecting / to /login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && isLoggedIn) {
    console.log('Proxy: Auth user on auth page, redirecting to dashboard');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn && !isAuthRoute) {
    console.log('Proxy: Unauth user on protected page, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  console.log('Proxy: Proceeding to next');
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
