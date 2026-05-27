import React from 'react';
import type { Page } from '../../../types/navigation';
import { MarketingNav } from './MarketingNav';
import { MarketingFooter } from './MarketingFooter';

export function MarketingShell({
  goTo,
  currentPage,
  children,
}: {
  goTo: (page: Page) => void;
  currentPage: Page;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050508] text-white" style={{ fontFamily: "'Inter', 'DM Sans', sans-serif" }}>
      <MarketingNav goTo={goTo} currentPage={currentPage} />
      <main className="pt-[64px] md:pt-[68px]">{children}</main>
      <MarketingFooter goTo={goTo} />
    </div>
  );
}

export default MarketingShell;
