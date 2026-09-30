import { NextResponse, type NextRequest } from 'next/server';
import { INITIAL_PAIRS, type MonitoredPair } from '@/lib/api';

// State tiruan dalam memori untuk sesi pengetesan
let pairsState: MonitoredPair[] = [...INITIAL_PAIRS];

/**
 * GET /api/admin/pairs
 * ─────────────────────────────────────────────────────────────
 * KF-18: Mengambil daftar pasangan aset kripto yang dipantau sistem.
 * ─────────────────────────────────────────────────────────────
 */
export async function GET() {
  return NextResponse.json({
    data: pairsState,
  });
}

/**
 * POST /api/admin/pairs
 * ─────────────────────────────────────────────────────────────
 * KF-18: Upaya penambahan pasangan aset baru.
 * 
 * Sesuai batasan masalah proposal:
 * Penelitian dibatasi ketat pada BTC/USDT, ETH/USDT, dan BNB/USDT.
 * Permintaan penambahan pair baru di luar ketiga aset ini ditolak
 * dengan pesan peringatan metodologis.
 * ─────────────────────────────────────────────────────────────
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const pairSymbol = (body.pair || '').toUpperCase().replace(/[^A-Z]/g, '');

    // Seluruh penambahan di luar 3 aset acuan ditolak sesuai batasan masalah skripsi
    return NextResponse.json(
      {
        sukses: false,
        pesan: 'Ruang lingkup penelitian dibatasi pada tiga pasangan aset. Menambah pasangan di luar itu membuat sistem tidak sesuai dengan batasan masalah.',
        pair_diajukan: pairSymbol || null,
      },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      {
        sukses: false,
        pesan: 'Format data tidak valid.',
      },
      { status: 400 }
    );
  }
}
