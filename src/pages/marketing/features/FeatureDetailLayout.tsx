import React from 'react';
import type { Page } from '../../../types/navigation';
import { MarketingShell } from '../components/MarketingShell';
import { PageHero } from '../components/PageHero';
import { ArrowRight, Check } from 'lucide-react';

export type FeatureDetailProps = {
  goTo: (page: Page) => void;
  currentPage: Page;
  eyebrow: string;
  title: React.ReactNode;
  subtitle: React.ReactNode;
  accent: 'blue' | 'violet' | 'amber' | 'teal';
  whatItDoes: string;
  whenToUse: string[];
  howItWorks: { title: string; copy: string }[];
  output: string;
  outputBullets?: string[];
  visual?: React.ReactNode;
};

const ACCENT_TONE: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  blue: { border: 'border-[#7db7ff]/30', bg: 'bg-[#7db7ff]/[0.10]', text: 'text-[#bcd9ff]', glow: '0 0 26px rgba(125,183,255,0.18)' },
  violet: { border: 'border-violet-300/30', bg: 'bg-violet-500/[0.10]', text: 'text-violet-100', glow: '0 0 26px rgba(167,139,250,0.18)' },
  amber: { border: 'border-amber-300/30', bg: 'bg-amber-400/[0.10]', text: 'text-amber-100', glow: '0 0 26px rgba(252,211,77,0.18)' },
  teal: { border: 'border-emerald-300/30', bg: 'bg-emerald-400/[0.10]', text: 'text-emerald-100', glow: '0 0 26px rgba(110,231,183,0.18)' },
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
            <button onClick={() => props.goTo('MarketingEarlyAccess')} className="lp-btn-primary rounded-full px-6 py-3 text-[14px] font-semibold">
              Request Early Access
            </button>
            <button onClick={() => props.goTo('MarketingFeatures')} className="lp-btn-secondary rounded-full px-6 py-3 text-[14px] font-medium">
              All Features
            </button>
          </>
        }
      />

      <section className="px-5 pb-16 md:px-8">
        <div className="mx-auto grid max-w-[1100px] gap-4 md:grid-cols-3">
          <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.025] p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">What it does</p>
            <p className="mt-3 text-[14px] leading-relaxed text-white/82">{props.whatItDoes}</p>
          </div>
          <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.025] p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">When to use it</p>
            <ul className="mt-3 space-y-2">
              {props.whenToUse.map((item) => (
                <li key={item} className="flex items-start gap-2 text-[13.5px] leading-relaxed text-white/72">
                  <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${tone.text}`} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className={`rounded-[20px] border ${tone.border} ${tone.bg} p-6`} style={{ boxShadow: tone.glow }}>
            <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${tone.text}`}>Output</p>
            <p className="mt-3 text-[14px] font-semibold leading-relaxed text-white">{props.output}</p>
            {props.outputBullets && (
              <ul className="mt-3 space-y-1.5">
                {props.outputBullets.map((b) => (
                  <li key={b} className="text-[12.5px] leading-relaxed text-white/70">
                    • {b}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="px-5 pb-16 md:px-8">
        <div className="mx-auto max-w-[1100px]">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#7db7ff]">How it works</p>
          <h2 className="text-[28px] font-semibold tracking-tight text-white md:text-[36px]">Step by step.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {props.howItWorks.map((step, i) => (
              <div
                key={step.title}
                className="relative rounded-[18px] border border-white/[0.08] bg-[#070A12]/72 p-5 transition hover:-translate-y-0.5 hover:border-white/[0.16] motion-reduce:transform-none"
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className={`grid h-8 w-8 place-items-center rounded-full border ${tone.border} ${tone.bg} ${tone.text} text-[12px] font-bold`}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="text-[15px] font-semibold text-white">{step.title}</h3>
                </div>
                <p className="text-[13px] leading-relaxed text-white/58">{step.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {props.visual && (
        <section className="px-5 pb-16 md:px-8">
          <div className="mx-auto max-w-[1100px]">{props.visual}</div>
        </section>
      )}

      <section className="px-5 pb-24 md:px-8">
        <div className="mx-auto max-w-[1100px] rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-8 text-center md:p-10">
          <h3 className="text-[22px] font-semibold tracking-tight text-white md:text-[26px]">Want to try this in the pilot?</h3>
          <p className="mx-auto mt-3 max-w-[520px] text-[14px] text-white/55">
            Selected pilot users are invited as we test each mode with real work.
          </p>
          <button
            onClick={() => props.goTo('MarketingEarlyAccess')}
            className="lp-btn-primary mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold"
          >
            Request Pilot Access <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>
    </MarketingShell>
  );
}

export default FeatureDetailLayout;
