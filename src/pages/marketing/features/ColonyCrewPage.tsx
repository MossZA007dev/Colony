import type { Page } from '../../../types/navigation';
import { FeatureDetailLayout } from './FeatureDetailLayout';

export function ColonyCrewPage({ goTo, currentPage }: { goTo: (page: Page) => void; currentPage: Page }) {
  return (
    <FeatureDetailLayout
      goTo={goTo}
      currentPage={currentPage}
      eyebrow="Colony Crew"
      title="Bring specialist AI roles together for one task."
      subtitle="Colony Crew helps users handle complex one-time work by assembling AI specialists around one clear deliverable."
      accent="violet"
      status={{ label: 'Testing now', copy: 'Crew assembly and visible specialist roles are part of current testing. Per-agent model matching is presented as interface direction where needed.' }}
      problem={{ title: 'Some work needs more than one answer.', copy: 'Research, analysis, writing, and review often need to happen together. Colony Crew gives that work a visible team structure instead of one opaque response.' }}
      whenToUse={['Market research', 'Competitor comparison', 'Launch planning', 'Content strategy', 'Report preparation']}
      howItWorks={[
        { title: 'Describe the task', copy: 'Start with a focused outcome that needs multiple skills.' },
        { title: 'Confirm specialist roles', copy: 'Review the proposed research, analysis, writing, and review roles.' },
        { title: 'Review agent matching', copy: 'See agent responsibilities and model preference badges before work begins.' },
        { title: 'Review one deliverable', copy: 'Specialists contribute visibly, then converge into one review-ready output.' },
      ]}
      scenario={{
        goal: 'Research my competitors and prepare a 30-day launch plan.',
        setup: 'The task needs competitor research, positioning analysis, launch recommendations, and final review.',
        steps: ['AI Ant proposes a research agent, strategy agent, report writer, and reviewer.', 'The user confirms or adjusts the team.', 'Agents contribute to one working deliverable.', 'The user reviews the final launch plan.'],
        finalOutput: 'Launch plan with research summary, positioning recommendations, and review status.',
      }}
      output={{ title: 'A coordinated deliverable from specialist roles.', copy: 'The output should show how work moved from research to strategy to writing and review.', bullets: ['Specialist role list', 'Visible contribution trail', 'Final review-ready document'] }}
      configuration={{ title: 'Agent and model matching.', copy: 'Each specialist can use Auto matched model preferences or a user-adjusted preference where the task demands it.', options: ['Research Agent: Auto matched', 'Strategy Agent: Deep Reasoning', 'Report Writer: Balanced', 'Reviewer: User adjusted'] }}
      relations={['AI Ant Chat can route a complex prompt into Colony Crew.', 'Crew deliverables can be saved inside Projects.', 'A repeated crew process can become an Automation template.']}
      preview={{ title: 'Specialist proposal to final deliverable', flow: ['Goal', 'Role proposal', 'Agent work', 'Deliverable'] }}
      mvpSlots={[
        { title: 'Team proposal', description: 'Replace with the real specialist proposal screen.', futureContentLabel: 'Agent roles, responsibility cards, confirm controls', aspect: 'square', status: 'Testing now' },
        { title: 'Agent list and model badges', description: 'Replace with real agent list and preference badges.', futureContentLabel: 'Agent list, Auto matched, user-adjusted badges', aspect: 'square', status: 'Interface concept' },
        { title: 'Final deliverable preview', description: 'Replace with the real crew deliverable preview.', futureContentLabel: 'Launch plan, review status, approval actions', aspect: 'square', status: 'MVP preview' },
      ]}
    />
  );
}

export default ColonyCrewPage;
