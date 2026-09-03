'use client';

const KEY = 'ffl-consent';

type Listener = () => void;
let listeners: Listener[] = [];

export function subscribeConsent(cb: Listener) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

export function getConsentSnapshot(): boolean {
  try {
    return sessionStorage.getItem(KEY) === 'yes';
  } catch {
    return false;
  }
}

export function getConsentServerSnapshot(): boolean {
  return false;
}

export function grantConsent() {
  try {
    sessionStorage.setItem(KEY, 'yes');
  } catch {
    // ignore storage errors
  }
  listeners.forEach((l) => l());
}
