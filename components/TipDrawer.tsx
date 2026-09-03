export type Tip = { title: string; body: string } | null;

export default function TipDrawer({ tip, onClose }: { tip: Tip; onClose: () => void }) {
  if (!tip) return null;
  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 40,
        background: 'var(--panel)',
        padding: '20px 28px',
      }}
    >
      <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span
            style={{
              font: "400 11.5px 'IBM Plex Mono',monospace",
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              color: 'var(--onink2)',
            }}
          >
            {tip.title}
          </span>
          <p
            style={{
              margin: 0,
              font: "400 14.5px/1.65 'IBM Plex Sans',sans-serif",
              color: 'var(--surf2)',
              maxWidth: 940,
              textWrap: 'pretty',
            }}
          >
            {tip.body}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            flex: 'none',
            height: 38,
            padding: '0 16px',
            background: 'var(--lime)',
            border: 'none',
            color: 'var(--onlime)',
            borderRadius: 10,
            font: "500 13px 'IBM Plex Sans',sans-serif",
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          Tutup
        </button>
      </div>
    </div>
  );
}
