'use client';

import { useState, useTransition, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import BackgroundHills from '@/components/BackgroundHills';
import Reveal from '@/components/Reveal';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '';
  const errorParam = searchParams.get('error') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(
    errorParam === 'unauthorized'
      ? 'Akses ditolak: Anda tidak memiliki izin untuk rute tersebut.'
      : null
  );
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Terjadi kesalahan saat memproses masuk.');
          return;
        }

        const target = callbackUrl && !callbackUrl.includes('/login') ? callbackUrl : data.redirectUrl || '/';
        router.push(target);
        router.refresh();
      } catch {
        setError('Gagal terhubung ke server. Periksa koneksi internet Anda.');
      }
    });
  };

  return (
    <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 440 }}>
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 26,
          padding: 'clamp(28px, 5vw, 38px)',
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--line2)',
        }}
      >
        {/* Header Form */}
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 28 }}>
          <span
            style={{
              font: "400 12px 'IBM Plex Mono',monospace",
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              color: 'var(--ink3)',
            }}
          >
            Masuk Sistem
          </span>
          <h1
            style={{
              margin: '8px 0 0',
              font: "400 36px/1.1 'PP Editorial New','Instrument Serif',serif",
              letterSpacing: '-.01em',
            }}
          >
            Masuk ke akun Anda
          </h1>
          <p style={{ margin: '8px 0 0', font: "400 14px 'IBM Plex Sans',sans-serif", color: 'var(--ink2)' }}>
            Masukkan alamat surel dan kata sandi administrator untuk melanjutkan ke konsol sistem.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 14,
              background: 'color-mix(in srgb, var(--down) 12%, transparent)',
              color: 'var(--down)',
              font: "400 13px 'IBM Plex Sans',sans-serif",
              marginBottom: 20,
              border: '1px solid color-mix(in srgb, var(--down) 30%, transparent)',
            }}
          >
            {error}
          </div>
        )}

        {/* Form Input */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label
              htmlFor="email"
              style={{
                font: "400 12px 'IBM Plex Mono',monospace",
                textTransform: 'uppercase',
                color: 'var(--ink3)',
                letterSpacing: '.06em',
              }}
            >
              Alamat Surel
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              required
              style={{
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid var(--line)',
                background: 'var(--surf2)',
                color: 'var(--ink)',
                font: "400 14px 'IBM Plex Sans',sans-serif",
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label
              htmlFor="password"
              style={{
                font: "400 12px 'IBM Plex Mono',monospace",
                textTransform: 'uppercase',
                color: 'var(--ink3)',
                letterSpacing: '.06em',
              }}
            >
              Kata Sandi
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid var(--line)',
                background: 'var(--surf2)',
                color: 'var(--ink)',
                font: "400 14px 'IBM Plex Sans',sans-serif",
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            style={{
              marginTop: 10,
              padding: '13px',
              borderRadius: 12,
              border: 'none',
              background: 'var(--ink)',
              color: 'var(--onink)',
              font: "500 14.5px 'IBM Plex Sans',sans-serif",
              cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.7 : 1,
              transition: 'opacity .2s, transform .2s',
            }}
          >
            {isPending ? 'Memproses Masuk…' : 'Masuk ke Sistem'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <BackgroundHills />
      <div
        style={{
          position: 'relative',
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            maxWidth: 1240,
            width: '100%',
            margin: '0 auto',
            minHeight: 66,
            padding: '14px clamp(14px, 3vw, 28px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Logo size="md" />
          <ThemeToggle />
        </div>

        {/* Main Content */}
        <main
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px 60px',
          }}
        >
          <Reveal order={1}>
            <Suspense fallback={<div style={{ color: 'var(--ink3)' }}>Memuat formulir masuk…</div>}>
              <LoginFormContent />
            </Suspense>
          </Reveal>
        </main>
      </div>
    </>
  );
}
