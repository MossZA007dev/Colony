// Workflow, canvas, run, approval, safety, audit, and template types.
// Extracted from src/App.tsx as part of Phase 1 of the file split refactor.
// Definitions are byte-for-byte the originals so behavior stays identical.

import type { AgentCapability } from '../aiOrchestration';

// ── Canvas / agent shape ──────────────────────────────────────────────────────

export type CanvasTool = 'select' | 'pan' | 'connect';
export type AgentStatus = 'idle' | 'running' | 'done' | 'waiting' | 'failed';
export type AgentType = 'ant' | 'collector' | 'cleaner' | 'analyst' | 'writer' | 'guard';
export type CanvasAgentType = AgentType | 'custom';

export type AgentModel = 'Fast' | 'Balanced' | 'Accurate';

export type AgentError = {
  title: string;
  message: string;
  failedStep: string;
  suggestedFix: string;
};

// ── Trigger / scheduling ──────────────────────────────────────────────────────

export type WorkflowTriggerType = 'manual' | 'daily' | 'weekly' | 'file-upload' | 'sheet-row' | 'webhook';

export type WorkflowSchedule = {
  triggerType: WorkflowTriggerType;
  scheduleEnabled: boolean;
  time: string;
  timezone: string;
  weekdays: string[];
};

export type WorkflowInputType = 'file-upload' | 'screenshot' | 'google-sheets' | 'text-prompt' | 'api-data' | 'manual-entry' | 'ai-ant-data';
export type WorkflowOutputType = 'report' | 'pdf' | 'csv' | 'chat-message' | 'email-draft' | 'dashboard-card' | 'approval-card' | 'sheet-update';

export type WorkflowStep = {
  id: string;
  agentId: string;
  name: string;
  inputFrom: string;
  inputType: string;
  outputTo: string;
  outputType: string;
};

export type BranchRule = {
  id: string;
  name: string;
  enabled: boolean;
  metric: string;
  operator: string;
  value: string;
  thenAction: string;
  elseAction: string;
};

export type WorkflowConfig = {
  inputs: WorkflowInputType[];
  outputs: WorkflowOutputType[];
  steps: WorkflowStep[];
  branchRules: BranchRule[];
};

export type LoopSource = 'none' | 'files' | 'rows' | 'orders' | 'messages' | 'custom';

export type LoopConfig = {
  enabled: boolean;
  source: LoopSource;
  totalItems: number;
  currentItem: number;
  maxItems: number;
  skipFailedItems: boolean;
};

export type ParallelGroup = {
  id: string;
  name: string;
  agentIds: string[];
};

// ── Execution / mode / version ────────────────────────────────────────────────

export type WorkflowExecutionStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'completed' | 'failed' | 'waiting-approval';

export type WorkflowExecution = {
  status: WorkflowExecutionStatus;
  currentStepIndex: number;
  executionMode: 'sequential' | 'parallel';
  parallelEnabled: boolean;
  startedAt: string | null;
  pausedAt: string | null;
  stoppedAt: string | null;
};

export type WorkflowMode = 'draft' | 'live';

export type WorkflowVersionSnapshot = {
  agentCount: number;
  agentLabels: string[];
  connectionCount: number;
  inputSummary: string;
  outputSummary: string;
  instructionsSummary: string;
};

export type WorkflowVersion = {
  id: string;
  version: number;
  title: string;
  timestamp: string;
  author: string;
  isCurrent: boolean;
  snapshot: WorkflowVersionSnapshot;
};

// ── Template ──────────────────────────────────────────────────────────────────

export type TemplateCategory = 'Restaurant' | 'Sales' | 'Content' | 'File-to-Report' | 'Research' | 'Customer Support' | 'Custom';

export type WorkflowTemplate = {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  includeAgents: boolean;
  includeInstructions: boolean;
  includeIO: boolean;
  includeBranching: boolean;
  includeApproval: boolean;
};

// ── Approval / safety / risk ──────────────────────────────────────────────────

export type StepApprovalConfig = {
  requiresApproval: boolean;
  approvalReason: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  approvalOwner: 'Me' | 'Team owner' | 'Manager' | 'Custom';
  actionType: string;
};

export type ApprovalRequest = {
  id: string;
  title: string;
  workflowId: string;
  agentId: string;
  agentName: string;
  actionType: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'Approved' | 'Rejected' | 'Edited';
  requestedBy: string;
  approvedBy: string | null;
  createdAt: string;
  resolvedAt: string | null;
  summary: string;
  previewContent: string;
  notes: string;
};

export type ApprovalRule = {
  id: string;
  name: string;
  conditionType: string;
  operator: string;
  value: string;
  action: string;
  enabled: boolean;
};

