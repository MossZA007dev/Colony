import React, { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as signOutFirebase } from 'firebase/auth';
import { LoginPage, ForgotPasswordPage, VerifyEmailPage, AccessPendingPage } from './pages/Auth';
import { OnboardingPage } from './pages/OnboardingPage';
import { GlobalBackgroundVideo, LandingPage } from './pages/LandingPage';
import {
  ProductPage as MarketingProductPage,
  HowItWorksPage as MarketingHowItWorksPage,
  FeaturesPage as MarketingFeaturesPage,
  PricingPage as MarketingPricingPage,
  RoadmapPage as MarketingRoadmapPage,
  AboutPage as MarketingAboutPage,
  EarlyAccessPage as MarketingEarlyAccessPage,
  PrivacyPage as MarketingPrivacyPage,
  TermsPage as MarketingTermsPage,
  AIAntPage as MarketingAIAntPage,
  ColonyCrewPage as MarketingColonyCrewPage,
  OneManEnterprisePage as MarketingOneManEnterprisePage,
  AutomationPage as MarketingAutomationPage,
  ColonyBridgePage as MarketingColonyBridgePage,
} from './pages/marketing';
import { AppShell } from './shell/AppShell';
import { CreateAgentTeam } from './pages/create-agent-team/CreateAgentTeam';
import { AIAntPage } from './pages/ai-ant/AIAntPage';
import { ensureMockAdminUser, getCurrentUser, signOut as signOutMock } from './lib/auth/mockAuth';
import type { AuthUser } from './lib/auth/mockAuth';
import { canAccessApp } from './lib/auth/roles';
import { authUserFromFirebase } from './lib/auth/firebaseAuthAdapter';
import { firebaseAuth } from './lib/firebase/client';
import { pageFromPath, pathFromPage } from './lib/navigation/routes';
import { getApiBaseUrl, loadProfile, resolveSurveyUserId, saveProfile } from './lib/profile/profileApi';
import type { Page } from './types/navigation';
import type { UserProfile } from './lib/types/appTypes';
export type { AppDeliverable, WorkspaceChat, WorkspaceProject } from './lib/types/appTypes';

async function hasSurveySubmission(userId: string) {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) return false;
  try {
    const response = await fetch(`${apiBaseUrl}/surveys/users/${encodeURIComponent(userId)}/status`);
    if (!response.ok) return false;
    const data = await response.json() as { submitted?: boolean };
    return Boolean(data.submitted);
  } catch { /* ignore unavailable backend */ }
  return false;
}

