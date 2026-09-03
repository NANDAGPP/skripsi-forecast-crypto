import { rng, series } from './rng';

export const UP = 'var(--up)';
export const DOWN = 'var(--down)';
export const RISK = 'var(--risk)';
export const INK = 'var(--ink)';

export const ASSETS = [
  {
    id: 'BTC', pair: 'BTC/USDT', short: 'BTC', price: 1752430000, chg: 1.86, fc: 1786900000, mape: 2.4, seed: 7,
    models: [['LSTM', 1791200000, 41], ['GRU', 1778400000, 33], ['XGBoost', 1774050000, 26]] as [string, number, number][],
  },
  {
    id: 'ETH', pair: 'ETH/USDT', short: 'ETH', price: 62480000, chg: -0.94, fc: 61905000, mape: 3.1, seed: 23,
    models: [['LSTM', 61620000, 29], ['GRU', 62140000, 38], ['XGBoost', 61980000, 33]] as [string, number, number][],
  },
  {
    id: 'BNB', pair: 'BNB/USDT', short: 'BNB', price: 11235000, chg: 0.42, fc: 11310500, mape: 3.8, seed: 55,
    models: [['LSTM', 11352000, 24], ['GRU', 11284000, 31], ['XGBoost', 11301000, 45]] as [string, number, number][],
  },
];

export const RISK_META = [
  {
    label: 'Potensi kerugian maksimum', tech: 'VaR 95%',
    plain: 'Dalam 95 dari 100 hari, kerugian diperkirakan tidak melebihi angka ini.',
    tip: 'Potensi kerugian maksimum (istilah teknis: Value at Risk / VaR 95%) adalah batas kerugian harian yang jarang dilewati. Dari 100 hari, sekitar 95 hari kerugian Anda diperkirakan lebih kecil dari angka ini. Sisanya, 5 hari, bisa lebih besar.',
  },
  {
    label: 'Rata-rata kerugian bila melampaui batas', tech: 'CVaR 95%',
    plain: 'Bila hari buruk itu terjadi, sebesar inilah kerugian rata-ratanya.',
    tip: 'Rata-rata kerugian bila melampaui batas (istilah teknis: Conditional VaR / Expected Shortfall) menjawab pertanyaan: kalau kerugian ternyata melewati batas tadi, seberapa besar rata-ratanya? Angka ini selalu lebih besar daripada potensi kerugian maksimum.',
  },
  {
    label: 'Penurunan terdalam yang pernah terjadi', tech: 'Maximum Drawdown',
    plain: 'Jarak dari harga puncak ke titik terendah sesudahnya, pada data historis. Ukuran ini dinyatakan dalam persen, bukan Rupiah.',
    tip: 'Penurunan terdalam yang pernah terjadi (istilah teknis: Maximum Drawdown) mengukur seberapa jauh harga pernah jatuh dari puncaknya sebelum kembali naik, berdasarkan data masa lalu. Ini bukan ramalan, melainkan catatan sejarah.',
  },
];

export const GLOSSARY: Record<string, [string, string]> = {
  LSTM: ['LSTM', 'Model pembelajaran mesin yang mengingat pola urutan harga dalam jangka panjang (istilah teknis: Long Short-Term Memory). Ia cenderung baik saat harga bergerak dalam tren yang jelas.'],
  GRU: ['GRU', 'Model sejenis LSTM namun lebih sederhana (istilah teknis: Gated Recurrent Unit). Biasanya lebih tenang saat harga bergerak naik-turun tanpa arah.'],
  XGBoost: ['XGBoost', 'Model berbasis pohon keputusan yang membaca indikator-indikator harga sebagai masukan. Ia tidak melihat urutan waktu seperti dua model sebelumnya.'],
  Gabungan: ['Gabungan', 'Hasil akhir: rata-rata ketiga perkiraan model, ditimbang sesuai ketepatan masing-masing model belakangan ini. Angka inilah yang ditampilkan sebagai perkiraan harga besok.'],
  bobot: ['Mengapa bobotnya berbeda?', 'Bobot dihitung ulang setiap hari dari tingkat kesalahan tiap model pada 30 hari terakhir. Model yang belakangan lebih sering tepat mendapat bobot lebih besar. Karena itu bobot hari ini bisa berbeda dari kemarin.'],
  sentimen: ['Sentimen pasar', 'Skor 0–100 yang merangkum suasana hati pasar dari beberapa sumber publik: pergerakan harga, volume, dan volatilitas. Skor rendah berarti pelaku pasar sedang takut, skor tinggi berarti terlalu percaya diri. Skor ini bukan perkiraan harga.'],
  kalkulator: ['Hitung untuk portofolio saya', 'Membuka kalkulator risiko portofolio. Di sana Anda memasukkan jumlah kepemilikan tiap aset, lalu ketiga ukuran risiko dihitung ulang dalam Rupiah.'],
};

export function riskOf(seed: number, price: number) {
  const s = series(seed, price, 180);
  const r: number[] = [];
  for (let t = 1; t < s.length; t++) r.push((s[t] - s[t - 1]) / s[t - 1]);
  const so = r.slice().sort((a, b) => a - b);
  const k = Math.max(0, Math.floor(0.05 * so.length) - 1);
  const tail = so.slice(0, k + 1);
  let peak = s[0], dd = 0;
  for (let t = 0; t < s.length; t++) {
    if (s[t] > peak) peak = s[t];
    const d = (peak - s[t]) / peak;
    if (d > dd) dd = d;
  }
  return [-so[k] * 100, -(tail.reduce((x, y) => x + y, 0) / tail.length) * 100, dd * 100];
}

export function sentimentHistory(end: number, n: number) {
  const rnd = rng(97);
  const out: number[] = [];
  let v = 58;
  for (let i = 0; i < n; i++) {
    v += (rnd() - 0.5) * 11 - (v - 44) * 0.06;
    out.push(Math.max(22, Math.min(68, v)));
  }
  out.push(end);
  return out;
}
