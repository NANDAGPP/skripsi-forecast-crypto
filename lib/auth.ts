/**
 * lib/auth.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * ABSTRAKSI SENTRAL OTENTIKASI & IDENTITAS AKTOR
 * 
 * Sesuai batasan skripsi:
 * 1. "getAktorSaatIni() tanpa argumen, dan peran aktor tiruannya dipilih lewat
 *    satu konstanta di berkas itu saja."
 * 2. Pemisahan Kewenangan (Separation of Duties), Bukan Pewarisan:
 *    - ADMINISTRATOR hanya berwenang atas operasional harian (/admin, KF-16 s.d. KF-18).
 *    - SUPER_ADMINISTRATOR hanya berwenang atas tata kelola sistem (/super-admin, KF-19 s.d. KF-21).
 *    - Tidak ada peran yang mewarisi peran lain. Super admin yang mengakses /admin
 *      akan ditolak (403), begitu juga admin yang mengakses /super-admin.
 * 
 * ARSITEKTUR KETIKA BACKEND SIAP (SAMPLE_MODE = false):
 * 1. Penyimpanan Kredensial:
 *    - Backend mengamankan kata sandi menggunakan hash kuat di sisi server (Argon2id/Bcrypt).
 *    - Frontend tidak pernah menyimpan atau memverifikasi kata sandi di sisi klien.
 * 2. Manajemen Sesi:
 *    - Menggunakan HTTP-Only Cookie yang dikelola pustaka bawaan framework/server.
 * 3. Reset Kata Sandi:
 *    - Dilakukan langsung oleh Super Administrator dari antarmuka /super-admin tanpa jalur surel.
 * 4. Pintu Pemeriksaan:
 *    - Fungsi getAktorSaatIni() di berkas ini akan menjadi satu-satunya jembatan pemanggilan
 *      ke API verifikasi sesi backend tanpa mengubah tanda tangan fungsinya.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { SAMPLE_MODE } from './api';

export type PeranAktor = 'PENGGUNA' | 'ADMINISTRATOR' | 'SUPER_ADMINISTRATOR';

export interface Aktor {
  id: string;
  nama: string;
  surel: string;
  peran: PeranAktor;
  terakhirMasuk?: string;
}

/**
 * Data aktor tiruan untuk pengujian black box selama SAMPLE_MODE = true.
 */
export const AKTOR_TIRUAN_SUPER_ADMIN: Aktor = {
  id: 'super-01',
  nama: 'Super Administrator Utama',
  surel: 'superadmin@contoh',
  peran: 'SUPER_ADMINISTRATOR',
  terakhirMasuk: '2026-09-30T06:00:00Z',
};

export const AKTOR_TIRUAN_ADMIN: Aktor = {
  id: 'adm-01',
  nama: 'Operator Harian',
  surel: 'admin@contoh',
  peran: 'ADMINISTRATOR',
  terakhirMasuk: '2026-09-29T01:12:00Z',
};

/**
 * SATU-SATUNYA KONSTANTA PENENTU AKTOR AKTIF DALAM MODE CONTOH
 * Ubah nilai ini di berkas ini saja untuk beralih konteks aktor saat pengujian.
 */
export const AKTOR_AKTIF_MODE_CONTOH: PeranAktor = 'ADMINISTRATOR';

/**
 * Mengambil informasi aktor yang sedang aktif.
 * 
 * Tanda tangan fungsi ini sengaja async dan tanpa argumen:
 * - Async: Memastikan seluruh pemanggil di sisi halaman/komponen sejak awal
 *   menggunakan 'await', sehingga saat diganti ke pemanggilan sesi riil (I/O network)
 *   tidak akan merusak atau memerlukan refactoring pada berkas pemanggil.
 * - Tanpa argumen: Identitas aktor selalu ditentukan oleh sesi (atau konstanta
 *   mode contoh), bukan ditentukan oleh pemanggil fungsi.
 */
export async function getAktorSaatIni(): Promise<Aktor> {
  if (SAMPLE_MODE) {
    if (AKTOR_AKTIF_MODE_CONTOH === 'SUPER_ADMINISTRATOR') {
      return AKTOR_TIRUAN_SUPER_ADMIN;
    }
    return AKTOR_TIRUAN_ADMIN;
  }

  // TODO: Ketika backend siap, pasang pembacaan sesi server riil di sini tanpa mengubah tanda tangan fungsi:
  // const sesi = await ambilSesiServer();
  // return sesi.pengguna;
  throw new Error('Layanan otentikasi belum tersedia: Verifikasi sesi operasional belum tersambung ke backend.');
}
