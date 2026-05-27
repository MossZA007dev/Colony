import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Bot,
  FolderOpen,
  FileText,
  ClipboardCheck,
  RotateCcw,
  ArrowRight,
  Check,
  CheckCircle2,
  Search,
  BarChart3,
  Briefcase,
  Megaphone,
  Settings,
  Wallet,
  Calendar,
  Database,
  Sparkles,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { ColonyLogo } from '../../../components/brand/BrandMarks';
import { EASE_OUT_EXPO } from './motion';

/* ─── Types ─────────────────────────────────────────────────────────── */

export type DemoStage = 'goal' | 'routing' | 'work-mode' | 'approval' | 'deliverable';
export type DemoScenarioId = 'crew' | 'automation' | 'enterprise' | 'connected-action';
type ModeAccent = 'violet' | 'teal' | 'blue' | 'amber';
type WorkViz = 'chain' | 'workflow' | 'org' | 'connected-action';
type WorkNode = { label: string; sub?: string; icon?: React.ElementType };

type DemoScenario = {
  id: DemoScenarioId;
  selectorLabel: string;
  selectorMode: string;
  goal: string;
  analysis: string;
  detectedSignals: string[];
  selectedMode: string;
  modeAccent: ModeAccent;
  routingBadge: string;
  routingReason: string;
  usesColonyBridge: boolean;
  capabilityNote?: string;
  workViz: WorkViz;
  workNodes: WorkNode[];
  executionPlan: string[];
  approvalCopy: string;
  approvalKind: 'review' | 'connected-action';
  deliverable: { title: string; status: string; subtitle?: string };
};

/* ─── Constants ─────────────────────────────────────────────────────── */

const STAGES: DemoStage[] = ['goal', 'routing', 'work-mode', 'approval', 'deliverable'];
const STAGE_LABELS: Record<DemoStage, string> = {
  goal: 'Goal',
  routing: 'Routing',
  'work-mode': 'Work Mode',
  approval: 'Approval',
  deliverable: 'Deliverable',
};
const STAGE_MS: Record<DemoStage, number> = {
  goal: 1100,
  routing: 1400,
  'work-mode': 2300,
  approval: 1300,
  deliverable: 1800,
};

const ACCENT: Record<
  ModeAccent,
  { text: string; border: string; bg: string; ring: string; line: string; glow: string }
> = {
  violet: {
    text: 'text-violet-100',
    border: 'border-violet-300/30',
    bg: 'bg-violet-500/[0.12]',
    ring: 'ring-violet-300/35',
    line: 'rgba(167,139,250,0.55)',
    glow: '0 0 28px rgba(167,139,250,0.22)',
  },
  teal: {
    text: 'text-emerald-100',
    border: 'border-emerald-300/30',
    bg: 'bg-emerald-400/[0.10]',
    ring: 'ring-emerald-300/30',
    line: 'rgba(110,231,183,0.50)',
    glow: '0 0 28px rgba(110,231,183,0.22)',
  },
  blue: {
    text: 'text-[#bcd9ff]',
    border: 'border-[#7db7ff]/35',
    bg: 'bg-[#7db7ff]/[0.10]',
    ring: 'ring-[#7db7ff]/30',
    line: 'rgba(125,183,255,0.55)',
    glow: '0 0 28px rgba(125,183,255,0.22)',
  },
  amber: {
    text: 'text-amber-100',
    border: 'border-amber-300/35',
    bg: 'bg-amber-400/[0.10]',
    ring: 'ring-amber-300/30',
    line: 'rgba(252,211,77,0.55)',
    glow: '0 0 28px rgba(252,211,77,0.22)',
  },
};

