'use client';

import { useMemo, useState } from 'react';
import NavBar from '@/components/NavBar';
import HeroIntro from '@/components/HeroIntro';
import Reveal from '@/components/Reveal';
import TipDrawer, { type Tip } from '@/components/TipDrawer';
import Disclaimer from '@/components/Disclaimer';
import bento from '@/components/bento.module.css';
import styles from './page.module.css';
import { idr, idrShort, pct } from '@/lib/format';
import { series } from '@/lib/rng';
import {
  DASHBOARD_ASSETS as ASSETS,
  RISK_META,
  DASHBOARD_GLOSSARY as GLOSSARY,
  UP,
  DOWN,
  INK,
  dashboardRiskOf as riskOf,
  sentimentHistory,
} from '@/lib/api';

const DEFAULT_PORTFOLIO = 100000000;
const RANGES = [30, 90, 180];

export default function DashboardPage() {
  const [assetIdx, setAssetIdx] = useState(0);
  const [range, setRange] = useState(90);
  const [tip, setTip] = useState<Tip>(null);

  const setGlossaryTip = (k: string) => () => {
    const [title, body] = GLOSSARY[k];
    setTip({ title, body });
  };

  const a = ASSETS[assetIdx];
  const up = a.fc >= a.price;
  const dirColor = up ? UP : DOWN;
  const diff = a.fc - a.price;
  const diffP = (diff / a.price) * 100;

  const rows = useMemo(() => {
    const models = a.models.concat([['Gabungan', a.fc, 100]]);
    return models.map((m, i) => {
      const [name, val, weight] = m;
      const final = i === 3;
      return {
        name,
        val: idr(val as number),
        weight: pct(weight as number, 0),
        final,
        tip: setGlossaryTip(name as string),
      };
    });
  }, [a]);

  const risks = useMemo(() => {
    const rv = riskOf(180);
    return RISK_META.map((r, i) => {
      const v = rv[i];
      return {
        label: r.label,
        plain: r.plain,
        money: i === 2 ? pct(v, 1) : idr((DEFAULT_PORTFOLIO * v) / 100),
        pct: i === 2 ? 'dari nilai puncak' : pct(v) + ' dari nilai portofolio',
        tip: () => setTip({ title: r.label + ' (' + r.tech + ')', body: r.tip }),
      };
    });
  }, []);

  const chart = useMemo(() => {
    const full = series(a.seed, a.price, 180);
    const s = full.slice(full.length - range);
    const L = 64, R = 700, T = 20, B = 258;
    const plotW = (R - L) * 0.9;
    const vals = s.concat([a.fc]);
    let lo = Math.min(...vals), hi = Math.max(...vals);
    const padv = (hi - lo) * 0.12 || hi * 0.02;
    lo -= padv;
    hi += padv;
    const X = (i: number) => L + (plotW * i) / (s.length - 1);
    const Y = (v: number) => B - ((v - lo) / (hi - lo)) * (B - T);
    const pts = s.map((v, i) => [X(i), Y(v)]);
    const linePath = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const areaPath = linePath + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + B + ' L' + L + ' ' + B + ' Z';
    const fcX = R, fcY = Y(a.fc), lastX = pts[pts.length - 1][0], lastY = pts[pts.length - 1][1];

    const yTicks = [0, 1, 2, 3, 4].map((k) => {
      const v = lo + ((hi - lo) * k) / 4, y = Y(v);
      return { y: y.toFixed(1), ty: (y + 4).toFixed(1), x1: L - 6, label: idrShort(v) };
    });
    const step = Math.floor((s.length - 1) / 3);
    const xTicks = [0, 1, 2, 3].map((k) => {
      const i = Math.min(k * step, s.length - 1);
      // eslint-disable-next-line react-hooks/purity -- relative day labels only, no SSR caching/offscreen reuse of this client component
      const d = new Date(Date.now() - (s.length - 1 - i) * 86400000);
      return { x: X(i).toFixed(1), label: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) };
    });

    return {
      linePath, areaPath,
      fcPath: 'M' + lastX.toFixed(1) + ' ' + lastY.toFixed(1) + ' L' + fcX + ' ' + fcY.toFixed(1),
      lastX: lastX.toFixed(1), lastY: lastY.toFixed(1), fcX, fcY: fcY.toFixed(1),
      fcLabelX: fcX - 4, fcLabelY: (fcY - 15).toFixed(1),
      yTicks, xTicks,
    };
  }, [a, range]);

  const sentiment = useMemo(() => {
    const score = 43, cx = 120, cy = 128, rr = 92;
    const pol = (t: number) => [cx + rr * Math.cos(Math.PI * (1 - t)), cy - rr * Math.sin(Math.PI * (1 - t))];
    const bounds = [0, 0.25, 0.45, 0.55, 0.76, 1];
    const arcSegs = [];
    for (let i = 0; i < 5; i++) {
      const p0 = pol(bounds[i]), p1 = pol(bounds[i + 1]);
      const active = score / 100 >= bounds[i] && score / 100 < bounds[i + 1];
      arcSegs.push({
        d: 'M' + p0[0].toFixed(1) + ' ' + p0[1].toFixed(1) + ' A' + rr + ' ' + rr + ' 0 0 1 ' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1),
        color: active ? (i < 2 ? DOWN : i > 2 ? UP : 'var(--ink4)') : '#e3e8ee',
      });
    }
    const nd = pol(score / 100);
    const hist = sentimentHistory(score, 29);
    const spark = (w: number, h: number) =>
      hist.map((v, i) => (i ? 'L' : 'M') + ((w * i) / (hist.length - 1)).toFixed(1) + ' ' + (h - (v / 100) * h).toFixed(1)).join(' ');
    return { score, arcSegs, needleX: nd[0].toFixed(1), needleY: nd[1].toFixed(1), sentiPath: spark(300, 90) };
  }, []);

  const stamp = useMemo(
    () => new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) + ', 09.41 WIB',
    []
  );

  return (
    <>
      <HeroIntro />
      <NavBar variant="dashboard" stamp={stamp} />

      <div className={styles.container}>
        <Reveal order={1} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginBottom: 30 }}>
          <span style={{ font: "400 12px 'IBM Plex Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink3)' }}>
            Pilih aset
          </span>
          <div className={styles.assetGrid}>
            {ASSETS.map((x, i) => {
              const sel = i === assetIdx;
              const xUp = x.chg >= 0;
              return (
                <button
                  key={x.id}
                  onClick={() => setAssetIdx(i)}
                  className={styles.assetBtn}
                  style={{
                    background: sel ? 'var(--card)' : 'color-mix(in srgb, var(--card) 78%, transparent)',
                    border: sel ? '1.5px solid ' + INK : '1.5px solid transparent',
                    boxShadow: sel ? '0 4px 20px color-mix(in srgb, var(--ink) 14%, transparent)' : 'none',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span className={styles.assetPair}>{x.pair}</span>
                    <span
                      style={{
                        width: 9, height: 9, borderRadius: '50%',
                        background: sel ? 'var(--lime)' : 'transparent',
                        border: sel ? '1px solid ' + INK : '1px solid #c3cbd2',
                        display: 'block',
                      }}
                    />
                  </span>
                  <span className={styles.assetPrice}>
                    <span className={styles.priceFull}>{idr(x.price)}</span>
                    <span className={styles.priceShort}>{idrShort(x.price)}</span>
                  </span>
                  <span style={{ font: "400 14px 'IBM Plex Mono',monospace", color: xUp ? UP : DOWN }}>
                    <span style={{ whiteSpace: 'nowrap' }}>{(xUp ? '+' : '−') + pct(x.chg)}</span>{' '}
                    <span style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontWeight: 400, color: 'var(--ink3)', whiteSpace: 'nowrap' }}>
                      dalam 24 jam
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </Reveal>

        <div className={bento.grid}>
          <Reveal order={2} className={bento.full} style={{ position: 'relative', overflow: 'hidden', background: 'var(--card)', borderRadius: 32, padding: '44px 34px 40px', boxShadow: 'var(--shadow)' }}>
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, whiteSpace: 'nowrap' }}>
                <span style={{ font: "400 12px 'IBM Plex Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink3)' }}>
                  Perkiraan harga besok
                </span>
                <span style={{ font: "400 12px 'IBM Plex Mono',monospace", color: 'var(--ink4)' }}>· {a.pair}</span>
              </div>
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, flexWrap: 'wrap' }}>
                <span className={styles.forecastNum}>{idr(a.fc)}</span>
                <span
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 999,
                    background: up ? 'color-mix(in srgb, var(--up) 16%, var(--card))' : 'color-mix(in srgb, var(--down) 16%, var(--card))',
                    color: dirColor, font: "400 15px 'IBM Plex Mono',monospace",
                  }}
                >
                  {up ? '▲' : '▼'} {pct(diffP)}
                </span>
              </div>
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ font: "400 21px 'IBM Plex Mono',monospace", color: dirColor }}>
                  {(up ? '+' : '−') + idr(Math.abs(diff))}
                </span>
                <span style={{ font: "400 14px 'IBM Plex Sans',sans-serif", color: 'var(--ink4)' }}>
                  dibanding harga hari ini {idr(a.price)}
                </span>
              </div>
              <div style={{ marginTop: 26, maxWidth: 720, padding: '20px 22px', background: 'var(--surf2)', borderRadius: 18, display: 'flex', gap: 14, alignItems: 'flex-start', textAlign: 'left' }}>
                <span style={{ width: 34, height: 34, flex: 'none', borderRadius: '50%', background: 'var(--lime)', color: 'var(--onlime)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "500 15px 'IBM Plex Sans',sans-serif" }}>
                  !
                </span>
                <p style={{ margin: 0, font: "400 15px/1.6 'IBM Plex Sans',sans-serif", color: 'var(--ink)', textWrap: 'pretty' }}>
                  Perkiraan ini memiliki rata-rata kesalahan sekitar <strong style={{ fontWeight: 500 }}>{pct(a.mape, 1)}</strong> berdasarkan
                  pengujian. Artinya harga sebenarnya besok bisa berada di sekitar{' '}
                  <strong style={{ fontWeight: 500 }}>{idr(a.fc * (1 - a.mape / 100))}</strong>–
                  <strong style={{ fontWeight: 500 }}>{idr(a.fc * (1 + a.mape / 100))}</strong>. Perkiraan bisa meleset.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal order={3} className={bento.span2} style={{ minWidth: 0, background: 'var(--card)', borderRadius: 26, padding: '28px 26px', boxShadow: 'var(--shadow)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ font: "400 12px 'IBM Plex Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink3)' }}>
                Rincian kontribusi model
              </span>
              <button onClick={setGlossaryTip('bobot')} style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', font: "400 13px 'IBM Plex Sans',sans-serif", color: 'var(--risk)', borderBottom: '1px solid var(--linkline)' }}>
                Mengapa bobotnya berbeda?
              </button>
            </div>
            <p style={{ margin: '10px 0 20px', font: "400 13.5px/1.55 'IBM Plex Sans',sans-serif", color: 'var(--ink3)' }}>
              Tiga model menghitung sendiri-sendiri, lalu digabung sesuai bobot hari ini.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 0 10px', font: "400 11px 'IBM Plex Mono',monospace", letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink4)' }}>
              <span>Model</span><span>Perkiraan &amp; bobot</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rows.map((m) => (
                <div key={m.name} style={{ padding: 14, borderRadius: 16, background: m.final ? 'var(--surf2)' : 'var(--surf3)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ font: "400 14px 'IBM Plex Sans',sans-serif", color: INK, fontWeight: m.final ? 500 : 400 }}>{m.name}</span>
                      <button
                        onClick={m.tip}
                        style={{
                          width: 18,
                          height: 18,
                          flex: 'none',
                          borderRadius: '50%',
                          border: 'none',
                          background: 'var(--card)',
                          color: 'var(--ink4)',
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
                    <span style={{ font: "400 17px 'PP Editorial New','Instrument Serif',serif", color: m.final ? dirColor : 'var(--ink2)', whiteSpace: 'nowrap' }}>
                      {m.val}
                    </span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 9 }}>
                    <span style={{ flex: 1, height: 8, background: 'var(--line2)', borderRadius: 5, overflow: 'hidden', display: 'flex' }}>
                      <span
                        style={{
                          width: m.weight, background: m.final ? INK : '#aab5c0', display: 'block', height: '100%',
                          borderRadius: 5, transition: 'width .5s cubic-bezier(.2,.7,.2,1)',
                        }}
                      />
                    </span>
                    <span style={{ font: "400 13px 'IBM Plex Mono',monospace", width: 44, textAlign: 'right' }}>{m.weight}</span>
                  </span>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal order={2} className={bento.span4} style={{ background: 'var(--card)', borderRadius: 26, padding: '28px 30px 20px', boxShadow: 'var(--shadow)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
              <div>
                <span style={{ font: "400 12px 'IBM Plex Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink3)' }}>
                  Harga penutupan harian
                </span>
                <p style={{ margin: '9px 0 0', font: "400 13.5px/1.55 'IBM Plex Sans',sans-serif", color: 'var(--ink3)', maxWidth: 420 }}>
                  Garis penuh adalah harga yang sudah terjadi. Titik putus-putus di ujung kanan adalah perkiraan besok.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 5, flex: 'none', background: 'var(--surf2)', padding: 5, borderRadius: 12 }}>
                {RANGES.map((v) => {
                  const sel = v === range;
                  return (
                    <button
                      key={v}
                      onClick={() => setRange(v)}
                      style={{
                        padding: '9px 15px', font: "400 13px 'IBM Plex Sans',sans-serif", border: 'none', borderRadius: 9, cursor: 'pointer',
                        background: sel ? 'var(--card)' : 'transparent', color: sel ? INK : 'var(--ink3)',
                        boxShadow: sel ? '0 1px 4px color-mix(in srgb, var(--ink) 16%, transparent)' : 'none', transition: 'background .2s',
                      }}
                    >
                      {v} hari
                    </button>
                  );
                })}
              </div>
            </div>
            <svg viewBox="0 0 720 300" style={{ width: '100%', height: 'auto', display: 'block', marginTop: 14, overflow: 'visible' }}>
              <defs>
                <linearGradient id="fillg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c4dc98" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="var(--bg)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {chart.yTicks.map((t, i) => (
                <g key={i}>
                  <line x1={t.x1} y1={t.y} x2="700" y2={t.y} stroke="var(--surf2)" strokeWidth="1" />
                  <text x="0" y={t.ty} fill="var(--ink4)" style={{ font: "400 11.5px 'IBM Plex Mono',monospace" }}>{t.label}</text>
                </g>
              ))}
              {chart.xTicks.map((t, i) => (
                <text key={i} x={t.x} y="292" fill="var(--ink4)" textAnchor="middle" style={{ font: "400 11.5px 'IBM Plex Mono',monospace" }}>{t.label}</text>
              ))}
              <path d={chart.areaPath} fill="url(#fillg)" />
              <path d={chart.linePath} fill="none" stroke="var(--line3)" strokeWidth="2" strokeLinejoin="round" />
              <path d={chart.fcPath} fill="none" stroke={dirColor} strokeWidth="2" strokeDasharray="5 4" />
              <circle cx={chart.lastX} cy={chart.lastY} r="3.5" fill="var(--line3)" />
              <circle cx={chart.fcX} cy={chart.fcY} r="6" fill="#fff" stroke={dirColor} strokeWidth="2.5" />
              <text x={chart.fcLabelX} y={chart.fcLabelY} fill={dirColor} textAnchor="end" style={{ font: "400 11.5px 'IBM Plex Mono',monospace" }}>perkiraan</text>
            </svg>
          </Reveal>

          <Reveal order={3} className={bento.full} style={{ background: 'var(--card)', borderRadius: 26, padding: '30px 32px', boxShadow: 'var(--shadow)' }}>
            <span style={{ font: "400 12px 'IBM Plex Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink3)' }}>
              Ringkasan risiko
            </span>
            <p style={{ margin: '9px 0 22px', font: "400 13.5px/1.55 'IBM Plex Sans',sans-serif", color: 'var(--ink3)' }}>
              Dihitung atas portofolio acuan (bobot seimbang 1/3 tiap aset, diseimbangkan ulang harian) dengan nilai contoh {idr(DEFAULT_PORTFOLIO)}.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
              {risks.map((r) => (
                <div key={r.label} style={{ background: 'var(--surf2)', borderRadius: 18, padding: '18px 18px 17px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <span style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                    <span style={{ font: "400 13px/1.4 'IBM Plex Sans',sans-serif", color: 'var(--ink)' }}>{r.label}</span>
                    <button
                      onClick={r.tip}
                      style={{
                        width: 18,
                        height: 18,
                        flex: 'none',
                        borderRadius: '50%',
                        border: 'none',
                        background: 'var(--card)',
                        color: 'var(--ink4)',
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
                  <span style={{ font: "400 13px 'IBM Plex Mono',monospace", color: 'var(--ink4)' }}>{r.pct}</span>
                  <span style={{ font: "400 13px/1.55 'IBM Plex Sans',sans-serif", color: 'var(--ink4)', marginTop: 4, textWrap: 'pretty' }}>{r.plain}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <a
                href="/kalkulator-risiko"
                style={{
                  marginTop: 24, height: 58, padding: '0 32px', border: 'none', background: 'var(--lime)', color: 'var(--onlime)',
                  borderRadius: 999, font: "500 15.5px 'IBM Plex Sans',sans-serif", textDecoration: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, whiteSpace: 'nowrap',
                }}
              >
                Hitung untuk portofolio saya <span style={{ font: "400 15px 'IBM Plex Mono',monospace" }}>→</span>
              </a>
            </div>
          </Reveal>
        </div>

        <Reveal order={4} style={{ marginTop: 22, background: 'var(--card)', borderRadius: 26, padding: 30, boxShadow: 'var(--shadow)' }}>
          <span style={{ font: "400 12px 'IBM Plex Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink3)' }}>
            Sentimen pasar
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 34, alignItems: 'center', marginTop: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <svg viewBox="0 0 240 150" style={{ width: 230, height: 'auto', display: 'block' }}>
                {sentiment.arcSegs.map((s, i) => (
                  <path key={i} d={s.d} fill="none" stroke={s.color} strokeWidth="14" />
                ))}
                <line x1="120" y1="128" x2={sentiment.needleX} y2={sentiment.needleY} stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="120" cy="128" r="5" fill="var(--ink)" />
                <text x="18" y="146" fill="var(--ink4)" style={{ font: "400 11px 'IBM Plex Mono',monospace" }}>0</text>
                <text x="210" y="146" fill="var(--ink4)" style={{ font: "400 11px 'IBM Plex Mono',monospace" }}>100</text>
              </svg>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span className={styles.sentiScore}>{sentiment.score}</span>
                <span style={{ font: "400 17px 'IBM Plex Sans',sans-serif" }}>Takut</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ font: "400 13.5px 'IBM Plex Sans',sans-serif" }}>Suasana pasar hari ini</span>
                <button
                  onClick={setGlossaryTip('sentimen')}
                  style={{
                    width: 18,
                    height: 18,
                    flex: 'none',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'var(--surf2)',
                    color: 'var(--ink4)',
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
              </div>
              <p style={{ margin: 0, maxWidth: 520, font: "400 15px/1.65 'IBM Plex Sans',sans-serif", color: 'var(--ink2)', textWrap: 'pretty' }}>
                Pelaku pasar sedang cenderung takut. Secara historis, keadaan seperti ini disertai pergerakan harga yang lebih bergejolak dari
                biasanya. Skor ini menggambarkan suasana pasar, bukan arah harga.
              </p>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', font: "400 12px 'IBM Plex Mono',monospace", color: 'var(--ink4)' }}>
                <span>0–24 Sangat Takut</span><span>25–44 Takut</span><span>45–55 Netral</span><span>56–75 Serakah</span><span>76–100 Sangat Serakah</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <span style={{ font: "400 11px 'IBM Plex Mono',monospace", letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink4)' }}>
                30 hari terakhir
              </span>
              <svg viewBox="0 0 300 90" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <line x1="0" y1="45" x2="300" y2="45" stroke="var(--surf2)" strokeWidth="1" />
                <path d={sentiment.sentiPath} fill="none" stroke="var(--line3)" strokeWidth="1.8" />
              </svg>
              <span style={{ font: "400 12.5px 'IBM Plex Sans',sans-serif", color: 'var(--ink4)' }}>Garis tengah = Netral (50)</span>
            </div>
          </div>
        </Reveal>

        <Reveal order={4}>
          <Disclaimer text="Seluruh keluaran platform ini merupakan hasil pemodelan statistik untuk keperluan penelitian akademik. Bukan saran atau rekomendasi investasi." />
        </Reveal>
      </div>

      <TipDrawer tip={tip} onClose={() => setTip(null)} />
    </>
  );
}
