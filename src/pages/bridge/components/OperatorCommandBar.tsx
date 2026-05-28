import { useState } from 'react';
import { ArrowRight, Pause, Play, Plus } from 'lucide-react';
import type { OperatorState } from '../state/operatorTypes';

function statusToneClass(state: OperatorState): string {
  if (state === 'approval_required') return 'border-amber-300/22 bg-amber-400/[0.08] text-amber-100/82';
  if (state === 'completed') return 'border-emerald-300/18 bg-emerald-400/[0.07] text-emerald-100/78';
  if (state === 'paused') return 'border-sky-300/18 bg-sky-400/[0.07] text-sky-100/78';
  if (state === 'running') return 'border-violet-300/18 bg-violet-400/[0.09] text-violet-100/80';
  return 'border-white/[0.08] bg-white/[0.035] text-white/48';
}

function canPause(state: OperatorState): boolean {
  return state === 'running' || state === 'plan_ready' || state === 'capability_check';
}

export function OperatorCommandBar({
  placeholder,
  state,
  statusLabel,
  onSubmit,
  onPause,
  onResume,
  disabled = false,
}: {
  placeholder: string;
  state: OperatorState;
  statusLabel: string;
  onSubmit: (text: string) => void;
  onPause?: () => void;
  onResume?: () => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState('');
  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setText('');
  };
  const showResume = state === 'paused';
  const showPause = canPause(state);
  const pauseResumeButton = showResume ? (
    <button
      type="button"
      aria-label="Resume task"
      onClick={onResume}
      className="ant-ctrl-neutral inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:w-auto sm:px-3"
    >
      <Play className="h-4 w-4" />
      <span className="hidden text-xs font-semibold sm:inline">Resume</span>
    </button>
  ) : showPause ? (
    <button
      type="button"
      aria-label="Pause task"
      onClick={onPause}
      className="ant-ctrl-neutral inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:w-auto sm:px-3"
    >
      <Pause className="h-4 w-4" />
      <span className="hidden text-xs font-semibold sm:inline">Pause</span>
    </button>
  ) : null;

  return (
    <div className="shrink-0 border-t border-white/[0.045] bg-[#05080f]/92 px-4 py-3 backdrop-blur-xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="ant-composer ant-composer-large mx-auto flex max-w-[880px] items-center gap-2 rounded-full border border-white/[0.085] bg-white/[0.055] px-2.5 py-2 shadow-[0_18px_54px_rgba(0,0,0,0.28)] backdrop-blur-xl"
      >
        <button
          type="button"
          aria-label="Attach file"
          title="Attach file"
          className="ant-ctrl-neutral grid h-10 w-10 shrink-0 place-items-center rounded-full"
        >
          <Plus className="h-4 w-4" />
        </button>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          rows={1}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          onInput={(e) => {
            const target = e.currentTarget;
            target.style.height = 'auto';
            target.style.height = `${Math.min(target.scrollHeight, 96)}px`;
          }}
          className="ant-composer-textarea min-h-[28px] max-h-24 flex-1 resize-none overflow-hidden bg-transparent text-[15px] leading-[1.55] text-white/88 caret-violet-200 outline-none placeholder:text-white/34 disabled:opacity-60"
        />
        <span className={`hidden shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] sm:inline-flex ${statusToneClass(state)}`}>
          {statusLabel}
        </span>
        {pauseResumeButton}
        <button
          type="submit"
          aria-label="Send follow-up instruction"
          disabled={!text.trim() || disabled}
          className={`ant-ctrl-send group flex h-10 shrink-0 items-center justify-center gap-2 rounded-full text-xs font-semibold ${
            text.trim() && !disabled ? 'is-armed w-10 px-0 sm:w-auto sm:px-4' : 'is-disabled w-10 px-0'
          }`}
        >
          {text.trim() && !disabled && <span className="hidden sm:inline">Send</span>}
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </form>
    </div>
  );
}
