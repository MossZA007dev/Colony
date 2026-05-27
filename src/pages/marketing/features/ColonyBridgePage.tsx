import type { Page } from '../../../types/navigation';
import { FeatureDetailLayout } from './FeatureDetailLayout';

export function ColonyBridgePage({ goTo, currentPage }: { goTo: (page: Page) => void; currentPage: Page }) {
  return (
    <FeatureDetailLayout
      goTo={goTo}
      currentPage={currentPage}
      eyebrow="Colony Bridge · Action layer"
      title="The approved action layer for real-world tools."
      subtitle="When AI Ant needs to actually do something — read a file, draft an email, check a tool — Colony Bridge is the layer that connects safely, prepares the output, and asks for your approval before anything runs."
      accent="amber"
      whatItDoes="Provides AI Ant with controlled access to your files, browser, and connected apps, and gates every real-world action behind a clear approval step."
      whenToUse={[
        'The work requires touching real tools — Drive, Gmail, a browser, the file system.',
        'You need a clear record of what was done, by which mode, with what approval.',
        'You want connected actions without giving AI unsupervised control.',
      ]}
      howItWorks={[
        { title: 'Connect approved tools', copy: 'You decide which sources and apps Colony Bridge can read or act on.' },
        { title: 'Prepare the action', copy: 'AI Ant or an Automation builds the draft (email, file edit, scrape, request).' },
        { title: 'Surface approval', copy: 'The proposed action appears clearly with a Review / Approve choice. Nothing runs without it.' },
        { title: 'Execute and log', copy: 'On approval Colony Bridge runs the action and records what happened.' },
      ]}
      output="An audited, approval-gated real-world action — e.g. a sent email draft, a saved file, a completed scrape."
      outputBullets={['Action prepared by AI Ant', 'Approval surface for the user', 'Audit trail for what ran']}
    />
  );
}

export default ColonyBridgePage;
