import { BarChart3, Building2, FileText, FolderOpen, FolderPlus, Search, Users, Zap } from 'lucide-react';
import type React from 'react';
import type { AntActivityEntry, AntAutonomyLevel, AntColonySession, AntDelivery, AntDevice, AntLearnedPattern, AntLiveEvent, AntMemoryEntry, AntNotification, AntPermissionScope, AntRecoverySuggestion, AntSearchResult, AntSuggestion, AntTask, AntTool, AntWorkflowDef, AntWorkspace, GraphEdge, GraphNode, KnowledgeEntry, TeamMember } from '../types/antTypes';

export const ANT_DEVICES: AntDevice[] = [
  { id: 'd1', name: 'MacBook Pro', type: 'mac', online: true, lastSeen: 'Now', batteryLevel: 78, status: 'active', activeSession: 'File extraction' },
  { id: 'd2', name: 'Windows Desktop', type: 'windows', online: true, lastSeen: '2m ago', status: 'idle' },
  { id: 'd3', name: 'iPhone 15', type: 'iphone', online: true, lastSeen: '5m ago', batteryLevel: 62, status: 'idle' },
  { id: 'd4', name: 'Android Phone', type: 'android', online: false, lastSeen: '2h ago', batteryLevel: 14, status: 'secure' },
];

export const ANT_WORKSPACES: AntWorkspace[] = [
  { id: 'ws1', name: 'Google Drive', source: 'google-drive', connected: true, lastAccessed: '5m ago', icon: '☁️' },
  { id: 'ws2', name: 'Slack', source: 'slack', connected: true, lastAccessed: '12m ago', icon: '💬' },
  { id: 'ws3', name: 'Notion', source: 'notion', connected: true, lastAccessed: '1h ago', icon: '📓' },
  { id: 'ws4', name: 'Gmail', source: 'email-client', connected: true, lastAccessed: '30m ago', icon: '📧' },
  { id: 'ws5', name: 'Local Folders', source: 'local', connected: true, lastAccessed: 'Now', icon: '💻' },
  { id: 'ws6', name: 'Spreadsheets', source: 'spreadsheets', connected: false, lastAccessed: undefined, icon: '📊' },
];

export const ANT_INITIAL_MEMORIES: AntMemoryEntry[] = [
  { id: 'm1', pattern: 'Reports → /Documents/Reports/', description: 'Files with "report" in the name are routed to the Reports folder', confidence: 0.94, uses: 12, domain: 'general' },
  { id: 'm2', pattern: 'Invoices → /Finance/Invoices/', description: 'PDF invoices are stored in the Finance folder automatically', confidence: 0.88, uses: 7, domain: 'finance' },
  { id: 'm3', pattern: 'External exports require approval', description: 'Any upload or send to an external service is staged and awaits sign-off', confidence: 0.97, uses: 23, domain: 'external-export' },
];

export const ANT_QUICK_ACTIONS: Array<{ label: string; icon: React.ElementType; prompt: string }> = [
  { label: 'Build AI team', icon: Users, prompt: 'Build me an AI team to accomplish this goal' },
  { label: 'Create project', icon: FolderPlus, prompt: 'Help me start and plan a new project' },
  { label: 'Add source', icon: FolderOpen, prompt: 'I want to add files, screenshots, or links as project knowledge' },
  { label: 'Analyze files', icon: BarChart3, prompt: 'Analyze my files and summarize the key numbers' },
  { label: 'Research competitors', icon: Search, prompt: 'Research competitors for my product and summarize opportunities' },
  { label: 'Create report', icon: FileText, prompt: "Create a clear business report from today's data" },
  { label: 'Automate task', icon: Zap, prompt: 'Create a repeatable weekly workflow that summarizes sales every Monday' },
  { label: 'One-man enterprise', icon: Building2, prompt: 'Set up a one-man enterprise: build the full AI org I need to operate a business' },
];

