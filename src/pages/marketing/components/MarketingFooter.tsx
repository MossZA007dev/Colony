import React from 'react';
import { Linkedin, Twitter, Github, Mail } from 'lucide-react';
import { ColonyLogo } from '../../../components/brand/BrandMarks';
import type { Page } from '../../../types/navigation';

type FooterLinkItem = {
  label: string;
  page?: Page;
  href?: string;
  onClick?: () => void;
  external?: boolean;
  placeholder?: boolean;
};

export function MarketingFooter({ goTo }: { goTo: (page: Page) => void }) {
  const goToPage = (page: Page) => {
    goTo(page);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const productLinks: FooterLinkItem[] = [
    { label: 'Product', page: 'MarketingProduct' },
    { label: 'How It Works', page: 'MarketingHowItWorks' },
    { label: 'Features', page: 'MarketingFeatures' },
    { label: 'Roadmap', page: 'MarketingRoadmap' },
    { label: 'About', page: 'MarketingAbout' },
  ];

  const accessLinks: FooterLinkItem[] = [
    { label: 'Request Early Access', page: 'MarketingEarlyAccess' },
    { label: 'Pilot Program', page: 'MarketingEarlyAccess' },
    { label: 'Pricing', page: 'MarketingPricing' },
    { label: 'Contact the Team', href: 'mailto:hello@colonybridge.ai', external: true },
    { label: 'Blog', placeholder: true },
  ];

  const legalLinks: FooterLinkItem[] = [
    { label: 'Terms of Use', page: 'MarketingTerms' },
    { label: 'Privacy Policy', page: 'MarketingPrivacy' },
    { label: 'Cookie Policy', placeholder: true },
  ];

  const socials = [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/', icon: Linkedin },
    { label: 'X / Twitter', href: 'https://twitter.com/', icon: Twitter },
    { label: 'GitHub', href: 'https://github.com/', icon: Github },
    { label: 'Email the team', href: 'mailto:hello@colonybridge.ai', icon: Mail },
  ];

  const renderLink = (link: FooterLinkItem) => {
    const baseClasses = 'inline-flex items-center gap-1.5 text-[13px] transition-colors duration-200';

    if (link.placeholder) {
      return (
        <span title="Coming soon" className={`${baseClasses} cursor-default text-white/35`}>
          {link.label}
          <span className="rounded-full border border-white/[0.06] bg-white/[0.025] px-1.5 py-px text-[9px] font-semibold uppercase tracking-[0.12em] text-white/35">
            Soon
          </span>
        </span>
      );
    }

    if (link.page) {
      return (
        <button
          type="button"
          onClick={() => goToPage(link.page!)}
          className={`${baseClasses} text-left text-white/55 hover:text-white`}
        >
          {link.label}
        </button>
      );
    }

    if (link.onClick) {
      return (
        <button type="button" onClick={link.onClick} className={`${baseClasses} text-left text-white/55 hover:text-white`}>
          {link.label}
        </button>
      );
    }

    return (
      <a
        href={link.href}
        target={link.external && !link.href?.startsWith('mailto:') ? '_blank' : undefined}
        rel={link.external && !link.href?.startsWith('mailto:') ? 'noreferrer noopener' : undefined}
        className={`${baseClasses} text-white/55 hover:text-white`}
      >
        {link.label}
      </a>
    );
  };

  return (
    <footer className="relative overflow-hidden border-t border-white/[0.07] bg-[#050508]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-px h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(125,183,255,0.35) 30%, rgba(124,92,252,0.35) 70%, transparent)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[320px] w-[860px] -translate-x-1/2"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(124,92,252,0.10) 0%, rgba(125,183,255,0.07) 35%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <div className="relative mx-auto w-full max-w-[1200px] px-5 pb-10 pt-16 md:px-8 md:pb-12 md:pt-20">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.55fr_1fr_1fr_1fr] lg:gap-12">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <ColonyLogo size={22} />
              <span className="font-heading text-[15px] font-semibold tracking-tight text-white">Colony Bridge</span>
            </div>
            <p className="mt-4 max-w-[340px] text-[13px] leading-relaxed text-white/52">
              AI operating workspace for coordinating goals, agents, workflows, and approvals in one place.
            </p>
            <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-300/85 shadow-[0_0_10px_rgba(167,139,250,0.65)]" />
              Private prototype · Invitation only
            </p>
          </div>

          <FooterColumn heading="Product">{productLinks.map((l) => <li key={l.label}>{renderLink(l)}</li>)}</FooterColumn>
          <FooterColumn heading="Access">{accessLinks.map((l) => <li key={l.label}>{renderLink(l)}</li>)}</FooterColumn>
          <FooterColumn heading="Legal">{legalLinks.map((l) => <li key={l.label}>{renderLink(l)}</li>)}</FooterColumn>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-5 border-t border-white/[0.05] pt-6 sm:flex-row sm:items-center">
          <p className="text-[12px] text-white/40">© 2026 Colony Bridge. All rights reserved.</p>
          <nav aria-label="Social links" className="flex items-center gap-2">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                target={s.href.startsWith('mailto:') ? undefined : '_blank'}
                rel={s.href.startsWith('mailto:') ? undefined : 'noreferrer noopener'}
                className="group grid h-9 w-9 place-items-center rounded-full border border-white/[0.08] bg-white/[0.025] text-white/55 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#7db7ff]/35 hover:bg-[#7db7ff]/[0.08] hover:text-white hover:shadow-[0_0_24px_rgba(125,183,255,0.18)]"
              >
                <s.icon className="h-3.5 w-3.5" strokeWidth={1.75} />
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-white/40">{heading}</p>
      <ul className="mt-4 space-y-2.5">{children}</ul>
    </div>
  );
}

export default MarketingFooter;
