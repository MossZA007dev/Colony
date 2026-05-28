import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import {
  BriefcaseBusiness,
  ChevronDown,
  FileText,
  Layers3,
  Menu,
  ShieldCheck,
  Target,
  Users,
  Workflow,
  X,
  Bot,
  CheckCircle2,
  Linkedin,
  Twitter,
  Github,
  Mail,
} from 'lucide-react';
import { ColonyLogo } from '../../components/brand/BrandMarks';
import { validateEmail } from '../../lib/auth/mockAuth';
import { fetchWaitlistCount, submitWaitlistSignup } from '../../lib/waitlist/waitlistApi';
import { currentAccessStageUi } from '../../lib/access/accessStage';
import type { Page } from '../../types/navigation';
import './LandingPage.css';

import { RevealOnScroll, AmbientGlow, EASE_OUT_EXPO } from './components/motion';
import { StarBorder } from './components/StarBorder';
import { LiveWaitlistCounter } from './components/LiveWaitlistCounter';
import { MarketingNav } from '../marketing/components/MarketingNav';
import { MarketingFooter } from '../marketing/components/MarketingFooter';
import {
  AboutUsSection,
  ApprovalFirstControlSection,
  FAQSection,
  FeatureSystemSection,
  HowColonyWorksInfographic,
  NewComparisonSection,
  NewRoadmapSection,
  SupportedModelsSection,
  SystemMapSection,
} from './components/LandingInfographics';

const glyph = {
  arrow: '->',
  dot: '-',
};

export function GlobalBackgroundVideo() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.04]">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover pointer-events-none"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4"
      />
    </div>
  );
}

type NavLink = { label: string; id: string };

const NAV_LINKS: NavLink[] = [
  { label: 'Product', id: 'product' },
  { label: 'How It Works', id: 'how-it-works' },
  { label: 'Features', id: 'features' },
  { label: 'Roadmap', id: 'roadmap' },
  { label: 'About', id: 'team' },
];

const VIDEO_BG_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4';

export function LandingPage({ goTo, publicOnly = false }: { goTo: (page: Page) => void; publicOnly?: boolean }) {
  const heroRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  // TODO(BACKEND): Replace development fallback with verified unique waitlist count
  // before public launch.
  const [waitlistCount, setWaitlistCount] = useState<number | null>(import.meta.env.DEV ? 0 : null);

  const navLinks: NavLink[] = publicOnly ? NAV_LINKS.filter((l) => l.id !== 'early-access') : NAV_LINKS;
  const scrollToPrimaryCta = () =>
    document.getElementById(publicOnly ? 'try-a-goal' : 'early-access')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroContentY = useTransform(scrollYProgress, [0, 0.55], [0, -120]);
  const heroContentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const videoBgY = useTransform(scrollYProgress, [0, 1], [0, -70]);

  useEffect(() => {
    let mounted = true;

    const refreshWaitlistCount = async () => {
      try {
        const count = await fetchWaitlistCount();
        if (mounted) setWaitlistCount(count);
      } catch {
        if (mounted) {
          setWaitlistCount((current) => current);
        }
      }
    };

    void refreshWaitlistCount();
    const intervalId = window.setInterval(refreshWaitlistCount, 12000);
    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const onPrimaryCta = publicOnly ? scrollToPrimaryCta : () => goTo('MarketingEarlyAccess');

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050508] text-white" style={{ fontFamily: "'Inter', 'DM Sans', sans-serif" }}>
      <MarketingNav goTo={goTo} currentPage="Landing" />

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative min-h-screen overflow-hidden bg-[#050508]">
        {/* Background video */}
        <motion.div
          className="absolute inset-0 z-0"
          style={{ y: videoBgY, opacity: 0.45 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.45 }}
          transition={{ duration: 1.4, delay: 0.2, ease: EASE_OUT_EXPO }}
        >
          <video autoPlay loop muted playsInline className="h-full w-full object-cover" src={VIDEO_BG_URL} />
        </motion.div>

        {/* Gradient overlays */}
        <div className="pointer-events-none absolute inset-0 z-[1]">
          <div className="absolute inset-0 bg-[#050508]/82" />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(60% 50% at 70% 40%, rgba(8,10,18,0.0), rgba(5,5,8,0.55) 70%), radial-gradient(45% 40% at 25% 55%, rgba(124,92,252,0.10), transparent 70%)',
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#050508] to-transparent" />
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#050508]/80 to-transparent" />
        </div>

        {/* Slow ambient glows */}
        <AmbientGlow className="z-[1]" colors={['rgba(124,92,252,0.16)', 'rgba(125,183,255,0.14)']} />

        {/* Hero content — two-column on lg+, stacked on smaller */}
        <motion.div
          style={{ y: heroContentY, opacity: heroContentOpacity }}
          className="relative z-[2] mx-auto flex min-h-screen w-full max-w-[1320px] flex-col justify-center px-5 pb-20 pt-[112px] md:px-8 lg:pb-14 lg:pt-[118px]"
        >
          <div className="flex flex-col items-center gap-9 lg:gap-8">
            {/* ── Left: marketing copy ───────────────────────── */}
            <div className="min-w-0 text-center">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.05, ease: EASE_OUT_EXPO }}
                className="liquid-glass mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1.5"
              >
                <span className="grid h-4 w-4 place-items-center rounded-full bg-violet-400/25">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-200" />
                </span>
                <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white/75">AI Operating Workspace</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 26, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.9, delay: 0.12, ease: EASE_OUT_EXPO }}
                className="mb-5 text-[clamp(38px,5.4vw,64px)] font-semibold leading-[1.04] tracking-[-0.03em] text-white"
              >
                Build and{' '}
                <br className="sm:hidden" />
                <span
                  className="font-normal text-white/95"
                  style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic' }}
                >
                  coordinate
                </span>
                <br />
                your AI
                <br className="sm:hidden" />
                workforce.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 22, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.9, delay: 0.28, ease: EASE_OUT_EXPO }}
                className="mx-auto mb-8 max-w-[330px] text-[16px] font-normal leading-[1.65] text-white/68 sm:max-w-[620px] md:text-[17px]"
              >
                Colony Bridge helps founders and small teams turn one goal into an AI crew that researches, plans, and produces review-ready work you can control.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.44, ease: EASE_OUT_EXPO }}
                className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
              >
                <motion.button
                  onClick={onPrimaryCta}
                  whileHover={reduce ? undefined : { y: -2, boxShadow: '0 0 0 1px rgba(255,255,255,0.38), 0 6px 44px rgba(255,255,255,0.3), 0 2px 12px rgba(0,0,0,0.22)' }}
                  whileTap={reduce ? undefined : { scale: 0.97 }}
                  transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                  style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.22), 0 4px 28px rgba(255,255,255,0.18), 0 2px 8px rgba(0,0,0,0.16)' }}
                  className="lp-btn-primary rounded-full px-7 py-3.5 text-[15px] font-semibold"
                >
                  {currentAccessStageUi.primaryCta}
                </motion.button>
                <motion.button
                  onClick={() => goTo('MarketingFeatures')}
                  whileHover={reduce ? undefined : { y: -2 }}
                  whileTap={reduce ? undefined : { scale: 0.97 }}
                  transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                  className="lp-btn-secondary rounded-full px-7 py-3.5 text-[15px] font-medium backdrop-blur-sm"
                >
                  Explore features
                </motion.button>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.6, ease: EASE_OUT_EXPO }}
                className="mt-5 text-[12.5px] text-white/40"
              >
                {currentAccessStageUi.availabilityText}
              </motion.p>
              <LiveWaitlistCounter count={waitlistCount} />
            </div>

          </div>
        </motion.div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-32 bg-gradient-to-t from-[#050508] to-transparent" />
      </section>

      {/* ── Content ── */}
      <div className="relative bg-[#050508]">
        <SupportedModelsSection />
        <FeatureSystemSection />
        <NewRoadmapSection />
        <HomeCtaStrip goTo={goTo} />
        {publicOnly && <EarlyAccessSection goTo={goTo} onWaitlistCountChange={setWaitlistCount} />}
      </div>

      <MarketingFooter goTo={goTo} />
    </div>
  );
}

