import React from 'react';
import { AlertTriangle, Calendar, Check, Clock3, Database, Download, FileText, Filter, Mail, Play, Sparkles, Upload, X, Zap } from 'lucide-react';
import { DATA_STANDARD_FIELDS, MOCK_PIPELINE_COLUMNS } from '../../lib/data/connectorSeedData';
import { PLANS } from '../../lib/data/runSeedData';
import { REPORT_TEMPLATES, _mkSections } from '../../lib/data/reportData';
import { mockAnalyzeWorkflow, mockDebugWorkflow, mockGenerateExplanation, mockGenerateInstructions, mockGenerateWorkflow, mockScoreWorkflow } from '../../lib/workflow/workflowMocks';
import type { ApprovalRequest, ApprovalRule, AuditActorType, AuditLog, CanvasAgent, PendingAction, RunStep, RunStepStatus, WorkflowInputType, WorkflowRun } from '../../lib/types/workflowTypes';
import type { PlanTier, UsageState, UpgradeModalState, UpgradeReason } from '../../lib/types/billingTypes';
import type { AgentInstructionResult, AIConfidence, AIWorkflowResult, AIWorkflowType, BuildWorkflowModalState, CanvasConnection, DataPreviewState, DataSourceHistoryItem, DebugSeverity, DebugWorkflowState, EmailDraftState, ExplanationMode, ExplainWorkflowState, ExportModalState, GenerateInstructionsState, ImproveWorkflowState, InstructionQuality, LineDraftState, ProcessedFile, Report, ReportExportRecord, ReportSection, ReportSectionType, ReportStatus, ReportTemplateId, ScheduledReport, ScheduledReportDestination, ScheduledReportFrequency, SuggestionCategory, WorkflowQualityScore, WorkflowSuggestion } from '../../lib/types/appTypes';

