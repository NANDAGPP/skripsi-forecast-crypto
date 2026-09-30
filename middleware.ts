import { NextResponse, type NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lewati file statis dan aset
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname === '/favicon.ico' ||
    pathname === '/logo.png' ||
    pathname === '/icon.png' ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next();
  }

  // Ambil dan verifikasi token session
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;

  // 1. Rute /login & /register
  if (pathname === '/login' || pathname === '/register') {
    if (session) {
      if (session.role === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/super-admin', request.url));
      }
      if (session.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // 2. Rute API Super Admin
  if (pathname.startsWith('/api/super-admin')) {
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 });
    }
    return NextResponse.next();
  }

  // 3. Rute API Admin
  if (pathname.startsWith('/api/admin')) {
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    return NextResponse.next();
  }

  // 4. Rute Halaman Super Admin (/super-admin)
  if (pathname.startsWith('/super-admin')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.role !== 'SUPER_ADMIN') {
      if (session.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin?error=unauthorized', request.url));
      }
      return NextResponse.redirect(new URL('/?error=unauthorized', request.url));
    }
    return NextResponse.next();
  }

  // 5. Rute Halaman Admin (/admin)
  if (pathname.startsWith('/admin')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.role === 'USER') {
      return NextResponse.redirect(new URL('/?error=unauthorized', request.url));
    }
    return NextResponse.next();
  }

  // 6. Rute Pengguna (Halaman User: /, /kalkulator-risiko, /performa-model, /validasi, /cara-kerja-sistem)
  const isUserPage =
    pathname === '/' ||
    pathname.startsWith('/kalkulator-risiko') ||
    pathname.startsWith('/performa-model') ||
    pathname.startsWith('/validasi') ||
    pathname.startsWith('/cara-kerja-sistem');

  if (isUserPage) {
    // Jika belum login, alihkan ke login
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Jika role ADMIN mencoba mengakses rute user, alihkan ke /admin
    if (session.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files
     */
    '/((?!_next/static|_next/image|favicon.ico|logo.png|icon.png|assets).*)',
  ],
};
