import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ThemeToggle from '@/components/ThemeToggle';
import { setTheme } from '@/lib/themeStore';

describe('Blackbox: ThemeToggle (Pengalih Tema Terang/Gelap)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.dataset.theme = 'light';
  });

  it('TC-BB-TT-01: Menampilkan tombol dengan label yang sesuai dengan status tema', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Mode gelap');
    expect(button).toHaveAttribute('aria-label', 'Ganti ke mode gelap');
  });

  it('TC-BB-TT-02: Beralih dari mode terang ke mode gelap saat tombol diklik', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');

    fireEvent.click(button);

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('ffl-theme')).toBe('dark');
    expect(button).toHaveTextContent('Mode terang');
    expect(button).toHaveAttribute('aria-label', 'Ganti ke mode terang');
  });

  it('TC-BB-TT-03: Beralih kembali dari mode gelap ke mode terang pada klik kedua', () => {
    setTheme('dark');
    render(<ThemeToggle />);
    const button = screen.getByRole('button');

    expect(button).toHaveTextContent('Mode terang');

    fireEvent.click(button);

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('ffl-theme')).toBe('light');
    expect(button).toHaveTextContent('Mode gelap');
  });
});
