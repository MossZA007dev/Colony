export type AgentCapability =
  | 'text_reasoning'
  | 'web_research'
  | 'summarization'
  | 'code_generation'
  | 'data_analysis'
  | 'image_generation'
  | 'video_generation'
  | 'text_to_speech'
  | 'file_reading'
  | 'browser_action'
  | 'connected_tool_action'
  | 'workflow_automation'
  | 'quality_review';

export type ModelProvider =
  | 'auto'
  | 'colony'
  | 'openai'
  | 'gemini'
  | 'deepseek'
  | 'perplexity'
  | 'anthropic'
  | 'elevenlabs'
  | 'runway'
  | 'pika'
  | 'custom';

export type ModelConfig = {
  provider: ModelProvider;
  modelName: string;
  capability: AgentCapability;
  mode: 'auto' | 'manual';
  costTier: 'low' | 'standard' | 'high';
  qualityTier: 'draft' | 'standard' | 'high';
};

export type ResolvedModel = {
  capability: AgentCapability;
  providerMode: 'auto' | 'manual';
  provider: ModelProvider;
  modelName: string;
  displayName: string;
  fallbackProvider?: ModelProvider;
  fallbackModelName?: string;
  costTier: ModelConfig['costTier'];
  qualityTier: ModelConfig['qualityTier'];
};

export type AgentModelConfig = {
  capability: AgentCapability;
  routingMode: 'auto' | 'manual';
  provider: ModelProvider;
  modelId: string;
  modelName: string;
  description?: string;
  tags?: string[];
  fallbackModel?: string;
  costTier?: ModelConfig['costTier'];
  qualityTier?: ModelConfig['qualityTier'];
};

export type RoutingDecisionMode =
  | 'auto'
  | 'chat'
  | 'colony_crew'
  | 'one_man_enterprise'
  | 'automation'
  | 'connected_workspace';

export type RoutingDecision = {
  id: string;
  userPrompt: string;
  selectedMode: RoutingDecisionMode;
  resolvedMode: Exclude<RoutingDecisionMode, 'auto'>;
  confidence: number;
  reason: string;
  requiredCapabilities: AgentCapability[];
  selectedAgents: ColonyAgent[];
  modelRoutes: ResolvedModel[];
  estimatedCredits?: number;
  modelRoutingPreference?: string;
  backend?: {
    intent: string;
    status: string;
    model: string;
    planId?: string;
    planName?: string;
    routeSource?: string;
    approvalRequired: boolean;
    usage?: {
      inputTokens: number;
      outputTokens: number;
      estimatedCostUsd: number;
    };
  };
  manualModelSelection?: {
    capability: string;
    provider: string;
    modelId: string;
  };
};

export type AgentSkill = {
  id: string;
  capability: AgentCapability;
  label: string;
  provider: ModelProvider;
  modelName?: string;
  mode: 'auto' | 'manual';
};

export type ArtifactType =
  | 'text'
  | 'image'
  | 'audio'
  | 'video'
  | 'file'
  | 'spreadsheet'
  | 'report';

export type Artifact = {
  id: string;
  type: ArtifactType;
  title: string;
  url?: string;
  content?: string;
  createdByAgentId?: string;
  provider?: ModelProvider;
  modelName?: string;
  createdAt: string;
};

export type ProviderRunInput = {
  capability: AgentCapability;
  prompt: string;
  context?: string;
  files?: string[];
  options?: Record<string, unknown>;
};

export type ProviderRunResult = {
  text?: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  artifacts?: Artifact[];
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    estimatedCost?: number;
  };
};

export type ProviderAdapter = {
  id: ModelProvider;
  name: string;
  supports: AgentCapability[];
  run: (input: ProviderRunInput) => Promise<ProviderRunResult>;
};

export type ColonyAgent = {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  status: string;
  progress: number;
  skills: AgentSkill[];
  activeModel?: ModelConfig;
};

export type CapabilityRoute = {
  capability: AgentCapability;
  preferred: ModelProvider[];
  fallback: ModelProvider[];
  approvalRequired?: boolean;
  costTier: ModelConfig['costTier'];
  qualityTier: ModelConfig['qualityTier'];
  defaultModelName: string;
  defaultDisplayName: string;
  fallbackModelName?: string;
};

export const CAPABILITY_LABELS: Record<AgentCapability, string> = {
  text_reasoning: 'Text Reasoning',
  web_research: 'Web Research',
  summarization: 'Summarization',
  code_generation: 'Code Generation',
  data_analysis: 'Data Analysis',
  image_generation: 'Image Gen',
  video_generation: 'Video Gen',
  text_to_speech: 'Voice',
  file_reading: 'File Reading',
  browser_action: 'Browser Action',
  connected_tool_action: 'Connected Tool',
  workflow_automation: 'Automation',
  quality_review: 'Quality Review',
};

