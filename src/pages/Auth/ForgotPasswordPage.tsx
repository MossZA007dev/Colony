import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { AlertTriangle, ArrowLeft, Check, Loader2 } from 'lucide-react';
import type { Page } from '../../types/navigation';
import { normalizeEmail, validateEmail } from '../../lib/auth/mockAuth';
import { firebaseAuthMessage } from '../../lib/auth/firebaseAuthAdapter';
import { firebaseAuth } from '../../lib/firebase/client';

const VIDEO_BG_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4';

import './Auth.css';

export function ForgotPasswordPage({ goTo }: { goTo: (page: Page) => void }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldError, setFieldError] = useState('');

  const requestReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setFieldError('');
    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail) {
      setFieldError('Email address is required.');
      return;
    }
    if (!validateEmail(cleanEmail)) {
      setFieldError('Enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(firebaseAuth, cleanEmail, {
        url: `${window.location.origin}/signin`,
      });
      setSuccess(`Firebase sent a password reset link to ${cleanEmail}.`);
    } catch (e) {
      setError(firebaseAuthMessage(e));
    } finally {
      setLoading(false);
    }
  };

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
          <img src="/assets/logos/Colony white no have text.png" width={80} height={80} alt="Colony" draggable={false} />
        </div>
        <h1 className="mb-1 text-center font-heading text-[26px] font-semibold leading-tight tracking-[-0.02em] text-white">Reset your password</h1>
        <p className="mb-7 text-center text-[14px] text-white/40">Enter your email and Firebase will send a reset link.</p>

        <form onSubmit={requestReset} className="space-y-3">
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={loading}
            type="email"
            autoComplete="email"
            placeholder="Email address"
            className={`w-full rounded-xl border bg-white/[0.04] px-4 py-3 text-[14px] text-white placeholder-white/25 outline-none transition disabled:opacity-60 ${fieldError ? 'border-red-400/45 focus:border-red-400/60 focus:ring-2 focus:ring-red-400/10' : 'border-white/[0.09] focus:border-[#7c5cfc]/50 focus:ring-2 focus:ring-[#7c5cfc]/10'}`}
          />
          {fieldError && <p className="mt-1.5 px-1 text-[11px] text-red-300">{fieldError}</p>}
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/[0.07] px-3.5 py-2.5">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
              <p className="text-[12px] leading-relaxed text-red-300">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] px-3.5 py-2.5">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
              <p className="text-[12px] leading-relaxed text-emerald-200">{success}</p>
            </div>
          )}
          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7c5cfc] py-3 text-[14px] font-semibold text-white shadow-[0_0_24px_rgba(124,92,252,0.35)] transition hover:bg-[#6d4ef0] disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      </div>
    </div>
  );
}
