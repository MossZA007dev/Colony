/**
 * BossIntake — 3-step intake flow before the Enterprise Workspace.
 *
 * Step 1: Business idea
 * Step 2: Target customer
 * Step 3: First objective
 * Loading: AI is assembling the team
 * Result: Generated team (editable) → onStart(agents)
 */
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Building2, Check, ChevronRight, Loader2, Sparkles, X } from 'lucide-react';
import { runBossIntake, type AgentTemplate } from '../../lib/enterprise/intakeApi';
import type { EnterpriseAgent } from './oneManEnterprise';
import { enterpriseAvatarForAgent, enterpriseCodeForAgent } from './oneManEnterprise';

// ── Types ─────────────────────────────────────────────────────────────────────

type Stage = 'q1' | 'q2' | 'q3' | 'loading' | 'team';

type Answers = {
  businessIdea: string;
  targetCustomer: string;
  firstObjective: string;
};

type GeneratedTeam = {
  projectId: string;
  projectTitle: string;
  businessType: string;
  teamRationale: string;
  agents: EnterpriseAgent[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function templateToAgent(t: AgentTemplate, index: number): EnterpriseAgent {
  const agent: EnterpriseAgent = {
    id: `intake-agent-${index}-${Date.now()}`,
    name: t.name,
    role: t.role,
    dept: t.dept,
    taskSummary: t.first_task,
  };
  return agent;
}

// ── Sub-components ────────────────────────────────────────────────────────────

const QUESTIONS: Array<{ stage: Stage; label: string; placeholder: string; hint: string }> = [
  {
    stage: 'q1',
    label: "What's your business idea?",
    placeholder: 'e.g. I sell premium coffee online, I run a design agency, I build a SaaS tool for HR teams…',
    hint: 'Be specific — AI Ant uses this to pick the right roles.',
  },
  {
    stage: 'q2',
    label: "Who's your target customer?",
    placeholder: 'e.g. busy professionals aged 25-40, B2B SaaS teams with 10-50 people, indie creators…',
    hint: 'The more specific, the better the team is tuned to your market.',
  },
  {
    stage: 'q3',
    label: 'What should the team tackle first?',
    placeholder: 'e.g. launch a marketing strategy, build the MVP roadmap, write the first content calendar…',
    hint: "This becomes the Director's first objective.",
  },
];

function QuestionStep({
  q,
  value,
  onChange,
  onNext,
  onBack,
  stepIndex,
  total,
}: {
  q: (typeof QUESTIONS)[number];
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
  onBack?: () => void;
  stepIndex: number;
  total: number;
}) {
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 120);
  }, []);

  const canNext = value.trim().length >= 3;

  const handleKey = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' && (e.metaKey || e.ctrlKey)) || (e.key === 'Enter' && !e.shiftKey && value.trim().length >= 3)) {
      e.preventDefault();
      if (canNext) onNext();
    }
  };

  return (
    <motion.div
      key={q.stage}
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -32 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="mx-auto w-full max-w-xl"
    >
      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i < stepIndex ? 'bg-violet-400 w-6' : i === stepIndex ? 'bg-violet-300 w-8' : 'bg-white/10 w-4'
            }`}
          />
        ))}
        <span className="ml-2 text-[11px] font-semibold text-white/30">{stepIndex + 1} / {total}</span>
      </div>

      {/* Question */}
      <h3 className="font-heading text-2xl font-extrabold leading-tight text-white">{q.label}</h3>
      <p className="mt-1.5 text-sm text-white/40">{q.hint}</p>

      {/* Input */}
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder={q.placeholder}
        rows={3}
        className="mt-5 w-full resize-none rounded-[16px] border border-white/[0.10] bg-white/[0.04] px-4 py-3.5 text-sm leading-relaxed text-white placeholder-white/20 outline-none transition focus:border-violet-400/50 focus:bg-white/[0.06]"
      />

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between">
        {onBack ? (
          <button
            onClick={onBack}
            className="rounded-xl border border-white/[0.12] px-4 py-2 text-sm font-semibold text-white/50 transition hover:text-white"
          >
            Back
          </button>
        ) : (
          <span />
        )}
        <button
          onClick={onNext}
          disabled={!canNext}
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-violet-500 disabled:opacity-35"
        >
          {stepIndex === total - 1 ? 'Build my team' : 'Next'}
          <ChevronRight size={15} />
        </button>
      </div>
    </motion.div>
  );
}

function LoadingScreen({ businessIdea }: { businessIdea: string }) {
  const [dotIndex, setDotIndex] = React.useState(0);
  const steps = [
    'Understanding your business context…',
    'Identifying the roles you need most…',
    'Assigning agent responsibilities…',
    'Matching models to each role…',
    'Preparing your workspace…',
  ];

  React.useEffect(() => {
    const timer = setInterval(() => setDotIndex((i) => (i + 1) % steps.length), 900);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mx-auto flex w-full max-w-sm flex-col items-center pt-8 text-center"
    >
      <span className="relative mb-5 grid h-16 w-16 place-items-center rounded-[22px] border border-violet-400/30 bg-violet-500/15">
        <Sparkles className="h-7 w-7 text-violet-300" />
        <span className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-violet-400" />
      </span>
      <p className="font-heading text-lg font-extrabold text-white">Assembling your team</p>
      <p className="mt-1 text-sm text-white/40">"{businessIdea.slice(0, 60)}{businessIdea.length > 60 ? '…' : ''}"</p>
      <div className="mt-7 h-12">
        <AnimatePresence mode="wait">
          <motion.p
            key={dotIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="text-sm text-violet-200/70"
          >
            {steps[dotIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
      <Loader2 className="mt-6 h-5 w-5 animate-spin text-white/25" />
    </motion.div>
  );
}

function TeamPreview({
  team,
  onEdit,
  onStart,
}: {
  team: GeneratedTeam;
  onEdit: () => void;
  onStart: (agents: EnterpriseAgent[]) => void;
}) {
  const [agents, setAgents] = React.useState<EnterpriseAgent[]>(team.agents);

  const rename = (id: string, name: string) =>
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, name } : a)));

  const removeAgent = (id: string) =>
    setAgents((prev) => prev.filter((a) => a.id !== id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto w-full max-w-4xl"
    >
      {/* Header */}
      <div className="mb-2 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-200">
              Team ready
            </span>
            <span className="text-[11px] text-white/30">{team.businessType}</span>
          </div>
          <h3 className="mt-1.5 font-heading text-xl font-extrabold text-white">{team.projectTitle}</h3>
          <p className="mt-0.5 text-sm text-white/40">{team.teamRationale}</p>
        </div>
      </div>

      {/* Agent grid */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {agents.map((agent) => (
          <motion.div
            key={agent.id}
            layout
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.18 }}
            className="group rounded-[16px] border border-white/[0.08] bg-white/[0.03] p-4 transition hover:border-white/[0.14] hover:bg-white/[0.05]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-[12px] border border-white/[0.10] bg-[#f4f4f8]">
                  <img src={enterpriseAvatarForAgent(agent)} alt="" draggable={false} className="h-full w-full object-cover" />
                </span>
                <span>
                  <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-300">
                    {agent.dept}
                  </span>
                  <span className="ml-1 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-bold text-white/38">
                    {enterpriseCodeForAgent(agent)}
                  </span>
                </span>
              </div>
              <button
                onClick={() => removeAgent(agent.id)}
                className="mt-0.5 rounded-md p-1 text-white/20 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
              >
                <X size={11} />
              </button>
            </div>
            <input
              value={agent.name}
              onChange={(e) => rename(agent.id, e.target.value)}
              className="mt-2.5 w-full bg-transparent font-heading text-sm font-extrabold text-white outline-none"
            />
            <p className="mt-0.5 text-[11px] text-white/42">{agent.role}</p>
            {agent.taskSummary && (
              <p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-white/28">
                ↳ {agent.taskSummary}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          onClick={onEdit}
          className="rounded-xl border border-white/[0.14] px-4 py-2.5 text-sm font-semibold text-white/55 transition hover:bg-white/[0.06] hover:text-white"
        >
          ← Edit answers
        </button>
        <button
          onClick={() => onStart(agents)}
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-violet-500"
        >
          <ArrowRight size={15} />
          Start working
        </button>
      </div>
    </motion.div>
  );
}

// ── Main BossIntake Component ─────────────────────────────────────────────────

export function BossIntake({
  onClose,
  onStart,
}: {
  onClose: () => void;
  onStart: (agents: EnterpriseAgent[], projectTitle: string) => void;
}) {
  const [stage, setStage] = React.useState<Stage>('q1');
  const [answers, setAnswers] = React.useState<Answers>({
    businessIdea: '',
    targetCustomer: '',
    firstObjective: '',
  });
  const [team, setTeam] = React.useState<GeneratedTeam | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const setAnswer = (key: keyof Answers) => (value: string) =>
    setAnswers((prev) => ({ ...prev, [key]: value }));

  const generateTeam = async () => {
    setStage('loading');
    setError(null);
    try {
      const result = await runBossIntake({
        business_idea: answers.businessIdea,
        target_customer: answers.targetCustomer,
        first_objective: answers.firstObjective,
      });
      const agents = result.agents.map(templateToAgent);
      setTeam({
        projectId: result.project_id,
        projectTitle: result.project_title,
        businessType: result.business_type,
        teamRationale: result.team_rationale,
        agents,
      });
      setStage('team');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setStage('q3');
    }
  };

  const handleStart = (agents: EnterpriseAgent[]) => {
    onStart(agents, team?.projectTitle ?? answers.businessIdea);
  };

  const stepIndex = stage === 'q1' ? 0 : stage === 'q2' ? 1 : stage === 'q3' ? 2 : 2;
  const total = 3;

  return (
    <div className="fixed inset-0 z-[210] flex flex-col bg-[#070710]/96 backdrop-blur-xl">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-6 py-4">
        <div className="flex items-center gap-2.5">
          <Building2 className="h-5 w-5 text-violet-300" />
          <h2 className="font-heading text-lg font-extrabold text-white">One-man Enterprise</h2>
          {stage === 'team' && team && (
            <span className="ml-2 flex items-center gap-1 rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-200">
              <Check size={10} />
              Team ready
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-white/40 transition hover:bg-white/[0.08] hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      {/* Body */}
      <div className="flex flex-1 items-start justify-center overflow-y-auto px-6 py-12">
        <div className="w-full">
          <AnimatePresence mode="wait">
            {stage === 'q1' && (
              <QuestionStep
                key="q1"
                q={QUESTIONS[0]}
                value={answers.businessIdea}
                onChange={setAnswer('businessIdea')}
                onNext={() => setStage('q2')}
                stepIndex={0}
                total={total}
              />
            )}
            {stage === 'q2' && (
              <QuestionStep
                key="q2"
                q={QUESTIONS[1]}
                value={answers.targetCustomer}
                onChange={setAnswer('targetCustomer')}
                onNext={() => setStage('q3')}
                onBack={() => setStage('q1')}
                stepIndex={1}
                total={total}
              />
            )}
            {stage === 'q3' && (
              <motion.div key="q3" initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }} transition={{ duration: 0.22 }}>
                <QuestionStep
                  q={QUESTIONS[2]}
                  value={answers.firstObjective}
                  onChange={setAnswer('firstObjective')}
                  onNext={generateTeam}
                  onBack={() => setStage('q2')}
                  stepIndex={2}
                  total={total}
                />
                {error && (
                  <p className="mx-auto mt-4 max-w-xl rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2.5 text-center text-sm text-red-200">
                    {error}
                  </p>
                )}
              </motion.div>
            )}
            {stage === 'loading' && (
              <LoadingScreen key="loading" businessIdea={answers.businessIdea} />
            )}
            {stage === 'team' && team && (
              <TeamPreview
                key="team"
                team={team}
                onEdit={() => setStage('q3')}
                onStart={handleStart}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
