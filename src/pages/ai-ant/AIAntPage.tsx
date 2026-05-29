import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { demoAgents } from '../../data/demoAgents';
import { demoDeliverables } from '../../data/demoDeliverables';
import { demoScenarios } from '../../data/demoScenarios';
import { AdminDashboard, AdminForbidden } from '../../components/admin/AdminDashboard';
import type { FeatureName, UserRole } from '../../lib/admin/adminTypes';
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
} from '../../lib/aiOrchestration';
import { guardAIRequest, AIRequestGuardError } from '../../lib/ai/aiRequestGuard';
import { trackAIRequest } from '../../lib/admin/adminTracking';
import { getPlanEntitlements, getLimit } from '../../lib/billing/entitlements';
import { getAnnualSavings, getPlanPrice, PLAN_ORDER, PLANS as BILLING_PLANS } from '../../lib/billing/plans';
import { changePlan, createCheckoutSession, createCustomerPortalSession, ensureSubscriptionForUser, getSubscription, isBillingMockMode } from '../../lib/billing/subscriptions';
import { currentUsagePeriod, getMonthlyUsage } from '../../lib/billing/usage';
import type { PlanId as BillingPlanId, UsageFeature } from '../../lib/billing/types';
import { getMockUserByEmail, MOCK_USERS } from '../../lib/mock/mockUsers';
import {
  ensureMockAdminUser,
  getCurrentUser,
  normalizeEmail,
  signOut as signOutMock,
  validateEmail,
} from '../../lib/auth/mockAuth';
import type { AuthProvider, AuthUser } from '../../lib/auth/mockAuth';
import { canAccessAdminDashboard, canAccessApp, canSeeDeveloperSettings, isDeveloperOrAdmin, roleBadgeLabel } from '../../lib/auth/roles';
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

import { LoginPage, ForgotPasswordPage, VerifyEmailPage, AccessPendingPage } from '../../pages/Auth';
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
} from '../../pages/marketing';
import { AIRoutingCard } from '../../pages/ai-ant/AIRoutingCard';

import { AIAntActivityLog, AIAntApprovalModal, AIAntAutonomySelector, AIAntColonyPanel, AIAntConfidenceBadge, AIAntCorrectionPanel, AIAntDeliveryPanel, AIAntDevicePanel, AIAntDevicesStrip, AIAntFileCard, AIAntHandoffBanner, AIAntKnowledgeBase, AIAntLearnedPatterns, AIAntLiveConsole, AIAntModeToggle, AIAntNotificationBell, AIAntNotificationDrawer, AIAntPermissionManager, AIAntRecoveryCard, AIAntSandboxPanel, AIAntSemanticSearch, AIAntSmartSuggestions, AIAntStatusStrip, AIAntTaskPanel, AIAntToolRouterPanel, AIAntVoiceBar, AIAntWorkflowPanel, AIAntWorkspaceGraph, AIAntWorkspacePanel, AITeamProposalCard, AddMenuItem, AntAssistantMessageActions, AntPlanCard, AntPromptInput, AntPromptSuggestions, CrewWorkspace, DeliverablePreviewCard, DeviceActionFlowCard, ExecutionDecisionCard, KBEntry, ModelRoutingSelector, NotifItem, ProjectIntentCard, AIProjectWorkspace } from '../../components/ai-ant/AIAntComponents';

import { OnboardingPage } from '../../pages/OnboardingPage';
import { onAuthStateChanged, signOut as signOutFirebase } from 'firebase/auth';
import { pageFromPath, pathFromPage } from '../../lib/navigation/routes';
import { authUserFromFirebase } from '../../lib/auth/firebaseAuthAdapter';
import { firebaseAuth } from '../../lib/firebase/client';
import { GlobalBackgroundVideo, LandingPage } from '../../pages/LandingPage';
import { ColonyLogo, AntMark } from '../../components/brand/BrandMarks';
import { BorderGlow } from '../../components/effects/BorderGlow';
import { BlurText } from '../../components/effects/BlurText';
import { Popover, PopoverTrigger, PopoverContent } from '../../components/ui/Popover';
import { ProviderLogo } from '../../components/model/ProviderLogo';
import { SUPPORTED_MODELS, type SupportedModel } from '../../lib/modelCatalog';
import type { Page } from '../../types/navigation';
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
} from '../../lib/modelDisplay';
import { OSPageShell } from '../../components/shared/OSPageShell';

import { AppModal } from '../../components/modals/AppModal';
import { ContextMenu } from '../../components/modals/ContextMenu';

import { ActionConfirmModal, AISuggestionsPanel, ApprovalCardModal, ApprovalHistoryModal, ApprovalRulesModal, AuditLogModal, BuildWorkflowModal, ConfirmModal, DataPipelineModal, DebugWorkflowModal, DeleteAccountModal, EmailDraftModal, ExplainWorkflowModal, FileProcessingCenter, GenerateInstructionsModal, ImproveWorkflowModal, LineDraftModal, ModalShell, ReportEditorModal, ReportExportModal, ReportListModal, ReportPreviewModal, RunHistoryModal, ScheduleReportModal, ScheduledReportsModal, UpgradeModal, WorkflowQualityModal } from '../../components/modals/Modals';

