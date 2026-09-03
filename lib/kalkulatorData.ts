export const ASSETS = [
  { id: 'BTC', pair: 'BTC/USDT', short: 'BTC', price: 1752430000, seed: 7, step: 0.001, def: 0.05 },
  { id: 'ETH', pair: 'ETH/USDT', short: 'ETH', price: 62480000, seed: 23, step: 0.01, def: 0.8 },
  { id: 'BNB', pair: 'BNB/USDT', short: 'BNB', price: 11235000, seed: 55, step: 0.1, def: 4 },
];

export const GLOSS: Record<string, [string, string]> = {
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
