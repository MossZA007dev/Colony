import { drawPixelRect } from '../canvas/canvasLayout';
import type { CharacterConfig, SpriteState } from '../types/appTypes';
import type { AgentModel, AgentType, CanvasAgentType, LoopSource, ParallelGroup, TemplateCategory, WorkflowConfig, WorkflowInputType, WorkflowOutputType, WorkflowStep, WorkflowTriggerType, WorkflowVersion } from '../types/workflowTypes';

export const ALL_SKILLS = [
  'Read files', 'Read screenshots', 'Extract data', 'Clean data',
  'Analyze data', 'Detect anomalies', 'Write reports', 'Summarize',
  'Check quality', 'Ask for approval', 'Send draft', 'Search web',
  'Use spreadsheet', 'Use email',
] as const;

export const ALL_TOOLS = [
  { id: 'File Reader', label: 'File Reader', icon: '📄' },
  { id: 'Screenshot Reader', label: 'Screenshot Reader', icon: '🖼️' },
  { id: 'PDF Reader', label: 'PDF Reader', icon: '📋' },
  { id: 'Excel Parser', label: 'Excel Parser', icon: '📊' },
  { id: 'CSV Parser', label: 'CSV Parser', icon: '📑' },
  { id: 'Image OCR', label: 'Image OCR', icon: '🔬' },
  { id: 'Table Extractor', label: 'Table Extractor', icon: '🗃️' },
  { id: 'Google Sheets', label: 'Google Sheets', icon: '📊' },
  { id: 'Gmail', label: 'Gmail', icon: '✉️' },
  { id: 'Google Drive', label: 'Google Drive', icon: '🗂️' },
  { id: 'Notion', label: 'Notion', icon: '📓' },
  { id: 'Web Search', label: 'Web Search', icon: '🔍' },
  { id: 'LINE', label: 'LINE', icon: '💬' },
  { id: 'Report Exporter', label: 'Report Exporter', icon: '📤' },
  { id: 'Approval System', label: 'Approval System', icon: '🛡️' },
] as const;

export const MODEL_OPTIONS: Array<{ value: AgentModel; label: string; desc: string }> = [
  { value: 'Fast', label: 'Fast', desc: 'Cheaper and quicker' },
  { value: 'Balanced', label: 'Balanced', desc: 'Good default' },
  { value: 'Accurate', label: 'Accurate', desc: 'Better reasoning, slower' },
];

export const ALL_TONES = [
  'Professional', 'Friendly', 'Concise', 'Detailed',
  'Thai language', 'English language', 'Business style',
  'Casual', 'Analytical', 'Direct',
] as const;

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export const TRIGGER_OPTIONS: Array<{ value: WorkflowTriggerType; label: string; icon: string; desc: string }> = [
  { value: 'manual',      label: 'Manual',           icon: '▶',  desc: 'Runs only when you click Run Workflow' },
  { value: 'daily',       label: 'Daily schedule',   icon: '📅', desc: 'Runs every day at a set time' },
  { value: 'weekly',      label: 'Weekly schedule',  icon: '📆', desc: 'Runs on selected weekdays at a set time' },
  { value: 'file-upload', label: 'File uploaded',    icon: '📤', desc: 'Runs when a file is uploaded' },
  { value: 'sheet-row',   label: 'New row in sheet', icon: '📊', desc: 'Runs when a new row appears in a connected sheet' },
  { value: 'webhook',     label: 'Webhook event',    icon: '🔗', desc: 'Webhook trigger coming soon' },
];

export const WORKFLOW_INPUT_OPTIONS: Array<{ value: WorkflowInputType; label: string; icon: string; desc: string }> = [
  { value: 'screenshot',    label: 'Screenshot upload', icon: '📷', desc: 'Upload screenshots from LINE MAN, Grab, Shopee, or other apps.' },
  { value: 'file-upload',   label: 'File upload',       icon: '📁', desc: 'Upload CSV, Excel, PDF, or document files.' },
  { value: 'google-sheets', label: 'Google Sheets',     icon: '📊', desc: 'Read rows from a connected spreadsheet.' },
  { value: 'text-prompt',   label: 'Text prompt',       icon: '✏️', desc: 'Start the workflow from a user-written instruction.' },
  { value: 'api-data',      label: 'API data',          icon: '🔌', desc: 'Use external API data as workflow input.' },
  { value: 'manual-entry',  label: 'Manual data entry', icon: '⌨️', desc: 'Type or paste data manually.' },
  { value: 'ai-ant-data',   label: 'AI Ant app data',   icon: '🐜', desc: 'Let AI Ants read data from app screens in read-only mode.' },
];

