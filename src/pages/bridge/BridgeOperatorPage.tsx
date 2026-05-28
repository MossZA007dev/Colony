import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { OperatorHeader } from './components/OperatorHeader';
import { OperatorCommandBar } from './components/OperatorCommandBar';
import { PlanAccessPanel } from './components/panels/PlanAccessPanel';
import { LiveWorkspacePanel } from './components/panels/LiveWorkspacePanel';
import { ControlCenterPanel } from './components/panels/ControlCenterPanel';
import { ApprovalModal } from './components/overlays/ApprovalModal';
import { ConnectAppModal } from './components/overlays/ConnectAppModal';
import { FailureRecoveryModal } from './components/overlays/FailureRecoveryModal';
import { InstallCompanionModal } from './components/overlays/InstallCompanionModal';
import { ManualTakeoverModal } from './components/overlays/ManualTakeoverModal';
import { PermissionRequestModal } from './components/overlays/PermissionRequestModal';
import { ScenarioLab } from './components/lab/ScenarioLab';
import { createInitialRuntime, defaultEventForState, operatorReducer } from './state/operatorMachine';
import { DEFAULT_SCENARIO_ID, findScenario, OPERATOR_SCENARIOS } from './state/operatorScenarios';
import type { OperatorEvent, OperatorRuntime, OperatorScenario, OperatorState } from './state/operatorTypes';

type ReducerAction = { event: OperatorEvent; scenario: OperatorScenario };

function bridgeReducer(state: OperatorRuntime, action: ReducerAction): OperatorRuntime {
  return operatorReducer(state, action.event, action.scenario);
}

function isLabEnabled(): boolean {
  try {
    if (import.meta.env.DEV) return true;
    if (typeof window !== 'undefined' && window.location.search.includes('lab=1')) return true;
  } catch {
    /* ignore */
  }
  return false;
}

export function BridgeOperatorPage() {
  const [scenarioId, setScenarioId] = useState<string>(DEFAULT_SCENARIO_ID);
  const scenario = useMemo(() => findScenario(scenarioId), [scenarioId]);
  const [runtime, dispatch] = useReducer(bridgeReducer, scenarioId, (id) => createInitialRuntime(id));
  const [autoplay, setAutoplay] = useState(false);
  const send = useCallback(
    (event: OperatorEvent) => dispatch({ event, scenario }),
    [scenario],
  );

  useEffect(() => {
    dispatch({ event: { type: 'RESET' }, scenario });
  }, [scenarioId, scenario]);

  // Autoplay walks through the scenario sequence on a gentle timer.
  useEffect(() => {
    if (!autoplay) return;
    const blockingStates: OperatorState[] = ['blocked', 'failed', 'completed'];
    if (blockingStates.includes(runtime.state)) return;
    const t = window.setTimeout(() => {
      send(defaultEventForState(runtime.state));
    }, 1200);
    return () => window.clearTimeout(t);
  }, [autoplay, runtime.state, send]);

  const startTaskFromInput = (text: string) => {
    if (runtime.state === 'idle') {
      send({ type: 'INPUT_TASK', text });
      send({ type: 'START_ANALYSIS' });
      return;
    }
    // Follow-up command during a running task. Stays as in-line note.
    send({ type: 'INPUT_TASK', text: text });
  };

  const labEnabled = isLabEnabled();

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#05080f] text-white">
      <OperatorHeader
        scenario={scenario}
        runtime={runtime}
        onPause={() => send({ type: 'PAUSE' })}
        onResume={() => send({ type: 'RESUME' })}
        onStop={() => send({ type: 'STOP' })}
        onReset={() => send({ type: 'RESET' })}
      />

      <div className="flex min-h-0 flex-1">
        <PlanAccessPanel
          scenario={scenario}
          state={runtime.state}
          onResolveCapability={() => send({ type: 'OPEN_REQUIREMENT_PROMPT' })}
        />
        <LiveWorkspacePanel scenario={scenario} runtime={runtime} />
        <ControlCenterPanel
          scenario={scenario}
          runtime={runtime}
          onPause={() => send({ type: 'PAUSE' })}
          onResume={() => send({ type: 'RESUME' })}
          onStop={() => send({ type: 'STOP' })}
          onOpenApproval={() => { /* already an open state */ }}
        />
      </div>

      <OperatorCommandBar
        placeholder={
          runtime.state === 'idle'
            ? 'Describe a task involving browser, files, apps, or devices…'
            : 'Tell Colony Bridge what to change…'
        }
        onSubmit={startTaskFromInput}
        disabled={runtime.state === 'failed' || runtime.state === 'blocked'}
      />

      <PermissionRequestModal
        open={runtime.state === 'permission_required'}
        prompt={scenario.permissionPrompt}
        onAllow={() => send({ type: 'PERMISSION_GRANTED' })}
        onCancel={() => send({ type: 'PERMISSION_DENIED' })}
      />
      <ConnectAppModal
        open={runtime.state === 'connection_required'}
        prompt={scenario.connectionPrompt}
        onConnect={() => send({ type: 'CONNECTION_OPENED' })}
        onCancel={() => send({ type: 'STOP' })}
      />
      <InstallCompanionModal
        open={runtime.state === 'installation_required'}
        prompt={scenario.installationPrompt}
        onInstalled={() => send({ type: 'COMPANION_INSTALLED' })}
        onUseCloudInstead={() => send({ type: 'COMPANION_INSTALLED' })}
        onCancel={() => send({ type: 'STOP' })}
      />
      <ManualTakeoverModal
        open={runtime.state === 'manual_takeover_required'}
        prompt={scenario.manualTakeoverPrompt}
        onMarkDone={() => send({ type: 'MANUAL_TAKEOVER_DONE' })}
        onCancel={() => send({ type: 'STOP' })}
      />
      <ApprovalModal
        open={runtime.state === 'approval_required'}
        approval={scenario.approval}
        onApprove={() => send({ type: 'APPROVE' })}
        onReject={() => send({ type: 'REJECT' })}
      />
      <FailureRecoveryModal
        open={runtime.state === 'failed'}
        context={scenario.failureContext}
        onReconnect={() => send({ type: 'RECOVER' })}
        onSaveLocally={() => send({ type: 'COMPLETE' })}
        onCancel={() => send({ type: 'RESET' })}
      />

      {labEnabled && (
        <ScenarioLab
          scenario={scenario}
          state={runtime.state}
          onSelectScenario={(id) => setScenarioId(id)}
          onJumpToState={(target) => send({ type: 'JUMP_TO', target })}
          autoplay={autoplay}
          onToggleAutoplay={() => setAutoplay((v) => !v)}
        />
      )}
    </div>
  );
}

export { OPERATOR_SCENARIOS };
