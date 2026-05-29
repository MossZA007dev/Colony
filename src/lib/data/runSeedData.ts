import type { Invoice, PlanDef, UsageEvent, UsageState } from '../types/billingTypes';
import type { ApprovalRequest, ApprovalRule, AuditLog, SafetyRule, WorkflowRun } from '../types/workflowTypes';

export const DEFAULT_SAFETY_RULES: SafetyRule[] = [
  { id: 'sr-read-only',    title: 'Default tool access: Read only',                     description: 'All tools and connectors start in read-only mode by default.',                        enabled: true },
  { id: 'sr-send',         title: 'Require approval before sending messages',            description: 'Any agent action that sends content externally must be approved first.',             enabled: true },
  { id: 'sr-export',       title: 'Require approval before exporting files',             description: 'File exports, PDFs, and spreadsheet outputs must be approved before delivery.',     enabled: true },
  { id: 'sr-write',        title: 'Require approval before updating connected tools',    description: 'Write actions to Google Sheets, databases, or APIs need approval.',                  enabled: true },
  { id: 'sr-delete',       title: 'Require confirmation before deleting data',           description: 'Any deletion action requires an explicit confirmation step.',                        enabled: true },
  { id: 'sr-high-risk',    title: 'Require confirmation for high-risk external actions', description: 'Actions rated High risk always show a confirmation dialog.',                        enabled: true },
  { id: 'sr-validation',   title: 'Block actions when validation has errors',            description: 'Workflow execution is paused if the input data has unresolved validation errors.',   enabled: true },
  { id: 'sr-pause-high',   title: 'Pause workflow when risk is high',                   description: 'The workflow automatically pauses at any step rated High risk.',                     enabled: true },
];

export const PLANS: PlanDef[] = [
  {
    id: 'free', name: 'Free', price: '$0', priceYearly: '$0', priceDesc: 'forever',
    workflowRunsLimit: 20, creditsLimit: 300, projectLimit: 3, activeWorkflowLimit: 3, seats: 1,
    features: [
      'AI Ant chat (20 messages/mo)',
      '20 workflow runs/month',
      '300 agent credits',
      '3 projects',
      '3 active workflows',
      'Community templates',
      'Basic file processing',
      'Safety Mode included',
    ],
    cta: 'Get Started Free',
    accentColor: 'rgba(255,255,255,0.08)',
  },
  {
    id: 'basic', name: 'Basic', price: '$9', priceYearly: '$7', priceDesc: '/month',
    workflowRunsLimit: 100, creditsLimit: 2000, projectLimit: 10, activeWorkflowLimit: 10, seats: 1,
    features: [
      'AI Ant chat (200 messages/mo)',
      '100 workflow runs/month',
      '2,000 agent credits',
      '10 projects',
      '10 active workflows',
      'Basic connectors',
      'Template remix',
      'Standard deliverable exports',
    ],
    cta: 'Start Basic',
    accentColor: 'rgba(79,158,255,0.08)',
  },
  {
    id: 'pro', name: 'Pro', price: '$19', priceYearly: '$15', priceDesc: '/month',
    workflowRunsLimit: 500, creditsLimit: 10000, projectLimit: -1, activeWorkflowLimit: 25, seats: 1,
    features: [
      'AI Ant chat (unlimited)',
      '500 workflow runs/month',
      '10,000 agent credits',
      'Unlimited projects',
      '25 active workflows',
      'Advanced AI teams',
      'Project memory',
      'Deliverable version history',
      'Priority AI models',
      'Advanced connectors',
    ],
    cta: 'Upgrade to Pro',
    recommended: true,
    accentColor: 'rgba(124,92,252,0.10)',
  },
  {
    id: 'max', name: 'Max', price: '$49', priceYearly: '$39', priceDesc: '/month',
    workflowRunsLimit: 2000, creditsLimit: 50000, projectLimit: -1, activeWorkflowLimit: -1, seats: 5,
    features: [
      'AI Ant chat (unlimited)',
      '2,000 workflow runs/month',
      '50,000 agent credits',
      'Unlimited projects & workflows',
      '5 user seats',
      'Device & tool actions',
      'Team collaboration',
      'Priority support',
      'Advanced automation',
      'Approval history & audit log',
    ],
    cta: 'Go Max',
    accentColor: 'rgba(245,200,66,0.08)',
  },
];

