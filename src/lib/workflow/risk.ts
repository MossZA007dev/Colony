import type { RiskAssessment } from '../types/workflowTypes';

export const HIGH_RISK_ACTIONS = ['Send email', 'Send message', 'Delete data', 'Modify external database', 'Publish content', 'Trigger live API action', 'Notify external user', 'Change permissions', 'Notify users', 'Transfer funds'];
export const MEDIUM_RISK_ACTIONS = ['Export file', 'Update spreadsheet', 'Save to connected drive', 'Create email draft', 'Update internal dashboard', 'Run external API in test mode', 'Update data', 'API call', 'Export data'];

export function detectRisk(
  actionType: string,
  safetyMode = true,
  validationStatus: 'ok' | 'warning' | 'error' = 'ok'
): RiskAssessment {
  const isHigh = HIGH_RISK_ACTIONS.some((a) => actionType.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(actionType.toLowerCase()));
  const isMedium = !isHigh && MEDIUM_RISK_ACTIONS.some((a) => actionType.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(actionType.toLowerCase()));
  const riskLevel: 'Low' | 'Medium' | 'High' = isHigh ? 'High' : isMedium ? 'Medium' : 'Low';

  const REASON_MAP: Record<string, string> = {
    'Send email':              'This action sends information outside the workspace.',
    'Send message':            'This action sends information to an external recipient.',
    'Delete data':             'This action permanently removes data and cannot be undone.',
    'Export file':             'This action exports workflow output outside the canvas.',
    'Publish content':         'This action publishes content to an external platform.',
    'Trigger live API action': 'This action triggers a live external service.',
    'Notify external user':    'This action contacts someone outside the workspace.',
    'Change permissions':      'This action changes access rights.',
    'Update data':             'This action writes changes to a connected data source.',
    'API call':                'This action calls an external API.',
  };
  const reason =
    REASON_MAP[actionType] ??
    (riskLevel === 'High'   ? 'This action performs an external operation that may be irreversible.' :
     riskLevel === 'Medium' ? 'This action modifies or exports data outside the current step.' :
                              'This action only reads or analyzes data.');

  const approvalRequired  = safetyMode && riskLevel !== 'Low';
  const confirmationRequired = riskLevel === 'High' || (safetyMode && riskLevel === 'Medium') || validationStatus === 'error';
  return { riskLevel, reason, approvalRequired, confirmationRequired };
}

