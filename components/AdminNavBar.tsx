'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import type { Role } from '@/lib/auth/rbac';

interface AdminNavBarProps {
  role: Role;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  tabs: { id: string; label: string }[];
  userName?: string;
  maxWidth?: number;
}

export default function AdminNavBar({
  role,
  activeTab,
  onSelectTab,
  tabs,
  userName = 'Admin',
  maxWidth = 1320,
}: AdminNavBarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  const isSuper = role === 'SUPER_ADMIN';

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        background: 'var(--navbg)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid color-mix(in srgb, var(--ink) 9%, transparent)',
      }}
    >
      {/* Baris Atas: Logo, Role Badge, Switch Link, Profil, Logout, Theme */}
      <div
        style={{
          maxWidth,
          margin: '0 auto',
          padding: '10px clamp(14px, 2.5vw, 28px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Logo size="md" />
          <span
            style={{
              padding: '3px 10px',
              borderRadius: 999,
              font: "500 11px 'IBM Plex Mono',monospace",
              background: isSuper ? 'var(--lime)' : 'var(--surf2)',
              color: isSuper ? 'var(--onlime)' : 'var(--risk)',
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              border: isSuper ? 'none' : '1px solid var(--line)',
            }}
          >
            {isSuper ? 'Super Admin' : 'Administrator'}
          </span>

          {/* Quick link switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 10 }}>
            {isSuper ? (
              <Link
                href="/admin"
                style={{
                  font: "400 12px 'IBM Plex Sans',sans-serif",
                  color: 'var(--ink3)',
                  textDecoration: 'none',
                  borderBottom: '1px dashed var(--linkline)',
                }}
              >
                Panel Admin
              </Link>
            ) : (
              <Link
                href="/super-admin"
                style={{
                  font: "400 12px 'IBM Plex Sans',sans-serif",
                  color: 'var(--ink3)',
                  textDecoration: 'none',
                  borderBottom: '1px dashed var(--linkline)',
                }}
              >
                Super Admin
              </Link>
            )}
            <span style={{ color: 'var(--ink4)', fontSize: 11 }}>•</span>
            <Link
              href="/"
              style={{
                font: "400 12px 'IBM Plex Sans',sans-serif",
                color: 'var(--ink3)',
                textDecoration: 'none',
                borderBottom: '1px dashed var(--linkline)',
              }}
            >
              Halaman User
            </Link>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ font: "400 12.5px 'IBM Plex Sans',sans-serif", color: 'var(--ink3)' }}>
            {userName}
          </span>
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ink3)',
              font: "400 12.5px 'IBM Plex Sans',sans-serif",
              cursor: 'pointer',
              padding: 0,
              textDecoration: 'none',
              borderBottom: '1px solid var(--linkline)',
            }}
          >
            Keluar
          </button>
          <ThemeToggle />
        </div>
      </div>

      {/* Baris Bawah: Tab Navigasi Role (hanya jika tabs disediakan) */}
      {tabs.length > 0 && (
        <div
          style={{
            maxWidth,
            margin: '0 auto',
            padding: '0 clamp(14px, 2.5vw, 28px)',
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                style={{
                  padding: '10px 16px',
                  border: 'none',
                  borderBottom: active ? '2px solid var(--ink)' : '2px solid transparent',
                  background: 'transparent',
                  color: active ? 'var(--ink)' : 'var(--ink3)',
                  font: active
                    ? "500 13.5px 'IBM Plex Sans',sans-serif"
                    : "400 13.5px 'IBM Plex Sans',sans-serif",
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'color .2s, border-color .2s',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
