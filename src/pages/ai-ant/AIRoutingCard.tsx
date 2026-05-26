import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import {
  CAPABILITY_LABELS,
  EXPENSIVE_CAPABILITIES,
  type RoutingDecision,
} from '../../lib/aiOrchestration';

// ─── Local types ────────────────────────────────────────────────────────────

type ModelRoutingPreference =
  | 'auto'
  | 'fast'
  | 'balanced'
  | 'best_quality'
  | 'low_cost'
  | 'manual';

// ─── Mode label maps ─────────────────────────────────────────────────────────

const MODE_DELIVERABLE: Record<string, string> = {
  chat: 'Chat response',
  simple_chat: 'Chat response',
  agent: 'Task result',
  crew: 'Team deliverable',
  colony_crew: 'Team deliverable',
  workflow: 'Automation run',
  deep_research: 'Research report',
  device: 'Device action',
  one_man_enterprise: 'Operational plan',
};

const MODE_NEXT_STEP: Record<string, string> = {
  chat: 'Answer directly',
  simple_chat: 'Answer directly',
  agent: 'Run agent task',
  crew: 'Assemble crew',
  colony_crew: 'Assemble crew',
  workflow: 'Build automation',
  deep_research: 'Plan research',
  device: 'Plan device actions',
  one_man_enterprise: 'Plan operations',
};

const MODE_DISPLAY: Record<string, string> = {
  chat: 'Simple Chat',
  simple_chat: 'Simple Chat',
  agent: 'Agent',
  crew: 'Colony Crew',
  colony_crew: 'Colony Crew',
  workflow: 'Workflow',
  deep_research: 'Deep Research',
  device: 'Device',
  one_man_enterprise: 'One-man Enterprise',
};

const MODE_HINT: Record<string, string> = {
  chat: 'This looks like a normal question or explanation.',
  simple_chat: 'This looks like a normal question or explanation.',
  agent: 'A single agent can handle this task end-to-end.',
  crew: 'A specialist team is the best fit for this goal.',
  colony_crew: 'A specialist team is the best fit for this goal.',
  workflow: 'This is a repeatable process worth automating.',
  deep_research: 'This needs structured research with sources.',
  device: 'This involves actions across your apps or files.',
  one_man_enterprise: 'This operates like a small business or org.',
};

const MODEL_ROUTING_OPTIONS: Array<{
  value: ModelRoutingPreference;
  shortLabel: string;
}> = [
  { value: 'auto', shortLabel: 'Auto' },
  { value: 'fast', shortLabel: 'Fast' },
  { value: 'balanced', shortLabel: 'Balanced' },
  { value: 'best_quality', shortLabel: 'Best Quality' },
];

