import type { AgentError } from '../types/workflowTypes';
import type { AppConnector, ColumnMappingEntry, ConnectionMapping, DataPreviewRow, DataPreviewState, DataSourceHistoryItem, DataValidationIssue, ProcessedFile } from '../types/appTypes';

export const AGENT_IO: Record<string, { input: string; output: string }> = {
  'agent-ant':       { input: 'LINE MAN screenshot / file upload',        output: 'Raw order list, fees, delivery data' },
  'agent-collector': { input: 'Raw data from AI Ant Scout',               output: 'Structured daily records (sales, GP fee, VAT)' },
  'agent-cleaner':   { input: 'Structured records from Data Collector',   output: 'Clean, normalised dataset' },
  'agent-analyst':   { input: 'Cleaned sales data, GP fee, VAT, orders',  output: 'Profit insight, cost warning, sales summary' },
  'agent-writer':    { input: 'Analysis results from Sales Analyst',      output: 'Daily profit report draft' },
  'agent-guard':     { input: 'Report draft from Report Writer',          output: 'Approved / rejected report (held until user confirms)' },
};

export const ROLE_OPTIONS = [
  'Data Collector', 'Data Cleaner', 'Analyst', 'Report Writer',
  'Approval Guard', 'AI Ant', 'Read-only collector', 'Quality checker',
  'Profit reader', 'Daily summary', 'Safety checkpoint', 'Custom',
];

// ── Connector system ────────────────────────────────────────────────────────

export const INITIAL_CONNECTORS: AppConnector[] = [
  { id: 'file-upload',       name: 'File Upload',       icon: '📄', status: 'connected',     accessLevel: 'Read only',           lastSynced: '2 min ago',  agentsWithAccess: ['AI Ant Scout', 'Data Collector'], permissions: ['read_files'],       config: {} },
  { id: 'screenshot-upload', name: 'Screenshot Upload', icon: '📷', status: 'connected',     accessLevel: 'Read only',           lastSynced: '2 min ago',  agentsWithAccess: ['AI Ant Scout'],                   permissions: ['read_screenshots'], config: {} },
  { id: 'custom-api',        name: 'Custom API',        icon: '🔌', status: 'not-connected', accessLevel: 'Read only',           lastSynced: undefined,    agentsWithAccess: [],                                 permissions: [],                  config: { connectorName: '', baseUrl: '', authType: 'none', apiKey: '', headerName: '', method: 'GET', testEndpoint: '' } },
  { id: 'google-sheets',     name: 'Google Sheets',     icon: '📊', status: 'not-connected', accessLevel: 'Read only',           lastSynced: undefined,    agentsWithAccess: [],                                 permissions: [],                  config: { spreadsheetUrl: '', sheetName: 'Daily Sales', range: 'A1:H500', headerRow: 'true' } },
  { id: 'gmail',             name: 'Gmail',             icon: '✉️', status: 'not-connected', accessLevel: 'Approval required',  lastSynced: undefined,    agentsWithAccess: [],                                 permissions: [],                  config: { readEmails: 'true', createDrafts: 'true', sendWithApproval: 'true' } },
  { id: 'google-drive',      name: 'Google Drive',      icon: '🗂️', status: 'not-connected', accessLevel: 'Read only',           lastSynced: undefined,    agentsWithAccess: [],                                 permissions: [],                  config: { folderUrl: '', fileTypes: 'pdf,excel,csv,images,docs' } },
];

export const COMING_SOON_CONNECTORS: Array<{ id: string; name: string; icon: string }> = [
  { id: 'notion',   name: 'Notion',   icon: '📓' },
  { id: 'line',     name: 'LINE',     icon: '💬' },
  { id: 'slack',    name: 'Slack',    icon: '💼' },
  { id: 'discord',  name: 'Discord',  icon: '🎮' },
  { id: 'webhook',  name: 'Webhook',  icon: '🔗' },
  { id: 'shopee',   name: 'Shopee',   icon: '🛍️' },
  { id: 'line-man', name: 'LINE MAN', icon: '🍱' },
  { id: 'grab',     name: 'Grab',     icon: '🚗' },
];

