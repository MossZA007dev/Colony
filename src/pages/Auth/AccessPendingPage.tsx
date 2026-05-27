import { ArrowRight, Lock } from 'lucide-react';
import type { Page } from '../../types/navigation';

const VIDEO_BG_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4';

export function AccessPendingPage({
  goTo,
  onSignOut,
  email,
  variant = 'restricted',
}: {
  goTo: (page: Page) => void;
  onSignOut?: () => void;
  email?: string;
  variant?: 'restricted' | 'on-waitlist';
}) {
  const goToEarlyAccess = () => {
    goTo('Landing');
    requestAnimationFrame(() => {
      document.getElementById('early-access')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const isWaitlist = variant === 'on-waitlist';

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#050508] px-5 text-white">
      <div className="pointer-events-none absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-15"
          src={VIDEO_BG_URL}
        />
        <div className="absolute inset-0 bg-[#050508]/80" />
        <div
          className="absolute left-1/2 top-0 h-[520px] w-[720px] -translate-x-1/2 rounded-full opacity-35"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,92,252,0.22) 0%, transparent 65%)' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-[460px] rounded-[24px] border border-white/[0.08] bg-white/[0.03] px-8 py-9 shadow-[0_32px_80px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-[12px] border border-white/[0.12] bg-white/[0.06] text-white/85">
            <Lock className="h-4 w-4" />
          </span>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">
            {isWaitlist ? "You're on the waitlist" : 'Private access only'}
          </p>
        </div>

        <h1 className="font-heading text-[26px] font-semibold leading-tight tracking-[-0.02em] text-white">
          {isWaitlist ? 'Thanks for your interest in Colony Bridge.' : 'Colony Bridge is in private prototype testing.'}
        </h1>

        <p className="mt-4 text-[14px] leading-relaxed text-white/65">
          {isWaitlist
            ? 'We are currently inviting a small number of pilot users. We will contact selected users when access is available.'
            : 'Access is currently available only to internal developers and selected pilot users. If you have not been invited yet, please request pilot access.'}
        </p>

        {email && (
          <p className="mt-4 rounded-[12px] border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[12px] text-white/55">
            Signed in as <span className="font-semibold text-white/85">{email}</span>
          </p>
        )}

        <div className="mt-7 flex flex-col gap-2">
          {!isWaitlist && (
            <button
              type="button"
              onClick={goToEarlyAccess}
              className="lp-btn-primary flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold"
            >
              Request Pilot Access
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => goTo('Landing')}
            className="lp-btn-secondary rounded-full px-6 py-3 text-[14px] font-medium"
          >
            Back to Website
          </button>
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="mt-1 rounded-full px-6 py-2 text-[12px] font-medium text-white/45 transition hover:text-white/80"
            >
              Sign out
            </button>
          )}
        </div>

        <p className="mt-6 text-[11px] leading-relaxed text-white/35">
          Authenticating identifies your account but does not grant product access. Access is enabled only after invitation.
        </p>
      </div>
    </div>
  );
}

export default AccessPendingPage;
