import { titleFromGoal } from '../aiAnt/aiAntHelpers';
import { applyWorkflowNodeValidation, defaultWorkflowNodeConfig, isExternalWorkflowDestination } from './workflowBuilder';
import type { Workflow, WorkflowDestinationType, WorkflowNode, WorkflowNodeConfig, WorkflowOutputFormat, WorkflowProposal, WorkflowTrigger } from '../types/workflowTypes';

export function createWorkflowProposalFromPrompt(prompt: string): WorkflowProposal {
  const lower = prompt.toLowerCase();
  const hasDrive = /google drive|\bdrive\b|folder/.test(lower);
  const hasEmail = /gmail|email|inbox|mail/.test(lower);
  const hasSheet = /spreadsheet|sheet|excel|csv|sales file|sales data/.test(lower);
  const hasSales = /sales|profit|revenue|order/.test(lower);
  const hasWeekly = /monday|weekly|every week/.test(lower);
  const hasMonthly = /monthly|every month/.test(lower);
  const trigger: WorkflowTrigger = hasWeekly
    ? { type: 'schedule', label: 'Every Monday', schedule: 'Monday at 9:00 AM', timezone: 'Local timezone', enabled: true }
    : hasMonthly
      ? { type: 'schedule', label: 'Monthly schedule', schedule: 'First day of each month at 9:00 AM', timezone: 'Local timezone', enabled: true }
      : /every day|daily|each day/.test(lower)
        ? { type: 'schedule', label: 'Every day at 9:00 AM', schedule: 'Daily at 9:00 AM', timezone: 'Local timezone', enabled: true }
        : { type: 'manual', label: 'Manual test run', timezone: 'Local timezone', enabled: false };

  const sources = [
    hasSales ? 'Sales file' : hasEmail ? 'Email inbox' : hasSheet ? 'Spreadsheet' : 'Selected source',
    hasDrive ? 'Google Drive folder' : hasSheet ? 'Optional connected spreadsheet' : 'Uploaded file or connected app',
  ];
  const outputs = hasSales
    ? ['Daily report', 'CSV summary', 'Optional notification']
    : hasEmail
      ? ['Email summary', 'PDF report', 'Chat result']
      : ['Workflow result', 'Structured summary', 'Review-ready output'];
  const destination: WorkflowDestinationType =
    hasDrive ? 'google_drive' :
    /send|email/.test(lower) ? 'email_after_approval' :
    /csv/.test(lower) ? 'csv' :
    /pdf/.test(lower) ? 'pdf' :
    'chat';
  const destinationLabel: Record<WorkflowDestinationType, string> = {
    chat: 'Chat result',
    download: 'Download file',
    google_drive: 'Google Drive',
    project_deliverables: 'Project deliverables',
    email_after_approval: 'Send email after approval',
    gmail: 'Gmail draft',
    csv: 'Export CSV',
    pdf: 'Export PDF',
    notion: 'Save to Notion',
    google_sheets: 'Update spreadsheet',
    sheets: 'Google Sheets',
    webhook: 'Webhook',
  };
  const steps = hasSales
    ? ['Read sales data', 'Clean and validate data', 'Analyze profit and trends', 'Generate report', 'Ask for approval', destination === 'google_drive' ? 'Save report to Google Drive' : 'Return report in chat']
    : hasEmail
      ? ['Read emails', 'Filter important messages', 'Summarize key threads', 'Generate report', 'Ask for approval', 'Prepare output']
      : ['Read source data', 'Clean and validate input', 'Analyze key information', 'Generate result', 'Ask for approval', 'Route output'];
  const connectorsNeeded = [
    hasDrive ? 'Google Drive' : null,
    hasEmail ? 'Gmail' : null,
    hasSheet ? 'Google Sheets or spreadsheet upload' : null,
  ].filter(Boolean) as string[];

  return {
    id: `wfp-${Date.now()}`,
    prompt,
    goal: hasSales ? 'Create a daily sales report workflow.' : hasEmail ? 'Create a recurring email summary workflow.' : `Create a repeatable workflow for ${titleFromGoal(prompt).toLowerCase()}.`,
    trigger,
    sources: Array.from(new Set(sources)),
    steps,
    outputs,
    approval: 'Required before saving, sending, or writing externally.',
    destination,
    destinationLabel: destinationLabel[destination],
    connectorsNeeded,
    complexity: steps.length > 5 || connectorsNeeded.length > 1 ? 'Medium' : 'Low',
  };
}

