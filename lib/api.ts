/**
 * lib/api.ts
 * ─────────────────────────────────────────────────────────────
 * Satu-satunya sumber data tiruan untuk seluruh halaman.
 * Ketika backend sudah siap, ganti isi setiap fungsi di bawah
 * dengan panggilan fetch — bentuk keluaran tetap sama.
 * ─────────────────────────────────────────────────────────────
 */

import { rng, series } from './rng';

// ── Mode data contoh ────────────────────────────────────────
export const SAMPLE_MODE = true;

// ── Warna referensi (CSS custom properties) ─────────────────
export const UP = 'var(--up)';
export const DOWN = 'var(--down)';
export const RISK = 'var(--risk)';
export const INK = 'var(--ink)';

// ═════════════════════════════════════════════════════════════
//  DASBOR — KF-02 s.d. KF-08
// ═════════════════════════════════════════════════════════════

export const DASHBOARD_ASSETS = [
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

export const DASHBOARD_GLOSSARY: Record<string, [string, string]> = {
  LSTM: ['LSTM', 'Model pembelajaran mesin yang mengingat pola urutan harga dalam jangka panjang (istilah teknis: Long Short-Term Memory). Ia cenderung baik saat harga bergerak dalam tren yang jelas.'],
  GRU: ['GRU', 'Model sejenis LSTM namun lebih sederhana (istilah teknis: Gated Recurrent Unit). Biasanya lebih tenang saat harga bergerak naik-turun tanpa arah.'],
  XGBoost: ['XGBoost', 'Model berbasis pohon keputusan yang membaca indikator-indikator harga sebagai masukan. Ia tidak melihat urutan waktu seperti dua model sebelumnya.'],
  Gabungan: ['Gabungan', 'Hasil akhir: rata-rata ketiga perkiraan model, ditimbang sesuai ketepatan masing-masing model belakangan ini. Angka inilah yang ditampilkan sebagai perkiraan harga besok.'],
  bobot: ['Mengapa bobotnya berbeda?', 'Bobot dihitung ulang setiap hari dari tingkat kesalahan tiap model pada 30 hari terakhir. Model yang belakangan lebih sering tepat mendapat bobot lebih besar. Karena itu bobot hari ini bisa berbeda dari kemarin.'],
  sentimen: ['Sentimen pasar', 'Skor 0–100 yang merangkum suasana hati pasar dari beberapa sumber publik: pergerakan harga, volume, dan volatilitas. Skor rendah berarti pelaku pasar sedang takut, skor tinggi berarti terlalu percaya diri. Skor ini bukan perkiraan harga.'],
  kalkulator: ['Hitung untuk portofolio saya', 'Membuka kalkulator risiko portofolio. Di sana Anda memasukkan jumlah kepemilikan tiap aset, lalu ketiga ukuran risiko dihitung ulang dalam Rupiah.'],
};

/** KF-07: Indikator risiko PORTOFOLIO ACUAN (bobot seimbang 1/3 tiap aset, diseimbangkan ulang harian) */
export function dashboardRiskOf(n: number = 180) {
  const btc = series(7, 1752430000, n);
  const eth = series(23, 62480000, n);
  const bnb = series(55, 11235000, n);

  const rets: number[] = [];
  for (let t = 1; t < btc.length; t++) {
    const rBtc = (btc[t] - btc[t - 1]) / btc[t - 1];
    const rEth = (eth[t] - eth[t - 1]) / eth[t - 1];
    const rBnb = (bnb[t] - bnb[t - 1]) / bnb[t - 1];
    rets.push((rBtc + rEth + rBnb) / 3);
  }

  const sorted = rets.slice().sort((a, b) => a - b);
  const k = Math.max(0, Math.floor(0.05 * sorted.length) - 1);
  const tail = sorted.slice(0, k + 1);
  const varPct = -sorted[k] * 100;
  const cvarPct = -(tail.reduce((x, y) => x + y, 0) / tail.length) * 100;

  let cum = 1.0, peak = 1.0, maxDd = 0;
  for (let t = 0; t < rets.length; t++) {
    cum *= (1 + rets[t]);
    if (cum > peak) peak = cum;
    const d = (peak - cum) / peak;
    if (d > maxDd) maxDd = d;
  }
  const ddPct = maxDd * 100;

  return [varPct, cvarPct, ddPct];
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

// ═════════════════════════════════════════════════════════════
//  KALKULATOR RISIKO — KF-09 s.d. KF-11
// ═════════════════════════════════════════════════════════════

export const KALKULATOR_ASSETS = [
  { id: 'BTC', pair: 'BTC/USDT', short: 'BTC', price: 1752430000, seed: 7, step: 0.001, def: 0.05 },
  { id: 'ETH', pair: 'ETH/USDT', short: 'ETH', price: 62480000, seed: 23, step: 0.01, def: 0.8 },
  { id: 'BNB', pair: 'BNB/USDT', short: 'BNB', price: 11235000, seed: 55, step: 0.1, def: 4 },
];

export const KALKULATOR_GLOSSARY: Record<string, [string, string]> = {
  var: [
    'Potensi kerugian maksimum (VaR 95%)',
    'Batas kerugian harian yang jarang dilewati. Dari 100 hari, sekitar 95 hari kerugian Anda diperkirakan lebih kecil dari angka ini. Sisanya, 5 hari, bisa lebih besar. Angka ini dihitung dengan mengurutkan hasil 180 hari terakhir, lalu mengambil nilai pada peringkat 5 persen terburuk.',
  ],
  cvar: [
    'Rata-rata kerugian bila melampaui batas (CVaR 95%)',
    'Menjawab pertanyaan: kalau kerugian ternyata melewati batas tadi, seberapa besar rata-ratanya? Dihitung sebagai rata-rata dari seluruh hari yang kerugiannya melebihi batas. Angka ini selalu lebih besar daripada potensi kerugian maksimum.',
  ],
  dd: [
    'Penurunan terdalam yang pernah terjadi (Maximum Drawdown)',
    'Mengukur seberapa jauh nilai portofolio pernah jatuh dari puncaknya sebelum kembali naik, berdasarkan data 180 hari terakhir. Ini bukan ramalan, melainkan catatan sejarah. Ukuran ini dinyatakan dalam persen dan Rupiah dari nilai puncak, bukan dari nilai hari ini.',
  ],
};

// ═════════════════════════════════════════════════════════════
//  PERFORMA MODEL — KF-12, KF-13
// ═════════════════════════════════════════════════════════════

export const PERFORMA_ASSETS = [
  { pair: 'BTC/USDT', short: 'BTC', price: 1752430000, seed: 7, scale: 1 },
  { pair: 'ETH/USDT', short: 'ETH', price: 62480000, seed: 23, scale: 1.28 },
  { pair: 'BNB/USDT', short: 'BNB', price: 11235000, seed: 55, scale: 1.55 },
];

export const PERFORMA_MODELS = [
  { name: 'Gabungan tiga model', tag: 'ensemble', kind: 'main' as const, mape: 2.4, mae: 2.1, dir: 58.9, note: 'Rata-rata tertimbang dari LSTM, GRU, dan XGBoost.' },
  { name: 'LSTM', tag: 'pembelajaran mesin', kind: 'ml' as const, mape: 2.7, mae: 2.4, dir: 57.2, note: 'Mengingat pola urutan harga jangka panjang.' },
  { name: 'GRU', tag: 'pembelajaran mesin', kind: 'ml' as const, mape: 2.9, mae: 2.5, dir: 56.1, note: 'Serupa LSTM, strukturnya lebih sederhana.' },
  { name: 'XGBoost', tag: 'pembelajaran mesin', kind: 'ml' as const, mape: 3.1, mae: 2.7, dir: 54.8, note: 'Membaca indikator harga, tanpa urutan waktu.' },
  { name: 'ARIMA', tag: 'pembanding', kind: 'base' as const, mape: 3.5, mae: 3.0, dir: 52.8, note: 'Model statistik klasik yang memodelkan tren dan korelasi antar waktu.' },
  { name: 'Naive random walk', tag: 'pembanding', kind: 'base' as const, mape: 3.9, mae: 3.4, dir: 50.6, note: 'Menyalin harga hari ini sebagai perkiraan besok.' },
];

export const PERFORMA_GLOSSARY: Record<string, [string, string]> = {
  mape: [
    'Rata-rata kesalahan (MAPE)',
    'Rata-rata seberapa jauh perkiraan meleset dari harga sebenarnya, dinyatakan dalam persen. Kesalahan 2,4 persen pada harga Rp 1,75 miliar berarti perkiraan rata-rata meleset sekitar Rp 42 juta, ke atas maupun ke bawah. Semakin kecil semakin baik.',
  ],
  mae: [
    'Selisih mutlak rata-rata (MAE)',
    'Rata-rata jarak antara perkiraan dan harga sebenarnya dalam Rupiah, tanpa membedakan arah kesalahan (atas atau bawah). Berbeda dari RMSE yang memberi bobot lebih besar pada kesalahan yang besar. Semakin kecil semakin baik.',
  ],
  arah: [
    'Arah benar',
    'Seberapa sering model menebak dengan benar bahwa harga akan naik atau turun, tanpa memperhatikan besarnya. Menebak secara acak akan menghasilkan sekitar 50 persen. Angka 58,9 persen berarti model benar pada sekitar 59 dari 100 hari.',
  ],
  rmse: [
    'Selisih rata-rata (RMSE)',
    'Rata-rata jarak antara perkiraan dan harga sebenarnya, dinyatakan dalam Rupiah. Ukuran ini memberi bobot lebih besar pada kesalahan yang besar, sehingga satu hari yang meleset jauh akan menaikkan angka ini lebih banyak daripada beberapa hari yang meleset sedikit.',
  ],
};

/** KF-13 — Riwayat pergerakan bobot ensemble sepanjang periode pengujian */
export function weightHistory(n: number = 180) {
  const rnd = rng(314);
  const out: { day: number; lstm: number; gru: number; xgboost: number }[] = [];
  let wL = 41, wG = 33, wX = 26;
  for (let i = 0; i < n; i++) {
    wL += (rnd() - 0.5) * 4.5;
    wG += (rnd() - 0.5) * 3.8;
    wX += (rnd() - 0.5) * 4.0;
    wL = Math.max(18, Math.min(52, wL));
    wG = Math.max(16, Math.min(48, wG));
    wX = Math.max(14, Math.min(46, wX));
    const total = wL + wG + wX;
    out.push({
      day: i,
      lstm: Math.round((wL / total) * 1000) / 10,
      gru: Math.round((wG / total) * 1000) / 10,
      xgboost: Math.round((wX / total) * 1000) / 10,
    });
  }
  return out;
}

// ═════════════════════════════════════════════════════════════
//  VALIDASI — KF-14  (Uji Kupiec / POF)
// ═════════════════════════════════════════════════════════════

export type KupiecResult = {
  asset: string;
  pair: string;
  method: string;
  confidence: number;
  totalDays: number;
  expectedViolations: number;
  actualViolations: number;
  lrStatistic: number;
  criticalValue: number;
  pValue: number;
  pass: boolean;
  violationDays: number[];
};

export function kupiecTestResults(): KupiecResult[] {
  const specs = [
    { asset: 'BTC', pair: 'BTC/USDT' },
    { asset: 'ETH', pair: 'ETH/USDT' },
    { asset: 'BNB', pair: 'BNB/USDT' },
  ];
  const methods = [
    'Simulasi historis dasar',
    'FHS tanpa penyesuaian rata-rata',
    'FHS dengan penyesuaian rata-rata',
  ];
  const totalDays = 180;
  const p0 = 0.05;
  const expected = Math.round(totalDays * p0); // 9
  const critical = 3.841; // chi-squared(1) at 95%

  // pre-determined realistic violation counts (most pass, a couple marginal)
  const counts = [
    [8, 10, 9],  // BTC: all reasonable
    [7, 11, 8],  // ETH: all reasonable
    [12, 9, 10], // BNB: 12 is slightly high but still passes
  ];

  const rnd = rng(2718);
  const results: KupiecResult[] = [];

  for (let a = 0; a < 3; a++) {
    for (let m = 0; m < 3; m++) {
      const N = counts[a][m];
      const pHat = N / totalDays;
      const lr = N > 0 && N < totalDays
        ? 2 * (N * Math.log(pHat / p0) + (totalDays - N) * Math.log((1 - pHat) / (1 - p0)))
        : 0;
      const lrAbs = Math.abs(Math.round(lr * 1000) / 1000);
      const pass = lrAbs < critical;

      // approximate p-value from chi-squared(1)
      const x = lrAbs;
      const pVal = Math.max(0.001, Math.exp(-0.5 * x) * (1 + 0.33 * x));
      const pValue = Math.min(0.999, Math.round(pVal * 1000) / 1000);

      // generate violation days spread across the period
      const days: number[] = [];
      for (let v = 0; v < N; v++) {
        let d = Math.floor(rnd() * totalDays);
        while (days.includes(d)) d = (d + 1) % totalDays;
        days.push(d);
      }
      days.sort((a, b) => a - b);

      results.push({
        asset: specs[a].asset,
        pair: specs[a].pair,
        method: methods[m],
        confidence: 95,
        totalDays,
        expectedViolations: expected,
        actualViolations: N,
        lrStatistic: lrAbs,
        criticalValue: critical,
        pValue,
        pass,
        violationDays: days,
      });
    }
  }
  return results;
}

// ═════════════════════════════════════════════════════════════
//  CARA KERJA SISTEM — KF-15
// ═════════════════════════════════════════════════════════════

export const TRACKS = [
  {
    kicker: 'Jalur pertama', title: 'Perkiraan harga besok', dot: 'var(--up)',
    steps: [
      { n: '1', title: 'Menyiapkan data', body: 'Harga 180 hari terakhir dirapikan, lalu diubah ke bentuk yang bisa dibaca model: perubahan harian, rata-rata bergerak, dan beberapa indikator umum.' },
      { n: '2', title: 'Tiga model menghitung sendiri-sendiri', body: 'LSTM, GRU, dan XGBoost masing-masing menghasilkan satu angka perkiraan. Ketiganya tidak saling melihat hasil yang lain.' },
      { n: '3', title: 'Menggabungkan dengan bobot', body: 'Ketiga angka dirata-rata, tetapi model yang belakangan lebih sering tepat diberi bobot lebih besar. Bobot dihitung ulang setiap hari dari kesalahan 30 hari terakhir.' },
    ],
    output: 'Satu angka perkiraan untuk besok, disertai rentang kemungkinan berdasarkan rata-rata kesalahan pengujian.',
  },
  {
    kicker: 'Jalur kedua', title: 'Ukuran risiko', dot: 'var(--risk)',
    steps: [
      { n: '1', title: 'Menghitung untung rugi harian', body: 'Nilai portofolio dihitung ulang untuk setiap hari pada 180 hari terakhir, lalu selisih antar hari dicatat sebagai untung atau rugi.' },
      { n: '2', title: 'Mengurutkan dari terburuk', body: 'Seluruh hasil harian diurutkan. Nilai pada peringkat 5 persen terburuk menjadi batas kerugian, dan rata-rata di bawah batas itu menjadi kerugian bila batas terlampaui.' },
      { n: '3', title: 'Menelusuri penurunan terdalam', body: 'Nilai portofolio ditelusuri dari puncak ke titik terendah sesudahnya, untuk mengetahui penurunan terburuk yang pernah terjadi.' },
    ],
    output: 'Tiga angka dalam Rupiah: batas kerugian, kerugian bila batas terlampaui, dan penurunan terdalam.',
  },
];

export const FAQS = [
  { q: 'Mengapa perkiraannya bisa meleset?', a: 'Model belajar dari pola harga masa lalu. Ketika terjadi hal yang belum pernah ada dalam data itu, misalnya perubahan aturan atau kabar besar yang mendadak, model tidak memiliki rujukan dan perkiraannya bisa jauh dari kenyataan. Pada pengujian, rata-rata kesalahannya sekitar 2 sampai 4 persen tergantung asetnya.' },
  { q: 'Mengapa bobot ketiga model berubah setiap hari?', a: 'Tidak ada satu model yang selalu unggul. Ada masa harga bergerak dalam tren jelas, dan ada masa harga naik turun tanpa arah. Model yang cocok untuk keadaan pertama belum tentu cocok untuk yang kedua. Dengan menimbang ulang setiap hari berdasarkan ketepatan 30 hari terakhir, sistem mengikuti keadaan pasar yang sedang berlangsung.' },
  { q: 'Apakah angka risiko berarti kerugian saya tidak akan melebihi itu?', a: 'Tidak. Batas kerugian adalah nilai yang jarang dilewati, bukan yang tidak mungkin dilewati. Dari 100 hari, sekitar 5 hari akan melewatinya, dan pada hari-hari itu kerugiannya bisa jauh lebih besar. Karena itu ditampilkan juga rata-rata kerugian saat batas terlampaui.' },
  { q: 'Dari mana skor sentimen berasal?', a: 'Skor 0 sampai 100 dihitung dari beberapa sumber publik: seberapa besar pergerakan harga, volume perdagangan, dan tingkat gejolaknya. Skor rendah menandakan pelaku pasar sedang takut, skor tinggi menandakan terlalu percaya diri. Skor ini menggambarkan suasana pasar, bukan arah harga.' },
  { q: 'Apakah data saya disimpan?', a: 'Platform ini tidak meminta pendaftaran akun dan tidak menyimpan angka yang Anda masukkan pada kalkulator. Perhitungan berlangsung selama halaman terbuka, dan hilang saat halaman ditutup.' },
  { q: 'Mengapa tidak ada tombol beli atau jual?', a: 'Platform ini dibangun untuk penelitian mengenai keterpahaman keluaran model, bukan sebagai layanan keuangan. Menambahkan fasilitas transaksi akan mengubah sifatnya dan menimbulkan kewajiban perizinan yang berada di luar lingkup penelitian ini.' },
];

export const LIMITS = [
  { title: 'Hanya sehari ke depan', body: 'Model dilatih untuk memperkirakan harga penutupan besok. Perkiraan untuk seminggu atau sebulan ke depan tidak tersedia, karena ketepatannya menurun tajam seiring bertambahnya jarak waktu.' },
  { title: 'Tiga aset saja', body: 'Sistem diuji pada BTC, ETH, dan BNB. Aset lain memiliki pola dan tingkat gejolak berbeda, sehingga model ini belum tentu berlaku untuknya.' },
  { title: 'Tidak membaca berita', body: 'Masukan model hanya berupa angka harga dan turunannya. Kabar, kebijakan, dan peristiwa di luar itu tidak diperhitungkan, padahal keduanya sering menjadi penyebab pergerakan terbesar.' },
];
