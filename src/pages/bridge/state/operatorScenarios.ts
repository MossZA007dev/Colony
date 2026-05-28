import type { OperatorScenario } from './operatorTypes';

const WEB_RESEARCH: OperatorScenario = {
  id: 'web-research',
  label: 'Web Research',
  task: 'Find competitor pricing and prepare a comparison table.',
  riskLevel: 'approval_required',
  stateSequence: [
    'analyzing',
    'requirements_detected',
    'capability_check',
    'plan_ready',
    'running',
    'approval_required',
    'completed',
  ],
  requirements: [
    { id: 'browser', label: 'Browser', type: 'browser', status: 'ready', scope: 'Public pages only' },
    { id: 'web-read', label: 'Public web reading', type: 'browser', status: 'ready' },
    { id: 'extract', label: 'Data extraction', type: 'browser', status: 'ready' },
    {
      id: 'sheets',
      label: 'Google Sheets output',
      type: 'app',
      status: 'permission_needed',
      scope: 'Write requires approval',
      note: 'Saving to Sheets pauses for your approval.',
    },
  ],
  plan: [
    { id: 'p1', label: 'Open public pricing pages', status: 'complete' },
    { id: 'p2', label: 'Extract visible pricing details', status: 'active' },
    { id: 'p3', label: 'Structure results into a comparison table', status: 'waiting' },
    { id: 'p4', label: 'Request approval before external save', status: 'waiting' },
    { id: 'p5', label: 'Save to Google Sheets after approval', status: 'waiting' },
  ],
  preview: {
    type: 'browser',
    title: 'Linear Pricing',
    url: 'linear.app/pricing',
    statusLine: 'Extracting pricing details for the Standard plan.',
    highlights: [
      { label: 'Plan', value: 'Standard' },
      { label: 'Price', value: '$10 / user / month' },
      { label: 'Billing', value: 'Annual' },
      { label: 'Source', value: 'linear.app/pricing' },
    ],
  },
  previewByState: {
    approval_required: {
      type: 'spreadsheet',
      title: 'Competitor pricing comparison',
      columns: ['Company', 'Plan', 'Price / mo', 'Source'],
      rows: [
        ['Linear', 'Standard', '$10', 'linear.app/pricing'],
        ['Linear', 'Plus', '$14', 'linear.app/pricing'],
        ['Notion', 'Plus', '$10', 'notion.so/pricing'],
        ['Notion', 'Business', '$18', 'notion.so/pricing'],
        ['Asana', 'Starter', '$11', 'asana.com/pricing'],
        ['Asana', 'Advanced', '$25', 'asana.com/pricing'],
        ['Height', 'Standard', '$8', 'height.app/pricing'],
        ['Height', 'Business', '$15', 'height.app/pricing'],
        ['Jira', 'Standard', '$8', 'atlassian.com'],
        ['Jira', 'Premium', '$16', 'atlassian.com'],
      ],
      statusLine: '10 rows prepared. Waiting for approval before saving to Google Sheets.',
    },
  },
  activities: [
    { id: 'a1', time: '14:02', label: 'Task analyzed', status: 'complete' },
    { id: 'a2', time: '14:02', label: 'Capabilities checked', status: 'complete' },
    { id: 'a3', time: '14:03', label: 'Opened linear.app/pricing', status: 'complete' },
    { id: 'a4', time: '14:03', label: 'Extracting pricing details', status: 'active' },
    { id: 'a5', time: '—', label: 'Prepare comparison table', status: 'waiting' },
    { id: 'a6', time: '—', label: 'Save to Google Sheets (approval)', status: 'waiting' },
  ],
  connectionPrompt: {
    appName: 'Google Sheets',
    appAccentClass: 'text-emerald-300',
    scope: 'Write to one new spreadsheet',
    willAllow: [
      'Create a new spreadsheet titled "Competitor Pricing"',
      'Append 10 extracted pricing rows',
    ],
    willNotDo: [
      'Read other Sheets files',
      'Modify existing spreadsheets',
      'Share the spreadsheet with anyone',
    ],
  },
  approval: {
    id: 'apr-web-research',
    title: 'Save comparison to Google Sheets',
    actionType: 'save_external_file',
    description:
      'Add 10 competitor pricing records to a new Google Sheets file. Nothing leaves your account.',
    destination: 'Competitor Research / Pricing Comparison',
    includedData: ['Company name', 'Plan name', 'Monthly price', 'Source link'],
  },
  deliverable: {
    title: 'Competitor Pricing Comparison',
    description: 'Comparison table prepared and saved to Google Sheets after your approval.',
    actionsPerformed: [
      'Read 5 public pricing pages',
      'Extracted 10 pricing records',
      'Prepared a structured comparison table',
      'Saved the table to Google Sheets after approval',
    ],
    toolsUsed: ['Browser', 'Google Sheets'],
    approvalsGranted: ['Save to Google Sheets'],
  },
};

