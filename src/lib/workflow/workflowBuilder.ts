import { Brain, Calendar, FileText, Filter, FolderOpen, Layers3, MessageSquare, Plug, ShieldCheck } from 'lucide-react';
import type React from 'react';
import { resolveModelForCapability } from '../aiOrchestration';
import type { AgentCapability } from '../aiOrchestration';
import { readableField } from '../aiAnt/aiAntHelpers';
import type { NodeChange, NodeInstruction, Workflow, WorkflowConnector, WorkflowDestinationType, WorkflowEdge, WorkflowNode, WorkflowNodeConfig, WorkflowNodeStatus, WorkflowNodeType, WorkflowOutputFormat, WorkflowSourceType, WorkflowValidationState } from '../types/workflowTypes';

export const WORKFLOW_DESTINATION_OPTIONS: Array<{ value: WorkflowDestinationType; label: string; requiresConnector?: string }> = [
  { value: 'chat', label: 'Chat result' },
  { value: 'download', label: 'Download file' },
  { value: 'google_drive', label: 'Save to Google Drive', requiresConnector: 'Google Drive' },
  { value: 'project_deliverables', label: 'Save to project deliverables' },
  { value: 'email_after_approval', label: 'Send email after approval', requiresConnector: 'Gmail' },
  { value: 'gmail', label: 'Gmail draft', requiresConnector: 'Gmail' },
  { value: 'csv', label: 'Export CSV' },
  { value: 'pdf', label: 'Export PDF' },
  { value: 'notion', label: 'Save to Notion', requiresConnector: 'Notion' },
  { value: 'google_sheets', label: 'Update spreadsheet', requiresConnector: 'Google Sheets' },
  { value: 'sheets', label: 'Google Sheets', requiresConnector: 'Google Sheets' },
  { value: 'webhook', label: 'Webhook', requiresConnector: 'Webhook' },
];

export const workflowNodeIcon: Record<WorkflowNodeType, React.ElementType> = {
  trigger: Calendar, source: FolderOpen, ai_step: Brain, tool_action: Plug, connector: Plug,
  approval: ShieldCheck, output: FileText, notification: MessageSquare,
  condition: Filter, transform: Layers3,
};

export const workflowNodeTone: Record<WorkflowNodeType, string> = {
  trigger: 'border-cyan-400/25 bg-cyan-400/[0.08] text-cyan-200',
  source: 'border-blue-400/25 bg-blue-400/[0.08] text-blue-200',
  ai_step: 'border-violet-400/25 bg-violet-400/[0.08] text-violet-200',
  tool_action: 'border-sky-400/25 bg-sky-400/[0.08] text-sky-200',
  connector: 'border-sky-400/25 bg-sky-400/[0.08] text-sky-200',
  approval: 'border-amber-400/25 bg-amber-400/[0.08] text-amber-200',
  output: 'border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-200',
  notification: 'border-fuchsia-400/25 bg-fuchsia-400/[0.08] text-fuchsia-200',
  condition: 'border-indigo-400/25 bg-indigo-400/[0.08] text-indigo-200',
  transform: 'border-teal-400/25 bg-teal-400/[0.08] text-teal-200',
};

export const workflowStatusTone: Record<WorkflowNodeStatus, string> = {
  idle: 'border-white/[0.08] bg-white/[0.04] text-white/42',
  configured: 'border-emerald-300/25 bg-emerald-400/[0.08] text-emerald-100',
  warning: 'border-amber-300/35 bg-amber-400/[0.10] text-amber-100',
  waiting: 'border-white/[0.12] bg-white/[0.06] text-white/62',
  running: 'border-cyan-300/35 bg-cyan-400/[0.10] text-cyan-100',
  success: 'border-emerald-300/30 bg-emerald-400/[0.09] text-emerald-100',
  failed: 'border-rose-300/30 bg-rose-400/[0.09] text-rose-100',
  needs_approval: 'border-amber-300/35 bg-amber-400/[0.10] text-amber-100',
  skipped: 'border-white/[0.08] bg-white/[0.03] text-white/28',
};

