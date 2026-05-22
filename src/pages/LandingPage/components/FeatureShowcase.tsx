import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Bot, Users, Workflow, FolderKanban, ShieldCheck, Building2, ArrowRight } from 'lucide-react';
import { EASE_OUT_EXPO, RevealOnScroll } from './motion';

type FeatureKey = 'ai-ant' | 'crew' | 'automation' | 'projects' | 'bridge' | 'enterprise';

type FeatureItem = {
  key: FeatureKey;
  label: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
};

const FEATURES: FeatureItem[] = [
  { key: 'ai-ant', label: 'AI Ant', tagline: 'Routes any goal to the right mode.', icon: Bot },
  { key: 'crew', label: 'Colony Crew', tagline: 'Specialist agents assembled per task.', icon: Users },
  { key: 'automation', label: 'Automation', tagline: 'Repeatable work with no node maze.', icon: Workflow },
  { key: 'projects', label: 'Projects', tagline: 'Chats, files, instructions, deliverables.', icon: FolderKanban },
  { key: 'bridge', label: 'Colony Bridge', tagline: 'Sensitive actions need your approval.', icon: ShieldCheck },
  { key: 'enterprise', label: 'One-man Enterprise', tagline: 'Run a visible AI organization.', icon: Building2 },
];

export function FeatureShowcase() {
  const [active, setActive] = useState<FeatureKey>('ai-ant');

  return (
    <section id="product" className="relative px-5 py-28 md:px-8 md:py-36">
      <div className="mx-auto max-w-[1200px]">
        <RevealOnScroll>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#7db7ff]">Product</p>
          <h2 className="max-w-3xl text-[34px] font-semibold leading-[1.08] tracking-tight text-white md:text-[52px]">
            One workspace.<br />Multiple ways to work with AI.
          </h2>
        </RevealOnScroll>

        <div className="mt-16 grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12">
          {/* Selector */}
          <div role="tablist" aria-label="Feature selector" className="flex flex-col gap-1">
            {FEATURES.map((f) => (
              <SelectorRow
                key={f.key}
                feature={f}
                active={active === f.key}
                onSelect={() => setActive(f.key)}
              />
            ))}
          </div>

          {/* Preview stage */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-5 shadow-[0_40px_120px_rgba(0,0,0,0.45)] md:p-8 lg:min-h-[480px]">
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
          ? 'border-white/[0.16] bg-white/[0.05]'
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
            ? 'border-white/[0.14] bg-white/[0.08] text-white'
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
        <span className="mt-0.5 block text-[12px] leading-snug text-white/48">{feature.tagline}</span>
      </span>
    </button>
  );
}

function AmbientPreviewGlow({ activeKey }: { activeKey: FeatureKey }) {
  const tint: Record<FeatureKey, string> = {
    'ai-ant': 'rgba(125, 183, 255, 0.16)',
    crew: 'rgba(124, 92, 252, 0.18)',
    automation: 'rgba(0, 212, 170, 0.14)',
    projects: 'rgba(245, 200, 66, 0.12)',
    bridge: 'rgba(255, 107, 107, 0.12)',
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

function FeaturePreview({ active }: { active: FeatureKey }) {
  const reduce = useReducedMotion();
  const props = {
    initial: reduce ? false : { opacity: 0, y: 14, filter: 'blur(8px)', scale: 0.985 },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 },
    exit: reduce ? undefined : { opacity: 0, y: -8, filter: 'blur(6px)', scale: 0.99 },
    transition: { duration: 0.7, ease: EASE_OUT_EXPO },
  } as const;

  switch (active) {
    case 'ai-ant':
      return (
        <motion.div {...props} className="relative">
          <PreviewHeader label="AI Ant" subtitle="Routing layer" />
          <div className="mt-4 rounded-2xl border border-white/[0.08] bg-[#06070b]/85 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Goal</p>
            <p className="mt-2 text-[14px] leading-7 text-white/85">Create a weekly sales report.</p>
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-[12px] text-white/72">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7db7ff] animate-pulse" />
              Selecting the best way to help…
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {['Chat', 'Crew', 'Automation'].map((mode, i) => (
                <div
                  key={mode}
                  className={`rounded-xl border px-3 py-2 text-center text-[11px] font-medium ${
                    i === 1 ? 'border-[#7db7ff]/40 bg-[#7db7ff]/[0.08] text-white' : 'border-white/[0.07] bg-white/[0.02] text-white/55'
                  }`}
                >
                  {mode}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      );
    case 'crew':
      return (
        <motion.div {...props}>
          <PreviewHeader label="Colony Crew" subtitle="Specialist agents in sequence" />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ['Research Agent', 'Market context'],
              ['Analyst Agent', 'Numbers and trends'],
              ['Writer Agent', 'Narrative draft'],
              ['Reviewer Agent', 'Quality check'],
            ].map(([title, sub], idx) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: idx * 0.12, ease: EASE_OUT_EXPO }}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4"
              >
                <p className="text-[13px] font-semibold text-white">{title}</p>
                <p className="mt-1 text-[11.5px] text-white/55">{sub}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      );
    case 'automation':
      return (
        <motion.div {...props}>
          <PreviewHeader label="Automation" subtitle="Workflow you can read" />
          <div className="mt-5 space-y-2.5">
            {['Trigger', 'Read Source', 'Analyze', 'Approval', 'Deliverable'].map((step, idx, arr) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.55, delay: idx * 0.1, ease: EASE_OUT_EXPO }}
                className="flex items-center gap-3"
              >
                <span className="font-mono text-[10px] font-semibold text-white/35">{String(idx + 1).padStart(2, '0')}</span>
                <div className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-2.5 text-[13px] font-medium text-white/85">
                  {step}
                </div>
                {idx < arr.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-white/35" />}
              </motion.div>
            ))}
          </div>
        </motion.div>
      );
    case 'projects':
      return (
        <motion.div {...props}>
          <PreviewHeader label="Projects" subtitle="Work that keeps its context" />
          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              ['Chats', '12'],
              ['Instructions', '4'],
              ['Files', '23'],
              ['Deliverables', '7'],
            ].map(([title, count], idx) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: idx * 0.08, ease: EASE_OUT_EXPO }}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4"
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">{title}</p>
                <p className="mt-2 text-[26px] font-semibold text-white">{count}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      );
    case 'bridge':
      return (
        <motion.div {...props}>
          <PreviewHeader label="Colony Bridge" subtitle="Approval-first by default" />
          <div className="mt-5 rounded-2xl border border-white/[0.08] bg-[#06070b]/80 p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl bg-[#ffb85a]/15 text-[#ffb85a]">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">Approval request</p>
                <p className="mt-1 text-[14px] leading-6 text-white/88">
                  Allow AI Ant to access selected report file?
                </p>
                <p className="mt-1 text-[12px] text-white/45">Q3-sales-summary.xlsx · read-only</p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button className="flex-1 rounded-full bg-white px-4 py-2.5 text-[13px] font-semibold text-[#050508] transition hover:bg-[#eef2ff]">
                Approve once
              </button>
              <button className="flex-1 rounded-full border border-white/[0.18] bg-white/[0.05] px-4 py-2.5 text-[13px] font-medium text-white/85 transition hover:bg-white/[0.1]">
                Reject
              </button>
            </div>
          </div>
        </motion.div>
      );
    case 'enterprise':
      return (
        <motion.div {...props}>
          <PreviewHeader label="One-man Enterprise" subtitle="A visible AI organization" />
          <div className="mt-5 flex flex-col items-center gap-3">
            <OrgNode title="AI Ant Director" subtitle="Routes goals to teams" tone="white" />
            <OrgConnector />
            <OrgNode title="Project Manager" subtitle="Plans and approves" tone="purple" />
            <OrgConnector />
            <div className="flex w-full flex-wrap items-center justify-center gap-2">
              {['Research', 'Analyst', 'Writer'].map((name) => (
                <span
                  key={name}
                  className="rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-[12px] font-medium text-white/80"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      );
  }
}

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

function OrgNode({ title, subtitle, tone }: { title: string; subtitle: string; tone: 'white' | 'purple' }) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-center ${
        tone === 'white' ? 'border-white/[0.14] bg-white/[0.07]' : 'border-[#7c5cfc]/30 bg-[#7c5cfc]/[0.08]'
      }`}
    >
      <p className="text-[13px] font-semibold text-white">{title}</p>
      <p className="mt-0.5 text-[11px] text-white/55">{subtitle}</p>
    </div>
  );
}

function OrgConnector() {
  return <span className="h-5 w-px bg-white/12" />;
}
