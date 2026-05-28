import { AlertTriangle } from 'lucide-react';
import {
  OperatorModalChecklist,
  OperatorModalSection,
  OperatorModalShell,
  PrimaryButton,
  SecondaryButton,
} from './OperatorModalShell';
import type { FailureContext } from '../../state/operatorTypes';

export function FailureRecoveryModal({
  open,
  context,
  onReconnect,
  onSaveLocally,
  onCancel,
}: {
  open: boolean;
  context: FailureContext | undefined;
  onReconnect: () => void;
  onSaveLocally: () => void;
  onCancel: () => void;
}) {
  const fallback: FailureContext = context ?? {
    title: 'Connection interrupted',
    detail: 'The task did not finish. Your progress so far is preserved.',
    completed: ['Task started', 'Initial steps completed'],
    waiting: ['Remaining steps paused until you recover'],
  };
  return (
    <OperatorModalShell
      open={open}
      onClose={onCancel}
      eyebrow={<span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-red-200/85"><AlertTriangle className="h-3 w-3" />Interrupted</span>}
      title={fallback.title}
      description={fallback.detail}
      footer={
        <>
          <SecondaryButton onClick={onCancel}>Cancel task</SecondaryButton>
          <SecondaryButton onClick={onSaveLocally}>Save what we have</SecondaryButton>
          <PrimaryButton onClick={onReconnect}>Reconnect and continue</PrimaryButton>
        </>
      }
    >
      <OperatorModalSection title="Completed">
        <OperatorModalChecklist items={fallback.completed} tone="allow" />
      </OperatorModalSection>
      <OperatorModalSection title="Waiting">
        <OperatorModalChecklist items={fallback.waiting} tone="neutral" />
      </OperatorModalSection>
    </OperatorModalShell>
  );
}
