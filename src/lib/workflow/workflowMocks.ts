import { AGENT_CARD, AGENT_GRID_GAP_X, AGENT_GRID_GAP_Y, AGENT_START_X, AGENT_START_Y } from '../canvas/canvasLayout';
import { REPORT_TEMPLATES } from '../data/reportData';
import type { CostEstimate } from '../types/billingTypes';
import type { CanvasAgent } from '../types/workflowTypes';
import type { AIComplexity, AIWorkflowResult, AIWorkflowType, AgentInstructionResult, CanvasConnection, DebugIssue, ExplanationMode, GeneratedAgentDef, InstructionQuality, WorkflowQualityScore, WorkflowSuggestion } from '../types/appTypes';

export function estimateWorkflowCredits(activeAgents: CanvasAgent[], planCreditsLimit = 300, creditsUsed = 0): CostEstimate {
  const count = activeAgents.length;
  const accurateCount = activeAgents.filter((a) => a.model === 'Accurate').length;
  const fastCount = activeAgents.filter((a) => a.model === 'Fast').length;
  const hasOCR = activeAgents.some((a) =>
    (a.tools ?? []).some((t) => t.toLowerCase().includes('ocr') || t.toLowerCase().includes('image'))
  );
  const hasPDF = activeAgents.some((a) =>
    (a.tools ?? []).some((t) => t.toLowerCase().includes('pdf'))
  );
  const hasFileTools = hasOCR || hasPDF || activeAgents.some((a) =>
    (a.tools ?? []).some((t) => t.toLowerCase().includes('excel') || t.toLowerCase().includes('csv'))
  );
  const hasExportTools = activeAgents.some((a) =>
    (a.tools ?? []).some((t) => t.toLowerCase().includes('export') || t.toLowerCase().includes('gmail') || t.toLowerCase().includes('send'))
  );
  const hasConnectorTools = activeAgents.some((a) =>
    (a.tools ?? []).some((t) => t.toLowerCase().includes('sheets') || t.toLowerCase().includes('drive') || t.toLowerCase().includes('api'))
  );
  const hasReport = activeAgents.some((a) =>
    (a.type ?? '').toLowerCase().includes('report') || (a.label ?? '').toLowerCase().includes('report')
  );

  const breakdown: Array<{ label: string; credits: number }> = [];
  breakdown.push({ label: `${count} active agent${count !== 1 ? 's' : ''}`, credits: count });
  if (accurateCount > 0) breakdown.push({ label: `Accurate model ×${accurateCount}`, credits: accurateCount });
  if (hasOCR) breakdown.push({ label: 'OCR / image extraction', credits: 2 });
  if (hasPDF) breakdown.push({ label: 'PDF / long document', credits: 3 });
  else if (hasFileTools) breakdown.push({ label: 'File processing', credits: 2 });
  if (hasExportTools) breakdown.push({ label: 'Export / send action', credits: 2 });
  if (hasConnectorTools) breakdown.push({ label: 'Connector action', credits: 1 });
  if (hasReport) breakdown.push({ label: 'Report generation', credits: 2 });

  const credits = breakdown.reduce((s, b) => s + b.credits, 0);
  const tokens = count * 400 + (hasOCR ? 800 : 0) + (hasPDF ? 1200 : 0) + (hasFileTools && !hasPDF ? 600 : 0) + (hasExportTools ? 300 : 0) + (hasReport ? 500 : 0);
  const estimatedCostUSD = `$${(credits * 0.012).toFixed(2)}`;

  const creditsRemaining = planCreditsLimit - creditsUsed;
  const exceedsPlan = credits > creditsRemaining;
  const nearLimit = !exceedsPlan && (creditsUsed + credits) / planCreditsLimit >= 0.85;

  const reasonParts: string[] = [];
  if (count > 4) reasonParts.push(`${count} agents`);
  if (accurateCount > 0) reasonParts.push('Accurate model');
  if (hasOCR) reasonParts.push('OCR/image processing');
  if (hasPDF) reasonParts.push('PDF processing');
  if (hasExportTools) reasonParts.push('export/send actions');
  if (hasReport) reasonParts.push('report generation');
  const reason = reasonParts.length > 0
    ? `This workflow uses ${reasonParts.join(', ')}.`
    : 'This is a lightweight workflow.';

  const riskLevel: 'Low' | 'Medium' | 'High' =
    credits >= 12 || hasOCR && hasPDF ? 'High'
    : credits >= 6 || hasOCR || hasPDF || hasExportTools ? 'Medium'
    : 'Low';

  return { credits, tokens, estimatedCostUSD, riskLevel, reason, breakdown, exceedsPlan, nearLimit };
}

