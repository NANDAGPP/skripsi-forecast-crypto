import { NextResponse, type NextRequest } from 'next/server';
import {
  listUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
  getUserByEmail,
  getUserById,
  countUsersStats,
  type UserRole,
} from '@/lib/db/users';
import { getSession } from '@/lib/auth/session';
import { recordAuditLog } from '@/lib/db/audit';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role') as UserRole | 'ALL' | null;

    const users = listUsers(roleFilter || 'ALL');
    const stats = countUsersStats();

    return NextResponse.json({ users, stats });
  } catch (err) {
    console.error('List users error:', err);
    return NextResponse.json({ error: 'Gagal mengambil data pengguna.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Semua kolom (nama, email, password, role) wajib diisi.' },
        { status: 400 }
      );
    }

    const existing = getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'Email sudah terdaftar.' }, { status: 409 });
    }

    const newUser = createUser({
      name,
      email,
      password,
      role: role as UserRole,
    });

    recordAuditLog({
      user_id: session?.sub,
      user_name: session?.name,
      role: session?.role,
      action: 'USER_CREATE_BY_ADMIN',
      details: `Membuat akun baru: ${newUser.name} (${newUser.email}) dengan role ${newUser.role}`,
    });

    return NextResponse.json({ user: newUser });
  } catch (err) {
    console.error('Create user error:', err);
    return NextResponse.json({ error: 'Gagal membuat pengguna baru.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { id, action, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID pengguna wajib disertakan.' }, { status: 400 });
    }

    // Toggle status aktif/nonaktif
    if (action === 'toggle_status') {
      const res = toggleUserStatus(id);
      if (!res) {
        return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
      }

      recordAuditLog({
        user_id: session?.sub,
        user_name: session?.name,
        role: session?.role,
        action: 'USER_STATUS_TOGGLE',
        details: `Mengubah status keaktifan user ID ${id} menjadi ${res.is_active === 1 ? 'AKTIF' : 'NONAKTIF'}`,
      });

      return NextResponse.json({ success: true, is_active: res.is_active });
    }

    // Update profil / role
    const updated = updateUser(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    recordAuditLog({
      user_id: session?.sub,
      user_name: session?.name,
      role: session?.role,
      action: 'USER_UPDATE',
      details: `Memperbarui data akun ${updated.email} (Role: ${updated.role})`,
    });

    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error('Update user error:', err);
    return NextResponse.json({ error: 'Gagal memperbarui pengguna.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID pengguna wajib disertakan.' }, { status: 400 });
    }

    if (session?.sub === id) {
      return NextResponse.json(
        { error: 'Anda tidak dapat menghapus akun Anda sendiri saat sedang masuk.' },
        { status: 400 }
      );
    }

    const target = getUserById(id);
    const success = deleteUser(id);
    if (!success) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan atau gagal dihapus.' }, { status: 404 });
    }

    recordAuditLog({
      user_id: session?.sub,
      user_name: session?.name,
      role: session?.role,
      action: 'USER_DELETE',
      details: `Menghapus akun ${target ? target.email : id}`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete user error:', err);
    return NextResponse.json({ error: 'Gagal menghapus pengguna.' }, { status: 500 });
  }
}
