import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminPage from '@/app/admin/page';
import { INITIAL_BATCH_STATUS, INITIAL_PAIRS } from '@/lib/api';

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

describe('Blackbox: Halaman Admin (/admin) — KF-16, KF-17, KF-18', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    // Mock fetch responses
    vi.spyOn(global, 'fetch').mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.includes('/api/admin/batch/status')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => INITIAL_BATCH_STATUS,
        } as Response);
      }

      if (url.includes('/api/admin/pairs/BTCUSDT')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ sukses: true, pesan: 'Status pemantauan BTCUSDT berhasil dinonaktifkan.' }),
        } as Response);
      }

      if (url.includes('/api/admin/pairs') && init?.method === 'POST') {
        return Promise.resolve({
          ok: false,
          status: 400,
          json: async () => ({
            sukses: false,
            pesan: 'Penambahan pasangan aset baru ditolak: sistem dibatasi secara metodologis hanya pada 3 pasangan acuan (BTC, ETH, BNB).',
          }),
        } as Response);
      }

      if (url.includes('/api/admin/pairs')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ sukses: true, data: INITIAL_PAIRS }),
        } as Response);
      }

      if (url.includes('/api/admin/model/latih-ulang')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            sukses: true,
            diterima: true,
            id_proses: 'retrain-mock-12345',
            pesan: 'Permintaan pelatihan ulang model ensemble berhasil dijadwalkan.',
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

  it('TC-BB-ADM-01: Merender pita mode pengembangan, identitas aktor, dan 3 tab fungsional (KF-16, KF-17, KF-18)', async () => {
    render(<AdminPage />);

    // Pita permanen mode pengembangan
    expect(screen.getByText('MODE PENGEMBANGAN — pembatasan akses belum diterapkan')).toBeInTheDocument();

    // Tepat 3 tab navigasi tanpa tab Ringkasan
    expect(screen.queryByRole('button', { name: 'Ringkasan' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Status Batch (KF-16)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pelatihan Model (KF-17)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pasangan Aset (KF-18)' })).toBeInTheDocument();

    // Default terbuka langsung ke Status Batch (KF-16)
    await waitFor(() => {
      expect(screen.getByText('Status Proses Batch Harian')).toBeInTheDocument();
      expect(screen.getByText(/Eksekusi Batch Terakhir/i)).toBeInTheDocument();
    });
  });

  it('TC-BB-ADM-02: Memeriksa tab Status Batch (KF-16) dan menampilkan riwayat 14 hari dengan durasi lengkap', async () => {
    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText('Status Proses Batch Harian')).toBeInTheDocument();
      expect(screen.getByText('Riwayat Eksekusi 14 Hari Terakhir')).toBeInTheDocument();
      expect(screen.getByText('2026-09-27')).toBeInTheDocument();
      expect(screen.getByText('2026-09-23')).toBeInTheDocument();
      // Verifikasi durasi hari gagal dengan penulisan satuan waktu lengkap (2 menit 7 detik, 3 menit 36 detik)
      expect(screen.getByText('2 menit 7 detik')).toBeInTheDocument();
      expect(screen.getByText('3 menit 36 detik')).toBeInTheDocument();
    });
  });

  it('TC-BB-ADM-03: Membuka tab Pelatihan Model (KF-17) dan memicu pelatihan manual', async () => {
    render(<AdminPage />);

    const tabModels = screen.getByRole('button', { name: 'Pelatihan Model (KF-17)' });
    fireEvent.click(tabModels);

    await waitFor(() => {
      expect(screen.getByText('Pemicu Pelatihan Ulang Model')).toBeInTheDocument();
    });

    const triggerBtn = screen.getByRole('button', { name: 'Latih Ulang Model Sekarang' });
    fireEvent.click(triggerBtn);

    await waitFor(() => {
      expect(screen.getByText(/ID Proses: retrain-mock-12345/i)).toBeInTheDocument();
    });
  });

  it('TC-BB-ADM-04: Membuka tab Pasangan Aset (KF-18), toggle status pair, dan uji penolakan pair baru', async () => {
    render(<AdminPage />);

    const tabPairs = screen.getByRole('button', { name: 'Pasangan Aset (KF-18)' });
    fireEvent.click(tabPairs);

    await waitFor(() => {
      expect(screen.getByText('Pengelolaan Pasangan Aset Kripto')).toBeInTheDocument();
      expect(screen.getByText('BTCUSDT')).toBeInTheDocument();
      expect(screen.getByText('ETHUSDT')).toBeInTheDocument();
      expect(screen.getByText('BNBUSDT')).toBeInTheDocument();
      // Pastikan tidak ada tombol hapus sama sekali
      expect(screen.queryByRole('button', { name: 'Hapus' })).not.toBeInTheDocument();
    });

    // Uji form penambahan pasangan aset (menguji penolakan metodologis)
    const input = screen.getByPlaceholderText('Masukkan simbol pasangan aset');
    fireEvent.change(input, { target: { value: 'SOLUSDT' } });

    const testAddBtn = screen.getByRole('button', { name: 'Ajukan Penambahan' });
    fireEvent.click(testAddBtn);

    await waitFor(() => {
      expect(screen.getByText(/sistem dibatasi secara metodologis hanya pada 3 pasangan acuan/i)).toBeInTheDocument();
    });
  });
});