function modelRoutingLabel(value: ModelRoutingPreference) {
  return MODEL_ROUTING_OPTIONS.find((o) => o.value === value)?.shortLabel ?? 'Auto';
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function MetaPill({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'good' | 'warn';
}) {
  const toneCls =
    tone === 'good'
      ? 'border-emerald-300/18 bg-emerald-400/[0.06] text-emerald-100/90'
      : tone === 'warn'
      ? 'border-amber-300/20 bg-amber-400/[0.06] text-amber-100/90'
      : 'border-white/[0.10] bg-white/[0.035] text-white/72';
  return (
    <motion.span
      variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-semibold ${toneCls}`}
    >
      <span className="text-white/40">{label}</span>
      <span>{value}</span>
    </motion.span>
  );
}

function NextLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-white/35">
        {label}
      </span>
      <span className="text-[13.5px] font-semibold text-white/85">{value}</span>
    </div>
  );
}

function DetailRow({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <>
      <dt className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-white/38">
        {label}
      </dt>
      <dd className={`text-[12.5px] text-white/78 ${multiline ? 'leading-relaxed' : ''}`}>
        {value}
      </dd>
    </>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export type AIRoutingCardProps = {
  routing: RoutingDecision;
  onStart: () => void;
  onCustomize: () => void;
  onCheaper: () => void;
  onQuality: () => void;
  onChangeMode?: () => void;
  onDismiss?: () => void;
};

export function AIRoutingCard({
  routing,
  onStart,
  onCustomize,
  onCheaper,
  onQuality,
  onChangeMode,
  onDismiss,
}: AIRoutingCardProps) {
  const [expanded, setExpanded] = React.useState(false);

  const expensiveRoutes = routing.modelRoutes.filter(
    (route) => route.costTier === 'high' || EXPENSIVE_CAPABILITIES.includes(route.capability),
  );
  const backend = routing.backend;

  const modeKey = routing.resolvedMode.toLowerCase();
  const modeName = MODE_DISPLAY[modeKey] ?? routing.resolvedMode.replace(/_/g, ' ');
  const modeHint = MODE_HINT[modeKey] ?? `AI Ant will handle this as ${modeName}.`;
  const nextStep = MODE_NEXT_STEP[modeKey] ?? 'Continue';
  const deliverable = MODE_DELIVERABLE[modeKey] ?? 'AI Ant response';

  const primaryModel =
    routing.manualModelSelection?.modelId ?? routing.modelRoutes[0]?.displayName ?? 'Auto';
  const routingStyle = routing.modelRoutingPreference
    ? modelRoutingLabel(routing.modelRoutingPreference as ModelRoutingPreference)
    : 'Auto';
  const confidencePct = Math.round(routing.confidence * 100);
  const approval = expensiveRoutes.length > 0 ? 'Required' : 'None';
  const primaryAgent = routing.selectedAgents[0];
  const primaryCapability = routing.requiredCapabilities[0]
    ? CAPABILITY_LABELS[routing.requiredCapabilities[0]]
    : 'Text reasoning';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-2xl overflow-hidden rounded-[22px] border border-white/[0.09] bg-[#0a0f1a]/95 shadow-[0_28px_90px_rgba(0,0,0,0.45)]"
    >
      {/* Header */}
      <div className="px-6 pb-5 pt-5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200/65">
            AI Ant Decision
          </p>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="grid h-6 w-6 place-items-center rounded-full text-white/30 transition hover:bg-white/[0.06] hover:text-white/70"
              aria-label="Dismiss"
            >
              ✕
            </button>
          )}
        </div>

        <h3 className="mt-2 font-heading text-[26px] font-extrabold leading-tight text-white">
          {modeName}
        </h3>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/52">{modeHint}</p>

        {/* Meta pills */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.05, delayChildren: 0.15 } },
          }}
          className="mt-5 flex flex-wrap gap-1.5"
        >
          <MetaPill label="Model" value={primaryModel} />
          <MetaPill label="Routing" value={routingStyle} />
          <MetaPill
            label="Confidence"
            value={`${confidencePct}%`}
            tone={confidencePct >= 80 ? 'good' : confidencePct >= 60 ? 'neutral' : 'warn'}
          />
          <MetaPill
            label="Approval"
            value={approval}
            tone={approval === 'None' ? 'good' : 'warn'}
          />
        </motion.div>

        {/* Next step / Deliverable */}
        <div className="mt-5 grid gap-2 rounded-[14px] border border-white/[0.06] bg-white/[0.02] p-4 sm:grid-cols-2">
          <NextLine label="Next step" value={nextStep} />
          <NextLine label="Deliverable" value={deliverable} />
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] bg-white/[0.015] px-6 py-3.5">
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          style={{ backgroundColor: '#F5F6F8', color: '#0A0D14' }}
          className="rounded-full px-4 py-2 text-[13px] font-bold transition hover:!bg-white hover:shadow-[0_6px_22px_rgba(245,246,248,0.22)]"
        >
          Continue
        </motion.button>

        {onChangeMode && (
          <button
            onClick={onChangeMode}
            style={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderColor: 'rgba(148,163,184,0.20)',
              color: 'rgba(241,245,249,0.88)',
            }}
            className="rounded-full border px-3.5 py-2 text-[12.5px] font-semibold transition hover:!bg-white/[0.06] hover:!border-[rgba(148,163,184,0.32)]"
          >
            Change mode
          </button>
        )}

        <button
          onClick={onCustomize}
          style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderColor: 'rgba(148,163,184,0.20)',
            color: 'rgba(241,245,249,0.88)',
          }}
          className="rounded-full border px-3.5 py-2 text-[12.5px] font-semibold transition hover:!bg-white/[0.06] hover:!border-[rgba(148,163,184,0.32)]"
        >
          Change model
        </button>

        <button
          onClick={() => setExpanded((v) => !v)}
          style={{ color: 'rgba(226,232,240,0.78)' }}
          className="ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-2 text-[12px] font-semibold transition hover:!text-white"
          aria-expanded={expanded}
        >
          <span>{expanded ? 'Hide routing details' : 'View routing details'}</span>
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="grid place-items-center"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </motion.span>
        </button>
      </div>

      {/* Expanded advanced section */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="advanced"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-white/[0.06]"
          >
            <div className="space-y-5 px-6 pb-6 pt-5">
              {/* Advanced details */}
              <section>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                  Advanced details
                </p>
                <dl className="mt-3 grid gap-y-2 gap-x-4 text-[12.5px] sm:grid-cols-[auto_1fr]">
                  <DetailRow label="Agent" value={primaryAgent?.name ?? 'AI Ant'} />
                  <DetailRow label="Capability" value={primaryCapability} />
                  <DetailRow
                    label="Auto routing"
                    value={`${routing.selectedMode === 'auto' ? 'Auto' : routing.selectedMode.replace(/_/g, ' ')} → ${primaryModel}`}
                  />
                  <DetailRow
                    label="Required capability"
                    value={
                      routing.requiredCapabilities.map((c) => CAPABILITY_LABELS[c]).join(', ') ||
                      primaryCapability
                    }
                  />
                  <DetailRow label="Detailed reason" value={routing.reason} multiline />
                </dl>
              </section>

              {/* Model routing table */}
              {routing.modelRoutes.length > 1 && (
                <section>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                    Model routing
                  </p>
                  <div className="mt-2 space-y-1">
                    {routing.modelRoutes.map((route) => (
                      <div
                        key={route.capability}
                        className="flex items-center justify-between gap-3 text-[12px]"
                      >
                        <span className="text-white/52">{CAPABILITY_LABELS[route.capability]}</span>
                        <span className="font-semibold text-white/82">
                          {route.providerMode === 'auto' ? 'Auto' : 'Manual'} → {route.displayName}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Cost preview */}
              {expensiveRoutes.length > 0 && (
                <section className="rounded-[12px] border border-amber-300/15 bg-amber-400/[0.04] px-3.5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-200/75">
                        Cost preview
                      </p>
                      <p className="mt-1 text-[12px] text-white/55">
                        Generation may use more credits.
                      </p>
                    </div>
                    <p className="text-[12px] font-bold text-amber-200">
                      ~{routing.estimatedCredits} credits
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <button
                      onClick={onCheaper}
                      className="rounded-full border border-emerald-300/18 bg-emerald-400/[0.07] px-3 py-1.5 text-[11.5px] font-semibold text-emerald-100/90 transition hover:bg-emerald-400/[0.12]"
                    >
                      Use cheaper models
                    </button>
                    <button
                      onClick={onQuality}
                      className="rounded-full border border-amber-300/18 bg-amber-400/[0.07] px-3 py-1.5 text-[11.5px] font-semibold text-amber-100/90 transition hover:bg-amber-400/[0.12]"
                    >
                      Use highest quality
                    </button>
                  </div>
                </section>
              )}

              {/* Backend usage */}
              {backend?.usage && (
                <section>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                    Backend usage
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-white/65">
                    <span>
                      Input{' '}
                      <span className="font-semibold text-white/85">{backend.usage.inputTokens}</span>
                    </span>
                    <span>
                      Output{' '}
                      <span className="font-semibold text-white/85">{backend.usage.outputTokens}</span>
                    </span>
                    <span>
                      Est. cost{' '}
                      <span className="font-semibold text-white/85">
                        ${backend.usage.estimatedCostUsd.toFixed(6)}
                      </span>
                    </span>
                  </div>
                </section>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
