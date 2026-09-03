export default function Disclaimer({ text }: { text: string }) {
  return (
    <div
      style={{
        marginTop: 22,
        background: 'color-mix(in srgb, var(--card) 55%, transparent)',
        borderRadius: 20,
        padding: '20px 24px',
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          marginTop: 7,
          flex: 'none',
          borderRadius: '50%',
          background: 'var(--ink4)',
          display: 'block',
        }}
      />
      <p style={{ margin: 0, font: "400 13.5px/1.65 'IBM Plex Sans',sans-serif", color: 'var(--ink2)', maxWidth: 1000 }}>
        {text}
      </p>
    </div>
  );
}
