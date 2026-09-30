'use client';

import { useEffect, useRef, useState } from 'react';
import { useVideoKeepAlive } from './useVideoKeepAlive';
import { useReducedMotion } from '@/lib/useReducedMotion';

const EASE = 'cubic-bezier(.19,.86,.24,1)';

/**
 * Opening splash (wordmark + hill still) that hands off to the looping
 * background hill video, matching the reference animation: wordmark fades
 * in and tightens, the still hill rises and settles, both dissolve, then
 * the looping video underneath fades up into place.
 */
export default function HeroIntro() {
  const [stage, setStage] = useState(0);
  const reduced = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  useVideoKeepAlive(videoRef);

  useEffect(() => {
    if (reduced) return;
    const timers = [
      setTimeout(() => setStage(1), 140),
      setTimeout(() => setStage(2), 260),
      setTimeout(() => setStage(3), 1750),
      setTimeout(() => setStage(4), 1980),
      setTimeout(() => setStage(5), 2800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [reduced]);

  const effectiveStage = reduced ? 5 : stage;
  const markVisible = effectiveStage >= 1 && effectiveStage < 3;
  const hillVisible = effectiveStage >= 2 && effectiveStage < 3;
  const bgVisible = effectiveStage >= 4;
  const splashMounted = effectiveStage < 5;
  const splashFading = effectiveStage >= 4;

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {splashMounted && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            background: 'var(--bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transition: 'opacity .75s ease',
            opacity: splashFading ? 0 : 1,
            pointerEvents: splashFading ? 'none' : 'auto',
          }}
        >
          <span
            style={{
              position: 'relative',
              zIndex: 2,
              font: "400 30px 'PP Editorial New','Instrument Serif',serif",
              color: 'var(--ink)',
              letterSpacing: markVisible ? '.03em' : '.34em',
              opacity: markVisible ? 1 : 0,
              transform: effectiveStage >= 3 ? 'translateY(-12px)' : 'none',
              transition: `opacity .9s ease, letter-spacing 1.5s ${EASE}, transform .8s ${EASE}`,
            }}
          >
            Forecastforlyfe
          </span>
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: -60,
              height: '64%',
              overflow: 'hidden',
              mixBlendMode: 'multiply',
              maskImage: 'linear-gradient(to top, #000 42%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to top, #000 42%, transparent 100%)',
              opacity: hillVisible ? 1 : 0,
              transform:
                effectiveStage >= 3 ? 'translateY(-40px) scale(1.16)' : hillVisible ? 'none' : 'translateY(150px) scale(1.12)',
              filter: effectiveStage >= 3 ? 'blur(46px)' : 'none',
              transition: `transform 1.6s ${EASE}, opacity 1.1s ease, filter .9s ease`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/hill-poster.png"
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 60%', display: 'block' }}
            />
          </div>
        </div>
      )}

      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          opacity: bgVisible ? 1 : 0,
          transform: bgVisible ? 'none' : 'translateY(56px) scale(1.06)',
          transition: `opacity 1.1s ${EASE}, transform 1.4s ${EASE}`,
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
              'linear-gradient(to bottom, color-mix(in srgb, var(--bg) 50%, transparent) 0%, color-mix(in srgb, var(--bg) 24%, transparent) 45%, color-mix(in srgb, var(--bg) 62%, transparent) 100%)',
          }}
        />
      </div>
    </div>
  );
}
