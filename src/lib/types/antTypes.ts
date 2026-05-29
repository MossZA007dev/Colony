// AI Ant types: tasks, messages, plans, devices, workspaces, tools,
// permissions, notifications, suggestions, deliverables, collaboration.
// Extracted from src/App.tsx as part of Phase 1 of the file split refactor.
// Definitions are byte-for-byte the originals so behavior stays identical.

import type { AgentSkill, Artifact, ModelConfig } from '../aiOrchestration';
import type { WorkflowProposal } from './workflowTypes';

// ── Core Ant scalars ─────────────────────────────────────────────────────────

export type AntMode = 'read-only' | 'assist' | 'approval' | 'auto';
export type AntTaskStatus = 'queued' | 'reading' | 'analyzing' | 'waiting-approval' | 'completed' | 'failed';
export type AntRiskLevel = 'Safe' | 'Moderate' | 'Sensitive' | 'High Risk';
export type AntDeviceType = 'mac' | 'windows' | 'iphone' | 'android';
export type AntDeviceStatus = 'active' | 'idle' | 'secure';
export type AntConfidenceLevel = 'verified' | 'needs-review' | 'manual-override';
export type AntDomain = 'finance' | 'hr' | 'email' | 'file-deletion' | 'external-export' | 'general';
export type AntWorkspaceSource = 'google-drive' | 'slack' | 'notion' | 'browser' | 'local' | 'email-client' | 'spreadsheets';

export type AntCorrectionField = {
  id: string; label: string; detected: string;
  edited?: string; confidence: number;
};
export type AntFileCard = {
  id: string; name: string; type: string; size: string;
  modified: string; path: string; confidence: number;
};
export type AntDevice = {
  id: string; name: string; type: AntDeviceType;
  online: boolean; lastSeen: string; batteryLevel?: number;
  status: AntDeviceStatus; activeSession?: string;
};
export type AntWorkspace = {
  id: string; name: string; source: AntWorkspaceSource;
  connected: boolean; lastAccessed?: string; icon: string;
};

// ── Workspace members ────────────────────────────────────────────────────────

export type WorkspaceMemberType = 'human' | 'agent';
export type WorkspaceMemberStatus = 'active' | 'invited' | 'offline';
export type WorkspaceMemberPermission = 'owner' | 'editor' | 'viewer' | 'agent';
export type WorkspaceMember = {
  id: string;
  type: WorkspaceMemberType;
  name: string;
  email?: string;
  role: string;
  permission: WorkspaceMemberPermission;
  status: WorkspaceMemberStatus;
  avatar?: string;
  instructions?: string;
  createdAt: string;
};
export type WorkspaceMemberModalState =
  | { mode: 'add'; member?: undefined }
  | { mode: 'edit'; member: WorkspaceMember };

// ── Task + message + plan ────────────────────────────────────────────────────

