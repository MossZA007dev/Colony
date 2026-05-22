import type { AgentCapability, ModelProvider } from './aiOrchestration';

// ── Central model registry ────────────────────────────────────────────────────
// Single source of truth for every model Colony shows in the picker. Each
// entry declares which capabilities it supports — the picker filters here
// instead of consulting per-agent / per-capability hard-coded arrays. This
// fixes the bug where the same capability surfaced different models per agent.
export interface SupportedModel {
  id: string;
  provider: ModelProvider;
  providerLabel: string;
  modelName: string;        // backend / model id (e.g. "deepseek-v3")
  displayName: string;
  shortName?: string;
  capabilities: AgentCapability[];
  description: string;
  tags: string[];
  costTier: 'low' | 'standard' | 'high';
  qualityTier: 'draft' | 'standard' | 'high';
  speedTier?: 'fast' | 'balanced' | 'slow';
  logoProvider?: string;    // ProviderLogo key; defaults to `provider`
}

export const SUPPORTED_MODELS: SupportedModel[] = [
  // DeepSeek
  { id: 'deepseek-v3', provider: 'deepseek', providerLabel: 'DeepSeek', modelName: 'deepseek-v3', displayName: 'DeepSeek V3', shortName: 'V3',
    capabilities: ['text_reasoning', 'summarization', 'data_analysis', 'quality_review', 'code_generation'],
    description: 'Structured reasoning, planning, and drafting.', tags: ['Fast', 'Reasoning', 'Balanced'],
    costTier: 'standard', qualityTier: 'high', speedTier: 'fast' },
  { id: 'deepseek-r1', provider: 'deepseek', providerLabel: 'DeepSeek', modelName: 'deepseek-r1', displayName: 'DeepSeek R1', shortName: 'R1',
    capabilities: ['text_reasoning', 'data_analysis', 'code_generation'],
    description: 'Long-horizon reasoning and analysis.', tags: ['Reasoning', 'Deep think'],
    costTier: 'standard', qualityTier: 'high', speedTier: 'balanced' },
  // Gemini
  { id: 'gemini-2.5-flash', provider: 'gemini', providerLabel: 'Gemini', modelName: 'gemini-2.5-flash', displayName: 'Gemini 2.5 Flash', shortName: '2.5 Flash',
    capabilities: ['text_reasoning', 'summarization', 'quality_review', 'data_analysis', 'web_research'],
    description: 'Balanced, fast, multimodal.', tags: ['Balanced', 'Multimodal', 'Fast'],
    costTier: 'low', qualityTier: 'standard', speedTier: 'fast' },
  { id: 'gemini-2.5-pro', provider: 'gemini', providerLabel: 'Gemini', modelName: 'gemini-2.5-pro', displayName: 'Gemini 2.5 Pro', shortName: '2.5 Pro',
    capabilities: ['text_reasoning', 'summarization', 'quality_review', 'data_analysis', 'code_generation'],
    description: 'Top-tier multimodal reasoning.', tags: ['High quality', 'Multimodal'],
    costTier: 'high', qualityTier: 'high', speedTier: 'balanced' },
  { id: 'nano-banana', provider: 'gemini', providerLabel: 'Gemini', modelName: 'nano-banana', displayName: 'Gemini Nano Banana', shortName: 'Nano Banana',
    capabilities: ['image_generation'],
    description: 'Image generation and editing.', tags: ['Image', 'Creative'],
    costTier: 'standard', qualityTier: 'high', logoProvider: 'gemini' },
  { id: 'veo', provider: 'gemini', providerLabel: 'Gemini', modelName: 'veo', displayName: 'Veo', shortName: 'Veo',
    capabilities: ['video_generation'],
    description: 'High-quality video generation.', tags: ['Video', 'High quality'],
    costTier: 'high', qualityTier: 'high', logoProvider: 'gemini' },
  // OpenAI
  { id: 'gpt-4.1-mini', provider: 'openai', providerLabel: 'OpenAI', modelName: 'gpt-4.1-mini', displayName: 'GPT-4.1 Mini', shortName: '4.1 Mini',
    capabilities: ['text_reasoning', 'summarization', 'data_analysis', 'code_generation', 'quality_review'],
    description: 'Balanced general-purpose model.', tags: ['Balanced', 'Low Cost'],
    costTier: 'low', qualityTier: 'standard', speedTier: 'fast' },
  { id: 'gpt-4.1', provider: 'openai', providerLabel: 'OpenAI', modelName: 'gpt-4.1', displayName: 'GPT-4.1', shortName: '4.1',
    capabilities: ['text_reasoning', 'summarization', 'data_analysis', 'code_generation'],
    description: 'High-quality general-purpose reasoning.', tags: ['High quality'],
    costTier: 'standard', qualityTier: 'high', speedTier: 'balanced' },
  { id: 'gpt-4o-mini', provider: 'openai', providerLabel: 'OpenAI', modelName: 'gpt-4o-mini', displayName: 'GPT-4o Mini', shortName: '4o Mini',
    capabilities: ['text_reasoning', 'summarization', 'data_analysis'],
    description: 'Fast multimodal mini.', tags: ['Fast', 'Multimodal'],
    costTier: 'low', qualityTier: 'standard', speedTier: 'fast' },
  { id: 'gpt-4o', provider: 'openai', providerLabel: 'OpenAI', modelName: 'gpt-4o', displayName: 'GPT-4o', shortName: '4o',
    capabilities: ['text_reasoning', 'summarization', 'data_analysis', 'code_generation'],
    description: 'Multimodal flagship.', tags: ['Multimodal', 'High quality'],
    costTier: 'high', qualityTier: 'high', speedTier: 'balanced' },
  // Perplexity
  { id: 'sonar', provider: 'perplexity', providerLabel: 'Perplexity', modelName: 'sonar', displayName: 'Perplexity Sonar', shortName: 'Sonar',
    capabilities: ['web_research', 'summarization'],
    description: 'Live web research with citations.', tags: ['Research', 'Fast'],
    costTier: 'standard', qualityTier: 'high', speedTier: 'fast' },
  { id: 'sonar-pro', provider: 'perplexity', providerLabel: 'Perplexity', modelName: 'sonar-pro', displayName: 'Perplexity Sonar Pro', shortName: 'Sonar Pro',
    capabilities: ['web_research', 'summarization', 'data_analysis'],
    description: 'Deeper research with broader sources.', tags: ['Research', 'High quality'],
    costTier: 'high', qualityTier: 'high', speedTier: 'balanced' },
  // Anthropic
  { id: 'claude-sonnet', provider: 'anthropic', providerLabel: 'Anthropic', modelName: 'claude-sonnet', displayName: 'Claude Sonnet', shortName: 'Sonnet',
    capabilities: ['text_reasoning', 'summarization', 'quality_review', 'code_generation', 'data_analysis'],
    description: 'Balanced reasoning and writing.', tags: ['Balanced', 'Writing'],
    costTier: 'standard', qualityTier: 'high', speedTier: 'balanced', logoProvider: 'claude' },
  { id: 'claude-haiku', provider: 'anthropic', providerLabel: 'Anthropic', modelName: 'claude-haiku', displayName: 'Claude Haiku', shortName: 'Haiku',
    capabilities: ['text_reasoning', 'summarization', 'quality_review'],
    description: 'Fast quality review and drafting.', tags: ['Fast', 'Low Cost'],
    costTier: 'low', qualityTier: 'standard', speedTier: 'fast', logoProvider: 'claude' },
  // Mistral
  { id: 'mistral-large', provider: 'custom', providerLabel: 'Mistral', modelName: 'mistral-large', displayName: 'Mistral Large', shortName: 'Large',
    capabilities: ['text_reasoning', 'summarization', 'code_generation'],
    description: 'Open-weight high-quality reasoning.', tags: ['Open', 'Reasoning'],
    costTier: 'standard', qualityTier: 'high', logoProvider: 'mistral' },
  { id: 'mistral-small', provider: 'custom', providerLabel: 'Mistral', modelName: 'mistral-small', displayName: 'Mistral Small', shortName: 'Small',
    capabilities: ['text_reasoning', 'summarization'],
    description: 'Open-weight fast model.', tags: ['Open', 'Fast'],
    costTier: 'low', qualityTier: 'standard', logoProvider: 'mistral' },
  // Cohere
  { id: 'command-r', provider: 'custom', providerLabel: 'Cohere', modelName: 'command-r', displayName: 'Command R', shortName: 'Command R',
    capabilities: ['text_reasoning', 'summarization'],
    description: 'Enterprise reasoning.', tags: ['Enterprise', 'Balanced'],
    costTier: 'standard', qualityTier: 'standard', logoProvider: 'cohere' },
  { id: 'command-r-plus', provider: 'custom', providerLabel: 'Cohere', modelName: 'command-r-plus', displayName: 'Command R+', shortName: 'R+',
    capabilities: ['text_reasoning', 'summarization', 'data_analysis'],
    description: 'High-quality enterprise reasoning.', tags: ['Enterprise', 'High quality'],
    costTier: 'high', qualityTier: 'high', logoProvider: 'cohere' },
  // Media
  { id: 'elevenlabs-tts', provider: 'elevenlabs', providerLabel: 'ElevenLabs', modelName: 'elevenlabs-tts', displayName: 'ElevenLabs Voice', shortName: 'Voice',
    capabilities: ['text_to_speech'],
    description: 'Natural-sounding voice synthesis.', tags: ['Voice', 'High quality'],
    costTier: 'standard', qualityTier: 'high' },
  { id: 'runway-video', provider: 'runway', providerLabel: 'Runway', modelName: 'runway-gen', displayName: 'Runway Gen', shortName: 'Runway',
    capabilities: ['video_generation'],
    description: 'Creative video generation.', tags: ['Video', 'Creative'],
    costTier: 'high', qualityTier: 'high' },
  { id: 'pika-video', provider: 'pika', providerLabel: 'Pika', modelName: 'pika-video', displayName: 'Pika Video', shortName: 'Pika',
    capabilities: ['video_generation'],
    description: 'Fast short-form video.', tags: ['Video', 'Fast'],
    costTier: 'standard', qualityTier: 'standard' },
  // Connected Workspace (tool-actions)
  { id: 'connected-workspace', provider: 'colony', providerLabel: 'Colony Bridge', modelName: 'connected-workspace', displayName: 'Colony Bridge Tool', shortName: 'Bridge',
    capabilities: ['file_reading', 'browser_action', 'connected_tool_action', 'workflow_automation'],
    description: 'Bridge AI Ant to files, apps, browser, and connected tools after approval.', tags: ['Bridge', 'Approval'],
    costTier: 'low', qualityTier: 'standard' },
];