export const CAPABILITY_ROUTES: Record<AgentCapability, CapabilityRoute> = {
  web_research: {
    capability: 'web_research',
    preferred: ['perplexity'],
    fallback: ['gemini', 'openai'],
    costTier: 'standard',
    qualityTier: 'high',
    defaultModelName: 'sonar',
    defaultDisplayName: 'Perplexity Sonar',
    fallbackModelName: 'Gemini Search',
  },
  text_reasoning: {
    capability: 'text_reasoning',
    preferred: ['deepseek', 'gemini', 'openai'],
    fallback: ['openai', 'gemini'],
    costTier: 'standard',
    qualityTier: 'standard',
    defaultModelName: 'deepseek-v3',
    defaultDisplayName: 'DeepSeek V3',
    fallbackModelName: 'Gemini 2.5 Flash',
  },
  summarization: {
    capability: 'summarization',
    preferred: ['gemini', 'deepseek', 'openai'],
    fallback: ['openai'],
    costTier: 'low',
    qualityTier: 'standard',
    defaultModelName: 'gemini-2.5-flash',
    defaultDisplayName: 'Gemini 2.5 Flash',
  },
  code_generation: {
    capability: 'code_generation',
    preferred: ['openai', 'anthropic', 'deepseek'],
    fallback: ['gemini'],
    costTier: 'standard',
    qualityTier: 'high',
    defaultModelName: 'gpt-4.1-mini',
    defaultDisplayName: 'GPT-4.1 Mini',
    fallbackModelName: 'Gemini 2.5 Flash',
  },
  data_analysis: {
    capability: 'data_analysis',
    preferred: ['openai', 'gemini', 'deepseek'],
    fallback: ['openai'],
    costTier: 'standard',
    qualityTier: 'high',
    defaultModelName: 'gpt-4.1-mini',
    defaultDisplayName: 'GPT-4.1 Mini',
  },
  image_generation: {
    capability: 'image_generation',
    preferred: ['gemini', 'custom'],
    fallback: ['custom'],
    costTier: 'standard',
    qualityTier: 'high',
    defaultModelName: 'nano-banana',
    defaultDisplayName: 'Gemini Nano Banana',
  },
  video_generation: {
    capability: 'video_generation',
    preferred: ['gemini', 'runway', 'pika'],
    fallback: ['custom'],
    costTier: 'high',
    qualityTier: 'high',
    defaultModelName: 'veo',
    defaultDisplayName: 'Veo',
  },
  text_to_speech: {
    capability: 'text_to_speech',
    preferred: ['elevenlabs', 'openai', 'custom'],
    fallback: ['custom'],
    costTier: 'standard',
    qualityTier: 'high',
    defaultModelName: 'elevenlabs-tts',
    defaultDisplayName: 'ElevenLabs Voice',
  },
  file_reading: {
    capability: 'file_reading',
    preferred: ['colony'],
    fallback: ['custom'],
    costTier: 'low',
    qualityTier: 'standard',
    defaultModelName: 'connected-workspace',
    defaultDisplayName: 'Colony Bridge Tool',
    fallbackModelName: 'Local Parser',
  },
  browser_action: {
    capability: 'browser_action',
    preferred: ['colony'],
    fallback: ['custom'],
    approvalRequired: true,
    costTier: 'low',
    qualityTier: 'standard',
    defaultModelName: 'browser-connector',
    defaultDisplayName: 'Browser Connector',
  },
  connected_tool_action: {
    capability: 'connected_tool_action',
    preferred: ['colony'],
    fallback: ['custom'],
    approvalRequired: true,
    costTier: 'low',
    qualityTier: 'standard',
    defaultModelName: 'connected-workspace',
    defaultDisplayName: 'Colony Bridge Tool',
  },
  workflow_automation: {
    capability: 'workflow_automation',
    preferred: ['openai', 'gemini'],
    fallback: ['deepseek'],
    approvalRequired: true,
    costTier: 'standard',
    qualityTier: 'standard',
    defaultModelName: 'gpt-4.1-mini',
    defaultDisplayName: 'GPT-4.1 Mini',
    fallbackModelName: 'DeepSeek V3',
  },
  quality_review: {
    capability: 'quality_review',
    preferred: ['gemini', 'openai', 'anthropic'],
    fallback: ['deepseek'],
    costTier: 'standard',
    qualityTier: 'high',
    defaultModelName: 'gemini-2.5-flash',
    defaultDisplayName: 'Gemini 2.5 Flash',
    fallbackModelName: 'DeepSeek V3',
  },
};

export const EXPENSIVE_CAPABILITIES: AgentCapability[] = ['image_generation', 'video_generation', 'text_to_speech'];

export function routeCapability(capability: AgentCapability, override?: Partial<ModelConfig>): ModelConfig {
  const route = CAPABILITY_ROUTES[capability];
  const provider = override?.provider ?? 'auto';
  return {
    provider,
    modelName: override?.modelName ?? route.defaultModelName,
    capability,
    mode: override?.mode ?? (provider === 'auto' ? 'auto' : 'manual'),
    costTier: override?.costTier ?? route.costTier,
    qualityTier: override?.qualityTier ?? route.qualityTier,
  };
}

