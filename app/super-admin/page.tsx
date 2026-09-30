'use client';

import { useState, useEffect } from 'react';
import AdminNavBar from '@/components/AdminNavBar';
import BackgroundHills from '@/components/BackgroundHills';
import Reveal from '@/components/Reveal';
import type { SafeUser } from '@/lib/db/users';
import type { SystemConfig } from '@/lib/db/configs';
import type { AuditLog } from '@/lib/db/audit';

const SUPER_ADMIN_TABS = [
  { id: 'dashboard', label: 'Super Admin Dashboard' },
  { id: 'users', label: 'User Management' },
  { id: 'admins', label: 'Admin Management' },
  { id: 'configs', label: 'System Configuration' },
  { id: 'audit', label: 'Audit Logs' },
  { id: 'backup', label: 'Backup Management' },
];

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Data states
  const [allUsers, setAllUsers] = useState<SafeUser[]>([]);
  const [stats, setStats] = useState<{
    totalUsers: number;
    activeUsers: number;
    totalAdmins: number;
    activeAdmins: number;
  }>({ totalUsers: 0, activeUsers: 0, totalAdmins: 0, activeAdmins: 0 });

  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Form Buat Admin Baru
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminRole, setAdminRole] = useState<'ADMIN' | 'SUPER_ADMIN'>('ADMIN');
  const [adminMsg, setAdminMsg] = useState<{ text: string; error: boolean } | null>(null);

  // Edit Admin Modal / State
  const [editingUser, setEditingUser] = useState<SafeUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'USER' | 'ADMIN' | 'SUPER_ADMIN'>('ADMIN');

  // Config feedback
  const [configMsg, setConfigMsg] = useState<string | null>(null);

  // Backup / Restore feedback
  const [restoreMsg, setRestoreMsg] = useState<{ text: string; error: boolean } | null>(null);
  const [restoreJson, setRestoreJson] = useState('');

  const loadData = async () => {
    try {
      const [usersRes, configsRes, auditRes] = await Promise.all([
        fetch('/api/super-admin/users'),
        fetch('/api/super-admin/configs'),
        fetch(`/api/super-admin/audit?role=${roleFilter}`),
      ]);

      if (usersRes.ok) {
        const u = await usersRes.json();
        setAllUsers(u.users || []);
        setStats(u.stats || { totalUsers: 0, activeUsers: 0, totalAdmins: 0, activeAdmins: 0 });
      }
      if (configsRes.ok) {
        const c = await configsRes.json();
        setConfigs(c.configs || []);
      }
      if (auditRes.ok) {
        const a = await auditRes.json();
        setAuditLogs(a.logs || []);
      }
    } catch (err) {
      console.error('Error loading super admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  // Manajemen User Biasa (Role USER)
  const regularUsers = allUsers.filter((u) => u.role === 'USER');
  // Manajemen Admin & Super Admin
  const adminUsers = allUsers.filter((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN');

  const handleToggleUserStatus = async (id: string) => {
    try {
      const res = await fetch('/api/super-admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'toggle_status' }),
      });
      if (res.ok) loadData();
    } catch {
      alert('Gagal mengubah status pengguna.');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Hapus akun ${name} secara permanen?`)) return;
    try {
      const res = await fetch(`/api/super-admin/users?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal menghapus pengguna.');
        return;
      }
      loadData();
    } catch {
      alert('Gagal menghapus pengguna.');
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminMsg(null);
    if (!adminName || !adminEmail || !adminPassword) {
      setAdminMsg({ text: 'Seluruh kolom wajib diisi.', error: true });
      return;
    }

    try {
      const res = await fetch('/api/super-admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: adminName,
          email: adminEmail,
          password: adminPassword,
          role: adminRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminMsg({ text: data.error || 'Gagal membuat admin.', error: true });
        return;
      }
      setAdminMsg({ text: `Akun ${adminRole} berhasil dibuat!`, error: false });
      setAdminName('');
      setAdminEmail('');
      setAdminPassword('');
      loadData();
    } catch {
      setAdminMsg({ text: 'Terjadi kesalahan pada server.', error: true });
    }
  };

  const startEditUser = (u: SafeUser) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole(u.role);
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await fetch('/api/super-admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          name: editName,
          email: editEmail,
          role: editRole,
        }),
      });
      if (res.ok) {
        setEditingUser(null);
        loadData();
      } else {
        alert('Gagal memperbarui data.');
      }
    } catch {
      alert('Gagal menyimpan perubahan.');
    }
  };

  const handleConfigChange = (key: string, value: string) => {
    setConfigs((prev) =>
      prev.map((c) => (c.key === key ? { ...c, value } : c))
    );
  };

  const handleSaveConfigs = async () => {
    setConfigMsg(null);
    try {
      const res = await fetch('/api/super-admin/configs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs }),
      });
      if (res.ok) {
        setConfigMsg('Konfigurasi sistem berhasil disimpan dan diperbarui.');
        loadData();
      }
    } catch {
      alert('Gagal menyimpan konfigurasi.');
    }
  };

  const handleDownloadBackup = () => {
    window.open('/api/super-admin/backup', '_blank');
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        setRestoreJson(text);
        setRestoreMsg({ text: 'File snapshot berhasil dibaca. Klik "Jalankan Pemulihan Basis Data" untuk menerapkan.', error: false });
      } catch {
        setRestoreMsg({ text: 'Format file snapshot tidak valid.', error: true });
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async () => {
    if (!restoreJson) {
      setRestoreMsg({ text: 'Pilih atau tempel data snapshot backup JSON terlebih dahulu.', error: true });
      return;
    }
    if (!confirm('PERINGATAN: Memulihkan database akan menimpa seluruh data yang ada saat ini dengan isi snapshot cadangan. Lanjutkan?')) {
      return;
    }

    try {
      const parsed = JSON.parse(restoreJson);
      const res = await fetch('/api/super-admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      if (!res.ok) {
        setRestoreMsg({ text: data.error || 'Gagal memulihkan database.', error: true });
        return;
      }
      setRestoreMsg({ text: 'Basis data berhasil dipulihkan secara menyeluruh!', error: false });
      loadData();
    } catch {
      setRestoreMsg({ text: 'Gagal memproses JSON backup.', error: true });
    }
  };

  return (
    <>
      <BackgroundHills />
      <div style={{ position: 'relative', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
        <AdminNavBar
          role="SUPER_ADMIN"
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          tabs={SUPER_ADMIN_TABS}
          userName="Super Admin"
        />

        <main style={{ flex: 1, maxWidth: 1320, width: '100%', margin: '0 auto', padding: '34px 24px 80px' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink3)' }}>
              Memuat data Super Admin…
            </div>
          ) : (
            <>
              {/* 1. DASHBOARD SUPER ADMIN */}
              {activeTab === 'dashboard' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
                  <Reveal order={1}>
                    <div>
                      <span style={{ font: "400 12px 'IBM Plex Mono',monospace", letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink3)' }}>
                        Otoritas Tertinggi Sistem
                      </span>
                      <h1 style={{ margin: '8px 0 0', font: "400 42px/1.1 'PP Editorial New','Instrument Serif',serif" }}>
                        Super Admin Overview
                      </h1>
                      <p style={{ margin: '8px 0 0', font: "400 14px 'IBM Plex Sans',sans-serif", color: 'var(--ink2)' }}>
                        Statistik global pengguna, administrasi akun, metrik server, status database, dan aktivitas audit terkini.
                      </p>
                    </div>
                  </Reveal>

                  {/* 4 Kartu Statistik */}
                  <Reveal order={2}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
                      <div style={{ background: 'var(--card)', borderRadius: 22, padding: 24, boxShadow: 'var(--shadow)', border: '1px solid var(--line2)' }}>
                        <span style={{ font: "400 11.5px 'IBM Plex Mono',monospace", color: 'var(--ink3)', textTransform: 'uppercase' }}>
                          Total Pengguna (Trader)
                        </span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 12 }}>
                          <span style={{ font: "400 38px/1 'PP Editorial New',serif", color: 'var(--ink)' }}>
                            {stats.totalUsers}
                          </span>
                          <span style={{ font: "500 12.5px 'IBM Plex Sans',sans-serif", color: 'var(--up)' }}>
                            {stats.activeUsers} Aktif
                          </span>
                        </div>
                        <p style={{ margin: '8px 0 0', font: "400 12px 'IBM Plex Sans',sans-serif", color: 'var(--ink3)' }}>
                          Pengguna terdaftar yang mengakses perkiraan harga & risiko.
                        </p>
                      </div>

                      <div style={{ background: 'var(--card)', borderRadius: 22, padding: 24, boxShadow: 'var(--shadow)', border: '1px solid var(--line2)' }}>
                        <span style={{ font: "400 11.5px 'IBM Plex Mono',monospace", color: 'var(--ink3)', textTransform: 'uppercase' }}>
                          Administrator Terdaftar
                        </span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 12 }}>
                          <span style={{ font: "400 38px/1 'PP Editorial New',serif", color: 'var(--risk)' }}>
                            {stats.totalAdmins}
                          </span>
                          <span style={{ font: "500 12.5px 'IBM Plex Sans',sans-serif", color: 'var(--up)' }}>
                            {stats.activeAdmins} Aktif
                          </span>
                        </div>
                        <p style={{ margin: '8px 0 0', font: "400 12px 'IBM Plex Sans',sans-serif", color: 'var(--ink3)' }}>
                          Staf pengelola batch proses & konfigurasi tingkat tinggi.
                        </p>
                      </div>

                      <div style={{ background: 'var(--card)', borderRadius: 22, padding: 24, boxShadow: 'var(--shadow)', border: '1px solid var(--line2)' }}>
                        <span style={{ font: "400 11.5px 'IBM Plex Mono',monospace", color: 'var(--ink3)', textTransform: 'uppercase' }}>
                          Integritas Server
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
                          <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--up)' }} />
                          <span style={{ font: "500 22px 'IBM Plex Sans',sans-serif", color: 'var(--ink)' }}>
                            ONLINE (99.9%)
                          </span>
                        </div>
                        <p style={{ margin: '8px 0 0', font: "400 12px 'IBM Plex Sans',sans-serif", color: 'var(--ink3)' }}>
                          Runtime Node.js aktif pada platform {process.platform || 'windows'}.
                        </p>
                      </div>

                      <div style={{ background: 'var(--card)', borderRadius: 22, padding: 24, boxShadow: 'var(--shadow)', border: '1px solid var(--line2)' }}>
                        <span style={{ font: "400 11.5px 'IBM Plex Mono',monospace", color: 'var(--ink3)', textTransform: 'uppercase' }}>
                          Status Database
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
                          <span style={{ padding: '3px 10px', borderRadius: 999, background: 'var(--lime)', color: 'var(--onlime)', font: "500 12px 'IBM Plex Mono',monospace" }}>
                            SQLite 3 Connected
                          </span>
                        </div>
                        <p style={{ margin: '8px 0 0', font: "400 12px 'IBM Plex Sans',sans-serif", color: 'var(--ink3)' }}>
                          6 tabel utama aktif dengan dukungan relasi foreign keys.
                        </p>
                      </div>
                    </div>
                  </Reveal>

                  {/* Ringkasan Aktivitas Terbaru */}
                  <Reveal order={3}>
                    <div style={{ background: 'var(--card)', borderRadius: 24, padding: 28, boxShadow: 'var(--shadow)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ margin: 0, font: "400 22px 'PP Editorial New',serif" }}>Aktivitas Sistem Terbaru</h3>
                        <button
                          onClick={() => setActiveTab('audit')}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--risk)',
                            font: "400 13px 'IBM Plex Sans',sans-serif",
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--linkline)',
                          }}
                        >
                          Lihat Seluruh Audit →
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {auditLogs.slice(0, 5).map((log) => (
                          <div
                            key={log.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '12px 14px',
                              background: 'var(--surf2)',
                              borderRadius: 14,
                              gap: 16,
                              flexWrap: 'wrap',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <span style={{ padding: '3px 8px', borderRadius: 999, background: log.role === 'SUPER_ADMIN' ? 'var(--lime)' : 'var(--line2)', color: log.role === 'SUPER_ADMIN' ? 'var(--onlime)' : 'var(--ink)', fontSize: 11, fontFamily: "'IBM Plex Mono',monospace" }}>
                                {log.role || 'SYS'}
                              </span>
                              <span style={{ fontWeight: 500, fontSize: 13.5 }}>{log.user_name || 'System'}</span>
                              <span style={{ color: 'var(--ink3)', fontSize: 13 }}>{log.details}</span>
                            </div>
                            <span style={{ fontSize: 11.5, fontFamily: "'IBM Plex Mono',monospace", color: 'var(--ink4)' }}>
                              {new Date(log.created_at).toLocaleTimeString('id-ID')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Reveal>
                </div>
              )}

              {/* 2. USER MANAGEMENT */}
              {activeTab === 'users' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <Reveal order={1}>
                    <h2 style={{ margin: 0, font: "400 32px 'PP Editorial New',serif" }}>Manajemen Pengguna (User Trader)</h2>
                    <p style={{ margin: '6px 0 0', font: "400 14px 'IBM Plex Sans',sans-serif", color: 'var(--ink2)' }}>
                      Daftar pengguna terdaftar dengan peran USER. Anda dapat memantau, mengaktifkan, menonaktifkan, atau menghapus akun.
                    </p>
                  </Reveal>

                  <div style={{ background: 'var(--card)', borderRadius: 22, padding: 24, boxShadow: 'var(--shadow)' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', font: "400 13.5px 'IBM Plex Sans',sans-serif" }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--line)', textAlign: 'left', font: "400 11px 'IBM Plex Mono',monospace", color: 'var(--ink3)', textTransform: 'uppercase' }}>
                            <th style={{ padding: '10px 12px' }}>Nama</th>
                            <th style={{ padding: '10px 12px' }}>Email</th>
                            <th style={{ padding: '10px 12px' }}>Role</th>
                            <th style={{ padding: '10px 12px' }}>Status Akun</th>
                            <th style={{ padding: '10px 12px' }}>Terdaftar Pada</th>
                            <th style={{ padding: '10px 12px', textAlign: 'right' }}>Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {regularUsers.length === 0 ? (
                            <tr>
                              <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--ink3)' }}>
                                Belum ada pengguna terdaftar dengan role USER.
                              </td>
                            </tr>
                          ) : (
                            regularUsers.map((u) => (
                              <tr key={u.id} style={{ borderBottom: '1px solid var(--line2)' }}>
                                <td style={{ padding: '14px 12px', fontWeight: 500 }}>{u.name}</td>
                                <td style={{ padding: '14px 12px', color: 'var(--ink2)' }}>{u.email}</td>
                                <td style={{ padding: '14px 12px' }}>
                                  <span style={{ padding: '3px 8px', borderRadius: 999, background: 'var(--surf2)', fontSize: 11, fontFamily: "'IBM Plex Mono',monospace" }}>
                                    {u.role}
                                  </span>
                                </td>
                                <td style={{ padding: '14px 12px' }}>
                                  <span style={{ padding: '3px 8px', borderRadius: 999, fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", background: u.is_active === 1 ? 'var(--lime)' : 'var(--surf2)', color: u.is_active === 1 ? 'var(--onlime)' : 'var(--ink4)' }}>
                                    {u.is_active === 1 ? 'AKTIF' : 'NONAKTIF'}
                                  </span>
                                </td>
                                <td style={{ padding: '14px 12px', fontSize: 12, color: 'var(--ink3)' }}>
                                  {new Date(u.created_at).toLocaleDateString('id-ID')}
                                </td>
                                <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                                  <button
                                    onClick={() => handleToggleUserStatus(u.id)}
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
                                    {u.is_active === 1 ? 'Nonaktifkan' : 'Aktifkan'}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(u.id, u.name)}
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
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. ADMIN MANAGEMENT */}
              {activeTab === 'admins' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <Reveal order={1}>
                    <h2 style={{ margin: 0, font: "400 32px 'PP Editorial New',serif" }}>Manajemen Administrator</h2>
                    <p style={{ margin: '6px 0 0', font: "400 14px 'IBM Plex Sans',sans-serif", color: 'var(--ink2)' }}>
                      Kelola hak akses administratif sistem, buat akun staf admin baru, atau perbarui peran.
                    </p>
                  </Reveal>

                  {/* Form Buat Admin Baru */}
                  <div style={{ background: 'var(--card)', borderRadius: 22, padding: 24, border: '1px solid var(--line2)' }}>
                    <h4 style={{ margin: '0 0 14px', font: "500 15px 'IBM Plex Sans',sans-serif" }}>Buat Akun Admin Baru</h4>
                    {adminMsg && (
                      <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14, background: adminMsg.error ? 'color-mix(in srgb, var(--down) 12%, transparent)' : 'color-mix(in srgb, var(--up) 12%, transparent)', color: adminMsg.error ? 'var(--down)' : 'var(--up)' }}>
                        {adminMsg.text}
                      </div>
                    )}
                    <form onSubmit={handleCreateAdmin} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, alignItems: 'flex-end' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: 'var(--ink3)' }}>NAMA LENGKAP</label>
                        <input
                          type="text"
                          placeholder="Nama Staf"
                          value={adminName}
                          onChange={(e) => setAdminName(e.target.value)}
                          required
                          style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surf2)', color: 'var(--ink)' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: 'var(--ink3)' }}>EMAIL</label>
                        <input
                          type="email"
                          placeholder="admin@forecatforlyfe.id"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          required
                          style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surf2)', color: 'var(--ink)' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: 'var(--ink3)' }}>KATA SANDI</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          required
                          style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surf2)', color: 'var(--ink)' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: 'var(--ink3)' }}>TINGKAT PERAN</label>
                        <select
                          value={adminRole}
                          onChange={(e) => setAdminRole(e.target.value as 'ADMIN' | 'SUPER_ADMIN')}
                          style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surf2)', color: 'var(--ink)' }}
                        >
                          <option value="ADMIN">ADMIN (Operasional)</option>
                          <option value="SUPER_ADMIN">SUPER ADMIN (Penuh)</option>
                        </select>
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
                          height: 40,
                        }}
                      >
                        Buat Akun
                      </button>
                    </form>
                  </div>

                  {/* Modal Ubah Akun Admin */}
                  {editingUser && (
                    <div style={{ background: 'var(--warm)', borderRadius: 20, padding: 22, border: '1px solid var(--warm2)' }}>
                      <h4 style={{ margin: '0 0 12px', font: "500 16px 'IBM Plex Sans',sans-serif" }}>
                        Ubah Akun Admin: {editingUser.name}
                      </h4>
                      <form onSubmit={handleSaveEditUser} style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <label style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace" }}>NAMA</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--card)' }}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <label style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace" }}>EMAIL</label>
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--card)' }}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <label style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace" }}>ROLE</label>
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as 'USER' | 'ADMIN' | 'SUPER_ADMIN')}
                            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--card)' }}
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                            <option value="USER">USER</option>
                          </select>
                        </div>
                        <button
                          type="submit"
                          style={{ padding: '9px 16px', borderRadius: 8, border: 'none', background: 'var(--risk)', color: '#fff', cursor: 'pointer' }}
                        >
                          Simpan
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingUser(null)}
                          style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid var(--line)', background: 'transparent', cursor: 'pointer' }}
                        >
                          Batal
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Tabel Daftar Admin */}
                  <div style={{ background: 'var(--card)', borderRadius: 22, padding: 24, boxShadow: 'var(--shadow)' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', font: "400 13.5px 'IBM Plex Sans',sans-serif" }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--line)', textAlign: 'left', font: "400 11px 'IBM Plex Mono',monospace", color: 'var(--ink3)', textTransform: 'uppercase' }}>
                            <th style={{ padding: '10px 12px' }}>Nama</th>
                            <th style={{ padding: '10px 12px' }}>Email</th>
                            <th style={{ padding: '10px 12px' }}>Role Tingkat</th>
                            <th style={{ padding: '10px 12px' }}>Status Akun</th>
                            <th style={{ padding: '10px 12px' }}>Tanggal Dibuat</th>
                            <th style={{ padding: '10px 12px', textAlign: 'right' }}>Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminUsers.map((u) => (
                            <tr key={u.id} style={{ borderBottom: '1px solid var(--line2)' }}>
                              <td style={{ padding: '14px 12px', fontWeight: 500 }}>{u.name}</td>
                              <td style={{ padding: '14px 12px', color: 'var(--ink2)' }}>{u.email}</td>
                              <td style={{ padding: '14px 12px' }}>
                                <span style={{ padding: '3px 8px', borderRadius: 999, fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", background: u.role === 'SUPER_ADMIN' ? 'var(--lime)' : 'var(--surf2)', color: u.role === 'SUPER_ADMIN' ? 'var(--onlime)' : 'var(--risk)' }}>
                                  {u.role}
                                </span>
                              </td>
                              <td style={{ padding: '14px 12px' }}>
                                <span style={{ padding: '3px 8px', borderRadius: 999, fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", background: u.is_active === 1 ? 'var(--lime)' : 'var(--surf2)', color: u.is_active === 1 ? 'var(--onlime)' : 'var(--ink4)' }}>
                                  {u.is_active === 1 ? 'AKTIF' : 'NONAKTIF'}
                                </span>
                              </td>
                              <td style={{ padding: '14px 12px', fontSize: 12, color: 'var(--ink3)' }}>
                                {new Date(u.created_at).toLocaleDateString('id-ID')}
                              </td>
                              <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                                <button
                                  onClick={() => startEditUser(u)}
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
                                  Ubah
                                </button>
                                <button
                                  onClick={() => handleToggleUserStatus(u.id)}
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
                                  {u.is_active === 1 ? 'Nonaktifkan' : 'Aktifkan'}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.name)}
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

              {/* 4. SYSTEM CONFIGURATION */}
              {activeTab === 'configs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <Reveal order={1}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                      <div>
                        <h2 style={{ margin: 0, font: "400 32px 'PP Editorial New',serif" }}>Konfigurasi Tingkat Sistem</h2>
                        <p style={{ margin: '6px 0 0', font: "400 14px 'IBM Plex Sans',sans-serif", color: 'var(--ink2)' }}>
                          Pengaturan global untuk parameter peramalan, tingkat risiko, dan mode lingkungan aplikasi.
                        </p>
                      </div>
                      <button
                        onClick={handleSaveConfigs}
                        style={{
                          padding: '11px 22px',
                          borderRadius: 10,
                          border: 'none',
                          background: 'var(--ink)',
                          color: 'var(--onink)',
                          font: "500 13.5px 'IBM Plex Sans',sans-serif",
                          cursor: 'pointer',
                        }}
                      >
                        Simpan Seluruh Konfigurasi
                      </button>
                    </div>
                  </Reveal>

                  {configMsg && (
                    <div style={{ padding: '12px 18px', borderRadius: 14, background: 'color-mix(in srgb, var(--up) 15%, transparent)', color: 'var(--up)', font: "500 13.5px 'IBM Plex Sans',sans-serif", border: '1px solid color-mix(in srgb, var(--up) 30%, transparent)' }}>
                      {configMsg}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 22 }}>
                    {/* APP CONFIGS */}
                    <div style={{ background: 'var(--card)', borderRadius: 22, padding: 24, border: '1px solid var(--line2)' }}>
                      <span style={{ font: "400 11px 'IBM Plex Mono',monospace", color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                        1. Konfigurasi Aplikasi
                      </span>
                      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {configs
                          .filter((c) => c.category === 'APP')
                          .map((c) => (
                            <div key={c.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <label style={{ font: "400 12px 'IBM Plex Mono',monospace", color: 'var(--ink3)' }}>{c.key}</label>
                              <input
                                type="text"
                                value={c.value}
                                onChange={(e) => handleConfigChange(c.key, e.target.value)}
                                style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surf2)', color: 'var(--ink)', font: "400 13.5px 'IBM Plex Sans',sans-serif" }}
                              />
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* GLOBAL PARAMS */}
                    <div style={{ background: 'var(--card)', borderRadius: 22, padding: 24, border: '1px solid var(--line2)' }}>
                      <span style={{ font: "400 11px 'IBM Plex Mono',monospace", color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                        2. Parameter Global Risiko & Model
                      </span>
                      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {configs
                          .filter((c) => c.category === 'GLOBAL_PARAMS')
                          .map((c) => (
                            <div key={c.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <label style={{ font: "400 12px 'IBM Plex Mono',monospace", color: 'var(--ink3)' }}>{c.key}</label>
                              <input
                                type="text"
                                value={c.value}
                                onChange={(e) => handleConfigChange(c.key, e.target.value)}
                                style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surf2)', color: 'var(--ink)', font: "400 13.5px 'IBM Plex Sans',sans-serif" }}
                              />
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* ENVIRONMENT */}
                    <div style={{ background: 'var(--card)', borderRadius: 22, padding: 24, border: '1px solid var(--line2)' }}>
                      <span style={{ font: "400 11px 'IBM Plex Mono',monospace", color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                        3. Pengaturan Environment
                      </span>
                      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {configs
                          .filter((c) => c.category === 'ENVIRONMENT')
                          .map((c) => (
                            <div key={c.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <label style={{ font: "400 12px 'IBM Plex Mono',monospace", color: 'var(--ink3)' }}>{c.key}</label>
                              <input
                                type="text"
                                value={c.value}
                                onChange={(e) => handleConfigChange(c.key, e.target.value)}
                                style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surf2)', color: 'var(--ink)', font: "400 13.5px 'IBM Plex Sans',sans-serif" }}
                              />
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. AUDIT LOGS */}
              {activeTab === 'audit' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <Reveal order={1}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                      <div>
                        <h2 style={{ margin: 0, font: "400 32px 'PP Editorial New',serif" }}>Penelusuran Audit Aktivitas</h2>
                        <p style={{ margin: '6px 0 0', font: "400 14px 'IBM Plex Sans',sans-serif", color: 'var(--ink2)' }}>
                          Riwayat seluruh tindakan administratif dan pengguna (USER, ADMIN, SUPER ADMIN).
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, fontFamily: "'IBM Plex Mono',monospace", color: 'var(--ink3)' }}>FILTER PERAN:</span>
                        <select
                          value={roleFilter}
                          onChange={(e) => setRoleFilter(e.target.value)}
                          style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--ink)', font: "400 12.5px 'IBM Plex Sans',sans-serif" }}
                        >
                          <option value="ALL">Semua Peran</option>
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="SUPER_ADMIN">SUPER ADMIN</option>
                        </select>
                      </div>
                    </div>
                  </Reveal>

                  <div style={{ background: 'var(--card)', borderRadius: 22, padding: 24, boxShadow: 'var(--shadow)' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', font: "400 13px 'IBM Plex Sans',sans-serif" }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--line)', textAlign: 'left', font: "400 11px 'IBM Plex Mono',monospace", color: 'var(--ink3)', textTransform: 'uppercase' }}>
                            <th style={{ padding: '10px 12px' }}>Waktu</th>
                            <th style={{ padding: '10px 12px' }}>Pelaku</th>
                            <th style={{ padding: '10px 12px' }}>Peran</th>
                            <th style={{ padding: '10px 12px' }}>Aksi</th>
                            <th style={{ padding: '10px 12px' }}>Rincian</th>
                            <th style={{ padding: '10px 12px' }}>IP Address</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditLogs.map((log) => (
                            <tr key={log.id} style={{ borderBottom: '1px solid var(--line2)' }}>
                              <td style={{ padding: '12px', color: 'var(--ink3)', fontSize: 12, whiteSpace: 'nowrap' }}>
                                {new Date(log.created_at).toLocaleString('id-ID')}
                              </td>
                              <td style={{ padding: '12px', fontWeight: 500 }}>{log.user_name || 'System'}</td>
                              <td style={{ padding: '12px' }}>
                                <span style={{ padding: '2px 7px', borderRadius: 999, fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", background: log.role === 'SUPER_ADMIN' ? 'var(--lime)' : log.role === 'ADMIN' ? 'var(--warm2)' : 'var(--surf2)', color: log.role === 'SUPER_ADMIN' ? 'var(--onlime)' : 'var(--ink)' }}>
                                  {log.role || 'SYS'}
                                </span>
                              </td>
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

              {/* 6. BACKUP & RESTORE */}
              {activeTab === 'backup' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <Reveal order={1}>
                    <h2 style={{ margin: 0, font: "400 32px 'PP Editorial New',serif" }}>Cadangan & Pemulihan Basis Data (Backup & Restore)</h2>
                    <p style={{ margin: '6px 0 0', font: "400 14px 'IBM Plex Sans',sans-serif", color: 'var(--ink2)' }}>
                      Buat salinan data lengkap seluruh tabel sistem atau pulihkan dari file snapshot cadangan terverifikasi.
                    </p>
                  </Reveal>

                  {restoreMsg && (
                    <div style={{ padding: '12px 18px', borderRadius: 14, background: restoreMsg.error ? 'color-mix(in srgb, var(--down) 15%, transparent)' : 'color-mix(in srgb, var(--up) 15%, transparent)', color: restoreMsg.error ? 'var(--down)' : 'var(--up)', font: "500 13.5px 'IBM Plex Sans',sans-serif", border: '1px solid currentColor' }}>
                      {restoreMsg.text}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
                    {/* Buat Backup */}
                    <div style={{ background: 'var(--card)', borderRadius: 22, padding: 28, boxShadow: 'var(--shadow)', border: '1px solid var(--line2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ font: "400 11px 'IBM Plex Mono',monospace", color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                          Langkah 1: Ekspor Cadangan
                        </span>
                        <h3 style={{ margin: '8px 0 0', font: "400 24px 'PP Editorial New',serif" }}>
                          Buat Snapshot Database
                        </h3>
                        <p style={{ margin: '8px 0 20px', font: "400 13.5px/1.6 'IBM Plex Sans',sans-serif", color: 'var(--ink2)' }}>
                          Mengunduh seluruh isi tabel: akun pengguna, daftar pair kripto, status model, riwayat batch harian, dan audit log dalam format JSON snapshot.
                        </p>
                      </div>

                      <button
                        onClick={handleDownloadBackup}
                        style={{
                          padding: '12px 24px',
                          borderRadius: 12,
                          border: 'none',
                          background: 'var(--ink)',
                          color: 'var(--onink)',
                          font: "500 13.5px 'IBM Plex Sans',sans-serif",
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                        }}
                      >
                        Unduh Backup Database
                      </button>
                    </div>

                    {/* Pemulihan (Restore) */}
                    <div style={{ background: 'var(--card)', borderRadius: 22, padding: 28, boxShadow: 'var(--shadow)', border: '1px solid var(--line2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div>
                        <span style={{ font: "400 11px 'IBM Plex Mono',monospace", color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                          Langkah 2: Pemulihan (Restore)
                        </span>
                        <h3 style={{ margin: '8px 0 0', font: "400 24px 'PP Editorial New',serif" }}>
                          Pulihkan dari Cadangan
                        </h3>
                        <p style={{ margin: '8px 0 0', font: "400 13.5px/1.6 'IBM Plex Sans',sans-serif", color: 'var(--ink2)' }}>
                          Unggah file backup JSON untuk menimpa dan memulihkan kondisi basis data ke titik cadangan tersebut.
                        </p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label style={{ fontSize: 12, fontFamily: "'IBM Plex Mono',monospace", color: 'var(--ink3)' }}>PILIH FILE JSON BACKUP:</label>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleRestoreFile}
                          style={{ fontSize: 13, color: 'var(--ink2)' }}
                        />
                      </div>

                      <button
                        onClick={handleExecuteRestore}
                        style={{
                          marginTop: 8,
                          padding: '12px 24px',
                          borderRadius: 12,
                          border: 'none',
                          background: 'var(--down)',
                          color: '#ffffff',
                          font: "500 13.5px 'IBM Plex Sans',sans-serif",
                          cursor: 'pointer',
                        }}
                      >
                        Jalankan Pemulihan Database
                      </button>
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
