// Shared app types: chat/workspace messaging, profile, reports, AI workflow
// intelligence, connectors, file processing, data pipeline, sprite/character,
// canvas validation, agent input mode.
//
// Extracted from src/App.tsx as part of Phase 1 of the file split refactor.
// Definitions are byte-for-byte the originals so behavior stays identical.

import type { AgentModelConfig } from '../aiOrchestration';

// ── App-shell scalars ────────────────────────────────────────────────────────

export type NewProjectType = 'Sales Analysis' | 'Content Workflow' | 'File Report' | 'Custom';

export type ContextMenuDef = {
  label: string;
  icon?: string;
  danger?: boolean;
  separator?: boolean;
  onClick: () => void;
};

export type AppDrawerView = 'ai-ant' | 'projects' | 'more';

export interface CustomModelEntry extends AgentModelConfig {
  id: string;
  providerName: string;
  apiBaseUrl?: string;
  createdAt: string;
}

// ── Canvas validation + sprite/character ─────────────────────────────────────

export type ConnectionMapping = {
  id: string;
  fromField: string;
  toField: string;
};

export type CanvasConnection = {
  id: string;
  from: string;
  to: string;
  label?: string;
  active?: boolean;
  mapping?: ConnectionMapping[];
  sampleData?: Record<string, string>;
};

export type ValidationIssueSeverity = 'error' | 'warning' | 'info';

export type ValidationIssue = {
  id: string;
  severity: ValidationIssueSeverity;
  title: string;
  description: string;
  affectedType: 'agent' | 'connection' | 'workflow';
  affectedId: string;
  suggestedFix: string;
  action?: {
    label: string;
    type: 'select-agent' | 'select-connection';
    targetId: string;
  };
};

export type CanvasNote = {
  id: string;
  x: number;
  y: number;
  text: string;
};

export type CanvasComment = {
  id: string;
  x: number;
  y: number;
  text: string;
};

export type SpriteState = 'idle' | 'walk' | 'talk' | 'celebrate';

export type CharacterConfig = {
  skinColor: string;
  hairColor: string;
  outfitColor: string;
  outfitDetail?: string;
  pantsColor: string;
  shoeColor: string;
  accessory?: 'glasses' | 'antenna' | 'hat' | 'shield' | 'pen';
  accentColor?: string;
};

// ── Chat shell types ─────────────────────────────────────────────────────────

export type ChatMsgType = 'user' | 'agent' | 'system' | 'approval' | 'report' | 'file' | 'command' | 'log';
export type ChatMsg = { id?: string; role: 'agent' | 'user'; sender?: string; agentId?: string; text: string; timestamp: string; pinned?: boolean; type?: ChatMsgType; channelId?: string; metadata?: Record<string, unknown> };
export type ChatChannelType = 'main' | 'analysis' | 'approval' | 'report' | 'files' | 'research' | 'writing' | 'publishing' | 'insights' | 'logs' | 'general';
export type ChatChannel = { id: string; name: string; type?: ChatChannelType; unread?: number };
export type ChatMemoryItem = { id: string; text: string; createdAt: string };
export type ChatCommandConfirm = { description: string; action: () => void };
export type ChatProjectDef = {
  id: string;
  emoji?: string;
  icon?: string;
  name: string;
  description?: string;
  instructions?: string;
  status?: 'Draft' | 'Running' | 'Waiting' | 'Complete';
  projectStatus: 'running' | 'waiting' | 'done' | 'idle';
  channels: ChatChannel[];
  initialMessages?: ChatMsg[];
  channelMessages?: Record<string, ChatMsg[]>;
};

export type ChatMode =
  | 'simple_chat' | 'create_project' | 'add_source' | 'single_agent_task'
  | 'ai_team_task' | 'one_man_enterprise' | 'workflow_task'
  | 'tool_device_action' | 'approval_sensitive_action';

export type ChatServer = {
  id: string;
  name: string;
  icon: string;
  instructions?: string;
  channels: ChatChannel[];
  messages: Record<string, ChatMsg[]>;
  memoryEnabled?: boolean;
  memories?: ChatMemoryItem[];
};

// ── Workspace items (light) ──────────────────────────────────────────────────

export interface WorkspaceSource {
  id: string;
  projectId: string;
  type: 'file' | 'link' | 'screenshot' | 'connector' | 'note';
  title: string;
  meta?: string;
  addedAt: number;
}

export interface WorkspaceDeliverableItem {
  id: string;
  projectId: string | null;
  title: string;
  type: 'Report' | 'Strategy' | 'Spreadsheet' | 'Presentation' | 'Email draft'
    | 'Research summary' | 'Business plan' | 'Marketing plan' | 'Task list'
    | 'Workflow automation' | 'Decision recommendation';
  status: 'Draft' | 'In progress' | 'Needs review' | 'Approved' | 'Exported' | 'Archived';
  ownerAgent: string;
  preview: string;
  updatedAt: number;
}

