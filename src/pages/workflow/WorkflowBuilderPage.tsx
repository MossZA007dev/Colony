import React from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ChevronDown, ChevronRight, Maximize2, Minus, Network, Play, Plus, Settings, ShieldCheck, Square, StickyNote, Trash2 } from 'lucide-react';
import { resolveModelForCapability, type AgentCapability } from '../../lib/aiOrchestration';
import { readableField } from '../../lib/aiAnt/aiAntHelpers';
import { MODEL_ROUTING_OPTIONS, modelRoutingLabel } from '../../lib/aiAnt/routing';
import {
  WORKFLOW_CANVAS_BOTTOM_GUTTER,
  WORKFLOW_CANVAS_SIZE,
  WORKFLOW_DESTINATION_OPTIONS,
  WORKFLOW_LOGS_COLLAPSED_HEIGHT,
  WORKFLOW_LOGS_EXPANDED_HEIGHT,
  WORKFLOW_NODE_SIZE,
  WORKFLOW_NODE_TYPE_OPTIONS,
  WORKFLOW_TEMPLATES,
  WORKFLOW_Z,
  applyInstructionToNode,
  getWorkflowConnector,
  isExternalWorkflowDestination,
  nodeChangeSummary,
  setWorkflowConfigValue,
  validateWorkflowNode,
  workflowDestinationConnector,
  workflowEdgePath,
  workflowEdgeTone,
  workflowNodeIcon,
  workflowNodeTone,
  workflowNodeTypeLabel,
  workflowSourceConnectionKey,
  workflowStatusTone,
  workflowValidation,
} from '../../lib/workflow/workflowBuilder';
import type {
  ModelRoutingPreference,
  NodeChange,
  NodeInstruction,
  Workflow as WorkflowDef,
  WorkflowApprovalType,
  WorkflowConnectorStatus,
  WorkflowDestinationType,
  WorkflowErrorHandling,
  WorkflowFileFormat,
  WorkflowNode,
  WorkflowNodeConfig,
  WorkflowNodeType,
  WorkflowNotificationChannel,
  WorkflowOutputFormat,
  WorkflowProposal,
  WorkflowSourceType,
  WorkflowTone,
  WorkflowTransformType,
  WorkflowTriggerKind,
} from '../../lib/types/workflowTypes';

