import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, AlertTriangle, ArrowRight, BarChart3, Bot, Brain, Building2, Calendar, Check, ChevronDown, ClipboardCheck, Clock3, Cloud, Database, Download, Eye, FileText, FolderOpen, FolderPlus, Globe, Grid3x3, HelpCircle, Image as ImageIcon, Laptop, Layers3, Lightbulb, Link as LinkIcon, Loader2, Mail, MessageSquare, Mic, Monitor, MoreHorizontal, Network, PenLine, Pin, PinOff, Play, Plug, Plus, RotateCcw, Search, Settings, ShieldCheck, Smartphone, Sparkles, Square, Terminal, Trash2, Upload, User, Users, Video as VideoIcon, Workflow, X, Zap } from 'lucide-react';
import { AIRoutingCard } from '../../pages/ai-ant/AIRoutingCard';
import { BorderGlow } from '../effects/BorderGlow';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { MANUAL_MODEL_GROUPS, MODEL_ROUTING_OPTIONS, AGENT_MODE_LABEL, AGENT_MODE_OPTIONS, AGENT_MODE_SHORT_LABEL, modelRoutingLabel, normalizeAgentInputMode } from '../../lib/aiAnt/routing';
import { DEVICE_RUN_STEPS, readableField } from '../../lib/aiAnt/aiAntHelpers';
import { MODEL_DESCRIPTIONS, MODEL_TAGS, ModelChip, PROVIDER_LABELS, SkillModelPills, inferCapabilitiesFromText, providerIcon, shortResolvedModelName, skillsForCapabilities } from '../../lib/modelDisplay';
import { CAPABILITY_LABELS, EXPENSIVE_CAPABILITIES, estimateCapabilityCredits, resolveModelForCapability } from '../../lib/aiOrchestration';
import type { AgentCapability, ResolvedModel } from '../../lib/aiOrchestration';
import { ANT_AUTONOMY_LEVELS, ANT_RECOVERY_SUGGESTIONS, ANT_SEARCH_RESULTS, GRAPH_EDGES, GRAPH_NODES } from '../../lib/data/aiAntSeedData';
import type { AgentInputMode } from '../../lib/types/appTypes';
import type { CrewRun, CrewStatus } from '../../lib/types/crewTypes';
import type { ManualModelSelection, ModelRoutingPreference } from '../../lib/types/workflowTypes';
import type { AntActionType, AntActivityEntry, AntAgentStatus, AntApproval, AntAutonomyLevel, AntColonySession, AntConfidenceLevel, AntCorrectionField, AntDelivery, AntDevice, AntDeviceStatus, AntDeviceType, AntDomain, AntFileCard, AntGeneratedProject, AntHandoff, AntLearnedPattern, AntLiveEvent, AntMemoryEntry, AntMode, AntNotification, AntNotificationCategory, AntNotificationPriority, AntPermissionScope, AntPlanStep, AntRecoverySuggestion, AntRiskLevel, AntRole, AntSearchFilter, AntSearchResult, AntSuggestion, AntSuggestionType, AntTask, AntTaskPlan, AntTaskStatus, AntTeamProposal, AntTool, AntToolCategory, AntWorkflowDef, AntWorkflowStatus, AntWorkspace, AntWorkspaceSource, ApprovalLevel, ColonyDeliverable, DeviceAccessLevel, DeviceActionRequest, DeviceActionStatus, ExecutionDecision, GraphEdge, GraphNode, GraphNodeType, KnowledgeCategory, KnowledgeEntry, KnowledgeSource, ProjectIntent, TeamMember, VoiceState } from '../../lib/types/antTypes';

export function AntPlanCard({ plan, onConfirm, onCancel }: { plan: AntTaskPlan; onConfirm: () => void; onCancel: () => void }) {
  const typeColor: Record<AntActionType, string> = {
    FILE_OPS: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
    SYSTEM_OPS: 'border-purple-500/20 bg-purple-500/10 text-purple-400',
    COMMUNICATION: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
    DATA_ANALYSIS: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-400',
    AUTOMATION: 'border-violet-500/20 bg-violet-500/10 text-violet-400',
    SEARCH: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-400',
    ORGANIZATION: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
  };
  const riskCol: Record<AntRiskLevel, string> = {
    Safe: 'text-emerald-400', Moderate: 'text-amber-400', Sensitive: 'text-orange-400', 'High Risk': 'text-red-400',
  };
  return (
    <div className={`w-full overflow-hidden rounded-[16px] border ${plan.status === 'cancelled' ? 'border-white/[0.05] opacity-50' : 'border-violet-500/[0.15] bg-white/[0.04]'}`}>
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs">📋</span>
          <span className="text-[11px] font-bold text-white/70">Plan Preview</span>
          <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${typeColor[plan.actionType]}`}>
            {plan.actionType.replace('_', ' ')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[9px] font-semibold uppercase ${plan.urgency === 'high' ? 'text-amber-400' : 'text-white/25'}`}>{plan.urgency}</span>
          {plan.riskLevel !== 'Safe' && <span className={`text-[10px] font-semibold ${riskCol[plan.riskLevel]}`}>{plan.riskLevel}</span>}
        </div>
      </div>
      <div className="px-3.5 py-3">
        <div className="mb-0.5 text-[11px] font-semibold text-white/80">{plan.intent}</div>
        {plan.implicitNeeds && <div className="mb-3 text-[10px] text-white/35">↳ {plan.implicitNeeds}</div>}
        <div className="flex flex-col gap-1.5">
          {plan.steps.map((step, idx) => (
            <div key={step.id} className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                {step.status === 'done'
                  ? <span className="text-[10px] text-emerald-400">✓</span>
                  : step.status === 'running'
                  ? <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400" />
                  : step.status === 'failed'
                  ? <span className="text-[10px] text-red-400">✕</span>
                  : <span className="text-[10px] font-bold text-white/25">{idx + 1}</span>}
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-[11px] font-medium leading-tight ${step.status === 'done' ? 'text-white/35 line-through' : step.status === 'running' ? 'text-white/90' : 'text-white/65'}`}>
                  {step.label}
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-[9px] text-white/20">
                  <span>{step.device}</span><span>·</span><span>{step.operation}</span>
                  {step.status === 'done' && <><span>·</span><span className="text-emerald-400/60">{step.expectedOutcome}</span></>}
                  {step.dependsOn && <span className="ml-1 text-white/15">← #{step.dependsOn.join(',')}</span>}
                </div>
              </div>
              <span className={`shrink-0 text-[8px] ${step.reversible ? 'text-white/15' : 'text-amber-400/50'}`}>
                {step.reversible ? '↩' : '⚠'}
              </span>
            </div>
          ))}
        </div>
      </div>
      {plan.status === 'preview' && (
        <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] px-3.5 py-2.5">
          <button onClick={onCancel} className="rounded-full border border-white/[0.09] px-3 py-1 text-[11px] text-white/35 transition hover:border-white/[0.16] hover:text-white/60">Cancel</button>
          <button onClick={onCancel} className="rounded-full border border-white/[0.09] px-3 py-1 text-[11px] text-white/55 transition hover:text-white/80">⚙ Customize</button>
          <button onClick={onConfirm} className="rounded-full bg-violet-600 px-4 py-1 text-[11px] font-semibold text-white transition hover:bg-violet-500">✓ Confirm Plan</button>
        </div>
      )}
      {plan.status === 'executing' && (
        <div className="flex items-center gap-2 border-t border-white/[0.06] px-3.5 py-2 text-[10px] text-violet-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" /><span>Executing…</span>
        </div>
      )}
      {plan.status === 'complete' && (
        <div className="flex items-center gap-2 border-t border-emerald-500/[0.12] px-3.5 py-2 text-[10px] text-emerald-400">
          <span>✓</span><span>All steps complete</span>
        </div>
      )}
      {plan.status === 'cancelled' && (
        <div className="flex items-center gap-2 border-t border-white/[0.04] px-3.5 py-2 text-[10px] text-white/20">
          <span>✕</span><span>Cancelled</span>
        </div>
      )}
    </div>
  );
}

export function AIAntModeToggle({ mode, setMode }: { mode: AntMode; setMode: (m: AntMode) => void }) {
  const [open, setOpen] = React.useState(false);
  const MODES: Array<{ id: AntMode; label: string; dot: string; desc: string }> = [
    { id: 'read-only', label: 'Read Only', dot: 'bg-emerald-500', desc: 'Observe only — no actions proposed' },
    { id: 'assist',    label: 'Assist',    dot: 'bg-blue-500',    desc: 'Drafts & suggestions prepared for you' },
    { id: 'approval',  label: 'Approval',  dot: 'bg-amber-500',   desc: 'Every action requires your sign-off' },
    { id: 'auto',      label: 'Auto',      dot: 'bg-violet-500',  desc: 'Executes within safety policies' },
  ];
  const cur = MODES.find((m) => m.id === mode)!;
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.06] px-3.5 py-1.5 text-xs transition hover:bg-white/[0.09] hover:border-white/[0.15]">
        <span className={`h-1.5 w-1.5 rounded-full ${cur.dot}`} />
        <span className="text-white/50">Mode:</span>
        <span className="font-semibold text-white/90">{cur.label}</span>
        <span className="text-[10px] text-white/35">▾</span>
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-[200] w-60 overflow-hidden rounded-[16px] border border-white/[0.10] bg-[#0f0f1c] shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
          {MODES.map((m) => (
            <button key={m.id} onClick={() => { setMode(m.id); setOpen(false); }}
              className={`flex w-full items-start gap-3 px-4 py-2.5 text-left text-xs transition hover:bg-white/[0.05] ${mode === m.id ? 'bg-white/[0.04]' : ''}`}>
              <span className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${m.dot}`} />
              <div>
                <div className={`font-semibold ${mode === m.id ? 'text-white/90' : 'text-white/50'}`}>{m.label}</div>
                <div className="mt-0.5 text-[10px] leading-tight text-white/30">{m.desc}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AIAntConfidenceBadge({ level, score }: { level: AntConfidenceLevel; score: number }) {
  const styles: Record<AntConfidenceLevel, { cls: string; label: string; dot: string }> = {
    'verified':        { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Verified',        dot: 'bg-emerald-500' },
    'needs-review':    { cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20',       label: 'Needs Review',    dot: 'bg-amber-500' },
    'manual-override': { cls: 'bg-red-500/10 text-red-400 border-red-500/20',             label: 'Manual Override', dot: 'bg-red-500' },
  };
  const s = styles[level];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${s.cls}`}>
      <span className={`h-1 w-1 rounded-full ${s.dot}`} />
      {Math.round(score * 100)}% · {s.label}
    </span>
  );
}

export function AIAntCorrectionPanel({ fields, onSave, onDismiss }: {
  fields: AntCorrectionField[];
  onSave: (updated: AntCorrectionField[]) => void;
  onDismiss: () => void;
}) {
  const [local, setLocal] = React.useState<AntCorrectionField[]>(fields.map((f) => ({ ...f })));
  return (
    <div className="rounded-[14px] border border-amber-500/20 bg-amber-500/[0.06] p-3.5">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">✏️</span>
          <span className="text-[11px] font-semibold text-amber-400">Human Review Required</span>
        </div>
        <span className="text-[10px] text-white/30">Verify or correct detected values</span>
      </div>
      <div className="flex flex-col gap-2">
        {local.map((f, i) => (
          <div key={f.id} className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="mb-0.5 text-[10px] text-white/40">{f.label}</div>
              <input
                value={f.edited ?? f.detected}
                onChange={(e) => {
                  const updated = [...local];
                  updated[i] = { ...f, edited: e.target.value };
                  setLocal(updated);
                }}
                className="w-full rounded-[8px] border border-white/[0.10] bg-white/[0.06] px-2.5 py-1.5 text-[11px] text-white/90 placeholder-white/25 outline-none focus:border-amber-500/40"
              />
            </div>
            <div className="shrink-0 text-right">
              <div className={`text-[10px] font-semibold ${f.confidence >= 0.88 ? 'text-emerald-400' : f.confidence >= 0.72 ? 'text-amber-400' : 'text-red-400'}`}>
                {Math.round(f.confidence * 100)}%
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={() => onSave(local)}
          className="flex-1 rounded-[10px] bg-amber-500/20 py-1.5 text-[11px] font-semibold text-amber-300 transition hover:bg-amber-500/30">
          Confirm Values
        </button>
        <button onClick={onDismiss}
          className="rounded-[10px] border border-white/[0.08] px-3 py-1.5 text-[11px] text-white/40 transition hover:text-white/60">
          Dismiss
        </button>
      </div>
    </div>
  );
}

export function AIAntTaskPanel({ tasks }: { tasks: AntTask[] }) {
  const statusColor: Record<AntTaskStatus, string> = {
    queued: 'text-white/35', reading: 'text-blue-400', analyzing: 'text-amber-400',
    'waiting-approval': 'text-orange-400', completed: 'text-emerald-400', failed: 'text-red-400',
  };
  const statusLabel: Record<AntTaskStatus, string> = {
    queued: 'Queued', reading: 'Reading…', analyzing: 'Analyzing…',
    'waiting-approval': 'Waiting approval', completed: 'Done', failed: 'Failed',
  };
  return (
    <div className="flex flex-col gap-2">
      {tasks.length === 0 && <p className="py-6 text-center text-xs text-white/30">No tasks yet</p>}
      {[...tasks].reverse().map((t) => (
        <div key={t.id} className={`rounded-[12px] border p-3 ${t.requiresCorrection && t.status === 'completed' ? 'border-amber-500/20 bg-amber-500/[0.05]' : 'border-white/[0.07] bg-white/[0.04]'}`}>
          <div className="mb-1.5 flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="text-sm">{t.icon}</span>
              <span className="truncate text-[11px] font-medium text-white/80">{t.title}</span>
            </div>
            <span className={`shrink-0 text-[10px] font-semibold ${statusColor[t.status]}`}>{statusLabel[t.status]}</span>
          </div>
          {t.status !== 'completed' && t.status !== 'failed' && (
            <div className="mb-1.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full bg-violet-500 transition-all duration-700" style={{ width: `${t.progress}%` }} />
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/30">{t.device} · {t.startedAt}</span>
            {t.confidenceLevel && <AIAntConfidenceBadge level={t.confidenceLevel} score={t.confidence} />}
          </div>
          {t.requiresCorrection && t.status === 'completed' && (
            <div className="mt-1.5 flex items-center gap-1 text-[10px] text-amber-400">
              <span>✏️</span><span>Review extracted values</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function AIAntActivityLog({ logs }: { logs: AntActivityEntry[] }) {
  const domainColors: Record<AntDomain, string> = {
    general: 'text-white/35 bg-white/[0.06]',
    finance: 'text-amber-400 bg-amber-500/10',
    hr: 'text-blue-400 bg-blue-500/10',
    email: 'text-violet-400 bg-violet-500/10',
    'file-deletion': 'text-red-400 bg-red-500/10',
    'external-export': 'text-orange-400 bg-orange-500/10',
  };
  const approvalDot: Record<string, string> = {
    approved: 'bg-emerald-500', rejected: 'bg-red-500',
    pending: 'bg-amber-500', auto: 'bg-violet-500',
  };
  return (
    <div className="flex flex-col gap-0.5">
      {logs.length === 0 && <p className="py-6 text-center text-xs text-white/30">No activity yet</p>}
      {[...logs].reverse().map((l) => {
        const LogIcon = l.icon === '📁' ? FolderOpen : l.icon === '🔐' ? ShieldCheck : l.icon === '📊' ? BarChart3 : l.icon === '📋' ? ClipboardCheck : Activity;
        return (
        <div key={l.id} className="rounded-[10px] px-2 py-2 hover:bg-white/[0.04]">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/[0.06]">
              <LogIcon size={11} className="text-white/40" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] font-medium text-white/80">{l.action}</div>
              <div className="text-[10px] text-white/35">{l.result}</div>
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${domainColors[l.domain]}`}>{l.domain}</span>
                {l.approvalStatus && (
                  <span className="flex items-center gap-1 text-[9px] text-white/30">
                    <span className={`h-1 w-1 rounded-full ${approvalDot[l.approvalStatus] ?? 'bg-white/20'}`} />
                    {l.approvalStatus}
                  </span>
                )}
                <span className={`text-[9px] font-semibold ${l.confidenceLevel === 'verified' ? 'text-emerald-400' : l.confidenceLevel === 'needs-review' ? 'text-amber-400' : 'text-red-400'}`}>
                  {Math.round(l.confidence * 100)}%
                </span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[10px] text-white/25">{l.time}</div>
              <div className={`text-[9px] ${l.riskLevel === 'Safe' ? 'text-white/20' : l.riskLevel === 'Moderate' ? 'text-amber-400/60' : 'text-red-400/60'}`}>{l.riskLevel}</div>
            </div>
          </div>
        </div>
      ); })}
    </div>
  );
}

