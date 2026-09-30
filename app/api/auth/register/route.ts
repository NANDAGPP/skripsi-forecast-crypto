import { NextResponse, type NextRequest } from 'next/server';
import { getUserByEmail, createUser, getUserById } from '@/lib/db/users';
import { createSessionCookie } from '@/lib/auth/session';
import { recordAuditLog } from '@/lib/db/audit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Semua kolom (nama, email, dan kata sandi) wajib diisi.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Kata sandi minimal 6 karakter.' },
        { status: 400 }
      );
    }

    const existing = getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'Alamat email ini sudah terdaftar. Silakan masuk menggunakan akun Anda.' },
        { status: 409 }
      );
    }

    const user = createUser({
      name,
      email,
      password,
      role: 'USER',
    });

    const fullUser = getUserById(user.id);
    if (fullUser) {
      await createSessionCookie(fullUser);
    }

    recordAuditLog({
      user_id: user.id,
      user_name: user.name,
      role: user.role,
      action: 'USER_REGISTER',
      details: 'Pengguna baru berhasil mendaftar ke sistem.',
      ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return NextResponse.json({
      user,
      redirectUrl: '/',
    });
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server saat memproses registrasi.' },
      { status: 500 }
    );
  }
}
