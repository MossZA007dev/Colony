import React, { useState } from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import { OSPageShell } from '../../components/shared/OSPageShell';
import { skillsForCapabilities, SkillModelPills } from '../../lib/modelDisplay';

const CONNECTOR_CATEGORIES = ['All', 'Files & Storage', 'Communication', 'Productivity', 'Browser & Web', 'Data & Analytics', 'Developer Tools', 'Local Device', 'Automation', 'Finance', 'Social Media'] as const;

const CONNECTOR_LIST: { name: string; category: string; status: 'Connected' | 'Needs re-auth' | 'Not connected' | 'Restricted' | 'Coming soon'; desc: string; perms: string; usedBy: string }[] = [
  { name: 'Google Drive', category: 'Files & Storage', status: 'Connected', desc: 'Read and organize approved project files.', perms: 'Read files, create drafts', usedBy: '2 projects' },
  { name: 'Gmail', category: 'Communication', status: 'Needs re-auth', desc: 'Draft replies and summarize inbox with approval.', perms: 'Read email, draft only', usedBy: '1 agent' },
  { name: 'Google Sheets', category: 'Data & Analytics', status: 'Connected', desc: 'Analyze spreadsheets and write approved updates.', perms: 'Read/write with approval', usedBy: 'Sales team' },
  { name: 'Slack', category: 'Communication', status: 'Not connected', desc: 'Summarize channels and draft team updates.', perms: 'Draft messages', usedBy: '—' },
  { name: 'Notion', category: 'Productivity', status: 'Not connected', desc: 'Sync docs and turn notes into project knowledge.', perms: 'Read/write pages', usedBy: '—' },
  { name: 'Web Browser', category: 'Browser & Web', status: 'Connected', desc: 'Browse and extract data from public pages.', perms: 'Read web pages', usedBy: 'Research team' },
  { name: 'Local Files', category: 'Local Device', status: 'Restricted', desc: 'Read selected folders on this device.', perms: 'Read-only folders', usedBy: '—' },
  { name: 'GitHub', category: 'Developer Tools', status: 'Coming soon', desc: 'Summarize issues, PRs, and release notes.', perms: 'Read repositories', usedBy: '—' },
  { name: 'Stripe', category: 'Finance', status: 'Coming soon', desc: 'Summarize revenue and flag anomalies.', perms: 'Read-only', usedBy: '—' },
  { name: 'X / Twitter', category: 'Social Media', status: 'Coming soon', desc: 'Draft and schedule posts with approval.', perms: 'Draft posts', usedBy: '—' },
];

const STATUS_TONE: Record<string, string> = {
  Connected: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  'Needs re-auth': 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  'Not connected': 'border-white/[0.12] text-white/45',
  Restricted: 'border-blue-400/30 bg-blue-400/10 text-blue-300',
  'Coming soon': 'border-white/[0.1] text-white/35',
};

const CONNECTOR_BRAND: Record<string, { bg: string; text: string; abbr: string }> = {
  'Google Drive':  { bg: '#1a73e8', text: '#fff', abbr: 'GD' },
  'Gmail':         { bg: '#ea4335', text: '#fff', abbr: 'GM' },
  'Google Sheets': { bg: '#34a853', text: '#fff', abbr: 'GS' },
  'Slack':         { bg: '#4a154b', text: '#fff', abbr: 'SL' },
  'Notion':        { bg: '#1c1c1c', text: '#fff', abbr: 'NO' },
  'Web Browser':   { bg: '#2b6cb0', text: '#fff', abbr: 'WB' },
  'Local Files':   { bg: '#374151', text: '#fff', abbr: 'LF' },
  'GitHub':        { bg: '#24292e', text: '#fff', abbr: 'GH' },
  'Stripe':        { bg: '#635bff', text: '#fff', abbr: 'ST' },
  'X / Twitter':   { bg: '#000', text: '#fff', abbr: 'X' },
};

export function ConnectorsMarketplacePage() {
  const [cat, setCat] = useState<string>('All');
  const [query, setQuery] = useState('');
  const filtered = CONNECTOR_LIST.filter((c) =>
    (cat === 'All' || c.category === cat) &&
    (query === '' || c.name.toLowerCase().includes(query.toLowerCase())));

  return (
    <OSPageShell eyebrow="Integration marketplace" title="Connect tools for AI Ant" subtitle="Give AI Ant safe access to your files, apps, and services — with your approval every step of the way.">
      <div className="mb-4 flex items-start gap-2.5 rounded-[18px] border border-emerald-400/15 bg-emerald-400/[0.05] p-4 text-sm text-emerald-100/70">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
        AI Ant asks for approval before sending messages, editing files, publishing content, or sharing data.
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={query} onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-[14px] border border-white/[0.08] bg-white/[0.04] py-3 pl-9 pr-4 text-sm text-white outline-none placeholder:text-white/28 focus:border-violet-400/40"
            placeholder="Search connectors..."
          />
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {CONNECTOR_CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${cat === c ? 'border-violet-400/40 bg-violet-400/15 text-white' : 'border-white/[0.09] bg-white/[0.03] text-white/48 hover:text-white/80'}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c) => {
          const brand = CONNECTOR_BRAND[c.name];
          return (
            <div key={c.name} className="flex flex-col rounded-[20px] border border-white/[0.07] bg-white/[0.03] p-5 transition hover:border-white/[0.12]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] text-[13px] font-bold"
                    style={{ background: brand?.bg ?? 'rgba(255,255,255,0.08)', color: brand?.text ?? '#fff' }}>
                    {brand?.abbr ?? c.name[0]}
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-white/90">{c.name}</h3>
                    <p className="text-[11px] text-white/30">{c.category}</p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_TONE[c.status]}`}>{c.status}</span>
              </div>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-white/45">{c.desc}</p>
              <div className="mt-3 text-[11px] text-white/25">
                <span className="flex items-center gap-1"><ShieldCheck size={10} className="text-white/20" />{c.perms}</span>
              </div>
              <SkillModelPills
                skills={skillsForCapabilities(c.name === 'Web Browser' ? ['browser_action'] : c.category === 'Local Device' || c.category === 'Files & Storage' ? ['file_reading'] : ['connected_tool_action'])}
                compact
              />
              <p className="mt-2 text-[10px] text-white/28">{c.name === 'Web Browser' ? 'Browser Action · Approval required' : c.status === 'Connected' ? 'Colony Bridge · Read-only' : 'Colony Bridge · Approval-first'}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[11px] text-white/25">Used by: {c.usedBy}</span>
                <button disabled={c.status === 'Coming soon'}
                  className={`rounded-[10px] px-3 py-1.5 text-xs font-bold transition ${
                    c.status === 'Coming soon' ? 'cursor-default text-white/25' :
                    c.status === 'Connected' ? 'border border-white/[0.15] text-white/70 hover:bg-white/[0.05]' :
                    c.status === 'Needs re-auth' ? 'border border-amber-400/30 text-amber-300 hover:bg-amber-400/10' :
                    'bg-[#ffffff] text-[#070B14] hover:bg-[#f0f2ff]'}`}>
                  {c.status === 'Coming soon' ? 'Soon' : c.status === 'Connected' ? 'Manage' : c.status === 'Needs re-auth' ? 'Re-auth' : 'Connect'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </OSPageShell>
  );
}