export const WORKFLOW_NODE_SIZE = { width: 270, height: 132 };
export const WORKFLOW_CANVAS_SIZE = { width: 1900, height: 1120 };
export const WORKFLOW_NODE_GAP = { x: 32, y: 40 };
export const WORKFLOW_LOGS_COLLAPSED_HEIGHT = 52;
export const WORKFLOW_LOGS_EXPANDED_HEIGHT = 220;
export const WORKFLOW_CANVAS_BOTTOM_GUTTER = WORKFLOW_LOGS_EXPANDED_HEIGHT + 56;
export const WORKFLOW_Z = {
  grid: 0,
  edge: 1,
  node: 5,
  selectedNode: 10,
  toolbar: 20,
  runLogs: 30,
  popover: 40,
  inspector: 50,
  modal: 100,
  toast: 200,
} as const;

export const WORKFLOW_NODE_TYPE_OPTIONS: Array<{ type: WorkflowNodeType; label: string; description: string }> = [
  { type: 'ai_step', label: 'AI Step', description: 'Analyze, summarize, extract, or generate with AI Ant.' },
  { type: 'source', label: 'Source', description: 'Read files, sheets, emails, browser, or manual input.' },
  { type: 'approval', label: 'Approval', description: 'Pause before saving, sending, editing, or spending.' },
  { type: 'output', label: 'Output', description: 'Choose where the final result goes.' },
  { type: 'condition', label: 'Condition', description: 'Branch based on data, risk, or confidence.' },
  { type: 'notification', label: 'Notification', description: 'Notify the user after a run or approval.' },
  { type: 'connector', label: 'Connector', description: 'Use a connected app after explicit permission.' },
  { type: 'tool_action', label: 'Tool Action', description: 'Use a connector after explicit permission.' },
  { type: 'transform', label: 'Transform', description: 'Clean, format, merge, or reshape data.' },
];

export const WORKFLOW_TEMPLATES: Array<{ id: string; label: string; destination: WorkflowDestinationType; source: string; steps: string[] }> = [
  { id: 'daily-report', label: 'Daily report', destination: 'project_deliverables', source: 'Sales file', steps: ['Clean and validate', 'Analyze key info', 'Generate report'] },
  { id: 'weekly-email', label: 'Weekly email summary', destination: 'email_after_approval', source: 'Gmail source', steps: ['Filter important messages', 'Summarize threads', 'Write email draft'] },
  { id: 'file-report', label: 'File to report', destination: 'download', source: 'Upload file', steps: ['Extract data', 'Analyze key info', 'Generate result'] },
  { id: 'sales-sheet', label: 'Sales spreadsheet analysis', destination: 'google_sheets', source: 'Google Sheets source', steps: ['Clean rows', 'Analyze trends', 'Update spreadsheet'] },
  { id: 'research-monitor', label: 'Research monitoring', destination: 'notion', source: 'Browser source', steps: ['Collect findings', 'Classify updates', 'Create Notion page'] },
  { id: 'content-approval', label: 'Content publishing approval', destination: 'email_after_approval', source: 'Manual input', steps: ['Write draft', 'Review output', 'Prepare publish packet'] },
  { id: 'lead-cleanup', label: 'Lead list cleanup', destination: 'google_sheets', source: 'Google Sheets source', steps: ['Clean lead data', 'Classify leads', 'Update spreadsheet'] },
];

export function workflowNodeTypeLabel(type: WorkflowNodeType) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function workflowHandlePoint(node: WorkflowNode, handle: 'input' | 'output') {
  const x = node.position.x + (handle === 'input' ? 0 : WORKFLOW_NODE_SIZE.width);
  const y = node.position.y + WORKFLOW_NODE_SIZE.height / 2;
  return { x, y };
}

export function workflowEdgePath(from: WorkflowNode, to: WorkflowNode) {
  const start = workflowHandlePoint(from, 'output');
  const end = workflowHandlePoint(to, 'input');
  const dx = Math.max(90, Math.abs(end.x - start.x) * 0.42);
  return `M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${end.x - dx} ${end.y}, ${end.x} ${end.y}`;
}

