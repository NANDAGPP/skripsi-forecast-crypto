import crypto from 'node:crypto';
import { getDb } from './index';

export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export type SafeUser = Omit<User, 'password_hash'>;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(key, 'hex'));
}

export function toSafeUser(user: User): SafeUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...safe } = user;
  return safe;
}

export function getUserByEmail(email: string): User | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE');
  const row = stmt.get(email.trim()) as User | undefined;
  return row || null;
}

export function getUserById(id: string): User | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const row = stmt.get(id) as User | undefined;
  return row || null;
}

export function createUser(params: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  is_active?: number;
}): SafeUser {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const password_hash = hashPassword(params.password);
  const is_active = params.is_active !== undefined ? params.is_active : 1;

  const stmt = db.prepare(
    `INSERT INTO users (id, name, email, password_hash, role, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  stmt.run(
    id,
    params.name.trim(),
    params.email.trim().toLowerCase(),
    password_hash,
    params.role,
    is_active,
    now,
    now
  );

  return {
    id,
    name: params.name.trim(),
    email: params.email.trim().toLowerCase(),
    role: params.role,
    is_active,
    created_at: now,
    updated_at: now,
  };
}

export function updateUser(
  id: string,
  updates: Partial<{
    name: string;
    email: string;
    password?: string;
    role?: UserRole;
    is_active?: number;
  }>
): SafeUser | null {
  const db = getDb();
  const existing = getUserById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const name = updates.name !== undefined ? updates.name.trim() : existing.name;
  const email = updates.email !== undefined ? updates.email.trim().toLowerCase() : existing.email;
  const role = updates.role !== undefined ? updates.role : existing.role;
  const is_active = updates.is_active !== undefined ? updates.is_active : existing.is_active;
  const password_hash = updates.password ? hashPassword(updates.password) : existing.password_hash;

  const stmt = db.prepare(
    `UPDATE users
     SET name = ?, email = ?, password_hash = ?, role = ?, is_active = ?, updated_at = ?
     WHERE id = ?`
  );

  stmt.run(name, email, password_hash, role, is_active, now, id);

  return {
    id,
    name,
    email,
    role,
    is_active,
    created_at: existing.created_at,
    updated_at: now,
  };
}

export function toggleUserStatus(id: string): { is_active: number } | null {
  const user = getUserById(id);
  if (!user) return null;
  const newStatus = user.is_active === 1 ? 0 : 1;
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare('UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?').run(newStatus, now, id);
  return { is_active: newStatus };
}

export function deleteUser(id: string): boolean {
  const db = getDb();
  const res = db.prepare('DELETE FROM users WHERE id = ?').run(id);
  return (res as unknown as { changes: number }).changes > 0;
}

export function listUsers(roleFilter?: UserRole | 'ALL'): SafeUser[] {
  const db = getDb();
  if (roleFilter && roleFilter !== 'ALL') {
    const stmt = db.prepare('SELECT id, name, email, role, is_active, created_at, updated_at FROM users WHERE role = ? ORDER BY created_at DESC');
    return stmt.all(roleFilter) as SafeUser[];
  }
  const stmt = db.prepare('SELECT id, name, email, role, is_active, created_at, updated_at FROM users ORDER BY created_at DESC');
  return stmt.all() as SafeUser[];
}

export function countUsersStats() {
  const db = getDb();
  const totalUsers = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'USER'").get() as { count: number }).count;
  const activeUsers = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'USER' AND is_active = 1").get() as { count: number }).count;
  const totalAdmins = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN')").get() as { count: number }).count;
  const activeAdmins = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role IN ('ADMIN', 'SUPER_ADMIN') AND is_active = 1").get() as { count: number }).count;

  return {
    totalUsers,
    activeUsers,
    totalAdmins,
    activeAdmins,
  };
}
