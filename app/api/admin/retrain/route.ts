import { NextResponse } from 'next/server';
import { triggerModelRetraining } from '@/lib/db/models';
import { getSession } from '@/lib/auth/session';

export async function POST() {
  try {
    const session = await getSession();
    const triggeredBy = session?.name || 'Admin';

    const result = triggerModelRetraining(
      triggeredBy,
      session?.sub,
      session?.name,
      session?.role
    );

    return NextResponse.json({
      success: true,
      result,
      message: 'Proses retraining model ensemble (LSTM, GRU, XGBoost) berhasil dipicu dan diselesaikan.',
    });
  } catch (err) {
    console.error('Retraining error:', err);
    return NextResponse.json({ error: 'Gagal menjalankan pelatihan ulang model.' }, { status: 500 });
  }
}
