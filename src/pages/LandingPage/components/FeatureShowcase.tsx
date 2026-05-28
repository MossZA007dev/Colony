import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Bot,
  Users,
  Workflow,
  FolderKanban,
  ShieldCheck,
  Building2,
  ArrowRight,
  Sparkles,
  Search,
  BarChart3,
  FileText,
  Calendar,
  Mail,
  Database,
  Check,
  Clock3,
} from 'lucide-react';
import { EASE_OUT_EXPO, RevealOnScroll } from './motion';

type FeatureKey = 'ai-ant' | 'agent-teams' | 'automation' | 'projects' | 'approvals' | 'enterprise';

type FeatureItem = {
  key: FeatureKey;
  label: string;
  tagline: string;
  status?: string;
  icon: React.ComponentType<{ className?: string }>;
};

const FEATURES: FeatureItem[] = [
  { key: 'ai-ant', label: 'Start with a goal', tagline: 'Describe what you need. AI Ant recommends the best way to organize the work.', icon: Bot },
  { key: 'agent-teams', label: 'Build a specialist crew', tagline: 'Assemble AI agents for research, analysis, writing, and review around one task.', icon: Users },
  { key: 'projects', label: 'Keep context together', tagline: 'Store related chats, instructions, files, workflows, and final outputs in one workspace.', icon: FolderKanban },
  { key: 'automation', label: 'Repeat successful work', tagline: 'Design repeatable AI workflows for recurring tasks with review checkpoints.', status: 'In development', icon: Workflow },
  { key: 'approvals', label: 'Stay in control', tagline: 'Connect tools safely while keeping sensitive actions under user approval.', status: 'In development', icon: ShieldCheck },
  { key: 'enterprise', label: 'Build a long-term AI workspace', tagline: 'Organize agents and workflows around a business or long-term goal.', status: 'Concept preview', icon: Building2 },
];

export function FeatureShowcase() {
  const [active, setActive] = useState<FeatureKey>('ai-ant');
  const [interacted, setInteracted] = useState(false);
  const reduce = useReducedMotion();

  // Auto-rotate the first three features once, then stop on interaction.
  useEffect(() => {
    if (reduce || interacted) return;
    const sequence: FeatureKey[] = ['agent-teams', 'automation', 'ai-ant'];
    const timers: number[] = [];
    sequence.forEach((key, idx) => {
      timers.push(window.setTimeout(() => setActive(key), 4500 + idx * 4200));
    });
    return () => { timers.forEach(window.clearTimeout); };
  }, [reduce, interacted]);

  const select = (key: FeatureKey) => {
    setActive(key);
    setInteracted(true);
  };

  return (
    <section id="product" className="relative px-5 py-28 md:px-8 md:py-36">
      <div className="mx-auto max-w-[1240px]">
        <RevealOnScroll>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#7db7ff]">Product</p>
          <h2 className="max-w-3xl text-[34px] font-semibold leading-[1.08] tracking-tight text-white md:text-[52px]">
            Multiple ways to work with AI.
          </h2>
          <p className="mt-5 max-w-2xl text-[16px] leading-[1.65] text-white/60 md:text-[17px]">
            Start with a goal, assemble specialist agents, or explore repeatable workflows - all inside one controlled workspace.
          </p>
        </RevealOnScroll>

        <div className="mt-14 grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10">
          {/* Selector */}
          <div role="tablist" aria-label="Feature selector" className="flex flex-col gap-1.5">
            {FEATURES.map((f) => (
              <SelectorRow
                key={f.key}
                feature={f}
                active={active === f.key}
                onSelect={() => select(f.key)}
              />
            ))}
          </div>

          {/* Preview stage */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-[24px] border border-white/[0.10] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-5 shadow-[0_36px_110px_rgba(0,0,0,0.5)] md:p-7 lg:min-h-[500px]">
              <AmbientPreviewGlow activeKey={active} />
              <AnimatePresence mode="wait">
                <FeaturePreview key={active} active={active} />
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SelectorRow({
  feature,
  active,
  onSelect,
}: {
  feature: FeatureItem;
  active: boolean;
  onSelect: () => void;
}) {
  const Icon = feature.icon;
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onSelect}
      className={`group relative flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition-colors duration-300 ${
        active
          ? 'border-violet-300/22 bg-violet-500/[0.07]'
          : 'border-transparent hover:border-white/[0.08] hover:bg-white/[0.025]'
      }`}
    >
      {active && (
        <motion.span
          layoutId="feature-active-bar"
          className="absolute left-0 top-1/2 h-7 w-[2px] -translate-y-1/2 rounded-full bg-gradient-to-b from-[#7db7ff] to-[#7c5cfc]"
          transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
        />
      )}
      <span
        className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl border transition-colors duration-300 ${
          active
            ? 'border-violet-300/30 bg-violet-500/15 text-violet-100'
            : 'border-white/[0.06] bg-white/[0.025] text-white/55 group-hover:text-white/80'
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span
          className={`block text-[14px] font-semibold transition-colors duration-300 ${
            active ? 'text-white' : 'text-white/82 group-hover:text-white'
          }`}
        >
          {feature.label}
        </span>
        {feature.status ? (
          <span className="mt-1 inline-flex rounded-full border border-white/[0.09] bg-white/[0.035] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/48">
            {feature.status}
          </span>
        ) : null}
        <span className="mt-0.5 block text-[12px] leading-snug text-white/48">{feature.tagline}</span>
      </span>
    </button>
  );
}

function AmbientPreviewGlow({ activeKey }: { activeKey: FeatureKey }) {
  const tint: Record<FeatureKey, string> = {
    'ai-ant': 'rgba(125, 183, 255, 0.16)',
    'agent-teams': 'rgba(124, 92, 252, 0.18)',
    automation: 'rgba(0, 212, 170, 0.14)',
    projects: 'rgba(245, 200, 66, 0.12)',
    approvals: 'rgba(255, 159, 64, 0.14)',
    enterprise: 'rgba(125, 183, 255, 0.18)',
  };
  return (
    <motion.div
      key={activeKey}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.0, ease: EASE_OUT_EXPO }}
      className="pointer-events-none absolute inset-0"
      aria-hidden
    >
      <div
        className="absolute -top-1/3 left-1/2 h-[80%] w-[80%] -translate-x-1/2 rounded-full"
        style={{ background: `radial-gradient(circle, ${tint[activeKey]} 0%, transparent 65%)`, filter: 'blur(50px)' }}
      />
    </motion.div>
  );
}

