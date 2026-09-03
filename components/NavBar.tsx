import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';

const linkStyle: React.CSSProperties = {
  textDecoration: 'none',
  borderBottom: '1px solid var(--linkline)',
};

type NavBarProps =
  | { variant: 'dashboard'; stamp: string; maxWidth?: number }
  | { variant: 'sub'; subtitle: string; maxWidth?: number };

export default function NavBar(props: NavBarProps) {
  const maxWidth = props.maxWidth ?? 1240;
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        background: 'var(--navbg)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid color-mix(in srgb, var(--ink) 9%, transparent)',
      }}
    >
      <div
        style={{
          maxWidth,
          margin: '0 auto',
          minHeight: 66,
          padding: props.variant === 'dashboard' ? '10px clamp(14px, 3vw, 28px)' : '12px clamp(14px, 3vw, 28px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'clamp(10px, 2.5vw, 20px)',
          flexWrap: 'wrap',
        }}
      >
        {props.variant === 'dashboard' ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
              <Logo size="md" />
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap', font: "400 12.5px 'IBM Plex Sans',sans-serif" }}>
                <Link href="/kalkulator-risiko" style={linkStyle}>Kalkulator risiko</Link>
                <Link href="/performa-model" style={linkStyle}>Performa model</Link>
                <Link href="/validasi" style={linkStyle}>Validasi</Link>
                <Link href="/cara-kerja-sistem" style={linkStyle}>Cara kerja sistem</Link>
              </span>
            </div>
            <span style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <span style={{ font: "400 12px 'IBM Plex Mono',monospace", color: 'var(--ink3)' }}>
                Data per {props.stamp}
              </span>
              <ThemeToggle />
            </span>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Logo size="md" />
              <span style={{ font: "400 12.5px 'IBM Plex Sans',sans-serif", color: 'var(--ink3)' }}>
                {props.subtitle}
              </span>
            </div>
            <Link href="/" style={{ font: "400 13px 'IBM Plex Sans',sans-serif", textDecoration: 'none', borderBottom: '1px solid var(--linkline)' }}>
              ← Kembali ke dasbor
            </Link>
            <ThemeToggle />
          </>
        )}
      </div>
    </div>
  );
}
