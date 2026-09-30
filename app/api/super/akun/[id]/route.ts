import { NextResponse, type NextRequest } from 'next/server';
import { INITIAL_ACCOUNTS } from '@/lib/api';

/**
 * PATCH /api/super/akun/[id]
 * ─────────────────────────────────────────────────────────────
 * KF-19: Mengubah data akun administrator (nama, surel, atau status aktif).
 * 
 * Sesuai aturan proposal:
 * "Tindakan yang tersedia: tambah akun, ubah nama dan surel,
 *  nonaktifkan, reset kata sandi. Nonaktifkan, tidak menghapus.
 *  Akun yang dihapus memutus jejak di log tindakan."
 * ─────────────────────────────────────────────────────────────
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const account = INITIAL_ACCOUNTS.find((acc) => acc.id === id);
    if (!account) {
      return NextResponse.json(
        { error: `Akun administrator dengan ID '${id}' tidak ditemukan.` },
        { status: 404 }
      );
    }

    if (body.nama !== undefined) account.nama = String(body.nama).trim();
    if (body.surel !== undefined) account.surel = String(body.surel).trim();
    if (typeof body.aktif === 'boolean') account.aktif = body.aktif;

    return NextResponse.json({
      sukses: true,
      data: account,
      pesan: `Data akun ${account.nama} (${account.id}) berhasil diperbarui.`,
    });
  } catch {
    return NextResponse.json(
      { error: 'Gagal memperbarui akun administrator. Format data tidak sah.' },
      { status: 400 }
    );
  }
}
