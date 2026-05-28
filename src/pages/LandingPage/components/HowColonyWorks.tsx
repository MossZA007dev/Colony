import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion';
import {
  Bot,
  FolderOpen,
  FileText,
  ClipboardCheck,
  Search,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  X,
  Check,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { ColonyLogo } from '../../../components/brand/BrandMarks';
import { EASE_OUT_EXPO, RevealOnScroll } from './motion';

type WorkflowStep = 'goal' | 'planning' | 'execution' | 'deliverable';

const STEP_ORDER: WorkflowStep[] = ['goal', 'planning', 'execution', 'deliverable'];

const STEPS: { id: WorkflowStep; n: string; title: string; copy: string }[] = [
  { id: 'goal', n: '01', title: 'Describe your goal', copy: 'Tell AI Ant what you want to accomplish in plain language.' },
  { id: 'planning', n: '02', title: 'AI Ant creates a plan', copy: 'Colony Bridge recommends the right crew or workflow.' },
  { id: 'execution', n: '03', title: 'Specialist agents execute', copy: 'Agents research, analyze, and prepare the result while you stay in control.' },
  { id: 'deliverable', n: '04', title: 'Review the deliverable', copy: 'Approve the output or refine the direction before anything sensitive happens.' },
];

const GOAL_TEXT = 'Research my competitors and prepare a launch plan.';

export function HowColonyWorks() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { amount: 0.35, once: true });

  const [step, setStep] = useState<WorkflowStep>('goal');
  const [interacted, setInteracted] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Auto-play once when section enters viewport
  useEffect(() => {
    if (!inView || reduce || interacted) return;
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setStep('planning'), 1600));
    timers.push(window.setTimeout(() => setStep('execution'), 4000));
    timers.push(window.setTimeout(() => setStep('deliverable'), 7000));
    return () => { timers.forEach(window.clearTimeout); };
  }, [inView, reduce, interacted]);

  const pickStep = useCallback((next: WorkflowStep) => {
    setStep(next);
    setInteracted(true);
  }, []);

  const replay = () => {
    setPreviewOpen(false);
    setInteracted(true);
    setStep('goal');
    // After a short pause, animate forward again
    window.setTimeout(() => setStep('planning'), 800);
    window.setTimeout(() => setStep('execution'), 3200);
    window.setTimeout(() => setStep('deliverable'), 6200);
  };

  const currentIndex = STEP_ORDER.indexOf(step);

  return (
    <section id="how-it-works" className="px-5 py-28 md:px-8 md:py-36">
      <div ref={sectionRef} className="mx-auto max-w-[1240px]">
        <RevealOnScroll>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#7db7ff]">How It Works</p>
          <h2 className="max-w-3xl text-[34px] font-semibold leading-[1.08] tracking-tight text-white md:text-[52px]">
            From one goal to completed work.
          </h2>
          <p className="mt-5 max-w-2xl text-[16px] leading-[1.65] text-white/60 md:text-[17px]">
            AI Ant understands your request, proposes the right structure, coordinates specialist agents, and produces a result ready for your review.
          </p>
        </RevealOnScroll>

        <div className="mt-14 grid items-start gap-10 lg:grid-cols-[minmax(0,38%)_minmax(0,62%)] lg:gap-12">
          {/* Step navigation */}
          <div className="flex flex-col gap-2">
            {STEPS.map((s, idx) => {
              const isActive = step === s.id;
              const isDone = idx < currentIndex;
              return (
                <button
                  key={s.id}
                  onClick={() => pickStep(s.id)}
                  aria-current={isActive}
                  className={`group relative flex w-full items-start gap-4 rounded-2xl border px-4 py-4 text-left transition-colors duration-300 ${
                    isActive
                      ? 'border-violet-300/35 bg-violet-500/10'
                      : 'border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.035]'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="how-active-rail"
                      className="absolute left-0 top-1/2 h-7 w-[2px] -translate-y-1/2 rounded-full bg-gradient-to-b from-[#7c5cfc] to-[#7db7ff]"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span
                    className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border text-[12px] font-bold transition ${
                      isActive
                        ? 'border-violet-300/45 bg-violet-400/15 text-violet-100'
                        : isDone
                        ? 'border-emerald-300/35 bg-emerald-400/10 text-emerald-200'
                        : 'border-white/[0.10] bg-white/[0.03] text-white/55'
                    }`}
                  >
                    {isDone ? <Check className="h-4 w-4" strokeWidth={3} /> : s.n}
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-[15px] font-semibold ${isActive ? 'text-white' : 'text-white/82'}`}>{s.title}</span>
                    <span className="mt-1 block text-[12.5px] leading-snug text-white/45">{s.copy}</span>
                  </span>
                </button>
              );
            })}

            {step === 'deliverable' && (
              <button
                onClick={replay}
                className="mt-2 inline-flex items-center gap-1.5 self-start rounded-full border border-white/[0.10] bg-white/[0.04] px-3.5 py-2 text-[12.5px] font-semibold text-white/72 transition hover:border-white/[0.18] hover:bg-white/[0.07] hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Replay flow
              </button>
            )}

            <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
              {(['Goal', 'Plan', 'Execute', 'Deliver'] as const).map((label, idx) => (
                <React.Fragment key={label}>
                  <span className={idx <= currentIndex ? 'text-violet-200' : 'text-white/35'}>{label}</span>
                  {idx < 3 && <span className="text-white/20">→</span>}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Product flow */}
          <ProductFlowApp step={step} onPreview={() => setPreviewOpen(true)} reduce={!!reduce} />
        </div>
      </div>

      <AnimatePresence>
        {previewOpen && <DeliverablePreviewModal onClose={() => setPreviewOpen(false)} />}
      </AnimatePresence>
    </section>
  );
}

/* Product-style flow panel */

function ProductFlowApp({ step, onPreview, reduce }: { step: WorkflowStep; onPreview: () => void; reduce: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.85, ease: EASE_OUT_EXPO }}
      className="overflow-hidden rounded-[24px] border backdrop-blur-2xl"
      style={{
        background: 'linear-gradient(180deg, rgba(16,20,30,0.82) 0%, rgba(8,10,18,0.86) 100%)',
        borderColor: 'rgba(255,255,255,0.10)',
        boxShadow: '0 30px 90px -12px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3 md:px-5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-[9px] bg-white">
            <img src="/assets/logos/ai ant black (2).png" alt="" width={16} height={16} draggable={false} />
          </span>
          <div className="min-w-0">
            <p className="text-[12.5px] font-bold leading-tight text-white">AI Ant</p>
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">Colony Bridge Operator</p>
          </div>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full border border-amber-400/22 bg-amber-400/[0.07] px-2.5 py-0.5 text-[10px] font-semibold text-amber-200 sm:inline-flex">
          <ClipboardCheck className="h-3 w-3" />
          Approval Mode
        </span>
      </div>

      {/* Body */}
      <div className="grid gap-0 lg:grid-cols-[150px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="hidden flex-col gap-1 border-r border-white/[0.06] bg-[#070A12]/55 p-2.5 lg:flex">
          <div className="mb-2 flex items-center gap-2 px-1.5">
            <ColonyLogo size={18} />
            <span className="font-heading text-[12px] font-extrabold tracking-tight text-white/88">Colony Bridge</span>
          </div>
          <SidebarItem icon={Bot} label="AI Ant" active />
          <SidebarItem icon={FolderOpen} label="Projects" />
          <SidebarItem icon={FileText} label="Deliverables" />
          <SidebarItem icon={ShieldCheck} label="Approvals" />
        </aside>

        {/* Main area */}
        <div className="relative min-h-[460px] p-5 md:p-6">
          <AnimatePresence mode="wait">
            {step === 'goal' && <GoalState key="goal" reduce={reduce} />}
            {step === 'planning' && <PlanningState key="planning" reduce={reduce} />}
            {step === 'execution' && <ExecutionState key="execution" reduce={reduce} />}
            {step === 'deliverable' && <DeliverableState key="deliverable" onPreview={onPreview} />}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── States ─────────────────────────────────────────────────────────── */

function GoalState({ reduce }: { reduce: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
      transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
      className="flex h-full flex-col"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Prompt</p>
      <p className="mt-1 text-[14px] text-white/55">Tell AI Ant what you want to accomplish.</p>

      <div
        className="mt-4 rounded-[16px] border border-white/[0.10] bg-white/[0.03] px-4 py-3.5"
        style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
      >
        <p
          className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/45"
          style={{ fontFamily: "'Instrument Serif', Georgia, serif", letterSpacing: '0.22em' }}
        >
          Goal
        </p>
        <p className="mt-2 text-[15px] leading-[1.55] text-white/92">
          {GOAL_TEXT}
          <motion.span
            className="ml-0.5 inline-block h-[1em] w-[2px] -translate-y-[1px] bg-white/70 align-middle"
            animate={reduce ? undefined : { opacity: [1, 0, 1] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
          />
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {['Auto', 'Balanced'].map((label, i) => (
            <span
              key={label}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${
                i === 0 ? 'border-violet-400/30 bg-violet-500/12 text-violet-100' : 'border-white/[0.10] bg-white/[0.03] text-white/55'
              }`}
            >
              {i === 0 && <Sparkles className="h-3 w-3" />}
              {label}
            </span>
          ))}
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-200/85">
            <span className={`h-1.5 w-1.5 rounded-full bg-emerald-300 ${!reduce ? 'animate-pulse' : ''}`} />
            Sent
          </span>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between rounded-[12px] border border-white/[0.06] bg-white/[0.02] px-3.5 py-2 text-[11.5px] text-white/55">
        <span>AI Ant is ready to plan your work.</span>
        <span className="inline-flex items-center gap-1 text-white/35">
          Step 01 of 04
          <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </motion.div>
  );
}