export const ANT_CAPABILITIES: Array<{ id: string; title: string; icon: string; description: string; examples: string[] }> = [
  { id: 'file', title: 'File Intelligence', icon: '📁', description: 'Search, organize, summarize and manage files across all connected devices and workspaces.', examples: ['Find files by content', 'Detect duplicates', 'Rename by pattern'] },
  { id: 'vision', title: 'Vision & Extraction', icon: '📸', description: 'Semantically extract structured data from screenshots, dashboards, PDFs, and UI elements.', examples: ['Extract dashboard metrics', 'Parse UI text', 'Read table data'] },
  { id: 'device', title: 'Device Mesh', icon: '💻', description: 'Operate seamlessly across Mac, Windows, mobile, and browser sessions with shared state.', examples: ['Transfer across devices', 'Sync sessions', 'Execute remotely'] },
  { id: 'workspace', title: 'Workspace Layer', icon: '🔗', description: 'Read and act within Drive, Slack, Notion, Gmail, Sheets, and browser tabs without hardcoded rules.', examples: ['Read from Slack', 'Post to Notion', 'Get Sheets data'] },
  { id: 'workflow', title: 'Workflow Bridge', icon: '⚡', description: 'Convert conversations and extracted data into Colony AI workflows and trigger agent teams.', examples: ['Chat to workflow', 'Send data to agents', 'Trigger automation'] },
  { id: 'memory', title: 'Adaptive Memory', icon: '🧠', description: 'Learns workspace patterns and naming conventions — adapts from corrections without hardcoded rules.', examples: ['Remember folder rules', 'Learn data mappings', 'Track corrections'] },
];

export const ANT_INITIAL_TASKS: AntTask[] = [
  { id: 'at1', title: 'Analyzing screenshots', status: 'completed', device: 'MacBook Pro', progress: 100, confidence: 0.93, confidenceLevel: 'verified', estimatedTime: '—', startedAt: '09:12', icon: '📸', riskLevel: 'Safe', domain: 'general' },
  { id: 'at2', title: 'Extracting spreadsheet data', status: 'completed', device: 'Windows Desktop', progress: 100, confidence: 0.87, confidenceLevel: 'needs-review', estimatedTime: '—', startedAt: '09:13', icon: '📊', riskLevel: 'Safe', domain: 'general', requiresCorrection: true, correctionFields: [{ id: 'cf1', label: 'Total Revenue', detected: '$248,500', confidence: 0.87 }, { id: 'cf2', label: 'Record Count', detected: '248 rows', confidence: 0.94 }] },
  { id: 'at3', title: 'Searching documents', status: 'analyzing', device: 'MacBook Pro', progress: 65, confidence: 0.79, confidenceLevel: 'needs-review', estimatedTime: '~30s', startedAt: '09:14', icon: '📑', riskLevel: 'Safe', domain: 'general' },
];

export const ANT_INITIAL_LOGS: AntActivityEntry[] = [
  { id: 'al1', time: '09:12', action: 'Analyzed 4 screenshots', device: 'MacBook Pro', confidence: 0.93, confidenceLevel: 'verified', result: '8 metrics extracted', icon: '📸', riskLevel: 'Safe', domain: 'general', approvalStatus: 'auto' },
  { id: 'al2', time: '09:13', action: 'Extracted spreadsheet data', device: 'Windows Desktop', confidence: 0.87, confidenceLevel: 'needs-review', result: '12 rows — needs review', icon: '📊', riskLevel: 'Safe', domain: 'general', approvalStatus: 'pending' },
  { id: 'al3', time: '09:14', action: 'Searching documents', device: 'MacBook Pro', confidence: 0.79, confidenceLevel: 'needs-review', result: 'In progress…', icon: '🔍', riskLevel: 'Safe', domain: 'general' },
];

