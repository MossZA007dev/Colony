import type { Page } from '../../types/navigation';
import { MarketingShell } from './components/MarketingShell';
import { PageHero } from './components/PageHero';
import { NewRoadmapSection } from '../LandingPage/components/LandingInfographics';
import { ArrowRight } from 'lucide-react';

export function RoadmapPage({ goTo, currentPage }: { goTo: (page: Page) => void; currentPage: Page }) {
  return (
    <MarketingShell goTo={goTo} currentPage={currentPage}>
      <PageHero
        eyebrow="Roadmap"
        title="Start focused. Expand with real feedback."
        subtitle="Where we are today, what is next, and what comes later. Updated as the pilot evolves."
        accent="teal"
      />

      <NewRoadmapSection />

      <section className="px-5 pb-24 md:px-8">
        <div className="mx-auto max-w-[1100px] rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-8 text-center md:p-10">
          <h3 className="text-[22px] font-semibold tracking-tight text-white md:text-[26px]">Want to influence what ships next?</h3>
          <p className="mx-auto mt-3 max-w-[560px] text-[14px] text-white/55">
            Pilot users get a direct line to the team. The roadmap moves with what early users actually need.
          </p>
          <button
            onClick={() => goTo('MarketingEarlyAccess')}
            className="lp-btn-primary mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold"
          >
            Request Pilot Access <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>
    </MarketingShell>
  );
}

export default RoadmapPage;
