import type { Page } from '../../types/navigation';
import { MarketingShell } from './components/MarketingShell';
import { PageHero } from './components/PageHero';

export function TermsPage({ goTo, currentPage }: { goTo: (page: Page) => void; currentPage: Page }) {
  return (
    <MarketingShell goTo={goTo} currentPage={currentPage}>
      <PageHero
        eyebrow="Legal"
        title="Terms of Use"
        subtitle="Full terms will be published before Colony Bridge opens to the public. For pilot users today, the following plain-language summary applies."
      />

      <section className="px-5 pb-24 md:px-8">
        <div className="mx-auto max-w-[820px] rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-8 md:p-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">Draft — pre-launch</p>
          <h2 className="mt-2 text-[22px] font-semibold tracking-tight text-white">Pilot status</h2>
          <ul className="mt-4 space-y-2 text-[14px] leading-relaxed text-white/65">
            <li>• Colony Bridge is an early prototype. Things may change, break, or be temporarily unavailable.</li>
            <li>• Access is granted by invitation. Submitting the waitlist form does not create an account.</li>
            <li>• Pilot users are expected to keep observed behavior private until features ship publicly.</li>
          </ul>
          <h2 className="mt-8 text-[22px] font-semibold tracking-tight text-white">Approval-first</h2>
          <p className="mt-4 text-[14px] leading-relaxed text-white/65">
            Colony Bridge requires explicit user approval before any real-world action (sending an email, editing a file, contacting a service) is executed.
          </p>
          <p className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-[13px] leading-relaxed text-white/52">
            Questions or feedback?{' '}
            <a href="mailto:hello@colonybridge.ai" className="text-[#bcd9ff] underline-offset-2 hover:underline">
              hello@colonybridge.ai
            </a>
          </p>
        </div>
      </section>
    </MarketingShell>
  );
}

export default TermsPage;
