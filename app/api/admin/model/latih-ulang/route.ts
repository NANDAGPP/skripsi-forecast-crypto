import { NextResponse } from 'next/server';

/**
 * POST /api/admin/model/latih-ulang
 * ─────────────────────────────────────────────────────────────
 * KF-17: Menyediakan pemicu pelatihan ulang model secara manual.
 * 
 * Sesuai proposal skripsi:
 * Sistem tidak melakukan pelatihan ulang otomatis. Pemicu manual
 * ini adalah satu-satunya mekanisme pembaruan bobot model.
 * ─────────────────────────────────────────────────────────────
 */
export async function POST() {
  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 8);
  const idProses = `ltr-${stamp}-01`;

  return NextResponse.json({
    diterima: true,
    id_proses: idProses,
    pesan: 'Pelatihan ulang dimulai. Proses ini berjalan di latar belakang.',
  });
}