export const MOCK_USAGE_EVENTS: UsageEvent[] = [
  { id: 'ue-1', timestamp: '2026-05-14 09:12', workflowName: 'Daily Report Workflow',       actionType: 'Workflow run',    agentsUsed: 5, creditsUsed: 6,  tokensUsed: 2400, status: 'Completed' },
  { id: 'ue-2', timestamp: '2026-05-14 10:22', workflowName: 'File-to-Report Assistant',    actionType: 'File processing', agentsUsed: 3, creditsUsed: 3,  tokensUsed: 1800, status: 'Completed' },
  { id: 'ue-3', timestamp: '2026-05-13 14:05', workflowName: 'Customer Support Summary',    actionType: 'Agent run',       agentsUsed: 2, creditsUsed: 2,  tokensUsed: 900,  status: 'Completed' },
  { id: 'ue-4', timestamp: '2026-05-13 16:30', workflowName: 'Operations Report Workflow',  actionType: 'Workflow run',    agentsUsed: 6, creditsUsed: 7,  tokensUsed: 3100, status: 'Completed' },
  { id: 'ue-5', timestamp: '2026-05-12 11:30', workflowName: 'Research Workflow',           actionType: 'Workflow run',    agentsUsed: 4, creditsUsed: 8,  tokensUsed: 4200, status: 'Failed' },
  { id: 'ue-6', timestamp: '2026-05-11 08:45', workflowName: 'Finance Reconciliation',      actionType: 'Workflow run',    agentsUsed: 5, creditsUsed: 5,  tokensUsed: 2600, status: 'Completed' },
  { id: 'ue-7', timestamp: '2026-05-10 15:20', workflowName: 'HR Onboarding Flow',          actionType: 'Agent run',       agentsUsed: 3, creditsUsed: 3,  tokensUsed: 1200, status: 'Completed' },
  { id: 'ue-8', timestamp: '2026-05-09 10:00', workflowName: 'Content Pipeline',            actionType: 'Connector action',agentsUsed: 4, creditsUsed: 4,  tokensUsed: 1900, status: 'Completed' },
];

export const DEFAULT_USAGE_STATE: UsageState = {
  currentPlan: 'free',
  workflowRunsUsed: 12,
  agentCreditsUsed: 86,
  tokenUsageThisMonth: 128400,
  estimatedCost: 3.42,
  resetDate: 'June 1',
  usageEvents: MOCK_USAGE_EVENTS,
};

