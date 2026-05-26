import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Brain,
  Layers3,
  FileText,
  StickyNote,
  Scale,
  FolderOpen,
  Sparkles,
  Globe,
  Users,
  Clock3,
  PenLine,
  Eye,
  Square,
  X,
  Search,
  Database,
  Plus,
  AlertTriangle,
  Link as LinkIcon,
  ShieldCheck
} from 'lucide-react';
import { OSPageShell } from '../../components/shared/OSPageShell';

export type KnowledgeType =
  | 'global_memory' | 'project_knowledge' | 'file' | 'note' | 'decision' | 'source' | 'agent_learning';
export type KnowledgeStatus = 'active' | 'pinned' | 'approval_required' | 'archived' | 'disabled';

export type KnowledgeItem = {
  id: string;
  title: string;
  type: KnowledgeType;
  scope: 'global' | 'project';
  projectId?: string;
  projectName?: string;
  summary: string;
  content: string;
  tags: string[];
  status: KnowledgeStatus;
  usedByAgents: string[];
  sourceUrl?: string;
  fileName?: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  requiresApproval?: boolean;
};

const KNOWLEDGE_LS_KEY = 'colony.knowledge.v1';
const KNOWLEDGE_PROJECTS = ['Daily Sales Report', 'Market Launch', 'Mango Kitchen'];

