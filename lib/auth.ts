/**
 * lib/auth.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * ABSTRAKSI SENTRAL OTENTIKASI & IDENTITAS AKTOR
 * 
 * Sesuai batasan skripsi:
 * "Sediakan satu berkas lib/auth.ts berisi fungsi getAktorSaatIni() yang untuk
 *  sekarang mengembalikan aktor tiruan, dan komentar yang menyatakan bahwa
 *  pemeriksaan sesungguhnya akan dipasang di sini ketika backend siap. Satu
 *  tempat, bukan tersebar."
 * 
 * ARSITEKTUR KETIKA BACKEND SIAP:
 * 1. Penyimpanan Kredensial:
 *    - Tidak ada kata sandi yang disimpan atau diperiksa di sisi klien/frontend.
 *    - Backend mengamankan kata sandi menggunakan hash kuat di sisi server:
 *      Argon2id atau Bcrypt dengan salt unik per pengguna.
 * 2. Manajemen Sesi:
 *    - Otentikasi berbasis sesi terenkripsi / HTTP-Only Cookie yang dikirimkan
 *      langsung oleh pustaka bawaan framework (Next.js server session / backend).
 *    - Kebal dari serangan XSS karena JavaScript peramban tidak dapat membaca cookie.
 * 3. Prosedur Reset Kata Sandi:
 *    - Reset kata sandi dilakukan langsung oleh Super Administrator di /super-admin.
 *    - Tidak menggunakan jalur surel (self-contained untuk operasional tertutup).
 *    - Server membangkitkan kredensial sementara untuk diserahkan ke administrator terkait.
 * 4. Pintu Pemeriksaan:
 *    - Fungsi di berkas ini akan menjadi satu-satunya jembatan pemanggilan
 *      ke API verifikasi sesi backend (/api/auth/me) untuk menentukan identitas
 *      dan hak akses aktor yang sedang aktif.
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
 * Data aktor tiruan untuk keperluan evaluasi antarmuka dan pengujian black box
 * selama backend belum tersedia (SAMPLE_MODE = true).
 */
export const AKTOR_TIRUAN_SUPER_ADMIN: Aktor = {
  id: 'super-01',
  nama: 'Super Administrator',
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
 * Mengambil informasi aktor yang sedang aktif.
 * 
 * Saat ini (SAMPLE_MODE = true):
 * Mengembalikan aktor tiruan sesuai parameter peran yang diminta (bawaan: SUPER_ADMINISTRATOR).
 * 
 * Nanti (SAMPLE_MODE = false & Backend Siap):
 * Bagian ini akan membaca header/cookie sesi server, memverifikasi tanda tangan sesi
 * ke backend, dan mengembalikan profil pengguna yang diautentikasi secara sah.
 */
export function getAktorSaatIni(peranDiminta: PeranAktor = 'SUPER_ADMINISTRATOR'): Aktor {
  if (SAMPLE_MODE) {
    if (peranDiminta === 'ADMINISTRATOR') {
      return AKTOR_TIRUAN_ADMIN;
    }
    return AKTOR_TIRUAN_SUPER_ADMIN;
  }

  // TODO: Ketika backend siap, pasang pemanggilan sesi server riil di sini:
  // const sesi = await ambilSesiServer();
  // return sesi.pengguna;
  throw new Error('Backend otentikasi belum terhubung. Aktifkan SAMPLE_MODE untuk pengujian.');
}
