import type { Page } from '../../types/navigation';
import { MarketingShell } from './components/MarketingShell';
import { PageHero } from './components/PageHero';
import {
  HowColonyWorksInfographic,
  ApprovalFirstControlSection,
} from '../LandingPage/components/LandingInfographics';
import { ArrowRight } from 'lucide-react';

export function HowItWorksPage({ goTo, currentPage }: { goTo: (page: Page) => void; currentPage: Page }) {
  return (
    <MarketingShell goTo={goTo} currentPage={currentPage}>
      <PageHero
        eyebrow="How It Works"
        title="From one goal to a review-ready deliverable."
        subtitle="You describe what you want. AI Ant picks the right mode. The work runs visibly inside Colony Bridge with approval before anything real happens."
        accent="violet"
      />

      <HowColonyWorksInfographic />
      <ApprovalFirstControlSection />

      <section className="px-5 pb-24 md:px-8">
        <div className="mx-auto grid max-w-[1100px] gap-4 rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-8 md:grid-cols-[1.5fr_auto] md:items-center md:p-10">
          <div>
            <h3 className="text-[22px] font-semibold tracking-tight text-white md:text-[26px]">Want to see it in motion?</h3>
            <p className="mt-2 text-[14px] text-white/55">
              The interactive prototype on the home page walks through each routing scenario.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => goTo('Landing')}
              className="lp-btn-secondary rounded-full px-5 py-2.5 text-[13px] font-semibold"
            >
              Open the prototype
            </button>
            <button
              onClick={() => goTo('MarketingEarlyAccess')}
              className="lp-btn-primary inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[13px] font-semibold"
            >
              Request Early Access <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}

export default HowItWorksPage;
