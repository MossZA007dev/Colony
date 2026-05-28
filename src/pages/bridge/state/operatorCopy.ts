import type {
  ApprovalActionType,
  CapabilityStatus,
  OperatorState,
  RiskLevel,
} from './operatorTypes';

export const STATE_LABEL: Record<OperatorState, string> = {
  idle: 'Ready',
  analyzing: 'Analyzing',
  requirements_detected: 'Requirements detected',
  capability_check: 'Capability check',
  permission_required: 'Permission required',
  connection_required: 'Connection required',
  installation_required: 'Companion required',
  manual_takeover_required: 'Your action required',
  plan_ready: 'Plan ready',
  running: 'Working now',
  paused: 'Paused',
  approval_required: 'Approval required',
  blocked: 'Blocked',
  failed: 'Interrupted',
  completed: 'Completed',
};

export const STATE_HEADLINE: Record<OperatorState, string> = {
  idle: 'What would you like me to do?',
  analyzing: 'Understanding your request',
  requirements_detected: 'Task requirements detected',
  capability_check: 'Checking available capabilities',
  permission_required: 'Permission required to continue',
  connection_required: 'A connection is needed to continue',
  installation_required: 'Companion app required to continue',
  manual_takeover_required: 'Your action is required',
  plan_ready: 'Action plan ready',
  running: 'Working on your task',
  paused: 'Task paused',
  approval_required: 'A sensitive action needs your approval',
  blocked: 'This step is not currently supported',
  failed: 'Connection interrupted',
  completed: 'Task completed',
};

export const STATE_SUBLINE: Record<OperatorState, string> = {
  idle: 'Describe a task involving browser, files, apps, or devices.',
  analyzing: 'Identifying tools, permissions, and actions needed for this task.',
  requirements_detected: 'Here is what this task will need before I start working.',
  capability_check: 'Confirming what is ready, what needs setup, and what needs your approval.',
  permission_required: 'I will only ask for the access this task actually needs.',
  connection_required: 'I will only request the smallest scope that gets the work done.',
  installation_required: 'A trusted companion is required to reach this device safely.',
  manual_takeover_required: 'I prepared what I could. You finish the sensitive part safely.',
  plan_ready: 'Review the plan and access scope before I begin.',
  running: 'Visible execution. Pause or stop any time.',
  paused: 'Resume when you are ready.',
  approval_required: 'Review what will happen, then approve or reject.',
  blocked: 'I will not try to bypass this. Here is what we can do instead.',
  failed: 'I saved progress where I could. You can recover the next steps.',
  completed: 'Here is what I did and what tools were involved.',
};

export const RISK_LABEL: Record<RiskLevel, string> = {
  read_only: 'Read only',
  draft_only: 'Draft only',
  approval_required: 'Approval required',
  manual_required: 'Your action required',
  restricted: 'Restricted',
};

export const RISK_DESCRIPTION: Record<RiskLevel, string> = {
  read_only: 'Reads selected information without making changes.',
  draft_only: 'Prepares an output but does not send or publish it.',
  approval_required: 'A sensitive external action is waiting for your approval.',
  manual_required: 'You will complete or authorize the sensitive step yourself.',
  restricted: 'This action cannot be automated safely in the current setup.',
};

export const CAPABILITY_STATUS_LABEL: Record<CapabilityStatus, string> = {
  ready: 'Ready',
  permission_needed: 'Permission needed',
  connection_needed: 'Connect',
  installation_needed: 'Install required',
  manual_only: 'Manual assistance',
  restricted: 'Restricted',
  unsupported: 'Not supported',
};

export const APPROVAL_ACTION_LABEL: Record<ApprovalActionType, string> = {
  save_external_file: 'Save to an external location',
  send_message: 'Send a message',
  submit_form: 'Submit a form',
  upload_personal_file: 'Upload a personal file',
  edit_external_data: 'Edit external data',
  delete_data: 'Delete data',
  publish_content: 'Publish content',
};
