import { NextResponse, type NextRequest } from 'next/server';
import { exportBackupData, restoreBackupData } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { recordAuditLog } from '@/lib/db/audit';

export async function GET() {
  try {
    const session = await getSession();
    const backup = exportBackupData();

    recordAuditLog({
      user_id: session?.sub,
      user_name: session?.name,
      role: session?.role,
      action: 'DATABASE_BACKUP_CREATE',
      details: 'Membuat dan mengunduh snapshot backup database.',
    });

    const filename = `backup-forecatforlyfe-${new Date().toISOString().slice(0, 10)}.json`;

    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('Backup error:', err);
    return NextResponse.json({ error: 'Gagal membuat backup database.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Data backup tidak valid.' }, { status: 400 });
    }

    restoreBackupData(body);

    recordAuditLog({
      user_id: session?.sub,
      user_name: session?.name,
      role: session?.role,
      action: 'DATABASE_RESTORE',
      details: 'Memulihkan data database dari snapshot cadangan.',
    });

    return NextResponse.json({ success: true, message: 'Database berhasil dipulihkan dari cadangan.' });
  } catch (err) {
    console.error('Restore error:', err);
    return NextResponse.json({ error: 'Gagal memulihkan database dari backup.' }, { status: 500 });
  }
}
