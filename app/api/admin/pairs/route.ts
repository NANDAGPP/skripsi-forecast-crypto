import { NextResponse, type NextRequest } from 'next/server';
import { listPairs, addPair, togglePairStatus, deletePair } from '@/lib/db/pairs';
import { getSession } from '@/lib/auth/session';
import { recordAuditLog } from '@/lib/db/audit';

export async function GET() {
  try {
    const pairs = listPairs();
    return NextResponse.json({ pairs });
  } catch (err) {
    console.error('List pairs error:', err);
    return NextResponse.json({ error: 'Gagal mengambil daftar pairs.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { symbol, base_asset, quote_asset } = body;

    if (!symbol || !base_asset || !quote_asset) {
      return NextResponse.json(
        { error: 'Simbol, base asset, dan quote asset wajib diisi.' },
        { status: 400 }
      );
    }

    const newPair = addPair(symbol, base_asset, quote_asset);

    recordAuditLog({
      user_id: session?.sub,
      user_name: session?.name,
      role: session?.role,
      action: 'PAIR_CREATE',
      details: `Menambahkan pasangan cryptocurrency baru: ${newPair.symbol}`,
    });

    return NextResponse.json({ pair: newPair });
  } catch (err) {
    console.error('Add pair error:', err);
    return NextResponse.json({ error: 'Gagal menambahkan pair cryptocurrency.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID pair wajib disertakan.' }, { status: 400 });
    }

    const res = togglePairStatus(id);
    if (!res) {
      return NextResponse.json({ error: 'Pair tidak ditemukan.' }, { status: 404 });
    }

    recordAuditLog({
      user_id: session?.sub,
      user_name: session?.name,
      role: session?.role,
      action: 'PAIR_STATUS_TOGGLE',
      details: `Mengubah status pair ID ${id} menjadi ${res.status}`,
    });

    return NextResponse.json({ success: true, status: res.status });
  } catch (err) {
    console.error('Toggle pair status error:', err);
    return NextResponse.json({ error: 'Gagal memperbarui status pair.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID pair wajib disertakan.' }, { status: 400 });
    }

    const success = deletePair(id);
    if (!success) {
      return NextResponse.json({ error: 'Pair tidak ditemukan atau gagal dihapus.' }, { status: 404 });
    }

    recordAuditLog({
      user_id: session?.sub,
      user_name: session?.name,
      role: session?.role,
      action: 'PAIR_DELETE',
      details: `Menghapus pasangan cryptocurrency ID ${id}`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete pair error:', err);
    return NextResponse.json({ error: 'Gagal menghapus pair.' }, { status: 500 });
  }
}
