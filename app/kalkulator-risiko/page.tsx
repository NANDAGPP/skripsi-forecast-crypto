'use client';

import { useMemo, useState } from 'react';
import NavBar from '@/components/NavBar';
import BackgroundHills from '@/components/BackgroundHills';
import Reveal from '@/components/Reveal';
import TipDrawer, { type Tip } from '@/components/TipDrawer';
import Disclaimer from '@/components/Disclaimer';
import bento from '@/components/bento.module.css';
import styles from './page.module.css';
import { idr, pct } from '@/lib/format';
import { series } from '@/lib/rng';
import { KALKULATOR_ASSETS as ASSETS, KALKULATOR_GLOSSARY as GLOSS } from '@/lib/api';

const N = 180;
const INK = 'var(--ink)';
const DOWN = 'var(--down)';

export default function KalkulatorRisikoPage() {
  const [qty, setQty] = useState<number[]>(ASSETS.map((a) => a.def));
  const [tip, setTip] = useState<Tip>(null);
  const [methodsOpen, setMethodsOpen] = useState(false);

  const setGlossTip = (k: keyof typeof GLOSS) => () => {
    const [title, body] = GLOSS[k];
    setTip({ title, body });
  };

  const data = useMemo(() => {
    const total = ASSETS.reduce((sum, a, i) => sum + a.price * qty[i], 0);
    const paths = ASSETS.map((a) => series(a.seed, a.price, N));
    const port: number[] = [];
    for (let t = 0; t <= N; t++) port.push(ASSETS.reduce((sum, a, i) => sum + paths[i][t] * qty[i], 0));

    const rets: number[] = [];
    for (let t = 1; t <= N; t++) rets.push(port[t - 1] > 0 ? (port[t] - port[t - 1]) / port[t - 1] : 0);
    const sorted = rets.slice().sort((x, y) => x - y);
    const k = Math.max(0, Math.floor(0.05 * sorted.length) - 1);
    const varR = total > 0 ? -sorted[k] : 0;
    const tail = sorted.slice(0, k + 1);
    const cvarR = total > 0 && tail.length ? -(tail.reduce((s, v) => s + v, 0) / tail.length) : 0;

    let peak = port[0], dd = 0, ddPeak = port[0];
    for (let t = 0; t <= N; t++) {
      if (port[t] > peak) peak = port[t];
      const d = peak > 0 ? (peak - port[t]) / peak : 0;
      if (d > dd) { dd = d; ddPeak = peak; }
    }
    if (total <= 0) { dd = 0; ddPeak = 0; }

    const mean = rets.reduce((s, v) => s + v, 0) / rets.length;
    const sd = Math.sqrt(rets.reduce((s, v) => s + (v - mean) * (v - mean), 0) / (rets.length - 1)) || 0;

    // FHS: estimasi volatilitas bersyarat dengan EWMA (λ = 0,94)
    const lambda = 0.94;
    const sigmas: number[] = [sd];
    for (let t = 1; t < rets.length; t++) {
      sigmas.push(Math.sqrt(lambda * sigmas[t - 1] ** 2 + (1 - lambda) * rets[t - 1] ** 2));
    }
    const sigmaT = sigmas[sigmas.length - 1] || sd;
    const stdRets = rets.map((r, t) => (sigmas[t] > 1e-12 ? r / sigmas[t] : 0));

    // FHS tanpa penyesuaian rata-rata
    const fhsNoDrift = stdRets.map((z) => z * sigmaT);
    const fhsNoDriftSorted = fhsNoDrift.slice().sort((a, b) => a - b);
    const fhsNoDriftK = Math.max(0, Math.floor(0.05 * fhsNoDriftSorted.length) - 1);
    const fhsNoDriftR = total > 0 ? -fhsNoDriftSorted[fhsNoDriftK] : 0;

    // FHS dengan penyesuaian rata-rata (drift)
    const fhsWithDrift = stdRets.map((z) => mean + z * sigmaT);
    const fhsWithDriftSorted = fhsWithDrift.slice().sort((a, b) => a - b);
    const fhsWithDriftK = Math.max(0, Math.floor(0.05 * fhsWithDriftSorted.length) - 1);
    const fhsWithDriftR = total > 0 ? -fhsWithDriftSorted[fhsWithDriftK] : 0;

    const riskDefs = [
      { key: 'var' as const, label: 'Potensi kerugian maksimum', v: varR, plain: 'Dalam 95 dari 100 hari, kerugian diperkirakan tidak melebihi angka ini.' },
      { key: 'cvar' as const, label: 'Rata-rata kerugian bila melampaui batas', v: cvarR, plain: 'Bila hari buruk itu terjadi, sebesar inilah kerugian rata-ratanya.' },
      { key: 'dd' as const, label: 'Penurunan terdalam yang pernah terjadi', v: dd, plain: 'Jarak dari nilai puncak ke titik terendah sesudahnya, pada 180 hari terakhir.' },
    ];
    const risks = riskDefs.map((r) => ({
      label: r.label,
      plain: r.plain,
      money: r.key === 'dd' ? idr(ddPeak * r.v) : idr(total * r.v),
      pct: pct(r.v * 100) + (r.key === 'dd' ? ' dari nilai puncak' : ' dari nilai portofolio'),
      tip: setGlossTip(r.key),
    }));

    // histogram
    const pctRets = rets.map((v) => v * 100);
    let lo = Math.min(...pctRets), hi = Math.max(...pctRets);
    if (!isFinite(lo) || lo === hi) { lo = -1; hi = 1; }
    const span = Math.max(Math.abs(lo), Math.abs(hi)) * 1.05;
    lo = -span; hi = span;
    const NB = 24, counts = new Array(NB).fill(0);
    pctRets.forEach((v) => {
      const b = Math.floor(((v - lo) / (hi - lo)) * NB);
      counts[Math.max(0, Math.min(NB - 1, b))]++;
    });
    const maxC = Math.max(...counts) || 1;
    const L = 46, R = 700, T = 12, B = 256;
    const bw = (R - L) / NB;
    const varPctVal = -varR * 100;
    const bars = counts.map((c, i) => {
      const h = (c / maxC) * (B - T);
      const center = lo + ((i + 0.5) / NB) * (hi - lo);
      return {
        x: (L + i * bw + 1.2).toFixed(1), w: (bw - 2.4).toFixed(1),
        y: (B - h).toFixed(1), h: Math.max(0, h).toFixed(1),
        fill: center <= varPctVal ? 'var(--bartail)' : 'var(--barfill)',
      };
    });
    const xOf = (p: number) => L + ((p - lo) / (hi - lo)) * (R - L);
    const varX = Math.max(L, Math.min(R, xOf(varPctVal)));
    const histTicksY = [0, 1, 2, 3].map((i) => {
      const c = (maxC * i) / 3, y = B - (c / maxC) * (B - T);
      return { y: y.toFixed(1), ty: (y + 4).toFixed(1), label: Math.round(c).toLocaleString('id-ID') };
    });
    const histTicksX = [0, 1, 2, 3, 4].map((i) => {
      const p = lo + ((hi - lo) * i) / 4;
      return { x: xOf(p).toFixed(1), label: (p > 0 ? '+' : '') + p.toFixed(1) + '%' };
    });

    const worstIdx = rets.indexOf(sorted[0]);
    // eslint-disable-next-line react-hooks/purity -- relative day label only, no SSR caching/offscreen reuse of this client component
    const worstDay = new Date(Date.now() - (N - 1 - worstIdx) * 86400000);

    const methods = [
      { name: 'Simulasi historis dasar', tag: 'dipakai di halaman ini', v: varR, desc: 'Mengurutkan hasil 180 hari terakhir apa adanya, lalu mengambil nilai pada peringkat 5 persen terburuk. Tidak mengandaikan bentuk sebaran tertentu, tetapi hanya mengenal kejadian yang sudah pernah terjadi.' },
      { name: 'FHS tanpa penyesuaian rata-rata', tag: 'filtered historical simulation', v: fhsNoDriftR, desc: 'Menstandarkan hasil harian dengan volatilitas bersyarat (EWMA), lalu mengalikan kembali residual terstandar dengan volatilitas terkini. Menangkap perubahan gejolak pasar dari waktu ke waktu, tanpa memperhitungkan rata-rata hasil harian.' },
      { name: 'FHS dengan penyesuaian rata-rata', tag: 'filtered historical simulation + drift', v: fhsWithDriftR, desc: 'Sama seperti FHS tanpa penyesuaian, tetapi menambahkan kembali rata-rata hasil harian (drift). Hasilnya memperhitungkan baik perubahan gejolak maupun kecenderungan arah harga.' },
    ].map((m, i) => ({
      name: m.name, desc: m.desc, tag: m.tag,
      money: idr(total * m.v), pct: pct(m.v * 100) + ' dari nilai portofolio',
      highlight: i === 0,
    }));

    return {
      total, risks, bars, histTicksY, histTicksX, methods,
      varPctLabel: pct(varR * 100),
      varX, varAnchor: varX > 560 ? 'end' as const : 'start' as const,
      worstDate: worstDay.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
      worstMoney: total > 0 ? '−' + idr(total * Math.abs(sorted[0])) : idr(0),
      worstPct: pct(Math.abs(sorted[0]) * 100),
    };
  }, [qty]);

  const emptyPortfolio = data.total <= 0;

  return (
    <>
      <BackgroundHills />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <NavBar variant="sub" subtitle="Kalkulator risiko portofolio" />

        <div className={styles.container}>
          <Reveal order={1} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16, marginBottom: 38 }}>
            <span style={{ font: "400 12px 'IBM Plex Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink3)' }}>
              Artboard 3
            </span>
            <h1 className={styles.heading}>Berapa besar kerugian yang mungkin Anda tanggung?</h1>
            <p style={{ margin: 0, maxWidth: 660, font: "400 15.5px/1.65 'IBM Plex Sans',sans-serif", color: 'var(--ink2)', textWrap: 'pretty' }}>
              Masukkan jumlah kepemilikan Anda. Ketiga ukuran risiko dihitung ulang dalam Rupiah, memakai simulasi historis atas 180 hari
              terakhir.
            </p>
          </Reveal>

          <div className={bento.grid}>
            <Reveal order={2} className={bento.full} style={{ background: 'var(--card)', borderRadius: 32, padding: '34px 34px 30px', boxShadow: 'var(--shadow)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                <span style={{ font: "400 12px 'IBM Plex Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink3)' }}>
                  Kepemilikan Anda
                </span>
                <button
                  onClick={() => setQty(ASSETS.map((a) => a.def))}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: "400 13px 'IBM Plex Sans',sans-serif", color: 'var(--risk)', borderBottom: '1px solid var(--linkline)' }}
                >
                  Kembalikan ke contoh
                </button>
              </div>

              <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className={styles.holdingsHead}>
                  <span>Aset</span><span>Jumlah dimiliki</span><span style={{ textAlign: 'right' }}>Nilai sekarang</span>
                </div>
                {ASSETS.map((a, i) => (
                  <div key={a.id} className={styles.holdingsRow}>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                      <span style={{ font: "400 15px 'IBM Plex Sans',sans-serif" }}>{a.pair}</span>
                      <span style={{ font: "400 12.5px 'IBM Plex Mono',monospace", color: 'var(--ink3)' }}>{idr(a.price)} / {a.short}</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                      <input
                        type="number"
                        step={a.step}
                        min={0}
                        value={qty[i]}
                        onChange={(e) => {
                          const v = Math.max(0, Number(e.target.value) || 0);
                          setQty((s) => { const q = s.slice(); q[i] = v; return q; });
                        }}
                        aria-label={'Jumlah ' + a.short + ' yang dimiliki'}
                        style={{ width: '100%', minWidth: 0, height: 48, padding: '0 14px', border: '1px solid var(--line)', background: 'var(--card)', borderRadius: 14, font: "400 17px 'IBM Plex Mono',monospace", color: 'var(--ink)' }}
                      />
                      <span style={{ font: "400 13px 'IBM Plex Mono',monospace", color: 'var(--ink3)', flex: 'none' }}>{a.short}</span>
                    </span>
                    <span style={{ font: "400 25px/1.15 'PP Editorial New','Instrument Serif',serif", textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {idr(a.price * qty[i])}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 24, paddingTop: 22, borderTop: '1px solid var(--line2)', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                <span style={{ font: "400 14.5px 'IBM Plex Sans',sans-serif", color: 'var(--ink2)' }}>Nilai portofolio yang dihitung</span>
                <span style={{ font: "400 46px/1 'PP Editorial New','Instrument Serif',serif", whiteSpace: 'nowrap' }}>{idr(data.total)}</span>
              </div>
              {emptyPortfolio && (
                <p style={{ margin: '14px 0 0', font: "400 14px/1.6 'IBM Plex Sans',sans-serif", color: 'var(--down)' }}>
                  Belum ada kepemilikan yang dimasukkan, jadi seluruh angka risiko di bawah bernilai nol.
                </p>
              )}
            </Reveal>

            <Reveal order={3} className={bento.full} style={{ background: 'var(--card)', borderRadius: 26, padding: '30px 32px', boxShadow: 'var(--shadow)' }}>
              <span style={{ font: "400 12px 'IBM Plex Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink3)' }}>
                Hasil perhitungan risiko
              </span>
              <p style={{ margin: '9px 0 22px', font: "400 13.5px/1.55 'IBM Plex Sans',sans-serif", color: 'var(--ink3)' }}>
                Dihitung atas gabungan ketiga aset, dengan memperhitungkan bahwa harga ketiganya sering bergerak searah.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 }}>
                {data.risks.map((r) => (
                  <div key={r.label} style={{ background: 'var(--surf2)', borderRadius: 18, padding: '20px 20px 19px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ font: "400 13.5px/1.4 'IBM Plex Sans',sans-serif" }}>{r.label}</span>
                      <button
                        onClick={r.tip}
                        aria-label={'Penjelasan ' + r.label}
                        style={{
                          width: 20,
                          height: 20,
                          flex: 'none',
                          borderRadius: '50%',
                          border: 'none',
                          background: 'var(--card)',
                          color: 'var(--ink2)',
                          font: "500 11px 'IBM Plex Sans',sans-serif",
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                          lineHeight: 1,
                        }}
                      >
                        ?
                      </button>
                    </span>
                    <span className={styles.riskMoney}>{r.money}</span>
                    <span style={{ font: "400 13px 'IBM Plex Mono',monospace", color: 'var(--ink2)' }}>{r.pct}</span>
                    <span style={{ font: "400 13px/1.55 'IBM Plex Sans',sans-serif", color: 'var(--ink2)', marginTop: 4, textWrap: 'pretty' }}>{r.plain}</span>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal order={2} className={bento.span4} style={{ minWidth: 0, background: 'var(--card)', borderRadius: 26, padding: '28px 30px 22px', boxShadow: 'var(--shadow)' }}>
              <span style={{ font: "400 12px 'IBM Plex Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink3)' }}>
                Sebaran untung dan rugi harian
              </span>
              <p style={{ margin: '9px 0 0', font: "400 13.5px/1.55 'IBM Plex Sans',sans-serif", color: 'var(--ink3)', maxWidth: 560 }}>
                Setiap batang adalah banyaknya hari dengan hasil sebesar itu, dari 180 hari terakhir. Garis putus-putus adalah batas kerugian
                maksimum {data.varPctLabel}; hari-hari di sebelah kirinya adalah kejadian yang melampaui batas.
              </p>
              <svg viewBox="0 0 720 300" style={{ width: '100%', height: 'auto', display: 'block', marginTop: 14, overflow: 'visible' }}>
                {data.histTicksY.map((t, i) => (
                  <g key={i}>
                    <line x1="46" y1={t.y} x2="700" y2={t.y} stroke="var(--surf2)" strokeWidth="1" />
                    <text x="0" y={t.ty} fill="var(--ink3)" style={{ font: "400 11.5px 'IBM Plex Mono',monospace" }}>{t.label}</text>
                  </g>
                ))}
                {data.bars.map((b, i) => (
                  <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx="3" fill={b.fill} />
                ))}
                <line x1={data.varX.toFixed(1)} y1="12" x2={data.varX.toFixed(1)} y2="256" stroke="var(--down)" strokeWidth="1.6" strokeDasharray="5 4" />
                <text x={(data.varX + 6).toFixed(1)} y="26" fill="var(--down)" textAnchor={data.varAnchor} style={{ font: "400 11.5px 'IBM Plex Mono',monospace" }}>
                  batas kerugian
                </text>
                <line x1="46" y1="256" x2="700" y2="256" stroke="var(--line)" strokeWidth="1" />
                {data.histTicksX.map((t, i) => (
                  <text key={i} x={t.x} y="278" fill="var(--ink3)" textAnchor="middle" style={{ font: "400 11.5px 'IBM Plex Mono',monospace" }}>{t.label}</text>
                ))}
                <text x="373" y="298" fill="var(--ink4)" textAnchor="middle" style={{ font: "400 11px 'IBM Plex Mono',monospace" }}>
                  hasil harian, persen dari nilai portofolio
                </text>
              </svg>
            </Reveal>

            <Reveal order={3} className={bento.span2} style={{ minWidth: 0, background: 'var(--card)', borderRadius: 26, padding: '28px 26px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column' }}>
              <span style={{ font: "400 12px 'IBM Plex Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink3)' }}>
                Contoh saat batas terlampaui
              </span>
              <p style={{ margin: '9px 0 18px', font: "400 13.5px/1.55 'IBM Plex Sans',sans-serif", color: 'var(--ink3)' }}>
                Hari terburuk pada data yang dihitung. Kerugiannya lebih besar daripada batas di atas.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ font: "400 11.5px 'IBM Plex Mono',monospace", letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink4)' }}>Tanggal</span>
                  <span style={{ font: "400 15px 'IBM Plex Sans',sans-serif" }}>{data.worstDate}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ font: "400 11.5px 'IBM Plex Mono',monospace", letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink4)' }}>Kerugian sehari</span>
                  <span style={{ font: "400 34px/1.1 'PP Editorial New','Instrument Serif',serif", color: DOWN, whiteSpace: 'nowrap' }}>{data.worstMoney}</span>
                  <span style={{ font: "400 13px 'IBM Plex Mono',monospace", color: 'var(--ink2)' }}>{data.worstPct} dari nilai portofolio</span>
                </div>
              </div>
              <div style={{ marginTop: 'auto', paddingTop: 20 }}>
                <div style={{ padding: '16px 18px', background: 'var(--surf2)', borderRadius: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ width: 28, height: 28, flex: 'none', borderRadius: '50%', background: 'var(--lime)', color: 'var(--onlime)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', font: "500 14px 'IBM Plex Sans',sans-serif", padding: 0 }}>
                    !
                  </span>
                  <p style={{ margin: 0, font: "400 13.5px/1.6 'IBM Plex Sans',sans-serif", textWrap: 'pretty' }}>
                    Batas kerugian bukan batas yang tidak bisa dilewati. Sekitar 1 dari 20 hari akan melewatinya, dan besarnya bisa jauh
                    melampaui perkiraan.
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal order={4} className={bento.full} style={{ background: 'var(--card)', borderRadius: 26, padding: '28px 32px', boxShadow: 'var(--shadow)' }}>
              <button
                onClick={() => setMethodsOpen((v) => !v)}
                aria-expanded={methodsOpen}
                style={{ width: '100%', padding: 0, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, textAlign: 'left' }}
              >
                <span style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <span style={{ font: "400 12px 'IBM Plex Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink3)' }}>
                    Perbandingan metode perhitungan
                  </span>
                  <span style={{ font: "400 14.5px 'IBM Plex Sans',sans-serif", color: 'var(--ink2)' }}>
                    Tiga varian simulasi historis, dan hasilnya untuk portofolio Anda
                  </span>
                </span>
                <span
                  style={{
                    flex: 'none',
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: 'var(--surf2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: INK,
                    transform: methodsOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform .35s cubic-bezier(.19,.86,.24,1)',
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
              {methodsOpen && (
                <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {data.methods.map((m) => (
                    <div key={m.name} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', padding: '20px 22px', borderRadius: 18, background: m.highlight ? 'var(--surf2)' : 'var(--surf3)' }}>
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                          <span style={{ font: "400 15px 'IBM Plex Sans',sans-serif" }}>{m.name}</span>
                          <span style={{ padding: '4px 10px', borderRadius: 999, background: m.highlight ? 'var(--lime)' : 'var(--line2)', color: m.highlight ? 'var(--onlime)' : 'var(--ink)', font: "400 11.5px 'IBM Plex Mono',monospace" }}>
                            {m.tag}
                          </span>
                        </span>
                        <span style={{ font: "400 13.5px/1.6 'IBM Plex Sans',sans-serif", color: 'var(--ink2)', maxWidth: 720, textWrap: 'pretty' }}>{m.desc}</span>
                      </span>
                      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flex: 'none' }}>
                        <span style={{ font: "400 28px/1.1 'PP Editorial New','Instrument Serif',serif", whiteSpace: 'nowrap' }}>{m.money}</span>
                        <span style={{ font: "400 12.5px 'IBM Plex Mono',monospace", color: 'var(--ink3)' }}>{m.pct}</span>
                      </span>
                    </div>
                  ))}
                  <p style={{ margin: '6px 0 0', font: "400 13.5px/1.65 'IBM Plex Sans',sans-serif", color: 'var(--ink2)', maxWidth: 820, textWrap: 'pretty' }}>
                    Angka yang ditampilkan di bagian atas halaman memakai simulasi historis dasar, karena tidak mengandaikan bentuk sebaran
                    tertentu. Kedua varian FHS menambahkan pemodelan volatilitas bersyarat sehingga lebih peka terhadap perubahan gejolak
                    pasar. Selisih antar metode menunjukkan bahwa hasil perhitungan risiko bergantung pada asumsi yang dipilih.
                  </p>
                </div>
              )}
            </Reveal>

            <Reveal order={4} className={bento.full}>
              <Disclaimer text="Seluruh keluaran platform ini merupakan hasil pemodelan statistik untuk keperluan penelitian akademik. Bukan saran atau rekomendasi investasi." />
            </Reveal>
          </div>
        </div>
      </div>

      <TipDrawer tip={tip} onClose={() => setTip(null)} />
    </>
  );
}