const titleProvider = (provider: ModelProvider) => provider.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export function resolveModelForCapability(capability: AgentCapability, preferences?: Partial<ModelConfig>): ResolvedModel {
  const route = CAPABILITY_ROUTES[capability];
  const providerMode = preferences?.mode ?? (preferences?.provider && preferences.provider !== 'auto' ? 'manual' : 'auto');
  const provider = providerMode === 'manual' && preferences?.provider && preferences.provider !== 'auto'
    ? preferences.provider
    : route.preferred[0];
  const modelName = providerMode === 'manual'
    ? (preferences?.modelName || route.defaultModelName)
    : route.defaultModelName;
  const displayName = providerMode === 'manual'
    ? (preferences?.modelName || `${titleProvider(provider)} ${route.defaultModelName}`)
    : route.defaultDisplayName;
  return {
    capability,
    providerMode,
    provider,
    modelName,
    displayName,
    fallbackProvider: route.fallback[0],
    fallbackModelName: route.fallbackModelName,
    costTier: preferences?.costTier ?? route.costTier,
    qualityTier: preferences?.qualityTier ?? route.qualityTier,
  };
}

export function createAgentSkill(capability: AgentCapability, provider: ModelProvider = 'auto', modelName?: string): AgentSkill {
  return {
    id: `skill-${capability}`,
    capability,
    label: CAPABILITY_LABELS[capability],
    provider,
    modelName,
    mode: provider === 'auto' ? 'auto' : 'manual',
  };
}

export function estimateCapabilityCredits(capabilities: AgentCapability[]): number {
  return capabilities.reduce((sum, capability) => {
    if (capability === 'video_generation') return sum + 18;
    if (capability === 'image_generation') return sum + 4;
    if (capability === 'text_to_speech') return sum + 6;
    if (capability === 'web_research') return sum + 2;
    return sum + 1;
  }, 0);
}

const makeMockAdapter = (id: ModelProvider, name: string, supports: AgentCapability[]): ProviderAdapter => ({
  id,
  name,
  supports,
  async run(input) {
    const config = routeCapability(input.capability, { provider: id });
    // TODO(api): replace this mock with real provider SDK/API calls and usage accounting.
    const artifactType: ArtifactType =
      input.capability === 'image_generation' ? 'image' :
      input.capability === 'video_generation' ? 'video' :
      input.capability === 'text_to_speech' ? 'audio' :
      input.capability === 'data_analysis' ? 'spreadsheet' :
      input.capability === 'workflow_automation' ? 'file' :
      'text';
    return {
      text: `Mock ${name} result for ${CAPABILITY_LABELS[input.capability]}: ${input.prompt.slice(0, 120)}`,
      imageUrl: artifactType === 'image' ? 'mock://image/generated-placeholder.png' : undefined,
      videoUrl: artifactType === 'video' ? 'mock://video/generated-placeholder.mp4' : undefined,
      audioUrl: artifactType === 'audio' ? 'mock://audio/generated-placeholder.mp3' : undefined,
      artifacts: [{
        id: `artifact-${Date.now()}`,
        type: artifactType,
        title: `${CAPABILITY_LABELS[input.capability]} artifact`,
        content: artifactType === 'text' ? `Mock artifact created by ${name}.` : undefined,
        provider: id,
        modelName: config.modelName,
        createdAt: new Date().toISOString(),
      }],
      usage: {
        promptTokens: 420,
        completionTokens: 260,
        totalTokens: 680,
        estimatedCost: config.costTier === 'high' ? 1.25 : config.costTier === 'standard' ? 0.22 : 0.04,
      },
    };
  },
});

export const MOCK_PROVIDER_ADAPTERS: ProviderAdapter[] = [
  makeMockAdapter('colony', 'Colony Bridge', ['file_reading', 'browser_action', 'connected_tool_action']),
  makeMockAdapter('openai', 'OpenAI', ['text_reasoning', 'summarization', 'code_generation', 'data_analysis', 'text_to_speech', 'quality_review', 'workflow_automation']),
  makeMockAdapter('gemini', 'Gemini', ['text_reasoning', 'web_research', 'summarization', 'data_analysis', 'image_generation', 'video_generation', 'workflow_automation', 'quality_review']),
  makeMockAdapter('deepseek', 'DeepSeek', ['text_reasoning', 'summarization', 'code_generation', 'data_analysis']),
  makeMockAdapter('perplexity', 'Perplexity', ['web_research', 'summarization']),
  makeMockAdapter('anthropic', 'Anthropic', ['text_reasoning', 'code_generation', 'quality_review']),
  makeMockAdapter('elevenlabs', 'ElevenLabs', ['text_to_speech']),
  makeMockAdapter('runway', 'Runway', ['video_generation']),
  makeMockAdapter('pika', 'Pika', ['video_generation']),
  makeMockAdapter('custom', 'Custom adapter', ['file_reading', 'browser_action', 'connected_tool_action', 'image_generation', 'video_generation', 'text_to_speech']),
];
