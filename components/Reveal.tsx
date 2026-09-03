'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

export default function Reveal({
  order = 1,
  style,
  className,
  children,
}: {
  order?: 1 | 2 | 3 | 4;
  style?: CSSProperties;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      el.classList.add('is-visible');
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting && e.boundingClientRect.top > window.innerHeight * 0.9) return;
          el.classList.add('is-visible');
          io.unobserve(el);
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} data-reveal={order} className={className} style={style}>
      {children}
    </div>
  );
}