export function AIAntDevicePanel({ devices }: { devices: AntDevice[] }) {
  const DeviceIcon = ({ type }: { type: AntDeviceType }) => {
    if (type === 'iphone' || type === 'android') return <Smartphone size={14} className="text-white/40" />;
    if (type === 'mac') return <Laptop size={14} className="text-white/40" />;
    return <Monitor size={14} className="text-white/40" />;
  };
  const statusDot: Record<AntDeviceStatus, string> = { active: 'bg-emerald-500', idle: 'bg-amber-500/60', secure: 'bg-blue-500/60' };
  return (
    <div className="flex flex-col gap-0.5">
      {devices.map((d) => (
        <div key={d.id} className="flex items-center gap-2.5 rounded-[10px] px-2 py-2 hover:bg-white/[0.04]">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.06]"><DeviceIcon type={d.type} /></div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[11px] font-medium text-white/80">{d.name}</div>
            <div className="text-[10px] text-white/30">
              {d.activeSession ? d.activeSession : d.lastSeen}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {d.batteryLevel !== undefined && <span className="text-[10px] text-white/25">{d.batteryLevel}%</span>}
            <span className={`h-1.5 w-1.5 rounded-full ${d.online ? statusDot[d.status] : 'bg-white/[0.12]'}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AIAntWorkspacePanel({ workspaces }: { workspaces: AntWorkspace[] }) {
  const srcIcon: Record<AntWorkspaceSource, React.ElementType> = {
    'google-drive': Cloud, slack: MessageSquare, notion: FileText,
    browser: Globe, local: Laptop, 'email-client': Mail, spreadsheets: BarChart3,
  };
  return (
    <div className="flex flex-col gap-1">
      {workspaces.map((w) => {
        const WIcon = srcIcon[w.source] ?? FolderOpen;
        return (
        <div key={w.id} className="flex items-center gap-2.5 rounded-[10px] px-2 py-2 hover:bg-white/[0.04]">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.06]">
            <WIcon size={12} className="text-white/40" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[11px] font-medium text-white/80">{w.name}</div>
            <div className="text-[10px] text-white/30">{w.connected ? (w.lastAccessed ?? 'Connected') : 'Not connected'}</div>
          </div>
          <span className={`h-1.5 w-1.5 rounded-full ${w.connected ? 'bg-emerald-500' : 'bg-white/[0.12]'}`} />
        </div>
        );
      })}
      <div className="mt-1 rounded-[10px] border border-dashed border-white/[0.08] py-2 text-center text-[10px] text-white/25">
        + Connect workspace
      </div>
    </div>
  );
}

export function AIAntFileCard({ file, onAction }: { file: AntFileCard; onAction: (act: string) => void }) {
  const typeStyle: Record<string, string> = {
    PDF: 'text-red-400 bg-red-500/10', Excel: 'text-emerald-400 bg-emerald-500/10',
    Image: 'text-blue-400 bg-blue-500/10', CSV: 'text-amber-400 bg-amber-500/10',
  };
  const tc = typeStyle[file.type] ?? 'text-violet-400 bg-violet-500/10';
  return (
    <div className="rounded-[14px] border border-white/[0.08] bg-white/[0.04] p-3 transition hover:bg-white/[0.06]">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${tc}`}>{file.type}</span>
          <span className="truncate text-[11px] font-medium text-white/80">{file.name}</span>
        </div>
        <span className="shrink-0 text-[10px] font-bold text-emerald-400">{Math.round(file.confidence * 100)}%</span>
      </div>
      <div className="mb-2.5 flex items-center gap-2 text-[10px] text-white/30">
        <span>{file.size}</span><span>·</span><span>{file.modified}</span><span>·</span>
        <span className="truncate">{file.path}</span>
      </div>
      <div className="flex gap-1.5">
        {['Preview', 'Summarize', 'Send'].map((act) => (
          <button key={act} onClick={() => onAction(act)}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-white/50 transition hover:border-white/[0.14] hover:text-white/80">
            {act}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AIAntApprovalModal({ approval, onApprove, onEdit, onReject }: {
  approval: AntApproval; onApprove: () => void; onEdit: () => void; onReject: () => void;
}) {
  const rc: Record<AntRiskLevel, { border: string; bg: string; text: string; badge: string }> = {
    Safe:       { border: 'border-emerald-500/25', bg: 'bg-emerald-500/[0.08]', text: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-400' },
    Moderate:   { border: 'border-amber-500/25',   bg: 'bg-amber-500/[0.08]',   text: 'text-amber-400',   badge: 'bg-amber-500/15 text-amber-400' },
    Sensitive:  { border: 'border-orange-500/25',  bg: 'bg-orange-500/[0.08]',  text: 'text-orange-400',  badge: 'bg-orange-500/15 text-orange-400' },
    'High Risk':{ border: 'border-red-500/25',     bg: 'bg-red-500/[0.08]',     text: 'text-red-400',     badge: 'bg-red-500/15 text-red-400' },
  };
  const domainLabel: Record<AntDomain, string> = { finance: '💰 Finance', hr: '👥 HR', email: '📧 Email', 'file-deletion': '🗑️ Deletion', 'external-export': '📤 External Export', general: '⚙️ General' };
  const r = rc[approval.risk];
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-[24px] border border-white/[0.10] bg-[#0d0d1c] shadow-[0_24px_64px_rgba(0,0,0,0.7)]">
        <div className="border-b border-white/[0.07] px-6 py-4">
          <div className="mb-1 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10">
              <ShieldCheck size={15} className="text-amber-400" />
            </div>
            <h3 className="font-heading text-[15px] font-bold text-white/90">Review before AI acts</h3>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-white/40">Review before AI Ant proceeds</p>
            <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold bg-white/[0.06] text-white/40">{domainLabel[approval.domain]}</span>
          </div>
        </div>
        <div className="space-y-3 p-6">
          <div className={`rounded-[14px] border ${r.border} ${r.bg} p-4`}>
            <div className="mb-2 flex items-center justify-between">
              <span className={`text-sm font-semibold ${r.text}`}>{approval.action}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${r.badge}`}>{approval.risk}</span>
            </div>
            {approval.dataPreview && (
              <div className="mb-2 rounded-[8px] bg-black/20 px-2.5 py-1.5 text-[10px] font-mono text-white/50">{approval.dataPreview}</div>
            )}
            {approval.fileName && (
              <div className="mb-1 flex items-center gap-2 text-xs text-white/45"><FileText size={11} className="shrink-0" /><span>{approval.fileName}</span></div>
            )}
            {approval.destination && (
              <div className="mb-1 flex items-center gap-2 text-xs text-white/45"><Globe size={11} className="shrink-0" /><span>{approval.destination}</span></div>
            )}
            <div className="mt-2.5 flex items-center justify-between border-t border-white/[0.07] pt-2.5 text-[10px] text-white/30">
              <span className="flex items-center gap-1"><img src="/assets/logos/ai ant black (2).png" width={10} height={10} alt="" className="opacity-40 invert" /> {Math.round(approval.confidence * 100)}% confident</span>
              <span>Requested by: {approval.requestedBy}</span>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-white/40">{approval.reason}</p>
          <div className="flex gap-2">
            <button onClick={onApprove}
              className="flex-1 rounded-[12px] bg-violet-600 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500">
              Approve
            </button>
            <button onClick={onEdit}
              className="rounded-[12px] border border-white/[0.10] bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-white/60 transition hover:border-white/[0.16] hover:text-white/80">
              Edit
            </button>
            <button onClick={onReject}
              className="rounded-[12px] border border-red-500/25 bg-red-500/[0.08] px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/[0.15]">
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


export const ANT_PROMPT_SUGGESTIONS = [
  { label: 'Research competitors', mode: 'Colony Crew' as AgentInputMode },
  { label: 'Summarize a report', mode: 'Chat' as AgentInputMode },
  { label: 'Create a workflow', mode: 'Workflow' as AgentInputMode },
];

export function AntPromptSuggestions({ onPick }: { onPick: (suggestion: { label: string; mode: AgentInputMode }) => void }) {
  return (
    <div className="ant-quick-starts">
      <span className="ant-quick-starts-label">Try asking</span>
      <div className="ant-quick-starts-row">
        {ANT_PROMPT_SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion.label}
            onClick={() => onPick(suggestion)}
            className="ant-quick-chip"
          >
            {suggestion.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AntAssistantMessageActions({
  feedback,
  copied,
  onFeedback,
  onRegenerate,
  onCopy,
}: {
  feedback?: 'up' | 'down';
  copied?: boolean;
  onFeedback: (value: 'up' | 'down') => void;
  onRegenerate: () => void;
  onCopy: () => void;
}) {
  const actionClass = 'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-medium transition';
  return (
    <div className="flex flex-wrap items-center gap-2 pt-0.5 text-white/42">
      <button
        onClick={() => onFeedback('up')}
        title="Good response"
        className={`${actionClass} ${feedback === 'up' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-white/[0.07] bg-white/[0.025] hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-white/72'}`}
      >
        <Check className="h-3.5 w-3.5" />
        Good response
      </button>
      <button
        onClick={() => onFeedback('down')}
        title="Not helpful"
        className={`${actionClass} ${feedback === 'down' ? 'border-amber-400/30 bg-amber-400/10 text-amber-200' : 'border-white/[0.07] bg-white/[0.025] hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-white/72'}`}
      >
        <X className="h-3.5 w-3.5" />
        Not helpful
      </button>
      <button
        onClick={onRegenerate}
        title="Regenerate"
        className={`${actionClass} border-white/[0.07] bg-white/[0.025] hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-white/72`}
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Regenerate
      </button>
      <button
        onClick={onCopy}
        title="Copy response"
        className={`${actionClass} ${copied ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200' : 'border-white/[0.07] bg-white/[0.025] hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-white/72'}`}
      >
        <ClipboardCheck className="h-3.5 w-3.5" />
        {copied ? 'Copied' : 'Copy'}
      </button>
      <button
        title="More"
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.025] transition hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-white/72"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function AntPromptInput({ prompt, onChange, onSubmit, voiceActive, onToggleVoice, large, agentMode, setAgentMode, modelRoutingPreference, setModelRoutingPreference, manualModelSelection, setManualModelSelection }: {
  prompt: string; onChange: (v: string) => void; onSubmit: (v: string) => void;
  voiceActive: boolean; onToggleVoice: () => void; large?: boolean;
  agentMode: AgentInputMode; setAgentMode: (mode: AgentInputMode) => void;
  modelRoutingPreference: ModelRoutingPreference;
  setModelRoutingPreference: (preference: ModelRoutingPreference) => void;
  manualModelSelection: ManualModelSelection | null;
  setManualModelSelection: (selection: ManualModelSelection) => void;
}) {
  const [modeOpen, setModeOpen] = React.useState(false);
  const [addMenuOpen, setAddMenuOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const visibleAgentMode = normalizeAgentInputMode(agentMode);
  const SelectedIcon = AGENT_MODE_OPTIONS.find((item) => item.mode === visibleAgentMode)?.icon ?? Sparkles;

  const handleAddFiles = () => {
    setAddMenuOpen(false);
    fileInputRef.current?.click();
  };
  const handleFilesChosen = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    const names = files.map((file) => file.name).join(', ');
    onChange(prompt ? `${prompt}\nAttached: ${names}` : `Attached: ${names}`);
    event.target.value = '';
  };
  const handleAddLink = () => {
    setAddMenuOpen(false);
    if (typeof window === 'undefined') return;
    const url = window.prompt('Paste a URL to add as context:');
    if (!url) return;
    const trimmed = url.trim();
    if (!trimmed) return;
    onChange(prompt ? `${prompt}\n${trimmed}` : trimmed);
  };
  const handleAddFromProject = () => {
    setAddMenuOpen(false);
    onChange(prompt ? `${prompt}\n@project ` : '@project ');
  };
  const handleConnectTool = () => {
    setAddMenuOpen(false);
    onChange(prompt ? `${prompt}\n@tool ` : '@tool ');
  };
  const handleCreateWorkflow = () => {
    setAddMenuOpen(false);
    setAgentMode('Workflow');
    onChange(prompt || 'Create a repeatable workflow for ');
  };
  const handleBuildCrew = () => {
    setAddMenuOpen(false);
    setAgentMode('Colony Crew');
    onChange(prompt || 'Build a Colony Crew to ');
  };
  const handleOneManEnterprise = () => {
    setAddMenuOpen(false);
    setAgentMode('One-man Enterprise');
    onChange(prompt || 'Set up a one-man enterprise for ');
  };
  const placeholderByMode: Record<AgentInputMode, string> = {
    Auto: 'Tell AI Ant what you want to accomplish...',
    Chat: 'Ask AI Ant anything...',
    Agent: 'Describe the task your AI crew should handle...',
    'Colony Crew': 'Describe the task your specialist AI crew should handle...',
    'Deep Research': 'Describe the research, analysis, or execution plan your Colony Crew should handle...',
    'One-man Enterprise': 'Describe the business or project you want to operate...',
    Workflow: 'Describe the recurring process you want AI Ant to automate…',
    Device: 'Describe what AI Ant should do across your files, apps, browser, or tools...',
  };
  const currentModelPreference = MODEL_ROUTING_OPTIONS.find((option) => option.value === modelRoutingPreference) ?? MODEL_ROUTING_OPTIONS[0];
  const modelPreferenceOptions = MODEL_ROUTING_OPTIONS.filter((option) => ['auto', 'fast', 'balanced', 'best_quality'].includes(option.value));
  const showModelChip = modelRoutingPreference !== 'auto';
  const addControl = (
    <Popover open={addMenuOpen} onOpenChange={setAddMenuOpen}>
      <PopoverTrigger asChild>
        <button
          className={`ant-ctrl-neutral ant-add-trigger flex ${large ? 'h-10 w-10' : 'h-9 w-9'} shrink-0 items-center justify-center rounded-full ${addMenuOpen ? 'is-active-violet' : ''}`}
          title="Add to task"
          aria-label="Add to task"
        >
          <Plus className={`h-4 w-4 transition-transform duration-200 ${addMenuOpen ? 'rotate-45' : ''}`} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={large ? 'bottom' : 'top'}
        align="start"
        sideOffset={8}
        className="ant-popover-surface !w-[min(360px,calc(100vw-32px))] max-h-[min(620px,calc(100vh-140px))] overflow-y-auto !rounded-[18px] !p-2"
      >
        <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/38">Add to your task</p>
        <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/28">Context</p>
        <AddMenuItem icon={Upload} label="Upload files" description="Add documents, images, or project materials." onClick={handleAddFiles} />
        <AddMenuItem icon={FolderOpen} label="Use project context" description="Reference files and instructions from a project." onClick={handleAddFromProject} />
        <AddMenuItem icon={Plug} label="Connect a tool" description="Use approved sources or connected apps." onClick={handleConnectTool} />
        <div className="my-1.5 mx-2 h-px bg-white/[0.06]" />
        <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/28">Create</p>
        <AddMenuItem icon={ImageIcon} label="Create an image" description="Generate a visual asset for your work." comingSoon />
        <AddMenuItem icon={Workflow} label="Create a workflow" description="Turn repeatable work into an automation." onClick={handleCreateWorkflow} />
        <AddMenuItem icon={Users} label="Build a Colony Crew" description="Assemble specialist agents for a task." onClick={handleBuildCrew} />
        <div className="my-1.5 mx-2 h-px bg-white/[0.06]" />
        <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/28">Advanced</p>
        <AddMenuItem icon={Building2} label="One-man Enterprise" description="Create a longer-term AI operating workspace." onClick={handleOneManEnterprise} />
      </PopoverContent>
    </Popover>
  );
  return (
    <BorderGlow
      backgroundColor="#0b101c"
      borderRadius={large ? 999 : 20}
      edgeSensitivity={22}
      glowColor="265 95 72"
      glowRadius={38}
      glowIntensity={1.4}
      coneSpread={25}
      colors={['#a78bfa', '#7c5cfc', '#7db7ff']}
      // Disable the soft-light mesh fill so the textarea area and the toolbar
      // share the exact same flat surface (no purple tint bleeding through
      // the prompt half of the composer).
      fillOpacity={0}
      className={`ant-composer relative ${large ? 'ant-composer-large p-2' : 'p-3'} shadow-[0_22px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl`}
    >
      {large && addControl}
      <div className={`ant-composer-input-wrap ${large ? 'px-2' : 'px-1 pt-0.5'}`}>
        <textarea
          value={prompt}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit(prompt); } }}
          placeholder={large ? 'Ask anything...' : placeholderByMode[visibleAgentMode]}
          rows={1}
          className="ant-composer-textarea block w-full resize-none overflow-hidden border-0 bg-transparent text-[16px] font-normal leading-[1.55] text-white/85 caret-violet-200 outline-none focus:outline-none focus:ring-0"
          style={{ maxHeight: large ? 118 : 140, minHeight: large ? 40 : 42 }}
          onInput={(e) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, large ? 118 : 140) + 'px'; }}
        />
      </div>
      <div className={`ant-composer-toolbar ${large ? 'ant-composer-toolbar-large' : 'mt-5'} flex flex-wrap items-center gap-2.5`}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.zip"
          className="hidden"
          onChange={handleFilesChosen}
        />
        {!large && addControl}

        <Popover open={modeOpen} onOpenChange={setModeOpen}>
          <PopoverTrigger asChild>
            <button className="ant-ctrl-accent flex h-10 items-center gap-2 rounded-full px-3.5 text-xs font-semibold">
              <SelectedIcon className="h-3.5 w-3.5" />
              {large ? AGENT_MODE_SHORT_LABEL[visibleAgentMode] : AGENT_MODE_LABEL[visibleAgentMode]}
              <ChevronDown className={`h-3.5 w-3.5 transition ${modeOpen ? 'rotate-180' : ''}`} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side={large ? 'bottom' : 'top'}
            align="start"
            sideOffset={8}
            className="ant-popover-surface !w-[min(390px,calc(100vw-32px))] max-h-[min(620px,calc(100vh-140px))] overflow-y-auto !rounded-[18px] !p-2"
          >
            <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/38">How should AI Ant help?</p>
            {AGENT_MODE_OPTIONS.map(({ mode, description, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => { setAgentMode(mode); setModeOpen(false); }}
                className={`flex w-full items-start gap-3 rounded-[12px] px-3 py-2.5 text-left transition ${visibleAgentMode === mode ? 'bg-violet-500/15 text-white' : 'text-white/65 hover:bg-white/[0.06] hover:text-white'}`}
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-violet-200/75" />
                <span>
                  <span className="block text-[13px] font-bold">{AGENT_MODE_LABEL[mode]}</span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-white/38">{description}</span>
                </span>
              </button>
            ))}
            <div className="my-2 mx-2 h-px bg-white/[0.06]" />
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/28">Model preference</div>
            {modelPreferenceOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setModelRoutingPreference(option.value)}
                className={`flex w-full items-start gap-3 rounded-[12px] px-3 py-2.5 text-left transition ${modelRoutingPreference === option.value ? 'bg-cyan-500/12 text-white' : 'text-white/65 hover:bg-white/[0.06] hover:text-white'}`}
              >
                <Brain className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200/75" />
                <span>
                  <span className="block text-[13px] font-bold">{option.label}</span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-white/38">{option.description}</span>
                </span>
              </button>
            ))}
            <div className="mx-3 mt-2 rounded-[12px] border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-[11px] text-white/38">
              Usage remaining: 39 messages
            </div>
          </PopoverContent>
        </Popover>

        {showModelChip && (
          <button
            type="button"
            className="ant-ctrl-chip ant-model-chip hidden h-10 items-center rounded-full px-3 text-[11px] font-semibold sm:inline-flex"
            onClick={() => setModelRoutingPreference('auto')}
            title="Clear model preference"
          >
            {currentModelPreference.shortLabel}
            <X className="ml-1.5 h-3 w-3 opacity-60" />
          </button>
        )}
        {!large && <div className="min-w-[12px] flex-1" />}

        <button onClick={onToggleVoice}
          className={`ant-ctrl-neutral relative flex ${large ? 'h-10 w-10' : 'h-9 w-9'} shrink-0 items-center justify-center rounded-full ${voiceActive ? 'is-active-violet' : ''}`}
          title="Voice">
          {voiceActive && <span className="absolute inset-0 animate-ping rounded-full bg-violet-500/24" />}
          <Mic className="h-4 w-4" />
        </button>
        <button onClick={() => onSubmit(prompt)} disabled={!prompt.trim()}
          aria-label="Send message"
          className={`ant-ctrl-send group flex ${large ? 'h-10 w-10 px-0' : 'h-9 min-w-[78px] px-4'} shrink-0 items-center justify-center gap-2 rounded-full text-xs font-semibold ${prompt.trim() ? 'is-armed' : 'is-disabled'}`}>
          {!large && <span>Send</span>}
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </div>
    </BorderGlow>
  );
}

