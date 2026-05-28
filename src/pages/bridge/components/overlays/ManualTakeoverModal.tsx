import { UserCheck } from 'lucide-react';
import {
  OperatorModalChecklist,
  OperatorModalSection,
  OperatorModalShell,
  PrimaryButton,
  SecondaryButton,
} from './OperatorModalShell';
import type { ManualTakeoverPrompt } from '../../state/operatorTypes';

export function ManualTakeoverModal({
  open,
  prompt,
  onMarkDone,
  onCancel,
}: {
  open: boolean;
  prompt: ManualTakeoverPrompt | undefined;
  onMarkDone: () => void;
  onCancel: () => void;
}) {
  if (!prompt) return null;
  return (
    <OperatorModalShell
      open={open}
      onClose={onCancel}
      width="lg"
      eyebrow={<span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-orange-200/85"><UserCheck className="h-3 w-3" />Your action required</span>}
      title="You complete this step safely"
      description={prompt.reason}
      footer={
        <>
          <SecondaryButton onClick={onCancel}>Cancel task</SecondaryButton>
          <PrimaryButton tone="amber" onClick={onMarkDone}>Mark as complete</PrimaryButton>
        </>
      }
    >
      <OperatorModalSection title="What you do">
        <ol className="flex flex-col gap-2">
          {prompt.userSteps.map((step, idx) => (
            <li key={step} className="flex items-start gap-3 rounded-[10px] border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-[12.5px] text-white/72">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-orange-400/15 text-[11px] font-bold text-orange-200">{idx + 1}</span>
              <span className="min-w-0 flex-1">{step}</span>
            </li>
          ))}
        </ol>
      </OperatorModalSection>
      <OperatorModalSection title="Colony Bridge can still help with">
        <OperatorModalChecklist items={prompt.operatorCanHelp} tone="allow" />
      </OperatorModalSection>
    </OperatorModalShell>
  );
}
