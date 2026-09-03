export const nf = (d: number) =>
  new Intl.NumberFormat('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });

export const idr = (n: number) => 'Rp ' + nf(0).format(Math.round(n));

export const idrShort = (n: number) =>
  Math.abs(n) >= 1e9 ? 'Rp ' + nf(2).format(n / 1e9) + ' M' : 'Rp ' + nf(1).format(n / 1e6) + ' jt';

export const idrShort3 = (n: number) =>
  Math.abs(n) >= 1e9
    ? 'Rp ' + nf(2).format(n / 1e9) + ' M'
    : Math.abs(n) >= 1e6
    ? 'Rp ' + nf(1).format(n / 1e6) + ' jt'
    : 'Rp ' + nf(0).format(n / 1e3) + ' rb';

export const pct = (n: number, d?: number) => nf(d === undefined ? 2 : d).format(Math.abs(n)) + '%';
