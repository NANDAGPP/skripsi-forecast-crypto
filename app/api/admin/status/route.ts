import { NextResponse } from 'next/server';
import { getSystemSummary, listModelStatuses, listSystemJobs } from '@/lib/db/models';
import { listAuditLogs } from '@/lib/db/audit';

export async function GET() {
  try {
    const summary = getSystemSummary();
    const models = listModelStatuses();
    const jobs = listSystemJobs(15);
    const logs = listAuditLogs(20);

    return NextResponse.json({
      summary,
      models,
      jobs,
      logs,
    });
  } catch (err) {
    console.error('Admin status error:', err);
    return NextResponse.json({ error: 'Gagal mengambil status sistem.' }, { status: 500 });
  }
}
