import { Image, MonitorDot } from 'lucide-react';

export type MvpMediaSlotProps = {
  title: string;
  description: string;
  futureContentLabel: string;
  aspect?: 'wide' | 'square' | 'tall';
  status?: string;
};

const ASPECT_CLASS: Record<NonNullable<MvpMediaSlotProps['aspect']>, string> = {
  wide: 'aspect-[16/9]',
  square: 'aspect-[1/1]',
  tall: 'aspect-[4/5]',
};

export function MvpMediaSlot({
  title,
  description,
  futureContentLabel,
  aspect = 'wide',
  status = 'MVP image coming soon',
}: MvpMediaSlotProps) {
  return (
    <div className="group relative overflow-hidden rounded-[24px] border border-white/[0.09] bg-white/[0.025] p-4 transition duration-300 hover:-translate-y-0.5 hover:border-white/[0.16] motion-reduce:transform-none">
      <div
        className={`relative overflow-hidden rounded-[18px] border border-dashed border-white/[0.14] bg-[#070A12]/80 ${ASPECT_CLASS[aspect]}`}
      >
        {/* Replace this placeholder with the real MVP screenshot asset when the flow is stable. */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(125,183,255,0.12),transparent_55%)]" />
        <div className="absolute inset-5 grid grid-rows-[auto_1fr_auto] gap-4">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/48">
              <Image className="h-3 w-3" />
              MVP screenshot slot
            </span>
            <span className="hidden rounded-full border border-[#7db7ff]/25 bg-[#7db7ff]/[0.08] px-2.5 py-1 text-[10px] font-semibold text-[#bcd9ff] sm:inline-flex">
              {status}
            </span>
          </div>
          <div className="grid place-items-center">
            <div className="w-full max-w-[420px] space-y-3">
              <div className="h-3 w-1/2 rounded-full bg-white/[0.10]" />
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="h-20 rounded-[14px] border border-white/[0.07] bg-white/[0.035]" />
                <div className="h-20 rounded-[14px] border border-white/[0.07] bg-white/[0.025]" />
                <div className="h-20 rounded-[14px] border border-white/[0.07] bg-white/[0.025]" />
              </div>
              <div className="h-2 w-3/4 rounded-full bg-white/[0.08]" />
              <div className="h-2 w-1/2 rounded-full bg-white/[0.06]" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-medium text-white/42">
            <MonitorDot className="h-3.5 w-3.5 text-white/35" />
            {futureContentLabel}
          </div>
        </div>
      </div>
      <div className="px-1 pt-4">
        <h3 className="text-[15px] font-semibold tracking-tight text-white">{title}</h3>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/52">{description}</p>
      </div>
    </div>
  );
}

export default MvpMediaSlot;
