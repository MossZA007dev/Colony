import type { Page } from '../../types/navigation';
import { MarketingShell } from './components/MarketingShell';
import { PageHero } from './components/PageHero';
import { FAQSection } from '../LandingPage/components/LandingInfographics';
import { Check, ArrowRight, Sparkles } from 'lucide-react';

type Tier = {
  id: string;
  name: string;
  tagline: string;
  price: string;
  priceNote: string;
  ctaLabel: string;
  highlight?: boolean;
  features: string[];
  audience: string;
};

const TIERS: Tier[] = [
  {
    id: 'pilot',
    name: 'Pilot',
    tagline: 'Free invitation for selected founders and small teams.',
    price: 'By invitation',
    priceNote: 'No card required',
    ctaLabel: 'Request Pilot Access',
    audience: 'Founders & small teams',
    features: [
      'AI Ant goal routing',
      'Colony Crew for complex work',
      'Approval-first review',
      'Direct contact with the team',
      'Helps shape the roadmap',
    ],
  },
  {
    id: 'founders',
    name: 'Founders',
    tagline: 'Everything in Pilot plus deeper automations and connected actions.',
    price: 'Coming soon',
    priceNote: 'Pricing announced before public launch',
    ctaLabel: 'Join the waitlist',
    highlight: true,
    audience: 'Operators going from prototype to product',
    features: [
      'Everything in Pilot',
      'Automation workflows',
      'Colony Bridge approved actions',
      'Workspace deliverables',
      'Priority response',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    tagline: 'For small teams running multiple AI organizations.',
    price: 'Coming soon',
    priceNote: 'Designed alongside our first pilot customers',
    ctaLabel: 'Talk to us',
    audience: 'Small teams & studios',
    features: [
      'Everything in Founders',
      'One-man Enterprise mode',
      'Shared workspaces',
      'Approval history & audit',
      'Custom onboarding',
    ],
  },
];

export function PricingPage({ goTo, currentPage }: { goTo: (page: Page) => void; currentPage: Page }) {
  const goEarly = () => {
    goTo('MarketingEarlyAccess');
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  return (
    <MarketingShell goTo={goTo} currentPage={currentPage}>
      <PageHero
        eyebrow="Pricing"
        title="Designed with our first pilot users."
        subtitle="Colony Bridge is in private prototype. Pricing is intentionally lightweight while we test with selected founders and teams. Public plans will be announced before launch."
        accent="amber"
      />

      <section className="px-5 pb-12 md:px-8">
        <div className="mx-auto grid max-w-[1200px] gap-4 md:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`relative flex flex-col overflow-hidden rounded-[22px] border p-7 transition ${
                tier.highlight
                  ? 'border-[#7db7ff]/35 bg-gradient-to-b from-[#7db7ff]/[0.07] to-[#7db7ff]/[0.02] shadow-[0_18px_60px_rgba(125,183,255,0.10)]'
                  : 'border-white/[0.08] bg-white/[0.025]'
              }`}
            >
              {tier.highlight && (
                <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full border border-[#7db7ff]/30 bg-[#7db7ff]/[0.12] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#bcd9ff]">
                  <Sparkles className="h-3 w-3" />
                  Planned
                </span>
              )}
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">{tier.audience}</p>
              <h3 className="mt-3 text-[22px] font-semibold tracking-tight text-white">{tier.name}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{tier.tagline}</p>

              <div className="mt-6 border-t border-white/[0.06] pt-5">
                <p className="text-[24px] font-semibold tracking-tight text-white">{tier.price}</p>
                <p className="mt-1 text-[12px] text-white/45">{tier.priceNote}</p>
              </div>

              <ul className="mt-6 space-y-2.5">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13px] text-white/72">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={goEarly}
                className={`mt-7 inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-[13px] font-semibold transition ${
                  tier.highlight ? 'lp-btn-primary' : 'lp-btn-secondary'
                }`}
              >
                {tier.ctaLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-[760px] text-center text-[12.5px] leading-relaxed text-white/40">
          Public pricing will be finalized with our first pilot users so it matches how Colony Bridge is actually used. No automatic billing today.
        </p>
      </section>

      <FAQSection />

      <section className="px-5 pb-24 md:px-8">
        <div className="mx-auto max-w-[1100px] rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-8 text-center md:p-10">
          <h3 className="text-[22px] font-semibold tracking-tight text-white md:text-[26px]">Want to influence the public plans?</h3>
          <p className="mx-auto mt-3 max-w-[560px] text-[14px] text-white/55">
            Pilot users help us shape pricing and the feature mix before public launch.
          </p>
          <button
            onClick={goEarly}
            className="lp-btn-primary mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold"
          >
            Request Pilot Access <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>
    </MarketingShell>
  );
}

export default PricingPage;