export function workflowEdgeTone(edge: WorkflowEdge, selected: boolean, to?: WorkflowNode) {
  if (selected) return { stroke: 'rgba(196,181,253,0.92)', glow: 'rgba(167,139,250,0.38)', width: 3.2 };
  if (edge.status === 'failed') return { stroke: 'rgba(251,113,133,0.82)', glow: 'rgba(244,63,94,0.34)', width: 2.8 };
  if (edge.status === 'approval' || to?.type === 'approval') return { stroke: 'rgba(251,191,36,0.72)', glow: 'rgba(251,191,36,0.26)', width: 2.6 };
  if (edge.status === 'success') return { stroke: 'rgba(52,211,153,0.76)', glow: 'rgba(34,211,238,0.25)', width: 2.6 };
  if (edge.status === 'active' || edge.animated) return { stroke: 'rgba(103,232,249,0.88)', glow: 'rgba(34,211,238,0.32)', width: 3 };
  return { stroke: 'rgba(148,163,184,0.28)', glow: 'transparent', width: 1.8 };
}

export function workflowNodesOverlap(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.abs(a.x - b.x) < WORKFLOW_NODE_SIZE.width + WORKFLOW_NODE_GAP.x
    && Math.abs(a.y - b.y) < WORKFLOW_NODE_SIZE.height + WORKFLOW_NODE_GAP.y;
}

export function findOpenWorkflowPosition(nodes: WorkflowNode[], preferred: { x: number; y: number }) {
  let candidate = {
    x: Math.max(80, Math.min(WORKFLOW_CANVAS_SIZE.width - WORKFLOW_NODE_SIZE.width - 80, preferred.x)),
    y: Math.max(80, Math.min(WORKFLOW_CANVAS_SIZE.height - WORKFLOW_NODE_SIZE.height - 100, preferred.y)),
  };
  for (let attempt = 0; attempt < 36; attempt += 1) {
    if (!nodes.some((node) => workflowNodesOverlap(candidate, node.position))) return candidate;
    const col = attempt % 4;
    const row = Math.floor(attempt / 4);
    candidate = {
      x: Math.max(80, Math.min(WORKFLOW_CANVAS_SIZE.width - WORKFLOW_NODE_SIZE.width - 80, preferred.x + col * (WORKFLOW_NODE_SIZE.width + 90))),
      y: Math.max(80, Math.min(WORKFLOW_CANVAS_SIZE.height - WORKFLOW_NODE_SIZE.height - 100, preferred.y + (row + 1) * (WORKFLOW_NODE_SIZE.height + 68))),
    };
  }
  return candidate;
}

export function getWorkflowConnector(workflow: Workflow, provider?: string) {
  if (!provider) return null;
  return workflow.connectors?.find((connector) => connector.provider === provider) ?? null;
}

export function workflowDestinationConnector(destination: WorkflowDestinationType) {
  return WORKFLOW_DESTINATION_OPTIONS.find((item) => item.value === destination)?.requiresConnector;
}

export function workflowDestinationConnectionKey(destination?: WorkflowDestinationType) {
  if (destination === 'google_drive') return 'Google Drive';
  if (destination === 'notion') return 'Notion';
  if (destination === 'gmail' || destination === 'email_after_approval') return 'Gmail';
  if (destination === 'google_sheets' || destination === 'sheets') return 'Google Sheets';
  if (destination === 'webhook') return 'Webhook';
  return null;
}

export function workflowSourceConnectionKey(sourceType?: WorkflowSourceType) {
  if (sourceType === 'google_drive') return 'Google Drive';
  if (sourceType === 'notion') return 'Notion';
  if (sourceType === 'gmail') return 'Gmail';
  if (sourceType === 'sheets') return 'Google Sheets';
  if (sourceType === 'browser') return 'Browser';
  return null;
}