export const MOCK_INVOICES: Invoice[] = [
  { id: 'INV-0004', date: 'May 1, 2026',   plan: 'Pro',  amount: '$19.00', status: 'Paid' },
  { id: 'INV-0003', date: 'Apr 1, 2026',   plan: 'Pro',  amount: '$19.00', status: 'Paid' },
  { id: 'INV-0002', date: 'Mar 1, 2026',   plan: 'Free', amount: '$0.00',  status: 'Paid' },
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: 'aud-001', timestamp: '14/05/2026 09:02', actorType: 'System', actorName: 'Colony AI', actionType: 'system-init', title: 'Workflow initialized', description: 'Default agents and connections loaded from template.', workflowName: 'Lead Nurture Flow', riskLevel: 'Low', status: 'Success', reversible: false, rollbackStatus: 'none' },
  { id: 'aud-002', timestamp: '14/05/2026 09:15', actorType: 'User', actorName: 'You', actionType: 'agent-added', title: 'Added Email Sender agent', description: 'Agent "Email Sender" added to canvas.', workflowName: 'Lead Nurture Flow', stepName: 'Email Sender', riskLevel: 'Low', status: 'Success', reversible: true, rollbackStatus: 'none', beforeState: { agents: 3 }, afterState: { agents: 4, addedAgent: 'Email Sender' } },
  { id: 'aud-003', timestamp: '14/05/2026 09:22', actorType: 'User', actorName: 'You', actionType: 'connection-added', title: 'Connected Lead Qualifier → Email Sender', description: 'New connection created between "Lead Qualifier" and "Email Sender".', workflowName: 'Lead Nurture Flow', riskLevel: 'Low', status: 'Success', reversible: true, rollbackStatus: 'none' },
  { id: 'aud-004', timestamp: '14/05/2026 09:31', actorType: 'User', actorName: 'You', actionType: 'model-changed', title: 'Model changed: Email Sender', description: 'Model switched from Balanced to Accurate for higher output quality.', workflowName: 'Lead Nurture Flow', stepName: 'Email Sender', riskLevel: 'Low', status: 'Success', reversible: true, rollbackStatus: 'none', beforeState: { model: 'Balanced' }, afterState: { model: 'Accurate' } },
  { id: 'aud-005', timestamp: '14/05/2026 10:00', actorType: 'User', actorName: 'You', actionType: 'workflow-run', title: 'Workflow run started', description: 'Workflow executed with 4 active agents.', workflowName: 'Lead Nurture Flow', riskLevel: 'Medium', status: 'Success', reversible: false, rollbackStatus: 'none', metadata: { agentsUsed: 4, creditsUsed: 24 } },
  { id: 'aud-006', timestamp: '14/05/2026 10:02', actorType: 'Agent', actorName: 'CRM Updater', actionType: 'data-edit', title: 'CRM records updated', description: '12 lead records were modified in CRM dataset.', workflowName: 'Lead Nurture Flow', stepName: 'CRM Updater', riskLevel: 'High', status: 'Success', reversible: true, rollbackStatus: 'none', beforeState: { recordCount: 42 }, afterState: { recordCount: 42, modified: 12 } },
  { id: 'aud-007', timestamp: '14/05/2026 10:03', actorType: 'Approval', actorName: 'You', actionType: 'approval-approved', title: 'Approval: Send Bulk Email', description: 'Step "Email Sender" approved to send 12 outbound emails.', workflowName: 'Lead Nurture Flow', stepName: 'Email Sender', riskLevel: 'High', status: 'Success', reversible: false, rollbackStatus: 'none', metadata: { approvedBy: 'You', emails: 12 } },
  { id: 'aud-008', timestamp: '14/05/2026 10:05', actorType: 'User', actorName: 'You', actionType: 'safety-disabled', title: 'Safety Mode disabled', description: 'Safety Mode turned OFF. Actions may run without confirmation.', workflowName: 'Lead Nurture Flow', riskLevel: 'High', status: 'Success', reversible: true, rollbackStatus: 'none' },
  { id: 'aud-009', timestamp: '14/05/2026 10:10', actorType: 'User', actorName: 'You', actionType: 'safety-enabled', title: 'Safety Mode re-enabled', description: 'Safety Mode turned ON. All external actions require confirmation.', workflowName: 'Lead Nurture Flow', riskLevel: 'Low', status: 'Success', reversible: true, rollbackStatus: 'none' },
  { id: 'aud-010', timestamp: '14/05/2026 10:18', actorType: 'User', actorName: 'You', actionType: 'agent-edited', title: 'Instructions updated: Lead Qualifier', description: 'System prompt and instructions were changed.', workflowName: 'Lead Nurture Flow', stepName: 'Lead Qualifier', riskLevel: 'Low', status: 'Success', reversible: true, rollbackStatus: 'none', beforeState: { instructions: 'Qualify leads using score > 70.' }, afterState: { instructions: 'Qualify leads using score > 60 and segment by region.' } },
  { id: 'aud-011', timestamp: '14/05/2026 10:25', actorType: 'User', actorName: 'You', actionType: 'workflow-saved', title: 'Workflow saved', description: 'Manual save — Version 3 created.', workflowName: 'Lead Nurture Flow', riskLevel: 'Low', status: 'Success', reversible: false, rollbackStatus: 'none' },
  { id: 'aud-012', timestamp: '14/05/2026 10:30', actorType: 'Agent', actorName: 'Report Builder', actionType: 'data-edit', title: 'Report generation failed', description: 'Report Builder failed to export PDF — no output from upstream agent.', workflowName: 'Lead Nurture Flow', stepName: 'Report Builder', riskLevel: 'Medium', status: 'Failed', reversible: false, rollbackStatus: 'none', metadata: { error: 'No input from upstream' } },
];

