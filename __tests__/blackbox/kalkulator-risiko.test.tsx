import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import KalkulatorRisikoPage from '@/app/kalkulator-risiko/page';

describe('Blackbox: Kalkulator Risiko Portofolio (Halaman & Fungsionalitas)', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('TC-BB-KR-01: Merender kalkulator risiko dengan nilai kepemilikan default', () => {
    render(<KalkulatorRisikoPage />);

    expect(screen.getByText('Berapa besar kerugian yang mungkin Anda tanggung?')).toBeInTheDocument();
    expect(screen.getByText('Kepemilikan Anda')).toBeInTheDocument();
    expect(screen.getByText('Hasil perhitungan risiko')).toBeInTheDocument();

    // Input fields for BTC, ETH, BNB
    const btcInput = screen.getByLabelText(/Jumlah BTC yang dimiliki/i);
    const ethInput = screen.getByLabelText(/Jumlah ETH yang dimiliki/i);
    const bnbInput = screen.getByLabelText(/Jumlah BNB yang dimiliki/i);

    expect(btcInput).toHaveValue(0.05);
    expect(ethInput).toHaveValue(0.8);
    expect(bnbInput).toHaveValue(4);

    // Kartu risiko utama harus menampilkan 3 metrik risiko
    expect(screen.getByText('Potensi kerugian maksimum')).toBeInTheDocument();
    expect(screen.getByText('Rata-rata kerugian bila melampaui batas')).toBeInTheDocument();
    expect(screen.getByText('Penurunan terdalam yang pernah terjadi')).toBeInTheDocument();
  });

  it('TC-BB-KR-02: Boundary Value Analysis - Menangani input 0 untuk semua aset tanpa error NaN', () => {
    render(<KalkulatorRisikoPage />);

    const btcInput = screen.getByLabelText(/Jumlah BTC yang dimiliki/i);
    const ethInput = screen.getByLabelText(/Jumlah ETH yang dimiliki/i);
    const bnbInput = screen.getByLabelText(/Jumlah BNB yang dimiliki/i);

    fireEvent.change(btcInput, { target: { value: '0' } });
    fireEvent.change(ethInput, { target: { value: '0' } });
    fireEvent.change(bnbInput, { target: { value: '0' } });

    // Cek pesan peringatan portofolio kosong
    expect(
      screen.getByText(/Belum ada kepemilikan yang dimasukkan, jadi seluruh angka risiko di bawah bernilai nol/i)
    ).toBeInTheDocument();

    // Total portofolio harus Rp 0
    const totals = screen.getAllByText('Rp 0');
    expect(totals.length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });

  it('TC-BB-KR-03: Equivalence Partitioning - Mengubah kuantitas aset secara dinamis mengupdate total portofolio', () => {
    render(<KalkulatorRisikoPage />);

    const btcInput = screen.getByLabelText(/Jumlah BTC yang dimiliki/i);
    // Masukkan 1 BTC (harga BTC di mock 1.752.430.000)
    fireEvent.change(btcInput, { target: { value: '1' } });

    // Verifikasi bahwa nilai baris BTC terhitung menjadi Rp 1.752.430.000
    expect(screen.getAllByText(/Rp 1[.\s]752[.\s]430[.\s]000/).length).toBeGreaterThan(0);
  });

  it('TC-BB-KR-04: Menguji interaksi Tooltip/TipDrawer penjelasan risiko', () => {
    render(<KalkulatorRisikoPage />);

    const tipButton = screen.getByLabelText(/Penjelasan Potensi kerugian maksimum/i);
    fireEvent.click(tipButton);

    // Tip drawer harus terbuka dengan status role dan penjelasan
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/Potensi kerugian maksimum \(VaR 95%\)/i)).toBeInTheDocument();

    // Tombol tutup drawer
    const closeBtn = screen.getByRole('button', { name: /Tutup/i });
    fireEvent.click(closeBtn);

    // Drawer tertutup
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('TC-BB-KR-05: Menguji ekspansi perbandingan 3 metode perhitungan VaR', () => {
    render(<KalkulatorRisikoPage />);

    const compareBtn = screen.getByRole('button', { name: /Perbandingan metode perhitungan/i });
    fireEvent.click(compareBtn);

    expect(screen.getByText('Simulasi historis dasar')).toBeInTheDocument();
    expect(screen.getByText('FHS tanpa penyesuaian rata-rata')).toBeInTheDocument();
    expect(screen.getByText('FHS dengan penyesuaian rata-rata')).toBeInTheDocument();
  });

  it('TC-BB-KR-06: Mengizinkan input dikosongkan dan menghapus angka nol di depan saat mengetik', () => {
    render(<KalkulatorRisikoPage />);

    const btcInput = screen.getByLabelText(/Jumlah BTC yang dimiliki/i) as HTMLInputElement;

    // Menghapus/mengosongkan input
    fireEvent.change(btcInput, { target: { value: '' } });
    expect(btcInput.value).toBe('');

    // Mengetik angka saat bernilai 0 (menghilangkan leading zero)
    fireEvent.change(btcInput, { target: { value: '05' } });
    expect(btcInput.value).toBe('5');

    // Mengetik desimal 0.05
    fireEvent.change(btcInput, { target: { value: '0.05' } });
    expect(btcInput.value).toBe('0.05');
  });
});
