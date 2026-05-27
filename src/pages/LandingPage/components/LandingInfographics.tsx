import React, { useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Cloud,
  Database,
  FileText,
  Globe2,
  LockKeyhole,
  MousePointer2,
  Mail,
  MessageSquare,
  Minus,
  Network,
  Plus,
  Shield,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';

import { EASE_OUT_EXPO, RevealOnScroll } from './motion';
import './SupportedModelsMarquee.css';

type Accent = 'violet' | 'blue' | 'teal' | 'amber';

const dot = '-';

const accentClasses: Record<Accent, { text: string; border: string; bg: string; glow: string; line: string }> = {
  violet: { text: 'text-violet-200', border: 'border-violet-300/25', bg: 'bg-violet-500/[0.08]', glow: 'shadow-[0_0_36px_rgba(124,92,252,0.16)]', line: '#8b5cf6' },
  blue: { text: 'text-[#bcd9ff]', border: 'border-[#7db7ff]/28', bg: 'bg-[#7db7ff]/[0.08]', glow: 'shadow-[0_0_36px_rgba(125,183,255,0.16)]', line: '#7db7ff' },
  teal: { text: 'text-emerald-200', border: 'border-emerald-300/25', bg: 'bg-emerald-400/[0.08]', glow: 'shadow-[0_0_36px_rgba(0,212,170,0.14)]', line: '#00d4aa' },
  amber: { text: 'text-amber-200', border: 'border-amber-300/25', bg: 'bg-amber-400/[0.08]', glow: 'shadow-[0_0_36px_rgba(245,200,66,0.13)]', line: '#f5c842' },
};

function SectionShell({ id, children, compact = false }: { id?: string; children: React.ReactNode; compact?: boolean }) {
  return (
    <section id={id} className={`px-5 ${compact ? 'py-14' : 'py-20 md:py-24'} md:px-8`}>
      <div className="mx-auto max-w-[1200px]">{children}</div>
    </section>
  );
}

function SectionHeader({ label, title, copy, center = false }: { label: string; title: string; copy?: string; center?: boolean }) {
  return (
    <RevealOnScroll className={center ? 'mx-auto max-w-4xl text-center' : 'max-w-4xl'}>
      <p className={`mb-3 text-xs font-bold uppercase tracking-[0.22em] text-[#7db7ff] ${center ? 'text-center' : ''}`}>
        <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#00d4aa] align-middle shadow-[0_0_16px_rgba(0,212,170,0.55)]" />
        {label}
      </p>
      <h2 className="text-[32px] font-semibold leading-[1.08] tracking-tight text-white md:text-[44px]">{title}</h2>
      {copy && <p className={`mt-4 text-[15px] leading-relaxed text-white/62 md:text-[16px] ${center ? 'mx-auto max-w-3xl' : 'max-w-3xl'}`}>{copy}</p>}
    </RevealOnScroll>
  );
}

function GlassPanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-white/[0.025] ${className}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(70% 80% at 50% 0%, rgba(125,183,255,0.075), transparent 62%), linear-gradient(180deg, rgba(255,255,255,0.035), transparent)' }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

function FeatureIconBadge({ icon }: { icon: React.ReactNode }) {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.1] bg-white/[0.05] text-white/86 shadow-[0_10px_30px_rgba(0,0,0,0.28)]">
      {icon}
    </div>
  );
}

type ModelProvider = {
  id: string;
  name: string;
  logo?: string;
  fallback: string;
};

const modelProviders: ModelProvider[] = [
  { id: 'openai', name: 'OpenAI', fallback: 'AI' },
  { id: 'claude', name: 'Claude', logo: '/assets/Ai logo/Claude.svg', fallback: 'CL' },
  { id: 'gemini', name: 'Gemini', logo: '/assets/Ai logo/Gemini.svg', fallback: 'GM' },
  { id: 'deepseek', name: 'DeepSeek', logo: '/assets/Ai logo/DeepSeek.svg', fallback: 'DS' },
  { id: 'perplexity', name: 'Perplexity', logo: '/assets/Ai logo/Perplexity-1.svg', fallback: 'PX' },
];

const marqueeProviders = [...modelProviders, ...modelProviders];

