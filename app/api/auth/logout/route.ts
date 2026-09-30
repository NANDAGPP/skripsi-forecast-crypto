import { NextResponse, type NextRequest } from 'next/server';
import { clearSessionCookie, getSession } from '@/lib/auth/session';
import { recordAuditLog } from '@/lib/db/audit';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (session) {
      recordAuditLog({
        user_id: session.sub,
        user_name: session.name,
        role: session.role,
        action: 'LOGOUT',
        details: 'Pengguna telah keluar dari sistem.',
        ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
      });
    }

    await clearSessionCookie();
    return NextResponse.json({ success: true, message: 'Berhasil keluar.' });
  } catch (err) {
    console.error('Logout error:', err);
    return NextResponse.json({ error: 'Gagal memproses logout.' }, { status: 500 });
  }
}