import { KimiStyleSidebar, Sidebar } from '../../components/sidebar/Sidebar';
import { AppDrawer } from '../../components/drawer/AppDrawer';

import { OSGridCards, type OSCard } from '../../components/shared/OSGridCards';
import { ApprovalsOSPage } from '../../pages/approvals/ApprovalsOSPage';
import { TemplatesCommunityPage } from '../../pages/templates/TemplatesCommunityPage';
import { TeamsOSPage } from '../../pages/teams/TeamsOSPage';
import { WorkflowsOSPage } from '../../pages/workflows/WorkflowsOSPage';
import { ConnectorsMarketplacePage } from '../../pages/connectors/ConnectorsMarketplacePage';
import { AppShell } from '../../shell/AppShell';
import { ProjectsOSPage } from '../../pages/projects/ProjectsOSPage';
import { DeliverablesOSPage } from '../../pages/deliverables/DeliverablesOSPage';
import { KnowledgeOSPage } from '../../pages/knowledge/KnowledgeOSPage';

import { BillingScreen } from '../../pages/billing/BillingScreen';
import {
  ColonyCrewCard,
  ColonyCrewPanel,
  ColonyCrewReopenPill,
  analyzeAndMatchAgents,
  buildColonyCrewAgents,
  buildColonyCrewResult,
  buildDefaultCrewRun,
  parseCrewControl,
} from '../../pages/colony-crew/ColonyCrewPanel';
import { SettingsScreen } from '../../pages/settings/SettingsScreen';
import { WorkflowBuilderPage, WorkflowProposalCard } from '../../pages/workflow/WorkflowBuilderPage';
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
} from '../../pages/one-man-enterprise/OneManEnterprisePage';

import { BossIntake } from '../../pages/one-man-enterprse/BossIntake';
import { EnterpriseOrgPreviewPanel } from '../../pages/one-man-enterprse/oneManEnterprise';
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
} from '../../pages/one-man-enterprse/oneManEnterprise';
import { BridgeOperatorPage } from '../../pages/bridge/BridgeOperatorPage';
import { BridgeSetupCard, type BridgeSetupCardData } from '../../pages/bridge/BridgeSetupCard';
import {
  loadBridgeSessions,
  upsertBridgeSession,
  type BridgeSession,
} from '../../lib/bridge/bridgeSessionStore';
import { createBridgeSessionFromTask } from '../../lib/bridge/bridgeIntake';
import { type WorkItemStatus, type WorkItemType } from '../../lib/work/workItems';
import {
  ONBOARDING_KEY,
  getApiBaseUrl,
  isAdminRole,
  loadProfile,
  resolveBackendUserId,
  resolveSurveyUserId,
  saveProfile,
  usageFeatureToAdminFeature,
} from '../../lib/profile/profileApi';
import { CUSTOM_MODELS_STORAGE_KEY, loadCustomModels } from '../../lib/profile/customModels';
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
} from '../../lib/workspace/workspaceApi';
import {
  DEVICE_ACCESS_FOR_VERB,
  DEVICE_RUN_STEPS,
  analyzeDeviceAction,
  classifyAntExecutionMode,
  readableField,
  titleFromGoal,
} from '../../lib/aiAnt/aiAntHelpers';

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
} from '../../lib/aiAnt/routing';

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
} from '../../lib/canvas/canvasLayout';
import {
  ADDON_CATALOG,
  BILLING_LS_KEY,
  FEATURE_TABLE,
  PLAN_LIMITS,
  buildBillingFeatureTable,
  formatLimit,
  loadBillingState,
  saveBillingState,
} from '../../lib/billing/billingCatalog';

import { REPORT_TEMPLATES, MOCK_REPORTS, MOCK_SCHEDULED_REPORTS, _mkSections } from '../../lib/data/reportData';

