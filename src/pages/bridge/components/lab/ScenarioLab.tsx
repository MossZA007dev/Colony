import { useState } from 'react';
import { motion } from 'framer-motion';
import { Beaker, ChevronDown } from 'lucide-react';
import type { OperatorScenario, OperatorState } from '../../state/operatorTypes';
import { OPERATOR_SCENARIOS } from '../../state/operatorScenarios';
import { STATE_LABEL } from '../../state/operatorCopy';

const ALL_STATES: OperatorState[] = [
  'idle',
  'analyzing',
  'requirements_detected',
  'capability_check',
  'permission_required',
  'connection_required',
  'installation_required',
  'manual_takeover_required',
  'plan_ready',
  'running',
  'paused',
  'approval_required',
  'blocked',
  'failed',
  'completed',
];

export function ScenarioLab({
  scenario,
  state,
  onSelectScenario,
  onJumpToState,
  autoplay,
  onToggleAutoplay,
}: {
  scenario: OperatorScenario;
  state: OperatorState;
  onSelectScenario: (id: string) => void;
  onJumpToState: (state: OperatorState) => void;
  autoplay: boolean;
  onToggleAutoplay: () => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <motion.div
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-auto fixed bottom-4 right-4 z-[120] w-[320px] rounded-[14px] border border-violet-400/25 bg-[#0c111c]/97 text-white shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-t-[14px] px-3 py-2 text-left transition-colors hover:bg-white/[0.04]"
      >
        <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-200/85">
          <Beaker className="h-3.5 w-3.5" />
          Scenario lab
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-white/40 transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && (
        <div className="px-3 pb-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">Scenario</p>
          <div className="grid grid-cols-2 gap-1.5">
            {OPERATOR_SCENARIOS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectScenario(s.id)}
                className={`rounded-[8px] border px-2 py-1.5 text-left text-[11px] font-semibold transition-colors ${
                  s.id === scenario.id
                    ? 'border-violet-400/40 bg-violet-500/[0.12] text-white'
                    : 'border-white/[0.08] text-white/55 hover:bg-white/[0.04] hover:text-white/85'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <p className="mt-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">State</p>
          <div className="max-h-44 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-1">
              {ALL_STATES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onJumpToState(s)}
                  className={`rounded-[7px] px-1.5 py-1 text-left text-[10.5px] transition-colors ${
                    s === state
                      ? 'bg-emerald-400/[0.12] text-emerald-100 ring-1 ring-emerald-400/30'
                      : 'text-white/55 hover:bg-white/[0.04] hover:text-white/85'
                  }`}
                >
                  {STATE_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-[10px] border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
            <span className="text-[11.5px] text-white/65">Autoplay scenario</span>
            <button
              type="button"
              onClick={onToggleAutoplay}
              aria-pressed={autoplay}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${autoplay ? 'bg-emerald-500/80' : 'bg-white/[0.12]'}`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${autoplay ? 'translate-x-[18px]' : 'translate-x-[3px]'}`}
              />
            </button>
          </div>
          <p className="mt-2 text-[10.5px] text-white/35">Dev tool. Hidden in production builds.</p>
        </div>
      )}
    </motion.div>
  );
}
