import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConsentGate from '@/components/ConsentGate';

describe('Blackbox: ConsentGate (Persetujuan Responden)', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('TC-BB-CG-01: Menampilkan halaman persetujuan dan menyembunyikan konten utama jika belum consent', () => {
    render(
      <ConsentGate>
        <div data-testid="protected-content">Konten Terlindungi</div>
      </ConsentGate>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByText('Persetujuan Responden')).toBeInTheDocument();
    expect(screen.getByText('Sebelum memulai')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Masuk ke sistem/i })).toBeInTheDocument();
  });

  it('TC-BB-CG-02: Memvalidasi error ketika form disubmit dalam keadaan kosong', () => {
    render(
      <ConsentGate>
        <div data-testid="protected-content">Konten Terlindungi</div>
      </ConsentGate>
    );

    const submitBtn = screen.getByRole('button', { name: /Masuk ke sistem/i });
    fireEvent.click(submitBtn);

    // Error messages should appear
    expect(
      screen.getByText(/Pilih salah satu pilihan di atas agar kami dapat mengelompokkan jawaban Anda/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Centang pernyataan ini untuk melanjutkan\. Kuesioner diperlukan/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Centang pernyataan ini untuk melanjutkan\. Pemahaman ini penting/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Lengkapi seluruh isian di atas sebelum melanjutkan/i)
    ).toBeInTheDocument();

    // Konten utama tetap tidak boleh muncul
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('TC-BB-CG-03: Menolak akses jika hanya mengisi pengalaman tetapi belum mencentang persetujuan', () => {
    render(
      <ConsentGate>
        <div data-testid="protected-content">Konten Terlindungi</div>
      </ConsentGate>
    );

    const select = screen.getByLabelText(/Sudah berapa lama Anda berdagang/i);
    fireEvent.change(select, { target: { value: '1-3y' } });

    const submitBtn = screen.getByRole('button', { name: /Masuk ke sistem/i });
    fireEvent.click(submitBtn);

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(
      screen.getByText(/Centang pernyataan ini untuk melanjutkan\. Kuesioner diperlukan/i)
    ).toBeInTheDocument();
  });

  it('TC-BB-CG-04: Mengizinkan akses dan menyimpan consent di sessionStorage saat semua syarat terpenuhi', () => {
    render(
      <ConsentGate>
        <div data-testid="protected-content">Konten Terlindungi</div>
      </ConsentGate>
    );

    // 1. Pilih pengalaman
    const select = screen.getByLabelText(/Sudah berapa lama Anda berdagang/i);
    fireEvent.change(select, { target: { value: '<1y' } });

    // 2. Centang persetujuan kuesioner
    const checkWilling = screen.getByLabelText(/Saya bersedia mengisi kuesioner/i);
    fireEvent.click(checkWilling);

    // 3. Centang persetujuan disclaimer
    const checkAgree = screen.getByLabelText(/Saya telah membaca pernyataan penyangkalan/i);
    fireEvent.click(checkAgree);

    // 4. Klik submit
    const submitBtn = screen.getByRole('button', { name: /Masuk ke sistem/i });
    fireEvent.click(submitBtn);

    // Konten utama harus terbuka
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(sessionStorage.getItem('ffl-consent')).toBe('yes');
  });

  it('TC-BB-CG-05: Melewati gate secara otomatis jika sudah pernah memberi consent sebelumnya', () => {
    sessionStorage.setItem('ffl-consent', 'yes');

    render(
      <ConsentGate>
        <div data-testid="protected-content">Konten Terlindungi</div>
      </ConsentGate>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByText('Persetujuan Responden')).not.toBeInTheDocument();
  });
});