const RESUME_ASSISTANCE: OperatorScenario = {
  id: 'resume-assistance',
  label: 'Resume Assistance',
  task: 'Read my resume from a selected folder and help prepare suitable job applications.',
  riskLevel: 'manual_required',
  stateSequence: [
    'analyzing',
    'requirements_detected',
    'capability_check',
    'permission_required',
    'plan_ready',
    'running',
    'manual_takeover_required',
    'completed',
  ],
  requirements: [
    {
      id: 'local-file',
      label: 'Local file',
      type: 'file',
      status: 'permission_needed',
      scope: 'Read one selected file',
    },
    { id: 'browser', label: 'Browser', type: 'browser', status: 'ready', scope: 'Public job pages' },
    {
      id: 'job-source',
      label: 'Job search source',
      type: 'external_action',
      status: 'manual_only',
      note: 'Final application is completed by you in the browser.',
    },
    {
      id: 'submission',
      label: 'Final submission',
      type: 'external_action',
      status: 'restricted',
      note: 'Restricted: sensitive forms require manual completion.',
    },
  ],
  plan: [
    { id: 'p1', label: 'Read selected resume', status: 'complete' },
    { id: 'p2', label: 'Identify experience and skills', status: 'complete' },
    { id: 'p3', label: 'Match suitable roles from public listings', status: 'active' },
    { id: 'p4', label: 'Prepare tailored application materials', status: 'waiting' },
    { id: 'p5', label: 'Hand off to you for final submission', status: 'waiting' },
  ],
  preview: {
    type: 'file',
    fileName: 'Resume.pdf',
    fileKind: 'pdf',
    summary:
      'Reading the selected resume to understand experience, skills, and preferred role direction.',
    bullets: [
      '6 years frontend engineering. React, TypeScript, design systems.',
      'Led 3 product launches at small teams (12 to 40 people).',
      'Open to remote and hybrid roles in Europe.',
      'Looking for product-focused senior or staff roles.',
    ],
  },
  previewByState: {
    manual_takeover_required: {
      type: 'unsupported',
      reason:
        'Final application submission on this hiring platform must be completed by you. Colony Bridge prepared the application materials and matched suitable roles.',
      alternatives: [
        'Review the prepared application materials in your browser',
        'Sign in to the hiring platform and submit yourself',
        'Mark this task complete when you are done',
      ],
    },
  },
  activities: [
    { id: 'a1', time: '09:14', label: 'Task analyzed', status: 'complete' },
    { id: 'a2', time: '09:14', label: 'File permission granted', status: 'complete' },
    { id: 'a3', time: '09:15', label: 'Resume parsed', status: 'complete' },
    { id: 'a4', time: '09:15', label: 'Matching suitable roles', status: 'active' },
    { id: 'a5', time: '—', label: 'Prepare application materials', status: 'waiting' },
    { id: 'a6', time: '—', label: 'Continue in browser for final submission', status: 'waiting' },
  ],
  permissionPrompt: {
    title: 'Local file access required',
    resource: 'Resume.pdf',
    scope: 'Read this file only',
    uses: [
      'Analyze your experience',
      'Match suitable roles',
      'Prepare application materials',
    ],
  },
  manualTakeoverPrompt: {
    reason:
      'Final application submission on restricted hiring platforms must be completed by you. Colony Bridge prepared the materials.',
    userSteps: [
      'Sign in to your account in the browser',
      'Review the prepared materials before submitting',
      'Complete the final submission yourself',
    ],
    operatorCanHelp: [
      'Preparing the resume and cover letter',
      'Matching suitable open roles',
      'Organizing the application package',
      'Reviewing inputs before you submit',
    ],
  },
  deliverable: {
    title: 'Application package and role shortlist',
    description:
      'Prepared application package and shortlist of suitable roles ready for your manual submission.',
    actionsPerformed: [
      'Read the selected resume',
      'Extracted experience and skills',
      'Matched 8 suitable open roles',
      'Drafted a tailored summary for each role',
    ],
    toolsUsed: ['Local file (read only)', 'Browser'],
    approvalsGranted: ['Local file access (one file)'],
    manualSteps: ['Final submission completed manually by you'],
  },
};

