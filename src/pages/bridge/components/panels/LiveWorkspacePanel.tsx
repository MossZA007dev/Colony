import { AnimatePresence, motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import type { OperatorRuntime, OperatorScenario } from '../../state/operatorTypes';
import { STATE_HEADLINE, STATE_SUBLINE } from '../../state/operatorCopy';
import { WorkspaceRenderer } from '../workspace/WorkspaceRenderer';
import { CompletionReceipt } from '../completion/CompletionReceipt';

function resolvePreview(scenario: OperatorScenario, state: OperatorRuntime['state']) {
  const override = scenario.previewByState?.[state];
  if (override) return override;
  if (state === 'idle' || state === 'analyzing' || state === 'requirements_detected' || state === 'capability_check' || state === 'plan_ready') {
    return { type: 'empty' as const };
  }
  return scenario.preview;
}

function StateBanner({ state, scenario }: { state: OperatorRuntime['state']; scenario: OperatorScenario }) {
  if (state === 'idle' || state === 'analyzing' || state === 'requirements_detected' || state === 'capability_check' || state === 'plan_ready') {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="max-w-xl text-center">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-violet-200/65">{state.replace(/_/g, ' ')}</p>
          <h2 className="mt-2 font-heading text-[22px] font-extrabold leading-tight text-white/95">{STATE_HEADLINE[state]}</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-white/55">{STATE_SUBLINE[state]}</p>
          {state === 'requirements_detected' && (
            <div className="mx-auto mt-6 max-w-md rounded-[14px] border border-white/[0.06] bg-white/[0.02] p-4 text-left">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/35">Goal</p>
              <p className="mt-1 text-[13px] text-white/78">{scenario.task}</p>
            </div>
          )}
          {state === 'plan_ready' && (
            <div className="mx-auto mt-6 max-w-md rounded-[14px] border border-emerald-400/20 bg-emerald-400/[0.05] p-4 text-left">
              <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-emerald-200/85">
                <ShieldAlert className="h-3 w-3" />
                Access scope
              </p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {scenario.requirements.slice(0, 4).map((req) => (
                  <li key={req.id} className="flex items-start justify-between gap-3 text-[12px] text-white/72">
                    <span className="truncate">{req.label}</span>
                    <span className="shrink-0 text-white/45">{req.scope ?? 'Scoped'}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}

export function LiveWorkspacePanel({
  scenario,
  runtime,
}: {
  scenario: OperatorScenario;
  runtime: OperatorRuntime;
}) {
  const { state } = runtime;

  if (state === 'completed' && scenario.deliverable) {
    return (
      <main className="relative flex h-full min-w-0 flex-1 flex-col bg-[#05080f]">
        <div className="flex-1 overflow-y-auto px-5 py-6">
          <CompletionReceipt scenario={scenario} runtime={runtime} />
        </div>
      </main>
    );
  }

  const banner = <StateBanner state={state} scenario={scenario} />;
  const preview = resolvePreview(scenario, state);

  return (
    <main className="relative flex h-full min-w-0 flex-1 flex-col bg-[#05080f]">
      <AnimatePresence mode="wait">
        {banner ? (
          <motion.div
            key={`banner-${state}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="flex h-full flex-col"
          >
            {banner}
          </motion.div>
        ) : (
          <motion.div
            key={`work-${state}-${preview.type}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex h-full flex-col px-5 py-5"
          >
            <WorkspaceRenderer payload={preview} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