import { ALL_SKILLS, ALL_TOOLS, ALL_TONES, BRANCH_ELSE_ACTIONS, BRANCH_METRICS, BRANCH_OPERATORS, BRANCH_THEN_ACTIONS, BUBBLE_MESSAGES, CANVAS_CHAR_CONFIGS, CHAR_CONFIGS, DEFAULT_PARALLEL_GROUPS, DEFAULT_WORKFLOW_CONFIG, DEFAULT_WORKFLOW_STEPS, LOOP_SOURCE_OPTIONS, MOCK_WORKFLOW_VERSIONS, MODEL_OPTIONS, SpriteAnimator, TEMPLATE_CATEGORIES, TRIGGER_OPTIONS, WEEKDAYS, WORKFLOW_INPUT_OPTIONS, WORKFLOW_OUTPUT_OPTIONS } from '../../lib/data/workflowDefaults';
import { CHAT_PROJECTS, CHAT_SERVERS, getDefaultChannelId, getDefaultServerChannelId, getProjectChannelMessages, getProjectIcon, getProjectStatusLabel, getServerChannelMessages } from '../../lib/data/chatSeedData';
import { AGENT_IO, COMING_SOON_CONNECTORS, DATA_STANDARD_FIELDS, DEFAULT_DATA_PREVIEW_STATE, INITIAL_CONNECTORS, MOCK_PIPELINE_COLUMNS, MOCK_PIPELINE_MAPPINGS, MOCK_PIPELINE_ROWS, MOCK_PIPELINE_VALIDATION, MOCK_PROCESSED_FILES, MOCK_SOURCE_HISTORY, ROLE_OPTIONS, TOOL_TO_CONNECTOR_ID } from '../../lib/data/connectorSeedData';
import { DEFAULT_APPROVAL_RULES, DEFAULT_SAFETY_RULES, DEFAULT_USAGE_STATE, MOCK_APPROVAL_HISTORY, MOCK_APPROVAL_REQUESTS, MOCK_AUDIT_LOGS, MOCK_INVOICES, MOCK_WORKFLOW_RUNS, PLANS } from '../../lib/data/runSeedData';
import { ANT_AUTONOMY_LEVELS, ANT_CAPABILITIES, ANT_COLONY_SESSION, ANT_DEVICES, ANT_INITIAL_DELIVERIES, ANT_INITIAL_LIVE_EVENTS, ANT_INITIAL_LOGS, ANT_INITIAL_MEMORIES, ANT_INITIAL_TASKS, ANT_KNOWLEDGE_INITIAL, ANT_LEARNED_PATTERNS, ANT_NOTIFICATIONS_INITIAL, ANT_PERMISSIONS, ANT_QUICK_ACTIONS, ANT_RECOVERY_SUGGESTIONS, ANT_SEARCH_RESULTS, ANT_SUGGESTIONS_INITIAL, ANT_TEAM_MEMBERS, ANT_TOOLS, ANT_WORKFLOWS_INITIAL, ANT_WORKSPACES, GRAPH_EDGES, GRAPH_NODES } from '../../lib/data/aiAntSeedData';

import { detectRisk } from '../../lib/workflow/risk';
import {
  AI_WORKFLOW_TEMPLATES,
  estimateWorkflowCredits,
  mockAnalyzeWorkflow,
  mockDebugWorkflow,
  mockGenerateExplanation,
  mockGenerateInstructions,
  mockGenerateWorkflow,
  mockScoreWorkflow,
} from '../../lib/workflow/workflowMocks';
import { createWorkflowProposalFromPrompt, workflowFromProposal } from '../../lib/workflow/workflowProposal';
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
} from '../../lib/workflow/workflowBuilder';

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
} from '../../lib/types/billingTypes';
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
} from '../../lib/types/crewTypes';
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
} from '../../lib/types/workflowTypes';
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
} from '../../lib/types/antTypes';
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
} from '../../lib/types/appTypes';
import { ModelPickerModal } from '../../components/model/ModelPickerModal';
import { runColonyCrew } from '../../lib/crew/crewApi';
import { createBridgeRequest } from '../../lib/bridge/bridgeApi';
import type { BridgeRequest } from '../../lib/bridge/bridgeTypes';

export function buildAntTeamProposal(goal: string, mode: AntExecutionMode): AntTeamProposal {
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

export function getConfidenceLevel(score: number): AntConfidenceLevel {
  if (score >= 0.88) return 'verified';
  if (score >= 0.72) return 'needs-review';
  return 'manual-override';
}

export const SENSITIVE_DOMAINS: AntDomain[] = ['finance', 'hr', 'email', 'file-deletion', 'external-export'];

export function antModeTransition(
  mode: AntMode, risk: AntRiskLevel, domain: AntDomain
): { effectiveMode: AntMode; escalated: boolean } {
  if (mode === 'read-only') return { effectiveMode: 'read-only', escalated: false };
  const sensitive = SENSITIVE_DOMAINS.includes(domain) || risk === 'Sensitive' || risk === 'High Risk';
  if (mode === 'auto' && sensitive) return { effectiveMode: 'approval', escalated: true };
  if (mode === 'assist' && domain === 'file-deletion') return { effectiveMode: 'approval', escalated: true };
  return { effectiveMode: mode, escalated: false };
}

export function detectAntDomain(lower: string): AntDomain {
  if (/invoice|finance|revenue|payroll|budget|billing/.test(lower)) return 'finance';
  if (/email|inbox|gmail|compose/.test(lower)) return 'email';
  if (/delete|remove|trash|wipe/.test(lower)) return 'file-deletion';
  if (/send|upload|share|export|drive|sync|cloud/.test(lower)) return 'external-export';
  if (/hr|employee|personnel|hiring|salary/.test(lower)) return 'hr';
  return 'general';
}

export function detectActionType(lower: string, domain: AntDomain): AntActionType {
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

export function mockAntRespond(input: string, mode: AntMode): {
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


export function classifyExecutionMode(text: string): ChatMode {
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

export const EXECUTION_MODE_LABEL: Record<ChatMode, string> = {
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

export function colonyDeliverableToApp(d: ColonyDeliverable, chatTitle?: string): AppDeliverable {
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

export function AIAntPage({
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