const CONNECTED_APPS: OperatorScenario = {
  id: 'connected-apps',
  label: 'Connected Apps',
  task: 'Read my selected proposal from Google Drive and prepare an email reply.',
  riskLevel: 'draft_only',
  stateSequence: [
    'analyzing',
    'requirements_detected',
    'capability_check',
    'connection_required',
    'plan_ready',
    'running',
    'approval_required',
    'completed',
  ],
  requirements: [
    {
      id: 'drive',
      label: 'Google Drive',
      type: 'app',
      status: 'connection_needed',
      scope: 'Read selected files only',
    },
    {
      id: 'file-read',
      label: 'Selected file read',
      type: 'file',
      status: 'permission_needed',
      scope: 'Per file confirmation',
    },
    {
      id: 'gmail-draft',
      label: 'Gmail draft',
      type: 'app',
      status: 'connection_needed',
      scope: 'Create draft, no send',
    },
    {
      id: 'send-mail',
      label: 'Send email',
      type: 'external_action',
      status: 'permission_needed',
      scope: 'Approval required',
      note: 'Approval required before any email is sent.',
    },
  ],
  plan: [
    { id: 'p1', label: 'Connect Google Drive', status: 'complete' },
    { id: 'p2', label: 'Read selected proposal', status: 'active' },
    { id: 'p3', label: 'Draft a reply', status: 'waiting' },
    { id: 'p4', label: 'Wait for your approval before sending', status: 'waiting' },
  ],
  preview: {
    type: 'email_draft',
    from: 'you@studio.co',
    to: 'casey@acmecollab.com',
    subject: 'Re: Q1 collaboration proposal',
    statusLine: 'Draft prepared. Waiting for your approval before sending.',
    body: `Hi Casey,

Thanks for sharing the Q1 collaboration proposal — I read through the scope, the milestones, and the proposed timeline.

A few quick reactions:
- The phase 1 scope looks accurate, and I am comfortable with the proposed deliverables.
- The week 3 review checkpoint is helpful. Could we move it to a Tuesday so it lands before our internal review?
- On pricing, the structure works. I would like to confirm the change-request policy before signing.

Happy to jump on a short call Thursday to align. Otherwise I can send a redlined version of the doc by Wednesday.

Best,
You`,
  },
  activities: [
    { id: 'a1', time: '11:48', label: 'Task analyzed', status: 'complete' },
    { id: 'a2', time: '11:49', label: 'Google Drive connected', status: 'complete' },
    { id: 'a3', time: '11:49', label: 'Reading "Q1 collaboration proposal"', status: 'active' },
    { id: 'a4', time: '—', label: 'Drafting reply', status: 'waiting' },
    { id: 'a5', time: '—', label: 'Awaiting approval to send', status: 'waiting' },
  ],
  connectionPrompt: {
    appName: 'Google Drive',
    appAccentClass: 'text-sky-300',
    scope: 'Read selected files only',
    willAllow: [
      'Read the proposal you select',
      'Prepare a draft reply in Gmail',
    ],
    willNotDo: [
      'Send email automatically',
      'Access unrelated folders',
      'Modify the source file',
    ],
  },
  approval: {
    id: 'apr-connected-apps',
    title: 'Send drafted reply to Casey',
    actionType: 'send_message',
    description: 'Send the prepared reply email from your account.',
    destination: 'casey@acmecollab.com',
    includedData: ['Subject line', 'Full reply body', 'Your account as sender'],
  },
  deliverable: {
    title: 'Reply prepared and sent after approval',
    description: 'Reply to the Q1 collaboration proposal, sent after your approval.',
    actionsPerformed: [
      'Connected Google Drive (selected file access)',
      'Read the selected proposal',
      'Drafted a tailored reply in Gmail',
      'Sent the reply after your approval',
    ],
    toolsUsed: ['Google Drive', 'Gmail'],
    approvalsGranted: ['Google Drive connection', 'Send one email'],
  },
};