export const WORKFLOW_OUTPUT_OPTIONS: Array<{ value: WorkflowOutputType; label: string; icon: string; desc: string }> = [
  { value: 'report',         label: 'Report',              icon: '📄', desc: 'Generate a clear business summary.' },
  { value: 'approval-card',  label: 'Approval card',       icon: '🛡️', desc: 'Ask user for approval before sending or exporting.' },
  { value: 'pdf',            label: 'PDF',                  icon: '📑', desc: 'Prepare a downloadable PDF report.' },
  { value: 'csv',            label: 'CSV',                  icon: '📊', desc: 'Export structured table data.' },
  { value: 'chat-message',   label: 'Chat message',        icon: '💬', desc: 'Post the result in AI Team Chat.' },
  { value: 'email-draft',    label: 'Email draft',         icon: '✉️', desc: 'Create an email draft for approval.' },
  { value: 'dashboard-card', label: 'Dashboard card',      icon: '📈', desc: 'Show key insight on dashboard.' },
  { value: 'sheet-update',   label: 'Google Sheet update', icon: '📋', desc: 'Write output back to a spreadsheet.' },
];

export const BRANCH_METRICS = ['Estimated profit', 'Total sales', 'GP fee', 'VAT', 'Order count', 'Packaging cost', 'Cost warning count'];
export const BRANCH_OPERATORS = ['drops more than', 'increases more than', 'is greater than', 'is less than', 'equals'];
export const BRANCH_THEN_ACTIONS = ['Send to Approval Guard', 'Create warning report', 'Notify user in chat', 'Mark as high risk', 'Run another agent'];
export const BRANCH_ELSE_ACTIONS = ['Generate normal summary', 'End workflow', 'Save report draft'];

export const LOOP_SOURCE_OPTIONS: { value: LoopSource; label: string; icon: string; example: string }[] = [
  { value: 'none',     label: 'No loop',             icon: '—',  example: 'Run once' },
  { value: 'files',    label: 'Loop through files',   icon: '📁', example: 'Each uploaded file' },
  { value: 'rows',     label: 'Loop through rows',    icon: '📊', example: 'Each spreadsheet row' },
  { value: 'orders',   label: 'Loop through orders',  icon: '🧾', example: 'Each order item' },
  { value: 'messages', label: 'Loop through messages',icon: '💬', example: 'Each customer message' },
  { value: 'custom',   label: 'Custom list',          icon: '✏️', example: 'User-defined items' },
];

export const DEFAULT_PARALLEL_GROUPS: ParallelGroup[] = [
  { id: 'pg-1', name: 'Parallel Group 1', agentIds: ['agent-cleaner', 'agent-analyst'] },
];

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  'Restaurant', 'Sales', 'Content', 'File-to-Report', 'Research', 'Customer Support', 'Custom',
];

export const MOCK_WORKFLOW_VERSIONS: WorkflowVersion[] = [
  {
    id: 'v5', version: 5, title: 'Updated Sales Analyst instructions', timestamp: 'Today, 09:45', author: 'TopSpeed', isCurrent: true,
    snapshot: { agentCount: 6, agentLabels: ['AI Ant Scout', 'Data Collector', 'Data Cleaner', 'Sales Analyst', 'Report Writer', 'Approval Guard'], connectionCount: 5, inputSummary: 'Screenshot, Google Sheets', outputSummary: 'Report, Approval Card', instructionsSummary: 'Analyze delivery sales with GP fee, VAT, and profit changes.' },
  },
  {
    id: 'v4', version: 4, title: 'Added Approval Guard safety step', timestamp: 'Today, 09:20', author: 'TopSpeed', isCurrent: false,
    snapshot: { agentCount: 6, agentLabels: ['AI Ant Scout', 'Data Collector', 'Data Cleaner', 'Sales Analyst', 'Report Writer', 'Approval Guard'], connectionCount: 5, inputSummary: 'Screenshot', outputSummary: 'Report', instructionsSummary: 'Analyze delivery sales and create daily report.' },
  },
  {
    id: 'v3', version: 3, title: 'Changed report output format', timestamp: 'Yesterday, 18:10', author: 'TopSpeed', isCurrent: false,
    snapshot: { agentCount: 5, agentLabels: ['AI Ant Scout', 'Data Collector', 'Data Cleaner', 'Sales Analyst', 'Report Writer'], connectionCount: 4, inputSummary: 'Screenshot', outputSummary: 'PDF Report', instructionsSummary: 'Analyze and format sales data into PDF.' },
  },
  {
    id: 'v2', version: 2, title: 'Added Data Cleaner agent', timestamp: 'Yesterday, 16:30', author: 'TopSpeed', isCurrent: false,
    snapshot: { agentCount: 4, agentLabels: ['AI Ant Scout', 'Data Collector', 'Data Cleaner', 'Sales Analyst'], connectionCount: 3, inputSummary: 'Screenshot', outputSummary: 'Analysis', instructionsSummary: 'Clean and analyze sales data.' },
  },
  {
    id: 'v1', version: 1, title: 'Initial workflow created', timestamp: 'May 10, 12:00', author: 'TopSpeed', isCurrent: false,
    snapshot: { agentCount: 3, agentLabels: ['AI Ant Scout', 'Data Collector', 'Sales Analyst'], connectionCount: 2, inputSummary: 'Screenshot', outputSummary: 'Basic Analysis', instructionsSummary: 'Initial sales data analysis.' },
  },
];

