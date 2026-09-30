import { NextResponse } from 'next/server';
import { INITIAL_ACCOUNTS } from '@/lib/api';

/**
 * POST /api/super/akun/[id]/reset-sandi
 * ─────────────────────────────────────────────────────────────
 * KF-19: Mereset kata sandi akun administrator.
 * 
 * Sesuai aturan proposal:
 * "Reset kata sandi tidak mengirim surel. Untuk sekarang, tombolnya
 *  memanggil endpoint yang nanti mengembalikan kata sandi sementara;
 *  di mode contoh, tampilkan saja pesan bahwa fungsi ini menunggu backend."
 * ─────────────────────────────────────────────────────────────
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const account = INITIAL_ACCOUNTS.find((acc) => acc.id === id);

  if (!account) {
    return NextResponse.json(
      { error: `Akun administrator dengan ID '${id}' tidak ditemukan.` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    sukses: true,
    id_akun: id,
    pesan: `Permintaan reset kata sandi untuk ${account.nama} (${account.surel}) berhasil diproses. Pada lingkungan produksi, server membangkitkan kata sandi sementara langsung tanpa pengiriman surel. Di mode contoh, fungsi ini menunggu backend.`,
  });
}
