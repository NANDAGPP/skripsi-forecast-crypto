import { describe, it, expect } from 'vitest';
import { idr, idrShort, idrShort3, pct } from '@/lib/format';

describe('TDD Unit: Formatter Utilitas (lib/format.ts)', () => {
  describe('idr()', () => {
    it('memformat angka rupiah standar dengan pembulatan', () => {
      const result = idr(1752430000.45);
      expect(result).toMatch(/^Rp\s*1[.\s]752[.\s]430[.\s]000$/);
    });

    it('memformat angka 0', () => {
      const result = idr(0);
      expect(result).toMatch(/^Rp\s*0$/);
    });

    it('memformat angka bulat kecil', () => {
      const result = idr(50000);
      expect(result).toMatch(/^Rp\s*50[.\s]000$/);
    });
  });

  describe('idrShort()', () => {
    it('menyingkat miliaran dengan suffix "M" dan 2 desimal', () => {
      const result = idrShort(1750000000);
      expect(result).toMatch(/^Rp\s*1[,.]75\s*M$/);
    });

    it('menyingkat jutaan dengan suffix "jt" dan 1 desimal', () => {
      const result = idrShort(62400000);
      expect(result).toMatch(/^Rp\s*62[,.]4\s*jt$/);
    });
  });

  describe('idrShort3()', () => {
    it('menangani miliaran (>= 1e9)', () => {
      const result = idrShort3(2500000000);
      expect(result).toMatch(/^Rp\s*2[,.]50\s*M$/);
    });

    it('menangani jutaan (>= 1e6)', () => {
      const result = idrShort3(11200000);
      expect(result).toMatch(/^Rp\s*11[,.]2\s*jt$/);
    });

    it('menangani ribuan (< 1e6)', () => {
      const result = idrShort3(750000);
      expect(result).toMatch(/^Rp\s*750\s*rb$/);
    });
  });

  describe('pct()', () => {
    it('memformat persentase default 2 digit desimal', () => {
      const result = pct(12.3456);
      expect(result).toMatch(/^12[,.]35%$/);
    });

    it('mendukung kustomisasi jumlah desimal', () => {
      const result = pct(5.123, 1);
      expect(result).toMatch(/^5[,.]1%$/);
    });

    it('mengubah nilai negatif menjadi nilai absolut dengan persentase', () => {
      const result = pct(-3.8);
      expect(result).toMatch(/^3[,.]80%$/);
    });
  });
});
