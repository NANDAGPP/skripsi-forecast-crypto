import { NextResponse } from 'next/server';
import { INITIAL_BATCH_STATUS } from '@/lib/api';

/**
 * GET /api/admin/batch/status
 * ─────────────────────────────────────────────────────────────
 * KF-16: Menampilkan status keberhasilan proses batch harian
 * beserta waktu pelaksanaannya.
 * 
 * Alasan fungsi ini ada:
 * Proses pengambilan data dan inferensi berjalan terjadwal tanpa
 * pengawasan langsung, sehingga kegagalan perlu dapat diketahui
 * dan dipulihkan.
 * ─────────────────────────────────────────────────────────────
 */
export async function GET() {
  return NextResponse.json(INITIAL_BATCH_STATUS);
}
