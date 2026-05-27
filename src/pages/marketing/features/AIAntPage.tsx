import type { Page } from '../../../types/navigation';
import { FeatureDetailLayout } from './FeatureDetailLayout';

export function AIAntPage({ goTo, currentPage }: { goTo: (page: Page) => void; currentPage: Page }) {
  return (
    <FeatureDetailLayout
      goTo={goTo}
      currentPage={currentPage}
      eyebrow="AI Ant · Coordinator"
      title="The coordinator that picks the right way to work."
      subtitle="AI Ant reads your goal, detects what kind of task it is, and routes it to the best Colony Bridge mode. You stay in one workspace; the work changes shape behind the scenes."
      accent="blue"
      whatItDoes="AI Ant analyses the goal you describe and decides whether a specialist crew, an automation, an AI organization, or a connected action layer is the right approach."
      whenToUse={[
        'You want to describe a goal once and have the right structure assembled around it.',
        'You are not sure which mode to use yourself.',
        'You want a single coordinator instead of switching between tools.',
      ]}
      howItWorks={[
        { title: 'Read the goal', copy: 'AI Ant parses what you wrote and the project context around it.' },
        { title: 'Detect task signals', copy: 'Multi-step? Recurring? External tool access? Long-term operation? Each signal narrows the routing.' },
        { title: 'Pick the best mode', copy: 'Colony Crew, Automation, One-man Enterprise, or AI Ant + Colony Bridge for connected actions.' },
        { title: 'Hand off and stay coordinator', copy: 'AI Ant remains visible, tracks progress, and surfaces approval moments before anything sensitive runs.' },
      ]}
      output="A routed plan with the selected mode, execution steps, and approval points."
      outputBullets={['Mode + reason', 'Execution checklist', 'Approval surface for sensitive steps']}
    />
  );
}

export default AIAntPage;
