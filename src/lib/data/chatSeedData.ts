import type { ChatProjectDef, ChatServer } from '../types/appTypes';

const glyph = {
  ant: '\uD83D\uDC1C',
  bowl: '\uD83C\uDF5C',
  bag: '\uD83D\uDED2',
  folder: '\uD83D\uDCC1',
  target: '\uD83C\uDFAF',
  test: '\uD83E\uDDEA',
  board: '\uD83D\uDCCB',
  shield: '\uD83D\uDEE1',
  chart: '\uD83D\uDCCA',
  collector: '\uD83D\uDCE5',
  cleaner: '\uD83E\uDDF9',
  writer: '\u270D\uFE0F',
  guard: '\uD83D\uDEE1',
  rocket: '\uD83D\uDE80',
  spark: '\u2726',
  play: '\u25B7',
  arrow: '\u2192',
  down: '\u2193',
  check: '\u2705',
  cross: '\u274C',
  warn: '\u26A0\uFE0F',
  bolt: '\u26A1',
  dot: '\u2022',
};

export const CHAT_PROJECTS: ChatProjectDef[] = [
  {
    id: 'daily-sales',
    emoji: '🐜',
    name: 'Daily Sales Report',
    projectStatus: 'waiting',
    instructions: 'Always summarize reports in Thai. Focus on profit, cost warnings, and delivery platform fees. Ask for approval before exporting any report. Use simple language for restaurant owners.',
    channels: [
      { id: 'team-room', name: 'team-room', type: 'main' },
      { id: 'sales-analysis', name: 'sales-analysis', type: 'analysis' },
      { id: 'approvals', name: 'approvals', type: 'approval' },
      { id: 'reports', name: 'reports', type: 'report' },
    ],
    initialMessages: [
      { role: 'agent', sender: 'AI Ant Scout', agentId: 'agent-ant', text: 'I found 42 orders from the LINE MAN screenshot.', timestamp: '09:00' },
      { role: 'agent', sender: 'Data Collector', agentId: 'agent-collector', text: 'I extracted total sales ฿4,920, GP fee ฿640, VAT ฿290, and order count of 42.', timestamp: '09:01' },
      { role: 'agent', sender: 'Data Cleaner', agentId: 'agent-cleaner', text: 'I cleaned duplicate rows and standardized the sales fields.', timestamp: '09:02' },
      { role: 'agent', sender: 'Sales Analyst', agentId: 'agent-analyst', text: 'Profit appears to be down by 18%. GP fee and packaging cost are the main drivers.', timestamp: '09:03' },
      { role: 'agent', sender: 'Report Writer', agentId: 'agent-writer', text: 'I can generate a daily profit report with key insights. Ready when you approve.', timestamp: '09:04' },
      { role: 'agent', sender: 'Approval Guard', agentId: 'agent-guard', text: 'Waiting for your approval. Nothing will be sent or exported without your confirmation.', timestamp: '09:05' },
    ],
  },
  {
    id: 'cost-report',
    emoji: '📊',
    name: 'Cost Report',
    projectStatus: 'done',
    channels: [
      { id: 'team-room', name: 'team-room', type: 'main' },
      { id: 'cost-analysis', name: 'cost-analysis', type: 'analysis' },
      { id: 'approvals', name: 'approvals', type: 'approval' },
      { id: 'reports', name: 'reports', type: 'report' },
    ],
    initialMessages: [
      { role: 'agent', sender: 'Data Collector', agentId: 'agent-collector', text: 'Weekly costs collected — packaging: ฿8,200 · labor: ฿12,000 · utilities: ฿3,400.', timestamp: '10:00' },
      { role: 'agent', sender: 'Data Cleaner', agentId: 'agent-cleaner', text: 'I normalized all cost categories. Data is clean and ready for analysis.', timestamp: '10:01' },
      { role: 'agent', sender: 'Sales Analyst', agentId: 'agent-analyst', text: 'Packaging cost is up 12% vs last week. Labor is within budget. Total cost: ฿23,600.', timestamp: '10:02' },
      { role: 'agent', sender: 'Report Writer', agentId: 'agent-writer', text: 'Weekly cost report is complete. Recommending a review of packaging contracts.', timestamp: '10:03' },
      { role: 'agent', sender: 'Approval Guard', agentId: 'agent-guard', text: 'Report ready to distribute. Waiting for your approval before any delivery.', timestamp: '10:04' },
    ],
  },
  {
    id: 'content-team',
    emoji: '✍️',
    name: 'Content Team',
    projectStatus: 'running',
    channels: [
      { id: 'team-room', name: 'team-room', type: 'main' },
      { id: 'research', name: 'research', type: 'research' },
      { id: 'script-writing', name: 'script-writing', type: 'writing' },
      { id: 'approvals', name: 'approvals', type: 'approval' },
      { id: 'publishing', name: 'publishing', type: 'publishing' },
    ],
    initialMessages: [
      { role: 'agent', sender: 'AI Ant Scout', agentId: 'agent-ant', text: 'Researched top food delivery trends this week. Found 5 relevant topics for content.', timestamp: '11:00' },
      { role: 'agent', sender: 'Data Collector', agentId: 'agent-collector', text: 'Collected customer reviews and competitor content from LINE MAN and Grab.', timestamp: '11:01' },
      { role: 'agent', sender: 'Report Writer', agentId: 'agent-writer', text: 'Drafting 3 short-form video scripts and 5 caption variations. Still writing...', timestamp: '11:02' },
      { role: 'agent', sender: 'Approval Guard', agentId: 'agent-guard', text: 'Scripts will need your review before publishing. Nothing goes live without approval.', timestamp: '11:03' },
    ],
  },
  {
    id: 'file-report',
    emoji: '📁',
    name: 'File Report',
    projectStatus: 'idle',
    channels: [
      { id: 'team-room', name: 'team-room', type: 'main' },
      { id: 'file-summary', name: 'file-summary', type: 'files' },
      { id: 'insights', name: 'insights', type: 'insights' },
      { id: 'reports', name: 'reports', type: 'report' },
    ],
    initialMessages: [
      { role: 'agent', sender: 'AI Ant Scout', agentId: 'agent-ant', text: 'Scanned 3 uploaded PDF files: sales summary, expense report, and staff schedule.', timestamp: '08:30' },
      { role: 'agent', sender: 'Data Cleaner', agentId: 'agent-cleaner', text: 'Structured data from all 3 files into a unified format. No duplicates found.', timestamp: '08:31' },
      { role: 'agent', sender: 'Report Writer', agentId: 'agent-writer', text: 'Consolidated summary is ready. 24 pages processed. Ready to export on approval.', timestamp: '08:32' },
      { role: 'agent', sender: 'Approval Guard', agentId: 'agent-guard', text: 'Approve to export or send via LINE. Nothing leaves without your confirmation.', timestamp: '08:33' },
    ],
  },
];

