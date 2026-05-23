import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import {
  Boxes,
  BriefcaseBusiness,
  ChevronDown,
  Clock3,
  FileText,
  Layers3,
  LayoutTemplate,
  Map,
  Menu,
  Network,
  Plug,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Workflow,
  X,
  Bot,
} from 'lucide-react';
import { ColonyLogo } from '../../components/brand/BrandMarks';
import { normalizeEmail, validateEmail } from '../../lib/auth/mockAuth';
import type { Page } from '../../types/navigation';
import './LandingPage.css';

import { RevealOnScroll, AmbientGlow, EASE_OUT_EXPO } from './components/motion';
import { HeroInteractiveDemo } from './components/HeroInteractiveDemo';
import { HowColonyWorks } from './components/HowColonyWorks';
import { FeatureShowcase } from './components/FeatureShowcase';
import { ProductStories } from './components/ProductStories';
import { TryAGoal } from './components/TryAGoal';
import { MobileFileCapture } from './components/MobileFileCapture';
import { LogoMarquee } from './components/LogoMarquee';
import { StarBorder } from './components/StarBorder';
import Dock, { type DockItemData } from './components/Dock';

const glyph = {
  arrow: '→',
  dot: '•',
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
  { label: 'Pricing', id: 'comparison' },
  { label: 'About', id: 'team' },
];

const VIDEO_BG_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4';

