export type Role = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export const ROLES: Record<Role, Role> = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
};

export function canAccessSuperAdmin(role?: Role | null): boolean {
  return role === 'SUPER_ADMIN';
}

export function canAccessAdmin(role?: Role | null): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export function canAccessUser(role?: Role | null): boolean {
  // USER dan SUPER_ADMIN dapat mengakses rute user.
  // ADMIN hanya diarahkan ke /admin sesuai aturan sistem.
  return role === 'USER' || role === 'SUPER_ADMIN';
}

export function getDefaultRedirectForRole(role?: Role | null): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/super-admin';
    case 'ADMIN':
      return '/admin';
    case 'USER':
    default:
      return '/';
  }
}
