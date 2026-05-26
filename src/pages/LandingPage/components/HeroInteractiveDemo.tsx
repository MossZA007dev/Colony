import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Bot,
  FolderOpen,
  FileText,
  ClipboardCheck,
  Search,
  BarChart3,
  CheckCircle2,
  RotateCcw,
  ArrowRight,
  X,
  Check,
  Sparkles,
} from 'lucide-react';
import { ColonyLogo } from '../../../components/brand/BrandMarks';
import { EASE_OUT_EXPO } from './motion';

export type DemoStep = 'idle' | 'planning' | 'team' | 'executing' | 'complete';

type AgentDef = { id: string; name: string; role: string; icon: React.ElementType };

const AGENTS: AgentDef[] = [
  { id: 'research', name: 'Research Agent', role: 'Searches competitors and market context', icon: Search },
  { id: 'strategy', name: 'Strategy Agent', role: 'Builds positioning and launch direction', icon: BarChart3 },
  { id: 'writer', name: 'Writer Agent', role: 'Prepares the final launch plan', icon: FileText },
];

const PROMPTS: { chip: string; goal: string }[] = [
  { chip: 'Research my competitors', goal: 'Research my competitors and prepare a launch plan.' },
  { chip: 'Create a launch plan', goal: 'Build a go-to-market launch plan for next quarter.' },
  { chip: 'Build an AI team', goal: 'Build an AI team for my product launch.' },
];

const CHECKLIST = [
  { id: 'goal', label: 'Understand goal' },
  { id: 'team', label: 'Assemble AI crew' },
  { id: 'research', label: 'Research competitors' },
  { id: 'strategy', label: 'Build strategy' },
  { id: 'deliverable', label: 'Prepare deliverable' },
];

const STEP_INDEX: Record<DemoStep, number> = {
  idle: 0,
  planning: 1,
  team: 2,
  executing: 3,
  complete: 4,
};

function checklistDoneAt(step: DemoStep): Set<string> {
  switch (step) {
    case 'idle':
      return new Set();
    case 'planning':
      return new Set(['goal']);
    case 'team':
      return new Set(['goal', 'team']);
    case 'executing':
      return new Set(['goal', 'team', 'research', 'strategy']);
    case 'complete':
      return new Set(['goal', 'team', 'research', 'strategy', 'deliverable']);
  }
}