async function saveSurveySubmission(userId: string, answers: Record<string, string>) {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) return;
  try {
    await fetch(`${apiBaseUrl}/surveys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, answers }),
    });
  } catch { /* ignore unavailable backend */ }
}

// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPageState] = useState<Page>(() => pageFromPath(window.location.pathname));
  const [authChecked, setAuthChecked] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(() => {
    const savedProfile = loadProfile();
    ensureMockAdminUser();
    const session = getCurrentUser();
    return session ? { ...savedProfile, email: session.email, name: session.name || savedProfile.name, role: session.role ?? savedProfile.role, emailVerified: session.emailVerified } : savedProfile;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('theme-dark');
  }, []);

  useEffect(() => {
    const onPopState = () => setPageState(pageFromPath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const setPage = useCallback((next: Page) => {
    setPageState(next);
    const path = pathFromPage(next);
    if (window.location.pathname !== path) window.history.pushState({}, '', path);
  }, []);

  const updateProfile = (next: UserProfile) => {
    setProfile(next);
    saveProfile(next);
  };

  // After auth: gate by canAccessApp first. Developers/admins (and, once the
  // backend lands accessStatus, active pilots) proceed to the app. Everyone
  // else is routed to AccessPending. First-time approved users see onboarding.
  //
  // TODO(BACKEND-ACCESS-GATE): this is a frontend convenience only. The API
  // must independently refuse non-approved users; see canAccessApp() comment.
  const handleAuthed = async (user: AuthUser) => {
    const isSameProfile = profile.email === user.email;
    const keepExistingOnboarding = isSameProfile && profile.onboarded;
    const next = {
      ...profile,
      email: user.email,
      name: user.name || (isSameProfile ? profile.name : '') || user.email.split('@')[0] || 'You',
      role: user.role ?? 'user',
      emailVerified: user.emailVerified,
      onboarded: keepExistingOnboarding || (!user.isNewUser && isSameProfile ? profile.onboarded : false),
      answers: keepExistingOnboarding || (!user.isNewUser && isSameProfile) ? profile.answers : {},
    };
    const hasSavedSurvey = next.onboarded ? false : await hasSurveySubmission(resolveSurveyUserId(next));
    if (hasSavedSurvey) next.onboarded = true;
    updateProfile(next);
    if (!canAccessApp({ role: next.role })) {
      setPage('AccessPending');
      return;
    }
    setPage(next.onboarded ? 'AI Ant' : 'Onboarding');
  };

  const completeOnboarding = async (answers: Record<string, string>) => {
    const next = { ...profile, onboarded: true, answers };
    updateProfile(next);
    await saveSurveySubmission(resolveSurveyUserId(next), answers);
    setPage('AI Ant');
  };

  // ── Sign-out / Switch-account ──────────────────────────────────────────────
  // Clears Firebase session, mock local session, and resets the in-memory
  // profile so protected routes can't be re-entered from stale state. The
  // saved onboarding profile in localStorage is also wiped — refreshing the
  // tab after a logout returns to the sign-in page.
  const handleSignOut = useCallback(async () => {
    try { await signOutFirebase(firebaseAuth); } catch { /* ignore */ }
    signOutMock();
    const cleared: UserProfile = { name: 'You', email: '', role: 'user', emailVerified: false, onboarded: false, answers: {} };
    setProfile(cleared);
    saveProfile(cleared);
    setPage('Login');
  }, [setPage]);

  // Switch account == sign out + land on Login so another account can sign in.
  // Project data lives independently of the user session (workspace storage),
  // so it's not wiped here.
  const handleSwitchAccount = handleSignOut;

  const MARKETING_PAGE_LIST: Page[] = [
    'MarketingProduct',
    'MarketingHowItWorks',
    'MarketingFeatures',
    'MarketingFeatureAIAnt',
    'MarketingFeatureColonyCrew',
    'MarketingFeatureOneManEnterprise',
    'MarketingFeatureAutomation',
    'MarketingFeatureColonyBridge',
    'MarketingPricing',
    'MarketingRoadmap',
    'MarketingAbout',
    'MarketingEarlyAccess',
    'MarketingPrivacy',
    'MarketingTerms',
  ];
  const isMarketingPage = MARKETING_PAGE_LIST.includes(page);
  const publicPages: Page[] = ['Landing', 'Login', 'CreateAccount', 'VerifyEmail', 'ForgotPassword', 'AccessPending', ...MARKETING_PAGE_LIST];
  const needsAuth = !publicPages.includes(page) && (!profile.email || !profile.emailVerified);
  // TODO(BACKEND-ACCESS-GATE): mirror this check on every API route.
  const authedButUnauthorized =
    !!profile.email && profile.emailVerified && !canAccessApp({ role: profile.role }) && !isMarketingPage;

  useEffect(() => {
    let cancelled = false;
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (!firebaseUser) {
        if (!cancelled) setAuthChecked(true);
        return;
      }
      await firebaseUser.reload();
      if (!firebaseUser.emailVerified) {
        if (!cancelled) setAuthChecked(true);
        return;
      }
      const restoredUser = authUserFromFirebase(firebaseUser, false);
      if (!cancelled) {
        await handleAuthed(restoredUser);
        setAuthChecked(true);
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  if (!authChecked) {
    return (
      <div className="relative min-h-screen overflow-x-hidden bg-background text-ink">
        <GlobalBackgroundVideo />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-ink">
      <GlobalBackgroundVideo />
      <div className="relative z-10">
        {needsAuth && <LoginPage goTo={setPage} onAuthed={handleAuthed} />}
        {page === 'Landing' && <LandingPage goTo={setPage} />}
        {page === 'Login' && <LoginPage goTo={setPage} onAuthed={handleAuthed} />}
        {page === 'CreateAccount' && <LoginPage goTo={setPage} onAuthed={handleAuthed} initialMode="signup" />}
        {page === 'VerifyEmail' && <VerifyEmailPage goTo={setPage} onAuthed={handleAuthed} />}
        {page === 'ForgotPassword' && <ForgotPasswordPage goTo={setPage} />}
        {page === 'AccessPending' && (
          <AccessPendingPage goTo={setPage} onSignOut={handleSignOut} email={profile.email || undefined} />
        )}
        {page === 'MarketingProduct' && <MarketingProductPage goTo={setPage} currentPage={page} />}
        {page === 'MarketingHowItWorks' && <MarketingHowItWorksPage goTo={setPage} currentPage={page} />}
        {page === 'MarketingFeatures' && <MarketingFeaturesPage goTo={setPage} currentPage={page} />}
        {page === 'MarketingFeatureAIAnt' && <MarketingAIAntPage goTo={setPage} currentPage={page} />}
        {page === 'MarketingFeatureColonyCrew' && <MarketingColonyCrewPage goTo={setPage} currentPage={page} />}
        {page === 'MarketingFeatureOneManEnterprise' && <MarketingOneManEnterprisePage goTo={setPage} currentPage={page} />}
        {page === 'MarketingFeatureAutomation' && <MarketingAutomationPage goTo={setPage} currentPage={page} />}
        {page === 'MarketingFeatureColonyBridge' && <MarketingColonyBridgePage goTo={setPage} currentPage={page} />}
        {page === 'MarketingPricing' && <MarketingPricingPage goTo={setPage} currentPage={page} />}
        {page === 'MarketingRoadmap' && <MarketingRoadmapPage goTo={setPage} currentPage={page} />}
        {page === 'MarketingAbout' && <MarketingAboutPage goTo={setPage} currentPage={page} />}
        {page === 'MarketingEarlyAccess' && <MarketingEarlyAccessPage goTo={setPage} currentPage={page} />}
        {page === 'MarketingPrivacy' && <MarketingPrivacyPage goTo={setPage} currentPage={page} />}
        {page === 'MarketingTerms' && <MarketingTermsPage goTo={setPage} currentPage={page} />}
        {authedButUnauthorized && page !== 'AccessPending' && page !== 'Landing' && page !== 'Login' && page !== 'CreateAccount' && page !== 'VerifyEmail' && page !== 'ForgotPassword' && !isMarketingPage && (
          <AccessPendingPage goTo={setPage} onSignOut={handleSignOut} email={profile.email || undefined} />
        )}
        {!needsAuth && !authedButUnauthorized && !isMarketingPage && page === 'Onboarding' && (
          <OnboardingPage
            onComplete={completeOnboarding}
            onSkip={() => completeOnboarding(profile.answers)}
          />
        )}
        {!needsAuth && !authedButUnauthorized && !isMarketingPage && page !== 'Landing' && page !== 'Login' && page !== 'CreateAccount' && page !== 'VerifyEmail' && page !== 'ForgotPassword' && page !== 'Onboarding' && page !== 'AccessPending' && (
          <AppShell page={page} setPage={setPage} profile={profile} onSignOut={handleSignOut} onSwitchAccount={handleSwitchAccount} AIAntPageComponent={AIAntPage} CreateAgentTeamComponent={CreateAgentTeam} />
        )}
      </div>
    </div>
  );
}

