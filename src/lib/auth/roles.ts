// Reusable role-check helpers.
//
// These run on the client and are intentionally simple. They are NOT a
// substitute for server-side enforcement — any admin-only data fetched by the
// client must still be authorized server-side.

import type { UserRole } from '../admin/adminTypes';

type RoleHolder = { role?: UserRole | null } | null | undefined;

export function isAdmin(user: RoleHolder): boolean {
  return user?.role === 'admin';
}

export function isDeveloper(user: RoleHolder): boolean {
  return user?.role === 'developer';
}

export function isDeveloperOrAdmin(user: RoleHolder): boolean {
  return user?.role === 'admin' || user?.role === 'developer';
}

export function canAccessAdminDashboard(user: RoleHolder): boolean {
  return isDeveloperOrAdmin(user);
}

export function canSeeDeveloperSettings(user: RoleHolder): boolean {
  return isDeveloperOrAdmin(user);
}

export function roleBadgeLabel(role?: UserRole | null): 'User' | 'Developer' | 'Admin' {
  if (role === 'admin') return 'Admin';
  if (role === 'developer') return 'Developer';
  return 'User';
}

// TODO(BACKEND-ACCESS-GATE): real enforcement must happen server-side.
// Every /api/* product endpoint must 403 unless the caller is developer/admin
// or has accessStatus="active_pilot". This frontend helper only decides which
// page to render; it is not an access-control boundary.
//
// When the backend lands the `accessStatus` field and the 'pilot' role on the
// user record, extend this to:
//   return isDeveloperOrAdmin(user) ||
//          (user.role === 'pilot' && user.accessStatus === 'active');
export function canAccessApp(user: RoleHolder): boolean {
  return isDeveloperOrAdmin(user);
}
