import React from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  CAPABILITY_LABELS,
  CAPABILITY_ROUTES,
  EXPENSIVE_CAPABILITIES,
  createAgentSkill,
  resolveModelForCapability,
  routeCapability,
  type AgentCapability,
  type AgentModelConfig,
  type AgentSkill,
  type ModelConfig,
  type ModelProvider,
  type ResolvedModel,
} from './aiOrchestration';
import { SUPPORTED_MODELS, type SupportedModel } from './modelCatalog';
import { ProviderLogo } from '../components/model/ProviderLogo';

export { EXPENSIVE_CAPABILITIES };

export const PROVIDER_LABELS: Record<ModelProvider, string> = {
  auto: 'Auto',
  colony: 'Colony',
  openai: 'OpenAI',
  gemini: 'Gemini',
  deepseek: 'DeepSeek',
  perplexity: 'Perplexity',
  anthropic: 'Anthropic',
  elevenlabs: 'ElevenLabs',
  runway: 'Runway',
  pika: 'Pika',
  custom: 'Custom',
};

export const MANUAL_PROVIDERS = Object.keys(PROVIDER_LABELS).filter((p) => p !== 'auto') as ModelProvider[];

export function inferCapabilitiesFromText(...parts: Array<string | string[] | undefined>): AgentCapability[] {
  const text = parts.flatMap((part) => Array.isArray(part) ? part : [part]).filter(Boolean).join(' ').toLowerCase();
  const caps = new Set<AgentCapability>();
  if (/research|source|web|competitor|market|search/.test(text)) caps.add('web_research');
  if (/summar|brief|writer|report|content|draft|caption|script/.test(text)) caps.add('summarization');
  if (/analyst|analysis|data|metric|sales|finance|spreadsheet|insight/.test(text)) caps.add('data_analysis');
  if (/write|reason|strategy|manager|director|plan|product|support/.test(text)) caps.add('text_reasoning');
  if (/image|visual|design|creative|storyboard/.test(text)) caps.add('image_generation');
  if (/video|reel|tiktok|short/.test(text)) caps.add('video_generation');
  if (/voice|audio|speech|tts|voice-over/.test(text)) caps.add('text_to_speech');
  if (/file|screenshot|drive|pdf|csv|folder/.test(text)) caps.add('file_reading');
  if (/browser|website|page/.test(text)) caps.add('browser_action');
  if (/connector|gmail|slack|sheets|tool|send|publish|external/.test(text)) caps.add('connected_tool_action');
  if (/workflow|automation|schedule|recurring|repeat/.test(text)) caps.add('workflow_automation');
  if (/review|quality|checker|approval|fact/.test(text)) caps.add('quality_review');
  return caps.size ? Array.from(caps) : ['text_reasoning'];
}

export function skillsForCapabilities(capabilities: AgentCapability[]): AgentSkill[] {
  return Array.from(new Set(capabilities)).map((capability) => createAgentSkill(capability));
}

export function defaultActiveModel(skills?: AgentSkill[]): ModelConfig | undefined {
  return skills?.[0] ? routeCapability(skills[0].capability, { provider: skills[0].provider, modelName: skills[0].modelName }) : undefined;
}

export function resolveSkillModel(skillOrCapability: AgentSkill | AgentCapability, activeModel?: ModelConfig): ResolvedModel {
  const capability = typeof skillOrCapability === 'string' ? skillOrCapability : skillOrCapability.capability;
  if (activeModel?.capability === capability) return resolveModelForCapability(capability, activeModel);
  if (typeof skillOrCapability !== 'string') {
    return resolveModelForCapability(capability, {
      provider: skillOrCapability.provider,
      modelName: skillOrCapability.modelName,
      mode: skillOrCapability.mode,
    });
  }
  return resolveModelForCapability(capability);
}

export function shortResolvedModelName(model: ResolvedModel) {
  return model.displayName
    .replace('Perplexity ', '')
    .replace('DeepSeek ', '')
    .replace('Gemini ', '')
    .replace('ElevenLabs ', '')
    .replace('Colony Bridge Tool', 'Colony Bridge');
}

export const MODEL_DESCRIPTIONS: Record<AgentCapability, string> = {
  text_reasoning: 'Structured reasoning, planning, and drafting.',
  web_research: 'Live research and source-aware discovery.',
  summarization: 'Fast summaries, synthesis, and review.',
  code_generation: 'Code generation and technical implementation.',
  data_analysis: 'Lightweight analysis, tables, and metrics.',
  image_generation: 'Visual concepts and generated image drafts.',
  video_generation: 'Short video drafts and motion concepts.',
  text_to_speech: 'Voice-over and spoken audio generation.',
  file_reading: 'Read-only workspace and file parsing.',
  browser_action: 'Browser tool use with approval checkpoints.',
  connected_tool_action: 'Connected workspace actions with approval.',
  workflow_automation: 'Workflow planning and automation steps.',
  quality_review: 'Quality, consistency, and fact review.',
};

