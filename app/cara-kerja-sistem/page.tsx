'use client';

import { useState } from 'react';
import NavBar from '@/components/NavBar';
import BackgroundHills from '@/components/BackgroundHills';
import Reveal from '@/components/Reveal';
import Disclaimer from '@/components/Disclaimer';
import styles from './page.module.css';
import { TRACKS, FAQS, LIMITS } from '@/lib/api';

const INK = 'var(--ink)';

export default function CaraKerjaSistemPage() {
  const [open, setOpen] = useState(0);

  return (
    <>
      <BackgroundHills />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <NavBar variant="sub" subtitle="Cara kerja sistem" maxWidth={1160} />

        <div className={styles.container}>
          <Reveal order={1} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16, marginBottom: 38 }}>
            <span style={{ font: "400 12px 'IBM Plex Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink3)' }}>
              Artboard 6
            </span>
            <h1 className={styles.heading}>Dari harga kemarin, menjadi angka di layar Anda</h1>
            <p style={{ margin: 0, maxWidth: 660, font: "400 15.5px/1.65 'IBM Plex Sans',sans-serif", color: 'var(--ink2)', textWrap: 'pretty' }}>
              Dua hal dihitung terpisah lalu ditampilkan berdampingan: perkiraan harga dan ukuran risiko. Berikut jalannya, tanpa rumus.
            </p>
          </Reveal>

          <Reveal order={2} style={{ background: 'var(--card)', borderRadius: 32, padding: '36px 34px 34px', boxShadow: 'var(--shadow)' }}>
            <span style={{ font: "400 12px 'IBM Plex Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink3)' }}>
              Dua jalur perhitungan
            </span>

            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: '22px 24px', background: 'var(--surf2)', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
                <span style={{ width: 38, height: 38, flex: 'none', borderRadius: 12, background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "400 15px 'IBM Plex Mono',monospace" }}>
                  0
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 220, flex: 1 }}>
                  <span style={{ font: "400 16.5px 'IBM Plex Sans',sans-serif" }}>Harga penutupan harian</span>
                  <span style={{ font: "400 13.5px/1.6 'IBM Plex Sans',sans-serif", color: 'var(--ink2)' }}>
                    Diambil sekali sehari dari bursa publik. Titik awal yang sama untuk kedua jalur di bawah.
                  </span>
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <svg viewBox="0 0 600 46" style={{ width: '100%', maxWidth: 600, height: 'auto', display: 'block' }}>
                  <path d="M300 0 L300 14 Q300 22 292 22 L158 22 Q150 22 150 30 L150 44" fill="none" stroke="var(--line)" strokeWidth="1.6" />
                  <path d="M300 0 L300 14 Q300 22 308 22 L442 22 Q450 22 450 30 L450 44" fill="none" stroke="var(--line)" strokeWidth="1.6" />
                  <circle cx="150" cy="44" r="3" fill="var(--line)" />
                  <circle cx="450" cy="44" r="3" fill="var(--line)" />
                </svg>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
                {TRACKS.map((t) => (
                  <div key={t.title} style={{ background: 'var(--surf2)', borderRadius: 24, padding: '24px 24px 22px', borderTop: '3px solid ' + t.dot }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 9, height: 9, flex: 'none', borderRadius: '50%', background: t.dot, display: 'block' }} />
                      <span style={{ font: "400 12px 'IBM Plex Mono',monospace", letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink2)' }}>{t.kicker}</span>
                    </span>
                    <span style={{ font: "400 26px/1.2 'PP Editorial New','Instrument Serif',serif", marginTop: 12, display: 'block' }}>{t.title}</span>
                    <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {t.steps.map((s) => (
                        <div key={s.n} style={{ display: 'flex', gap: 13, alignItems: 'flex-start', padding: '14px 16px', background: 'var(--card)', borderRadius: 14 }}>
                          <span style={{ width: 24, height: 24, flex: 'none', borderRadius: 8, background: 'var(--surf2)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "400 12.5px 'IBM Plex Mono',monospace" }}>
                            {s.n}
                          </span>
                          <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                            <span style={{ font: "400 15px/1.45 'IBM Plex Sans',sans-serif" }}>{s.title}</span>
                            <span style={{ font: "400 13px/1.6 'IBM Plex Sans',sans-serif", color: 'var(--ink2)', textWrap: 'pretty' }}>{s.body}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 14, padding: '16px 18px', background: 'color-mix(in srgb, var(--card) 60%, transparent)', borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <span style={{ font: "400 11.5px 'IBM Plex Mono',monospace", letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink2)' }}>Yang Anda lihat</span>
                      <span style={{ font: "400 15px/1.55 'IBM Plex Sans',sans-serif", textWrap: 'pretty' }}>{t.output}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: '22px 24px', background: 'var(--surf2)', borderRadius: 20, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <span style={{ width: 34, height: 34, flex: 'none', borderRadius: '50%', background: 'var(--lime)', color: 'var(--onlime)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "500 15px 'IBM Plex Sans',sans-serif" }}>
                  !
                </span>
                <p style={{ margin: 0, font: "400 14.5px/1.65 'IBM Plex Sans',sans-serif", textWrap: 'pretty' }}>
                  Kedua jalur tidak saling mengoreksi. Perkiraan harga tidak dipakai untuk menghitung risiko, dan sebaliknya. Keduanya
                  sengaja dipisah agar kesalahan pada satu jalur tidak menular ke jalur lain.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal order={3} style={{ marginTop: 22, background: 'var(--card)', borderRadius: 32, padding: '36px 34px 30px', boxShadow: 'var(--shadow)' }}>
            <span style={{ font: "400 12px 'IBM Plex Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink3)' }}>
              Pertanyaan yang sering muncul
            </span>
            <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FAQS.map((f, i) => {
                const isOpen = open === i;
                return (
                  <div key={f.q} style={{ borderRadius: 20, background: isOpen ? 'var(--surf2)' : 'var(--surf3)', transition: 'background .25s' }}>
                    <button
                      onClick={() => setOpen((s) => (s === i ? -1 : i))}
                      aria-expanded={isOpen}
                      style={{ width: '100%', padding: '20px 22px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, textAlign: 'left' }}
                    >
                      <span style={{ font: "400 16.5px/1.45 'IBM Plex Sans',sans-serif", textWrap: 'pretty' }}>{f.q}</span>
                      <span
                        style={{
                          flex: 'none',
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: isOpen ? 'var(--lime)' : 'var(--surf2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: INK,
                          transform: isOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform .35s cubic-bezier(.19,.86,.24,1), background .25s',
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ display: 'block' }}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </span>
                    </button>
                    {isOpen && (
                      <p style={{ margin: 0, padding: '0 22px 22px', font: "400 14.5px/1.7 'IBM Plex Sans',sans-serif", color: 'var(--ink2)', maxWidth: 860, textWrap: 'pretty' }}>
                        {f.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </Reveal>

          <Reveal order={4} style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
            {LIMITS.map((l) => (
              <div key={l.title} style={{ background: 'var(--warm)', borderRadius: 22, padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                <span style={{ font: "400 11.5px 'IBM Plex Mono',monospace", letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink2)' }}>
                  Batas yang perlu diketahui
                </span>
                <span style={{ font: "400 20px/1.35 'PP Editorial New','Instrument Serif',serif", textWrap: 'pretty' }}>{l.title}</span>
                <span style={{ font: "400 13.5px/1.65 'IBM Plex Sans',sans-serif", color: 'var(--ink2)', textWrap: 'pretty' }}>{l.body}</span>
              </div>
            ))}
          </Reveal>

          <Reveal order={4}>
            <Disclaimer text="Seluruh keluaran platform ini merupakan hasil pemodelan statistik untuk keperluan penelitian akademik. Bukan saran atau rekomendasi investasi." />
          </Reveal>
        </div>
      </div>
    </>
  );
}