export function isExternalWorkflowDestination(destination?: WorkflowDestinationType) {
  return Boolean(destination && !['chat', 'download', 'project_deliverables', 'csv', 'pdf'].includes(destination));
}

export function workflowConfigValue(config: WorkflowNodeConfig, field: string) {
  return field.split('.').reduce<any>((current, key) => current?.[key], config as any);
}

export function setWorkflowConfigValue(config: WorkflowNodeConfig, field: string, value: any): WorkflowNodeConfig {
  const keys = field.split('.');
  const next: any = { ...config };
  let cursor = next;
  keys.slice(0, -1).forEach((key) => {
    cursor[key] = { ...(cursor[key] ?? {}) };
    cursor = cursor[key];
  });
  cursor[keys[keys.length - 1]] = value;
  return next;
}

export function defaultWorkflowNodeConfig(type: WorkflowNodeType): WorkflowNodeConfig {
  if (type === 'trigger') return { triggerType: 'manual', schedule: { frequency: 'daily', time: '09:00', timezone: 'Asia/Bangkok' }, errorHandling: 'ask_user' };
  if (type === 'source') return { sourceType: 'manual_input', connectionStatus: 'connected', selectedSource: 'Manual input', readMode: 'extract', errorHandling: 'ask_user', capability: 'file_reading' };
  if (type === 'ai_step') return { instruction: 'Summarize the input and extract important details.', inputFrom: [], outputFormat: 'summary', tone: 'professional', modelPreference: 'balanced', reviewRequired: false, errorHandling: 'ask_user', capability: 'text_reasoning', model: resolveModelForCapability('text_reasoning').displayName };
  if (type === 'transform') return { transformType: 'clean', fields: [], outputSchema: {}, errorHandling: 'ask_user' };
  if (type === 'condition') return { conditionText: 'Continue if the input has enough information.', truePathLabel: 'Continue', falsePathLabel: 'Ask user', errorHandling: 'ask_user' };
  if (type === 'approval') return { approvalRequired: true, approvalType: 'before_external_action', approver: 'user', message: 'Review and approve before this workflow writes or sends externally.', approvalMode: 'approve every run', errorHandling: 'ask_user' };
  if (type === 'output') return { destination: 'chat', format: 'markdown', fileName: 'workflow-output-{date}', connectionStatus: 'connected', approvalRequired: false, errorHandling: 'ask_user', capability: 'connected_tool_action' };
  if (type === 'notification') return { channel: 'in_app', messageTemplate: 'Workflow completed: {workflowName}', sendAfter: 'workflow completes', errorHandling: 'continue' };
  return { connectionStatus: 'not_connected', action: 'connector_action', approvalRequired: true, errorHandling: 'ask_user', capability: 'connected_tool_action' };
}

export function applyWorkflowNodeValidation(node: WorkflowNode): WorkflowNode {
  const validation = validateWorkflowNode(node);
  return { ...node, validation, status: node.status === 'running' || node.status === 'success' || node.status === 'failed' || node.status === 'needs_approval' ? node.status : validation.isValid ? 'configured' : 'warning' };
}