const SCENARIOS: DemoScenario[] = [
  {
    id: 'crew',
    selectorLabel: 'Complex Task',
    selectorMode: 'Colony Crew',
    goal: 'Research my competitors and prepare a launch plan.',
    analysis: 'Multi-step research and strategy task detected.',
    detectedSignals: ['Multi-step task', 'Research required', 'Review-ready output'],
    selectedMode: 'Colony Crew',
    modeAccent: 'violet',
    routingBadge: 'Colony Crew Selected',
    routingReason: 'This task benefits from specialist agents working together.',
    usesColonyBridge: false,
    workViz: 'chain',
    workNodes: [
      { label: 'Research Agent', sub: 'Competitor scan', icon: Search },
      { label: 'Strategy Agent', sub: 'Positioning', icon: BarChart3 },
      { label: 'Report Writer', sub: 'Launch plan', icon: FileText },
      { label: 'Reviewer', sub: 'Quality check', icon: ClipboardCheck },
    ],
    executionPlan: [
      'Understand goal',
      'Select Colony Crew',
      'Assemble specialist agents',
      'Research competitors',
      'Prepare launch deliverable',
    ],
    approvalCopy: 'Review deliverable before export.',
    approvalKind: 'review',
    deliverable: { title: 'Launch Plan', status: 'Ready for review', subtitle: '4 specialists selected' },
  },
  {
    id: 'automation',
    selectorLabel: 'Recurring Work',
    selectorMode: 'Automation + Colony Bridge',
    goal: 'Create a weekly sales report every Monday morning.',
    analysis: 'Recurring task and repeatable reporting workflow detected.',
    detectedSignals: ['Scheduled trigger', 'Data source needed', 'Report output'],
    selectedMode: 'Automation',
    modeAccent: 'teal',
    routingBadge: 'Automation Selected',
    routingReason: 'A scheduled workflow is the most efficient approach.',
    usesColonyBridge: true,
    capabilityNote: 'Colony Bridge connects approved data sources.',
    workViz: 'workflow',
    workNodes: [
      { label: 'Monday Trigger', sub: '08:00 weekly', icon: Calendar },
      { label: 'Google Sheets', sub: 'Sales data', icon: Database },
      { label: 'AI Summary', sub: 'Highlights', icon: Sparkles },
      { label: 'Approval', sub: 'You review', icon: ClipboardCheck },
      { label: 'Weekly Report', sub: 'Delivered', icon: FileText },
    ],
    executionPlan: [
      'Understand goal',
      'Select Automation',
      'Connect approved data source',
      'Generate weekly summary',
      'Request approval',
    ],
    approvalCopy: 'Approve before sending scheduled report.',
    approvalKind: 'review',
    deliverable: { title: 'Weekly Sales Workflow', status: 'Scheduled and ready' },
  },
  {
    id: 'enterprise',
    selectorLabel: 'Build a Business',
    selectorMode: 'One-man Enterprise',
    goal: 'Help me launch and operate a small online business.',
    analysis: 'Long-term operating goal requiring multiple roles and coordination.',
    detectedSignals: ['Long-term goal', 'Multiple roles', 'Ongoing operation'],
    selectedMode: 'One-man Enterprise',
    modeAccent: 'blue',
    routingBadge: 'One-man Enterprise Selected',
    routingReason: 'A structured AI organization is the best fit for this goal.',
    usesColonyBridge: false,
    workViz: 'org',
    workNodes: [
      { label: 'AI Director', icon: Bot },
      { label: 'Project Manager', icon: Briefcase },
      { label: 'Research', icon: Search },
      { label: 'Marketing', icon: Megaphone },
      { label: 'Operations', icon: Settings },
      { label: 'Finance', icon: Wallet },
    ],
    executionPlan: [
      'Understand business goal',
      'Select One-man Enterprise',
      'Create operating roles',
      'Assign responsibilities',
      'Open AI workspace',
    ],
    approvalCopy: 'Approval settings enabled for external actions.',
    approvalKind: 'review',
    deliverable: { title: 'AI Business Workspace', status: 'Organization created', subtitle: '5 AI roles assigned' },
  },
  {
    id: 'connected-action',
    selectorLabel: 'Connected Action',
    selectorMode: 'AI Ant + Colony Bridge',
    goal: 'Read my latest Drive proposal and prepare a Gmail reply.',
    analysis: 'This task requires approved access to connected tools.',
    detectedSignals: ['Approved tool access', 'External action', 'Approval required'],
    selectedMode: 'Colony Bridge · Action Layer',
    modeAccent: 'amber',
    routingBadge: 'Colony Bridge Active',
    routingReason: 'External tool access requires the approved action layer.',
    usesColonyBridge: true,
    capabilityNote: 'Primary capability: Colony Bridge · Action Layer',
    workViz: 'connected-action',
    workNodes: [
      { label: 'Google Drive', sub: 'Proposal source', icon: FolderOpen },
      { label: 'Colony Bridge', sub: 'Action layer', icon: ShieldCheck },
      { label: 'Draft Reply', sub: 'AI Ant prepares', icon: FileText },
      { label: 'User Approval', sub: 'You review', icon: ClipboardCheck },
      { label: 'Gmail', sub: 'Send on approval', icon: Mail },
    ],
    executionPlan: [
      'Understand goal',
      'Activate Colony Bridge',
      'Read approved Drive file',
      'Prepare Gmail draft',
      'Waiting for approval',
    ],
    approvalCopy: 'AI Ant prepared an email reply. Review before sending.',
    approvalKind: 'connected-action',
    deliverable: { title: 'Email Draft', status: 'Ready for approval' },
  },
];

const stageIndex = (s: DemoStage) => STAGES.indexOf(s);

/* ─── Main ───────────────────────────────────────────────────────────── */

