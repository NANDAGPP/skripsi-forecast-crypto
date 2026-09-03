import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PerformaModelPage from '@/app/performa-model/page';

describe('Blackbox: Halaman Performa Model', () => {
  it('TC-BB-PRF-01: Merender halaman performa model dengan tabel perbandingan model', () => {
    render(<PerformaModelPage />);

    expect(screen.getByText('Seberapa sering model ini benar?')).toBeInTheDocument();
    expect(screen.getByText(/Perbandingan enam pendekatan — BTC\/USDT/i)).toBeInTheDocument();
    expect(screen.getByText('Pendekatan')).toBeInTheDocument();
    expect(screen.getAllByText('MAPE').length).toBeGreaterThan(0);
    expect(screen.getAllByText('MAE').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Arah benar').length).toBeGreaterThan(0);
    expect(screen.getAllByText('RMSE').length).toBeGreaterThan(0);
  });

  it('TC-BB-PRF-02: Berpindah rentang waktu grafik prediksi vs aktual', () => {
    render(<PerformaModelPage />);

    const r180 = screen.getByRole('button', { name: '180 hari' });
    fireEvent.click(r180);

    const r90 = screen.getByRole('button', { name: '90 hari' });
    fireEvent.click(r90);
    expect(r90).toBeInTheDocument();
  });

  it('TC-BB-PRF-03: Menampilkan TipDrawer untuk definisi metrik evaluasi (MAPE)', () => {
    render(<PerformaModelPage />);

    const mapeBtn = screen.getByRole('button', { name: 'Penjelasan MAPE' });
    fireEvent.click(mapeBtn);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Rata-rata kesalahan (MAPE)')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /Tutup/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
