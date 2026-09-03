'use client';

type Listener = () => void;
let listeners: Listener[] = [];

export function subscribe(cb: Listener) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

export function getSnapshot() {
  return document.documentElement.dataset.theme === 'dark';
}

export function getServerSnapshot() {
  return false;
}

export function setTheme(next: 'light' | 'dark') {
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem('ffl-theme', next);
  } catch {
    // ignore storage errors (private browsing, disabled storage)
  }
  listeners.forEach((l) => l());
}
