// Development-only authentication helpers.
//
// TODO(production): Admin access in production MUST go through a real backend
// with server-side role checks. This file intentionally lives behind two gates:
//   1. `import.meta.env.DEV` (true only during `vite dev`), or
//   2. an explicit `VITE_ENABLE_DEV_AUTH=true` env flag.
// Both are stripped/evaluated to `false` in normal production builds, so the
// dev admin password never reaches end users.
//
// The default password ("admin1234") is intended for local development only.
// To use a different one for your machine, set VITE_DEV_ADMIN_PASSWORD in a
// local .env.local file. Never commit a real admin password.

import type { AuthUser } from './mockAuth';

export const DEV_ADMIN_EMAIL = 'admin@colony.local';
export const DEV_ADMIN_ID = 'dev-admin-001';

export function isDevAuthEnabled(): boolean {
  if (import.meta.env.DEV === true) return true;
  return import.meta.env.VITE_ENABLE_DEV_AUTH === 'true';
}

function getDevAdminPassword(): string {
  const override = import.meta.env.VITE_DEV_ADMIN_PASSWORD;
  if (typeof override === 'string' && override.length > 0) return override;
  return 'admin1234';
}

export function buildDevAdminUser(): AuthUser {
  return {
    id: DEV_ADMIN_ID,
    email: DEV_ADMIN_EMAIL,
    name: 'Colony Admin',
    provider: 'development',
    role: 'admin',
    emailVerified: true,
    createdAt: new Date().toISOString(),
  };
}

export function isDevAdminCredentials(email: string, password: string): boolean {
  if (!isDevAuthEnabled()) return false;
  return email.trim().toLowerCase() === DEV_ADMIN_EMAIL && password === getDevAdminPassword();
}