export type SafetyConfig = {
  safetyMode: boolean;
  defaultToolAccess: 'Read only' | 'Read & write';
  requireApprovalForSend: boolean;
  requireApprovalForExport: boolean;
  requireApprovalForWrite: boolean;
  requireConfirmationForDelete: boolean;
  requireConfirmationForHighRisk: boolean;
  blockOnValidationErrors: boolean;
};

export type RiskAssessment = {
  riskLevel: 'Low' | 'Medium' | 'High';
  reason: string;
  approvalRequired: boolean;
  confirmationRequired: boolean;
};

export type PendingAction = {
  id: string;
  actionName: string;
  actionType: string;
  requestedByAgentId: string;
  requestedByAgentName: string;
  workflowStep: string;
  destination: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  reason: string;
  previewContent: string;
};

export type SafetyRule = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
};

// ── Audit log ────────────────────────────────────────────────────────────────

export type AuditActorType = 'User' | 'Agent' | 'System' | 'Approval';
export type AuditActionType =
  | 'agent-added' | 'agent-deleted' | 'agent-edited' | 'agent-disabled' | 'agent-enabled'
  | 'connection-added' | 'connection-deleted'
  | 'workflow-run' | 'workflow-saved' | 'workflow-published' | 'workflow-restored'
  | 'approval-approved' | 'approval-rejected' | 'approval-edited'
  | 'safety-enabled' | 'safety-disabled' | 'safety-rule-changed'
  | 'model-changed' | 'data-edit' | 'tool-access-changed'
  | 'connector-connected' | 'connector-disconnected'
  | 'plan-upgraded' | 'system-init';
export type AuditRollbackStatus = 'none' | 'pending' | 'rolled-back';
export type AuditLog = {
  id: string;
  timestamp: string;
  actorType: AuditActorType;
  actorName: string;
  actionType: AuditActionType;
  title: string;
  description: string;
  workflowName: string;
  stepName?: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  status: 'Success' | 'Failed' | 'Pending';
  reversible: boolean;
  rollbackStatus: AuditRollbackStatus;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

// ── Runs ──────────────────────────────────────────────────────────────────────

export type RunStatus = 'Completed' | 'Failed' | 'Running' | 'Paused' | 'Stopped' | 'Waiting Approval' | 'Cancelled';
export type RunTrigger = 'Manual' | 'Schedule' | 'Webhook' | 'File upload' | 'API' | 'Email';
export type RunStepStatus = 'Completed' | 'Failed' | 'Running' | 'Skipped' | 'Waiting Approval' | 'Pending';
export type RunError = {
  errorType: string;
  failedStepId: string;
  failedAgentName: string;
  message: string;
  likelyCause: string;
  suggestedFix: string;
  severity: 'Warning' | 'Error' | 'Critical';
};
export type RunStep = {
  id: string;
  agentId: string;
  agentName: string;
  role: string;
  status: RunStepStatus;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  inputSource: string;
  outputProduced: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  summary: string;
  error?: RunError;
};
export type WorkflowRun = {
  id: string;
  runNumber: number;
  workflowId: string;
  workflowName: string;
  status: RunStatus;
  triggerType: RunTrigger;
  startedAt: string;
  completedAt?: string;
  durationSeconds: number;
  agentsUsed: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  creditsUsed: number;
  estimatedCost: number;
  outputType: string;
  outputSummary?: string;
  approvalStatus?: 'Approved' | 'Pending' | 'Rejected' | 'None';
  safetyMode: boolean;
  steps: RunStep[];
  error?: RunError;
};

// ── Workflow builder (second cluster) ────────────────────────────────────────

export type WorkflowDestinationType = 'chat' | 'download' | 'google_drive' | 'project_deliverables' | 'email_after_approval' | 'csv' | 'pdf' | 'notion' | 'google_sheets' | 'gmail' | 'sheets' | 'webhook';
export type WorkflowStatus = 'draft' | 'ready_to_test' | 'testing' | 'ready_to_activate' | 'active' | 'paused' | 'failed';
export type WorkflowNodeType = 'trigger' | 'source' | 'ai_step' | 'condition' | 'transform' | 'tool_action' | 'connector' | 'approval' | 'output' | 'notification';
export type WorkflowNodeStatus = 'idle' | 'configured' | 'warning' | 'waiting' | 'running' | 'success' | 'failed' | 'needs_approval' | 'skipped';
export type WorkflowEdgeStatus = 'idle' | 'active' | 'success' | 'failed' | 'approval';
export type WorkflowConnectorStatus = 'connected' | 'not_connected' | 'permission_required';
export type ModelRoutingPreference = 'auto' | 'fast' | 'balanced' | 'best_quality' | 'low_cost' | 'manual';
export type WorkflowTriggerKind = 'manual' | 'schedule' | 'webhook' | 'file_added' | 'app_event';
export type WorkflowSourceType = 'file_upload' | 'browser' | 'google_drive' | 'notion' | 'gmail' | 'sheets' | 'manual_input';
export type WorkflowOutputFormat = 'summary' | 'table' | 'bullet_points' | 'report' | 'json' | 'email_draft';
export type WorkflowTone = 'neutral' | 'professional' | 'friendly' | 'concise';
export type WorkflowTransformType = 'clean' | 'filter' | 'merge' | 'format' | 'extract_fields';
export type WorkflowApprovalType = 'before_external_action' | 'before_saving' | 'before_sending' | 'manual_review';
export type WorkflowFileFormat = 'markdown' | 'pdf' | 'docx' | 'csv' | 'json' | 'plain_text';
export type WorkflowNotificationChannel = 'in_app' | 'email' | 'line' | 'slack' | 'discord';
export type WorkflowErrorHandling = 'continue' | 'retry' | 'stop' | 'ask_user';
export type WorkflowValidationState = {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
};
export type WorkflowNodeConfig = {
  triggerType?: WorkflowTriggerKind;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
    dayOfWeek?: string;
    time?: string;
    timezone?: string;
  };
  sourceType?: WorkflowSourceType;
  connectionStatus?: WorkflowConnectorStatus;
  selectedSource?: string;
  readMode?: 'read_only' | 'extract' | 'sync';
  instruction?: string;
  inputFrom?: string[];
  outputFormat?: WorkflowOutputFormat;
  tone?: WorkflowTone;
  modelPreference?: ModelRoutingPreference;
  modelRouting?: ModelRoutingPreference;
  assignedAgent?: string;
  reviewRequired?: boolean;
  transformType?: WorkflowTransformType;
  fields?: string[];
  outputSchema?: Record<string, string>;
  conditionText?: string;
  truePathLabel?: string;
  falsePathLabel?: string;
  approvalRequired?: boolean;
  approvalType?: WorkflowApprovalType;
  approver?: 'user' | 'workspace_admin';
  message?: string;
  destination?: WorkflowDestinationType;
  format?: WorkflowFileFormat;
  fileName?: string;
  folderPath?: string;
  channel?: WorkflowNotificationChannel;
  messageTemplate?: string;
  sendAfter?: string;
  errorHandling?: WorkflowErrorHandling;
  // Backward-compatible display/runtime fields used by older Colony UI pieces.
  capability?: AgentCapability;
  model?: string;
  action?: string;
  rule?: string;
  approvalBefore?: string;
  approvalMode?: string;
  sourcePath?: string;
  timezone?: string;
};
export type ManualModelSelection = {
  capability: string;
  provider: string;
  modelId: string;
};
export type NodeChange = {
  field: string;
  before: any;
  after: any;
};
export type NodeInstruction = {
  id: string;
  text: string;
  createdAt: string;
  appliedChanges: NodeChange[];
};

