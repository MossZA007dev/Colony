import type { Page } from '../../types/navigation';
import { MarketingShell } from './components/MarketingShell';
import { PageHero } from './components/PageHero';

export function PrivacyPage({ goTo, currentPage }: { goTo: (page: Page) => void; currentPage: Page }) {
  return (
    <MarketingShell goTo={goTo} currentPage={currentPage}>
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        subtitle="A full privacy policy will be published before Colony Bridge opens to the public. For pilot users today, we collect only what you submit in the waitlist form and use it to contact you about the pilot."
      />

      <section className="px-5 pb-24 md:px-8">
        <div className="mx-auto max-w-[820px] rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-8 md:p-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">Draft — pre-launch</p>
          <h2 className="mt-2 text-[22px] font-semibold tracking-tight text-white">What we currently collect</h2>
          <ul className="mt-4 space-y-2 text-[14px] leading-relaxed text-white/65">
            <li>• Name, email, and what you describe in the waitlist form.</li>
            <li>• Whether you confirmed willingness to test an early prototype.</li>
            <li>• Aggregate visit data via standard analytics.</li>
          </ul>
          <h2 className="mt-8 text-[22px] font-semibold tracking-tight text-white">How we use it</h2>
          <ul className="mt-4 space-y-2 text-[14px] leading-relaxed text-white/65">
            <li>• To contact selected pilot users with an invitation.</li>
            <li>• To decide which workflows to build next.</li>
            <li>• We do not sell personal data.</li>
          </ul>
          <p className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-[13px] leading-relaxed text-white/52">
            Questions? Email{' '}
            <a href="mailto:hello@colonybridge.ai" className="text-[#bcd9ff] underline-offset-2 hover:underline">
              hello@colonybridge.ai
            </a>
            . A full GDPR/CCPA-aligned policy will be published before public launch.
          </p>
        </div>
      </section>
    </MarketingShell>
  );
}

export default PrivacyPage;
