import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SuperAdminPage from '@/app/super-admin/page';
import { INITIAL_ACCOUNTS, INITIAL_CONFIG, INITIAL_AUDIT_LOGS } from '@/lib/api';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

describe('Blackbox: Halaman Super Admin (/super-admin) — KF-19, KF-20, KF-21', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(global, 'fetch').mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.includes('/api/super/akun') && init?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({
            sukses: true,
            data: {
              id: 'adm-03',
              nama: 'Operator Penguji',
              surel: 'operator3@contoh.id',
              peran: 'ADMINISTRATOR',
              aktif: true,
              dibuat: new Date().toISOString(),
              terakhir_masuk: null,
            },
            pesan: 'Akun administrator baru berhasil dibuat. Kata sandi sementara dibangkitkan oleh server.',
          }),
        } as Response);
      }

      if (url.includes('/api/super/akun')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: INITIAL_ACCOUNTS }),
        } as Response);
      }

      if (url.includes('/api/super/konfigurasi') && init?.method === 'PUT') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            sukses: true,
            data: INITIAL_CONFIG,
            pesan: 'Konfigurasi operasional sistem berhasil diperbarui.',
          }),
        } as Response);
      }

      if (url.includes('/api/super/konfigurasi')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => INITIAL_CONFIG,
        } as Response);
      }

      if (url.includes('/api/super/log')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            total: INITIAL_AUDIT_LOGS.length,
            halaman: 1,
            data: INITIAL_AUDIT_LOGS,
          }),
        } as Response);
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);
    });
  });

  it('TC-BB-SPR-01: Merender pita mode pengembangan dan 3 bagian bertumpuk (KF-19, KF-20, KF-21)', async () => {
    render(<SuperAdminPage />);

    // Pita permanen mode pengembangan
    expect(screen.getByText('MODE PENGEMBANGAN — pembatasan akses belum diterapkan')).toBeInTheDocument();

    await waitFor(() => {
      // Judul hero utama
      expect(screen.getByText('Pusat Kendali Tingkat Lanjut Sistem')).toBeInTheDocument();
      // Tiga bagian bertumpuk berada pada satu halaman
      expect(screen.getByText('Pengelolaan Akun Administrator')).toBeInTheDocument();
      expect(screen.getByText('Konfigurasi Parameter Operasional Sistem')).toBeInTheDocument();
      expect(screen.getByText('Log Tindakan Administrator (Audit Trail)')).toBeInTheDocument();
    });
  });

  it('TC-BB-SPR-02: Bagian KF-19 menampilkan akun administrator tanpa tombol hapus, dan form tambah akun tanpa kata sandi', async () => {
    render(<SuperAdminPage />);

    await waitFor(() => {
      expect(screen.getByText('adm-01')).toBeInTheDocument();
      expect(screen.getByText('adm-02')).toBeInTheDocument();
      expect(screen.getByText('super-01')).toBeInTheDocument();

      // Penegasan integritas log: tidak ada tombol hapus
      expect(screen.queryByRole('button', { name: 'Hapus' })).not.toBeInTheDocument();

      // Form tambah akun hanya ada nama dan surel (tanpa input password)
      expect(screen.getByPlaceholderText('Contoh: Operator Tiga')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('operator3@contoh.id')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/sandi/i)).not.toBeInTheDocument();
    });

    // Uji pembuatan akun
    const nameInput = screen.getByPlaceholderText('Contoh: Operator Tiga');
    const emailInput = screen.getByPlaceholderText('operator3@contoh.id');
    fireEvent.change(nameInput, { target: { value: 'Operator Penguji' } });
    fireEvent.change(emailInput, { target: { value: 'operator3@contoh.id' } });

    const createBtn = screen.getByRole('button', { name: /\+ Buat Akun Administrator/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(screen.getByText(/Akun administrator baru berhasil dibuat/i)).toBeInTheDocument();
    });
  });

  it('TC-BB-SPR-03: Bagian KF-20 menampilkan 4 parameter konfigurasi operasional dan tombol simpan', async () => {
    render(<SuperAdminPage />);

    await waitFor(() => {
      expect(screen.getByText(/1\. Tingkat kepercayaan perhitungan risiko/i)).toBeInTheDocument();
      expect(screen.getByText(/2\. Panjang Jendela Evaluasi Bobot/i)).toBeInTheDocument();
      expect(screen.getByText(/3\. Nilai portofolio ilustratif pada dasbor/i)).toBeInTheDocument();
      expect(screen.getByText(/4\. Waktu Eksekusi Batch Harian/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Simpan Perubahan Konfigurasi' })).toBeInTheDocument();
    });

    const saveBtn = screen.getByRole('button', { name: 'Simpan Perubahan Konfigurasi' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(/Konfigurasi operasional sistem berhasil diperbarui/i)).toBeInTheDocument();
    });
  });

  it('TC-BB-SPR-04: Bagian KF-21 menampilkan tabel log tindakan administrator 30 baris dengan 3 baris gagal', async () => {
    render(<SuperAdminPage />);

    await waitFor(() => {
      // Ringkasan metrik
      expect(screen.getByText('Total Tindakan Tercatat')).toBeInTheDocument();
      expect(screen.getByText('30 Baris')).toBeInTheDocument();
      expect(screen.getByText('27 Baris')).toBeInTheDocument();
      expect(screen.getByText('3 Baris')).toBeInTheDocument();

      // Log tindakan administrator yang gagal (ditolak karena proses batch harian sedang berjalan)
      expect(screen.getByText('BTC/USDT (ditolak karena proses batch harian sedang berjalan)')).toBeInTheDocument();

      // Log jendela bobot 120 hari yang ditolak (Perbaikan M)
      expect(screen.getByText('Jendela bobot 120 hari (maksimum 90 hari)')).toBeInTheDocument();

      // Log ADA/USDT yang gagal (penolakan pasangan di luar batasan)
      expect(screen.getByText('ADA/USDT')).toBeInTheDocument();
    });
  });
});