export type WorkflowTrigger = {
  type: 'manual' | 'schedule' | 'event';
  label: string;
  schedule?: string;
  timezone?: string;
  enabled: boolean;
};

export type WorkflowNode = {
  id: string;
  type: WorkflowNodeType;
  title: string;
  description?: string;
  position: { x: number; y: number };
  status: WorkflowNodeStatus;
  config: WorkflowNodeConfig;
  promptNote?: string;
  userInstructions?: NodeInstruction[];
  instructionHistory?: NodeInstruction[];
  modelRoutingPreference?: ModelRoutingPreference;
  selectedModel?: ManualModelSelection;
  validation?: WorkflowValidationState;
};

export type WorkflowEdge = {
  id: string;
  from: string;
  to: string;
  status?: WorkflowEdgeStatus;
  animated?: boolean;
};

export type WorkflowConnector = {
  id: string;
  provider: string;
  status: WorkflowConnectorStatus;
  scopes: string[];
};

export type WorkflowApprovalRule = {
  id: string;
  before: string;
  approver: 'current_user' | 'project_owner';
  mode: 'once' | 'every_run' | 'risk_detected';
  message: string;
};

export type WorkflowRunLog = {
  id: string;
  time: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  nodeId?: string;
};

export type WorkflowBuilderRun = {
  id: string;
  status: 'running' | 'success' | 'failed' | 'needs_approval';
  startedAt: string;
  endedAt?: string;
  logs: WorkflowRunLog[];
};

export type Workflow = {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  connectors?: WorkflowConnector[];
  approvals?: WorkflowApprovalRule[];
  runHistory?: WorkflowBuilderRun[];
  status: WorkflowStatus;
  createdAt: string;
  updatedAt: string;
};

export type WorkflowProposal = {
  id: string;
  prompt: string;
  goal: string;
  trigger: WorkflowTrigger;
  sources: string[];
  steps: string[];
  outputs: string[];
  approval: string;
  destination: WorkflowDestinationType;
  destinationLabel: string;
  connectorsNeeded: string[];
  complexity: 'Low' | 'Medium' | 'High';
};
