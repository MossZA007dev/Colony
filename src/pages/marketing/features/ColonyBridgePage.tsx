import type { Page } from '../../../types/navigation';
import { FeatureDetailLayout } from './FeatureDetailLayout';

export function ColonyBridgePage({ goTo, currentPage }: { goTo: (page: Page) => void; currentPage: Page }) {
  return (
    <FeatureDetailLayout
      goTo={goTo}
      currentPage={currentPage}
      eyebrow="Operator"
      title="Let AI work across digital tools, with your approval."
      subtitle="Colony Bridge Operator is designed for tasks where AI needs to use browser pages, files, or connected apps while keeping the user in control."
      accent="amber"
      status={{ label: 'Future capability', copy: 'Operator workflows and connected actions are presented as approval-first future capability. The page avoids claiming broad live autonomous execution.' }}
      problem={{ title: 'A chatbot can advise you, but real work often touches tools.', copy: 'Many useful tasks require collecting information, preparing files, reading selected context, or interacting with digital tools.' }}
      whenToUse={['Collecting public information from websites', 'Organizing data into a sheet', 'Reading selected files', 'Preparing drafts from connected context', 'Working through approved apps']}
      howItWorks={[
        { title: 'Provide a task', copy: 'Describe the browser, file, or connected-app job you want completed.' },
        { title: 'Grant scope', copy: 'Approve the permission scope needed for that task.' },
        { title: 'Watch progress', copy: 'Browser, file, or app activity remains visible as information is collected.' },
        { title: 'Approve action', copy: 'Review before saving, sending, changing, or publishing anything important.' },
      ]}
      scenario={{
        goal: 'Find competitor pricing pages and prepare a comparison table.',
        setup: 'The work requires browsing public pages, extracting structured details, and preparing a sheet-style output.',
        steps: ['The user gives the operator task.', 'The operator works inside an approved environment.', 'Collected information is prepared with source evidence.', 'The user reviews before anything is saved or shared.'],
        finalOutput: 'Prepared comparison table with visible sources and approval state.',
      }}
      output={{ title: 'A completed operator task with evidence.', copy: 'The result should make sources, actions, and approvals visible so users know what happened.', bullets: ['Prepared result', 'Visible source evidence', 'Permission and approval record'] }}
      configuration={{ title: 'Permission and approval controls.', copy: 'Operator tasks should be scoped before execution and reviewed before sensitive actions.', options: ['Permission scope', 'Visible activity', 'Prepared action', 'Approve / revise', 'Activity evidence'] }}
      relations={['AI Ant Chat can hand off a tool-based task to Operator.', 'Operator outputs can become Deliverables inside Projects.', 'Automation may later use Operator-style approvals for connected workflow steps.']}
      preview={{ title: 'Task plan to approved operator result', flow: ['Task', 'Permission', 'Visible work', 'Approval'] }}
      mvpSlots={[
        { title: 'Operator task command', description: 'Replace with the real operator command/intake screen.', futureContentLabel: 'Task prompt and permission summary', aspect: 'square', status: 'Future capability' },
        { title: 'Live browser/app workspace', description: 'Replace with the real visible workspace screenshot.', futureContentLabel: 'Browser or app activity surface', aspect: 'square', status: 'Future capability' },
        { title: 'Approval request and finished result', description: 'Replace with approval and completed task evidence screens.', futureContentLabel: 'Approval request, result, source evidence', aspect: 'square', status: 'Approval-first preview' },
      ]}
    />
  );
}

export default ColonyBridgePage;
