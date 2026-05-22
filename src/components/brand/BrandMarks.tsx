// Single source of truth for brand asset paths. Replace files in
// public/assets/logos/ to swap real brand art (see public/assets/README.md).
export const LOGO_SRC = {
  colonyWhiteNoText: '/assets/logos/Colony white no text.png',
  colonyBlackNoText: '/assets/logos/Colony black no text.png',
  antBlack2: '/assets/logos/ai ant black (2).png',
  antBlack: '/assets/logos/ai ant black.png',
} as const;

export function ColonyLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src={LOGO_SRC.colonyWhiteNoText}
      width={size}
      height={size}
      alt="Colony"
      className={className}
      draggable={false}
    />
  );
}

export function AntMark({ size = 28, tone = 'white', className = '' }: { size?: number; tone?: 'white' | 'dark'; className?: string }) {
  return (
    <img
      src={tone === 'dark' ? LOGO_SRC.antBlack2 : LOGO_SRC.antBlack2}
      width={size}
      height={size}
      alt="AI Ant"
      className={className}
      draggable={false}
    />
  );
}