export function SupportedModelsSection() {
  const capabilities = ['Research', 'Reasoning', 'Writing', 'Image', 'Video'];

  return (
    <SectionShell id="supported-models" compact>
      <div className="relative overflow-hidden py-3 md:py-6">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-48 w-[72%] -translate-x-1/2 rounded-full"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(125,183,255,0.12), transparent 68%)',
            filter: 'blur(46px)',
          }}
        />
        <div className="relative">
        <SectionHeader
          center
          label="Supported Models"
          title="Works with the models you already use."
          copy="Colony Bridge helps route each task to the right AI model for reasoning, research, writing, multimodal work, and media generation - all inside one coordinated workspace."
        />

        <RevealOnScroll delay={0.08} y={18}>
          <div
            className="supported-models-marquee mx-auto mt-10 max-w-[1180px]"
            aria-label="Supported AI model providers"
          >
            <div className="supported-models-track">
              {marqueeProviders.map((provider, index) => (
                <ModelProviderItem
                  key={`${provider.id}-${index}`}
                  provider={provider}
                  ariaHidden={index >= modelProviders.length}
                />
              ))}
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={0.14} y={14}>
          <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-2">
            {capabilities.map((capability) => (
              <span
                key={capability}
                className="rounded-full border border-white/[0.09] bg-white/[0.035] px-3 py-1.5 text-[11px] font-semibold text-white/58"
              >
                {capability}
              </span>
            ))}
          </div>
          <p className="mx-auto mt-5 max-w-2xl text-center text-[12.5px] leading-relaxed text-white/42">
            Designed to support leading model providers as Colony Bridge expands routing, evaluation, and capability-based model selection.
          </p>
        </RevealOnScroll>
        </div>
      </div>
    </SectionShell>
  );
}

function ModelProviderItem({ provider, ariaHidden }: { provider: ModelProvider; ariaHidden?: boolean }) {
  return (
    <div
      aria-hidden={ariaHidden}
      className="inline-flex h-[52px] flex-none items-center gap-3 whitespace-nowrap rounded-full border border-white/[0.09] bg-white/[0.025] px-5 text-white/86"
    >
      <span
        aria-hidden="true"
        className="grid h-7 w-7 flex-none place-items-center overflow-hidden text-white/72"
      >
        {provider.logo ? (
          <img
            src={provider.logo}
            alt=""
            draggable={false}
            className="block h-7 w-7 max-h-[28px] max-w-[28px] object-contain opacity-80 [filter:brightness(0)_invert(1)]"
          />
        ) : (
          <span className="text-[10px] font-bold tracking-wide text-white/72">{provider.fallback}</span>
        )}
      </span>
      <span className="text-[14px] font-medium leading-none text-white/82">{provider.name}</span>
    </div>
  );
}

function DiagramNode({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`grid place-items-center rounded-full border border-white/[0.12] bg-white/[0.06] text-white shadow-[0_0_22px_rgba(125,183,255,0.10)] ${className}`}>{children}</div>;
}

function DiagramChip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-[8px] border border-white/[0.10] bg-white/[0.045] px-2 py-1 text-[10px] font-semibold text-white/72">{children}</span>;
}

