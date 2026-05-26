import React, { useState } from 'react';
import { FileText, ShieldCheck } from 'lucide-react';
import { OSPageShell } from '../../components/shared/OSPageShell';
import { BridgeConnections } from '../colony-bridge/BridgeConnections';
import { RequestHistory } from '../../components/bridge/RequestHistory';

const APPROVAL_ITEMS = [
  { id: 'a1', title: 'Export report to Google Sheets', agent: 'Report Writer', desc: 'Write the cleaned Daily Sales Report to the shared sheet.', file: 'sales-report-final.csv', requestedAgo: '4m ago', risk: 'Medium risk', riskTone: 'text-amber-300 bg-amber-400/10 border-amber-400/25' },
  { id: 'a2', title: 'Send summary to manager', agent: 'AI Ant', desc: 'External message prepared — review before sending.', file: null, requestedAgo: '2m ago', risk: 'High risk', riskTone: 'text-rose-300 bg-rose-400/10 border-rose-400/25' },
  { id: 'a3', title: 'Connect Slack workspace', agent: 'Customer Support Triage', desc: 'Needs read/write access for drafts and approvals.', file: null, requestedAgo: '18m ago', risk: 'Low risk', riskTone: 'text-blue-300 bg-blue-400/10 border-blue-400/25' },
] as const;

export function ApprovalsOSPage() {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const visible = APPROVAL_ITEMS.filter(a => !dismissed.includes(a.id));
  return (
    <OSPageShell eyebrow="Safety and control" title="Review before AI acts" subtitle="Approvals appear before AI sends messages, edits files, publishes content, or runs irreversible actions.">
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[20px] border border-white/[0.07] bg-white/[0.02] py-16 text-center">
          <ShieldCheck size={32} className="mb-3 text-emerald-400/60" />
          <p className="text-sm font-semibold text-white/40">All clear — no pending approvals</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((item) => (
            <div key={item.id} className="rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${item.riskTone}`}>{item.risk}</span>
                    <span className="text-[10px] text-white/30">{item.requestedAgo} · {item.agent}</span>
                  </div>
                  <h3 className="font-heading text-[15px] font-bold text-white">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/45">{item.desc}</p>
                  {item.file && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-white/30">
                      <FileText size={10} className="shrink-0" />{item.file}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => setDismissed(p => [...p, item.id])}
                  className="rounded-[10px] bg-violet-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-violet-500">
                  Approve
                </button>
                <button onClick={() => setDismissed(p => [...p, item.id])}
                  className="rounded-[10px] border border-white/[0.10] px-4 py-2 text-xs font-semibold text-white/50 transition hover:border-rose-500/30 hover:text-rose-300">
                  Deny
                </button>
                <button className="ml-auto rounded-[10px] border border-white/[0.08] px-3 py-2 text-xs text-white/35 transition hover:text-white/70">
                  Preview
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-8">
        <BridgeConnections />
        <RequestHistory />
      </div>
    </OSPageShell>
  );
}