export const AI_WORKFLOW_TEMPLATES: Record<AIWorkflowType, {
  agents: Array<{ label: string; role: string; icon: string; instructions: string }>;
  connections: Array<[number, number, string?]>;
  trigger: string; output: string; approvalPoints: string[];
}> = {
  research: {
    agents: [
      { label: 'Research Scout', role: 'Data gathering', icon: '🔍', instructions: 'Search, collect, and compile relevant information from multiple sources based on the research brief.' },
      { label: 'Data Processor', role: 'Data normalization', icon: '⚙', instructions: 'Clean, normalize, and structure collected data into a consistent format for analysis.' },
      { label: 'Analyst', role: 'Analysis & insights', icon: '📊', instructions: 'Analyze structured data, identify patterns and key insights. Produce a structured insight summary.' },
      { label: 'Report Writer', role: 'Output generation', icon: '✍', instructions: 'Synthesize analysis into a clear, well-structured research report with executive summary.' },
      { label: 'Approval Guard', role: 'Quality gate', icon: '🛡', instructions: 'Review final report for accuracy and completeness before distribution.' },
    ],
    connections: [[0,1,'Raw data'],[1,2,'Cleaned data'],[2,3,'Insights'],[3,4,'Draft report']],
    trigger: 'Manual / Schedule / Webhook', output: 'Research Report (PDF/HTML)',
    approvalPoints: ['Approval Guard'],
  },
  reporting: {
    agents: [
      { label: 'Data Collector', role: 'Data ingestion', icon: '📥', instructions: 'Collect data from configured sources (APIs, files, databases). Validate completeness before passing downstream.' },
      { label: 'Data Cleaner', role: 'Data preparation', icon: '🧹', instructions: 'Remove duplicates, fix formatting errors, standardize fields. Flag records with critical errors.' },
      { label: 'Analyst', role: 'Analysis', icon: '📊', instructions: 'Analyze cleaned data. Compute KPIs, detect trends and anomalies. Produce structured insights.' },
      { label: 'Report Writer', role: 'Report generation', icon: '✍', instructions: 'Generate a formatted report from analysis output. Include executive summary, metrics, and recommendations.' },
      { label: 'Approval Guard', role: 'Approval gate', icon: '🛡', instructions: 'Hold report for human review before external distribution.' },
    ],
    connections: [[0,1,'Raw records'],[1,2,'Clean data'],[2,3,'KPI summary'],[3,4,'Draft report']],
    trigger: 'Schedule (Daily/Weekly)', output: 'Performance Report',
    approvalPoints: ['Approval Guard'],
  },
  'data-processing': {
    agents: [
      { label: 'File Reader', role: 'Input parsing', icon: '📂', instructions: 'Read and parse uploaded files (CSV, Excel, PDF). Extract structured fields and metadata.' },
      { label: 'Data Validator', role: 'Validation', icon: '✅', instructions: 'Validate all records against defined schema rules. Reject invalid entries and flag warnings.' },
      { label: 'Data Transformer', role: 'Transformation', icon: '🔄', instructions: 'Apply transformation rules: type casting, field mapping, aggregation, and normalization.' },
      { label: 'Output Exporter', role: 'Export', icon: '📤', instructions: 'Export processed data to the configured destination (CSV, DB, API). Log all export actions.' },
    ],
    connections: [[0,1,'Parsed data'],[1,2,'Valid records'],[2,3,'Transformed data']],
    trigger: 'File Upload / API', output: 'Processed Data Export',
    approvalPoints: [],
  },
  approval: {
    agents: [
      { label: 'Request Intake', role: 'Intake', icon: '📋', instructions: 'Receive and parse incoming requests. Validate required fields and assign initial priority.' },
      { label: 'Risk Assessor', role: 'Risk evaluation', icon: '⚠', instructions: 'Evaluate each request for risk level based on defined criteria. Score Low/Medium/High.' },
      { label: 'Policy Checker', role: 'Compliance check', icon: '🔐', instructions: 'Verify request against compliance policy rules. Flag policy violations.' },
      { label: 'Approval Router', role: 'Approval routing', icon: '🔀', instructions: 'Route requests to appropriate approver based on risk level and department.' },
      { label: 'Notifier', role: 'Communication', icon: '📣', instructions: 'Send notifications to approvers and requesters at each stage. Log all communications.' },
    ],
    connections: [[0,1,'Request data'],[1,2,'Risk score'],[2,3,'Policy result'],[3,4,'Routing decision']],
    trigger: 'Form Submission / API / Email', output: 'Approval Decision + Notification',
    approvalPoints: ['Approval Router'],
  },
  document: {
    agents: [
      { label: 'Document Reader', role: 'Document parsing', icon: '📄', instructions: 'Extract text, tables, and metadata from uploaded documents (PDF, DOCX, images via OCR).' },
      { label: 'Content Classifier', role: 'Classification', icon: '🏷', instructions: 'Classify document type, detect key sections, and extract structured information fields.' },
      { label: 'Analyst', role: 'Analysis', icon: '📊', instructions: 'Analyze document content. Identify key findings, risks, and action items.' },
      { label: 'Summary Writer', role: 'Summarization', icon: '✍', instructions: 'Generate a concise executive summary with key points and recommended actions.' },
      { label: 'Approval Guard', role: 'Review gate', icon: '🛡', instructions: 'Present generated summary for human review and approval before filing or distribution.' },
    ],
    connections: [[0,1,'Extracted content'],[1,2,'Classified data'],[2,3,'Findings'],[3,4,'Draft summary']],
    trigger: 'File Upload / Email Attachment', output: 'Document Summary + Classification',
    approvalPoints: ['Approval Guard'],
  },
  automation: {
    agents: [
      { label: 'Trigger Handler', role: 'Event processing', icon: '⚡', instructions: 'Receive and validate incoming trigger events. Parse event payload and route accordingly.' },
      { label: 'Condition Checker', role: 'Logic evaluation', icon: '🔀', instructions: 'Evaluate conditional logic rules. Determine which downstream path to activate.' },
      { label: 'Action Executor', role: 'Action execution', icon: '⚙', instructions: 'Execute configured actions (API calls, DB writes, file creation). Respect safety mode.' },
      { label: 'Logger', role: 'Audit logging', icon: '📋', instructions: 'Log all executed actions with timestamps, outcomes, and metadata for audit trail.' },
    ],
    connections: [[0,1,'Event data'],[1,2,'Routing decision'],[2,3,'Action results']],
    trigger: 'Webhook / Schedule / API', output: 'Automated Actions + Audit Log',
    approvalPoints: [],
  },
  support: {
    agents: [
      { label: 'Request Parser', role: 'Ticket intake', icon: '📥', instructions: 'Parse incoming support requests. Extract intent, category, priority, and user context.' },
      { label: 'Knowledge Agent', role: 'Knowledge retrieval', icon: '📚', instructions: 'Search knowledge base for relevant solutions and previous similar cases.' },
      { label: 'Response Drafter', role: 'Response generation', icon: '✍', instructions: 'Draft a helpful, accurate response based on the request and retrieved knowledge.' },
      { label: 'Quality Checker', role: 'Quality assurance', icon: '✅', instructions: 'Review drafted response for accuracy, tone, and policy compliance before sending.' },
    ],
    connections: [[0,1,'Parsed request'],[1,2,'Knowledge context'],[2,3,'Draft response']],
    trigger: 'Email / Form / Chat / API', output: 'Support Response + Case Log',
    approvalPoints: [],
  },
  blank: {
    agents: [
      { label: 'Input Agent', role: 'Input processing', icon: '📥', instructions: 'Receive and process workflow input. Validate and structure data for downstream agents.' },
      { label: 'Processing Agent', role: 'Core logic', icon: '⚙', instructions: 'Apply core workflow logic to the structured input. Transform and enrich as needed.' },
      { label: 'Output Agent', role: 'Output generation', icon: '📤', instructions: 'Generate the final workflow output. Format and route to configured destination.' },
    ],
    connections: [[0,1,'Input data'],[1,2,'Processed data']],
    trigger: 'Manual', output: 'Workflow Output',
    approvalPoints: [],
  },
};