export const MODEL_TAGS: Record<ModelConfig['costTier'] | ModelConfig['qualityTier'], string> = {
  low: 'Low Cost',
  standard: 'Balanced',
  high: 'High quality',
  draft: 'Draft',
};

export function providerIcon(provider: ModelProvider) {
  const labels: Record<ModelProvider, string> = {
    auto: 'A', colony: 'C', openai: 'O', gemini: 'G', deepseek: 'D',
    perplexity: 'P', anthropic: 'A', elevenlabs: 'E', runway: 'R', pika: 'P', custom: 'C',
  };
  return labels[provider];
}

export function modelConfigFromResolved(model: ResolvedModel): AgentModelConfig {
  return {
    capability: model.capability,
    routingMode: model.providerMode,
    provider: model.provider,
    modelId: model.modelName,
    modelName: model.displayName,
    description: MODEL_DESCRIPTIONS[model.capability],
    tags: [MODEL_TAGS[model.costTier], MODEL_TAGS[model.qualityTier]].filter(Boolean),
    fallbackModel: model.fallbackModelName,
    costTier: model.costTier,
    qualityTier: model.qualityTier,
  };
}

export function supportedModelsForCapability(capability: AgentCapability): SupportedModel[] {
  return SUPPORTED_MODELS.filter((m) => m.capabilities.includes(capability));
}

export function supportedToAgentConfig(m: SupportedModel, capability: AgentCapability, mode: 'auto' | 'manual' = 'manual'): AgentModelConfig {
  const route = CAPABILITY_ROUTES[capability];
  return {
    capability,
    routingMode: mode,
    provider: m.provider,
    modelId: m.modelName,
    modelName: m.displayName,
    description: m.description,
    tags: m.tags,
    fallbackModel: route?.fallbackModelName,
    costTier: m.costTier,
    qualityTier: m.qualityTier,
  };
}

export function resolveAutoModel(capability: AgentCapability): SupportedModel {
  const route = CAPABILITY_ROUTES[capability];
  const compatible = supportedModelsForCapability(capability);
  if (route) {
    for (const providerKey of [...route.preferred, ...route.fallback]) {
      const hit = compatible.find((m) => m.provider === providerKey);
      if (hit) return hit;
    }
  }
  return compatible[0] ?? SUPPORTED_MODELS[0];
}

export function compatibleModelsForCapability(capability: AgentCapability): AgentModelConfig[] {
  const route = CAPABILITY_ROUTES[capability];
  const all = supportedModelsForCapability(capability);
  const rank = (m: SupportedModel) => {
    if (!route) return 99;
    const p = route.preferred.indexOf(m.provider);
    if (p >= 0) return p;
    const f = route.fallback.indexOf(m.provider);
    return f >= 0 ? 50 + f : 90;
  };
  return all
    .slice()
    .sort((a, b) => rank(a) - rank(b))
    .map((m) => supportedToAgentConfig(m, capability));
}

export function skillSummary(skills?: AgentSkill[] | AgentCapability[] | string[]) {
  const first = skills?.[0];
  if (!first) return { label: 'Text Reasoning', provider: 'Auto', capability: 'text_reasoning' as AgentCapability };
  if (typeof first === 'string') {
    const maybeCapability = first as AgentCapability;
    const capability = CAPABILITY_LABELS[maybeCapability] ? maybeCapability : inferCapabilitiesFromText(first)[0];
    return { label: CAPABILITY_LABELS[capability], provider: 'Auto', capability };
  }
  return { label: first.label, provider: PROVIDER_LABELS[first.provider], capability: first.capability };
}

export function ModelChip({ model, capability }: { model: ResolvedModel; capability?: AgentCapability }) {
  return (
    <div className="mt-2 inline-flex max-w-full items-center gap-2 rounded-[11px] border border-white/[0.08] bg-white/[0.035] px-2.5 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
      <ProviderLogo provider={model.provider} size="sm" />
      <span className="min-w-0">
        <span className="block truncate text-[11px] font-bold text-white/82">{shortResolvedModelName(model)}</span>
        <span className="block truncate text-[9px] font-semibold text-white/38">{CAPABILITY_LABELS[capability ?? model.capability]} · {model.providerMode === 'auto' ? 'Auto' : 'Manual'}</span>
      </span>
    </div>
  );
}