export const CHANNEL_FILTER_MAP: Record<string, string> = {
  approval: 'agent-guard',
  approvals: 'agent-guard',
  reports: 'agent-writer',
  'cost-analysis': 'agent-analyst',
  'sales-analysis': 'agent-analyst',
  research: 'agent-ant',
  'script-writing': 'agent-writer',
  scripts: 'agent-writer',
  captions: 'agent-writer',
  summaries: 'agent-writer',
  'file-summary': 'agent-writer',
  insights: 'agent-analyst',
  publishing: 'agent-writer',
};

export function getProjectIcon(project: ChatProjectDef) {
  return project.icon ?? project.emoji ?? glyph.folder;
}

export function getProjectStatusLabel(project: ChatProjectDef) {
  if (project.status) return project.status;
  if (project.projectStatus === 'running') return 'Running';
  if (project.projectStatus === 'waiting') return 'Waiting';
  if (project.projectStatus === 'done') return 'Complete';
  return 'Draft';
}

export function getDefaultChannelId(project: ChatProjectDef) {
  return project.channels.find((channel) => channel.id === 'team-room')?.id ?? project.channels[0]?.id ?? 'team-room';
}

export function getProjectChannelMessages(project: ChatProjectDef, channelId: string) {
  const messagesByChannel = project.channelMessages;
  if (messagesByChannel?.[channelId]) return messagesByChannel[channelId];

  const messages = project.initialMessages ?? [];
  if (channelId === getDefaultChannelId(project)) return messages;

  const mappedAgentId = CHANNEL_FILTER_MAP[channelId];
  if (mappedAgentId) {
    return messages.filter((message) => message.role === 'user' || message.agentId === mappedAgentId);
  }

  return messages;
}