export function workflowFromProposal(proposal: WorkflowProposal): Workflow {
  const now = new Date().toISOString();
  const triggerConfig: WorkflowNodeConfig = proposal.trigger.type === 'schedule'
    ? { triggerType: 'schedule', schedule: { frequency: /month/i.test(proposal.trigger.schedule ?? '') ? 'monthly' : /monday|week/i.test(proposal.trigger.schedule ?? '') ? 'weekly' : 'daily', dayOfWeek: /monday/i.test(proposal.trigger.schedule ?? '') ? 'Monday' : undefined, time: '09:00', timezone: proposal.trigger.timezone ?? 'Asia/Bangkok' }, errorHandling: 'ask_user' }
    : { triggerType: 'manual', schedule: { frequency: 'daily', time: '09:00', timezone: proposal.trigger.timezone ?? 'Asia/Bangkok' }, errorHandling: 'ask_user' };
  const sourceConfig: WorkflowNodeConfig = {
    sourceType: /gmail|email/i.test(proposal.sources.join(' ')) ? 'gmail' : /sheet|spreadsheet|sales/i.test(proposal.sources.join(' ')) ? 'sheets' : /drive/i.test(proposal.sources.join(' ')) ? 'google_drive' : 'file_upload',
    connectionStatus: /gmail|drive|sheet/i.test(proposal.sources.join(' ')) ? 'not_connected' : 'connected',
    selectedSource: proposal.sources[0] ?? 'Selected source',
    readMode: 'extract',
    errorHandling: 'ask_user',
    capability: 'file_reading',
  };
  const outputConfig: WorkflowNodeConfig = {
    destination: proposal.destination,
    format: proposal.destination === 'csv' ? 'csv' : proposal.destination === 'pdf' ? 'pdf' : 'markdown',
    fileName: 'workflow-output-{date}',
    folderPath: proposal.destination === 'google_drive' ? '/Colony Reports' : undefined,
    connectionStatus: isExternalWorkflowDestination(proposal.destination) ? 'not_connected' : 'connected',
    approvalRequired: isExternalWorkflowDestination(proposal.destination),
    approvalType: proposal.destination === 'email_after_approval' || proposal.destination === 'gmail' ? 'before_sending' : 'before_saving',
    errorHandling: 'ask_user',
    capability: 'connected_tool_action',
  };
  const nodeBase = [
    { type: 'trigger' as const, title: proposal.trigger.label, description: proposal.trigger.type === 'schedule' ? proposal.trigger.schedule : 'Start from a manual test run', config: triggerConfig },
    { type: 'source' as const, title: proposal.sources[0] ?? 'Source', description: proposal.sources.join(', '), config: sourceConfig },
    ...proposal.steps.slice(1, 4).map((step) => ({ type: 'ai_step' as const, title: step, description: 'AI step with reviewable output', config: { ...defaultWorkflowNodeConfig('ai_step'), instruction: step, inputFrom: ['previous'], outputFormat: /email/i.test(step) ? 'email_draft' as WorkflowOutputFormat : /table|sheet/i.test(step) ? 'table' as WorkflowOutputFormat : 'summary' as WorkflowOutputFormat } })),
    { type: 'approval' as const, title: 'Ask for approval', description: proposal.approval, config: { ...defaultWorkflowNodeConfig('approval'), message: proposal.approval } },
    { type: 'output' as const, title: proposal.destinationLabel, description: proposal.outputs.join(', '), config: outputConfig },
  ];
  const nodes: WorkflowNode[] = nodeBase.map((node, index) => applyWorkflowNodeValidation({
    id: `wfn-${proposal.id}-${index}`,
    type: node.type,
    title: node.title,
    description: node.description,
    position: { x: 120 + (index % 2) * 260, y: 80 + index * 130 },
    status: 'idle',
    config: node.config,
    modelRoutingPreference: node.type === 'ai_step' ? 'balanced' : undefined,
  }));
  return {
    id: `workflow-${proposal.id}`,
    name: titleFromGoal(proposal.goal),
    description: proposal.prompt,
    trigger: proposal.trigger,
    nodes,
    edges: nodes.slice(0, -1).map((node, index) => ({
      id: `wfe-${node.id}-${nodes[index + 1].id}`,
      from: node.id,
      to: nodes[index + 1].id,
      status: 'idle',
      animated: false,
    })),
    connectors: [
      { id: 'conn-file', provider: 'File upload', status: 'connected', scopes: ['read'] },
      { id: 'conn-drive', provider: 'Google Drive', status: proposal.destination === 'google_drive' ? 'not_connected' : 'not_connected', scopes: ['read', 'write'] },
      { id: 'conn-gmail', provider: 'Gmail', status: proposal.destination === 'email_after_approval' ? 'not_connected' : 'not_connected', scopes: ['read', 'draft', 'send_with_approval'] },
      { id: 'conn-notion', provider: 'Notion', status: 'not_connected', scopes: ['write'] },
      { id: 'conn-sheets', provider: 'Google Sheets', status: 'not_connected', scopes: ['read', 'write'] },
    ],
    approvals: [{ id: 'approval-default', before: 'external write or send', approver: 'current_user', mode: 'every_run', message: proposal.approval }],
    runHistory: [],
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };
}

