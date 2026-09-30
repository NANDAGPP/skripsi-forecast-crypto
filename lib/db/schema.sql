-- Skema Database Forecatforlyfe (SQLite)
-- Tabel Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('USER', 'ADMIN', 'SUPER_ADMIN')),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Tabel Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_name TEXT,
  role TEXT,
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL
);

-- Tabel Pasangan Mata Uang Kripto (Pairs)
CREATE TABLE IF NOT EXISTS crypto_pairs (
  id TEXT PRIMARY KEY,
  symbol TEXT UNIQUE NOT NULL,
  base_asset TEXT NOT NULL,
  quote_asset TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Tabel Status Job & Pelatihan Model
CREATE TABLE IF NOT EXISTS system_jobs (
  id TEXT PRIMARY KEY,
  job_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('COMPLETED', 'RUNNING', 'FAILED', 'PENDING')),
  started_at TEXT NOT NULL,
  finished_at TEXT,
  triggered_by TEXT NOT NULL,
  message TEXT
);

-- Tabel Model Status (Status pelatihan tiap model ensemble)
CREATE TABLE IF NOT EXISTS model_statuses (
  id TEXT PRIMARY KEY,
  model_name TEXT UNIQUE NOT NULL,
  algorithm TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('READY', 'TRAINING', 'STALE', 'ERROR')),
  mape REAL NOT NULL,
  mae REAL NOT NULL,
  accuracy REAL NOT NULL,
  last_trained_at TEXT NOT NULL
);

-- Tabel Konfigurasi Sistem
CREATE TABLE IF NOT EXISTS system_configs (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('APP', 'GLOBAL_PARAMS', 'ENVIRONMENT')),
  updated_at TEXT NOT NULL
);