export const DEFAULT_WORKFLOW_STEPS: WorkflowStep[] = [
  { id: 'step-ant',       agentId: 'agent-ant',       name: 'Read input data',      inputFrom: 'Workflow input', inputType: 'Screenshot / file',       outputTo: 'Data Collector',  outputType: 'Extracted raw sales data' },
  { id: 'step-collector', agentId: 'agent-collector', name: 'Extract sales fields', inputFrom: 'AI Ant Scout',   inputType: 'Extracted raw sales data', outputTo: 'Data Cleaner',    outputType: 'Structured sales records' },
  { id: 'step-cleaner',   agentId: 'agent-cleaner',   name: 'Clean and normalize',  inputFrom: 'Data Collector', inputType: 'Structured sales records', outputTo: 'Sales Analyst',   outputType: 'Cleaned sales data' },
  { id: 'step-analyst',   agentId: 'agent-analyst',   name: 'Analyze performance',  inputFrom: 'Data Cleaner',   inputType: 'Cleaned sales data',       outputTo: 'Report Writer',   outputType: 'Profit insights and cost warnings' },
  { id: 'step-writer',    agentId: 'agent-writer',    name: 'Write daily report',   inputFrom: 'Sales Analyst',  inputType: 'Profit insights',          outputTo: 'Approval Guard',  outputType: 'Draft report' },
  { id: 'step-guard',     agentId: 'agent-guard',     name: 'Wait for approval',    inputFrom: 'Report Writer',  inputType: 'Draft report',             outputTo: 'Workflow output', outputType: 'Approved report' },
];

export const DEFAULT_WORKFLOW_CONFIG: WorkflowConfig = {
  inputs: ['screenshot', 'ai-ant-data'],
  outputs: ['report', 'approval-card'],
  steps: DEFAULT_WORKFLOW_STEPS,
  branchRules: [
    { id: 'branch-1', name: 'Profit drop warning', enabled: true, metric: 'Estimated profit', operator: 'drops more than', value: '10%', thenAction: 'Send to Approval Guard', elseAction: 'Generate normal summary' },
  ],
};



export const CHAR_CONFIGS: Record<AgentType, CharacterConfig> = {
  ant: {
    skinColor: '#f5cba7',
    hairColor: '#5c3317',
    outfitColor: '#1a1a2e',
    outfitDetail: '#fbbf24',
    pantsColor: '#1a1a2e',
    shoeColor: '#0c0c14',
    accessory: 'antenna',
    accentColor: '#fbbf24',
  },
  collector: {
    skinColor: '#d4a574',
    hairColor: '#1a1a2e',
    outfitColor: '#1e40af',
    outfitDetail: '#60a5fa',
    pantsColor: '#1e3a8a',
    shoeColor: '#0c0c14',
    accessory: 'hat',
    accentColor: '#1e40af',
  },
  cleaner: {
    skinColor: '#c8a882',
    hairColor: '#065f46',
    outfitColor: '#065f46',
    outfitDetail: '#34d399',
    pantsColor: '#064e3b',
    shoeColor: '#0c0c14',
    accessory: 'glasses',
    accentColor: '#34d399',
  },
  analyst: {
    skinColor: '#e8c99a',
    hairColor: '#4c1d95',
    outfitColor: '#5b21b6',
    outfitDetail: '#a78bfa',
    pantsColor: '#4c1d95',
    shoeColor: '#2e1065',
    accessory: 'glasses',
    accentColor: '#a78bfa',
  },
  writer: {
    skinColor: '#f9c6c6',
    hairColor: '#be185d',
    outfitColor: '#be185d',
    outfitDetail: '#fce7f3',
    pantsColor: '#9d174d',
    shoeColor: '#831843',
    accessory: 'pen',
    accentColor: '#f472b6',
  },
  guard: {
    skinColor: '#d4a574',
    hairColor: '#92400e',
    outfitColor: '#92400e',
    outfitDetail: '#fbbf24',
    pantsColor: '#78350f',
    shoeColor: '#0c0c14',
    accessory: 'shield',
    accentColor: '#d97706',
  },
};