export const ANT_TOOLS: AntTool[] = [
  { id: 't1', name: 'File System', category: 'filesystem', confidence: 0.96, available: true, requiresPermission: 'Local Folders', cost: 'free', icon: '📁', reason: 'Task involves local file access', fallback: 'Cloud Storage' },
  { id: 't2', name: 'Browser Control', category: 'browser', confidence: 0.88, available: true, requiresPermission: 'Browser Access', cost: 'free', icon: '🌐', reason: 'Web-based operation detected' },
  { id: 't3', name: 'Colony Workflow', category: 'workflow', confidence: 0.94, available: true, requiresPermission: 'Workflow Engine', cost: 'free', icon: '⚡', reason: 'Multi-step automation required' },
  { id: 't4', name: 'Google Sheets', category: 'spreadsheets', confidence: 0.91, available: true, requiresPermission: 'Google Drive', cost: 'low', icon: '📊', reason: 'Spreadsheet data detected', fallback: 'CSV Export' },
  { id: 't5', name: 'Vision OCR', category: 'ocr', confidence: 0.89, available: true, requiresPermission: 'Screen Capture', cost: 'low', icon: '👁', reason: 'Image or screenshot analysis needed' },
  { id: 't6', name: 'Gmail', category: 'email', confidence: 0.93, available: true, requiresPermission: 'Email Access', cost: 'free', icon: '📧', reason: 'Email domain detected' },
  { id: 't7', name: 'Google Drive', category: 'cloud', confidence: 0.95, available: true, requiresPermission: 'Cloud Storage', cost: 'low', icon: '☁️', reason: 'Cloud sync required' },
  { id: 't8', name: 'Slack', category: 'messaging', confidence: 0.92, available: true, requiresPermission: 'Messaging', cost: 'free', icon: '💬', reason: 'Team messaging target' },
  { id: 't9', name: 'Mobile Bridge', category: 'mobile', confidence: 0.78, available: true, requiresPermission: 'Mobile Companion', cost: 'free', icon: '📱', reason: 'Mobile device task handoff' },
  { id: 't10', name: 'Desktop Control', category: 'desktop', confidence: 0.85, available: true, requiresPermission: 'Desktop Access', cost: 'medium', icon: '🖥', reason: 'Desktop interaction required' },
  { id: 't11', name: 'LINE', category: 'messaging', confidence: 0.81, available: false, offline: true, requiresPermission: 'LINE Access', cost: 'free', icon: '💚', reason: 'LINE delivery requested', fallback: 'Slack' },
  { id: 't12', name: 'External API', category: 'api', confidence: 0.77, available: true, requiresPermission: 'API Keys', cost: 'high', icon: '🔌', reason: 'External service integration needed' },
];

export const ANT_PERMISSIONS: AntPermissionScope[] = [
  { id: 'p1', name: 'Downloads Folder', type: 'folder', access: 'read-write', risk: 'Safe', granted: true, icon: '📥' },
  { id: 'p2', name: 'Documents Folder', type: 'folder', access: 'read', risk: 'Safe', granted: true, icon: '📄' },
  { id: 'p3', name: 'Desktop', type: 'folder', access: 'read', risk: 'Moderate', granted: true, icon: '🖥' },
  { id: 'p4', name: 'Google Drive', type: 'service', access: 'read-write', risk: 'Moderate', granted: true, icon: '☁️' },
  { id: 'p5', name: 'Gmail', type: 'service', access: 'read', risk: 'Sensitive', granted: true, icon: '📧' },
  { id: 'p6', name: 'Slack', type: 'service', access: 'read-write', risk: 'Moderate', granted: true, icon: '💬' },
  { id: 'p7', name: 'Finance Folder', type: 'folder', access: 'none', risk: 'Sensitive', granted: false, icon: '💰' },
  { id: 'p8', name: 'Desktop Control', type: 'app', access: 'none', risk: 'High Risk', granted: false, icon: '🖱' },
];

export const ANT_INITIAL_DELIVERIES: AntDelivery[] = [
  { id: 'del1', fileName: 'Q2_Report.pdf', destination: 'slack', status: 'sent', createdAt: '09:12', deliveredAt: '09:13', fileSize: '2.3 MB', approvalRequired: true, icon: '💬' },
  { id: 'del2', fileName: 'Analysis_Q1.pdf', destination: 'google-drive', status: 'pending', createdAt: '09:18', fileSize: '4.7 MB', approvalRequired: true, icon: '☁️' },
  { id: 'del3', fileName: 'Invoice_041.pdf', destination: 'email', status: 'approved', createdAt: '08:55', deliveredAt: '08:56', fileSize: '1.1 MB', approvalRequired: true, icon: '📧' },
];