export const MOCK_WORKFLOW_RUNS: WorkflowRun[] = [
  {
    id: 'run-024', runNumber: 24, workflowId: 'wf-1', workflowName: 'Document Review Workflow', status: 'Completed', triggerType: 'Manual',
    startedAt: 'Today 09:12', completedAt: 'Today 09:13', durationSeconds: 42, agentsUsed: 6,
    totalTokens: 2400, inputTokens: 1500, outputTokens: 900, creditsUsed: 6, estimatedCost: 0.06,
    outputType: 'Report', outputSummary: 'Generated compliance report with 5 findings.', approvalStatus: 'Approved', safetyMode: true,
    steps: [
      { id: 's1', agentId: 'scout', agentName: 'AI Scout', role: 'Input analysis', status: 'Completed', startedAt: '09:12:01', endedAt: '09:12:07', durationSeconds: 6, inputSource: 'Uploaded document set', outputProduced: 'Extracted 42 fields', inputTokens: 200, outputTokens: 80, totalTokens: 280, estimatedCost: 0.005, summary: 'Read input source and extracted initial fields.' },
      { id: 's2', agentId: 'collector', agentName: 'Data Collector', role: 'Data collection', status: 'Completed', startedAt: '09:12:08', endedAt: '09:12:15', durationSeconds: 7, inputSource: 'Scout output', outputProduced: 'Structured records', inputTokens: 250, outputTokens: 150, totalTokens: 400, estimatedCost: 0.01, summary: 'Collected structured records from input.' },
      { id: 's3', agentId: 'cleaner', agentName: 'Data Cleaner', role: 'Data preparation', status: 'Completed', startedAt: '09:12:16', endedAt: '09:12:22', durationSeconds: 6, inputSource: 'Collected data', outputProduced: 'Clean normalized data', inputTokens: 300, outputTokens: 120, totalTokens: 420, estimatedCost: 0.01, summary: 'Removed duplicates and normalized fields.' },
      { id: 's4', agentId: 'analyst', agentName: 'Analyst', role: 'Analysis', status: 'Completed', startedAt: '09:12:23', endedAt: '09:12:35', durationSeconds: 12, inputSource: 'Clean data', outputProduced: 'Insight summary', inputTokens: 420, outputTokens: 280, totalTokens: 700, estimatedCost: 0.015, summary: 'Generated insight summary and detected 5 compliance warnings.' },
      { id: 's5', agentId: 'writer', agentName: 'Report Writer', role: 'Output generation', status: 'Completed', startedAt: '09:12:36', endedAt: '09:12:48', durationSeconds: 12, inputSource: 'Analyst output', outputProduced: 'Draft report (2,400 words)', inputTokens: 280, outputTokens: 250, totalTokens: 530, estimatedCost: 0.012, summary: 'Generated draft report with executive summary.' },
      { id: 's6', agentId: 'guard', agentName: 'Approval Guard', role: 'Approval', status: 'Completed', startedAt: '09:12:49', endedAt: '09:12:53', durationSeconds: 4, inputSource: 'Draft report', outputProduced: 'Approved report', inputTokens: 50, outputTokens: 20, totalTokens: 70, estimatedCost: 0.002, summary: 'Report approved and finalized.' },
    ],
  },
  {
    id: 'run-023', runNumber: 23, workflowId: 'wf-1', workflowName: 'Document Review Workflow', status: 'Failed', triggerType: 'File upload',
    startedAt: 'Today 08:40', completedAt: 'Today 08:40', durationSeconds: 18, agentsUsed: 3,
    totalTokens: 1100, inputTokens: 800, outputTokens: 300, creditsUsed: 3, estimatedCost: 0.03,
    outputType: 'None', outputSummary: undefined, approvalStatus: 'None', safetyMode: true,
    error: { errorType: 'Missing input', failedStepId: 's3', failedAgentName: 'Data Cleaner', message: 'Required field "customer_id" was not found.', likelyCause: 'Column mapping is incomplete — source CSV does not contain "customer_id".', suggestedFix: 'Update column mapping to include "customer_id" then retry from Data Cleaner.', severity: 'Error' },
    steps: [
      { id: 's1', agentId: 'scout', agentName: 'AI Scout', role: 'Input analysis', status: 'Completed', startedAt: '08:40:01', endedAt: '08:40:07', durationSeconds: 6, inputSource: 'Uploaded CSV file', outputProduced: 'Extracted 28 fields', inputTokens: 200, outputTokens: 80, totalTokens: 280, estimatedCost: 0.005, summary: 'Parsed uploaded CSV and extracted column headers.' },
      { id: 's2', agentId: 'collector', agentName: 'Data Collector', role: 'Data collection', status: 'Completed', startedAt: '08:40:08', endedAt: '08:40:14', durationSeconds: 6, inputSource: 'Scout output', outputProduced: 'Partial records', inputTokens: 350, outputTokens: 170, totalTokens: 520, estimatedCost: 0.012, summary: 'Collected partial records — some required columns missing.' },
      { id: 's3', agentId: 'cleaner', agentName: 'Data Cleaner', role: 'Data preparation', status: 'Failed', startedAt: '08:40:15', endedAt: '08:40:18', durationSeconds: 3, inputSource: 'Partial records', outputProduced: 'None', inputTokens: 250, outputTokens: 50, totalTokens: 300, estimatedCost: 0.008, summary: 'Failed: Required field "customer_id" not found in input.', error: { errorType: 'Missing input', failedStepId: 's3', failedAgentName: 'Data Cleaner', message: 'Required field "customer_id" was not found.', likelyCause: 'Column mapping is incomplete.', suggestedFix: 'Update column mapping and retry from Data Cleaner.', severity: 'Error' } },
    ],
  },
  {
    id: 'run-022', runNumber: 22, workflowId: 'wf-1', workflowName: 'Document Review Workflow', status: 'Waiting Approval', triggerType: 'Schedule',
    startedAt: 'Yesterday 09:00', completedAt: undefined, durationSeconds: 35, agentsUsed: 5,
    totalTokens: 2000, inputTokens: 1200, outputTokens: 800, creditsUsed: 5, estimatedCost: 0.05,
    outputType: 'Draft report', outputSummary: 'Draft report generated — waiting for approval before sending.', approvalStatus: 'Pending', safetyMode: true,
    steps: [
      { id: 's1', agentId: 'scout', agentName: 'AI Scout', role: 'Input analysis', status: 'Completed', startedAt: '09:00:01', endedAt: '09:00:07', durationSeconds: 6, inputSource: 'Scheduled job', outputProduced: 'Extracted records', inputTokens: 200, outputTokens: 80, totalTokens: 280, estimatedCost: 0.005, summary: 'Read scheduled input source.' },
      { id: 's2', agentId: 'collector', agentName: 'Data Collector', role: 'Data collection', status: 'Completed', startedAt: '09:00:08', endedAt: '09:00:14', durationSeconds: 6, inputSource: 'Scout output', outputProduced: 'Full records', inputTokens: 250, outputTokens: 150, totalTokens: 400, estimatedCost: 0.01, summary: 'Collected all scheduled records.' },
      { id: 's3', agentId: 'cleaner', agentName: 'Data Cleaner', role: 'Data preparation', status: 'Completed', startedAt: '09:00:15', endedAt: '09:00:21', durationSeconds: 6, inputSource: 'Full records', outputProduced: 'Clean data', inputTokens: 300, outputTokens: 120, totalTokens: 420, estimatedCost: 0.01, summary: 'Cleaned and standardized all records.' },
      { id: 's4', agentId: 'analyst', agentName: 'Analyst', role: 'Analysis', status: 'Completed', startedAt: '09:00:22', endedAt: '09:00:30', durationSeconds: 8, inputSource: 'Clean data', outputProduced: 'Analysis report', inputTokens: 350, outputTokens: 250, totalTokens: 600, estimatedCost: 0.012, summary: 'Analyzed data and generated insights.' },
      { id: 's6', agentId: 'guard', agentName: 'Approval Guard', role: 'Approval', status: 'Waiting Approval', startedAt: '09:00:36', endedAt: undefined, durationSeconds: 0, inputSource: 'Draft report', outputProduced: 'Pending', inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCost: 0, summary: 'Waiting for human approval to finalize and send report.' },
    ],
  },
  {
    id: 'run-021', runNumber: 21, workflowId: 'wf-1', workflowName: 'Document Review Workflow', status: 'Completed', triggerType: 'Webhook',
    startedAt: 'May 10 14:22', completedAt: 'May 10 14:23', durationSeconds: 72, agentsUsed: 8,
    totalTokens: 4500, inputTokens: 2800, outputTokens: 1700, creditsUsed: 9, estimatedCost: 0.12,
    outputType: 'Report + Email', outputSummary: 'Full analysis report generated and emailed to 8 stakeholders.', approvalStatus: 'Approved', safetyMode: true,
    steps: [
      { id: 's1', agentId: 'scout', agentName: 'AI Scout', role: 'Input analysis', status: 'Completed', startedAt: '14:22:01', endedAt: '14:22:09', durationSeconds: 8, inputSource: 'Webhook payload', outputProduced: 'Parsed JSON fields', inputTokens: 300, outputTokens: 120, totalTokens: 420, estimatedCost: 0.01, summary: 'Parsed incoming webhook payload and extracted request parameters.' },
      { id: 's2', agentId: 'collector', agentName: 'Data Collector', role: 'Data collection', status: 'Completed', startedAt: '14:22:10', endedAt: '14:22:19', durationSeconds: 9, inputSource: 'Scout output', outputProduced: '85 records', inputTokens: 400, outputTokens: 200, totalTokens: 600, estimatedCost: 0.015, summary: 'Fetched 85 records from internal data store.' },
      { id: 's3', agentId: 'cleaner', agentName: 'Data Cleaner', role: 'Data preparation', status: 'Completed', startedAt: '14:22:20', endedAt: '14:22:27', durationSeconds: 7, inputSource: 'Raw records', outputProduced: 'Normalized records', inputTokens: 350, outputTokens: 200, totalTokens: 550, estimatedCost: 0.012, summary: 'Normalized 85 records and removed 3 duplicates.' },
      { id: 's4', agentId: 'enricher', agentName: 'Data Enricher', role: 'Enrichment', status: 'Completed', startedAt: '14:22:28', endedAt: '14:22:38', durationSeconds: 10, inputSource: 'Clean records', outputProduced: 'Enriched data', inputTokens: 400, outputTokens: 250, totalTokens: 650, estimatedCost: 0.015, summary: 'Enriched records with external context data.' },
      { id: 's5', agentId: 'analyst', agentName: 'Analyst', role: 'Analysis', status: 'Completed', startedAt: '14:22:39', endedAt: '14:22:52', durationSeconds: 13, inputSource: 'Enriched data', outputProduced: 'Strategic summary', inputTokens: 600, outputTokens: 400, totalTokens: 1000, estimatedCost: 0.025, summary: 'Generated strategic insights and risk assessment.' },
      { id: 's6', agentId: 'writer', agentName: 'Report Writer', role: 'Output generation', status: 'Completed', startedAt: '14:22:53', endedAt: '14:23:05', durationSeconds: 12, inputSource: 'Analysis output', outputProduced: 'Full report (3,800 words)', inputTokens: 500, outputTokens: 450, totalTokens: 950, estimatedCost: 0.02, summary: 'Generated full stakeholder report with charts and recommendations.' },
      { id: 's7', agentId: 'guard', agentName: 'Approval Guard', role: 'Approval', status: 'Completed', startedAt: '14:23:06', endedAt: '14:23:09', durationSeconds: 3, inputSource: 'Report', outputProduced: 'Approval granted', inputTokens: 100, outputTokens: 80, totalTokens: 180, estimatedCost: 0.004, summary: 'Report approved by manager.' },
      { id: 's8', agentId: 'sender', agentName: 'Email Sender', role: 'Communication', status: 'Completed', startedAt: '14:23:10', endedAt: '14:23:14', durationSeconds: 4, inputSource: 'Approved report', outputProduced: 'Email sent to 8 recipients', inputTokens: 150, outputTokens: 0, totalTokens: 150, estimatedCost: 0, summary: 'Report emailed to 8 stakeholders.' },
    ],
  },
];


