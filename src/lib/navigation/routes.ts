import type { Page } from '../../types/navigation';

export function pageFromPath(pathname: string): Page {
  if (pathname.startsWith('/admin')) return 'Admin';
  if (pathname === '/create-account' || pathname === '/signup') return 'CreateAccount';
  if (pathname === '/verify-email') return 'VerifyEmail';
  if (pathname === '/login' || pathname === '/signin') return 'Login';
  if (pathname === '/forgot-password') return 'ForgotPassword';
  if (pathname === '/onboarding') return 'Onboarding';
  if (pathname === '/ai-ant') return 'AI Ant';
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
    Admin: '/admin',
    'AI Ant': '/ai-ant',
  };
  return paths[page] ?? `/${page.toLowerCase().replace(/\s+/g, '-')}`;
}
