import { demoAgents } from '../../data/demoAgents';
import { demoDeliverables } from '../../data/demoDeliverables';
import { demoScenarios } from '../../data/demoScenarios';
import { Bot, Building2, MessageSquare, Network, Sparkles, Users, Workflow } from 'lucide-react';
import type React from 'react';
import { CAPABILITY_LABELS, EXPENSIVE_CAPABILITIES, createAgentSkill, estimateCapabilityCredits, resolveModelForCapability, type AgentCapability, type Artifact, type ColonyAgent, type ModelProvider, type ResolvedModel, type RoutingDecision } from '../aiOrchestration';
import { defaultActiveModel, inferCapabilitiesFromText, skillsForCapabilities } from '../modelDisplay';
import { titleFromGoal } from './aiAntHelpers';
import type { AgentInputMode } from '../types/appTypes';
import type { AiAntBackendResponse, AntTeamProposal, ApprovalLevel, ColonyDeliverable, ColonyDeliverableType, ExecutionDecision, ExecutionMode } from '../types/antTypes';
import type { ManualModelSelection, ModelRoutingPreference } from '../types/workflowTypes';

export function normalizeAgentInputMode(mode: AgentInputMode): AgentInputMode {
  if (mode === 'Agent' || mode === 'Deep Research') return 'Colony Crew';
  return mode;
}

// Visible display labels for each mode. Internal keys (AgentInputMode) stay
// as 'Workflow'/'Device' for backward compatibility with classifier + handlers.
export const AGENT_MODE_LABEL: Record<AgentInputMode, string> = {
  Auto: 'Recommend for me',
  Chat: 'Chat',
  Agent: 'Colony Crew',
  'Colony Crew': 'Colony Crew',
  'Deep Research': 'Colony Crew',
  'One-man Enterprise': 'One-man Enterprise',
  Workflow: 'Automation',
  Device: 'Colony Bridge Operator',
};

export const AGENT_MODE_SHORT_LABEL: Record<AgentInputMode, string> = {
  Auto: 'Recommend',
  Chat: 'Chat',
  Agent: 'Crew',
  'Colony Crew': 'Crew',
  'Deep Research': 'Crew',
  'One-man Enterprise': 'Enterprise',
  Workflow: 'Automation',
  Device: 'Bridge Operator',
};

export const AGENT_MODE_OPTIONS: Array<{ mode: AgentInputMode; description: string; icon: React.ElementType }> = [
  { mode: 'Chat', description: 'Get a direct answer, draft, or explanation.', icon: MessageSquare },
  { mode: 'Device', description: 'Let AI work across browser, files, apps, or devices.', icon: Network },
  { mode: 'Colony Crew', description: 'Assemble specialist agents for a complex task.', icon: Users },
  { mode: 'Workflow', description: 'Turn recurring work into a reusable workflow.', icon: Workflow },
  { mode: 'One-man Enterprise', description: 'Create a long-term AI operating workspace.', icon: Building2 },
  { mode: 'Auto', description: 'AI Ant suggests the best workspace before anything runs.', icon: Sparkles },
];

export const MODEL_ROUTING_OPTIONS: Array<{ value: ModelRoutingPreference; label: string; shortLabel: string; description: string }> = [
  { value: 'auto', label: 'Auto', shortLabel: 'Auto', description: 'Let Colony Bridge choose a suitable model preference.' },
  { value: 'fast', label: 'Fast', shortLabel: 'Fast', description: 'Quicker responses for simple tasks.' },
  { value: 'balanced', label: 'Balanced', shortLabel: 'Balanced', description: 'A practical mix of speed and quality.' },
  { value: 'best_quality', label: 'Deep Reasoning', shortLabel: 'Deep Reasoning', description: 'More thorough analysis and planning.' },
];