export function HeroInteractiveDemo() {
  const reduce = useReducedMotion();
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [stage, setStage] = useState<DemoStage>('goal');
  const [isPaused, setIsPaused] = useState(false);
  const scenario = SCENARIOS[scenarioIdx];

  useEffect(() => {
    if (reduce) return;
    if (isPaused) return;
    const duration = STAGE_MS[stage];
    const t = window.setTimeout(() => {
      if (stage === 'deliverable') {
        setScenarioIdx((i) => (i + 1) % SCENARIOS.length);
        setStage('goal');
      } else {
        const next = STAGES[stageIndex(stage) + 1];
        setStage(next);
      }
    }, duration);
    return () => window.clearTimeout(t);
  }, [stage, isPaused, scenarioIdx, reduce]);

  const selectScenario = useCallback((idx: number) => {
    setScenarioIdx(idx);
    setStage('goal');
  }, []);

  const replay = useCallback(() => {
    setStage('goal');
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[760px] lg:max-w-[860px] xl:max-w-[920px]">
      <HeroPreviewGlow reduce={!!reduce} />

      {/* Eyebrow */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35, ease: EASE_OUT_EXPO }}
        className="relative z-10 mb-3 ml-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-white/60 sm:ml-5"
      >
        <span className="relative inline-flex h-1.5 w-1.5">
          {!reduce && <span className="absolute inset-0 animate-ping rounded-full bg-emerald-300/60" />}
          <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" />
        </span>
        <span className="uppercase tracking-[0.18em] text-white/65">Interactive Prototype</span>
        <span className="text-white/30">/</span>
        <span className="text-white/55">Preview how Colony Bridge is designed to work</span>
        <span className="hidden text-white/25 sm:inline">·</span>
        <span className="hidden text-[10px] font-medium uppercase tracking-[0.16em] text-white/38 sm:inline">
          Simulated, no real actions
        </span>
      </motion.div>

      {/* Scenario selector */}
      <ScenarioSelector activeIdx={scenarioIdx} onSelect={selectScenario} />

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

      {/* Frame */}
      <motion.div
        initial={{ opacity: 0, y: 28, filter: 'blur(8px)' }}
        animate={reduce ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 1, y: [0, -5, 0], filter: 'blur(0px)' }}
        transition={
          reduce
            ? { duration: 0.9, delay: 0.5, ease: EASE_OUT_EXPO }
            : {
                opacity: { duration: 0.9, delay: 0.5, ease: EASE_OUT_EXPO },
                filter: { duration: 0.9, delay: 0.5, ease: EASE_OUT_EXPO },
                y: { duration: 9, repeat: Infinity, ease: 'easeInOut' },
              }
        }
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        id="hero-demo"
        className="relative z-10 w-full max-w-[calc(100vw-40px)] overflow-hidden rounded-[28px] backdrop-blur-2xl lg:max-w-full"
        style={{
          background:
            'linear-gradient(180deg, rgba(24,31,47,0.92) 0%, rgba(10,13,24,0.95) 44%, rgba(5,7,14,0.97) 100%)',
          boxShadow:
            '0 26px 72px rgba(37,99,235,0.14), 0 0 72px rgba(125,183,255,0.16), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(125,183,255,0.05)',
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              'radial-gradient(80% 45% at 50% 0%, rgba(125,183,255,0.16), transparent 62%), linear-gradient(90deg, rgba(255,255,255,0.08), transparent 18%, transparent 82%, rgba(125,183,255,0.08))',
          }}
        />

        <TopBar scenario={scenario} stage={stage} reduce={!!reduce} />

        <div className="relative z-10 grid gap-0 lg:grid-cols-[160px_minmax(0,1fr)_220px]">
          <Sidebar stage={stage} reduce={!!reduce} />

          <div className="relative flex min-h-[460px] min-w-0 flex-col bg-[radial-gradient(circle_at_50%_10%,rgba(125,183,255,0.055),transparent_44%)] p-5 md:p-6">
            <CenterPanel scenario={scenario} stage={stage} reduce={!!reduce} />
          </div>

          <ExecutionPanel scenario={scenario} stage={stage} />
        </div>

        <Footer stage={stage} onReplay={replay} />
      </motion.div>
    </div>
  );
}

/* ─── Glow ────────────────────────────────────────────────────────────── */

