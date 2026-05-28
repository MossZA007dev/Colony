import { CapabilityRow } from '../primitives/CapabilityRow';
import { TimelineRow, type TimelineStatus } from '../primitives/TimelineRow';
import type { OperatorScenario, OperatorState, TaskStep } from '../../state/operatorTypes';

function planStatusFor(step: TaskStep, state: OperatorState): TimelineStatus {
  if (state === 'completed') return 'complete';
  if (state === 'blocked' && step.status === 'active') return 'blocked';
  return step.status;
}

export function PlanAccessPanel({
  scenario,
  state,
  onResolveCapability,
}: {
  scenario: OperatorScenario;
  state: OperatorState;
  onResolveCapability: () => void;
}) {
  return (
    <aside className="hidden h-full w-[280px] shrink-0 flex-col gap-6 overflow-y-auto border-r border-white/[0.06] bg-[#070b15]/55 px-4 py-5 text-white xl:flex">
      <section>
        <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/35">Task</p>
        <p className="text-[13px] leading-relaxed text-white/78">{scenario.task}</p>
      </section>

      <section>
        <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/35">Plan</p>
        <div className="flex flex-col">
          {scenario.plan.map((step) => (
            <TimelineRow key={step.id} label={step.label} status={planStatusFor(step, state)} />
          ))}
        </div>
      </section>

      <section>
        <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/35">Access</p>
        <div className="flex flex-col divide-y divide-white/[0.04]">
          {scenario.requirements.map((req) => (
            <CapabilityRow
              key={req.id}
              capability={req}
              onActionClick={req.status === 'ready' ? undefined : onResolveCapability}
            />
          ))}
        </div>
      </section>
    </aside>
  );
}