export function mockGenerateWorkflow(prompt: string, type: AIWorkflowType, complexity: AIComplexity, safetyOn: boolean): AIWorkflowResult {
  const tmpl = AI_WORKFLOW_TEMPLATES[type];
  const agentCount = complexity === 'Simple' ? Math.min(3, tmpl.agents.length) : complexity === 'Advanced' ? tmpl.agents.length + 1 : tmpl.agents.length;
  const baseAgents = tmpl.agents.slice(0, Math.min(agentCount, tmpl.agents.length));
  const cols = Math.min(baseAgents.length, 4);
  const genAgents: GeneratedAgentDef[] = baseAgents.map((a, i) => ({
    id: `ai-gen-${Date.now()}-${i}`, label: a.label, role: a.role, icon: a.icon, instructions: a.instructions,
    model: i === 0 ? 'Fast' : i === baseAgents.length - 1 ? 'Accurate' : 'Balanced',
    x: AGENT_START_X + (i % cols) * (AGENT_CARD.width + AGENT_GRID_GAP_X),
    y: AGENT_START_Y + Math.floor(i / cols) * (AGENT_CARD.height + AGENT_GRID_GAP_Y),
  }));
  const genConns = tmpl.connections
    .filter(([f, t]) => f < genAgents.length && t < genAgents.length)
    .map(([f, t, lbl]) => ({ from: genAgents[f].id, to: genAgents[t].id, label: lbl }));
  const costPerAgent = { Fast: 0.01, Balanced: 0.015, Accurate: 0.025 };
  const totalCost = genAgents.reduce((s, a) => s + costPerAgent[a.model], 0);
  const titleFromPrompt = prompt.length > 40 ? prompt.slice(0, 40).replace(/[^a-zA-Z0-9\s]/g, '') + '…' : prompt;
  return {
    title: titleFromPrompt || `${type.charAt(0).toUpperCase() + type.slice(1)} Workflow`,
    description: `AI-generated ${type} workflow. ${prompt.slice(0, 120)}`,
    agents: genAgents, connections: genConns,
    estimatedComplexity: complexity,
    estimatedCostPerRun: `$${totalCost.toFixed(3)}/run`,
    estimatedRuntimeSeconds: genAgents.length * 6 + (complexity === 'Advanced' ? 15 : 0),
    confidence: prompt.length > 20 ? 'High' : 'Medium',
    risk: safetyOn ? 'Safe' : tmpl.approvalPoints.length > 0 ? 'Moderate' : 'Safe',
    suggestedTools: ['Google Drive', 'Google Sheets', 'Gmail', 'Custom API'].slice(0, Math.min(type === 'reporting' ? 3 : 2, 4)),
    suggestedTrigger: tmpl.trigger,
    suggestedOutput: tmpl.output,
    recommendations: [
      'Enable Safety Mode for workflows with external actions.',
      `Add an Approval Guard before any external outputs.`,
      `Use the ${REPORT_TEMPLATES[0].name} template for report output.`,
      complexity === 'Advanced' ? 'Consider parallel execution for independent agents.' : 'Keep the workflow sequential for reliability.',
    ],
    approvalPoints: tmpl.approvalPoints,
  };
}

