import type { Page } from '../../../types/navigation';
import { FeatureDetailLayout } from './FeatureDetailLayout';

export function AutomationPage({ goTo, currentPage }: { goTo: (page: Page) => void; currentPage: Page }) {
  return (
    <FeatureDetailLayout
      goTo={goTo}
      currentPage={currentPage}
      eyebrow="Automation · Repeatable workflows"
      title="Repeatable work, on a schedule, with approval before send."
      subtitle="Automation turns recurring tasks into workflows that fire on a trigger, pull from approved data sources, prepare output, and wait for your approval."
      accent="teal"
      whatItDoes="Sets up a scheduled or event-driven workflow that runs without manual setup each time, while keeping sensitive output gated by approval."
      whenToUse={[
        'The task happens on a recurring schedule (weekly, monthly, event-driven).',
        'You want the same shape of work without rebuilding it each cycle.',
        'External data needs to be pulled and shaped into a report or action.',
      ]}
      howItWorks={[
        { title: 'Define the trigger', copy: 'Schedule (every Monday morning) or event (new ticket filed).' },
        { title: 'Connect approved sources', copy: 'Colony Bridge supplies the approved data connections (Sheets, Drive, etc.).' },
        { title: 'Prepare the output', copy: 'AI summarises, reshapes, or analyses the data into the expected deliverable.' },
        { title: 'Request approval', copy: 'Anything that will leave the workspace pauses for your approval.' },
      ]}
      output="A scheduled workflow that ships review-ready output every time it runs."
      outputBullets={['Trigger configuration', 'Connected data sources', 'Approval-gated delivery']}
    />
  );
}

export default AutomationPage;
