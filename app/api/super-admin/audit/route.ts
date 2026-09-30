import { NextResponse, type NextRequest } from 'next/server';
import { listAuditLogs } from '@/lib/db/audit';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const logs = listAuditLogs(limit, role);
    return NextResponse.json({ logs });
  } catch (err) {
    console.error('Audit logs error:', err);
    return NextResponse.json({ error: 'Gagal mengambil riwayat audit.' }, { status: 500 });
  }
}
