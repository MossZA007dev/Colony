import type { Page } from '../../types/navigation';
import { MarketingShell } from './components/MarketingShell';
import { PageHero } from './components/PageHero';
import { Bot, Users, Building2, Workflow, MousePointer2, ArrowRight } from 'lucide-react';

type FeatureCard = {
  page: Page;
  title: string;
  short: string;
  bullets: string[];
  accent: 'blue' | 'violet' | 'amber' | 'teal';
  icon: typeof Bot;
};

const FEATURES: FeatureCard[] = [
  {
    page: 'MarketingFeatureAIAnt',
    title: 'AI Ant',
    short: 'The coordinator. Picks the right mode for every goal.',
    bullets: ['Goal routing', 'Mode recommendation', 'Stays inside Colony Bridge'],
    accent: 'blue',
    icon: Bot,
  },
  {
    page: 'MarketingFeatureColonyCrew',
    title: 'Colony Crew',
    short: 'A specialist AI team assembled for complex one-off work.',
    bullets: ['Multi-agent coordination', 'Research → strategy → output', 'Review-ready deliverable'],
    accent: 'violet',
    icon: Users,
  },
  {
    page: 'MarketingFeatureOneManEnterprise',
    title: 'One-man Enterprise',
    short: 'A visible AI organization with roles and departments for long-term goals.',
    bullets: ['Director + project manager + roles', 'Cross-department coordination', 'Operating workspace'],
    accent: 'blue',
    icon: Building2,
  },
  {
    page: 'MarketingFeatureAutomation',
    title: 'Automation',
    short: 'Repeatable workflows for recurring work.',
    bullets: ['Scheduled triggers', 'Connected data sources', 'Approval before send'],
    accent: 'teal',
    icon: Workflow,
  },
  {
    page: 'MarketingFeatureColonyBridge',
    title: 'Colony Bridge',
    short: 'The approved action layer for real-world tools, files, and the browser.',
    bullets: ['Approved tool access', 'Files / browser / Gmail / Drive', 'Approval-first execution'],
    accent: 'amber',
    icon: MousePointer2,
  },
];

const ACCENT_CARD: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  blue: {
    border: 'border-[#7db7ff]/30',
    bg: 'bg-[#7db7ff]/[0.08]',
    text: 'text-[#bcd9ff]',
    glow: '0 0 26px rgba(125,183,255,0.18)',
  },
  violet: {
    border: 'border-violet-300/30',
    bg: 'bg-violet-500/[0.10]',
    text: 'text-violet-100',
    glow: '0 0 26px rgba(167,139,250,0.18)',
  },
  amber: {
    border: 'border-amber-300/30',
    bg: 'bg-amber-400/[0.08]',
    text: 'text-amber-100',
    glow: '0 0 26px rgba(252,211,77,0.18)',
  },
  teal: {
    border: 'border-emerald-300/30',
    bg: 'bg-emerald-400/[0.08]',
    text: 'text-emerald-100',
    glow: '0 0 26px rgba(110,231,183,0.18)',
  },
};

export function FeaturesPage({ goTo, currentPage }: { goTo: (page: Page) => void; currentPage: Page }) {
  return (
    <MarketingShell goTo={goTo} currentPage={currentPage}>
      <PageHero
        eyebrow="Features"
        title="Five connected ways to turn a goal into real work."
        subtitle="Colony Bridge is built around five modes. AI Ant routes between them; Colony Bridge handles every real-world action with approval."
      />

      <section className="px-5 pb-20 md:px-8">
        <div className="mx-auto grid max-w-[1200px] gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const tone = ACCENT_CARD[feature.accent];
            const Icon = feature.icon;
            return (
              <button
                key={feature.page}
                onClick={() => {
                  goTo(feature.page);
                  window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
                }}
                className="group relative overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#070A12]/72 p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.16] hover:bg-white/[0.035] motion-reduce:transform-none"
              >
                <div className="mb-5 flex items-start justify-between">
                  <div
                    className={`grid h-12 w-12 place-items-center rounded-2xl border ${tone.border} ${tone.bg} ${tone.text}`}
                    style={{ boxShadow: tone.glow }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/40 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
                </div>
                <h3 className="text-[18px] font-semibold tracking-tight text-white">{feature.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/55">{feature.short}</p>
                <ul className="mt-4 space-y-1.5">
                  {feature.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-[12px] text-white/60">
                      <span className={`h-1 w-1 rounded-full ${tone.text}`} />
                      {b}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
      </section>

      <section className="px-5 pb-24 md:px-8">
        <div className="mx-auto max-w-[1100px] rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-8 text-center md:p-10">
          <h3 className="text-[22px] font-semibold tracking-tight text-white md:text-[26px]">All modes share one workspace.</h3>
          <p className="mx-auto mt-3 max-w-[560px] text-[14px] text-white/55">
            AI Ant picks the right mode for each goal. Switching is automatic and approval stays with you.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button onClick={() => goTo('MarketingHowItWorks')} className="lp-btn-secondary rounded-full px-5 py-2.5 text-[13px] font-semibold">
              See How It Works
            </button>
            <button onClick={() => goTo('MarketingEarlyAccess')} className="lp-btn-primary rounded-full px-5 py-2.5 text-[13px] font-semibold">
              Request Early Access →
            </button>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}

export default FeaturesPage;
