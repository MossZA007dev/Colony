import type { Page } from '../../types/navigation';
import { MarketingShell } from './components/MarketingShell';
import { PageHero } from './components/PageHero';
import { Bot, Users, Building2, Workflow, MousePointer2, ArrowRight, FolderKanban, FileText, Brain, ShieldCheck, PlugZap } from 'lucide-react';

type FeatureCard = {
  page: Page;
  name: string;
  promise: string;
  useWhen: string;
  output: string;
  status: string;
  icon: typeof Bot;
};

const FEATURES: FeatureCard[] = [
  {
    page: 'MarketingFeatureAIAnt',
    name: 'AI Ant Chat',
    promise: 'Direct conversation with model preference control.',
    useWhen: 'Use when you need quick help, drafting, summarization, or a place to clarify the task.',
    output: 'Chat response with optional next steps',
    status: 'Testing now',
    icon: Bot,
  },
  {
    page: 'MarketingFeatureColonyCrew',
    name: 'Colony Crew',
    promise: 'Specialist AI roles assembled around one complex task.',
    useWhen: 'Use when research, strategy, writing, and review need to come together.',
    output: 'Review-ready deliverable',
    status: 'Testing now',
    icon: Users,
  },
  {
    page: 'MarketingFeatureAutomation',
    name: 'Automation',
    promise: 'Repeatable workflows for recurring work.',
    useWhen: 'Use when the same task happens weekly, daily, or after a trigger.',
    output: 'Reusable workflow',
    status: 'In development',
    icon: Workflow,
  },
  {
    page: 'MarketingFeatureOneManEnterprise',
    name: 'One-man Enterprise',
    promise: 'A structured AI organization for long-term goals.',
    useWhen: 'Use when a project needs roles, ownership, coordination, and continuity over time.',
    output: 'AI organization workspace',
    status: 'Prototype preview',
    icon: Building2,
  },
  {
    page: 'MarketingFeatureColonyBridge',
    name: 'Colony Bridge Operator',
    promise: 'Approved operator actions across browser, files, and connected apps.',
    useWhen: 'Use when AI needs to collect, prepare, save, or send work through external tools.',
    output: 'Completed operator task with evidence',
    status: 'Future capability',
    icon: MousePointer2,
  },
];

const workspaceCapabilities = [
  ['Projects', 'Keep goals, chats, instructions, files, workflows, and outputs together.', FolderKanban],
  ['Deliverables', 'Collect reports, plans, summaries, and workflow results in reviewable form.', FileText],
  ['Knowledge', 'Give each work mode useful context without making users repeat themselves.', Brain],
  ['Approvals', 'Keep sensitive actions visible, reviewable, and controlled.', ShieldCheck],
  ['Connectors', 'Prepare the bridge to files, apps, and external tools as capabilities mature.', PlugZap],
];

export function FeaturesPage({ goTo, currentPage }: { goTo: (page: Page) => void; currentPage: Page }) {
  const open = (page: Page) => {
    goTo(page);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  return (
    <MarketingShell goTo={goTo} currentPage={currentPage}>
      <PageHero
        eyebrow="Features"
        title="Choose how AI helps you work."
        subtitle="From direct conversation to long-term AI operations, Colony Bridge provides different working experiences for different kinds of goals."
      />

      <section className="px-5 pb-20 md:px-8">
        <div className="mx-auto grid max-w-[1200px] gap-4 md:grid-cols-2 xl:grid-cols-5">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <button
                key={feature.page}
                onClick={() => open(feature.page)}
                className="group flex h-full flex-col rounded-[22px] border border-white/[0.08] bg-[#070A12]/72 p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#7db7ff]/28 hover:bg-white/[0.035] motion-reduce:transform-none"
              >
                <div className="mb-5 flex items-start justify-between gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[#7db7ff]/24 bg-[#7db7ff]/[0.08] text-[#bcd9ff]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="rounded-full border border-white/[0.10] bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-white/50">
                    {feature.status}
                  </span>
                </div>
                <h3 className="text-[18px] font-semibold tracking-tight text-white">{feature.name}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/56">{feature.promise}</p>
                <div className="mt-5 space-y-3 border-t border-white/[0.06] pt-4">
                  <Info label="Use when" value={feature.useWhen} />
                  <Info label="Output" value={feature.output} />
                </div>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[12.5px] font-semibold text-[#bcd9ff]">
                  Learn more <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="px-5 pb-24 md:px-8">
        <div className="mx-auto max-w-[1200px] rounded-[28px] border border-white/[0.08] bg-white/[0.025] p-6 md:p-8">
          <div className="max-w-[760px]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7db7ff]">Workspace capabilities</p>
            <h2 className="mt-3 text-[30px] font-semibold leading-tight tracking-tight text-white md:text-[40px]">Support systems around every working mode.</h2>
            <p className="mt-4 text-[14px] leading-relaxed text-white/58 md:text-[15px]">
              Projects, deliverables, knowledge, approvals, and connectors are not separate modes. They support the ways users work with AI Ant.
            </p>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-5">
            {workspaceCapabilities.map(([title, copy, Icon]) => (
              <div key={title as string} className="rounded-[18px] border border-white/[0.08] bg-[#070A12]/70 p-4">
                <Icon className="mb-4 h-4 w-4 text-[#bcd9ff]" />
                <h3 className="text-[15px] font-semibold text-white">{title as string}</h3>
                <p className="mt-2 text-[12px] leading-relaxed text-white/52">{copy as string}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/34">{label}</p>
      <p className="mt-1 text-[12px] leading-relaxed text-white/66">{value}</p>
    </div>
  );
}

export default FeaturesPage;
