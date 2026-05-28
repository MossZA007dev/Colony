import type { Page } from '../../types/navigation';
import { MarketingShell } from './components/MarketingShell';
import { PageHero } from './components/PageHero';
import { AboutUsSection } from '../LandingPage/components/LandingInfographics';
import { ArrowRight } from 'lucide-react';

export function AboutPage({ goTo, currentPage }: { goTo: (page: Page) => void; currentPage: Page }) {
  return (
    <MarketingShell goTo={goTo} currentPage={currentPage}>
      <PageHero
        eyebrow="About"
        title="Built by a small team. Shaped by early users."
        subtitle="Colony Bridge exists because most AI tools answer questions. Real work needs coordination, approval, and a workspace that holds the whole thing together."
        accent="violet"
      />

      <AboutUsSection />

      <section className="px-5 pb-24 md:px-8">
        <div className="mx-auto max-w-[1100px] rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-8 text-center md:p-10">
          <h3 className="text-[22px] font-semibold tracking-tight text-white md:text-[26px]">Become a design partner.</h3>
          <p className="mx-auto mt-3 max-w-[560px] text-[14px] text-white/55">
            Try early workflows, share honest feedback, and help us decide what Colony Bridge should build next.
          </p>
          <button
            onClick={() => goTo('MarketingEarlyAccess')}
            className="lp-btn-primary mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold"
          >
            Request Early Access <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>
    </MarketingShell>
  );
}

export default AboutPage;
