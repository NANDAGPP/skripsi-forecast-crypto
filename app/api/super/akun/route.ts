import { NextResponse, type NextRequest } from 'next/server';
import { INITIAL_ACCOUNTS, type AdminAccount } from '@/lib/api';

let accountsState: AdminAccount[] = [...INITIAL_ACCOUNTS];

/**
 * GET /api/super/akun
 * ─────────────────────────────────────────────────────────────
 * KF-19: Mengambil daftar seluruh akun administrator sistem.
 * ─────────────────────────────────────────────────────────────
 */
export async function GET() {
  return NextResponse.json({
    data: accountsState,
  });
}

/**
 * POST /api/super/akun
 * ─────────────────────────────────────────────────────────────
 * KF-19: Menambahkan akun administrator baru oleh Super Administrator.
 * 
 * Aturan proposal skripsi:
 * - Tidak ada pendaftaran mandiri (self-registration).
 * - Formulir tambah akun tidak memuat isian kata sandi. Kata sandi
 *   dibangkitkan oleh server ketika backend nanti siap.
 * ─────────────────────────────────────────────────────────────
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nama, surel } = body;

    if (!nama || !surel) {
      return NextResponse.json(
        { error: 'Nama dan surel administrator wajib diisi.' },
        { status: 400 }
      );
    }

    // Periksa duplikasi surel
    if (accountsState.some((acc) => acc.surel.toLowerCase() === surel.toLowerCase())) {
      return NextResponse.json(
        { error: 'Surel tersebut sudah terdaftar sebagai akun administrator.' },
        { status: 409 }
      );
    }

    const newId = `adm-${String(accountsState.length + 1).padStart(2, '0')}`;
    const newAccount: AdminAccount = {
      id: newId,
      nama: nama.trim(),
      surel: surel.trim(),
      aktif: true,
      dibuat: new Date().toISOString(),
      terakhir_masuk: null,
    };

    accountsState.push(newAccount);

    return NextResponse.json(
      {
        sukses: true,
        data: newAccount,
        pesan: 'Akun administrator baru berhasil dibuat. Kata sandi sementara dibangkitkan oleh server.',
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Gagal membuat akun administrator. Format data tidak sah.' },
      { status: 400 }
    );
  }
}
