import type { ElementType, ReactNode } from 'react';

export function AdminMetricCard({
  title,
  value,
  trend,
  detail,
  icon: Icon,
}: {
  title: string;
  value: ReactNode;
  trend: string;
  detail?: string;
  icon: ElementType;
}) {
  return (
    <div className="rounded-[18px] border border-white/[0.08] bg-white/[0.035] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/35">{title}</p>
        <div className="grid h-9 w-9 place-items-center rounded-[12px] border border-violet-300/15 bg-violet-400/10 text-violet-200">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="text-2xl font-bold tracking-tight text-white">{value}</div>
      <p className="mt-2 text-[12px] font-semibold text-emerald-300/80">{trend}</p>
      {detail && <p className="mt-1 text-[11px] text-white/35">{detail}</p>}
    </div>
  );
}
