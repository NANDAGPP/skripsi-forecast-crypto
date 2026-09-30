import { NextResponse, type NextRequest } from 'next/server';
import { INITIAL_CONFIG, type OperationalConfig } from '@/lib/api';

let configState: OperationalConfig = { ...INITIAL_CONFIG };

/**
 * GET /api/super/konfigurasi
 * ─────────────────────────────────────────────────────────────
 * KF-20: Mengambil 4 parameter konfigurasi operasional sistem.
 * ─────────────────────────────────────────────────────────────
 */
export async function GET() {
  return NextResponse.json(configState);
}

/**
 * PUT /api/super/konfigurasi
 * ─────────────────────────────────────────────────────────────
 * KF-20: Memperbarui 4 parameter konfigurasi operasional sistem.
 * 
 * Aturan proposal:
 * "PUT menerima keempatnya sekaligus. Galat validasi datang sebagai
 *  HTTP 422 dengan pesan berbahasa Indonesia — tampilkan apa adanya."
 * 
 * Batasan:
 * 1. tingkat_kepercayaan: 90%, 95%, 99% (0.9, 0.95, 0.99)
 * 2. jendela_bobot_hari: 15 sampai 90 hari
 * 3. portofolio_ilustratif: 1.000.000 sampai 10.000.000.000
 * 4. waktu_batch: format jam dan menit (HH:mm)
 * ─────────────────────────────────────────────────────────────
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tingkat_kepercayaan, jendela_bobot_hari, portofolio_ilustratif, waktu_batch } = body;

    // 1. Validasi tingkat kepercayaan
    const validConf = [0.9, 0.95, 0.99];
    if (tingkat_kepercayaan === undefined || !validConf.includes(Number(tingkat_kepercayaan))) {
      return NextResponse.json(
        { error: 'Tingkat kepercayaan harus dipilih antara 90%, 95%, atau 99% (0.90, 0.95, 0.99).' },
        { status: 422 }
      );
    }

    // 2. Validasi panjang jendela bobot
    const jb = Number(jendela_bobot_hari);
    if (isNaN(jb) || !Number.isInteger(jb) || jb < 15 || jb > 90) {
      return NextResponse.json(
        { error: 'Panjang jendela evaluasi bobot ensemble harus berupa bilangan bulat antara 15 sampai 90 hari.' },
        { status: 422 }
      );
    }

    // 3. Validasi portofolio ilustratif
    const pi = Number(portofolio_ilustratif);
    if (isNaN(pi) || pi < 1000000 || pi > 10000000000) {
      return NextResponse.json(
        { error: 'Nilai portofolio ilustratif harus berada pada rentang Rp 1.000.000 sampai Rp 10.000.000.000.' },
        { status: 422 }
      );
    }

    // 4. Validasi waktu batch (HH:mm)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!waktu_batch || typeof waktu_batch !== 'string' || !timeRegex.test(waktu_batch.trim())) {
      return NextResponse.json(
        { error: 'Waktu pelaksanaan batch harian harus berformat jam dan menit yang sah (HH:mm), contoh: 00:05.' },
        { status: 422 }
      );
    }

    const previousConfig = { ...configState };

    configState = {
      tingkat_kepercayaan: Number(tingkat_kepercayaan),
      jendela_bobot_hari: jb,
      portofolio_ilustratif: pi,
      waktu_batch: waktu_batch.trim(),
    };

    return NextResponse.json({
      sukses: true,
      data: configState,
      konfigurasi_lama: previousConfig,
      pesan: 'Konfigurasi operasional sistem berhasil diperbarui.',
    });
  } catch {
    return NextResponse.json(
      { error: 'Gagal memproses konfigurasi. Format data JSON tidak sah.' },
      { status: 422 }
    );
  }
}