/* ─── Preview switcher ───────────────────────────────────────────────── */

function FeaturePreview({ active }: { active: FeatureKey }) {
  const reduce = useReducedMotion();
  const wrap = {
    initial: reduce ? false : { opacity: 0, y: 14, filter: 'blur(8px)', scale: 0.985 },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 },
    exit: reduce ? undefined : { opacity: 0, y: -8, filter: 'blur(6px)', scale: 0.99 },
    transition: { duration: 0.65, ease: EASE_OUT_EXPO },
  } as const;

  switch (active) {
    case 'ai-ant':
      return (
        <motion.div {...wrap} className="relative">
          <PreviewHeader label="Start with a goal" subtitle="Testing now" />
          <AIAntPreview />
          <PreviewFooter cta="See workflow preview" />
        </motion.div>
      );
    case 'agent-teams':
      return (
        <motion.div {...wrap}>
          <PreviewHeader label="Build a specialist crew" subtitle="Testing now" />
          <AgentTeamsPreview />
          <PreviewFooter cta="See workflow preview" />
        </motion.div>
      );
    case 'automation':
      return (
        <motion.div {...wrap}>
          <PreviewHeader label="Repeat successful work" subtitle="In development" />
          <AutomationPreview />
          <PreviewFooter cta="See workflow preview" />
        </motion.div>
      );
    case 'projects':
      return (
        <motion.div {...wrap}>
          <PreviewHeader label="Keep context together" subtitle="Testing now" />
          <ProjectsPreview />
          <PreviewFooter cta="See workflow preview" />
        </motion.div>
      );
    case 'approvals':
      return (
        <motion.div {...wrap}>
          <PreviewHeader label="Stay in control" subtitle="In development" />
          <ApprovalsPreview />
          <PreviewFooter cta="See workflow preview" />
        </motion.div>
      );
    case 'enterprise':
      return (
        <motion.div {...wrap}>
          <PreviewHeader label="Long-term AI workspace" subtitle="Concept preview" />
          <EnterprisePreview />
          <PreviewFooter cta="See workflow preview" />
        </motion.div>
      );
  }
}

/* ─── Individual previews (real-UI-flavored) ─────────────────────────── */

