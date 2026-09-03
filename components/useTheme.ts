'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { subscribe, getSnapshot, getServerSnapshot, setTheme } from '@/lib/themeStore';

export function useTheme() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleTheme = useCallback(() => {
    setTheme(dark ? 'light' : 'dark');
  }, [dark]);

  return { dark, toggleTheme };
}