export function HeroInteractiveDemo() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState<DemoStep>('idle');
  const [goal, setGoal] = useState('');
  const [interacted, setInteracted] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const pickPrompt = useCallback((preset: { chip: string; goal: string }, manual = true) => {
    setGoal(preset.goal);
    setStep('planning');
    if (manual) setInteracted(true);
  }, []);

  // Auto-advance step machine
  useEffect(() => {
    if (reduce) return;
    if (step === 'planning') {
      const t = window.setTimeout(() => setStep('team'), 1800);
      return () => window.clearTimeout(t);
    }
    if (step === 'team') {
      const t = window.setTimeout(() => setStep('executing'), 2400);
      return () => window.clearTimeout(t);
    }
    if (step === 'executing') {
      const t = window.setTimeout(() => setStep('complete'), 2400);
      return () => window.clearTimeout(t);
    }
  }, [step, reduce]);

  // Auto-play first prompt after 3.5s if untouched
  useEffect(() => {
    if (reduce || interacted || step !== 'idle') return;
    const t = window.setTimeout(() => {
      pickPrompt(PROMPTS[0], false);
    }, 3500);
    return () => window.clearTimeout(t);
  }, [reduce, interacted, step, pickPrompt]);

  const replay = () => {
    setPreviewOpen(false);
    setStep('idle');
    setGoal('');
    setInteracted(true); // do not retrigger auto-play
  };

  const done = checklistDoneAt(step);
  const phaseLabel =
    step === 'idle' ? 'Choose a goal' :
    step === 'planning' ? 'Planning the work' :
    step === 'team' ? 'Assembling the team' :
    step === 'executing' ? 'Coordinating agents' :
    'Workflow complete';

  return (
    <div className="relative w-full">
      {/* Interactive indicator */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: EASE_OUT_EXPO }}
        className="mb-3 flex items-center gap-2 text-[11px] font-semibold text-white/55"
      >
        <span className="relative inline-flex h-1.5 w-1.5">
          {!reduce && <span className="absolute inset-0 animate-ping rounded-full bg-emerald-300/60" />}
          <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" />
        </span>
        <span className="uppercase tracking-[0.18em] text-white/60">Product Preview</span>
        <span className="text-white/30">·</span>
        <span className="text-white/55">AI Ant planning the work</span>
      </motion.div>

      {/* Ambient halo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-16 -inset-y-12 -z-10"
        style={{
          background:
            'radial-gradient(60% 60% at 50% 30%, rgba(124,92,252,0.12), transparent 70%), radial-gradient(55% 55% at 50% 85%, rgba(125,183,255,0.10), transparent 75%)',
          filter: 'blur(10px)',
        }}
      />

      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 32, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.9, delay: 0.55, ease: EASE_OUT_EXPO }}
        id="hero-demo"
        className="overflow-hidden rounded-[24px] border backdrop-blur-2xl"
        style={{
          background: 'linear-gradient(180deg, rgba(16,20,30,0.84) 0%, rgba(8,10,18,0.88) 100%)',
          borderColor: 'rgba(255,255,255,0.10)',
          boxShadow:
            '0 36px 90px -16px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        {/* Top bar */}
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
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-amber-400/22 bg-amber-400/[0.07] px-2.5 py-0.5 text-[10px] font-semibold text-amber-200 sm:inline-flex">
              <ClipboardCheck className="h-3 w-3" />
              Approval Mode
            </span>
          </div>
        </div>

        {/* Three-column body */}
        <div className="grid gap-0 lg:grid-cols-[150px_minmax(0,1fr)_180px]">
          {/* Sidebar */}
          <aside className="hidden flex-col gap-1 border-r border-white/[0.06] bg-[#070A12]/55 p-2.5 lg:flex">
            <div className="mb-2 flex items-center gap-2 px-1.5">
              <ColonyLogo size={18} />
              <span className="font-heading text-[12px] font-extrabold tracking-tight text-white/88">Colony Bridge</span>
            </div>
            <NavItem icon={Bot} label="AI Ant" active />
            <NavItem icon={FolderOpen} label="Projects" />
            <NavItem icon={FileText} label="Deliverables" />
            <NavItem icon={ClipboardCheck} label="Approvals" />
            <div className="mt-auto rounded-[10px] border border-emerald-400/15 bg-emerald-400/[0.06] px-2.5 py-2">
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full bg-emerald-300 ${!reduce ? 'animate-pulse' : ''}`} />
                <p className="text-[10px] font-bold text-emerald-200/90">Live</p>
              </div>
              <p className="mt-0.5 text-[9px] leading-snug text-white/40">
                {step === 'idle' ? 'Awaiting goal' : step === 'complete' ? '1 deliverable ready' : `${AGENTS.length} agents ready`}
              </p>
            </div>
          </aside>

          {/* Main */}
          <div className="relative flex min-h-[440px] flex-col gap-4 p-5 md:p-6">
            <AnimatePresence mode="wait">
              {step === 'idle' ? (
                <IdleState key="idle" onPick={pickPrompt} reduce={!!reduce} />
              ) : (
                <WorkingArea
                  key="working"
                  step={step}
                  goal={goal}
                  onPreview={() => setPreviewOpen(true)}
                  reduce={!!reduce}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Execution Plan */}
          <aside className="hidden flex-col gap-3 border-l border-white/[0.06] bg-[#070A12]/55 p-3 lg:flex">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">Execution Plan</p>
            <ul className="space-y-1.5">
              {CHECKLIST.map((item) => (
                <ChecklistRow key={item.id} label={item.label} done={done.has(item.id)} />
              ))}
            </ul>
            <div className="mt-auto space-y-1.5 rounded-[12px] border border-white/[0.07] bg-white/[0.025] px-3 py-2.5 text-[10px] text-white/55">
              <Metric label="Agents active" value={step === 'idle' ? '0' : step === 'complete' ? '0' : '3'} />
              <Metric label="Deliverable" value={step === 'complete' ? 'Ready' : 'In progress'} />
              <Metric label="Routing" value="Auto · Balanced" />
            </div>
          </aside>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] px-4 py-2.5 md:px-5">
          <StepIndicator step={step} />
          {step !== 'idle' && (
            <button
              onClick={replay}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.10] bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-white/70 transition hover:border-white/[0.18] hover:bg-white/[0.08] hover:text-white"
            >
              <RotateCcw className="h-3 w-3" />
              Replay demo
            </button>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {previewOpen && <DeliverablePreviewModal onClose={() => setPreviewOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */

function IdleState({ onPick, reduce }: { onPick: (p: { chip: string; goal: string }) => void; reduce: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
      transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
      className="flex h-full flex-col items-center justify-center text-center"
    >
      <motion.span
        animate={reduce ? undefined : { scale: [1, 1.05, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-4 grid h-14 w-14 place-items-center rounded-[16px] bg-white shadow-[0_0_28px_rgba(124,92,252,0.35)]"
      >
        <img src="/assets/logos/ai ant black (2).png" alt="" width={32} height={32} draggable={false} />
      </motion.span>
      <h3 className="font-heading text-[20px] font-extrabold tracking-tight text-white md:text-[22px]">
        What do you want to accomplish?
      </h3>
      <p className="mt-1 max-w-[380px] text-[12.5px] text-white/50">
        Choose a prompt and watch AI Ant assemble a specialist crew.
      </p>

      <div className="mt-5 w-full max-w-[440px] rounded-[14px] border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-left text-[13px] text-white/35">
        Tell AI Ant what you want to accomplish…
        <span className="ml-0.5 inline-block h-[14px] w-[2px] -translate-y-[1px] animate-pulse bg-white/45 align-middle" />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {PROMPTS.map((p) => (
          <button
            key={p.chip}
            onClick={() => onPick(p)}
            className="group inline-flex items-center gap-1.5 rounded-full border border-white/[0.10] bg-white/[0.045] px-3 py-1.5 text-[12px] font-semibold text-white/72 transition hover:border-violet-300/35 hover:bg-violet-500/12 hover:text-white"
          >
            <Sparkles className="h-3 w-3 text-violet-200/80 transition group-hover:text-violet-100" />
            {p.chip}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function WorkingArea({
  step,
  goal,
  onPreview,
  reduce,
}: {
  step: DemoStep;
  goal: string;
  onPreview: () => void;
  reduce: boolean;
}) {
  const showAgents = step === 'team' || step === 'executing' || step === 'complete';
  const showDeliverable = step === 'complete';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
      className="flex h-full flex-col gap-4"
    >
      {/* Goal */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
        className="rounded-[16px] border border-white/[0.09] bg-white/[0.03] px-4 py-3.5"
        style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
      >
        <p
          className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/45"
          style={{ fontFamily: "'Instrument Serif', Georgia, serif", letterSpacing: '0.22em' }}
        >
          Goal
        </p>
        <p className="mt-1.5 text-[14.5px] leading-[1.55] text-white/92">{goal}</p>
      </motion.div>

      {/* Status */}
      <div className="flex items-center gap-2">
        <AnimatePresence mode="wait">
          {step === 'planning' && (
            <motion.div
              key="planning"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
              className="flex items-center gap-2.5 text-[13px] text-white/72"
            >
              <DotsLoader />
              <span>AI Ant is planning the work…</span>
            </motion.div>
          )}
          {step === 'team' && (
            <motion.div
              key="team"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
              className="flex items-center gap-2 text-[13px] text-white/90"
            >
              <CheckCircle2 className="h-4 w-4 text-[#7db7ff]" />
              <span>AI crew assembled</span>
            </motion.div>
          )}
          {step === 'executing' && (
            <motion.div
              key="executing"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
              className="flex items-center gap-2.5 text-[13px] text-white/88"
            >
              <PulseDot />
              <span>AI Ant is coordinating 3 specialist agents</span>
            </motion.div>
          )}
          {step === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
              className="flex items-center gap-2 text-[13px] text-emerald-200/95"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              <span>AI Ant completed the workflow.</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Agents */}
      <AnimatePresence>
        {showAgents && (
          <motion.div
            key="agents"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid gap-2 sm:grid-cols-3"
          >
            {AGENTS.map((agent, idx) => {
              const isRunning = step === 'executing';
              const isDone = step === 'complete';
              const statusLabel = isDone ? 'Done' : isRunning ? 'Working' : 'Ready';
              const statusTone = isDone
                ? 'bg-emerald-400/15 text-emerald-200 border-emerald-400/25'
                : isRunning
                ? 'bg-cyan-400/12 text-cyan-100 border-cyan-300/25'
                : 'bg-white/[0.06] text-white/60 border-white/[0.10]';
              return (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 14, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.55, delay: idx * 0.18, ease: EASE_OUT_EXPO }}
                  className="relative overflow-hidden rounded-[14px] border border-white/[0.09] bg-white/[0.03] p-3"
                  style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="grid h-8 w-8 place-items-center rounded-[10px] bg-violet-500/15 text-violet-200 ring-1 ring-violet-300/22">
                      <agent.icon className="h-4 w-4" />
                    </div>
                    <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] ${statusTone}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <p className="mt-2 text-[12.5px] font-bold text-white/90">{agent.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-[10.5px] leading-snug text-white/45">{agent.role}</p>
                  {/* Running pulse line */}
                  {isRunning && !reduce && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 1.8, delay: idx * 0.15, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-gradient-to-r from-cyan-400/0 via-cyan-300/70 to-cyan-400/0"
                    />
                  )}
                  {isDone && (
                    <span className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-emerald-400/0 via-emerald-300/60 to-emerald-400/0" />
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deliverable */}
      <div className="mt-auto min-h-[84px]">
        <AnimatePresence>
          {showDeliverable && (
            <motion.div
              key="deliverable"
              initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
              transition={{ duration: 0.65, ease: EASE_OUT_EXPO }}
              className="rounded-[18px] border px-4 py-3.5"
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
                    <p className="mt-0.5 truncate text-[11.5px] text-white/55">Competitor research and market positioning</p>
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
                  Preview Deliverable
                  <ArrowRight className="h-3 w-3" />
                </button>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/[0.10] px-3.5 py-1.5 text-[12px] font-bold text-emerald-200">
                  <Check className="h-3 w-3" />
                  Waiting for approval
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ─── Sidebar / Plan helpers ─────────────────────────────────────────── */

function NavItem({ icon: Icon, label, active }: { icon: React.ElementType; label: string; active?: boolean }) {
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

function ChecklistRow({ label, done }: { label: string; done: boolean }) {
  return (
    <motion.li layout className="flex items-center gap-2 text-[11px]">
      <motion.span
        layout
        animate={done ? { scale: [0.6, 1.08, 1] } : undefined}
        transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
        className={`grid h-4 w-4 place-items-center rounded-full transition ${
          done ? 'bg-emerald-400/25 text-emerald-100 ring-1 ring-emerald-300/40' : 'bg-white/[0.07] text-white/30 ring-1 ring-white/[0.08]'
        }`}
      >
        {done ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : <span className="h-1 w-1 rounded-full bg-white/40" />}
      </motion.span>
      <span className={done ? 'text-white/80' : 'text-white/40'}>{label}</span>
    </motion.li>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-white/35">{label}</span>
      <span className="font-semibold text-white/82">{value}</span>
    </div>
  );
}

function StepIndicator({ step }: { step: DemoStep }) {
  const items: { id: DemoStep; label: string }[] = [
    { id: 'planning', label: 'Goal' },
    { id: 'team', label: 'Team' },
    { id: 'executing', label: 'Execution' },
    { id: 'complete', label: 'Deliverable' },
  ];
  const idx = STEP_INDEX[step];
  return (
    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]">
      {items.map((item) => {
        const itemIdx = STEP_INDEX[item.id];
        const reached = idx >= itemIdx;
        return (
          <span
            key={item.id}
            className={`rounded-full border px-2 py-0.5 transition ${
              reached
                ? 'border-violet-400/35 bg-violet-500/12 text-violet-100'
                : 'border-white/[0.08] bg-white/[0.03] text-white/35'
            }`}
          >
            {item.label}
          </span>
        );
      })}
    </div>
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

function PulseDot() {
  return (
    <span className="relative inline-flex h-2 w-2">
      <span className="absolute inset-0 animate-ping rounded-full bg-cyan-300/60" />
      <span className="relative inline-block h-2 w-2 rounded-full bg-cyan-300" />
    </span>
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
        className="w-full max-w-[600px] overflow-hidden rounded-[22px] border border-white/[0.10] bg-[#0a0d18] shadow-[0_30px_90px_rgba(0,0,0,0.6)]"
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-[11px] bg-white/[0.08] text-white/85 ring-1 ring-white/[0.10]">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[14px] font-bold leading-tight text-white">Launch Plan</p>
              <p className="text-[11px] text-white/45">Competitor research · Market positioning</p>
            </div>
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
          <PreviewSection title="Competitor Landscape">
            <PreviewLine>3 direct competitors mapped across pricing, positioning, and product surface area.</PreviewLine>
            <PreviewLine>Common weakness: thin onboarding, no built-in approvals.</PreviewLine>
          </PreviewSection>

          <PreviewSection title="Market Positioning">
            <PreviewLine>Lead message: an AI workspace that coordinates teams, not just chats.</PreviewLine>
            <PreviewLine>ICP: founders and small ops teams needing structured AI output.</PreviewLine>
          </PreviewSection>

          <PreviewSection title="Recommended Launch Strategy">
            <PreviewLine>Phase 1 — Private beta for 50 design partners (week 1–2).</PreviewLine>
            <PreviewLine>Phase 2 — Public waitlist + content series on coordinated AI (week 3–6).</PreviewLine>
            <PreviewLine>Phase 3 — Open launch with one signature template per ICP (week 7).</PreviewLine>
          </PreviewSection>

          <PreviewSection title="Next Actions">
            <PreviewLine>Approve positioning brief and assign owner.</PreviewLine>
            <PreviewLine>Schedule 5 design-partner intros this week.</PreviewLine>
            <PreviewLine>Draft launch landing copy from this report.</PreviewLine>
          </PreviewSection>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] px-5 py-3.5">
          <button
            onClick={onClose}
            className="rounded-full border border-white/[0.10] bg-white/[0.04] px-4 py-1.5 text-[12px] font-semibold text-white/70 transition hover:bg-white/[0.08] hover:text-white"
          >
            Close Preview
          </button>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/90 px-4 py-1.5 text-[12px] font-bold text-[#06140d]">
            <Check className="h-3 w-3" />
            Review-ready
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">{title}</p>
      <div className="mt-2 space-y-1.5">{children}</div>
    </section>
  );
}

function PreviewLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-[12.5px] leading-snug text-white/75">
      <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-white/35" />
      <span>{children}</span>
    </div>
  );
}

export default HeroInteractiveDemo;
