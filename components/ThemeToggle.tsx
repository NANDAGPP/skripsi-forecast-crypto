'use client';

import { useTheme } from './useTheme';

export default function ThemeToggle() {
  const { dark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label={dark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
      style={{
        height: 36,
        padding: '0 14px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        background: 'none',
        border: '1px solid var(--line)',
        color: 'var(--ink2)',
        borderRadius: 999,
        font: "400 12.5px 'IBM Plex Sans',sans-serif",
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {dark ? 'Mode terang' : 'Mode gelap'}
    </button>
  );
}
