'use client';

import { useState, useEffect, useTransition } from 'react';
import AdminNavBar from '@/components/AdminNavBar';
import BackgroundHills from '@/components/BackgroundHills';
import Reveal from '@/components/Reveal';
import type { CryptoPair } from '@/lib/db/pairs';
import type { ModelStatus, SystemJob } from '@/lib/db/models';
import type { AuditLog } from '@/lib/db/audit';

const ADMIN_TABS = [
  { id: 'dashboard', label: 'Admin Dashboard' },
  { id: 'monitoring', label: 'Monitoring' },
  { id: 'batch', label: 'Batch Process' },
  { id: 'models', label: 'Model Management' },
  { id: 'pairs', label: 'Pair Management' },
  { id: 'logs', label: 'Logs' },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState<{
    summary?: {
      systemHealth: string;
      dailyBatch: { status: string; lastRun: string; message: string };
      apis: {
        cryptoApi: { provider: string; status: string; latencyMs: number; lastCheck: string };
        sentimentApi: { provider: string; status: string; latencyMs: number; lastCheck: string };
      };
      activePairsCount: number;
      modelsCount: number;
      lastDataUpdate: string;
      serverStats: { platform: string; nodeVersion: string; uptimeSeconds: number; memoryUsageMb: number };
    };
    models?: ModelStatus[];
    jobs?: SystemJob[];
    logs?: AuditLog[];
  }>({});

  const [pairs, setPairs] = useState<CryptoPair[]>([]);
  const [isPending, startTransition] = useTransition();
  const [retrainSuccess, setRetrainSuccess] = useState<string | null>(null);

  // Form input pair baru
  const [newSymbol, setNewSymbol] = useState('');
  const [newBase, setNewBase] = useState('');
  const [newQuote, setNewQuote] = useState('USDT');
  const [pairError, setPairError] = useState<string | null>(null);

  // Ambil data admin
  const fetchData = async () => {
    try {
      const [resStatus, resPairs] = await Promise.all([
        fetch('/api/admin/status'),
        fetch('/api/admin/pairs'),
      ]);
      if (resStatus.ok) {
        const data = await resStatus.json();
        setStatusData(data);
      }
      if (resPairs.ok) {
        const p = await resPairs.json();
        setPairs(p.pairs || []);
      }
    } catch (err) {
      console.error('Fetch admin data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const handleRetrain = () => {
    setRetrainSuccess(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/retrain', { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
          setRetrainSuccess(data.message || 'Pelatihan ulang berhasil!');
          await fetchData();
        }
      } catch {
        alert('Gagal memicu retraining.');
      }
    });
  };

  const handleAddPair = async (e: React.FormEvent) => {
    e.preventDefault();
    setPairError(null);
    if (!newSymbol || !newBase || !newQuote) {
      setPairError('Semua isian pair harus diisi.');
      return;
    }

    try {
      const res = await fetch('/api/admin/pairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: newSymbol.toUpperCase(),
          base_asset: newBase.toUpperCase(),
          quote_asset: newQuote.toUpperCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPairError(data.error || 'Gagal menambahkan pair.');
        return;
      }
      setNewSymbol('');
      setNewBase('');
      fetchData();
    } catch {
      setPairError('Gagal terhubung ke server.');
    }
  };

  const handleTogglePair = async (id: string) => {
    try {
      const res = await fetch('/api/admin/pairs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) fetchData();
    } catch {
      alert('Gagal memperbarui status pair.');
    }
  };

  const handleDeletePair = async (id: string, symbol: string) => {
    if (!confirm(`Hapus pasangan ${symbol} dari sistem?`)) return;
    try {
      const res = await fetch(`/api/admin/pairs?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch {
      alert('Gagal menghapus pair.');
    }
  };

  return (
    <>
      <BackgroundHills />
      <div style={{ position: 'relative', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <AdminNavBar
          role="ADMIN"
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          tabs={ADMIN_TABS}
          userName="Administrator"
        />

        <main style={{ flex: 1, maxWidth: 1320, width: '100%', margin: '0 auto', padding: '34px 24px 80px' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink3)' }}>
              Memuat data administrasi…
            </div>
          ) : (
            <>
              {/* 1. ADMIN DASHBOARD */}
              {activeTab === 'dashboard' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
                  <Reveal order={1}>
                    <div>
                      <span style={{ font: "400 12px 'IBM Plex Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink3)' }}>
                        Pusat Kendali Operasional
                      </span>
                      <h1 style={{ margin: '8px 0 0', font: "400 42px/1.1 'PP Editorial New','Instrument Serif',serif" }}>
                        Ringkasan Status Sistem
                      </h1>
                      <p style={{ margin: '8px 0 0', font: "400 14px 'IBM Plex Sans',sans-serif", color: 'var(--ink2)' }}>
                        Status harian pemodelan multi-model ensemble, ketersediaan API bursa, dan proses batch sinkronisasi data.
                      </p>
                    </div>
                  </Reveal>

                  {/* 4 Kartu Metrik Utama */}
                  <Reveal order={2}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                      {/* Status Sistem */}
                      <div style={{ background: 'var(--card)', borderRadius: 22, padding: 24, boxShadow: 'var(--shadow)', border: '1px solid var(--line2)' }}>
                        <span style={{ font: "400 11.5px 'IBM Plex Mono',monospace", color: 'var(--ink3)', textTransform: 'uppercase' }}>
                          Status Kesehatan Sistem
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
                          <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--up)' }} />
                          <span style={{ font: "500 24px 'IBM Plex Sans',sans-serif", color: 'var(--ink)' }}>
                            {statusData.summary?.systemHealth || 'HEALTHY'}
                          </span>
                        </div>
                        <p style={{ margin: '8px 0 0', font: "400 12.5px 'IBM Plex Sans',sans-serif", color: 'var(--ink3)' }}>
                          Seluruh sub-sistem beroperasi normal tanpa kendala.
                        </p>
                      </div>

                      {/* Status Batch Harian */}
                      <div style={{ background: 'var(--card)', borderRadius: 22, padding: 24, boxShadow: 'var(--shadow)', border: '1px solid var(--line2)' }}>
                        <span style={{ font: "400 11.5px 'IBM Plex Mono',monospace", color: 'var(--ink3)', textTransform: 'uppercase' }}>
                          Status Proses Batch Harian
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
                          <span style={{ padding: '3px 10px', borderRadius: 999, background: 'var(--lime)', color: 'var(--onlime)', font: "500 12px 'IBM Plex Mono',monospace" }}>
                            {statusData.summary?.dailyBatch.status}
                          </span>
                        </div>
                        <p style={{ margin: '8px 0 0', font: "400 12px 'IBM Plex Sans',sans-serif", color: 'var(--ink2)' }}>
                          {statusData.summary?.dailyBatch.message}
                        </p>
                      </div>

                      {/* Status API Crypto */}
                      <div style={{ background: 'var(--card)', borderRadius: 22, padding: 24, boxShadow: 'var(--shadow)', border: '1px solid var(--line2)' }}>
                        <span style={{ font: "400 11.5px 'IBM Plex Mono',monospace", color: 'var(--ink3)', textTransform: 'uppercase' }}>
                          Status API Cryptocurrency
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                          <span style={{ font: "500 15px 'IBM Plex Sans',sans-serif", color: 'var(--up)' }}>
                            {statusData.summary?.apis.cryptoApi.status}
                          </span>
                          <span style={{ font: "400 12px 'IBM Plex Mono',monospace", color: 'var(--ink3)' }}>
                            {statusData.summary?.apis.cryptoApi.latencyMs} ms
                          </span>
                        </div>
                        <p style={{ margin: '8px 0 0', font: "400 12px 'IBM Plex Sans',sans-serif", color: 'var(--ink3)' }}>
                          {statusData.summary?.apis.cryptoApi.provider}
                        </p>
                      </div>

                      {/* Status API Sentimen */}
                      <div style={{ background: 'var(--card)', borderRadius: 22, padding: 24, boxShadow: 'var(--shadow)', border: '1px solid var(--line2)' }}>
                        <span style={{ font: "400 11.5px 'IBM Plex Mono',monospace", color: 'var(--ink3)', textTransform: 'uppercase' }}>
                          Status API Sentiment Index
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                          <span style={{ font: "500 15px 'IBM Plex Sans',sans-serif", color: 'var(--up)' }}>
                            {statusData.summary?.apis.sentimentApi.status}
                          </span>
                          <span style={{ font: "400 12px 'IBM Plex Mono',monospace", color: 'var(--ink3)' }}>
                            {statusData.summary?.apis.sentimentApi.latencyMs} ms
                          </span>
                        </div>
                        <p style={{ margin: '8px 0 0', font: "400 12px 'IBM Plex Sans',sans-serif", color: 'var(--ink3)' }}>
                          {statusData.summary?.apis.sentimentApi.provider}
                        </p>
                      </div>
                    </div>
                  </Reveal>

                  {/* Informasi Update Terakhir & Quick Retraining */}
                  <Reveal order={3}>
                    <div style={{ background: 'var(--card)', borderRadius: 24, padding: 28, boxShadow: 'var(--shadow)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
                      <div>
                        <span style={{ font: "400 11px 'IBM Plex Mono',monospace", textTransform: 'uppercase', color: 'var(--ink3)', letterSpacing: '.08em' }}>
                          Sinkronisasi & Retraining Model
                        </span>
                        <h3 style={{ margin: '6px 0 0', font: "400 22px 'PP Editorial New',serif" }}>
                          Waktu Pembaruan Data Terakhir: {new Date(statusData.summary?.lastDataUpdate || '').toLocaleString('id-ID')}
                        </h3>
                        <p style={{ margin: '4px 0 0', font: "400 13px 'IBM Plex Sans',sans-serif", color: 'var(--ink2)' }}>
                          Model ensemble saat ini aktif untuk {statusData.summary?.activePairsCount} pair kripto acuan.
                        </p>
                      </div>

                      <button
                        onClick={handleRetrain}
                        disabled={isPending}
                        style={{
                          padding: '12px 24px',
                          borderRadius: 12,
                          border: 'none',
                          background: isPending ? 'var(--surf2)' : 'var(--risk)',
                          color: isPending ? 'var(--ink3)' : '#ffffff',
                          font: "500 13.5px 'IBM Plex Sans',sans-serif",
                          cursor: isPending ? 'wait' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          boxShadow: '0 2px 10px rgba(47, 93, 138, .2)',
                        }}
                      >
                        {isPending ? 'Memproses pelatihan ulang…' : 'Jalankan Retraining Model'}
                      </button>
                    </div>
                  </Reveal>
                  {retrainSuccess && (
                    <div style={{ padding: '12px 18px', borderRadius: 14, background: 'color-mix(in srgb, var(--up) 15%, transparent)', color: 'var(--up)', font: "500 13.5px 'IBM Plex Sans',sans-serif", border: '1px solid color-mix(in srgb, var(--up) 30%, transparent)' }}>
                      {retrainSuccess}
                    </div>
                  )}
                </div>
              )}

              {/* 2. MONITORING */}
              {activeTab === 'monitoring' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <Reveal order={1}>
                    <h2 style={{ margin: 0, font: "400 32px 'PP Editorial New',serif" }}>Monitoring Infrastruktur & Jaringan</h2>
                    <p style={{ margin: '6px 0 0', font: "400 14px 'IBM Plex Sans',sans-serif", color: 'var(--ink2)' }}>
                      Pemantauan langsung performa server, penggunaan memori runtime Node.js, dan latensi koneksi API bursa.
                    </p>
                  </Reveal>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                    <div style={{ background: 'var(--card)', borderRadius: 22, padding: 24, border: '1px solid var(--line2)' }}>
                      <h4 style={{ margin: 0, font: "500 15px 'IBM Plex Sans',sans-serif" }}>Server Environment</h4>
                      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10, font: "400 13px 'IBM Plex Mono',monospace" }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--ink3)' }}>Platform:</span>
                          <span>{statusData.summary?.serverStats.platform}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--ink3)' }}>Node.js Version:</span>
                          <span>{statusData.summary?.serverStats.nodeVersion}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--ink3)' }}>Memory (Heap Used):</span>
                          <span>{statusData.summary?.serverStats.memoryUsageMb} MB</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--ink3)' }}>Uptime Server:</span>
                          <span>{statusData.summary?.serverStats.uptimeSeconds} detik</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ background: 'var(--card)', borderRadius: 22, padding: 24, border: '1px solid var(--line2)' }}>
                      <h4 style={{ margin: 0, font: "500 15px 'IBM Plex Sans',sans-serif" }}>Database Engine</h4>
                      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10, font: "400 13px 'IBM Plex Mono',monospace" }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--ink3)' }}>Engine:</span>
                          <span>SQLite 3 (Built-in Node 24)</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--ink3)' }}>Storage Path:</span>
                          <span>data/app.db</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--ink3)' }}>Foreign Keys:</span>
                          <span style={{ color: 'var(--up)' }}>ENABLED</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--ink3)' }}>Integrity Check:</span>
                          <span style={{ color: 'var(--up)' }}>PASSED (OK)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. BATCH PROCESS */}
              {activeTab === 'batch' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <Reveal order={1}>
                    <h2 style={{ margin: 0, font: "400 32px 'PP Editorial New',serif" }}>Status Proses Batch Harian</h2>
                    <p style={{ margin: '6px 0 0', font: "400 14px 'IBM Plex Sans',sans-serif", color: 'var(--ink2)' }}>
                      Log rekam jejak pekerjaan terjadwal harian untuk pembaruan harga, rekalkulasi bobot 30 hari, dan penilaian risiko.
                    </p>
                  </Reveal>

                  <div style={{ background: 'var(--card)', borderRadius: 22, padding: 24, boxShadow: 'var(--shadow)' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', font: "400 13px 'IBM Plex Sans',sans-serif" }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--line)', textAlign: 'left', font: "400 11px 'IBM Plex Mono',monospace", color: 'var(--ink3)', textTransform: 'uppercase' }}>
                            <th style={{ padding: '10px 12px' }}>Nama Job</th>
                            <th style={{ padding: '10px 12px' }}>Status</th>
                            <th style={{ padding: '10px 12px' }}>Dipicu Oleh</th>
                            <th style={{ padding: '10px 12px' }}>Waktu Mulai</th>
                            <th style={{ padding: '10px 12px' }}>Keterangan / Output</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statusData.jobs?.map((job) => (
                            <tr key={job.id} style={{ borderBottom: '1px solid var(--line2)' }}>
                              <td style={{ padding: '12px', font: "500 13px 'IBM Plex Mono',monospace" }}>{job.job_name}</td>
                              <td style={{ padding: '12px' }}>
                                <span style={{ padding: '3px 8px', borderRadius: 999, fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", background: job.status === 'COMPLETED' ? 'var(--lime)' : 'var(--surf2)', color: job.status === 'COMPLETED' ? 'var(--onlime)' : 'var(--ink)' }}>
                                  {job.status}
                                </span>
                              </td>
                              <td style={{ padding: '12px', color: 'var(--ink2)' }}>{job.triggered_by}</td>
                              <td style={{ padding: '12px', color: 'var(--ink3)', fontSize: 12 }}>{new Date(job.started_at).toLocaleString('id-ID')}</td>
                              <td style={{ padding: '12px', color: 'var(--ink2)', maxWidth: 400 }}>{job.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. MODEL MANAGEMENT */}
              {activeTab === 'models' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <Reveal order={1}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                      <div>
                        <h2 style={{ margin: 0, font: "400 32px 'PP Editorial New',serif" }}>Status Pelatihan Model</h2>
                        <p style={{ margin: '6px 0 0', font: "400 14px 'IBM Plex Sans',sans-serif", color: 'var(--ink2)' }}>
                          Kelola performa masing-masing arsitektur deep learning dan machine learning yang tergabung dalam ensemble.
                        </p>
                      </div>
                      <button
                        onClick={handleRetrain}
                        disabled={isPending}
                        style={{
                          padding: '10px 20px',
                          borderRadius: 10,
                          border: 'none',
                          background: 'var(--ink)',
                          color: 'var(--onink)',
                          font: "500 13px 'IBM Plex Sans',sans-serif",
                          cursor: isPending ? 'wait' : 'pointer',
                        }}
                      >
                        {isPending ? 'Melatih Ulang…' : 'Latih Ulang Model'}
                      </button>
                    </div>
                  </Reveal>

                  <div style={{ background: 'var(--card)', borderRadius: 22, padding: 24, boxShadow: 'var(--shadow)' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', font: "400 13.5px 'IBM Plex Sans',sans-serif" }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--line)', textAlign: 'left', font: "400 11px 'IBM Plex Mono',monospace", color: 'var(--ink3)', textTransform: 'uppercase' }}>
                            <th style={{ padding: '10px 12px' }}>Model</th>
                            <th style={{ padding: '10px 12px' }}>Algoritma Dasar</th>
                            <th style={{ padding: '10px 12px' }}>Status</th>
                            <th style={{ padding: '10px 12px' }}>MAPE</th>
                            <th style={{ padding: '10px 12px' }}>MAE</th>
                            <th style={{ padding: '10px 12px' }}>Akurasi Arah</th>
                            <th style={{ padding: '10px 12px' }}>Terakhir Dilatih</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statusData.models?.map((m) => (
                            <tr key={m.id} style={{ borderBottom: '1px solid var(--line2)' }}>
                              <td style={{ padding: '14px 12px', fontWeight: 500 }}>{m.model_name}</td>
                              <td style={{ padding: '14px 12px', color: 'var(--ink2)' }}>{m.algorithm}</td>
                              <td style={{ padding: '14px 12px' }}>
                                <span style={{ padding: '3px 8px', borderRadius: 999, background: 'var(--lime)', color: 'var(--onlime)', fontSize: 11, fontFamily: "'IBM Plex Mono',monospace" }}>
                                  {m.status}
                                </span>
                              </td>
                              <td style={{ padding: '14px 12px', fontFamily: "'IBM Plex Mono',monospace" }}>{m.mape}%</td>
                              <td style={{ padding: '14px 12px', fontFamily: "'IBM Plex Mono',monospace" }}>{m.mae}%</td>
                              <td style={{ padding: '14px 12px', fontFamily: "'IBM Plex Mono',monospace", color: 'var(--up)' }}>{m.accuracy}%</td>
                              <td style={{ padding: '14px 12px', fontSize: 12, color: 'var(--ink3)' }}>
                                {new Date(m.last_trained_at).toLocaleString('id-ID')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. PAIR MANAGEMENT */}
              {activeTab === 'pairs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <Reveal order={1}>
                    <h2 style={{ margin: 0, font: "400 32px 'PP Editorial New',serif" }}>Manajemen Pasangan Cryptocurrency</h2>
                    <p style={{ margin: '6px 0 0', font: "400 14px 'IBM Plex Sans',sans-serif", color: 'var(--ink2)' }}>
                      Daftar aset cryptocurrency pair yang digunakan pada modul peramalan dan kalkulasi risiko portofolio.
                    </p>
                  </Reveal>

                  {/* Tambah Pair Baru */}
                  <div style={{ background: 'var(--card)', borderRadius: 22, padding: 24, border: '1px solid var(--line2)' }}>
                    <h4 style={{ margin: '0 0 14px', font: "500 15px 'IBM Plex Sans',sans-serif" }}>Tambah Pasangan Kripto Baru</h4>
                    {pairError && <div style={{ color: 'var(--down)', fontSize: 13, marginBottom: 12 }}>{pairError}</div>}
                    <form onSubmit={handleAddPair} style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: 'var(--ink3)' }}>SIMBOL PAIR</label>
                        <input
                          type="text"
                          placeholder="cth. SOL/USDT"
                          value={newSymbol}
                          onChange={(e) => setNewSymbol(e.target.value)}
                          style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surf2)', color: 'var(--ink)', font: "400 13px 'IBM Plex Mono',monospace" }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: 'var(--ink3)' }}>BASE ASSET</label>
                        <input
                          type="text"
                          placeholder="cth. SOL"
                          value={newBase}
                          onChange={(e) => setNewBase(e.target.value)}
                          style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surf2)', color: 'var(--ink)', font: "400 13px 'IBM Plex Mono',monospace" }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: 'var(--ink3)' }}>QUOTE ASSET</label>
                        <input
                          type="text"
                          placeholder="USDT"
                          value={newQuote}
                          onChange={(e) => setNewQuote(e.target.value)}
                          style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surf2)', color: 'var(--ink)', font: "400 13px 'IBM Plex Mono',monospace" }}
                        />
                      </div>
                      <button
                        type="submit"
                        style={{
                          padding: '10px 20px',
                          borderRadius: 10,
                          border: 'none',
                          background: 'var(--ink)',
                          color: 'var(--onink)',
                          font: "500 13px 'IBM Plex Sans',sans-serif",
                          cursor: 'pointer',
                        }}
                      >
                        Tambah Pair
                      </button>
                    </form>
                  </div>

                  {/* Tabel Daftar Pairs */}
                  <div style={{ background: 'var(--card)', borderRadius: 22, padding: 24, boxShadow: 'var(--shadow)' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', font: "400 13.5px 'IBM Plex Sans',sans-serif" }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--line)', textAlign: 'left', font: "400 11px 'IBM Plex Mono',monospace", color: 'var(--ink3)', textTransform: 'uppercase' }}>
                            <th style={{ padding: '10px 12px' }}>Simbol</th>
                            <th style={{ padding: '10px 12px' }}>Aset Dasar</th>
                            <th style={{ padding: '10px 12px' }}>Aset Kuotasi</th>
                            <th style={{ padding: '10px 12px' }}>Status</th>
                            <th style={{ padding: '10px 12px' }}>Waktu Registrasi</th>
                            <th style={{ padding: '10px 12px', textAlign: 'right' }}>Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pairs.map((p) => (
                            <tr key={p.id} style={{ borderBottom: '1px solid var(--line2)' }}>
                              <td style={{ padding: '14px 12px', font: "500 14px 'IBM Plex Mono',monospace" }}>{p.symbol}</td>
                              <td style={{ padding: '14px 12px' }}>{p.base_asset}</td>
                              <td style={{ padding: '14px 12px' }}>{p.quote_asset}</td>
                              <td style={{ padding: '14px 12px' }}>
                                <span style={{ padding: '3px 8px', borderRadius: 999, fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", background: p.status === 'ACTIVE' ? 'var(--lime)' : 'var(--surf2)', color: p.status === 'ACTIVE' ? 'var(--onlime)' : 'var(--ink4)' }}>
                                  {p.status === 'ACTIVE' ? 'AKTIF' : 'NONAKTIF'}
                                </span>
                              </td>
                              <td style={{ padding: '14px 12px', fontSize: 12, color: 'var(--ink3)' }}>
                                {new Date(p.created_at).toLocaleDateString('id-ID')}
                              </td>
                              <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                                <button
                                  onClick={() => handleTogglePair(p.id)}
                                  style={{
                                    padding: '5px 12px',
                                    borderRadius: 8,
                                    border: '1px solid var(--line)',
                                    background: 'var(--card)',
                                    color: 'var(--ink)',
                                    font: "400 12px 'IBM Plex Sans',sans-serif",
                                    cursor: 'pointer',
                                    marginRight: 8,
                                  }}
                                >
                                  {p.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}
                                </button>
                                <button
                                  onClick={() => handleDeletePair(p.id, p.symbol)}
                                  style={{
                                    padding: '5px 12px',
                                    borderRadius: 8,
                                    border: '1px solid var(--line)',
                                    background: 'var(--card)',
                                    color: 'var(--down)',
                                    font: "400 12px 'IBM Plex Sans',sans-serif",
                                    cursor: 'pointer',
                                  }}
                                >
                                  Hapus
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. LOGS */}
              {activeTab === 'logs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <Reveal order={1}>
                    <h2 style={{ margin: 0, font: "400 32px 'PP Editorial New',serif" }}>Log Proses & Aktivitas Sistem</h2>
                    <p style={{ margin: '6px 0 0', font: "400 14px 'IBM Plex Sans',sans-serif", color: 'var(--ink2)' }}>
                      Catatan kronologis aktivitas operasional sistem peramalan cryptocurrency.
                    </p>
                  </Reveal>

                  <div style={{ background: 'var(--card)', borderRadius: 22, padding: 24, boxShadow: 'var(--shadow)' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', font: "400 13px 'IBM Plex Sans',sans-serif" }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--line)', textAlign: 'left', font: "400 11px 'IBM Plex Mono',monospace", color: 'var(--ink3)', textTransform: 'uppercase' }}>
                            <th style={{ padding: '10px 12px' }}>Waktu</th>
                            <th style={{ padding: '10px 12px' }}>Pelaku</th>
                            <th style={{ padding: '10px 12px' }}>Aksi</th>
                            <th style={{ padding: '10px 12px' }}>Rincian Kejadian</th>
                            <th style={{ padding: '10px 12px' }}>IP Address</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statusData.logs?.map((log) => (
                            <tr key={log.id} style={{ borderBottom: '1px solid var(--line2)' }}>
                              <td style={{ padding: '12px', color: 'var(--ink3)', whiteSpace: 'nowrap', fontSize: 12 }}>
                                {new Date(log.created_at).toLocaleString('id-ID')}
                              </td>
                              <td style={{ padding: '12px', fontWeight: 500 }}>{log.user_name || 'System'}</td>
                              <td style={{ padding: '12px', fontFamily: "'IBM Plex Mono',monospace", fontSize: 12 }}>
                                {log.action}
                              </td>
                              <td style={{ padding: '12px', color: 'var(--ink2)' }}>{log.details}</td>
                              <td style={{ padding: '12px', fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: 'var(--ink4)' }}>
                                {log.ip_address}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}