export function ModelCard({ model, capability, expanded = false, selected = false, onChange, onSelect }: {
  model: ResolvedModel | AgentModelConfig;
  capability?: AgentCapability;
  expanded?: boolean;
  selected?: boolean;
  onChange?: () => void;
  onSelect?: () => void;
}) {
  const cap = capability ?? model.capability;
  const provider = 'provider' in model ? model.provider : 'custom';
  const routingMode = 'providerMode' in model ? model.providerMode : model.routingMode;
  const modelName = 'displayName' in model ? model.displayName : model.modelName;
  const modelId = 'displayName' in model ? model.modelName : model.modelId;
  const description = 'description' in model && model.description ? model.description : MODEL_DESCRIPTIONS[cap];
  const tags = 'tags' in model && model.tags ? model.tags : [MODEL_TAGS[model.costTier ?? 'standard'], MODEL_TAGS[model.qualityTier ?? 'standard']];
  const fallback = 'displayName' in model ? model.fallbackModelName : model.fallbackModel;
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -1 }}
      className={`w-full rounded-[14px] border p-3 text-left transition ${selected ? 'border-emerald-300/35 bg-emerald-400/[0.08] shadow-[0_0_28px_rgba(52,211,153,0.16)]' : 'border-white/[0.08] bg-white/[0.035] hover:border-white/[0.14] hover:bg-white/[0.055]'}`}
    >
      <div className="flex items-start gap-3">
        <ProviderLogo provider={provider} size="md" />
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-white/88">{modelName}</span>
              <span className="mt-0.5 block text-[11px] font-semibold text-white/42">{CAPABILITY_LABELS[cap]} · {routingMode === 'auto' ? 'Auto selected' : 'Manual override'}</span>
            </span>
            {selected && <Check size={15} className="mt-0.5 shrink-0 text-emerald-200" />}
          </span>
          {expanded && <span className="mt-2 block text-xs leading-relaxed text-white/48">{description}</span>}
          <span className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full border border-white/[0.08] px-2 py-0.5 text-[9px] font-bold text-white/38">{PROVIDER_LABELS[provider]}</span>
            {tags.slice(0, expanded ? 4 : 2).map((tag) => <span key={tag} className="rounded-full border border-white/[0.08] px-2 py-0.5 text-[9px] font-bold text-white/38">{tag}</span>)}
          </span>
          {expanded && (
            <span className="mt-3 grid gap-1 text-[10px] text-white/35">
              <span>Model ID: {modelId}</span>
              {fallback && <span>Fallback: {fallback}</span>}
              <span>Cost: {model.costTier ?? 'standard'} · Quality: {model.qualityTier ?? 'standard'}</span>
            </span>
          )}
        </span>
        {onChange && (
          <span
            onClick={(e) => { e.stopPropagation(); onChange(); }}
            className="shrink-0 rounded-[9px] border border-white/[0.10] px-2.5 py-1 text-[10px] font-bold text-white/45 hover:bg-white/[0.06] hover:text-white"
          >
            Change
          </span>
        )}
      </div>
    </motion.button>
  );
}

export function ModelRoutingSummary({ skills, activeModel, onChange }: { skills: AgentSkill[]; activeModel?: ModelConfig; onChange?: (skill: AgentSkill) => void }) {
  return (
    <div className="space-y-2">
      {skills.map((skill) => (
        <ModelCard
          key={skill.id}
          model={resolveSkillModel(skill, activeModel)}
          capability={skill.capability}
          expanded
          onChange={onChange ? () => onChange(skill) : undefined}
        />
      ))}
    </div>
  );
}

export function SkillModelPills({ skills, activeModel, compact = false }: { skills?: AgentSkill[] | AgentCapability[] | string[]; activeModel?: ModelConfig; compact?: boolean }) {
  const summary = skillSummary(skills);
  const first = skills?.[0];
  const resolved = resolveSkillModel(
    typeof first === 'string' && !CAPABILITY_LABELS[first as AgentCapability] ? summary.capability : (first as AgentSkill | AgentCapability | undefined) ?? summary.capability,
    activeModel,
  );
  return compact ? <ModelChip model={resolved} capability={summary.capability} /> : <ModelCard model={resolved} capability={summary.capability} />;
}

export function CapabilityLine({ capability, activeModel }: { capability: AgentCapability; activeModel?: ModelConfig }) {
  const route = CAPABILITY_ROUTES[capability];
  const resolved = resolveModelForCapability(capability, activeModel?.capability === capability ? activeModel : undefined);
  return (
    <div className="rounded-[10px] border border-white/[0.07] bg-white/[0.025] px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-white/75">{CAPABILITY_LABELS[capability]}</span>
        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${resolved.providerMode === 'auto' ? 'border-emerald-300/18 bg-emerald-400/[0.08] text-emerald-100' : 'border-amber-300/20 bg-amber-400/[0.08] text-amber-100'}`}>
          {resolved.providerMode === 'auto' ? 'Auto' : 'Manual'} {'->'} {resolved.displayName}
        </span>
      </div>
      <p className="mt-1 text-[10px] text-white/35">Preferred: {route.preferred.map((p) => PROVIDER_LABELS[p]).join(' / ')}{route.approvalRequired ? ' · Approval required' : ''}</p>
    </div>
  );
}