export function mockAnalyzeWorkflow(agents: CanvasAgent[], connections: CanvasConnection[]): WorkflowSuggestion[] {
  const suggestions: WorkflowSuggestion[] = [];
  const hasApproval = agents.some((a) => /approval|guard/i.test(a.label));
  const hasReporter = agents.some((a) => /report|writer|output/i.test(a.label));
  const hasValidator = agents.some((a) => /valid|check|clean/i.test(a.label));
  const disconnected = agents.filter((a) => !connections.some((c) => c.from === a.id || c.to === a.id));
  const accurateCount = agents.filter((a) => a.model === 'Accurate').length;

  if (!hasApproval && hasReporter) suggestions.push({ id: 's-approval', title: 'Add Approval Gate before export', explanation: 'A Report Writer was detected but no Approval Guard exists. External outputs should require human approval.', impact: 'High', category: 'Safety', confidence: 'High', applied: false });
  if (!hasValidator && agents.length > 3) suggestions.push({ id: 's-validator', title: 'Add a Validation step', explanation: 'Workflows with multiple agents benefit from a Data Validator to catch errors early and prevent downstream failures.', impact: 'Medium', category: 'Reliability', confidence: 'High', applied: false });
  if (disconnected.length > 0) suggestions.push({ id: 's-disconnected', title: `${disconnected.length} disconnected agent(s) detected`, explanation: `${disconnected.map((a) => a.label).join(', ')} ${disconnected.length > 1 ? 'are' : 'is'} not connected to any workflow path. Connect or remove them.`, impact: 'Medium', category: 'Structure', confidence: 'High', applied: false });
  if (accurateCount > agents.length / 2) suggestions.push({ id: 's-cost', title: 'Reduce cost — use Fast model for preprocessing', explanation: `${accurateCount} agents use Accurate model. Preprocessing agents (readers, cleaners) can use Fast model to reduce cost by ~40%.`, impact: 'Medium', category: 'Cost', confidence: 'Medium', applied: false });
  if (agents.length > 6) suggestions.push({ id: 's-parallel', title: 'Consider parallel execution for independent agents', explanation: 'Agents without data dependencies could run in parallel, reducing total runtime significantly.', impact: 'Low', category: 'Performance', confidence: 'Medium', applied: false });
  if (agents.some((a) => a.disabled)) suggestions.push({ id: 's-disabled', title: 'Remove or re-enable disabled agents', explanation: 'Disabled agents consume workflow slots and may cause confusion. Remove them if no longer needed.', impact: 'Low', category: 'Readability', confidence: 'High', applied: false });
  if (suggestions.length === 0) suggestions.push({ id: 's-ok', title: 'Workflow structure looks good', explanation: 'No critical improvements detected. The workflow follows best practices.', impact: 'Low', category: 'Structure', confidence: 'High', applied: false });
  return suggestions;
}