export type AntTask = {
  id: string; title: string; status: AntTaskStatus;
  device: string; progress: number; confidence: number;
  confidenceLevel: AntConfidenceLevel;
  estimatedTime: string; startedAt: string; icon: string;
  riskLevel: AntRiskLevel; domain: AntDomain;
  requiresCorrection?: boolean;
  correctionFields?: AntCorrectionField[];
};
export type AntMessage = {
  id: string; role: 'user' | 'ant'; text: string; timestamp: string;
  actions?: Array<{ label: string; icon: string }>;
  fileCards?: AntFileCard[];
  confidence?: number; confidenceLevel?: AntConfidenceLevel;
  riskLevel?: AntRiskLevel; domain?: AntDomain;
  correctionFields?: AntCorrectionField[];
  requiresCorrection?: boolean;
  systemNote?: string;
  plan?: AntTaskPlan;
  actionType?: AntActionType;
  workflowProposal?: WorkflowProposal;
};
export type AntActivityEntry = {
  id: string; time: string; action: string;
  device: string; confidence: number;
  confidenceLevel: AntConfidenceLevel;
  result: string; icon: string;
  riskLevel: AntRiskLevel; domain: AntDomain;
  approvalStatus?: 'approved' | 'rejected' | 'pending' | 'auto';
};
export type AntMemoryEntry = {
  id: string; pattern: string; description: string;
  confidence: number; uses: number; domain: AntDomain;
};
export type AntApproval = {
  id: string; action: string; fileName?: string;
  destination?: string; risk: AntRiskLevel;
  domain: AntDomain; reason: string; confidence: number;
  requestedBy: string; dataPreview?: string;
  correctionFields?: AntCorrectionField[];
};
export type AntActionType = 'FILE_OPS' | 'SYSTEM_OPS' | 'COMMUNICATION' | 'DATA_ANALYSIS' | 'AUTOMATION' | 'SEARCH' | 'ORGANIZATION';
export type AntPlanStep = {
  id: number; label: string; device: string; operation: string;
  expectedOutcome: string; reversible: boolean;
  status: 'pending' | 'running' | 'done' | 'failed';
  dependsOn?: number[];
};
export type AntTaskPlan = {
  id: string; actionType: AntActionType; intent: string;
  implicitNeeds?: string; urgency: 'low' | 'normal' | 'high';
  steps: AntPlanStep[]; riskLevel: AntRiskLevel;
  requiresApproval: boolean;
  status: 'preview' | 'confirmed' | 'executing' | 'complete' | 'cancelled';
};
export type AiAntBackendResponse = {
  conversation_id: string;
  message_id: string;
  reply: string;
  intent: string;
  status: 'completed' | 'approval_required' | 'draft_created';
  model: string;
  confidence: number;
  approval_required: boolean;
  usage?: { input_tokens: number; output_tokens: number; estimated_cost_usd: number };
  plan_id?: string | null;
  plan_name?: string | null;
  route_source?: string | null;
};

// ── Execution / mode / swarm ─────────────────────────────────────────────────

export type AntExecutionMode = 'simple-chat' | 'single-agent' | 'ai-team' | 'workflow' | 'tool-action' | 'approval-sensitive';
export type ExecutionMode = 'simple_chat' | 'operator_task' | 'device_action' | 'single_agent' | 'agent_swarm' | 'one_man_enterprise' | 'workflow' | 'approval_sensitive' | 'deliverable_generation';
export type ApprovalLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';
export type SwarmState = 'analyzing_goal' | 'matching_agents' | 'creating_agents' | 'assigning_tasks' | 'agents_working' | 'reviewing_outputs' | 'deliverable_ready';
export type ColonyDeliverableType = 'report' | 'strategy' | 'spreadsheet' | 'presentation' | 'email_draft' | 'research_summary' | 'business_plan' | 'marketing_plan' | 'task_list' | 'workflow_automation' | 'decision_recommendation';
export type ColonyDeliverableStatus = 'draft' | 'in_progress' | 'needs_review' | 'approved' | 'exported' | 'archived';
export type DeviceActionType = 'read_file' | 'summarize_file' | 'inspect_screenshot' | 'search_browser' | 'open_app' | 'extract_data' | 'write_file' | 'send_message' | 'update_spreadsheet' | 'upload_file' | 'download_file';
export type DeviceActionRisk = 'low' | 'medium' | 'high' | 'critical';

export type ExecutionDecision = {
  id: string;
  mode: ExecutionMode;
  confidence: number;
  reason: string;
  suggestedNextStep: string;
  approvalLevel: ApprovalLevel;
  expectedDeliverables: string[];
  suggestedAgents: string[];
  sourcePrompt: string;
};

export type ColonyDeliverable = {
  id: string;
  projectId?: string;
  ownerAgentId?: string;
  title: string;
  type: ColonyDeliverableType;
  status: ColonyDeliverableStatus;
  content: string;
  preview: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  sourceTasks: string[];
  approvalStatus: 'none' | 'pending' | 'approved' | 'rejected';
  artifacts?: Artifact[];
  sourceChatId?: string;
  sourceCrewRunId?: string;
  sourceWorkflowId?: string;
};

export type DeviceAction = {
  id: string;
  deviceId: string;
  actionType: DeviceActionType;
  target: string;
  description: string;
  riskLevel: DeviceActionRisk;
  status: 'proposed' | 'waiting_approval' | 'running' | 'completed' | 'rejected';
  approvalRequired: boolean;
  preview: string;
  result?: string;
};

