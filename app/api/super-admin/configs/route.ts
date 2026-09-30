import { NextResponse, type NextRequest } from 'next/server';
import { getAllConfigs, updateBatchConfigs } from '@/lib/db/configs';
import { getSession } from '@/lib/auth/session';
import { recordAuditLog } from '@/lib/db/audit';

export async function GET() {
  try {
    const configs = getAllConfigs();
    return NextResponse.json({ configs });
  } catch (err) {
    console.error('List configs error:', err);
    return NextResponse.json({ error: 'Gagal mengambil konfigurasi sistem.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { configs } = body;

    if (!Array.isArray(configs)) {
      return NextResponse.json({ error: 'Format konfigurasi harus berupa array.' }, { status: 400 });
    }

    updateBatchConfigs(configs);

    recordAuditLog({
      user_id: session?.sub,
      user_name: session?.name,
      role: session?.role,
      action: 'SYSTEM_CONFIG_UPDATE',
      details: `Memperbarui ${configs.length} parameter konfigurasi sistem/global/environment.`,
    });

    const updated = getAllConfigs();
    return NextResponse.json({ success: true, configs: updated });
  } catch (err) {
    console.error('Update configs error:', err);
    return NextResponse.json({ error: 'Gagal menyimpan konfigurasi sistem.' }, { status: 500 });
  }
}
