import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Search,
  BarChart3,
  FileText,
  CheckCircle2,
  Bot,
  FolderOpen,
  Layers3,
  Plug,
  StickyNote,
  ClipboardCheck,
} from 'lucide-react';
import { ColonyLogo } from '../../../components/brand/BrandMarks';
import { EASE_OUT_EXPO } from './motion';

const PROMPT = 'Research my competitors and prepare a launch plan.';

const AGENTS = [
  { label: 'Research Agent', icon: Search, role: 'Market context' },
  { label: 'Strategy Agent', icon: BarChart3, role: 'Trends & opportunity' },
  { label: 'Report Writer', icon: FileText, role: 'Narrative draft' },
];

type Phase = 'typing' | 'understanding' | 'crew' | 'agents' | 'deliverable' | 'reset';

export function PromptToSystemDemo() {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>('typing');
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (reduce) {
      setTyped(PROMPT);
      setPhase('deliverable');
      return;
    }
    let isMounted = true;

    const run = async () => {
      while (isMounted) {
        setPhase('typing');
        setTyped('');
        for (let i = 1; i <= PROMPT.length; i++) {
          await wait(28);
          if (!isMounted) return;
          setTyped(PROMPT.slice(0, i));
        }
        await wait(700);
        if (!isMounted) return;
        setPhase('understanding');
        await wait(1400);
        if (!isMounted) return;
        setPhase('crew');
        await wait(900);
        if (!isMounted) return;
        setPhase('agents');
        await wait(2200);
        if (!isMounted) return;
        setPhase('deliverable');
        await wait(3200);
        if (!isMounted) return;
        setPhase('reset');
        await wait(700);
      }
    };
    run();
    return () => {
      isMounted = false;
    };
  }, [reduce]);

  // Whole-card entrance — fade-up + blur clear once when in view.
  const cardEnter = {
    hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
    show: { opacity: 1, y: 0, filter: 'blur(0px)' },
  };

  // Inspector content adapts to the current phase so the preview feels alive.
  const inspector = (() => {
    if (phase === 'typing' || phase === 'understanding') {
      return {
        kind: 'router' as const,
        title: 'AI Ant',
        subtitle: 'Routing the goal',
        status: phase === 'typing' ? 'Listening…' : 'Analyzing intent',
      };
    }
    if (phase === 'crew' || phase === 'agents') {
      return {
        kind: 'agent' as const,
        title: 'Research Agent',
        subtitle: 'Gathering market context',
        status: 'Working',
      };
    }
    return {
      kind: 'deliverable' as const,
      title: 'Launch Plan',
      subtitle: 'Ready for review',
      status: 'Approved',
    };
  })();

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
      variants={cardEnter}
      transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
      className="relative mx-auto w-full max-w-[1040px] px-2 sm:px-0"
    >
      {/* Ambient halo behind the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-16 -inset-y-12 -z-10"
        style={{
          background:
            'radial-gradient(60% 60% at 50% 25%, rgba(124,92,252,0.10), transparent 70%), radial-gradient(55% 55% at 50% 85%, rgba(125,183,255,0.09), transparent 75%)',
          filter: 'blur(8px)',
        }}
      />

      <div
        className="overflow-hidden rounded-[24px] border backdrop-blur-2xl"
        style={{
          background:
            'linear-gradient(180deg, rgba(16,20,30,0.80) 0%, rgba(8,10,18,0.85) 100%)',
          borderColor: 'rgba(255,255,255,0.10)',
          boxShadow:
            '0 30px 90px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        {/* ── Chrome bar ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
          className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3 md:px-5"
        >
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/12" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/12" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/12" />
          </div>
          <div className="flex items-center gap-2 text-[11px] font-medium text-white/45">
            <span className="hidden items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 text-[10px] tracking-wide text-white/55 sm:inline-flex">
              app.colony.ai
            </span>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
              <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-white">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0a0c14]" />
              </span>
              AI Ant
            </div>
          </div>
        </motion.div>

        {/* ── Three-column workspace preview ─────────────────── */}
        <div className="grid gap-0 md:grid-cols-[180px_minmax(0,1fr)_220px]">
          {/* Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE_OUT_EXPO }}
            className="hidden flex-col gap-1 border-r border-white/[0.06] bg-[#070A12]/60 p-3 md:flex"
          >
            <div className="mb-3 flex items-center gap-2 px-1.5">
              <ColonyLogo size={20} />
              <span className="font-heading text-[13px] font-extrabold tracking-tight text-white/88">Colony</span>
            </div>
            <NavItem icon={Bot} label="AI Ant" active />
            <NavItem icon={FolderOpen} label="Projects" />
            <NavItem icon={FileText} label="Deliverables" />
            <p className="mt-3 px-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white/24">Library</p>
            <NavItem icon={Layers3} label="Templates" />
            <NavItem icon={Plug} label="Connectors" />
            <NavItem icon={StickyNote} label="Knowledge" />
            <NavItem icon={ClipboardCheck} label="Approvals" />
            <div className="mt-auto rounded-[10px] border border-emerald-400/15 bg-emerald-400/[0.06] px-2.5 py-2">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                <p className="text-[10px] font-bold text-emerald-200/90">Live</p>
              </div>
              <p className="mt-0.5 text-[9px] leading-snug text-white/40">3 agents online</p>
            </div>
          </motion.aside>

          {/* Main */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, delay: 0.15, ease: EASE_OUT_EXPO }}
            className="flex min-h-[420px] flex-col gap-4 p-5 md:p-6"
          >
            {/* Goal */}
            <div
              className="rounded-[18px] border border-white/[0.09] bg-white/[0.03] px-5 py-4"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
            >
              <p
                className="text-[12px] font-medium uppercase tracking-[0.22em] text-white/45"
                style={{ fontFamily: "'Instrument Serif', Georgia, serif", letterSpacing: '0.22em' }}
              >
                Goal
              </p>
              <p className="mt-2 min-h-[44px] text-[16px] leading-[1.55] text-white/90 md:text-[17px]">
                {typed}
                <motion.span
                  className="ml-0.5 inline-block h-[1.05em] w-[2px] -translate-y-[2px] bg-white/75 align-middle"
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.85, repeat: Infinity, ease: 'linear' }}
                />
              </p>
            </div>

            {/* Status */}
            <div className="flex min-h-[64px] flex-col gap-2.5">
              <AnimatePresence mode="wait">
                {(phase === 'understanding' || phase === 'typing') && (
                  <motion.div
                    key="understanding"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                    className="flex items-center gap-2.5 text-[13.5px] text-white/68"
                  >
                    <DotsLoader />
                    <span>Understanding your goal…</span>
                  </motion.div>
                )}
                {(phase === 'crew' || phase === 'agents' || phase === 'deliverable' || phase === 'reset') && (
                  <motion.div
                    key="crew"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
                    className="flex items-center gap-2 text-[13.5px] text-white/88"
                  >
                    <CheckCircle2 className="h-4 w-4 text-[#7db7ff]" />
                    <span>Colony Crew created</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {(phase === 'agents' || phase === 'deliverable' || phase === 'reset') && (
                  <motion.div
                    key="agents"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-0.5 flex flex-wrap items-center gap-2"
                  >
                    {AGENTS.map((agent, idx) => (
                      <React.Fragment key={agent.label}>
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.45, delay: idx * 0.18, ease: EASE_OUT_EXPO }}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.10] bg-white/[0.045] px-3 py-1.5 text-[12px] font-medium text-white/82"
                          style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
                        >
                          <agent.icon className="h-3.5 w-3.5 text-white/72" />
                          {agent.label}
                        </motion.div>
                        {idx < AGENTS.length - 1 && (
                          <motion.span
                            initial={{ opacity: 0, x: -2 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.18 + 0.12 }}
                            className="text-white/32"
                          >
                            →
                          </motion.span>
                        )}
                      </React.Fragment>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Deliverable */}
            <div className="mt-auto min-h-[80px]">
              <AnimatePresence>
                {(phase === 'deliverable' || phase === 'reset') && (
                  <motion.div
                    key="deliverable"
                    initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                    transition={{ duration: 0.65, ease: EASE_OUT_EXPO }}
                    className="flex items-center justify-between gap-3 rounded-[18px] border px-5 py-4"
                    style={{
                      borderColor: 'rgba(125,183,255,0.28)',
                      background:
                        'linear-gradient(180deg, rgba(125,183,255,0.10) 0%, rgba(125,183,255,0.04) 100%)',
                      boxShadow:
                        'inset 0 1px 0 rgba(255,255,255,0.05), 0 12px 32px rgba(125,183,255,0.10)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-[12px] bg-white/[0.09] text-white/88 ring-1 ring-white/[0.10]">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[15px] font-semibold leading-tight text-white">Launch Plan</p>
                        <p className="mt-0.5 text-[12px] text-white/58">Ready for Review</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-white/[0.14] bg-white/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/78">
                      Deliverable
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Right inspector */}
          <motion.aside
            initial={{ opacity: 0, x: 8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, delay: 0.2, ease: EASE_OUT_EXPO }}
            className="hidden flex-col gap-3 border-l border-white/[0.06] bg-[#070A12]/60 p-4 md:flex"
          >
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">Focus</p>

            <AnimatePresence mode="wait">
              <motion.div
                key={inspector.kind}
                initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
                transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
                className="rounded-[14px] border border-white/[0.08] bg-white/[0.025] p-3"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`grid h-9 w-9 place-items-center rounded-[11px] ${
                      inspector.kind === 'router'
                        ? 'bg-violet-500/15 text-violet-200 ring-1 ring-violet-300/25'
                        : inspector.kind === 'agent'
                        ? 'bg-cyan-500/12 text-cyan-200 ring-1 ring-cyan-300/25'
                        : 'bg-emerald-500/12 text-emerald-200 ring-1 ring-emerald-300/25'
                    }`}
                  >
                    {inspector.kind === 'router' ? (
                      <Bot className="h-4 w-4" />
                    ) : inspector.kind === 'agent' ? (
                      <Search className="h-4 w-4" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-bold text-white/88">{inspector.title}</p>
                    <p className="truncate text-[10.5px] text-white/45">{inspector.subtitle}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      inspector.kind === 'router'
                        ? 'bg-violet-300 animate-pulse'
                        : inspector.kind === 'agent'
                        ? 'bg-cyan-300 animate-pulse'
                        : 'bg-emerald-300'
                    }`}
                  />
                  <span className="text-[10.5px] font-semibold text-white/65">{inspector.status}</span>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="rounded-[14px] border border-white/[0.07] bg-white/[0.02] p-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/28">Plan</p>
              <ul className="mt-2 space-y-1.5 text-[11px] leading-snug text-white/55">
                <PlanStep label="Read goal" done />
                <PlanStep label="Build crew" done={phase !== 'typing' && phase !== 'understanding'} />
                <PlanStep label="Run agents" done={phase === 'agents' || phase === 'deliverable' || phase === 'reset'} />
                <PlanStep label="Deliver" done={phase === 'deliverable' || phase === 'reset'} />
              </ul>
            </div>

            <div className="mt-auto rounded-[12px] border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-[10px] text-white/45">
              <span className="font-bold text-white/65">Routing</span>{' '}
              <span className="text-white/35">·</span> Auto · Balanced
            </div>
          </motion.aside>
        </div>
      </div>
    </motion.div>
  );
}

function NavItem({ icon: Icon, label, active }: { icon: React.ElementType; label: string; active?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-[8px] px-2 py-1.5 text-[11.5px] font-medium transition ${
        active
          ? 'bg-violet-500/15 text-white ring-1 ring-violet-400/20'
          : 'text-white/48'
      }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </div>
  );
}

function PlanStep({ label, done }: { label: string; done: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={`grid h-3.5 w-3.5 place-items-center rounded-full transition ${
          done ? 'bg-emerald-400/25 text-emerald-200' : 'bg-white/[0.08] text-white/30'
        }`}
      >
        {done ? <CheckCircle2 className="h-3 w-3" /> : <span className="h-1 w-1 rounded-full bg-white/40" />}
      </span>
      <span className={done ? 'text-white/75' : 'text-white/35'}>{label}</span>
    </li>
  );
}

function DotsLoader() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-white/70"
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 1.05, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </span>
  );
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
