import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import NavBar from '@/components/NavBar';

describe('Blackbox: Navigasi Utama (NavBar)', () => {
  it('TC-BB-NAV-01: Merender varian dasbor dengan seluruh tautan menu utama', () => {
    render(<NavBar variant="dashboard" stamp="24 Okt 2024" />);

    // Link navigasi modul
    const kalkulatorLink = screen.getByRole('link', { name: 'Kalkulator risiko' });
    const performaLink = screen.getByRole('link', { name: 'Performa model' });
    const validasiLink = screen.getByRole('link', { name: 'Validasi' });
    const caraKerjaLink = screen.getByRole('link', { name: 'Cara kerja sistem' });

    expect(kalkulatorLink).toHaveAttribute('href', '/kalkulator-risiko');
    expect(performaLink).toHaveAttribute('href', '/performa-model');
    expect(validasiLink).toHaveAttribute('href', '/validasi');
    expect(caraKerjaLink).toHaveAttribute('href', '/cara-kerja-sistem');

    // Data per stamp
    expect(screen.getByText('Data per 24 Okt 2024')).toBeInTheDocument();
  });

  it('TC-BB-NAV-02: Merender varian sub-halaman dengan tautan kembali ke dasbor', () => {
    render(<NavBar variant="sub" subtitle="Performa model" />);

    expect(screen.getByText('Performa model')).toBeInTheDocument();
    const backLink = screen.getByRole('link', { name: /Kembali ke dasbor/i });
    expect(backLink).toHaveAttribute('href', '/');
  });
});
