import type { Role } from './rbac';

export interface TokenPayload {
  sub: string;
  name: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

const DEFAULT_SECRET = 'forecatforlyfe-academic-jwt-secret-key-2024-v1';

function getSecretBytes(secret: string = DEFAULT_SECRET): Uint8Array {
  const enc = new TextEncoder();
  return enc.encode(secret);
}

function toBase64Url(u8: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < u8.length; i++) binary += String.fromCharCode(u8[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str: string): Uint8Array {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const binary = atob(b64);
  const u8 = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) u8[i] = binary.charCodeAt(i);
  return u8;
}

async function getKey(secret: string, usage: 'sign' | 'verify'): Promise<CryptoKey> {
  const raw = getSecretBytes(secret);
  return await crypto.subtle.importKey(
    'raw',
    raw as unknown as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage]
  );
}

export async function signToken(
  payload: TokenPayload,
  secret: string = process.env.SESSION_SECRET || DEFAULT_SECRET,
  expiresInSeconds: number = 7 * 86400
): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);

  const fullPayload: TokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const enc = new TextEncoder();
  const headerB64 = toBase64Url(enc.encode(JSON.stringify(header)));
  const payloadB64 = toBase64Url(enc.encode(JSON.stringify(fullPayload)));
  const data = enc.encode(`${headerB64}.${payloadB64}`);

  const key = await getKey(secret, 'sign');
  const signature = await crypto.subtle.sign('HMAC', key, data as unknown as BufferSource);
  const signatureB64 = toBase64Url(new Uint8Array(signature));

  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

export async function verifyToken(
  token: string,
  secret: string = process.env.SESSION_SECRET || DEFAULT_SECRET
): Promise<TokenPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const enc = new TextEncoder();
    const data = enc.encode(`${headerB64}.${payloadB64}`);
    const signature = fromBase64Url(signatureB64);

    const key = await getKey(secret, 'verify');
    const valid = await crypto.subtle.verify('HMAC', key, signature as unknown as BufferSource, data as unknown as BufferSource);
    if (!valid) return null;

    const dec = new TextDecoder();
    const payload = JSON.parse(dec.decode(fromBase64Url(payloadB64))) as TokenPayload;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