export function WorkflowProposalCard({ proposal, onOpen, onRunTest, onCancel }: { proposal: WorkflowProposal; onOpen: () => void; onRunTest: () => void; onCancel: () => void }) {
  return (
    <div className="w-full max-w-[760px] rounded-[22px] border border-white/[0.08] bg-[#080b14]/95 p-5 shadow-[0_28px_80px_rgba(0,0,0,0.28)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200/65">Workflow Proposal</p>
          <h3 className="mt-2 text-lg font-bold text-white/90">{proposal.goal}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">AI Ant found a repeatable process with a trigger, review checkpoints, and an output destination.</p>
        </div>
        <span className="rounded-full border border-white/[0.10] bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-white/56">{proposal.complexity} complexity</span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/32">Trigger</p>
          <p className="mt-2 text-sm font-semibold text-white/82">{proposal.trigger.label}</p>
          <p className="mt-1 text-xs text-white/42">{proposal.trigger.timezone ?? 'Local timezone'}</p>
        </div>
        <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/32">Destination</p>
          <p className="mt-2 text-sm font-semibold text-white/82">{proposal.destinationLabel}</p>
          {proposal.connectorsNeeded.length ? <p className="mt-1 text-xs text-amber-200/58">Requires connector: {proposal.connectorsNeeded.join(', ')}</p> : <p className="mt-1 text-xs text-emerald-200/52">No external connector required</p>}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[0.9fr,1.1fr]">
        <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/32">Sources</p>
          <div className="mt-3 flex flex-wrap gap-2">{proposal.sources.map((source) => <span key={source} className="rounded-full border border-white/[0.09] bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/58">{source}</span>)}</div>
        </div>
        <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/32">Outputs</p>
          <div className="mt-3 flex flex-wrap gap-2">{proposal.outputs.map((output) => <span key={output} className="rounded-full border border-emerald-300/15 bg-emerald-400/[0.06] px-2.5 py-1 text-[11px] text-emerald-100/70">{output}</span>)}</div>
        </div>
      </div>

      <div className="mt-4 rounded-[16px] border border-white/[0.07] bg-white/[0.025] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/32">Steps</p>
        <div className="mt-3 grid gap-2">
          {proposal.steps.map((step, index) => (
            <div key={`${step}-${index}`} className="flex items-center gap-3 rounded-[12px] border border-white/[0.06] bg-black/15 px-3 py-2">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/[0.09] text-[10px] font-bold text-white/48">{index + 1}</span>
              <span className="text-xs font-medium text-white/68">{step}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-[16px] border border-amber-300/18 bg-amber-400/[0.06] p-4">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-200/80" />
        <div>
          <p className="text-xs font-bold text-amber-100/85">Approval</p>
          <p className="mt-1 text-xs leading-5 text-amber-100/58">{proposal.approval}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={onOpen} className="rounded-[12px] bg-[#ffffff] px-4 py-2.5 text-sm font-bold text-[#070B14] transition hover:bg-[#f0f2ff]">Open Workflow</button>
        <button onClick={onRunTest} className="rounded-[12px] border border-violet-300/20 bg-violet-400/[0.08] px-4 py-2.5 text-sm font-semibold text-violet-100 transition hover:bg-violet-400/[0.12]">Run Test</button>
        <button className="rounded-[12px] border border-white/[0.10] bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white/58 transition hover:text-white">Edit Proposal</button>
        <button onClick={onCancel} className="rounded-[12px] border border-white/[0.08] px-4 py-2.5 text-sm font-semibold text-white/38 transition hover:text-white/64">Cancel</button>
      </div>
    </div>
  );
}

export function WorkflowStepPopover({
  open,
  anchorRef,
  onClose,
  onSelect,
  avoidRight = 420,
}: {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  onSelect: (type: WorkflowNodeType) => void;
  avoidRight?: number;
}) {
  const [style, setStyle] = React.useState<React.CSSProperties>({ opacity: 0, pointerEvents: 'none' });

  React.useEffect(() => {
    if (!open) return;
    const update = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const width = 260;
      const maxHeight = Math.min(440, window.innerHeight - 24);
      const gap = 10;
      const inspectorBoundary = window.innerWidth - avoidRight;
      const spaces = {
        right: Math.min(window.innerWidth - rect.right - gap - 12, inspectorBoundary - rect.right - gap),
        left: rect.left - gap - 12,
        below: window.innerHeight - rect.bottom - gap - 12,
        above: rect.top - gap - 12,
      };
      let left = rect.right + gap;
      let top = rect.top;
      if (spaces.right < width && spaces.left >= width) left = rect.left - width - gap;
      else if (spaces.right < width && spaces.below > spaces.above) { left = rect.left; top = rect.bottom + gap; }
      else if (spaces.right < width) { left = rect.left; top = rect.top - Math.min(maxHeight, 360) - gap; }
      left = Math.max(12, Math.min(left, Math.min(window.innerWidth - width - 12, inspectorBoundary - width - 12)));
      top = Math.max(12, Math.min(top, window.innerHeight - Math.min(maxHeight, 360) - 12));
      setStyle({ position: 'fixed', left, top, width, maxHeight, zIndex: WORKFLOW_Z.popover });
    };
    update();
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('keydown', onKey);
    };
  }, [anchorRef, avoidRight, onClose, open]);

  if (!open) return null;
  return createPortal(
    <>
      <div className="fixed inset-0" style={{ zIndex: WORKFLOW_Z.popover - 1 }} onMouseDown={onClose} />
      <div
        data-workflow-popover
        className="overflow-y-auto rounded-[16px] border border-white/[0.09] bg-[#090d17]/98 p-2 shadow-[0_24px_70px_rgba(0,0,0,0.52)] backdrop-blur-xl"
        style={style}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {WORKFLOW_NODE_TYPE_OPTIONS.map((item) => (
          <button key={item.type} onClick={() => { onSelect(item.type); onClose(); }} className="block w-full rounded-[11px] px-3 py-2 text-left transition hover:bg-white/[0.05]">
            <span className="block text-xs font-bold text-white/76">{item.label}</span>
            <span className="mt-0.5 block text-[10px] leading-4 text-white/34">{item.description}</span>
          </button>
        ))}
      </div>
    </>,
    document.body,
  );
}

export function WorkflowNodeCard({
  node, selected, dimmed, connectingFrom, menuOpen, onToggleMenu, onCloseMenus, onSelect, onStartConnect, onCompleteConnect, onAddNext, onDuplicate, onDelete, onTest, onDrag,
}: {
  node: WorkflowNode;
  selected: boolean;
  dimmed: boolean;
  connectingFrom: string | null;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenus: () => void;
  onSelect: () => void;
  onStartConnect: (nodeId: string) => void;
  onCompleteConnect: (nodeId: string) => void;
  onAddNext: (nodeId: string, type?: WorkflowNodeType) => void;
  onDuplicate: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onTest: (nodeId: string) => void;
  onDrag: (nodeId: string, position: { x: number; y: number }) => void;
}) {
  const Icon = workflowNodeIcon[node.type];
  const model = node.type === 'ai_step' ? resolveModelForCapability((node.config.capability as AgentCapability) ?? 'text_reasoning') : null;
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);
  const dragRef = React.useRef<{ startX: number; startY: number; nodeX: number; nodeY: number } | null>(null);
  const hasInput = node.type !== 'trigger';
  const hasOutput = node.type !== 'output';
  const accent =
    node.status === 'failed' ? 'border-rose-300/38 shadow-[0_0_30px_rgba(244,63,94,0.12)]' :
    node.status === 'warning' ? 'border-amber-300/38 shadow-[0_0_28px_rgba(251,191,36,0.11)]' :
    node.status === 'success' ? 'border-emerald-300/30 shadow-[0_0_28px_rgba(45,212,191,0.10)]' :
    node.status === 'needs_approval' ? 'border-amber-300/38 shadow-[0_0_28px_rgba(251,191,36,0.11)]' :
    node.status === 'running' ? 'border-cyan-300/40 shadow-[0_0_32px_rgba(34,211,238,0.16)]' :
    selected ? 'border-violet-300/55 shadow-[0_0_36px_rgba(124,92,252,0.18)]' :
    'border-white/[0.08]';

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('[data-node-control]')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { startX: event.clientX, startY: event.clientY, nodeX: node.position.x, nodeY: node.position.y };
    onCloseMenus();
    onSelect();
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const next = {
      x: Math.max(24, dragRef.current.nodeX + event.clientX - dragRef.current.startX),
      y: Math.max(24, dragRef.current.nodeY + event.clientY - dragRef.current.startY),
    };
    onDrag(node.id, next);
  };
  const stopDrag = () => { dragRef.current = null; };
  const toolbarBelow = node.position.y < 86;

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={stopDrag}
      onPointerCancel={stopDrag}
      className={`group absolute overflow-visible rounded-[18px] border p-4 text-left shadow-[0_20px_58px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.045)] transition hover:-translate-y-0.5 hover:border-white/[0.18] ${accent} ${node.status === 'running' ? 'animate-pulse' : ''}`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: WORKFLOW_NODE_SIZE.width,
        minHeight: WORKFLOW_NODE_SIZE.height,
        zIndex: selected ? WORKFLOW_Z.selectedNode : WORKFLOW_Z.node,
        opacity: selected ? 1 : dimmed ? 0.93 : 0.97,
        isolation: 'isolate',
      }}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[18px] bg-[rgba(8,12,24,0.88)] backdrop-blur-[14px] backdrop-saturate-150">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(124,92,252,0.13),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.01))]" />
        <div className="absolute inset-0 rounded-[18px] ring-1 ring-white/[0.045]" />
      </div>
      {hasInput && (
        <button data-node-control onPointerDown={(event) => { event.stopPropagation(); onCompleteConnect(node.id); }} onClick={(event) => { event.stopPropagation(); onCompleteConnect(node.id); }} className={`absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-white/40 bg-[#070B14] shadow-[0_0_0_4px_rgba(7,11,20,0.92)] transition ${connectingFrom ? 'scale-125 border-cyan-200 bg-cyan-300' : 'hover:border-cyan-200 hover:bg-cyan-300'}`} style={{ zIndex: 3 }} title="Input handle" />
      )}
      {hasOutput && (
        <button data-node-control onPointerDown={(event) => { event.stopPropagation(); onStartConnect(node.id); }} onClick={(event) => { event.stopPropagation(); onStartConnect(node.id); }} className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-white/40 bg-[#070B14] shadow-[0_0_0_4px_rgba(7,11,20,0.92)] transition hover:scale-125 hover:border-cyan-200 hover:bg-cyan-300" style={{ zIndex: 3 }} title="Output handle" />
      )}
      <div className="relative flex items-start gap-3" style={{ zIndex: 2 }}>
        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-[13px] border shadow-[0_10px_24px_rgba(0,0,0,0.24)] ${workflowNodeTone[node.type]}`}><Icon className="h-4 w-4" /></div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-bold text-white/92 [text-shadow:0_1px_8px_rgba(0,0,0,0.65)]">{node.title}</p>
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold capitalize shadow-[0_6px_18px_rgba(0,0,0,0.22)] backdrop-blur-md ${workflowStatusTone[node.status]}`}>{node.status.replace('_', ' ')}</span>
          </div>
          <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-white/56 [text-shadow:0_1px_8px_rgba(0,0,0,0.55)]">{node.description}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full border border-white/[0.11] bg-[#080b14]/75 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/52 shadow-[0_6px_16px_rgba(0,0,0,0.22)] backdrop-blur-md">{workflowNodeTypeLabel(node.type)}</span>
            {node.type === 'ai_step' ? <span className="rounded-full border border-violet-300/20 bg-violet-400/[0.12] px-2 py-0.5 text-[9px] font-semibold text-violet-100/78 shadow-[0_6px_16px_rgba(0,0,0,0.22)] backdrop-blur-md">Model: {modelRoutingLabel(node.modelRoutingPreference ?? (node.config.modelRouting as ModelRoutingPreference) ?? 'auto')}</span> : model ? <span className="rounded-full border border-violet-300/20 bg-violet-400/[0.12] px-2 py-0.5 text-[9px] font-semibold text-violet-100/78 shadow-[0_6px_16px_rgba(0,0,0,0.22)] backdrop-blur-md">{model.displayName}</span> : null}
            {(node.promptNote || node.userInstructions?.length) ? <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.11] bg-[#080b14]/75 px-2 py-0.5 text-[9px] font-semibold text-white/56 shadow-[0_6px_16px_rgba(0,0,0,0.22)] backdrop-blur-md"><StickyNote className="h-2.5 w-2.5" /> Note</span> : null}
          </div>
        </div>
      </div>
      <div data-node-control className={`absolute right-0 flex items-center gap-1 rounded-[12px] border border-white/[0.08] bg-[#090d17]/95 p-1 shadow-[0_12px_30px_rgba(0,0,0,0.32)] backdrop-blur transition ${toolbarBelow ? 'top-[calc(100%+10px)]' : 'bottom-[calc(100%+10px)]'} ${selected ? 'opacity-100' : 'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100'}`} style={{ zIndex: WORKFLOW_Z.toolbar }}>
        <button ref={menuButtonRef} onClick={(event) => { event.stopPropagation(); onToggleMenu(); }} className="rounded-[9px] p-1.5 text-white/54 hover:bg-white/[0.06] hover:text-white" title="Add next step"><Plus className="h-3.5 w-3.5" /></button>
        <button onClick={() => onDuplicate(node.id)} className="rounded-[9px] p-1.5 text-white/54 hover:bg-white/[0.06] hover:text-white" title="Duplicate"><Square className="h-3.5 w-3.5" /></button>
        <button onClick={() => onTest(node.id)} className="rounded-[9px] p-1.5 text-white/54 hover:bg-white/[0.06] hover:text-white" title="Test this step"><Play className="h-3.5 w-3.5" /></button>
        <button onClick={onSelect} className="rounded-[9px] p-1.5 text-white/54 hover:bg-white/[0.06] hover:text-white" title="Configure"><Settings className="h-3.5 w-3.5" /></button>
        <button onClick={() => onDelete(node.id)} className="rounded-[9px] p-1.5 text-rose-200/58 hover:bg-rose-400/[0.08] hover:text-rose-100" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
      <WorkflowStepPopover open={menuOpen} anchorRef={menuButtonRef} onClose={onCloseMenus} onSelect={(type) => onAddNext(node.id, type)} />
    </div>
  );
}

