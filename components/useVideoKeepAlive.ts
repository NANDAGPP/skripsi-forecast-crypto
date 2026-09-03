'use client';

import { useEffect, type RefObject } from 'react';

/** Keeps a muted looping background video actually playing across the
 * various ways mobile browsers and desktop autoplay policies pause/refuse autoplay. */
export function useVideoKeepAlive(ref: RefObject<HTMLVideoElement | null>) {
  useEffect(() => {
    const v = ref.current;
    if (!v) return;

    const kick = () => {
      v.muted = true;
      v.defaultMuted = true;
      v.playsInline = true;
      v.loop = true;
      if (v.ended) v.currentTime = 0;
      const p = v.play();
      if (p && p.catch) p.catch(() => {});
    };

    const onEnded = () => {
      v.currentTime = 0;
      kick();
    };

    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    v.loop = true;

    kick();
    v.addEventListener('canplay', kick);
    v.addEventListener('loadeddata', kick);
    v.addEventListener('ended', onEnded);
    window.addEventListener('pointerdown', kick, { passive: true });
    window.addEventListener('touchstart', kick, { passive: true });
    window.addEventListener('scroll', kick, { passive: true, once: true });
    document.addEventListener('visibilitychange', kick);

    const timer = window.setInterval(() => {
      if (v.paused || v.ended || !v.loop) kick();
    }, 1000);

    return () => {
      v.removeEventListener('canplay', kick);
      v.removeEventListener('loadeddata', kick);
      v.removeEventListener('ended', onEnded);
      window.removeEventListener('pointerdown', kick);
      window.removeEventListener('touchstart', kick);
      window.removeEventListener('scroll', kick);
      document.removeEventListener('visibilitychange', kick);
      window.clearInterval(timer);
    };
  }, [ref]);
}