function AIAntPreview() {
  return (
    <div className="mt-5 space-y-3">
      <div
        className="rounded-2xl border border-white/[0.10] bg-[#06070b]/85 p-4"
        style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Prompt</p>
        <p className="mt-1 text-[14px] text-white/55">Tell AI Ant what you want to accomplish.</p>
        <div className="mt-3 rounded-[12px] border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-[13px] text-white/40">
          Tell AI Ant what you want to accomplish…
          <span className="ml-0.5 inline-block h-[14px] w-[2px] -translate-y-[1px] animate-pulse bg-white/45 align-middle" />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <ModePill label="Auto" active />
          <ModePill label="Balanced" />
          <span className="ml-auto text-[10.5px] text-white/35">Send</span>
        </div>
      </div>

      <div>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/35">Suggested prompts</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {['Research competitors', 'Summarize latest report', 'Create a workflow'].map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.10] bg-white/[0.04] px-3 py-1.5 text-[12px] font-medium text-white/72"
            >
              <Sparkles className="h-3 w-3 text-violet-200/80" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function AgentTeamsPreview() {
  return (
    <div className="mt-5 space-y-3">
      <div
        className="rounded-2xl border border-white/[0.10] bg-[#06070b]/85 p-4"
        style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Goal</p>
        <p className="mt-1 text-[14px] leading-snug text-white/88">Prepare a product launch plan</p>
      </div>

      <div className="space-y-2">
        {/* AI Ant */}
        <div className="flex items-center gap-3 rounded-[14px] border border-violet-300/22 bg-violet-500/[0.08] p-3">
          <div className="grid h-8 w-8 place-items-center rounded-[10px] bg-violet-500/20 text-violet-100 ring-1 ring-violet-300/30">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-white">AI Ant</p>
            <p className="text-[10.5px] text-white/55">Coordinating 3 agents</p>
          </div>
        </div>

        {/* Children */}
        <div className="ml-4 space-y-2 border-l border-white/[0.08] pl-4">
          {[
            { name: 'Research Agent', icon: Search, status: 'complete' as const },
            { name: 'Strategy Agent', icon: BarChart3, status: 'working' as const },
            { name: 'Report Writer', icon: FileText, status: 'queued' as const },
          ].map((a) => (
            <div key={a.name} className="flex items-center justify-between gap-3 rounded-[12px] border border-white/[0.08] bg-white/[0.025] p-2.5">
              <div className="flex items-center gap-2">
                <div className="grid h-7 w-7 place-items-center rounded-[8px] bg-white/[0.06] text-white/80 ring-1 ring-white/[0.10]">
                  <a.icon className="h-3.5 w-3.5" />
                </div>
                <p className="text-[12.5px] font-semibold text-white/85">{a.name}</p>
              </div>
              <StatusPill kind={a.status} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-[14px] border border-[#7db7ff]/25 bg-[#7db7ff]/[0.06] px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-[9px] bg-white/[0.08] text-white/85 ring-1 ring-white/[0.10]">
            <FileText className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-[12.5px] font-semibold text-white">Launch Plan</p>
            <p className="text-[10.5px] text-white/45">Deliverable in progress</p>
          </div>
        </div>
        <span className="rounded-full border border-white/[0.14] bg-white/[0.06] px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/72">Building</span>
      </div>
    </div>
  );
}

function AutomationPreview() {
  const steps = [
    { label: 'Every Monday', icon: Calendar, tone: 'violet' },
    { label: 'Read sales report', icon: FileText },
    { label: 'Generate summary', icon: Sparkles },
    { label: 'Request approval', icon: ShieldCheck, tone: 'amber' },
    { label: 'Send deliverable', icon: ArrowRight, tone: 'emerald' },
  ];
  return (
    <div className="mt-5 space-y-3">
      <div className="rounded-2xl border border-white/[0.10] bg-[#06070b]/85 p-4" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Workflow</p>
        <div className="mt-3 space-y-1.5">
          {steps.map((s, idx) => {
            const tone =
              s.tone === 'violet' ? 'border-violet-300/22 bg-violet-500/[0.08] text-violet-100' :
              s.tone === 'amber' ? 'border-amber-300/22 bg-amber-400/[0.08] text-amber-100' :
              s.tone === 'emerald' ? 'border-emerald-300/22 bg-emerald-400/[0.08] text-emerald-100' :
              'border-white/[0.08] bg-white/[0.03] text-white/80';
            return (
              <div key={s.label} className="flex items-center gap-2">
                <span className="font-mono text-[9.5px] font-bold text-white/30">{String(idx + 1).padStart(2, '0')}</span>
                <div className={`flex flex-1 items-center gap-2 rounded-[10px] border px-3 py-2 text-[12px] font-medium ${tone}`}>
                  <s.icon className="h-3.5 w-3.5" />
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-[12px] border border-white/[0.08] bg-white/[0.025] px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Next run</p>
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-white/85">
            <Clock3 className="h-3 w-3 text-violet-200/80" />
            Monday, 09:00
          </p>
        </div>
        <div className="flex items-center justify-between rounded-[12px] border border-white/[0.08] bg-white/[0.025] px-3 py-2.5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Approval</p>
            <p className="mt-0.5 text-[12.5px] font-semibold text-white/85">Required</p>
          </div>
          <span className="relative inline-flex h-5 w-9 items-center rounded-full bg-emerald-400/35">
            <span className="absolute right-0.5 inline-block h-4 w-4 rounded-full bg-emerald-200 shadow-sm" />
          </span>
        </div>
      </div>
    </div>
  );
}

function ProjectsPreview() {
  return (
    <div className="mt-5 space-y-3">
      <div className="rounded-2xl border border-white/[0.10] bg-[#06070b]/85 p-4" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Project</p>
            <p className="mt-0.5 text-[15px] font-semibold text-white">Market Launch Project</p>
          </div>
          <span className="rounded-full border border-emerald-400/22 bg-emerald-400/[0.07] px-2.5 py-0.5 text-[10px] font-bold text-emerald-200">Active</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ['Files', '4'],
            ['Instructions', '2'],
            ['AI Team', '1'],
            ['Deliverables', '3'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[12px] border border-white/[0.08] bg-white/[0.025] px-3 py-2.5">
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-white/35">{label}</p>
              <p className="mt-1 text-[18px] font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Recent work</p>
        <ul className="mt-2 space-y-1.5">
          {[
            { label: 'Competitor research', icon: Search },
            { label: 'Positioning brief', icon: BarChart3 },
            { label: 'Launch plan', icon: FileText },
          ].map((item) => (
            <li key={item.label} className="flex items-center gap-2 text-[12.5px] text-white/72">
              <span className="grid h-6 w-6 place-items-center rounded-[8px] bg-white/[0.05] text-white/70 ring-1 ring-white/[0.08]">
                <item.icon className="h-3 w-3" />
              </span>
              {item.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ApprovalsPreview() {
  return (
    <div className="mt-5 space-y-3">
      <div>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/35">Connected tools</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {[
            { label: 'Google Drive', icon: Database, tone: 'emerald' },
            { label: 'Gmail', icon: Mail, tone: 'rose' },
            { label: 'Notion', icon: FileText, tone: 'neutral' },
          ].map((tool) => {
            const tone =
              tool.tone === 'emerald' ? 'bg-emerald-400/12 text-emerald-200 ring-emerald-300/25' :
              tool.tone === 'rose' ? 'bg-rose-400/12 text-rose-200 ring-rose-300/25' :
              'bg-white/[0.08] text-white/75 ring-white/[0.10]';
            return (
              <div key={tool.label} className="flex items-center gap-2 rounded-[12px] border border-white/[0.08] bg-white/[0.025] p-2.5">
                <span className={`grid h-8 w-8 place-items-center rounded-[10px] ring-1 ${tone}`}>
                  <tool.icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-semibold text-white">{tool.label}</p>
                  <p className="text-[10px] text-emerald-200/85">Connected</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="rounded-2xl border px-4 py-3.5"
        style={{
          borderColor: 'rgba(255,159,64,0.28)',
          background: 'linear-gradient(180deg, rgba(255,159,64,0.10) 0%, rgba(255,159,64,0.04) 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-amber-400/18 text-amber-100 ring-1 ring-amber-300/30">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-amber-200/85">Pending approval</p>
            <p className="mt-1 text-[13px] leading-snug text-white/88">
              AI Ant requests permission to export the final report to Google Drive.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/90 px-3.5 py-1.5 text-[12px] font-bold text-[#06140d] transition hover:bg-emerald-300">
                <Check className="h-3 w-3" />
                Approve
              </button>
              <button className="rounded-full border border-white/[0.12] bg-white/[0.04] px-3.5 py-1.5 text-[12px] font-semibold text-white/70 transition hover:bg-white/[0.08] hover:text-white">
                Decline
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EnterprisePreview() {
  return (
    <div className="mt-5 space-y-3">
      <div className="rounded-2xl border border-white/[0.10] bg-[#06070b]/85 p-4" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Organization</p>

        {/* Founder */}
        <div className="mt-3 flex justify-center">
          <OrgNode title="Founder Goal" subtitle="Run a small AI org" tone="white" />
        </div>
        <div className="flex justify-center"><OrgLine /></div>

        {/* Director */}
        <div className="flex justify-center">
          <OrgNode title="AI Director" subtitle="Coordinates teams" tone="purple" />
        </div>
        <div className="flex justify-center"><OrgLine /></div>

        {/* Teams */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { name: 'Research Team', tone: 'cyan' as const },
            { name: 'Marketing Team', tone: 'violet' as const },
            { name: 'Operations Team', tone: 'emerald' as const },
            { name: 'Finance Assistant', tone: 'amber' as const },
          ].map((t) => (
            <div
              key={t.name}
              className={`rounded-[12px] border px-2.5 py-2 text-center text-[11.5px] font-semibold ${
                t.tone === 'cyan' ? 'border-cyan-300/22 bg-cyan-400/[0.08] text-cyan-100' :
                t.tone === 'violet' ? 'border-violet-300/22 bg-violet-500/[0.10] text-violet-100' :
                t.tone === 'emerald' ? 'border-emerald-300/22 bg-emerald-400/[0.08] text-emerald-100' :
                'border-amber-300/22 bg-amber-400/[0.08] text-amber-100'
              }`}
            >
              {t.name}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <EnterpriseMetric label="Teams active" value="4" />
        <EnterpriseMetric label="Tasks in progress" value="8" />
        <EnterpriseMetric label="Approvals waiting" value="2" tone="amber" />
      </div>
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────── */

function PreviewHeader({ label, subtitle }: { label: string; subtitle: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">Preview</p>
        <p className="mt-1.5 text-[20px] font-semibold tracking-tight text-white md:text-[22px]">{label}</p>
      </div>
      <span className="rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white/65">
        {subtitle}
      </span>
    </div>
  );
}

function PreviewFooter({ cta }: { cta: string }) {
  return (
    <div className="mt-5 flex items-center justify-end">
      <button
        type="button"
        onClick={() => document.getElementById('hero-preview')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-violet-200/85 transition hover:text-violet-100"
      >
        {cta}
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function ModePill({ label, active }: { label: string; active?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold ${
        active ? 'border-violet-400/30 bg-violet-500/12 text-violet-100' : 'border-white/[0.10] bg-white/[0.03] text-white/55'
      }`}
    >
      {active && <Sparkles className="h-3 w-3" />}
      {label}
    </span>
  );
}

function StatusPill({ kind }: { kind: 'complete' | 'working' | 'queued' }) {
  const tone =
    kind === 'complete' ? 'border-emerald-400/25 bg-emerald-400/[0.12] text-emerald-200' :
    kind === 'working' ? 'border-cyan-300/30 bg-cyan-400/[0.12] text-cyan-100' :
    'border-white/[0.12] bg-white/[0.04] text-white/55';
  const label = kind === 'complete' ? 'Research complete' : kind === 'working' ? 'Strategy active' : 'Writing queued';
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.10em] ${tone}`}>
      {label}
    </span>
  );
}

function OrgNode({ title, subtitle, tone }: { title: string; subtitle: string; tone: 'white' | 'purple' }) {
  return (
    <div
      className={`rounded-[12px] border px-3.5 py-2 text-center ${
        tone === 'white' ? 'border-white/[0.14] bg-white/[0.07]' : 'border-violet-400/30 bg-violet-500/[0.10]'
      }`}
    >
      <p className="text-[12.5px] font-semibold text-white">{title}</p>
      <p className="mt-0.5 text-[10.5px] text-white/55">{subtitle}</p>
    </div>
  );
}

function OrgLine() {
  return <span className="my-1.5 h-3.5 w-px bg-white/15" />;
}

function EnterpriseMetric({ label, value, tone }: { label: string; value: string; tone?: 'amber' }) {
  const valueTone = tone === 'amber' ? 'text-amber-200' : 'text-white';
  return (
    <div className="rounded-[12px] border border-white/[0.08] bg-white/[0.025] px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">{label}</p>
      <p className={`mt-0.5 text-[18px] font-semibold ${valueTone}`}>{value}</p>
    </div>
  );
}