// ── Device mode: action / permission flow ─────────────────────────────────────

export type DeviceActionStatus = 'permission_required' | 'approved' | 'running' | 'completed' | 'rejected' | 'failed';
export type DeviceAccessLevel = 'read-only' | 'edit' | 'export' | 'send';
export type DeviceActionVerb = 'read' | 'summarize' | 'inspect' | 'edit' | 'export' | 'send' | 'upload' | 'download';

export interface DeviceActionRequest {
  id: string;
  task: string;
  sourceTool: string;
  target: string;
  verb: DeviceActionVerb;
  accessLevel: DeviceAccessLevel;
  risk: 'low' | 'medium' | 'high';
  affectedData: string;
  status: DeviceActionStatus;
  progressStep: number;
  result?: string;
  approvedForProject?: boolean;
}

// ── Project intent / team proposal ──────────────────────────────────────────

export type ProjectIntent = {
  id: string;
  name: string;
  goal: string;
  description: string;
  status: 'draft' | 'planning' | 'running' | 'waiting_for_approval' | 'completed' | 'paused' | 'failed';
  suggestedMode: ExecutionMode;
  sourcesNeeded: string[];
  expectedDeliverables: string[];
};

export type AntTeamAgent = {
  name: string;
  role: string;
  responsibility: string;
  tools: string[];
  output: string;
  status: 'proposed' | 'queued' | 'working' | 'done';
  skills?: AgentSkill[];
  activeModel?: ModelConfig;
};

export type AntTeamProposal = {
  id: string;
  mode: AntExecutionMode;
  projectName: string;
  goal: string;
  whyTeam: string;
  hierarchy: string[];
  agents: AntTeamAgent[];
  plan: string[];
  tools: string[];
  approvals: string[];
  deliverables: Array<{ title: string; type: string; owner: string; status: 'Planned' | 'In progress' | 'Review' | 'Ready'; preview: string }>;
};

export type AntGeneratedProject = {
  id: string;
  proposal: AntTeamProposal;
  progress: number;
  status: 'Planning' | 'Working' | 'Review needed' | 'Delivered';
  activeAgent: string;
  currentTask: string;
  nextStep: string;
  latestUpdate: string;
};

// ── Tools / permissions / delivery / handoffs / autonomy ─────────────────────

export type AntToolCategory = 'filesystem' | 'browser' | 'workflow' | 'spreadsheets' | 'ocr' | 'email' | 'cloud' | 'messaging' | 'mobile' | 'desktop' | 'api';
export type AntTool = {
  id: string; name: string; category: AntToolCategory;
  confidence: number; available: boolean; offline?: boolean;
  requiresPermission: string; cost: 'free' | 'low' | 'medium' | 'high';
  icon: string; reason?: string; fallback?: string;
};
export type AntPermissionScope = {
  id: string; name: string; type: 'folder' | 'app' | 'service' | 'api';
  access: 'read' | 'write' | 'read-write' | 'none';
  temporary?: boolean; expiresAt?: string;
  risk: AntRiskLevel; granted: boolean; icon: string;
};
export type AntDelivery = {
  id: string; fileName: string;
  destination: 'line' | 'email' | 'google-drive' | 'slack' | 'discord' | 'colony';
  status: 'pending' | 'approved' | 'sent' | 'failed' | 'expired';
  createdAt: string; deliveredAt?: string; fileSize: string;
  approvalRequired: boolean; icon: string;
};
export type AntHandoff = {
  id: string; taskTitle: string; fromDevice: string; toDevice: string;
  progress: number; status: 'pending' | 'active' | 'complete'; transferredAt: string;
};
export type AntLiveEvent = {
  id: string; time: string;
  type: 'action' | 'screenshot' | 'step' | 'error' | 'approval' | 'memory';
  message: string; device: string; icon: string;
};
export type AntRecoverySuggestion = {
  id: string; type: 'retry' | 'rollback' | 'switch-tool' | 'ask-user';
  label: string; description: string; icon: string;
};
export type AntAutonomyLevel = {
  id: AntMode; label: string; power: number;
  description: string; checkpoints: string[]; risk: string; dot: string;
};

// ── Intelligence & memory ────────────────────────────────────────────────────

