import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken } from './lib/sessions';

const protectedPaths = ['/cart', '/orders', '/account'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );
  if (!isProtectedPath) return NextResponse.next();

  const session = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE_NAME)?.value
  );

  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/cart/:path*', '/orders/:path*', '/account/:path*'],
};
