'use client';

import { useSyncExternalStore, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import {
  subscribeConsent,
  getConsentSnapshot,
  getConsentServerSnapshot,
  grantConsent,
} from '@/lib/consentStore';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import Reveal from './Reveal';
import BackgroundHills from './BackgroundHills';

const EXP_OPTIONS = [
  { value: '', label: 'Pilih salah satu…' },
  { value: 'none', label: 'Belum pernah sama sekali' },
  { value: '<1y', label: 'Kurang dari 1 tahun' },
  { value: '1-3y', label: '1–3 tahun' },
  { value: '>3y', label: 'Lebih dari 3 tahun' },
];

export default function ConsentGate({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '';
  const consented = useSyncExternalStore(subscribeConsent, getConsentSnapshot, getConsentServerSnapshot);
  const [experience, setExperience] = useState('');
  const [willing, setWilling] = useState(false);
  const [agree, setAgree] = useState(false);
  const [attempted, setAttempted] = useState(false);

  // Bypass persetujuan responden riset untuk rute login dan administrasi
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/super-admin')
  ) {
    return <>{children}</>;
  }

  if (consented) return <>{children}</>;

  const expMissing = experience === '';
  const canSubmit = !expMissing && willing && agree;

  const handleSubmit = () => {
    setAttempted(true);
    if (canSubmit) grantConsent();
  };

  const errStyle = {
    font: "400 13px/1.55 'IBM Plex Sans',sans-serif",
    color: 'var(--down)',
    marginTop: 4,
  } as const;

  return (
    <>
      <BackgroundHills />
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        {/* Mini nav */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 20,
            background: 'var(--navbg)',
            backdropFilter: 'blur(14px)',
            borderBottom: '1px solid color-mix(in srgb, var(--ink) 9%, transparent)',
          }}
        >
          <div
            style={{
              maxWidth: 780,
              margin: '0 auto',
              minHeight: 66,
              padding: '12px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 20,
            }}
          >
            <Logo size="md" />
            <ThemeToggle />
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: 'clamp(20px, 4vw, 40px) clamp(12px, 3vw, 20px) 60px',
          }}
        >
          <Reveal order={1}>
            <div
              style={{
                maxWidth: 680,
                width: '100%',
                background: 'var(--card)',
                borderRadius: 'clamp(20px, 4vw, 32px)',
                padding: 'clamp(24px, 5vw, 40px) clamp(16px, 5vw, 36px) clamp(24px, 5vw, 36px)',
                boxShadow: 'var(--shadow)',
              }}
            >
              {/* Header */}
              <span
                style={{
                  font: "400 12px 'IBM Plex Mono',monospace",
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  color: 'var(--ink3)',
                }}
              >
                Persetujuan Responden
              </span>
              <h1
                style={{
                  margin: '14px 0 0',
                  font: "400 clamp(26px, 6.5vw, 32px)/1.2 'PP Editorial New','Instrument Serif',serif",
                }}
              >
                Sebelum memulai
              </h1>

              {/* Disclaimer */}
              <div
                style={{
                  marginTop: 26,
                  padding: '22px 24px',
                  background: 'var(--surf2)',
                  borderRadius: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <span
                  style={{
                    font: "400 11.5px 'IBM Plex Mono',monospace",
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    color: 'var(--ink3)',
                  }}
                >
                  Pernyataan penyangkalan
                </span>
                <p style={{ margin: 0, font: "400 14.5px/1.7 'IBM Plex Sans',sans-serif", color: 'var(--ink2)', textWrap: 'pretty' }}>
                  Platform ini dibangun untuk keperluan <strong style={{ fontWeight: 500 }}>penelitian akademik</strong> tentang
                  keterpahaman keluaran model prediksi harga dan ukuran risiko aset kripto. Seluruh angka yang ditampilkan
                  merupakan hasil pemodelan statistik, <strong style={{ fontWeight: 500 }}>bukan saran atau rekomendasi investasi</strong>.
                </p>
                <p style={{ margin: 0, font: "400 14.5px/1.7 'IBM Plex Sans',sans-serif", color: 'var(--ink2)', textWrap: 'pretty' }}>
                  Data yang Anda masukkan pada kalkulator tidak disimpan oleh sistem. Perhitungan berlangsung selama halaman
                  terbuka dan hilang saat ditutup. Setelah menggunakan sistem, Anda akan diminta mengisi kuesioner untuk
                  keperluan evaluasi penelitian.
                </p>
              </div>

              {/* Experience filter */}
              <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label
                  htmlFor="exp-select"
                  style={{ font: "400 14.5px 'IBM Plex Sans',sans-serif" }}
                >
                  Sudah berapa lama Anda berdagang atau memiliki aset kripto?
                </label>
                <select
                  id="exp-select"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  style={{
                    width: '100%',
                    height: 52,
                    padding: '0 16px',
                    border: attempted && expMissing ? '1.5px solid var(--down)' : '1px solid var(--line)',
                    background: 'var(--card)',
                    borderRadius: 14,
                    font: "400 15px 'IBM Plex Sans',sans-serif",
                    color: experience === '' ? 'var(--ink3)' : 'var(--ink)',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%234a5560' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 16px center',
                    cursor: 'pointer',
                  }}
                >
                  {EXP_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} disabled={o.value === ''}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {attempted && expMissing && (
                  <span style={errStyle}>
                    Pilih salah satu pilihan di atas agar kami dapat mengelompokkan jawaban Anda.
                  </span>
                )}
              </div>

              {/* Checkboxes */}
              <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <label
                  style={{
                    display: 'flex',
                    gap: 14,
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                    font: "400 14.5px/1.55 'IBM Plex Sans',sans-serif",
                    color: 'var(--ink)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={willing}
                    onChange={(e) => setWilling(e.target.checked)}
                    style={{
                      width: 22,
                      height: 22,
                      marginTop: 2,
                      flex: 'none',
                      accentColor: 'var(--lime)',
                      cursor: 'pointer',
                    }}
                  />
                  Saya bersedia mengisi kuesioner setelah menggunakan sistem ini.
                </label>
                {attempted && !willing && (
                  <span style={{ ...errStyle, marginTop: -6, paddingLeft: 36 }}>
                    Centang pernyataan ini untuk melanjutkan. Kuesioner diperlukan untuk evaluasi penelitian.
                  </span>
                )}

                <label
                  style={{
                    display: 'flex',
                    gap: 14,
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                    font: "400 14.5px/1.55 'IBM Plex Sans',sans-serif",
                    color: 'var(--ink)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    style={{
                      width: 22,
                      height: 22,
                      marginTop: 2,
                      flex: 'none',
                      accentColor: 'var(--lime)',
                      cursor: 'pointer',
                    }}
                  />
                  Saya telah membaca pernyataan penyangkalan di atas dan memahami bahwa keluaran sistem ini bukan saran investasi.
                </label>
                {attempted && !agree && (
                  <span style={{ ...errStyle, marginTop: -6, paddingLeft: 36 }}>
                    Centang pernyataan ini untuk melanjutkan. Pemahaman ini penting sebelum menggunakan sistem.
                  </span>
                )}
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                style={{
                  marginTop: 32,
                  width: '100%',
                  height: 58,
                  border: 'none',
                  background: canSubmit ? 'var(--lime)' : 'var(--line2)',
                  color: canSubmit ? 'var(--onlime)' : 'var(--ink4)',
                  borderRadius: 999,
                  font: "500 15.5px 'IBM Plex Sans',sans-serif",
                  cursor: canSubmit ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  transition: 'background .2s, color .2s',
                }}
              >
                Masuk ke sistem <span style={{ font: "400 15px 'IBM Plex Mono',monospace" }}>→</span>
              </button>

              {attempted && !canSubmit && (
                <p
                  style={{
                    margin: '14px 0 0',
                    textAlign: 'center',
                    font: "400 13.5px/1.55 'IBM Plex Sans',sans-serif",
                    color: 'var(--down)',
                  }}
                >
                  Lengkapi seluruh isian di atas sebelum melanjutkan.
                </p>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </>
  );
}
