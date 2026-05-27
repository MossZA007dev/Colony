import type { Page } from '../../types/navigation';
import { MarketingShell } from './components/MarketingShell';
import { PageHero } from './components/PageHero';
import { EarlyAccessSection } from '../LandingPage/LandingPage';

export function EarlyAccessPage({ goTo, currentPage }: { goTo: (page: Page) => void; currentPage: Page }) {
  return (
    <MarketingShell goTo={goTo} currentPage={currentPage}>
      <PageHero
        eyebrow="Pilot Access"
        title="Bring us one task you wish AI could handle better."
        subtitle="We are inviting a small number of founders and teams to test the early Colony Bridge prototype. Tell us what you would like AI Ant to handle, and we will contact selected pilot users with an invitation."
      />
      <EarlyAccessSection goTo={goTo} onWaitlistCountChange={() => undefined} />
    </MarketingShell>
  );
}

export default EarlyAccessPage;