const KNOW_TYPE_META: Record<KnowledgeType, { label: string; tone: string; Icon: React.ElementType }> = {
  global_memory:     { label: 'Global Memory',     tone: 'border-violet-400/30 bg-violet-400/10 text-violet-300',  Icon: Brain },
  project_knowledge: { label: 'Project Knowledge', tone: 'border-blue-400/30 bg-blue-400/10 text-blue-300',      Icon: Layers3 },
  file:              { label: 'File',              tone: 'border-sky-400/30 bg-sky-400/10 text-sky-300',         Icon: FileText },
  note:              { label: 'Note',              tone: 'border-white/15 bg-white/[0.06] text-white/60',        Icon: StickyNote },
  decision:          { label: 'Decision',          tone: 'border-amber-400/30 bg-amber-400/10 text-amber-300',   Icon: Scale },
  source:            { label: 'Source',            tone: 'border-sky-400/30 bg-sky-400/10 text-sky-300',         Icon: FolderOpen },
  agent_learning:    { label: 'Agent Learning',    tone: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300', Icon: Sparkles },
};

const KNOW_STATUS_META: Record<KnowledgeStatus, { label: string; tone: string }> = {
  active:            { label: 'Active',            tone: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' },
  pinned:            { label: 'Pinned',            tone: 'border-violet-400/30 bg-violet-400/10 text-violet-300' },
  approval_required: { label: 'Approval required', tone: 'border-amber-400/30 bg-amber-400/10 text-amber-300' },
  archived:          { label: 'Archived',          tone: 'border-white/12 bg-white/[0.04] text-white/35' },
  disabled:          { label: 'Disabled',          tone: 'border-red-400/25 bg-red-400/10 text-red-300/70' },
};

const KNOWLEDGE_CATEGORIES: Array<{ id: KnowledgeType | 'all' | 'archived'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'global_memory', label: 'Global Memory' },
  { id: 'project_knowledge', label: 'Project Knowledge' },
  { id: 'file', label: 'Files' },
  { id: 'note', label: 'Notes' },
  { id: 'decision', label: 'Decisions' },
  { id: 'source', label: 'Sources' },
  { id: 'agent_learning', label: 'Agent Learnings' },
  { id: 'archived', label: 'Archived' },
];

const NOW_ISO = () => new Date().toISOString();
const fmtDate = (iso?: string) => iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const DEFAULT_KNOWLEDGE_ITEMS: KnowledgeItem[] = [
  {
    id: 'k-1', title: 'Mango Kitchen reporting rules', type: 'global_memory', scope: 'global',
    summary: 'Revenue, cost, margin, and delivery platform fields should be preserved in summaries.',
    content: 'When summarising sales or finance data for Mango Kitchen, never drop the revenue, cost, margin, or delivery-platform breakdown. Round currency to 2 decimals and keep platform names verbatim.',
    tags: ['reporting', 'finance', 'mango-kitchen'], status: 'pinned',
    usedByAgents: ['Analyst Agent', 'Report Writer', 'Approval Guard', 'AI Ant'],
    createdAt: '2026-04-02T09:00:00.000Z', updatedAt: '2026-05-10T09:00:00.000Z', lastUsedAt: '2026-05-17T09:00:00.000Z',
  },
  {
    id: 'k-2', title: 'Daily Sales source folder', type: 'source', scope: 'project',
    projectName: 'Daily Sales Report',
    summary: 'Approved folder for read-only sales CSV and spreadsheet imports.',
    content: 'Read-only connector pointing at the approved Daily Sales folder. Agents may import CSV/XLSX but must not write back.',
    tags: ['sales', 'source', 'csv'], status: 'active',
    usedByAgents: ['Analyst Agent', 'AI Ant'],
    sourceUrl: 'drive://projects/daily-sales-report/approved_sources',
    createdAt: '2026-05-01T09:00:00.000Z', updatedAt: '2026-05-01T09:00:00.000Z', lastUsedAt: '2026-05-20T09:00:00.000Z',
  },
  {
    id: 'k-3', title: 'LinkedIn format requirements', type: 'global_memory', scope: 'global',
    summary: 'Short content, max 3 hashtags, first line hook, no link in post text.',
    content: 'All generated social copy for LinkedIn must: 1. Keep paragraph lengths under 3 lines. 2. Limit hashtags to exactly 3. 3. Put links in comments, never in the post body. 4. Use a strong question or statistics-based hook in line 1.',
    tags: ['social-media', 'copywriting', 'linkedin'], status: 'active',
    usedByAgents: ['Copywriter Agent', 'Social Coordinator', 'AI Ant'],
    createdAt: '2026-05-03T09:00:00.000Z', updatedAt: '2026-05-03T09:00:00.000Z', lastUsedAt: '2026-05-19T09:00:00.000Z',
  },
  {
    id: 'k-4', title: 'Market Launch competitor notes', type: 'note', scope: 'project',
    projectName: 'Market Launch',
    summary: 'Notes about competitor positioning, pricing, and customer segments.',
    content: 'Competitor A leads on price, Competitor B on brand. Mid-market segment underserved. Use this to frame positioning and pricing tiers.',
    tags: ['competitors', 'positioning', 'pricing'], status: 'active',
    usedByAgents: ['Research Agent', 'Strategy Agent'],
    createdAt: '2026-05-05T09:00:00.000Z', updatedAt: '2026-05-14T09:00:00.000Z',
  },
  {
    id: 'k-5', title: 'Customer interview source', type: 'file', scope: 'project',
    projectName: 'Market Launch',
    summary: 'Uploaded interview notes used for persona and positioning analysis.',
    content: 'Raw customer interview transcript notes. Source of truth for persona pains, jobs-to-be-done, and willingness-to-pay signals.',
    tags: ['interviews', 'personas', 'research'], status: 'active',
    usedByAgents: ['Research Agent', 'Writer Agent'],
    fileName: 'customer-interviews.md',
    createdAt: '2026-05-06T09:00:00.000Z', updatedAt: '2026-05-06T09:00:00.000Z',
  },
];

function loadKnowledgeItems(): KnowledgeItem[] {
  try {
    const raw = localStorage.getItem(KNOWLEDGE_LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed as KnowledgeItem[];
    }
  } catch { /* ignore corrupt storage */ }
  return DEFAULT_KNOWLEDGE_ITEMS;
}

function emptyKnowledgeDraft(type: KnowledgeType): KnowledgeItem {
  return {
    id: `k-${Date.now()}`, title: '', type, scope: 'global',
    summary: '', content: '', tags: [], status: 'active',
    usedByAgents: [], createdAt: NOW_ISO(), updatedAt: NOW_ISO(),
  };
}

function KnowledgeEditorModal({ mode, draft, onCancel, onSave }: {
  mode: 'add-memory' | 'add-source' | 'edit';
  draft: KnowledgeItem;
  onCancel: () => void;
  onSave: (item: KnowledgeItem) => void;
}) {
  const isSource = mode === 'add-source' || (mode === 'edit' && (draft.type === 'source' || draft.type === 'file'));
  const [d, setD] = useState<KnowledgeItem>(draft);
  const [sourceKind, setSourceKind] = useState<'URL' | 'File' | 'Folder' | 'Note'>(
    draft.fileName ? 'File' : draft.sourceUrl ? 'URL' : isSource ? 'URL' : 'Note',
  );
  const [readOnly, setReadOnly] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<KnowledgeItem>) => setD((prev) => ({ ...prev, ...patch }));

  const memoryTypes: KnowledgeType[] = ['global_memory', 'project_knowledge', 'note', 'decision', 'agent_learning'];

  const submit = () => {
    if (!d.title.trim()) return setError('Title is required.');
    if (!d.summary.trim()) return setError('Summary is required.');
    if (d.scope === 'project' && !d.projectName) return setError('Select a project for project-scoped items.');
    let next: KnowledgeItem = { ...d, updatedAt: NOW_ISO() };
    if (isSource) {
      next.type = sourceKind === 'File' ? 'file' : 'source';
      if (sourceKind === 'URL') {
        if (!d.sourceUrl?.trim()) return setError('Enter the source URL.');
        next = { ...next, fileName: undefined };
      } else if (sourceKind === 'File' || sourceKind === 'Folder') {
        if (!d.fileName?.trim()) return setError(`Enter the ${sourceKind.toLowerCase()} name or path.`);
        next = { ...next, sourceUrl: undefined };
      }
      next.tags = Array.from(new Set([...next.tags, readOnly ? 'read-only' : 'writable']));
    }
    if (next.requiresApproval && next.status === 'active') next.status = 'approval_required';
    onSave(next);
  };

  const title = mode === 'edit' ? 'Edit knowledge item' : isSource ? 'Add source' : 'Add memory';
  const inputCls = 'w-full rounded-[10px] border border-white/[0.10] bg-[#0b0f1a] px-3 py-2 text-sm text-white outline-none focus:border-violet-400/50';
  const labelCls = 'mb-1 block text-[11px] font-bold uppercase tracking-wide text-white/40';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-[20px] border border-white/[0.10] bg-[#0a0d18] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-heading text-lg font-bold text-white">{title}</h3>
          <button onClick={onCancel} className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-white/50 hover:text-white"><X size={14} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Title *</label>
            <input className={inputCls} value={d.title} onChange={(e) => set({ title: e.target.value })} placeholder="Short, descriptive title" />
          </div>

          {isSource ? (
            <div>
              <label className={labelCls}>Source type</label>
              <div className="flex flex-wrap gap-1.5">
                {(['URL', 'File', 'Folder', 'Note'] as const).map((s) => (
                  <button key={s} onClick={() => setSourceKind(s)}
                    className={`rounded-[9px] border px-3 py-1.5 text-xs font-semibold ${sourceKind === s ? 'border-violet-400/50 bg-violet-400/15 text-white' : 'border-white/[0.10] text-white/45'}`}>{s}</button>
                ))}
              </div>
              {sourceKind === 'URL' && (
                <input className={`${inputCls} mt-2`} value={d.sourceUrl ?? ''} onChange={(e) => set({ sourceUrl: e.target.value })} placeholder="https:// or drive:// URL" />
              )}
              {(sourceKind === 'File' || sourceKind === 'Folder') && (
                <input className={`${inputCls} mt-2`} value={d.fileName ?? ''} onChange={(e) => set({ fileName: e.target.value })} placeholder={sourceKind === 'File' ? 'file-name.md' : 'folder/path/'} />
              )}
            </div>
          ) : (
            <div>
              <label className={labelCls}>Type</label>
              <select className={inputCls} value={d.type} onChange={(e) => set({ type: e.target.value as KnowledgeType })}>
                {memoryTypes.map((t) => <option key={t} value={t}>{KNOW_TYPE_META[t].label}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className={labelCls}>Scope</label>
            <div className="flex gap-1.5">
              {(['global', 'project'] as const).map((s) => (
                <button key={s} onClick={() => set({ scope: s, projectName: s === 'global' ? undefined : d.projectName })}
                  className={`flex-1 rounded-[9px] border px-3 py-1.5 text-xs font-semibold capitalize ${d.scope === s ? 'border-violet-400/50 bg-violet-400/15 text-white' : 'border-white/[0.10] text-white/45'}`}>{s}</button>
              ))}
            </div>
            {d.scope === 'project' && (
              <select className={`${inputCls} mt-2`} value={d.projectName ?? ''} onChange={(e) => set({ projectName: e.target.value || undefined })}>
                <option value="">Select project…</option>
                {KNOWLEDGE_PROJECTS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            )}
          </div>

          <div>
            <label className={labelCls}>Summary *</label>
            <input className={inputCls} value={d.summary} onChange={(e) => set({ summary: e.target.value })} placeholder="One line agents will see first" />
          </div>
          {!isSource && (
            <div>
              <label className={labelCls}>Content</label>
              <textarea className={`${inputCls} min-h-[80px] resize-y`} value={d.content} onChange={(e) => set({ content: e.target.value })} placeholder="Full memory / instructions agents can use" />
            </div>
          )}
          <div>
            <label className={labelCls}>Tags (comma separated)</label>
            <input className={inputCls} value={d.tags.join(', ')} onChange={(e) => set({ tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })} placeholder="sales, finance" />
          </div>

          <div className="flex flex-col gap-2 rounded-[10px] border border-white/[0.08] bg-white/[0.02] p-3">
            {isSource && (
              <label className="flex items-center justify-between text-xs text-white/65">
                <span>Read-only</span>
                <input type="checkbox" checked={readOnly} onChange={(e) => setReadOnly(e.target.checked)} className="accent-violet-500" />
              </label>
            )}
            <label className="flex items-center justify-between text-xs text-white/65">
              <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-amber-300" /> Requires approval before agents use it</span>
              <input type="checkbox" checked={!!d.requiresApproval} onChange={(e) => set({ requiresApproval: e.target.checked })} className="accent-amber-500" />
            </label>
          </div>

          {error && <p className="text-xs font-semibold text-red-400">{error}</p>}
        </div>
        <div className="mt-5 flex gap-2">
          <button onClick={onCancel} className="flex-1 rounded-[10px] border border-white/[0.12] px-3 py-2.5 text-sm font-semibold text-white/55 hover:text-white">Cancel</button>
          <button onClick={submit} className="flex-1 rounded-[10px] bg-[#ffffff] px-3 py-2.5 text-sm font-bold text-[#070B14] hover:bg-[#f0f2ff]">{mode === 'edit' ? 'Save changes' : 'Add item'}</button>
        </div>
      </div>
    </div>
  );
}

function KnowledgeDetailPanel({ item, onClose, onEdit, onArchive, onDelete, onTogglePin }: {
  item: KnowledgeItem;
  onClose: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}) {
  const tm = KNOW_TYPE_META[item.type];
  const sm = KNOW_STATUS_META[item.status];
  return (
    <motion.aside
      initial={{ x: 480, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 480, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      className="fixed right-0 top-0 bottom-0 z-[70] flex w-[clamp(380px,32vw,460px)] flex-col border-l border-white/[0.09] bg-[#070912] shadow-[0_0_80px_rgba(0,0,0,0.6)]">
      <div className="flex items-start justify-between gap-3 border-b border-white/[0.07] p-5">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${tm.tone}`}><tm.Icon size={10} />{tm.label}</span>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${sm.tone}`}>{sm.label}</span>
          </div>
          <h3 className="font-heading text-lg font-bold leading-tight text-white">{item.title}</h3>
        </div>
        <button onClick={onClose} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/50 hover:text-white"><X size={14} /></button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-5 text-sm">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-white/35">Summary</p>
          <p className="leading-relaxed text-white/70">{item.summary}</p>
        </div>
        {item.content && (
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-white/35">Content</p>
            <p className="whitespace-pre-wrap rounded-[10px] border border-white/[0.07] bg-white/[0.02] p-3 leading-relaxed text-white/60">{item.content}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-white/35">Linked project</p>
            <p className="flex items-center gap-1.5 text-white/65">{item.scope === 'project'
              ? <><Layers3 size={12} className="text-blue-300" />{item.projectName}</>
              : <><Globe size={12} className="text-violet-300" />Global</>}</p>
          </div>
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-white/35">Scope</p>
            <p className="capitalize text-white/65">{item.scope}</p>
          </div>
        </div>
        {(item.sourceUrl || item.fileName) && (
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-white/35">{item.fileName ? 'File' : 'Source'}</p>
            <p className="flex items-center gap-1.5 break-all rounded-[10px] border border-white/[0.07] bg-white/[0.02] p-2.5 text-xs text-sky-300/80">
              {item.fileName ? <FileText size={12} /> : <LinkIcon size={12} />}{item.fileName ?? item.sourceUrl}
            </p>
          </div>
        )}
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-white/35">Used by agents ({item.usedByAgents.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {item.usedByAgents.length ? item.usedByAgents.map((a) => (
              <span key={a} className="flex items-center gap-1 rounded-full border border-white/[0.10] bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/60"><Users size={10} />{a}</span>
            )) : <span className="text-xs text-white/30">No agents linked yet</span>}
          </div>
        </div>
        {item.tags.length > 0 && (
          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-white/35">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((t) => <span key={t} className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[11px] text-white/45">#{t}</span>)}
            </div>
          </div>
        )}
        <div className={`rounded-[10px] border p-3 ${item.requiresApproval ? 'border-amber-400/25 bg-amber-400/[0.06]' : 'border-emerald-400/20 bg-emerald-400/[0.05]'}`}>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-white/70">
            <ShieldCheck size={13} className={item.requiresApproval ? 'text-amber-300' : 'text-emerald-300'} />
            {item.requiresApproval ? 'Approval-protected' : 'Standard access'}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-white/45">
            {item.requiresApproval
              ? 'Agents must request approval before using this item in external actions.'
              : 'Agents can use this item directly within Safety Mode rules.'}
          </p>
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-white/35">Activity history</p>
          <div className="space-y-1.5 text-[11px] text-white/45">
            <p className="flex items-center gap-2"><Clock3 size={11} /> Created {fmtDate(item.createdAt)}</p>
            <p className="flex items-center gap-2"><PenLine size={11} /> Updated {fmtDate(item.updatedAt)}</p>
            <p className="flex items-center gap-2"><Eye size={11} /> Last used {fmtDate(item.lastUsedAt)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-white/[0.07] p-4">
        <button onClick={onEdit} className="flex items-center justify-center gap-1.5 rounded-[10px] border border-white/[0.12] px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.06]"><PenLine size={12} /> Edit</button>
        <button onClick={onTogglePin} className="flex items-center justify-center gap-1.5 rounded-[10px] border border-violet-400/25 bg-violet-400/[0.06] px-3 py-2 text-xs font-semibold text-violet-200 hover:bg-violet-400/[0.12]"><Sparkles size={12} />{item.status === 'pinned' ? 'Unpin' : 'Pin'}</button>
        <button onClick={onArchive} className="flex items-center justify-center gap-1.5 rounded-[10px] border border-white/[0.12] px-3 py-2 text-xs font-semibold text-white/55 hover:bg-white/[0.06]"><Square size={11} />{item.status === 'archived' ? 'Restore' : 'Archive'}</button>
        <button onClick={onDelete} className="flex items-center justify-center gap-1.5 rounded-[10px] border border-red-400/30 bg-red-500/[0.08] px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/[0.16]"><X size={12} /> Delete</button>
      </div>
    </motion.aside>
  );
}

export function KnowledgeOSPage() {
  const [items, setItems] = useState<KnowledgeItem[]>(() => loadKnowledgeItems());
  useEffect(() => {
    try { localStorage.setItem(KNOWLEDGE_LS_KEY, JSON.stringify(items)); } catch { /* ignore */ }
  }, [items]);

  const [cat, setCat] = useState<KnowledgeType | 'all' | 'archived'>('all');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<KnowledgeStatus | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ mode: 'add-memory' | 'add-source' | 'edit'; draft: KnowledgeItem } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: 0, archived: 0 };
    for (const it of items) {
      if (it.status === 'archived') { c.archived = (c.archived ?? 0) + 1; continue; }
      c.all += 1;
      c[it.type] = (c[it.type] ?? 0) + 1;
    }
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (cat === 'archived') { if (it.status !== 'archived') return false; }
      else if (it.status === 'archived') return false;
      else if (cat !== 'all' && it.type !== cat) return false;
      if (statusFilter !== 'all' && it.status !== statusFilter) return false;
      if (!q) return true;
      const hay = [it.title, it.summary, it.content, it.projectName ?? '', it.tags.join(' '), it.usedByAgents.join(' ')].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [items, cat, query, statusFilter]);

  const selected = items.find((i) => i.id === selectedId) ?? null;

  const upsert = (item: KnowledgeItem) => {
    setItems((prev) => prev.some((p) => p.id === item.id)
      ? prev.map((p) => (p.id === item.id ? item : p))
      : [{ ...item, createdAt: NOW_ISO() }, ...prev]);
    setEditor(null);
    setSelectedId(item.id);
  };
  const archiveItem = (id: string) => setItems((prev) => prev.map((p) => p.id === id
    ? { ...p, status: p.status === 'archived' ? 'active' : 'archived', updatedAt: NOW_ISO() } : p));
  const togglePin = (id: string) => setItems((prev) => prev.map((p) => p.id === id
    ? { ...p, status: p.status === 'pinned' ? 'active' : 'pinned', updatedAt: NOW_ISO() } : p));
  const removeItem = (id: string) => { setItems((prev) => prev.filter((p) => p.id !== id)); setDeleteId(null); setSelectedId((s) => s === id ? null : s); };

  return (
    <OSPageShell
      eyebrow="Knowledge base"
      title="Memory & Sources"
      subtitle="Control what AI Ant and your agents can remember, reference, and reuse across projects."
      action={
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
            <ShieldCheck size={12} /> Safety Mode: ON
          </span>
          <button onClick={() => setEditor({ mode: 'add-memory', draft: emptyKnowledgeDraft('global_memory') })}
            className="flex items-center gap-1.5 rounded-[10px] bg-[#ffffff] px-3 py-2 text-xs font-bold text-[#070B14] hover:bg-[#f0f2ff]"><Plus size={13} /> Add memory</button>
          <button onClick={() => setEditor({ mode: 'add-source', draft: emptyKnowledgeDraft('source') })}
            className="flex items-center gap-1.5 rounded-[10px] border border-white/[0.14] px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.06]"><FolderOpen size={13} /> Add source</button>
        </div>
      }
    >
      <div className="mb-4 flex items-start gap-2.5 rounded-[16px] border border-violet-400/15 bg-violet-400/[0.05] p-3.5 text-sm text-violet-100/70">
        <Brain className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
        Knowledge items can be attached to projects, used by agents, or kept global. Approval-protected items require confirmation before agents use them.
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title, summary, tags, project, agents…"
            className="w-full rounded-[12px] border border-white/[0.10] bg-white/[0.03] py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-violet-400/40" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as KnowledgeStatus | 'all')}
          className="rounded-[12px] border border-white/[0.10] bg-[#0b0f1a] px-3 py-2.5 text-sm text-white/70 outline-none focus:border-violet-400/40">
          <option value="all">All statuses</option>
          {(Object.keys(KNOW_STATUS_META) as KnowledgeStatus[]).map((s) => <option key={s} value={s}>{KNOW_STATUS_META[s].label}</option>)}
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="h-fit rounded-[18px] border border-white/[0.07] bg-white/[0.03] p-2.5">
          {KNOWLEDGE_CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)}
              className={`mb-1 flex w-full items-center justify-between rounded-[11px] px-3 py-2 text-left text-sm font-semibold transition ${cat === c.id ? 'bg-violet-400/15 text-white' : 'text-white/45 hover:bg-white/[0.04]'}`}>
              <span>{c.label}</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${cat === c.id ? 'bg-violet-400/20 text-violet-200' : 'bg-white/[0.05] text-white/30'}`}>
                {c.id === 'all' ? counts.all : c.id === 'archived' ? counts.archived : (counts[c.id] ?? 0)}
              </span>
            </button>
          ))}
        </div>

        <div>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[18px] border border-dashed border-white/[0.10] bg-white/[0.02] py-16 text-center">
              <Database className="mb-3 h-7 w-7 text-white/20" />
              <p className="text-sm font-semibold text-white/55">No knowledge items found.</p>
              <p className="mt-1 text-xs text-white/30">Try changing filters or add a new memory/source.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2">
              {filtered.map((it) => {
                const tm = KNOW_TYPE_META[it.type];
                const sm = KNOW_STATUS_META[it.status];
                return (
                  <div key={it.id} className="flex flex-col rounded-[18px] border border-white/[0.07] bg-white/[0.03] p-4 transition hover:border-white/[0.14]">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${tm.tone}`}><tm.Icon size={10} />{tm.label}</span>
                      <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${sm.tone}`}>
                        {it.status === 'approval_required' && <ShieldCheck size={9} />}{sm.label}
                      </span>
                    </div>
                    <h3 className="font-heading text-[15px] font-bold leading-tight text-white">{it.title}</h3>
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-white/45">{it.summary}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/32">
                      <span className="flex items-center gap-1">{it.scope === 'project'
                        ? <><Layers3 size={10} />{it.projectName}</> : <><Globe size={10} />Global</>}</span>
                      <span className="flex items-center gap-1"><Users size={10} />{it.usedByAgents.length} agents</span>
                      <span className="flex items-center gap-1"><Clock3 size={10} />{fmtDate(it.updatedAt)}</span>
                    </div>
                    <div className="mt-4 flex gap-1.5">
                      <button onClick={() => setSelectedId(it.id)} className="flex items-center gap-1 rounded-[9px] bg-[#ffffff] px-2.5 py-1.5 text-[11px] font-bold text-[#070B14] hover:bg-[#f0f2ff]"><Eye size={11} /> Details</button>
                      <button onClick={() => setEditor({ mode: 'edit', draft: it })} className="flex items-center gap-1 rounded-[9px] border border-white/[0.12] px-2.5 py-1.5 text-[11px] font-semibold text-white/55 hover:text-white"><PenLine size={11} /> Edit</button>
                      <button onClick={() => archiveItem(it.id)} className="flex items-center gap-1 rounded-[9px] border border-white/[0.12] px-2.5 py-1.5 text-[11px] font-semibold text-white/45 hover:text-white"><Square size={10} />{it.status === 'archived' ? 'Restore' : 'Archive'}</button>
                      <button onClick={() => setDeleteId(it.id)} className="flex items-center gap-1 rounded-[9px] border border-red-400/25 px-2.5 py-1.5 text-[11px] font-semibold text-red-300/80 hover:bg-red-500/[0.12]"><X size={11} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <>
            <motion.div key="kb-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedId(null)} className="fixed inset-0 z-[65] bg-black/50" />
            <KnowledgeDetailPanel
              key="kb-detail"
              item={selected}
              onClose={() => setSelectedId(null)}
              onEdit={() => setEditor({ mode: 'edit', draft: selected })}
              onArchive={() => archiveItem(selected.id)}
              onDelete={() => setDeleteId(selected.id)}
              onTogglePin={() => togglePin(selected.id)}
            />
          </>
        )}
      </AnimatePresence>

      {editor && (
        <KnowledgeEditorModal
          mode={editor.mode}
          draft={editor.draft}
          onCancel={() => setEditor(null)}
          onSave={upsert}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setDeleteId(null)}>
          <div className="w-full max-w-sm rounded-[18px] border border-white/[0.10] bg-[#0a0d18] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-400" />
              <h3 className="font-heading text-base font-bold text-white">Delete this item?</h3>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-white/50">
              "{items.find((i) => i.id === deleteId)?.title}" will be permanently removed. Agents will no longer be able to use it. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteId(null)} className="flex-1 rounded-[10px] border border-white/[0.12] px-3 py-2.5 text-sm font-semibold text-white/55 hover:text-white">Cancel</button>
              <button onClick={() => removeItem(deleteId)} className="flex-1 rounded-[10px] bg-red-500/85 px-3 py-2.5 text-sm font-bold text-white hover:bg-red-500">Delete</button>
            </div>
          </div>
        </div>
      )}
    </OSPageShell>
  );
}
