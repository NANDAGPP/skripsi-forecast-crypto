import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUserById, toSafeUser } from '@/lib/db/users';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null });
    }

    const user = getUserById(session.sub);
    if (!user || user.is_active === 0) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user: toSafeUser(user) });
  } catch (err) {
    console.error('Me endpoint error:', err);
    return NextResponse.json({ user: null });
  }
}
