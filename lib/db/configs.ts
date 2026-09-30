import { getDb } from './index';

export interface SystemConfig {
  key: string;
  value: string;
  category: 'APP' | 'GLOBAL_PARAMS' | 'ENVIRONMENT';
  updated_at: string;
}

export function getAllConfigs(): SystemConfig[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM system_configs ORDER BY category, key ASC');
  return stmt.all() as SystemConfig[];
}

export function getConfigValue(key: string, defaultValue: string = ''): string {
  const db = getDb();
  const row = db.prepare('SELECT value FROM system_configs WHERE key = ?').get(key) as { value: string } | undefined;
  return row ? row.value : defaultValue;
}

export function setConfig(key: string, value: string, category: 'APP' | 'GLOBAL_PARAMS' | 'ENVIRONMENT') {
  const db = getDb();
  const now = new Date().toISOString();
  const stmt = db.prepare(
    `INSERT INTO system_configs (key, value, category, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, category = excluded.category, updated_at = excluded.updated_at`
  );
  stmt.run(key, value, category, now);
}

export function updateBatchConfigs(items: { key: string; value: string; category: 'APP' | 'GLOBAL_PARAMS' | 'ENVIRONMENT' }[]) {
  const db = getDb();
  const now = new Date().toISOString();

  db.exec('BEGIN TRANSACTION;');
  try {
    const stmt = db.prepare(
      `INSERT INTO system_configs (key, value, category, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, category = excluded.category, updated_at = excluded.updated_at`
    );
    for (const item of items) {
      stmt.run(item.key, item.value, item.category, now);
    }
    db.exec('COMMIT;');
    return true;
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}
