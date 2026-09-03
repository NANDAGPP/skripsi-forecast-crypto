import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CaraKerjaSistemPage from '@/app/cara-kerja-sistem/page';
import { FAQS } from '@/lib/api';

describe('Blackbox: Halaman Cara Kerja Sistem', () => {
  it('TC-BB-CKS-01: Merender diagram alur kerja dua jalur dan FAQ sistem', () => {
    render(<CaraKerjaSistemPage />);

    expect(screen.getByText('Dari harga kemarin, menjadi angka di layar Anda')).toBeInTheDocument();
    expect(screen.getByText('Dua jalur perhitungan')).toBeInTheDocument();
    expect(screen.getByText('Harga penutupan harian')).toBeInTheDocument();
    expect(screen.getByText('Jalur pertama')).toBeInTheDocument();
    expect(screen.getByText('Perkiraan harga besok')).toBeInTheDocument();
    expect(screen.getByText('Jalur kedua')).toBeInTheDocument();
    expect(screen.getByText('Ukuran risiko')).toBeInTheDocument();
    expect(screen.getByText('Pertanyaan yang sering muncul')).toBeInTheDocument();
  });

  it('TC-BB-CKS-02: Menguji interaksi akordeon FAQ', () => {
    render(<CaraKerjaSistemPage />);

    // Pertanyaan pertama terbuka secara default
    expect(screen.getByText(FAQS[0].a)).toBeInTheDocument();

    // Klik tombol pertanyaan kedua untuk membuka
    const faq2Button = screen.getByRole('button', { name: new RegExp(FAQS[1].q, 'i') });
    fireEvent.click(faq2Button);

    expect(screen.getByText(FAQS[1].a)).toBeInTheDocument();
    // Pertanyaan pertama sekarang tertutup
    expect(screen.queryByText(FAQS[0].a)).not.toBeInTheDocument();
  });
});