export const CHAT_SERVERS: ChatServer[] = [
  {
    id: 'sales-team',
    name: 'Sales Team',
    icon: glyph.ant,
    instructions: 'Focus on sales, GP fee, VAT, order count, and profit changes. Always highlight top menu items.',
    memoryEnabled: true,
    memories: [
      { id: 'mem-1', text: 'Always ask approval before exporting reports.', createdAt: '09:00' },
      { id: 'mem-2', text: 'Output format: short report with action items.', createdAt: '09:01' },
    ],
    channels: [
      { id: 'team-room', name: 'team-room', type: 'main', unread: 0 },
      { id: 'sales-analysis', name: 'sales-analysis', type: 'analysis', unread: 0 },
      { id: 'approvals', name: 'approvals', type: 'approval', unread: 1 },
      { id: 'reports', name: 'reports', type: 'report', unread: 0 },
      { id: 'logs', name: 'logs', type: 'logs', unread: 0 },
    ],
    messages: {
      'team-room': [
        { id: 'tm-1', role: 'agent', sender: 'AI Ant Scout', agentId: 'agent-ant', text: 'Sales Team is ready. Input source analyzed and shared with analysts.', timestamp: '09:00', type: 'agent' },
        { id: 'tm-2', role: 'agent', sender: 'Data Collector', agentId: 'agent-collector', text: 'Collected 42 records, fees, and delivery totals for review.', timestamp: '09:01', type: 'agent' },
      ],
      'sales-analysis': [
        { id: 'sa-1', role: 'agent', sender: 'Analyst', agentId: 'agent-analyst', text: 'Analysis complete. Key finding: operational costs increased 12%. Review the report for full breakdown.', timestamp: '09:03', type: 'agent' },
      ],
      approvals: [
        { id: 'ap-1', role: 'agent', sender: 'Approval Guard', agentId: 'agent-guard', text: 'Report is ready and waiting for your approval before any external action is taken.', timestamp: '09:05', type: 'approval' },
      ],
      reports: [
        { id: 'rp-1', role: 'agent', sender: 'Report Writer', agentId: 'agent-writer', text: 'Draft report generated with executive summary, cost warnings, and recommended next actions.', timestamp: '09:06', type: 'report' },
      ],
      logs: [
        { id: 'lg-1', role: 'agent', sender: '⚡ System', text: 'Workflow initialized. 4 agents active.', timestamp: '08:58', type: 'system' },
        { id: 'lg-2', role: 'agent', sender: '⚡ System', text: 'Run #024 started. Safety Mode ON.', timestamp: '09:00', type: 'system' },
        { id: 'lg-3', role: 'agent', sender: '⚡ System', text: 'Run #024 completed in 42s. 6 credits used.', timestamp: '09:01', type: 'system' },
      ],
    },
  },
  {
    id: 'cost-team',
    name: 'Cost Team',
    icon: glyph.chart,
    instructions: 'Focus on ingredient costs, packaging cost, oil cost, and abnormal spending. Flag any cost increase above 10% vs prior week.',
    channels: [
      { id: 'team-room', name: 'team-room', type: 'main' },
      { id: 'cost-analysis', name: 'cost-analysis', type: 'analysis' },
      { id: 'suppliers', name: 'suppliers', type: 'analysis' },
      { id: 'approvals', name: 'approvals', type: 'approval' },
    ],
    messages: {
      'team-room': [
        { role: 'agent', sender: 'Data Collector', agentId: 'agent-collector', text: 'Cost Team has the weekly expense sheet and supplier notes ready.', timestamp: '10:00' },
      ],
      'cost-analysis': [
        { role: 'agent', sender: 'Sales Analyst', agentId: 'agent-analyst', text: 'Weekly cost is THB 23,600. Packaging and oil costs increased this week.', timestamp: '10:02' },
      ],
      suppliers: [
        { role: 'agent', sender: 'Data Collector', agentId: 'agent-collector', text: 'Two suppliers changed pricing. Packaging trays increased by 12%.', timestamp: '10:03' },
      ],
      approvals: [
        { role: 'agent', sender: 'Approval Guard', agentId: 'agent-guard', text: 'Supplier change summary is ready for approval before sharing.', timestamp: '10:04' },
      ],
    },
  },
  {
    id: 'content-team-chat',
    name: 'Content Team',
    icon: glyph.writer,
    instructions: 'Focus on ideas, hooks, scripts, captions, and approval before publishing. Require approval before any content goes live.',
    channels: [
      { id: 'team-room', name: 'team-room', type: 'main' },
      { id: 'research', name: 'research', type: 'research' },
      { id: 'script-writing', name: 'script-writing', type: 'writing' },
      { id: 'publishing', name: 'publishing', type: 'publishing' },
      { id: 'approvals', name: 'approvals', type: 'approval' },
    ],
    messages: {
      'team-room': [
        { role: 'agent', sender: 'AI Ant Scout', agentId: 'agent-ant', text: 'Content Team is tracking research, scripts, publishing, and approvals here.', timestamp: '11:00' },
      ],
      research: [
        { role: 'agent', sender: 'AI Ant Scout', agentId: 'agent-ant', text: 'Found three strong topic angles from customer reviews and competitor posts.', timestamp: '11:01' },
      ],
      'script-writing': [
        { role: 'agent', sender: 'Report Writer', agentId: 'agent-writer', text: 'I drafted a short-form video script with a stronger hook.', timestamp: '11:03' },
      ],
      publishing: [
        { role: 'agent', sender: 'Report Writer', agentId: 'agent-writer', text: 'Publishing checklist is ready: title, caption, thumbnail note, and posting window.', timestamp: '11:05' },
      ],
      approvals: [
        { role: 'agent', sender: 'Approval Guard', agentId: 'agent-guard', text: 'Scripts and captions are waiting for review before publishing.', timestamp: '11:06' },
      ],
    },
  },
  {
    id: 'file-team',
    name: 'File Team',
    icon: glyph.folder,
    channels: [
      { id: 'team-room', name: 'team-room', type: 'main' },
      { id: 'file-summary', name: 'file-summary', type: 'files' },
      { id: 'insights', name: 'insights', type: 'insights' },
      { id: 'reports', name: 'reports', type: 'report' },
    ],
    messages: {
      'team-room': [
        { role: 'agent', sender: 'Data Cleaner', agentId: 'agent-cleaner', text: 'File Team has uploaded documents ready for summary and reporting.', timestamp: '08:30' },
      ],
      'file-summary': [
        { role: 'agent', sender: 'Data Collector', agentId: 'agent-collector', text: 'I extracted key points from the uploaded file and prepared a report draft.', timestamp: '08:32' },
      ],
      insights: [
        { role: 'agent', sender: 'Sales Analyst', agentId: 'agent-analyst', text: 'Key insight: staffing hours and low-margin periods overlap on weekends.', timestamp: '08:33' },
      ],
      reports: [
        { role: 'agent', sender: 'Report Writer', agentId: 'agent-writer', text: 'File report draft is ready for final approval.', timestamp: '08:34' },
      ],
    },
  },
  {
    id: 'agent-logs',
    name: 'Agent Logs',
    icon: glyph.shield,
    instructions: 'Track all workflow runs, errors, and system events. Flag any safety violations immediately.',
    channels: [
      { id: 'run-history', name: 'run-history', type: 'main' },
      { id: 'errors', name: 'errors', type: 'approval' },
      { id: 'system-notes', name: 'system-notes', type: 'report' },
    ],
    messages: {
      'run-history': [
        { role: 'agent', sender: 'System', text: 'Latest workflow run completed with one approval checkpoint.', timestamp: '12:00' },
      ],
      errors: [
        { role: 'agent', sender: 'System', text: 'No critical errors found in the latest workflow run.', timestamp: '12:01' },
      ],
      'system-notes': [
        { role: 'agent', sender: 'System', text: 'Safety Mode is active. Exports and sends require approval.', timestamp: '12:02' },
      ],
    },
  },
];

export function getDefaultServerChannelId(server: ChatServer) {
  return server.channels.find((channel) => channel.id === 'team-room')?.id ?? server.channels[0]?.id ?? '';
}

export function getServerChannelMessages(server: ChatServer, channelId: string) {
  return server.messages[channelId] ?? server.messages[getDefaultServerChannelId(server)] ?? [];
}



