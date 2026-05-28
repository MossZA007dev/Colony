import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
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
import {
  findBridgeSession,
  operatorStateToSessionStatus,
  upsertBridgeSession,
  type BridgeSession,
} from '../../lib/bridge/bridgeSessionStore';

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

function normalizeOperatorState(session: BridgeSession): OperatorState {
  const statusFromOperatorState = session.operatorState
    ? operatorStateToSessionStatus(session.operatorState)
    : null;
  if (
    session.operatorState &&
    statusFromOperatorState === session.status &&
    !(session.operatorState === 'idle' && session.taskPrompt)
  ) {
    return session.operatorState;
  }
  switch (session.status) {
    case 'waiting_approval':
      return 'approval_required';
    case 'completed':
      return 'completed';
    case 'paused':
      return 'paused';
    case 'failed':
      return 'failed';
    case 'setup':
      return session.taskPrompt ? 'plan_ready' : 'idle';
    case 'running':
    default:
      return session.taskPrompt ? 'running' : 'idle';
  }
}

function commandStatusLabel(state: OperatorState, scenario: OperatorScenario): string {
  if (state === 'approval_required') return 'Approval required';
  if (state === 'completed') return 'Completed';
  if (state === 'paused') return 'Paused';
  if (state === 'running') return 'Working';
  if (scenario.riskLevel === 'read_only') return 'Read only';
  if (scenario.riskLevel === 'draft_only') return 'Draft only';
  if (scenario.riskLevel === 'manual_required') return 'Manual review';
  return 'Approval first';
}

interface BridgeOperatorPageProps {
  session?: BridgeSession | null;
  onBackToConversation?: (conversationId: string) => void;
  onSessionUpdate?: (session: BridgeSession) => void;
  onStartFromHome?: () => void;
}

export function BridgeOperatorPage({
  session,
  onBackToConversation,
  onSessionUpdate,
  onStartFromHome,
}: BridgeOperatorPageProps = {}) {
  const initialScenarioId = session?.scenarioId ?? DEFAULT_SCENARIO_ID;
  const [scenarioId, setScenarioId] = useState<string>(initialScenarioId);
  const scenario = useMemo(() => findScenario(scenarioId), [scenarioId]);
  const [runtime, dispatch] = useReducer(
    bridgeReducer,
    { scenarioId, session: session ?? null },
    ({ scenarioId: id, session: s }) => {
      const base = createInitialRuntime(id, s?.taskPrompt ?? '');
      if (s) {
        return {
          ...base,
          state: normalizeOperatorState(s),
          taskText: s.taskPrompt,
          startedAt: s.createdAt,
        };
      }
      return base;
    },
  );
  const [autoplay, setAutoplay] = useState(false);
  const send = useCallback(
    (event: OperatorEvent) => dispatch({ event, scenario }),
    [scenario],
  );

  // Reset when the user switches scenario via the lab (no session).
  useEffect(() => {
    if (session) return;
    dispatch({ event: { type: 'RESET' }, scenario });
  }, [scenarioId, scenario, session]);

  // Persist runtime back into the session whenever the operator state changes.
  useEffect(() => {
    if (!session) return;
    const existing = findBridgeSession(session.id);
    if (!existing) return;
    if (existing.operatorState === runtime.state) return;
    const updated: BridgeSession = {
      ...existing,
      operatorState: runtime.state,
      status: operatorStateToSessionStatus(runtime.state),
      completedAt: runtime.state === 'completed' ? Date.now() : existing.completedAt,
    };
    upsertBridgeSession(updated);
    onSessionUpdate?.(updated);
  }, [runtime.state, session, onSessionUpdate]);

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
    send({ type: 'FOLLOW_UP', text });
  };

  const labEnabled = isLabEnabled();
  const hasSession = Boolean(session);

  // Empty fallback: no session AND lab is disabled (production landing on /bridge).
  if (!hasSession && !labEnabled) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center overflow-hidden bg-[#05080f] px-6 text-white">
        <div className="max-w-md text-center">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-violet-200/65">Colony Bridge Operator</p>
          <h2 className="mt-2 font-heading text-[22px] font-extrabold leading-tight text-white/95">Start from chat</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-white/55">
            Bridge tasks begin in AI Ant. Describe what you need, pick Colony Bridge Operator from the composer, then approve the plan.
          </p>
          <button
            type="button"
            onClick={onStartFromHome}
            className="mt-5 inline-flex items-center gap-2 rounded-[10px] bg-violet-600 px-4 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-300/40"
          >
            Go to AI Ant
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#05080f] text-white">
      {session?.sourceConversationId && onBackToConversation && (
        <div className="flex items-center justify-between border-b border-white/[0.05] bg-white/[0.015] px-5 py-1.5 text-[11.5px]">
          <button
            type="button"
            onClick={() => onBackToConversation(session.sourceConversationId!)}
            className="inline-flex items-center gap-1.5 text-white/55 transition-colors hover:text-white focus-visible:outline-none focus-visible:underline"
          >
            <ArrowLeft className="h-3 w-3" />
            View source conversation
          </button>
          <span className="text-white/35">Bridge session linked to chat</span>
        </div>
      )}
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
        <LiveWorkspacePanel
          scenario={scenario}
          runtime={runtime}
          onStart={() => send({ type: 'PLAN_CONFIRMED' })}
          onApprove={() => send({ type: 'APPROVE' })}
          onReject={() => send({ type: 'REJECT' })}
        />
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
          runtime.state === 'completed'
            ? 'Ask Colony Bridge about this result...'
            : 'Tell Colony Bridge what to change or do next...'
        }
        state={runtime.state}
        statusLabel={commandStatusLabel(runtime.state, scenario)}
        onSubmit={startTaskFromInput}
        onPause={() => send({ type: 'PAUSE' })}
        onResume={() => send({ type: 'RESUME' })}
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
