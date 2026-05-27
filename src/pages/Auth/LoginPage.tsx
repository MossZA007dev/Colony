import React, { useState } from 'react';
import { AlertTriangle, ArrowLeft, Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent } from '../../components/ui/Tabs';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as signOutFirebase,
} from 'firebase/auth';
import type { Page } from '../../types/navigation';
import {
  normalizeEmail,
  setCurrentUser,
  validateEmail,
  validatePassword,
  type AuthUser,
} from '../../lib/auth/mockAuth';
import { authUserFromFirebase, firebaseAuthMessage } from '../../lib/auth/firebaseAuthAdapter';
import { firebaseAuth } from '../../lib/firebase/client';
import {
  DEV_ADMIN_EMAIL,
  buildDevAdminUser,
  isDevAdminCredentials,
  isDevAuthEnabled,
} from '../../lib/auth/devAuth';
import { ACCESS_STAGE } from '../../lib/access/accessStage';

const VIDEO_BG_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4';

import './Auth.css';

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}

type AuthFieldErrors = Partial<Record<'email' | 'password' | 'confirmPassword' | 'code' | 'newPassword', string>>;

export function LoginPage({ goTo, onAuthed, initialMode = 'signin' }: { goTo: (page: Page) => void; onAuthed: (user: AuthUser) => void; initialMode?: 'signin' | 'signup' }) {
  const isInternalOnly = ACCESS_STAGE === 'waitlist_only';
  const [mode, setMode] = useState<'signin' | 'signup'>(isInternalOnly ? 'signin' : initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [loading, setLoading] = useState<null | 'email' | 'google' | 'resend'>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validate = () => {
    const next: AuthFieldErrors = {};
    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail) next.email = 'Email address is required.';
    else if (!validateEmail(cleanEmail)) next.email = 'Enter a valid email address.';

    if (!password) next.password = 'Password is required.';
    else if (mode === 'signup') {
      const passwordResult = validatePassword(password);
      if (!passwordResult.valid) next.password = passwordResult.message;
    }

    if (mode === 'signup') {
      if (!confirmPassword) next.confirmPassword = 'Confirm your password.';
      else if (confirmPassword !== password) next.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const runGoogle = async () => {
    setError('');
    setSuccess('');
    setFieldErrors({});
    setLoading('google');
    try {
      const credential = await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
      const isNewUser = Boolean(
        credential.user.metadata.creationTime
        && credential.user.metadata.lastSignInTime
        && credential.user.metadata.creationTime === credential.user.metadata.lastSignInTime,
      );
      const res = authUserFromFirebase(credential.user, isNewUser);
      setSuccess('Signed in with Google. Redirecting...');
      onAuthed(res);
    } catch (e) {
      setError(firebaseAuthMessage(e));
    } finally {
      setLoading(null);
    }
  };

  const submitEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    setError('');
    setSuccess('');
    setLoading('email');
    try {
      const cleanEmail = normalizeEmail(email);

      // ── DEV-only admin bypass ──────────────────────────────────────────────
      // In local development (vite dev) or when VITE_ENABLE_DEV_AUTH=true,
      // admin@colony.local + the configured dev password signs in directly as
      // an admin without going through Firebase. In production builds with
      // dev auth disabled, this branch is dead code: Firebase handles all
      // sign-ins and the email reveals nothing extra.
      // TODO(production): replace with backend-issued admin sessions.
      if (mode === 'signin' && cleanEmail === DEV_ADMIN_EMAIL) {
        if (isDevAuthEnabled()) {
          if (isDevAdminCredentials(cleanEmail, password)) {
            const devUser = buildDevAdminUser();
            setCurrentUser(devUser);
            setSuccess('Signed in. Redirecting…');
            onAuthed(devUser);
            return;
          }
          // Dev auth is enabled but the password is wrong — keep the message
          // generic and don't attempt Firebase for this specific email.
          setError('Incorrect email or password.');
          return;
        }
        if (import.meta.env.DEV) {
          // Helpful nudge only visible to developers; never reaches users.
          console.warn('[auth] Development admin auth is disabled. Enable dev auth (VITE_ENABLE_DEV_AUTH=true) or use the configured provider.');
        }
        // Fall through to Firebase, which will fail naturally — no enumeration.
      }

      if (mode === 'signup') {
        const credential = await createUserWithEmailAndPassword(firebaseAuth, cleanEmail, password);
        await sendEmailVerification(credential.user, {
          url: `${window.location.origin}/verify-email?email=${encodeURIComponent(cleanEmail)}`,
        });
        setSuccess(`We sent a Firebase verification link to ${cleanEmail}. Open it, then sign in.`);
        goTo('VerifyEmail');
        window.history.replaceState({}, '', `/verify-email?email=${encodeURIComponent(cleanEmail)}`);
        return;
      }

      const credential = await signInWithEmailAndPassword(firebaseAuth, cleanEmail, password);
      await credential.user.reload();
      if (!credential.user.emailVerified) {
        setUnverifiedEmail(cleanEmail);
        await signOutFirebase(firebaseAuth);
        setError('Please verify your email before signing in.');
        return;
      }
      const user = authUserFromFirebase(credential.user);
      setSuccess('Signed in. Redirecting...');
      onAuthed(user);
    } catch (e) {
      setError(firebaseAuthMessage(e));
    } finally {
      setLoading(null);
    }
  };

  const resendCode = async () => {
    const cleanEmail = normalizeEmail(email || unverifiedEmail);
    if (!cleanEmail) return;
    setError('');
    setSuccess('');
    setLoading('resend');
    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, cleanEmail, password);
      await sendEmailVerification(credential.user, {
        url: `${window.location.origin}/verify-email?email=${encodeURIComponent(cleanEmail)}`,
      });
      await signOutFirebase(firebaseAuth);
      setSuccess(`We sent a new Firebase verification link to ${cleanEmail}.`);
    } catch (e) {
      setError(password ? firebaseAuthMessage(e) : 'Enter your password, then resend the verification email.');
    } finally {
      setLoading(null);
    }
  };

  const goToMode = (nextMode: 'signin' | 'signup') => {
    if (nextMode === mode) return;
    setMode(nextMode);
    goTo(nextMode === 'signup' ? 'CreateAccount' : 'Login');
    setError('');
    setSuccess('');
    setFieldErrors({});
    setConfirmPassword('');
    setUnverifiedEmail('');
  };


  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#050508] px-5 text-white overflow-hidden">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <video autoPlay loop muted playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-20"
          src={VIDEO_BG_URL}
        />
        <div className="absolute inset-0 bg-[#050508]/75" />
        {/* Violet glow top-center */}
        <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full opacity-40"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,92,252,0.25) 0%, transparent 65%)' }} />
        {/* Blue glow bottom */}
        <div className="absolute bottom-0 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full opacity-30"
          style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(79,158,255,0.18) 0%, transparent 65%)' }} />
      </div>

      {/* Back to landing */}
      <button onClick={() => goTo('Landing')} className="relative z-10 mb-8 flex items-center gap-2 text-white/40 transition hover:text-white/70">
        <ArrowLeft className="h-3.5 w-3.5" />
        <span className="text-[13px]">Back to Colony</span>
      </button>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[420px] rounded-2xl border border-white/[0.08] bg-white/[0.03] px-8 py-9 shadow-[0_32px_80px_rgba(0,0,0,0.6)] backdrop-blur-2xl">

        {/* Logo */}
        <div className="mb-7 flex flex-col items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl blur-xl opacity-60" style={{ background: 'radial-gradient(circle, rgba(124,92,252,0.6) 0%, transparent 70%)', transform: 'scale(1.8)' }} />
            <div className="relative flex items-center justify-center">
              <img src="/assets/logos/Colony white no have text.png" width={96} height={96} alt="Colony" draggable={false} />
            </div>
          </div>
        </div>

        {isInternalOnly ? (
          <div className="mb-6">
            <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">
              Colony Bridge Internal
            </p>
            <h1 className="mb-2 text-center font-heading text-[26px] font-semibold leading-tight tracking-[-0.02em] text-white">
              Developer Access
            </h1>
            <p className="mx-auto max-w-[320px] text-center text-[13px] leading-relaxed text-white/45">
              This workspace is currently restricted to internal developers and invited pilot users.
            </p>
          </div>
        ) : (
          <Tabs value={mode} onValueChange={(v) => goToMode(v as 'signin' | 'signup')}>
            <TabsList className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-white/[0.08] bg-white/[0.025] p-1">
              <TabsTrigger
                value="signin"
                className="rounded-lg px-3 py-2 text-[13px] font-semibold text-white/55 transition-colors data-[state=active]:text-white"
                highlightClassName="absolute inset-0 -z-10 rounded-lg bg-white/[0.07] shadow-[0_4px_18px_rgba(124,92,252,0.18)] ring-1 ring-white/[0.10]"
              >
                Sign in
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="rounded-lg px-3 py-2 text-[13px] font-semibold text-white/55 transition-colors data-[state=active]:text-white"
                highlightClassName="absolute inset-0 -z-10 rounded-lg bg-white/[0.07] shadow-[0_4px_18px_rgba(124,92,252,0.18)] ring-1 ring-white/[0.10]"
              >
                Create account
              </TabsTrigger>
            </TabsList>

            <TabsContents className="mb-6">
              <TabsContent value="signin">
                <h1 className="mb-1 text-center font-heading text-[26px] font-semibold leading-tight tracking-[-0.02em] text-white">
                  Welcome back
                </h1>
                <p className="text-center text-[14px] text-white/40">
                  Sign in to command AI Ant and your AI workforce.
                </p>
              </TabsContent>
              <TabsContent value="signup">
                <h1 className="mb-1 text-center font-heading text-[26px] font-semibold leading-tight tracking-[-0.02em] text-white">
                  Create your account
                </h1>
                <p className="text-center text-[14px] text-white/40">
                  Start building your AI workforce in minutes.
                </p>
              </TabsContent>
            </TabsContents>
          </Tabs>
        )}

        <>
        {/* Google button */}
        <button
          disabled={loading !== null}
          onClick={runGoogle}
          className="mb-4 flex w-full items-center justify-center gap-3 rounded-xl border !border-white !bg-white py-3 text-[14px] font-semibold !text-[#070B14] shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition hover:!bg-white/95 disabled:opacity-60"
        >
          {loading === 'google' ? <Loader2 className="h-4 w-4 animate-spin text-gray-500" /> : <GoogleGlyph />}
          {loading === 'google' ? 'Connecting to Google...' : 'Continue with Google'}
        </button>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-white/[0.08]" />
          <span className="text-[11px] uppercase tracking-widest text-white/25">or</span>
          <span className="h-px flex-1 bg-white/[0.08]" />
        </div>

        {/* Email form */}
        <form onSubmit={submitEmail} className="space-y-3">
          <div>
            <input
              value={email} onChange={(e) => setEmail(e.target.value)}
              disabled={loading !== null}
              type="email" autoComplete="email" placeholder="Email address"
              className={`w-full rounded-xl border bg-white/[0.04] px-4 py-3 text-[14px] text-white placeholder-white/25 outline-none transition disabled:opacity-60 ${fieldErrors.email ? 'border-red-400/45 focus:border-red-400/60 focus:ring-2 focus:ring-red-400/10' : 'border-white/[0.09] focus:border-[#7c5cfc]/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-[#7c5cfc]/10'}`}
            />
            {fieldErrors.email && <p className="mt-1.5 px-1 text-[11px] text-red-300">{fieldErrors.email}</p>}
          </div>
          <div>
            <div className={`flex items-center rounded-xl border bg-white/[0.04] pr-3 transition ${fieldErrors.password ? 'border-red-400/45 focus-within:border-red-400/60 focus-within:ring-2 focus-within:ring-red-400/10' : 'border-white/[0.09] focus-within:border-[#7c5cfc]/50 focus-within:bg-white/[0.06] focus-within:ring-2 focus-within:ring-[#7c5cfc]/10'}`}>
              <input
                value={password} onChange={(e) => setPassword(e.target.value)}
                disabled={loading !== null}
                type={showPassword ? 'text' : 'password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder="Password"
                className="min-w-0 flex-1 bg-transparent px-4 py-3 text-[14px] text-white placeholder-white/25 outline-none disabled:opacity-60"
              />
              <button type="button" disabled={loading !== null} onClick={() => setShowPassword((shown) => !shown)} className="grid h-8 w-8 place-items-center rounded-lg text-white/35 transition hover:bg-white/[0.06] hover:text-white/70 disabled:opacity-50" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password && <p className="mt-1.5 px-1 text-[11px] text-red-300">{fieldErrors.password}</p>}
          </div>
          {mode === 'signup' && (
            <div>
              <div className={`flex items-center rounded-xl border bg-white/[0.04] pr-3 transition ${fieldErrors.confirmPassword ? 'border-red-400/45 focus-within:border-red-400/60 focus-within:ring-2 focus-within:ring-red-400/10' : 'border-white/[0.09] focus-within:border-[#7c5cfc]/50 focus-within:bg-white/[0.06] focus-within:ring-2 focus-within:ring-[#7c5cfc]/10'}`}>
                <input
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading !== null}
                  type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Confirm password"
                  className="min-w-0 flex-1 bg-transparent px-4 py-3 text-[14px] text-white placeholder-white/25 outline-none disabled:opacity-60"
                />
                <button type="button" disabled={loading !== null} onClick={() => setShowConfirmPassword((shown) => !shown)} className="grid h-8 w-8 place-items-center rounded-lg text-white/35 transition hover:bg-white/[0.06] hover:text-white/70 disabled:opacity-50" aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}>
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && <p className="mt-1.5 px-1 text-[11px] text-red-300">{fieldErrors.confirmPassword}</p>}
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/[0.07] px-3.5 py-2.5">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
              <div className="min-w-0">
                <p className="text-[12px] leading-relaxed text-red-300">{error}</p>
                {unverifiedEmail && (
                  <button type="button" onClick={resendCode} className="mt-2 text-[12px] font-semibold text-red-100 underline underline-offset-2">
                    Resend verification email
                  </button>
                )}
              </div>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] px-3.5 py-2.5">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
              <p className="text-[12px] leading-relaxed text-emerald-200">{success}</p>
            </div>
          )}
          <button
            type="submit" disabled={loading !== null}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7c5cfc] py-3 text-[14px] font-semibold text-white shadow-[0_0_24px_rgba(124,92,252,0.35)] transition hover:bg-[#6d4ef0] hover:shadow-[0_0_32px_rgba(124,92,252,0.5)] disabled:opacity-60"
          >
            {loading === 'email' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading === 'email' ? (mode === 'signup' ? 'Creating account...' : 'Signing in...') : (mode === 'signin' ? 'Sign in' : 'Create account')}
          </button>
        </form>

        {/* Footer links */}
        <div className="mt-5 flex items-center justify-center text-[13px]">
          <button onClick={() => goTo('ForgotPassword')} className="text-white/35 transition hover:text-white/65">Forgot password?</button>
        </div>

        {isInternalOnly && (
          <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">Not part of the internal team?</p>
            <button
              type="button"
              onClick={() => {
                goTo('Landing');
                requestAnimationFrame(() => {
                  document.getElementById('early-access')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
              }}
              className="mt-1.5 text-[13px] font-semibold text-[#bcd9ff] underline-offset-2 transition hover:text-white hover:underline"
            >
              Request Early Access →
            </button>
          </div>
        )}

        {/* Terms */}
        <p className="mt-6 text-center text-[11px] leading-relaxed text-white/20">
          By continuing, you agree to Colony's{' '}
          <span className="cursor-pointer underline underline-offset-2 hover:text-white/40">Terms of Service</span>
          {' '}and{' '}
          <span className="cursor-pointer underline underline-offset-2 hover:text-white/40">Privacy Policy</span>
        </p>
        </>
      </div>
    </div>
  );
}
