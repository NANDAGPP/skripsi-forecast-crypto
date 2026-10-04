import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, createUser, getUserById, toggleUserStatus, deleteUser } from '@/lib/db/users';
import { signToken, verifyToken } from '@/lib/auth/jwt';
import { canAccessSuperAdmin, canAccessAdmin, canAccessUser, getDefaultRedirectForRole } from '@/lib/auth/rbac';
import { getAktorSaatIni } from '@/lib/auth';
import { addPair, togglePairStatus, deletePair } from '@/lib/db/pairs';
import { setConfig, getConfigValue } from '@/lib/db/configs';
import { recordAuditLog, listAuditLogs } from '@/lib/db/audit';

describe('Unit & Integration: Authentication & RBAC System', () => {
  describe('1. Kriptografi & Password Hashing', () => {
    it('TC-AUTH-01: Menghasilkan hash kata sandi yang valid dan berbeda antar eksekusi (salt)', () => {
      const p1 = 'Secret123!';
      const h1 = hashPassword(p1);
      const h2 = hashPassword(p1);

      expect(h1).toContain(':');
      expect(h2).toContain(':');
      expect(h1).not.toBe(h2); // Salt harus acak dan berbeda
      expect(verifyPassword(p1, h1)).toBe(true);
      expect(verifyPassword(p1, h2)).toBe(true);
      expect(verifyPassword('WrongPass', h1)).toBe(false);
    });
  });

  describe('2. JWT Web Crypto Token (HMAC-SHA256)', () => {
    it('TC-JWT-01: Menandatangani dan memvalidasi JWT token', async () => {
      const payload = {
        sub: 'user-123',
        name: 'Test Trader',
        email: 'trader@test.com',
        role: 'USER' as const,
      };

      const token = await signToken(payload);
      expect(token.split('.')).toHaveLength(3);

      const verified = await verifyToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.sub).toBe('user-123');
      expect(verified?.role).toBe('USER');
      expect(verified?.email).toBe('trader@test.com');
    });

    it('TC-JWT-02: Menolak token yang dimanipulasi atau kedaluwarsa', async () => {
      const payload = {
        sub: 'user-tamper',
        name: 'Tamper',
        email: 'tamper@test.com',
        role: 'USER' as const,
      };

      const token = await signToken(payload);
      const tampered = token.slice(0, -5) + 'abcde';
      const result = await verifyToken(tampered);
      expect(result).toBeNull();

      // Token kedaluwarsa (-1 detik)
      const expiredToken = await signToken(payload, undefined, -10);
      const expResult = await verifyToken(expiredToken);
      expect(expResult).toBeNull();
    });
  });

  describe('3. Hak Akses & Matriks Otorisasi RBAC', () => {
    it('TC-RBAC-01: Memastikan batas kewenangan USER', () => {
      expect(canAccessUser('USER')).toBe(true);
      expect(canAccessAdmin('USER')).toBe(false);
      expect(canAccessSuperAdmin('USER')).toBe(false);
      expect(getDefaultRedirectForRole('USER')).toBe('/');
    });

    it('TC-RBAC-02: Memastikan batas kewenangan ADMIN', () => {
      expect(canAccessAdmin('ADMIN')).toBe(true);
      expect(canAccessSuperAdmin('ADMIN')).toBe(false);
      expect(canAccessUser('ADMIN')).toBe(false); // ADMIN hanya akses /admin
      expect(getDefaultRedirectForRole('ADMIN')).toBe('/admin');
    });

    it('TC-RBAC-03: Memastikan hak akses tertinggi SUPER_ADMIN', () => {
      expect(canAccessSuperAdmin('SUPER_ADMIN')).toBe(true);
      expect(canAccessAdmin('SUPER_ADMIN')).toBe(true);
      expect(canAccessUser('SUPER_ADMIN')).toBe(true);
      expect(getDefaultRedirectForRole('SUPER_ADMIN')).toBe('/super-admin');
    });

    it('TC-AUTH-ASYNC: Memastikan getAktorSaatIni() mengembalikan Promise dan dapat di-await', async () => {
      const promise = getAktorSaatIni();
      expect(promise).toBeInstanceOf(Promise);

      const aktor = await promise;
      expect(aktor).toBeDefined();
      expect(aktor.id).toBeDefined();
      expect(aktor.nama).toBeDefined();
      expect(['ADMINISTRATOR', 'SUPER_ADMINISTRATOR']).toContain(aktor.peran);
    });
  });

  describe('4. Manajemen Akun Pengguna & Status Keaktifan', () => {
    it('TC-USER-01: Membuat user baru, menonaktifkan, dan menghapus', () => {
      const uniqueEmail = `testuser_${Date.now()}@example.com`;
      const user = createUser({
        name: 'Test Automation',
        email: uniqueEmail,
        password: 'Password123!',
        role: 'USER',
      });

      expect(user.id).toBeDefined();
      expect(user.is_active).toBe(1);

      // Nonaktifkan user
      const toggled = toggleUserStatus(user.id);
      expect(toggled?.is_active).toBe(0);

      const refreshed = getUserById(user.id);
      expect(refreshed?.is_active).toBe(0);

      // Hapus user
      const deleted = deleteUser(user.id);
      expect(deleted).toBe(true);
      expect(getUserById(user.id)).toBeNull();
    });
  });

  describe('5. Manajemen Cryptocurrency Pairs & Konfigurasi', () => {
    it('TC-PAIR-01: Menambah, menonaktifkan, dan menghapus pair', () => {
      const sym = `TEST_${Date.now()}/USDT`;
      const pair = addPair(sym, 'TEST', 'USDT');
      expect(pair.symbol).toBe(sym);
      expect(pair.status).toBe('ACTIVE');

      const toggled = togglePairStatus(pair.id);
      expect(toggled?.status).toBe('INACTIVE');

      const del = deletePair(pair.id);
      expect(del).toBe(true);
    });

    it('TC-CFG-01: Memperbarui dan membaca konfigurasi sistem', () => {
      const testKey = `test_param_${Date.now()}`;
      setConfig(testKey, '99.5', 'GLOBAL_PARAMS');
      const val = getConfigValue(testKey);
      expect(val).toBe('99.5');
    });

    it('TC-AUDIT-01: Mencatat dan mengambil riwayat audit aktivitas', () => {
      const action = 'TEST_ACTION_EXEC';
      recordAuditLog({
        user_name: 'Test Runner',
        role: 'SUPER_ADMIN',
        action,
        details: 'Verifikasi pencatatan audit log otomatis.',
      });

      const logs = listAuditLogs(10);
      const found = logs.find((l) => l.action === action);
      expect(found).toBeDefined();
      expect(found?.role).toBe('SUPER_ADMIN');
    });
  });
});
