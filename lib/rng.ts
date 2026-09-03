export function rng(seed: number) {
  let r = seed * 7919 + 13;
  return () => {
    r = (r * 1103515245 + 12345) & 0x7fffffff;
    return r / 0x7fffffff;
  };
}

export function series(seed: number, price: number, n: number) {
  const rnd = rng(seed);
  const cum = [0];
  for (let i = 0; i < n; i++) cum.push(cum[i] + (rnd() - 0.492) * 0.105);
  const last = cum[n];
  return cum.map((c) => price * Math.exp(c - last));
}
