import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Globe,
  Lock,
  Mail,
  Smartphone,
  Table2,
} from 'lucide-react';
import type { WorkspacePreviewPayload } from '../../state/operatorTypes';

const PREVIEW_FRAME =
  'flex h-full w-full flex-col overflow-hidden rounded-[14px] border border-white/[0.07] bg-[#070b15]/85 shadow-[0_28px_80px_rgba(0,0,0,0.4)]';

function PreviewChrome({
  icon,
  title,
  meta,
  tone = 'neutral',
}: {
  icon: React.ReactNode;
  title: string;
  meta?: string;
  tone?: 'neutral' | 'amber' | 'emerald';
}) {
  const dotClass =
    tone === 'amber'
      ? 'bg-amber-300'
      : tone === 'emerald'
        ? 'bg-emerald-300'
        : 'bg-white/40';
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] border border-white/[0.08] bg-white/[0.03] text-white/55">
          {icon}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[12.5px] font-semibold text-white/85">{title}</span>
          {meta && <span className="block truncate text-[10.5px] text-white/35">{meta}</span>}
        </span>
      </div>
      <span className="inline-flex items-center gap-1.5 text-[10.5px] text-white/40">
        <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
        Live preview
      </span>
    </div>
  );
}

function BrowserPreview({ payload }: { payload: Extract<WorkspacePreviewPayload, { type: 'browser' }> }) {
  return (
    <div className={PREVIEW_FRAME}>
      <PreviewChrome
        icon={<Globe className="h-3.5 w-3.5" />}
        title={payload.title}
        meta={payload.url}
        tone="emerald"
      />
      <div className="flex items-center gap-2 border-b border-white/[0.05] bg-white/[0.015] px-4 py-2">
        <span className="grid h-5 w-5 place-items-center rounded-md bg-white/[0.04] text-white/40">
          <Lock className="h-3 w-3" />
        </span>
        <span className="truncate rounded-md bg-white/[0.04] px-2 py-1 text-[11px] font-mono text-white/55">
          https://{payload.url}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-200/65">Extracted</p>
        <h3 className="mt-1 font-heading text-[17px] font-extrabold text-white/95">{payload.title}</h3>
        <p className="mt-1 text-[12.5px] text-white/45">{payload.statusLine}</p>
        <ul className="mt-4 divide-y divide-white/[0.05] rounded-[12px] border border-white/[0.06] bg-white/[0.02]">
          {payload.highlights.map((h, idx) => (
            <motion.li
              key={h.label}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.22, delay: idx * 0.04 }}
              className="flex items-center justify-between gap-3 px-4 py-2.5"
            >
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-white/35">{h.label}</span>
              <span className="text-[13px] font-semibold text-white/85">{h.value}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function FilePreview({ payload }: { payload: Extract<WorkspacePreviewPayload, { type: 'file' }> }) {
  return (
    <div className={PREVIEW_FRAME}>
      <PreviewChrome
        icon={<FileText className="h-3.5 w-3.5" />}
        title={payload.fileName}
        meta={payload.fileKind.toUpperCase()}
      />
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-200/65">Reading file</p>
        <p className="mt-1 text-[13px] leading-relaxed text-white/72">{payload.summary}</p>
        <ul className="mt-4 flex flex-col gap-2">
          {payload.bullets.map((b, idx) => (
            <motion.li
              key={b}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: idx * 0.05 }}
              className="flex gap-2.5 rounded-[10px] border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-[12.5px] text-white/75"
            >
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-violet-300/80" />
              <span className="min-w-0 flex-1">{b}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SpreadsheetPreview({ payload }: { payload: Extract<WorkspacePreviewPayload, { type: 'spreadsheet' }> }) {
  return (
    <div className={PREVIEW_FRAME}>
      <PreviewChrome
        icon={<Table2 className="h-3.5 w-3.5" />}
        title={payload.title}
        meta={`${payload.rows.length} rows prepared`}
        tone="amber"
      />
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left text-[12px]">
          <thead className="sticky top-0 bg-white/[0.03] text-white/45">
            <tr>
              {payload.columns.map((col) => (
                <th key={col} className="border-b border-white/[0.06] px-4 py-2 text-[10.5px] font-semibold uppercase tracking-[0.1em]">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payload.rows.map((row, rIdx) => (
              <tr key={rIdx} className="text-white/75 odd:bg-white/[0.01]">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="border-b border-white/[0.04] px-4 py-2 tabular-nums">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-white/[0.06] bg-amber-400/[0.04] px-4 py-2 text-[11.5px] text-amber-100">
        {payload.statusLine}
      </div>
    </div>
  );
}

function EmailDraftPreview({ payload }: { payload: Extract<WorkspacePreviewPayload, { type: 'email_draft' }> }) {
  return (
    <div className={PREVIEW_FRAME}>
      <PreviewChrome
        icon={<Mail className="h-3.5 w-3.5" />}
        title="New draft"
        meta="Gmail"
        tone="amber"
      />
      <div className="border-b border-white/[0.05] bg-white/[0.015] px-5 py-3 text-[12px] text-white/55">
        <div className="grid grid-cols-[60px_1fr] gap-x-3 gap-y-1">
          <span className="text-white/35">From</span><span className="truncate text-white/72">{payload.from}</span>
          <span className="text-white/35">To</span><span className="truncate text-white/72">{payload.to}</span>
          <span className="text-white/35">Subject</span><span className="truncate font-semibold text-white/90">{payload.subject}</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto whitespace-pre-wrap px-5 py-4 font-sans text-[13px] leading-relaxed text-white/78">
        {payload.body}
      </div>
      <div className="border-t border-white/[0.06] bg-amber-400/[0.04] px-4 py-2 text-[11.5px] text-amber-100">
        {payload.statusLine}
      </div>
    </div>
  );
}

function QrPlaceholder() {
  // Static decorative QR-like grid. Not a real QR code.
  const cells = Array.from({ length: 81 }, (_, i) => {
    const seed = (i * 9301 + 49297) % 233280;
    return seed % 100 < 48;
  });
  return (
    <div className="grid h-44 w-44 grid-cols-9 gap-[3px] rounded-[12px] border border-white/[0.08] bg-white/[0.02] p-2">
      {cells.map((on, idx) => (
        <span
          key={idx}
          className={`aspect-square rounded-[2px] ${on ? 'bg-white/85' : 'bg-white/[0.04]'}`}
        />
      ))}
    </div>
  );
}

function DevicePairingPreview({ payload }: { payload: Extract<WorkspacePreviewPayload, { type: 'device_pairing' }> }) {
  return (
    <div className={PREVIEW_FRAME}>
      <PreviewChrome
        icon={<Smartphone className="h-3.5 w-3.5" />}
        title={payload.deviceLabel}
        meta="Pairing"
      />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-8">
        <QrPlaceholder />
        <div className="max-w-xs text-center">
          <p className="text-[13px] font-semibold text-white/85">Scan the code on your phone</p>
          <p className="mt-1 text-[12px] text-white/45">{payload.statusLine}</p>
        </div>
      </div>
    </div>
  );
}

function TransferProgressPreview({ payload }: { payload: Extract<WorkspacePreviewPayload, { type: 'transfer_progress' }> }) {
  const done = payload.progress >= 100;
  return (
    <div className={PREVIEW_FRAME}>
      <PreviewChrome
        icon={done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
        title={payload.fileName}
        meta={payload.sizeLabel}
        tone={done ? 'emerald' : 'neutral'}
      />
      <div className="flex flex-1 flex-col justify-center gap-6 px-8 py-8">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="rounded-[10px] border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/35">From</p>
            <p className="mt-1 truncate text-[12.5px] font-semibold text-white/85">{payload.from}</p>
          </div>
          <span className="grid h-8 w-8 place-items-center rounded-full border border-white/[0.08] bg-white/[0.02] text-white/55">
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
          <div className="rounded-[10px] border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/35">To</p>
            <p className="mt-1 truncate text-[12.5px] font-semibold text-white/85">{payload.to}</p>
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-[12px] text-white/55">{done ? 'Transfer complete' : 'Transferring'}</span>
            <span className="font-heading text-[15px] font-extrabold tabular-nums text-white/90">{payload.progress}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${payload.progress}%` }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full bg-gradient-to-r from-violet-400 to-emerald-300"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyPreview() {
  return (
    <div className={`${PREVIEW_FRAME} items-center justify-center`}>
      <div className="flex flex-col items-center gap-3 p-10 text-center">
        <span className="grid h-10 w-10 place-items-center rounded-[12px] border border-white/[0.06] bg-white/[0.02] text-white/50">
          <Globe className="h-4 w-4" />
        </span>
        <p className="font-heading text-[15px] font-extrabold text-white/85">Live workspace</p>
        <p className="max-w-xs text-[12.5px] leading-relaxed text-white/45">
          When the operator starts working, you will see the browser, file, or app it is using right here.
        </p>
      </div>
    </div>
  );
}

function UnsupportedPreview({ payload }: { payload: Extract<WorkspacePreviewPayload, { type: 'unsupported' }> }) {
  return (
    <div className={PREVIEW_FRAME}>
      <PreviewChrome icon={<AlertTriangle className="h-3.5 w-3.5" />} title="Not currently supported" meta="Operator cannot continue here" />
      <div className="flex flex-1 flex-col gap-4 px-6 py-6">
        <p className="text-[13px] leading-relaxed text-white/72">{payload.reason}</p>
        <ul className="flex flex-col gap-2">
          {payload.alternatives.map((alt) => (
            <li key={alt} className="flex gap-2.5 rounded-[10px] border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[12.5px] text-white/72">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-orange-300/85" />
              <span className="min-w-0 flex-1">{alt}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function WorkspaceRenderer({ payload }: { payload: WorkspacePreviewPayload }) {
  switch (payload.type) {
    case 'browser':           return <BrowserPreview payload={payload} />;
    case 'file':              return <FilePreview payload={payload} />;
    case 'spreadsheet':       return <SpreadsheetPreview payload={payload} />;
    case 'email_draft':       return <EmailDraftPreview payload={payload} />;
    case 'device_pairing':    return <DevicePairingPreview payload={payload} />;
    case 'transfer_progress': return <TransferProgressPreview payload={payload} />;
    case 'unsupported':       return <UnsupportedPreview payload={payload} />;
    case 'empty':
    default:                  return <EmptyPreview />;
  }
}
