import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronDown, OctagonAlert, ShieldAlert, Sparkles, X } from 'lucide-react';
import { classifyTaskForBridge } from '../../lib/bridge/bridgeIntake';
import { findScenario } from './state/operatorScenarios';
import { RISK_LABEL } from './state/operatorCopy';
import { CapabilityRow } from './components/primitives/CapabilityRow';

export interface BridgeSetupCardData {
  id: string;
  taskText: string;
  status: 'pending' | 'approved' | 'cancelled';
  sourceConversationId?: string;
}

const ICON_TONE: Record<'permission' | 'ready' | 'risk', string> = {
  permission: 'border-amber-400/25 bg-amber-400/[0.08] text-amber-200',
  ready: 'border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-200',
  risk: 'border-red-400/20 bg-red-400/[0.05] text-red-200',
};

export function BridgeSetupCard({
  data,
  onApprove,
  onCancel,
}: {
  data: BridgeSetupCardData;
  onApprove: () => void;
  onCancel: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const classification = useMemo(() => classifyTaskForBridge(data.taskText), [data.taskText]);
  const scenario = useMemo(() => findScenario(classification.scenarioId), [classification.scenarioId]);
  const sensitive = scenario.requirements.filter((r) => r.status === 'permission_needed' || r.status === 'connection_needed' || r.status === 'installation_needed' || r.status === 'manual_only');
  const restricted = scenario.requirements.filter((r) => r.status === 'restricted' || r.status === 'unsupported');

  const tone =
    data.status === 'approved' ? ICON_TONE.ready
      : data.status === 'cancelled' ? ICON_TONE.risk
        : ICON_TONE.permission;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-2xl rounded-[16px] border border-violet-400/20 bg-[#0c111c]/85 p-4 text-white shadow-[0_18px_60px_rgba(0,0,0,0.35)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border ${tone}`}>
            {data.status === 'approved'
              ? <Check className="h-4 w-4" />
              : data.status === 'cancelled'
                ? <OctagonAlert className="h-4 w-4" />
                : <ShieldAlert className="h-4 w-4" />}
          </span>
          <div className="min-w-0">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-violet-200/75">Colony Bridge Operator</p>
            <h3 className="mt-0.5 font-heading text-[15.5px] font-extrabold leading-tight text-white/95">
              {data.status === 'approved'
                ? 'Task running'
                : data.status === 'cancelled'
                  ? 'Task cancelled'
                  : 'This task needs a controlled digital workspace.'}
            </h3>
            <p className="mt-1 text-[12.5px] leading-relaxed text-white/55">{classification.reason}</p>
          </div>
        </div>
        {data.status === 'pending' && (
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel Bridge setup"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] text-white/40 transition-colors hover:bg-white/[0.05] hover:text-white/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="mt-4 rounded-[12px] border border-white/[0.06] bg-white/[0.02] p-3">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/35">Task</p>
        <p className="mt-1 text-[13px] text-white/82">{data.taskText}</p>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <span className="inline-flex items-center gap-1.5 rounded-[10px] border border-violet-400/20 bg-violet-500/[0.06] px-3 py-2 text-[11.5px] text-violet-100">
          <Sparkles className="h-3.5 w-3.5" />
          Scenario: <span className="font-semibold text-white/95">{scenario.label}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-[10px] border border-amber-400/20 bg-amber-400/[0.04] px-3 py-2 text-[11.5px] text-amber-100">
          <ShieldAlert className="h-3.5 w-3.5" />
          Risk: <span className="font-semibold text-white/95">{RISK_LABEL[scenario.riskLevel]}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-[10px] border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-[11.5px] text-white/55">
          <Check className="h-3.5 w-3.5 text-emerald-300" />
          {scenario.plan.length} planned steps
        </span>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 flex w-full items-center justify-between rounded-[10px] border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[11.5px] font-semibold text-white/65 transition-colors hover:bg-white/[0.04] hover:text-white/90"
      >
        <span>{expanded ? 'Hide plan and access details' : 'Review plan and access details'}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <section className="rounded-[12px] border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/35">Plan</p>
            <ol className="flex flex-col gap-1.5 text-[12px] text-white/72">
              {scenario.plan.map((step, idx) => (
                <li key={step.id} className="flex gap-2.5">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-violet-500/15 text-[10px] font-bold text-violet-200">{idx + 1}</span>
                  <span className="min-w-0 flex-1">{step.label}</span>
                </li>
              ))}
            </ol>
          </section>
          <section className="rounded-[12px] border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/35">Access required</p>
            <div className="flex flex-col divide-y divide-white/[0.04]">
              {scenario.requirements.map((req) => (
                <CapabilityRow key={req.id} capability={req} compact />
              ))}
            </div>
          </section>
        </div>
      )}

      {(sensitive.length > 0 || restricted.length > 0) && data.status === 'pending' && (
        <p className="mt-3 text-[11.5px] text-amber-200/80">
          Sensitive actions (
          {sensitive.map((r) => r.label).join(', ')}
          {restricted.length > 0 ? `, restricted: ${restricted.map((r) => r.label).join(', ')}` : ''}
          ) will pause for your approval or hand back to you.
        </p>
      )}

      {data.status === 'pending' && (
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[10px] border border-white/[0.14] px-4 py-2 text-[12.5px] font-semibold text-white/65 transition-colors hover:bg-white/[0.05] hover:text-white/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="rounded-[10px] border border-white/[0.14] px-4 py-2 text-[12.5px] font-semibold text-white/75 transition-colors hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
          >
            Review plan
          </button>
          <button
            type="button"
            onClick={onApprove}
            className="rounded-[10px] bg-violet-600 px-4 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-300/40"
          >
            Approve &amp; run
          </button>
        </div>
      )}
    </motion.div>
  );
}
