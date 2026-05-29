// Small AI Ant utility helpers: device-action analyzer, title/goal, classifiers.
// Extracted from src/App.tsx as part of Phase 2 of the file split refactor.
// Behavior is byte-for-byte identical.

import type {
  AntExecutionMode,
  DeviceAccessLevel,
  DeviceActionRequest,
  DeviceActionVerb,
} from '../types/antTypes';

// ── Device action analyzer ───────────────────────────────────────────────────

export const DEVICE_RUN_STEPS = [
  'Preparing secure access',
  'Reading selected source',
  'Extracting relevant information',
  'Creating result',
];

export const DEVICE_ACCESS_FOR_VERB: Record<DeviceActionVerb, DeviceAccessLevel> = {
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

// ── String / label utilities ─────────────────────────────────────────────────

export function readableField(field: string) {
  return field
    .replace(/^config\./, '')
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

export function titleFromGoal(goal: string): string {
  const clean = goal.replace(/[^\w\s-]/g, '').trim();
  if (/sales|revenue|profit/i.test(clean)) return 'Daily Sales Report';
  if (/marketing|competitor|startup|product/i.test(clean)) return 'Market Launch Project';
  if (/store|shop|commerce/i.test(clean)) return 'Online Store Launch';
  if (/weekly|reporting|workflow/i.test(clean)) return 'Weekly Reporting Workflow';
  return clean.split(/\s+/).slice(0, 4).join(' ') || 'New AI Project';
}

// ── Intent classification (simple prompt-only path) ─────────────────────────

export function classifyAntExecutionMode(prompt: string): AntExecutionMode {
  const lower = prompt.toLowerCase();
  if (/send|publish|post|email|message|share|delete|remove|overwrite|write to|update sheet|modify file|external/.test(lower)) return 'approval-sensitive';
  if (/every|daily|weekly|monthly|schedule|repeat|recurring|automate|workflow|process/.test(lower)) return 'workflow';
  if (/file|folder|screenshot|browser|computer|device|drive|sheet|spreadsheet|api|connector|upload|download/.test(lower)) return 'tool-action';
  if (/launch|startup|company|marketing plan|business plan|competitor|competitors|research .*product|ai team|team|project|strategy|go-to-market|sales report|analyze my sales|online store/.test(lower)) return 'ai-team';
  if (/summarize|rewrite|draft|extract|review|analyze this|create a report/.test(lower)) return 'single-agent';
  return 'simple-chat';
}
