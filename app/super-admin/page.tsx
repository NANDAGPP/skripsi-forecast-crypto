'use client';

import { useState, useEffect, useTransition } from 'react';
import AdminNavBar from '@/components/AdminNavBar';
import BackgroundHills from '@/components/BackgroundHills';
import Reveal from '@/components/Reveal';
import DevModeBanner from '@/components/DevModeBanner';
import { getAktorSaatIni, type Aktor } from '@/lib/auth';
import {
  type AdminAccount,
  type OperationalConfig,
  type AuditLogEntry,
  INITIAL_ACCOUNTS,
  INITIAL_CONFIG,
  INITIAL_AUDIT_LOGS,
} from '@/lib/api';

function formatWaktuLokal(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) + ' ' + d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' WIB';
  } catch {
    return isoString;
  }
}

function formatTanggalLokal(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

function formatRupiah(angka: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(angka);
}

export default function SuperAdminPage() {
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [aktor, setAktor] = useState<Aktor | null>(null);

  // ═══════════════════════════════════════════════════════════
  // STATE KF-19: PENGELOLAAN AKUN ADMINISTRATOR
  // ═══════════════════════════════════════════════════════════
  const [accounts, setAccounts] = useState<AdminAccount[]>(INITIAL_ACCOUNTS);
  const [isPendingAccount, startAccountTransition] = useTransition();
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountEmail, setNewAccountEmail] = useState('');
  const [accountFeedback, setAccountFeedback] = useState<{ sukses: boolean; pesan: string } | null>(null);

  // State Modal Ubah Nama / Surel Akun
  const [editingAccount, setEditingAccount] = useState<AdminAccount | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [isPendingEdit, startEditTransition] = useTransition();

  // ═══════════════════════════════════════════════════════════
  // STATE KF-20: KONFIGURASI OPERASIONAL SISTEM
  // ═══════════════════════════════════════════════════════════
  const [config, setConfig] = useState<OperationalConfig>(INITIAL_CONFIG);
  const [confConfidence, setConfConfidence] = useState<number>(INITIAL_CONFIG.tingkat_kepercayaan);
  const [confWindowDays, setConfWindowDays] = useState<number>(INITIAL_CONFIG.jendela_bobot_hari);
  const [confPortfolio, setConfPortfolio] = useState<number>(INITIAL_CONFIG.portofolio_ilustratif);
  const [confBatchTime, setConfBatchTime] = useState<string>(INITIAL_CONFIG.waktu_batch);
  const [isPendingConfig, startConfigTransition] = useTransition();
  const [configFeedback, setConfigFeedback] = useState<{ sukses: boolean; pesan: string } | null>(null);

  // ═══════════════════════════════════════════════════════════
  // STATE KF-21: LOG TINDAKAN ADMINISTRATOR (AUDIT TRAIL)
  // ═══════════════════════════════════════════════════════════
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [filterAktor, setFilterAktor] = useState('');
  const [filterMulai, setFilterMulai] = useState('');
  const [filterSelesai, setFilterSelesai] = useState('');
  const [filterHasil, setFilterHasil] = useState<'semua' | 'berhasil' | 'gagal'>('semua');

  const handleResetFilter = () => {
    setFilterAktor('');
    setFilterMulai('');
    setFilterSelesai('');
    setFilterHasil('semua');
  };

  // Memuat data awal halaman super admin secara asinkron
  const loadSuperAdminData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const dataAktor = await getAktorSaatIni();
      setAktor(dataAktor);
    } catch {
      // Abaikan jika auth gagal pada mode contoh
    }

    try {
      const [resAccounts, resConfig, resLogs] = await Promise.all([
        fetch('/api/super/akun'),
        fetch('/api/super/konfigurasi'),
        fetch('/api/super/log'),
      ]);

      if (!resAccounts.ok || !resConfig.ok || !resLogs.ok) {
        throw new Error('Gagal mengambil satu atau beberapa data konfigurasi, akun, atau log dari server.');
      }

      const d = await resAccounts.json();
      if (Array.isArray(d.data)) setAccounts(d.data);

      const c = await resConfig.json();
      setConfig(c);
      setConfConfidence(c.tingkat_kepercayaan ?? 0.95);
      setConfWindowDays(c.jendela_bobot_hari ?? 30);
      setConfPortfolio(c.portofolio_ilustratif ?? 100000000);
      setConfBatchTime(c.waktu_batch ?? '00:05');

      const l = await resLogs.json();
      if (Array.isArray(l.data)) setAuditLogs(l.data);

      setLastSynced(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB');
    } catch (err) {
      console.error('Gagal mengambil data konsol super admin:', err);
      setFetchError('Terjadi kendala saat memuat data operasional dari server. Silakan coba kembali.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuperAdminData();
  }, []);

  // ─────────────────────────────────────────────────────────
  // HANDLERS KF-19: AKUN ADMINISTRATOR
  // ─────────────────────────────────────────────────────────
  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim() || !newAccountEmail.trim()) return;

    setAccountFeedback(null);
    startAccountTransition(async () => {
      try {
        const res = await fetch('/api/super/akun', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nama: newAccountName.trim(),
            surel: newAccountEmail.trim(),
          }),
        });

        const data = await res.json();
        if (res.ok && data.sukses) {
          setAccounts((prev) => [...prev, data.data]);
          setNewAccountName('');
          setNewAccountEmail('');
          setAccountFeedback({
            sukses: true,
            pesan: data.pesan || 'Akun administrator baru berhasil dibuat.',
          });
        } else {
          setAccountFeedback({
            sukses: false,
            pesan: data.error || 'Gagal menambahkan akun administrator.',
          });
        }
      } catch {
        setAccountFeedback({
          sukses: false,
          pesan: 'Terjadi kesalahan jaringan saat menambahkan akun administrator.',
        });
      }
    });
  };

  const handleToggleAccountStatus = async (account: AdminAccount) => {
    if (account.id === 'super-01') {
      alert('Akun Super Administrator Utama tidak dapat dinonaktifkan.');
      return;
    }

    try {
      const res = await fetch(`/api/super/akun/${account.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aktif: !account.aktif }),
      });

      const data = await res.json();
      if (res.ok && data.sukses) {
        setAccounts((prev) =>
          prev.map((acc) => (acc.id === account.id ? { ...acc, aktif: !account.aktif } : acc))
        );
        setAccountFeedback({
          sukses: true,
          pesan: data.pesan || `Status akun ${account.nama} berhasil diperbarui.`,
        });
      } else {
        alert(data.error || 'Gagal memperbarui status akun.');
      }
    } catch {
      alert('Terjadi kesalahan jaringan saat mengubah status akun.');
    }
  };

  const handleResetPassword = async (account: AdminAccount) => {
    try {
      const res = await fetch(`/api/super/akun/${account.id}/reset-sandi`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.sukses) {
        alert(data.pesan);
      } else {
        alert(data.error || 'Gagal memproses permintaan reset kata sandi.');
      }
    } catch {
      alert('Terjadi kesalahan jaringan saat menghubungi endpoint reset sandi.');
    }
  };

  const handleOpenEditModal = (acc: AdminAccount) => {
    setEditingAccount(acc);
    setEditName(acc.nama);
    setEditEmail(acc.surel);
  };

  const handleSaveEditAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    startEditTransition(async () => {
      try {
        const res = await fetch(`/api/super/akun/${editingAccount.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nama: editName.trim(),
            surel: editEmail.trim(),
          }),
        });

        const data = await res.json();
        if (res.ok && data.sukses) {
          setAccounts((prev) =>
            prev.map((acc) =>
              acc.id === editingAccount.id ? { ...acc, nama: editName.trim(), surel: editEmail.trim() } : acc
            )
          );
          setEditingAccount(null);
          setAccountFeedback({
            sukses: true,
            pesan: `Informasi akun ${editName} berhasil diperbarui.`,
          });
        } else {
          alert(data.error || 'Gagal memperbarui informasi akun.');
        }
      } catch {
        alert('Terjadi kesalahan jaringan saat menyimpan perubahan akun.');
      }
    });
  };

  // ─────────────────────────────────────────────────────────
  // HANDLERS KF-20: KONFIGURASI OPERASIONAL
  // ─────────────────────────────────────────────────────────
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setConfigFeedback(null);

    startConfigTransition(async () => {
      try {
        const res = await fetch('/api/super/konfigurasi', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tingkat_kepercayaan: confConfidence,
            jendela_bobot_hari: Number(confWindowDays),
            portofolio_ilustratif: Number(confPortfolio),
            waktu_batch: confBatchTime.trim(),
          }),
        });

        const data = await res.json();
        if (res.ok && data.sukses) {
          setConfig(data.data);
          setConfigFeedback({
            sukses: true,
            pesan: data.pesan || 'Konfigurasi operasional sistem berhasil diperbarui.',
          });
        } else {
          // Menampilkan pesan galat HTTP 422 apa adanya dari server
          setConfigFeedback({
            sukses: false,
            pesan: data.error || 'Gagal menyimpan konfigurasi operasional sistem.',
          });
        }
      } catch {
        setConfigFeedback({
          sukses: false,
          pesan: 'Terjadi kesalahan jaringan saat menyimpan konfigurasi sistem.',
        });
      }
    });
  };

  // ─────────────────────────────────────────────────────────
  // FILTER KF-21: LOG TINDAKAN ADMINISTRATOR
  // ─────────────────────────────────────────────────────────
  const filteredAuditLogs = auditLogs.filter((log) => {
    // 1. Filter aktor
    if (filterAktor.trim()) {
      const q = filterAktor.trim().toLowerCase();
      if (!log.aktor.toLowerCase().includes(q)) return false;
    }

    // 2. Filter rentang tanggal
    if (filterMulai) {
      const tMulai = new Date(filterMulai).getTime();
      if (!isNaN(tMulai) && new Date(log.waktu).getTime() < tMulai) return false;
    }
    if (filterSelesai) {
      const tSelesai = new Date(filterSelesai).getTime();
      if (!isNaN(tSelesai) && new Date(log.waktu).getTime() > tSelesai + 86400000) return false;
    }

    // 3. Filter status hasil
    if (filterHasil !== 'semua' && log.hasil !== filterHasil) return false;

    return true;
  });

  const totalLogsCount = auditLogs.length;
  const successLogsCount = auditLogs.filter((l) => l.hasil === 'berhasil').length;
  const failedLogsCount = auditLogs.filter((l) => l.hasil === 'gagal').length;

  return (
    <>
      <DevModeBanner />
      <BackgroundHills />
      <div style={{ position: 'relative', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <AdminNavBar
          role="SUPER_ADMIN"
          activeTab=""
          onSelectTab={() => {}}
          tabs={[]}
          userName={aktor?.nama || 'Super Administrator'}
        />

        <main style={{ flex: 1, maxWidth: 1320, width: '100%', margin: '0 auto', padding: '34px 24px 90px' }}>
          {/* Bar Status Sinkronisasi */}
          {lastSynced && !loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 999, background: 'var(--card)', border: '1px solid var(--line2)', font: "400 12px 'IBM Plex Mono',monospace", color: 'var(--ink3)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: fetchError ? 'var(--down)' : 'var(--lime)', display: 'inline-block' }} />
                Status Konsol: {fetchError ? 'Koneksi Terganggu' : 'Terhubung'} • Terakhir disinkronkan: {lastSynced}
              </div>
              <button
                onClick={loadSuperAdminData}
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
                  Kendala Pengambilan Data Konsol
                </div>
                <div style={{ font: "400 13px 'IBM Plex Sans',sans-serif", color: 'var(--ink2)' }}>
                  {fetchError}
                </div>
              </div>
              <button
                onClick={loadSuperAdminData}
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

          {/* 2. Keadaan: Sedang Memuat (Loading State) */}
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
                Memuat Data Konsol Super Administrator…
              </div>
              <div style={{ font: "400 13px 'IBM Plex Sans',sans-serif", color: 'var(--ink3)' }}>
                Mengambil daftar akun administrator, konfigurasi operasional, dan log audit sistem.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 52 }}>
              {/* ═══════════════════════════════════════════════════════════ */}
              {/* HERO HEADER: PUSAT KENDALI TINGKAT LANJUT                    */}
              {/* ═══════════════════════════════════════════════════════════ */}
              <Reveal order={1}>
                <div>
                  <span style={{ font: "400 12px 'IBM Plex Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink3)' }}>
                    KONSOL SUPER ADMINISTRATOR • KF-19 S.D. KF-21
                  </span>
                  <h1 style={{ margin: '8px 0 0', font: "400 clamp(32px, 5vw, 44px)/1.15 'PP Editorial New','Instrument Serif',serif" }}>
                    Pusat Kendali Tingkat Lanjut Sistem
                  </h1>
                  <p style={{ margin: '12px 0 0', font: "400 15px/1.65 'IBM Plex Sans',sans-serif", color: 'var(--ink2)', maxWidth: 840 }}>
                    Halaman ini mencakup tiga bagian fungsional yang disusun secara bertumpuk: Pengelolaan Akun Administrator (KF-19), Konfigurasi Operasional Sistem (KF-20), dan Log Tindakan Administrator (KF-21). Sesuai metodologi skripsi, seluruh hak tata kelola berada penuh di bawah kendali Super Administrator.
                  </p>

                  {/* Pintasan Cepat Antar-Bagian */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
                    <a
                      href="#kf-19"
                      style={{
                        padding: '6px 14px',
                        borderRadius: 999,
                        background: 'var(--surf2)',
                        border: '1px solid var(--line)',
                        color: 'var(--ink)',
                        font: "500 12px 'IBM Plex Sans',sans-serif",
                        textDecoration: 'none',
                        transition: 'border-color .2s',
                      }}
                    >
                      ↓ Akun Administrator (KF-19)
                    </a>
                    <a
                      href="#kf-20"
                      style={{
                        padding: '6px 14px',
                        borderRadius: 999,
                        background: 'var(--surf2)',
                        border: '1px solid var(--line)',
                        color: 'var(--ink)',
                        font: "500 12px 'IBM Plex Sans',sans-serif",
                        textDecoration: 'none',
                        transition: 'border-color .2s',
                      }}
                    >
                      ↓ Konfigurasi Sistem (KF-20)
                    </a>
                    <a
                      href="#kf-21"
                      style={{
                        padding: '6px 14px',
                        borderRadius: 999,
                        background: 'var(--surf2)',
                        border: '1px solid var(--line)',
                        color: 'var(--ink)',
                        font: "500 12px 'IBM Plex Sans',sans-serif",
                        textDecoration: 'none',
                        transition: 'border-color .2s',
                      }}
                    >
                      ↓ Log Tindakan Administrator (KF-21)
                    </a>
                  </div>
                </div>
              </Reveal>

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* BAGIAN 1: PENGELOLAAN AKUN ADMINISTRATOR (KF-19)            */}
              {/* ═══════════════════════════════════════════════════════════ */}
              <section id="kf-19" style={{ display: 'flex', flexDirection: 'column', gap: 24, scrollMarginTop: 90 }}>
                <Reveal order={2}>
                  <div>
                    <span style={{ font: "400 12px 'IBM Plex Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink3)' }}>
                      BAGIAN 1 • KEBUTUHAN FUNGSIONAL KF-19
                    </span>
                    <h2 style={{ margin: '6px 0 0', font: "400 32px 'PP Editorial New','Instrument Serif',serif" }}>
                      Pengelolaan Akun Administrator
                    </h2>
                    <p style={{ margin: '8px 0 0', font: "400 14px/1.6 'IBM Plex Sans',sans-serif", color: 'var(--ink2)', maxWidth: 860 }}>
                      Sesuai batasan skripsi (Subbab 3.5.3), sistem tidak menyediakan pendaftaran mandiri. Pembuatan akun dilakukan secara eksklusif oleh Super Administrator. Akun hanya dapat dinonaktifkan (tidak ada tombol hapus) agar jejak identitas aktor pada log audit tetap terpelihara utuh.
                    </p>
                  </div>
                </Reveal>

                {accountFeedback && (
                  <div
                    style={{
                      padding: '12px 18px',
                      borderRadius: 12,
                      background: accountFeedback.sukses ? 'color-mix(in srgb, var(--lime) 15%, transparent)' : 'color-mix(in srgb, var(--down) 12%, transparent)',
                      border: accountFeedback.sukses ? '1px solid var(--lime)' : '1px solid var(--down)',
                      color: accountFeedback.sukses ? 'var(--ink)' : 'var(--down)',
                      font: "400 13.5px 'IBM Plex Sans',sans-serif",
                    }}
                  >
                    {accountFeedback.pesan}
                  </div>
                )}

                {/* Tabel Akun Administrator */}
                <div style={{ background: 'var(--card)', borderRadius: 20, padding: 24, border: '1px solid var(--line2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                    <h3 style={{ margin: 0, font: "500 17px 'IBM Plex Sans',sans-serif" }}>
                      Daftar Akun Administrator Sistem ({accounts.length})
                    </h3>
                    <span style={{ font: "400 12px 'IBM Plex Mono',monospace", color: 'var(--ink3)' }}>
                      Total {accounts.filter((a) => a.aktif).length} Akun Aktif
                    </span>
                  </div>

                  <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse', textAlign: 'left', font: "400 13.5px 'IBM Plex Sans',sans-serif" }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--ink3)', fontSize: 11.5, fontFamily: "'IBM Plex Mono',monospace", textTransform: 'uppercase', letterSpacing: '.06em' }}>
                          <th style={{ padding: '12px 14px' }}>ID Akun</th>
                          <th style={{ padding: '12px 14px' }}>Nama Lengkap</th>
                          <th style={{ padding: '12px 14px' }}>Alamat Surel</th>
                          <th style={{ padding: '12px 14px' }}>Peran</th>
                          <th style={{ padding: '12px 14px' }}>Status</th>
                          <th style={{ padding: '12px 14px' }}>Dibuat</th>
                          <th style={{ padding: '12px 14px', textAlign: 'right' }}>Tindakan Pengelolaan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accounts.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ padding: 36, textAlign: 'center', color: 'var(--ink3)' }}>
                              Belum ada akun administrator yang terdaftar dalam sistem.
                            </td>
                          </tr>
                        ) : (
                          accounts.map((acc) => (
                            <tr key={acc.id} style={{ borderBottom: '1px solid var(--line2)' }}>
                              <td style={{ padding: '14px', font: "500 13px 'IBM Plex Mono',monospace" }}>
                                {acc.id}
                              </td>
                              <td style={{ padding: '14px', fontWeight: 500, color: 'var(--ink)' }}>
                                {acc.nama}
                              </td>
                              <td style={{ padding: '14px', color: 'var(--ink2)', font: "400 13px 'IBM Plex Mono',monospace" }}>
                                {acc.surel}
                              </td>
                              <td style={{ padding: '14px' }}>
                                <span
                                  style={{
                                    padding: '3px 8px',
                                    borderRadius: 999,
                                    fontSize: 10.5,
                                    fontFamily: "'IBM Plex Mono',monospace",
                                    fontWeight: 500,
                                    background: acc.peran === 'SUPER_ADMINISTRATOR' ? 'var(--lime)' : 'var(--surf2)',
                                    color: acc.peran === 'SUPER_ADMINISTRATOR' ? 'var(--onlime)' : 'var(--ink)',
                                    border: acc.peran === 'SUPER_ADMINISTRATOR' ? 'none' : '1px solid var(--line)',
                                  }}
                                >
                                  {acc.peran === 'SUPER_ADMINISTRATOR' ? 'Super Admin' : 'Admin'}
                                </span>
                              </td>
                              <td style={{ padding: '14px' }}>
                                <span
                                  style={{
                                    padding: '3px 8px',
                                    borderRadius: 999,
                                    fontSize: 11,
                                    fontFamily: "'IBM Plex Mono',monospace",
                                    fontWeight: 500,
                                    background: acc.aktif ? 'color-mix(in srgb, var(--lime) 20%, transparent)' : 'var(--surf2)',
                                    color: acc.aktif ? 'var(--ink)' : 'var(--ink3)',
                                    border: acc.aktif ? '1px solid var(--lime)' : '1px solid var(--line)',
                                  }}
                                >
                                  {acc.aktif ? 'Aktif' : 'Nonaktif'}
                                </span>
                              </td>
                              <td style={{ padding: '14px', color: 'var(--ink3)', fontSize: 12.5 }}>
                                {formatTanggalLokal(acc.dibuat)}
                              </td>
                              <td style={{ padding: '14px', textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: 6 }}>
                                  <button
                                    onClick={() => handleOpenEditModal(acc)}
                                    style={{
                                      padding: '5px 10px',
                                      borderRadius: 6,
                                      border: '1px solid var(--line)',
                                      background: 'var(--surf2)',
                                      color: 'var(--ink)',
                                      font: "500 12px 'IBM Plex Sans',sans-serif",
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Ubah
                                  </button>
                                  <button
                                    onClick={() => handleResetPassword(acc)}
                                    style={{
                                      padding: '5px 10px',
                                      borderRadius: 6,
                                      border: '1px solid var(--line)',
                                      background: 'var(--surf2)',
                                      color: 'var(--ink2)',
                                      font: "500 12px 'IBM Plex Sans',sans-serif",
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Reset Sandi
                                  </button>
                                  {acc.id !== 'super-01' && (
                                    <button
                                      onClick={() => handleToggleAccountStatus(acc)}
                                      style={{
                                        padding: '5px 10px',
                                        borderRadius: 6,
                                        border: '1px solid var(--line)',
                                        background: acc.aktif ? 'var(--card)' : 'var(--lime)',
                                        color: acc.aktif ? 'var(--down)' : 'var(--onlime)',
                                        font: "500 12px 'IBM Plex Sans',sans-serif",
                                        cursor: 'pointer',
                                      }}
                                    >
                                      {acc.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                                    </button>
                                  )}
                                </div>
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

                  <p style={{ margin: '18px 0 0', font: "400 12px/1.5 'IBM Plex Sans',sans-serif", color: 'var(--ink3)' }}>
                    * Catatan: Tindakan penghapusan akun ditiadakan secara metodologis. Akun hanya dapat dinonaktifkan agar rekam jejak identitas aktor pada tabel audit tidak menjadi anonim atau terputus.
                  </p>
                </div>

                {/* Formulir Tambah Akun Baru (Tanpa Isian Kata Sandi) */}
                <div style={{ background: 'var(--card)', borderRadius: 20, padding: 24, border: '1px solid var(--line2)' }}>
                  <h3 style={{ margin: '0 0 6px', font: "500 17px 'IBM Plex Sans',sans-serif" }}>
                    Tambah Akun Administrator Baru
                  </h3>
                  <p style={{ margin: '0 0 18px', font: "400 13.5px/1.6 'IBM Plex Sans',sans-serif", color: 'var(--ink2)', maxWidth: 740 }}>
                    Sesuai proposal skripsi, formulir pembuatan akun tidak memuat isian kata sandi. Kata sandi sementara dibangkitkan langsung oleh server saat akun dibuat.
                  </p>

                  <form onSubmit={handleCreateAccount} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, maxWidth: 800 }}>
                    <div>
                      <label style={{ display: 'block', font: "400 11.5px 'IBM Plex Mono',monospace", textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 6 }}>
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        value={newAccountName}
                        onChange={(e) => setNewAccountName(e.target.value)}
                        placeholder="Contoh: Operator Tiga"
                        required
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 10,
                          border: '1px solid var(--line)',
                          background: 'var(--surf2)',
                          color: 'var(--ink)',
                          font: "400 13.5px 'IBM Plex Sans',sans-serif",
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', font: "400 11.5px 'IBM Plex Mono',monospace", textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 6 }}>
                        Alamat Surel Administrator
                      </label>
                      <input
                        type="email"
                        value={newAccountEmail}
                        onChange={(e) => setNewAccountEmail(e.target.value)}
                        placeholder="operator3@contoh.id"
                        required
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 10,
                          border: '1px solid var(--line)',
                          background: 'var(--surf2)',
                          color: 'var(--ink)',
                          font: "400 13.5px 'IBM Plex Sans',sans-serif",
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button
                        type="submit"
                        disabled={isPendingAccount}
                        style={{
                          padding: '11px 22px',
                          borderRadius: 10,
                          border: 'none',
                          background: 'var(--ink)',
                          color: '#fff',
                          font: "500 13.5px 'IBM Plex Sans',sans-serif",
                          cursor: isPendingAccount ? 'not-allowed' : 'pointer',
                          whiteSpace: 'nowrap',
                          width: '100%',
                        }}
                      >
                        {isPendingAccount ? 'Membuat Akun…' : '+ Buat Akun Administrator'}
                      </button>
                    </div>
                  </form>
                </div>
              </section>

              {/* Modal Edit Akun */}
              {editingAccount && (
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 100,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 20,
                  }}
                >
                  <div
                    style={{
                      background: 'var(--card)',
                      borderRadius: 20,
                      padding: 26,
                      width: '100%',
                      maxWidth: 480,
                      border: '1px solid var(--line2)',
                      boxShadow: 'var(--shadow)',
                    }}
                  >
                    <h3 style={{ margin: '0 0 6px', font: "500 18px 'IBM Plex Sans',sans-serif" }}>
                      Ubah Informasi Akun ({editingAccount.id})
                    </h3>
                    <p style={{ margin: '0 0 18px', font: "400 13px 'IBM Plex Sans',sans-serif", color: 'var(--ink3)' }}>
                      Perbarui nama lengkap dan alamat surel administrator.
                    </p>

                    <form onSubmit={handleSaveEditAccount} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div>
                        <label style={{ display: 'block', font: "400 11.5px 'IBM Plex Mono',monospace", textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 6 }}>
                          Nama Lengkap
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          required
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: 10,
                            border: '1px solid var(--line)',
                            background: 'var(--surf2)',
                            color: 'var(--ink)',
                            font: "400 13.5px 'IBM Plex Sans',sans-serif",
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', font: "400 11.5px 'IBM Plex Mono',monospace", textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 6 }}>
                          Alamat Surel
                        </label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          required
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: 10,
                            border: '1px solid var(--line)',
                            background: 'var(--surf2)',
                            color: 'var(--ink)',
                            font: "400 13.5px 'IBM Plex Sans',sans-serif",
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                        <button
                          type="button"
                          onClick={() => setEditingAccount(null)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 8,
                            border: '1px solid var(--line)',
                            background: 'transparent',
                            color: 'var(--ink2)',
                            font: "500 13px 'IBM Plex Sans',sans-serif",
                            cursor: 'pointer',
                          }}
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={isPendingEdit}
                          style={{
                            padding: '8px 18px',
                            borderRadius: 8,
                            border: 'none',
                            background: 'var(--ink)',
                            color: '#fff',
                            font: "500 13px 'IBM Plex Sans',sans-serif",
                            cursor: isPendingEdit ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {isPendingEdit ? 'Menyimpan…' : 'Simpan Perubahan'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* BAGIAN 2: KONFIGURASI OPERASIONAL SISTEM (KF-20)            */}
              {/* ═══════════════════════════════════════════════════════════ */}
              <section id="kf-20" style={{ display: 'flex', flexDirection: 'column', gap: 24, scrollMarginTop: 90 }}>
                <Reveal order={3}>
                  <div>
                    <span style={{ font: "400 12px 'IBM Plex Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink3)' }}>
                      BAGIAN 2 • KEBUTUHAN FUNGSIONAL KF-20
                    </span>
                    <h2 style={{ margin: '6px 0 0', font: "400 32px 'PP Editorial New','Instrument Serif',serif" }}>
                      Konfigurasi Parameter Operasional Sistem
                    </h2>
                    <p style={{ margin: '8px 0 0', font: "400 14px/1.6 'IBM Plex Sans',sans-serif", color: 'var(--ink2)', maxWidth: 860 }}>
                      Super Administrator dapat mengatur empat parameter utama yang memengaruhi perhitungan Value-at-Risk dan eksekusi batch inferensi. Pembaruan disimpan sekaligus via HTTP PUT dan divalidasi ketat oleh server.
                    </p>
                  </div>
                </Reveal>

                {configFeedback && (
                  <div
                    style={{
                      padding: '12px 18px',
                      borderRadius: 12,
                      background: configFeedback.sukses ? 'color-mix(in srgb, var(--lime) 15%, transparent)' : 'color-mix(in srgb, var(--down) 12%, transparent)',
                      border: configFeedback.sukses ? '1px solid var(--lime)' : '1px solid var(--down)',
                      color: configFeedback.sukses ? 'var(--ink)' : 'var(--down)',
                      font: "400 13.5px 'IBM Plex Sans',sans-serif",
                    }}
                  >
                    {configFeedback.pesan}
                  </div>
                )}

                <div style={{ background: 'var(--card)', borderRadius: 20, padding: 26, border: '1px solid var(--line2)' }}>
                  <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 22 }}>
                      {/* Parameter 1: Tingkat Kepercayaan Perhitungan Risiko */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label style={{ font: "500 13.5px 'IBM Plex Sans',sans-serif", color: 'var(--ink)' }}>
                          1. Tingkat kepercayaan perhitungan risiko
                        </label>
                        <p style={{ margin: 0, font: "400 12px/1.5 'IBM Plex Sans',sans-serif", color: 'var(--ink3)' }}>
                          Pilihan tingkat kepercayaan perhitungan risiko VaR dan CVaR menggunakan metode FHS (90%, 95%, atau 99%).
                        </p>
                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                          {[0.9, 0.95, 0.99].map((val) => (
                            <button
                              type="button"
                              key={val}
                              onClick={() => setConfConfidence(val)}
                              style={{
                                flex: 1,
                                padding: '10px 14px',
                                borderRadius: 10,
                                border: '1px solid',
                                borderColor: confConfidence === val ? 'var(--ink)' : 'var(--line)',
                                background: confConfidence === val ? 'var(--ink)' : 'var(--surf2)',
                                color: confConfidence === val ? '#fff' : 'var(--ink)',
                                font: "500 13px 'IBM Plex Mono',monospace",
                                cursor: 'pointer',
                                transition: 'all .2s',
                              }}
                            >
                              {Math.round(val * 100)}%
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Parameter 2: Jendela Bobot Hari */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label htmlFor="confWindowDays" style={{ font: "500 13.5px 'IBM Plex Sans',sans-serif", color: 'var(--ink)' }}>
                          2. Panjang Jendela Evaluasi Bobot (15–90 Hari)
                        </label>
                        <p style={{ margin: 0, font: "400 12px/1.5 'IBM Plex Sans',sans-serif", color: 'var(--ink3)' }}>
                          Rentang observasi MAPE untuk pembobotan inversi varians model ensemble.
                        </p>
                        <input
                          id="confWindowDays"
                          type="number"
                          min={15}
                          max={90}
                          value={confWindowDays}
                          onChange={(e) => setConfWindowDays(Number(e.target.value))}
                          required
                          style={{
                            padding: '10px 14px',
                            borderRadius: 10,
                            border: '1px solid var(--line)',
                            background: 'var(--surf2)',
                            color: 'var(--ink)',
                            font: "500 13.5px 'IBM Plex Mono',monospace",
                            marginTop: 4,
                          }}
                        />
                      </div>

                      {/* Parameter 3: Nilai Portofolio Ilustratif pada Dasbor */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label htmlFor="confPortfolio" style={{ font: "500 13.5px 'IBM Plex Sans',sans-serif", color: 'var(--ink)' }}>
                          3. Nilai portofolio ilustratif pada dasbor (Rupiah)
                        </label>
                        <p style={{ margin: 0, font: "400 12px/1.5 'IBM Plex Sans',sans-serif", color: 'var(--ink3)' }}>
                          Nilai nominal simulasi risiko ilustratif yang ditampilkan pada dasbor ({formatRupiah(confPortfolio)}).
                        </p>
                        <input
                          id="confPortfolio"
                          type="number"
                          step={1000000}
                          min={1000000}
                          max={10000000000}
                          value={confPortfolio}
                          onChange={(e) => setConfPortfolio(Number(e.target.value))}
                          required
                          style={{
                            padding: '10px 14px',
                            borderRadius: 10,
                            border: '1px solid var(--line)',
                            background: 'var(--surf2)',
                            color: 'var(--ink)',
                            font: "500 13.5px 'IBM Plex Mono',monospace",
                            marginTop: 4,
                          }}
                        />
                      </div>

                      {/* Parameter 4: Waktu Batch Harian */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label htmlFor="confBatchTime" style={{ font: "500 13.5px 'IBM Plex Sans',sans-serif", color: 'var(--ink)' }}>
                          4. Waktu Eksekusi Batch Harian (HH:mm WIB)
                        </label>
                        <p style={{ margin: 0, font: "400 12px/1.5 'IBM Plex Sans',sans-serif", color: 'var(--ink3)' }}>
                          Jadwal eksekusi pengambilan data bursa dan inferensi mandiri.
                        </p>
                        <input
                          id="confBatchTime"
                          type="text"
                          pattern="^([01]\d|2[0-3]):([0-5]\d)$"
                          placeholder="00:05"
                          value={confBatchTime}
                          onChange={(e) => setConfBatchTime(e.target.value)}
                          required
                          style={{
                            padding: '10px 14px',
                            borderRadius: 10,
                            border: '1px solid var(--line)',
                            background: 'var(--surf2)',
                            color: 'var(--ink)',
                            font: "500 13.5px 'IBM Plex Mono',monospace",
                            marginTop: 4,
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--line)', paddingTop: 18, flexWrap: 'wrap', gap: 12 }}>
                      <span style={{ font: "400 12.5px 'IBM Plex Sans',sans-serif", color: 'var(--ink3)' }}>
                        Nilai tersimpan aktif: Tingkat kepercayaan {Math.round(config.tingkat_kepercayaan * 100)}% • Jendela evaluasi {config.jendela_bobot_hari} hari • Portofolio dasbor {formatRupiah(config.portofolio_ilustratif)} • Batch {config.waktu_batch} WIB
                      </span>
                      <button
                        type="submit"
                        disabled={isPendingConfig}
                        style={{
                          padding: '11px 24px',
                          borderRadius: 10,
                          border: 'none',
                          background: 'var(--ink)',
                          color: '#fff',
                          font: "500 13.5px 'IBM Plex Sans',sans-serif",
                          cursor: isPendingConfig ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {isPendingConfig ? 'Menyimpan Konfigurasi…' : 'Simpan Perubahan Konfigurasi'}
                      </button>
                    </div>
                  </form>
                </div>
              </section>

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* BAGIAN 3: LOG TINDAKAN ADMINISTRATOR (KF-21)               */}
              {/* ═══════════════════════════════════════════════════════════ */}
              <section id="kf-21" style={{ display: 'flex', flexDirection: 'column', gap: 24, scrollMarginTop: 90 }}>
                <Reveal order={4}>
                  <div>
                    <span style={{ font: "400 12px 'IBM Plex Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink3)' }}>
                      BAGIAN 3 • KEBUTUHAN FUNGSIONAL KF-21
                    </span>
                    <h2 style={{ margin: '6px 0 0', font: "400 32px 'PP Editorial New','Instrument Serif',serif" }}>
                      Log Tindakan Administrator (Audit Trail)
                    </h2>
                    <p style={{ margin: '8px 0 0', font: "400 14px/1.6 'IBM Plex Sans',sans-serif", color: 'var(--ink2)', maxWidth: 860 }}>
                      Tabel riwayat audit seluruh tindakan yang dilakukan oleh administrator dan super administrator. Tabel ini bersifat hanya baca (read-only) tanpa tombol hapus maupun edit guna menjamin integritas pembuktian audit operasional.
                    </p>
                  </div>
                </Reveal>

                {/* Tiga Kartu Metrik Ringkas Log */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  <div style={{ background: 'var(--card)', borderRadius: 16, padding: 18, border: '1px solid var(--line2)' }}>
                    <span style={{ font: "400 11px 'IBM Plex Mono',monospace", color: 'var(--ink3)', textTransform: 'uppercase' }}>
                      Total Tindakan Tercatat
                    </span>
                    <div style={{ font: "500 24px 'IBM Plex Sans',sans-serif", color: 'var(--ink)', marginTop: 4 }}>
                      {totalLogsCount} Baris
                    </div>
                  </div>
                  <div style={{ background: 'var(--card)', borderRadius: 16, padding: 18, border: '1px solid var(--line2)' }}>
                    <span style={{ font: "400 11px 'IBM Plex Mono',monospace", color: 'var(--ink3)', textTransform: 'uppercase' }}>
                      Tindakan Berhasil
                    </span>
                    <div style={{ font: "500 24px 'IBM Plex Sans',sans-serif", color: 'var(--ink)', marginTop: 4 }}>
                      {successLogsCount} Baris
                    </div>
                  </div>
                  <div style={{ background: 'var(--card)', borderRadius: 16, padding: 18, border: '1px solid var(--line2)' }}>
                    <span style={{ font: "400 11px 'IBM Plex Mono',monospace", color: 'var(--ink3)', textTransform: 'uppercase' }}>
                      Tindakan Gagal / Ditolak
                    </span>
                    <div style={{ font: "500 24px 'IBM Plex Sans',sans-serif", color: 'var(--down)', marginTop: 4 }}>
                      {failedLogsCount} Baris
                    </div>
                  </div>
                </div>

                {/* Panel Penyaring & Tabel Log */}
                <div style={{ background: 'var(--card)', borderRadius: 20, padding: 24, border: '1px solid var(--line2)' }}>
                  {/* Filter Form */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 20, paddingBottom: 18, borderBottom: '1px solid var(--line)' }}>
                    <div>
                      <label style={{ display: 'block', font: "400 11px 'IBM Plex Mono',monospace", textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 5 }}>
                        Cari Aktor
                      </label>
                      <input
                        type="text"
                        value={filterAktor}
                        onChange={(e) => setFilterAktor(e.target.value)}
                        placeholder="Contoh: admin@contoh"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: '1px solid var(--line)',
                          background: 'var(--surf2)',
                          color: 'var(--ink)',
                          font: "400 12.5px 'IBM Plex Sans',sans-serif",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', font: "400 11px 'IBM Plex Mono',monospace", textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 5 }}>
                        Tanggal Mulai
                      </label>
                      <input
                        type="date"
                        value={filterMulai}
                        onChange={(e) => setFilterMulai(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: '1px solid var(--line)',
                          background: 'var(--surf2)',
                          color: 'var(--ink)',
                          font: "400 12.5px 'IBM Plex Mono',monospace",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', font: "400 11px 'IBM Plex Mono',monospace", textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 5 }}>
                        Tanggal Selesai
                      </label>
                      <input
                        type="date"
                        value={filterSelesai}
                        onChange={(e) => setFilterSelesai(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: '1px solid var(--line)',
                          background: 'var(--surf2)',
                          color: 'var(--ink)',
                          font: "400 12.5px 'IBM Plex Mono',monospace",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', font: "400 11px 'IBM Plex Mono',monospace", textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 5 }}>
                        Status Hasil
                      </label>
                      <select
                        value={filterHasil}
                        onChange={(e) => setFilterHasil(e.target.value as 'semua' | 'berhasil' | 'gagal')}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: '1px solid var(--line)',
                          background: 'var(--surf2)',
                          color: 'var(--ink)',
                          font: "400 12.5px 'IBM Plex Sans',sans-serif",
                        }}
                      >
                        <option value="semua">Semua Status Hasil</option>
                        <option value="berhasil">Hanya Berhasil</option>
                        <option value="gagal">Hanya Gagal</option>
                      </select>
                    </div>
                  </div>

                  {/* Tabel Data Log Responsif */}
                  <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table style={{ width: '100%', minWidth: 780, borderCollapse: 'collapse', textAlign: 'left', font: "400 13px 'IBM Plex Sans',sans-serif" }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--ink3)', fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", textTransform: 'uppercase', letterSpacing: '.06em' }}>
                          <th style={{ padding: '12px 14px' }}>Waktu Eksekusi</th>
                          <th style={{ padding: '12px 14px' }}>Aktor Pelaksana</th>
                          <th style={{ padding: '12px 14px' }}>Tindakan</th>
                          <th style={{ padding: '12px 14px' }}>Sasaran Tindakan</th>
                          <th style={{ padding: '12px 14px' }}>Hasil</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAuditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ padding: 40, textAlign: 'center' }}>
                              <div style={{ color: 'var(--ink3)', marginBottom: 12, font: "400 13.5px 'IBM Plex Sans',sans-serif" }}>
                                Tidak ada log tindakan administrator yang cocok dengan kriteria penyaringan saat ini.
                              </div>
                              {(filterAktor || filterMulai || filterSelesai || filterHasil !== 'semua') && (
                                <button
                                  type="button"
                                  onClick={handleResetFilter}
                                  style={{
                                    padding: '8px 16px',
                                    borderRadius: 8,
                                    border: '1px solid var(--line)',
                                    background: 'var(--surf2)',
                                    color: 'var(--ink)',
                                    font: "500 12px 'IBM Plex Sans',sans-serif",
                                    cursor: 'pointer',
                                  }}
                                >
                                  ↻ Reset Semua Penyaring
                                </button>
                              )}
                            </td>
                          </tr>
                        ) : (
                          filteredAuditLogs.map((log, idx) => (
                            <tr key={`${log.waktu}-${idx}`} style={{ borderBottom: '1px solid var(--line2)' }}>
                              <td style={{ padding: '12px 14px', font: "400 12.5px 'IBM Plex Mono',monospace", color: 'var(--ink2)' }}>
                                {formatWaktuLokal(log.waktu)}
                              </td>
                              <td style={{ padding: '12px 14px', font: "500 12.5px 'IBM Plex Mono',monospace", color: 'var(--ink)' }}>
                                {log.aktor}
                              </td>
                              <td style={{ padding: '12px 14px', color: 'var(--ink)' }}>
                                {log.tindakan}
                              </td>
                              <td style={{ padding: '12px 14px', color: 'var(--ink2)', font: "400 12.5px 'IBM Plex Mono',monospace" }}>
                                {log.sasaran}
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                <span
                                  style={{
                                    padding: '3px 8px',
                                    borderRadius: 999,
                                    fontSize: 10.5,
                                    fontFamily: "'IBM Plex Mono',monospace",
                                    fontWeight: 500,
                                    background: log.hasil === 'berhasil' ? 'var(--lime)' : 'var(--down)',
                                    color: log.hasil === 'berhasil' ? 'var(--onlime)' : '#fff',
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  {log.hasil}
                                </span>
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

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, color: 'var(--ink3)', fontSize: 12, flexWrap: 'wrap', gap: 10 }}>
                    <span>
                      Menampilkan {filteredAuditLogs.length} dari {totalLogsCount} catatan log tindakan administrator (50 baris per halaman)
                    </span>
                    <span>
                      * Log bersifat permanen dan tidak dapat dimanipulasi
                    </span>
                  </div>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
