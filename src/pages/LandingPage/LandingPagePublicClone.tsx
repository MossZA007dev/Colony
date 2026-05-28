import React, { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Bot, Brain, BriefcaseBusiness, ChevronDown, Clock3, FileText, Layers3, Network, ShieldCheck, Target, Workflow } from 'lucide-react';
import { ColonyLogo } from '../../components/brand/BrandMarks';
import { ProviderLogo } from '../../components/model/ProviderLogo';
import { SUPPORTED_MODELS } from '../../lib/modelCatalog';
import { normalizeEmail, validateEmail } from '../../lib/auth/mockAuth';
import type { Page } from '../../types/navigation';
import './LandingPage.css';

const glyph = {
  bowl: '\uD83C\uDF5C',
  bag: '\uD83D\uDED2',
  folder: '\uD83D\uDCC1',
  board: '\uD83D\uDCCB',
  writer: '\u270D\uFE0F',
  arrow: '\u2192',
  dot: '\u2022',
};

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.add('is-visible');
          observer.unobserve(node);
        }
      },
      { threshold: 0.16 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal-up ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function GradientButton({ children, onClick, className = '' }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`group inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 font-heading text-sm font-bold text-white shadow-[0_18px_50px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1a1a2e] hover:shadow-[0_22px_70px_rgba(0,0,0,0.16)] ${className}`}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, onClick, className = '' }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-black/15 bg-transparent px-6 py-3 text-sm font-medium text-ink transition-all duration-300 hover:-translate-y-0.5 hover:border-black/30 hover:bg-black/[0.03] hover:shadow-[0_14px_42px_rgba(0,0,0,0.08)] ${className}`}
    >
      {children}
    </button>
  );
}

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

const landingNavLinks = [
  'Features',
  'Models',
  'Team',
  'Pilot Users',
  'Use Cases',
  'Comparison',
  'Roadmap',
  'Early Access',
];

const VIDEO_BG_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4';

export function LandingPage({ goTo, publicOnly = false }: { goTo: (page: Page) => void; publicOnly?: boolean }) {
  const heroRef = useRef<HTMLElement>(null);
  const navLinks = publicOnly ? landingNavLinks.filter((link) => link !== 'Early Access') : landingNavLinks;
  const scrollToPrimaryCta = () => document.getElementById(publicOnly ? 'pilot-users' : 'early-access')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  // Hero text lifts + fades as you scroll
  const heroContentY       = useTransform(scrollYProgress, [0, 0.55], [0, -160]);
  const heroContentOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);
  // Video scrolls at a slower rate for parallax depth
  const videoBgY           = useTransform(scrollYProgress, [0, 1],    [0, -70]);

  // ── page root ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050508] text-white" style={{ fontFamily: "'Inter', 'DM Sans', sans-serif" }}>

      {/* ── Navbar ── */}
      <nav className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-white/[0.07] bg-[#050508]/85 px-6 py-3.5 backdrop-blur-xl md:px-16">
        <div className="flex items-center gap-8 md:gap-16">
          <button onClick={() => goTo('Landing')} className="flex items-center gap-2.5">
            <ColonyLogo size={32} />
            <span className="text-[17px] font-semibold tracking-tight text-white">Colony</span>
          </button>
          <div className="hidden items-center gap-0.5 md:flex">
            {navLinks.map((link) => (
              <a key={link} href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
                className="rounded-md px-3 py-2 text-[13px] font-medium text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white/90">
                {link}
              </a>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {!publicOnly && (
            <button onClick={() => goTo('Login')}
              className="lp-btn-ghost hidden rounded-md px-3.5 py-2 text-[13px] font-medium sm:block">
              Sign In
            </button>
          )}
          <button onClick={publicOnly ? scrollToPrimaryCta : () => goTo('Login')}
            className="lp-btn-navbar rounded-lg px-4 py-2 text-[13px] font-semibold">
            Start Building →
          </button>
        </div>
      </nav>

      {/* ════════════════════════════════════════════════════════
          Hero — video sits behind text as a proper background
          ════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen overflow-hidden bg-[#050508]">

        {/* ── Layer 0: background video (absolute, z-0) ── */}
        <motion.div
          className="absolute inset-0 z-0"
          style={{ y: videoBgY }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }}
        >
          <video
            autoPlay loop muted playsInline
            className="h-full w-full object-cover"
            src={VIDEO_BG_URL}
          />
        </motion.div>

        {/* ── Layer 1: gradient overlay (absolute, z-[1]) ── */}
        <div className="pointer-events-none absolute inset-0 z-[1]">
          {/* Radial centre dim — stops video from overwhelming text */}
          <div className="absolute inset-0 bg-[#050508]/65" />
          {/* Bottom-to-top dark fade into next section */}
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#050508] to-transparent" />
          {/* Top bar fade so nav reads cleanly */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#050508]/70 to-transparent" />
        </div>

        {/* ── Layer 2: hero text content (relative, z-[2]) ── */}
        <motion.div
          style={{ y: heroContentY, opacity: heroContentOpacity }}
          className="relative z-[2] flex min-h-screen flex-col items-center justify-center px-5 pb-20 pt-[68px] text-center"
        >
          {/* Tag pill */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0 }}
            className="liquid-glass mb-7 inline-flex items-center gap-2 rounded-lg px-3 py-2"
          >
            <span className="rounded-md px-2 py-0.5 text-[12px] font-semibold" style={{ backgroundColor: '#ffffff', color: '#050508' }}>New</span>
            <span className="text-[13px] font-medium text-white/70">Now in Early Access</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="mb-5 max-w-3xl text-[clamp(40px,6.5vw,72px)] font-semibold leading-[1.1] tracking-[-0.03em] text-white"
          >
            Build AI teams.<br />
            By describing{' '}
            <span
              className="font-normal text-white/95"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic' }}
            >
              the job.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.2 }}
            className="mb-9 max-w-[420px] text-[17px] font-normal leading-[1.65] text-white/70"
          >
            Colony turns a goal into a routed AI workflow: the right mode, the right agents, the right tools, and the right model for each job.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.3 }}
            className="flex flex-col items-center gap-3 sm:flex-row"
          >
            <motion.button
              onClick={scrollToPrimaryCta}
              whileHover={{ scale: 1.03, y: -2, boxShadow: '0 0 0 1px rgba(255,255,255,0.38), 0 6px 44px rgba(255,255,255,0.3), 0 2px 12px rgba(0,0,0,0.22)' }}
              whileTap={{ scale: 0.97 }}
              style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.22), 0 4px 28px rgba(255,255,255,0.18), 0 2px 8px rgba(0,0,0,0.16)' }}
              className="lp-btn-primary rounded-full px-8 py-3.5 text-[15px] font-semibold"
            >
              Get Started for Free
            </motion.button>
            {!publicOnly && (
              <motion.button
                onClick={() => goTo('Login')}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="lp-btn-secondary rounded-full px-8 py-3.5 text-[15px] font-medium backdrop-blur-sm"
              >
                Join Early Access
              </motion.button>
            )}
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.38 }}
            className="mt-8 flex items-center gap-3 text-[13px] text-white/62"
          >
            <div className="flex -space-x-2">
              {['EV', 'BC', 'DP'].map((name, i) => (
                <span
                  key={name}
                  className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#050508] bg-white/15 text-[9px] font-bold text-white/90 ring-1 ring-white/[0.15]"
                  style={{ transform: `translateX(${i * -2}px)` }}
                >
                  {name}
                </span>
              ))}
            </div>
            <span>Trusted by early teams who want AI workflows with clarity, control, and human approval.</span>
          </motion.div>
        </motion.div>

        {/* ── Layer 3: bottom edge fade (z-[3]) ── */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-24 bg-gradient-to-t from-[#050508] to-transparent" />
      </section>

      {/* ── Orchestration preview ── */}
      <OrchestrationPreviewSection />

      {/* ── Content sections ── */}
      <div className="bg-[#050508]">
        <TestimonialSection />
        <FeaturesSection />
        <ModelSupportSection />
        <BuildersSection />
        <PilotUsersSection goTo={goTo} publicOnly={publicOnly} />
        <ComparisonSection />
        <UseCasesSection />
        <RoadmapSection />
        {!publicOnly && <EarlyAccessSection goTo={goTo} />}
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.07] bg-[#050508] px-5 py-10 md:px-8">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-5 text-[13px] text-white/40 md:flex-row">
          <div className="flex items-center gap-2 text-white/85">
            <ColonyLogo size={20} />
            <span className="font-semibold tracking-tight">Colony</span>
          </div>
          <div className="flex flex-wrap justify-center gap-5">
            {navLinks.map((link) => (
              <a key={link} href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
                className="transition-colors hover:text-white/65">
                {link}
              </a>
            ))}
          </div>
          <p>(c) 2025 Colony</p>
        </div>
      </footer>
    </div>
  );
}

// ── Testimonial with scroll-driven word reveal ───────────────────────────────

function FeatureIconBadge({ icon }: { icon: React.ReactNode }) {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.1] bg-white/[0.05] text-white/86 shadow-[0_10px_30px_rgba(0,0,0,0.28)]">
      {icon}
    </div>
  );
}

function AgentRolePill({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white/72">
      {label}
    </div>
  );
}

function AgentFlowNode({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="min-w-[148px] rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm">
      <p className="text-[12px] font-semibold text-white/90">{title}</p>
      <p className="mt-1 text-[11px] leading-5 text-white/48">{subtitle}</p>
    </div>
  );
}

function OrchestrationPreviewSection() {
  const nodes = [
    ['AI Ant Scout', 'Goal parser'],
    ['Research Agent', 'Market context'],
    ['Strategy Analyst', 'Plan structure'],
    ['Writer Agent', 'Draft output'],
    ['Creative Agent', 'Asset concepts'],
    ['Approval Guard', 'Final check'],
  ] as const;

  return (
    <section className="px-5 py-18 md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <Reveal>
          <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.22)] md:p-7">
            <div className="grid gap-6 lg:grid-cols-[1.05fr,1.35fr]">
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7db7ff]">You Describe The Job</p>
                  <div className="mt-3 rounded-2xl border border-white/[0.08] bg-[#06070b]/90 px-4 py-4">
                    <p className="text-[14px] leading-7 text-white/84">
                      Research my competitors, draft a launch plan, generate creative assets, and ask before sending anything.
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">Colony Orchestrates This</p>
                  <p className="mt-3 text-[13px] leading-6 text-white/58">
                    Colony matches the right agents, assigns responsibilities, and keeps the workflow reviewable.
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#07090d]/90 p-4 md:p-5">
                <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/42">Workflow Preview</p>
                    <p className="mt-2 text-[15px] font-semibold text-white">Agent sequence</p>
                  </div>
                  <div className="hidden items-center gap-2 md:flex">
                    <AgentRolePill label="Visible routing" />
                    <AgentRolePill label="Approval-first" />
                  </div>
                </div>

                <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                  {nodes.map(([title, subtitle], index) => (
                    <div key={title} className="flex items-center gap-3">
                      <AgentFlowNode title={title} subtitle={subtitle} />
                      {index < nodes.length - 1 ? <div className="hidden h-px w-7 bg-gradient-to-r from-white/22 to-transparent md:block" /> : null}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2 md:hidden">
                  <AgentRolePill label="Visible routing" />
                  <AgentRolePill label="Approval-first" />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function TestimonialSection() {
  return (
    <section className="px-5 py-24 md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <Reveal>
          <div className="rounded-[30px] border border-white/[0.08] bg-white/[0.03] px-6 py-8 shadow-[0_28px_80px_rgba(0,0,0,0.24)] md:px-10 md:py-10">
            <div className="max-w-4xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7db7ff]">Why Colony</p>
              <h2 className="mt-4 max-w-3xl text-[30px] font-semibold leading-tight tracking-tight text-white md:text-[40px]">
                AI workflows should feel clear, controllable, and human.
              </h2>
              <p className="mt-5 max-w-3xl text-[15px] leading-8 text-white/66">
                Most workflow builders are powerful, but still too technical for many real users. Colony is designed to make AI teams understandable, visible, and safe so people can build workflows by describing the job, not by wiring complicated systems.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-4 border-t border-white/[0.08] pt-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-full border border-white/[0.12] bg-white/[0.06] text-[12px] font-semibold text-white">
                  MF
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-white">Moss &amp; Fais</p>
                  <p className="text-[13px] text-white/52">Colony Team</p>
                </div>
              </div>
              <p className="max-w-xl text-[13px] leading-6 text-white/48">
                Building Colony for real-world users, small teams, and practical AI work.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      title: 'Goal-First Builder',
      copy:
        'Describe the job in plain language and Colony turns it into a structured AI workflow. No complex setup, no node maze, and no technical knowledge required.',
      icon: <Target className="h-[18px] w-[18px]" />,
    },
    {
      title: 'Visual AI Orchestration',
      copy:
        'See how agents are matched, what each one is doing, which model they use, and how work flows from one role to another in real time.',
      icon: <Network className="h-[18px] w-[18px]" />,
      badge: 'Visible routing',
    },
    {
      title: 'Human Approval by Default',
      copy:
        'Colony asks before risky actions like sending messages, exporting files, or using connected apps so users stay in control.',
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
        'Every step is visible in plain language. Review what happened, when it happened, which agent handled it, and what output was produced.',
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
        'Generate useful outputs like summaries, reports, research notes, structured drafts, and workflow results that are ready to review and refine.',
      icon: <FileText className="h-[18px] w-[18px]" />,
    },
  ];

  return (
    <section id="features" className="px-5 py-24 md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <Reveal>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#4f9eff]">Features</p>
          <h2 className="mb-12 text-[34px] font-semibold leading-tight tracking-tight text-white md:text-[42px]">Everything your AI team needs</h2>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 70}>
              <div className="group flex h-full min-h-[248px] flex-col rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.12] hover:bg-white/[0.05] hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
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
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ModelSupportSection() {
  const providers = Array.from(new Map(SUPPORTED_MODELS.map((model) => [model.providerLabel, model])).values())
    .filter((model) => ['OpenAI', 'Gemini', 'DeepSeek', 'Perplexity', 'Anthropic', 'ElevenLabs', 'Runway', 'Pika', 'Colony Bridge'].includes(model.providerLabel));
  const loop = [...providers, ...providers];

  return (
    <section id="models" className="px-5 py-24 md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <Reveal>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#4f9eff]">Models</p>
          <h2 className="max-w-3xl text-[34px] font-semibold leading-tight tracking-tight text-white md:text-[42px]">Colony is model-flexible by design</h2>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-white/62">Users see simple skills first. Behind the scenes, Colony routes each task to the provider/model that fits the capability, cost, quality, and approval level.</p>
        </Reveal>

        <Reveal delay={90} className="mt-10 overflow-hidden rounded-[24px] border border-white/[0.07] bg-white/[0.02] py-5">
          <div className="flex w-max animate-[marquee_34s_linear_infinite] gap-3 px-5">
            {loop.map((model, index) => (
              <div key={`${model.id}-${index}`} className="flex min-w-[190px] items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3">
                <ProviderLogo provider={model.logoProvider ?? model.provider} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-white/86">{model.providerLabel}</p>
                  <p className="truncate text-[11px] text-white/42">{model.shortName} · {model.tags.slice(0, 2).join(' · ')}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            ['Skills first', 'Users choose outcomes and capabilities, not model names.'],
            ['Advanced control', 'Power users can override provider/model per agent or skill.'],
            ['Approval aware', 'Tool actions and costly generation stay visible before execution.'],
          ].map(([title, copy], index) => (
            <Reveal key={title} delay={140 + index * 70}>
              <div className="h-full rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6">
                <h3 className="text-[16px] font-semibold text-white">{title}</h3>
                <p className="mt-3 text-[13px] leading-relaxed text-white/58">{copy}</p>
              </div>
            </Reveal>
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
      role: 'Frontend, Business Development & Strategic Ideas',
      description: 'Leads the frontend experience, product direction, business development, and strategic ideas for how Colony should feel, grow, and solve real user problems.',
      focus: ['Frontend', 'Business Development', 'Strategic Ideas', 'Product Direction', 'UI/UX'],
    },
    {
      initials: 'FP',
      name: 'Fais Putama',
      role: 'Backend, Database & AI Systems',
      description: 'Focuses on backend architecture, database design, AI orchestration, model routing, agent logic, and making Colony workflows run reliably.',
      focus: ['Backend', 'Database', 'AI Systems', 'Model Routing', 'Agent Logic'],
    },
    {
      initials: 'DP',
      name: 'Design Partners',
      role: 'Early Users & Feedback',
      description: 'We are working with early users and design partners to test real workflows, improve usability, and validate what Colony should become.',
      focus: ['Pilot Feedback', 'Real Use Cases', 'Workflow Testing', 'Product Validation'],
    },
  ];

  return (
    <section id="team" className="px-5 py-24 md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <Reveal>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#4f9eff]">Team</p>
          <h2 className="max-w-3xl text-[34px] font-semibold leading-tight tracking-tight text-white md:text-[42px]">Built by a small team making AI agents easier to use</h2>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-white/62">We are building Colony from a simple belief: AI agents should be useful, visible, and controllable for real users — not only developers.</p>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {team.map((member, index) => (
            <Reveal key={member.name} delay={index * 80}>
              <div className="flex h-full flex-col rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.12] hover:bg-white/[0.05]">
                <div className="mb-5 flex items-center gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/[0.12] bg-white/[0.07] text-base font-bold text-white">
                    {member.initials}
                  </div>
                  <div>
                    <h3 className="text-[17px] font-semibold text-white">{member.name}</h3>
                    <p className="text-[13px] font-medium text-[#4f9eff]">{member.role}</p>
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
            </Reveal>
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
    ['Data access', 'Often depends on APIs or manual integrations', 'Supports connectors and AI Ants for screenshots, files, and app data when APIs are unavailable'],
    ['Safety', 'Automation may run without clear human checkpoints', 'Approval-first by default before risky actions'],
    ['Debugging', 'Logs can feel technical', 'Agent conversations and plain-language timeline'],
  ];

  return (
    <section id="comparison" className="px-5 py-24 md:px-8">
      <Reveal className="mx-auto max-w-[1200px]">
        <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.18em] text-[#4f9eff]">Comparison</p>
        <h2 className="mx-auto max-w-4xl text-center text-[34px] font-semibold leading-tight tracking-tight text-white md:text-[42px]">How Colony is different from traditional workflow builders</h2>
        <p className="mx-auto mt-4 max-w-4xl text-center text-[15px] leading-relaxed text-white/60">Powerful automation tools like n8n, OpenClaw, and Dify are great for technical teams. Colony focuses on making AI agent workflows easier, safer, and more understandable for non-technical users.</p>
        <div className="mt-10 overflow-x-auto overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
          <div className="grid min-w-[760px] grid-cols-[1.1fr_1.25fr_1.25fr] border-b border-white/[0.07] text-sm">
            {['', 'Traditional workflow builders', 'Colony'].map((header, index) => (
              <div key={header} className={`p-4 font-semibold ${index === 2 ? 'bg-[#4f9eff]/10 text-[#4f9eff]' : 'text-white/70'}`}>
                {header}
              </div>
            ))}
          </div>
          <div className="min-w-[760px]">
            {rows.map((row) => (
              <div key={row[0]} className="grid grid-cols-[1.1fr_1.25fr_1.25fr] border-b border-white/[0.05] last:border-b-0">
                <div className="p-4 text-[13px] font-semibold text-white/85">{row[0]}</div>
                <div className="p-4 text-[13px] leading-relaxed text-white/48">{row[1]}</div>
                <div className="bg-[#4f9eff]/[0.06] p-4 text-[13px] leading-relaxed text-white/80">{row[2]}</div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function PilotUsersSection({ goTo, publicOnly = false }: { goTo: (page: Page) => void; publicOnly?: boolean }) {
  const groups = [
    {
      title: 'Restaurant / Delivery',
      copy: 'Test AI agents that summarize sales, GP fees, VAT, orders, and daily profit from screenshots or files.',
      icon: glyph.bowl,
    },
    {
      title: 'Creators',
      copy: 'Build AI workflows for research, scripts, captions, content planning, and approval.',
      icon: glyph.writer,
    },
    {
      title: 'SMEs / Teams',
      copy: 'Turn files, spreadsheets, and repeated tasks into explainable AI workflows.',
      icon: glyph.board,
    },
  ];

  return (
    <section id="pilot-users" className="px-5 py-24 md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <Reveal className="overflow-hidden rounded-[28px] border border-white/[0.07] bg-white/[0.02] p-8 md:p-12">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#00d4aa]">Pilot users</p>
          <h2 className="max-w-3xl text-[34px] font-semibold leading-tight tracking-tight text-white md:text-[42px]">Looking for pilot users and design partners</h2>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-white/62">We are opening early access for people and teams who want to shape the future of AI agent workflows.</p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {groups.map((group, index) => (
              <Reveal key={group.title} delay={index * 80}>
                <div className="h-full rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 transition-all hover:border-white/[0.12] hover:bg-white/[0.05]">
                  <span className="mb-5 block text-3xl">{group.icon}</span>
                  <h3 className="text-[20px] font-semibold text-white">{group.title}</h3>
                  <p className="mt-3 text-[13px] leading-relaxed text-white/62">{group.copy}</p>
                </div>
              </Reveal>
            ))}
          </div>
          {!publicOnly && (
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => goTo('Login')}
                className="lp-btn-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold hover:-translate-y-0.5">
                Become a Pilot User <span>{glyph.arrow}</span>
              </button>
              <button onClick={() => goTo('Login')}
                className="lp-btn-secondary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium hover:-translate-y-0.5">
                Join Early Access
              </button>
              <button onClick={() => goTo('Login')}
                className="lp-btn-secondary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium hover:-translate-y-0.5">
                Contact the Team
              </button>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}

function UseCasesSection() {
  const cases = [
    {
      icon: glyph.bowl,
      title: 'Restaurant & Delivery Owners',
      copy: 'Connect LINE MAN, Grab, or upload screenshots. Get daily profit reports automatically.',
    },
    {
      icon: glyph.bag,
      title: 'Online Sellers & Creators',
      copy: 'Track orders, plan content, reply to customers - your AI team handles the routine.',
    },
    {
      icon: glyph.folder,
      title: 'File-to-Report Teams',
      copy: 'Upload Excel, PDF, or screenshots. Get clean summaries and business insights.',
    },
  ];

  return (
    <section id="use-cases" className="px-5 py-24 md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <Reveal>
          <h2 className="mb-10 text-center text-[34px] font-semibold leading-tight tracking-tight text-white md:text-[42px]">Built for real business owners</h2>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-3">
          {cases.map((item, index) => (
            <Reveal key={item.title} delay={index * 90}>
              <div className="h-full rounded-2xl border border-white/[0.07] bg-white/[0.03] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.12] hover:bg-white/[0.05]">
                <span className="mb-6 block text-4xl">{item.icon}</span>
                <h3 className="mb-3 text-[20px] font-semibold text-white">{item.title}</h3>
                <p className="text-[13px] leading-relaxed text-white/62">{item.copy}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function RoadmapSection() {
  const stages = [
    {
      title: 'Stage 1: MVP',
      items: ['AI Agent Team Builder', 'Project-based workspace', 'Visual canvas', 'AI Team Chat', 'Human approval', 'Mock reports and workflow runs'],
    },
    {
      title: 'Stage 2: AI Ants',
      items: ['Screenshot and file reading', 'Read-only mobile/app data collection', 'Structured extraction', 'Safer data collection without relying only on APIs'],
    },
    {
      title: 'Stage 3: Connectors',
      items: ['Google Sheets', 'File Upload', 'Gmail', 'LINE', 'Google Drive', 'Notion', 'Delivery platform workflows'],
    },
    {
      title: 'Stage 4: Template Marketplace',
      items: ['Restaurant Profit Agent', 'Creator Workflow', 'File-to-Report', 'Customer Support', 'Research Assistant', 'Custom workflow templates'],
    },
    {
      title: 'Stage 5: Team Collaboration',
      items: ['Shared projects', 'Roles and permissions', 'Version history', 'Approval history', 'Team workspace'],
    },
  ];

  return (
    <section id="roadmap" className="px-5 py-24 md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <Reveal>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#4f9eff]">Roadmap</p>
          <h2 className="max-w-3xl text-[34px] font-semibold leading-tight tracking-tight text-white md:text-[42px]">Roadmap</h2>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-white/62">We are building Colony step by step, starting with a focused MVP and expanding into a full AI agent workspace.</p>
        </Reveal>
        <div className="mt-10 grid gap-4 lg:grid-cols-5">
          {stages.map((stage, index) => (
            <Reveal key={stage.title} delay={index * 70}>
              <div className="h-full rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.12] hover:bg-white/[0.05]">
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#4f9eff]/10 text-sm font-bold text-[#4f9eff]">{index + 1}</span>
                  <h3 className="text-[15px] font-semibold text-white leading-tight">{stage.title}</h3>
                </div>
                <div className="space-y-2">
                  {stage.items.map((item) => (
                    <p key={item} className="text-[13px] leading-relaxed text-white/58">
                      {glyph.dot} {item}
                    </p>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function EarlyAccessSection({ goTo }: { goTo: (page: Page) => void }) {
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState('Founder / operator');
  const [submitted, setSubmitted] = React.useState(false);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateEmail(email)) return;
    try {
      const entries = JSON.parse(localStorage.getItem('colony_early_access') ?? '[]') as Array<{ email: string; role: string; createdAt: string }>;
      localStorage.setItem('colony_early_access', JSON.stringify([{ email: normalizeEmail(email), role, createdAt: new Date().toISOString() }, ...entries]));
    } catch { /* ignore */ }
    setSubmitted(true);
  };

  return (
    <section id="early-access" className="px-5 py-24 md:px-8">
      <Reveal className="mx-auto max-w-[1200px] overflow-hidden rounded-[24px] border border-white/[0.07] bg-white/[0.02] p-8 md:p-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#00d4aa]">Early access</p>
            <h2 className="mb-5 text-[34px] font-semibold leading-tight tracking-tight text-white md:text-[42px]">Join Colony while the product is still taking shape</h2>
            <p className="max-w-xl text-[15px] leading-relaxed text-white/62">We are looking for thoughtful early users, design partners, and teams who want to shape a safer, friendlier way to automate daily work with AI agents.</p>
          </div>
          <div>
            <form onSubmit={submit} className="rounded-[22px] border border-white/[0.07] bg-white/[0.035] p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/35">Request access</p>
              <label className="mt-4 block text-[12px] font-semibold text-white/55">
                Work email
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  placeholder="you@company.com"
                  className="mt-2 w-full rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-[14px] text-white outline-none placeholder:text-white/25 focus:border-[#4f9eff]/50"
                />
              </label>
              <label className="mt-3 block text-[12px] font-semibold text-white/55">
                What are you building?
                <div className="group relative mt-2">
                  <BriefcaseBusiness className="pointer-events-none absolute left-4 top-1/2 z-10 h-[17px] w-[17px] -translate-y-1/2 text-[#7db7ff]/80 transition-colors group-focus-within:text-[#00d4aa]" />
                  <select
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    className="w-full appearance-none rounded-2xl border border-white/[0.10] bg-[#0b0d12] px-11 py-3.5 text-[14px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_16px_36px_rgba(0,0,0,0.18)] outline-none transition-all duration-200 [color-scheme:dark] hover:border-white/[0.18] hover:bg-[#10141c] focus:border-[#00d4aa]/55 focus:bg-[#0b0d12] focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_0_0_3px_rgba(0,212,170,0.12),0_18px_42px_rgba(0,0,0,0.24)]"
                  >
                    <option className="bg-[#08080d] text-white">Founder / operator</option>
                    <option className="bg-[#08080d] text-white">Small business team</option>
                    <option className="bg-[#08080d] text-white">Creator / marketer</option>
                    <option className="bg-[#08080d] text-white">Developer / AI builder</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-white/42 transition-colors group-focus-within:text-[#00d4aa]" />
                </div>
              </label>
              {submitted && <p className="mt-3 rounded-xl border border-[#00d4aa]/20 bg-[#00d4aa]/10 px-3 py-2 text-[12px] font-semibold text-[#00d4aa]">Saved locally for early-access follow up.</p>}
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button type="submit"
                  className="lp-btn-primary flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold hover:-translate-y-0.5">
                  Join Early Access <span>{glyph.arrow}</span>
                </button>
                <button type="button" onClick={() => goTo('Login')}
                  className="lp-btn-secondary flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium hover:-translate-y-0.5">
                  Open Product Preview
                </button>
              </div>
            </form>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
