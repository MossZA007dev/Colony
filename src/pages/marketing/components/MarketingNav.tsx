import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Menu, X } from 'lucide-react';
import type { Page } from '../../../types/navigation';
import { ColonyLogo } from '../../../components/brand/BrandMarks';
import { currentAccessStageUi } from '../../../lib/access/accessStage';
import { EASE_OUT_EXPO } from '../../LandingPage/components/motion';

type NavRoute = {
  label: string;
  page: Page;
  children?: { label: string; page: Page; description?: string }[];
};

const NAV_ROUTES: NavRoute[] = [
  { label: 'Product', page: 'MarketingProduct' },
  { label: 'How It Works', page: 'MarketingHowItWorks' },
  {
    label: 'Features',
    page: 'MarketingFeatures',
    children: [
      { label: 'AI Ant', page: 'MarketingFeatureAIAnt', description: 'The coordinator. Picks the right mode for each goal.' },
      { label: 'Colony Crew', page: 'MarketingFeatureColonyCrew', description: 'Specialist AI team for complex one-off work.' },
      { label: 'One-man Enterprise', page: 'MarketingFeatureOneManEnterprise', description: 'A visible AI organization with roles and departments.' },
      { label: 'Automation', page: 'MarketingFeatureAutomation', description: 'Repeatable workflows for recurring work.' },
      { label: 'Colony Bridge', page: 'MarketingFeatureColonyBridge', description: 'The approved action layer for real-world tools.' },
    ],
  },
  { label: 'Pricing', page: 'MarketingPricing' },
  { label: 'Roadmap', page: 'MarketingRoadmap' },
  { label: 'About', page: 'MarketingAbout' },
];

export function MarketingNav({ goTo, currentPage }: { goTo: (page: Page) => void; currentPage: Page }) {
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const openMenu = (label: string) => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpenDropdown(label);
  };

  const scheduleClose = () => {
    if (closeTimeoutRef.current !== null) window.clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = window.setTimeout(() => setOpenDropdown(null), 140);
  };

  const isActive = (route: NavRoute) => {
    if (currentPage === route.page) return true;
    if (route.children) return route.children.some((c) => c.page === currentPage);
    return false;
  };

  const goToPage = (page: Page) => {
    setMobileOpen(false);
    setOpenDropdown(null);
    goTo(page);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const goToEarlyAccess = () => goToPage('MarketingEarlyAccess');

  return (
    <>
      <nav
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'border-b border-white/[0.07] bg-[#050508]/82 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.04)]'
            : 'border-b border-transparent bg-transparent'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
      >
        <div className="mx-auto flex h-[64px] w-full max-w-[1320px] items-center justify-between px-5 md:h-[68px] md:px-8">
          <button onClick={() => goToPage('Landing')} className="flex shrink-0 items-center gap-2.5">
            <ColonyLogo size={28} />
            <span className="text-[15.5px] font-semibold tracking-tight text-white">Colony Bridge</span>
          </button>

          <div className="hidden items-center gap-1 md:flex">
            {NAV_ROUTES.map((route) => {
              const active = isActive(route);
              const hasDropdown = !!route.children;
              return (
                <div
                  key={route.label}
                  className="relative"
                  onMouseEnter={hasDropdown ? () => openMenu(route.label) : undefined}
                  onMouseLeave={hasDropdown ? scheduleClose : undefined}
                >
                  <button
                    onClick={() => (hasDropdown ? (openDropdown === route.label ? setOpenDropdown(null) : openMenu(route.label)) : goToPage(route.page))}
                    aria-expanded={hasDropdown ? openDropdown === route.label : undefined}
                    aria-haspopup={hasDropdown ? 'menu' : undefined}
                    className={`relative flex items-center gap-1 rounded-md px-3 py-2 text-[13.5px] font-medium transition-colors ${
                      active ? 'text-white' : 'text-white/55 hover:text-white/90'
                    }`}
                  >
                    {route.label}
                    {hasDropdown && (
                      <ChevronDown
                        className={`h-3 w-3 transition-transform ${openDropdown === route.label ? 'rotate-180' : ''}`}
                      />
                    )}
                    {active && (
                      <motion.span
                        layoutId="marketing-nav-active"
                        className="absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-gradient-to-r from-[#7c5cfc] to-[#7db7ff]"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                  </button>

                  <AnimatePresence>
                    {hasDropdown && openDropdown === route.label && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.18, ease: EASE_OUT_EXPO }}
                        className="absolute left-1/2 top-full z-40 mt-2 w-[340px] -translate-x-1/2"
                        onMouseEnter={() => openMenu(route.label)}
                        onMouseLeave={scheduleClose}
                      >
                        <div
                          className="rounded-2xl border border-white/[0.08] bg-[#0a0c14]/95 p-2 shadow-[0_30px_90px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
                          role="menu"
                        >
                          <button
                            onClick={() => goToPage(route.page)}
                            className="w-full rounded-xl px-3 py-2 text-left transition hover:bg-white/[0.04]"
                            role="menuitem"
                          >
                            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#bcd9ff]">All {route.label}</span>
                            <p className="mt-0.5 text-[12px] text-white/45">Overview of every Colony Bridge mode.</p>
                          </button>
                          <div className="my-1 h-px bg-white/[0.06]" />
                          {route.children?.map((child) => (
                            <button
                              key={child.page}
                              onClick={() => goToPage(child.page)}
                              className="block w-full rounded-xl px-3 py-2 text-left transition hover:bg-white/[0.05]"
                              role="menuitem"
                            >
                              <p className="text-[13.5px] font-semibold text-white">{child.label}</p>
                              {child.description && (
                                <p className="mt-0.5 text-[12px] leading-snug text-white/45">{child.description}</p>
                              )}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goToEarlyAccess}
              className="lp-btn-navbar hidden items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold sm:inline-flex"
            >
              <span className="sm:hidden">{currentAccessStageUi.primaryCta.split(' ')[0]}</span>
              <span className="hidden sm:inline">Join Early Access</span>
              <span aria-hidden>→</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              className="grid h-9 w-9 place-items-center rounded-md text-white/70 transition hover:bg-white/[0.06] hover:text-white md:hidden"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-[#050508]/85 backdrop-blur-md md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ y: -12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
              onClick={(e) => e.stopPropagation()}
              className="mx-4 mt-[80px] max-h-[78vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#0a0c14]/95 p-3 shadow-[0_30px_90px_rgba(0,0,0,0.55)]"
            >
              <nav className="flex flex-col">
                {NAV_ROUTES.map((route) => (
                  <div key={route.label}>
                    <button
                      onClick={() => goToPage(route.page)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-[15px] font-medium transition ${
                        isActive(route) ? 'bg-white/[0.05] text-white' : 'text-white/72 hover:bg-white/[0.04] hover:text-white'
                      }`}
                    >
                      <span>{route.label}</span>
                      <span aria-hidden className="text-white/30">→</span>
                    </button>
                    {route.children && (
                      <div className="ml-3 mt-1 space-y-0.5 border-l border-white/[0.06] pl-3">
                        {route.children.map((child) => (
                          <button
                            key={child.page}
                            onClick={() => goToPage(child.page)}
                            className="block w-full rounded-lg px-2 py-1.5 text-left text-[13px] text-white/55 transition hover:bg-white/[0.04] hover:text-white"
                          >
                            {child.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <button
                  onClick={goToEarlyAccess}
                  className="lp-btn-primary mt-2 rounded-xl px-4 py-3 text-center text-[14px] font-semibold"
                >
                  Join Early Access →
                </button>
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default MarketingNav;
