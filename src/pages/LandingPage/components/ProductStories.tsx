import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { Bot, Users, Workflow, FolderKanban, ShieldCheck, ArrowRight } from 'lucide-react';
import { EASE_OUT_EXPO, RevealOnScroll } from './motion';

type Story = {
  id: string;
  eyebrow: string;
  headline: React.ReactNode;
  copy: string;
  icon: React.ComponentType<{ className?: string }>;
  tint: string;
  preview: React.ReactNode;
};

const STORIES: Story[] = [
  {
    id: 'ai-ant-story',
    eyebrow: 'AI Ant',
    headline: (
      <>
        Start with the goal.<br />
        <span className="text-white/55">Colony decides the rest.</span>
      </>
    ),
    copy:
      'Describe what you want to accomplish. AI Ant decides the right structure, agents, tools, and models — and shows you the path it picked.',
    icon: Bot,
    tint: 'rgba(125,183,255,0.16)',
    preview: <AiAntPreview />,
  },
  {
    id: 'crew-story',
    eyebrow: 'Colony Crew',
    headline: <>Specialists assembled for the task.</>,
    copy:
      'Research, analysis, writing, and review — coordinated in one visible workspace. Every agent has a role and a model picked to match it.',
    icon: Users,
    tint: 'rgba(124,92,252,0.18)',
    preview: <CrewPreview />,
  },
  {
    id: 'automation-story',
    eyebrow: 'Automation',
    headline: <>Repeatable work, without technical setup.</>,
    copy:
      'Turn recurring tasks into workflows you can understand, test, approve, and reuse. No nodes, no triggers, no scaffolding.',
    icon: Workflow,
    tint: 'rgba(0,212,170,0.14)',
    preview: <AutomationPreview />,
  },
  {
    id: 'projects-story',
    eyebrow: 'Projects & Deliverables',
    headline: <>Work that keeps its context.</>,
    copy:
      'Chats, files, instructions, workflows, and final outputs stay connected inside every project — so you never lose the thread.',
    icon: FolderKanban,
    tint: 'rgba(245,200,66,0.12)',
    preview: <ProjectsPreview />,
  },
  {
    id: 'bridge-story',
    eyebrow: 'Safety · Colony Bridge',
    headline: <>Powerful access. Human approval.</>,
    copy:
      'AI Ant can work across files and tools, but sensitive actions never happen without permission. You see what it asks, every time.',
    icon: ShieldCheck,
    tint: 'rgba(255,107,107,0.12)',
    preview: <BridgePreview />,
  },
];

export function ProductStories() {
  return (
    <section id="stories" className="px-5 md:px-8">
      <div className="mx-auto max-w-[1200px]">
        {STORIES.map((story, idx) => (
          <ProductStorySection key={story.id} story={story} index={idx} />
        ))}
      </div>
    </section>
  );
}

function ProductStorySection({ story, index }: { story: Story; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Subtle scale 0.97 -> 1 -> 0.99
  const previewScale = useTransform(scrollYProgress, [0, 0.45, 1], [0.97, 1, 0.99]);
  const previewY = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const flip = index % 2 === 1;

  return (
    <div
      ref={ref}
      className="relative grid items-center gap-10 py-24 md:py-32 lg:grid-cols-2 lg:gap-16"
    >
      {/* Ambient tint behind preview */}
      <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
        <motion.div
          aria-hidden
          style={{ opacity: useTransform(scrollYProgress, [0, 0.45, 1], [0, 1, 0]) }}
          className="absolute left-1/2 top-1/2 h-[55%] w-[55%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        >
          <div
            className="h-full w-full rounded-full"
            style={{ background: `radial-gradient(circle, ${story.tint} 0%, transparent 65%)`, filter: 'blur(70px)' }}
          />
        </motion.div>
      </div>

      {/* Text */}
      <RevealOnScroll className={flip ? 'lg:order-2' : ''} y={26} duration={0.9}>
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">
            <story.icon className="h-3.5 w-3.5" />
            {story.eyebrow}
          </div>
          <h3 className="mt-5 text-[34px] font-semibold leading-[1.08] tracking-tight text-white md:text-[48px]">
            {story.headline}
          </h3>
          <p className="mt-5 text-[15px] leading-[1.7] text-white/62 md:text-[17px]">{story.copy}</p>
        </div>
      </RevealOnScroll>

      {/* Preview */}
      <motion.div
        style={reduce ? undefined : { scale: previewScale, y: previewY }}
        className={`relative ${flip ? 'lg:order-1' : ''}`}
      >
        <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-5 shadow-[0_40px_120px_rgba(0,0,0,0.45)] md:p-7">
          {story.preview}
        </div>
      </motion.div>
    </div>
  );
}

function AiAntPreview() {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#06070b]/85 p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Goal</p>
      <p className="mt-2 text-[14px] leading-7 text-white/85">Plan a launch for our new product.</p>
      <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="rounded-full border border-[#7db7ff]/35 bg-[#7db7ff]/10 px-2.5 py-1 font-medium text-[#bcd9ff]">Crew mode</span>
        <span className="text-white/35">·</span>
        <span className="rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 font-medium text-white/72">3 agents</span>
        <span className="text-white/35">·</span>
        <span className="rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 font-medium text-white/72">Approval-first</span>
      </div>
      <div className="mt-5 space-y-2">
        {[
          ['Research', 'Pulls market context'],
          ['Strategist', 'Drafts positioning'],
          ['Writer', 'Prepares launch plan'],
        ].map(([role, sub]) => (
          <div key={role} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
            <span className="text-[13px] font-medium text-white/85">{role}</span>
            <span className="text-[11px] text-white/45">{sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CrewPreview() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[
        ['Research', 'Gathering competitor signals', 'Active'],
        ['Analyst', 'Comparing performance', 'Active'],
        ['Writer', 'Drafting summary', 'Queued'],
        ['Reviewer', 'Final check', 'Idle'],
      ].map(([role, sub, status]) => (
        <div key={role} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-white">{role}</p>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                status === 'Active'
                  ? 'bg-[#7db7ff]/15 text-[#bcd9ff]'
                  : status === 'Queued'
                  ? 'bg-white/[0.06] text-white/55'
                  : 'bg-white/[0.04] text-white/35'
              }`}
            >
              {status}
            </span>
          </div>
          <p className="mt-2 text-[11.5px] leading-snug text-white/55">{sub}</p>
        </div>
      ))}
    </div>
  );
}

function AutomationPreview() {
  const steps = ['Trigger', 'Read Source', 'Analyze', 'Approval', 'Deliverable'];
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Weekly Sales Workflow</p>
      <div className="mt-4 space-y-2">
        {steps.map((step, idx) => (
          <div key={step} className="flex items-center gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/[0.1] bg-white/[0.04] font-mono text-[10px] font-semibold text-white/55">
              {idx + 1}
            </span>
            <div className="flex flex-1 items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-2.5">
              <span className="text-[13px] font-medium text-white/85">{step}</span>
              {idx < steps.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-white/35" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectsPreview() {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Project</p>
          <p className="mt-1.5 text-[15px] font-semibold text-white">Q3 Launch Plan</p>
        </div>
        <span className="rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1 text-[11px] text-white/65">Active</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {[
          ['Chats', '12'],
          ['Instructions', '4'],
          ['Files', '23'],
          ['Deliverables', '7'],
        ].map(([title, count]) => (
          <div key={title} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">{title}</p>
            <p className="mt-2 text-[22px] font-semibold text-white">{count}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function BridgePreview() {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#06070b]/85 p-5">
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
  );
}