export const TOOL_TO_CONNECTOR_ID: Record<string, string> = {
  'File Reader':       'file-upload',
  'Screenshot Reader': 'screenshot-upload',
  'PDF Reader':        'file-upload',
  'Excel Parser':      'file-upload',
  'CSV Parser':        'file-upload',
  'Image OCR':         'screenshot-upload',
  'Table Extractor':   'file-upload',
  'Google Sheets':     'google-sheets',
  'Gmail':             'gmail',
  'Google Drive':      'google-drive',
  'Notion':            'notion',
  'LINE':              'line',
};

// ── File Processing types ────────────────────────────────────────────────────

export const MOCK_PROCESSED_FILES: ProcessedFile[] = [
  {
    id: 'pf-1',
    name: 'Q2_Sales_Report.pdf',
    type: 'pdf',
    size: '1.2 MB',
    status: 'done',
    uploadedAt: '2 min ago',
    summary: 'Q2 2024 sales report covering 3 regions. Total revenue ฿4.2M, up 18% from Q1. Highest growth in Bangkok Central (+32%). Identified 3 underperforming SKUs.',
    keyPoints: [
      'Total revenue ฿4,200,000 (Q2 2024)',
      'Bangkok Central region: +32% growth',
      'Northern region: -4% decline vs Q1',
      '3 SKUs flagged for review: SKU-091, SKU-144, SKU-207',
      'Customer retention rate: 87.4%',
    ],
    tables: [
      {
        id: 't1',
        name: 'Revenue by Region',
        headers: ['Region', 'Q1 Revenue', 'Q2 Revenue', 'Growth'],
        rows: [
          ['Bangkok Central', '฿1,200,000', '฿1,584,000', '+32%'],
          ['Bangkok North', '฿980,000', '฿1,058,400', '+8%'],
          ['Northern', '฿1,375,000', '฿1,320,000', '-4%'],
        ],
        rowCount: 3,
      },
    ],
  },
  {
    id: 'pf-2',
    name: 'inventory_may2024.xlsx',
    type: 'excel',
    size: '340 KB',
    status: 'done',
    uploadedAt: '15 min ago',
    tables: [
      {
        id: 't2',
        name: 'Sheet 1 — Inventory',
        headers: ['SKU', 'Product Name', 'Stock', 'Reorder Level', 'Status'],
        rows: [
          ['SKU-001', 'Premium Coffee Blend 250g', '142', '50', 'OK'],
          ['SKU-002', 'Green Tea Sachets 20pk', '8', '25', '⚠ Low'],
          ['SKU-003', 'Matcha Powder 100g', '0', '30', '✕ Out'],
          ['SKU-004', 'Jasmine Tea 50pk', '214', '40', 'OK'],
          ['SKU-005', 'Earl Grey Premium 30pk', '56', '20', 'OK'],
        ],
        rowCount: 247,
      },
      {
        id: 't3',
        name: 'Sheet 2 — Reorder History',
        headers: ['Date', 'SKU', 'Qty Ordered', 'Supplier', 'Status'],
        rows: [
          ['2024-05-01', 'SKU-003', '100', 'Thai Tea Co.', 'Delivered'],
          ['2024-05-07', 'SKU-002', '200', 'Green Fresh Ltd.', 'In Transit'],
          ['2024-05-12', 'SKU-006', '150', 'Aroma Imports', 'Pending'],
        ],
        rowCount: 18,
      },
    ],
  },
  {
    id: 'pf-3',
    name: 'order_export_may14.csv',
    type: 'csv',
    size: '88 KB',
    status: 'done',
    uploadedAt: '1 hour ago',
    tables: [
      {
        id: 't4',
        name: 'Orders',
        headers: ['Order ID', 'Date', 'Customer', 'Items', 'Total', 'Status'],
        rows: [
          ['ORD-4401', '2024-05-14', 'Siriporn K.', '3', '฿620', 'Completed'],
          ['ORD-4402', '2024-05-14', 'Tanawat P.', '1', '฿180', 'Completed'],
          ['ORD-4403', '2024-05-14', 'Warapa M.', '5', '฿1,240', 'Processing'],
          ['ORD-4404', '2024-05-14', 'Kittipong S.', '2', '฿390', 'Pending'],
          ['ORD-4405', '2024-05-14', 'Nattaporn R.', '4', '฿870', 'Completed'],
        ],
        rowCount: 312,
      },
    ],
  },
  {
    id: 'pf-4',
    name: 'receipt_grab_0514.jpg',
    type: 'image',
    size: '215 KB',
    status: 'done',
    uploadedAt: '3 hours ago',
    ocrText: 'GRAB FOOD\nOrder #GF-99841\nDate: 14/05/2024 12:32\n\nKao Mun Gai Special x1 ฿89\nPad Thai Shrimp x2 ฿190\nTom Yum Soup x1 ฿75\nDelivery Fee ฿25\n──────────────\nTotal ฿379\n\nPayment: GrabPay\nThank you!',
    ocrConfidence: 96,
    ocrFields: [
      { label: 'Platform', value: 'Grab Food' },
      { label: 'Order ID', value: 'GF-99841' },
      { label: 'Date', value: '14/05/2024 12:32' },
      { label: 'Total Amount', value: '฿379' },
      { label: 'Payment Method', value: 'GrabPay' },
      { label: 'Item Count', value: '4 items' },
    ],
  },
];

