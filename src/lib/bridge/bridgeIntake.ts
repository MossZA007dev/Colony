import { OPERATOR_SCENARIOS, DEFAULT_SCENARIO_ID, findScenario } from '../../pages/bridge/state/operatorScenarios';
import type { OperatorScenario } from '../../pages/bridge/state/operatorTypes';
import type { BridgeSession } from './bridgeSessionStore';

export interface BridgeTaskClassification {
  scenarioId: string;
  scenarioLabel: string;
  reason: string;
}

export function classifyTaskForBridge(taskText: string): BridgeTaskClassification {
  const t = taskText.toLowerCase();
  if (/(resume|cv|job|application|recruiter|hir(e|ing))/.test(t)) {
    const s = findScenario('resume-assistance');
    return {
      scenarioId: s.id,
      scenarioLabel: s.label,
      reason: 'Personal documents and external job platforms need controlled access and manual final submission.',
    };
  }
  if (/(drive|gmail|email|inbox|reply|proposal|contract)/.test(t)) {
    const s = findScenario('connected-apps');
    return {
      scenarioId: s.id,
      scenarioLabel: s.label,
      reason: 'Reading from Drive and drafting in Gmail needs a connection scope and approval before sending.',
    };
  }
  if (/(phone|mobile|device|transfer|move (the|file)|pair|companion)/.test(t)) {
    const s = findScenario('device-transfer');
    return {
      scenarioId: s.id,
      scenarioLabel: s.label,
      reason: 'Cross-device file work needs the mobile companion and explicit folder approval.',
    };
  }
  // Default to web research — the safest public scenario.
  const s = findScenario(DEFAULT_SCENARIO_ID);
  return {
    scenarioId: s.id,
    scenarioLabel: s.label,
    reason: 'Browser research, structured extraction, and approval before any external save.',
  };
}

export function buildSessionDraftTitle(taskText: string, scenario: OperatorScenario): string {
  const clean = taskText.trim().replace(/\s+/g, ' ');
  if (clean.length === 0) return scenario.label;
  const max = 64;
  if (clean.length <= max) return clean[0].toUpperCase() + clean.slice(1);
  return clean.slice(0, max - 1).trim() + '…';
}

export function createBridgeSessionFromTask(args: {
  taskText: string;
  sourceConversationId?: string;
}): BridgeSession {
  const classification = classifyTaskForBridge(args.taskText);
  const scenario = findScenario(classification.scenarioId);
  const id = `bsess-${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
  const now = Date.now();
  return {
    id,
    title: buildSessionDraftTitle(args.taskText, scenario),
    taskPrompt: args.taskText.trim() || scenario.task,
    scenarioId: scenario.id,
    sourceConversationId: args.sourceConversationId,
    status: 'running',
    operatorState: 'running',
    activityLog: [],
    deliverableIds: [],
    createdAt: now,
    updatedAt: now,
  };
}

export { OPERATOR_SCENARIOS };