// ── Reports ──────────────────────────────────────────────────────────────────

export type ReportStatus = 'Draft' | 'Edited' | 'Approved' | 'Final' | 'Waiting Approval' | 'Archived';
export type ReportTemplateId = 'executive-summary' | 'detailed-analysis' | 'audit-report' | 'workflow-summary' | 'weekly-digest' | 'incident-report' | 'operational-review' | 'blank';
export type ReportSectionType = 'summary' | 'insights' | 'metrics' | 'findings' | 'recommendations' | 'table' | 'timeline' | 'appendix' | 'approval';
export type ReportSection = { id: string; type: ReportSectionType; title: string; content: string; enabled: boolean; order: number };
export type ReportVersion = { id: string; version: number; editedBy: string; editedAt: string; status: ReportStatus; summary: string; sections: ReportSection[] };
export type ReportExportRecord = { id: string; format: 'pdf' | 'csv' | 'sheets' | 'email' | 'line'; exportedAt: string; exportedBy: string };
export type Report = {
  id: string; workflowId: string; runId?: string; title: string;
  template: ReportTemplateId; templateName: string;
  version: number; currentVersionId: string;
  status: ReportStatus; approvalRequired: boolean; approvalStatus?: 'None' | 'Pending' | 'Approved' | 'Rejected';
  createdAt: string; updatedAt: string;
  generatedBy: string[]; workflowName: string;
  sections: ReportSection[];
  versions: ReportVersion[];
  exports: ReportExportRecord[];
  tags?: string[];
};
export type ReportTemplate = {
  id: ReportTemplateId; name: string; description: string; icon: string;
  defaultSections: ReportSectionType[]; supportsCharts: boolean; supportsTables: boolean; supportsTimeline: boolean;
};
export type ScheduledReportFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';
export type ScheduledReportDestination = 'email' | 'sheets' | 'channel' | 'folder' | 'approval-queue';
export type ScheduledReport = {
  id: string; workflowId: string; workflowName: string;
  title: string; template: ReportTemplateId; templateName: string;
  frequency: ScheduledReportFrequency; time: string; timezone: string;
  destination: ScheduledReportDestination; destinationLabel: string;
  recipients: string; channel: string;
  approvalRequired: boolean; active: boolean;
  nextRun: string; lastRun?: string;
  createdAt: string;
};
export type ExportModalState = {
  reportId: string; format: 'pdf' | 'csv' | 'sheets' | 'email' | 'line';
  fileName: string; includeCharts: boolean; includeTimeline: boolean; includeAuditLog: boolean; includeAppendix: boolean;
  sheetDestination: string; appendOrOverwrite: 'append' | 'overwrite'; worksheetName: string;
};
export type EmailDraftState = { reportId: string; recipient: string; subject: string; messagePreview: string; includeAttachments: boolean; includeSummary: boolean };
export type LineDraftState = { reportId: string; message: string };

// ── AI workflow intelligence ─────────────────────────────────────────────────

export type AIWorkflowType = 'research' | 'reporting' | 'data-processing' | 'approval' | 'document' | 'automation' | 'support' | 'blank';
export type AIComplexity = 'Simple' | 'Medium' | 'Advanced';
export type AIConfidence = 'Low' | 'Medium' | 'High';
export type AIRiskLevel = 'Safe' | 'Moderate' | 'High Risk';
export type AIImpact = 'Low' | 'Medium' | 'High';
export type SuggestionCategory = 'Performance' | 'Safety' | 'Cost' | 'Reliability' | 'Readability' | 'Structure';
export type DebugSeverity = 'Warning' | 'Error' | 'Critical';
export type ExplanationMode = 'Simple' | 'Technical' | 'Executive';
export type InstructionQuality = 'Basic' | 'Balanced' | 'Detailed';

export type GeneratedAgentDef = {
  id: string; label: string; role: string; icon: string;
  instructions: string; model: 'Fast' | 'Balanced' | 'Accurate'; x: number; y: number;
};

export type AIWorkflowResult = {
  title: string; description: string;
  agents: GeneratedAgentDef[];
  connections: Array<{ from: string; to: string; label?: string }>;
  estimatedComplexity: AIComplexity;
  estimatedCostPerRun: string;
  estimatedRuntimeSeconds: number;
  confidence: AIConfidence;
  risk: AIRiskLevel;
  suggestedTools: string[];
  suggestedTrigger: string;
  suggestedOutput: string;
  recommendations: string[];
  approvalPoints: string[];
};

export type WorkflowSuggestion = {
  id: string; title: string; explanation: string;
  impact: AIImpact; category: SuggestionCategory;
  confidence: AIConfidence; applied: boolean;
  action?: () => void;
};

