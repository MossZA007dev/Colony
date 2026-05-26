import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { OSPageShell } from '../../components/shared/OSPageShell';
import type { Page } from '../../types/navigation';

const TEMPLATE_ITEMS = [
  { name: 'Weekly Sales Report Team', type: 'AI Team', category: 'Sales', agents: '5 agents', output: 'Report + spreadsheet', rating: 4.8, uses: '2.4k' },
  { name: 'Startup Market Research', type: 'Project', category: 'Startup', agents: '6 agents', output: 'Research + positioning', rating: 4.6, uses: '1.1k' },
  { name: 'Competitor Monitoring', type: 'Workflow', category: 'Research', agents: '3 agents', output: 'Monthly brief', rating: 4.7, uses: '890' },
  { name: 'AI Social Media Team', type: 'AI Team', category: 'Content', agents: '4 agents', output: 'Calendar + drafts', rating: 4.9, uses: '3.2k' },
  { name: 'Customer Support Triage', type: 'AI Team', category: 'Support', agents: '4 agents', output: 'Draft replies', rating: 4.5, uses: '1.7k' },
  { name: 'Monthly Finance Report', type: 'Workflow', category: 'Finance', agents: '5 agents', output: 'Finance report', rating: 4.8, uses: '640' },
] as const;

const TYPE_TONE: Record<string, string> = {
  'AI Team': 'text-violet-300 bg-violet-400/10 border-violet-400/20',
  'Project': 'text-blue-300 bg-blue-400/10 border-blue-400/20',
  'Workflow': 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20',
};

export function TemplatesCommunityPage({ setPage }: { setPage: (page: Page) => void }) {
  const [cat, setCat] = useState('All');
  const cats = ['All', 'Sales', 'Research', 'Content', 'Finance', 'Startup', 'Support'];
  const filtered = cat === 'All' ? TEMPLATE_ITEMS : TEMPLATE_ITEMS.filter(t => t.category === cat);
  return (
    <OSPageShell eyebrow="Reusable AI workforce setups" title="Template Community" subtitle="Discover, use, and remix AI team templates, workflow templates, and project setups.">
      <div className="mb-5 flex flex-wrap gap-2">
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${cat === c ? 'border-violet-400/40 bg-violet-400/15 text-white' : 'border-white/[0.09] bg-white/[0.03] text-white/48 hover:text-white/80'}`}>
            {c}
          </button>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((t) => (
          <div key={t.name} className="flex flex-col rounded-[20px] border border-white/[0.07] bg-white/[0.03] p-5 transition hover:border-white/[0.12]">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${TYPE_TONE[t.type] ?? ''}`}>{t.type}</span>
              <div className="flex items-center gap-1 text-[11px] text-amber-300">
                <Sparkles size={10} />
                {t.rating}
              </div>
            </div>
            <h3 className="font-heading text-[15px] font-bold text-white">{t.name}</h3>
            <p className="mt-1 text-sm text-white/45">{t.agents} · {t.output}</p>
            <p className="mt-2 text-[11px] text-white/28">Colony Community · {t.uses} uses</p>
            <div className="mt-auto pt-5 flex gap-2">
              <button onClick={() => setPage('AI Ant')} className="rounded-[10px] bg-[#ffffff] px-3 py-2 text-xs font-bold text-[#070B14] transition hover:bg-[#f0f2ff]">Use</button>
              <button className="rounded-[10px] border border-white/[0.18] bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white/65 transition hover:border-white/28 hover:bg-white/[0.09] hover:text-white/85">Remix</button>
            </div>
          </div>
        ))}
      </div>
    </OSPageShell>
  );
}
