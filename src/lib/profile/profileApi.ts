// Profile + identity helpers.
// Extracted from src/App.tsx as part of Phase 2 of the file split refactor.
// Behavior is byte-for-byte identical.

import type { FeatureName, UserRole } from '../admin/adminTypes';
import type { UsageFeature } from '../billing/types';
import { isDeveloperOrAdmin } from '../auth/roles';
import { normalizeEmail } from '../auth/mockAuth';
import { getMockUserByEmail } from '../mock/mockUsers';
import type { UserProfile } from '../types/appTypes';

export const ONBOARDING_KEY = 'colony.profile.v1';

export function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    if (raw) {
      const profile = JSON.parse(raw) as Partial<UserProfile>;
      return { name: profile.name ?? 'You', email: profile.email ?? '', role: profile.role ?? 'user', emailVerified: Boolean(profile.emailVerified), onboarded: Boolean(profile.onboarded), answers: profile.answers ?? {} };
    }
  } catch { /* ignore */ }
  return { name: 'You', email: '', role: 'user', emailVerified: false, onboarded: false, answers: {} };
}

export function saveProfile(p: UserProfile) {
  try { localStorage.setItem(ONBOARDING_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

export function getApiBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return (configured || (import.meta.env.DEV ? 'http://localhost:8000' : '')).replace(/\/$/, '') || null;
}

// Backwards-compat alias — prefer the typed helpers in src/lib/auth/roles.ts.
export function isAdminRole(role?: UserRole) {
  return isDeveloperOrAdmin({ role });
}

export function resolveBackendUserId(profile?: Pick<UserProfile, 'email' | 'role'> | null) {
  const byEmail = profile?.email ? getMockUserByEmail(profile.email) : null;
  if (byEmail) return byEmail.id;
  if (profile?.role === 'admin' || profile?.role === 'developer') return 'admin_001';
  return 'usr_003';
}

export function resolveSurveyUserId(profile?: Pick<UserProfile, 'email' | 'role'> | null) {
  return profile?.email ? normalizeEmail(profile.email) : resolveBackendUserId(profile);
}

export function usageFeatureToAdminFeature(feature: UsageFeature): FeatureName {
  if (feature === 'connector') return 'connected_workspace';
  if (feature === 'image') return 'image_generation';
  if (feature === 'video') return 'video_generation';
  if (feature === 'tts') return 'tts_generation';
  if (feature === 'automation') return 'workflow';
  return feature;
}
