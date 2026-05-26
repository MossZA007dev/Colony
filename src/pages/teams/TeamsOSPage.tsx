import React from 'react';
import { OSPageShell } from '../../components/shared/OSPageShell';
import { OSGridCards } from '../../components/shared/OSGridCards';
import type { Page } from '../../types/navigation';

export function TeamsOSPage({ setPage }: { setPage: (page: Page) => void }) {
  return (
    <OSPageShell eyebrow="AI workforce" title="AI Teams" subtitle="Manage existing AI teams. New teams are created through AI Ant when a goal needs multiple specialists."
      action={<button onClick={() => setPage('AI Ant')} className="rounded-[12px] bg-violet-600 px-4 py-2.5 text-sm font-bold text-white">Build AI Team</button>}>
      <OSGridCards cards={[
        { title: 'Sales Report Team', subtitle: 'AI Ant Director, Project Manager, Data Collector, Analyst, Report Writer.', meta: 'Produced 7 reports - last active 12m ago', status: 'Working', tone: 'emerald' },
        { title: 'Market Research Team', subtitle: 'Researcher, Competitor Analyst, Brand Strategist, Content Planner.', meta: '2 deliverables in progress', status: 'Planning', tone: 'blue' },
        { title: 'Customer Support Triage', subtitle: 'Inbox Reader, Classifier, Draft Writer, Approval Guard.', meta: 'Reusable team template', status: 'Idle', tone: 'violet' },
      ]} />
    </OSPageShell>
  );
}