export function mockDebugWorkflow(agents: CanvasAgent[], connections: CanvasConnection[]): DebugIssue[] {
  const issues: DebugIssue[] = [];
  const disconnected = agents.filter((a) => !connections.some((c) => c.from === a.id || c.to === a.id));
  const noInput = agents.filter((a) => !connections.some((c) => c.to === a.id)).slice(1);
  const hasExternalOutput = agents.some((a) => /sender|export|email|publish|notify|send/i.test(a.label));
  const hasApproval = agents.some((a) => /approval|guard/i.test(a.label));

  disconnected.forEach((a) => issues.push({ id: `dbg-dis-${a.id}`, severity: 'Error', title: `"${a.label}" is disconnected`, affectedAgent: a.label, explanation: `The agent "${a.label}" has no input or output connections. It will never execute.`, suggestedFix: `Connect "${a.label}" to an appropriate agent or remove it from the workflow.`, autoFixAvailable: false, fixed: false }));
  noInput.forEach((a) => issues.push({ id: `dbg-noin-${a.id}`, severity: 'Warning', title: `"${a.label}" has no input`, affectedAgent: a.label, explanation: `"${a.label}" is not the first agent but has no incoming connection. It may fail at runtime.`, suggestedFix: `Add a connection from an upstream agent to "${a.label}".`, autoFixAvailable: false, fixed: false }));
  if (hasExternalOutput && !hasApproval) issues.push({ id: 'dbg-no-approval', severity: 'Critical', title: 'External output without Approval Gate', affectedAgent: agents.find((a) => /sender|export|email|publish|notify|send/i.test(a.label))?.label ?? 'Output Agent', explanation: 'A workflow with external output actions (email, export, publish) should require human approval before execution.', suggestedFix: 'Add an Approval Guard agent before any external output agent.', autoFixAvailable: false, fixed: false });
  if (agents.some((a) => a.disabled)) issues.push({ id: 'dbg-disabled', severity: 'Warning', title: 'Disabled agents in workflow', affectedAgent: agents.filter((a) => a.disabled).map((a) => a.label).join(', '), explanation: 'One or more agents are disabled and will be skipped during execution. Verify this is intentional.', suggestedFix: 'Enable disabled agents or remove them from the workflow.', autoFixAvailable: true, fixed: false });
  if (agents.length === 0) issues.push({ id: 'dbg-empty', severity: 'Critical', title: 'Workflow has no agents', affectedAgent: 'None', explanation: 'The workflow canvas is empty. Add agents before running.', suggestedFix: 'Use "Build Workflow with AI" or "+ Add Agent" to populate the workflow.', autoFixAvailable: false, fixed: false });
  if (issues.length === 0) issues.push({ id: 'dbg-ok', severity: 'Warning', title: 'No critical issues found', affectedAgent: 'All agents', explanation: 'Workflow structure appears valid. No errors or broken connections detected.', suggestedFix: 'Run the workflow to validate end-to-end behavior.', autoFixAvailable: false, fixed: false });
  return issues;
}

