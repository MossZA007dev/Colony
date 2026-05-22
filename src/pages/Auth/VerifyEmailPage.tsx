import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, Loader2, Mail } from 'lucide-react';
import type { Page } from '../../types/navigation';
import { normalizeEmail, validateEmail, wait, type AuthUser } from '../../lib/auth/mockAuth';
import { authUserFromFirebase } from '../../lib/auth/firebaseAuthAdapter';
import { firebaseAuth } from '../../lib/firebase/client';

const VIDEO_BG_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4';

import './Auth.css';

type VerifyStatus = 'idle' | 'checking' | 'verified' | 'pending' | 'missing';

export function VerifyEmailPage({ goTo, onAuthed }: { goTo: (page: Page) => void; onAuthed: (user: AuthUser) => void }) {
  const [email, setEmail] = useState(new URLSearchParams(window.location.search).get('email') ?? '');
  const [status, setStatus] = useState<VerifyStatus>('idle');
  const [message, setMessage] = useState('');

  const checkStatus = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const cleanEmail = normalizeEmail(email);
    setMessage('');
    if (!cleanEmail || !validateEmail(cleanEmail)) {
      setStatus('missing');
      setMessage('Enter the email you used to create your account.');
      return;
    }

    setStatus('checking');
    const currentUser = firebaseAuth.currentUser;
    if (currentUser?.email && normalizeEmail(currentUser.email) === cleanEmail) {
      await currentUser.reload();
      if (currentUser.emailVerified) {
        const user = authUserFromFirebase(currentUser);
        setStatus('verified');
        setMessage('Email verified. Moving you to onboarding...');
        onAuthed({ ...user, isNewUser: true });
        return;
      }
      setStatus('pending');
      setMessage('Your email is still waiting for Firebase verification. Open the verification link in your inbox, then check again.');
      return;
    }

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
    if (!apiBaseUrl) {
      await wait(500);
      setStatus('pending');
      setMessage('Backend API is not connected yet. Set VITE_API_BASE_URL to check Firebase verification status.');
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/auth/email-status/${encodeURIComponent(cleanEmail)}`);
      if (!response.ok) throw new Error('Unable to check this email right now.');
      const result = await response.json() as { exists: boolean; email_verified: boolean };
      if (!result.exists) {
        setStatus('missing');
        setMessage('No account was found for this email.');
        return;
      }
      if (!result.email_verified) {
        setStatus('pending');
        setMessage('Your email is still waiting for Firebase verification. Open the verification link in your inbox, then check again.');
        return;
      }
      setStatus('verified');
      setMessage('Email verified. Sign in once to continue onboarding.');
    } catch (error) {
      setStatus('pending');
      setMessage(error instanceof Error ? error.message : 'Unable to check this email right now.');
    }
  };

  useEffect(() => {
    if (email) void checkStatus();
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#050508] px-5 text-white">
      <div className="pointer-events-none absolute inset-0 z-0">
        <video autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover opacity-20" src={VIDEO_BG_URL} />
        <div className="absolute inset-0 bg-[#050508]/75" />
        <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full opacity-40" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,92,252,0.25) 0%, transparent 65%)' }} />
      </div>

      <button onClick={() => goTo('Login')} className="relative z-10 mb-8 flex items-center gap-2 text-white/40 transition hover:text-white/70">
        <ArrowLeft className="h-3.5 w-3.5" />
        <span className="text-[13px]">Back to sign in</span>
      </button>

      <div className="relative z-10 w-full max-w-[420px] rounded-2xl border border-white/[0.08] bg-white/[0.03] px-8 py-9 shadow-[0_32px_80px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
        <div className="mb-7 flex justify-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.04]">
            <Mail className="h-7 w-7 text-white/80" />
          </div>
        </div>
        <h1 className="mb-1 text-center font-heading text-[26px] font-semibold leading-tight tracking-[-0.02em] text-white">Verify your email</h1>
        <p className="mb-7 text-center text-[14px] leading-relaxed text-white/40">
          Open the Firebase verification link sent to your inbox, then check your status here.
        </p>

        <form onSubmit={checkStatus} className="space-y-3">
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={status === 'checking'}
            type="email"
            autoComplete="email"
            placeholder="Email address"
            className="w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-3 text-[14px] text-white placeholder-white/25 outline-none transition focus:border-[#7c5cfc]/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-[#7c5cfc]/10 disabled:opacity-60"
          />
          {message && (
            <div className={`flex items-start gap-2 rounded-xl border px-3.5 py-2.5 ${status === 'verified' ? 'border-emerald-400/20 bg-emerald-400/[0.07]' : 'border-amber-300/20 bg-amber-300/[0.07]'}`}>
              {status === 'verified' ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" /> : <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-200" />}
              <p className={`text-[12px] leading-relaxed ${status === 'verified' ? 'text-emerald-200' : 'text-amber-100/85'}`}>{message}</p>
            </div>
          )}
          <button type="submit" disabled={status === 'checking'} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7c5cfc] py-3 text-[14px] font-semibold text-white shadow-[0_0_24px_rgba(124,92,252,0.35)] transition hover:bg-[#6d4ef0] disabled:opacity-60">
            {status === 'checking' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {status === 'checking' ? 'Checking...' : 'Check verification'}
          </button>
          <button type="button" onClick={() => goTo('Login')} className="w-full py-2 text-[13px] text-white/45 transition hover:text-white/75">
            Continue to sign in
          </button>
        </form>
      </div>
    </div>
  );
}