export function workflowValidation(workflow: Workflow) {
  const trigger = workflow.nodes.find((node) => node.type === 'trigger');
  const outputs = workflow.nodes.filter((node) => node.type === 'output');
  const sources = workflow.nodes.filter((node) => node.type === 'source');
  const approvals = workflow.nodes.filter((node) => node.type === 'approval');
  const issues: Array<{ id: string; severity: 'error' | 'warning'; message: string; nodeId?: string }> = [];

  if (!trigger) issues.push({ id: 'missing-trigger', severity: 'error', message: 'Workflow needs a trigger.' });
  if (trigger && !validateWorkflowNode(trigger).isValid) issues.push({ id: 'trigger-config', severity: 'error', message: validateWorkflowNode(trigger).missingFields[0] ?? 'Trigger needs configuration.', nodeId: trigger.id });
  if (trigger && !workflow.edges.some((edge) => edge.from === trigger.id)) issues.push({ id: 'trigger-edge', severity: 'error', message: 'Trigger must connect to at least one next step.', nodeId: trigger.id });
  if (!sources.length) issues.push({ id: 'missing-source', severity: 'error', message: 'Workflow needs a source.' });
  sources.forEach((node) => {
    const validation = validateWorkflowNode(node);
    validation.missingFields.forEach((field) => issues.push({ id: `source-${node.id}-${field}`, severity: 'error', message: `${node.title}: ${field}`, nodeId: node.id }));
    validation.warnings.forEach((warning) => issues.push({ id: `source-warning-${node.id}-${warning}`, severity: 'warning', message: `${node.title}: ${warning}`, nodeId: node.id }));
  });
  if (!outputs.length) issues.push({ id: 'missing-output', severity: 'error', message: 'Workflow needs an output destination.' });
  workflow.nodes.filter((node) => ['ai_step', 'transform', 'condition', 'approval', 'output', 'notification', 'connector', 'tool_action'].includes(node.type)).forEach((node) => {
    const validation = validateWorkflowNode(node);
    validation.missingFields.forEach((field) => issues.push({ id: `node-${node.id}-${field}`, severity: 'error', message: `${node.title}: ${field}`, nodeId: node.id }));
    validation.warnings.forEach((warning) => issues.push({ id: `node-warning-${node.id}-${warning}`, severity: 'warning', message: `${node.title}: ${warning}`, nodeId: node.id }));
  });

  const reachable = new Set<string>();
  const visit = (nodeId: string) => {
    if (reachable.has(nodeId)) return;
    reachable.add(nodeId);
    workflow.edges.filter((edge) => edge.from === nodeId).forEach((edge) => visit(edge.to));
  };
  if (trigger) visit(trigger.id);
  if (outputs.length && !outputs.some((node) => reachable.has(node.id))) issues.push({ id: 'output-unreachable', severity: 'error', message: 'Output node is not reachable from the trigger.', nodeId: outputs[0].id });

  const hasCycle = workflow.nodes.some((node) => {
    const stack = new Set<string>();
    const walk = (id: string): boolean => {
      if (stack.has(id)) return true;
      stack.add(id);
      const result = workflow.edges.filter((edge) => edge.from === id).some((edge) => walk(edge.to));
      stack.delete(id);
      return result;
    };
    return walk(node.id);
  });
  if (hasCycle) issues.push({ id: 'cycle', severity: 'error', message: 'Circular loops are not supported for this MVP.' });

  const externalOutputs = outputs.filter((node) => isExternalWorkflowDestination(node.config.destination));
  if (externalOutputs.length && approvals.length === 0) issues.push({ id: 'approval-required', severity: 'error', message: 'Add approval before external write or send actions.', nodeId: externalOutputs[0].id });

  outputs.forEach((node) => {
    const destination = (node.config.destination ?? 'chat') as WorkflowDestinationType;
    const provider = workflowDestinationConnector(destination);
    const connector = getWorkflowConnector(workflow, provider);
    if (provider && connector?.status !== 'connected') {
      issues.push({ id: `connector-${node.id}`, severity: 'warning', message: `${provider} connector needs connection or permission before real activation.`, nodeId: node.id });
    }
  });

  return {
    issues,
    ready: issues.every((issue) => issue.severity !== 'error'),
    headline: issues.find((issue) => issue.severity === 'error')?.message ?? issues[0]?.message ?? 'Ready to activate',
  };
}

export function validateWorkflow(workflow: Workflow) {
  return workflowValidation(workflow);
}