function HeroPreviewGlow({ reduce }: { reduce: boolean }) {
  return (
    <div
      className="pointer-events-none absolute -inset-x-10 -inset-y-14 -z-10 overflow-visible sm:-inset-x-16 lg:-inset-x-24 lg:-inset-y-20"
      aria-hidden
    >
      <motion.div
        className="absolute left-1/2 top-[42%] h-[74%] w-[118%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(125,183,255,0.28) 0%, rgba(79,158,255,0.14) 30%, rgba(124,92,252,0.09) 52%, transparent 74%)',
          filter: 'blur(34px)',
        }}
        animate={reduce ? undefined : { opacity: [0.72, 1, 0.72], scale: [0.98, 1.03, 0.98] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div
        className="absolute left-1/2 top-[48%] h-[92%] w-[112%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(219,238,255,0.12) 0%, rgba(125,183,255,0.08) 24%, rgba(5,5,8,0) 62%)',
          filter: 'blur(10px)',
        }}
      />
    </div>
  );
}

/* ─── Scenario selector ──────────────────────────────────────────────── */

function ScenarioSelector({ activeIdx, onSelect }: { activeIdx: number; onSelect: (idx: number) => void }) {
  return (
    <div className="relative z-10 mb-3 ml-1 mr-1 flex gap-2 overflow-x-auto pb-1 sm:ml-2 sm:mr-2">
      {SCENARIOS.map((s, idx) => {
        const active = idx === activeIdx;
        const tone = ACCENT[s.modeAccent];
        return (
          <button
            key={s.id}
            onClick={() => onSelect(idx)}
            className={`group relative flex-shrink-0 rounded-full border px-3.5 py-1.5 text-left transition ${
              active
                ? `${tone.border} ${tone.bg} ${tone.text}`
                : 'border-white/[0.08] bg-white/[0.025] text-white/55 hover:border-white/[0.16] hover:bg-white/[0.05] hover:text-white/80'
            }`}
            style={active ? { boxShadow: tone.glow } : undefined}
          >
            <div className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-current' : 'bg-white/30'}`} />
              <span className="text-[11.5px] font-semibold leading-none">{s.selectorLabel}</span>
              <span
                className={`hidden text-[10px] font-medium leading-none sm:inline ${
                  active ? 'opacity-80' : 'text-white/35'
                }`}
              >
                · {s.selectorMode}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Top bar ────────────────────────────────────────────────────────── */

function TopBar({ scenario, stage, reduce }: { scenario: DemoScenario; stage: DemoStage; reduce: boolean }) {
  const tone = ACCENT[scenario.modeAccent];
  const badge = stage === 'goal' || stage === 'routing' ? 'Routing goal…' : scenario.routingBadge;
  return (
    <div className="relative z-10 flex items-center justify-between border-b border-white/[0.07] bg-white/[0.025] px-4 py-3.5 md:px-5">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-white shadow-[0_0_24px_rgba(125,183,255,0.22)]">
          <img src="/assets/logos/ai ant black (2).png" alt="" width={16} height={16} draggable={false} />
        </span>
        <div className="min-w-0">
          <p className="text-[12.5px] font-bold leading-tight text-white">AI Ant</p>
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">Colony Bridge Operator</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <AnimatePresence mode="wait">
          <motion.span
            key={badge}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: reduce ? 0 : 0.3, ease: EASE_OUT_EXPO }}
            className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold sm:inline-flex ${
              stage === 'goal' || stage === 'routing'
                ? 'border-white/[0.10] bg-white/[0.04] text-white/68'
                : `${tone.border} ${tone.bg} ${tone.text}`
            }`}
          >
            {!reduce && (stage === 'goal' || stage === 'routing') && (
              <span className="relative inline-flex h-1.5 w-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-white/40" />
                <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-white/80" />
              </span>
            )}
            {badge}
          </motion.span>
        </AnimatePresence>
        <span className="hidden items-center gap-1.5 rounded-full border border-amber-400/22 bg-amber-400/[0.07] px-2.5 py-0.5 text-[10px] font-semibold text-amber-200 sm:inline-flex">
          <ClipboardCheck className="h-3 w-3" />
          Approval Mode
        </span>
      </div>
    </div>
  );
}

/* ─── Sidebar ────────────────────────────────────────────────────────── */

function Sidebar({ stage, reduce }: { stage: DemoStage; reduce: boolean }) {
  return (
    <aside className="hidden flex-col gap-1 border-r border-white/[0.07] bg-[#070A12]/70 p-3 lg:flex">
      <div className="mb-2.5 flex items-center gap-2 px-1.5">
        <ColonyLogo size={18} />
        <span className="font-heading text-[12px] font-extrabold tracking-tight text-white/88">Colony Bridge</span>
      </div>
      <NavItem icon={Bot} label="AI Ant" active />
      <NavItem icon={FolderOpen} label="Projects" />
      <NavItem icon={FileText} label="Deliverables" highlight={stage === 'deliverable'} />
      <NavItem icon={ClipboardCheck} label="Approvals" highlight={stage === 'approval'} />
      <div className="mt-auto rounded-[10px] border border-emerald-400/15 bg-emerald-400/[0.06] px-2.5 py-2">
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full bg-emerald-300 ${!reduce ? 'animate-pulse' : ''}`} />
          <p className="text-[10px] font-bold text-emerald-200/90">Live</p>
        </div>
        <p className="mt-0.5 text-[9px] leading-snug text-white/40">Mock scenario · client-side</p>
      </div>
    </aside>
  );
}

function NavItem({
  icon: Icon,
  label,
  active,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  highlight?: boolean;
}) {
  const cls = active
    ? 'bg-violet-500/15 text-white ring-1 ring-violet-400/22'
    : highlight
    ? 'bg-white/[0.06] text-white/92 ring-1 ring-white/[0.12]'
    : 'text-white/48';
  return (
    <div className={`flex items-center gap-2 rounded-[8px] px-2 py-1.5 text-[11.5px] font-medium transition ${cls}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </div>
  );
}

/* ─── Center panel ───────────────────────────────────────────────────── */

function CenterPanel({ scenario, stage, reduce }: { scenario: DemoScenario; stage: DemoStage; reduce: boolean }) {
  const motionProps = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: reduce ? 0 : 0.4, ease: EASE_OUT_EXPO },
  };

  return (
    <div className="relative flex min-h-[420px] flex-col">
      <AnimatePresence mode="wait">
        {stage === 'goal' && (
          <motion.div key={`goal-${scenario.id}`} {...motionProps} className="flex h-full flex-col">
            <GoalStage scenario={scenario} />
          </motion.div>
        )}
        {stage === 'routing' && (
          <motion.div key={`routing-${scenario.id}`} {...motionProps} className="flex h-full flex-col">
            <RoutingStage scenario={scenario} reduce={reduce} />
          </motion.div>
        )}
        {stage === 'work-mode' && (
          <motion.div key={`work-${scenario.id}`} {...motionProps} className="flex h-full flex-col">
            <WorkModeStage scenario={scenario} reduce={reduce} />
          </motion.div>
        )}
        {stage === 'approval' && (
          <motion.div key={`approval-${scenario.id}`} {...motionProps} className="flex h-full flex-col">
            <ApprovalStage scenario={scenario} />
          </motion.div>
        )}
        {stage === 'deliverable' && (
          <motion.div key={`deliverable-${scenario.id}`} {...motionProps} className="flex h-full flex-col">
            <DeliverableStage scenario={scenario} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Stages ─────────────────────────────────────────────────────────── */

function GoalCard({ goal, compact = false }: { goal: string; compact?: boolean }) {
  return (
    <div
      className={`rounded-[18px] border border-white/[0.11] bg-white/[0.045] ${compact ? 'px-3.5 py-2.5' : 'px-4 py-3.5'}`}
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 12px 30px rgba(0,0,0,0.16)' }}
    >
      <p
        className={`font-medium uppercase tracking-[0.22em] text-white/45 ${compact ? 'text-[9.5px]' : 'text-[11px]'}`}
        style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
      >
        Goal
      </p>
      <p className={`mt-1.5 leading-[1.5] text-white/94 ${compact ? 'text-[13px]' : 'text-[15px]'}`}>{goal}</p>
    </div>
  );
}

function GoalStage({ scenario }: { scenario: DemoScenario }) {
  return (
    <div className="flex h-full flex-col gap-4">
      <GoalCard goal={scenario.goal} />
      <p className="text-[12.5px] text-white/55">AI Ant is reading the goal…</p>
    </div>
  );
}

function RoutingStage({ scenario, reduce }: { scenario: DemoScenario; reduce: boolean }) {
  const tone = ACCENT[scenario.modeAccent];
  return (
    <div className="flex h-full flex-col gap-4">
      <GoalCard goal={scenario.goal} compact />
      <div className="flex items-center gap-2.5 text-[13px] text-white/72">
        <DotsLoader reduce={reduce} />
        <span>AI Ant is choosing the best way to work…</span>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Detected</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {scenario.detectedSignals.map((s, i) => (
            <motion.span
              key={s}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.3, delay: reduce ? 0 : i * 0.12, ease: EASE_OUT_EXPO }}
              className="rounded-full border border-white/[0.10] bg-white/[0.04] px-2.5 py-1 text-[10.5px] font-semibold text-white/72"
            >
              {s}
            </motion.span>
          ))}
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0 : 0.4, delay: reduce ? 0 : 0.5, ease: EASE_OUT_EXPO }}
        className={`mt-1 inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-semibold ${tone.border} ${tone.bg} ${tone.text}`}
        style={{ boxShadow: tone.glow }}
      >
        <Sparkles className="h-3 w-3" />
        Best fit: {scenario.selectedMode}
      </motion.div>
      {scenario.capabilityNote && (
        <p className="text-[11.5px] text-white/50">{scenario.capabilityNote}</p>
      )}
      <p className="text-[11.5px] leading-relaxed text-white/45">{scenario.routingReason}</p>
    </div>
  );
}

function WorkModeStage({ scenario, reduce }: { scenario: DemoScenario; reduce: boolean }) {
  return (
    <div className="flex h-full flex-col gap-4">
      <GoalCard goal={scenario.goal} compact />
      <ModeViz scenario={scenario} reduce={reduce} />
      {scenario.usesColonyBridge && scenario.workViz !== 'connected-action' && (
        <ColonyBridgeBanner scenario={scenario} />
      )}
    </div>
  );
}

function ColonyBridgeBanner({ scenario }: { scenario: DemoScenario }) {
  return (
    <div
      className="flex items-center gap-3 rounded-[14px] border border-amber-400/25 bg-amber-400/[0.06] px-3.5 py-2.5"
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
    >
      <div className="grid h-8 w-8 place-items-center rounded-[10px] bg-amber-400/15 text-amber-100 ring-1 ring-amber-300/35">
        <ShieldCheck className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[12px] font-bold text-amber-100">Colony Bridge active</p>
        <p className="mt-0.5 text-[10.5px] text-amber-100/70">
          {scenario.id === 'automation'
            ? 'Connected source: Google Sheets · Approval required before sending report'
            : scenario.capabilityNote || 'Approved tool access enabled.'}
        </p>
      </div>
    </div>
  );
}

function ApprovalStage({ scenario }: { scenario: DemoScenario }) {
  if (scenario.approvalKind === 'connected-action') {
    return (
      <div className="flex h-full flex-col gap-4">
        <GoalCard goal={scenario.goal} compact />
        <div
          className="rounded-[18px] border border-amber-400/30 bg-amber-400/[0.07] p-4"
          style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 14px 36px rgba(252,211,77,0.12)' }}
        >
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-amber-200" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/90">Approval Required</p>
          </div>
          <p className="mt-2.5 text-[14px] font-semibold text-white">AI Ant prepared an email reply.</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-white/65">Review before sending.</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.14] bg-white/[0.06] px-3.5 py-1.5 text-[12px] font-semibold text-white/82 transition hover:border-white/[0.22] hover:bg-white/[0.10] hover:text-white"
            >
              Review Draft
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-300 px-3.5 py-1.5 text-[12px] font-bold text-[#1a1305] transition hover:bg-amber-200"
            >
              <Check className="h-3 w-3" />
              Approve Send
            </button>
          </div>
          <p className="mt-3 text-[10.5px] text-white/40">Prototype simulation · no real email is sent.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col gap-4">
      <GoalCard goal={scenario.goal} compact />
      <div
        className="rounded-[18px] border border-amber-400/22 bg-amber-400/[0.05] p-4"
        style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
      >
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-amber-200" />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/90">Approval Required</p>
        </div>
        <p className="mt-2 text-[13.5px] leading-relaxed text-white/90">{scenario.approvalCopy}</p>
      </div>
      <p className="text-[11.5px] text-white/45">Sensitive actions wait for your approval before they run.</p>
    </div>
  );
}

function DeliverableStage({ scenario }: { scenario: DemoScenario }) {
  const tone = ACCENT[scenario.modeAccent];
  return (
    <div className="flex h-full flex-col gap-4">
      <GoalCard goal={scenario.goal} compact />
      <motion.div
        initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
        className="rounded-[18px] border px-4 py-4"
        style={{
          borderColor: 'rgba(125,183,255,0.28)',
          background: 'linear-gradient(180deg, rgba(125,183,255,0.10) 0%, rgba(125,183,255,0.04) 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 12px 32px rgba(125,183,255,0.10)',
        }}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">Deliverable Ready</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className={`grid h-11 w-11 place-items-center rounded-[12px] ring-1 ${tone.ring} ${tone.bg} ${tone.text}`}>
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold leading-tight text-white">{scenario.deliverable.title}</p>
              <p className="mt-0.5 truncate text-[11.5px] text-white/55">{scenario.deliverable.status}</p>
            </div>
          </div>
          {scenario.deliverable.subtitle && (
            <span className="hidden rounded-full border border-white/[0.14] bg-white/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/75 sm:inline-block">
              {scenario.deliverable.subtitle}
            </span>
          )}
        </div>
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[12px] font-bold text-[#070B14] transition hover:bg-white/92"
          >
            Open Deliverable
            <ArrowRight className="h-3 w-3" />
          </button>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/[0.10] px-3.5 py-1.5 text-[12px] font-bold text-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            {scenario.approvalKind === 'connected-action' ? 'Waiting for approval' : 'Review-ready'}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Mode visualizations ────────────────────────────────────────────── */

function ModeViz({ scenario, reduce }: { scenario: DemoScenario; reduce: boolean }) {
  if (scenario.workViz === 'org') return <OrgViz scenario={scenario} reduce={reduce} />;
  if (scenario.workViz === 'connected-action') return <ConnectedActionViz scenario={scenario} reduce={reduce} />;
  return <ChainViz scenario={scenario} reduce={reduce} />;
}

function ChainViz({ scenario, reduce }: { scenario: DemoScenario; reduce: boolean }) {
  const tone = ACCENT[scenario.modeAccent];
  return (
    <div>
      <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">{scenario.selectedMode}</p>
      <div className="flex flex-wrap items-stretch gap-2">
        {scenario.workNodes.map((node, i) => (
          <React.Fragment key={node.label}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.35, delay: reduce ? 0 : i * 0.18, ease: EASE_OUT_EXPO }}
              className={`relative flex min-w-[110px] flex-1 flex-col rounded-[14px] border bg-white/[0.04] p-2.5 ${tone.border}`}
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}
            >
              <div className="flex items-center gap-2">
                <div className={`grid h-7 w-7 place-items-center rounded-[9px] ring-1 ${tone.ring} ${tone.bg} ${tone.text}`}>
                  {node.icon && <node.icon className="h-3.5 w-3.5" />}
                </div>
                <p className="text-[11.5px] font-bold text-white/92">{node.label}</p>
              </div>
              {node.sub && <p className="mt-1.5 text-[10px] leading-snug text-white/50">{node.sub}</p>}
              {!reduce && (
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1.6, delay: i * 0.12, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-x-2 bottom-0 h-[2px] origin-left rounded-full"
                  style={{ background: `linear-gradient(90deg, transparent, ${tone.line}, transparent)` }}
                />
              )}
            </motion.div>
            {i < scenario.workNodes.length - 1 && (
              <span className="hidden self-center text-white/30 sm:inline-flex">
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function OrgViz({ scenario, reduce }: { scenario: DemoScenario; reduce: boolean }) {
  const tone = ACCENT[scenario.modeAccent];
  const [director, pm, ...leaves] = scenario.workNodes;
  return (
    <div>
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">{scenario.selectedMode}</p>
      <div className="flex flex-col items-center gap-2">
        <OrgNode node={director} tone={tone} large reduce={reduce} delay={0} />
        <span className="h-3 w-px bg-white/15" />
        <OrgNode node={pm} tone={tone} reduce={reduce} delay={0.15} />
        <span className="h-3 w-px bg-white/15" />
        <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
          {leaves.map((leaf, i) => (
            <OrgNode key={leaf.label} node={leaf} tone={tone} small reduce={reduce} delay={0.3 + i * 0.08} />
          ))}
        </div>
      </div>
    </div>
  );
}

function OrgNode({
  node,
  tone,
  large,
  small,
  reduce,
  delay,
}: {
  node: WorkNode;
  tone: (typeof ACCENT)[ModeAccent];
  large?: boolean;
  small?: boolean;
  reduce: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.35, delay: reduce ? 0 : delay, ease: EASE_OUT_EXPO }}
      className={`flex items-center gap-2 rounded-full border ${tone.border} bg-white/[0.035] ${
        large ? 'px-3.5 py-1.5' : small ? 'px-2.5 py-1.5' : 'px-3 py-1.5'
      }`}
    >
      <span className={`grid place-items-center rounded-[8px] ring-1 ${tone.ring} ${tone.bg} ${tone.text} ${large ? 'h-7 w-7' : 'h-6 w-6'}`}>
        {node.icon && <node.icon className={large ? 'h-3.5 w-3.5' : 'h-3 w-3'} />}
      </span>
      <span className={`font-semibold text-white/90 ${large ? 'text-[12px]' : small ? 'text-[11px]' : 'text-[11.5px]'}`}>
        {node.label}
      </span>
    </motion.div>
  );
}

function ConnectedActionViz({ scenario, reduce }: { scenario: DemoScenario; reduce: boolean }) {
  return (
    <div>
      <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200/85">
        {scenario.selectedMode}
      </p>
      <div className="flex flex-col items-stretch gap-1.5">
        {scenario.workNodes.map((node, i) => {
          const isBridge = node.label === 'Colony Bridge';
          const tone = ACCENT[isBridge ? 'amber' : scenario.modeAccent];
          return (
            <React.Fragment key={node.label}>
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: reduce ? 0 : 0.3, delay: reduce ? 0 : i * 0.14, ease: EASE_OUT_EXPO }}
                className={`flex items-center gap-2.5 rounded-[12px] border bg-white/[0.035] px-3 py-2 ${tone.border} ${
                  isBridge ? 'ring-1 ring-amber-300/30' : ''
                }`}
                style={isBridge ? { boxShadow: tone.glow } : undefined}
              >
                <span className={`grid h-7 w-7 place-items-center rounded-[9px] ring-1 ${tone.ring} ${tone.bg} ${tone.text}`}>
                  {node.icon && <node.icon className="h-3.5 w-3.5" />}
                </span>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-white/92">{node.label}</p>
                  {node.sub && <p className="mt-0.5 text-[10px] text-white/52">{node.sub}</p>}
                </div>
              </motion.div>
              {i < scenario.workNodes.length - 1 && (
                <span className="ml-3.5 h-3 w-px bg-white/15" aria-hidden />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Execution panel ────────────────────────────────────────────────── */

function ExecutionPanel({ scenario, stage }: { scenario: DemoScenario; stage: DemoStage }) {
  const idx = stageIndex(stage);
  return (
    <aside className="hidden flex-col gap-3 border-l border-white/[0.07] bg-[#070A12]/70 p-4 lg:flex">
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/36">Execution Plan</p>
      <ul className="space-y-1.5">
        {scenario.executionPlan.map((label, i) => {
          const done = i < idx;
          const active = i === idx;
          return (
            <motion.li layout key={`${scenario.id}-${i}-${label}`} className="flex items-start gap-2 text-[11px]">
              <motion.span
                layout
                animate={done ? { scale: [0.6, 1.08, 1] } : undefined}
                transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
                className={`grid h-4 w-4 shrink-0 place-items-center rounded-full transition ${
                  done
                    ? 'bg-emerald-400/25 text-emerald-100 ring-1 ring-emerald-300/40'
                    : active
                    ? 'bg-white/[0.10] text-white/85 ring-1 ring-white/[0.18]'
                    : 'bg-white/[0.05] text-white/30 ring-1 ring-white/[0.06]'
                }`}
              >
                {done ? (
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                ) : active ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                ) : (
                  <span className="h-1 w-1 rounded-full bg-white/35" />
                )}
              </motion.span>
              <span className={done ? 'text-white/82' : active ? 'text-white/90' : 'text-white/38'}>{label}</span>
            </motion.li>
          );
        })}
      </ul>
      <div className="mt-auto space-y-1.5 rounded-[12px] border border-white/[0.07] bg-white/[0.025] px-3 py-2.5 text-[10px] text-white/55">
        <Metric label="Mode" value={scenario.selectedMode} />
        <Metric label="Colony Bridge" value={scenario.usesColonyBridge ? 'Active' : 'Not used'} />
        <Metric label="Stage" value={STAGE_LABELS[stage]} />
      </div>
    </aside>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="shrink-0 text-white/35">{label}</span>
      <span className="truncate text-right font-semibold text-white/82">{value}</span>
    </div>
  );
}

/* ─── Footer ─────────────────────────────────────────────────────────── */

function Footer({ stage, onReplay }: { stage: DemoStage; onReplay: () => void }) {
  const idx = stageIndex(stage);
  return (
    <div className="relative z-10 flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] bg-black/[0.10] px-4 py-2.5 md:px-5">
      <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]">
        {STAGES.map((s, i) => {
          const reached = i <= idx;
          const active = i === idx;
          return (
            <span
              key={s}
              className={`rounded-full border px-2 py-0.5 transition ${
                active
                  ? 'border-violet-400/45 bg-violet-500/18 text-white shadow-[0_0_18px_rgba(124,92,252,0.25)]'
                  : reached
                  ? 'border-violet-400/30 bg-violet-500/10 text-violet-100'
                  : 'border-white/[0.08] bg-white/[0.03] text-white/35'
              }`}
            >
              {STAGE_LABELS[s]}
            </span>
          );
        })}
      </div>
      <button
        onClick={onReplay}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.10] bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-white/70 transition hover:border-white/[0.18] hover:bg-white/[0.08] hover:text-white"
      >
        <RotateCcw className="h-3 w-3" />
        Replay demo
      </button>
    </div>
  );
}

/* ─── Loaders ────────────────────────────────────────────────────────── */

function DotsLoader({ reduce }: { reduce: boolean }) {
  const dots = useMemo(() => [0, 1, 2], []);
  if (reduce) {
    return <span className="inline-flex h-1.5 w-1.5 rounded-full bg-white/65" />;
  }
  return (
    <span className="inline-flex items-center gap-1">
      {dots.map((i) => (
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

export default HeroInteractiveDemo;