export function mockScoreWorkflow(agents: CanvasAgent[], connections: CanvasConnection[], safetyMode: boolean): WorkflowQualityScore {
  const hasApproval = agents.some((a) => /approval|guard/i.test(a.label));
  const hasValidator = agents.some((a) => /valid|check|clean/i.test(a.label));
  const disconnected = agents.filter((a) => !connections.some((c) => c.from === a.id || c.to === a.id));
  const allConnected = disconnected.length === 0;
  const accurateCount = agents.filter((a) => a.model === 'Accurate').length;
  const pct = (v: number) => Math.min(100, Math.max(0, Math.round(v)));
  const structure = pct(allConnected ? 90 : 90 - disconnected.length * 15);
  const reliability = pct(hasValidator ? 85 : 65);
  const safety = pct(safetyMode ? (hasApproval ? 95 : 80) : (hasApproval ? 70 : 55));
  const costEff = pct(100 - (accurateCount / Math.max(agents.length, 1)) * 40);
  const readability = pct(agents.length > 0 ? 85 : 40);
  const autoReady = pct(allConnected && agents.length >= 3 ? 88 : 55);
  const overall = pct((structure + reliability + safety + costEff + readability + autoReady) / 6);
  const grade = overall >= 90 ? 'A' : overall >= 75 ? 'B' : overall >= 60 ? 'C' : overall >= 45 ? 'D' : 'F';
  return {
    overall, grade,
    summary: overall >= 80 ? 'This workflow is well-structured and ready for production.' : overall >= 60 ? 'Good foundation — a few improvements recommended.' : 'This workflow needs attention before it is production-ready.',
    dimensions: [
      { label: 'Structure', score: structure, suggestion: allConnected ? 'All agents connected.' : `${disconnected.length} disconnected agent(s).` },
      { label: 'Reliability', score: reliability, suggestion: hasValidator ? 'Data validation present.' : 'Add a validation step.' },
      { label: 'Safety', score: safety, suggestion: safetyMode && hasApproval ? 'Safety Mode ON + Approval gate.' : 'Enable Safety Mode and add Approval Guard.' },
      { label: 'Cost Efficiency', score: costEff, suggestion: accurateCount > agents.length / 2 ? 'Use Fast model for preprocessing.' : 'Model selection looks efficient.' },
      { label: 'Readability', score: readability, suggestion: agents.length > 0 ? 'Workflow has clear agent labels.' : 'Add agents to the workflow.' },
      { label: 'Automation Readiness', score: autoReady, suggestion: autoReady >= 80 ? 'Ready for scheduled/automated runs.' : 'Complete connections before automating.' },
    ],
  };
}

export function mockGenerateExplanation(agents: CanvasAgent[], connections: CanvasConnection[], mode: ExplanationMode): { summary: string; steps: string[]; inputs: string; outputs: string; risks: string } {
  const agentNames = agents.map((a) => a.label);
  const hasApproval = agents.some((a) => /approval|guard/i.test(a.label));
  const firstAgent = agentNames[0] ?? 'Input Agent';
  const lastAgent = agentNames[agentNames.length - 1] ?? 'Output Agent';
  const steps = agents.map((a, i) => {
    const incoming = connections.find((c) => c.to === a.id);
    const outgoing = connections.find((c) => c.from === a.id);
    return `${i + 1}. **${a.label}** (${a.role}): ${a.instructions ? a.instructions.slice(0, 90) + (a.instructions.length > 90 ? '…' : '') : 'Processes incoming data and passes output to the next step.'}${incoming ? ` Receives: "${incoming.label ?? 'data from previous agent'}"` : ' Takes initial workflow input.'}${outgoing ? ` → "${outgoing.label ?? 'next agent'}"` : ' Final step.'}`;
  });
  const summaries = {
    Simple: `This workflow starts with ${firstAgent}, processes data through ${agents.length} steps, and delivers results via ${lastAgent}.${hasApproval ? ' A human approval step is included before any external actions.' : ''} It is designed to automate a repeatable process with minimal manual effort.`,
    Technical: `Sequential pipeline: ${agentNames.join(' → ')}. ${connections.length} connections. ${hasApproval ? 'Conditional approval routing included.' : 'No approval gate.'} Model distribution: ${agents.filter((a) => a.model === 'Fast').length} Fast / ${agents.filter((a) => a.model === 'Balanced').length} Balanced / ${agents.filter((a) => a.model === 'Accurate').length} Accurate.`,
    Executive: `This workflow automates ${agents.length} steps end-to-end, reducing manual effort and standardizing output quality.${hasApproval ? ' Human oversight is preserved at the approval stage.' : ' Consider adding an approval gate for external actions.'} Estimated ROI: high for recurring workflows.`,
  };
  return {
    summary: summaries[mode],
    steps,
    inputs: `Accepts: files, API payloads, scheduled triggers, manual input via ${firstAgent}.`,
    outputs: `Produces: structured output via ${lastAgent}. May include reports, exports, notifications, or database updates.`,
    risks: hasApproval ? 'Low risk — approval gate prevents unintended external actions.' : 'Moderate risk — no approval gate before external output. Recommend adding one.',
  };
}