// ── Data Pipeline types ──────────────────────────────────────────────────────

export const MOCK_SOURCE_HISTORY: DataSourceHistoryItem[] = [
  { id: 'sh-1', name: 'LINE MAN screenshot May 12', type: 'image',   status: 'extracted', createdAt: '2026-05-12 18:30', rowsExtracted: '126 orders', usedByAgent: 'AI Ant Scout',  runId: 'Run #024', qualityScore: 78 },
  { id: 'sh-2', name: 'Daily sales.csv',             type: 'csv',     status: 'cleaned',   createdAt: '2026-05-11 09:15', rowsExtracted: '126',         usedByAgent: 'Data Cleaner',  runId: 'Run #023', qualityScore: 91 },
  { id: 'sh-3', name: 'Cost report.xlsx',            type: 'excel',   status: 'validated', createdAt: '2026-05-10 14:22', rowsExtracted: '42',          usedByAgent: 'Sales Analyst', runId: 'Run #022', qualityScore: 95 },
  { id: 'sh-4', name: 'Sales summary.pdf',           type: 'pdf',     status: 'extracted', createdAt: '2026-05-09 11:05', rowsExtracted: '3 tables',    usedByAgent: 'Report Writer', runId: 'Run #021', qualityScore: 72 },
];

export const DATA_STANDARD_FIELDS: { value: string; label: string }[] = [
  { value: 'date', label: 'Date' },
  { value: 'orderId', label: 'Order ID' },
  { value: 'menuName', label: 'Menu Name' },
  { value: 'sales', label: 'Sales' },
  { value: 'gpFee', label: 'GP Fee' },
  { value: 'vat', label: 'VAT' },
  { value: 'cost', label: 'Cost' },
  { value: 'profit', label: 'Profit' },
  { value: 'orderCount', label: 'Order Count' },
  { value: 'customerName', label: 'Customer Name' },
  { value: 'platform', label: 'Platform' },
  { value: 'notes', label: 'Notes' },
  { value: 'ignore', label: '— Ignore —' },
];

export const MOCK_PIPELINE_COLUMNS = ['Date', 'Order ID', 'Menu', 'Sales', 'GP Fee', 'VAT', 'Cost', 'Profit'];

