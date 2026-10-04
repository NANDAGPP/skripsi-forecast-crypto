import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { seedDatabase } from './seed';

let dbInstance: DatabaseSync | null = null;

const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', 'data')
  : path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'app.db');

export function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const bundledDb = path.join(process.cwd(), 'data', 'app.db');
  if (process.env.VERCEL && !fs.existsSync(DB_PATH) && fs.existsSync(bundledDb)) {
    try {
      fs.copyFileSync(bundledDb, DB_PATH);
    } catch {
      // fallback jika copy gagal, DatabaseSync akan inisialisasi baru
    }
  }

  const db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA foreign_keys = ON;');

  // Inisialisasi tabel dari schema jika belum ada
  initSchema(db);
  seedDatabase(db);

  dbInstance = db;
  return dbInstance;
}

function initSchema(db: DatabaseSync) {
  const schemaPath = path.join(process.cwd(), 'lib', 'db', 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
  }
}

export function exportBackupData(): Record<string, unknown[]> {
  const db = getDb();
  const tables = ['users', 'crypto_pairs', 'model_statuses', 'system_jobs', 'system_configs', 'audit_logs'];
  const backup: Record<string, unknown[]> = {};

  for (const table of tables) {
    try {
      const stmt = db.prepare(`SELECT * FROM ${table}`);
      backup[table] = stmt.all() as unknown[];
    } catch {
      backup[table] = [];
    }
  }

  return backup;
}

export function restoreBackupData(data: Record<string, unknown[]>) {
  const db = getDb();
  const tables = ['users', 'crypto_pairs', 'model_statuses', 'system_jobs', 'system_configs', 'audit_logs'];

  db.exec('BEGIN TRANSACTION;');
  try {
    for (const table of tables) {
      if (Array.isArray(data[table])) {
        db.exec(`DELETE FROM ${table};`);
        const rows = data[table] as Record<string, unknown>[];
        if (rows.length > 0) {
          const keys = Object.keys(rows[0]);
          const cols = keys.join(', ');
          const placeholders = keys.map(() => '?').join(', ');
          const stmt = db.prepare(`INSERT INTO ${table} (${cols}) VALUES (${placeholders})`);
          for (const row of rows) {
            stmt.run(...keys.map((k) => row[k] as string | number | null));
          }
        }
      }
    }
    db.exec('COMMIT;');
    return { success: true, message: 'Database restored successfully' };
  } catch (err: unknown) {
    db.exec('ROLLBACK;');
    throw err;
  }
}