export const ANT_INITIAL_LIVE_EVENTS: AntLiveEvent[] = [
  { id: 'le1', time: '09:12', type: 'action', message: 'Scanning Downloads — 47 files found', device: 'MacBook Pro', icon: '📁' },
  { id: 'le2', time: '09:12', type: 'screenshot', message: 'Screenshot captured — extracting data', device: 'MacBook Pro', icon: '📸' },
  { id: 'le3', time: '09:13', type: 'step', message: 'Step 2/5 complete — 47 files classified', device: 'AI Ant', icon: '✓' },
  { id: 'le4', time: '09:13', type: 'memory', message: 'Pattern saved: Reports → /Documents/Reports/', device: 'AI Ant', icon: '🧠' },
  { id: 'le5', time: '09:14', type: 'approval', message: 'Waiting for user approval to proceed', device: 'System', icon: '🔐' },
];

export const ANT_AUTONOMY_LEVELS: AntAutonomyLevel[] = [
  { id: 'read-only', label: 'Read-Only', power: 10, description: 'Observe and report only. No actions taken.', checkpoints: ['Every output reviewed by user', 'No write operations ever'], risk: 'Zero risk — purely passive', dot: 'bg-emerald-500' },
  { id: 'assist', label: 'Assist', power: 40, description: 'Prepares plans and drafts for your approval.', checkpoints: ['Every action previewed', 'User confirms each step', 'No auto-execution'], risk: 'Low risk — full human control', dot: 'bg-blue-500' },
  { id: 'approval', label: 'Approval', power: 70, description: 'Executes tasks, pauses on sensitive operations.', checkpoints: ['External actions require approval', 'Deletions always blocked', 'Finance domain escalated'], risk: 'Medium — smart checkpoints', dot: 'bg-amber-500' },
  { id: 'auto', label: 'Full Auto', power: 95, description: 'Executes within safety policies automatically.', checkpoints: ['Safety policies enforced', 'High Risk always blocked', 'Full audit trail maintained'], risk: 'Managed — policy-controlled', dot: 'bg-violet-500' },
];

export const ANT_RECOVERY_SUGGESTIONS: AntRecoverySuggestion[] = [
  { id: 'r1', type: 'retry', label: 'Retry Step', description: 'Re-attempt the failed operation with the same tool', icon: '🔄' },
  { id: 'r2', type: 'rollback', label: 'Rollback Changes', description: 'Undo all changes made during this execution', icon: '↩' },
  { id: 'r3', type: 'switch-tool', label: 'Switch Strategy', description: 'Use an alternative tool or different approach', icon: '🔀' },
  { id: 'r4', type: 'ask-user', label: 'Request Guidance', description: 'Pause execution and ask you how to proceed', icon: '🙋' },
];

// ── Intelligence Constants (Features 76-83) ───────────────────────────────────

export const ANT_LEARNED_PATTERNS: AntLearnedPattern[] = [
  { id: 'lp1', name: 'Daily Report Export', description: 'Exports a PDF summary every morning between 08:00–09:00', confidence: 0.94, frequency: 18, learnedFrom: 'Repeated task detection', domain: 'general', suggestedAutomation: 'Auto-export daily summary at 08:30', enabled: true, lastSeen: '2h ago' },
  { id: 'lp2', name: 'Finance → Drive Sync', description: 'Finance PDFs are synced to Google Drive after creation', confidence: 0.88, frequency: 12, learnedFrom: 'File movement pattern', domain: 'finance', suggestedAutomation: 'Auto-sync Finance folder to Drive on save', enabled: true, lastSeen: '1d ago' },
  { id: 'lp3', name: 'Prefer PDF Exports', description: 'User consistently exports reports as PDF rather than Excel', confidence: 0.97, frequency: 31, learnedFrom: 'Format preference detection', domain: 'general', suggestedAutomation: 'Default all report exports to PDF', enabled: true, lastSeen: 'Now' },
  { id: 'lp4', name: 'Slack After Workflow', description: 'User sends a Slack notification after every workflow completes', confidence: 0.82, frequency: 9, learnedFrom: 'Post-workflow behavior', domain: 'general', suggestedAutomation: 'Auto-notify Slack #reports on workflow complete', enabled: false, lastSeen: '3d ago' },
  { id: 'lp5', name: 'Screenshots → OCR', description: 'Screenshots are always passed through OCR extraction immediately', confidence: 0.91, frequency: 24, learnedFrom: 'Tool sequence detection', domain: 'general', suggestedAutomation: 'Auto-run OCR on every screenshot capture', enabled: true, lastSeen: '30m ago' },
];

