import crypto from 'node:crypto';
import { getDb } from './index';

export interface CryptoPair {
  id: string;
  symbol: string;
  base_asset: string;
  quote_asset: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

export function listPairs(): CryptoPair[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM crypto_pairs ORDER BY created_at ASC');
  return stmt.all() as CryptoPair[];
}

export function addPair(symbol: string, base_asset: string, quote_asset: string): CryptoPair {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const cleanSymbol = symbol.trim().toUpperCase();
  const cleanBase = base_asset.trim().toUpperCase();
  const cleanQuote = quote_asset.trim().toUpperCase();

  const stmt = db.prepare(
    `INSERT INTO crypto_pairs (id, symbol, base_asset, quote_asset, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?)`
  );
  stmt.run(id, cleanSymbol, cleanBase, cleanQuote, now, now);

  return {
    id,
    symbol: cleanSymbol,
    base_asset: cleanBase,
    quote_asset: cleanQuote,
    status: 'ACTIVE',
    created_at: now,
    updated_at: now,
  };
}

export function togglePairStatus(id: string): { status: 'ACTIVE' | 'INACTIVE' } | null {
  const db = getDb();
  const row = db.prepare('SELECT status FROM crypto_pairs WHERE id = ?').get(id) as { status: 'ACTIVE' | 'INACTIVE' } | undefined;
  if (!row) return null;

  const newStatus = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  const now = new Date().toISOString();
  db.prepare('UPDATE crypto_pairs SET status = ?, updated_at = ? WHERE id = ?').run(newStatus, now, id);
  return { status: newStatus };
}

export function deletePair(id: string): boolean {
  const db = getDb();
  const res = db.prepare('DELETE FROM crypto_pairs WHERE id = ?').run(id);
  return (res as unknown as { changes: number }).changes > 0;
}
