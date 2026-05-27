import type { Page } from '../../../types/navigation';
import { FeatureDetailLayout } from './FeatureDetailLayout';

export function OneManEnterprisePage({ goTo, currentPage }: { goTo: (page: Page) => void; currentPage: Page }) {
  return (
    <FeatureDetailLayout
      goTo={goTo}
      currentPage={currentPage}
      eyebrow="One-man Enterprise · AI organization"
      title="A visible AI organization for long-term work."
      subtitle="When your goal is an operating business, not a single task, One-man Enterprise sets up an AI organization with a director, project manager, and departmental roles."
      accent="blue"
      whatItDoes="Creates a structured AI organization with named roles and departments so a long-term goal has a clear operating shape, not a chat thread."
      whenToUse={[
        'You are running or launching a small online business and want AI to do day-to-day operating work.',
        'The goal requires multiple roles coordinating over time, not a single deliverable.',
        'You want a visible org chart for the AI side of the business.',
      ]}
      howItWorks={[
        { title: 'Define the goal', copy: 'Describe the business or long-term outcome you are working toward.' },
        { title: 'Create the org', copy: 'One-man Enterprise designs the roles (research, marketing, operations, finance, etc.).' },
        { title: 'Assign responsibilities', copy: 'Each role gets a clear scope and reporting line to the project manager.' },
        { title: 'Operate with approval', copy: 'Departmental actions still pass through approval for sensitive steps.' },
      ]}
      output="An AI business workspace with assigned roles and visible coordination."
      outputBullets={['Org chart', 'Role responsibilities', 'Operating workspace']}
    />
  );
}

export default OneManEnterprisePage;
