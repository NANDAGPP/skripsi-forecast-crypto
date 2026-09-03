export const ASSETS = [
  { pair: 'BTC/USDT', short: 'BTC', price: 1752430000, seed: 7, scale: 1 },
  { pair: 'ETH/USDT', short: 'ETH', price: 62480000, seed: 23, scale: 1.28 },
  { pair: 'BNB/USDT', short: 'BNB', price: 11235000, seed: 55, scale: 1.55 },
];

export const MODELS = [
  { name: 'Gabungan tiga model', tag: 'dipakai di dasbor', kind: 'main' as const, mape: 2.4, dir: 58.9, note: 'Rata-rata tertimbang dari LSTM, GRU, dan XGBoost.' },
  { name: 'LSTM', tag: 'pembelajaran mesin', kind: 'ml' as const, mape: 2.7, dir: 57.2, note: 'Mengingat pola urutan harga jangka panjang.' },
  { name: 'GRU', tag: 'pembelajaran mesin', kind: 'ml' as const, mape: 2.9, dir: 56.1, note: 'Serupa LSTM, strukturnya lebih sederhana.' },
  { name: 'XGBoost', tag: 'pembelajaran mesin', kind: 'ml' as const, mape: 3.1, dir: 54.8, note: 'Membaca indikator harga, tanpa urutan waktu.' },
  { name: 'Rata-rata bergerak 7 hari', tag: 'pembanding', kind: 'base' as const, mape: 3.6, dir: 52.3, note: 'Nilai tengah harga tujuh hari terakhir.' },
  { name: 'Tebakan naif', tag: 'pembanding', kind: 'base' as const, mape: 3.9, dir: 50.6, note: 'Menyalin harga hari ini sebagai perkiraan besok.' },
];

export const GLOSS: Record<string, [string, string]> = {
  mape: [
    'Rata-rata kesalahan (MAPE)',
    'Rata-rata seberapa jauh perkiraan meleset dari harga sebenarnya, dinyatakan dalam persen. Kesalahan 2,4 persen pada harga Rp 1,75 miliar berarti perkiraan rata-rata meleset sekitar Rp 42 juta, ke atas maupun ke bawah. Semakin kecil semakin baik.',
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
