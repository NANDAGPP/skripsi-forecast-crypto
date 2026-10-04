import { NextResponse, type NextRequest } from 'next/server';
import { SAMPLE_MODE } from '@/lib/api';
import { verifyToken } from '@/lib/auth/jwt';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';

/**
 * middleware.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * SATU-SATUNYA TEMPAT PENJAGA RUTE (ROUTE GUARD) SISTEM
 * 
 * Sesuai arsitektur keamanan sistem:
 * 1. Tidak boleh ada penjaga rute berbasis localStorage, cookie palsu di sisi
 *    klien, atau pengecekan tersebar di dalam komponen UI.
 * 2. Seluruh intersepsi lalu lintas rute HTML maupun panggilan API pengelolaan
 *    terpusat di sini sebelum mencapai Next.js page renderer atau route handler.
 * 
 * ATURAN AKSES (Pemisahan Kewenangan Tanpa Pewarisan Peran):
 * - 6 Halaman Pengguna publik (/, /kalkulator-risiko, /performa-model,
 *   /validasi, /cara-kerja-sistem, /persetujuan) serta /login selalu terbuka untuk publik.
 * - Halaman /admin dan endpoint /api/admin/* HANYA untuk peran ADMINISTRATOR.
 *   Super Administrator yang membuka /admin ditolak (403).
 * - Halaman /super-admin dan endpoint /api/super/* HANYA untuk peran SUPER_ADMINISTRATOR.
 *   Administrator yang membuka /super-admin ditolak (403).
 * - Pemisahan ini mutlak agar catatan jejak log tindakan (KF-21) tidak bias
 *   dan dapat dipertanggungjawabkan pada pengujian sistem.
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

  const isProtectedAdmin = pathname === '/admin' || pathname.startsWith('/admin/') || pathname.startsWith('/api/admin');
  const isProtectedSuper = pathname === '/super-admin' || pathname.startsWith('/super-admin/') || pathname.startsWith('/api/super');

  // Jika bukan rute terproteksi admin/super-admin, loloskan normal (misal 6 halaman publik pengguna)
  if (!isProtectedAdmin && !isProtectedSuper) {
    return NextResponse.next();
  }

  // 2. CABANG EKSPLISIT MODE CONTOH (SAMPLE_MODE = true):
  //    Selama SAMPLE_MODE bernilai true, seluruh proteksi rute pengelolaan dilewati
  //    secara terpusat lewat cabang eksplisit ini. Hal ini dimaksudkan untuk keperluan
  //    evaluasi akademik dan demonstrasi fungsional antarmuka tanpa mewajibkan proses
  //    masuk. Keterbukaan rute ini merupakan keputusan sadar berdasarkan konstanta
  //    SAMPLE_MODE, BUKAN akibat sampingan dari pemeriksaan otentikasi yang gagal.
  if (SAMPLE_MODE) {
    return NextResponse.next();
  }

  // 3. PRINSIP KEAMANAN: KEADAAN BAWAAN MENOLAK (DEFAULT-DENY / FAIL-CLOSED):
  //    ─────────────────────────────────────────────────────────────────────────
  //    MENGAPA KEADAAN BAWAANNYA MENOLAK?
  //    Dalam arsitektur keamanan perangkat lunak terpercaya (khususnya otentikasi
  //    dan kontrol akses berbasis peran/RBAC), prinsip kegagalan-menutup (fail-closed)
  //    dan ketiadaan kepercayaan implisit (zero-trust default-deny) adalah harga mati:
  //    - Jika aktor tidak dapat ditentukan (tidak ada token, sesi kosong, format token
  //      rusak, atau telah kedaluwarsa), sistem HARUS MENOLAK.
  //    - Jika proses pemeriksaan mengalami galat runtime (melempar galat/exception),
  //      sistem HARUS MENOLAK.
  //    - Jika peran aktor tidak cocok secara presisi dengan kewenangan rute yang
  //      diminta (tanpa pewarisan antar peran), sistem HARUS MENOLAK.
  //    - Akses HANYA dan HANYA BOLEH lolos (NextResponse.next()) apabila seluruh tahapan
  //      pemeriksaan sukses 100%, identitas aktor terverifikasi secara sah, dan perannya
  //      cocok secara eksklusif.
  //    ─────────────────────────────────────────────────────────────────────────
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return tolakAkses(request, pathname, 'Akses ditolak: Sesi otentikasi tidak ditemukan. Silakan masuk terlebih dahulu.', 401);
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.role) {
      return tolakAkses(request, pathname, 'Akses ditolak: Identitas aktor tidak dapat ditentukan atau token sesi tidak sah.', 401);
    }

    // Pengecekan kecocokan peran eksklusif tanpa pewarisan:
    if (isProtectedAdmin) {
      if (payload.role === 'ADMIN') {
        return NextResponse.next();
      }
      return tolakAkses(request, pathname, 'Akses ditolak: Rute ini khusus untuk peran ADMINISTRATOR. Peran Anda tidak memiliki wewenang.', 403);
    }

    if (isProtectedSuper) {
      if (payload.role === 'SUPER_ADMIN') {
        return NextResponse.next();
      }
      return tolakAkses(request, pathname, 'Akses ditolak: Rute ini khusus untuk peran SUPER_ADMINISTRATOR. Peran Anda tidak memiliki wewenang.', 403);
    }

    // Keadaan bawaan jika tidak memenuhi cabang mana pun: TOLAK
    return tolakAkses(request, pathname, 'Akses ditolak secara bawaan (default-deny).', 403);
  } catch {
    // Galat tak terduga selama validasi sesi wajib berakhir pada penolakan akses
    return tolakAkses(request, pathname, 'Akses ditolak: Terjadi galat saat memverifikasi identitas aktor (fail-closed).', 401);
  }
}

function tolakAkses(request: NextRequest, pathname: string, pesan: string, status: 401 | 403) {
  // Panggilan endpoint API: kembalikan respons JSON formal
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      {
        error: pesan,
        kode: status,
      },
      { status }
    );
  }

  // Akses halaman HTML peramban (/admin atau /super-admin):
  // Jika belum login (401), alihkan ke /login
  if (status === 401) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Jika hak akses tidak cocok (403 Forbidden), tampilkan halaman dokumen penolakan formal
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>403 — Akses Ditolak</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #12171c; color: #e8edf2; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; box-sizing: border-box; }
    .card { max-width: 520px; background: #1a2128; border: 1px solid #39434d; border-radius: 16px; padding: 32px; text-align: center; }
    h1 { font-size: 20px; margin: 0 0 12px; color: #e0857a; }
    p { font-size: 14px; line-height: 1.6; color: #aab6c1; margin: 0 0 20px; }
    a { display: inline-block; padding: 8px 16px; background: #27313a; color: #e8edf2; text-decoration: none; border-radius: 8px; font-size: 13px; border: 1px solid #4a5560; }
    a:hover { background: #323d47; }
  </style>
</head>
<body>
  <div class="card">
    <h1>403 — Akses Ditolak</h1>
    <p>${pesan}</p>
    <a href="/login">Kembali ke Halaman Masuk</a>
  </div>
</body>
</html>`,
    {
      status: 403,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  );
}

export const config = {
  matcher: [
    /*
     * Intersepsi seluruh rute kecuali aset statis
     */
    '/((?!_next/static|_next/image|favicon.ico|logo.png|icon.png|assets).*)',
  ],
};
