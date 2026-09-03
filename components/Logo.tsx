'use client';

import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const iconHeight = size === 'sm' ? 24 : size === 'lg' ? 36 : 28;
  const fontSize = size === 'sm' ? 15 : size === 'lg' ? 21 : 17;

  return (
    <Link
      href="/"
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 11,
        textDecoration: 'none',
        color: 'inherit',
      }}
      aria-label="RECASTFORLIFE"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="Logo"
        height={iconHeight}
        width={iconHeight}
        style={{
          height: iconHeight,
          width: 'auto',
          maxWidth: iconHeight * 1.6,
          objectFit: 'contain',
          display: 'block',
          flexShrink: 0,
        }}
      />
      {showText && (
        <span
          style={{
            fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            fontWeight: 700,
            fontSize,
            letterSpacing: '0.02em',
            color: 'var(--ink)',
            lineHeight: 1,
            textTransform: 'uppercase',
          }}
        >
          RECASTFORLIFE
        </span>
      )}
    </Link>
  );
}
