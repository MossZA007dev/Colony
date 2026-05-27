// Public-website access stage configuration.
//
// SECURITY NOTE: This file controls landing-page COPY and NAV VISIBILITY only.
// It MUST NOT be treated as an access-control mechanism. Real product gating
// must be enforced server-side via an `accessStatus` field on the user record
// (`waitlisted | invited | active_pilot | internal | suspended`). Hiding the
// sign-in link in the navbar does not prevent anyone from typing /signin
// directly — backend route guards are required before the product can be
// publicly indexed.
//
// To advance the public stage, change ACCESS_STAGE below.

export type AccessStage = 'waitlist_only' | 'private_pilot' | 'limited_beta' | 'public';

export const ACCESS_STAGE: AccessStage = 'waitlist_only';

export type AccessStageUi = {
  showPublicSignIn: boolean;
  signInLabel: string;
  primaryCta: string;
  availabilityText: string;
};

export const accessStageUi: Record<AccessStage, AccessStageUi> = {
  waitlist_only: {
    showPublicSignIn: false,
    signInLabel: 'Sign In',
    primaryCta: 'Request Early Access',
    availabilityText: 'Early prototype · Access available by invitation only',
  },
  private_pilot: {
    showPublicSignIn: true,
    signInLabel: 'Pilot Sign In',
    primaryCta: 'Request Early Access',
    availabilityText: 'Private pilot · Invitation required',
  },
  limited_beta: {
    showPublicSignIn: true,
    signInLabel: 'Sign In',
    primaryCta: 'Join Beta',
    availabilityText: 'Limited beta now open',
  },
  public: {
    showPublicSignIn: true,
    signInLabel: 'Sign In',
    primaryCta: 'Get Started',
    availabilityText: '',
  },
};

export const currentAccessStageUi = accessStageUi[ACCESS_STAGE];
