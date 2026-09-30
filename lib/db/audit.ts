import crypto from 'node:crypto';
import { getDb } from './index';

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_name: string | null;
  role: string | null;
  action: string;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

export function recordAuditLog(params: {
  user_id?: string | null;
  user_name?: string | null;
  role?: string | null;
  action: string;
  details?: string | null;
  ip_address?: string | null;
}): AuditLog {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const stmt = db.prepare(
    `INSERT INTO audit_logs (id, user_id, user_name, role, action, details, ip_address, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  stmt.run(
    id,
    params.user_id || null,
    params.user_name || null,
    params.role || null,
    params.action,
    params.details || null,
    params.ip_address || '127.0.0.1',
    now
  );

  return {
    id,
    user_id: params.user_id || null,
    user_name: params.user_name || null,
    role: params.role || null,
    action: params.action,
    details: params.details || null,
    ip_address: params.ip_address || '127.0.0.1',
    created_at: now,
  };
}

export function listAuditLogs(limit: number = 50, roleFilter?: string): AuditLog[] {
  const db = getDb();
  if (roleFilter && roleFilter !== 'ALL') {
    const stmt = db.prepare('SELECT * FROM audit_logs WHERE role = ? ORDER BY created_at DESC LIMIT ?');
    return stmt.all(roleFilter, limit) as AuditLog[];
  }
  const stmt = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?');
  return stmt.all(limit) as AuditLog[];
}
