import { AlertTriangle, Check, Circle, Loader2 } from 'lucide-react';

export type TimelineStatus = 'complete' | 'active' | 'waiting' | 'blocked' | 'warning';

const TONE: Record<TimelineStatus, { icon: typeof Check; iconClass: string; labelClass: string }> = {
  complete: { icon: Check,          iconClass: 'text-emerald-300',           labelClass: 'text-white/72' },
  active:   { icon: Loader2,        iconClass: 'text-violet-300 animate-spin motion-reduce:animate-none', labelClass: 'text-white/95' },
  waiting:  { icon: Circle,         iconClass: 'text-white/30',              labelClass: 'text-white/38' },
  blocked:  { icon: AlertTriangle,  iconClass: 'text-red-300',               labelClass: 'text-red-100' },
  warning:  { icon: AlertTriangle,  iconClass: 'text-amber-300',             labelClass: 'text-amber-100' },
};

export function TimelineRow({
  label,
  status,
  meta,
}: {
  label: string;
  status: TimelineStatus;
  meta?: string;
}) {
  const tone = TONE[status];
  const Icon = tone.icon;
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center">
        <Icon className={`h-3.5 w-3.5 ${tone.iconClass}`} />
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-[12.5px] leading-snug ${tone.labelClass}`}>{label}</p>
        {meta && <p className="mt-0.5 text-[10.5px] tabular-nums text-white/30">{meta}</p>}
      </div>
    </div>
  );
}
