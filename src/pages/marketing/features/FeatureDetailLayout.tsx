import React from 'react';
import { motion } from 'framer-motion';
import type { Page } from '../../../types/navigation';
import { MarketingShell } from '../components/MarketingShell';
import { PageHero } from '../components/PageHero';
import { MvpMediaSlot, type MvpMediaSlotProps } from '../components/MvpMediaSlot';
import { ArrowRight, Check, CircleDot, GitBranch, Layers3, Settings2, ShieldCheck } from 'lucide-react';
import { EASE_OUT_EXPO, RevealOnScroll } from '../../LandingPage/components/motion';

type Accent = 'blue' | 'violet' | 'amber' | 'teal';

export type FeatureDetailProps = {
  goTo: (page: Page) => void;
  currentPage: Page;
  eyebrow: string;
  title: React.ReactNode;
  subtitle: React.ReactNode;
  accent: Accent;
  status: { label: string; copy: string };
  problem: { title: string; copy: string };
  whenToUse: string[];
  howItWorks: { title: string; copy: string }[];
  scenario: {
    goal: string;
    setup: string;
    steps: string[];
    finalOutput: string;
  };
  output: { title: string; copy: string; bullets: string[] };
  configuration?: { title: string; copy: string; options: string[] };
  relations: string[];
  preview: { title: string; flow: string[] };
  mvpSlots: MvpMediaSlotProps[];
};

const ACCENT_TONE: Record<Accent, { border: string; bg: string; text: string; glow: string; line: string }> = {
  blue: { border: 'border-[#7db7ff]/30', bg: 'bg-[#7db7ff]/[0.10]', text: 'text-[#bcd9ff]', glow: '0 0 30px rgba(125,183,255,0.16)', line: 'from-[#7db7ff]/0 via-[#7db7ff]/60 to-[#7db7ff]/0' },
  violet: { border: 'border-violet-300/30', bg: 'bg-violet-500/[0.10]', text: 'text-violet-100', glow: '0 0 30px rgba(167,139,250,0.16)', line: 'from-violet-300/0 via-violet-300/60 to-violet-300/0' },
  amber: { border: 'border-amber-300/30', bg: 'bg-amber-400/[0.10]', text: 'text-amber-100', glow: '0 0 30px rgba(252,211,77,0.16)', line: 'from-amber-300/0 via-amber-300/60 to-amber-300/0' },
  teal: { border: 'border-emerald-300/30', bg: 'bg-emerald-400/[0.10]', text: 'text-emerald-100', glow: '0 0 30px rgba(110,231,183,0.16)', line: 'from-emerald-300/0 via-emerald-300/60 to-emerald-300/0' },
};