export const ANT_SEARCH_RESULTS: AntSearchResult[] = [
  { id: 'sr1', name: 'Q2_Finance_Report.pdf', type: 'PDF', relevance: 0.97, matchReason: 'Title matches "finance report" and modified this month', path: '/Documents/Reports/', lastOpened: 'Today 09:42', source: 'local', relatedWorkflows: ['Finance Workflow'], preview: 'Revenue: $2.4M (+12% vs Q1). Top category: Enterprise.', icon: '📄' },
  { id: 'sr2', name: 'Budget_Planning_2026.xlsx', type: 'Sheet', relevance: 0.89, matchReason: 'Contains budget keywords and date matches', path: '/Finance/', lastOpened: 'Yesterday', source: 'drive', relatedWorkflows: ['Budget Review'], preview: 'Q3 budget targets: $850K operating, $120K capex.', icon: '📊' },
  { id: 'sr3', name: 'Invoice_041_April.pdf', type: 'PDF', relevance: 0.84, matchReason: 'Invoice from last month — finance domain', path: '/Finance/Invoices/', lastOpened: '2 days ago', source: 'local', icon: '📄' },
  { id: 'sr4', name: 'Marketing_Strategy_Q3.pptx', type: 'Presentation', relevance: 0.78, matchReason: 'Strategy document with marketing content', path: '/Projects/Marketing/', lastOpened: '5 days ago', source: 'drive', preview: 'Q3 growth targets, campaign briefs, and channel strategy.', icon: '📑' },
  { id: 'sr5', name: 'Onboarding_Pack_2026.pdf', type: 'PDF', relevance: 0.72, matchReason: 'Onboarding documentation for team use', path: '/HR/Onboarding/', lastOpened: '1 week ago', source: 'local', icon: '📄' },
  { id: 'sr6', name: 'Data_Analysis_Report.pdf', type: 'Report', relevance: 0.68, matchReason: 'Generated by workflow — analysis output', path: '/Reports/Generated/', lastOpened: '3 days ago', source: 'report', relatedWorkflows: ['Data Pipeline'], icon: '📋' },
];

export const GRAPH_NODES: GraphNode[] = [
  { id: 'gn1', type: 'file', label: 'Q2_Report.pdf', icon: '📄', x: 80, y: 160, active: true },
  { id: 'gn2', type: 'folder', label: 'Finance/', icon: '📁', x: 80, y: 290, active: true },
  { id: 'gn3', type: 'workflow', label: 'Finance Workflow', icon: '⚡', x: 280, y: 200, active: true },
  { id: 'gn4', type: 'agent', label: 'Analysis Agent', icon: '🤖', x: 280, y: 330, active: false },
  { id: 'gn5', type: 'app', label: 'Google Drive', icon: '☁️', x: 480, y: 130, active: true },
  { id: 'gn6', type: 'report', label: 'Export Report', icon: '📋', x: 480, y: 260, active: true },
  { id: 'gn7', type: 'device', label: 'MacBook Pro', icon: '💻', x: 160, y: 400, active: true },
  { id: 'gn8', type: 'device', label: 'iPhone 15', icon: '📱', x: 400, y: 400, active: true },
  { id: 'gn9', type: 'task', label: 'OCR Extract', icon: '👁', x: 160, y: 80, active: false },
];
export const GRAPH_EDGES: GraphEdge[] = [
  { from: 'gn1', to: 'gn3', label: 'feeds' },
  { from: 'gn2', to: 'gn3', label: 'sourced by' },
  { from: 'gn3', to: 'gn6', label: 'generates' },
  { from: 'gn3', to: 'gn5', label: 'syncs to' },
  { from: 'gn4', to: 'gn3', label: 'processes' },
  { from: 'gn7', to: 'gn1', label: 'hosts' },
  { from: 'gn9', to: 'gn1', label: 'extracted from' },
  { from: 'gn8', to: 'gn6', label: 'receives' },
];

