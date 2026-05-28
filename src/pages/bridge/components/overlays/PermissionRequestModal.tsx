import { FileText } from 'lucide-react';
import {
  OperatorModalChecklist,
  OperatorModalRow,
  OperatorModalSection,
  OperatorModalShell,
  PrimaryButton,
  SecondaryButton,
} from './OperatorModalShell';
import type { PermissionPrompt } from '../../state/operatorTypes';

export function PermissionRequestModal({
  open,
  prompt,
  onAllow,
  onCancel,
}: {
  open: boolean;
  prompt: PermissionPrompt | undefined;
  onAllow: () => void;
  onCancel: () => void;
}) {
  if (!prompt) return null;
  return (
    <OperatorModalShell
      open={open}
      onClose={onCancel}
      eyebrow={<span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-amber-200/85"><FileText className="h-3 w-3" />Local access</span>}
      title={prompt.title}
      description="Colony Bridge will only use the access scope below for this task."
      footer={
        <>
          <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
          <PrimaryButton tone="emerald" onClick={onAllow}>Allow once</PrimaryButton>
        </>
      }
    >
      <div className="divide-y divide-white/[0.05] rounded-[12px] border border-white/[0.06] bg-white/[0.02] px-4">
        <OperatorModalRow label="Requested access" value={prompt.resource} />
        <OperatorModalRow label="Scope" value={prompt.scope} />
      </div>
      <OperatorModalSection title="Used for">
        <OperatorModalChecklist items={prompt.uses} tone="allow" />
      </OperatorModalSection>
      <p className="mt-4 text-[11.5px] text-white/40">Colony Bridge will not read other files, folders, or apps for this task.</p>
    </OperatorModalShell>
  );
}
