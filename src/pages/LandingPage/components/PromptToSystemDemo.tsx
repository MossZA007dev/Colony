import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Search, BarChart3, FileText, Sparkles, CheckCircle2 } from 'lucide-react';
import { EASE_OUT_EXPO } from './motion';

const PROMPT = 'Research my competitors and prepare a launch plan.';

const AGENTS = [
  { label: 'Research Agent', icon: Search },
  { label: 'Strategy Agent', icon: BarChart3 },
  { label: 'Report Writer', icon: FileText },
];

type Phase = 'typing' | 'understanding' | 'crew' | 'agents' | 'deliverable' | 'reset';

export function PromptToSystemDemo() {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>('typing');
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (reduce) {
      setTyped(PROMPT);
      setPhase('deliverable');
      return;
    }
    let isMounted = true;

    const run = async () => {
      while (isMounted) {
        // Type the prompt
        setPhase('typing');
        setTyped('');
        for (let i = 1; i <= PROMPT.length; i++) {
          await wait(28);
          if (!isMounted) return;
          setTyped(PROMPT.slice(0, i));
        }
        await wait(700);
        if (!isMounted) return;
        setPhase('understanding');
        await wait(1400);
        if (!isMounted) return;
        setPhase('crew');
        await wait(900);
        if (!isMounted) return;
        setPhase('agents');
        await wait(2200);
        if (!isMounted) return;
        setPhase('deliverable');
        await wait(3200);
        if (!isMounted) return;
        setPhase('reset');
        await wait(700);
      }
    };
    run();
    return () => {
      isMounted = false;
    };
  }, [reduce]);

  return (
    <div className="relative mx-auto w-full max-w-[640px]">
      <div className="overflow-hidden rounded-3xl border border-white/[0.09] bg-[#0a0c14]/80 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-6">
        {/* Window chrome */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-white/40">
            <Sparkles className="h-3 w-3 text-white/55" />
            AI Ant
          </div>
        </div>

        {/* Prompt composer */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">Goal</p>
          <p className="mt-2 min-h-[44px] text-[14px] leading-[1.6] text-white/88">
            {typed}
            <motion.span
              className="ml-0.5 inline-block h-[1.05em] w-[2px] -translate-y-[2px] bg-white/70 align-middle"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.85, repeat: Infinity, ease: 'linear' }}
            />
          </p>
        </div>

        {/* Status */}
        <div className="mt-4 flex min-h-[68px] flex-col gap-2">
          <AnimatePresence mode="wait">
            {(phase === 'understanding' || phase === 'typing') && (
              <motion.div
                key="understanding"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                className="flex items-center gap-2.5 text-[13px] text-white/65"
              >
                <DotsLoader />
                <span>Understanding your goal…</span>
              </motion.div>
            )}
            {(phase === 'crew' || phase === 'agents' || phase === 'deliverable' || phase === 'reset') && (
              <motion.div
                key="crew"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
                className="flex items-center gap-2 text-[13px] text-white/85"
              >
                <CheckCircle2 className="h-4 w-4 text-[#7db7ff]" />
                <span>Colony Crew created</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {(phase === 'agents' || phase === 'deliverable' || phase === 'reset') && (
              <motion.div
                key="agents"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-1 flex flex-wrap items-center gap-1.5"
              >
                {AGENTS.map((agent, idx) => (
                  <React.Fragment key={agent.label}>
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.45, delay: idx * 0.18, ease: EASE_OUT_EXPO }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.05] px-2.5 py-1 text-[11px] font-medium text-white/80"
                    >
                      <agent.icon className="h-3 w-3 text-white/70" />
                      {agent.label}
                    </motion.div>
                    {idx < AGENTS.length - 1 && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: idx * 0.18 + 0.12 }}
                        className="text-white/30"
                      >
                        →
                      </motion.span>
                    )}
                  </React.Fragment>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Deliverable */}
        <div className="mt-4 min-h-[68px]">
          <AnimatePresence>
            {(phase === 'deliverable' || phase === 'reset') && (
              <motion.div
                key="deliverable"
                initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                transition={{ duration: 0.65, ease: EASE_OUT_EXPO }}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[#7db7ff]/25 bg-[#7db7ff]/[0.06] px-4 py-3.5"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/8 text-white/85">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-white">Launch Plan</p>
                    <p className="text-[11px] text-white/55">Ready for Review</p>
                  </div>
                </div>
                <span className="rounded-full border border-white/[0.12] bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/75">
                  Deliverable
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function DotsLoader() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-white/70"
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 1.05, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </span>
  );
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
