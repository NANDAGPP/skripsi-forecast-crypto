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
 * ATURAN AKSES (Pemisahan Kewenangan Tanpa Pewarisan Peran):
 * - 6 Halaman Pengguna publik (/, /kalkulator-risiko, /performa-model,
 *   /validasi, /cara-kerja-sistem, /persetujuan) selalu terbuka untuk publik.
 * - Halaman /admin dan endpoint /api/admin/* HANYA untuk peran ADMINISTRATOR.
 *   Super Administrator yang membuka /admin ditolak.
 * - Halaman /super-admin dan endpoint /api/super/* HANYA untuk peran SUPER_ADMINISTRATOR.
 *   Administrator yang membuka /super-admin ditolak.
 * - Pemisahan ini mutlak agar catatan jejak log tindakan (KF-21) tidak bias
 *   dan dapat dipertanggungjawabkan pada pengujian sistem.
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

  // 3. KETIKA SAMPLE_MODE = false (Prinsip Keamanan Gagal-Menutup / Fail-Closed):
  //    Jika verifikasi sesi backend belum tersambung secara riil, rute pengelolaan
  //    dan API pengelolaan WAJIB ditutup (HTTP 503 Service Unavailable).
  //    Enam halaman publik pengguna tetap lolos normal.
  const isProtectedAdmin = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  const isProtectedSuper = pathname.startsWith('/super-admin') || pathname.startsWith('/api/super');

  if (isProtectedAdmin || isProtectedSuper) {
    const pesanGalat = 'Layanan otentikasi belum tersedia: Verifikasi sesi operasional belum tersambung ke backend.';

    // Jika permintaan berupa panggilan endpoint API, kembalikan JSON 503
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          error: pesanGalat,
          kode: 503,
          bantuan: 'Aktifkan SAMPLE_MODE = true di lib/api.ts untuk mode pengujian, atau hubungkan layanan sesi backend.',
        },
        { status: 503 }
      );
    }

    // Jika permintaan berupa akses halaman HTML peramban (/admin atau /super-admin), kembalikan dokumen 503
    return new NextResponse(
      `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>503 — Layanan Otentikasi Belum Tersedia</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #12171c; color: #e8edf2; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; box-sizing: border-box; }
    .card { max-width: 520px; background: #1a2128; border: 1px solid #39434d; border-radius: 16px; padding: 32px; text-align: center; }
    h1 { font-size: 20px; margin: 0 0 12px; color: #e0857a; }
    p { font-size: 14px; line-height: 1.6; color: #aab6c1; margin: 0 0 16px; }
    .hint { font-size: 12px; color: #6b7884; font-family: monospace; }
  </style>
</head>
<body>
  <div class="card">
    <h1>503 — Layanan Otentikasi Belum Tersedia</h1>
    <p>${pesanGalat}</p>
    <div class="hint">Aktifkan SAMPLE_MODE = true pada lib/api.ts untuk melanjutkan pengujian antarmuka.</div>
  </div>
</body>
</html>`,
      {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }

  // Enam halaman pengguna publik tetap lolos seperti biasa
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