export const ANT_KNOWLEDGE_INITIAL: KnowledgeEntry[] = [
  { id: 'kb1', title: 'Finance Workflow completed successfully', summary: '5 steps executed, Q2 report generated and synced to Drive', source: 'workflow', category: 'recent', confidence: 0.98, createdAt: '09:14', pinned: false, archived: false },
  { id: 'kb2', title: 'User prefers PDF export format', summary: 'Detected across 31 export operations — confidence very high', source: 'pattern', category: 'insight', confidence: 0.97, createdAt: '08:30', pinned: true, archived: false },
  { id: 'kb3', title: 'Google Drive sync approved', summary: '12 files (8.4 MB) synced to Project Workspace folder', source: 'approval', category: 'important', confidence: 0.95, createdAt: 'Yesterday', pinned: false, archived: false },
  { id: 'kb4', title: 'Finance folder — 47 files organized', summary: 'Reorganized by type and date — pattern saved to memory', source: 'file', category: 'recent', confidence: 0.88, createdAt: 'Yesterday', pinned: false, archived: false },
  { id: 'kb5', title: 'Q2 Revenue: $2.4M (+12% vs Q1)', summary: 'Extracted from Q2 Finance Report with 89% confidence', source: 'report', category: 'important', confidence: 0.89, createdAt: '2 days ago', pinned: true, archived: false },
  { id: 'kb6', title: 'Slack connector — reports channel', summary: 'Workflow outputs are routed to #reports automatically', source: 'workflow', category: 'resource', confidence: 0.92, createdAt: '3 days ago', pinned: false, archived: false },
];

export const ANT_NOTIFICATIONS_INITIAL: AntNotification[] = [
  { id: 'n1', title: 'Finance Workflow complete', body: '5 steps executed. Export report ready in /Reports/', priority: 'success', time: '09:14', read: false, category: 'workflow', actions: [{ label: 'Open Report', variant: 'primary' }] },
  { id: 'n2', title: 'Approval required', body: 'Send Analysis_Q1.pdf to Google Drive (4.7 MB)', priority: 'warning', time: '09:18', read: false, category: 'approval', actions: [{ label: 'Approve', variant: 'primary' }, { label: 'Reject', variant: 'danger' }] },
  { id: 'n3', title: 'Smart suggestion ready', body: 'Detected repeated PDF export pattern — automation available', priority: 'info', time: '08:55', read: true, category: 'suggestion', actions: [{ label: 'View Suggestion', variant: 'secondary' }] },
  { id: 'n4', title: 'iPhone 15 connected', body: 'Mobile companion paired — task handoff available', priority: 'info', time: '08:30', read: true, category: 'device' },
  { id: 'n5', title: 'Risk detected', body: 'Deletion task flagged — High Risk action blocked', priority: 'critical', time: '08:12', read: true, category: 'risk', actions: [{ label: 'Review', variant: 'secondary' }] },
];

export const ANT_SUGGESTIONS_INITIAL: AntSuggestion[] = [
  { id: 's1', title: 'Automate daily report export', explanation: 'You export a PDF report every morning — AI Ant can do this automatically at 08:30.', benefit: 'Save ~5 min daily', confidence: 0.94, type: 'automation', action: 'Enable daily auto-export', dismissed: false, applied: false },
  { id: 's2', title: 'Auto-sync Finance folder to Drive', explanation: 'Finance PDFs are always synced after creation. This can be done automatically on save.', benefit: 'Eliminate manual sync step', confidence: 0.88, type: 'optimization', action: 'Enable auto-sync rule', dismissed: false, applied: false },
  { id: 's3', title: 'Organize Downloads folder', explanation: 'Your Downloads folder has 34 unsorted files. AI Ant can organize them by type and date.', benefit: 'Recover 34 files into structured folders', confidence: 0.91, type: 'organization', action: 'Preview organization plan', dismissed: false, applied: false },
  { id: 's4', title: 'Connect LINE for file delivery', explanation: 'You send files externally frequently. LINE integration would simplify delivery.', benefit: 'One-click file sharing to LINE', confidence: 0.76, type: 'connector', action: 'Set up LINE connector', dismissed: false, applied: false },
  { id: 's5', title: 'Auto-run OCR on screenshots', explanation: 'Every screenshot is immediately passed to OCR. This can be triggered automatically.', benefit: 'Zero-click data extraction', confidence: 0.91, type: 'automation', action: 'Enable screenshot auto-OCR', dismissed: false, applied: false },
];

// ── Enterprise & Collaboration Constants (84-94) ──────────────────────────────

