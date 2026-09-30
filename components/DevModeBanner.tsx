'use client';

import { SAMPLE_MODE } from '@/lib/api';

/**
 * components/DevModeBanner.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Pita permanen untuk halaman pengelolaan (/admin dan /super-admin).
 * 
 * Spesifikasi mengikat:
 * "Selama SAMPLE_MODE = true, kedua halaman dapat dibuka langsung tanpa masuk.
 *  Di bagian atas kedua halaman, tampilkan pita permanen yang tidak bisa ditutup:
 *  MODE PENGEMBANGAN — pembatasan akses belum diterapkan"
 * 
 * Karakteristik:
 * - Tidak memiliki tombol tutup (permanen).
 * - Berada di posisi sticky (top: 32px, tepat di bawah pita DATA CONTOH).
 * - Hanya aktif bila SAMPLE_MODE bernilai true.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function DevModeBanner() {
  if (!SAMPLE_MODE) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'sticky',
        top: 32,
        zIndex: 90,
        background: '#854d0e', // Amber tua kontras tinggi untuk penanda status pengujian akademik
        color: '#fef08a',
        borderBottom: '1px solid rgba(0, 0, 0, 0.25)',
        textAlign: 'center',
        padding: '6px 14px',
        font: "500 clamp(10px, 2.2vw, 11.5px) 'IBM Plex Mono', monospace",
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        userSelect: 'none',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      MODE PENGEMBANGAN — pembatasan akses belum diterapkan
    </div>
  );
}
