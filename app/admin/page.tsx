'use client';

import { useState, useEffect, useTransition } from 'react';
import AdminNavBar from '@/components/AdminNavBar';
import BackgroundHills from '@/components/BackgroundHills';
import Reveal from '@/components/Reveal';
import DevModeBanner from '@/components/DevModeBanner';
import { getAktorSaatIni, type Aktor } from '@/lib/auth';
import {
  type BatchStatusResponse,
  type MonitoredPair,
  type RetrainResponse,
  INITIAL_BATCH_STATUS,
  INITIAL_PAIRS,
} from '@/lib/api';

const ADMIN_TABS = [
  { id: 'batch', label: 'Status Batch (KF-16)' },
  { id: 'models', label: 'Pelatihan Model (KF-17)' },
  { id: 'pairs', label: 'Pasangan Aset (KF-18)' },
];

function formatDurasi(detik: number): string {
  const m = Math.floor(detik / 60);
  const s = detik % 60;
  if (m === 0) return `${s} detik`;
  if (s === 0) return `${m} menit`;
  return `${m} menit ${s} detik`;
}

function formatWaktuLokal(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
  } catch {
    return isoString;
  }
}

function formatTanggalLokal(dateString: string): string {
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return dateString;
  } catch {
    return dateString;
  }
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('batch');
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [aktor, setAktor] = useState<Aktor | null>(null);

  // State KF-16 (Status Batch Harian)
  const [batchData, setBatchData] = useState<BatchStatusResponse>(INITIAL_BATCH_STATUS);

  // State KF-17 (Pemicu Pelatihan Ulang Model)
  const [isPendingRetrain, startRetrainTransition] = useTransition();
  const [retrainResult, setRetrainResult] = useState<(RetrainResponse & { waktu: string }) | null>(null);
  const [retrainError, setRetrainError] = useState<string | null>(null);

  // State KF-18 (Pengelolaan Pasangan Aset)
  const [pairs, setPairs] = useState<MonitoredPair[]>(INITIAL_PAIRS);
  const [pairFeedback, setPairFeedback] = useState<string | null>(null);
  const [testPairInput, setTestPairInput] = useState('');
  const [testPairResult, setTestPairResult] = useState<{ sukses: boolean; pesan: string } | null>(null);
  const [isPendingPairTest, startPairTestTransition] = useTransition();

  // Memuat data awal halaman admin secara asinkron
  const loadAdminData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const dataAktor = await getAktorSaatIni();
      setAktor(dataAktor);
    } catch {
      // Abaikan jika verifikasi sesi gagal di mode contoh
    }

    try {
      const [resBatch, resPairs] = await Promise.all([
        fetch('/api/admin/batch/status'),
        fetch('/api/admin/pairs'),
      ]);

      if (!resBatch.ok || !resPairs.ok) {
        throw new Error('Gagal memuat status batch atau konfigurasi pasangan aset dari server.');
      }

      const dBatch = await resBatch.json();
      setBatchData(dBatch);

      const dPairs = await resPairs.json();
      if (Array.isArray(dPairs.data)) {
        setPairs(dPairs.data);
      }
      setLastSynced(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB');
    } catch (err) {
      console.error('Gagal mengambil data operasional admin:', err);
      setFetchError('Terjadi kendala saat memuat data operasional dari server. Silakan coba kembali.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Handler KF-17: Memicu pelatihan ulang model
  const handleTriggerRetrain = () => {
    setRetrainError(null);
    setRetrainResult(null);

    startRetrainTransition(async () => {
      try {
        const res = await fetch('/api/admin/model/latih-ulang', { method: 'POST' });
        const data = await res.json();
        if (res.ok && data.diterima) {
          setRetrainResult({
            ...data,
            waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB',
          });
        } else {
          setRetrainError(data.pesan || data.error || 'Gagal memicu proses pelatihan ulang.');
        }
      } catch {
        setRetrainError('Terjadi kesalahan jaringan saat menghubungi endpoint pelatihan ulang.');
      }
    });
  };

  // Handler KF-18: Mengubah status pemantauan pair (Nonaktifkan / Aktifkan Kembali)
  const handleTogglePairStatus = async (pairSymbol: string, currentStatus: boolean) => {
    setPairFeedback(null);
    try {
      const targetClean = pairSymbol.toUpperCase().replace(/[^A-Z]/g, '');
      const res = await fetch(`/api/admin/pairs/${targetClean}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dipantau: !currentStatus }),
      });

      const data = await res.json();
      if (res.ok && data.sukses) {
        setPairs((prev) =>
          prev.map((p) =>
            p.pair.toUpperCase().replace(/[^A-Z]/g, '') === targetClean
              ? { ...p, dipantau: !currentStatus }
              : p
          )
        );
        setPairFeedback(data.pesan || `Status ${pairSymbol} berhasil diperbarui.`);
      } else {
        alert(data.error || 'Gagal memperbarui status pasangan aset.');
      }
    } catch {
      alert('Terjadi kesalahan koneksi saat memperbarui pasangan aset.');
    }
  };

  // Handler KF-18: Uji penambahan pasangan aset di luar batasan penelitian
  const handleTestAddPair = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPairInput.trim()) return;

    setTestPairResult(null);
    startPairTestTransition(async () => {
      try {
        const res = await fetch('/api/admin/pairs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pair: testPairInput.trim() }),
        });

        const data = await res.json();
        setTestPairResult({
          sukses: data.sukses ?? false,
          pesan: data.pesan || 'Permintaan diproses oleh server.',
        });
      } catch {
        setTestPairResult({
          sukses: false,
          pesan: 'Gagal terhubung ke endpoint pengujian penambahan pair.',
        });
      }
    });
  };

  // Kalkulasi ringkasan batch
  const riwayat14Hari = [batchData.terakhir, ...(batchData.riwayat || [])];
  const totalHari = riwayat14Hari.length;
  const hariBerhasil = riwayat14Hari.filter((b) => b.status === 'berhasil').length;
  const hariGagal = riwayat14Hari.filter((b) => b.status === 'gagal').length;
  const rasioBerhasil = totalHari > 0 ? Math.round((hariBerhasil / totalHari) * 100) : 0;
  const pairsAktifCount = pairs.filter((p) => p.dipantau).length;

  return (
    <>
      <DevModeBanner />
      <BackgroundHills />
      <div style={{ position: 'relative', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <AdminNavBar
          role="ADMIN"
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          tabs={ADMIN_TABS}
          userName={aktor?.nama || 'Operator Harian'}
        />

        <main style={{ flex: 1, maxWidth: 1320, width: '100%', margin: '0 auto', padding: '34px 24px 80px' }}>
          {/* Bar Status Sinkronisasi */}
          {lastSynced && !loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 999, background: 'var(--card)', border: '1px solid var(--line2)', font: "400 12px 'IBM Plex Mono',monospace", color: 'var(--ink3)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: fetchError ? 'var(--down)' : 'var(--lime)', display: 'inline-block' }} />
                Status Konsol: {fetchError ? 'Koneksi Terganggu' : 'Terhubung'} • Terakhir disinkronkan: {lastSynced}
              </div>
              <button
                onClick={loadAdminData}
                style={{
                  background: 'none',
                  border: '1px solid var(--line)',
                  borderRadius: 8,
                  padding: '4px 10px',
                  font: "500 11.5px 'IBM Plex Sans',sans-serif",
                  color: 'var(--ink2)',
                  cursor: 'pointer',
                }}
              >
                ↻ Muat Ulang Data
              </button>
            </div>
          )}

          {/* 1. Keadaan: Gagal Pengambilan Data (Error State) */}
          {fetchError && (
            <div
              style={{
                marginBottom: 24,
                padding: '18px 22px',
                borderRadius: 16,
                background: 'color-mix(in srgb, var(--down) 10%, transparent)',
                border: '1px solid var(--down)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 14,
              }}
            >
              <div>
                <div style={{ font: "600 14px 'IBM Plex Sans',sans-serif", color: 'var(--down)', marginBottom: 4 }}>
                  Kendala Pengambilan Data Operasional
                </div>
                <div style={{ font: "400 13px 'IBM Plex Sans',sans-serif", color: 'var(--ink2)' }}>
                  {fetchError}
                </div>
              </div>
              <button
                onClick={loadAdminData}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'var(--down)',
                  color: '#fff',
                  font: "500 12.5px 'IBM Plex Sans',sans-serif",
                  cursor: 'pointer',
                }}
              >
                Coba Muat Ulang Data
              </button>
            </div>
          )}

          {/* 2. Keadaan: Data Tidak Mutakhir (Stale State Warning) */}
          {!loading && batchData.terakhir.status === 'gagal' && (
            <div
              style={{
                marginBottom: 24,
                padding: '16px 20px',
                borderRadius: 14,
                background: 'color-mix(in srgb, #f59e0b 12%, transparent)',
                border: '1px solid #f59e0b',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>⚠️</span>
              <div>
                <strong style={{ font: "500 13.5px 'IBM Plex Sans',sans-serif", color: 'var(--ink)' }}>
                  Peringatan: Data Operasional Belum Termutakhirkan (Stale Data)
                </strong>
                <p style={{ margin: '4px 0 0', font: "400 12.5px/1.55 'IBM Plex Sans',sans-serif", color: 'var(--ink2)' }}>
                  Eksekusi batch harian terakhir tanggal {formatTanggalLokal(batchData.terakhir.tanggal)} mengalami kegagalan ({batchData.terakhir.catatan}). Metrik peramalan dan kalkulasi risiko pada dasbor publik tetap menyajikan hasil eksekusi batch sukses sebelumnya hingga jadwal eksekusi berikutnya.
                </p>
              </div>
            </div>
          )}

          {/* 3. Keadaan: Sedang Memuat (Loading State) */}
          {loading ? (
            <div style={{ padding: '80px 20px', textAlign: 'center', background: 'var(--card)', borderRadius: 20, border: '1px solid var(--line2)' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  margin: '0 auto 16px',
                  border: '3px solid var(--line)',
                  borderTopColor: 'var(--ink)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              <div style={{ font: "500 15px 'IBM Plex Sans',sans-serif", color: 'var(--ink)', marginBottom: 6 }}>
                Memuat Data Konsol Operasional Administrator…
              </div>
              <div style={{ font: "400 13px 'IBM Plex Sans',sans-serif", color: 'var(--ink3)' }}>
                Mengambil status eksekusi batch dan konfigurasi pemantauan pasangan aset kripto.
              </div>
            </div>
          ) : (
            <>
              {/* ═══════════════════════════════════════════════════════════ */}
              {/* 1. STATUS BATCH HARIAN (KF-16)                             */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {activeTab === 'batch' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
                  <Reveal order={1}>
                    <div>
                      <span style={{ font: "400 12px 'IBM Plex Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink3)' }}>
                        FITUR OPERASIONAL KF-16
                      </span>
                      <h2 style={{ margin: '8px 0 0', font: "400 32px 'PP Editorial New','Instrument Serif',serif" }}>
                        Status Proses Batch Harian
                      </h2>
                      <p style={{ margin: '8px 0 0', font: "400 14px/1.6 'IBM Plex Sans',sans-serif", color: 'var(--ink2)', maxWidth: 820 }}>
                        Proses pengambilan data candlestick dan inferensi model berjalan terjadwal secara mandiri setiap pukul 00:05 WIB tanpa pengawasan langsung. Riwayat ini mencatat performa dan catatan kendala operasional 14 hari terakhir.
                      </p>
                    </div>
                  </Reveal>

                  {/* Kartu Status Hari Terakhir */}
                  <div style={{ background: 'var(--card)', borderRadius: 20, padding: 24, border: '1px solid var(--line2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
                      <span style={{ font: "500 16px 'IBM Plex Sans',sans-serif" }}>
                        Eksekusi Batch Terakhir ({formatTanggalLokal(batchData.terakhir.tanggal)})
                      </span>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: 999,
                          font: "500 12px 'IBM Plex Mono',monospace",
                          background: batchData.terakhir.status === 'berhasil' ? 'var(--lime)' : 'var(--down)',
                          color: batchData.terakhir.status === 'berhasil' ? 'var(--onlime)' : '#fff',
                          textTransform: 'uppercase',
                        }}
                      >
                        {batchData.terakhir.status}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                      <div style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--surf2)' }}>
                        <div style={{ font: "400 11px 'IBM Plex Mono',monospace", color: 'var(--ink3)', textTransform: 'uppercase' }}>Waktu Mulai</div>
                        <div style={{ font: "500 15px 'IBM Plex Sans',sans-serif", marginTop: 4 }}>{formatWaktuLokal(batchData.terakhir.mulai)}</div>
                      </div>
                      <div style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--surf2)' }}>
                        <div style={{ font: "400 11px 'IBM Plex Mono',monospace", color: 'var(--ink3)', textTransform: 'uppercase' }}>Waktu Selesai</div>
                        <div style={{ font: "500 15px 'IBM Plex Sans',sans-serif", marginTop: 4 }}>{batchData.terakhir.selesai ? formatWaktuLokal(batchData.terakhir.selesai) : '-'}</div>
                      </div>
                      <div style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--surf2)' }}>
                        <div style={{ font: "400 11px 'IBM Plex Mono',monospace", color: 'var(--ink3)', textTransform: 'uppercase' }}>Lama Proses</div>
                        <div style={{ font: "500 15px 'IBM Plex Sans',sans-serif", marginTop: 4 }}>{formatDurasi(batchData.terakhir.lama_detik)}</div>
                      </div>
                      <div style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--surf2)' }}>
                        <div style={{ font: "400 11px 'IBM Plex Mono',monospace", color: 'var(--ink3)', textTransform: 'uppercase' }}>Rasio Keberhasilan (14 Hari)</div>
                        <div style={{ font: "500 15px 'IBM Plex Sans',sans-serif", marginTop: 4 }}>{hariBerhasil} dari {totalHari} hari ({rasioBerhasil}%)</div>
                      </div>
                    </div>

                    {batchData.terakhir.catatan && (
                      <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 12, background: 'color-mix(in srgb, var(--down) 12%, transparent)', color: 'var(--down)', font: "400 13px 'IBM Plex Sans',sans-serif" }}>
                        <strong>Catatan Kendala:</strong> {batchData.terakhir.catatan}
                      </div>
                    )}
                  </div>

                  {/* Tabel Riwayat 14 Hari */}
                  <div style={{ background: 'var(--card)', borderRadius: 20, padding: 24, border: '1px solid var(--line2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <h3 style={{ margin: 0, font: "500 17px 'IBM Plex Sans',sans-serif" }}>
                        Riwayat Eksekusi 14 Hari Terakhir
                      </h3>
                      <span style={{ font: "400 12px 'IBM Plex Mono',monospace", color: 'var(--ink3)' }}>
                        {hariGagal} Hari Gagal • {hariBerhasil} Hari Berhasil
                      </span>
                    </div>

                    <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                      <table style={{ width: '100%', minWidth: 640, borderCollapse: 'collapse', font: "400 13.5px 'IBM Plex Sans',sans-serif" }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--line)', textAlign: 'left', font: "400 11px 'IBM Plex Mono',monospace", color: 'var(--ink3)', textTransform: 'uppercase' }}>
                            <th style={{ padding: '12px 14px' }}>Tanggal</th>
                            <th style={{ padding: '12px 14px' }}>Waktu Mulai</th>
                            <th style={{ padding: '12px 14px' }}>Lama Proses</th>
                            <th style={{ padding: '12px 14px' }}>Status</th>
                            <th style={{ padding: '12px 14px' }}>Keterangan / Diagnostik</th>
                          </tr>
                        </thead>
                        <tbody>
                          {riwayat14Hari.length === 0 ? (
                            <tr>
                              <td colSpan={5} style={{ padding: 36, textAlign: 'center', color: 'var(--ink3)' }}>
                                Belum ada riwayat eksekusi batch yang tersimpan di sistem.
                              </td>
                            </tr>
                          ) : (
                            riwayat14Hari.map((item, idx) => (
                              <tr key={`${item.tanggal}-${idx}`} style={{ borderBottom: '1px solid var(--line2)' }}>
                                <td style={{ padding: '14px', font: "500 13.5px 'IBM Plex Mono',monospace" }}>
                                  {item.tanggal}
                                </td>
                                <td style={{ padding: '14px', color: 'var(--ink2)', fontSize: 13 }}>
                                  {formatWaktuLokal(item.mulai)}
                                </td>
                                <td style={{ padding: '14px', font: "400 13px 'IBM Plex Mono',monospace" }}>
                                  {formatDurasi(item.lama_detik)}
                                </td>
                                <td style={{ padding: '14px' }}>
                                  <span
                                    style={{
                                      padding: '3px 8px',
                                      borderRadius: 999,
                                      fontSize: 11,
                                      fontFamily: "'IBM Plex Mono',monospace",
                                      fontWeight: 500,
                                      background: item.status === 'berhasil' ? 'var(--lime)' : 'var(--down)',
                                      color: item.status === 'berhasil' ? 'var(--onlime)' : '#fff',
                                      textTransform: 'uppercase',
                                    }}
                                  >
                                    {item.status}
                                  </span>
                                </td>
                                <td style={{ padding: '14px', color: item.catatan ? 'var(--down)' : 'var(--ink3)', fontSize: 13 }}>
                                  {item.catatan || 'Inferensi dan pembaharuan metrik risiko berhasil diselesaikan.'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ marginTop: 10, font: "400 11px 'IBM Plex Sans',sans-serif", color: 'var(--ink3)' }}>
                      * Geser tabel secara horizontal untuk melihat rincian kolom pada layar ponsel.
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* 3. PELATIHAN ULANG MODEL (KF-17)                           */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {activeTab === 'models' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
                  <Reveal order={1}>
                    <div>
                      <span style={{ font: "400 12px 'IBM Plex Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink3)' }}>
                        FITUR OPERASIONAL KF-17
                      </span>
                      <h2 style={{ margin: '8px 0 0', font: "400 32px 'PP Editorial New','Instrument Serif',serif" }}>
                        Pemicu Pelatihan Ulang Model
                      </h2>
                      <p style={{ margin: '8px 0 0', font: "400 14px/1.6 'IBM Plex Sans',sans-serif", color: 'var(--ink2)', maxWidth: 820 }}>
                        Sesuai proposal skripsi, sistem tidak melakukan pelatihan ulang otomatis. Pemicu manual ini adalah satu-satunya mekanisme pembaruan bobot model LSTM, GRU, dan XGBoost menggunakan jendela data historis terbaru.
                      </p>
                    </div>
                  </Reveal>

                  {/* Panel Kontrol & Aksi Pemicu */}
                  <div style={{ background: 'var(--card)', borderRadius: 20, padding: 26, border: '1px solid var(--line2)' }}>
                    <div style={{ maxWidth: 720 }}>
                      <h3 style={{ margin: 0, font: "500 18px 'IBM Plex Sans',sans-serif" }}>
                        Mekanisme Pembaruan Bobot Ensemble
                      </h3>
                      <p style={{ margin: '10px 0 20px', font: "400 14px/1.65 'IBM Plex Sans',sans-serif", color: 'var(--ink2)' }}>
                        Pelatihan ulang akan mengambil rangkaian data lilin harga terbaru untuk ketiga pasangan aset acuan, mengalkulasi kesalahan MAPE 30 hari terakhir, serta memperbarui matriks bobot pembobotan inversi varians.
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                        <button
                          onClick={handleTriggerRetrain}
                          disabled={isPendingRetrain}
                          style={{
                            padding: '12px 24px',
                            borderRadius: 12,
                            border: 'none',
                            background: isPendingRetrain ? 'var(--ink3)' : 'var(--ink)',
                            color: '#fff',
                            font: "500 14px 'IBM Plex Sans',sans-serif",
                            cursor: isPendingRetrain ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                          }}
                        >
                          {isPendingRetrain ? 'Memproses Pemicuan…' : 'Latih Ulang Model Sekarang'}
                        </button>

                        <span style={{ font: "400 12.5px 'IBM Plex Mono',monospace", color: 'var(--ink3)' }}>
                          Proses berjalan asinkron di latar belakang
                        </span>
                      </div>
                    </div>

                    {/* Umpan Balik Berhasil */}
                    {retrainResult && (
                      <div
                        style={{
                          marginTop: 24,
                          padding: '18px 20px',
                          borderRadius: 14,
                          background: 'color-mix(in srgb, var(--lime) 15%, transparent)',
                          border: '1px solid var(--lime)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <span style={{ padding: '3px 8px', borderRadius: 999, background: 'var(--lime)', color: 'var(--onlime)', font: "500 11px 'IBM Plex Mono',monospace", textTransform: 'uppercase' }}>
                            Proses Diterima
                          </span>
                          <span style={{ font: "500 13px 'IBM Plex Mono',monospace", color: 'var(--ink)' }}>
                            ID Proses: {retrainResult.id_proses}
                          </span>
                          <span style={{ font: "400 12px 'IBM Plex Mono',monospace", color: 'var(--ink3)' }}>
                            • {retrainResult.waktu}
                          </span>
                        </div>
                        <p style={{ margin: 0, font: "400 13.5px/1.5 'IBM Plex Sans',sans-serif", color: 'var(--ink)' }}>
                          {retrainResult.pesan}
                        </p>
                      </div>
                    )}

                    {/* Umpan Balik Galat */}
                    {retrainError && (
                      <div
                        style={{
                          marginTop: 24,
                          padding: '16px 20px',
                          borderRadius: 14,
                          background: 'color-mix(in srgb, var(--down) 12%, transparent)',
                          border: '1px solid var(--down)',
                          color: 'var(--down)',
                          font: "400 13.5px 'IBM Plex Sans',sans-serif",
                        }}
                      >
                        {retrainError}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* 4. PASANGAN ASET KRIPTO (KF-18)                            */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {activeTab === 'pairs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
                  <Reveal order={1}>
                    <div>
                      <span style={{ font: "400 12px 'IBM Plex Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink3)' }}>
                        FITUR OPERASIONAL KF-18
                      </span>
                      <h2 style={{ margin: '8px 0 0', font: "400 32px 'PP Editorial New','Instrument Serif',serif" }}>
                        Pengelolaan Pasangan Aset Kripto
                      </h2>
                      <p style={{ margin: '8px 0 0', font: "400 14px/1.6 'IBM Plex Sans',sans-serif", color: 'var(--ink2)', maxWidth: 820 }}>
                        Ruang lingkup penelitian dibatasi secara ketat pada tiga pasangan aset acuan: BTC/USDT, ETH/USDT, dan BNB/USDT. Status pemantauan dapat diubah (nonaktifkan/aktifkan kembali) tanpa pernah menghapus data historisnya.
                      </p>
                    </div>
                  </Reveal>

                  {/* Feedback Sukses Perubahan Status */}
                  {pairFeedback && (
                    <div style={{ padding: '14px 18px', borderRadius: 14, background: 'var(--surf2)', border: '1px solid var(--line)', color: 'var(--ink)', font: "400 13.5px 'IBM Plex Sans',sans-serif" }}>
                      ✓ {pairFeedback}
                    </div>
                  )}

                  {/* Tabel 3 Pasangan Aset Utama */}
                  <div style={{ background: 'var(--card)', borderRadius: 20, padding: 24, border: '1px solid var(--line2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <h3 style={{ margin: 0, font: "500 17px 'IBM Plex Sans',sans-serif" }}>
                        Daftar Pasangan Aset yang Dipantau
                      </h3>
                      <span style={{ font: "400 12px 'IBM Plex Mono',monospace", color: 'var(--ink3)' }}>
                        Tidak ada tombol hapus • Data historis permanen
                      </span>
                    </div>

                    <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                      <table style={{ width: '100%', minWidth: 640, borderCollapse: 'collapse', font: "400 13.5px 'IBM Plex Sans',sans-serif" }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--line)', textAlign: 'left', font: "400 11px 'IBM Plex Mono',monospace", color: 'var(--ink3)', textTransform: 'uppercase' }}>
                            <th style={{ padding: '12px 14px' }}>Pasangan Aset</th>
                            <th style={{ padding: '12px 14px' }}>Nama Aset</th>
                            <th style={{ padding: '12px 14px' }}>Data Mulai</th>
                            <th style={{ padding: '12px 14px' }}>Data Terakhir</th>
                            <th style={{ padding: '12px 14px' }}>Status Pemantauan</th>
                            <th style={{ padding: '12px 14px', textAlign: 'right' }}>Aksi Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pairs.length === 0 ? (
                            <tr>
                              <td colSpan={6} style={{ padding: 36, textAlign: 'center', color: 'var(--ink3)' }}>
                                Belum ada pasangan aset kripto yang terdaftar dalam sistem.
                              </td>
                            </tr>
                          ) : (
                            pairs.map((p) => (
                              <tr key={p.pair} style={{ borderBottom: '1px solid var(--line2)' }}>
                                <td style={{ padding: '14px', font: "500 14px 'IBM Plex Mono',monospace" }}>
                                  {p.pair}
                                </td>
                                <td style={{ padding: '14px', color: 'var(--ink)' }}>
                                  {p.nama}
                                </td>
                                <td style={{ padding: '14px', font: "400 13px 'IBM Plex Mono',monospace", color: 'var(--ink2)' }}>
                                  {p.data_mulai}
                                </td>
                                <td style={{ padding: '14px', font: "400 13px 'IBM Plex Mono',monospace", color: 'var(--ink2)' }}>
                                  {p.data_terakhir}
                                </td>
                                <td style={{ padding: '14px' }}>
                                  <span
                                    style={{
                                      padding: '3px 8px',
                                      borderRadius: 999,
                                      fontSize: 11,
                                      fontFamily: "'IBM Plex Mono',monospace",
                                      fontWeight: 500,
                                      background: p.dipantau ? 'var(--lime)' : 'var(--surf2)',
                                      color: p.dipantau ? 'var(--onlime)' : 'var(--ink3)',
                                      border: p.dipantau ? 'none' : '1px solid var(--line)',
                                    }}
                                  >
                                    {p.dipantau ? 'DIPANTAU' : 'NONAKTIF'}
                                  </span>
                                </td>
                                <td style={{ padding: '14px', textAlign: 'right' }}>
                                  <button
                                    onClick={() => handleTogglePairStatus(p.pair, p.dipantau)}
                                    style={{
                                      padding: '6px 14px',
                                      borderRadius: 8,
                                      border: '1px solid var(--line)',
                                      background: p.dipantau ? 'var(--card)' : 'var(--lime)',
                                      color: p.dipantau ? 'var(--down)' : 'var(--onlime)',
                                      font: "500 12px 'IBM Plex Sans',sans-serif",
                                      cursor: 'pointer',
                                      transition: 'background .2s',
                                    }}
                                  >
                                    {p.dipantau ? 'Nonaktifkan' : 'Aktifkan Kembali'}
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ marginTop: 10, font: "400 11px 'IBM Plex Sans',sans-serif", color: 'var(--ink3)' }}>
                      * Geser tabel secara horizontal untuk melihat seluruh kolom pada layar ponsel.
                    </div>
                  </div>

                  {/* Panel Pengujian Batasan Metodologis Penambahan Pair */}
                  <div style={{ background: 'var(--card)', borderRadius: 20, padding: 24, border: '1px solid var(--line2)' }}>
                    <h3 style={{ margin: '0 0 6px', font: "500 17px 'IBM Plex Sans',sans-serif" }}>
                      Uji Penegakan Batasan Masalah (Tambah Pasangan Aset Baru)
                    </h3>
                    <p style={{ margin: '0 0 16px', font: "400 13.5px/1.6 'IBM Plex Sans',sans-serif", color: 'var(--ink2)', maxWidth: 740 }}>
                      Ruang lingkup penelitian dibatasi pada tiga pasangan aset. Menambah pasangan di luar itu membuat sistem tidak sesuai dengan batasan masalah. Anda dapat menguji pengajuan pasangan baru untuk memverifikasi penolakan metodologis sistem.
                    </p>

                    <form onSubmit={handleTestAddPair} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', maxWidth: 500 }}>
                      <input
                        type="text"
                        value={testPairInput}
                        onChange={(e) => setTestPairInput(e.target.value)}
                        placeholder="Masukkan simbol pasangan aset"
                        style={{
                          flex: 1,
                          minWidth: 200,
                          padding: '10px 14px',
                          borderRadius: 10,
                          border: '1px solid var(--line)',
                          background: 'var(--surf2)',
                          color: 'var(--ink)',
                          font: "500 13px 'IBM Plex Mono',monospace",
                        }}
                      />
                      <button
                        type="submit"
                        disabled={isPendingPairTest}
                        style={{
                          padding: '10px 18px',
                          borderRadius: 10,
                          border: 'none',
                          background: 'var(--ink)',
                          color: '#fff',
                          font: "500 13px 'IBM Plex Sans',sans-serif",
                          cursor: isPendingPairTest ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {isPendingPairTest ? 'Menguji…' : 'Ajukan Penambahan'}
                      </button>
                    </form>

                    {testPairResult && (
                      <div
                        style={{
                          marginTop: 18,
                          padding: '14px 18px',
                          borderRadius: 12,
                          background: testPairResult.sukses ? 'color-mix(in srgb, var(--lime) 15%, transparent)' : 'color-mix(in srgb, var(--down) 12%, transparent)',
                          border: testPairResult.sukses ? '1px solid var(--lime)' : '1px solid var(--down)',
                          color: testPairResult.sukses ? 'var(--ink)' : 'var(--down)',
                          font: "400 13px/1.55 'IBM Plex Sans',sans-serif",
                        }}
                      >
                        <strong>{testPairResult.sukses ? 'Hasil:' : 'Penolakan Metodologis (HTTP 400):'}</strong>{' '}
                        {testPairResult.pesan}
                      </div>
                    )}
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
