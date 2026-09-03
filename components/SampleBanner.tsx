'use client';

import { SAMPLE_MODE } from '@/lib/api';

/**
 * Pita permanen di bagian atas layar bertuliskan
 * "DATA CONTOH — bukan hasil penelitian".
 * Tidak bisa ditutup. Hanya terlihat jika SAMPLE_MODE aktif.
 */
export default function SampleBanner() {
  if (!SAMPLE_MODE) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'var(--down)',
        color: '#fff',
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
      DATA CONTOH — bukan hasil penelitian
    </div>
  );
}
