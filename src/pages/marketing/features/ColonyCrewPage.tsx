import type { Page } from '../../../types/navigation';
import { FeatureDetailLayout } from './FeatureDetailLayout';

export function ColonyCrewPage({ goTo, currentPage }: { goTo: (page: Page) => void; currentPage: Page }) {
  return (
    <FeatureDetailLayout
      goTo={goTo}
      currentPage={currentPage}
      eyebrow="Colony Crew · Specialist team"
      title="A specialist AI crew for complex one-off work."
      subtitle="Colony Crew assembles a focused team of specialist agents — research, strategy, writing, review — around one goal, and delivers a review-ready output."
      accent="violet"
      whatItDoes="Builds a small specialist team for tasks that need multiple skills working together, such as competitor research, launch planning, or structured deliverables."
      whenToUse={[
        'The task benefits from multiple specialist roles.',
        'You want a single review-ready deliverable, not loose chat output.',
        'You need to see what each specialist contributed before approving the result.',
      ]}
      howItWorks={[
        { title: 'Assemble the crew', copy: 'AI Ant chooses the right specialists for the goal (research, strategy, writer, reviewer).' },
        { title: 'Collaborate visibly', copy: 'Each specialist works on their part with progress shown in the workspace.' },
        { title: 'Review hand-offs', copy: 'Outputs flow between specialists and you can step in at any hand-off.' },
        { title: 'Produce a deliverable', copy: 'The crew converges on one structured, review-ready document.' },
      ]}
      output="A structured deliverable produced by a coordinated specialist crew."
      outputBullets={['Research summary', 'Strategy recommendation', 'Final review-ready document']}
    />
  );
}

export default ColonyCrewPage;
