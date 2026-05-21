import type { UserRole } from '../admin/adminTypes';

export type AuthProvider = 'email' | 'google';
export type VerificationPurpose = 'signup' | 'password_reset';

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  provider: AuthProvider;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
  isNewUser?: boolean;
};

export type VerificationCode = {
  email: string;
  code: string;
  purpose: VerificationPurpose;
  expiresAt: string;
  createdAt: string;
};

type StoredAuthUser = AuthUser & {
  // TODO: Replace mock password storage with real backend auth. Real passwords
  // must be hashed server-side and never stored in frontend localStorage.
  mockPassword?: string;
};

export const MOCK_USERS_KEY = 'colony_users';
export const MOCK_CURRENT_USER_KEY = 'colony_current_user';
export const VERIFICATION_CODES_KEY = 'colony_verification_codes';

const CODE_TTL_MS = 10 * 60 * 1000;

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password) return { valid: false, message: 'Password is required.' };
  if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters.' };
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return { valid: false, message: 'Password should include at least one letter and one number.' };
  }
  return { valid: true };
}

export function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function loadMockUsers(): AuthUser[] {
  return loadStoredUsers().map(stripPassword);
}

export function getStoredMockUser(email: string) {
  return loadStoredUsers().find((user) => user.email === normalizeEmail(email)) ?? null;
}

export function createVerificationCode(email: string, purpose: VerificationPurpose): VerificationCode {
  const cleanEmail = normalizeEmail(email);
  const codes = loadVerificationCodes().filter((item) => !(item.email === cleanEmail && item.purpose === purpose));
  const next: VerificationCode = {
    email: cleanEmail,
    code: generateVerificationCode(),
    purpose,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + CODE_TTL_MS).toISOString(),
  };
  saveVerificationCodes([next, ...codes]);
  return next;
}

export function verifyCode(email: string, code: string, purpose: VerificationPurpose): { valid: boolean; expired?: boolean } {
  const cleanEmail = normalizeEmail(email);
  const match = loadVerificationCodes().find((item) => item.email === cleanEmail && item.purpose === purpose && item.code === code);
  if (!match) return { valid: false };
  if (new Date(match.expiresAt).getTime() < Date.now()) return { valid: false, expired: true };
  return { valid: true };
}

export function removeVerificationCode(email: string, purpose: VerificationPurpose) {
  const cleanEmail = normalizeEmail(email);
  saveVerificationCodes(loadVerificationCodes().filter((item) => !(item.email === cleanEmail && item.purpose === purpose)));
}

