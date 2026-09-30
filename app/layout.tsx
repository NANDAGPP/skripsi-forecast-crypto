import type { Metadata, Viewport } from 'next';
import ThemeInit from '@/components/ThemeInit';
import ConsentGate from '@/components/ConsentGate';
import SampleBanner from '@/components/SampleBanner';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'Forecastforlyfe',
  description: 'Perkiraan harga dan ukuran risiko BTC, ETH, dan BNB untuk keperluan penelitian akademik.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
        <ThemeInit />
      </head>
      <body style={{ paddingTop: 32 }}>
        <SampleBanner />
        <ConsentGate>{children}</ConsentGate>
      </body>
    </html>
  );
}


