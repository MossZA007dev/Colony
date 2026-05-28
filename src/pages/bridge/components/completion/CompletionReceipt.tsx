import { CheckCircle2, ExternalLink, History, RefreshCw } from 'lucide-react';
import type { OperatorRuntime, OperatorScenario } from '../../state/operatorTypes';

function ReceiptSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="rounded-[14px] border border-white/[0.06] bg-white/[0.02] p-4">
      <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/35">{title}</p>
      <ul className="flex flex-col gap-1.5">
        {items.map((item, idx) => (
          <li key={`${item}-${idx}`} className="flex items-start gap-2 text-[12.5px] text-white/72">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
            <span className="min-w-0 flex-1">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CompletionReceipt({
  scenario,
  runtime,
}: {
  scenario: OperatorScenario;
  runtime: OperatorRuntime;
}) {
  const deliverable = scenario.deliverable;
  if (!deliverable) return null;
  const duration = runtime.startedAt && runtime.completedAt ? Math.max(1, Math.round((runtime.completedAt - runtime.startedAt) / 1000)) : null;
  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-[18px] border border-emerald-400/20 bg-emerald-400/[0.04] p-6">
        <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-emerald-200/85">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Task completed
        </div>
        <h2 className="mt-2 font-heading text-[22px] font-extrabold leading-tight text-white/95">{deliverable.title}</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-white/65">{deliverable.description}</p>
        {duration !== null && (
          <p className="mt-2 text-[11.5px] text-white/40">Completed in {duration}s.</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="inline-flex items-center gap-1.5 rounded-[10px] bg-violet-600 px-3 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-violet-500">
            <ExternalLink className="h-3.5 w-3.5" />
            Open deliverable
          </button>
          <button type="button" className="inline-flex items-center gap-1.5 rounded-[10px] border border-white/[0.12] bg-white/[0.04] px-3 py-2 text-[12.5px] font-semibold text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white">
            <History className="h-3.5 w-3.5" />
            View activity log
          </button>
          <button type="button" className="inline-flex items-center gap-1.5 rounded-[10px] border border-white/[0.12] bg-white/[0.04] px-3 py-2 text-[12.5px] font-semibold text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white">
            <RefreshCw className="h-3.5 w-3.5" />
            Run again
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <ReceiptSection title="Actions performed" items={deliverable.actionsPerformed} />
        <ReceiptSection title="Tools used" items={deliverable.toolsUsed} />
        <ReceiptSection title="Approvals granted" items={deliverable.approvalsGranted.length ? deliverable.approvalsGranted : ['No external approvals required']} />
        {deliverable.manualSteps && deliverable.manualSteps.length > 0 && (
          <ReceiptSection title="Manual steps completed by you" items={deliverable.manualSteps} />
        )}
      </div>
    </div>
  );
}
