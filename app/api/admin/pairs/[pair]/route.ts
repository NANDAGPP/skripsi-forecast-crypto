import { NextResponse, type NextRequest } from 'next/server';
import { INITIAL_PAIRS } from '@/lib/api';

/**
 * PATCH /api/admin/pairs/[pair]
 * ─────────────────────────────────────────────────────────────
 * KF-18: Mengubah status pemantauan pasangan aset (nonaktifkan).
 * 
 * Aturan proposal:
 * "PATCH hanya menerima { "dipantau": false }. Tidak ada DELETE.
 *  Nonaktifkan, bukan hapus. Data historisnya tetap ada."
 * ─────────────────────────────────────────────────────────────
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ pair: string }> }
) {
  try {
    const { pair } = await context.params;
    const body = await request.json();
    const cleanPair = (pair || '').toUpperCase().replace(/[^A-Z]/g, '');

    const target = INITIAL_PAIRS.find(
      (p) => p.pair.toUpperCase().replace(/[^A-Z]/g, '') === cleanPair
    );

    if (!target) {
      return NextResponse.json(
        { error: `Pasangan aset ${pair} tidak ditemukan dalam ruang lingkup sistem.` },
        { status: 404 }
      );
    }

    if (typeof body.dipantau === 'boolean') {
      target.dipantau = body.dipantau;
    }

    return NextResponse.json({
      sukses: true,
      data: target,
      pesan: `Status pemantauan ${target.pair} berhasil diubah menjadi ${target.dipantau ? 'dipantau' : 'nonaktif'}. Data historis tetap dipertahankan.`,
    });
  } catch {
    return NextResponse.json(
      { error: 'Gagal memperbarui status pasangan aset. Format masukan tidak sah.' },
      { status: 400 }
    );
  }
}