export type DebugIssue = {
  id: string; severity: DebugSeverity; title: string;
  affectedAgent: string; explanation: string;
  suggestedFix: string; autoFixAvailable: boolean; fixed: boolean;
};

export type AgentInstructionResult = {
  role: string; instruction: string; goals: string;
  constraints: string; expectedOutput: string;
  tone: string; toolGuidance: string;
};

export type QualityDimension = { label: string; score: number; suggestion: string };
export type WorkflowQualityScore = {
  overall: number;
  dimensions: QualityDimension[];
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: string;
};

export type BuildWorkflowModalState = {
  prompt: string; workflowType: AIWorkflowType; complexity: AIComplexity;
  industry: string; outputPreference: 'Minimal' | 'Balanced' | 'Detailed';
  safetyMode: boolean; generating: boolean; result: AIWorkflowResult | null;
};

export type ImproveWorkflowState = {
  open: boolean; analyzing: boolean;
  suggestions: WorkflowSuggestion[];
};

export type ExplainWorkflowState = {
  open: boolean; mode: ExplanationMode; generating: boolean;
  explanation: string; steps: string[]; inputs: string; outputs: string; risks: string;
};

export type DebugWorkflowState = {
  open: boolean; analyzing: boolean;
  issues: DebugIssue[];
};

export type GenerateInstructionsState = {
  open: boolean; agentId: string; agentName: string;
  quality: InstructionQuality; generating: boolean;
  result: AgentInstructionResult | null;
};

// ── Connectors ────────────────────────────────────────────────────────────────

export type ConnectorStatus = 'connected' | 'not-connected' | 'needs-setup' | 'error' | 'coming-soon';
export type ConnectorAccessLevel = 'Read only' | 'Read & write' | 'Approval required';

export type AppConnector = {
  id: string;
  name: string;
  icon: string;
  status: ConnectorStatus;
  accessLevel: ConnectorAccessLevel;
  lastSynced?: string;
  agentsWithAccess: string[];
  permissions: string[];
  config: Record<string, string | boolean | string[]>;
};

// ── File processing ──────────────────────────────────────────────────────────

export type ProcessedFileType = 'pdf' | 'excel' | 'csv' | 'image' | 'unknown';
export type ProcessedFileStatus = 'idle' | 'processing' | 'done' | 'error';

export type ExtractedTable = {
  id: string;
  name: string;
  headers: string[];
  rows: string[][];
  rowCount: number;
};

export type ProcessedFile = {
  id: string;
  name: string;
  type: ProcessedFileType;
  size: string;
  status: ProcessedFileStatus;
  uploadedAt: string;
  summary?: string;
  keyPoints?: string[];
  tables?: ExtractedTable[];
  ocrText?: string;
  ocrConfidence?: number;
  ocrFields?: { label: string; value: string }[];
  errorMessage?: string;
};

// ── Data pipeline ────────────────────────────────────────────────────────────

export type ColumnMappingEntry = {
  id: string;
  sourceColumn: string;
  targetField: string;
  confidence: number;
  ignored: boolean;
};

export type DataValidationIssue = {
  id: string;
  severity: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  affectedRows: number;
  suggestedFix: string;
};

export type DataPreviewRow = Record<string, string>;

export type DataPreviewState = {
  sourceName: string;
  sourceType: 'csv' | 'excel' | 'pdf' | 'screenshot' | 'manual';
  columns: string[];
  rows: DataPreviewRow[];
  totalRows: number;
  cleaned: boolean;
  mappings: ColumnMappingEntry[];
  validationIssues: DataValidationIssue[];
  qualityScore: number;
  missingCount: number;
  duplicateCount: number;
};

export type EditableRow = {
  _id: string;
  _edited: boolean;
  _manuallyAdded: boolean;
  _isNew: boolean;
  _originalData: Record<string, string>;
  data: Record<string, string>;
};

export type CellEdit = {
  id: string;
  rowId: string;
  column: string;
  oldValue: string;
  newValue: string;
  editedBy: string;
  editedAt: string;
};

export type DataSourceHistoryItem = {
  id: string;
  name: string;
  type: 'image' | 'csv' | 'excel' | 'pdf' | 'google_sheet';
  status: 'extracted' | 'cleaned' | 'validated' | 'failed' | 'ready';
  createdAt: string;
  rowsExtracted: string;
  usedByAgent: string;
  runId: string;
  qualityScore: number;
};

// ── Agent input mode (composer) ──────────────────────────────────────────────

export type AgentInputMode = 'Auto' | 'Chat' | 'Agent' | 'Colony Crew' | 'Deep Research' | 'One-man Enterprise' | 'Workflow' | 'Device';