export const MANUAL_MODEL_GROUPS: Array<{ capability: AgentCapability; label: string; models: Array<{ provider: ModelProvider | string; modelId: string; label: string }> }> = [
  { capability: 'text_reasoning', label: 'Text reasoning', models: [
    { provider: 'deepseek', modelId: 'deepseek-v3', label: 'DeepSeek V3' },
    { provider: 'gemini', modelId: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { provider: 'openai', modelId: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
  ] },
  { capability: 'web_research', label: 'Web research', models: [
    { provider: 'perplexity', modelId: 'sonar', label: 'Perplexity Sonar' },
    { provider: 'gemini', modelId: 'gemini-search-fallback', label: 'Gemini Search fallback' },
  ] },
  { capability: 'image_generation', label: 'Image generation', models: [
    { provider: 'gemini', modelId: 'imagen', label: 'Gemini Image / Imagen' },
  ] },
  { capability: 'video_generation', label: 'Video generation', models: [
    { provider: 'gemini', modelId: 'veo', label: 'Veo' },
  ] },
  { capability: 'text_to_speech', label: 'TTS', models: [
    { provider: 'elevenlabs', modelId: 'elevenlabs-tts', label: 'Supported voice provider' },
  ] },
];

export function modelRoutingLabel(value: ModelRoutingPreference) {
  return MODEL_ROUTING_OPTIONS.find((option) => option.value === value)?.shortLabel ?? 'Auto';
}


export function modeFromInputMode(inputMode: AgentInputMode): ExecutionMode | null {
  const normalizedMode = normalizeAgentInputMode(inputMode);
  if (normalizedMode === 'Chat') return 'simple_chat';
  if (normalizedMode === 'Colony Crew') return 'agent_swarm';
  if (normalizedMode === 'Workflow') return 'workflow';
  if (normalizedMode === 'Device') return 'device_action';
  if (normalizedMode === 'One-man Enterprise') return 'one_man_enterprise';
  return null;
}

export function classifyExecutionIntent(prompt: string, inputMode: AgentInputMode): ExecutionDecision {
  const lower = prompt.toLowerCase();
  const forced = modeFromInputMode(inputMode);
  const scenario = demoScenarios.find((item) => lower.includes(item.trigger));
  const approvalSensitive = /send|publish|post|email|message|share|delete|remove|overwrite|write to|update sheet|modify|spend|payment|connect account|external/.test(lower);
  const deviceLike = /file|folder|screenshot|browser|computer|device|drive|sheet|spreadsheet|api|connector|upload|download|app/.test(lower);
  const enterpriseLike = /one-man|one man|company|business operating|ai organization|ai company|solo business|enterprise/.test(lower);
  const workflowLike = /every|daily|weekly|monthly|schedule|repeat|recurring|automate|workflow|process/.test(lower);
  const deliverableLike = /report|presentation|plan|strategy|spreadsheet|checklist|summary|brief|deck|business plan|marketing plan/.test(lower);
  const swarmLike = /team|agents|swarm|launch|startup|competitor|market research|research.*analysis|multi-step|parallel|go-to-market/.test(lower);
  const singleAgentLike = /summarize|rewrite|draft|extract|review|analyze this|classify/.test(lower);

  let mode: ExecutionMode =
    forced ??
    (scenario ? scenario.executionMode as ExecutionMode :
    (approvalSensitive ? 'approval_sensitive' :
    enterpriseLike ? 'one_man_enterprise' :
    workflowLike ? 'workflow' :
    deviceLike ? 'device_action' :
    swarmLike ? 'agent_swarm' :
    deliverableLike ? 'deliverable_generation' :
    singleAgentLike ? 'single_agent' :
    /help me|handle|organize|prepare/.test(lower) ? 'operator_task' : 'simple_chat'));

  if (forced === 'simple_chat') mode = 'simple_chat';
  const expectedDeliverables =
    scenario?.deliverables ??
    mode === 'simple_chat' ? [] :
    mode === 'workflow' ? ['Workflow automation', 'First run summary'] :
    mode === 'one_man_enterprise' ? ['AI organization grid', 'First project plan'] :
    mode === 'device_action' ? ['Device action result', 'Source summary'] :
    mode === 'single_agent' ? ['Specialist output'] :
    mode === 'agent_swarm' ? ['Research summary', 'Final report'] :
    ['Draft deliverable', 'Review-ready output'];
  const suggestedAgents =
    mode === 'agent_swarm' || mode === 'deliverable_generation'
      ? demoAgents.slice(0, /presentation|deck/.test(lower) ? 4 : 3).map((agent) => agent.name)
      : mode === 'single_agent' ? [demoAgents[0].name] : [];
  const approvalLevel: ApprovalLevel =
    approvalSensitive ? (/delete|spend|payment|bulk/.test(lower) ? 'critical' : 'high') :
    deviceLike ? 'medium' :
    mode === 'workflow' || mode === 'agent_swarm' ? 'medium' :
    'none';
  const reasonMap: Record<ExecutionMode, string> = {
    simple_chat: 'This looks like normal conversation or explanation.',
    operator_task: 'AI Ant can handle this directly as a single operator.',
    device_action: 'AI Ant selected Colony Bridge because this task needs access to files, apps, browser, or connected tools.',
    single_agent: 'One specialist agent is enough for this task.',
    agent_swarm: 'The task needs multiple roles, parallel work, or several stages.',
    one_man_enterprise: 'This looks like a business or project operating system.',
    workflow: 'This appears repeatable or schedule-based.',
    approval_sensitive: 'This may send, edit, delete, publish, connect, spend, or share data.',
    deliverable_generation: 'The task should end with a concrete artifact.',
  };
  const nextStepMap: Record<ExecutionMode, string> = {
    simple_chat: 'Answer directly',
    operator_task: 'Show direct work plan',
    device_action: 'Prepare Colony Bridge request',
    single_agent: 'Show specialist agent proposal',
    agent_swarm: 'Show team proposal',
    one_man_enterprise: 'Open enterprise builder',
    workflow: 'Show workflow proposal',
    approval_sensitive: 'Show approval card',
    deliverable_generation: 'Create deliverable preview',
  };

  return {
    id: `decision-${Date.now()}`,
    mode,
    confidence: forced ? 0.98 : mode === 'simple_chat' ? 0.72 : 0.88,
    reason: reasonMap[mode],
    suggestedNextStep: nextStepMap[mode],
    approvalLevel,
    expectedDeliverables,
    suggestedAgents,
    sourcePrompt: prompt,
  };
}

export function deliverableTypeFromDecision(decision: ExecutionDecision): ColonyDeliverableType {
  const lower = decision.sourcePrompt.toLowerCase();
  if (/presentation|deck|slides/.test(lower)) return 'presentation';
  if (/spreadsheet|sheet|csv/.test(lower)) return 'spreadsheet';
  if (/business plan/.test(lower)) return 'business_plan';
  if (/marketing/.test(lower)) return 'marketing_plan';
  if (/strategy/.test(lower)) return 'strategy';
  if (/checklist|tasks/.test(lower)) return 'task_list';
  if (/workflow|automate|schedule/.test(lower)) return 'workflow_automation';
  if (/research|competitor|market/.test(lower)) return 'research_summary';
  return 'report';
}

export function createDemoDeliverable(decision: ExecutionDecision, projectId?: string, sourceCtx?: { sourceChatId?: string; sourceCrewRunId?: string; sourceWorkflowId?: string }): ColonyDeliverable {
  const match = demoDeliverables.find((item) => decision.sourcePrompt.toLowerCase().includes(item.title.toLowerCase().split(' ')[0]));
  const now = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  const type = deliverableTypeFromDecision(decision);
  const creativeCaps = inferCapabilitiesFromText(decision.sourcePrompt).filter((capability) => EXPENSIVE_CAPABILITIES.includes(capability));
  const artifacts: Artifact[] = creativeCaps.map((capability, index) => {
    const config = resolveModelForCapability(capability);
    return {
      id: `artifact-${Date.now()}-${index}`,
      type: capability === 'image_generation' ? 'image' : capability === 'video_generation' ? 'video' : 'audio',
      title: `${CAPABILITY_LABELS[capability]} placeholder`,
      content: `Mock ${CAPABILITY_LABELS[capability].toLowerCase()} output. Real provider adapter integration is a TODO.`,
      provider: config.provider,
      modelName: config.displayName,
      createdAt: new Date().toISOString(),
    };
  });
  return {
    id: `deliverable-${Date.now()}`,
    projectId,
    ownerAgentId: decision.suggestedAgents[0] ?? 'ai-ant',
    title: match?.title ?? decision.expectedDeliverables[0] ?? titleFromGoal(decision.sourcePrompt),
    type,
    status: decision.mode === 'simple_chat' ? 'draft' : 'in_progress',
    content: match?.content ?? `Draft ${type.replace('_', ' ')} for: ${decision.sourcePrompt}`,
    preview: match?.preview ?? 'AI Ant is producing a reviewable artifact instead of leaving this as endless chat.',
    version: 1,
    createdAt: now,
    updatedAt: now,
    sourceTasks: [decision.sourcePrompt],
    approvalStatus: decision.approvalLevel === 'none' ? 'none' : 'pending',
    artifacts,
    ...sourceCtx,
  };
}

export function routingModeFromInput(inputMode: AgentInputMode): RoutingDecision['selectedMode'] {
  const normalized = normalizeAgentInputMode(inputMode);
  if (normalized === 'Chat') return 'chat';
  if (normalized === 'Colony Crew') return 'colony_crew';
  if (normalized === 'One-man Enterprise') return 'one_man_enterprise';
  if (normalized === 'Workflow') return 'automation';
  if (normalized === 'Device') return 'connected_workspace';
  return 'auto';
}

export function resolvedModeFromDecision(decision: ExecutionDecision): RoutingDecision['resolvedMode'] {
  if (decision.mode === 'simple_chat' || decision.mode === 'operator_task' || decision.mode === 'single_agent') return 'chat';
  if (decision.mode === 'one_man_enterprise') return 'one_man_enterprise';
  if (decision.mode === 'workflow') return 'automation';
  if (decision.mode === 'device_action' || decision.mode === 'approval_sensitive') return 'connected_workspace';
  return 'colony_crew';
}

export function routingAgentsFromProposal(proposal: AntTeamProposal | null, capabilities: AgentCapability[]): ColonyAgent[] {
  if (proposal) {
    return proposal.agents.map((agent, index) => {
      const skills = agent.skills ?? skillsForCapabilities(inferCapabilitiesFromText(agent.name, agent.role, agent.tools));
      return {
        id: `routing-agent-${index}`,
        name: agent.name,
        role: agent.role,
        status: agent.status,
        progress: agent.status === 'done' ? 100 : agent.status === 'working' ? 58 : 0,
        skills,
        activeModel: agent.activeModel ?? defaultActiveModel(skills),
      };
    });
  }
  const skillSet = skillsForCapabilities(capabilities);
  return [{
    id: 'routing-agent-ai-ant',
    name: 'AI Ant',
    role: 'Task planner and executor',
    status: 'routing',
    progress: 20,
    skills: skillSet,
    activeModel: defaultActiveModel(skillSet),
  }];
}

export function buildRoutingDecision(prompt: string, inputMode: AgentInputMode, decision: ExecutionDecision, proposal: AntTeamProposal | null): RoutingDecision {
  const capabilities = Array.from(new Set([
    ...inferCapabilitiesFromText(prompt),
    ...(proposal?.agents.flatMap((agent) => (agent.skills ?? []).map((skill) => skill.capability)) ?? []),
  ]));
  const agents = routingAgentsFromProposal(proposal, capabilities);
  const modelRoutes = capabilities.map((capability) => resolveModelForCapability(capability));
  const selectedMode = routingModeFromInput(inputMode);
  const resolvedMode = resolvedModeFromDecision(decision);
  return {
    id: `routing-${Date.now()}`,
    userPrompt: prompt,
    selectedMode,
    resolvedMode,
    confidence: decision.confidence,
    reason: selectedMode === 'auto'
      ? `Auto selected ${AGENT_MODE_LABEL[resolvedMode === 'automation' ? 'Workflow' : resolvedMode === 'connected_workspace' ? 'Device' : resolvedMode === 'colony_crew' ? 'Colony Crew' : resolvedMode === 'one_man_enterprise' ? 'One-man Enterprise' : 'Chat']} because ${decision.reason.toLowerCase()}`
      : decision.reason,
    requiredCapabilities: capabilities,
    selectedAgents: agents,
    modelRoutes,
    estimatedCredits: estimateCapabilityCredits(capabilities.filter((capability) => EXPENSIVE_CAPABILITIES.includes(capability))),
  };
}

export function buildRoutingDecisionWithPreference(
  prompt: string,
  inputMode: AgentInputMode,
  decision: ExecutionDecision,
  proposal: AntTeamProposal | null,
  modelRoutingPreference: ModelRoutingPreference,
  manualModelSelection: ManualModelSelection | null,
): RoutingDecision {
  const routing = buildRoutingDecision(prompt, inputMode, decision, proposal);
  const modelRoutes = routing.modelRoutes.map((route) => applyRoutingPreferenceToResolvedModel(route, modelRoutingPreference, manualModelSelection));
  return {
    ...routing,
    modelRoutes,
    selectedAgents: routing.selectedAgents.map((agent) => ({
      ...agent,
      activeModel: agent.activeModel ? {
        ...agent.activeModel,
        costTier: modelRoutingPreference === 'low_cost' || modelRoutingPreference === 'fast' ? 'low' : modelRoutingPreference === 'best_quality' ? 'high' : agent.activeModel.costTier,
        qualityTier: modelRoutingPreference === 'best_quality' ? 'high' : modelRoutingPreference === 'fast' || modelRoutingPreference === 'low_cost' ? 'standard' : agent.activeModel.qualityTier,
      } : agent.activeModel,
    })),
    modelRoutingPreference,
    manualModelSelection: manualModelSelection ?? undefined,
    reason: `${routing.reason} Model routing: ${modelRoutingLabel(modelRoutingPreference)}.`,
  };
}

export function backendCapabilityForIntent(intent: string): AgentCapability {
  if (intent.includes('workflow')) return 'workflow_automation';
  if (intent.includes('file')) return 'file_reading';
  if (intent.includes('deliverable') || intent.includes('report')) return 'summarization';
  if (intent.includes('external') || intent.includes('action')) return 'connected_tool_action';
  return 'text_reasoning';
}

export function buildBackendRoutingDecision(prompt: string, response: AiAntBackendResponse, modelRoutingPreference: ModelRoutingPreference): RoutingDecision {
  const capability = backendCapabilityForIntent(response.intent);
  const route: ResolvedModel = {
    capability,
    providerMode: response.route_source === 'manual' ? 'manual' : 'auto',
    provider: 'colony',
    modelName: response.model,
    displayName: response.model,
    costTier: response.usage && response.usage.estimated_cost_usd > 0.01 ? 'standard' : 'low',
    qualityTier: response.approval_required ? 'high' : 'standard',
  };
  const skill = createAgentSkill(capability);
  return {
    id: `backend-routing-${response.message_id}`,
    userPrompt: prompt,
    selectedMode: 'auto',
    resolvedMode: response.approval_required ? 'connected_workspace' : response.intent.includes('workflow') ? 'automation' : 'chat',
    confidence: response.confidence,
    reason: `Backend selected ${response.intent.replace(/_/g, ' ')} using ${response.route_source ?? 'router'} routing.`,
    requiredCapabilities: [capability],
    selectedAgents: [{
      id: 'backend-ai-ant',
      name: 'AI Ant',
      role: 'Backend router and executor',
      status: response.status,
      progress: response.status === 'completed' ? 100 : 35,
      skills: [skill],
      activeModel: {
        capability,
        provider: 'colony',
        modelName: response.model,
        mode: response.route_source === 'manual' ? 'manual' : 'auto',
        costTier: route.costTier,
        qualityTier: route.qualityTier,
      },
    }],
    modelRoutes: [route],
    estimatedCredits: response.usage ? Math.max(1, Math.ceil((response.usage.input_tokens + response.usage.output_tokens) / 1000)) : 1,
    modelRoutingPreference,
    backend: {
      intent: response.intent,
      status: response.status,
      model: response.model,
      planId: response.plan_id ?? undefined,
      planName: response.plan_name ?? undefined,
      routeSource: response.route_source ?? undefined,
      approvalRequired: response.approval_required,
      usage: response.usage ? {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        estimatedCostUsd: response.usage.estimated_cost_usd,
      } : undefined,
    },
  };
}

export function applyRoutingPreferenceToResolvedModel(route: ResolvedModel, preference: ModelRoutingPreference, manualModelSelection: ManualModelSelection | null): ResolvedModel {
  if (preference === 'manual' && manualModelSelection && manualModelSelection.capability === route.capability) {
    return {
      ...route,
      providerMode: 'manual',
      provider: manualModelSelection.provider as ModelProvider,
      modelName: manualModelSelection.modelId,
      displayName: manualModelSelection.modelId,
    };
  }
  if (preference === 'fast' || preference === 'low_cost') return { ...route, costTier: 'low', qualityTier: 'standard' };
  if (preference === 'best_quality') return { ...route, costTier: route.costTier === 'low' ? 'standard' : route.costTier, qualityTier: 'high' };
  return route;
}

