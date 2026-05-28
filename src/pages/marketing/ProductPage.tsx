import type { Page } from '../../types/navigation';
import { MarketingShell } from './components/MarketingShell';
import { MvpMediaSlot } from './components/MvpMediaSlot';
import { ArrowRight, Bot, Building2, Check, FileText, Layers3, MessageSquareText, MousePointer2, ShieldCheck, SlidersHorizontal, Users, Workflow } from 'lucide-react';
import { RevealOnScroll } from '../LandingPage/components/motion';

const workModes = [
  {
    label: 'Conversation',
    title: 'AI Ant Chat',
    description: 'Ask questions, summarize files, draft content, and think through ideas directly with AI Ant.',
    example: 'Summarize this report.',
    output: 'Chat response',
    page: 'MarketingFeatureAIAnt' as Page,
    cta: 'Explore Chat',
    icon: MessageSquareText,
  },
  {
    label: 'Specialist Team',
    title: 'Colony Crew',
    description: 'Assemble specialist AI agents for one complex task such as research, strategy, or report creation.',
    example: 'Research competitors and prepare a launch plan.',
    output: 'Review-ready deliverable',
    page: 'MarketingFeatureColonyCrew' as Page,
    cta: 'Explore Colony Crew',
    icon: Users,
  },
  {
    label: 'Repeatable Work',
    title: 'Automation',
    description: 'Turn recurring work into a structured workflow with steps, outputs, and approval checkpoints.',
    example: 'Create a weekly sales summary every Monday.',
    output: 'Reusable workflow',
    page: 'MarketingFeatureAutomation' as Page,
    cta: 'Explore Automation',
    icon: Workflow,
  },
  {
    label: 'Long-term Structure',
    title: 'One-man Enterprise',
    description: 'Create an AI organization with roles, responsibilities, and workstreams around a long-term goal.',
    example: 'Help operate my online business.',
    output: 'AI organization workspace',
    page: 'MarketingFeatureOneManEnterprise' as Page,
    cta: 'Explore Enterprise',
    icon: Building2,
  },
  {
    label: 'Operator',
    title: 'Colony Bridge Operator',
    description: 'Give AI Ant a task involving browser, files, or connected apps, while keeping approval before important actions.',
    example: 'Collect competitor prices and prepare a sheet.',
    output: 'Completed operator task',
    page: 'MarketingFeatureColonyBridge' as Page,
    cta: 'Explore Operator',
    icon: MousePointer2,
  },
];

const modelChoices = [
  ['Auto', 'Let Colony Bridge recommend a suitable model for the task.'],
  ['Fast', 'Quick responses for everyday questions and drafting.'],
  ['Balanced', 'A practical mix of speed and reasoning quality.'],
  ['Deep Reasoning', 'More thorough thinking for planning and analysis.'],
];