export function makeWorkflowNode(type: WorkflowNodeType, position: { x: number; y: number }, title?: string): WorkflowNode {
  const label = title ?? workflowNodeTypeLabel(type);
  const node: WorkflowNode = {
    id: `wfn-${type}-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    type,
    title: label,
    description:
      type === 'ai_step' ? 'AI Ant processes the previous step and creates reviewable output.' :
      type === 'source' ? 'Choose a file, connector, app, or manual input.' :
      type === 'approval' ? 'Wait for human approval before risky actions.' :
      type === 'output' ? 'Route the workflow result to a chosen destination.' :
      type === 'condition' ? 'Choose a path based on data, risk, or confidence.' :
      type === 'notification' ? 'Notify the user when this workflow reaches a milestone.' :
      type === 'tool_action' || type === 'connector' ? 'Use a connected tool after permission checks.' :
      'Clean, format, or reshape workflow data.',
    position,
    status: 'idle',
    config: defaultWorkflowNodeConfig(type),
  };
  return applyWorkflowNodeValidation(node);
}

export function applyInstructionToNode(node: WorkflowNode, instructionText: string) {
  const text = instructionText.toLowerCase();
  const changes: NodeChange[] = [];
  const next: WorkflowNode = { ...node, config: { ...node.config } };
  const setField = (field: string, after: any) => {
    const before = field.startsWith('config.') ? workflowConfigValue(next.config, field.slice(7)) : (next as any)[field];
    if (JSON.stringify(before) === JSON.stringify(after)) return;
    changes.push({ field, before, after });
    if (field.startsWith('config.')) next.config = setWorkflowConfigValue(next.config, field.slice(7), after);
    else (next as any)[field] = after;
  };
  const time = parseInstructionTime(instructionText);
  const weekday = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].find((day) => text.includes(day));

  if (/every day|daily/.test(text)) {
    setField('config.triggerType', 'schedule');
    setField('config.schedule.frequency', 'daily');
    if (time) setField('config.schedule.time', time.value);
  }
  if (weekday || /every week|weekly/.test(text)) {
    const day = weekday ? weekday[0].toUpperCase() + weekday.slice(1) : 'Monday';
    setField('config.triggerType', 'schedule');
    setField('config.schedule.frequency', 'weekly');
    setField('config.schedule.dayOfWeek', day);
    if (time) setField('config.schedule.time', time.value);
  }
  if (time) setField('config.schedule.time', time.value);
  if (/google drive|\bdrive\b/.test(text)) {
    setField('config.destination', 'google_drive');
    if (node.type === 'source') setField('config.sourceType', 'google_drive');
    setField('config.folderPath', next.config.folderPath ?? '/Colony Reports');
    setField('config.connectionStatus', 'permission_required');
  }
  if (/notion/.test(text)) {
    setField('config.destination', 'notion');
    if (node.type === 'source') setField('config.sourceType', 'notion');
    setField('config.connectionStatus', 'permission_required');
  }
  if (/gmail|send email|email/.test(text)) {
    setField('config.destination', node.type === 'output' ? 'gmail' : 'email_after_approval');
    setField('config.action', 'send_email');
    setField('config.approvalRequired', true);
    setField('config.approvalType', 'before_sending');
    setField('config.connectionStatus', 'permission_required');
  }
  if (/approval|approve|before sending|before saving/.test(text)) {
    setField('config.approvalRequired', true);
    setField('config.approvalType', /sending|send/.test(text) ? 'before_sending' : /saving|save/.test(text) ? 'before_saving' : 'before_external_action');
    setField('config.approvalMode', 'approve every run');
  }
  if (/summari[sz]e|summary/.test(text)) setField('config.outputFormat', 'summary');
  if (/bullet|bullets/.test(text)) {
    setField('config.outputFormat', 'bullet_points');
    setField('config.format', 'markdown');
  }
  if (/\bcsv\b|clean csv/.test(text)) {
    setField('config.format', 'csv');
    setField('config.transformType', 'clean');
    if (node.type === 'ai_step' || node.type === 'transform') setField('title', /clean csv/.test(text) ? 'Clean CSV data' : node.title);
  }
  if (/pdf/.test(text)) setField('config.format', 'pdf');
  if (/short|concise|brief/.test(text)) {
    setField('config.tone', 'concise');
    if (/executive/.test(text)) setField('config.instruction', 'Produce a short executive summary with clear recommendations.');
  }
  if (/missing|error|fail|stop and ask|ask me/.test(text)) setField('config.errorHandling', 'ask_user');
  if (/fast|faster|fastest/.test(text)) setField('modelRoutingPreference', 'fast');
  if (/best quality|stronger|better output|complex reasoning/.test(text)) setField('modelRoutingPreference', 'best_quality');
  if (/low cost|cheapest|minimize usage cost|cheap/.test(text)) setField('modelRoutingPreference', 'low_cost');
  if (/balanced/.test(text)) setField('modelRoutingPreference', 'balanced');
  if (/manual model|specific model|choose model/.test(text)) setField('modelRoutingPreference', 'manual');
  if (next.modelRoutingPreference) {
    setField('config.modelPreference', next.modelRoutingPreference);
    setField('config.modelRouting', next.modelRoutingPreference);
  }
  if (instructionText.trim()) setField('promptNote', instructionText.trim());

  const validation = validateWorkflowNode(next);
  setField('validation', validation);
  setField('status', validation.isValid ? 'configured' : 'warning');
  return { node: next, changes };
}

export function parseInstructionTime(text: string) {
  const match = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = match[2] ?? '00';
  const meridiem = match[3].toLowerCase();
  if (meridiem === 'pm' && hour < 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;
  return { value: `${String(hour).padStart(2, '0')}:${minute}`, label: `${match[1]}:${minute} ${meridiem.toUpperCase()}` };
}

export function validateWorkflowNode(node: WorkflowNode): WorkflowValidationState {
  const missingFields: string[] = [];
  const warnings: string[] = [];
  const config = node.config;
  if (node.type === 'trigger') {
    if (!config.triggerType) missingFields.push('Trigger type is required.');
    if (config.triggerType === 'schedule') {
      if (!config.schedule?.frequency) missingFields.push('Schedule frequency is required.');
      if (!config.schedule?.time) missingFields.push('Schedule time is required.');
    }
  }
  if (node.type === 'source') {
    if (!config.sourceType) missingFields.push('Source type is required.');
    if (workflowSourceConnectionKey(config.sourceType) && config.connectionStatus !== 'connected') warnings.push(`${workflowSourceConnectionKey(config.sourceType)} is not connected.`);
    if (!config.selectedSource && config.sourceType !== 'manual_input') warnings.push('Selected source is empty.');
  }
  if (node.type === 'ai_step') {
    if (!(config.instruction || node.description || node.promptNote)) missingFields.push('Instruction is required.');
    if (!config.outputFormat) warnings.push('Output format is not selected.');
  }
  if (node.type === 'transform') {
    if (!config.transformType) missingFields.push('Transform type is required.');
  }
  if (node.type === 'condition') {
    if (!config.conditionText) missingFields.push('Condition text is required.');
  }
  if (node.type === 'approval') {
    if (config.approvalRequired !== false && !config.approvalType) missingFields.push('Approval type is required.');
    if (config.approvalRequired !== false && !config.approver) missingFields.push('Approver is required.');
  }
  if (node.type === 'output') {
    if (!config.destination) missingFields.push('Destination is required.');
    if (!config.format) missingFields.push('Output format is required.');
    if (isExternalWorkflowDestination(config.destination) && config.connectionStatus !== 'connected') warnings.push(`${workflowDestinationConnectionKey(config.destination) ?? 'External destination'} is not connected.`);
    if (isExternalWorkflowDestination(config.destination) && !config.approvalRequired) warnings.push('External output should require approval.');
  }
  if (node.type === 'notification') {
    if (!config.channel) missingFields.push('Notification channel is required.');
    if (!config.messageTemplate) missingFields.push('Message template is required.');
  }
  if (node.type === 'connector' || node.type === 'tool_action') {
    if (config.connectionStatus !== 'connected') warnings.push('Connector permission is required before real execution.');
  }
  return { isValid: missingFields.length === 0, missingFields, warnings };
}

export function nodeChangeSummary(change: NodeChange) {
  return `${readableField(change.field)}: ${String(change.before ?? 'empty')} -> ${String(change.after ?? 'empty')}`;
}
