import { Plug } from 'lucide-react';
import {
  OperatorModalChecklist,
  OperatorModalRow,
  OperatorModalSection,
  OperatorModalShell,
  PrimaryButton,
  SecondaryButton,
} from './OperatorModalShell';
import type { ConnectionPrompt } from '../../state/operatorTypes';

export function ConnectAppModal({
  open,
  prompt,
  onConnect,
  onCancel,
}: {
  open: boolean;
  prompt: ConnectionPrompt | undefined;
  onConnect: () => void;
  onCancel: () => void;
}) {
  if (!prompt) return null;
  return (
    <OperatorModalShell
      open={open}
      onClose={onCancel}
      eyebrow={<span className={`inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] ${prompt.appAccentClass}`}><Plug className="h-3 w-3" />Connect</span>}
      title={`Connect ${prompt.appName}`}
      description="Colony Bridge will request only the scope below. You can disconnect any time."
      footer={
        <>
          <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
          <PrimaryButton onClick={onConnect}>Connect {prompt.appName}</PrimaryButton>
        </>
      }
    >
      <div className="divide-y divide-white/[0.05] rounded-[12px] border border-white/[0.06] bg-white/[0.02] px-4">
        <OperatorModalRow label="App" value={prompt.appName} />
        <OperatorModalRow label="Scope" value={prompt.scope} />
      </div>
      <OperatorModalSection title="This connection allows">
        <OperatorModalChecklist items={prompt.willAllow} tone="allow" />
      </OperatorModalSection>
      <OperatorModalSection title="This connection will not">
        <OperatorModalChecklist items={prompt.willNotDo} tone="deny" />
      </OperatorModalSection>
    </OperatorModalShell>
  );
}
