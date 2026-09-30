import type { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function seedDatabase(db: DatabaseSync) {
  const now = new Date().toISOString();

  // 1. Cek apakah akun Super Admin sudah ada
  const existingSuperAdmin = db.prepare("SELECT id FROM users WHERE role = 'SUPER_ADMIN'").get();
  if (!existingSuperAdmin) {
    const userStmt = db.prepare(
      `INSERT INTO users (id, name, email, password_hash, role, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
    );

    // Super Admin default
    userStmt.run(
      crypto.randomUUID(),
      'Super Administrator',
      'superadmin@forecatforlyfe.id',
      hashPassword('SuperAdmin123!'),
      'SUPER_ADMIN',
      now,
      now
    );

    // Admin default
    userStmt.run(
      crypto.randomUUID(),
      'System Admin',
      'admin@forecatforlyfe.id',
      hashPassword('Admin123!'),
      'ADMIN',
      now,
      now
    );

    // User default
    userStmt.run(
      crypto.randomUUID(),
      'Trader Pemula',
      'user@forecatforlyfe.id',
      hashPassword('User123!'),
      'USER',
      now,
      now
    );
  }

  // 2. Cek apakah Crypto Pairs sudah ada
  const existingPairs = db.prepare('SELECT COUNT(*) as c FROM crypto_pairs').get() as { c: number };
  if (existingPairs.c === 0) {
    const pairStmt = db.prepare(
      `INSERT INTO crypto_pairs (id, symbol, base_asset, quote_asset, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?)`
    );

    const defaultPairs = [
      ['BTC/USDT', 'BTC', 'USDT'],
      ['ETH/USDT', 'ETH', 'USDT'],
      ['BNB/USDT', 'BNB', 'USDT'],
      ['SOL/USDT', 'SOL', 'USDT'],
      ['XRP/USDT', 'XRP', 'USDT'],
    ];

    for (const [sym, b, q] of defaultPairs) {
      pairStmt.run(crypto.randomUUID(), sym, b, q, now, now);
    }
  }

  // 3. Cek Model Statuses
  const existingModels = db.prepare('SELECT COUNT(*) as c FROM model_statuses').get() as { c: number };
  if (existingModels.c === 0) {
    const modelStmt = db.prepare(
      `INSERT INTO model_statuses (id, model_name, algorithm, status, mape, mae, accuracy, last_trained_at)
       VALUES (?, ?, ?, 'READY', ?, ?, ?, ?)`
    );

    const defaultModels = [
      ['LSTM Deep Learning', 'Long Short-Term Memory', 2.4, 1.8, 97.6],
      ['GRU Recurrent Net', 'Gated Recurrent Unit', 2.9, 2.1, 97.1],
      ['XGBoost Regressor', 'Extreme Gradient Boosting', 3.2, 2.4, 96.8],
      ['ARIMA Benchmark', 'Auto-Regressive Integrated Moving Average', 5.1, 4.2, 94.9],
      ['Naive Benchmark', 'Random Walk Benchmark', 6.8, 5.4, 93.2],
    ];

    for (const [name, algo, mape, mae, acc] of defaultModels) {
      modelStmt.run(crypto.randomUUID(), name, algo, mape, mae, acc, now);
    }
  }

  // 4. Cek System Jobs
  const existingJobs = db.prepare('SELECT COUNT(*) as c FROM system_jobs').get() as { c: number };
  if (existingJobs.c === 0) {
    const jobStmt = db.prepare(
      `INSERT INTO system_jobs (id, job_name, status, started_at, finished_at, triggered_by, message)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );

    jobStmt.run(
      crypto.randomUUID(),
      'daily_batch_synchronization',
      'COMPLETED',
      now,
      now,
      'CRON_SCHEDULER',
      'Penyinkronan harga harian BTC, ETH, dan BNB selesai dengan 180 data poin historis.'
    );

    jobStmt.run(
      crypto.randomUUID(),
      'ensemble_weights_recalculation',
      'COMPLETED',
      now,
      now,
      'SYSTEM',
      'Rekalkulasi bobot ensemble 30 hari selesai (LSTM: 41%, GRU: 33%, XGBoost: 26%).'
    );
  }

  // 5. Cek System Configs
  const existingConfigs = db.prepare('SELECT COUNT(*) as c FROM system_configs').get() as { c: number };
  if (existingConfigs.c === 0) {
    const cfgStmt = db.prepare(
      `INSERT INTO system_configs (key, value, category, updated_at)
       VALUES (?, ?, ?, ?)`
    );

    const defaultConfigs: [string, string, 'APP' | 'GLOBAL_PARAMS' | 'ENVIRONMENT'][] = [
      ['app_title', 'Forecastforlyfe Crypto Forecasting', 'APP'],
      ['app_subtitle', 'Platform Peramalan Harga & Penilaian Risiko Portofolio', 'APP'],
      ['contact_email', 'research@forecatforlyfe.id', 'APP'],
      ['sync_interval_hours', '24', 'APP'],
      ['var_confidence_level', '95', 'GLOBAL_PARAMS'],
      ['default_portfolio_idr', '100000000', 'GLOBAL_PARAMS'],
      ['weight_lookback_days', '30', 'GLOBAL_PARAMS'],
      ['risk_calculation_method', 'Historical Simulation (180D)', 'GLOBAL_PARAMS'],
      ['environment_mode', 'production', 'ENVIRONMENT'],
      ['log_level', 'INFO', 'ENVIRONMENT'],
      ['enable_mock_fallback', 'true', 'ENVIRONMENT'],
    ];

    for (const [k, v, cat] of defaultConfigs) {
      cfgStmt.run(k, v, cat, now);
    }
  }

  // 6. Cek Audit Logs
  const existingAudit = db.prepare('SELECT COUNT(*) as c FROM audit_logs').get() as { c: number };
  if (existingAudit.c === 0) {
    db.prepare(
      `INSERT INTO audit_logs (id, user_id, user_name, role, action, details, ip_address, created_at)
       VALUES (?, NULL, 'SYSTEM', 'SYSTEM', 'SYSTEM_INITIALIZE', 'Inisialisasi sistem, skema basis data, dan akun awal selesai.', '127.0.0.1', ?)`
    ).run(crypto.randomUUID(), now);
  }
}
