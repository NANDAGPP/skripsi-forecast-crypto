'use client';

import { useMemo, useState } from 'react';
import NavBar from '@/components/NavBar';
import BackgroundHills from '@/components/BackgroundHills';
import Reveal from '@/components/Reveal';
import TipDrawer, { type Tip } from '@/components/TipDrawer';
import Disclaimer from '@/components/Disclaimer';
import bento from '@/components/bento.module.css';
import styles from './page.module.css';
import { kupiecTestResults, type KupiecResult, INK } from '@/lib/api';

const METHODS_SHORT = ['Historis dasar', 'FHS tanpa drift', 'FHS dengan drift'];
const ASSETS = ['BTC', 'ETH', 'BNB'];
const PAIRS = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT'];

export default function ValidasiPage() {
  const [assetIdx, setAssetIdx] = useState(0);
  const [tip, setTip] = useState<Tip>(null);

  const allResults = useMemo(() => kupiecTestResults(), []);

  const data = useMemo(() => {
    const rows = allResults.filter((r) => r.asset === ASSETS[assetIdx]);

    // violation timeline chart
    const N = 180;
    const L = 30, R = 710;
    const X = (d: number) => L + ((R - L) * d) / (N - 1);
    const expectedLine = Math.round(N * 0.05);

    // all violations for this asset across methods
    const methodColors = ['var(--risk)', 'var(--up)', 'var(--ink4)'];
    const timelines = rows.map((r, mi) => ({
      method: METHODS_SHORT[mi],
      color: methodColors[mi],
      dots: r.violationDays.map((d) => ({ cx: X(d).toFixed(1), day: d })),
    }));

    const xTicks = [0, 45, 90, 135, 179].map((d) => ({
      x: X(d).toFixed(1),
      label: 'H-' + (N - 1 - d),
    }));

    // summary counts
    const totalPass = rows.filter((r) => r.pass).length;

    return { rows, timelines, xTicks, totalPass, expectedLine };
  }, [allResults, assetIdx]);

  return (
    <>
      <BackgroundHills />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <NavBar variant="sub" subtitle="Validasi model" />

        <div className={styles.container}>
          <Reveal order={1} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16, marginBottom: 34 }}>
            <span style={{ font: "400 12px 'IBM Plex Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink3)' }}>
              Artboard 7
            </span>
            <h1 className={styles.heading}>Apakah batas kerugian yang dihitung dapat diandalkan?</h1>
            <p style={{ margin: 0, maxWidth: 700, font: "400 15.5px/1.65 'IBM Plex Sans',sans-serif", color: 'var(--ink2)', textWrap: 'pretty' }}>
              Uji Kupiec memeriksa apakah jumlah hari yang kerugiannya melampaui batas sesuai dengan yang diharapkan.
              Jika terlalu sering atau terlalu jarang, modelnya diragukan. Semua angka dari periode pengujian 180 hari.
            </p>
          </Reveal>

          <Reveal order={1} style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            <div style={{ display: 'flex', gap: 5, background: 'var(--surf2)', padding: 5, borderRadius: 14 }}>
              {ASSETS.map((x, i) => {
                const sel = i === assetIdx;
                return (
                  <button
                    key={x}
                    onClick={() => setAssetIdx(i)}
                    style={{
                      padding: '10px 22px', border: 'none', borderRadius: 10, cursor: 'pointer', font: "400 14px 'IBM Plex Mono',monospace",
                      background: sel ? 'var(--card)' : 'transparent', color: sel ? INK : 'var(--ink3)',
                      boxShadow: sel ? '0 1px 4px color-mix(in srgb, var(--ink) 16%, transparent)' : 'none', transition: 'background .2s',
                    }}
                  >
                    {x}
                  </button>
                );
              })}
            </div>
          </Reveal>

          <div className={bento.grid}>
            {/* Ringkasan */}
            <Reveal order={2} className={bento.full} style={{ background: 'var(--card)', borderRadius: 32, padding: '34px 34px 28px', boxShadow: 'var(--shadow)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                <span style={{ font: "400 12px 'IBM Plex Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink3)' }}>
                  Hasil uji Kupiec — {PAIRS[assetIdx]}
                </span>
                <span style={{ font: "400 12.5px 'IBM Plex Mono',monospace", color: 'var(--ink3)' }}>
                  {data.totalPass} dari 3 metode lolos uji
                </span>
              </div>

              <div style={{ marginTop: 24, padding: '20px 22px', background: 'var(--surf2)', borderRadius: 18, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ width: 34, height: 34, flex: 'none', borderRadius: '50%', background: 'var(--lime)', color: 'var(--onlime)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "500 15px 'IBM Plex Sans',sans-serif" }}>
                  ?
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button
                    onClick={() => setTip({
                      title: 'Uji Kupiec (Proportion of Failures)',
                      body: 'Uji ini membandingkan jumlah hari yang kerugiannya melampaui batas VaR dengan jumlah yang diharapkan berdasarkan tingkat kepercayaan (5% dari 180 hari = sekitar 9 hari). Statistik uji mengikuti distribusi Chi-kuadrat dengan 1 derajat kebebasan. Jika statistik uji lebih kecil dari nilai kritis 3,841, model dinyatakan lolos — artinya frekuensi pelanggaran masih wajar.',
                    })}
                    style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', font: "400 14px 'IBM Plex Sans',sans-serif", color: 'var(--risk)', borderBottom: '1px solid var(--linkline)' }}
                  >
                    Apa itu uji Kupiec dan bagaimana membacanya?
                  </button>
                  <p style={{ margin: 0, font: "400 13.5px/1.6 'IBM Plex Sans',sans-serif", color: 'var(--ink2)' }}>
                    Dari 180 hari pengujian pada tingkat kepercayaan 95%, diharapkan sekitar 9 hari melampaui batas. Terlalu banyak berarti batasnya terlalu ketat, terlalu sedikit berarti terlalu longgar.
                  </p>
                </div>
              </div>

              {/* Tabel hasil */}
              <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className={styles.resultHead}>
                  <span>Metode</span>
                  <span>Pelanggaran</span>
                  <span>Statistik uji</span>
                  <span>Nilai-p</span>
                  <span>Hasil</span>
                </div>

                {data.rows.map((r: KupiecResult) => (
                  <div
                    key={r.method}
                    className={styles.resultRow}
                    style={{ background: r.pass ? 'var(--surf3)' : 'var(--warm)' }}
                  >
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                      <span style={{ font: "400 15px 'IBM Plex Sans',sans-serif" }}>{r.method}</span>
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span style={{ font: "400 16px 'IBM Plex Mono',monospace" }}>
                        {r.actualViolations} <span style={{ font: "400 12.5px 'IBM Plex Sans',sans-serif", color: 'var(--ink3)' }}>dari {r.totalDays} hari</span>
                      </span>
                      <span style={{ font: "400 12px 'IBM Plex Mono',monospace", color: 'var(--ink4)' }}>
                        diharapkan ≈ {r.expectedViolations}
                      </span>
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span style={{ font: "400 16px 'IBM Plex Mono',monospace" }}>
                        {r.lrStatistic.toFixed(3)}
                      </span>
                      <span style={{ font: "400 12px 'IBM Plex Mono',monospace", color: 'var(--ink4)' }}>
                        kritis = {r.criticalValue}
                      </span>
                    </span>
                    <span style={{ font: "400 16px 'IBM Plex Mono',monospace" }}>
                      {r.pValue.toFixed(3)}
                    </span>
                    <span
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        padding: '6px 14px', borderRadius: 999, whiteSpace: 'nowrap',
                        background: r.pass ? 'var(--up)' : 'var(--down)',
                        color: '#fff',
                        font: "500 12.5px 'IBM Plex Mono',monospace",
                      }}
                    >
                      {r.pass ? 'Lolos' : 'Tidak lolos'}
                    </span>
                  </div>
                ))}
              </div>

              <p style={{ margin: '20px 0 0', font: "400 13.5px/1.65 'IBM Plex Sans',sans-serif", color: 'var(--ink2)', maxWidth: 900, textWrap: 'pretty' }}>
                Metode yang lolos berarti frekuensi pelanggarannya masih konsisten dengan tingkat kepercayaan 95%. Lolos uji tidak menjamin model akan selalu tepat — hanya menyatakan bahwa pada data pengujian ini, batas kerugian belum terbukti salah secara statistik.
              </p>
            </Reveal>

            {/* Sebaran pelanggaran */}
            <Reveal order={3} className={bento.full} style={{ background: 'var(--card)', borderRadius: 26, padding: '28px 30px 22px', boxShadow: 'var(--shadow)' }}>
              <span style={{ font: "400 12px 'IBM Plex Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink3)' }}>
                Sebaran pelanggaran sepanjang periode pengujian
              </span>
              <p style={{ margin: '9px 0 20px', font: "400 13.5px/1.55 'IBM Plex Sans',sans-serif", color: 'var(--ink3)', maxWidth: 660 }}>
                Setiap titik adalah hari ketika kerugian melampaui batas VaR. Pola yang mengelompok menunjukkan bahwa pelanggaran cenderung muncul berturutan saat pasar bergejolak.
              </p>

              <svg viewBox="0 0 740 130" style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
                {/* baseline */}
                <line x1="30" y1="120" x2="710" y2="120" stroke="var(--line2)" strokeWidth="1" />
                {data.xTicks.map((t, i) => (
                  <text key={i} x={t.x} y="118" fill="var(--ink4)" textAnchor="middle" style={{ font: "400 10.5px 'IBM Plex Mono',monospace" }}>{t.label}</text>
                ))}

                {/* timelines per method */}
                {data.timelines.map((tl, mi) => {
                  const y = 20 + mi * 30;
                  return (
                    <g key={mi}>
                      <line x1="30" y1={y} x2="710" y2={y} stroke="var(--line2)" strokeWidth="1" strokeDasharray="3 3" />
                      <text x="0" y={y + 4} fill="var(--ink4)" style={{ font: "400 9.5px 'IBM Plex Mono',monospace" }}>
                        {mi + 1}
                      </text>
                      {tl.dots.map((d, di) => (
                        <circle key={di} cx={d.cx} cy={y} r="4.5" fill={tl.color} opacity="0.85" className={styles.timelineDot} />
                      ))}
                    </g>
                  );
                })}
              </svg>

              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', paddingTop: 8 }}>
                {data.timelines.map((tl, mi) => (
                  <span key={mi} style={{ display: 'flex', alignItems: 'center', gap: 7, font: "400 12px 'IBM Plex Sans',sans-serif", color: 'var(--ink2)' }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: tl.color, display: 'block' }} />
                    {mi + 1}. {tl.method}
                  </span>
                ))}
              </div>
            </Reveal>

            <Reveal order={4} className={bento.full}>
              <Disclaimer text="Angka pada halaman ini berasal dari pengujian atas data masa lalu. Seluruh keluaran platform ini merupakan hasil pemodelan statistik untuk keperluan penelitian akademik. Bukan saran atau rekomendasi investasi." />
            </Reveal>
          </div>
        </div>
      </div>

      <TipDrawer tip={tip} onClose={() => setTip(null)} />
    </>
  );
}