export function AddMenuItem({ icon: Icon, label, description, onClick, comingSoon }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description?: string;
  onClick?: () => void;
  comingSoon?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={comingSoon}
      onClick={comingSoon ? undefined : onClick}
      className={`flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2 text-left text-[13px] transition ${
        comingSoon
          ? 'cursor-not-allowed text-white/35'
          : 'text-white/80 hover:bg-white/[0.06] hover:text-white'
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${comingSoon ? 'text-white/25' : 'text-violet-200/75'}`} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{label}</span>
        {description && <span className="mt-0.5 block truncate text-[11px] font-normal text-white/35">{description}</span>}
      </span>
      {comingSoon && (
        <span className="rounded-full border border-white/[0.10] bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white/40">
          Coming soon
        </span>
      )}
    </button>
  );
}

export function ModelRoutingSelector({ value, onChange, manualSelection, onManualSelection, large }: {
  value: ModelRoutingPreference;
  onChange: (value: ModelRoutingPreference) => void;
  manualSelection: ManualModelSelection | null;
  onManualSelection: (selection: ManualModelSelection) => void;
  large?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [manualOpen, setManualOpen] = React.useState(value === 'manual');
  const current = MODEL_ROUTING_OPTIONS.find((option) => option.value === value) ?? MODEL_ROUTING_OPTIONS[0];
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={`ant-ctrl-model flex h-10 items-center gap-2 rounded-full px-3.5 text-xs font-semibold ${open ? 'is-active-cyan' : ''}`}>
          <Brain className="h-3.5 w-3.5 text-cyan-200/75" />
          <span className="hidden sm:inline">Model:</span> {current.shortLabel}
          <ChevronDown className={`h-3.5 w-3.5 transition ${open ? 'rotate-180' : ''}`} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={large ? 'bottom' : 'top'}
        align="start"
        sideOffset={6}
        className="!w-[min(380px,calc(100vw-32px))] max-h-[min(560px,calc(100vh-140px))] overflow-y-auto !rounded-[16px] !bg-[#111827] !p-1.5"
      >
        {MODEL_ROUTING_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              onChange(option.value);
              setManualOpen(option.value === 'manual');
              if (option.value !== 'manual') setOpen(false);
            }}
            className={`flex w-full items-start gap-3 rounded-[12px] px-3 py-2.5 text-left transition ${value === option.value ? 'bg-cyan-500/12 text-white' : 'text-white/65 hover:bg-white/[0.06] hover:text-white'}`}
          >
            <Brain className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200/75" />
            <span>
              <span className="block text-[13px] font-bold">{option.label}</span>
              <span className="mt-0.5 block text-[11px] leading-snug text-white/38">{option.description}</span>
            </span>
          </button>
        ))}
        {(manualOpen || value === 'manual') && (
          <div className="mt-1 max-h-[300px] overflow-y-auto border-t border-white/[0.07] pt-2">
            {MANUAL_MODEL_GROUPS.map((group) => (
              <div key={group.capability} className="mb-2">
                <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/28">{group.label}</p>
                {group.models.map((model) => {
                  const active = manualSelection?.capability === group.capability && manualSelection.modelId === model.modelId;
                  return (
                    <button
                      key={`${group.capability}-${model.modelId}`}
                      onClick={() => {
                        onManualSelection({ capability: group.capability, provider: model.provider, modelId: model.modelId });
                        onChange('manual');
                      }}
                      className={`block w-full rounded-[10px] px-3 py-2 text-left text-xs transition ${active ? 'bg-violet-500/15 text-violet-100' : 'text-white/55 hover:bg-white/[0.05] hover:text-white/80'}`}
                    >
                      {model.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ── Tool Router Panel ─────────────────────────────────────────────────────────

export function AIAntToolRouterPanel({ tools, activeTaskDomain }: { tools: AntTool[]; activeTaskDomain?: AntDomain }) {
  const catColors: Record<AntToolCategory, string> = {
    filesystem: 'border-blue-500/25 bg-blue-500/[0.08] text-blue-400',
    browser: 'border-cyan-500/25 bg-cyan-500/[0.08] text-cyan-400',
    workflow: 'border-violet-500/25 bg-violet-500/[0.08] text-violet-400',
    spreadsheets: 'border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-400',
    ocr: 'border-amber-500/25 bg-amber-500/[0.08] text-amber-400',
    email: 'border-rose-500/25 bg-rose-500/[0.08] text-rose-400',
    cloud: 'border-sky-500/25 bg-sky-500/[0.08] text-sky-400',
    messaging: 'border-indigo-500/25 bg-indigo-500/[0.08] text-indigo-400',
    mobile: 'border-purple-500/25 bg-purple-500/[0.08] text-purple-400',
    desktop: 'border-orange-500/25 bg-orange-500/[0.08] text-orange-400',
    api: 'border-pink-500/25 bg-pink-500/[0.08] text-pink-400',
  };
  const costDot: Record<string, string> = { free: 'bg-emerald-500', low: 'bg-amber-400', medium: 'bg-orange-400', high: 'bg-red-400' };
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const sorted = [...tools].sort((a, b) => b.confidence - a.confidence);
  return (
    <div className="flex flex-col gap-1.5">
      <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-white/25">Tool Router — {tools.filter(t => t.available).length} available</p>
      {sorted.map((t) => (
        <div key={t.id} className={`overflow-hidden rounded-[12px] border transition ${expanded === t.id ? 'border-white/[0.12]' : 'border-white/[0.06]'} ${!t.available ? 'opacity-45' : ''}`}>
          <button onClick={() => setExpanded(expanded === t.id ? null : t.id)}
            className="flex w-full items-center gap-2.5 px-2.5 py-2 text-left hover:bg-white/[0.04]">
            <span className="text-base">{t.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-white/80">{t.name}</span>
                {t.offline && <span className="text-[9px] text-white/30">offline</span>}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="h-1 w-12 overflow-hidden rounded-full bg-white/[0.08]">
                  <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${t.confidence * 100}%` }} />
                </div>
                <span className="text-[9px] text-white/30">{Math.round(t.confidence * 100)}%</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`h-1.5 w-1.5 rounded-full ${costDot[t.cost]}`} title={`Cost: ${t.cost}`} />
              <span className={`rounded-full border px-1.5 py-0.5 text-[8px] font-bold ${catColors[t.category]}`}>{t.category}</span>
            </div>
          </button>
          {expanded === t.id && (
            <div className="border-t border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
              {t.reason && <p className="mb-1.5 text-[10px] text-white/50"><span className="text-white/25">Why:</span> {t.reason}</p>}
              <p className="mb-1.5 text-[10px] text-white/40"><span className="text-white/25">Requires:</span> {t.requiresPermission}</p>
              {t.fallback && <p className="text-[10px] text-white/30"><span className="text-white/25">Fallback:</span> {t.fallback}</p>}
              {!t.available && (
                <div className="mt-2 flex items-center gap-1.5 rounded-[8px] border border-amber-500/20 bg-amber-500/[0.08] px-2 py-1.5">
                  <span className="text-[9px] text-amber-400">Tool unavailable — fallback {t.fallback ? `to ${t.fallback}` : 'required'}</span>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Permission Manager Panel ──────────────────────────────────────────────────

export function AIAntPermissionManager({ permissions, onToggle }: {
  permissions: AntPermissionScope[];
  onToggle: (id: string) => void;
}) {
  const riskBadge: Record<AntRiskLevel, string> = {
    Safe: 'border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400',
    Moderate: 'border-amber-500/20 bg-amber-500/[0.08] text-amber-400',
    Sensitive: 'border-orange-500/20 bg-orange-500/[0.08] text-orange-400',
    'High Risk': 'border-red-500/20 bg-red-500/[0.08] text-red-400',
  };
  const accessLabel: Record<string, string> = { 'read': 'Read', 'write': 'Write', 'read-write': 'R/W', 'none': 'Blocked' };
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[9px] font-bold uppercase tracking-widest text-white/25">Permission Scopes</p>
      {permissions.map((p) => (
        <div key={p.id} className={`rounded-[12px] border p-2.5 transition ${p.granted ? 'border-white/[0.07] bg-white/[0.03]' : 'border-white/[0.04] bg-white/[0.01] opacity-60'}`}>
          <div className="flex items-center gap-2">
            <span className="text-base">{p.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-white/80">{p.name}</span>
                <span className="text-[8px] text-white/30">{p.type}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`rounded-full border px-1.5 py-0.5 text-[8px] font-bold ${riskBadge[p.risk]}`}>{p.risk}</span>
                <span className="text-[9px] text-white/30">{accessLabel[p.access]}</span>
                {p.temporary && <span className="text-[9px] text-amber-400/70">temp</span>}
              </div>
            </div>
            <button onClick={() => onToggle(p.id)}
              className={`shrink-0 h-5 w-9 rounded-full border transition ${p.granted ? 'border-violet-500/40 bg-violet-500/25' : 'border-white/[0.10] bg-white/[0.04]'}`}>
              <span className={`block h-3.5 w-3.5 rounded-full transition-all ${p.granted ? 'translate-x-4 bg-violet-400' : 'translate-x-0.5 bg-white/25'}`} />
            </button>
          </div>
        </div>
      ))}
      <button className="mt-1 rounded-[10px] border border-dashed border-white/[0.08] py-2 text-center text-[10px] text-white/25 hover:border-white/[0.16] hover:text-white/50 transition">
        + Add permission scope
      </button>
    </div>
  );
}

// ── Delivery Panel ────────────────────────────────────────────────────────────

export function AIAntDeliveryPanel({ deliveries, onApprove, onRetry }: {
  deliveries: AntDelivery[];
  onApprove: (id: string) => void;
  onRetry: (id: string) => void;
}) {
  const destIcon: Record<AntDelivery['destination'], string> = {
    line: '💚', email: '📧', 'google-drive': '☁️', slack: '💬', discord: '🟣', colony: '🐜',
  };
  const statusStyle: Record<AntDelivery['status'], { cls: string; label: string }> = {
    pending:  { cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: '⏳ Pending' },
    approved: { cls: 'text-blue-400 bg-blue-500/10 border-blue-500/20', label: '✓ Approved' },
    sent:     { cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: '✓ Sent' },
    failed:   { cls: 'text-red-400 bg-red-500/10 border-red-500/20', label: '✕ Failed' },
    expired:  { cls: 'text-white/30 bg-white/[0.04] border-white/[0.06]', label: '⊘ Expired' },
  };
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[9px] font-bold uppercase tracking-widest text-white/25">Remote Delivery</p>
      {deliveries.map((d) => {
        const ss = statusStyle[d.status];
        return (
          <div key={d.id} className="rounded-[12px] border border-white/[0.07] bg-white/[0.03] p-3">
            <div className="flex items-start gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-sm">
                {destIcon[d.destination]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] font-medium text-white/80">{d.fileName}</div>
                <div className="text-[10px] text-white/35">{d.destination.replace('-', ' ')} · {d.fileSize}</div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${ss.cls}`}>{ss.label}</span>
                  <span className="text-[9px] text-white/25">{d.deliveredAt ?? d.createdAt}</span>
                </div>
              </div>
            </div>
            {d.status === 'pending' && (
              <div className="mt-2 flex gap-1.5">
                <button onClick={() => onApprove(d.id)}
                  className="flex-1 rounded-[8px] bg-violet-600/20 py-1.5 text-[10px] font-semibold text-violet-300 hover:bg-violet-600/35 transition">
                  Approve & Send
                </button>
                <button className="rounded-[8px] border border-white/[0.08] px-2.5 py-1.5 text-[10px] text-white/40 hover:text-white/60 transition">
                  Edit
                </button>
              </div>
            )}
            {d.status === 'failed' && (
              <button onClick={() => onRetry(d.id)}
                className="mt-2 w-full rounded-[8px] border border-red-500/20 bg-red-500/[0.08] py-1.5 text-[10px] text-red-400 hover:bg-red-500/[0.14] transition">
                🔄 Retry Delivery
              </button>
            )}
          </div>
        );
      })}
      <div className="rounded-[12px] border border-dashed border-white/[0.08] p-3 text-center">
        <p className="text-[10px] text-white/25">Supported: LINE · Slack · Email · Drive · Discord · Colony</p>
      </div>
    </div>
  );
}

// ── Live Console ──────────────────────────────────────────────────────────────

export function AIAntLiveConsole({ events, onClose, paused, onTogglePause }: {
  events: AntLiveEvent[];
  onClose: () => void;
  paused: boolean;
  onTogglePause: () => void;
}) {
  const eventStyle: Record<AntLiveEvent['type'], string> = {
    action: 'text-blue-400', screenshot: 'text-cyan-400',
    step: 'text-emerald-400', error: 'text-red-400',
    approval: 'text-amber-400', memory: 'text-violet-400',
  };
  const consoleEndRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => { if (!paused) consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [events, paused]);
  return (
    <div className="fixed bottom-20 right-4 z-[200] w-80 overflow-hidden rounded-[18px] border border-white/[0.12] bg-[#08080f]/96 shadow-[0_16px_48px_rgba(0,0,0,0.7)] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${paused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
          <span className="font-heading text-[11px] font-bold text-white/80">Live Console</span>
          <span className="text-[9px] text-white/30">{events.length} events</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={onTogglePause}
            className="rounded-md border border-white/[0.08] px-2 py-0.5 text-[9px] text-white/40 hover:text-white/70 transition">
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button onClick={onClose} className="flex h-5 w-5 items-center justify-center rounded text-white/30 hover:bg-white/[0.07] hover:text-white/70 transition"><X size={11} /></button>
        </div>
      </div>
      <div className="h-52 overflow-y-auto px-3 py-2 font-mono">
        {events.map((e) => {
          const dot = eventStyle[e.type];
          return (
          <div key={e.id} className="flex items-start gap-2 py-0.5">
            <span className="shrink-0 text-[9px] text-white/20 mt-0.5">{e.time}</span>
            <span className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${dot.replace('text-', 'bg-')}`} />
            <span className={`text-[10px] leading-snug ${dot}`}>{e.message}</span>
            <span className="ml-auto shrink-0 text-[8px] text-white/20">{e.device.split(' ')[0]}</span>
          </div>
          );
        })}
        <div ref={consoleEndRef} />
      </div>
      <div className="flex items-center gap-2 border-t border-white/[0.06] px-3 py-2">
        <span className="text-[9px] text-white/25 flex-1">Events streaming live</span>
        <button className="rounded-md bg-rose-500/15 px-2 py-0.5 text-[9px] font-semibold text-rose-400 hover:bg-rose-500/25 transition">Stop</button>
      </div>
    </div>
  );
}

// ── Autonomy Selector ─────────────────────────────────────────────────────────

export function AIAntAutonomySelector({ mode, setMode, onClose }: { mode: AntMode; setMode: (m: AntMode) => void; onClose: () => void }) {
  const cur = ANT_AUTONOMY_LEVELS.find(l => l.id === mode)!;
  return (
    <div className="fixed inset-0 z-[250] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-[24px] border border-white/[0.12] bg-[#0a0a16] shadow-[0_24px_64px_rgba(0,0,0,0.7)]"
        onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-white/[0.08] px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-[16px] font-extrabold text-white/90">Autonomy Level</h3>
              <p className="mt-0.5 text-[11px] text-white/40">Controls how much AI Ant acts independently</p>
            </div>
            <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.06] text-white/40 hover:text-white/70 transition">✕</button>
          </div>
        </div>
        <div className="p-5">
          <div className="mb-4 flex items-center gap-3 rounded-[14px] border border-violet-500/20 bg-violet-500/[0.07] p-3.5">
            <div className="flex-1">
              <div className="mb-1.5 text-[11px] font-semibold text-white/70">Automation Power</div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-violet-500 transition-all duration-700"
                  style={{ width: `${cur.power}%` }} />
              </div>
              <div className="mt-1 flex justify-between text-[9px] text-white/25">
                <span>Read-Only</span><span>Full Auto</span>
              </div>
            </div>
            <div className="shrink-0 text-center">
              <div className="font-heading text-2xl font-extrabold text-white/80">{cur.power}%</div>
              <div className="text-[9px] text-white/30">power</div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {ANT_AUTONOMY_LEVELS.map((level) => (
              <button key={level.id} onClick={() => { setMode(level.id); onClose(); }}
                className={`flex items-start gap-3 rounded-[14px] border p-3.5 text-left transition ${mode === level.id ? 'border-violet-500/30 bg-violet-500/[0.08]' : 'border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03]'}`}>
                <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${level.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[13px] font-bold ${mode === level.id ? 'text-white/90' : 'text-white/55'}`}>{level.label}</span>
                    <span className="shrink-0 text-[9px] text-white/30">{level.power}% power</span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-snug text-white/40">{level.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {level.checkpoints.map((cp) => (
                      <span key={cp} className="rounded-full border border-white/[0.07] bg-white/[0.04] px-2 py-0.5 text-[9px] text-white/30">{cp}</span>
                    ))}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] text-white/25"><Zap size={9} />{level.risk}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Recovery Card ─────────────────────────────────────────────────────────────

export function AIAntRecoveryCard({ taskTitle, onAction }: { taskTitle: string; onAction: (type: AntRecoverySuggestion['type']) => void }) {
  return (
    <div className="rounded-[16px] border border-red-500/20 bg-red-500/[0.05] p-4">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="text-lg">⚠️</span>
        <div>
          <div className="text-[12px] font-bold text-red-400">Task Failed — Recovery Options</div>
          <div className="text-[10px] text-white/40 truncate max-w-[220px]">{taskTitle}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {ANT_RECOVERY_SUGGESTIONS.map((s) => (
          <button key={s.id} onClick={() => onAction(s.type)}
            className="flex items-start gap-1.5 rounded-[10px] border border-white/[0.07] bg-white/[0.04] p-2.5 text-left transition hover:border-white/[0.14] hover:bg-white/[0.07]">
            <span className="text-sm shrink-0">{s.icon}</span>
            <div>
              <div className="text-[10px] font-semibold text-white/75">{s.label}</div>
              <div className="text-[9px] leading-snug text-white/35">{s.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Handoff Banner ────────────────────────────────────────────────────────────

export function AIAntHandoffBanner({ handoff, onContinue, onDismiss }: {
  handoff: AntHandoff;
  onContinue: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="mx-4 mb-3 overflow-hidden rounded-[14px] border border-blue-500/25 bg-blue-500/[0.07] px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-base">📲</div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold text-blue-300">Task available to continue</div>
          <div className="truncate text-[10px] text-white/50">{handoff.taskTitle} · from {handoff.fromDevice}</div>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.08]">
            <div className="h-full rounded-full bg-blue-500/60" style={{ width: `${handoff.progress}%` }} />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button onClick={onContinue}
            className="rounded-lg bg-blue-500/20 px-3 py-1.5 text-[10px] font-semibold text-blue-300 hover:bg-blue-500/35 transition">
            Continue
          </button>
          <button onClick={onDismiss} className="text-white/30 hover:text-white/60 transition px-1 text-sm">✕</button>
        </div>
      </div>
    </div>
  );
}

// ── Sandbox Panel ─────────────────────────────────────────────────────────────

export function AIAntSandboxPanel({ plan }: { plan: AntTaskPlan }) {
  const riskCls: Record<AntRiskLevel, string> = {
    Safe: 'text-emerald-400', Moderate: 'text-amber-400',
    Sensitive: 'text-orange-400', 'High Risk': 'text-red-400',
  };
  const [simulating, setSimulating] = React.useState(false);
  const [simDone, setSimDone] = React.useState(false);
  const runSim = () => {
    setSimulating(true);
    window.setTimeout(() => { setSimulating(false); setSimDone(true); }, 2000);
  };
  return (
    <div className="rounded-[14px] border border-cyan-500/20 bg-cyan-500/[0.05] p-3.5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">🧪</span>
          <span className="text-[11px] font-bold text-cyan-400">Safe Sandbox</span>
        </div>
        <span className="text-[9px] text-white/30">Dry-run simulation</span>
      </div>
      {!simDone ? (
        <>
          <p className="mb-3 text-[10px] leading-snug text-white/45">
            Simulate this plan without making real changes. Side effects detected and reported before execution.
          </p>
          <button onClick={runSim} disabled={simulating}
            className="w-full rounded-[10px] bg-cyan-500/15 py-2 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500/25 transition disabled:opacity-50">
            {simulating ? '🔄 Simulating…' : '▶ Run Simulation'}
          </button>
        </>
      ) : (
        <div className="flex flex-col gap-1.5">
          <div className="text-[10px] font-semibold text-white/60 mb-1">Simulation Results</div>
          {plan.steps.map((s) => (
            <div key={s.id} className="flex items-center gap-2 rounded-[8px] bg-white/[0.04] px-2.5 py-1.5">
              <span className="text-[10px] text-emerald-400">✓</span>
              <span className="text-[10px] text-white/65 flex-1">{s.label}</span>
              <span className={`text-[9px] font-semibold ${!s.reversible ? 'text-amber-400' : 'text-white/25'}`}>
                {s.reversible ? '↩ reversible' : '⚠ permanent'}
              </span>
            </div>
          ))}
          <div className="mt-1.5 flex items-center gap-2 rounded-[8px] border border-emerald-500/20 bg-emerald-500/[0.07] px-2.5 py-1.5">
            <span className="text-[10px] text-emerald-400">✓ Simulation passed — no unexpected side effects</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Status Card Strip ─────────────────────────────────────────────────────────

export function AIAntStatusStrip({ tasks, devices, memories, deliveries }: {
  tasks: AntTask[]; devices: AntDevice[]; memories: AntMemoryEntry[]; deliveries: AntDelivery[];
}) {
  const stats = [
    { label: 'Online Devices', value: devices.filter(d => d.online).length, icon: '💻', color: 'text-emerald-400' },
    { label: 'Active Tasks', value: tasks.filter(t => t.status === 'analyzing' || t.status === 'reading').length, icon: '⚡', color: 'text-violet-400' },
    { label: 'Memory Patterns', value: memories.length, icon: '🧠', color: 'text-blue-400' },
    { label: 'Pending Delivery', value: deliveries.filter(d => d.status === 'pending').length, icon: '📤', color: 'text-amber-400' },
  ];
  return (
    <div className="grid grid-cols-4 gap-2.5 mx-auto w-full max-w-xl px-4 mb-5">
      {stats.map((s) => (
        <div key={s.label} className="rounded-[14px] border border-white/[0.07] bg-white/[0.03] p-3 text-center transition hover:bg-white/[0.06]">
          <div className="text-xl mb-1">{s.icon}</div>
          <div className={`font-heading text-lg font-extrabold ${s.color}`}>{s.value}</div>
          <div className="text-[9px] text-white/30 leading-tight mt-0.5">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Connected Devices Strip ───────────────────────────────────────────────────

export function AIAntDevicesStrip({ devices }: { devices: AntDevice[] }) {
  const deviceIcon: Record<AntDeviceType, string> = { mac: '💻', windows: '🖥', iphone: '📱', android: '📲' };
  const statusDot: Record<AntDeviceStatus, string> = { active: 'bg-emerald-500', idle: 'bg-amber-500/60', secure: 'bg-blue-500/60' };
  return (
    <div className="mx-auto mb-6 max-w-xl px-4">
      <p className="mb-2.5 text-center text-[9px] font-bold uppercase tracking-widest text-white/20">Connected Devices</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {devices.map((d) => (
          <div key={d.id} className="flex shrink-0 items-center gap-2 rounded-[12px] border border-white/[0.07] bg-white/[0.03] px-3 py-2">
            <span className="text-base">{deviceIcon[d.type]}</span>
            <div>
              <div className="text-[10px] font-medium text-white/70 whitespace-nowrap">{d.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`h-1 w-1 rounded-full ${d.online ? statusDot[d.status] : 'bg-white/[0.15]'}`} />
                <span className="text-[9px] text-white/30">{d.online ? d.lastSeen : 'Offline'}</span>
                {d.batteryLevel !== undefined && <span className="text-[9px] text-white/25">{d.batteryLevel}%</span>}
              </div>
            </div>
          </div>
        ))}
        <button className="flex shrink-0 items-center gap-1.5 rounded-[12px] border border-dashed border-white/[0.07] px-3 py-2 text-[10px] text-white/25 hover:border-white/[0.14] hover:text-white/50 transition">
          + Pair device
        </button>
      </div>
    </div>
  );
}

// ── Learned Patterns Panel ────────────────────────────────────────────────────

export function AIAntLearnedPatterns({ patterns, onToggle, onRemove }: {
  patterns: AntLearnedPattern[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const domainColor: Record<AntDomain, string> = {
    general: 'text-white/40 bg-white/[0.06]', finance: 'text-amber-400 bg-amber-500/10',
    hr: 'text-blue-400 bg-blue-500/10', email: 'text-violet-400 bg-violet-500/10',
    'file-deletion': 'text-red-400 bg-red-500/10', 'external-export': 'text-orange-400 bg-orange-500/10',
  };
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-bold uppercase tracking-widest text-white/25">Learned Patterns</p>
        <span className="text-[9px] text-violet-400/60">{patterns.filter(p => p.enabled).length} active</span>
      </div>
      {patterns.map((p) => (
        <div key={p.id} className={`rounded-[14px] border p-3 transition ${p.enabled ? 'border-white/[0.07] bg-white/[0.03]' : 'border-white/[0.04] bg-transparent opacity-50'}`}>
          <div className="flex items-start gap-2.5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[11px] font-semibold text-white/85">{p.name}</span>
                <span className={`rounded px-1 py-0.5 text-[8px] font-bold ${domainColor[p.domain]}`}>{p.domain}</span>
              </div>
              <p className="text-[10px] leading-snug text-white/40 mb-2">{p.description}</p>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1">
                  <div className="h-0.5 w-14 overflow-hidden rounded-full bg-white/[0.08]">
                    <div className="h-full rounded-full bg-violet-500" style={{ width: `${p.confidence * 100}%` }} />
                  </div>
                  <span className="text-[9px] text-white/30">{Math.round(p.confidence * 100)}%</span>
                </div>
                <span className="text-[9px] text-white/25">·</span>
                <span className="text-[9px] text-white/30">Used {p.frequency}×</span>
                <span className="text-[9px] text-white/25">·</span>
                <span className="text-[9px] text-white/25">{p.lastSeen}</span>
              </div>
              {p.suggestedAutomation && p.enabled && (
                <div className="flex items-center gap-1.5 rounded-[8px] border border-violet-500/20 bg-violet-500/[0.07] px-2 py-1.5">
                  <span className="text-[9px] text-violet-400">⚡ {p.suggestedAutomation}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <button onClick={() => onToggle(p.id)}
                className={`h-4.5 w-8 rounded-full border transition relative ${p.enabled ? 'border-violet-500/40 bg-violet-500/25' : 'border-white/[0.10] bg-white/[0.04]'}`}
                style={{ height: 18, width: 32 }}>
                <span className={`absolute top-0.5 h-3 w-3 rounded-full transition-all duration-200 ${p.enabled ? 'left-4 bg-violet-400' : 'left-0.5 bg-white/30'}`} />
              </button>
              <button onClick={() => onRemove(p.id)} className="text-[9px] text-white/20 hover:text-red-400 transition">remove</button>
            </div>
          </div>
        </div>
      ))}
      <div className="mt-1 rounded-[12px] border border-dashed border-white/[0.08] p-3 text-center">
        <p className="text-[10px] text-white/30 mb-1">Pattern learning is active</p>
        <p className="text-[9px] text-white/20">AI Ant observes your habits and suggests automations</p>
      </div>
    </div>
  );
}

// ── Semantic Search View ──────────────────────────────────────────────────────

export function AIAntSemanticSearch({ onClose, onSubmit }: { onClose: () => void; onSubmit: (q: string) => void }) {
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState<AntSearchFilter>('all');
  const [results, setResults] = React.useState<AntSearchResult[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [searched, setSearched] = React.useState(false);

  const FILTERS: Array<{ id: AntSearchFilter; label: string }> = [
    { id: 'all', label: 'All' }, { id: 'pdf', label: 'PDFs' },
    { id: 'sheets', label: 'Sheets' }, { id: 'reports', label: 'Reports' },
    { id: 'images', label: 'Images' }, { id: 'recent', label: 'Recent' },
    { id: 'shared', label: 'Shared' }, { id: 'workflow-output', label: 'Workflow Output' },
  ];

  const doSearch = () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearched(false);
    window.setTimeout(() => {
      const q = query.toLowerCase();
      const filtered = ANT_SEARCH_RESULTS.filter(r => {
        if (filter === 'pdf') return r.type === 'PDF';
        if (filter === 'sheets') return r.type === 'Sheet';
        if (filter === 'reports') return r.type === 'Report';
        if (filter === 'workflow-output') return r.source === 'report' || r.source === 'workflow';
        return true;
      }).filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.matchReason.toLowerCase().includes(q) ||
        (r.preview ?? '').toLowerCase().includes(q) ||
        q.split(' ').some(word => r.name.toLowerCase().includes(word) || r.matchReason.toLowerCase().includes(word))
      ).sort((a, b) => b.relevance - a.relevance);
      setResults(filtered.length ? filtered : ANT_SEARCH_RESULTS.slice(0, 4));
      setSearching(false);
      setSearched(true);
    }, 900);
  };

  const srcIcon: Record<AntSearchResult['source'], string> = {
    local: '💻', drive: '☁️', workflow: '⚡', chat: '💬', report: '📋',
  };

  return (
    <div className="flex h-full flex-col bg-[#070B14] text-white/90">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-white/[0.07] bg-[#070B14]/95 px-5 py-3">
        <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/40 hover:text-white/70 transition text-sm">←</button>
        <div className="flex flex-1 items-center gap-2 rounded-[14px] border border-white/[0.10] bg-white/[0.05] px-3 py-2 focus-within:border-violet-500/40">
          <Search size={14} className="shrink-0 text-white/30" />
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch()}
            placeholder="Search by meaning — e.g. 'invoice last month', 'marketing strategy'…"
            className="flex-1 bg-transparent text-sm text-white/90 placeholder-white/25 outline-none"
            autoFocus
          />
          {query && <button onClick={() => { setQuery(''); setResults([]); setSearched(false); }} className="flex h-4 w-4 items-center justify-center rounded text-white/25 hover:text-white/50 transition"><X size={10} /></button>}
        </div>
        <button onClick={doSearch} disabled={!query.trim() || searching}
          className="rounded-[12px] bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-40">
          {searching ? '…' : 'Search'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-white/[0.05] px-5 py-2.5">
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-semibold transition ${filter === f.id ? 'border-violet-500/40 bg-violet-500/15 text-violet-300' : 'border-white/[0.07] text-white/35 hover:border-white/[0.14] hover:text-white/60'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {!searched && !searching && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="mb-3 text-4xl opacity-30">🔍</span>
            <p className="text-sm text-white/30">Search by meaning, not filename.</p>
            <p className="mt-1 text-[11px] text-white/20">Try: "invoice last month" · "marketing strategy" · "budget PDF"</p>
          </div>
        )}
        {searching && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex gap-1.5 mb-3">
              {[0,1,2].map(i => <span key={i} className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${i * 120}ms` }} />)}
            </div>
            <p className="text-sm text-white/40">Searching semantically…</p>
          </div>
        )}
        {searched && (
          <>
            <p className="mb-4 text-[11px] text-white/30">{results.length} results for "{query}"</p>
            <div className="flex flex-col gap-3">
              {results.map(r => (
                <div key={r.id} className="group rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-4 transition hover:border-white/[0.12] hover:bg-white/[0.05] cursor-pointer"
                  onClick={() => onSubmit(`Tell me about ${r.name}`)}>
                  <div className="mb-2 flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-base">{r.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-heading text-[12px] font-bold text-white/85">{r.name}</span>
                        <span className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold bg-white/[0.06] text-white/40">{r.type}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-white/35">
                        <span>{srcIcon[r.source]}</span>
                        <span>{r.path}</span>
                        <span>·</span>
                        <span>{r.lastOpened}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-heading text-sm font-bold text-violet-400">{Math.round(r.relevance * 100)}%</div>
                      <div className="text-[9px] text-white/25">match</div>
                    </div>
                  </div>
                  <div className="mb-2.5 rounded-[8px] border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5">
                    <p className="text-[10px] text-white/40"><span className="text-white/25">Why: </span>{r.matchReason}</p>
                  </div>
                  {r.preview && <p className="mb-2 text-[10px] italic text-white/35">"{r.preview}"</p>}
                  <div className="flex items-center gap-1.5">
                    {r.relatedWorkflows?.map(w => (
                      <span key={w} className="rounded-full border border-violet-500/20 bg-violet-500/[0.08] px-2 py-0.5 text-[9px] text-violet-400">⚡ {w}</span>
                    ))}
                    <div className="ml-auto flex gap-1.5 opacity-0 group-hover:opacity-100 transition">
                      <button className="rounded-lg border border-white/[0.08] px-2 py-1 text-[10px] text-white/50 hover:text-white/80 transition">Open</button>
                      <button className="rounded-lg border border-white/[0.08] px-2 py-1 text-[10px] text-white/50 hover:text-white/80 transition">Send</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Workspace Graph ───────────────────────────────────────────────────────────

export function AIAntWorkspaceGraph({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = React.useState<GraphNode | null>(null);
  const [hovered, setHovered] = React.useState<string | null>(null);
  const nodeTypeColor: Record<GraphNodeType, { ring: string; bg: string; text: string }> = {
    file:     { ring: 'stroke-blue-500/60',    bg: '#1a2a3a', text: 'text-blue-300' },
    folder:   { ring: 'stroke-amber-500/60',   bg: '#2a2010', text: 'text-amber-300' },
    workflow: { ring: 'stroke-violet-500/80',  bg: '#1e1535', text: 'text-violet-300' },
    agent:    { ring: 'stroke-purple-500/60',  bg: '#1d1030', text: 'text-purple-300' },
    app:      { ring: 'stroke-cyan-500/60',    bg: '#0d2025', text: 'text-cyan-300' },
    report:   { ring: 'stroke-emerald-500/60', bg: '#0d2518', text: 'text-emerald-300' },
    device:   { ring: 'stroke-indigo-500/60',  bg: '#0e1530', text: 'text-indigo-300' },
    task:     { ring: 'stroke-orange-500/60',  bg: '#2a1810', text: 'text-orange-300' },
  };
  const legendItems: Array<{ type: GraphNodeType; label: string }> = [
    { type: 'file', label: 'File' }, { type: 'folder', label: 'Folder' },
    { type: 'workflow', label: 'Workflow' }, { type: 'agent', label: 'Agent' },
    { type: 'app', label: 'App' }, { type: 'report', label: 'Report' },
    { type: 'device', label: 'Device' }, { type: 'task', label: 'Task' },
  ];
  const SVG_W = 560, SVG_H = 460;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex w-full max-w-3xl flex-col overflow-hidden rounded-[24px] border border-white/[0.10] bg-[#080D1A] shadow-[0_32px_80px_rgba(0,0,0,0.7)]"
        style={{ maxHeight: 'min(90vh, 660px)' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-6 py-4">
          <div>
            <h3 className="font-heading text-[16px] font-extrabold text-white/90">Workspace Graph</h3>
            <p className="mt-0.5 text-[11px] text-white/35">Your files, workflows, agents, and devices — visualized</p>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-xl bg-white/[0.06] text-white/40 hover:text-white/70 transition">✕</button>
        </div>
        <div className="flex min-h-0 flex-1">
          {/* Graph area */}
          <div className="relative flex-1 overflow-hidden">
            <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full h-full" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(124,92,252,0.04) 0%, transparent 70%)' }}>
              <defs>
                <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(139,92,246,0.3)" />
                  <stop offset="100%" stopColor="rgba(139,92,246,0)" />
                </radialGradient>
              </defs>
              {/* Grid dots */}
              {Array.from({ length: 12 }).map((_, row) =>
                Array.from({ length: 15 }).map((_, col) => (
                  <circle key={`${row}-${col}`} cx={col * 40 + 10} cy={row * 40 + 10} r={0.8} fill="rgba(255,255,255,0.06)" />
                ))
              )}
              {/* Edges */}
              {GRAPH_EDGES.map((edge, i) => {
                const from = GRAPH_NODES.find(n => n.id === edge.from)!;
                const to = GRAPH_NODES.find(n => n.id === edge.to)!;
                const isHovered = hovered === edge.from || hovered === edge.to;
                const mx = (from.x + to.x) / 2, my = (from.y + to.y) / 2;
                return (
                  <g key={i}>
                    <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                      stroke={isHovered ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.08)'}
                      strokeWidth={isHovered ? 1.5 : 1}
                      strokeDasharray={isHovered ? 'none' : '4 4'} />
                    <text x={mx} y={my - 4} textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.2)" fontFamily="monospace">{edge.label}</text>
                  </g>
                );
              })}
              {/* Nodes */}
              {GRAPH_NODES.map(node => {
                const c = nodeTypeColor[node.type];
                const isSelected = selected?.id === node.id;
                const isHov = hovered === node.id;
                return (
                  <g key={node.id} style={{ cursor: 'pointer' }}
                    onClick={e => { e.stopPropagation(); setSelected(node); }}
                    onMouseEnter={() => setHovered(node.id)}
                    onMouseLeave={() => setHovered(null)}>
                    {node.active && <circle cx={node.x} cy={node.y} r={22} fill="rgba(139,92,246,0.06)" className="animate-pulse" />}
                    <circle cx={node.x} cy={node.y} r={isSelected ? 20 : isHov ? 19 : 17}
                      fill={c.bg} className={`${c.ring} transition-all`} stroke={isSelected ? 'rgba(139,92,246,0.8)' : undefined}
                      strokeWidth={isSelected ? 2 : 1.5} />
                    <text x={node.x} y={node.y + 1} textAnchor="middle" dominantBaseline="middle" fontSize="14">{node.icon}</text>
                    <text x={node.x} y={node.y + 26} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.5)" fontFamily="DM Sans">{node.label.length > 12 ? node.label.slice(0, 12) + '…' : node.label}</text>
                  </g>
                );
              })}
            </svg>
          </div>
          {/* Right info panel */}
          <div className="w-52 shrink-0 flex flex-col border-l border-white/[0.06]">
            <div className="p-4 border-b border-white/[0.06]">
              {selected ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{selected.icon}</span>
                    <div>
                      <div className={`text-[12px] font-bold ${nodeTypeColor[selected.type].text}`}>{selected.label}</div>
                      <div className="text-[9px] text-white/30 capitalize">{selected.type}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {GRAPH_EDGES.filter(e => e.from === selected.id || e.to === selected.id).map((e, i) => {
                      const other = GRAPH_NODES.find(n => n.id === (e.from === selected.id ? e.to : e.from))!;
                      return (
                        <div key={i} className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[9px] text-white/40">
                          <span>{other.icon}</span><span>{e.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={() => setSelected(null)} className="mt-3 text-[9px] text-white/25 hover:text-white/50 transition">Clear selection</button>
                </>
              ) : (
                <p className="text-[11px] text-white/30">Click a node to see connections</p>
              )}
            </div>
            {/* Legend */}
            <div className="p-3 flex-1">
              <p className="mb-2.5 text-[9px] font-bold uppercase tracking-widest text-white/20">Legend</p>
              <div className="flex flex-col gap-1.5">
                {legendItems.map(item => (
                  <div key={item.type} className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full" style={{ background: `var(--ring-${item.type}, rgba(255,255,255,0.3))` }} />
                    <span className={`text-[9px] ${nodeTypeColor[item.type].text}`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Knowledge Base Panel ──────────────────────────────────────────────────────

export function AIAntKnowledgeBase({ entries, onPin, onDelete }: {
  entries: KnowledgeEntry[];
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [search, setSearch] = React.useState('');
  const [tab, setTab] = React.useState<KnowledgeCategory | 'all'>('all');
  const TABS: Array<{ id: KnowledgeCategory | 'all'; label: string }> = [
    { id: 'all', label: 'All' }, { id: 'recent', label: 'Recent' },
    { id: 'important', label: 'Important' }, { id: 'insight', label: 'Insights' },
    { id: 'resource', label: 'Resources' },
  ];
  const srcIcon: Record<KnowledgeSource, string> = {
    workflow: '⚡', chat: '💬', file: '📄', report: '📋', pattern: '🧠', approval: '🔐',
  };
  const filtered = entries.filter(e => !e.archived).filter(e => tab === 'all' || e.category === tab)
    .filter(e => !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.summary.toLowerCase().includes(search.toLowerCase()));
  const pinned = filtered.filter(e => e.pinned);
  const rest = filtered.filter(e => !e.pinned);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 rounded-[10px] border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5">
        <span className="text-white/25 text-xs">🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search knowledge…"
          className="flex-1 bg-transparent text-[11px] text-white/80 placeholder-white/25 outline-none" />
      </div>
      <div className="flex gap-1 overflow-x-auto pb-0.5">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[9px] font-semibold transition ${tab === t.id ? 'border-violet-500/40 bg-violet-500/15 text-violet-300' : 'border-white/[0.07] text-white/30 hover:text-white/55'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {pinned.length > 0 && (
        <>
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/20 mt-1">Pinned</p>
          {pinned.map(e => <KBEntry key={e.id} entry={e} srcIcon={srcIcon} onPin={onPin} onDelete={onDelete} />)}
          <div className="h-px bg-white/[0.06] my-1" />
        </>
      )}
      {rest.map(e => <KBEntry key={e.id} entry={e} srcIcon={srcIcon} onPin={onPin} onDelete={onDelete} />)}
      {filtered.length === 0 && <p className="py-6 text-center text-[11px] text-white/25">No knowledge entries found</p>}
    </div>
  );
}

export function KBEntry({ entry, srcIcon, onPin, onDelete }: {
  entry: KnowledgeEntry;
  srcIcon: Record<KnowledgeSource, string>;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="group rounded-[12px] border border-white/[0.07] bg-white/[0.03] p-3 transition hover:border-white/[0.12] hover:bg-white/[0.05]">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0 text-sm">{srcIcon[entry.source]}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-white/80 leading-snug mb-0.5">{entry.title}</p>
          <p className="text-[10px] leading-snug text-white/40 mb-1.5">{entry.summary}</p>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-white/25">{entry.createdAt}</span>
            <span className="text-[9px] text-white/20">·</span>
            <span className="text-[9px] text-white/25">{Math.round(entry.confidence * 100)}% confidence</span>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
          <button onClick={() => onPin(entry.id)} className={`text-[10px] transition ${entry.pinned ? 'text-violet-400' : 'text-white/25 hover:text-white/60'}`}>
            {entry.pinned ? '📌' : '📌'}
          </button>
          <button onClick={() => onDelete(entry.id)} className="text-[10px] text-white/20 hover:text-red-400 transition">✕</button>
        </div>
      </div>
    </div>
  );
}

// ── Voice Bar ─────────────────────────────────────────────────────────────────

export function AIAntVoiceBar({ state, transcript, onClose }: { state: VoiceState; transcript: string; onClose: () => void }) {
  const stateConfig: Record<VoiceState, { label: string; color: string; bars: string }> = {
    idle:       { label: 'Ready', color: 'text-white/40', bars: 'bg-white/20' },
    listening:  { label: 'Listening…', color: 'text-violet-400', bars: 'bg-violet-400' },
    processing: { label: 'Processing…', color: 'text-amber-400', bars: 'bg-amber-400' },
    responding: { label: 'Speaking…', color: 'text-emerald-400', bars: 'bg-emerald-400' },
  };
  const cfg = stateConfig[state];
  const barHeights = [0.4, 0.7, 1.0, 0.8, 0.6, 0.9, 0.5, 0.75, 0.45, 0.85];
  return (
    <div className="mx-4 mb-3 overflow-hidden rounded-[16px] border border-violet-500/25 bg-[#0e0a1f]/95 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-500/15">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-[11px] font-semibold ${cfg.color} mb-1.5`}>{cfg.label}</div>
          <div className="flex items-end gap-0.5 h-5">
            {barHeights.map((h, i) => (
              <div key={i} className={`w-1 rounded-full ${cfg.bars} transition-all`}
                style={{
                  height: state === 'listening' || state === 'responding' ? `${h * 100}%` : '25%',
                  animation: (state === 'listening' || state === 'responding') ? `pulse 0.${3 + (i % 5)}s ease-in-out infinite alternate` : 'none',
                  animationDelay: `${i * 60}ms`,
                }}
              />
            ))}
          </div>
          {transcript && <p className="mt-1.5 text-[10px] text-white/50 italic truncate">"{transcript}"</p>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className={`h-1.5 w-1.5 rounded-full ${state === 'idle' ? 'bg-white/20' : state === 'listening' ? 'bg-violet-400 animate-pulse' : state === 'processing' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
          <button onClick={onClose} className="flex h-5 w-5 items-center justify-center rounded text-white/30 hover:text-white/60 transition"><X size={11} /></button>
        </div>
      </div>
    </div>
  );
}

// ── Notification Center ───────────────────────────────────────────────────────

export function AIAntNotificationBell({ notifications, onClick }: { notifications: AntNotification[]; onClick: () => void }) {
  const unread = notifications.filter(n => !n.read).length;
  return (
    <button onClick={onClick} className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/45 transition hover:border-white/[0.14] hover:text-white/80">
      <Activity size={13} />
      {unread > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  );
}

export function AIAntNotificationDrawer({ notifications, onClose, onMarkRead, onAction }: {
  notifications: AntNotification[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onAction: (notifId: string, actionLabel: string) => void;
}) {
  const priorityStyle: Record<AntNotificationPriority, { border: string; dot: string }> = {
    success:  { border: 'border-l-emerald-500', dot: 'bg-emerald-500' },
    info:     { border: 'border-l-blue-500',    dot: 'bg-blue-500' },
    warning:  { border: 'border-l-amber-500',   dot: 'bg-amber-500' },
    critical: { border: 'border-l-red-500',     dot: 'bg-red-500' },
  };
  const catIcon: Record<AntNotificationCategory, React.ElementType> = {
    workflow: Workflow, approval: ShieldCheck, task: Brain, file: FileText,
    export: Upload, device: Monitor, suggestion: Lightbulb, risk: AlertTriangle,
  };
  const unread = notifications.filter(n => !n.read);
  const read = notifications.filter(n => n.read);
  return (
    <div className="fixed inset-0 z-[280]" onClick={onClose}>
      <div className="absolute right-4 top-14 w-96 overflow-hidden rounded-[20px] border border-white/[0.10] bg-[#08080f]/97 shadow-[0_24px_64px_rgba(0,0,0,0.7)] backdrop-blur-xl"
        style={{ maxHeight: 'calc(100vh - 80px)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="font-heading text-[14px] font-extrabold text-white/90">Notifications</span>
            {unread.length > 0 && <span className="rounded-full bg-red-500/20 px-1.5 py-0.5 text-[9px] font-bold text-red-400">{unread.length} new</span>}
          </div>
          <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded-md text-white/30 hover:bg-white/[0.07] hover:text-white/70 transition"><X size={13} /></button>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 160px)' }}>
          {unread.length > 0 && (
            <div className="border-b border-white/[0.05]">
              <p className="px-5 pt-3 pb-1.5 text-[9px] font-bold uppercase tracking-widest text-white/25">New</p>
              {unread.map(n => <NotifItem key={n.id} n={n} ps={priorityStyle} catIcon={catIcon} onMarkRead={onMarkRead} onAction={onAction} />)}
            </div>
          )}
          {read.length > 0 && (
            <div>
              <p className="px-5 pt-3 pb-1.5 text-[9px] font-bold uppercase tracking-widest text-white/20">Earlier</p>
              {read.map(n => <NotifItem key={n.id} n={n} ps={priorityStyle} catIcon={catIcon} onMarkRead={onMarkRead} onAction={onAction} />)}
            </div>
          )}
          {notifications.length === 0 && <p className="py-8 text-center text-sm text-white/25">No notifications</p>}
        </div>
      </div>
    </div>
  );
}

export function NotifItem({ n, ps, catIcon, onMarkRead, onAction }: {
  n: AntNotification;
  ps: Record<AntNotificationPriority, { border: string; dot: string }>;
  catIcon: Record<AntNotificationCategory, React.ElementType>;
  onMarkRead: (id: string) => void;
  onAction: (id: string, label: string) => void;
}) {
  const p = ps[n.priority];
  const CatIcon = catIcon[n.category];
  return (
    <div className={`group border-l-2 ${p.border} ${!n.read ? 'bg-white/[0.03]' : ''} px-5 py-3.5 transition hover:bg-white/[0.04]`}
      onClick={() => onMarkRead(n.id)}>
      <div className="flex items-start gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
          <CatIcon size={13} className="text-white/50" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[12px] font-semibold text-white/85">{n.title}</span>
            {!n.read && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${p.dot}`} />}
          </div>
          <p className="text-[11px] text-white/45 mb-2">{n.body}</p>
          {n.actions && (
            <div className="flex gap-1.5">
              {n.actions.map(a => (
                <button key={a.label} onClick={e => { e.stopPropagation(); onAction(n.id, a.label); }}
                  className={`rounded-lg border px-2.5 py-1 text-[10px] font-semibold transition ${
                    a.variant === 'primary' ? 'border-violet-500/40 bg-violet-500/15 text-violet-300 hover:bg-violet-500/25' :
                    a.variant === 'danger' ? 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20' :
                    'border-white/[0.10] text-white/50 hover:border-white/[0.18] hover:text-white/80'
                  }`}>
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <span className="shrink-0 text-[9px] text-white/25">{n.time}</span>
      </div>
    </div>
  );
}

// ── Smart Suggestions Panel ───────────────────────────────────────────────────

export function AIAntSmartSuggestions({ suggestions, onApply, onDismiss }: {
  suggestions: AntSuggestion[];
  onApply: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const typeStyle: Record<AntSuggestionType, { icon: string; badge: string }> = {
    automation:   { icon: '⚡', badge: 'border-violet-500/25 bg-violet-500/10 text-violet-400' },
    optimization: { icon: '🚀', badge: 'border-blue-500/25 bg-blue-500/10 text-blue-400' },
    organization: { icon: '📂', badge: 'border-amber-500/25 bg-amber-500/10 text-amber-400' },
    repair:       { icon: '🔧', badge: 'border-red-500/25 bg-red-500/10 text-red-400' },
    memory:       { icon: '🧠', badge: 'border-cyan-500/25 bg-cyan-500/10 text-cyan-400' },
    connector:    { icon: '🔌', badge: 'border-indigo-500/25 bg-indigo-500/10 text-indigo-400' },
    export:       { icon: '📤', badge: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400' },
    safety:       { icon: '🛡', badge: 'border-orange-500/25 bg-orange-500/10 text-orange-400' },
  };
  const visible = suggestions.filter(s => !s.dismissed && !s.applied);
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-bold uppercase tracking-widest text-white/25">Smart Suggestions</p>
        <span className="text-[9px] text-violet-400/60">{visible.length} available</span>
      </div>
      {visible.length === 0 && (
        <div className="rounded-[12px] border border-white/[0.06] p-4 text-center">
          <p className="text-[11px] text-white/30">No suggestions right now</p>
          <p className="text-[9px] text-white/20 mt-1">AI Ant will suggest optimizations as it learns</p>
        </div>
      )}
      {visible.map(s => {
        const ts = typeStyle[s.type];
        return (
          <div key={s.id} className="rounded-[14px] border border-white/[0.07] bg-white/[0.03] p-3.5 transition hover:border-white/[0.12]">
            <div className="flex items-start gap-2.5 mb-2.5">
              <span className="text-xl shrink-0">{ts.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[12px] font-bold text-white/85">{s.title}</span>
                </div>
                <span className={`rounded-full border px-1.5 py-0.5 text-[8px] font-bold ${ts.badge}`}>{s.type}</span>
              </div>
              <button onClick={() => onDismiss(s.id)} className="shrink-0 text-white/20 hover:text-white/50 transition text-sm">✕</button>
            </div>
            <p className="mb-2 text-[11px] leading-snug text-white/45">{s.explanation}</p>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="h-1 w-20 overflow-hidden rounded-full bg-white/[0.08]">
                  <div className="h-full rounded-full bg-violet-500" style={{ width: `${s.confidence * 100}%` }} />
                </div>
                <span className="text-[9px] text-white/30">{Math.round(s.confidence * 100)}% confidence</span>
              </div>
              <span className="text-[10px] text-emerald-400/80">{s.benefit}</span>
            </div>
            <button onClick={() => onApply(s.id)}
              className="w-full rounded-[10px] border border-violet-500/30 bg-violet-500/10 py-2 text-[11px] font-semibold text-violet-300 transition hover:bg-violet-500/20">
              {s.action}
            </button>
          </div>
        );
      })}
      {suggestions.some(s => s.applied) && (
        <div className="rounded-[10px] border border-emerald-500/15 bg-emerald-500/[0.05] p-2.5 text-center">
          <p className="text-[10px] text-emerald-400/70">{suggestions.filter(s => s.applied).length} suggestion{suggestions.filter(s => s.applied).length > 1 ? 's' : ''} applied</p>
        </div>
      )}
    </div>
  );
}

// ── Feature 84-87: Workflow Panel, Observer, Repair ───────────────────────────

export function AIAntWorkflowPanel({ workflows, onTrigger, onCreate }: {
  workflows: AntWorkflowDef[];
  onTrigger: (id: string) => void;
  onCreate: () => void;
}) {
  const statusDot: Record<AntWorkflowStatus, string> = {
    idle: 'bg-white/20', running: 'bg-emerald-400 animate-pulse',
    paused: 'bg-amber-400', complete: 'bg-emerald-500',
    failed: 'bg-red-400', repairing: 'bg-orange-400 animate-pulse',
  };
  const statusLabel: Record<AntWorkflowStatus, string> = {
    idle: 'Idle', running: 'Running', paused: 'Paused',
    complete: 'Done', failed: 'Failed', repairing: 'Repairing',
  };
  const statusText: Record<AntWorkflowStatus, string> = {
    idle: 'text-white/30', running: 'text-emerald-400', paused: 'text-amber-400',
    complete: 'text-emerald-400', failed: 'text-red-400', repairing: 'text-orange-400',
  };
  return (
    <div className="flex flex-col gap-2.5">
      <button onClick={onCreate}
        className="flex items-center gap-2 rounded-[12px] border border-dashed border-violet-500/30 bg-violet-500/[0.06] px-3 py-2.5 text-left transition hover:border-violet-500/50 hover:bg-violet-500/[0.10]">
        <Zap size={13} className="shrink-0 text-violet-400" />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-violet-300">Convert to Workflow</p>
          <p className="text-[9px] text-white/30 truncate">Describe a task → save as reusable automation</p>
        </div>
        <span className="text-white/20 text-sm">+</span>
      </button>
      {workflows.map(wf => (
        <div key={wf.id} className="rounded-[12px] border border-white/[0.07] bg-white/[0.03] p-3">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-base">{wf.icon}</span>
              <div>
                <p className="text-[11px] font-semibold text-white/85 leading-tight">{wf.name}</p>
                <p className="text-[9px] text-white/30 capitalize">{wf.origin} · {wf.stepCount} steps · {wf.estimatedDuration}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`h-1.5 w-1.5 rounded-full ${statusDot[wf.status]}`} />
              <span className={`text-[9px] font-semibold ${statusText[wf.status]}`}>{statusLabel[wf.status]}</span>
            </div>
          </div>
          <p className="mb-2.5 text-[10px] leading-snug text-white/35">{wf.description}</p>
          {wf.status === 'running' && (
            <div className="mb-2.5">
              <div className="flex justify-between mb-1">
                <span className="text-[9px] text-white/30">Progress</span>
                <span className="text-[9px] text-emerald-400">{wf.progress}%</span>
              </div>
              <div className="h-1 rounded-full bg-white/[0.07] overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500/60 transition-all" style={{ width: `${wf.progress}%` }} />
              </div>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            {(wf.status === 'idle' || wf.status === 'complete') && (
              <button onClick={() => onTrigger(wf.id)}
                className="flex-1 rounded-[8px] border border-white/[0.08] bg-white/[0.05] py-1 text-[10px] font-semibold text-white/50 transition hover:border-violet-500/30 hover:bg-violet-500/[0.08] hover:text-violet-300">
                ▶ Run
              </button>
            )}
            {wf.lastRun && (
              <span className="ml-auto text-[9px] text-white/20 shrink-0">Last: {wf.lastRun}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}





// ── Feature 88-90: Multi-Ant Colony Panel ─────────────────────────────────────

export function AIAntColonyPanel({ session }: { session: AntColonySession }) {
  const statusDot: Record<AntAgentStatus, string> = {
    idle: 'bg-white/20', active: 'bg-emerald-400 animate-pulse',
    waiting: 'bg-amber-400', complete: 'bg-emerald-500', failed: 'bg-red-400',
  };
  const statusText: Record<AntAgentStatus, string> = {
    idle: 'text-white/30', active: 'text-emerald-400',
    waiting: 'text-amber-400', complete: 'text-emerald-400', failed: 'text-red-400',
  };
  const roleColor: Record<AntRole, string> = {
    orchestrator: 'border-violet-500/30 bg-violet-500/[0.08] text-violet-300',
    research: 'border-cyan-500/30 bg-cyan-500/[0.08] text-cyan-300',
    finance: 'border-amber-500/30 bg-amber-500/[0.08] text-amber-300',
    file: 'border-blue-500/30 bg-blue-500/[0.08] text-blue-300',
    browser: 'border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-300',
    communication: 'border-pink-500/30 bg-pink-500/[0.08] text-pink-300',
    data: 'border-indigo-500/30 bg-indigo-500/[0.08] text-indigo-300',
  };
  const lead = session.agents.find(a => a.role === 'orchestrator');
  const subAgents = session.agents.filter(a => a.role !== 'orchestrator');
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-[12px] border border-violet-500/20 bg-violet-500/[0.05] p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[9px] font-bold uppercase tracking-widest text-violet-400/60">Colony Objective</p>
          <span className={`text-[9px] font-semibold capitalize ${session.status === 'executing' ? 'text-emerald-400' : session.status === 'complete' ? 'text-emerald-500' : 'text-red-400'}`}>
            {session.status}
          </span>
        </div>
        <p className="text-[11px] font-medium text-white/80 leading-snug mb-2">{session.objective}</p>
        <div className="mb-1 flex justify-between">
          <span className="text-[9px] text-white/30">Overall Progress</span>
          <span className="text-[9px] text-violet-400">{session.overallProgress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-400 transition-all"
            style={{ width: `${session.overallProgress}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-[9px] text-white/25">
          <span>Started {session.startedAt}</span>
          <span>Est. done {session.estimatedComplete}</span>
        </div>
      </div>

      {lead && (
        <div className="rounded-[12px] border border-violet-500/20 bg-white/[0.04] p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-lg">{lead.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-bold text-white/90">{lead.name}</p>
                <span className={`rounded-full border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide ${roleColor[lead.role]}`}>
                  {lead.role}
                </span>
              </div>
              <p className="text-[10px] text-white/40 truncate">{lead.currentTask}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className={`h-1.5 w-1.5 rounded-full ${statusDot[lead.status]}`} />
              <span className={`text-[9px] ${statusText[lead.status]}`}>{lead.status}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[9px] text-white/25">
            <span className="text-violet-400/60">↳ delegating to</span>
            <span>{(lead.subAgents ?? []).length} specialized ants</span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 pl-3">
        {subAgents.map(agent => (
          <div key={agent.id} className="relative">
            <div className="absolute -left-3 top-4 h-px w-3 bg-white/[0.08]" />
            <div className="rounded-[10px] border border-white/[0.07] bg-white/[0.03] p-2.5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{agent.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[10px] font-semibold text-white/80">{agent.name}</p>
                    <span className={`rounded-full border px-1 py-0.5 text-[7px] font-bold uppercase ${roleColor[agent.role]}`}>
                      {agent.role}
                    </span>
                  </div>
                  {agent.currentTask && <p className="text-[9px] text-white/35 truncate">{agent.currentTask}</p>}
                </div>
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${statusDot[agent.status]}`} />
              </div>
              {agent.progress !== undefined && agent.status === 'active' && (
                <div className="h-0.5 rounded-full bg-white/[0.07] overflow-hidden mt-1">
                  <div className="h-full rounded-full bg-emerald-500/50 transition-all" style={{ width: `${agent.progress}%` }} />
                </div>
              )}
              <div className="mt-1 flex items-center justify-between text-[8px] text-white/20">
                <span>{Math.round(agent.confidence * 100)}% conf</span>
                <span>{agent.completedTasks} done</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}









// ── Execution mode classification ─────────────────────────────────────────────
// AI Ant decides how to handle a prompt before doing the work. Small asks are
// answered directly; complex goals propose a team or workflow.

export function ExecutionDecisionCard({ decision }: { decision: ExecutionDecision }) {
  const modeLabel = decision.mode.replace(/_/g, ' ');
  const approvalTone: Record<ApprovalLevel, string> = {
    none: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20',
    low: 'text-blue-300 bg-blue-400/10 border-blue-400/20',
    medium: 'text-amber-300 bg-amber-400/10 border-amber-400/20',
    high: 'text-orange-300 bg-orange-400/10 border-orange-400/20',
    critical: 'text-red-300 bg-red-400/10 border-red-400/20',
  };
  return (
    <div className="w-full max-w-3xl rounded-[18px] border border-white/[0.08] bg-white/[0.035] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200/65">AI Ant decision</p>
          <h3 className="mt-1 text-base font-bold capitalize text-white/88">{modeLabel}</h3>
          <p className="mt-1 text-sm leading-relaxed text-white/45">{decision.reason}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-2.5 py-1 text-[10px] font-bold text-violet-100">{Math.round(decision.confidence * 100)}% confident</span>
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${approvalTone[decision.approvalLevel]}`}>{decision.approvalLevel} approval</span>
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-[12px] border border-white/[0.06] bg-black/15 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">Next step</p>
          <p className="mt-1 text-sm text-white/70">{decision.suggestedNextStep}</p>
        </div>
        <div className="rounded-[12px] border border-white/[0.06] bg-black/15 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">Deliverables</p>
          <p className="mt-1 text-sm text-white/70">{decision.expectedDeliverables.length ? decision.expectedDeliverables.join(', ') : 'Chat answer'}</p>
        </div>
      </div>
      <div className="mt-3 rounded-[12px] border border-emerald-300/12 bg-emerald-400/[0.04] p-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-200/55">Auto routing</p>
        <p className="mt-1 text-sm text-white/58">AI Ant selected {modeLabel} with {inferCapabilitiesFromText(decision.sourcePrompt).map((cap) => CAPABILITY_LABELS[cap]).join(' + ')} capabilities.</p>
      </div>
      {decision.suggestedAgents.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {decision.suggestedAgents.map((agent) => <span key={agent} className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold text-white/50">{agent}</span>)}
        </div>
      )}
    </div>
  );
}

export function ProjectIntentCard({ project, onCreate, onBuildTeam }: { project: ProjectIntent; onCreate: () => void; onBuildTeam: () => void }) {
  return (
    <div className="w-full max-w-3xl rounded-[18px] border border-blue-300/15 bg-blue-400/[0.045] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-200/65">Draft project</p>
      <h3 className="mt-1 text-lg font-bold text-white/88">{project.name}</h3>
      <p className="mt-1 text-sm leading-relaxed text-white/45">{project.goal}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-[12px] bg-black/15 p-3 text-sm text-white/60">Mode: <span className="capitalize text-white/82">{project.suggestedMode.replace(/_/g, ' ')}</span></div>
        <div className="rounded-[12px] bg-black/15 p-3 text-sm text-white/60">Sources: {project.sourcesNeeded.join(', ')}</div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={onCreate} className="rounded-[12px] bg-violet-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-violet-500">Create project</button>
        <button className="rounded-[12px] border border-white/[0.10] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/55 transition hover:text-white">Add source</button>
        <button onClick={onBuildTeam} className="rounded-[12px] border border-white/[0.10] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/55 transition hover:text-white">Build team</button>
        <button className="rounded-[12px] border border-white/[0.10] bg-white/[0.02] px-4 py-2 text-xs font-semibold text-white/45 transition hover:text-white">Start with AI Ant only</button>
      </div>
    </div>
  );
}

export function DeviceActionFlowCard({ req, onApproveOnce, onApproveProject, onReject, onSaveScope, onStop, onRetry, onCreateDeliverable }: {
  req: DeviceActionRequest;
  onApproveOnce: () => void;
  onApproveProject: () => void;
  onReject: () => void;
  onSaveScope: (accessLevel: DeviceAccessLevel, target: string) => void;
  onStop: () => void;
  onRetry: () => void;
  onCreateDeliverable: () => void;
}) {
  const [scopeOpen, setScopeOpen] = React.useState(false);
  const [access, setAccess] = React.useState<DeviceAccessLevel>(req.accessLevel);
  const [target, setTarget] = React.useState(req.target);
  React.useEffect(() => { setAccess(req.accessLevel); setTarget(req.target); }, [req.accessLevel, req.target]);

  const riskTone: Record<DeviceActionRequest['risk'], string> = {
    low: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/25',
    medium: 'text-amber-300 bg-amber-400/10 border-amber-400/25',
    high: 'text-red-300 bg-red-400/10 border-red-400/25',
  };
  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wide text-white/35">{label}</span>
      <span className="text-right text-sm text-white/75">{value}</span>
    </div>
  );

  // ── Running ──
  if (req.status === 'running') {
    const pct = Math.round(((req.progressStep) / DEVICE_RUN_STEPS.length) * 100);
    return (
      <div className="w-full max-w-2xl rounded-[18px] border border-emerald-300/20 bg-emerald-400/[0.05] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Loader2 size={15} className="animate-spin text-emerald-300" />
            <h3 className="text-base font-bold text-white/90">Colony Bridge Running</h3>
          </div>
          <button onClick={onStop} className="flex items-center gap-1 rounded-[10px] border border-red-400/30 bg-red-500/[0.08] px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/[0.16]"><Square size={11} /> Stop</button>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-400" animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
        </div>
        <div className="mt-3 space-y-1.5">
          {DEVICE_RUN_STEPS.map((step, i) => {
            const state = i < req.progressStep ? 'done' : i === req.progressStep ? 'active' : 'idle';
            return (
              <div key={step} className="flex items-center gap-2 text-xs">
                {state === 'done' ? <Check size={13} className="text-emerald-400" />
                  : state === 'active' ? <Loader2 size={13} className="animate-spin text-emerald-300" />
                  : <span className="h-[13px] w-[13px] rounded-full border border-white/15" />}
                <span className={state === 'idle' ? 'text-white/30' : state === 'active' ? 'text-white/85' : 'text-white/50'}>{step}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Completed ──
  if (req.status === 'completed') {
    return (
      <div className="w-full max-w-2xl rounded-[18px] border border-emerald-300/20 bg-emerald-400/[0.05] p-4">
        <div className="flex items-center gap-2">
          <Check size={15} className="text-emerald-300" />
          <h3 className="text-base font-bold text-white/90">Colony Bridge Result</h3>
        </div>
        <p className="mt-2 rounded-[12px] bg-black/15 p-3 text-sm leading-relaxed text-white/65">{req.result}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={onCreateDeliverable} className="rounded-[10px] border border-white/[0.10] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/55 hover:text-white">Create deliverable</button>
          <button className="rounded-[10px] border border-white/[0.10] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/55 hover:text-white">Export</button>
        </div>
      </div>
    );
  }

  // ── Rejected / Failed ──
  if (req.status === 'rejected' || req.status === 'failed') {
    return (
      <div className="w-full max-w-2xl rounded-[18px] border border-red-400/20 bg-red-400/[0.05] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-red-300" />
            <h3 className="text-base font-bold text-white/85">{req.status === 'rejected' ? 'Colony Bridge Request Rejected' : 'Colony Bridge Action Stopped'}</h3>
          </div>
          <button onClick={onRetry} className="rounded-[10px] border border-white/[0.12] px-3 py-1.5 text-xs font-semibold text-white/55 hover:text-white">Review again</button>
        </div>
        <p className="mt-2 text-sm text-white/45">{req.status === 'rejected' ? 'AI Ant did not access any files, apps, or tools.' : 'The Colony Bridge action was stopped before it finished.'}</p>
      </div>
    );
  }

  // ── permission_required ──
  return (
    <div className="w-full max-w-2xl rounded-[18px] border border-amber-300/20 bg-amber-400/[0.05] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200/65">Colony Bridge</p>
          <h3 className="mt-1 flex items-center gap-2 text-base font-bold text-white/90"><ShieldCheck size={15} className="text-amber-300" /> Colony Bridge Request</h3>
          <p className="mt-1 text-sm text-white/45">AI Ant needs your approval before accessing files, apps, browser, or connected tools.</p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${riskTone[req.risk]}`}>{req.risk} risk</span>
      </div>

      {req.risk === 'high' && (
        <div className="mt-3 flex items-start gap-2 rounded-[12px] border border-red-400/25 bg-red-400/[0.07] p-2.5 text-xs text-red-200/80">
          <AlertTriangle size={13} className="mt-0.5 shrink-0 text-red-300" />
          High-risk action. This can send, publish, delete, or change data outside this device. Review carefully before approving.
        </div>
      )}

      <div className="mt-3 divide-y divide-white/[0.06] rounded-[12px] bg-black/15 px-3">
        <Row label="Source / tool" value={req.sourceTool} />
        <Row label="Target" value={target} />
        <Row label="Action" value={<span className="capitalize">{req.verb}</span>} />
        <Row label="Access level" value={<span className="capitalize">{access}</span>} />
        <Row label="Affected data" value={<span className="text-white/55">{req.affectedData}</span>} />
      </div>

      {scopeOpen ? (
        <div className="mt-3 rounded-[12px] border border-white/[0.10] bg-[#0b0f1a] p-3">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-white/40">Edit scope</p>
          <label className="mb-1 block text-[11px] text-white/45">Access level</label>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {(['read-only', 'edit', 'export', 'send'] as DeviceAccessLevel[]).map((a) => (
              <button key={a} onClick={() => setAccess(a)}
                className={`rounded-[9px] border px-3 py-1.5 text-xs font-semibold capitalize ${access === a ? 'border-violet-400/50 bg-violet-400/15 text-white' : 'border-white/[0.10] text-white/45'}`}>{a}</button>
            ))}
          </div>
          <label className="mb-1 block text-[11px] text-white/45">Target / source</label>
          <input value={target} onChange={(e) => setTarget(e.target.value)}
            className="w-full rounded-[9px] border border-white/[0.10] bg-[#0b0f1a] px-3 py-2 text-sm text-white outline-none focus:border-violet-400/50" />
          <div className="mt-3 flex gap-2">
            <button onClick={() => { setScopeOpen(false); setAccess(req.accessLevel); setTarget(req.target); }} className="flex-1 rounded-[9px] border border-white/[0.12] px-3 py-2 text-xs font-semibold text-white/55 hover:text-white">Cancel</button>
            <button onClick={() => { onSaveScope(access, target.trim() || req.target); setScopeOpen(false); }} className="flex-1 rounded-[9px] bg-[#ffffff] px-3 py-2 text-xs font-bold text-[#070B14] hover:bg-[#f0f2ff]">Save scope</button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={onApproveOnce} className="rounded-[10px] bg-emerald-500/90 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500">Approve bridge</button>
          <button onClick={onApproveOnce} className="rounded-[10px] border border-emerald-400/30 bg-emerald-400/[0.08] px-4 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-400/[0.14]">Approve once</button>
          <button onClick={onApproveProject} className="rounded-[10px] border border-emerald-400/20 bg-emerald-400/[0.05] px-4 py-2 text-xs font-semibold text-emerald-300/80 hover:bg-emerald-400/[0.10]">Approve for this project</button>
          <button onClick={() => setScopeOpen(true)} className="rounded-[10px] border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/60 hover:text-white">Edit scope</button>
          <button onClick={onReject} className="rounded-[10px] border border-red-400/25 bg-red-400/[0.07] px-4 py-2 text-xs font-semibold text-red-300 hover:bg-red-400/[0.13]">Reject</button>
          <p className="w-full mt-1 text-[10px] text-white/25 flex items-center gap-1"><ShieldCheck size={9} />Colony Bridge never reads, edits, sends, or exports anything without approval.</p>
        </div>
      )}
    </div>
  );
}



export function DeliverablePreviewCard({ deliverable, onApprove }: { deliverable: ColonyDeliverable; onApprove: () => void }) {
  return (
    <div className="w-full max-w-3xl rounded-[18px] border border-emerald-300/15 bg-emerald-400/[0.045] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200/65">Deliverable preview</p>
          <h3 className="mt-1 text-lg font-bold text-white/88">{deliverable.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-white/45">{deliverable.preview}</p>
        </div>
        <span className="rounded-full border border-white/[0.08] bg-white/[0.05] px-2.5 py-1 text-[10px] font-bold capitalize text-white/50">v{deliverable.version} · {deliverable.status.replace(/_/g, ' ')}</span>
      </div>
      <div className="mt-3 rounded-[12px] bg-black/15 p-3 text-sm text-white/58">{deliverable.content}</div>
      {deliverable.artifacts && deliverable.artifacts.length > 0 && (
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {deliverable.artifacts.map((artifact) => (
            <div key={artifact.id} className="rounded-[12px] border border-white/[0.07] bg-white/[0.03] p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/28">{artifact.type}</p>
              <p className="mt-1 text-xs font-semibold text-white/72">{artifact.title}</p>
              <p className="mt-1 text-[10px] text-white/35">{artifact.provider ? PROVIDER_LABELS[artifact.provider] : 'Auto'} · {artifact.modelName ?? 'Mock adapter'}</p>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="rounded-[12px] bg-[#ffffff] px-4 py-2 text-xs font-bold text-[#070B14] transition hover:bg-[#f0f2ff]">Open deliverable</button>
        <button className="rounded-[12px] border border-white/[0.10] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/55 transition hover:text-white">Edit</button>
        <button onClick={onApprove} className="rounded-[12px] border border-emerald-400/20 bg-emerald-400/[0.08] px-4 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/[0.12]">Approve</button>
        <button className="rounded-[12px] border border-white/[0.10] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/55 transition hover:text-white">Export</button>
        <button className="rounded-[12px] border border-white/[0.10] bg-white/[0.02] px-4 py-2 text-xs font-semibold text-white/45 transition hover:text-white">Create next version</button>
      </div>
    </div>
  );
}

// AIRoutingCard has been moved to src/pages/ai-ant/AIRoutingCard.tsx

export function AITeamProposalCard({ proposal, advancedOpen, onToggleAdvanced, onStart, onSimpler, onCustomize }: {
  proposal: AntTeamProposal;
  advancedOpen: boolean;
  onToggleAdvanced: () => void;
  onStart: () => void;
  onSimpler: () => void;
  onCustomize: () => void;
}) {
  const expensiveCapabilities = Array.from(new Set(proposal.agents.flatMap((agent) => (agent.skills ?? []).map((skill) => skill.capability)).filter((capability) => EXPENSIVE_CAPABILITIES.includes(capability))));
  const estimatedCredits = estimateCapabilityCredits(expensiveCapabilities);
  return (
    <div className="w-full max-w-4xl overflow-hidden rounded-[22px] border border-violet-500/20 bg-[#0c101b]/95 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
      <div className="border-b border-white/[0.07] bg-violet-500/[0.06] px-5 py-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-300/70">AI Ant recommendation</p>
        <h3 className="mt-1 font-heading text-xl font-extrabold text-white">AI Ant recommends creating a team for this project</h3>
        <p className="mt-1 text-sm text-white/45">{proposal.whyTeam}</p>
      </div>
      <div className="grid gap-4 p-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">Project</p>
            <h4 className="mt-1 text-lg font-bold text-white">{proposal.projectName}</h4>
            <p className="mt-2 text-sm leading-relaxed text-white/55">{proposal.goal}</p>
          </div>
          <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">Team hierarchy</p>
            <div className="mt-3 space-y-2">
              {proposal.hierarchy.map((node, index) => (
                <div key={node} className="flex items-center gap-2" style={{ marginLeft: index === 0 ? 0 : Math.min(index, 2) * 18 }}>
                  <span className={`h-2 w-2 rounded-full ${index === 0 ? 'bg-violet-400' : index === 1 ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                  <span className="text-sm font-semibold text-white/80">{node}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {proposal.agents.map((agent) => (
              <div key={agent.name} className="rounded-[14px] border border-white/[0.07] bg-white/[0.025] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-white/85">{agent.name}</p>
                  <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-2 py-0.5 text-[9px] font-bold text-blue-300">{agent.status}</span>
                </div>
                <p className="mt-1 text-[11px] font-semibold text-violet-300/75">{agent.role}</p>
                <p className="mt-2 text-[11px] leading-relaxed text-white/42">{agent.responsibility}</p>
                <SkillModelPills skills={agent.skills ?? skillsForCapabilities(inferCapabilitiesFromText(agent.name, agent.role, agent.tools))} activeModel={agent.activeModel} compact />
                <p className="mt-2 text-[10px] text-white/28">Output: {agent.output}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">Work plan</p>
            <div className="mt-3 space-y-2">
              {proposal.plan.map((step, index) => (
                <div key={step} className="flex gap-2 text-sm text-white/65">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/[0.06] text-[10px] text-white/35">{index + 1}</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">Expected deliverables</p>
            <div className="mt-3 space-y-2">
              {proposal.deliverables.map((item) => (
                <div key={item.title} className="rounded-[12px] border border-white/[0.06] bg-black/15 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white/80">{item.title}</p>
                    <span className="text-[10px] text-emerald-300">{item.status}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-white/35">{item.type} by {item.owner}</p>
                  <p className="mt-2 text-[11px] text-white/45">{item.preview}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[16px] border border-amber-400/15 bg-amber-400/[0.05] p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300/70">Review before AI acts</p>
            <div className="mt-2 space-y-1.5">
              {proposal.approvals.map((item) => <p key={item} className="text-[11px] text-white/52">- {item}</p>)}
            </div>
          </div>
          {expensiveCapabilities.length > 0 && (
            <div className="rounded-[16px] border border-red-400/18 bg-red-400/[0.045] p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-200/70">Cost / credit preview</p>
              <p className="mt-2 text-sm text-white/62">This plan may generate {expensiveCapabilities.map((cap) => CAPABILITY_LABELS[cap]).join(', ')}.</p>
              <p className="mt-1 text-xs font-bold text-amber-200">Estimated credits: {estimatedCredits}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="rounded-[10px] bg-[#ffffff] px-3 py-2 text-xs font-bold text-[#070B14] hover:bg-[#f0f2ff]">Approve generation</button>
                <button className="rounded-[10px] border border-white/[0.18] bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white/65 hover:border-white/28 hover:bg-white/[0.09] hover:text-white/85">Edit plan</button>
                <button onClick={onSimpler} className="rounded-[10px] border border-red-300/20 px-3 py-2 text-xs font-semibold text-red-200/75">Cancel</button>
              </div>
            </div>
          )}
          {advancedOpen && (
            <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.025] p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">Advanced settings</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-white/45">
                <span>Model settings</span><span>System prompts</span><span>Memory config</span><span>Tool permissions</span><span>Workflow graph</span><span>Retry rules</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-white/[0.07] px-5 py-4">
        <button onClick={onStart} className="rounded-[12px] bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-500">Start with this team</button>
        <button onClick={onCustomize} className="rounded-[12px] border border-white/[0.10] bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-white/65 transition hover:text-white">Customize team</button>
        <button onClick={onSimpler} className="rounded-[12px] border border-white/[0.10] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white/55 transition hover:text-white">Do it with AI Ant only</button>
        <button onClick={onToggleAdvanced} className="ml-auto rounded-[12px] border border-white/[0.10] px-4 py-2.5 text-sm font-semibold text-white/45 transition hover:bg-white/[0.05] hover:text-white">
          {advancedOpen ? 'Hide advanced' : 'Advanced settings'}
        </button>
      </div>
    </div>
  );
}

export function AIProjectWorkspace({ project, onBack }: { project: AntGeneratedProject; onBack: () => void }) {
  const [tab, setTab] = React.useState<'Overview' | 'Team' | 'Tasks' | 'Deliverables' | 'Approvals' | 'Knowledge' | 'Workflow'>('Overview');
  const tabs: Array<typeof tab> = ['Overview', 'Team', 'Tasks', 'Deliverables', 'Approvals', 'Knowledge', 'Workflow'];
  return (
    <div className="flex h-full flex-col bg-[#070B14] text-white">
      <div className="border-b border-white/[0.07] bg-[#07070f]/95 px-5 py-4">
        <button onClick={onBack} className="mb-3 text-xs font-semibold text-white/40 transition hover:text-white">Back to AI Ant</button>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-violet-300/60">Project workspace</p>
            <h2 className="mt-1 font-heading text-2xl font-extrabold">{project.proposal.projectName}</h2>
            <p className="mt-1 max-w-3xl text-sm text-white/45">{project.proposal.goal}</p>
          </div>
          <div className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-1.5 text-xs font-bold text-emerald-300">{project.status}</div>
        </div>
        <div className="mt-4 flex gap-1 overflow-x-auto">
          {tabs.map((item) => (
            <button key={item} onClick={() => setTab(item)}
              className={`rounded-[10px] px-3 py-2 text-xs font-semibold transition ${tab === item ? 'bg-white/[0.10] text-white' : 'text-white/38 hover:bg-white/[0.05] hover:text-white/70'}`}>
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        {tab === 'Overview' && (
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[18px] border border-white/[0.07] bg-white/[0.03] p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">Current status</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-violet-500" style={{ width: `${project.progress}%` }} /></div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[['Progress', `${project.progress}%`], ['Active agent', project.activeAgent], ['Current task', project.currentTask], ['Next step', project.nextStep]].map(([label, value]) => (
                  <div key={label} className="rounded-[14px] border border-white/[0.06] bg-black/15 p-3">
                    <p className="text-[10px] uppercase tracking-widest text-white/25">{label}</p>
                    <p className="mt-1 text-sm font-semibold text-white/80">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-[14px] border border-blue-400/15 bg-blue-400/[0.05] p-4">
                <p className="text-sm font-bold text-blue-200">Latest update</p>
                <p className="mt-1 text-sm text-white/55">{project.latestUpdate}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-[18px] border border-amber-400/15 bg-amber-400/[0.05] p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300/70">Pending approvals</p>
                {project.proposal.approvals.slice(0, 2).map((item) => <p key={item} className="mt-2 text-sm text-white/55">Review before AI acts: {item}</p>)}
              </div>
              <div className="rounded-[18px] border border-white/[0.07] bg-white/[0.03] p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">Deliverables in progress</p>
                {project.proposal.deliverables.map((item) => <p key={item.title} className="mt-3 text-sm text-white/65">{item.title} <span className="text-white/28">- {item.status}</span></p>)}
              </div>
            </div>
          </div>
        )}
        {tab === 'Team' && (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {project.proposal.agents.map((agent, index) => (
              <div key={agent.name} className="rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">{index === 0 ? 'Manager' : 'Specialist agent'}</p>
                <h3 className="mt-2 text-base font-bold text-white">{agent.name}</h3>
                <p className="text-xs font-semibold text-violet-300/75">{agent.role}</p>
                <p className="mt-3 text-sm text-white/48">{agent.responsibility}</p>
                <SkillModelPills skills={agent.skills ?? skillsForCapabilities(inferCapabilitiesFromText(agent.name, agent.role, agent.tools))} compact />
                <p className="mt-3 text-xs text-white/30">Tools: {agent.tools.join(', ')}</p>
                <button className="mt-4 rounded-[10px] border border-white/[0.09] px-3 py-2 text-xs font-semibold text-white/45">Agent Setup</button>
              </div>
            ))}
          </div>
        )}
        {tab === 'Deliverables' && (
          <div className="grid gap-3 md:grid-cols-2">
            {project.proposal.deliverables.map((item) => (
              <div key={item.title} className="rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><h3 className="font-bold text-white">{item.title}</h3><p className="text-xs text-white/35">{item.type} - {item.owner}</p></div>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold text-emerald-300">{item.status}</span>
                </div>
                <p className="mt-3 text-sm text-white/50">{item.preview}</p>
                <div className="mt-4 flex gap-2">
                  <button className="rounded-[10px] bg-violet-600 px-3 py-2 text-xs font-bold text-white">Preview</button>
                  <button className="rounded-[10px] border border-white/[0.09] px-3 py-2 text-xs font-semibold text-white/50">Export</button>
                  <button className="rounded-[10px] border border-white/[0.09] px-3 py-2 text-xs font-semibold text-white/50">Version history</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {!['Overview', 'Team', 'Deliverables'].includes(tab) && (
          <div className="rounded-[18px] border border-white/[0.07] bg-white/[0.03] p-8 text-center text-white/45">
            {tab} is ready for this project. AI Ant will populate it as the team works.
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function CrewWorkspace({ run, onBack, onStop }: { run: CrewRun; onBack: () => void; onStop: () => void }) {
  const [status, setStatus] = React.useState<CrewStatus>(run.status);
  const [message, setMessage] = React.useState('');
  const [showOutput, setShowOutput] = React.useState(false);
  const flow: CrewStatus[] = ['matching', 'creating_agents', 'running', 'reviewing', 'completed'];
  const statusIndex = Math.max(0, flow.indexOf(status));
  const displayTasks = run.tasks.map((task, index) => ({
    ...task,
    status: status === 'stopped' ? task.status : index < statusIndex ? 'done' as const : index === statusIndex ? 'running' as const : 'todo' as const,
  }));

  React.useEffect(() => {
    if (status === 'stopped' || status === 'completed') return;
    const current = flow.indexOf(status);
    const timer = window.setTimeout(() => setStatus(flow[Math.min(current + 1, flow.length - 1)]), current < 2 ? 1400 : 2600);
    return () => window.clearTimeout(timer);
  }, [status]);

  const activeAgentIndex = Math.max(0, Math.min(run.agents.length - 1, statusIndex));
  const statusLabel: Record<CrewStatus, string> = {
    matching: 'Matching agents',
    creating_agents: 'Creating crew',
    running: 'Executing task',
    reviewing: 'Reviewing output',
    completed: 'Ready for review',
    stopped: 'Stopped',
  };
  const stop = () => { setStatus('stopped'); onStop(); };

  return (
    <div className="flex h-screen bg-[#060914] text-white">
      <section className="flex w-full flex-col border-r border-white/[0.08] bg-[#080d18] lg:w-[44%]">
        <header className="flex items-center gap-3 border-b border-white/[0.08] px-5 py-4">
          <button onClick={onBack} className="rounded-[10px] border border-white/[0.09] bg-white/[0.04] px-3 py-2 text-xs font-bold text-white/58 transition hover:text-white">Back to AI Ant</button>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-300/70">Colony Crew</p>
            <h1 className="truncate font-heading text-lg font-extrabold">{run.title}</h1>
          </div>
          <span className="ml-auto rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-200">{statusLabel[status]}</span>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div className="rounded-[18px] border border-white/[0.08] bg-white/[0.035] p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/28">User request</p>
            <p className="mt-2 text-sm leading-relaxed text-white/72">{run.userPrompt}</p>
          </div>
          <div className="rounded-[18px] border border-violet-400/18 bg-violet-400/[0.06] p-4">
            <p className="text-sm font-bold text-violet-100">Agents are coordinating your task</p>
            <p className="mt-1 text-sm text-white/48">AI Ant is keeping this as a fast specialist task: gather context, extract insights, draft, and review.</p>
          </div>
          <div className="rounded-[18px] border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/28">Task plan</p>
            <div className="space-y-2">
              {displayTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 rounded-[12px] bg-black/16 px-3 py-2">
                  <span className={`grid h-5 w-5 place-items-center rounded-full text-[9px] font-bold ${task.status === 'done' ? 'bg-emerald-400 text-[#04110d]' : task.status === 'running' ? 'animate-pulse bg-violet-500 text-white' : 'bg-white/[0.07] text-white/25'}`}>{task.status === 'done' ? '✓' : '•'}</span>
                  <span className={`text-sm ${task.status === 'todo' ? 'text-white/32' : 'text-white/76'}`}>{task.title}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            {run.agents.map((agent, index) => (
              <div key={agent.id} className={`flex items-center gap-3 rounded-[14px] border p-3 ${index === activeAgentIndex && status !== 'completed' ? 'border-emerald-400/24 bg-emerald-400/[0.06]' : 'border-white/[0.07] bg-white/[0.03]'}`}>
                <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-[12px] bg-[#f4f4f8]">
                  <img src={agent.avatar} alt={agent.name} draggable={false} className="image-pixelated h-[82%] w-[82%] object-contain" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white/82">{agent.name}</p>
                  <p className="truncate text-xs text-white/38">{agent.task}</p>
                </div>
              </div>
            ))}
          </div>
          {showOutput && <div className="rounded-[18px] border border-emerald-400/20 bg-emerald-400/[0.06] p-4 text-sm leading-relaxed text-white/68">Mock output: The crew prepared a concise answer with context, key insights, recommended next steps, and quality notes.</div>}
        </div>
        <div className="border-t border-white/[0.08] p-4">
          <div className="flex gap-2 rounded-[16px] border border-white/[0.08] bg-[#0b1220] p-2">
            <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message the crew..." className="min-w-0 flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder:text-white/25" />
            <button onClick={() => setMessage('')} className="rounded-[11px] bg-violet-600 px-4 py-2 text-xs font-bold text-white">Send</button>
          </div>
        </div>
      </section>
      <section className="hidden min-w-0 flex-1 flex-col bg-[radial-gradient(circle_at_50%_20%,rgba(124,92,252,0.18),transparent_34%),#070b14] lg:flex">
        <header className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
          <div>
            <p className="font-heading text-lg font-extrabold">Colony Computer</p>
            <p className="text-xs text-white/35">{status === 'matching' ? 'Matching personnel...' : status === 'creating_agents' ? 'Creating crew...' : status === 'completed' ? 'Ready for review' : 'Executing task...'}</p>
          </div>
          <span className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-200"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />Running</span>
        </header>
        <div className="relative flex flex-1 items-center justify-center overflow-hidden p-8">
          {status === 'matching' && (
            <div className="grid grid-cols-4 gap-4">
              {run.agents.concat(run.agents.slice(0, 2)).map((agent, index) => (
                <motion.div key={`${agent.id}-${index}`} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.12 }} className={`rounded-[18px] border p-4 text-center ${index < 4 ? 'border-violet-400/30 bg-violet-400/[0.08] shadow-[0_0_28px_rgba(124,92,252,0.14)]' : 'border-white/[0.07] bg-white/[0.03]'}`}>
                  <img src={agent.avatar} alt="" className="image-pixelated mx-auto h-14 w-14 rounded-[14px] bg-[#f4f4f8] p-1" />
                  <p className="mt-2 text-xs font-bold text-white/75">{agent.name}</p>
                </motion.div>
              ))}
            </div>
          )}
          {status === 'creating_agents' && (
            <motion.div initial={{ opacity: 0, scale: 0.92, rotate: -2 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} className="w-[320px] rounded-[26px] border border-violet-400/25 bg-[#11182a] p-6 text-center shadow-[0_34px_90px_rgba(0,0,0,0.48)]">
              <img src={run.agents[activeAgentIndex]?.avatar} alt="" className="image-pixelated mx-auto h-24 w-24 rounded-[22px] bg-[#f4f4f8] p-2" />
              <h2 className="mt-4 font-heading text-xl font-extrabold">{run.agents[activeAgentIndex]?.name}</h2>
              <p className="mt-1 text-sm text-violet-200/70">{run.agents[activeAgentIndex]?.description}</p>
            </motion.div>
          )}
          {['running', 'reviewing', 'completed', 'stopped'].includes(status) && (
            <div className="w-full max-w-3xl">
              <div className="grid gap-3">
                {displayTasks.map((task) => (
                  <motion.div key={task.id} layout className={`flex items-center justify-between rounded-[18px] border px-4 py-3 ${task.status === 'done' ? 'border-emerald-400/20 bg-emerald-400/[0.06]' : task.status === 'running' ? 'border-violet-400/24 bg-violet-400/[0.08]' : 'border-white/[0.07] bg-white/[0.03]'}`}>
                    <span className="text-sm font-semibold text-white/72">{task.title}</span>
                    <span className="text-xs font-bold capitalize text-white/38">{task.status}</span>
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-4 gap-3">
                {run.agents.map((agent, index) => (
                  <div key={agent.id} className={`rounded-[18px] border p-3 text-center ${index === activeAgentIndex && status !== 'completed' ? 'border-emerald-400/30 bg-emerald-400/[0.08]' : 'border-white/[0.07] bg-white/[0.03]'}`}>
                    <img src={agent.avatar} alt="" className="image-pixelated mx-auto h-14 w-14 rounded-[14px] bg-[#f4f4f8] p-1" />
                    <p className="mt-2 text-xs font-bold text-white/72">{agent.name}</p>
                    <p className="mt-1 text-[10px] text-white/35">{index === 0 ? 'Researching' : index === 1 ? 'Analyzing' : index === 2 ? 'Drafting' : 'Reviewing'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <footer className="flex items-center gap-2 border-t border-white/[0.08] p-4">
          <button onClick={stop} className="rounded-[12px] border border-red-400/20 bg-red-400/[0.07] px-4 py-2 text-xs font-bold text-red-300">Stop</button>
          <button onClick={() => setShowOutput((open) => !open)} className="rounded-[12px] bg-violet-600 px-4 py-2 text-xs font-bold text-white">View output</button>
          <button className="ml-auto rounded-[12px] border border-white/[0.09] bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/50">Continue in One-Man Enterprise</button>
        </footer>
      </section>
    </div>
  );
}
