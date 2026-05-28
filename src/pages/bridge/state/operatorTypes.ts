export type OperatorState =
  | 'idle'
  | 'analyzing'
  | 'requirements_detected'
  | 'capability_check'
  | 'permission_required'
  | 'connection_required'
  | 'installation_required'
  | 'manual_takeover_required'
  | 'plan_ready'
  | 'running'
  | 'paused'
  | 'approval_required'
  | 'blocked'
  | 'failed'
  | 'completed';

export type CapabilityStatus =
  | 'ready'
  | 'permission_needed'
  | 'connection_needed'
  | 'installation_needed'
  | 'manual_only'
  | 'restricted'
  | 'unsupported';

export type CapabilityType = 'browser' | 'file' | 'app' | 'device' | 'external_action';

export type WorkspacePreviewType =
  | 'browser'
  | 'file'
  | 'spreadsheet'
  | 'email_draft'
  | 'device_pairing'
  | 'transfer_progress'
  | 'empty'
  | 'unsupported';

export type RiskLevel =
  | 'read_only'
  | 'draft_only'
  | 'approval_required'
  | 'manual_required'
  | 'restricted';

export type ApprovalActionType =
  | 'save_external_file'
  | 'send_message'
  | 'submit_form'
  | 'upload_personal_file'
  | 'edit_external_data'
  | 'delete_data'
  | 'publish_content';

export interface CapabilityRequirement {
  id: string;
  label: string;
  type: CapabilityType;
  status: CapabilityStatus;
  scope?: string;
  note?: string;
}

export interface TaskStep {
  id: string;
  label: string;
  status: 'complete' | 'active' | 'waiting' | 'blocked';
}

export interface ActivityEvent {
  id: string;
  time: string;
  label: string;
  status: 'complete' | 'active' | 'warning' | 'waiting';
}

export interface ApprovalRequest {
  id: string;
  title: string;
  actionType: ApprovalActionType;
  description: string;
  includedData?: string[];
  destination?: string;
}

export type WorkspacePreviewPayload =
  | {
      type: 'browser';
      title: string;
      url: string;
      highlights: { label: string; value: string }[];
      statusLine: string;
    }
  | {
      type: 'file';
      fileName: string;
      fileKind: 'pdf' | 'doc' | 'sheet' | 'image' | 'other';
      summary: string;
      bullets: string[];
    }
  | {
      type: 'spreadsheet';
      title: string;
      columns: string[];
      rows: string[][];
      statusLine: string;
    }
  | {
      type: 'email_draft';
      from: string;
      to: string;
      subject: string;
      body: string;
      statusLine: string;
    }
  | {
      type: 'device_pairing';
      deviceLabel: string;
      statusLine: string;
    }
  | {
      type: 'transfer_progress';
      from: string;
      to: string;
      fileName: string;
      sizeLabel: string;
      progress: number;
    }
  | { type: 'empty' }
  | {
      type: 'unsupported';
      reason: string;
      alternatives: string[];
    };

export interface DeliverableReceipt {
  title: string;
  description: string;
  actionsPerformed: string[];
  toolsUsed: string[];
  approvalsGranted: string[];
  manualSteps?: string[];
}

export interface PermissionPrompt {
  title: string;
  resource: string;
  scope: string;
  uses: string[];
}

export interface ConnectionPrompt {
  appName: string;
  appAccentClass: string;
  scope: string;
  willAllow: string[];
  willNotDo: string[];
}

export interface InstallationPrompt {
  deviceLabel: string;
  steps: string[];
}

export interface ManualTakeoverPrompt {
  reason: string;
  userSteps: string[];
  operatorCanHelp: string[];
}

export interface FailureContext {
  title: string;
  detail: string;
  completed: string[];
  waiting: string[];
}

export interface OperatorScenario {
  id: string;
  label: string;
  task: string;
  stateSequence: OperatorState[];
  riskLevel: RiskLevel;
  requirements: CapabilityRequirement[];
  plan: TaskStep[];
  preview: WorkspacePreviewPayload;
  previewByState?: Partial<Record<OperatorState, WorkspacePreviewPayload>>;
  activities: ActivityEvent[];
  permissionPrompt?: PermissionPrompt;
  connectionPrompt?: ConnectionPrompt;
  installationPrompt?: InstallationPrompt;
  manualTakeoverPrompt?: ManualTakeoverPrompt;
  failureContext?: FailureContext;
  approval?: ApprovalRequest;
  deliverable?: DeliverableReceipt;
}

export interface OperatorRuntime {
  scenarioId: string;
  state: OperatorState;
  taskText: string;
  followUps: { id: string; text: string; createdAt: number }[];
  startedAt: number | null;
  completedAt: number | null;
  approvalsGranted: string[];
  manualStepsCompleted: string[];
  runningStepIndex: number;
}

export type OperatorEvent =
  | { type: 'INPUT_TASK'; text: string }
  | { type: 'FOLLOW_UP'; text: string }
  | { type: 'START_ANALYSIS' }
  | { type: 'REQUIREMENTS_RESOLVED' }
  | { type: 'OPEN_REQUIREMENT_PROMPT' }
  | { type: 'PERMISSION_GRANTED' }
  | { type: 'PERMISSION_DENIED' }
  | { type: 'CONNECTION_OPENED' }
  | { type: 'COMPANION_INSTALLED' }
  | { type: 'MANUAL_TAKEOVER_DONE' }
  | { type: 'PLAN_CONFIRMED' }
  | { type: 'APPROVE' }
  | { type: 'REJECT' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'STOP' }
  | { type: 'FAIL' }
  | { type: 'RECOVER' }
  | { type: 'COMPLETE' }
  | { type: 'JUMP_TO'; target: OperatorState }
  | { type: 'RESET' };