function HomeCtaStrip({ goTo }: { goTo: (page: Page) => void }) {
  return (
    <section className="px-5 py-20 md:px-8">
      <RevealOnScroll className="mx-auto max-w-[1100px] overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.025] p-8 text-center md:p-12">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#7db7ff]">Early access</p>
        <h2 className="mb-4 text-[28px] font-semibold leading-tight tracking-tight text-white md:text-[36px]">
          Bring us one task you wish AI could handle better.
        </h2>
        <p className="mx-auto mb-7 max-w-[560px] text-[14px] leading-relaxed text-white/60 md:text-[15px]">
          We are inviting a small number of founders and teams to shape the early Colony Bridge workspace with real workflows.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              goTo('MarketingEarlyAccess');
              window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
            }}
            className="lp-btn-primary rounded-full px-6 py-3 text-[14px] font-semibold"
          >
            Request Early Access →
          </button>
          <button
            onClick={() => {
              goTo('MarketingHowItWorks');
              window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
            }}
            className="lp-btn-secondary rounded-full px-6 py-3 text-[14px] font-medium"
          >
            See How It Works
          </button>
        </div>
      </RevealOnScroll>
    </section>
  );
}

// ── Sticky nav with scroll-aware blur and active-section indicator ────────────
function StickyNav({
  navLinks,
  goTo,
  publicOnly,
  scrollToPrimaryCta,
}: {
  navLinks: NavLink[];
  goTo: (page: Page) => void;
  publicOnly: boolean;
  scrollToPrimaryCta: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState<string>(navLinks[0]?.id ?? '');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const sections = navLinks
      .map((l) => document.getElementById(l.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveId(visible.target.id);
      },
      { threshold: [0.2, 0.4, 0.6], rootMargin: '-30% 0px -40% 0px' },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [navLinks]);

  const [mobileOpen, setMobileOpen] = useState(false);
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileOpen(false);
  };

  // Lock body scroll while mobile menu is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [mobileOpen]);

  return (
    <>
      <nav
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'border-b border-white/[0.07] bg-[#050508]/78 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.04)]'
            : 'border-b border-transparent bg-transparent'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
      >
        <div className="mx-auto flex h-[64px] w-full max-w-[1320px] items-center justify-between px-5 md:h-[68px] md:px-8">
          {/* Left: brand */}
          <button onClick={() => goTo('Landing')} className="flex shrink-0 items-center gap-2.5">
            <ColonyLogo size={28} />
            <span className="text-[15.5px] font-semibold tracking-tight text-white">Colony Bridge</span>
          </button>

          {/* Center: text nav (desktop) */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const isActive = activeId === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className={`relative rounded-md px-3 py-2 text-[13.5px] font-medium transition-colors ${
                    isActive ? 'text-white' : 'text-white/55 hover:text-white/90'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-gradient-to-r from-[#7c5cfc] to-[#7db7ff]"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right: CTAs (desktop) + hamburger (mobile) */}
          <div className="flex items-center gap-2">
            {!publicOnly && currentAccessStageUi.showPublicSignIn && (
              <button onClick={() => goTo('Login')} className="hidden rounded-md px-3 py-2 text-[13px] font-medium text-white/65 transition hover:text-white sm:block">
                {currentAccessStageUi.signInLabel}
              </button>
            )}
            <button
              onClick={scrollToPrimaryCta}
              className="lp-btn-navbar hidden items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold sm:inline-flex"
            >
              <span className="sm:hidden">{currentAccessStageUi.primaryCta.split(' ')[0]}</span>
              <span className="hidden sm:inline">{currentAccessStageUi.primaryCta}</span>
              <span aria-hidden>→</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              className="grid h-9 w-9 place-items-center rounded-md text-white/70 transition hover:bg-white/[0.06] hover:text-white md:hidden"
            >
              {mobileOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile sheet menu */}
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
              className="mx-4 mt-[80px] rounded-2xl border border-white/[0.08] bg-[#0a0c14]/95 p-3 shadow-[0_30px_90px_rgba(0,0,0,0.55)]"
            >
              <nav className="flex flex-col">
                {navLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => scrollToSection(link.id)}
                    className={`flex items-center justify-between rounded-xl px-3 py-3 text-left text-[15px] font-medium transition ${
                      activeId === link.id ? 'bg-white/[0.05] text-white' : 'text-white/72 hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    <span>{link.label}</span>
                    <span aria-hidden className="text-white/30">→</span>
                  </button>
                ))}
                {!publicOnly && currentAccessStageUi.showPublicSignIn && (
                  <button
                    onClick={() => { setMobileOpen(false); goTo('Login'); }}
                    className="mt-1 flex items-center justify-between rounded-xl border-t border-white/[0.06] px-3 py-3 text-left text-[15px] font-medium text-white/65 transition hover:text-white"
                  >
                    {currentAccessStageUi.signInLabel}
                    <span aria-hidden className="text-white/30">→</span>
                  </button>
                )}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Breathing frame, subtle scale loop around hero preview.
function BreathingFrame({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      animate={reduce ? undefined : { y: [0, -4, 0], scale: [1, 1.005, 1] }}
      transition={{ duration: 6.5, ease: 'easeInOut', repeat: Infinity }}
      className="relative mx-auto w-full max-w-[700px]"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 rounded-[36px]" aria-hidden>
        <div
          className="h-full w-full rounded-[36px]"
          style={{
            background:
              'radial-gradient(60% 60% at 50% 50%, rgba(124,92,252,0.18) 0%, rgba(125,183,255,0.08) 40%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
      </div>
      {children}
    </motion.div>
  );
}

// ── Supporting components ─────────────────────────────────────────────────────
function ProblemSection() {
  const pains = [
    {
      title: 'Research is fragmented',
      copy: 'Insights are spread across chats, browser tabs, documents, and disconnected tools.',
    },
    {
      title: 'Results still need assembly',
      copy: 'AI can generate pieces of work, but someone still has to organize them into something useful.',
    },
    {
      title: 'Recurring work stays manual',
      copy: 'Reports, planning, and routine analysis still require repeated setup and review.',
    },
  ];

  return (
    <section id="problem" className="px-5 py-24 md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <RevealOnScroll>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#7db7ff]">The Problem</p>
          <h2 className="max-w-3xl text-[34px] font-semibold leading-tight tracking-tight text-white md:text-[44px]">
            AI can answer questions. Your work is still scattered.
          </h2>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-white/62 md:text-[16px]">
            Founders and small teams still spend hours moving between research, planning, writing, files, and approvals. Colony Bridge is being built to turn that scattered work into one coordinated AI workflow.
          </p>
        </RevealOnScroll>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {pains.map((pain, index) => (
            <RevealOnScroll key={pain.title} delay={index * 0.06} y={20}>
              <div className="card-premium h-full rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.12] hover:bg-white/[0.04] motion-reduce:transform-none">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/30">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="mt-5 text-[17px] font-semibold text-white">{pain.title}</h3>
                <p className="mt-3 text-[13px] leading-relaxed text-white/60">{pain.copy}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowExampleSection() {
  const flow = [
    { title: 'AI Ant understands the goal', copy: 'Identifies what research, planning, and output the task requires.', icon: <Target className="h-[18px] w-[18px]" /> },
    { title: 'A specialist crew is assembled', copy: 'Research, strategy, and writing agents are assigned to the work.', icon: <Users className="h-[18px] w-[18px]" /> },
    { title: 'Agents prepare the result', copy: 'Each specialist contributes to one shared launch-plan deliverable.', icon: <FileText className="h-[18px] w-[18px]" /> },
    { title: 'You review before anything moves forward', copy: 'The final output stays visible and under your approval.', icon: <ShieldCheck className="h-[18px] w-[18px]" /> },
  ];

  return (
    <section id="workflow-example" className="px-5 py-24 md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <RevealOnScroll>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#7db7ff]">How It Works</p>
          <h2 className="max-w-3xl text-[34px] font-semibold leading-tight tracking-tight text-white md:text-[44px]">
            Describe the goal. Watch the work take shape.
          </h2>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-white/62">
            Start with one business request. AI Ant proposes the right structure, coordinates specialist agents, and prepares a result for your review.
          </p>
        </RevealOnScroll>
        <RevealOnScroll delay={0.08} className="mt-9 overflow-hidden rounded-[24px] border border-white/[0.08] bg-white/[0.025]">
          <div className="border-b border-white/[0.07] bg-[#07090f]/75 px-5 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/35">Prompt example</p>
            <p className="mt-1 text-[18px] font-semibold text-white md:text-[22px]">
              Research my competitors and prepare a 30-day launch plan.
            </p>
          </div>
          <div className="grid gap-px bg-white/[0.06] md:grid-cols-2 lg:grid-cols-4">
            {flow.map((item, index) => (
              <div key={item.title} className="bg-[#080a10] p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <FeatureIconBadge icon={item.icon} />
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/30">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="text-[15px] font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/58">{item.copy}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 border-t border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] text-white/52">A concrete pilot workflow for competitor research, launch planning, and review.</p>
            <button
              type="button"
              onClick={() => document.getElementById('early-access')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="lp-btn-secondary inline-flex items-center justify-center rounded-full px-5 py-2.5 text-[13px] font-semibold"
            >
              Join Early Access
            </button>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}

function FeatureIconBadge({ icon }: { icon: React.ReactNode }) {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.1] bg-white/[0.05] text-white/86 shadow-[0_10px_30px_rgba(0,0,0,0.28)]">
      {icon}
    </div>
  );
}

function ProductModelSection() {
  const paths = [
    {
      title: 'Colony Crew',
      label: 'Testing now',
      copy:
        'Specialist AI agents assembled for a focused task such as research, planning, or report preparation.',
      icon: <Users className="h-[18px] w-[18px]" />,
    },
    {
      title: 'Projects & Deliverables',
      label: 'Testing now',
      copy:
        'A workspace for keeping related chats, instructions, and review-ready results together.',
      icon: <Layers3 className="h-[18px] w-[18px]" />,
    },
    {
      title: 'Automation',
      label: 'In development',
      copy:
        'Repeatable AI workflows for recurring work with review checkpoints before important actions.',
      icon: <Workflow className="h-[18px] w-[18px]" />,
    },
  ];

  return (
    <section id="product" className="px-5 py-24 md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <RevealOnScroll>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#7db7ff]">The Product</p>
          <h2 className="max-w-3xl text-[34px] font-semibold leading-tight tracking-tight text-white md:text-[44px]">
            One coordinator. Different ways to get work done.
          </h2>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-white/62">
            AI Ant is the starting point of Colony Bridge. You describe the goal, and it helps organize the right people, process, and output around it.
          </p>
        </RevealOnScroll>
        <div className="mt-10 grid gap-4 lg:grid-cols-[1.05fr_1.65fr]">
          <RevealOnScroll y={20}>
            <div className="card-premium h-full rounded-2xl border border-[#7db7ff]/25 bg-[#7db7ff]/[0.055] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#7db7ff]/35 motion-reduce:transform-none">
              <div className="mb-5 flex items-start justify-between gap-4">
                <FeatureIconBadge icon={<Bot className="h-[18px] w-[18px]" />} />
                <span className="rounded-full border border-[#7db7ff]/20 bg-[#7db7ff]/10 px-3 py-1 text-[11px] font-medium text-[#bcd9ff]">
                  Coordinator
                </span>
              </div>
              <h3 className="text-[22px] font-semibold text-white">AI Ant</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-white/68">
                Your starting point. Describe a goal and let AI Ant recommend the right structure for the work.
              </p>
            </div>
          </RevealOnScroll>
          <div className="grid gap-4 md:grid-cols-3">
            {paths.map((path, index) => (
              <RevealOnScroll key={path.title} delay={index * 0.06} y={20}>
                <div className="card-premium h-full rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.12] hover:bg-white/[0.04] motion-reduce:transform-none">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <FeatureIconBadge icon={path.icon} />
                    <span className="rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-white/62">
                      {path.label}
                    </span>
                  </div>
                  <h3 className="text-[16px] font-semibold text-white">{path.title}</h3>
                  <p className="mt-3 text-[13px] leading-relaxed text-white/60">{path.copy}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TestingNowSection() {
  const features = [
    {
      title: 'Goal routing with AI Ant',
      copy:
        'Describe a task and see how Colony Bridge recommends a way to handle it.',
      icon: <Target className="h-[18px] w-[18px]" />,
    },
    {
      title: 'Colony Crew task flow',
      copy:
        'Preview specialist agents coordinating around one focused business request.',
      icon: <Users className="h-[18px] w-[18px]" />,
    },
    {
      title: 'Review-ready deliverables',
      copy:
        'See how research, planning, and outputs stay organized for feedback and refinement.',
      icon: <FileText className="h-[18px] w-[18px]" />,
    },
  ];

  return (
    <section id="features" className="px-5 py-28 md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <RevealOnScroll>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#7db7ff]">MVP Testing Now</p>
          <h2 className="max-w-3xl text-[34px] font-semibold leading-tight tracking-tight text-white md:text-[44px]">
            What early users can explore first.
          </h2>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-white/62">
            We are starting with the smallest experience that tests whether an AI crew can turn a goal into useful, review-ready work.
          </p>
        </RevealOnScroll>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {features.map((feature, index) => (
            <RevealOnScroll key={feature.title} delay={index * 0.06} y={20}>
              <div className="card-premium group flex h-full min-h-[210px] flex-col rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.12] hover:bg-white/[0.04] motion-reduce:transform-none">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <FeatureIconBadge icon={feature.icon} />
                  <span className="rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-white/62">
                    Testing now
                  </span>
                </div>
                <h3 className="mb-3 text-[16px] font-semibold text-white">{feature.title}</h3>
                <p className="text-[13px] leading-relaxed text-white/62">{feature.copy}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
        <RevealOnScroll delay={0.12} y={16}>
          <p className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 text-[13px] leading-relaxed text-white/58">
            Coming next: repeatable automation workflows, approved connectors, and shared collaboration tools.
          </p>
        </RevealOnScroll>
      </div>
    </section>
  );
}

function ApprovalControlSection() {
  return (
    <section className="px-5 py-24 md:px-8">
      <RevealOnScroll className="mx-auto max-w-[1100px] overflow-hidden rounded-[26px] border border-white/[0.08] bg-white/[0.025] p-6 md:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#7db7ff]">Approval-First Control</p>
            <h2 className="max-w-2xl text-[34px] font-semibold leading-tight tracking-tight text-white md:text-[44px]">
              AI prepares the work. You stay in control.
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/62 md:text-[16px]">
              Colony Bridge is designed around reviewable AI workflows. AI Ant can prepare outputs and recommend next steps, while important actions remain visible before anything is sent, changed, or shared.
            </p>
          </div>
          <div className="rounded-[22px] border border-white/[0.09] bg-[#070a12]/90 p-4">
            <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
              <div className="grid h-10 w-10 place-items-center rounded-[13px] bg-white text-[#070a12]">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-white">AI Ant prepared a result</p>
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/38">Waiting for approval</p>
              </div>
            </div>
            <div className="mt-4 rounded-[16px] border border-amber-300/22 bg-amber-400/[0.07] p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-amber-100" />
                <div>
                  <p className="text-[13px] font-semibold text-white">Launch plan ready for review</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-white/55">
                    Review the deliverable before it is shared outside the workspace.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" className="lp-btn-secondary flex-1 rounded-full px-4 py-2 text-[12px] font-semibold">
                Review
              </button>
              <button type="button" className="lp-btn-primary flex-1 rounded-full px-4 py-2 text-[12px] font-semibold">
                Approve
              </button>
            </div>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
}

function BuildersSection() {
  const team = [
    {
      initials: 'MO',
      name: 'Moss',
      role: 'Frontend, Business Development & Product Strategy',
      description:
        'Designing the product experience, shaping the business direction, and finding the first early users for Colony Bridge.',
      focus: ['Product Strategy', 'Frontend', 'Business Development', 'User Research'],
    },
    {
      initials: 'FP',
      name: 'Fais Putama',
      role: 'Backend, Database & AI Systems',
      description:
        'Building the technical foundation, data structure, AI integrations, and workflow infrastructure behind Colony Bridge.',
      focus: ['Backend', 'Database', 'AI Integration', 'Workflow Systems'],
    },
  ];

  return (
    <section id="team" className="px-5 py-24 md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <RevealOnScroll>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#7db7ff]">Team</p>
          <h2 className="max-w-3xl text-[34px] font-semibold leading-tight tracking-tight text-white md:text-[44px]">
            Built by a small team, shaped by early users.
          </h2>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-white/60">
            We are building Colony Bridge with a focused MVP and learning directly from founders and small teams who want AI work to feel clearer and more controllable.
          </p>
        </RevealOnScroll>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {team.map((member, index) => (
            <RevealOnScroll key={member.name} delay={index * 0.08} y={20}>
              <div className="card-premium flex h-full flex-col rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
                <div className="mb-5 flex items-center gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/[0.12] bg-white/[0.07] text-base font-bold text-white">
                    {member.initials}
                  </div>
                  <div>
                    <h3 className="text-[17px] font-semibold text-white">{member.name}</h3>
                    <p className="text-[13px] font-medium text-[#7db7ff]">{member.role}</p>
                  </div>
                </div>
                <p className="text-[13px] leading-relaxed text-white/62">{member.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {member.focus.map((item) => (
                    <span key={item} className="rounded-full border border-white/[0.1] bg-white/[0.05] px-2.5 py-1 text-[11px] font-medium text-white/65">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
        <RevealOnScroll delay={0.12} y={20} className="mt-4">
          <div className="flex flex-col gap-4 rounded-2xl border border-[#7db7ff]/18 bg-[#7db7ff]/[0.045] p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-[18px] font-semibold text-white">Become a design partner</h3>
              <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-white/62">
                Try early workflows, share honest feedback, and help us decide what Colony Bridge should build next.
              </p>
            </div>
            <button
              type="button"
              onClick={() => document.getElementById('early-access')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="lp-btn-primary shrink-0 rounded-full px-5 py-2.5 text-[13px] font-semibold"
            >
              Become a Pilot User
            </button>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}

function ComparisonSection() {
  const rows = [
    ['Starting point', 'Nodes, triggers, APIs, or technical setup', 'A goal described in plain language'],
    ['User experience', 'Designed for users familiar with automation setup', 'Designed for founders and small teams exploring AI-assisted work'],
    ['Workflow visibility', 'Complex flows may be difficult to interpret', 'Visible crews, progress, and deliverables'],
    ['Safety', 'Actions depend on careful configuration', 'Approval-first approach keeps users in control'],
    ['Outputs', 'Workflow execution and logs', 'Review-ready work connected to the project context'],
  ];

  return (
    <section id="comparison" className="px-5 py-24 md:px-8">
      <RevealOnScroll className="mx-auto max-w-[1200px]">
        <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.18em] text-[#7db7ff]">Comparison</p>
        <h2 className="mx-auto max-w-4xl text-center text-[34px] font-semibold leading-tight tracking-tight text-white md:text-[44px]">
          A different starting point from traditional workflow builders.
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-center text-[15px] leading-relaxed text-white/55">
          Traditional workflow builders often begin with nodes, triggers, and integrations. Colony Bridge begins with your goal and helps organize the work around it.
        </p>
        <div className="mt-10 overflow-x-auto overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
          <div className="grid min-w-[760px] grid-cols-[1.1fr_1.25fr_1.25fr] border-b border-white/[0.07] text-sm">
            {['', 'Traditional workflow builders', 'Colony Bridge'].map((header, index) => (
              <div key={header || index} className={`p-4 font-semibold ${index === 2 ? 'bg-[#7db7ff]/10 text-[#bcd9ff]' : 'text-white/70'}`}>
                {header}
              </div>
            ))}
          </div>
          <div className="min-w-[760px]">
            {rows.map((row) => (
              <div key={row[0]} className="grid grid-cols-[1.1fr_1.25fr_1.25fr] border-b border-white/[0.05] last:border-b-0">
                <div className="p-4 text-[13px] font-semibold text-white/85">{row[0]}</div>
                <div className="p-4 text-[13px] leading-relaxed text-white/48">{row[1]}</div>
                <div className="bg-[#7db7ff]/[0.06] p-4 text-[13px] leading-relaxed text-white/80">{row[2]}</div>
              </div>
            ))}
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
}

// Index of the phase Colony is currently building. Update this when stages ship.
const CURRENT_PHASE_INDEX = 0;

type PhaseStage = {
  status: string;
  title: string;
  items: string[];
};

function RoadmapSection() {
  const [selectedStageIndex, setSelectedStageIndex] = React.useState(CURRENT_PHASE_INDEX);
  const stages: PhaseStage[] = [
    {
      status: 'Testing now',
      title: 'Goal to deliverable',
      items: ['AI Ant goal routing', 'Colony Crew task flow', 'Project workspace preview', 'Review-ready deliverables'],
    },
    {
      status: 'Next',
      title: 'Context and connected tools',
      items: ['Better file handling', 'Approved connectors', 'Structured extraction', 'Improved workflow planning'],
    },
    {
      status: 'Later',
      title: 'Automation and collaboration',
      items: ['Repeatable workflows', 'Reusable templates', 'Shared team workspaces', 'Roles and approval history'],
    },
  ];

  return (
    <section id="roadmap" className="px-5 py-28 md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <RevealOnScroll>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#7db7ff]">Roadmap</p>
          <h2 className="max-w-3xl text-[34px] font-semibold leading-[1.08] tracking-tight text-white md:text-[44px]">
            Start focused. Expand with real feedback.
          </h2>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-white/62">
            We are beginning with one promise: turn a goal into review-ready work through an AI crew users can understand and control.
          </p>
        </RevealOnScroll>

        <div className="mt-10 grid items-stretch gap-4 md:grid-cols-3">
          {stages.map((stage, index) => {
            const isSelected = index === selectedStageIndex;
            return (
              <RevealOnScroll key={stage.title} delay={index * 0.06} y={20} className="h-full">
                <PhaseCard
                  stage={stage}
                  index={index}
                  isSelected={isSelected}
                  isTestingStage={index === CURRENT_PHASE_INDEX}
                  onSelect={() => setSelectedStageIndex(index)}
                />
              </RevealOnScroll>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PhaseCard({
  stage,
  index,
  isSelected,
  isTestingStage,
  onSelect,
}: {
  stage: PhaseStage;
  index: number;
  isSelected: boolean;
  isTestingStage: boolean;
  onSelect: () => void;
}) {
  const card = (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onSelect}
      className={`card-premium group relative h-full w-full overflow-hidden rounded-[22px] border p-6 text-left outline-none transition-all duration-300 ease-out motion-reduce:transform-none motion-reduce:transition-none lg:hover:-translate-y-1.5 lg:hover:scale-[1.015] ${
        isSelected
          ? 'border-[#7db7ff]/35 bg-gradient-to-b from-white/[0.055] to-white/[0.025] shadow-[0_18px_60px_rgba(80,134,255,0.12),inset_0_1px_0_rgba(255,255,255,0.08)]'
          : 'border-white/[0.07] bg-white/[0.025] hover:border-white/[0.14] hover:bg-white/[0.045]'
      }`}
    >
      {isSelected && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(125,183,255,0.28) 0%, transparent 60%)',
              filter: 'blur(30px)',
            }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-32 right-0 h-56 w-56 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(124,92,252,0.22) 0%, transparent 65%)',
              filter: 'blur(40px)',
            }}
          />
        </>
      )}

      <div className="relative">
        <div className="mb-4 flex min-h-[74px] flex-col items-start gap-3">
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold transition-colors duration-300 ${
              isSelected
                ? 'bg-[#7db7ff]/18 text-white shadow-[0_0_0_1px_rgba(125,183,255,0.28),0_0_22px_rgba(125,183,255,0.18)]'
                : 'bg-white/[0.05] text-white/55 group-hover:bg-white/[0.08] group-hover:text-white/75'
            }`}
          >
            {index + 1}
          </span>
          <h3 className="text-[15px] font-semibold leading-tight text-white">{stage.title}</h3>
        </div>
        {isTestingStage && (
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#7db7ff]/30 bg-[#7db7ff]/[0.08] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#bcd9ff]">
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="h-1.5 w-1.5 rounded-full bg-[#bcd9ff]"
            />
            {stage.status}
          </div>
        )}
        {!isTestingStage && (
          <div className="mb-4 inline-flex rounded-full border border-white/[0.08] bg-white/[0.035] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
            {stage.status}
          </div>
        )}
        <div className="space-y-2">
          {stage.items.map((item) => (
            <p
              key={item}
              className={`text-[13px] leading-relaxed transition-colors duration-300 ${
                isSelected ? 'text-white/72' : 'text-white/48 group-hover:text-white/62'
              }`}
            >
              {glyph.dot} {item}
            </p>
          ))}
        </div>
      </div>
    </button>
  );

  if (isSelected) {
    return (
      <StarBorder as="div" color="#a8c5ff" speed="5.5s" thickness={1} className="h-full">
        {card}
      </StarBorder>
    );
  }
  return card;
}

export function EarlyAccessSection({
  goTo,
  onWaitlistCountChange,
}: {
  goTo: (page: Page) => void;
  onWaitlistCountChange: (count: number) => void;
}) {
  void goTo;
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState('Founder');
  const [task, setTask] = React.useState('');
  const [willingToTest, setWillingToTest] = React.useState(false);
  const [error, setError] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const [alreadyJoined, setAlreadyJoined] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!task.trim()) {
      setError('Please describe one task you want help with.');
      return;
    }
    if (!willingToTest) {
      setError('Please confirm that you are willing to test an early product experience.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const response = await submitWaitlistSignup({
        name: name.trim(),
        email: email.trim(),
        role,
        task: task.trim(),
        willingToTest,
      });
      onWaitlistCountChange(response.count);
      setAlreadyJoined(response.alreadyJoined);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join the waitlist. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // TODO(BACKEND-ACCESS-GATE): Submitting this form must NOT grant product
  // access. Server should: (1) persist the request with accessStatus="waitlisted",
  // (2) require manual admin promotion to "invited" before the user may sign in,
  // (3) gate every /api/* product route on accessStatus ∈ {internal, active_pilot},
  // (4) refuse AI provider calls in guardAIRequest until access is granted.
  return (
    <section id="early-access" className="px-5 py-28 md:px-8">
      <RevealOnScroll className="mx-auto max-w-[1100px] overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.02] p-8 md:p-12">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#00d4aa]">Early Access</p>
            <h2 className="mb-5 text-[34px] font-semibold leading-[1.08] tracking-tight text-white md:text-[44px]">
              Bring us one task you wish AI could handle better.
            </h2>
            <p className="max-w-xl text-[15px] leading-relaxed text-white/62 md:text-[16px]">
              We are inviting a small number of founders and teams to shape the early Colony Bridge workspace. Tell us what you would like AI Ant to handle, and we will contact selected users with an invitation.
            </p>
          </div>
          <div>
            <motion.form
              onSubmit={submit}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
              className="rounded-[22px] border border-white/[0.08] bg-white/[0.035] p-5 md:p-6"
            >
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
                  className="flex flex-col items-center gap-3 py-8 text-center"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-[#00d4aa]/15 text-[#00d4aa]">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00d4aa]/85">Request Received</p>
                  <p className="text-[16px] font-semibold text-white">
                    {alreadyJoined ? 'You are already on the pilot waitlist.' : 'Thanks for your interest in Colony Bridge.'}
                  </p>
                  <p className="max-w-[360px] text-[13px] leading-relaxed text-white/55">
                    {alreadyJoined
                      ? 'We kept your original spot, so the public waitlist count was not increased.'
                      : 'We are currently inviting a small number of early users. If your task matches what we are testing now, we will contact you with an invitation.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => document.getElementById('product')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    className="lp-btn-secondary mt-2 rounded-full px-5 py-2 text-[13px] font-semibold"
                  >
                    Back to Product
                  </button>
                  <a href="mailto:hello@colonybridge.ai" className="mt-1 text-[12px] font-medium text-white/45 underline-offset-2 hover:text-white/72 hover:underline">
                    Or email the team
                  </a>
                </motion.div>
              ) : (
                <>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/35">Request access</p>
                  <FormField label="Name">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      type="text"
                      placeholder="Your name"
                      className="form-input"
                      autoComplete="name"
                    />
                  </FormField>
                  <FormField label="Email">
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      placeholder="you@company.com"
                      className="form-input"
                      autoComplete="email"
                    />
                  </FormField>
                  <FormField label="What best describes you?">
                    <div className="form-select-wrap">
                      <BriefcaseBusiness className="form-select-icon" />
                      <select value={role} onChange={(e) => setRole(e.target.value)} className="form-select">
                        <option className="bg-[#08080d] text-white">Founder</option>
                        <option className="bg-[#08080d] text-white">Creator</option>
                        <option className="bg-[#08080d] text-white">Small Business Owner</option>
                        <option className="bg-[#08080d] text-white">Student / Project Team</option>
                        <option className="bg-[#08080d] text-white">Other</option>
                      </select>
                      <ChevronDown className="form-select-chevron" />
                    </div>
                  </FormField>
                  <FormField label="What task would you like Colony Bridge to help with?">
                    <textarea
                      value={task}
                      onChange={(e) => setTask(e.target.value)}
                      placeholder="For example: Research competitors and prepare a launch plan."
                      rows={3}
                      className="form-input resize-none"
                    />
                  </FormField>

                  <label className="mt-4 flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 text-[12.5px] leading-relaxed text-white/62">
                    <input
                      type="checkbox"
                      checked={willingToTest}
                      onChange={(e) => setWillingToTest(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-white/20 bg-[#0b0d12] accent-[#00d4aa]"
                    />
                    <span>I am willing to test an early product experience and share feedback.</span>
                  </label>
                  {error ? <p className="mt-3 text-[12px] font-medium text-rose-200">{error}</p> : null}

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <motion.button
                      type="submit"
                      disabled={submitting}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
                      className="lp-btn-primary flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-70"
                    >
                      {submitting ? 'Sending...' : 'Request Early Access'} <span>{glyph.arrow}</span>
                    </motion.button>
                  </div>
                </>
              )}
            </motion.form>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mt-4 block text-[12px] font-semibold text-white/55">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}

// ── Premium footer ───────────────────────────────────────────────────────────
type FooterLinkItem = {
  label: string;
  href?: string;
  onClick?: () => void;
  external?: boolean;
  placeholder?: boolean;
};

function LandingFooter({
  navLinks,
  scrollToPrimaryCta,
}: {
  navLinks: NavLink[];
  scrollToPrimaryCta: () => void;
}) {
  const scrollToId = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const productLinks: FooterLinkItem[] = navLinks.map((link) => ({
    label: link.label,
    onClick: () => scrollToId(link.id),
  }));

  const accessLinks: FooterLinkItem[] = [
    { label: 'Request Early Access', onClick: scrollToPrimaryCta },
    { label: 'Early Access', onClick: scrollToPrimaryCta },
    { label: 'Contact the Team', href: 'mailto:hello@colonybridge.ai', external: true },
    { label: 'Blog', placeholder: true },
  ];

  const legalLinks: FooterLinkItem[] = [
    { label: 'Terms of Use', placeholder: true },
    { label: 'Privacy Policy', placeholder: true },
    { label: 'Cookie Policy', placeholder: true },
  ];

  const socials: { label: string; href: string; icon: React.ElementType }[] = [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/', icon: Linkedin },
    { label: 'X / Twitter', href: 'https://twitter.com/', icon: Twitter },
    { label: 'GitHub', href: 'https://github.com/', icon: Github },
    { label: 'Email the team', href: 'mailto:hello@colonybridge.ai', icon: Mail },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-white/[0.07] bg-[#050508]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-px h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(125,183,255,0.35) 30%, rgba(124,92,252,0.35) 70%, transparent)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[320px] w-[860px] -translate-x-1/2"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(124,92,252,0.10) 0%, rgba(125,183,255,0.07) 35%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <div className="relative mx-auto w-full max-w-[1200px] px-5 pb-10 pt-16 md:px-8 md:pb-12 md:pt-20">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.55fr_1fr_1fr_1fr] lg:gap-12">
          {/* Brand column */}
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <ColonyLogo size={22} />
              <span className="font-heading text-[15px] font-semibold tracking-tight text-white">Colony Bridge</span>
            </div>
            <p className="mt-4 max-w-[340px] text-[13px] leading-relaxed text-white/52">
              AI operating workspace for coordinating goals, agents, workflows, and approvals in one place.
            </p>
            <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-300/85 shadow-[0_0_10px_rgba(167,139,250,0.65)]" />
              Private early access / Invitation only
            </p>
          </div>

          <FooterColumn heading="Product" links={productLinks} />
          <FooterColumn heading="Access" links={accessLinks} />
          <FooterColumn heading="Legal" links={legalLinks} />
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-5 border-t border-white/[0.05] pt-6 sm:flex-row sm:items-center">
          <p className="text-[12px] text-white/40">© 2026 Colony Bridge. All rights reserved.</p>
          <nav aria-label="Social links" className="flex items-center gap-2">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                target={s.href.startsWith('mailto:') ? undefined : '_blank'}
                rel={s.href.startsWith('mailto:') ? undefined : 'noreferrer noopener'}
                className="group grid h-9 w-9 place-items-center rounded-full border border-white/[0.08] bg-white/[0.025] text-white/55 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#7db7ff]/35 hover:bg-[#7db7ff]/[0.08] hover:text-white hover:shadow-[0_0_24px_rgba(125,183,255,0.18)]"
              >
                <s.icon className="h-3.5 w-3.5" strokeWidth={1.75} />
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ heading, links }: { heading: string; links: FooterLinkItem[] }) {
  return (
    <div className="min-w-0">
      <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-white/40">{heading}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <FooterLink link={link} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function FooterLink({ link }: { link: FooterLinkItem }) {
  const baseClasses =
    'inline-flex items-center gap-1.5 text-[13px] transition-colors duration-200';

  if (link.placeholder) {
    return (
      <span
        title="Coming soon"
        className={`${baseClasses} cursor-default text-white/35`}
      >
        {link.label}
        <span className="rounded-full border border-white/[0.06] bg-white/[0.025] px-1.5 py-px text-[9px] font-semibold uppercase tracking-[0.12em] text-white/35">
          Soon
        </span>
      </span>
    );
  }

  if (link.onClick) {
    return (
      <button
        type="button"
        onClick={link.onClick}
        className={`${baseClasses} text-left text-white/55 hover:text-white`}
      >
        {link.label}
      </button>
    );
  }

  return (
    <a
      href={link.href}
      target={link.external && !link.href?.startsWith('mailto:') ? '_blank' : undefined}
      rel={link.external && !link.href?.startsWith('mailto:') ? 'noreferrer noopener' : undefined}
      className={`${baseClasses} text-white/55 hover:text-white`}
    >
      {link.label}
    </a>
  );
}