export type AntLearnedPattern = {
  id: string; name: string; description: string;
  confidence: number; frequency: number; learnedFrom: string;
  domain: AntDomain; suggestedAutomation?: string;
  enabled: boolean; lastSeen: string;
};

export type AntSearchFilter = 'all' | 'pdf' | 'images' | 'sheets' | 'reports' | 'recent' | 'shared' | 'workflow-output';
export type AntSearchResult = {
  id: string; name: string; type: string; relevance: number;
  matchReason: string; path: string; lastOpened: string;
  source: 'local' | 'drive' | 'workflow' | 'chat' | 'report';
  relatedWorkflows?: string[]; preview?: string; icon: string;
};

export type GraphNodeType = 'file' | 'folder' | 'workflow' | 'agent' | 'app' | 'report' | 'device' | 'task';
export type GraphNode = {
  id: string; type: GraphNodeType; label: string;
  icon: string; x: number; y: number; active: boolean;
};
export type GraphEdge = { from: string; to: string; label: string };

export type KnowledgeCategory = 'recent' | 'important' | 'insight' | 'resource' | 'system';
export type KnowledgeSource = 'workflow' | 'chat' | 'file' | 'report' | 'pattern' | 'approval';
export type KnowledgeEntry = {
  id: string; title: string; summary: string;
  source: KnowledgeSource; category: KnowledgeCategory;
  confidence: number; createdAt: string; pinned: boolean; archived: boolean;
};

export type VoiceState = 'idle' | 'listening' | 'processing' | 'responding';

export type AntNotificationPriority = 'info' | 'warning' | 'critical' | 'success';
export type AntNotificationCategory = 'workflow' | 'approval' | 'task' | 'file' | 'export' | 'device' | 'suggestion' | 'risk';
export type AntNotification = {
  id: string; title: string; body: string;
  priority: AntNotificationPriority; time: string; read: boolean;
  category: AntNotificationCategory;
  actions?: Array<{ label: string; variant: 'primary' | 'secondary' | 'danger' }>;
};

export type AntSuggestionType = 'automation' | 'optimization' | 'organization' | 'repair' | 'memory' | 'connector' | 'export' | 'safety';
export type AntSuggestion = {
  id: string; title: string; explanation: string; benefit: string;
  confidence: number; type: AntSuggestionType;
  action: string; dismissed: boolean; applied: boolean;
};

// ── Workflow integration ────────────────────────────────────────────────────

export type AntWorkflowStatus = 'idle' | 'running' | 'paused' | 'complete' | 'failed' | 'repairing';
export type AntWorkflowTriggerSource = 'user' | 'ant' | 'schedule' | 'event';
export type AntWorkflowOrigin = 'prompt' | 'template' | 'repair' | 'manual';
export type AntWorkflowDef = {
  id: string; name: string; description: string; icon: string;
  stepCount: number; status: AntWorkflowStatus; progress: number;
  origin: AntWorkflowOrigin; lastRun?: string; nextRun?: string;
  triggeredBy: AntWorkflowTriggerSource; estimatedDuration: string;
  repairLog?: string[];
};

// ── Multi-Ant collaboration ─────────────────────────────────────────────────

export type AntRole = 'orchestrator' | 'research' | 'finance' | 'file' | 'browser' | 'communication' | 'data';
export type AntAgentStatus = 'idle' | 'active' | 'waiting' | 'complete' | 'failed';
export type AntAgent = {
  id: string; name: string; role: AntRole; icon: string; color: string;
  status: AntAgentStatus; currentTask?: string; progress?: number;
  confidence: number; delegatedFrom?: string; subAgents?: string[];
  completedTasks: number;
};
export type AntColonySession = {
  id: string; objective: string; agents: AntAgent[];
  status: 'planning' | 'executing' | 'complete' | 'failed';
  overallProgress: number; startedAt: string; estimatedComplete: string;
};

// ── Enterprise team scaffolding ──────────────────────────────────────────────

export type TeamMemberRole = 'admin' | 'member' | 'viewer';
export type TeamMember = {
  id: string; name: string; role: TeamMemberRole; initials: string;
  online: boolean; devicesShared: number; lastActive: string;
  color: string;
};
