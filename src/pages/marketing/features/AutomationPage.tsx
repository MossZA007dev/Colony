import type { Page } from '../../../types/navigation';
import { FeatureDetailLayout } from './FeatureDetailLayout';

export function AutomationPage({ goTo, currentPage }: { goTo: (page: Page) => void; currentPage: Page }) {
  return (
    <FeatureDetailLayout
      goTo={goTo}
      currentPage={currentPage}
      eyebrow="Automation"
      title="Repeat useful work without rebuilding it every time."
      subtitle="Automation turns recurring tasks into workflows that can be understood, tested, reviewed, and reused."
      accent="teal"
      status={{ label: 'In development', copy: 'Workflow automation is presented as an in-development capability. The page describes the intended structure without claiming fully live scheduling or connected execution.' }}
      problem={{ title: 'Repeated tasks should not require repeated setup.', copy: 'Many tasks are repeated weekly or daily, but recreating prompts and manually organizing outputs wastes time.' }}
      whenToUse={['Weekly reporting', 'Repeated file summaries', 'Scheduled monitoring', 'Content pipelines', 'Recurring business analysis']}
      howItWorks={[
        { title: 'Describe repeated task', copy: 'Name the work that comes back on a schedule or trigger.' },
        { title: 'Choose trigger and source', copy: 'Select manual, scheduled, file, sheet, or approved connector inputs.' },
        { title: 'Configure AI steps', copy: 'Add cleaning, analysis, summary, and output preparation steps.' },
        { title: 'Review history', copy: 'Set approval rules, choose output, test the workflow, and inspect runs.' },
      ]}
      scenario={{
        goal: 'Every Monday, summarize my weekly sales performance and prepare a report.',
        setup: 'The task has a predictable input, recurring schedule, and consistent reporting output.',
        steps: ['Create a Monday reporting trigger.', 'Select the approved sales source.', 'Add analysis and summary steps.', 'Require approval before the report is sent or saved.'],
        finalOutput: 'Reusable weekly reporting workflow.',
      }}
      output={{ title: 'A reusable workflow with approval checkpoints.', copy: 'Automation preserves the structure of successful repeated work so the next run is easier to review.', bullets: ['Trigger definition', 'AI processing steps', 'Run history and approval state'] }}
      configuration={{ title: 'Workflow controls.', copy: 'Automation needs clear trigger, source, AI step, approval, and output configuration.', options: ['Manual / Scheduled trigger', 'File / Sheet / Connector source', 'AI processing steps', 'Approval rule'] }}
      relations={['AI Ant can suggest Automation when it detects recurring work.', 'Colony Crew outputs can become repeatable workflows.', 'Colony Bridge Operator can support approved sources or destinations in future workflows.']}
      preview={{ title: 'Recurring task to reusable workflow', flow: ['Repeated task', 'Trigger', 'AI steps', 'Approval'] }}
      mvpSlots={[
        { title: 'Workflow builder', description: 'Replace with the real workflow builder canvas.', futureContentLabel: 'Workflow nodes, trigger, source, output', aspect: 'square', status: 'In development' },
        { title: 'Node detail prompt-edit panel', description: 'Replace with node configuration and prompt editing UI.', futureContentLabel: 'Prompt step, data source, approval rule controls', aspect: 'square', status: 'Prototype preview' },
        { title: 'Run log / approval state', description: 'Replace with workflow run history and approval panel.', futureContentLabel: 'Run status, output, approve or revise state', aspect: 'square', status: 'In development' },
      ]}
    />
  );
}

export default AutomationPage;
