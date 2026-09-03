import { describe, it, expect } from 'vitest';
import { rng, series } from '@/lib/rng';
import { dashboardRiskOf } from '@/lib/api';
import { riskOf } from '@/lib/dashboardData';

describe('TDD Unit: Algoritma Risiko & RNG (lib/rng.ts, lib/dashboardData.ts)', () => {
  describe('rng() & series()', () => {
    it('menghasilkan deret angka acak deterministik dari seed yang sama', () => {
      const gen1 = rng(42);
      const gen2 = rng(42);

      const seq1 = [gen1(), gen1(), gen1()];
      const seq2 = [gen2(), gen2(), gen2()];

      expect(seq1).toEqual(seq2);
    });

    it('menghasilkan deret harga (series) dengan panjang n + 1 dan nilai akhir sama dengan harga dasar', () => {
      const n = 180;
      const basePrice = 1752430000;
      const path = series(7, basePrice, n);

      expect(path).toHaveLength(n + 1);
      // Nilai terakhir (index n) harus sama persis dengan basePrice
      expect(path[n]).toBeCloseTo(basePrice, 1);
    });
  });

  describe('dashboardRiskOf() & riskOf()', () => {
    it('menghasilkan nilai VaR, CVaR, dan MDD yang valid dan bernilai positif', () => {
      const [varPct, cvarPct, ddPct] = dashboardRiskOf(180);

      // VaR harus bernilai positif
      expect(varPct).toBeGreaterThan(0);

      // Teori Finansial: CVaR (Expected Shortfall) selalu >= VaR
      expect(cvarPct).toBeGreaterThanOrEqual(varPct);

      // Maximum Drawdown harus >= 0
      expect(ddPct).toBeGreaterThanOrEqual(0);
    });

    it('kalkulasi riskOf untuk aset tunggal mengembalikan 3 metrik valid', () => {
      const [varPct, cvarPct, ddPct] = riskOf(7, 1752430000);

      expect(varPct).toBeGreaterThan(0);
      expect(cvarPct).toBeGreaterThanOrEqual(varPct);
      expect(ddPct).toBeGreaterThanOrEqual(0);
    });
  });
});