export function createMockUser(email: string, password: string): AuthUser {
  const cleanEmail = normalizeEmail(email);
  const users = loadStoredUsers();
  if (users.some((user) => user.email === cleanEmail)) throw new Error('An account with this email already exists.');
  const user: StoredAuthUser = {
    id: `user_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    email: cleanEmail,
    provider: 'email',
    role: 'user',
    emailVerified: true,
    createdAt: new Date().toISOString(),
    isNewUser: true,
    mockPassword: password,
  };
  saveStoredUsers([...users, stripEphemeral(user)]);
  const publicUser = stripPassword(user);
  setCurrentUser(publicUser);
  return publicUser;
}

export function signInMockUser(email: string, password: string): { user: AuthUser | null; reason?: 'not_found' | 'invalid_password' | 'email_unverified' } {
  const user = getStoredMockUser(email);
  if (!user) return { user: null, reason: 'not_found' };
  if (user.provider === 'email' && user.mockPassword !== password) return { user: null, reason: 'invalid_password' };
  if (!user.emailVerified) return { user: stripPassword(user), reason: 'email_unverified' };
  const publicUser = stripPassword(user);
  setCurrentUser(publicUser);
  return { user: publicUser };
}

export function resetMockPassword(email: string, newPassword: string) {
  const cleanEmail = normalizeEmail(email);
  const users = loadStoredUsers();
  let updated = false;
  const next = users.map((user) => {
    if (user.email !== cleanEmail) return user;
    updated = true;
    return { ...user, mockPassword: newPassword, emailVerified: true };
  });
  saveStoredUsers(next);
  return updated;
}

export function markEmailVerified(email: string) {
  const cleanEmail = normalizeEmail(email);
  const users = loadStoredUsers();
  let updatedUser: AuthUser | null = null;
  const next = users.map((user) => {
    if (user.email !== cleanEmail) return user;
    const updated = { ...user, emailVerified: true };
    updatedUser = stripPassword(updated);
    return updated;
  });
  saveStoredUsers(next);
  if (updatedUser) setCurrentUser(updatedUser);
  return updatedUser;
}

export function getCurrentUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(MOCK_CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) as AuthUser : null;
  } catch { /* ignore */ }
  return null;
}

export function setCurrentUser(user: AuthUser) {
  try { localStorage.setItem(MOCK_CURRENT_USER_KEY, JSON.stringify(stripPassword(user))); } catch { /* ignore */ }
}

export function signOut() {
  try { localStorage.removeItem(MOCK_CURRENT_USER_KEY); } catch { /* ignore */ }
}

export function signInWithGoogleMock(): AuthUser {
  const cleanEmail = 'user@example.com';
  const users = loadStoredUsers();
  const existing = users.find((user) => user.email === cleanEmail);
  const user: StoredAuthUser = existing ?? {
    id: `user_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    name: 'Google User',
    email: cleanEmail,
    provider: 'google',
    role: 'user',
    emailVerified: true,
    createdAt: new Date().toISOString(),
    isNewUser: true,
  };
  if (!existing) saveStoredUsers([...users, stripEphemeral(user)]);
  const publicUser = stripPassword(user);
  setCurrentUser(publicUser);
  return publicUser;
}

export function ensureMockAdminUser() {
  const users = loadStoredUsers().map((user) => ({
    ...user,
    role: user.email === 'admin@colony.local' ? ('developer' as UserRole) : user.role ?? ('user' as UserRole),
    emailVerified: user.email === 'admin@colony.local' ? true : user.emailVerified ?? user.provider === 'google',
    mockPassword: user.email === 'admin@colony.local' ? user.mockPassword ?? 'admin1234' : user.mockPassword,
  }));
  if (users.some((user) => user.email === 'admin@colony.local')) {
    saveStoredUsers(users);
    return;
  }
  const admin: StoredAuthUser = {
    id: 'admin_001',
    name: 'Developer',
    email: 'admin@colony.local',
    provider: 'email',
    role: 'developer',
    emailVerified: true,
    createdAt: new Date().toISOString(),
    mockPassword: 'admin1234',
  };
  saveStoredUsers([admin, ...users]);
}

export function loadVerificationCodes(): VerificationCode[] {
  try {
    const raw = localStorage.getItem(VERIFICATION_CODES_KEY);
    if (raw) return JSON.parse(raw) as VerificationCode[];
  } catch { /* ignore */ }
  return [];
}

function loadStoredUsers(): StoredAuthUser[] {
  try {
    const raw = localStorage.getItem(MOCK_USERS_KEY);
    if (raw) return JSON.parse(raw) as StoredAuthUser[];
  } catch { /* ignore */ }
  return [];
}

function saveStoredUsers(users: StoredAuthUser[]) {
  try { localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users)); } catch { /* ignore */ }
}

function saveVerificationCodes(codes: VerificationCode[]) {
  // TODO: Move verification codes to backend. Never store OTP codes in
  // frontend localStorage in production. Send codes via an email provider.
  try { localStorage.setItem(VERIFICATION_CODES_KEY, JSON.stringify(codes)); } catch { /* ignore */ }
}

function stripPassword(user: StoredAuthUser): AuthUser {
  const { mockPassword: _mockPassword, ...publicUser } = user;
  return publicUser;
}

function stripEphemeral(user: StoredAuthUser): StoredAuthUser {
  const { isNewUser: _isNewUser, ...storedUser } = user;
  return storedUser;
}
