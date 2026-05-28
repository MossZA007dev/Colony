import { Pause, Play, RotateCcw, Square } from 'lucide-react';
import { StateBadge } from './primitives/StateBadge';
import { RiskBadge } from './primitives/RiskBadge';
import type { OperatorRuntime, OperatorScenario } from '../state/operatorTypes';

export function OperatorHeader({
  scenario,
  runtime,
  onPause,
  onResume,
  onStop,
  onReset,
}: {
  scenario: OperatorScenario;
  runtime: OperatorRuntime;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReset: () => void;
}) {
  const state = runtime.state;
  const stopped = state === 'completed' || state === 'failed' || state === 'blocked';
  const showResume = state === 'paused';
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-white/[0.07] bg-[#070b15]/85 px-5 backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-violet-400/25 bg-violet-500/[0.1]">
          <svg viewBox="0 0 16 16" className="h-4 w-4 text-violet-200" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 4h2.5L8 8l2.5-4H13" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 12h2.5L8 8l2.5 4H13" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-violet-200/65">Colony Bridge Operator</p>
          <h1 className="truncate font-heading text-[14.5px] font-extrabold text-white/92">{runtime.taskText || scenario.task}</h1>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <RiskBadge level={scenario.riskLevel} />
        <StateBadge state={state} />
        <div className="ml-2 flex items-center gap-1">
          {showResume ? (
            <button
              type="button"
              onClick={onResume}
              aria-label="Resume task"
              className="grid h-8 w-8 place-items-center rounded-[9px] border border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-200 transition-colors hover:bg-emerald-400/[0.14] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-300/40"
            >
              <Play className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onPause}
              aria-label="Pause task"
              disabled={state !== 'running'}
              className="grid h-8 w-8 place-items-center rounded-[9px] border border-white/[0.1] text-white/55 transition-colors hover:bg-white/[0.05] hover:text-white/90 disabled:opacity-35 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
            >
              <Pause className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop task"
            disabled={stopped}
            className="grid h-8 w-8 place-items-center rounded-[9px] border border-red-400/20 bg-red-400/[0.05] text-red-200 transition-colors hover:bg-red-400/[0.1] disabled:opacity-35 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-300/40"
          >
            <Square className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onReset}
            aria-label="Reset task"
            className="grid h-8 w-8 place-items-center rounded-[9px] border border-white/[0.1] text-white/55 transition-colors hover:bg-white/[0.05] hover:text-white/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
