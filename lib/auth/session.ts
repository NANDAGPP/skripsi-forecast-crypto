import { cookies } from 'next/headers';
import { signToken, verifyToken, type TokenPayload } from './jwt';
import type { Role } from './rbac';

export const SESSION_COOKIE_NAME = 'ffl_session';

export async function createSessionCookie(user: { id: string; name: string; email: string; role: Role }): Promise<string> {
  const token = await signToken({
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 hari
  });

  return token;
}

export async function getSession(): Promise<TokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyToken(token);
  } catch {
    return null;
  }
}

export async function clearSessionCookie() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch {
    // Abaikan jika tidak di server context
  }
}