export function HowColonyWorksInfographic() {
  const steps = [
    { n: '01', icon: MessageSquare, title: 'User describes a goal', copy: 'You share the outcome you want and any key context.', accent: 'blue' as Accent },
    { n: '02', icon: Sparkles, title: 'AI Ant chooses the best mode', copy: 'AI Ant analyzes the goal and selects the right approach.', accent: 'violet' as Accent },
    { n: '03', icon: Users, title: 'Specialists or workflows do the work', copy: 'The right agents, teams, or automations get to work.', accent: 'blue' as Accent },
    { n: '04', icon: CheckCircle2, title: 'Deliverable + approval', copy: 'You review the result, request changes, and approve.', accent: 'blue' as Accent },
  ];

  return (
    <SectionShell id="how-it-works">
      <SectionHeader label="How Colony Works" title="Describe the goal. Watch the work take shape." copy="Start with a simple prompt. AI Ant chooses the right structure, coordinates specialist agents or workflows, and prepares a result for your review." />
      <div className="relative mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="pointer-events-none absolute left-[12%] right-[12%] top-[82px] hidden h-px bg-gradient-to-r from-transparent via-[#7db7ff]/60 to-transparent lg:block" />
        {steps.map((step, index) => {
          const Icon = step.icon;
          const accent = accentClasses[step.accent];
          return (
            <RevealOnScroll key={step.n} delay={index * 0.06} y={18}>
              <div className="group relative h-full rounded-[20px] border border-white/[0.08] bg-[#070a12]/72 p-5 transition duration-300 hover:-translate-y-1 hover:border-[#7db7ff]/28 hover:bg-white/[0.04] motion-reduce:transform-none">
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-[12px] font-bold text-[#bcd9ff]">{step.n}</span>
                  <div className={`grid h-12 w-12 place-items-center rounded-full border ${accent.border} ${accent.bg} ${accent.text} ${index === 3 ? accent.glow : ''}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                {index < steps.length - 1 && <span className="pointer-events-none absolute -right-2 top-[77px] hidden h-3 w-3 rounded-full bg-[#9ecbff] shadow-[0_0_18px_rgba(125,183,255,0.75)] lg:block" />}
                <h3 className="text-[15px] font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-[13px] leading-relaxed text-white/58">{step.copy}</p>
              </div>
            </RevealOnScroll>
          );
        })}
      </div>
    </SectionShell>
  );
}

export function FeatureSystemSection() {
  const features = [
    { n: '01', label: 'Coordinator', title: 'AI Ant', copy: 'Routes each goal and chooses the right mode.', status: 'Best mode selected', accent: 'blue' as Accent, diagram: <AIAntDiagram /> },
    { n: '02', label: 'Team', title: 'Colony Crew', copy: 'Builds a specialist AI team for complex work.', status: 'Specialists aligned', accent: 'violet' as Accent, diagram: <CrewDiagram /> },
    { n: '03', label: 'Organization', title: 'One-man Enterprise', copy: 'Creates a visible AI organization with roles and departments.', status: 'Org chart created', accent: 'blue' as Accent, diagram: <EnterpriseDiagram /> },
    { n: '04', label: 'Automation', title: 'Automation', copy: 'Turns repeatable work into controlled workflows.', status: 'Workflow active', accent: 'teal' as Accent, diagram: <AutomationDiagram /> },
    { n: '05', label: 'Action Layer', title: 'Colony Bridge', copy: 'Turns AI decisions into approved actions across your tools, browser, files, and apps.', status: 'Connected with approval', accent: 'amber' as Accent, diagram: <ColonyBridgeActionDiagram /> },
  ];

  return (
    <SectionShell id="features">
      <GlassPanel className="p-4 md:p-5">
        <div className="p-2 md:p-3">
          <SectionHeader label="Feature System" title="One coordinator. Different ways to get work done." copy="Colony Bridge gives you five connected ways to turn a goal into real work: coordinate with AI Ant, assemble specialist crews, build an AI organization, automate repeatable workflows, or take approved action across your tools." />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {features.map((feature, index) => <FeatureModeCard key={feature.title} feature={feature} delay={index * 0.05} />)}
        </div>
        <p className="mt-5 text-center text-[12.5px] text-white/46">
          AI Ant coordinates the work. Colony Bridge connects it safely to real-world action.
        </p>
      </GlassPanel>
    </SectionShell>
  );
}

function FeatureModeCard({ feature, delay }: { feature: { n: string; label: string; title: string; copy: string; status: string; accent: Accent; diagram: React.ReactNode }; delay: number }) {
  const accent = accentClasses[feature.accent];
  return (
    <RevealOnScroll delay={delay} y={18}>
      <div className="group flex h-full min-h-[360px] flex-col rounded-[18px] border border-white/[0.08] bg-[#060912]/78 p-4 transition duration-300 hover:-translate-y-1 hover:border-white/[0.16] hover:bg-white/[0.04] motion-reduce:transform-none">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="text-[12px] font-bold text-[#bcd9ff]">{feature.n}</span>
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${accent.border} ${accent.bg} ${accent.text}`}>{feature.label}</span>
        </div>
        <h3 className="text-[17px] font-semibold text-white">{feature.title}</h3>
        <p className="mt-2 min-h-[58px] text-[12.5px] leading-relaxed text-white/58">{feature.copy}</p>
        <div className="my-5 flex min-h-[156px] flex-1 items-center justify-center">{feature.diagram}</div>
        <div className={`mt-auto inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${accent.border} ${accent.bg} ${accent.text}`}>
          <CheckCircle2 className="h-3 w-3" /> {feature.status}
        </div>
      </div>
    </RevealOnScroll>
  );
}

function AIAntDiagram() {
  return (
    <div className="relative h-[138px] w-full">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 180 138" fill="none" aria-hidden>
        <path d="M90 50 C70 70 45 72 35 95" stroke="#7db7ff" strokeOpacity=".55" strokeDasharray="3 4" />
        <path d="M90 50 C90 75 90 82 90 101" stroke="#7db7ff" strokeOpacity=".55" strokeDasharray="3 4" />
        <path d="M90 50 C110 70 135 72 145 95" stroke="#7db7ff" strokeOpacity=".55" strokeDasharray="3 4" />
      </svg>
      <DiagramNode className="absolute left-1/2 top-2 h-12 w-12 -translate-x-1/2 bg-[#7db7ff]/[0.10]"><Bot className="h-5 w-5" /></DiagramNode>
      {['Crew', 'Automation', 'Enterprise'].map((item, i) => <div key={item} className={`absolute bottom-2 ${i === 0 ? 'left-2' : i === 1 ? 'left-1/2 -translate-x-1/2' : 'right-2'}`}><DiagramChip>{item}</DiagramChip></div>)}
    </div>
  );
}

function CrewDiagram() {
  const nodes = [['Research', 'left-2 top-3'], ['Strategy', 'right-3 top-6'], ['Writer', 'left-5 bottom-7'], ['Review', 'right-6 bottom-5']];
  return (
    <div className="relative h-[138px] w-full">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 180 138" fill="none" aria-hidden>
        <path d="M90 70 C60 48, 45 35, 35 30" stroke="#8b5cf6" strokeOpacity=".45" strokeDasharray="3 4" />
        <path d="M90 70 C120 48, 135 35, 145 30" stroke="#8b5cf6" strokeOpacity=".45" strokeDasharray="3 4" />
        <path d="M90 70 C60 92, 45 104, 35 112" stroke="#8b5cf6" strokeOpacity=".45" strokeDasharray="3 4" />
        <path d="M90 70 C120 92, 135 104, 145 112" stroke="#8b5cf6" strokeOpacity=".45" strokeDasharray="3 4" />
      </svg>
      <DiagramNode className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 bg-violet-500/[0.14]"><Users className="h-5 w-5" /></DiagramNode>
      {nodes.map(([label, pos]) => <div key={label} className={`absolute ${pos}`}><DiagramChip>{label}</DiagramChip></div>)}
    </div>
  );
}

function EnterpriseDiagram() {
  return (
    <div className="relative h-[156px] w-full text-center">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 180 156" fill="none" aria-hidden>
        <path d="M90 28 V55 M90 75 V91 M40 116 V102 H140 V116" stroke="#7db7ff" strokeOpacity=".5" />
      </svg>
      <div className="absolute left-1/2 top-0 -translate-x-1/2"><DiagramChip>Founder</DiagramChip></div>
      <DiagramNode className="absolute left-1/2 top-[38px] h-10 w-10 -translate-x-1/2 bg-[#7db7ff]/[0.12]"><Building2 className="h-4 w-4" /></DiagramNode>
      <div className="absolute left-1/2 top-[83px] -translate-x-1/2"><DiagramChip>Director</DiagramChip></div>
      <div className="absolute inset-x-0 bottom-0 grid grid-cols-2 gap-1.5 px-1">
        {['Research', 'Strategy', 'Ops', 'Creative'].map((item) => <DiagramChip key={item}>{item}</DiagramChip>)}
      </div>
    </div>
  );
}

function AutomationDiagram() {
  const items: [React.ElementType, string][] = [[Zap, 'Trigger'], [Network, 'Steps'], [CheckCircle2, 'Output']];
  return (
    <div className="flex w-full items-center justify-center gap-2">
      {items.map(([Icon, label], index) => (
        <React.Fragment key={label}>
          <div className="text-center">
            <DiagramNode className="mx-auto h-11 w-11 bg-emerald-400/[0.10] text-emerald-100"><Icon className="h-4 w-4" /></DiagramNode>
            <p className="mt-2 text-[10px] font-semibold text-white/58">{label}</p>
          </div>
          {index < 2 && <ArrowRight className="h-3.5 w-3.5 text-emerald-200/45" />}
        </React.Fragment>
      ))}
    </div>
  );
}

function ColonyBridgeActionDiagram() {
  const tools: [React.ElementType, string, string][] = [
    [Globe2, 'Browser', 'left-1 top-1'],
    [FileText, 'Files', 'left-[52px] top-1'],
    [Mail, 'Mail', 'right-[52px] top-1'],
    [Cloud, 'Drive', 'right-1 top-1'],
  ];
  return (
    <div className="relative h-[156px] w-full">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 180 156" fill="none" aria-hidden>
        <path d="M22 28 C40 54 62 60 80 69" stroke="#f5c842" strokeOpacity=".48" strokeDasharray="3 4" />
        <path d="M68 28 C74 46 78 57 84 69" stroke="#f5c842" strokeOpacity=".48" strokeDasharray="3 4" />
        <path d="M112 28 C106 46 102 57 96 69" stroke="#f5c842" strokeOpacity=".48" strokeDasharray="3 4" />
        <path d="M158 28 C140 54 118 60 100 69" stroke="#f5c842" strokeOpacity=".48" strokeDasharray="3 4" />
        <path d="M90 91 V111" stroke="#f5c842" strokeOpacity=".55" strokeDasharray="3 4" />
        <path d="M90 130 V139" stroke="#f5c842" strokeOpacity=".55" strokeDasharray="3 4" />
      </svg>
      {tools.map(([Icon, label, pos]) => (
        <div key={label} className={`absolute ${pos} text-center`}>
          <DiagramNode className="mx-auto h-8 w-8 bg-amber-400/[0.08] text-amber-100"><Icon className="h-3.5 w-3.5" /></DiagramNode>
          <p className="mt-1 text-[9px] font-semibold text-white/46">{label}</p>
        </div>
      ))}
      <div className="absolute left-1/2 top-[55px] -translate-x-1/2">
        <div className="rounded-[12px] border border-amber-300/25 bg-amber-400/[0.10] px-3 py-2 text-center shadow-[0_0_28px_rgba(245,200,66,0.13)]">
          <div className="mx-auto mb-1 grid h-7 w-7 place-items-center rounded-full bg-white/[0.07] text-amber-100">
            <MousePointer2 className="h-3.5 w-3.5" />
          </div>
          <p className="whitespace-nowrap text-[10px] font-bold text-amber-100">Colony Bridge</p>
        </div>
      </div>
      <div className="absolute bottom-[19px] left-1/2 -translate-x-1/2">
        <DiagramChip>Approval</DiagramChip>
      </div>
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full border border-amber-300/25 bg-amber-400/[0.08] px-2.5 py-0.5 text-[9px] font-bold text-amber-100">
        Action ready
      </span>
    </div>
  );
}

const SYSTEM_MAP_ROWS = [
  { title: 'Colony Crew', icon: Users, accent: 'violet' as Accent, copy: 'Assembles specialist agents to solve complex work.', flow: ['Assemble team', 'Collaborate', 'Review', 'Deliverable'], output: 'Team output ready for review' },
  { title: 'One-man Enterprise', icon: Building2, accent: 'blue' as Accent, copy: 'Creates an AI organization with roles and departments.', flow: ['Define org', 'Assign roles', 'Execute', 'Deliverable'], output: 'Org results with full visibility' },
  { title: 'Automation', icon: Zap, accent: 'teal' as Accent, copy: 'Runs repeatable work through smart workflows.', flow: ['Trigger', 'Run workflow', 'Output', 'Deliverable'], output: 'Automated output delivered' },
  { title: 'Colony Bridge', icon: MousePointer2, accent: 'amber' as Accent, copy: 'Connects AI Ant to approved tools and environments so plans can become real actions.', flow: ['Connect Context', 'Request Approval', 'Take Action', 'Deliverable'], output: 'Work completed with user control' },
];

export function SystemMapSection() {
  const rows = SYSTEM_MAP_ROWS;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const aiAntRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [connectors, setConnectors] = useState<Array<{ d: string; color: string } | null>>(() => rows.map(() => null));
  const [wrapperSize, setWrapperSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useLayoutEffect(() => {
    let rafId = 0;
    let stopAt = 0;
    let prevSizeKey = '';
    let prevConnectorKey = '';

    const compute = () => {
      const wrapper = wrapperRef.current;
      const aiAnt = aiAntRef.current;
      if (!wrapper || !aiAnt) return;
      const wrapRect = wrapper.getBoundingClientRect();
      const sizeKey = `${Math.round(wrapRect.width)}x${Math.round(wrapRect.height)}`;
      if (sizeKey !== prevSizeKey) {
        prevSizeKey = sizeKey;
        setWrapperSize({ w: wrapRect.width, h: wrapRect.height });
      }

      const antRect = aiAnt.getBoundingClientRect();
      const sx = antRect.right - wrapRect.left;
      const sy = antRect.top + antRect.height / 2 - wrapRect.top;

      const next = SYSTEM_MAP_ROWS.map((row, idx) => {
        const rowEl = rowRefs.current[idx];
        if (!rowEl) return null;
        const rowRect = rowEl.getBoundingClientRect();
        const ex = rowRect.left - wrapRect.left;
        const ey = rowRect.top + rowRect.height / 2 - wrapRect.top;
        const c1x = sx + (ex - sx) * 0.55;
        const c2x = ex - (ex - sx) * 0.45;
        return {
          d: `M ${sx.toFixed(1)} ${sy.toFixed(1)} C ${c1x.toFixed(1)} ${sy.toFixed(1)}, ${c2x.toFixed(1)} ${ey.toFixed(1)}, ${ex.toFixed(1)} ${ey.toFixed(1)}`,
          color: accentClasses[row.accent].line,
        };
      });
      const connectorKey = next.map((c) => c?.d ?? '').join('|');
      if (connectorKey !== prevConnectorKey) {
        prevConnectorKey = connectorKey;
        setConnectors(next);
      }
    };

    const tick = () => {
      compute();
      if (performance.now() < stopAt) {
        rafId = requestAnimationFrame(tick);
      }
    };

    compute();
    stopAt = performance.now() + 1400;
    rafId = requestAnimationFrame(tick);

    const ro = new ResizeObserver(compute);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    if (aiAntRef.current) ro.observe(aiAntRef.current);
    rowRefs.current.forEach((el) => el && ro.observe(el));
    window.addEventListener('resize', compute);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('resize', compute);
    };
  }, []);

  return (
    <SectionShell id="product">
      <div ref={wrapperRef} className="relative grid gap-8 lg:grid-cols-[0.9fr_1.8fr] lg:items-center">
        {wrapperSize.w > 0 && (
          <svg
            className="pointer-events-none absolute inset-0 z-0 hidden lg:block"
            width={wrapperSize.w}
            height={wrapperSize.h}
            viewBox={`0 0 ${wrapperSize.w} ${wrapperSize.h}`}
            fill="none"
            aria-hidden
          >
            {connectors.map((c, i) =>
              c ? (
                <path
                  key={i}
                  d={c.d}
                  stroke={c.color}
                  strokeOpacity="0.55"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              ) : null,
            )}
          </svg>
        )}
        <div className="relative z-10">
          <SectionHeader label="Visual System Map" title="From one prompt to an AI workforce." copy="AI Ant turns a goal into the right combination of specialists, workflows, tools, and review-ready deliverables." />
          <div className="relative mt-10 flex justify-center lg:justify-start">
            <div ref={aiAntRef} className="relative grid h-52 w-52 place-items-center rounded-full border border-[#7db7ff]/28 bg-[#7db7ff]/[0.055] shadow-[0_0_70px_rgba(125,183,255,0.16)]">
              <div className="absolute inset-5 rounded-full border border-[#7db7ff]/18" />
              <div className="text-center">
                <DiagramNode className="mx-auto h-16 w-16 bg-white/[0.08]"><Bot className="h-7 w-7" /></DiagramNode>
                <p className="mt-4 text-[16px] font-semibold text-white">AI Ant</p>
                <p className="mt-1 text-[12px] text-white/52">You describe the goal</p>
                <span className="mt-3 inline-flex rounded-full border border-[#7db7ff]/25 bg-[#7db7ff]/[0.09] px-2.5 py-1 text-[10px] font-bold text-[#bcd9ff]">Goal Received</span>
              </div>
            </div>
          </div>
        </div>
        <div className="relative z-10 space-y-3">
          {rows.map((row, index) => (
            <SystemMapRow
              key={row.title}
              row={row}
              delay={index * 0.05}
              rowRef={(el) => {
                rowRefs.current[index] = el;
              }}
            />
          ))}
          <div className="mx-auto mt-5 w-fit rounded-full border border-white/[0.08] bg-white/[0.035] px-4 py-2 text-center text-[12px] text-white/52">All modes are connected, share context, and keep you in control.</div>
        </div>
      </div>
    </SectionShell>
  );
}

function SystemMapRow({ row, delay, rowRef }: { row: { title: string; icon: React.ElementType; accent: Accent; copy: string; flow: string[]; output: string }; delay: number; rowRef?: (el: HTMLDivElement | null) => void }) {
  const accent = accentClasses[row.accent];
  const Icon = row.icon;
  return (
    <RevealOnScroll delay={delay} y={16}>
      <div ref={rowRef} className={`grid gap-4 rounded-[18px] border ${accent.border} bg-[#060912]/72 p-4 sm:grid-cols-[1fr_1.5fr_0.95fr] sm:items-center`}>
        <div className="flex items-center gap-3">
          <DiagramNode className={`h-12 w-12 ${accent.bg} ${accent.text}`}><Icon className="h-5 w-5" /></DiagramNode>
          <div><h3 className="text-[15px] font-semibold text-white">{row.title}</h3><p className="mt-1 text-[12px] leading-snug text-white/52">{row.copy}</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {row.flow.map((item, index) => <React.Fragment key={item}><span className="rounded-full border border-white/[0.09] bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-white/62">{item}</span>{index < row.flow.length - 1 && <span className="hidden h-px w-5 bg-white/20 sm:inline-block" />}</React.Fragment>)}
        </div>
        <div className={`rounded-[14px] border ${accent.border} ${accent.bg} p-3`}><p className="text-[12px] font-semibold text-white">Deliverable</p><p className="mt-1 text-[11px] leading-snug text-white/56">{row.output}</p></div>
      </div>
    </RevealOnScroll>
  );
}

export function ApprovalFirstControlSection() {
  return (
    <SectionShell>
      <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <SectionHeader label="Approval-First Control" title="AI prepares the work. You stay in control." copy="Colony Bridge is designed around reviewable AI workflows. AI Ant can prepare outputs and recommend next steps, while important actions remain visible before anything is sent, changed, or shared." />
        <RevealOnScroll y={20}>
          <GlassPanel className="p-5">
            <div className="rounded-[18px] border border-emerald-300/18 bg-[#07120f]/72 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3"><DiagramNode className="h-11 w-11 bg-emerald-400/[0.10] text-emerald-100"><ClipboardCheck className="h-5 w-5" /></DiagramNode><div><p className="text-[15px] font-semibold text-white">AI Ant prepared a result</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200/70">Waiting for approval</p></div></div>
                <LockKeyhole className="h-5 w-5 text-emerald-200/70" />
              </div>
              <div className="mt-5 rounded-[16px] border border-white/[0.08] bg-white/[0.04] p-4"><p className="text-[16px] font-semibold text-white">Launch plan ready for review</p><p className="mt-2 text-[13px] leading-relaxed text-white/58">Review the deliverable before it is shared outside the workspace.</p></div>
              <div className="mt-5 flex flex-wrap justify-end gap-2"><button className="rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-[13px] font-semibold text-white/72 transition hover:bg-white/[0.08] hover:text-white">Review</button><button className="lp-btn-primary rounded-full px-4 py-2 text-[13px] font-semibold">Approve</button></div>
            </div>
          </GlassPanel>
        </RevealOnScroll>
      </div>
    </SectionShell>
  );
}

export function NewComparisonSection() {
  const rows = [
    ['Starting point', 'Nodes, triggers, APIs, or technical setup', 'A goal described in plain language'],
    ['User experience', 'Designed for users familiar with automation setup', 'Designed for founders and small teams exploring AI-assisted work'],
    ['Workflow visibility', 'Complex flows may be difficult to interpret', 'Visible crews, progress, and deliverables'],
    ['Safety', 'Actions depend on configured permissions', 'Approval-first approach keeps users in control'],
    ['Output', 'Workflow execution and logs', 'Review-ready work connected to project context'],
  ];
  return (
    <SectionShell>
      <SectionHeader center label="Comparison" title="A different starting point from traditional workflow builders." copy="Traditional workflow tools often begin with nodes, triggers, and integrations. Colony Bridge begins with your goal and helps organize the work around it." />
      <RevealOnScroll className="mt-10 overflow-x-auto rounded-[24px] border border-white/[0.08] bg-white/[0.02]">
        <div className="grid min-w-[760px] grid-cols-[1fr_1.25fr_1.25fr] border-b border-white/[0.07]">{['', 'Traditional workflow builders', 'Colony Bridge'].map((header, index) => <div key={header || index} className={`p-4 text-[13px] font-semibold ${index === 2 ? 'bg-[#7db7ff]/10 text-[#bcd9ff]' : 'text-white/70'}`}>{header}</div>)}</div>
        <div className="min-w-[760px]">{rows.map((row) => <div key={row[0]} className="grid grid-cols-[1fr_1.25fr_1.25fr] border-b border-white/[0.05] last:border-b-0"><div className="p-4 text-[13px] font-semibold text-white/86">{row[0]}</div><div className="p-4 text-[13px] leading-relaxed text-white/48">{row[1]}</div><div className="bg-[#7db7ff]/[0.055] p-4 text-[13px] leading-relaxed text-white/78">{row[2]}</div></div>)}</div>
      </RevealOnScroll>
    </SectionShell>
  );
}

export function NewRoadmapSection() {
  const cards = [
    { n: '1', title: 'Goal to deliverable', status: 'Testing now', active: true, items: ['AI Ant goal routing', 'Colony Crew task flow', 'Project workspace preview', 'Review-ready output'] },
    { n: '2', title: 'Context and connected tools', status: 'Next', active: false, items: ['Better file handling', 'Approved connections', 'Structured extraction', 'Improved execution planning'] },
    { n: '3', title: 'Automation and collaboration', status: 'Later', active: false, items: ['Repeatable workflows', 'Reusable templates', 'Shared team workspaces', 'Approval history'] },
  ];
  return (
    <SectionShell id="roadmap">
      <SectionHeader label="MVP Testing Now" title="What early users can explore first." copy="We are starting with the smallest experience that proves whether an AI crew can turn a goal into useful, review-ready work." />
      <div className="mt-10 grid gap-4 md:grid-cols-3">{cards.map((card, index) => <RevealOnScroll key={card.title} delay={index * 0.06} y={18}><div className={`h-full rounded-[22px] border p-6 ${card.active ? 'border-[#7db7ff]/35 bg-[#7db7ff]/[0.055] shadow-[0_0_50px_rgba(125,183,255,0.12)]' : 'border-white/[0.08] bg-white/[0.025]'}`}><div className="mb-5 flex items-start justify-between"><span className="grid h-10 w-10 place-items-center rounded-full border border-white/[0.11] bg-white/[0.05] text-[15px] font-bold text-white">{card.n}</span><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${card.active ? 'border-[#7db7ff]/30 bg-[#7db7ff]/[0.10] text-[#bcd9ff]' : 'border-white/[0.10] bg-white/[0.035] text-white/46'}`}>{card.status}</span></div><h3 className="text-[17px] font-semibold text-white">{card.title}</h3><div className="mt-5 space-y-2">{card.items.map((item) => <p key={item} className="text-[13px] leading-relaxed text-white/58">{dot} {item}</p>)}</div></div></RevealOnScroll>)}</div>
      <p className="mt-6 text-[13px] text-white/42">Coming later: repeatable automation workflows, approved connectors, and shared collaboration tools.</p>
    </SectionShell>
  );
}

export function AboutUsSection() {
  const founders = [
    { initials: 'MO', name: 'Moss', role: 'Co-founder', focus: 'Business, Product, Strategy', copy: 'Designing the product experience, shaping the business direction, and finding the first real users for Colony Bridge.', tags: ['Product Strategy', 'Product', 'Business Dev', 'User Research'] },
    { initials: 'FP', name: 'Fais Putama', role: 'Co-founder', focus: 'Engineering, AI Systems', copy: 'Building the technical foundation, data systems, AI integrations, and workflow infrastructure behind Colony Bridge.', tags: ['Backend', 'Database', 'AI Engineer', 'Workflow Systems'] },
  ];
  return (
    <SectionShell id="team">
      <GlassPanel className="p-5 md:p-7">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.4fr]">
          <SectionHeader label="About Us" title="Built by a small team, shaped by early users." copy="Colony Bridge is a focused MVP built to help founders and small teams get coordinated AI work done. We are building in public and listening closely to shape what comes next." />
          <div className="grid gap-4 md:grid-cols-2">{founders.map((founder, index) => <RevealOnScroll key={founder.name} delay={index * 0.06} y={18}><div className="h-full rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-5"><div className="mb-5 flex items-center gap-4"><div className="grid h-14 w-14 place-items-center rounded-full border border-white/[0.12] bg-white/[0.06] text-[14px] font-bold text-white">{founder.initials}</div><div><h3 className="text-[17px] font-semibold text-white">{founder.name}</h3><p className="text-[12px] text-white/50">{founder.role}</p><p className="mt-1 text-[12px] font-semibold text-[#bcd9ff]">{founder.focus}</p></div></div><p className="text-[13px] leading-relaxed text-white/58">{founder.copy}</p><div className="mt-5 flex flex-wrap gap-2">{founder.tags.map((tag) => <span key={tag} className="rounded-full border border-white/[0.10] bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-white/62">{tag}</span>)}</div></div></RevealOnScroll>)}</div>
        </div>
        <div className="mt-5 flex flex-col gap-4 rounded-[20px] border border-white/[0.10] bg-white/[0.035] p-5 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-4"><FeatureIconBadge icon={<Users className="h-[18px] w-[18px]" />} /><div><h3 className="text-[18px] font-semibold text-white">Become a design partner</h3><p className="mt-1 text-[13px] leading-relaxed text-white/58">Try early workflows, share honest feedback, and help us decide what Colony Bridge should build next.</p></div></div><button type="button" onClick={() => document.getElementById('early-access')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="lp-btn-primary shrink-0 rounded-full px-5 py-2.5 text-[13px] font-semibold">Become a Pilot User <span aria-hidden>→</span></button></div>
      </GlassPanel>
    </SectionShell>
  );
}

export function FAQSection() {
  const reduce = useReducedMotion();
  const [open, setOpen] = React.useState(0);
  const faqs = [
    ['What is Colony Bridge?', 'Colony Bridge is an AI operating workspace where you describe a goal and AI Ant helps organize the work through specialist teams, workflows, secure tool connections, and review-ready deliverables.'],
    ['How is it different from a chatbot?', 'A chatbot usually responds inside a conversation. Colony Bridge is designed to organize work around your goal by creating structured tasks, specialist agent teams, visible progress, approvals, and deliverables.'],
    ['When should I use Colony Crew?', 'Use Colony Crew when a task benefits from multiple specialist roles, such as research, analysis, planning, writing, or quality review.'],
    ['What is One-man Enterprise?', 'One-man Enterprise is a planned workspace for building a structured AI organization around a larger business or long-term goal, with roles, departments, and visible coordination.'],
    ['What are secure tool connections used for?', 'Secure tool connections allow AI Ant to work with approved files, apps, and data while keeping important actions visible and subject to user approval.'],
    ['Does AI act without approval?', 'Colony Bridge is being designed with approval-first control. Sensitive actions such as sharing, sending, editing external data, or using connected tools should remain under user review.'],
  ];

  return (
    <SectionShell id="faq">
      <GlassPanel className="p-5 md:p-7">
        <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <SectionHeader label="FAQ" title="Frequently asked questions." />
          <a href="mailto:hello@colonybridge.ai" className="text-[13px] font-semibold text-white/62 transition hover:text-white">Still have questions? Contact us <span aria-hidden>→</span></a>
        </div>
        <div className="overflow-hidden rounded-[18px] border border-white/[0.08]">{faqs.map(([question, answer], index) => { const expanded = open === index; return <div key={question} className="border-b border-white/[0.06] last:border-b-0"><button type="button" onClick={() => setOpen(expanded ? -1 : index)} aria-expanded={expanded} className="flex w-full items-center justify-between gap-4 bg-white/[0.02] px-4 py-4 text-left transition hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#7db7ff]/55"><span className="flex min-w-0 items-center gap-4"><span className="text-[12px] font-bold text-[#bcd9ff]">{String(index + 1).padStart(2, '0')}</span><span className="text-[14px] font-semibold text-white">{question}</span></span>{expanded ? <Minus className="h-4 w-4 shrink-0 text-white/70" /> : <Plus className="h-4 w-4 shrink-0 text-white/70" />}</button><AnimatePresence initial={false}>{expanded && <motion.div initial={reduce ? false : { height: 0, opacity: 0 }} animate={reduce ? { opacity: 1 } : { height: 'auto', opacity: 1 }} exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: EASE_OUT_EXPO }} className="overflow-hidden"><p className="px-14 pb-5 text-[13px] leading-relaxed text-white/58">{answer}</p></motion.div>}</AnimatePresence></div>; })}</div>
      </GlassPanel>
    </SectionShell>
  );
}
