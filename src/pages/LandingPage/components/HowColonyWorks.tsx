import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { MessageSquareText, Network, FileCheck2 } from 'lucide-react';
import { EASE_OUT_EXPO, RevealOnScroll } from './motion';

const STAGES = [
  {
    title: 'Describe the goal',
    copy: 'Tell Colony what you want to accomplish in plain language. No nodes, no triggers, no setup.',
    icon: MessageSquareText,
  },
  {
    title: 'Colony builds the system',
    copy: 'AI Ant matches the right mode, picks specialist agents, and assembles a workflow you can read.',
    icon: Network,
  },
  {
    title: 'Review the result',
    copy: 'Approve, refine, or rerun. Every step stays visible — and risky actions wait for your call.',
    icon: FileCheck2,
  },
];

export function HowColonyWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const lineProgress = useTransform(scrollYProgress, [0.15, 0.85], [0, 1]);

  return (
    <section id="how-it-works" className="px-5 py-28 md:px-8 md:py-36">
      <div className="mx-auto max-w-[1200px]">
        <RevealOnScroll>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#7db7ff]">How It Works</p>
          <h2 className="max-w-3xl text-[34px] font-semibold leading-[1.08] tracking-tight text-white md:text-[52px]">
            One quiet path from goal to deliverable.
          </h2>
          <p className="mt-5 max-w-2xl text-[16px] leading-[1.65] text-white/60 md:text-[17px]">
            Three stages, no scaffolding. Colony handles the structure so you can stay focused on the outcome.
          </p>
        </RevealOnScroll>

        <div ref={sectionRef} className="relative mt-20 grid gap-12 md:gap-16 lg:grid-cols-3">
          {/* Connecting line — desktop only */}
          <div className="pointer-events-none absolute left-0 right-0 top-[88px] hidden lg:block">
            <div className="relative mx-auto h-px max-w-[88%] bg-white/[0.06]">
              <motion.div
                style={{ scaleX: lineProgress, transformOrigin: '0% 50%' }}
                className="absolute inset-0 h-px bg-gradient-to-r from-[#7c5cfc]/60 via-[#7db7ff]/60 to-[#00d4aa]/60"
              />
            </div>
          </div>

          {STAGES.map((stage, idx) => (
            <Stage key={stage.title} index={idx} {...stage} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Stage({
  index,
  title,
  copy,
  icon: Icon,
}: {
  index: number;
  title: string;
  copy: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5, margin: '0px 0px -10% 0px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.85, delay: index * 0.12, ease: EASE_OUT_EXPO }}
      className="relative"
    >
      <motion.div
        animate={{
          borderColor: inView ? 'rgba(125, 183, 255, 0.32)' : 'rgba(255,255,255,0.08)',
          boxShadow: inView
            ? '0 0 0 1px rgba(125,183,255,0.18), 0 30px 80px rgba(0,0,0,0.35)'
            : '0 18px 60px rgba(0,0,0,0.28)',
        }}
        transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
        className="flex h-full flex-col rounded-3xl border bg-white/[0.025] p-7"
      >
        <div className="flex items-center gap-4">
          <motion.div
            animate={{
              backgroundColor: inView ? 'rgba(125,183,255,0.14)' : 'rgba(255,255,255,0.05)',
              color: inView ? '#bcd9ff' : 'rgba(255,255,255,0.78)',
            }}
            transition={{ duration: 0.6 }}
            className="grid h-12 w-12 place-items-center rounded-2xl border border-white/[0.08]"
          >
            <Icon className="h-5 w-5" />
          </motion.div>
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">
            Step {String(index + 1).padStart(2, '0')}
          </span>
        </div>
        <h3 className="mt-7 text-[22px] font-semibold leading-tight tracking-tight text-white md:text-[24px]">{title}</h3>
        <p className="mt-3 text-[14px] leading-[1.7] text-white/60">{copy}</p>

        <StagePreview index={index} active={inView} />
      </motion.div>
    </motion.div>
  );
}

function StagePreview({ index, active }: { index: number; active: boolean }) {
  if (index === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-white/[0.07] bg-[#06070b]/85 px-4 py-3.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">User</p>
        <p className="mt-1.5 text-[13px] leading-6 text-white/82">
          Research my competitors and prepare a launch plan.
        </p>
      </div>
    );
  }
  if (index === 1) {
    return (
      <div className="mt-6 rounded-2xl border border-white/[0.07] bg-[#06070b]/85 px-4 py-3.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Crew</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {['Research', 'Strategy', 'Writer'].map((label, i) => (
            <React.Fragment key={label}>
              <motion.span
                initial={false}
                animate={{ opacity: active ? 1 : 0.4, y: active ? 0 : 6 }}
                transition={{ duration: 0.5, delay: i * 0.12, ease: EASE_OUT_EXPO }}
                className="rounded-full border border-white/[0.1] bg-white/[0.05] px-2.5 py-1 text-[11px] font-medium text-white/80"
              >
                {label}
              </motion.span>
              {i < 2 && <span className="text-white/30">→</span>}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-[#00d4aa]/25 bg-[#00d4aa]/[0.05] px-4 py-3.5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#00d4aa]/85">Deliverable</p>
        <p className="mt-1 text-[13px] font-semibold text-white">Launch Plan ready</p>
      </div>
      <button
        type="button"
        className="rounded-full border border-white/[0.12] bg-white/[0.06] px-3 py-1.5 text-[11px] font-semibold text-white/85"
      >
        Review
      </button>
    </div>
  );
}