export function FeatureDetailLayout(props: FeatureDetailProps) {
  const tone = ACCENT_TONE[props.accent];

  return (
    <MarketingShell goTo={props.goTo} currentPage={props.currentPage}>
      <PageHero
        eyebrow={props.eyebrow}
        title={props.title}
        subtitle={props.subtitle}
        accent={props.accent}
        ctas={
          <>
            <button onClick={() => props.goTo('MarketingEarlyAccess')} className="lp-btn-primary rounded-full px-6 py-3 text-[14px] font-semibold">Join Early Access</button>
            <button onClick={() => props.goTo('MarketingFeatures')} className="lp-btn-secondary rounded-full px-6 py-3 text-[14px] font-medium">All Features</button>
          </>
        }
      />

      <section className="px-5 pb-16 md:px-8">
        <RevealOnScroll className="mx-auto max-w-[1100px]">
          <ProductPreview title={props.preview.title} flow={props.preview.flow} status={props.status.label} tone={tone} />
        </RevealOnScroll>
      </section>

      <section className="px-5 pb-16 md:px-8">
        <RevealOnScroll className="mx-auto grid max-w-[1100px] gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className={`rounded-[24px] border ${tone.border} ${tone.bg} p-6`} style={{ boxShadow: tone.glow }}>
            <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${tone.text}`}>Problem it solves</p>
            <h2 className="mt-3 text-[28px] font-semibold leading-tight tracking-tight text-white md:text-[36px]">{props.problem.title}</h2>
            <p className="mt-4 text-[14px] leading-relaxed text-white/64">{props.problem.copy}</p>
          </div>
          <div className="grid gap-3">
            {props.whenToUse.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-[16px] border border-white/[0.08] bg-white/[0.025] p-4 transition duration-300 hover:-translate-y-0.5 hover:border-white/[0.16] motion-reduce:transform-none">
                <Check className={`mt-0.5 h-4 w-4 shrink-0 ${tone.text}`} />
                <p className="text-[13.5px] leading-relaxed text-white/72">{item}</p>
              </div>
            ))}
          </div>
        </RevealOnScroll>
      </section>

      <FeatureSection eyebrow="How it works" title="Step-by-step usage." copy="Each feature turns a prompt into a more intentional working structure, with progress and outputs kept visible.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {props.howItWorks.map((step, index) => (
            <RevealOnScroll key={step.title} delay={index * 0.04}>
              <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.24, ease: EASE_OUT_EXPO }} className="relative h-full overflow-hidden rounded-[18px] border border-white/[0.08] bg-[#070A12]/72 p-5">
                <div className={`absolute inset-x-3 top-0 h-px bg-gradient-to-r ${tone.line}`} />
                <span className={`grid h-9 w-9 place-items-center rounded-full border ${tone.border} ${tone.bg} ${tone.text} text-[12px] font-bold`}>{String(index + 1).padStart(2, '0')}</span>
                <h3 className="mt-5 text-[15px] font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/58">{step.copy}</p>
              </motion.div>
            </RevealOnScroll>
          ))}
        </div>
      </FeatureSection>

      <section className="px-5 pb-16 md:px-8">
        <RevealOnScroll className="mx-auto grid max-w-[1100px] gap-6 lg:grid-cols-[1fr_1fr]">
          <ScenarioPanel scenario={props.scenario} tone={tone} />
          <OutcomePanel output={props.output} tone={tone} />
        </RevealOnScroll>
      </section>

      {props.configuration && (
        <FeatureSection eyebrow="Configuration" title={props.configuration.title} copy={props.configuration.copy}>
          <div className="grid gap-3 md:grid-cols-4">
            {props.configuration.options.map((option, index) => (
              <div key={option} className={`rounded-[18px] border p-4 ${index === 0 ? `${tone.border} ${tone.bg}` : 'border-white/[0.08] bg-white/[0.025]'}`}>
                <Settings2 className={`mb-4 h-4 w-4 ${index === 0 ? tone.text : 'text-white/40'}`} />
                <p className="text-[13px] font-semibold text-white">{option}</p>
              </div>
            ))}
          </div>
        </FeatureSection>
      )}

      <FeatureSection eyebrow="How this fits" title="Connected to the rest of Colony Bridge." copy="This feature has one clear job, but it can hand context, outputs, or approvals to the rest of the workspace.">
        <div className="grid gap-3 md:grid-cols-3">
          {props.relations.map((relation, index) => (
            <div key={relation} className="rounded-[16px] border border-white/[0.08] bg-[#070A12]/70 p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className={`grid h-7 w-7 place-items-center rounded-full border ${tone.border} ${tone.bg} ${tone.text} text-[11px] font-bold`}>{index + 1}</span>
                <GitBranch className="h-3.5 w-3.5 text-white/35" />
              </div>
              <p className="text-[13px] leading-relaxed text-white/66">{relation}</p>
            </div>
          ))}
        </div>
      </FeatureSection>

      <FeatureSection eyebrow="MVP screenshot area" title="Reserved for real product screenshots." copy="These slots are intentionally left as premium placeholders so real MVP screens can replace them later without redesigning the page.">
        <div className="grid gap-4 md:grid-cols-3">
          {props.mvpSlots.map((slot) => <MvpMediaSlot key={slot.title} {...slot} />)}
        </div>
      </FeatureSection>

      <section className="px-5 pb-24 md:px-8">
        <RevealOnScroll className="mx-auto grid max-w-[1100px] gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <div className={`rounded-[22px] border ${tone.border} ${tone.bg} p-6`} style={{ boxShadow: tone.glow }}>
            <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${tone.text}`}>Current status</p>
            <h3 className="mt-3 text-[22px] font-semibold tracking-tight text-white">{props.status.label}</h3>
            <p className="mt-3 text-[13.5px] leading-relaxed text-white/65">{props.status.copy}</p>
          </div>
          <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-8 md:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">Next step</p>
            <h3 className="mt-3 text-[24px] font-semibold tracking-tight text-white md:text-[30px]">Bring one real workflow into early access.</h3>
            <p className="mt-3 max-w-[620px] text-[14px] leading-relaxed text-white/58">Colony Bridge is being shaped with founders and small teams who want AI work to be structured, useful, and approval-first.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => props.goTo('MarketingEarlyAccess')} className="lp-btn-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold">Request Early Access <ArrowRight className="h-3.5 w-3.5" /></button>
              <button onClick={() => props.goTo('MarketingFeatures')} className="lp-btn-secondary rounded-full px-6 py-3 text-[14px] font-semibold">See All Features</button>
            </div>
          </div>
        </RevealOnScroll>
      </section>
    </MarketingShell>
  );
}

