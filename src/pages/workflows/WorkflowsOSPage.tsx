import React from 'react';
import { OSPageShell } from '../../components/shared/OSPageShell';
import { OSGridCards } from '../../components/shared/OSGridCards';
import type { Page } from '../../types/navigation';

export function WorkflowsOSPage({ setPage }: { setPage: (page: Page) => void }) {
  return (
    <OSPageShell eyebrow="Repeatable processes" title="Workflows" subtitle="Workflows are repeatable processes AI Ant creates from natural language. The canvas stays in advanced mode."
      action={<button onClick={() => setPage('AI Ant')} className="rounded-[12px] bg-violet-600 px-4 py-2.5 text-sm font-bold text-white">Create workflow with AI Ant</button>}>
      <div className="mb-5 rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-4">
        <input className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30" placeholder="Describe the repeated task you want AI Ant to handle..." />
      </div>
      <OSGridCards cards={[
        { title: 'Weekly Sales Report', subtitle: 'Every Monday, summarize sales, flag changes, and create a report.', meta: 'Step 1 Read file - Step 2 Summarize - Step 3 Generate report - Step 4 Send after approval', status: 'Active', tone: 'emerald', capabilities: ['file_reading', 'summarization', 'workflow_automation'] },
        { title: 'Monthly Competitor Monitor', subtitle: 'Research competitor changes and deliver a strategy brief.', meta: 'Web research + quality review - Approval before external sends', status: 'Scheduled', tone: 'blue', capabilities: ['web_research', 'summarization', 'quality_review'] },
        { title: 'Content Pipeline', subtitle: 'Draft, review, and package weekly content deliverables.', meta: 'Creative/text workflow - Advanced canvas available', status: 'Paused', tone: 'amber', capabilities: ['text_reasoning', 'image_generation', 'quality_review'] },
      ]} />
    </OSPageShell>
  );
}