const DEVICE_TRANSFER: OperatorScenario = {
  id: 'device-transfer',
  label: 'Device Transfer',
  task: 'Move the latest PDF from my phone to my computer.',
  riskLevel: 'approval_required',
  stateSequence: [
    'analyzing',
    'requirements_detected',
    'capability_check',
    'installation_required',
    'connection_required',
    'plan_ready',
    'running',
    'completed',
  ],
  requirements: [
    {
      id: 'phone',
      label: 'Mobile device',
      type: 'device',
      status: 'installation_needed',
      scope: 'Companion app required',
    },
    {
      id: 'pair',
      label: 'Device pairing',
      type: 'device',
      status: 'connection_needed',
      scope: 'One-time pairing',
    },
    {
      id: 'file-select',
      label: 'File selection on phone',
      type: 'file',
      status: 'permission_needed',
      scope: 'Approve each file',
    },
    {
      id: 'folder',
      label: 'Save folder on computer',
      type: 'file',
      status: 'permission_needed',
      scope: 'Selected folder only',
    },
  ],
  plan: [
    { id: 'p1', label: 'Install Colony Bridge mobile companion', status: 'complete' },
    { id: 'p2', label: 'Pair phone with this computer', status: 'complete' },
    { id: 'p3', label: 'Pick the file on phone', status: 'active' },
    { id: 'p4', label: 'Transfer to the approved folder', status: 'waiting' },
  ],
  preview: {
    type: 'transfer_progress',
    from: 'iPhone — Files',
    to: '~/Documents/Inbox',
    fileName: 'Q1-report.pdf',
    sizeLabel: '4.2 MB',
    progress: 62,
  },
  previewByState: {
    installation_required: {
      type: 'device_pairing',
      deviceLabel: 'Mobile companion',
      statusLine: 'Open the companion app on your phone to scan the pairing code.',
    },
    connection_required: {
      type: 'device_pairing',
      deviceLabel: 'iPhone — iOS 17',
      statusLine: 'Approve the pairing prompt on your phone to complete setup.',
    },
  },
  activities: [
    { id: 'a1', time: '17:09', label: 'Task analyzed', status: 'complete' },
    { id: 'a2', time: '17:10', label: 'Mobile companion installed', status: 'complete' },
    { id: 'a3', time: '17:10', label: 'Phone paired', status: 'complete' },
    { id: 'a4', time: '17:11', label: 'File selected on phone', status: 'complete' },
    { id: 'a5', time: '17:11', label: 'Transferring Q1-report.pdf', status: 'active' },
  ],
  installationPrompt: {
    deviceLabel: 'iPhone — iOS 17',
    steps: [
      'Download the Colony Bridge mobile companion',
      'Sign in with the same account',
      'Scan the pairing QR code',
      'Approve file access on your phone',
    ],
  },
  connectionPrompt: {
    appName: 'Mobile companion',
    appAccentClass: 'text-violet-300',
    scope: 'Pair this phone with this computer',
    willAllow: [
      'Share files you explicitly select on the phone',
      'Send those files to a folder you approved on this computer',
    ],
    willNotDo: [
      'Browse your phone storage',
      'Sync photos or messages',
      'Stay paired after the task ends',
    ],
  },
  deliverable: {
    title: 'Q1-report.pdf transferred to ~/Documents/Inbox',
    description: 'Selected PDF moved from your phone to the approved folder on this computer.',
    actionsPerformed: [
      'Installed the mobile companion',
      'Paired phone to this computer',
      'Selected one file on the phone',
      'Transferred the file to the approved folder',
    ],
    toolsUsed: ['Mobile companion', 'Local folder'],
    approvalsGranted: ['Pair one phone', 'Save to ~/Documents/Inbox'],
  },
};

export const OPERATOR_SCENARIOS: OperatorScenario[] = [
  WEB_RESEARCH,
  RESUME_ASSISTANCE,
  CONNECTED_APPS,
  DEVICE_TRANSFER,
];

export const DEFAULT_SCENARIO_ID = WEB_RESEARCH.id;

export function findScenario(id: string): OperatorScenario {
  return OPERATOR_SCENARIOS.find((s) => s.id === id) ?? WEB_RESEARCH;
}
