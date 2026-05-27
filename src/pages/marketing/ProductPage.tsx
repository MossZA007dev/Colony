import type { Page } from '../../types/navigation';
import { MarketingShell } from './components/MarketingShell';
import { PageHero } from './components/PageHero';
import {
  SystemMapSection,
  NewComparisonSection,
  ApprovalFirstControlSection,
} from '../LandingPage/components/LandingInfographics';
import { ArrowRight } from 'lucide-react';

export function ProductPage({ goTo, currentPage }: { goTo: (page: Page) => void; currentPage: Page }) {
  return (
    <MarketingShell goTo={goTo} currentPage={currentPage}>
      <PageHero
        eyebrow="Product"
        title={
          <>
            One operating workspace for{' '}
            <span style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic' }} className="font-normal">
              coordinated
            </span>{' '}
            AI work.
          </>
        }
        subtitle="Colony Bridge turns one goal into a routed AI workflow: AI Ant picks the right mode, specialists or automations do the work, and approval-first review keeps you in control."
        ctas={
          <>
            <button onClick={() => goTo('MarketingEarlyAccess')} className="lp-btn-primary rounded-full px-6 py-3 text-[14px] font-semibold">
              Request Early Access
            </button>
            <button onClick={() => goTo('MarketingHowItWorks')} className="lp-btn-secondary rounded-full px-6 py-3 text-[14px] font-medium">
              See How It Works
            </button>
          </>
        }
      />

      <SystemMapSection />
      <ApprovalFirstControlSection />
      <NewComparisonSection />

      <section className="px-5 pb-24 md:px-8">
        <div className="mx-auto max-w-[1100px] rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-8 text-center md:p-12">
          <h3 className="text-[26px] font-semibold tracking-tight text-white md:text-[32px]">Ready to see the prototype?</h3>
          <p className="mx-auto mt-3 max-w-[520px] text-[14px] text-white/55">
            Tell us the task you wish AI could handle better. Selected pilot users get an invitation.
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

export default ProductPage;
