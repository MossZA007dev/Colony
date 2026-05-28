import { Smartphone } from 'lucide-react';
import {
  OperatorModalSection,
  OperatorModalShell,
  PrimaryButton,
  SecondaryButton,
} from './OperatorModalShell';
import type { InstallationPrompt } from '../../state/operatorTypes';

export function InstallCompanionModal({
  open,
  prompt,
  onInstalled,
  onUseCloudInstead,
  onCancel,
}: {
  open: boolean;
  prompt: InstallationPrompt | undefined;
  onInstalled: () => void;
  onUseCloudInstead: () => void;
  onCancel: () => void;
}) {
  if (!prompt) return null;
  return (
    <OperatorModalShell
      open={open}
      onClose={onCancel}
      width="lg"
      eyebrow={<span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-violet-200/85"><Smartphone className="h-3 w-3" />Companion required</span>}
      title="Connect your phone"
      description="Pair the Colony Bridge mobile companion to share only the files you approve on your phone."
      footer={
        <>
          <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
          <SecondaryButton onClick={onUseCloudInstead}>Use cloud drive instead</SecondaryButton>
          <PrimaryButton onClick={onInstalled}>I have installed it</PrimaryButton>
        </>
      }
    >
      <OperatorModalSection title="Target device">
        <p className="text-[13px] text-white/80">{prompt.deviceLabel}</p>
      </OperatorModalSection>
      <OperatorModalSection title="Steps">
        <ol className="flex flex-col gap-2">
          {prompt.steps.map((step, idx) => (
            <li key={step} className="flex items-start gap-3 rounded-[10px] border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-[12.5px] text-white/72">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-violet-500/15 text-[11px] font-bold text-violet-200">{idx + 1}</span>
              <span className="min-w-0 flex-1">{step}</span>
            </li>
          ))}
        </ol>
      </OperatorModalSection>
      <p className="mt-4 text-[11.5px] text-white/40">Your device will only share files you explicitly approve on the phone.</p>
    </OperatorModalShell>
  );
}