export const ANT_WORKFLOWS_INITIAL: AntWorkflowDef[] = [
  { id: 'wf1', name: 'Daily Finance Report', description: 'Scan finance folder → extract data → generate PDF → sync to Drive', icon: '💰', stepCount: 5, status: 'idle', progress: 0, origin: 'template', lastRun: '2h ago', nextRun: 'Tomorrow 08:30', triggeredBy: 'schedule', estimatedDuration: '~45s' },
  { id: 'wf2', name: 'Screenshot OCR Pipeline', description: 'Capture → OCR → extract metrics → route to workflow', icon: '📸', stepCount: 4, status: 'running', progress: 62, origin: 'prompt', lastRun: 'Now', triggeredBy: 'ant', estimatedDuration: '~20s' },
  { id: 'wf3', name: 'Document Review Workflow', description: 'Receive PDF → summarize → flag issues → send for review', icon: '📄', stepCount: 6, status: 'failed', progress: 33, origin: 'manual', lastRun: '15m ago', triggeredBy: 'user', estimatedDuration: '~60s', repairLog: ['Step 3 failed: PDF parser returned empty output', 'Possible cause: Encrypted or scanned PDF without OCR layer', 'Suggested fix: Run Vision OCR on input file first'] },
  { id: 'wf4', name: 'Team Slack Notification', description: 'Watch for workflow complete → format message → post to #reports', icon: '💬', stepCount: 3, status: 'idle', progress: 0, origin: 'prompt', lastRun: 'Yesterday', triggeredBy: 'ant', estimatedDuration: '~5s' },
  { id: 'wf5', name: 'File Organization Sweep', description: 'Scan downloads → classify → move to target folders → save patterns', icon: '📁', stepCount: 5, status: 'complete', progress: 100, origin: 'prompt', lastRun: '1h ago', triggeredBy: 'user', estimatedDuration: '~30s' },
];

export const ANT_COLONY_SESSION: AntColonySession = {
  id: 'colony-1', objective: 'Prepare and deliver Q2 Finance Summary Package',
  status: 'executing', overallProgress: 58, startedAt: '09:10', estimatedComplete: '09:16',
  agents: [
    { id: 'a1', name: 'Lead Ant', role: 'orchestrator', icon: '🐜', color: 'violet', status: 'active', currentTask: 'Coordinating 3 sub-agents', confidence: 0.96, completedTasks: 2, subAgents: ['a2', 'a3', 'a4'] },
    { id: 'a2', name: 'Research Ant', role: 'research', icon: '🔬', color: 'cyan', status: 'active', currentTask: 'Extracting Q2 metrics from PDF', progress: 72, confidence: 0.91, completedTasks: 1, delegatedFrom: 'a1' },
    { id: 'a3', name: 'Finance Ant', role: 'finance', icon: '💰', color: 'amber', status: 'waiting', currentTask: 'Waiting for extracted data', confidence: 0.94, completedTasks: 0, delegatedFrom: 'a1' },
    { id: 'a4', name: 'File Ant', role: 'file', icon: '📁', color: 'blue', status: 'active', currentTask: 'Scanning downloads folder', progress: 45, confidence: 0.88, completedTasks: 3, delegatedFrom: 'a1' },
    { id: 'a5', name: 'Browser Ant', role: 'browser', icon: '🌐', color: 'emerald', status: 'idle', confidence: 0.85, completedTasks: 0, delegatedFrom: 'a1' },
  ],
};

export const ANT_TEAM_MEMBERS: TeamMember[] = [
  { id: 'tm1', name: 'You', role: 'admin', initials: 'YO', online: true, devicesShared: 4, lastActive: 'Now', color: 'violet' },
  { id: 'tm2', name: 'Sarah K.', role: 'member', initials: 'SK', online: true, devicesShared: 2, lastActive: '5m ago', color: 'emerald' },
  { id: 'tm3', name: 'Mark T.', role: 'member', initials: 'MT', online: false, devicesShared: 1, lastActive: '2h ago', color: 'amber' },
  { id: 'tm4', name: 'Ji-won P.', role: 'viewer', initials: 'JP', online: true, devicesShared: 0, lastActive: '12m ago', color: 'blue' },
];

// ── Mock AI engine ─────────────────────────────────────────────────────────────

