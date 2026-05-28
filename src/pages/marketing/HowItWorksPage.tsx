import type { Page } from '../../types/navigation';
import { MarketingShell } from './components/MarketingShell';
import { MvpMediaSlot } from './components/MvpMediaSlot';
import { ArrowRight, Bot, Building2, Check, FileText, GitBranch, MousePointer2, ShieldCheck, SlidersHorizontal, Users, Workflow } from 'lucide-react';
import { RevealOnScroll } from '../LandingPage/components/motion';

const universalFlow = ['Prompt', 'Choose Mode', 'Choose Model Preference', 'Work Happens', 'Review Output'];

const examples = [
  ['Explain this contract', 'AI Ant Chat', 'Direct response with risks'],
  ['Research competitors and prepare a launch plan', 'Colony Crew', 'Review-ready launch plan'],
  ['Summarize weekly sales every Monday', 'Automation', 'Reusable reporting workflow'],
  ['Help manage my online business', 'One-man Enterprise', 'AI organization workspace'],
  ['Collect prices from websites and prepare a sheet', 'Colony Bridge Operator', 'Prepared table with sources'],
];

const decisions = [
  ['Do you only need an answer or quick help?', 'AI Ant Chat'],
  ['Does this task need several specialist roles?', 'Colony Crew'],
  ['Will this task repeat on a schedule or trigger?', 'Automation'],
  ['Is this a long-term goal with multiple roles and workstreams?', 'One-man Enterprise'],
  ['Does AI need to work through browser, files, or connected apps?', 'Colony Bridge Operator'],
];

const modeFlows = [
  {
    label: 'AI Ant Chat',
    icon: Bot,
    title: 'Ask directly. Choose how deeply AI responds.',
    useCase: 'Summarize this product report and highlight the key risks.',
    steps: ['User enters a prompt', 'User selects model preference', 'AI Ant answers in chat', 'User continues, saves, or expands into larger work'],
    output: 'Direct conversation response',
    slot: 'Insert real AI Ant chat input and model selector screenshot here.',
    status: 'Testing now',
  },
  {
    label: 'Colony Crew',
    icon: Users,
    title: 'Specialists assembled for one complex task.',
    useCase: 'Research competitors and prepare a 30-day launch plan.',
    steps: ['Goal is entered', 'Required skills are identified', 'Agent team is proposed', 'Model preference is auto matched or adjusted', 'Agents contribute to one deliverable', 'User reviews final result'],
    output: '30-day Launch Plan, ready for review',
    slot: 'Crew proposal, agent execution workspace, and deliverable preview.',
    status: 'Testing now',
  },
  {
    label: 'Automation',
    icon: Workflow,
    title: 'Turn repeatable work into a reusable process.',
    useCase: 'Every Monday, summarize sales performance and prepare a report.',
    steps: ['Identify recurring task', 'Select manual or scheduled trigger', 'Select file, sheet, or approved connector source', 'Add AI processing steps', 'Set approval rule', 'Choose output destination', 'Review run history'],
    output: 'Weekly Reporting Workflow',
    slot: 'Workflow builder canvas, run log, and approval panel.',
    status: 'In development',
  },
  {
    label: 'One-man Enterprise',
    icon: Building2,
    title: 'Build an AI organization around a long-term goal.',
    useCase: 'Help me operate and grow a small online business.',
    steps: ['Define the operating goal', 'Analyze responsibilities', 'Design an organization structure', 'Match agents to roles', 'Match model preferences to work', 'Create the workspace', 'Operate with approval'],
    output: 'Organization grid, role responsibilities, project workspace, expected deliverables, approval checkpoints',
    slot: 'Enterprise setup, organization grid, selected agent detail, model control, and team conversation workspace.',
    status: 'Prototype preview',
  },
  {
    label: 'Colony Bridge Operator',
    icon: MousePointer2,
    title: 'AI works across tools while you keep control.',
    useCase: 'Find competitor prices online and prepare a comparison sheet.',
    steps: ['User provides task', 'Operator opens approved environment', 'Browser, file, or app activity remains visible', 'Information is extracted', 'Result is prepared', 'Approval is requested before saving or sending', 'Deliverable is returned'],
    output: 'Prepared comparison table with visible sources and approval state',
    slot: 'Live browser workspace, approval request, and completed task evidence.',
    status: 'Future capability',
  },
];

