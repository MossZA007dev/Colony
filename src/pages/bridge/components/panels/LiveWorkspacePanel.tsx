import type { OperatorRuntime, OperatorScenario } from '../../state/operatorTypes';
import { OperatorFeedPanel } from '../feed/OperatorFeedPanel';

export function LiveWorkspacePanel({
  scenario,
  runtime,
  onStart,
  onApprove,
  onReject,
}: {
  scenario: OperatorScenario;
  runtime: OperatorRuntime;
  onStart: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <main className="relative flex h-full min-w-0 flex-1 flex-col bg-[#05080f]">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <OperatorFeedPanel
          scenario={scenario}
          runtime={runtime}
          onStart={onStart}
          onApprove={onApprove}
          onReject={onReject}
        />
      </div>
    </main>
  );
}
