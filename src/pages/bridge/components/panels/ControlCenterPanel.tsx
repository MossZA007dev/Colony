import { Check, Pause, Play, ShieldCheck, Square, X } from 'lucide-react';
import { TimelineRow, type TimelineStatus } from '../primitives/TimelineRow';
import type { OperatorRuntime, OperatorScenario, OperatorState } from '../../state/operatorTypes';

function eventStatusFor(eventStatus: TimelineStatus, state: OperatorState): TimelineStatus {
  if (state === 'completed' && eventStatus !== 'blocked') return 'complete';
  if (state === 'blocked' && eventStatus === 'active') return 'blocked';
  if (state === 'paused' && eventStatus === 'active') return 'waiting';
  return eventStatus;
}

export function ControlCenterPanel({
  scenario,
  runtime,
  onPause,
  onResume,
  onStop,
  onOpenApproval,
}: {
  scenario: OperatorScenario;
  runtime: OperatorRuntime;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onOpenApproval: () => void;
}) {
  const { state } = runtime;
  const approvalPending = state === 'approval_required' && Boolean(scenario.approval);
  const stopped = state === 'completed' || state === 'failed' || state === 'blocked';

  return (
    <aside className="hidden h-full w-[300px] shrink-0 flex-col gap-6 overflow-y-auto border-l border-white/[0.06] bg-[#070b15]/55 px-4 py-5 text-white lg:flex">
      <section>
        <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/35">Activity</p>
        <div className="flex flex-col">
          {scenario.activities.map((event) => (
            <TimelineRow
              key={event.id}
              label={event.label}
              status={eventStatusFor(event.status, state)}
              meta={event.time === '—' ? undefined : event.time}
            />
          ))}
        </div>
      </section>

      <section>
        <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/35">Permission scope</p>
        <ul className="flex flex-col gap-1.5 text-[12px] text-white/72">
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
            <span>Reads only the resources you approved</span>
          </li>
          <li className="flex items-start gap-2">
            <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-300" />
            <span>Does not send external messages without approval</span>
          </li>
          <li className="flex items-start gap-2">
            <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-300" />
            <span>Does not modify files outside the approved scope</span>
          </li>
        </ul>
      </section>

      <section>
        <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/35">Approval queue</p>
        {approvalPending ? (
          <button
            type="button"
            onClick={onOpenApproval}
            className="group relative w-full overflow-hidden rounded-[12px] border border-amber-400/30 bg-amber-400/[0.06] px-3 py-3 text-left text-amber-100 transition-colors hover:bg-amber-400/[0.12] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-300/40"
          >
            <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-amber-200/85">
              <ShieldCheck className="h-3.5 w-3.5" />
              Action waiting
            </span>
            <span className="mt-1 block text-[12.5px] font-semibold leading-snug text-amber-50">{scenario.approval?.title}</span>
            <span className="mt-1 block text-[11px] text-amber-100/70">Open to review what will happen.</span>
          </button>
        ) : (
          <p className="text-[12px] text-white/40">No actions currently waiting.</p>
        )}
      </section>

      <section className="mt-auto flex flex-col gap-2 border-t border-white/[0.06] pt-4">
        {state === 'paused' ? (
          <button
            type="button"
            onClick={onResume}
            disabled={stopped}
            className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-emerald-400/25 bg-emerald-400/[0.08] px-3 py-2 text-[12.5px] font-semibold text-emerald-100 transition-colors hover:bg-emerald-400/[0.14] disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5" /> Resume
          </button>
        ) : (
          <button
            type="button"
            onClick={onPause}
            disabled={state !== 'running'}
            className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-white/[0.12] bg-white/[0.04] px-3 py-2 text-[12.5px] font-semibold text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
          >
            <Pause className="h-3.5 w-3.5" /> Pause
          </button>
        )}
        <button
          type="button"
          onClick={onStop}
          disabled={stopped}
          className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-red-400/25 bg-red-400/[0.05] px-3 py-2 text-[12.5px] font-semibold text-red-200 transition-colors hover:bg-red-400/[0.1] disabled:opacity-40"
        >
          <Square className="h-3.5 w-3.5" /> Stop task
        </button>
      </section>
    </aside>
  );
}
