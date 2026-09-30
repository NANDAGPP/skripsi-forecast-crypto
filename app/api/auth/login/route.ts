import { NextResponse, type NextRequest } from 'next/server';
import { getUserByEmail, verifyPassword, toSafeUser } from '@/lib/db/users';
import { createSessionCookie } from '@/lib/auth/session';
import { getDefaultRedirectForRole } from '@/lib/auth/rbac';
import { recordAuditLog } from '@/lib/db/audit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password harus diisi.' },
        { status: 400 }
      );
    }

    const user = getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Email atau password tidak valid.' },
        { status: 401 }
      );
    }

    if (user.is_active === 0) {
      recordAuditLog({
        user_id: user.id,
        user_name: user.name,
        role: user.role,
        action: 'LOGIN_BLOCKED',
        details: 'Percobaan login ke akun yang dinonaktifkan.',
        ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
      });
      return NextResponse.json(
        { error: 'Akun Anda telah dinonaktifkan oleh Administrator. Hubungi pihak pengelola untuk informasi lebih lanjut.' },
        { status: 403 }
      );
    }

    const valid = verifyPassword(password, user.password_hash);
    if (!valid) {
      recordAuditLog({
        user_id: user.id,
        user_name: user.name,
        role: user.role,
        action: 'LOGIN_FAILED',
        details: 'Kata sandi yang dimasukkan salah.',
        ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
      });
      return NextResponse.json(
        { error: 'Email atau password tidak valid.' },
        { status: 401 }
      );
    }

    // Set session cookie
    await createSessionCookie(user);

    // Audit log sukses
    recordAuditLog({
      user_id: user.id,
      user_name: user.name,
      role: user.role,
      action: 'LOGIN_SUCCESS',
      details: `Berhasil masuk sebagai ${user.role}.`,
      ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    const safe = toSafeUser(user);
    const redirectUrl = getDefaultRedirectForRole(user.role);

    return NextResponse.json({
      user: safe,
      redirectUrl,
    });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server saat memproses login.' },
      { status: 500 }
    );
  }
}
