import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { EASE_OUT_EXPO, RevealOnScroll } from './motion';

type Goal = {
  id: string;
  prompt: string;
  mode: string;
  agents: string[];
  deliverable: string;
};

const GOALS: Goal[] = [
  {
    id: 'competitors',
    prompt: 'Research competitors for my startup',
    mode: 'Colony Crew',
    agents: ['Research Agent', 'Analyst Agent', 'Writer Agent'],
    deliverable: 'Competitor Brief',
  },
  {
    id: 'sales',
    prompt: 'Create a weekly sales reporting workflow',
    mode: 'Automation',
    agents: ['Trigger', 'Read Source', 'Analyze', 'Approval', 'Deliverable'],
    deliverable: 'Weekly Sales Report',
  },
  {
    id: 'content',
    prompt: 'Build an AI content team',
    mode: 'Colony Crew',
    agents: ['Researcher', 'Editor', 'Writer', 'Reviewer'],
    deliverable: 'Editorial Workflow',
  },
  {
    id: 'files',
    prompt: 'Summarize files into a report',
    mode: 'Chat + AI Ant',
    agents: ['File Reader', 'Summarizer', 'Writer'],
    deliverable: 'Combined Summary',
  },
  {
    id: 'enterprise',
    prompt: 'Organize an AI company for my project',
    mode: 'One-man Enterprise',
    agents: ['Director', 'Project Manager', 'Specialists'],
    deliverable: 'AI Org Chart',
  },
];

type Phase = 'idle' | 'processing' | 'mode' | 'agents' | 'deliverable';

export function TryAGoal() {
  const [activeId, setActiveId] = useState<string>(GOALS[0].id);
  const [phase, setPhase] = useState<Phase>('idle');
  const reduce = useReducedMotion();

  const active = GOALS.find((g) => g.id === activeId)!;

  useEffect(() => {
    if (reduce) {
      setPhase('deliverable');
      return;
    }
    let alive = true;
    setPhase('processing');
    const t1 = setTimeout(() => alive && setPhase('mode'), 900);
    const t2 = setTimeout(() => alive && setPhase('agents'), 1600);
    const t3 = setTimeout(() => alive && setPhase('deliverable'), 2400 + active.agents.length * 140);
    return () => {
      alive = false;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [activeId, active.agents.length, reduce]);

  return (
    <section id="try-a-goal" className="px-5 py-28 md:px-8 md:py-36">
      <div className="mx-auto max-w-[1200px]">
        <RevealOnScroll>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#00d4aa]">Try a goal</p>
          <h2 className="max-w-3xl text-[34px] font-semibold leading-[1.08] tracking-tight text-white md:text-[52px]">
            Describe a goal. See what Colony builds.
          </h2>
          <p className="mt-5 max-w-2xl text-[16px] leading-[1.65] text-white/60 md:text-[17px]">
            Pick an example below. We&apos;ll show the mode Colony would pick, the agents it would assemble, and the deliverable it would prepare.
          </p>
        </RevealOnScroll>

        <RevealOnScroll className="mt-12" delay={0.1}>
          <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
            {/* Goal selector */}
            <div className="flex flex-col gap-2">
              {GOALS.map((g) => {
                const isActive = g.id === activeId;
                return (
                  <button
                    key={g.id}
                    onClick={() => setActiveId(g.id)}
                    className={`group relative flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all duration-300 ${
                      isActive
                        ? 'border-white/[0.16] bg-white/[0.06] shadow-[0_18px_50px_rgba(0,0,0,0.35)]'
                        : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={`grid h-7 w-7 place-items-center rounded-lg border text-[11px] font-semibold ${
                        isActive ? 'border-white/[0.16] bg-white/[0.08] text-white' : 'border-white/[0.06] bg-white/[0.02] text-white/55'
                      }`}>
                        <Sparkles className="h-3.5 w-3.5" />
                      </span>
                      <span className={`text-[14px] font-medium ${isActive ? 'text-white' : 'text-white/75'}`}>
                        {g.prompt}
                      </span>
                    </span>
                    <ArrowRight className={`h-4 w-4 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-white/30 group-hover:text-white/60'}`} />
                  </button>
                );
              })}
            </div>

            {/* Demo stage */}
            <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-5 shadow-[0_40px_120px_rgba(0,0,0,0.45)] md:p-7">
              <div className="absolute inset-0 -z-0 overflow-hidden" aria-hidden>
                <div
                  className="absolute left-1/2 top-0 h-[60%] w-[80%] -translate-x-1/2 rounded-full"
                  style={{ background: 'radial-gradient(circle, rgba(124,92,252,0.14) 0%, transparent 65%)', filter: 'blur(60px)' }}
                />
              </div>

              <div className="relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeId}
                    initial={reduce ? false : { opacity: 0, y: 14, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={reduce ? undefined : { opacity: 0, y: -8, filter: 'blur(6px)' }}
                    transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Composer</p>
                    <div className="mt-2 rounded-2xl border border-white/[0.08] bg-[#06070b]/85 px-4 py-3.5">
                      <p className="text-[14px] leading-7 text-white/90">{active.prompt}</p>
                    </div>

                    {/* Processing */}
                    <div className="mt-5 min-h-[28px]">
                      <AnimatePresence>
                        {phase === 'processing' && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2 text-[12px] text-white/55"
                          >
                            <span className="inline-flex items-center gap-1">
                              {[0, 1, 2].map((i) => (
                                <motion.span
                                  key={i}
                                  className="h-1.5 w-1.5 rounded-full bg-white/55"
                                  animate={{ opacity: [0.25, 1, 0.25] }}
                                  transition={{ duration: 1, delay: i * 0.15, repeat: Infinity }}
                                />
                              ))}
                            </span>
                            AI Ant is choosing the best path…
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Mode chip */}
                    <div className="min-h-[44px]">
                      <AnimatePresence>
                        {(phase === 'mode' || phase === 'agents' || phase === 'deliverable') && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
                            className="inline-flex items-center gap-2 rounded-full border border-[#7db7ff]/30 bg-[#7db7ff]/10 px-3 py-1.5 text-[12px] font-semibold text-[#bcd9ff]"
                          >
                            Mode · {active.mode}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Agents */}
                    <div className="mt-3 min-h-[60px]">
                      <AnimatePresence>
                        {(phase === 'agents' || phase === 'deliverable') && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-wrap items-center gap-1.5"
                          >
                            {active.agents.map((agent, idx) => (
                              <React.Fragment key={agent}>
                                <motion.span
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.45, delay: idx * 0.12, ease: EASE_OUT_EXPO }}
                                  className="rounded-full border border-white/[0.1] bg-white/[0.05] px-2.5 py-1 text-[11px] font-medium text-white/85"
                                >
                                  {agent}
                                </motion.span>
                                {idx < active.agents.length - 1 && (
                                  <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: idx * 0.12 + 0.08 }}
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
                    <div className="mt-5 min-h-[80px]">
                      <AnimatePresence>
                        {phase === 'deliverable' && (
                          <motion.div
                            initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-[#00d4aa]/30 bg-[#00d4aa]/[0.06] px-4 py-3.5"
                          >
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#00d4aa]/80">Deliverable</p>
                              <p className="mt-1 text-[14px] font-semibold text-white">{active.deliverable}</p>
                            </div>
                            <span className="rounded-full border border-white/[0.14] bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/75">
                              Ready for review
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
          <p className="mt-5 text-[12px] text-white/35">
            Interactive demo — no AI calls are made on the landing page.
          </p>
        </RevealOnScroll>
      </div>
    </section>
  );
}