export function LandingPage({ goTo, publicOnly = false }: { goTo: (page: Page) => void; publicOnly?: boolean }) {
  const heroRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const navLinks: NavLink[] = publicOnly ? NAV_LINKS.filter((l) => l.id !== 'early-access') : NAV_LINKS;
  const scrollToPrimaryCta = () =>
    document.getElementById(publicOnly ? 'try-a-goal' : 'early-access')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroContentY = useTransform(scrollYProgress, [0, 0.55], [0, -120]);
  const heroContentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const videoBgY = useTransform(scrollYProgress, [0, 1], [0, -70]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050508] text-white" style={{ fontFamily: "'Inter', 'DM Sans', sans-serif" }}>
      <StickyNav navLinks={navLinks} goTo={goTo} publicOnly={publicOnly} scrollToPrimaryCta={scrollToPrimaryCta} />

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative min-h-screen overflow-hidden bg-[#050508]">
        {/* Background video — dimmed so the product demo dominates */}
        <motion.div
          className="absolute inset-0 z-0"
          style={{ y: videoBgY, opacity: 0.45 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.45 }}
          transition={{ duration: 1.4, delay: 0.2, ease: EASE_OUT_EXPO }}
        >
          <video autoPlay loop muted playsInline className="h-full w-full object-cover" src={VIDEO_BG_URL} />
        </motion.div>

        {/* Gradient overlays — stronger so the demo card reads above the planet */}
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
          className="relative z-[2] mx-auto flex min-h-screen w-full max-w-[1320px] flex-col justify-center px-5 pb-20 pt-[120px] md:px-8 lg:pt-[140px]"
        >
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,42%)_minmax(0,58%)] lg:gap-10">
            {/* ── Left: marketing copy ───────────────────────── */}
            <div className="text-center lg:text-left">
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
                <span
                  className="font-normal text-white/95"
                  style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic' }}
                >
                  coordinate
                </span>
                <br />
                your AI workforce.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 22, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.9, delay: 0.28, ease: EASE_OUT_EXPO }}
                className="mx-auto mb-8 max-w-[520px] text-[16px] font-normal leading-[1.65] text-white/68 md:text-[17px] lg:mx-0"
              >
                Turn a single goal into AI teams, workflows, and review-ready deliverables — coordinated by AI Ant.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.44, ease: EASE_OUT_EXPO }}
                className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
              >
                <motion.button
                  onClick={scrollToPrimaryCta}
                  whileHover={reduce ? undefined : { y: -2, boxShadow: '0 0 0 1px rgba(255,255,255,0.38), 0 6px 44px rgba(255,255,255,0.3), 0 2px 12px rgba(0,0,0,0.22)' }}
                  whileTap={reduce ? undefined : { scale: 0.97 }}
                  transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                  style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.22), 0 4px 28px rgba(255,255,255,0.18), 0 2px 8px rgba(0,0,0,0.16)' }}
                  className="lp-btn-primary rounded-full px-7 py-3.5 text-[15px] font-semibold"
                >
                  Start Building
                </motion.button>
                <motion.button
                  onClick={() => document.getElementById('hero-demo')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  whileHover={reduce ? undefined : { y: -2 }}
                  whileTap={reduce ? undefined : { scale: 0.97 }}
                  transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                  className="lp-btn-secondary rounded-full px-7 py-3.5 text-[15px] font-medium backdrop-blur-sm"
                >
                  Try Interactive Demo
                </motion.button>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.6, ease: EASE_OUT_EXPO }}
                className="mt-5 text-[12.5px] text-white/40"
              >
                Built for founders, creators, and small teams.
              </motion.p>
            </div>

            {/* ── Right: interactive product demo ────────────── */}
            <div className="w-full">
              <HeroInteractiveDemo />
            </div>
          </div>
        </motion.div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-32 bg-gradient-to-t from-[#050508] to-transparent" />
      </section>

      {/* ── Content ── */}
      <div className="relative bg-[#050508]">
        <HowColonyWorks />
        <FeatureShowcase />
        <ProductStories />
        <MobileFileCapture />
        <TryAGoal />
        <LogoMarquee />
        <FeaturesSection />
        <BuildersSection />
        <ComparisonSection />
        <RoadmapSection />
        {!publicOnly && <EarlyAccessSection goTo={goTo} />}
      </div>

      <footer className="border-t border-white/[0.07] bg-[#050508] px-5 py-10 md:px-8">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-5 text-[13px] text-white/40 md:flex-row">
          <div className="flex items-center gap-2 text-white/85">
            <ColonyLogo size={20} />
            <span className="font-semibold tracking-tight">Colony Bridge</span>
          </div>
          <div className="flex flex-wrap justify-center gap-5">
            {navLinks.map((link) => (
              <a key={link.id} href={`#${link.id}`} className="transition-colors hover:text-white/65">
                {link.label}
              </a>
            ))}
          </div>
          <p>(c) 2025 Colony</p>
        </div>
      </footer>
    </div>
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
            {!publicOnly && (
              <button onClick={() => goTo('Login')} className="hidden rounded-md px-3 py-2 text-[13px] font-medium text-white/65 transition hover:text-white sm:block">
                Sign In
              </button>
            )}
            <button
              onClick={publicOnly ? scrollToPrimaryCta : () => goTo('Login')}
              className="lp-btn-navbar inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold"
            >
              Start Building
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
                {!publicOnly && (
                  <button
                    onClick={() => { setMobileOpen(false); goTo('Login'); }}
                    className="mt-1 flex items-center justify-between rounded-xl border-t border-white/[0.06] px-3 py-3 text-left text-[15px] font-medium text-white/65 transition hover:text-white"
                  >
                    Sign In
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

// ── Breathing frame — subtle scale loop around hero demo ─────────────────────
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
function FeatureIconBadge({ icon }: { icon: React.ReactNode }) {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.1] bg-white/[0.05] text-white/86 shadow-[0_10px_30px_rgba(0,0,0,0.28)]">
      {icon}
    </div>
  );
}

function FeaturesSection() {
  const features = [
    {
      title: 'Goal-First Builder',
      copy:
        'Describe the job in plain language and Colony turns it into a structured AI workflow. No node maze, no triggers, no technical setup.',
      icon: <Target className="h-[18px] w-[18px]" />,
    },
    {
      title: 'Visual Orchestration',
      copy:
        'See how agents are matched, what each one is doing, which model they use, and how work flows from one role to another in real time.',
      icon: <Network className="h-[18px] w-[18px]" />,
      badge: 'Visible routing',
    },
    {
      title: 'Human Approval by Default',
      copy:
        'Colony asks before risky actions — sending messages, exporting files, or using connected apps — so users stay in control.',
      icon: <ShieldCheck className="h-[18px] w-[18px]" />,
      badge: 'Approval-first',
    },
    {
      title: 'AI Ants for Real-World Inputs',
      copy:
        'Use screenshots, files, spreadsheets, and app or device context as input when direct API access is not available.',
      icon: <Layers3 className="h-[18px] w-[18px]" />,
      badge: 'Context aware',
    },
    {
      title: 'Explainable Timeline',
      copy:
        'Every step is visible in plain language. Review what happened, when, which agent handled it, and what output was produced.',
      icon: <Clock3 className="h-[18px] w-[18px]" />,
      timeline: [
        '09:00 Goal parsed',
        '09:01 Research Agent matched',
        '09:02 Analyst reviewed findings',
        '09:03 Draft prepared',
        '09:04 Approval requested',
      ],
    },
    {
      title: 'Smart Deliverables',
      copy:
        'Generate useful outputs — summaries, reports, research notes, structured drafts, and workflow results — ready to review and refine.',
      icon: <FileText className="h-[18px] w-[18px]" />,
    },
  ];

  return (
    <section id="features" className="px-5 py-28 md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <RevealOnScroll>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#7db7ff]">Features</p>
          <h2 className="mb-12 max-w-3xl text-[34px] font-semibold leading-tight tracking-tight text-white md:text-[44px]">
            Everything your AI team needs.
          </h2>
        </RevealOnScroll>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <RevealOnScroll key={feature.title} delay={index * 0.06} y={20}>
              <div className="card-premium group flex h-full min-h-[248px] flex-col rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <FeatureIconBadge icon={feature.icon} />
                  {'badge' in feature && feature.badge ? (
                    <span className="rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-white/62">
                      {feature.badge}
                    </span>
                  ) : null}
                </div>
                <h3 className="mb-3 text-[16px] font-semibold text-white">{feature.title}</h3>
                <p className="text-[13px] leading-relaxed text-white/62">{feature.copy}</p>
                {Array.isArray(feature.timeline) ? (
                  <div className="mt-5 space-y-2 rounded-2xl border border-white/[0.08] bg-[#07090d]/90 p-4 text-[12px] text-white/55">
                    {feature.timeline.map((line) => (
                      <div key={line} className="flex items-center gap-3">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#7db7ff]/75" />
                        <p>{line}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

function BuildersSection() {
  const team = [
    {
      initials: 'MO',
      name: 'Moss',
      role: 'Frontend, Business Development & Strategy',
      description:
        'Leads the frontend experience, product direction, business development, and strategic ideas for how Colony should feel, grow, and solve real user problems.',
      focus: ['Frontend', 'Business Development', 'Strategic Ideas', 'Product Direction', 'UI/UX'],
    },
    {
      initials: 'FP',
      name: 'Fais Putama',
      role: 'Backend, Database & AI Systems',
      description:
        'Focuses on backend architecture, database design, AI orchestration, model routing, agent logic, and making Colony workflows run reliably.',
      focus: ['Backend', 'Database', 'AI Systems', 'Model Routing', 'Agent Logic'],
    },
    {
      initials: 'DP',
      name: 'Design Partners',
      role: 'Early Users & Feedback',
      description:
        'We are working with early users and design partners to test real workflows, improve usability, and validate what Colony should become.',
      focus: ['Pilot Feedback', 'Real Use Cases', 'Workflow Testing', 'Product Validation'],
    },
  ];

  return (
    <section id="team" className="px-5 py-24 md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <RevealOnScroll>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#7db7ff]">Team</p>
          <h2 className="max-w-3xl text-[34px] font-semibold leading-tight tracking-tight text-white md:text-[44px]">
            A small team making AI agents easier to use.
          </h2>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-white/60">
            We are building Colony from a simple belief: AI agents should be useful, visible, and controllable for real users — not only developers.
          </p>
        </RevealOnScroll>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
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
      </div>
    </section>
  );
}

function ComparisonSection() {
  const rows = [
    ['Starting point', 'Start from nodes, triggers, APIs, or technical setup', 'Start by describing the job in natural language'],
    ['User experience', 'Built mainly for technical users or automation builders', 'Designed for non-technical users, small teams, and business owners'],
    ['Workflow clarity', 'Complex flows can be hard to understand', 'Visual AI teams, explainable timeline, and human-friendly language'],
    ['Data access', 'Often depends on APIs or manual integrations', 'Connectors and AI Ants for screenshots, files, and app data when APIs are unavailable'],
    ['Safety', 'Automation may run without clear human checkpoints', 'Approval-first by default before risky actions'],
    ['Debugging', 'Logs can feel technical', 'Agent conversations and a plain-language timeline'],
  ];

  return (
    <section id="comparison" className="px-5 py-24 md:px-8">
      <RevealOnScroll className="mx-auto max-w-[1200px]">
        <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.18em] text-[#7db7ff]">Comparison</p>
        <h2 className="mx-auto max-w-4xl text-center text-[34px] font-semibold leading-tight tracking-tight text-white md:text-[44px]">
          A different starting point than traditional builders.
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-center text-[15px] leading-relaxed text-white/55">
          Tools like n8n, OpenClaw, and Dify are great for technical teams. Colony focuses on making AI agent workflows easier, safer, and more understandable.
        </p>
        <div className="mt-10 overflow-x-auto overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
          <div className="grid min-w-[760px] grid-cols-[1.1fr_1.25fr_1.25fr] border-b border-white/[0.07] text-sm">
            {['', 'Traditional workflow builders', 'Colony'].map((header, index) => (
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
  short: string;
  title: string;
  items: string[];
  icon: React.ComponentType<{ className?: string }>;
};

function RoadmapSection() {
  const stages: PhaseStage[] = [
    {
      short: 'MVP',
      title: 'Stage 1: MVP',
      items: ['AI Agent Team Builder', 'Project-based workspace', 'Visual canvas', 'AI Team Chat', 'Human approval', 'Mock reports and workflow runs'],
      icon: Rocket,
    },
    {
      short: 'AI Ants',
      title: 'Stage 2: AI Ants',
      items: ['Screenshot and file reading', 'Read-only mobile/app data', 'Structured extraction', 'Safer data collection without APIs'],
      icon: Bot,
    },
    {
      short: 'Connectors',
      title: 'Stage 3: Connectors',
      items: ['Google Sheets', 'File Upload', 'Gmail', 'LINE', 'Google Drive', 'Notion', 'Delivery platform workflows'],
      icon: Plug,
    },
    {
      short: 'Templates',
      title: 'Stage 4: Templates',
      items: ['Restaurant Profit Agent', 'Creator Workflow', 'File-to-Report', 'Customer Support', 'Research Assistant', 'Custom workflow templates'],
      icon: LayoutTemplate,
    },
    {
      short: 'Team',
      title: 'Stage 5: Team',
      items: ['Shared projects', 'Roles and permissions', 'Version history', 'Approval history', 'Team workspace'],
      icon: Users,
    },
  ];

  const dockItems: DockItemData[] = stages.map((stage, idx) => ({
    icon: <stage.icon className="h-5 w-5" />,
    label: `Phase ${idx + 1} · ${stage.short}`,
    onClick: () =>
      document.getElementById(`phase-${idx + 1}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
    active: idx === CURRENT_PHASE_INDEX,
  }));

  return (
    <section id="roadmap" className="px-5 py-28 md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <RevealOnScroll>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#7db7ff]">Roadmap</p>
          <h2 className="max-w-3xl text-[34px] font-semibold leading-[1.08] tracking-tight text-white md:text-[44px]">
            Where Colony is, and where it&apos;s going.
          </h2>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-white/62">
            We are building Colony step by step. Here&apos;s every phase — and the one we&apos;re shipping right now.
          </p>
        </RevealOnScroll>

        {/* Phase dock with progress track */}
        <RevealOnScroll className="mt-14" delay={0.08}>
          <PhaseDock stages={stages} dockItems={dockItems} currentIndex={CURRENT_PHASE_INDEX} />
        </RevealOnScroll>

        {/* Phase cards */}
        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {stages.map((stage, index) => {
            const status: 'done' | 'current' | 'upcoming' =
              index < CURRENT_PHASE_INDEX ? 'done' : index === CURRENT_PHASE_INDEX ? 'current' : 'upcoming';
            return (
              <RevealOnScroll key={stage.title} delay={index * 0.06} y={20} className="h-full">
                <PhaseCard stage={stage} index={index} status={status} />
              </RevealOnScroll>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PhaseDock({
  stages,
  dockItems,
  currentIndex,
}: {
  stages: PhaseStage[];
  dockItems: DockItemData[];
  currentIndex: number;
}) {
  const progress = stages.length > 1 ? currentIndex / (stages.length - 1) : 0;
  return (
    <div className="relative">
      {/* Soft glow under the dock */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-32 w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: 'radial-gradient(ellipse, rgba(124,92,252,0.16) 0%, transparent 65%)',
          filter: 'blur(32px)',
        }}
      />

      {/* Progress track behind the dock */}
      <div className="relative mx-auto max-w-[640px] px-6">
        <div className="absolute inset-x-6 top-1/2 h-px -translate-y-1/2 bg-white/[0.07]" aria-hidden />
        <motion.div
          aria-hidden
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: progress }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1.1, ease: EASE_OUT_EXPO }}
          style={{ transformOrigin: '0% 50%' }}
          className="absolute inset-x-6 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-[#7c5cfc] via-[#7db7ff] to-[#00d4aa]"
        />

        {/* The Dock itself */}
        <div className="relative flex justify-center">
          <Dock
            items={dockItems}
            panelHeight={68}
            baseItemSize={50}
            magnification={72}
            distance={180}
            dockHeight={68}
            spring={{ mass: 0.1, stiffness: 160, damping: 13 }}
          />
        </div>
      </div>

      {/* Phase labels below */}
      <div className="mx-auto mt-3 grid max-w-[640px] grid-cols-5 px-6">
        {stages.map((stage, idx) => {
          const isCurrent = idx === currentIndex;
          const isDone = idx < currentIndex;
          return (
            <div key={stage.short} className="flex flex-col items-center text-center">
              <p
                className={`text-[10.5px] font-semibold uppercase tracking-[0.14em] ${
                  isCurrent ? 'text-white' : isDone ? 'text-[#00d4aa]/85' : 'text-white/45'
                }`}
              >
                {stage.short}
              </p>
              {isCurrent && (
                <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-[#7db7ff]/30 bg-[#7db7ff]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[#bcd9ff]">
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                    className="h-1 w-1 rounded-full bg-[#bcd9ff]"
                  />
                  Now
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PhaseCard({
  stage,
  index,
  status,
}: {
  stage: { title: string; items: string[] };
  index: number;
  status: 'done' | 'current' | 'upcoming';
}) {
  const card = (
    <div
      className={`card-premium relative h-full overflow-hidden rounded-[22px] border p-6 ${
        status === 'current'
          ? 'border-[#7db7ff]/30 bg-gradient-to-b from-white/[0.05] to-white/[0.02]'
          : status === 'done'
          ? 'border-[#00d4aa]/20 bg-white/[0.025]'
          : 'border-white/[0.07] bg-white/[0.025]'
      }`}
    >
      {status === 'current' && (
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
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold ${
                status === 'current'
                  ? 'bg-[#7db7ff]/20 text-white shadow-[0_0_0_1px_rgba(125,183,255,0.35),0_0_24px_rgba(125,183,255,0.35)]'
                  : status === 'done'
                  ? 'bg-[#00d4aa]/15 text-[#00d4aa]'
                  : 'bg-white/[0.05] text-white/55'
              }`}
            >
              {status === 'done' ? '✓' : index + 1}
            </span>
            <h3 className="text-[15px] font-semibold leading-tight text-white">{stage.title}</h3>
          </div>
        </div>
        {status === 'current' && (
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#7db7ff]/30 bg-[#7db7ff]/[0.08] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#bcd9ff]">
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="h-1.5 w-1.5 rounded-full bg-[#bcd9ff]"
            />
            Currently shipping
          </div>
        )}
        {status === 'done' && (
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#00d4aa]/25 bg-[#00d4aa]/[0.08] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#00d4aa]">
            Shipped
          </div>
        )}
        <div className="space-y-2">
          {stage.items.map((item) => (
            <p
              key={item}
              className={`text-[13px] leading-relaxed ${
                status === 'upcoming' ? 'text-white/45' : 'text-white/72'
              }`}
            >
              {glyph.dot} {item}
            </p>
          ))}
        </div>
      </div>
    </div>
  );

  if (status === 'current') {
    return (
      <StarBorder as="div" color="#a8c5ff" speed="5.5s" thickness={1} className="h-full">
        {card}
      </StarBorder>
    );
  }
  return card;
}

function EarlyAccessSection({ goTo }: { goTo: (page: Page) => void }) {
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState('Founder / operator');
  const [useFor, setUseFor] = React.useState('');
  const [task, setTask] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateEmail(email)) return;
    try {
      const entries = JSON.parse(localStorage.getItem('colony_early_access') ?? '[]') as Array<{ email: string; role: string; useFor?: string; task?: string; createdAt: string }>;
      localStorage.setItem(
        'colony_early_access',
        JSON.stringify([{ email: normalizeEmail(email), role, useFor, task, createdAt: new Date().toISOString() }, ...entries]),
      );
    } catch {
      /* ignore */
    }
    setSubmitted(true);
  };

  return (
    <section id="early-access" className="px-5 py-28 md:px-8">
      <RevealOnScroll className="mx-auto max-w-[1100px] overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.02] p-8 md:p-12">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#00d4aa]">Early access</p>
            <h2 className="mb-5 text-[34px] font-semibold leading-[1.08] tracking-tight text-white md:text-[44px]">
              Help shape Colony before launch.
            </h2>
            <p className="max-w-xl text-[15px] leading-relaxed text-white/62 md:text-[16px]">
              We&apos;re looking for thoughtful early users, design partners, and teams who want to shape a safer, friendlier way to work with AI.
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
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <p className="text-[16px] font-semibold text-white">You&apos;re on the early access list.</p>
                  <p className="text-[13px] text-white/55">We&apos;ll be in touch as we open more seats.</p>
                </motion.div>
              ) : (
                <>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/35">Request access</p>
                  <FormField label="Email address">
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      placeholder="you@company.com"
                      className="form-input"
                    />
                  </FormField>
                  <FormField label="What best describes you?">
                    <div className="form-select-wrap">
                      <BriefcaseBusiness className="form-select-icon" />
                      <select value={role} onChange={(e) => setRole(e.target.value)} className="form-select">
                        <option className="bg-[#08080d] text-white">Founder / operator</option>
                        <option className="bg-[#08080d] text-white">Small business team</option>
                        <option className="bg-[#08080d] text-white">Creator / marketer</option>
                        <option className="bg-[#08080d] text-white">Developer / AI builder</option>
                      </select>
                      <ChevronDown className="form-select-chevron" />
                    </div>
                  </FormField>
                  <FormField label="What would you use Colony for?">
                    <input
                      value={useFor}
                      onChange={(e) => setUseFor(e.target.value)}
                      type="text"
                      placeholder="e.g. weekly reports, content workflows…"
                      className="form-input"
                    />
                  </FormField>
                  <FormField label="Optional · one task you want Colony to handle">
                    <textarea
                      value={task}
                      onChange={(e) => setTask(e.target.value)}
                      placeholder="Describe a real task you face today."
                      rows={3}
                      className="form-input resize-none"
                    />
                  </FormField>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <motion.button
                      type="submit"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
                      className="lp-btn-primary flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
                    >
                      Join Early Access <span>{glyph.arrow}</span>
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => goTo('Login')}
                      className="lp-btn-secondary flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium hover:-translate-y-0.5"
                    >
                      Open Demo
                    </button>
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
