import { NextResponse, type NextRequest } from 'next/server';
import { SAMPLE_MODE } from '@/lib/api';

/**
 * middleware.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * SATU-SATUNYA TEMPAT PENJAGA RUTE (ROUTE GUARD) SISTEM
 * 
 * Sesuai arsitektur keamanan:
 * 1. Tidak boleh ada penjaga rute berbasis localStorage, cookie palsu di sisi
 *    klien, atau pengecekan tersebar di dalam komponen UI.
 * 2. Seluruh intersepsi lalu lintas rute HTML maupun panggilan API pengelolaan
 *    terpusat di sini sebelum mencapai Next.js page renderer atau route handler.
 * 
 * ATURAN AKSES:
 * - 6 Halaman Pengguna publik (/, /kalkulator-risiko, /performa-model,
 *   /validasi, /cara-kerja-sistem, /persetujuan) selalu terbuka untuk publik.
 * - Halaman /admin dan endpoint /api/admin/* diperuntukkan bagi Administrator
 *   dan Super Administrator.
 * - Halaman /super-admin dan endpoint /api/super/* hanya untuk Super Administrator.
 * 
 * STATUS SAAT INI (SAMPLE_MODE = true):
 * - Backend belum tersedia. Untuk keperluan evaluasi akademik dan pengujian
 *   tanpa otentikasi setengah jadi, semua rute dapat diakses langsung.
 * - Pita peringatan mode pengembangan ditampilkan di antarmuka pengelolaan.
 * 
 * KETIKA BACKEND NANTI SIAP (SAMPLE_MODE = false):
 * - Token sesi HTTP-only dari cookie akan diverifikasi ke server backend.
 * - Hash kata sandi diverifikasi di sisi server menggunakan Argon2/Bcrypt.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Abaikan file statis, aset gambar, dan aset internal framework
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname === '/favicon.ico' ||
    pathname === '/logo.png' ||
    pathname === '/icon.png'
  ) {
    return NextResponse.next();
  }

  // 2. Selama SAMPLE_MODE aktif, seluruh pembatasan akses dilewati secara terpusat.
  //    Evaluator dapat langsung menguji /admin dan /super-admin.
  if (SAMPLE_MODE) {
    return NextResponse.next();
  }

  // 3. LOGIKA KETIKA BACKEND SUDAH SIAP (SAMPLE_MODE = false):
  //    Contoh implementasi yang akan dipasang:
  //
  //    const sessionCookie = request.cookies.get('session_token')?.value;
  //    if (!sessionCookie) {
  //      if (pathname.startsWith('/api/')) {
  //        return NextResponse.json({ error: 'Sesi tidak valid atau belum masuk' }, { status: 401 });
  //      }
  //      const loginUrl = new URL('/login', request.url);
  //      loginUrl.searchParams.set('callbackUrl', pathname);
  //      return NextResponse.redirect(loginUrl);
  //    }
  //
  //    const user = await verifikasiSesiBackend(sessionCookie);
  //    if (pathname.startsWith('/super-admin') || pathname.startsWith('/api/super')) {
  //      if (user.peran !== 'SUPER_ADMINISTRATOR') {
  //        return NextResponse.json({ error: 'Akses ditolak: Memerlukan hak Super Administrator' }, { status: 403 });
  //      }
  //    } else if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
  //      if (user.peran !== 'ADMINISTRATOR' && user.peran !== 'SUPER_ADMINISTRATOR') {
  //        return NextResponse.json({ error: 'Akses ditolak: Memerlukan hak Administrator' }, { status: 403 });
  //      }
  //    }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Intersepsi seluruh rute kecuali aset statis
     */
    '/((?!_next/static|_next/image|favicon.ico|logo.png|icon.png|assets).*)',
  ],
};
