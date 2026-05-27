import type { Page } from '../../types/navigation';

export function pageFromPath(pathname: string): Page {
  if (pathname.startsWith('/admin')) return 'Admin';
  if (pathname === '/create-account' || pathname === '/signup') return 'CreateAccount';
  if (pathname === '/verify-email') return 'VerifyEmail';
  if (pathname === '/login' || pathname === '/signin' || pathname === '/internal/sign-in') return 'Login';
  if (pathname === '/forgot-password') return 'ForgotPassword';
  if (pathname === '/onboarding') return 'Onboarding';
  if (pathname === '/access-pending') return 'AccessPending';
  if (pathname === '/ai-ant') return 'AI Ant';
  if (pathname === '/product') return 'MarketingProduct';
  if (pathname === '/how-it-works') return 'MarketingHowItWorks';
  if (pathname === '/features') return 'MarketingFeatures';
  if (pathname === '/features/ai-ant') return 'MarketingFeatureAIAnt';
  if (pathname === '/features/colony-crew') return 'MarketingFeatureColonyCrew';
  if (pathname === '/features/one-man-enterprise') return 'MarketingFeatureOneManEnterprise';
  if (pathname === '/features/automation') return 'MarketingFeatureAutomation';
  if (pathname === '/features/colony-bridge') return 'MarketingFeatureColonyBridge';
  if (pathname === '/pricing') return 'MarketingPricing';
  if (pathname === '/roadmap') return 'MarketingRoadmap';
  if (pathname === '/about') return 'MarketingAbout';
  if (pathname === '/early-access') return 'MarketingEarlyAccess';
  if (pathname === '/privacy') return 'MarketingPrivacy';
  if (pathname === '/terms') return 'MarketingTerms';
  return 'Landing';
}

export function pathFromPage(page: Page) {
  const paths: Partial<Record<Page, string>> = {
    Landing: '/',
    Login: '/signin',
    CreateAccount: '/create-account',
    VerifyEmail: '/verify-email',
    ForgotPassword: '/forgot-password',
    Onboarding: '/onboarding',
    AccessPending: '/access-pending',
    Admin: '/admin',
    'AI Ant': '/ai-ant',
    MarketingProduct: '/product',
    MarketingHowItWorks: '/how-it-works',
    MarketingFeatures: '/features',
    MarketingFeatureAIAnt: '/features/ai-ant',
    MarketingFeatureColonyCrew: '/features/colony-crew',
    MarketingFeatureOneManEnterprise: '/features/one-man-enterprise',
    MarketingFeatureAutomation: '/features/automation',
    MarketingFeatureColonyBridge: '/features/colony-bridge',
    MarketingPricing: '/pricing',
    MarketingRoadmap: '/roadmap',
    MarketingAbout: '/about',
    MarketingEarlyAccess: '/early-access',
    MarketingPrivacy: '/privacy',
    MarketingTerms: '/terms',
  };
  return paths[page] ?? `/${page.toLowerCase().replace(/\s+/g, '-')}`;
}