function PlanningState({ reduce }: { reduce: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
      transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
      className="flex h-full flex-col gap-3"
    >
      <GoalCard />

      <div className="flex items-center gap-2 text-[13px] text-white/72">
        <span className="inline-flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-white/70"
              animate={reduce ? undefined : { opacity: [0.25, 1, 0.25] }}
              transition={{ duration: 1.05, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </span>
        AI Ant is analyzing the goal…
      </div>

      <div>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/35">Mode</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {[
            { label: 'Chat', sub: 'Single answer', active: false },
            { label: 'AI Agent Team', sub: 'Specialist crew', active: true },
            { label: 'Automation', sub: 'Repeatable workflow', active: false },
          ].map((mode) => (
            <div
              key={mode.label}
              className={`rounded-[14px] border px-3 py-2.5 text-left transition ${
                mode.active
                  ? 'border-violet-300/35 bg-violet-500/12'
                  : 'border-white/[0.08] bg-white/[0.025]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[12.5px] font-bold ${mode.active ? 'text-white' : 'text-white/75'}`}>{mode.label}</span>
                {mode.active && <Check className="h-3.5 w-3.5 text-violet-200" strokeWidth={3} />}
              </div>
              <p className="mt-1 text-[10.5px] text-white/45">{mode.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div
        className="mt-auto rounded-[12px] border border-violet-300/22 bg-violet-500/[0.08] px-3.5 py-2.5 text-[12.5px] text-violet-100/90"
        style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}
      >
        <span className="font-semibold">Complex task detected.</span> Building a specialist team.
      </div>
    </motion.div>
  );
}

function ExecutionState({ reduce }: { reduce: boolean }) {
  type AgentStatus = 'complete' | 'working' | 'queued';
  const agents: { id: string; name: string; task: string; icon: React.ElementType; status: AgentStatus }[] = [
    { id: 'r', name: 'Research Agent', task: 'Gathering competitor insights', icon: Search, status: 'complete' },
    { id: 's', name: 'Strategy Agent', task: 'Building market positioning', icon: BarChart3, status: 'working' },
    { id: 'w', name: 'Report Writer', task: 'Preparing launch plan', icon: FileText, status: 'queued' },
  ];
  const checklist = [
    { label: 'Understand goal', done: true, active: false },
    { label: 'Assemble AI crew', done: true, active: false },
    { label: 'Research competitors', done: true, active: false },
    { label: 'Build strategy', done: false, active: true },
    { label: 'Prepare deliverable', done: false, active: false },
  ];
  const toneFor = (s: AgentStatus) =>
    s === 'complete' ? 'border-emerald-400/25 bg-emerald-400/[0.12] text-emerald-200'
    : s === 'working' ? 'border-cyan-300/30 bg-cyan-400/[0.12] text-cyan-100'
    : 'border-white/[0.12] bg-white/[0.04] text-white/55';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
      transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
      className="flex h-full flex-col gap-3"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-semibold text-white/88">
          <CheckCircle2 className="mr-1.5 inline-block h-4 w-4 -translate-y-[1px] text-[#7db7ff]" />
          AI crew assembled
        </p>
        <p className="text-[11px] text-white/45">3 agents · 1 deliverable</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px]">
        {/* Agents */}
        <div className="space-y-2">
          {agents.map((agent, idx) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: idx * 0.16, ease: EASE_OUT_EXPO }}
              className="relative overflow-hidden rounded-[14px] border border-white/[0.09] bg-white/[0.03] p-3"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
            >
              <div className="flex items-start gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-violet-500/15 text-violet-200 ring-1 ring-violet-300/22">
                  <agent.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-bold text-white/90">{agent.name}</p>
                    <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] ${toneFor(agent.status)}`}>
                      {agent.status === 'complete' ? 'Complete' : agent.status === 'working' ? 'Working' : 'Queued'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-white/50">{agent.task}</p>
                </div>
              </div>
              {agent.status === 'working' && !reduce && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-gradient-to-r from-cyan-400/0 via-cyan-300/70 to-cyan-400/0"
                />
              )}
              {agent.status === 'complete' && (
                <span className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-emerald-400/0 via-emerald-300/55 to-emerald-400/0" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Checklist */}
        <aside className="rounded-[14px] border border-white/[0.07] bg-white/[0.02] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Execution</p>
          <ul className="mt-2 space-y-1.5">
            {checklist.map((c) => (
              <li key={c.label} className="flex items-center gap-2 text-[11.5px]">
                <span
                  className={`grid h-4 w-4 place-items-center rounded-full ring-1 transition ${
                    c.done
                      ? 'bg-emerald-400/25 text-emerald-100 ring-emerald-300/40'
                      : c.active
                      ? 'bg-cyan-400/22 text-cyan-100 ring-cyan-300/40'
                      : 'bg-white/[0.06] text-white/30 ring-white/[0.08]'
                  }`}
                >
                  {c.done ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : <span className="h-1 w-1 rounded-full bg-current" />}
                </span>
                <span className={c.done ? 'text-white/80' : c.active ? 'text-white/85' : 'text-white/40'}>{c.label}</span>
                {c.active && !reduce && (
                  <span className="ml-auto inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
                  </span>
                )}
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <div className="mt-auto flex items-center gap-2 rounded-[12px] border border-white/[0.06] bg-white/[0.02] px-3.5 py-2 text-[12.5px] text-white/65">
        <span className="relative inline-flex h-2 w-2">
          {!reduce && <span className="absolute inset-0 animate-ping rounded-full bg-cyan-300/60" />}
          <span className="relative inline-block h-2 w-2 rounded-full bg-cyan-300" />
        </span>
        AI Ant is coordinating 3 specialist agents.
      </div>
    </motion.div>
  );
}

function DeliverableState({ onPreview }: { onPreview: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
      transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
      className="flex h-full flex-col gap-3"
    >
      <GoalCard compact />

      <div className="flex items-center gap-2 text-[13px] text-emerald-200/95">
        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
        AI Ant completed the workflow.
      </div>

      <ul className="space-y-1.5 rounded-[14px] border border-white/[0.07] bg-white/[0.02] p-3">
        {['Understand goal', 'Assemble AI crew', 'Research competitors', 'Build strategy', 'Prepare deliverable'].map((label) => (
          <li key={label} className="flex items-center gap-2 text-[11.5px] text-white/80">
            <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-400/25 text-emerald-100 ring-1 ring-emerald-300/40">
              <Check className="h-2.5 w-2.5" strokeWidth={3} />
            </span>
            {label}
          </li>
        ))}
      </ul>

      <div
        className="mt-auto rounded-[18px] border px-4 py-3.5"
        style={{
          borderColor: 'rgba(125,183,255,0.28)',
          background: 'linear-gradient(180deg, rgba(125,183,255,0.10) 0%, rgba(125,183,255,0.04) 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 12px 32px rgba(125,183,255,0.10)',
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-[12px] bg-white/[0.09] text-white/88 ring-1 ring-white/[0.10]">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[14.5px] font-semibold leading-tight text-white">Launch Plan</p>
              <p className="mt-0.5 truncate text-[11.5px] text-white/55">Competitor research and positioning strategy</p>
            </div>
          </div>
          <span className="hidden rounded-full border border-white/[0.14] bg-white/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/78 sm:inline-block">
            Ready for Review
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={onPreview}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[12px] font-bold text-[#070B14] transition hover:bg-white/92"
          >
            Preview
            <ArrowRight className="h-3 w-3" />
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/[0.10] px-3.5 py-1.5 text-[12px] font-bold text-emerald-200 transition hover:bg-emerald-400/[0.16]">
            <Check className="h-3 w-3" />
            Approve
          </button>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-amber-400/22 bg-amber-400/[0.06] px-2.5 py-1 text-[10.5px] font-semibold text-amber-200">
            <ShieldCheck className="h-3 w-3" />
            Sensitive actions require approval
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Reusable bits ──────────────────────────────────────────────────── */

function GoalCard({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`rounded-[14px] border border-white/[0.09] bg-white/[0.03] ${compact ? 'px-3.5 py-2.5' : 'px-4 py-3'}`}
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
    >
      <p
        className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-white/45"
        style={{ fontFamily: "'Instrument Serif', Georgia, serif", letterSpacing: '0.22em' }}
      >
        Goal
      </p>
      <p className={`mt-1 leading-[1.55] text-white/92 ${compact ? 'text-[13px]' : 'text-[14.5px]'}`}>{GOAL_TEXT}</p>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, active }: { icon: React.ElementType; label: string; active?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-[8px] px-2 py-1.5 text-[11.5px] font-medium transition ${
        active ? 'bg-violet-500/15 text-white ring-1 ring-violet-400/22' : 'text-white/48'
      }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </div>
  );
}

/* ─── Deliverable preview modal ─────────────────────────────────────── */

function DeliverablePreviewModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/65 px-4 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[560px] overflow-hidden rounded-[22px] border border-white/[0.10] bg-[#0a0d18] shadow-[0_30px_90px_rgba(0,0,0,0.6)]"
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-[11px] bg-white/[0.08] text-white/85 ring-1 ring-white/[0.10]">
              <FileText className="h-4 w-4" />
            </div>
            <p className="text-[14px] font-bold leading-tight text-white">Launch Plan</p>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-[10px] text-white/55 transition hover:bg-white/[0.06] hover:text-white"
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] space-y-5 overflow-y-auto px-5 py-5">
          <PreviewSection number="01" title="Competitor Landscape">
            <p className="text-[13px] leading-snug text-white/72">Three relevant competitors identified.</p>
          </PreviewSection>
          <PreviewSection number="02" title="Positioning Opportunity">
            <p className="text-[13px] leading-snug text-white/72">Differentiate through coordinated AI work execution.</p>
          </PreviewSection>
          <PreviewSection number="03" title="Recommended Launch Actions">
            <p className="text-[13px] leading-snug text-white/72">Validate with early users and publish the initial product walkthrough.</p>
          </PreviewSection>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] px-5 py-3.5">
          <button
            onClick={onClose}
            className="rounded-full border border-white/[0.10] bg-white/[0.04] px-4 py-1.5 text-[12px] font-semibold text-white/70 transition hover:bg-white/[0.08] hover:text-white"
          >
            Close
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/90 px-4 py-1.5 text-[12px] font-bold text-[#06140d] transition hover:bg-emerald-300">
            <Check className="h-3 w-3" />
            Approve
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PreviewSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[10.5px] font-bold text-white/35">{number}</span>
        <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-white/75">{title}</p>
      </div>
      <div className="mt-1.5">{children}</div>
    </section>
  );
}