export function WorkflowField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-[11px] font-semibold text-white/42">{label}</span><div className="mt-1.5">{children}</div></label>;
}

export const workflowInputClass = 'w-full rounded-[12px] border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-violet-300/35';
export const workflowSelectClass = 'w-full rounded-[12px] border border-white/[0.08] bg-[#080b14] px-3 py-2.5 text-sm text-white/72 outline-none focus:border-violet-300/35';

export function WorkflowNodeInspector({ workflow, node, onUpdateNode, onDeleteNode, onConnectConnector, onApproveConnector, onRunNode }: { workflow: WorkflowDef; node?: WorkflowNode; onUpdateNode: (nodeId: string, patch: Partial<WorkflowNode>) => void; onDeleteNode: (nodeId: string) => void; onConnectConnector: (provider: string) => void; onApproveConnector: (provider: string) => void; onRunNode: (nodeId: string) => void }) {
  const [instructionText, setInstructionText] = React.useState('');
  const [preview, setPreview] = React.useState<{ node: WorkflowNode; changes: NodeChange[] } | null>(null);
  React.useEffect(() => {
    setInstructionText('');
    setPreview(null);
  }, [node?.id]);
  if (!node) return <aside className="w-[380px] shrink-0 border-l border-white/[0.07] bg-[#070B14] p-5" style={{ zIndex: WORKFLOW_Z.inspector }}><p className="text-sm font-bold text-white/70">Select a node</p><p className="mt-2 text-xs leading-5 text-white/38">Click a workflow node to edit trigger, source, AI step, approval, or output settings.</p></aside>;
  const updateConfig = (key: keyof WorkflowNodeConfig, value: unknown) => {
    const nextConfig = { ...node.config, [key]: value } as WorkflowNodeConfig;
    const nextNode = { ...node, config: nextConfig };
    const validation = validateWorkflowNode(nextNode);
    onUpdateNode(node.id, { config: nextConfig, validation, status: validation.isValid ? 'configured' : 'warning' });
  };
  const updateNestedConfig = (key: string, value: unknown) => {
    const nextConfig = setWorkflowConfigValue(node.config, key, value);
    const nextNode = { ...node, config: nextConfig };
    const validation = validateWorkflowNode(nextNode);
    onUpdateNode(node.id, { config: nextConfig, validation, status: validation.isValid ? 'configured' : 'warning' });
  };
  const updateModelRouting = (preference: ModelRoutingPreference) => onUpdateNode(node.id, { modelRoutingPreference: preference, config: { ...node.config, modelPreference: preference, modelRouting: preference }, validation: validateWorkflowNode({ ...node, config: { ...node.config, modelPreference: preference, modelRouting: preference } }) });
  const updateOutputDestination = (nextDestination: WorkflowDestinationType) => {
    const nextConfig: WorkflowNodeConfig = {
      ...node.config,
      destination: nextDestination,
      connectionStatus: isExternalWorkflowDestination(nextDestination) ? 'permission_required' : 'connected',
      approvalRequired: isExternalWorkflowDestination(nextDestination) ? true : node.config.approvalRequired,
      approvalType: nextDestination === 'gmail' || nextDestination === 'email_after_approval' ? 'before_sending' : isExternalWorkflowDestination(nextDestination) ? 'before_saving' : node.config.approvalType,
    };
    onUpdateNode(node.id, { config: nextConfig, validation: validateWorkflowNode({ ...node, config: nextConfig }) });
  };
  const destination = (node.config.destination ?? 'chat') as WorkflowDestinationType;
  const connectorProvider = WORKFLOW_DESTINATION_OPTIONS.find((item) => item.value === destination)?.requiresConnector;
  const connector = getWorkflowConnector(workflow, connectorProvider);
  const nodeValidation = validateWorkflowNode(node);
  const applyInstructionPreview = () => {
    const next = applyInstructionToNode(node, instructionText);
    setPreview(next);
  };
  const confirmInstruction = () => {
    if (!preview) return;
    const instruction: NodeInstruction = {
      id: `ni-${Date.now()}`,
      text: instructionText.trim(),
      createdAt: new Date().toISOString(),
      appliedChanges: preview.changes,
    };
    onUpdateNode(node.id, {
      ...preview.node,
      userInstructions: [instruction, ...(node.userInstructions ?? [])],
      instructionHistory: [instruction, ...(node.instructionHistory ?? node.userInstructions ?? [])],
    });
    setPreview(null);
    setInstructionText('');
  };
  const undoLastInstruction = () => {
    const [last, ...rest] = node.userInstructions ?? [];
    if (!last) return;
    const restored: Partial<WorkflowNode> = { userInstructions: rest, instructionHistory: rest, config: { ...node.config } };
    last.appliedChanges.slice().reverse().forEach((change) => {
      if (change.field.startsWith('config.')) (restored.config as Record<string, any>)[change.field.slice(7)] = change.before;
      else (restored as Record<string, any>)[change.field] = change.before;
    });
    onUpdateNode(node.id, restored);
  };
  return (
    <aside className="w-[380px] shrink-0 overflow-y-auto border-l border-white/[0.07] bg-[#070B14] p-5" style={{ zIndex: WORKFLOW_Z.inspector }}>
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">Inspector</p><h3 className="mt-2 text-lg font-bold text-white/88">{node.title}</h3><p className="mt-1 text-xs capitalize text-white/40">{node.type.replace('_', ' ')}</p></div>
        <button onClick={() => onDeleteNode(node.id)} className="rounded-[10px] border border-rose-300/15 bg-rose-400/[0.06] p-2 text-rose-200/70 transition hover:text-rose-100" title="Delete node"><Trash2 className="h-4 w-4" /></button>
      </div>
      <div className="mt-5 space-y-4">
        <WorkflowField label="Node title"><input value={node.title} onChange={(e) => onUpdateNode(node.id, { title: e.target.value })} className={workflowInputClass} /></WorkflowField>
        <WorkflowField label="Description"><textarea value={node.description ?? ''} onChange={(e) => onUpdateNode(node.id, { description: e.target.value })} className={`${workflowInputClass} min-h-[78px] resize-none`} /></WorkflowField>
        <div className="rounded-[16px] border border-violet-300/15 bg-violet-400/[0.055] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-violet-100/85">Tell this node what to change</p>
              <p className="mt-1 text-[11px] leading-5 text-white/38">Natural language edits are parsed locally for this MVP.</p>
            </div>
            {node.userInstructions?.length ? <button onClick={undoLastInstruction} className="rounded-[10px] border border-white/[0.10] px-2.5 py-1.5 text-[11px] font-bold text-white/50 hover:text-white">Undo</button> : null}
          </div>
          <textarea
            value={instructionText}
            onChange={(event) => setInstructionText(event.target.value)}
            placeholder="Describe what this step should do or change..."
            className={`${workflowInputClass} mt-3 min-h-[88px] resize-none`}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {['Change schedule', 'Add approval before this step', 'Change output format', 'Connect to Google Drive', 'Use faster model', 'Add error fallback'].map((suggestion) => (
              <button key={suggestion} onClick={() => setInstructionText(suggestion)} className="rounded-full border border-white/[0.08] bg-white/[0.035] px-2.5 py-1 text-[10px] font-semibold text-white/42 hover:text-white/72">{suggestion}</button>
            ))}
          </div>
          <button onClick={applyInstructionPreview} disabled={!instructionText.trim()} className="mt-3 rounded-[11px] bg-violet-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-violet-500 disabled:opacity-35">Apply</button>
          {preview && (
            <div className="mt-3 rounded-[13px] border border-white/[0.08] bg-black/20 p-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/32">Change preview</p>
              <div className="mt-2 space-y-1.5">
                {preview.changes.length ? preview.changes.map((change) => <p key={`${change.field}-${String(change.after)}`} className="text-xs text-white/58">{nodeChangeSummary(change)}</p>) : <p className="text-xs text-white/35">No config changes detected. Try a more specific instruction.</p>}
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={confirmInstruction} disabled={!preview.changes.length} className="rounded-[10px] bg-white px-3 py-1.5 text-xs font-bold text-[#070B14] disabled:opacity-40">Apply changes</button>
                <button onClick={() => setPreview(null)} className="rounded-[10px] border border-white/[0.10] px-3 py-1.5 text-xs font-semibold text-white/50 hover:text-white">Cancel</button>
              </div>
            </div>
          )}
          {(!nodeValidation.isValid || nodeValidation.warnings.length) ? <div className="mt-3 rounded-[12px] border border-amber-300/15 bg-amber-400/[0.06] p-3 text-xs leading-5 text-amber-100/70">{[...nodeValidation.missingFields, ...nodeValidation.warnings][0]}</div> : null}
        </div>

        {node.type === 'trigger' && <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-4"><p className="text-xs font-bold text-white/70">Trigger</p><div className="mt-3 grid gap-3"><WorkflowField label="Trigger type · Required"><select value={node.config.triggerType ?? 'manual'} onChange={(e) => updateConfig('triggerType', e.target.value as WorkflowTriggerKind)} className={workflowSelectClass}>{(['manual', 'schedule', 'webhook', 'file_added', 'app_event'] as const).map((item) => <option key={item} value={item}>{readableField(item)}</option>)}</select></WorkflowField>{node.config.triggerType === 'schedule' && <><WorkflowField label="Frequency · Required"><select value={node.config.schedule?.frequency ?? 'daily'} onChange={(e) => updateNestedConfig('schedule.frequency', e.target.value)} className={workflowSelectClass}>{(['daily', 'weekly', 'monthly', 'custom'] as const).map((item) => <option key={item} value={item}>{readableField(item)}</option>)}</select></WorkflowField><WorkflowField label="Day of week"><input value={node.config.schedule?.dayOfWeek ?? ''} onChange={(e) => updateNestedConfig('schedule.dayOfWeek', e.target.value)} placeholder="Monday" className={workflowInputClass} /></WorkflowField><WorkflowField label="Time · Required"><input value={node.config.schedule?.time ?? '09:00'} onChange={(e) => updateNestedConfig('schedule.time', e.target.value)} className={workflowInputClass} /></WorkflowField><WorkflowField label="Timezone"><input value={node.config.schedule?.timezone ?? 'Asia/Bangkok'} onChange={(e) => updateNestedConfig('schedule.timezone', e.target.value)} className={workflowInputClass} /></WorkflowField></>}<WorkflowField label="On error"><select value={node.config.errorHandling ?? 'ask_user'} onChange={(e) => updateConfig('errorHandling', e.target.value as WorkflowErrorHandling)} className={workflowSelectClass}>{['ask_user', 'retry', 'stop', 'continue'].map((item) => <option key={item} value={item}>{readableField(item)}</option>)}</select></WorkflowField><button onClick={() => onRunNode(node.id)} className="rounded-[12px] border border-cyan-300/18 bg-cyan-400/[0.08] px-3 py-2 text-xs font-bold text-cyan-100/80">Test trigger</button></div></div>}

        {node.type === 'source' && <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-4"><p className="text-xs font-bold text-white/70">Source</p><div className="mt-3 grid gap-3"><WorkflowField label="Source type · Required"><select value={node.config.sourceType ?? 'manual_input'} onChange={(e) => updateConfig('sourceType', e.target.value as WorkflowSourceType)} className={workflowSelectClass}>{(['file_upload', 'browser', 'google_drive', 'notion', 'gmail', 'sheets', 'manual_input'] as const).map((item) => <option key={item} value={item}>{readableField(item)}</option>)}</select></WorkflowField><WorkflowField label="Connection status"><select value={node.config.connectionStatus ?? 'not_connected'} onChange={(e) => updateConfig('connectionStatus', e.target.value as WorkflowConnectorStatus)} className={workflowSelectClass}>{(['not_connected', 'permission_required', 'connected'] as const).map((item) => <option key={item} value={item}>{readableField(item)}</option>)}</select></WorkflowField><WorkflowField label="Selected file/app/source"><input value={node.config.selectedSource ?? node.config.sourcePath ?? ''} onChange={(e) => updateConfig('selectedSource', e.target.value)} placeholder="Sales sheet, Drive folder, Gmail label..." className={workflowInputClass} /></WorkflowField><WorkflowField label="Read mode"><select value={node.config.readMode ?? 'extract'} onChange={(e) => updateConfig('readMode', e.target.value as WorkflowNodeConfig['readMode'])} className={workflowSelectClass}>{(['read_only', 'extract', 'sync'] as const).map((item) => <option key={item} value={item}>{readableField(item)}</option>)}</select></WorkflowField>{workflowSourceConnectionKey(node.config.sourceType) ? <div className="rounded-[12px] border border-amber-300/15 bg-amber-400/[0.06] p-3 text-xs leading-5 text-amber-100/62">{workflowSourceConnectionKey(node.config.sourceType)} is {node.config.connectionStatus ?? 'not_connected'}. Real OAuth/API execution is a backend TODO.<div className="mt-3 flex gap-2"><button onClick={() => updateConfig('connectionStatus', 'permission_required')} className="rounded-[10px] border border-amber-300/20 px-3 py-1.5 text-xs font-semibold text-amber-100/70">Connect</button><button onClick={() => updateConfig('connectionStatus', 'connected')} className="rounded-[10px] bg-amber-200 px-3 py-1.5 text-xs font-bold text-[#1a1202]">Approve mock</button></div></div> : null}<button onClick={() => onRunNode(node.id)} className="rounded-[12px] border border-white/[0.10] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/58">Test source</button></div></div>}

        {node.type === 'ai_step' && <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-4"><p className="text-xs font-bold text-white/70">AI Step</p><div className="mt-3 grid gap-3"><WorkflowField label="Step instruction · Required"><textarea value={node.config.instruction ?? node.description ?? ''} onChange={(e) => updateConfig('instruction', e.target.value)} className={`${workflowInputClass} min-h-[92px] resize-none`} /></WorkflowField><WorkflowField label="Input from nodes"><select multiple value={node.config.inputFrom ?? []} onChange={(e) => updateConfig('inputFrom', Array.from(e.currentTarget.selectedOptions).map((option) => option.value))} className={`${workflowSelectClass} min-h-[84px]`}>{workflow.nodes.filter((item) => item.id !== node.id).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></WorkflowField><WorkflowField label="Output format"><select value={node.config.outputFormat ?? 'summary'} onChange={(e) => updateConfig('outputFormat', e.target.value as WorkflowOutputFormat)} className={workflowSelectClass}>{(['summary', 'table', 'bullet_points', 'report', 'json', 'email_draft'] as const).map((item) => <option key={item} value={item}>{readableField(item)}</option>)}</select></WorkflowField><WorkflowField label="Tone"><select value={node.config.tone ?? 'professional'} onChange={(e) => updateConfig('tone', e.target.value as WorkflowTone)} className={workflowSelectClass}>{(['neutral', 'professional', 'friendly', 'concise'] as const).map((item) => <option key={item} value={item}>{readableField(item)}</option>)}</select></WorkflowField><WorkflowField label="Model routing"><select value={node.modelRoutingPreference ?? node.config.modelPreference ?? 'balanced'} onChange={(e) => updateModelRouting(e.target.value as ModelRoutingPreference)} className={workflowSelectClass}>{MODEL_ROUTING_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></WorkflowField><button onClick={() => updateConfig('reviewRequired', !node.config.reviewRequired)} className={`rounded-[12px] border px-3 py-2 text-left text-xs font-semibold ${node.config.reviewRequired ? 'border-amber-300/20 bg-amber-400/[0.08] text-amber-100/80' : 'border-white/[0.10] bg-white/[0.04] text-white/50'}`}>Review required: {node.config.reviewRequired ? 'On' : 'Off'}</button><div className="rounded-[12px] border border-violet-300/15 bg-violet-400/[0.06] p-3 text-xs text-violet-100/70">Current model: {node.config.model ?? resolveModelForCapability('text_reasoning').displayName}</div><button onClick={() => onRunNode(node.id)} className="rounded-[12px] border border-white/[0.10] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/58">Test step</button></div></div>}

        {node.type === 'transform' && <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-4"><p className="text-xs font-bold text-white/70">Transform</p><div className="mt-3 grid gap-3"><WorkflowField label="Transform type"><select value={node.config.transformType ?? 'clean'} onChange={(e) => updateConfig('transformType', e.target.value as WorkflowTransformType)} className={workflowSelectClass}>{(['clean', 'filter', 'merge', 'format', 'extract_fields'] as const).map((item) => <option key={item} value={item}>{readableField(item)}</option>)}</select></WorkflowField><WorkflowField label="Fields"><input value={(node.config.fields ?? []).join(', ')} onChange={(e) => updateConfig('fields', e.target.value.split(',').map((item) => item.trim()).filter(Boolean))} placeholder="name, email, total" className={workflowInputClass} /></WorkflowField><WorkflowField label="Output schema"><textarea value={JSON.stringify(node.config.outputSchema ?? {}, null, 2)} onChange={(e) => { try { updateConfig('outputSchema', JSON.parse(e.target.value || '{}')); } catch { updateConfig('outputSchema', node.config.outputSchema ?? {}); } }} className={`${workflowInputClass} min-h-[86px] resize-none font-mono text-xs`} /></WorkflowField><button onClick={() => onRunNode(node.id)} className="rounded-[12px] border border-white/[0.10] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/58">Test transform</button></div></div>}

        {node.type === 'condition' && <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-4"><p className="text-xs font-bold text-white/70">Condition</p><div className="mt-3 grid gap-3"><WorkflowField label="Condition text · Required"><textarea value={node.config.conditionText ?? ''} onChange={(e) => updateConfig('conditionText', e.target.value)} placeholder="If data is missing, stop and ask me..." className={`${workflowInputClass} min-h-[86px] resize-none`} /></WorkflowField><WorkflowField label="True path label"><input value={node.config.truePathLabel ?? 'Continue'} onChange={(e) => updateConfig('truePathLabel', e.target.value)} className={workflowInputClass} /></WorkflowField><WorkflowField label="False path label"><input value={node.config.falsePathLabel ?? 'Ask user'} onChange={(e) => updateConfig('falsePathLabel', e.target.value)} className={workflowInputClass} /></WorkflowField></div></div>}

        {node.type === 'approval' && <div className="rounded-[16px] border border-amber-300/15 bg-amber-400/[0.06] p-4"><p className="text-xs font-bold text-amber-100/85">Approval</p><div className="mt-3 grid gap-3"><button onClick={() => updateConfig('approvalRequired', !node.config.approvalRequired)} className={`rounded-[12px] border px-3 py-2 text-left text-xs font-semibold ${node.config.approvalRequired !== false ? 'border-amber-300/20 bg-amber-400/[0.08] text-amber-100/80' : 'border-white/[0.10] bg-white/[0.04] text-white/50'}`}>Required: {node.config.approvalRequired !== false ? 'On' : 'Off'}</button><WorkflowField label="Approval type"><select value={node.config.approvalType ?? 'before_external_action'} onChange={(e) => updateConfig('approvalType', e.target.value as WorkflowApprovalType)} className={workflowSelectClass}>{(['before_external_action', 'before_saving', 'before_sending', 'manual_review'] as const).map((item) => <option key={item} value={item}>{readableField(item)}</option>)}</select></WorkflowField><WorkflowField label="Approver"><select value={node.config.approver ?? 'user'} onChange={(e) => updateConfig('approver', e.target.value as WorkflowNodeConfig['approver'])} className={workflowSelectClass}><option value="user">User</option><option value="workspace_admin">Workspace admin</option></select></WorkflowField><WorkflowField label="Message shown to user"><textarea value={node.config.message ?? 'This workflow wants to save or send output externally.'} onChange={(e) => updateConfig('message', e.target.value)} className={`${workflowInputClass} min-h-[78px] resize-none`} /></WorkflowField></div></div>}

        {node.type === 'output' && <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-4"><p className="text-xs font-bold text-white/70">Output Destination</p><div className="mt-3 grid gap-3"><WorkflowField label="Destination · Required"><select value={destination} onChange={(e) => updateOutputDestination(e.target.value as WorkflowDestinationType)} className={workflowSelectClass}>{WORKFLOW_DESTINATION_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></WorkflowField><WorkflowField label="File format · Required"><select value={node.config.format ?? 'markdown'} onChange={(e) => updateConfig('format', e.target.value as WorkflowFileFormat)} className={workflowSelectClass}>{(['markdown', 'pdf', 'docx', 'csv', 'json', 'plain_text'] as const).map((item) => <option key={item} value={item}>{readableField(item)}</option>)}</select></WorkflowField><WorkflowField label="File/page name"><input value={node.config.fileName ?? 'workflow-output-{date}'} onChange={(e) => updateConfig('fileName', e.target.value)} className={workflowInputClass} /></WorkflowField><WorkflowField label="Folder / path"><input value={node.config.folderPath ?? ''} onChange={(e) => updateConfig('folderPath', e.target.value)} placeholder="/Colony Reports" className={workflowInputClass} /></WorkflowField><button onClick={() => updateConfig('approvalRequired', !node.config.approvalRequired)} className={`rounded-[12px] border px-3 py-2 text-left text-xs font-semibold ${node.config.approvalRequired ? 'border-amber-300/20 bg-amber-400/[0.08] text-amber-100/80' : 'border-white/[0.10] bg-white/[0.04] text-white/50'}`}>Approval before external save: {node.config.approvalRequired ? 'On' : 'Off'}</button>{connectorProvider ? <div className="rounded-[12px] border border-amber-300/15 bg-amber-400/[0.06] p-3"><p className="text-xs font-semibold text-amber-100/80">{connectorProvider} is {node.config.connectionStatus ?? connector?.status ?? 'not_connected'}.</p><p className="mt-1 text-[11px] leading-5 text-amber-100/55">Approval required before saving externally. Real connector execution is a backend TODO.</p><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => { updateConfig('connectionStatus', 'permission_required'); onConnectConnector(connectorProvider); }} className="rounded-[10px] border border-amber-300/20 px-3 py-1.5 text-xs font-semibold text-amber-100/70">Connect {connectorProvider}</button><button onClick={() => { updateConfig('connectionStatus', 'connected'); onApproveConnector(connectorProvider); }} className="rounded-[10px] bg-amber-200 px-3 py-1.5 text-xs font-bold text-[#1a1202]">Approve mock</button></div></div> : null}<button onClick={() => onRunNode(node.id)} className="rounded-[12px] border border-white/[0.10] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/58">Test output</button></div></div>}

        {node.type === 'notification' && <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-4"><p className="text-xs font-bold text-white/70">Notification</p><div className="mt-3 grid gap-3"><WorkflowField label="Channel"><select value={node.config.channel ?? 'in_app'} onChange={(e) => updateConfig('channel', e.target.value as WorkflowNotificationChannel)} className={workflowSelectClass}>{(['in_app', 'email', 'line', 'slack', 'discord'] as const).map((item) => <option key={item} value={item}>{readableField(item)}</option>)}</select></WorkflowField><WorkflowField label="Message template"><textarea value={node.config.messageTemplate ?? ''} onChange={(e) => updateConfig('messageTemplate', e.target.value)} className={`${workflowInputClass} min-h-[86px] resize-none`} /></WorkflowField><WorkflowField label="Send after"><input value={node.config.sendAfter ?? 'workflow completes'} onChange={(e) => updateConfig('sendAfter', e.target.value)} className={workflowInputClass} /></WorkflowField></div></div>}

        {['tool_action', 'connector'].includes(node.type) && <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-4"><p className="text-xs font-bold text-white/70">{workflowNodeTypeLabel(node.type)}</p><div className="mt-3 grid gap-3"><WorkflowField label="Action"><textarea value={node.config.rule ?? node.config.instruction ?? ''} onChange={(e) => updateConfig('rule', e.target.value)} placeholder="Describe the connected app action..." className={`${workflowInputClass} min-h-[86px] resize-none`} /></WorkflowField><WorkflowField label="Connection status"><select value={node.config.connectionStatus ?? 'not_connected'} onChange={(e) => updateConfig('connectionStatus', e.target.value as WorkflowConnectorStatus)} className={workflowSelectClass}>{(['not_connected', 'permission_required', 'connected'] as const).map((item) => <option key={item} value={item}>{readableField(item)}</option>)}</select></WorkflowField><button onClick={() => updateConfig('connectionStatus', 'connected')} className="rounded-[12px] border border-cyan-300/18 bg-cyan-400/[0.08] px-3 py-2 text-xs font-bold text-cyan-100/80">Approve mock connector</button></div></div>}
      </div>
    </aside>
  );
}

export function WorkflowBuilderPage({ workflow, selectedNodeId, selectedEdgeId, logs, onBack, onSelectNode, onSelectEdge, onUpdateNode, onDeleteNode, onDeleteEdge, onAddStep, onDuplicateNode, onConnectNodes, onRunTest, onRunNode, onSave, onToggleActive, onConnectConnector, onApproveConnector, onApplyTemplate }: { workflow: WorkflowDef; selectedNodeId: string | null; selectedEdgeId: string | null; logs: string[]; onBack: () => void; onSelectNode: (nodeId: string) => void; onSelectEdge: (edgeId: string | null) => void; onUpdateNode: (nodeId: string, patch: Partial<WorkflowNode>) => void; onDeleteNode: (nodeId: string) => void; onDeleteEdge: (edgeId: string) => void; onAddStep: (type?: WorkflowNodeType, fromNodeId?: string) => void; onDuplicateNode: (nodeId: string) => void; onConnectNodes: (from: string, to: string) => void; onRunTest: () => void; onRunNode: (nodeId: string) => void; onSave: () => void; onToggleActive: () => void; onConnectConnector: (provider: string) => void; onApproveConnector: (provider: string) => void; onApplyTemplate: (templateId: string) => void }) {
  const selectedNode = workflow.nodes.find((node) => node.id === selectedNodeId) ?? workflow.nodes[0];
  const [connectingFrom, setConnectingFrom] = React.useState<string | null>(null);
  const [zoom, setZoom] = React.useState(0.9);
  const [logsOpen, setLogsOpen] = React.useState(false);
  const [logFilter, setLogFilter] = React.useState<'all' | 'info' | 'warning' | 'error'>('all');
  const [topMenuOpen, setTopMenuOpen] = React.useState(false);
  const [openNodeMenuId, setOpenNodeMenuId] = React.useState<string | null>(null);
  const topMenuButtonRef = React.useRef<HTMLButtonElement>(null);
  const validation = workflowValidation(workflow);
  const progress = workflow.nodes.length ? Math.round((workflow.nodes.filter((node) => ['success', 'needs_approval'].includes(node.status)).length / workflow.nodes.length) * 100) : 0;
  const outputNode = workflow.nodes.find((node) => node.type === 'output');
  const outputDestination = (outputNode?.config.destination ?? 'chat') as WorkflowDestinationType;
  const outputProvider = workflowDestinationConnector(outputDestination);
  const outputConnector = getWorkflowConnector(workflow, outputProvider);
  const filteredLogs = logs.filter((log) => logFilter === 'all' || log.toLowerCase().includes(logFilter));
  const readinessItems = [
    { label: 'Trigger', good: Boolean(workflow.nodes.find((node) => node.type === 'trigger' && validateWorkflowNode(node).isValid)), node: workflow.nodes.find((node) => node.type === 'trigger') },
    { label: 'Source', good: Boolean(workflow.nodes.find((node) => node.type === 'source' && validateWorkflowNode(node).isValid)), node: workflow.nodes.find((node) => node.type === 'source') },
    { label: 'AI steps', good: workflow.nodes.filter((node) => node.type === 'ai_step').every((node) => validateWorkflowNode(node).isValid) && workflow.nodes.some((node) => node.type === 'ai_step'), node: workflow.nodes.find((node) => node.type === 'ai_step') },
    { label: 'Output destination', good: Boolean(workflow.nodes.find((node) => node.type === 'output' && validateWorkflowNode(node).isValid)), node: workflow.nodes.find((node) => node.type === 'output') },
    { label: 'Approval rule', good: !workflow.nodes.some((node) => node.type === 'output' && isExternalWorkflowDestination(node.config.destination)) || workflow.nodes.some((node) => node.type === 'approval' && validateWorkflowNode(node).isValid), node: workflow.nodes.find((node) => node.type === 'approval') },
  ];

  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setTopMenuOpen(false); setOpenNodeMenuId(null); setConnectingFrom(null); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); onSave(); }
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); onRunTest(); }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedEdgeId) onDeleteEdge(selectedEdgeId);
        else if (selectedNodeId) onDeleteNode(selectedNodeId);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onDeleteEdge, onDeleteNode, onRunTest, onSave, selectedEdgeId, selectedNodeId]);
  const closeWorkflowPopovers = React.useCallback(() => {
    setTopMenuOpen(false);
    setOpenNodeMenuId(null);
  }, []);

  const completeConnect = (toNodeId: string) => {
    if (!connectingFrom) return;
    onConnectNodes(connectingFrom, toNodeId);
    setConnectingFrom(null);
  };

  return (
    <div className="flex h-full flex-col bg-[#070B14] text-white/90">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/[0.07] bg-[#070B14]/95 px-5 py-4" style={{ zIndex: WORKFLOW_Z.inspector }}>
        <div className="flex items-center gap-3"><button onClick={onBack} className="rounded-[12px] border border-white/[0.08] bg-white/[0.04] p-2 text-white/55 transition hover:text-white" title="Back to chat"><ArrowLeft className="h-4 w-4" /></button><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200/55">Workflow Builder</p><h2 className="mt-1 text-lg font-bold text-white/90">{workflow.name}</h2></div><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold capitalize ${workflow.status === 'active' ? 'border-emerald-300/20 bg-emerald-400/[0.08] text-emerald-100' : workflow.status === 'testing' ? 'border-cyan-300/20 bg-cyan-400/[0.08] text-cyan-100' : workflow.status === 'paused' ? 'border-amber-300/20 bg-amber-400/[0.08] text-amber-100' : 'border-white/[0.10] bg-white/[0.04] text-white/48'}`}>{workflow.status}</span>{validation.ready ? <span className="hidden rounded-full border border-emerald-300/18 bg-emerald-400/[0.08] px-2.5 py-1 text-[10px] font-bold text-emerald-100 md:inline">Ready to test</span> : <span className="hidden rounded-full border border-amber-300/18 bg-amber-400/[0.08] px-2.5 py-1 text-[10px] font-bold text-amber-100 md:inline">{validation.headline}</span>}</div>
        <div className="flex flex-wrap items-center justify-end gap-2"><button onClick={onRunTest} className="flex items-center gap-2 rounded-[12px] border border-cyan-300/18 bg-cyan-400/[0.08] px-3 py-2 text-xs font-bold text-cyan-100/80"><Play className="h-3.5 w-3.5" /> Run test</button><button onClick={onSave} className="rounded-[12px] border border-white/[0.10] bg-white/[0.04] px-3 py-2 text-xs font-bold text-white/58">Save workflow</button><button onClick={onToggleActive} disabled={!validation.ready && workflow.status !== 'active'} className={`rounded-[12px] px-3 py-2 text-xs font-bold ${validation.ready || workflow.status === 'active' ? 'bg-white text-[#070B14]' : 'cursor-not-allowed border border-white/[0.08] bg-white/[0.03] text-white/28'}`}>{workflow.status === 'active' ? 'Pause workflow' : 'Activate workflow'}</button><button ref={topMenuButtonRef} onClick={() => { setOpenNodeMenuId(null); setTopMenuOpen((open) => !open); }} className="flex items-center gap-2 rounded-[12px] border border-white/[0.10] bg-white/[0.04] px-3 py-2 text-xs font-bold text-white/58"><Plus className="h-3.5 w-3.5" /> Add step</button><WorkflowStepPopover open={topMenuOpen} anchorRef={topMenuButtonRef} onClose={() => setTopMenuOpen(false)} onSelect={(type) => onAddStep(type)} /></div>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[260px] shrink-0 overflow-y-auto border-r border-white/[0.07] bg-[#060910] p-4 lg:block">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/28">Workflow</p>
          <div className="mt-4 rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-3"><p className="text-xs font-bold text-white/72">Readiness</p><div className="mt-3 space-y-2">{readinessItems.map((item) => <button key={item.label} onClick={() => item.node && onSelectNode(item.node.id)} className="flex w-full items-center gap-2 text-left text-[11px]"><span className={`grid h-4 w-4 place-items-center rounded-full text-[8px] font-bold ${item.good ? 'bg-emerald-400/18 text-emerald-200' : 'bg-amber-400/14 text-amber-200'}`}>{item.good ? '✓' : '!'}</span><span className={item.good ? 'text-white/55' : 'text-amber-100/65'}>{item.label}</span></button>)}</div></div>
          <div className="mt-4 space-y-2">{[
            { label: 'Overview', node: workflow.nodes[0] },
            { label: 'Trigger', node: workflow.nodes.find((node) => node.type === 'trigger') },
            { label: 'Sources', node: workflow.nodes.find((node) => node.type === 'source') },
            { label: 'Steps', node: workflow.nodes.find((node) => ['ai_step', 'transform', 'condition'].includes(node.type)) },
            { label: 'Outputs', node: workflow.nodes.find((node) => node.type === 'output') },
            { label: 'Approvals', node: workflow.nodes.find((node) => node.type === 'approval') },
            { label: 'Run history', node: selectedNode },
          ].map((item) => <button key={item.label} onClick={() => item.node && onSelectNode(item.node.id)} className="flex w-full items-center justify-between rounded-[12px] border border-white/[0.06] bg-white/[0.025] px-3 py-2.5 text-left text-xs font-semibold text-white/48 hover:bg-white/[0.05] hover:text-white/70">{item.label}<ChevronRight className="h-3.5 w-3.5 text-white/20" /></button>)}</div>
          <div className="mt-4"><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/28">Quick templates</p><div className="space-y-1.5">{WORKFLOW_TEMPLATES.map((template) => <button key={template.id} onClick={() => onApplyTemplate(template.id)} className="block w-full rounded-[11px] border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-left text-[11px] font-semibold text-white/48 hover:text-white/75">{template.label}</button>)}</div></div>
          <div className="mt-5 rounded-[16px] border border-amber-300/15 bg-amber-400/[0.06] p-3"><p className="text-xs font-bold text-amber-100/80">Approval-first</p><p className="mt-1 text-[11px] leading-5 text-amber-100/52">External reads and writes stop for approval before execution.</p></div>
          <div className="mt-4 rounded-[16px] border border-violet-300/15 bg-violet-400/[0.06] p-3"><p className="text-xs font-bold text-violet-100/80">Ask AI Ant</p><div className="mt-2 space-y-1 text-[11px] text-violet-100/55"><p>Add a Google Drive output</p><p>Make this run every Monday</p><p>Find missing configuration</p></div><button onClick={() => onAddStep('approval')} className="mt-3 rounded-[10px] border border-violet-200/20 px-3 py-1.5 text-xs font-bold text-violet-100/70">Simulate suggestion</button></div>
        </aside>
        <main className="relative min-w-0 flex-1 overflow-hidden bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:32px_32px]">
          <div onScroll={closeWorkflowPopovers} className="h-full overflow-auto" style={{ paddingBottom: WORKFLOW_CANVAS_BOTTOM_GUTTER }}>
          <div className="sticky left-4 top-4 z-20 flex w-fit gap-2 rounded-[14px] border border-white/[0.08] bg-[#080b14]/86 p-2 backdrop-blur"><button onClick={() => setZoom((value) => Math.min(1.3, value + 0.1))} className="rounded-[10px] p-2 text-white/50 hover:bg-white/[0.06] hover:text-white" title="Zoom in"><Plus className="h-3.5 w-3.5" /></button><button onClick={() => setZoom((value) => Math.max(0.62, value - 0.1))} className="rounded-[10px] p-2 text-white/50 hover:bg-white/[0.06] hover:text-white" title="Zoom out"><Minus className="h-3.5 w-3.5" /></button><button onClick={() => setZoom(0.9)} className="rounded-[10px] p-2 text-white/50 hover:bg-white/[0.06] hover:text-white" title="Fit view"><Maximize2 className="h-3.5 w-3.5" /></button><button onClick={() => workflow.nodes.forEach((node, index) => onUpdateNode(node.id, { position: { x: 140 + (index % 3) * 390, y: 100 + Math.floor(index / 3) * 220 } }))} className="rounded-[10px] p-2 text-white/50 hover:bg-white/[0.06] hover:text-white" title="Auto layout"><Network className="h-3.5 w-3.5" /></button></div>
          <div className="relative origin-top-left" style={{ width: WORKFLOW_CANVAS_SIZE.width, height: WORKFLOW_CANVAS_SIZE.height + WORKFLOW_CANVAS_BOTTOM_GUTTER, transform: `scale(${zoom})` }}>
            <svg className="absolute inset-0 h-full w-full overflow-visible" style={{ zIndex: WORKFLOW_Z.edge, pointerEvents: 'none' }}>
              <defs>
                <marker id="workflow-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(148,163,184,0.58)" /></marker>
                <marker id="workflow-arrow-active" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(103,232,249,0.92)" /></marker>
              </defs>
              {workflow.edges.map((edge) => { const from = workflow.nodes.find((node) => node.id === edge.from); const to = workflow.nodes.find((node) => node.id === edge.to); if (!from || !to) return null; const tone = workflowEdgeTone(edge, edge.id === selectedEdgeId, to); const path = workflowEdgePath(from, to); return <g key={edge.id} onClick={() => onSelectEdge(edge.id)} className="cursor-pointer" style={{ pointerEvents: 'auto' }}><path d={path} fill="none" stroke={tone.glow} strokeWidth={10} strokeLinecap="round" style={{ pointerEvents: 'none' }} /><path d={path} fill="none" stroke={tone.stroke} strokeWidth={tone.width} strokeLinecap="round" markerEnd={`url(#${edge.status === 'active' || edge.animated ? 'workflow-arrow-active' : 'workflow-arrow'})`} style={{ pointerEvents: 'none' }} /><path d={path} fill="none" stroke="transparent" strokeWidth={18} strokeLinecap="round" />{(edge.status === 'active' || edge.animated) && <circle r="4" fill="rgba(103,232,249,0.92)" style={{ pointerEvents: 'none' }}><animateMotion dur="1.25s" repeatCount="indefinite" path={path} /></circle>}</g>; })}
            </svg>
            {workflow.nodes.map((node) => <WorkflowNodeCard key={node.id} node={node} selected={node.id === selectedNode?.id} dimmed={Boolean(selectedNode?.id && node.id !== selectedNode.id)} connectingFrom={connectingFrom} menuOpen={openNodeMenuId === node.id} onToggleMenu={() => { setTopMenuOpen(false); setOpenNodeMenuId((id) => id === node.id ? null : node.id); }} onCloseMenus={closeWorkflowPopovers} onSelect={() => { onSelectNode(node.id); onSelectEdge(null); }} onStartConnect={(nodeId) => { closeWorkflowPopovers(); setConnectingFrom(nodeId); }} onCompleteConnect={completeConnect} onAddNext={(nodeId, type) => onAddStep(type, nodeId)} onDuplicate={onDuplicateNode} onDelete={onDeleteNode} onTest={onRunNode} onDrag={(nodeId, position) => onUpdateNode(nodeId, { position })} />)}
          </div>
          {connectingFrom && <div className="absolute left-1/2 top-5 -translate-x-1/2 rounded-full border border-cyan-300/24 bg-cyan-400/[0.10] px-3 py-1.5 text-xs font-bold text-cyan-100/80" style={{ zIndex: WORKFLOW_Z.runLogs }}>Choose an input handle to connect</div>}
          <div className="pointer-events-none absolute right-5 top-20 w-[260px] rounded-[18px] border border-white/[0.08] bg-[#080b14]/88 p-4 backdrop-blur" style={{ zIndex: WORKFLOW_Z.runLogs }}><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">Output destination</p><p className="mt-2 text-sm font-bold text-white/80">{WORKFLOW_DESTINATION_OPTIONS.find((item) => item.value === outputDestination)?.label ?? 'Chat result'}</p><p className="mt-1 text-xs text-white/40">{outputProvider ? `${outputProvider}: ${outputConnector?.status ?? 'not_connected'}` : 'No external connector needed'}</p><p className="mt-2 text-xs text-amber-100/55">{outputProvider ? 'Approval required before saving externally' : 'No approval needed for local preview'}</p></div>
          </div>
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex justify-center px-4 pb-4" style={{ zIndex: WORKFLOW_Z.runLogs }}>
            <div className="pointer-events-auto w-full max-w-[780px] overflow-hidden rounded-[18px] border border-white/[0.10] bg-[#080b14]/94 shadow-[0_18px_70px_rgba(0,0,0,0.44)] backdrop-blur-xl transition-[height]" style={{ height: logsOpen ? WORKFLOW_LOGS_EXPANDED_HEIGHT : WORKFLOW_LOGS_COLLAPSED_HEIGHT }}>
              <div className="sticky top-0 flex h-[52px] items-center justify-between gap-3 border-b border-white/[0.06] bg-[#080b14]/95 px-3 backdrop-blur-xl">
                <button onClick={() => setLogsOpen((open) => !open)} className="flex items-center gap-2 text-xs font-bold text-white/62"><ChevronDown className={`h-3.5 w-3.5 transition ${logsOpen ? '' : '-rotate-90'}`} />Run logs</button>
                <div className="flex items-center gap-2"><span className="text-[11px] text-white/30">{logs.length} events</span><div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300 transition-all" style={{ width: `${progress}%` }} /></div></div>
              </div>
              {logsOpen && <div className="h-[168px] px-3 pb-3 pt-3"><div className="flex flex-wrap gap-1.5">{(['all', 'info', 'warning', 'error'] as const).map((item) => <button key={item} onClick={() => setLogFilter(item)} className={`rounded-full border px-2.5 py-1 text-[10px] font-bold capitalize ${logFilter === item ? 'border-cyan-300/22 bg-cyan-400/[0.08] text-cyan-100' : 'border-white/[0.08] bg-white/[0.03] text-white/36'}`}>{item}</button>)}</div><div className="mt-2 grid max-h-[118px] gap-1.5 overflow-y-auto pr-1">{(filteredLogs.length ? filteredLogs : ['info: No test run yet.']).slice(-8).map((log, index) => <button key={`${log}-${index}`} onClick={() => { const found = workflow.nodes.find((node) => log.toLowerCase().includes(node.title.toLowerCase().slice(0, 10))); if (found) onSelectNode(found.id); }} className="rounded-[10px] border border-white/[0.06] bg-white/[0.035] px-3 py-2 text-left text-[11px] text-white/54 hover:text-white/76">{log}</button>)}</div></div>}
            </div>
          </div>
        </main>
        <WorkflowNodeInspector workflow={workflow} node={selectedNode} onUpdateNode={onUpdateNode} onDeleteNode={onDeleteNode} onConnectConnector={onConnectConnector} onApproveConnector={onApproveConnector} onRunNode={onRunNode} />
      </div>
    </div>
  );
}
