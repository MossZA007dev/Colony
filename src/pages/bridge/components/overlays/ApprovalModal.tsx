import { ShieldAlert } from 'lucide-react';
import {
  OperatorModalChecklist,
  OperatorModalRow,
  OperatorModalSection,
  OperatorModalShell,
  PrimaryButton,
  SecondaryButton,
} from './OperatorModalShell';
import { APPROVAL_ACTION_LABEL } from '../../state/operatorCopy';
import type { ApprovalRequest } from '../../state/operatorTypes';

export function ApprovalModal({
  open,
  approval,
  onApprove,
  onReject,
}: {
  open: boolean;
  approval: ApprovalRequest | undefined;
  onApprove: () => void;
  onReject: () => void;
}) {
  if (!approval) return null;
  return (
    <OperatorModalShell
      open={open}
      onClose={onReject}
      width="lg"
      eyebrow={<span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-amber-200/85"><ShieldAlert className="h-3 w-3" />Approval required</span>}
      title={approval.title}
      description={approval.description}
      footer={
        <>
          <SecondaryButton tone="danger" onClick={onReject}>Reject</SecondaryButton>
          <PrimaryButton tone="emerald" onClick={onApprove}>Approve</PrimaryButton>
        </>
      }
    >
      <div className="divide-y divide-white/[0.05] rounded-[12px] border border-white/[0.06] bg-white/[0.02] px-4">
        <OperatorModalRow label="Action" value={APPROVAL_ACTION_LABEL[approval.actionType]} />
        {approval.destination && <OperatorModalRow label="Destination" value={approval.destination} />}
      </div>
      {approval.includedData && approval.includedData.length > 0 && (
        <OperatorModalSection title="Data included">
          <OperatorModalChecklist items={approval.includedData} tone="neutral" />
        </OperatorModalSection>
      )}
      <p className="mt-5 text-[11.5px] text-white/40">
        Colony Bridge will not perform this action unless you approve. Rejecting marks the task as blocked and stops here.
      </p>
    </OperatorModalShell>
  );
}
