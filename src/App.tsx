import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { demoAgents } from './data/demoAgents';
import { demoDeliverables } from './data/demoDeliverables';
import { demoScenarios } from './data/demoScenarios';
import { AdminDashboard, AdminForbidden } from './components/admin/AdminDashboard';
import type { FeatureName, UserRole } from './lib/admin/adminTypes';
import {
  CAPABILITY_LABELS,
  CAPABILITY_ROUTES,
  EXPENSIVE_CAPABILITIES,
  createAgentSkill,
  estimateCapabilityCredits,
  resolveModelForCapability,
  routeCapability,
  type AgentCapability,
  type AgentModelConfig,
  type AgentSkill,
  type Artifact,
  type ColonyAgent,
  type ModelConfig,
  type ModelProvider,
  type ResolvedModel,
  type RoutingDecision,
} from './lib/aiOrchestration';
import { guardAIRequest, AIRequestGuardError } from './lib/ai/aiRequestGuard';
import { trackAIRequest } from './lib/admin/adminTracking';
import { getPlanEntitlements, getLimit } from './lib/billing/entitlements';
import { getAnnualSavings, getPlanPrice, PLAN_ORDER, PLANS as BILLING_PLANS } from './lib/billing/plans';
import { changePlan, createCheckoutSession, createCustomerPortalSession, ensureSubscriptionForUser, getSubscription, isBillingMockMode } from './lib/billing/subscriptions';
import { currentUsagePeriod, getMonthlyUsage } from './lib/billing/usage';
import type { PlanId as BillingPlanId, UsageFeature } from './lib/billing/types';
import { getMockUserByEmail, MOCK_USERS } from './lib/mock/mockUsers';
import {
  ensureMockAdminUser,
  getCurrentUser,
  normalizeEmail,
  signOut as signOutMock,
  validateEmail,
} from './lib/auth/mockAuth';
import type { AuthProvider, AuthUser } from './lib/auth/mockAuth';
import { canAccessAdminDashboard, canAccessApp, canSeeDeveloperSettings, isDeveloperOrAdmin, roleBadgeLabel } from './lib/auth/roles';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Sun,
  Moon,
  Smartphone,
  Laptop,
  Lightbulb,
  Download,
  Mic,
  Upload,
  BarChart3,
  Bot,
  Brain,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ClipboardCheck,
  Cloud,
  CreditCard,
  Database,
  Eye,
  EyeOff,
  FileText,
  Filter,
  FolderOpen,
  FolderPlus,
  Globe,
  Grid3x3,
  AlertTriangle,
  HelpCircle,
  Home,
  Image as ImageIcon,
  Layers3,
  Link as LinkIcon,
  Loader2,
  LogOut,
  Mail,
  Maximize2,
  MessageSquare,
  MessageSquarePlus,
  Menu,
  Minimize2,
  Minus,
  Monitor,
  MoreHorizontal,
  Network,
  PenLine,
  Play,
  Plug,
  Plus,
  RotateCcw,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Square,
  StickyNote,
  Terminal,
  Target,
  TrendingUp,
  Trash2,
  User,
  Users,
  Video as VideoIcon,
  Workflow,
  X,
  Zap,
  Pin,
  PinOff,
} from 'lucide-react';

import { LoginPage, ForgotPasswordPage, VerifyEmailPage, AccessPendingPage } from './pages/Auth';
import {
  ProductPage as MarketingProductPage,
  HowItWorksPage as MarketingHowItWorksPage,
  FeaturesPage as MarketingFeaturesPage,
  PricingPage as MarketingPricingPage,
  RoadmapPage as MarketingRoadmapPage,
  AboutPage as MarketingAboutPage,
  EarlyAccessPage as MarketingEarlyAccessPage,
  PrivacyPage as MarketingPrivacyPage,
  TermsPage as MarketingTermsPage,
  AIAntPage as MarketingAIAntPage,
  ColonyCrewPage as MarketingColonyCrewPage,
  OneManEnterprisePage as MarketingOneManEnterprisePage,
  AutomationPage as MarketingAutomationPage,
  ColonyBridgePage as MarketingColonyBridgePage,
} from './pages/marketing';
import { AIRoutingCard } from './pages/ai-ant/AIRoutingCard';

import { AIAntActivityLog, AIAntApprovalModal, AIAntAutonomySelector, AIAntColonyPanel, AIAntConfidenceBadge, AIAntCorrectionPanel, AIAntDeliveryPanel, AIAntDevicePanel, AIAntDevicesStrip, AIAntFileCard, AIAntHandoffBanner, AIAntKnowledgeBase, AIAntLearnedPatterns, AIAntLiveConsole, AIAntModeToggle, AIAntNotificationBell, AIAntNotificationDrawer, AIAntPermissionManager, AIAntRecoveryCard, AIAntSandboxPanel, AIAntSemanticSearch, AIAntSmartSuggestions, AIAntStatusStrip, AIAntTaskPanel, AIAntToolRouterPanel, AIAntVoiceBar, AIAntWorkflowPanel, AIAntWorkspaceGraph, AIAntWorkspacePanel, AITeamProposalCard, AddMenuItem, AntAssistantMessageActions, AntPlanCard, AntPromptInput, AntPromptSuggestions, CrewWorkspace, DeliverablePreviewCard, DeviceActionFlowCard, ExecutionDecisionCard, KBEntry, ModelRoutingSelector, NotifItem, ProjectIntentCard, AIProjectWorkspace } from './components/ai-ant/AIAntComponents';

import { OnboardingPage } from './pages/OnboardingPage';
import { onAuthStateChanged, signOut as signOutFirebase } from 'firebase/auth';
import { pageFromPath, pathFromPage } from './lib/navigation/routes';
import { authUserFromFirebase } from './lib/auth/firebaseAuthAdapter';
import { firebaseAuth } from './lib/firebase/client';
import { GlobalBackgroundVideo, LandingPage } from './pages/LandingPage';
import { ColonyLogo, AntMark } from './components/brand/BrandMarks';
import { BorderGlow } from './components/effects/BorderGlow';
import { BlurText } from './components/effects/BlurText';
import { Popover, PopoverTrigger, PopoverContent } from './components/ui/Popover';
import { ProviderLogo } from './components/model/ProviderLogo';
import { SUPPORTED_MODELS, type SupportedModel } from './lib/modelCatalog';
import type { Page } from './types/navigation';
import {
  PROVIDER_LABELS,
  MANUAL_PROVIDERS,
  inferCapabilitiesFromText,
  skillsForCapabilities,
  defaultActiveModel,
  resolveSkillModel,
  shortResolvedModelName,
  MODEL_DESCRIPTIONS,
  MODEL_TAGS,
  providerIcon,
  modelConfigFromResolved,
  supportedModelsForCapability,
  supportedToAgentConfig,
  resolveAutoModel,
  compatibleModelsForCapability,
  skillSummary,
  ModelChip,
  ModelCard,
  ModelRoutingSummary,
  SkillModelPills,
  CapabilityLine,
} from './lib/modelDisplay';
import { OSPageShell } from './components/shared/OSPageShell';

import { AppModal } from './components/modals/AppModal';
import { ContextMenu } from './components/modals/ContextMenu';

import { ActionConfirmModal, AISuggestionsPanel, ApprovalCardModal, ApprovalHistoryModal, ApprovalRulesModal, AuditLogModal, BuildWorkflowModal, ConfirmModal, DataPipelineModal, DebugWorkflowModal, DeleteAccountModal, EmailDraftModal, ExplainWorkflowModal, FileProcessingCenter, GenerateInstructionsModal, ImproveWorkflowModal, LineDraftModal, ModalShell, ReportEditorModal, ReportExportModal, ReportListModal, ReportPreviewModal, RunHistoryModal, ScheduleReportModal, ScheduledReportsModal, UpgradeModal, WorkflowQualityModal } from './components/modals/Modals';

import { KimiStyleSidebar, Sidebar } from './components/sidebar/Sidebar';
import { AppDrawer } from './components/drawer/AppDrawer';

import { OSGridCards, type OSCard } from './components/shared/OSGridCards';
import { ApprovalsOSPage } from './pages/approvals/ApprovalsOSPage';
import { TemplatesCommunityPage } from './pages/templates/TemplatesCommunityPage';
import { TeamsOSPage } from './pages/teams/TeamsOSPage';
import { WorkflowsOSPage } from './pages/workflows/WorkflowsOSPage';
import { ConnectorsMarketplacePage } from './pages/connectors/ConnectorsMarketplacePage';
import { ProjectsOSPage } from './pages/projects/ProjectsOSPage';
import { DeliverablesOSPage } from './pages/deliverables/DeliverablesOSPage';
import { KnowledgeOSPage } from './pages/knowledge/KnowledgeOSPage';

import { BillingScreen } from './pages/billing/BillingScreen';
import {
  ColonyCrewCard,
  ColonyCrewPanel,
  ColonyCrewReopenPill,
  analyzeAndMatchAgents,
  buildColonyCrewAgents,
  buildColonyCrewResult,
  buildDefaultCrewRun,
  parseCrewControl,
} from './pages/colony-crew/ColonyCrewPanel';
import { SettingsScreen } from './pages/settings/SettingsScreen';
import { WorkflowBuilderPage, WorkflowProposalCard } from './pages/workflow/WorkflowBuilderPage';
import {
  AddWorkspaceMemberModal,
  AgentRightPanel,
  ENTERPRISE_AGENT_AVATARS,
  ENTERPRISE_SETUP_BLUEPRINT,
  ENTERPRISE_SETUP_STORAGE_KEY,
  EnterpriseSetupPanel,
  EnterpriseWorkspace,
  OneManEnterprisePanel,
  WORKSPACE_MEMBERS_STORAGE_KEY,
  WorkspaceMemberAvatar,
  buildEnterpriseSetup,
  buildEnterpriseWorkspaceProject,
} from './pages/one-man-enterprise/OneManEnterprisePage';

import { BossIntake } from './pages/one-man-enterprse/BossIntake';
import { EnterpriseOrgPreviewPanel } from './pages/one-man-enterprse/oneManEnterprise';
import type {
  AgentConnection,
  AgentConnectionStatus,
  AgentConnectionType,
  AgentNodePosition,
  EnterpriseAgent,
  EnterpriseAgentStatus,
  EnterpriseApprovalStatus,
  EnterpriseDeliverableStatus,
  EnterpriseDepartment,
  EnterpriseDepartmentColor,
  EnterpriseMessageType,
  EnterpriseProjectStatus,
  EnterpriseSetupStep,
  EnterpriseTaskStatus,
  EnterpriseWorkspaceAgent,
  EnterpriseWorkspaceApproval,
  EnterpriseWorkspaceChannel,
  EnterpriseWorkspaceDeliverable,
  EnterpriseWorkspaceMessage,
  EnterpriseWorkspaceProject,
  EnterpriseWorkspaceTask,
  OneManEnterpriseSetup,
} from './pages/one-man-enterprse/oneManEnterprise';
import { BridgeOperatorPage } from './pages/bridge/BridgeOperatorPage';
import { BridgeSetupCard, type BridgeSetupCardData } from './pages/bridge/BridgeSetupCard';
import {
  loadBridgeSessions,
  upsertBridgeSession,
  type BridgeSession,
} from './lib/bridge/bridgeSessionStore';
import { createBridgeSessionFromTask } from './lib/bridge/bridgeIntake';
import { type WorkItemStatus, type WorkItemType } from './lib/work/workItems';
import {
  ONBOARDING_KEY,
  getApiBaseUrl,
  isAdminRole,
  loadProfile,
  resolveBackendUserId,
  resolveSurveyUserId,
  saveProfile,
  usageFeatureToAdminFeature,
} from './lib/profile/profileApi';
import { CUSTOM_MODELS_STORAGE_KEY, loadCustomModels } from './lib/profile/customModels';
import {
  APP_DELIVERABLES_KEY,
  SEED_APP_DELIVERABLES,
  SEED_WS_CHATS,
  SEED_WS_DELIVERABLES,
  SEED_WS_PROJECTS,
  WORK_STATUS_LABELS,
  WORK_TYPE_META,
  WS_CHATS_KEY,
  WS_PROJECTS_KEY,
  generateChatTitle,
  isEmptyDraftStandaloneChat,
  loadAppDeliverables,
  loadWorkspaceChats,
  loadWorkspaceProjects,
  normalizeWorkItemStatus,
  normalizeWorkItemType,
  repairWorkspaceChats,
  resolveChatWorkStatus,
  resolveWorkItemType,
  saveAppDeliverables,
  sourceConversationForFeature,
} from './lib/workspace/workspaceApi';
import {
  DEVICE_ACCESS_FOR_VERB,
  DEVICE_RUN_STEPS,
  analyzeDeviceAction,
  classifyAntExecutionMode,
  readableField,
  titleFromGoal,
} from './lib/aiAnt/aiAntHelpers';

import {
  AGENT_MODE_LABEL,
  AGENT_MODE_OPTIONS,
  AGENT_MODE_SHORT_LABEL,
  MANUAL_MODEL_GROUPS,
  MODEL_ROUTING_OPTIONS,
  applyRoutingPreferenceToResolvedModel,
  backendCapabilityForIntent,
  buildBackendRoutingDecision,
  buildRoutingDecision,
  buildRoutingDecisionWithPreference,
  classifyExecutionIntent,
  createDemoDeliverable,
  deliverableTypeFromDecision,
  modeFromInputMode,
  modelRoutingLabel,
  normalizeAgentInputMode,
  resolvedModeFromDecision,
  routingAgentsFromProposal,
  routingModeFromInput,
} from './lib/aiAnt/routing';

import {
  AGENT_BODY,
  AGENT_CARD,
  AGENT_GAP_X,
  AGENT_GRID_GAP_X,
  AGENT_GRID_GAP_Y,
  AGENT_START_X,
  AGENT_START_Y,
  BOARD_SIZE,
  CHAT_WINDOW_DEFAULT_SIZE,
  CHAT_WINDOW_HEADER_OFFSET,
  CHAT_WINDOW_MARGIN,
  CHAT_WINDOW_MIN_SIZE,
  SOURCE_AGENT_TYPES,
  clamp,
  connectionPath,
  drawPixelRect,
  getNextAgentPosition,
} from './lib/canvas/canvasLayout';
import {
  ADDON_CATALOG,
  BILLING_LS_KEY,
  FEATURE_TABLE,
  PLAN_LIMITS,
  buildBillingFeatureTable,
  formatLimit,
  loadBillingState,
  saveBillingState,
} from './lib/billing/billingCatalog';

import { REPORT_TEMPLATES, MOCK_REPORTS, MOCK_SCHEDULED_REPORTS, _mkSections } from './lib/data/reportData';

import { ALL_SKILLS, ALL_TOOLS, ALL_TONES, BRANCH_ELSE_ACTIONS, BRANCH_METRICS, BRANCH_OPERATORS, BRANCH_THEN_ACTIONS, BUBBLE_MESSAGES, CANVAS_CHAR_CONFIGS, CHAR_CONFIGS, DEFAULT_PARALLEL_GROUPS, DEFAULT_WORKFLOW_CONFIG, DEFAULT_WORKFLOW_STEPS, LOOP_SOURCE_OPTIONS, MOCK_WORKFLOW_VERSIONS, MODEL_OPTIONS, SpriteAnimator, TEMPLATE_CATEGORIES, TRIGGER_OPTIONS, WEEKDAYS, WORKFLOW_INPUT_OPTIONS, WORKFLOW_OUTPUT_OPTIONS } from './lib/data/workflowDefaults';
import { CHAT_PROJECTS, CHAT_SERVERS, getDefaultChannelId, getDefaultServerChannelId, getProjectChannelMessages, getProjectIcon, getProjectStatusLabel, getServerChannelMessages } from './lib/data/chatSeedData';
import { AGENT_IO, COMING_SOON_CONNECTORS, DATA_STANDARD_FIELDS, DEFAULT_DATA_PREVIEW_STATE, INITIAL_CONNECTORS, MOCK_PIPELINE_COLUMNS, MOCK_PIPELINE_MAPPINGS, MOCK_PIPELINE_ROWS, MOCK_PIPELINE_VALIDATION, MOCK_PROCESSED_FILES, MOCK_SOURCE_HISTORY, ROLE_OPTIONS, TOOL_TO_CONNECTOR_ID } from './lib/data/connectorSeedData';
import { DEFAULT_APPROVAL_RULES, DEFAULT_SAFETY_RULES, DEFAULT_USAGE_STATE, MOCK_APPROVAL_HISTORY, MOCK_APPROVAL_REQUESTS, MOCK_AUDIT_LOGS, MOCK_INVOICES, MOCK_WORKFLOW_RUNS, PLANS } from './lib/data/runSeedData';
import { ANT_AUTONOMY_LEVELS, ANT_CAPABILITIES, ANT_COLONY_SESSION, ANT_DEVICES, ANT_INITIAL_DELIVERIES, ANT_INITIAL_LIVE_EVENTS, ANT_INITIAL_LOGS, ANT_INITIAL_MEMORIES, ANT_INITIAL_TASKS, ANT_KNOWLEDGE_INITIAL, ANT_LEARNED_PATTERNS, ANT_NOTIFICATIONS_INITIAL, ANT_PERMISSIONS, ANT_QUICK_ACTIONS, ANT_RECOVERY_SUGGESTIONS, ANT_SEARCH_RESULTS, ANT_SUGGESTIONS_INITIAL, ANT_TEAM_MEMBERS, ANT_TOOLS, ANT_WORKFLOWS_INITIAL, ANT_WORKSPACES, GRAPH_EDGES, GRAPH_NODES } from './lib/data/aiAntSeedData';

import { detectRisk } from './lib/workflow/risk';
import {
  AI_WORKFLOW_TEMPLATES,
  estimateWorkflowCredits,
  mockAnalyzeWorkflow,
  mockDebugWorkflow,
  mockGenerateExplanation,
  mockGenerateInstructions,
  mockGenerateWorkflow,
  mockScoreWorkflow,
} from './lib/workflow/workflowMocks';
import { createWorkflowProposalFromPrompt, workflowFromProposal } from './lib/workflow/workflowProposal';
import {
  WORKFLOW_CANVAS_BOTTOM_GUTTER,
  WORKFLOW_CANVAS_SIZE,
  WORKFLOW_DESTINATION_OPTIONS,
  WORKFLOW_LOGS_COLLAPSED_HEIGHT,
  WORKFLOW_LOGS_EXPANDED_HEIGHT,
  WORKFLOW_NODE_GAP,
  WORKFLOW_NODE_SIZE,
  WORKFLOW_NODE_TYPE_OPTIONS,
  WORKFLOW_TEMPLATES,
  WORKFLOW_Z,
  applyInstructionToNode,
  applyWorkflowNodeValidation,
  defaultWorkflowNodeConfig,
  findOpenWorkflowPosition,
  getWorkflowConnector,
  isExternalWorkflowDestination,
  makeWorkflowNode,
  nodeChangeSummary,
  parseInstructionTime,
  setWorkflowConfigValue,
  validateWorkflow,
  validateWorkflowNode,
  workflowConfigValue,
  workflowDestinationConnectionKey,
  workflowDestinationConnector,
  workflowEdgePath,
  workflowEdgeTone,
  workflowHandlePoint,
  workflowNodeIcon,
  workflowNodeTone,
  workflowNodeTypeLabel,
  workflowNodesOverlap,
  workflowSourceConnectionKey,
  workflowStatusTone,
  workflowValidation,
} from './lib/workflow/workflowBuilder';

import type {
  AddonItem,
  BillingInterval,
  ColonyBillingState,
  CostEstimate,
  FeatureRow,
  Invoice,
  PlanDef,
  PlanTier,
  UpgradeModalState,
  UpgradeReason,
  UsageEvent,
  UsageState,
} from './lib/types/billingTypes';
import type {
  AgentAvatarColor,
  AgentInstructionMessage,
  ColonyCrewSession,
  CrewActivityEvent,
  CrewAgent,
  CrewAgentKind,
  CrewAgentStatus,
  CrewControlIntent,
  CrewControlMessage,
  CrewPanelAgent,
  CrewPhase,
  CrewRun,
  CrewStatus,
  CrewTask,
  CrewTaskStatus,
  MatchedAgent,
  OrchAgent,
  OrchMessage,
  OrchestrationMode,
  OrchestrationView,
} from './lib/types/crewTypes';
import type {
  AgentError,
  AgentModel,
  AgentStatus,
  AgentType,
  ApprovalRequest,
  ApprovalRule,
  AuditActionType,
  AuditActorType,
  AuditLog,
  AuditRollbackStatus,
  BranchRule,
  CanvasAgent,
  CanvasAgentType,
  CanvasTool,
  LoopConfig,
  LoopSource,
  ManualModelSelection,
  ModelRoutingPreference,
  NodeChange,
  NodeInstruction,
  ParallelGroup,
  PendingAction,
  RiskAssessment,
  RunError,
  RunStatus,
  RunStep,
  RunStepStatus,
  RunTrigger,
  SafetyConfig,
  SafetyRule,
  StepApprovalConfig,
  TemplateCategory,
  Workflow as WorkflowDef,
  WorkflowApprovalRule,
  WorkflowApprovalType,
  WorkflowBuilderRun,
  WorkflowConfig,
  WorkflowConnector,
  WorkflowConnectorStatus,
  WorkflowDestinationType,
  WorkflowEdge,
  WorkflowEdgeStatus,
  WorkflowErrorHandling,
  WorkflowExecution,
  WorkflowExecutionStatus,
  WorkflowFileFormat,
  WorkflowInputType,
  WorkflowMode,
  WorkflowNode,
  WorkflowNodeConfig,
  WorkflowNodeStatus,
  WorkflowNodeType,
  WorkflowNotificationChannel,
  WorkflowOutputFormat,
  WorkflowOutputType,
  WorkflowProposal,
  WorkflowRun,
  WorkflowRunLog,
  WorkflowSchedule,
  WorkflowSourceType,
  WorkflowStatus,
  WorkflowStep,
  WorkflowTemplate,
  WorkflowTone,
  WorkflowTransformType,
  WorkflowTrigger,
  WorkflowTriggerKind,
  WorkflowTriggerType,
  WorkflowValidationState,
  WorkflowVersion,
  WorkflowVersionSnapshot,
} from './lib/types/workflowTypes';
import type {
  AiAntBackendResponse,
  AntActionType,
  AntActivityEntry,
  AntAgent,
  AntAgentStatus,
  AntApproval,
  AntAutonomyLevel,
  AntColonySession,
  AntConfidenceLevel,
  AntCorrectionField,
  AntDelivery,
  AntDevice,
  AntDeviceStatus,
  AntDeviceType,
  AntDomain,
  AntExecutionMode,
  AntFileCard,
  AntGeneratedProject,
  AntHandoff,
  AntLearnedPattern,
  AntLiveEvent,
  AntMemoryEntry,
  AntMessage,
  AntMode,
  AntNotification,
  AntNotificationCategory,
  AntNotificationPriority,
  AntPermissionScope,
  AntPlanStep,
  AntRecoverySuggestion,
  AntRiskLevel,
  AntRole,
  AntSearchFilter,
  AntSearchResult,
  AntSuggestion,
  AntSuggestionType,
  AntTask,
  AntTaskPlan,
  AntTaskStatus,
  AntTeamAgent,
  AntTeamProposal,
  AntTool,
  AntToolCategory,
  AntWorkflowDef,
  AntWorkflowOrigin,
  AntWorkflowStatus,
  AntWorkflowTriggerSource,
  AntWorkspace,
  AntWorkspaceSource,
  ApprovalLevel,
  ColonyDeliverable,
  ColonyDeliverableStatus,
  ColonyDeliverableType,
  DeviceAccessLevel,
  DeviceAction,
  DeviceActionRequest,
  DeviceActionRisk,
  DeviceActionStatus,
  DeviceActionType,
  DeviceActionVerb,
  ExecutionDecision,
  ExecutionMode,
  GraphEdge,
  GraphNode,
  GraphNodeType,
  KnowledgeCategory,
  KnowledgeEntry,
  KnowledgeSource,
  ProjectIntent,
  SwarmState,
  TeamMember,
  TeamMemberRole,
  VoiceState,
  WorkspaceMember,
  WorkspaceMemberModalState,
  WorkspaceMemberPermission,
  WorkspaceMemberStatus,
  WorkspaceMemberType,
} from './lib/types/antTypes';
import type {
  AIComplexity,
  AIConfidence,
  AIImpact,
  AIRiskLevel,
  AIWorkflowResult,
  AIWorkflowType,
  AgentInputMode,
  AgentInstructionResult,
  AppConnector,
  AppDrawerView,
  BuildWorkflowModalState,
  CanvasComment,
  CanvasConnection,
  CanvasNote,
  CellEdit,
  CharacterConfig,
  ChatChannel,
  ChatChannelType,
  ChatCommandConfirm,
  ChatMemoryItem,
  ChatMode,
  ChatMsg,
  ChatMsgType,
  ChatProjectDef,
  ChatServer,
  ColumnMappingEntry,
  ConnectionMapping,
  ConnectorAccessLevel,
  ConnectorStatus,
  ContextMenuDef,
  CustomModelEntry,
  DataPreviewRow,
  DataPreviewState,
  DataSourceHistoryItem,
  DataValidationIssue,
  DebugIssue,
  DebugSeverity,
  DebugWorkflowState,
  EditableRow,
  EmailDraftState,
  ExplainWorkflowState,
  ExplanationMode,
  ExportModalState,
  ExtractedTable,
  GenerateInstructionsState,
  GeneratedAgentDef,
  ImproveWorkflowState,
  InstructionQuality,
  LineDraftState,
  NewProjectType,
  ProcessedFile,
  ProcessedFileStatus,
  ProcessedFileType,
  QualityDimension,
  Report,
  ReportExportRecord,
  ReportSection,
  ReportSectionType,
  ReportStatus,
  ReportTemplate,
  ReportTemplateId,
  ReportVersion,
  ScheduledReport,
  ScheduledReportDestination,
  ScheduledReportFrequency,
  SpriteState,
  SuggestionCategory,
  AppDeliverable,
  UserProfile,
  ValidationIssue,
  WorkspaceChat,
  WorkspaceMessage,
  WorkspaceProject,
  ValidationIssueSeverity,
  WorkflowQualityScore,
  WorkflowSuggestion,
  WorkspaceDeliverableItem,
  WorkspaceSource,
} from './lib/types/appTypes';
// Re-export public-surface types so external pages keep their existing import paths.
export type { AppDeliverable, WorkspaceChat, WorkspaceProject } from './lib/types/appTypes';
import { runColonyCrew } from './lib/crew/crewApi';
import { PermissionModal } from './components/bridge/PermissionModal';
import { createBridgeRequest, approveBridgeRequest, executeBridgeRequest, fetchBridgeRequests } from './lib/bridge/bridgeApi';
import type { BridgeRequest } from './lib/bridge/bridgeTypes';


// PROVIDER_LABELS, MANUAL_PROVIDERS, inferCapabilitiesFromText, skillsForCapabilities,
// defaultActiveModel, resolveSkillModel, shortResolvedModelName, MODEL_DESCRIPTIONS,
// MODEL_TAGS, providerIcon, modelConfigFromResolved, supportedModelsForCapability,
// supportedToAgentConfig, resolveAutoModel, compatibleModelsForCapability, skillSummary,
// ModelChip, ModelCard, ModelRoutingSummary, SkillModelPills, CapabilityLine
// → all imported from ./lib/modelDisplay

const glyph = {
  ant: '\uD83D\uDC1C',
  bowl: '\uD83C\uDF5C',
  bag: '\uD83D\uDED2',
  folder: '\uD83D\uDCC1',
  target: '\uD83C\uDFAF',
  test: '\uD83E\uDDEA',
  board: '\uD83D\uDCCB',
  shield: '\uD83D\uDEE1',
  chart: '\uD83D\uDCCA',
  collector: '\uD83D\uDCE5',
  cleaner: '\uD83E\uDDF9',
  writer: '\u270D\uFE0F',
  guard: '\uD83D\uDEE1',
  rocket: '\uD83D\uDE80',
  spark: '\u2726',
  play: '\u25B7',
  arrow: '\u2192',
  down: '\u2193',
  check: '\u2705',
  cross: '\u274C',
  warn: '\u26A0\uFE0F',
  bolt: '\u26A1',
  dot: '\u2022',
};



const ALL_CAPABILITIES = Object.keys(CAPABILITY_LABELS) as AgentCapability[];


function ModelPickerModal({ title, skill, activeModel, onSave, onClose }: {
  title: string;
  skill: AgentSkill;
  activeModel?: ModelConfig;
  onSave: (skill: AgentSkill, activeModel: ModelConfig) => void;
  onClose: () => void;
}) {
  const current = resolveSkillModel(skill, activeModel);
  const initialMode: 'auto' | 'manual' = current.providerMode;
  const initialSelected = React.useMemo(() => modelConfigFromResolved(current), [current]);
  const [routingMode, setRoutingMode] = React.useState<'auto' | 'manual'>(initialMode);
  const [selected, setSelected] = React.useState<AgentModelConfig>(initialSelected);
  const [autoSelecting, setAutoSelecting] = React.useState(current.providerMode === 'auto');
  const allCompatible = React.useMemo(() => compatibleModelsForCapability(skill.capability), [skill.capability]);
  const autoModelEntry = React.useMemo(() => resolveAutoModel(skill.capability), [skill.capability]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showAll, setShowAll] = React.useState(false);
  const recommended = React.useMemo(() => allCompatible.slice(0, 3), [allCompatible]);
  const more = React.useMemo(() => allCompatible.slice(3), [allCompatible]);
  const filteredAll = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allCompatible;
    return allCompatible.filter((m) => `${m.modelName} ${m.provider} ${m.description ?? ''}`.toLowerCase().includes(q));
  }, [allCompatible, searchQuery]);

  // Custom models — locally persisted across sessions.
  const [customModels, setCustomModels] = React.useState<CustomModelEntry[]>(() => loadCustomModels());
  React.useEffect(() => {
    try { localStorage.setItem(CUSTOM_MODELS_STORAGE_KEY, JSON.stringify(customModels)); } catch { /* ignore */ }
  }, [customModels]);
  const customForCapability = React.useMemo(
    () => customModels.filter((m) => m.capability === skill.capability),
    [customModels, skill.capability],
  );

  // Custom model form state.
  type Draft = {
    providerName: string;
    modelName: string;
    modelId: string;
    apiBaseUrl: string;
    description: string;
    tags: string;
    costTier: 'low' | 'standard' | 'high';
    qualityTier: 'draft' | 'standard' | 'high';
  };
  const emptyDraft = React.useMemo<Draft>(() => ({
    providerName: '', modelName: '', modelId: '', apiBaseUrl: '',
    description: '', tags: '', costTier: 'standard', qualityTier: 'standard',
  }), []);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<Draft>(emptyDraft);
  const [formError, setFormError] = React.useState<string | null>(null);
  const openAddForm = () => { setEditingId(null); setDraft(emptyDraft); setFormError(null); setFormOpen(true); };
  const openEditForm = (entry: CustomModelEntry) => {
    setEditingId(entry.id); setFormError(null);
    setDraft({
      providerName: entry.providerName, modelName: entry.modelName, modelId: entry.modelId,
      apiBaseUrl: entry.apiBaseUrl ?? '', description: entry.description ?? '',
      tags: entry.tags?.join(', ') ?? '',
      costTier: entry.costTier ?? 'standard', qualityTier: entry.qualityTier ?? 'standard',
    });
    setFormOpen(true);
  };
  const closeForm = () => { setFormOpen(false); setEditingId(null); setDraft(emptyDraft); setFormError(null); };
  const submitForm = () => {
    if (!draft.providerName.trim()) return setFormError('Provider name is required.');
    if (!draft.modelName.trim()) return setFormError('Model name is required.');
    if (!draft.modelId.trim()) return setFormError('Model ID is required.');
    const entry: CustomModelEntry = {
      id: editingId ?? `custom-${Date.now()}`,
      provider: 'custom',
      providerName: draft.providerName.trim(),
      modelName: draft.modelName.trim(),
      modelId: draft.modelId.trim(),
      capability: skill.capability,
      apiBaseUrl: draft.apiBaseUrl.trim() || undefined,
      description: draft.description.trim() || `${draft.providerName.trim()} · ${draft.modelName.trim()}`,
      tags: draft.tags.split(',').map((t) => t.trim()).filter(Boolean),
      costTier: draft.costTier,
      qualityTier: draft.qualityTier,
      routingMode: 'manual',
      createdAt: editingId
        ? (customModels.find((m) => m.id === editingId)?.createdAt ?? new Date().toISOString())
        : new Date().toISOString(),
    };
    setCustomModels((prev) => editingId
      ? prev.map((m) => m.id === editingId ? entry : m)
      : [entry, ...prev]);
    setRoutingMode('manual');
    setSelected(entry);
    closeForm();
  };
  const deleteCustom = (id: string) => {
    setCustomModels((prev) => prev.filter((m) => m.id !== id));
    if (selected.modelId === customModels.find((m) => m.id === id)?.modelId) {
      setRoutingMode('auto');
      setSelected(modelConfigFromResolved(resolveModelForCapability(skill.capability)));
    }
  };

  React.useEffect(() => {
    if (routingMode !== 'auto') {
      setAutoSelecting(false);
      return;
    }
    setAutoSelecting(true);
    const timer = window.setTimeout(() => {
      setSelected(modelConfigFromResolved(resolveModelForCapability(skill.capability)));
      setAutoSelecting(false);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [routingMode, skill.capability]);

  // Save is enabled when anything changed vs initial state.
  const dirty = routingMode !== initialMode
    || (routingMode === 'manual' && (selected.modelId !== initialSelected.modelId || selected.provider !== initialSelected.provider));

  const save = () => {
    const nextSkill: AgentSkill = {
      ...skill,
      provider: routingMode === 'auto' ? 'auto' : selected.provider,
      modelName: routingMode === 'auto' ? undefined : selected.modelId,
      mode: routingMode,
    };
    onSave(nextSkill, routeCapability(skill.capability, {
      provider: nextSkill.provider,
      modelName: routingMode === 'auto' ? undefined : selected.modelId,
      mode: routingMode,
      costTier: selected.costTier,
      qualityTier: selected.qualityTier,
    }));
  };

  const inputCls = 'w-full rounded-[10px] border border-white/[0.10] bg-[#0b0f1a] px-3 py-2 text-sm text-white outline-none focus:border-violet-400/50';
  const labelCls = 'mb-1 block text-[10px] font-bold uppercase tracking-wide text-white/40';

  return (
    <div className="fixed inset-0 z-[430] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-3xl overflow-hidden rounded-[22px] border border-white/[0.10] bg-[#090d18] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-300/65">Model Picker</p>
            <h3 className="mt-1 font-heading text-lg font-extrabold text-white">{title}</h3>
            <p className="mt-1 text-xs text-white/42">Choose how this agent handles {CAPABILITY_LABELS[skill.capability]}.</p>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-white/55 hover:bg-white/[0.06] hover:text-white"><X size={15} /></button>
        </div>
        <div className="max-h-[72vh] overflow-y-auto px-5 py-5">
          {/* Auto / Manual segmented control */}
          <div className="mb-4 grid gap-2 rounded-[16px] border border-white/[0.07] bg-white/[0.02] p-1.5 sm:grid-cols-2">
            {(['auto', 'manual'] as const).map((mode) => {
              const active = routingMode === mode;
              return (
                <button key={mode} onClick={() => setRoutingMode(mode)}
                  className={`rounded-[12px] px-4 py-3 text-left transition ${active
                    ? 'border border-violet-400/55 bg-violet-500/[0.14] shadow-[0_0_22px_rgba(124,92,252,0.18)]'
                    : 'border border-transparent text-white/55 hover:bg-white/[0.04] hover:text-white/85'}`}>
                  <p className={`text-sm font-bold ${active ? 'text-white' : 'text-white/70'}`}>
                    {mode === 'auto' ? 'Auto routing' : 'Manual override'}
                  </p>
                  <p className={`mt-1 text-xs ${active ? 'text-violet-100/75' : 'text-white/40'}`}>
                    {mode === 'auto' ? 'Let Colony choose the best model.' : 'Choose a specific model yourself.'}
                  </p>
                </button>
              );
            })}
          </div>

          {autoSelecting && (
            <div className="mb-4 overflow-hidden rounded-[16px] border border-emerald-300/18 bg-emerald-400/[0.055] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-emerald-100">Selecting the best model for this role…</p>
                <Loader2 size={16} className="animate-spin text-emerald-200" />
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                <motion.div className="h-full rounded-full bg-emerald-300" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 0.85 }} />
              </div>
            </div>
          )}

          {/* Auto selected — prominent card when routing is Auto */}
          {routingMode === 'auto' && !autoSelecting && (
            <div className="mb-4 rounded-[14px] border border-emerald-300/25 bg-emerald-400/[0.06] p-4">
              <div className="flex items-start gap-3">
                <ProviderLogo provider={autoModelEntry.logoProvider ?? autoModelEntry.provider} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-200/70">Auto selected model</p>
                  <h4 className="mt-0.5 text-base font-bold text-white">{autoModelEntry.displayName}</h4>
                  <p className="mt-0.5 text-[11px] text-white/55">Best match for {CAPABILITY_LABELS[skill.capability]} · {autoModelEntry.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {autoModelEntry.tags.slice(0, 4).map((t) => (
                      <span key={t} className="rounded-full border border-white/[0.08] px-2 py-0.5 text-[9px] font-bold text-white/45">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search filter — searches across the full compatible list */}
          <div className="relative mb-3">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search models or providers…"
              className="w-full rounded-[10px] border border-white/[0.10] bg-[#0b0f1a] py-2 pl-8 pr-3 text-xs text-white outline-none placeholder:text-white/30 focus:border-violet-400/40"
            />
          </div>

          {searchQuery ? (
            /* Filtered results — flat list of everything matching */
            <>
              <div className="mb-2"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">Matching models ({filteredAll.length})</p></div>
              {filteredAll.length === 0 ? (
                <p className="rounded-[12px] border border-dashed border-white/[0.10] py-6 text-center text-xs text-white/30">No models match “{searchQuery}”.</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {filteredAll.map((model) => (
                    <ModelCard key={`${model.provider}-${model.modelId}`}
                      model={{ ...model, routingMode }}
                      selected={selected.modelId === model.modelId && selected.provider === model.provider}
                      expanded
                      onSelect={() => { setRoutingMode('manual'); setSelected(model); }}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Recommended — top 3 */}
              <div className="mb-2"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">Recommended models</p></div>
              <div className="grid gap-3 md:grid-cols-2">
                <AnimatePresence>
                  {recommended.map((model, index) => (
                    <motion.div key={`${model.provider}-${model.modelId}`}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.045 }}>
                      <ModelCard
                        model={{ ...model, routingMode }}
                        selected={selected.modelId === model.modelId && selected.provider === model.provider}
                        expanded
                        onSelect={() => { setRoutingMode('manual'); setSelected(model); }}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* All compatible — collapsible */}
              {more.length > 0 && (
                <div className="mt-3">
                  <button onClick={() => setShowAll((v) => !v)}
                    className="flex items-center gap-1.5 rounded-[10px] border border-white/[0.10] bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/[0.07] hover:text-white">
                    {showAll ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    {showAll ? `Hide ${more.length} more compatible model${more.length === 1 ? '' : 's'}` : `Show all compatible models (${more.length} more)`}
                  </button>
                  <AnimatePresence>
                    {showAll && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="mt-3 overflow-hidden">
                        <div className="grid gap-3 md:grid-cols-2">
                          {more.map((model) => (
                            <ModelCard key={`${model.provider}-${model.modelId}`}
                              model={{ ...model, routingMode }}
                              selected={selected.modelId === model.modelId && selected.provider === model.provider}
                              expanded
                              onSelect={() => { setRoutingMode('manual'); setSelected(model); }}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}

          {/* Custom models */}
          <div className="mt-6 mb-2 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">Custom models</p>
            <button onClick={openAddForm}
              className="flex items-center gap-1.5 rounded-[10px] border border-violet-400/35 bg-violet-500/[0.10] px-3 py-1.5 text-xs font-semibold text-violet-100 transition hover:bg-violet-500/[0.18]">
              <Plus size={12} /> Add custom model
            </button>
          </div>
          {customForCapability.length === 0 && !formOpen ? (
            <div className="rounded-[14px] border border-dashed border-white/[0.10] bg-white/[0.02] p-5 text-center">
              <p className="text-sm font-semibold text-white/55">No custom models yet</p>
              <p className="mt-1 text-xs text-white/30">Add your own model or provider for this capability.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {customForCapability.map((entry) => {
                const isSelected = selected.provider === 'custom' && selected.modelId === entry.modelId;
                return (
                  <div key={entry.id}
                    className={`relative rounded-[14px] border p-3 transition ${isSelected
                      ? 'border-emerald-300/35 bg-emerald-400/[0.08] shadow-[0_0_28px_rgba(52,211,153,0.16)]'
                      : 'border-white/[0.08] bg-white/[0.035] hover:border-white/[0.16] hover:bg-white/[0.05]'}`}>
                    <button onClick={() => { setRoutingMode('manual'); setSelected(entry); }} className="flex w-full items-start gap-3 text-left">
                      <ProviderLogo provider={entry.providerName.toLowerCase()} size="md" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold text-white/88">{entry.modelName}</span>
                            <span className="mt-0.5 block text-[11px] font-semibold text-white/45">{entry.providerName} · Custom</span>
                          </span>
                          {isSelected && <Check size={15} className="mt-0.5 shrink-0 text-emerald-200" />}
                        </span>
                        {entry.description && <span className="mt-2 block text-xs leading-relaxed text-white/50">{entry.description}</span>}
                        <span className="mt-2 flex flex-wrap gap-1.5">
                          {(entry.tags ?? []).slice(0, 4).map((t) => <span key={t} className="rounded-full border border-white/[0.08] px-2 py-0.5 text-[9px] font-bold text-white/40">{t}</span>)}
                        </span>
                      </span>
                    </button>
                    <div className="mt-2.5 flex justify-end gap-1.5">
                      <button onClick={() => openEditForm(entry)} className="rounded-[8px] border border-white/[0.10] px-2.5 py-1 text-[10px] font-bold text-white/55 hover:bg-white/[0.06] hover:text-white">Edit</button>
                      <button onClick={() => deleteCustom(entry.id)} className="rounded-[8px] border border-red-400/25 bg-red-500/[0.06] px-2.5 py-1 text-[10px] font-bold text-red-300 hover:bg-red-500/[0.14]">Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Custom model form */}
          <AnimatePresence>
            {formOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="mt-3 overflow-hidden rounded-[14px] border border-violet-400/25 bg-[#0a0d18]">
                <div className="border-b border-white/[0.07] px-4 py-3">
                  <p className="text-sm font-bold text-white">{editingId ? 'Edit custom model' : 'Add custom model'}</p>
                  <p className="mt-0.5 text-[11px] text-white/40">Stored locally for this capability. API keys never persist to the browser.</p>
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <label className={labelCls}>Provider name *</label>
                    <input className={inputCls} value={draft.providerName} onChange={(e) => setDraft({ ...draft, providerName: e.target.value })} placeholder="OpenRouter" />
                  </div>
                  <div className="sm:col-span-1">
                    <label className={labelCls}>Model name *</label>
                    <input className={inputCls} value={draft.modelName} onChange={(e) => setDraft({ ...draft, modelName: e.target.value })} placeholder="Claude Sonnet 4.5" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Model ID *</label>
                    <input className={inputCls} value={draft.modelId} onChange={(e) => setDraft({ ...draft, modelId: e.target.value })} placeholder="anthropic/claude-sonnet-4.5" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>API base URL (optional)</label>
                    <input className={inputCls} value={draft.apiBaseUrl} onChange={(e) => setDraft({ ...draft, apiBaseUrl: e.target.value })} placeholder="https://openrouter.ai/api/v1" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>API key</label>
                    <input className={`${inputCls} placeholder:text-white/20`} disabled placeholder="Configured in workspace secrets (coming soon)" />
                    <p className="mt-1 text-[10px] text-white/30">For safety, API keys are not stored in the browser. TODO(backend): wire to secret storage.</p>
                  </div>
                  <div className="sm:col-span-1">
                    <label className={labelCls}>Cost tier *</label>
                    <select className={inputCls} value={draft.costTier} onChange={(e) => setDraft({ ...draft, costTier: e.target.value as Draft['costTier'] })}>
                      <option value="low">Low</option>
                      <option value="standard">Standard</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="sm:col-span-1">
                    <label className={labelCls}>Quality tier *</label>
                    <select className={inputCls} value={draft.qualityTier} onChange={(e) => setDraft({ ...draft, qualityTier: e.target.value as Draft['qualityTier'] })}>
                      <option value="draft">Draft</option>
                      <option value="standard">Standard</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Tags (comma separated)</label>
                    <input className={inputCls} value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} placeholder="Fast, Reasoning" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Description</label>
                    <textarea className={`${inputCls} min-h-[60px] resize-y`} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="What is this model best for?" />
                  </div>
                  {formError && <p className="sm:col-span-2 text-xs font-semibold text-red-400">{formError}</p>}
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-white/[0.07] px-4 py-3">
                  <button onClick={closeForm} className="rounded-[10px] border border-white/[0.12] px-3 py-1.5 text-xs font-semibold text-white/65 hover:bg-white/[0.06] hover:text-white">Cancel</button>
                  <button onClick={submitForm} className="rounded-[10px] bg-violet-600 px-4 py-1.5 text-xs font-bold text-white shadow-[0_4px_18px_rgba(124,92,252,0.35)] transition hover:bg-violet-500">
                    {editingId ? 'Save changes' : 'Add model'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/[0.07] px-5 py-4">
          <button onClick={onClose}
            className="rounded-[10px] border border-white/[0.14] bg-white/[0.03] px-4 py-2 text-xs font-semibold text-white/75 transition hover:bg-white/[0.07] hover:text-white">
            Cancel
          </button>
          <button onClick={() => setRoutingMode('auto')}
            className="rounded-[10px] border border-emerald-300/30 bg-emerald-400/[0.08] px-4 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-400/[0.16]">
            Reset to Auto
          </button>
          <button onClick={save} disabled={!dirty}
            className="rounded-[10px] bg-violet-600 px-5 py-2 text-xs font-bold text-white shadow-[0_6px_22px_rgba(124,92,252,0.35)] transition hover:bg-violet-500 disabled:bg-violet-600/35 disabled:text-white/55 disabled:shadow-none">
            Save model
          </button>
        </div>
      </motion.div>
    </div>
  );
}


function ModelProviderSettingsModal({
  agentName,
  initialSkills,
  onSave,
  onClose,
}: {
  agentName: string;
  initialSkills: AgentSkill[];
  onSave: (skills: AgentSkill[], activeModel?: ModelConfig) => void;
  onClose: () => void;
}) {
  const [skills, setSkills] = React.useState<AgentSkill[]>(initialSkills.length ? initialSkills : [createAgentSkill('text_reasoning')]);
  const [providerMode, setProviderMode] = React.useState<'auto' | 'manual'>(skills.some((s) => s.mode === 'manual') ? 'manual' : 'auto');
  const [qualityTier, setQualityTier] = React.useState<ModelConfig['qualityTier']>('standard');
  const [costTier, setCostTier] = React.useState<ModelConfig['costTier']>('standard');
  const [fallbackProvider, setFallbackProvider] = React.useState<ModelProvider>('openai');

  const updateSkill = (id: string, patch: Partial<AgentSkill>) => setSkills((prev) => prev.map((skill) => skill.id === id ? { ...skill, ...patch } : skill));
  const addSkill = () => {
    const next = ALL_CAPABILITIES.find((cap) => !skills.some((skill) => skill.capability === cap)) ?? 'text_reasoning';
    setSkills((prev) => [...prev, createAgentSkill(next)]);
  };
  const resetToAuto = () => {
    setProviderMode('auto');
    setSkills((prev) => prev.map((skill) => ({ ...skill, provider: 'auto', mode: 'auto' as const, modelName: undefined })));
  };
  const save = () => {
    const normalized = skills.map((skill) => ({
      ...skill,
      provider: providerMode === 'auto' ? 'auto' as const : skill.provider === 'auto' ? 'openai' as const : skill.provider,
      mode: providerMode,
    }));
    onSave(normalized, defaultActiveModel(normalized)?.mode === 'auto'
      ? routeCapability(normalized[0].capability, { costTier, qualityTier })
      : routeCapability(normalized[0].capability, { provider: normalized[0].provider, modelName: normalized[0].modelName || CAPABILITY_ROUTES[normalized[0].capability].defaultModelName, mode: 'manual', costTier, qualityTier }));
  };

  return (
    <div className="fixed inset-0 z-[420] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-[20px] border border-white/[0.10] bg-[#090d18] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-300/65">Model & Provider Settings</p>
            <h3 className="mt-1 font-heading text-lg font-extrabold text-white">Agent: {agentName}</h3>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-white/45 hover:bg-white/[0.06] hover:text-white"><X size={15} /></button>
        </div>
        <div className="max-h-[68vh] space-y-5 overflow-y-auto px-5 py-5">
          <div className="grid gap-2 sm:grid-cols-2">
            {(['auto', 'manual'] as const).map((mode) => (
              <button key={mode} onClick={() => setProviderMode(mode)}
                className={`rounded-[14px] border p-3 text-left transition ${providerMode === mode ? 'border-violet-400/45 bg-violet-500/[0.12]' : 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05]'}`}>
                <p className="text-sm font-bold text-white">{mode === 'auto' ? 'Auto recommended' : 'Manual advanced'}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/42">{mode === 'auto' ? 'Colony chooses the best provider for this skill based on quality, cost, and availability.' : 'Pick provider, model, quality, cost, and fallback behavior yourself.'}</p>
              </button>
            ))}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">Skills</p>
              <button onClick={addSkill} className="rounded-[9px] border border-white/[0.10] px-2.5 py-1 text-[11px] font-bold text-white/55 hover:bg-white/[0.06]">Add skill</button>
            </div>
            <div className="space-y-2">
              {skills.map((skill, index) => (
                <div key={skill.id} className="rounded-[14px] border border-white/[0.07] bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white/70">{index + 1}. {skill.label}</span>
                    <button onClick={() => setSkills((prev) => prev.filter((item) => item.id !== skill.id))} disabled={skills.length === 1}
                      className="rounded-md px-2 py-1 text-[10px] font-semibold text-white/28 hover:bg-white/[0.06] hover:text-red-300 disabled:opacity-30">Remove</button>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <select value={skill.capability} onChange={(e) => updateSkill(skill.id, { capability: e.target.value as AgentCapability, label: CAPABILITY_LABELS[e.target.value as AgentCapability] })}
                      className="rounded-[10px] border border-white/[0.10] bg-[#070b14] px-3 py-2 text-xs text-white outline-none">
                      {ALL_CAPABILITIES.map((cap) => <option key={cap} value={cap}>{CAPABILITY_LABELS[cap]}</option>)}
                    </select>
                    <select value={providerMode === 'auto' ? 'auto' : skill.provider} disabled={providerMode === 'auto'}
                      onChange={(e) => updateSkill(skill.id, { provider: e.target.value as ModelProvider })}
                      className="rounded-[10px] border border-white/[0.10] bg-[#070b14] px-3 py-2 text-xs text-white outline-none disabled:opacity-55">
                      <option value="auto">Auto</option>
                      {MANUAL_PROVIDERS.map((provider) => <option key={provider} value={provider}>{PROVIDER_LABELS[provider]}</option>)}
                    </select>
                    <input value={skill.modelName ?? ''} disabled={providerMode === 'auto'} onChange={(e) => updateSkill(skill.id, { modelName: e.target.value })}
                      placeholder={CAPABILITY_ROUTES[skill.capability].defaultModelName}
                      className="rounded-[10px] border border-white/[0.10] bg-[#070b14] px-3 py-2 text-xs text-white outline-none placeholder:text-white/25 disabled:opacity-55" />
                  </div>
                  <p className="mt-2 text-[10px] font-semibold text-emerald-100/75">
                    Resolved model: {providerMode === 'auto' ? 'Auto' : 'Manual'} {'->'} {resolveModelForCapability(skill.capability, providerMode === 'manual' ? { provider: skill.provider === 'auto' ? 'openai' : skill.provider, modelName: skill.modelName, mode: 'manual', costTier, qualityTier } : undefined).displayName}
                  </p>
                  <p className="mt-2 text-[10px] text-white/32">Preferred: {CAPABILITY_ROUTES[skill.capability].preferred.map((p) => PROVIDER_LABELS[p]).join(' / ')} · Fallback: {CAPABILITY_ROUTES[skill.capability].fallback.map((p) => PROVIDER_LABELS[p]).join(' / ')}</p>
                </div>
              ))}
            </div>
          </div>

          {providerMode === 'manual' && (
            <div className="grid gap-3 rounded-[14px] border border-white/[0.07] bg-white/[0.025] p-3 sm:grid-cols-3">
              <label className="text-[10px] font-bold uppercase tracking-wide text-white/35">Quality tier
                <select value={qualityTier} onChange={(e) => setQualityTier(e.target.value as ModelConfig['qualityTier'])} className="mt-1 w-full rounded-[10px] border border-white/[0.10] bg-[#070b14] px-3 py-2 text-xs normal-case text-white outline-none">
                  <option value="draft">Draft</option><option value="standard">Standard</option><option value="high">High</option>
                </select>
              </label>
              <label className="text-[10px] font-bold uppercase tracking-wide text-white/35">Cost tier
                <select value={costTier} onChange={(e) => setCostTier(e.target.value as ModelConfig['costTier'])} className="mt-1 w-full rounded-[10px] border border-white/[0.10] bg-[#070b14] px-3 py-2 text-xs normal-case text-white outline-none">
                  <option value="low">Low</option><option value="standard">Standard</option><option value="high">High</option>
                </select>
              </label>
              <label className="text-[10px] font-bold uppercase tracking-wide text-white/35">Fallback
                <select value={fallbackProvider} onChange={(e) => setFallbackProvider(e.target.value as ModelProvider)} className="mt-1 w-full rounded-[10px] border border-white/[0.10] bg-[#070b14] px-3 py-2 text-xs normal-case text-white outline-none">
                  {MANUAL_PROVIDERS.map((provider) => <option key={provider} value={provider}>{PROVIDER_LABELS[provider]}</option>)}
                </select>
              </label>
            </div>
          )}
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-white/[0.07] px-5 py-4">
          <button onClick={onClose} className="rounded-[10px] border border-white/[0.10] px-4 py-2 text-xs font-semibold text-white/55 hover:bg-white/[0.05]">Cancel</button>
          <button onClick={resetToAuto} className="rounded-[10px] border border-emerald-300/20 bg-emerald-400/[0.06] px-4 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-400/[0.10]">Reset to Auto</button>
          <button onClick={save} className="rounded-[10px] bg-violet-600 px-5 py-2 text-xs font-bold text-white hover:bg-violet-500">Save</button>
        </div>
      </div>
    </div>
  );
}

const agentFlow = [
  { icon: glyph.ant, name: 'AI Ant Scout', tone: 'text-success border-success/30 bg-success/10' },
  { icon: glyph.collector, name: 'Data Collector', tone: 'text-accent border-accent/30 bg-accent/10' },
  { icon: glyph.cleaner, name: 'Data Cleaner', tone: 'text-muted border-white-10 bg-black/[0.03]' },
  { icon: glyph.chart, name: 'Sales Analyst', tone: 'text-accent border-accent/30 bg-accent/10' },
  { icon: glyph.writer, name: 'Report Writer', tone: 'text-secondary border-secondary/30 bg-secondary/10' },
  { icon: glyph.guard, name: 'Approval Guard', tone: 'text-warning border-warning/30 bg-warning/10' },
];






function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="card-hover flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border border-white-07 bg-surface p-8 text-center">
      <div className="mb-6 grid h-20 w-20 place-items-center rounded-full border border-white-07 bg-surface2">
        <Sparkles className="h-8 w-8 text-muted" />
      </div>
      <h3 className="mb-2 font-heading text-2xl font-bold text-ink">{title}</h3>
      <p className="mx-auto max-w-md text-muted">{message}</p>
    </div>
  );
}


const quickStarts = [
  { icon: glyph.bowl, label: 'Restaurant daily report', prompt: 'Pull my LINE MAN sales every day, analyze profit, and send me a report.' },
  { icon: '\uD83D\uDCAC', label: 'Auto-reply customers', prompt: 'Summarize customer messages and draft friendly replies for approval.' },
  { icon: glyph.chart, label: 'Analyze my sales file', prompt: 'Read my daily sales spreadsheet and find the best selling items.' },
  { icon: '\uD83D\uDCDD', label: 'Content planning', prompt: 'Research weekly content ideas and prepare captions for review.' },
];



function AgentSpriteCanvas({ type, status, index }: { type: CanvasAgentType; status: AgentStatus; index: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animatorRef = useRef<SpriteAnimator | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return undefined;
    const animator = new SpriteAnimator(type, canvasRef.current, index);
    animatorRef.current = animator;
    return () => {
      animator.dispose();
      animatorRef.current = null;
    };
  }, [type, index]);

  useEffect(() => {
    const animator = animatorRef.current;
    if (!animator) return undefined;
    if (status === 'running') {
      animator.setState('talk');
      return undefined;
    }
    if (status === 'done') {
      animator.setState('celebrate');
      const timer = window.setTimeout(() => animator.setState('idle'), 1200);
      return () => window.clearTimeout(timer);
    }
    if (status === 'waiting') {
      animator.setState('talk');
      return undefined;
    }
    animator.setState('idle');
    return undefined;
  }, [status]);

  return <canvas ref={canvasRef} width={60} height={70} className="agent-sprite h-[70px] w-[60px] [image-rendering:pixelated]" />;
}

const agentCatalog: Record<AgentType, Omit<CanvasAgent, 'id' | 'x' | 'y' | 'status'>> = {
  ant: {
    type: 'ant',
    label: 'AI Ant Scout',
    role: 'Read-only collector',
    icon: glyph.ant,
    color: '#00d4aa',
    description: 'Reads LINE MAN screenshots, files, or mobile reports and extracts sales data safely.',
    goal: 'Read data sources safely and extract useful raw information without modifying anything.',
    instructions: 'Scan screenshots and files in read-only mode. Extract data without modifying sources. Report every order, fee, and delivery detail found.',
    systemPrompt: 'You are an AI Ant that reads screenshots and files in read-only mode. Extract useful data carefully and never perform risky actions.',
    input: 'Screenshot, file, app screen',
    output: 'Structured extracted data',
    model: 'Fast',
    memory: true,
    skills: ['Read files', 'Read screenshots', 'Extract data'],
    tools: ['File Reader', 'Screenshot Reader'],
    memoryEnabled: true,
    memories: ['Always extract all platform fees, not just totals.', 'Report every order item, fee, and delivery detail found.'],
    tone: ['Professional', 'Concise'],
    lastAction: 'Extracted 42 orders from screenshot',
    lastUpdated: '09:00 today',
    error: null,
  },
  collector: {
    type: 'collector',
    label: 'Data Collector',
    role: 'Order organizer',
    icon: glyph.collector,
    color: '#4f9eff',
    description: 'Turns raw sales, fees, orders, VAT, and menu details into clean daily records.',
    goal: 'Organize and structure extracted data so downstream agents can use it reliably.',
    instructions: 'Collect total sales, GP fee, VAT, order count, and top menu items. Structure data into clean daily records ready for analysis.',
    systemPrompt: 'You collect structured data from connected sources and prepare it for downstream agents.',
    input: 'Connected source data, raw records',
    output: 'Structured information for downstream agents',
    model: 'Fast',
    memory: true,
    skills: ['Extract data', 'Summarize', 'Use spreadsheet'],
    tools: ['File Reader', 'Google Sheets'],
    memoryEnabled: true,
    memories: ['Always include GP fee, VAT, and platform fees.', 'Organize by date and menu category.'],
    tone: ['Professional', 'Concise'],
    lastAction: 'Organized 42 records into daily structure',
    lastUpdated: '09:01 today',
    error: null,
  },
  cleaner: {
    type: 'cleaner',
    label: 'Data Cleaner',
    role: 'Quality checker',
    icon: glyph.cleaner,
    color: '#00d4aa',
    description: 'Fixes duplicate rows, missing totals, and unclear menu names before analysis starts.',
    goal: 'Ensure data quality by fixing inconsistencies before analysis starts.',
    instructions: 'Remove duplicate rows, fix date formats, normalize currency fields, and flag any missing data. Do not discard data without logging.',
    systemPrompt: 'You clean, normalize, and validate raw data before analysis.',
    input: 'Structured records from upstream agents',
    output: 'Cleaned, formatted data set',
    model: 'Fast',
    memory: false,
    skills: ['Clean data', 'Check quality', 'Detect anomalies'],
    tools: ['File Reader', 'Google Sheets'],
    memoryEnabled: false,
    memories: [],
    tone: ['Direct', 'Analytical'],
    lastAction: 'Cleaned duplicate rows and normalized dates',
    lastUpdated: '09:02 today',
    error: null,
  },
  analyst: {
    type: 'analyst',
    label: 'Sales Analyst',
    role: 'Profit reader',
    icon: glyph.chart,
    color: '#7c5cfc',
    description: 'Finds profit changes, GP fee impact, VAT, top menu items, and cost warnings.',
    goal: 'Find profit changes, cost warnings, and useful sales insights from cleaned data.',
    instructions: 'Analyze profit changes, GP fee impact, VAT, top menu items, and cost warnings. Highlight any significant changes vs yesterday.',
    systemPrompt: 'You are a business analyst agent for a small restaurant. Analyze business performance, profit changes, platform fees, VAT, costs, and sales trends. Explain insights clearly.',
    input: 'Cleaned data',
    output: 'Insights and recommendations',
    model: 'Accurate',
    memory: true,
    skills: ['Analyze data', 'Detect anomalies', 'Summarize'],
    tools: ['Google Sheets', 'File Reader'],
    memoryEnabled: true,
    memories: ['Always summarize reports in Thai.', 'Focus on GP fee, VAT, platform fees, and packaging cost.', 'Use short business-style recommendations.'],
    tone: ['Professional', 'Concise', 'Thai language', 'Business style'],
    lastAction: 'Analyzing profit changes',
    lastUpdated: '09:03 today',
    error: null,
  },
  writer: {
    type: 'writer',
    label: 'Report Writer',
    role: 'Daily summary',
    icon: glyph.writer,
    color: '#ff6b6b',
    description: 'Writes a simple daily report that a restaurant owner can read in one minute.',
    goal: 'Create clear, actionable reports that business owners can read and act on quickly.',
    instructions: 'Write short, clear daily reports with action items. Use simple language for restaurant owners. Include profit, warnings, and recommendations.',
    systemPrompt: 'You write clear, short, useful business reports with action items.',
    input: 'Insights',
    output: 'Draft report',
    model: 'Balanced',
    memory: true,
    skills: ['Write reports', 'Summarize', 'Send draft'],
    tools: ['Report Exporter', 'Google Drive'],
    memoryEnabled: true,
    memories: ['Daily reports should include sales, orders, cost warnings, and next actions.', 'Write in Thai for the restaurant owner.'],
    tone: ['Friendly', 'Detailed', 'Thai language'],
    lastAction: 'Waiting for input',
    lastUpdated: '—',
    error: null,
  },
  guard: {
    type: 'guard',
    label: 'Approval Guard',
    role: 'Safety checkpoint',
    icon: glyph.guard,
    color: '#f5c842',
    description: 'Stops before sending, exporting, or notifying anyone until you approve.',
    goal: 'Protect the user from accidental sends, exports, or data leaks by requiring explicit approval.',
    instructions: 'Never send, export, or notify anyone without explicit user approval. Hold all outbound actions until approved. Log every approval request.',
    systemPrompt: 'You stop risky actions and require human approval before sending, exporting, editing, or notifying anyone.',
    input: 'Prepared action or report',
    output: 'Approval request',
    model: 'Balanced',
    memory: false,
    skills: ['Ask for approval', 'Check quality'],
    tools: ['Approval System'],
    memoryEnabled: false,
    memories: ['Approval is required before exporting reports.', 'Never send to external systems without explicit approval.'],
    tone: ['Direct', 'Professional'],
    lastAction: 'Waiting for approval',
    lastUpdated: '—',
    error: null,
  },
};

function withAgentSkills<T extends { label?: string; name?: string; role?: string; skills?: string[]; tools?: string[]; agentSkills?: AgentSkill[]; activeModel?: ModelConfig }>(agent: T): T & { agentSkills: AgentSkill[]; activeModel?: ModelConfig } {
  const agentSkills = agent.agentSkills ?? skillsForCapabilities(inferCapabilitiesFromText(agent.label, agent.name, agent.role, agent.skills, agent.tools));
  return { ...agent, agentSkills, activeModel: agent.activeModel ?? defaultActiveModel(agentSkills) };
}

const initialAgents: CanvasAgent[] = [
  withAgentSkills({ ...agentCatalog.ant, id: 'agent-ant', x: AGENT_START_X, y: AGENT_START_Y, status: 'done' }),
  withAgentSkills({ ...agentCatalog.collector, id: 'agent-collector', x: AGENT_START_X + 1 * (AGENT_BODY.width + AGENT_GAP_X), y: AGENT_START_Y, status: 'done' }),
  withAgentSkills({ ...agentCatalog.cleaner, id: 'agent-cleaner', x: AGENT_START_X + 2 * (AGENT_BODY.width + AGENT_GAP_X), y: AGENT_START_Y, status: 'done' }),
  withAgentSkills({ ...agentCatalog.analyst, id: 'agent-analyst', x: AGENT_START_X + 3 * (AGENT_BODY.width + AGENT_GAP_X), y: AGENT_START_Y, status: 'running' }),
  withAgentSkills({ ...agentCatalog.writer, id: 'agent-writer', x: AGENT_START_X + 4 * (AGENT_BODY.width + AGENT_GAP_X), y: AGENT_START_Y, status: 'idle' }),
  withAgentSkills({ ...agentCatalog.guard, id: 'agent-guard', x: AGENT_START_X + 5 * (AGENT_BODY.width + AGENT_GAP_X), y: AGENT_START_Y, status: 'waiting' }),
];

const AGENT_MOCK_ERRORS: Record<string, AgentError> = {
  'agent-ant': { title: 'Low confidence extraction', message: 'Screenshot text was unclear. Confidence score below 70%.', failedStep: 'Extract screenshot data', suggestedFix: 'Upload a clearer screenshot.' },
  'agent-collector': { title: 'Missing required fields', message: 'Missing required sales fields: GP fee and VAT.', failedStep: 'Collect structured records', suggestedFix: 'Map missing columns before running.' },
  'agent-cleaner': { title: 'Date format error', message: 'Some rows could not be normalized because date format was inconsistent.', failedStep: 'Normalize date fields', suggestedFix: 'Check input connection.' },
  'agent-analyst': { title: 'Empty data set', message: 'Analysis failed because cleaned data was empty.', failedStep: 'Analyze performance', suggestedFix: 'Run Data Cleaner again.' },
  'agent-writer': { title: 'Missing analysis output', message: 'Report generation failed because analysis output was missing.', failedStep: 'Generate report draft', suggestedFix: 'Review agent instructions.' },
  'agent-guard': { title: 'No approval rule configured', message: 'Approval step failed because no approval rule was configured.', failedStep: 'Request approval', suggestedFix: 'Review agent instructions.' },
};

const MOCK_CONN_SAMPLE_DATA: Record<string, Record<string, string>> = {
  'conn-1': { 'Orders found': '42 orders', 'GP fee': '฿5,526', 'Screenshot source': 'LINE MAN', 'Confidence': '94%' },
  'conn-2': { 'Total sales': '฿4,920', 'Order count': '42', 'GP fee': '฿640', 'VAT': '฿290' },
  'conn-3': { 'Cleaned records': '42 rows', 'GP fee': '฿5,526', 'VAT': '฿1,290', 'Est. profit': '฿3,990', 'Top menu': 'Fried Chicken Set' },
  'conn-4': { 'Profit change': '-18%', 'Main driver': 'GP fee + packaging', 'Packaging increase': '+12%', 'Recommendation': 'Review pricing' },
  'conn-5': { 'Report title': 'Daily Profit Report', 'Pages': '2', 'Key insight': 'Profit down 18%', 'Status': 'Draft — awaiting approval' },
};

const DEFAULT_CONN_MAPPINGS: Record<string, ConnectionMapping[]> = {
  'ant-collector':   [{ id: 'm1', fromField: 'extractedOrders', toField: 'rawOrderData' }, { id: 'm2', fromField: 'screenshotText', toField: 'inputText' }],
  'collector-cleaner': [{ id: 'm1', fromField: 'rawSalesData', toField: 'inputRecords' }, { id: 'm2', fromField: 'orderCount', toField: 'rowCount' }],
  'cleaner-analyst': [{ id: 'm1', fromField: 'cleanedSalesData', toField: 'salesRecords' }, { id: 'm2', fromField: 'orderCount', toField: 'orders' }],
  'analyst-writer':  [{ id: 'm1', fromField: 'profitSummary', toField: 'analysisInput' }, { id: 'm2', fromField: 'warnings', toField: 'keyInsights' }],
  'writer-guard':    [{ id: 'm1', fromField: 'reportDraft', toField: 'pendingApproval' }],
};

const initialConnections: CanvasConnection[] = [
  { id: 'conn-1', from: 'agent-ant',       to: 'agent-collector', active: true, label: 'Extracted data',   mapping: DEFAULT_CONN_MAPPINGS['ant-collector'],   sampleData: MOCK_CONN_SAMPLE_DATA['conn-1'] },
  { id: 'conn-2', from: 'agent-collector', to: 'agent-cleaner',   active: true, label: 'Raw records',      mapping: DEFAULT_CONN_MAPPINGS['collector-cleaner'], sampleData: MOCK_CONN_SAMPLE_DATA['conn-2'] },
  { id: 'conn-3', from: 'agent-cleaner',   to: 'agent-analyst',   active: true, label: 'Cleaned records',  mapping: DEFAULT_CONN_MAPPINGS['cleaner-analyst'],  sampleData: MOCK_CONN_SAMPLE_DATA['conn-3'] },
  { id: 'conn-4', from: 'agent-analyst',   to: 'agent-writer',                  label: 'Analysis result',  mapping: DEFAULT_CONN_MAPPINGS['analyst-writer'],   sampleData: MOCK_CONN_SAMPLE_DATA['conn-4'] },
  { id: 'conn-5', from: 'agent-writer',    to: 'agent-guard',                   label: 'Report draft',     mapping: DEFAULT_CONN_MAPPINGS['writer-guard'],     sampleData: MOCK_CONN_SAMPLE_DATA['conn-5'] },
];

const ADD_AGENT_OPTIONS: Array<{
  type: CanvasAgentType;
  cardTitle: string;
  icon: string;
  description: string;
  defaults: Omit<CanvasAgent, 'id' | 'x' | 'y' | 'status'>;
}> = [
  {
    type: 'ant',
    cardTitle: 'AI Ant',
    icon: glyph.ant,
    description: 'Collects data from screenshots, files, apps, or devices.',
    defaults: {
      ...agentCatalog.ant,
      label: 'AI Ant Scout',
      role: 'Data collector',
      instructions: 'Read screenshots or files in read-only mode and extract useful data.',
      input: 'Screenshot, file, app screen',
      output: 'Structured extracted data',
    },
  },
  {
    type: 'collector',
    cardTitle: 'Data Agent',
    icon: glyph.collector,
    description: 'Reads and extracts structured information from connected sources.',
    defaults: {
      ...agentCatalog.collector,
      label: 'Data Agent',
      role: 'Source reader',
      instructions: 'Read connected sources, extract important fields, and pass structured data to the workflow.',
      input: 'Connected source data',
      output: 'Structured records',
    },
  },
  {
    type: 'cleaner',
    cardTitle: 'Data Cleaner',
    icon: glyph.cleaner,
    description: 'Cleans, formats, and prepares data for analysis.',
    defaults: {
      ...agentCatalog.cleaner,
    },
  },
  {
    type: 'analyst',
    cardTitle: 'Analyst',
    icon: glyph.chart,
    description: 'Finds insights, trends, warnings, and business recommendations.',
    defaults: {
      ...agentCatalog.analyst,
      label: 'Insight Analyst',
      role: 'Analysis agent',
      instructions: 'Analyze the data, detect patterns, and explain key insights clearly.',
      input: 'Cleaned data',
      output: 'Insights and recommendations',
    },
  },
  {
    type: 'writer',
    cardTitle: 'Writer',
    icon: glyph.writer,
    description: 'Creates summaries, reports, captions, or written outputs.',
    defaults: {
      ...agentCatalog.writer,
      instructions: 'Turn analysis into a clear report with action items.',
      input: 'Insights',
      output: 'Draft report',
    },
  },
  {
    type: 'guard',
    cardTitle: 'Approval Guard',
    icon: glyph.guard,
    description: 'Checks risky actions and waits for human approval.',
    defaults: {
      ...agentCatalog.guard,
      input: 'Prepared action or report',
      output: 'Approval request',
    },
  },
  {
    type: 'custom',
    cardTitle: 'Custom Agent',
    icon: glyph.spark,
    description: 'Create your own agent with a custom role and instructions.',
    defaults: {
      type: 'custom',
      label: 'Custom Agent',
      role: 'Custom role',
      icon: glyph.spark,
      color: '#38bdf8',
      description: 'A flexible workflow step for custom tasks, checks, or transformations.',
      instructions: 'Define the role, instructions, and expected outcome for this custom agent.',
      input: 'Custom input',
      output: 'Custom output',
    },
  },
];

// ── Colony Workspace Model (AI Ant command center) ──────────────────────────────






async function hasSurveySubmission(userId: string) {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) return false;
  try {
    const response = await fetch(`${apiBaseUrl}/surveys/users/${encodeURIComponent(userId)}/status`);
    if (!response.ok) return false;
    const data = await response.json() as { submitted?: boolean };
    return Boolean(data.submitted);
  } catch { /* ignore unavailable backend */ }
  return false;
}

async function saveSurveySubmission(userId: string, answers: Record<string, string>) {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) return;
  try {
    await fetch(`${apiBaseUrl}/surveys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, answers }),
    });
  } catch { /* ignore unavailable backend */ }
}

// ─────────────────────────────────────────────────────────────────────────────

function CreateAgentTeam({ activeProjectId, setActiveProjectId, projects, onUpdateProjectInstructions, connectors, safetyMode, setSafetyMode, usageState, setUsageState, setPage }: {
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
  projects: ChatProjectDef[];
  onUpdateProjectInstructions: (id: string, instructions: string) => void;
  connectors: AppConnector[];
  safetyMode: boolean;
  setSafetyMode: (v: boolean) => void;
  usageState: UsageState;
  setUsageState: (s: UsageState) => void;
  setPage: (page: Page) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<CanvasTool>('select');
  const [agents, setAgents] = useState<CanvasAgent[]>(initialAgents);
  const [connections, setConnections] = useState<CanvasConnection[]>(initialConnections);
  const [selectedId, setSelectedId] = useState('agent-analyst');
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>(['agent-analyst']);
  const [selectionDrag, setSelectionDrag] = useState<null | {
    startClientX: number;
    startClientY: number;
    currentClientX: number;
    currentClientY: number;
  }>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [prompt, setPrompt] = useState('Pull my LINE MAN sales every day, analyze profit, and send me a daily report.');
  const [chatText, setChatText] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    { id: 'init-1', role: 'agent', sender: 'AI Ant Scout', agentId: 'agent-ant', text: 'I found 42 orders from the LINE MAN screenshot.', timestamp: '09:00', type: 'agent' },
    { id: 'init-2', role: 'agent', sender: 'Data Collector', agentId: 'agent-collector', text: 'I extracted total sales, GP fee, VAT, and order count.', timestamp: '09:01', type: 'agent' },
    { id: 'init-3', role: 'agent', sender: 'Data Cleaner', agentId: 'agent-cleaner', text: 'I cleaned duplicate rows and standardized the sales fields.', timestamp: '09:02', type: 'agent' },
    { id: 'init-4', role: 'agent', sender: 'Sales Analyst', agentId: 'agent-analyst', text: 'Profit appears to be down by 18%. GP fee and packaging cost are the main drivers.', timestamp: '09:03', type: 'agent' },
    { id: 'init-5', role: 'agent', sender: 'Report Writer', agentId: 'agent-writer', text: 'I can generate a daily profit report with key insights.', timestamp: '09:04', type: 'agent' },
    { id: 'init-6', role: 'agent', sender: 'Approval Guard', agentId: 'agent-guard', text: 'Waiting for your approval before exporting or sending anything. Nothing will be sent without your confirmation.', timestamp: '09:05', type: 'agent' },
  ]);
  const [zoom, setZoom] = useState(0.78);
  const [pan, setPan] = useState({ x: 72, y: 70 });
  const [dragState, setDragState] = useState<null | { id: string; offsetX: number; offsetY: number }>(null);
  const [panState, setPanState] = useState<null | { x: number; y: number; startPanX: number; startPanY: number }>(null);
  const [connectFromId, setConnectFromId] = useState('');
  const [canvasNotes, setCanvasNotes] = useState<CanvasNote[]>([]);
  const [canvasComments, setCanvasComments] = useState<CanvasComment[]>([]);
  const [showMinimap, setShowMinimap] = useState(true);
  const [canvasContextMenu, setCanvasContextMenu] = useState<null | {
    x: number;
    y: number;
    boardX: number;
    boardY: number;
  }>(null);
  const [widgetDragState, setWidgetDragState] = useState<null | {
    type: 'note' | 'comment';
    id: string;
    offsetX: number;
    offsetY: number;
  }>(null);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [addAgentModal, setAddAgentModal] = useState<{
    selectedType: CanvasAgentType;
    name: string;
    role: string;
    instructions: string;
    input: string;
    output: string;
    insertBetweenConnectionId?: string;
  }>({
    selectedType: 'analyst',
    name: 'Insight Analyst',
    role: 'Analysis agent',
    instructions: 'Analyze the data, detect patterns, and explain key insights clearly.',
    input: 'Cleaned data',
    output: 'Insights and recommendations',
  });
  const [hasUnsavedAgentChanges, setHasUnsavedAgentChanges] = useState(false);
  const [isAddAgentOpen, setIsAddAgentOpen] = useState(false);
  const [selectedConnectionId, setSelectedConnectionId] = useState('');
  const [connectionLabelEdit, setConnectionLabelEdit] = useState<string | null>(null);
  const [ghostConnCursor, setGhostConnCursor] = useState<{ x: number; y: number } | null>(null);
  const [deleteConnConfirmOpen, setDeleteConnConfirmOpen] = useState(false);
  const [connPanelSections, setConnPanelSections] = useState<Record<string, boolean>>({ mapping: true, preview: true });
  const [isRunPreviewOpen, setIsRunPreviewOpen] = useState(false);
  const [isDepCheckOpen, setIsDepCheckOpen] = useState(false);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [isFileProcessingOpen, setIsFileProcessingOpen] = useState(false);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>(MOCK_PROCESSED_FILES);
  const [isDataPipelineOpen, setIsDataPipelineOpen] = useState(false);
  const [dataPipelineState, setDataPipelineState] = useState<DataPreviewState>(DEFAULT_DATA_PREVIEW_STATE);
  const [sourceHistory, setSourceHistory] = useState<DataSourceHistoryItem[]>(MOCK_SOURCE_HISTORY);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>(MOCK_APPROVAL_REQUESTS);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalRequest[]>(MOCK_APPROVAL_HISTORY);
  const [approvalRules, setApprovalRules] = useState<ApprovalRule[]>(DEFAULT_APPROVAL_RULES);
  const [isApprovalHistoryOpen, setIsApprovalHistoryOpen] = useState(false);
  const [isApprovalRulesOpen, setIsApprovalRulesOpen] = useState(false);
  const [approvalCardId, setApprovalCardId] = useState<string | null>(null);
  const [rejectReasonModal, setRejectReasonModal] = useState<{ id: string; reason: string } | null>(null);
  const [editApprovalPreview, setEditApprovalPreview] = useState<{ id: string; content: string } | null>(null);
  const [addRuleModal, setAddRuleModal] = useState(false);
  const [editRuleModal, setEditRuleModal] = useState<ApprovalRule | null>(null);
  const [safetyOffConfirmOpen, setSafetyOffConfirmOpen] = useState(false);
  const [safetyRules, setSafetyRules] = useState<SafetyRule[]>(DEFAULT_SAFETY_RULES);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<UpgradeModalState | null>(null);
  const [optimizeCostOpen, setOptimizeCostOpen] = useState(false);
  const [costOptimized, setCostOptimized] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(MOCK_AUDIT_LOGS);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>(MOCK_WORKFLOW_RUNS);
  const [isRunHistoryOpen, setIsRunHistoryOpen] = useState(false);
  const [auditLogFilter, setAuditLogFilter] = useState<'All' | 'User' | 'Agent' | 'System' | 'Approval' | 'Errors' | 'Risk' | 'Rollbacks'>('All');
  const [auditLogSearch, setAuditLogSearch] = useState('');
  const [auditLogDetail, setAuditLogDetail] = useState<AuditLog | null>(null);
  const [rollbackConfirm, setRollbackConfirm] = useState<AuditLog | null>(null);
  const [auditLoggingEnabled, setAuditLoggingEnabled] = useState(true);
  // ── Report system state ────────────────────────────────────────────────────
  const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);
  const [reportPreviewId, setReportPreviewId] = useState<string | null>(null);
  const [reportEditorId, setReportEditorId] = useState<string | null>(null);
  const [reportVersionsId, setReportVersionsId] = useState<string | null>(null);
  const [reportExportModal, setReportExportModal] = useState<ExportModalState | null>(null);
  const [emailDraftModal, setEmailDraftModal] = useState<EmailDraftState | null>(null);
  const [lineDraftModal, setLineDraftModal] = useState<LineDraftState | null>(null);
  const [reportTemplateModal, setReportTemplateModal] = useState<string | null>(null);
  const [scheduleReportModal, setScheduleReportModal] = useState<string | null>(null);
  const [isScheduledReportsOpen, setIsScheduledReportsOpen] = useState(false);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>(MOCK_SCHEDULED_REPORTS);
  const [isReportListOpen, setIsReportListOpen] = useState(false);
  // ── AI Workflow Intelligence state ──────────────────────────────────────────
  const [buildWorkflowModal, setBuildWorkflowModal] = useState<BuildWorkflowModalState | null>(null);
  const [improveWorkflowState, setImproveWorkflowState] = useState<ImproveWorkflowState>({ open: false, analyzing: false, suggestions: [] });
  const [explainWorkflowState, setExplainWorkflowState] = useState<ExplainWorkflowState>({ open: false, mode: 'Simple', generating: false, explanation: '', steps: [], inputs: '', outputs: '', risks: '' });
  const [debugWorkflowState, setDebugWorkflowState] = useState<DebugWorkflowState>({ open: false, analyzing: false, issues: [] });
  const [generateInstructionsState, setGenerateInstructionsState] = useState<GenerateInstructionsState>({ open: false, agentId: '', agentName: '', quality: 'Balanced', generating: false, result: null });
  const [workflowQualityOpen, setWorkflowQualityOpen] = useState(false);
  const [workflowQualityScore, setWorkflowQualityScore] = useState<WorkflowQualityScore | null>(null);
  const [aiSuggestionsOpen, setAiSuggestionsOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<WorkflowSuggestion[]>([]);
  // ────────────────────────────────────────────────────────────────────────────
  const [chatServers, setChatServers] = useState<ChatServer[]>(CHAT_SERVERS);
  const [chatPinnedOpen, setChatPinnedOpen] = useState(false);
  const [chatSearchOpen, setChatSearchOpen] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [chatMemoryOpen, setChatMemoryOpen] = useState(false);
  const [chatMemoryInput, setChatMemoryInput] = useState('');
  const [chatMentionQuery, setChatMentionQuery] = useState('');
  const [chatMentionOpen, setChatMentionOpen] = useState(false);
  const [chatCommandConfirm, setChatCommandConfirm] = useState<ChatCommandConfirm | null>(null);
  const [chatAttachMenuOpen, setChatAttachMenuOpen] = useState(false);
  const [activeChatServerId, setActiveChatServerId] = useState<string>('sales-team');
  const [activeChatChannelId, setActiveChatChannelId] = useState<string>('team-room');
  const [unreadCount, setUnreadCount] = useState(0);
  const [typingLabel, setTypingLabel] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatCollapsedRef = useRef(false);
  const [chatSize, setChatSize] = useState(CHAT_WINDOW_DEFAULT_SIZE);
  const [chatWindowMode, setChatWindowMode] = useState<'windowed' | 'maximized'>('windowed');
  const resizeStateRef = useRef<null | { direction: 'corner' | 'right' | 'bottom'; x: number; y: number; w: number; h: number }>(null);
  const lastWindowedChatSizeRef = useRef(CHAT_WINDOW_DEFAULT_SIZE);
  const [toast, setToast] = useState('');
  const [bubbles, setBubbles] = useState<Record<string, { text: string; visible: boolean }>>({});
  const bubbleIntervalsRef = useRef<Record<string, number>>({});
  const bubbleTimeoutsRef = useRef<Record<string, number>>({});
  const previousStatusesRef = useRef<Record<string, AgentStatus>>({});
  const [approvalPending, setApprovalPending] = useState(false);
  const [agentEditModal, setAgentEditModal] = useState<
    | { type: 'rename-agent'; agentId: string; currentName: string }
    | { type: 'edit-role'; agentId: string; currentRole: string; agentName: string }
    | { type: 'edit-agent-instructions'; agentId: string; currentInstructions: string; agentName: string }
    | { type: 'confirm-remove-agent'; agentId: string; agentName: string }
    | { type: 'change-role-picker'; agentId: string; agentName: string; currentRole: string }
    | { type: 'view-run-history'; agentName: string }
    | { type: 'edit-config'; agentId: string; agentName: string }
    | { type: 'edit-system-prompt'; agentId: string; currentPrompt: string; agentName: string }
    | null
  >(null);
  const [agentConfigDraft, setAgentConfigDraft] = useState<{
    name: string; role: string; goal: string; instructions: string;
    input: string; output: string; model: AgentModel; memory: boolean;
  } | null>(null);
  const [modelSettingsAgentId, setModelSettingsAgentId] = useState<string | null>(null);
  const [modelPickerTarget, setModelPickerTarget] = useState<{ agentId: string; skillId: string } | null>(null);
  const [panelSections, setPanelSections] = useState<Record<string, boolean>>({
    instructions: true, systemPrompt: false, skills: true, tools: false,
    memory: true, tone: true, errorDetail: false, approval: false, safety: false, usage: false,
  });
  const togglePanelSection = (key: string) =>
    setPanelSections((prev) => ({ ...prev, [key]: !prev[key] }));
  const [agentMemoryInput, setAgentMemoryInput] = useState('');
  const [errorDetailModal, setErrorDetailModal] = useState<{ agentId: string; error: AgentError } | null>(null);
  const [workflowSchedule, setWorkflowSchedule] = useState<WorkflowSchedule>({
    triggerType: 'manual',
    scheduleEnabled: false,
    time: '09:00',
    timezone: 'Asia/Bangkok',
    weekdays: ['Mon'],
  });
  const [isWorkflowSettingsOpen, setIsWorkflowSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'trigger' | 'io' | 'steps' | 'branching' | 'execution' | 'safety'>('trigger');
  const [workflowConfig, setWorkflowConfig] = useState<WorkflowConfig>(DEFAULT_WORKFLOW_CONFIG);
  const [editStepId, setEditStepId] = useState<string | null>(null);
  const [stepDraft, setStepDraft] = useState<WorkflowStep | null>(null);
  const [editBranchId, setEditBranchId] = useState<string | 'new' | null>(null);
  const [branchDraft, setBranchDraft] = useState<BranchRule | null>(null);
  const [workflowExecution, setWorkflowExecution] = useState<WorkflowExecution>({
    status: 'idle',
    currentStepIndex: 0,
    executionMode: 'sequential',
    parallelEnabled: false,
    startedAt: null,
    pausedAt: null,
    stoppedAt: null,
  });
  const [loopConfig, setLoopConfig] = useState<LoopConfig>({
    enabled: false,
    source: 'orders',
    totalItems: 42,
    currentItem: 0,
    maxItems: 100,
    skipFailedItems: true,
  });
  const [parallelGroups, setParallelGroups] = useState<ParallelGroup[]>(DEFAULT_PARALLEL_GROUPS);
  const [stopConfirmOpen, setStopConfirmOpen] = useState(false);
  // Workflow management state
  const [workflowMode, setWorkflowMode] = useState<WorkflowMode>('draft');
  const [versions, setVersions] = useState<WorkflowVersion[]>(MOCK_WORKFLOW_VERSIONS);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>('Today, 09:45');
  const [savedTemplates, setSavedTemplates] = useState<WorkflowTemplate[]>([]);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [versionPreviewId, setVersionPreviewId] = useState<string | null>(null);
  const [restoreConfirmVersionId, setRestoreConfirmVersionId] = useState<string | null>(null);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [unpublishConfirmOpen, setUnpublishConfirmOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [duplicateDraft, setDuplicateDraft] = useState({
    name: 'Daily Sales Report Copy',
    agents: true, instructions: true, connections: true, chatHistory: false, runHistory: false,
  });
  const [templateDraft, setTemplateDraft] = useState({
    name: 'Daily Sales Report Template',
    category: 'Restaurant' as TemplateCategory,
    description: 'Analyze delivery sales, GP fee, VAT, profit changes, and create a daily report with approval.',
    includeAgents: true, includeInstructions: true, includeIO: true, includeBranching: true, includeApproval: true,
  });
  const execTimerIdsRef = useRef<number[]>([]);
  const execPausedRef = useRef(false);
  const execStoppedRef = useRef(false);
  const [serverModal, setServerModal] = useState<
    | { type: 'rename-server'; serverId: string; currentName: string }
    | { type: 'server-instructions'; serverId: string; currentInstructions: string; serverName: string }
    | { type: 'confirm-delete-server'; serverId: string; serverName: string }
    | { type: 'rename-channel'; serverId: string; channelId: string; currentName: string }
    | { type: 'confirm-delete-channel'; serverId: string; channelId: string; channelName: string }
    | { type: 'project-instructions'; currentInstructions: string; projectName: string }
    | null
  >(null);
  const [chatContextMenu, setChatContextMenu] = useState<{
    x: number; y: number;
    target: 'server' | 'channel' | 'agent';
    id: string;
    serverId?: string;
  } | null>(null);

  const selectedAgent = selectedAgentIds.length === 1
    ? agents.find((agent) => agent.id === selectedAgentIds[0]) ?? null
    : null;
  const selectionCount = selectedAgentIds.length;
  const isMultiSelecting = selectionCount > 1;

  const workflowStatus = workflowExecution.status === 'paused'
    ? 'Paused'
    : workflowExecution.status === 'stopped'
    ? 'Stopped'
    : workflowExecution.status === 'waiting-approval'
    ? 'Waiting for Approval'
    : workflowExecution.status === 'completed'
    ? 'Completed'
    : workflowExecution.status === 'failed'
    ? 'Failed'
    : agents.some((a) => a.status === 'running')
    ? 'Running'
    : agents.some((a) => a.status === 'waiting')
    ? 'Waiting for Approval'
    : agents.every((a) => a.status === 'done')
    ? 'Complete'
    : 'Draft';
  const isWorkflowRunning = workflowExecution.status === 'running';
  const isWorkflowPaused = workflowExecution.status === 'paused';

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? projects[0];
  const workflowName = activeProject.name;
  const activeChatServer = chatServers.find((server) => server.id === activeChatServerId) ?? chatServers[0];
  const activeChatChannel = activeChatServer?.channels.find((channel) => channel.id === activeChatChannelId) ?? activeChatServer?.channels[0];

  const getChatMaxSize = useCallback(() => ({
    width: Math.max(CHAT_WINDOW_MIN_SIZE.width, window.innerWidth - ((selectedId || selectedConnectionId) ? 330 : CHAT_WINDOW_MARGIN * 2)),
    height: Math.max(CHAT_WINDOW_MIN_SIZE.height, window.innerHeight - CHAT_WINDOW_HEADER_OFFSET),
  }), [selectedId, selectedConnectionId]);

  const clampChatSize = useCallback((next: { width: number; height: number }) => {
    const max = getChatMaxSize();
    return {
      width: clamp(next.width, CHAT_WINDOW_MIN_SIZE.width, max.width),
      height: clamp(next.height, CHAT_WINDOW_MIN_SIZE.height, max.height),
    };
  }, [getChatMaxSize]);

  const selectChatServer = (serverId: string) => {
    const nextServer = chatServers.find((server) => server.id === serverId);
    if (!nextServer) return;
    const nextChannelId = getDefaultServerChannelId(nextServer);
    setActiveChatServerId(serverId);
    setActiveChatChannelId(nextChannelId);
    setChatMessages(getServerChannelMessages(nextServer, nextChannelId));
  };

  const selectChatChannel = (channelId: string) => {
    setActiveChatChannelId(channelId);
    setChatMessages(getServerChannelMessages(activeChatServer, channelId));
  };

  const addSystemMessage = useCallback((text: string) => {
    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setChatMessages((current) => [...current, { role: 'agent', sender: '⚡ System', text, timestamp: ts }]);
  }, []);

  const addAuditLog = useCallback((params: Omit<AuditLog, 'id' | 'timestamp' | 'rollbackStatus'>) => {
    if (!auditLoggingEnabled) return;
    const now = new Date();
    const ts = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const entry: AuditLog = { ...params, id: `aud-${Date.now()}`, timestamp: ts, rollbackStatus: 'none' };
    setAuditLogs((prev) => [entry, ...prev]);
  }, [auditLoggingEnabled]);

  /* ── Server CRUD ── */
  const renameServer = (serverId: string, newName: string) => {
    setChatServers((prev) => prev.map((s) => s.id === serverId ? { ...s, name: newName } : s));
    addSystemMessage(`Server renamed to "${newName}"`);
  };
  const updateServerInstructions = (serverId: string, instructions: string) => {
    setChatServers((prev) => prev.map((s) => s.id === serverId ? { ...s, instructions } : s));
    addSystemMessage('Server instructions updated');
  };
  const duplicateServer = (serverId: string) => {
    const src = chatServers.find((s) => s.id === serverId);
    if (!src) return;
    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newId = `server-copy-${Date.now()}`;
    const copy: ChatServer = {
      ...src,
      id: newId,
      name: `${src.name} Copy`,
      messages: { 'team-room': [{ role: 'agent', sender: 'System', text: `"${src.name} Copy" server created.`, timestamp: ts }] },
    };
    setChatServers((prev) => [...prev, copy]);
    addSystemMessage(`Server "${src.name} Copy" created`);
  };
  const deleteServer = (serverId: string) => {
    setChatServers((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((s) => s.id !== serverId);
      if (activeChatServerId === serverId) {
        const fallback = next[0];
        setActiveChatServerId(fallback.id);
        setActiveChatChannelId(getDefaultServerChannelId(fallback));
        setChatMessages(getServerChannelMessages(fallback, getDefaultServerChannelId(fallback)));
      }
      return next;
    });
    addSystemMessage('Server deleted');
  };

  /* ── Channel CRUD ── */
  const renameChannel = (serverId: string, channelId: string, newName: string) => {
    setChatServers((prev) => prev.map((s) =>
      s.id === serverId
        ? { ...s, channels: s.channels.map((ch) => ch.id === channelId ? { ...ch, name: newName } : ch) }
        : s
    ));
    addSystemMessage(`Channel renamed to #${newName}`);
  };
  const duplicateChannel = (serverId: string, channelId: string) => {
    const server = chatServers.find((s) => s.id === serverId);
    const ch = server?.channels.find((c) => c.id === channelId);
    if (!server || !ch) return;
    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newId = `${channelId}-copy-${Date.now()}`;
    setChatServers((prev) => prev.map((s) =>
      s.id === serverId
        ? {
            ...s,
            channels: [...s.channels, { ...ch, id: newId, name: `${ch.name}-copy` }],
            messages: { ...s.messages, [newId]: [{ role: 'agent', sender: 'System', text: `#${ch.name}-copy channel created.`, timestamp: ts }] },
          }
        : s
    ));
    addSystemMessage(`Channel #${ch.name}-copy created`);
  };
  const deleteChannel = (serverId: string, channelId: string) => {
    const server = chatServers.find((s) => s.id === serverId);
    if (!server || server.channels.length <= 1) return;
    const ch = server.channels.find((c) => c.id === channelId);
    setChatServers((prev) => prev.map((s) =>
      s.id === serverId ? { ...s, channels: s.channels.filter((c) => c.id !== channelId) } : s
    ));
    if (activeChatChannelId === channelId && activeChatServerId === serverId) {
      const fallback = server.channels.find((c) => c.id !== channelId);
      if (fallback) {
        setActiveChatChannelId(fallback.id);
        setChatMessages(getServerChannelMessages(server, fallback.id));
      }
    }
    addSystemMessage(`Channel #${ch?.name ?? channelId} deleted`);
  };

  /* ── Agent CRUD ── */
  const renameAgent = (agentId: string, newName: string) => {
    setAgents((prev) => prev.map((a) => a.id === agentId ? { ...a, label: newName } : a));
    addSystemMessage(`Agent renamed to "${newName}"`);
  };
  const updateAgentRole = (agentId: string, newRole: string) => {
    setAgents((prev) => prev.map((a) => a.id === agentId ? { ...a, role: newRole } : a));
  };
  const updateAgentInstructions = (agentId: string, instructions: string) => {
    setAgents((prev) => prev.map((a) => a.id === agentId ? { ...a, instructions } : a));
    addSystemMessage('Agent instructions updated');
  };
  const toggleAgentDisabled = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return;
    const nowDisabled = !agent.disabled;
    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setAgents((prev) => prev.map((a) => {
      if (a.id !== agentId) return a;
      return {
        ...a,
        disabled: nowDisabled,
        status: nowDisabled ? 'idle' : (a.status === 'failed' || a.status === 'idle' ? 'idle' : a.status),
        error: nowDisabled ? null : a.error,
        lastAction: nowDisabled ? 'Disabled by user' : 'Enabled by user',
        lastUpdated: ts,
      };
    }));
    setToast(`${agent.label} ${nowDisabled ? 'disabled' : 'enabled'}`);
    addSystemMessage(`${agent.label} ${nowDisabled ? 'disabled' : 'enabled'}.`);
  };

  const toggleAgentSkill = (agentId: string, skill: string) => {
    setAgents((prev) => prev.map((a) => {
      if (a.id !== agentId) return a;
      const current = a.skills ?? [];
      return { ...a, skills: current.includes(skill) ? current.filter((s) => s !== skill) : [...current, skill] };
    }));
    setHasUnsavedAgentChanges(true);
  };

  const toggleAgentTool = (agentId: string, tool: string) => {
    setAgents((prev) => prev.map((a) => {
      if (a.id !== agentId) return a;
      const current = a.tools ?? [];
      return { ...a, tools: current.includes(tool) ? current.filter((t) => t !== tool) : [...current, tool] };
    }));
    setHasUnsavedAgentChanges(true);
  };

  const updateAgentModel = (agentId: string, model: AgentModel) => {
    setAgents((prev) => prev.map((a) => a.id === agentId ? { ...a, model } : a));
    setHasUnsavedAgentChanges(true);
  };

  const updateAgentMemory = (agentId: string, memory: boolean) => {
    setAgents((prev) => prev.map((a) => a.id === agentId ? { ...a, memory } : a));
    setHasUnsavedAgentChanges(true);
  };

  const updateAgentSystemPrompt = (agentId: string, systemPrompt: string) => {
    setAgents((prev) => prev.map((a) => a.id === agentId ? { ...a, systemPrompt } : a));
    setHasUnsavedAgentChanges(true);
    setToast('System prompt saved');
  };

  const updateStepApproval = (agentId: string, config: Partial<StepApprovalConfig>) => {
    setAgents((prev) => prev.map((a) => {
      if (a.id !== agentId) return a;
      const current: StepApprovalConfig = a.stepApproval ?? {
        requiresApproval: false, approvalReason: '', riskLevel: 'Low', approvalOwner: 'Me', actionType: '',
      };
      return { ...a, stepApproval: { ...current, ...config } };
    }));
  };

  const resolveApproval = (id: string, status: 'Approved' | 'Rejected' | 'Edited', notes = '') => {
    const now = new Date().toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', '');
    const req = approvalRequests.find((r) => r.id === id);
    setApprovalRequests((prev) => prev.filter((r) => r.id !== id));
    setApprovalHistory((prev) => {
      if (!req) return prev;
      return [{ ...req, status, approvedBy: 'You', resolvedAt: now, notes }, ...prev];
    });
    setApprovalCardId(null);
    setRejectReasonModal(null);
    setEditApprovalPreview(null);
    setToast(status === 'Approved' ? 'Step approved — workflow continues.' : status === 'Rejected' ? 'Step rejected.' : 'Edit saved — step approved with changes.');
    if (req) addAuditLog({ actorType: 'Approval', actorName: 'You', actionType: status === 'Approved' ? 'approval-approved' : status === 'Rejected' ? 'approval-rejected' : 'approval-edited', title: `Approval ${status}: ${req.title}`, description: notes || `Step "${req.agentName}" ${status.toLowerCase()} by user.`, workflowName, stepName: req.agentName, riskLevel: req.riskLevel, status: 'Success', reversible: false, metadata: { notes, approvedBy: 'You' } });
  };

  const addApprovalRequest = (agentId: string, agentName: string, actionType: string, riskLevel: ApprovalRequest['riskLevel'], summary: string, previewContent: string) => {
    const now = new Date().toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', '');
    const req: ApprovalRequest = {
      id: `apr-${Date.now()}`, title: `${actionType} – ${agentName}`, workflowId: 'wf-1',
      agentId, agentName, actionType, riskLevel, status: 'Pending',
      requestedBy: 'Colony AI', approvedBy: null, createdAt: now, resolvedAt: null,
      summary, previewContent, notes: '',
    };
    setApprovalRequests((prev) => [...prev, req]);
  };

  const openEditConfig = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return;
    setAgentConfigDraft({
      name: agent.label,
      role: agent.role,
      goal: agent.goal ?? '',
      instructions: agent.instructions ?? '',
      input: agent.input ?? '',
      output: agent.output ?? '',
      model: agent.model ?? 'Balanced',
      memory: agent.memory ?? true,
    });
    setAgentEditModal({ type: 'edit-config', agentId, agentName: agent.label });
  };

  const saveAgentConfig = (agentId: string) => {
    const draft = agentConfigDraft;
    if (!draft) return;
    setAgents((prev) => prev.map((a) => a.id !== agentId ? a : {
      ...a,
      label: draft.name.trim() || a.label,
      role: draft.role.trim() || a.role,
      goal: draft.goal,
      instructions: draft.instructions,
      input: draft.input,
      output: draft.output,
      model: draft.model,
      memory: draft.memory,
    }));
    setAgentConfigDraft(null);
    setAgentEditModal(null);
    setHasUnsavedAgentChanges(true);
    setToast('Agent config saved');
    addSystemMessage('Agent config updated');
  };

  const saveAgentModelSettings = (agentId: string, skills: AgentSkill[], activeModel?: ModelConfig) => {
    setAgents((prev) => prev.map((agent) => agent.id === agentId ? { ...agent, agentSkills: skills, activeModel } : agent));
    setModelSettingsAgentId(null);
    setHasUnsavedAgentChanges(true);
    setToast('Model routing saved');
    addSystemMessage('Agent model routing updated.');
  };

  /* ── Agent Memory helpers ── */
  const addAgentMemory = (agentId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setAgents((prev) => prev.map((a) => a.id === agentId ? { ...a, memories: [...(a.memories ?? []), trimmed] } : a));
    setAgentMemoryInput('');
  };

  const removeAgentMemory = (agentId: string, index: number) => {
    setAgents((prev) => prev.map((a) => {
      if (a.id !== agentId) return a;
      const next = [...(a.memories ?? [])];
      next.splice(index, 1);
      return { ...a, memories: next };
    }));
  };

  const clearAgentMemories = (agentId: string) => {
    setAgents((prev) => prev.map((a) => a.id === agentId ? { ...a, memories: [] } : a));
    setToast('Memory cleared');
  };

  const toggleAgentMemoryEnabled = (agentId: string) => {
    setAgents((prev) => prev.map((a) => a.id === agentId ? { ...a, memoryEnabled: !(a.memoryEnabled ?? false) } : a));
  };

  /* ── Personality / Tone helpers ── */
  const toggleAgentTone = (agentId: string, toneItem: string) => {
    setAgents((prev) => prev.map((a) => {
      if (a.id !== agentId) return a;
      const current = a.tone ?? [];
      return { ...a, tone: current.includes(toneItem) ? current.filter((t) => t !== toneItem) : [...current, toneItem] };
    }));
  };

  /* ── Status action helpers ── */
  const runSingleAgent = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent || agent.disabled) { setToast('Agent is disabled — enable it first'); return; }
    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setAgents((prev) => prev.map((a) => a.id === agentId ? { ...a, status: 'running', error: null, lastAction: 'Running…', lastUpdated: ts } : a));
    addSystemMessage(`${agent.label} started`);
    window.setTimeout(() => {
      setAgents((prev) => prev.map((a) => a.id === agentId ? { ...a, status: 'done', lastAction: 'Completed successfully', lastUpdated: ts } : a));
      setToast(`${agent.label} completed`);
      addSystemMessage(`${agent.label} finished`);
    }, 2200);
  };

  const markAgentDone = (agentId: string) => {
    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setAgents((prev) => prev.map((a) => a.id === agentId ? { ...a, status: 'done', error: null, lastAction: 'Marked done manually', lastUpdated: ts } : a));
  };

  const simulateAgentError = (agentId: string) => {
    const mockError = AGENT_MOCK_ERRORS[agentId] ?? { title: 'Unknown error', message: 'An unexpected error occurred.', failedStep: 'Unknown step', suggestedFix: 'Check agent configuration.' };
    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setAgents((prev) => prev.map((a) => a.id === agentId ? { ...a, status: 'failed', error: mockError, lastAction: `Failed: ${mockError.failedStep}`, lastUpdated: ts } : a));
    const agent = agents.find((a) => a.id === agentId);
    if (agent) addSystemMessage(`${agent.label} failed — ${mockError.title}`);
    setToast('Error simulated');
  };

  const retryAgent = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return;
    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setAgents((prev) => prev.map((a) => a.id === agentId ? { ...a, status: 'running', error: null, lastAction: 'Retrying…', lastUpdated: ts, lastRetryAt: ts } : a));
    addSystemMessage(`${agent.label} retrying…`);
    window.setTimeout(() => {
      setAgents((prev) => prev.map((a) => a.id === agentId ? { ...a, status: 'done', lastAction: 'Retry successful', lastUpdated: ts } : a));
      setToast(`${agent.label} retried successfully`);
      addSystemMessage(`${agent.label} was retried and completed successfully.`);
    }, 1800);
  };

  /* ── Workflow schedule helpers ── */
  const getScheduleSummary = () => {
    const { triggerType, scheduleEnabled, time, weekdays } = workflowSchedule;
    if (triggerType === 'manual') return 'Manual';
    if (!scheduleEnabled) return 'Schedule off';
    if (triggerType === 'daily') return `Daily ${time}`;
    if (triggerType === 'weekly') return `${weekdays[0] ?? 'Mon'} ${time}`;
    if (triggerType === 'file-upload') return 'File upload';
    if (triggerType === 'sheet-row') return 'New sheet row';
    if (triggerType === 'webhook') return 'Webhook';
    return 'Manual';
  };

  const getNextRunLabel = (sched: WorkflowSchedule = workflowSchedule) => {
    if (!sched.scheduleEnabled || sched.triggerType === 'manual') return null;
    if (sched.triggerType === 'daily') return `Tomorrow at ${sched.time}`;
    if (sched.triggerType === 'weekly') return `Next ${sched.weekdays[0] ?? 'Mon'} at ${sched.time}`;
    return null;
  };

  const setWorkflowTrigger = (triggerType: WorkflowTriggerType) => {
    setWorkflowSchedule((prev) => ({ ...prev, triggerType }));
    const option = TRIGGER_OPTIONS.find((o) => o.value === triggerType);
    if (option) addSystemMessage(`Workflow trigger changed to ${option.label}.`);
  };

  const toggleScheduleEnabled = () => {
    setWorkflowSchedule((prev) => {
      const next = { ...prev, scheduleEnabled: !prev.scheduleEnabled };
      const nextRun = getNextRunLabel(next);
      if (next.scheduleEnabled && nextRun) {
        addSystemMessage(`Schedule enabled. Next run: ${nextRun}.`);
      } else if (next.scheduleEnabled) {
        addSystemMessage('Schedule enabled.');
      } else {
        addSystemMessage('Schedule disabled.');
      }
      return next;
    });
  };

  const toggleScheduleWeekday = (day: string) => {
    setWorkflowSchedule((prev) => ({
      ...prev,
      weekdays: prev.weekdays.includes(day) ? prev.weekdays.filter((d) => d !== day) : [...prev.weekdays, day],
    }));
  };

  /* ── File Processing helpers ── */
  const addToWorkflowInput = (inputType: WorkflowInputType) => {
    setWorkflowConfig((prev) => {
      if (prev.inputs.includes(inputType)) return prev;
      const label = WORKFLOW_INPUT_OPTIONS.find((o) => o.value === inputType)?.label ?? inputType;
      addSystemMessage(`Workflow input added from File Processing Center: ${label}.`);
      return { ...prev, inputs: [...prev.inputs, inputType] };
    });
  };

  /* ── Workflow Input / Output helpers ── */
  const toggleWorkflowInput = (input: WorkflowInputType) => {
    setWorkflowConfig((prev) => {
      const next = prev.inputs.includes(input)
        ? prev.inputs.filter((i) => i !== input)
        : [...prev.inputs, input];
      const label = WORKFLOW_INPUT_OPTIONS.find((o) => o.value === input)?.label ?? input;
      addSystemMessage(`Workflow input ${prev.inputs.includes(input) ? 'removed' : 'added'}: ${label}.`);
      return { ...prev, inputs: next };
    });
  };

  const toggleWorkflowOutput = (output: WorkflowOutputType) => {
    setWorkflowConfig((prev) => {
      const next = prev.outputs.includes(output)
        ? prev.outputs.filter((o) => o !== output)
        : [...prev.outputs, output];
      const label = WORKFLOW_OUTPUT_OPTIONS.find((o) => o.value === output)?.label ?? output;
      addSystemMessage(`Output ${prev.outputs.includes(output) ? 'removed' : 'added'}: ${label}.`);
      return { ...prev, outputs: next };
    });
  };

  /* ── Step Logic helpers ── */
  const openEditStep = (stepId: string) => {
    const step = workflowConfig.steps.find((s) => s.id === stepId);
    if (!step) return;
    setStepDraft({ ...step });
    setEditStepId(stepId);
  };

  const saveStepLogic = () => {
    if (!stepDraft) return;
    setWorkflowConfig((prev) => ({
      ...prev,
      steps: prev.steps.map((s) => s.id === stepDraft.id ? stepDraft : s),
    }));
    addSystemMessage(`Step logic updated: ${stepDraft.name}.`);
    setEditStepId(null);
    setStepDraft(null);
    setToast('Step logic saved');
  };

  /* ── Branch Rule helpers ── */
  const openAddBranch = () => {
    setBranchDraft({ id: `branch-${Date.now()}`, name: '', enabled: true, metric: BRANCH_METRICS[0], operator: BRANCH_OPERATORS[0], value: '10%', thenAction: BRANCH_THEN_ACTIONS[0], elseAction: BRANCH_ELSE_ACTIONS[0] });
    setEditBranchId('new');
  };

  const openEditBranch = (id: string) => {
    const rule = workflowConfig.branchRules.find((r) => r.id === id);
    if (!rule) return;
    setBranchDraft({ ...rule });
    setEditBranchId(id);
  };

  const saveBranchRule = () => {
    if (!branchDraft) return;
    setWorkflowConfig((prev) => {
      if (editBranchId === 'new') {
        addSystemMessage(`Branch rule added: ${branchDraft.name || 'New rule'}.`);
        return { ...prev, branchRules: [...prev.branchRules, branchDraft] };
      }
      addSystemMessage(`Branch rule updated: ${branchDraft.name}.`);
      return { ...prev, branchRules: prev.branchRules.map((r) => r.id === branchDraft.id ? branchDraft : r) };
    });
    setEditBranchId(null);
    setBranchDraft(null);
    setToast('Branch rule saved');
  };

  const deleteBranchRule = (id: string) => {
    const rule = workflowConfig.branchRules.find((r) => r.id === id);
    setWorkflowConfig((prev) => ({ ...prev, branchRules: prev.branchRules.filter((r) => r.id !== id) }));
    if (rule) addSystemMessage(`Branch rule removed: ${rule.name}.`);
    setToast('Branch rule deleted');
  };

  const toggleBranchRule = (id: string) => {
    setWorkflowConfig((prev) => ({
      ...prev,
      branchRules: prev.branchRules.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r),
    }));
  };

  /* ── Validation helpers ── */
  const getWorkflowWarnings = (): string[] => {
    const warnings: string[] = [];
    if (workflowConfig.inputs.length === 0) warnings.push('No workflow input selected.');
    if (workflowConfig.outputs.length === 0) warnings.push('No workflow output selected.');
    workflowConfig.steps.forEach((step) => {
      if (!step.inputFrom) warnings.push(`${step.name}: missing input source.`);
      if (!step.outputTo) warnings.push(`${step.name}: missing output destination.`);
    });
    workflowConfig.branchRules.forEach((rule) => {
      if (rule.enabled && !rule.thenAction) warnings.push(`Branch rule "${rule.name}": missing Then action.`);
    });
    agents.filter((a) => a.disabled).forEach((a) => {
      const step = workflowConfig.steps.find((s) => s.agentId === a.id);
      if (step) warnings.push(`${a.label} is disabled and will be skipped.`);
    });
    return warnings;
  };

  const startChatResize = useCallback((direction: 'corner' | 'right' | 'bottom') => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (chatWindowMode === 'maximized') {
      setChatWindowMode('windowed');
      setChatSize(clampChatSize(lastWindowedChatSizeRef.current));
      return;
    }

    resizeStateRef.current = { direction, x: e.clientX, y: e.clientY, w: chatSize.width, h: chatSize.height };
    document.body.style.userSelect = 'none';
    document.body.style.cursor = direction === 'right' ? 'ew-resize' : direction === 'bottom' ? 'ns-resize' : 'nwse-resize';

    const onMove = (ev: MouseEvent) => {
      const state = resizeStateRef.current;
      if (!state) return;
      const dx = ev.clientX - state.x;
      const dy = ev.clientY - state.y;
      setChatSize(clampChatSize({
        width: state.direction === 'bottom' ? state.w : state.w + dx,
        height: state.direction === 'right' ? state.h : state.h + dy,
      }));
    };

    const onUp = () => {
      resizeStateRef.current = null;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [chatSize.height, chatSize.width, chatWindowMode, clampChatSize]);

  const resetChatWindowSize = useCallback(() => {
    setChatWindowMode('windowed');
    setChatSize(clampChatSize(CHAT_WINDOW_DEFAULT_SIZE));
  }, [clampChatSize]);

  const toggleChatMaximize = useCallback(() => {
    if (chatWindowMode === 'maximized') {
      setChatWindowMode('windowed');
      setChatSize(clampChatSize(lastWindowedChatSizeRef.current));
      return;
    }

    lastWindowedChatSizeRef.current = chatSize;
    setChatWindowMode('maximized');
    setChatSize(getChatMaxSize());
  }, [chatSize, chatWindowMode, clampChatSize, getChatMaxSize]);

  const displayedWorkflowStatus = activeProjectId === 'daily-sales'
    ? workflowStatus
    : activeProject.projectStatus === 'running'
    ? 'Running'
    : activeProject.projectStatus === 'waiting'
    ? 'Waiting for Approval'
    : activeProject.projectStatus === 'done'
    ? 'Complete'
    : 'Draft';

  useEffect(() => {
    chatCollapsedRef.current = chatCollapsed;
  }, [chatCollapsed]);

  useEffect(() => {
    if (chatWindowMode === 'windowed') {
      lastWindowedChatSizeRef.current = chatSize;
    }
  }, [chatSize, chatWindowMode]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, typingLabel]);

  useEffect(() => {
    if (activeChatServer) {
      setChatMessages(getServerChannelMessages(activeChatServer, activeChatChannelId));
    }
  }, [activeChatServerId, activeChatChannelId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setSelectedAgentIds((current) => {
      const next = current.filter((id) => agents.some((agent) => agent.id === id));
      setSelectedId(next.length === 1 ? next[0] : '');
      return next;
    });
  }, [agents]);

  useEffect(() => {
    const syncChatWindowToViewport = () => {
      if (chatWindowMode === 'maximized') {
        setChatSize(getChatMaxSize());
        return;
      }
      setChatSize((current) => clampChatSize(current));
    };

    syncChatWindowToViewport();
    window.addEventListener('resize', syncChatWindowToViewport);
    return () => window.removeEventListener('resize', syncChatWindowToViewport);
  }, [chatWindowMode, clampChatSize, getChatMaxSize]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const hideBubble = useCallback((agentId: string) => {
    setBubbles((current) => ({
      ...current,
      [agentId]: { text: current[agentId]?.text ?? '', visible: false },
    }));
  }, []);

  const showBubble = useCallback((agent: CanvasAgent, messageIndex: number, autoHide = true) => {
    const messages = BUBBLE_MESSAGES[agent.type] ?? ['Working...'];
    setBubbles((current) => ({
      ...current,
      [agent.id]: {
        text: messages[messageIndex % messages.length],
        visible: true,
      },
    }));
    window.clearTimeout(bubbleTimeoutsRef.current[agent.id]);
    if (autoHide) {
      bubbleTimeoutsRef.current[agent.id] = window.setTimeout(() => hideBubble(agent.id), 2200);
    }
  }, [hideBubble]);

  useEffect(() => {
    agents.forEach((agent) => {
      const previousStatus = previousStatusesRef.current[agent.id];
      if (previousStatus === agent.status) return;
      previousStatusesRef.current[agent.id] = agent.status;
      window.clearInterval(bubbleIntervalsRef.current[agent.id]);
      window.clearTimeout(bubbleTimeoutsRef.current[agent.id]);

      if (agent.status === 'running') {
        let bubbleIndex = 0;
        showBubble(agent, bubbleIndex, false);
        bubbleIntervalsRef.current[agent.id] = window.setInterval(() => {
          bubbleIndex += 1;
          showBubble(agent, bubbleIndex, false);
        }, 700);
      } else if (agent.status === 'done') {
        showBubble(agent, 3);
      } else if (agent.status === 'waiting') {
        showBubble(agent, 2, false);
      } else {
        hideBubble(agent.id);
      }
    });

    Object.keys(previousStatusesRef.current).forEach((agentId) => {
      if (agents.some((agent) => agent.id === agentId)) return;
      window.clearInterval(bubbleIntervalsRef.current[agentId]);
      window.clearTimeout(bubbleTimeoutsRef.current[agentId]);
      delete bubbleIntervalsRef.current[agentId];
      delete bubbleTimeoutsRef.current[agentId];
      delete previousStatusesRef.current[agentId];
    });
  }, [agents, hideBubble, showBubble]);

  useEffect(() => {
    return () => {
      Object.values(bubbleIntervalsRef.current).forEach((interval) => window.clearInterval(interval));
      Object.values(bubbleTimeoutsRef.current).forEach((timeout) => window.clearTimeout(timeout));
    };
  }, []);

  const clientToBoard = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  };

  const updateAgentPosition = (id: string, x: number, y: number) => {
    setAgents((current) =>
      current.map((agent) =>
        agent.id === id
          ? {
              ...agent,
              x: clamp(x, 0, BOARD_SIZE.width - AGENT_BODY.width),
              y: clamp(y, 0, BOARD_SIZE.height - AGENT_BODY.height),
            }
          : agent,
      ),
    );
  };

  const selectSingleAgent = useCallback((id: string) => {
    setSelectedId(id);
    setSelectedAgentIds([id]);
    setSelectedConnectionId('');
    setConnectionLabelEdit(null);
  }, []);

  const toggleAgentSelection = useCallback((id: string) => {
    setSelectedAgentIds((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      setSelectedId(next.length === 1 ? next[0] : '');
      return next;
    });
  }, []);

  const clearCanvasSelection = useCallback(() => {
    setSelectedId('');
    setSelectedAgentIds([]);
    setConnectFromId('');
    setSelectedConnectionId('');
    setConnectionLabelEdit(null);
    setChatContextMenu(null);
    setCanvasContextMenu(null);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target && ['INPUT', 'TEXTAREA'].includes(target.tagName);
      if (event.key === 'Escape') {
        clearCanvasSelection();
        setIsBulkDeleteOpen(false);
        return;
      }
      if (isTyping) return;
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedAgentIds.length > 0) {
        event.preventDefault();
        if (selectedAgentIds.length >= agents.length) {
          setToast('At least one agent must remain in the workflow');
          return;
        }
        setIsBulkDeleteOpen(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [agents.length, clearCanvasSelection, selectedAgentIds]);

  const getCanvasViewportCenterBoard = useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: AGENT_START_X, y: AGENT_START_Y };
    return clientToBoard(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }, [pan.x, pan.y, zoom]);

  const addStickyNoteAt = useCallback((x: number, y: number) => {
    setCanvasNotes((current) => [...current, {
      id: `note-${Date.now()}`,
      x: clamp(x, 0, BOARD_SIZE.width - 180),
      y: clamp(y, 0, BOARD_SIZE.height - 140),
      text: 'New note',
    }]);
    setToast('Sticky note added');
  }, []);

  const addCommentAt = useCallback((x: number, y: number) => {
    setCanvasComments((current) => [...current, {
      id: `comment-${Date.now()}`,
      x: clamp(x, 0, BOARD_SIZE.width - 210),
      y: clamp(y, 0, BOARD_SIZE.height - 120),
      text: 'Add your comment…',
    }]);
    setToast('Comment added');
  }, []);

  const getSelectionBounds = useCallback((drag: NonNullable<typeof selectionDrag>) => {
    const start = clientToBoard(drag.startClientX, drag.startClientY);
    const end = clientToBoard(drag.currentClientX, drag.currentClientY);
    return {
      left: Math.min(start.x, end.x),
      right: Math.max(start.x, end.x),
      top: Math.min(start.y, end.y),
      bottom: Math.max(start.y, end.y),
    };
  }, [pan.x, pan.y, zoom]);

  const duplicateSelectedAgents = useCallback(() => {
    if (selectedAgentIds.length === 0) return;
    const selected = agents.filter((agent) => selectedAgentIds.includes(agent.id));
    if (selected.length === 0) return;
    const copies = selected.map((agent, index) => ({
      ...agent,
      id: `${agent.id}-copy-${Date.now()}-${index}`,
      label: agent.label.includes('Copy') ? agent.label : `${agent.label} Copy`,
      x: clamp(agent.x + 168, 0, BOARD_SIZE.width - AGENT_CARD.width),
      y: clamp(agent.y + 72, 0, BOARD_SIZE.height - AGENT_CARD.height),
      status: 'idle' as AgentStatus,
    }));
    setAgents((current) => [...current, ...copies]);
    setSelectedAgentIds(copies.map((agent) => agent.id));
    setSelectedId(copies.length === 1 ? copies[0].id : '');
    setHasUnsavedAgentChanges(true);
    setToast(`${copies.length} agents duplicated`);
  }, [agents, selectedAgentIds]);

  const confirmBulkDelete = useCallback(() => {
    if (selectedAgentIds.length === 0) return;
    if (selectedAgentIds.length >= agents.length) {
      setToast('At least one agent must remain in the workflow');
      return;
    }
    setAgents((current) => current.filter((agent) => !selectedAgentIds.includes(agent.id)));
    setConnections((current) => current.filter((connection) => !selectedAgentIds.includes(connection.from) && !selectedAgentIds.includes(connection.to)));
    const deletedCount = selectedAgentIds.length;
    setSelectedAgentIds([]);
    setSelectedId('');
    setSelectedConnectionId('');
    setIsBulkDeleteOpen(false);
    setHasUnsavedAgentChanges(true);
    setToast(`${deletedCount} agents deleted`);
  }, [agents.length, selectedAgentIds]);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (connectFromId) {
      const point = clientToBoard(event.clientX, event.clientY);
      setGhostConnCursor(point);
    }
    if (dragState) {
      const point = clientToBoard(event.clientX, event.clientY);
      updateAgentPosition(dragState.id, point.x - dragState.offsetX, point.y - dragState.offsetY);
      return;
    }
    if (selectionDrag) {
      setSelectionDrag((current) => current ? { ...current, currentClientX: event.clientX, currentClientY: event.clientY } : current);
      return;
    }
    if (widgetDragState) {
      const point = clientToBoard(event.clientX, event.clientY);
      if (widgetDragState.type === 'note') {
        setCanvasNotes((current) => current.map((note) => note.id === widgetDragState.id ? {
          ...note,
          x: clamp(point.x - widgetDragState.offsetX, 0, BOARD_SIZE.width - 180),
          y: clamp(point.y - widgetDragState.offsetY, 0, BOARD_SIZE.height - 140),
        } : note));
      } else {
        setCanvasComments((current) => current.map((comment) => comment.id === widgetDragState.id ? {
          ...comment,
          x: clamp(point.x - widgetDragState.offsetX, 0, BOARD_SIZE.width - 210),
          y: clamp(point.y - widgetDragState.offsetY, 0, BOARD_SIZE.height - 120),
        } : comment));
      }
      return;
    }
    if (panState) {
      setPan({
        x: panState.startPanX + event.clientX - panState.x,
        y: panState.startPanY + event.clientY - panState.y,
      });
    }
  };

  const handleCanvasPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button === 0) {
      clearCanvasSelection();
      if (tool !== 'pan') {
        setSelectionDrag({
          startClientX: event.clientX,
          startClientY: event.clientY,
          currentClientX: event.clientX,
          currentClientY: event.clientY,
        });
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    }
    if (event.button !== 0 && event.button !== 1) return;
    if (tool !== 'pan' && event.button !== 1) return;
    setPanState({ x: event.clientX, y: event.clientY, startPanX: pan.x, startPanY: pan.y });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    setDragState(null);
    setWidgetDragState(null);
    setPanState(null);
    if (selectionDrag) {
      const bounds = getSelectionBounds(selectionDrag);
      const width = Math.abs(selectionDrag.currentClientX - selectionDrag.startClientX);
      const height = Math.abs(selectionDrag.currentClientY - selectionDrag.startClientY);
      if (width > 6 || height > 6) {
        const matchedIds = agents
          .filter((agent) => agent.x < bounds.right && agent.x + AGENT_CARD.width > bounds.left && agent.y < bounds.bottom && agent.y + AGENT_CARD.height > bounds.top)
          .map((agent) => agent.id);
        setSelectedAgentIds(matchedIds);
        setSelectedId(matchedIds.length === 1 ? matchedIds[0] : '');
      }
      setSelectionDrag(null);
    }
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already be released by the browser.
    }
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    const nextZoom = clamp(zoom * (event.deltaY > 0 ? 0.92 : 1.08), 0.28, 2.4);
    setPan({
      x: pointerX - ((pointerX - pan.x) * nextZoom) / zoom,
      y: pointerY - ((pointerY - pan.y) * nextZoom) / zoom,
    });
    setZoom(nextZoom);
  };

  const zoomFit = () => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || agents.length === 0) return;
    const minX = Math.min(...agents.map((agent) => agent.x)) - 120;
    const maxX = Math.max(...agents.map((agent) => agent.x + AGENT_CARD.width)) + 120;
    const minY = Math.min(...agents.map((agent) => agent.y)) - 120;
    const maxY = Math.max(...agents.map((agent) => agent.y + AGENT_CARD.height)) + 180;
    const nextZoom = Math.min(rect.width / (maxX - minX), rect.height / (maxY - minY), 1.25) * 0.88;
    setZoom(nextZoom);
    setPan({
      x: (rect.width - (maxX - minX) * nextZoom) / 2 - minX * nextZoom,
      y: (rect.height - (maxY - minY) * nextZoom) / 2 - minY * nextZoom,
    });
  };

  const autoLayout = () => {
    const X_SPACING = 240;
    const Y_SPACING = 180;
    setAgents((currentAgents) => {
      const inDegree: Record<string, number> = {};
      const outEdges: Record<string, string[]> = {};
      currentAgents.forEach((a) => { inDegree[a.id] = 0; outEdges[a.id] = []; });
      connections.forEach((c) => {
        if (inDegree[c.to] !== undefined) inDegree[c.to]++;
        if (outEdges[c.from]) outEdges[c.from].push(c.to);
      });

      // Kahn's topological sort
      const queue = currentAgents.filter((a) => inDegree[a.id] === 0).map((a) => a.id);
      const ordered: string[] = [];
      const visited = new Set<string>();
      while (queue.length > 0) {
        const nodeId = queue.shift()!;
        if (visited.has(nodeId)) continue;
        visited.add(nodeId);
        ordered.push(nodeId);
        (outEdges[nodeId] || []).forEach((nextId) => {
          inDegree[nextId]--;
          if (inDegree[nextId] <= 0) queue.push(nextId);
        });
      }
      // Append any unvisited (cycle members)
      currentAgents.forEach((a) => { if (!visited.has(a.id)) ordered.push(a.id); });

      // Assign column = longest incoming path depth
      const colOf: Record<string, number> = {};
      const rowSlot: Record<number, number> = {};
      const rowOf: Record<string, number> = {};
      ordered.forEach((id) => {
        let col = 0;
        connections.filter((c) => c.to === id).forEach((c) => {
          if (colOf[c.from] !== undefined) col = Math.max(col, colOf[c.from] + 1);
        });
        colOf[id] = col;
        const row = rowSlot[col] ?? 0;
        rowOf[id] = row;
        rowSlot[col] = row + 1;
      });

      return currentAgents.map((agent) => ({
        ...agent,
        x: clamp(AGENT_START_X + (colOf[agent.id] ?? 0) * X_SPACING, 0, BOARD_SIZE.width - AGENT_CARD.width),
        y: clamp(AGENT_START_Y + (rowOf[agent.id] ?? 0) * Y_SPACING, 0, BOARD_SIZE.height - AGENT_CARD.height),
      }));
    });
    window.setTimeout(zoomFit, 150);
    setToast('Workflow arranged');
  };

  const CONNECTION_LABEL_MAP: Record<string, string> = {
    ant: 'Extracted data',
    collector: 'Raw records',
    cleaner: 'Cleaned records',
    analyst: 'Analysis result',
    writer: 'Report draft',
    guard: 'Approval request',
    custom: 'Data',
  };

  const startConnection = (agentId: string) => {
    if (connectFromId && connectFromId !== agentId) {
      const fromAgent = agents.find((a) => a.id === connectFromId);
      const toAgent = agents.find((a) => a.id === agentId);
      const defaultLabel = fromAgent ? (CONNECTION_LABEL_MAP[fromAgent.type] ?? 'Data') : 'Data';
      const isCircular = hasCircularConnection(connectFromId, agentId);
      const mappingKey = `${fromAgent?.type}-${toAgent?.type}`;
      const defaultMapping: ConnectionMapping[] = DEFAULT_CONN_MAPPINGS[mappingKey] ?? [
        { id: `m${Date.now()}`, fromField: 'outputData', toField: 'inputData' },
      ];
      setConnections((current) => {
        if (current.some((c) => c.from === connectFromId && c.to === agentId)) return current;
        return [...current, {
          id: `conn-${Date.now()}`,
          from: connectFromId,
          to: agentId,
          label: defaultLabel,
          mapping: defaultMapping,
        }];
      });
      const toast = isCircular
        ? `Connected — ⚠ this may create a loop`
        : fromAgent && toAgent
        ? `Connected ${fromAgent.label} → ${toAgent.label}`
        : 'Agents connected';
      setToast(toast);
      setGhostConnCursor(null);
      setConnectFromId('');
      setTool('select');
      return;
    }
    setGhostConnCursor(null);
    setConnectFromId(agentId);
    selectSingleAgent(agentId);
    setTool('connect');
    setToast('Click another agent to connect, or click a handle');
  };

  const selectConnection = (connId: string) => {
    setSelectedConnectionId(connId);
    setConnectionLabelEdit(null);
    setSelectedId('');
    setSelectedAgentIds([]);
    setConnectFromId('');
  };

  const deleteConnection = (connId: string) => {
    const conn = connections.find((c) => c.id === connId);
    const fromAgent = conn ? agents.find((a) => a.id === conn.from) : null;
    const toAgent = conn ? agents.find((a) => a.id === conn.to) : null;
    setConnections((current) => current.filter((c) => c.id !== connId));
    setSelectedConnectionId('');
    setConnectionLabelEdit(null);
    setDeleteConnConfirmOpen(false);
    setHasUnsavedAgentChanges(true);
    if (fromAgent && toAgent) {
      addSystemMessage(`Connection deleted between ${fromAgent.label} and ${toAgent.label}.`);
    }
    setToast('Connection deleted');
  };

  const updateConnectionLabel = (connId: string, label: string) => {
    setConnections((current) => current.map((c) => c.id === connId ? { ...c, label } : c));
    setConnectionLabelEdit(null);
  };

  const updateConnectionMapping = (connId: string, mapping: ConnectionMapping[]) => {
    setConnections((current) => current.map((c) => c.id === connId ? { ...c, mapping } : c));
  };

  const hasCircularConnection = (fromId: string, toId: string): boolean => {
    // BFS from toId — if we can reach fromId, adding this edge creates a cycle
    const visited = new Set<string>();
    const queue = [toId];
    while (queue.length) {
      const cur = queue.shift()!;
      if (cur === fromId) return true;
      if (visited.has(cur)) continue;
      visited.add(cur);
      connections.filter((c) => c.from === cur).forEach((c) => queue.push(c.to));
    }
    return false;
  };

  const getConnectionStatus = (conn: CanvasConnection): 'valid' | 'warning' | 'broken' => {
    const from = agents.find((a) => a.id === conn.from);
    const to = agents.find((a) => a.id === conn.to);
    if (!from || !to) return 'broken';
    if (from.disabled || to.disabled) return 'warning';
    if (!conn.mapping || conn.mapping.length === 0) return 'warning';
    return 'valid';
  };

  const computeValidationIssues = (): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];

    // Connection-level checks
    const seenConnKeys = new Set<string>();
    connections.forEach((conn) => {
      const from = agents.find((a) => a.id === conn.from);
      const to = agents.find((a) => a.id === conn.to);
      if (!from) {
        issues.push({ id: `broken-from-${conn.id}`, severity: 'error', title: 'Connection source missing', description: 'A connection has no source agent — it may have been deleted.', affectedType: 'connection', affectedId: conn.id, suggestedFix: 'Delete this broken connection.', action: { label: 'Select Connection', type: 'select-connection', targetId: conn.id } });
      }
      if (!to) {
        issues.push({ id: `broken-to-${conn.id}`, severity: 'error', title: 'Connection target missing', description: 'A connection has no target agent — it may have been deleted.', affectedType: 'connection', affectedId: conn.id, suggestedFix: 'Delete this broken connection.', action: { label: 'Select Connection', type: 'select-connection', targetId: conn.id } });
      }
      if (from?.disabled) {
        issues.push({ id: `disabled-from-${conn.id}`, severity: 'warning', title: 'Source agent is disabled', description: `${from.label} is disabled and will be skipped.`, affectedType: 'agent', affectedId: from.id, suggestedFix: 'Enable the agent or remove this connection.', action: { label: 'Select Agent', type: 'select-agent', targetId: from.id } });
      }
      if (to?.disabled) {
        issues.push({ id: `disabled-to-${conn.id}`, severity: 'warning', title: 'Target agent is disabled', description: `${to.label} is disabled and will be skipped.`, affectedType: 'agent', affectedId: to.id, suggestedFix: 'Enable the agent or remove this connection.', action: { label: 'Select Agent', type: 'select-agent', targetId: to.id } });
      }
      if (from && to && (!conn.mapping || conn.mapping.length === 0)) {
        issues.push({ id: `no-mapping-${conn.id}`, severity: 'warning', title: 'No field mapping', description: `Connection from ${from.label} to ${to.label} has no field mapping.`, affectedType: 'connection', affectedId: conn.id, suggestedFix: 'Add at least one field mapping.', action: { label: 'Select Connection', type: 'select-connection', targetId: conn.id } });
      }
      // Duplicate connections
      const key = `${conn.from}->${conn.to}`;
      if (seenConnKeys.has(key) && from && to) {
        issues.push({ id: `dup-${conn.id}`, severity: 'warning', title: 'Duplicate connection', description: `${from.label} → ${to.label} has more than one connection.`, affectedType: 'connection', affectedId: conn.id, suggestedFix: 'Remove duplicate connections.', action: { label: 'Select Connection', type: 'select-connection', targetId: conn.id } });
      }
      seenConnKeys.add(key);
    });

    // Agent-level checks
    agents.filter((a) => !a.disabled).forEach((agent) => {
      const isSource = SOURCE_AGENT_TYPES.includes(agent.type as CanvasAgentType);
      const incoming = connections.filter((c) => c.to === agent.id);
      if (!isSource && incoming.length === 0 && agents.length > 1) {
        issues.push({ id: `no-input-${agent.id}`, severity: 'error', title: 'Missing input source', description: `${agent.label} needs input but has no source connected.`, affectedType: 'agent', affectedId: agent.id, suggestedFix: 'Connect a data source to this agent.', action: { label: 'Select Agent', type: 'select-agent', targetId: agent.id } });
      }
    });

    // Workflow-level checks
    if (workflowConfig.inputs.length === 0) {
      issues.push({ id: 'no-workflow-input', severity: 'warning', title: 'No workflow input', description: 'This workflow has no input type configured.', affectedType: 'workflow', affectedId: 'workflow', suggestedFix: 'Add an input type in Workflow Settings.' });
    }
    if (workflowConfig.outputs.length === 0) {
      issues.push({ id: 'no-workflow-output', severity: 'warning', title: 'No workflow output', description: 'This workflow has no output type configured.', affectedType: 'workflow', affectedId: 'workflow', suggestedFix: 'Add an output type in Workflow Settings.' });
    }

    // Approval step check
    const needsApproval = workflowConfig.outputs.some((o) => ['google-sheets', 'send-line', 'pdf-report', 'email-report'].includes(o as string));
    const hasApprovalAgent = agents.some((a) => a.type === 'guard' && !a.disabled);
    if (needsApproval && !hasApprovalAgent) {
      issues.push({ id: 'no-approval', severity: 'info', title: 'No approval step', description: 'Your workflow exports or sends data — an Approval Guard is recommended.', affectedType: 'workflow', affectedId: 'workflow', suggestedFix: 'Add an Approval Guard agent.' });
    }

    return issues;
  };

  const runDependencyCheck = () => {
    const issues = computeValidationIssues();
    setValidationIssues(issues);
    setIsDepCheckOpen(true);
  };

  const scheduleExecTimer = (fn: () => void, delay: number) => {
    const id = window.setTimeout(() => {
      if (execStoppedRef.current || execPausedRef.current) return;
      fn();
    }, delay);
    execTimerIdsRef.current.push(id);
    return id;
  };

  const addTs = () => {
    const n = new Date();
    return `${n.getHours().toString().padStart(2, '0')}:${n.getMinutes().toString().padStart(2, '0')}`;
  };

  const runWorkflow = () => {
    if (workflowExecution.status === 'running') {
      setToast('Workflow is already running.');
      return;
    }

    // Clear any existing timers
    execTimerIdsRef.current.forEach((id) => clearTimeout(id));
    execTimerIdsRef.current = [];
    execPausedRef.current = false;
    execStoppedRef.current = false;

    const activeAgents = agents.filter((a) => !a.disabled);
    const skippedCount = agents.length - activeAgents.length;
    const skippedLabels = agents.filter((a) => a.disabled).map((a) => a.label);
    const { parallelEnabled, executionMode } = workflowExecution;

    // Build execution plan: array of steps, each step is one or more agents (parallel if grouped)
    type ExecStep = { agentIds: string[]; isParallel: boolean };
    const executionPlan: ExecStep[] = [];
    const groupedAgentIds = new Set(
      parallelEnabled
        ? parallelGroups.flatMap((g) => g.agentIds).filter((id) => activeAgents.some((a) => a.id === id))
        : []
    );

    if (parallelEnabled && executionMode === 'parallel') {
      // Build plan: sequential agents come one by one, parallel groups come as a block
      let i = 0;
      while (i < activeAgents.length) {
        const agent = activeAgents[i];
        const group = parallelGroups.find((g) => g.agentIds.includes(agent.id));
        if (group) {
          const groupAgents = activeAgents.filter((a) => group.agentIds.includes(a.id));
          executionPlan.push({ agentIds: groupAgents.map((a) => a.id), isParallel: true });
          i += groupAgents.length;
        } else if (groupedAgentIds.has(agent.id)) {
          i++;
        } else {
          executionPlan.push({ agentIds: [agent.id], isParallel: false });
          i++;
        }
      }
    } else {
      activeAgents.forEach((a) => executionPlan.push({ agentIds: [a.id], isParallel: false }));
    }

    // Reset agents
    setAgents((current) => current.map((agent) => {
      if (agent.disabled) return agent;
      const planIdx = executionPlan.findIndex((s) => s.agentIds.includes(agent.id));
      return { ...agent, status: planIdx === 0 ? 'running' : 'idle', error: null };
    }));
    setConnections((current) => current.map((connection) => ({ ...connection, active: false })));
    setApprovalPending(false);

    const startText = skippedCount > 0
      ? `Workflow started — ${skippedCount} disabled agent${skippedCount > 1 ? 's' : ''} will be skipped`
      : parallelEnabled && executionMode === 'parallel'
      ? 'Workflow started — parallel execution enabled'
      : 'Workflow started';
    addSystemMessage(startText);
    if (skippedCount > 0) {
      skippedLabels.forEach((label) => addSystemMessage(`${label} is disabled and was skipped.`));
    }
    if (loopConfig.enabled && loopConfig.source !== 'none') {
      const src = LOOP_SOURCE_OPTIONS.find((o) => o.value === loopConfig.source);
      addSystemMessage(`Loop started: ${loopConfig.totalItems} ${src?.label.replace('Loop through ', '') ?? loopConfig.source}.`);
    }
    if (chatCollapsed) setChatCollapsed(false);

    const STEP_MS = 700;

    // Schedule each plan step
    executionPlan.forEach((step, planIdx) => {
      scheduleExecTimer(() => {
        setWorkflowExecution((prev) => ({ ...prev, currentStepIndex: planIdx }));
        const isLast = planIdx === executionPlan.length - 1;
        setAgents((current) => current.map((item) => {
          if (item.disabled) return item;
          const itemPlanIdx = executionPlan.findIndex((s) => s.agentIds.includes(item.id));
          if (itemPlanIdx < 0) return item;
          if (itemPlanIdx < planIdx) return { ...item, status: 'done' };
          if (itemPlanIdx === planIdx) return { ...item, status: isLast ? 'waiting' : 'running' };
          return item;
        }));
        setConnections((current) => current.map((connection, ci) => ({ ...connection, active: ci < planIdx })));
        if (step.isParallel) {
          const labels = step.agentIds.map((id) => agents.find((a) => a.id === id)?.label ?? id).join(' and ');
          addSystemMessage(`Running ${labels} in parallel.`);
        }
      }, planIdx * STEP_MS);
    });

    // Agent chat messages keyed by agentId
    const allChatMessages: Array<{ agentId: string; sender: string; text: string; delay: number }> = [
      { agentId: 'agent-ant', sender: 'AI Ant Scout', text: 'Starting read-only scan of the LINE MAN screenshot.', delay: 200 },
      { agentId: 'agent-ant', sender: 'AI Ant Scout', text: 'I found 42 orders and delivery fee data.', delay: 1100 },
      { agentId: 'agent-collector', sender: 'Data Collector', text: 'I extracted total sales ฿4,920, GP fee ฿640, VAT ฿290, and top menu items.', delay: 2000 },
      { agentId: 'agent-cleaner', sender: 'Data Cleaner', text: 'I cleaned duplicate rows and normalized all sales fields. Data is ready.', delay: 2900 },
      { agentId: 'agent-analyst', sender: 'Sales Analyst', text: 'Profit is down by 18%. Main drivers are high GP fee and packaging cost increase.', delay: 3800 },
      { agentId: 'agent-writer', sender: 'Report Writer', text: 'I drafted a daily profit report with key insights and recommended actions.', delay: 4700 },
      { agentId: 'agent-guard', sender: 'Approval Guard', text: 'Report is ready. Waiting for your approval before exporting or sending.', delay: 5600 },
    ];
    const workflowChatMessages = allChatMessages.filter((m) => !agents.find((a) => a.id === m.agentId)?.disabled);

    workflowChatMessages.forEach(({ agentId, sender, text, delay }) => {
      const typingId = window.setTimeout(() => {
        if (execStoppedRef.current || execPausedRef.current) return;
        setTypingLabel(sender);
      }, Math.max(50, delay - 650));
      execTimerIdsRef.current.push(typingId);

      scheduleExecTimer(() => {
        const ts2 = addTs();
        setChatMessages((current) => [...current, { role: 'agent', sender, agentId, text, timestamp: ts2 }]);
        setTypingLabel(null);
        if (chatCollapsedRef.current) setUnreadCount((n) => n + 1);
      }, delay);
    });

    // Loop progress messages
    if (loopConfig.enabled && loopConfig.source !== 'none') {
      const src = LOOP_SOURCE_OPTIONS.find((o) => o.value === loopConfig.source);
      const srcLabel = src?.label.replace('Loop through ', '') ?? loopConfig.source;
      const singular = srcLabel.replace(/s$/, '');
      [12, 28].forEach((itemNum, i) => {
        if (itemNum <= loopConfig.totalItems) {
          scheduleExecTimer(() => {
            const ts = addTs();
            setChatMessages((current) => [...current, {
              role: 'agent', sender: 'Data Collector',
              agentId: 'agent-collector',
              text: `Processing ${singular} ${itemNum} of ${loopConfig.totalItems}.`,
              timestamp: ts,
            }]);
            setLoopConfig((prev) => ({ ...prev, currentItem: itemNum }));
            if (chatCollapsedRef.current) setUnreadCount((n) => n + 1);
          }, 2000 + i * 1200);
        }
      });
    }

    const totalMs = executionPlan.length * STEP_MS + 500;
    scheduleExecTimer(() => {
      const ts3 = addTs();
      setChatMessages((current) => [...current, {
        role: 'agent', sender: '⚡ System',
        text: 'Approval required — use the quick actions below to approve, edit, or reject the report.',
        timestamp: ts3,
      }]);
      setApprovalPending(true);
      setWorkflowExecution((prev) => ({ ...prev, status: 'waiting-approval' }));
    }, totalMs);

    setWorkflowExecution((prev) => ({
      ...prev,
      status: 'running',
      currentStepIndex: 0,
      startedAt: new Date().toISOString(),
      pausedAt: null,
      stoppedAt: null,
    }));
    setToast(skippedCount > 0
      ? `Workflow running — ${skippedCount} agent${skippedCount > 1 ? 's' : ''} skipped`
      : parallelEnabled && executionMode === 'parallel'
      ? 'Workflow running — parallel mode active'
      : 'Workflow running — Safety Mode remains on'
    );
  };

  const pauseWorkflow = () => {
    if (workflowExecution.status !== 'running') return;
    execPausedRef.current = true;
    execTimerIdsRef.current.forEach((id) => clearTimeout(id));
    execTimerIdsRef.current = [];
    setTypingLabel(null);
    setAgents((prev) => prev.map((a) => a.status === 'running' ? { ...a, status: 'waiting' } : a));
    setWorkflowExecution((prev) => ({ ...prev, status: 'paused', pausedAt: new Date().toISOString() }));
    addSystemMessage('Workflow paused by user.');
    setToast('Workflow paused');
  };

  const resumeWorkflow = () => {
    if (workflowExecution.status !== 'paused') return;
    execPausedRef.current = false;
    execStoppedRef.current = false;
    const resumeFromStep = workflowExecution.currentStepIndex;
    const activeAgents = agents.filter((a) => !a.disabled);
    const { parallelEnabled, executionMode } = workflowExecution;

    type ExecStep = { agentIds: string[]; isParallel: boolean };
    const executionPlan: ExecStep[] = [];
    if (parallelEnabled && executionMode === 'parallel') {
      let i = 0;
      while (i < activeAgents.length) {
        const agent = activeAgents[i];
        const group = parallelGroups.find((g) => g.agentIds.includes(agent.id));
        if (group) {
          const groupAgents = activeAgents.filter((a) => group.agentIds.includes(a.id));
          executionPlan.push({ agentIds: groupAgents.map((a) => a.id), isParallel: true });
          i += groupAgents.length;
        } else {
          executionPlan.push({ agentIds: [agent.id], isParallel: false });
          i++;
        }
      }
    } else {
      activeAgents.forEach((a) => executionPlan.push({ agentIds: [a.id], isParallel: false }));
    }

    const remainingSteps = executionPlan.slice(resumeFromStep);
    const STEP_MS = 700;
    remainingSteps.forEach((step, relIdx) => {
      scheduleExecTimer(() => {
        const absIdx = resumeFromStep + relIdx;
        const isLast = absIdx === executionPlan.length - 1;
        setWorkflowExecution((prev) => ({ ...prev, currentStepIndex: absIdx }));
        setAgents((current) => current.map((item) => {
          if (item.disabled) return item;
          const itemPlanIdx = executionPlan.findIndex((s) => s.agentIds.includes(item.id));
          if (itemPlanIdx < 0) return item;
          if (itemPlanIdx < absIdx) return { ...item, status: 'done' };
          if (itemPlanIdx === absIdx) return { ...item, status: isLast ? 'waiting' : 'running' };
          return item;
        }));
        setConnections((current) => current.map((connection, ci) => ({ ...connection, active: ci < absIdx })));
      }, relIdx * STEP_MS);
    });

    const totalMs = remainingSteps.length * STEP_MS + 500;
    scheduleExecTimer(() => {
      setApprovalPending(true);
      setWorkflowExecution((prev) => ({ ...prev, status: 'waiting-approval' }));
      addSystemMessage('Approval required — use the quick actions below to approve, edit, or reject the report.');
    }, totalMs);

    setWorkflowExecution((prev) => ({ ...prev, status: 'running', pausedAt: null }));
    const resumeAgent = agents.filter((a) => !a.disabled)[resumeFromStep];
    const stepLabel = resumeAgent ? `Step ${resumeFromStep + 1}: ${resumeAgent.label}` : `Step ${resumeFromStep + 1}`;
    addSystemMessage(`Workflow resumed from ${stepLabel}.`);
    setToast('Workflow resumed');
  };

  const stopWorkflow = () => {
    if (workflowExecution.status !== 'running' && workflowExecution.status !== 'paused') return;
    setStopConfirmOpen(true);
  };

  const confirmStopWorkflow = () => {
    execStoppedRef.current = true;
    execPausedRef.current = false;
    execTimerIdsRef.current.forEach((id) => clearTimeout(id));
    execTimerIdsRef.current = [];
    setTypingLabel(null);
    setAgents((prev) => prev.map((a) =>
      a.status === 'running' || a.status === 'waiting'
        ? { ...a, status: 'idle' }
        : a
    ));
    setWorkflowExecution((prev) => ({
      ...prev,
      status: 'stopped',
      stoppedAt: new Date().toISOString(),
    }));
    setStopConfirmOpen(false);
    addSystemMessage('Workflow stopped by user.');
    setToast('Workflow stopped');
  };

  const persistChatMsg = useCallback((serverId: string, channelId: string, msg: ChatMsg) => {
    setChatServers((prev) => prev.map((s) => s.id !== serverId ? s : {
      ...s,
      channels: s.channels.map((ch) => ch.id === channelId ? { ...ch, unread: 0 } : ch),
      messages: { ...s.messages, [channelId]: [...(s.messages[channelId] ?? []), msg] },
    }));
    setChatMessages((curr) => [...curr, msg]);
  }, []);

  const sendTeamChat = (message = chatText) => {
    const text = message.trim();
    if (!text) return;
    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const userMsg: ChatMsg = { id: `msg-${Date.now()}`, role: 'user', text, timestamp: ts, type: 'user', channelId: activeChatChannelId };
    persistChatMsg(activeChatServerId, activeChatChannelId, userMsg);
    setChatText('');
    setChatMentionOpen(false);

    const lower = text.toLowerCase();

    // ── Detect @ mention ──────────────────────────────────────────────────
    const mentionMatch = text.match(/@([\w\s]+?)(?:\s|$)/);
    const mentionedAgentName = mentionMatch ? mentionMatch[1].trim().toLowerCase() : null;
    const mentionedAgent = mentionedAgentName ? agents.find((a) => a.label.toLowerCase().includes(mentionedAgentName)) : null;

    // ── Detect workflow commands ──────────────────────────────────────────
    const addAgentMatch = lower.match(/add\s+(.+?)\s+(?:after|before)\s+(.+)/);
    const disableMatch = lower.match(/disable\s+(.+)/);
    const enableMatch = lower.match(/enable\s+(.+)/);
    const renameMatch = lower.match(/rename\s+(?:workflow\s+to|this\s+workflow\s+to|workflow)\s+(.+)/);
    const createChannelMatch = lower.match(/create\s+(?:a\s+)?(?:new\s+)?channel\s+(?:called\s+|named\s+)?(.+)/);
    const checkCmd = lower.includes('check workflow') || lower.includes('check dependencies');
    const runTestCmd = lower.includes('run test') || lower.includes('test mode');
    const showLogsCmd = lower.includes('show logs') || lower.includes('open logs');
    const summarizeCmd = lower.includes('summarize') || lower.includes('summarise');
    // ── AI workflow commands ──────────────────────────────────────────────────
    const buildWorkflowCmd = lower.match(/build\s+workflow|generate\s+workflow|create\s+workflow/);
    const improveCmd = lower.includes('improve') || lower.includes('optimize workflow') || lower.includes('make.*better');
    const explainCmd = lower.includes('explain') || lower.includes('explain this workflow') || lower.includes('what does this workflow');
    const debugCmd = lower.includes('debug') || lower.includes('fix workflow') || lower.includes('workflow issues');
    const qualityCmd = lower.includes('quality score') || lower.includes('score workflow') || lower.includes('workflow score');
    const genInstrMatch = lower.match(/generate\s+instruction\s+for\s+(.+)|gen\s+instruction\s+for\s+(.+)/);
    const saferCmd = lower.includes('make.*safer') || lower.includes('add approval') || lower.includes('add safety');
    const lowerCostCmd = lower.includes('reduce cost') || lower.includes('lower cost') || lower.includes('optimize.*cost') || lower.includes('cost.*reduction');
    const lowerTokenCmd = lower.includes('reduce token') || lower.includes('lower token') || lower.includes('token usage');

    if (addAgentMatch) {
      const newAgentName = addAgentMatch[1].trim();
      const afterAgent = addAgentMatch[2].trim();
      setChatCommandConfirm({
        description: `Add "${newAgentName}" ${lower.includes('after') ? 'after' : 'before'} "${afterAgent}" and connect it to the next step.`,
        action: () => {
          addSystemMessage(`System: "${newAgentName}" added to workflow after "${afterAgent}".`);
          setToast(`Agent "${newAgentName}" added`);
          setChatCommandConfirm(null);
        },
      });
      setTypingLabel('Colony');
      window.setTimeout(() => {
        const cmdMsg: ChatMsg = { id: `msg-${Date.now()}`, role: 'agent', sender: '⚡ System', text: `Detected workflow command: Add "${newAgentName}" ${lower.includes('after') ? 'after' : 'before'} "${afterAgent}". Confirm below to apply.`, timestamp: ts, type: 'command' };
        persistChatMsg(activeChatServerId, activeChatChannelId, cmdMsg);
        setTypingLabel(null);
      }, 400);
      return;
    }
    if (disableMatch) {
      const target = disableMatch[1].trim();
      setChatCommandConfirm({
        description: `Disable agent "${target}" in the current workflow.`,
        action: () => {
          setAgents((prev) => prev.map((a) => a.label.toLowerCase().includes(target.toLowerCase()) ? { ...a, disabled: true } : a));
          addSystemMessage(`System: Agent "${target}" disabled.`);
          setToast(`"${target}" disabled`);
          setChatCommandConfirm(null);
        },
      });
      setTypingLabel('Colony');
      window.setTimeout(() => {
        persistChatMsg(activeChatServerId, activeChatChannelId, { id: `msg-${Date.now()}`, role: 'agent', sender: '⚡ System', text: `Detected command: Disable "${target}". Confirm below.`, timestamp: ts, type: 'command' });
        setTypingLabel(null);
      }, 400);
      return;
    }
    if (enableMatch) {
      const target = enableMatch[1].trim();
      setChatCommandConfirm({
        description: `Re-enable agent "${target}" in the current workflow.`,
        action: () => {
          setAgents((prev) => prev.map((a) => a.label.toLowerCase().includes(target.toLowerCase()) ? { ...a, disabled: false } : a));
          addSystemMessage(`System: Agent "${target}" enabled.`);
          setToast(`"${target}" enabled`);
          setChatCommandConfirm(null);
        },
      });
      setTypingLabel('Colony');
      window.setTimeout(() => {
        persistChatMsg(activeChatServerId, activeChatChannelId, { id: `msg-${Date.now()}`, role: 'agent', sender: '⚡ System', text: `Detected command: Enable "${target}". Confirm below.`, timestamp: ts, type: 'command' });
        setTypingLabel(null);
      }, 400);
      return;
    }
    if (renameMatch) {
      const newName = renameMatch[1].trim();
      setChatCommandConfirm({
        description: `Rename this workflow to "${newName}".`,
        action: () => {
          addSystemMessage(`System: Workflow renamed to "${newName}".`);
          setToast(`Workflow renamed to "${newName}"`);
          setChatCommandConfirm(null);
        },
      });
      setTypingLabel('Colony');
      window.setTimeout(() => {
        persistChatMsg(activeChatServerId, activeChatChannelId, { id: `msg-${Date.now()}`, role: 'agent', sender: '⚡ System', text: `Detected command: Rename workflow to "${newName}". Confirm below.`, timestamp: ts, type: 'command' });
        setTypingLabel(null);
      }, 400);
      return;
    }
    if (createChannelMatch) {
      const chName = createChannelMatch[1].trim().replace(/[^a-z0-9-]/gi, '-').toLowerCase();
      setChatCommandConfirm({
        description: `Create a new channel "#${chName}" in ${activeChatServer?.name}.`,
        action: () => {
          const newId = `ch-${Date.now()}`;
          setChatServers((prev) => prev.map((s) => s.id !== activeChatServerId ? s : { ...s, channels: [...s.channels, { id: newId, name: chName, type: 'general', unread: 0 }], messages: { ...s.messages, [newId]: [] } }));
          addSystemMessage(`System: Channel "#${chName}" created.`);
          setToast(`Channel "#${chName}" created`);
          setChatCommandConfirm(null);
        },
      });
      setTypingLabel('Colony');
      window.setTimeout(() => {
        persistChatMsg(activeChatServerId, activeChatChannelId, { id: `msg-${Date.now()}`, role: 'agent', sender: '⚡ System', text: `Detected command: Create channel "#${chName}". Confirm below.`, timestamp: ts, type: 'command' });
        setTypingLabel(null);
      }, 400);
      return;
    }

    // ── Special chat actions ───────────────────────────────────────────────
    if (checkCmd) { runDependencyCheck(); }
    if (runTestCmd) { addSystemMessage('Test run started. No external action will be taken.'); setToast('Test run started'); }
    if (showLogsCmd) { selectChatChannel('logs'); }

    // ── Build reply ────────────────────────────────────────────────────────
    let reply = `I can help with ${activeProject.name}. Ask about agents, approvals, reports, or use @AgentName to route your message.`;
    let sender = 'Colony';
    let replyAgentId = '';
    let replyChannel = activeChatChannelId;

    if (mentionedAgent) {
      sender = mentionedAgent.label;
      replyAgentId = mentionedAgent.id;
      const agentLower = mentionedAgent.label.toLowerCase();
      if (agentLower.includes('analyst')) {
        reply = 'I reviewed the workflow data and found the key drivers. Would you like the full breakdown or a summary?';
      } else if (agentLower.includes('report') || agentLower.includes('writer')) {
        reply = 'I can turn this into a clearer report draft. Want me to start with an executive summary?';
      } else if (agentLower.includes('guard') || agentLower.includes('approval')) {
        reply = 'I checked the action. Approval is required before continuing. Please review and confirm.';
        replyChannel = 'approvals';
      } else if (agentLower.includes('clean')) {
        reply = 'I found 3 formatting issues and 2 missing values. I can normalize and clean the data — confirm to proceed.';
      } else if (agentLower.includes('collect')) {
        reply = 'I can collect and structure records from the current input source. Ready when you confirm.';
      } else if (agentLower.includes('scout')) {
        reply = 'I scanned the input and extracted relevant fields for downstream processing.';
      } else {
        reply = `Got it — I'm "${mentionedAgent.label}" (${mentionedAgent.role}). How can I help?`;
      }
    } else if (summarizeCmd) {
      const msgs = activeChatServer?.messages[activeChatChannelId] ?? [];
      reply = `Summary of #${activeChatChannel?.name} (${msgs.length} messages): ${msgs.slice(-3).map((m) => `${m.sender ?? 'User'}: "${m.text.slice(0, 40)}..."`).join(' · ')}`;
      sender = 'Colony';
    } else if (lower.includes('clean') || lower.includes('duplicate') || lower.includes('validate')) {
      reply = 'I found formatting issues and missing values in the dataset. Cleaning and normalizing now.';
      sender = 'Data Cleaner'; replyAgentId = 'agent-cleaner';
    } else if (lower.includes('report') && !lower.includes('run')) {
      reply = "I'm ready to generate a structured report with key insights. Shall I proceed?";
      sender = 'Report Writer'; replyAgentId = 'agent-writer'; replyChannel = 'reports';
    } else if (lower.includes('send') || lower.includes('export')) {
      reply = 'I need your approval before sending or exporting. Please confirm in #approvals.';
      sender = 'Approval Guard'; replyAgentId = 'agent-guard'; replyChannel = 'approvals';
    } else if (lower.includes('approv')) {
      reply = 'Nothing will proceed without your explicit approval. Check #approvals for pending items.';
      sender = 'Approval Guard'; replyAgentId = 'agent-guard';
    } else if (lower.includes('status') || lower.includes('agents')) {
      const running = agents.find((a) => a.status === 'running');
      const waiting = agents.find((a) => a.status === 'waiting');
      reply = waiting ? `${waiting.label} is waiting for approval.` : running ? `${running.label} is running now.` : `All ${agents.length} agents are ready.`;
    } else if (lower.includes('run') || lower.includes('start workflow')) {
      reply = `Starting ${workflowName} workflow. Safety Mode ${safetyMode ? 'ON' : 'OFF'}.`;
      window.setTimeout(openRunWorkflowPreview, 200);
    } else if (buildWorkflowCmd) {
      const promptText = text.replace(/build workflow|generate workflow|create workflow/gi, '').trim() || 'general workflow';
      setChatCommandConfirm({ description: `Build workflow from prompt: "${promptText.slice(0, 60)}"`, action: () => { setBuildWorkflowModal({ prompt: promptText, workflowType: 'reporting', complexity: 'Medium', industry: '', outputPreference: 'Balanced', safetyMode, generating: false, result: null }); } });
      reply = `Detected workflow generation command. Review the prompt below and confirm to open the AI builder.`;
      sender = '✨ Colony AI';
    } else if (improveCmd || lowerCostCmd || lowerTokenCmd || saferCmd) {
      const label = lowerCostCmd ? 'cost optimization' : lowerTokenCmd ? 'token reduction' : saferCmd ? 'safety improvements' : 'workflow improvements';
      setChatCommandConfirm({ description: `Analyze workflow and suggest ${label}`, action: () => openImproveWorkflow() });
      reply = `I'll analyze the workflow for ${label}. Confirm below to proceed.`;
      sender = '✨ Colony AI';
    } else if (explainCmd) {
      const mode: ExplanationMode = lower.includes('technical') ? 'Technical' : lower.includes('executive') ? 'Executive' : 'Simple';
      window.setTimeout(() => openExplainWorkflow(mode), 100);
      reply = `Opening ${mode} workflow explanation…`;
      sender = '✨ Colony AI';
    } else if (debugCmd) {
      window.setTimeout(() => openDebugWorkflow(), 100);
      reply = 'Running workflow diagnostic scan…';
      sender = '✨ Colony AI';
    } else if (qualityCmd) {
      window.setTimeout(() => openScoreWorkflow(), 100);
      reply = 'Calculating workflow quality score…';
      sender = '✨ Colony AI';
    } else if (genInstrMatch) {
      const targetName = (genInstrMatch[1] ?? genInstrMatch[2] ?? '').trim();
      const targetAgent = agents.find((a) => a.label.toLowerCase().includes(targetName.toLowerCase()));
      if (targetAgent) {
        window.setTimeout(() => openGenerateInstructions(targetAgent.id, targetAgent.label, targetAgent.role), 100);
        reply = `Generating AI instructions for "${targetAgent.label}"…`;
      } else {
        reply = `No agent named "${targetName}" found. Try: "Generate instruction for Analyst"`;
      }
      sender = '✨ Colony AI';
    } else if (lower.includes('explain') || lower.includes('what does')) {
      reply = `This workflow (${workflowName}) processes input through ${agents.length} agents sequentially. Each agent handles a specific task and passes results to the next step.`;
    } else if (lower.includes('log') || lower.includes('history')) {
      reply = `Check #logs for the full event history. Latest: Run #024 completed in 42s.`;
      replyChannel = 'logs';
    } else if (lower.includes('memory')) {
      const srv = chatServers.find((s) => s.id === activeChatServerId);
      const mems = srv?.memories ?? [];
      reply = mems.length > 0 ? `Chat Memory (${mems.length} items): ${mems.map((m) => m.text).join(' | ')}` : 'No chat memory set. Open Chat Memory to add context.';
    }

    setTypingLabel(sender);
    window.setTimeout(() => {
      const replyMsg: ChatMsg = { id: `msg-${Date.now() + 1}`, role: 'agent', sender, agentId: replyAgentId, text: reply, timestamp: ts, type: 'agent', channelId: replyChannel };
      // Route to correct channel
      if (replyChannel !== activeChatChannelId) {
        setChatServers((prev) => prev.map((s) => s.id !== activeChatServerId ? s : {
          ...s,
          channels: s.channels.map((ch) => ch.id === replyChannel ? { ...ch, unread: (ch.unread ?? 0) + 1 } : ch),
          messages: { ...s.messages, [replyChannel]: [...(s.messages[replyChannel] ?? []), replyMsg] },
        }));
      } else {
        persistChatMsg(activeChatServerId, activeChatChannelId, replyMsg);
      }
      setTypingLabel(null);
      if (chatCollapsedRef.current) setUnreadCount((n) => n + 1);
    }, 700);
  };

  const generateTeam = () => {
    const lower = prompt.toLowerCase();
    const template: AgentType[] = lower.includes('customer')
      ? ['ant', 'collector', 'writer', 'guard']
      : lower.includes('content')
        ? ['ant', 'collector', 'analyst', 'writer', 'guard']
        : ['ant', 'collector', 'cleaner', 'analyst', 'writer', 'guard'];
    const nextAgents = template.map((type, index) => ({
      ...agentCatalog[type],
      id: `generated-${type}-${index}`,
      x: AGENT_START_X + index * (AGENT_BODY.width + AGENT_GAP_X),
      y: AGENT_START_Y,
      status: (index === 0 ? 'done' : 'idle') as AgentStatus,
    }));
    setAgents(nextAgents);
    setConnections(nextAgents.slice(1).map((agent, index) => ({
      id: `conn-gen-${Date.now()}-${index}`,
      from: nextAgents[index].id,
      to: agent.id,
      active: index === 0,
      label: (['Extracted data', 'Raw records', 'Cleaned records', 'Analysis result', 'Report draft'] as string[])[index] ?? 'Data',
    })));
    setSelectedAgentIds(nextAgents[0] ? [nextAgents[0].id] : []);
    setSelectedId(nextAgents[0]?.id ?? '');
    setToast(`${nextAgents.length} agents assembled from your prompt`);
    window.setTimeout(zoomFit, 120);
  };

  const openAddAgentModal = (insertBetweenConnectionId?: string) => {
    const defaultOpt = ADD_AGENT_OPTIONS.find((o) => o.type === 'analyst') ?? ADD_AGENT_OPTIONS[0];
    setAddAgentModal({
      selectedType: defaultOpt.type,
      name: defaultOpt.defaults.label,
      role: defaultOpt.defaults.role,
      instructions: defaultOpt.defaults.instructions ?? '',
      input: defaultOpt.defaults.input ?? '',
      output: defaultOpt.defaults.output ?? '',
      insertBetweenConnectionId,
    });
    setIsAddAgentOpen(true);
  };

  const confirmAddAgent = () => {
    const option = ADD_AGENT_OPTIONS.find((item) => item.type === addAgentModal.selectedType);
    if (!option) return;

    const insertConnId = addAgentModal.insertBetweenConnectionId;
    const insertConn = insertConnId ? connections.find((c) => c.id === insertConnId) : null;

    let position = getNextAgentPosition(agents);
    if (insertConn) {
      const fromAgent = agents.find((a) => a.id === insertConn.from);
      const toAgent = agents.find((a) => a.id === insertConn.to);
      if (fromAgent && toAgent) {
        position = {
          x: clamp((fromAgent.x + toAgent.x) / 2, 0, BOARD_SIZE.width - AGENT_CARD.width),
          y: clamp((fromAgent.y + toAgent.y) / 2, 0, BOARD_SIZE.height - AGENT_CARD.height),
        };
      }
    }

    const newAgent: CanvasAgent = withAgentSkills({
      ...option.defaults,
      id: `agent-${option.type}-${Date.now()}`,
      label: addAgentModal.name.trim() || option.defaults.label,
      role: addAgentModal.role.trim() || option.defaults.role,
      instructions: addAgentModal.instructions.trim() || option.defaults.instructions,
      input: addAgentModal.input.trim() || option.defaults.input,
      output: addAgentModal.output.trim() || option.defaults.output,
      x: position.x,
      y: position.y,
      status: 'idle',
    });

    setAgents((current) => [...current, newAgent]);

    if (insertConn) {
      const now = Date.now();
      setConnections((current) => {
        const withoutOld = current.filter((c) => c.id !== insertConnId);
        return [
          ...withoutOld,
          { id: `conn-${now}-a`, from: insertConn.from, to: newAgent.id, label: insertConn.label },
          { id: `conn-${now}-b`, from: newAgent.id, to: insertConn.to, label: insertConn.label },
        ];
      });
      setToast('Agent inserted into workflow');
    } else {
      setToast(`Added ${newAgent.label}`);
    }

    setSelectedAgentIds([newAgent.id]);
    setSelectedId(newAgent.id);
    setSelectedConnectionId('');
    setTool('select');
    setHasUnsavedAgentChanges(true);
    setIsAddAgentOpen(false);
    addSystemMessage(`New agent added: ${option.cardTitle}`);
    addAuditLog({ actorType: 'User', actorName: 'You', actionType: 'agent-added', title: `Added ${newAgent.label}`, description: `Agent "${newAgent.label}" added to canvas.`, workflowName: workflowName, stepName: newAgent.label, riskLevel: 'Low', status: 'Success', reversible: true, afterState: { agentId: newAgent.id, label: newAgent.label } });
    window.setTimeout(zoomFit, 120);
  };

  const openRunWorkflowPreview = () => {
    if (isWorkflowRunning) {
      setToast('Workflow is already running.');
      return;
    }
    setValidationIssues(computeValidationIssues());
    setIsRunPreviewOpen(true);
  };

  const startConfirmedWorkflow = () => {
    const currentPlan = PLANS.find((p) => p.id === usageState.currentPlan) ?? PLANS[0];

    // Check workflow run limit
    if (usageState.workflowRunsUsed >= currentPlan.workflowRunsLimit) {
      setIsRunPreviewOpen(false);
      setUpgradeModal({ toPlan: 'pro', reason: 'run-limit' });
      return;
    }

    // Check credit balance
    const activeAgents = agents.filter((a) => !a.disabled);
    const est = estimateWorkflowCredits(activeAgents, currentPlan.creditsLimit, usageState.agentCreditsUsed);
    const { credits, tokens } = est;
    const creditsRemaining = currentPlan.creditsLimit - usageState.agentCreditsUsed;
    if (credits > creditsRemaining) {
      setIsRunPreviewOpen(false);
      setUpgradeModal({ toPlan: 'pro', reason: 'credits', requiredCredits: credits, estimatedCredits: credits });
      return;
    }

    // Deduct credits + increment run count + add usage event
    const now = new Date();
    const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newEvent: UsageEvent = {
      id: `ue-${Date.now()}`,
      timestamp: ts,
      workflowName: activeProject.name,
      actionType: 'Workflow run',
      agentsUsed: activeAgents.length,
      creditsUsed: credits,
      tokensUsed: tokens,
      status: 'Completed',
    };
    setUsageState({
      ...usageState,
      workflowRunsUsed: usageState.workflowRunsUsed + 1,
      agentCreditsUsed: usageState.agentCreditsUsed + credits,
      tokenUsageThisMonth: usageState.tokenUsageThisMonth + tokens,
      estimatedCost: Math.round((usageState.estimatedCost + tokens * 0.000027) * 100) / 100,
      usageEvents: [newEvent, ...usageState.usageEvents],
    });

    setIsRunPreviewOpen(false);
    addSystemMessage(`Workflow started with Safety Mode ${safetyMode ? 'ON' : 'OFF'}.`);
    addSystemMessage(`System: Workflow run used ${credits} credits.`);
    addAuditLog({ actorType: 'User', actorName: 'You', actionType: 'workflow-run', title: 'Workflow run started', description: `Executed with ${activeAgents.length} active agents. Credits used: ${credits}.`, workflowName, riskLevel: credits > 50 ? 'High' : credits > 20 ? 'Medium' : 'Low', status: 'Success', reversible: false, metadata: { agentsUsed: activeAgents.length, creditsUsed: credits, tokensUsed: tokens } });
    const _apprAgents = activeAgents.filter((a) => a.stepApproval?.requiresApproval);
    const _newRunNum = Math.max(...workflowRuns.map((r) => r.runNumber), 24) + 1;
    const _newRun: WorkflowRun = {
      id: `run-${String(_newRunNum).padStart(3, '0')}`, runNumber: _newRunNum, workflowId: 'wf-1', workflowName,
      status: _apprAgents.length > 0 ? 'Waiting Approval' : 'Completed', triggerType: 'Manual',
      startedAt: `Today ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`,
      completedAt: `Today ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`,
      durationSeconds: 30 + activeAgents.length * 4,
      agentsUsed: activeAgents.length, totalTokens: tokens, inputTokens: Math.round(tokens * 0.6), outputTokens: Math.round(tokens * 0.4),
      creditsUsed: credits, estimatedCost: credits * 0.01,
      outputType: _apprAgents.length > 0 ? 'Draft (awaiting approval)' : 'Report',
      outputSummary: _apprAgents.length > 0 ? 'Workflow paused — awaiting approval before continuing.' : `Workflow completed successfully with ${activeAgents.length} agents.`,
      approvalStatus: _apprAgents.length > 0 ? 'Pending' : 'None', safetyMode,
      steps: activeAgents.map((a, i) => ({
        id: `step-${i + 1}`, agentId: a.id, agentName: a.label, role: a.role, status: 'Completed' as RunStepStatus,
        startedAt: '', endedAt: '', durationSeconds: 4 + Math.round(Math.random() * 8),
        inputSource: i === 0 ? 'Workflow input' : 'Previous agent output', outputProduced: 'Processed output',
        inputTokens: Math.round(tokens / activeAgents.length * 0.6), outputTokens: Math.round(tokens / activeAgents.length * 0.4),
        totalTokens: Math.round(tokens / activeAgents.length), estimatedCost: credits / activeAgents.length * 0.01,
        summary: `${a.label} completed processing.`,
      })),
    };
    setWorkflowRuns((prev) => [_newRun, ...prev]);
    addSystemMessage(`System: Run #${_newRunNum} started.`);
    window.setTimeout(() => addSystemMessage(`System: Run #${_newRunNum} completed in ${_newRun.durationSeconds}s.`), 2000);

    // Auto-generate report if a Report Writer–type agent exists
    const _reportAgent = activeAgents.find((a) => /report|writer|output|digest/i.test(a.label));
    if (_reportAgent) {
      const _reportId = `rpt-${Date.now()}`;
      const _runTs = `Today ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
      const _newReport: Report = {
        id: _reportId, workflowId: 'wf-1', runId: _newRun.id,
        title: `${workflowName} — Run #${_newRunNum}`,
        template: 'workflow-summary', templateName: 'Workflow Summary',
        version: 1, currentVersionId: 'v1',
        status: _apprAgents.length > 0 ? 'Waiting Approval' : 'Draft',
        approvalRequired: _apprAgents.length > 0,
        approvalStatus: _apprAgents.length > 0 ? 'Pending' : 'None',
        createdAt: _runTs, updatedAt: _runTs,
        generatedBy: activeAgents.map((a) => a.label), workflowName,
        sections: _mkSections(['summary', 'metrics', 'timeline', 'insights'], {
          summary: `Workflow "${workflowName}" completed Run #${_newRunNum} with ${activeAgents.length} agents in ${_newRun.durationSeconds}s.`,
          metrics: `Agents used: ${activeAgents.length} | Credits: ${credits} | Tokens: ${tokens} | Cost: $${(credits * 0.01).toFixed(2)}`,
          insights: activeAgents.map((a) => `• ${a.label}: completed processing.`).join('\n'),
        }),
        versions: [{ id: 'v1', version: 1, editedBy: _reportAgent.label, editedAt: _runTs, status: _apprAgents.length > 0 ? 'Waiting Approval' : 'Draft', summary: 'Auto-generated by workflow run.', sections: [] }],
        exports: [],
      };
      setReports((prev) => [_newReport, ...prev]);
      // Post report card to #reports channel
      const _ts = `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`;
      const _reportCardMsg: ChatMsg = {
        id: `rpt-msg-${Date.now()}`, role: 'agent', sender: `📊 ${_reportAgent.label}`, text: `Report generated: "${_newReport.title}" · ${_newReport.templateName} · ${_apprAgents.length > 0 ? '⏳ Waiting Approval' : '📄 Draft'} — click Preview to review.`,
        timestamp: _ts, type: 'report', metadata: { reportId: _reportId },
      };
      setChatServers((prev) => prev.map((s) => {
        const repsCh = s.channels.find((c) => c.type === 'report');
        if (!repsCh) return s;
        return { ...s, channels: s.channels.map((c) => c.type === 'report' ? { ...c, unread: (c.unread ?? 0) + 1 } : c), messages: { ...s.messages, [repsCh.id]: [...(s.messages[repsCh.id] ?? []), _reportCardMsg] } };
      }));
    }

    runWorkflow();
  };

  const startWorkflowTest = () => {
    setIsRunPreviewOpen(false);
    addSystemMessage('Test run started. No external action will be taken.');
    setToast('Test run started');
  };

  // ── Report helpers ───────────────────────────────────────────────────────────
  const saveReport = useCallback((id: string, sections: ReportSection[], title: string) => {
    setReports((prev) => prev.map((r) => {
      if (r.id !== id) return r;
      const newVer: ReportVersion = { id: `v${r.version + 1}`, version: r.version + 1, editedBy: 'You', editedAt: 'Just now', status: 'Edited', summary: 'Manual edit.', sections };
      return { ...r, title, sections, status: 'Edited' as ReportStatus, version: r.version + 1, currentVersionId: newVer.id, updatedAt: 'Just now', versions: [...r.versions, newVer] };
    }));
    addSystemMessage('System: Report edited.');
    addAuditLog({ actorType: 'User', actorName: 'You', actionType: 'data-edit', title: 'Report edited', description: `Report "${title}" updated.`, workflowName, riskLevel: 'Low', status: 'Success', reversible: true });
  }, [workflowName, addAuditLog]);

  const saveReportVersion = useCallback((id: string) => {
    setReports((prev) => prev.map((r) => {
      if (r.id !== id) return r;
      const newVer: ReportVersion = { id: `v${r.version + 1}`, version: r.version + 1, editedBy: 'You', editedAt: 'Just now', status: r.status, summary: 'Manual version snapshot.', sections: r.sections };
      return { ...r, version: r.version + 1, currentVersionId: newVer.id, updatedAt: 'Just now', versions: [...r.versions, newVer] };
    }));
    setToast('Version saved');
  }, []);

  const handleReportExport = useCallback((state: ExportModalState) => {
    const report = reports.find((r) => r.id === state.reportId);
    if (!report) return;
    const { format } = state;

    if (format === 'pdf') {
      // Browser print / mock PDF
      const content = report.sections.filter((s) => s.enabled).map((s) => `== ${s.title} ==\n${s.content}`).join('\n\n');
      const blob = new Blob([`${report.title}\nGenerated: ${report.createdAt}\nWorkflow: ${report.workflowName}\n\n${content}`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${state.fileName || report.title.replace(/\s/g, '_')}.pdf`; a.click();
      URL.revokeObjectURL(url);
      setToast('PDF exported');
      addSystemMessage('System: Report exported as PDF.');
    } else if (format === 'csv') {
      const tableSec = report.sections.find((s) => s.type === 'table');
      const csvData = tableSec
        ? `Field,Value,Status\ncustomer_id missing,4 records,Warning\nFormat inconsistency,7 entries,Warning\nDuplicates removed,3 records,Resolved`
        : `Title,Workflow,Created,Status\n"${report.title}","${report.workflowName}","${report.createdAt}","${report.status}"`;
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${state.fileName || report.title.replace(/\s/g, '_')}.csv`; a.click();
      URL.revokeObjectURL(url);
      setToast('CSV exported');
    } else if (format === 'sheets') {
      setToast('Data sent to Google Sheets (mock)');
      addSystemMessage('System: Report data sent to Google Sheets.');
      // TODO: Connect real Google Sheets API via OAuth connector
    } else if (format === 'email') {
      const summary = report.sections.find((s) => s.type === 'summary')?.content ?? '';
      setEmailDraftModal({ reportId: report.id, recipient: '', subject: `Workflow Report: ${report.title}`, messagePreview: `Hello team,\n\nHere is the latest workflow report generated by Colony.\n\nSummary:\n${summary}\n\nGenerated by: ${report.generatedBy.join(', ')}\nWorkflow: ${report.workflowName}\n\nBest regards,\nColony`, includeAttachments: true, includeSummary: true });
      setReportExportModal(null);
      return;
    } else if (format === 'line') {
      const summary = report.sections.find((s) => s.type === 'summary')?.content?.slice(0, 200) ?? '';
      setLineDraftModal({ reportId: report.id, message: `[Colony Report] ${report.title}\n\n${summary}\n\nStatus: ${report.status} | Version: v${report.version}\nApproval required before any action.` });
      setReportExportModal(null);
      return;
    }

    // Record the export
    setReports((prev) => prev.map((r) => r.id === report.id ? { ...r, exports: [...r.exports, { id: `exp-${Date.now()}`, format, exportedAt: 'Just now', exportedBy: 'You' }] } : r));
    setReportExportModal(null);
  }, [reports, addSystemMessage, addAuditLog]);

  const openReportExport = useCallback((id: string, fmt: ExportModalState['format']) => {
    const report = reports.find((r) => r.id === id);
    if (!report) return;
    setReportExportModal({ reportId: id, format: fmt, fileName: report.title.replace(/\s/g, '_'), includeCharts: true, includeTimeline: false, includeAuditLog: false, includeAppendix: false, sheetDestination: 'Colony Reports', appendOrOverwrite: 'append', worksheetName: 'Sheet1' });
    setReportPreviewId(null);
  }, [reports]);
  // ── AI Workflow handlers ──────────────────────────────────────────────────
  const applyGeneratedWorkflow = useCallback((result: AIWorkflowResult) => {
    const newAgents: CanvasAgent[] = result.agents.map((a) => withAgentSkills({
      id: a.id, label: a.label, role: a.role, icon: a.icon, instructions: a.instructions,
      model: a.model, x: a.x, y: a.y, status: 'idle' as const, disabled: false,
      type: 'custom' as const, color: '#6366f1', description: a.role,
      tools: [], systemPrompt: '', tone: ['Professional'], input: 'Workflow input', output: 'Workflow output',
    }));
    const newConns: CanvasConnection[] = result.connections.map((c, i) => ({ id: `ai-conn-${Date.now()}-${i}`, from: c.from, to: c.to, label: c.label }));
    setAgents((prev) => [...prev, ...newAgents]);
    setConnections((prev) => [...prev, ...newConns]);
    const aiSuggs = mockAnalyzeWorkflow([...agents, ...newAgents], [...connections, ...newConns]);
    setAiSuggestions(aiSuggs);
    setAiSuggestionsOpen(true);
    addSystemMessage(`AI generated workflow: "${result.title}" with ${newAgents.length} agents.`);
    addAuditLog({ actorType: 'System', actorName: 'Colony AI', actionType: 'agent-added', title: 'AI-generated workflow applied', description: `Generated "${result.title}" with ${newAgents.length} agents and ${newConns.length} connections.`, workflowName, riskLevel: 'Low', status: 'Success', reversible: true });
    setToast(`Workflow generated: ${result.title}`);
  }, [agents, connections, workflowName, addAuditLog]);

  const openImproveWorkflow = useCallback(() => {
    setImproveWorkflowState({ open: true, analyzing: true, suggestions: [] });
    window.setTimeout(() => {
      const suggestions = mockAnalyzeWorkflow(agents, connections);
      setImproveWorkflowState({ open: true, analyzing: false, suggestions });
    }, 1200);
  }, [agents, connections]);

  const applyImprovementSuggestion = useCallback((id: string) => {
    setImproveWorkflowState((prev) => ({ ...prev, suggestions: prev.suggestions.map((s) => s.id === id ? { ...s, applied: true } : s) }));
    addSystemMessage('System: Workflow improvement applied.');
    setToast('Improvement applied');
  }, []);

  const openExplainWorkflow = useCallback((mode: ExplanationMode = 'Simple') => {
    setExplainWorkflowState({ open: true, mode, generating: true, explanation: '', steps: [], inputs: '', outputs: '', risks: '' });
    window.setTimeout(() => {
      const result = mockGenerateExplanation(agents, connections, mode);
      setExplainWorkflowState({ open: true, mode, generating: false, explanation: result.summary, steps: result.steps, inputs: result.inputs, outputs: result.outputs, risks: result.risks });
    }, 900);
  }, [agents, connections]);

  const openDebugWorkflow = useCallback(() => {
    setDebugWorkflowState({ open: true, analyzing: true, issues: [] });
    window.setTimeout(() => {
      const issues = mockDebugWorkflow(agents, connections);
      setDebugWorkflowState({ open: true, analyzing: false, issues });
    }, 1100);
  }, [agents, connections]);

  const applyDebugFix = useCallback((id: string) => {
    setDebugWorkflowState((prev) => ({ ...prev, issues: prev.issues.map((iss) => iss.id === id ? { ...iss, fixed: true } : iss) }));
    setAgents((prev) => prev.map((a) => a.disabled ? { ...a, disabled: false } : a));
    setToast('Workflow issue fixed.');
    addSystemMessage('System: Workflow debug fix applied.');
  }, []);

  const openScoreWorkflow = useCallback(() => {
    const score = mockScoreWorkflow(agents, connections, safetyMode);
    setWorkflowQualityScore(score);
    setWorkflowQualityOpen(true);
  }, [agents, connections, safetyMode]);

  const openGenerateInstructions = useCallback((agentId: string, agentName: string, agentRole = '') => {
    setGenerateInstructionsState({ open: true, agentId, agentName, quality: 'Balanced', generating: true, result: null });
    window.setTimeout(() => {
      const result = mockGenerateInstructions(agentName, agentRole, 'Balanced');
      setGenerateInstructionsState((prev) => ({ ...prev, generating: false, result }));
    }, 900);
  }, []);

  const insertAgentInstructions = useCallback((agentId: string, result: AgentInstructionResult) => {
    setAgents((prev) => prev.map((a) => a.id === agentId ? { ...a, instructions: result.instruction, role: result.role.split(' — ')[1] ?? a.role } : a));
    addSystemMessage(`System: AI-generated instructions applied to agent.`);
    addAuditLog({ actorType: 'System', actorName: 'Colony AI', actionType: 'agent-edited', title: 'AI instructions applied', description: `Instructions generated for agent.`, workflowName, riskLevel: 'Low', status: 'Success', reversible: true });
    setToast('Instructions applied');
    setGenerateInstructionsState((prev) => ({ ...prev, open: false }));
  }, [workflowName, addAuditLog]);
  // ─────────────────────────────────────────────────────────────────────────

  const openCanvasCommandMenu = useCallback((x: number, y: number, boardX: number, boardY: number) => {
    setCanvasContextMenu({ x, y, boardX, boardY });
    setChatContextMenu(null);
  }, []);

  const handleCanvasContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('.agent-node') || target.closest('[data-canvas-widget="note"]') || target.closest('[data-canvas-widget="comment"]')) {
      return;
    }
    event.preventDefault();
    const point = clientToBoard(event.clientX, event.clientY);
    openCanvasCommandMenu(event.clientX, event.clientY, point.x, point.y);
  };

  const openCenteredCanvasCommandMenu = () => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const center = getCanvasViewportCenterBoard();
    openCanvasCommandMenu(
      rect ? rect.left + rect.width / 2 - 110 : window.innerWidth / 2 - 110,
      rect ? rect.top + rect.height / 2 - 140 : window.innerHeight / 2 - 140,
      center.x,
      center.y,
    );
  };

  // ── Workflow management helpers ──────────────────────────────────────────

  const saveWorkflowVersion = (title?: string): number => {
    const now = new Date();
    const ts = `Today, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const nextVersion = versions.reduce((max, v) => Math.max(max, v.version), 0) + 1;
    const newVersion: WorkflowVersion = {
      id: `v${nextVersion}`,
      version: nextVersion,
      title: title ?? 'Manual save',
      timestamp: ts,
      author: 'TopSpeed',
      isCurrent: true,
      snapshot: {
        agentCount: agents.length,
        agentLabels: agents.map((a) => a.label),
        connectionCount: connections.length,
        inputSummary: workflowConfig.inputs.length ? workflowConfig.inputs.join(', ') : 'None',
        outputSummary: workflowConfig.outputs.length ? workflowConfig.outputs.join(', ') : 'None',
        instructionsSummary: activeProject.instructions ?? 'Standard workflow execution',
      },
    };
    setVersions((prev) => [newVersion, ...prev.map((v) => ({ ...v, isCurrent: false }))]);
    setLastSavedAt(ts);
    setHasUnsavedAgentChanges(false);
    return nextVersion;
  };

  const saveWorkflow = () => {
    const v = saveWorkflowVersion('Manual save');
    setToast(`Workflow saved — Version ${v}`);
    addAuditLog({ actorType: 'User', actorName: 'You', actionType: 'workflow-saved', title: 'Workflow saved', description: `Manual save — Version ${v} created.`, workflowName, riskLevel: 'Low', status: 'Success', reversible: false });
  };

  const confirmPublishWorkflow = () => {
    setWorkflowMode('live');
    setPublishConfirmOpen(false);
    addSystemMessage('Workflow published to Live mode.');
    setToast('Workflow is now live');
  };

  const confirmUnpublishWorkflow = () => {
    setWorkflowMode('draft');
    setUnpublishConfirmOpen(false);
    addSystemMessage('Workflow moved back to Draft.');
    setToast('Workflow moved to Draft');
  };

  const confirmRestoreVersion = () => {
    if (!restoreConfirmVersionId) return;
    const target = versions.find((v) => v.id === restoreConfirmVersionId);
    if (!target) return;
    saveWorkflowVersion(`Auto-saved before restoring Version ${target.version}`);
    setVersions((prev) => prev.map((v, i) => i === 0 ? v : { ...v, isCurrent: v.id === restoreConfirmVersionId }));
    setRestoreConfirmVersionId(null);
    setVersionPreviewId(null);
    addSystemMessage(`Workflow restored to Version ${target.version}.`);
    setToast(`Workflow restored to Version ${target.version}`);
  };

  const confirmDuplicateWorkflow = () => {
    setIsDuplicateModalOpen(false);
    addSystemMessage(`Workflow duplicated as "${duplicateDraft.name}".`);
    setToast('Workflow duplicated');
    // TODO: Connect with multi-workflow list / backend
  };

  const confirmSaveTemplate = () => {
    const newTemplate: WorkflowTemplate = {
      id: `tmpl-${Date.now()}`,
      name: templateDraft.name,
      category: templateDraft.category,
      description: templateDraft.description,
      includeAgents: templateDraft.includeAgents,
      includeInstructions: templateDraft.includeInstructions,
      includeIO: templateDraft.includeIO,
      includeBranching: templateDraft.includeBranching,
      includeApproval: templateDraft.includeApproval,
    };
    setSavedTemplates((prev) => [...prev, newTemplate]);
    setIsSaveTemplateModalOpen(false);
    addSystemMessage('Workflow saved as a template.');
    setToast('Template saved');
    // TODO: Connect saved templates to Templates page later
  };

  const executeCanvasAction = (action: string) => {
    const fallbackPoint = getCanvasViewportCenterBoard();
    const point = canvasContextMenu ? { x: canvasContextMenu.boardX, y: canvasContextMenu.boardY } : fallbackPoint;

    switch (action) {
      case 'add-agent':
        openAddAgentModal();
        break;
      case 'add-note':
        addStickyNoteAt(point.x, point.y);
        break;
      case 'add-comment':
        addCommentAt(point.x, point.y);
        break;
      case 'tidy':
        autoLayout();
        break;
      case 'fit':
        zoomFit();
        setToast('Fit to view');
        break;
      case 'run':
        openRunWorkflowPreview();
        break;
      case 'test':
        startWorkflowTest();
        break;
      case 'rename':
        setToast('Rename workflow coming soon');
        break;
      case 'zoom-in':
        setZoom((value) => clamp(value * 1.18, 0.28, 2.4));
        break;
      case 'zoom-out':
        setZoom((value) => clamp(value / 1.18, 0.28, 2.4));
        break;
      case 'reset-zoom':
        setZoom(0.78);
        setPan({ x: 72, y: 70 });
        setToast('Zoom reset');
        break;
      case 'toggle-minimap':
        setShowMinimap((current) => !current);
        break;
      case 'select-all':
        setSelectedAgentIds(agents.map((agent) => agent.id));
        setSelectedId('');
        break;
      case 'clear-selection':
        clearCanvasSelection();
        break;
      case 'version-history':
        if (usageState.currentPlan === 'free') {
          setUpgradeModal({ toPlan: 'pro', reason: 'pro-feature', featureName: 'Version History' });
        } else {
          setIsVersionHistoryOpen(true);
        }
        break;
      case 'duplicate-workflow':
        setIsDuplicateModalOpen(true);
        break;
      case 'save':
        saveWorkflow();
        break;
      default:
        break;
    }

    setCanvasContextMenu(null);
  };

  const duplicateSelected = () => {
    if (selectedAgentIds.length > 1) {
      duplicateSelectedAgents();
      return;
    }
    if (!selectedAgent) return;
    const copy = {
      ...selectedAgent,
      id: `${selectedAgent.id}-copy-${Date.now()}`,
      x: clamp(selectedAgent.x + 168, 0, BOARD_SIZE.width - AGENT_CARD.width),
      y: clamp(selectedAgent.y + 72, 0, BOARD_SIZE.height - AGENT_CARD.height),
      status: 'idle' as AgentStatus,
    };
    setAgents((current) => [...current, copy]);
    setSelectedAgentIds([copy.id]);
    setSelectedId(copy.id);
    setHasUnsavedAgentChanges(true);
    setToast('Agent duplicated');
  };

  const removeSelected = () => {
    if (selectedAgentIds.length > 1) {
      setIsBulkDeleteOpen(true);
      return;
    }
    if (!selectedAgent || agents.length <= 1) return;
    setAgents((current) => current.filter((agent) => agent.id !== selectedAgent.id));
    setConnections((current) => current.filter((connection) => connection.from !== selectedAgent.id && connection.to !== selectedAgent.id));
    setSelectedAgentIds([]);
    setSelectedId('');
    setSelectedConnectionId('');
    setHasUnsavedAgentChanges(true);
    setToast('Agent removed');
  };


  return (
    <div className="relative h-full min-h-[720px] overflow-hidden bg-background text-ink">
      <div className="absolute inset-x-0 top-0 z-30 flex h-[52px] items-center justify-between border-b border-white-07 bg-surface/90 px-4 backdrop-blur-2xl">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-[26px] w-[26px] place-items-center rounded-md bg-ink"><AntMark tone="white" size={16} /></span>
          <div className="hidden h-6 w-px bg-black/10 sm:block" />
          <div className="min-w-0">
            <span className="font-heading text-sm font-extrabold">{activeProject.name}</span>
            <span className="ml-1 text-xs text-muted">· {agents.length} agents</span>
            {/* Draft / Live badge */}
            <span className={`ml-1.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
              workflowMode === 'live'
                ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-400'
                : 'border-white/[0.12] bg-white/[0.05] text-white/40'
            }`}>
              {workflowMode === 'live' && <span className="h-1 w-1 rounded-full bg-emerald-400" />}
              {workflowMode === 'live' ? 'Live' : 'Draft'}
            </span>
            {lastSavedAt && !hasUnsavedAgentChanges && (
              <span className="ml-1 text-[10px] text-muted/60">· Saved {lastSavedAt}</span>
            )}
            {hasUnsavedAgentChanges && (
              <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">Unsaved changes</span>
            )}
          </div>
        </div>
        <div className="hidden items-center gap-1 md:flex">
          {[
            ['select', '\u2196', 'Select'],
            ['pan', '\u270B', 'Pan'],
            ['connect', '\u27F6', 'Connect'],
          ].map(([value, icon, label]) => (
            <button
              key={value}
              onClick={() => setTool(value as CanvasTool)}
              title={label}
              className={`grid h-8 w-8 place-items-center rounded-lg text-sm transition ${tool === value ? 'bg-ink text-white' : 'text-muted hover:bg-black/[0.05] hover:text-ink'}`}
            >
              {icon}
            </button>
          ))}
          <div className="mx-1 h-5 w-px bg-black/[0.08]" />
          <button onClick={autoLayout} className="grid h-8 w-8 place-items-center rounded-lg text-sm text-muted transition hover:bg-black/[0.05] hover:text-ink" title="Auto layout">
            {'\u22DE'}
          </button>
          <span className="ml-2 min-w-10 text-center text-xs font-medium text-muted">{Math.round(zoom * 100)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => safetyMode ? setSafetyOffConfirmOpen(true) : (setSafetyMode(true), addSystemMessage('System: Safety Mode enabled for this project.'), setToast('Safety Mode enabled'))}
            title={safetyMode ? 'Safety Mode ON — click to turn off' : 'Safety Mode OFF — click to enable'}
            className={`hidden cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold transition hover:opacity-80 sm:inline-flex ${
              safetyMode
                ? 'border-warning/30 bg-warning/10 text-[#d97706]'
                : 'border-red-400/30 bg-red-400/10 text-red-400'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full bg-current ${safetyMode ? 'animate-pulse' : ''}`} />
            Safety Mode: {safetyMode ? 'ON' : 'OFF'}
          </button>
          {/* Trigger / Schedule badge */}
          <button
            onClick={() => setIsWorkflowSettingsOpen(true)}
            title="Workflow Settings"
            className={`hidden items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold transition hover:opacity-90 sm:inline-flex ${
              workflowSchedule.triggerType !== 'manual' && workflowSchedule.scheduleEnabled
                ? 'border-violet-400/30 bg-violet-400/10 text-violet-300'
                : 'border-white/[0.1] bg-white/[0.04] text-muted'
            }`}
          >
            <span className="text-[10px]">{workflowSchedule.triggerType === 'manual' ? '▶' : workflowSchedule.triggerType === 'daily' ? '📅' : workflowSchedule.triggerType === 'weekly' ? '📆' : workflowSchedule.triggerType === 'file-upload' ? '📤' : workflowSchedule.triggerType === 'sheet-row' ? '📊' : '🔗'}</span>
            {getScheduleSummary()}
          </button>
          {/* Actions dropdown */}
          <div className="relative">
            <button
              onClick={() => setActionsMenuOpen((v) => !v)}
              className="rounded-lg border border-black/10 bg-[#ffffff] px-3 py-2 text-xs font-semibold text-ink transition hover:-translate-y-0.5 hover:border-black/25 hover:bg-surface2"
            >
              ⋯ Actions
            </button>
            {actionsMenuOpen && (
              <div
                className="absolute right-0 top-full z-[150] mt-1 w-52 rounded-[14px] border border-white/[0.1] bg-[#0e0e1a] py-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
                onMouseLeave={() => setActionsMenuOpen(false)}
              >
                {[
                  { icon: '✨', label: 'Build with AI', onClick: () => { setBuildWorkflowModal({ prompt: '', workflowType: 'reporting', complexity: 'Medium', industry: '', outputPreference: 'Balanced', safetyMode, generating: false, result: null }); setActionsMenuOpen(false); } },
                  { icon: '⬆', label: 'Improve Workflow', onClick: () => { openImproveWorkflow(); setActionsMenuOpen(false); } },
                  { icon: '💬', label: 'Explain Workflow', onClick: () => { openExplainWorkflow('Simple'); setActionsMenuOpen(false); } },
                  { icon: '🐛', label: 'Debug Workflow', onClick: () => { openDebugWorkflow(); setActionsMenuOpen(false); } },
                  { icon: '⭐', label: 'Quality Score', onClick: () => { openScoreWorkflow(); setActionsMenuOpen(false); } },
                  { icon: null, label: '──', onClick: () => {} },
                  { icon: '✓', label: 'Save Workflow', onClick: saveWorkflow },
                  { icon: '🔍', label: 'Check Workflow', onClick: () => { runDependencyCheck(); setActionsMenuOpen(false); } },
                  { icon: '🕘', label: 'Version History', onClick: () => { setActionsMenuOpen(false); if (usageState.currentPlan === 'free') { setUpgradeModal({ toPlan: 'pro', reason: 'pro-feature', featureName: 'Version History' }); } else { setIsVersionHistoryOpen(true); } } },
                  { icon: '⎘', label: 'Duplicate Workflow', onClick: () => { setIsDuplicateModalOpen(true); setActionsMenuOpen(false); } },
                  { icon: '📋', label: 'Save as Template', onClick: () => { setIsSaveTemplateModalOpen(true); setActionsMenuOpen(false); } },
                  { icon: null, label: '──', onClick: () => {} },
                  { icon: '🛡', label: 'Approval History', onClick: () => { setIsApprovalHistoryOpen(true); setActionsMenuOpen(false); } },
                  { icon: '⚖', label: 'Approval Rules', onClick: () => { setIsApprovalRulesOpen(true); setActionsMenuOpen(false); } },
                  { icon: '📋', label: 'Audit Log', onClick: () => { setIsAuditLogOpen(true); setActionsMenuOpen(false); } },
                  { icon: '📊', label: 'Run History', onClick: () => { setIsRunHistoryOpen(true); setActionsMenuOpen(false); } },
                  { icon: null, label: '──', onClick: () => {} },
                  { icon: '📑', label: 'Reports', onClick: () => { setIsReportListOpen(true); setActionsMenuOpen(false); } },
                  { icon: '🗓', label: 'Scheduled Reports', onClick: () => { setIsScheduledReportsOpen(true); setActionsMenuOpen(false); } },
                  { icon: null, label: '──', onClick: () => {} },
                  workflowMode === 'draft'
                    ? { icon: '🟢', label: 'Publish Workflow', onClick: () => { setPublishConfirmOpen(true); setActionsMenuOpen(false); } }
                    : { icon: '⬜', label: 'Move to Draft', onClick: () => { setUnpublishConfirmOpen(true); setActionsMenuOpen(false); } },
                  { icon: '⚙', label: 'Workflow Settings', onClick: () => { setIsWorkflowSettingsOpen(true); setActionsMenuOpen(false); } },
                ].map(({ icon, label, onClick }, i) =>
                  label === '──'
                    ? <div key={i} className="my-1 border-t border-white/[0.07]" />
                    : <button key={i} onClick={onClick}
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-[12px] font-medium text-white/70 transition hover:bg-white/[0.05] hover:text-white">
                        <span className="w-4 text-center text-[11px]">{icon}</span>{label}
                      </button>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => openAddAgentModal()}
            className="rounded-lg border border-black/10 bg-[#ffffff] px-3 py-2 text-xs font-semibold text-ink transition hover:-translate-y-0.5 hover:border-black/25 hover:bg-surface2"
          >
            + Add Agent
          </button>
          <button
            onClick={() => setIsWorkflowSettingsOpen(true)}
            title="Workflow Settings"
            className="hidden rounded-lg border border-black/10 bg-[#ffffff] px-3 py-2 text-xs font-semibold text-ink transition hover:-translate-y-0.5 hover:border-black/25 hover:bg-surface2 md:inline-flex"
          >
            ⚙ Settings
          </button>
          {/* Execution status badge */}
          {workflowExecution.status !== 'idle' && (
            <span className={`hidden items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold sm:inline-flex ${
              workflowExecution.status === 'running'  ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' :
              workflowExecution.status === 'paused'   ? 'border-amber-400/30 bg-amber-400/10 text-amber-300' :
              workflowExecution.status === 'stopped'  ? 'border-red-400/30 bg-red-400/10 text-red-300' :
              workflowExecution.status === 'waiting-approval' ? 'border-violet-400/30 bg-violet-400/10 text-violet-300' :
              workflowExecution.status === 'completed' ? 'border-sky-400/30 bg-sky-400/10 text-sky-300' :
              'border-white/[0.1] bg-white/[0.04] text-muted'
            }`}>
              {workflowExecution.status === 'running'  && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />}
              {workflowExecution.status === 'paused'   && '⏸'}
              {workflowExecution.status === 'stopped'  && '⏹'}
              {workflowExecution.status === 'waiting-approval' && '⏳'}
              {workflowExecution.status === 'completed' && '✓'}
              <span className="capitalize">{workflowExecution.status.replace('-', ' ')}</span>
            </span>
          )}
          {/* Pause button — visible while running */}
          {isWorkflowRunning && (
            <button
              onClick={pauseWorkflow}
              className="rounded-lg border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-300 transition hover:bg-amber-400/20"
            >
              ⏸ Pause
            </button>
          )}
          {/* Resume button — visible while paused */}
          {isWorkflowPaused && (
            <button
              onClick={resumeWorkflow}
              className="rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#1a1a2e]"
            >
              ▶ Resume
            </button>
          )}
          {/* Stop button — visible while running or paused */}
          {(isWorkflowRunning || isWorkflowPaused) && (
            <button
              onClick={stopWorkflow}
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/20"
            >
              ⏹ Stop
            </button>
          )}
          {/* File Processing Center button */}
          <button onClick={() => setIsFileProcessingOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.09] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/60 transition hover:bg-white/[0.08] hover:text-white/90">
            📁 <span className="hidden sm:inline">Files</span>
            {processedFiles.filter((f) => f.status === 'done').length > 0 && (
              <span className="grid h-4 w-4 place-items-center rounded-full bg-accent text-[8px] font-bold text-white">
                {processedFiles.filter((f) => f.status === 'done').length}
              </span>
            )}
          </button>
          {/* Data Pipeline button */}
          <button onClick={() => setIsDataPipelineOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.09] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/60 transition hover:bg-white/[0.08] hover:text-white/90">
            🔬 <span className="hidden sm:inline">Data</span>
            {dataPipelineState.validationIssues.filter(i => i.severity === 'error').length > 0 && (
              <span className="grid h-4 w-4 place-items-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                {dataPipelineState.validationIssues.filter(i => i.severity === 'error').length}
              </span>
            )}
          </button>
          {/* Run Workflow — hidden while running/paused */}
          {!isWorkflowRunning && !isWorkflowPaused && (
            <button onClick={openRunWorkflowPreview} className="rounded-lg bg-ink px-4 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#1a1a2e]">
              {glyph.play} Run Workflow
            </button>
          )}
        </div>
      </div>

      <div
        ref={canvasRef}
        className={`absolute inset-x-0 bottom-0 top-[52px] overflow-hidden ${tool === 'pan' || panState ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
        onContextMenu={handleCanvasContextMenu}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      >
        <div
          className="absolute left-0 top-0 h-[3000px] w-[4000px] origin-top-left will-change-transform"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            backgroundImage: 'radial-gradient(circle, var(--canvas-dot) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        >
          <svg className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
            <defs>
              <marker id="canvas-arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <path d="M0,0 L0,6 L9,3 z" fill="#0c0c14" opacity="0.5" />
              </marker>
              <marker id="canvas-arrow-active" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <path d="M0,0 L0,6 L9,3 z" fill="#16a34a" opacity="0.9" />
              </marker>
              <marker id="canvas-arrow-selected" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <path d="M0,0 L0,6 L9,3 z" fill="#4f9eff" opacity="1" />
              </marker>
              <marker id="canvas-arrow-warning" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <path d="M0,0 L0,6 L9,3 z" fill="#d97706" opacity="0.9" />
              </marker>
              <marker id="canvas-arrow-broken" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <path d="M0,0 L0,6 L9,3 z" fill="#ef4444" opacity="0.9" />
              </marker>
            </defs>
            {connections.map((connection, index) => {
              const from = agents.find((agent) => agent.id === connection.from);
              const to = agents.find((agent) => agent.id === connection.to);
              if (!from || !to) return null;
              const pathId = `conn-path-${index}`;
              const path = connectionPath(from, to);
              const isSelected = selectedConnectionId === connection.id;
              const connStatus = getConnectionStatus(connection);
              const midX = (from.x + AGENT_BODY.width + to.x) / 2;
              const midY = (from.y + AGENT_BODY.height / 2 + to.y + AGENT_BODY.height / 2) / 2 - 12;
              const strokeColor = isSelected ? '#4f9eff'
                : connStatus === 'broken'  ? '#ef4444'
                : connStatus === 'warning' ? '#d97706'
                : connection.active        ? '#16a34a'
                : '#0c0c14';
              const strokeOpacity = isSelected ? 1 : connStatus !== 'valid' ? 0.9 : connection.active ? 0.8 : 0.25;
              const strokeWidth  = isSelected ? 2.5 : connStatus !== 'valid' ? 2.2 : connection.active ? 2.5 : 1.8;
              const strokeDash   = (isSelected || (connStatus === 'valid' && connection.active)) ? undefined
                : connStatus === 'broken' ? '4 4'
                : connStatus === 'warning' ? '6 3'
                : '7 5';
              const markerEnd = isSelected ? 'url(#canvas-arrow-selected)'
                : connStatus === 'broken'  ? 'url(#canvas-arrow-broken)'
                : connStatus === 'warning' ? 'url(#canvas-arrow-warning)'
                : connection.active        ? 'url(#canvas-arrow-active)'
                : 'url(#canvas-arrow)';
              return (
                <React.Fragment key={connection.id}>
                  {/* Invisible wide hit area for clicking */}
                  <path
                    d={path}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={20}
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isSelected) {
                        setSelectedConnectionId('');
                      } else {
                        selectConnection(connection.id);
                      }
                    }}
                  />
                  {/* Selection glow underneath */}
                  {isSelected && (
                    <path d={path} fill="none" stroke="#4f9eff" strokeWidth={8} opacity={0.18} style={{ pointerEvents: 'none' }} />
                  )}
                  {/* Status glow for broken/warning */}
                  {!isSelected && connStatus !== 'valid' && (
                    <path d={path} fill="none" stroke={strokeColor} strokeWidth={6} opacity={0.12} style={{ pointerEvents: 'none' }} />
                  )}
                  <path
                    id={pathId}
                    d={path}
                    fill="none"
                    stroke={strokeColor}
                    strokeDasharray={strokeDash}
                    strokeWidth={strokeWidth}
                    opacity={strokeOpacity}
                    markerEnd={markerEnd}
                    className={`conn-path-enter ${(connStatus === 'valid' && (connection.active || isSelected)) ? '' : 'conn-path-flow'}`}
                    style={{ pointerEvents: 'none' }}
                  />
                  {/* Animated dot only for valid active connections */}
                  {connection.active && !isSelected && connStatus === 'valid' && (
                    <circle r="5" fill="#16a34a" opacity="0.9" style={{ filter: 'drop-shadow(0 0 4px #16a34a)', pointerEvents: 'none' }}>
                      <animateMotion dur="0.8s" repeatCount="indefinite">
                        <mpath href={`#${pathId}`} />
                      </animateMotion>
                    </circle>
                  )}
                  {/* Warning/broken badge near midpoint */}
                  {!isSelected && connStatus !== 'valid' && (
                    <g style={{ pointerEvents: 'none' }}>
                      <circle cx={midX} cy={midY - 8} r={9} fill={connStatus === 'broken' ? '#ef4444' : '#d97706'} opacity={0.92} />
                      <text x={midX} y={midY - 4} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" style={{ userSelect: 'none' }}>
                        {connStatus === 'broken' ? '!' : '!'}
                      </text>
                    </g>
                  )}
                  {/* Connection label */}
                  {connection.label && (
                    <text
                      x={midX}
                      y={midY + (connStatus !== 'valid' ? 12 : 0)}
                      textAnchor="middle"
                      fill={isSelected ? '#4f9eff' : connStatus === 'broken' ? '#ef4444' : connStatus === 'warning' ? '#d97706' : connection.active ? '#16a34a' : 'rgba(0,0,0,0.35)'}
                      fontSize="11"
                      fontWeight="600"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {connection.label}
                    </text>
                  )}
                </React.Fragment>
              );
            })}
            {/* Ghost connection line while dragging a new connection */}
            {connectFromId && ghostConnCursor && (() => {
              const fromAgent = agents.find((a) => a.id === connectFromId);
              if (!fromAgent) return null;
              const fx = fromAgent.x + AGENT_BODY.width;
              const fy = fromAgent.y + AGENT_BODY.height / 2;
              return (
                <g style={{ pointerEvents: 'none' }}>
                  <line
                    x1={fx} y1={fy}
                    x2={ghostConnCursor.x} y2={ghostConnCursor.y}
                    stroke="#4f9eff"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    opacity={0.75}
                  />
                  <circle cx={fx} cy={fy} r={4} fill="#4f9eff" opacity={0.95} />
                  <circle cx={ghostConnCursor.x} cy={ghostConnCursor.y} r={5} fill="#4f9eff" opacity={0.55} style={{ filter: 'drop-shadow(0 0 6px #4f9eff)' }} />
                </g>
              );
            })()}
          </svg>

          {canvasNotes.map((note) => (
            <div
              key={note.id}
              data-canvas-widget="note"
              className="absolute z-20 w-[180px] rounded-[14px] border border-amber-300/70 bg-[#f6e8a3] p-3 text-[#4f3614] shadow-[0_14px_30px_rgba(0,0,0,0.16)]"
              style={{ left: note.x, top: note.y }}
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                event.stopPropagation();
                const point = clientToBoard(event.clientX, event.clientY);
                setWidgetDragState({ type: 'note', id: note.id, offsetX: point.x - note.x, offsetY: point.y - note.y });
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em]">Sticky note</span>
                <button
                  onClick={() => setCanvasNotes((current) => current.filter((item) => item.id !== note.id))}
                  className="rounded-md px-1 text-[11px] font-bold text-[#7c5c1b] transition hover:bg-black/5"
                >
                  ×
                </button>
              </div>
              <p className="text-[13px] font-medium leading-relaxed">{note.text}</p>
            </div>
          ))}

          {canvasComments.map((comment) => (
            <div
              key={comment.id}
              data-canvas-widget="comment"
              className="absolute z-20 w-[210px] rounded-[14px] border border-white/[0.12] bg-[#13131e] p-3 text-white shadow-[0_14px_30px_rgba(0,0,0,0.24)]"
              style={{ left: comment.x, top: comment.y }}
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                event.stopPropagation();
                const point = clientToBoard(event.clientX, event.clientY);
                setWidgetDragState({ type: 'comment', id: comment.id, offsetX: point.x - comment.x, offsetY: point.y - comment.y });
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-white/[0.08] text-[11px] font-bold">C</span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/55">Comment</span>
                </div>
                <button
                  onClick={() => setCanvasComments((current) => current.filter((item) => item.id !== comment.id))}
                  className="rounded-md px-1 text-[11px] font-bold text-white/45 transition hover:bg-white/[0.05] hover:text-white"
                >
                  ×
                </button>
              </div>
              <p className="text-[13px] leading-relaxed text-white/80">{comment.text}</p>
            </div>
          ))}

          {selectionDrag && (
            <div
              className="pointer-events-none absolute z-20 rounded-[12px] border border-accent/70 bg-accent/12"
              style={{
                left: Math.min(clientToBoard(selectionDrag.startClientX, selectionDrag.startClientY).x, clientToBoard(selectionDrag.currentClientX, selectionDrag.currentClientY).x),
                top: Math.min(clientToBoard(selectionDrag.startClientX, selectionDrag.startClientY).y, clientToBoard(selectionDrag.currentClientX, selectionDrag.currentClientY).y),
                width: Math.abs(clientToBoard(selectionDrag.currentClientX, selectionDrag.currentClientY).x - clientToBoard(selectionDrag.startClientX, selectionDrag.startClientY).x),
                height: Math.abs(clientToBoard(selectionDrag.currentClientX, selectionDrag.currentClientY).y - clientToBoard(selectionDrag.startClientX, selectionDrag.startClientY).y),
              }}
            />
          )}

          {agents.map((agent) => {
            const isSelected = selectedAgentIds.includes(agent.id);
            const isDragging = dragState?.id === agent.id;
            const bubble = bubbles[agent.id];
            return (
              <div
                key={agent.id}
                className={`agent-node agent-node-appear absolute z-10 flex w-[140px] select-none flex-col items-center transition-[filter,opacity] duration-150 ${agent.status === 'running' ? 'running' : ''} ${agent.status === 'waiting' ? 'waiting' : ''} ${connectFromId === agent.id ? 'connecting-from' : ''} ${isDragging ? 'dragging z-30 opacity-95 drop-shadow-[0_20px_34px_rgba(0,0,0,0.24)]' : 'hover:drop-shadow-[0_12px_26px_rgba(0,0,0,0.16)]'}`}
                style={{ left: agent.x, top: agent.y }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  selectSingleAgent(agent.id);
                  setChatContextMenu({ x: e.clientX, y: e.clientY, target: 'agent', id: agent.id });
                }}
                onPointerDown={(event) => {
                  if (event.button !== 0 || tool === 'pan') return;
                  event.stopPropagation();
                  if (event.shiftKey) {
                    toggleAgentSelection(agent.id);
                    return;
                  }
                  selectSingleAgent(agent.id);
                  if (tool === 'connect') {
                    startConnection(agent.id);
                    return;
                  }
                  const point = clientToBoard(event.clientX, event.clientY);
                  setDragState({ id: agent.id, offsetX: point.x - agent.x, offsetY: point.y - agent.y });
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
              >
                <div className={`speech-bubble ${bubble?.visible ? 'show' : ''}`}>
                  <span className="bubble-text">{bubble?.text}</span>
                </div>
                <div
                  className={`agent-body relative grid h-[100px] w-[100px] place-items-center rounded-[20px] border-[1.5px] shadow-[0_2px_8px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-150 ${isSelected ? 'outline outline-[2.5px] outline-offset-4 outline-accent shadow-[0_0_0_6px_rgba(79,158,255,0.16)]' : ''} ${isDragging ? 'scale-105 shadow-[0_16px_40px_rgba(0,0,0,0.2)]' : 'hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]'}`}
                  style={{ borderColor: `${agent.color}66`, borderTop: `3px solid ${agent.color}` }}
                >
                  <AgentSpriteCanvas type={agent.type} status={agent.status} index={agents.findIndex((item) => item.id === agent.id)} />
                  <span className="absolute bottom-2 rounded-full bg-black/[0.06] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted">
                    {agent.role.split(' ')[0]}
                  </span>
                  {/* Missing input warning badge */}
                  {!agent.disabled && !SOURCE_AGENT_TYPES.includes(agent.type as CanvasAgentType) && agents.length > 1 && !connections.some((c) => c.to === agent.id) && (
                    <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border border-amber-400/40 bg-amber-400 text-[9px] font-bold text-white shadow-[0_2px_6px_rgba(217,119,6,0.4)]" title="No input source">!</span>
                  )}
                  {/* Approval required badge */}
                  {agent.stepApproval?.requiresApproval && (
                    <span className="absolute -left-1 -top-1 flex items-center gap-0.5 rounded-full border border-orange-400/30 bg-orange-500 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white shadow-[0_2px_6px_rgba(234,88,12,0.4)]" title="Approval required">✓?</span>
                  )}
                  {(['right', 'left', 'bottom', 'top'] as const).map((side) => (
                    <button
                      key={side}
                      type="button"
                      aria-label={`Connect from ${agent.label}`}
                      className={`connect-handle ${side}`}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        startConnection(agent.id);
                      }}
                    />
                  ))}
                </div>
                <p className="mt-2 max-w-[120px] text-center text-xs font-bold leading-tight text-ink">{agent.label}</p>
                <SkillModelPills skills={agent.agentSkills ?? agent.skills} activeModel={agent.activeModel} compact />
                <p
                  className={`mt-1 flex items-center gap-1 text-[10px] font-medium ${
                    agent.disabled ? 'text-muted/50' :
                    agent.status === 'running' ? 'text-[#16a34a]' :
                    agent.status === 'waiting' ? 'text-[#d97706]' :
                    agent.status === 'done' ? 'text-blue-500' :
                    agent.status === 'failed' ? 'text-red-400' :
                    'text-muted'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full bg-current ${agent.status === 'running' ? 'animate-pulse' : ''}`} />
                  {agent.disabled ? 'Disabled' :
                   agent.status === 'running' ? 'Running...' :
                   agent.status === 'waiting' ? 'Waiting' :
                   agent.status === 'done' ? 'Done' :
                   agent.status === 'failed' ? 'Failed' :
                   'Idle'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className={`absolute top-[84px] z-40 flex flex-col gap-2 ${(selectedAgent || selectedConnectionId) ? 'right-[320px]' : 'right-5'}`}>
        {[
          { label: 'Add agent', icon: '+', onClick: () => openAddAgentModal() },
          { label: 'Canvas actions', icon: <Search className="h-3.5 w-3.5" />, onClick: openCenteredCanvasCommandMenu },
          { label: 'Add sticky note', icon: <StickyNote className="h-3.5 w-3.5" />, onClick: () => { const center = getCanvasViewportCenterBoard(); addStickyNoteAt(center.x, center.y); } },
          { label: 'Fit view', icon: '⌖', onClick: () => { zoomFit(); setToast('Fit to view'); } },
          { label: 'Toggle minimap', icon: <Menu className="h-3.5 w-3.5" />, onClick: () => setShowMinimap((current) => !current) },
        ].map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            title={item.label}
            className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] bg-[#13131e]/92 text-sm font-bold text-white/75 shadow-[0_10px_24px_rgba(0,0,0,0.24)] backdrop-blur transition hover:border-white/[0.14] hover:bg-[#0c0c14] hover:text-white"
          >
            {item.icon}
          </button>
        ))}
      </div>

      <div className="absolute bottom-5 right-5 z-40 flex flex-col gap-1">
        <button onClick={() => setZoom((value) => clamp(value * 1.18, 0.28, 2.4))} className="grid h-[34px] w-[34px] place-items-center rounded-lg border border-black/10 bg-white/95 text-lg text-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.08)] backdrop-blur transition hover:bg-ink hover:text-white">
          +
        </button>
        <button onClick={zoomFit} className="grid h-[34px] w-[34px] place-items-center rounded-lg border border-black/10 bg-white/95 text-sm text-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.08)] backdrop-blur transition hover:bg-ink hover:text-white">
          {'\u22A1'}
        </button>
        <button onClick={() => setZoom((value) => clamp(value / 1.18, 0.28, 2.4))} className="grid h-[34px] w-[34px] place-items-center rounded-lg border border-black/10 bg-white/95 text-lg text-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.08)] backdrop-blur transition hover:bg-ink hover:text-white">
          -
        </button>
      </div>

      {showMinimap && (
      <div className={`absolute bottom-[130px] z-40 h-[90px] w-[140px] overflow-hidden rounded-[10px] border border-black/10 bg-white/90 p-2 shadow-[0_2px_12px_rgba(0,0,0,0.08)] backdrop-blur ${(selectedAgent || selectedConnectionId) ? 'right-[315px]' : 'right-5'}`}>
        <div className="relative h-full w-full rounded-md bg-[#f5f4f0]" style={{ backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)', backgroundSize: '8px 8px' }}>
          {connections.map((connection) => {
            const from = agents.find((agent) => agent.id === connection.from);
            const to = agents.find((agent) => agent.id === connection.to);
            if (!from || !to) return null;
            return (
              <svg key={`mini-${connection.from}-${connection.to}`} className="absolute inset-0 h-full w-full">
                <line
                  x1={`${((from.x + AGENT_CARD.width / 2) / BOARD_SIZE.width) * 100}%`}
                  y1={`${((from.y + AGENT_CARD.height / 2) / BOARD_SIZE.height) * 100}%`}
                  x2={`${((to.x + AGENT_CARD.width / 2) / BOARD_SIZE.width) * 100}%`}
                  y2={`${((to.y + AGENT_CARD.height / 2) / BOARD_SIZE.height) * 100}%`}
                  stroke={connection.active ? '#16a34a' : 'rgba(0,0,0,0.2)'}
                  strokeWidth="1"
                />
              </svg>
            );
          })}
          {agents.map((agent) => (
            <span
              key={`mini-${agent.id}`}
              className="absolute h-1.5 w-1.5 rounded-sm"
              style={{
                left: `${(agent.x / BOARD_SIZE.width) * 100}%`,
                top: `${(agent.y / BOARD_SIZE.height) * 100}%`,
                backgroundColor: agent.color,
              }}
            />
          ))}
        </div>
      </div>
      )}

      {selectionCount > 1 && (
        <div className="absolute left-1/2 top-[68px] z-40 -translate-x-1/2 rounded-[14px] border border-white/[0.08] bg-[#13131e]/94 px-4 py-3 text-white shadow-[0_16px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold">{selectionCount} agents selected</span>
            <button
              onClick={() => {
                if (selectionCount >= agents.length) {
                  setToast('At least one agent must remain in the workflow');
                  return;
                }
                setIsBulkDeleteOpen(true);
              }}
              className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-bold text-red-300 transition hover:bg-red-500/20"
            >
              Delete
            </button>
            <button
              onClick={duplicateSelectedAgents}
              className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-white/80 transition hover:bg-white/[0.1] hover:text-white"
            >
              Duplicate
            </button>
            <button
              onClick={clearCanvasSelection}
              className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-white/65 transition hover:bg-white/[0.1] hover:text-white"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {chatCollapsed ? (
        /* ── Collapsed bubble ── */
        <div className="absolute bottom-6 left-6 z-40">
          <button
            onClick={() => { setChatCollapsed(false); setUnreadCount(0); }}
            className="relative flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-[#0c0c14] shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-200 hover:scale-105 hover:border-white/25"
            title="Open AI Team Chat"
          >
            <span className="text-xl">{activeChatServer.icon}</span>
            <span className="absolute bottom-0.5 right-0.5 h-3 w-3 animate-pulse rounded-full border-2 border-[#0c0c14] bg-green-500" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      ) : (
        /* ── Expanded 3-column chat window ── */
        <div
          className="group absolute bottom-6 left-6 z-40 flex flex-col overflow-hidden rounded-[20px] border border-white/[0.1] bg-[#0c0c14]/98 shadow-[0_18px_60px_rgba(0,0,0,0.58)] ring-1 ring-white/[0.03] backdrop-blur-xl"
          style={{ width: chatSize.width, height: chatSize.height }}
        >

          {/* ─ Header ─ */}
          <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] bg-white/[0.03] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.07] text-base">
                {activeChatServer.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading text-[13px] font-bold text-white">AI Team Chat</span>
                  <span className="text-white/35">·</span>
                  <span className="max-w-[180px] truncate text-[11px] text-white/65">{activeProject.name}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-semibold text-white/60">
                  <span>Server: {activeChatServer.name}</span>
                  <span className="text-white/35">/</span>
                  <span>#{activeChatChannel?.name}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={resetChatWindowSize}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-white/50 transition hover:bg-white/[0.12] hover:text-white"
                title="Reset size"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={toggleChatMaximize}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-white/50 transition hover:bg-white/[0.12] hover:text-white"
                title={chatWindowMode === 'maximized' ? 'Restore window' : 'Expand window'}
              >
                {chatWindowMode === 'maximized' ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => setChatCollapsed(true)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.07] text-white/60 transition hover:bg-white/[0.15] hover:text-white"
                title="Minimize"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* ─ Body: 3 columns ─ */}
          <div className="flex min-h-0 flex-1">

            {/* ── Column 1: Project / server sidebar ── */}
            <div className="flex w-[58px] shrink-0 flex-col items-center gap-1.5 overflow-y-auto border-r border-white/[0.06] bg-[#07070e] py-3">
              <span className="mb-1 text-[8px] font-bold uppercase tracking-[0.14em] text-white/45">Servers</span>
              {chatServers.map((server) => (
                <div key={server.id} className="relative w-full flex justify-center">
                  {activeChatServerId === server.id && (
                    <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-white/80" />
                  )}
                  <button
                    onClick={() => selectChatServer(server.id)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setChatContextMenu({ x: e.clientX, y: e.clientY, target: 'server', id: server.id });
                    }}
                    title={server.name}
                    className={`relative flex h-10 w-10 items-center justify-center text-lg transition-all duration-150 ${
                      activeChatServerId === server.id
                        ? 'rounded-[14px] bg-white/[0.14] ring-1 ring-white/10'
                        : 'rounded-full bg-white/[0.06] hover:rounded-[14px] hover:bg-white/[0.11]'
                    }`}
                  >
                    {server.icon}
                    {server.instructions && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[#07070e] bg-accent/70" title="Server instructions active" />
                    )}
                  </button>
                </div>
              ))}
              <div className="my-1 h-px w-7 shrink-0 bg-white/[0.08]" />
              <button
                onClick={() => {
                  const now = new Date();
                  const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                  const newId = `server-${Date.now()}`;
                  const newServer: ChatServer = {
                    id: newId,
                    name: 'New Server',
                    icon: '💬',
                    channels: [{ id: 'team-room', name: 'team-room', type: 'main' }],
                    messages: { 'team-room': [{ role: 'agent', sender: 'System', text: 'New server created. Right-click to rename or add instructions.', timestamp: ts }] },
                  };
                  setChatServers((prev) => [...prev, newServer]);
                  selectChatServer(newId);
                }}
                title="Add new server"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.05] text-lg text-white/30 transition hover:rounded-[14px] hover:bg-white/[0.1] hover:text-white/60"
              >
                ＋
              </button>
            </div>

            {/* ── Column 2: Channels + agents ── */}
            <div className="flex w-[172px] shrink-0 flex-col overflow-y-auto border-r border-white/[0.07]">
              <div className="border-b border-white/[0.06] px-3 py-3">
                <p className="truncate text-[11px] font-bold text-white/90">{activeChatServer?.name}</p>
                <p className="mt-0.5 truncate text-[9px] font-semibold text-white/50">{activeProject.name}</p>
                {activeChatServer?.instructions && (
                  <p className="mt-1 flex items-center gap-1 text-[9px] text-accent/70">
                    <span>●</span> Server instructions active
                  </p>
                )}
              </div>

              {/* Channels */}
              <div className="pt-3">
                <div className="mb-1.5 flex items-center justify-between px-3">
                  <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/50">Channels</span>
                  <button
                    onClick={() => {
                      if (!activeChatServer) return;
                      const now = new Date();
                      const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                      const newId = `ch-${Date.now()}`;
                      setChatServers((prev) => prev.map((s) =>
                        s.id === activeChatServerId
                          ? {
                              ...s,
                              channels: [...s.channels, { id: newId, name: 'new-channel', type: 'main' }],
                              messages: { ...s.messages, [newId]: [{ role: 'agent', sender: 'System', text: 'New channel created. Right-click to rename.', timestamp: ts }] },
                            }
                          : s
                      ));
                      addSystemMessage('New channel created');
                    }}
                    className="text-[11px] text-white/40 transition hover:text-white/70"
                    title="Add channel"
                  >＋</button>
                </div>
                {activeChatServer?.channels.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => selectChatChannel(ch.id)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setChatContextMenu({ x: e.clientX, y: e.clientY, target: 'channel', id: ch.id, serverId: activeChatServerId });
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-[7px] text-left transition-colors ${
                      activeChatChannelId === ch.id
                        ? 'bg-white/[0.12] text-white'
                        : ch.unread ? 'font-bold text-white/90 hover:bg-white/[0.06]' : 'text-white/60 hover:bg-white/[0.06] hover:text-white/85'
                    }`}
                  >
                    <span className="text-[11px] font-bold text-white/45">#</span>
                    <span className="flex-1 truncate text-[11px] font-semibold">{ch.name}</span>
                    {ch.unread && ch.unread > 0 && activeChatChannelId !== ch.id && (
                      <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent/80 px-1 text-[9px] font-bold text-white">
                        {ch.unread > 9 ? '9+' : ch.unread}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Agents */}
              <div className="mt-4">
                <div className="mb-1.5 px-3">
                  <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/50">Agents — {agents.length}</span>
                </div>
                {agents.map((agent) => (
                  <button
                    key={`chan-${agent.id}`}
                    onClick={() => selectSingleAgent(agent.id)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      selectSingleAgent(agent.id);
                      setChatContextMenu({ x: e.clientX, y: e.clientY, target: 'agent', id: agent.id });
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-[8px] text-left transition-colors ${
                      selectedAgentIds.includes(agent.id)
                        ? 'bg-white/[0.12] text-white'
                        : 'text-white/60 hover:bg-white/[0.06] hover:text-white/85'
                    }`}
                  >
                    <span className="relative shrink-0">
                      <span className="text-sm leading-none">{agent.icon}</span>
                      <span className={`absolute -bottom-px -right-px h-2 w-2 rounded-full border border-[#0c0c14] ${
                        agent.status === 'running' ? 'animate-pulse bg-green-500' :
                        agent.status === 'done' ? 'bg-blue-400' :
                        agent.status === 'waiting' ? 'bg-amber-400' :
                        agent.status === 'failed' ? 'bg-red-400' :
                        agent.disabled ? 'bg-white/10' :
                        'bg-white/20'
                      }`} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-semibold leading-tight">{agent.label}</span>
                      <span className={`block text-[9px] leading-tight ${
                        agent.status === 'running' ? 'text-green-400' :
                        agent.status === 'waiting' ? 'text-amber-400' :
                        agent.status === 'done' ? 'text-blue-400' :
                        agent.status === 'failed' ? 'text-red-400' :
                        agent.disabled ? 'text-white/25' :
                        'text-white/40'
                      }`}>{agent.disabled ? 'disabled' : agent.status === 'waiting' ? 'approval' : agent.status === 'failed' ? 'error' : agent.status}</span>
                    </div>
                    {agent.instructions && <span className="shrink-0 text-[7px] text-accent/50">●</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Column 3: Main chat area ── */}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

              {/* Channel / agent sub-header */}
              <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
                <span className="text-xs font-bold text-white/50">#</span>
                <span className="text-xs font-semibold text-white/80">{activeChatChannel?.name}</span>
                <span className="ml-2 rounded bg-white/[0.08] px-1.5 py-0.5 text-[9px] font-bold text-white/55">{activeChatServer?.name}</span>
                {activeProject.instructions && (
                  <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[9px] font-bold text-accent/70" title={activeProject.instructions}>
                    Project instructions active
                  </span>
                )}
                <div className="ml-auto flex items-center gap-1">
                  <button
                    onClick={() => setChatPinnedOpen((v) => !v)}
                    className={`flex h-6 w-6 items-center justify-center rounded-md text-[11px] transition hover:bg-white/[0.1] ${chatPinnedOpen ? 'bg-white/[0.12] text-white' : 'text-white/45'}`}
                    title="Pinned messages"
                  >📌</button>
                  <button
                    onClick={() => { setChatSearchOpen((v) => !v); setChatSearchQuery(''); }}
                    className={`flex h-6 w-6 items-center justify-center rounded-md text-[11px] transition hover:bg-white/[0.1] ${chatSearchOpen ? 'bg-white/[0.12] text-white' : 'text-white/45'}`}
                    title="Search messages"
                  >🔍</button>
                  {activeChatServer?.memoryEnabled !== undefined && (
                    <button
                      onClick={() => setChatMemoryOpen((v) => !v)}
                      className={`flex h-6 w-6 items-center justify-center rounded-md text-[11px] transition hover:bg-white/[0.1] ${chatMemoryOpen ? 'bg-white/[0.12] text-white' : 'text-white/45'}`}
                      title="Chat memory"
                    >🧠</button>
                  )}
                  <span className="ml-1 text-[10px] text-white/35">{chatMessages.length}</span>
                </div>
              </div>

              {/* Search drawer */}
              {chatSearchOpen && (
                <div className="shrink-0 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-white/40">🔍</span>
                    <input
                      autoFocus
                      value={chatSearchQuery}
                      onChange={(e) => setChatSearchQuery(e.target.value)}
                      placeholder="Search messages…"
                      className="flex-1 bg-transparent text-[12px] text-white outline-none placeholder:text-white/35"
                    />
                    {chatSearchQuery && (
                      <span className="text-[10px] text-white/40">
                        {(() => {
                          const q = chatSearchQuery.toLowerCase();
                          const allMsgs = Object.values(activeChatServer?.messages ?? {}).flat();
                          return `${allMsgs.filter((m) => m.text.toLowerCase().includes(q)).length} results`;
                        })()}
                      </span>
                    )}
                    <button onClick={() => setChatSearchOpen(false)} className="text-[10px] text-white/35 hover:text-white/60">✕</button>
                  </div>
                  {chatSearchQuery && (
                    <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                      {(() => {
                        const q = chatSearchQuery.toLowerCase();
                        const allMsgs = Object.values(activeChatServer?.messages ?? {}).flat();
                        return allMsgs
                          .filter((m) => m.text.toLowerCase().includes(q))
                          .slice(0, 20)
                          .map((m, i) => (
                            <div key={i} className="rounded-lg bg-white/[0.05] px-3 py-2">
                              <div className="mb-0.5 flex items-center gap-2">
                                <span className="text-[10px] font-bold text-white/60">{m.sender ?? (m.role === 'user' ? 'You' : 'Agent')}</span>
                                <span className="text-[9px] text-white/30">{m.timestamp}</span>
                              </div>
                              <p className="text-[11px] leading-relaxed text-white/70">
                                {m.text.split(new RegExp(`(${chatSearchQuery})`, 'gi')).map((part, j) =>
                                  part.toLowerCase() === chatSearchQuery.toLowerCase()
                                    ? <mark key={j} className="rounded bg-amber-400/25 text-amber-300">{part}</mark>
                                    : part
                                )}
                              </p>
                            </div>
                          ));
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Pinned messages drawer */}
              {chatPinnedOpen && (
                <div className="shrink-0 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-white/70">📌 Pinned Messages</span>
                    <button onClick={() => setChatPinnedOpen(false)} className="text-[10px] text-white/35 hover:text-white/60">✕</button>
                  </div>
                  {(() => {
                    const pinned = Object.values(activeChatServer?.messages ?? {}).flat().filter((m) => m.pinned);
                    if (!pinned.length) return <p className="text-[11px] text-white/35 italic">No pinned messages in this server.</p>;
                    return (
                      <div className="max-h-40 space-y-1.5 overflow-y-auto">
                        {pinned.map((m, i) => (
                          <div key={i} className="flex items-start gap-2 rounded-lg bg-amber-400/[0.06] px-3 py-2 border border-amber-400/10">
                            <span className="mt-0.5 shrink-0 text-[10px]">📌</span>
                            <div className="min-w-0">
                              <div className="mb-0.5 flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-white/65">{m.sender ?? 'Agent'}</span>
                                <span className="text-[9px] text-white/30">{m.timestamp}</span>
                              </div>
                              <p className="truncate text-[11px] text-white/70">{m.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Memory modal */}
              {chatMemoryOpen && (
                <div className="shrink-0 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-white/70">🧠 Chat Memory</span>
                      <button
                        onClick={() => {
                          setChatServers((prev) => prev.map((s) => s.id !== activeChatServerId ? s : { ...s, memoryEnabled: !s.memoryEnabled }));
                        }}
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold transition ${activeChatServer?.memoryEnabled ? 'bg-green-500/20 text-green-400' : 'bg-white/[0.08] text-white/40'}`}
                      >
                        {activeChatServer?.memoryEnabled ? 'ON' : 'OFF'}
                      </button>
                    </div>
                    <button onClick={() => setChatMemoryOpen(false)} className="text-[10px] text-white/35 hover:text-white/60">✕</button>
                  </div>
                  <div className="mb-2 max-h-32 space-y-1 overflow-y-auto">
                    {(activeChatServer?.memories ?? []).length === 0
                      ? <p className="text-[11px] text-white/35 italic">No memories saved for this server.</p>
                      : (activeChatServer?.memories ?? []).map((mem) => (
                          <div key={mem.id} className="flex items-start justify-between gap-2 rounded-lg bg-white/[0.05] px-3 py-2">
                            <p className="min-w-0 flex-1 text-[11px] text-white/70">{mem.text}</p>
                            <button
                              onClick={() => setChatServers((prev) => prev.map((s) => s.id !== activeChatServerId ? s : { ...s, memories: (s.memories ?? []).filter((m) => m.id !== mem.id) }))}
                              className="shrink-0 text-[10px] text-white/30 transition hover:text-red-400"
                            >✕</button>
                          </div>
                        ))
                    }
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      value={chatMemoryInput}
                      onChange={(e) => setChatMemoryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && chatMemoryInput.trim()) {
                          const newMem: ChatMemoryItem = { id: `mem-${Date.now()}`, text: chatMemoryInput.trim(), createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
                          setChatServers((prev) => prev.map((s) => s.id !== activeChatServerId ? s : { ...s, memories: [...(s.memories ?? []), newMem] }));
                          setChatMemoryInput('');
                        }
                      }}
                      placeholder="Add a memory…"
                      className="flex-1 rounded-lg border border-white/[0.12] bg-white/[0.05] px-3 py-1.5 text-[11px] text-white outline-none placeholder:text-white/30"
                    />
                    <button
                      onClick={() => {
                        if (!chatMemoryInput.trim()) return;
                        const newMem: ChatMemoryItem = { id: `mem-${Date.now()}`, text: chatMemoryInput.trim(), createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
                        setChatServers((prev) => prev.map((s) => s.id !== activeChatServerId ? s : { ...s, memories: [...(s.memories ?? []), newMem] }));
                        setChatMemoryInput('');
                      }}
                      className="rounded-lg bg-accent/80 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-accent"
                    >Save</button>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div ref={chatScrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {chatMessages.map((msg, index) => {
                  const msgAgent = agents.find((a) => a.id === msg.agentId);
                  const isSystem = msg.type === 'system' || msg.type === 'log';
                  const isCommand = msg.type === 'command';
                  const isApproval = msg.type === 'approval';
                  const isReport = msg.type === 'report';
                  if (isSystem) {
                    return (
                      <div key={`msg-${index}`} className="flex items-center gap-2 py-0.5">
                        <div className="h-px flex-1 bg-white/[0.06]" />
                        <span className="text-[10px] italic text-white/35">{msg.text}</span>
                        <div className="h-px flex-1 bg-white/[0.06]" />
                      </div>
                    );
                  }
                  const highlightMentions = (text: string) =>
                    text.split(/(@[\w\s]+?)(?=\s|$|[^a-zA-Z0-9\s])/g).map((part, i) =>
                      part.startsWith('@')
                        ? <span key={i} className="font-bold text-accent/90">{part}</span>
                        : part
                    );
                  return (
                    <div key={`msg-${index}`} className={`group flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${msg.role === 'user' ? 'bg-white/15' : 'bg-white/[0.07]'}`}>
                        {msg.role === 'user' ? '👤' : (msgAgent?.icon ?? '🤖')}
                      </div>
                      <div className={`flex min-w-0 max-w-[80%] flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`mb-1 flex items-center gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          <span className="text-[11px] font-bold text-white/65">{msg.role === 'user' ? 'You' : (msg.sender ?? 'Agent')}</span>
                          <span className="text-[10px] text-white/25">{msg.timestamp}</span>
                          {msg.pinned && <span className="text-[9px] text-amber-400/70" title="Pinned">📌</span>}
                          {msg.role === 'agent' && msgAgent && (
                            <span className={`rounded px-1 py-px text-[9px] font-bold leading-none ${
                              msgAgent.status === 'running' ? 'bg-green-500/15 text-green-400' :
                              msgAgent.status === 'waiting' ? 'bg-amber-500/15 text-amber-400' :
                              msgAgent.status === 'done' ? 'bg-blue-500/15 text-blue-400' : 'bg-white/[0.07] text-white/30'
                            }`}>{msgAgent.status === 'waiting' ? 'approval' : msgAgent.status}</span>
                          )}
                          <button
                            onClick={() => {
                              setChatServers((prev) => prev.map((s) => s.id !== activeChatServerId ? s : {
                                ...s,
                                messages: Object.fromEntries(Object.entries(s.messages).map(([chId, msgs]) => [chId, msgs.map((m, mi) => mi === index ? { ...m, pinned: !m.pinned } : m)])),
                              }));
                            }}
                            className="hidden text-[9px] text-white/30 transition hover:text-amber-400/70 group-hover:block"
                            title="Pin message"
                          >📌</button>
                        </div>
                        <div className={`rounded-[12px] px-3.5 py-2.5 text-[12.5px] leading-relaxed ${
                          msg.role === 'user'
                            ? 'rounded-tr-[4px] bg-white text-ink'
                            : isCommand
                              ? 'rounded-tl-[4px] border border-accent/30 bg-accent/[0.07] text-white/80'
                              : isReport
                                ? 'rounded-tl-[4px] border border-blue-500/25 bg-blue-500/[0.07] text-white/80'
                                : isApproval
                                  ? 'rounded-tl-[4px] border border-orange-400/25 bg-orange-400/[0.06] text-white/80'
                                  : 'rounded-tl-[4px] bg-white/[0.08] text-white/80'
                        }`}>
                          {highlightMentions(msg.text)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {typingLabel && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-sm">
                      {agents.find((a) => a.label === typingLabel)?.icon ?? '🤖'}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="mb-1 text-[11px] font-bold text-white/75">{typingLabel} <span className="font-normal text-white/45">is typing…</span></span>
                      <div className="flex items-center gap-1 rounded-[12px] rounded-tl-[4px] bg-white/[0.08] px-3.5 py-3">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40" style={{ animationDelay: '0ms' }} />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40" style={{ animationDelay: '160ms' }} />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40" style={{ animationDelay: '320ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Command confirm card */}
              {chatCommandConfirm && (
                <div className="mx-4 mb-2 rounded-xl border border-accent/30 bg-accent/[0.07] px-4 py-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-accent">⚡ Workflow Command</span>
                  </div>
                  <p className="mb-3 text-[11px] text-white/80">{chatCommandConfirm.description}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { chatCommandConfirm.action(); setChatCommandConfirm(null); }}
                      className="flex-1 rounded-lg bg-accent/80 py-1.5 text-[11px] font-bold text-white transition hover:bg-accent"
                    >Apply Change</button>
                    <button
                      onClick={() => setChatCommandConfirm(null)}
                      className="flex-1 rounded-lg border border-white/10 py-1.5 text-[11px] font-bold text-white/55 transition hover:bg-white/[0.06] hover:text-white/80"
                    >Cancel</button>
                  </div>
                </div>
              )}

              {/* Quick-action chips */}
              <div className="flex shrink-0 flex-wrap gap-1.5 px-4 pt-2">
                {[
                  ['▶ Run Workflow', 'run workflow'],
                  ['▶ Run Test', 'run test'],
                  ['Ask Analyst', 'Status of Sales Analyst?'],
                  ['Explain', 'Explain this workflow'],
                  ['Check Workflow', 'check workflow'],
                  ['Summarize', 'summarize'],
                  ['Show Logs', 'show logs'],
                  ['Create Report', 'create report'],
                ].map(([label, message]) => (
                  <button
                    key={label}
                    onClick={() => sendTeamChat(message)}
                    className="rounded-full border border-white/[0.14] bg-white/[0.06] px-3 py-1 text-[10px] font-semibold text-white/65 transition hover:border-white/25 hover:bg-white/[0.12] hover:text-white/90"
                  >
                    {label}
                  </button>
                ))}
                <button
                  onClick={() => setServerModal({ type: 'project-instructions', currentInstructions: activeProject.instructions ?? '', projectName: activeProject.name })}
                  className="rounded-full border border-accent/30 bg-accent/8 px-3 py-1 text-[10px] font-semibold text-accent/80 transition hover:border-accent/50 hover:bg-accent/15 hover:text-accent"
                  title="Edit project instructions"
                >
                  📋 Instructions
                </button>
              </div>

              {/* Approval action bar (shown after workflow run) */}
              {/* Legacy simple approval banner */}
              {approvalPending && (
                <div className="mx-4 mb-2 flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                  <span className="flex-1 text-[11px] font-semibold text-amber-300">Report ready — awaiting approval</span>
                  <button
                    onClick={() => {
                      setApprovalPending(false);
                      const now = new Date();
                      const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                      setChatMessages((current) => [...current, { role: 'agent', sender: '✅ System', text: 'Report approved. Sending now. Workflow complete.', timestamp: ts }]);
                      setAgents((prev) => prev.map((a) => ({ ...a, status: 'done' })));
                    }}
                    className="rounded-lg bg-green-500/80 px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-green-500"
                  >
                    Approve Report
                  </button>
                  <button
                    onClick={() => {
                      setApprovalPending(false);
                      addSystemMessage('Report rejected. Agents standing by for changes.');
                    }}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-[10px] font-bold text-white/50 transition hover:bg-white/[0.06] hover:text-white/80"
                  >
                    Reject
                  </button>
                </div>
              )}

              {/* Approval Request Cards */}
              {approvalRequests.length > 0 && (
                <div className="mx-4 mb-3 space-y-2">
                  {approvalRequests.map((req) => (
                    <div key={req.id} className="rounded-2xl border border-orange-400/25 bg-[#1a120a] px-4 py-3">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400" />
                            <span className="text-[10px] font-bold uppercase tracking-wide text-orange-400">Review before AI acts</span>
                            <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${req.riskLevel === 'High' ? 'bg-red-400/15 text-red-400' : req.riskLevel === 'Medium' ? 'bg-amber-400/15 text-amber-400' : 'bg-green-400/15 text-green-400'}`}>{req.riskLevel} risk</span>
                          </div>
                          <p className="text-[12px] font-semibold text-white">{req.title}</p>
                          <p className="mt-0.5 text-[10px] text-white/50">{req.agentName} · {req.actionType} · {req.createdAt}</p>
                        </div>
                        <button onClick={() => setApprovalCardId(req.id)} className="shrink-0 rounded-lg border border-white/10 px-2 py-1 text-[10px] text-white/50 transition hover:bg-white/[0.06] hover:text-white">Details</button>
                      </div>
                      <p className="mb-3 text-[11px] leading-relaxed text-white/70">{req.summary}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => resolveApproval(req.id, 'Approved')}
                          className="flex-1 rounded-xl bg-green-500/80 py-1.5 text-[11px] font-bold text-white transition hover:bg-green-500"
                        >Approve</button>
                        <button
                          onClick={() => { setEditApprovalPreview({ id: req.id, content: req.previewContent }); }}
                          className="flex-1 rounded-xl border border-white/10 py-1.5 text-[11px] font-bold text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                        >Edit</button>
                        <button
                          onClick={() => setRejectReasonModal({ id: req.id, reason: '' })}
                          className="flex-1 rounded-xl border border-red-500/25 py-1.5 text-[11px] font-bold text-red-400/80 transition hover:bg-red-500/10 hover:text-red-400"
                        >Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* @ Mention dropdown */}
              {chatMentionOpen && chatMentionQuery !== undefined && (
                <div className="mx-4 mb-1 rounded-xl border border-white/[0.12] bg-[#12121f] shadow-xl">
                  <div className="px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-white/35">Mention an agent</div>
                  {agents
                    .filter((a) => !chatMentionQuery || a.label.toLowerCase().includes(chatMentionQuery.toLowerCase()))
                    .slice(0, 6)
                    .map((a) => (
                      <button
                        key={a.id}
                        onClick={() => {
                          const before = chatText.slice(0, chatText.lastIndexOf('@'));
                          setChatText(before + `@${a.label} `);
                          setChatMentionOpen(false);
                          setChatMentionQuery('');
                        }}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-white/[0.07]"
                      >
                        <span className="relative shrink-0 text-base">{a.icon}
                          <span className={`absolute -bottom-px -right-px h-2 w-2 rounded-full border border-[#12121f] ${a.status === 'running' ? 'bg-green-500' : a.status === 'done' ? 'bg-blue-400' : a.status === 'waiting' ? 'bg-amber-400' : 'bg-white/20'}`} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-semibold text-white">{a.label}</p>
                          <p className="text-[10px] text-white/45">{a.role}</p>
                        </div>
                        <span className={`text-[9px] font-bold ${a.status === 'running' ? 'text-green-400' : a.status === 'done' ? 'text-blue-400' : 'text-white/30'}`}>{a.status}</span>
                      </button>
                    ))}
                  {agents.filter((a) => !chatMentionQuery || a.label.toLowerCase().includes(chatMentionQuery.toLowerCase())).length === 0 && (
                    <p className="px-3 py-2 text-[11px] text-white/35">No agents match "{chatMentionQuery}"</p>
                  )}
                </div>
              )}

              {/* Attach menu */}
              {chatAttachMenuOpen && (
                <div className="mx-4 mb-1 rounded-xl border border-white/[0.12] bg-[#12121f] shadow-xl">
                  <div className="px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-white/35">Attach to message</div>
                  {[
                    { icon: '📄', label: 'Document', desc: '.pdf, .docx, .txt' },
                    { icon: '📊', label: 'Spreadsheet', desc: '.xlsx, .csv' },
                    { icon: '🖼', label: 'Image', desc: '.png, .jpg, .svg' },
                    { icon: '📦', label: 'Data export', desc: '.json, .xml' },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        const now = new Date();
                        const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                        const fileMsg: ChatMsg = { id: `msg-${Date.now()}`, role: 'user', sender: 'You', text: `${item.icon} Attached: mock-${item.label.toLowerCase().replace(' ', '-')}-file${item.desc.split(',')[0].trim()}`, timestamp: ts, type: 'file' };
                        persistChatMsg(activeChatServerId, activeChatChannelId, fileMsg);
                        setChatAttachMenuOpen(false);
                        setTimeout(() => {
                          const ts2 = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                          persistChatMsg(activeChatServerId, activeChatChannelId, { id: `msg-${Date.now()}`, role: 'agent', sender: '🤖 Agent', text: `Received ${item.label}. I'll process it and extract relevant data for the workflow.`, timestamp: ts2, type: 'agent' });
                        }, 900);
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-white/[0.07]"
                    >
                      <span className="text-lg">{item.icon}</span>
                      <div>
                        <p className="text-[12px] font-semibold text-white">{item.label}</p>
                        <p className="text-[10px] text-white/40">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="shrink-0 px-4 pb-4 pt-2">
                <div className="flex items-end gap-2 rounded-xl border border-white/[0.14] bg-white/[0.07] px-3.5 py-2.5 transition focus-within:border-white/30">
                  <button
                    onClick={() => { setChatAttachMenuOpen((v) => !v); setChatMentionOpen(false); }}
                    className="shrink-0 text-[15px] text-white/35 transition hover:text-white/65 mb-0.5"
                    title="Attach file"
                  >📎</button>
                  <textarea
                    value={chatText}
                    onChange={(e) => {
                      const val = e.target.value;
                      setChatText(val);
                      const atMatch = val.match(/@([\w\s]*)$/);
                      if (atMatch) {
                        setChatMentionQuery(atMatch[1]);
                        setChatMentionOpen(true);
                        setChatAttachMenuOpen(false);
                      } else {
                        setChatMentionOpen(false);
                        setChatMentionQuery('');
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') { setChatMentionOpen(false); setChatAttachMenuOpen(false); }
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        setChatMentionOpen(false);
                        setChatAttachMenuOpen(false);
                        sendTeamChat();
                      }
                    }}
                    className="max-h-16 min-h-[28px] flex-1 resize-none bg-transparent py-0.5 text-[12.5px] leading-relaxed text-white outline-none placeholder:text-white/40"
                    rows={1}
                    placeholder="Ask your AI team… (@ to mention)"
                  />
                  <button
                    onClick={() => { setChatMentionOpen(false); setChatAttachMenuOpen(false); sendTeamChat(); }}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-xs font-bold text-ink transition hover:bg-white/85"
                  >
                    ↑
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Resize handle — bottom-right corner */}
          {chatWindowMode !== 'maximized' && (
            <>
              <div
                onMouseDown={startChatResize('right')}
                className="absolute right-0 top-12 z-10 w-3 cursor-ew-resize"
                style={{ height: 'calc(100% - 72px)' }}
                title="Drag to resize width"
              >
                <span className="absolute right-0 top-1/2 h-20 w-px -translate-y-1/2 bg-white/[0.08] opacity-0 transition group-hover:opacity-100" />
              </div>
              <div
                onMouseDown={startChatResize('bottom')}
                className="absolute bottom-0 left-[232px] z-10 h-3 cursor-ns-resize"
                style={{ width: 'calc(100% - 252px)' }}
                title="Drag to resize height"
              >
                <span className="absolute bottom-0 left-1/2 h-px w-24 -translate-x-1/2 bg-white/[0.08] opacity-0 transition group-hover:opacity-100" />
              </div>
              <button
                type="button"
                onMouseDown={startChatResize('corner')}
                className="absolute bottom-1 right-1 z-20 flex h-8 w-8 cursor-se-resize items-end justify-end rounded-br-[18px] rounded-tl-[12px] text-white/35 transition hover:bg-white/[0.06] hover:text-white/70"
                title="Drag to resize"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mb-1 mr-1">
                  <path d="M6.5 13.5L13.5 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M10 13.5L13.5 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M3 13.5L13.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Connection detail panel ── */}
      {selectedConnectionId && !selectedAgent && (() => {
        const conn = connections.find((c) => c.id === selectedConnectionId);
        const fromAgent = conn ? agents.find((a) => a.id === conn.from) : null;
        const toAgent = conn ? agents.find((a) => a.id === conn.to) : null;
        if (!conn || !fromAgent || !toAgent) return null;
        return (
          <aside className="absolute bottom-0 right-0 top-[52px] z-30 w-[300px] overflow-y-auto border-l border-white-07 bg-surface/95 shadow-[-12px_0_40px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white-07 px-4 pb-4 pt-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent/10 text-sm text-accent">→</span>
                  <h3 className="font-heading text-[14px] font-extrabold leading-tight text-ink">Connection</h3>
                </div>
                <p className="mt-1.5 text-[11px] text-muted">Click to edit or delete this connection.</p>
              </div>
              <button
                onClick={() => setSelectedConnectionId('')}
                className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-black/[0.05] text-sm text-muted transition hover:bg-black/10 hover:text-ink"
              >×</button>
            </div>

            {/* From / To */}
            <div className="border-b border-white-07 px-4 py-3 space-y-2.5">
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-subtle">Flow</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-xl border border-white-07 bg-white/[0.04] px-3 py-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-subtle mb-0.5">From</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{fromAgent.icon}</span>
                    <p className="text-[12px] font-semibold text-ink leading-tight">{fromAgent.label}</p>
                  </div>
                </div>
                <span className="text-accent font-bold text-lg">→</span>
                <div className="flex-1 rounded-xl border border-white-07 bg-white/[0.04] px-3 py-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-subtle mb-0.5">To</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{toAgent.icon}</span>
                    <p className="text-[12px] font-semibold text-ink leading-tight">{toAgent.label}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Data label */}
            <div className="border-b border-white-07 px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-subtle">Data Passed</p>
                {connectionLabelEdit === null && (
                  <button
                    onClick={() => setConnectionLabelEdit(conn.label ?? '')}
                    className="text-[10px] font-semibold text-accent/85 transition hover:text-accent"
                  >Edit Label</button>
                )}
              </div>
              {connectionLabelEdit !== null ? (
                <div className="flex gap-2">
                  <input
                    value={connectionLabelEdit}
                    onChange={(e) => setConnectionLabelEdit(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') updateConnectionLabel(conn.id, connectionLabelEdit);
                      if (e.key === 'Escape') setConnectionLabelEdit(null);
                    }}
                    className="flex-1 rounded-lg border border-white-10 bg-background px-2.5 py-1.5 text-sm text-ink outline-none transition focus:border-accent/40 focus:ring-4 focus:ring-accent/10"
                    placeholder="Label…"
                  />
                  <button
                    onClick={() => updateConnectionLabel(conn.id, connectionLabelEdit)}
                    className="rounded-lg bg-accent/15 px-2.5 py-1.5 text-xs font-bold text-accent transition hover:bg-accent/25"
                  >Save</button>
                  <button
                    onClick={() => setConnectionLabelEdit(null)}
                    className="rounded-lg border border-white-10 px-2.5 py-1.5 text-xs font-semibold text-muted transition hover:text-ink"
                  >✕</button>
                </div>
              ) : (
                <p className="rounded-lg bg-white/[0.04] px-3 py-2 text-[12px] font-medium text-ink">
                  {conn.label || <span className="text-muted italic">No label</span>}
                </p>
              )}
            </div>

            {/* Status */}
            {(() => {
              const cStatus = getConnectionStatus(conn);
              return (
                <div className="border-b border-white-07 px-4 py-3 space-y-2">
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-subtle">Status</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${conn.active ? 'bg-green-500/10 text-green-400' : 'bg-white/[0.06] text-muted'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full bg-current ${conn.active ? 'animate-pulse' : ''}`} />
                      {conn.active ? 'Active' : 'Inactive'}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      cStatus === 'valid'   ? 'bg-green-500/10 text-green-400' :
                      cStatus === 'warning' ? 'bg-amber-400/10 text-amber-400' :
                                             'bg-red-500/10 text-red-400'
                    }`}>
                      {cStatus === 'valid' ? '✓ Valid' : cStatus === 'warning' ? '⚠ Warning' : '⛔ Broken'}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Warnings */}
            {(() => {
              const warnings: string[] = [];
              if (fromAgent.disabled) warnings.push(`Source agent "${fromAgent.label}" is disabled.`);
              if (toAgent.disabled) warnings.push(`Target agent "${toAgent.label}" is disabled.`);
              if (!conn.mapping || conn.mapping.length === 0) warnings.push('No field mapping defined — data may not flow correctly.');
              if (hasCircularConnection(conn.from, conn.to)) warnings.push('This connection creates a loop in the workflow.');
              if (warnings.length === 0) return null;
              return (
                <div className="border-b border-white-07 px-4 py-3 space-y-1.5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-warning">⚠ Warnings</p>
                  {warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg bg-warning/[0.07] px-2.5 py-2">
                      <span className="mt-0.5 shrink-0 text-[10px] text-warning">!</span>
                      <p className="text-[11px] font-medium leading-tight text-warning/90">{w}</p>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Field Mapping */}
            <div className="border-b border-white-07 px-4 py-3 space-y-2">
              <div
                className="flex cursor-pointer items-center justify-between"
                onClick={() => setConnPanelSections((s) => ({ ...s, mapping: !s.mapping }))}
              >
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-subtle">Field Mapping</p>
                <span className="text-[10px] text-muted/60">{connPanelSections.mapping ? '▲' : '▼'}</span>
              </div>
              {connPanelSections.mapping && (
                <div className="space-y-1.5">
                  {(conn.mapping ?? []).map((row, idx) => (
                    <div key={row.id} className="flex items-center gap-1.5">
                      <input
                        value={row.fromField}
                        onChange={(e) => {
                          const next = (conn.mapping ?? []).map((r, i) => i === idx ? { ...r, fromField: e.target.value } : r);
                          updateConnectionMapping(conn.id, next);
                        }}
                        className="flex-1 min-w-0 rounded-lg border border-white-10 bg-background px-2 py-1.5 text-[11px] text-ink outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10"
                        placeholder="from field"
                      />
                      <span className="shrink-0 text-[11px] text-accent font-bold">→</span>
                      <input
                        value={row.toField}
                        onChange={(e) => {
                          const next = (conn.mapping ?? []).map((r, i) => i === idx ? { ...r, toField: e.target.value } : r);
                          updateConnectionMapping(conn.id, next);
                        }}
                        className="flex-1 min-w-0 rounded-lg border border-white-10 bg-background px-2 py-1.5 text-[11px] text-ink outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10"
                        placeholder="to field"
                      />
                      <button
                        onClick={() => {
                          const next = (conn.mapping ?? []).filter((_, i) => i !== idx);
                          updateConnectionMapping(conn.id, next);
                        }}
                        className="shrink-0 grid h-6 w-6 place-items-center rounded-md text-[11px] text-muted transition hover:bg-red-500/10 hover:text-red-400"
                      >✕</button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const next = [...(conn.mapping ?? []), { id: `m${Date.now()}`, fromField: '', toField: '' }];
                      updateConnectionMapping(conn.id, next);
                    }}
                    className="w-full rounded-lg border border-dashed border-accent/20 py-1.5 text-[11px] font-semibold text-accent/70 transition hover:border-accent/40 hover:text-accent"
                  >＋ Add Row</button>
                </div>
              )}
            </div>

            {/* Data Preview */}
            {conn.sampleData && Object.keys(conn.sampleData).length > 0 && (
              <div className="border-b border-white-07 px-4 py-3 space-y-2">
                <div
                  className="flex cursor-pointer items-center justify-between"
                  onClick={() => setConnPanelSections((s) => ({ ...s, preview: !s.preview }))}
                >
                  <div className="flex items-center gap-2">
                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-subtle">Data Preview</p>
                    <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-accent">Mock</span>
                  </div>
                  <span className="text-[10px] text-muted/60">{connPanelSections.preview ? '▲' : '▼'}</span>
                </div>
                {connPanelSections.preview && (
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(conn.sampleData).map(([key, val]) => (
                      <div key={key} className="rounded-xl border border-white-07 bg-white/[0.03] px-2.5 py-2">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-subtle truncate">{key}</p>
                        <p className="mt-0.5 text-[12px] font-semibold text-ink leading-tight truncate">{val}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="px-4 py-4 space-y-2">
              <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.12em] text-subtle">Actions</p>
              <button
                onClick={() => openAddAgentModal(conn.id)}
                className="w-full rounded-[10px] border border-accent/20 bg-accent/[0.07] px-4 py-2.5 text-xs font-bold text-accent transition hover:border-accent/35 hover:bg-accent/12"
              >
                ＋ Insert Agent Between
              </button>
              {!deleteConnConfirmOpen ? (
                <button
                  onClick={() => setDeleteConnConfirmOpen(true)}
                  className="w-full rounded-[10px] border border-red-500/20 bg-red-500/[0.05] px-4 py-2.5 text-xs font-bold text-red-500 transition hover:border-red-500/40 hover:bg-red-500/10"
                >
                  Delete Connection
                </button>
              ) : (
                <div className="rounded-[10px] border border-red-500/30 bg-red-500/[0.07] px-3 py-3 space-y-2">
                  <p className="text-[11px] font-semibold text-red-400 leading-snug">Delete this connection?<br/><span className="font-normal text-red-400/70">This cannot be undone.</span></p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => deleteConnection(conn.id)}
                      className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-600"
                    >Yes, Delete</button>
                    <button
                      onClick={() => setDeleteConnConfirmOpen(false)}
                      className="flex-1 rounded-lg border border-white-10 px-3 py-2 text-xs font-semibold text-muted transition hover:text-ink"
                    >Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        );
      })()}

      {selectedAgent && (() => {
        const agentSkills = selectedAgent.skills ?? [];
        const agentTools = selectedAgent.tools ?? [];
        const agentModel = selectedAgent.model ?? 'Balanced';
        const agentMemory = selectedAgent.memory ?? true;
        const SectionHdr = ({ label, sKey, action }: { label: string; sKey: string; action?: React.ReactNode }) => (
          <div
            className="flex cursor-pointer items-center justify-between"
            onClick={() => togglePanelSection(sKey)}
          >
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-subtle">{label}</p>
            <div className="flex items-center gap-2">
              {action}
              <span className="text-[10px] text-muted/60">{panelSections[sKey] ? '▲' : '▼'}</span>
            </div>
          </div>
        );
        return (
          <aside className="absolute bottom-0 right-0 top-[52px] z-30 w-[300px] overflow-y-auto border-l border-white-07 bg-surface/95 shadow-[-12px_0_40px_rgba(0,0,0,0.28)] backdrop-blur-2xl">

            {/* ── Header ── */}
            <div className="flex items-start justify-between border-b border-white-07 px-4 pb-4 pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.07] text-2xl">
                  {selectedAgent.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading text-[14px] font-extrabold leading-tight text-ink">{selectedAgent.label}</h3>
                  <span className="mt-0.5 inline-block rounded-full bg-white/[0.07] px-2 py-0.5 text-[10px] font-semibold text-subtle">{selectedAgent.role}</span>
                </div>
              </div>
              <button onClick={clearCanvasSelection} className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-black/[0.05] text-sm text-muted transition hover:bg-black/10 hover:text-ink">×</button>
            </div>

            {/* ── Status bar ── */}
            <div className="border-b border-white-07 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${
                  selectedAgent.status === 'running' ? 'animate-pulse bg-green-400' :
                  selectedAgent.status === 'waiting' ? 'bg-amber-400' :
                  selectedAgent.status === 'done' ? 'bg-blue-400' :
                  selectedAgent.status === 'failed' ? 'bg-red-400' :
                  'bg-white/20'
                }`} />
                <span className={`text-[11px] font-semibold capitalize ${
                  selectedAgent.status === 'running' ? 'text-green-400' :
                  selectedAgent.status === 'waiting' ? 'text-amber-400' :
                  selectedAgent.status === 'done' ? 'text-blue-400' :
                  selectedAgent.status === 'failed' ? 'text-red-400' :
                  'text-muted'
                }`}>
                  {selectedAgent.status === 'waiting' ? 'Waiting Approval' :
                   selectedAgent.status === 'failed' ? 'Failed' :
                   selectedAgent.disabled ? 'Disabled' :
                   selectedAgent.status}
                </span>
                {selectedAgent.disabled && (
                  <span className="rounded-full bg-white/[0.07] px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-subtle">Disabled</span>
                )}
                <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-warning/80">🔒 Safety on</span>
              </div>
              {(selectedAgent.lastAction || selectedAgent.lastUpdated) && (
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[10px] text-subtle truncate max-w-[160px]">{selectedAgent.lastAction ?? '—'}</span>
                  <span className="text-[10px] text-subtle shrink-0 ml-2">{selectedAgent.lastUpdated ?? '—'}</span>
                </div>
              )}
            </div>

            {/* ── Missing input warning ── */}
            {!selectedAgent.disabled && !SOURCE_AGENT_TYPES.includes(selectedAgent.type as CanvasAgentType) && agents.length > 1 && !connections.some((c) => c.to === selectedAgent.id) && (
              <div className="border-b border-white-07 px-4 py-3">
                <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.07] px-3 py-2.5 space-y-1">
                  <p className="text-[11px] font-bold text-amber-400">⚠ Missing input</p>
                  <p className="text-[11px] text-amber-400/80 leading-snug">This agent needs input but has no source connected.</p>
                  <p className="text-[10px] text-muted">Connect a data source to this agent to fix this.</p>
                </div>
              </div>
            )}

            {/* ── Config Summary ── */}
            <div className="border-b border-white-07 px-4 py-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-subtle">Agent Config</p>
                <button
                  onClick={() => openEditConfig(selectedAgent.id)}
                  className="rounded-lg border border-accent/25 bg-accent/[0.08] px-2.5 py-1 text-[10px] font-bold text-accent transition hover:bg-accent/15"
                >Edit Config</button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  ['Model', agentModel],
                  ['Memory', agentMemory ? 'On' : 'Off'],
                  ['Skills', `${agentSkills.length} selected`],
                  ['Tools', `${agentTools.length} connected`],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-white-07 bg-white/[0.03] px-2.5 py-2">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-subtle">{k}</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-ink">{v}</p>
                  </div>
                ))}
              </div>
              {selectedAgent.goal && (
                <p className="mt-2.5 text-[11px] leading-relaxed text-muted italic">{selectedAgent.goal}</p>
              )}
            </div>

            {/* ── Instructions ── */}
            <div className="border-b border-white-07 px-4 py-3">
              <SectionHdr
                label="Instructions"
                sKey="instructions"
                action={
                  <button
                    onClick={(e) => { e.stopPropagation(); setAgentEditModal({ type: 'edit-agent-instructions', agentId: selectedAgent.id, currentInstructions: selectedAgent.instructions ?? '', agentName: selectedAgent.label }); }}
                    className="text-[10px] font-semibold text-accent/85 transition hover:text-accent"
                  >Edit</button>
                }
              />
              {panelSections['instructions'] && (
                <div className="mt-2 space-y-2.5">
                  {selectedAgent.instructions ? (
                    <p className="text-[12px] leading-relaxed text-muted">{selectedAgent.instructions}</p>
                  ) : (
                    <button
                      onClick={() => setAgentEditModal({ type: 'edit-agent-instructions', agentId: selectedAgent.id, currentInstructions: '', agentName: selectedAgent.label })}
                      className="flex w-full items-center gap-1.5 rounded-lg border border-dashed border-white-10 px-3 py-2 text-[11px] text-subtle transition hover:border-accent/35 hover:text-ink"
                    ><span className="text-accent/70">+</span> Add instructions</button>
                  )}
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    <div>
                      <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wide text-subtle">Input</p>
                      <p className="text-[11px] leading-relaxed text-muted">{selectedAgent.input ?? '—'}</p>
                    </div>
                    <div>
                      <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wide text-subtle">Output</p>
                      <p className="text-[11px] leading-relaxed text-muted">{selectedAgent.output ?? '—'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── System Prompt ── */}
            <div className="border-b border-white-07 px-4 py-3">
              <SectionHdr
                label="System Prompt"
                sKey="systemPrompt"
                action={
                  <button
                    onClick={(e) => { e.stopPropagation(); setAgentEditModal({ type: 'edit-system-prompt', agentId: selectedAgent.id, currentPrompt: selectedAgent.systemPrompt ?? '', agentName: selectedAgent.label }); }}
                    className="text-[10px] font-semibold text-accent/85 transition hover:text-accent"
                  >Edit</button>
                }
              />
              {panelSections['systemPrompt'] && (
                <div className="mt-2">
                  {selectedAgent.systemPrompt ? (
                    <p className="rounded-lg border border-white-07 bg-white/[0.03] px-3 py-2 text-[11px] leading-relaxed text-muted">{selectedAgent.systemPrompt}</p>
                  ) : (
                    <button
                      onClick={() => setAgentEditModal({ type: 'edit-system-prompt', agentId: selectedAgent.id, currentPrompt: '', agentName: selectedAgent.label })}
                      className="flex w-full items-center gap-1.5 rounded-lg border border-dashed border-white-10 px-3 py-2 text-[11px] text-subtle transition hover:border-accent/35 hover:text-ink"
                    ><span className="text-accent/70">+</span> Add system prompt</button>
                  )}
                </div>
              )}
            </div>

            {/* ── Step Logic ── */}
            {(() => {
              const step = workflowConfig.steps.find((s) => s.agentId === selectedAgent.id);
              if (!step) return null;
              return (
                <div className="border-b border-white-07 px-4 py-3">
                  <SectionHdr
                    label="Step Logic"
                    sKey="stepLogic"
                    action={
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditStep(step.id); }}
                        className="text-[10px] font-semibold text-accent/85 transition hover:text-accent"
                      >Edit</button>
                    }
                  />
                  {panelSections['stepLogic'] !== false && (
                    <div className="mt-2 space-y-2">
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className="rounded-lg border border-white-07 bg-white/[0.025] px-2.5 py-2">
                          <p className="text-[9px] font-bold uppercase tracking-wide text-subtle">Input from</p>
                          <p className="mt-0.5 text-[10px] font-semibold text-ink">{step.inputFrom}</p>
                        </div>
                        <div className="rounded-lg border border-white-07 bg-white/[0.025] px-2.5 py-2">
                          <p className="text-[9px] font-bold uppercase tracking-wide text-subtle">Input type</p>
                          <p className="mt-0.5 text-[10px] font-semibold text-ink">{step.inputType}</p>
                        </div>
                        <div className="rounded-lg border border-white-07 bg-white/[0.025] px-2.5 py-2">
                          <p className="text-[9px] font-bold uppercase tracking-wide text-subtle">Output to</p>
                          <p className="mt-0.5 text-[10px] font-semibold text-ink">{step.outputTo}</p>
                        </div>
                        <div className="rounded-lg border border-white-07 bg-white/[0.025] px-2.5 py-2">
                          <p className="text-[9px] font-bold uppercase tracking-wide text-subtle">Output type</p>
                          <p className="mt-0.5 text-[10px] font-semibold text-ink">{step.outputType}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── Skills ── */}
            <div className="border-b border-white-07 px-4 py-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-subtle">Skills & Models</p>
                <button
                  onClick={() => setModelSettingsAgentId(selectedAgent.id)}
                  className="rounded-lg border border-violet-400/25 bg-violet-400/[0.08] px-2.5 py-1 text-[10px] font-bold text-violet-200 transition hover:bg-violet-400/[0.14]"
                >Configure</button>
              </div>
              <div className="space-y-2">
                {(selectedAgent.agentSkills ?? skillsForCapabilities(inferCapabilitiesFromText(selectedAgent.label, selectedAgent.role, selectedAgent.skills, selectedAgent.tools))).map((skill) => {
                  const cfg = routeCapability(skill.capability, { provider: skill.provider, modelName: skill.modelName });
                  const route = CAPABILITY_ROUTES[skill.capability];
                  return (
                    <div key={skill.id} className="rounded-xl border border-white-07 bg-white/[0.03] px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-ink">{skill.label}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${skill.mode === 'auto' ? 'border-emerald-300/18 bg-emerald-400/[0.08] text-emerald-200' : 'border-amber-300/20 bg-amber-400/[0.08] text-amber-200'}`}>
                          {skill.mode === 'auto' ? 'Auto' : PROVIDER_LABELS[skill.provider]}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-muted">Current: {PROVIDER_LABELS[cfg.provider]} · {cfg.modelName} · {cfg.costTier} cost · {cfg.qualityTier} quality</p>
                      <p className="mt-0.5 text-[10px] text-subtle">Fallback: {route.fallback.map((p) => PROVIDER_LABELS[p]).join(' / ') || 'Custom'}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-b border-white-07 px-4 py-3">
              <SectionHdr label="Skills" sKey="skills" />
              {panelSections['skills'] && (
                <div className="mt-2">
                  {agentSkills.length === 0 && (
                    <p className="mb-2 text-[11px] text-subtle italic">No skills selected yet.</p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_SKILLS.map((skill) => {
                      const active = agentSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          onClick={() => toggleAgentSkill(selectedAgent.id, skill)}
                          className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold transition ${
                            active
                              ? 'border-accent/40 bg-accent/12 text-accent'
                              : 'border-white-07 text-muted hover:border-accent/25 hover:text-ink'
                          }`}
                        >{skill}</button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ── Tool Access ── */}
            <div className="border-b border-white-07 px-4 py-3">
              <SectionHdr label="Tool Access" sKey="tools" />
              {panelSections['tools'] && (
                <div className="mt-2 space-y-1.5">
                  {ALL_TOOLS.map(({ id, label, icon }) => {
                    const active = agentTools.includes(id);
                    const connId = TOOL_TO_CONNECTOR_ID[id];
                    const conn = connId ? connectors.find((c) => c.id === connId) : null;
                    const connStatus = conn?.status ?? null;
                    const isComingSoon = connStatus === 'coming-soon';
                    const isConnected = !connId || connStatus === 'connected';
                    const needsApproval = conn?.accessLevel === 'Approval required';
                    // Determine if this tool type is write/send/export (medium-high risk)
                    const toolIdLower = id.toLowerCase();
                    const isWriteTool = toolIdLower.includes('gmail') || toolIdLower.includes('send') || toolIdLower.includes('export') || toolIdLower.includes('write') || toolIdLower.includes('delete') || toolIdLower.includes('publish');
                    const isReadOnlyTool = !isWriteTool;
                    const toolRisk = isWriteTool ? 'Medium' : 'Low';
                    return (
                      <button
                        key={id}
                        onClick={() => !isComingSoon && toggleAgentTool(selectedAgent.id, id)}
                        disabled={isComingSoon}
                        className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition ${
                          active
                            ? 'border-accent/30 bg-accent/[0.08]'
                            : isComingSoon
                            ? 'border-white-07 opacity-40 cursor-not-allowed'
                            : 'border-white-07 hover:border-white-10'
                        }`}
                      >
                        <span className="text-base">{icon}</span>
                        <span className={`flex-1 text-[11px] font-semibold ${active ? 'text-ink' : 'text-muted'}`}>{label}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Read-only badge */}
                          {isReadOnlyTool && (
                            <span className="rounded-full bg-sky-400/10 px-1.5 py-0.5 text-[8px] font-bold text-sky-400">Read only</span>
                          )}
                          {/* Approval badge for write tools when safety mode on */}
                          {(needsApproval || (isWriteTool && safetyMode)) && active && (
                            <span className="rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[8px] font-bold text-amber-400">Approval</span>
                          )}
                          {/* Risk badge for active write tools */}
                          {isWriteTool && active && (
                            <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${toolRisk === 'Medium' ? 'bg-amber-400/10 text-amber-400' : 'bg-red-400/10 text-red-400'}`}>{toolRisk} risk</span>
                          )}
                          {connId && !isComingSoon && (
                            <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${isConnected ? 'bg-green-500/15 text-green-400' : 'bg-white/[0.06] text-muted'}`}>
                              {isConnected ? '● Connected' : '○ Setup needed'}
                            </span>
                          )}
                          {isComingSoon && (
                            <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[8px] font-bold text-subtle">Soon</span>
                          )}
                          <span className={`text-[9px] font-bold uppercase tracking-wide ${active ? 'text-accent' : 'text-subtle'}`}>
                            {active ? 'On' : 'Off'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Approval Requirement ── */}
            {(() => {
              const approval = selectedAgent.stepApproval ?? { requiresApproval: false, approvalReason: '', riskLevel: 'Low' as const, approvalOwner: 'Me' as const, actionType: '' };
              return (
                <div className="border-b border-white-07 px-4 py-3">
                  <SectionHdr label="Approval Requirement" sKey="approval" />
                  {panelSections['approval'] && (
                    <div className="mt-2 space-y-3">
                      {/* Toggle */}
                      <div
                        className="flex cursor-pointer items-center justify-between rounded-xl border border-white-07 px-3 py-2.5 transition hover:border-white-10"
                        onClick={() => updateStepApproval(selectedAgent.id, { requiresApproval: !approval.requiresApproval })}
                      >
                        <div>
                          <p className="text-[11px] font-semibold text-ink">Requires approval before running</p>
                          <p className="text-[10px] text-muted">Pause workflow and wait for human sign-off</p>
                        </div>
                        <div className={`relative h-5 w-9 rounded-full transition-colors ${approval.requiresApproval ? 'bg-orange-500' : 'bg-white/10'}`}>
                          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${approval.requiresApproval ? 'left-[18px]' : 'left-0.5'}`} />
                        </div>
                      </div>
                      {approval.requiresApproval && (
                        <>
                          {/* Risk level */}
                          <div>
                            <p className="mb-1.5 text-[10px] font-semibold text-muted">Risk Level</p>
                            <div className="flex gap-1.5">
                              {(['Low', 'Medium', 'High'] as const).map((lvl) => (
                                <button key={lvl} onClick={() => updateStepApproval(selectedAgent.id, { riskLevel: lvl })}
                                  className={`flex-1 rounded-xl border py-1.5 text-[10px] font-bold transition ${approval.riskLevel === lvl ? lvl === 'High' ? 'border-red-400/40 bg-red-400/10 text-red-400' : lvl === 'Medium' ? 'border-amber-400/40 bg-amber-400/10 text-amber-400' : 'border-green-400/40 bg-green-400/10 text-green-400' : 'border-white-07 text-muted hover:border-white-10'}`}
                                >{lvl}</button>
                              ))}
                            </div>
                          </div>
                          {/* Action type */}
                          <div>
                            <p className="mb-1.5 text-[10px] font-semibold text-muted">Action Type</p>
                            <select
                              value={approval.actionType || ''}
                              onChange={(e) => updateStepApproval(selectedAgent.id, { actionType: e.target.value })}
                              className="w-full rounded-xl border border-white-07 bg-transparent px-3 py-2 text-[11px] text-ink outline-none transition focus:border-accent/40"
                            >
                              <option value="">Select type…</option>
                              {['Send message', 'Export file', 'Update data', 'Delete records', 'API call', 'Publish content', 'Transfer funds', 'Notify users', 'Other'].map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>
                          {/* Approval owner */}
                          <div>
                            <p className="mb-1.5 text-[10px] font-semibold text-muted">Approval Owner</p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {(['Me', 'Team owner', 'Manager', 'Custom'] as const).map((owner) => (
                                <button key={owner} onClick={() => updateStepApproval(selectedAgent.id, { approvalOwner: owner })}
                                  className={`rounded-xl border py-1.5 text-[10px] font-bold transition ${approval.approvalOwner === owner ? 'border-accent/40 bg-accent/10 text-accent' : 'border-white-07 text-muted hover:border-white-10'}`}
                                >{owner}</button>
                              ))}
                            </div>
                          </div>
                          {/* Reason */}
                          <div>
                            <p className="mb-1.5 text-[10px] font-semibold text-muted">Reason for Approval</p>
                            <textarea
                              value={approval.approvalReason}
                              onChange={(e) => updateStepApproval(selectedAgent.id, { approvalReason: e.target.value })}
                              rows={2}
                              placeholder="e.g. Sending external message requires sign-off"
                              className="w-full resize-none rounded-xl border border-white-07 bg-transparent px-3 py-2 text-[11px] text-ink outline-none placeholder:text-subtle transition focus:border-accent/40"
                            />
                          </div>
                          {/* Simulate button */}
                          <button
                            onClick={() => addApprovalRequest(selectedAgent.id, selectedAgent.label, approval.actionType || 'Action', approval.riskLevel, `Simulated approval request for ${selectedAgent.label}.`, `Agent: ${selectedAgent.label}\nAction: ${approval.actionType || 'Action'}\nRisk: ${approval.riskLevel}`)}
                            className="w-full rounded-xl border border-orange-400/25 bg-orange-400/10 py-2 text-[11px] font-semibold text-orange-300 transition hover:bg-orange-400/20"
                          >
                            Simulate Approval Request
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── Safety ── */}
            {(() => {
              const approval = selectedAgent.stepApproval;
              const agentTools = selectedAgent.tools ?? [];
              const writeTools = agentTools.filter((t) => {
                const lo = t.toLowerCase();
                return lo.includes('gmail') || lo.includes('send') || lo.includes('export') || lo.includes('write') || lo.includes('delete') || lo.includes('publish');
              });
              const risk = detectRisk(approval?.actionType ?? 'Read data', safetyMode);
              return (
                <div className="border-b border-white-07 px-4 py-3">
                  <SectionHdr label="Safety" sKey="safety" />
                  {panelSections['safety'] && (
                    <div className="mt-2 space-y-2">
                      {/* Safety Mode pill */}
                      <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                        <span className="text-[11px] text-white/60">Safety Mode</span>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${safetyMode ? 'bg-warning/15 text-warning' : 'bg-red-400/15 text-red-400'}`}>{safetyMode ? 'ON' : 'OFF'}</span>
                      </div>
                      {/* Risk level */}
                      <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                        <span className="text-[11px] text-white/60">Agent risk level</span>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${approval?.riskLevel === 'High' ? 'bg-red-400/15 text-red-400' : approval?.riskLevel === 'Medium' ? 'bg-amber-400/15 text-amber-400' : 'bg-emerald-400/15 text-emerald-400'}`}>{approval?.riskLevel ?? risk.riskLevel}</span>
                      </div>
                      {/* Tool access summary */}
                      <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                        <span className="text-[11px] text-white/60">Tool access</span>
                        <span className="text-[10px] font-semibold text-sky-300">{agentTools.length > 0 ? `${agentTools.length - writeTools.length} read-only${writeTools.length > 0 ? `, ${writeTools.length} write` : ''}` : 'No tools'}</span>
                      </div>
                      {/* Approval required badge */}
                      {approval?.requiresApproval && (
                        <div className="flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2">
                          <span className="text-[10px] text-amber-300">⏳ Approval required before this step runs</span>
                        </div>
                      )}
                      {/* Action confirmation note */}
                      {writeTools.length > 0 && safetyMode && (
                        <div className="rounded-xl border border-orange-400/15 bg-orange-400/[0.05] px-3 py-2">
                          <p className="text-[10px] text-orange-300/80">External actions require confirmation before execution.</p>
                        </div>
                      )}
                      {/* Simulate action confirm */}
                      {approval?.actionType && (
                        <button
                          onClick={() => {
                            const r = detectRisk(approval.actionType, safetyMode);
                            setPendingAction({
                              id: `pa-${Date.now()}`,
                              actionName: approval.actionType,
                              actionType: approval.actionType,
                              requestedByAgentId: selectedAgent.id,
                              requestedByAgentName: selectedAgent.label,
                              workflowStep: selectedAgent.role,
                              destination: 'Workflow output',
                              riskLevel: r.riskLevel,
                              reason: r.reason,
                              previewContent: '',
                            });
                          }}
                          className="w-full rounded-xl border border-orange-400/20 bg-orange-400/[0.07] py-2 text-[10px] font-semibold text-orange-300 transition hover:bg-orange-400/15"
                        >
                          Preview Action Confirmation
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── Model & Memory ── */}
            <div className="border-b border-white-07 px-4 py-3 space-y-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-subtle">Model & Memory</p>
              <div className="flex gap-1.5">
                {MODEL_OPTIONS.map(({ value, label, desc }) => (
                  <button
                    key={value}
                    onClick={() => updateAgentModel(selectedAgent.id, value)}
                    title={desc}
                    className={`flex-1 rounded-xl border py-2 text-center text-[10px] font-bold transition ${
                      agentModel === value
                        ? 'border-accent/40 bg-accent/12 text-accent'
                        : 'border-white-07 text-muted hover:border-white-10 hover:text-ink'
                    }`}
                  >{label}</button>
                ))}
              </div>
              <p className="text-[10px] text-muted">
                {MODEL_OPTIONS.find((m) => m.value === agentModel)?.desc}
              </p>
              <div
                className="flex cursor-pointer items-center justify-between rounded-xl border border-white-07 px-3 py-2.5 transition hover:border-white-10"
                onClick={() => updateAgentMemory(selectedAgent.id, !agentMemory)}
              >
                <div>
                  <p className="text-[11px] font-semibold text-ink">Use project memory</p>
                  <p className="text-[10px] text-muted">Access previous context and outputs</p>
                </div>
                <div className={`relative h-5 w-9 rounded-full transition-colors ${agentMemory ? 'bg-accent' : 'bg-white/10'}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${agentMemory ? 'left-[18px]' : 'left-0.5'}`} />
                </div>
              </div>
            </div>

            {/* ── Run History ── */}
            <div className="border-b border-white-07 px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-subtle">Run History</p>
                <button
                  onClick={() => setAgentEditModal({ type: 'view-run-history', agentName: selectedAgent.label })}
                  className="text-[10px] font-semibold text-accent/85 transition hover:text-accent"
                >View All</button>
              </div>
              <div className="mt-2 space-y-1.5">
                {([
                  ['09:00 today', 'Completed', 'text-green-400'],
                  ['Yesterday', 'Completed', 'text-green-400'],
                  ['May 10', 'Waiting approval', 'text-amber-400'],
                ] as [string, string, string][]).map(([time, stat, col]) => (
                  <div key={time} className="flex items-center justify-between text-[11px]">
                    <span className="text-muted">{time}</span>
                    <span className={`font-semibold ${col}`}>{stat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Usage Summary ── */}
            {(() => {
              const agentEvents = usageState.usageEvents.filter((e) => e.workflowName !== '');
              const totalRuns = agentEvents.length;
              const totalCredits = agentEvents.reduce((s, e) => s + e.creditsUsed, 0);
              const totalTokens = agentEvents.reduce((s, e) => s + e.tokensUsed, 0);
              const avgTokens = totalRuns > 0 ? Math.round(totalTokens / totalRuns) : 0;
              return (
                <div className="border-b border-white/[0.06] px-4 py-3">
                  <SectionHdr label="Usage This Month" sKey="usage" />
                  {panelSections['usage'] && (
                    <div className="mt-2 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Workflow runs', value: usageState.workflowRunsUsed.toString() },
                          { label: 'Credits used', value: usageState.agentCreditsUsed.toString() },
                          { label: 'Tokens used', value: usageState.tokenUsageThisMonth >= 1000 ? `${(usageState.tokenUsageThisMonth / 1000).toFixed(1)}k` : usageState.tokenUsageThisMonth.toString() },
                          { label: 'Avg tokens/run', value: avgTokens >= 1000 ? `${(avgTokens / 1000).toFixed(1)}k` : avgTokens.toString() },
                        ].map(({ label, value }) => (
                          <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                            <p className="text-[9px] text-white/40 uppercase tracking-widest">{label}</p>
                            <p className="mt-0.5 text-[14px] font-bold text-ink">{value}</p>
                          </div>
                        ))}
                      </div>
                      {(() => {
                        const plan = PLANS.find((p) => p.id === usageState.currentPlan) ?? PLANS[0];
                        const runsPct = Math.min(100, (usageState.workflowRunsUsed / plan.workflowRunsLimit) * 100);
                        const barColor = runsPct >= 90 ? 'bg-red-400' : runsPct >= 70 ? 'bg-amber-400' : 'bg-accent';
                        return (
                          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-white/50">Monthly runs</span>
                              <span className="text-[10px] font-semibold text-ink">{usageState.workflowRunsUsed} / {plan.workflowRunsLimit}</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                              <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${runsPct}%` }} />
                            </div>
                            <p className="text-[9px] text-white/30">Resets {usageState.resetDate}</p>
                          </div>
                        );
                      })()}
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                        <p className="text-[9px] text-white/40 uppercase tracking-widest">Current plan</p>
                        <div className="mt-0.5 flex items-center justify-between">
                          <p className="text-[12px] font-bold capitalize text-accent">{usageState.currentPlan}</p>
                          <button
                            onClick={() => setUpgradeModal({ toPlan: 'pro', reason: 'pro-feature', featureName: 'Upgrade' })}
                            className="text-[9px] font-semibold text-accent/70 hover:text-accent transition"
                          >Upgrade →</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── Error Handling ── */}
            {selectedAgent.status === 'failed' && selectedAgent.error && (
              <div className="border-b border-white-07 px-4 py-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[11px] font-bold text-red-400">⚠ Error</span>
                  <span className="flex-1 truncate text-[10px] text-red-400/70">{selectedAgent.error.title}</span>
                </div>
                <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-3 py-2.5 space-y-1.5">
                  <p className="text-[11px] text-red-300 leading-relaxed">{selectedAgent.error.message}</p>
                  <p className="text-[10px] text-red-400/60">Step: {selectedAgent.error.failedStep}</p>
                  <p className="text-[10px] text-amber-400/80">Fix: {selectedAgent.error.suggestedFix}</p>
                </div>
                <div className="mt-2.5 flex gap-2">
                  <button
                    onClick={() => retryAgent(selectedAgent.id)}
                    className="flex-1 rounded-[10px] border border-green-500/30 bg-green-500/[0.07] px-3 py-2 text-xs font-bold text-green-400 transition hover:bg-green-500/12"
                  >↩ Retry</button>
                  <button
                    onClick={() => { const err = selectedAgent.error; if (err) setErrorDetailModal({ agentId: selectedAgent.id, error: err }); }}
                    className="flex-1 rounded-[10px] border border-white-10 px-3 py-2 text-xs font-semibold text-muted transition hover:border-white/20 hover:text-ink"
                  >View Details</button>
                </div>
              </div>
            )}

            {/* ── Agent Memory ── */}
            <div className="border-b border-white-07 px-4 py-3">
              <SectionHdr
                label="Agent Memory"
                sKey="memory"
                action={
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-subtle">{(selectedAgent.memories ?? []).length}</span>
                    <div
                      className={`relative h-4 w-7 cursor-pointer rounded-full transition-colors ${(selectedAgent.memoryEnabled ?? false) ? 'bg-accent' : 'bg-white/10'}`}
                      onClick={(e) => { e.stopPropagation(); toggleAgentMemoryEnabled(selectedAgent.id); }}
                    >
                      <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all ${(selectedAgent.memoryEnabled ?? false) ? 'left-[14px]' : 'left-0.5'}`} />
                    </div>
                  </div>
                }
              />
              {panelSections['memory'] && (
                <div className="mt-2 space-y-2">
                  <p className="text-[10px] text-subtle leading-relaxed">This agent can use saved project context when working.</p>
                  {(selectedAgent.memories ?? []).length === 0 && (
                    <p className="text-[10px] text-subtle italic">No saved memories yet.</p>
                  )}
                  <div className="space-y-1">
                    {(selectedAgent.memories ?? []).map((mem, idx) => (
                      <div key={idx} className="group flex items-start gap-2 rounded-lg border border-white-07 bg-white/[0.025] px-2.5 py-2">
                        <span className="mt-px text-[9px] text-accent/60 shrink-0">●</span>
                        <span className="flex-1 text-[10px] leading-relaxed text-muted">{mem}</span>
                        <button
                          onClick={() => removeAgentMemory(selectedAgent.id, idx)}
                          className="shrink-0 text-[10px] text-subtle opacity-0 group-hover:opacity-100 transition hover:text-red-400"
                        >×</button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      value={agentMemoryInput}
                      onChange={(e) => setAgentMemoryInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') addAgentMemory(selectedAgent.id, agentMemoryInput); }}
                      placeholder="Add a memory item…"
                      className="flex-1 rounded-lg border border-white-07 bg-white/[0.03] px-2.5 py-1.5 text-[10px] text-ink outline-none placeholder:text-subtle focus:border-accent/30"
                    />
                    <button
                      onClick={() => addAgentMemory(selectedAgent.id, agentMemoryInput)}
                      className="shrink-0 rounded-lg border border-accent/25 bg-accent/[0.08] px-2.5 py-1.5 text-[10px] font-bold text-accent transition hover:bg-accent/15"
                    >Add</button>
                  </div>
                  {(selectedAgent.memories ?? []).length > 0 && (
                    <button
                      onClick={() => { if (window.confirm('Clear all memory items for this agent?')) clearAgentMemories(selectedAgent.id); }}
                      className="text-[10px] font-semibold text-red-400/70 transition hover:text-red-400"
                    >Clear all memories</button>
                  )}
                </div>
              )}
            </div>

            {/* ── Personality & Tone ── */}
            <div className="border-b border-white-07 px-4 py-3">
              <SectionHdr
                label="Personality & Tone"
                sKey="tone"
                action={
                  <span className="text-[10px] text-subtle">{(selectedAgent.tone ?? []).length} selected</span>
                }
              />
              {panelSections['tone'] && (
                <div className="mt-2 space-y-2">
                  <p className="text-[10px] text-subtle leading-relaxed">Tone controls how this agent writes messages, reports, and recommendations.</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_TONES.map((toneItem) => {
                      const active = (selectedAgent.tone ?? []).includes(toneItem);
                      return (
                        <button
                          key={toneItem}
                          onClick={() => toggleAgentTone(selectedAgent.id, toneItem)}
                          className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold transition ${
                            active
                              ? 'border-secondary/40 bg-secondary/12 text-secondary'
                              : 'border-white-07 text-muted hover:border-secondary/25 hover:text-ink'
                          }`}
                        >{toneItem}</button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ── Actions ── */}
            <div className="px-4 py-4 space-y-2">
              <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.12em] text-subtle">Status Actions</p>
              <button
                onClick={() => runSingleAgent(selectedAgent.id)}
                disabled={selectedAgent.disabled}
                className={`w-full rounded-[10px] px-4 py-2.5 text-xs font-bold transition ${
                  selectedAgent.disabled
                    ? 'cursor-not-allowed border border-white-07 bg-white/[0.03] text-muted'
                    : 'bg-ink text-white hover:bg-[#1a1a2e]'
                }`}
              >▶ Run This Agent</button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => markAgentDone(selectedAgent.id)}
                  className="rounded-[10px] border border-green-500/25 bg-green-500/[0.06] px-3 py-2 text-xs font-semibold text-green-400 transition hover:bg-green-500/10"
                >✓ Mark Done</button>
                <button
                  onClick={() => simulateAgentError(selectedAgent.id)}
                  className="rounded-[10px] border border-red-500/20 bg-red-500/[0.05] px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/10"
                >⚠ Simulate Error</button>
              </div>
              {selectedAgent.status === 'failed' && (
                <button
                  onClick={() => retryAgent(selectedAgent.id)}
                  className="w-full rounded-[10px] border border-amber-500/30 bg-amber-500/[0.07] px-4 py-2.5 text-xs font-bold text-amber-400 transition hover:bg-amber-500/12"
                >↩ Retry Agent</button>
              )}
              <p className="mb-1 pt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-subtle">Config</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => openEditConfig(selectedAgent.id)}
                  className="rounded-[10px] border border-white-10 px-3 py-2 text-xs font-semibold text-ink transition hover:bg-surface2 hover:border-accent/20"
                >Edit Config</button>
                <button onClick={() => setAgentEditModal({ type: 'change-role-picker', agentId: selectedAgent.id, agentName: selectedAgent.label, currentRole: selectedAgent.role })}
                  className="rounded-[10px] border border-white-10 px-3 py-2 text-xs font-semibold text-ink transition hover:bg-surface2 hover:border-accent/20"
                >Change Role</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setAgentEditModal({ type: 'rename-agent', agentId: selectedAgent.id, currentName: selectedAgent.label })}
                  className="rounded-[10px] border border-white-10 px-3 py-2 text-xs font-semibold text-ink transition hover:bg-surface2 hover:border-accent/20"
                >Rename</button>
                <button onClick={duplicateSelected}
                  className="rounded-[10px] border border-white-10 px-3 py-2 text-xs font-semibold text-ink transition hover:bg-surface2 hover:border-accent/20"
                >Duplicate</button>
              </div>
              <button
                onClick={() => toggleAgentDisabled(selectedAgent.id)}
                className={`w-full rounded-[10px] border px-4 py-2.5 text-xs font-semibold transition ${
                  selectedAgent.disabled
                    ? 'border-green-500/30 bg-green-500/[0.07] text-green-400 hover:border-green-500/50 hover:bg-green-500/10'
                    : 'border-white-10 text-muted hover:bg-surface2 hover:text-ink'
                }`}
              >{selectedAgent.disabled ? 'Enable Agent' : 'Disable Agent'}</button>
              <button
                onClick={() => { if (agents.length > 1) setAgentEditModal({ type: 'confirm-remove-agent', agentId: selectedAgent.id, agentName: selectedAgent.label }); }}
                className="w-full rounded-[10px] border border-red-500/20 bg-red-500/[0.05] px-4 py-2.5 text-xs font-bold text-red-500 transition hover:border-red-500/40 hover:bg-red-500/10"
              >Remove from Team</button>
            </div>
          </aside>
        );
      })()}

      {toast && (
        <div className="absolute left-1/2 top-[68px] z-50 -translate-x-1/2 rounded-[10px] bg-ink px-5 py-2.5 text-xs font-bold text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)]">
          {toast}
        </div>
      )}

      {modelSettingsAgentId && (() => {
        const target = agents.find((agent) => agent.id === modelSettingsAgentId);
        return target ? (
          <ModelProviderSettingsModal
            agentName={target.label}
            initialSkills={target.agentSkills ?? skillsForCapabilities(inferCapabilitiesFromText(target.label, target.role, target.skills, target.tools))}
            onSave={(skills, activeModel) => saveAgentModelSettings(target.id, skills, activeModel)}
            onClose={() => setModelSettingsAgentId(null)}
          />
        ) : null;
      })()}

      {modelPickerTarget && (() => {
        const target = agents.find((agent) => agent.id === modelPickerTarget.agentId);
        const skills = target ? target.agentSkills ?? skillsForCapabilities(inferCapabilitiesFromText(target.label, target.role, target.skills, target.tools)) : [];
        const skill = skills.find((item) => item.id === modelPickerTarget.skillId) ?? skills[0];
        return target && skill ? (
          <ModelPickerModal
            title={`${target.label} model`}
            skill={skill}
            activeModel={target.activeModel}
            onClose={() => setModelPickerTarget(null)}
            onSave={(nextSkill, activeModel) => {
              const nextSkills = skills.map((item) => item.id === nextSkill.id ? nextSkill : item);
              saveAgentModelSettings(target.id, nextSkills, activeModel);
              setModelPickerTarget(null);
            }}
          />
        ) : null;
      })()}

      {isBulkDeleteOpen && (
        <AppModal
          type="confirm"
          title="Delete selected agents?"
          message={
            selectionCount >= agents.length
              ? 'This will remove all agents from this workflow.'
              : `This will remove ${selectionCount} agents from the current workflow. This action can be undone later if version history is available.`
          }
          confirmLabel="Delete Agents"
          onConfirm={confirmBulkDelete}
          onCancel={() => setIsBulkDeleteOpen(false)}
        />
      )}

      {isAddAgentOpen && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/35 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-[820px] rounded-[18px] border border-white-07 bg-surface shadow-[0_20px_70px_rgba(0,0,0,0.22)]" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="border-b border-white-07 px-5 py-4">
              <h3 className="font-heading text-[18px] font-extrabold text-ink">
                {addAgentModal.insertBetweenConnectionId ? 'Insert Agent Between Steps' : 'Add New Agent'}
              </h3>
              <p className="mt-1 text-sm text-muted">
                {addAgentModal.insertBetweenConnectionId
                  ? 'Choose an agent type to insert between the selected connection.'
                  : 'Choose an agent type, then customize its name, role, and instructions.'}
              </p>
            </div>
            <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
              {ADD_AGENT_OPTIONS.map((option) => {
                const isTypeSelected = addAgentModal.selectedType === option.type;
                return (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => {
                      setAddAgentModal((current) => ({
                        ...current,
                        selectedType: option.type,
                        name: option.defaults.label,
                        role: option.defaults.role,
                        instructions: option.defaults.instructions ?? '',
                        input: option.defaults.input ?? '',
                        output: option.defaults.output ?? '',
                      }));
                    }}
                    className={`rounded-[14px] border px-4 py-4 text-left transition ${
                      isTypeSelected
                        ? 'border-accent/45 bg-accent/10 shadow-[0_10px_24px_rgba(79,158,255,0.12)]'
                        : 'border-white-07 bg-white/70 hover:border-black/12 hover:bg-surface2'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl ${isTypeSelected ? 'bg-accent/12' : 'bg-black/[0.05]'}`}>
                        {option.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-ink">{option.cardTitle}</p>
                          {isTypeSelected && <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-accent">Selected</span>}
                        </div>
                        <p className="mt-1 text-[12px] leading-relaxed text-muted">{option.description}</p>
                        <SkillModelPills skills={skillsForCapabilities(inferCapabilitiesFromText(option.defaults.label, option.defaults.role, option.defaults.skills, option.defaults.tools))} compact />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {/* Editable fields for ALL agent types */}
            <div className="grid gap-3 border-t border-white-07 px-5 py-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-subtle">Agent Name</label>
                <input
                  value={addAgentModal.name}
                  onChange={(e) => setAddAgentModal((current) => ({ ...current, name: e.target.value }))}
                  className="w-full rounded-xl border border-white-10 bg-background px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent/40 focus:ring-4 focus:ring-accent/10"
                  placeholder="Agent name"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-subtle">Role</label>
                <input
                  value={addAgentModal.role}
                  onChange={(e) => setAddAgentModal((current) => ({ ...current, role: e.target.value }))}
                  className="w-full rounded-xl border border-white-10 bg-background px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent/40 focus:ring-4 focus:ring-accent/10"
                  placeholder="Role"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-subtle">Instructions</label>
                <textarea
                  value={addAgentModal.instructions}
                  onChange={(e) => setAddAgentModal((current) => ({ ...current, instructions: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-white-10 bg-background px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent/40 focus:ring-4 focus:ring-accent/10"
                  placeholder="What should this agent do?"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-subtle">Input</label>
                <input
                  value={addAgentModal.input}
                  onChange={(e) => setAddAgentModal((current) => ({ ...current, input: e.target.value }))}
                  className="w-full rounded-xl border border-white-10 bg-background px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent/40 focus:ring-4 focus:ring-accent/10"
                  placeholder="What data does it receive?"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-subtle">Output</label>
                <input
                  value={addAgentModal.output}
                  onChange={(e) => setAddAgentModal((current) => ({ ...current, output: e.target.value }))}
                  className="w-full rounded-xl border border-white-10 bg-background px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent/40 focus:ring-4 focus:ring-accent/10"
                  placeholder="What does it produce?"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-white-07 px-5 py-4">
              <button
                onClick={() => setIsAddAgentOpen(false)}
                className="rounded-[10px] border border-white-10 px-4 py-2 text-sm font-semibold text-muted transition hover:bg-surface2 hover:text-ink"
              >
                Cancel
              </button>
              <button
                onClick={confirmAddAgent}
                className="rounded-[10px] bg-ink px-4 py-2 text-sm font-bold text-white transition hover:bg-[#1a1a2e]"
              >
                {addAgentModal.insertBetweenConnectionId ? 'Insert Agent' : 'Add Agent'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Chat context menus ── */}
      {isRunPreviewOpen && (
        <div className="fixed inset-0 z-[72] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[3px]">
          <div className="flex w-full max-w-[820px] flex-col rounded-[20px] border border-white/[0.1] bg-[#0c0c14]/95 text-white shadow-[0_24px_80px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.04] backdrop-blur-xl" style={{ maxHeight: 'min(90vh, calc(100vh - 32px))' }}>
            {/* Sticky header */}
            <div className="shrink-0 border-b border-white/[0.08] px-5 py-4">
              <h3 className="font-heading text-[19px] font-extrabold text-white">Run workflow preview</h3>
              <p className="mt-1 text-sm text-white/65">Review what this AI team will do before starting.</p>
            </div>
            {/* Scrollable body */}
            <div className="min-h-0 flex-1 overflow-y-auto space-y-5 px-5 py-5">
              {/* Dependency check summary */}
              {(() => {
                const errCount  = validationIssues.filter((i) => i.severity === 'error').length;
                const warnCount = validationIssues.filter((i) => i.severity === 'warning').length;
                const isReady   = errCount === 0;
                return (
                  <div className={`rounded-[16px] border p-4 ${isReady ? 'border-emerald-400/20 bg-emerald-400/[0.04]' : 'border-red-500/25 bg-red-500/[0.05]'}`}>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">Dependency Check</p>
                        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-bold ${isReady ? 'text-emerald-300' : 'text-red-400'}`}>
                            {isReady ? '✓ Ready to run' : '⛔ Not ready to deploy'}
                          </span>
                          {errCount > 0 && <span className="text-[11px] text-red-400">{errCount} blocking error{errCount > 1 ? 's' : ''}</span>}
                          {warnCount > 0 && <span className="text-[11px] text-amber-400">{warnCount} warning{warnCount > 1 ? 's' : ''}</span>}
                          {validationIssues.length === 0 && <span className="text-[11px] text-emerald-300/70">No issues found</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => { setIsRunPreviewOpen(false); setIsDepCheckOpen(true); }}
                        className="shrink-0 rounded-lg border border-white/[0.1] px-3 py-1.5 text-[11px] font-semibold text-white/60 transition hover:border-white/[0.2] hover:text-white"
                      >View Issues</button>
                    </div>
                    {errCount > 0 && (
                      <p className="mt-2 text-[11px] text-red-400/70 leading-snug">Workflow has {errCount} blocking issue{errCount > 1 ? 's' : ''}. Fix them before deploying.</p>
                    )}
                  </div>
                );
              })()}
              <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.04] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">Workflow summary</p>
                    <h4 className="mt-1 text-base font-bold text-white">Daily Sales Report</h4>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300">Low risk</span>
                    <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-2.5 py-1 text-[10px] font-bold text-sky-300">Read-only</span>
                    <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold text-amber-300">Approval required</span>
                  </div>
                </div>
                <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-3">
                  <div><p className="text-white/45">Project</p><p className="font-semibold text-white">{activeProject.name}</p></div>
                  <div><p className="text-white/45">Agents</p><p className="font-semibold text-white">{agents.length}</p></div>
                  <div><p className="text-white/45">Status</p><p className={`font-semibold capitalize ${workflowExecution.status === 'running' ? 'text-emerald-300' : workflowExecution.status === 'paused' ? 'text-amber-300' : workflowExecution.status === 'stopped' ? 'text-red-300' : 'text-white'}`}>{workflowExecution.status.replace('-', ' ')}</p></div>
                  <div><p className="text-white/45">Safety Mode</p><p className={`font-semibold ${safetyMode ? 'text-warning' : 'text-red-400'}`}>{safetyMode ? '🛡 ON' : '⚠ OFF'}</p></div>
                  <div><p className="text-white/45">Review before AI acts</p><p className="font-semibold text-white">{agents.some((a) => a.stepApproval?.requiresApproval) ? 'Yes' : safetyMode ? 'For risky steps' : 'No'}</p></div>
                </div>
              </div>
              <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.03] p-4">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">Workflow steps</p>
                <div className="space-y-3">
                  {[
                    ['1', 'Read input data', 'AI Ant Scout will read the uploaded LINE MAN screenshot or file in read-only mode.'],
                    ['2', 'Extract and clean data', 'Data Collector and Data Cleaner will extract sales, orders, GP fee, VAT, and clean the data.'],
                    ['3', 'Analyze performance', 'Sales Analyst will calculate profit, detect abnormal costs, and find key insights.'],
                    ['4', 'Create report', 'Report Writer will generate a daily profit report with recommendations.'],
                    ['5', 'Wait for approval', 'Approval Guard will ask for your confirmation before exporting or sending anything.'],
                  ].map(([step, title, description]) => (
                    <div key={step} className="flex gap-3 rounded-[14px] border border-white/[0.06] bg-black/10 px-3.5 py-3">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.08] text-xs font-extrabold text-white">{step}</div>
                      <div>
                        <p className="text-sm font-bold text-white">{title}</p>
                        <p className="mt-1 text-[12.5px] leading-relaxed text-white/65">{description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.03] p-4">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">Risk and safety</p>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center justify-between"><span className="text-white/55">Risk level</span><span className="font-semibold text-emerald-300">Low</span></div>
                    <div className="flex items-center justify-between"><span className="text-white/55">Data access</span><span className="font-semibold text-sky-300">Read-only</span></div>
                    <div className="flex items-center justify-between"><span className="text-white/55">External action</span><span className="font-semibold text-white">Disabled until approval</span></div>
                    <div className="flex items-center justify-between"><span className="text-white/55">Human approval</span><span className="font-semibold text-amber-300">Required</span></div>
                  </div>
                  <p className="mt-3 text-[12px] leading-relaxed text-white/55">Nothing will be sent automatically. AI Ant works in read-only mode, and export or send actions stay blocked until you approve them.</p>
                </div>
                <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.03] p-4">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">Estimated run info</p>
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div><p className="text-white/45">Estimated time</p><p className="font-semibold text-white">30–45 seconds</p></div>
                    <div><p className="text-white/45">Agents involved</p><p className="font-semibold text-white">{agents.filter((a) => !a.disabled).length}{agents.some((a) => a.disabled) ? ` (${agents.filter((a) => a.disabled).length} skipped)` : ''}</p></div>
                    <div><p className="text-white/45">Output</p><p className="font-semibold text-white">Daily Profit Report</p></div>
                    <div><p className="text-white/45">Destination</p><p className="font-semibold text-white">Draft report only</p></div>
                  </div>
                </div>
              </div>
              {/* Inputs & Outputs */}
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.03] p-4">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">Inputs</p>
                  {workflowConfig.inputs.length === 0
                    ? <p className="text-[12px] text-amber-400/75">⚠ No input selected.</p>
                    : <div className="flex flex-wrap gap-2">
                        {workflowConfig.inputs.map((inp) => {
                          const opt = WORKFLOW_INPUT_OPTIONS.find((o) => o.value === inp);
                          return opt ? (
                            <span key={inp} className="flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/[0.08] px-2.5 py-1 text-[10px] font-semibold text-accent">
                              <span>{opt.icon}</span>{opt.label}
                            </span>
                          ) : null;
                        })}
                      </div>
                  }
                </div>
                <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.03] p-4">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">Outputs</p>
                  {workflowConfig.outputs.length === 0
                    ? <p className="text-[12px] text-amber-400/75">⚠ No output selected.</p>
                    : <div className="flex flex-wrap gap-2">
                        {workflowConfig.outputs.map((out) => {
                          const opt = WORKFLOW_OUTPUT_OPTIONS.find((o) => o.value === out);
                          return opt ? (
                            <span key={out} className="flex items-center gap-1.5 rounded-full border border-secondary/20 bg-secondary/[0.07] px-2.5 py-1 text-[10px] font-semibold text-secondary">
                              <span>{opt.icon}</span>{opt.label}
                            </span>
                          ) : null;
                        })}
                      </div>
                  }
                </div>
              </div>
              {/* Data Readiness */}
              {(() => {
                const dp = dataPipelineState;
                const dpErrors = dp.validationIssues.filter(i => i.severity === 'error').length;
                const dpWarnings = dp.validationIssues.filter(i => i.severity === 'warning').length;
                const mappedCols = dp.mappings.filter(m => !m.ignored).length;
                const qScore = dp.qualityScore;
                const qColor = qScore >= 90 ? 'text-emerald-300' : qScore >= 70 ? 'text-amber-300' : 'text-red-400';
                const qLabel = qScore >= 90 ? 'Good' : qScore >= 70 ? 'Needs Review' : 'Poor';
                return (
                  <div className={`rounded-[16px] border p-4 ${dpErrors > 0 ? 'border-red-500/20 bg-red-500/[0.04]' : dpWarnings > 0 ? 'border-amber-400/20 bg-amber-400/[0.04]' : 'border-emerald-400/15 bg-emerald-400/[0.03]'}`}>
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">Data Readiness</p>
                      <button onClick={() => { setIsRunPreviewOpen(false); setIsDataPipelineOpen(true); }}
                        className="text-[11px] font-semibold text-accent/80 transition hover:text-accent">Open Data Pipeline →</button>
                    </div>
                    <div className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
                      <div><p className="text-white/45">Source</p><p className="font-semibold text-white truncate">{dp.sourceName}</p></div>
                      <div><p className="text-white/45">Rows</p><p className="font-semibold text-white">{dp.totalRows} <span className="text-white/35 text-[11px]">({dp.columns.length} cols)</span></p></div>
                      <div><p className="text-white/45">Data Quality</p><p className={`font-semibold ${qColor}`}>{qScore}/100 — {qLabel}</p></div>
                      <div><p className="text-white/45">Column Mapping</p><p className="font-semibold text-white">{mappedCols}/{dp.mappings.length} mapped</p></div>
                      <div><p className="text-white/45">Cleaned</p><p className={`font-semibold ${dp.cleaned ? 'text-emerald-300' : 'text-amber-300'}`}>{dp.cleaned ? '✓ Yes' : '✗ Not yet'}</p></div>
                      <div><p className="text-white/45">Validation</p>
                        <p className={`font-semibold ${dpErrors > 0 ? 'text-red-400' : dpWarnings > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
                          {dpErrors > 0 ? `${dpErrors} error${dpErrors > 1 ? 's' : ''}` : dpWarnings > 0 ? `${dpWarnings} warning${dpWarnings > 1 ? 's' : ''}` : '✓ Passed'}
                        </p>
                      </div>
                    </div>
                    {dpErrors > 0 && (
                      <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/[0.07] px-3 py-2 text-[11px] text-red-400">
                        ⛔ Fix {dpErrors} validation error{dpErrors > 1 ? 's' : ''} before running the workflow.
                      </p>
                    )}
                  </div>
                );
              })()}
              {/* Safety Check */}
              {(() => {
                const approvalAgents = agents.filter((a) => a.stepApproval?.requiresApproval);
                const highRiskAgents = agents.filter((a) => a.stepApproval?.riskLevel === 'High');
                const medRiskAgents  = agents.filter((a) => a.stepApproval?.riskLevel === 'Medium');
                const highestRisk: 'Low' | 'Medium' | 'High' = highRiskAgents.length > 0 ? 'High' : medRiskAgents.length > 0 ? 'Medium' : 'Low';
                const activeRulesCount = safetyRules.filter((r) => r.enabled).length;
                const blockingIssues = !safetyMode;
                return (
                  <div className={`rounded-[16px] border p-4 ${!safetyMode ? 'border-red-500/20 bg-red-500/[0.04]' : highestRisk === 'High' ? 'border-amber-400/20 bg-amber-400/[0.04]' : 'border-emerald-400/15 bg-emerald-400/[0.03]'}`}>
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">Safety Check</p>
                      <button onClick={() => { setIsRunPreviewOpen(false); setIsWorkflowSettingsOpen(true); setSettingsTab('safety'); }}
                        className="text-[11px] font-semibold text-accent/80 transition hover:text-accent">Configure →</button>
                    </div>
                    <div className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
                      <div>
                        <p className="text-white/45">Safety Mode</p>
                        <p className={`font-semibold ${safetyMode ? 'text-warning' : 'text-red-400'}`}>{safetyMode ? '🛡 ON' : '⚠ OFF'}</p>
                      </div>
                      <div>
                        <p className="text-white/45">Highest detected risk</p>
                        <p className={`font-semibold ${highestRisk === 'High' ? 'text-red-400' : highestRisk === 'Medium' ? 'text-amber-300' : 'text-emerald-300'}`}>{highestRisk}</p>
                      </div>
                      <div>
                        <p className="text-white/45">Actions requiring confirmation</p>
                        <p className="font-semibold text-white">{approvalAgents.length}</p>
                      </div>
                      <div>
                        <p className="text-white/45">Tools in read-only mode</p>
                        <p className="font-semibold text-sky-300">All by default</p>
                      </div>
                      <div>
                        <p className="text-white/45">Safety rules active</p>
                        <p className="font-semibold text-white">{activeRulesCount} / {safetyRules.length}</p>
                      </div>
                      <div>
                        <p className="text-white/45">Approval Guard</p>
                        <p className={`font-semibold ${approvalAgents.length > 0 ? 'text-amber-300' : 'text-white/40'}`}>{approvalAgents.length > 0 ? 'Active' : 'Not required'}</p>
                      </div>
                    </div>
                    {blockingIssues && (
                      <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/[0.07] px-3 py-2">
                        <p className="text-[11px] text-red-400">⚠ Safety Mode is OFF. Actions may run without confirmation. Re-enable before running in production.</p>
                      </div>
                    )}
                    {!blockingIssues && highestRisk === 'High' && (
                      <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.07] px-3 py-2">
                        <p className="text-[11px] text-amber-300">⚠ This workflow contains high-risk actions. Human confirmation is required before execution.</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Approval Overview */}
              {(() => {
                const approvalAgents = agents.filter((a) => a.stepApproval?.requiresApproval);
                const pending = approvalRequests.filter((r) => r.status === 'Pending');
                if (approvalAgents.length === 0 && pending.length === 0) return null;
                return (
                  <div className="rounded-[16px] border border-orange-400/20 bg-orange-400/[0.04] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">Approval Overview</p>
                      <button onClick={() => { setIsRunPreviewOpen(false); setIsApprovalRulesOpen(true); }}
                        className="text-[11px] font-semibold text-orange-300/80 transition hover:text-orange-300">Manage Rules →</button>
                    </div>
                    {pending.length > 0 && (
                      <div className="mb-3 rounded-xl border border-orange-400/20 bg-orange-400/[0.08] px-3 py-2">
                        <p className="text-[11px] font-semibold text-orange-300">⏳ {pending.length} pending approval{pending.length > 1 ? 's' : ''} — workflow will pause at these steps.</p>
                      </div>
                    )}
                    {approvalAgents.length > 0 && (
                      <div className="space-y-1.5">
                        {approvalAgents.map((a) => (
                          <div key={a.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/10 px-3 py-2">
                            <p className="text-[11px] font-semibold text-white">{a.label}</p>
                            <div className="flex items-center gap-2">
                              {a.stepApproval?.actionType && <span className="text-[10px] text-white/40">{a.stepApproval.actionType}</span>}
                              <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${a.stepApproval?.riskLevel === 'High' ? 'bg-red-400/15 text-red-400' : a.stepApproval?.riskLevel === 'Medium' ? 'bg-amber-400/15 text-amber-400' : 'bg-green-400/15 text-green-400'}`}>{a.stepApproval?.riskLevel}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Audit & Rollback */}
              {(() => {
                const recent = auditLogs.slice(0, 5);
                const reversibleCount = auditLogs.filter((l) => l.reversible && l.rollbackStatus === 'none').length;
                return (
                  <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.03] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">Audit &amp; Rollback</p>
                      <button onClick={() => { setIsRunPreviewOpen(false); setIsAuditLogOpen(true); }}
                        className="text-[11px] font-semibold text-accent/80 transition hover:text-accent">View Full Log →</button>
                    </div>
                    <div className="mb-3 grid grid-cols-3 gap-2 text-[11px]">
                      <div className="rounded-xl border border-white/[0.06] bg-black/10 px-3 py-2">
                        <p className="text-white/40">Log entries</p>
                        <p className="mt-0.5 font-bold text-white">{auditLogs.length}</p>
                      </div>
                      <div className="rounded-xl border border-white/[0.06] bg-black/10 px-3 py-2">
                        <p className="text-white/40">Reversible</p>
                        <p className="mt-0.5 font-bold text-emerald-300">{reversibleCount}</p>
                      </div>
                      <div className="rounded-xl border border-white/[0.06] bg-black/10 px-3 py-2">
                        <p className="text-white/40">Logging</p>
                        <p className={`mt-0.5 font-bold ${auditLoggingEnabled ? 'text-emerald-300' : 'text-red-400'}`}>{auditLoggingEnabled ? 'ON' : 'OFF'}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {recent.map((log) => (
                        <div key={log.id} className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-black/[0.15] px-3 py-1.5">
                          <div className="min-w-0">
                            <p className="truncate text-[10px] font-semibold text-white/80">{log.title}</p>
                            <p className="text-[9px] text-white/35">{log.timestamp} · {log.actorName}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${log.riskLevel === 'High' ? 'bg-red-400/15 text-red-400' : log.riskLevel === 'Medium' ? 'bg-amber-400/15 text-amber-400' : 'bg-emerald-400/15 text-emerald-400'}`}>{log.riskLevel}</span>
                            {log.reversible && log.rollbackStatus === 'none' && (
                              <span className="rounded-full border border-accent/30 px-1.5 py-0.5 text-[8px] font-medium text-accent/70">Reversible</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Step flow */}
              <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.03] p-4">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">Step flow</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {workflowConfig.steps.map((step, idx) => {
                    const agent = agents.find((a) => a.id === step.agentId);
                    const skipped = agent?.disabled;
                    return (
                      <React.Fragment key={step.id}>
                        {idx > 0 && <span className="text-white/20 text-xs">→</span>}
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${skipped ? 'border-white/[0.06] text-white/25 line-through' : 'border-white/[0.1] text-white/60'}`}>
                          {agent?.label ?? step.name}
                        </span>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
              {/* Branching rules */}
              {workflowConfig.branchRules.filter((r) => r.enabled).length > 0 && (
                <div className="rounded-[16px] border border-violet-400/15 bg-violet-400/[0.04] p-4">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">Branching Rules</p>
                  <div className="space-y-2">
                    {workflowConfig.branchRules.filter((r) => r.enabled).map((rule) => (
                      <div key={rule.id} className="rounded-xl border border-white/[0.06] bg-black/10 px-3.5 py-2.5">
                        <p className="text-[11px] font-semibold text-violet-200">{rule.name}</p>
                        <p className="mt-0.5 text-[11px] text-white/50">If {rule.metric} {rule.operator} {rule.value}</p>
                        <div className="mt-1.5 flex flex-wrap gap-2 text-[10px]">
                          <span><span className="rounded bg-green-500/15 px-1.5 py-px font-bold text-green-400">Then</span><span className="ml-1.5 text-white/55">{rule.thenAction}</span></span>
                          <span><span className="rounded bg-sky-500/15 px-1.5 py-px font-bold text-sky-400">Else</span><span className="ml-1.5 text-white/55">{rule.elseAction}</span></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Execution Plan */}
              <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.03] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">Execution Plan</p>
                  <button onClick={() => { setIsRunPreviewOpen(false); setIsWorkflowSettingsOpen(true); setSettingsTab('execution'); }}
                    className="text-[11px] font-semibold text-accent/80 transition hover:text-accent">Configure</button>
                </div>
                <div className="grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-white/45">Mode</p>
                    <p className="font-semibold text-white capitalize">{workflowExecution.executionMode === 'parallel' ? 'Parallel enabled' : 'Sequential'}</p>
                  </div>
                  <div>
                    <p className="text-white/45">Loop</p>
                    <p className={`font-semibold ${loopConfig.enabled && loopConfig.source !== 'none' ? 'text-accent' : 'text-white/40'}`}>
                      {loopConfig.enabled && loopConfig.source !== 'none'
                        ? `${loopConfig.totalItems} ${LOOP_SOURCE_OPTIONS.find((o) => o.value === loopConfig.source)?.label.replace('Loop through ', '') ?? loopConfig.source}`
                        : 'No loop'}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/45">Execution status</p>
                    <p className={`font-semibold capitalize ${
                      workflowExecution.status === 'running' ? 'text-emerald-300' :
                      workflowExecution.status === 'paused'  ? 'text-amber-300' :
                      workflowExecution.status === 'stopped' ? 'text-red-300' :
                      'text-white/40'
                    }`}>{workflowExecution.status.replace('-', ' ')}</p>
                  </div>
                </div>
                {/* Numbered execution plan steps */}
                <div className="mt-3 space-y-1.5">
                  {(() => {
                    const activeAgts = agents.filter((a) => !a.disabled);
                    const steps: Array<{ label: string; isParallel: boolean }> = [];
                    if (workflowExecution.executionMode === 'parallel') {
                      let i = 0;
                      while (i < activeAgts.length) {
                        const agent = activeAgts[i];
                        const group = parallelGroups.find((g) => g.agentIds.includes(agent.id));
                        if (group) {
                          const groupAgts = activeAgts.filter((a) => group.agentIds.includes(a.id));
                          const labels = groupAgts.map((a) => a.label).join(' + ');
                          steps.push({ label: labels, isParallel: true });
                          i += groupAgts.length;
                        } else {
                          steps.push({ label: agent.label, isParallel: false });
                          i++;
                        }
                      }
                    } else {
                      activeAgts.forEach((a) => steps.push({ label: a.label, isParallel: false }));
                    }
                    if (loopConfig.enabled && loopConfig.source !== 'none') {
                      const src = LOOP_SOURCE_OPTIONS.find((o) => o.value === loopConfig.source);
                      const loopStepIdx = Math.min(1, steps.length - 1);
                      steps.splice(loopStepIdx + 1, 0, { label: `↻ Loop through ${loopConfig.totalItems} ${src?.label.replace('Loop through ', '') ?? loopConfig.source}`, isParallel: false });
                    }
                    return steps.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-[12px]">
                        <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[9px] font-extrabold ${s.isParallel ? 'bg-accent/20 text-accent' : 'bg-white/[0.07] text-white/50'}`}>{i + 1}</span>
                        <span className={`${s.isParallel ? 'text-accent/80' : 'text-white/65'}`}>{s.label}</span>
                        {s.isParallel && <span className="rounded-full bg-accent/10 px-1.5 py-px text-[9px] font-bold text-accent/70">parallel</span>}
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Trigger & Schedule section */}
              <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.03] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">Trigger & Schedule</p>
                  <button
                    onClick={() => { setIsRunPreviewOpen(false); setIsWorkflowSettingsOpen(true); }}
                    className="text-[11px] font-semibold text-violet-300/80 transition hover:text-violet-300"
                  >Edit settings</button>
                </div>
                <div className="grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-white/45">Trigger</p>
                    <p className="font-semibold text-white capitalize">
                      {TRIGGER_OPTIONS.find((o) => o.value === workflowSchedule.triggerType)?.label ?? 'Manual'}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/45">Schedule</p>
                    <p className={`font-semibold ${workflowSchedule.scheduleEnabled ? 'text-violet-300' : 'text-white/40'}`}>
                      {workflowSchedule.triggerType === 'manual' ? 'N/A' : workflowSchedule.scheduleEnabled ? getScheduleSummary() : 'Off'}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/45">Next run</p>
                    <p className="font-semibold text-white">{getNextRunLabel() ?? (workflowSchedule.triggerType === 'manual' ? 'On demand' : 'Not scheduled')}</p>
                  </div>
                </div>
                {agents.some((a) => a.disabled) && (
                  <p className="mt-3 text-[11px] text-amber-400/80">
                    ⚠ {agents.filter((a) => a.disabled).length} disabled agent{agents.filter((a) => a.disabled).length > 1 ? 's' : ''} will be skipped during this run.
                  </p>
                )}
              </div>
            </div>
            {/* Cost Estimate */}
            {(() => {
              const currentPlan = PLANS.find((p) => p.id === usageState.currentPlan) ?? PLANS[0];
              const activeAgents = agents.filter((a) => !a.disabled);
              const est = estimateWorkflowCredits(activeAgents, currentPlan.creditsLimit, usageState.agentCreditsUsed);
              const creditsRemaining = currentPlan.creditsLimit - usageState.agentCreditsUsed;
              const runsUsedPct = Math.min(100, (usageState.workflowRunsUsed / currentPlan.workflowRunsLimit) * 100);
              const isAtRunLimit = usageState.workflowRunsUsed >= currentPlan.workflowRunsLimit;
              const isNearRunLimit = !isAtRunLimit && runsUsedPct >= 80;
              const riskColor = est.riskLevel === 'High' ? 'text-red-400' : est.riskLevel === 'Medium' ? 'text-amber-300' : 'text-emerald-400';
              const riskBorder = est.exceedsPlan || isAtRunLimit ? 'border-red-500/25 bg-red-500/[0.05]' : est.nearLimit || isNearRunLimit ? 'border-amber-400/20 bg-amber-400/[0.04]' : 'border-white/[0.07] bg-white/[0.03]';
              return (
                <div className="shrink-0 border-t border-white/[0.08] px-5 py-4">
                  <div className={`rounded-[14px] border p-3.5 ${riskBorder}`}>
                    {/* Header */}
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/40">Cost Estimate</p>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${est.riskLevel === 'High' ? 'border-red-400/30 bg-red-400/10 text-red-400' : est.riskLevel === 'Medium' ? 'border-amber-400/30 bg-amber-400/10 text-amber-300' : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-400'}`}>{est.riskLevel} Cost</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${usageState.currentPlan === 'free' ? 'border-sky-400/30 bg-sky-400/10 text-sky-300' : usageState.currentPlan === 'pro' ? 'border-violet-400/30 bg-violet-400/10 text-violet-300' : 'border-amber-400/30 bg-amber-400/10 text-amber-300'}`}>{currentPlan.name}</span>
                      </div>
                    </div>
                    {/* Reason */}
                    <p className="mb-2.5 text-[11px] text-white/50 leading-relaxed">{est.reason}</p>
                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-2 text-[11px] mb-2.5">
                      <div className="rounded-lg bg-white/[0.03] px-2 py-1.5"><p className="text-white/40 text-[10px]">Credits</p><p className={`font-bold ${est.exceedsPlan ? 'text-red-400' : riskColor}`}>{est.credits}</p></div>
                      <div className="rounded-lg bg-white/[0.03] px-2 py-1.5"><p className="text-white/40 text-[10px]">Tokens</p><p className="font-bold text-white">{est.tokens >= 1000 ? `${(est.tokens / 1000).toFixed(1)}k` : est.tokens}</p></div>
                      <div className="rounded-lg bg-white/[0.03] px-2 py-1.5"><p className="text-white/40 text-[10px]">Est. cost</p><p className="font-bold text-white">{est.estimatedCostUSD}</p></div>
                      <div className="rounded-lg bg-white/[0.03] px-2 py-1.5"><p className="text-white/40 text-[10px]">Balance</p><p className={`font-bold ${est.exceedsPlan ? 'text-red-400' : 'text-white'}`}>{creditsRemaining} cr</p></div>
                      <div className="rounded-lg bg-white/[0.03] px-2 py-1.5"><p className="text-white/40 text-[10px]">After run</p><p className={`font-bold ${est.exceedsPlan ? 'text-red-400' : 'text-white'}`}>{est.exceedsPlan ? '—' : `${creditsRemaining - est.credits} cr`}</p></div>
                      <div className="rounded-lg bg-white/[0.03] px-2 py-1.5"><p className="text-white/40 text-[10px]">Resets</p><p className="font-bold text-white">{usageState.resetDate}</p></div>
                    </div>
                    {/* Credit breakdown */}
                    {est.breakdown.length > 0 && (
                      <div className="mb-2.5 space-y-1">
                        {est.breakdown.map((b) => (
                          <div key={b.label} className="flex items-center justify-between text-[10px]">
                            <span className="text-white/45">{b.label}</span>
                            <span className="font-semibold text-white/70">+{b.credits} cr</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Runs progress bar */}
                    <div className="mb-2">
                      <div className="mb-1 flex items-center justify-between text-[10px]">
                        <span className="text-white/40">Monthly runs</span>
                        <span className={isAtRunLimit ? 'text-red-400 font-semibold' : isNearRunLimit ? 'text-amber-300' : 'text-white/60'}>{usageState.workflowRunsUsed} / {currentPlan.workflowRunsLimit}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                        <div className={`h-full rounded-full transition-all ${runsUsedPct >= 100 ? 'bg-red-500' : runsUsedPct >= 80 ? 'bg-amber-400' : 'bg-accent'}`} style={{ width: `${runsUsedPct}%` }} />
                      </div>
                    </div>
                    {/* Warning banners */}
                    {isAtRunLimit && <p className="mt-1.5 text-[11px] font-semibold text-red-400">⛔ Monthly run limit reached — upgrade to continue.</p>}
                    {isNearRunLimit && <p className="mt-1.5 text-[11px] text-amber-300">⚠ You are close to your monthly run limit ({currentPlan.workflowRunsLimit - usageState.workflowRunsUsed} remaining).</p>}
                    {est.exceedsPlan && !isAtRunLimit && <p className="mt-1.5 text-[11px] font-semibold text-red-400">⛔ Not enough credits — need {est.credits}, have {creditsRemaining}.</p>}
                    {est.nearLimit && !est.exceedsPlan && <p className="mt-1.5 text-[11px] text-amber-300">⚠ You are close to your monthly credit limit.</p>}
                    {/* Optimize Cost button */}
                    {(est.riskLevel !== 'Low' || costOptimized) && (
                      <button
                        onClick={() => setOptimizeCostOpen(true)}
                        className="mt-2.5 w-full rounded-[10px] border border-sky-400/20 bg-sky-400/[0.07] py-1.5 text-[11px] font-semibold text-sky-300 transition hover:bg-sky-400/15"
                      >
                        {costOptimized ? '✓ Cost optimized — view suggestions' : 'Optimize Cost'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Sticky footer */}
            {(() => {
              const _fp = PLANS.find((p) => p.id === usageState.currentPlan) ?? PLANS[0];
              const _fEst = estimateWorkflowCredits(agents.filter((a) => !a.disabled), _fp.creditsLimit, usageState.agentCreditsUsed);
              const _blocked = _fEst.exceedsPlan || usageState.workflowRunsUsed >= _fp.workflowRunsLimit;
              return (
                <div className="shrink-0 flex items-center justify-end gap-2 border-t border-white/[0.08] px-5 py-4">
                  <button onClick={() => setIsRunPreviewOpen(false)} className="rounded-[10px] border border-white/[0.1] px-4 py-2 text-sm font-semibold text-white/65 transition hover:bg-white/[0.05] hover:text-white">Cancel</button>
                  <button onClick={startWorkflowTest} className="rounded-[10px] border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-sm font-semibold text-sky-300 transition hover:bg-sky-400/15">Run Test</button>
                  {_blocked ? (
                    <button onClick={() => { setIsRunPreviewOpen(false); setUpgradeModal({ toPlan: 'pro', reason: _fEst.exceedsPlan ? 'credits' : 'run-limit', requiredCredits: _fEst.credits }); }} className="rounded-[10px] bg-accent px-4 py-2 text-sm font-bold text-[#0a0a14] transition hover:opacity-90">Upgrade Plan</button>
                  ) : (
                    <button onClick={startConfirmedWorkflow} className="rounded-[10px] bg-[#ffffff] px-4 py-2 text-sm font-bold text-ink transition hover:bg-[#f0f2ff]">Run Workflow</button>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {canvasContextMenu && (
        <ContextMenu
          x={canvasContextMenu.x}
          y={canvasContextMenu.y}
          dark
          onClose={() => setCanvasContextMenu(null)}
          items={[
            { label: 'Add Agent', icon: '＋', onClick: () => executeCanvasAction('add-agent') },
            { label: 'Add Sticky Note', icon: '📝', onClick: () => executeCanvasAction('add-note') },
            { label: 'Add Comment', icon: '💬', onClick: () => executeCanvasAction('add-comment') },
            { label: 'Upload & Process File', icon: '📁', onClick: () => { setCanvasContextMenu(null); setIsFileProcessingOpen(true); } },
            { separator: true, label: '', onClick: () => {} },
            { label: 'Tidy up workflow', icon: '⋮', onClick: () => executeCanvasAction('tidy') },
            { label: 'Fit view', icon: '⌖', onClick: () => executeCanvasAction('fit') },
            { label: 'Run Workflow', icon: '▶', onClick: () => executeCanvasAction('run') },
            { label: 'Run Test', icon: '◌', onClick: () => executeCanvasAction('test') },
            { label: 'Rename workflow', icon: '✎', onClick: () => executeCanvasAction('rename') },
            { separator: true, label: '', onClick: () => {} },
            { label: 'Zoom in', icon: '+', onClick: () => executeCanvasAction('zoom-in') },
            { label: 'Zoom out', icon: '-', onClick: () => executeCanvasAction('zoom-out') },
            { label: 'Reset zoom', icon: '1:1', onClick: () => executeCanvasAction('reset-zoom') },
            { label: `${showMinimap ? 'Hide' : 'Show'} minimap`, icon: '◫', onClick: () => executeCanvasAction('toggle-minimap') },
            { separator: true, label: '', onClick: () => {} },
            { label: 'Select all agents', icon: '☐', onClick: () => executeCanvasAction('select-all') },
            { label: 'Clear selection', icon: '✕', onClick: () => executeCanvasAction('clear-selection') },
            { separator: true, label: '', onClick: () => {} },
            { label: 'Version History', icon: '🕘', onClick: () => executeCanvasAction('version-history') },
            { label: 'Duplicate Workflow', icon: '⎘', onClick: () => executeCanvasAction('duplicate-workflow') },
            { label: 'Save workflow', icon: '✓', onClick: () => executeCanvasAction('save') },
          ]}
        />
      )}

      {chatContextMenu?.target === 'server' && (() => {
        const srv = chatServers.find((s) => s.id === chatContextMenu.id);
        if (!srv) return null;
        return (
          <ContextMenu
            x={chatContextMenu.x} y={chatContextMenu.y} dark
            onClose={() => setChatContextMenu(null)}
            items={[
              { label: 'Rename Server', icon: '✏️', onClick: () => setServerModal({ type: 'rename-server', serverId: srv.id, currentName: srv.name }) },
              { label: 'Edit Instructions', icon: '📋', onClick: () => setServerModal({ type: 'server-instructions', serverId: srv.id, currentInstructions: srv.instructions ?? '', serverName: srv.name }) },
              { label: 'Duplicate Server', icon: '⧉', onClick: () => duplicateServer(srv.id) },
              { separator: true, label: '', onClick: () => {} },
              { label: 'Delete Server', icon: '🗑', danger: true, onClick: () => { if (chatServers.length > 1) setServerModal({ type: 'confirm-delete-server', serverId: srv.id, serverName: srv.name }); } },
            ]}
          />
        );
      })()}

      {chatContextMenu?.target === 'channel' && (() => {
        const srv = chatServers.find((s) => s.id === chatContextMenu.serverId);
        const ch = srv?.channels.find((c) => c.id === chatContextMenu.id);
        if (!srv || !ch) return null;
        return (
          <ContextMenu
            x={chatContextMenu.x} y={chatContextMenu.y} dark
            onClose={() => setChatContextMenu(null)}
            items={[
              { label: 'Rename Channel', icon: '✏️', onClick: () => setServerModal({ type: 'rename-channel', serverId: srv.id, channelId: ch.id, currentName: ch.name }) },
              { label: 'Duplicate Channel', icon: '⧉', onClick: () => duplicateChannel(srv.id, ch.id) },
              { separator: true, label: '', onClick: () => {} },
              { label: 'Delete Channel', icon: '🗑', danger: true, onClick: () => { if (srv.channels.length > 1) setServerModal({ type: 'confirm-delete-channel', serverId: srv.id, channelId: ch.id, channelName: ch.name }); } },
            ]}
          />
        );
      })()}

      {chatContextMenu?.target === 'agent' && (() => {
        const agent = agents.find((a) => a.id === chatContextMenu.id);
        if (!agent) return null;
        return (
          <ContextMenu
            x={chatContextMenu.x} y={chatContextMenu.y} dark
            onClose={() => setChatContextMenu(null)}
            items={[
              { label: 'Rename Agent', icon: '✏️', onClick: () => setAgentEditModal({ type: 'rename-agent', agentId: agent.id, currentName: agent.label }) },
              { label: 'Edit Role', icon: '🏷', onClick: () => setAgentEditModal({ type: 'edit-role', agentId: agent.id, currentRole: agent.role, agentName: agent.label }) },
              { label: 'Edit Instructions', icon: '📋', onClick: () => setAgentEditModal({ type: 'edit-agent-instructions', agentId: agent.id, currentInstructions: agent.instructions ?? '', agentName: agent.label }) },
              { label: 'Duplicate Agent', icon: '⧉', onClick: () => { duplicateSelected(); setChatContextMenu(null); } },
              { separator: true, label: '', onClick: () => {} },
              { label: 'Remove from Team', icon: '✕', danger: true, onClick: () => { if (agents.length > 1) setAgentEditModal({ type: 'confirm-remove-agent', agentId: agent.id, agentName: agent.label }); } },
            ]}
          />
        );
      })()}

      {/* ── Server/channel modals ── */}
      {serverModal?.type === 'rename-server' && (
        <AppModal type="rename" title="Rename Server" initialValue={serverModal.currentName}
          onSave={(name) => { renameServer(serverModal.serverId, name); setServerModal(null); }}
          onCancel={() => setServerModal(null)} />
      )}
      {serverModal?.type === 'server-instructions' && (
        <AppModal type="text-edit" title={`Instructions — ${serverModal.serverName}`}
          initialValue={serverModal.currentInstructions}
          placeholder="e.g. Focus on sales, GP fee, VAT, and profit changes."
          helperText="These instructions apply to all agents in this server."
          onSave={(text) => { updateServerInstructions(serverModal.serverId, text); setServerModal(null); }}
          onCancel={() => setServerModal(null)} />
      )}
      {serverModal?.type === 'confirm-delete-server' && (
        <AppModal type="confirm" title="Delete Server"
          message={`Delete "${serverModal.serverName}"? All channels and messages will be removed.`}
          confirmLabel="Delete Server"
          onConfirm={() => { deleteServer(serverModal.serverId); setServerModal(null); }}
          onCancel={() => setServerModal(null)} />
      )}
      {serverModal?.type === 'rename-channel' && (
        <AppModal type="rename" title="Rename Channel" initialValue={serverModal.currentName}
          onSave={(name) => { renameChannel(serverModal.serverId, serverModal.channelId, name); setServerModal(null); }}
          onCancel={() => setServerModal(null)} />
      )}
      {serverModal?.type === 'confirm-delete-channel' && (
        <AppModal type="confirm" title="Delete Channel"
          message={`Delete "#${serverModal.channelName}"? Messages in this channel will be removed.`}
          confirmLabel="Delete Channel"
          onConfirm={() => { deleteChannel(serverModal.serverId, serverModal.channelId); setServerModal(null); }}
          onCancel={() => setServerModal(null)} />
      )}
      {serverModal?.type === 'project-instructions' && (
        <AppModal type="text-edit" title={`Instructions — ${serverModal.projectName}`}
          initialValue={serverModal.currentInstructions}
          placeholder="e.g. Always summarize in Thai. Focus on profit and cost warnings."
          helperText="These instructions apply to all AI agents in this project."
          onSave={(text) => { onUpdateProjectInstructions(activeProjectId, text); setServerModal(null); addSystemMessage('Project instructions updated'); }}
          onCancel={() => setServerModal(null)} />
      )}

      {/* ── Agent modals ── */}
      {agentEditModal?.type === 'rename-agent' && (
        <AppModal type="rename" title="Rename Agent" initialValue={agentEditModal.currentName}
          onSave={(name) => { renameAgent(agentEditModal.agentId, name); setAgentEditModal(null); }}
          onCancel={() => setAgentEditModal(null)} />
      )}
      {agentEditModal?.type === 'edit-role' && (
        <AppModal type="rename" title={`Edit Role — ${agentEditModal.agentName}`} initialValue={agentEditModal.currentRole}
          onSave={(role) => { updateAgentRole(agentEditModal.agentId, role); setAgentEditModal(null); }}
          onCancel={() => setAgentEditModal(null)} />
      )}
      {agentEditModal?.type === 'edit-agent-instructions' && (
        <AppModal type="text-edit" title={`Instructions — ${agentEditModal.agentName}`}
          initialValue={agentEditModal.currentInstructions}
          placeholder="e.g. Analyze profit changes, GP fee, VAT, and top menu items."
          helperText="These instructions guide this agent's behavior in the workflow."
          onSave={(text) => { updateAgentInstructions(agentEditModal.agentId, text); setAgentEditModal(null); }}
          onCancel={() => setAgentEditModal(null)} />
      )}
      {agentEditModal?.type === 'confirm-remove-agent' && (
        <AppModal type="confirm" title="Remove this agent?"
          message="This agent will be removed from the current workflow. You can add it back later."
          confirmLabel="Remove Agent"
          onConfirm={() => { removeSelected(); setAgentEditModal(null); }}
          onCancel={() => setAgentEditModal(null)} />
      )}
      {agentEditModal?.type === 'change-role-picker' && (() => {
        const { agentId, agentName, currentRole } = agentEditModal;
        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setAgentEditModal(null)}>
            <div className="w-[320px] rounded-2xl bg-[#13131e] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.5)]" onClick={(e) => e.stopPropagation()}>
              <h3 className="mb-1 font-heading text-[15px] font-extrabold text-ink">Change Role</h3>
              <p className="mb-4 text-[12px] text-muted">{agentName} — select a new role below</p>
              <div className="mb-4 grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map((role) => (
                  <button
                    key={role}
                    onClick={() => { updateAgentRole(agentId, role); setAgentEditModal(null); }}
                    className={`rounded-lg border px-3 py-2 text-left text-[11px] font-semibold transition ${
                      role === currentRole
                        ? 'border-accent/40 bg-accent/10 text-accent'
                        : 'border-white-07 text-muted hover:border-accent/25 hover:text-ink'
                    }`}
                  >{role}</button>
                ))}
              </div>
              <button onClick={() => setAgentEditModal(null)} className="w-full rounded-lg border border-white-07 py-2 text-[12px] text-muted transition hover:text-ink">Cancel</button>
            </div>
          </div>
        );
      })()}
      {agentEditModal?.type === 'view-run-history' && (() => {
        const { agentName } = agentEditModal;
        const history = [
          { date: '09:00 today',  result: 'Completed',            detail: '42 orders processed, no errors' },
          { date: 'Yesterday',    result: 'Completed',            detail: '38 orders processed, 1 duplicate removed' },
          { date: 'May 10',       result: 'Waiting for approval', detail: 'Report held — pending user approval' },
          { date: 'May 9',        result: 'Completed',            detail: '45 orders processed, low GP fee warning' },
          { date: 'May 8',        result: 'Completed',            detail: '40 orders processed' },
        ];
        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setAgentEditModal(null)}>
            <div className="w-[360px] rounded-2xl bg-[#13131e] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.5)]" onClick={(e) => e.stopPropagation()}>
              <h3 className="mb-1 font-heading text-[15px] font-extrabold text-ink">Run History</h3>
              <p className="mb-4 text-[12px] text-muted">{agentName}</p>
              <div className="mb-4 space-y-2">
                {history.map(({ date, result, detail }) => (
                  <div key={date} className="rounded-xl border border-white-07 px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-ink">{date}</span>
                      <span className={`text-[11px] font-bold ${result === 'Completed' ? 'text-green-400' : 'text-amber-400'}`}>{result}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted">{detail}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => setAgentEditModal(null)} className="w-full rounded-lg border border-white-07 py-2 text-[12px] text-muted transition hover:text-ink">Close</button>
            </div>
          </div>
        );
      })()}

      {/* ── Edit Agent Config modal ── */}
      {agentEditModal?.type === 'edit-config' && agentConfigDraft && (() => {
        const { agentId, agentName } = agentEditModal;
        const draft = agentConfigDraft;
        const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-subtle">{label}</label>
            {children}
          </div>
        );
        const inputCls = 'w-full rounded-xl border border-white-10 bg-[#0c0c14] px-3 py-2 text-sm text-ink outline-none transition focus:border-accent/40 focus:ring-4 focus:ring-accent/10';
        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm" onClick={() => { setAgentEditModal(null); setAgentConfigDraft(null); }}>
            <div
              className="w-full max-w-[560px] rounded-[20px] border border-white/[0.1] bg-[#0e0e1a] shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
              style={{ maxHeight: '88vh', overflowY: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
                <div>
                  <h3 className="font-heading text-[16px] font-extrabold text-white">Edit Agent Config</h3>
                  <p className="mt-0.5 text-[12px] text-white/50">{agentName}</p>
                </div>
                <button onClick={() => { setAgentEditModal(null); setAgentConfigDraft(null); }} className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.06] text-white/50 transition hover:bg-white/[0.12] hover:text-white">×</button>
              </div>
              <div className="grid gap-4 px-5 py-5 md:grid-cols-2">
                <Field label="Agent Name">
                  <input value={draft.name} onChange={(e) => setAgentConfigDraft((d) => d ? { ...d, name: e.target.value } : d)} className={inputCls} />
                </Field>
                <Field label="Role">
                  <input value={draft.role} onChange={(e) => setAgentConfigDraft((d) => d ? { ...d, role: e.target.value } : d)} className={inputCls} />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Goal">
                    <input value={draft.goal} onChange={(e) => setAgentConfigDraft((d) => d ? { ...d, goal: e.target.value } : d)} className={inputCls} placeholder="What is this agent trying to achieve?" />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="Instructions">
                    <textarea value={draft.instructions} onChange={(e) => setAgentConfigDraft((d) => d ? { ...d, instructions: e.target.value } : d)} rows={3} className={inputCls} placeholder="How should this agent behave?" />
                  </Field>
                </div>
                <Field label="Input">
                  <input value={draft.input} onChange={(e) => setAgentConfigDraft((d) => d ? { ...d, input: e.target.value } : d)} className={inputCls} placeholder="What data does it receive?" />
                </Field>
                <Field label="Output">
                  <input value={draft.output} onChange={(e) => setAgentConfigDraft((d) => d ? { ...d, output: e.target.value } : d)} className={inputCls} placeholder="What does it produce?" />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Model">
                    <div className="flex gap-2">
                      {MODEL_OPTIONS.map(({ value, label, desc }) => (
                        <button
                          key={value}
                          onClick={() => setAgentConfigDraft((d) => d ? { ...d, model: value } : d)}
                          title={desc}
                          className={`flex-1 rounded-xl border py-2.5 text-center text-[11px] font-bold transition ${
                            draft.model === value
                              ? 'border-accent/40 bg-accent/12 text-accent'
                              : 'border-white/[0.08] text-white/50 hover:border-white/[0.15] hover:text-white'
                          }`}
                        >{label}</button>
                      ))}
                    </div>
                    <p className="mt-1 text-[10px] text-white/40">{MODEL_OPTIONS.find((m) => m.value === draft.model)?.desc}</p>
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <div
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-white/[0.08] px-4 py-3 transition hover:border-white/[0.15]"
                    onClick={() => setAgentConfigDraft((d) => d ? { ...d, memory: !d.memory } : d)}
                  >
                    <div>
                      <p className="text-[12px] font-semibold text-white">Use project memory</p>
                      <p className="text-[10px] text-white/45">When enabled, this agent can use project instructions, previous outputs, and saved context.</p>
                    </div>
                    <div className={`relative ml-4 h-5 w-9 shrink-0 rounded-full transition-colors ${draft.memory ? 'bg-accent' : 'bg-white/10'}`}>
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${draft.memory ? 'left-[18px]' : 'left-0.5'}`} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-white/[0.08] px-5 py-4">
                <button onClick={() => { setAgentEditModal(null); setAgentConfigDraft(null); }} className="rounded-[10px] border border-white/[0.1] px-4 py-2 text-sm font-semibold text-white/60 transition hover:bg-white/[0.06] hover:text-white">Cancel</button>
                <button onClick={() => saveAgentConfig(agentId)} className="rounded-[10px] bg-[#ffffff] px-5 py-2 text-sm font-bold text-ink transition hover:bg-[#f0f2ff]">Save Config</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Edit Step Logic modal ── */}
      {editStepId && stepDraft && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm" onClick={() => { setEditStepId(null); setStepDraft(null); }}>
          <div className="w-full max-w-[480px] rounded-[20px] border border-white/[0.1] bg-[#0e0e1a] shadow-[0_24px_80px_rgba(0,0,0,0.55)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <div>
                <h3 className="font-heading text-[15px] font-extrabold text-white">Edit Step Logic</h3>
                <p className="mt-0.5 text-[12px] text-white/45">{stepDraft.name}</p>
              </div>
              <button onClick={() => { setEditStepId(null); setStepDraft(null); }} className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.06] text-white/50 transition hover:bg-white/[0.12] hover:text-white">×</button>
            </div>
            <div className="space-y-4 px-5 py-5">
              {/* Step name */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-white/40">Step Name</label>
                <input value={stepDraft.name} onChange={(e) => setStepDraft((d) => d ? { ...d, name: e.target.value } : d)}
                  className="w-full rounded-xl border border-white/[0.1] bg-[#0c0c14] px-3 py-2 text-sm text-white outline-none focus:border-accent/40" />
              </div>
              {/* Input from + type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-white/40">Input From</label>
                  <select value={stepDraft.inputFrom} onChange={(e) => setStepDraft((d) => d ? { ...d, inputFrom: e.target.value } : d)}
                    className="w-full rounded-xl border border-white/[0.1] bg-[#0c0c14] px-3 py-2 text-sm text-white outline-none focus:border-accent/40">
                    <option value="Workflow input">Workflow input</option>
                    {agents.map((a) => <option key={a.id} value={a.label}>{a.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-white/40">Input Type</label>
                  <input value={stepDraft.inputType} onChange={(e) => setStepDraft((d) => d ? { ...d, inputType: e.target.value } : d)}
                    className="w-full rounded-xl border border-white/[0.1] bg-[#0c0c14] px-3 py-2 text-sm text-white outline-none focus:border-accent/40"
                    placeholder="e.g. Cleaned sales data" />
                </div>
              </div>
              {/* Output to + type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-white/40">Output To</label>
                  <select value={stepDraft.outputTo} onChange={(e) => setStepDraft((d) => d ? { ...d, outputTo: e.target.value } : d)}
                    className="w-full rounded-xl border border-white/[0.1] bg-[#0c0c14] px-3 py-2 text-sm text-white outline-none focus:border-accent/40">
                    {agents.map((a) => <option key={a.id} value={a.label}>{a.label}</option>)}
                    <option value="Workflow output">Workflow output</option>
                    <option value="Chat">Chat</option>
                    <option value="Report">Report</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-white/40">Output Type</label>
                  <input value={stepDraft.outputType} onChange={(e) => setStepDraft((d) => d ? { ...d, outputType: e.target.value } : d)}
                    className="w-full rounded-xl border border-white/[0.1] bg-[#0c0c14] px-3 py-2 text-sm text-white outline-none focus:border-accent/40"
                    placeholder="e.g. Profit insights" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-white/[0.08] px-5 py-4">
              <button onClick={() => { setEditStepId(null); setStepDraft(null); }} className="rounded-[10px] border border-white/[0.1] px-4 py-2 text-sm font-semibold text-white/60 transition hover:bg-white/[0.06] hover:text-white">Cancel</button>
              <button onClick={saveStepLogic} className="rounded-[10px] bg-[#ffffff] px-5 py-2 text-sm font-bold text-ink transition hover:bg-[#f0f2ff]">Save Step</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Branch Rule modal ── */}
      {editBranchId && branchDraft && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm" onClick={() => { setEditBranchId(null); setBranchDraft(null); }}>
          <div className="w-full max-w-[480px] rounded-[20px] border border-white/[0.1] bg-[#0e0e1a] shadow-[0_24px_80px_rgba(0,0,0,0.55)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <div>
                <h3 className="font-heading text-[15px] font-extrabold text-white">{editBranchId === 'new' ? 'Add Branch Rule' : 'Edit Branch Rule'}</h3>
                <p className="mt-0.5 text-[12px] text-white/45">Set the condition and actions for this rule.</p>
              </div>
              <button onClick={() => { setEditBranchId(null); setBranchDraft(null); }} className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.06] text-white/50 transition hover:bg-white/[0.12] hover:text-white">×</button>
            </div>
            <div className="space-y-4 px-5 py-5">
              {/* Rule name */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-white/40">Rule Name</label>
                <input value={branchDraft.name} onChange={(e) => setBranchDraft((d) => d ? { ...d, name: e.target.value } : d)}
                  className="w-full rounded-xl border border-white/[0.1] bg-[#0c0c14] px-3 py-2 text-sm text-white outline-none focus:border-accent/40"
                  placeholder="e.g. Profit drop warning" />
              </div>
              {/* Condition row */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-white/40">Condition — If</label>
                <div className="grid grid-cols-3 gap-2">
                  <select value={branchDraft.metric} onChange={(e) => setBranchDraft((d) => d ? { ...d, metric: e.target.value } : d)}
                    className="rounded-xl border border-white/[0.1] bg-[#0c0c14] px-3 py-2 text-[11px] text-white outline-none focus:border-violet-400/40">
                    {BRANCH_METRICS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select value={branchDraft.operator} onChange={(e) => setBranchDraft((d) => d ? { ...d, operator: e.target.value } : d)}
                    className="rounded-xl border border-white/[0.1] bg-[#0c0c14] px-3 py-2 text-[11px] text-white outline-none focus:border-violet-400/40">
                    {BRANCH_OPERATORS.map((op) => <option key={op} value={op}>{op}</option>)}
                  </select>
                  <input value={branchDraft.value} onChange={(e) => setBranchDraft((d) => d ? { ...d, value: e.target.value } : d)}
                    className="rounded-xl border border-white/[0.1] bg-[#0c0c14] px-3 py-2 text-[11px] text-white outline-none focus:border-violet-400/40"
                    placeholder="10%" />
                </div>
              </div>
              {/* Then / Else */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-green-400/60">Then (do this)</label>
                  <select value={branchDraft.thenAction} onChange={(e) => setBranchDraft((d) => d ? { ...d, thenAction: e.target.value } : d)}
                    className="w-full rounded-xl border border-green-500/20 bg-green-500/[0.05] px-3 py-2 text-[11px] text-white outline-none focus:border-green-400/40">
                    {BRANCH_THEN_ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-sky-400/60">Else (otherwise)</label>
                  <select value={branchDraft.elseAction} onChange={(e) => setBranchDraft((d) => d ? { ...d, elseAction: e.target.value } : d)}
                    className="w-full rounded-xl border border-sky-500/20 bg-sky-500/[0.04] px-3 py-2 text-[11px] text-white outline-none focus:border-sky-400/40">
                    {BRANCH_ELSE_ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              {/* Enabled toggle */}
              <div className="flex cursor-pointer items-center justify-between rounded-xl border border-white/[0.08] px-4 py-3" onClick={() => setBranchDraft((d) => d ? { ...d, enabled: !d.enabled } : d)}>
                <p className="text-[12px] font-semibold text-white">Enable this rule</p>
                <div className={`relative h-5 w-9 rounded-full transition-colors ${branchDraft.enabled ? 'bg-violet-500' : 'bg-white/10'}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${branchDraft.enabled ? 'left-[18px]' : 'left-0.5'}`} />
                </div>
              </div>
              {/* Preview */}
              {branchDraft.metric && branchDraft.operator && branchDraft.value && (
                <div className="rounded-xl border border-violet-400/15 bg-violet-400/[0.04] px-4 py-3 text-[11px] text-white/60">
                  <span className="text-white/35">If </span><span className="text-violet-300">{branchDraft.metric} {branchDraft.operator} {branchDraft.value}</span>
                  <span className="text-white/35"> → </span><span className="text-green-400">{branchDraft.thenAction}</span>
                  <span className="text-white/35"> / else </span><span className="text-sky-400">{branchDraft.elseAction}</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-white/[0.08] px-5 py-4">
              <button onClick={() => { setEditBranchId(null); setBranchDraft(null); }} className="rounded-[10px] border border-white/[0.1] px-4 py-2 text-sm font-semibold text-white/60 transition hover:bg-white/[0.06] hover:text-white">Cancel</button>
              <button onClick={saveBranchRule} className="rounded-[10px] bg-[#ffffff] px-5 py-2 text-sm font-bold text-ink transition hover:bg-[#f0f2ff]">Save Rule</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Workflow Settings modal ── */}
      {isWorkflowSettingsOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm" onClick={() => setIsWorkflowSettingsOpen(false)}>
          <div className="w-full max-w-[580px] rounded-[20px] border border-white/[0.1] bg-[#0e0e1a] shadow-[0_24px_80px_rgba(0,0,0,0.55)]" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <div>
                <h3 className="font-heading text-[16px] font-extrabold text-white">Workflow Settings</h3>
                <p className="mt-0.5 text-[12px] text-white/45">{activeProject.name}</p>
              </div>
              <button onClick={() => setIsWorkflowSettingsOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.06] text-white/50 transition hover:bg-white/[0.12] hover:text-white">×</button>
            </div>

            {/* Tab bar */}
            <div className="flex overflow-x-auto border-b border-white/[0.08] px-5 scrollbar-none">
              {([
                { key: 'trigger',   label: 'Trigger' },
                { key: 'io',        label: 'Input / Output' },
                { key: 'steps',     label: 'Steps' },
                { key: 'branching', label: 'Branching' },
                { key: 'execution', label: 'Execution' },
                { key: 'safety',    label: '🛡 Safety' },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSettingsTab(key)}
                  className={`mr-4 shrink-0 border-b-2 pb-3 pt-3 text-[11px] font-bold transition ${
                    settingsTab === key
                      ? 'border-accent text-accent'
                      : 'border-transparent text-white/40 hover:text-white/65'
                  }`}
                >{label}</button>
              ))}
            </div>

            <div className="max-h-[65vh] overflow-y-auto px-5 py-5 space-y-5">

              {/* ── Tab: Trigger ── */}
              {settingsTab === 'trigger' && <>
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/40">Trigger</p>
                  <div className="grid grid-cols-2 gap-2">
                    {TRIGGER_OPTIONS.map(({ value, label, icon, desc }) => (
                      <button key={value} onClick={() => setWorkflowTrigger(value)} disabled={value === 'webhook'}
                        className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${workflowSchedule.triggerType === value ? 'border-violet-400/40 bg-violet-400/10' : value === 'webhook' ? 'cursor-not-allowed border-white/[0.05] opacity-40' : 'border-white/[0.08] hover:border-white/[0.15]'}`}>
                        <span className="mt-px text-base shrink-0">{icon}</span>
                        <div className="min-w-0">
                          <p className={`text-[11px] font-semibold leading-tight ${workflowSchedule.triggerType === value ? 'text-violet-300' : 'text-white/75'}`}>{label}</p>
                          <p className="mt-0.5 text-[10px] leading-relaxed text-white/35">{desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                {(workflowSchedule.triggerType === 'daily' || workflowSchedule.triggerType === 'weekly') && (
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/40">Schedule</p>
                      <div className="flex cursor-pointer items-center gap-2" onClick={toggleScheduleEnabled}>
                        <span className="text-[11px] font-semibold text-white/55">{workflowSchedule.scheduleEnabled ? 'Enabled' : 'Disabled'}</span>
                        <div className={`relative h-5 w-9 rounded-full transition-colors ${workflowSchedule.scheduleEnabled ? 'bg-violet-500' : 'bg-white/10'}`}>
                          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${workflowSchedule.scheduleEnabled ? 'left-[18px]' : 'left-0.5'}`} />
                        </div>
                      </div>
                    </div>
                    <div className={`space-y-3 rounded-xl border p-4 transition ${workflowSchedule.scheduleEnabled ? 'border-violet-400/20 bg-violet-400/[0.04]' : 'border-white/[0.06] opacity-50'}`}>
                      <div className="flex items-center gap-3">
                        <label className="shrink-0 w-14 text-[11px] font-semibold text-white/55">Time</label>
                        <input type="time" value={workflowSchedule.time} onChange={(e) => setWorkflowSchedule((prev) => ({ ...prev, time: e.target.value }))} disabled={!workflowSchedule.scheduleEnabled} className="rounded-lg border border-white/[0.1] bg-[#0c0c14] px-3 py-1.5 text-sm text-white outline-none focus:border-violet-400/40 disabled:cursor-not-allowed" />
                        <span className="text-[11px] text-white/35">{workflowSchedule.timezone}</span>
                      </div>
                      {workflowSchedule.triggerType === 'weekly' && (
                        <div className="flex items-center gap-3">
                          <label className="shrink-0 w-14 text-[11px] font-semibold text-white/55">Days</label>
                          <div className="flex flex-wrap gap-1.5">
                            {WEEKDAYS.map((day) => (
                              <button key={day} onClick={() => toggleScheduleWeekday(day)} disabled={!workflowSchedule.scheduleEnabled}
                                className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold transition disabled:cursor-not-allowed ${workflowSchedule.weekdays.includes(day) ? 'border-violet-400/40 bg-violet-400/15 text-violet-300' : 'border-white/[0.08] text-white/40 hover:border-white/[0.15] hover:text-white/65'}`}>{day}</button>
                            ))}
                          </div>
                        </div>
                      )}
                      {workflowSchedule.scheduleEnabled && (
                        <p className="text-[11px] font-semibold text-violet-300/80">
                          {workflowSchedule.triggerType === 'daily' ? `Every day at ${workflowSchedule.time} (${workflowSchedule.timezone})` : workflowSchedule.weekdays.length > 0 ? `Every ${workflowSchedule.weekdays.join(', ')} at ${workflowSchedule.time} (${workflowSchedule.timezone})` : 'Select at least one weekday'}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {getNextRunLabel() && (
                  <div className="rounded-xl border border-violet-400/15 bg-violet-400/[0.05] px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-violet-400/60">Next run</p>
                    <p className="mt-1 text-[13px] font-semibold text-violet-200">{getNextRunLabel()}</p>
                  </div>
                )}
              </>}

              {/* ── Tab: Input / Output ── */}
              {settingsTab === 'io' && <>
                <div>
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white/40">Workflow Inputs</p>
                  <p className="mb-3 text-[11px] text-white/35">Choose what data starts this workflow.</p>
                  <div className="grid grid-cols-2 gap-2">
                    {WORKFLOW_INPUT_OPTIONS.map(({ value, label, icon, desc }) => {
                      const active = workflowConfig.inputs.includes(value);
                      return (
                        <button key={value} onClick={() => toggleWorkflowInput(value)}
                          className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${active ? 'border-accent/35 bg-accent/[0.08]' : 'border-white/[0.08] hover:border-white/[0.15]'}`}>
                          <span className="mt-px text-base shrink-0">{icon}</span>
                          <div className="min-w-0">
                            <p className={`text-[11px] font-semibold leading-tight ${active ? 'text-accent' : 'text-white/75'}`}>{label}</p>
                            <p className="mt-0.5 text-[10px] leading-relaxed text-white/30">{desc}</p>
                          </div>
                          {active && <span className="ml-auto shrink-0 text-[10px] font-bold text-accent">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                  {workflowConfig.inputs.length === 0 && <p className="mt-2 text-[11px] text-amber-400/75">⚠ No input selected. Workflow cannot run.</p>}
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white/40">Workflow Outputs</p>
                  <p className="mb-3 text-[11px] text-white/35">Choose what this workflow produces.</p>
                  <div className="grid grid-cols-2 gap-2">
                    {WORKFLOW_OUTPUT_OPTIONS.map(({ value, label, icon, desc }) => {
                      const active = workflowConfig.outputs.includes(value);
                      return (
                        <button key={value} onClick={() => toggleWorkflowOutput(value)}
                          className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${active ? 'border-secondary/35 bg-secondary/[0.07]' : 'border-white/[0.08] hover:border-white/[0.15]'}`}>
                          <span className="mt-px text-base shrink-0">{icon}</span>
                          <div className="min-w-0">
                            <p className={`text-[11px] font-semibold leading-tight ${active ? 'text-secondary' : 'text-white/75'}`}>{label}</p>
                            <p className="mt-0.5 text-[10px] leading-relaxed text-white/30">{desc}</p>
                          </div>
                          {active && <span className="ml-auto shrink-0 text-[10px] font-bold text-secondary">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                  {workflowConfig.outputs.length === 0 && <p className="mt-2 text-[11px] text-amber-400/75">⚠ No output selected.</p>}
                </div>
              </>}

              {/* ── Tab: Steps ── */}
              {settingsTab === 'steps' && (
                <div className="space-y-2">
                  <p className="text-[11px] text-white/35 mb-3">Each step shows what an agent receives and what it produces. Click Edit to change the step logic.</p>
                  {workflowConfig.steps.map((step, idx) => {
                    const agent = agents.find((a) => a.id === step.agentId);
                    return (
                      <div key={step.id} className={`rounded-xl border px-4 py-3 ${agent?.disabled ? 'border-white/[0.05] opacity-50' : 'border-white/[0.08]'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="grid h-5 w-5 place-items-center rounded-full bg-white/[0.08] text-[9px] font-extrabold text-white">{idx + 1}</span>
                            <span className="text-[11px] font-bold text-white">{step.name}</span>
                            {agent?.disabled && <span className="rounded-full bg-white/[0.07] px-1.5 py-px text-[8px] font-bold text-white/40">SKIP</span>}
                          </div>
                          <button onClick={() => { openEditStep(step.id); setIsWorkflowSettingsOpen(false); }} className="text-[10px] font-semibold text-accent/75 transition hover:text-accent">Edit</button>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                          <div><span className="text-white/35">From: </span><span className="text-white/65">{step.inputFrom}</span></div>
                          <div><span className="text-white/35">To: </span><span className="text-white/65">{step.outputTo}</span></div>
                          <div><span className="text-white/35">In: </span><span className="text-white/55 italic">{step.inputType}</span></div>
                          <div><span className="text-white/35">Out: </span><span className="text-white/55 italic">{step.outputType}</span></div>
                        </div>
                      </div>
                    );
                  })}
                  {/* Step flow summary */}
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 mt-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-white/30 mb-2">Flow</p>
                    <p className="text-[11px] text-white/50 leading-relaxed">
                      {workflowConfig.steps.filter((s) => !agents.find((a) => a.id === s.agentId)?.disabled).map((s) => {
                        const a = agents.find((ag) => ag.id === s.agentId);
                        return a?.label ?? s.name;
                      }).join(' → ')}
                    </p>
                  </div>
                </div>
              )}

              {/* ── Tab: Branching ── */}
              {settingsTab === 'branching' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-white/35">Rules that change the workflow path based on data results.</p>
                    <button onClick={openAddBranch} className="rounded-lg border border-accent/25 bg-accent/[0.08] px-3 py-1.5 text-[10px] font-bold text-accent transition hover:bg-accent/15">+ Add Rule</button>
                  </div>
                  {workflowConfig.branchRules.length === 0 && (
                    <div className="rounded-xl border border-dashed border-white/[0.08] px-4 py-6 text-center">
                      <p className="text-[12px] text-white/30">No branching rules yet.</p>
                      <p className="mt-1 text-[11px] text-white/20">Add a rule to run different paths based on conditions.</p>
                    </div>
                  )}
                  {workflowConfig.branchRules.map((rule) => (
                    <div key={rule.id} className={`rounded-xl border px-4 py-3 ${rule.enabled ? 'border-violet-400/20 bg-violet-400/[0.04]' : 'border-white/[0.06] opacity-60'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`relative h-4 w-7 cursor-pointer rounded-full transition-colors ${rule.enabled ? 'bg-violet-500' : 'bg-white/10'}`} onClick={() => toggleBranchRule(rule.id)}>
                            <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all ${rule.enabled ? 'left-[14px]' : 'left-0.5'}`} />
                          </div>
                          <span className="text-[11px] font-bold text-white">{rule.name || 'Unnamed rule'}</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => openEditBranch(rule.id)} className="text-[10px] font-semibold text-accent/75 transition hover:text-accent">Edit</button>
                          <button onClick={() => deleteBranchRule(rule.id)} className="text-[10px] font-semibold text-red-400/60 transition hover:text-red-400">Delete</button>
                        </div>
                      </div>
                      <div className="space-y-1 text-[11px]">
                        <p><span className="text-white/35">If </span><span className="text-white/70">{rule.metric} {rule.operator} {rule.value}</span></p>
                        <p><span className="rounded bg-green-500/15 px-1.5 py-px text-[10px] font-bold text-green-400">Then</span><span className="ml-2 text-white/60">{rule.thenAction}</span></p>
                        <p><span className="rounded bg-sky-500/15 px-1.5 py-px text-[10px] font-bold text-sky-400">Else</span><span className="ml-2 text-white/60">{rule.elseAction}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Tab: Execution ── */}
              {settingsTab === 'execution' && (
                <div className="space-y-5">
                  {/* Execution Mode */}
                  <div>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/40">Execution Mode</p>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { value: 'sequential', label: 'Sequential', icon: '▶▶', desc: 'Each agent waits for the previous step to finish before starting.' },
                        { value: 'parallel',   label: 'Parallel enabled', icon: '⇉', desc: 'Agents in a parallel group run at the same time.' },
                      ] as const).map(({ value, label, icon, desc }) => (
                        <button key={value}
                          onClick={() => setWorkflowExecution((prev) => ({ ...prev, executionMode: value, parallelEnabled: value === 'parallel' }))}
                          className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${workflowExecution.executionMode === value ? 'border-accent/40 bg-accent/10' : 'border-white/[0.08] hover:border-white/[0.15]'}`}>
                          <span className="mt-px text-sm shrink-0">{icon}</span>
                          <div>
                            <p className={`text-[11px] font-semibold ${workflowExecution.executionMode === value ? 'text-accent' : 'text-white/75'}`}>{label}</p>
                            <p className="mt-0.5 text-[10px] text-white/35">{desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Parallel Groups (shown only in parallel mode) */}
                  {workflowExecution.executionMode === 'parallel' && (
                    <div>
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/40">Parallel Groups</p>
                      <p className="mb-3 text-[11px] text-white/35">Agents in the same group run simultaneously. Other agents remain sequential.</p>
                      {parallelGroups.map((group) => (
                        <div key={group.id} className="mb-2 rounded-xl border border-accent/15 bg-accent/[0.04] px-4 py-3">
                          <p className="mb-2 text-[11px] font-bold text-accent/80">{group.name}</p>
                          <div className="flex flex-wrap gap-2">
                            {agents.filter((a) => !a.disabled).map((agent) => {
                              const inGroup = group.agentIds.includes(agent.id);
                              return (
                                <button key={agent.id}
                                  onClick={() => setParallelGroups((prev) => prev.map((g) => g.id !== group.id ? g : {
                                    ...g,
                                    agentIds: inGroup ? g.agentIds.filter((id) => id !== agent.id) : [...g.agentIds, agent.id],
                                  }))}
                                  className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold transition ${inGroup ? 'border-accent/35 bg-accent/10 text-accent' : 'border-white/[0.08] text-white/40 hover:border-white/[0.2] hover:text-white/65'}`}>
                                  {agent.icon} {agent.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Loop Settings */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/40">Loop / Repeat</p>
                      <div className={`relative h-5 w-9 cursor-pointer rounded-full transition-colors ${loopConfig.enabled ? 'bg-accent' : 'bg-white/10'}`}
                        onClick={() => setLoopConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}>
                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${loopConfig.enabled ? 'left-[18px]' : 'left-0.5'}`} />
                      </div>
                    </div>
                    {loopConfig.enabled && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          {LOOP_SOURCE_OPTIONS.map(({ value, label, icon, example }) => (
                            <button key={value}
                              onClick={() => setLoopConfig((prev) => ({ ...prev, source: value }))}
                              className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-left transition ${loopConfig.source === value ? 'border-accent/40 bg-accent/10' : 'border-white/[0.08] hover:border-white/[0.15]'}`}>
                              <span className="shrink-0 text-sm">{icon}</span>
                              <div>
                                <p className={`text-[10px] font-semibold leading-tight ${loopConfig.source === value ? 'text-accent' : 'text-white/70'}`}>{label}</p>
                                <p className="mt-px text-[9px] text-white/30">{example}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                        {loopConfig.source !== 'none' && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-white/35">Total Items</label>
                              <input type="number" min={1} max={9999}
                                value={loopConfig.totalItems}
                                onChange={(e) => setLoopConfig((prev) => ({ ...prev, totalItems: Math.max(1, parseInt(e.target.value) || 1) }))}
                                className="w-full rounded-xl border border-white/[0.1] bg-[#0c0c14] px-3 py-2 text-sm text-white outline-none focus:border-accent/40" />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-white/35">Max Per Run</label>
                              <input type="number" min={1} max={9999}
                                value={loopConfig.maxItems}
                                onChange={(e) => setLoopConfig((prev) => ({ ...prev, maxItems: Math.max(1, parseInt(e.target.value) || 1) }))}
                                className="w-full rounded-xl border border-white/[0.1] bg-[#0c0c14] px-3 py-2 text-sm text-white outline-none focus:border-accent/40" />
                            </div>
                          </div>
                        )}
                        <div className="flex cursor-pointer items-center justify-between rounded-xl border border-white/[0.08] px-4 py-3"
                          onClick={() => setLoopConfig((prev) => ({ ...prev, skipFailedItems: !prev.skipFailedItems }))}>
                          <p className="text-[12px] font-semibold text-white">Skip failed items</p>
                          <div className={`relative h-5 w-9 rounded-full transition-colors ${loopConfig.skipFailedItems ? 'bg-accent' : 'bg-white/10'}`}>
                            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${loopConfig.skipFailedItems ? 'left-[18px]' : 'left-0.5'}`} />
                          </div>
                        </div>
                        {/* Progress summary */}
                        {loopConfig.currentItem > 0 && (
                          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                            <div className="mb-1.5 flex items-center justify-between text-[11px]">
                              <span className="text-white/50">Progress</span>
                              <span className="font-semibold text-white">{loopConfig.currentItem} / {loopConfig.totalItems}</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.min(100, (loopConfig.currentItem / loopConfig.totalItems) * 100)}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Tab: Safety ── */}
              {settingsTab === 'safety' && (
                <div className="space-y-4">
                  {/* Safety Mode toggle */}
                  <div className={`rounded-xl border px-4 py-3 ${safetyMode ? 'border-warning/20 bg-warning/[0.05]' : 'border-red-500/20 bg-red-500/[0.04]'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[12px] font-bold text-white">Safety Mode</p>
                        <p className="text-[11px] text-white/45 mt-0.5">{safetyMode ? 'ON — external actions require approval' : 'OFF — actions may run without confirmation'}</p>
                      </div>
                      <button
                        onClick={() => safetyMode ? setSafetyOffConfirmOpen(true) : (setSafetyMode(true), addSystemMessage('System: Safety Mode enabled for this project.'), setToast('Safety Mode enabled'), addAuditLog({ actorType: 'User', actorName: 'You', actionType: 'safety-enabled', title: 'Safety Mode enabled', description: 'Safety Mode turned ON. All external actions require confirmation.', workflowName, riskLevel: 'Low', status: 'Success', reversible: true }))}
                        className={`relative h-6 w-11 rounded-full transition-colors ${safetyMode ? 'bg-warning' : 'bg-red-500/60'}`}
                      >
                        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${safetyMode ? 'left-[26px]' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>

                  {/* Safety rules list */}
                  <div>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/40">Safety Rules</p>
                    <div className="space-y-2">
                      {safetyRules.map((rule) => (
                        <div key={rule.id} className={`rounded-xl border px-4 py-3 transition ${rule.enabled ? 'border-white/[0.08] bg-white/[0.03]' : 'border-white/[0.04] opacity-50'}`}>
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold text-white truncate">{rule.title}</p>
                              <p className="text-[10px] text-white/40 mt-0.5">{rule.description}</p>
                            </div>
                            <div
                              className={`relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${rule.enabled ? 'bg-accent' : 'bg-white/10'}`}
                              onClick={() => setSafetyRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, enabled: !r.enabled } : r))}
                            >
                              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${rule.enabled ? 'left-[18px]' : 'left-0.5'}`} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Default tool access */}
                  <div className="rounded-xl border border-sky-400/15 bg-sky-400/[0.04] px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-white/40 mb-2">Default Tool Access</p>
                    <div className="flex gap-2">
                      {(['Read only', 'Read & write'] as const).map((opt) => (
                        <button key={opt}
                          className={`flex-1 rounded-xl border py-2 text-[11px] font-bold transition ${opt === 'Read only' ? 'border-sky-400/30 bg-sky-400/10 text-sky-300' : 'border-white/[0.08] text-white/40 hover:border-white/[0.15]'}`}
                        >{opt === 'Read only' ? '🔒 Read only' : '✏ Read & write'}</button>
                      ))}
                    </div>
                    <p className="mt-2 text-[10px] text-white/35">All new tools start as read-only. Change per-agent in Tool Access.</p>
                  </div>

                  {/* Risk overview */}
                  {(() => {
                    const approval = agents.filter((a) => a.stepApproval?.requiresApproval);
                    const highRisk = agents.filter((a) => a.stepApproval?.riskLevel === 'High');
                    return (
                      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-white/40 mb-2">Risk Summary</p>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div><span className="text-white/40">Agents needing approval</span><p className="font-bold text-white mt-0.5">{approval.length}</p></div>
                          <div><span className="text-white/40">High-risk steps</span><p className="font-bold text-red-400 mt-0.5">{highRisk.length}</p></div>
                          <div><span className="text-white/40">Pending approvals</span><p className="font-bold text-amber-400 mt-0.5">{approvalRequests.length}</p></div>
                          <div><span className="text-white/40">Safety rules active</span><p className="font-bold text-green-400 mt-0.5">{safetyRules.filter((r) => r.enabled).length}/{safetyRules.length}</p></div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Audit Logging toggle */}
                  <div className={`rounded-xl border px-4 py-3 ${auditLoggingEnabled ? 'border-accent/20 bg-accent/[0.04]' : 'border-white/[0.07] bg-white/[0.02]'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[12px] font-bold text-white">Audit Logging</p>
                        <p className="text-[11px] text-white/45 mt-0.5">{auditLoggingEnabled ? 'All actions are recorded with before/after state.' : 'Logging is OFF — actions are not tracked.'}</p>
                      </div>
                      <div
                        className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${auditLoggingEnabled ? 'bg-accent' : 'bg-white/10'}`}
                        onClick={() => setAuditLoggingEnabled((v) => !v)}
                      >
                        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${auditLoggingEnabled ? 'left-[26px]' : 'left-1'}`} />
                      </div>
                    </div>
                    {auditLoggingEnabled && (
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-[11px] text-white/40">{auditLogs.length} entries · {auditLogs.filter((l) => l.reversible).length} reversible</p>
                        <button onClick={() => { setIsWorkflowSettingsOpen(false); setIsAuditLogOpen(true); }} className="text-[11px] font-semibold text-accent/80 transition hover:text-accent">View Log →</button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Validation warnings (shown in all tabs) */}
              {(() => {
                const warns = getWorkflowWarnings();
                if (warns.length === 0) return null;
                return (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-4 py-3 space-y-1">
                    {warns.map((w, i) => <p key={i} className="text-[11px] text-amber-300/80">⚠ {w}</p>)}
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-white/[0.08] px-5 py-4">
              <button onClick={() => setIsWorkflowSettingsOpen(false)} className="rounded-[10px] border border-white/[0.1] px-4 py-2 text-sm font-semibold text-white/60 transition hover:bg-white/[0.06] hover:text-white">Close</button>
              <button onClick={() => { setIsWorkflowSettingsOpen(false); setToast('Workflow settings saved'); }} className="rounded-[10px] bg-[#ffffff] px-5 py-2 text-sm font-bold text-ink transition hover:bg-[#f0f2ff]">Save Settings</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Version History modal ── */}
      {isVersionHistoryOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onClick={() => { setIsVersionHistoryOpen(false); setVersionPreviewId(null); setRestoreConfirmVersionId(null); }}>
          <div className="flex w-full max-w-[640px] flex-col rounded-[20px] border border-white/[0.1] bg-[#0e0e1a] shadow-[0_24px_80px_rgba(0,0,0,0.55)]" style={{ maxHeight: 'min(88vh, calc(100vh - 32px))' }} onClick={(e) => e.stopPropagation()}>
            <div className="shrink-0 flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <div>
                <h3 className="font-heading text-[16px] font-extrabold text-white">Workflow Version History</h3>
                <p className="mt-0.5 text-[12px] text-white/45">{activeProject.name} · {versions.length} versions</p>
              </div>
              <button onClick={() => { setIsVersionHistoryOpen(false); setVersionPreviewId(null); setRestoreConfirmVersionId(null); }} className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.06] text-white/50 transition hover:bg-white/[0.12] hover:text-white">×</button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-2">
              {versions.map((ver) => {
                const isPreviewing = versionPreviewId === ver.id;
                const isRestoreTarget = restoreConfirmVersionId === ver.id;
                return (
                  <div key={ver.id}>
                    <div className={`rounded-[14px] border px-4 py-3.5 transition ${ver.isCurrent ? 'border-accent/25 bg-accent/[0.05]' : 'border-white/[0.07] bg-white/[0.02] hover:border-white/[0.13]'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-extrabold text-white/50">v{ver.version}</span>
                            {ver.isCurrent && <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-px text-[9px] font-bold text-accent">Current</span>}
                            <span className="text-[12px] font-semibold text-white">{ver.title}</span>
                          </div>
                          <p className="mt-1 text-[11px] text-white/35">{ver.timestamp} · by {ver.author}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            onClick={() => setVersionPreviewId(isPreviewing ? null : ver.id)}
                            className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-bold transition ${isPreviewing ? 'border-accent/30 bg-accent/10 text-accent' : 'border-white/[0.1] text-white/50 hover:border-white/[0.2] hover:text-white/75'}`}>
                            {isPreviewing ? 'Hide' : 'Preview'}
                          </button>
                          {!ver.isCurrent && (
                            <button
                              onClick={() => setRestoreConfirmVersionId(isRestoreTarget ? null : ver.id)}
                              className="rounded-lg border border-amber-400/20 bg-amber-400/[0.06] px-2.5 py-1.5 text-[10px] font-bold text-amber-300 transition hover:bg-amber-400/10">
                              Restore
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Inline preview panel */}
                      {isPreviewing && (
                        <div className="mt-3 rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3 space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-white/30">Snapshot Preview</p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                            <div><span className="text-white/35">Agents </span><span className="font-semibold text-white">{ver.snapshot.agentCount}</span></div>
                            <div><span className="text-white/35">Connections </span><span className="font-semibold text-white">{ver.snapshot.connectionCount}</span></div>
                            <div><span className="text-white/35">Inputs </span><span className="font-semibold text-white">{ver.snapshot.inputSummary}</span></div>
                            <div><span className="text-white/35">Outputs </span><span className="font-semibold text-white">{ver.snapshot.outputSummary}</span></div>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-white/30 mb-1">Agent list</p>
                            <div className="flex flex-wrap gap-1.5">
                              {ver.snapshot.agentLabels.map((label) => (
                                <span key={label} className="rounded-full border border-white/[0.08] px-2.5 py-0.5 text-[10px] text-white/55">{label}</span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-white/30 mb-0.5">Instructions summary</p>
                            <p className="text-[11px] text-white/50">{ver.snapshot.instructionsSummary}</p>
                          </div>
                        </div>
                      )}
                      {/* Inline restore confirmation */}
                      {isRestoreTarget && (
                        <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] px-4 py-3">
                          <p className="text-[12px] font-semibold text-amber-200">Restore Version {ver.version}?</p>
                          <p className="mt-1 text-[11px] text-white/45">Your current workflow will be auto-saved as a new version before restoring.</p>
                          <div className="mt-3 flex items-center gap-2">
                            <button onClick={() => setRestoreConfirmVersionId(null)} className="rounded-lg border border-white/[0.1] px-3 py-1.5 text-[11px] font-semibold text-white/55 transition hover:text-white/80">Cancel</button>
                            <button onClick={confirmRestoreVersion} className="rounded-lg bg-amber-400 px-4 py-1.5 text-[11px] font-bold text-black transition hover:bg-amber-300">↩ Restore Version {ver.version}</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="shrink-0 flex items-center justify-between border-t border-white/[0.08] px-5 py-4">
              <button onClick={saveWorkflow} className="rounded-[10px] border border-accent/25 bg-accent/[0.08] px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/15">+ Save Current Version</button>
              <button onClick={() => { setIsVersionHistoryOpen(false); setVersionPreviewId(null); setRestoreConfirmVersionId(null); }} className="rounded-[10px] border border-white/[0.1] px-4 py-2 text-sm font-semibold text-white/60 transition hover:bg-white/[0.06] hover:text-white">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Stop Workflow Confirmation modal ── */}
      {stopConfirmOpen && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm" onClick={() => setStopConfirmOpen(false)}>
          <div className="w-full max-w-[400px] rounded-[20px] border border-white/[0.1] bg-[#0e0e1a] shadow-[0_24px_80px_rgba(0,0,0,0.6)]" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-white/[0.08] px-5 py-4">
              <h3 className="font-heading text-[16px] font-extrabold text-white">Stop workflow?</h3>
              <p className="mt-1 text-[12px] text-white/45">This will stop the current workflow run.</p>
            </div>
            <div className="px-5 py-5">
              <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] px-4 py-3">
                <p className="text-[12px] leading-relaxed text-red-300/80">
                  Completed steps will remain in the run history, but unfinished steps will not continue. You can restart the workflow manually at any time.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-white/[0.08] px-5 py-4">
              <button onClick={() => setStopConfirmOpen(false)} className="rounded-[10px] border border-white/[0.1] px-4 py-2 text-sm font-semibold text-white/60 transition hover:bg-white/[0.06] hover:text-white">Cancel</button>
              <button onClick={confirmStopWorkflow} className="rounded-[10px] bg-red-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-red-400">⏹ Stop Workflow</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Workflow Dependency Check modal ── */}
      {isDepCheckOpen && (() => {
        const errors   = validationIssues.filter((i) => i.severity === 'error');
        const warnings = validationIssues.filter((i) => i.severity === 'warning');
        const infos    = validationIssues.filter((i) => i.severity === 'info');
        const isReady  = errors.length === 0;
        const handleAction = (issue: ValidationIssue) => {
          if (!issue.action) return;
          if (issue.action.type === 'select-agent') {
            const agent = agents.find((a) => a.id === issue.action!.targetId);
            if (agent) { selectSingleAgent(agent.id); setIsDepCheckOpen(false); }
          } else if (issue.action.type === 'select-connection') {
            selectConnection(issue.action.targetId);
            setIsDepCheckOpen(false);
          }
        };
        const SeverityBadge = ({ s }: { s: ValidationIssueSeverity }) => (
          <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${s === 'error' ? 'bg-red-500/15 text-red-400' : s === 'warning' ? 'bg-amber-400/15 text-amber-400' : 'bg-sky-400/15 text-sky-400'}`}>
            {s}
          </span>
        );
        return (
          <div className="fixed inset-0 z-[230] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setIsDepCheckOpen(false)}>
            <div className="flex w-full max-w-[560px] flex-col rounded-[20px] border border-white/[0.1] bg-[#0c0c14]/98 text-white shadow-[0_24px_80px_rgba(0,0,0,0.6)]" style={{ maxHeight: 'min(90vh, calc(100vh - 32px))' }} onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="shrink-0 border-b border-white/[0.08] px-5 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-heading text-[18px] font-extrabold text-white">Workflow Dependency Check</h3>
                    <p className="mt-0.5 text-[12px] text-white/50">{activeProject.name}</p>
                  </div>
                  <button onClick={() => setIsDepCheckOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.06] text-white/50 transition hover:bg-white/[0.1] hover:text-white">×</button>
                </div>
                {/* Summary row */}
                <div className="mt-4 flex items-center gap-3 flex-wrap">
                  <span className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${isReady ? 'bg-emerald-400/10 text-emerald-300' : 'bg-red-500/10 text-red-400'}`}>
                    {isReady ? '✓ Ready to run' : '⛔ Needs attention'}
                  </span>
                  {errors.length > 0 && (
                    <span className="rounded-lg bg-red-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-red-400">{errors.length} error{errors.length > 1 ? 's' : ''}</span>
                  )}
                  {warnings.length > 0 && (
                    <span className="rounded-lg bg-amber-400/10 px-2.5 py-1.5 text-[11px] font-semibold text-amber-400">{warnings.length} warning{warnings.length > 1 ? 's' : ''}</span>
                  )}
                  {infos.length > 0 && (
                    <span className="rounded-lg bg-sky-400/10 px-2.5 py-1.5 text-[11px] font-semibold text-sky-400">{infos.length} suggestion{infos.length > 1 ? 's' : ''}</span>
                  )}
                  {validationIssues.length === 0 && (
                    <span className="text-[12px] text-white/40">No issues found.</span>
                  )}
                </div>
              </div>
              {/* Stats bar */}
              <div className="shrink-0 grid grid-cols-3 divide-x divide-white/[0.06] border-b border-white/[0.08]">
                {[
                  ['Connected', agents.filter((a) => connections.some((c) => c.from === a.id || c.to === a.id)).length.toString()],
                  ['Disconnected', agents.filter((a) => !connections.some((c) => c.from === a.id || c.to === a.id)).length.toString()],
                  ['Connections', connections.length.toString()],
                ].map(([label, val]) => (
                  <div key={label} className="px-4 py-3 text-center">
                    <p className="text-[18px] font-extrabold text-white">{val}</p>
                    <p className="text-[10px] text-white/40">{label}</p>
                  </div>
                ))}
              </div>
              {/* Issues list */}
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-2">
                {validationIssues.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-400/10 text-2xl">✓</div>
                    <p className="font-bold text-emerald-300">All checks passed</p>
                    <p className="mt-1 text-[12px] text-white/40">Your workflow is ready to run.</p>
                  </div>
                ) : (
                  validationIssues.map((issue) => (
                    <div key={issue.id} className={`rounded-[14px] border px-4 py-3 space-y-1.5 ${issue.severity === 'error' ? 'border-red-500/20 bg-red-500/[0.05]' : issue.severity === 'warning' ? 'border-amber-400/20 bg-amber-400/[0.04]' : 'border-sky-400/15 bg-sky-400/[0.03]'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <SeverityBadge s={issue.severity} />
                          <p className="text-[12px] font-bold text-white">{issue.title}</p>
                        </div>
                        {issue.action && (
                          <button
                            onClick={() => handleAction(issue)}
                            className="shrink-0 rounded-lg border border-white/[0.1] px-2.5 py-1 text-[10px] font-semibold text-white/60 transition hover:border-white/[0.2] hover:text-white"
                          >{issue.action.label}</button>
                        )}
                      </div>
                      <p className="text-[11px] leading-snug text-white/60">{issue.description}</p>
                      <p className="text-[10px] text-white/35 italic">{issue.suggestedFix}</p>
                    </div>
                  ))
                )}
              </div>
              {/* Footer */}
              <div className="shrink-0 flex items-center justify-between border-t border-white/[0.08] px-5 py-4">
                <button
                  onClick={() => { runDependencyCheck(); }}
                  className="text-[12px] font-semibold text-accent/70 transition hover:text-accent"
                >↻ Re-check</button>
                <div className="flex gap-2">
                  <button onClick={() => setIsDepCheckOpen(false)} className="rounded-[10px] border border-white/[0.1] px-4 py-2 text-sm font-semibold text-white/60 transition hover:bg-white/[0.05] hover:text-white">Close</button>
                  {isReady && (
                    <button onClick={() => { setIsDepCheckOpen(false); openRunWorkflowPreview(); }} className="rounded-[10px] bg-emerald-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-emerald-400">▶ Run Workflow</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Publish Workflow modal ── */}
      {publishConfirmOpen && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setPublishConfirmOpen(false)}>
          <div className="w-full max-w-[420px] rounded-[20px] border border-white/[0.1] bg-[#0e0e1a] shadow-[0_24px_80px_rgba(0,0,0,0.6)]" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-white/[0.08] px-5 py-4">
              <h3 className="font-heading text-[16px] font-extrabold text-white">Publish workflow?</h3>
              <p className="mt-0.5 text-[12px] text-white/45">{activeProject.name}</p>
            </div>
            <div className="px-5 py-5 space-y-3">
              {(() => {
                const errCount = validationIssues.filter((i) => i.severity === 'error').length;
                if (errCount === 0) return null;
                return (
                  <div className="rounded-xl border border-red-500/25 bg-red-500/[0.07] px-4 py-3">
                    <p className="text-[12px] font-semibold text-red-400">⛔ Workflow has {errCount} blocking issue{errCount > 1 ? 's' : ''}. Fix them before publishing.</p>
                    <button onClick={() => { setPublishConfirmOpen(false); runDependencyCheck(); }} className="mt-2 text-[11px] font-semibold text-red-400/80 underline hover:text-red-300">View issues</button>
                  </div>
                );
              })()}
              <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] px-4 py-3">
                <p className="text-[12px] leading-relaxed text-white/70">
                  This will make the workflow <span className="font-bold text-emerald-300">Live</span>. Scheduled triggers can run when enabled, but risky actions will still require human approval.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-white/[0.08] px-5 py-4">
              <button onClick={() => setPublishConfirmOpen(false)} className="rounded-[10px] border border-white/[0.1] px-4 py-2 text-sm font-semibold text-white/60 transition hover:bg-white/[0.06] hover:text-white">Cancel</button>
              <button onClick={confirmPublishWorkflow} className="rounded-[10px] bg-emerald-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-emerald-400">🟢 Publish</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Unpublish Workflow modal ── */}
      {unpublishConfirmOpen && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setUnpublishConfirmOpen(false)}>
          <div className="w-full max-w-[420px] rounded-[20px] border border-white/[0.1] bg-[#0e0e1a] shadow-[0_24px_80px_rgba(0,0,0,0.6)]" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-white/[0.08] px-5 py-4">
              <h3 className="font-heading text-[16px] font-extrabold text-white">Move workflow back to Draft?</h3>
              <p className="mt-0.5 text-[12px] text-white/45">{activeProject.name}</p>
            </div>
            <div className="px-5 py-5">
              <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.04] px-4 py-3">
                <p className="text-[12px] leading-relaxed text-white/70">
                  This will stop scheduled runs until the workflow is published again. Manual runs will still be allowed for testing.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-white/[0.08] px-5 py-4">
              <button onClick={() => setUnpublishConfirmOpen(false)} className="rounded-[10px] border border-white/[0.1] px-4 py-2 text-sm font-semibold text-white/60 transition hover:bg-white/[0.06] hover:text-white">Cancel</button>
              <button onClick={confirmUnpublishWorkflow} className="rounded-[10px] bg-[#ffffff] px-5 py-2 text-sm font-bold text-ink transition hover:bg-[#f0f2ff]">Move to Draft</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Duplicate Workflow modal ── */}
      {isDuplicateModalOpen && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setIsDuplicateModalOpen(false)}>
          <div className="w-full max-w-[460px] rounded-[20px] border border-white/[0.1] bg-[#0e0e1a] shadow-[0_24px_80px_rgba(0,0,0,0.6)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <div>
                <h3 className="font-heading text-[16px] font-extrabold text-white">Duplicate workflow</h3>
                <p className="mt-0.5 text-[12px] text-white/45">Create a copy of this workflow</p>
              </div>
              <button onClick={() => setIsDuplicateModalOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.06] text-white/50 transition hover:bg-white/[0.12] hover:text-white">×</button>
            </div>
            <div className="space-y-4 px-5 py-5">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-white/40">New Workflow Name</label>
                <input
                  value={duplicateDraft.name}
                  onChange={(e) => setDuplicateDraft((d) => ({ ...d, name: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.1] bg-[#0c0c14] px-3 py-2.5 text-sm text-white outline-none focus:border-accent/40"
                />
              </div>
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-white/40">Include in copy</p>
                <div className="space-y-2">
                  {([
                    { key: 'agents',       label: 'Agents & canvas layout' },
                    { key: 'instructions', label: 'Agent instructions & system prompts' },
                    { key: 'connections',  label: 'Connections & flow' },
                    { key: 'chatHistory',  label: 'Chat history' },
                    { key: 'runHistory',   label: 'Run history' },
                  ] as const).map(({ key, label }) => (
                    <div key={key} className="flex cursor-pointer items-center justify-between rounded-xl border border-white/[0.07] px-4 py-2.5"
                      onClick={() => setDuplicateDraft((d) => ({ ...d, [key]: !d[key] }))}>
                      <span className="text-[12px] text-white/70">{label}</span>
                      <div className={`relative h-5 w-9 rounded-full transition-colors ${duplicateDraft[key] ? 'bg-accent' : 'bg-white/10'}`}>
                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${duplicateDraft[key] ? 'left-[18px]' : 'left-0.5'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-white/[0.08] px-5 py-4">
              <button onClick={() => setIsDuplicateModalOpen(false)} className="rounded-[10px] border border-white/[0.1] px-4 py-2 text-sm font-semibold text-white/60 transition hover:bg-white/[0.06] hover:text-white">Cancel</button>
              <button onClick={confirmDuplicateWorkflow} disabled={!duplicateDraft.name.trim()}
                className="rounded-[10px] bg-[#ffffff] px-5 py-2 text-sm font-bold text-ink transition hover:bg-[#f0f2ff] disabled:opacity-40">⎘ Duplicate</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Save as Template modal ── */}
      {isSaveTemplateModalOpen && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setIsSaveTemplateModalOpen(false)}>
          <div className="flex w-full max-w-[500px] flex-col rounded-[20px] border border-white/[0.1] bg-[#0e0e1a] shadow-[0_24px_80px_rgba(0,0,0,0.6)]" style={{ maxHeight: 'min(88vh, calc(100vh - 32px))' }} onClick={(e) => e.stopPropagation()}>
            <div className="shrink-0 flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <div>
                <h3 className="font-heading text-[16px] font-extrabold text-white">Save workflow as template</h3>
                <p className="mt-0.5 text-[12px] text-white/45">Reuse this workflow structure in future projects</p>
              </div>
              <button onClick={() => setIsSaveTemplateModalOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.06] text-white/50 transition hover:bg-white/[0.12] hover:text-white">×</button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto space-y-4 px-5 py-5">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-white/40">Template Name</label>
                <input
                  value={templateDraft.name}
                  onChange={(e) => setTemplateDraft((d) => ({ ...d, name: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.1] bg-[#0c0c14] px-3 py-2.5 text-sm text-white outline-none focus:border-accent/40"
                />
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-white/40">Category</label>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATE_CATEGORIES.map((cat) => (
                    <button key={cat} onClick={() => setTemplateDraft((d) => ({ ...d, category: cat }))}
                      className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${templateDraft.category === cat ? 'border-accent/40 bg-accent/10 text-accent' : 'border-white/[0.1] text-white/45 hover:border-white/[0.2] hover:text-white/65'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-white/40">Description</label>
                <textarea
                  value={templateDraft.description}
                  onChange={(e) => setTemplateDraft((d) => ({ ...d, description: e.target.value }))}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/[0.1] bg-[#0c0c14] px-3 py-2.5 text-sm text-white outline-none focus:border-accent/40"
                />
              </div>
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-white/40">Include in template</p>
                <div className="space-y-2">
                  {([
                    { key: 'includeAgents',       label: 'Agents & canvas layout' },
                    { key: 'includeInstructions', label: 'Agent instructions & system prompts' },
                    { key: 'includeIO',           label: 'Input / Output settings' },
                    { key: 'includeBranching',    label: 'Branching rules' },
                    { key: 'includeApproval',     label: 'Approval rules' },
                  ] as const).map(({ key, label }) => (
                    <div key={key} className="flex cursor-pointer items-center justify-between rounded-xl border border-white/[0.07] px-4 py-2.5"
                      onClick={() => setTemplateDraft((d) => ({ ...d, [key]: !d[key] }))}>
                      <span className="text-[12px] text-white/70">{label}</span>
                      <div className={`relative h-5 w-9 rounded-full transition-colors ${templateDraft[key] ? 'bg-accent' : 'bg-white/10'}`}>
                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${templateDraft[key] ? 'left-[18px]' : 'left-0.5'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="shrink-0 flex items-center justify-end gap-2 border-t border-white/[0.08] px-5 py-4">
              <button onClick={() => setIsSaveTemplateModalOpen(false)} className="rounded-[10px] border border-white/[0.1] px-4 py-2 text-sm font-semibold text-white/60 transition hover:bg-white/[0.06] hover:text-white">Cancel</button>
              <button onClick={confirmSaveTemplate} disabled={!templateDraft.name.trim()}
                className="rounded-[10px] bg-[#ffffff] px-5 py-2 text-sm font-bold text-ink transition hover:bg-[#f0f2ff] disabled:opacity-40">📋 Save Template</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Error Detail modal ── */}
      {errorDetailModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm" onClick={() => setErrorDetailModal(null)}>
          <div className="w-full max-w-[440px] rounded-[20px] border border-white/[0.1] bg-[#0e0e1a] shadow-[0_24px_80px_rgba(0,0,0,0.55)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <div>
                <h3 className="font-heading text-[15px] font-extrabold text-red-400">⚠ {errorDetailModal.error.title}</h3>
                <p className="mt-0.5 text-[11px] text-white/45">{agents.find((a) => a.id === errorDetailModal.agentId)?.label}</p>
              </div>
              <button onClick={() => setErrorDetailModal(null)} className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.06] text-white/50 transition hover:bg-white/[0.12] hover:text-white">×</button>
            </div>
            <div className="space-y-3 px-5 py-5">
              <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3">
                <p className="text-[12px] text-red-300 leading-relaxed">{errorDetailModal.error.message}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-white/30">Failed Step</p>
                  <p className="mt-1 text-[11px] font-semibold text-white/75">{errorDetailModal.error.failedStep}</p>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-3 py-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-amber-400/60">Suggested Fix</p>
                  <p className="mt-1 text-[11px] font-semibold text-amber-300/85">{errorDetailModal.error.suggestedFix}</p>
                </div>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                <p className="text-[9px] font-bold uppercase tracking-wide text-white/30">Retry Recommendation</p>
                <p className="mt-1 text-[11px] text-white/55 leading-relaxed">Click Retry to re-run this agent from the failed step. The error will clear automatically if the retry succeeds.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-white/[0.08] px-5 py-4">
              <button onClick={() => setErrorDetailModal(null)} className="rounded-[10px] border border-white/[0.1] px-4 py-2 text-sm font-semibold text-white/60 transition hover:bg-white/[0.06] hover:text-white">Close</button>
              <button
                onClick={() => { retryAgent(errorDetailModal.agentId); setErrorDetailModal(null); }}
                className="rounded-[10px] bg-green-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-green-400"
              >↩ Retry Agent</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit System Prompt modal ── */}
      {agentEditModal?.type === 'edit-system-prompt' && (() => {
        const { agentId, agentName } = agentEditModal;
        const currentPrompt = agentEditModal.currentPrompt;
        let draftPrompt = currentPrompt;
        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm" onClick={() => setAgentEditModal(null)}>
            <div className="w-full max-w-[500px] rounded-[20px] border border-white/[0.1] bg-[#0e0e1a] shadow-[0_24px_80px_rgba(0,0,0,0.55)]" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
                <div>
                  <h3 className="font-heading text-[16px] font-extrabold text-white">System Prompt</h3>
                  <p className="mt-0.5 text-[12px] text-white/50">{agentName}</p>
                </div>
                <button onClick={() => setAgentEditModal(null)} className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.06] text-white/50 transition hover:bg-white/[0.12] hover:text-white">×</button>
              </div>
              <div className="px-5 py-5">
                <p className="mb-3 text-[11px] leading-relaxed text-white/50">
                  This controls how the agent thinks and behaves during workflow runs. It is the hidden instruction layer before any user prompt.
                </p>
                <textarea
                  defaultValue={currentPrompt}
                  onChange={(e) => { draftPrompt = e.target.value; }}
                  rows={7}
                  className="w-full rounded-xl border border-white/[0.1] bg-[#0c0c14] px-4 py-3 text-sm leading-relaxed text-white outline-none transition focus:border-accent/40 focus:ring-4 focus:ring-accent/10"
                  placeholder="e.g. You are a careful data analyst. Always explain your reasoning clearly and highlight any risks."
                />
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-white/[0.08] px-5 py-4">
                <button onClick={() => setAgentEditModal(null)} className="rounded-[10px] border border-white/[0.1] px-4 py-2 text-sm font-semibold text-white/60 transition hover:bg-white/[0.06] hover:text-white">Cancel</button>
                <button onClick={() => { updateAgentSystemPrompt(agentId, draftPrompt); setAgentEditModal(null); }} className="rounded-[10px] bg-[#ffffff] px-5 py-2 text-sm font-bold text-ink transition hover:bg-[#f0f2ff]">Save Prompt</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── File Processing Center modal ── */}
      {isFileProcessingOpen && (
        <FileProcessingCenter
          files={processedFiles}
          setFiles={setProcessedFiles}
          onAddToWorkflowInput={addToWorkflowInput}
          onClose={() => setIsFileProcessingOpen(false)}
        />
      )}

      {/* ── Data Pipeline modal ── */}
      {isDataPipelineOpen && (
        <DataPipelineModal
          state={dataPipelineState}
          onUpdateState={setDataPipelineState}
          onClose={() => setIsDataPipelineOpen(false)}
          onSystemMessage={addSystemMessage}
          onToast={(msg) => setToast(msg)}
          sourceHistory={sourceHistory}
          onUpdateHistory={setSourceHistory}
        />
      )}

      {isApprovalHistoryOpen && (
        <ApprovalHistoryModal
          requests={approvalRequests}
          history={approvalHistory}
          onClose={() => setIsApprovalHistoryOpen(false)}
        />
      )}

      {isApprovalRulesOpen && (
        <ApprovalRulesModal
          rules={approvalRules}
          onUpdate={setApprovalRules}
          onClose={() => setIsApprovalRulesOpen(false)}
        />
      )}

      {approvalCardId && (() => {
        const req = approvalRequests.find((r) => r.id === approvalCardId);
        if (!req) return null;
        return (
          <ApprovalCardModal
            request={req}
            onApprove={(id) => resolveApproval(id, 'Approved')}
            onReject={(id, reason) => resolveApproval(id, 'Rejected', reason)}
            onClose={() => setApprovalCardId(null)}
          />
        );
      })()}

      {rejectReasonModal && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setRejectReasonModal(null)}>
          <div className="mx-4 w-full max-w-sm rounded-[20px] border border-white/[0.1] bg-[#0e0e1a] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.7)]" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-1 font-heading text-[15px] font-bold text-white">Reject Step</h3>
            <p className="mb-4 text-[11px] text-white/40">Provide a reason for rejection (optional).</p>
            <textarea
              value={rejectReasonModal.reason}
              onChange={(e) => setRejectReasonModal({ ...rejectReasonModal, reason: e.target.value })}
              rows={3} placeholder="e.g. Data not verified yet"
              className="w-full resize-none rounded-xl border border-white/[0.1] bg-transparent px-3 py-2.5 text-[12px] text-white outline-none placeholder:text-white/25 focus:border-red-400/40"
            />
            <div className="mt-4 flex gap-2">
              <button onClick={() => resolveApproval(rejectReasonModal.id, 'Rejected', rejectReasonModal.reason)}
                className="flex-1 rounded-xl bg-red-500/80 py-2.5 text-[12px] font-bold text-white transition hover:bg-red-500">Confirm Rejection</button>
              <button onClick={() => setRejectReasonModal(null)}
                className="rounded-xl border border-white/[0.1] px-4 py-2.5 text-[12px] text-white/60 transition hover:bg-white/[0.05]">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {editApprovalPreview && (() => {
        const req = approvalRequests.find((r) => r.id === editApprovalPreview.id);
        if (!req) return null;
        return (
          <div className="fixed inset-0 z-[350] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditApprovalPreview(null)}>
            <div className="mx-4 w-full max-w-lg rounded-[20px] border border-white/[0.1] bg-[#0e0e1a] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.7)]" onClick={(e) => e.stopPropagation()}>
              <h3 className="mb-1 font-heading text-[15px] font-bold text-white">Edit Before Approving</h3>
              <p className="mb-4 text-[11px] text-white/40">{req.title}</p>
              <textarea
                value={editApprovalPreview.content}
                onChange={(e) => setEditApprovalPreview({ ...editApprovalPreview, content: e.target.value })}
                rows={8}
                className="w-full resize-none rounded-xl border border-white/[0.1] bg-black/20 px-3 py-2.5 font-mono text-[11px] text-white outline-none focus:border-accent/40"
              />
              <div className="mt-4 flex gap-2">
                <button onClick={() => resolveApproval(editApprovalPreview.id, 'Edited', `Edited content: ${editApprovalPreview.content.slice(0, 60)}…`)}
                  className="flex-1 rounded-xl bg-green-500/80 py-2.5 text-[12px] font-bold text-white transition hover:bg-green-500">Approve with Edits</button>
                <button onClick={() => setEditApprovalPreview(null)}
                  className="rounded-xl border border-white/[0.1] px-4 py-2.5 text-[12px] text-white/60 transition hover:bg-white/[0.05]">Cancel</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Safety Mode OFF Confirmation ── */}
      {safetyOffConfirmOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/65 backdrop-blur-sm" onClick={() => setSafetyOffConfirmOpen(false)}>
          <div className="mx-4 w-full max-w-md rounded-[22px] border border-red-500/25 bg-[#0e0e1a] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.7)]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-500/15 text-xl">🛡</div>
              <div>
                <h3 className="font-heading text-[16px] font-bold text-white">Turn off Safety Mode?</h3>
                <p className="text-[11px] text-red-400/80">This reduces workflow protection</p>
              </div>
            </div>
            <p className="mb-5 text-[12px] leading-relaxed text-white/65">
              Safety Mode protects your workflow by requiring approval before sending, exporting, updating, deleting, or triggering external actions. Turning it off may allow actions to run with fewer checks.
            </p>
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.07] px-4 py-3 mb-5">
              <p className="text-[11px] text-red-300">⚠ External actions may run without confirmation until Safety Mode is re-enabled.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSafetyOffConfirmOpen(false)}
                className="flex-1 rounded-xl border border-white/[0.12] bg-white/[0.06] py-2.5 text-[12px] font-semibold text-white/80 transition hover:bg-white/[0.1]">Cancel</button>
              <button onClick={() => {
                setSafetyMode(false);
                setSafetyOffConfirmOpen(false);
                addSystemMessage('System: Safety Mode disabled by user.');
                setToast('Safety Mode turned off');
                addAuditLog({ actorType: 'User', actorName: 'You', actionType: 'safety-disabled', title: 'Safety Mode disabled', description: 'Safety Mode turned OFF. External actions may run without confirmation.', workflowName, riskLevel: 'High', status: 'Success', reversible: true });
              }}
                className="flex-1 rounded-xl bg-red-500/80 py-2.5 text-[12px] font-bold text-white transition hover:bg-red-500">Turn Off Safety Mode</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Run History Modal ── */}
      {isRunHistoryOpen && (
        <RunHistoryModal
          runs={workflowRuns}
          setRuns={setWorkflowRuns}
          workflowName={workflowName}
          addSystemMessage={addSystemMessage}
          setToast={setToast}
          addAuditLog={addAuditLog}
          onClose={() => setIsRunHistoryOpen(false)}
        />
      )}

      {/* ── Audit Log Modal ── */}
      {isAuditLogOpen && (
        <AuditLogModal
          auditLogs={auditLogs}
          setAuditLogs={setAuditLogs}
          auditLogFilter={auditLogFilter}
          setAuditLogFilter={setAuditLogFilter}
          auditLogSearch={auditLogSearch}
          setAuditLogSearch={setAuditLogSearch}
          auditLogDetail={auditLogDetail}
          setAuditLogDetail={setAuditLogDetail}
          rollbackConfirm={rollbackConfirm}
          setRollbackConfirm={setRollbackConfirm}
          onClose={() => { setIsAuditLogOpen(false); setAuditLogDetail(null); }}
          addSystemMessage={addSystemMessage}
          setToast={setToast}
          workflowName={workflowName}
        />
      )}

      {/* ── Rollback Confirm Modal ── */}
      {rollbackConfirm && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setRollbackConfirm(null)}>
          <div className="mx-4 w-full max-w-md rounded-[22px] border border-accent/25 bg-[#0e0e1a] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.7)]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-xl">↩</div>
              <div>
                <h3 className="font-heading text-[16px] font-bold text-white">Confirm Rollback</h3>
                <p className="text-[11px] text-accent/70">This will reverse the action</p>
              </div>
            </div>
            <div className="mb-4 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3">
              <p className="text-[12px] font-semibold text-white mb-1">{rollbackConfirm.title}</p>
              <p className="text-[11px] text-white/50">{rollbackConfirm.description}</p>
            </div>
            <p className="mb-5 text-[12px] leading-relaxed text-white/60">
              The workflow state will be restored to its condition before this action was taken. A new audit entry will be created recording the rollback.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setRollbackConfirm(null)}
                className="flex-1 rounded-xl border border-white/[0.12] bg-white/[0.06] py-2.5 text-[12px] font-semibold text-white/80 transition hover:bg-white/[0.1]">Cancel</button>
              <button onClick={() => {
                setAuditLogs((prev) => prev.map((l) => l.id === rollbackConfirm.id ? { ...l, rollbackStatus: 'rolled-back' } : l));
                const now = new Date();
                const ts = `${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
                const rbEntry: AuditLog = {
                  id: `aud-rb-${Date.now()}`, timestamp: ts, actorType: 'User', actorName: 'You',
                  actionType: 'agent-edited', title: `Rolled back: ${rollbackConfirm.title}`,
                  description: `Action reversed. Workflow state restored to before this action.`,
                  workflowName, stepName: rollbackConfirm.stepName, riskLevel: 'Low', status: 'Success', reversible: false, rollbackStatus: 'none',
                  beforeState: rollbackConfirm.afterState, afterState: rollbackConfirm.beforeState, metadata: { originalEntryId: rollbackConfirm.id },
                };
                setAuditLogs((prev) => [rbEntry, ...prev]);
                addSystemMessage(`System: Action "${rollbackConfirm.title}" rolled back.`);
                setToast('Rollback complete — state restored');
                setRollbackConfirm(null);
                setAuditLogDetail(null);
              }}
                className="flex-1 rounded-xl bg-accent py-2.5 text-[12px] font-bold text-white transition hover:bg-accent/90">↩ Confirm Rollback</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Report System Modals ── */}
      {isReportListOpen && (
        <ReportListModal
          reports={reports}
          onClose={() => setIsReportListOpen(false)}
          onPreview={(id) => { setReportPreviewId(id); setIsReportListOpen(false); }}
          onSchedule={() => { setScheduleReportModal(null); setIsScheduledReportsOpen(true); setIsReportListOpen(false); }}
        />
      )}
      {reportPreviewId && (() => { const rpt = reports.find((r) => r.id === reportPreviewId); return rpt ? (
        <ReportPreviewModal
          report={rpt}
          onClose={() => setReportPreviewId(null)}
          onEdit={(id) => { setReportEditorId(id); setReportPreviewId(null); }}
          onExport={openReportExport}
          onSaveVersion={saveReportVersion}
          onSchedule={(id) => { setScheduleReportModal(id); setReportPreviewId(null); }}
        />
      ) : null; })()}
      {reportEditorId && (() => { const rpt = reports.find((r) => r.id === reportEditorId); return rpt ? (
        <ReportEditorModal
          report={rpt}
          onClose={() => setReportEditorId(null)}
          onSave={(id, secs, title) => { saveReport(id, secs, title); setReportEditorId(null); setReportPreviewId(id); }}
          setToast={setToast}
        />
      ) : null; })()}
      {reportExportModal && (() => { const rpt = reports.find((r) => r.id === reportExportModal.reportId); return rpt ? (
        <ReportExportModal
          state={reportExportModal}
          report={rpt}
          onClose={() => setReportExportModal(null)}
          onExport={handleReportExport}
          safetyMode={safetyMode}
          setToast={setToast}
        />
      ) : null; })()}
      {emailDraftModal && (
        <EmailDraftModal draft={emailDraftModal} onClose={() => setEmailDraftModal(null)} setToast={setToast} />
      )}
      {lineDraftModal && (
        <LineDraftModal draft={lineDraftModal} onClose={() => setLineDraftModal(null)} setToast={setToast} />
      )}
      {scheduleReportModal !== undefined && scheduleReportModal !== null || (scheduleReportModal === null && isScheduledReportsOpen) ? null : null}
      {isScheduledReportsOpen && (
        <ScheduledReportsModal
          scheduledReports={scheduledReports}
          setScheduledReports={setScheduledReports}
          onClose={() => setIsScheduledReportsOpen(false)}
          onAdd={() => { setScheduleReportModal('new'); setIsScheduledReportsOpen(false); }}
          setToast={setToast}
        />
      )}
      {scheduleReportModal !== null && scheduleReportModal !== undefined && !isScheduledReportsOpen && (
        <ScheduleReportModal
          workflowName={workflowName}
          reportId={scheduleReportModal}
          onClose={() => setScheduleReportModal(null)}
          onSave={(s) => { setScheduledReports((prev) => [...prev, s]); setScheduleReportModal(null); }}
          setToast={setToast}
        />
      )}

      {/* ── AI Workflow Intelligence Modals ── */}
      {buildWorkflowModal && (
        <BuildWorkflowModal
          state={buildWorkflowModal}
          setState={setBuildWorkflowModal}
          onApply={applyGeneratedWorkflow}
          safetyModeGlobal={safetyMode}
          setToast={setToast}
        />
      )}
      {aiSuggestionsOpen && (
        <AISuggestionsPanel
          suggestions={aiSuggestions}
          onApply={applyImprovementSuggestion}
          onIgnore={(id) => setAiSuggestions((prev) => prev.filter((s) => s.id !== id))}
          onRegenerate={() => { const s = mockAnalyzeWorkflow(agents, connections); setAiSuggestions(s); }}
          onClose={() => setAiSuggestionsOpen(false)}
        />
      )}
      {improveWorkflowState.open && (
        <ImproveWorkflowModal
          state={improveWorkflowState}
          onApply={applyImprovementSuggestion}
          onIgnore={(id) => setImproveWorkflowState((prev) => ({ ...prev, suggestions: prev.suggestions.filter((s) => s.id !== id) }))}
          onClose={() => setImproveWorkflowState((s) => ({ ...s, open: false }))}
        />
      )}
      {explainWorkflowState.open && (
        <ExplainWorkflowModal
          state={explainWorkflowState}
          onChangeMode={(mode) => openExplainWorkflow(mode)}
          onClose={() => setExplainWorkflowState((s) => ({ ...s, open: false }))}
          setToast={setToast}
        />
      )}
      {debugWorkflowState.open && (
        <DebugWorkflowModal
          state={debugWorkflowState}
          onFix={applyDebugFix}
          onClose={() => setDebugWorkflowState((s) => ({ ...s, open: false }))}
          setToast={setToast}
        />
      )}
      {workflowQualityOpen && workflowQualityScore && (
        <WorkflowQualityModal
          score={workflowQualityScore}
          onClose={() => setWorkflowQualityOpen(false)}
        />
      )}
      {generateInstructionsState.open && (
        <GenerateInstructionsModal
          state={generateInstructionsState}
          onInsert={insertAgentInstructions}
          onRegenerate={(quality) => {
            const agent = agents.find((a) => a.id === generateInstructionsState.agentId);
            if (!agent) return;
            setGenerateInstructionsState((s) => ({ ...s, generating: true, quality }));
            window.setTimeout(() => {
              const result = mockGenerateInstructions(agent.label, agent.role ?? agent.label, quality);
              setGenerateInstructionsState((s) => ({ ...s, generating: false, result }));
            }, 900);
          }}
          onClose={() => setGenerateInstructionsState((s) => ({ ...s, open: false, result: null }))}
          setToast={setToast}
        />
      )}

      {/* ── Action Confirmation Modal ── */}
      {pendingAction && (
        <ActionConfirmModal
          action={pendingAction}
          safetyMode={safetyMode}
          onConfirm={() => {
            addSystemMessage('System: Action confirmed by user.');
            setToast('Action confirmed');
            setPendingAction(null);
          }}
          onCancel={() => {
            addSystemMessage('System: Action cancelled by user.');
            setToast('Action cancelled');
            setPendingAction(null);
          }}
        />
      )}

      {/* ── Optimize Cost Modal ── */}
      {optimizeCostOpen && (() => {
        const suggestions = [
          { icon: '⚡', label: 'Use Fast model instead of Accurate', desc: 'Saves 1 credit per agent using Accurate model' },
          { icon: '🔕', label: 'Disable unused agents', desc: 'Remove agents not critical to this run' },
          { icon: '🧪', label: 'Run a test on fewer rows first', desc: 'Test with a small sample before full run' },
          { icon: '🖼', label: 'Turn off OCR if not needed', desc: 'OCR processing adds 2 credits per run' },
          { icon: '🔁', label: 'Reduce loop item limit', desc: 'Process fewer items per loop iteration' },
          { icon: '📋', label: 'Generate summary instead of full report', desc: 'Summary mode uses fewer tokens' },
          { icon: '✏️', label: 'Use draft mode before live run', desc: 'Draft mode skips export/send actions' },
        ];
        return (
          <div className="fixed inset-0 z-[410] flex items-center justify-center bg-black/65 backdrop-blur-sm" onClick={() => setOptimizeCostOpen(false)}>
            <div className="mx-4 w-full max-w-md rounded-[22px] border border-sky-400/20 bg-[#0e0e1a] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.7)]" onClick={(e) => e.stopPropagation()}>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-[17px] font-bold text-white">Optimize Cost</h3>
                  <p className="text-[11px] text-sky-400/70">Apply suggestions to reduce credit usage</p>
                </div>
                <button onClick={() => setOptimizeCostOpen(false)} className="text-white/40 hover:text-white/70 transition text-lg">✕</button>
              </div>
              <div className="space-y-2 mb-5">
                {suggestions.map((s) => (
                  <div key={s.label} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-3">
                    <span className="text-base shrink-0">{s.icon}</span>
                    <div>
                      <p className="text-[12px] font-semibold text-ink">{s.label}</p>
                      <p className="text-[10px] text-white/45">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setOptimizeCostOpen(false)}
                  className="flex-1 rounded-xl border border-white/[0.12] bg-white/[0.06] py-2.5 text-[12px] font-semibold text-white/80 transition hover:bg-white/[0.1]">Close</button>
                <button onClick={() => {
                  setCostOptimized(true);
                  setOptimizeCostOpen(false);
                  setToast('Cost estimate reduced');
                  addSystemMessage('System: Cost optimization applied.');
                }}
                  className="flex-1 rounded-xl bg-sky-400 py-2.5 text-[12px] font-bold text-[#0a0a14] transition hover:opacity-90">Apply Suggestions</button>
              </div>
              <p className="mt-3 text-center text-[10px] text-white/25">These are recommendations — actual cost depends on workflow configuration.</p>
            </div>
          </div>
        );
      })()}

      {/* ── Upgrade Modal ── */}
      {upgradeModal && (
        <UpgradeModal
          modal={upgradeModal}
          usageState={usageState}
          setUsageState={setUsageState}
          onClose={() => setUpgradeModal(null)}
          onViewPlans={() => { setUpgradeModal(null); setPage('Billing'); }}
          onUpgraded={(plan) => {
            addSystemMessage(`System: Workspace plan upgraded to ${PLANS.find((p) => p.id === plan)?.name ?? plan}.`);
            setToast(`Plan upgraded to ${PLANS.find((p) => p.id === plan)?.name ?? plan}`);
          }}
        />
      )}
    </div>
  );
}











function buildAntTeamProposal(goal: string, mode: AntExecutionMode): AntTeamProposal {
  const projectName = titleFromGoal(goal);
  const needsWorkflow = mode === 'workflow';
  const needsTools = mode === 'tool-action' || mode === 'approval-sensitive';
  const creativeLike = /image|visual|video|reel|tiktok|voice|audio|campaign|creative|storyboard|social media|caption/i.test(goal);
  const agents: AntTeamAgent[] = creativeLike ? [
    { name: 'Research Agent', role: 'Context scout', responsibility: 'Gather references, audience context, and platform constraints.', tools: ['Web research', 'Knowledge base'], output: 'Creative research brief', status: 'proposed', skills: skillsForCapabilities(['web_research']) },
    { name: 'Script Agent', role: 'Script writer', responsibility: 'Turn the concept into a script, hook, captions, and shot list.', tools: ['Editor'], output: 'Script and caption', status: 'proposed', skills: skillsForCapabilities(['text_reasoning', 'summarization']) },
    { name: 'Visual Agent', role: 'Image generator', responsibility: 'Create image concepts and mock generated image placeholders.', tools: ['Image generator'], output: 'Generated image placeholders', status: 'proposed', skills: skillsForCapabilities(['image_generation']) },
    { name: 'Voice Agent', role: 'Voice-over', responsibility: 'Prepare voice-over copy and audio placeholder.', tools: ['TTS generator'], output: 'Audio placeholder', status: 'proposed', skills: skillsForCapabilities(['text_to_speech']) },
    { name: 'Video Agent', role: 'Short video generator', responsibility: 'Assemble storyboard into a video draft placeholder.', tools: ['Video generator'], output: 'Video placeholder', status: 'proposed', skills: skillsForCapabilities(['video_generation']) },
    { name: 'Editor Agent', role: 'Artifact assembler', responsibility: 'Package script, storyboard, media placeholders, caption, and export actions.', tools: ['Deliverable builder'], output: 'Creative package', status: 'proposed', skills: skillsForCapabilities(['text_reasoning']) },
    { name: 'Reviewer Agent', role: 'Quality reviewer', responsibility: 'Check quality, brand fit, facts, and approval risks.', tools: ['QA checklist'], output: 'Review notes', status: 'proposed', skills: skillsForCapabilities(['quality_review']) },
  ] : [
    { name: 'Project Manager Agent', role: 'Coordinator', responsibility: 'Break the goal into tasks, assign work, and keep the project moving.', tools: ['Project memory', 'Task board'], output: 'Work plan and status updates', status: 'proposed', skills: skillsForCapabilities(['text_reasoning']) },
    { name: needsTools ? 'Source Collector Agent' : 'Research Agent', role: needsTools ? 'Tool and file operator' : 'Research specialist', responsibility: needsTools ? 'Find approved files, screenshots, data sources, and connected tools.' : 'Gather context, facts, examples, and source material.', tools: needsTools ? ['Files', 'Screenshots', 'Connectors'] : ['Web research', 'Knowledge base'], output: needsTools ? 'Source inventory' : 'Research brief', status: 'proposed', skills: skillsForCapabilities(needsTools ? ['file_reading', 'connected_tool_action'] : ['web_research', 'summarization']) },
    { name: /sales|data|report|sheet|spreadsheet/i.test(goal) ? 'Business Analyst Agent' : 'Strategy Analyst Agent', role: 'Analyst', responsibility: 'Turn raw information into patterns, risks, insights, and recommendations.', tools: ['Analysis workspace', 'Tables'], output: 'Insight summary', status: 'proposed', skills: skillsForCapabilities(['text_reasoning', 'data_analysis']) },
    { name: /marketing|content|launch|store/i.test(goal) ? 'Content Planner Agent' : 'Report Writer Agent', role: 'Deliverable owner', responsibility: 'Package the final output into a clear artifact the user can review.', tools: ['Editor', 'Export'], output: 'Final deliverable draft', status: 'proposed', skills: skillsForCapabilities(['text_reasoning', 'summarization']) },
  ];
  if (needsWorkflow) {
    agents.splice(1, 0, { name: 'Workflow Designer Agent', role: 'Automation architect', responsibility: 'Convert the goal into a repeatable process with triggers, steps, and checks.', tools: ['Workflow builder'], output: 'Repeatable process design', status: 'proposed', skills: skillsForCapabilities(['workflow_automation', 'connected_tool_action']) });
  }
  const deliverableType = needsWorkflow ? 'Workflow automation' : creativeLike ? 'Creative package' : /marketing|competitor|launch/i.test(goal) ? 'Marketing plan' : /sales|report|data/i.test(goal) ? 'Business report' : 'Strategy';
  return {
    id: `proposal-${Date.now()}`,
    mode,
    projectName,
    goal,
    whyTeam: mode === 'single-agent'
      ? 'A specialist can handle this, but AI Ant can still create a lightweight project if you want tracking and deliverables.'
      : 'This goal has multiple moving parts: planning, information gathering, analysis, deliverable creation, and review checkpoints.',
    hierarchy: ['AI Ant Director', 'Project Manager Agent', ...agents.slice(1).map((a) => a.name)],
    agents,
    plan: needsWorkflow
      ? ['Clarify trigger and schedule', 'Collect required data sources', 'Design the repeatable process', 'Add approval checkpoints', 'Create the first deliverable run']
      : ['Clarify the goal and success criteria', 'Collect information and relevant sources', 'Analyze findings and options', 'Create the expected deliverables', 'Ask for review before risky actions'],
    tools: needsTools ? ['Local files', 'Screenshots', 'Google Drive', 'Spreadsheets', 'Browser'] : ['Project knowledge', 'Research workspace', 'Document editor'],
    approvals: needsTools
      ? ['Before accessing sensitive private data', 'Before writing to spreadsheets or files', 'Before sending external messages']
      : ['Before publishing or sending work externally'],
    deliverables: creativeLike ? [
      { title: 'Script and storyboard', type: 'Script', owner: 'Script Agent', status: 'Planned', preview: 'Hook, narration, shot-by-shot storyboard, and caption draft.' },
      { title: 'Generated media placeholders', type: 'Creative assets', owner: 'Visual Agent', status: 'Planned', preview: 'Mock image, audio, and video placeholders with export actions.' },
      { title: `${projectName} creative package`, type: deliverableType, owner: 'Editor Agent', status: 'Planned', preview: 'Final script, storyboard, media placeholders, caption, and approval-ready exports.' },
    ] : [
      { title: `${projectName} summary`, type: deliverableType, owner: agents[agents.length - 1].name, status: 'Planned', preview: 'A concise output with findings, decisions, and next actions.' },
      { title: 'Recommended actions', type: 'Decision recommendation', owner: agents[2]?.name ?? 'Strategy Analyst Agent', status: 'Planned', preview: 'Prioritized recommendations with rationale and risk notes.' },
    ],
  };
}

// ── State machine helpers ─────────────────────────────────────────────────────

function getConfidenceLevel(score: number): AntConfidenceLevel {
  if (score >= 0.88) return 'verified';
  if (score >= 0.72) return 'needs-review';
  return 'manual-override';
}

const SENSITIVE_DOMAINS: AntDomain[] = ['finance', 'hr', 'email', 'file-deletion', 'external-export'];

function antModeTransition(
  mode: AntMode, risk: AntRiskLevel, domain: AntDomain
): { effectiveMode: AntMode; escalated: boolean } {
  if (mode === 'read-only') return { effectiveMode: 'read-only', escalated: false };
  const sensitive = SENSITIVE_DOMAINS.includes(domain) || risk === 'Sensitive' || risk === 'High Risk';
  if (mode === 'auto' && sensitive) return { effectiveMode: 'approval', escalated: true };
  if (mode === 'assist' && domain === 'file-deletion') return { effectiveMode: 'approval', escalated: true };
  return { effectiveMode: mode, escalated: false };
}

function detectAntDomain(lower: string): AntDomain {
  if (/invoice|finance|revenue|payroll|budget|billing/.test(lower)) return 'finance';
  if (/email|inbox|gmail|compose/.test(lower)) return 'email';
  if (/delete|remove|trash|wipe/.test(lower)) return 'file-deletion';
  if (/send|upload|share|export|drive|sync|cloud/.test(lower)) return 'external-export';
  if (/hr|employee|personnel|hiring|salary/.test(lower)) return 'hr';
  return 'general';
}

function detectActionType(lower: string, domain: AntDomain): AntActionType {
  if (/find|search|look for|locate/.test(lower)) return 'SEARCH';
  if (/organiz|sort|clean|folder/.test(lower)) return 'ORGANIZATION';
  if (/email|inbox|gmail|compose|send|share.*team/.test(lower) || domain === 'email') return 'COMMUNICATION';
  if (/monitor|watch|alert|notify/.test(lower)) return 'SYSTEM_OPS';
  if (/workflow|automate|build|pipeline/.test(lower)) return 'AUTOMATION';
  if (/drive|sync|upload|cloud|delete|remove|trash/.test(lower) || domain === 'file-deletion' || domain === 'external-export') return 'FILE_OPS';
  if (/screenshot|spreadsheet|excel|summarize|extract|analyze|parse|ocr|csv/.test(lower)) return 'DATA_ANALYSIS';
  return 'DATA_ANALYSIS';
}

// ── Constants ─────────────────────────────────────────────────────────────────

function mockAntRespond(input: string, mode: AntMode): {
  text: string;
  actions?: Array<{ label: string; icon: string }>;
  fileCards?: AntFileCard[];
  confidence?: number; confidenceLevel?: AntConfidenceLevel;
  riskLevel?: AntRiskLevel; domain?: AntDomain;
  approval?: Omit<AntApproval, 'id'>;
  newTask?: Partial<AntTask>;
  correctionFields?: AntCorrectionField[];
  requiresCorrection?: boolean;
  modeEscalated?: boolean;
  systemNote?: string;
  plan?: AntTaskPlan;
} {
  const lower = input.toLowerCase();
  const domain = detectAntDomain(lower);
  const { effectiveMode, escalated } = antModeTransition(mode, 'Safe', domain);
  const isReadOnly = effectiveMode === 'read-only';
  const systemNote = escalated ? `Mode escalated to Approval — ${domain} domain requires explicit sign-off.` : undefined;

  if (lower.includes('send') || (lower.includes('share') && lower.includes('team'))) {
    const confidence = 0.93;
    return {
      text: isReadOnly
        ? "Read-Only mode: I located the file but cannot send. Found Monthly_Report.pdf (2.3 MB, modified today). Switch to Assist or Approval mode to proceed."
        : "I located **Monthly_Report.pdf** (2.3 MB, modified today at 09:42). Sending externally is an External Export action — approval required before I proceed.",
      confidence, confidenceLevel: getConfidenceLevel(confidence), riskLevel: 'Sensitive', domain: 'external-export',
      fileCards: isReadOnly ? undefined : [{ id: 'afc1', name: 'Monthly_Report.pdf', type: 'PDF', size: '2.3 MB', modified: 'Today 09:42', path: '/Documents/Reports/', confidence: 0.94 }],
      approval: isReadOnly ? undefined : { action: 'Send file externally', fileName: 'Monthly_Report.pdf', destination: 'Slack / #reports', risk: 'Sensitive', domain: 'external-export', reason: 'Sending files to external services is an irreversible action. Approval keeps your data transfers under control.', confidence, requestedBy: 'MacBook Pro', dataPreview: 'Monthly_Report.pdf — 2.3 MB — /Documents/Reports/' },
      actions: isReadOnly ? [{ label: 'Switch Mode', icon: '🔄' }] : [{ label: 'Preview first', icon: '👁' }, { label: 'Cancel', icon: '✕' }],
      modeEscalated: escalated, systemNote,
    };
  }

  if ((lower.includes('find') || lower.includes('search')) && (lower.includes('pdf') || lower.includes('report') || lower.includes('file') || lower.includes('invoice') || lower.includes('document'))) {
    const confidence = 0.91;
    return {
      text: "Searched across connected devices and workspaces — found 3 matching files. Most recent modified today at 09:42.",
      fileCards: [
        { id: 'afc1', name: 'Q2_Report.pdf', type: 'PDF', size: '2.3 MB', modified: 'Today 09:42', path: '/Documents/Reports/', confidence: 0.96 },
        { id: 'afc2', name: 'Invoice_2026_041.pdf', type: 'PDF', size: '1.1 MB', modified: 'Yesterday', path: '/Finance/Invoices/', confidence: 0.89 },
        { id: 'afc3', name: 'Analysis_Q1.pdf', type: 'PDF', size: '4.7 MB', modified: '3 days ago', path: '/Projects/Analysis/', confidence: 0.72 },
      ],
      confidence, confidenceLevel: getConfidenceLevel(confidence), riskLevel: 'Safe', domain,
      actions: [{ label: 'Preview', icon: '👁' }, { label: 'Summarize', icon: '📝' }, { label: 'Send', icon: '📤' }, { label: 'Add to Workflow', icon: '⚡' }],
      newTask: { title: 'Searching workspace', status: 'completed', progress: 100, confidence, confidenceLevel: 'verified', icon: '🔍', riskLevel: 'Safe', domain },
    };
  }

  if (lower.includes('screenshot') || lower.includes('screen capture')) {
    const confidence = 0.91;
    return {
      text: "Analyzed 4 screenshots from MacBook Pro taken today. Found: 2 dashboard views, 1 error screen, 1 report preview. Extracted 14 data points — 3 values flagged for verification (confidence < 90%).",
      confidence, confidenceLevel: getConfidenceLevel(confidence), riskLevel: 'Safe', domain: 'general',
      correctionFields: [
        { id: 'cf1', label: 'Revenue figure', detected: '$1,248,500', confidence: 0.91 },
        { id: 'cf2', label: 'Active sessions', detected: '4,812', confidence: 0.95 },
        { id: 'cf3', label: 'Growth rate', detected: '+22%', confidence: 0.87 },
      ],
      requiresCorrection: true,
      actions: [{ label: 'Review Extracted Data', icon: '✏️' }, { label: 'Extract Metrics', icon: '📊' }, { label: 'Create Report', icon: '📋' }],
      newTask: { title: 'Analyzing screenshots', status: 'completed', progress: 100, confidence, confidenceLevel: 'verified', icon: '📸', riskLevel: 'Safe', domain: 'general', requiresCorrection: true },
    };
  }

  if (lower.includes('organiz') || lower.includes('sort') || lower.includes('clean') || lower.includes('folder')) {
    const confidence = 0.88;
    const riskLevel: AntRiskLevel = domain === 'file-deletion' ? 'High Risk' : 'Moderate';
    return {
      text: isReadOnly
        ? "Read-Only mode: mapped 47 files across 3 locations — Documents (18), Downloads (12), Desktop (8), uncategorized (9). Switch to Assist mode to get an organization plan."
        : "Found 47 files across 6 categories. I've prepared a step-by-step plan — review before I proceed.",
      confidence, confidenceLevel: getConfidenceLevel(confidence), riskLevel, domain: domain === 'file-deletion' ? 'file-deletion' : 'general',
      plan: isReadOnly ? undefined : {
        id: `plan-${Date.now()}`, actionType: 'ORGANIZATION' as AntActionType,
        intent: 'Organize workspace files by type and modification date',
        implicitNeeds: 'Preserving existing folder structure and naming conventions',
        urgency: 'normal', riskLevel, requiresApproval: true, status: 'preview',
        steps: [
          { id: 1, label: 'Scan workspace directories', device: 'MacBook Pro', operation: 'LIST_FILES', expectedOutcome: 'File manifest — 47 items', reversible: true, status: 'pending' },
          { id: 2, label: 'Classify by type and date', device: 'AI Ant', operation: 'CLASSIFY', expectedOutcome: '6 categories mapped', reversible: true, status: 'pending', dependsOn: [1] },
          { id: 3, label: 'Generate organization preview', device: 'AI Ant', operation: 'PREVIEW', expectedOutcome: 'Folder map ready for review', reversible: true, status: 'pending', dependsOn: [2] },
          { id: 4, label: 'Move files to target folders', device: 'MacBook Pro', operation: 'MOVE_FILES', expectedOutcome: '47 files organized', reversible: false, status: 'pending', dependsOn: [3] },
          { id: 5, label: 'Save patterns to memory', device: 'AI Ant', operation: 'LEARN', expectedOutcome: 'Organization rules remembered', reversible: true, status: 'pending', dependsOn: [4] },
        ],
      },
      actions: isReadOnly ? [{ label: 'View Map', icon: '🗺️' }] : undefined,
      modeEscalated: escalated, systemNote,
    };
  }

  if (lower.includes('summarize') || lower.includes('summary') || lower.includes('read')) {
    const confidence = 0.89;
    return {
      text: "**Document Summary — Q2 Report**\n\n• Total revenue: $2.4M (+12% vs Q1)\n• Top category: Enterprise Plan (48 units)\n• Pending items: 7 ($380,000 value)\n• Avg deal size: $50,000\n• Next milestone: Q3 planning review",
      confidence, confidenceLevel: getConfidenceLevel(confidence), riskLevel: 'Safe', domain,
      correctionFields: [
        { id: 'cf1', label: 'Total revenue', detected: '$2.4M', confidence: 0.89 },
        { id: 'cf2', label: 'Top category', detected: 'Enterprise Plan', confidence: 0.94 },
      ],
      requiresCorrection: confidence < 0.90,
      actions: [{ label: 'Export Summary', icon: '📤' }, { label: 'Send to Workflow', icon: '⚡' }, { label: 'Create Report', icon: '📋' }],
    };
  }

  if (lower.includes('workflow') || lower.includes('automate') || lower.includes('build') || lower.includes('pipeline')) {
    const confidence = 0.85;
    return {
      text: "Based on your description I've designed a pipeline. Review the plan before I build it.",
      confidence, confidenceLevel: getConfidenceLevel(confidence), riskLevel: 'Safe', domain: 'general',
      plan: {
        id: `plan-${Date.now()}`, actionType: 'AUTOMATION' as AntActionType,
        intent: 'Build an automation workflow from natural language description',
        implicitNeeds: 'Connecting to existing Colony agents and data sources',
        urgency: 'normal', riskLevel: 'Safe', requiresApproval: false, status: 'preview',
        steps: [
          { id: 1, label: 'Parse task description', device: 'AI Ant', operation: 'NLP_PARSE', expectedOutcome: 'Structured workflow spec', reversible: true, status: 'pending' },
          { id: 2, label: 'Map to agent capabilities', device: 'Colony Engine', operation: 'CAPABILITY_MAP', expectedOutcome: 'Agent assignments ready', reversible: true, status: 'pending', dependsOn: [1] },
          { id: 3, label: 'Generate workflow graph', device: 'Colony Engine', operation: 'BUILD_GRAPH', expectedOutcome: 'Workflow JSON created', reversible: true, status: 'pending', dependsOn: [2] },
          { id: 4, label: 'Open in Workflow Builder', device: 'App', operation: 'NAVIGATE', expectedOutcome: 'Builder opens with draft', reversible: true, status: 'pending', dependsOn: [3] },
        ],
      },
    };
  }

  if (lower.includes('spreadsheet') || lower.includes('excel') || lower.includes('sheet') || lower.includes('csv')) {
    const confidence = 0.87;
    return {
      text: "Found **Data_Analysis.xlsx** on Windows Desktop — 3 sheets (Data, Summary, Forecast), 248 rows. Key insight flagged at 82% confidence and marked for review.",
      confidence, confidenceLevel: getConfidenceLevel(confidence), riskLevel: 'Safe', domain: domain === 'finance' ? 'finance' : 'general',
      correctionFields: [
        { id: 'cf1', label: 'Sheet count', detected: '3 sheets', confidence: 0.97 },
        { id: 'cf2', label: 'Row count', detected: '248 rows', confidence: 0.94 },
        { id: 'cf3', label: 'Key insight', detected: 'Q2 +8% ahead of target', confidence: 0.82 },
      ],
      requiresCorrection: true,
      actions: [{ label: 'Review Fields', icon: '✏️' }, { label: 'Create Report', icon: '📋' }, { label: 'Export Data', icon: '📤' }],
      newTask: { title: 'Analyzing data source', status: 'completed', progress: 100, confidence, confidenceLevel: 'needs-review', icon: '📊', riskLevel: 'Safe', domain: domain === 'finance' ? 'finance' : 'general', requiresCorrection: true },
    };
  }

  if (lower.includes('monitor') || lower.includes('watch') || lower.includes('alert') || lower.includes('notify')) {
    const confidence = 0.82;
    return {
      text: "Setting up continuous monitoring with intelligent alerts. Review the plan before I activate.",
      confidence, confidenceLevel: getConfidenceLevel(confidence), riskLevel: 'Safe', domain: 'general',
      plan: {
        id: `plan-${Date.now()}`, actionType: 'SYSTEM_OPS' as AntActionType,
        intent: 'Configure continuous monitoring with intelligent alerts',
        implicitNeeds: 'Thresholds derived from your 30-day historical baseline',
        urgency: 'low', riskLevel: 'Safe', requiresApproval: false, status: 'preview',
        steps: [
          { id: 1, label: 'Connect to data sources', device: 'MacBook Pro', operation: 'CONNECT', expectedOutcome: '3 sources linked', reversible: true, status: 'pending' },
          { id: 2, label: 'Calculate baseline metrics', device: 'AI Ant', operation: 'BASELINE', expectedOutcome: 'Thresholds set automatically', reversible: true, status: 'pending', dependsOn: [1] },
          { id: 3, label: 'Start polling schedule', device: 'System', operation: 'CRON', expectedOutcome: 'Polling every 5 min', reversible: true, status: 'pending', dependsOn: [2] },
          { id: 4, label: 'Route alerts to all devices', device: 'System', operation: 'ROUTE', expectedOutcome: 'Instant alerts on 3 devices', reversible: true, status: 'pending', dependsOn: [3] },
        ],
      },
    };
  }

  if (lower.includes('extract') || lower.includes('ocr') || lower.includes('parse') || lower.includes('text from')) {
    const confidence = 0.91;
    return {
      text: "Semantic extraction complete:\n\n• 4 numeric values identified\n• 1 data table (8 rows × 4 columns)\n• 2 values flagged for manual verification\n\nReady to export as CSV or route directly to a workflow.",
      confidence, confidenceLevel: getConfidenceLevel(confidence), riskLevel: 'Safe', domain: 'general',
      correctionFields: [
        { id: 'cf1', label: 'Value A', detected: '1,248,500', confidence: 0.91 },
        { id: 'cf2', label: 'Value B', detected: '4,812 sessions', confidence: 0.95 },
        { id: 'cf3', label: 'Growth', detected: '+22%', confidence: 0.87 },
        { id: 'cf4', label: 'Error rate', detected: '0.3%', confidence: 0.93 },
      ],
      requiresCorrection: true,
      actions: [{ label: 'Review Fields', icon: '✏️' }, { label: 'Export CSV', icon: '📤' }, { label: 'Add to Workflow', icon: '⚡' }],
    };
  }

  if (lower.includes('drive') || lower.includes('sync') || lower.includes('upload') || lower.includes('cloud')) {
    const confidence = 0.86;
    return {
      text: "Ready to sync 12 project files (8.4 MB) to Google Drive › Project Workspace. External data transfer — approval required.",
      confidence, confidenceLevel: getConfidenceLevel(confidence), riskLevel: 'Moderate', domain: 'external-export',
      approval: { action: 'Sync files to Google Drive', destination: 'Google Drive / Project Workspace', risk: 'Moderate', domain: 'external-export', reason: 'Uploading to external cloud services is an outbound data transfer. Approval ensures you control what leaves your workspace.', confidence, requestedBy: 'MacBook Pro', dataPreview: '12 files · 8.4 MB · /Projects/' },
      actions: [{ label: 'Preview Files', icon: '👁' }, { label: 'Cancel', icon: '✕' }],
      modeEscalated: escalated, systemNote,
    };
  }

  if (lower.includes('delete') || lower.includes('remove') || lower.includes('trash')) {
    const confidence = 0.78;
    return {
      text: "File deletion is a **High Risk** irreversible action. I will not proceed without explicit approval regardless of operating mode. Want me to show a preview of what would be removed?",
      confidence, confidenceLevel: getConfidenceLevel(confidence), riskLevel: 'High Risk', domain: 'file-deletion',
      approval: { action: 'Delete files', risk: 'High Risk', domain: 'file-deletion', reason: 'Deletion is permanent and cannot be undone. This action requires manual review regardless of current mode.', confidence, requestedBy: 'User request' },
      actions: [{ label: 'Preview Targets', icon: '👁' }, { label: 'Cancel', icon: '✕' }],
      modeEscalated: mode === 'auto', systemNote: mode === 'auto' ? 'Auto mode blocked — file deletion always requires approval.' : undefined,
    };
  }

  if (lower.includes('email') || lower.includes('inbox') || lower.includes('gmail')) {
    const confidence = 0.88;
    return {
      text: isReadOnly
        ? "Read-Only: Found 12 unread messages (3 flagged important). I can read and summarize but not compose or send in this mode."
        : "Email domain detected — sensitive context. Found 12 unread messages. Any reply or send action will be staged and require explicit approval.",
      confidence, confidenceLevel: getConfidenceLevel(confidence), riskLevel: 'Sensitive', domain: 'email',
      actions: isReadOnly ? [{ label: 'View Summary', icon: '📋' }] : [{ label: 'Read Inbox', icon: '📧' }, { label: 'Draft Reply', icon: '✏️' }],
      modeEscalated: mode === 'auto', systemNote: mode === 'auto' ? 'Auto mode escalated — email is a sensitive domain.' : undefined,
    };
  }

  const confidence = 0.75;
  return {
    text: `Understood. I can help with files, data extraction, workspace integration, workflow automation, and cross-device operations. What's the specific outcome you need?\n\n"${input.length > 60 ? input.slice(0, 60) + '…' : input}"`,
    confidence, confidenceLevel: getConfidenceLevel(confidence), riskLevel: 'Safe', domain: 'general',
    actions: [{ label: 'Find Files', icon: '🔍' }, { label: 'Build Workflow', icon: '⚡' }, { label: 'Create Report', icon: '📋' }],
  };
}


function classifyExecutionMode(text: string): ChatMode {
  const t = text.toLowerCase();
  const has = (...w: string[]) => w.some((x) => t.includes(x));
  if (has('one-man', 'one man', 'ai company', 'whole business', 'run a business', 'enterprise')) return 'one_man_enterprise';
  if (has('approve', 'send email', 'publish', 'delete', 'spend', 'payment', 'share data')) return 'approval_sensitive_action';
  if (has('every monday', 'weekly', 'daily', 'schedule', 'recurring', 'automate', 'repeatable')) return 'workflow_task';
  if (has('screenshot', 'browser', 'device', 'connector', 'open file', 'filesystem')) return 'tool_device_action';
  if (has('team', 'agents', 'swarm', 'workforce', 'analyze and report', 'research and write')) return 'ai_team_task';
  if (has('project', 'start a project', 'plan this project', 'manage')) return 'create_project';
  if (has('add source', 'attach', 'upload', 'add file', 'add link', 'add knowledge')) return 'add_source';
  if (has('analyze', 'summarize', 'research', 'draft', 'write')) return 'single_agent_task';
  return 'simple_chat';
}

const EXECUTION_MODE_LABEL: Record<ChatMode, string> = {
  simple_chat: 'Answering directly',
  create_project: 'Proposing a project',
  add_source: 'Adding project knowledge',
  single_agent_task: 'Assigning a specialist',
  ai_team_task: 'Proposing an AI team',
  one_man_enterprise: 'Building your AI organization',
  workflow_task: 'Creating a repeatable process',
  tool_device_action: 'Using a tool with approval',
  approval_sensitive_action: 'Review before AI acts',
};

// ── analyzeAndMatchAgents ─────────────────────────────────────────────────────

function colonyDeliverableToApp(d: ColonyDeliverable, chatTitle?: string): AppDeliverable {
  const typeMap: Record<ColonyDeliverableType, AppDeliverable['type']> = {
    report: 'report', strategy: 'strategy', spreadsheet: 'report', presentation: 'plan',
    email_draft: 'draft', research_summary: 'research', business_plan: 'plan',
    marketing_plan: 'plan', task_list: 'summary', workflow_automation: 'workflow_automation',
    decision_recommendation: 'strategy',
  };
  const statusMap: Record<ColonyDeliverableStatus, AppDeliverable['status']> = {
    draft: 'draft', in_progress: 'draft', needs_review: 'needs_review',
    approved: 'approved', exported: 'export_ready', archived: 'draft',
  };
  return {
    id: d.id,
    title: d.title,
    description: d.preview || d.sourceTasks[0] || '',
    type: typeMap[d.type] ?? 'draft',
    status: statusMap[d.status] ?? 'draft',
    ownerAgent: d.ownerAgentId ?? undefined,
    projectId: d.projectId,
    sourceChatId: d.sourceChatId,
    sourceCrewRunId: d.sourceCrewRunId,
    sourceWorkflowId: d.sourceWorkflowId,
    sourcePrompt: d.sourceTasks[0],
    createdAt: typeof d.createdAt === 'string' ? d.createdAt : new Date().toISOString(),
    updatedAt: typeof d.updatedAt === 'string' ? d.updatedAt : new Date().toISOString(),
    version: d.version,
    content: d.content,
  };
}

function AIAntPage({
  setPage, safetyMode, activeChat, currentUserId, onEnsureChat, onPersistChatMessages, onAutoTitleChat, onPublishDeliverable, onLaunchBridgeSession, onMarkChatWork, onCreateFeatureWorkItem, onUpdateWorkItem, onDiscardDraftChat,
}: {
  setPage: (p: Page) => void;
  safetyMode: boolean;
  activeChat: WorkspaceChat | null;
  currentUserId: string;
  onEnsureChat: () => string;
  onPersistChatMessages: (id: string, messages: WorkspaceMessage[]) => void;
  onAutoTitleChat: (id: string, message: string) => void;
  onPublishDeliverable?: (d: AppDeliverable) => void;
  onLaunchBridgeSession: (taskText: string, sourceConversationId?: string) => void;
  onMarkChatWork: (id: string, type: WorkItemType, status?: WorkItemStatus) => void;
  onCreateFeatureWorkItem: (input: { type: Exclude<WorkItemType, 'chat' | 'bridge'>; title: string; status: WorkItemStatus; sourceConversationId?: string; sessionId?: string; replaceChatId?: string; enterpriseWorkspace?: EnterpriseWorkspaceProject }) => string;
  onUpdateWorkItem: (id: string, patch: Partial<Pick<WorkspaceChat, 'title' | 'workStatus' | 'sourceConversationId' | 'sessionId' | 'enterpriseWorkspace'>>) => void;
  onDiscardDraftChat: (id: string) => void;
}) {
  const [view, setView] = React.useState<'home' | 'chat' | 'search' | 'graph' | 'knowledge' | 'project' | 'crew' | 'workflow-builder'>('home');
  const [mode, setMode] = React.useState<AntMode>('approval');
  const [agentInputMode, setAgentInputMode] = React.useState<AgentInputMode>('Auto');
  const [modelRoutingPreference, setModelRoutingPreference] = React.useState<ModelRoutingPreference>('auto');
  const [manualModelSelection, setManualModelSelection] = React.useState<ManualModelSelection | null>({ capability: 'text_reasoning', provider: 'deepseek', modelId: 'deepseek-v3' });
  const [prompt, setAntPrompt] = React.useState('');
  const [voiceActive, setVoiceActive] = React.useState(false);
  const [messages, setMessages] = React.useState<AntMessage[]>([]);
  const [tasks, setTasks] = React.useState<AntTask[]>(ANT_INITIAL_TASKS);
  const [logs, setLogs] = React.useState<AntActivityEntry[]>(ANT_INITIAL_LOGS);
  const [devices] = React.useState<AntDevice[]>(ANT_DEVICES);
  const [workspaces] = React.useState<AntWorkspace[]>(ANT_WORKSPACES);
  const [memories, setMemories] = React.useState<AntMemoryEntry[]>(ANT_INITIAL_MEMORIES);
  const [approval, setApproval] = React.useState<AntApproval | null>(null);
  const [thinking, setThinking] = React.useState(false);
  const [rightPanel, setRightPanel] = React.useState<'tasks' | 'activity' | 'devices' | 'workspace' | 'memory' | 'tools' | 'permissions' | 'delivery' | 'patterns' | 'suggestions' | 'knowledge'>('tasks');
  const [correctionMsgId, setCorrectionMsgId] = React.useState<string | null>(null);
  const [messageFeedback, setMessageFeedback] = React.useState<Record<string, 'up' | 'down'>>({});
  const [copiedMessageId, setCopiedMessageId] = React.useState<string | null>(null);
  const chatEndRef = React.useRef<HTMLDivElement>(null);
  // Extended state — features 61-75
  const [liveConsoleOpen, setLiveConsoleOpen] = React.useState(false);
  const [consolePaused, setConsolePaused] = React.useState(false);
  const [liveEvents, setLiveEvents] = React.useState<AntLiveEvent[]>(ANT_INITIAL_LIVE_EVENTS);
  const [autonomySelectorOpen, setAutonomySelectorOpen] = React.useState(false);
  const [deliveries, setDeliveries] = React.useState<AntDelivery[]>(ANT_INITIAL_DELIVERIES);
  const [permissions, setPermissions] = React.useState<AntPermissionScope[]>(ANT_PERMISSIONS);
  const [handoff, setHandoff] = React.useState<AntHandoff | null>({
    id: 'ho1', taskTitle: 'Summarize Q2 Finance Report', fromDevice: 'iPhone 15',
    toDevice: 'MacBook Pro', progress: 42, status: 'pending', transferredAt: '09:10',
  });
  const [failedTask, setFailedTask] = React.useState<string | null>(null);
  // Features 76-83 state
  const [learnedPatterns, setLearnedPatterns] = React.useState<AntLearnedPattern[]>(ANT_LEARNED_PATTERNS);
  const [knowledge, setKnowledge] = React.useState<KnowledgeEntry[]>(ANT_KNOWLEDGE_INITIAL);
  const [notifications, setNotifications] = React.useState<AntNotification[]>(ANT_NOTIFICATIONS_INITIAL);
  const [suggestions, setSuggestions] = React.useState<AntSuggestion[]>(ANT_SUGGESTIONS_INITIAL);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [graphOpen, setGraphOpen] = React.useState(false);
  const [voiceState, setVoiceState] = React.useState<VoiceState>('idle');
  const [voiceTranscript, setVoiceTranscript] = React.useState('');
  const [voiceBarVisible, setVoiceBarVisible] = React.useState(false);
  // Features 84-94 state
  const [workflows, setWorkflows] = React.useState<AntWorkflowDef[]>(ANT_WORKFLOWS_INITIAL);
  const [colonySession] = React.useState<AntColonySession>(ANT_COLONY_SESSION);
  const [teamMembers] = React.useState<TeamMember[]>(ANT_TEAM_MEMBERS);
  const [workspaceMembers, setWorkspaceMembers] = React.useState<WorkspaceMember[]>(() => {
    try {
      const raw = localStorage.getItem(WORKSPACE_MEMBERS_STORAGE_KEY);
      if (raw) return JSON.parse(raw) as WorkspaceMember[];
    } catch { /* ignore */ }
    return [
      { id: 'wm-owner', type: 'human', name: 'You', email: 'you@colony.local', role: 'Founder', permission: 'owner', status: 'active', createdAt: new Date().toISOString() },
      { id: 'wm-ant', type: 'agent', name: 'AI Ant', role: 'Operator', permission: 'agent', status: 'active', avatar: ENTERPRISE_AGENT_AVATARS.director, instructions: 'Coordinate workspace context and ask for approval before risky actions.', createdAt: new Date().toISOString() },
    ];
  });
  const [memberModal, setMemberModal] = React.useState<WorkspaceMemberModalState | null>(null);
  const [workspaceToast, setWorkspaceToast] = React.useState('');

  // ── Orchestration state ──────────────────────────────────────────────────
  const [enterpriseOpen, setEnterpriseOpen] = React.useState(false);
  const [orchMode, setOrchMode] = React.useState<OrchestrationMode>('chat');
  const [orchView, setOrchView] = React.useState<OrchestrationView>('chat');
  const [orchAgents, setOrchAgents] = React.useState<OrchAgent[]>([]);
  const [orchMessages, setOrchMessages] = React.useState<OrchMessage[]>([]);
  const [orchTask, setOrchTask] = React.useState('');
  const [matchedAgents, setMatchedAgents] = React.useState<MatchedAgent[]>([]);
  const [matchReason, setMatchReason] = React.useState('');
  const [showAgentPanel, setShowAgentPanel] = React.useState(true);
  const [historyOpen, setHistoryOpen] = React.useState(false);

  // ── More menu state ──────────────────────────────────────────────────────
  const [moreMenuOpen, setMoreMenuOpen] = React.useState(false);
  const [moreMenuPos, setMoreMenuPos] = React.useState({ top: 0, left: 0 });
  const moreMenuBtnRef = React.useRef<HTMLButtonElement>(null);
  const [moreSheetOpen, setMoreSheetOpen] = React.useState(false);
  const [moreSheetTab, setMoreSheetTab] = React.useState<'tasks' | 'workflows' | 'colony' | 'suggestions' | 'devices' | 'team'>('tasks');
  const [deviceHubOpen, setDeviceHubOpen] = React.useState(false);
  const [workspaceDrawerOpen, setWorkspaceDrawerOpen] = React.useState(false);
  const [workspaceDrawerTab, setWorkspaceDrawerTab] = React.useState<'members' | 'assets' | 'overview' | 'tasks' | 'team' | 'activity' | 'deliverables' | 'approvals'>('members');
  const [teamProposal, setTeamProposal] = React.useState<AntTeamProposal | null>(null);
  const [proposalAdvancedOpen, setProposalAdvancedOpen] = React.useState(false);
  const [activeGeneratedProject, setActiveGeneratedProject] = React.useState<AntGeneratedProject | null>(null);
  const [activeEnterpriseProject, setActiveEnterpriseProject] = React.useState<EnterpriseWorkspaceProject | null>(null);
  // ── One-Man Enterprise startup flow ───────────────────────────────────────
  // TODO(backend): persist OneManEnterpriseSetup to a real store / localStorage.
  const [enterpriseSetup, setEnterpriseSetup] = React.useState<OneManEnterpriseSetup | null>(() => {
    try {
      const raw = localStorage.getItem(ENTERPRISE_SETUP_STORAGE_KEY);
      return raw ? JSON.parse(raw) as OneManEnterpriseSetup : null;
    } catch { /* ignore */ }
    return null;
  });
  const enterpriseTimersRef = React.useRef<number[]>([]);
  const enterpriseWorkItemIdRef = React.useRef<string | null>(null);
  const clearEnterpriseTimers = React.useCallback(() => {
    enterpriseTimersRef.current.forEach((t) => window.clearTimeout(t));
    enterpriseTimersRef.current = [];
  }, []);
  const enterpriseRestoredRef = React.useRef(false);
  React.useEffect(() => () => clearEnterpriseTimers(), [clearEnterpriseTimers]);
  React.useEffect(() => {
    try { localStorage.setItem(WORKSPACE_MEMBERS_STORAGE_KEY, JSON.stringify(workspaceMembers)); } catch { /* ignore */ }
  }, [workspaceMembers]);
  React.useEffect(() => {
    try {
      if (enterpriseSetup) localStorage.setItem(ENTERPRISE_SETUP_STORAGE_KEY, JSON.stringify(enterpriseSetup));
      else localStorage.removeItem(ENTERPRISE_SETUP_STORAGE_KEY);
    } catch { /* ignore */ }
  }, [enterpriseSetup]);

  React.useEffect(() => {
    if (!activeChat || resolveWorkItemType(activeChat) !== 'enterprise') return;
    if (activeChat.workStatus === 'setup' && enterpriseSetup) return;
    enterpriseWorkItemIdRef.current = activeChat.id;
    const restored = activeChat.enterpriseWorkspace
      ?? { ...buildEnterpriseWorkspaceProject(activeChat.title), id: activeChat.sessionId ?? activeChat.id, name: activeChat.title };
    setActiveEnterpriseProject(restored);
    setEnterpriseSetup(null);
    setView('project');
    if (activeChat.workStatus !== 'running') {
      onUpdateWorkItem(activeChat.id, { workStatus: 'running', enterpriseWorkspace: restored, sessionId: restored.id });
    }
  }, [activeChat?.id, enterpriseSetup]);
  const [activeCrewRun, setActiveCrewRun] = React.useState<CrewRun | null>(null);
  const [executionDecision, setExecutionDecision] = React.useState<ExecutionDecision | null>(null);
  const [routingDecision, setRoutingDecision] = React.useState<RoutingDecision | null>(null);
  const [routingModelSettingsOpen, setRoutingModelSettingsOpen] = React.useState(false);
  const [projectIntent, setProjectIntent] = React.useState<ProjectIntent | null>(null);
  const [activeWorkflow, setActiveWorkflow] = React.useState<WorkflowDef | null>(null);
  const [selectedWorkflowNodeId, setSelectedWorkflowNodeId] = React.useState<string | null>(null);
  const [selectedWorkflowEdgeId, setSelectedWorkflowEdgeId] = React.useState<string | null>(null);
  const [workflowRunLogs, setWorkflowRunLogs] = React.useState<string[]>([]);
  const workflowRunTimersRef = React.useRef<number[]>([]);
  const [deviceAction, setDeviceAction] = React.useState<DeviceAction | null>(null);
  const [colonyDeliverables, setColonyDeliverables] = React.useState<ColonyDeliverable[]>([]);
  const [activitySummaries, setActivitySummaries] = React.useState<string[]>([
    'AI Ant is ready to classify goals, propose the right mode, and produce reviewable outputs.',
  ]);
  const [swarmState, setSwarmState] = React.useState<SwarmState>('analyzing_goal');
  // ── Colony Crew slide-in panel ────────────────────────────────────────────
  const [crew, setCrew] = React.useState<ColonyCrewSession | null>(null);
  const [crewPanelOpen, setCrewPanelOpen] = React.useState(false);
  const [crewSelectedAgentId, setCrewSelectedAgentId] = React.useState<string | null>(null);
  const crewTimersRef = React.useRef<number[]>([]);
  // Pausable timeline scheduler for crew progression.
  const crewSchedRef = React.useRef<{ steps: { at: number; run: () => void }[]; idx: number; elapsed: number; paused: boolean; stopped: boolean } | null>(null);
  const crewTickRef = React.useRef<number | null>(null);
  const clearCrewTimers = React.useCallback(() => {
    crewTimersRef.current.forEach((t) => window.clearTimeout(t));
    crewTimersRef.current = [];
    if (crewTickRef.current != null) { window.clearTimeout(crewTickRef.current); crewTickRef.current = null; }
    if (crewSchedRef.current) crewSchedRef.current.stopped = true;
  }, []);
  const pumpCrew = React.useCallback(() => {
    const TICK = 200;
    const loop = () => {
      const s = crewSchedRef.current;
      if (!s || s.stopped) return;
      if (!s.paused) {
        s.elapsed += TICK;
        while (s.idx < s.steps.length && s.steps[s.idx].at <= s.elapsed) {
          s.steps[s.idx].run();
          s.idx += 1;
        }
      }
      if (s.idx < s.steps.length) crewTickRef.current = window.setTimeout(loop, TICK);
      else crewTickRef.current = null;
    };
    if (crewTickRef.current != null) window.clearTimeout(crewTickRef.current);
    crewTickRef.current = window.setTimeout(loop, TICK);
  }, []);
  React.useEffect(() => () => clearCrewTimers(), [clearCrewTimers]);
  // ── Device mode: action / permission flow ─────────────────────────────────
  const [deviceReq, setDeviceReq] = React.useState<DeviceActionRequest | null>(null);
  const [bridgeSetupCard, setBridgeSetupCard] = React.useState<BridgeSetupCardData | null>(null);
  const [deviceProjectApproved, setDeviceProjectApproved] = React.useState(false);
  const deviceTimersRef = React.useRef<number[]>([]);
  const clearDeviceTimers = React.useCallback(() => {
    deviceTimersRef.current.forEach((t) => window.clearTimeout(t));
    deviceTimersRef.current = [];
  }, []);
  React.useEffect(() => () => clearDeviceTimers(), [clearDeviceTimers]);
  const clearWorkflowRunTimers = React.useCallback(() => {
    workflowRunTimersRef.current.forEach((t) => window.clearTimeout(t));
    workflowRunTimersRef.current = [];
  }, []);
  React.useEffect(() => () => clearWorkflowRunTimers(), [clearWorkflowRunTimers]);
  const hydratingChatRef = React.useRef(false);
  const skipHydrateChatIdRef = React.useRef<string | null>(null);
  const activeChatId = activeChat?.id ?? null;

  React.useEffect(() => {
    if (activeChatId && skipHydrateChatIdRef.current === activeChatId) {
      skipHydrateChatIdRef.current = null;
      return;
    }
    hydratingChatRef.current = true;
    const restoredMessages: AntMessage[] = (activeChat?.messages ?? []).map((message) => ({
      id: message.id,
      role: message.role,
      text: message.text,
      timestamp: new Date(message.ts).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      workflowProposal: message.workflowProposal,
    }));
    setMessages(restoredMessages);
    setView(restoredMessages.length ? 'chat' : 'home');
    setAntPrompt('');
    setThinking(false);
    setTeamProposal(null);
    setProposalAdvancedOpen(false);
    setActiveGeneratedProject(null);
    setActiveEnterpriseProject(null);
    setActiveCrewRun(null);
    setExecutionDecision(null);
    setProjectIntent(null);
    setActiveWorkflow(null);
    setSelectedWorkflowNodeId(null);
    setSelectedWorkflowEdgeId(null);
    setWorkflowRunLogs([]);
    setDeviceAction(null);
    setColonyDeliverables([]);
    setApproval(null);
    setMatchedAgents([]);
    setOrchAgents([]);
    setOrchMessages([]);
    setOrchTask('');
    setMatchReason('');
    setOrchMode('chat');
    setOrchView('chat');
    setSwarmState('analyzing_goal');
    clearCrewTimers();
    setCrew(null);
    setCrewPanelOpen(false);
    setCrewSelectedAgentId(null);
    clearDeviceTimers();
    clearWorkflowRunTimers();
    setDeviceReq(null);
    setDeviceProjectApproved(false);
    window.setTimeout(() => { hydratingChatRef.current = false; }, 0);
  }, [activeChatId, clearCrewTimers, clearDeviceTimers, clearWorkflowRunTimers]);

  React.useEffect(() => {
    if (!activeChatId || hydratingChatRef.current) return;
    const persistedMessages: WorkspaceMessage[] = messages.map((message) => ({
      id: message.id,
      role: message.role,
      text: message.text,
      ts: Date.now(),
      workflowProposal: message.workflowProposal,
    }));
    onPersistChatMessages(activeChatId, persistedMessages);
  }, [activeChatId, messages, onPersistChatMessages]);

  const confirmPlan = React.useCallback((plan: AntTaskPlan, msgId: string) => {
    const runStep = (idx: number) => {
      window.setTimeout(() => {
        setMessages((prev) => prev.map((m) => {
          if (m.id !== msgId || !m.plan) return m;
          const newSteps = m.plan.steps.map((s, i) => ({
            ...s,
            status: (i < idx ? 'done' : i === idx ? 'done' : i === idx + 1 ? 'running' : s.status) as AntPlanStep['status'],
          }));
          return { ...m, plan: { ...m.plan, steps: newSteps, status: idx === plan.steps.length - 1 ? 'complete' : 'executing' } };
        }));
        if (idx < plan.steps.length - 1) runStep(idx + 1);
        else window.setTimeout(() => {
          setMessages((prev) => [...prev, {
            id: `aa-${Date.now()}`, role: 'ant',
            text: `✅ Plan complete — ${plan.steps.length} steps executed successfully.`,
            timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
            confidence: 0.98, confidenceLevel: 'verified', riskLevel: 'Safe', domain: 'general',
          }]);
        }, 500);
      }, 1500);
    };
    setMessages((prev) => prev.map((m) => {
      if (m.id !== msgId || !m.plan) return m;
      const newSteps = m.plan.steps.map((s, i) => ({ ...s, status: (i === 0 ? 'running' : 'pending') as AntPlanStep['status'] }));
      return { ...m, plan: { ...m.plan, steps: newSteps, status: 'executing' } };
    }));
    runStep(0);
  }, []);

  const cancelPlan = React.useCallback((msgId: string) => {
    setMessages((prev) => prev.map((m) => m.id === msgId && m.plan ? { ...m, plan: { ...m.plan, status: 'cancelled' } } : m));
  }, []);

  const stopOrchestration = React.useCallback(() => {
    setOrchAgents(prev => prev.map(a => ({ ...a, status: 'idle' as const, currentTask: undefined })));
    setMatchedAgents([]);
    setMatchReason('');
    setOrchMode('chat');
    setActiveCrewRun((prev) => prev ? { ...prev, status: 'stopped' } : prev);
  }, []);

  const ctlMsg = React.useCallback((m: Omit<CrewControlMessage, 'id' | 'createdAt'>): CrewControlMessage => ({
    ...m, id: `ctl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
  }), []);
  const pushControl = React.useCallback((m: Omit<CrewControlMessage, 'id' | 'createdAt'>) => {
    setCrew((p) => p ? { ...p, control: [...p.control, ctlMsg(m)] } : p);
  }, [ctlMsg]);

  const stopColonyCrew = React.useCallback(() => {
    clearCrewTimers();
    const ts = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    setCrew((prev) => prev && prev.phase !== 'completed'
      ? {
          ...prev,
          phase: 'stopped',
          paused: false,
          agents: prev.agents.map((a) => a.status === 'done' ? a : { ...a, status: 'matched' as const }),
          activity: [...prev.activity, { id: `cae-${Date.now()}`, text: 'Colony Crew was stopped before completion.', ts }],
          control: [...prev.control, ctlMsg({ senderType: 'system', text: 'Colony Crew stopped. Progression halted; no final result will be delivered.' })],
        }
      : prev);
    setMessages((prev) => [...prev, {
      id: `aa-${Date.now()}-crew-stop`, role: 'ant',
      text: 'Colony Crew was stopped before completion.',
      timestamp: ts, confidence: 0.9, confidenceLevel: 'verified', riskLevel: 'Safe', domain: 'general',
    }]);
  }, [clearCrewTimers, ctlMsg]);

  const pauseColonyCrew = React.useCallback(() => {
    if (crewSchedRef.current) crewSchedRef.current.paused = true;
    setCrew((p) => p && (p.phase === 'running' || p.phase === 'reviewing' || p.phase === 'crew_ready')
      ? {
          ...p, paused: true,
          agents: p.agents.map((a) => a.status === 'working' ? { ...a, status: 'matched' as const } : a),
          control: [...p.control, ctlMsg({ senderType: 'system', text: 'Colony Crew paused. Current state is frozen until you resume.' })],
        }
      : p);
  }, [ctlMsg]);

  const resumeColonyCrew = React.useCallback(() => {
    if (crewSchedRef.current) crewSchedRef.current.paused = false;
    setCrew((p) => p && p.paused
      ? {
          ...p, paused: false,
          agents: p.agents.map((a) => a.status === 'matched' && p.phase === 'running' ? { ...a, status: 'working' as const } : a),
          control: [...p.control, ctlMsg({ senderType: 'system', text: 'Colony Crew resumed. Work is continuing.' })],
        }
      : p);
  }, [ctlMsg]);

  const launchColonyCrew = React.useCallback((task: string) => {
    clearCrewTimers();
    const tnow = () => new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    let evSeq = 0;
    const ev = (text: string): CrewActivityEvent => ({ id: `cae-${Date.now()}-${evSeq++}`, text, ts: tnow() });
    const pushActivity = (text: string) =>
      setCrew((p) => p ? { ...p, activity: [...p.activity, ev(text)] } : p);

    setCrewSelectedAgentId(null);
    setCrew({
      task,
      phase: 'matching',
      stepIndex: 0,
      agents: buildColonyCrewAgents(),
      activity: [ev('User started Colony Crew task'), ev('AI Ant analyzed task request')],
      control: [ctlMsg({ senderType: 'system', text: 'Crew Control ready. Talk to an agent or the full crew, refine the task, or pause/stop the run.' })],
      paused: false,
      resultMsgId: null,
    });
    setCrewPanelOpen(true);
    const crewSessionId = `crew-${Date.now()}`;
    onCreateFeatureWorkItem({
      type: 'crew',
      title: generateChatTitle(task),
      status: 'assembling',
      sourceConversationId: sourceConversationForFeature(activeChat),
      replaceChatId: isEmptyDraftStandaloneChat(activeChat) ? activeChat!.id : undefined,
      sessionId: crewSessionId,
    });

    // Start optimistic progress loop
    let stepCount = 0;
    const loopId = window.setInterval(() => {
      setCrew((p) => {
        if (!p || p.phase === 'completed' || p.phase === 'stopped') {
          window.clearInterval(loopId);
          return p;
        }
        stepCount++;
        if (stepCount < 4) {
          return { ...p, stepIndex: stepCount };
        } else if (stepCount === 4) {
          return { ...p, phase: 'crew_ready', agents: p.agents.map((a) => ({ ...a, status: 'matched' as const })) };
        } else if (stepCount === 5) {
          return { ...p, phase: 'running', agents: p.agents.map((a) => ({ ...a, status: 'working' as const, progress: 24 })) };
        } else if (stepCount < 25) {
          return { ...p, agents: p.agents.map((a) => ({ ...a, progress: Math.min(95, a.progress + 3) })) };
        }
        return p;
      });
    }, 1000);
    crewTimersRef.current.push(loopId);

    // Call the real API
    runColonyCrew(task).then((res) => {
      window.clearInterval(loopId);
      const resultId = `aa-${Date.now()}-crew-result`;
      
      setCrew((p) => {
        if (!p) return p;
        return {
          ...p,
          phase: 'completed',
          resultMsgId: resultId,
          agents: p.agents.map((a) => ({ ...a, status: 'done' as const, progress: 100 })),
          activity: [...p.activity, ...res.activity.map(a => ev(`[${a.agent_id}] ${a.step}`)), ev('Final result ready')],
          control: [...p.control, ctlMsg({ senderType: 'system', text: 'Crew completed. Final result delivered to the main chat.' })],
        };
      });

      setMessages((prev) => [...prev, {
        id: resultId, role: 'ant',
        text: res.deliverable.content_md + `\n\n*(Source: ${res.source})*`,
        timestamp: tnow(), confidence: 0.96, confidenceLevel: 'verified', riskLevel: 'Safe', domain: 'general',
        actionType: 'DATA_ANALYSIS',
      }]);
      onCreateFeatureWorkItem({
        type: 'crew',
        title: generateChatTitle(task),
        status: 'completed',
        sourceConversationId: sourceConversationForFeature(activeChat),
        sessionId: crewSessionId,
      });
      window.setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    }).catch((err) => {
      pushActivity(`Crew error: ${err.message}`);
      onCreateFeatureWorkItem({
        type: 'crew',
        title: generateChatTitle(task),
        status: 'failed',
        sourceConversationId: sourceConversationForFeature(activeChat),
        sessionId: crewSessionId,
      });
    });
  }, [activeChat, clearCrewTimers, ctlMsg, onCreateFeatureWorkItem]);

  // ── Crew Control: talk to / redirect / reassign agents ────────────────────
  const aMsg = React.useCallback((sender: 'user' | 'agent', text: string): AgentInstructionMessage => ({
    id: `aim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, sender, text,
    createdAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
  }), []);
  const appendAgentMsgs = React.useCallback((agentId: string, msgs: AgentInstructionMessage[]) => {
    setCrew((p) => p ? {
      ...p,
      agents: p.agents.map((a) => a.id === agentId ? { ...a, instructionMessages: [...a.instructionMessages, ...msgs] } : a),
    } : p);
  }, []);

  const askCrewUpdate = React.useCallback((targetId: string) => {
    setCrew((p) => {
      if (!p) return p;
      const a = p.agents.find((ag) => ag.id === targetId) ?? p.agents[0];
      const text = p.phase === 'completed' ? 'Done — the full result is in the main chat.'
        : p.phase === 'stopped' ? 'I’m stopped. Nothing is running right now.'
        : p.paused ? 'Holding — paused until you resume.'
        : `${a.outputSoFar}. Currently: ${a.currentTask.toLowerCase()} (${a.progress}%).`;
      return {
        ...p,
        agents: p.agents.map((ag) => ag.id === a.id ? { ...ag, instructionMessages: [...ag.instructionMessages, aMsg('agent', text)] } : ag),
      };
    });
  }, [aMsg]);

  const sendCrewControl = React.useCallback((targetId: string, raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const { intent, reassignTo } = parseCrewControl(text);
    const agent = crew?.agents.find((a) => a.id === targetId) ?? crew?.agents[0];
    const agentId = agent?.id ?? targetId;

    // User instruction always lands inside the selected agent's workspace.
    appendAgentMsgs(agentId, [aMsg('user', text)]);

    if (intent === 'stop') {
      appendAgentMsgs(agentId, [aMsg('agent', 'Stopping now — halting the crew.')]);
      stopColonyCrew();
      return;
    }
    if (intent === 'pause') {
      pauseColonyCrew();
      window.setTimeout(() => appendAgentMsgs(agentId, [aMsg('agent', 'Paused. I’ll hold this state until you resume.')]), 60);
      return;
    }
    if (intent === 'resume') {
      resumeColonyCrew();
      window.setTimeout(() => appendAgentMsgs(agentId, [aMsg('agent', 'Resuming — back to work.')]), 60);
      return;
    }
    if (intent === 'update') { window.setTimeout(() => askCrewUpdate(agentId), 220); return; }

    if (intent === 'reassign') {
      setCrew((p) => {
        if (!p) return p;
        const to = p.agents.find((a) => a.kind === reassignTo) ?? p.agents.find((a) => a.id === agentId) ?? p.agents[0];
        const short = `Taking over: ${p.task.slice(0, 60)}`;
        return {
          ...p,
          agents: p.agents.map((a) => {
            if (a.id === to.id) return { ...a, currentTask: short, instructionMessages: [...a.instructionMessages, aMsg('agent', `Picking this up — ${short.toLowerCase()}.`)] };
            if (a.id === agentId && a.id !== to.id) return { ...a, instructionMessages: [...a.instructionMessages, aMsg('agent', `Handing this to ${to.name}.`)] };
            return a;
          }),
        };
      });
      return;
    }

    // refine / redirect — update the selected agent and acknowledge in its workspace.
    setCrew((p) => {
      if (!p) return p;
      const a = p.agents.find((ag) => ag.id === agentId) ?? p.agents[0];
      const short = text.length > 70 ? `${text.slice(0, 70)}…` : text;
      const ack = a.kind === 'research' ? 'Understood. I’ll narrow the research to the most relevant, high-signal sources for that.'
        : a.kind === 'analyst' ? 'Understood. I’ll prioritise business impact, risks, and decision factors.'
        : a.kind === 'writer' ? 'Understood. I’ll adjust the draft tone and structure accordingly.'
        : 'Understood. I’ll focus the review on that first.';
      return {
        ...p,
        agents: p.agents.map((ag) => ag.id === a.id
          ? {
              ...ag,
              currentTask: short,
              thinkingSummary: `Refining based on: ${short}`,
              outputSoFar: `${ag.outputSoFar} · adjusted for “${short}”`,
              notes: [short, ...ag.notes].slice(0, 4),
              instructionMessages: [...ag.instructionMessages, aMsg('agent', ack)],
            }
          : ag),
      };
    });
  }, [crew, aMsg, appendAgentMsgs, stopColonyCrew, pauseColonyCrew, resumeColonyCrew, askCrewUpdate]);

  // ── Device mode handlers ──────────────────────────────────────────────────
  const runDeviceProgress = React.useCallback((req: DeviceActionRequest) => {
    clearDeviceTimers();
    const tnow = () => new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    setDeviceReq((p) => p ? { ...p, status: 'running', progressStep: 0 } : p);
    DEVICE_RUN_STEPS.forEach((_, i) => {
      deviceTimersRef.current.push(window.setTimeout(() => {
        setDeviceReq((p) => p ? { ...p, progressStep: i + 1 } : p);
      }, (i + 1) * 900));
    });
    deviceTimersRef.current.push(window.setTimeout(() => {
      const result = `Done. ${req.verb} on "${req.target}" via ${req.sourceTool} with ${req.accessLevel} access. ` +
        (req.risk === 'high'
          ? 'No data left this device — the external step was prepared for your final confirmation only.'
          : req.accessLevel === 'read-only'
            ? 'The source was read and the relevant information was extracted into the result below.'
            : 'The action completed within the approved scope.');
      setDeviceReq((p) => p ? { ...p, status: 'completed', progressStep: DEVICE_RUN_STEPS.length, result } : p);
      setMessages((prev) => [...prev, {
        id: `aa-${Date.now()}-device-result`, role: 'ant',
        text: `Device action complete — ${req.verb} on "${req.target}" (${req.sourceTool}, ${req.accessLevel}). ${result}`,
        timestamp: tnow(), confidence: 0.95, confidenceLevel: 'verified', riskLevel: req.risk === 'high' ? 'Sensitive' : 'Safe', domain: 'general',
        actionType: 'FILE_OPS',
      }]);
      setActivitySummaries((prev) => [...prev, `Device action completed: ${req.verb} on ${req.target}.`]);
      window.setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    }, (DEVICE_RUN_STEPS.length + 1) * 900));
  }, [clearDeviceTimers]);

  const [bridgeModalReq, setBridgeModalReq] = React.useState<BridgeRequest | null>(null);

  const startDeviceAction = React.useCallback((task: string) => {
    clearDeviceTimers();
    const now = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const req = analyzeDeviceAction(task);
    
    // Wire up to actual Bridge API
    createBridgeRequest({
      service: task.toLowerCase().includes('drive') ? 'drive' : 'gmail',
      action: 'list_recent',
      params: { n: 5 },
      risk: req.risk,
      reason: req.affectedData
    }).then(apiReq => {
      req.id = apiReq.id; // Map internal ID to Bridge API ID
      if (deviceProjectApproved && req.risk !== 'high') {
        const approved = { ...req, status: 'running' as const, approvedForProject: true };
        setDeviceReq(approved);
        setMessages((prev) => [...prev, {
          id: `aa-${Date.now()}-device`, role: 'ant',
          text: `This project already approved device access. Running the ${req.verb} action on "${req.target}" (${req.sourceTool}).`,
          timestamp: now, confidence: 0.95, confidenceLevel: 'verified', riskLevel: 'Safe', domain: 'general', actionType: 'FILE_OPS',
        }]);
        runDeviceProgress(approved);
        return;
      }
      setDeviceReq(req);
      setMessages((prev) => [...prev, {
        id: `aa-${Date.now()}-device`, role: 'ant',
        text: 'I can use your files, apps, browser, or connected sources for this — but I need permission first. Review the device action request below before I access anything.',
        timestamp: now, confidence: 0.94, confidenceLevel: 'verified',
        riskLevel: req.risk === 'high' ? 'Sensitive' : req.risk === 'medium' ? 'Moderate' : 'Safe',
        domain: req.risk === 'high' ? 'external-export' : 'general', actionType: 'FILE_OPS',
      }]);
      setActivitySummaries((prev) => [...prev, `Device mode: permission requested for ${req.verb} on ${req.target}.`]);
    });
  }, [clearDeviceTimers, deviceProjectApproved, runDeviceProgress]);

  const approveDeviceAction = React.useCallback((forProject: boolean) => {
    setDeviceReq((p) => {
      if (!p) return p;
      // Open the PermissionModal with a mock BridgeRequest mapped from DeviceAction
      setBridgeModalReq({
        id: p.id,
        user_id: 'anonymous',
        service: p.sourceTool.toLowerCase().includes('drive') ? 'drive' : 'gmail',
        action: p.verb,
        params: {},
        risk: p.risk,
        reason: p.affectedData,
        requesting_agent_id: null,
        status: 'pending',
        created_at: new Date().toISOString(),
        decided_at: null,
        executed_at: null,
        result: null,
        error: null,
        source: 'live'
      });
      return p;
    });
  }, []);

  const rejectDeviceAction = React.useCallback(() => {
    clearDeviceTimers();
    const now = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    setDeviceReq((p) => p ? { ...p, status: 'rejected' } : p);
    setMessages((prev) => [...prev, {
      id: `aa-${Date.now()}-device-reject`, role: 'ant',
      text: 'Device action was rejected. I won’t access the source.',
      timestamp: now, confidence: 0.96, confidenceLevel: 'verified', riskLevel: 'Safe', domain: 'general',
    }]);
    setActivitySummaries((prev) => [...prev, 'Device action rejected. AI Ant will not access that source.']);
  }, [clearDeviceTimers]);

  const saveDeviceScope = React.useCallback((accessLevel: DeviceAccessLevel, target: string) => {
    setDeviceReq((p) => p ? { ...p, accessLevel, target, status: 'permission_required', progressStep: 0 } : p);
    setActivitySummaries((prev) => [...prev, `Device scope updated: ${accessLevel} on ${target}.`]);
  }, []);

  const stopDeviceAction = React.useCallback(() => {
    clearDeviceTimers();
    const now = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    setDeviceReq((p) => p ? { ...p, status: 'failed' } : p);
    setMessages((prev) => [...prev, {
      id: `aa-${Date.now()}-device-stop`, role: 'ant',
      text: 'Device action was stopped before completion. Nothing was finalized.',
      timestamp: now, confidence: 0.93, confidenceLevel: 'verified', riskLevel: 'Safe', domain: 'general',
    }]);
  }, [clearDeviceTimers]);

  const retryDeviceAction = React.useCallback(() => {
    clearDeviceTimers();
    setDeviceReq((p) => p ? { ...p, status: 'permission_required', progressStep: 0, result: undefined } : p);
  }, [clearDeviceTimers]);

  const createDeviceDeliverable = React.useCallback(() => {
    setDeviceReq((p) => {
      if (p) setColonyDeliverables((prev) => [createDemoDeliverable({
        id: `dec-${Date.now()}`, mode: 'device_action', confidence: 0.95, reason: p.task,
        suggestedNextStep: 'Review device result', approvalLevel: 'medium',
        expectedDeliverables: [`${p.verb} result — ${p.target}`], suggestedAgents: [], sourcePrompt: p.task,
      }), ...prev].slice(0, 6));
      return p;
    });
  }, []);

  const launchEnterpriseSetup = React.useCallback((goal: string, sourceAgents?: EnterpriseAgent[], options?: { createWorkItem?: boolean; sourceConversationId?: string; replaceChatId?: string }) => {
    clearEnterpriseTimers();
    const setup = buildEnterpriseSetup(goal, sourceAgents);
    if (options?.createWorkItem !== false) enterpriseRestoredRef.current = true;
    setEnterpriseSetup(setup);
    if (options?.createWorkItem !== false) {
      enterpriseWorkItemIdRef.current = onCreateFeatureWorkItem({
        type: 'enterprise',
        title: titleFromGoal(goal),
        status: 'setup',
        sourceConversationId: options?.sourceConversationId,
        replaceChatId: options?.replaceChatId,
        sessionId: setup.projectId,
      });
    }
    const total = ENTERPRISE_SETUP_BLUEPRINT.length; // 6
    // Step i completes after ~(i+1)*900ms; an agent is revealed alongside steps 0..5.
    for (let i = 0; i < total; i++) {
      enterpriseTimersRef.current.push(window.setTimeout(() => {
        const last = i === total - 1;
        setEnterpriseSetup((p) => p ? {
          ...p,
          status: last ? 'ready' : 'building',
          overallProgress: Math.round(((i + 1) / total) * 100),
          revealCount: Math.min(p.agents.length, i + 1),
          completedAt: last ? new Date().toISOString() : p.completedAt,
          agents: p.agents.map((agent, idx) => {
            if (idx > i) return agent;
            const targetProgress = last ? [100, 92, 86, 72, 64, 58, 44, 38][idx] ?? 38 : Math.min(88, 18 + (i + 1) * 12 - idx * 5);
            const status: EnterpriseAgentStatus = last && idx < 2 ? 'done' : idx === i ? 'thinking' : idx < i ? 'working' : 'idle';
            return { ...agent, status, progress: Math.max(agent.progress, targetProgress) };
          }),
          steps: p.steps.map((s, idx) => ({
            ...s,
            status: idx < i + 1 ? (last && idx === total - 1 ? 'done' : idx <= i ? 'done' : s.status)
              : idx === i + 1 ? 'active' : 'pending',
          })),
        } : p);
      }, (i + 1) * 900));
    }
  }, [clearEnterpriseTimers, onCreateFeatureWorkItem]);

  React.useEffect(() => {
    if (enterpriseRestoredRef.current || !enterpriseSetup || enterpriseSetup.status === 'ready') return;
    enterpriseRestoredRef.current = true;
    launchEnterpriseSetup(enterpriseSetup.goal, enterpriseSetup.agents, { createWorkItem: false });
  }, [enterpriseSetup, launchEnterpriseSetup]);

  const openEnterpriseWorkspace = React.useCallback(() => {
    clearEnterpriseTimers();
    setEnterpriseSetup((p) => {
      if (p) {
        const project = { ...buildEnterpriseWorkspaceProject(p.goal, p.agents), id: p.projectId, name: p.projectTitle };
        setActiveEnterpriseProject(project);
        setOrchMode('agent-running');
        setShowAgentPanel(false);
        setMatchedAgents([]);
        setOrchAgents([]);
        setView('project');
        if (enterpriseWorkItemIdRef.current) {
          onUpdateWorkItem(enterpriseWorkItemIdRef.current, {
            title: project.name,
            workStatus: 'running',
            sessionId: project.id,
            enterpriseWorkspace: project,
          });
        }
        setMessages((prev) => [...prev, {
          id: `aa-${Date.now()}-enterprise-ready`, role: 'ant',
          text: `Your AI enterprise "${project.name}" is set up with ${project.agents.length} agents, reporting lines, tasks, and approval checkpoints. Workspace is open.`,
          timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          confidence: 0.96, confidenceLevel: 'verified', riskLevel: 'Safe', domain: 'general', actionType: 'ORGANIZATION',
        }]);
      }
      return null;
    });
  }, [clearEnterpriseTimers, onUpdateWorkItem]);

  const startAutoMatch = React.useCallback((task: string) => {
    const ts = () => new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const { agents: matched, reason } = analyzeAndMatchAgents(task);
    setActiveCrewRun(buildDefaultCrewRun(task));
    onCreateFeatureWorkItem({
      type: 'crew',
      title: generateChatTitle(task),
      status: 'assembling',
      sourceConversationId: sourceConversationForFeature(activeChat),
      replaceChatId: isEmptyDraftStandaloneChat(activeChat) ? activeChat!.id : undefined,
      sessionId: `crew-${Date.now()}`,
    });
    const states: SwarmState[] = ['analyzing_goal', 'matching_agents', 'creating_agents', 'assigning_tasks', 'agents_working', 'reviewing_outputs', 'deliverable_ready'];
    setSwarmState('analyzing_goal');
    setActivitySummaries((prev) => [...prev, 'AI Ant is assembling your Colony Crew and matching specialist agents.']);
    setMatchedAgents(matched);
    setMatchReason(reason);
    setShowAgentPanel(true);
    setOrchTask(task);
    setOrchMode('agent-running');
    setOrchView('chat');
    setWorkspaceDrawerTab('members');
    setOrchMessages([{ id: 'om-0', from: 'user', content: task, timestamp: ts(), type: 'user' }]);

    const graphAgents: OrchAgent[] = matched.map((a, i) => ({
      id: a.id, name: a.name, role: a.role, avatar: a.avatarInitial,
      color: ['#4ecca0', '#f0c060', '#7eb5ff', '#c4b5fd'][i % 4],
      status: 'queued' as const, position: { x: 24 + i * 160, y: 60 },
    }));
    setOrchAgents(graphAgents);

    // Activate first immediately
    setMatchedAgents(prev => prev.map((a, idx) =>
      idx === 0 ? { ...a, status: 'running', currentTask: `Processing "${task.slice(0, 38)}…"` } : a
    ));

    states.slice(1).forEach((state, index) => {
      window.setTimeout(() => {
        setSwarmState(state);
        const statusMap: Partial<Record<SwarmState, CrewStatus>> = {
          matching_agents: 'matching',
          creating_agents: 'creating_agents',
          assigning_tasks: 'running',
          agents_working: 'running',
          reviewing_outputs: 'reviewing',
          deliverable_ready: 'completed',
        };
        if (statusMap[state]) setActiveCrewRun((prev) => prev ? { ...prev, status: statusMap[state]! } : prev);
      }, (index + 1) * 900);
    });

    matched.forEach((agent, i) => {
      window.setTimeout(() => {
        setOrchMessages(prev => [...prev, {
          id: `om-${Date.now()}-${i}`, from: agent.name,
          to: i < matched.length - 1 ? matched[i + 1].name : 'user',
          content: `Working on: "${task.slice(0, 60)}${task.length > 60 ? '…' : ''}"`,
          timestamp: ts(), type: 'task',
        }]);
        setActivitySummaries((prev) => [...prev, `${agent.name} started: ${agent.role}.`]);
      }, (i + 1) * 1200);

      window.setTimeout(() => {
        setMatchedAgents(prev => prev.map((a, idx) => {
          if (idx === i) return { ...a, status: 'done', currentTask: undefined };
          if (idx === i + 1) return { ...a, status: 'running', currentTask: `Processing ${agent.name} output…` };
          return a;
        }));
        setOrchAgents(prev => prev.map(a =>
          a.id === agent.id ? { ...a, status: i === matched.length - 1 ? 'done' : 'waiting', currentTask: undefined } : a
        ));
        const isLast = i === matched.length - 1;
        setOrchMessages(prev => [...prev, {
          id: `om-done-${Date.now()}-${i}`, from: agent.name,
          to: isLast ? 'user' : matched[i + 1].name,
          content: isLast ? `All done. Task completed by team.` : `Completed. Passing to ${matched[i + 1].name}.`,
          timestamp: ts(), type: isLast ? 'result' : 'handoff',
        }]);
        setActivitySummaries((prev) => [...prev, isLast ? 'AI Ant combined agent outputs into a deliverable preview.' : `${agent.name} completed its assignment and handed off the summary.`]);
      }, (i + 1) * 1200 + 2400);
    });
  }, [activeChat, onCreateFeatureWorkItem]);

  const startGeneratedProject = React.useCallback((proposal: AntTeamProposal) => {
    const project: AntGeneratedProject = {
      id: `project-${Date.now()}`,
      proposal: {
        ...proposal,
        agents: proposal.agents.map((agent, index) => ({ ...agent, status: index === 0 ? 'working' : 'queued' })),
        deliverables: proposal.deliverables.map((item, index) => ({ ...item, status: index === 0 ? 'In progress' : 'Planned' })),
      },
      progress: 18,
      status: 'Working',
      activeAgent: 'Project Manager Agent',
      currentTask: 'Creating the work plan and assigning specialist agents',
      nextStep: proposal.plan[1] ?? 'Collect project context',
      latestUpdate: 'AI Ant created the project workspace, team hierarchy, task plan, deliverables, and approval checkpoints.',
    };
    setActiveGeneratedProject(project);
    onCreateFeatureWorkItem({
      type: 'crew',
      title: proposal.projectName || generateChatTitle(proposal.goal),
      status: 'running',
      sourceConversationId: sourceConversationForFeature(activeChat),
      replaceChatId: isEmptyDraftStandaloneChat(activeChat) ? activeChat!.id : undefined,
      sessionId: project.id,
    });
    setTeamProposal(null);
    setView('project');
    setMessages((prev) => [...prev, {
      id: `aa-${Date.now()}`, role: 'ant',
      text: `Project workspace created for "${proposal.projectName}". AI Ant is managing the team and will summarize progress instead of showing raw agent chat by default.`,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      confidence: 0.96, confidenceLevel: 'verified', riskLevel: 'Safe', domain: 'general',
    }]);
  }, [activeChat, onCreateFeatureWorkItem]);

  const openWorkflowBuilder = React.useCallback((proposal: WorkflowProposal) => {
    const workflow = workflowFromProposal(proposal);
    clearWorkflowRunTimers();
    setActiveWorkflow(workflow);
    onCreateFeatureWorkItem({
      type: 'automation',
      title: workflow.name || generateChatTitle(proposal.goal),
      status: 'draft',
      sourceConversationId: sourceConversationForFeature(activeChat),
      replaceChatId: isEmptyDraftStandaloneChat(activeChat) ? activeChat!.id : undefined,
      sessionId: workflow.id,
    });
    setSelectedWorkflowNodeId(workflow.nodes[0]?.id ?? null);
    setSelectedWorkflowEdgeId(null);
    setWorkflowRunLogs(['Workflow draft created from proposal.']);
    setView('workflow-builder');
  }, [activeChat, clearWorkflowRunTimers, onCreateFeatureWorkItem]);

  const updateWorkflowNode = React.useCallback((nodeId: string, patch: Partial<WorkflowNode>) => {
    setActiveWorkflow((prev) => prev ? {
      ...prev,
      nodes: prev.nodes.map((node) => {
        if (node.id !== nodeId) return node;
        const next = { ...node, ...patch, config: patch.config ? { ...node.config, ...patch.config } : node.config };
        return applyWorkflowNodeValidation(next);
      }),
      updatedAt: new Date().toISOString(),
    } : prev);
  }, []);

  const deleteWorkflowNode = React.useCallback((nodeId: string) => {
    setActiveWorkflow((prev) => {
      if (!prev || prev.nodes.length <= 1) return prev;
      const nextNodes = prev.nodes.filter((node) => node.id !== nodeId);
      const nextEdges = prev.edges.filter((edge) => edge.from !== nodeId && edge.to !== nodeId);
      setSelectedWorkflowNodeId(nextNodes[0]?.id ?? null);
      setSelectedWorkflowEdgeId(null);
      return { ...prev, nodes: nextNodes, edges: nextEdges, updatedAt: new Date().toISOString() };
    });
  }, []);

  const deleteWorkflowEdge = React.useCallback((edgeId: string) => {
    setActiveWorkflow((prev) => prev ? { ...prev, edges: prev.edges.filter((edge) => edge.id !== edgeId), updatedAt: new Date().toISOString() } : prev);
    setSelectedWorkflowEdgeId(null);
    setWorkflowRunLogs((prev) => [...prev, `warning: Connection deleted.`]);
  }, []);

  const addWorkflowStep = React.useCallback((type: WorkflowNodeType = 'ai_step', fromNodeId?: string) => {
    setActiveWorkflow((prev) => {
      if (!prev) return prev;
      const source = prev.nodes.find((node) => node.id === fromNodeId) ?? prev.nodes[prev.nodes.length - 1];
      const preferred = source
        ? { x: source.position.x + WORKFLOW_NODE_SIZE.width + 110, y: source.position.y + (type === 'approval' ? WORKFLOW_NODE_SIZE.height + 58 : 0) }
        : { x: 140, y: 120 };
      const node = makeWorkflowNode(type, findOpenWorkflowPosition(prev.nodes, preferred), type === 'ai_step' ? 'New AI step' : undefined);
      const edge = source && source.type !== 'output' && node.type !== 'trigger' ? { id: `wfe-${source.id}-${node.id}`, from: source.id, to: node.id, status: node.type === 'approval' ? 'approval' as const : 'idle' as const, animated: false } : null;
      setSelectedWorkflowNodeId(node.id);
      setSelectedWorkflowEdgeId(null);
      return { ...prev, nodes: [...prev.nodes, node], edges: edge ? [...prev.edges, edge] : prev.edges, updatedAt: new Date().toISOString() };
    });
  }, []);

  const duplicateWorkflowNode = React.useCallback((nodeId: string) => {
    setActiveWorkflow((prev) => {
      const node = prev?.nodes.find((item) => item.id === nodeId);
      if (!prev || !node) return prev;
      const copy: WorkflowNode = { ...node, id: `wfn-copy-${Date.now()}`, title: `${node.title} copy`, position: findOpenWorkflowPosition(prev.nodes, { x: node.position.x + WORKFLOW_NODE_SIZE.width + 70, y: node.position.y + 40 }), status: 'idle', config: { ...node.config } };
      setSelectedWorkflowNodeId(copy.id);
      return { ...prev, nodes: [...prev.nodes, copy], updatedAt: new Date().toISOString() };
    });
  }, []);

  const connectWorkflowNodes = React.useCallback((from: string, to: string) => {
    setActiveWorkflow((prev) => {
      if (!prev) return prev;
      const fromNode = prev.nodes.find((node) => node.id === from);
      const toNode = prev.nodes.find((node) => node.id === to);
      const fail = (message: string) => {
        setWorkflowRunLogs((logs) => [...logs, `warning: ${message}`]);
        return prev;
      };
      if (!fromNode || !toNode) return prev;
      if (from === to) return fail('A node cannot connect to itself.');
      if (fromNode.type === 'output') return fail('Output nodes cannot start a new connection.');
      if (toNode.type === 'trigger') return fail('Trigger nodes cannot receive an input.');
      if (prev.edges.some((edge) => edge.from === from && edge.to === to)) return fail('That connection already exists.');
      const wouldReach = (start: string, target: string): boolean => start === target || prev.edges.filter((edge) => edge.from === start).some((edge) => wouldReach(edge.to, target));
      if (wouldReach(to, from)) return fail('Circular loops are not supported for this MVP.');
      const edge: WorkflowEdge = { id: `wfe-${from}-${to}-${Date.now()}`, from, to, status: toNode.type === 'approval' ? 'approval' : 'idle', animated: false };
      setSelectedWorkflowEdgeId(edge.id);
      return { ...prev, edges: [...prev.edges, edge], updatedAt: new Date().toISOString() };
    });
  }, []);

  const runWorkflowNode = React.useCallback((nodeId: string) => {
    setSelectedWorkflowNodeId(nodeId);
    setActiveWorkflow((prev) => prev ? { ...prev, nodes: prev.nodes.map((node) => node.id === nodeId ? { ...node, status: 'success' } : node), updatedAt: new Date().toISOString() } : prev);
    const nodeTitle = activeWorkflow?.nodes.find((node) => node.id === nodeId)?.title ?? 'Step';
    setWorkflowRunLogs((prev) => [...prev, `info: ${nodeTitle}: test step completed.`]);
  }, [activeWorkflow?.nodes]);

  const connectWorkflowConnector = React.useCallback((provider: string) => {
    setActiveWorkflow((prev) => prev ? { ...prev, connectors: (prev.connectors ?? []).map((connector) => connector.provider === provider ? { ...connector, status: 'permission_required' } : connector), nodes: prev.nodes.map((node) => {
      const needsProvider = workflowDestinationConnectionKey(node.config.destination) === provider || workflowSourceConnectionKey(node.config.sourceType) === provider;
      return needsProvider ? applyWorkflowNodeValidation({ ...node, config: { ...node.config, connectionStatus: 'permission_required' } }) : node;
    }), updatedAt: new Date().toISOString() } : prev);
    setWorkflowRunLogs((prev) => [...prev, `warning: ${provider} connector permission requested.`]);
  }, []);

  const approveWorkflowConnector = React.useCallback((provider: string) => {
    setActiveWorkflow((prev) => prev ? { ...prev, connectors: (prev.connectors ?? []).map((connector) => connector.provider === provider ? { ...connector, status: 'connected' } : connector), nodes: prev.nodes.map((node) => {
      const needsProvider = workflowDestinationConnectionKey(node.config.destination) === provider || workflowSourceConnectionKey(node.config.sourceType) === provider;
      return needsProvider ? applyWorkflowNodeValidation({ ...node, config: { ...node.config, connectionStatus: 'connected' } }) : node;
    }), updatedAt: new Date().toISOString() } : prev);
    setWorkflowRunLogs((prev) => [...prev, `info: ${provider} approved for this workflow. Real backend connector execution remains TODO.`]);
  }, []);

  const applyWorkflowTemplate = React.useCallback((templateId: string) => {
    const template = WORKFLOW_TEMPLATES.find((item) => item.id === templateId);
    if (!template) return;
    const proposal = createWorkflowProposalFromPrompt(`${template.label} using ${template.source}`);
    const next = workflowFromProposal({ ...proposal, destination: template.destination, destinationLabel: WORKFLOW_DESTINATION_OPTIONS.find((item) => item.value === template.destination)?.label ?? proposal.destinationLabel, steps: ['Read source', ...template.steps, 'Ask for approval', 'Route output'], sources: [template.source] });
    setActiveWorkflow(next);
    setSelectedWorkflowNodeId(next.nodes[0]?.id ?? null);
    setSelectedWorkflowEdgeId(null);
    setWorkflowRunLogs([`info: Template applied: ${template.label}.`]);
  }, []);

  const runWorkflowTest = React.useCallback((proposal?: WorkflowProposal) => {
    const ensureWorkflow = activeWorkflow ?? (proposal ? workflowFromProposal(proposal) : null);
    if (!ensureWorkflow) return;
    clearWorkflowRunTimers();
    const validation = validateWorkflow(ensureWorkflow);
    if (!validation.ready) {
      setActiveWorkflow({ ...ensureWorkflow, nodes: ensureWorkflow.nodes.map(applyWorkflowNodeValidation), status: 'draft' });
      setWorkflowRunLogs([`error: Test blocked. ${validation.headline}`, ...validation.issues.slice(0, 5).map((issue) => `${issue.severity}: ${issue.message}`)]);
      if (proposal) setView('workflow-builder');
      return;
    }
    const orderedNodes = [...ensureWorkflow.nodes].sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y);
    setActiveWorkflow({ ...ensureWorkflow, status: 'testing', nodes: ensureWorkflow.nodes.map((node) => ({ ...applyWorkflowNodeValidation(node), status: 'waiting' })), edges: ensureWorkflow.edges.map((edge) => ({ ...edge, status: edge.status === 'approval' ? 'approval' : 'idle', animated: false })) });
    setSelectedWorkflowNodeId(ensureWorkflow.nodes[0]?.id ?? null);
    setSelectedWorkflowEdgeId(null);
    const startedAt = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    setWorkflowRunLogs([`info: ${startedAt} Test run started.`]);
    if (proposal) setView('workflow-builder');
    orderedNodes.forEach((node, index) => {
      const timer = window.setTimeout(() => {
        const provider = workflowDestinationConnectionKey(node.config.destination) ?? workflowSourceConnectionKey(node.config.sourceType);
        const externalBlocked = Boolean(provider && node.config.connectionStatus !== 'connected');
        const needsApproval = node.type === 'approval' || (node.type === 'output' && isExternalWorkflowDestination(node.config.destination) && node.config.approvalRequired);
        const shouldPause = externalBlocked || needsApproval;
        const now = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        setSelectedWorkflowNodeId(node.id);
        setActiveWorkflow((prev) => prev ? {
          ...prev,
          nodes: prev.nodes.map((item) => item.id === node.id ? { ...item, status: 'running' } : item),
          edges: prev.edges.map((edge) => edge.from === node.id || edge.to === node.id ? { ...edge, status: 'active', animated: true } : edge),
          updatedAt: new Date().toISOString(),
        } : prev);
        setWorkflowRunLogs((prev) => [...prev, `info: ${now} ${node.title} started.`]);
      }, 400 + index * 950);
      workflowRunTimersRef.current.push(timer);
      const completeTimer = window.setTimeout(() => {
        const provider = workflowDestinationConnectionKey(node.config.destination) ?? workflowSourceConnectionKey(node.config.sourceType);
        const externalBlocked = Boolean(provider && node.config.connectionStatus !== 'connected');
        const needsApproval = node.type === 'approval' || (node.type === 'output' && isExternalWorkflowDestination(node.config.destination) && node.config.approvalRequired);
        const shouldPause = externalBlocked || needsApproval;
        const now = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        setActiveWorkflow((prev) => prev ? {
          ...prev,
          status: shouldPause ? 'testing' : prev.status,
          nodes: prev.nodes.map((item) => item.id === node.id ? { ...item, status: shouldPause ? 'needs_approval' : 'success' } : item),
          edges: prev.edges.map((edge) => edge.from === node.id ? { ...edge, status: shouldPause ? 'approval' : 'success', animated: false } : edge.to === node.id ? { ...edge, status: shouldPause ? 'approval' : 'success', animated: false } : edge),
          updatedAt: new Date().toISOString(),
        } : prev);
        setWorkflowRunLogs((prev) => [...prev, shouldPause ? `warning: ${now} ${node.title}: ${externalBlocked ? `${provider} permission required.` : 'approval required before external action.'}` : `info: ${now} ${node.title}: completed.`]);
        if (shouldPause) {
          clearWorkflowRunTimers();
          setMessages((prev) => [...prev, {
            id: `aa-${Date.now()}-workflow-approval`, role: 'ant',
            text: externalBlocked ? `Test run paused. ${provider} is not connected, so Colony will not pretend the external action succeeded.` : 'Test run paused at an approval point. External save or send actions will not run until you approve the output.',
            timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
            confidence: 0.96, confidenceLevel: 'verified', riskLevel: 'Sensitive', domain: 'external-export',
          }]);
          return;
        }
        if (index === orderedNodes.length - 1) {
          setActiveWorkflow((prev) => prev ? { ...prev, status: 'ready_to_activate', edges: prev.edges.map((edge) => ({ ...edge, status: edge.status === 'failed' ? 'failed' : 'success', animated: false })), runHistory: [...(prev.runHistory ?? []), { id: `wfr-${Date.now()}`, status: 'success', startedAt: new Date().toISOString(), endedAt: new Date().toISOString(), logs: [] }] } : prev);
          setWorkflowRunLogs((prev) => [...prev, `info: ${now} Test run completed.`, 'info: Output preview ready: structured result, generated file placeholder, destination preview.']);
        }
      }, 900 + index * 950);
      workflowRunTimersRef.current.push(completeTimer);
    });
  }, [activeWorkflow, clearWorkflowRunTimers]);

  const saveWorkflowDraft = React.useCallback(() => {
    if (!activeWorkflow) return;
    const validation = validateWorkflow(activeWorkflow);
    const nextWorkflow: WorkflowDef = { ...activeWorkflow, status: validation.ready ? 'ready_to_test' : 'draft', nodes: activeWorkflow.nodes.map(applyWorkflowNodeValidation), updatedAt: new Date().toISOString() };
    try {
      localStorage.setItem(`colony-workflow-${activeWorkflow.id}`, JSON.stringify(nextWorkflow));
    } catch { /* TODO(backend): persist workflows to the real backend store. */ }
    setActiveWorkflow(nextWorkflow);
    setWorkflowRunLogs((prev) => [...prev, validation.ready ? 'info: Workflow saved. Ready to test.' : `warning: Workflow saved as draft. ${validation.headline}`]);
  }, [activeWorkflow]);

  const toggleWorkflowActive = React.useCallback(() => {
    const validation = activeWorkflow ? validateWorkflow(activeWorkflow) : null;
    if (activeWorkflow?.status !== 'active' && validation && !validation.ready) {
      setWorkflowRunLogs((prev) => [...prev, `error: ${validation.headline}`]);
      return;
    }
    const missingConnector = activeWorkflow?.nodes.find((node) => {
      const provider = workflowDestinationConnectionKey(node.config.destination) ?? workflowSourceConnectionKey(node.config.sourceType);
      return provider && node.config.connectionStatus !== 'connected';
    });
    if (activeWorkflow?.status !== 'active' && missingConnector) {
      setWorkflowRunLogs((prev) => [...prev, `error: Activation blocked. ${missingConnector.title} still needs connector approval.`]);
      return;
    }
    setActiveWorkflow((prev) => prev ? { ...prev, status: prev.status === 'active' ? 'paused' : 'active', updatedAt: new Date().toISOString() } : prev);
    setWorkflowRunLogs((prev) => [...prev, activeWorkflow?.status === 'active' ? 'info: Workflow paused.' : 'warning: Workflow marked active in UI. Activation requires backend scheduler before real scheduled execution.']);
  }, [activeWorkflow]);

  React.useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, thinking]);

  const recordMockAIRequest = React.useCallback(async (feature: UsageFeature, text: string) => {
    const inputTokens = Math.max(280, Math.round(text.length * 2.4));
    const outputTokens = 700 + Math.round(text.length * 1.7);
    await guardAIRequest({
      userId: currentUserId,
      feature,
      estimatedTokens: inputTokens + outputTokens,
      estimatedCostUsd: 0.01,
    });
    trackAIRequest({
      userId: currentUserId,
      feature: usageFeatureToAdminFeature(feature),
      model: 'mock-model',
      promptTokens: inputTokens,
      completionTokens: outputTokens,
      status: 'success',
      latencyMs: 800 + Math.round(text.length * 3),
    });
  }, [currentUserId]);

  const requestBackendAIAntResponse = React.useCallback(async (conversationId: string, text: string): Promise<AiAntBackendResponse | null> => {
    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) return null;
    try {
      const response = await fetch(`${apiBaseUrl}/ai-ant/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          user_id: currentUserId,
          message: text,
          mode: modelRoutingPreference,
          context: {
            surface: 'ai_ant',
            safety_mode: safetyMode,
            local_messages_count: messages.length,
          },
        }),
      });
      if (!response.ok) return null;
      return await response.json() as AiAntBackendResponse;
    } catch {
      return null;
    }
  }, [currentUserId, messages.length, modelRoutingPreference, safetyMode]);

  const usageFeatureForDecision = React.useCallback((inputMode: AgentInputMode, decision: ExecutionDecision): UsageFeature => {
    if (inputMode === 'Colony Crew' || decision.mode === 'agent_swarm') return 'colony_crew';
    if (inputMode === 'One-man Enterprise' || decision.mode === 'one_man_enterprise') return 'one_man_enterprise';
    if (inputMode === 'Workflow' || decision.mode === 'workflow') return 'workflow';
    if (inputMode === 'Device' || decision.mode === 'device_action' || decision.mode === 'approval_sensitive') return 'connector';
    return 'ai_ant';
  }, []);

  const submitPrompt = React.useCallback(async (text: string) => {
    if (!text.trim()) return;
    const now = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const trimmed = text.trim();
    const inputMode = normalizeAgentInputMode(agentInputMode);
    const decision = classifyExecutionIntent(trimmed, inputMode);
    const selectedFeatureMode = inputMode === 'One-man Enterprise' || inputMode === 'Colony Crew' || inputMode === 'Workflow' || inputMode === 'Device';
    const replaceDraftChatId = selectedFeatureMode && isEmptyDraftStandaloneChat(activeChat) ? activeChat!.id : undefined;
    const featureSourceConversationId = sourceConversationForFeature(activeChat);
    const currentChatId = selectedFeatureMode
      ? (featureSourceConversationId ?? activeChatId ?? null)
      : (activeChatId ?? onEnsureChat());
    if (!selectedFeatureMode && currentChatId && !activeChatId) skipHydrateChatIdRef.current = currentChatId;
    if (!selectedFeatureMode && currentChatId) {
      onAutoTitleChat(currentChatId, trimmed);
      onMarkChatWork(currentChatId, 'chat', 'active');
    }
    const executionMode = classifyAntExecutionMode(trimmed);
    const projectLike = decision.mode !== 'simple_chat' && decision.mode !== 'operator_task';
    try {
      await recordMockAIRequest(usageFeatureForDecision(inputMode, decision), trimmed);
    } catch (error) {
      const message = error instanceof AIRequestGuardError
        ? error.message
        : 'AI request could not start. Please try again.';
      setMessages((prev) => [...prev, { id: `au-${Date.now()}`, role: 'user', text: trimmed, timestamp: now }, {
        id: `aa-${Date.now()}-guard`, role: 'ant',
        text: message,
        timestamp: now,
        confidence: 0.98,
        confidenceLevel: 'verified',
        riskLevel: 'Safe',
        domain: 'general',
      }]);
      setAntPrompt('');
      setView('chat');
      return;
    }
    setMessages((prev) => [...prev, { id: `au-${Date.now()}`, role: 'user', text: trimmed, timestamp: now }]);
    setAntPrompt('');
    setView('chat');
    setTeamProposal(null);
    setExecutionDecision(decision);
    setRoutingDecision(buildRoutingDecisionWithPreference(trimmed, inputMode, decision, null, modelRoutingPreference, manualModelSelection));
    setDeviceAction(null);
    clearDeviceTimers();
    setDeviceReq(null);
    setActivitySummaries((prev) => [...prev, `AI Ant chose ${decision.mode.replace(/_/g, ' ')}: ${decision.reason}`]);

    // Dedicated modes (Crew, Enterprise, Workflow, Device) have their own flows below.
    // Only Chat / Auto-routed simple chat / operator tasks should hit the backend chat endpoint.
    const isDedicatedMode = inputMode === 'One-man Enterprise' || inputMode === 'Colony Crew' || inputMode === 'Workflow' || inputMode === 'Device';
    const shouldUseBackendChat = !isDedicatedMode && (inputMode === 'Chat' || decision.mode === 'simple_chat' || decision.mode === 'operator_task');
    if (shouldUseBackendChat) {
      setThinking(true);
      const backendResponse = await requestBackendAIAntResponse(currentChatId ?? onEnsureChat(), trimmed);
      setThinking(false);
      if (backendResponse) {
        setRoutingDecision(buildBackendRoutingDecision(trimmed, backendResponse, modelRoutingPreference));
        setMessages((prev) => [...prev, {
          id: backendResponse.message_id,
          role: 'ant',
          text: backendResponse.reply,
          timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          confidence: backendResponse.confidence,
          confidenceLevel: getConfidenceLevel(backendResponse.confidence),
          riskLevel: backendResponse.approval_required ? 'Sensitive' : 'Safe',
          domain: backendResponse.intent === 'external_action' ? 'external-export' : 'general',
          systemNote: `Backend AI Ant · ${backendResponse.intent} · ${backendResponse.model}`,
        }]);
        setActivitySummaries((prev) => [...prev, `Backend AI Ant responded with intent: ${backendResponse.intent}`]);
        return;
      }
    }

    // Device mode now opens the Colony Bridge Operator flow via a setup card.
    // User reviews capabilities + risk, then approves before any Bridge work begins.
    if (inputMode === 'Device' || decision.mode === 'device_action' || decision.mode === 'approval_sensitive') {
      setProjectIntent(null);
      setTeamProposal(null);
      setProposalAdvancedOpen(false);
      setExecutionDecision(null);
      setColonyDeliverables([]);
      setApproval(null);
      setDeviceReq(null);
      setBridgeSetupCard({
        id: `bridge-setup-${Date.now()}`,
        taskText: trimmed,
        status: 'pending',
        sourceConversationId: featureSourceConversationId,
      });
      if (replaceDraftChatId) onDiscardDraftChat(replaceDraftChatId);
      return;
    }

    if (inputMode === 'Workflow' || decision.mode === 'workflow') {
      const workflowProposal = createWorkflowProposalFromPrompt(trimmed);
      setProjectIntent(null);
      setTeamProposal(null);
      setProposalAdvancedOpen(false);
      setExecutionDecision(null);
      setRoutingDecision(null);
      setColonyDeliverables([]);
      setApproval(null);
      setMessages((prev) => [...prev, {
        id: `aa-${Date.now()}-workflow-proposal`,
        role: 'ant',
        text: 'This looks repeatable. I can turn it into a workflow with trigger, steps, approval rules, and output destination.',
        timestamp: now,
        confidence: 0.96,
        confidenceLevel: 'verified',
        riskLevel: 'Safe',
        domain: 'general',
        actionType: 'AUTOMATION',
        workflowProposal,
      }]);
      setActivitySummaries((prev) => [...prev, `Workflow proposal created: ${workflowProposal.goal}`]);
      return;
    }

    // Colony Crew runs ONLY when the user explicitly selected Colony Crew mode.
    // The right-side panel opens automatically; chat stays clean. Auto/Chat
    // never auto-trigger the crew.
    if (inputMode === 'Colony Crew') {
      const proposal = buildAntTeamProposal(trimmed, 'ai-team');
      setRoutingDecision(buildRoutingDecisionWithPreference(trimmed, inputMode, decision, proposal, modelRoutingPreference, manualModelSelection));
      setProjectIntent(null);
      setTeamProposal(null);
      setProposalAdvancedOpen(false);
      setExecutionDecision(null);
      setColonyDeliverables([]);
      setMessages((prev) => [...prev, {
        id: `aa-${Date.now()}-crew`, role: 'ant',
        text: 'This looks like a task for a specialist crew. I’m assembling a Colony Crew — matching agents, assigning work, and preparing the final result.',
        timestamp: now, confidence: 0.95, confidenceLevel: 'verified', riskLevel: 'Safe', domain: 'general',
      }]);
      launchColonyCrew(trimmed);
      return;
    }

    if (projectLike) {
      const scenario = demoScenarios.find((item) => trimmed.toLowerCase().includes(item.trigger));
      setProjectIntent({
        id: `project-intent-${Date.now()}`,
        name: scenario?.projectName ?? titleFromGoal(trimmed),
        goal: trimmed,
        description: 'Draft project context created from the prompt. AI Ant can save it when you approve the direction.',
        status: 'draft',
        suggestedMode: decision.mode,
        sourcesNeeded: ['Project context'],
        expectedDeliverables: decision.expectedDeliverables,
      });
    } else {
      setProjectIntent(null);
    }

    if (decision.mode === 'simple_chat') {
      setMessages((prev) => [...prev, {
        id: `aa-${Date.now()}-direct`, role: 'ant',
        text: 'I can answer this directly. No project, team, workflow, or device access is needed.',
        timestamp: now, confidence: decision.confidence, confidenceLevel: 'verified', riskLevel: 'Safe', domain: 'general',
      }]);
      return;
    }

    if (decision.mode === 'operator_task') {
      setMessages((prev) => [...prev, {
        id: `aa-${Date.now()}-operator`, role: 'ant',
        text: 'I can handle this myself as AI Ant. I’ll make a short plan, work through it here, and only escalate if tools or approvals become necessary.',
        timestamp: now, confidence: decision.confidence, confidenceLevel: 'verified', riskLevel: 'Safe', domain: 'general',
      }]);
      const d1 = createDemoDeliverable({ ...decision, expectedDeliverables: ['AI Ant work summary'] }, undefined, { sourceChatId: activeChat?.id });
      setColonyDeliverables((prev) => [d1, ...prev].slice(0, 6));
      onPublishDeliverable?.(colonyDeliverableToApp(d1, activeChat?.title));
      return;
    }

    if (decision.mode === 'one_man_enterprise') {
      setOrchMode('agent-running');
      setShowAgentPanel(false);
      setMatchedAgents([]);
      setOrchAgents([]);
      setMessages((prev) => [...prev, {
        id: `aa-${Date.now()}-enterprise`, role: 'ant',
        text: 'This looks like a business/project system. I’m building your one-man AI enterprise: defining structure, matching core roles, and preparing the workspace.',
        timestamp: now, confidence: decision.confidence, confidenceLevel: 'verified', riskLevel: 'Safe', domain: 'general',
        actionType: 'ORGANIZATION',
      }]);
      setActivitySummaries((prev) => [...prev, 'AI Ant is designing the enterprise org chart and assigning operating roles.']);
      const d2 = createDemoDeliverable(decision, undefined, { sourceChatId: activeChat?.id });
      setColonyDeliverables((prev) => [d2, ...prev].slice(0, 6));
      onPublishDeliverable?.(colonyDeliverableToApp(d2, activeChat?.title));
      launchEnterpriseSetup(trimmed, undefined, {
        sourceConversationId: featureSourceConversationId,
        replaceChatId: replaceDraftChatId,
      });
      return;
    }

    // Auto/Chat mode no longer auto-launches Colony Crew. A multi-agent task
    // is surfaced as a proposal; the crew only runs when the user picks
    // "Colony Crew" mode (handled earlier).
    if (decision.mode === 'agent_swarm') {
      const proposal = buildAntTeamProposal(trimmed, 'ai-team');
      setRoutingDecision(buildRoutingDecisionWithPreference(trimmed, inputMode, decision, proposal, modelRoutingPreference, manualModelSelection));
      setTeamProposal(proposal);
      setProposalAdvancedOpen(false);
      setMessages((prev) => [...prev, {
        id: `aa-${Date.now()}-swarm`, role: 'ant',
        text: 'This looks like a multi-agent task. Select "Colony Crew" mode to assemble a specialist crew, or review this team proposal first.',
        timestamp: now, confidence: decision.confidence, confidenceLevel: 'verified', riskLevel: 'Safe', domain: 'general',
        actionType: 'DATA_ANALYSIS',
      }]);
      const d3 = createDemoDeliverable(decision, undefined, { sourceChatId: activeChat?.id });
      setColonyDeliverables((prev) => [d3, ...prev].slice(0, 6));
      onPublishDeliverable?.(colonyDeliverableToApp(d3, activeChat?.title));
      return;
    }

    if (decision.mode === 'single_agent') {
      const proposal = buildAntTeamProposal(trimmed, 'single-agent');
      const singleProposal = {
        ...proposal,
        whyTeam: 'One focused specialist agent is enough. AI Ant stays in control and keeps review checkpoints visible.',
        agents: proposal.agents.slice(0, 1),
        hierarchy: ['AI Ant Director', proposal.agents[0]?.name ?? 'Specialist Agent'],
      };
      setRoutingDecision(buildRoutingDecisionWithPreference(trimmed, inputMode, decision, singleProposal, modelRoutingPreference, manualModelSelection));
      setTeamProposal(singleProposal);
      setMessages((prev) => [...prev, {
        id: `aa-${Date.now()}-agent`, role: 'ant',
        text: 'I can create one specialist agent for this task and return the result as a deliverable when it is ready.',
        timestamp: now, confidence: decision.confidence, confidenceLevel: 'verified', riskLevel: 'Safe', domain: 'general',
      }]);
      const d4 = createDemoDeliverable(decision, undefined, { sourceChatId: activeChat?.id });
      setColonyDeliverables((prev) => [d4, ...prev].slice(0, 6));
      onPublishDeliverable?.(colonyDeliverableToApp(d4, activeChat?.title));
      return;
    }

    // device_action / approval_sensitive are handled earlier by the Device
    // mode action/permission flow (startDeviceAction) and return before here.

    if (decision.mode === 'deliverable_generation') {
      const proposal = buildAntTeamProposal(trimmed, 'ai-team');
      setRoutingDecision(buildRoutingDecisionWithPreference(trimmed, inputMode, decision, proposal, modelRoutingPreference, manualModelSelection));
      setTeamProposal(proposal);
      setProposalAdvancedOpen(false);
      setMessages((prev) => [...prev, {
        id: `aa-${Date.now()}-${decision.mode}`, role: 'ant',
        text: 'I will turn the result into a deliverable you can review, edit, approve, export, and version.',
        timestamp: now, confidence: decision.confidence, confidenceLevel: 'verified', riskLevel: 'Safe', domain: 'general',
        actionType: 'SEARCH',
      }]);
      const d5 = createDemoDeliverable(decision, undefined, { sourceChatId: activeChat?.id });
      setColonyDeliverables((prev) => [d5, ...prev].slice(0, 6));
      onPublishDeliverable?.(colonyDeliverableToApp(d5, activeChat?.title));
      return;
    }
    if (inputMode === 'One-man Enterprise') {
      // Open BossIntake — AI Ant asks 3 questions, then generates a real team via OpenRouter.
      // The user's initial prompt is captured so BossIntake can prefill the first answer.
      setMessages((prev) => [...prev, {
        id: `aa-${Date.now()}-enterprise`, role: 'ant',
        text: `Got it. I'll ask a few quick questions to design the right AI team for "${trimmed.slice(0, 80)}${trimmed.length > 80 ? '…' : ''}" — then build your workspace.`,
        timestamp: now, confidence: 0.94, confidenceLevel: 'verified', riskLevel: 'Safe', domain: 'general',
      }]);
      setEnterpriseOpen(true);
      return;
    }
    // Colony Crew and Workflow are handled earlier as explicit mode branches.
    if (executionMode === 'ai-team' || executionMode === 'workflow' || executionMode === 'tool-action' || executionMode === 'approval-sensitive') {
      const proposal = buildAntTeamProposal(trimmed, executionMode);
      setRoutingDecision(buildRoutingDecisionWithPreference(trimmed, inputMode, decision, proposal, modelRoutingPreference, manualModelSelection));
      setTeamProposal(proposal);
      setProposalAdvancedOpen(false);
      setMessages((prev) => [...prev, {
        id: `aa-${Date.now()}-proposal`, role: 'ant',
        text: executionMode === 'workflow'
          ? 'I can help with this. This looks repeatable, so I recommend creating a workflow-backed AI team before anything runs.'
          : executionMode === 'tool-action' || executionMode === 'approval-sensitive'
            ? 'I can help with this. It may involve tools, files, devices, or external actions, so I will propose a team with review checkpoints first.'
            : 'I can help with this. This looks like a multi-step project, so I recommend creating an AI team.',
        timestamp: now,
        confidence: 0.92, confidenceLevel: 'verified',
        riskLevel: executionMode === 'approval-sensitive' ? 'Sensitive' : 'Safe',
        domain: executionMode === 'approval-sensitive' ? 'external-export' : 'general',
        actionType: executionMode === 'workflow' ? 'AUTOMATION' : executionMode === 'tool-action' ? 'FILE_OPS' : 'DATA_ANALYSIS',
      }]);
      setThinking(false);
      return;
    }
    setThinking(true);

    const taskId = `at-${Date.now()}`;
    const newTask: AntTask = {
      id: taskId, title: `"${text.trim().slice(0, 32)}${text.length > 32 ? '…' : ''}"`,
      status: 'reading', device: devices.find((d) => d.online)?.name ?? 'MacBook Pro',
      progress: 20, confidence: 0.8, confidenceLevel: 'needs-review',
      estimatedTime: '~5s', startedAt: now, icon: '🐜', riskLevel: 'Safe', domain: 'general',
    };
    setTasks((prev) => [...prev, newTask]);
    window.setTimeout(() => {
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: 'analyzing', progress: 65 } : t));
    }, 600);

    window.setTimeout(() => {
      const resp = mockAntRespond(text, mode);
      const domain = resp.domain ?? 'general';
      const riskLevel = resp.riskLevel ?? 'Safe';
      const confidence = resp.confidence ?? 0.85;
      const confidenceLevel = resp.confidenceLevel ?? getConfidenceLevel(confidence);
      const finalStatus: AntTaskStatus = resp.approval && mode !== 'auto' ? 'waiting-approval' : 'completed';

      setTasks((prev) => prev.map((t) => t.id === taskId ? {
        ...t, status: finalStatus, progress: 100, confidence, confidenceLevel, riskLevel, domain,
        estimatedTime: '—', requiresCorrection: resp.requiresCorrection,
        correctionFields: resp.correctionFields,
        title: finalStatus === 'waiting-approval' ? 'Waiting for approval' : t.title,
      } : t));

      const msgId = `aa-${Date.now()}`;
      const antMsg: AntMessage = {
        id: msgId, role: 'ant', text: resp.text,
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        actions: resp.actions, fileCards: resp.fileCards,
        confidence, confidenceLevel, riskLevel, domain,
        correctionFields: resp.correctionFields,
        requiresCorrection: resp.requiresCorrection,
        systemNote: resp.systemNote,
        plan: resp.plan,
        actionType: detectActionType(text.toLowerCase(), domain),
      };
      setMessages((prev) => [...prev, antMsg]);
      setThinking(false);

      setLogs((prev) => [...prev, {
        id: `al-${Date.now()}`,
        time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        action: `"${text.trim().slice(0, 45)}"`,
        device: newTask.device, confidence, confidenceLevel, riskLevel, domain,
        result: finalStatus === 'waiting-approval' ? 'Awaiting approval' : resp.requiresCorrection ? 'Completed — review required' : 'Completed',
        icon: resp.fileCards ? '📁' : resp.approval ? '🔐' : '🐜',
        approvalStatus: finalStatus === 'waiting-approval' ? 'pending' : mode === 'auto' ? 'auto' : undefined,
      }]);

      if (resp.approval && mode !== 'auto') {
        setApproval({ ...resp.approval, id: `aap-${Date.now()}`, domain: resp.approval.domain ?? domain, requestedBy: resp.approval.requestedBy ?? newTask.device });
        setRightPanel('tasks');
      }
      if (resp.requiresCorrection) setCorrectionMsgId(msgId);

      // Push live events
      const ts2 = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      setLiveEvents(prev => [...prev,
        { id: `le-${Date.now()}-1`, time: ts2, type: 'action', message: `Task received: "${text.trim().slice(0, 40)}"`, device: newTask.device, icon: '🐜' },
        { id: `le-${Date.now()}-2`, time: ts2, type: finalStatus === 'completed' ? 'step' : 'approval', message: finalStatus === 'completed' ? 'Task completed successfully' : 'Waiting for approval', device: 'System', icon: finalStatus === 'completed' ? '✓' : '🔐' },
      ]);

      if (riskLevel === 'High Risk') setFailedTask(text.trim().slice(0, 50));
    }, 1600);
	  }, [activeChat, activeChatId, agentInputMode, mode, devices, onEnsureChat, onAutoTitleChat, onMarkChatWork, onDiscardDraftChat, startAutoMatch, launchColonyCrew, launchEnterpriseSetup, startDeviceAction, clearDeviceTimers, recordMockAIRequest, requestBackendAIAntResponse, usageFeatureForDecision, modelRoutingPreference, manualModelSelection]);

  const handlePromptSuggestionPick = React.useCallback((suggestion: { label: string; mode: AgentInputMode }) => {
    setAgentInputMode(suggestion.mode);
    setAntPrompt(suggestion.label);
  }, []);

  const handleAssistantFeedback = React.useCallback((messageId: string, value: 'up' | 'down') => {
    setMessageFeedback((prev) => ({ ...prev, [messageId]: value }));
    setActivitySummaries((prev) => [...prev, value === 'up' ? 'You marked an AI Ant response as helpful.' : 'You marked an AI Ant response as not helpful.']);
  }, []);

  const handleAssistantCopy = React.useCallback((messageId: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedMessageId(messageId);
    window.setTimeout(() => setCopiedMessageId((prev) => prev === messageId ? null : prev), 1800);
  }, []);

  const handleAssistantRegenerate = React.useCallback((messageId: string) => {
    const targetIndex = messages.findIndex((message) => message.id === messageId);
    if (targetIndex <= 0) return;
    const sourcePrompt = [...messages.slice(0, targetIndex)].reverse().find((message) => message.role === 'user')?.text;
    if (!sourcePrompt) return;
    void submitPrompt(sourcePrompt);
  }, [messages, submitPrompt]);

  const handleAction = React.useCallback((label: string) => {
    if (label.toLowerCase().includes('workflow builder') || label === 'Open Workflow Builder') {
      setPage('Create Agent Team'); return;
    }
    const replies: Record<string, string> = {
      'Preview': '👁 Opening preview…', 'Summarize': '📝 Generating summary…',
      'Summarize All': '📝 Summarizing all screenshots…', 'Send': '📤 Preparing to send — approval required.',
      'Export Summary': '📤 Exporting summary…', 'Export CSV': '📤 CSV export ready.',
      'Send to Workflow': '⚡ Data sent to active workflow.', 'Add to Workflow': '⚡ Added as workflow input.',
      'Create Report': '📋 Opening Report Writer…', 'Analyze Trends': '📊 Analyzing trends…',
      'Extract Metrics': '📊 Extracting key metrics…', 'Copy Data': '📋 Copied to clipboard.',
      'Set Thresholds': '⚙️ Threshold settings opened.', 'Stop Monitoring': '⏹ Monitoring stopped.',
      'Preview Plan': '👁 Showing reorganization preview…', 'Customize': '⚙️ Opening customization options…',
      'Preview Files': '👁 Listing files for sync preview…', 'Cancel': '✕ Action cancelled.',
      'View Map': '🗺️ Displaying file map…', 'Switch Mode': '🔄 Open the Mode selector in the topbar to switch.',
      'Review Extracted Data': '✏️ Correction panel opened below.', 'Review Fields': '✏️ Opening field review…',
      'Read Inbox': '📧 Reading email inbox…', 'Draft Reply': '✏️ Draft reply ready for your review.',
      'View Summary': '📋 Summary ready.', 'Preview Targets': '👁 Showing deletion preview — no files removed yet.',
    };
    const text = replies[label] ?? `✓ ${label} — done.`;
    setMessages((prev) => [...prev, {
      id: `aa-${Date.now()}`, role: 'ant', text,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      riskLevel: 'Safe', domain: 'general', confidenceLevel: 'verified', confidence: 1,
    }]);
  }, [setPage]);

  const toggleVoice = React.useCallback(() => {
    setVoiceActive((v) => {
      if (!v) {
        setVoiceBarVisible(true);
        setVoiceState('listening');
        setVoiceTranscript('');
        window.setTimeout(() => {
          setVoiceState('processing');
          setVoiceTranscript('Find the latest report and summarize it');
        }, 2200);
        window.setTimeout(() => {
          setVoiceState('idle');
          setVoiceActive(false);
          setVoiceBarVisible(false);
          setVoiceTranscript('');
          setAntPrompt('Find the latest report and summarize it');
        }, 3800);
      } else {
        setVoiceState('idle');
        setVoiceBarVisible(false);
        setVoiceTranscript('');
      }
      return !v;
    });
  }, []);

  const EXAMPLE_PROMPTS = [
    'Find the latest report in my workspace.',
    'Read my screenshots and extract key data points.',
    'Organize my workspace files by type and date.',
    'Summarize the most recent spreadsheet.',
    'Build an automation workflow from this task.',
  ];

  // ── Topbar ──────────────────────────────────────────────────────────────────
  const topbar = (
    <div className="flex shrink-0 items-center justify-between border-b border-white/[0.07] bg-[#07070f]/90 px-4 py-2.5 backdrop-blur-xl">
      {/* Left: identity */}
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-[0_0_12px_rgba(124,92,252,0.35)]">
          <img src="/assets/logos/ai ant black (2).png" width={17} height={17} alt="AI Ant" draggable={false} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-heading text-[13px] font-extrabold text-white/90 tracking-[-0.01em]">AI Ant</span>
          <span className="hidden text-[10px] text-white/30 sm:block">Colony Operator</span>
        </div>
        {view === 'chat' && (
          <button onClick={() => setView('home')}
            className="ml-1 flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[11px] text-white/45 transition hover:border-white/[0.14] hover:text-white/80">
            <ArrowLeft size={10} />
            Home
          </button>
        )}
      </div>

      {/* Right: compact controls */}
      <div className="flex items-center gap-1.5">
        {/* Running agents badge */}
        {orchMode === 'agent-running' && (
          <span className="hidden items-center gap-1.5 rounded-full border border-[#4ecca0]/25 bg-[#4ecca0]/[0.07] px-2.5 py-0.5 text-[10px] font-semibold text-[#4ecca0] sm:flex">
            <motion.span className="h-1.5 w-1.5 rounded-full bg-[#4ecca0]"
              animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
            {matchedAgents.filter(a => a.status === 'running').length || orchAgents.filter(a => a.status === 'running').length} running
          </span>
        )}
        {orchMode === 'agent-running' && (
          <button onClick={() => setShowAgentPanel(p => !p)} title={showAgentPanel ? 'Hide panel' : 'Show panel'}
            className={`hidden h-7 w-7 items-center justify-center rounded-lg border transition sm:flex ${showAgentPanel ? 'border-[#4ecca0]/40 bg-[#4ecca0]/10 text-[#4ecca0]' : 'border-white/[0.08] bg-white/[0.04] text-white/40 hover:text-white/80'}`}>
            <Layers3 size={12} />
          </button>
        )}

        {/* Search */}
        <button onClick={() => setView('search')} title="Search"
          className="hidden h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/40 transition hover:border-white/[0.14] hover:text-white/80 sm:flex">
          <Search size={13} />
        </button>

        <button onClick={() => setDeviceHubOpen(true)} title="Devices"
          className="hidden h-7 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 text-[11px] font-semibold text-white/45 transition hover:border-white/[0.14] hover:text-white/80 sm:flex">
          <Laptop size={13} />
          <span>{devices.filter((d) => d.online).length}</span>
          {devices.some((d) => d.status === 'active') && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
        </button>

        <button onClick={() => setNotifOpen(true)} title="Approvals"
          className="relative hidden h-7 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 text-[11px] font-semibold text-white/45 transition hover:border-white/[0.14] hover:text-white/80 sm:flex">
          <ShieldCheck size={13} />
          <span>{approval ? 1 : deliveries.filter((d) => d.status === 'pending').length}</span>
        </button>

        {/* Autonomy pill */}
        <button onClick={() => setAutonomySelectorOpen(true)}
          className="hidden items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/50 transition hover:border-[#7c5cfc]/40 hover:text-white/80 hover:bg-[#7c5cfc]/[0.08] sm:flex">
          <Zap size={10} className="text-violet-400" />
          <span className="font-medium">{mode === 'auto' ? 'Auto' : mode === 'approval' ? 'Approval' : mode === 'assist' ? 'Assist' : 'Read-only'}</span>
        </button>

        {/* Mode toggle */}
        <AIAntModeToggle mode={mode} setMode={setMode} />

        {/* Notification bell */}
        <AIAntNotificationBell notifications={notifications} onClick={() => setNotifOpen(n => !n)} />

        <button onClick={() => { setWorkspaceDrawerOpen(true); setWorkspaceDrawerTab('members'); }} title="Open workspace panel"
          className="hidden h-7 items-center gap-1.5 rounded-lg border border-violet-400/20 bg-violet-500/[0.07] px-2 text-[11px] font-semibold text-violet-200/75 transition hover:border-violet-400/35 hover:bg-violet-500/[0.12] hover:text-white sm:flex">
          <Layers3 size={13} />
          Workspace
        </button>

        {/* More overflow — Graph, Live, Safety, Devices */}
        <button
          ref={moreMenuBtnRef}
          onClick={() => {
            const r = moreMenuBtnRef.current?.getBoundingClientRect();
            if (r) setMoreMenuPos({ top: r.bottom + 6, left: r.left });
            setMoreMenuOpen(p => !p);
          }}
          className="hidden h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/40 transition hover:border-white/[0.14] hover:text-white/80 sm:flex">
          <MoreHorizontal size={14} />
          {(tasks.filter(t => t.status === 'analyzing' || t.status === 'reading').length + suggestions.filter(s => !s.dismissed && !s.applied).length) > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-3 min-w-[12px] items-center justify-center rounded-full bg-violet-500 text-[6px] font-bold text-white">
              {tasks.filter(t => t.status === 'analyzing' || t.status === 'reading').length + suggestions.filter(s => !s.dismissed && !s.applied).length}
            </span>
          )}
        </button>
      </div>
    </div>
  );

  const workspaceTabs: Array<{ id: typeof workspaceDrawerTab; label: string; badge?: number }> = [
    { id: 'members', label: 'Members', badge: workspaceMembers.length },
    { id: 'assets', label: 'Assets', badge: workspaces.filter(w => w.connected).length },
  ];
  const currentWorkspaceName = activeEnterpriseProject?.name ?? activeGeneratedProject?.proposal.projectName ?? projectIntent?.name ?? 'AI Ant command center';
  const currentWorkspaceDescription = activeEnterpriseProject?.goal ?? activeGeneratedProject?.proposal.goal ?? projectIntent?.goal ?? 'Start a task with AI Ant or open a project to attach members and context.';
  const saveWorkspaceMember = (member: WorkspaceMember, message?: string) => {
    setWorkspaceMembers((prev) => prev.some((item) => item.id === member.id) ? prev.map((item) => item.id === member.id ? member : item) : [member, ...prev]);
    setMemberModal(null);
    setWorkspaceToast(member.type === 'human' ? `Invite sent to ${member.email}` : `${member.name} added to workspace`);
    if (message) setActivitySummaries((prev) => [...prev, `Invite note saved for ${member.email}.`]);
    window.setTimeout(() => setWorkspaceToast(''), 2600);
  };

  const contextDrawers = (
    <>
      {deviceHubOpen && (
        <>
          <div className="fixed inset-0 z-[214] bg-black/40 backdrop-blur-[3px]" onClick={() => setDeviceHubOpen(false)} />
          <aside className="fixed bottom-0 right-0 top-0 z-[215] flex w-[min(92vw,380px)] flex-col border-l border-white/[0.09] bg-[#0b101d] text-white shadow-[-24px_0_80px_rgba(0,0,0,0.55)]">
            <header className="flex shrink-0 items-center justify-between border-b border-white/[0.07] px-4 py-4">
              <div>
                <p className="font-heading text-sm font-extrabold text-white/90">Device Hub</p>
                <p className="mt-0.5 text-[11px] text-white/38">{devices.filter(d => d.online).length} online · read-only until approved</p>
              </div>
              <button onClick={() => setDeviceHubOpen(false)} className="grid h-8 w-8 place-items-center rounded-[10px] text-white/40 transition hover:bg-white/[0.08] hover:text-white/75">
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-4">
              <AIAntDevicePanel devices={devices} />
              <div className="mt-4 grid gap-3">
                {devices.map((device) => (
                  <div key={device.id} className="rounded-[14px] border border-white/[0.07] bg-white/[0.03] p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-white/82">{device.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${device.online ? 'bg-emerald-500/10 text-emerald-300' : 'bg-white/[0.06] text-white/35'}`}>
                        {device.online ? device.status : 'offline'}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-white/42">
                      <span>Last activity</span><span className="text-right text-white/65">{device.activeSession ?? device.lastSeen}</span>
                      <span>Battery</span><span className="text-right text-white/65">{device.batteryLevel != null ? `${device.batteryLevel}%` : 'Desktop power'}</span>
                      <span>Permission</span><span className="text-right text-white/65">Project read</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button className="rounded-[12px] border border-white/[0.10] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/55 transition hover:text-white">Connect new</button>
                <button onClick={() => { setDeviceHubOpen(false); setWorkspaceDrawerOpen(true); setWorkspaceDrawerTab('assets'); }} className="rounded-[12px] bg-violet-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-violet-500">Permissions</button>
              </div>
            </div>
          </aside>
        </>
      )}

      {workspaceDrawerOpen && (
        <>
          <div className="fixed inset-0 z-[214] bg-black/40 backdrop-blur-[3px]" onClick={() => setWorkspaceDrawerOpen(false)} />
          <aside className="fixed bottom-0 right-0 top-0 z-[215] flex w-[min(94vw,420px)] flex-col border-l border-white/[0.09] bg-[#0b101d] text-white shadow-[-24px_0_80px_rgba(0,0,0,0.55)]">
            <header className="shrink-0 border-b border-white/[0.07] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-heading text-sm font-extrabold text-white/90">Workspace Panel</p>
                  <p className="mt-0.5 text-[11px] text-white/38">Manage members and workspace context</p>
                </div>
                <button onClick={() => setWorkspaceDrawerOpen(false)} className="grid h-8 w-8 place-items-center rounded-[10px] text-white/40 transition hover:bg-white/[0.08] hover:text-white/75">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 flex gap-1 overflow-x-auto">
                {workspaceTabs.map((tab) => (
                  <button key={tab.id} onClick={() => setWorkspaceDrawerTab(tab.id)}
                    className={`relative shrink-0 rounded-[10px] px-3 py-2 text-[11px] font-bold transition ${workspaceDrawerTab === tab.id ? 'bg-violet-500/18 text-white' : 'text-white/35 hover:bg-white/[0.05] hover:text-white/70'}`}>
                    {tab.label}
                    {tab.badge != null && tab.badge > 0 && <span className="ml-1.5 rounded-full bg-violet-500/30 px-1.5 py-0.5 text-[9px] text-violet-100">{tab.badge}</span>}
                  </button>
                ))}
              </div>
            </header>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.035] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">Current workspace</p>
                      <h3 className="mt-2 text-base font-bold text-white/86">{currentWorkspaceName}</h3>
                    </div>
                    <span className="rounded-full border border-emerald-300/15 bg-emerald-400/[0.10] px-2.5 py-1 text-[10px] font-bold text-emerald-200">
                      {activeGeneratedProject || activeEnterpriseProject ? 'Running' : 'Ready'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-white/45">{currentWorkspaceDescription}</p>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[
                      ['Members', String(workspaceMembers.length)],
                      ['Assets', String(workspaces.filter(w => w.connected).length)],
                      ['Status', activeGeneratedProject || activeEnterpriseProject ? 'Live' : 'Idle'],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-[12px] border border-white/[0.06] bg-black/15 px-3 py-2">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-white/25">{label}</p>
                        <p className="mt-1 text-sm font-bold text-white/78">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {workspaceToast && (
                  <div className="rounded-[14px] border border-emerald-300/15 bg-emerald-400/[0.08] px-3 py-2 text-xs font-semibold text-emerald-100">
                    {workspaceToast}
                  </div>
                )}

                {workspaceDrawerTab === 'members' && (
                  <section className="rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-extrabold text-white/86">Members</h4>
                        <p className="mt-1 text-xs text-white/38">Humans and AI agents attached to this workspace.</p>
                      </div>
                      <button onClick={() => setMemberModal({ mode: 'add' })} className="rounded-[11px] bg-violet-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-violet-500">
                        Add member
                      </button>
                    </div>

                    {workspaceMembers.length === 0 ? (
                      <div className="mt-4 rounded-[14px] border border-dashed border-white/[0.10] bg-black/15 p-4 text-center">
                        <p className="text-sm font-bold text-white/72">No members yet</p>
                        <p className="mt-1 text-xs leading-relaxed text-white/38">Add a human teammate or AI agent to this workspace.</p>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {workspaceMembers.map((member) => (
                          <div key={member.id} className="rounded-[14px] border border-white/[0.07] bg-black/15 p-3 transition hover:border-violet-300/20 hover:bg-white/[0.04]">
                            <div className="flex items-start gap-3">
                              <WorkspaceMemberAvatar member={member} />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-extrabold text-white/86">{member.name}</p>
                                    <p className="mt-0.5 truncate text-xs text-white/42">
                                      {member.type === 'human' ? 'User' : 'AI Agent'} · {member.role}
                                    </p>
                                    {member.email && <p className="mt-0.5 truncate text-[11px] text-white/30">{member.email}</p>}
                                  </div>
                                  <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold capitalize ${
                                    member.status === 'active'
                                      ? 'bg-emerald-400/[0.12] text-emerald-200'
                                      : member.status === 'invited'
                                        ? 'bg-amber-400/[0.12] text-amber-200'
                                        : 'bg-white/[0.06] text-white/38'
                                  }`}>
                                    {member.status}
                                  </span>
                                </div>

                                {member.instructions && (
                                  <p className="mt-2 line-clamp-2 rounded-[10px] bg-white/[0.035] px-2.5 py-2 text-xs leading-relaxed text-white/45">{member.instructions}</p>
                                )}

                                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                                  <select
                                    value={member.permission}
                                    onChange={(event) => setWorkspaceMembers(prev => prev.map(item => item.id === member.id ? { ...item, permission: event.target.value as WorkspaceMemberPermission } : item))}
                                    className="min-h-[34px] rounded-[10px] border border-white/[0.08] bg-[#0b101d] px-2.5 text-xs font-semibold capitalize text-white/72 outline-none transition focus:border-violet-400/45"
                                  >
                                    {(member.type === 'agent' ? ['agent', 'editor', 'viewer'] : ['owner', 'editor', 'viewer']).map((permission) => (
                                      <option key={permission} value={permission}>{permission}</option>
                                    ))}
                                  </select>
                                  <div className="flex flex-wrap gap-2">
                                    <button onClick={() => setMemberModal({ mode: 'edit', member })} className="rounded-[10px] border border-white/[0.08] bg-white/[0.04] px-2.5 py-2 text-[11px] font-bold text-white/55 transition hover:text-white">
                                      {member.type === 'agent' ? 'Edit instructions' : 'Edit role'}
                                    </button>
                                    {member.type === 'human' && member.status === 'invited' && (
                                      <button onClick={() => {
                                        setWorkspaceToast(`Invite resent to ${member.email}`);
                                        window.setTimeout(() => setWorkspaceToast(''), 2600);
                                      }} className="rounded-[10px] border border-amber-300/15 bg-amber-400/[0.06] px-2.5 py-2 text-[11px] font-bold text-amber-100/75 transition hover:text-amber-50">
                                        Resend invite
                                      </button>
                                    )}
                                    <button onClick={() => setWorkspaceMembers(prev => prev.filter(item => item.id !== member.id))} className="rounded-[10px] border border-red-400/15 bg-red-500/[0.07] px-2.5 py-2 text-[11px] font-bold text-red-200/75 transition hover:text-red-100">
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </div>
              {workspaceDrawerTab === 'overview' && (
                <div className="space-y-3">
                  <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.035] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">Current project</p>
                    <h3 className="mt-2 text-base font-bold text-white/86">{activeGeneratedProject?.proposal.projectName ?? projectIntent?.name ?? 'AI Ant command center'}</h3>
                    <p className="mt-1 text-sm text-white/45">{activeGeneratedProject?.proposal.goal ?? projectIntent?.goal ?? 'No active project selected. AI Ant will create one when the goal needs it.'}</p>
                    {executionDecision && (
                      <p className="mt-3 rounded-[10px] border border-violet-400/15 bg-violet-400/[0.06] px-3 py-2 text-xs font-semibold capitalize text-violet-100/75">
                        Mode: {executionDecision.mode.replace(/_/g, ' ')} · {Math.round(executionDecision.confidence * 100)}% confidence
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ['Progress', activeGeneratedProject ? `${activeGeneratedProject.progress}%` : 'Ready'],
                      ['Active tasks', String(tasks.filter(t => t.status === 'reading' || t.status === 'analyzing').length)],
                      ['Approvals', String((approval ? 1 : 0) + (deviceAction?.approvalRequired ? 1 : 0) + deliveries.filter(d => d.status === 'pending').length)],
                      ['Deliverables', String(colonyDeliverables.length || activeGeneratedProject?.proposal.deliverables.length || deliveries.length)],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-[14px] border border-white/[0.07] bg-white/[0.03] p-3">
                        <p className="text-[10px] uppercase tracking-widest text-white/25">{label}</p>
                        <p className="mt-2 text-lg font-bold text-white/82">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-[14px] border border-amber-400/15 bg-amber-400/[0.05] p-3">
                    <p className="text-xs font-bold text-amber-200">Next step</p>
                    <p className="mt-1 text-sm text-white/50">{executionDecision?.suggestedNextStep ?? activeGeneratedProject?.nextStep ?? 'Tell AI Ant what you want to accomplish.'}</p>
                  </div>
                </div>
              )}
              {workspaceDrawerTab === 'tasks' && <AIAntTaskPanel tasks={tasks} />}
              {workspaceDrawerTab === 'team' && (
                <div className="grid gap-2">
                  {(teamProposal?.agents.map(a => ({ id: a.name, name: a.name, role: a.role })) ?? teamMembers).map((member) => (
                    <div key={member.id} className="rounded-[14px] border border-white/[0.07] bg-white/[0.03] p-3">
                      <p className="text-sm font-bold text-white/82">{member.name}</p>
                      <p className="mt-1 text-xs text-white/42">{member.role}</p>
                    </div>
                  ))}
                </div>
              )}
              {workspaceDrawerTab === 'activity' && (
                <div className="space-y-3">
                  <div className="rounded-[14px] border border-white/[0.07] bg-white/[0.03] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">Summarized activity</p>
                    <div className="mt-3 space-y-2">
                      {activitySummaries.slice(-8).reverse().map((item, index) => (
                        <p key={`${item}-${index}`} className="rounded-[10px] bg-black/15 px-3 py-2 text-sm text-white/55">{item}</p>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => setLiveConsoleOpen(true)} className="w-full rounded-[12px] border border-white/[0.10] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/55 transition hover:text-white">View logs</button>
                </div>
              )}
              {workspaceDrawerTab === 'assets' && (
                <section className="mt-4 rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-extrabold text-white/86">Assets / Context</h4>
                      <p className="mt-1 text-xs text-white/38">Files, sources, and notes AI Ant can reference.</p>
                    </div>
                    <button onClick={() => {
                      setWorkspaceToast('Asset attach flow is ready for backend integration.');
                      window.setTimeout(() => setWorkspaceToast(''), 2600);
                    }} className="rounded-[11px] border border-white/[0.10] bg-white/[0.04] px-3 py-2 text-xs font-bold text-white/58 transition hover:text-white">
                      Add asset
                    </button>
                  </div>
                  {workspaces.length === 0 ? (
                    <div className="mt-4 rounded-[14px] border border-dashed border-white/[0.10] bg-black/15 p-4 text-center">
                      <p className="text-sm font-bold text-white/72">No assets attached</p>
                      <p className="mt-1 text-xs leading-relaxed text-white/38">Attach files, sources, or notes for AI Ant and agents to reference.</p>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-2">
                      {workspaces.map((workspace) => (
                        <div key={workspace.id} className="rounded-[13px] border border-white/[0.07] bg-black/15 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-white/82">{workspace.name}</p>
                              <p className="mt-1 text-xs capitalize text-white/38">{workspace.source.replace(/-/g, ' ')} · {workspace.lastAccessed ?? 'Not connected yet'}</p>
                            </div>
                            <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold ${workspace.connected ? 'bg-emerald-400/[0.12] text-emerald-200' : 'bg-white/[0.06] text-white/35'}`}>
                              {workspace.connected ? 'Attached' : 'Available'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
              {workspaceDrawerTab === 'deliverables' && (
                <div className="grid gap-3">
                  {(colonyDeliverables.length ? colonyDeliverables : activeGeneratedProject?.proposal.deliverables.map((item, index) => ({
                    id: `${activeGeneratedProject.id}-deliverable-${index}`,
                    title: item.title,
                    type: 'report' as ColonyDeliverableType,
                    status: item.status === 'Ready' ? 'needs_review' as ColonyDeliverableStatus : 'in_progress' as ColonyDeliverableStatus,
                    content: item.preview,
                    preview: item.preview,
                    version: 1,
                    createdAt: 'Now',
                    updatedAt: 'Now',
                    sourceTasks: [item.owner],
                    approvalStatus: 'none' as const,
                  })) ?? []).map((item) => (
                    <div key={item.id} className="rounded-[14px] border border-white/[0.07] bg-white/[0.03] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-white/82">{item.title}</p>
                          <p className="mt-1 text-xs capitalize text-white/38">{item.type.replace(/_/g, ' ')}</p>
                        </div>
                        <span className="rounded-full bg-white/[0.06] px-2 py-1 text-[10px] font-bold capitalize text-white/45">{item.status.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="mt-2 text-sm text-white/48">{item.preview}</p>
                    </div>
                  ))}
                </div>
              )}
              {workspaceDrawerTab === 'approvals' && (
                <div className="space-y-3">
                  {deviceAction && (
                    <div className="rounded-[14px] border border-amber-400/15 bg-amber-400/[0.05] p-3">
                      <p className="text-xs font-bold text-amber-200">Review before AI acts</p>
                      <p className="mt-1 text-sm text-white/55">{deviceAction.description}</p>
                      <p className="mt-2 text-xs text-white/35">{deviceAction.preview}</p>
                    </div>
                  )}
                  {approval ? (
                    <div className="rounded-[14px] border border-white/[0.07] bg-white/[0.03] p-3">
                      <p className="text-sm font-bold text-white/82">{approval.action}</p>
                      <p className="mt-1 text-xs text-white/42">{approval.reason}</p>
                      <button onClick={() => setApproval(null)} className="mt-3 rounded-[10px] bg-violet-600 px-3 py-2 text-xs font-bold text-white">Approve</button>
                    </div>
                  ) : (
                    <p className="rounded-[14px] border border-white/[0.07] bg-white/[0.03] p-4 text-sm text-white/42">No pending approval.</p>
                  )}
                </div>
              )}
            </div>
          </aside>
        </>
      )}
      {memberModal && (
        <AddWorkspaceMemberModal
          state={memberModal}
          members={workspaceMembers}
          onClose={() => setMemberModal(null)}
          onSave={saveWorkspaceMember}
        />
      )}
    </>
  );

  // ══════════════════ SEARCH VIEW ══════════════════════════════════════════════
  if (view === 'search') {
    return (
      <AIAntSemanticSearch
        onClose={() => setView('home')}
        onSubmit={(q) => { setAntPrompt(q); setView('chat'); window.setTimeout(() => submitPrompt(q), 50); }}
      />
    );
  }

  // ══════════════════ KNOWLEDGE VIEW ═══════════════════════════════════════════
  if (view === 'project' && activeEnterpriseProject) {
    return <EnterpriseWorkspace project={activeEnterpriseProject} onBack={() => setView('chat')} ModelPickerModal={ModelPickerModal} />;
  }

  if (view === 'project' && activeGeneratedProject) {
    return <AIProjectWorkspace project={activeGeneratedProject} onBack={() => setView('chat')} />;
  }
  if (view === 'crew' && activeCrewRun) {
    return <CrewWorkspace run={activeCrewRun} onBack={() => setView('chat')} onStop={stopOrchestration} />;
  }

  if (view === 'workflow-builder' && activeWorkflow) {
    return (
      <WorkflowBuilderPage
        workflow={activeWorkflow}
        selectedNodeId={selectedWorkflowNodeId}
        selectedEdgeId={selectedWorkflowEdgeId}
        logs={workflowRunLogs}
        onBack={() => setView('chat')}
        onSelectNode={setSelectedWorkflowNodeId}
        onSelectEdge={setSelectedWorkflowEdgeId}
        onUpdateNode={updateWorkflowNode}
        onDeleteNode={deleteWorkflowNode}
        onDeleteEdge={deleteWorkflowEdge}
        onAddStep={addWorkflowStep}
        onDuplicateNode={duplicateWorkflowNode}
        onConnectNodes={connectWorkflowNodes}
        onRunTest={() => runWorkflowTest()}
        onRunNode={runWorkflowNode}
        onSave={saveWorkflowDraft}
        onToggleActive={toggleWorkflowActive}
        onConnectConnector={connectWorkflowConnector}
        onApproveConnector={approveWorkflowConnector}
        onApplyTemplate={applyWorkflowTemplate}
      />
    );
  }

  if (view === 'knowledge') {
    return (
      <div className="flex h-full flex-col bg-[#070B14] text-white/90">
        {topbar}
        {contextDrawers}
        {graphOpen && <AIAntWorkspaceGraph onClose={() => setGraphOpen(false)} />}
        {notifOpen && <AIAntNotificationDrawer notifications={notifications} onClose={() => setNotifOpen(false)}
          onMarkRead={id => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
          onAction={(nid, label) => { setNotifOpen(false); setNotifications(prev => prev.map(n => n.id === nid ? { ...n, read: true } : n)); }} />}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="mb-4 flex items-center gap-3">
            <button onClick={() => setView('home')} className="grid h-8 w-8 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/40 hover:text-white/70 transition text-sm">←</button>
            <h2 className="font-heading text-[18px] font-extrabold text-white/90">Knowledge Base</h2>
          </div>
          <AIAntKnowledgeBase
            entries={knowledge}
            onPin={id => setKnowledge(prev => prev.map(e => e.id === id ? { ...e, pinned: !e.pinned } : e))}
            onDelete={id => setKnowledge(prev => prev.map(e => e.id === id ? { ...e, archived: true } : e))}
          />
        </div>
      </div>
    );
  }

  // ══════════════════ HOME VIEW ════════════════════════════════════════════════
  if (view === 'home') {
    return (
      <div className="flex h-full flex-col text-white/90" style={{ background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(109,40,217,0.12) 0%, #070B14 60%)' }}>
        {topbar}
        {contextDrawers}
        {graphOpen && <AIAntWorkspaceGraph onClose={() => setGraphOpen(false)} />}
        {notifOpen && <AIAntNotificationDrawer notifications={notifications} onClose={() => setNotifOpen(false)}
          onMarkRead={id => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
          onAction={(nid, label) => { setNotifOpen(false); setNotifications(prev => prev.map(n => n.id === nid ? { ...n, read: true } : n)); }} />}
        {autonomySelectorOpen && (
          <AIAntAutonomySelector mode={mode} setMode={setMode} onClose={() => setAutonomySelectorOpen(false)} />
        )}
        {liveConsoleOpen && (
          <AIAntLiveConsole events={liveEvents} onClose={() => setLiveConsoleOpen(false)}
            paused={consolePaused} onTogglePause={() => setConsolePaused(p => !p)} />
        )}
        <div className="flex-1 overflow-y-auto">
          {/* Hero */}
          <div className="flex flex-col items-center px-6 pb-7 pt-[120px] text-center">
            {/* Glowing AI Ant logo */}
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full blur-3xl opacity-70" style={{ background: 'radial-gradient(circle, rgba(124,92,252,0.42) 0%, transparent 70%)', transform: 'scale(2.2)' }} />
              <img
                src="/assets/logos/ai ant black (2).png"
                width={92}
                height={92}
                alt="AI Ant"
                className="relative brightness-0 invert drop-shadow-[0_0_34px_rgba(124,92,252,0.45)]"
                draggable={false}
              />
            </div>
            <h1 className="mb-3 font-heading text-[44px] font-semibold leading-tight tracking-[-0.03em] text-white">
              AI Ant
            </h1>
            <p className="max-w-[420px] text-[15px] font-normal leading-relaxed text-white/45">
              Tell AI Ant what you want to accomplish.
            </p>
          </div>

        {/* Status strip intentionally hidden on the AI Ant launch view. */}

          {/* Prompt */}
          <div className="mx-auto mb-4 w-full max-w-[800px] px-4">
            {voiceBarVisible && (
              <div className="mb-3">
                <AIAntVoiceBar state={voiceState} transcript={voiceTranscript}
                  onClose={() => { setVoiceBarVisible(false); setVoiceActive(false); setVoiceState('idle'); }} />
              </div>
            )}
            <AntPromptInput large prompt={prompt} onChange={setAntPrompt} onSubmit={submitPrompt} voiceActive={voiceActive} onToggleVoice={toggleVoice} agentMode={agentInputMode} setAgentMode={setAgentInputMode} modelRoutingPreference={modelRoutingPreference} setModelRoutingPreference={setModelRoutingPreference} manualModelSelection={manualModelSelection} setManualModelSelection={setManualModelSelection} />
          </div>

          {/* Quick actions */}
          <div className="mx-auto mb-8 hidden max-w-5xl px-4">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <button onClick={() => startAutoMatch(prompt || 'Analyse and summarise available data')}
                className="hidden items-center gap-1.5 rounded-full border border-[#4ecca0]/30 bg-[#4ecca0]/[0.07] px-3.5 py-1.5 text-xs font-semibold text-[#4ecca0] transition hover:border-[#4ecca0]/55 hover:bg-[#4ecca0]/[0.13]">
                <Sparkles size={11} /> Auto-match AI team
              </button>
              {ANT_QUICK_ACTIONS.map((qa) => {
                const QIcon = qa.icon;
                return (
                  <button key={qa.label} onClick={() => qa.label === 'One-man enterprise' ? setEnterpriseOpen(true) : submitPrompt(qa.prompt)}
                    className="flex min-h-[58px] items-center gap-3 rounded-[16px] border border-white/[0.08] bg-white/[0.035] px-3.5 py-3 text-left transition hover:border-violet-500/35 hover:bg-violet-500/[0.07]">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-white/[0.06]"><QIcon className="h-4 w-4 text-white/70" /></span>
                    <span className="text-xs font-semibold leading-tight text-white/68">{qa.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mx-auto mb-8 hidden max-w-5xl gap-3 px-4 md:grid-cols-4">
            {[
              { label: 'Active projects', value: activeGeneratedProject ? '1' : '3', detail: activeGeneratedProject?.proposal.projectName ?? 'Daily Sales Report' },
              { label: 'Running tasks', value: String(tasks.filter((t) => t.status === 'reading' || t.status === 'analyzing').length || 1), detail: 'AI Ant is monitoring work' },
              { label: 'Pending approvals', value: String(approval ? 1 : 2), detail: 'Review before AI acts' },
              { label: 'Recent deliverables', value: String(activeGeneratedProject?.proposal.deliverables.length ?? 4), detail: 'Reports, plans, summaries' },
            ].map((item) => (
              <div key={item.label} className="rounded-[16px] border border-white/[0.07] bg-white/[0.025] p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/24">{item.label}</p>
                <p className="mt-2 text-2xl font-bold text-white/86">{item.value}</p>
                <p className="mt-1 truncate text-[11px] text-white/36">{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="mx-auto mb-10 w-full max-w-[800px] px-4">
            <AntPromptSuggestions onPick={handlePromptSuggestionPick} />
          </div>

          {/* Example prompts */}
          <div className="mx-auto mb-8 hidden max-w-xl px-4">
            <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-widest text-white/20">Try asking</p>
            <div className="flex flex-col gap-1.5">
              {EXAMPLE_PROMPTS.map((p) => (
                <button key={p} onClick={() => submitPrompt(p)}
                  className="rounded-[14px] border border-white/[0.07] bg-white/[0.03] px-4 py-2.5 text-left text-[12px] text-white/45 transition hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-white/70">
                  "{p}"
                </button>
              ))}
            </div>
          </div>

          {/* Quick access bar */}
          <div className="mx-auto mb-5 hidden max-w-xl px-4">
            <div className="grid grid-cols-3 gap-2">
              {([
                { Icon: Search, label: 'Semantic Search', sub: 'Search by meaning', action: () => setView('search') },
                { Icon: Network, label: 'Workspace Graph', sub: 'Visualize connections', action: () => setGraphOpen(true) },
                { Icon: Brain, label: 'Knowledge Base', sub: `${knowledge.length} entries`, action: () => setView('knowledge') },
              ] as const).map(item => (
                <button key={item.label} onClick={item.action}
                  className="flex flex-col items-center gap-1.5 rounded-[14px] border border-white/[0.07] bg-white/[0.03] p-3 text-center transition hover:border-white/[0.14] hover:bg-white/[0.06]">
                  <item.Icon className="h-4 w-4 text-white/50" />
                  <span className="text-[10px] font-semibold text-white/70">{item.label}</span>
                  <span className="text-[9px] text-white/30">{item.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Smart suggestions preview */}
          {suggestions.filter(s => !s.dismissed && !s.applied).length > 0 && (
            <div className="mx-auto mb-6 hidden max-w-xl px-4">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">AI Suggestions</p>
                <span className="text-[9px] text-violet-400/60">{suggestions.filter(s => !s.dismissed && !s.applied).length} available</span>
              </div>
              <div className="flex flex-col gap-2">
                {suggestions.filter(s => !s.dismissed && !s.applied).slice(0, 2).map(s => {
                  const icons: Record<AntSuggestionType, string> = { automation: '⚡', optimization: '🚀', organization: '📂', repair: '🔧', memory: '🧠', connector: '🔌', export: '📤', safety: '🛡' };
                  return (
                    <div key={s.id} className="flex items-center gap-3 rounded-[12px] border border-violet-500/15 bg-violet-500/[0.04] px-3.5 py-2.5">
                      <span className="text-lg shrink-0">{icons[s.type]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-white/80">{s.title}</p>
                        <p className="text-[10px] text-white/40 truncate">{s.explanation}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => setSuggestions(prev => prev.map(sg => sg.id === s.id ? { ...sg, applied: true } : sg))}
                          className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[10px] font-semibold text-violet-300 hover:bg-violet-500/20 transition">
                          Apply
                        </button>
                        <button onClick={() => setSuggestions(prev => prev.map(sg => sg.id === s.id ? { ...sg, dismissed: true } : sg))}
                          className="text-white/20 hover:text-white/50 transition text-sm px-1">✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Devices strip */}
          <div className="hidden"><AIAntDevicesStrip devices={devices} /></div>

          {/* Live activity feed */}
          <div className="mx-auto mb-8 hidden max-w-xl px-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">Live Activity</p>
              <button onClick={() => setLiveConsoleOpen(true)}
                className="flex items-center gap-1 text-[9px] text-violet-400/70 hover:text-violet-400 transition">
                <span className="h-1 w-1 rounded-full bg-violet-400 animate-pulse" />
                <span>Open Console</span>
              </button>
            </div>
            <div className="rounded-[14px] border border-white/[0.06] bg-white/[0.02] overflow-hidden">
              {liveEvents.slice(-4).reverse().map((e, i) => {
                const evtColor: Record<AntLiveEvent['type'], string> = {
                  action: 'text-blue-400', screenshot: 'text-cyan-400', step: 'text-emerald-400',
                  error: 'text-red-400', approval: 'text-amber-400', memory: 'text-violet-400',
                };
                return (
                  <div key={e.id} className={`flex items-center gap-3 px-3 py-2 ${i < 3 ? 'border-b border-white/[0.04]' : ''}`}>
                    <span className="text-sm shrink-0">{e.icon}</span>
                    <span className={`text-[10px] flex-1 ${evtColor[e.type]}`}>{e.message}</span>
                    <span className="text-[9px] text-white/20 shrink-0">{e.time}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Capabilities grid */}
          <div className="mx-auto mb-14 hidden max-w-4xl px-4">
            <p className="mb-5 text-center text-[10px] font-semibold uppercase tracking-widest text-white/20">Capabilities</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {ANT_CAPABILITIES.map((cap) => (
                <div key={cap.id} className="group rounded-[18px] border border-white/[0.07] bg-white/[0.03] p-4 transition hover:bg-white/[0.05] hover:border-white/[0.12]">
                  <div className="mb-2.5 flex items-center gap-2">
                    <span className="text-xl">{cap.icon}</span>
                    <span className="font-heading text-xs font-bold text-white/80">{cap.title}</span>
                  </div>
                  <p className="mb-3 text-[11px] leading-relaxed text-white/40">{cap.description}</p>
                  <div className="flex flex-col gap-1">
                    {cap.examples.map((ex) => (
                      <button key={ex} onClick={() => submitPrompt(ex)}
                        className="rounded-lg bg-white/[0.04] px-2 py-1 text-left text-[10px] text-white/35 transition hover:bg-white/[0.08] hover:text-white/65">
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════ CHAT VIEW ════════════════════════════════════════════════
  const riskLabel: Record<AntRiskLevel, string> = {
    Safe: 'text-emerald-400', Moderate: 'text-amber-400',
    Sensitive: 'text-orange-400', 'High Risk': 'text-red-400',
  };
  const antActionTypeBadge: Record<AntActionType, string> = {
    FILE_OPS: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
    SYSTEM_OPS: 'border-purple-500/20 bg-purple-500/10 text-purple-400',
    COMMUNICATION: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
    DATA_ANALYSIS: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-400',
    AUTOMATION: 'border-violet-500/20 bg-violet-500/10 text-violet-400',
    SEARCH: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-400',
    ORGANIZATION: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
  };
  const rightTabs: Array<{ id: typeof rightPanel; label: string; badge?: number }> = [
    { id: 'tasks', label: 'Tasks' },
    { id: 'suggestions', label: 'Tips', badge: suggestions.filter(s => !s.dismissed && !s.applied).length },
    { id: 'patterns', label: 'Patterns' },
    { id: 'knowledge', label: 'Knowledge' },
    { id: 'activity', label: 'Ledger' },
    { id: 'tools', label: 'Tools' },
    { id: 'permissions', label: 'Perms' },
    { id: 'delivery', label: 'Delivery' },
    { id: 'devices', label: 'Devices' },
    { id: 'workspace', label: 'Apps' },
    { id: 'memory', label: 'Memory' },
  ];

  return (
    <div className="flex h-full flex-col bg-[#070B14] text-white/90">
      {topbar}
      {contextDrawers}
      {graphOpen && <AIAntWorkspaceGraph onClose={() => setGraphOpen(false)} />}
      {notifOpen && <AIAntNotificationDrawer notifications={notifications} onClose={() => setNotifOpen(false)}
        onMarkRead={id => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
        onAction={(nid, label) => {
          setNotifOpen(false);
          setNotifications(prev => prev.map(n => n.id === nid ? { ...n, read: true } : n));
          if (label === 'Approve') { setApproval(null); }
        }} />}
      {autonomySelectorOpen && (
        <AIAntAutonomySelector mode={mode} setMode={setMode} onClose={() => setAutonomySelectorOpen(false)} />
      )}
      {liveConsoleOpen && (
        <AIAntLiveConsole events={liveEvents} onClose={() => setLiveConsoleOpen(false)}
          paused={consolePaused} onTogglePause={() => setConsolePaused(p => !p)} />
      )}
      {routingModelSettingsOpen && routingDecision && (
        <ModelPickerModal
          title={routingDecision.selectedAgents[0]?.name ?? 'AI Ant Routing'}
          skill={(routingDecision.selectedAgents[0]?.skills ?? skillsForCapabilities(routingDecision.requiredCapabilities))[0] ?? createAgentSkill('text_reasoning')}
          activeModel={routingDecision.selectedAgents[0]?.activeModel}
          onClose={() => setRoutingModelSettingsOpen(false)}
          onSave={(nextSkill, activeModel) => {
            setRoutingDecision((prev) => prev ? {
              ...prev,
              selectedAgents: prev.selectedAgents.map((agent, index) => index === 0 ? { ...agent, skills: agent.skills.map((skill) => skill.id === nextSkill.id ? nextSkill : skill), activeModel } : agent),
              modelRoutes: prev.modelRoutes.map((route) => route.capability === nextSkill.capability ? resolveModelForCapability(nextSkill.capability, activeModel) : route),
            } : prev);
            setRoutingModelSettingsOpen(false);
          }}
        />
      )}
      {voiceBarVisible && (
        <AIAntVoiceBar state={voiceState} transcript={voiceTranscript}
          onClose={() => { setVoiceBarVisible(false); setVoiceActive(false); setVoiceState('idle'); }} />
      )}
      {handoff && (
        <AIAntHandoffBanner
          handoff={handoff}
          onContinue={() => {
            setHandoff(null);
            setMessages(prev => [...prev, {
              id: `aa-${Date.now()}`, role: 'ant',
              text: `📲 Continuing task from ${handoff.fromDevice}: "${handoff.taskTitle}". Resuming from ${handoff.progress}% progress.`,
              timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
              confidence: 0.91, confidenceLevel: 'verified', riskLevel: 'Safe', domain: 'general',
            }]);
          }}
          onDismiss={() => setHandoff(null)}
        />
      )}
      <div className="flex min-h-0 flex-1">

        {/* Left sidebar */}
        <div className="hidden w-48 shrink-0 flex-col border-r border-white/[0.06] bg-[#060810]">
          <div className="border-b border-white/[0.05] px-4 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/25">Connected Devices</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <AIAntDevicePanel devices={devices} />
          </div>
          <div className="border-t border-white/[0.05] p-3">
            <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-white/25">Learned Patterns</p>
            {memories.slice(0, 3).map((m) => (
              <div key={m.id} className="mb-1.5 rounded-[8px] px-1.5 py-1">
                <div className="text-[10px] font-medium leading-tight text-white/50">{m.pattern}</div>
                <div className="text-[9px] text-white/25">Used {m.uses}×</div>
              </div>
            ))}
          </div>
        </div>

        {/* Center — chat pane. Uses remaining space; at ≥1400px it docks
            (margin reserves the panel width), below that the panel overlays. */}
        <div
          className="flex min-w-0 flex-1 flex-col overflow-hidden transition-[margin] duration-300 min-[1400px]:mr-[var(--crew-w)]"
          style={{ ['--crew-w' as string]: crew && crewPanelOpen ? 'clamp(420px,32vw,520px)' : '0px' } as React.CSSProperties}
        >
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[960px] space-y-4 px-5 py-5">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-[0_0_24px_rgba(124,92,252,0.3)]">
                  <img src="/assets/logos/ai ant black (2).png" width={28} height={28} alt="AI Ant" draggable={false} />
                </div>
                <p className="text-sm text-white/30">AI Ant is ready. Ask anything.</p>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[82%] flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {msg.role === 'ant' && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-white">
                        <img src="/assets/logos/ai ant black (2).png" width={12} height={12} alt="" draggable={false} />
                      </div>
                      <span className="font-heading text-[11px] font-bold text-white/80">AI Ant</span>
                      {msg.confidenceLevel && msg.confidence !== undefined && (
                        <AIAntConfidenceBadge level={msg.confidenceLevel} score={msg.confidence} />
                      )}
                      {msg.actionType && (
                        <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${antActionTypeBadge[msg.actionType]}`}>
                          {msg.actionType.replace('_', ' ')}
                        </span>
                      )}
                      {msg.riskLevel && msg.riskLevel !== 'Safe' && (
                        <span className={`text-[10px] font-semibold ${riskLabel[msg.riskLevel]}`}>· {msg.riskLevel}</span>
                      )}
                      {msg.domain && msg.domain !== 'general' && (
                        <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold bg-white/[0.06] text-white/35 capitalize">{msg.domain}</span>
                      )}
                    </div>
                  )}
                  {msg.systemNote && (
                    <div className="flex items-center gap-1.5 rounded-[8px] border border-amber-500/20 bg-amber-500/[0.07] px-2.5 py-1.5 text-[10px] text-amber-300">
                      <Zap size={10} className="shrink-0 text-amber-400" /><span>{msg.systemNote}</span>
                    </div>
                  )}
                  <div className={`rounded-[20px] px-4 py-3.5 text-sm leading-7 whitespace-pre-line shadow-[0_8px_30px_rgba(0,0,0,0.12)] ${msg.role === 'user'
                    ? 'border border-violet-400/20 bg-[linear-gradient(180deg,rgba(124,58,237,0.24),rgba(88,28,135,0.18))] text-white/92'
                    : 'border border-white/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.025))] text-white/82'}`}>
                    {msg.role === 'ant' && msg.text ? <BlurText text={msg.text} delay={30} animateBy="words" direction="top" /> : msg.text}
                  </div>
                  {msg.workflowProposal && (
                    <WorkflowProposalCard
                      proposal={msg.workflowProposal}
                      onOpen={() => openWorkflowBuilder(msg.workflowProposal!)}
                      onRunTest={() => runWorkflowTest(msg.workflowProposal)}
                      onCancel={() => setMessages((prev) => prev.filter((item) => item.id !== msg.id))}
                    />
                  )}
                  {msg.requiresCorrection && correctionMsgId === msg.id && msg.correctionFields && (
                    <div className="w-full">
                      <AIAntCorrectionPanel
                        fields={msg.correctionFields}
                        onSave={(updated) => {
                          setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, correctionFields: updated, requiresCorrection: false } : m));
                          setCorrectionMsgId(null);
                          setMessages((prev) => [...prev, {
                            id: `aa-${Date.now()}`, role: 'ant',
                            text: `✅ Values confirmed and saved to memory. AI Ant will use these corrections for future extractions.`,
                            timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
                            riskLevel: 'Safe', domain: 'general', confidence: 0.99, confidenceLevel: 'verified',
                          }]);
                          setMemories((prev) => [...prev, { id: `am-${Date.now()}`, pattern: 'User-corrected extraction values', description: 'Corrections applied to extracted fields — pattern saved.', confidence: 0.99, uses: 1, domain: msg.domain ?? 'general' }]);
                        }}
                        onDismiss={() => setCorrectionMsgId(null)}
                      />
                    </div>
                  )}
                  {msg.requiresCorrection && correctionMsgId !== msg.id && (
                    <button onClick={() => setCorrectionMsgId(msg.id)}
                      className="flex items-center gap-1.5 rounded-[8px] border border-amber-500/20 bg-amber-500/[0.06] px-2.5 py-1.5 text-[10px] text-amber-400 transition hover:bg-amber-500/[0.12]">
                      <span>✏️</span><span>Review extracted values</span>
                    </button>
                  )}
                  {msg.plan && (
                    <div className="w-full flex flex-col gap-2">
                      <AntPlanCard
                        plan={msg.plan}
                        onConfirm={() => confirmPlan(msg.plan!, msg.id)}
                        onCancel={() => cancelPlan(msg.id)}
                      />
                      {msg.plan.status === 'preview' && (
                        <AIAntSandboxPanel plan={msg.plan} />
                      )}
                    </div>
                  )}
                  {msg.fileCards && msg.fileCards.length > 0 && (
                    <div className="flex w-full flex-col gap-2">
                      {msg.fileCards.map((fc) => <AIAntFileCard key={fc.id} file={fc} onAction={handleAction} />)}
                    </div>
                  )}
                  {msg.actions && msg.role === 'ant' && (
                    <div className="flex flex-wrap gap-1.5">
                      {msg.actions.map((act) => (
                        <button key={act.label} onClick={() => handleAction(act.label)}
                          className="flex items-center gap-1.5 rounded-full border border-white/[0.09] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/55 transition hover:border-white/[0.16] hover:bg-white/[0.07] hover:text-white/80">
                          <span>{act.icon}</span><span>{act.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {msg.role === 'ant' && (
                    <AntAssistantMessageActions
                      feedback={messageFeedback[msg.id]}
                      copied={copiedMessageId === msg.id}
                      onFeedback={(value) => handleAssistantFeedback(msg.id, value)}
                      onRegenerate={() => handleAssistantRegenerate(msg.id)}
                      onCopy={() => handleAssistantCopy(msg.id, msg.text)}
                    />
                  )}
                  <span className="text-[10px] text-white/20">{msg.timestamp}</span>
                </div>
              </div>
            ))}
            {routingDecision && !(orchMode === 'agent-running' && (matchedAgents.length > 0 || orchAgents.length > 0)) && (
              <div className="flex justify-start">
                <AIRoutingCard
                  routing={routingDecision}
                  onStart={() => {
                    if (teamProposal) startGeneratedProject(teamProposal);
                    else setMessages((prev) => [...prev, {
                      id: `aa-${Date.now()}-routing-start`, role: 'ant',
                      text: 'Starting with this routing plan. I will keep skills, models, approvals, and deliverables visible as work progresses.',
                      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
                      confidence: routingDecision.confidence, confidenceLevel: 'verified', riskLevel: 'Safe', domain: 'general',
                    }]);
                  }}
                  onCustomize={() => setRoutingModelSettingsOpen(true)}
                  onCheaper={() => setRoutingDecision((prev) => prev ? { ...prev, modelRoutes: prev.modelRoutes.map((route) => ({ ...route, costTier: 'low', qualityTier: route.qualityTier === 'high' ? 'standard' : route.qualityTier })) } : prev)}
                  onQuality={() => setRoutingDecision((prev) => prev ? { ...prev, modelRoutes: prev.modelRoutes.map((route) => ({ ...route, qualityTier: 'high', costTier: route.costTier === 'low' ? 'standard' : route.costTier })) } : prev)}
                  onChangeMode={() => setRoutingDecision(null)}
                  onDismiss={() => setRoutingDecision(null)}
                />
              </div>
            )}
            {!(orchMode === 'agent-running' && (matchedAgents.length > 0 || orchAgents.length > 0)) && projectIntent && (
              <div className="flex justify-start">
                <ProjectIntentCard
                  project={projectIntent}
                  onCreate={() => {
                    setProjectIntent((prev) => prev ? { ...prev, status: 'planning' } : prev);
                    setMessages((prev) => [...prev, {
                      id: `aa-${Date.now()}`, role: 'ant',
                      text: `Project created as a draft: ${projectIntent.name}. I’ll keep goals, sources, agents, workflows, approvals, and deliverables connected here.`,
                      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
                      confidence: 0.95, confidenceLevel: 'verified', riskLevel: 'Safe', domain: 'general',
                    }]);
                  }}
                  onBuildTeam={() => {
                    const proposal = buildAntTeamProposal(projectIntent.goal, 'ai-team');
                    setTeamProposal(proposal);
                    startAutoMatch(projectIntent.goal);
                  }}
                />
              </div>
            )}
            {bridgeSetupCard && (
              <div className="flex justify-start">
                <BridgeSetupCard
                  data={bridgeSetupCard}
                  onApprove={() => {
                    const text = bridgeSetupCard.taskText;
                    setBridgeSetupCard((prev) => prev ? { ...prev, status: 'approved' } : prev);
                    onLaunchBridgeSession(text, bridgeSetupCard.sourceConversationId);
                  }}
                  onCancel={() => setBridgeSetupCard(null)}
                />
              </div>
            )}
            {!(orchMode === 'agent-running' && (matchedAgents.length > 0 || orchAgents.length > 0)) && colonyDeliverables.slice(0, 2).map((deliverable) => (
              <div key={deliverable.id} className="flex justify-start">
                <DeliverablePreviewCard
                  deliverable={deliverable}
                  onApprove={() => setColonyDeliverables((prev) => prev.map((item) => item.id === deliverable.id ? { ...item, status: 'approved', approvalStatus: 'approved' } : item))}
                />
              </div>
            ))}
            {!(orchMode === 'agent-running' && (matchedAgents.length > 0 || orchAgents.length > 0)) && teamProposal && (
              <div className="flex justify-start">
                <AITeamProposalCard
                  proposal={teamProposal}
                  advancedOpen={proposalAdvancedOpen}
                  onToggleAdvanced={() => setProposalAdvancedOpen((open) => !open)}
                  onStart={() => startGeneratedProject(teamProposal)}
                  onCustomize={() => setProposalAdvancedOpen(true)}
                  onSimpler={() => {
                    setTeamProposal(null);
                    setMessages((prev) => [...prev, {
                      id: `aa-${Date.now()}`, role: 'ant',
                      text: 'Got it. I will handle this with AI Ant only and keep the project lightweight. If the work grows, I can propose a team later.',
                      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
                      confidence: 0.88, confidenceLevel: 'verified', riskLevel: 'Safe', domain: 'general',
                    }]);
                  }}
                />
              </div>
            )}
            {orchMode === 'agent-running' && (matchedAgents.length > 0 || orchAgents.length > 0) && (
              <div className="flex justify-start">
                <ColonyCrewCard
                  agents={matchedAgents.length > 0 ? matchedAgents : orchAgents.map((a, i) => ({
                    id: a.id, name: a.name, role: a.role,
                    avatarInitial: a.name[0],
                    avatarColor: (['green', 'amber', 'blue', 'purple'] as AgentAvatarColor[])[i % 4],
                    status: a.status === 'idle' ? 'queued' : a.status as MatchedAgent['status'],
                    currentTask: a.currentTask,
                    matchedBy: 'user' as const,
                  }))}
                  matchReason={matchReason || `${orchAgents.length} agents running`}
                  swarmState={swarmState}
                  onOpenWorkspace={() => {
                    if (!activeCrewRun) setActiveCrewRun(buildDefaultCrewRun(orchTask || prompt || 'Colony Crew task'));
                    setView('crew');
                  }}
                  onStopAll={stopOrchestration}
                />
              </div>
            )}
            {thinking && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2.5 rounded-[18px] border border-white/[0.08] bg-white/[0.04] px-4 py-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-white">
                    <img src="/assets/logos/ai ant black (2).png" width={12} height={12} alt="" draggable={false} />
                  </div>
                  <span className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/[0.25]"
                        style={{ animationDelay: `${i * 140}ms` }} />
                    ))}
                  </span>
                  <span className="text-xs text-white/35">AI Ant is thinking…</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
            </div>
          </div>
          <div className="shrink-0 bg-transparent px-4 pb-5 pt-3">
            <div className="mx-auto w-full max-w-3xl">
              <AntPromptInput prompt={prompt} onChange={setAntPrompt} onSubmit={submitPrompt} voiceActive={voiceActive} onToggleVoice={toggleVoice} agentMode={agentInputMode} setAgentMode={setAgentInputMode} modelRoutingPreference={modelRoutingPreference} setModelRoutingPreference={setModelRoutingPreference} manualModelSelection={manualModelSelection} setManualModelSelection={setManualModelSelection} />
            </div>
            {voiceActive && (
              <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-violet-400 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-violet-500" /><span>Listening…</span>
              </div>
            )}
          </div>
        </div>

        {activeEnterpriseProject && (
          <EnterpriseOrgPreviewPanel
            project={activeEnterpriseProject}
            onOpenWorkspace={() => setView('project')}
          />
        )}

        {/* Agent right panel — only during agent-running mode */}
        {enterpriseOpen && (
          <BossIntake
            onClose={() => setEnterpriseOpen(false)}
            onStart={(ents, projectTitle) => {
              const goal = projectTitle || `Operate a ${ents.length}-agent one-man enterprise`;
              setEnterpriseOpen(false);
              setOrchMode('agent-running');
              setMatchedAgents([]);
              setOrchAgents([]);
              setView('chat');
              setMessages((prev) => [...prev, {
                id: `aa-${Date.now()}-enterprise-start`, role: 'ant',
                text: `Building "${goal}" — assembling ${ents.length} AI agents, assigning roles, and preparing the workspace.`,
                timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
                confidence: 0.94, confidenceLevel: 'verified', riskLevel: 'Safe', domain: 'general',
                actionType: 'ORGANIZATION',
              }]);
      launchEnterpriseSetup(goal, ents, {
        sourceConversationId: sourceConversationForFeature(activeChat),
        replaceChatId: isEmptyDraftStandaloneChat(activeChat) ? activeChat!.id : undefined,
      });
            }}
          />
        )}
        <AnimatePresence>
          {enterpriseSetup && (
            <EnterpriseSetupPanel
              setup={enterpriseSetup}
              onOpenWorkspace={openEnterpriseWorkspace}
              onCancel={() => {
                clearEnterpriseTimers();
                setEnterpriseSetup(null);
              }}
            />
          )}
        </AnimatePresence>
        {false && orchMode === 'agent-running' && showAgentPanel && (
          <AgentRightPanel
            agents={matchedAgents.length > 0 ? matchedAgents : orchAgents.map((a, i) => ({
              id: a.id, name: a.name, role: a.role,
              avatarInitial: a.name[0],
              avatarColor: (['green', 'amber', 'blue', 'purple'] as AgentAvatarColor[])[i % 4],
              status: a.status === 'idle' ? 'queued' : a.status as MatchedAgent['status'],
              currentTask: a.currentTask,
              matchedBy: 'user' as const,
            }))}
            matchReason={matchReason || `${orchAgents.length} agents running`}
            onStopAll={stopOrchestration}
            onToggleGraphView={() => setOrchView(v => v === 'graph' ? 'chat' : 'graph')}
            orchView={orchView}
          />
        )}

        {/* Colony Crew slide-in panel + reopen pill */}
        <AnimatePresence>
          {crew && crewPanelOpen && (
            <motion.div
              key="colony-crew-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setCrewPanelOpen(false)}
              className="fixed inset-0 top-[56px] z-[55] bg-black/45 backdrop-blur-[1px] min-[1400px]:hidden"
            />
          )}
          {crew && crewPanelOpen && (
            <ColonyCrewPanel
              key="colony-crew-panel"
              crew={crew}
              selectedAgentId={crewSelectedAgentId}
              onSelectAgent={setCrewSelectedAgentId}
              onClose={() => setCrewPanelOpen(false)}
              onStop={stopColonyCrew}
              onSend={sendCrewControl}
              onPause={pauseColonyCrew}
              onResume={resumeColonyCrew}
            />
          )}
          {crew && !crewPanelOpen && (
            <ColonyCrewReopenPill key="colony-crew-pill" phase={crew.phase} onClick={() => setCrewPanelOpen(true)} />
          )}
        </AnimatePresence>

        {/* Right panel — shown when NOT in agent-running mode */}
        {orchMode !== 'agent-running' && (
        <div className="hidden w-[280px] shrink-0 flex-col border-l border-white/[0.06] bg-[#060810]">
          <div className="flex shrink-0 overflow-x-auto border-b border-white/[0.05]">
            {rightTabs.map((tab) => (
              <button key={tab.id} onClick={() => setRightPanel(tab.id)}
                className={`relative shrink-0 px-2.5 py-2.5 text-[9px] font-bold uppercase tracking-wider transition ${rightPanel === tab.id ? 'border-b-2 border-violet-500 text-white/80' : 'text-white/25 hover:text-white/50'}`}>
                {tab.label}
                {tab.badge != null && tab.badge > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-violet-500 text-[7px] font-bold text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {rightPanel === 'tasks' && (
              <>
                <AIAntTaskPanel tasks={tasks} />
                {failedTask && (
                  <div className="mt-3">
                    <AIAntRecoveryCard
                      taskTitle={failedTask}
                      onAction={(type) => {
                        setFailedTask(null);
                        const replies: Record<AntRecoverySuggestion['type'], string> = {
                          retry: '🔄 Retrying failed step with same tool…',
                          rollback: '↩ Rolling back all changes from this execution…',
                          'switch-tool': '🔀 Switching to alternative strategy…',
                          'ask-user': '🙋 I need your help to proceed. What would you like to do differently?',
                        };
                        setMessages(prev => [...prev, {
                          id: `aa-${Date.now()}`, role: 'ant', text: replies[type],
                          timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
                          confidence: 0.85, confidenceLevel: 'verified', riskLevel: 'Safe', domain: 'general',
                        }]);
                      }}
                    />
                  </div>
                )}
              </>
            )}
            {rightPanel === 'activity' && <AIAntActivityLog logs={logs} />}
            {rightPanel === 'suggestions' && (
              <AIAntSmartSuggestions
                suggestions={suggestions}
                onApply={id => {
                  setSuggestions(prev => prev.map(s => s.id === id ? { ...s, applied: true } : s));
                  setMessages(prev => [...prev, {
                    id: `aa-${Date.now()}`, role: 'ant',
                    text: `✅ Suggestion applied: "${suggestions.find(s => s.id === id)?.title}". Configuration saved to memory.`,
                    timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
                    confidence: 0.95, confidenceLevel: 'verified', riskLevel: 'Safe', domain: 'general',
                  }]);
                }}
                onDismiss={id => setSuggestions(prev => prev.map(s => s.id === id ? { ...s, dismissed: true } : s))}
              />
            )}
            {rightPanel === 'patterns' && (
              <AIAntLearnedPatterns
                patterns={learnedPatterns}
                onToggle={id => setLearnedPatterns(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p))}
                onRemove={id => setLearnedPatterns(prev => prev.filter(p => p.id !== id))}
              />
            )}
            {rightPanel === 'knowledge' && (
              <AIAntKnowledgeBase
                entries={knowledge}
                onPin={id => setKnowledge(prev => prev.map(e => e.id === id ? { ...e, pinned: !e.pinned } : e))}
                onDelete={id => setKnowledge(prev => prev.map(e => e.id === id ? { ...e, archived: true } : e))}
              />
            )}
            {rightPanel === 'tools' && <AIAntToolRouterPanel tools={ANT_TOOLS} />}
            {rightPanel === 'permissions' && (
              <AIAntPermissionManager
                permissions={permissions}
                onToggle={(id) => setPermissions(prev => prev.map(p => p.id === id ? { ...p, granted: !p.granted } : p))}
              />
            )}
            {rightPanel === 'delivery' && (
              <AIAntDeliveryPanel
                deliveries={deliveries}
                onApprove={(id) => {
                  setDeliveries(prev => prev.map(d => d.id === id ? { ...d, status: 'sent', deliveredAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) } : d));
                  setLiveEvents(prev => [...prev, { id: `le-${Date.now()}`, time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }), type: 'step', message: 'File delivery approved and sent', device: 'System', icon: '📤' }]);
                }}
                onRetry={(id) => setDeliveries(prev => prev.map(d => d.id === id ? { ...d, status: 'pending' } : d))}
              />
            )}
            {rightPanel === 'devices' && <AIAntDevicePanel devices={devices} />}
            {rightPanel === 'workspace' && <AIAntWorkspacePanel workspaces={workspaces} />}
            {rightPanel === 'memory' && (
              <div className="flex flex-col gap-2">
                {memories.map((m) => (
                  <div key={m.id} className="rounded-[12px] border border-white/[0.07] bg-white/[0.04] p-3">
                    <div className="mb-0.5 flex items-start justify-between gap-2">
                      <div className="text-[11px] font-semibold text-white/80">{m.pattern}</div>
                      <span className="shrink-0 text-[9px] text-violet-400/70 capitalize">{m.domain}</span>
                    </div>
                    <div className="mb-2 text-[10px] leading-snug text-white/40">{m.description}</div>
                    <div className="flex items-center justify-between text-[10px] text-white/25">
                      <span>{Math.round(m.confidence * 100)}% confidence</span>
                      <span>Used {m.uses}×</span>
                    </div>
                  </div>
                ))}
                <button onClick={() => setMemories((prev) => [...prev, { id: `am-${Date.now()}`, pattern: 'New pattern from correction', description: 'AI Ant updated its workspace understanding from your recent feedback.', confidence: 0.72, uses: 1, domain: 'general' }])}
                  className="mt-1 rounded-[10px] border border-dashed border-white/[0.10] py-2 text-center text-[11px] text-white/30 transition hover:border-white/[0.20] hover:text-white/55">
                  + Teach AI Ant a rule
                </button>
              </div>
            )}
          </div>
          <div className="shrink-0 border-t border-white/[0.05] p-3">
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'Done', val: tasks.filter((t) => t.status === 'completed').length },
                { label: 'Active', val: tasks.filter((t) => t.status === 'analyzing' || t.status === 'reading').length },
                { label: 'Online', val: devices.filter((d) => d.online).length },
                { label: 'Pending', val: deliveries.filter((d) => d.status === 'pending').length },
              ].map((s) => (
                <div key={s.label} className="rounded-[10px] border border-white/[0.06] bg-white/[0.04] p-2 text-center">
                  <div className="text-sm font-bold text-white/80">{s.val}</div>
                  <div className="text-[9px] text-white/25">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        )}
      </div>

      {/* More menu dropdown (fixed-positioned, escapes overflow) */}
      {moreMenuOpen && (
        <>
          <div className="fixed inset-0 z-[198]" onClick={() => setMoreMenuOpen(false)} />
          <div className="fixed z-[199] w-[200px] overflow-hidden rounded-[10px] border py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
            style={{ top: moreMenuPos.top, left: moreMenuPos.left, background: '#161618', borderColor: 'rgba(255,255,255,0.12)', animation: 'fadeInUp 180ms cubic-bezier(0.16,1,0.3,1)' }}>
            {([
              { id: 'devices',     label: 'Devices', badge: `${devices.filter(d => d.online).length} online`, badgeColor: 'text-[#4ecca0] bg-[#4ecca0]/10 border-[#4ecca0]/20' },
              { id: 'tasks',       label: 'Tasks',   badge: String(tasks.filter(t => t.status === 'analyzing' || t.status === 'reading').length || ''), badgeColor: 'text-[#f0c060] bg-[#f0c060]/10 border-[#f0c060]/20' },
              { id: 'colony',      label: 'Colony',  badge: '', badgeColor: '' },
              { id: 'workflows',   label: 'Flows',   badge: workflows.filter(w => w.status === 'running').length > 0 ? `${workflows.filter(w => w.status === 'running').length} running` : '', badgeColor: 'text-[#7eb5ff] bg-[#7eb5ff]/10 border-[#7eb5ff]/20' },
              { id: 'suggestions', label: 'Tips',    badge: String(suggestions.filter(s => !s.dismissed && !s.applied).length || ''), badgeColor: 'text-white/40 bg-white/[0.07] border-white/15' },
              { id: 'team',        label: 'AI Team', badge: '', badgeColor: '' },
            ] as Array<{ id: typeof moreSheetTab; label: string; badge: string; badgeColor: string }>).map(item => (
              <button key={item.id}
                onClick={() => { setMoreSheetTab(item.id); setMoreSheetOpen(true); setMoreMenuOpen(false); }}
                className="flex w-full items-center gap-2.5 rounded-[7px] mx-0.5 px-2.5 py-[7px] text-[12px] text-white/55 transition hover:bg-white/[0.07] hover:text-white/85">
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${item.badgeColor}`}>{item.badge}</span>}
              </button>
            ))}
            <div className="mx-2 my-1 h-px bg-white/[0.07]" />
            <button onClick={() => { setGraphOpen(true); setMoreMenuOpen(false); }}
              className="flex w-full items-center gap-2.5 rounded-[7px] mx-0.5 px-2.5 py-[7px] text-[12px] text-white/55 transition hover:bg-white/[0.07] hover:text-white/85">
              <Network size={12} className="text-white/35" />
              <span className="flex-1 text-left">Workspace Graph</span>
            </button>
            <button onClick={() => { setLiveConsoleOpen(p => !p); setMoreMenuOpen(false); }}
              className="flex w-full items-center gap-2.5 rounded-[7px] mx-0.5 px-2.5 py-[7px] text-[12px] text-white/55 transition hover:bg-white/[0.07] hover:text-white/85">
              <Activity size={12} className={liveConsoleOpen ? 'text-emerald-400' : 'text-white/35'} />
              <span className="flex-1 text-left">Live Console</span>
              {liveConsoleOpen && <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400">On</span>}
            </button>
            {safetyMode && (
              <div className="flex w-full items-center gap-2.5 mx-0.5 px-2.5 py-[7px] text-[12px]">
                <ShieldCheck size={12} className="text-emerald-400" />
                <span className="flex-1 text-left text-emerald-400">Safety Mode</span>
                <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400">ON</span>
              </div>
            )}
            <div className="flex w-full items-center gap-2.5 mx-0.5 px-2.5 py-[7px] text-[12px] text-white/35">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="flex-1 text-left">{devices.filter((d) => d.online).length} device{devices.filter((d) => d.online).length !== 1 ? 's' : ''} online</span>
            </div>
          </div>
        </>
      )}

      {/* More content sheet (320px right overlay) */}
      {moreSheetOpen && (
        <>
          <div className="fixed inset-0 z-[218] bg-black/40 orch-backdrop" onClick={() => setMoreSheetOpen(false)} style={{ backdropFilter: 'blur(3px)' }} />
          <div className="fixed right-0 top-0 bottom-0 z-[219] flex w-[320px] flex-col border-l border-white/[0.09] shadow-2xl"
            style={{ background: '#111520', animation: 'slideInRight 260ms cubic-bezier(0.16,1,0.3,1)' }}>
            <div className="flex shrink-0 items-center justify-between border-b border-white/[0.07] px-4 py-3">
              <span className="text-[13px] font-bold capitalize text-white/85">
                {moreSheetTab === 'suggestions' ? 'Tips' : moreSheetTab === 'workflows' ? 'Flows' : moreSheetTab}
              </span>
              <button onClick={() => setMoreSheetOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-white/35 transition hover:bg-white/[0.08] hover:text-white/70">
                <X size={15} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {moreSheetTab === 'tasks' && (
                <div className="flex flex-col gap-2">
                  {tasks.slice(0, 12).map(task => (
                    <div key={task.id} className="rounded-[10px] border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                      <div className="flex items-start gap-2">
                        <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${task.status === 'completed' ? 'bg-[#4ecca0]' : task.status === 'analyzing' || task.status === 'reading' ? 'animate-pulse bg-[#7eb5ff]' : 'bg-white/20'}`} />
                        <div className="min-w-0">
                          <p className="text-[12px] text-white/80">{task.title}</p>
                          <p className="mt-0.5 text-[10px] capitalize text-white/35">{task.status} · {task.device}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {tasks.length === 0 && <p className="py-8 text-center text-[12px] text-white/25">No tasks yet</p>}
                </div>
              )}
              {moreSheetTab === 'workflows' && (
                <AIAntWorkflowPanel workflows={workflows}
                  onTrigger={id => setWorkflows(prev => prev.map(w => w.id === id ? { ...w, status: 'running', progress: Math.max(w.progress, 8), lastRun: 'Now' } : w))}
                  onCreate={() => { setMoreSheetOpen(false); setView('chat'); }} />
              )}
              {moreSheetTab === 'colony' && <AIAntColonyPanel session={colonySession} />}
              {moreSheetTab === 'suggestions' && (
                <div className="flex flex-col gap-2">
                  {suggestions.filter(s => !s.dismissed).slice(0, 8).map(s => (
                    <div key={s.id} className="rounded-[10px] border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                      <p className="text-[12px] font-semibold text-white/80">{s.title}</p>
                      <p className="mt-1 text-[11px] text-white/40">{s.explanation}</p>
                      <div className="mt-2 flex gap-1.5">
                        <button onClick={() => setSuggestions(prev => prev.map(x => x.id === s.id ? { ...x, applied: true } : x))}
                          className="rounded-lg bg-[#3b82f6]/15 px-2.5 py-1 text-[10px] font-semibold text-[#7eb5ff] transition hover:bg-[#3b82f6]/25">{s.action}</button>
                        <button onClick={() => setSuggestions(prev => prev.map(x => x.id === s.id ? { ...x, dismissed: true } : x))}
                          className="rounded-lg px-2.5 py-1 text-[10px] text-white/30 transition hover:text-white/55">Dismiss</button>
                      </div>
                    </div>
                  ))}
                  {suggestions.filter(s => !s.dismissed).length === 0 && <p className="py-8 text-center text-[12px] text-white/25">No tips</p>}
                </div>
              )}
              {moreSheetTab === 'devices' && <AIAntDevicePanel devices={devices} />}
              {moreSheetTab === 'team' && (
                <div className="flex flex-col gap-2">
                  {teamMembers.map(m => (
                    <div key={m.id} className="flex items-center gap-3 rounded-[10px] border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
                        style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>{m.name[0]}</div>
                      <div>
                        <p className="text-[12px] font-semibold text-white/80">{m.name}</p>
                        <p className="text-[10px] text-white/35">{m.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {approval && (
        <AIAntApprovalModal
          approval={approval}
          onApprove={() => {
            setApproval(null);
            setMessages((prev) => [...prev, {
              id: `aa-${Date.now()}`, role: 'ant',
              text: `✅ Approved. Executing "${approval.action}" now. I'll notify you when complete.`,
              timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
              confidence: approval.confidence, confidenceLevel: 'verified', riskLevel: 'Safe', domain: 'general',
            }]);
            setLogs((prev) => prev.map((l, i) => i === prev.length - 1 ? { ...l, approvalStatus: 'approved' } : l));
            setTasks((prev) => prev.map((t) => t.status === 'waiting-approval' ? { ...t, status: 'completed', progress: 100 } : t));
          }}
          onEdit={() => { setApproval(null); setAntPrompt(`Edit: ${approval.action}`); }}
          onReject={() => {
            setApproval(null);
            setMessages((prev) => [...prev, {
              id: `aa-${Date.now()}`, role: 'ant',
              text: `✕ Rejected. Cancelled "${approval.action}". Let me know if you'd like a different approach.`,
              timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
              riskLevel: 'Safe', domain: 'general', confidence: 1, confidenceLevel: 'verified',
            }]);
            setLogs((prev) => prev.map((l, i) => i === prev.length - 1 ? { ...l, approvalStatus: 'rejected' } : l));
            setTasks((prev) => prev.map((t) => t.status === 'waiting-approval' ? { ...t, status: 'failed' } : t));
          }}
        />
      )}
    </div>
  );
}








function AppShell({ page, setPage, profile, onSignOut, onSwitchAccount }: {
  page: Page;
  setPage: (page: Page) => void;
  profile: UserProfile;
  onSignOut: () => void | Promise<void>;
  onSwitchAccount: () => void | Promise<void>;
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [drawerView, setDrawerView] = useState<AppDrawerView | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [projects, setProjects] = useState<ChatProjectDef[]>(CHAT_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState('daily-sales');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const [settingsInitialTab, setSettingsInitialTab] = useState<string | undefined>(undefined);
  const [bridgeSessions, setBridgeSessions] = useState<BridgeSession[]>(() => loadBridgeSessions());
  const [activeBridgeSessionId, setActiveBridgeSessionId] = useState<string | null>(null);
  const [activeWorkItemId, setActiveWorkItemId] = useState<string | null>(null);

  const refreshBridgeSessions = useCallback(() => {
    setBridgeSessions(loadBridgeSessions());
  }, []);

  const launchBridgeSession = useCallback((taskText: string, sourceConversationId?: string) => {
    const session = createBridgeSessionFromTask({ taskText, sourceConversationId });
    upsertBridgeSession(session);
    refreshBridgeSessions();
    setActiveBridgeSessionId(session.id);
    setActiveWorkItemId(`bridge-${session.id}`);
    setPage('Bridge');
    return session;
  }, [refreshBridgeSessions, setPage]);

  const handleBridgeSessionUpdate = useCallback((updated: BridgeSession) => {
    setBridgeSessions((prev) => {
      const without = prev.filter((s) => s.id !== updated.id);
      return [updated, ...without].sort((a, b) => b.updatedAt - a.updatedAt);
    });
  }, []);

  const openBridgeSession = useCallback((sessionId: string) => {
    setActiveBridgeSessionId(sessionId);
    setActiveWorkItemId(`bridge-${sessionId}`);
    setPage('Bridge');
  }, [setPage]);
  const [connectors, setConnectors] = useState<AppConnector[]>(INITIAL_CONNECTORS);
  const [safetyMode, setSafetyMode] = useState(true);
  const [usageState, setUsageState] = useState<UsageState>(DEFAULT_USAGE_STATE);

  // Colony workspace model — powers the ChatGPT/Kimi sidebar + AI Ant.
  const [wsProjects, setWsProjects] = useState<WorkspaceProject[]>(() => loadWorkspaceProjects());
  const [wsChats, setWsChats] = useState<WorkspaceChat[]>(() => loadWorkspaceChats());
  const [wsDeliverables] = useState<WorkspaceDeliverableItem[]>(SEED_WS_DELIVERABLES);
  const [activeWsChatId, setActiveWsChatId] = useState<string | null>(null);
  const [appDeliverables, setAppDeliverables] = useState<AppDeliverable[]>(() => loadAppDeliverables());

  const publishDeliverable = useCallback((d: AppDeliverable) => {
    setAppDeliverables((prev) => {
      const next = [d, ...prev.filter((x) => x.id !== d.id)].slice(0, 50);
      saveAppDeliverables(next);
      return next;
    });
  }, []);

  useEffect(() => {
    try { localStorage.setItem(WS_CHATS_KEY, JSON.stringify(wsChats)); } catch { /* ignore */ }
  }, [wsChats]);

  useEffect(() => {
    try { localStorage.setItem(WS_PROJECTS_KEY, JSON.stringify(wsProjects)); } catch { /* ignore */ }
  }, [wsProjects]);

  const createWsChat = (projectId: string | null = null): string => {
    const id = `wsc-${Date.now()}`;
    const now = Date.now();
    setWsChats((prev) => [
      { id, projectId, title: 'New chat', mode: 'simple_chat', messages: [], workType: 'chat', workStatus: 'draft', createdAt: now, updatedAt: now },
      ...prev,
    ]);
    setActiveWsChatId(id);
    setActiveWorkItemId(id);
    setPage('AI Ant');
    return id;
  };

  const markWsChatWork = useCallback((id: string, workType: WorkItemType, workStatus?: WorkItemStatus) => {
    setWsChats((prev) => prev.map((chat) => chat.id === id ? { ...chat, workType, workStatus, updatedAt: Date.now() } : chat));
    setActiveWorkItemId(id);
  }, []);

  const createFeatureWorkItem = useCallback((input: { type: Exclude<WorkItemType, 'chat' | 'bridge'>; title: string; status: WorkItemStatus; sourceConversationId?: string; sessionId?: string; replaceChatId?: string; enterpriseWorkspace?: EnterpriseWorkspaceProject }) => {
    const now = Date.now();
    const sessionId = input.sessionId ?? `${input.type}-${now}`;
    const id = input.replaceChatId ?? `wsc-${input.type}-${sessionId}`;
    setWsChats((prev) => {
      const withoutExisting = prev.filter((chat) => chat.id !== id && chat.sessionId !== sessionId);
      return [
        {
          id,
          projectId: null,
          title: input.title || 'Untitled work',
          mode: input.type === 'crew' ? 'ai_team_task' : input.type === 'automation' ? 'workflow_task' : 'one_man_enterprise',
          messages: [],
          workType: input.type,
          workStatus: input.status,
          sourceConversationId: input.sourceConversationId,
          sessionId,
          enterpriseWorkspace: input.enterpriseWorkspace,
          createdAt: now,
          updatedAt: now,
        },
        ...withoutExisting,
      ];
    });
    setActiveWsChatId(id);
    setActiveWorkItemId(id);
    setPage('AI Ant');
    return id;
  }, [setPage]);

  const updateWorkItem = useCallback((id: string, patch: Partial<Pick<WorkspaceChat, 'title' | 'workStatus' | 'sourceConversationId' | 'sessionId' | 'enterpriseWorkspace'>>) => {
    setWsChats((prev) => prev.map((chat) => chat.id === id ? { ...chat, ...patch, updatedAt: Date.now() } : chat));
    setActiveWorkItemId(id);
  }, []);

  const discardDraftChat = useCallback((id: string) => {
    setWsChats((prev) => prev.filter((chat) => !(chat.id === id && isEmptyDraftStandaloneChat(chat))));
    setActiveWsChatId((current) => current === id ? null : current);
    setActiveWorkItemId((current) => current === id ? null : current);
  }, []);

  const updateWsChatMessages = useCallback((id: string, messages: WorkspaceMessage[]) => {
    setWsChats((prev) => prev.map((chat) => chat.id === id ? { ...chat, messages, updatedAt: Date.now() } : chat));
  }, []);

  const autoTitleWsChat = useCallback((id: string, message: string) => {
    setWsChats((prev) => prev.map((chat) => {
      if (chat.id !== id || chat.userRenamed || chat.title !== 'New chat') return chat;
      return { ...chat, title: generateChatTitle(message), updatedAt: Date.now() };
    }));
  }, []);

  const renameWsChat = (id: string, title: string) => {
    const nextTitle = title.trim();
    if (!nextTitle) return;
    setWsChats((prev) => prev.map((chat) => chat.id === id ? { ...chat, title: nextTitle, userRenamed: true, updatedAt: Date.now() } : chat));
  };

  const togglePinWsChat = (id: string) => {
    setWsChats((prev) => prev.map((chat) => chat.id === id ? { ...chat, isPinned: !chat.isPinned, updatedAt: Date.now() } : chat));
  };

  const archiveWsChat = (id: string) => {
    setWsChats((prev) => prev.map((chat) => chat.id === id ? { ...chat, isArchived: true, updatedAt: Date.now() } : chat));
    if (activeWsChatId === id) createWsChat(null);
  };

  const deleteWsChat = (id: string) => {
    if (!window.confirm('Delete this chat? This cannot be undone.')) return;
    const nextChats = wsChats.filter((chat) => chat.id !== id);
    setWsChats(nextChats);
    if (activeWsChatId === id) {
      setActiveWsChatId(nextChats.find((chat) => !chat.isArchived)?.id ?? null);
      setPage('AI Ant');
    }
  };

  const renameWsProject = (id: string, name: string) => {
    const nextName = name.trim();
    if (!nextName) return;
    setWsProjects((prev) => prev.map((project) => project.id === id ? { ...project, name: nextName, updatedAt: Date.now() } : project));
  };

  const archiveWsProject = (id: string) => {
    setWsProjects((prev) => prev.map((project) => project.id === id ? { ...project, isArchived: true, updatedAt: Date.now() } : project));
  };

  const deleteWsProject = (id: string) => {
    if (!window.confirm('Delete this project? Chats will stay in history but leave the project.')) return;
    setWsProjects((prev) => prev.filter((project) => project.id !== id));
    setWsChats((prev) => prev.map((chat) => chat.projectId === id ? { ...chat, projectId: null } : chat));
  };

  const deleteWsProjectRaw = (id: string) => {
    setWsProjects((prev) => prev.filter((project) => project.id !== id));
    setWsChats((prev) => prev.map((chat) => chat.projectId === id ? { ...chat, projectId: null } : chat));
  };

  const createWsProject = (name: string, goal: string, description?: string, projectType?: WorkspaceProject['type']): string => {
    const id = `wsp-${Date.now()}`;
    const now = Date.now();
    setWsProjects((prev) => [
      { id, name, goal, description, type: projectType ?? 'mixed', status: 'draft' as const, progress: 0, agentCount: 0, workflowCount: 0, taskCount: 0, deliverableCount: 0, approvalCount: 0, createdAt: now, updatedAt: now },
      ...prev,
    ]);
    return id;
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
      root.classList.add('theme-dark');
      root.classList.remove('theme-light', 'theme-system');
    } else if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      root.classList.add('theme-system');
      root.classList.toggle('theme-dark', prefersDark);
      root.classList.toggle('theme-light', !prefersDark);
    } else {
      root.setAttribute('data-theme', 'light');
      root.classList.add('theme-light');
      root.classList.remove('theme-dark', 'theme-system');
    }
  }, [theme]);

  const onNewProject = (name: string, type: NewProjectType) => {
    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const id = `proj-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const projectMeta: Record<NewProjectType, { icon: string; description: string }> = {
      'Sales Analysis': { icon: glyph.chart, description: 'Sales analysis workspace' },
      'Content Workflow': { icon: glyph.writer, description: 'Research, scripts, captions, publishing' },
      'File Report': { icon: glyph.folder, description: 'File summary and reporting workspace' },
      Custom: { icon: glyph.board, description: 'Custom project workspace' },
    };
    const newProject: ChatProjectDef = {
      id,
      icon: projectMeta[type].icon,
      emoji: '📋',
      name,
      description: projectMeta[type].description,
      status: 'Draft',
      projectStatus: 'idle',
      channels: [
        { id: 'team-room', name: 'team-room', type: 'main' },
        { id: 'approvals', name: 'approvals', type: 'approval' },
        { id: 'reports', name: 'reports', type: 'report' },
      ],
      channelMessages: {
        'team-room': [
          { role: 'agent', sender: 'Approval Guard', agentId: 'agent-guard', text: `"${name}" project is ready. Add agents to this workflow canvas to get started.`, timestamp: ts },
        ],
        approvals: [
          { role: 'agent', sender: 'Approval Guard', agentId: 'agent-guard', text: 'Approval channel is ready. Agent actions will wait here before anything is sent or exported.', timestamp: ts },
        ],
        reports: [
          { role: 'agent', sender: 'Report Writer', agentId: 'agent-writer', text: 'Reports channel is ready. Generated summaries will appear here.', timestamp: ts },
        ],
      },
    };
    setProjects((prev) => [...prev, newProject]);
    setActiveProjectId(id);
    setPage('Create Agent Team');
  };

  const onRenameProject = (id: string, newName: string) => {
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, name: newName } : p));
  };

  const onDeleteProject = (id: string) => {
    setProjects((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((p) => p.id !== id);
      if (activeProjectId === id) setActiveProjectId(next[0]?.id ?? '');
      return next;
    });
  };

  const onDuplicateProject = (id: string) => {
    const src = projects.find((p) => p.id === id);
    if (!src) return;
    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newId = `proj-copy-${Date.now()}`;
    const copy: ChatProjectDef = {
      ...src,
      id: newId,
      name: `${src.name} Copy`,
      projectStatus: 'idle',
      status: 'Draft',
      channelMessages: {
        'team-room': [
          { role: 'agent', sender: 'System', text: `"${src.name} Copy" created as a duplicate project.`, timestamp: ts },
        ],
      },
    };
    setProjects((prev) => [...prev, copy]);
    setActiveProjectId(newId);
    setPage('Create Agent Team');
  };

  const onUpdateProjectInstructions = (id: string, instructions: string) => {
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, instructions } : p));
  };

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? projects[0];

  // Settings & Billing are standalone full-page routes — never nested in the
  // AI Ant workspace shell (no sidebar).
  if (page === 'Settings') {
    return (
      <SettingsScreen
        onBack={() => { setSettingsInitialTab(undefined); setPage('AI Ant'); }}
        profile={profile}
        safetyMode={safetyMode} setSafetyMode={setSafetyMode}
        theme={theme} setTheme={setTheme}
        goBilling={() => setPage('Billing')}
        onSignOut={onSignOut}
        onSwitchAccount={onSwitchAccount}
        onChangePassword={() => setPage('ForgotPassword')}
        initialActive={settingsInitialTab}
      />
    );
  }
  if (page === 'Billing') {
    return <BillingScreen onBack={() => setPage('AI Ant')} profile={profile} usageState={usageState} setUsageState={setUsageState} />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background font-dmsans text-ink">
      <KimiStyleSidebar
        page={page}
        profile={profile}
        usageState={usageState}
        wsChats={wsChats}
        wsProjects={wsProjects}
        activeWsChatId={activeWsChatId}
        activeWorkItemId={activeWorkItemId}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        onNavigate={(target) => { setPage(target); setDrawerView(null); }}
        onNewChat={() => { createWsChat(null); setDrawerView(null); }}
        onOpenWsChat={(id) => { setActiveWsChatId(id); setActiveWorkItemId(id); setPage('AI Ant'); }}
        onRenameChat={renameWsChat}
        onTogglePinChat={togglePinWsChat}
        onArchiveChat={archiveWsChat}
        onDeleteChat={deleteWsChat}
        onRenameWsProject={renameWsProject}
        onArchiveWsProject={archiveWsProject}
        onDeleteWsProject={deleteWsProject}
        onNewWsProject={(name, goal) => { createWsProject(name, goal); setPage('Projects'); setDrawerView(null); }}
        onOpenSettings={(tab) => { setSettingsInitialTab(tab); setPage('Settings'); setDrawerView(null); }}
        onSignOut={onSignOut}
        bridgeSessions={bridgeSessions}
        activeBridgeSessionId={activeBridgeSessionId}
        onOpenBridgeSession={openBridgeSession}
      />
      <AppDrawer
        view={drawerView || (isMobileOpen ? 'more' : null)}
        onClose={() => { setDrawerView(null); setIsMobileOpen(false); }}
        page={page}
        setPage={setPage}
        wsChats={wsChats}
        wsProjects={wsProjects}
        activeWsChatId={activeWsChatId}
        onNewChat={() => createWsChat(null)}
        onNewWsProject={(name, goal) => { createWsProject(name, goal); }}
        onOpenWsChat={(id) => { setActiveWsChatId(id); setActiveWorkItemId(id); setPage('AI Ant'); }}
      />
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="z-10 flex items-center justify-between border-b border-white-07 bg-surface p-4 md:hidden">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink"><AntMark tone="white" size={15} /></span>
            <span className="font-heading font-bold">Colony</span>
          </div>
          <button className="p-2 text-muted hover:text-ink" onClick={() => setIsMobileOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
        </header>

        {/* Desktop top-right: active project + safety badge (hidden on pages with own topbar) */}
        <div className={`absolute right-6 top-4 z-20 items-center gap-3 ${page === 'AI Ant' || page === 'Bridge' ? 'hidden' : 'hidden md:flex'}`}>
          {page === 'Create Agent Team' && (
            <span className="rounded-full border border-white-07 bg-surface px-3 py-1.5 text-xs font-medium text-muted">
              {getProjectIcon(activeProject)} {activeProject.name}
            </span>
          )}
          <button
            onClick={() => setSafetyMode((v) => !v)}
            title={safetyMode ? 'Safety Mode ON — click to turn off' : 'Safety Mode OFF — click to enable'}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition hover:opacity-80 ${
              safetyMode
                ? 'border-warning/20 bg-warning/10 text-warning'
                : 'border-red-400/30 bg-red-400/10 text-red-400'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            Safety Mode: {safetyMode ? 'ON' : 'OFF'}
          </button>
        </div>

        <main className="relative flex-1 overflow-y-auto">
          {page === 'AI Ant' && (
            <AIAntPage
              setPage={setPage}
              safetyMode={safetyMode}
              currentUserId={resolveBackendUserId(profile)}
              activeChat={wsChats.find((chat) => chat.id === activeWsChatId) ?? null}
              onEnsureChat={() => activeWsChatId ?? createWsChat(null)}
              onPersistChatMessages={updateWsChatMessages}
              onAutoTitleChat={autoTitleWsChat}
              onPublishDeliverable={publishDeliverable}
              onLaunchBridgeSession={(taskText, sourceConversationId) => {
                launchBridgeSession(taskText, sourceConversationId ?? activeWsChatId ?? undefined);
              }}
              onMarkChatWork={markWsChatWork}
              onCreateFeatureWorkItem={createFeatureWorkItem}
              onUpdateWorkItem={updateWorkItem}
              onDiscardDraftChat={discardDraftChat}
            />
          )}
          {page === 'Projects' && (
            <ProjectsOSPage
              setPage={setPage}
              wsProjects={wsProjects}
              createWsProject={createWsProject}
              renameWsProject={renameWsProject}
              archiveWsProject={archiveWsProject}
              deleteWsProject={deleteWsProjectRaw}
            />
          )}
          {page === 'Bridge' && (
            <BridgeOperatorPage
              session={bridgeSessions.find((s) => s.id === activeBridgeSessionId) ?? null}
              onBackToConversation={(conversationId) => {
                setActiveWsChatId(conversationId);
                setActiveWorkItemId(conversationId);
                setActiveBridgeSessionId(null);
                setPage('AI Ant');
              }}
              onSessionUpdate={handleBridgeSessionUpdate}
              onStartFromHome={() => { setActiveBridgeSessionId(null); setPage('AI Ant'); }}
            />
          )}
          {page === 'AI Teams' && <TeamsOSPage setPage={setPage} />}
          {page === 'Workflows' && <WorkflowsOSPage setPage={setPage} />}
          {page === 'Deliverables' && (
            <DeliverablesOSPage
              deliverables={appDeliverables}
              setDeliverables={setAppDeliverables}
              wsChats={wsChats}
              wsProjects={wsProjects}
              setPage={setPage}
              onOpenChat={(id) => { setActiveWsChatId(id); setActiveWorkItemId(id); setPage('AI Ant'); }}
            />
          )}
          {page === 'Approvals' && <ApprovalsOSPage />}
          {page === 'Knowledge' && <KnowledgeOSPage />}
          {page === 'Templates' && <TemplatesCommunityPage setPage={setPage} />}
          {page === 'Admin' && (
            canAccessAdminDashboard(profile)
              ? <AdminDashboard currentUserEmail={profile.email} onBack={() => setPage('AI Ant')} />
              : <AdminForbidden onBack={() => setPage('AI Ant')} />
          )}
          {page === 'Create Agent Team' && (
            <CreateAgentTeam
              activeProjectId={activeProjectId}
              setActiveProjectId={setActiveProjectId}
              projects={projects}
              onUpdateProjectInstructions={onUpdateProjectInstructions}
              connectors={connectors}
              safetyMode={safetyMode}
              setSafetyMode={setSafetyMode}
              usageState={usageState}
              setUsageState={setUsageState}
              setPage={setPage}
            />
          )}
          {page === 'Connectors' && <ConnectorsMarketplacePage />}
          {!['AI Ant', 'Bridge', 'Projects', 'AI Teams', 'Workflows', 'Deliverables', 'Approvals', 'Knowledge', 'Templates', 'Admin', 'Create Agent Team', 'Connectors', 'Billing', 'Settings'].includes(page) && (
            <div className="h-full p-6 md:p-12">
              <h2 className="mb-6 font-heading text-3xl font-extrabold">{page}</h2>
              <EmptyState
                title={`${page} coming soon`}
                message={`This feature lives inside each project in Colony. Open a project from the sidebar and access it from the canvas.`}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPageState] = useState<Page>(() => pageFromPath(window.location.pathname));
  const [authChecked, setAuthChecked] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(() => {
    const savedProfile = loadProfile();
    ensureMockAdminUser();
    const session = getCurrentUser();
    return session ? { ...savedProfile, email: session.email, name: session.name || savedProfile.name, role: session.role ?? savedProfile.role, emailVerified: session.emailVerified } : savedProfile;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('theme-dark');
  }, []);

  useEffect(() => {
    const onPopState = () => setPageState(pageFromPath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const setPage = useCallback((next: Page) => {
    setPageState(next);
    const path = pathFromPage(next);
    if (window.location.pathname !== path) window.history.pushState({}, '', path);
  }, []);

  const updateProfile = (next: UserProfile) => {
    setProfile(next);
    saveProfile(next);
  };

  // After auth: gate by canAccessApp first. Developers/admins (and, once the
  // backend lands accessStatus, active pilots) proceed to the app. Everyone
  // else is routed to AccessPending. First-time approved users see onboarding.
  //
  // TODO(BACKEND-ACCESS-GATE): this is a frontend convenience only. The API
  // must independently refuse non-approved users; see canAccessApp() comment.
  const handleAuthed = async (user: AuthUser) => {
    const isSameProfile = profile.email === user.email;
    const keepExistingOnboarding = isSameProfile && profile.onboarded;
    const next = {
      ...profile,
      email: user.email,
      name: user.name || (isSameProfile ? profile.name : '') || user.email.split('@')[0] || 'You',
      role: user.role ?? 'user',
      emailVerified: user.emailVerified,
      onboarded: keepExistingOnboarding || (!user.isNewUser && isSameProfile ? profile.onboarded : false),
      answers: keepExistingOnboarding || (!user.isNewUser && isSameProfile) ? profile.answers : {},
    };
    const hasSavedSurvey = next.onboarded ? false : await hasSurveySubmission(resolveSurveyUserId(next));
    if (hasSavedSurvey) next.onboarded = true;
    updateProfile(next);
    if (!canAccessApp({ role: next.role })) {
      setPage('AccessPending');
      return;
    }
    setPage(next.onboarded ? 'AI Ant' : 'Onboarding');
  };

  const completeOnboarding = async (answers: Record<string, string>) => {
    const next = { ...profile, onboarded: true, answers };
    updateProfile(next);
    await saveSurveySubmission(resolveSurveyUserId(next), answers);
    setPage('AI Ant');
  };

  // ── Sign-out / Switch-account ──────────────────────────────────────────────
  // Clears Firebase session, mock local session, and resets the in-memory
  // profile so protected routes can't be re-entered from stale state. The
  // saved onboarding profile in localStorage is also wiped — refreshing the
  // tab after a logout returns to the sign-in page.
  const handleSignOut = useCallback(async () => {
    try { await signOutFirebase(firebaseAuth); } catch { /* ignore */ }
    signOutMock();
    const cleared: UserProfile = { name: 'You', email: '', role: 'user', emailVerified: false, onboarded: false, answers: {} };
    setProfile(cleared);
    saveProfile(cleared);
    setPage('Login');
  }, [setPage]);

  // Switch account == sign out + land on Login so another account can sign in.
  // Project data lives independently of the user session (workspace storage),
  // so it's not wiped here.
  const handleSwitchAccount = handleSignOut;

  const MARKETING_PAGE_LIST: Page[] = [
    'MarketingProduct',
    'MarketingHowItWorks',
    'MarketingFeatures',
    'MarketingFeatureAIAnt',
    'MarketingFeatureColonyCrew',
    'MarketingFeatureOneManEnterprise',
    'MarketingFeatureAutomation',
    'MarketingFeatureColonyBridge',
    'MarketingPricing',
    'MarketingRoadmap',
    'MarketingAbout',
    'MarketingEarlyAccess',
    'MarketingPrivacy',
    'MarketingTerms',
  ];
  const isMarketingPage = MARKETING_PAGE_LIST.includes(page);
  const publicPages: Page[] = ['Landing', 'Login', 'CreateAccount', 'VerifyEmail', 'ForgotPassword', 'AccessPending', ...MARKETING_PAGE_LIST];
  const needsAuth = !publicPages.includes(page) && (!profile.email || !profile.emailVerified);
  // TODO(BACKEND-ACCESS-GATE): mirror this check on every API route.
  const authedButUnauthorized =
    !!profile.email && profile.emailVerified && !canAccessApp({ role: profile.role }) && !isMarketingPage;

  useEffect(() => {
    let cancelled = false;
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (!firebaseUser) {
        if (!cancelled) setAuthChecked(true);
        return;
      }
      await firebaseUser.reload();
      if (!firebaseUser.emailVerified) {
        if (!cancelled) setAuthChecked(true);
        return;
      }
      const restoredUser = authUserFromFirebase(firebaseUser, false);
      if (!cancelled) {
        await handleAuthed(restoredUser);
        setAuthChecked(true);
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  if (!authChecked) {
    return (
      <div className="relative min-h-screen overflow-x-hidden bg-background text-ink">
        <GlobalBackgroundVideo />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-ink">
      <GlobalBackgroundVideo />
      <div className="relative z-10">
        {needsAuth && <LoginPage goTo={setPage} onAuthed={handleAuthed} />}
        {page === 'Landing' && <LandingPage goTo={setPage} />}
        {page === 'Login' && <LoginPage goTo={setPage} onAuthed={handleAuthed} />}
        {page === 'CreateAccount' && <LoginPage goTo={setPage} onAuthed={handleAuthed} initialMode="signup" />}
        {page === 'VerifyEmail' && <VerifyEmailPage goTo={setPage} onAuthed={handleAuthed} />}
        {page === 'ForgotPassword' && <ForgotPasswordPage goTo={setPage} />}
        {page === 'AccessPending' && (
          <AccessPendingPage goTo={setPage} onSignOut={handleSignOut} email={profile.email || undefined} />
        )}
        {page === 'MarketingProduct' && <MarketingProductPage goTo={setPage} currentPage={page} />}
        {page === 'MarketingHowItWorks' && <MarketingHowItWorksPage goTo={setPage} currentPage={page} />}
        {page === 'MarketingFeatures' && <MarketingFeaturesPage goTo={setPage} currentPage={page} />}
        {page === 'MarketingFeatureAIAnt' && <MarketingAIAntPage goTo={setPage} currentPage={page} />}
        {page === 'MarketingFeatureColonyCrew' && <MarketingColonyCrewPage goTo={setPage} currentPage={page} />}
        {page === 'MarketingFeatureOneManEnterprise' && <MarketingOneManEnterprisePage goTo={setPage} currentPage={page} />}
        {page === 'MarketingFeatureAutomation' && <MarketingAutomationPage goTo={setPage} currentPage={page} />}
        {page === 'MarketingFeatureColonyBridge' && <MarketingColonyBridgePage goTo={setPage} currentPage={page} />}
        {page === 'MarketingPricing' && <MarketingPricingPage goTo={setPage} currentPage={page} />}
        {page === 'MarketingRoadmap' && <MarketingRoadmapPage goTo={setPage} currentPage={page} />}
        {page === 'MarketingAbout' && <MarketingAboutPage goTo={setPage} currentPage={page} />}
        {page === 'MarketingEarlyAccess' && <MarketingEarlyAccessPage goTo={setPage} currentPage={page} />}
        {page === 'MarketingPrivacy' && <MarketingPrivacyPage goTo={setPage} currentPage={page} />}
        {page === 'MarketingTerms' && <MarketingTermsPage goTo={setPage} currentPage={page} />}
        {authedButUnauthorized && page !== 'AccessPending' && page !== 'Landing' && page !== 'Login' && page !== 'CreateAccount' && page !== 'VerifyEmail' && page !== 'ForgotPassword' && !isMarketingPage && (
          <AccessPendingPage goTo={setPage} onSignOut={handleSignOut} email={profile.email || undefined} />
        )}
        {!needsAuth && !authedButUnauthorized && !isMarketingPage && page === 'Onboarding' && (
          <OnboardingPage
            onComplete={completeOnboarding}
            onSkip={() => completeOnboarding(profile.answers)}
          />
        )}
        {!needsAuth && !authedButUnauthorized && !isMarketingPage && page !== 'Landing' && page !== 'Login' && page !== 'CreateAccount' && page !== 'VerifyEmail' && page !== 'ForgotPassword' && page !== 'Onboarding' && page !== 'AccessPending' && (
          <AppShell page={page} setPage={setPage} profile={profile} onSignOut={handleSignOut} onSwitchAccount={handleSwitchAccount} />
        )}
      </div>
    </div>
  );
}

