import { Activity, AlertTriangle, CheckCircle2, Loader2, OctagonAlert, Pause, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';
import type { OperatorState } from '../../state/operatorTypes';
import { STATE_LABEL } from '../../state/operatorCopy';

const TONE: Record<OperatorState, { ring: string; bg: string; text: string; iconClass: string; Icon: typeof Activity }> = {
  idle:                     { ring: 'border-white/[0.10]',   bg: 'bg-white/[0.04]',         text: 'text-white/60',  iconClass: 'text-white/55',     Icon: Sparkles },
  analyzing:                { ring: 'border-violet-400/25',  bg: 'bg-violet-500/[0.08]',    text: 'text-violet-100', iconClass: 'text-violet-200',   Icon: Loader2 },
  requirements_detected:    { ring: 'border-sky-400/25',     bg: 'bg-sky-400/[0.08]',       text: 'text-sky-100',    iconClass: 'text-sky-200',      Icon: ShieldAlert },
  capability_check:         { ring: 'border-sky-400/25',     bg: 'bg-sky-400/[0.08]',       text: 'text-sky-100',    iconClass: 'text-sky-200',      Icon: ShieldAlert },
  permission_required:      { ring: 'border-amber-400/30',   bg: 'bg-amber-400/[0.08]',     text: 'text-amber-100',  iconClass: 'text-amber-200',    Icon: ShieldAlert },
  connection_required:      { ring: 'border-violet-400/30',  bg: 'bg-violet-500/[0.08]',    text: 'text-violet-100', iconClass: 'text-violet-200',   Icon: ShieldAlert },
  installation_required:    { ring: 'border-violet-400/30',  bg: 'bg-violet-500/[0.08]',    text: 'text-violet-100', iconClass: 'text-violet-200',   Icon: ShieldAlert },
  manual_takeover_required: { ring: 'border-orange-400/30',  bg: 'bg-orange-400/[0.08]',    text: 'text-orange-100', iconClass: 'text-orange-200',   Icon: UserCheck },
  plan_ready:               { ring: 'border-emerald-400/25', bg: 'bg-emerald-400/[0.06]',   text: 'text-emerald-100',iconClass: 'text-emerald-200',  Icon: CheckCircle2 },
  running:                  { ring: 'border-emerald-400/30', bg: 'bg-emerald-400/[0.08]',   text: 'text-emerald-100',iconClass: 'text-emerald-200',  Icon: Activity },
  paused:                   { ring: 'border-white/[0.12]',   bg: 'bg-white/[0.05]',         text: 'text-white/70',   iconClass: 'text-white/55',     Icon: Pause },
  approval_required:        { ring: 'border-amber-400/30',   bg: 'bg-amber-400/[0.08]',     text: 'text-amber-100',  iconClass: 'text-amber-200',    Icon: ShieldAlert },
  blocked:                  { ring: 'border-red-400/25',     bg: 'bg-red-400/[0.06]',       text: 'text-red-100',    iconClass: 'text-red-200',      Icon: OctagonAlert },
  failed:                   { ring: 'border-red-400/25',     bg: 'bg-red-400/[0.06]',       text: 'text-red-100',    iconClass: 'text-red-200',      Icon: AlertTriangle },
  completed:                { ring: 'border-emerald-400/30', bg: 'bg-emerald-400/[0.08]',   text: 'text-emerald-100',iconClass: 'text-emerald-200',  Icon: CheckCircle2 },
};

export function StateBadge({ state, size = 'md' }: { state: OperatorState; size?: 'sm' | 'md' }) {
  const tone = TONE[state];
  const Icon = tone.Icon;
  const isLive = state === 'analyzing' || state === 'running';
  const dim = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]';
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border font-semibold leading-none ${tone.ring} ${tone.bg} ${tone.text} ${padding}`}>
      <Icon className={`${dim} ${tone.iconClass} ${isLive ? 'animate-spin motion-reduce:animate-none' : ''}`} />
      {STATE_LABEL[state]}
    </span>
  );
}