export function HowItWorksPage({ goTo, currentPage }: { goTo: (page: Page) => void; currentPage: Page }) {
  const open = (page: Page) => {
    goTo(page);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  return (
    <MarketingShell goTo={goTo} currentPage={currentPage}>
      <section className="relative overflow-hidden px-5 pb-16 pt-24 md:px-8 md:pb-22 md:pt-32">
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[420px] max-w-[1180px] bg-[radial-gradient(circle_at_50%_15%,rgba(124,92,252,0.16),transparent_62%)] blur-2xl" />
        <RevealOnScroll className="relative mx-auto max-w-[980px] text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white/65">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-300 shadow-[0_0_14px_rgba(167,139,250,0.6)]" />
            How it works
          </p>
          <h1 className="text-[clamp(38px,5vw,60px)] font-semibold leading-[1.04] tracking-[-0.03em] text-white">
            From a prompt to structured AI work.
          </h1>
          <p className="mx-auto mt-5 max-w-[700px] text-[16px] leading-relaxed text-white/65 md:text-[17px]">
            Colony Bridge begins with what you want to accomplish, then helps organize the right working mode, model preference, process, and output around it.
          </p>
        </RevealOnScroll>
        <RevealOnScroll className="relative mx-auto mt-10 max-w-[1180px]" delay={0.08}>
          <ConnectedFlow items={universalFlow} />
        </RevealOnScroll>
      </section>

      <Section eyebrow="Universal system flow" title="One starting point. Different paths." copy="Every experience begins with a goal, but not every task needs the same kind of AI support. Users can choose a mode directly, or ask AI Ant to recommend one.">
        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[24px] border border-[#7db7ff]/25 bg-[#7db7ff]/[0.07] p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#bcd9ff]">Goal card</p>
            <h3 className="mt-3 text-[26px] font-semibold tracking-tight text-white">What do you want to accomplish?</h3>
            <p className="mt-3 text-[14px] leading-relaxed text-white/60">The same prompt surface can stay conversational or become structured work.</p>
          </div>
          <div className="grid gap-3">
            {examples.map(([prompt, mode, output]) => (
              <div key={prompt} className="grid gap-3 rounded-[18px] border border-white/[0.08] bg-white/[0.025] p-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
                <p className="text-[13px] font-semibold text-white">{prompt}</p>
                <ArrowRight className="hidden h-4 w-4 text-white/28 md:block" />
                <div>
                  <p className="text-[13px] font-semibold text-[#bcd9ff]">{mode}</p>
                  <p className="mt-0.5 text-[12px] text-white/45">{output}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section eyebrow="Mode selection logic" title="Choose the structure that fits the task." copy="Mode selection is an educational layer. It helps users decide how much structure the work needs before effort is spent.">
        <div className="grid gap-3 md:grid-cols-5">
          {decisions.map(([question, outcome], index) => (
            <div key={question} className="relative rounded-[20px] border border-white/[0.08] bg-[#070A12]/74 p-5">
              <span className="grid h-9 w-9 place-items-center rounded-full border border-violet-300/28 bg-violet-500/[0.10] text-[12px] font-bold text-violet-100">{index + 1}</span>
              <p className="mt-5 text-[13px] leading-relaxed text-white/62">{question}</p>
              <div className="mt-5 rounded-[14px] border border-[#7db7ff]/24 bg-[#7db7ff]/[0.08] px-3 py-2 text-[12px] font-semibold text-[#bcd9ff]">{outcome}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="Model preference" title="The right kind of thinking for the task." copy="Inside the experience, users can keep model selection simple or customize it when needed. Default should be Auto, with advanced mapping available only when useful.">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <ConnectedFlow items={['Task', 'Mode Selected', 'Model Preference', 'AI Response or Agent Assignment']} />
          <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-5">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#bcd9ff]">Routing interface concept</p>
            <div className="grid gap-2">
              {['Auto', 'Fast', 'Balanced', 'Deep Reasoning'].map((preference, index) => (
                <div key={preference} className={`rounded-[15px] border px-4 py-3 text-[13px] font-semibold ${index === 0 ? 'border-[#7db7ff]/30 bg-[#7db7ff]/[0.08] text-white' : 'border-white/[0.08] bg-[#070A12]/70 text-white/70'}`}>
                  {preference}
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-[16px] border border-white/[0.08] bg-[#070A12]/70 p-4">
              <p className="text-[12px] font-semibold text-white/72">Advanced model mapping</p>
              <p className="mt-1 text-[12px] leading-relaxed text-white/45">Text reasoning, web research, summarization, and data analysis can be treated as secondary controls.</p>
            </div>
          </div>
        </div>
      </Section>

      {modeFlows.map((flow) => (
        <ModeFlowSection key={flow.label} flow={flow} />
      ))}

      <Section eyebrow="Output and approval" title="Work ends in something you can review." copy="Regardless of the working mode, Colony Bridge is designed to make AI work visible through outputs, progress, and approval checkpoints.">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="grid gap-3 sm:grid-cols-2">
            {['Chat response', 'Crew deliverable', 'Workflow result', 'Enterprise workspace plan'].map((output) => (
              <div key={output} className="rounded-[18px] border border-white/[0.08] bg-white/[0.025] p-5">
                <FileText className="mb-4 h-4 w-4 text-[#bcd9ff]" />
                <p className="text-[15px] font-semibold text-white">{output}</p>
              </div>
            ))}
          </div>
          <div className="rounded-[24px] border border-amber-300/24 bg-amber-400/[0.06] p-5">
            <ConnectedFlow items={['Prepared Output', 'Review Required', 'Approve / Revise', 'Final Deliverable']} />
          </div>
        </div>
      </Section>

      <Section eyebrow="MVP screenshot placeholders" title="Reserved for the real product screens." copy="These placeholders are intentionally visible so real MVP screenshots can be inserted as each flow stabilizes.">
        <div className="grid gap-4 md:grid-cols-3">
          <MvpMediaSlot title="AI Ant chat input" description="Replace with the real chat composer and model selector." futureContentLabel="Chat input, mode selector, model selector" aspect="square" />
          <MvpMediaSlot title="One-man Enterprise organization grid" description="Replace with the real organization grid after the MVP implementation is stable." futureContentLabel="Organization grid and selected agent panel" aspect="square" />
          <MvpMediaSlot title="Operator approval request" description="Replace with the real connected-action approval screen." futureContentLabel="Permission scope, activity evidence, approval buttons" aspect="square" />
        </div>
      </Section>

      <section className="px-5 pb-24 md:px-8">
        <RevealOnScroll className="mx-auto max-w-[1100px] rounded-[28px] border border-white/[0.08] bg-white/[0.025] p-8 text-center md:p-12">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7db7ff]">Early access</p>
          <h2 className="mx-auto mt-3 max-w-[780px] text-[30px] font-semibold leading-tight tracking-tight text-white md:text-[42px]">Start with a prompt. See the structure.</h2>
          <p className="mx-auto mt-4 max-w-[620px] text-[14px] leading-relaxed text-white/58">Bring a real task and help shape the first Colony Bridge workflows.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button onClick={() => open('MarketingEarlyAccess')} className="lp-btn-primary rounded-full px-6 py-3 text-[14px] font-semibold">Request Early Access</button>
            <button onClick={() => open('MarketingFeatures')} className="lp-btn-secondary rounded-full px-6 py-3 text-[14px] font-semibold">Explore Features</button>
          </div>
        </RevealOnScroll>
      </section>
    </MarketingShell>
  );
}

function Section({ eyebrow, title, copy, children }: { eyebrow: string; title: string; copy: string; children: React.ReactNode }) {
  return (
    <section className="px-5 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-[1180px]">
        <RevealOnScroll>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#7db7ff]">{eyebrow}</p>
          <h2 className="max-w-[850px] text-[30px] font-semibold leading-tight tracking-tight text-white md:text-[44px]">{title}</h2>
          <p className="mt-4 max-w-[720px] text-[15px] leading-relaxed text-white/58 md:text-[16px]">{copy}</p>
        </RevealOnScroll>
        <RevealOnScroll className="mt-10" delay={0.08}>
          {children}
        </RevealOnScroll>
      </div>
    </section>
  );
}

function ConnectedFlow({ items }: { items: string[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-[repeat(var(--cols),minmax(0,1fr))]" style={{ ['--cols' as string]: items.length }}>
      {items.map((item, index) => (
        <div key={item} className="relative rounded-[18px] border border-white/[0.08] bg-[#070A12]/74 p-4">
          <span className="grid h-8 w-8 place-items-center rounded-full border border-[#7db7ff]/28 bg-[#7db7ff]/[0.08] text-[11px] font-bold text-[#bcd9ff]">{index + 1}</span>
          <p className="mt-5 text-[13px] font-semibold text-white/82">{item}</p>
          {index < items.length - 1 && <ArrowRight className="absolute -right-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-white/25 md:block" />}
        </div>
      ))}
    </div>
  );
}

function ModeFlowSection({ flow }: { flow: (typeof modeFlows)[number] }) {
  const Icon = flow.icon;
  const isEnterprise = flow.label === 'One-man Enterprise';
  return (
    <Section eyebrow={flow.label} title={flow.title} copy={`Use case: ${flow.useCase}`}>
      <div className={`grid gap-5 ${isEnterprise ? 'lg:grid-cols-[1fr_0.9fr]' : 'lg:grid-cols-[1fr_0.85fr]'}`}>
        <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-5 md:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.04] px-3 py-1.5 text-[12px] font-semibold text-white/70">
              <Icon className="h-3.5 w-3.5 text-[#bcd9ff]" />
              {flow.status}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">Output: {flow.output}</span>
          </div>
          <div className="grid gap-3">
            {flow.steps.map((step, index) => (
              <div key={step} className="flex gap-3 rounded-[16px] border border-white/[0.08] bg-[#070A12]/72 p-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-violet-300/28 bg-violet-500/[0.10] text-[11px] font-bold text-violet-100">{String(index + 1).padStart(2, '0')}</span>
                <p className="text-[13px] leading-relaxed text-white/68">{step}</p>
              </div>
            ))}
          </div>
          {isEnterprise && <EnterpriseOrg />}
        </div>
        <MvpMediaSlot title={`${flow.label} MVP screenshot slot`} description="Replace with real MVP imagery when this flow is stable." futureContentLabel={flow.slot} aspect={isEnterprise ? 'tall' : 'wide'} status={flow.status} />
      </div>
    </Section>
  );
}

function EnterpriseOrg() {
  const roles = [
    ['AI Ant Director', 'Leadership', 'Auto matched'],
    ['Project Manager', 'Coordination', 'Auto matched'],
    ['Research Agent', 'Market inputs', 'Auto matched'],
    ['Strategy Agent', 'Plan choices', 'User adjusted'],
    ['Writer Agent', 'Draft outputs', 'Balanced'],
    ['Quality Checker', 'Review', 'Deep Reasoning'],
  ];
  return (
    <div className="mt-6 rounded-[20px] border border-[#7db7ff]/22 bg-[#7db7ff]/[0.06] p-4">
      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#bcd9ff]">Example organization</p>
      <div className="grid gap-3 md:grid-cols-2">
        {roles.map(([role, responsibility, model]) => (
          <div key={role} className="rounded-[15px] border border-white/[0.08] bg-[#070A12]/74 p-3">
            <p className="text-[13px] font-semibold text-white">{role}</p>
            <p className="mt-1 text-[11.5px] text-white/46">{responsibility}</p>
            <span className="mt-3 inline-flex rounded-full border border-white/[0.10] bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-white/58">{model}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HowItWorksPage;
