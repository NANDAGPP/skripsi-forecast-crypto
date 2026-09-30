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
        background: 'var(--down)',
        color: '#fff',
        borderTop: '1px solid rgba(255, 255, 255, 0.25)',
        textAlign: 'center',
        padding: '7px 12px',
        font: "500 clamp(10.5px, 2.8vw, 12.5px) 'IBM Plex Mono',monospace",
        letterSpacing: 'clamp(.05em, 1vw, .12em)',
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
