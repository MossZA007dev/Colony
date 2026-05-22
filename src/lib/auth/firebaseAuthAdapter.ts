import type { User as FirebaseUser } from 'firebase/auth';
import { setCurrentUser, type AuthUser } from './mockAuth';

export function authUserFromFirebase(user: FirebaseUser, isNewUser = false): AuthUser {
  const authUser: AuthUser = {
    id: user.uid,
    email: user.email ?? '',
    name: user.displayName ?? undefined,
    provider: user.providerData.some((provider) => provider.providerId === 'google.com') ? 'google' : 'email',
    role: 'user',
    emailVerified: user.emailVerified,
    createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime).toISOString() : new Date().toISOString(),
    isNewUser,
  };
  setCurrentUser(authUser);
  return authUser;
}

export function firebaseAuthMessage(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: string }).code) : '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was closed before it finished.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    default:
      return error instanceof Error ? error.message : 'Something went wrong.';
  }
}