export function mockGenerateInstructions(agentLabel: string, agentRole: string, quality: InstructionQuality): AgentInstructionResult {
  const isAnalyst = /analyst|analysis/i.test(agentLabel);
  const isWriter = /writer|report|document/i.test(agentLabel);
  const isCleaner = /clean|normalize|prep/i.test(agentLabel);
  const isGuard = /guard|approval|review/i.test(agentLabel);
  const isCollector = /collect|gather|fetch|intake/i.test(agentLabel);
  const name = agentLabel;
  const role = agentRole || (isAnalyst ? 'Data Analyst' : isWriter ? 'Report Writer' : isCleaner ? 'Data Preparation' : isGuard ? 'Approval Gate' : isCollector ? 'Data Collector' : 'Workflow Agent');
  const baseInstruction = isAnalyst
    ? 'Analyze incoming data and identify patterns, anomalies, and key insights. Produce a structured insight summary with confidence scores. Highlight potential risks or inconsistencies.'
    : isWriter
    ? 'Synthesize analysis outputs into a clear, well-structured document. Include an executive summary, key findings, metrics, and actionable recommendations. Maintain professional tone.'
    : isCleaner
    ? 'Clean and normalize incoming data. Remove duplicates, fix formatting errors, standardize field types, and validate required fields. Flag records that cannot be corrected.'
    : isGuard
    ? 'Review the upstream output for completeness, accuracy, and policy compliance. Present a summary to the human reviewer. Do not allow downstream execution until explicit approval is received.'
    : isCollector
    ? 'Collect and aggregate data from configured sources. Validate that all required fields are present. Structure the data consistently before passing to the next step.'
    : `Process incoming workflow data according to your role as ${role}. Validate inputs, apply required transformations, and produce clean, structured output for the next agent.`;
  const expanded = quality === 'Detailed'
    ? `${baseInstruction}\n\nAdditional guidelines:\n• Always validate input completeness before processing.\n• Log any anomalies or errors encountered.\n• If unable to complete the task, return a structured error message rather than empty output.\n• Maintain consistent output schema regardless of input variation.`
    : baseInstruction;
  return {
    role: `${name} — ${role}`,
    instruction: expanded,
    goals: quality === 'Basic' ? `Complete ${role.toLowerCase()} tasks accurately.` : `1. Process all incoming data completely.\n2. Maintain output schema consistency.\n3. Flag any anomalies for downstream agents.\n4. Minimize token usage while preserving accuracy.`,
    constraints: `Do not access external systems without explicit authorization.\nDo not expose sensitive data in output.\n${isGuard ? 'Never approve automatically — always require explicit human confirmation.' : 'Respect Safety Mode settings for any external actions.'}`,
    expectedOutput: isAnalyst ? 'Structured JSON with: insights[], anomalies[], confidence, summary, riskLevel.'
      : isWriter ? 'Formatted report with: title, executiveSummary, sections[], recommendations[], metadata.'
      : isCleaner ? 'Clean dataset with: records[], errorLog[], validationSummary, fieldStats.'
      : isGuard ? 'Approval decision: { approved: boolean, notes: string, reviewedAt: timestamp }.'
      : 'Structured output matching the defined schema for this workflow step.',
    tone: isWriter ? 'Professional, clear, and concise. Avoid jargon unless the audience is technical.' : isGuard ? 'Neutral and objective.' : 'Precise and factual.',
    toolGuidance: `Use only tools explicitly assigned to this agent. ${isCollector ? 'Preferred tools: Google Sheets, Custom API, File Reader.' : isWriter ? 'Preferred tools: Report Template, Export Module.' : 'No external tools required unless configured.'}`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

