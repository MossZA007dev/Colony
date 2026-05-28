import type {
  OperatorEvent,
  OperatorRuntime,
  OperatorScenario,
  OperatorState,
} from './operatorTypes';

export function createInitialRuntime(scenarioId: string, taskText = ''): OperatorRuntime {
  return {
    scenarioId,
    state: 'idle',
    taskText,
    followUps: [],
    startedAt: null,
    completedAt: null,
    approvalsGranted: [],
    manualStepsCompleted: [],
    runningStepIndex: 0,
  };
}

const REQUIREMENT_STATES: OperatorState[] = [
  'permission_required',
  'connection_required',
  'installation_required',
  'manual_takeover_required',
];

function nextRequirementState(scenario: OperatorScenario): OperatorState {
  const sequence = scenario.stateSequence;
  for (const target of sequence) {
    if (REQUIREMENT_STATES.includes(target)) return target;
  }
  return 'plan_ready';
}

function stepAfter(scenario: OperatorScenario, current: OperatorState): OperatorState {
  const idx = scenario.stateSequence.indexOf(current);
  if (idx < 0) {
    const fallback = scenario.stateSequence[0];
    return fallback ?? 'idle';
  }
  return scenario.stateSequence[idx + 1] ?? 'completed';
}

export function operatorReducer(
  runtime: OperatorRuntime,
  event: OperatorEvent,
  scenario: OperatorScenario,
): OperatorRuntime {
  switch (event.type) {
    case 'INPUT_TASK':
      return { ...runtime, taskText: event.text };

    case 'FOLLOW_UP':
      return {
        ...runtime,
        followUps: [
          ...runtime.followUps,
          {
            id: `follow-${Date.now()}-${runtime.followUps.length + 1}`,
            text: event.text,
            createdAt: Date.now(),
          },
        ],
      };

    case 'START_ANALYSIS':
      return {
        ...runtime,
        state: 'analyzing',
        taskText: runtime.taskText || scenario.task,
        startedAt: Date.now(),
        completedAt: null,
        approvalsGranted: [],
        manualStepsCompleted: [],
        runningStepIndex: 0,
      };

    case 'REQUIREMENTS_RESOLVED':
      return { ...runtime, state: 'requirements_detected' };

    case 'OPEN_REQUIREMENT_PROMPT':
      return { ...runtime, state: nextRequirementState(scenario) };

    case 'PERMISSION_GRANTED':
    case 'CONNECTION_OPENED':
    case 'COMPANION_INSTALLED': {
      const next = stepAfter(scenario, runtime.state);
      return { ...runtime, state: next };
    }

    case 'PERMISSION_DENIED':
      return { ...runtime, state: 'blocked' };

    case 'MANUAL_TAKEOVER_DONE': {
      const next = stepAfter(scenario, runtime.state);
      return {
        ...runtime,
        state: next,
        manualStepsCompleted: [...runtime.manualStepsCompleted, 'Manual step completed'],
      };
    }

    case 'PLAN_CONFIRMED':
      return { ...runtime, state: 'running', runningStepIndex: 0 };

    case 'APPROVE': {
      const grantedLabel = scenario.approval?.title ?? 'Action approved';
      const next = stepAfter(scenario, runtime.state);
      return {
        ...runtime,
        state: next,
        approvalsGranted: [...runtime.approvalsGranted, grantedLabel],
      };
    }

    case 'REJECT':
      return { ...runtime, state: 'blocked' };

    case 'PAUSE':
      return runtime.state === 'running' ? { ...runtime, state: 'paused' } : runtime;

    case 'RESUME':
      return runtime.state === 'paused' ? { ...runtime, state: 'running' } : runtime;

    case 'STOP':
      return { ...runtime, state: 'failed' };

    case 'FAIL':
      return { ...runtime, state: 'failed' };

    case 'RECOVER':
      return { ...runtime, state: 'running' };

    case 'COMPLETE':
      return { ...runtime, state: 'completed', completedAt: Date.now() };

    case 'JUMP_TO':
      return { ...runtime, state: event.target };

    case 'RESET':
      return createInitialRuntime(scenario.id);

    default:
      return runtime;
  }
}

export function defaultEventForState(state: OperatorState): OperatorEvent {
  switch (state) {
    case 'idle':
      return { type: 'START_ANALYSIS' };
    case 'analyzing':
      return { type: 'REQUIREMENTS_RESOLVED' };
    case 'requirements_detected':
      return { type: 'OPEN_REQUIREMENT_PROMPT' };
    case 'permission_required':
      return { type: 'PERMISSION_GRANTED' };
    case 'connection_required':
      return { type: 'CONNECTION_OPENED' };
    case 'installation_required':
      return { type: 'COMPANION_INSTALLED' };
    case 'manual_takeover_required':
      return { type: 'MANUAL_TAKEOVER_DONE' };
    case 'plan_ready':
      return { type: 'PLAN_CONFIRMED' };
    case 'running':
      return { type: 'COMPLETE' };
    case 'paused':
      return { type: 'RESUME' };
    case 'approval_required':
      return { type: 'APPROVE' };
    case 'blocked':
      return { type: 'RESET' };
    case 'failed':
      return { type: 'RECOVER' };
    case 'completed':
      return { type: 'RESET' };
    default:
      return { type: 'RESET' };
  }
}
