import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, ChevronRight, Loader2, Plus, Search, X } from 'lucide-react';
import { ProviderLogo } from './ProviderLogo';
import { CUSTOM_MODELS_STORAGE_KEY, loadCustomModels } from '../../lib/profile/customModels';
import { CAPABILITY_LABELS, CAPABILITY_ROUTES, createAgentSkill, resolveModelForCapability, routeCapability, type AgentCapability, type AgentModelConfig, type AgentSkill, type ModelConfig, type ModelProvider } from '../../lib/aiOrchestration';
import { SUPPORTED_MODELS, type SupportedModel } from '../../lib/modelCatalog';
import { MANUAL_PROVIDERS, MODEL_DESCRIPTIONS, MODEL_TAGS, PROVIDER_LABELS, ModelCard, compatibleModelsForCapability, defaultActiveModel, modelConfigFromResolved, providerIcon, resolveAutoModel, resolveSkillModel, supportedModelsForCapability, supportedToAgentConfig } from '../../lib/modelDisplay';
import type { CustomModelEntry } from '../../lib/types/appTypes';

const ALL_CAPABILITIES = Object.keys(CAPABILITY_LABELS) as AgentCapability[];


export function ModelPickerModal({ title, skill, activeModel, onSave, onClose }: {
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


export function ModelProviderSettingsModal({
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
