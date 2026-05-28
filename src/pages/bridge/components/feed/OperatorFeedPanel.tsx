import { motion } from 'framer-motion';
import type React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Globe,
  Mail,
  Paperclip,
  ShieldAlert,
  Smartphone,
  Table2,
} from 'lucide-react';
import type {
  OperatorRuntime,
  OperatorScenario,
  OperatorState,
  WorkspacePreviewPayload,
} from '../../state/operatorTypes';
import { STATE_LABEL } from '../../state/operatorCopy';

function previewForState(scenario: OperatorScenario, state: OperatorState): WorkspacePreviewPayload {
  return scenario.previewByState?.[state] ?? scenario.previewByState?.approval_required ?? scenario.preview;
}

function RiskPill({ children, tone = 'neutral' }: { children: string; tone?: 'neutral' | 'green' | 'amber' }) {
  const cls = tone === 'green'
    ? 'border-emerald-300/25 bg-emerald-400/[0.08] text-emerald-100'
    : tone === 'amber'
      ? 'border-amber-300/25 bg-amber-400/[0.08] text-amber-100'
      : 'border-white/[0.10] bg-white/[0.04] text-white/55';
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${cls}`}>{children}</span>;
}

function UserPromptCard({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="flex justify-end"
    >
      <div className="max-w-[560px]">
        <div className="mb-1 flex items-center justify-end gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-violet-200/60">
          <span>You</span>
          <span className="text-white/25">14:01</span>
        </div>
        <div className="rounded-[16px] border border-violet-300/18 bg-violet-500/[0.10] px-4 py-3 text-[13.5px] leading-relaxed text-white/88 shadow-[0_18px_55px_rgba(0,0,0,0.24)]">
          {text}
        </div>
      </div>
    </motion.div>
  );
}

function FollowUpCard({ text, createdAt }: { text: string; createdAt: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="flex justify-end"
    >
      <div className="max-w-[520px] rounded-[14px] border border-violet-300/12 bg-violet-400/[0.055] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-white/72">
        <div className="mb-1 flex items-center justify-between gap-3 text-[9.5px] font-bold uppercase tracking-[0.14em] text-violet-200/45">
          <span>Follow-up</span>
          <span>{new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        {text}
      </div>
    </motion.div>
  );
}

function AssistantMessage({ label, text }: { label: string; text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-start gap-3"
    >
      <span className="mt-6 grid h-8 w-8 shrink-0 place-items-center rounded-[10px] border border-violet-300/18 bg-violet-500/[0.10] text-violet-100">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 4h2.5L8 8l2.5-4H13" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 12h2.5L8 8l2.5 4H13" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <div className="max-w-[640px]">
        <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/42">
          <span>AI Ant</span>
          <span className="text-violet-200/65">{label}</span>
        </div>
        <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.035] px-4 py-3 text-[13.5px] leading-relaxed text-white/78">
          {text}
        </div>
      </div>
    </motion.div>
  );
}

function CapabilitiesCard({ scenario }: { scenario: OperatorScenario }) {
  return (
    <FeedCard icon={<ShieldAlert className="h-4 w-4" />} label="Capabilities" title="Access check">
      <div className="divide-y divide-white/[0.06] rounded-[12px] border border-white/[0.06] bg-white/[0.018]">
        {scenario.requirements.map((req) => (
          <div key={req.id} className="grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-2.5 text-[12px]">
            <span className="text-white/72">{req.label}</span>
            <span className={req.status === 'ready' ? 'text-emerald-200/80' : 'text-amber-200/82'}>
              {req.status === 'ready' ? 'Ready' : req.scope ?? 'Approval required'}
            </span>
          </div>
        ))}
      </div>
    </FeedCard>
  );
}

function FeedCard({
  icon,
  label,
  title,
  badge,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[18px] border border-white/[0.075] bg-[#080d18]/82 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.26)]"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] border border-white/[0.08] bg-white/[0.035] text-white/62">
            {icon}
          </span>
          <span className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">{label}</span>
            <span className="block truncate text-[14px] font-semibold text-white/88">{title}</span>
          </span>
        </div>
        {badge}
      </div>
      {children}
    </motion.div>
  );
}

function ToolActionCard({ scenario, state }: { scenario: OperatorScenario; state: OperatorState }) {
  const preview = previewForState(scenario, state);
  const isBrowser = preview.type === 'browser' || scenario.id === 'web-research';
  const title = isBrowser ? 'Browser action' : preview.type === 'file' ? 'Local file access' : preview.type === 'email_draft' ? 'Connected app action' : preview.type === 'transfer_progress' ? 'Device transfer' : 'Operator action';
  const resource = preview.type === 'browser'
    ? preview.url
    : preview.type === 'file'
      ? preview.fileName
      : preview.type === 'email_draft'
        ? 'Gmail draft'
        : preview.type === 'transfer_progress'
          ? preview.fileName
          : scenario.label;
  const Icon = isBrowser ? Globe : preview.type === 'file' ? FileText : preview.type === 'email_draft' ? Mail : Smartphone;
  const running = state === 'running' || state === 'paused';
  return (
    <FeedCard
      icon={<Icon className="h-4 w-4" />}
      label={title}
      title={resource}
      badge={<RiskPill tone={scenario.riskLevel === 'approval_required' ? 'green' : 'neutral'}>{isBrowser ? 'Read only' : 'Scoped'}</RiskPill>}
    >
      <div className="grid gap-2 text-[12.5px] leading-relaxed text-white/62">
        <p>{isBrowser ? 'Extracting visible pricing information from public pages.' : 'Using only the approved scope for this task.'}</p>
        <div className="flex items-center gap-2 rounded-[11px] border border-emerald-300/14 bg-emerald-400/[0.045] px-3 py-2 text-emerald-100/78">
          <span className={`h-1.5 w-1.5 rounded-full bg-emerald-300 ${running ? 'motion-safe:animate-pulse' : ''}`} />
          {running ? 'Action running in a controlled workspace' : 'Action completed'}
        </div>
      </div>
    </FeedCard>
  );
}

function ResultPreviewCard({ scenario, state }: { scenario: OperatorScenario; state: OperatorState }) {
  const preview = previewForState(scenario, state);
  if (preview.type === 'spreadsheet') {
    return (
      <FeedCard icon={<Table2 className="h-4 w-4" />} label="Extracted data" title={preview.title}>
        <div className="overflow-hidden rounded-[12px] border border-white/[0.07]">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-white/[0.035] text-white/42">
              <tr>{preview.columns.slice(0, 4).map((col) => <th key={col} className="px-3 py-2 font-semibold uppercase tracking-[0.1em]">{col}</th>)}</tr>
            </thead>
            <tbody>
              {preview.rows.slice(0, 4).map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t border-white/[0.05] text-white/74">
                  {row.slice(0, 4).map((cell, cellIndex) => <td key={cellIndex} className="px-3 py-2 tabular-nums">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 text-[12px] text-white/45">
          <span>{preview.rows.length} records prepared from the current task.</span>
          <button type="button" className="rounded-[9px] border border-white/[0.09] px-3 py-1.5 text-[11.5px] font-semibold text-white/62 transition hover:bg-white/[0.05] hover:text-white">View Full Table</button>
        </div>
      </FeedCard>
    );
  }
  if (preview.type === 'browser') {
    return (
      <FeedCard icon={<Table2 className="h-4 w-4" />} label="Extracted data" title={preview.title}>
        <div className="grid gap-2 sm:grid-cols-2">
          {preview.highlights.map((item) => (
            <div key={item.label} className="rounded-[11px] border border-white/[0.06] bg-white/[0.02] px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/32">{item.label}</p>
              <p className="mt-1 text-[13px] font-semibold text-white/78">{item.value}</p>
            </div>
          ))}
        </div>
      </FeedCard>
    );
  }
  return (
    <FeedCard icon={<FileText className="h-4 w-4" />} label="Preview" title={scenario.label}>
      <p className="text-[13px] leading-relaxed text-white/62">
        Output preview is prepared for this scenario and remains inside the Bridge session.
      </p>
    </FeedCard>
  );
}

function ApprovalRequestCard({ scenario, onApprove, onReject }: { scenario: OperatorScenario; onApprove: () => void; onReject: () => void }) {
  const approval = scenario.approval;
  if (!approval) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[18px] border border-amber-300/24 bg-amber-400/[0.055] p-4 shadow-[0_22px_80px_rgba(0,0,0,0.30)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-200/78">Approval required</p>
          <h3 className="mt-1 text-[16px] font-semibold text-amber-50">{approval.title}</h3>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-amber-100/68">{approval.description}</p>
        </div>
        <RiskPill tone="amber">Approval required</RiskPill>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-[12px] border border-amber-200/12 bg-[#090b12]/38 px-3 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-200/50">Destination</p>
          <p className="mt-1 text-[12.5px] font-semibold text-amber-50/88">{approval.destination ?? 'Approved destination'}</p>
        </div>
        <div className="rounded-[12px] border border-amber-200/12 bg-[#090b12]/38 px-3 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-200/50">Data included</p>
          <p className="mt-1 text-[12.5px] text-amber-50/78">{approval.includedData?.join(', ') ?? 'Prepared output data'}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" className="rounded-[10px] border border-amber-200/18 bg-amber-200/[0.06] px-3.5 py-2 text-[12px] font-semibold text-amber-50 transition hover:bg-amber-200/[0.10]">Preview Data</button>
        <button type="button" onClick={onApprove} className="rounded-[10px] bg-amber-200 px-3.5 py-2 text-[12px] font-bold text-[#1d1402] transition hover:bg-amber-100">Approve Save</button>
        <button type="button" onClick={onReject} className="rounded-[10px] border border-white/[0.08] px-3.5 py-2 text-[12px] font-semibold text-white/48 transition hover:bg-white/[0.04] hover:text-white/75">Reject</button>
      </div>
    </motion.div>
  );
}

function DeliverableCard({ scenario }: { scenario: OperatorScenario }) {
  const deliverable = scenario.deliverable;
  if (!deliverable) return null;
  return (
    <FeedCard icon={<CheckCircle2 className="h-4 w-4" />} label="Deliverable ready" title={deliverable.title} badge={<RiskPill tone="green">Complete</RiskPill>}>
      <p className="text-[13px] leading-relaxed text-white/68">{deliverable.description}</p>
      <div className="mt-4 grid gap-2">
        {deliverable.actionsPerformed.slice(0, 4).map((action) => (
          <div key={action} className="flex items-start gap-2 rounded-[10px] border border-white/[0.055] bg-white/[0.02] px-3 py-2 text-[12.5px] text-white/72">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-200" />
            <span>{action}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="rounded-[10px] bg-violet-500 px-3.5 py-2 text-[12px] font-bold text-white transition hover:bg-violet-400">Open Deliverable</button>
        <button type="button" className="rounded-[10px] border border-white/[0.09] px-3.5 py-2 text-[12px] font-semibold text-white/55 transition hover:bg-white/[0.05] hover:text-white">View Activity Log</button>
      </div>
    </FeedCard>
  );
}

function PlanReadyCard({ scenario, onStart }: { scenario: OperatorScenario; onStart: () => void }) {
  return (
    <FeedCard icon={<ArrowRight className="h-4 w-4" />} label="Plan ready" title="Ready to begin controlled execution">
      <p className="text-[13px] leading-relaxed text-white/64">
        I can complete this using the approved scope. External saves, sends, or changes will pause for your approval first.
      </p>
      <button type="button" onClick={onStart} className="mt-4 rounded-[10px] bg-violet-500 px-4 py-2 text-[12px] font-bold text-white transition hover:bg-violet-400">
        Start Task
      </button>
    </FeedCard>
  );
}

export function OperatorFeedPanel({
  scenario,
  runtime,
  onStart,
  onApprove,
  onReject,
}: {
  scenario: OperatorScenario;
  runtime: OperatorRuntime;
  onStart: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const state = runtime.state;
  const taskText = runtime.taskText || scenario.task;
  const isIdle = state === 'idle' && !runtime.taskText;

  if (isIdle) {
    return (
      <div className="flex min-h-full items-center justify-center px-6 py-10">
        <div className="max-w-md text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200/60">Colony Bridge Operator</p>
          <h2 className="mt-2 text-[22px] font-semibold text-white/94">What would you like me to do?</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-white/52">Describe a task involving browser, files, apps, or devices.</p>
        </div>
      </div>
    );
  }

  const assistantText =
    state === 'analyzing'
      ? 'Understanding the request and identifying required tools and permissions.'
      : state === 'capability_check' || state === 'requirements_detected'
        ? 'This task requires scoped access, visible execution, and approval before sensitive external actions.'
        : state === 'plan_ready'
          ? 'I can complete the research using controlled tools and prepare the result for review.'
          : state === 'approval_required'
            ? 'I prepared the output and paused before taking the external save action.'
            : state === 'completed'
              ? 'The approved work is complete and the result is ready.'
              : 'I am working through the task in a visible, approval-first workspace.';

  return (
    <div className="mx-auto flex min-h-full w-full max-w-[880px] flex-col px-5 py-6">
      <div className="mb-6 flex items-start justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200/62">Live Operator Feed</p>
          <p className="mt-1 text-[13px] text-white/46">Task execution is visible and under your control.</p>
        </div>
        <RiskPill tone={state === 'approval_required' ? 'amber' : state === 'completed' ? 'green' : 'neutral'}>
          {STATE_LABEL[state]}
        </RiskPill>
      </div>

      <div className="space-y-4 pb-6">
        <UserPromptCard text={taskText} />
        <AssistantMessage label={STATE_LABEL[state]} text={assistantText} />
        {(state === 'requirements_detected' || state === 'capability_check') && <CapabilitiesCard scenario={scenario} />}
        {state === 'plan_ready' && <PlanReadyCard scenario={scenario} onStart={onStart} />}
        {(state === 'running' || state === 'paused' || state === 'approval_required') && <ToolActionCard scenario={scenario} state={state} />}
        {(state === 'running' || state === 'paused' || state === 'approval_required') && <ResultPreviewCard scenario={scenario} state={state} />}
        {state === 'approval_required' && <ApprovalRequestCard scenario={scenario} onApprove={onApprove} onReject={onReject} />}
        {state === 'completed' && <DeliverableCard scenario={scenario} />}
        {runtime.followUps.map((followUp) => (
          <FollowUpCard key={followUp.id} text={followUp.text} createdAt={followUp.createdAt} />
        ))}
      </div>
    </div>
  );
}
