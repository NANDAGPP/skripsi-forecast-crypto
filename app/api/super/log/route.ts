import { NextResponse, type NextRequest } from 'next/server';
import { INITIAL_AUDIT_LOGS } from '@/lib/api';

/**
 * GET /api/super/log?aktor=&mulai=&selesai=&halaman=
 * ─────────────────────────────────────────────────────────────
 * KF-21: Menampilkan log tindakan administrator.
 * 
 * Aturan proposal:
 * "Tabel hanya baca. Tidak ada tombol hapus, tidak ada tombol ubah.
 *  Log yang bisa dihapus tidak ada gunanya sebagai log.
 *  Kolom: waktu, aktor, tindakan, sasaran, hasil.
 *  Sediakan penyaring berdasarkan aktor dan rentang tanggal.
 *  Tampilkan 50 baris per halaman."
 * ─────────────────────────────────────────────────────────────
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const filterAktor = searchParams.get('aktor') || '';
  const filterMulai = searchParams.get('mulai') || '';
  const filterSelesai = searchParams.get('selesai') || '';
  const halaman = Math.max(1, parseInt(searchParams.get('halaman') || '1', 10));
  const perHalaman = 50;

  let hasil = [...INITIAL_AUDIT_LOGS];

  // 1. Filter aktor
  if (filterAktor.trim()) {
    const q = filterAktor.trim().toLowerCase();
    hasil = hasil.filter((log) => log.aktor.toLowerCase().includes(q));
  }

  // 2. Filter rentang tanggal
  if (filterMulai.trim()) {
    const tMulai = new Date(filterMulai).getTime();
    if (!isNaN(tMulai)) {
      hasil = hasil.filter((log) => new Date(log.waktu).getTime() >= tMulai);
    }
  }

  if (filterSelesai.trim()) {
    const tSelesai = new Date(filterSelesai).getTime();
    if (!isNaN(tSelesai)) {
      // Sampai akhir hari yang dipilih
      hasil = hasil.filter((log) => new Date(log.waktu).getTime() <= tSelesai + 86400000);
    }
  }

  const total = hasil.length;
  const offset = (halaman - 1) * perHalaman;
  const paginatedData = hasil.slice(offset, offset + perHalaman);

  return NextResponse.json({
    total,
    halaman,
    data: paginatedData,
  });
}