function FeatureSection({ eyebrow, title, copy, children }: { eyebrow: string; title: string; copy: string; children: React.ReactNode }) {
  return (
    <section className="px-5 pb-16 md:px-8">
      <div className="mx-auto max-w-[1100px]">
        <RevealOnScroll>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#7db7ff]">{eyebrow}</p>
          <h2 className="text-[28px] font-semibold leading-tight tracking-tight text-white md:text-[36px]">{title}</h2>
          <p className="mt-4 max-w-[680px] text-[14px] leading-relaxed text-white/58 md:text-[15px]">{copy}</p>
        </RevealOnScroll>
        <RevealOnScroll className="mt-8" delay={0.08}>{children}</RevealOnScroll>
      </div>
    </section>
  );
}

function ProductPreview({ title, flow, status, tone }: { title: string; flow: string[]; status: string; tone: (typeof ACCENT_TONE)[Accent] }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/[0.09] bg-gradient-to-b from-white/[0.045] to-white/[0.015] p-5 shadow-[0_34px_110px_rgba(0,0,0,0.42)] md:p-7">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_55%_0%,rgba(125,183,255,0.13),transparent_54%)]" />
      <div className="relative flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className={`grid h-9 w-9 place-items-center rounded-[12px] border ${tone.border} ${tone.bg} ${tone.text}`}><Layers3 className="h-4 w-4" /></span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/36">UI preview</p>
              <h2 className="mt-1 text-[19px] font-semibold tracking-tight text-white">{title}</h2>
            </div>
          </div>
          <span className="rounded-full border border-white/[0.10] bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-white/55">{status}</span>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {flow.map((step, index) => (
            <div key={step} className="relative rounded-[16px] border border-white/[0.08] bg-[#06070b]/75 p-4">
              <CircleDot className={`mb-4 h-4 w-4 ${tone.text}`} />
              <p className="text-[12.5px] font-semibold leading-snug text-white/82">{step}</p>
              {index < flow.length - 1 && <ArrowRight className="absolute -right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-white/25 md:block" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScenarioPanel({ scenario, tone }: { scenario: FeatureDetailProps['scenario']; tone: (typeof ACCENT_TONE)[Accent] }) {
  return (
    <div className="rounded-[24px] border border-white/[0.08] bg-[#070A12]/72 p-6 md:p-8">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-white/40">Example use case</p>
      <h2 className="text-[24px] font-semibold tracking-tight text-white md:text-[30px]">{scenario.goal}</h2>
      <p className="mt-3 text-[14px] leading-relaxed text-white/60">{scenario.setup}</p>
      <div className="mt-6 space-y-2">
        {scenario.steps.map((step, index) => (
          <div key={step} className="flex gap-3 rounded-[14px] border border-white/[0.08] bg-white/[0.025] px-3.5 py-3">
            <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${tone.border} ${tone.bg} ${tone.text} text-[10px] font-bold`}>{index + 1}</span>
            <p className="text-[13px] leading-relaxed text-white/70">{step}</p>
          </div>
        ))}
      </div>
      <div className={`mt-5 rounded-[16px] border ${tone.border} ${tone.bg} p-4`}>
        <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${tone.text}`}>Final output</p>
        <p className="mt-2 text-[14px] font-semibold leading-relaxed text-white">{scenario.finalOutput}</p>
      </div>
    </div>
  );
}

function OutcomePanel({ output, tone }: { output: FeatureDetailProps['output']; tone: (typeof ACCENT_TONE)[Accent] }) {
  return (
    <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-6 md:p-8">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#7db7ff]">Output / deliverable</p>
      <h2 className="text-[26px] font-semibold tracking-tight text-white md:text-[32px]">{output.title}</h2>
      <p className="mt-3 text-[14px] leading-relaxed text-white/62">{output.copy}</p>
      <div className="mt-6 grid gap-2">
        {output.bullets.map((bullet) => (
          <div key={bullet} className="flex items-center gap-3 rounded-[14px] border border-white/[0.08] bg-[#070A12]/70 px-3.5 py-3">
            <ShieldCheck className={`h-4 w-4 shrink-0 ${tone.text}`} />
            <p className="text-[13px] font-medium text-white/76">{bullet}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FeatureDetailLayout;