export const MOCK_PIPELINE_ROWS: DataPreviewRow[] = [
  { Date: '2026-05-12', 'Order ID': 'LM-001', Menu: 'Fried Chicken Set', Sales: '159', 'GP Fee': '47', VAT: '11', Cost: '82', Profit: '19' },
  { Date: '2026-05-12', 'Order ID': 'LM-002', Menu: 'Wing Set',          Sales: '129', 'GP Fee': '38', VAT: '9',  Cost: '70', Profit: '12' },
  { Date: '2026-05-12', 'Order ID': 'LM-003', Menu: 'Rice Bowl',         Sales: '99',  'GP Fee': '29', VAT: '7',  Cost: '52', Profit: '11' },
  { Date: '2026-05-12', 'Order ID': 'LM-002', Menu: 'Wing Set',          Sales: '129', 'GP Fee': '38', VAT: '9',  Cost: '70', Profit: '12' },
  { Date: '12/05/2026', 'Order ID': 'LM-004', Menu: 'Spicy Noodles',     Sales: '145', 'GP Fee': '62', VAT: '10', Cost: '65', Profit: '8'  },
  { Date: '2026-05-13', 'Order ID': 'LM-005', Menu: 'Pad Thai',          Sales: '',    'GP Fee': '31', VAT: '8',  Cost: '55', Profit: ''   },
  { Date: '2026-05-13', 'Order ID': 'LM-006', Menu: 'Green Curry',       Sales: '175', 'GP Fee': '52', VAT: '12', Cost: '88', Profit: '23' },
  { Date: '2026-05-13', 'Order ID': 'LM-007', Menu: 'Tom Yum Soup',      Sales: '165', 'GP Fee': '49', VAT: '12', Cost: '80', Profit: '24' },
];

export const MOCK_PIPELINE_MAPPINGS: ColumnMappingEntry[] = [
  { id: 'cm-1', sourceColumn: 'Date',     targetField: 'date',     confidence: 99, ignored: false },
  { id: 'cm-2', sourceColumn: 'Order ID', targetField: 'orderId',  confidence: 97, ignored: false },
  { id: 'cm-3', sourceColumn: 'Menu',     targetField: 'menuName', confidence: 90, ignored: false },
  { id: 'cm-4', sourceColumn: 'Sales',    targetField: 'sales',    confidence: 96, ignored: false },
  { id: 'cm-5', sourceColumn: 'GP Fee',   targetField: 'gpFee',    confidence: 94, ignored: false },
  { id: 'cm-6', sourceColumn: 'VAT',      targetField: 'vat',      confidence: 98, ignored: false },
  { id: 'cm-7', sourceColumn: 'Cost',     targetField: 'cost',     confidence: 95, ignored: false },
  { id: 'cm-8', sourceColumn: 'Profit',   targetField: 'profit',   confidence: 93, ignored: false },
];

export const MOCK_PIPELINE_VALIDATION: DataValidationIssue[] = [
  { id: 'vi-1', severity: 'warning', title: 'Duplicate order ID',       description: "Order ID 'LM-002' appears more than once.",               affectedRows: 2, suggestedFix: 'Review and remove the extra row.' },
  { id: 'vi-2', severity: 'error',   title: 'Missing required values',  description: "Row LM-005: 'Sales' and 'Profit' are empty.",              affectedRows: 1, suggestedFix: 'Fill missing values or remove the row.' },
  { id: 'vi-3', severity: 'warning', title: 'Inconsistent date format', description: "Row LM-004: date '12/05/2026' differs from YYYY-MM-DD.",   affectedRows: 1, suggestedFix: 'Normalize all dates to YYYY-MM-DD.' },
  { id: 'vi-4', severity: 'warning', title: 'High GP fee detected',     description: 'GP fee exceeds 35% of sales for row LM-004 (42.8%).',     affectedRows: 1, suggestedFix: 'Verify with original invoice.' },
  { id: 'vi-5', severity: 'info',    title: 'Date format normalized',   description: '1 row converted from DD/MM/YYYY to YYYY-MM-DD.',           affectedRows: 1, suggestedFix: 'No action needed.' },
];

export const DEFAULT_DATA_PREVIEW_STATE: DataPreviewState = {
  sourceName: 'LINE MAN sales.csv',
  sourceType: 'csv',
  columns: MOCK_PIPELINE_COLUMNS,
  rows: MOCK_PIPELINE_ROWS,
  totalRows: 126,
  cleaned: false,
  mappings: MOCK_PIPELINE_MAPPINGS,
  validationIssues: MOCK_PIPELINE_VALIDATION,
  qualityScore: 82,
  missingCount: 2,
  duplicateCount: 1,
};