export const CANVAS_CHAR_CONFIGS: Record<CanvasAgentType, CharacterConfig> = {
  ...CHAR_CONFIGS,
  custom: {
    skinColor: '#d8b48c',
    hairColor: '#0f172a',
    outfitColor: '#334155',
    outfitDetail: '#94a3b8',
    pantsColor: '#1e293b',
    shoeColor: '#0c0c14',
    accessory: 'hat',
    accentColor: '#38bdf8',
  },
};

export const BUBBLE_MESSAGES: Record<CanvasAgentType, string[]> = {
  ant: ['Reading screenshot...', 'Found sales data!', '42 orders detected', 'Data extracted!'],
  collector: ['Collecting records...', 'Organizing data...', '42 rows structured', 'Passing to cleaner'],
  cleaner: ['Removing duplicates...', 'Data looks clean!', 'Fixed 3 formats', 'Ready for analysis'],
  analyst: ['Calculating profit...', 'Profit down 18%!', 'Net: THB 3,990', 'Analysis complete'],
  writer: ['Writing report...', 'Adding insights...', 'Report ready!', 'Sending to guard'],
  guard: ['Checking safety...', 'Waiting approval...', 'Approval needed!', 'All clear!'],
  custom: ['New workflow step...', 'Waiting for direction...', 'Processing input...', 'Ready to help!'],
};


export class SpriteAnimator {
  type: CanvasAgentType;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  frame = 0;
  frameTimer = 0;
  state: SpriteState = 'idle';
  direction: 1 | -1 = 1;
  nodeIndex: number;
  rafId = 0;
  disposed = false;