// ── Report Templates ──────────────────────────────────────────────────────────
export const DEFAULT_APPROVAL_RULES: ApprovalRule[] = [
  { id: 'rule-high-risk',   name: 'High-risk actions',       conditionType: 'Risk level',        operator: 'is',         value: 'High',        action: 'Require approval',                    enabled: true },
  { id: 'rule-ext-msg',     name: 'External communication',  conditionType: 'Action type',       operator: 'is',         value: 'Send message', action: 'Require approval',                   enabled: true },
  { id: 'rule-export',      name: 'Export or file output',   conditionType: 'Action type',       operator: 'is',         value: 'Export file',  action: 'Require approval',                   enabled: true },
  { id: 'rule-update-data', name: 'Data update',             conditionType: 'Action type',       operator: 'is',         value: 'Update data',  action: 'Require approval',                   enabled: false },
  { id: 'rule-low-conf',    name: 'Low confidence',          conditionType: 'Confidence score',  operator: 'lower than', value: '80%',          action: 'Require approval',                   enabled: false },
  { id: 'rule-validation',  name: 'Validation issues',       conditionType: 'Validation status', operator: 'is',         value: 'Has errors',   action: 'Require approval before continuing', enabled: true },
];

export const MOCK_APPROVAL_REQUESTS: ApprovalRequest[] = [
  {
    id: 'apr-001', title: 'Send weekly summary email', workflowId: 'wf-1', agentId: 'agent-reporter', agentName: 'Report Writer',
    actionType: 'Send message', riskLevel: 'Medium', status: 'Pending',
    requestedBy: 'Colony AI', approvedBy: null, createdAt: '2026-05-14 09:15', resolvedAt: null,
    summary: 'Agent is about to send a weekly summary email to 3 recipients.',
    previewContent: 'Subject: Weekly Operations Summary – May 14\n\nHi team,\n\nHere is the summary for this week...',
    notes: '',
  },
  {
    id: 'apr-002', title: 'Export processed data to Google Sheets', workflowId: 'wf-1', agentId: 'agent-exporter', agentName: 'Data Exporter',
    actionType: 'Export file', riskLevel: 'High', status: 'Pending',
    requestedBy: 'Colony AI', approvedBy: null, createdAt: '2026-05-14 09:18', resolvedAt: null,
    summary: 'Agent is about to write 126 rows to "Operations Report May 2026" Google Sheet.',
    previewContent: 'Sheet: Operations Report May 2026\nRows to write: 126\nColumns: Date, Revenue, Orders, Avg Order Value',
    notes: '',
  },
];

