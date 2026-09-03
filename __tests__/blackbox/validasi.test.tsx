import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ValidasiPage from '@/app/validasi/page';

describe('Blackbox: Halaman Validasi Model (Uji Kupiec)', () => {
  it('TC-BB-VAL-01: Merender halaman validasi dengan tab aset default (BTC)', () => {
    render(<ValidasiPage />);

    expect(screen.getByText('Apakah batas kerugian yang dihitung dapat diandalkan?')).toBeInTheDocument();
    expect(screen.getByText(/Hasil uji Kupiec — BTC\/USDT/i)).toBeInTheDocument();
    expect(screen.getByText('Metode')).toBeInTheDocument();
    expect(screen.getByText('Pelanggaran')).toBeInTheDocument();
    expect(screen.getByText('Statistik uji')).toBeInTheDocument();
    expect(screen.getByText('Nilai-p')).toBeInTheDocument();
    expect(screen.getByText('Hasil')).toBeInTheDocument();
  });

  it('TC-BB-VAL-02: Berpindah antar tab aset (ETH dan BNB) memperbarui hasil uji', () => {
    render(<ValidasiPage />);

    const ethTab = screen.getByRole('button', { name: 'ETH' });
    fireEvent.click(ethTab);
    expect(screen.getByText(/Hasil uji Kupiec — ETH\/USDT/i)).toBeInTheDocument();

    const bnbTab = screen.getByRole('button', { name: 'BNB' });
    fireEvent.click(bnbTab);
    expect(screen.getByText(/Hasil uji Kupiec — BNB\/USDT/i)).toBeInTheDocument();
  });

  it('TC-BB-VAL-03: Menampilkan drawer penjelasan metodologi uji Kupiec', () => {
    render(<ValidasiPage />);

    const infoBtn = screen.getByRole('button', { name: /Apa itu uji Kupiec dan bagaimana membacanya\?/i });
    fireEvent.click(infoBtn);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Uji Kupiec (Proportion of Failures)')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /Tutup/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
