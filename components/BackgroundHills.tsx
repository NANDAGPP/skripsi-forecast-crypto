'use client';

import { useRef } from 'react';
import { useVideoKeepAlive } from './useVideoKeepAlive';

/**
 * Fixed full-screen looping hill video behind the page content, with a
 * gradient scrim so text stays readable.
 */
export default function BackgroundHills() {
  const videoRef = useRef<HTMLVideoElement>(null);
  useVideoKeepAlive(videoRef);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <video
        ref={videoRef}
        poster="/assets/hill-poster.png"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 62%', display: 'block' }}
      >
        <source src="/assets/hill.mp4" type="video/mp4" />
      </video>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, color-mix(in srgb, var(--bg) 52%, transparent) 0%, color-mix(in srgb, var(--bg) 30%, transparent) 45%, color-mix(in srgb, var(--bg) 70%, transparent) 100%)',
        }}
      />
    </div>
  );
}
