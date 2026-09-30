import { describe, it, expect } from 'vitest';
import { getDb } from '@/lib/db';
import { getUserByEmail, verifyPassword, listUsers } from '@/lib/db/users';
import { listPairs } from '@/lib/db/pairs';
import { getSystemSummary } from '@/lib/db/models';

describe('Database and Seeder Unit Tests', () => {
  it('TC-UNIT-DB-01: Memastikan koneksi database dan inisialisasi tabel berhasil', () => {
    const db = getDb();
    expect(db).toBeDefined();

    const users = listUsers();
    expect(users.length).toBeGreaterThanOrEqual(3);

    const superAdmin = getUserByEmail('superadmin@forecatforlyfe.id');
    expect(superAdmin).toBeDefined();
    expect(superAdmin?.role).toBe('SUPER_ADMIN');
    expect(verifyPassword('SuperAdmin123!', superAdmin!.password_hash)).toBe(true);

    const admin = getUserByEmail('admin@forecatforlyfe.id');
    expect(admin).toBeDefined();
    expect(admin?.role).toBe('ADMIN');
    expect(verifyPassword('Admin123!', admin!.password_hash)).toBe(true);

    const user = getUserByEmail('user@forecatforlyfe.id');
    expect(user).toBeDefined();
    expect(user?.role).toBe('USER');
    expect(verifyPassword('User123!', user!.password_hash)).toBe(true);
  });

  it('TC-UNIT-DB-02: Memastikan pasangan kripto default ter-seed dengan benar', () => {
    const pairs = listPairs();
    expect(pairs.length).toBeGreaterThanOrEqual(3);
    const symbols = pairs.map((p) => p.symbol);
    expect(symbols).toContain('BTC/USDT');
    expect(symbols).toContain('ETH/USDT');
    expect(symbols).toContain('BNB/USDT');
  });

  it('TC-UNIT-DB-03: Memastikan ringkasan status sistem valid', () => {
    const summary = getSystemSummary();
    expect(summary.systemHealth).toBe('HEALTHY');
    expect(summary.apis.cryptoApi.status).toBe('CONNECTED');
    expect(summary.apis.sentimentApi.status).toBe('CONNECTED');
  });
});