export function ProductPage({ goTo, currentPage }: { goTo: (page: Page) => void; currentPage: Page }) {
  const open = (page: Page) => {
    goTo(page);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  return (
    <MarketingShell goTo={goTo} currentPage={currentPage}>
      <section className="relative overflow-hidden px-5 pb-16 pt-24 md:px-8 md:pb-24 md:pt-32">
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[460px] max-w-[1200px] bg-[radial-gradient(circle_at_50%_15%,rgba(124,92,252,0.16),transparent_62%)] blur-2xl" />
        <div className="relative mx-auto grid max-w-[1180px] items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
          <RevealOnScroll>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white/65">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7db7ff] shadow-[0_0_14px_rgba(125,183,255,0.6)]" />
              Product
            </p>
            <h1 className="max-w-[760px] text-[clamp(38px,5vw,64px)] font-semibold leading-[1.04] tracking-[-0.03em] text-white">
              One AI workspace. Multiple ways to get work done.
            </h1>
            <p className="mt-5 max-w-[680px] text-[16px] leading-relaxed text-white/65 md:text-[17px]">
              Colony Bridge starts with a simple conversation, then lets you choose the right way to work: ask AI Ant directly, assemble a specialist crew, automate recurring tasks, build an AI organization, or let an approved operator work across connected tools.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => open('MarketingEarlyAccess')} className="lp-btn-primary rounded-full px-6 py-3 text-[14px] font-semibold">
                Join Early Access
              </button>
              <button onClick={() => open('MarketingHowItWorks')} className="lp-btn-secondary rounded-full px-6 py-3 text-[14px] font-semibold">
                See How It Works
              </button>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={0.08}>
            <ProductPreview />
          </RevealOnScroll>
        </div>
      </section>

      <SectionWrap eyebrow="Start with a prompt" title="Simple like chat. Structured when the work grows." copy="Every task begins by telling AI Ant what you want to accomplish. For a quick request, it can answer directly. For more complex work, you can move into an AI crew, workflow, project, organization, or operator task without leaving the workspace.">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[24px] border border-white/[0.08] bg-[#070A12]/74 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/38">Prompt</p>
            <div className="mt-4 rounded-[18px] border border-white/[0.10] bg-white/[0.035] p-5 text-[17px] font-medium leading-relaxed text-white">
              Summarize this document and highlight the risks.
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-white/50">Choose manually, or let AI Ant recommend a suitable path.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {['Direct answer', 'Create a crew', 'Turn into workflow', 'Open in project', 'Use approved tools'].map((path) => (
              <div key={path} className="rounded-[18px] border border-white/[0.08] bg-white/[0.025] p-4 transition duration-300 hover:-translate-y-0.5 hover:border-white/[0.16] motion-reduce:transform-none">
                <Check className="mb-4 h-4 w-4 text-[#bcd9ff]" />
                <p className="text-[14px] font-semibold text-white">{path}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionWrap>

      <SectionWrap eyebrow="Model choice" title="Choose the balance between speed, quality, and depth." copy="Colony Bridge is designed to support multiple AI models. Users can keep model selection on Auto, or choose a preferred response style depending on the task.">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
          <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-5 md:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#bcd9ff]">Interface concept</p>
              <span className="rounded-full border border-white/[0.10] bg-white/[0.035] px-3 py-1 text-[11px] text-white/48">Model routing in development</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {modelChoices.map(([name, caption], index) => (
                <div key={name} className={`rounded-[18px] border p-4 ${index === 0 ? 'border-[#7db7ff]/32 bg-[#7db7ff]/[0.09]' : 'border-white/[0.08] bg-[#070A12]/68'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[15px] font-semibold text-white">{name}</p>
                    {index === 0 && <span className="rounded-full bg-[#7db7ff]/15 px-2 py-0.5 text-[10px] font-semibold text-[#bcd9ff]">Default</span>}
                  </div>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-white/55">{caption}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-[18px] border border-white/[0.08] bg-[#070A12]/70 p-4">
              <p className="text-[12px] font-semibold text-white/70">Advanced model selection</p>
              <p className="mt-1 text-[12px] leading-relaxed text-white/45">Provider and model lists belong in an advanced setting, so the main experience stays approachable.</p>
            </div>
          </div>
          <FlowCard items={['Your Prompt', 'Working Mode', 'Model Preference', 'Output']} />
        </div>
        <div className="mt-5">
          <MvpMediaSlot
            title="Future MVP screenshot: model selector inside AI Ant chat input"
            description="Replace with the real composer showing model preference once the interface is finalized."
            futureContentLabel="Prompt box, mode selector, model selector"
          />
        </div>
      </SectionWrap>

      <SectionWrap eyebrow="Work modes" title="Choose how AI Ant helps you." copy="A quick answer does not need the same structure as a long-term business goal. Colony Bridge gives users different ways to work, depending on what they want to accomplish.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {workModes.map((mode) => {
            const Icon = mode.icon;
            return (
              <button key={mode.title} onClick={() => open(mode.page)} className="group flex h-full flex-col rounded-[22px] border border-white/[0.08] bg-[#070A12]/70 p-5 text-left transition duration-300 hover:-translate-y-1 hover:border-[#7db7ff]/28 hover:bg-white/[0.035] motion-reduce:transform-none">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-[14px] border border-white/[0.08] bg-white/[0.04] text-[#bcd9ff]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <ArrowRight className="h-4 w-4 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-white/70" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/38">{mode.label}</p>
                <h3 className="mt-2 text-[17px] font-semibold tracking-tight text-white">{mode.title}</h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-white/56">{mode.description}</p>
                <div className="mt-5 space-y-2 border-t border-white/[0.06] pt-4">
                  <MetaRow label="Example" value={`"${mode.example}"`} />
                  <MetaRow label="Output" value={mode.output} />
                </div>
                <span className="mt-auto pt-5 text-[12px] font-semibold text-[#bcd9ff]">{mode.cta}</span>
              </button>
            );
          })}
        </div>
      </SectionWrap>

      <SectionWrap eyebrow="Work that stays organized" title="Your conversations become usable work." copy="Colony Bridge is designed so results do not disappear inside long chat histories. Projects keep related instructions, files, conversations, approvals, and final outputs together.">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-3">
            {[
              ['Projects', 'Keep chats, instructions, files, agents, and workflows around one goal.'],
              ['Deliverables', 'Collect reports, plans, summaries, and workflow outputs in a reviewable format.'],
              ['Context & Approval', 'Use project knowledge while keeping sensitive actions visible and controlled.'],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-[18px] border border-white/[0.08] bg-white/[0.025] p-5">
                <h3 className="text-[17px] font-semibold text-white">{title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/55">{copy}</p>
              </div>
            ))}
          </div>
          <MvpMediaSlot
            title="Project workspace and deliverables"
            description="This space is reserved for a real screenshot showing project context and completed output."
            futureContentLabel="Project files, instructions, conversation, final deliverable"
          />
        </div>
      </SectionWrap>

      <SectionWrap eyebrow="Human control" title="AI prepares. You approve what matters." copy="When AI work involves sending, saving, editing, publishing, or using connected tools, Colony Bridge is designed to place approval before sensitive actions.">
        <div className="mx-auto max-w-[760px] rounded-[24px] border border-amber-300/24 bg-amber-400/[0.06] p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <ApprovalCell label="Result prepared" value="Competitor comparison" />
            <ApprovalCell label="Destination" value="Google Sheets" />
            <ApprovalCell label="Action" value="Save comparison" />
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-white/[0.08] bg-[#070A12]/76 p-4">
            <p className="text-[12.5px] font-semibold text-amber-100">Approval-first capability, being validated for future connected workflows.</p>
            <div className="flex gap-2">
              <button className="rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-[12px] font-semibold text-white/70">Review</button>
              <button className="rounded-full bg-amber-200 px-4 py-2 text-[12px] font-bold text-[#171005]">Approve</button>
            </div>
          </div>
        </div>
      </SectionWrap>

      <SectionWrap eyebrow="Product in development" title="See the product take shape." copy="We are building and testing the first flows now. These areas are reserved for real product screenshots as the MVP becomes ready for pilot users.">
        <div className="grid gap-4 md:grid-cols-3">
          <MvpMediaSlot title="AI Ant chat and model selection" description="Future image: prompt box, mode selector, and model selector." futureContentLabel="AI Ant composer and preference controls" aspect="square" />
          <MvpMediaSlot title="Colony Crew execution" description="Future image: agent team proposal and deliverable status." futureContentLabel="Crew proposal and execution status" aspect="square" />
          <MvpMediaSlot title="Project and deliverable workspace" description="Future image: project files, chat history, and final output." futureContentLabel="Project context and deliverable list" aspect="square" />
        </div>
      </SectionWrap>

      <section className="px-5 pb-24 md:px-8">
        <RevealOnScroll className="mx-auto max-w-[1100px] rounded-[28px] border border-white/[0.08] bg-white/[0.025] p-8 text-center md:p-12">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7db7ff]">Early access</p>
          <h2 className="mx-auto mt-3 max-w-[780px] text-[30px] font-semibold leading-tight tracking-tight text-white md:text-[42px]">Bring one task. Help shape the first workflow.</h2>
          <p className="mx-auto mt-4 max-w-[620px] text-[14px] leading-relaxed text-white/58">We are looking for early users who want to test how Colony Bridge turns goals into structured AI-assisted work.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button onClick={() => open('MarketingEarlyAccess')} className="lp-btn-primary rounded-full px-6 py-3 text-[14px] font-semibold">Request Early Access</button>
            <button onClick={() => open('MarketingHowItWorks')} className="lp-btn-secondary rounded-full px-6 py-3 text-[14px] font-semibold">Read How It Works</button>
          </div>
        </RevealOnScroll>
      </section>
    </MarketingShell>
  );
}

function ProductPreview() {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/[0.10] bg-gradient-to-b from-white/[0.055] to-white/[0.015] p-5 shadow-[0_34px_110px_rgba(0,0,0,0.42)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_0%,rgba(125,183,255,0.14),transparent_56%)]" />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#bcd9ff]">Product preview</p>
          <span className="rounded-full border border-white/[0.10] bg-white/[0.04] px-3 py-1 text-[11px] text-white/55">Interface concept</span>
        </div>
        <div className="rounded-[22px] border border-white/[0.08] bg-[#06070b]/82 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">AI Ant prompt</p>
          <div className="mt-3 rounded-[16px] border border-white/[0.10] bg-white/[0.035] p-4 text-[15px] font-medium leading-relaxed text-white">
            Research competitors and prepare a launch plan.
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <SelectorMock icon={Layers3} label="Mode" value="Colony Crew" />
            <SelectorMock icon={SlidersHorizontal} label="Model" value="Balanced / Auto" />
          </div>
          <div className="mt-4 rounded-[16px] border border-[#7db7ff]/28 bg-[#7db7ff]/[0.08] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#bcd9ff]">Result preview</p>
            <p className="mt-2 text-[14px] font-semibold text-white">3 specialists proposed. Launch plan deliverable.</p>
          </div>
        </div>
        <div className="mt-4">
          <MvpMediaSlot
            title="MVP screenshot placeholder"
            description="Replace with the real AI Ant interface once the MVP flow is finalized."
            futureContentLabel="Real AI Ant interface screenshot"
            aspect="wide"
          />
        </div>
      </div>
    </div>
  );
}

function SectionWrap({ eyebrow, title, copy, children }: { eyebrow: string; title: string; copy: string; children: React.ReactNode }) {
  return (
    <section className="px-5 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-[1180px]">
        <RevealOnScroll>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#7db7ff]">{eyebrow}</p>
          <h2 className="max-w-[840px] text-[30px] font-semibold leading-tight tracking-tight text-white md:text-[44px]">{title}</h2>
          <p className="mt-4 max-w-[700px] text-[15px] leading-relaxed text-white/58 md:text-[16px]">{copy}</p>
        </RevealOnScroll>
        <RevealOnScroll className="mt-10" delay={0.08}>
          {children}
        </RevealOnScroll>
      </div>
    </section>
  );
}

function FlowCard({ items }: { items: string[] }) {
  return (
    <div className="rounded-[24px] border border-white/[0.08] bg-[#070A12]/74 p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/38">Flow</p>
      <div className="mt-5 space-y-3">
        {items.map((item, index) => (
          <div key={item} className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-full border border-[#7db7ff]/28 bg-[#7db7ff]/[0.08] text-[11px] font-bold text-[#bcd9ff]">{index + 1}</span>
            <div className="flex-1 rounded-[14px] border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-[13px] font-semibold text-white/78">{item}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SelectorMock({ icon: Icon, label, value }: { icon: typeof Bot; label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-white/[0.08] bg-white/[0.025] p-3">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="mt-2 text-[13px] font-semibold text-white">{value}</p>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">{label}</p>
      <p className="text-[12px] leading-relaxed text-white/70">{value}</p>
    </div>
  );
}

function ApprovalCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-white/[0.08] bg-[#070A12]/76 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">{label}</p>
      <p className="mt-2 text-[14px] font-semibold text-white">{value}</p>
    </div>
  );
}

export default ProductPage;
