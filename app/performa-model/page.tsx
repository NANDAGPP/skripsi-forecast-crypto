'use client';

import { useMemo, useState } from 'react';
import NavBar from '@/components/NavBar';
import BackgroundHills from '@/components/BackgroundHills';
import Reveal from '@/components/Reveal';
import TipDrawer, { type Tip } from '@/components/TipDrawer';
import Disclaimer from '@/components/Disclaimer';
import bento from '@/components/bento.module.css';
import styles from './page.module.css';
import { idrShort3, pct } from '@/lib/format';
import { rng, series } from '@/lib/rng';
import { PERFORMA_ASSETS as ASSETS, PERFORMA_MODELS as MODELS, PERFORMA_GLOSSARY as GLOSS, weightHistory, INK } from '@/lib/api';

export default function PerformaModelPage() {
  const [assetIdx, setAssetIdx] = useState(0);
  const [range, setRange] = useState(90);
  const [tip, setTip] = useState<Tip>(null);

  const setGlossTip = (k: keyof typeof GLOSS) => () => {
    const [title, body] = GLOSS[k];
    setTip({ title, body });
  };

  const a = ASSETS[assetIdx];

  const data = useMemo(() => {
    const scaled = MODELS.map((m) => ({
      m,
      mape: m.mape * a.scale,
      mae: m.mae * a.scale,
      dir: Math.max(49, m.dir - (a.scale - 1) * 9),
      rmse: a.price * ((m.mape * a.scale) / 100) * 1.32,
    }));
    const bestMape = Math.min(...scaled.map((s) => s.mape));
    const bestMae = Math.min(...scaled.map((s) => s.mae));
    const bestDir = Math.max(...scaled.map((s) => s.dir));
    const bestRmse = Math.min(...scaled.map((s) => s.rmse));

    const rows = scaled.map((s) => {
      const base = s.m.kind === 'base';
      const main = s.m.kind === 'main';
      return {
        name: s.m.name, note: s.m.note, tag: s.m.tag, main, base,
        mape: pct(s.mape, 1), mae: pct(s.mae, 1), dir: pct(s.dir, 1), rmse: idrShort3(s.rmse),
        mapeBest: Math.abs(s.mape - bestMape) < 1e-9,
        maeBest: Math.abs(s.mae - bestMae) < 1e-9,
        dirBest: Math.abs(s.dir - bestDir) < 1e-9,
        rmseBest: Math.abs(s.rmse - bestRmse) < 1e-9,
      };
    });

    // prediksi vs aktual
    const N = 180;
    const actual = series(a.seed, a.price, N);
    const prnd = rng(a.seed + 991);
    const mainErr = scaled[0].mape / 100;
    const pred = actual.map((v, i) => (i === 0 ? v : actual[i - 1] * (1 + (prnd() - 0.5) * mainErr * 3.1)));
    const n = range;
    const act = actual.slice(actual.length - n), prd = pred.slice(pred.length - n);

    const L = 58, R = 710, T = 16, B = 262;
    let lo = Math.min(Math.min(...act), Math.min(...prd));
    let hi = Math.max(Math.max(...act), Math.max(...prd));
    const padv = (hi - lo) * 0.1 || hi * 0.02;
    lo -= padv; hi += padv;
    const X = (i: number) => L + ((R - L) * i) / (act.length - 1);
    const Y = (v: number) => B - ((v - lo) / (hi - lo)) * (B - T);
    const toPath = (arr: number[]) => arr.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join(' ');
    const bandPath =
      act.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join(' ') +
      ' ' +
      prd
        .slice()
        .reverse()
        .map((v, i) => 'L' + X(prd.length - 1 - i).toFixed(1) + ' ' + Y(v).toFixed(1))
        .join(' ') +
      ' Z';

    const yTicks = [0, 1, 2, 3, 4].map((k) => {
      const v = lo + ((hi - lo) * k) / 4, y = Y(v);
      return { y: y.toFixed(1), ty: (y + 4).toFixed(1), label: idrShort3(v) };
    });
    const step = Math.floor((act.length - 1) / 3);
    const xTicks = [0, 1, 2, 3].map((k) => {
      const i = Math.min(k * step, act.length - 1);
      // eslint-disable-next-line react-hooks/purity -- relative day label only, no SSR caching/offscreen reuse of this client component
      const d = new Date(Date.now() - (act.length - 1 - i) * 86400000);
      return { x: X(i).toFixed(1), label: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) };
    });

    // sebaran kesalahan
    const errs: number[] = [];
    for (let i = 1; i < actual.length; i++) errs.push(((pred[i] - actual[i]) / actual[i]) * 100);
    const span = Math.max(...errs.map(Math.abs)) * 1.05 || 1;
    const NB = 22, counts = new Array(NB).fill(0);
    errs.forEach((v) => {
      const b = Math.floor(((v + span) / (2 * span)) * NB);
      counts[Math.max(0, Math.min(NB - 1, b))]++;
    });
    const maxC = Math.max(...counts) || 1;
    const EL = 46, ER = 706, ET = 10, EB = 182, bw = (ER - EL) / NB;
    const errBars = counts.map((c, i) => {
      const h = (c / maxC) * (EB - ET);
      return { x: (EL + i * bw + 1.4).toFixed(1), w: (bw - 2.8).toFixed(1), y: (EB - h).toFixed(1), h: Math.max(0, h).toFixed(1) };
    });
    const eX = (p: number) => EL + ((p + span) / (2 * span)) * (ER - EL);
    const errTicks = [-span * 0.75, -span * 0.35, span * 0.35, span * 0.75].map((p) => ({
      x: eX(p).toFixed(1),
      label: (p > 0 ? '+' : '−') + Math.abs(p).toFixed(1) + '%',
    }));

    const withinBand = (errs.filter((e) => Math.abs(e) <= scaled[0].mape).length / errs.length) * 100;

    return {
      rows,
      actualPath: toPath(act), predPath: toPath(prd), bandPath, yTicks, xTicks,
      errBars, errTicks, zeroX: eX(0).toFixed(1),
      summary: [
        { label: 'Rata-rata kesalahan', value: pct(scaled[0].mape, 1), note: 'Setara sekitar ' + idrShort3((a.price * scaled[0].mape) / 100) + ' pada harga sekarang.' },
        { label: 'Arah benar', value: pct(scaled[0].dir, 1), note: 'Menebak acak menghasilkan sekitar 50 persen.' },
        { label: 'Perkiraan di dalam rentang', value: pct(withinBand, 1), note: 'Sebanyak itu hari yang kesalahannya tidak melebihi rata-rata.' },
      ],
    };
  }, [a, range]);

  return (
    <>
      <BackgroundHills />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <NavBar variant="sub" subtitle="Performa model" />

        <div className={styles.container}>
          <Reveal order={1} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16, marginBottom: 34 }}>
            <span style={{ font: "400 12px 'IBM Plex Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink3)' }}>
              Artboard 5
            </span>
            <h1 className={styles.heading}>Seberapa sering model ini benar?</h1>
            <p style={{ margin: 0, maxWidth: 680, font: "400 15.5px/1.65 'IBM Plex Sans',sans-serif", color: 'var(--ink2)', textWrap: 'pretty' }}>
              Hasil pengujian pada 180 hari terakhir yang tidak dipakai saat melatih model. Semua angka di halaman ini adalah catatan masa
              lalu, bukan jaminan hasil ke depan.
            </p>
          </Reveal>

          <Reveal order={1} style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            <div style={{ display: 'flex', gap: 5, background: 'var(--surf2)', padding: 5, borderRadius: 14 }}>
              {ASSETS.map((x, i) => {
                const sel = i === assetIdx;
                return (
                  <button
                    key={x.short}
                    onClick={() => setAssetIdx(i)}
                    style={{
                      padding: '10px 22px', border: 'none', borderRadius: 10, cursor: 'pointer', font: "400 14px 'IBM Plex Mono',monospace",
                      background: sel ? 'var(--card)' : 'transparent', color: sel ? INK : 'var(--ink3)',
                      boxShadow: sel ? '0 1px 4px color-mix(in srgb, var(--ink) 16%, transparent)' : 'none', transition: 'background .2s',
                    }}
                  >
                    {x.short}
                  </button>
                );
              })}
            </div>
          </Reveal>

          <div className={bento.grid}>
            <Reveal order={2} className={bento.full} style={{ background: 'var(--card)', borderRadius: 32, padding: '34px 34px 30px', boxShadow: 'var(--shadow)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                <span style={{ font: "400 12px 'IBM Plex Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink3)' }}>
                  Perbandingan enam pendekatan — {a.pair}
                </span>
                <span style={{ font: "400 12.5px 'IBM Plex Mono',monospace", color: 'var(--ink3)' }}>Angka lebih kecil berarti lebih tepat</span>
              </div>

              <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className={styles.tableHead}>
                  <span>Pendekatan</span>
                  {(['mape', 'mae', 'arah', 'rmse'] as const).map((k) => {
                    const labels: Record<string, string> = { mape: 'MAPE', mae: 'MAE', arah: 'Arah benar', rmse: 'RMSE' };
                    return (
                      <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {labels[k]}
                        <button
                          onClick={setGlossTip(k)}
                          aria-label={`Penjelasan ${labels[k]}`}
                          style={{
                            width: 18, height: 18, flex: 'none', borderRadius: '50%', border: 'none',
                            background: 'var(--surf2)', color: 'var(--ink2)', font: "500 11px 'IBM Plex Sans',sans-serif",
                            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0, lineHeight: 1,
                          }}
                        >?
                        </button>
                      </span>
                    );
                  })}
                </div>

                {data.rows.map((r) => (
                  <div key={r.name} className={styles.row} style={{ background: r.main ? 'var(--surf2)' : r.base ? 'var(--warm)' : 'var(--surf3)' }}>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                        <span style={{ font: (r.main ? '500' : '400') + " 15.5px 'IBM Plex Sans',sans-serif", color: INK }}>{r.name}</span>
                        <span style={{ padding: '4px 10px', borderRadius: 999, background: r.main ? 'var(--lime)' : r.base ? 'var(--warm2)' : 'var(--line2)', color: r.main ? 'var(--onlime)' : 'var(--ink)', font: "400 11.5px 'IBM Plex Mono',monospace", whiteSpace: 'nowrap' }}>
                          {r.tag}
                        </span>
                      </span>
                      <span style={{ font: "400 12.5px/1.5 'IBM Plex Sans',sans-serif", color: 'var(--ink2)' }}>{r.note}</span>
                    </span>
                    <span className={styles.metrics}>
                      <span className={styles.metric}>
                        <span className={styles.metricLabel}>MAPE</span>
                        <span style={{ font: (r.mapeBest ? '500' : '400') + " 16px 'IBM Plex Mono',monospace", color: r.mapeBest ? 'var(--up)' : INK, whiteSpace: 'nowrap' }}>{r.mape}</span>
                      </span>
                      <span className={styles.metric}>
                        <span className={styles.metricLabel}>MAE</span>
                        <span style={{ font: (r.maeBest ? '500' : '400') + " 16px 'IBM Plex Mono',monospace", color: r.maeBest ? 'var(--up)' : INK, whiteSpace: 'nowrap' }}>{r.mae}</span>
                      </span>
                      <span className={styles.metric}>
                        <span className={styles.metricLabel}>Arah benar</span>
                        <span style={{ font: (r.dirBest ? '500' : '400') + " 16px 'IBM Plex Mono',monospace", color: r.dirBest ? 'var(--up)' : INK, whiteSpace: 'nowrap' }}>{r.dir}</span>
                      </span>
                      <span className={styles.metric}>
                        <span className={styles.metricLabel}>RMSE</span>
                        <span style={{ font: (r.rmseBest ? '500' : '400') + " 16px 'IBM Plex Mono',monospace", color: r.rmseBest ? 'var(--up)' : INK, whiteSpace: 'nowrap' }}>{r.rmse}</span>
                      </span>
                    </span>
                  </div>
                ))}
              </div>

              <p style={{ margin: '22px 0 0', font: "400 13.5px/1.65 'IBM Plex Sans',sans-serif", color: 'var(--ink2)', maxWidth: 900, textWrap: 'pretty' }}>
                Dua baris berlatar berbeda adalah pembanding sederhana. ARIMA memodelkan tren dan korelasi antar waktu, sedangkan naive
                random walk menyalin harga hari ini sebagai perkiraan besok. Selisih terhadap keduanya menunjukkan seberapa besar
                manfaat nyata dari model yang lebih rumit.
              </p>
            </Reveal>

            <Reveal order={2} className={bento.span4} style={{ minWidth: 0, background: 'var(--card)', borderRadius: 26, padding: '28px 30px 20px', boxShadow: 'var(--shadow)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                <div>
                  <span style={{ font: "400 12px 'IBM Plex Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink3)' }}>
                    Perkiraan dibandingkan harga sebenarnya
                  </span>
                  <p style={{ margin: '9px 0 0', font: "400 13.5px/1.55 'IBM Plex Sans',sans-serif", color: 'var(--ink2)', maxWidth: 520 }}>
                    Garis gelap adalah harga yang benar-benar terjadi. Garis biru adalah perkiraan model gabungan untuk hari yang sama.
                    Jarak antar keduanya adalah kesalahan.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 5, flex: 'none', background: 'var(--surf2)', padding: 5, borderRadius: 12 }}>
                  {[90, 180].map((v) => {
                    const sel = v === range;
                    return (
                      <button
                        key={v}
                        onClick={() => setRange(v)}
                        style={{ padding: '9px 15px', border: 'none', borderRadius: 9, cursor: 'pointer', font: "400 13px 'IBM Plex Sans',sans-serif", background: sel ? 'var(--card)' : 'transparent', color: sel ? INK : 'var(--ink3)', boxShadow: sel ? '0 1px 4px color-mix(in srgb, var(--ink) 16%, transparent)' : 'none' }}
                      >
                        {v} hari
                      </button>
                    );
                  })}
                </div>
              </div>

              <svg viewBox="0 0 720 300" style={{ width: '100%', height: 'auto', display: 'block', marginTop: 14, overflow: 'visible' }}>
                {data.yTicks.map((t, i) => (
                  <g key={i}>
                    <line x1="58" y1={t.y} x2="710" y2={t.y} stroke="var(--surf2)" strokeWidth="1" />
                    <text x="0" y={t.ty} fill="var(--ink4)" style={{ font: "400 11.5px 'IBM Plex Mono',monospace" }}>{t.label}</text>
                  </g>
                ))}
                <path d={data.bandPath} fill="var(--band)" />
                <path d={data.actualPath} fill="none" stroke="var(--line3)" strokeWidth="2" strokeLinejoin="round" />
                <path d={data.predPath} fill="none" stroke="var(--risk)" strokeWidth="1.8" strokeDasharray="4 3" strokeLinejoin="round" />
                {data.xTicks.map((t, i) => (
                  <text key={i} x={t.x} y="292" fill="var(--ink4)" textAnchor="middle" style={{ font: "400 11.5px 'IBM Plex Mono',monospace" }}>{t.label}</text>
                ))}
              </svg>

              <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', padding: '6px 0 4px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, font: "400 12.5px 'IBM Plex Sans',sans-serif", color: 'var(--ink2)' }}>
                  <span style={{ width: 22, height: 2, background: 'var(--line3)', display: 'block' }} />Harga sebenarnya
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, font: "400 12.5px 'IBM Plex Sans',sans-serif", color: 'var(--ink2)' }}>
                  <span style={{ width: 22, height: 0, borderTop: '2px dashed var(--risk)', display: 'block' }} />Perkiraan model gabungan
                </span>
              </div>
            </Reveal>

            <Reveal order={3} className={bento.span2} style={{ minWidth: 0, background: 'var(--card)', borderRadius: 26, padding: '28px 26px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <span style={{ font: "400 12px 'IBM Plex Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink3)' }}>
                Ringkasan model gabungan
              </span>
              {data.summary.map((s) => (
                <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <span style={{ font: "400 12.5px 'IBM Plex Sans',sans-serif", color: 'var(--ink2)' }}>{s.label}</span>
                  <span className={styles.summaryValue}>{s.value}</span>
                  <span style={{ font: "400 12.5px/1.55 'IBM Plex Sans',sans-serif", color: 'var(--ink2)', textWrap: 'pretty' }}>{s.note}</span>
                </div>
              ))}
              <div style={{ marginTop: 'auto', padding: '16px 18px', background: 'var(--surf2)', borderRadius: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ width: 28, height: 28, flex: 'none', borderRadius: '50%', background: 'var(--lime)', color: 'var(--onlime)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "500 14px 'IBM Plex Sans',sans-serif" }}>
                  !
                </span>
                <p style={{ margin: 0, font: "400 13px/1.6 'IBM Plex Sans',sans-serif", textWrap: 'pretty' }}>
                  Model paling sering meleset justru pada hari-hari harga bergerak besar, yaitu saat perkiraan paling dibutuhkan.
                </p>
              </div>
            </Reveal>

            <Reveal order={4} className={bento.full} style={{ background: 'var(--card)', borderRadius: 26, padding: '30px 32px', boxShadow: 'var(--shadow)' }}>
              <span style={{ font: "400 12px 'IBM Plex Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink3)' }}>
                Sebaran kesalahan harian
              </span>
              <p style={{ margin: '9px 0 20px', font: "400 13.5px/1.55 'IBM Plex Sans',sans-serif", color: 'var(--ink2)', maxWidth: 760 }}>
                Setiap batang adalah banyaknya hari dengan kesalahan sebesar itu. Batang di sebelah kiri nol berarti model menebak terlalu
                rendah, di sebelah kanan berarti terlalu tinggi.
              </p>
              <svg viewBox="0 0 720 220" style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
                {data.errBars.map((b, i) => (
                  <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx="3" fill="var(--barfill)" />
                ))}
                <line x1="46" y1="182" x2="706" y2="182" stroke="var(--line)" strokeWidth="1" />
                <line x1={data.zeroX} y1="10" x2={data.zeroX} y2="182" stroke="var(--ink)" strokeWidth="1.4" />
                <text x={data.zeroX} y="204" fill="var(--ink)" textAnchor="middle" style={{ font: "400 11.5px 'IBM Plex Mono',monospace" }}>tepat</text>
                {data.errTicks.map((t, i) => (
                  <text key={i} x={t.x} y="204" fill="var(--ink4)" textAnchor="middle" style={{ font: "400 11.5px 'IBM Plex Mono',monospace" }}>{t.label}</text>
                ))}
                <text x="376" y="218" fill="var(--ink4)" textAnchor="middle" style={{ font: "400 11px 'IBM Plex Mono',monospace" }}>
                  selisih perkiraan terhadap harga sebenarnya
                </text>
              </svg>
            </Reveal>

            {/* KF-13: Riwayat bobot ensemble */}
            <Reveal order={4} className={bento.full} style={{ background: 'var(--card)', borderRadius: 26, padding: '28px 30px 22px', boxShadow: 'var(--shadow)' }}>
              <span style={{ font: "400 12px 'IBM Plex Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink3)' }}>
                Riwayat pergerakan bobot ensemble
              </span>
              <p style={{ margin: '9px 0 18px', font: "400 13.5px/1.55 'IBM Plex Sans',sans-serif", color: 'var(--ink2)', maxWidth: 720 }}>
                Bobot masing-masing model dalam gabungan dihitung ulang setiap hari berdasarkan kesalahan 30 hari terakhir.
                Grafik di bawah menunjukkan bagaimana dominasi model bergeser seiring waktu.
              </p>

              {(() => {
                const wh = weightHistory(180);
                const L = 56, R = 710, T = 12, B = 180;
                const X = (i: number) => L + ((R - L) * i) / (wh.length - 1);
                const Y = (v: number) => B - ((v - 10) / 55) * (B - T);
                const toPath = (arr: number[]) => arr.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join(' ');
                const colors = ['var(--risk)', 'var(--up)', 'var(--ink4)'];
                const labels = ['LSTM', 'GRU', 'XGBoost'];
                const paths = [
                  wh.map((w) => w.lstm),
                  wh.map((w) => w.gru),
                  wh.map((w) => w.xgboost),
                ];
                const yTicks = [15, 25, 35, 45].map((v) => ({ y: Y(v).toFixed(1), label: v + '%' }));
                return (
                  <>
                    <svg viewBox="0 0 740 200" style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
                      {yTicks.map((t, i) => (
                        <g key={i}>
                          <line x1={L} y1={t.y} x2={R} y2={t.y} stroke="var(--line2)" strokeWidth="1" />
                          <text x="0" y={Number(t.y) + 4} fill="var(--ink4)" style={{ font: "400 10.5px 'IBM Plex Mono',monospace" }}>{t.label}</text>
                        </g>
                      ))}
                      {paths.map((p, pi) => (
                        <path key={pi} d={toPath(p)} fill="none" stroke={colors[pi]} strokeWidth="1.8" strokeLinejoin="round" />
                      ))}
                    </svg>
                    <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', paddingTop: 6 }}>
                      {labels.map((lb, i) => (
                        <span key={lb} style={{ display: 'flex', alignItems: 'center', gap: 8, font: "400 12.5px 'IBM Plex Sans',sans-serif", color: 'var(--ink2)' }}>
                          <span style={{ width: 18, height: 2, background: colors[i], display: 'block' }} />{lb}
                        </span>
                      ))}
                    </div>
                  </>
                );
              })()}
            </Reveal>

            <Reveal order={4} className={bento.full}>
              <Disclaimer text="Angka pada halaman ini berasal dari pengujian atas data masa lalu. Performa yang sama tidak dijamin berulang. Seluruh keluaran platform ini bukan saran atau rekomendasi investasi." />
            </Reveal>
          </div>
        </div>
      </div>

      <TipDrawer tip={tip} onClose={() => setTip(null)} />
    </>
  );
}
