import { describe, it, expect } from 'vitest';
import { kupiecTestResults } from '@/lib/api';

describe('TDD Unit: Validasi Backtest Uji Kupiec POF (lib/api.ts)', () => {
  const results = kupiecTestResults();

  it('mengembalikan hasil uji untuk 3 aset x 3 metode (9 kombinasi)', () => {
    expect(results).toHaveLength(9);
  });

  it('memiliki struktur data KupiecResult yang lengkap dan valid', () => {
    results.forEach((r) => {
      expect(r).toHaveProperty('asset');
      expect(r).toHaveProperty('pair');
      expect(r).toHaveProperty('method');
      expect(r.confidence).toBe(95);
      expect(r.totalDays).toBe(180);
      expect(r.expectedViolations).toBe(9);
      expect(r.criticalValue).toBe(3.841);
      expect(r.lrStatistic).toBeGreaterThanOrEqual(0);
      expect(r.pValue).toBeGreaterThanOrEqual(0);
      expect(r.pValue).toBeLessThanOrEqual(1);
      // Validasi konsistensi status pass
      expect(r.pass).toBe(r.lrStatistic < r.criticalValue);
      // Panjang violationDays harus sesuai dengan actualViolations
      expect(r.violationDays).toHaveLength(r.actualViolations);
    });
  });

  it('memastikan setiap aset (BTC, ETH, BNB) terwakili dalam hasil uji', () => {
    const assets = new Set(results.map((r) => r.asset));
    expect(assets).toEqual(new Set(['BTC', 'ETH', 'BNB']));
  });
});