  constructor(type: CanvasAgentType, canvasEl: HTMLCanvasElement, nodeIndex = 0) {
    this.type = type;
    this.canvas = canvasEl;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) throw new Error('Canvas context is unavailable');
    this.ctx = ctx;
    this.nodeIndex = nodeIndex;
    this.loop();
  }

  setState(state: SpriteState) {
    if (this.state === state) return;
    this.state = state;
    this.frame = 0;
    this.frameTimer = 0;
  }

  dispose() {
    this.disposed = true;
    window.cancelAnimationFrame(this.rafId);
  }

  loop() {
    if (this.disposed) return;
    this.frameTimer += 1;
    const speed = this.state === 'walk' ? 8 : this.state === 'talk' ? 6 : 14;
    if (this.frameTimer >= speed) {
      this.frameTimer = 0;
      this.frame = (this.frame + 1) % this.getFrameCount();
    }
    this.draw();
    this.rafId = window.requestAnimationFrame(() => this.loop());
  }

  getFrameCount() {
    if (this.state === 'idle') return 4;
    if (this.state === 'walk') return 6;
    if (this.state === 'talk') return 4;
    if (this.state === 'celebrate') return 6;
    return 4;
  }

  draw() {
    const c = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    c.clearRect(0, 0, width, height);
    c.save();
    if (this.direction === -1) {
      c.translate(width, 0);
      c.scale(-1, 1);
    }
    this.drawCharacter(c, width / 2, height - 4, this.frame, this.state);
    c.restore();
  }

  drawCharacter(c: CanvasRenderingContext2D, cx: number, by: number, frame: number, state: SpriteState) {
    const px = 3;
    const config = CANVAS_CHAR_CONFIGS[this.type];
    const legSwing = state === 'walk' ? [0, 2, 4, 2, 0, -2, -4, -2][frame % 8] : 0;
    const bodyBob = state === 'idle' ? [0, -1, -1, 0][frame % 4] : state === 'walk' ? [0, -1, 0, 1][frame % 4] : 0;
    const armSwing = state === 'talk' ? [0, 2, 3, 2][frame % 4] : 0;
    const idleSway = state === 'idle' ? Math.sin(Date.now() / 600 + this.nodeIndex) * 1.5 : 0;
    const drawCx = cx + idleSway;

    c.fillStyle = 'rgba(0,0,0,0.1)';
    c.beginPath();
    c.ellipse(drawCx, by, 12, 4, 0, 0, Math.PI * 2);
    c.fill();

    const headY = by - 58 + bodyBob;
    c.fillStyle = config.hairColor;
    drawPixelRect(c, drawCx - 6 * px, headY - 7 * px, 12 * px, 3 * px);
    c.fillStyle = config.skinColor;
    drawPixelRect(c, drawCx - 5 * px, headY - 4 * px, 10 * px, 8 * px);
    c.fillStyle = '#1a1a2e';
    drawPixelRect(c, drawCx - 3 * px, headY - 1 * px, 2 * px, 2 * px);
    drawPixelRect(c, drawCx + 1 * px, headY - 1 * px, 2 * px, 2 * px);
    c.fillStyle = '#fff';
    drawPixelRect(c, drawCx - 3 * px, headY - 2 * px, 1 * px, 1 * px);
    drawPixelRect(c, drawCx + 1 * px, headY - 2 * px, 1 * px, 1 * px);
    if (state === 'talk') {
      c.fillStyle = frame % 2 === 0 ? '#7f1d1d' : config.skinColor;
      drawPixelRect(c, drawCx - 2 * px, headY + 3 * px, 4 * px, 2 * px);
    }
    c.fillStyle = '#7f1d1d';
    drawPixelRect(c, drawCx - 2 * px, headY + 3 * px, 1 * px, 1 * px);
    drawPixelRect(c, drawCx + 1 * px, headY + 3 * px, 1 * px, 1 * px);

    const bodyY = by - 40 + bodyBob;
    c.fillStyle = config.outfitColor;
    drawPixelRect(c, drawCx - 5 * px, bodyY, 10 * px, 10 * px);
    if (config.outfitDetail) {
      c.fillStyle = config.outfitDetail;
      drawPixelRect(c, drawCx - 2 * px, bodyY + px, 4 * px, 2 * px);
    }

    c.fillStyle = config.skinColor;
    drawPixelRect(c, drawCx - 7 * px, bodyY + (state === 'walk' ? -legSwing / 2 : 0) + (state === 'talk' ? -armSwing : 0), 2 * px, 7 * px);
    drawPixelRect(c, drawCx + 5 * px, bodyY + (state === 'walk' ? legSwing / 2 : 0) + (state === 'talk' ? -armSwing : 0), 2 * px, 7 * px);

    c.fillStyle = config.pantsColor;
    drawPixelRect(c, drawCx - 4 * px, by - 20 + bodyBob, 3 * px, 8 * px + legSwing);
    drawPixelRect(c, drawCx + px, by - 20 + bodyBob, 3 * px, 8 * px - legSwing);
    c.fillStyle = config.shoeColor;
    drawPixelRect(c, drawCx - 5 * px, by - 4 * px, 4 * px, 3 * px);
    drawPixelRect(c, drawCx + px, by - 4 * px, 4 * px, 3 * px);

    if (config.accessory === 'glasses') {
      c.fillStyle = '#1a1a2e';
      drawPixelRect(c, drawCx - 4 * px, headY, 3 * px, 2 * px);
      drawPixelRect(c, drawCx + px, headY, 3 * px, 2 * px);
      drawPixelRect(c, drawCx - px, headY, 2 * px, px);
    }
    if (config.accessory === 'antenna') {
      c.fillStyle = config.accentColor ?? '#fbbf24';
      drawPixelRect(c, drawCx - px, headY - 10 * px, 2 * px, 4 * px);
      drawPixelRect(c, drawCx - 2 * px, headY - 11 * px, 4 * px, 2 * px);
    }
    if (config.accessory === 'hat') {
      c.fillStyle = config.accentColor ?? '#0c0c14';
      drawPixelRect(c, drawCx - 6 * px, headY - 10 * px, 12 * px, 2 * px);
      drawPixelRect(c, drawCx - 4 * px, headY - 14 * px, 8 * px, 4 * px);
    }
    if (config.accessory === 'shield') {
      c.fillStyle = config.accentColor ?? '#d97706';
      drawPixelRect(c, drawCx + 5 * px, bodyY + 2 * px, 4 * px, 5 * px);
      c.fillStyle = '#fff';
      drawPixelRect(c, drawCx + 6 * px, bodyY + 3 * px, 2 * px, 3 * px);
    }
    if (config.accessory === 'pen') {
      c.fillStyle = '#f472b6';
      drawPixelRect(c, drawCx + 5 * px, bodyY - 2 * px, px, 6 * px);
    }

    if (state === 'celebrate') {
      const colors = ['#fbbf24', '#34d399', '#60a5fa', '#f472b6'];
      for (let i = 0; i < 4; i += 1) {
        c.fillStyle = colors[i % colors.length];
        const offsetX = (i - 1.5) * 10 + Math.sin(frame + i) * 4;
        const offsetY = -frame * 3 - i * 5;
        drawPixelRect(c, drawCx + offsetX, headY - 15 * px + offsetY, 4, 4);
      }
    }
  }
}