export const MOCK_APPROVAL_HISTORY: ApprovalRequest[] = [
  {
    id: 'apr-h-001', title: 'Update inventory database', workflowId: 'wf-1', agentId: 'agent-inventory', agentName: 'Inventory Manager',
    actionType: 'Update data', riskLevel: 'High', status: 'Approved',
    requestedBy: 'Colony AI', approvedBy: 'You', createdAt: '2026-05-13 14:20', resolvedAt: '2026-05-13 14:22',
    summary: 'Agent updated 44 inventory records based on latest order data.',
    previewContent: 'Records updated: 44\nFields changed: stock_qty, last_updated',
    notes: 'Looks correct.',
  },
  {
    id: 'apr-h-002', title: 'Send reorder alert to supplier', workflowId: 'wf-1', agentId: 'agent-ops', agentName: 'Ops Coordinator',
    actionType: 'Send message', riskLevel: 'Medium', status: 'Edited',
    requestedBy: 'Colony AI', approvedBy: 'You', createdAt: '2026-05-13 10:05', resolvedAt: '2026-05-13 10:08',
    summary: 'Agent was about to send a reorder alert. Message was edited before sending.',
    previewContent: 'To: supplier@acme.com\nSubject: Reorder Request\n\nPlease restock item #A-220.',
    notes: 'Changed quantity from 100 to 50.',
  },
  {
    id: 'apr-h-003', title: 'Delete duplicate customer records', workflowId: 'wf-1', agentId: 'agent-cleaner', agentName: 'Data Cleaner',
    actionType: 'Update data', riskLevel: 'High', status: 'Rejected',
    requestedBy: 'Colony AI', approvedBy: 'You', createdAt: '2026-05-12 16:45', resolvedAt: '2026-05-12 16:47',
    summary: 'Agent attempted to delete 12 duplicate customer records.',
    previewContent: 'Records to delete: 12\nBasis: Matching email + phone number',
    notes: 'Need to verify before deleting.',
  },
];

// ── AI Workflow Intelligence — Mock Generation Logic ──────────────────────────

