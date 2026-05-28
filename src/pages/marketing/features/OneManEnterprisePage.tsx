import type { Page } from '../../../types/navigation';
import { FeatureDetailLayout } from './FeatureDetailLayout';

export function OneManEnterprisePage({ goTo, currentPage }: { goTo: (page: Page) => void; currentPage: Page }) {
  return (
    <FeatureDetailLayout
      goTo={goTo}
      currentPage={currentPage}
      eyebrow="One-man Enterprise"
      title="Create an AI organization around your ambition."
      subtitle="One-man Enterprise is for bigger goals that need roles, responsibilities, coordination, and continuity over time."
      accent="blue"
      status={{ label: 'Prototype preview', copy: 'The organization model is a distinctive product direction and is being expanded carefully. It should be read as structured assistance, not an autonomous company operating without review.' }}
      problem={{ title: 'A long-term business cannot be managed as one chat thread.', copy: 'It needs structure, ownership, progress, shared context, and clear approval points as work continues over time.' }}
      whenToUse={['Running a small online business', 'Managing a product launch', 'Building a startup project', 'Coordinating multiple ongoing workstreams', 'Creating an AI-supported operating structure']}
      howItWorks={[
        { title: 'Describe long-term goal', copy: 'Tell AI Ant what the business or ambition is and what first outcome matters.' },
        { title: 'Analyze responsibilities', copy: 'The system identifies departments such as research, marketing, operations, finance, or content.' },
        { title: 'Propose hierarchy', copy: 'AI Ant Director, project manager, and specialist roles are arranged into an operating model.' },
        { title: 'Create workspace', copy: 'Agents, model preferences, team chats, task progress, deliverables, and approvals become visible.' },
      ]}
      scenario={{
        goal: 'Help me operate and grow a small online business.',
        setup: 'The user needs more than one task: research, content, operations, finance, quality review, and ongoing planning.',
        steps: ['AI Ant identifies operating responsibilities.', 'An organization structure is proposed.', 'Agents are matched to roles and model preferences.', 'A workspace is created with visible tasks, chats, deliverables, and approvals.'],
        finalOutput: 'AI organization workspace with roles, task coordination, and deliverables.',
      }}
      output={{ title: 'An AI organization workspace.', copy: 'The output is a structured operating surface for long-term work, not a single answer.', bullets: ['Organization grid', 'Role responsibilities', 'Project workspace', 'Expected deliverables', 'Approval checkpoints'] }}
      configuration={{ title: 'Roles, responsibilities, and model control.', copy: 'Each role can carry a responsibility, status, and model preference badge based on its work.', options: ['AI Ant Director', 'Project Manager', 'Research Agent', 'Marketing Agent', 'Operations Agent', 'Finance Agent', 'Quality Reviewer'] }}
      relations={['AI Ant Chat can clarify the initial ambition.', 'Departments can spin up Colony Crew for one-off deliverables.', 'Repeatable operating work can later move into Automation with approvals.']}
      preview={{ title: 'Goal to AI organization workspace', flow: ['Operating goal', 'Departments', 'Agent roles', 'Workspace'] }}
      mvpSlots={[
        { title: 'Enterprise setup state', description: 'Replace with the real setup or building state.', futureContentLabel: 'Goal intake, department analysis, setup progress', aspect: 'square', status: 'Prototype preview' },
        { title: 'Organization grid', description: 'Replace with the real organization grid.', futureContentLabel: 'Director, project manager, specialist branches', aspect: 'square', status: 'Prototype preview' },
        { title: 'Selected agent panel', description: 'Replace with agent detail, model picker, and team conversation workspace.', futureContentLabel: 'Agent responsibility, status, model control, chat', aspect: 'square', status: 'MVP preview' },
      ]}
    />
  );
}

export default OneManEnterprisePage;
