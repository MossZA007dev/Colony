import { Eye, FileEdit, OctagonAlert, ShieldAlert, UserCheck } from 'lucide-react';
import type { RiskLevel } from '../../state/operatorTypes';
import { RISK_LABEL } from '../../state/operatorCopy';

const TONE: Record<RiskLevel, { ring: string; bg: string; text: string; iconClass: string; Icon: typeof Eye }> = {
  read_only:         { ring: 'border-emerald-400/25', bg: 'bg-emerald-400/[0.06]', text: 'text-emerald-100', iconClass: 'text-emerald-200', Icon: Eye },
  draft_only:        { ring: 'border-sky-400/25',     bg: 'bg-sky-400/[0.06]',     text: 'text-sky-100',     iconClass: 'text-sky-200',     Icon: FileEdit },
  approval_required: { ring: 'border-amber-400/30',   bg: 'bg-amber-400/[0.06]',   text: 'text-amber-100',   iconClass: 'text-amber-200',   Icon: ShieldAlert },
  manual_required:   { ring: 'border-orange-400/30',  bg: 'bg-orange-400/[0.06]',  text: 'text-orange-100',  iconClass: 'text-orange-200',  Icon: UserCheck },
  restricted:        { ring: 'border-red-400/25',     bg: 'bg-red-400/[0.06]',     text: 'text-red-100',     iconClass: 'text-red-200',     Icon: OctagonAlert },
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  const tone = TONE[level];
  const Icon = tone.Icon;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] leading-none ${tone.ring} ${tone.bg} ${tone.text}`}>
      <Icon className={`h-3 w-3 ${tone.iconClass}`} />
      {RISK_LABEL[level]}
    </span>
  );
}
