import { Building2, FileText, Globe, OctagonAlert, Plug, Smartphone } from 'lucide-react';
import type { CapabilityRequirement, CapabilityStatus, CapabilityType } from '../../state/operatorTypes';
import { CAPABILITY_STATUS_LABEL } from '../../state/operatorCopy';

const STATUS_TONE: Record<CapabilityStatus, { dot: string; pill: string }> = {
  ready:                { dot: 'bg-emerald-400', pill: 'border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-200' },
  permission_needed:    { dot: 'bg-sky-300',     pill: 'border-sky-400/25 bg-sky-400/[0.08] text-sky-200' },
  connection_needed:    { dot: 'bg-violet-300',  pill: 'border-violet-400/25 bg-violet-500/[0.08] text-violet-200' },
  installation_needed:  { dot: 'bg-violet-300',  pill: 'border-violet-400/25 bg-violet-500/[0.08] text-violet-200' },
  manual_only:          { dot: 'bg-orange-300',  pill: 'border-orange-400/25 bg-orange-400/[0.08] text-orange-200' },
  restricted:           { dot: 'bg-red-300',     pill: 'border-red-400/25 bg-red-400/[0.06] text-red-200' },
  unsupported:          { dot: 'bg-red-300',     pill: 'border-red-400/25 bg-red-400/[0.06] text-red-200' },
};

const TYPE_ICON: Record<CapabilityType, typeof Globe> = {
  browser: Globe,
  file: FileText,
  app: Plug,
  device: Smartphone,
  external_action: Building2,
};

export function CapabilityRow({
  capability,
  onActionClick,
  compact = false,
}: {
  capability: CapabilityRequirement;
  onActionClick?: () => void;
  compact?: boolean;
}) {
  const tone = STATUS_TONE[capability.status];
  const Icon = TYPE_ICON[capability.type] ?? Globe;
  const blocking = capability.status === 'restricted' || capability.status === 'unsupported';
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] border border-white/[0.06] bg-white/[0.025]">
        {blocking ? <OctagonAlert className="h-3.5 w-3.5 text-red-200" /> : <Icon className="h-3.5 w-3.5 text-white/55" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[12.5px] font-semibold text-white/85">{capability.label}</p>
          <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none ${tone.pill}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
            {CAPABILITY_STATUS_LABEL[capability.status]}
          </span>
        </div>
        {capability.scope && !compact && (
          <p className="mt-0.5 truncate text-[11px] text-white/40">{capability.scope}</p>
        )}
        {capability.note && !compact && (
          <p className="mt-0.5 text-[11px] text-white/35">{capability.note}</p>
        )}
        {onActionClick && capability.status !== 'ready' && (
          <button
            type="button"
            onClick={onActionClick}
            className="mt-1.5 text-[11px] font-medium text-violet-200/85 transition-colors hover:text-violet-100 focus-visible:outline-none focus-visible:underline"
          >
            Resolve {capability.label.toLowerCase()}
          </button>
        )}
      </div>
    </div>
  );
}
