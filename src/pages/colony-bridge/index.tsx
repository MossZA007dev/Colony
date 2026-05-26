import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Check, Loader2, ShieldCheck, Square } from 'lucide-react';

// ── Device mode: action / permission flow ─────────────────────────────────────
export type DeviceActionStatus = 'permission_required' | 'approved' | 'running' | 'completed' | 'rejected' | 'failed';
export type DeviceAccessLevel = 'read-only' | 'edit' | 'export' | 'send';
export type DeviceActionVerb = 'read' | 'summarize' | 'inspect' | 'edit' | 'export' | 'send' | 'upload' | 'download';

export interface DeviceActionRequest {
  id: string;
  task: string;
  sourceTool: string;
  target: string;
  verb: DeviceActionVerb;
  accessLevel: DeviceAccessLevel;
  risk: 'low' | 'medium' | 'high';
  affectedData: string;
  status: DeviceActionStatus;
  progressStep: number;
  result?: string;
  approvedForProject?: boolean;
}

export const DEVICE_RUN_STEPS = [
  'Preparing secure access',
  'Reading selected source',
  'Extracting relevant information',
  'Creating result',
];

const DEVICE_ACCESS_FOR_VERB: Record<DeviceActionVerb, DeviceAccessLevel> = {
  read: 'read-only', summarize: 'read-only', inspect: 'read-only',
  edit: 'edit', export: 'export', download: 'export', send: 'send', upload: 'send',
};

export function analyzeDeviceAction(task: string): DeviceActionRequest {
  const t = task.toLowerCase();
  const verb: DeviceActionVerb =
    /screenshot|inspect|look at|view/.test(t) ? 'inspect' :
    /summari|tl;dr|brief/.test(t) ? 'summarize' :
    /\bsend\b|email|message|post|publish|share with/.test(t) ? 'send' :
    /upload/.test(t) ? 'upload' :
    /download/.test(t) ? 'download' :
    /export|save as|to csv|to pdf/.test(t) ? 'export' :
    /edit|update|write|modify|rename|delete|overwrite/.test(t) ? 'edit' :
    'read';
  const risk: 'low' | 'medium' | 'high' =
    /\bsend\b|email|message|post|publish|delete|remove|overwrite|spend|pay|transfer|external account/.test(t) ? 'high' :
    /edit|update|write|modify|export|upload|download|connect|cloud|drive|sync/.test(t) ? 'medium' :
    'low';
  const sourceTool =
    /browser|web|page|url|website|online/.test(t) ? 'Browser session' :
    /google drive|gdrive|\bdrive\b/.test(t) ? 'Google Drive' :
    /sheet|spreadsheet|excel/.test(t) ? 'Google Sheets' :
    /screenshot|screen/.test(t) ? 'Screen capture' :
    /gmail|email|inbox|mail/.test(t) ? 'Mail app' :
    /slack|notion|app\b/.test(t) ? 'Connected app' :
    'Local files (MacBook Pro)';
  const target =
    /spreadsheet|sheet|excel/.test(t) ? 'Selected spreadsheet' :
    /screenshot|screen/.test(t) ? 'Most recent screenshot' :
    /folder|directory/.test(t) ? 'Selected folder' :
    /browser|page|url|website/.test(t) ? 'Current browser page' :
    /email|inbox|mail/.test(t) ? 'Selected inbox thread' :
    'Selected file or source';
  const affectedData =
    risk === 'high' ? 'This may send, publish, delete, or change data outside this device.' :
    risk === 'medium' ? 'This will read and may modify or export the selected source.' :
    'This will only read the selected source. Nothing is sent or changed.';
  return {
    id: `dar-${Date.now()}`,
    task,
    sourceTool,
    target,
    verb,
    accessLevel: DEVICE_ACCESS_FOR_VERB[verb],
    risk,
    affectedData,
    status: 'permission_required',
    progressStep: 0,
  };
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