export function ModalShell({ title, subtitle, onClose, children }: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[420] flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-[22px] border border-white/[0.10] bg-[#0e0e1a] shadow-[0_32px_100px_rgba(0,0,0,0.7)]" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
          <div>
            <h3 className="font-heading text-[16px] font-extrabold text-white">{title}</h3>
            {subtitle && <p className="mt-0.5 text-[11px] text-white/45">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.06] text-white/50 transition hover:bg-white/[0.12] hover:text-white">x</button>
        </div>
        <div className="max-h-[calc(88vh-72px)] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export function FileProcessingCenter({ files, setFiles, onAddToWorkflowInput, onClose }: {
  files: ProcessedFile[];
  setFiles: React.Dispatch<React.SetStateAction<ProcessedFile[]>>;
  onAddToWorkflowInput: (inputType: WorkflowInputType) => void;
  onClose: () => void;
}) {
  const processAgain = (id: string) => {
    setFiles((prev) => prev.map((file) => file.id === id ? { ...file, status: 'processing' } : file));
    window.setTimeout(() => {
      setFiles((prev) => prev.map((file) => file.id === id ? { ...file, status: 'done', errorMessage: undefined } : file));
    }, 700);
  };

  return (
    <ModalShell title="File Processing Center" subtitle={`${files.length} files ready for workflow input`} onClose={onClose}>
      <div className="space-y-3">
        {files.map((file) => (
          <div key={file.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-white">{file.name}</p>
                <p className="mt-1 text-[11px] text-white/40">{file.type.toUpperCase()} · {file.size} · {file.uploadedAt}</p>
              </div>
              <span className={`rounded-full px-2 py-1 text-[10px] font-bold capitalize ${file.status === 'done' ? 'bg-emerald-500/15 text-emerald-300' : file.status === 'error' ? 'bg-red-500/15 text-red-300' : 'bg-white/[0.08] text-white/55'}`}>{file.status}</span>
            </div>
            {file.summary && <p className="mt-3 text-[12px] leading-relaxed text-white/55">{file.summary}</p>}
            {file.keyPoints && (
              <div className="mt-3 grid gap-1.5">
                {file.keyPoints.slice(0, 3).map((point) => <p key={point} className="text-[11px] text-white/45">- {point}</p>)}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => onAddToWorkflowInput('file-upload')} className="rounded-xl bg-white px-3 py-2 text-[11px] font-bold text-[#0a0a14]">Add to workflow</button>
              <button onClick={() => processAgain(file.id)} className="rounded-xl border border-white/[0.12] px-3 py-2 text-[11px] font-semibold text-white/65 transition hover:bg-white/[0.06]">Process again</button>
            </div>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}

export function DataPipelineModal({ state, onUpdateState, onClose, onSystemMessage, onToast, sourceHistory, onUpdateHistory }: {
  state: DataPreviewState;
  onUpdateState: React.Dispatch<React.SetStateAction<DataPreviewState>>;
  onClose: () => void;
  onSystemMessage: (text: string) => void;
  onToast: (message: string) => void;
  sourceHistory: DataSourceHistoryItem[];
  onUpdateHistory: React.Dispatch<React.SetStateAction<DataSourceHistoryItem[]>>;
}) {
  const markClean = () => {
    onUpdateState((prev) => ({ ...prev, cleaned: true, qualityScore: Math.max(prev.qualityScore, 94), duplicateCount: 0 }));
    onUpdateHistory((prev) => prev.map((item, index) => index === 0 ? { ...item, status: 'cleaned', qualityScore: Math.max(item.qualityScore, 94) } : item));
    onSystemMessage('System: Data pipeline cleaned and validated.');
    onToast('Data cleaned');
  };

  return (
    <ModalShell title="Data Pipeline" subtitle={`${state.sourceName} · ${state.totalRows} rows`} onClose={onClose}>
      <div className="grid gap-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            ['Quality', `${state.qualityScore}%`],
            ['Missing', String(state.missingCount)],
            ['Duplicates', String(state.duplicateCount)],
            ['Columns', String(state.columns.length)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
              <p className="text-[10px] uppercase tracking-wide text-white/30">{label}</p>
              <p className="mt-1 text-lg font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/[0.08]">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-white/[0.04] text-white/45">
              <tr>{state.columns.slice(0, 5).map((column) => <th key={column} className="px-3 py-2 font-semibold">{column}</th>)}</tr>
            </thead>
            <tbody>
              {state.rows.slice(0, 6).map((row, index) => (
                <tr key={index} className="border-t border-white/[0.05] text-white/65">
                  {state.columns.slice(0, 5).map((column) => <td key={column} className="px-3 py-2">{row[column] ?? '-'}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-white/30">Recent sources</p>
          {sourceHistory.slice(0, 4).map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2">
              <span className="text-[12px] text-white/70">{item.name}</span>
              <span className="text-[10px] text-white/35">{item.status} · {item.qualityScore}%</span>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-white/[0.12] px-4 py-2 text-[12px] font-semibold text-white/65">Close</button>
          <button onClick={markClean} className="rounded-xl bg-white px-4 py-2 text-[12px] font-bold text-[#0a0a14]">Clean data</button>
        </div>
      </div>
    </ModalShell>
  );
}

export function ApprovalHistoryModal({ requests, history, onClose }: {
  requests: ApprovalRequest[];
  history: ApprovalRequest[];
  onClose: () => void;
}) {
  const entries = [...requests, ...history].slice(0, 12);
  return (
    <ModalShell title="Approval History" subtitle={`${entries.length} approval records`} onClose={onClose}>
      <div className="space-y-2">
        {entries.map((request) => (
          <div key={`${request.id}-${request.status}`} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-white">{request.title}</p>
              <span className="rounded-full bg-white/[0.08] px-2 py-1 text-[10px] font-bold text-white/55">{request.status}</span>
            </div>
            <p className="mt-1 text-[11px] text-white/40">{request.agentName} · {request.actionType} · {request.createdAt}</p>
            <p className="mt-2 text-[12px] text-white/55">{request.summary}</p>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}

export function ApprovalRulesModal({ rules, onUpdate, onClose }: {
  rules: ApprovalRule[];
  onUpdate: React.Dispatch<React.SetStateAction<ApprovalRule[]>>;
  onClose: () => void;
}) {
  return (
    <ModalShell title="Approval Rules" subtitle="Control when workflow actions need approval" onClose={onClose}>
      <div className="space-y-2">
        {rules.map((rule) => (
          <div key={rule.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
            <div>
              <p className="text-sm font-bold text-white">{rule.name}</p>
              <p className="mt-1 text-[11px] text-white/40">{rule.conditionType} {rule.operator} {rule.value} - {rule.action}</p>
            </div>
            <button
              onClick={() => onUpdate((prev) => prev.map((item) => item.id === rule.id ? { ...item, enabled: !item.enabled } : item))}
              className={`rounded-full px-3 py-1 text-[11px] font-bold ${rule.enabled ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/[0.08] text-white/40'}`}>
              {rule.enabled ? 'On' : 'Off'}
            </button>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}

export function ApprovalCardModal({ request, onApprove, onReject, onClose }: {
  request: ApprovalRequest;
  onApprove: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
  onClose: () => void;
}) {
  return (
    <ModalShell title={request.title} subtitle={`${request.agentName} requests ${request.actionType}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
          <p className="text-[12px] text-white/55">{request.summary}</p>
          <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-black/30 p-3 text-[11px] text-white/60">{request.previewContent}</pre>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={() => { onReject(request.id); onClose(); }} className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-2 text-[12px] font-bold text-red-300">Reject</button>
          <button onClick={() => { onApprove(request.id); onClose(); }} className="rounded-xl bg-white px-4 py-2 text-[12px] font-bold text-[#0a0a14]">Approve</button>
        </div>
      </div>
    </ModalShell>
  );
}

export function ActionConfirmModal({ action, safetyMode, onConfirm, onCancel }: {
  action: PendingAction;
  safetyMode: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ModalShell title="Confirm Action" subtitle={safetyMode ? 'Safety Mode is active' : 'Review before continuing'} onClose={onCancel}>
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-white">{action.actionName}</p>
            <span className="rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-bold text-amber-300">{action.riskLevel}</span>
          </div>
          <p className="mt-1 text-[11px] text-white/40">{action.requestedByAgentName} · {action.workflowStep} · {action.destination}</p>
          <p className="mt-3 text-[12px] text-white/55">{action.reason}</p>
          <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-black/30 p-3 text-[11px] text-white/60">{action.previewContent}</pre>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-xl border border-white/[0.12] px-4 py-2 text-[12px] font-semibold text-white/65">Cancel</button>
          <button onClick={onConfirm} className="rounded-xl bg-white px-4 py-2 text-[12px] font-bold text-[#0a0a14]">Confirm</button>
        </div>
      </div>
    </ModalShell>
  );
}

export function UpgradeModal({ modal, usageState, setUsageState, onClose, onViewPlans, onUpgraded }: {
  modal: UpgradeModalState;
  usageState: UsageState;
  setUsageState: (state: UsageState) => void;
  onClose: () => void;
  onViewPlans: () => void;
  onUpgraded: (plan: PlanTier) => void;
}) {
  const targetPlan = PLANS.find((plan) => plan.id === modal.toPlan) ?? PLANS[1];
  const currentPlan = PLANS.find((plan) => plan.id === usageState.currentPlan);
  const reasonText: Record<UpgradeReason, string> = {
    'run-limit': 'You reached the workflow run limit for this plan.',
    credits: `This action needs ${modal.requiredCredits ?? modal.estimatedCredits ?? 'more'} credits.`,
    'pro-feature': `${modal.featureName ?? 'This feature'} is available on a higher plan.`,
    'team-feature': 'Team collaboration needs a higher plan.',
    connector: 'This connector needs a higher plan.',
    'cost-warning': 'A higher plan gives you more credits for this workflow.',
    'project-limit': 'You reached the project limit for this plan.',
  };

  return (
    <ModalShell title={`Upgrade to ${targetPlan.name}`} subtitle={reasonText[modal.reason]} onClose={onClose}>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="text-[10px] uppercase tracking-wide text-white/30">Current plan</p>
            <p className="mt-1 text-lg font-bold text-white">{currentPlan?.name ?? usageState.currentPlan}</p>
            <p className="mt-2 text-[11px] text-white/45">{usageState.workflowRunsUsed} runs · {usageState.agentCreditsUsed} credits used</p>
          </div>
          <div className="rounded-2xl border border-accent/25 bg-accent/[0.08] p-4">
            <p className="text-[10px] uppercase tracking-wide text-accent">Recommended</p>
            <p className="mt-1 text-lg font-bold text-white">{targetPlan.name}</p>
            <p className="mt-2 text-[11px] text-white/60">{targetPlan.creditsLimit} credits · {targetPlan.workflowRunsLimit} runs</p>
          </div>
        </div>
        <div className="space-y-1">
          {targetPlan.features.slice(0, 5).map((feature) => <p key={feature} className="text-[12px] text-white/55">- {feature}</p>)}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button onClick={onViewPlans} className="rounded-xl border border-white/[0.12] px-4 py-2 text-[12px] font-semibold text-white/65">View plans</button>
          <button
            onClick={() => {
              setUsageState({ ...usageState, currentPlan: modal.toPlan });
              onUpgraded(modal.toPlan);
              onClose();
            }}
            className="rounded-xl bg-white px-4 py-2 text-[12px] font-bold text-[#0a0a14]">
            Upgrade
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ── RunHistoryModal ───────────────────────────────────────────────────────────
export function RunHistoryModal({
  runs, setRuns, workflowName, addSystemMessage, setToast, addAuditLog, onClose,
}: {
  runs: WorkflowRun[];
  setRuns: React.Dispatch<React.SetStateAction<WorkflowRun[]>>;
  workflowName: string;
  addSystemMessage: (text: string) => void;
  setToast: (msg: string) => void;
  addAuditLog: (params: Omit<AuditLog, 'id' | 'timestamp' | 'rollbackStatus'>) => void;
  onClose: () => void;
}) {
  const [view, setView] = React.useState<'list' | 'detail' | 'compare'>('list');
  const [selectedRunId, setSelectedRunId] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState('All');
  const [search, setSearch] = React.useState('');
  const [detailTab, setDetailTab] = React.useState<'summary' | 'timeline' | 'usage' | 'errors' | 'outputs' | 'log'>('summary');
  const [retryStep, setRetryStep] = React.useState<RunStep | null>(null);
  const [compareAId, setCompareAId] = React.useState<string | null>(null);
  const [compareBId, setCompareBId] = React.useState<string | null>(null);
  const [exportMenuRunId, setExportMenuRunId] = React.useState<string | null>(null);

  const selectedRun = runs.find((r) => r.id === selectedRunId) ?? null;
  const compareA = runs.find((r) => r.id === compareAId) ?? null;
  const compareB = runs.find((r) => r.id === compareBId) ?? null;

  const fmtDur = (s: number) => s === 0 ? '—' : s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
  const fmtCost = (c: number) => `$${c.toFixed(2)}`;
  const fmtNum = (n: number) => n.toLocaleString();

  const statusCls = (s: string) => {
    if (s === 'Completed') return 'text-emerald-300 bg-emerald-400/15 border-emerald-400/20';
    if (s === 'Failed') return 'text-red-400 bg-red-400/15 border-red-400/20';
    if (s === 'Running') return 'text-sky-300 bg-sky-400/15 border-sky-400/20';
    if (s === 'Waiting Approval') return 'text-amber-300 bg-amber-400/15 border-amber-400/20';
    if (s === 'Paused') return 'text-yellow-300 bg-yellow-400/15 border-yellow-400/20';
    return 'text-white/40 bg-white/[0.06] border-white/[0.08]';
  };
  const stepStatusCls = (s: string) => {
    if (s === 'Completed') return 'text-emerald-300';
    if (s === 'Failed') return 'text-red-400';
    if (s === 'Running') return 'text-sky-300';
    if (s === 'Waiting Approval') return 'text-amber-300';
    if (s === 'Pending') return 'text-white/30';
    return 'text-white/40';
  };
  const statusDotCls = (s: string) => {
    if (s === 'Completed') return 'bg-emerald-400';
    if (s === 'Failed') return 'bg-red-400';
    if (s === 'Running') return 'bg-sky-400 animate-pulse';
    if (s === 'Waiting Approval') return 'bg-amber-400';
    if (s === 'Paused') return 'bg-yellow-400';
    return 'bg-white/30';
  };
  const costBadge = (cost: number) => {
    if (cost < 0.05) return { label: 'Low Cost', cls: 'text-emerald-300 bg-emerald-400/10' };
    if (cost < 0.15) return { label: 'Medium cost', cls: 'text-amber-300 bg-amber-400/10' };
    return { label: 'High cost', cls: 'text-red-400 bg-red-400/10' };
  };

  const FILTERS = ['All', 'Completed', 'Failed', 'Waiting Approval', 'Running', 'Manual', 'Scheduled'];
  const filtered = runs.filter((r) => {
    const statusFilters = ['Completed', 'Failed', 'Waiting Approval', 'Running', 'Paused', 'Stopped', 'Cancelled'];
    if (filter !== 'All') {
      if (statusFilters.includes(filter) && r.status !== filter) return false;
      if (filter === 'Manual' && r.triggerType !== 'Manual') return false;
      if (filter === 'Scheduled' && r.triggerType !== 'Schedule') return false;
    }
    if (search) {
      const q = search.toLowerCase();
      if (!r.workflowName.toLowerCase().includes(q) && !`run #${r.runNumber}`.includes(q) && !r.status.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const exportTxt = (run: WorkflowRun) => {
    const slowestStep = [...run.steps].sort((a, b) => b.durationSeconds - a.durationSeconds)[0];
    const lines = [
      'COLONY RUN LOG',
      '═══════════════════════════════════════════════',
      `Run ID:        ${run.id.toUpperCase()} (Run #${run.runNumber})`,
      `Workflow:      ${run.workflowName}`,
      `Status:        ${run.status}`,
      `Trigger:       ${run.triggerType}`,
      `Started:       ${run.startedAt}`,
      run.completedAt ? `Completed:     ${run.completedAt}` : '',
      `Duration:      ${fmtDur(run.durationSeconds)}`,
      '',
      'USAGE',
      '───────────────────────────────────────────────',
      `Agents Used:   ${run.agentsUsed}`,
      `Total Tokens:  ${fmtNum(run.totalTokens)} (in: ${fmtNum(run.inputTokens)}, out: ${fmtNum(run.outputTokens)})`,
      `Credits Used:  ${run.creditsUsed}`,
      `Est. Cost:     ${fmtCost(run.estimatedCost)}`,
      '',
      'STEP TIMELINE',
      '───────────────────────────────────────────────',
      ...run.steps.map((s, i) => [
        `Step ${i + 1}: ${s.agentName} [${s.status}]`,
        `  Role:    ${s.role}`,
        `  Time:    ${s.startedAt}${s.endedAt ? ` → ${s.endedAt}` : ''} (${fmtDur(s.durationSeconds)})`,
        `  Tokens:  ${fmtNum(s.totalTokens)} | Cost: ${fmtCost(s.estimatedCost)}`,
        `  Input:   ${s.inputSource}`,
        `  Output:  ${s.outputProduced}`,
        `  Summary: ${s.summary}`,
        s.error ? `  ERROR:   ${s.error.message}` : '',
      ].filter(Boolean).join('\n')),
      '',
      run.error ? [
        'ERROR TRACE',
        '───────────────────────────────────────────────',
        `Failed Step:   ${run.error.failedAgentName}`,
        `Error Type:    ${run.error.errorType}`,
        `Severity:      ${run.error.severity}`,
        `Message:       ${run.error.message}`,
        `Likely Cause:  ${run.error.likelyCause}`,
        `Suggested Fix: ${run.error.suggestedFix}`,
        '',
      ].join('\n') : '',
      'OUTPUT',
      '───────────────────────────────────────────────',
      `Type:          ${run.outputType}`,
      run.outputSummary ? `Summary:       ${run.outputSummary}` : 'No output generated.',
      '',
      'PERFORMANCE',
      '───────────────────────────────────────────────',
      `Total duration: ${fmtDur(run.durationSeconds)}`,
      slowestStep ? `Slowest step:   ${slowestStep.agentName} (${fmtDur(slowestStep.durationSeconds)})` : '',
      `Avg step dur:   ${fmtDur(Math.round(run.steps.reduce((sum, s) => sum + s.durationSeconds, 0) / Math.max(run.steps.length, 1)))}`,
      '',
      `─── Generated by Colony · ${new Date().toLocaleString()} ───`,
    ].filter((l) => l !== undefined && l !== null).join('\n');

    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `colony-${run.id}-log.txt`; a.click();
    URL.revokeObjectURL(url);
    setToast('Run log exported as TXT');
    addSystemMessage('System: Run log exported.');
    setExportMenuRunId(null);
  };

  const exportJSON = (run: WorkflowRun) => {
    const blob = new Blob([JSON.stringify(run, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `colony-${run.id}.json`; a.click();
    URL.revokeObjectURL(url);
    setToast('Run log exported as JSON');
    addSystemMessage('System: Run log exported.');
    setExportMenuRunId(null);
  };

  const copyClipboard = (run: WorkflowRun) => {
    const text = `Run #${run.runNumber} · ${run.status} · ${run.workflowName}\nTrigger: ${run.triggerType} · Started: ${run.startedAt} · Duration: ${fmtDur(run.durationSeconds)}\nAgents: ${run.agentsUsed} · Tokens: ${fmtNum(run.totalTokens)} · Credits: ${run.creditsUsed} · Cost: ${fmtCost(run.estimatedCost)}\n${run.outputSummary ?? 'No output generated.'}`;
    navigator.clipboard.writeText(text).then(() => setToast('Copied to clipboard')).catch(() => setToast('Copy failed'));
    setExportMenuRunId(null);
  };

  const confirmRetry = (step: RunStep, run: WorkflowRun) => {
    const stepIdx = run.steps.findIndex((s) => s.id === step.id);
    const newRunNum = Math.max(...runs.map((r) => r.runNumber)) + 1;
    const newRun: WorkflowRun = {
      ...run,
      id: `run-${String(newRunNum).padStart(3, '0')}`,
      runNumber: newRunNum,
      status: 'Running',
      startedAt: 'Just now',
      completedAt: undefined,
      durationSeconds: 0,
      creditsUsed: 0,
      totalTokens: 0,
      inputTokens: 0,
      outputTokens: 0,
      estimatedCost: 0,
      outputSummary: undefined,
      error: undefined,
      steps: run.steps.map((s, i) => ({
        ...s,
        status: (i < stepIdx ? 'Completed' : i === stepIdx ? 'Running' : 'Pending') as RunStepStatus,
        error: undefined,
      })),
    };
    setRuns((prev) => [newRun, ...prev]);
    addSystemMessage(`System: Retrying Run #${run.runNumber} from Step "${step.agentName}".`);
    setToast(`Retry started from "${step.agentName}"`);
    addAuditLog({ actorType: 'User', actorName: 'You', actionType: 'workflow-run', title: `Retry from "${step.agentName}"`, description: `Workflow retried from step "${step.agentName}". Previous ${stepIdx} step(s) reused.`, workflowName: run.workflowName, stepName: step.agentName, riskLevel: 'Low', status: 'Success', reversible: false, metadata: { retryFromStep: step.agentName, originalRunId: run.id } });
    // Simulate completion after delay
    window.setTimeout(() => {
      setRuns((prev) => prev.map((r) =>
        r.id === newRun.id
          ? { ...r, status: 'Completed', completedAt: 'Just now', durationSeconds: run.durationSeconds - stepIdx * 5, creditsUsed: run.creditsUsed - stepIdx, totalTokens: run.totalTokens - stepIdx * 150, inputTokens: run.inputTokens - stepIdx * 90, outputTokens: run.outputTokens - stepIdx * 60, estimatedCost: (run.creditsUsed - stepIdx) * 0.01, outputSummary: run.outputSummary, steps: run.steps.map((s) => ({ ...s, status: 'Completed' as RunStepStatus, error: undefined })) }
          : r
      ));
      addSystemMessage(`System: Retry Run #${newRunNum} completed.`);
    }, 3000);
    setRetryStep(null);
    setSelectedRunId(newRun.id);
    setView('detail');
    setDetailTab('summary');
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex w-full max-w-[1060px] flex-col rounded-[22px] border border-white/[0.1] bg-[#0e0e1a] shadow-[0_28px_90px_rgba(0,0,0,0.65)]"
        style={{ maxHeight: 'min(92vh, calc(100vh - 32px))' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="shrink-0 flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
          <div className="flex items-center gap-3">
            {view !== 'list' && (
              <button onClick={() => { setView('list'); setDetailTab('summary'); }} className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.1] text-white/40 transition hover:border-white/[0.2] hover:text-white text-sm">←</button>
            )}
            <div>
              <h2 className="font-heading text-[16px] font-extrabold text-white">
                {view === 'list' ? 'Run History' : view === 'compare' ? 'Compare Runs' : selectedRun ? `Run #${selectedRun.runNumber}` : 'Run Detail'}
              </h2>
              <p className="mt-0.5 text-[11px] text-white/40">
                {view === 'list' ? `${runs.length} runs · ${workflowName}` : view === 'compare' ? 'Side-by-side run comparison' : selectedRun ? `${selectedRun.workflowName} · ${selectedRun.startedAt}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {view === 'list' && (
              <button onClick={() => { if (runs.length >= 2) { setCompareAId(runs[0].id); setCompareBId(runs[1].id); setView('compare'); } else setToast('Need at least 2 runs to compare'); }}
                className="rounded-[10px] border border-white/[0.1] px-3 py-1.5 text-[11px] font-semibold text-white/60 transition hover:bg-white/[0.06] hover:text-white">Compare</button>
            )}
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.1] text-white/40 transition hover:border-white/[0.2] hover:text-white">✕</button>
          </div>
        </div>

        {/* ── LIST VIEW ── */}
        {view === 'list' && (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* Filters + search */}
            <div className="shrink-0 border-b border-white/[0.06] px-6 py-3 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {FILTERS.map((f) => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${filter === f ? 'bg-accent text-white' : 'border border-white/[0.1] text-white/50 hover:border-white/[0.2] hover:text-white'}`}>
                    {f}
                  </button>
                ))}
              </div>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search runs…"
                className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-[12px] text-white placeholder-white/25 outline-none focus:border-accent/40" />
            </div>

            {/* Run list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-3xl mb-2">📊</p>
                  <p className="text-[13px] font-semibold text-white/40">No runs match</p>
                  <p className="text-[11px] text-white/25 mt-1">Try a different filter or search term</p>
                </div>
              )}
              {filtered.map((run) => {
                const cb = costBadge(run.estimatedCost);
                return (
                  <div key={run.id} className="rounded-[16px] border border-white/[0.08] bg-white/[0.02] p-4 transition hover:border-white/[0.12] hover:bg-white/[0.03]">
                    <div className="flex items-start gap-3">
                      <span className={`inline-block h-2 w-2 rounded-full mt-1.5 shrink-0 ${statusDotCls(run.status)}`} />
                      <div className="flex-1 min-w-0">
                        {/* Top row */}
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="font-heading text-[13px] font-extrabold text-white">Run #{run.runNumber}</span>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusCls(run.status)}`}>{run.status}</span>
                          <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/50">{run.triggerType}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${cb.cls}`}>{cb.label}</span>
                        </div>
                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/45 mb-2">
                          <span>🕐 {run.startedAt}</span>
                          <span>⏱ {fmtDur(run.durationSeconds)}</span>
                          <span>🤖 {run.agentsUsed} agents</span>
                          <span>🔤 {fmtNum(run.totalTokens)} tokens</span>
                          <span>💳 {run.creditsUsed} credits</span>
                          <span>💰 {fmtCost(run.estimatedCost)}</span>
                          {run.error && <span className="text-red-400 font-medium">✕ Failed at {run.error.failedAgentName}</span>}
                          {run.outputType !== 'None' && run.status === 'Completed' && <span className="text-emerald-300/70">✓ {run.outputType}</span>}
                        </div>
                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button onClick={() => { setSelectedRunId(run.id); setView('detail'); setDetailTab('summary'); }}
                            className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-semibold text-accent transition hover:bg-accent/20">View Details</button>
                          {run.status === 'Failed' && run.error && (
                            <button onClick={() => {
                              const failedStep = run.steps.find((s) => s.id === run.error?.failedStepId);
                              if (failedStep) { setSelectedRunId(run.id); setRetryStep(failedStep); }
                            }}
                              className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold text-amber-300 transition hover:bg-amber-400/20">↺ Retry</button>
                          )}
                          <button onClick={() => {
                            const other = runs.find((r) => r.id !== run.id);
                            setCompareAId(run.id); setCompareBId(other?.id ?? null); setView('compare');
                          }}
                            className="rounded-lg border border-white/[0.1] px-3 py-1 text-[11px] font-semibold text-white/55 transition hover:bg-white/[0.06] hover:text-white">Compare</button>
                          <div className="relative">
                            <button onClick={() => setExportMenuRunId(exportMenuRunId === run.id ? null : run.id)}
                              className="rounded-lg border border-white/[0.1] px-3 py-1 text-[11px] font-semibold text-white/55 transition hover:bg-white/[0.06] hover:text-white">Export Log ▾</button>
                            {exportMenuRunId === run.id && (
                              <div className="absolute left-0 top-full z-50 mt-1 w-36 rounded-[12px] border border-white/[0.1] bg-[#0e0e1a] py-1 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
                                {[['📄 Export TXT', () => exportTxt(run)], ['{ } Export JSON', () => exportJSON(run)], ['📋 Copy Summary', () => copyClipboard(run)]].map(([label, fn]) => (
                                  <button key={label as string} onClick={fn as () => void}
                                    className="flex w-full items-center px-3 py-2 text-left text-[11px] text-white/70 transition hover:bg-white/[0.05] hover:text-white">{label as string}</button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── DETAIL VIEW ── */}
        {view === 'detail' && selectedRun && (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* Status bar */}
            <div className="shrink-0 flex flex-wrap items-center gap-4 border-b border-white/[0.06] px-6 py-3">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold ${statusCls(selectedRun.status)}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${statusDotCls(selectedRun.status)}`} />
                {selectedRun.status}
              </span>
              {[
                ['Trigger', selectedRun.triggerType],
                ['Started', selectedRun.startedAt],
                ['Duration', fmtDur(selectedRun.durationSeconds)],
                ['Agents', String(selectedRun.agentsUsed)],
                ['Tokens', fmtNum(selectedRun.totalTokens)],
                ['Credits', String(selectedRun.creditsUsed)],
                ['Cost', fmtCost(selectedRun.estimatedCost)],
              ].map(([k, v]) => (
                <div key={k} className="text-[11px]"><span className="text-white/35">{k}: </span><span className="font-semibold text-white">{v}</span></div>
              ))}
              <div className="ml-auto flex gap-2">
                {selectedRun.status === 'Failed' && selectedRun.error && (
                  <button onClick={() => { const s = selectedRun.steps.find((x) => x.id === selectedRun.error?.failedStepId); if (s) setRetryStep(s); }}
                    className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold text-amber-300 transition hover:bg-amber-400/20">↺ Retry</button>
                )}
                <div className="relative">
                  <button onClick={() => setExportMenuRunId(exportMenuRunId === selectedRun.id ? null : selectedRun.id)}
                    className="rounded-lg border border-white/[0.1] px-3 py-1 text-[11px] font-semibold text-white/55 transition hover:bg-white/[0.06] hover:text-white">Export ▾</button>
                  {exportMenuRunId === selectedRun.id && (
                    <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-[12px] border border-white/[0.1] bg-[#0e0e1a] py-1 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
                      {[['📄 Export TXT', () => exportTxt(selectedRun)], ['{ } Export JSON', () => exportJSON(selectedRun)], ['📋 Copy Summary', () => copyClipboard(selectedRun)]].map(([label, fn]) => (
                        <button key={label as string} onClick={fn as () => void}
                          className="flex w-full items-center px-3 py-2 text-left text-[11px] text-white/70 transition hover:bg-white/[0.05] hover:text-white">{label as string}</button>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => { const other = runs.find((r) => r.id !== selectedRun.id); setCompareAId(selectedRun.id); setCompareBId(other?.id ?? null); setView('compare'); }}
                  className="rounded-lg border border-white/[0.1] px-3 py-1 text-[11px] font-semibold text-white/55 transition hover:bg-white/[0.06] hover:text-white">Compare</button>
              </div>
            </div>

            {/* Detail tabs */}
            <div className="shrink-0 flex gap-0 border-b border-white/[0.06] px-6">
              {(['summary', 'timeline', 'usage', 'errors', 'outputs', 'log'] as const).map((tab) => {
                const labels: Record<string, string> = { summary: 'Summary', timeline: 'Step Timeline', usage: 'Usage & Cost', errors: 'Errors', outputs: 'Outputs', log: 'Raw Log' };
                const hasBadge = tab === 'errors' && (selectedRun.error || selectedRun.steps.some((s) => s.error));
                return (
                  <button key={tab} onClick={() => setDetailTab(tab)}
                    className={`relative px-4 py-3 text-[11px] font-semibold transition border-b-2 ${detailTab === tab ? 'border-accent text-white' : 'border-transparent text-white/40 hover:text-white'}`}>
                    {labels[tab]}
                    {hasBadge && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-red-400" />}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">

              {/* SUMMARY tab */}
              {detailTab === 'summary' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                    {[
                      ['Run ID', selectedRun.id.toUpperCase()],
                      ['Workflow', selectedRun.workflowName],
                      ['Status', selectedRun.status],
                      ['Trigger', selectedRun.triggerType],
                      ['Started', selectedRun.startedAt],
                      ['Completed', selectedRun.completedAt ?? '—'],
                      ['Duration', fmtDur(selectedRun.durationSeconds)],
                      ['Agents Used', String(selectedRun.agentsUsed)],
                      ['Total Tokens', fmtNum(selectedRun.totalTokens)],
                      ['Credits Used', String(selectedRun.creditsUsed)],
                      ['Est. Cost', fmtCost(selectedRun.estimatedCost)],
                      ['Safety Mode', selectedRun.safetyMode ? '🛡 ON' : '⚠ OFF'],
                      ['Output Type', selectedRun.outputType],
                      ['Approval', selectedRun.approvalStatus ?? 'None'],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-[14px] border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-white/35">{k}</p>
                        <p className={`mt-1 text-[12px] font-semibold ${v === selectedRun.status ? (selectedRun.status === 'Completed' ? 'text-emerald-300' : selectedRun.status === 'Failed' ? 'text-red-400' : selectedRun.status === 'Waiting Approval' ? 'text-amber-300' : 'text-white') : 'text-white'}`}>{v}</p>
                      </div>
                    ))}
                  </div>
                  {selectedRun.outputSummary && (
                    <div className="rounded-[14px] border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-white/35">Output Summary</p>
                      <p className="text-[12px] text-white/70">{selectedRun.outputSummary}</p>
                    </div>
                  )}
                  {selectedRun.error && (
                    <div className="rounded-[14px] border border-red-400/20 bg-red-400/[0.04] px-4 py-3">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-red-400/60">Run Error</p>
                      <p className="text-[12px] font-semibold text-red-400">{selectedRun.error.message}</p>
                      <p className="mt-1 text-[11px] text-white/50">Step: {selectedRun.error.failedAgentName} · {selectedRun.error.errorType}</p>
                    </div>
                  )}
                </div>
              )}

              {/* TIMELINE tab */}
              {detailTab === 'timeline' && (
                <div className="space-y-0">
                  {selectedRun.steps.map((step, idx) => (
                    <div key={step.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${step.status === 'Completed' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : step.status === 'Failed' ? 'border-red-400/30 bg-red-400/10 text-red-400' : step.status === 'Waiting Approval' ? 'border-amber-400/30 bg-amber-400/10 text-amber-300' : 'border-white/[0.1] bg-white/[0.04] text-white/30'}`}>{idx + 1}</div>
                        {idx < selectedRun.steps.length - 1 && <div className={`w-px flex-1 my-1 ${step.status === 'Completed' ? 'bg-emerald-400/20' : 'bg-white/[0.07]'}`} style={{ minHeight: '20px' }} />}
                      </div>
                      <div className={`flex-1 rounded-[14px] border p-3 mb-2 ${step.status === 'Failed' ? 'border-red-400/20 bg-red-400/[0.04]' : step.status === 'Waiting Approval' ? 'border-amber-400/20 bg-amber-400/[0.04]' : 'border-white/[0.07] bg-white/[0.02]'}`}>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <span className="font-heading text-[12px] font-bold text-white">{step.agentName}</span>
                            <span className="ml-2 text-[10px] text-white/35">{step.role}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[10px] font-bold ${stepStatusCls(step.status)}`}>{step.status}</span>
                            {step.durationSeconds > 0 && <span className="text-[10px] text-white/35">{fmtDur(step.durationSeconds)}</span>}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-white/40 mb-2">
                          {step.startedAt && <span>Start: {step.startedAt}</span>}
                          {step.endedAt && <span>End: {step.endedAt}</span>}
                          <span>Tokens: {fmtNum(step.totalTokens)}</span>
                          <span>Cost: {fmtCost(step.estimatedCost)}</span>
                        </div>
                        <p className="text-[11px] text-white/60 mb-1">{step.summary}</p>
                        <div className="flex flex-wrap gap-3 text-[10px] text-white/35">
                          <span>In: {step.inputSource}</span>
                          {step.outputProduced !== 'None' && step.outputProduced && <span>Out: {step.outputProduced}</span>}
                        </div>
                        {step.error && (
                          <div className="mt-2 rounded-xl border border-red-400/20 bg-red-400/[0.07] px-3 py-2">
                            <p className="text-[10px] font-bold text-red-400 mb-0.5">⚠ {step.error.errorType}: {step.error.message}</p>
                            <p className="text-[10px] text-white/50">{step.error.likelyCause}</p>
                            <p className="text-[10px] text-accent/70 mt-1">Fix: {step.error.suggestedFix}</p>
                            <button onClick={() => setRetryStep(step)} className="mt-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold text-amber-300 transition hover:bg-amber-400/20">↺ Retry from this step</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* USAGE tab */}
              {detailTab === 'usage' && (() => {
                const slowest = [...selectedRun.steps].sort((a, b) => b.durationSeconds - a.durationSeconds)[0];
                const heaviest = [...selectedRun.steps].sort((a, b) => b.totalTokens - a.totalTokens)[0];
                const avgDur = Math.round(selectedRun.steps.reduce((sum, s) => sum + s.durationSeconds, 0) / Math.max(selectedRun.steps.length, 1));
                const cb = costBadge(selectedRun.estimatedCost);
                return (
                  <div className="space-y-4">
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-white/35">Token Usage</p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {[
                          ['Total tokens', fmtNum(selectedRun.totalTokens)],
                          ['Input tokens', fmtNum(selectedRun.inputTokens)],
                          ['Output tokens', fmtNum(selectedRun.outputTokens)],
                          ['Avg per agent', fmtNum(Math.round(selectedRun.totalTokens / Math.max(selectedRun.agentsUsed, 1)))],
                          ['Most used agent', heaviest?.agentName ?? '—'],
                          ['Heaviest step tokens', heaviest ? fmtNum(heaviest.totalTokens) : '—'],
                        ].map(([k, v]) => (
                          <div key={k} className="rounded-[12px] border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
                            <p className="text-[9px] uppercase tracking-wide text-white/35">{k}</p>
                            <p className="mt-0.5 text-[13px] font-bold text-white">{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-white/35">Cost Breakdown</p>
                      <div className="rounded-[14px] border border-white/[0.07] bg-white/[0.03] p-4 space-y-2">
                        {[
                          ['AI compute (tokens)', fmtCost(selectedRun.estimatedCost * 0.75)],
                          ['File processing (est.)', fmtCost(selectedRun.estimatedCost * 0.15)],
                          ['Connector actions (est.)', fmtCost(selectedRun.estimatedCost * 0.1)],
                        ].map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between text-[12px]">
                            <span className="text-white/50">{k}</span>
                            <span className="font-semibold text-white">{v}</span>
                          </div>
                        ))}
                        <div className="border-t border-white/[0.08] pt-2 flex items-center justify-between text-[12px]">
                          <span className="font-bold text-white">Total estimated cost</span>
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${cb.cls}`}>{cb.label}</span>
                            <span className="font-bold text-white">{fmtCost(selectedRun.estimatedCost)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-white/35">Duration</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          ['Total', fmtDur(selectedRun.durationSeconds)],
                          ['Slowest step', slowest ? `${slowest.agentName} (${fmtDur(slowest.durationSeconds)})` : '—'],
                          ['Avg step', fmtDur(avgDur)],
                        ].map(([k, v]) => (
                          <div key={k} className="rounded-[12px] border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
                            <p className="text-[9px] uppercase tracking-wide text-white/35">{k}</p>
                            <p className="mt-0.5 text-[12px] font-bold text-white">{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-white/35">Per-step tokens</p>
                      <div className="space-y-1.5">
                        {selectedRun.steps.map((step, i) => {
                          const pct = selectedRun.totalTokens > 0 ? Math.round((step.totalTokens / selectedRun.totalTokens) * 100) : 0;
                          return (
                            <div key={step.id} className="flex items-center gap-3">
                              <span className="w-4 shrink-0 text-[10px] text-white/30 text-right">{i + 1}</span>
                              <span className="w-28 shrink-0 truncate text-[11px] text-white/70">{step.agentName}</span>
                              <div className="flex-1 h-1.5 rounded-full bg-white/[0.07]">
                                <div className="h-full rounded-full bg-accent/60" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="w-14 shrink-0 text-right text-[10px] text-white/40">{fmtNum(step.totalTokens)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ERRORS tab */}
              {detailTab === 'errors' && (
                <div className="space-y-4">
                  {!selectedRun.error && !selectedRun.steps.some((s) => s.error) && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <p className="text-3xl mb-2">✅</p>
                      <p className="text-[13px] font-semibold text-emerald-300">No errors</p>
                      <p className="text-[11px] text-white/35 mt-1">This run completed without errors.</p>
                    </div>
                  )}
                  {(selectedRun.error || selectedRun.steps.some((s) => s.error)) && (() => {
                    const err = selectedRun.error ?? selectedRun.steps.find((s) => s.error)?.error!;
                    return (
                      <div className="rounded-[16px] border border-red-400/20 bg-red-400/[0.04] p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">⚠</span>
                          <div>
                            <p className="text-[12px] font-bold text-red-400">Error Trace</p>
                            <p className="text-[10px] text-white/40">Severity: {err.severity}</p>
                          </div>
                        </div>
                        {[
                          ['Failed step', err.failedAgentName],
                          ['Error type', err.errorType],
                          ['Message', err.message],
                          ['Likely cause', err.likelyCause],
                          ['Suggested fix', err.suggestedFix],
                        ].map(([k, v]) => (
                          <div key={k} className="rounded-xl border border-white/[0.06] bg-black/10 px-3 py-2">
                            <p className="text-[9px] uppercase tracking-wide text-white/30">{k}</p>
                            <p className="mt-0.5 text-[12px] text-white/80">{v}</p>
                          </div>
                        ))}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {(() => {
                            const failedStep = selectedRun.steps.find((s) => s.id === err.failedStepId);
                            return failedStep ? (
                              <button onClick={() => setRetryStep(failedStep)}
                                className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-[11px] font-bold text-amber-300 transition hover:bg-amber-400/20">↺ Retry from this step</button>
                            ) : null;
                          })()}
                          <button onClick={() => setDetailTab('timeline')}
                            className="rounded-lg border border-white/[0.1] px-3 py-1.5 text-[11px] font-semibold text-white/60 transition hover:bg-white/[0.06] hover:text-white">View Timeline</button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* OUTPUTS tab */}
              {detailTab === 'outputs' && (
                <div className="space-y-3">
                  <div className="rounded-[14px] border border-white/[0.07] bg-white/[0.03] p-4">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-white/35">Output</p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusCls(selectedRun.status)}`}>{selectedRun.status}</span>
                      <span className="text-[12px] text-white/60">{selectedRun.outputType}</span>
                    </div>
                    <p className="text-[12px] text-white/70">{selectedRun.outputSummary ?? 'No output was generated for this run.'}</p>
                  </div>
                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-white/35">Step outputs</p>
                    <div className="space-y-1.5">
                      {selectedRun.steps.filter((s) => s.outputProduced && s.outputProduced !== 'None').map((step, i) => (
                        <div key={step.id} className="flex items-start gap-3 rounded-[12px] border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                          <span className="shrink-0 text-[10px] font-bold text-white/30 mt-0.5">{i + 1}</span>
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-white/80">{step.agentName}</p>
                            <p className="text-[10px] text-white/45 mt-0.5">{step.outputProduced}</p>
                          </div>
                          <span className={`shrink-0 text-[9px] font-bold ${stepStatusCls(step.status)}`}>{step.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* RAW LOG tab */}
              {detailTab === 'log' && (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-white/35">Raw log (mock)</p>
                    <button onClick={() => exportTxt(selectedRun)} className="rounded-lg border border-white/[0.1] px-3 py-1 text-[11px] font-semibold text-white/60 transition hover:bg-white/[0.06] hover:text-white">Download TXT</button>
                  </div>
                  <pre className="rounded-[14px] border border-white/[0.06] bg-black/20 p-4 text-[10px] text-white/55 overflow-x-auto whitespace-pre-wrap font-mono">
{`[COLONY RUN LOG]
Run ID:     ${selectedRun.id.toUpperCase()}
Workflow:   ${selectedRun.workflowName}
Status:     ${selectedRun.status}
Trigger:    ${selectedRun.triggerType}
Started:    ${selectedRun.startedAt}
Duration:   ${fmtDur(selectedRun.durationSeconds)}
Agents:     ${selectedRun.agentsUsed}
Tokens:     ${fmtNum(selectedRun.totalTokens)} (in: ${fmtNum(selectedRun.inputTokens)}, out: ${fmtNum(selectedRun.outputTokens)})
Credits:    ${selectedRun.creditsUsed}
Cost:       ${fmtCost(selectedRun.estimatedCost)}

[STEP TIMELINE]
${selectedRun.steps.map((s, i) => `Step ${i + 1}: ${s.agentName} [${s.status}]\n  ${s.startedAt}${s.endedAt ? ` → ${s.endedAt}` : ''} | ${fmtDur(s.durationSeconds)} | ${fmtNum(s.totalTokens)} tokens | ${fmtCost(s.estimatedCost)}\n  ${s.summary}${s.error ? `\n  ERROR: ${s.error.message}` : ''}`).join('\n\n')}
${selectedRun.error ? `\n[ERROR]\nFailed at: ${selectedRun.error.failedAgentName}\nType: ${selectedRun.error.errorType}\nMessage: ${selectedRun.error.message}\nCause: ${selectedRun.error.likelyCause}` : ''}

[OUTPUT]
${selectedRun.outputSummary ?? 'No output.'}

Generated by Colony · ${new Date().toLocaleString()}`}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── COMPARE VIEW ── */}
        {view === 'compare' && (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* Run selectors */}
            <div className="shrink-0 grid grid-cols-2 gap-4 border-b border-white/[0.06] px-6 py-3">
              {(['A', 'B'] as const).map((side) => {
                const currId = side === 'A' ? compareAId : compareBId;
                const setter = side === 'A' ? setCompareAId : setCompareBId;
                return (
                  <div key={side}>
                    <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-white/35">Run {side}</p>
                    <select value={currId ?? ''} onChange={(e) => setter(e.target.value || null)}
                      className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-accent/40">
                      <option value="">Select run…</option>
                      {runs.map((r) => <option key={r.id} value={r.id}>Run #{r.runNumber} · {r.status} · {r.startedAt}</option>)}
                    </select>
                  </div>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {(!compareA || !compareB) ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-3xl mb-2">⚖</p>
                  <p className="text-[13px] font-semibold text-white/40">Select two runs to compare</p>
                </div>
              ) : (() => {
                const durDiff = compareA.durationSeconds - compareB.durationSeconds;
                const tokDiff = compareA.totalTokens - compareB.totalTokens;
                const costDiff = compareA.estimatedCost - compareB.estimatedCost;
                const creditDiff = compareA.creditsUsed - compareB.creditsUsed;
                const fmtDiff = (n: number, unit: string, better: 'low' | 'high' = 'low') => {
                  const improved = better === 'low' ? n < 0 : n > 0;
                  const sign = n > 0 ? '+' : '';
                  return <span className={n === 0 ? 'text-white/40' : improved ? 'text-emerald-300' : 'text-red-400'}>{sign}{n} {unit}</span>;
                };
                const rows: Array<[string, string, string, React.ReactNode]> = [
                  ['Status', compareA.status, compareB.status, compareA.status === compareB.status ? <span className="text-white/40">Same</span> : <span className="text-amber-300">Different</span>],
                  ['Duration', fmtDur(compareA.durationSeconds), fmtDur(compareB.durationSeconds), fmtDiff(durDiff, 's')],
                  ['Total tokens', fmtNum(compareA.totalTokens), fmtNum(compareB.totalTokens), fmtDiff(tokDiff, '')],
                  ['Credits', String(compareA.creditsUsed), String(compareB.creditsUsed), fmtDiff(creditDiff, '')],
                  ['Est. cost', fmtCost(compareA.estimatedCost), fmtCost(compareB.estimatedCost), fmtDiff(Math.round((compareA.estimatedCost - compareB.estimatedCost) * 100) / 100, '$')],
                  ['Agents used', String(compareA.agentsUsed), String(compareB.agentsUsed), fmtDiff(compareA.agentsUsed - compareB.agentsUsed, '')],
                  ['Output', compareA.outputType, compareB.outputType, compareA.outputType === compareB.outputType ? <span className="text-white/40">Same</span> : <span className="text-amber-300">Different</span>],
                  ['Error', compareA.error ? compareA.error.failedAgentName : 'None', compareB.error ? compareB.error.failedAgentName : 'None', (!compareA.error && !compareB.error) ? <span className="text-emerald-300">Both clean</span> : (compareA.error && !compareB.error) ? <span className="text-red-400">A failed</span> : (!compareA.error && compareB.error) ? <span className="text-red-400">B failed</span> : <span className="text-red-400">Both failed</span>],
                  ['Approval', compareA.approvalStatus ?? 'None', compareB.approvalStatus ?? 'None', <span className="text-white/40">—</span>],
                ];
                const summaryParts: string[] = [];
                if (durDiff < 0) summaryParts.push(`Run #${compareA.runNumber} was ${fmtDur(Math.abs(durDiff))} faster`);
                if (tokDiff < 0) summaryParts.push(`used ${fmtNum(Math.abs(tokDiff))} fewer tokens`);
                if (costDiff < 0) summaryParts.push(`cost ${fmtCost(Math.abs(costDiff))} less`);
                if (compareA.status === 'Completed' && compareB.status === 'Failed') summaryParts.push('completed successfully where B failed');
                if (compareA.status === 'Failed' && compareB.status === 'Completed') summaryParts.push('failed where B succeeded');
                const summary = summaryParts.length > 0 ? `Run #${compareA.runNumber} ${summaryParts.join(', ')}.` : `Run #${compareA.runNumber} and Run #${compareB.runNumber} performed similarly.`;
                return (
                  <div className="space-y-4">
                    {/* Column headers */}
                    <div className="grid grid-cols-4 gap-2 text-[10px] font-bold uppercase tracking-wide text-white/35 px-2">
                      <span>Metric</span>
                      <span>Run #{compareA.runNumber}</span>
                      <span>Run #{compareB.runNumber}</span>
                      <span>Change</span>
                    </div>
                    <div className="space-y-1.5">
                      {rows.map(([label, a, b, diff]) => (
                        <div key={label} className="grid grid-cols-4 gap-2 items-center rounded-[12px] border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                          <span className="text-[11px] text-white/45">{label}</span>
                          <span className={`text-[11px] font-semibold ${a === 'Failed' ? 'text-red-400' : a === 'Completed' ? 'text-emerald-300' : 'text-white'}`}>{a}</span>
                          <span className={`text-[11px] font-semibold ${b === 'Failed' ? 'text-red-400' : b === 'Completed' ? 'text-emerald-300' : 'text-white'}`}>{b}</span>
                          <span className="text-[11px] font-semibold">{diff}</span>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-[14px] border border-accent/20 bg-accent/[0.05] px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-accent/60 mb-1">Summary</p>
                      <p className="text-[12px] text-white/80">{summary}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between border-t border-white/[0.08] px-6 py-3">
          <p className="text-[11px] text-white/30">{runs.length} total runs</p>
          <button onClick={onClose} className="rounded-[10px] border border-white/[0.1] px-5 py-2 text-[12px] font-semibold text-white/60 transition hover:bg-white/[0.06] hover:text-white">Close</button>
        </div>
      </div>

      {/* ── Retry From Step confirmation modal ── */}
      {retryStep && selectedRun && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setRetryStep(null)}>
          <div className="mx-4 w-full max-w-md rounded-[22px] border border-amber-400/25 bg-[#0e0e1a] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.7)]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-400/15 text-xl">↺</div>
              <div>
                <h3 className="font-heading text-[16px] font-bold text-white">Retry from this step?</h3>
                <p className="text-[11px] text-amber-300/70">This will re-run from {retryStep.agentName}</p>
              </div>
            </div>
            <div className="mb-4 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 space-y-1.5 text-[12px]">
              <div className="flex justify-between"><span className="text-white/45">Retry from step</span><span className="font-semibold text-white">{retryStep.agentName}</span></div>
              <div className="flex justify-between"><span className="text-white/45">Role</span><span className="text-white/70">{retryStep.role}</span></div>
              <div className="flex justify-between"><span className="text-white/45">Previous steps</span><span className="font-semibold text-emerald-300">{selectedRun.steps.findIndex((s) => s.id === retryStep.id)} completed (reused)</span></div>
              <div className="flex justify-between"><span className="text-white/45">Est. credits</span><span className="font-semibold text-white">{selectedRun.creditsUsed - selectedRun.steps.findIndex((s) => s.id === retryStep.id)}</span></div>
            </div>
            <p className="mb-5 text-[12px] leading-relaxed text-white/60">
              Completed steps will be reused. The workflow will re-run from <strong className="text-white">{retryStep.agentName}</strong> and continue until completion or the next approval gate.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setRetryStep(null)}
                className="flex-1 rounded-xl border border-white/[0.12] bg-white/[0.06] py-2.5 text-[12px] font-semibold text-white/80 transition hover:bg-white/[0.1]">Cancel</button>
              <button onClick={() => confirmRetry(retryStep, selectedRun)}
                className="flex-1 rounded-xl bg-amber-500/80 py-2.5 text-[12px] font-bold text-white transition hover:bg-amber-500">↺ Retry from {retryStep.agentName}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



// ── AI Workflow Intelligence Components ───────────────────────────────────────

const AI_BADGE_COLORS = {
  confidence: { High: 'bg-blue-500/15 text-blue-300', Medium: 'bg-amber-500/15 text-amber-300', Low: 'bg-white/[0.08] text-white/45' },
  risk: { Safe: 'bg-green-500/15 text-green-400', Moderate: 'bg-amber-500/15 text-amber-300', 'High Risk': 'bg-red-500/15 text-red-400' },
  impact: { High: 'bg-red-500/15 text-red-400', Medium: 'bg-amber-500/15 text-amber-300', Low: 'bg-white/[0.08] text-white/45' },
  severity: { Critical: 'bg-red-500/15 text-red-400', Error: 'bg-orange-500/15 text-orange-400', Warning: 'bg-amber-500/15 text-amber-300' },
  category: { Performance: 'text-blue-400', Safety: 'text-green-400', Cost: 'text-purple-400', Reliability: 'text-amber-400', Readability: 'text-cyan-400', Structure: 'text-white/60' },
};

export function AICconfidenceBadge({ value }: { value: AIConfidence }) {
  return <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${AI_BADGE_COLORS.confidence[value]}`}>Confidence: {value}</span>;
}

// ── Build Workflow Modal ──────────────────────────────────────────────────────
export function BuildWorkflowModal({
  state, setState, onApply, safetyModeGlobal, setToast,
}: {
  state: BuildWorkflowModalState; setState: React.Dispatch<React.SetStateAction<BuildWorkflowModalState | null>>;
  onApply: (result: AIWorkflowResult) => void; safetyModeGlobal: boolean; setToast: (m: string) => void;
}) {
  const [localState, setLocal] = React.useState(state);
  const PROMPTS = [
    'Review uploaded documents and generate approval-ready summaries.',
    'Analyze customer feedback and create weekly insight reports.',
    'Process spreadsheets, validate data, and export reports.',
    'Onboard new users with approvals, reminders, and notifications.',
    'Monitor incoming data, detect anomalies, and alert the team.',
    'Collect research data, analyze findings, and produce a research brief.',
  ];
  const TYPE_OPTIONS: Array<{ value: AIWorkflowType; label: string; icon: string }> = [
    { value: 'research', label: 'Research', icon: '🔍' },
    { value: 'reporting', label: 'Reporting', icon: '📊' },
    { value: 'data-processing', label: 'Data Processing', icon: '⚙' },
    { value: 'approval', label: 'Approval Workflow', icon: '🛡' },
    { value: 'document', label: 'Document Workflow', icon: '📄' },
    { value: 'automation', label: 'Automation', icon: '⚡' },
    { value: 'support', label: 'Support Workflow', icon: '💬' },
    { value: 'blank', label: 'Blank Smart Workflow', icon: '📝' },
  ];
  const handleGenerate = () => {
    setLocal((prev) => ({ ...prev, generating: true }));
    window.setTimeout(() => {
      const result = mockGenerateWorkflow(localState.prompt, localState.workflowType, localState.complexity, localState.safetyMode);
      setLocal((prev) => ({ ...prev, generating: false, result }));
    }, 1800);
  };
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-[22px] border border-white/[0.1] bg-[#0d0d1c] shadow-[0_28px_90px_rgba(0,0,0,0.7)]" style={{ maxHeight: '92vh' }}>
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-7 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-xl">✨</div>
            <div>
              <h2 className="font-heading text-[17px] font-bold text-white">Create repeatable process</h2>
              <p className="mt-0.5 text-[11px] text-white/45">Describe your goal — Colony AI generates the workflow</p>
            </div>
          </div>
          <button onClick={() => setState(null)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.07] text-white/50 hover:text-white">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!localState.result ? (
            <div className="space-y-5 px-7 py-6">
              {/* Prompt */}
              <div>
                <label className="mb-2 block text-[12px] font-semibold text-white/65">Goal / Prompt</label>
                <textarea
                  value={localState.prompt}
                  onChange={(e) => setLocal((p) => ({ ...p, prompt: e.target.value }))}
                  placeholder="Describe what you want this workflow to do…"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/[0.12] bg-white/[0.05] px-4 py-3 text-[13px] leading-relaxed text-white outline-none placeholder:text-white/30 focus:border-purple-500/50"
                />
                {/* Example prompts */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {PROMPTS.slice(0, 3).map((p, i) => (
                    <button key={i} onClick={() => setLocal((prev) => ({ ...prev, prompt: p }))} className="rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 text-[10px] text-white/50 transition hover:border-white/25 hover:text-white/80">
                      {p.slice(0, 42)}…
                    </button>
                  ))}
                </div>
              </div>

              {/* Type + Complexity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-[12px] font-semibold text-white/65">Workflow Type</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {TYPE_OPTIONS.map((t) => (
                      <button key={t.value} onClick={() => setLocal((p) => ({ ...p, workflowType: t.value }))}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-[11px] font-semibold transition ${localState.workflowType === t.value ? 'bg-purple-500/20 text-purple-200 ring-1 ring-purple-500/40' : 'border border-white/[0.08] text-white/55 hover:bg-white/[0.06] hover:text-white/80'}`}>
                        <span>{t.icon}</span><span>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="mb-2 block text-[12px] font-semibold text-white/65">Complexity</label>
                    <div className="flex gap-2">
                      {(['Simple', 'Medium', 'Advanced'] as const).map((c) => (
                        <button key={c} onClick={() => setLocal((p) => ({ ...p, complexity: c }))}
                          className={`flex-1 rounded-lg py-2 text-[11px] font-semibold transition ${localState.complexity === c ? 'bg-white/15 text-white' : 'border border-white/[0.1] text-white/45 hover:bg-white/[0.06]'}`}>{c}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-[12px] font-semibold text-white/65">Output</label>
                    <div className="flex gap-2">
                      {(['Minimal', 'Balanced', 'Detailed'] as const).map((o) => (
                        <button key={o} onClick={() => setLocal((p) => ({ ...p, outputPreference: o }))}
                          className={`flex-1 rounded-lg py-2 text-[11px] font-semibold transition ${localState.outputPreference === o ? 'bg-white/15 text-white' : 'border border-white/[0.1] text-white/45 hover:bg-white/[0.06]'}`}>{o}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-[12px] font-semibold text-white/65">Industry / Use Case (optional)</label>
                    <input value={localState.industry} onChange={(e) => setLocal((p) => ({ ...p, industry: e.target.value }))} placeholder="e.g. Finance, HR, Operations…" className="w-full rounded-lg border border-white/[0.12] bg-white/[0.05] px-3 py-2 text-[11px] text-white outline-none placeholder:text-white/30" />
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.04] px-3 py-2.5 text-[11px] text-white/70">
                    <input type="checkbox" checked={localState.safetyMode} onChange={(e) => setLocal((p) => ({ ...p, safetyMode: e.target.checked }))} className="accent-purple-500" />
                    Enable Safety Mode (add Approval Gate)
                  </label>
                </div>
              </div>

              {localState.generating && (
                <div className="flex items-center gap-4 rounded-xl border border-purple-500/25 bg-purple-500/[0.06] px-5 py-4">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-400/30 border-t-purple-400" />
                  <div>
                    <p className="text-[13px] font-semibold text-purple-200">AI is designing your workflow…</p>
                    <p className="text-[10px] text-purple-300/60">Generating agents, connections, and configurations</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Result preview */
            <div className="space-y-4 px-7 py-6">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-lg">✨</div>
                <div>
                  <p className="text-[15px] font-bold text-white">{localState.result.title}</p>
                  <p className="mt-0.5 text-[11px] text-white/50">{localState.result.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <AICconfidenceBadge value={localState.result.confidence} />
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${AI_BADGE_COLORS.risk[localState.result.risk]}`}>{localState.result.risk}</span>
                    <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[9px] font-bold text-white/50">{localState.result.estimatedComplexity}</span>
                    <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[9px] font-bold text-purple-300">~{localState.result.estimatedCostPerRun}</span>
                    <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[9px] font-bold text-white/50">~{localState.result.estimatedRuntimeSeconds}s</span>
                  </div>
                </div>
              </div>

              {/* Agent list */}
              <div className="rounded-[14px] border border-white/[0.08] bg-white/[0.03] p-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/40">Generated Agents ({localState.result.agents.length})</p>
                <div className="space-y-2">
                  {localState.result.agents.map((a, i) => (
                    <div key={a.id} className="flex items-center gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.08] text-base">{a.icon}</div>
                      <div className="flex-1">
                        <span className="text-[12px] font-semibold text-white">{a.label}</span>
                        <span className="ml-2 text-[10px] text-white/40">{a.role}</span>
                      </div>
                      <span className={`text-[9px] font-bold ${a.model === 'Fast' ? 'text-green-400' : a.model === 'Accurate' ? 'text-blue-400' : 'text-white/40'}`}>{a.model}</span>
                      {i < localState.result!.agents.length - 1 && <span className="text-[10px] text-white/25">→</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                  <p className="text-white/40">Trigger</p><p className="mt-0.5 font-semibold text-white/80">{localState.result.suggestedTrigger}</p>
                </div>
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                  <p className="text-white/40">Output</p><p className="mt-0.5 font-semibold text-white/80">{localState.result.suggestedOutput}</p>
                </div>
              </div>

              {/* Recommendations */}
              {localState.result.recommendations.length > 0 && (
                <div className="rounded-[14px] border border-amber-500/15 bg-amber-500/[0.04] px-4 py-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-amber-400/70">Recommendations</p>
                  {localState.result.recommendations.map((r, i) => <p key={i} className="text-[11px] text-white/65">• {r}</p>)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-white/[0.08] px-7 py-4">
          <div className="flex items-center gap-2">
            {localState.result && (
              <button onClick={() => setLocal((p) => ({ ...p, result: null, generating: false }))} className="rounded-lg border border-white/[0.1] px-3 py-2 text-[11px] font-semibold text-white/55 hover:bg-white/[0.06] hover:text-white">↩ Regenerate</button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setState(null)} className="rounded-lg border border-white/[0.1] px-4 py-2 text-[11px] font-semibold text-white/55 hover:bg-white/[0.06] hover:text-white">Cancel</button>
            {!localState.result
              ? <button onClick={handleGenerate} disabled={localState.generating} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-2 text-[11px] font-bold text-white transition hover:from-purple-500 hover:to-blue-500 disabled:opacity-50">
                  {localState.generating ? <><span className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" /> Generating…</> : '✨ Generate Workflow'}
                </button>
              : <button onClick={() => { onApply(localState.result!); setState(null); }} className="rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-2 text-[11px] font-bold text-white transition hover:from-purple-500 hover:to-blue-500">
                  Apply to Canvas
                </button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ── AI Suggestions Panel ──────────────────────────────────────────────────────
export function AISuggestionsPanel({
  suggestions, onApply, onIgnore, onClose, onRegenerate,
}: {
  suggestions: WorkflowSuggestion[]; onApply: (id: string) => void;
  onIgnore: (id: string) => void; onClose: () => void; onRegenerate: () => void;
}) {
  const catIcon: Record<SuggestionCategory, string> = { Performance: '⚡', Safety: '🛡', Cost: '💰', Reliability: '🔒', Readability: '👁', Structure: '🏗' };
  return (
    <div className="fixed bottom-6 right-6 z-[115] flex w-80 flex-col overflow-hidden rounded-[18px] border border-white/[0.1] bg-[#0d0d1c] shadow-[0_20px_60px_rgba(0,0,0,0.6)]" style={{ maxHeight: '70vh' }}>
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-base">✨</span>
          <p className="text-[13px] font-bold text-white">AI Suggestions</p>
          <span className="rounded-full bg-purple-500/20 px-1.5 py-0.5 text-[9px] font-bold text-purple-300">{suggestions.filter((s) => !s.applied).length}</span>
        </div>
        <button onClick={onClose} className="text-[11px] text-white/35 hover:text-white/70">✕</button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {suggestions.map((s) => (
          <div key={s.id} className={`rounded-[12px] border px-3.5 py-3 transition ${s.applied ? 'border-green-500/20 bg-green-500/[0.04] opacity-60' : 'border-white/[0.08] bg-white/[0.03]'}`}>
            <div className="mb-1.5 flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[10px] font-bold ${AI_BADGE_COLORS.category[s.category]}`}>{catIcon[s.category]} {s.category}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${AI_BADGE_COLORS.impact[s.impact]}`}>{s.impact} impact</span>
                  {s.applied && <span className="rounded-full bg-green-500/20 px-1.5 py-0.5 text-[8px] font-bold text-green-400">Applied</span>}
                </div>
                <p className="mt-1 text-[11px] font-semibold text-white leading-snug">{s.title}</p>
              </div>
            </div>
            <p className="mb-2 text-[10px] leading-relaxed text-white/55">{s.explanation}</p>
            {!s.applied && (
              <div className="flex gap-1.5">
                <button onClick={() => onApply(s.id)} className="flex-1 rounded-lg bg-white/10 py-1.5 text-[10px] font-bold text-white transition hover:bg-white/20">Apply</button>
                <button onClick={() => onIgnore(s.id)} className="rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-[10px] text-white/40 transition hover:bg-white/[0.06] hover:text-white/70">Ignore</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="shrink-0 border-t border-white/[0.06] px-3 py-2.5">
        <button onClick={onRegenerate} className="w-full rounded-lg border border-white/[0.1] py-2 text-[11px] font-semibold text-white/55 transition hover:bg-white/[0.06] hover:text-white">↻ Regenerate Suggestions</button>
      </div>
    </div>
  );
}

// ── Improve Workflow Modal ────────────────────────────────────────────────────
export function ImproveWorkflowModal({
  state, onApply, onIgnore, onClose,
}: {
  state: ImproveWorkflowState; onApply: (id: string) => void;
  onIgnore: (id: string) => void; onClose: () => void;
}) {
  const catIcon: Record<SuggestionCategory, string> = { Performance: '⚡', Safety: '🛡', Cost: '💰', Reliability: '🔒', Readability: '👁', Structure: '🏗' };
  const [filter, setFilter] = React.useState<SuggestionCategory | 'All'>('All');
  const filtered = state.suggestions.filter((s) => filter === 'All' || s.category === filter);
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="flex h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-[20px] border border-white/[0.1] bg-[#0f0f1a] shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 text-lg">⬆</div>
            <div>
              <h2 className="font-heading text-[15px] font-bold text-white">Workflow Improvement</h2>
              <p className="text-[11px] text-white/40">{state.suggestions.filter((s) => !s.applied).length} suggestions available</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.07] text-white/50 hover:text-white">✕</button>
        </div>
        {/* Category filter */}
        <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/[0.06] px-6 py-2.5">
          {(['All', 'Performance', 'Safety', 'Cost', 'Reliability', 'Readability', 'Structure'] as const).map((cat) => (
            <button key={cat} onClick={() => setFilter(cat)} className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-semibold transition ${filter === cat ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'}`}>
              {cat !== 'All' ? `${catIcon[cat as SuggestionCategory]} ` : ''}{cat}
            </button>
          ))}
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
          {state.analyzing && (
            <div className="flex items-center gap-4 rounded-xl border border-blue-500/20 bg-blue-500/[0.06] px-5 py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-400/30 border-t-blue-400" />
              <p className="text-[13px] font-semibold text-blue-200">Analyzing workflow…</p>
            </div>
          )}
          {filtered.length === 0 && !state.analyzing && <p className="py-12 text-center text-[13px] text-white/35">No suggestions in this category.</p>}
          {filtered.map((s) => (
            <div key={s.id} className={`rounded-[14px] border px-5 py-4 ${s.applied ? 'border-green-500/20 bg-green-500/[0.04] opacity-55' : 'border-white/[0.08] bg-white/[0.03]'}`}>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className={`text-[11px] font-bold ${AI_BADGE_COLORS.category[s.category]}`}>{catIcon[s.category]} {s.category}</span>
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${AI_BADGE_COLORS.impact[s.impact]}`}>{s.impact} impact</span>
                <AICconfidenceBadge value={s.confidence} />
                {s.applied && <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[9px] font-bold text-green-400">✓ Applied</span>}
              </div>
              <p className="text-[13px] font-semibold text-white">{s.title}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-white/55">{s.explanation}</p>
              {!s.applied && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => onApply(s.id)} className="flex-1 rounded-lg bg-white/10 py-2 text-[11px] font-bold text-white transition hover:bg-white/20">Apply Improvement</button>
                  <button onClick={() => onIgnore(s.id)} className="rounded-lg border border-white/[0.1] px-3 py-2 text-[11px] text-white/40 transition hover:bg-white/[0.06] hover:text-white/70">Ignore</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Explain Workflow Modal ────────────────────────────────────────────────────
export function ExplainWorkflowModal({
  state, onChangeMode, onClose, setToast,
}: {
  state: ExplainWorkflowState; onChangeMode: (m: ExplanationMode) => void;
  onClose: () => void; setToast: (m: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="flex h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-[20px] border border-white/[0.1] bg-[#0f0f1a] shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-lg">💬</div>
            <div>
              <h2 className="font-heading text-[15px] font-bold text-white">Workflow Explanation</h2>
              <p className="text-[11px] text-white/40">AI-generated explanation of your workflow</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.07] text-white/50 hover:text-white">✕</button>
        </div>
        {/* Mode selector */}
        <div className="flex shrink-0 gap-1 border-b border-white/[0.06] px-6 py-2.5">
          {(['Simple', 'Technical', 'Executive'] as const).map((m) => (
            <button key={m} onClick={() => onChangeMode(m)} className={`rounded-full px-4 py-1.5 text-[11px] font-semibold transition ${state.mode === m ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'}`}>{m}</button>
          ))}
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {state.generating ? (
            <div className="flex items-center gap-4 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.06] px-5 py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
              <p className="text-[13px] font-semibold text-cyan-200">Generating explanation…</p>
            </div>
          ) : (
            <>
              <div className="rounded-[14px] border border-white/[0.08] bg-white/[0.03] px-5 py-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/40">Workflow Summary</p>
                <p className="text-[13px] leading-relaxed text-white/85">{state.explanation}</p>
              </div>
              <div className="rounded-[14px] border border-white/[0.08] bg-white/[0.03] px-5 py-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/40">Step-by-step</p>
                <div className="space-y-2">
                  {state.steps.map((step, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[10px] font-bold text-white/50">{i + 1}</div>
                      <p className="text-[12px] leading-relaxed text-white/70" dangerouslySetInnerHTML={{ __html: step.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white/90">$1</strong>') }} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[12px] border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/40">Inputs</p>
                  <p className="text-[11px] text-white/65">{state.inputs}</p>
                </div>
                <div className="rounded-[12px] border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/40">Outputs</p>
                  <p className="text-[11px] text-white/65">{state.outputs}</p>
                </div>
              </div>
              <div className={`rounded-[12px] border px-4 py-3 ${state.risks.startsWith('Low') ? 'border-green-500/20 bg-green-500/[0.04]' : 'border-amber-500/20 bg-amber-500/[0.04]'}`}>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/40">Risks</p>
                <p className="text-[11px] text-white/65">{state.risks}</p>
              </div>
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2 border-t border-white/[0.08] px-6 py-4">
          <button onClick={() => { navigator.clipboard?.writeText(`${state.explanation}\n\n${state.steps.join('\n')}`); setToast('Explanation copied'); }} className="rounded-lg border border-white/[0.1] px-3 py-2 text-[11px] font-semibold text-white/55 hover:bg-white/[0.06] hover:text-white">Copy</button>
          <button onClick={onClose} className="ml-auto rounded-lg border border-white/[0.1] px-4 py-2 text-[11px] font-semibold text-white/55 hover:bg-white/[0.06] hover:text-white">Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Debug Workflow Modal ──────────────────────────────────────────────────────
export function DebugWorkflowModal({
  state, onFix, onClose, setToast,
}: {
  state: DebugWorkflowState; onFix: (id: string) => void;
  onClose: () => void; setToast: (m: string) => void;
}) {
  const [filter, setFilter] = React.useState<DebugSeverity | 'All'>('All');
  const filtered = state.issues.filter((iss) => filter === 'All' || iss.severity === filter);
  const errors = state.issues.filter((i) => i.severity === 'Error' || i.severity === 'Critical').length;
  const warnings = state.issues.filter((i) => i.severity === 'Warning').length;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="flex h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-[20px] border border-white/[0.1] bg-[#0f0f1a] shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/15 text-lg">🐛</div>
            <div>
              <h2 className="font-heading text-[15px] font-bold text-white">Workflow Debugger</h2>
              <div className="mt-1 flex items-center gap-2">
                {errors > 0 && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[9px] font-bold text-red-400">{errors} error{errors > 1 ? 's' : ''}</span>}
                {warnings > 0 && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold text-amber-400">{warnings} warning{warnings > 1 ? 's' : ''}</span>}
                {errors === 0 && warnings === 0 && !state.analyzing && <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[9px] font-bold text-green-400">All clear</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.07] text-white/50 hover:text-white">✕</button>
        </div>
        <div className="flex shrink-0 gap-1 border-b border-white/[0.06] px-6 py-2.5">
          {(['All', 'Critical', 'Error', 'Warning'] as const).map((sev) => (
            <button key={sev} onClick={() => setFilter(sev)} className={`rounded-full px-3 py-1 text-[10px] font-semibold transition ${filter === sev ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'}`}>{sev}</button>
          ))}
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
          {state.analyzing && (
            <div className="flex items-center gap-4 rounded-xl border border-red-500/20 bg-red-500/[0.05] px-5 py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-400/30 border-t-red-400" />
              <p className="text-[13px] font-semibold text-red-200">Scanning workflow for issues…</p>
            </div>
          )}
          {filtered.map((iss) => (
            <div key={iss.id} className={`rounded-[14px] border px-5 py-4 ${iss.fixed ? 'border-green-500/20 bg-green-500/[0.04] opacity-55' : iss.severity === 'Critical' ? 'border-red-500/25 bg-red-500/[0.05]' : iss.severity === 'Error' ? 'border-orange-500/20 bg-orange-500/[0.04]' : 'border-amber-500/15 bg-amber-500/[0.03]'}`}>
              <div className="mb-2 flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${AI_BADGE_COLORS.severity[iss.severity]}`}>{iss.severity}</span>
                <span className="text-[10px] text-white/40">Agent: {iss.affectedAgent}</span>
                {iss.fixed && <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[9px] font-bold text-green-400">✓ Fixed</span>}
                {iss.autoFixAvailable && !iss.fixed && <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[9px] font-bold text-green-400/70">Auto-fix available</span>}
              </div>
              <p className="text-[13px] font-semibold text-white">{iss.title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-white/55">{iss.explanation}</p>
              <div className="mt-2 rounded-lg bg-white/[0.04] px-3 py-2">
                <p className="text-[10px] font-semibold text-white/40">Suggested fix</p>
                <p className="text-[11px] text-white/65">{iss.suggestedFix}</p>
              </div>
              {!iss.fixed && iss.autoFixAvailable && (
                <button onClick={() => { onFix(iss.id); setToast('Workflow issue fixed.'); }} className="mt-2.5 w-full rounded-lg bg-green-500/80 py-2 text-[11px] font-bold text-white transition hover:bg-green-500">⚡ Fix Automatically</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Workflow Quality Score Modal ──────────────────────────────────────────────
export function WorkflowQualityModal({ score, onClose }: { score: WorkflowQualityScore; onClose: () => void }) {
  const gradeColors = { A: 'text-green-400', B: 'text-blue-400', C: 'text-amber-400', D: 'text-orange-400', F: 'text-red-400' };
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-[20px] border border-white/[0.1] bg-[#0f0f1a] shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-500/15 text-lg">⭐</div>
            <h2 className="font-heading text-[15px] font-bold text-white">Workflow Quality Score</h2>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.07] text-white/50 hover:text-white">✕</button>
        </div>
        <div className="px-6 py-6">
          {/* Overall score */}
          <div className="mb-6 flex items-center gap-6">
            <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-2xl border border-white/[0.1] bg-white/[0.04]">
              <span className={`text-[32px] font-black ${gradeColors[score.grade]}`}>{score.grade}</span>
              <span className="text-[11px] font-bold text-white/40">{score.overall}/100</span>
            </div>
            <div>
              <p className="text-[14px] font-semibold text-white">Overall: {score.overall}/100</p>
              <p className="mt-1 text-[12px] text-white/55">{score.summary}</p>
            </div>
          </div>
          {/* Dimension bars */}
          <div className="space-y-3">
            {score.dimensions.map((dim) => (
              <div key={dim.label}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-white/75">{dim.label}</span>
                  <span className={`text-[12px] font-bold ${dim.score >= 80 ? 'text-green-400' : dim.score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{dim.score}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
                  <div className={`h-full rounded-full transition-all duration-700 ${dim.score >= 80 ? 'bg-green-500' : dim.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${dim.score}%` }} />
                </div>
                <p className="mt-0.5 text-[10px] text-white/35">{dim.suggestion}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end border-t border-white/[0.08] px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-white/[0.1] px-4 py-2 text-[11px] font-semibold text-white/55 hover:bg-white/[0.06] hover:text-white">Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Generate Agent Instructions Modal ────────────────────────────────────────
export function GenerateInstructionsModal({
  state, onInsert, onRegenerate, onClose, setToast,
}: {
  state: GenerateInstructionsState; onInsert: (agentId: string, result: AgentInstructionResult) => void;
  onRegenerate: (quality: InstructionQuality) => void; onClose: () => void; setToast: (m: string) => void;
}) {
  const r = state.result;
  return (
    <div className="fixed inset-0 z-[125] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="flex h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-[20px] border border-white/[0.1] bg-[#0f0f1a] shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-6 py-4">
          <div>
            <h2 className="font-heading text-[15px] font-bold text-white">✨ Generate Agent Instructions</h2>
            <p className="mt-0.5 text-[11px] text-white/40">AI-generated instructions for "{state.agentName}"</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.07] text-white/50 hover:text-white">✕</button>
        </div>
        {/* Quality selector */}
        <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.06] px-6 py-3">
          <span className="text-[11px] text-white/40">Quality:</span>
          {(['Basic', 'Balanced', 'Detailed'] as const).map((q) => (
            <button key={q} onClick={() => onRegenerate(q)} className={`rounded-full px-3 py-1 text-[10px] font-semibold transition ${state.quality === q ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'}`}>{q}</button>
          ))}
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {state.generating ? (
            <div className="flex items-center gap-4 rounded-xl border border-purple-500/20 bg-purple-500/[0.06] px-5 py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-400/30 border-t-purple-400" />
              <p className="text-[13px] font-semibold text-purple-200">Generating instructions…</p>
            </div>
          ) : r ? (
            <>
              {([
                ['Role', r.role],
                ['Instructions', r.instruction],
                ['Goals', r.goals],
                ['Constraints', r.constraints],
                ['Expected Output', r.expectedOutput],
                ['Tone', r.tone],
                ['Tool Guidance', r.toolGuidance],
              ] as const).map(([label, content]) => (
                <div key={label} className="rounded-[12px] border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-white/40">{label}</p>
                  <p className="whitespace-pre-line text-[12px] leading-relaxed text-white/75">{content}</p>
                </div>
              ))}
            </>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-white/[0.08] px-6 py-4">
          {r && (
            <>
              <button onClick={() => { navigator.clipboard?.writeText(r.instruction); setToast('Instructions copied'); }} className="rounded-lg border border-white/[0.1] px-3 py-1.5 text-[11px] font-semibold text-white/55 hover:bg-white/[0.06] hover:text-white">Copy</button>
              <button onClick={() => onRegenerate(state.quality)} className="rounded-lg border border-white/[0.1] px-3 py-1.5 text-[11px] font-semibold text-white/55 hover:bg-white/[0.06] hover:text-white">↻ Regenerate</button>
              <button onClick={() => onInsert(state.agentId, r)} className="ml-auto rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-1.5 text-[11px] font-bold text-white transition hover:from-purple-500 hover:to-blue-500">Insert Instructions</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
// ── AuditLogModal ─────────────────────────────────────────────────────────────

// ── Report Components ─────────────────────────────────────────────────────────

const REPORT_STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-white/[0.08] text-white/55',
  Edited: 'bg-blue-500/15 text-blue-300',
  Approved: 'bg-green-500/15 text-green-400',
  Final: 'bg-purple-500/15 text-purple-300',
  'Waiting Approval': 'bg-amber-500/15 text-amber-300',
  Archived: 'bg-white/[0.06] text-white/30',
};

export function ReportStatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${REPORT_STATUS_COLORS[status] ?? 'bg-white/[0.08] text-white/55'}`}>
      {status}
    </span>
  );
}

// ── Report List Modal ─────────────────────────────────────────────────────────
export function ReportListModal({
  reports, onClose, onPreview, onSchedule,
}: {
  reports: Report[]; onClose: () => void;
  onPreview: (id: string) => void; onSchedule: () => void;
}) {
  const [filter, setFilter] = React.useState<'All' | ReportStatus>('All');
  const [search, setSearch] = React.useState('');
  const filtered = reports.filter((r) =>
    (filter === 'All' || r.status === filter) &&
    (!search || r.title.toLowerCase().includes(search.toLowerCase()) || r.workflowName.toLowerCase().includes(search.toLowerCase()))
  );
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-[20px] border border-white/[0.1] bg-[#0f0f1a] shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-6 py-4">
          <div>
            <h2 className="font-heading text-[17px] font-bold text-white">📑 Reports</h2>
            <p className="mt-0.5 text-[12px] text-white/45">{reports.length} total reports</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onSchedule} className="rounded-lg border border-white/[0.12] bg-white/[0.06] px-3 py-1.5 text-[11px] font-semibold text-white/70 transition hover:bg-white/[0.1] hover:text-white">🗓 Schedule</button>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.07] text-white/50 hover:text-white">✕</button>
          </div>
        </div>
        {/* Filters */}
        <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.06] px-6 py-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reports…" className="flex-1 rounded-lg border border-white/[0.1] bg-white/[0.05] px-3 py-1.5 text-[12px] text-white outline-none placeholder:text-white/30" />
          {(['All', 'Draft', 'Edited', 'Approved', 'Final', 'Waiting Approval'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition ${filter === f ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'}`}>{f}</button>
          ))}
        </div>
        {/* List */}
        <div className="flex-1 space-y-2 overflow-y-auto px-6 py-4">
          {filtered.length === 0 && <p className="py-12 text-center text-[13px] text-white/35">No reports found.</p>}
          {filtered.map((r) => (
            <div key={r.id} className="flex items-center gap-4 rounded-[14px] border border-white/[0.07] bg-white/[0.03] px-5 py-4 transition hover:bg-white/[0.06]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-xl">
                {REPORT_TEMPLATES.find((t) => t.id === r.template)?.icon ?? '📄'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[13px] font-semibold text-white">{r.title}</p>
                  <ReportStatusBadge status={r.status} />
                  <span className="text-[10px] text-white/35">v{r.version}</span>
                </div>
                <p className="mt-0.5 text-[11px] text-white/45">{r.templateName} · {r.workflowName} · {r.createdAt}</p>
                <div className="mt-1 flex items-center gap-2">
                  {r.tags?.map((tag) => <span key={tag} className="rounded bg-white/[0.07] px-1.5 py-0.5 text-[9px] text-white/45">{tag}</span>)}
                </div>
              </div>
              <button onClick={() => onPreview(r.id)} className="shrink-0 rounded-lg bg-white/[0.09] px-3 py-1.5 text-[11px] font-semibold text-white/80 transition hover:bg-white/[0.16] hover:text-white">Preview</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Report Preview Modal ──────────────────────────────────────────────────────
export function ReportPreviewModal({
  report, onClose, onEdit, onExport, onSaveVersion, onSchedule,
}: {
  report: Report; onClose: () => void;
  onEdit: (id: string) => void; onExport: (id: string, fmt: ExportModalState['format']) => void;
  onSaveVersion: (id: string) => void; onSchedule: (id: string) => void;
}) {
  const [tab, setTab] = React.useState<'preview' | 'versions' | 'exports'>('preview');
  const template = REPORT_TEMPLATES.find((t) => t.id === report.template);
  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center bg-black/65 p-4 pt-12 backdrop-blur-sm">
      <div className="flex w-full max-w-3xl flex-col overflow-hidden rounded-[20px] border border-white/[0.1] bg-[#0f0f1a] shadow-[0_24px_80px_rgba(0,0,0,0.65)]" style={{ maxHeight: '88vh' }}>
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-white/[0.08] px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-2xl">{template?.icon ?? '📄'}</div>
            <div>
              <h2 className="font-heading text-[16px] font-bold leading-tight text-white">{report.title}</h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-white/45">
                <ReportStatusBadge status={report.status} />
                <span>v{report.version}</span>
                <span>·</span>
                <span>{report.templateName}</span>
                <span>·</span>
                <span>{report.workflowName}</span>
                <span>·</span>
                <span>Generated {report.createdAt}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-white/35">
                <span>By:</span>
                {report.generatedBy.map((a) => <span key={a} className="rounded bg-white/[0.07] px-1.5 py-0.5 font-semibold text-white/55">{a}</span>)}
                {report.approvalRequired && (
                  <span className={`ml-1 rounded px-1.5 py-0.5 font-bold ${report.approvalStatus === 'Approved' ? 'bg-green-500/15 text-green-400' : report.approvalStatus === 'Pending' ? 'bg-amber-500/15 text-amber-400' : 'bg-white/[0.07] text-white/40'}`}>
                    {report.approvalStatus === 'Approved' ? '✓ Approved' : report.approvalStatus === 'Pending' ? '⏳ Pending Approval' : 'Approval: None'}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.07] text-white/50 hover:text-white">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex shrink-0 gap-1 border-b border-white/[0.06] px-6 pt-3">
          {(['preview', 'versions', 'exports'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`pb-2.5 pr-4 text-[12px] font-semibold capitalize transition ${tab === t ? 'border-b-2 border-white text-white' : 'text-white/40 hover:text-white/70'}`}>{t}</button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === 'preview' && (
            <div className="space-y-5">
              {report.sections.filter((s) => s.enabled).map((sec) => (
                <div key={sec.id} className="rounded-[14px] border border-white/[0.07] bg-white/[0.03] px-5 py-4">
                  <h3 className="mb-2.5 text-[12px] font-bold uppercase tracking-widest text-white/50">{sec.title}</h3>
                  {sec.type === 'metrics' ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {sec.content.split('|').map((m, i) => (
                        <div key={i} className="rounded-xl bg-white/[0.06] px-4 py-3">
                          <p className="text-[11px] text-white/45">{m.split(':')[0]?.trim()}</p>
                          <p className="mt-0.5 text-[14px] font-bold text-white">{m.split(':')[1]?.trim() ?? '—'}</p>
                        </div>
                      ))}
                    </div>
                  ) : sec.type === 'table' ? (
                    <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
                      <table className="w-full text-[11px]">
                        <thead><tr className="border-b border-white/[0.08] bg-white/[0.05]"><th className="px-3 py-2 text-left text-white/50">Field</th><th className="px-3 py-2 text-left text-white/50">Value</th><th className="px-3 py-2 text-left text-white/50">Status</th></tr></thead>
                        <tbody>
                          {[['customer_id missing', '4 records', 'Warning'], ['Format inconsistency', '7 entries', 'Warning'], ['Duplicates removed', '3 records', 'Resolved'], ['Timestamp errors', 'Batch upload', 'Warning'], ['External output blocked', '1 action', 'Blocked']].map(([f, v, s], i) => (
                            <tr key={i} className="border-b border-white/[0.05]">
                              <td className="px-3 py-2 text-white/70">{f}</td>
                              <td className="px-3 py-2 text-white/55">{v}</td>
                              <td className="px-3 py-2"><span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${s === 'Resolved' ? 'bg-green-500/15 text-green-400' : s === 'Blocked' ? 'bg-blue-500/15 text-blue-400' : 'bg-amber-500/15 text-amber-400'}`}>{s}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : sec.type === 'timeline' ? (
                    <div className="space-y-2">
                      {report.generatedBy.map((agent, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-[10px] font-bold text-accent">{i + 1}</div>
                          <div className="h-px flex-1 bg-white/[0.08]" />
                          <span className="shrink-0 text-[11px] text-white/55">{agent}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="whitespace-pre-line text-[12.5px] leading-relaxed text-white/75">{sec.content || <span className="italic text-white/30">No content yet.</span>}</p>
                  )}
                </div>
              ))}
              {template?.supportsCharts && (
                <div className="rounded-[14px] border border-dashed border-white/[0.1] bg-white/[0.02] px-5 py-8 text-center">
                  <p className="text-[12px] text-white/35">📊 Chart placeholder — visual rendering requires chart library integration</p>
                  <p className="mt-1 text-[10px] text-white/25">TODO: Integrate recharts or chart.js for real chart output</p>
                </div>
              )}
            </div>
          )}

          {tab === 'versions' && (
            <div className="space-y-3">
              {report.versions.slice().reverse().map((v) => (
                <div key={v.id} className={`flex items-start gap-4 rounded-[14px] border px-5 py-4 ${v.id === report.currentVersionId ? 'border-accent/30 bg-accent/[0.04]' : 'border-white/[0.07] bg-white/[0.02]'}`}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[11px] font-bold text-white">v{v.version}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-white">Version {v.version}</span>
                      <ReportStatusBadge status={v.status} />
                      {v.id === report.currentVersionId && <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[9px] font-bold text-accent">Current</span>}
                    </div>
                    <p className="mt-0.5 text-[11px] text-white/45">{v.editedBy} · {v.editedAt}</p>
                    <p className="mt-1 text-[11px] text-white/65">{v.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'exports' && (
            <div className="space-y-3">
              {report.exports.length === 0 && <p className="py-8 text-center text-[13px] text-white/35">No exports yet.</p>}
              {report.exports.map((exp) => (
                <div key={exp.id} className="flex items-center gap-4 rounded-[14px] border border-white/[0.07] bg-white/[0.03] px-5 py-3.5">
                  <span className="text-xl">{exp.format === 'pdf' ? '📄' : exp.format === 'csv' ? '📊' : exp.format === 'email' ? '✉' : exp.format === 'sheets' ? '📋' : '💬'}</span>
                  <div className="flex-1">
                    <p className="text-[12px] font-semibold text-white">{exp.format.toUpperCase()} export</p>
                    <p className="text-[10px] text-white/45">{exp.exportedBy} · {exp.exportedAt}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-white/[0.08] px-6 py-4">
          <button onClick={() => onEdit(report.id)} className="rounded-lg border border-white/[0.12] bg-white/[0.07] px-3.5 py-2 text-[11px] font-semibold text-white/80 transition hover:bg-white/[0.12] hover:text-white">✏ Edit</button>
          <button onClick={() => onExport(report.id, 'pdf')} className="rounded-lg border border-white/[0.12] bg-white/[0.07] px-3.5 py-2 text-[11px] font-semibold text-white/80 transition hover:bg-white/[0.12] hover:text-white">📄 PDF</button>
          <button onClick={() => onExport(report.id, 'csv')} className="rounded-lg border border-white/[0.12] bg-white/[0.07] px-3.5 py-2 text-[11px] font-semibold text-white/80 transition hover:bg-white/[0.12] hover:text-white">📊 CSV</button>
          <button onClick={() => onExport(report.id, 'sheets')} className="rounded-lg border border-white/[0.12] bg-white/[0.07] px-3.5 py-2 text-[11px] font-semibold text-white/80 transition hover:bg-white/[0.12] hover:text-white">📋 Sheets</button>
          <button onClick={() => onExport(report.id, 'email')} className="rounded-lg border border-white/[0.12] bg-white/[0.07] px-3.5 py-2 text-[11px] font-semibold text-white/80 transition hover:bg-white/[0.12] hover:text-white">✉ Email Draft</button>
          <button onClick={() => onExport(report.id, 'line')} className="rounded-lg border border-white/[0.12] bg-white/[0.07] px-3.5 py-2 text-[11px] font-semibold text-white/80 transition hover:bg-white/[0.12] hover:text-white">💬 LINE</button>
          <button onClick={() => onSaveVersion(report.id)} className="rounded-lg border border-white/[0.12] bg-white/[0.07] px-3.5 py-2 text-[11px] font-semibold text-white/80 transition hover:bg-white/[0.12] hover:text-white">💾 Save Version</button>
          <button onClick={() => onSchedule(report.id)} className="ml-auto rounded-lg border border-accent/30 bg-accent/10 px-3.5 py-2 text-[11px] font-semibold text-accent transition hover:bg-accent/20">🗓 Schedule</button>
        </div>
      </div>
    </div>
  );
}

// ── Report Editor Modal ───────────────────────────────────────────────────────
export function ReportEditorModal({
  report, onClose, onSave, setToast,
}: {
  report: Report; onClose: () => void;
  onSave: (id: string, sections: ReportSection[], title: string) => void;
  setToast: (msg: string) => void;
}) {
  const [title, setTitle] = React.useState(report.title);
  const [sections, setSections] = React.useState<ReportSection[]>(report.sections.map((s) => ({ ...s })));
  const [activeSection, setActiveSection] = React.useState(sections[0]?.id ?? '');
  const [dirty, setDirty] = React.useState(false);
  const activeSec = sections.find((s) => s.id === activeSection);
  const updateSection = (id: string, content: string) => {
    setSections((prev) => prev.map((s) => s.id === id ? { ...s, content } : s));
    setDirty(true);
  };
  const toggleSection = (id: string) => {
    setSections((prev) => prev.map((s) => s.id === id ? { ...s, enabled: !s.enabled } : s));
    setDirty(true);
  };
  return (
    <div className="fixed inset-0 z-[125] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="flex h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-[20px] border border-white/[0.1] bg-[#0f0f1a] shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-6 py-4">
          <div>
            <h2 className="font-heading text-[16px] font-bold text-white">✏ Report Editor</h2>
            <div className="mt-1 flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${dirty ? 'bg-blue-500/15 text-blue-300' : 'bg-white/[0.08] text-white/40'}`}>{dirty ? 'Edited' : 'Draft'}</span>
              {dirty && <span className="text-[10px] text-white/35">Unsaved changes</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { onSave(report.id, sections, title); setDirty(false); setToast('Report saved'); }} className="rounded-lg bg-[#ffffff] px-3.5 py-2 text-[11px] font-bold text-ink transition hover:bg-[#f0f2ff]">Save</button>
            <button onClick={() => { if (dirty && !window.confirm('Discard unsaved changes?')) return; onClose(); }} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.07] text-white/50 hover:text-white">✕</button>
          </div>
        </div>
        {/* Title */}
        <div className="shrink-0 border-b border-white/[0.06] px-6 py-3">
          <input value={title} onChange={(e) => { setTitle(e.target.value); setDirty(true); }} className="w-full bg-transparent text-[15px] font-semibold text-white outline-none placeholder:text-white/30" placeholder="Report title…" />
        </div>
        {/* Body: section list + editor */}
        <div className="flex min-h-0 flex-1">
          {/* Sections list */}
          <div className="flex w-44 shrink-0 flex-col gap-1 overflow-y-auto border-r border-white/[0.07] px-3 py-3">
            <p className="mb-1 px-1 text-[9px] font-bold uppercase tracking-widest text-white/35">Sections</p>
            {sections.map((sec) => (
              <div key={sec.id} className="flex items-center gap-1.5">
                <button onClick={() => setActiveSection(sec.id)} className={`flex-1 truncate rounded-lg px-2.5 py-2 text-left text-[11px] font-semibold transition ${activeSection === sec.id ? 'bg-white/[0.12] text-white' : sec.enabled ? 'text-white/60 hover:bg-white/[0.06] hover:text-white/85' : 'text-white/25'}`}>{sec.title}</button>
                <button onClick={() => toggleSection(sec.id)} className={`shrink-0 text-[9px] transition ${sec.enabled ? 'text-green-400' : 'text-white/20 hover:text-white/40'}`} title={sec.enabled ? 'Disable section' : 'Enable section'}>{sec.enabled ? '●' : '○'}</button>
              </div>
            ))}
          </div>
          {/* Section editor */}
          <div className="flex min-w-0 flex-1 flex-col px-6 py-4">
            {activeSec ? (
              <>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-white/40">{activeSec.title}</p>
                <textarea
                  value={activeSec.content}
                  onChange={(e) => updateSection(activeSec.id, e.target.value)}
                  placeholder={`Write ${activeSec.title.toLowerCase()} content here…`}
                  className="flex-1 resize-none rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-3 text-[12.5px] leading-relaxed text-white outline-none placeholder:text-white/25"
                />
              </>
            ) : (
              <p className="py-12 text-center text-[13px] text-white/35">Select a section to edit.</p>
            )}
          </div>
        </div>
        {/* Footer note */}
        <div className="shrink-0 border-t border-white/[0.06] px-6 py-2.5 text-[10px] text-white/30">
          System message will be sent: "Report edited." · Changes are autosaved to current version.
        </div>
      </div>
    </div>
  );
}

// ── Export Modal ──────────────────────────────────────────────────────────────
export function ReportExportModal({
  state, report, onClose, onExport, safetyMode, setToast,
}: {
  state: ExportModalState; report: Report; onClose: () => void;
  onExport: (s: ExportModalState) => void; safetyMode: boolean; setToast: (msg: string) => void;
}) {
  const [s, setS] = React.useState(state);
  const fmt = s.format;
  const handleExport = () => {
    if (report.approvalRequired && report.approvalStatus !== 'Approved' && safetyMode) {
      setToast('Export requires approval first. Use the approval flow.');
      return;
    }
    onExport(s);
  };
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-[20px] border border-white/[0.1] bg-[#0f0f1a] shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
          <h2 className="font-heading text-[15px] font-bold text-white">
            {fmt === 'pdf' ? '📄 Export PDF' : fmt === 'csv' ? '📊 Export CSV' : fmt === 'sheets' ? '📋 Google Sheets' : fmt === 'email' ? '✉ Email Draft' : '💬 LINE Draft'}
          </h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.07] text-white/50 hover:text-white">✕</button>
        </div>
        <div className="space-y-4 px-6 py-5">
          {(fmt === 'pdf' || fmt === 'csv') && (
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-white/55">File name</label>
              <input value={s.fileName} onChange={(e) => setS({ ...s, fileName: e.target.value })} className="w-full rounded-lg border border-white/[0.12] bg-white/[0.06] px-3 py-2 text-[12px] text-white outline-none" />
            </div>
          )}
          {fmt === 'pdf' && (
            <div className="space-y-2">
              {([['includeCharts', 'Include charts'] as const, ['includeTimeline', 'Include timeline'] as const, ['includeAuditLog', 'Include audit log'] as const, ['includeAppendix', 'Include appendix'] as const]).map(([k, label]) => (
                <label key={k} className="flex cursor-pointer items-center justify-between rounded-lg border border-white/[0.07] bg-white/[0.04] px-4 py-2.5 transition hover:bg-white/[0.07]">
                  <span className="text-[12px] text-white/75">{label}</span>
                  <input type="checkbox" checked={s[k]} onChange={(e) => setS({ ...s, [k]: e.target.checked })} className="accent-accent" />
                </label>
              ))}
            </div>
          )}
          {fmt === 'sheets' && (
            <>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-white/55">Sheet destination</label>
                <input value={s.sheetDestination} onChange={(e) => setS({ ...s, sheetDestination: e.target.value })} placeholder="e.g. Weekly Reports 2026" className="w-full rounded-lg border border-white/[0.12] bg-white/[0.06] px-3 py-2 text-[12px] text-white outline-none placeholder:text-white/30" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-white/55">Worksheet name</label>
                <input value={s.worksheetName} onChange={(e) => setS({ ...s, worksheetName: e.target.value })} placeholder="Sheet1" className="w-full rounded-lg border border-white/[0.12] bg-white/[0.06] px-3 py-2 text-[12px] text-white outline-none placeholder:text-white/30" />
              </div>
              <div className="flex gap-2">
                {(['append', 'overwrite'] as const).map((mode) => (
                  <button key={mode} onClick={() => setS({ ...s, appendOrOverwrite: mode })} className={`flex-1 rounded-lg py-2 text-[11px] font-semibold capitalize transition ${s.appendOrOverwrite === mode ? 'bg-white/15 text-white' : 'border border-white/[0.1] text-white/45 hover:bg-white/[0.06]'}`}>{mode}</button>
                ))}
              </div>
              <p className="text-[10px] text-white/35">No real Google auth required — mock export only. TODO: Connect Google Sheets API via OAuth connector.</p>
            </>
          )}
          {fmt === 'csv' && (
            <p className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-[11px] text-white/55">
              {report.sections.some((s) => s.type === 'table')
                ? 'Table data will be exported as CSV with headers and rows.'
                : '⚠ No tabular data available in this report. Only metadata will be exported.'}
            </p>
          )}
          {report.approvalRequired && report.approvalStatus !== 'Approved' && safetyMode && (
            <div className="rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3 text-[11px] text-amber-300">
              ⚠ Safety Mode is ON. This report requires approval before export. Approval: {report.approvalStatus ?? 'None'}.
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-white/[0.08] px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-white/[0.1] px-4 py-2 text-[11px] font-semibold text-white/55 hover:bg-white/[0.06] hover:text-white">Cancel</button>
          <button onClick={handleExport} className="rounded-lg bg-[#ffffff] px-4 py-2 text-[11px] font-bold text-ink transition hover:bg-[#f0f2ff]">
            {fmt === 'pdf' ? 'Export PDF' : fmt === 'csv' ? 'Export CSV' : fmt === 'sheets' ? 'Send to Sheets' : fmt === 'email' ? 'Create Draft' : 'Create Draft'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Email Draft Modal ─────────────────────────────────────────────────────────
export function EmailDraftModal({ draft, onClose, setToast }: { draft: EmailDraftState; onClose: () => void; setToast: (m: string) => void }) {
  const [d, setD] = React.useState(draft);
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-[20px] border border-white/[0.1] bg-[#0f0f1a] shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
          <h2 className="font-heading text-[15px] font-bold text-white">✉ Email Draft</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.07] text-white/50 hover:text-white">✕</button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div><label className="mb-1 block text-[11px] font-semibold text-white/55">Recipient</label><input value={d.recipient} onChange={(e) => setD({ ...d, recipient: e.target.value })} className="w-full rounded-lg border border-white/[0.12] bg-white/[0.06] px-3 py-2 text-[12px] text-white outline-none" /></div>
          <div><label className="mb-1 block text-[11px] font-semibold text-white/55">Subject</label><input value={d.subject} onChange={(e) => setD({ ...d, subject: e.target.value })} className="w-full rounded-lg border border-white/[0.12] bg-white/[0.06] px-3 py-2 text-[12px] text-white outline-none" /></div>
          <div><label className="mb-1 block text-[11px] font-semibold text-white/55">Message preview</label><textarea value={d.messagePreview} onChange={(e) => setD({ ...d, messagePreview: e.target.value })} rows={6} className="w-full resize-none rounded-lg border border-white/[0.12] bg-white/[0.06] px-3 py-2 text-[12px] leading-relaxed text-white outline-none" /></div>
          <div className="flex gap-3">
            {[['includeAttachments', 'Attach PDF report'] as const, ['includeSummary', 'Include summary'] as const].map(([k, label]) => (
              <label key={k} className="flex cursor-pointer items-center gap-2 text-[11px] text-white/65">
                <input type="checkbox" checked={d[k]} onChange={(e) => setD({ ...d, [k]: e.target.checked })} className="accent-accent" />
                {label}
              </label>
            ))}
          </div>
          <p className="text-[10px] text-white/30">Email will NOT be auto-sent. Draft must go through Approval flow before delivery.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.08] px-6 py-4">
          <button onClick={() => { navigator.clipboard?.writeText(`To: ${d.recipient}\nSubject: ${d.subject}\n\n${d.messagePreview}`); setToast('Email draft copied'); }} className="rounded-lg border border-white/[0.1] px-3 py-1.5 text-[11px] font-semibold text-white/65 hover:bg-white/[0.06] hover:text-white">Copy</button>
          <button onClick={() => { setToast('Draft saved'); onClose(); }} className="rounded-lg border border-white/[0.1] px-3 py-1.5 text-[11px] font-semibold text-white/65 hover:bg-white/[0.06] hover:text-white">Save Draft</button>
          <button onClick={() => { setToast('Sent for approval'); onClose(); }} className="ml-auto rounded-lg bg-[#ffffff] px-4 py-1.5 text-[11px] font-bold text-ink hover:bg-[#f0f2ff]">Send for Approval</button>
        </div>
      </div>
    </div>
  );
}

// ── LINE Draft Modal ──────────────────────────────────────────────────────────
export function LineDraftModal({ draft, onClose, setToast }: { draft: LineDraftState; onClose: () => void; setToast: (m: string) => void }) {
  const [msg, setMsg] = React.useState(draft.message);
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-[20px] border border-white/[0.1] bg-[#0f0f1a] shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
          <h2 className="font-heading text-[15px] font-bold text-white">💬 LINE Message Draft</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.07] text-white/50 hover:text-white">✕</button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div><label className="mb-1 block text-[11px] font-semibold text-white/55">Message</label><textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={5} className="w-full resize-none rounded-lg border border-white/[0.12] bg-white/[0.06] px-3 py-2 text-[12px] leading-relaxed text-white outline-none" /></div>
          <p className="text-[10px] text-white/30">Real LINE API not connected — draft only. TODO: Connect via LINE Messaging API connector.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.08] px-6 py-4">
          <button onClick={() => { navigator.clipboard?.writeText(msg); setToast('LINE draft copied'); }} className="rounded-lg border border-white/[0.1] px-3 py-1.5 text-[11px] font-semibold text-white/65 hover:bg-white/[0.06] hover:text-white">Copy Message</button>
          <button onClick={() => { setToast('Draft saved'); onClose(); }} className="rounded-lg border border-white/[0.1] px-3 py-1.5 text-[11px] font-semibold text-white/65 hover:bg-white/[0.06] hover:text-white">Save Draft</button>
          <button onClick={() => { setToast('Sent for approval'); onClose(); }} className="ml-auto rounded-lg bg-[#ffffff] px-4 py-1.5 text-[11px] font-bold text-ink hover:bg-[#f0f2ff]">Send for Approval</button>
        </div>
      </div>
    </div>
  );
}

// ── Schedule Report Modal ─────────────────────────────────────────────────────
export function ScheduleReportModal({
  workflowName, reportId, onClose, onSave, setToast,
}: {
  workflowName: string; reportId: string | null; onClose: () => void;
  onSave: (s: ScheduledReport) => void; setToast: (m: string) => void;
}) {
  const [frequency, setFrequency] = React.useState<ScheduledReportFrequency>('weekly');
  const [time, setTime] = React.useState('09:00');
  const [timezone, setTimezone] = React.useState('UTC+7');
  const [template, setTemplate] = React.useState<ReportTemplateId>('workflow-summary');
  const [destination, setDestination] = React.useState<ScheduledReportDestination>('email');
  const [recipients, setRecipients] = React.useState('');
  const [channel, setChannel] = React.useState('reports');
  const [approvalRequired, setApprovalRequired] = React.useState(false);
  const [active, setActive] = React.useState(true);
  const destLabels: Record<ScheduledReportDestination, string> = { email: 'Email', sheets: 'Google Sheets', channel: 'Chat Channel', folder: 'Export Folder', 'approval-queue': 'Approval Queue' };
  const handleSave = () => {
    const tmpl = REPORT_TEMPLATES.find((t) => t.id === template)!;
    const nextDay = frequency === 'daily' ? 'Tomorrow' : frequency === 'weekly' ? 'Next week' : 'Next month';
    onSave({
      id: `sch-${Date.now()}`, workflowId: 'wf-1', workflowName,
      title: `${tmpl.name} — ${workflowName}`, template, templateName: tmpl.name,
      frequency, time, timezone, destination,
      destinationLabel: `${destLabels[destination]}${recipients ? ` — ${recipients}` : ''}`,
      recipients, channel, approvalRequired, active,
      nextRun: `${nextDay} ${time} ${timezone}`, lastRun: undefined,
      createdAt: 'Today',
    });
    setToast('Scheduled report created');
    onClose();
  };
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-[20px] border border-white/[0.1] bg-[#0f0f1a] shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
          <h2 className="font-heading text-[15px] font-bold text-white">🗓 Schedule Report</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.07] text-white/50 hover:text-white">✕</button>
        </div>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-white/55">Frequency</label>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value as ScheduledReportFrequency)} className="w-full rounded-lg border border-white/[0.12] bg-white/[0.06] px-3 py-2 text-[12px] text-white outline-none">
                {(['daily', 'weekly', 'monthly', 'custom'] as const).map((f) => <option key={f} value={f} className="bg-[#1a1a2e]">{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-white/55">Time</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full rounded-lg border border-white/[0.12] bg-white/[0.06] px-3 py-2 text-[12px] text-white outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-white/55">Timezone</label>
              <input value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full rounded-lg border border-white/[0.12] bg-white/[0.06] px-3 py-2 text-[12px] text-white outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-white/55">Template</label>
              <select value={template} onChange={(e) => setTemplate(e.target.value as ReportTemplateId)} className="w-full rounded-lg border border-white/[0.12] bg-white/[0.06] px-3 py-2 text-[12px] text-white outline-none">
                {REPORT_TEMPLATES.map((t) => <option key={t.id} value={t.id} className="bg-[#1a1a2e]">{t.icon} {t.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-white/55">Output destination</label>
            <div className="grid grid-cols-3 gap-2">
              {(['email', 'sheets', 'channel', 'folder', 'approval-queue'] as const).map((d) => (
                <button key={d} onClick={() => setDestination(d)} className={`rounded-lg py-2 text-[10px] font-semibold capitalize transition ${destination === d ? 'bg-white/15 text-white' : 'border border-white/[0.1] text-white/45 hover:bg-white/[0.06]'}`}>{destLabels[d]}</button>
              ))}
            </div>
          </div>
          {destination === 'email' && <div><label className="mb-1 block text-[11px] font-semibold text-white/55">Recipients</label><input value={recipients} onChange={(e) => setRecipients(e.target.value)} placeholder="email@company.com" className="w-full rounded-lg border border-white/[0.12] bg-white/[0.06] px-3 py-2 text-[12px] text-white outline-none placeholder:text-white/30" /></div>}
          {destination === 'channel' && <div><label className="mb-1 block text-[11px] font-semibold text-white/55">Channel</label><input value={channel} onChange={(e) => setChannel(e.target.value)} placeholder="reports" className="w-full rounded-lg border border-white/[0.12] bg-white/[0.06] px-3 py-2 text-[12px] text-white outline-none placeholder:text-white/30" /></div>}
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-white/[0.07] bg-white/[0.04] px-4 py-3">
            <span className="text-[12px] text-white/75">Require approval before delivery</span>
            <input type="checkbox" checked={approvalRequired} onChange={(e) => setApprovalRequired(e.target.checked)} className="accent-accent" />
          </label>
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-white/[0.07] bg-white/[0.04] px-4 py-3">
            <span className="text-[12px] text-white/75">Active (start scheduling immediately)</span>
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="accent-accent" />
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-white/[0.08] px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-white/[0.1] px-4 py-2 text-[11px] font-semibold text-white/55 hover:bg-white/[0.06] hover:text-white">Cancel</button>
          <button onClick={handleSave} className="rounded-lg bg-[#ffffff] px-4 py-2 text-[11px] font-bold text-ink hover:bg-[#f0f2ff]">Create Schedule</button>
        </div>
      </div>
    </div>
  );
}

// ── Scheduled Reports List Modal ──────────────────────────────────────────────
export function ScheduledReportsModal({
  scheduledReports, setScheduledReports, onClose, onAdd, setToast,
}: {
  scheduledReports: ScheduledReport[]; setScheduledReports: React.Dispatch<React.SetStateAction<ScheduledReport[]>>;
  onClose: () => void; onAdd: () => void; setToast: (m: string) => void;
}) {
  const toggleActive = (id: string) => setScheduledReports((prev) => prev.map((s) => s.id === id ? { ...s, active: !s.active } : s));
  const deleteSchedule = (id: string) => { if (window.confirm('Delete this scheduled report?')) setScheduledReports((prev) => prev.filter((s) => s.id !== id)); };
  const freqColors: Record<ScheduledReportFrequency, string> = { daily: 'text-blue-400', weekly: 'text-green-400', monthly: 'text-purple-400', custom: 'text-amber-400' };
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-[20px] border border-white/[0.1] bg-[#0f0f1a] shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-6 py-4">
          <div>
            <h2 className="font-heading text-[16px] font-bold text-white">🗓 Scheduled Reports</h2>
            <p className="mt-0.5 text-[12px] text-white/45">{scheduledReports.filter((s) => s.active).length} active schedules</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onAdd} className="rounded-lg border border-white/[0.12] bg-white/[0.06] px-3 py-1.5 text-[11px] font-semibold text-white/70 transition hover:bg-white/[0.1] hover:text-white">+ New Schedule</button>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.07] text-white/50 hover:text-white">✕</button>
          </div>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
          {scheduledReports.length === 0 && <p className="py-12 text-center text-[13px] text-white/35">No scheduled reports yet.</p>}
          {scheduledReports.map((sch) => (
            <div key={sch.id} className={`rounded-[16px] border px-5 py-4 ${sch.active ? 'border-white/[0.09] bg-white/[0.03]' : 'border-white/[0.05] bg-white/[0.01] opacity-60'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[13px] font-semibold text-white">{sch.title}</p>
                    <span className={`text-[10px] font-bold capitalize ${freqColors[sch.frequency]}`}>{sch.frequency}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${sch.active ? 'bg-green-500/15 text-green-400' : 'bg-white/[0.08] text-white/40'}`}>{sch.active ? 'Active' : 'Paused'}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-white/45">{sch.templateName} · {sch.destinationLabel}</p>
                  <div className="mt-2 flex items-center gap-4 text-[10px] text-white/40">
                    <span>Next: <span className="text-white/65">{sch.nextRun}</span></span>
                    {sch.lastRun && <span>Last: <span className="text-white/65">{sch.lastRun}</span></span>}
                    {sch.approvalRequired && <span className="text-amber-400/70">⚠ Approval required</span>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button onClick={() => toggleActive(sch.id)} className="rounded-lg border border-white/[0.1] px-2.5 py-1.5 text-[10px] font-semibold text-white/60 transition hover:bg-white/[0.07] hover:text-white">{sch.active ? 'Pause' : 'Resume'}</button>
                  <button onClick={() => { deleteSchedule(sch.id); setToast('Schedule deleted'); }} className="rounded-lg border border-red-500/20 px-2.5 py-1.5 text-[10px] font-semibold text-red-400/70 transition hover:bg-red-500/10 hover:text-red-400">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export function AuditLogModal({
  auditLogs,
  setAuditLogs,
  auditLogFilter,
  setAuditLogFilter,
  auditLogSearch,
  setAuditLogSearch,
  auditLogDetail,
  setAuditLogDetail,
  rollbackConfirm,
  setRollbackConfirm,
  onClose,
  addSystemMessage,
  setToast,
  workflowName,
}: {
  auditLogs: AuditLog[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  auditLogFilter: 'All' | 'User' | 'Agent' | 'System' | 'Approval' | 'Errors' | 'Risk' | 'Rollbacks';
  setAuditLogFilter: (f: 'All' | 'User' | 'Agent' | 'System' | 'Approval' | 'Errors' | 'Risk' | 'Rollbacks') => void;
  auditLogSearch: string;
  setAuditLogSearch: (s: string) => void;
  auditLogDetail: AuditLog | null;
  setAuditLogDetail: (l: AuditLog | null) => void;
  rollbackConfirm: AuditLog | null;
  setRollbackConfirm: (l: AuditLog | null) => void;
  onClose: () => void;
  addSystemMessage: (text: string) => void;
  setToast: (msg: string) => void;
  workflowName: string;
}) {
  const FILTER_TABS: Array<{ label: string; value: typeof auditLogFilter }> = [
    { label: 'All', value: 'All' },
    { label: 'User', value: 'User' },
    { label: 'Agent', value: 'Agent' },
    { label: 'System', value: 'System' },
    { label: 'Approvals', value: 'Approval' },
    { label: 'Errors', value: 'Errors' },
    { label: 'High Risk', value: 'Risk' },
    { label: 'Rollbacks', value: 'Rollbacks' },
  ];

  const filtered = auditLogs.filter((log) => {
    if (auditLogFilter === 'User' && log.actorType !== 'User') return false;
    if (auditLogFilter === 'Agent' && log.actorType !== 'Agent') return false;
    if (auditLogFilter === 'System' && log.actorType !== 'System') return false;
    if (auditLogFilter === 'Approval' && log.actorType !== 'Approval') return false;
    if (auditLogFilter === 'Errors' && log.status !== 'Failed') return false;
    if (auditLogFilter === 'Risk' && log.riskLevel !== 'High') return false;
    if (auditLogFilter === 'Rollbacks' && log.rollbackStatus === 'none') return false;
    if (auditLogSearch) {
      const q = auditLogSearch.toLowerCase();
      if (!log.title.toLowerCase().includes(q) && !log.actorName.toLowerCase().includes(q) && !log.description.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const actorBadge = (actorType: AuditActorType) => {
    const cfg: Record<AuditActorType, { label: string; cls: string }> = {
      User: { label: 'User', cls: 'bg-accent/15 text-accent' },
      Agent: { label: 'Agent', cls: 'bg-purple-400/15 text-purple-300' },
      System: { label: 'System', cls: 'bg-sky-400/15 text-sky-300' },
      Approval: { label: 'Approval', cls: 'bg-orange-400/15 text-orange-300' },
    };
    const c = cfg[actorType];
    return <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${c.cls}`}>{c.label}</span>;
  };

  const riskBadge = (level: 'Low' | 'Medium' | 'High') => {
    const cls = level === 'High' ? 'bg-red-400/15 text-red-400' : level === 'Medium' ? 'bg-amber-400/15 text-amber-400' : 'bg-emerald-400/15 text-emerald-400';
    return <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${cls}`}>{level}</span>;
  };

  const statusDot = (status: AuditLog['status']) => {
    const cls = status === 'Failed' ? 'bg-red-400' : status === 'Pending' ? 'bg-amber-400' : 'bg-emerald-400';
    return <span className={`inline-block h-1.5 w-1.5 rounded-full ${cls}`} />;
  };

  const confirmRollback = (log: AuditLog) => {
    setAuditLogs((prev) => prev.map((l) => l.id === log.id ? { ...l, rollbackStatus: 'rolled-back' } : l));
    const now = new Date();
    const ts = `${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    const rollbackEntry: AuditLog = {
      id: `aud-rb-${Date.now()}`, timestamp: ts, actorType: 'User', actorName: 'You',
      actionType: 'agent-edited', title: `Rolled back: ${log.title}`, description: `Action "${log.title}" was reversed. Workflow state restored to before this action.`,
      workflowName, stepName: log.stepName, riskLevel: 'Low', status: 'Success', reversible: false, rollbackStatus: 'none',
      beforeState: log.afterState, afterState: log.beforeState, metadata: { originalEntryId: log.id },
    };
    setAuditLogs((prev) => [rollbackEntry, ...prev]);
    addSystemMessage(`System: Action "${log.title}" rolled back. Workflow state restored.`);
    setToast('Rollback complete — state restored');
    setRollbackConfirm(null);
    setAuditLogDetail(null);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex w-full max-w-[860px] flex-col rounded-[22px] border border-white/[0.1] bg-[#0e0e1a] shadow-[0_24px_80px_rgba(0,0,0,0.6)]" style={{ maxHeight: 'min(90vh, calc(100vh - 32px))' }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
          <div>
            <h2 className="font-heading text-[16px] font-extrabold text-white">Audit Log</h2>
            <p className="mt-0.5 text-[11px] text-white/40">{auditLogs.length} entries · {workflowName}</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.1] text-white/40 transition hover:border-white/[0.2] hover:text-white">✕</button>
        </div>

        {/* Filter tabs + search */}
        <div className="shrink-0 border-b border-white/[0.06] px-6 py-3">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {FILTER_TABS.map(({ label, value }) => (
              <button key={value} onClick={() => setAuditLogFilter(value)}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${auditLogFilter === value ? 'bg-accent text-white' : 'border border-white/[0.1] text-white/50 hover:border-white/[0.2] hover:text-white'}`}>
                {label}
              </button>
            ))}
          </div>
          <input
            value={auditLogSearch} onChange={(e) => setAuditLogSearch(e.target.value)}
            placeholder="Search by action, actor, or description…"
            className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-[12px] text-white placeholder-white/25 outline-none focus:border-accent/40"
          />
        </div>

        {/* Body: list + detail side-by-side */}
        <div className="flex min-h-0 flex-1 overflow-hidden">

          {/* Log list */}
          <div className="w-[340px] shrink-0 overflow-y-auto border-r border-white/[0.06] py-2">
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-2xl mb-2">📋</p>
                <p className="text-[12px] font-semibold text-white/40">No log entries match</p>
                <p className="text-[11px] text-white/25 mt-1">Try a different filter or search term</p>
              </div>
            )}
            {filtered.map((log) => (
              <button key={log.id} onClick={() => setAuditLogDetail(log)}
                className={`w-full text-left px-4 py-3 transition border-b border-white/[0.04] hover:bg-white/[0.04] ${auditLogDetail?.id === log.id ? 'bg-white/[0.06]' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {statusDot(log.status)}
                      <p className="truncate text-[11px] font-semibold text-white">{log.title}</p>
                    </div>
                    <p className="text-[10px] text-white/35 mb-1">{log.timestamp} · {log.actorName}</p>
                    <div className="flex items-center gap-1 flex-wrap">
                      {actorBadge(log.actorType)}
                      {riskBadge(log.riskLevel)}
                      {log.rollbackStatus === 'rolled-back' && <span className="rounded-full bg-purple-400/15 px-1.5 py-0.5 text-[8px] font-bold text-purple-300">Rolled Back</span>}
                      {log.reversible && log.rollbackStatus === 'none' && <span className="rounded-full border border-accent/25 px-1.5 py-0.5 text-[8px] font-medium text-accent/60">Reversible</span>}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Detail panel */}
          <div className="flex-1 overflow-y-auto p-5">
            {!auditLogDetail ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <p className="text-3xl mb-3">🔍</p>
                <p className="text-[13px] font-semibold text-white/40">Select an entry to view details</p>
                <p className="text-[11px] text-white/25 mt-1">Click any log entry on the left to inspect it</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {statusDot(auditLogDetail.status)}
                    <h3 className="font-heading text-[15px] font-bold text-white">{auditLogDetail.title}</h3>
                  </div>
                  <p className="text-[11px] text-white/40">{auditLogDetail.timestamp} · {auditLogDetail.actorName}</p>
                </div>

                <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 space-y-2 text-[11px]">
                  <div className="flex justify-between"><span className="text-white/40">Actor</span><span className="font-semibold text-white">{auditLogDetail.actorName}</span></div>
                  <div className="flex justify-between"><span className="text-white/40">Actor type</span>{actorBadge(auditLogDetail.actorType)}</div>
                  <div className="flex justify-between"><span className="text-white/40">Risk level</span>{riskBadge(auditLogDetail.riskLevel)}</div>
                  <div className="flex justify-between"><span className="text-white/40">Status</span><span className={`font-bold ${auditLogDetail.status === 'Failed' ? 'text-red-400' : auditLogDetail.status === 'Pending' ? 'text-amber-400' : 'text-emerald-300'}`}>{auditLogDetail.status}</span></div>
                  <div className="flex justify-between"><span className="text-white/40">Workflow</span><span className="font-semibold text-white">{auditLogDetail.workflowName}</span></div>
                  {auditLogDetail.stepName && <div className="flex justify-between"><span className="text-white/40">Step</span><span className="font-semibold text-white">{auditLogDetail.stepName}</span></div>}
                  <div className="flex justify-between"><span className="text-white/40">Reversible</span><span className={`font-semibold ${auditLogDetail.reversible ? 'text-emerald-300' : 'text-white/35'}`}>{auditLogDetail.reversible ? 'Yes' : 'No'}</span></div>
                  {auditLogDetail.rollbackStatus !== 'none' && <div className="flex justify-between"><span className="text-white/40">Rollback status</span><span className="font-bold text-purple-300 capitalize">{auditLogDetail.rollbackStatus}</span></div>}
                </div>

                <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-white/35">Description</p>
                  <p className="text-[12px] text-white/70">{auditLogDetail.description}</p>
                </div>

                {(auditLogDetail.beforeState || auditLogDetail.afterState) && (
                  <div className="grid grid-cols-2 gap-3">
                    {auditLogDetail.beforeState && (
                      <div className="rounded-xl border border-red-400/15 bg-red-400/[0.04] px-3 py-3">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-red-400/60">Before</p>
                        <pre className="text-[10px] text-white/60 whitespace-pre-wrap break-all">{JSON.stringify(auditLogDetail.beforeState, null, 2)}</pre>
                      </div>
                    )}
                    {auditLogDetail.afterState && (
                      <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] px-3 py-3">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-emerald-400/60">After</p>
                        <pre className="text-[10px] text-white/60 whitespace-pre-wrap break-all">{JSON.stringify(auditLogDetail.afterState, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}

                {auditLogDetail.metadata && Object.keys(auditLogDetail.metadata).length > 0 && (
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-white/35">Metadata</p>
                    <pre className="text-[10px] text-white/55 whitespace-pre-wrap break-all">{JSON.stringify(auditLogDetail.metadata, null, 2)}</pre>
                  </div>
                )}

                {/* Rollback action */}
                {auditLogDetail.reversible && auditLogDetail.rollbackStatus === 'none' && (
                  <div className="rounded-xl border border-accent/20 bg-accent/[0.04] px-4 py-3">
                    <p className="text-[12px] font-semibold text-white mb-1">Rollback available</p>
                    <p className="text-[11px] text-white/50 mb-3">This action can be reversed. The workflow state will be restored to before this action was taken.</p>
                    <button onClick={() => setRollbackConfirm(auditLogDetail)}
                      className="w-full rounded-xl border border-accent/30 bg-accent/10 py-2 text-[12px] font-bold text-accent transition hover:bg-accent/20">
                      ↩ Initiate Rollback
                    </button>
                  </div>
                )}
                {auditLogDetail.rollbackStatus === 'rolled-back' && (
                  <div className="rounded-xl border border-purple-400/20 bg-purple-400/[0.04] px-4 py-3">
                    <p className="text-[12px] font-semibold text-purple-300">↩ This action has been rolled back</p>
                    <p className="text-[11px] text-white/45 mt-1">State was restored to before this action was taken.</p>
                  </div>
                )}
                {auditLogDetail.reversible === false && (
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
                    <p className="text-[11px] text-white/35">⛔ This action is not reversible (e.g. email sent, external API call, published workflow).</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between border-t border-white/[0.08] px-6 py-3">
          <p className="text-[11px] text-white/30">{filtered.length} of {auditLogs.length} entries shown</p>
          <button onClick={onClose} className="rounded-[10px] border border-white/[0.1] px-5 py-2 text-[12px] font-semibold text-white/60 transition hover:bg-white/[0.06] hover:text-white">Close</button>
        </div>
      </div>
    </div>
  );
}



// ── AI Ant ───────────────────────────────────────────────────────────────────



export function ConfirmModal({ title, body, confirmLabel, onCancel, onConfirm }: {
  title: string;
  body: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-5">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-[420px] rounded-[18px] border border-white/[0.09] bg-[#0b0e16] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
        <p className="text-base font-bold text-white/95">{title}</p>
        <p className="mt-2 text-[13px] leading-relaxed text-white/55">{body}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-[10px] border border-white/[0.10] bg-transparent px-4 py-2 text-[13px] font-semibold text-white/80 transition hover:border-white/[0.22] hover:bg-white/[0.04] hover:text-white">
            Cancel
          </button>
          <button onClick={onConfirm} className="rounded-[10px] bg-white px-4 py-2 text-[13px] font-semibold text-[#0b0e16] transition hover:bg-white/95">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DeleteAccountModal({ deleteText, setDeleteText, onCancel, onConfirm }: {
  deleteText: string;
  setDeleteText: (v: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const armed = deleteText === 'DELETE';
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-5">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-[460px] rounded-[18px] border border-rose-500/25 bg-[#0b0e16] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-2 text-rose-300">
          <AlertTriangle size={16} />
          <p className="text-base font-bold">Delete account</p>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-white/55">
          This will clear your local Colony data on this device and sign you out. {' '}
          <span className="text-white/40">Server-side account deletion requires a backend endpoint and is not implemented in mock mode.</span>
        </p>
        <label className="mt-5 block text-[12px] font-semibold text-white/55">
          Type <span className="font-mono text-rose-300">DELETE</span> to confirm
          <input
            value={deleteText}
            onChange={(e) => setDeleteText(e.target.value)}
            autoFocus
            className="mt-2 w-full rounded-[10px] border border-white/[0.10] bg-white/[0.04] px-3 py-2 text-[13px] text-white outline-none transition focus:border-rose-400/45 focus:bg-white/[0.05] focus:ring-2 focus:ring-rose-400/15"
          />
        </label>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-[10px] border border-white/[0.10] bg-transparent px-4 py-2 text-[13px] font-semibold text-white/80 transition hover:border-white/[0.22] hover:bg-white/[0.04] hover:text-white">
            Cancel
          </button>
          <button
            disabled={!armed}
            onClick={armed ? onConfirm : undefined}
            className={`rounded-[10px] px-4 py-2 text-[13px] font-semibold transition ${
              armed ? 'bg-rose-500 text-white hover:bg-rose-400' : 'cursor-not-allowed bg-rose-500/30 text-white/55'
            }`}
          >
            Delete local data
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Billing / Entitlement System ────────────────────────────────────────────
