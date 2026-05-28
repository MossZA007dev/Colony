import type { Page } from '../../../types/navigation';
import { FeatureDetailLayout } from './FeatureDetailLayout';

export function AIAntPage({ goTo, currentPage }: { goTo: (page: Page) => void; currentPage: Page }) {
  return (
    <FeatureDetailLayout
      goTo={goTo}
      currentPage={currentPage}
      eyebrow="AI Ant Chat"
      title="Talk directly. Choose the right depth for the answer."
      subtitle="AI Ant Chat is the fastest way to ask questions, summarize information, draft content, and think through ideas inside Colony Bridge."
      accent="blue"
      status={{ label: 'Testing now', copy: 'Direct chat and goal routing are being tested first. Model preference controls are presented as an interface concept where backend routing is still evolving.' }}
      problem={{ title: 'Quick help should still stay controllable.', copy: 'AI tools are useful for quick help, but users should still control the response style and decide when a conversation needs to become structured work.' }}
      whenToUse={['Quick questions', 'Drafting and rewriting', 'Summarizing a document', 'Brainstorming an idea', 'Clarifying a task before creating a crew or workflow']}
      howItWorks={[
        { title: 'Write a prompt', copy: 'Start in a familiar chat-first composer with a clear goal or question.' },
        { title: 'Choose model preference', copy: 'Keep Auto selected or choose Fast, Balanced, or Deep Reasoning depending on the task.' },
        { title: 'Receive a response', copy: 'AI Ant answers directly with useful structure and next-step suggestions when appropriate.' },
        { title: 'Continue or expand', copy: 'Keep chatting, save useful output, or turn the request into a crew, workflow, or project.' },
      ]}
      scenario={{
        goal: 'Summarize my latest project notes and recommend next actions.',
        setup: 'The user needs quick synthesis before deciding whether the work deserves a larger structure.',
        steps: ['Paste or attach the notes.', 'Choose Balanced or leave the preference on Auto.', 'AI Ant returns a summary and risk list.', 'The user can save the response or expand it into structured work.'],
        finalOutput: 'Chat response with optional next-step suggestions.',
      }}
      output={{ title: 'A direct answer that can become structured work.', copy: 'AI Ant Chat keeps lightweight requests fast, while preserving a path into the broader workspace when the task grows.', bullets: ['Chat response', 'Suggested next actions', 'Option to continue, save, or expand'] }}
      configuration={{ title: 'Choose how deeply AI responds.', copy: 'Model preference should feel simple for normal users and adjustable for deeper planning or analysis.', options: ['Auto', 'Fast', 'Balanced', 'Deep Reasoning'] }}
      relations={['AI Ant Chat can clarify a task before creating Colony Crew.', 'Useful responses can become deliverables inside Projects.', 'If tool access is needed, the work can move into Colony Bridge Operator with approval.']}
      preview={{ title: 'Chat-first input with mode and model preference', flow: ['Prompt', 'Preference', 'AI Ant response', 'Save or expand'] }}
      mvpSlots={[
        { title: 'Chat home screen', description: 'Replace with the real AI Ant chat home screen.', futureContentLabel: 'AI Ant chat landing and composer', aspect: 'square', status: 'Testing now' },
        { title: 'Model selector in composer', description: 'Replace with the real model preference selector once stable.', futureContentLabel: 'Auto, Fast, Balanced, Deep Reasoning controls', aspect: 'square', status: 'Interface concept' },
        { title: 'AI response actions', description: 'Replace with response actions for save, continue, or expand.', futureContentLabel: 'Save, create crew, turn into workflow actions', aspect: 'square', status: 'MVP preview' },
      ]}
    />
  );
}

export default AIAntPage;
